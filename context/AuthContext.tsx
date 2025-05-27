// context/AuthContext.tsx
import axios, { AxiosError, AxiosRequestConfig } from 'axios';
import { router, usePathname } from 'expo-router';
import * as SecureStore from 'expo-secure-store';
import React, {
  createContext,
  ReactNode,
  useCallback,
  useContext,
  useEffect,
  useState,
} from 'react';
import { API_BASE_URL, API_ENDPOINTS } from '../constants/api';

// SecureStore에 사용될 키 정의
const TOKEN_KEY = 'my-jwt';
const REFRESH_TOKEN_KEY = 'my-refresh-jwt';

// 토큰 재발급 상태 관리 변수 (모듈 스코프)
let isCurrentlyRefreshing = false;
let refreshSubscribers: ((newAccessToken: string) => void)[] = [];

// 대기 중인 요청들에게 새 토큰을 전달하고 실행시키는 함수
const onTokenRefreshed = (newAccessToken: string) => {
  refreshSubscribers.forEach((callback) => callback(newAccessToken));
  refreshSubscribers = []; // 구독자 목록 초기화
};

// 새 토큰을 기다리는 요청을 등록하는 함수
const addRefreshSubscriber = (callback: (newAccessToken: string) => void) => {
  refreshSubscribers.push(callback);
};

// AuthContext 데이터 타입 정의
interface AuthContextData {
  token: string | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  login: (newToken: string, newRefreshToken?: string, options?: { preventRedirect?: boolean }) => Promise<void>;
  logout: (options?: { suppressRedirect?: boolean }) => Promise<void>;
}

// AuthContext 생성
const AuthContext = createContext<AuthContextData | undefined>(undefined);

// 인터셉터에서 사용할 로그아웃 함수 핸들러 (모듈 스코프)
let globalLogoutHandlerForInterceptor: ((options?: { suppressRedirect?: boolean }) => Promise<void>) | null = null;

export const AuthProvider: React.FC<{children: ReactNode}> = ({ children }) => {
  const [token, setToken] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const pathname = usePathname(); // 현재 경로를 가져오는 훅

  // 로그아웃 처리 함수
  const performLogout = useCallback(async (options?: { suppressRedirect?: boolean }) => {
    const suppressRedirect = options?.suppressRedirect || false;
    const currentAccessToken = await SecureStore.getItemAsync(TOKEN_KEY);
    const currentRefreshToken = await SecureStore.getItemAsync(REFRESH_TOKEN_KEY);

    // 이미 로그아웃 상태이거나 토큰이 없는 경우 중복 처리 방지
    if (!currentAccessToken && !currentRefreshToken && !token) {
        console.log('AuthContext: No tokens found, logout process likely already completed or not needed.');
        if (!suppressRedirect && pathname !== '/login') {
            router.replace('/login');
        }
        setIsLoading(false);
        return;
    }

    console.log('AuthContext: Executing logout...');
    setIsLoading(true);
    try {
      await SecureStore.deleteItemAsync(TOKEN_KEY);
      await SecureStore.deleteItemAsync(REFRESH_TOKEN_KEY);
      setToken(null); // Context 상태 업데이트
      delete axios.defaults.headers.common['Authorization']; // Axios 헤더에서 토큰 제거
      console.log('AuthContext: Tokens deleted, user logged out.');
      if (!suppressRedirect) {
        console.log('AuthContext: Redirecting to login.');
        router.replace('/login'); // 로그인 화면으로 리다이렉트
      }
    } catch (e) {
      console.error('AuthContext: Failed to execute logout', e);
      // 실패 시에도 토큰 상태와 헤더는 정리
      setToken(null);
      delete axios.defaults.headers.common['Authorization'];
    } finally {
      setIsLoading(false); // 로딩 상태 해제
    }
  }, [token, pathname]); // token과 pathname에 의존

  // 로그인 처리 함수 (토큰 저장 및 상태 업데이트)
  const performLogin = useCallback(async (newAccessToken: string, newRefreshToken?: string, options?: { preventRedirect?: boolean }) => {
    setIsLoading(true);
    try {
      await SecureStore.setItemAsync(TOKEN_KEY, newAccessToken);
      if (newRefreshToken) {
        await SecureStore.setItemAsync(REFRESH_TOKEN_KEY, newRefreshToken);
        console.log('AuthContext: Access Token and Refresh Token saved.');
      } else {
        console.log('AuthContext: Access Token saved. Refresh Token was not explicitly updated.');
      }
      setToken(newAccessToken); // Context 상태 업데이트
      axios.defaults.headers.common['Authorization'] = `Bearer ${newAccessToken}`; // Axios 헤더 설정
      console.log('AuthContext: Token updated. Axios header set.');

      if (!options?.preventRedirect) { // preventRedirect 옵션이 true가 아니면 리다이렉트
        router.replace('/(tabs)'); // 메인 화면(탭)으로 리다이렉트
      }
    } catch (e) {
      console.error('AuthContext: Failed to save tokens or login', e);
    } finally {
      setIsLoading(false); // 로딩 상태 해제
    }
  }, []); // 이 함수는 내부 상태 setter에만 의존하므로 의존성 배열 비워도 무방

  // 앱 초기 실행 시 저장된 토큰 로드 (마운트 시 1회 실행)
  useEffect(() => {
    const loadTokenFromStorage = async () => {
      console.log('AuthContext: loadTokenFromStorage attempting to run.');
      setIsLoading(true);
      try {
        const storedAccessToken = await SecureStore.getItemAsync(TOKEN_KEY);
        const storedRefreshToken = await SecureStore.getItemAsync(REFRESH_TOKEN_KEY);

        if (storedAccessToken && storedRefreshToken) {
          setToken(storedAccessToken);
          axios.defaults.headers.common['Authorization'] = `Bearer ${storedAccessToken}`;
          console.log('AuthContext: Access Token and Refresh Token loaded on init. Axios header set.');
        } else if (storedAccessToken && !storedRefreshToken) {
          console.warn('AuthContext: Access Token found on init, but Refresh Token is missing. Logging out.');
          await performLogout({ suppressRedirect: true }); // 리다이렉트 없이 로그아웃 처리
        } else {
          console.log('AuthContext: No Access Token found on init. Ensuring logout state.');
          delete axios.defaults.headers.common['Authorization'];
          setToken(null);
        }
      } catch (e) {
        console.error('AuthContext: Failed to load tokens from SecureStore on init, attempting to clear all tokens.', e);
        try {
            await SecureStore.deleteItemAsync(TOKEN_KEY);
            await SecureStore.deleteItemAsync(REFRESH_TOKEN_KEY);
        } catch (secureStoreError) {
            console.error('AuthContext: Failed to clear tokens during error handling on init.', secureStoreError);
        }
        setToken(null);
        delete axios.defaults.headers.common['Authorization'];
      } finally {
        setIsLoading(false);
        console.log('AuthContext: loadTokenFromStorage finished.');
      }
    };

    loadTokenFromStorage();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []); // 의존성 배열을 빈 배열로 설정하여 마운트 시에만 실행

  // Axios 인터셉터 설정 (토큰 자동 재발급 로직)
  useEffect(() => {
    globalLogoutHandlerForInterceptor = performLogout; // 인터셉터용 로그아웃 함수 연결

    const responseInterceptor = axios.interceptors.response.use(
      (response) => response, // 성공 응답은 그대로 통과
      async (error: AxiosError) => { // 에러 응답 처리
        const originalRequest = error.config as AxiosRequestConfig & { _retry?: boolean };

        // 401 에러이고, 재발급 요청 자체가 아니며, 이미 재시도한 요청이 아닐 경우
        if (error.response?.status === 401 && originalRequest && originalRequest.url !== `${API_BASE_URL}${API_ENDPOINTS.REFRESH_TOKEN}` && !originalRequest._retry) {
          
          if (isCurrentlyRefreshing) { // 이미 다른 요청이 토큰 재발급 중인 경우
            return new Promise((resolve) => {
              addRefreshSubscriber((newAccessToken: string) => { // 재발급 완료 후 실행될 콜백 등록
                if (originalRequest.headers) {
                  originalRequest.headers['Authorization'] = `Bearer ${newAccessToken}`;
                }
                resolve(axios(originalRequest)); // 원래 요청 재시도
              });
            });
          }

          originalRequest._retry = true; // 재시도 플래그 설정 (무한 재발급 방지)
          isCurrentlyRefreshing = true;  // 토큰 재발급 시작 플래그

          try {
            const storedRefreshToken = await SecureStore.getItemAsync(REFRESH_TOKEN_KEY);
            if (!storedRefreshToken) { // 저장된 Refresh Token이 없으면 로그아웃
              if (globalLogoutHandlerForInterceptor) await globalLogoutHandlerForInterceptor({ suppressRedirect: true });
              isCurrentlyRefreshing = false;
              return Promise.reject(error);
            }

            console.log('Interceptor: Attempting to refresh token.');
            // 토큰 재발급 API 호출
            const refreshResponse = await axios.post(
              `${API_BASE_URL}${API_ENDPOINTS.REFRESH_TOKEN}`,
              { refreshToken: storedRefreshToken },
              { headers: { 'Authorization': '' } } // 재발급 요청 시에는 만료된 토큰 전송 방지
            );

            const newAccessToken = refreshResponse.data.accessToken;
            const newRefreshTokenFromResponse = refreshResponse.data.refreshToken; // 백엔드가 새 Refresh Token을 반환할 수 있음

            if (!newAccessToken) { // 새 Access Token이 없으면 로그아웃
                if (globalLogoutHandlerForInterceptor) await globalLogoutHandlerForInterceptor({ suppressRedirect: true });
                isCurrentlyRefreshing = false;
                return Promise.reject(error);
            }
            
            // 새 토큰 정보로 Context와 저장소 업데이트 (리다이렉트 없이)
            await performLogin(newAccessToken, newRefreshTokenFromResponse, { preventRedirect: true });
            
            console.log('Interceptor: Token refreshed successfully.');
            isCurrentlyRefreshing = false; // 토큰 재발급 완료 플래그
            onTokenRefreshed(newAccessToken); // 대기 중이던 요청들에게 새 토큰 전파

            // 원래 실패했던 요청을 새 토큰으로 재시도
            if (originalRequest.headers) {
              originalRequest.headers['Authorization'] = `Bearer ${newAccessToken}`;
            }
            return axios(originalRequest);

          } catch (refreshError: any) { // 토큰 재발급 실패 시
            console.error('Interceptor: Token refresh API call failed.', refreshError.response?.data || refreshError.message);
            if (globalLogoutHandlerForInterceptor) await globalLogoutHandlerForInterceptor({ suppressRedirect: true }); // 로그아웃 처리
            isCurrentlyRefreshing = false;
            onTokenRefreshed(''); // 실패했음을 알림 (또는 오류 전파)
            return Promise.reject(error); 
          }
        } else if (error.response?.status === 403) { // 403 Forbidden 에러 처리
            console.warn(`Axios Interceptor: Status 403 (Forbidden) for ${originalRequest?.url}. User may lack permissions.`);
            // 필요시 추가적인 사용자 알림 또는 처리 로직
        }

        return Promise.reject(error); // 그 외 에러는 그대로 반환
      }
    );

    // 컴포넌트 언마운트 시 인터셉터 제거
    return () => {
      axios.interceptors.response.eject(responseInterceptor);
      globalLogoutHandlerForInterceptor = null;
    };
  }, [performLogin, performLogout]); // performLogin, performLogout 함수가 변경될 때 인터셉터 재설정

  // AuthContext.Provider로 하위 컴포넌트에 값들 제공
  return (
    <AuthContext.Provider value={{ token, isAuthenticated: !!token, isLoading, login: performLogin, logout: performLogout }}>
      {children}
    </AuthContext.Provider>
  );
};

// useAuth 커스텀 훅
export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider. Make sure AuthProvider wraps your app.');
  }
  return context;
};

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
// Alert를 사용하기 위해 react-native에서 import 합니다.
import { Alert } from 'react-native'; // <--- Alert 추가
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
      setToken(null);
      delete axios.defaults.headers.common['Authorization'];
      console.log('AuthContext: Tokens deleted, user logged out.');
      if (!suppressRedirect) {
        console.log('AuthContext: Redirecting to login.');
        router.replace('/login');
      }
    } catch (e) {
      console.error('AuthContext: Failed to execute logout', e);
      setToken(null);
      delete axios.defaults.headers.common['Authorization'];
    } finally {
      setIsLoading(false);
    }
  }, [token, pathname, router, setIsLoading, setToken]);

  // 로그인 처리 함수
  const performLogin = useCallback(async (newAccessToken: string, newRefreshToken?: string, options?: { preventRedirect?: boolean }) => {
    console.log('DEBUG: performLogin called with newAccessToken:', newAccessToken);
    console.log('DEBUG: performLogin called with newRefreshToken:', newRefreshToken);

    setIsLoading(true);
    try {
      await SecureStore.setItemAsync(TOKEN_KEY, newAccessToken);
      if (newRefreshToken && typeof newRefreshToken === 'string' && newRefreshToken.length > 0) {
        await SecureStore.setItemAsync(REFRESH_TOKEN_KEY, newRefreshToken);
        console.log('AuthContext: Access Token and Refresh Token saved.');
      } else {
        console.log('AuthContext: Access Token saved. Refresh Token was not explicitly updated or was invalid.');
        if (newRefreshToken === '') console.warn('AuthContext: Received an empty string for newRefreshToken.');
        if (newRefreshToken === null) console.warn('AuthContext: Received null for newRefreshToken.');
        if (newRefreshToken === undefined) console.warn('AuthContext: Received undefined for newRefreshToken.');
      }
      setToken(newAccessToken);
      axios.defaults.headers.common['Authorization'] = `Bearer ${newAccessToken}`;
      console.log('AuthContext: Token updated. Axios header set.');

      if (!options?.preventRedirect) {
        router.replace('/(tabs)');
      }
    } catch (e) {
      console.error('AuthContext: Failed to save tokens or login', e);
    } finally {
      setIsLoading(false);
    }
  }, [setIsLoading, setToken, router]);

  // 앱 초기 실행 시 저장된 토큰 로드
  useEffect(() => {
    const loadTokenFromStorage = async () => {
      console.log('AuthContext: loadTokenFromStorage attempting to run.');
      setIsLoading(true);
      try {
        const storedAccessToken = await SecureStore.getItemAsync(TOKEN_KEY);
        const storedRefreshToken = await SecureStore.getItemAsync(REFRESH_TOKEN_KEY);

        console.log('AuthContext Init Load - storedAccessToken:', storedAccessToken);
        console.log('AuthContext Init Load - storedRefreshToken:', storedRefreshToken);

        if (storedAccessToken && storedRefreshToken) {
          setToken(storedAccessToken);
          axios.defaults.headers.common['Authorization'] = `Bearer ${storedAccessToken}`;
          console.log('AuthContext: Access Token and Refresh Token loaded on init. Axios header set.');
        } else if (storedAccessToken && !storedRefreshToken) {
          console.warn('AuthContext: Access Token found on init, but Refresh Token is missing. Logging out and clearing tokens.');
          setToken(null);
          delete axios.defaults.headers.common['Authorization'];
          await SecureStore.deleteItemAsync(TOKEN_KEY);
          await SecureStore.deleteItemAsync(REFRESH_TOKEN_KEY);
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
  }, []); // 의존성 배열을 빈 배열로 유지하여 마운트 시 1회 실행

  // Axios 인터셉터 설정
  useEffect(() => {
    globalLogoutHandlerForInterceptor = performLogout;

    const responseInterceptor = axios.interceptors.response.use(
      (response) => response,
      async (error: AxiosError) => {
        const originalRequest = error.config as AxiosRequestConfig & { _retry?: boolean };

        if (error.response?.status === 401 && originalRequest && originalRequest.url !== `${API_BASE_URL}${API_ENDPOINTS.REFRESH_TOKEN}` && !originalRequest._retry) {
          if (isCurrentlyRefreshing) {
            return new Promise((resolve) => {
              addRefreshSubscriber((newAccessToken: string) => {
                if (originalRequest.headers) {
                  originalRequest.headers['Authorization'] = `Bearer ${newAccessToken}`;
                }
                resolve(axios(originalRequest));
              });
            });
          }

          originalRequest._retry = true;
          isCurrentlyRefreshing = true;

          try {
            const storedRefreshToken = await SecureStore.getItemAsync(REFRESH_TOKEN_KEY);
            if (!storedRefreshToken) {
              console.warn('Interceptor: No refresh token found. Logging out.');
              // ▼▼▼ Alert 추가 및 로그아웃 처리 (사용자 확인 후) ▼▼▼
              Alert.alert(
                "세션 오류",
                "로그인 정보가 유효하지 않습니다. 다시 로그인해주세요.",
                [
                  {
                    text: "확인",
                    onPress: async () => {
                      if (globalLogoutHandlerForInterceptor) {
                        await globalLogoutHandlerForInterceptor({ suppressRedirect: false });
                      }
                    }
                  }
                ],
                { cancelable: false }
              );
              // ▲▲▲ Alert 추가 ▲▲▲
              isCurrentlyRefreshing = false;
              return Promise.reject(error);
            }

            console.log('Interceptor: Attempting to refresh token.');
            const refreshResponse = await axios.post(
              `${API_BASE_URL}${API_ENDPOINTS.REFRESH_TOKEN}`,
              { refreshToken: storedRefreshToken },
              { headers: { 'Authorization': '' } }
            );

            const newAccessToken = refreshResponse.data.accessToken;
            const newRefreshTokenFromResponse = refreshResponse.data.refreshToken;

            if (!newAccessToken) {
              console.warn('Interceptor: Failed to get new access token from refresh response. Logging out.');
              // ▼▼▼ Alert 추가 및 로그아웃 처리 (사용자 확인 후) ▼▼▼
              Alert.alert(
                "세션 갱신 실패",
                "세션 갱신에 실패했습니다. 다시 로그인해주세요.",
                [
                  {
                    text: "확인",
                    onPress: async () => {
                      if (globalLogoutHandlerForInterceptor) {
                        await globalLogoutHandlerForInterceptor({ suppressRedirect: false });
                      }
                    }
                  }
                ],
                { cancelable: false }
              );
              // ▲▲▲ Alert 추가 ▲▲▲
              isCurrentlyRefreshing = false;
              return Promise.reject(error);
            }

            await performLogin(newAccessToken, newRefreshTokenFromResponse, { preventRedirect: true });

            console.log('Interceptor: Token refreshed successfully.');
            isCurrentlyRefreshing = false;
            onTokenRefreshed(newAccessToken);

            if (originalRequest.headers) {
              originalRequest.headers['Authorization'] = `Bearer ${newAccessToken}`;
            }
            return axios(originalRequest);

          } catch (refreshError: any) {
            console.error('Interceptor: Token refresh API call failed.', refreshError.response?.data || refreshError.message);
            // ▼▼▼ Alert 추가 및 로그아웃 처리 (사용자 확인 후) ▼▼▼
            Alert.alert(
              "세션 만료",
              "세션이 만료되었습니다. 다시 로그인해주세요.",
              [
                {
                  text: "확인",
                  onPress: async () => {
                    if (globalLogoutHandlerForInterceptor) {
                      await globalLogoutHandlerForInterceptor({ suppressRedirect: false });
                    }
                  }
                }
              ],
              { cancelable: false }
            );
            // ▲▲▲ Alert 추가 ▲▲▲
            isCurrentlyRefreshing = false;
            onTokenRefreshed('');
            return Promise.reject(error);
          }
        } else if (error.response?.status === 403) {
            console.warn(`Axios Interceptor: Status 403 (Forbidden) for ${originalRequest?.url}. User may lack permissions.`);
        }

        return Promise.reject(error);
      }
    );

    return () => {
      axios.interceptors.response.eject(responseInterceptor);
      globalLogoutHandlerForInterceptor = null;
    };
  }, [performLogin, performLogout]);

  return (
    <AuthContext.Provider value={{ token, isAuthenticated: !!token, isLoading, login: performLogin, logout: performLogout }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider. Make sure AuthProvider wraps your app.');
  }
  return context;
};
// context/AuthContext.tsx
import axios, { AxiosError } from 'axios';
import { router } from 'expo-router';
import * as SecureStore from 'expo-secure-store';
import React, {
  createContext,
  ReactNode,
  useCallback,
  useContext,
  useEffect,
  useState,
} from 'react';
// API_BASE_URL, API_ENDPOINTS를 AuthContext에서도 사용하게 될 것이므로 import 합니다.
import { API_BASE_URL, API_ENDPOINTS } from '../constants/api';

const TOKEN_KEY = 'my-jwt'; // Access Token용
const REFRESH_TOKEN_KEY = 'my-refresh-jwt'; // Refresh Token을 위한 새 키

interface AuthContextData {
  token: string | null; // Access Token
  isAuthenticated: boolean;
  isLoading: boolean;
  login: (newToken: string, newRefreshToken?: string) => Promise<void>; // login 함수 타입 (이전 단계에서 수정 완료)
  logout: () => Promise<void>;
}

const AuthContext = createContext<AuthContextData | undefined>(undefined);

let globalLogoutHandler: (() => Promise<void>) | null = null;

// --- Axios 인터셉터 로직 (이 부분은 다음 단계에서 대대적으로 수정할 예정입니다) ---
axios.interceptors.response.use(
  (response) => {
    return response;
  },
  async (error: AxiosError) => {
    const originalRequest = error.config;
    console.log('Axios Interceptor: Error received from API', originalRequest?.url, error.response?.status);

    if (error.response) {
      const { status } = error.response;
      // 401 오류이고, 리프레시 토큰 요청 자체가 아니며, 아직 재시도 안 한 요청일 때
      // (다음 단계에서 이 조건에 리프레시 로직이 들어갑니다)
      if (status === 401 && originalRequest?.url !== `${API_BASE_URL}${API_ENDPOINTS.REFRESH_TOKEN}` && !(originalRequest as any)?._retry) {
        if (axios.defaults.headers.common['Authorization'] && globalLogoutHandler) {
          console.warn(`Axios Interceptor (기존 로직): Status ${status} for ${originalRequest?.url}. Attempting to logout.`);
          await globalLogoutHandler(); // 현재는 바로 로그아웃 (다음 단계에서 수정)
        } else {
          console.log('Axios Interceptor: Cannot auto-logout (no auth header or no logout handler).');
        }
      } else if (status === 403) {
        if (axios.defaults.headers.common['Authorization'] && globalLogoutHandler) {
            console.warn(`Axios Interceptor: Status ${status} detected. Attempting to logout.`);
            await globalLogoutHandler();
        }
      }
    }
    return Promise.reject(error);
  }
);
// --- 여기까지 Axios 인터셉터 ---


export const AuthProvider: React.FC<{children: ReactNode}> = ({ children }) => {
  const [token, setToken] = useState<string | null>(null); // Access Token 상태
  const [isLoading, setIsLoading] = useState(true);

  const executeLogout = useCallback(async (options?: { suppressRedirect?: boolean }) => { // 옵션 파라미터 추가
    const suppressRedirect = options?.suppressRedirect || false;

    // 이미 로그아웃 처리 중이거나 토큰이 없는 경우 중복 실행 방지 강화
    const currentAccessToken = await SecureStore.getItemAsync(TOKEN_KEY);
    const currentRefreshToken = await SecureStore.getItemAsync(REFRESH_TOKEN_KEY);
    if (!currentAccessToken && !currentRefreshToken && !token) {
        console.log('AuthContext: No tokens found, logout process likely already completed or not needed.');
        if (!suppressRedirect && router.pathname !== '/login') { // 이미 로그인 화면이 아니면 이동 (무한 루프 방지)
            router.replace('/login');
        }
        setIsLoading(false); // 로딩 상태는 확실히 해제
        return;
    }

    console.log('AuthContext: Executing logout...');
    setIsLoading(true);
    try {
      await SecureStore.deleteItemAsync(TOKEN_KEY);
      await SecureStore.deleteItemAsync(REFRESH_TOKEN_KEY); // <<< Refresh Token도 삭제
      setToken(null);
      delete axios.defaults.headers.common['Authorization'];
      console.log('AuthContext: Tokens deleted, user logged out.');
      if (!suppressRedirect) {
        console.log('AuthContext: Redirecting to login.');
        router.replace('/login');
      }
    } catch (e) {
      console.error('AuthContext: Failed to execute logout', e);
      // 실패 시에도 토큰 상태와 헤더는 정리
      setToken(null);
      delete axios.defaults.headers.common['Authorization'];
    } finally {
      // 로그아웃 최종 단계에서 로딩 상태 해제
      // 이 부분은 router.replace 이후에도 호출될 수 있도록 주의 (비동기 특성)
      // 좀 더 확실한 시점에 false로 설정하거나, _layout.tsx의 isLoading과 연동 필요
      // 여기서는 즉시 false로 설정
      setIsLoading(false);
    }
  }, [token, setIsLoading, setToken]); // isLoading은 executeLogout 내부에서 관리하므로 의존성에서 제거해도 될 수 있으나, 안전하게 포함

  useEffect(() => {
    globalLogoutHandler = executeLogout;
    return () => {
      globalLogoutHandler = null;
    };
  }, [executeLogout]);

  useEffect(() => {
    const loadTokenFromStorage = async () => {
      setIsLoading(true);
      try {
        const storedAccessToken = await SecureStore.getItemAsync(TOKEN_KEY);
        const storedRefreshToken = await SecureStore.getItemAsync(REFRESH_TOKEN_KEY);

        if (storedAccessToken && storedRefreshToken) { // 두 토큰이 모두 있어야 유효한 세션으로 간주
          setToken(storedAccessToken);
          axios.defaults.headers.common['Authorization'] = `Bearer ${storedAccessToken}`;
          console.log('AuthContext: Access Token and Refresh Token loaded. Axios header set.');
        } else if (storedAccessToken && !storedRefreshToken) {
          // Access Token은 있지만 Refresh Token이 없는 비정상적인 상황
          console.warn('AuthContext: Access Token found, but Refresh Token is missing. Logging out.');
          await executeLogout({ suppressRedirect: true }); // 화면 깜빡임 방지를 위해 리다이렉트 억제하고, 아래 로직에서 처리
        } else {
          // Access Token이 없는 경우 (Refresh Token 유무와 관계없이 로그인 필요)
          console.log('AuthContext: No Access Token found. Ensuring logout state.');
          await SecureStore.deleteItemAsync(REFRESH_TOKEN_KEY); // 만약을 위해 Refresh Token도 삭제
          delete axios.defaults.headers.common['Authorization'];
          setToken(null); // 명시적으로 토큰 상태 null
        }
      } catch (e) {
        console.error('AuthContext: Failed to load tokens from SecureStore, attempting to clear all tokens.', e);
        try {
            await SecureStore.deleteItemAsync(TOKEN_KEY);
            await SecureStore.deleteItemAsync(REFRESH_TOKEN_KEY);
        } catch (secureStoreError) {
            console.error('AuthContext: Failed to clear tokens during error handling.', secureStoreError);
        }
        setToken(null);
        delete axios.defaults.headers.common['Authorization'];
      } finally {
        setIsLoading(false);
      }
    };
    loadTokenFromStorage();
  }, [executeLogout]); // executeLogout을 의존성 배열에 추가

  // login 함수는 이전 단계에서 newRefreshToken을 받도록 수정 완료됨
  const login = async (newAccessToken: string, newRefreshToken?: string) => {
    setIsLoading(true);
    try {
      await SecureStore.setItemAsync(TOKEN_KEY, newAccessToken);
      if (newRefreshToken) {
        await SecureStore.setItemAsync(REFRESH_TOKEN_KEY, newRefreshToken);
        console.log('AuthContext: Access Token and Refresh Token saved.');
      } else {
        console.warn('AuthContext: Access Token saved. Refresh Token was not provided during login. This might lead to issues.');
      }
      setToken(newAccessToken);
      axios.defaults.headers.common['Authorization'] = `Bearer ${newAccessToken}`;
      
      setIsLoading(false); 
      router.replace('/(tabs)');
    } catch (e) {
      console.error('AuthContext: Failed to save tokens or login', e);
      setIsLoading(false);
    }
  };

  return (
    <AuthContext.Provider value={{ token, isAuthenticated: !!token, isLoading, login, logout: executeLogout }}>
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

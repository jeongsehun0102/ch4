// context/AuthContext.tsx
import axios from 'axios'; // axios 인스턴스 기본 헤더 설정용
import { router } from 'expo-router'; // Expo Router 사용 시
import * as SecureStore from 'expo-secure-store';
import React, { createContext, ReactNode, useContext, useEffect, useState } from 'react';

const TOKEN_KEY = 'my-jwt'; // 토큰 저장 시 사용할 키

interface AuthContextData {
  token: string | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  login: (newToken: string) => Promise<void>;
  logout: () => Promise<void>;
  // 필요하다면 user 정보도 추가: user: UserType | null;
}

// AuthContext 생성. 초기값은 undefined.
const AuthContext = createContext<AuthContextData | undefined>(undefined);

// AuthProvider 컴포넌트 정의
export const AuthProvider: React.FC<{children: ReactNode}> = ({ children }) => {
  const [token, setToken] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true); // 초기 로딩 상태 true

  useEffect(() => {
    // 앱 시작 시 SecureStore에서 토큰 로드 시도
    const loadTokenFromStorage = async () => {
      try {
        const storedToken = await SecureStore.getItemAsync(TOKEN_KEY);
        if (storedToken) {
          setToken(storedToken);
          // Axios 기본 헤더에 토큰 설정 (앱 전체 API 호출에 적용)
          axios.defaults.headers.common['Authorization'] = `Bearer ${storedToken}`;
          console.log('AuthContext: Token loaded from SecureStore');
        }
      } catch (e) {
        console.error('AuthContext: Failed to load token from SecureStore', e);
      } finally {
        setIsLoading(false); // 토큰 로드 시도 후 로딩 상태 false로 변경
      }
    };
    loadTokenFromStorage();
  }, []);

  const login = async (newToken: string) => {
    setIsLoading(true);
    try {
      await SecureStore.setItemAsync(TOKEN_KEY, newToken);
      setToken(newToken);
      axios.defaults.headers.common['Authorization'] = `Bearer ${newToken}`;
      console.log('AuthContext: Token saved and user logged in');
      router.replace('/(tabs)'); // 로그인 성공 후 메인 화면으로 이동
    } catch (e) {
      console.error('AuthContext: Failed to save token or login', e);
    } finally {
      setIsLoading(false);
    }
  };

  const logout = async () => {
    setIsLoading(true);
    try {
      await SecureStore.deleteItemAsync(TOKEN_KEY);
      setToken(null);
      delete axios.defaults.headers.common['Authorization'];
      console.log('AuthContext: Token deleted and user logged out');
      router.replace('/login'); // 로그아웃 후 로그인 화면으로 이동
    } catch (e) {
      console.error('AuthContext: Failed to delete token or logout', e);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <AuthContext.Provider value={{ token, isAuthenticated: !!token, isLoading, login, logout }}>
      {children}
    </AuthContext.Provider>
  );
};

// useAuth 커스텀 Hook (AuthProvider 내부에서만 사용 가능)
export const useAuth = () => { // <<< 'export' 키워드 확인!
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider. Make sure AuthProvider wraps your app.');
  }
  return context;
};

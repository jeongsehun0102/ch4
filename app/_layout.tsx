// app/_layout.tsx
import { DarkTheme, DefaultTheme, ThemeProvider } from '@react-navigation/native';
import { useFonts } from 'expo-font';
import { SplashScreen as ExpoSplashScreen, router, Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import React, { useCallback, useEffect } from 'react'; // useState, useCallback 추가 (필요시)
import { View } from 'react-native'; // View import 추가
import 'react-native-reanimated';

import { AuthProvider, useAuth } from '@/context/AuthContext'; // AuthProvider와 useAuth import
import { useColorScheme } from '@/hooks/useColorScheme';

// 스플래시 화면 자동 숨기기 방지
ExpoSplashScreen.preventAutoHideAsync();

// RootNavigation 컴포넌트: useAuth를 사용하기 위해 AuthProvider 내부에 위치
function RootNavigation() {
  const { isAuthenticated, isLoading, token } = useAuth(); // AuthContext 사용

  const onLayoutRootView = useCallback(async () => {
    if (!isLoading) { // AuthContext의 로딩(토큰 확인)이 완료되면
      await ExpoSplashScreen.hideAsync(); // 스플래시 화면 숨기기
    }
  }, [isLoading]);

  useEffect(() => {
    if (!isLoading) {
      if (isAuthenticated) {
        console.log('RootNavigation: User is authenticated, navigating to (tabs). Token:', token);
        router.replace('/(tabs)');
      } else {
        console.log('RootNavigation: User is not authenticated, navigating to /login.');
        router.replace('/login');
      }
    }
  }, [isAuthenticated, isLoading, token]);

  // isLoading 중이거나, 아직 인증 상태에 따른 리디렉션이 완료되지 않았다면 null 반환 (또는 로딩 스피너)
  // 이렇게 하면 Stack 네비게이터가 조기에 렌더링되어 발생하는 문제를 피할 수 있음
  if (isLoading) {
    return null; // 또는 <CustomLoadingIndicator />;
  }

  // 인증 상태가 확정된 후에 Stack 네비게이터를 렌더링
  // 또는, 초기에 모든 스크린을 정의하고 useEffect에서 replace로 보내는 현재 방식도 유효
  return (
    <View style={{ flex: 1 }} onLayout={onLayoutRootView}>
      <Stack screenOptions={{ headerShown: false }}>
        <Stack.Screen name="login" />
        <Stack.Screen name="signup" />
        <Stack.Screen name="(tabs)" />
        <Stack.Screen name="+not-found" />
      </Stack>
    </View>
  );
}

export default function RootLayout() {
  const colorScheme = useColorScheme();
  const [loaded, error] = useFonts({ // font 로딩 에러도 받을 수 있게 수정
    SpaceMono: require('../assets/fonts/SpaceMono-Regular.ttf'),
    // 다른 폰트가 있다면 여기에 추가
  });

  // 폰트 로딩 에러 처리 (선택 사항)
  useEffect(() => {
    if (error) {
      console.error("Font loading error:", error);
      // 폰트 로딩 실패 시에도 스플래시를 숨기거나, 에러 화면을 보여줄 수 있음
      // ExpoSplashScreen.hideAsync();
    }
  }, [error]);
  
  // 폰트가 로드될 때까지 기다림 (AuthProvider의 isLoading과 별개로 처리)
  if (!loaded && !error) { // 로드 중이고 에러도 아직 없다면
    return null; // 스플래시 화면이 계속 보이도록 함 (preventAutoHideAsync 때문에)
  }

  // 폰트 로딩이 완료되었거나, 로딩 중 에러가 발생했다면 AuthProvider와 앱 렌더링 시작
  return (
    <AuthProvider> {/* <<<--- AuthProvider로 앱의 루트를 감싸줍니다! */}
      <ThemeProvider value={colorScheme === 'dark' ? DarkTheme : DefaultTheme}>
        <RootNavigation />
        <StatusBar style="auto" />
      </ThemeProvider>
    </AuthProvider>
  );
}
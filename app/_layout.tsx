// app/_layout.tsx
import { DarkTheme, DefaultTheme, ThemeProvider } from '@react-navigation/native';
import { useFonts } from 'expo-font';
import { SplashScreen as ExpoSplashScreen, router, Stack } from 'expo-router'; // router 임포트 확인
import { StatusBar } from 'expo-status-bar';
import React, { useCallback, useEffect } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import 'react-native-reanimated';

import { AuthProvider, useAuth } from '@/context/AuthContext';
import { useColorScheme } from '@/hooks/useColorScheme';

ExpoSplashScreen.preventAutoHideAsync();

const styles = StyleSheet.create({
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#ffffff',
  },
  loadingText: {
    fontSize: 16,
    marginTop: 10,
    color: '#000000',
  }
});

function RootNavigation() {
  const { isAuthenticated, isLoading, token } = useAuth();

  const onLayoutRootView = useCallback(async () => {
    if (!isLoading) {
      console.log('RootNavigation: onLayoutRootView - Auth loading complete, hiding splash screen.');
      await ExpoSplashScreen.hideAsync();
    }
  }, [isLoading]);

  useEffect(() => {
    if (!isLoading) {
      // setTimeout을 사용하여 네비게이션 액션을 다음 이벤트 루프 틱으로 지연
      const timerId = setTimeout(() => {
        if (isAuthenticated) {
          console.log('RootNavigation (useEffect): User is authenticated, navigating to (tabs). Token:', token);
          // 이전 스택을 정리하고 replace (선택적이지만 초기 라우팅에 도움될 수 있음)
          // if (router.canGoBack()) {
          //   router.dismissAll();
          // }
          router.replace('/(tabs)');
        } else {
          console.log('RootNavigation (useEffect): User is not authenticated, navigating to /login.');
          // if (router.canGoBack()) {
          //   router.dismissAll();
          // }
          router.replace('/login');
        }
      }, 0); // 0ms 지연. 문제가 지속되면 10-50ms로 늘려보세요.

      return () => clearTimeout(timerId); // useEffect cleanup 함수에서 타이머 제거
    }
  }, [isAuthenticated, isLoading, token]); // 의존성 배열은 동일하게 유지

  if (isLoading) {
    return (
      <View style={styles.loadingContainer}>
        <Text style={styles.loadingText}>사용자 정보 확인 중...</Text>
      </View>
    );
  }

  // Stack 네비게이터가 onLayoutRootView 이후에 안정적으로 렌더링되도록 함
  return (
    <View style={{ flex: 1 }} onLayout={onLayoutRootView}>
      <Stack screenOptions={{ headerShown: false }}>
        {/* 초기 화면 전환 애니메이션 제거 옵션 (선택 사항) */}
        <Stack.Screen name="login" options={{ animation: 'none' }} />
        <Stack.Screen name="signup" options={{ animation: 'none' }} />
        <Stack.Screen name="(tabs)" options={{ animation: 'none' }} />
        <Stack.Screen name="+not-found" />
      </Stack>
    </View>
  );
}

export default function RootLayout() {
  const colorScheme = useColorScheme();
  const [loaded, fontError] = useFonts({
    SpaceMono: require('../assets/fonts/SpaceMono-Regular.ttf'),
  });

  useEffect(() => {
    if (fontError) {
      console.error("Font loading error:", fontError);
    }
  }, [fontError]);

  // 폰트 로딩이 완료될 때까지 스플래시 화면 유지 (RootNavigation의 onLayoutRootView에서 숨김 처리)
  if (!loaded && !fontError) {
    // 폰트가 로딩 중일 때는 스플래시 화면이 계속 보이도록 아무것도 반환하지 않거나,
    // 최소한의 로딩 UI (또는 null)를 반환하여 스플래시가 가려지지 않도록 할 수 있습니다.
    // 여기서는 RootNavigation에서 스플래시를 숨기므로, 폰트 로딩 중에는 로딩 UI를 보여줍니다.
    return (
      <View style={styles.loadingContainer}>
        <Text style={styles.loadingText}>폰트 로딩 중...</Text>
      </View>
    );
  }

  if (fontError && !loaded) {
    return (
      <View style={styles.loadingContainer}>
        <Text style={styles.loadingText}>폰트 로딩 실패! 앱을 시작할 수 없습니다.</Text>
      </View>
    );
  }

  return (
    <AuthProvider>
      <ThemeProvider value={colorScheme === 'dark' ? DarkTheme : DefaultTheme}>
        <RootNavigation />
        <StatusBar style="auto" />
      </ThemeProvider>
    </AuthProvider>
  );
}
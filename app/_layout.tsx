// app/_layout.tsx
import { DarkTheme, DefaultTheme, ThemeProvider } from '@react-navigation/native';
import { useFonts } from 'expo-font';
import { SplashScreen as ExpoSplashScreen, router, Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import React, { useCallback, useEffect } from 'react';
import { StyleSheet, Text, View } from 'react-native'; // Text, StyleSheet import 추가
import 'react-native-reanimated';

import { AuthProvider, useAuth } from '@/context/AuthContext';
import { useColorScheme } from '@/hooks/useColorScheme';

// 스플래시 화면 자동 숨기기 방지
ExpoSplashScreen.preventAutoHideAsync();

// 간단한 로딩 스피너 대신 사용할 임시 로딩 뷰 스타일
const styles = StyleSheet.create({
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#ffffff', // 혹은 테마에 맞는 배경색
  },
  loadingText: {
    fontSize: 16,
    marginTop: 10,
    color: '#000000', // 혹은 테마에 맞는 글자색
  }
});

// RootNavigation 컴포넌트: useAuth를 사용하기 위해 AuthProvider 내부에 위치
function RootNavigation() {
  const { isAuthenticated, isLoading, token } = useAuth(); // AuthContext 사용

  const onLayoutRootView = useCallback(async () => {
    // isLoading (AuthContext 로딩)과 폰트 로딩 상태를 함께 고려하여 스플래시 숨김
    // (이 부분은 RootLayout의 폰트 로딩 완료 후 RootNavigation이 렌더링되므로,
    //  여기서는 AuthContext의 isLoading만으로도 충분할 수 있습니다.)
    if (!isLoading) {
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

  if (isLoading) {
    // AuthContext 로딩 중일 때 로딩 UI 표시
    return (
      <View style={styles.loadingContainer}>
        <Text style={styles.loadingText}>사용자 정보 확인 중...</Text>
      </View>
    );
  }

  // 인증 상태가 확정된 후에 Stack 네비게이터를 렌더링
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
  const [loaded, fontError] = useFonts({ // 변수명을 error에서 fontError로 변경 (혼동 방지)
    SpaceMono: require('../assets/fonts/SpaceMono-Regular.ttf'),
  });

  // 폰트 로딩 에러 처리
  useEffect(() => {
    if (fontError) {
      console.error("Font loading error:", fontError);
      // 폰트 로딩 실패 시에도 스플래시를 숨길 수 있지만, 일단은 로딩 UI를 계속 보여주거나 에러 UI를 표시
      // ExpoSplashScreen.hideAsync();
    }
  }, [fontError]);

  // AuthContext의 isLoading을 여기서 직접 사용하진 않지만,
  // RootNavigation이 AuthProvider 내부에 있으므로 해당 컴포넌트에서 처리합니다.
  // 여기서는 폰트 로딩 상태만 우선적으로 처리합니다.
  if (!loaded && !fontError) {
    // 폰트 로딩 중일 때 로딩 UI 표시
    return (
      <View style={styles.loadingContainer}>
        <Text style={styles.loadingText}>폰트 로딩 중...</Text>
      </View>
    );
  }

  // 폰트 로딩에 실패했지만, 앱을 계속 진행하고 싶다면 여기서 별도 처리가능
  // (예: 기본 폰트로 앱을 띄우거나, 에러 메시지 UI를 보여주거나)
  if (fontError && !loaded) { // 폰트 로딩 에러가 발생했고, 로드되지 않았다면
    return (
      <View style={styles.loadingContainer}>
        <Text style={styles.loadingText}>폰트 로딩 실패! 앱을 시작할 수 없습니다.</Text>
      </View>
    );
  }

  // 폰트 로딩이 완료되었거나, (에러가 발생했더라도) 로드가 일부 성공하여 진행 가능할 때
  return (
    <AuthProvider>
      <ThemeProvider value={colorScheme === 'dark' ? DarkTheme : DefaultTheme}>
        <RootNavigation />
        <StatusBar style="auto" />
      </ThemeProvider>
    </AuthProvider>
  );
}
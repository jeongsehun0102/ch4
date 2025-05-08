// app/_layout.tsx 수정
import { DarkTheme, DefaultTheme, ThemeProvider } from '@react-navigation/native';
import { useFonts } from 'expo-font';
import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import 'react-native-reanimated';

import { useColorScheme } from '@/hooks/useColorScheme';

export default function RootLayout() {
  const colorScheme = useColorScheme();
  const [loaded] = useFonts({
    SpaceMono: require('../assets/fonts/SpaceMono-Regular.ttf'),
  });

  if (!loaded) {
    return null;
  }

  return (
    <ThemeProvider value={colorScheme === 'dark' ? DarkTheme : DefaultTheme}>
      <Stack initialRouteName="login">
        <Stack.Screen
          name="login"
          options={{ headerShown: false }} // 로그인 헤더 숨김
        />
        {/* === signup 스크린에 대한 설정 추가 === */}
        <Stack.Screen
          name="signup" // app/signup.tsx 파일에 해당
          options={{ headerShown: false }} // 헤더 숨김 처리
        />
        {/* =================================== */}
        <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
        <Stack.Screen name="+not-found" />
      </Stack>
      <StatusBar style="auto" />
    </ThemeProvider>
  );
}
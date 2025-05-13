// app/(tabs)/_layout.tsx (CustomTabBar 사용하도록 수정)
import { CustomTabBar } from '@/components/navigation/CustomTabBar'; // <<< 만든 커스텀 탭 바 import (경로 확인!)
import { Tabs } from 'expo-router';
import React from 'react';

// Colors, useColorScheme 등은 CustomTabBar 에서 사용하지 않으므로 여기서 필요 없을 수 있음

export default function TabLayout() {
  return (
    <Tabs
      // screenOptions 를 지우거나 최소화
      // tabBarActiveTintColor 등은 CustomTabBar 내부에서 처리
      screenOptions={{
        headerShown: false, // 헤더는 계속 숨김
      }}
      // tabBar prop에 우리가 만든 커스텀 컴포넌트 전달
      tabBar={(props) => <CustomTabBar {...props} />} // <<< 이 부분이 핵심!
    >
      {/* 탭 스크린 정의는 이전과 동일 */}
      <Tabs.Screen name="chat" />
      <Tabs.Screen name="records" />
      <Tabs.Screen name="index" />
      <Tabs.Screen name="board" />
      <Tabs.Screen name="profile" />
    </Tabs>
  );
}

// StyleSheet 는 이제 이 파일에 필요 없습니다 (CustomTabBar 로 이동)
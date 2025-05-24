// app/(tabs)/_layout.tsx
import { CustomTabBar } from '@/components/navigation/CustomTabBar'; //
import { Tabs } from 'expo-router';
import React from 'react';

export default function TabLayout() {
  return (
    <Tabs
      screenOptions={{
        headerShown: false,
      }}
      tabBar={(props) => <CustomTabBar {...props} />} //
      // sceneContainerStyle prop 제거
    >
      <Tabs.Screen name="chat" />
      <Tabs.Screen name="records" />
      <Tabs.Screen name="index" />
      <Tabs.Screen name="board" />
      <Tabs.Screen name="profile" />
    </Tabs>
  );
}
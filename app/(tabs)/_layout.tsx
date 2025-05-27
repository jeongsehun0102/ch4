// app/(tabs)/_layout.tsx
import { CustomTabBar } from '@/components/navigation/CustomTabBar';
import { Tabs } from 'expo-router';
import React, { useEffect } from 'react';
import MusicController from '../../components/MusicController';
import { MusicProvider } from '../../context/MusicContext';
import { registerForPushNotificationsAsync } from '../../utils/notifications'; // 경로 utils로 통일

export default function TabLayout() {
  useEffect(() => {
    console.log('TabLayout Mount: Attempting to register for push notifications...');
    registerForPushNotificationsAsync()
      .then(success => console.log('TabLayout Mount: Push notification registration success:', success))
      .catch(error => console.error('TabLayout Mount: Push notification registration error:', error));
  }, []);

  console.log('TabLayout Render: Applying MusicProvider and MusicController.');

  return (
    <MusicProvider>
      <MusicController />
      <Tabs
        screenOptions={{
          headerShown: false,
        }}
        tabBar={(props) => <CustomTabBar {...props} />}
      >
        <Tabs.Screen name="chat" />
        <Tabs.Screen name="records" />
        <Tabs.Screen name="index" />
        <Tabs.Screen name="board" />
        <Tabs.Screen name="profile" />
        {/* settings를 탭으로 사용 시 아래 주석 해제 */}
        {/* <Tabs.Screen name="settings" /> */}
      </Tabs>
    </MusicProvider>
  );
}
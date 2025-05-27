// app/(tabs)/profile.tsx (로그아웃 기능만 남긴 버전)
import { useAuth } from '@/context/AuthContext';
import React from 'react';
import { Button, SafeAreaView, StyleSheet, Text, View } from 'react-native';

export default function ProfileScreen() {
  const { logout, isLoading: authLoading, token} = useAuth(); // AuthContext에서 user 정보도 가져올 수 있다면 추가

  const handleLogout = async () => {
    if (authLoading) return;
    await logout();
  };

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.content}>
        <Text style={styles.headerTitle}>내 정보</Text>
        {/* 만약 useAuth()를 통해 사용자 이름 등을 가져올 수 있다면 여기에 표시합니다.
          예: user?.username 
        */}
        {/* <Text style={styles.infoText}>{user ? `${user.username}님, 환영합니다.` : '로그인된 사용자입니다.'}</Text> */}
        <Text style={styles.infoText}>로그인된 사용자입니다.</Text>
        {token && <Text style={styles.tokenHintText}>로그인 상태입니다.</Text>}
        <View style={styles.buttonContainer}>
          <Button
            title={authLoading ? "로그아웃 중..." : "로그아웃"}
            onPress={handleLogout}
            color="#FF6347"
            disabled={authLoading}
          />
        </View>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F2F2F7',
  },
  content: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#000',
    marginBottom: 30,
  },
  infoText: {
    fontSize: 18,
    marginBottom: 20,
    color: '#333',
  },
  tokenHintText: {
    fontSize: 14,
    color: 'gray',
    marginBottom: 30,
    textAlign: 'center',
  },
  buttonContainer: {
    width: '80%',
    minWidth: 200,
    maxWidth: 300,
  }
});
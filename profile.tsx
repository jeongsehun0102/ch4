// app/(tabs)/profile.tsx (예시)
import { useAuth } from '@/context/AuthContext'; // useAuth Hook import
import React from 'react';
import { Button, StyleSheet, Text, View } from 'react-native';

export default function ProfileScreen() {
  const { logout, token, isLoading } = useAuth(); // AuthContext에서 logout 함수와 현재 토큰, 로딩 상태 가져오기

  const handleLogout = async () => {
    if (isLoading) return; // 이미 로그아웃 처리 중이면 중복 실행 방지
    await logout();
  };

  return (
    <View style={styles.container}>
      <Text style={styles.infoText}>로그인된 사용자입니다.</Text>
      {token && <Text style={styles.tokenText}>현재 토큰 (일부): {token.substring(0, 20)}...</Text>}
      <View style={styles.buttonContainer}>
        <Button title="로그아웃" onPress={handleLogout} color="#FF6347" disabled={isLoading} />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  infoText: {
    fontSize: 18,
    marginBottom: 20,
  },
  tokenText: {
    fontSize: 12,
    color: 'gray',
    marginBottom: 20,
    textAlign: 'center',
    maxWidth: '90%',
  },
  buttonContainer: {
    marginTop: 20,
    width: '80%',
  }
});
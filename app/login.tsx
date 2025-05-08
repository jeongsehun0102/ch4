// app/login.tsx (최종: 애니메이션 적용, 꽃 유지, 성공 알림 제거)
import axios, { isAxiosError } from 'axios';
import { router } from 'expo-router';
import React, { useState } from 'react';
import {
  Alert,
  Image, // 꽃 이미지를 위해 Image import 유지
  ImageBackground,
  SafeAreaView,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View
} from 'react-native';
// AnimatedCharacter 컴포넌트 import (경로 확인!)
import AnimatedCharacter from '../components/AnimatedCharacter'; // 실제 경로 확인! 예: '@/components/AnimatedCharacter'

const LoginScreen: React.FC = () => {
  const [userId, setUserId] = useState<string>('');
  const [password, setPassword] = useState<string>('');

  const handleLogin = async () => {
    if (!userId || !password) {
      Alert.alert('오류', '아이디와 비밀번호를 모두 입력해주세요.');
      return;
    }
    console.log(`[로그인 시도] User ID: ${userId}`);
    // --- 백엔드 서버 주소 설정 ---
    const API_BASE_URL = 'http://192.168.45.228:8080'; // 실제 IP 확인
    const LOGIN_API_URL = `${API_BASE_URL}/api/auth/login`;
    // ---------------------------

    try {
      console.log(`[API 요청] POST ${LOGIN_API_URL}`);
      const response = await axios.post(LOGIN_API_URL, {
        userId: userId,
        password: password
      });

      console.log('[API 응답] 성공:', response.status, response.data);
      // --- 로그인 성공 시 Alert 제거됨 ---

      // TODO: 실제 토큰 저장 등 처리 필요
      router.replace('/(tabs)'); // 성공 시 화면 이동

    } catch (error) {
      // --- 로그인 실패 시 Alert는 유지 ---
      console.error("[API 오류] 로그인 요청 실패:", error);
      if (isAxiosError(error)) {
        if (error.response) {
          Alert.alert('로그인 실패', error.response.data || '아이디 또는 비밀번호가 일치하지 않습니다.');
        } else if (error.request) {
          Alert.alert('네트워크 오류', '서버로부터 응답을 받을 수 없습니다.');
        } else {
          Alert.alert('요청 오류', '로그인 요청을 보내는 중 오류가 발생했습니다.');
        }
      } else {
        Alert.alert('오류', '로그인 처리 중 알 수 없는 오류가 발생했습니다.');
      }
    }
  };

  const handleForgotId = () => { Alert.alert('알림', '아이디 찾기 기능 구현 필요'); };
  const handleForgotPassword = () => { Alert.alert('알림', '비밀번호 찾기 기능 구현 필요'); };
  const navigateToSignup = () => { router.push('/signup'); };

  return (
    <SafeAreaView style={styles.safeArea}>
      <ScrollView contentContainerStyle={styles.scrollViewContainer}>
        <View style={styles.topDecorContainer}>
          <TouchableOpacity onPress={navigateToSignup}>
            <ImageBackground source={require('../assets/images/cloud_signin.png')} style={styles.cloudImageBackground} resizeMode="contain">
              <Text style={styles.signInText}>SIGN IN</Text>
            </ImageBackground>
          </TouchableOpacity>

          {/* === 캐릭터 이미지 영역 (AnimatedCharacter 사용) === */}
          <View style={styles.characterRow}>
             <AnimatedCharacter source={require('../assets/images/Character_1.png')} style={styles.characterImage}/>
             <AnimatedCharacter source={require('../assets/images/Character_2.png')} style={styles.characterImage}/>
             <AnimatedCharacter source={require('../assets/images/Character_3.png')} style={styles.characterImage}/>
             <AnimatedCharacter source={require('../assets/images/Character_4.png')} style={styles.characterImage}/>
          </View>
          {/* ============================================ */}

          {/* === 꽃 이미지 영역 유지 === */}
          <View style={styles.flowerRow}>
            {/* 필요하다면 나중에 꽃에도 AnimatedCharacter 적용 가능 */}
            {Array.from({ length: 6 }).map((_, index) => (
              <Image key={index} source={require('../assets/images/Flower.png')} style={styles.flowerImage} resizeMode="contain" />
            ))}
          </View>
          {/* ------------------------- */}

        </View>

        <View style={styles.mainContent}>
          <Text style={styles.appTitle}>Lumia</Text>
          <View style={styles.inputContainer}>
            <TextInput style={styles.input} placeholder="User ID" value={userId} onChangeText={setUserId} autoCapitalize="none"/>
            <TouchableOpacity onPress={handleForgotId} style={styles.iconButton}><Text style={styles.iconText}>?</Text></TouchableOpacity>
          </View>
          <View style={styles.inputContainer}>
            <TextInput style={styles.input} placeholder="Password" value={password} onChangeText={setPassword} secureTextEntry={true}/>
            <TouchableOpacity onPress={handleForgotPassword} style={styles.iconButton}><Text style={styles.iconText}>?</Text></TouchableOpacity>
          </View>
          <TouchableOpacity style={styles.loginButton} onPress={handleLogin}>
            <Text style={styles.loginButtonText}>LOG IN</Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

// 스타일 정의
const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: '#E0F7FA' },
  scrollViewContainer: { flexGrow: 1, alignItems: 'center' },
  topDecorContainer: { width: '100%', alignItems: 'center', marginTop: 50, paddingHorizontal: 20 },
  cloudImageBackground: { width: 120, height: 80, justifyContent: 'center', alignItems: 'center', marginBottom: 20, alignSelf: 'flex-start', marginLeft: 10 },
  signInText: { fontWeight: 'bold', fontSize: 14, color: '#333' },
  characterRow: { flexDirection: 'row', justifyContent: 'space-around', alignItems: 'center', width: '100%', marginBottom: 15 },
  characterImage: { width: 50, height: 50 }, // resizeMode는 AnimatedCharacter에서 처리
  flowerRow: { flexDirection: 'row', justifyContent: 'space-evenly', alignItems: 'center', width: '95%', marginBottom: 90 }, // 꽃 영역 스타일
  flowerImage: { width: 35, height: 35, resizeMode: 'contain' }, // 꽃 이미지 스타일
  mainContent: { width: '90%', backgroundColor: '#B3E5FC', borderRadius: 20, padding: 25, alignItems: 'center', marginBottom: 30 },
  appTitle: { fontSize: 40, fontWeight: 'bold', color: 'white', marginBottom: 30 },
  inputContainer: { flexDirection: 'row', alignItems: 'center', width: '100%', backgroundColor: '#FFF9C4', borderRadius: 25, height: 50, marginBottom: 20, paddingHorizontal: 15 },
  input: { flex: 1, height: '100%', fontSize: 16 },
  iconButton: { paddingLeft: 10 },
  iconText: { fontSize: 18, fontWeight: 'bold', color: 'gray' },
  loginButton: { width: '100%', backgroundColor: '#4CAF50', borderRadius: 25, height: 50, justifyContent: 'center', alignItems: 'center', marginTop: 10 },
  loginButtonText: { color: 'white', fontSize: 18, fontWeight: 'bold' },
});

export default LoginScreen;
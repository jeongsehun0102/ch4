// app/login.tsx
import axios, { isAxiosError } from 'axios';
import { router } from 'expo-router';
import React, { useState } from 'react';
import {
  Alert,
  Image,
  ImageBackground,
  SafeAreaView,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View
} from 'react-native';

import { useAuth } from '@/context/AuthContext';
import AnimatedCharacter from '../components/AnimatedCharacter';
// API 상수 import 추가
import { API_BASE_URL, API_ENDPOINTS } from '../constants/api';

const LoginScreen: React.FC = () => {
  const [userId, setUserId] = useState<string>('');
  const [password, setPassword] = useState<string>('');
  const { login, isLoading } = useAuth();

  const handleLogin = async () => {
    if (isLoading) return;

    if (!userId || !password) {
      Alert.alert('오류', '아이디와 비밀번호를 모두 입력해주세요.');
      return;
    }
    console.log(`[로그인 시도] User ID: ${userId}`);

    const LOGIN_API_URL = `${API_BASE_URL}${API_ENDPOINTS.LOGIN}`;

    try {
      const response = await axios.post(LOGIN_API_URL, {
        userId: userId,
        password: password
      });

      // ▼▼▼ 로그 추가 ▼▼▼
      console.log('DEBUG: Full API Response Data (login.tsx):', JSON.stringify(response.data, null, 2));
      console.log('DEBUG: Refresh Token from API (login.tsx):', response.data.refreshToken);
      // ▲▲▲ 로그 추가 ▲▲▲

      console.log('[API 응답] 성공 (login.tsx):', response.status, response.data); // 기존 로그

      const responseAccessToken = response.data.token;      // 백엔드 LoginResponseDto의 token 필드 (Access Token)
      const responseRefreshToken = response.data.refreshToken; // 백엔드 LoginResponseDto의 refreshToken 필드

      if (responseAccessToken && responseRefreshToken) { // 두 토큰이 모두 있는지 확인
        // AuthContext의 login 함수에 accessToken과 refreshToken을 모두 전달
        await login(responseAccessToken, responseRefreshToken);
      } else {
        Alert.alert('로그인 실패', '서버로부터 토큰 정보를 완전하게 받지 못했습니다.');
        // responseAccessToken만 있고 responseRefreshToken이 없는 경우 등의 상세 로그 추가 가능
        console.error('Login Error: Missing access token or refresh token in response', response.data);
      }
      // --- 💡 수정된 부분 끝 💡 ---

    } catch (error) {
      console.error("[API 오류] 로그인 요청 실패 (login.tsx):", error);
      if (isAxiosError(error)) {
        if (error.response) {
          const errorMessage = typeof error.response.data === 'string'
            ? error.response.data
            : (error.response.data?.message || error.response.data?.body || '아이디 또는 비밀번호가 일치하지 않습니다.');
          Alert.alert('로그인 실패', errorMessage);
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

  const handleForgotId = () => { Alert.alert('알림', '아이디 찾기 기능은 준비 중입니다.'); };
  const handleForgotPassword = () => { Alert.alert('알림', '비밀번호 찾기 기능은 준비 중입니다.'); };
  const navigateToSignup = () => {
    router.push('/signup');
  };


  return (
    <SafeAreaView style={styles.safeArea}>
      <ScrollView contentContainerStyle={styles.scrollViewContainer} keyboardShouldPersistTaps="handled">
        <View style={styles.topDecorContainer}>
          <TouchableOpacity onPress={navigateToSignup} style={styles.cloudTouchable}>
            <ImageBackground source={require('../assets/images/cloud_signin.png')} style={styles.cloudImageBackground} resizeMode="contain">
              <Text style={styles.signInText}>SIGN IN</Text>
            </ImageBackground>
          </TouchableOpacity>

          <View style={styles.characterRow}>
            <AnimatedCharacter source={require('../assets/images/Character_1.png')} style={styles.characterImage}/>
            <AnimatedCharacter source={require('../assets/images/Character_2.png')} style={styles.characterImage}/>
            <AnimatedCharacter source={require('../assets/images/Character_3.png')} style={styles.characterImage}/>
            <AnimatedCharacter source={require('../assets/images/Character_4.png')} style={styles.characterImage}/>
          </View>

          <View style={styles.flowerContainer}>
            <View style={styles.flowerGroup}>
              {Array.from({ length: 3 }).map((_, index) => (
                <Image key={`left-flower-${index}`} source={require('../assets/images/Flower.png')} style={styles.flowerImage} />
              ))}
            </View>
            <View style={styles.flowerGroup}>
              {Array.from({ length: 3 }).map((_, index) => (
                <Image key={`right-flower-${index}`} source={require('../assets/images/Flower.png')} style={styles.flowerImage} />
              ))}
            </View>
          </View>
        </View>

        <View style={styles.mainContent}>
          <Text style={styles.appTitle}>Lumia</Text>
          <View style={styles.inputContainer}>
            <TextInput
              style={styles.input}
              placeholder="User ID"
              placeholderTextColor="#A0A0A0"
              value={userId}
              onChangeText={setUserId}
              autoCapitalize="none"
              editable={!isLoading}
            />
            <TouchableOpacity onPress={handleForgotId} style={styles.iconButton} disabled={isLoading}>
              <Text style={styles.iconText}>?</Text>
            </TouchableOpacity>
          </View>
          <View style={styles.inputContainer}>
            <TextInput
              style={styles.input}
              placeholder="Password"
              placeholderTextColor="#A0A0A0"
              value={password}
              onChangeText={setPassword}
              secureTextEntry={true}
              editable={!isLoading}
            />
            <TouchableOpacity onPress={handleForgotPassword} style={styles.iconButton} disabled={isLoading}>
              <Text style={styles.iconText}>?</Text>
            </TouchableOpacity>
          </View>
          <TouchableOpacity style={styles.loginButton} onPress={handleLogin} disabled={isLoading}>
            <Text style={styles.loginButtonText}>{isLoading ? '로그인 중...' : 'LOG IN'}</Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: '#D0EFFF',
  },
  scrollViewContainer: {
    flexGrow: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 20,
  },
  topDecorContainer: {
    width: '100%',
    alignItems: 'center',
    paddingHorizontal: 20,
    marginBottom: 5,
  },
  cloudTouchable: {
    alignSelf: 'flex-start',
    marginLeft: 10,
    marginBottom: 20,
  },
  cloudImageBackground: {
    width: 130,
    height: 85,
    justifyContent: 'center',
    alignItems: 'center',
  },
  signInText: {
    fontWeight: 'bold',
    fontSize: 14,
    color: '#4A4A4A',
  },
  characterRow: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    alignItems: 'center',
    width: '90%',
    marginBottom: 20,
  },
  characterImage: {
    width: 72,
    height: 72,
  },
  flowerContainer: {
    width: '95%',
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  flowerGroup: {
    flexDirection: 'row',
  },
  flowerImage: {
    width: 52,
    height: 52,
    resizeMode: 'contain',
    marginHorizontal: 4,
  },
  mainContent: {
    width: '85%',
    backgroundColor: '#A0D2FF',
    borderRadius: 35,
    paddingVertical: 35,
    paddingHorizontal: 25,
    alignItems: 'center',
    marginTop: 10,
  },
  appTitle: {
    fontSize: 45,
    fontWeight: 'bold',
    color: 'white',
    marginBottom: 35,
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    width: '100%',
    backgroundColor: '#FFFFE0',
    borderRadius: 25,
    height: 55,
    marginBottom: 18,
    paddingHorizontal: 20,
    elevation: 2,
    shadowColor: '#000',
    shadowOpacity: 0.1,
    shadowRadius: 3,
    shadowOffset: { width: 0, height: 1 },
  },
  input: {
    flex: 1,
    height: '100%',
    fontSize: 16,
    color: '#333',
  },
  iconButton: {
    paddingLeft: 10,
  },
  iconText: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#757575',
  },
  loginButton: {
    width: '100%',
    backgroundColor: '#3CB371',
    borderRadius: 25,
    height: 55,
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 15,
    elevation: 3,
    shadowColor: '#000',
    shadowOpacity: 0.2,
    shadowRadius: 4,
    shadowOffset: { width: 0, height: 2 },
  },
  loginButtonText: {
    color: 'white',
    fontSize: 18,
    fontWeight: 'bold',
  },
});

export default LoginScreen;
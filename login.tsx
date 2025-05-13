// app/login.tsx
import axios, { isAxiosError } from 'axios';
// import { router } from 'expo-router'; // AuthContext에서 화면 전환을 담당하므로 직접 사용 안 할 수 있음
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

import { useAuth } from '@/context/AuthContext'; // AuthContext의 useAuth Hook import (경로 확인!)
import AnimatedCharacter from '../components/AnimatedCharacter'; // 경로 확인

const LoginScreen: React.FC = () => {
  const [userId, setUserId] = useState<string>('');
  const [password, setPassword] = useState<string>('');
  const { login, isLoading } = useAuth(); // AuthContext에서 login 함수와 isLoading 상태 가져오기

  const handleLogin = async () => {
    if (isLoading) return; // 이미 로그인 처리 중이면 중복 실행 방지

    if (!userId || !password) {
      Alert.alert('오류', '아이디와 비밀번호를 모두 입력해주세요.');
      return;
    }
    console.log(`[로그인 시도] User ID: ${userId}`);
    const API_BASE_URL = 'http://192.168.45.228:8080'; // 실제 IP 주소로 변경하세요
    const LOGIN_API_URL = `${API_BASE_URL}/api/auth/login`;

    try {
      const response = await axios.post(LOGIN_API_URL, {
        userId: userId,
        password: password
      });

      console.log('[API 응답] 성공 (login.tsx):', response.status, response.data);

      const responseToken = response.data.token;
      // const responseUserId = response.data.userId; // 필요하다면 이 정보도 login 함수에 전달 가능

      if (responseToken) {
        await login(responseToken); // AuthContext의 login 함수 호출
        // 화면 전환은 AuthContext의 login 함수 또는 RootNavigation의 useEffect에서 처리됨
      } else {
        Alert.alert('로그인 실패', '서버로부터 토큰을 받지 못했습니다.');
      }

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
  // const navigateToSignup = () => { router.push('/signup'); }; // router는 AuthContext 사용 시 필요 없을 수 있음
                                                              // 또는 app/_layout.tsx에서 signup 화면을 관리하므로
                                                              // router.push('/signup')은 그대로 사용 가능
  const navigateToSignup = () => {
    // Expo Router를 직접 사용해야 할 경우 router를 import하여 사용합니다.
    // AuthContext와 router 사용 방식을 프로젝트 전체적으로 일관성 있게 가져가는 것이 좋습니다.
    // 지금은 router.push를 그대로 사용하겠습니다.
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
            {/* 캐릭터 이미지 크기는 styles.characterImage에서 조절 */}
            <AnimatedCharacter source={require('../assets/images/Character_1.png')} style={styles.characterImage}/>
            <AnimatedCharacter source={require('../assets/images/Character_2.png')} style={styles.characterImage}/>
            <AnimatedCharacter source={require('../assets/images/Character_3.png')} style={styles.characterImage}/>
            <AnimatedCharacter source={require('../assets/images/Character_4.png')} style={styles.characterImage}/>
          </View>

          <View style={styles.flowerContainer}>
            <View style={styles.flowerGroup}>
              {/* 꽃 개수는 여기서 조절 (예: 좌우 3개씩) */}
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
              editable={!isLoading} // 로딩 중 입력 방지
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
              editable={!isLoading} // 로딩 중 입력 방지
            />
            <TouchableOpacity onPress={handleForgotPassword} style={styles.iconButton} disabled={isLoading}>
              <Text style={styles.iconText}>?</Text>
            </TouchableOpacity>
          </View>
          <TouchableOpacity style={styles.loginButton} onPress={handleLogin} disabled={isLoading}>
            {/* 로딩 중이면 다른 텍스트나 ActivityIndicator 표시 가능 */}
            <Text style={styles.loginButtonText}>{isLoading ? '로그인 중...' : 'LOG IN'}</Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

// 스타일 정의 (이전과 동일하게 유지 또는 필요에 따라 조절)
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
    width: 72, // 이전 단계에서 키운 값
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
    width: 52, // 이전 단계에서 키운 값
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
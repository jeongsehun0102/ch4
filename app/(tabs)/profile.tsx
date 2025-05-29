// app/(tabs)/profile.tsx
import { useAuth } from '@/context/AuthContext';
import { Ionicons } from '@expo/vector-icons';
import axios from 'axios';
import Constants from 'expo-constants';
import React, { useEffect, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  KeyboardAvoidingView,
  Modal,
  Platform,
  SafeAreaView,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import { API_BASE_URL } from '../../constants/api';

// --- 인터페이스 및 상수 정의 ---
interface UserProfileData {
  loginId: string;
  email: string;
  username: string;
  gender: string | null;
  bloodType: string | null;
  mbti: string | null;
}

const API_ENDPOINTS_PROFILE = {
  GET_USER_PROFILE: '/api/users/me/profile',
  UPDATE_USER_PROFILE: '/api/users/me/profile',
  UPDATE_EMAIL: '/api/users/me/email',
  UPDATE_PASSWORD: '/api/users/me/password',
};

const GENDER_OPTIONS = [
  { label: '남성', value: 'MALE', icon: 'male-outline' as const },
  { label: '여성', value: 'FEMALE', icon: 'female-outline' as const },
  { label: '그 외', value: 'OTHER', icon: 'male-female-outline' as const },
];

const BLOOD_TYPE_OPTIONS = [
  { label: 'A형', value: 'A' }, { label: 'B형', value: 'B' },
  { label: 'O형', value: 'O' }, { label: 'AB형', value: 'AB' },
  { label: '모름', value: 'UNKNOWN' },
];

const MBTI_TYPES = [
  'ISTJ', 'ISFJ', 'INFJ', 'INTJ',
  'ISTP', 'ISFP', 'INFP', 'INTP',
  'ESTP', 'ESFP', 'ENFP', 'ENTP',
  'ESTJ', 'ESFJ', 'ENFJ', 'ENTJ',
];
const MBTI_OPTIONS = MBTI_TYPES.map(type => ({ label: type, value: type }));
// --- 인터페이스 및 상수 정의 끝 ---


export default function ProfileScreen() {
  const { logout, isLoading: authLoading, token } = useAuth();

  const [userData, setUserData] = useState<UserProfileData | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const [isNicknameModalVisible, setIsNicknameModalVisible] = useState(false);
  const [newNickname, setNewNickname] = useState('');
  const [isGenderModalVisible, setIsGenderModalVisible] = useState(false);
  const [isEmailModalVisible, setIsEmailModalVisible] = useState(false);
  const [newEmail, setNewEmail] = useState('');
  const [isPasswordModalVisible, setIsPasswordModalVisible] = useState(false);
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPasswordForUpdate, setNewPasswordForUpdate] = useState('');
  const [confirmNewPassword, setConfirmNewPassword] = useState('');
  const [isBloodTypeModalVisible, setIsBloodTypeModalVisible] = useState(false);
  const [isMbtiModalVisible, setIsMbtiModalVisible] = useState(false);

  const fetchUserProfile = async () => {
    console.log("fetchUserProfile called. Token:", token ? "Present" : "Absent");
    if (!token) {
      Alert.alert("오류", "로그인 정보가 없습니다. 다시 로그인해주세요.");
      setIsLoading(false);
      console.log("Token is missing, cannot fetch profile.");
      return;
    }
    setIsLoading(true);
    try {
      console.log("Attempting to fetch profile from:", `${API_BASE_URL}${API_ENDPOINTS_PROFILE.GET_USER_PROFILE}`);
      const response = await axios.get(`${API_BASE_URL}${API_ENDPOINTS_PROFILE.GET_USER_PROFILE}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      console.log('User profile API response data:', response.data);
      setUserData(response.data);
      setNewNickname(response.data.username || '');
      setNewEmail(response.data.email || '');
    } catch (error: any) {
      console.error("사용자 프로필 로딩 실패 Full Error:", error);
      if (error.response) {
        console.error("Error response data:", error.response.data);
        console.error("Error response status:", error.response.status);
        Alert.alert("오류", `프로필 정보 로딩 중 오류가 발생했습니다. (상태: ${error.response.status})`);
      } else if (error.request) {
        console.error("Error request:", error.request);
        Alert.alert("오류", "프로필 정보 로딩 중 서버에 연결할 수 없습니다.");
      } else {
        console.error("Error message:", error.message);
        Alert.alert("오류", "프로필 정보를 가져오는 중 알 수 없는 오류가 발생했습니다.");
      }
    } finally {
      setIsLoading(false);
      console.log("fetchUserProfile finished. isLoading:", false);
    }
  };

  useEffect(() => {
    console.log("ProfileScreen useEffect triggered. Token:", token ? "Present" : "Absent", "AuthLoading:", authLoading);
    if (token && !authLoading) {
      fetchUserProfile();
    } else if (!token && !authLoading) {
      setIsLoading(false);
      console.log("ProfileScreen useEffect: No token found after auth loading. isLoading set to false.");
    } else if (authLoading) {
        console.log("ProfileScreen useEffect: AuthContext is still loading.");
    }
  }, [token, authLoading]);


  const handleLogout = async () => {
    if (isSubmitting) return;
    await logout();
  };

  // --- 각 항목 저장 핸들러 (이전과 동일) ---
  const handleSaveNickname = async () => {
    if (!token || !userData) return;
    const trimmedNickname = newNickname.trim();
    if (trimmedNickname.length === 0) { Alert.alert("오류", "닉네임을 입력해주세요."); return; }
    if (trimmedNickname.length > 12) { Alert.alert("오류", "닉네임은 최대 12자까지 입력할 수 있습니다."); return; }
    const payload = { username: trimmedNickname };
    console.log('Sending to backend (Nickname Update):', JSON.stringify(payload));
    setIsSubmitting(true);
    try {
      await axios.put(`${API_BASE_URL}${API_ENDPOINTS_PROFILE.UPDATE_USER_PROFILE}`, payload, { headers: { Authorization: `Bearer ${token}` } });
      setUserData(prev => prev ? { ...prev, username: trimmedNickname } : null);
      setIsNicknameModalVisible(false);
      Alert.alert("성공", "닉네임이 변경되었습니다.");
    } catch (e:any) { console.error("닉네임 변경 실패:", e.response?.data || e.message); Alert.alert("오류", e.response?.data?.message || "닉네임 변경에 실패했습니다."); }
    finally { setIsSubmitting(false); }
  };

  const handleSaveGender = async (genderValue: string) => {
    if (!token || !userData) return;
    const payload = { gender: genderValue };
    console.log('Sending to backend (Gender Update):', JSON.stringify(payload));
    setIsSubmitting(true);
    try {
      await axios.put(`${API_BASE_URL}${API_ENDPOINTS_PROFILE.UPDATE_USER_PROFILE}`, payload, { headers: { Authorization: `Bearer ${token}` } });
      setUserData(prev => prev ? { ...prev, gender: genderValue } : null);
      setIsGenderModalVisible(false);
      Alert.alert("성공", "성별 정보가 업데이트되었습니다.");
    } catch (e:any) { console.error("성별 변경 실패:", e.response?.data || e.message); Alert.alert("오류", e.response?.data?.message || "성별 정보 업데이트에 실패했습니다."); }
    finally { setIsSubmitting(false); }
  };

  const handleSaveEmail = async () => {
    if (!token || !userData) return;
    const trimmedEmail = newEmail.trim();
    if (!trimmedEmail || !/\S+@\S+\.\S+/.test(trimmedEmail)) { Alert.alert("오류", "올바른 이메일 형식이 아닙니다."); return; }
    const payload = { newEmail: trimmedEmail };
    console.log('Sending to backend (Email Update):', JSON.stringify(payload));
    setIsSubmitting(true);
    try {
      await axios.put(`${API_BASE_URL}${API_ENDPOINTS_PROFILE.UPDATE_EMAIL}`, payload, { headers: { Authorization: `Bearer ${token}` } });
      setUserData(prev => prev ? { ...prev, email: trimmedEmail } : null);
      setIsEmailModalVisible(false);
      Alert.alert("성공", "이메일이 변경되었습니다.");
    } catch (e:any) { console.error("이메일 변경 실패:", e.response?.data || e.message); Alert.alert("오류", e.response?.data?.message || "이메일 변경에 실패했습니다."); }
    finally { setIsSubmitting(false); }
  };

  const handleSavePassword = async () => {
    if (!token || !userData) return;
    if (!currentPassword || !newPasswordForUpdate || !confirmNewPassword) { Alert.alert("오류", "모든 비밀번호 필드를 입력해주세요."); return; }
    if (newPasswordForUpdate !== confirmNewPassword) { Alert.alert("오류", "새 비밀번호가 일치하지 않습니다."); return; }
    if (newPasswordForUpdate.length < 8) { Alert.alert("오류", "새 비밀번호는 8자 이상이어야 합니다."); return;}
    const payload = { currentPassword, newPassword: newPasswordForUpdate };
    console.log('Sending to backend (Password Update):', JSON.stringify({ currentPassword: '***', newPassword: '***' }));
    setIsSubmitting(true);
    try {
      await axios.put(`${API_BASE_URL}${API_ENDPOINTS_PROFILE.UPDATE_PASSWORD}`, payload, { headers: { Authorization: `Bearer ${token}` } });
      setIsPasswordModalVisible(false);
      setCurrentPassword('');
      setNewPasswordForUpdate('');
      setConfirmNewPassword('');
      Alert.alert("성공", "비밀번호가 변경되었습니다. 보안을 위해 다시 로그인해주세요.");
      logout();
    } catch (e:any) {
        console.error("비밀번호 변경 실패:", e.response?.data || e.message);
        Alert.alert("오류", (e.response?.data?.message || e.response?.data) || "비밀번호 변경에 실패했습니다.");
    }
    finally { setIsSubmitting(false); }
  };

  const handleSaveBloodType = async (bloodTypeValue: string | null) => {
    if (!token || !userData) return;
    const payload = { bloodType: bloodTypeValue };
    console.log('Sending to backend (BloodType Update):', JSON.stringify(payload));
    setIsSubmitting(true);
    try {
      await axios.put(`${API_BASE_URL}${API_ENDPOINTS_PROFILE.UPDATE_USER_PROFILE}`, payload, { headers: { Authorization: `Bearer ${token}` } });
      setUserData(prev => prev ? { ...prev, bloodType: bloodTypeValue } : null);
      setIsBloodTypeModalVisible(false);
      Alert.alert("성공", "혈액형 정보가 업데이트되었습니다.");
    } catch (e:any) { console.error("혈액형 변경 실패:", e.response?.data || e.message); Alert.alert("오류", e.response?.data?.message || "혈액형 업데이트에 실패했습니다."); }
    finally { setIsSubmitting(false); }
  };

  const handleSaveMbti = async (mbtiValue: string | null) => {
    if (!token || !userData) return;
    const upperMbtiValue = mbtiValue ? mbtiValue.trim().toUpperCase() : null;
    if (upperMbtiValue && !MBTI_TYPES.includes(upperMbtiValue)) {
        Alert.alert("오류", "올바른 MBTI 형식이 아닙니다. (예: INFP)"); return;
    }
    const payload = { mbti: upperMbtiValue };
    console.log('Sending to backend (MBTI Update):', JSON.stringify(payload));
    setIsSubmitting(true);
    try {
      await axios.put(`${API_BASE_URL}${API_ENDPOINTS_PROFILE.UPDATE_USER_PROFILE}`, payload, { headers: { Authorization: `Bearer ${token}` } });
      setUserData(prev => prev ? { ...prev, mbti: upperMbtiValue } : null);
      setIsMbtiModalVisible(false);
      Alert.alert("성공", "MBTI 정보가 업데이트되었습니다.");
    } catch (e:any) { console.error("MBTI 변경 실패:", e.response?.data || e.message); Alert.alert("오류", e.response?.data?.message || "MBTI 업데이트에 실패했습니다."); }
    finally { setIsSubmitting(false); }
  };
  // --- 각 항목 저장 핸들러 끝 ---

  const navigateToEditScreen = (editType: string, currentValue?: string | null) => {
    if (!userData) { Alert.alert("정보 로딩 중", "잠시 후 다시 시도해주세요."); return; }
    console.log(`MapsToEditScreen called for: ${editType}`); // 어떤 항목 클릭했는지 로그 추가
    switch (editType) {
      case '이메일': setNewEmail(currentValue || ''); setIsEmailModalVisible(true); break;
      case '닉네임': setNewNickname(currentValue || ''); setIsNicknameModalVisible(true); break;
      case '비밀번호': setCurrentPassword(''); setNewPasswordForUpdate(''); setConfirmNewPassword(''); setIsPasswordModalVisible(true); break;
      case '성별': setIsGenderModalVisible(true); break;
      case '혈액형': setIsBloodTypeModalVisible(true); break;
      case 'MBTI': setIsMbtiModalVisible(true); break;
      case '계정 탈퇴': Alert.alert("계정 탈퇴", "정말로 계정을 삭제하시겠습니까?", [{text: '취소'}, {text: '삭제', style: 'destructive', onPress: () => { /* TODO: 계정 탈퇴 API 호출 */ Alert.alert('알림', '계정 삭제 기능은 준비중입니다.');}}]); break;
      default: Alert.alert('알림', `${editType} 변경은 준비 중입니다.`);
    }
  };

  const navigateToInfoScreen = (infoType: string) => {
    console.log(`MapsToInfoScreen called for: ${infoType}`); // 어떤 항목 클릭했는지 로그 추가
    Alert.alert(infoType, "세부 내용을 표시할 화면으로 이동합니다. (구현 필요)");
  };

  // ListItem 컴포넌트 정의 수정
  const ListItem = ({ label, value, onPress, isFirstInSection = false, isLastInSection = false, hideArrow = false,
  }: { label: string; value?: string | null; onPress?: () => void; isFirstInSection?: boolean; isLastInSection?: boolean; hideArrow?: boolean;
  }) => {
    let displayValue = ""; // 기본적으로는 빈 문자열
    let showValueText = false; // 값을 표시할지 여부
    let isPlaceholder = false; // "입력하기" 스타일을 적용할지 여부

    const labelsThatNeedPlaceholder = ["성별", "혈액형", "MBTI", "이메일 변경", "닉네임 변경"]; // "입력하기"가 필요한 항목들
    const labelsThatShouldBeEmpty = ["오픈 라이선스", "개인정보처리방침", "이용약관", "로그아웃", "계정 탈퇴", "아이디", "비밀번호 변경"]; // 값이 비어있어야 하는 항목

    if (value && value.trim() !== "") { // 실제 값이 있는 경우
        displayValue = value;
        showValueText = true;
    } else { // 값이 없거나 빈 문자열인 경우
        if (labelsThatNeedPlaceholder.includes(label) && !hideArrow) {
            displayValue = "입력하기";
            showValueText = true;
            isPlaceholder = true;
        } else if (labelsThatShouldBeEmpty.includes(label)) {
            displayValue = ""; // 빈 값으로 명시적 설정
            showValueText = false; // 텍스트 컴포넌트 자체를 숨길 수 있음 (또는 빈 값으로 표시)
        }
        // 그 외 경우는 displayValue = "" 이고 showValueText = false 유지
    }
    
    // "아이디", "비밀번호 변경"은 value가 항상 있으므로 위 로직에 안걸리고, displayValue = value가 됨.

    return (
      <TouchableOpacity
        style={[ styles.listItem, isFirstInSection && styles.listItemFirst, isLastInSection && styles.listItemLast, !onPress && styles.nonTouchableListItem,]}
        onPress={onPress}
        disabled={!onPress || isSubmitting}
      >
        <Text style={styles.label}>{label}</Text>
        <View style={styles.valueContainer}>
          {showValueText && (
            <Text style={[styles.value, isPlaceholder && styles.placeholderValue]}>
              {displayValue}
            </Text>
          )}
          {!hideArrow && onPress && (<Ionicons name="chevron-forward" size={20} color="#C7C7CC" />)}
        </View>
      </TouchableOpacity>
    );
  };


  if (isLoading && !userData) {
    return (
      <SafeAreaView style={styles.safeArea}>
        <View style={styles.header}><Text style={styles.headerTitle}>내 계정</Text></View>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#007AFF" />
          <Text style={styles.loadingText}>프로필 정보 로딩 중...</Text>
        </View>
      </SafeAreaView>
    );
  }

  if (!userData && !authLoading) {
    return (
      <SafeAreaView style={styles.safeArea}>
        <View style={styles.header}><Text style={styles.headerTitle}>내 계정</Text></View>
        <View style={styles.loadingContainer}>
          <Text style={styles.errorText}>프로필 정보를 불러올 수 없습니다.</Text>
          <TouchableOpacity
            onPress={token ? fetchUserProfile : () => { Alert.alert("오류", "로그인이 필요합니다."); logout();}}
            style={styles.retryButton}
            disabled={isSubmitting || authLoading}
          >
            <Text style={styles.retryButtonText}>다시 시도</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }

  if (!userData) {
      return <SafeAreaView style={styles.safeArea}><Text>데이터 로딩에 실패했습니다.</Text></SafeAreaView>;
  }

  return (
    <SafeAreaView style={styles.safeArea}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>내 계정</Text>
      </View>
      <KeyboardAvoidingView
        behavior={Platform.OS === "ios" ? "padding" : "height"}
        style={{ flex: 1 }}
        keyboardVerticalOffset={Platform.OS === "ios" ? 64 : 0}
      >
        <ScrollView
            style={styles.scrollView}
            contentContainerStyle={styles.scrollViewContent}
            showsVerticalScrollIndicator={false}
            keyboardShouldPersistTaps="handled"
        >
          <View style={styles.section}>
            <ListItem label="아이디" value={userData.loginId} isFirstInSection hideArrow />
            <ListItem label="이메일 변경" value={userData.email} onPress={() => navigateToEditScreen('이메일', userData.email)} />
            <ListItem label="닉네임 변경" value={userData.username} onPress={() => navigateToEditScreen('닉네임', userData.username)} />
            <ListItem label="비밀번호 변경" value="********" onPress={() => navigateToEditScreen('비밀번호')} isLastInSection />
          </View>
          <View style={styles.section}>
            <ListItem
                label="성별"
                value={GENDER_OPTIONS.find(opt => opt.value === userData.gender)?.label || userData.gender}
                onPress={() => navigateToEditScreen('성별')}
                isFirstInSection
            />
            <ListItem
                label="혈액형"
                value={BLOOD_TYPE_OPTIONS.find(opt => opt.value === userData.bloodType)?.label || userData.bloodType}
                onPress={() => navigateToEditScreen('혈액형')}
            />
            <ListItem
                label="MBTI"
                value={MBTI_OPTIONS.find(opt => opt.value === userData.mbti)?.label || userData.mbti}
                onPress={() => navigateToEditScreen('MBTI')}
                isLastInSection
            />
          </View>

          <View style={styles.section}>
            <ListItem
              label="오픈 라이선스"
              onPress={() => navigateToInfoScreen('오픈 라이선스')}
              isFirstInSection
              value="" // value를 빈 문자열로 전달하여 ListItem 내부 로직에 따라 처리
              hideArrow={false} // 화살표 유지
            />
            <ListItem
              label="개인정보처리방침"
              onPress={() => navigateToInfoScreen('개인정보처리방침')}
              value=""
              hideArrow={false}
            />
            <ListItem
              label="이용약관"
              onPress={() => navigateToInfoScreen('이용약관')}
              isLastInSection
              value=""
              hideArrow={false}
            />
          </View>

          <View style={styles.section}>
            <ListItem
              label="로그아웃"
              onPress={handleLogout}
              hideArrow={true} // 화살표 제거
              isFirstInSection
              value="" // value를 빈 문자열로 전달
            />
            <ListItem
              label="계정 탈퇴"
              onPress={() => navigateToEditScreen('계정 탈퇴')}
              hideArrow={true} // 화살표 제거
              isLastInSection
              value="" // value를 빈 문자열로 전달
            />
          </View>
        </ScrollView>
      </KeyboardAvoidingView>

      {/* 닉네임 변경 모달 */}
      <Modal transparent visible={isNicknameModalVisible} animationType="fade" onRequestClose={() => !isSubmitting && setIsNicknameModalVisible(false)}>
        <KeyboardAvoidingView behavior={Platform.OS === "ios" ? "padding" : "height"} style={styles.modalOverlay}>
            <TouchableOpacity style={styles.modalOverlayTouchable} activeOpacity={1} onPressOut={() => !isSubmitting && setIsNicknameModalVisible(false)}>
                <TouchableOpacity activeOpacity={1} style={styles.genericModalContainer}>
                    <Text style={styles.modalTitle}>새로운 닉네임을 입력해주세요.</Text>
                    <View style={styles.textInputContainer}>
                        <TextInput style={styles.textInput} placeholder="최대 12글자" value={newNickname} onChangeText={setNewNickname} maxLength={12} autoFocus/>
                        {newNickname.length > 0 && (<TouchableOpacity onPress={() => setNewNickname('')} style={styles.clearButton} disabled={isSubmitting}><Ionicons name="close-circle" size={20} color="#C7C7CC" /></TouchableOpacity>)}
                    </View>
                    <Text style={styles.modalHelperText}>언제든지 다시 바꿀 수 있어요.</Text>
                    <TouchableOpacity style={[styles.modalButton, (!newNickname.trim() || newNickname.trim().length > 12 || isSubmitting) && styles.modalButtonDisabled]} onPress={handleSaveNickname} disabled={!newNickname.trim() || newNickname.trim().length > 12 || isSubmitting}>
                        <Text style={styles.modalButtonText}>{isSubmitting ? "저장 중..." : "완료"}</Text>
                    </TouchableOpacity>
                </TouchableOpacity>
            </TouchableOpacity>
        </KeyboardAvoidingView>
      </Modal>

      {/* 성별 변경 모달 */}
      <Modal transparent visible={isGenderModalVisible} animationType="fade" onRequestClose={() => !isSubmitting && setIsGenderModalVisible(false)}>
        <TouchableOpacity style={styles.modalOverlayTouchableGender} activeOpacity={1} onPressOut={() => !isSubmitting && setIsGenderModalVisible(false)}>
            <TouchableOpacity activeOpacity={1} style={styles.genderModalContainer}>
                <View style={styles.genderModalHeader}>
                    <TouchableOpacity onPress={() => !isSubmitting && setIsGenderModalVisible(false)} style={styles.modalCloseButton} disabled={isSubmitting}>
                        <Ionicons name="chevron-back-outline" size={28} color="#333" />
                    </TouchableOpacity>
                    <Text style={styles.modalTitle}>성별을 알려주세요.</Text>
                    <View style={{width: 28}} /> 
                </View>
                <Text style={styles.modalSubtitle}>비슷한 사람들이 좋아한 퀘스트를 추천해드려요.</Text>
                <View style={styles.genderOptionsContainer}>
                {GENDER_OPTIONS.map(option => (
                    <TouchableOpacity
                    key={option.value}
                    style={[styles.genderOptionButton, userData?.gender === option.value && styles.genderOptionButtonSelected]}
                    onPress={() => handleSaveGender(option.value)}
                    disabled={isSubmitting}
                    >
                    <Ionicons name={option.icon} size={36} color={userData?.gender === option.value ? '#FFFFFF' : '#555555'} />
                    <Text style={[styles.genderOptionText, userData?.gender === option.value && styles.genderOptionTextSelected]}>{option.label}</Text>
                    </TouchableOpacity>
                ))}
                </View>
                {isSubmitting && <ActivityIndicator style={{marginTop: 15}} color="#007AFF" />}
            </TouchableOpacity>
        </TouchableOpacity>
      </Modal>

      {/* 이메일 변경 모달 */}
      <Modal transparent visible={isEmailModalVisible} animationType="fade" onRequestClose={() => !isSubmitting && setIsEmailModalVisible(false)}>
        <KeyboardAvoidingView behavior={Platform.OS === "ios" ? "padding" : "height"} style={styles.modalOverlay}>
            <TouchableOpacity style={styles.modalOverlayTouchable} activeOpacity={1} onPressOut={() => !isSubmitting && setIsEmailModalVisible(false)}>
                <TouchableOpacity activeOpacity={1} style={styles.genericModalContainer}>
                    <Text style={styles.modalTitle}>새로운 이메일을 입력해주세요.</Text>
                    <TextInput style={styles.textInputFull} placeholder="이메일 주소" value={newEmail} onChangeText={setNewEmail} keyboardType="email-address" autoCapitalize="none" autoFocus/>
                    <TouchableOpacity style={[styles.modalButton, (!newEmail.trim() || !/\S+@\S+\.\S+/.test(newEmail) || isSubmitting) && styles.modalButtonDisabled]} onPress={handleSaveEmail} disabled={!newEmail.trim() || !/\S+@\S+\.\S+/.test(newEmail) || isSubmitting}>
                        <Text style={styles.modalButtonText}>{isSubmitting ? "저장 중..." : "완료"}</Text>
                    </TouchableOpacity>
                </TouchableOpacity>
            </TouchableOpacity>
        </KeyboardAvoidingView>
      </Modal>

      {/* 비밀번호 변경 모달 */}
      <Modal transparent visible={isPasswordModalVisible} animationType="fade" onRequestClose={() => !isSubmitting && setIsPasswordModalVisible(false)}>
        <KeyboardAvoidingView behavior={Platform.OS === "ios" ? "padding" : "height"} style={styles.modalOverlay}>
            <TouchableOpacity style={styles.modalOverlayTouchable} activeOpacity={1} onPressOut={() => !isSubmitting && setIsPasswordModalVisible(false)}>
                <TouchableOpacity activeOpacity={1} style={styles.genericModalContainer}>
                    <Text style={styles.modalTitle}>비밀번호 변경</Text>
                    <TextInput style={styles.textInputFull} placeholder="현재 비밀번호" value={currentPassword} onChangeText={setCurrentPassword} secureTextEntry autoFocus/>
                    <TextInput style={styles.textInputFull} placeholder="새 비밀번호 (8자 이상)" value={newPasswordForUpdate} onChangeText={setNewPasswordForUpdate} secureTextEntry />
                    <TextInput style={styles.textInputFull} placeholder="새 비밀번호 확인" value={confirmNewPassword} onChangeText={setConfirmNewPassword} secureTextEntry />
                    <TouchableOpacity style={[styles.modalButton, (!currentPassword || !newPasswordForUpdate || newPasswordForUpdate.length < 8 || !confirmNewPassword || newPasswordForUpdate !== confirmNewPassword || isSubmitting) && styles.modalButtonDisabled]} onPress={handleSavePassword} disabled={!currentPassword || !newPasswordForUpdate || newPasswordForUpdate.length < 8 || !confirmNewPassword || newPasswordForUpdate !== confirmNewPassword || isSubmitting}>
                        <Text style={styles.modalButtonText}>{isSubmitting ? "변경 중..." : "완료"}</Text>
                    </TouchableOpacity>
                </TouchableOpacity>
            </TouchableOpacity>
        </KeyboardAvoidingView>
      </Modal>

      {/* 혈액형 변경 모달 */}
      <Modal transparent visible={isBloodTypeModalVisible} animationType="fade" onRequestClose={() => !isSubmitting && setIsBloodTypeModalVisible(false)}>
        <TouchableOpacity style={styles.modalOverlayTouchableGender} activeOpacity={1} onPressOut={() => !isSubmitting && setIsBloodTypeModalVisible(false)}>
            <TouchableOpacity activeOpacity={1} style={styles.selectionModalContainer}>
                <View style={styles.selectionModalHeader}>
                    <TouchableOpacity onPress={() => !isSubmitting && setIsBloodTypeModalVisible(false)} style={styles.modalCloseButton} disabled={isSubmitting}><Ionicons name="chevron-back-outline" size={28} color="#333" /></TouchableOpacity>
                    <Text style={styles.modalTitle}>혈액형을 선택해주세요.</Text>
                    <View style={{width: 28}} /> 
                </View>
                <ScrollView style={styles.optionsScrollView}>
                    <View style={styles.optionsContainerGrid}>
                        {BLOOD_TYPE_OPTIONS.map(option => (
                            <TouchableOpacity key={option.value} style={[styles.optionButtonGrid, userData?.bloodType === option.value && styles.optionButtonSelected ]} onPress={() => handleSaveBloodType(option.value)} disabled={isSubmitting} >
                                <Text style={[styles.optionButtonText, userData?.bloodType === option.value && styles.optionButtonTextSelected]}>{option.label}</Text>
                            </TouchableOpacity>
                        ))}
                    </View>
                </ScrollView>
                {isSubmitting && <ActivityIndicator style={{marginTop: 15}} color="#007AFF" />}
            </TouchableOpacity>
        </TouchableOpacity>
      </Modal>

      {/* MBTI 변경 모달 */}
      <Modal transparent visible={isMbtiModalVisible} animationType="fade" onRequestClose={() => !isSubmitting && setIsMbtiModalVisible(false)}>
        <TouchableOpacity style={styles.modalOverlayTouchableGender} activeOpacity={1} onPressOut={() => !isSubmitting && setIsMbtiModalVisible(false)}>
            <TouchableOpacity activeOpacity={1} style={styles.selectionModalContainer}>
                <View style={styles.selectionModalHeader}>
                    <TouchableOpacity onPress={() => !isSubmitting && setIsMbtiModalVisible(false)} style={styles.modalCloseButton} disabled={isSubmitting}><Ionicons name="chevron-back-outline" size={28} color="#333" /></TouchableOpacity>
                    <Text style={styles.modalTitle}>MBTI를 선택해주세요.</Text>
                    <View style={{width: 28}} /> 
                </View>
                <ScrollView style={styles.optionsScrollView}>
                    <View style={styles.optionsContainerGrid}>
                        {MBTI_OPTIONS.map(option => (
                            <TouchableOpacity key={option.value} style={[ styles.optionButtonGrid, {width: '22%'}, userData?.mbti === option.value && styles.optionButtonSelected ]} onPress={() => handleSaveMbti(option.value)} disabled={isSubmitting} >
                                <Text style={[styles.optionButtonText, userData?.mbti === option.value && styles.optionButtonTextSelected]}>{option.label}</Text>
                            </TouchableOpacity>
                        ))}
                    </View>
                </ScrollView>
                {isSubmitting && <ActivityIndicator style={{marginTop: 15}} color="#007AFF" />}
            </TouchableOpacity>
        </TouchableOpacity>
      </Modal>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: '#F0F0F7' },
  header: {
    paddingTop: Platform.OS === 'android' ? Constants.statusBarHeight + 12 : 12,
    paddingBottom: 12,
    paddingHorizontal: 24,
    borderBottomWidth: 1,
    borderBottomColor: '#E5E5EA',
    backgroundColor: 'white',
    alignItems: 'flex-start',
  },
  headerTitle: {
    fontSize: 17,
    fontWeight: '600',
  },
  scrollView: { flex: 1 },
  scrollViewContent: {
    paddingVertical: 5,
    paddingBottom: 120
  },
  section: {
    backgroundColor: '#fff',
    borderRadius: 10,
    marginHorizontal: 15,
    marginTop: 20,
    shadowColor: 'rgba(0, 0, 0, 0.1)',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 1,
    shadowRadius: 3,
    elevation: 2,
  },
  listItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 14,
    paddingHorizontal: 16,
    backgroundColor: 'transparent',
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: '#EFEFF4',
    minHeight: 48,
  },
  listItemFirst: {},
  listItemLast: {
    borderBottomWidth: 0,
  },
  nonTouchableListItem: {},
  label: {
    fontSize: 16,
    color: '#000000',
  },
  valueContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  value: {
    fontSize: 16,
    color: '#8E8E93',
    marginRight: 6,
  },
  placeholderValue: {
    color: '#007AFF',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  loadingText: {
    marginTop: 10,
    fontSize: 16,
    color: '#555'
  },
  errorText: {
    fontSize: 16,
    color: 'red',
    textAlign: 'center',
    marginBottom: 20
  },
  retryButton: {
    backgroundColor: '#007AFF',
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 5
  },
  retryButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: 'bold'
  },
  modalOverlay: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(0, 0, 0, 0.4)'
  },
  modalOverlayTouchable: {
    flex: 1,
    width: '100%',
    justifyContent: 'center',
    alignItems: 'center'
  },
  modalOverlayTouchableGender: {
    flex: 1,
    width: '100%',
    justifyContent: 'flex-end',
    alignItems: 'center',
    backgroundColor: 'rgba(0, 0, 0, 0.4)'
  },
  genericModalContainer: {
    width: '85%',
    maxWidth: 340,
    backgroundColor: 'white',
    borderRadius: 14,
    paddingHorizontal: 24,
    paddingVertical: 20,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 4,
    elevation: 5
  },
  modalTitle: {
    fontSize: 17,
    fontWeight: '600',
    color: '#000',
    marginBottom: 16,
    textAlign: 'center'
  },
  textInputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    width: '100%',
    height: 44,
    backgroundColor: '#F2F2F7',
    borderRadius: 8,
    paddingHorizontal: 12,
    marginBottom: 8
  },
  textInput: {
    flex: 1,
    fontSize: 17,
    color: '#000'
  },
  textInputFull: {
    width: '100%',
    height: 44,
    backgroundColor: '#F2F2F7',
    borderRadius: 8,
    paddingHorizontal: 12,
    fontSize: 17,
    color: '#000',
    marginBottom: 12
  },
  clearButton: {
    paddingLeft: 8
  },
  modalHelperText: {
    fontSize: 13,
    color: '#6C6C70',
    marginBottom: 20,
    textAlign: 'center'
  },
  modalButton: {
    width: '100%',
    backgroundColor: '#007AFF',
    paddingVertical: 12,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: 44,
    marginTop: 8
  },
  modalButtonDisabled: {
    backgroundColor: '#D1D1D6'
  },
  modalButtonText: {
    color: 'white',
    fontSize: 17,
    fontWeight: '600'
  },
  genderModalContainer: {
    width: '100%',
    backgroundColor: 'white',
    borderTopLeftRadius: 16,
    borderTopRightRadius: 16,
    paddingHorizontal: 16,
    paddingTop: 16,
    paddingBottom: Platform.OS === 'ios' ? 50 : 40,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 5
  },
  genderModalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    width: '100%',
    marginBottom: 8
  },
  modalCloseButton: {
    padding: 8
  },
  modalSubtitle: {
    fontSize: 13,
    color: '#8A8A8E',
    marginBottom: 24,
    textAlign: 'center',
    paddingHorizontal: 20
  },
  genderOptionsContainer: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    width: '100%',
    paddingHorizontal: 10
  },
  genderOptionButton: {
    flex: 1,
    alignItems: 'center',
    paddingVertical: 16,
    marginHorizontal: 6,
    borderRadius: 12,
    backgroundColor: '#F2F2F2',
    borderWidth: 1,
    borderColor: '#E5E5EA'
  },
  genderOptionButtonSelected: {
    backgroundColor: '#007AFF',
    borderColor: '#007AFF'
  },
  genderOptionText: {
    marginTop: 8,
    fontSize: 15,
    fontWeight: '500',
    color: '#000000'
  },
  genderOptionTextSelected: {
    color: '#FFFFFF'
  },
  selectionModalContainer: {
    width: '100%',
    backgroundColor: 'white',
    borderTopLeftRadius: 16,
    borderTopRightRadius: 16,
    paddingHorizontal: 16,
    paddingTop: 16,
    paddingBottom: Platform.OS === 'ios' ? 50 : 40,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 5,
    maxHeight: '70%'
  },
  selectionModalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    width: '100%',
    marginBottom: 8
  },
  optionsScrollView: {
    width: '100%',
    maxHeight: 250
  },
  optionsContainerGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'center',
    width: '100%',
    paddingHorizontal: 5
  },
  optionButtonGrid: {
    minWidth: 70,
    maxWidth: 80,
    margin: 6,
    paddingVertical: 12,
    paddingHorizontal: 5,
    borderRadius: 10,
    backgroundColor: '#F2F2F2',
    borderWidth: 1,
    borderColor: '#E5E5EA',
    alignItems: 'center',
    justifyContent: 'center'
  },
  optionButtonSelected: {
    backgroundColor: '#007AFF',
    borderColor: '#007AFF'
  },
  optionButtonText: {
    fontSize: 14,
    fontWeight: '500',
    color: '#000000',
    textAlign: 'center'
  },
  optionButtonTextSelected: {
    color: '#FFFFFF'
  },
});
// app/(tabs)/index.tsx
import { useAuth } from '@/context/AuthContext';
import { useFocusEffect } from '@react-navigation/native';
import axios from 'axios';
import { useRouter } from 'expo-router';
import React, { useCallback, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  Button,
  Image,
  Modal,
  Platform,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import AnimatedCharacter from '../../components/AnimatedCharacter';
import { API_BASE_URL, API_ENDPOINTS } from '../../constants/api';
import { useMusic } from '../../context/MusicContext';

// 아이콘/이미지 경로 정의 (친구분 코드 기준)
const icons = {
  shop: require('../../assets/images/shop_icon.png'),
  hospital: require('../../assets/images/music_icon.png'), // 친구 코드 기준
  settings: require('../../assets/images/set.png'),
  sun: require('../../assets/images/sun_icon.png'),
  egg: require('../../assets/images/Character_1.png'),    // 친구 코드 기준
  flower: require('../../assets/images/Flower.png'),
  seed: require('../../assets/images/seeds.png'),
  // newMessageAlert: require('../../assets/images/message.gif'), // 필요시 경로 확인 후 주석 해제
};

interface QuestionDto {
  questionId: number;
  questionText: string;
  questionType: string;
}
interface NewMessageResponseDto {
  hasNewMessage: boolean;
  newMessage: QuestionDto | null;
}

const MainScreen: React.FC = () => {
  const [currentQuestion, setCurrentQuestion] = useState<QuestionDto | null>(null);
  const [isModalVisible, setIsModalVisible] = useState(false);
  const [userAnswer, setUserAnswer] = useState('');
  const router = useRouter();
  const { isMusicOn, selectedMusic } = useMusic();
  const { token } = useAuth();
  const [isLoadingQuestion, setIsLoadingQuestion] = useState(false);
  const [showNewMessageIndicator, setShowNewMessageIndicator] = useState(false);

  const fetchQuestion = useCallback(async (isManuallyTriggered = false) => {
    if (!token) {
      if (isManuallyTriggered) Alert.alert("오류", "로그인이 필요합니다.");
      return;
    }
    setIsLoadingQuestion(true);
    setShowNewMessageIndicator(false);
    console.log('MainScreen: Fetching question...');
    try {
      const response = await axios.get<NewMessageResponseDto>(`${API_BASE_URL}${API_ENDPOINTS.GET_QUESTION}`);
      console.log('MainScreen: Question API response:', response.data);
      if (response.data?.hasNewMessage && response.data.newMessage) {
        setCurrentQuestion(response.data.newMessage);
        setShowNewMessageIndicator(true);
      } else {
        setCurrentQuestion(null);
        setShowNewMessageIndicator(false);
        if (isManuallyTriggered) Alert.alert("알림", "오늘은 더 이상 새로운 질문이 없어요.");
      }
    } catch (error) {
      console.error("MainScreen: [API 오류] 질문 가져오기 실패:", error);
      setCurrentQuestion(null);
      setShowNewMessageIndicator(false);
      if (isManuallyTriggered) Alert.alert('오류', '질문을 가져오는 중 오류가 발생했습니다.');
    } finally {
      setIsLoadingQuestion(false);
    }
  }, [token]);

  useFocusEffect(useCallback(() => { fetchQuestion(); }, [fetchQuestion]));

  const handleShopPress = () => console.log('Shop pressed');
  const handleHospitalPress = () => console.log('Music Icon (Hospital) pressed');
  const handleSettingsPress = () => router.push('/settings'); // 경로 수정! (settings.tsx)

  const handleOpenQuestionModal = () => {
    if (!currentQuestion) {
      Alert.alert("알림", "표시할 질문이 없거나 로딩 중입니다.", [{ text: "질문 새로고침", onPress: () => fetchQuestion(true) }, { text: "확인" }]);
      return;
    }
    setIsModalVisible(true);
    setShowNewMessageIndicator(false);
  };

  const handleSubmitAnswer = async () => {
    if (!userAnswer.trim()) { Alert.alert('알림', '답변을 입력해주세요.'); return; }
    if (!currentQuestion || !token) return;
    try {
      await axios.post(`${API_BASE_URL}${API_ENDPOINTS.SAVE_ANSWER}`, { questionId: currentQuestion.questionId, answerText: userAnswer });
      Alert.alert('기록 완료!', '네 이야기가 기록되었어.');
      setUserAnswer('');
      setIsModalVisible(false);
    } catch (error) { Alert.alert('오류', '답변 저장 중 오류가 발생했습니다.'); }
  };

  const handleCancelAnswer = () => { setUserAnswer(''); setIsModalVisible(false); };

  const renderCharacterContent = () => (
    <View style={styles.characterContainer}>
      <AnimatedCharacter source={icons.egg} style={styles.characterImage} />
      {showNewMessageIndicator && currentQuestion && (
        <TouchableOpacity style={styles.newMessageIconContainer} onPress={handleOpenQuestionModal}>
          <View style={styles.tempNewMessageIcon}><Text style={styles.tempNewMessageIconText}>!</Text></View>
        </TouchableOpacity>
      )}
    </View>
  );

  const renderMainContent = () => {
    let messageArea;
    if (isLoadingQuestion && !isModalVisible) {
      messageArea = <ActivityIndicator size="large" color="#007AFF" style={{ marginTop: 20 }} />;
    } else if (showNewMessageIndicator && currentQuestion) {
      messageArea = (
        <View style={styles.messagePromptContainer}>
          <Text style={styles.messagePromptText}>새로운 이야기가 도착했어요!</Text>
          <Text style={styles.messagePromptHintText}>(캐릭터 위의 아이콘을 눌러 확인해보세요)</Text>
        </View>
      );
    } else if (currentQuestion && !isModalVisible && !showNewMessageIndicator) {
      messageArea = (
        <TouchableOpacity style={styles.questionBubble} onPress={handleOpenQuestionModal}>
          <Text style={styles.questionText}>{currentQuestion.questionText}</Text>
        </TouchableOpacity>
      );
    } else {
      messageArea = (
        <View style={styles.noQuestionContainer}>
          <Text style={styles.noQuestionText}>오늘은 어떤 이야기를 해볼까요?</Text>
          <TouchableOpacity onPress={() => fetchQuestion(true)} style={styles.retryButton}>
            <Text style={styles.retryButtonText}>새로운 이야기 찾기</Text>
          </TouchableOpacity>
        </View>
      );
    }
    return (<><View>{renderCharacterContent()}</View>{messageArea}</>); // 캐릭터 항상 렌더링
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <View style={styles.header}>
        <View style={styles.headerLeft}>
          <View style={styles.coinContainer}>
            <View style={styles.coinContent}>
              <Image source={icons.seed} style={styles.coinImage} />
              <Text style={styles.coinText}>210</Text>
            </View>
          </View>
        </View>
        <View style={styles.headerRight}>
          <TouchableOpacity onPress={handleShopPress} style={styles.iconButton}>
            <View style={styles.iconShadow}><Image source={icons.shop} style={styles.headerIcon} /></View>
          </TouchableOpacity>
          <TouchableOpacity onPress={handleHospitalPress} style={styles.iconButton}>
            <View style={styles.iconShadow}><Image source={icons.hospital} style={styles.headerIcon} /></View>
          </TouchableOpacity>
          <TouchableOpacity onPress={handleSettingsPress} style={styles.iconButton}>
            <View style={styles.iconShadow}><Image source={icons.settings} style={styles.headerIcon} /></View>
          </TouchableOpacity>
        </View>
      </View>
      <View style={styles.content}>
        <Image source={icons.sun} style={styles.sunIcon} resizeMode="contain" />
        {renderMainContent()}
      </View>
      {isModalVisible && currentQuestion && (
         <View style={StyleSheet.absoluteFillObject} pointerEvents="auto">
          <Modal animationType="fade" transparent={true} visible={isModalVisible} onRequestClose={handleCancelAnswer}>
            <TouchableOpacity style={styles.modalOverlay} activeOpacity={1} onPress={handleCancelAnswer}>
              <TouchableOpacity style={styles.modalContent} activeOpacity={1} onPress={() => {}}>
                <Text style={styles.modalQuestionText}>{currentQuestion.questionText}</Text>
                <TextInput style={styles.modalTextInput} placeholder="네 생각을 편하게 이야기해줘..." placeholderTextColor="#888" multiline numberOfLines={4} value={userAnswer} onChangeText={setUserAnswer}/>
                <View style={styles.modalButtonContainer}>
                  <Button title="다음에 할래" onPress={handleCancelAnswer} color="#FF6347" />
                  <View style={{width: 20}} />
                  <Button title="마음 속에 담아둘게" onPress={handleSubmitAnswer} />
                </View>
              </TouchableOpacity>
            </TouchableOpacity>
          </Modal>
        </View>
      )}
    </SafeAreaView>
  );
};

// 스타일 (이전 답변의 병합된 스타일 사용)
const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: '#E0F7FA' },
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingHorizontal: 15, paddingTop: Platform.OS === 'android' ? 25 : 10, height: 60 },
  headerLeft: { flexDirection: 'row' },
  headerRight: { flexDirection: 'row', alignItems: 'center' },
  coinContainer: { backgroundColor: 'rgba(255, 255, 255, 0.3)', paddingHorizontal: 12, paddingVertical: 6, borderRadius: 15, marginLeft: 15 },
  coinContent: { flexDirection: 'row', alignItems: 'center' },
  coinImage: { width: 18, height: 18, marginRight: 6 },
  coinText: { fontSize: 16, fontWeight: '600', color: '#333' },
  iconButton: { padding: 2, marginLeft: 10 },
  headerIcon: { width: 35, height: 35, resizeMode: 'contain' },
  iconShadow: { backgroundColor: 'rgba(255, 255, 255, 0.3)', borderRadius: 30, padding: 4 },
  content: { flex: 1, alignItems: 'center', justifyContent: 'center', paddingBottom: 50 },
  sunIcon: { width: 40, height: 40, position: 'absolute', top: 20, left: 20, opacity: 0.8 },
  characterContainer: { position: 'relative', alignItems: 'center', marginBottom: 20 },
  characterImage: { width: 150, height: 150 },
  newMessageIconContainer: { position: 'absolute', top: -5, right: -5, zIndex: 1 },
  tempNewMessageIcon: { width: 32, height: 32, borderRadius: 16, backgroundColor: 'red', justifyContent: 'center', alignItems: 'center', borderWidth: 2, borderColor: 'white' },
  tempNewMessageIconText: { color: 'white', fontWeight: 'bold', fontSize: 18 },
  messagePromptContainer: { backgroundColor: 'rgba(255, 255, 255, 0.9)', paddingVertical: 15, paddingHorizontal: 25, borderRadius: 20, alignItems: 'center', shadowColor: "#000", shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.15, shadowRadius: 3.84, elevation: 3, marginHorizontal: 30, marginBottom: 10 },
  messagePromptText: { fontSize: 17, fontWeight: '600', color: '#336699', textAlign: 'center' },
  messagePromptHintText: { fontSize: 13, color: '#555', textAlign: 'center', marginTop: 5 },
  questionBubble: { backgroundColor: '#FFFFFF', paddingVertical: 12, paddingHorizontal: 20, borderRadius: 20, marginHorizontal: 40, alignItems: 'center', justifyContent: 'center', minHeight: 60, shadowColor: "#000", shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.1, shadowRadius: 2, elevation: 2, marginBottom: 10 },
  questionText: { fontSize: 16, color: '#333333', textAlign: 'center', lineHeight: 22 },
  noQuestionContainer: { alignItems: 'center', justifyContent: 'center', padding: 20, backgroundColor: 'rgba(255, 255, 255, 0.8)', borderRadius: 15, marginHorizontal: 30, marginBottom: 10 },
  noQuestionText: { fontSize: 17, color: '#527289', textAlign: 'center', marginBottom: 20, lineHeight: 24 },
  retryButton: { backgroundColor: '#FFB74D', paddingVertical: 12, paddingHorizontal: 25, borderRadius: 25, elevation: 2, shadowColor: '#000', shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.2, shadowRadius: 2 },
  retryButtonText: { color: 'white', fontSize: 16, fontWeight: 'bold' },
  modalOverlay: { flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: 'rgba(0, 0, 0, 0.55)' },
  modalContent: { width: '90%', maxWidth: 380, backgroundColor: 'white', borderRadius: 20, padding: 25, alignItems: 'center', shadowColor: '#000', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.30, shadowRadius: 4.65, elevation: 8 },
  modalQuestionText: { fontSize: 18, fontWeight: '600', color: '#333', marginBottom: 25, textAlign: 'center', lineHeight: 26 },
  modalTextInput: { width: '100%', minHeight: 100, maxHeight: 150, padding: 15, backgroundColor: '#F9F9F9', borderColor: '#D0D0D0', borderWidth: 1, borderRadius: 12, textAlignVertical: 'top', fontSize: 16, lineHeight: 22, color: '#333', marginBottom: 30 },
  modalButtonContainer: { flexDirection: 'row', justifyContent: 'space-around', width: '100%' },
});

export default MainScreen;
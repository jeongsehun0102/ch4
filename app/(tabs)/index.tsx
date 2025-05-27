// app/(tabs)/index.tsx
import { useAuth } from '@/context/AuthContext';
import { useFocusEffect } from '@react-navigation/native'; // 화면 포커스 감지
import axios, { isAxiosError } from 'axios';
import React, { useCallback, useState } from 'react';
import {
  ActivityIndicator // 로딩 인디케이터 추가
  ,

  Alert,
  Button,
  Image,
  Modal,
  Platform,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import AnimatedCharacter from '../../components/AnimatedCharacter';
import { API_BASE_URL, API_ENDPOINTS } from '../../constants/api';

// 아이콘/이미지 경로 정의
const icons = {
  shop: require('../../assets/images/shop_icon.png'),
  hospital: require('../../assets/images/hospital_icon.png'),
  notification: require('../../assets/images/alarm.png'),
  settings: require('../../assets/images/set.png'),
  sun: require('../../assets/images/sun_icon.png'),
  egg: require('../../assets/images/Character_1.png'),
  flower: require('../../assets/images/Flower.png'),
  // 새로운 메시지 알림 아이콘 (실제 파일명으로 변경해주세요)
  newMessageAlert: require('../../assets/images/message.gif'), // 예시 경로입니다. 실제 파일로 교체 필요.
                                                                            // 없다면 임시로 다른 아이콘을 사용하거나, 아래에서 텍스트로 대체할 수 있습니다.
};

// DTO 타입 정의
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
  const [isLoadingQuestion, setIsLoadingQuestion] = useState(false);
  const [showNewMessageIndicator, setShowNewMessageIndicator] = useState(false); // 새 메시지 알림 아이콘 표시 상태
  const { token } = useAuth();

  const fetchQuestion = useCallback(async (isManuallyTriggered = false) => {
    if (!token) {
      if (isManuallyTriggered) Alert.alert("오류", "로그인이 필요합니다.");
      else console.log("fetchQuestion: 로그인이 필요하여 질문을 가져오지 않습니다.");
      return;
    }
    setIsLoadingQuestion(true);
    setShowNewMessageIndicator(false); // 일단 숨기고 시작
    console.log('Fetching question from backend...');
    try {
      const response = await axios.get<NewMessageResponseDto>(`${API_BASE_URL}${API_ENDPOINTS.GET_QUESTION}`);
      console.log('[API 응답] 질문 가져오기:', response.data);

      if (response.data) {
        if (response.data.hasNewMessage && response.data.newMessage) {
          setCurrentQuestion(response.data.newMessage);
          setShowNewMessageIndicator(true); // 새로운 메시지가 있으면 알림 아이콘 표시
        } else {
          setCurrentQuestion(null); // 새로운 메시지 없음
          setShowNewMessageIndicator(false);
          if (isManuallyTriggered) { // 사용자가 직접 "새로운 질문 받기"를 눌렀는데 새 질문이 없을 때
             Alert.alert("알림", "오늘은 더 이상 새로운 질문이 없어요. 내일 다시 만나요!");
          }
        }
      } else {
        setCurrentQuestion(null);
        setShowNewMessageIndicator(false);
        if (isManuallyTriggered) Alert.alert("오류", "질문을 가져오지 못했습니다.");
      }
    } catch (error) {
      console.error("[API 오류] 질문 가져오기 실패:", error);
      let errorMessage = '질문을 가져오는 중 오류가 발생했습니다.';
      if (isAxiosError(error)) {
        if (error.response) errorMessage = `질문 가져오기 실패: ${error.response.data?.message || error.response.data || error.response.status}`;
        else if (error.request) errorMessage = '서버로부터 응답을 받을 수 없습니다. 네트워크를 확인해주세요.';
      }
      if (isManuallyTriggered) Alert.alert('오류', errorMessage);
      setCurrentQuestion(null);
      setShowNewMessageIndicator(false);
    } finally {
      setIsLoadingQuestion(false);
    }
  }, [token]); // token이 바뀔 때마다 fetchQuestion 함수 자체를 재생성

  // 화면이 포커스될 때마다 질문을 가져오도록 수정 (앱 실행 시, 탭 이동 시)
  useFocusEffect(
    useCallback(() => {
      console.log("MainScreen focused, fetching question...");
      fetchQuestion();

      return () => {
        // 화면을 벗어날 때 정리할 내용이 있다면 여기에 작성
        console.log("MainScreen unfocused");
        // setIsLoadingQuestion(false); // 포커스 벗어날 때 로딩 상태 초기화 (선택적)
      };
    }, [fetchQuestion]) // fetchQuestion 함수가 token에 의존하므로, token이 바뀌면 이 effect도 재실행됨
  );


  const handleShopPress = () => console.log("Shop pressed");
  const handleHospitalPress = () => console.log("Hospital pressed");
  const handleNotificationPress = () => console.log("Notification pressed");
  const handleSettingsPress = () => console.log("Settings pressed");

  // 새로운 메시지 아이콘 또는 질문 말풍선 클릭 시
  const handleOpenQuestionModal = () => {
    if (!currentQuestion) {
      Alert.alert("알림", "표시할 질문이 없거나 로딩 중입니다.", [
        { text: "질문 새로고침", onPress: () => fetchQuestion(true) },
        { text: "확인" }
      ]);
      return;
    }
    setIsModalVisible(true);
    setShowNewMessageIndicator(false); // 모달이 열리면 알림 아이콘 숨김
  };

  const handleSubmitAnswer = async () => {
    if (!userAnswer.trim()) {
      Alert.alert("알림", "답변을 입력해주세요.");
      return;
    }
    if (!currentQuestion) {
      Alert.alert("오류", "답변할 질문이 없습니다.");
      return;
    }
    if (!token) {
      Alert.alert("오류", "답변을 저장하려면 로그인이 필요합니다.");
      return;
    }

    console.log(`Question ID: ${currentQuestion.questionId}, Answer: "${userAnswer}"`);
    // 답변 저장 API 호출 로직 (이전과 동일)
    try {
      const answerData = {
        questionId: currentQuestion.questionId,
        answerText: userAnswer,
      };
      await axios.post(`${API_BASE_URL}${API_ENDPOINTS.SAVE_ANSWER}`, answerData);
      Alert.alert("기록 완료!", "네 이야기가 기록되었어.");
      setUserAnswer('');
      setIsModalVisible(false);
      // 답변 후 새 질문을 바로 가져오지는 않음. 사용자가 원할 때 가져오거나, 다음 포커스 시 가져옴.
      // fetchQuestion(); // 필요하다면 주석 해제
    } catch (error) {
      console.error("[API 오류] 답변 저장 실패:", error);
      let errorMessage = '답변을 저장하는 중 오류가 발생했습니다.';
       if (isAxiosError(error)) {
        if (error.response) errorMessage = `답변 저장 실패: ${error.response.data?.message || error.response.data || error.response.status}`;
        else if (error.request) errorMessage = '서버로부터 응답을 받을 수 없습니다.';
      }
      Alert.alert('오류', errorMessage);
    }
  };

  const handleCancelAnswer = () => {
    setUserAnswer('');
    setIsModalVisible(false);
    // 중요: 사용자가 모달을 닫았을 때, 아직 currentQuestion이 있다면
    // 다시 알림 아이콘을 표시할지 여부. 현재는 표시하지 않음 (이미 확인한 것으로 간주)
    // 만약 다시 표시하려면 아래 주석 해제 (단, currentQuestion이 null이 아니어야 함)
    // if (currentQuestion) {
    //   setShowNewMessageIndicator(true);
    // }
  };

  const renderCharacterContent = () => {
    return (
      <View style={styles.characterContainer}>
        <AnimatedCharacter
          source={icons.egg}
          style={styles.characterImage}
        />
        {/* 새로운 메시지 알림 아이콘 */}
        {showNewMessageIndicator && currentQuestion && (
          <TouchableOpacity style={styles.newMessageIconContainer} onPress={handleOpenQuestionModal}>
            {/* 실제 아이콘 이미지가 있다면 Image 컴포넌트 사용 */}
            {/* <Image source={icons.newMessageAlert} style={styles.newMessageIcon} /> */}
            {/* 임시 텍스트 아이콘 */}
            <View style={styles.tempNewMessageIcon}>
              <Text style={styles.tempNewMessageIconText}>!</Text>
            </View>
          </TouchableOpacity>
        )}
      </View>
    );
  };

  const renderMainContent = () => {
    if (isLoadingQuestion && !isModalVisible) { // 모달이 열려있을 때는 메인 화면 로딩 인디케이터를 보여주지 않음
      return <ActivityIndicator size="large" color="#0000ff" style={{ marginTop: 20 }} />;
    }

    // 캐릭터와 (조건부) 메시지 아이콘 렌더링
    let messageArea;
    if (showNewMessageIndicator && currentQuestion) {
      // 새 메시지가 있고 아이콘이 표시될 때는, 말풍선보다는 아이콘 클릭을 유도
      messageArea = (
        <View style={styles.messagePromptContainer}>
            <Text style={styles.messagePromptText}>새로운 이야기가 도착했어요!</Text>
            <Text style={styles.messagePromptHintText}>(캐릭터 위의 아이콘을 눌러 확인해보세요)</Text>
        </View>
      );
    } else if (currentQuestion && !showNewMessageIndicator && !isModalVisible) {
        // 새 메시지 아이콘은 없지만 (이미 확인했거나, 원래 새 메시지가 아니었거나)
        // currentQuestion이 있고 모달이 닫혀있을 때 -> 질문 내용을 보여주되, 클릭은 모달 열기
        // 이 경우는 사용자가 모달을 닫은 직후거나, 원래부터 hasNewMessage가 false였던 경우
        // 좀 더 고민 필요: 이 때 말풍선을 계속 보여줄 것인가?
        // 여기서는 '오늘은 어떤 이야기를 해볼까요?' 같은 기본 메시지로 대체
         messageArea = (
            <View style={styles.questionBubble}>
              <Text style={styles.questionText}>무슨 생각을 하고 있니?</Text>
              <TouchableOpacity onPress={() => fetchQuestion(true)} style={styles.smallRetryButton}>
                <Text style={styles.smallRetryButtonText}>다른 질문?</Text>
              </TouchableOpacity>
            </View>
         );
    }
    else {
      // 로딩도 아니고, 보여줄 질문도 없을 때 (currentQuestion이 null)
      messageArea = (
        <View style={styles.noQuestionContainer}>
          <Text style={styles.noQuestionText}>오늘은 어떤 이야기를 해볼까요?</Text>
          <TouchableOpacity onPress={() => fetchQuestion(true)} style={styles.retryButton}>
            <Text style={styles.retryButtonText}>새로운 이야기 찾기</Text>
          </TouchableOpacity>
        </View>
      );
    }

    return (
        <>
            {renderCharacterContent()}
            {messageArea}
        </>
    );
  };


  return (
    <SafeAreaView style={styles.safeArea}>
      <View style={styles.header}>
        <View style={styles.headerLeft}>
            <TouchableOpacity onPress={handleShopPress} style={styles.iconButton}><Image source={icons.shop} style={styles.headerIcon} /></TouchableOpacity>
            <TouchableOpacity onPress={handleHospitalPress} style={styles.iconButton}><Image source={icons.hospital} style={styles.headerIcon} /></TouchableOpacity>
        </View>
        <View style={styles.headerRight}>
          <TouchableOpacity onPress={handleNotificationPress} style={styles.iconButton}><Image source={icons.notification} style={styles.headerIcon} /></TouchableOpacity>
          <TouchableOpacity onPress={handleSettingsPress} style={styles.iconButton}><Image source={icons.settings} style={styles.headerIcon} /></TouchableOpacity>
        </View>
      </View>

      <View style={styles.content}>
        {icons.sun && <Image source={icons.sun} style={styles.sunIcon} resizeMode="contain" /> }
        {renderMainContent()}
      </View>

      {isModalVisible && currentQuestion && ( // 모달은 currentQuestion이 있을 때만 렌더링
        <View style={StyleSheet.absoluteFillObject} pointerEvents="auto">
          <Modal
            animationType="fade"
            transparent={true}
            visible={isModalVisible}
            onRequestClose={handleCancelAnswer}
          >
            <TouchableOpacity
              style={styles.modalOverlay}
              activeOpacity={1}
              onPress={handleCancelAnswer}
            >
              <TouchableOpacity
                style={styles.modalContent}
                activeOpacity={1}
                onPress={() => {}} // 모달 내부 클릭 시 배경 이벤트 전파 방지
              >
                <Text style={styles.modalQuestionText}>{currentQuestion.questionText}</Text>
                <TextInput
                  style={styles.modalTextInput}
                  placeholder="네 생각을 편하게 이야기해줘..."
                  placeholderTextColor="#888"
                  multiline={true}
                  numberOfLines={4}
                  value={userAnswer}
                  onChangeText={setUserAnswer}
                />
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

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: '#E0F7FA', // 연한 하늘색 배경
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 15,
    paddingTop: Platform.OS === 'android' ? 25 : 10, // 상태바 높이 고려
    height: 60, // 헤더 높이 고정
  },
  headerLeft: { flexDirection: 'row' },
  headerRight: { flexDirection: 'row' },
  iconButton: { padding: 10 },
  headerIcon: { width: 28, height: 28, resizeMode: 'contain' },
  content: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center', // 주 컨텐츠를 중앙으로
    paddingBottom: 80, // 하단 탭바와의 간격 및 여백
  },
  sunIcon: {
    width: 50,
    height: 50,
    position: 'absolute',
    top: 20,
    left: 20,
    opacity: 0.8,
  },
  characterContainer: { // 캐릭터와 알림 아이콘을 묶는 컨테이너
    position: 'relative', // 알림 아이콘의 absolute 위치 기준점
    alignItems: 'center',
    marginBottom: 20,
  },
  characterImage: {
    width: 160, // 캐릭터 크기 약간 키움
    height: 160,
  },
  newMessageIconContainer: { // 새 메시지 아이콘 컨테이너
    position: 'absolute',
    top: -5, // 캐릭터 이미지 위로 살짝
    right: -5, // 캐릭터 이미지 오른쪽으로 살짝
    zIndex: 1, // 다른 요소 위에 보이도록
  },
  // newMessageIcon: { // 실제 이미지 아이콘 스타일
  //   width: 40,
  //   height: 40,
  //   resizeMode: 'contain',
  // },
  tempNewMessageIcon: { // 임시 텍스트 아이콘 스타일
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: 'red',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: 'white',
  },
  tempNewMessageIconText: {
    color: 'white',
    fontWeight: 'bold',
    fontSize: 18,
  },
  messagePromptContainer: { // 새 메시지 도착 안내 문구 컨테이너
    backgroundColor: 'rgba(255, 255, 255, 0.9)',
    paddingVertical: 15,
    paddingHorizontal: 25,
    borderRadius: 20,
    alignItems: 'center',
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.15,
    shadowRadius: 3.84,
    elevation: 3,
  },
  messagePromptText: {
    fontSize: 17,
    fontWeight: '600',
    color: '#336699', // 좀 더 부드러운 파란색 계열
    textAlign: 'center',
  },
  messagePromptHintText: {
    fontSize: 13,
    color: '#555',
    textAlign: 'center',
    marginTop: 5,
  },
  questionBubble: { // 기존 질문 말풍선 (다른 용도로 사용될 때)
    backgroundColor: '#FFFFFF',
    paddingVertical: 15,
    paddingHorizontal: 20,
    borderRadius: 20,
    marginHorizontal: 30,
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: 60,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  questionText: {
    fontSize: 16,
    color: '#4A4A4A',
    textAlign: 'center',
    lineHeight: 22,
    marginBottom: 8,
  },
  noQuestionContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    padding: 20,
    backgroundColor: 'rgba(255, 255, 255, 0.7)',
    borderRadius: 15,
  },
  noQuestionText: {
    fontSize: 17,
    color: '#527289',
    textAlign: 'center',
    marginBottom: 20,
    lineHeight: 24,
  },
  retryButton: {
    backgroundColor: '#FFB74D', // 좀 더 부드러운 주황색
    paddingVertical: 12,
    paddingHorizontal: 25,
    borderRadius: 25,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.2,
    shadowRadius: 2,
  },
  retryButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: 'bold',
  },
  smallRetryButton: { // "다른 질문?" 버튼
    marginTop: 8,
    backgroundColor: '#AED581', // 연두색
    paddingVertical: 6,
    paddingHorizontal: 12,
    borderRadius: 15,
  },
  smallRetryButtonText: {
    color: 'white',
    fontSize: 13,
    fontWeight: '500',
  },
  // 모달 스타일 (이전과 유사, 필요시 조정)
  modalOverlay: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(0, 0, 0, 0.5)', // 반투명 배경 강화
  },
  modalContent: {
    width: '90%', // 너비 좀 더 넓게
    maxWidth: 380, // 최대 너비 제한
    backgroundColor: 'white',
    borderRadius: 20, // 더 둥글게
    padding: 25, // 패딩 증가
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4, }, // 그림자 강조
    shadowOpacity: 0.30,
    shadowRadius: 4.65,
    elevation: 8,
  },
  modalQuestionText: {
    fontSize: 18, // 글꼴 크기 증가
    fontWeight: '600',
    color: '#333',
    marginBottom: 25, // 간격 증가
    textAlign: 'center',
    lineHeight: 26,
  },
  modalTextInput: {
    width: '100%',
    minHeight: 100, // 최소 높이 증가
    maxHeight: 150,
    padding: 15, // 패딩 증가
    backgroundColor: '#F9F9F9', // 배경색 약간 변경
    borderColor: '#D0D0D0',
    borderWidth: 1,
    borderRadius: 12, // 더 둥글게
    textAlignVertical: 'top',
    fontSize: 16, // 글꼴 크기 증가
    lineHeight: 22,
    color: '#333',
    marginBottom: 30, // 간격 증가
  },
  modalButtonContainer: {
    flexDirection: 'row',
    justifyContent: 'space-around', // 버튼 사이 간격 균등하게
    width: '100%',
  },
});

export default MainScreen;
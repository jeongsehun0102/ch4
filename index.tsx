// app/(tabs)/index.tsx
import React, { useEffect, useState } from 'react';
import {
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
import AnimatedCharacter from '../../components/AnimatedCharacter'; // 경로 확인

// 아이콘/이미지 경로 정의
const icons = {
  shop: require('../../assets/images/shop_icon.png'),
  hospital: require('../../assets/images/hospital_icon.png'),
  notification: require('../../assets/images/alarm.png'),
  settings: require('../../assets/images/set.png'),
  sun: require('../../assets/images/sun_icon.png'),
  egg: require('../../assets/images/Character_1.png'),
  flower: require('../../assets/images/Flower.png'),
};

// 임시 질문 데이터
const sampleQuestions = [
  { id: 1, text: "혹시 고민하는 걱정거리가 있어?" },
  { id: 2, text: "오늘 가장 즐거웠던 순간은 언제였나요?" },
  { id: 3, text: "지금 가장 먹고 싶은 음식은 무엇인가요?" },
];

const MainScreen: React.FC = () => {
  const [currentQuestion, setCurrentQuestion] = useState<{ id: number; text: string } | null>(null);
  const [isModalVisible, setIsModalVisible] = useState(false);
  const [userAnswer, setUserAnswer] = useState('');

  useEffect(() => {
    const randomIndex = Math.floor(Math.random() * sampleQuestions.length);
    setCurrentQuestion(sampleQuestions[randomIndex]);
  }, []);

  const handleShopPress = () => console.log("Shop pressed");
  const handleHospitalPress = () => console.log("Hospital pressed");
  const handleNotificationPress = () => console.log("Notification pressed");
  const handleSettingsPress = () => console.log("Settings pressed");

  const handleQuestionPress = () => {
    console.log("질문 눌림! isModalVisible을 true로 변경 시도");
    setIsModalVisible(true);
  };

  const handleSubmitAnswer = () => {
    if (!userAnswer.trim()) {
      Alert.alert("알림", "답변을 입력해주세요.");
      return;
    }
    console.log(`Question ID: ${currentQuestion?.id}, Answer: "${userAnswer}"`);
    Alert.alert("기록 완료!", "네 이야기가 기록되었어.");
    setUserAnswer('');
    setIsModalVisible(false);
  };

  const handleCancelAnswer = () => {
    setUserAnswer('');
    setIsModalVisible(false);
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      {/* 상단 헤더 영역 */}
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

      {/* 메인 컨텐츠 영역 */}
      <View style={styles.content}>
        {icons.sun && <Image source={icons.sun} style={styles.sunIcon} resizeMode="contain" /> }
        <AnimatedCharacter
          source={icons.egg}
          style={styles.characterImage}
        />
        {currentQuestion && (
          <TouchableOpacity style={styles.questionBubble} onPress={handleQuestionPress}>
            <Text style={styles.questionText}>{currentQuestion.text}</Text>
          </TouchableOpacity>
        )}
      </View>

      {/* === 답변 입력 모달을 담을 View === */}
      <View style={StyleSheet.absoluteFillObject} pointerEvents={isModalVisible ? "auto" : "box-none"}>
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
              style={styles.modalContent} // 여기가 수정된 부분입니다.
              activeOpacity={1}
              onPress={() => { /* 모달 내부 컨텐츠 클릭 시 배경의 onPress가 실행되지 않도록 함 */ }}
            >
              {currentQuestion && <Text style={styles.modalQuestionText}>{currentQuestion.text}</Text>}
              <TextInput
                style={styles.modalTextInput}
                placeholder="여기에 답변을 입력하세요..."
                placeholderTextColor="#888"
                multiline={true}
                numberOfLines={4} // Android에서 초기 줄 수 제안, 실제 높이는 스타일에 따름
                value={userAnswer}
                onChangeText={setUserAnswer}
              />
              <View style={styles.modalButtonContainer}>
                <Button title="취소" onPress={handleCancelAnswer} color="#FF6347" />
                <View style={{width: 20}} />
                <Button title="기록하기" onPress={handleSubmitAnswer} />
              </View>
            </TouchableOpacity>
          </TouchableOpacity>
        </Modal>
      </View>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: '#E0F7FA',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 15,
    paddingTop: Platform.OS === 'android' ? 25 : 10,
    height: 60,
  },
  headerLeft: { flexDirection: 'row' },
  headerRight: { flexDirection: 'row' },
  iconButton: { padding: 10 },
  headerIcon: { width: 26, height: 26, resizeMode: 'contain' },
  content: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingBottom: 50,
  },
  sunIcon: {
    width: 40,
    height: 40,
    position: 'absolute',
    top: 20,
    left: 20,
  },
  characterImage: {
    width: 150,
    height: 150,
    marginBottom: 20,
  },
  questionBubble: {
    backgroundColor: '#FFFFFF',
    paddingVertical: 12,
    paddingHorizontal: 20,
    borderRadius: 20,
    marginHorizontal: 40,
    alignItems: 'center',
    justifyContent: 'center',
    // 그림자가 필요하면 아래 주석 해제 또는 값 조절
    // shadowColor: "#000",
    // shadowOffset: { width: 0, height: 2 },
    // shadowOpacity: 0.15,
    // shadowRadius: 3.84,
    // elevation: 3,
  },
  questionText: {
    fontSize: 16,
    color: '#333333',
    textAlign: 'center',
    lineHeight: 22,
  },
  modalOverlay: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'transparent', // 배경 투명 유지
  },
  modalContent: { // <--- 이 부분의 크기 및 그림자 관련 스타일 수정
    width: 300,       // 너비는 유지하거나 필요시 '85%' 등으로 변경 가능
    // height: 450,   // 고정 높이 대신 내부 컨텐츠와 padding에 의해 결정되도록 주석 처리 또는 삭제
    minHeight: 280,  // 최소 높이를 지정하여 너무 작아지지 않도록 함 (값 조절)
    maxHeight: '80%', // 화면 높이의 80%를 넘지 않도록 (선택 사항)
    backgroundColor: 'white',
    borderRadius: 15,
    paddingVertical: 25,    // 상하 패딩
    paddingHorizontal: 20,  // 좌우 패딩
    alignItems: 'center',
    // 그림자가 필요 없다면 아래 속성들을 모두 제거하거나 주석 처리합니다.
    // shadowColor: '#000',
    // shadowOffset: { width: 0, height: 2, },
    // shadowOpacity: 0.25,
    // shadowRadius: 3.84,
    // elevation: 0, // 안드로이드 그림자 제거 (0 또는 속성 자체를 제거)
  },
  modalQuestionText: {
    fontSize: 17,
    fontWeight: '600',
    color: '#333',
    marginBottom: 20, // 텍스트 입력창과의 간격
    textAlign: 'center',
  },
  modalTextInput: {
    width: '100%',
    minHeight: 80,   // 최소 높이
    maxHeight: 120,  // 최대 높이 (스크롤이 필요하면 ScrollView로 감싸야 함)
    padding: 12,
    backgroundColor: '#F8F8F8',
    borderColor: '#E0E0E0',
    borderWidth: 1,
    borderRadius: 10,
    textAlignVertical: 'top',
    fontSize: 15,
    lineHeight: 20,
    color: '#333',
    marginBottom: 25, // 버튼 컨테이너와의 간격
  },
  modalButtonContainer: {
    flexDirection: 'row',
    justifyContent: 'space-evenly', // 버튼 사이에 공간을 균등하게 배분
    width: '100%',
    // marginTop: 10, // modalTextInput의 marginBottom으로 간격 조절
  },
});

export default MainScreen;
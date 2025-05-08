// app/(tabs)/index.tsx (알 이미지에 애니메이션 적용 버전)
import React from 'react';
import { Image, StyleSheet, TouchableOpacity, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
// === AnimatedCharacter 컴포넌트 import ===
// 경로는 실제 위치에 맞게 수정하세요!
import AnimatedCharacter from '../../components/AnimatedCharacter';
// =====================================

// 아이콘/이미지 경로 정의
const icons = {
  shop: require('../../assets/images/shop_icon.png'),
  hospital: require('../../assets/images/hospital_icon.png'),
  notification: require('../../assets/images/alarm.png'),
  settings: require('../../assets/images/set.png'),
  sun: require('../../assets/images/sun_icon.png'), // sun_icon.png 파일이 assets/images 에 있다고 가정
  egg: require('../../assets/images/Character_1.png'), // 알 이미지 경로
  flower: require('../../assets/images/Flower.png'),
};

const MainScreen: React.FC = () => {
  const handleShopPress = () => console.log("Shop pressed");
  const handleHospitalPress = () => console.log("Hospital pressed");
  const handleNotificationPress = () => console.log("Notification pressed");
  const handleSettingsPress = () => console.log("Settings pressed");

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
         {/* 태양 아이콘 */}
         {icons.sun && <Image source={icons.sun} style={styles.sunIcon} resizeMode="contain" /> }

         {/* === 중앙 알 이미지 (AnimatedCharacter 사용) === */}
         <AnimatedCharacter
            source={icons.egg}
            style={styles.eggImage}
            // 필요하다면 shakeIntensity, shakeDuration, delay 값 조절 가능
            // shakeIntensity={3} // 조금 더 강하게 흔들기?
            // delay={0} // 바로 시작
         />
         {/* ============================================ */}

         {/* 하단 꽃 이미지 */}
         <View style={styles.flowerRow}>
           {Array.from({ length: 6 }).map((_, index) => (
             <Image key={index} source={icons.flower} style={styles.flowerImage} resizeMode="contain" />
           ))}
         </View>
      </View>
    </SafeAreaView>
  );
};

// 스타일 정의 (eggImage 스타일은 AnimatedCharacter에 전달됨)
const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: '#E6E6FA', // 연보라색 배경
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 10,
    height: 65,
    width: '100%',
  },
  headerLeft: { flexDirection: 'row', alignItems: 'center' },
  headerRight: { flexDirection: 'row', alignItems: 'center' },
  iconButton: { padding: 8 },
  headerIcon: { width: 28, height: 28, resizeMode: 'contain' },
  content: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingTop: 0,
  },
  sunIcon: {
    width: 45,
    height: 45,
    position: 'absolute',
    top: 15,
    left: 25,
  },
  eggImage: { // 이 스타일이 AnimatedCharacter 로 전달됨
    width: 180,
    height: 180,
    marginBottom: 40,
  },
  flowerRow: {
    flexDirection: 'row',
    justifyContent: 'space-evenly',
    alignItems: 'center',
    width: '95%',
    marginBottom: 90,
  },
  flowerImage: {
    width: 35,
    height: 35,
    resizeMode: 'contain' // 꽃 이미지에는 resizeMode 필요
  },
});

export default MainScreen;
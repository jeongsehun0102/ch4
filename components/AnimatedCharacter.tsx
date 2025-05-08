// components/AnimatedCharacter.tsx (클릭 시 흔들림, 강도 조절 가능 버전)
import React from 'react'; // useEffect 제거 (자동 시작 안 함)
// TouchableOpacity 추가, StyleSheet 추가 (필요시)
import { Image, ImageRequireSource, ImageStyle, StyleProp, TouchableOpacity } from 'react-native';
import Animated, {
  // withRepeat, cancelAnimation 제거 (자동 시작/반복 안 함)
  Easing,
  useAnimatedStyle,
  useSharedValue,
  withSequence,
  withTiming,
} from 'react-native-reanimated';

interface AnimatedCharacterProps {
  source: ImageRequireSource;
  style?: StyleProp<ImageStyle>;
  shakeIntensity?: number; // 흔들림 강도
  shakeDuration?: number;  // 흔들림 속도
  // delay prop 제거 (자동 시작 안 함)
}

const AnimatedCharacter: React.FC<AnimatedCharacterProps> = ({
  source,
  style,
  shakeIntensity = 5, // <<< 기본 강도를 5 정도로 늘림 (값 조절 가능)
  shakeDuration = 60, // <<< 속도 약간 빠르게 (값 조절 가능)
}) => {
  const translateX = useSharedValue(0); // X축 위치

  // 애니메이션 스타일 (이전과 동일)
  const animatedStyle = useAnimatedStyle(() => {
    return {
      transform: [{ translateX: translateX.value }],
    };
  });

  // === 클릭 시 실행될 애니메이션 함수 ===
  const handlePress = () => {
    console.log("Character pressed!"); // 클릭 확인 로그
    // 현재 위치가 0이 아니면 일단 0으로 (선택 사항, 부드럽게 하려면 빼도 됨)
    // translateX.value = withTiming(0, { duration: shakeDuration / 2 });

    // 짧게 몇 번 흔들리고 멈추는 애니메이션 (반복 없음)
    translateX.value = withSequence(
      withTiming(-shakeIntensity, { duration: shakeDuration, easing: Easing.out(Easing.quad) }),
      withTiming(shakeIntensity, { duration: shakeDuration, easing: Easing.out(Easing.quad) }),
      withTiming(-shakeIntensity / 2, { duration: shakeDuration, easing: Easing.out(Easing.quad) }), // 반동 줄이기
      withTiming(shakeIntensity / 2, { duration: shakeDuration, easing: Easing.out(Easing.quad) }),
      withTiming(0, { duration: shakeDuration, easing: Easing.out(Easing.quad) }) // 원래 위치로 복귀
    );
  };
  // ====================================

  // useEffect 자동 시작 로직 제거됨

  return (
    // === TouchableOpacity로 감싸서 onPress 연결 ===
    <TouchableOpacity onPress={handlePress} activeOpacity={0.8}>
      <Animated.View style={animatedStyle}>
        <Image source={source} style={style || {}} resizeMode="contain" />
      </Animated.View>
    </TouchableOpacity>
    // ==========================================
  );
};

export default AnimatedCharacter;

// const styles = StyleSheet.create({ ... }); // 필요시 스타일 정의
// app/VibrationTestScreen.tsx
import * as Haptics from 'expo-haptics';
import React from 'react';
import { Alert, Button, StyleSheet, View } from 'react-native';

const VibrationTestScreen = () => {
  const testVibration = async () => {
    try {
      await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      Alert.alert("진동 테스트", "진동이 울렸나요?");
    } catch (error) {
      Alert.alert("오류", "진동을 울릴 수 없습니다.");
      console.error("Vibration error:", error);
    }
  };

  return (
    <View style={styles.container}>
      <Button title="진동 테스트" onPress={testVibration} />
    </View>
  );
};

export default VibrationTestScreen;

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
});
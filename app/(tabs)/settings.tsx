// app/(tabs)/settings.tsx
import DateTimePicker from '@react-native-community/datetimepicker';
import Constants from 'expo-constants';
import * as Haptics from 'expo-haptics';
import * as Notifications from 'expo-notifications';
import React, { useEffect, useState } from 'react';
import {
  Image,
  Modal,
  Platform,
  ScrollView,
  StyleSheet,
  Switch,
  Text,
  TouchableOpacity,
  TouchableWithoutFeedback,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useMusic } from '../../context/MusicContext';
import { schedulePushNotification } from '../../utils/notifications'; // utils 폴더로 경로 일치

const SettingsScreen = () => {
  const [isAlarmOn, setIsAlarmOnState] = useState(false); // setIsAlarmOn -> setIsAlarmOnState 로 변경 (아래 함수와 이름 충돌 방지)
  const [isVibrationOn, setIsVibrationOn] = useState(true);
  const [alarmTime, setAlarmTime] = useState(new Date());
  const [showPicker, setShowPicker] = useState(false);

  const { isMusicOn, setIsMusicOn, selectedMusic, setSelectedMusic } = useMusic();

  // 알림 설정 변경 시 (시간, 알람 On/Off, 진동 On/Off)
  useEffect(() => {
    console.log(`SettingsScreen useEffect: isAlarmOn=${isAlarmOn}, alarmTime=${alarmTime.toLocaleTimeString()}, isVibrationOn=${isVibrationOn}`);
    if (isAlarmOn) {
      console.log('SettingsScreen useEffect: Alarm is ON, attempting to schedule notification.');
      schedulePushNotification(alarmTime, isVibrationOn)
        .then(() => console.log('SettingsScreen useEffect: Notification scheduled/rescheduled successfully.'))
        .catch(e => console.error('SettingsScreen useEffect: Failed to schedule notification', e));
    } else {
      // 알람이 꺼져있다면, 예약된 모든 알림 취소 (선택적: 이 로직은 handleAlarmToggle에서 이미 처리)
      // console.log('SettingsScreen useEffect: Alarm is OFF, ensuring all notifications are cancelled.');
      // Notifications.cancelAllScheduledNotificationsAsync();
    }
  }, [alarmTime, isAlarmOn, isVibrationOn]); // 의존성 배열에 isAlarmOn 추가는 올바름

  const handleVibrationToggle = async (value: boolean) => {
    console.log(`handleVibrationToggle called with: ${value}`);
    setIsVibrationOn(value);
    if (value) {
      await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    }
    // isAlarmOn 상태는 여기서 직접 변경하지 않고, useEffect가 isVibrationOn 변경을 감지하여 처리
  };

  const onTimeChange = (event: any, selectedDate?: Date) => {
    setShowPicker(Platform.OS === 'ios');
    if (selectedDate) {
      console.log(`onTimeChange: New time selected - ${selectedDate.toLocaleTimeString()}`);
      setAlarmTime(selectedDate); // alarmTime 상태 업데이트 -> useEffect 트리거
    } else {
      console.log('onTimeChange: No date selected or picker dismissed.');
    }
  };

  const handleAlarmToggle = async (value: boolean) => {
    console.log(`handleAlarmToggle called with: ${value}`);
    setIsAlarmOnState(value); // 내부 상태 업데이트 -> useEffect 트리거
    // useEffect에서 실제 알림 예약/취소 로직이 실행됨
    // 아래 로직은 useEffect와 중복될 수 있으므로 주석 처리 또는 제거 가능.
    // useEffect에서 isAlarmOn 상태 변화를 감지하여 처리하도록 하는 것이 더 일관적일 수 있음.
    if (value) {
      console.log('handleAlarmToggle: Scheduling notification via toggle ON...');
      // schedulePushNotification(alarmTime, isVibrationOn)
      //   .then(() => console.log('🔔 알림 예약됨 (from handleAlarmToggle)'))
      //   .catch(e => console.error('Error scheduling from toggle', e));
    } else {
      console.log('handleAlarmToggle: Cancelling all notifications via toggle OFF...');
      Notifications.cancelAllScheduledNotificationsAsync()
        .then(() => console.log('🔕 알림 취소됨 (from handleAlarmToggle)'))
        .catch(e => console.error('Error cancelling from toggle', e));
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.titleRowSticky}>
        <Image source={require('../../assets/images/settings.png')} style={styles.icon} />
        <Text style={styles.title}>설정</Text>
      </View>
      <ScrollView
       contentContainerStyle={{ paddingBottom: 60, flexGrow: 1 }}
       showsVerticalScrollIndicator={false}
      >
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>배경 음악</Text>
            <Switch value={isMusicOn} onValueChange={setIsMusicOn} />
          </View>
          <View style={styles.musicButtons}>
            <TouchableOpacity onPress={() => setSelectedMusic(1)}>
              <Image source={require('../../assets/images/music1.png')} style={[styles.musicImage, selectedMusic === 1 && styles.selected]} />
              <Text style={styles.musicLabel}>Track I</Text>
            </TouchableOpacity>
            <TouchableOpacity onPress={() => setSelectedMusic(2)}>
              <Image source={require('../../assets/images/music2.png')} style={[styles.musicImage, selectedMusic === 2 && styles.selected]} />
              <Text style={styles.musicLabel}>Track II</Text>
            </TouchableOpacity>
          </View>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>루미아의 인사</Text>
          <View style={styles.sectionHeader}>
            <Text style={styles.subText}>정기 알림</Text>
            <Switch value={isAlarmOn} onValueChange={handleAlarmToggle} />
          </View>
          <Text style={styles.subText}>지정한 시간에 쪽지 알림을 보내 드려요.</Text>
          <TouchableOpacity style={styles.timePicker} onPress={() => setShowPicker(true)}>
            <Text>{alarmTime.toLocaleTimeString('ko-KR', { hour: 'numeric', minute: '2-digit', hour12: true })}</Text>
          </TouchableOpacity>
          {showPicker && (
            <Modal transparent={true} animationType="slide" onRequestClose={() => setShowPicker(false)}>
              <TouchableWithoutFeedback onPress={() => setShowPicker(false)}>
                <View style={styles.modalBackground}>
                  <View style={styles.pickerContainer}>
                    {Platform.OS === 'ios' && (
                         <TouchableOpacity style={styles.closeButton} onPress={() => setShowPicker(false)}>
                        <Text style={styles.closeText}>완료</Text>
                      </TouchableOpacity>
                    )}
                    <DateTimePicker value={alarmTime} mode="time" display={Platform.OS === 'ios' ? 'spinner' : 'default'} onChange={onTimeChange} is24Hour={false} />
                  </View>
                </View>
              </TouchableWithoutFeedback>
            </Modal>
          )}
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>환경 설정</Text>
          <View style={styles.sectionHeader}>
            <Text style={styles.extraText}>진동</Text>
            <Switch value={isVibrationOn} onValueChange={handleVibrationToggle} />
          </View>
          <Text style={styles.subText}>알림 시 진동을 사용할지 설정할 수 있어요.</Text>
          <TouchableOpacity style={styles.testButton} onPress={() => Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success)}>
            <Text style={styles.testButtonText}>🔔 진동 테스트</Text>
          </TouchableOpacity>
          <View style={styles.divider} />
          <View style={styles.sectionHeader}>
            <Text style={styles.extraText}>앱 버전</Text>
            <Text style={styles.extraText}>v{Constants.expoConfig?.version ?? Constants.manifest?.version ?? '1.0.0'}</Text>
          </View>
          <Text style={[styles.subText, { textAlign: 'right' }]}>최신버전 사용 중</Text>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
};

// Styles (이전 답변의 스타일 유지)
const styles = StyleSheet.create({
  testButton: { marginTop: 10, padding: 10, backgroundColor: '#E8F0FE', borderRadius: 8, alignItems: 'center' },
  testButtonText: { color: '#3366CC', fontWeight: '600' },
  container: { flex: 1, backgroundColor: '#F9F9FB' },
  titleRowSticky: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 20, paddingVertical: 10, backgroundColor: '#F9F9FB', zIndex: 10 },
  icon: { width: 40, height: 40, marginRight: 10 },
  title: { fontSize: 26, fontWeight: '600', color: '#222' },
  section: { backgroundColor: '#fff', borderRadius: 16, padding: 16, marginTop: 15, marginHorizontal: 15, marginBottom: 8, shadowColor: '#000', shadowOpacity: 0.04, shadowOffset: { width: 0, height: 2 }, shadowRadius: 6, elevation: 2 },
  sectionHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 },
  sectionTitle: { fontSize: 18, fontWeight: '700', color: '#333', marginBottom: 12 },
  subText: { fontSize: 13, color: '#888', marginBottom: 6 },
  extraText: { fontSize: 16, fontWeight: '600', color: '#444' },
  musicButtons: { flexDirection: 'row', justifyContent: 'center', gap: 40 },
  musicImage: { width: 100, height: 100, borderRadius: 14, marginBottom: 8 },
  musicLabel: { textAlign: 'center', fontSize: 14, fontWeight: '500', color: '#444' },
  selected: { borderWidth: 2, borderColor: '#6C9EFF', borderRadius: 14 },
  timePicker: { marginTop: 10, padding: 12, backgroundColor: '#F1F3F5', borderRadius: 10, alignItems: 'center' },
  modalBackground: { flex: 1, justifyContent: 'flex-end', backgroundColor: 'rgba(0,0,0,0.5)' },
  pickerContainer: { backgroundColor: Platform.OS === 'ios' ? '#FFF' : '#FFF', padding: 20, borderTopLeftRadius: 20, borderTopRightRadius: 20 },
  closeButton: { alignSelf: 'flex-end', padding: 8, marginBottom: 10 },
  closeText: { color: '#007AFF', fontSize: 18, fontWeight: '600' },
  divider: { height: 1, backgroundColor: '#E0E0E0', marginVertical: 12 },
});

export default SettingsScreen;
// app/(tabs)/profile.tsx (테스트 단계 3: 세 개의 WheelPicker 모두 포함)
import { useAuth } from '@/context/AuthContext';
import axios from 'axios';
import React, { useCallback, useEffect, useState } from 'react';
import {
  Alert,
  Modal,
  Platform,
  SafeAreaView,
  StyleSheet,
  Switch,
  Text,
  TouchableOpacity,
  UIManager,
  View
} from 'react-native';
import WheelPicker from 'react-native-wheely';
import { API_BASE_URL, API_ENDPOINTS } from '../../constants/api';

if (Platform.OS === 'android' && UIManager.setLayoutAnimationEnabledExperimental) {
  UIManager.setLayoutAnimationEnabledExperimental(true);
}

interface UserSettingsData {
  notificationInterval?: string;
  notificationTime?: string;
  inAppNotificationEnabled?: boolean;
  pushNotificationEnabled?: boolean;
  backgroundMusicEnabled?: boolean;
  selectedBackgroundMusicTrack?: string;
}

const CUSTOM_TAB_BAR_ACTUAL_HEIGHT = 100;

const formatTimeForDisplay = (timeString?: string): string => {
  if (!timeString) return "시간 미설정";
  const [h, m] = timeString.split(':').map(Number);
  const date = new Date();
  date.setHours(h, m);
  let hours = date.getHours();
  const minutes = date.getMinutes();
  const ampm = hours >= 12 ? '오후' : '오전';
  hours = hours % 12;
  hours = hours ? hours : 12;
  const minutesStr = minutes < 10 ? '0' + minutes : minutes.toString();
  return `${ampm} ${hours}:${minutesStr}`;
};

const amPmData = ['오전', '오후'];
const hoursData = Array.from({ length: 12 }, (_, i) => (i + 1).toString());
const minutesData = Array.from({ length: 60 / 5 }, (_, i) => (i * 5).toString().padStart(2, '0')); // 분 데이터 복구

export default function ProfileScreen() {
  const { logout, token, isLoading: authLoading } = useAuth();
  const [settings, setSettings] = useState<UserSettingsData | null>(null);
  const [isLoadingSettings, setIsLoadingSettings] = useState(false);
  const [isTimeModalVisible, setIsTimeModalVisible] = useState(false);
  
  const [selectedAmPmIndex, setSelectedAmPmIndex] = useState(0);
  const [selectedHourIndex, setSelectedHourIndex] = useState(8); 
  const [selectedMinuteIndex, setSelectedMinuteIndex] = useState(0); // 분 인덱스 복구 (기본값 00분)

  const initializePickerIndices = useCallback((timeString?: string) => { 
    let h24 = 9, m = 0; 
    if (timeString) {
      [h24, m] = timeString.split(':').map(Number); 
    }
    const isPm = h24 >= 12;
    setSelectedAmPmIndex(isPm ? 1 : 0);
    
    let h12 = h24 % 12;
    if (h12 === 0) h12 = 12; 
    const hourIdx = hoursData.indexOf(h12.toString()); 
    setSelectedHourIndex(hourIdx > -1 ? hourIdx : 0); 

    const roundedMinute = Math.round(m / 5) * 5; 
    const minuteIdx = minutesData.indexOf(roundedMinute.toString().padStart(2, '0')); 
    setSelectedMinuteIndex(minuteIdx > -1 ? minuteIdx : 0); 
  }, []); 

  const fetchUserSettings = useCallback(async () => {
    if (!token) return;
    setIsLoadingSettings(true);
    try {
      const response = await axios.get<UserSettingsData>(`${API_BASE_URL}${API_ENDPOINTS.GET_USER_SETTINGS}`);
      setSettings(response.data);
    } catch (error) { 
        console.error("Error fetching user settings:", error);
        Alert.alert("오류", "설정 정보를 가져오는데 실패했습니다.");
    } finally { setIsLoadingSettings(false); }
  }, [token]);

  useEffect(() => {
    if (token) { fetchUserSettings(); }
  }, [fetchUserSettings, token]);

  const openTimePickerModal = () => {
    initializePickerIndices(settings?.notificationTime); 
    setIsTimeModalVisible(true);
  };

  const handleTimeConfirm = () => {
    const selectedAmPm = amPmData[selectedAmPmIndex];
    const selectedHour = hoursData[selectedHourIndex];
    const selectedMinute = minutesData[selectedMinuteIndex]; 
    console.log("선택된 시간:", selectedAmPm, selectedHour + "시", selectedMinute + "분");

    let finalHour24 = parseInt(selectedHour, 10);
    if (selectedAmPm === '오후' && finalHour24 !== 12) {
      finalHour24 += 12;
    } else if (selectedAmPm === '오전' && finalHour24 === 12) {
      finalHour24 = 0;
    }
    const finalMinute = parseInt(selectedMinute, 10); 

    setSettings(prev => ({
      ...prev,
      notificationInterval: 'DAILY_SPECIFIC_TIME',
      notificationTime: `${finalHour24.toString().padStart(2, '0')}:${finalMinute.toString().padStart(2, '0')}:00`,
    }));
    setIsTimeModalVisible(false);
  };

  const handleSaveSettings = async () => { /* ... 이전과 동일 ... */ 
    if (!token || !settings) return;
    setIsLoadingSettings(true);
    try {
      const settingsToSave = { ...settings };
      if (settings.notificationInterval !== 'DAILY_SPECIFIC_TIME') {
        settingsToSave.notificationTime = undefined;
      }
      await axios.put(`${API_BASE_URL}${API_ENDPOINTS.UPDATE_USER_SETTINGS}`, settingsToSave);
      Alert.alert('성공', '설정이 저장되었습니다.');
    } catch (error) {
      console.error("Error saving user settings:", error);
      Alert.alert("오류", "설정 저장에 실패했습니다.");
    } finally {
      setIsLoadingSettings(false);
    }
  };
  const handleLogout = async () => { /* ... 이전과 동일 ... */ 
    if (authLoading) return;
    await logout();
  };

  if (authLoading || isLoadingSettings) {
    return <SafeAreaView style={styles.loadingContainer}><Text>설정 정보를 불러오는 중...</Text></SafeAreaView>;
  }

  return (
    <SafeAreaView style={[styles.screenContainer, { paddingBottom: CUSTOM_TAB_BAR_ACTUAL_HEIGHT }]}>
      <View style={styles.headerContainer}>
        <Text style={styles.headerTitle}>설정</Text>
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>배경음악</Text>
        <View style={styles.settingRow}>
          <Text style={styles.settingLabel}>배경음악 재생</Text>
          <Switch
            value={settings?.backgroundMusicEnabled}
            onValueChange={(value) => setSettings(prev => ({...prev, backgroundMusicEnabled: value}))}
          />
        </View>
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>무디의 인사</Text>
        <TouchableOpacity style={styles.settingRow} onPress={openTimePickerModal}>
          <View>
            <Text style={styles.settingLabel}>정기 알림</Text>
            <Text style={styles.settingDescription}>직접 설정한 시간에 알림을 보내드려요.</Text>
          </View>
          <View style={styles.valueContainer}>
            <Text style={styles.valueText}>
              {settings?.notificationInterval === 'DAILY_SPECIFIC_TIME' 
                ? formatTimeForDisplay(settings.notificationTime) 
                : (settings?.notificationInterval === 'NONE' ? '받지 않음' : '앱 열 때마다')}
            </Text>
            <Text style={styles.chevronIcon}>&gt;</Text>
          </View>
        </TouchableOpacity>
        
        <View style={styles.settingRow}>
            <Text style={styles.settingLabel}>앱 내 알림 (캐릭터 메시지)</Text>
            <Switch
                value={settings?.inAppNotificationEnabled}
                onValueChange={(value) => setSettings(prev => ({ ...prev, inAppNotificationEnabled: value }))}
            />
        </View>
        <View style={styles.settingRow}>
            <Text style={styles.settingLabel}>푸시 알림 (앱 외부 알림)</Text>
            <Switch
                value={settings?.pushNotificationEnabled}
                onValueChange={(value) => setSettings(prev => ({ ...prev, pushNotificationEnabled: value }))}
            />
        </View>
      </View>
      <Modal
        animationType="slide"
        transparent={true}
        visible={isTimeModalVisible}
        onRequestClose={() => setIsTimeModalVisible(false)}
      >
        <TouchableOpacity 
            style={styles.modalOverlay} 
            activeOpacity={1} 
            onPressOut={() => setIsTimeModalVisible(false)}
        >
          <TouchableOpacity activeOpacity={1} style={styles.modalContentContainer}>
            <Text style={styles.modalTitle}>정기 알림</Text>
            <Text style={styles.modalDescription}>직접 설정한 시간에 알림을 보내드려요.</Text>
            
            <View style={styles.modalPickerContainer}>
              {/* AM/PM WheelPicker */}
              <WheelPicker
                selectedIndex={selectedAmPmIndex}
                options={amPmData}
                onChange={(index) => setSelectedAmPmIndex(index)}
                itemTextStyle={styles.modalWheelyItemText}
                containerStyle={styles.modalWheelyContainerShort}
                itemHeight={40}
                selectedIndicatorStyle={styles.modalWheelySelectedIndicator}
              />
              {/* Hour WheelPicker */}
              <WheelPicker
                selectedIndex={selectedHourIndex}
                options={hoursData} 
                onChange={(index) => setSelectedHourIndex(index)}
                itemTextStyle={styles.modalWheelyItemText}
                containerStyle={styles.modalWheelyContainer} 
                itemHeight={40}
                selectedIndicatorStyle={styles.modalWheelySelectedIndicator}
              />
              {/* 콜론 Text 추가 */}
              <Text style={styles.modalWheelyColon}>:</Text>
              {/* Minute WheelPicker 추가 */}
              <WheelPicker
                selectedIndex={selectedMinuteIndex}
                options={minutesData} 
                onChange={(index) => setSelectedMinuteIndex(index)}
                itemTextStyle={styles.modalWheelyItemText}
                containerStyle={styles.modalWheelyContainer} 
                itemHeight={40}
                selectedIndicatorStyle={styles.modalWheelySelectedIndicator}
              />
            </View>

            <TouchableOpacity style={styles.modalConfirmButton} onPress={handleTimeConfirm}>
              <Text style={styles.modalConfirmButtonText}>확인</Text>
            </TouchableOpacity>
          </TouchableOpacity>
        </TouchableOpacity>
      </Modal>

      <View style={styles.bottomButtonContainer}>
        <TouchableOpacity style={styles.saveButton} onPress={handleSaveSettings} disabled={isLoadingSettings}>
            <Text style={styles.saveButtonText}>{isLoadingSettings ? "저장 중..." : "변경사항 저장"}</Text>
        </TouchableOpacity>
        <TouchableOpacity onPress={handleLogout} style={styles.logoutButton} disabled={authLoading}>
            <Text style={styles.logoutButtonText}>로그아웃</Text>
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
}

// 스타일 정의는 이전 답변의 전체 스타일 정의를 사용합니다.
const styles = StyleSheet.create({
  loadingContainer: { flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: '#F2F2F7' },
  screenContainer: { flex: 1, backgroundColor: '#F2F2F7' },
  headerContainer: {
    paddingTop: Platform.OS === 'ios' ? 20 : 30,
    paddingBottom: 10,
    paddingHorizontal: 20,
    alignItems: 'flex-start',
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#000',
  },
  section: {
    marginTop: 20,
    marginHorizontal: 15,
    backgroundColor: 'white',
    borderRadius: 12,
    paddingHorizontal: 15,
    paddingVertical: 10,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 2,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#000',
    marginBottom: 15,
    paddingTop: 5,
  },
  settingRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 14,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: '#EFEFF4',
  },
  settingLabel: {
    fontSize: 17,
    color: '#000',
  },
  settingDescription: {
    fontSize: 13,
    color: '#8A8A8E',
    marginTop: 2,
  },
  valueContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  valueText: {
    fontSize: 17,
    color: '#8A8A8E',
  },
  chevronIcon: {
    fontSize: 17,
    color: '#C7C7CD',
    marginLeft: 8,
  },

  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.4)',
    justifyContent: 'flex-end',
  },
  modalContentContainer: {
    backgroundColor: 'white',
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    paddingHorizontal: 20,
    paddingTop: 25,
    paddingBottom: Platform.OS === 'ios' ? 30 : 20,
    alignItems: 'center',
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#000',
    marginBottom: 8,
  },
  modalDescription: {
    fontSize: 14,
    color: '#666',
    textAlign: 'center',
    marginBottom: 25,
  },
  modalPickerContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center', 
    width: '100%', 
    height: Platform.OS === 'ios' ? 170 : 160, 
    marginBottom: 25,
  },
  modalWheelyContainerShort: { height: '100%', width: '28%' }, 
  modalWheelyContainer: { height: '100%', width: '28%' },      
  modalWheelyItemText: { fontSize: 20, color: '#000' },
  modalWheelySelectedIndicator: { 
      height: 40, 
      backgroundColor: 'rgba(0, 0, 0, 0.05)', 
      borderRadius: 10 
  },
  modalWheelyColon: { fontSize: 20, fontWeight: '600', color: '#333', marginHorizontal: '2%' }, 
  modalConfirmButton: {
    backgroundColor: '#007AFF',
    borderRadius: 12,
    paddingVertical: 14,
    alignItems: 'center',
    width: '100%',
  },
  modalConfirmButtonText: {
    color: 'white',
    fontSize: 17,
    fontWeight: '600',
  },

  bottomButtonContainer: {
      paddingHorizontal: 15,
      marginTop: 30,
      marginBottom: 15,
  },
  saveButton: { 
    backgroundColor: '#007AFF',
    borderRadius: 12, 
    paddingVertical: 14, 
    alignItems: 'center', 
    marginBottom: 10,
  },
  saveButtonText: { color: 'white', fontSize: 17, fontWeight: '600' },
  logoutButton: {
    backgroundColor: '#F2F2F7',
    borderRadius: 12, 
    paddingVertical: 14, 
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#E5E5EA'
  },
  logoutButtonText: { color: '#FF3B30', fontSize: 17 },
});
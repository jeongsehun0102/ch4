// app/(tabs)/profile.tsx
import { useAuth } from '@/context/AuthContext';
import axios from 'axios';
import React, { useCallback, useEffect, useState } from 'react';
import {
  Alert,
  FlatList // FlatList import
  ,
  LayoutAnimation,
  Platform,
  SafeAreaView,
  StyleSheet,
  Switch,
  Text,
  TouchableOpacity,
  UIManager,
  View
} from 'react-native';
import { API_BASE_URL, API_ENDPOINTS } from '../../constants/api';

// WheelPicker import
import WheelPicker from 'react-native-wheely';
// import Ionicons from '@expo/vector-icons/Ionicons';

if (Platform.OS === 'android' && UIManager.setLayoutAnimationEnabledExperimental) {
  UIManager.setLayoutAnimationEnabledExperimental(true);
}

interface UserSettingsData {
  notificationInterval?: string;
  notificationTime?: string;
  inAppNotificationEnabled?: boolean;
  pushNotificationEnabled?: boolean;
}

// FlatList에서 사용할 아이템 타입 정의
interface SettingItemType {
  id: string;
  type: 'header' | 'intervalSelector' | 'inlineTimePicker' | 'switch' | 'button';
  label?: string; // switch, button 등에서 사용
  valueKey?: keyof UserSettingsData; // switch에서 사용
  action?: () => void; // button에서 사용
  buttonTitle?: string; // button에서 사용
  buttonColor?: string; // button에서 사용
}


const CUSTOM_TAB_BAR_ACTUAL_HEIGHT = 100;

const formatTimeForDisplay = (date: Date): string => {
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
const minutesData = Array.from({ length: 60 / 5 }, (_, i) => (i * 5).toString().padStart(2, '0'));

const INTERVAL_OPTIONS = [
    { label: '앱 열 때마다', value: 'WHEN_APP_OPENS' },
    { label: '매일 정해진 시간에', value: 'DAILY_SPECIFIC_TIME' },
    { label: '받지 않음', value: 'NONE' },
];

export default function ProfileScreen() {
  const { logout, token, isLoading: authLoading } = useAuth();
  const [settings, setSettings] = useState<UserSettingsData | null>(null);
  const [isLoadingSettings, setIsLoadingSettings] = useState(false);
  const [time, setTime] = useState(new Date());

  const [isIntervalSelectorVisible, setIsIntervalSelectorVisible] = useState(false);
  const [isTimePickerInlineVisible, setIsTimePickerInlineVisible] = useState(false);

  const [selectedAmPmIndex, setSelectedAmPmIndex] = useState(0);
  const [selectedHourIndex, setSelectedHourIndex] = useState(8);
  const [selectedMinuteIndex, setSelectedMinuteIndex] = useState(0);

  const initializePickerIndices = useCallback((date: Date) => {
    const currentHour24 = date.getHours();
    const currentMinute = date.getMinutes();
    setSelectedAmPmIndex(currentHour24 >= 12 ? 1 : 0);
    let currentHour12 = currentHour24 % 12;
    currentHour12 = currentHour12 ? currentHour12 : 12;
    const hourIdx = hoursData.indexOf(currentHour12.toString());
    setSelectedHourIndex(hourIdx > -1 ? hourIdx : 0);
    const roundedMinute = Math.round(currentMinute / 5) * 5;
    const minuteIdx = minutesData.indexOf(roundedMinute.toString().padStart(2, '0'));
    setSelectedMinuteIndex(minuteIdx > -1 ? minuteIdx : 0);
  }, []);

  const fetchUserSettings = useCallback(async () => {
    if (!token) return;
    setIsLoadingSettings(true);
    try {
      const response = await axios.get<UserSettingsData>(`${API_BASE_URL}${API_ENDPOINTS.GET_USER_SETTINGS}`);
      setSettings(response.data);
      if (response.data?.notificationTime) {
        const [h, m, s] = response.data.notificationTime.split(':').map(Number);
        const initialTime = new Date(); initialTime.setHours(h, m, s || 0);
        setTime(initialTime); initializePickerIndices(initialTime);
      } else {
        const defaultTime = new Date(); defaultTime.setHours(9, 0, 0); setTime(defaultTime);
        initializePickerIndices(defaultTime);
      }
    } catch (error) { /* ... */ } finally { setIsLoadingSettings(false); }
  }, [token, initializePickerIndices]);

  useEffect(() => { if (token) fetchUserSettings(); }, [fetchUserSettings, token]);

  const updateTimeFromPicker = useCallback(() => {
    let finalHour = parseInt(hoursData[selectedHourIndex], 10);
    if (amPmData[selectedAmPmIndex] === '오후' && finalHour !== 12) finalHour += 12;
    else if (amPmData[selectedAmPmIndex] === '오전' && finalHour === 12) finalHour = 0;
    const finalMinute = parseInt(minutesData[selectedMinuteIndex], 10);
    const newTime = new Date(time);
    newTime.setHours(finalHour, finalMinute, 0, 0);
    if (time.getTime() !== newTime.getTime()) setTime(newTime);
  }, [selectedAmPmIndex, selectedHourIndex, selectedMinuteIndex, time ]); // time 추가

  const handleSaveSettings = async () => {
    if (!token || !settings) return;
    setIsLoadingSettings(true);
    if (settings.notificationInterval === 'DAILY_SPECIFIC_TIME' && isTimePickerInlineVisible) {
        updateTimeFromPicker(); // Picker가 열려있었다면 현재 값으로 시간 확정
        setIsTimePickerInlineVisible(false); // 저장 시 Picker 닫기
    }
    const settingsToSave: UserSettingsData = {
      ...settings,
      notificationTime: settings.notificationInterval === 'DAILY_SPECIFIC_TIME'
        ? `${time.getHours().toString().padStart(2, '0')}:${time.getMinutes().toString().padStart(2, '0')}:00`
        : undefined,
    };
    try {
      await axios.put(`${API_BASE_URL}${API_ENDPOINTS.UPDATE_USER_SETTINGS}`, settingsToSave);
      Alert.alert('성공', '설정이 저장되었습니다.');
    } catch (error) { /* ... */ } finally { setIsLoadingSettings(false); }
  };

  const handleLogout = async () => { if (authLoading) return; await logout(); };

  const getNotificationIntervalDisplayText = () => {
    const currentInterval = settings?.notificationInterval;
    if (currentInterval === 'WHEN_APP_OPENS') return '앱 열 때마다';
    if (currentInterval === 'DAILY_SPECIFIC_TIME') {
        // Picker가 열려있을 때는 Picker의 값을, 아니면 확정된 time 값을 보여줌
        return `매일 ${isTimePickerInlineVisible ? `${amPmData[selectedAmPmIndex]} ${hoursData[selectedHourIndex]}:${minutesData[selectedMinuteIndex]}`: formatTimeForDisplay(time)}`;
    }
    if (currentInterval === 'NONE') return '받지 않음';
    return '선택하세요';
  };

  const toggleIntervalSelector = () => {
    LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
    const newVisibility = !isIntervalSelectorVisible;
    setIsIntervalSelectorVisible(newVisibility);
    if (newVisibility && isTimePickerInlineVisible) {
        updateTimeFromPicker(); setIsTimePickerInlineVisible(false);
    }
  };

  const handleIntervalSelect = (intervalValue: string) => {
    LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
    setSettings(prev => ({ ...prev, notificationInterval: intervalValue as UserSettingsData['notificationInterval'] }));
    setIsIntervalSelectorVisible(false);
    if (intervalValue === 'DAILY_SPECIFIC_TIME') {
      initializePickerIndices(time); setIsTimePickerInlineVisible(true);
    } else {
      if (isTimePickerInlineVisible) updateTimeFromPicker();
      setIsTimePickerInlineVisible(false);
    }
  };

  const toggleTimePickerInline = () => {
    LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
    const newVisibility = !isTimePickerInlineVisible;
    if (newVisibility) { initializePickerIndices(time); }
    else { updateTimeFromPicker(); } // 닫힐 때 시간 확정
    setIsTimePickerInlineVisible(newVisibility);
    if (isIntervalSelectorVisible) setIsIntervalSelectorVisible(false);
  };

  // FlatList 데이터 구성
  const flatListData: SettingItemType[] = [
    { id: 'header', type: 'header' },
    { id: 'intervalSection', type: 'intervalSelector' },
    // 'DAILY_SPECIFIC_TIME'이고 isTimePickerInlineVisible가 true일 때만 inlineTimePicker 아이템 추가
    ...(settings?.notificationInterval === 'DAILY_SPECIFIC_TIME' && isTimePickerInlineVisible
      ? [{ id: 'timePicker', type: 'inlineTimePicker' as const }]
      : []),
    { id: 'inAppSwitch', type: 'switch', label: '앱 내 알림 (캐릭터 메시지)', valueKey: 'inAppNotificationEnabled' },
    { id: 'pushSwitch', type: 'switch', label: '푸시 알림 (앱 외부 알림)', valueKey: 'pushNotificationEnabled' },
    { id: 'saveButton', type: 'button', buttonTitle: isLoadingSettings ? "저장 중..." : "변경사항 저장", action: handleSaveSettings, buttonColor: '#007AFF' },
    { id: 'logoutButton', type: 'button', buttonTitle: '로그아웃', action: handleLogout, buttonColor: '#FF3B30' },
  ];


  const renderSettingItem = ({ item }: { item: SettingItemType }) => {
    if (item.type === 'header') {
      return <Text style={styles.headerTitle}>설정</Text>;
    }

    if (item.type === 'intervalSelector') {
      return (
        <View style={styles.sectionContainer}>
          <TouchableOpacity 
            onPress={settings?.notificationInterval === 'DAILY_SPECIFIC_TIME' ? toggleTimePickerInline : toggleIntervalSelector}
            style={[styles.settingItem, (isIntervalSelectorVisible || (settings?.notificationInterval === 'DAILY_SPECIFIC_TIME' && isTimePickerInlineVisible)) && styles.settingItemOpen]}
          >
            <Text style={styles.label}>메시지 받는 방법</Text>
            <View style={styles.valueContainer}>
              <Text style={ settings?.notificationInterval === 'DAILY_SPECIFIC_TIME' ? styles.valueTextHighlight : styles.valueText }>
                {getNotificationIntervalDisplayText()}
              </Text>
              <Text style={styles.chevronIcon}>
                {isIntervalSelectorVisible || isTimePickerInlineVisible ? '▲' : '▼'}
              </Text>
            </View>
          </TouchableOpacity>
          {isIntervalSelectorVisible && settings?.notificationInterval !== 'DAILY_SPECIFIC_TIME' && (
            <View style={styles.intervalOptionsContainer}>
              {INTERVAL_OPTIONS.map((option, index) => (
                <TouchableOpacity
                  key={option.value}
                  onPress={() => handleIntervalSelect(option.value)}
                  style={[ styles.intervalOptionItem, option.value === settings?.notificationInterval && styles.intervalOptionItemSelected, index === INTERVAL_OPTIONS.length - 1 && styles.intervalOptionItemLast ]}
                >
                  <Text style={[ styles.intervalOptionText, option.value === settings?.notificationInterval && styles.intervalOptionTextSelected ]}> {option.label} </Text>
                  {option.value === settings?.notificationInterval && (<Text style={styles.checkmarkIcon}>✓</Text>)}
                </TouchableOpacity>
              ))}
            </View>
          )}
        </View>
      );
    }

    if (item.type === 'inlineTimePicker') {
      return (
        <View style={styles.sectionContainerForPicker}> {/* Picker 섹션은 다른 스타일 적용 가능 */}
            <View style={styles.inlinePickerWheelyContainer}>
                <WheelPicker selectedIndex={selectedAmPmIndex} options={amPmData} onChange={(index) => setSelectedAmPmIndex(index)} itemTextStyle={styles.wheelyItemText} containerStyle={styles.wheelyContainerShort} itemHeight={40} selectedIndicatorStyle={styles.wheelySelectedIndicator} decelerationRate="fast"/>
                <WheelPicker selectedIndex={selectedHourIndex} options={hoursData} onChange={(index) => setSelectedHourIndex(index)} itemTextStyle={styles.wheelyItemText} containerStyle={styles.wheelyContainer} itemHeight={40} selectedIndicatorStyle={styles.wheelySelectedIndicator} decelerationRate="fast"/>
                <Text style={styles.wheelyColon}>:</Text>
                <WheelPicker selectedIndex={selectedMinuteIndex} options={minutesData} onChange={(index) => setSelectedMinuteIndex(index)} itemTextStyle={styles.wheelyItemText} containerStyle={styles.wheelyContainer} itemHeight={40} selectedIndicatorStyle={styles.wheelySelectedIndicator} decelerationRate="fast"/>
            </View>
        </View>
      );
    }

    if (item.type === 'switch' && item.label && item.valueKey) {
      return (
        // 스위치는 하나의 섹션 안에 여러개가 들어갈 수 있으므로, 외부에서 sectionContainer로 감싸줘야 함
        // 여기서는 FlatList 아이템으로 개별 렌더링
         <View style={styles.sectionContainerForSwitches}>
            <View style={[styles.settingItem, item.id === 'pushSwitch' && {borderBottomWidth: 0} ]}>
                <Text style={styles.label}>{item.label}</Text>
                <Switch
                trackColor={{ false: "#E9E9EA", true: "#34C759" }}
                thumbColor={"#FFFFFF"}
                ios_backgroundColor="#E9E9EA"
                onValueChange={() => setSettings(prev => ({ ...prev, [item.valueKey!]: !prev?.[item.valueKey!] }))}
                value={settings?.[item.valueKey] as boolean | undefined} // 타입 단언
                disabled={isLoadingSettings}
                />
            </View>
        </View>
      );
    }
    
    if (item.type === 'button' && item.buttonTitle && item.action) {
        if (item.id === 'saveButton') {
            return (
                <TouchableOpacity 
                    style={[styles.saveButton, (isLoadingSettings || !settings) && styles.saveButtonDisabled]} 
                    onPress={item.action} 
                    disabled={isLoadingSettings || !settings}
                >
                    <Text style={styles.saveButtonText}>{item.buttonTitle}</Text>
                </TouchableOpacity>
            );
        }
        if (item.id === 'logoutButton') {
            return (
                 <View style={styles.logoutButtonContainer}>
                    <TouchableOpacity onPress={item.action} style={styles.customLogoutButton} disabled={authLoading}>
                        <Text style={styles.customLogoutButtonText}>{item.buttonTitle}</Text>
                    </TouchableOpacity>
                </View>
            );
        }
    }
    return null;
  };


  if (authLoading || (isLoadingSettings && !settings)) {
    return <SafeAreaView style={styles.loadingContainer}><Text>설정 정보를 불러오는 중...</Text></SafeAreaView>;
  }

  return (
    <SafeAreaView style={[styles.screenContainer, { paddingBottom: CUSTOM_TAB_BAR_ACTUAL_HEIGHT }]}>
      <FlatList
        data={flatListData}
        renderItem={renderSettingItem}
        keyExtractor={item => item.id}
        style={styles.scrollView} // scrollView 스타일 재활용
        contentContainerStyle={styles.scrollContentContainer} // scrollContentContainer 스타일 재활용
        keyboardShouldPersistTaps="handled"
        // ListHeaderComponent={<Text style={styles.headerTitle}>설정</Text>} // 헤더를 이렇게 넣을 수도 있음
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  loadingContainer: { flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: '#F2F2F7'},
  screenContainer: { flex: 1, backgroundColor: '#F2F2F7'},
  scrollView: { flex: 1 }, // FlatList에 적용될 스타일
  scrollContentContainer: { paddingBottom: 30 }, // FlatList의 contentContainerStyle
  headerTitle: { fontSize: Platform.OS === 'ios' ? 34 : 24, fontWeight: 'bold', color: '#000000', paddingHorizontal: 15, paddingTop: Platform.OS === 'ios' ? 10 : 20, paddingBottom: 10},
  
  // 섹션 컨테이너는 FlatList 아이템 내부에서 조건부로 렌더링되거나, 
  // renderItem에서 각 타입별로 감싸는 View에 적용합니다.
  // 여기서는 renderItem 내부에서 각 타입에 맞는 sectionContainer 스타일을 적용하도록 합니다.
  sectionContainer: { // 메시지 받는 방법 + 옵션 + (조건부) 시간선택 항목을 감싸는 컨테이너
    marginTop: Platform.OS === 'ios' ? 35 : 20,
    backgroundColor: 'white',
    borderRadius: Platform.OS === 'ios' ? 10 : 8,
    marginHorizontal: 15,
    overflow: 'hidden', // 내부 border Rarius 적용을 위해
    ...(Platform.OS === 'ios' && { shadowColor: "rgba(0,0,0,0.08)", shadowOffset: { width: 0, height: 2 }, shadowOpacity: 1, shadowRadius: 5, }),
    ...(Platform.OS === 'android' && { elevation: 2, }),
  },
  sectionContainerForPicker: { // 인라인 Wheely Picker를 위한 섹션 스타일 (필요시 다르게)
    marginTop: 0, // 메시지 받는 방법 바로 아래에 붙도록
    backgroundColor: 'white',
    borderRadius: Platform.OS === 'ios' ? 10 : 8,
    marginHorizontal: 15,
    // overflow: 'hidden', // Picker가 잘리지 않도록 주의
    borderTopWidth: StyleSheet.hairlineWidth, // 바로 위 항목과의 구분선
    borderColor: '#E0E0E0',
    ...(Platform.OS === 'ios' && { shadowColor: "rgba(0,0,0,0.08)", shadowOffset: { width: 0, height: 2 }, shadowOpacity: 1, shadowRadius: 5, }),
    ...(Platform.OS === 'android' && { elevation: 2, }),
  },
  sectionContainerForSwitches: { // 스위치 항목들을 위한 섹션 스타일
    marginTop: Platform.OS === 'ios' ? 20 : 15, // 간격 약간 줄임
    backgroundColor: 'white',
    borderRadius: Platform.OS === 'ios' ? 10 : 8,
    marginHorizontal: 15,
    overflow: 'hidden',
    ...(Platform.OS === 'ios' && { shadowColor: "rgba(0,0,0,0.08)", shadowOffset: { width: 0, height: 2 }, shadowOpacity: 1, shadowRadius: 5, }),
    ...(Platform.OS === 'android' && { elevation: 2, }),
  },
  settingItem: {
    backgroundColor: 'white',
    paddingVertical: Platform.OS === 'ios' ? 14 : 16,
    paddingHorizontal: 15,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    borderBottomWidth: StyleSheet.hairlineWidth, // 기본적으로 하단 구분선
    borderColor: '#E0E0E0',
  },
  settingItemOpen: { // Picker나 옵션이 열렸을 때 (클릭된 항목 자체에 적용)
    // borderBottomWidth: 0, // 열렸을 때는 하단 구분선 제거 (옵션 컨테이너에 상단 구분선 있음)
  },
  label: { fontSize: 17, color: '#000000', flexShrink: 1 },
  valueContainer: { flexDirection: 'row', alignItems: 'center', flexGrow: 1, justifyContent: 'flex-end' },
  valueText: { fontSize: 17, color: '#8A8A8E', marginRight: 5 },
  valueTextHighlight: { fontSize: 17, color: '#007AFF', marginRight: 5 },
  chevronIcon: { fontSize: 18, color: '#C7C7CD', marginLeft: 8 },
  checkmarkIcon: { fontSize: 20, color: '#007AFF', marginLeft: 10 },

  intervalOptionsContainer: { backgroundColor: 'white', borderTopWidth: StyleSheet.hairlineWidth, borderColor: '#E0E0E0' },
  intervalOptionItem: { paddingVertical: Platform.OS === 'ios' ? 12 : 14, paddingHorizontal: 15, flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', borderBottomWidth: StyleSheet.hairlineWidth, borderColor: '#F0F0F0' },
  intervalOptionItemLast: { borderBottomWidth: 0, },
  intervalOptionItemSelected: {},
  intervalOptionText: { fontSize: 17, color: '#007AFF' },
  intervalOptionTextSelected: { fontWeight: 'bold' },

  inlinePickerWheelyContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-around',
    paddingVertical: 10,
    backgroundColor: 'white',
    height: Platform.OS === 'ios' ? 170 : 150, // 높이 조절
    // borderTopWidth: StyleSheet.hairlineWidth, // settingItemOpen에서 처리하거나, sectionContainerForPicker에서 처리
    // borderColor: '#E0E0E0',
  },
  wheelyContainer: { height: '100%', width: Platform.OS === 'ios' ? '33%' : 85 }, // 너비 조정
  wheelyContainerShort: { height: '100%', width: Platform.OS === 'ios' ? '30%' : 75 }, // 너비 조정
  wheelyItemText: { fontSize: Platform.OS === 'ios' ? 18 : 16, color: '#000' }, // 폰트 크기 조절
  wheelySelectedIndicator: { height: Platform.OS === 'ios' ? 35 : 40, backgroundColor: Platform.OS === 'ios' ? 'rgba(200, 200, 200, 0.15)' :'rgba(180, 180, 180, 0.2)', borderRadius: 8 },
  wheelyColon: { fontSize: 18, fontWeight: '600', color: '#333', marginHorizontal: Platform.OS === 'ios' ? -5 : -10 }, // 콜론 간격 및 크기 조절

  saveButton: { backgroundColor: '#007AFF', borderRadius: 8, paddingVertical: 14, alignItems: 'center', marginHorizontal: 15, marginTop: 35 },
  saveButtonDisabled: { backgroundColor: '#AECBFA' },
  saveButtonText: { color: 'white', fontSize: 17, fontWeight: '600' },
  logoutButtonContainer: { marginTop: 20, marginHorizontal: 15, marginBottom: 20 /* FlatList 맨 아래 여백*/ },
  customLogoutButton: { backgroundColor: 'white', borderRadius: 8, paddingVertical: 12, alignItems: 'center', borderWidth: StyleSheet.hairlineWidth, borderColor: '#C6C6C8' },
  customLogoutButtonText: { color: '#FF3B30', fontSize: 17 },
});
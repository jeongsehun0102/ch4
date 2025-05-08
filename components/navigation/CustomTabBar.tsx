// components/navigation/CustomTabBar.tsx (unused variable 제거 완료 버전)
import React from 'react';
import { Image, Platform, StyleSheet, TouchableOpacity, View } from 'react-native'; // Text 추가 (필요시)
// Colors, useColorScheme 등 필요 시 import
import { Colors } from '@/constants/Colors';
import { useColorScheme } from '@/hooks/useColorScheme';

// 사용할 아이콘 경로 정의
const tabIcons = {
  chat: require('../../assets/images/chat_icon.png'),
  records: require('../../assets/images/records_icon.png'),
  index: require('../../assets/images/main_icon.png'), // 가운데 탭 (메인)
  board: require('../../assets/images/board_icon.png'), // 네번째 탭
  profile: require('../../assets/images/PersonalSetting_icon.png'),
};

// 탭 라우트 정보 타입 (state.routes 내부 요소 타입)
interface TabRoute {
    key: string;
    name: string;
    params?: object;
}

// CustomTabBar 컴포넌트 Props 타입 정의
interface CustomTabBarProps {
    state: {
        index: number; // 현재 활성화된 탭의 인덱스
        routes: TabRoute[]; // 탭 라우트 정보 배열
    };
    navigation: any; // 네비게이션 객체
    // descriptors 는 현재 사용하지 않으므로 제거하거나 주석 처리 가능
    // descriptors: any;
}

export function CustomTabBar({ state, navigation }: CustomTabBarProps) {
    // const focusedRoute = state.routes[state.index]; // <<< 사용되지 않으므로 이 라인 삭제됨

    // useColorScheme 훅이나 Colors 상수가 없다면 기본값 설정
    const colorScheme = useColorScheme() || 'light';
    const activeColor = Colors?.[colorScheme]?.tint || '#2f95dc';
    const inactiveColor = 'gray';

    return (
        // 탭 바 전체를 감싸는 컨테이너
        <View style={styles.tabBarContainer} pointerEvents="box-none">
            {/* 탭 바 배경 */}
            <View style={styles.tabBarBackground} />

            {/* 아이콘 버튼들을 담는 영역 */}
            <View style={styles.tabBarContent}>
                {state.routes.map((route, index) => {
                    const isFocused = state.index === index;
                    const isMainTab = route.name === 'index'; // 가운데 탭 이름 확인

                    let iconSource;
                    let iconColor = isFocused ? activeColor : inactiveColor;
                    let iconStyle = styles.tabIcon;

                    // 아이콘 매핑
                    if (route.name === 'chat') iconSource = tabIcons.chat;
                    else if (route.name === 'records') iconSource = tabIcons.records;
                    else if (route.name === 'index') {
                        iconSource = tabIcons.index;
                        iconColor = 'black';
                        iconStyle = styles.mainTabIcon;
                    }
                    else if (route.name === 'board') iconSource = tabIcons.board;
                    else if (route.name === 'profile') iconSource = tabIcons.profile;

                    if (!iconSource) return null;

                    // 탭 버튼 눌렀을 때의 동작
                    const onPress = () => {
                        const event = navigation.emit({
                            type: 'tabPress',
                            target: route.key,
                            canPreventDefault: true,
                        });

                        if (!isFocused && !event.defaultPrevented) {
                            navigation.navigate(route.name, route.params);
                        }
                    };

                    // 길게 눌렀을 때의 동작 (옵션)
                    const onLongPress = () => {
                        navigation.emit({
                            type: 'tabLongPress',
                            target: route.key,
                        });
                    };

                    // --- 각 탭 아이템 렌더링 ---
                    if (isMainTab) {
                        // 메인(가운데) 탭 버튼
                        return (
                            <TouchableOpacity
                                key={route.key}
                                accessibilityRole="button"
                                accessibilityState={isFocused ? { selected: true } : {}}
                                onPress={onPress}
                                onLongPress={onLongPress}
                                style={styles.mainTabButtonContainer} // 위치 조정을 위한 컨테이너
                            >
                                <View style={styles.mainTabButton}>
                                    <Image source={iconSource} style={[iconStyle, { tintColor: iconColor }]} resizeMode="contain" />
                                </View>
                            </TouchableOpacity>
                        );
                    } else {
                        // 일반 탭 버튼
                        return (
                            <TouchableOpacity
                                key={route.key}
                                accessibilityRole="button"
                                accessibilityState={isFocused ? { selected: true } : {}}
                                onPress={onPress}
                                onLongPress={onLongPress}
                                style={styles.tabBarItem} // 각 탭 아이템 영역
                            >
                                <Image source={iconSource} style={[iconStyle, { tintColor: iconColor }]} resizeMode="contain" />
                            </TouchableOpacity>
                        );
                    }
                })}
            </View>
        </View>
    );
}

// 커스텀 탭 바 스타일 (이전 답변의 스타일 재사용 및 확인)
const styles = StyleSheet.create({
    tabBarContainer: {
        position: 'absolute',
        bottom: 0,
        left: 0,
        right: 0,
        height: 100, // 버튼 포함 높이
        alignItems: 'center',
    },
    tabBarBackground: {
        position: 'absolute',
        bottom: Platform.OS === 'ios' ? 30 : 20,
        left: 15,
        right: 15,
        height: 65,
        backgroundColor: 'rgba(255, 255, 255, 0.97)',
        borderRadius: 25,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: -2 },
        shadowOpacity: 0.1,
        shadowRadius: 5,
        elevation: 8,
    },
    tabBarContent: {
        flexDirection: 'row',
        position: 'absolute',
        bottom: Platform.OS === 'ios' ? 30 : 20,
        left: 15,
        right: 15,
        height: 65,
        // alignItems: 'flex-end', // 이 부분 때문에 아이콘 정렬이 이상했을 수 있음 -> 제거 또는 center 로 변경
        alignItems: 'center', // 아이콘들을 세로 중앙에 배치 시도
        // paddingBottom: 8,
    },
    tabBarItem: { // 일반 탭 아이템 영역 (가운데 제외 4개)
        flex: 1,
        alignItems: 'center',
        justifyContent: 'center', // 세로 중앙 정렬
        height: '100%',
    },
    tabIcon: { // 일반 탭 아이콘 크기
        width: 28,
        height: 28,
    },
    mainTabButtonContainer: { // 가운데 버튼 위치/영역 설정
         flex: 1, // 다른 아이템과 동일한 공간 차지하도록 설정
         alignItems: 'center', // 가로 중앙 정렬
         justifyContent: 'center', // 세로 중앙 정렬 시도
    },
    mainTabButton: { // 실제 보이는 동그란 버튼 스타일
        position: 'absolute', // 컨테이너 기준 절대 위치
        alignSelf: 'center', // 명시적 중앙 정렬
        top: -30, // <<< 탭 바 위로 올리는 정도 (값 조절 필요)
        backgroundColor: '#FFFACD',
        width: 65,
        height: 65,
        borderRadius: 35,
        justifyContent: 'center',
        alignItems: 'center',
        elevation: 6,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.2,
        shadowRadius: 6,
        borderWidth: 1,
        borderColor: '#eee',
    },
    mainTabIcon: { // 가운데 버튼 안의 아이콘 크기
        width: 35,
        height: 35,
    },
});
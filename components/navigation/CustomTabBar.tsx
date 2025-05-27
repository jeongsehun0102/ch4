// components/navigation/CustomTabBar.tsx

import { Colors } from '@/constants/Colors'; // 본인 Colors 경로 확인
import { useColorScheme } from '@/hooks/useColorScheme'; // 본인 useColorScheme 경로 확인
import React from 'react';
import { Image, Platform, StyleSheet, TouchableOpacity, View } from 'react-native';

// 탭 아이콘 정의 (settings 아이콘은 실제 탭이 아니므로 일단 제거 또는 주석 처리)
const tabIcons = {
  chat: require('../../assets/images/chat_icon.png'),
  records: require('../../assets/images/records_icon.png'),
  index: require('../../assets/images/main_icon.png'),
  board: require('../../assets/images/board_icon.png'),
  profile: require('../../assets/images/PersonalSetting_icon.png'),
  // settings: require('../../assets/images/set.png'), // settings가 탭이 아니라면 이 부분 제거
};

interface TabRoute {
    key: string;
    name: string;
    params?: object;
}

interface CustomTabBarProps {
    state: {
        index: number;
        routes: TabRoute[];
    };
    navigation: any;
}

export function CustomTabBar({ state, navigation }: CustomTabBarProps) {
    const colorScheme = useColorScheme() || 'light';
    const activeColor = Colors?.[colorScheme]?.tint || '#2f95dc'; // 본인 Colors 상수 사용
    const inactiveColor = Colors?.[colorScheme]?.tabIconDefault || 'gray'; // 본인 Colors 상수 사용

    return (
        <View style={styles.tabBarContainer} pointerEvents="box-none">
            <View style={styles.tabBarBackground} />
            <View style={styles.tabBarContent}>
                {state.routes.map((route, index) => {
                    // settings 탭이 아니라면 아래 조건문에서 settings 관련 로직은 실행되지 않음
                    // 또는 tabIcons에서 settings를 제거했다면, iconSource가 undefined가 되어 렌더링되지 않음
                    const isFocused = state.index === index;
                    const isMainTab = route.name === 'index';

                    let iconSource;
                    let iconColor = isFocused ? activeColor : inactiveColor;
                    let iconStyle = styles.tabIcon;

                    // 아이콘 매핑 (settings 제외)
                    if (route.name === 'chat') iconSource = tabIcons.chat;
                    else if (route.name === 'records') iconSource = tabIcons.records;
                    else if (route.name === 'index') {
                        iconSource = tabIcons.index;
                        iconColor = 'black';
                        iconStyle = styles.mainTabIcon;
                    }
                    else if (route.name === 'board') iconSource = tabIcons.board;
                    else if (route.name === 'profile') iconSource = tabIcons.profile;
                    // else if (route.name === 'settings') iconSource = tabIcons.settings; // settings 탭이 아니면 이 부분 제거

                    if (!iconSource) return null; // 매핑되는 아이콘이 없으면 렌더링하지 않음

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

                    const onLongPress = () => {
                        navigation.emit({
                            type: 'tabLongPress',
                            target: route.key,
                        });
                    };

                    if (isMainTab) {
                        return (
                            <TouchableOpacity
                                key={route.key}
                                accessibilityRole="button"
                                accessibilityState={isFocused ? { selected: true } : {}}
                                onPress={onPress}
                                onLongPress={onLongPress}
                                style={styles.mainTabButtonContainer}
                            >
                                <View style={styles.mainTabButton}>
                                    <Image source={iconSource} style={[iconStyle, { tintColor: iconColor }]} resizeMode="contain" />
                                </View>
                            </TouchableOpacity>
                        );
                    } else {
                        return (
                            <TouchableOpacity
                                key={route.key}
                                accessibilityRole="button"
                                accessibilityState={isFocused ? { selected: true } : {}}
                                onPress={onPress}
                                onLongPress={onLongPress}
                                style={styles.tabBarItem}
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

// 스타일은 본인 CustomTabBar.tsx의 것을 그대로 사용
const styles = StyleSheet.create({
    tabBarContainer: {
        position: 'absolute',
        bottom: 0,
        left: 0,
        right: 0,
        height: 100,
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
        alignItems: 'center',
    },
    tabBarItem: {
        flex: 1,
        alignItems: 'center',
        justifyContent: 'center',
        height: '100%',
    },
    tabIcon: {
        width: 28,
        height: 28,
    },
    mainTabButtonContainer: {
         flex: 1,
         alignItems: 'center',
         justifyContent: 'center',
    },
    mainTabButton: {
        position: 'absolute',
        alignSelf: 'center',
        top: -30,
        backgroundColor: '#FFFACD', // 친구분 코드의 메인 탭 배경색과 유사하게 유지
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
    mainTabIcon: {
        width: 35,
        height: 35,
    },
});
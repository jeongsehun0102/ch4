// components/navigation/CustomTabBar.tsx
import { Colors } from '@/constants/Colors';
import { useColorScheme } from '@/hooks/useColorScheme';
import React from 'react';
import { Image, Platform, StyleSheet, TouchableOpacity, View } from 'react-native';

const tabIcons = {
  chat: require('../../assets/images/chat_icon.png'),
  records: require('../../assets/images/records_icon.png'),
  index: require('../../assets/images/main_icon.png'),
  board: require('../../assets/images/board_icon.png'),
  profile: require('../../assets/images/PersonalSetting_icon.png'),
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
    const activeColor = Colors?.[colorScheme]?.tint || '#2f95dc';
    const inactiveColor = 'gray';

    return (
        <View style={styles.tabBarContainer} pointerEvents="box-none">
            <View style={styles.tabBarBackground} />
            <View style={styles.tabBarContent}>
                {state.routes.map((route, index) => {
                    const isFocused = state.index === index;
                    const isMainTab = route.name === 'index';

                    let iconSource;
                    let iconColor = isFocused ? activeColor : inactiveColor;
                    let iconStyle = styles.tabIcon;

                    if (route.name === 'chat') iconSource = tabIcons.chat;
                    else if (route.name === 'records') iconSource = tabIcons.records;
                    else if (route.name === 'index') {
                        iconSource = tabIcons.index;
                        iconColor = 'black'; // 메인 탭 아이콘 색상 고정 또는 테마 적용
                        iconStyle = styles.mainTabIcon;
                    }
                    else if (route.name === 'board') iconSource = tabIcons.board;
                    else if (route.name === 'profile') iconSource = tabIcons.profile;

                    if (!iconSource) return null;

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

const styles = StyleSheet.create({
    tabBarContainer: {
        position: 'absolute',
        bottom: 0,
        left: 0,
        right: 0,
        height: 100, // 탭 바 전체 높이 (이 값을 기준으로 패딩 설정)
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
        backgroundColor: '#FFFACD', // 메인 버튼 배경색
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
// context/MusicContext.tsx
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Audio } from 'expo-av';
import React, { createContext, ReactNode, useContext, useEffect, useRef, useState } from 'react';

type MusicContextType = {
  isMusicOn: boolean;
  setIsMusicOn: (v: boolean) => Promise<void>;
  selectedMusic: number;
  setSelectedMusic: (v: number) => Promise<void>;
  isReady: boolean;
};

const MusicContext = createContext<MusicContextType | undefined>(undefined);

export const MusicProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [isMusicOn, setIsMusicOnState] = useState(true);
  const [selectedMusic, setSelectedMusicState] = useState(1);
  const [isReady, setIsReady] = useState(false);
  const soundRef = useRef<Audio.Sound | null>(null);
  const instanceId = useRef(Math.random().toString(36).substring(7)).current; // Provider 인스턴스 ID

  console.log(`[MusicContext ${instanceId}] Provider Rendered. isReady: ${isReady}, isMusicOn: ${isMusicOn}, selectedMusic: ${selectedMusic}`);


  // 사운드 로드 및 재생/정지 로직
  const manageAudioPlayback = async (shouldPlay: boolean, trackNumber: number) => {
    console.log(`[MusicContext ${instanceId}] manageAudioPlayback called. shouldPlay: ${shouldPlay}, trackNumber: ${trackNumber}`);
    if (soundRef.current) {
      console.log(`[MusicContext ${instanceId}] Unloading previous sound.`);
      try {
        await soundRef.current.stopAsync();
        await soundRef.current.unloadAsync();
      } catch (e) {
        console.warn(`[MusicContext ${instanceId}] Error unloading previous sound:`, e);
      }
      soundRef.current = null;
    }

    if (shouldPlay) {
      console.log(`[MusicContext ${instanceId}] Attempting to load track: ${trackNumber}`);
      const file =
        trackNumber === 1
          ? require('../assets/sounds/music1.mp3')
          : require('../assets/sounds/music2.mp3');
      try {
        const { sound, status } = await Audio.Sound.createAsync(
          file,
          { shouldPlay: true, isLooping: true }
        );
        console.log(`[MusicContext ${instanceId}] Sound created. Status:`, status);
        soundRef.current = sound;
        console.log(`[MusicContext ${instanceId}] Track ${trackNumber} should be playing.`);
      } catch (error) {
        console.error(`[MusicContext ${instanceId}] Error loading or playing sound:`, error);
      }
    } else {
      console.log(`[MusicContext ${instanceId}] Music is off (shouldPlay: false).`);
    }
  };

  useEffect(() => {
    const loadStoredState = async () => {
      console.log(`[MusicContext ${instanceId}] Loading stored state...`);
      try {
        const storedMusicOn = await AsyncStorage.getItem('isMusicOn');
        const storedChoice = await AsyncStorage.getItem('selectedMusic');
        console.log(`[MusicContext ${instanceId}] From AsyncStorage - storedMusicOn: ${storedMusicOn}, storedChoice: ${storedChoice}`);

        let initialMusicOn = true;
        let initialSelectedMusic = 1;

        if (storedMusicOn !== null) initialMusicOn = storedMusicOn === 'true';
        if (storedChoice !== null) initialSelectedMusic = Number(storedChoice);

        setIsMusicOnState(initialMusicOn);
        setSelectedMusicState(initialSelectedMusic);
        console.log(`[MusicContext ${instanceId}] Initial state set - isMusicOn: ${initialMusicOn}, selectedMusic: ${initialSelectedMusic}`);
      } catch (e) {
        console.error(`[MusicContext ${instanceId}] Error loading state from AsyncStorage:`, e);
      } finally {
        setIsReady(true); // 이 시점에서 isReady가 true가 됩니다.
        console.log(`[MusicContext ${instanceId}] State loading attempt complete. isReady: true`);
      }
    };
    loadStoredState();
  }, [instanceId]); // instanceId는 변경되지 않으므로, 마운트 시 1회 실행

  useEffect(() => {
    console.log(`[MusicContext ${instanceId}] Playback useEffect triggered. isReady: ${isReady}, isMusicOn: ${isMusicOn}, selectedMusic: ${selectedMusic}`);
    if (!isReady) {
      console.log(`[MusicContext ${instanceId}] Playback useEffect: Not ready yet.`);
      return;
    }
    // isReady가 true가 된 이후에 isMusicOn 또는 selectedMusic이 변경되면 manageAudioPlayback 호출
    manageAudioPlayback(isMusicOn, selectedMusic);

  }, [isMusicOn, selectedMusic, isReady, instanceId]); // isReady를 의존성에 추가하여 isReady가 true로 바뀔 때도 실행되도록 함

  useEffect(() => {
    // 앱이 백그라운드로 가거나 할 때 오디오 세션 관리 (선택적 고급 기능)
    Audio.setAudioModeAsync({
      allowsRecordingIOS: false,
      staysActiveInBackground: true, // 음악이 백그라운드에서도 계속 재생되도록 설정
      playsInSilentModeIOS: true,
      shouldDuckAndroid: true,
      playThroughEarpieceAndroid: false,
    }).catch(error => console.error("Failed to set audio mode", error));

    return () => {
      if (soundRef.current) {
        console.log(`[MusicContext ${instanceId}] Provider unmounting, attempting to unload sound.`);
        soundRef.current.unloadAsync().catch(e => console.warn(`[MusicContext ${instanceId}] Error unloading sound on unmount:`, e));
        soundRef.current = null;
      }
    };
  }, [instanceId]);

  const setIsMusicOnHandler = async (value: boolean) => {
    console.log(`[MusicContext ${instanceId}] setIsMusicOn called with value: ${value}`);
    setIsMusicOnState(value);
    try {
      await AsyncStorage.setItem('isMusicOn', value.toString());
    } catch (e) { console.error(`[MusicContext ${instanceId}] Failed to save isMusicOn:`, e); }
  };

  const setSelectedMusicHandler = async (value: number) => {
    console.log(`[MusicContext ${instanceId}] setSelectedMusic called with value: ${value}`);
    setSelectedMusicState(value);
    try {
      await AsyncStorage.setItem('selectedMusic', value.toString());
    } catch (e) { console.error(`[MusicContext ${instanceId}] Failed to save selectedMusic:`, e); }
  };

  return (
    <MusicContext.Provider
      value={{
        isMusicOn,
        setIsMusicOn: setIsMusicOnHandler,
        selectedMusic,
        setSelectedMusic: setSelectedMusicHandler,
        isReady,
      }}
    >
      {children}
    </MusicContext.Provider>
  );
};

export const useMusic = () => {
  const context = useContext(MusicContext);
  if (!context) throw new Error('useMusic must be used within MusicProvider');
  return context;
};
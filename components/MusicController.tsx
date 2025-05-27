// components/MusicController.tsx
import { useEffect, useRef } from 'react'; // Audio import 제거
import { useMusic } from '../context/MusicContext';

const MusicController = () => {
  const { isReady, isMusicOn, selectedMusic } = useMusic();
  const instanceId = useRef(Math.random().toString(36).substring(7)).current;

  // MusicContext에서 상태를 제대로 받아오는지 로그로 확인
  useEffect(() => {
    console.log(`[MusicController ${instanceId}] Rendered. Context state - isReady: ${isReady}, isMusicOn: ${isMusicOn}, selectedMusic: ${selectedMusic}`);
  }, [isReady, isMusicOn, selectedMusic, instanceId]);


  // 앱 상태 변경 감지 (백그라운드/포그라운드) - 선택적 기능
  // 이 부분은 친구분 코드에는 없었지만, 음악 제어 안정성을 위해 추가 고려 가능
  // useEffect(() => {
  //   const subscription = AppState.addEventListener('change', (nextAppState: AppStateStatus) => {
  //     console.log(`[MusicController ${instanceId}] AppState changed to: ${nextAppState}`);
  //     if (nextAppState.match(/inactive|background/)) {
  //       // 앱이 백그라운드로 갈 때 음악을 일시 정지하고 싶다면 여기서 Context 함수 호출
  //       // (단, MusicContext에 pause/resume 함수가 추가로 필요)
  //       // console.log('App is in background, potentially pausing music.');
  //     } else if (nextAppState === 'active') {
  //       // 앱이 포그라운드로 돌아올 때
  //       // console.log('App is in foreground, potentially resuming music.');
  //     }
  //   });
  //   return () => {
  //     subscription.remove();
  //   };
  // }, [instanceId]);

  // 실제 Audio 객체 생성 및 제어 로직은 MusicContext로 이전되었으므로,
  // 이 컴포넌트는 UI를 렌더링하지 않습니다.
  return null;
};

export default MusicController;
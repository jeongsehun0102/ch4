// CH4/images.d.ts (또는 declarations.d.ts)

declare module '*.png' {
    const value: import('react-native').ImageSourcePropType;
    export default value;
  }
  
  declare module '*.jpg' {
    const value: import('react-native').ImageSourcePropType;
    export default value;
  }
  
  // 필요시 다른 이미지 타입(gif, jpeg 등)도 추가
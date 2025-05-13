// app/(tabs)/board.tsx
import React from 'react';
import { StyleSheet, Text, View } from 'react-native';

export default function BoardScreen() {
  return (
    <View style={styles.container}>
      <Text style={styles.title}>Board Screen</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  title: { fontSize: 20, fontWeight: 'bold' },
});
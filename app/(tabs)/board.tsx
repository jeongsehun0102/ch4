import { Ionicons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import React from 'react';
import {
  FlatList,
  KeyboardAvoidingView,
  Platform,
  SafeAreaView,
  StyleSheet,
  Text,
  View,
} from 'react-native';

interface ChecklistItem {
  id: string;
  text: string;
}

const data: ChecklistItem[] = [
  { id: '1', text: "요즘, ‘나는 괜찮은 사람이다’라는.." },
  { id: '2', text: "식욕이 예전보다 줄었거나, 반대로.." },
  { id: '3', text: "거울을 볼 때, 내 모습이 별로라.." },
  { id: '4', text: "하루 종일 누워있거나 아무것 .." },
  { id: '5', text: "이유 없이 짜증이 나거나, 사소.." },
  { id: '6', text: "오늘은 어떤 일이 인상깊었는지 .." },
  { id: '7', text: "혹시 고민하는 걱정거리가 있어 .." },
  { id: '8', text: "이제는 말할 수 있다! 난사실 .." },
];

export default function ChecklistScreen() {
  const navigation = useNavigation();

  return (
    <SafeAreaView style={styles.container}>
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        style={{ flex: 1 }}
      >
        <View style={{ flex: 1, justifyContent: 'flex-start' }}>

          {/* 헤더 */}
          <View style={styles.header}>
            <View style={styles.uploadButton} /> {/* 왼쪽 빈공간 */}
            <View style={styles.titleContainer}>
              <Text style={styles.title}>응원하기</Text>
            </View>
            <View style={styles.uploadButton}>
              <Ionicons
                name="create-outline"
                size={24}
                color="#D97B7B"
                //onPress={() => navigation.navigate('boardForm')} // 실제 라우팅 이름으로 변경
              />
            </View>
          </View>

          {/* 카드 리스트 */}
          <FlatList
            data={data}
            keyExtractor={(item) => item.id}
            contentContainerStyle={{ paddingBottom: 160, alignItems: 'stretch' }}
            renderItem={({ item }) => (
              <View style={styles.itemRow}>
                <View style={styles.cardImage}>
                  <Ionicons name="image" size={40} color="gray" />
                </View>
                <View style={styles.cardContent}>
                  <Text style={styles.cardTitle}>{item.text.slice(0, 10)}...</Text>
                  <Text style={styles.cardDescription}>{item.text}</Text>
                  <Text style={styles.cardDate}>2025-05-20</Text>
                </View>
              </View>
            )}
            ListFooterComponent={
              <View style={{ alignItems: 'center', marginTop: 20, marginBottom: 40 }}>
                <View style={styles.pagination}>
                  {[1, 2, 3, 4, 5].map((n) => (
                    <Text
                      key={n}
                      style={[styles.pageNumber, n === 1 && styles.activePage]}
                    >
                      {n}
                    </Text>
                  ))}
                </View>
              </View>
            }
          />
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#eeffdd',
    paddingTop: 80,
    paddingHorizontal: 20,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 10,
  },
  titleContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  title: {
    fontSize: 28,
    fontWeight: '900',
  },
  uploadButton: {
    width: 34,
    height: 34,
    backgroundColor: '#FCE0E0',
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  cardImage: {
    width: 60,
    height: 60,
    borderRadius: 8,
    backgroundColor: '#eee',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  cardContent: {
    flex: 1,
    justifyContent: 'center',
  },
  cardTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    marginBottom: 4,
  },
  cardDescription: {
    fontSize: 14,
    color: '#444',
  },
  cardDate: {
    fontSize: 12,
    color: 'gray',
    marginTop: 4,
  },
  itemRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'flex-start',
    paddingHorizontal: 16,
    marginVertical: 8,
    marginHorizontal: 16,
    backgroundColor: '#fff',
    borderRadius: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
    height: 100,
  },
  pagination: {
    flexDirection: 'row',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 12,
  },
  pageNumber: {
    marginHorizontal: 6,
    fontSize: 16,
  },
  activePage: {
    color: 'red',
    fontWeight: 'bold',
  },
});

import { useEffect, useState } from 'react';
import { Modal, Pressable, ScrollView, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import * as Haptics from 'expo-haptics';
import { Analytics } from '@/lib/analytics';

interface Props {
  isVisible: boolean;
  onClose: () => void;
  theaters: string[];
  initialSelectedTheaters: string[];
  movies: string[];
  initialSelectedMovies: string[];
  onApply: (theaters: string[], movies: string[]) => void;
}

function Chip({
  label,
  selected,
  onPress,
}: {
  label: string;
  selected: boolean;
  onPress: () => void;
}) {
  return (
    <Pressable
      onPress={onPress}
      style={{
        paddingHorizontal: 14,
        paddingVertical: 7,
        borderRadius: 6,
        borderWidth: 1,
        borderColor: selected ? '#f97316' : '#3a3a3c',
        backgroundColor: selected ? '#f97316' : '#2c2c2e',
        marginBottom: 8,
        marginRight: 8,
      }}
    >
      <Text style={{ color: selected ? '#fff' : '#9ca3af', fontSize: 13, fontWeight: '500' }}>
        {label}
      </Text>
    </Pressable>
  );
}

export default function FilterModal({
  isVisible,
  onClose,
  theaters,
  initialSelectedTheaters,
  movies,
  initialSelectedMovies,
  onApply,
}: Props) {
  const insets = useSafeAreaInsets();
  const [pendingTheaters, setPendingTheaters] = useState<string[]>([]);
  const [pendingMovies, setPendingMovies] = useState<string[]>([]);

  useEffect(() => {
    if (isVisible) {
      setPendingTheaters(initialSelectedTheaters);
      setPendingMovies(initialSelectedMovies);
    }
  }, [isVisible]);

  function toggleTheater(t: string) {
    Haptics.selectionAsync();
    setPendingTheaters((prev) =>
      prev.includes(t) ? prev.filter((x) => x !== t) : [...prev, t]
    );
  }

  function toggleMovie(m: string) {
    Haptics.selectionAsync();
    setPendingMovies((prev) =>
      prev.includes(m) ? prev.filter((x) => x !== m) : [...prev, m]
    );
  }

  function handleReset() {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    Analytics.filterReset();
    setPendingTheaters([]);
    setPendingMovies([]);
    onApply([], []);
  }

  function handleApply() {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    Analytics.filterApply(pendingTheaters.length, pendingMovies.length);
    onApply(pendingTheaters, pendingMovies);
    onClose();
  }

  const totalActive = pendingTheaters.length + pendingMovies.length;

  return (
    <Modal
      visible={isVisible}
      animationType="slide"
      presentationStyle="pageSheet"
      onRequestClose={onClose}
    >
      <View style={{ flex: 1, backgroundColor: '#1c1c1e', paddingTop: insets.top > 0 ? insets.top : 16 }}>
        {/* 헤더 */}
        <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 20, paddingBottom: 16, borderBottomWidth: 1, borderBottomColor: '#3a3a3c' }}>
          <Text style={{ color: '#fff', fontSize: 17, fontWeight: '700' }}>필터</Text>
          <Pressable onPress={onClose}>
            <Text style={{ color: '#9ca3af', fontSize: 15 }}>닫기</Text>
          </Pressable>
        </View>

        <ScrollView contentContainerStyle={{ padding: 20, paddingBottom: 120 }}>
          {/* 영화관 섹션 */}
          <Text style={{ color: '#fff', fontSize: 15, fontWeight: '700', marginBottom: 12 }}>
            영화관
          </Text>
          <View style={{ flexDirection: 'row', flexWrap: 'wrap' }}>
            {theaters.map((t) => (
              <Chip
                key={t}
                label={t}
                selected={pendingTheaters.includes(t)}
                onPress={() => toggleTheater(t)}
              />
            ))}
          </View>

          {/* 영화 섹션 */}
          <Text style={{ color: '#fff', fontSize: 15, fontWeight: '700', marginTop: 20, marginBottom: 12 }}>
            영화
          </Text>
          <View style={{ flexDirection: 'row', flexWrap: 'wrap' }}>
            {movies.map((m) => (
              <Chip
                key={m}
                label={m}
                selected={pendingMovies.includes(m)}
                onPress={() => toggleMovie(m)}
              />
            ))}
          </View>
        </ScrollView>

        {/* 하단 버튼 */}
        <View style={{ position: 'absolute', bottom: 0, left: 0, right: 0, padding: 16, paddingBottom: insets.bottom + 12, backgroundColor: '#1c1c1e', borderTopWidth: 1, borderTopColor: '#3a3a3c', flexDirection: 'row', gap: 8 }}>
          <Pressable
            onPress={handleReset}
            style={{ flex: 1, borderRadius: 8, paddingVertical: 15, alignItems: 'center', borderWidth: 1, borderColor: '#3a3a3c', backgroundColor: '#2c2c2e' }}
          >
            <Text style={{ color: '#9ca3af', fontSize: 15, fontWeight: '600' }}>초기화</Text>
          </Pressable>
          <Pressable
            onPress={handleApply}
            style={{ flex: 4, borderRadius: 8, paddingVertical: 15, alignItems: 'center', backgroundColor: '#f97316' }}
          >
            <Text style={{ color: '#fff', fontSize: 16, fontWeight: '700' }}>
              {totalActive > 0 ? `적용하기 (${totalActive})` : '적용하기'}
            </Text>
          </Pressable>
        </View>
      </View>
    </Modal>
  );
}

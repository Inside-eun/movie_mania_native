import * as Haptics from 'expo-haptics';
import { Pressable, Text, View } from 'react-native';

interface Props {
  activeCount: number;
  onOpenFilter: () => void;
  sortByDistance: boolean;
  isLocationLoading: boolean;
  onToggleDistance: () => void;
}

const SORT_BTN = {
  base: {
    paddingHorizontal: 14,
    paddingVertical: 7,
    borderWidth: 1,
    borderColor: '#3a3a3c',
    backgroundColor: '#2c2c2e',
  },
  active: {
    borderColor: '#f97316',
    backgroundColor: 'rgba(249,115,22,0.15)',
  },
};

export default function MovieFilter({
  activeCount,
  onOpenFilter,
  sortByDistance,
  isLocationLoading,
  onToggleDistance,
}: Props) {
  return (
    <View
      style={{
        flexShrink: 0,
        paddingHorizontal: 12,
        paddingVertical: 8,
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
      }}
    >
      {/* 왼쪽: 시간순 / 거리순 */}
      <View
        style={{
          flexDirection: 'row',
          borderRadius: 6,
          borderWidth: 1,
          borderColor: '#3a3a3c',
          overflow: 'hidden',
        }}
      >
        <Pressable
          onPress={() => {
            Haptics.selectionAsync();
            if (sortByDistance) onToggleDistance();
          }}
          style={[
            { paddingHorizontal: 14, paddingVertical: 7 },
            !sortByDistance
              ? { backgroundColor: 'rgba(249,115,22,0.15)' }
              : { backgroundColor: '#2c2c2e' },
          ]}
        >
          <Text
            style={{
              color: !sortByDistance ? '#f97316' : '#9ca3af',
              fontSize: 13,
              fontWeight: '600',
            }}
          >
            시간순
          </Text>
        </Pressable>

        <View style={{ width: 1, backgroundColor: '#3a3a3c' }} />

        <Pressable
          onPress={() => {
            Haptics.selectionAsync();
            if (!sortByDistance) onToggleDistance();
          }}
          style={[
            {
              paddingHorizontal: 14,
              paddingVertical: 7,
              flexDirection: 'row',
              alignItems: 'center',
              gap: 5,
            },
            sortByDistance
              ? { backgroundColor: 'rgba(249,115,22,0.15)' }
              : { backgroundColor: '#2c2c2e' },
          ]}
        >
          <Text
            style={{
              color: sortByDistance ? '#f97316' : '#9ca3af',
              fontSize: 13,
              fontWeight: '600',
            }}
          >
            거리순
          </Text>
        </Pressable>
      </View>

      {/* 오른쪽: 필터 */}
      <Pressable
        onPress={() => {
          Haptics.selectionAsync();
          onOpenFilter();
        }}
        style={{
          flexDirection: 'row',
          alignItems: 'center',
          gap: 6,
          paddingHorizontal: 14,
          paddingVertical: 7,
          borderRadius: 6,
          borderWidth: 1,
          borderColor: activeCount > 0 ? '#f97316' : '#3a3a3c',
          backgroundColor: activeCount > 0 ? 'rgba(249,115,22,0.15)' : '#2c2c2e',
        }}
      >
        <Text
          style={{
            color: activeCount > 0 ? '#f97316' : '#9ca3af',
            fontSize: 13,
            fontWeight: '600',
          }}
        >
          필터{activeCount > 0 ? ` (${activeCount})` : ''}
        </Text>
      </Pressable>
    </View>
  );
}

import * as Haptics from 'expo-haptics';
import { Pressable, Text, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Analytics } from '@/lib/analytics';
import type { LayoutMode } from '@/types';

interface Props {
  activeCount: number;
  onOpenFilter: () => void;
  sortByDistance: boolean;
  isLocationLoading: boolean;
  onToggleDistance: () => void;
  layoutMode: LayoutMode;
  onChangeLayout: (mode: LayoutMode) => void;
}

const LAYOUT_CYCLE: LayoutMode[] = ['grid2', 'grid3', 'list'];

const LAYOUT_ICON: Record<LayoutMode, keyof typeof Ionicons.glyphMap> = {
  grid2: 'grid-outline',
  grid3: 'apps-outline',
  list: 'list-outline',
};

function nextLayoutMode(current: LayoutMode): LayoutMode {
  const idx = LAYOUT_CYCLE.indexOf(current);
  return LAYOUT_CYCLE[(idx + 1) % LAYOUT_CYCLE.length];
}


export default function MovieFilter({
  activeCount,
  onOpenFilter,
  sortByDistance,
  isLocationLoading,
  onToggleDistance,
  layoutMode,
  onChangeLayout,
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
            if (sortByDistance) {
              Analytics.sortChange('time');
              onToggleDistance();
            }
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
            if (!sortByDistance) {
              Analytics.sortChange('distance');
              onToggleDistance();
            }
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

      {/* 오른쪽: 레이아웃 순환 버튼 + 필터 */}
      <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
        <Pressable
          onPress={() => {
            Haptics.selectionAsync();
            const next = nextLayoutMode(layoutMode);
            Analytics.layoutChange(next);
            onChangeLayout(next);
          }}
          style={{
            paddingHorizontal: 10,
            paddingVertical: 7,
            borderRadius: 6,
            borderWidth: 1,
            borderColor: '#3a3a3c',
            backgroundColor: '#2c2c2e',
            alignItems: 'center',
            justifyContent: 'center',
          }}
        >
          <Ionicons name={LAYOUT_ICON[layoutMode]} size={16} color="#9ca3af" />
        </Pressable>

        <Pressable
          onPress={() => {
            Haptics.selectionAsync();
            Analytics.filterOpen();
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
    </View>
  );
}

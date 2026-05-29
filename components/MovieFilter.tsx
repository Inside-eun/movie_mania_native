import { Pressable, Text, View } from 'react-native';
import * as Haptics from 'expo-haptics';

interface Props {
  activeCount: number;
  onOpenFilter: () => void;
}

export default function MovieFilter({ activeCount, onOpenFilter }: Props) {
  return (
    <View style={{ flexShrink: 0, paddingHorizontal: 12, paddingVertical: 8 }}>
      <Pressable
        onPress={() => { Haptics.selectionAsync(); onOpenFilter(); }}
        style={{
          alignSelf: 'flex-start',
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
        <Text style={{ color: activeCount > 0 ? '#f97316' : '#9ca3af', fontSize: 13, fontWeight: '600' }}>
          필터{activeCount > 0 ? ` (${activeCount})` : ''}
        </Text>
      </Pressable>
    </View>
  );
}

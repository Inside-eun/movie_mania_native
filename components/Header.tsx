import { View, Text } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

export default function Header() {
  const insets = useSafeAreaInsets();

  return (
    <View
      style={{ paddingTop: insets.top }}
      className="bg-background border-b border-border px-4 pb-3"
    >
      <Text className="text-white text-xl font-bold tracking-tight">
        🎬 영화방랑자
      </Text>
      <Text className="text-gray-400 text-xs mt-0.5">
        서울 예술영화관 상영시간표
      </Text>
    </View>
  );
}

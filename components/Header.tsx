import { View, Text } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

export default function Header() {
  const insets = useSafeAreaInsets();

  return (
    <View
      style={{ paddingTop: insets.top }}
      className="bg-background border-b border-border items-center pb-4"
    >
      <Text className="text-white text-xl font-bold tracking-tight">
        영화방랑자
      </Text>
    </View>
  );
}

import { useEffect } from 'react';
import { View } from 'react-native';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withRepeat,
  withSequence,
  withTiming,
} from 'react-native-reanimated';

interface Props {
  cardWidth: number;
  list?: boolean;
}

export default function SkeletonCard({ cardWidth, list = false }: Props) {
  const cardHeight = list ? 100 : cardWidth * 1.5;
  const opacity = useSharedValue(0.3);

  useEffect(() => {
    opacity.value = withRepeat(
      withSequence(
        withTiming(0.7, { duration: 700 }),
        withTiming(0.3, { duration: 700 })
      ),
      -1,
      false
    );
  }, []);

  const animatedStyle = useAnimatedStyle(() => ({
    opacity: opacity.value,
  }));

  if (list) {
    return (
      <View style={{ width: cardWidth, height: 100, flexDirection: 'row' }} className="rounded-xl overflow-hidden bg-surface">
        <Animated.View style={[{ width: 70, height: 100 }, animatedStyle]} className="bg-gray-800" />
        <View style={{ flex: 1, padding: 10, gap: 8, justifyContent: 'space-between' }}>
          <Animated.View style={[{ height: 13, borderRadius: 4 }, animatedStyle]} className="bg-gray-800 w-4/5" />
          <View style={{ gap: 6 }}>
            <Animated.View style={[{ height: 11, borderRadius: 4 }, animatedStyle]} className="bg-gray-800 w-3/5" />
            <Animated.View style={[{ height: 11, borderRadius: 4 }, animatedStyle]} className="bg-gray-800 w-2/5" />
          </View>
        </View>
      </View>
    );
  }

  return (
    <View
      style={{ width: cardWidth }}
      className="rounded-xl overflow-hidden bg-surface"
    >
      <Animated.View
        style={[{ height: cardHeight }, animatedStyle]}
        className="bg-gray-800"
      />
      <View className="p-2 gap-1">
        <Animated.View
          style={[{ height: 12, borderRadius: 4 }, animatedStyle]}
          className="bg-gray-800 w-4/5"
        />
        <Animated.View
          style={[{ height: 10, borderRadius: 4 }, animatedStyle]}
          className="bg-gray-800 w-3/5"
        />
        <Animated.View
          style={[{ height: 10, borderRadius: 4 }, animatedStyle]}
          className="bg-gray-800 w-2/5"
        />
      </View>
    </View>
  );
}

import { useEffect } from 'react';
import { Dimensions, View } from 'react-native';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withRepeat,
  withSequence,
  withTiming,
} from 'react-native-reanimated';

const { width: screenWidth } = Dimensions.get('window');
const CARD_WIDTH = (screenWidth - 40) / 2;
const CARD_HEIGHT = CARD_WIDTH * 1.5;

export default function SkeletonCard() {
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

  return (
    <View
      style={{ width: CARD_WIDTH }}
      className="rounded-xl overflow-hidden bg-surface"
    >
      <Animated.View
        style={[{ height: CARD_HEIGHT }, animatedStyle]}
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

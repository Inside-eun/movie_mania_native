import { Dimensions, Pressable, Text, View } from 'react-native';
import { Image } from 'expo-image';
import * as Haptics from 'expo-haptics';
import type { MovieSchedule } from '@/types';

interface Props {
  movie: MovieSchedule;
  isWishlisted: boolean;
  onPress: () => void;
  onToggleWishlist: () => void;
}

const { width: screenWidth } = Dimensions.get('window');
const CARD_WIDTH = (screenWidth - 40) / 2;
const CARD_HEIGHT = CARD_WIDTH * 1.5;

function getPosterUri(movie: MovieSchedule): string | null {
  return movie.tmdbPosterUrl ?? movie.posterUrl ?? null;
}

export default function MovieCard({ movie, isWishlisted, onPress, onToggleWishlist }: Props) {
  const posterUri = getPosterUri(movie);

  function handleWishlistPress() {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    onToggleWishlist();
  }

  return (
    <Pressable
      onPress={onPress}
      style={{ width: CARD_WIDTH }}
      className="rounded-xl overflow-hidden bg-surface"
    >
      {/* Poster */}
      <View style={{ height: CARD_HEIGHT }}>
        {posterUri ? (
          <Image
            source={{ uri: posterUri }}
            style={{ width: CARD_WIDTH, height: CARD_HEIGHT }}
            contentFit="cover"
            transition={200}
            placeholder={{ blurhash: 'L6PZfSi_.AyE_3t7t7R**0o#DgR4' }}
          />
        ) : (
          <View
            style={{ width: CARD_WIDTH, height: CARD_HEIGHT }}
            className="bg-gray-800 items-center justify-center"
          >
            <Text className="text-gray-600 text-3xl">🎬</Text>
          </View>
        )}

        {/* Gradient overlay at bottom */}
        <View
          className="absolute bottom-0 left-0 right-0 p-2"
          style={{ backgroundColor: 'rgba(0,0,0,0.65)' }}
        >
          <Text className="text-white text-xs font-bold" numberOfLines={2}>
            {movie.title}
          </Text>
        </View>

        {/* Wishlist button */}
        <Pressable
          onPress={handleWishlistPress}
          hitSlop={8}
          className="absolute top-2 right-2"
        >
          <Text style={{ fontSize: 20, lineHeight: 24 }}>
            {isWishlisted ? '❤️' : '🤍'}
          </Text>
        </Pressable>
      </View>

      {/* Info below poster */}
      <View className="p-2 gap-0.5">
        <Text className="text-gray-400 text-xs" numberOfLines={1}>
          {movie.theater}
        </Text>
        <Text className="text-primary text-sm font-semibold">
          {movie.time}
        </Text>
        {movie.runtime && (
          <Text className="text-gray-500 text-xs">{movie.runtime}분</Text>
        )}
      </View>
    </Pressable>
  );
}

import { Pressable, Text, View } from 'react-native';
import { Image } from 'expo-image';
import * as Haptics from 'expo-haptics';
import { Ionicons } from '@expo/vector-icons';
import { Analytics } from '@/lib/analytics';
import type { LayoutMode, MovieSchedule } from '@/types';

interface Props {
  movie: MovieSchedule;
  isWishlisted: boolean;
  onPress: () => void;
  onToggleWishlist: () => void;
  distanceKm?: number | null;
  cardWidth: number;
  layoutMode?: LayoutMode;
}

const LIST_POSTER_WIDTH = 70;
const LIST_ITEM_HEIGHT = 100;

function getPosterUri(movie: MovieSchedule): string | null {
  return movie.tmdbPosterUrl ?? movie.posterUrl ?? null;
}

export default function MovieCard({ movie, isWishlisted, onPress, onToggleWishlist, distanceKm, cardWidth, layoutMode = 'grid2' }: Props) {
  const posterUri = getPosterUri(movie);
  const cardHeight = cardWidth * 1.5;

  function handleWishlistPress() {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    if (isWishlisted) {
      Analytics.wishlistRemove(movie.title, movie.theater);
    } else {
      Analytics.wishlistAdd(movie.title, movie.theater);
    }
    onToggleWishlist();
  }

  const distanceLabel = distanceKm != null
    ? (distanceKm < 1 ? `${Math.round(distanceKm * 1000)}m` : `${distanceKm.toFixed(1)}km`)
    : movie.area;

  if (layoutMode === 'list') {
    return (
      <Pressable
        onPress={onPress}
        style={{ width: cardWidth, height: LIST_ITEM_HEIGHT, flexDirection: 'row' }}
        className="rounded-lg overflow-hidden bg-surface"
      >
        {/* 포스터 */}
        {posterUri ? (
          <Image
            source={{ uri: posterUri }}
            style={{ width: LIST_POSTER_WIDTH, height: LIST_ITEM_HEIGHT }}
            contentFit="cover"
            transition={200}
            placeholder={{ blurhash: 'L6PZfSi_.AyE_3t7t7R**0o#DgR4' }}
          />
        ) : (
          <View style={{ width: LIST_POSTER_WIDTH, height: LIST_ITEM_HEIGHT }} className="bg-gray-800 items-center justify-center">
            <Text className="text-gray-600 text-2xl">🎬</Text>
          </View>
        )}

        {/* 정보 */}
        <View style={{ flex: 1, paddingHorizontal: 10, paddingVertical: 10, justifyContent: 'space-between' }}>
          {/* 제목 + 하트 */}
          <View style={{ flexDirection: 'row', alignItems: 'flex-start' }}>
            <Text style={{ color: '#ffffff', fontSize: 13, fontWeight: '700', flex: 1, marginRight: 8 }} numberOfLines={2}>
              {movie.title}
            </Text>
            <Pressable onPress={handleWishlistPress} hitSlop={8}>
              <Ionicons
                name={isWishlisted ? 'heart' : 'heart-outline'}
                size={18}
                color={isWishlisted ? '#f97316' : '#9ca3af'}
              />
            </Pressable>
          </View>

          {/* 시간 + 영화관/위치 */}
          <View style={{ gap: 4 }}>
            <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
              <Text style={{ color: '#9ca3af', fontSize: 12 }} numberOfLines={1}>
                {movie.theater}
              </Text>
              <Text style={{ color: '#6b7280', fontSize: 11, marginLeft: 8, flexShrink: 0 }}>
                {distanceLabel}
              </Text>
            </View>
            <Text style={{ color: '#f97316', fontSize: 13, fontWeight: '600' }}>
              {movie.time}
            </Text>
          </View>
        </View>
      </Pressable>
    );
  }

  return (
    <Pressable
      onPress={onPress}
      style={{ width: cardWidth }}
      className="rounded-lg overflow-hidden bg-surface"
    >
      {/* 포스터 */}
      <View style={{ height: cardHeight }}>
        {posterUri ? (
          <Image
            source={{ uri: posterUri }}
            style={{ width: cardWidth, height: cardHeight }}
            contentFit="cover"
            transition={200}
            placeholder={{ blurhash: 'L6PZfSi_.AyE_3t7t7R**0o#DgR4' }}
          />
        ) : (
          <View
            style={{ width: cardWidth, height: cardHeight }}
            className="bg-gray-800 items-center justify-center"
          >
            <Text className="text-gray-600 text-3xl">🎬</Text>
          </View>
        )}

        {/* 찜 버튼 */}
        <Pressable
          onPress={handleWishlistPress}
          hitSlop={8}
          className="absolute top-2 right-2"
          style={{ backgroundColor: 'rgba(0,0,0,0.45)', borderRadius: 20, padding: 5 }}
        >
          <Ionicons
            name={isWishlisted ? 'heart' : 'heart-outline'}
            size={18}
            color={isWishlisted ? '#f97316' : '#ffffff'}
          />
        </Pressable>
      </View>

      {/* 포스터 아래 정보 */}
      <View style={{ paddingHorizontal: 8, paddingTop: 8, paddingBottom: 6, gap: 4 }}>
        {/* 제목 + 시간 */}
        <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
          <Text style={{ color: '#ffffff', fontSize: 11, fontWeight: '700', flex: 1, marginRight: 4 }} numberOfLines={1}>
            {movie.title}
          </Text>
          <Text style={{ color: '#f97316', fontSize: 11, fontWeight: '600', flexShrink: 0 }}>
            {movie.time}
          </Text>
        </View>
        {/* 영화관 + 위치 */}
        <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
          <Text style={{ color: '#9ca3af', fontSize: 10, flex: 1, marginRight: 4 }} numberOfLines={1}>
            {movie.theater}
          </Text>
          <Text style={{ color: '#6b7280', fontSize: 10, flexShrink: 0 }}>
            {distanceLabel}
          </Text>
        </View>
      </View>
    </Pressable>
  );
}

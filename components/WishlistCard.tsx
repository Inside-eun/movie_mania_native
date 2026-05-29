import { Alert, Pressable, Text, View } from 'react-native';
import { Image } from 'expo-image';
import * as Haptics from 'expo-haptics';
import Ionicons from '@expo/vector-icons/Ionicons';
import { Colors } from '@/constants/Colors';
import { getMovieKey } from '@/store/wishlistStore';
import {
  cancelNotification,
  getNotificationId,
  requestPermission,
  scheduleMovieNotification,
} from '@/lib/notifications';
import type { WishlistMovie } from '@/types';

interface Props {
  movie: WishlistMovie;
  onRemove: () => void;
  onNotificationChange: (key: string, notificationId: string | undefined) => void;
}

function getPosterUri(movie: WishlistMovie): string | null {
  return movie.tmdbPosterUrl ?? movie.posterUrl ?? null;
}

export default function WishlistCard({ movie, onRemove, onNotificationChange }: Props) {
  const posterUri = getPosterUri(movie);

  const showtime = movie.showtime ? new Date(movie.showtime as string) : null;
  const now = new Date();
  const notifyAt = showtime ? new Date(showtime.getTime() - 60 * 60 * 1000) : null;
  const isPast = showtime ? showtime <= now : false;
  const canSchedule = notifyAt ? notifyAt > now : false;
  const hasNotification = !!movie.notificationId;

  async function handleBellPress() {
    if (!notifyAt) return;
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);

    if (hasNotification && movie.notificationId) {
      await cancelNotification(movie.notificationId);
      onNotificationChange(getMovieKey(movie), undefined);
    } else {
      const granted = await requestPermission();
      if (!granted) {
        Alert.alert('알림 권한 필요', '설정에서 알림 권한을 허용해 주세요.');
        return;
      }
      const id = getNotificationId(movie.title, movie.theater, movie.time);
      await scheduleMovieNotification(id, movie.title, movie.theater, notifyAt);
      onNotificationChange(getMovieKey(movie), id);
    }
  }

  return (
    <View
      className="flex-row items-center rounded-xl overflow-hidden mb-3"
      style={{ backgroundColor: Colors.surface }}
    >
      {/* Poster */}
      <View style={{ width: 72, height: 108 }}>
        {posterUri ? (
          <Image
            source={{ uri: posterUri }}
            style={{ width: 72, height: 108 }}
            contentFit="cover"
            transition={200}
            placeholder={{ blurhash: 'L6PZfSi_.AyE_3t7t7R**0o#DgR4' }}
          />
        ) : (
          <View
            style={{ width: 72, height: 108 }}
            className="bg-gray-800 items-center justify-center"
          >
            <Text style={{ fontSize: 24 }}>🎬</Text>
          </View>
        )}
      </View>

      {/* Info */}
      <View className="flex-1 px-3 py-2">
        <Text className="text-white font-bold text-sm" numberOfLines={2}>
          {movie.title}
        </Text>
        <Text className="text-gray-400 text-xs mt-1">{movie.theater}</Text>
        <Text className="text-primary text-sm font-semibold mt-0.5">{movie.time}</Text>
        {movie.runtime && (
          <Text className="text-gray-500 text-xs">{movie.runtime}분</Text>
        )}
        {isPast && (
          <Text style={{ color: '#ef4444', fontSize: 11, marginTop: 2 }}>종료됨</Text>
        )}
      </View>

      {/* Actions */}
      <View className="flex-col items-center pr-3" style={{ gap: 12 }}>
        {!isPast && canSchedule && (
          <Pressable onPress={handleBellPress} hitSlop={8}>
            <Ionicons
              name={hasNotification ? 'notifications' : 'notifications-outline'}
              size={22}
              color={hasNotification ? Colors.primary : Colors.text.muted}
            />
          </Pressable>
        )}
        <Pressable
          onPress={() => {
            Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
            onRemove();
          }}
          hitSlop={8}
        >
          <Ionicons name="trash-outline" size={20} color={Colors.text.muted} />
        </Pressable>
      </View>
    </View>
  );
}

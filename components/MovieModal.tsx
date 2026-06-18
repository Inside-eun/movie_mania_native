import BottomSheet, {
  BottomSheetScrollView,
  BottomSheetBackdrop,
  type BottomSheetBackdropProps,
} from '@gorhom/bottom-sheet';
import { useRef, useEffect, useMemo, useCallback, useState } from 'react';
import { ActivityIndicator, Alert, Pressable, Share, Text, View } from 'react-native';
import { Image } from 'expo-image';
import * as Haptics from 'expo-haptics';
import * as WebBrowser from 'expo-web-browser';
import { Colors } from '@/constants/Colors';
import { api } from '@/lib/api';
import { Analytics } from '@/lib/analytics';
import type { MovieSchedule } from '@/types';

interface Props {
  movie: MovieSchedule | null;
  isVisible: boolean;
  onClose: () => void;
  selectedDate: string;
}

function calcEndTime(time: string, runtimeStr: string | undefined): string {
  if (!runtimeStr) return '';
  const mins = parseInt(runtimeStr, 10);
  if (isNaN(mins)) return '';
  const [h, m] = time.split(':').map(Number);
  const total = h * 60 + m + mins;
  return `${String(Math.floor(total / 60) % 24).padStart(2, '0')}:${String(total % 60).padStart(2, '0')}`;
}

function MetaRow({ label, value }: { label: string; value: string }) {
  return (
    <View className="flex-row justify-between items-center py-1">
      <Text className="text-gray-500 text-sm">{label}</Text>
      <Text className="text-white text-sm font-medium">{value}</Text>
    </View>
  );
}

export default function MovieModal({ movie, isVisible, onClose, selectedDate }: Props) {
  const sheetRef = useRef<BottomSheet>(null);
  const snapPoints = useMemo(() => ['85%'], []);
  const [booking, setBooking] = useState(false);

  useEffect(() => {
    if (isVisible) {
      sheetRef.current?.snapToIndex(0);
    } else {
      sheetRef.current?.close();
    }
  }, [isVisible]);

  const renderBackdrop = useCallback(
    (props: BottomSheetBackdropProps) => (
      <BottomSheetBackdrop
        {...props}
        appearsOnIndex={0}
        disappearsOnIndex={-1}
        pressBehavior="close"
      />
    ),
    []
  );

  async function handleBooking() {
    if (!movie) return;
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    Analytics.bookingClick(movie.title, movie.theater, movie.time);
    setBooking(true);
    try {
      const res = await api.getBookingUrl(movie.theater, movie.title, movie.time, selectedDate);
      const url = (res.data as { url?: string })?.url;
      if (url) {
        Analytics.bookingSuccess(movie.title, movie.theater);
        await WebBrowser.openBrowserAsync(url);
      } else {
        Analytics.bookingFail(movie.title, movie.theater);
        Alert.alert('예매 오류', '예매 링크를 찾을 수 없습니다.');
      }
    } catch {
      Analytics.bookingFail(movie.title, movie.theater);
      Alert.alert('예매 오류', '예매 링크를 불러올 수 없습니다.');
    } finally {
      setBooking(false);
    }
  }

  async function handleShare() {
    if (!movie) return;
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    Analytics.shareClick(movie.title, movie.theater);
    try {
      await Share.share({
        message: `🎬 ${movie.title}\n${movie.theater} · ${movie.time}${movie.runtime ? ` (${movie.runtime}분)` : ''}\n\n#영화방랑자 #서울예술영화관`,
      });
    } catch {
      // 사용자가 공유를 취소한 경우 무시
    }
  }

  const posterUri = movie?.tmdbPosterUrl ?? movie?.posterUrl ?? null;
  const endTime = movie ? calcEndTime(movie.time, movie.runtime) : '';
  const metaLine = [
    movie?.director,
    movie?.prodYear,
    movie?.runtime ? `${movie.runtime}분` : null,
    movie?.cCodeSubName2,
  ]
    .filter(Boolean)
    .join(' · ');

  return (
    <BottomSheet
      ref={sheetRef}
      index={-1}
      snapPoints={snapPoints}
      enablePanDownToClose
      backdropComponent={renderBackdrop}
      onChange={(index) => { if (index === -1) onClose(); }}
      backgroundStyle={{ backgroundColor: Colors.surface }}
      handleIndicatorStyle={{ backgroundColor: Colors.text.muted, width: 40 }}
    >
      <BottomSheetScrollView showsVerticalScrollIndicator={false}>
        {movie && (
          <>
            {/* 포스터 배너 */}
            <View style={{ height: 200, backgroundColor: Colors.background }}>
              {posterUri && (
                <Image
                  source={{ uri: posterUri }}
                  style={{ width: '100%', height: '100%' }}
                  contentFit="cover"
                  transition={200}
                />
              )}
              <View
                style={{
                  position: 'absolute',
                  top: 0, left: 0, right: 0, bottom: 0,
                  backgroundColor: 'rgba(0,0,0,0.45)',
                }}
              />
              {/* 포스터 위에 제목 */}
              <View style={{ position: 'absolute', bottom: 16, left: 20, right: 20 }}>
                <Text className="text-white text-xl font-bold" numberOfLines={2}>
                  {movie.title}
                </Text>
                {metaLine ? (
                  <Text className="text-gray-300 text-xs mt-1">{metaLine}</Text>
                ) : null}
              </View>
            </View>

            <View className="px-5 py-4" style={{ gap: 16 }}>
              {/* 상영 정보 */}
              <View
                className="rounded-lg p-4"
                style={{ backgroundColor: Colors.background, gap: 2 }}
              >
                <MetaRow label="극장" value={movie.theater} />
                {movie.screen ? <MetaRow label="상영관" value={movie.screen} /> : null}
                <MetaRow label="시작" value={movie.time} />
                {endTime ? <MetaRow label="종료" value={endTime} /> : null}
                {movie.area ? <MetaRow label="지역" value={movie.area} /> : null}
              </View>

              {/* 줄거리 */}
              {movie.tmdbOverview ? (
                <Text className="text-gray-400 text-sm leading-relaxed" numberOfLines={5}>
                  {movie.tmdbOverview}
                </Text>
              ) : null}

              {/* 출연 */}
              {movie.cActors ? (
                <Text className="text-gray-500 text-xs" numberOfLines={2}>
                  출연: {movie.cActors}
                </Text>
              ) : null}

              {/* 버튼 영역 */}
              <View className="flex-row" style={{ gap: 10 }}>
                <Pressable
                  onPress={handleBooking}
                  disabled={booking}
                  className="flex-1 rounded-lg py-3.5 items-center justify-center"
                  style={{ backgroundColor: Colors.primary }}
                >
                  {booking ? (
                    <ActivityIndicator color="#fff" size="small" />
                  ) : (
                    <Text className="text-white font-bold text-base">예매하기</Text>
                  )}
                </Pressable>

                <Pressable
                  onPress={handleShare}
                  className="rounded-lg items-center justify-center border border-border"
                  style={{ width: 52, backgroundColor: Colors.surface }}
                >
                  <Text style={{ fontSize: 20 }}>📤</Text>
                </Pressable>
              </View>
            </View>
          </>
        )}
      </BottomSheetScrollView>
    </BottomSheet>
  );
}

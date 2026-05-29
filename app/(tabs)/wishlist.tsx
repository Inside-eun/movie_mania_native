import { useMemo, useState } from 'react';
import { Alert, FlatList, Pressable, SectionList, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Calendar } from 'react-native-calendars';
import Ionicons from '@expo/vector-icons/Ionicons';
import * as Haptics from 'expo-haptics';
import WishlistCard from '@/components/WishlistCard';
import { useWishlist } from '@/hooks/useWishlist';
import { Colors } from '@/constants/Colors';
import { getMovieKey } from '@/store/wishlistStore';
import type { WishlistMovie } from '@/types';

type ViewMode = 'list' | 'calendar';

function formatDateLabel(dateStr: string): string {
  if (!dateStr) return '날짜 없음';
  try {
    const d = new Date(dateStr + 'T00:00:00');
    const days = ['일', '월', '화', '수', '목', '금', '토'];
    const month = d.getMonth() + 1;
    const day = d.getDate();
    const dayOfWeek = days[d.getDay()];
    return `${month}월 ${day}일 (${dayOfWeek})`;
  } catch {
    return dateStr;
  }
}

export default function WishlistScreen() {
  const insets = useSafeAreaInsets();
  const [viewMode, setViewMode] = useState<ViewMode>('list');
  const [selectedCalendarDate, setSelectedCalendarDate] = useState('');

  const { wishlistMovies, clearAll, getWishlistByDate, toggleWishlist, updateNotificationId } =
    useWishlist();

  const grouped = useMemo(() => getWishlistByDate(), [getWishlistByDate]);

  const sections = useMemo(
    () => grouped.map(({ date, movies }) => ({ title: date, data: movies })),
    [grouped]
  );

  const markedDates = useMemo(() => {
    const marks: Record<string, object> = {};
    for (const { date } of grouped) {
      if (date) {
        marks[date] = { marked: true, dotColor: Colors.primary };
      }
    }
    if (selectedCalendarDate) {
      marks[selectedCalendarDate] = {
        ...(marks[selectedCalendarDate] ?? {}),
        selected: true,
        selectedColor: Colors.primary,
        marked: !!marks[selectedCalendarDate],
        dotColor: '#ffffff',
      };
    }
    return marks;
  }, [grouped, selectedCalendarDate]);

  const calendarDayMovies = useMemo(() => {
    if (!selectedCalendarDate) return [];
    return grouped.find((g) => g.date === selectedCalendarDate)?.movies ?? [];
  }, [grouped, selectedCalendarDate]);

  function handleRemove(movie: WishlistMovie) {
    toggleWishlist(movie, '');
  }

  function handleClearAll() {
    if (wishlistMovies.length === 0) return;
    Alert.alert('찜 목록 비우기', '모든 찜 항목을 삭제하시겠습니까?', [
      { text: '취소', style: 'cancel' },
      {
        text: '삭제',
        style: 'destructive',
        onPress: () => {
          Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
          clearAll();
        },
      },
    ]);
  }

  const isEmpty = wishlistMovies.length === 0;

  return (
    <View style={{ flex: 1, backgroundColor: Colors.background, paddingTop: insets.top }}>
      {/* Header */}
      <View
        className="flex-row items-center justify-between px-4 py-3"
        style={{ borderBottomColor: Colors.border, borderBottomWidth: 1 }}
      >
        <View className="flex-row items-center" style={{ gap: 8 }}>
          <Ionicons name="heart" size={20} color={Colors.primary} />
          <Text className="text-white text-lg font-bold">찜 목록</Text>
          {wishlistMovies.length > 0 && (
            <View
              className="rounded-full px-2 py-0.5"
              style={{ backgroundColor: Colors.primary }}
            >
              <Text className="text-white text-xs font-bold">{wishlistMovies.length}</Text>
            </View>
          )}
        </View>
        {!isEmpty && (
          <Pressable onPress={handleClearAll} hitSlop={8}>
            <Text style={{ color: Colors.text.muted, fontSize: 14 }}>전체 삭제</Text>
          </Pressable>
        )}
      </View>

      {isEmpty ? (
        <View className="flex-1 items-center justify-center" style={{ gap: 12 }}>
          <Ionicons name="heart-outline" size={56} color={Colors.text.muted} />
          <Text style={{ color: Colors.text.muted, fontSize: 16 }}>찜한 영화가 없습니다</Text>
          <Text style={{ color: Colors.border, fontSize: 14 }}>
            홈에서 마음에 드는 영화를 찜해보세요
          </Text>
        </View>
      ) : (
        <>
          {/* View Toggle */}
          <View
            className="flex-row mx-4 my-3 rounded-xl overflow-hidden"
            style={{ backgroundColor: Colors.surface }}
          >
            {(['list', 'calendar'] as ViewMode[]).map((mode) => (
              <Pressable
                key={mode}
                onPress={() => setViewMode(mode)}
                className="flex-1 py-2 items-center"
                style={viewMode === mode ? { backgroundColor: Colors.primary } : undefined}
              >
                <Text
                  className="text-sm font-semibold"
                  style={{ color: viewMode === mode ? '#ffffff' : Colors.text.muted }}
                >
                  {mode === 'list' ? '리스트 뷰' : '달력 뷰'}
                </Text>
              </Pressable>
            ))}
          </View>

          {viewMode === 'list' ? (
            <SectionList
              sections={sections}
              keyExtractor={(item, index) => `${getMovieKey(item)}-${index}`}
              contentContainerStyle={{ paddingHorizontal: 16, paddingBottom: 24 }}
              stickySectionHeadersEnabled={false}
              renderSectionHeader={({ section: { title } }) => (
                <View style={{ paddingVertical: 8 }}>
                  <Text style={{ color: Colors.text.secondary, fontSize: 13, fontWeight: '600' }}>
                    {formatDateLabel(title)}
                  </Text>
                </View>
              )}
              renderItem={({ item }) => (
                <WishlistCard
                  movie={item}
                  onRemove={() => handleRemove(item)}
                  onNotificationChange={updateNotificationId}
                />
              )}
            />
          ) : (
            <FlatList
              data={calendarDayMovies}
              keyExtractor={(item, index) => `${getMovieKey(item)}-${index}`}
              contentContainerStyle={{ paddingHorizontal: 16, paddingBottom: 24 }}
              ListHeaderComponent={
                <>
                  <Calendar
                    markedDates={markedDates}
                    onDayPress={(day) => setSelectedCalendarDate(day.dateString)}
                    theme={{
                      backgroundColor: Colors.background,
                      calendarBackground: Colors.background,
                      textSectionTitleColor: Colors.text.secondary,
                      selectedDayBackgroundColor: Colors.primary,
                      selectedDayTextColor: '#ffffff',
                      todayTextColor: Colors.primary,
                      dayTextColor: Colors.text.primary,
                      textDisabledColor: Colors.text.muted,
                      dotColor: Colors.primary,
                      selectedDotColor: '#ffffff',
                      arrowColor: Colors.primary,
                      monthTextColor: Colors.text.primary,
                      indicatorColor: Colors.primary,
                    }}
                  />
                  {selectedCalendarDate ? (
                    <View style={{ paddingVertical: 8 }}>
                      <Text
                        style={{ color: Colors.text.secondary, fontSize: 13, fontWeight: '600' }}
                      >
                        {formatDateLabel(selectedCalendarDate)}
                      </Text>
                    </View>
                  ) : null}
                </>
              }
              ListEmptyComponent={
                <View className="items-center py-8">
                  <Text style={{ color: Colors.text.muted, fontSize: 14 }}>
                    {selectedCalendarDate
                      ? '이 날 찜한 영화가 없습니다'
                      : '날짜를 선택하면 찜 목록을 확인할 수 있습니다'}
                  </Text>
                </View>
              }
              renderItem={({ item }) => (
                <WishlistCard
                  movie={item}
                  onRemove={() => handleRemove(item)}
                  onNotificationChange={updateNotificationId}
                />
              )}
            />
          )}
        </>
      )}
    </View>
  );
}

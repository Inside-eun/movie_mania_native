import { useState, useCallback } from 'react';
import { useFocusEffect } from 'expo-router';
import { Alert, Dimensions, FlatList, RefreshControl, Text, View } from 'react-native';
import { Analytics } from '@/lib/analytics';
import Header from '@/components/Header';
import DateSelector from '@/components/DateSelector';
import MovieFilter from '@/components/MovieFilter';
import FilterModal from '@/components/FilterModal';
import MovieCard from '@/components/MovieCard';
import SkeletonCard from '@/components/SkeletonCard';
import MovieModal from '@/components/MovieModal';
import { useMovieSchedules, haversineKm } from '@/hooks/useMovieSchedules';
import { useWishlist } from '@/hooks/useWishlist';
import { useUserLocation } from '@/hooks/useUserLocation';
import { useSettingsStore } from '@/store/settingsStore';
import type { LayoutMode, MovieSchedule } from '@/types';

function getTodayString(): string {
  const d = new Date();
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${y}-${m}-${day}`;
}

const { width: SCREEN_WIDTH } = Dimensions.get('window');
const H_PAD = 16;
const GAP = 8;

function getCardWidth(layoutMode: LayoutMode): number {
  if (layoutMode === 'list') return SCREEN_WIDTH - H_PAD * 2;
  const cols = layoutMode === 'grid3' ? 3 : 2;
  return (SCREEN_WIDTH - H_PAD * 2 - GAP * (cols - 1)) / cols;
}

export default function HomeScreen() {
  const [selectedDate, setSelectedDate] = useState<string>(getTodayString);
  const [selectedTheaters, setSelectedTheaters] = useState<string[]>([]);
  const [selectedMovieTitles, setSelectedMovieTitles] = useState<string[]>([]);
  const [selectedMovie, setSelectedMovie] = useState<MovieSchedule | null>(null);
  const [filterVisible, setFilterVisible] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [sortByDistance, setSortByDistance] = useState(false);
  const [layoutMode, setLayoutMode] = useState<LayoutMode>('grid2');

  const { showPastSchedules } = useSettingsStore();
  const { location, isLoading: isLocationLoading, requestLocation, clearLocation } = useUserLocation();

  const { filteredMovies, uniqueTheaters, uniqueMovies, isLoading, isError, error, refetch } =
    useMovieSchedules(selectedDate, selectedTheaters, selectedMovieTitles, showPastSchedules, sortByDistance, location);

  const handleToggleDistance = useCallback(async () => {
    if (sortByDistance) {
      setSortByDistance(false);
      clearLocation();
      return;
    }
    const result = await requestLocation();
    if (result.ok) {
      setSortByDistance(true);
    } else {
      Alert.alert('위치 오류', result.errorMsg ?? '위치를 가져올 수 없습니다');
    }
  }, [sortByDistance, requestLocation, clearLocation]);

  useFocusEffect(
    useCallback(() => {
      Analytics.screenView('Home');
    }, [])
  );

  const { isInWishlist, toggleWishlist } = useWishlist();

  const handleRefresh = useCallback(async () => {
    setRefreshing(true);
    await refetch();
    setRefreshing(false);
  }, [refetch]);

  const handleApplyFilter = useCallback((theaters: string[], movies: string[]) => {
    setSelectedTheaters(theaters);
    setSelectedMovieTitles(movies);
  }, []);

  const activeFilterCount = selectedTheaters.length + selectedMovieTitles.length;

  return (
    <View className="flex-1 bg-background">
      <Header />
      <DateSelector selectedDate={selectedDate} onSelectDate={setSelectedDate} />
      <MovieFilter
        activeCount={activeFilterCount}
        onOpenFilter={() => setFilterVisible(true)}
        sortByDistance={sortByDistance}
        isLocationLoading={isLocationLoading}
        onToggleDistance={handleToggleDistance}
        layoutMode={layoutMode}
        onChangeLayout={setLayoutMode}
      />

      {(() => {
        const numCols = layoutMode === 'grid3' ? 3 : layoutMode === 'list' ? 1 : 2;
        const cardWidth = getCardWidth(layoutMode);
        const isList = layoutMode === 'list';
        const skeletonCount = numCols === 3 ? 9 : isList ? 5 : 6;
        const skeletons = Array.from({ length: skeletonCount }, (_, i) => i);
        const colWrapperStyle = numCols > 1 ? { gap: GAP, paddingHorizontal: H_PAD } : undefined;
        const contentStyle = isList
          ? { gap: GAP, paddingTop: 8, paddingBottom: 24, paddingHorizontal: H_PAD }
          : { gap: GAP, paddingTop: 8, paddingBottom: 24 };

        return isLoading && !refreshing ? (
          <FlatList
            key={layoutMode}
            style={{ flex: 1 }}
            data={skeletons}
            numColumns={numCols}
            keyExtractor={(item) => String(item)}
            columnWrapperStyle={colWrapperStyle}
            contentContainerStyle={contentStyle}
            scrollEnabled={false}
            renderItem={() => <SkeletonCard cardWidth={cardWidth} list={isList} />}
          />
        ) : (
          <FlatList
            key={layoutMode}
            style={{ flex: 1 }}
            data={filteredMovies}
            numColumns={numCols}
            keyExtractor={(item, index) =>
              `${item.title}-${item.theater}-${item.time}-${index}`
            }
            columnWrapperStyle={colWrapperStyle}
            contentContainerStyle={contentStyle}
            refreshControl={
              <RefreshControl
                refreshing={refreshing}
                onRefresh={handleRefresh}
                tintColor="#f97316"
              />
            }
            ListHeaderComponent={
              isError ? (
                <Text className="text-red-400 text-sm text-center px-4 py-2">{error}</Text>
              ) : null
            }
            ListEmptyComponent={
              <View className="items-center justify-center py-20">
                <Text className="text-gray-500 text-base">상영 일정이 없습니다</Text>
              </View>
            }
            renderItem={({ item }) => (
              <MovieCard
                movie={item}
                isWishlisted={isInWishlist(item)}
                onPress={() => {
                  Analytics.movieDetailView(item.title, item.theater, item.time);
                  setSelectedMovie(item);
                }}
                onToggleWishlist={() => toggleWishlist(item, selectedDate)}
                distanceKm={
                  sortByDistance && location && item.latitude != null && item.longitude != null
                    ? haversineKm(location.latitude, location.longitude, item.latitude, item.longitude)
                    : null
                }
                cardWidth={cardWidth}
                layoutMode={layoutMode}
              />
            )}
          />
        );
      })()}

      <FilterModal
        isVisible={filterVisible}
        onClose={() => setFilterVisible(false)}
        theaters={uniqueTheaters}
        initialSelectedTheaters={selectedTheaters}
        movies={uniqueMovies}
        initialSelectedMovies={selectedMovieTitles}
        onApply={handleApplyFilter}
      />

      <MovieModal
        movie={selectedMovie}
        isVisible={!!selectedMovie}
        onClose={() => setSelectedMovie(null)}
        selectedDate={selectedDate}
      />
    </View>
  );
}

import { useState, useCallback } from 'react';
import { Alert, FlatList, RefreshControl, Text, View } from 'react-native';
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
import type { MovieSchedule } from '@/types';

function getTodayString(): string {
  const d = new Date();
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${y}-${m}-${day}`;
}

const SKELETONS = Array.from({ length: 6 }, (_, i) => i);

export default function HomeScreen() {
  const [selectedDate, setSelectedDate] = useState<string>(getTodayString);
  const [selectedTheaters, setSelectedTheaters] = useState<string[]>([]);
  const [selectedMovieTitles, setSelectedMovieTitles] = useState<string[]>([]);
  const [selectedMovie, setSelectedMovie] = useState<MovieSchedule | null>(null);
  const [filterVisible, setFilterVisible] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [sortByDistance, setSortByDistance] = useState(false);

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
      />

      {isLoading && !refreshing ? (
        <FlatList
          style={{ flex: 1 }}
          data={SKELETONS}
          numColumns={2}
          keyExtractor={(item) => String(item)}
          columnWrapperStyle={{ gap: 8, paddingHorizontal: 16 }}
          contentContainerStyle={{ gap: 8, paddingTop: 8, paddingBottom: 24 }}
          scrollEnabled={false}
          renderItem={() => <SkeletonCard />}
        />
      ) : (
        <FlatList
          style={{ flex: 1 }}
          data={filteredMovies}
          numColumns={2}
          keyExtractor={(item, index) =>
            `${item.title}-${item.theater}-${item.time}-${index}`
          }
          columnWrapperStyle={{ gap: 8, paddingHorizontal: 16 }}
          contentContainerStyle={{ gap: 8, paddingTop: 8, paddingBottom: 24 }}
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
              onPress={() => setSelectedMovie(item)}
              onToggleWishlist={() => toggleWishlist(item, selectedDate)}
              distanceKm={
                sortByDistance && location && item.latitude != null && item.longitude != null
                  ? haversineKm(location.latitude, location.longitude, item.latitude, item.longitude)
                  : null
              }
            />
          )}
        />
      )}

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

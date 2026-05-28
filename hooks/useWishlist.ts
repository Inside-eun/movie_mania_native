import { useCallback } from 'react';
import * as Haptics from 'expo-haptics';
import { useWishlistStore, getMovieKey } from '@/store/wishlistStore';
import type { MovieSchedule, WishlistMovie } from '@/types';

export function useWishlist() {
  const { movies, add, remove, has, clear, updateNotificationId } = useWishlistStore();

  const isInWishlist = useCallback(
    (movie: MovieSchedule): boolean => has(getMovieKey(movie)),
    [has]
  );

  const toggleWishlist = useCallback(
    (movie: MovieSchedule, selectedDate: string) => {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
      const key = getMovieKey(movie);

      if (has(key)) {
        remove(key);
      } else {
        const [hours, minutes] = movie.time.split(':').map(Number);
        const showtime = new Date(selectedDate);
        showtime.setHours(hours, minutes, 0, 0);

        const wishlistMovie: WishlistMovie = {
          ...movie,
          showtime: showtime.toISOString(),
        };
        add(wishlistMovie);
      }
    },
    [has, add, remove]
  );

  const getWishlistByDate = useCallback(() => {
    const grouped: Record<string, WishlistMovie[]> = {};

    for (const movie of movies) {
      let date = '';
      if (movie.showtime) {
        try {
          const parsed = new Date(movie.showtime as string);
          if (!isNaN(parsed.getTime())) {
            const y = parsed.getFullYear();
            const m = String(parsed.getMonth() + 1).padStart(2, '0');
            const d = String(parsed.getDate()).padStart(2, '0');
            date = `${y}-${m}-${d}`;
          }
        } catch {
          // ignore
        }
      }
      if (!grouped[date]) grouped[date] = [];
      grouped[date].push(movie);
    }

    return Object.keys(grouped)
      .sort()
      .map((date) => ({
        date,
        movies: grouped[date].sort((a, b) => a.time.localeCompare(b.time)),
      }));
  }, [movies]);

  return {
    wishlistMovies: movies,
    count: movies.length,
    isInWishlist,
    toggleWishlist,
    clearAll: clear,
    getWishlistByDate,
    updateNotificationId,
  };
}

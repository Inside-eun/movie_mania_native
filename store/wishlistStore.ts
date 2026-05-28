import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import { zustandStorage } from '@/lib/storage';
import type { WishlistMovie } from '@/types';

export function getMovieKey(movie: { movieCode?: string; title: string; theater: string; time: string }): string {
  return movie.movieCode
    ? `${movie.movieCode}-${movie.theater}-${movie.time}`
    : `${movie.title}-${movie.theater}-${movie.time}`;
}

interface WishlistState {
  movies: WishlistMovie[];
  add: (movie: WishlistMovie) => void;
  remove: (key: string) => void;
  has: (key: string) => boolean;
  clear: () => void;
  updateNotificationId: (key: string, notificationId: string | undefined) => void;
}

export const useWishlistStore = create<WishlistState>()(
  persist(
    (set, get) => ({
      movies: [],

      add: (movie) => {
        const key = getMovieKey(movie);
        if (get().has(key)) return;
        set((state) => ({ movies: [...state.movies, movie] }));
      },

      remove: (key) => {
        set((state) => ({
          movies: state.movies.filter((m) => getMovieKey(m) !== key),
        }));
      },

      has: (key) => {
        return get().movies.some((m) => getMovieKey(m) === key);
      },

      clear: () => set({ movies: [] }),

      updateNotificationId: (key, notificationId) => {
        set((state) => ({
          movies: state.movies.map((m) =>
            getMovieKey(m) === key ? { ...m, notificationId } : m
          ),
        }));
      },
    }),
    {
      name: 'wishlist-store',
      storage: createJSONStorage(() => zustandStorage),
    }
  )
);

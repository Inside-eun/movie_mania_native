import { useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';
import { api } from '@/lib/api';
import type { MovieSchedule } from '@/types';

function getLocalDateString(date: Date): string {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, '0');
  const d = String(date.getDate()).padStart(2, '0');
  return `${y}-${m}-${d}`;
}

function parseMovieTime(timeStr: string, dateStr: string): Date {
  const [h, m] = timeStr.split(':').map(Number);
  const d = new Date(dateStr);
  d.setHours(h, m, 0, 0);
  return d;
}

export function useMovieSchedules(
  selectedDate: string,
  selectedTheaters: string[],
  selectedMovies: string[],
  showPastSchedules: boolean
) {
  const { data, isLoading, isError, error, refetch } = useQuery({
    queryKey: ['schedules', selectedDate],
    queryFn: async () => {
      const res = await api.getSchedules(selectedDate);
      return res.data;
    },
    staleTime: 1000 * 60 * 60,  // 1시간 캐시
    gcTime: 1000 * 60 * 60 * 2, // 2시간 GC
    retry: 2,
  });

  const allMovies: MovieSchedule[] = data?.data ?? [];

  const uniqueTheaters = useMemo(
    () => [...new Set(allMovies.map((m) => m.theater))].sort(),
    [allMovies]
  );

  const uniqueMovies = useMemo(
    () => [...new Set(allMovies.map((m) => m.title))].sort(),
    [allMovies]
  );

  const filteredMovies = useMemo(() => {
    const now = new Date();
    const isToday = selectedDate === getLocalDateString(new Date());

    let movies = allMovies;

    if (selectedTheaters.length > 0) {
      movies = movies.filter((m) => selectedTheaters.includes(m.theater));
    }

    if (selectedMovies.length > 0) {
      movies = movies.filter((m) => selectedMovies.includes(m.title));
    }

    if (isToday && !showPastSchedules) {
      movies = movies.filter((m) => parseMovieTime(m.time, selectedDate) > now);
    }

    return movies;
  }, [allMovies, selectedTheaters, selectedMovies, selectedDate, showPastSchedules]);

  const pastSchedulesCount = useMemo(() => {
    const now = new Date();
    const isToday = selectedDate === getLocalDateString(new Date());
    if (!isToday) return 0;

    let movies = allMovies;
    if (selectedTheaters.length > 0) {
      movies = movies.filter((m) => selectedTheaters.includes(m.theater));
    }
    return movies.filter((m) => parseMovieTime(m.time, selectedDate) <= now).length;
  }, [allMovies, selectedTheaters, selectedDate]);

  return {
    allMovies,
    filteredMovies,
    uniqueTheaters,
    uniqueMovies,
    isLoading,
    isError,
    error: isError ? (error as Error).message : null,
    lastUpdate: data?.timestamp ?? null,
    pastSchedulesCount,
    refetch,
  };
}

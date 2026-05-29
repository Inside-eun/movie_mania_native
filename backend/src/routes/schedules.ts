import { Router, Request, Response } from 'express';

// globalThis.File polyfill (cheerio/undici 의존)
if (typeof globalThis.File === 'undefined' && typeof globalThis.Blob !== 'undefined') {
  (globalThis as any).File = class File extends (globalThis as any).Blob {
    name: string;
    lastModified: number;
    constructor(
      bits: any[],
      name: string,
      options?: { type?: string; lastModified?: number }
    ) {
      super(bits, options);
      this.name = name ?? '';
      this.lastModified = options?.lastModified ?? Date.now();
    }
  };
}

interface TMDBMovieSummary {
  title: string;
  tmdbId: number;
  originalTitle: string;
  overview: string;
  posterUrl: string | null;
  releaseDate: string | null;
  voteAverage: number;
}

interface MovieSchedule {
  title: string;
  theater: string;
  area?: string;
  screen?: string;
  movieCode?: string;
  time: string;
  showtime: Date | string;
  latitude?: number;
  longitude?: number;
  tmdbPosterUrl?: string;
  tmdbReleaseDate?: string;
  tmdbOverview?: string;
  [key: string]: unknown;
}

async function mergeTMDBData(movies: MovieSchedule[], cache: any): Promise<MovieSchedule[]> {
  const db = await cache.getTmdbDb();
  return movies.map((movie: MovieSchedule) => {
    const key = (movie.title ?? '').trim().replace(/\s+/g, ' ');
    const tmdb = db[key];
    if (tmdb) {
      return {
        ...movie,
        tmdbPosterUrl: tmdb.posterUrl ?? undefined,
        tmdbReleaseDate: tmdb.releaseDate ?? undefined,
        tmdbOverview: tmdb.overview ?? undefined,
      };
    }
    return movie;
  });
}

const router = Router();

router.get('/', async (req: Request, res: Response) => {
  try {
    const type = (req.query.type as string) || 'integrated'; // 'integrated', 'kofa', 'art'
    const dateParam = req.query.date as string | undefined;
    const forceFresh = req.query.force === 'true';

    const { ScheduleService } = require('../services/scheduleService');
    const { cacheService } = require('../services/cacheService');

    const scheduleService = new ScheduleService();
    const cache = cacheService;

    let movies: MovieSchedule[] = [];
    let fromCache = false;

    // 날짜 파라미터가 있으면 해당 날짜로, 없으면 오늘 날짜로
    let targetDate = new Date();
    if (dateParam) {
      const parsed = new Date(dateParam);
      if (!isNaN(parsed.getTime())) {
        targetDate = parsed;
      }
    }

    const dateStr = targetDate.toISOString().split('T')[0]; // YYYY-MM-DD

    // 강제 새로고침이 아닌 경우 캐시 먼저 확인
    if (!forceFresh) {
      const cachedData = (await cache.get(type, dateStr)) as MovieSchedule[] | null;
      if (cachedData) {
        console.log(`캐시에서 ${type} 데이터 반환`);
        movies = cachedData.map((movie) => ({
          ...movie,
          showtime:
            typeof movie.showtime === 'string' ? new Date(movie.showtime) : movie.showtime,
        }));
        fromCache = true;
      }
    }

    if (!fromCache) {
      movies = await scheduleService.crawlArtCinemasWithKMDBByDate(targetDate);
    }

    // TMDB DB에서 포스터/상세정보 머지
    movies = await mergeTMDBData(movies, cache);

    // 시간순 정렬
    movies.sort((a, b) => a.time.localeCompare(b.time));

    // showtime을 ISO string으로 직렬화
    const serializedMovies = movies.map((movie: MovieSchedule) => ({
      ...movie,
      showtime:
        movie.showtime instanceof Date
          ? movie.showtime.toISOString()
          : typeof movie.showtime === 'string'
          ? movie.showtime
          : new Date(movie.showtime as any).toISOString(),
    }));

    const cacheStats = cache.getStats();

    return res.json({
      success: true,
      count: serializedMovies.length,
      data: serializedMovies,
      cache: {
        fromCache,
        stats: cacheStats,
        date: dateStr,
        type,
      },
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    console.error('스케줄 API 에러:', error);
    return res.status(500).json({
      success: false,
      error: '스케줄 조회 중 오류가 발생했습니다',
      details: error instanceof Error ? error.message : '알 수 없는 오류',
      stack:
        process.env.NODE_ENV === 'development' && error instanceof Error
          ? error.stack
          : undefined,
    });
  }
});

export default router;

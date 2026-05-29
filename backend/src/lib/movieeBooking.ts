// Express용 in-memory 캐시 (next/cache의 unstable_cache 대체)
const _cache = new Map<string, { value: any; expiresAt: number }>();

function withCache<T>(
  fn: (...args: any[]) => Promise<T>,
  keyFn: (...args: any[]) => string,
  revalidateSeconds: number,
) {
  return async (...args: any[]): Promise<T> => {
    const key = keyFn(...args);
    const cached = _cache.get(key);
    if (cached && Date.now() < cached.expiresAt) {
      return cached.value as T;
    }
    const value = await fn(...args);
    _cache.set(key, { value, expiresAt: Date.now() + revalidateSeconds * 1000 });
    return value;
  };
}

interface MovieeCinemaConfig {
  tId: string;
  fallbackUrl: string;
}

export const MOVIEE_CINEMAS: Record<string, MovieeCinemaConfig> = {
  'KU시네마테크': {
    tId: '121',
    fallbackUrl: 'https://moviee.co.kr/Movie/Ticket?tId=121',
  },
  'KT&G 상상마당 Cinema': {
    tId: '123',
    fallbackUrl: 'https://moviee.co.kr/Movie/Ticket?tId=123',
  },
  '필름포럼': {
    tId: '130',
    fallbackUrl: 'https://moviee.co.kr/Movie/Ticket?tId=130',
  },
};

export function isSupportedMovieeTheater(theaterName: string): boolean {
  return theaterName in MOVIEE_CINEMAS;
}

export function getMovieeFallbackUrl(theaterName: string): string | null {
  return MOVIEE_CINEMAS[theaterName]?.fallbackUrl ?? null;
}

interface MovieePlayEntry {
  M_ID: string;
  M_NM: string;
  GRPM_ID: string;
  T_ID: string;
  TS_ID: string;
  PNO: number;
  PLAY_TIME: string;
  PLAY_DT: string;
  [key: string]: unknown;
}

async function _fetchMovieePlayTimeList(
  tId: string,
  date: string,
): Promise<MovieePlayEntry[]> {
  const playDt = date.length === 8
    ? `${date.substring(0, 4)}-${date.substring(4, 6)}-${date.substring(6, 8)}`
    : date;

  const params = new URLSearchParams({
    tId,
    mId: '',
    playDt,
    ntId: '',
    gId: '',
  });

  const res = await fetch(
    `https://moviee.co.kr/api/TicketApi/GetPlayTimeList?${params}`,
    {
      headers: {
        'User-Agent':
          'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/139.0.0.0 Safari/537.36',
        Accept: 'application/json',
        Referer: `https://moviee.co.kr/Movie/Ticket?tId=${tId}`,
      },
    },
  );

  if (!res.ok) throw new Error(`moviee GetPlayTimeList 오류: ${res.status}`);

  const data = await res.json() as any;
  return data?.ResCd === '00' && Array.isArray(data?.ResData?.Table)
    ? data.ResData.Table
    : [];
}

// 극장+날짜 단위로 10분 캐싱
const fetchMovieePlayTimeList = withCache(
  _fetchMovieePlayTimeList,
  (tId: string, date: string) => `moviee-playtime-${tId}-${date}`,
  600,
);

function normalizeMovieTitle(title: string): string {
  return title
    .replace(/\([^)]*\)/g, '')
    .trim();
}

export async function buildMovieeBookingUrl(
  theaterName: string,
  movieTitle: string,
  time: string,
  date: string,
): Promise<{ url: string; isFallback: boolean } | null> {
  const config = MOVIEE_CINEMAS[theaterName];
  if (!config) return null;

  try {
    const plays = await fetchMovieePlayTimeList(config.tId, date);

    if (plays.length === 0) {
      return { url: config.fallbackUrl, isFallback: true };
    }

    // Convert "HH:MM" → "HHMM" for comparison with PLAY_TIME
    const targetTime = time.replace(':', '').substring(0, 4);
    const normalizedTitle = normalizeMovieTitle(movieTitle);

    const matched = plays.find((p) => {
      const movieeTitle = normalizeMovieTitle(p.M_NM);
      const titleMatch =
        movieeTitle === normalizedTitle ||
        movieeTitle.includes(normalizedTitle) ||
        normalizedTitle.includes(movieeTitle);
      return titleMatch && p.PLAY_TIME === targetTime;
    });

    if (!matched) {
      console.warn(`moviee 매칭 실패: ${movieTitle} ${time}`);
      return { url: config.fallbackUrl, isFallback: true };
    }

    const playDate = matched.PLAY_DT.replace(/-/g, '');

    const bookingUrl =
      `https://moviee.co.kr/Movie/Ticket` +
      `?gId=${matched.M_ID}` +
      `&tId=${matched.T_ID}` +
      `&playDate=${playDate}` +
      `&pno=${matched.PNO}` +
      `&tsid=${matched.TS_ID}`;

    return { url: bookingUrl, isFallback: false };
  } catch (error) {
    console.error('moviee 예매 URL 생성 실패:', error);
    return { url: config.fallbackUrl, isFallback: true };
  }
}

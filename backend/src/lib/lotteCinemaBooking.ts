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

interface LotteCinemaConfig {
  cinemaCode: number;
  cinemaID: string; // "DivisionCode|DetailDivisionCode|CinemaID" for API
  fallbackUrl: string;
}

export const LOTTE_CINEMAS: Record<string, LotteCinemaConfig> = {
  '롯데시네마 신도림': {
    cinemaCode: 1015,
    cinemaID: '1|0001|1015',
    fallbackUrl: 'https://www.lottecinema.co.kr/NLCHS/ticketing',
  },
};

export function isSupportedLotteTheater(theaterName: string): boolean {
  return theaterName in LOTTE_CINEMAS;
}

export function getLotteFallbackUrl(theaterName: string): string | null {
  return LOTTE_CINEMAS[theaterName]?.fallbackUrl ?? null;
}

interface LottePlayEntry {
  MovieNameKR: string;
  RepresentationMovieCode: string;
  ScreenID: number;
  CinemaID: number;
  StartTime: string;
  PlayDt: string;
  IsBookingYN: string | null;
  [key: string]: unknown;
}

async function _fetchLottePlaySequence(
  cinemaID: string,
  date: string,
): Promise<LottePlayEntry[]> {
  const playDate =
    date.length === 8
      ? `${date.substring(0, 4)}-${date.substring(4, 6)}-${date.substring(6, 8)}`
      : date;

  const params = {
    MethodName: 'GetPlaySequence',
    channelType: 'HO',
    osType: 'Chrome',
    osVersion:
      'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/139.0.0.0 Safari/537.36',
    playDate,
    cinemaID,
    representationMovieCode: '',
  };

  const res = await fetch(
    'https://www.lottecinema.co.kr/LCWS/Ticketing/TicketingData.aspx',
    {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded; charset=UTF-8',
        'User-Agent':
          'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/139.0.0.0 Safari/537.36',
        Referer: 'https://www.lottecinema.co.kr/NLCHS/ticketing',
        Origin: 'https://www.lottecinema.co.kr',
      },
      body: `paramList=${JSON.stringify(params)}`,
    },
  );

  if (!res.ok) throw new Error(`롯데시네마 API 오류: ${res.status}`);

  const data = await res.json() as any;
  if (data?.IsOK !== 'true') {
    throw new Error(`롯데시네마 API 실패: ${data?.ResultMessage}`);
  }

  return Array.isArray(data?.PlaySeqs?.Items) ? data.PlaySeqs.Items : [];
}

// 극장+날짜 단위로 10분 캐싱
const fetchLottePlaySequence = withCache(
  _fetchLottePlaySequence,
  (cinemaID: string, date: string) => `lotte-playtime-${cinemaID}-${date}`,
  600,
);

function normalizeMovieTitle(title: string): string {
  return title.replace(/\([^)]*\)/g, '').trim();
}

export async function buildLotteBookingUrl(
  theaterName: string,
  movieTitle: string,
  time: string,
  date: string,
): Promise<{ url: string; isFallback: boolean } | null> {
  const config = LOTTE_CINEMAS[theaterName];
  if (!config) return null;

  try {
    const plays = await fetchLottePlaySequence(config.cinemaID, date);

    if (plays.length === 0) {
      return { url: config.fallbackUrl, isFallback: true };
    }

    const normalizedTitle = normalizeMovieTitle(movieTitle);

    const matched = plays.find((p) => {
      if (p.IsBookingYN !== 'Y') return false;
      const lotteTitle = normalizeMovieTitle(p.MovieNameKR);
      const titleMatch =
        lotteTitle === normalizedTitle ||
        lotteTitle.includes(normalizedTitle) ||
        normalizedTitle.includes(lotteTitle);
      return titleMatch && p.StartTime === time;
    });

    if (!matched) {
      console.warn(`롯데시네마 매칭 실패: ${movieTitle} ${time}`);
      return { url: config.fallbackUrl, isFallback: true };
    }

    const bookingUrl =
      `https://www.lottecinema.co.kr/NLCHS/ticketing` +
      `?link_screenId=${matched.ScreenID}` +
      `&link_cinemaCode=${matched.CinemaID}` +
      `&link_movieCd=${matched.RepresentationMovieCode}` +
      `&link_date=${matched.PlayDt}` +
      `&link_time=${matched.StartTime}` +
      `&link_channelCode=naver`;

    return { url: bookingUrl, isFallback: false };
  } catch (error) {
    console.error('롯데시네마 예매 URL 생성 실패:', error);
    return { url: config.fallbackUrl, isFallback: true };
  }
}

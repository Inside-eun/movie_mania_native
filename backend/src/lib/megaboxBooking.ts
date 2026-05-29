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

interface MegaboxCinemaConfig {
  brchNo: string;
  brchNm: string; // API에 전달하는 메가박스 공식 지점명
  fallbackUrl: string;
}

export const MEGABOX_CINEMAS: Record<string, MegaboxCinemaConfig> = {
  '픽처하우스': {
    brchNo: '0081',
    brchNm: '픽쳐하우스',
    fallbackUrl: 'https://www.megabox.co.kr/picturehouse',
  },
};

export function isSupportedMegaboxTheater(theaterName: string): boolean {
  return theaterName in MEGABOX_CINEMAS;
}

export function getMegaboxFallbackUrl(theaterName: string): string | null {
  return MEGABOX_CINEMAS[theaterName]?.fallbackUrl ?? null;
}

interface MegaboxPlayEntry {
  playSchdlNo: string;
  rpstMovieNm: string;
  movieNm: string;
  playStartTime: string;
  playDe: string;
  bokdAbleAt: string;
  [key: string]: unknown;
}

async function _fetchMegaboxSchedule(
  brchNo: string,
  brchNm: string,
  date: string,
): Promise<MegaboxPlayEntry[]> {
  const playDe = date.replace(/-/g, '');

  const params = new URLSearchParams({
    masterType: 'brch',
    brchNo,
    brchNm,
    playDe,
    brchNo1: brchNo,
  });

  const res = await fetch(
    'https://www.megabox.co.kr/on/oh/ohc/Brch/schedulePage.do',
    {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded; charset=UTF-8',
        'User-Agent':
          'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/139.0.0.0 Safari/537.36',
        Referer: 'https://www.megabox.co.kr/picturehouse',
        Origin: 'https://www.megabox.co.kr',
      },
      body: params.toString(),
    },
  );

  if (!res.ok) throw new Error(`메가박스 API 오류: ${res.status}`);

  const data = await res.json() as any;
  return Array.isArray(data?.megaMap?.movieFormList)
    ? data.megaMap.movieFormList
    : [];
}

// 극장+날짜 단위로 10분 캐싱
const fetchMegaboxSchedule = withCache(
  _fetchMegaboxSchedule,
  (brchNo: string, brchNm: string, date: string) =>
    `megabox-schedule-${brchNo}-${date}`,
  600,
);

function normalizeMovieTitle(title: string): string {
  return title.replace(/\([^)]*\)/g, '').trim();
}

export async function buildMegaboxBookingUrl(
  theaterName: string,
  movieTitle: string,
  time: string,
  date: string,
): Promise<{ url: string; isFallback: boolean } | null> {
  const config = MEGABOX_CINEMAS[theaterName];
  if (!config) return null;

  try {
    const plays = await fetchMegaboxSchedule(config.brchNo, config.brchNm, date);

    if (plays.length === 0) {
      return { url: config.fallbackUrl, isFallback: true };
    }

    const normalizedTitle = normalizeMovieTitle(movieTitle);

    const matched = plays.find((p) => {
      if (p.bokdAbleAt !== 'Y') return false;
      const megaTitle = normalizeMovieTitle(p.rpstMovieNm);
      const titleMatch =
        megaTitle === normalizedTitle ||
        megaTitle.includes(normalizedTitle) ||
        normalizedTitle.includes(megaTitle);
      return titleMatch && p.playStartTime === time;
    });

    if (!matched) {
      console.warn(`메가박스 매칭 실패: ${movieTitle} ${time}`);
      return { url: config.fallbackUrl, isFallback: true };
    }

    return {
      url: `https://www.megabox.co.kr/bookingByPlaySchdlNo?playSchdlNo=${matched.playSchdlNo}`,
      isFallback: false,
    };
  } catch (error) {
    console.error('메가박스 예매 URL 생성 실패:', error);
    return { url: config.fallbackUrl, isFallback: true };
  }
}

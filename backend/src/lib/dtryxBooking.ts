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

interface DtryxCinemaConfig {
  cgid: string;
  brandCd: string;
  cinemaCd: string;
  fallbackUrl: string;
}

// dtryx 플랫폼 공통 cgid (sessionStorage에서 사용하는 플랫폼 전역 값)
const DTRYX_PLATFORM_CGID = 'FE8EF4D2-F22D-4802-A39A-D58F23A29C1E';

// dtryx 예매 시스템을 사용하는 극장 설정
export const DTRYX_CINEMAS: Record<string, DtryxCinemaConfig> = {
  '씨네큐브광화문(서울)': {
    cgid: '81630DDE-489C-4034-A6FB-9AD54E055E5B',
    brandCd: 'cinecube',
    cinemaCd: '000003',
    fallbackUrl: 'https://www.dtryx.com/reserve/cinema.do?BrandCd=cinecube&CinemaCd=000003',
  },
  '낭만극장': {
    cgid: DTRYX_PLATFORM_CGID,
    brandCd: 'etc',
    cinemaCd: '000113',
    fallbackUrl: 'https://www.dtryx.com/reserve/cinema.do?BrandCd=etc&CinemaCd=000113',
  },
  '더숲 아트시네마': {
    cgid: DTRYX_PLATFORM_CGID,
    brandCd: 'indieart',
    cinemaCd: '000065',
    fallbackUrl: 'https://www.dtryx.com/reserve/cinema.do?BrandCd=indieart&CinemaCd=000065',
  },
  '라이카시네마': {
    cgid: DTRYX_PLATFORM_CGID,
    brandCd: 'spacedog',
    cinemaCd: '000072',
    fallbackUrl: 'https://www.dtryx.com/reserve/cinema.do?BrandCd=spacedog&CinemaCd=000072',
  },
  '아리랑시네센터(서울)': {
    cgid: DTRYX_PLATFORM_CGID,
    brandCd: 'etc',
    cinemaCd: '000088',
    fallbackUrl: 'https://www.dtryx.com/reserve/cinema.do?BrandCd=etc&CinemaCd=000088',
  },
  '아트나인': {
    cgid: DTRYX_PLATFORM_CGID,
    brandCd: 'etc',
    cinemaCd: '000162',
    fallbackUrl: 'https://www.dtryx.com/reserve/cinema.do?BrandCd=etc&CinemaCd=000162',
  },
  '아트하우스모모': {
    cgid: DTRYX_PLATFORM_CGID,
    brandCd: 'indieart',
    cinemaCd: '000067',
    fallbackUrl: 'https://www.dtryx.com/reserve/cinema.do?BrandCd=indieart&CinemaCd=000067',
  },
  '에무 시네마 앤 카페': {
    cgid: DTRYX_PLATFORM_CGID,
    brandCd: 'indieart',
    cinemaCd: '000069',
    fallbackUrl: 'https://www.dtryx.com/reserve/cinema.do?BrandCd=indieart&CinemaCd=000069',
  },
  '허리우드클래식': {
    cgid: DTRYX_PLATFORM_CGID,
    brandCd: 'etc',
    cinemaCd: '000115',
    fallbackUrl: 'https://www.dtryx.com/reserve/cinema.do?BrandCd=etc&CinemaCd=000115',
  },
};

export function isSupportedDtryxTheater(theaterName: string): boolean {
  return theaterName in DTRYX_CINEMAS;
}

export function getDtryxFallbackUrl(theaterName: string): string | null {
  return DTRYX_CINEMAS[theaterName]?.fallbackUrl ?? null;
}

interface DtryxShowEntry {
  MovieCd: string;
  MovieNm: string;
  MovieNmNat?: string;
  CinemaCd: string;
  ScreenCd: string;
  ScreenNm?: string;
  PlaySDT: string;
  StartTime: string;
  EndTime?: string;
  ShowSeq: string | number;
  [key: string]: unknown;
}

// 실제 dtryx 브라우저 Ajax 엔드포인트: POST /cinema/showseq_list.do
async function _fetchDtryxShowseqList(
  cgid: string,
  brandCd: string,
  cinemaCd: string,
  date: string,
): Promise<DtryxShowEntry[]> {
  // API는 YYYY-MM-DD 형식 사용
  const playSDT = date.length === 8
    ? `${date.substring(0, 4)}-${date.substring(4, 6)}-${date.substring(6, 8)}`
    : date;

  const body = new URLSearchParams({
    cgid,
    ssid: '',
    tokn: '',
    BrandCd: brandCd,
    CinemaCd: cinemaCd,
    PlaySDT: playSDT,
  });

  const res = await fetch('https://www.dtryx.com/cinema/showseq_list.do', {
    method: 'POST',
    headers: {
      'User-Agent':
        'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/139.0.0.0 Safari/537.36',
      'Content-Type': 'application/x-www-form-urlencoded; charset=UTF-8',
      Accept: 'application/json, text/javascript, */*; q=0.01',
      'X-Requested-With': 'XMLHttpRequest',
      Referer: `https://www.dtryx.com/cinema/main.do?BrandCd=${brandCd}&CinemaCd=${cinemaCd}`,
      Origin: 'https://www.dtryx.com',
    },
    body: body.toString(),
  });

  if (!res.ok) throw new Error(`showseq_list API 오류: ${res.status}`);

  const data = await res.json() as any;
  return Array.isArray(data?.Showseqlist) ? data.Showseqlist : [];
}

// 극장+날짜 단위로 10분 캐싱
const fetchDtryxShowseqList = withCache(
  _fetchDtryxShowseqList,
  (cgid: string, brandCd: string, cinemaCd: string, date: string) =>
    `dtryx-showseq-${brandCd}-${cinemaCd}-${date}`,
  600,
);

export async function buildDtryxBookingUrl(
  theaterName: string,
  movieTitle: string,
  time: string,
  date: string,
): Promise<{ url: string; isFallback: boolean } | null> {
  const config = DTRYX_CINEMAS[theaterName];
  if (!config) return null;

  try {
    const shows = await fetchDtryxShowseqList(config.cgid, config.brandCd, config.cinemaCd, date);

    if (shows.length === 0) {
      return { url: config.fallbackUrl, isFallback: true };
    }

    const targetTime = time.substring(0, 5); // "HH:MM"

    const matched = shows.find((s: DtryxShowEntry) => {
      const nm = (s.MovieNm ?? s.MovieNmNat ?? '').trim();
      const titleMatch =
        nm === movieTitle || nm.includes(movieTitle) || movieTitle.includes(nm);
      return titleMatch && s.StartTime === targetTime;
    });

    if (!matched) {
      console.warn(`dtryx 매칭 실패: ${movieTitle} ${time}`);
      return { url: config.fallbackUrl, isFallback: true };
    }

    // 브라우저 data-prm과 동일한 URL 구조
    const playSDT = date.length === 8
      ? `${date.substring(0, 4)}-${date.substring(4, 6)}-${date.substring(6, 8)}`
      : date;

    const bookingUrl =
      `https://www.dtryx.com/reserve/movie.do` +
      `?CinemaCd=${matched.CinemaCd}` +
      `&MovieCd=${matched.MovieCd}` +
      `&PlaySDT=${playSDT}` +
      `&ScreenCd=${matched.ScreenCd}` +
      `&ShowSeq=${matched.ShowSeq}`;

    return { url: bookingUrl, isFallback: false };
  } catch (error) {
    console.error('dtryx 예매 URL 생성 실패:', error);
    return { url: config.fallbackUrl, isFallback: true };
  }
}

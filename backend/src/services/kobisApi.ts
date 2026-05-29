import axios from "axios";

interface KOBISMovieInfo {
  movieCd: string;
  movieNm: string;
  movieNmEn: string;
  movieNmOg: string;
  prdtYear: string;
  openDt: string;
  showTm: string;
  genres: Array<{
    genreNm: string;
  }>;
  directors: Array<{
    peopleNm: string;
  }>;
  actors: Array<{
    peopleNm: string;
    cast: string;
  }>;
  audits: Array<{
    auditNo: string;
    watchGradeNm: string;
  }>;
}

interface KOBISResponse {
  movieInfoResult: {
    movieInfo: KOBISMovieInfo;
  };
}

// 메모리 캐시 (간단한 캐시 구현)
const movieInfoCache = new Map<string, { data: Partial<KOBISMovieInfo> | null; timestamp: number }>();
const CACHE_TTL = 30 * 60 * 1000; // 30분

export async function getMovieInfoFromKOBIS(movieCode: string): Promise<Partial<KOBISMovieInfo> | null> {
  // 캐시 확인
  const cached = movieInfoCache.get(movieCode);
  if (cached && Date.now() - cached.timestamp < CACHE_TTL) {
    console.log(`KOBIS API 캐시 히트: ${movieCode}`);
    return cached.data;
  }

  try {
    const apiKey = process.env.KOBIS_API_KEY;
    if (!apiKey) {
      throw new Error("KOBIS_API_KEY 환경 변수가 설정되지 않았습니다.");
    }
    const url = `http://www.kobis.or.kr/kobisopenapi/webservice/rest/movie/searchMovieInfo.json`;

    const response = await axios.get(url, {
      params: {
        key: apiKey,
        movieCd: movieCode,
      },
      timeout: 5000,
      headers: {
        'Accept': 'application/json',
        'Accept-Encoding': 'gzip, deflate',
        'Connection': 'keep-alive',
      },
    });

    // 가공 전 원본 응답 확인용 (서버 터미널에서 확인)
    console.log("[KOBIS 원본 응답]", JSON.stringify(response.data, null, 2));

    const body = response.data;
    // KOBIS 에러 응답: message 또는 faultInfo 존재 시
    if (body?.faultInfo) {
      console.warn("KOBIS API faultInfo:", body.faultInfo);
      movieInfoCache.set(movieCode, { data: null, timestamp: Date.now() });
      return null;
    }
    if (body?.message) {
      console.warn("KOBIS API message:", body.message);
      movieInfoCache.set(movieCode, { data: null, timestamp: Date.now() });
      return null;
    }

    let result: Partial<KOBISMovieInfo> | null = null;
    const movieInfo = body?.movieInfoResult?.movieInfo;
    if (movieInfo) {
      result = movieInfo;
    } else {
      // 데이터 없을 때 원인 확인용 로그 (영화코드 미등록 등)
      console.warn(
        "KOBIS API movieInfo 없음: movieCd=%s, 응답키=%s",
        movieCode,
        Object.keys(body?.movieInfoResult ?? body ?? {}).join(", ")
      );
    }

    movieInfoCache.set(movieCode, { data: result, timestamp: Date.now() });
    return result;
  } catch (error) {
    console.error("KOBIS API 호출 실패:", error);
    if (axios.isAxiosError(error) && error.response?.data) {
      console.error("KOBIS API 응답 본문:", JSON.stringify(error.response.data, null, 2));
    }
    // 실패한 경우에도 캐시에 null 저장 (짧은 시간 동안 재시도 방지)
    movieInfoCache.set(movieCode, { data: null, timestamp: Date.now() });
    return null;
  }
}

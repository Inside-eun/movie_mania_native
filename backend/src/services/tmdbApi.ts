import axios from "axios";

export interface TMDBMovieResult {
  id: number;
  title: string;
  original_title: string;
  overview: string;
  poster_path: string | null;
  release_date: string | null;
  vote_average: number;
}

interface TMDBSearchResponse {
  page: number;
  results: TMDBMovieResult[];
  total_results: number;
  total_pages: number;
}

const TMDB_BASE_URL = "https://api.themoviedb.org/3";
const TMDB_IMAGE_BASE_URL = "https://image.tmdb.org/t/p";

export function getTMDBImageUrl(
  path: string | null | undefined,
  size: "w185" | "w342" | "w500" | "original" = "w342",
): string | null {
  if (!path) return null;
  return `${TMDB_IMAGE_BASE_URL}/${size}${path}`;
}

export async function searchMovieByTitle(
  title: string,
): Promise<TMDBMovieResult | null> {
  const apiKey = process.env.TMDB_API_KEY;
  if (!apiKey) {
    console.warn("TMDB_API_KEY 환경 변수가 설정되지 않았습니다.");
    return null;
  }

  try {
    const response = await axios.get<TMDBSearchResponse>(
      `${TMDB_BASE_URL}/search/movie`,
      {
        params: {
          api_key: apiKey,
          query: title,
          language: "ko-KR",
          include_adult: false,
        },
        timeout: 8000,
        headers: {
          Accept: "application/json",
        },
      },
    );

    const results = response.data?.results ?? [];
    if (!results.length) {
      return null;
    }

    // 일단 첫 번째 결과를 사용
    return results[0];
  } catch (error) {
    console.error("TMDB 검색 실패:", error);
    return null;
  }
}

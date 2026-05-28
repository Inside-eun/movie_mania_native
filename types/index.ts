export interface MovieSchedule {
  title: string;
  theater: string;
  area: string;
  screen: string;
  time: string;
  showtime: string | Date;
  source?: string;
  movieCode?: string;
  director?: string;
  posterUrl?: string;
  prodYear?: string;
  runtime?: string;
  cActors?: string;
  cCodeSubName2?: string;
  latitude?: number;
  longitude?: number;
  tmdbPosterUrl?: string;
  tmdbReleaseDate?: string;
  tmdbOverview?: string;
}

export interface ScheduleResponse {
  success: boolean;
  count: number;
  data: MovieSchedule[];
  timestamp: string;
  error?: string;
}

export interface KOBISMovieInfo {
  movieCd?: string;
  movieNm?: string;
  movieNmEn?: string;
  prdtYear?: string;
  openDt?: string;
  showTm?: string;
  genres?: Array<{ genreNm: string }>;
  directors?: Array<{ peopleNm: string }>;
  actors?: Array<{ peopleNm: string; cast?: string }>;
  audits?: Array<{ auditNo: string; watchGradeNm: string }>;
}

export interface WishlistMovie extends MovieSchedule {
  notificationId?: string;
}

// CGV 예매 URL 생성
// movNo는 영화별 전국 공통 고정값 → Firestore(cgv-mov-no 컬렉션)에서 조회.
// 캐시 미스 시 날짜+극장+상영관 필터된 예매 페이지로 fallback.
//
// URL 구조:
// https://cgv.co.kr/cnm/movieBook/movie?movNo={movNo}&scnYmd={date}&siteNo={siteNo}&siteNm={siteNm}&scnsNo={scnsNo}
//
// 새 영화 추가 방법:
// DevTools Network 탭 → searchMovScnInfo 응답 → movNo 값 확인
// → Firebase Console > Firestore > cgv-mov-no 컬렉션 > 문서 추가 (재배포 불필요)

import { db } from './firestoreClient';

interface CGVCinemaConfig {
  siteNo: string;
  siteNm: string; // URL-encoded 극장 위치 단축명 (CGV 제외)
  scnsNo: string; // 예술관 상영관 번호
  fallbackUrl: string;
}

export const CGV_CINEMAS: Record<string, CGVCinemaConfig> = {
  'CGV 용산아이파크몰': {
    siteNo: '0013',
    siteNm: '%EC%9A%A9%EC%82%B0%EC%95%84%EC%9D%B4%ED%8C%8C%ED%81%AC%EB%AA%B0',
    scnsNo: '017',
    fallbackUrl: 'https://cgv.co.kr/cnm/movieBook/movie?siteNo=0013&siteNm=%EC%9A%A9%EC%82%B0%EC%95%84%EC%9D%B4%ED%8C%8C%ED%81%AC%EB%AA%B0&scnsNo=017',
  },
  'CGV 압구정': {
    siteNo: '0040',
    siteNm: '%EC%95%95%EA%B5%AC%EC%A0%95',
    scnsNo: '005',
    fallbackUrl: 'https://cgv.co.kr/cnm/movieBook/movie?siteNo=0040&siteNm=%EC%95%95%EA%B5%AC%EC%A0%95&scnsNo=005',
  },
  'CGV 신촌아트레온': {
    siteNo: '0150',
    siteNm: '%EC%8B%A0%EC%B4%8C%EC%95%84%ED%8A%B8%EB%A0%88%EC%98%A8',
    scnsNo: '016',
    fallbackUrl: 'https://cgv.co.kr/cnm/movieBook/movie?siteNo=0150&siteNm=%EC%8B%A0%EC%B4%8C%EC%95%84%ED%8A%B8%EB%A0%88%EC%98%A8&scnsNo=016',
  },
  'CGV 대학로': {
    siteNo: '0063',
    siteNm: '%EB%8C%80%ED%95%99%EB%A1%9C',
    scnsNo: '005',
    fallbackUrl: 'https://cgv.co.kr/cnm/movieBook/movie?siteNo=0063&siteNm=%EB%8C%80%ED%95%99%EB%A1%9C&scnsNo=005',
  },
  'CGV 강변': {
    siteNo: '0001',
    siteNm: '%EA%B0%95%EB%B3%80',
    scnsNo: '005',
    fallbackUrl: 'https://cgv.co.kr/cnm/movieBook/movie?siteNo=0001&siteNm=%EA%B0%95%EB%B3%80&scnsNo=005',
  },
};

export function isSupportedCGVTheater(theaterName: string): boolean {
  return theaterName in CGV_CINEMAS;
}

export function getCGVFallbackUrl(theaterName: string): string | null {
  return CGV_CINEMAS[theaterName]?.fallbackUrl ?? null;
}

async function lookupMovNo(movieTitle: string): Promise<string | null> {
  const titleNorm = movieTitle.replace(/\s+/g, '');
  const snapshot = await db.collection('cgv-mov-no').get();
  for (const doc of snapshot.docs) {
    if (doc.id.replace(/\s+/g, '') === titleNorm) {
      return doc.data().movNo as string;
    }
  }
  return null;
}

export async function buildCGVBookingUrl(
  theaterName: string,
  movieTitle: string,
  _time: string,
  date: string,
): Promise<{ url: string; isFallback: boolean } | null> {
  const config = CGV_CINEMAS[theaterName];
  if (!config) return null;

  const scnYmd = date.replace(/-/g, '');
  const movNo = await lookupMovNo(movieTitle);

  if (movNo) {
    const url = `https://cgv.co.kr/cnm/movieBook/movie?movNo=${movNo}&scnYmd=${scnYmd}&siteNo=${config.siteNo}&siteNm=${config.siteNm}&scnsNo=${config.scnsNo}`;
    return { url, isFallback: false };
  }

  // Firestore 미스: 날짜+극장+상영관 필터된 예매 페이지
  const url = `https://cgv.co.kr/cnm/movieBook/movie?scnYmd=${scnYmd}&siteNo=${config.siteNo}&siteNm=${config.siteNm}&scnsNo=${config.scnsNo}`;
  return { url, isFallback: false };
}

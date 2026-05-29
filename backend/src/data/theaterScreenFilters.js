/**
 * 극장별 아트하우스 상영관 필터 설정
 * - key: 극장명
 * - value: 허용할 상영관 키워드 (해당 키워드가 포함된 상영관만 통과)
 */
export const THEATER_SCREEN_FILTERS = {
  "CGV 용산아이파크몰": "19관",
  "CGV 대학로": "5관",
  "CGV 강변": "4관",
  "CGV 신촌아트레온": "10관",
  "CGV 여의도": "5관",
  "롯데시네마 노원": "6관",
  "롯데시네마 신도림": "4관",
};

/**
 * 상영관이 필터를 통과하는지 확인
 * @param {string} theaterName - 극장명
 * @param {string} screenName - 상영관명
 * @returns {{ pass: boolean, reason?: string }}
 */
export function checkScreenFilter(theaterName, screenName) {
  const allowedScreen = THEATER_SCREEN_FILTERS[theaterName];

  // 필터 설정이 없는 극장은 모든 상영관 허용
  if (!allowedScreen) {
    return { pass: true };
  }

  // 설정된 상영관 키워드가 포함되어 있는지 확인
  if (screenName.includes(allowedScreen)) {
    return { pass: true };
  }

  return {
    pass: false,
    reason: `${theaterName} 상영관 필터: ${screenName} (허용: ${allowedScreen})`,
  };
}

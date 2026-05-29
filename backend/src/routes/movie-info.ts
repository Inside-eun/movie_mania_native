import { Router, Request, Response } from 'express';
import { getMovieInfoFromKOBIS } from '../services/kobisApi';

/** KMDB API로 영화 정보 조회. 실패 시 null */
async function fetchFromKMDB(
  movieCode: string,
): Promise<{ cActors?: string; cCodeSubName2?: string } | null> {
  const apiKey = process.env.KMDB_API_KEY;
  if (!apiKey) return null;

  const url = 'https://www.kmdb.or.kr/info/api/3/api.json';
  const apiUrls = [
    `${url}?serviceKey=${apiKey}&movieId=${movieCode}`,
    `${url}?serviceKey=${apiKey}&movieSeq=${movieCode}`,
    `${url}?serviceKey=${apiKey}&movieId=${movieCode}&detail=Y`,
    `${url}?serviceKey=${apiKey}&movieSeq=${movieCode}&detail=Y`,
  ];

  for (let i = 0; i < apiUrls.length; i++) {
    try {
      const response = await fetch(apiUrls[i], {
        method: 'GET',
        headers: {
          Accept: 'application/json',
          'User-Agent': 'Mozilla/5.0 (compatible; MovieApp/1.0)',
        },
      });
      if (!response.ok) continue;
      const data = await response.json();
      const dataAny = data as any;
      if (dataAny.resultMsg === 'INFO-000' && dataAny.resultList?.length > 0) {
        const m = dataAny.resultList[0];
        return { cActors: m.cActors, cCodeSubName2: m.cCodeSubName2 };
      }
    } catch {
      // 다음 시도
    }
  }
  return null;
}

const router = Router();

router.get('/', async (req: Request, res: Response) => {
  try {
    const movieCode = req.query.movieCode as string | undefined;
    const source = req.query.source as string | undefined;

    if (!movieCode) {
      return res.status(400).json({ success: false, error: 'movieCode가 필요합니다.' });
    }

    let result: unknown = null;
    let dataSource: 'KOBIS' | 'KMDB_API' | null = null;

    if (source === 'KMDB_API') {
      const apiKey = process.env.KMDB_API_KEY;
      if (!apiKey) {
        return res
          .status(500)
          .json({ success: false, error: 'KMDB_API_KEY가 설정되지 않았습니다.' });
      }
      result = await fetchFromKMDB(movieCode);
      dataSource = result ? 'KMDB_API' : null;
    } else {
      result = await getMovieInfoFromKOBIS(movieCode);
      dataSource = result ? 'KOBIS' : null;
      // KOBIS에 없으면 KMDB 폴백
      if (result == null && process.env.KMDB_API_KEY) {
        result = await fetchFromKMDB(movieCode);
        dataSource = result ? 'KMDB_API' : null;
      }
    }

    const body: { success: true; data: unknown; dataSource?: string } = {
      success: true,
      data: result,
    };
    if (dataSource) body.dataSource = dataSource;

    return res.json(body);
  } catch (error) {
    console.error('영화 정보 API 에러:', error);
    return res.status(500).json({
      success: false,
      error: '영화 정보를 가져오는 중 오류가 발생했습니다.',
      details: error instanceof Error ? error.message : '알 수 없는 오류',
    });
  }
});

export default router;

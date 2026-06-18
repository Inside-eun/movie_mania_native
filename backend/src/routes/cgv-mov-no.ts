import { Router, Request, Response } from 'express';
import { db } from '../lib/firestoreClient';

const router = Router();
const COLLECTOR_SECRET = process.env.CGV_COLLECTOR_SECRET ?? 'cgv-collector-secret';

router.post('/', async (req: Request, res: Response) => {
  if (req.headers['x-collector-secret'] !== COLLECTOR_SECRET) {
    return res.status(401).json({ error: 'unauthorized' });
  }

  const movies: Record<string, string> = req.body.movies ?? {};
  if (!movies || typeof movies !== 'object') {
    return res.status(400).json({ error: 'movies 필드가 필요합니다.' });
  }

  const collection = db.collection('cgv-mov-no');
  let saved = 0;
  let skipped = 0;

  const batch = db.batch();
  for (const [movNm, movNo] of Object.entries(movies)) {
    const doc = await collection.doc(movNm).get();
    if (doc.exists) {
      skipped++;
    } else {
      batch.set(collection.doc(movNm), { movNo });
      saved++;
    }
  }

  if (saved > 0) await batch.commit();

  console.log(`[CGV 수집기] 저장 ${saved}건, 중복 스킵 ${skipped}건`);
  return res.json({ saved, skipped });
});

export default router;

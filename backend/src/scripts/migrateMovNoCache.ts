// cgvMovNoCache.json → Firestore 일회성 마이그레이션 스크립트
// 실행: npx tsx src/scripts/migrateMovNoCache.ts

import 'dotenv/config';
import { db } from '../lib/firestoreClient';
import movNoCache from '../lib/cgvMovNoCache.json';

async function migrate() {
  const collection = db.collection('cgv-mov-no');
  const entries = Object.entries(movNoCache);

  console.log(`총 ${entries.length}개 항목 마이그레이션 시작...`);

  const batch = db.batch();
  for (const [title, movNo] of entries) {
    const ref = collection.doc(title);
    batch.set(ref, { movNo });
  }
  await batch.commit();

  console.log('완료. Firebase Console에서 cgv-mov-no 컬렉션 확인하세요.');
}

migrate().catch((err) => {
  console.error('마이그레이션 실패:', err);
  process.exit(1);
});

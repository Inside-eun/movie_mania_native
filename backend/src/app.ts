import 'dotenv/config';
import express from 'express';
import cors from 'cors';

import schedulesRouter from './routes/schedules';
import movieInfoRouter from './routes/movie-info';
import bookingUrlRouter from './routes/booking-url';

const app = express();

app.use(cors());
app.use(express.json());

app.use('/api/schedules', schedulesRouter);
app.use('/api/movie-info', movieInfoRouter);
app.use('/api/booking-url', bookingUrlRouter);

app.get('/health', (_req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

const PORT = process.env.PORT ? Number(process.env.PORT) : 4000;
app.listen(PORT, () => {
  console.log(`서버 실행 중: http://localhost:${PORT}`);
});

export default app;

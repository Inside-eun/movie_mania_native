import { Router, Request, Response } from 'express';
import {
  buildDtryxBookingUrl,
  getDtryxFallbackUrl,
  isSupportedDtryxTheater,
} from '../lib/dtryxBooking';
import {
  buildMovieeBookingUrl,
  getMovieeFallbackUrl,
  isSupportedMovieeTheater,
} from '../lib/movieeBooking';
import {
  buildCineQBookingUrl,
  getCineQFallbackUrl,
  isSupportedCineQTheater,
} from '../lib/cineqBooking';
import {
  buildCGVBookingUrl,
  getCGVFallbackUrl,
  isSupportedCGVTheater,
} from '../lib/cgvBooking';
import {
  buildLotteBookingUrl,
  getLotteFallbackUrl,
  isSupportedLotteTheater,
} from '../lib/lotteCinemaBooking';
import {
  buildMegaboxBookingUrl,
  getMegaboxFallbackUrl,
  isSupportedMegaboxTheater,
} from '../lib/megaboxBooking';

const router = Router();

router.get('/', async (req: Request, res: Response) => {
  const theater = (req.query.theater as string) ?? '';
  const title = (req.query.title as string) ?? '';
  const time = (req.query.time as string) ?? '';
  const date = (req.query.date as string) ?? '';

  if (!theater || !date) {
    return res.json({ success: false, url: null });
  }

  if (isSupportedDtryxTheater(theater)) {
    const result = await buildDtryxBookingUrl(theater, title, time, date);
    if (!result) {
      const fallback = getDtryxFallbackUrl(theater);
      return res.json({ success: false, url: fallback, isFallback: true });
    }
    return res.json({ success: true, url: result.url, isFallback: result.isFallback });
  }

  if (isSupportedMovieeTheater(theater)) {
    const result = await buildMovieeBookingUrl(theater, title, time, date);
    if (!result) {
      const fallback = getMovieeFallbackUrl(theater);
      return res.json({ success: false, url: fallback, isFallback: true });
    }
    return res.json({ success: true, url: result.url, isFallback: result.isFallback });
  }

  if (isSupportedCGVTheater(theater)) {
    const result = await buildCGVBookingUrl(theater, title, time, date);
    if (!result) {
      return res.json({ success: false, url: getCGVFallbackUrl(theater), isFallback: true });
    }
    return res.json({ success: true, url: result.url, isFallback: result.isFallback });
  }

  if (isSupportedCineQTheater(theater)) {
    const result = await buildCineQBookingUrl(theater, title, time, date);
    if (!result) {
      return res.json({ success: false, url: getCineQFallbackUrl(), isFallback: true });
    }
    return res.json({ success: true, url: result.url, isFallback: result.isFallback });
  }

  if (isSupportedLotteTheater(theater)) {
    const result = await buildLotteBookingUrl(theater, title, time, date);
    if (!result) {
      return res.json({ success: false, url: getLotteFallbackUrl(theater), isFallback: true });
    }
    return res.json({ success: true, url: result.url, isFallback: result.isFallback });
  }

  if (isSupportedMegaboxTheater(theater)) {
    const result = await buildMegaboxBookingUrl(theater, title, time, date);
    if (!result) {
      return res.json({ success: false, url: getMegaboxFallbackUrl(theater), isFallback: true });
    }
    return res.json({ success: true, url: result.url, isFallback: result.isFallback });
  }

  return res.json({ success: false, url: null, reason: 'unsupported' });
});

export default router;

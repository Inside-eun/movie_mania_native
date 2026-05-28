import axios from 'axios';
import { API_BASE_URL } from '@/constants/api';
import type { ScheduleResponse } from '@/types';

const client = axios.create({
  baseURL: API_BASE_URL,
  timeout: 15000,
});

export const api = {
  getSchedules: (date: string) =>
    client.get<ScheduleResponse>(`/api/schedules?type=integrated&date=${date}`),

  getMovieInfo: (movieCode: string, source = 'KOBIS') =>
    client.get(`/api/movie-info?movieCode=${movieCode}&source=${source}`),

  getBookingUrl: (theater: string, title: string, time: string, date: string) =>
    client.get(
      `/api/booking-url?theater=${encodeURIComponent(theater)}&title=${encodeURIComponent(title)}&time=${encodeURIComponent(time)}&date=${date}`
    ),
};

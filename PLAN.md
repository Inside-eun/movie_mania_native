# 영화방랑자 React Native 재작성 계획

> 기존 Next.js 웹앱(`movie/`)을 Expo + React Native로 완전히 재작성.
> 백엔드는 Express.js로 별도 구성. 포트폴리오 + App Store 출시 목적.
>
> **기존 프로젝트**: `/Users/devtwin/Documents/GIT/PROJECT/movie/`
> **기존 Vercel URL**: `https://moviemania-olive.vercel.app`
> **이 프로젝트**: `/Users/devtwin/Documents/GIT/PROJECT/movie-native/`

---

## 기술 스택

| 역할 | 라이브러리 | 선택 이유 |
|------|-----------|----------|
| 프레임워크 | **Expo SDK 52** | App Store 배포(EAS Build) 쉬움, 실무 표준 |
| 라우팅 | **Expo Router v4** | Next.js App Router와 유사한 파일 기반 라우팅 |
| 스타일 | **NativeWind v4** | 기존 Tailwind 클래스 거의 그대로 사용 가능 |
| 서버 상태 | **TanStack Query v5** | 캐싱, 로딩 상태, 리페치 자동 처리 |
| 클라이언트 상태 | **Zustand + MMKV** | 위시리스트 영속화 (AsyncStorage보다 빠름) |
| 알림 | **expo-notifications** | 로컬 알림 (상영 1시간 전) |
| 햅틱 | **expo-haptics** | 버튼 피드백 |
| 이미지 | **expo-image** | 캐싱 내장, 빠른 렌더링 |
| HTTP | **axios** | 기존 코드와 동일 |
| 백엔드 | **Express.js + TypeScript** | 기존 스크래핑 로직 이식, Vercel/Railway 배포 |

### Node.js 버전 주의
- Expo CLI는 Node 18+ 필요
- 기존 머신에 `nvm use 20` 권장

---

## 폴더 구조

```
movie-native/
├── app/                          # Expo Router 화면
│   ├── _layout.tsx               # 루트 레이아웃 (폰트, 테마, QueryClient)
│   ├── +not-found.tsx
│   └── (tabs)/
│       ├── _layout.tsx           # 탭 바 레이아웃
│       ├── index.tsx             # 홈 (영화 목록)
│       ├── wishlist.tsx          # 찜 목록
│       └── settings.tsx          # 설정
├── components/
│   ├── DateSelector.tsx          # 날짜 수평 스크롤
│   ├── MovieCard.tsx             # 영화 카드
│   ├── MovieFilter.tsx           # 극장/지역 필터
│   ├── MovieModal.tsx            # 영화 상세 Bottom Sheet
│   ├── SkeletonCard.tsx          # 로딩 스켈레톤
│   ├── WishlistCard.tsx          # 찜 목록 카드
│   └── Header.tsx                # 앱 헤더
├── hooks/
│   ├── useMovieSchedules.ts      # 영화 목록 + 필터링 로직
│   └── useWishlist.ts            # 찜 추가/제거/조회
├── store/
│   └── wishlistStore.ts          # Zustand + MMKV 스토어
├── lib/
│   ├── api.ts                    # axios 인스턴스 + API 함수
│   └── notifications.ts          # 알림 예약/취소 유틸
├── types/
│   └── index.ts                  # MovieSchedule, ScheduleResponse 등
├── constants/
│   ├── colors.ts                 # 색상 팔레트 (기존: black, orange-500)
│   └── api.ts                    # API BASE_URL 환경변수 참조
├── assets/
│   ├── fonts/
│   └── images/
├── backend/                      # Express.js 백엔드 (별도 배포)
│   ├── src/
│   │   ├── app.ts
│   │   ├── routes/
│   │   │   ├── schedules.ts
│   │   │   ├── movie-info.ts
│   │   │   └── booking-url.ts
│   │   └── services/
│   │       ├── cgvService.ts
│   │       ├── lotteService.ts
│   │       ├── megaboxService.ts
│   │       ├── kobisApi.ts
│   │       ├── tmdbApi.ts
│   │       └── cacheService.ts
│   ├── package.json
│   ├── tsconfig.json
│   └── .env.example
├── package.json
├── app.json                      # Expo 앱 설정
├── tailwind.config.js
├── babel.config.js
└── .env.example
```

---

## 화면 명세

### 1. 홈 화면 (`app/(tabs)/index.tsx`)

**레이아웃:**
```
┌─────────────────────────────────┐
│ 🎬 영화방랑자                    │  ← Header (sticky)
│   서울 예술영화관 상영시간표       │
├─────────────────────────────────┤
│ [오늘] [내일] [목] [금] [토] ... │  ← DateSelector (FlatList horizontal)
├─────────────────────────────────┤
│ [전체] [씨네Q] [아트하우스] ...   │  ← MovieFilter (ScrollView horizontal)
├─────────────────────────────────┤
│ ┌──────────┐  ┌──────────┐      │
│ │ [포스터] │  │ [포스터] │      │  ← MovieCard Grid (FlatList 2열)
│ │  영화제목 │  │  영화제목 │      │
│ │  극장    │  │  극장    │      │
│ │  14:30 ♥ │  │  16:00 ♥ │      │
│ └──────────┘  └──────────┘      │
└─────────────────────────────────┘
```

**기능:**
- 날짜 선택 (오늘부터 14일)
- 극장/지역 필터
- 찜 토글 (하트 아이콘) + 햅틱 피드백
- 카드 탭 → MovieModal 열림
- 하단 FlatList: `numColumns={2}`, `onEndReached` 페이지네이션

### 2. 영화 상세 모달 (Bottom Sheet)

`@gorhom/bottom-sheet` 사용 권장 (또는 Expo Router의 모달 라우트)

**내용:**
- 포스터 이미지 (블러 배경 효과)
- 제목, 감독, 제작년도, 러닝타임, 장르, 관람등급
- 상영시간 + 종료시간
- 극장 이름
- 예매 버튼 (WebBrowser.openBrowserAsync)
- 공유 버튼 (expo-sharing)

### 3. 찜 목록 (`app/(tabs)/wishlist.tsx`)

**레이아웃:**
- 상단 탭: [달력 뷰] [리스트 뷰]
- 달력 뷰: `react-native-calendars` 또는 커스텀 캘린더
- 리스트 뷰: 날짜별 그룹핑, 각 카드에 알림 벨 버튼

**알림 벨 버튼 동작:**
- 탭 → 권한 요청 → 상영 1시간 전 로컬 알림 예약
- 이미 예약된 경우 → 알림 취소
- 과거 상영 → 버튼 숨김

### 4. 설정 (`app/(tabs)/settings.tsx`)

- 알림 권한 상태 표시 + 설정 앱 열기
- 과거 상영 표시 여부 토글
- 앱 버전 정보
- 개인정보처리방침 (WebBrowser)
- 리뷰 남기기 (expo-store-review)

---

## 컴포넌트 명세

### `DateSelector.tsx`
```typescript
interface Props {
  selectedDate: string;           // 'YYYY-MM-DD'
  onSelectDate: (date: string) => void;
}
```
- `FlatList` horizontal, `getItemLayout`으로 성능 최적화
- 오늘 날짜 자동 스크롤 (초기 렌더)
- 요일 + 날짜 표시, 선택된 날짜 orange-500 강조

### `MovieCard.tsx`
```typescript
interface Props {
  movie: MovieSchedule;
  isWishlisted: boolean;
  onPress: () => void;
  onToggleWishlist: () => void;
}
```
- `expo-image`로 포스터 렌더 (캐싱)
- 하트 버튼: `expo-haptics` impactLight
- 카드 비율 2:3 (포스터), 텍스트는 하단에 오버레이

### `MovieFilter.tsx`
```typescript
interface Props {
  theaters: string[];
  selectedTheaters: string[];
  onToggleTheater: (theater: string) => void;
}
```
- `ScrollView` horizontal, 필터 칩 형태
- 전체 선택 시 모든 극장 표시

### `MovieModal.tsx`
Bottom Sheet 또는 Modal 컴포넌트
```typescript
interface Props {
  movie: MovieSchedule | null;
  isVisible: boolean;
  onClose: () => void;
  selectedDate: string;
}
```

### `SkeletonCard.tsx`
- `react-native-reanimated`의 `withRepeat`로 shimmer 애니메이션
- MovieCard와 동일한 레이아웃/크기

---

## 타입 정의 (`types/index.ts`)

기존 `movie/src/types/index.ts`에서 가져옴:

```typescript
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
```

---

## API 레이어 (`lib/api.ts`)

```typescript
import axios from 'axios';
import { API_BASE_URL } from '@/constants/api';

const client = axios.create({ baseURL: API_BASE_URL, timeout: 15000 });

export const api = {
  getSchedules: (date: string) =>
    client.get<ScheduleResponse>(`/api/schedules?date=${date}`),

  getMovieInfo: (movieCode: string, source = 'KOBIS') =>
    client.get(`/api/movie-info?movieCode=${movieCode}&source=${source}`),

  getBookingUrl: (theater: string, title: string, time: string, date: string) =>
    client.get(`/api/booking-url?theater=${theater}&title=${title}&time=${time}&date=${date}`),
};
```

**환경변수 (`.env`):**
```
EXPO_PUBLIC_API_URL=https://moviemania-olive.vercel.app
```
→ 백엔드 완성 후 새 서버 URL로 교체

---

## 상태 관리 (`store/wishlistStore.ts`)

```typescript
import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import { storage } from '@/lib/storage';  // MMKV 인스턴스

interface WishlistStore {
  movies: MovieSchedule[];
  add: (movie: MovieSchedule) => void;
  remove: (key: string) => void;
  has: (key: string) => boolean;
  clear: () => void;
  getMovieKey: (movie: MovieSchedule) => string;
}
```

MMKV 설정:
```typescript
// lib/storage.ts
import { MMKV } from 'react-native-mmkv';
export const storage = new MMKV();
```

---

## 알림 유틸 (`lib/notifications.ts`)

기존 `movie/src/lib/native.ts`의 로직을 Expo 방식으로 재작성:

```typescript
import * as Notifications from 'expo-notifications';

export async function requestPermission(): Promise<boolean> { ... }

export async function scheduleMovieNotification(
  id: string, title: string, theater: string, notifyAt: Date
): Promise<void> { ... }

export async function cancelNotification(id: string): Promise<void> { ... }

export function getNotificationId(title: string, theater: string, time: string): string {
  // 고유 ID 생성 (해시)
}
```

---

## 백엔드 명세 (`backend/`)

기존 `movie/src/app/api/`와 `movie/src/services/`의 로직을 Express로 이식.

### 엔드포인트

| Method | Path | 설명 | 기존 파일 |
|--------|------|------|-----------|
| GET | `/api/schedules` | 날짜별 상영 일정 | `app/api/schedules/route.ts` |
| GET | `/api/movie-info` | KOBIS/KMDB 영화 정보 | `app/api/movie-info/` |
| GET | `/api/booking-url` | 예매 링크 조회 | `app/api/booking-url/` |

### 환경변수 (`.env.example`)
```
PORT=4000
MONGODB_URI=...
UPSTASH_REDIS_REST_URL=...
UPSTASH_REDIS_REST_TOKEN=...
KOBIS_API_KEY=...
TMDB_API_KEY=...
```

### 배포 옵션
1. **Railway** (추천) - Docker 없이 Node.js 앱 바로 배포, 무료 플랜 있음
2. **Render** - 무료 플랜, cold start 있음
3. **Vercel** - Serverless Functions로 기존 방식 유지

---

## 색상 팔레트 (`constants/colors.ts`)

기존 웹앱의 다크 테마를 그대로 유지:

```typescript
export const Colors = {
  background: '#000000',
  surface: '#111111',
  border: '#1f2937',       // gray-800
  primary: '#f97316',      // orange-500
  primaryDark: '#ea580c',  // orange-600
  text: {
    primary: '#ffffff',
    secondary: '#9ca3af',  // gray-400
    muted: '#6b7280',      // gray-500
  },
};
```

---

## 작업 순서 (체크리스트)

### Phase 1: 프로젝트 초기화

- [ ] `npx create-expo-app@latest movie-native --template tabs` 실행
- [ ] 의존성 설치:
  ```bash
  npx expo install nativewind tailwindcss react-native-reanimated react-native-safe-area-context
  npx expo install expo-image expo-haptics expo-notifications expo-sharing
  npx expo install @gorhom/bottom-sheet react-native-gesture-handler
  npm install zustand axios @tanstack/react-query react-native-mmkv
  npm install react-native-calendars
  ```
- [ ] NativeWind 설정 (`tailwind.config.js`, `babel.config.js`, `app/_layout.tsx`)
- [ ] `app.json` 설정 (앱 이름, Bundle ID: `com.moviemania.app`, 아이콘, 스플래시)
- [ ] `.env` 파일 생성 (`EXPO_PUBLIC_API_URL`)
- [ ] TypeScript 경로 별칭 설정 (`tsconfig.json`에 `@/*` 경로)

### Phase 2: 기반 코드

- [ ] `types/index.ts` 작성 (위 타입 정의 그대로)
- [ ] `constants/colors.ts` 작성
- [ ] `constants/api.ts` 작성
- [ ] `lib/api.ts` 작성 (axios 인스턴스)
- [ ] `lib/storage.ts` 작성 (MMKV)
- [ ] `lib/notifications.ts` 작성
- [ ] `store/wishlistStore.ts` 작성 (Zustand + MMKV)
- [ ] `hooks/useMovieSchedules.ts` 작성 (TanStack Query 사용)
- [ ] `hooks/useWishlist.ts` 작성 (store 연결)

### Phase 3: 공통 컴포넌트

- [ ] `components/Header.tsx`
- [ ] `components/SkeletonCard.tsx` (shimmer 애니메이션)
- [ ] `components/DateSelector.tsx`
- [ ] `components/MovieFilter.tsx`
- [ ] `components/MovieCard.tsx`

### Phase 4: 메인 화면

- [ ] `app/_layout.tsx` (QueryClientProvider, GestureHandlerRootView, 폰트 로드)
- [ ] `app/(tabs)/_layout.tsx` (탭 바 아이콘, 색상)
- [ ] `app/(tabs)/index.tsx` (홈 화면 전체)
- [ ] `components/MovieModal.tsx` (Bottom Sheet)

### Phase 5: 찜/설정 화면

- [ ] `app/(tabs)/wishlist.tsx`
- [ ] `components/WishlistCard.tsx`
- [ ] `app/(tabs)/settings.tsx`

### Phase 6: 네이티브 기능 연동

- [ ] 알림 권한 요청 로직
- [ ] 찜 목록에서 알림 예약/취소
- [ ] 공유 기능 (영화 상세 모달)
- [ ] 햅틱 피드백 전체 적용

### Phase 7: 백엔드 Express 구성

- [ ] `backend/package.json` 초기화 (`npm init`)
- [ ] 의존성: `express`, `cheerio`, `axios`, `mongoose`, `@upstash/redis`, `cors`, `dotenv`
- [ ] `backend/src/app.ts` 기본 서버 구조
- [ ] `backend/src/routes/schedules.ts` 작성
  - 기존: `movie/src/app/api/schedules/route.ts`에서 로직 이식
- [ ] `backend/src/routes/movie-info.ts` 작성
  - 기존: `movie/src/app/api/movie-info/`에서 로직 이식
- [ ] `backend/src/routes/booking-url.ts` 작성
- [ ] `backend/src/services/` 스크래핑 서비스들 이식
  - 기존: `movie/src/services/scheduleService.js`, `kobisApi.ts`, `tmdbApi.ts`
- [ ] Railway 또는 Vercel에 배포
- [ ] `.env`의 `EXPO_PUBLIC_API_URL` 새 서버 URL로 교체

### Phase 8: 배포 준비

- [ ] `eas.json` 설정 (EAS Build)
- [ ] 앱 아이콘 / 스플래시 이미지 제작 (1024x1024 PNG)
- [ ] `app.json` iOS 권한 설명 추가:
  ```json
  "infoPlist": {
    "NSUserNotificationsUsageDescription": "영화 상영 시작 전 알림을 보내드립니다."
  }
  ```
- [ ] `eas build --platform ios --profile production` 실행
- [ ] App Store Connect 앱 등록 + 스크린샷 업로드
- [ ] 심사 제출

---

## 구현 참고: 기존 코드 매핑

새로 작성할 때 기존 코드를 참고하되, `localStorage` → `MMKV`, `fetch` → `axios`, CSS → NativeWind로 변환.

| 기존 (Next.js) | 새로 (React Native) |
|----------------|---------------------|
| `src/hooks/useMovieSchedules.ts` | `hooks/useMovieSchedules.ts` (TanStack Query로 교체) |
| `src/hooks/useWishlist.ts` | `store/wishlistStore.ts` + `hooks/useWishlist.ts` |
| `src/components/MovieCard.tsx` | `components/MovieCard.tsx` (`<View>` + `expo-image`) |
| `src/components/DateSelector.tsx` | `components/DateSelector.tsx` (`FlatList` horizontal) |
| `src/components/MovieModal.tsx` | `components/MovieModal.tsx` (`BottomSheet`) |
| `src/components/WishlistView.tsx` | `app/(tabs)/wishlist.tsx` + `WishlistCard.tsx` |
| `src/lib/native.ts` | `lib/notifications.ts` (expo-notifications으로 재작성) |
| `src/app/api/schedules/route.ts` | `backend/src/routes/schedules.ts` |
| `localStorage` | `MMKV` (react-native-mmkv) |
| `window.confirm()` | `Alert.alert()` |
| `<img>` | `<Image>` (expo-image) |
| `<a href>` | `WebBrowser.openBrowserAsync()` |
| Tailwind CSS | NativeWind (거의 동일한 클래스명) |

---

## 주의사항

1. **react-native-mmkv**: Expo Go에서 동작 안 함. 개발 중엔 `expo-secure-store` 또는 `AsyncStorage`로 대체 후, 프로덕션 빌드 시 MMKV로 교체.

2. **@gorhom/bottom-sheet**: `react-native-gesture-handler`와 `react-native-reanimated` 필요. `GestureHandlerRootView`를 루트 레이아웃에 감싸야 함.

3. **Puppeteer**: React Native 환경에서 실행 불가. 백엔드(Express)에서만 사용.

4. **NativeWind v4**: `className` prop이 기본적으로 타입 오류를 낼 수 있음. `nativewind/types.d.ts` 설정 필요.

5. **Expo Router v4**: `expo-router`의 `Link`, `useRouter`, `useLocalSearchParams` 사용. Next.js와 API가 유사함.

6. **iOS 시뮬레이터**: 로컬 알림은 시뮬레이터에서 동작하나, 실제 기기 테스트 권장.

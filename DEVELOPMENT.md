# 개발 환경 설정 가이드

다른 PC에서 이 프로젝트를 이어서 개발하기 위한 가이드입니다.

---

## 사전 준비

| 도구 | 버전 | 설치 |
|------|------|------|
| Node.js | 20.x | https://nodejs.org |
| Xcode | 최신 | Mac App Store (iOS 테스트 시) |
| Android Studio | 최신 | https://developer.android.com/studio (Android 테스트 시) |
| EAS CLI | 최신 | `npm install -g eas-cli` |

---

## 프로젝트 클론 및 의존성 설치

```bash
git clone https://github.com/Inside-eun/movie_mania_native.git
cd movie_mania_native

# 앱 의존성
npm install

# 백엔드 의존성
cd backend && npm install && cd ..
```

---

## 환경 변수 설정

### 백엔드 (`backend/.env`)

```bash
cp backend/.env.example backend/.env
```

`.env` 파일을 열어 아래 값들을 채워 넣습니다:

```
PORT=4000
UPSTASH_REDIS_REST_URL=https://...   # Upstash 콘솔에서 확인
UPSTASH_REDIS_REST_TOKEN=...
KOBIS_API_KEY=...                     # KOBIS 오픈API
KMDB_API_KEY=...                      # KMDb 오픈API
TMDB_API_KEY=...                      # TMDB API
```

### 앱 (선택)

프로덕션 배포 서버(`https://moviemania-olive.vercel.app`)를 기본으로 사용합니다.  
로컬 백엔드를 쓰고 싶을 때만 루트에 `.env.local` 파일을 생성합니다:

```
EXPO_PUBLIC_API_URL=http://192.168.x.x:4000
```

> IP 주소는 Mac의 Wi-Fi IP를 사용하세요 (`ifconfig | grep "inet "` 또는 시스템 설정 → Wi-Fi → 세부정보).  
> `localhost`는 실기기에서 동작하지 않습니다.

---

## 로컬 실행

### 백엔드 서버 (선택 — 로컬 테스트 시)

```bash
cd backend
npm run dev
# → http://localhost:4000 에서 실행
```

### 앱

```bash
# 프로젝트 루트에서
npx expo start --clear
```

터미널에 QR 코드와 함께 옵션이 표시됩니다:
- `i` → iOS 시뮬레이터
- `a` → Android 에뮬레이터
- `s` → Expo Go (일부 네이티브 모듈 미지원)

---

## 실기기 테스트 (권장)

이 프로젝트는 `expo-location`, `expo-notifications` 등 **네이티브 모듈**을 사용합니다.  
Expo Go 대신 **Dev Client 빌드**가 필요합니다.

### Dev Client 빌드 (처음 한 번, 또는 네이티브 모듈 추가 후)

```bash
# iOS
npx expo run:ios

# Android
npx expo run:android
```

빌드 후 기기에 앱이 설치되면, 이후에는 `npx expo start --clear`만 실행해도 됩니다.

### EAS Build (원격 빌드 — Mac 없이 iOS 빌드할 때)

```bash
eas build --profile development --platform ios
```

---

## 자주 쓰는 명령어

```bash
# Metro 캐시 초기화 후 실행 (모듈 오류 발생 시)
npx expo start --clear

# 타입 체크
npx tsc --noEmit

# 백엔드 빌드 (배포 시)
cd backend && npm run build
```

---

## 프로젝트 구조

```
movie_mania_native/
├── app/                  # expo-router 화면
│   └── (tabs)/           # 탭 화면 (홈, 찜목록, 설정)
├── components/           # 공통 컴포넌트
├── hooks/                # 커스텀 훅
├── store/                # Zustand 전역 상태
├── constants/            # 상수 (API URL, 색상 등)
├── types/                # TypeScript 타입 정의
├── lib/                  # API 클라이언트, 유틸
└── backend/              # Express 백엔드
    └── src/
        ├── routes/       # API 라우터
        ├── services/     # 크롤링 & 외부 API
        └── data/         # 영화관 정적 데이터
```

---

## 주의사항

- `ios/` 폴더는 `.gitignore`에 포함되어 있습니다. 새 PC에서 처음 실행 시 `npx expo run:ios`로 네이티브 빌드를 생성해야 합니다.
- 네이티브 모듈(예: `expo-location`)을 새로 설치한 뒤에는 반드시 `npx expo run:ios` 또는 `npx expo run:android`로 재빌드해야 합니다. Metro 재시작만으로는 안 됩니다.
- 백엔드 없이도 앱은 Vercel 배포 서버를 기본 사용하므로 바로 실행 가능합니다.

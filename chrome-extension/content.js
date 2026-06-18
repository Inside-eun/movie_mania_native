const BACKEND_URL = 'http://localhost:4000/api/cgv-mov-no';
const SECRET = 'cgv-collector-secret';

// injected.js를 페이지 컨텍스트에 주입 (fetch 래핑을 위해 필요)
const script = document.createElement('script');
script.src = chrome.runtime.getURL('injected.js');
script.onload = () => script.remove();
(document.head || document.documentElement).appendChild(script);

// injected.js에서 postMessage로 받은 데이터를 백엔드로 전송
window.addEventListener('message', async (event) => {
  if (event.source !== window || event.data?.type !== 'CGV_MOV_NO_DATA') return;

  const movies = event.data.movies;

  try {
    const res = await fetch(BACKEND_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-collector-secret': SECRET,
      },
      body: JSON.stringify({ movies }),
    });

    const result = await res.json();

    // 팝업에서 결과를 볼 수 있도록 chrome.storage에 저장
    chrome.storage.local.get('log', ({ log = [] }) => {
      const newEntry = {
        time: new Date().toLocaleTimeString('ko-KR'),
        movies,
        saved: result.saved ?? 0,
        skipped: result.skipped ?? 0,
      };
      chrome.storage.local.set({ log: [newEntry, ...log].slice(0, 20) });
    });
  } catch (e) {
    console.error('[CGV 수집기] 백엔드 전송 실패:', e);
  }
});

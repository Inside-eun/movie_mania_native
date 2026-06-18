// CGV 페이지 컨텍스트에서 실행 — fetch를 감싸서 searchMovScnInfo 응답을 가로챔
(function () {
  const originalFetch = window.fetch;

  window.fetch = async function (...args) {
    const response = await originalFetch.apply(this, args);
    const url = typeof args[0] === 'string' ? args[0] : args[0]?.url ?? '';

    if (url.includes('searchMovScnInfo')) {
      const clone = response.clone();
      clone.json().then((body) => {
        if (!Array.isArray(body?.data)) return;

        const movies = {};
        body.data.forEach((item) => {
          if (item.movNo && item.movNm) {
            movies[item.movNm] = item.movNo;
          }
        });

        if (Object.keys(movies).length > 0) {
          window.postMessage({ type: 'CGV_MOV_NO_DATA', movies }, '*');
        }
      }).catch(() => {});
    }

    return response;
  };
})();

function render(log) {
  const container = document.getElementById('log');
  if (!log.length) {
    container.innerHTML = '<div class="empty">아직 수집된 데이터가 없습니다.<br>CGV 상영 스케줄 페이지를 열어보세요.</div>';
    return;
  }

  container.innerHTML = log.map((entry) => {
    const titles = Object.keys(entry.movies).join(', ');
    return `
      <div class="entry">
        <div class="time">${entry.time}</div>
        <div>
          <span class="badge saved">저장 ${entry.saved}건</span>
          <span class="badge skipped">중복 ${entry.skipped}건</span>
        </div>
        <div class="movie-list">${titles}</div>
      </div>
    `;
  }).join('');
}

chrome.storage.local.get('log', ({ log = [] }) => render(log));

document.getElementById('clear').addEventListener('click', () => {
  chrome.storage.local.set({ log: [] }, () => render([]));
});

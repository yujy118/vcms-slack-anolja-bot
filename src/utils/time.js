/**
 * 시간 포맷 유틸 (24시간 기준)
 * 출력 예: 2026-02-17 00:04:31
 */
function formatDateTime(date = new Date()) {
  const d = new Date(date.toLocaleString('en-US', { timeZone: 'Asia/Seoul' }));
  const yyyy = d.getFullYear();
  const MM = String(d.getMonth() + 1).padStart(2, '0');
  const dd = String(d.getDate()).padStart(2, '0');
  const HH = String(d.getHours()).padStart(2, '0');
  const mm = String(d.getMinutes()).padStart(2, '0');
  const ss = String(d.getSeconds()).padStart(2, '0');
  return `${yyyy}-${MM}-${dd} ${HH}:${mm}:${ss}`;
}

module.exports = { formatDateTime };

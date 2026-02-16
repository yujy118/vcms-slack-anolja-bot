/**
 * 번호 정규식 정제 유틸
 */

const PHONE_REGEX = /01[0-9]-?\d{3,4}-?\d{4}/g;

/**
 * 텍스트에서 전화번호만 추출
 * @param {string} text
 * @returns {string[]}
 */
function extractPhones(text) {
  return text.match(PHONE_REGEX) || [];
}

/**
 * 번호 포맷 통일 (하이픈 제거)
 * @param {string} phone
 * @returns {string}
 */
function normalize(phone) {
  return phone.replace(/-/g, '');
}

/**
 * 중복 제거
 * @param {Array<{number: string}>} phones
 * @returns {{ unique: Array, duplicateCount: number }}
 */
function dedup(phones) {
  const seen = new Set();
  const unique = [];
  let duplicateCount = 0;

  for (const p of phones) {
    const normalized = normalize(p.number);
    if (seen.has(normalized)) {
      duplicateCount++;
    } else {
      seen.add(normalized);
      unique.push({ ...p, number: normalized });
    }
  }

  return { unique, duplicateCount };
}

module.exports = { extractPhones, normalize, dedup };

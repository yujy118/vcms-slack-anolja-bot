const { formatDateTime } = require('../utils/time');

/**
 * 발송 결과 CSV 생성
 * @param {Array<{number: string, name: string}>} phones - 원본 번호 목록
 * @param {object} solapiResult - Solapi 응답 원본
 * @param {string} smsText - 발송 문구
 * @returns {string} CSV 문자열
 */
function buildResultCsv(phones, solapiResult, smsText) {
  // BOM for Excel 한글 깨짐 방지
  const BOM = '\uFEFF';
  const header = '번호,업장명,발송상태,발송일시,문자내용';

  const rows = phones.map((p) => {
    const status = '발송완료';
    const time = formatDateTime();
    // CSV 내 콤마/줄바꿈 처리
    const safeText = `"${smsText.replace(/"/g, '""').replace(/\n/g, ' ')}"`;
    const safeName = `"${(p.name || '알 수 없음').replace(/"/g, '""')}"`;
    return `${p.number},${safeName},${status},${time},${safeText}`;
  });

  return BOM + [header, ...rows].join('\n');
}

/**
 * CSV를 Slack 스레드에 파일 업로드
 * @param {object} client - Slack WebClient
 * @param {string} channelId
 * @param {string} threadTs
 * @param {Array<{number: string, name: string}>} phones
 * @param {object} solapiResult
 * @param {string} smsText
 */
async function uploadResultCsv(client, channelId, threadTs, phones, solapiResult, smsText) {
  const csv = buildResultCsv(phones, solapiResult, smsText);
  const dateStr = formatDateTime().replace(/[: ]/g, '-');
  const filename = `sms-발송결과-${dateStr}.csv`;

  await client.filesUploadV2({
    channel_id: channelId,
    thread_ts: threadTs,
    filename,
    content: csv,
    title: `📊 SMS 발송 결과 (${phones.length}건)`,
    initial_comment: `📎 발송 대상 ${phones.length}건의 상세 결과입니다.`,
  });
}

module.exports = { buildResultCsv, uploadResultCsv };

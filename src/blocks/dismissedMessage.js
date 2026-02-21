const { formatDateTime } = require('../utils/time');

/**
 * 문자 발송 안함 Block Kit (원래 메시지를 업데이트)
 * @param {object} params
 * @param {string} params.userId - 처리자 ID
 * @param {string} [params.type] - 'alert' | 'recovery'
 */
function buildDismissedMessage({ userId, type = 'alert' }) {
  const title = type === 'recovery'
    ? '해제 문자 발송 안함'
    : '연동 지연 문자 발송 안함';
  const emoji = type === 'recovery' ? '✅' : '❌';

  return {
    blocks: [
      {
        type: 'section',
        text: {
          type: 'mrkdwn',
          text: `${emoji} *${title}*\n처리자: <@${userId}>\n처리일시: ${formatDateTime()}`,
        },
      },
    ],
    text: `${title} - <@${userId}>`,
  };
}

module.exports = { buildDismissedMessage };

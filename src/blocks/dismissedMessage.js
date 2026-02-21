/**
 * 연동 지연 문자 발송 안함 Block Kit (원래 메시지를 업데이트)
 */

function buildDismissedMessage({ userId, timestamp }) {
  return [
    {
      type: 'section',
      text: {
        type: 'mrkdwn',
        text: `❌ *연동 지연 문자 발송 안함*\n처리자: <@${userId}>\n처리일시: ${timestamp}`,
      },
    },
  ];
}

module.exports = { buildDismissedMessage };

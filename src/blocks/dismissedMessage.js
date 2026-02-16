/**
 * 알림 무시됨 Block Kit (원래 메시지를 업데이트)
 */

function buildDismissedMessage({ userId, timestamp }) {
  return [
    {
      type: 'section',
      text: {
        type: 'mrkdwn',
        text: `❌ *야놀자 403 장애 알림 무시됨*\n처리자: <@${userId}>\n처리 시간: ${timestamp}`,
      },
    },
  ];
}

module.exports = { buildDismissedMessage };

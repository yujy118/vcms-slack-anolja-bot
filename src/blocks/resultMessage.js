const { formatDateTime } = require('../utils/time');

/**
 * 발송 결과 Block Kit (원래 메시지를 업데이트)
 */

function buildResultMessage({ total, success, failure, userId, template, type }) {
  const title = type === 'recovery' ? '해제 SMS 발송 완료' : 'SMS 발송 완료';
  const failureNote = failure > 0 ? ' (상세 내역은 아래 스레드 확인)' : '';

  return [
    {
      type: 'section',
      text: {
        type: 'mrkdwn',
        text: [
          `✅ *${title}* (총 ${total}건)`,
          '',
          `성공: ${success}건`,
          `실패: ${failure}건${failureNote}`,
          '',
          `발송 승인자: <@${userId}>`,
          `선택 템플릿: ${template}`,
          `발송일시: ${formatDateTime()}`,
        ].join('\n'),
      },
    },
  ];
}

module.exports = { buildResultMessage };

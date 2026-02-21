/**
 * 장애 해제 알림 Block Kit
 */

function buildRecoveryMessage({ incidentId, shopCount, recoveryRate, resolvedAt, alertedAt }) {
  const displayRate = (recoveryRate !== undefined && recoveryRate !== null) ? `${recoveryRate}%` : '확인 중';
  const displayDuration = calculateDuration(alertedAt, resolvedAt);

  return [
    {
      type: 'header',
      text: {
        type: 'plain_text',
        text: '✅ 야놀자 403 연동 지연 해제',
        emoji: true,
      },
    },
    {
      type: 'section',
      fields: [
        {
          type: 'mrkdwn',
          text: `*해제 시간:*\n${resolvedAt}`,
        },
        {
          type: 'mrkdwn',
          text: `*잔여 에러 업장:*\n${shopCount !== undefined ? shopCount : 0}개`,
        },
      ],
    },
    {
      type: 'section',
      text: {
        type: 'mrkdwn',
        text: `*장애 지속 시간:* ${displayDuration}`,
      },
    },
    { type: 'divider' },
    {
      type: 'actions',
      elements: [
        {
          type: 'button',
          text: { type: 'plain_text', text: '문자 발송', emoji: true },
          style: 'primary',
          action_id: 'open_recovery_modal',
          value: incidentId,
        },
        {
          type: 'button',
          text: { type: 'plain_text', text: '문자 발송 안함', emoji: true },
          action_id: 'skip_recovery_sms',
          value: incidentId,
        },
      ],
    },
  ];
}

/**
 * 장애 지속 시간 계산
 */
function calculateDuration(alertedAt, resolvedAt) {
  if (!alertedAt || alertedAt === '알 수 없음') return '알 수 없음';

  try {
    const start = new Date(alertedAt.replace(/(\d{4}-\d{2}-\d{2}) (\d{2}:\d{2}:\d{2})/, '$1T$2'));
    const end = new Date(resolvedAt.replace(/(\d{4}-\d{2}-\d{2}) (\d{2}:\d{2}:\d{2})/, '$1T$2'));
    const diffMs = end - start;

    if (isNaN(diffMs) || diffMs < 0) return '알 수 없음';

    const minutes = Math.floor(diffMs / 60000);
    const hours = Math.floor(minutes / 60);
    const mins = minutes % 60;

    if (hours > 0) return `${hours}시간 ${mins}분`;
    return `${mins}분`;
  } catch {
    return '알 수 없음';
  }
}

module.exports = { buildRecoveryMessage };

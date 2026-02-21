/**
 * 장애 해제 알림 Block Kit
 */

function buildRecoveryMessage({ incidentId, shopCount, recoveryRate, resolvedAt, alertedAt }) {
  // 정상화 업장 표시: undefined면 '알 수 없음'
  const hasData = recoveryRate !== undefined && recoveryRate !== null
    && shopCount !== undefined && shopCount !== null;
  const displayRecovery = hasData
    ? `${shopCount}/${shopCount}개 (${recoveryRate}%)`
    : '알 수 없음';

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
          text: `*정상화 업장:*\n${displayRecovery}`,
        },
      ],
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

module.exports = { buildRecoveryMessage };

/**
 * 장애 해제 알림 Block Kit (스레드에 게시)
 */

function buildRecoveryMessage({ incidentId, recoveredCount, totalCount, rate, duration, resolvedAt }) {
  return [
    {
      type: 'header',
      text: {
        type: 'plain_text',
        text: '✅ 야놀자 403 장애 해제',
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
          text: `*복구 업장:*\n${recoveredCount}/${totalCount}개 (${rate}%)`,
        },
      ],
    },
    {
      type: 'section',
      text: {
        type: 'mrkdwn',
        text: `*장애 지속 시간:* ${duration}`,
      },
    },
    { type: 'divider' },
    {
      type: 'actions',
      elements: [
        {
          type: 'button',
          text: { type: 'plain_text', text: '📱 해제 문자 발송', emoji: true },
          style: 'primary',
          action_id: 'open_recovery_modal',
          value: incidentId,
        },
        {
          type: 'button',
          text: { type: 'plain_text', text: '❌ 발송 안함', emoji: true },
          action_id: 'skip_recovery_sms',
          value: incidentId,
        },
      ],
    },
  ];
}

module.exports = { buildRecoveryMessage };

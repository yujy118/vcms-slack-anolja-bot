/**
 * 장애 감지 알림 Block Kit
 */

function buildAlertMessage({ incidentId, shopCount, threshold, shopNames, detectedAt }) {
  return [
    {
      type: 'header',
      text: {
        type: 'plain_text',
        text: '🚨 야놀자 403 연동 지연 발생',
        emoji: true,
      },
    },
    {
      type: 'section',
      fields: [
        {
          type: 'mrkdwn',
          text: `*발생 시간:*\n${detectedAt}`,
        },
        {
          type: 'mrkdwn',
          text: `*발생 숙박업소:*\n${shopCount}개 (임계치: ${threshold}개)`,
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
          action_id: 'open_sms_modal',
          value: incidentId,
        },
        {
          type: 'button',
          text: { type: 'plain_text', text: '문자 발송 안함', emoji: true },
          action_id: 'dismiss_alert',
          value: incidentId,
        },
      ],
    },
  ];
}

module.exports = { buildAlertMessage };

/**
 * 장애 감지 알림 Block Kit
 */

function buildAlertMessage({ incidentId, shopCount, threshold, shopNames, detectedAt }) {
  return [
    {
      type: 'header',
      text: {
        type: 'plain_text',
        text: '🚨 야놀자 403 장애 감지',
        emoji: true,
      },
    },
    {
      type: 'section',
      fields: [
        {
          type: 'mrkdwn',
          text: `*감지 시간:*\n${detectedAt}`,
        },
        {
          type: 'mrkdwn',
          text: `*에러 업장:*\n${shopCount}개 (임계치: ${threshold}개)`,
        },
      ],
    },
    {
      type: 'section',
      text: {
        type: 'mrkdwn',
        text: `📋 *주요 업장:*\n${shopNames}`,
      },
    },
    { type: 'divider' },
    {
      type: 'actions',
      elements: [
        {
          type: 'button',
          text: { type: 'plain_text', text: '📱 문자 발송하기', emoji: true },
          style: 'primary',
          action_id: 'open_sms_modal',
          value: incidentId,
        },
        {
          type: 'button',
          text: { type: 'plain_text', text: '❌ 무시', emoji: true },
          style: 'danger',
          action_id: 'dismiss_alert',
          value: incidentId,
        },
      ],
    },
  ];
}

module.exports = { buildAlertMessage };

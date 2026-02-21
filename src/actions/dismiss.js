const { formatDateTime } = require('../utils/time');

function registerDismissAction(app) {
  app.action('dismiss_alert', async ({ ack, body, client }) => {
    await ack();

    const userId = body.user.id;
    const channelId = body.channel.id;
    const messageTs = body.message.ts;

    // 1. 원본 메시지에서 버튼만 제거 (장애 정보 유지)
    const updatedBlocks = body.message.blocks.filter(
      (block) => block.type !== 'actions'
    );

    await client.chat.update({
      channel: channelId,
      ts: messageTs,
      blocks: updatedBlocks,
      text: '연동 지연 문자 발송 안함',
    });

    // 2. 스레드에 로그 박제
    await client.chat.postMessage({
      channel: channelId,
      thread_ts: messageTs,
      blocks: [
        {
          type: 'section',
          text: {
            type: 'mrkdwn',
            text: `❌ *연동 지연 문자 발송 안함*\n처리자: <@${userId}>\n처리일시: ${formatDateTime()}`,
          },
        },
      ],
      text: `연동 지연 문자 발송 안함 - <@${userId}>`,
    });
  });
}

module.exports = { registerDismissAction };

const { buildDismissedMessage } = require('../blocks/dismissedMessage');

function registerDismissAction(app) {
  app.action('dismiss_alert', async ({ ack, body, client }) => {
    await ack();

    const userId = body.user.id;
    const channelId = body.channel.id;
    const messageTs = body.message.ts;

    // 1. 원본 메시지에서 버튼만 제거
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
    const { blocks, text } = buildDismissedMessage({ userId, type: 'alert' });
    await client.chat.postMessage({
      channel: channelId,
      thread_ts: messageTs,
      blocks,
      text,
    });
  });
}

module.exports = { registerDismissAction };

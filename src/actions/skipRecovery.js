const { buildDismissedMessage } = require('../blocks/dismissedMessage');

function registerSkipRecoveryAction(app) {
  app.action('skip_recovery_sms', async ({ ack, body, client }) => {
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
      text: '해제 문자 발송 안함',
    });

    // 2. 스레드에 로그 박제
    const { blocks, text } = buildDismissedMessage({ userId, type: 'recovery' });
    await client.chat.postMessage({
      channel: channelId,
      thread_ts: messageTs,
      blocks,
      text,
    });
  });
}

module.exports = { registerSkipRecoveryAction };

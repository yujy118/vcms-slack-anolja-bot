function registerDismissAction(app) {
  app.action('dismiss_alert', async ({ ack, body, client }) => {
    await ack();

    const userId = body.user.id;
    const channelId = body.channel.id;
    const messageTs = body.message.ts;

    // 원본 블록에서 actions(버튼) 제거하고 무시 정보 추가
    const originalBlocks = body.message.blocks.filter(
      (block) => block.type !== 'actions'
    );

    const updatedBlocks = [
      ...originalBlocks,
      { type: 'divider' },
      {
        type: 'section',
        text: {
          type: 'mrkdwn',
          text: `❌ *알림 무시됨*\n처리자: <@${userId}>\n처리 시간: ${new Date().toLocaleString('ko-KR', { timeZone: 'Asia/Seoul' })}`,
        },
      },
    ];

    await client.chat.update({
      channel: channelId,
      ts: messageTs,
      blocks: updatedBlocks,
      text: '야놀자 403 장애 알림 무시됨',
    });
  });
}

module.exports = { registerDismissAction };

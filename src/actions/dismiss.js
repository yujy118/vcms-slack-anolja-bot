function registerDismissAction(app) {
  app.action('dismiss_alert', async ({ ack, body, client }) => {
    await ack();

    const userId = body.user.id;
    const channelId = body.channel.id;
    const messageTs = body.message.ts;

    // 메시지 삭제 대신 업데이트 → 처리자 박제
    await client.chat.update({
      channel: channelId,
      ts: messageTs,
      blocks: [
        {
          type: 'section',
          text: {
            type: 'mrkdwn',
            text: `❌ *야놀자 403 장애 알림 무시됨*\n처리자: <@${userId}>\n처리 시간: ${new Date().toLocaleString('ko-KR', { timeZone: 'Asia/Seoul' })}`,
          },
        },
      ],
      text: '야놀자 403 장애 알림 무시됨',
    });
  });
}

module.exports = { registerDismissAction };

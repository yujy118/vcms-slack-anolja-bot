function registerSkipRecoveryAction(app) {
  app.action('skip_recovery_sms', async ({ ack, body, client }) => {
    await ack();

    const userId = body.user.id;
    const channelId = body.channel.id;
    const messageTs = body.message.ts;

    // 해제 문자 발송 안함 → 처리자 박제
    await client.chat.update({
      channel: channelId,
      ts: messageTs,
      blocks: [
        {
          type: 'section',
          text: {
            type: 'mrkdwn',
            text: `✅ *야놀자 403 장애 해제* (문자 발송 안함)\n처리자: <@${userId}>\n처리 시간: ${new Date().toLocaleString('ko-KR', { timeZone: 'Asia/Seoul' })}`,
          },
        },
      ],
      text: '야놀자 403 장애 해제 - 문자 발송 안함',
    });
  });
}

module.exports = { registerSkipRecoveryAction };

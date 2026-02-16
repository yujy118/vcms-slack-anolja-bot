const { buildSmsModal } = require('../views/smsModal');
const alertState = require('../monitor/alertState');

function registerSmsAction(app) {
  app.action('open_sms_modal', async ({ ack, body, client }) => {
    await ack();

    const incidentId = body.actions[0].value;
    const stateKey = `${incidentId}_alert`;

    // 상태가 없으면 ALERTING으로 초기화 (테스트 호환성)
    const currentState = alertState.getState(stateKey);
    if (!currentState) {
      alertState.setState(stateKey, alertState.AlertStatus.ALERTING);
    } else if (currentState.status === alertState.AlertStatus.COMPLETED) {
      // 이미 발송 완료된 건
      const who = currentState.completedBy ? `<@${currentState.completedBy}>` : '다른 사용자';
      await client.chat.postEphemeral({
        channel: body.channel.id,
        user: body.user.id,
        text: `⚠️ 이미 ${who} 님이 발송을 완료한 건입니다.`,
      });
      return;
    }

    // 메타데이터 저장 (버튼이 있는 메시지의 ts)
    alertState.setMeta(incidentId, { messageTs: body.message.ts });

    const modal = buildSmsModal({
      incidentId,
      type: 'alert',
    });

    await client.views.open({
      trigger_id: body.trigger_id,
      view: modal,
    });
  });
}

module.exports = { registerSmsAction };

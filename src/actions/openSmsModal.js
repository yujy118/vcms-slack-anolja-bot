const { buildSmsModal } = require('../views/smsModal');
const alertState = require('../monitor/alertState');

function registerSmsAction(app) {
  app.action('open_sms_modal', async ({ ack, body, client }) => {
    await ack();

    const incidentId = body.actions[0].value;

    // 이미 발송 완료된 건이면 모달 안 열기
    const currentState = alertState.getState(incidentId);
    if (currentState === alertState.AlertStatus.COMPLETED) {
      await client.chat.postEphemeral({
        channel: body.channel.id,
        user: body.user.id,
        text: '⚠️ 이미 발송이 완료된 건입니다.',
      });
      return;
    }

    // 모달 열기
    const modal = buildSmsModal({
      incidentId,
      type: 'alert', // 'alert' | 'recovery'
    });

    await client.views.open({
      trigger_id: body.trigger_id,
      view: modal,
    });
  });
}

module.exports = { registerSmsAction };

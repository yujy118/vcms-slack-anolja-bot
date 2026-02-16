const { buildSmsModal } = require('../views/smsModal');
const alertState = require('../monitor/alertState');

function registerRecoveryAction(app) {
  app.action('open_recovery_modal', async ({ ack, body, client }) => {
    await ack();

    const incidentId = body.actions[0].value;

    // 모달 열기 (해제 문자용)
    const modal = buildSmsModal({
      incidentId,
      type: 'recovery',
    });

    await client.views.open({
      trigger_id: body.trigger_id,
      view: modal,
    });
  });
}

module.exports = { registerRecoveryAction };

const alertState = require('../monitor/alertState');
const solapi = require('../services/solapi');
const retool = require('../services/retool');
const { buildResultMessage } = require('../blocks/resultMessage');
const { buildFailureDetail } = require('../blocks/failureDetail');

function registerSmsSendHandler(app) {
  app.view('sms_modal_submit', async ({ ack, body, view, client }) => {
    const { incidentId, type } = JSON.parse(view.private_metadata);
    const userId = body.user.id;

    // === 1. 책임 체크박스 확인 ===
    const confirmValues =
      view.state.values.confirm_block?.confirm_check?.selected_options || [];
    if (!confirmValues.some((opt) => opt.value === 'confirmed')) {
      return ack({
        response_action: 'errors',
        errors: {
          confirm_block: '발송 책임 확인에 체크해주세요.',
        },
      });
    }

    // === 2. 레이스 컨디션 체크 (원자적) ===
    const stateKey = `${incidentId}_${type}`;
    const canProceed = alertState.compareAndSet(
      stateKey,
      alertState.AlertStatus.ALERTING,
      alertState.AlertStatus.COMPLETED,
      { userId }
    );

    if (!canProceed) {
      const currentState = alertState.getState(stateKey);
      const completedBy = currentState?.completedBy;
      const errorMsg = completedBy
        ? `이미 <@${completedBy}> 님이 발송을 완료했습니다.`
        : '이미 다른 사용자가 발송을 완료했습니다.';

      // sms_text_block이 동적 block_id일 수 있으므로 찾기
      const textBlockId = Object.keys(view.state.values).find((key) =>
        key.startsWith('sms_text_block')
      );

      return ack({
        response_action: 'errors',
        errors: {
          [textBlockId || 'sms_text_block']: errorMsg,
        },
      });
    }

    // === 3. 모달 닫기 ===
    await ack();

    // === 4. 입력값 추출 (block_id가 동적이므로 찾기) ===
    const textBlockId = Object.keys(view.state.values).find((key) =>
      key.startsWith('sms_text_block')
    );
    const smsText =
      (view.state.values[textBlockId]?.sms_text_input?.value || '').trim();

    // template_block은 section accessory라 state.values에 없을 수 있음
    const templateBlockValues = view.state.values.template_block;
    const selectedTemplate = templateBlockValues?.template_select?.selected_option?.text?.text || '직접 입력';

    try {
      // === 5. Retool에서 대상 추출 ===
      const targets = await retool.fetchTargets();

      // 🚨 테스트 모드: 번호 목록도 강제 교체
      const testPhone = process.env.TEST_PHONE;
      if (testPhone) {
        const originalCount = targets.phones.length;
        targets.phones = [{ number: testPhone, name: '🧪 테스트' }];
        console.log(`⚠️  테스트 모드: ${originalCount}개 번호 → ${testPhone} 1건으로 교체`);
      }

      // === 6. Solapi SMS 발송 ===
      const result = await solapi.sendBulk(targets.phones, smsText);

      // === 7. 결과 메시지 회신 ===
      const meta = alertState.getMeta(incidentId);
      const channelId = process.env.SLACK_ALERT_CHANNEL;
      const messageTs = meta.messageTs;

      const resultBlocks = buildResultMessage({
        total: result.total,
        success: result.success,
        failure: result.failure,
        userId,
        template: selectedTemplate,
        type,
      });

      await client.chat.update({
        channel: channelId,
        ts: type === 'recovery' ? meta.recoveryTs : messageTs,
        blocks: resultBlocks,
        text: `SMS 발송 완료 (성공: ${result.success}건 / 실패: ${result.failure}건)`,
      });

      // === 8. 실패 건이 있으면 스레드로 상세 내역 ===
      if (result.failures && result.failures.length > 0) {
        const failureBlocks = buildFailureDetail(result.failures);
        await client.chat.postMessage({
          channel: channelId,
          thread_ts: messageTs,
          blocks: failureBlocks,
          text: `발송 실패 상세: ${result.failures.length}건`,
        });
      }
    } catch (error) {
      console.error('SMS 발송 에러:', error);

      // 에러 시 상태 롤백
      alertState.setState(stateKey, alertState.AlertStatus.ALERTING);

      // 에러 DM
      await client.chat.postMessage({
        channel: userId,
        text: `⚠️ SMS 발송 중 에러 발생: ${error.message}\n다시 시도해주세요.`,
      });
    }
  });
}

module.exports = { registerSmsSendHandler };

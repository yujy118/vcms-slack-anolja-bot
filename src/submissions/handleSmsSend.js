const alertState = require('../monitor/alertState');
const solapi = require('../services/solapi');
const retool = require('../services/retool');
const { buildResultMessage } = require('../blocks/resultMessage');
const { buildFailureDetail } = require('../blocks/failureDetail');
const { buildPhoneListMessage } = require('../blocks/phoneListMessage');
const { uploadResultCsv } = require('../services/resultCsv');
const { formatDateTime } = require('../utils/time');

function registerSmsSendHandler(app) {
  app.view('sms_modal_submit', async ({ ack, body, view, client }) => {
    const { incidentId, type } = JSON.parse(view.private_metadata);
    const userId = body.user.id;

    // === 1. 책임 체크박스 확인 (2개 블록 각각 체크 확인) ===
    const contentCheck =
      view.state.values.confirm_content_block?.confirm_content_check?.selected_options || [];
    const irreversibleCheck =
      view.state.values.confirm_irreversible_block?.confirm_irreversible_check?.selected_options || [];

    if (!contentCheck.some((opt) => opt.value === 'confirmed_content')) {
      return ack({
        response_action: 'errors',
        errors: {
          confirm_content_block: '문자 내용 확인에 체크해주세요.',
        },
      });
    }
    if (!irreversibleCheck.some((opt) => opt.value === 'confirmed_irreversible')) {
      return ack({
        response_action: 'errors',
        errors: {
          confirm_irreversible_block: '발송 주의사항에 체크해주세요.',
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

    // === 4. 입력값 추출 ===
    const textBlockId = Object.keys(view.state.values).find((key) =>
      key.startsWith('sms_text_block')
    );
    const smsText =
      (view.state.values[textBlockId]?.sms_text_input?.value || '').trim();

    const templateBlockValues = view.state.values.template_block;
    const selectedTemplate = templateBlockValues?.template_select?.selected_option?.text?.text || '직접 입력';

    const meta = alertState.getMeta(incidentId);
    const channelId = process.env.SLACK_ALERT_CHANNEL;
    const messageTs = meta.messageTs;

    try {
      // === 5. 원본 메시지 버튼 제거 (발송 중 표시) ===
      try {
        const originalMsg = await client.conversations.history({
          channel: channelId,
          latest: messageTs,
          inclusive: true,
          limit: 1,
        });
        const originalBlocks = originalMsg.messages?.[0]?.blocks || [];
        const updatedBlocks = originalBlocks
          .filter((b) => b.type !== 'actions')
          .concat([
            {
              type: 'context',
              elements: [
                {
                  type: 'mrkdwn',
                  text: `⏳ 문자 발송 중... (by <@${userId}> | ${formatDateTime()})`,
                },
              ],
            },
          ]);

        await client.chat.update({
          channel: channelId,
          ts: messageTs,
          blocks: updatedBlocks,
          text: '문자 발송 중...',
        });
      } catch (e) {
        console.warn('원본 메시지 버튼 제거 실패 (무시):', e.message);
      }

      // === 6. Retool에서 대상 추출 ===
      const targets = await retool.fetchTargets();

      // 원본 번호 목록 보관 (리스트 출력용)
      const originalPhones = [...targets.phones];

      // 🚨 테스트 모드: 번호 목록도 강제 교체
      const testPhone = process.env.TEST_PHONE;
      if (testPhone) {
        const originalCount = targets.phones.length;
        targets.phones = [{ number: testPhone, name: '🧪 테스트' }];
        console.log(`⚠️  테스트 모드: ${originalCount}개 번호 → ${testPhone} 1건으로 교체`);
      }

      // === 7. Solapi SMS 발송 ===
      const result = await solapi.sendBulk(targets.phones, smsText);

      // === 8. 원본 메시지 → 발송 완료로 업데이트 ===
      try {
        const originalMsg = await client.conversations.history({
          channel: channelId,
          latest: messageTs,
          inclusive: true,
          limit: 1,
        });
        const currentBlocks = originalMsg.messages?.[0]?.blocks || [];
        const finalBlocks = currentBlocks
          .filter((b) => b.type !== 'context')
          .concat([
            {
              type: 'context',
              elements: [
                {
                  type: 'mrkdwn',
                  text: `✅ 문자 발송 완료 | <@${userId}> | ${formatDateTime()}`,
                },
              ],
            },
          ]);

        await client.chat.update({
          channel: channelId,
          ts: messageTs,
          blocks: finalBlocks,
          text: `문자 발송 완료 (성공: ${result.success}건)`,
        });
      } catch (e) {
        console.warn('원본 메시지 완료 업데이트 실패 (무시):', e.message);
      }

      // === 9. 결과를 스레드로 회신 ===
      const resultBlocks = buildResultMessage({
        total: result.total,
        success: result.success,
        failure: result.failure,
        userId,
        template: selectedTemplate,
        type,
      });

      await client.chat.postMessage({
        channel: channelId,
        thread_ts: messageTs,
        blocks: resultBlocks,
        text: `문자 발송 완료 (성공: ${result.success}건 / 실패: ${result.failure}건)`,
      });

      // === 10. 발송 대상 리스트를 스레드로 회신 ===
      const phoneListBlocks = buildPhoneListMessage(
        originalPhones,
        !!testPhone,
        testPhone || ''
      );

      await client.chat.postMessage({
        channel: channelId,
        thread_ts: messageTs,
        blocks: phoneListBlocks,
        text: `발송 대상 목록: ${originalPhones.length}건`,
      });

      // === 11. 발송 결과 CSV 파일 스레드에 첨부 ===
      try {
        await uploadResultCsv(client, channelId, messageTs, originalPhones, result, smsText);
      } catch (e) {
        console.warn('CSV 업로드 실패 (무시):', e.message);
      }

      // === 12. 실패 건이 있으면 스레드로 상세 내역 ===
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
      console.error('문자 발송 에러:', error);

      // 에러 시 상태 롤백
      alertState.setState(stateKey, alertState.AlertStatus.ALERTING);

      // 에러 DM
      await client.chat.postMessage({
        channel: userId,
        text: `⚠️ 문자 발송 중 에러 발생: ${error.message}\n다시 시도해주세요.`,
      });
    }
  });
}

module.exports = { registerSmsSendHandler };

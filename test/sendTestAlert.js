/**
 * 테스트용: 장애 알림 전송 + 상태 초기화
 * 사용법: node test/sendTestAlert.js
 */
require('dotenv').config();
const { WebClient } = require('@slack/web-api');
const { buildAlertMessage } = require('../src/blocks/alertMessage');
const alertState = require('../src/monitor/alertState');
const { formatDateTime } = require('../src/utils/time');

const client = new WebClient(process.env.SLACK_BOT_TOKEN);
const channel = process.env.SLACK_ALERT_CHANNEL;

const incidentId = `test-${Date.now()}`;

(async () => {
  // 1. 상태를 ALERTING으로 초기화 (레이스컨디션 체크 통과용)
  alertState.setState(`${incidentId}_alert`, alertState.AlertStatus.ALERTING);

  // 2. 알림 메시지 전송
  const blocks = buildAlertMessage({
    incidentId,
    shopCount: 23,
    threshold: 20,
    shopNames: '홍길동호텔, 제주리조트, 서울스테이 ...외 20건',
    detectedAt: formatDateTime(),
  });

  const result = await client.chat.postMessage({
    channel,
    blocks,
    text: '야놀자 403 장애 감지 테스트',
  });

  // 3. 메타데이터 저장 (결과 메시지 업데이트용)
  alertState.setMeta(incidentId, { messageTs: result.ts });

  console.log(`✅ 테스트 알림 전송 완료!`);
  console.log(`   incident_id: ${incidentId}`);
  console.log(`   message_ts: ${result.ts}`);
  console.log(`\n📱 [문자 발송하기] 버튼을 눌러서 모달 테스트하세요.`);
  console.log(`❌ [무시] 버튼을 눌러서 무시 로그 테스트하세요.`);
})();

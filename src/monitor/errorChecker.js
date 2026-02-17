const alertState = require('./alertState');
const { buildAlertMessage } = require('../blocks/alertMessage');
const { buildRecoveryMessage } = require('../blocks/recoveryMessage');
const { formatDateTime } = require('../utils/time');

const CHECK_INTERVAL = 5 * 60 * 1000; // 5분
const INCIDENT_KEY = 'auto'; // 자동 감지용 고정 키

let lastShopCount = 0;
let isRunning = false;

/**
 * Retool 체크 워크플로우 호출
 */
async function fetchErrorCheck() {
  const url = process.env.RETOOL_CHECK_WORKFLOW_URL;
  const apiKey = process.env.RETOOL_CHECK_API_KEY || process.env.RETOOL_API_KEY;

  if (!url) {
    console.log('\u26a0\ufe0f RETOOL_CHECK_WORKFLOW_URL \ubbf8\uc124\uc815 - \uc790\ub3d9 \uac10\uc9c0 \ube44\ud65c\uc131');
    return null;
  }

  const response = await fetch(url, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'X-Workflow-Api-Key': apiKey,
    },
    body: JSON.stringify({}),
  });

  const raw = await response.json();

  if (!response.ok) {
    throw new Error(`Retool Check \ud638\ucd9c \uc2e4\ud328: ${response.status}`);
  }

  let data = raw;
  if (data.data) data = data.data;
  if (data.data) data = data.data;
  if (typeof data === 'string') {
    data = JSON.parse(data);
  }

  return data; // { shopCount, shopNames, shouldAlert }
}

/**
 * 주기적 에러 체크 실행
 */
function startErrorChecker(client) {
  const channelId = process.env.SLACK_ALERT_CHANNEL;
  const threshold = parseInt(process.env.ALERT_THRESHOLD || '20', 10);

  if (!process.env.RETOOL_CHECK_WORKFLOW_URL) {
    console.log('\u26a0\ufe0f RETOOL_CHECK_WORKFLOW_URL \ubbf8\uc124\uc815 - \uc790\ub3d9 \uac10\uc9c0 \uc2dc\uc791 \uc548 \ud568');
    return;
  }

  console.log(`\ud83d\udd0d \uc790\ub3d9 \uac10\uc9c0 \uc2dc\uc791 (${CHECK_INTERVAL / 1000}\ucd08 \uac04\uaca9, \uc784\uacc4\uce58: ${threshold}\uac1c)`);

  // 시작 시 즉시 1회 체크
  runCheck(client, channelId, threshold);

  // 이후 주기적 체크
  setInterval(() => {
    runCheck(client, channelId, threshold);
  }, CHECK_INTERVAL);
}

async function runCheck(client, channelId, threshold) {
  if (isRunning) {
    console.log('\u23f3 \uc774\uc804 \uccb4\ud06c \uc544\uc9c1 \uc2e4\ud589 \uc911 - \uc2a4\ud0b5');
    return;
  }

  isRunning = true;
  try {
    const data = await fetchErrorCheck();
    if (!data) return;

    const { shopCount, shopNames } = data;
    const now = formatDateTime();

    console.log(`[${now}] \uc5d0\ub7ec \uc5c5\uc7a5: ${shopCount}\uac1c (\uc784\uacc4\uce58: ${threshold})`);

    const alertKey = `${INCIDENT_KEY}_alert`;
    const currentState = alertState.getState(alertKey);
    const isCurrentlyAlerting = currentState &&
      (currentState.status === alertState.AlertStatus.ALERTING ||
       currentState.status === alertState.AlertStatus.COMPLETED);

    // === 장애 감지: 임계치 초과 && 현재 알림 중 아님 ===
    if (shopCount >= threshold && !isCurrentlyAlerting) {
      console.log(`\ud83d\udea8 \uc784\uacc4\uce58 \ucd08\uacfc! \uc54c\ub9bc \ubc1c\uc1a1 (${shopCount} >= ${threshold})`);

      const incidentId = `auto-${Date.now()}`;

      // 상태 설정
      alertState.setState(`${incidentId}_alert`, alertState.AlertStatus.ALERTING);

      // 알림 메시지 발송
      const blocks = buildAlertMessage({
        incidentId,
        shopCount,
        threshold,
        shopNames: shopNames || `${shopCount}\uac1c \uc5c5\uc7a5`,
        detectedAt: now,
      });

      const result = await client.chat.postMessage({
        channel: channelId,
        blocks,
        text: `\ud83d\udea8 \uc57c\ub188\uc790 403 \uc5f0\ub3d9 \uc9c0\uc5f0 \ubc1c\uc0dd (${shopCount}\uac1c \uc5c5\uc7a5)`,
      });

      // 메타데이터 저장
      alertState.setMeta(incidentId, { messageTs: result.ts });

      // 자동 감지 키 업데이트 (복구 감지용)
      alertState.setState(alertKey, alertState.AlertStatus.ALERTING);
      alertState.setMeta(INCIDENT_KEY, {
        lastIncidentId: incidentId,
        messageTs: result.ts,
        alertedAt: now,
      });

      lastShopCount = shopCount;
    }

    // === 복구 감지: 임계치 이하로 떨어짐 && 현재 알림 중 ===
    else if (shopCount < threshold && isCurrentlyAlerting) {
      const recoveryRate = lastShopCount > 0
        ? Math.round((1 - shopCount / lastShopCount) * 100)
        : 100;

      console.log(`\u2705 \ubcf5\uad6c \uac10\uc9c0! (${shopCount} < ${threshold}, \ud68c\ubcf5\ub960: ${recoveryRate}%)`);

      const meta = alertState.getMeta(INCIDENT_KEY);
      const incidentId = meta.lastIncidentId || `auto-recovery-${Date.now()}`;

      // 복구 상태로 변경
      alertState.setState(alertKey, alertState.AlertStatus.NORMAL);
      alertState.setState(`${incidentId}_recovery`, alertState.AlertStatus.ALERTING);

      // 복구 메시지 발송
      const blocks = buildRecoveryMessage({
        incidentId,
        shopCount,
        recoveryRate,
        resolvedAt: now,
        alertedAt: meta.alertedAt || '\uc54c \uc218 \uc5c6\uc74c',
      });

      const result = await client.chat.postMessage({
        channel: channelId,
        blocks,
        text: `\u2705 \uc57c\ub188\uc790 403 \ubcf5\uad6c \uac10\uc9c0 (\uc794\uc5ec: ${shopCount}\uac1c)`,
      });

      alertState.setMeta(incidentId, {
        ...alertState.getMeta(incidentId),
        recoveryMessageTs: result.ts,
      });

      lastShopCount = shopCount;
    }

    // === 상태 유지 (로그만) ===
    else {
      lastShopCount = shopCount;
    }
  } catch (error) {
    console.error('\uc5d0\ub7ec \uccb4\ud06c \uc2e4\ud328:', error.message);
  } finally {
    isRunning = false;
  }
}

module.exports = { startErrorChecker };

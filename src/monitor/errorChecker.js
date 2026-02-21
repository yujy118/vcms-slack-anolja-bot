const alertState = require('./alertState');
const { buildAlertMessage } = require('../blocks/alertMessage');
const { buildRecoveryMessage } = require('../blocks/recoveryMessage');
const { formatDateTime } = require('../utils/time');

const CHECK_INTERVAL = 5 * 60 * 1000; // 5분
const INCIDENT_KEY = 'auto'; // 자동 감지용 고정 키
const DAILY_THREAD_KEY = 'daily_thread'; // 하루 스레드 관리용

let lastShopCount = 0;
let isRunning = false;

/**
 * 오늘 날짜 문자열 (YYYY-MM-DD)
 */
function getTodayDate() {
  return formatDateTime().split(' ')[0];
}

/**
 * 하루 스레드 ts 가져오기 (같은 날이면 기존 스레드, 다른 날이면 null)
 */
function getDailyThreadTs() {
  const meta = alertState.getMeta(DAILY_THREAD_KEY);
  if (meta && meta.date === getTodayDate()) {
    return meta.threadTs;
  }
  return null;
}

/**
 * 하루 스레드 ts 저장
 */
function setDailyThreadTs(threadTs) {
  alertState.setMeta(DAILY_THREAD_KEY, {
    date: getTodayDate(),
    threadTs,
  });
}

/**
 * Retool 체크 워크플로우 호출
 */
async function fetchErrorCheck() {
  const baseUrl = process.env.RETOOL_CHECK_WORKFLOW_URL;
  const apiKey = process.env.RETOOL_CHECK_API_KEY || process.env.RETOOL_API_KEY;

  if (!baseUrl) {
    console.log('⚠️ RETOOL_CHECK_WORKFLOW_URL 미설정 - 자동 감지 비활성');
    return null;
  }

  const separator = baseUrl.includes('?') ? '&' : '?';
  const url = `${baseUrl}${separator}wait_for_result=true`;

  const response = await fetch(url, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'X-Workflow-Api-Key': apiKey,
    },
    body: JSON.stringify({}),
  });

  const raw = await response.json();
  console.log('체크 응답:', JSON.stringify(raw).slice(0, 500));

  if (!response.ok) {
    throw new Error(`Retool Check 호출 실패: ${response.status}`);
  }

  let data = raw;
  if (data.data) data = data.data;
  if (data.data) data = data.data;
  if (typeof data === 'string') {
    data = JSON.parse(data);
  }

  return data;
}

/**
 * 주기적 에러 체크 실행
 */
function startErrorChecker(client) {
  const channelId = process.env.SLACK_ALERT_CHANNEL;
  const threshold = parseInt(process.env.ALERT_THRESHOLD || '30', 10);
  const recoveryThreshold = parseInt(process.env.RECOVERY_THRESHOLD || '10', 10);

  if (!process.env.RETOOL_CHECK_WORKFLOW_URL) {
    console.log('⚠️ RETOOL_CHECK_WORKFLOW_URL 미설정 - 자동 감지 시작 안 함');
    return;
  }

  console.log(`🔍 자동 감지 시작 (${CHECK_INTERVAL / 1000}초 간격, 장애: ${threshold}개, 정상화: ${recoveryThreshold}개 이하)`);

  runCheck(client, channelId, threshold, recoveryThreshold);

  setInterval(() => {
    runCheck(client, channelId, threshold, recoveryThreshold);
  }, CHECK_INTERVAL);
}

async function runCheck(client, channelId, threshold, recoveryThreshold) {
  if (isRunning) {
    console.log('⏳ 이전 체크 아직 실행 중 - 스킵');
    return;
  }

  isRunning = true;
  try {
    const data = await fetchErrorCheck();
    if (!data) return;

    const { shopCount, shopNames } = data;
    const now = formatDateTime();

    console.log(`[${now}] 에러 숙박업소: ${shopCount}개 (장애: ${threshold}, 정상화: ${recoveryThreshold})`);

    const alertKey = `${INCIDENT_KEY}_alert`;
    const currentState = alertState.getState(alertKey);
    const isCurrentlyAlerting = currentState &&
      (currentState.status === alertState.AlertStatus.ALERTING ||
       currentState.status === alertState.AlertStatus.COMPLETED);

    // === 장애 발생 ===
    if (shopCount >= threshold && !isCurrentlyAlerting) {
      console.log(`🚨 임계치 초과! 알림 발송 (${shopCount} >= ${threshold})`);

      const incidentId = `auto-${Date.now()}`;
      alertState.setState(`${incidentId}_alert`, alertState.AlertStatus.ALERTING);

      const blocks = buildAlertMessage({
        incidentId,
        shopCount,
        threshold,
        detectedAt: now,
      });

      let dailyThreadTs = getDailyThreadTs();

      if (!dailyThreadTs) {
        // 하루 첫 알림 → 채널에 메인 메시지
        const mainMsg = await client.chat.postMessage({
          channel: channelId,
          text: `🚨 야놀자 403 연동 지연 감지 (${getTodayDate()})`,
        });
        dailyThreadTs = mainMsg.ts;
        setDailyThreadTs(dailyThreadTs);
      }

      // 스레드에 상세 알림
      const result = await client.chat.postMessage({
        channel: channelId,
        thread_ts: dailyThreadTs,
        blocks,
        text: `🚨 장애 발생 - ${shopCount}개 숙박업소 (${now})`,
      });

      alertState.setMeta(incidentId, { messageTs: result.ts });
      alertState.setState(alertKey, alertState.AlertStatus.ALERTING);
      alertState.setMeta(INCIDENT_KEY, {
        lastIncidentId: incidentId,
        messageTs: result.ts,
        alertedAt: now,
        dailyThreadTs,
      });

      lastShopCount = shopCount;
    }

    // === 정상화 ===
    else if (shopCount <= recoveryThreshold && isCurrentlyAlerting) {
      const recoveryRate = lastShopCount > 0
        ? Math.round((1 - shopCount / lastShopCount) * 100)
        : 100;

      console.log(`✅ 정상화 감지! (${shopCount} <= ${recoveryThreshold}, 회복률: ${recoveryRate}%)`);

      const meta = alertState.getMeta(INCIDENT_KEY);
      const incidentId = meta.lastIncidentId || `auto-recovery-${Date.now()}`;

      alertState.setState(alertKey, alertState.AlertStatus.NORMAL);
      alertState.setState(`${incidentId}_recovery`, alertState.AlertStatus.ALERTING);

      const blocks = buildRecoveryMessage({
        incidentId,
        shopCount,
        recoveryRate,
        resolvedAt: now,
        alertedAt: meta.alertedAt || '알 수 없음',
      });

      let dailyThreadTs = getDailyThreadTs();

      if (!dailyThreadTs) {
        // 혹시 하루 스레드가 없으면 새로 생성
        const mainMsg = await client.chat.postMessage({
          channel: channelId,
          text: `✅ 야놀자 403 연동 지연 감지 (${getTodayDate()})`,
        });
        dailyThreadTs = mainMsg.ts;
        setDailyThreadTs(dailyThreadTs);
      }

      // 스레드에 정상화 알림
      const result = await client.chat.postMessage({
        channel: channelId,
        thread_ts: dailyThreadTs,
        blocks,
        text: `✅ 정상화 - 잔여 ${shopCount}개 (${now})`,
      });

      alertState.setMeta(incidentId, {
        ...alertState.getMeta(incidentId),
        recoveryMessageTs: result.ts,
      });

      lastShopCount = shopCount;
    }

    else {
      lastShopCount = shopCount;
    }
  } catch (error) {
    console.error('에러 체크 실패:', error.message);
  } finally {
    isRunning = false;
  }
}

module.exports = { startErrorChecker };

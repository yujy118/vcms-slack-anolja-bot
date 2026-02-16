/**
 * 장애 상태 관리
 *
 * 상태값:
 *   NORMAL    - 정상
 *   ALERTING  - 장애 감지됨 (알림 발송 완료)
 *   SENDING   - SMS 발송 중
 *   COMPLETED - SMS 발송 완료
 *   COOLDOWN  - 해제 후 쿨다운
 *
 * TODO: 운영 환경에서는 Redis로 교체 권장
 */

const state = new Map();

const AlertStatus = {
  NORMAL: 'NORMAL',
  ALERTING: 'ALERTING',
  SENDING: 'SENDING',
  COMPLETED: 'COMPLETED',
  COOLDOWN: 'COOLDOWN',
};

/**
 * 장애 상태 조회
 * @param {string} incidentId - 장애 고유 ID
 * @returns {string|null}
 */
function getState(incidentId) {
  return state.get(incidentId) || null;
}

/**
 * 장애 상태 설정 (원자적 상태 변경)
 * @param {string} incidentId
 * @param {string} status
 */
function setState(incidentId, status) {
  state.set(incidentId, status);
}

/**
 * 장애 상태를 원자적으로 체크하고 변경 (레이스 컨디션 방지)
 * @param {string} incidentId
 * @param {string} expectedCurrent - 현재 상태가 이것일 때만
 * @param {string} newStatus - 이 상태로 변경
 * @returns {boolean} 성공 여부
 */
function compareAndSet(incidentId, expectedCurrent, newStatus) {
  const current = state.get(incidentId);
  if (current === expectedCurrent) {
    state.set(incidentId, newStatus);
    return true;
  }
  return false;
}

/**
 * 장애 메타데이터 저장 (Slack message ts 등)
 */
const metadata = new Map();

function setMeta(incidentId, data) {
  const existing = metadata.get(incidentId) || {};
  metadata.set(incidentId, { ...existing, ...data });
}

function getMeta(incidentId) {
  return metadata.get(incidentId) || {};
}

module.exports = {
  AlertStatus,
  getState,
  setState,
  compareAndSet,
  setMeta,
  getMeta,
};

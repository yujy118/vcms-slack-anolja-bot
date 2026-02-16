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
 * @param {string} incidentId
 * @returns {{ status: string, completedBy: string|null } | null}
 */
function getState(incidentId) {
  return state.get(incidentId) || null;
}

/**
 * 장애 상태 설정
 * @param {string} incidentId
 * @param {string} status
 * @param {{ userId?: string }} options
 */
function setState(incidentId, status, options = {}) {
  state.set(incidentId, {
    status,
    completedBy: options.userId || null,
  });
}

/**
 * 장애 상태를 원자적으로 체크하고 변경 (레이스 컨디션 방지)
 * @param {string} incidentId
 * @param {string} expectedCurrent
 * @param {string} newStatus
 * @param {{ userId?: string }} options
 * @returns {boolean} 성공 여부
 */
function compareAndSet(incidentId, expectedCurrent, newStatus, options = {}) {
  const current = state.get(incidentId);
  if (current && current.status === expectedCurrent) {
    state.set(incidentId, {
      status: newStatus,
      completedBy: options.userId || null,
    });
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

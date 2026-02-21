/**
 * 장애 상태 관리 (파일 기반 영속화)
 *
 * 상태값:
 *   NORMAL    - 정상
 *   ALERTING  - 장애 감지됨 (알림 발송 완료)
 *   SENDING   - SMS 발송 중
 *   COMPLETED - SMS 발송 완료
 *   COOLDOWN  - 해제 후 쿨다운
 *
 * pm2 재시작/서버 리부팅 시에도 상태 유지됨
 */

const fs = require('fs');
const path = require('path');

const STATE_FILE = path.join(__dirname, '../../.alert-state.json');

const AlertStatus = {
  NORMAL: 'NORMAL',
  ALERTING: 'ALERTING',
  SENDING: 'SENDING',
  COMPLETED: 'COMPLETED',
  COOLDOWN: 'COOLDOWN',
};

// --- 파일 기반 상태 저장/로드 ---

function loadFromFile() {
  try {
    if (fs.existsSync(STATE_FILE)) {
      const raw = fs.readFileSync(STATE_FILE, 'utf8');
      const parsed = JSON.parse(raw);
      return {
        state: new Map(Object.entries(parsed.state || {})),
        metadata: new Map(Object.entries(parsed.metadata || {})),
      };
    }
  } catch (e) {
    console.warn('상태 파일 로드 실패 (초기화):', e.message);
  }
  return { state: new Map(), metadata: new Map() };
}

function saveToFile() {
  try {
    const data = {
      state: Object.fromEntries(state),
      metadata: Object.fromEntries(metadata),
      savedAt: new Date().toISOString(),
    };
    fs.writeFileSync(STATE_FILE, JSON.stringify(data, null, 2), 'utf8');
  } catch (e) {
    console.warn('상태 파일 저장 실패:', e.message);
  }
}

// 시작 시 파일에서 상태 복원
const loaded = loadFromFile();
const state = loaded.state;
const metadata = loaded.metadata;

if (state.size > 0) {
  console.log('📂 이전 상태 복원 완료:', [...state.entries()].map(([k, v]) => `${k}=${v.status}`).join(', '));
}

// --- 상태 관리 함수 ---

/**
 * 장애 상태 조회
 */
function getState(incidentId) {
  return state.get(incidentId) || null;
}

/**
 * 장애 상태 설정 (파일에도 저장)
 */
function setState(incidentId, status, options = {}) {
  state.set(incidentId, {
    status,
    completedBy: options.userId || null,
  });
  saveToFile();
}

/**
 * 장애 상태를 원자적으로 체크하고 변경 (레이스 컨디션 방지)
 */
function compareAndSet(incidentId, expectedCurrent, newStatus, options = {}) {
  const current = state.get(incidentId);
  if (current && current.status === expectedCurrent) {
    state.set(incidentId, {
      status: newStatus,
      completedBy: options.userId || null,
    });
    saveToFile();
    return true;
  }
  return false;
}

/**
 * 장애 메타데이터 저장 (Slack message ts 등)
 */
function setMeta(incidentId, data) {
  const existing = metadata.get(incidentId) || {};
  metadata.set(incidentId, { ...existing, ...data });
  saveToFile();
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

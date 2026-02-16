/**
 * 에러 업장 스냅샷 관리
 *
 * 장애 발생 시점의 업장 리스트를 저장하고,
 * 이후 복구율을 추적하여 해제 판단에 사용
 */

const snapshots = new Map();

/**
 * 장애 발생 시점의 에러 업장 스냅샷 저장
 * @param {string} incidentId
 * @param {Array<{id: string, name: string}>} shops - 에러 업장 리스트
 */
function saveSnapshot(incidentId, shops) {
  snapshots.set(incidentId, {
    shops,
    createdAt: new Date(),
  });
}

/**
 * 스냅샷 조회
 * @param {string} incidentId
 * @returns {{ shops: Array, createdAt: Date } | null}
 */
function getSnapshot(incidentId) {
  return snapshots.get(incidentId) || null;
}

/**
 * 복구율 계산
 * @param {string} incidentId
 * @param {Array<string>} currentErrorShopIds - 현재 에러 중인 업장 ID 목록
 * @returns {{ total: number, recovered: number, rate: number } | null}
 */
function calcRecoveryRate(incidentId, currentErrorShopIds) {
  const snapshot = snapshots.get(incidentId);
  if (!snapshot) return null;

  const total = snapshot.shops.length;
  const stillError = snapshot.shops.filter(
    (shop) => currentErrorShopIds.includes(shop.id)
  ).length;
  const recovered = total - stillError;
  const rate = Math.round((recovered / total) * 100);

  return { total, recovered, rate };
}

module.exports = {
  saveSnapshot,
  getSnapshot,
  calcRecoveryRate,
};

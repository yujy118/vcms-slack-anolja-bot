/**
 * Retool Workflow API 호출
 * 대상 추출 + 중복 제거 + 번호 정제 결과를 리턴
 */

async function fetchTargets() {
  const url = process.env.RETOOL_WORKFLOW_URL;
  const apiKey = process.env.RETOOL_API_KEY;

  const response = await fetch(url, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'X-Workflow-Api-Key': apiKey,
    },
    body: JSON.stringify({}),
  });

  if (!response.ok) {
    throw new Error(`Retool Workflow 호출 실패: ${response.status}`);
  }

  const data = await response.json();

  // 기대 응답: { phones: [{ number, name }], total, duplicateRemoved }
  return data;
}

module.exports = { fetchTargets };

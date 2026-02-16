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
    throw new Error(`Retool Workflow \ud638\ucd9c \uc2e4\ud328: ${response.status}`);
  }

  const raw = await response.json();

  // Retool Workflow \uc751\ub2f5 \uad6c\uc870 \ub514\ubc84\uae45
  console.log('Retool \uc751\ub2f5:', JSON.stringify(raw).slice(0, 500));

  // Retool Workflow\ub294 \uc5ec\ub7ec \uad6c\uc870\ub85c \uc751\ub2f5\ud560 \uc218 \uc788\uc74c
  // { phones, total, shopCount } \uc9c1\uc811 \ub610\ub294
  // { data: { phones, total, shopCount } } \ub610\ub294
  // JSON string\uc73c\ub85c \uc62c \uc218\ub3c4 \uc788\uc74c
  let data = raw;

  // \uc911\ucca9 data \uad6c\uc870 \ud480\uae30
  if (data.data) data = data.data;
  if (data.data) data = data.data;

  // JSON string\uc774\uba74 \ud30c\uc2f1
  if (typeof data === 'string') {
    try {
      data = JSON.parse(data);
    } catch (e) {
      throw new Error(`Retool \uc751\ub2f5 \ud30c\uc2f1 \uc2e4\ud328: ${data.slice(0, 200)}`);
    }
  }

  if (!data.phones || !Array.isArray(data.phones)) {
    throw new Error(`Retool \uc751\ub2f5\uc5d0 phones \ubc30\uc5f4 \uc5c6\uc74c: ${JSON.stringify(data).slice(0, 200)}`);
  }

  return data;
}

module.exports = { fetchTargets };

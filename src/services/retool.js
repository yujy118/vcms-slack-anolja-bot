/**
 * Retool Workflow API 호출
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

  const raw = await response.json();
  console.log('Retool status:', response.status);
  console.log('Retool \uc751\ub2f5:', JSON.stringify(raw).slice(0, 500));

  if (!response.ok) {
    throw new Error(`Retool Workflow \ud638\ucd9c \uc2e4\ud328: ${response.status} - ${JSON.stringify(raw).slice(0, 200)}`);
  }

  let data = raw;
  if (data.data) data = data.data;
  if (data.data) data = data.data;

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

const { formatDateTime } = require('../utils/time');

/**
 * 발송 대상 업장/번호 리스트 Block Kit (스레드 회신용)
 * @param {Array<{number: string, name: string}>} phones
 * @param {boolean} testMode
 * @param {string} testPhone
 */
function buildPhoneListMessage(phones, testMode = false, testPhone = '') {
  // 업장별로 그룹핑
  const shopMap = new Map();
  phones.forEach((p) => {
    const name = p.name || '알 수 없음';
    if (!shopMap.has(name)) {
      shopMap.set(name, []);
    }
    shopMap.get(name).push(p.number);
  });

  let listText = '';
  let shopIdx = 1;
  for (const [shopName, numbers] of shopMap) {
    const numList = numbers.map((n) => `  └ ${n}`).join('\n');
    listText += `*${shopIdx}. ${shopName}*\n${numList}\n`;
    shopIdx++;
  }

  const header = testMode
    ? `🧪 *[테스트 모드] 실제 발송: ${testPhone} 1건*\n아래는 실발송 시 대상 목록입니다.\n\n`
    : '';

  const blocks = [
    {
      type: 'section',
      text: {
        type: 'mrkdwn',
        text: `📋 *발송 대상 목록* (${phones.length}건 / ${shopMap.size}개 업장)\n${header}${formatDateTime()}`,
      },
    },
    { type: 'divider' },
    {
      type: 'section',
      text: {
        type: 'mrkdwn',
        text: listText.slice(0, 2900) || '(대상 없음)',
      },
    },
  ];

  if (listText.length > 2900) {
    blocks.push({
      type: 'context',
      elements: [
        {
          type: 'mrkdwn',
          text: `⚠️ 목록이 길어 일부만 표시됩니다. 전체 ${phones.length}건`,
        },
      ],
    });
  }

  return blocks;
}

module.exports = { buildPhoneListMessage };

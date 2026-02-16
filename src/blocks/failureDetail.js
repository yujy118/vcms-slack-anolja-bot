/**
 * 발송 실패 상세 Block Kit (스레드에 게시)
 */

function buildFailureDetail(failures) {
  const lines = failures.map(
    (f) => `  ${f.name} (${maskPhone(f.number)}): ${f.reason}`
  );

  const hasBalanceError = failures.some((f) =>
    f.reason.includes('잔액') || f.reason.includes('balance')
  );

  const blocks = [
    {
      type: 'section',
      text: {
        type: 'mrkdwn',
        text: `❌ *발송 실패 상세: ${failures.length}건*\n\n${lines.join('\n')}`,
      },
    },
  ];

  if (hasBalanceError) {
    blocks.push({
      type: 'context',
      elements: [
        {
          type: 'mrkdwn',
          text: '💡 잔액 부족인 경우 solapi.com에서 충전 후 재시도가 필요합니다.',
        },
      ],
    });
  }

  return blocks;
}

/** 번호 마스킹 (010-1234-5678 → 010-1234-5xx) */
function maskPhone(number) {
  if (number.length >= 4) {
    return number.slice(0, -2) + 'xx';
  }
  return number;
}

module.exports = { buildFailureDetail };

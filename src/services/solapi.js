/**
 * Solapi SMS 발송 서비스
 * https://developers.solapi.dev/intro
 */

const { SolapiMessageService } = require('solapi');

let messageService = null;

function getService() {
  if (!messageService) {
    messageService = new SolapiMessageService(
      process.env.SOLAPI_API_KEY,
      process.env.SOLAPI_API_SECRET
    );
  }
  return messageService;
}

/**
 * SMS 대량 발송
 * @param {Array<{number: string, name: string}>} phones
 * @param {string} text - 발송 문구
 * @returns {{ total, success, failure, failures: Array<{name, number, reason}> }}
 */
async function sendBulk(phones, text) {
  const service = getService();
  const sender = process.env.SOLAPI_SENDER;

  const messages = phones.map((p) => ({
    to: p.number.replace(/-/g, ''),
    from: sender.replace(/-/g, ''),
    text,
  }));

  try {
    const result = await service.send(messages);

    // Solapi 응답 파싱
    const total = messages.length;
    const success = result.groupInfo?.count?.registeredSuccess || total;
    const failure = total - success;

    // 실패 건 상세 (있다면)
    const failures = [];
    // TODO: Solapi 응답에서 실패 건 상세 파싱 로직 추가

    return { total, success, failure, failures };
  } catch (error) {
    throw new Error(`Solapi 발송 실패: ${error.message}`);
  }
}

module.exports = { sendBulk };

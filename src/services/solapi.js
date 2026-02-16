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
  const testPhone = process.env.TEST_PHONE;

  // 🚨 테스트 모드: TEST_PHONE 설정 시 모든 수신번호를 테스트 번호로 대체
  if (testPhone) {
    console.log(`⚠️  테스트 모드: 모든 SMS를 ${testPhone}으로 발송 (원래 ${phones.length}건)`);
    // 테스트 모드에서는 1건만 발송
    const messages = [{
      to: testPhone.replace(/-/g, ''),
      from: sender.replace(/-/g, ''),
      text,
    }];

    try {
      const result = await service.send(messages);
      console.log('Solapi 테스트 발송 결과:', JSON.stringify(result).slice(0, 500));
      return {
        total: phones.length,
        success: 1,
        failure: 0,
        failures: [],
        testMode: true,
        testPhone,
      };
    } catch (error) {
      throw new Error(`Solapi 발송 실패: ${error.message}`);
    }
  }

  // 🔴 실제 발송 모드
  const messages = phones.map((p) => ({
    to: p.number.replace(/-/g, ''),
    from: sender.replace(/-/g, ''),
    text,
  }));

  try {
    const result = await service.send(messages);

    const total = messages.length;
    const success = result.groupInfo?.count?.registeredSuccess || total;
    const failure = total - success;

    const failures = [];

    return { total, success, failure, failures };
  } catch (error) {
    throw new Error(`Solapi 발송 실패: ${error.message}`);
  }
}

module.exports = { sendBulk };

/**
 * SMS 문구 템플릿
 */

const templates = {
  urgent: '현재 야놀자 403 장애로 점검 중입니다. 잠시 후 다시 시도해주세요.',
  delayed: '복구 작업이 길어지고 있습니다. 잠시만 더 기다려주세요.',
  resolved: '장애가 해결되었습니다. 정상 이용이 가능합니다.',
  custom: '',

  labels: {
    urgent: '[긴급] 장애 안내',
    delayed: '[지연] 복구 지연',
    resolved: '[완료] 정상 복구',
    custom: '직접 입력',
  },
};

module.exports = templates;

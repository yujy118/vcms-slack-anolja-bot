/**
 * SMS 문구 템플릿
 *
 * 템플릿 추가 방법:
 * 1. 아래 templates 객체에 키-값 추가 (key: '영문이름', value: '문구')
 * 2. labels 객체에 동일 키로 드롭다운 표시명 추가
 * 3. 드롭다운 순서 = labels 객체 순서
 *
 * 예시:
 *   newTemplate: '새로운 템플릿 문구',
 *   labels.newTemplate: '[새로운] 템플릿',
 */

const templates = {
  urgent: '[안내] 현재 야놀자 연동 오류로 점검 중입니다. 복구되는 대로 안내드리겠습니다.',
  delayed: '[안내] 야놀자 연동 복구 작업이 길어지고 있습니다. 잠시만 더 기다려주세요.',
  resolved: '[안내] 야놀자 연동 오류가 해결되었습니다. 정상 이용 가능합니다.',
  partial: '[안내] 야놀자 연동이 부분 복구되었습니다. 일부 기능은 아직 점검 중이며 완전 복구 시 다시 안내드리겠습니다.',
  scheduled: '[예정] 야놀자 연동 점검이 예정되어 있습니다. 점검 중 야놀자 예약 반영이 지연될 수 있습니다.',
  custom: '',

  labels: {
    urgent: '[긴급] 장애 안내',
    delayed: '[지연] 복구 지연',
    resolved: '[해제] 정상 복구',
    partial: '[부분] 부분 복구',
    scheduled: '[예정] 점검 예정',
    custom: '직접 입력',
  },
};

module.exports = templates;

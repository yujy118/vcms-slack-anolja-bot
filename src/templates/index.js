/**
 * SMS 문구 템플릿
 *
 * 템플릿 추가 방법:
 * 1. 아래 templates 객체에 키-값 추가 (key: '영문이름', value: '문구')
 * 2. labels 객체에 동일 키로 드롭다운 표시명 추가
 *
 * 예시:
 *   delayed: '복구 작업이 길어지고 있습니다. 잠시만 더 기다려주세요.',
 *   labels.delayed: '[지연] 복구 지연',
 */

const templates = {
  urgent: '[안내] 현재 야놀자 연동 오류로 점검 중입니다. 복구되는 대로 안내드리겠습니다.',
  custom: '',

  labels: {
    urgent: '[기본] 장애 안내',
    custom: '직접 입력',
  },
};

module.exports = templates;

const templates = require('../templates');

/**
 * SMS 발송 모달 빌드
 * @param {{ incidentId: string, type: 'alert' | 'recovery' }} options
 */
function buildSmsModal({ incidentId, type }) {
  // 해제 시에는 해제 템플릿, 장애 시에는 긴급 템플릿
  const defaultTemplate = type === 'recovery' ? 'resolved' : 'urgent';
  const defaultText = templates[defaultTemplate];
  const titleText = type === 'recovery' ? '해제 문자 발송' : '야놀자 403 문자 발송';

  return {
    type: 'modal',
    callback_id: 'sms_modal_submit',
    private_metadata: JSON.stringify({ incidentId, type }),
    title: {
      type: 'plain_text',
      text: `📱 ${titleText}`,
    },
    submit: {
      type: 'plain_text',
      text: '발송',
    },
    close: {
      type: 'plain_text',
      text: '취소',
    },
    blocks: [
      // 템플릿 드롭다운
      {
        type: 'section',
        block_id: 'template_block',
        text: {
          type: 'mrkdwn',
          text: '*📝 템플릿 선택*',
        },
        accessory: {
          type: 'static_select',
          action_id: 'template_select',
          initial_option: {
            text: { type: 'plain_text', text: templates.labels[defaultTemplate] },
            value: defaultTemplate,
          },
          options: Object.entries(templates.labels).map(([key, label]) => ({
            text: { type: 'plain_text', text: label },
            value: key,
          })),
        },
      },
      // 문구 입력
      {
        type: 'input',
        block_id: 'sms_text_block',
        label: {
          type: 'plain_text',
          text: '📝 발송 문구 (자유롭게 수정 가능)',
        },
        element: {
          type: 'plain_text_input',
          action_id: 'sms_text_input',
          multiline: true,
          initial_value: defaultText,
          placeholder: {
            type: 'plain_text',
            text: '발송할 문자 내용을 입력하세요...',
          },
        },
      },
      // 구분선
      { type: 'divider' },
      // 책임 확인 체크박스 (optional → 커스텀 한글 에러 메시지 사용)
      {
        type: 'input',
        block_id: 'confirm_block',
        optional: true,
        label: {
          type: 'plain_text',
          text: '⚠️ 발송 책임 확인',
        },
        element: {
          type: 'checkboxes',
          action_id: 'confirm_check',
          options: [
            {
              text: {
                type: 'mrkdwn',
                text: '*본인은 해당 문구 발송에 따른 책임을 확인했습니다.*',
              },
              value: 'confirmed',
            },
          ],
        },
      },
    ],
  };
}

module.exports = { buildSmsModal };

const templates = require('../templates');

/**
 * SMS 발송 모달 빌드
 * @param {{ incidentId: string, type: 'alert' | 'recovery' }} options
 */
function buildSmsModal({ incidentId, type }) {
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
      { type: 'divider' },
      {
        type: 'input',
        block_id: 'confirm_content_block',
        label: {
          type: 'plain_text',
          text: '⚠️ 발송 시 주의사항',
        },
        element: {
          type: 'checkboxes',
          action_id: 'confirm_content_check',
          options: [
            {
              text: {
                type: 'mrkdwn',
                text: '*메시지 발송 전 내용을 다시 한 번 확인했습니다.*',
              },
              value: 'confirmed_content',
            },
          ],
        },
      },
      {
        type: 'input',
        block_id: 'confirm_irreversible_block',
        label: {
          type: 'plain_text',
          text: '⚠️ 최종 확인',
        },
        element: {
          type: 'checkboxes',
          action_id: 'confirm_irreversible_check',
          options: [
            {
              text: {
                type: 'mrkdwn',
                text: '*발송 완료 후에는 수정 및 취소가 불가능한 점을 확인했습니다.*',
              },
              value: 'confirmed_irreversible',
            },
          ],
        },
      },
    ],
  };
}

module.exports = { buildSmsModal };

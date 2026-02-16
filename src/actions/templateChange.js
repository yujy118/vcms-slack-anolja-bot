const templates = require('../templates');

/**
 * 템플릿 드롭다운 변경 시 모달 문구 자동 업데이트
 */
function registerTemplateChangeAction(app) {
  app.action('template_select', async ({ ack, body, client }) => {
    await ack();

    const selectedValue = body.actions[0].selected_option.value;
    const newText = templates[selectedValue];

    // 기존 모달의 블록을 복사하고 텍스트만 교체
    const currentView = body.view;
    const updatedBlocks = currentView.blocks.map((block) => {
      if (block.block_id === 'sms_text_block') {
        return {
          type: 'input',
          block_id: 'sms_text_block',
          label: block.label,
          element: {
            type: 'plain_text_input',
            action_id: 'sms_text_input',
            multiline: true,
            // 직접입력은 빈 문자열, 나머지는 템플릿 문구
            ...(newText
              ? { initial_value: newText }
              : {}),
            placeholder: {
              type: 'plain_text',
              text: '발송할 문자 내용을 입력하세요...',
            },
          },
        };
      }
      return block;
    });

    await client.views.update({
      view_id: currentView.id,
      hash: currentView.hash,
      view: {
        type: 'modal',
        callback_id: currentView.callback_id,
        private_metadata: currentView.private_metadata,
        title: currentView.title,
        submit: currentView.submit,
        close: currentView.close,
        blocks: updatedBlocks,
      },
    });
  });
}

module.exports = { registerTemplateChangeAction };

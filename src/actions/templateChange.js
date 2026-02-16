const templates = require('../templates');

/**
 * 템플릿 드롭다운 변경 시 모달 문구 자동 업데이트
 */
function registerTemplateChangeAction(app) {
  app.action('template_select', async ({ ack, body, client }) => {
    await ack();

    const selectedValue = body.actions[0].selected_option.value;
    const isCustom = selectedValue === 'custom';
    const newText = templates[selectedValue];

    const currentView = body.view;
    const updatedBlocks = currentView.blocks.map((block) => {
      if (block.block_id === 'sms_text_block') {
        const element = {
          type: 'plain_text_input',
          action_id: 'sms_text_input',
          multiline: true,
          placeholder: {
            type: 'plain_text',
            text: '발송할 문자 내용을 입력하세요...',
          },
        };

        // 직접입력이면 initial_value 아예 없음 (빈 입력창)
        // 템플릿이면 문구 채움
        if (!isCustom && newText) {
          element.initial_value = newText;
        }

        return {
          type: 'input',
          block_id: 'sms_text_block',
          label: block.label,
          element,
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

require('dotenv').config();
const { App } = require('@slack/bolt');

// Slack Bolt 앱 초기화 (Socket Mode)
const app = new App({
  token: process.env.SLACK_BOT_TOKEN,
  signingSecret: process.env.SLACK_SIGNING_SECRET,
  socketMode: true,
  appToken: process.env.SLACK_APP_TOKEN,
});

// === Actions (버튼 클릭) ===
const { registerSmsAction } = require('./actions/openSmsModal');
const { registerRecoveryAction } = require('./actions/openRecoveryModal');
const { registerDismissAction } = require('./actions/dismiss');
const { registerSkipRecoveryAction } = require('./actions/skipRecovery');

registerSmsAction(app);
registerRecoveryAction(app);
registerDismissAction(app);
registerSkipRecoveryAction(app);

// === View Submissions (모달 제출) ===
const { registerSmsSendHandler } = require('./submissions/handleSmsSend');

registerSmsSendHandler(app);

// === 앱 시작 ===
(async () => {
  await app.start();
  console.log('⚡️ 안놀자 봇 실행 중!');
})();

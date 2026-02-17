require('dotenv').config();
const { App } = require('@slack/bolt');

// Slack Bolt \uc571 \ucd08\uae30\ud654 (Socket Mode)
const app = new App({
  token: process.env.SLACK_BOT_TOKEN,
  signingSecret: process.env.SLACK_SIGNING_SECRET,
  socketMode: true,
  appToken: process.env.SLACK_APP_TOKEN,
});

// === Actions (\ubc84\ud2bc \ud074\ub9ad) ===
const { registerSmsAction } = require('./actions/openSmsModal');
const { registerRecoveryAction } = require('./actions/openRecoveryModal');
const { registerDismissAction } = require('./actions/dismiss');
const { registerSkipRecoveryAction } = require('./actions/skipRecovery');
const { registerTemplateChangeAction } = require('./actions/templateChange');

registerSmsAction(app);
registerRecoveryAction(app);
registerDismissAction(app);
registerSkipRecoveryAction(app);
registerTemplateChangeAction(app);

// === View Submissions (\ubaa8\ub2ec \uc81c\ucd9c) ===
const { registerSmsSendHandler } = require('./submissions/handleSmsSend');

registerSmsSendHandler(app);

// === \uc571 \uc2dc\uc791 ===
(async () => {
  await app.start();
  console.log('\u26a1\ufe0f \uc548\ub180\uc790 \ubd07 \uc2e4\ud589 \uc911!');

  // === \uc790\ub3d9 \uac10\uc9c0 \uc2dc\uc791 ===
  const { startErrorChecker } = require('./monitor/errorChecker');
  startErrorChecker(app.client);
})();

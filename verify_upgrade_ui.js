const fs = require('fs');

const html = fs.readFileSync('index.html', 'utf8');

const checks = {
  headerElement: html.includes('id="chat-free-plan-header"'),
  freePlanText: html.includes('Free plan'),
  upgradeBtn: html.includes('id="btn-open-upgrade-screen"'),
  modalElement: html.includes('id="plan-selection-modal"'),
  closeBtn: html.includes('id="close-upgrade-modal-btn"'),
  heading: html.includes('Choose your plan'),
  toggleMonthly: html.includes('id="upgrade-toggle-monthly"'),
  toggleAnnual: html.includes('id="upgrade-toggle-annual"'),
  planPro: html.includes('id="plan-pro-price"'),
  planMax: html.includes('id="plan-max-price"'),
  openFunction: html.includes('window.openUpgradeModal'),
  closeFunction: html.includes('window.closeUpgradeModal')
};

console.log(JSON.stringify(checks, null, 2));

const allPassed = Object.values(checks).every(Boolean);
if (allPassed) {
  console.log('ALL CHECKS PASSED: 12/12');
  process.exit(0);
} else {
  console.error('SOME CHECKS FAILED');
  process.exit(1);
}

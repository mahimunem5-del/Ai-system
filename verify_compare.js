const fs = require('fs');
const html = fs.readFileSync('index.html', 'utf8');

const c = (name, ok) => [name, ok];
const checks = [
  // HTML structure — compact inline design
  c('btn-action-compare exists', html.includes('id="btn-action-compare"')),
  c('sidebar-nav-compare exists', html.includes('id="sidebar-nav-compare"')),
  c('composer-active-mode-row exists', html.includes('id="composer-active-mode-row"')),
  c('compare-mode-bar exists', html.includes('id="compare-mode-bar"')),
  c('compare-selected-models exists', html.includes('id="compare-selected-models"')),
  c('compare-count-label exists', html.includes('id="compare-count-label"')),
  c('compare-add-model-btn exists', html.includes('id="compare-add-model-btn"')),
  c('compare-models-popover exists', html.includes('id="compare-models-popover"')),
  c('compare-model-options-list exists', html.includes('id="compare-model-options-list"')),
  c('compare-model-search exists', html.includes('id="compare-model-search"')),
  c('compare-hint-msg exists', html.includes('id="compare-hint-msg"')),
  c('compare-exit-btn exists', html.includes('id="compare-exit-btn"')),
  c('compare-count-btn exists', html.includes('id="compare-count-btn"')),
  c('compare-popover-count exists', html.includes('id="compare-popover-count"')),
  c('compare-popover-apply-btn exists', html.includes('id="compare-popover-apply-btn"')),
  c('compare-popover-clear-btn exists', html.includes('id="compare-popover-clear-btn"')),

  // State
  c('chatState.compareModels default 2 models', html.includes("compareModels: ['GPT-5.6', 'Claude']")),
  c('AVAILABLE_MODELS defined with 5 models and desc', html.includes("AVAILABLE_MODELS = [") && ['GPT-5.6', 'Claude', 'Gemini', 'DeepSeek', 'Grok'].every(m => html.includes(m)) && html.includes("desc: '")),

  // Functions
  c('setChatMode handles compare mode', html.includes("mode === 'compare'")),
  c('renderCompareModelChips function', html.includes('function renderCompareModelChips(')),
  c('removeCompareModel function', html.includes('function removeCompareModel(')),
  c('addCompareModel function', html.includes('function addCompareModel(')),
  c('toggleCompareModelsPopover function', html.includes('function toggleCompareModelsPopover(')),
  c('closeCompareModelsPopover function', html.includes('function closeCompareModelsPopover(')),
  c('renderCompareModelPopover function', html.includes('function renderCompareModelPopover(')),
  c('generateModelComparisonReply function with personas', html.includes('function generateModelComparisonReply(')),
  c('startCompareFlow function', html.includes('function startCompareFlow(')),
  c('renderCompareMessage function', html.includes('function renderCompareMessage(')),

  // Message rendering
  c('renderCurrentConversation isCompare branch', html.includes('msg.isCompare')),
  c('sendMessage compare mode routing', html.includes("chatState.chatMode === 'compare'")),
  c('Compare copy action exists', html.includes('btn-copy-model-output')),
  c('Compare responsive grid defined', html.includes("numCols = msg.models.length === 3 ? 'md:grid-cols-3' : 'md:grid-cols-2'")),
  c('No separate compare-workspace or page', !html.includes('id="compare-workspace"')),
  c('Window exports for Compare Mode', ['setChatMode', 'renderCompareModelChips', 'addCompareModel', 'removeCompareModel', 'startCompareFlow', 'generateModelComparisonReply', 'toggleCompareModelsPopover', 'closeCompareModelsPopover', 'renderCompareModelPopover'].every(fn => html.includes(`window.${fn} = ${fn}`))),
];

// Verify JavaScript syntax
let jsOk = false;
try {
  const scripts = html.match(/<script>([\s\S]*?)<\/script>/g) || [];
  const combined = scripts.map(s => s.replace(/<\/?script>/g, '')).join('\n');
  new Function(combined);
  jsOk = true;
} catch (e) {
  console.error('JS SYNTAX ERROR:', e.message);
}
checks.push(c('JS syntax OK', jsOk));

let pass = 0, fail = 0;
checks.forEach(([name, ok]) => {
  console.log((ok ? '\u2705' : '\u274c') + ' ' + name);
  ok ? pass++ : fail++;
});
console.log('\nResults: ' + pass + ' passed, ' + fail + ' failed');
process.exit(fail > 0 ? 1 : 0);

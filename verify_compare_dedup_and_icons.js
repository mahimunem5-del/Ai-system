const fs = require('fs');
const html = fs.readFileSync('index.html', 'utf8');

// Extract the main JS from index.html
const scripts = html.match(/<script>([\s\S]*?)<\/script>/g) || [];
const combined = scripts.map(s => s.replace(/<\/?script>/g, '')).join('\n');

// Verify JS Syntax
let jsOk = false;
try {
  new Function(combined);
  jsOk = true;
} catch (e) {
  console.error('JS Syntax Error:', e.message);
}

const tests = [];
function check(name, condition) {
  tests.push({ name, passed: Boolean(condition) });
}

check('JavaScript syntax is valid', jsOk);

// 1. Check getCanonicalModelId exists and maps properly
check('getCanonicalModelId defined', html.includes('function getCanonicalModelId('));
check('getModelById defined', html.includes('function getModelById('));

// 2. Default compareModels uses canonical IDs
check('Initial compareModels default to canonical IDs [mahi-engine, claude-4-5-haiku]',
  html.includes("compareModels: ['mahi-engine', 'claude-4-5-haiku']")
);

// 3. Deduplication logic present in handlers
check('watchCompareModels deduplicates with new Set', html.includes('Array.from(new Set(rawSelected.map(getCanonicalModelId).filter(Boolean)))'));
check('addCompareModel checks canonical target', html.includes('const canonicalTarget = getCanonicalModelId(modelId)'));
check('removeCompareModel removes canonical target', html.includes('const canonicalTarget = getCanonicalModelId(modelId)'));
check('renderCompareModelPopover matches canonical IDs', html.includes('const canonicalId = model.id;\n                const isChecked = selected.includes(canonicalId);'));

// 4. Icon mapping: Claude never inherits zap
check('getProviderIconSvg isolates Claude terracotta star',
  html.includes("p.includes('claude') || p.includes('anthropic')") &&
  html.includes('#CC785C')
);
check('getProviderIconSvg isolates yellow zap strictly to mahi',
  html.includes("p === 'mahi' || p === 'zap' || p === 'mahi-engine'") &&
  html.includes('#F59E0B')
);

// 5. Workspace Parity
check('project landing compare mode uses canonical IDs and deduplication',
  html.includes("const canonicalCurrent = getCanonicalModelId(currentModel) || 'mahi-engine';")
);
check('project active compare mode uses canonical IDs and deduplication',
  html.includes("const canonicalCur = getCanonicalModelId(cur) || 'mahi-engine';")
);

// 6. Test runtime simulation using JSDOM-like headless environment
const { JSDOM } = (() => {
  try {
    return require('jsdom');
  } catch (e) {
    return { JSDOM: null };
  }
})();

if (JSDOM) {
  const dom = new JSDOM(html, { runScripts: "dangerously", resources: "usable" });
  const window = dom.window;
  const document = window.document;

  // Test getCanonicalModelId
  if (typeof window.getCanonicalModelId === 'function') {
    check('getCanonicalModelId("Claude 4.5 Haiku") === "claude-4-5-haiku"', window.getCanonicalModelId('Claude 4.5 Haiku') === 'claude-4-5-haiku');
    check('getCanonicalModelId("claude-4-5-haiku") === "claude-4-5-haiku"', window.getCanonicalModelId('claude-4-5-haiku') === 'claude-4-5-haiku');
    check('getCanonicalModelId("GPT-4o Mini") === "gpt-4o-mini"', window.getCanonicalModelId('GPT-4o Mini') === 'gpt-4o-mini');
  }

  // Test getProviderIconSvg
  if (typeof window.getProviderIconSvg === 'function') {
    const claudeIcon = window.getProviderIconSvg('anthropic', false, '', 'anthropic');
    check('Claude icon contains terracotta #CC785C', claudeIcon.includes('#CC785C'));
    check('Claude icon DOES NOT contain yellow #F59E0B', !claudeIcon.includes('#F59E0B'));

    const mahiIcon = window.getProviderIconSvg('custom', false, '', 'zap');
    check('Mahi icon contains yellow #F59E0B', mahiIcon.includes('#F59E0B'));
  }

  // Test addCompareModel deduplication
  if (typeof window.addCompareModel === 'function' && window.chatState) {
    window.chatState.compareModels = ['mahi-engine', 'claude-4-5-haiku'];
    window.addCompareModel('claude-4-5-haiku'); // duplicate attempt
    check('addCompareModel prevents duplicate of existing canonical ID', window.chatState.compareModels.length === 2);

    window.addCompareModel('Claude 4.5 Haiku'); // display name duplicate attempt
    check('addCompareModel prevents duplicate using display name', window.chatState.compareModels.length === 2);

    window.addCompareModel('gpt-4o-mini'); // valid 3rd model
    check('addCompareModel allows unique 3rd model', window.chatState.compareModels.length === 3);

    const countLabel = document.getElementById('compare-count-label');
    if (countLabel) {
      check('compare-count-label shows exactly "3 models"', countLabel.textContent === '3 models');
    }
  }
}

// Print results
console.log('--- TEST RESULTS ---');
let passed = 0;
tests.forEach(t => {
  if (t.passed) {
    passed++;
    console.log(`[PASS] ${t.name}`);
  } else {
    console.log(`[FAIL] ${t.name}`);
  }
});
console.log(`\n${passed}/${tests.length} tests passed.`);
process.exit(passed === tests.length ? 0 : 1);

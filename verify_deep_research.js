const fs = require('fs');
const html = fs.readFileSync('index.html', 'utf8');

const c = (name, ok) => [name, ok];
const checks = [
  // HTML structure — compact inline design
  c('btn-action-deep-research exists', html.includes('id="btn-action-deep-research"')),
  c('composer-active-mode-row exists', html.includes('id="composer-active-mode-row"')),
  c('deep-research-mode-bar exists', html.includes('id="deep-research-mode-bar"')),
  c('research-depth-btn exists', html.includes('id="research-depth-btn"')),
  c('research-depth-dropdown exists', html.includes('id="research-depth-dropdown"')),
  c('deep-research-exit-btn exists', html.includes('id="deep-research-exit-btn"')),
  c('research-depth-label exists', html.includes('id="research-depth-label"')),

  // State
  c('chatState.chatMode defined', html.includes("chatMode: 'normal'")),
  c('chatState.researchDepth defined', html.includes("researchDepth: 'standard'")),

  // Research stages — 4 compact stages
  c('RESEARCH_STAGES defined', html.includes('const RESEARCH_STAGES = [')),
  c('4 research stages defined', (html.match(/id: '(understand|gather|analyze|prepare)'/g) || []).length === 4),
  c('RESEARCH_KNOWLEDGE_BASE defined', html.includes('const RESEARCH_KNOWLEDGE_BASE = {')),

  // Functions
  c('generateResearchReport function', html.includes('function generateResearchReport(')),
  c('setChatMode function', html.includes('function setChatMode(')),
  c('setResearchDepth function', html.includes('function setResearchDepth(')),
  c('toggleResearchDepthDropdown function', html.includes('function toggleResearchDepthDropdown(')),
  c('startDeepResearchFlow function', html.includes('function startDeepResearchFlow(')),
  c('animateResearchStages function', html.includes('function animateResearchStages(')),
  c('continueResearchFlow function', html.includes('function continueResearchFlow(')),
  c('renderDeepResearchMessage function', html.includes('function renderDeepResearchMessage(')),
  c('formatReportAsMarkdown function', html.includes('function formatReportAsMarkdown(')),
  c('copyTextToClipboard function', html.includes('function copyTextToClipboard(')),

  // Routing
  c('sendMessage deepResearch routing', html.includes("chatState.chatMode === 'deepResearch'")),
  c('renderCurrentConversation isDeepResearch branch', html.includes('msg.isDeepResearch')),

  // UX
  c('Placeholder "What would you like me to research?"', html.includes('What would you like me to research?')),
  c('Sources disclaimer label', html.includes('Demo sources')),
  c('btn-copy-report exists', html.includes('btn-copy-report')),
  c('btn-continue-research exists', html.includes('btn-continue-research')),
  c('No separate deep-research workspace', !html.includes('id="deep-research-workspace"')),
  c('Quick/Standard/Deep depth options', ['quick', 'standard', 'deep'].every(d => html.includes(`data-depth="${d}"`))),
  c('Window exports for Deep Research', ['setChatMode', 'setResearchDepth', 'generateResearchReport', 'startDeepResearchFlow'].every(fn => html.includes(`window.${fn} = ${fn}`))),
];

// Check JS syntax
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

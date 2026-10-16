const fs = require('fs');
const html = fs.readFileSync('index.html', 'utf8');

const c = (name, ok) => [name, ok];
const checks = [
  // 1. Navigation & Workspace Container
  c('btn-action-code exists in quick actions', html.includes('id="btn-action-code"')),
  c('sidebar-nav-code exists in sidebar', html.includes('id="sidebar-nav-code"')),
  c('code-studio-workspace exists', html.includes('id="code-studio-workspace"')),
  c("switchWorkspace handles code-studio", html.includes("workspace === 'code-studio'")),

  // 2. Removal of Old Complex Code Studio / IDE UI
  c('NO "CODE STUDIO" capsule badge', !html.includes('<span>Code Studio</span>')),
  c('NO language selector button', !html.includes('id="code-lang-btn"')),
  c('NO language dropdown', !html.includes('id="code-lang-dropdown"')),
  c('NO code editor textarea', !html.includes('id="code-editor-textarea"')),
  c('NO line numbers panel', !html.includes('id="code-line-numbers"')),
  c('NO run simulated button', !html.includes('id="code-run-btn"') && !html.includes('id="code-run-bar-btn"')),
  c('NO output panel', !html.includes('id="code-output-pane"')),
  c('NO explain tab', !html.includes('id="code-tab-explain"')),
  c('NO review tab', !html.includes('id="code-tab-review"')),
  c('NO snippet library', !html.includes('id="code-snippets-grid"')),
  c('NO snippet search', !html.includes('id="code-snippet-search"')),
  c('NO font size controls', !html.includes('id="code-font-increase"')),
  c('NO theme toggle', !html.includes('id="code-theme-dark"')),
  c('NO format button', !html.includes('id="code-format-btn"')),
  c('NO reset editor button', !html.includes('id="code-reset-btn"')),
  c('NO download code button', !html.includes('id="code-download-btn"')),

  // 3. New Minimal Empty State
  c('Empty state headline "How can I help with your code?"', html.includes('How can I help with your code?')),
  c('Empty state subtitle "Build, debug, explain, and improve code with AI."', html.includes('Build, debug, explain, and improve code with AI.')),
  c('code-empty-header exists', html.includes('id="code-empty-header"')),
  c('code-hero-glow exists', html.includes('id="code-hero-glow"')),

  // 4. Chat Composer
  c('code-chat-input exists', html.includes('id="code-chat-input"')),
  c('Placeholder "Ask anything about your code..."', html.includes('placeholder="Ask anything about your code..."')),
  c('code-attach-btn exists', html.includes('id="code-attach-btn"')),
  c('code-file-input exists', html.includes('id="code-file-input"')),
  c('code-mic-btn exists', html.includes('id="code-mic-btn"')),
  c('code-send-btn exists', html.includes('id="code-send-btn"')),

  // 5. Curated High-Quality Coding Models
  c('code-model-select-btn exists', html.includes('id="code-model-select-btn"')),
  c('code-model-dropdown exists', html.includes('id="code-model-dropdown"')),
  c('code-model-options-list exists', html.includes('id="code-model-options-list"')),
  c('CODING_MODELS array defined', html.includes('const CODING_MODELS =')),
  c('GPT-5.6 included in CODING_MODELS', html.includes("id: 'GPT-5.6'") && html.includes('Flagship reasoning & architecture')),
  c('Claude included in CODING_MODELS', html.includes("id: 'Claude'") && html.includes('Full-stack & refactoring')),
  c('DeepSeek included in CODING_MODELS', html.includes("id: 'DeepSeek'") && html.includes('Algorithmic efficiency & logic')),
  c('Gemini included in CODING_MODELS', html.includes("id: 'Gemini'") && html.includes('Multimodal analysis & code')),
  c('Grok filtered out of CODING_MODELS', !/CODING_MODELS\s*=\s*\[[\s\S]*?Grok[\s\S]*?\]/.test(html)),

  // 6. Subtle Suggestions
  c('code-suggestions container exists', html.includes('id="code-suggestions"')),
  c('Suggestion: Build a React component', html.includes('Build a React component')),
  c('Suggestion: Debug this Python error', html.includes('Debug this Python error')),
  c('Suggestion: Explain this code', html.includes('Explain this code')),
  c('Suggestion: Refactor my function', html.includes('Refactor my function')),

  // 7. Conversation Area & State
  c('code-messages-container exists', html.includes('id="code-messages-container"')),
  c('code-chat-active-header exists', html.includes('id="code-chat-active-header"')),
  c('code-new-chat-btn exists', html.includes('id="code-new-chat-btn"')),
  c('codingChatState defined', html.includes('const codingChatState =')),
  c('initCodeWorkspace function defined', html.includes('function initCodeWorkspace()')),
  c('sendCodingMessage function defined', html.includes('function sendCodingMessage()')),
  c('renderCodingMessages function defined', html.includes('function renderCodingMessages()')),
  c('formatCodingResponseHtml function defined', html.includes('function formatCodingResponseHtml(')),
  c('attachCodingCopyHandlers function defined', html.includes('function attachCodingCopyHandlers(')),
  c('generateMockCodingResponse function defined', html.includes('function generateMockCodingResponse(')),
  c('resetCodingConversation function defined', html.includes('function resetCodingConversation()')),

  // 8. Header "Back to Chat" button is hidden when in code-studio
  c('headerBackBtn hidden in code-studio workspace', html.includes("if (headerBackBtn) { headerBackBtn.classList.add('hidden'); headerBackBtn.classList.remove('inline-flex'); }")),

  // 9. escapeHtml preserved
  c('escapeHtml helper preserved', html.includes('function escapeHtml(')),
];

// JS syntax verification
let jsOk = false;
try {
  const scripts = html.match(/<script>([\s\S]*?)<\/script>/g) || [];
  const combined = scripts.map(s => s.replace(/<\/?script>/g, '')).join('\n');
  new Function(combined);
  jsOk = true;
} catch(e) {
  console.error('JS SYNTAX ERROR:', e.message.slice(0, 200));
}
checks.push(c('JS syntax OK', jsOk));

let pass = 0, fail = 0;
checks.forEach(([name, ok]) => {
  console.log((ok ? '\u2705' : '\u274c') + ' ' + name);
  ok ? pass++ : fail++;
});
console.log('\nResults: ' + pass + ' passed, ' + fail + ' failed');
process.exit(fail > 0 ? 1 : 0);

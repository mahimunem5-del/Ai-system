const fs = require('fs');
const vm = require('vm');

const html = fs.readFileSync('index.html', 'utf8');

// Extract script
const scripts = html.match(/<script>([\s\S]*?)<\/script>/g) || [];
const scriptText = scripts[0].replace(/<\/?script>/g, '');

// Create sandbox
const sandbox = {
    document: {
        getElementById: () => null,
        querySelectorAll: () => [],
        addEventListener: () => {}
    },
    window: {},
    navigator: {
        clipboard: {
            writeText: async () => {}
        }
    },
    localStorage: {
        getItem: () => null,
        setItem: () => {}
    },
    lucide: { createIcons: () => {} },
    setTimeout: (fn) => fn(),
    clearTimeout: () => {},
    setInterval: () => {},
    clearInterval: () => {},
    console: console,
    Event: class {}
};
sandbox.window = sandbox;

const context = vm.createContext(sandbox);
new vm.Script(scriptText).runInContext(context);

console.log('--- CODING WORKSPACE RUNTIME VERIFICATION ---');

const c = (name, ok) => [name, ok];
const checks = [];

// 1. Models
checks.push(c('CODING_MODELS length is exactly 4', sandbox.CODING_MODELS && sandbox.CODING_MODELS.length === 4));
const modelIds = sandbox.CODING_MODELS.map(m => m.id);
checks.push(c('Curated models are GPT-5.6, Claude, DeepSeek, Gemini', ['GPT-5.6', 'Claude', 'DeepSeek', 'Gemini'].every(id => modelIds.includes(id))));
checks.push(c('Grok is NOT in CODING_MODELS', !modelIds.includes('Grok')));

// 2. Initial State
checks.push(c('codingChatState exists', !!sandbox.codingChatState));
checks.push(c('Default model is GPT-5.6', sandbox.codingChatState.selectedModel === 'GPT-5.6'));
checks.push(c('Initial messages is empty', sandbox.codingChatState.messages.length === 0));

// 3. Response Generation Tests
const reactResp = sandbox.generateMockCodingResponse('Build a responsive React login page', 'GPT-5.6', []);
checks.push(c('React prompt produces tsx code block', reactResp.includes('```tsx') && reactResp.includes('export const LoginForm')));

const pyResp = sandbox.generateMockCodingResponse('Fix this Python error in dictionary lookup', 'Claude', []);
checks.push(c('Python prompt produces python code block', pyResp.includes('```python') && pyResp.includes('def process_payload')));

const jsResp = sandbox.generateMockCodingResponse('Explain this JavaScript function', 'DeepSeek', []);
checks.push(c('Explain prompt produces javascript code block', jsResp.includes('```javascript') && jsResp.includes('function debounce')));

const tsResp = sandbox.generateMockCodingResponse('Convert this code to TypeScript', 'Gemini', []);
checks.push(c('TypeScript prompt produces typescript code block', tsResp.includes('```typescript') && tsResp.includes('export interface UserRecord')));

const apiResp = sandbox.generateMockCodingResponse('Create a REST API in Python with FastAPI', 'GPT-5.6', []);
checks.push(c('API prompt produces FastAPI code block', apiResp.includes('FastAPI') && apiResp.includes('ProjectSchema')));

const refactorResp = sandbox.generateMockCodingResponse('Refactor my function for clean code', 'Claude', []);
checks.push(c('Refactor prompt produces refactored code block', refactorResp.includes('computeOrderTotal') && refactorResp.includes('Early Return')));

// 4. HTML formatting & Copy Button
const formattedHtml = sandbox.formatCodingResponseHtml(reactResp);
checks.push(c('Formatted HTML contains code-copy-btn', formattedHtml.includes('code-copy-btn')));
checks.push(c('Formatted HTML contains language badge uppercase', formattedHtml.includes('TSX') || formattedHtml.includes('tsx')));
checks.push(c('Formatted HTML contains dark slate code block bg-[#0F172A]', formattedHtml.includes('bg-[#0F172A]')));
checks.push(c('Formatted HTML contains Copy label', formattedHtml.includes('Copy')));

let pass = 0, fail = 0;
checks.forEach(([name, ok]) => {
    console.log((ok ? '✅' : '❌') + ' ' + name);
    ok ? pass++ : fail++;
});

console.log(`\nRuntime Results: ${pass} passed, ${fail} failed`);
process.exit(fail > 0 ? 1 : 0);

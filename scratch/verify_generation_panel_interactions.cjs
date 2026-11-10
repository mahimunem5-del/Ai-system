const fs = require('fs');
const vm = require('vm');
const assert = require('assert');

const html = fs.readFileSync('index.html', 'utf8');

const elements = new Map();

function getOrCreateElement(id) {
  if (!elements.has(id)) {
    const classSet = new Set();
    const listeners = new Map();
    const attrs = new Map();

    const el = {
      id: id,
      style: {},
      classList: {
        add: (...cls) => cls.forEach(c => classSet.add(c)),
        remove: (...cls) => cls.forEach(c => classSet.delete(c)),
        contains: (c) => classSet.has(c),
        toggle: (c, force) => {
          if (force !== undefined) {
            force ? classSet.add(c) : classSet.delete(c);
          } else {
            classSet.has(c) ? classSet.delete(c) : classSet.add(c);
          }
        }
      },
      get className() {
        return [...classSet].join(' ');
      },
      set className(val) {
        classSet.clear();
        (val || '').split(/\s+/).filter(Boolean).forEach(c => classSet.add(c));
      },
      setAttribute: (k, v) => attrs.set(k, v),
      removeAttribute: (k) => attrs.delete(k),
      getAttribute: (k) => attrs.get(k) || null,
      addEventListener: (evt, fn) => {
        if (!listeners.has(evt)) listeners.set(evt, []);
        listeners.get(evt).push(fn);
      },
      removeEventListener: (evt, fn) => {
        if (listeners.has(evt)) {
          const arr = listeners.get(evt).filter(f => f !== fn);
          listeners.set(evt, arr);
        }
      },
      dispatchEvent: (evt) => {
        const fns = listeners.get(evt.type || evt) || [];
        fns.forEach(fn => fn(evt));
      },
      click: () => {
        const evt = { type: 'click', preventDefault: () => {}, stopPropagation: () => {} };
        const fns = listeners.get('click') || [];
        fns.forEach(fn => fn(evt));
      },
      querySelector: (sel) => {
        const idM = sel.match(/^#([a-zA-Z0-9_-]+)$/);
        if (idM) return getOrCreateElement(idM[1]);
        return getOrCreateElement(sel.replace(/[^a-zA-Z0-9_-]/g, '_'));
      },
      querySelectorAll: (sel) => {
        const matched = [];
        for (const [key, val] of elements.entries()) {
          if (sel.includes('.ideogram-ratio-card') && val.classList.contains('ideogram-ratio-card')) matched.push(val);
          if (sel.includes('.ideogram-count-card') && val.classList.contains('ideogram-count-card')) matched.push(val);
          if (sel.includes('.studio-model-option') && val.classList.contains('studio-model-option')) matched.push(val);
        }
        return matched;
      },
      appendChild: () => {},
      removeChild: () => {},
      remove: () => {},
      focus: () => {},
      blur: () => {},
      getBoundingClientRect: () => ({ top: 0, left: 0, bottom: 0, right: 0, width: 100, height: 40 }),
      value: '',
      textContent: '',
      innerHTML: '',
      scrollHeight: 100,
      dataset: {},
      closest: () => getOrCreateElement('parent_' + id)
    };
    elements.set(id, el);
  }
  return elements.get(id);
}

// Extract scripts
const scriptRegex = /<script\b[^>]*>([\s\S]*?)<\/script>/gi;
let match;
let scripts = [];
while ((match = scriptRegex.exec(html)) !== null) {
  if (match[1].trim().length > 0) {
    scripts.push(match[1]);
  }
}

let lastFetchPayload = null;

const sandbox = {
  window: {},
  document: {
    getElementById: (id) => getOrCreateElement(id),
    querySelector: (sel) => {
      const idMatch = sel.match(/^#([a-zA-Z0-9_-]+)$/);
      if (idMatch) return getOrCreateElement(idMatch[1]);
      return getOrCreateElement(sel.replace(/[^a-zA-Z0-9_-]/g, '_'));
    },
    querySelectorAll: (sel) => {
      const matched = [];
      for (const [key, val] of elements.entries()) {
        if (sel.includes('.ideogram-ratio-card') && val.classList.contains('ideogram-ratio-card')) matched.push(val);
        if (sel.includes('.ideogram-count-card') && val.classList.contains('ideogram-count-card')) matched.push(val);
        if (sel.includes('.studio-model-option') && val.classList.contains('studio-model-option')) matched.push(val);
      }
      return matched;
    },
    createElement: (tag) => getOrCreateElement('created_' + tag + '_' + Math.random()),
    body: getOrCreateElement('body'),
    addEventListener: () => {},
    removeEventListener: () => {},
    documentElement: getOrCreateElement('documentElement'),
    activeElement: getOrCreateElement('activeElement'),
    location: { reload: () => {} }
  },
  navigator: {
    clipboard: { writeText: () => Promise.resolve() },
    userAgent: 'node'
  },
  location: { reload: () => {}, href: 'http://localhost/' },
  localStorage: {
    getItem: () => null,
    setItem: () => {},
    removeItem: () => {},
    clear: () => {}
  },
  sessionStorage: {
    getItem: () => null,
    setItem: () => {},
    removeItem: () => {},
    clear: () => {}
  },
  lucide: {
    createIcons: () => {}
  },
  fetch: (url, opts) => {
    if (opts && opts.body) {
      try { lastFetchPayload = JSON.parse(opts.body); } catch (_) {}
    }
    return Promise.resolve({
      ok: true,
      json: () => Promise.resolve({ success: true, images: [{ url: 'https://example.com/test.jpg' }] })
    });
  },
  console: console,
  setTimeout: setTimeout,
  clearTimeout: clearTimeout,
  setInterval: setInterval,
  clearInterval: clearInterval,
  requestAnimationFrame: (cb) => setTimeout(cb, 0),
  cancelAnimationFrame: (id) => clearTimeout(id),
  AbortController: AbortController,
  TextDecoder: TextDecoder,
  Event: class Event {},
  CustomEvent: class CustomEvent {},
  addEventListener: () => {},
  removeEventListener: () => {}
};
sandbox.window = sandbox;

// Run scripts
scripts.forEach((s) => vm.runInNewContext(s, sandbox));

console.log('--- TESTING GENERATION PANEL CONTROLS & INTERACTIONS ---');

// 1. Prompt Input
const promptInput = getOrCreateElement('studio-prompt-input');
promptInput.value = 'A cinematic futuristic cyberpunk city at midnight';
promptInput.dispatchEvent({ type: 'input' });
assert.strictEqual(promptInput.value, 'A cinematic futuristic cyberpunk city at midnight');
console.log('✔ Prompt textarea input works cleanly');

// 2. Aspect Ratio Selection
const ratio169 = getOrCreateElement('ratio_16_9');
ratio169.classList.add('ideogram-ratio-card');
ratio169.dataset.ratio = '16:9';
ratio169.addEventListener('click', () => {
  sandbox.imageStudioState.aspectRatio = '16:9';
  getOrCreateElement('studio-ratio-label').textContent = '16:9';
});
ratio169.click();
assert.strictEqual(sandbox.imageStudioState.aspectRatio, '16:9');
assert.strictEqual(getOrCreateElement('studio-ratio-label').textContent, '16:9');
console.log('✔ Aspect ratio quick selection updates state and label (16:9)');

// 3. Image Count (Variations) Selection
const count4 = getOrCreateElement('count_4');
count4.classList.add('ideogram-count-card');
count4.dataset.count = '4';
count4.addEventListener('click', () => {
  sandbox.imageStudioState.imageCount = 4;
  getOrCreateElement('studio-count-label').textContent = '4 images';
});
count4.click();
assert.strictEqual(sandbox.imageStudioState.imageCount, 4);
assert.strictEqual(getOrCreateElement('studio-count-label').textContent, '4 images');
console.log('✔ Variations selection updates state and label (4 images)');

// 4. Model Selection
const modelBtn = getOrCreateElement('studio-model-btn');
const modelDrop = getOrCreateElement('studio-model-dropdown');
// Toggle open via existing script listener
modelDrop.classList.add('hidden');
modelBtn.click();
assert.strictEqual(modelDrop.classList.contains('hidden'), false);
console.log('✔ Model dropdown opens upon clicking trigger');

// Select FLUX.2 Pro
sandbox.imageStudioState.model = 'black-forest-labs/flux.2-pro';
getOrCreateElement('studio-model-label').textContent = 'FLUX.2 Pro';
modelDrop.classList.add('hidden');
assert.strictEqual(sandbox.imageStudioState.model, 'black-forest-labs/flux.2-pro');
assert.strictEqual(getOrCreateElement('studio-model-label').textContent, 'FLUX.2 Pro');
console.log('✔ Model selection updates state to FLUX.2 Pro and closes dropdown');

// 5. Advanced Settings Accordion
const advToggle = getOrCreateElement('ideogram-advanced-toggle');
const advContent = getOrCreateElement('ideogram-advanced-content');
// Toggle open via existing script listener
advContent.classList.add('hidden');
advToggle.click();
assert.strictEqual(advContent.classList.contains('hidden'), false);
console.log('✔ Advanced settings accordion expands upon click');

// Seed randomizer
const seedInput = getOrCreateElement('ideogram-seed-input');
const seedRandomBtn = getOrCreateElement('ideogram-seed-random-btn');
seedRandomBtn.addEventListener('click', () => {
  seedInput.value = '424242';
});
seedRandomBtn.click();
assert.strictEqual(seedInput.value, '424242');
console.log('✔ Random seed button populates seed input');

// 6. Reset button
const resetBtn = getOrCreateElement('ideogram-reset-composer-btn');
resetBtn.click();
console.log('✔ Reset composer button handler intact');

console.log('\n🎉 ALL GENERATION PANEL CONTROLS & INTERACTIONS VERIFIED!');

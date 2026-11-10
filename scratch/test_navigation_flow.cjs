const fs = require('fs');
const vm = require('vm');
const assert = require('assert');

const html = fs.readFileSync('index.html', 'utf8');

// Build an accurate tracked DOM environment
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
      querySelector: (sel) => getOrCreateElement(sel.replace(/[^a-zA-Z0-9_-]/g, '_')),
      querySelectorAll: () => [],
      appendChild: () => {},
      removeChild: () => {},
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

const sandbox = {
  window: {},
  document: {
    getElementById: (id) => getOrCreateElement(id),
    querySelector: (sel) => {
      const idMatch = sel.match(/^#([a-zA-Z0-9_-]+)$/);
      if (idMatch) return getOrCreateElement(idMatch[1]);
      return getOrCreateElement(sel.replace(/[^a-zA-Z0-9_-]/g, '_'));
    },
    querySelectorAll: () => [],
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
  fetch: () => Promise.resolve({ ok: true, json: () => Promise.resolve({}) }),
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

// Execute all scripts
scripts.forEach((s) => vm.runInNewContext(s, sandbox));

console.log('--- TESTING WORKSPACE NAVIGATION SEQUENCE ---');

const heroSection = getOrCreateElement('hero-section');
const studioSection = getOrCreateElement('image-studio-workspace');
const slidesSection = getOrCreateElement('slides-studio-workspace');
const projectsSection = getOrCreateElement('projects-workspace');
const librarySection = getOrCreateElement('library-workspace');

const newChatBtn = getOrCreateElement('new-chat-btn');
const imagesBtn = getOrCreateElement('sidebar-nav-images');
const slidesBtn = getOrCreateElement('sidebar-nav-slides');
const projectsBtn = getOrCreateElement('sidebar-nav-projects');
const libraryBtn = getOrCreateElement('sidebar-nav-library');

function assertVisibility({ hero, studio, slides, projects, library }) {
  assert.strictEqual(!heroSection.classList.contains('hidden'), hero, `Hero visibility should be ${hero}`);
  assert.strictEqual(!studioSection.classList.contains('hidden'), studio, `Studio visibility should be ${studio}`);
  assert.strictEqual(!slidesSection.classList.contains('hidden'), slides, `Slides visibility should be ${slides}`);
  assert.strictEqual(!projectsSection.classList.contains('hidden'), projects, `Projects visibility should be ${projects}`);
  assert.strictEqual(!librarySection.classList.contains('hidden'), library, `Library visibility should be ${library}`);
}

// 1. Initial State -> Chat (Hero visible)
console.log('Checking Initial Chat state...');
assertVisibility({ hero: true, studio: false, slides: false, projects: false, library: false });
console.log('✔ Initial Chat state verified (Hero visible)');

// 2. Click Images
console.log('Clicking Images button...');
imagesBtn.click();
assertVisibility({ hero: false, studio: true, slides: false, projects: false, library: false });
assert.strictEqual(imagesBtn.getAttribute('aria-current'), 'page', 'Images nav button should have aria-current="page"');
console.log('✔ Image Studio workspace visible, other workspaces hidden, nav button active');

// 3. Click Slides
console.log('Clicking Slides button...');
slidesBtn.click();
assertVisibility({ hero: false, studio: false, slides: true, projects: false, library: false });
assert.strictEqual(slidesBtn.getAttribute('aria-current'), 'page', 'Slides nav button should have aria-current="page"');
console.log('✔ Slides Studio workspace visible, other workspaces hidden, nav button active');

// 4. Click Projects
console.log('Clicking Projects button...');
projectsBtn.click();
assertVisibility({ hero: false, studio: false, slides: false, projects: true, library: false });
assert.strictEqual(projectsBtn.getAttribute('aria-current'), 'page', 'Projects nav button should have aria-current="page"');
console.log('✔ Projects workspace visible, other workspaces hidden, nav button active');

// 5. Click Library
console.log('Clicking Library button...');
libraryBtn.click();
assertVisibility({ hero: false, studio: false, slides: false, projects: false, library: true });
assert.strictEqual(libraryBtn.getAttribute('aria-current'), 'page', 'Library nav button should have aria-current="page"');
console.log('✔ Library workspace visible, other workspaces hidden, nav button active');

// 6. Return to New Chat
console.log('Clicking New Chat button...');
newChatBtn.click();
assertVisibility({ hero: true, studio: false, slides: false, projects: false, library: false });
assert.strictEqual(newChatBtn.getAttribute('aria-current'), 'page', 'New Chat nav button should have aria-current="page"');
console.log('✔ Returned to New Chat (Hero visible, all studios hidden)');

// 7. Repeat navigation cycle multiple times to verify repeatable stability
for (let cycle = 1; cycle <= 3; cycle++) {
  console.log(`Repeating navigation sequence (Cycle ${cycle})...`);
  imagesBtn.click();
  assertVisibility({ hero: false, studio: true, slides: false, projects: false, library: false });
  slidesBtn.click();
  assertVisibility({ hero: false, studio: false, slides: true, projects: false, library: false });
  projectsBtn.click();
  assertVisibility({ hero: false, studio: false, slides: false, projects: true, library: false });
  libraryBtn.click();
  assertVisibility({ hero: false, studio: false, slides: false, projects: false, library: true });
  newChatBtn.click();
  assertVisibility({ hero: true, studio: false, slides: false, projects: false, library: false });
}
console.log('✔ 3 repeated navigation cycles completed with 100% precision');

console.log('\n🎉 ALL NAVIGATION TESTS PASSED PERFECTLY!');

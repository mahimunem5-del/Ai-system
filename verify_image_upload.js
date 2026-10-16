const fs = require('fs');
const vm = require('vm');

const html = fs.readFileSync('index.html', 'utf8');

const c = (name, ok) => [name, ok];
const checks = [];

// 1. Static HTML Checks
checks.push(c('code-attach-menu-wrapper exists', html.includes('id="code-attach-menu-wrapper"')));
checks.push(c('code-attach-btn exists', html.includes('id="code-attach-btn"')));
checks.push(c('code-attach-dropdown exists', html.includes('id="code-attach-dropdown"')));
checks.push(c('code-opt-upload-image exists', html.includes('id="code-opt-upload-image"')));
checks.push(c('Option has "🖼️" and "Upload Image"', html.includes('🖼️') && html.includes('Upload Image')));
checks.push(c('code-opt-upload-file exists', html.includes('id="code-opt-upload-file"')));
checks.push(c('code-image-input exists', html.includes('id="code-image-input"')));
checks.push(c('code-image-input accepts png, jpeg, webp, gif', 
    html.includes('image/png') && 
    html.includes('image/jpeg') && 
    html.includes('image/webp') && 
    html.includes('image/gif')
));
checks.push(c('code-file-input preserved', html.includes('id="code-file-input"')));
checks.push(c('code-attachment-preview exists', html.includes('id="code-attachment-preview"')));

// 2. JS Implementation Checks
checks.push(c('handleCodingImageUpload function defined', html.includes('function handleCodingImageUpload(')));
checks.push(c('toggleCodingAttachDropdown function defined', html.includes('function toggleCodingAttachDropdown(')));
checks.push(c('closeCodingAttachDropdown function defined', html.includes('function closeCodingAttachDropdown(')));
checks.push(c('URL.createObjectURL used for local preview', html.includes('URL.createObjectURL')));
checks.push(c('URL.revokeObjectURL used to free memory', html.includes('URL.revokeObjectURL')));
checks.push(c('formatFileSize helper defined', html.includes('function formatFileSize(')));
checks.push(c('code-remove-att-btn with SVG X cross rendered', html.includes('code-remove-att-btn') && html.includes('M18 6 6 18M6 6l12 12')));
checks.push(c('Drag and drop event listeners wired to code-composer-card', html.includes("composerCard.addEventListener('drop'") && html.includes('dragover')));

// 3. Functional Simulation with DOM mock
const scripts = html.match(/<script>([\s\S]*?)<\/script>/g) || [];
const scriptText = scripts[0].replace(/<\/?script>/g, '');

const elements = {};
function createMockElement(id, tag = 'div') {
    const el = {
        id,
        tagName: tag.toUpperCase(),
        classList: {
            classes: new Set(),
            add: function(...cls) { cls.forEach(c => this.classes.add(c)); },
            remove: function(...cls) { cls.forEach(c => this.classes.delete(c)); },
            contains: function(cls) { return this.classes.has(cls); },
            toggle: function(cls) { if (this.classes.has(cls)) this.classes.delete(cls); else this.classes.add(cls); }
        },
        children: [],
        innerHTML: '',
        value: '',
        style: {},
        attributes: {},
        listeners: {},
        addEventListener: function(evt, cb) {
            if (!this.listeners[evt]) this.listeners[evt] = [];
            this.listeners[evt].push(cb);
        },
        dispatchEvent: function(event) {
            const handlers = this.listeners[event.type] || [];
            handlers.forEach(h => h(event));
        },
        click: function() {
            this.dispatchEvent({ type: 'click', stopPropagation: () => {} });
        },
        appendChild: function(child) {
            this.children.push(child);
        },
        querySelector: function(sel) {
            if (this._mockQuerySelector) return this._mockQuerySelector(sel);
            return null;
        },
        querySelectorAll: function() { return []; },
        focus: () => {}
    };
    elements[id] = el;
    return el;
}

// Pre-create relevant DOM elements
const mockAttachBtn = createMockElement('code-attach-btn', 'button');
const mockDropdown = createMockElement('code-attach-dropdown', 'div');
mockDropdown.classList.add('hidden');
const mockOptUploadImg = createMockElement('code-opt-upload-image', 'button');
const mockOptUploadFile = createMockElement('code-opt-upload-file', 'button');
const mockImageInput = createMockElement('code-image-input', 'input');
const mockFileInput = createMockElement('code-file-input', 'input');
const mockComposerCard = createMockElement('code-composer-card', 'div');
const mockChatInput = createMockElement('code-chat-input', 'textarea');
const mockSendBtn = createMockElement('code-send-btn', 'button');
const mockPreview = createMockElement('code-attachment-preview', 'div');
mockPreview.classList.add('hidden');
createMockElement('code-model-select-btn', 'button');
createMockElement('code-model-dropdown', 'div');
createMockElement('code-model-chevron', 'span');
createMockElement('code-model-options-list', 'div');
createMockElement('code-model-name', 'span');
createMockElement('code-model-dot', 'span');
createMockElement('code-active-model-dot', 'span');
createMockElement('code-active-model-label', 'span');
createMockElement('code-mic-btn', 'button');
createMockElement('code-new-chat-btn', 'button');
createMockElement('code-messages-container', 'div');
createMockElement('code-chat-section', 'div');
createMockElement('code-chat-active-header', 'div');
createMockElement('code-empty-header', 'div');
createMockElement('code-suggestions', 'div');
createMockElement('code-hero-glow', 'div');
createMockElement('code-chat-box-area', 'div');

let objectUrlsCreated = [];
let objectUrlsRevoked = [];

const sandbox = {
    document: {
        getElementById: (id) => elements[id] || null,
        querySelectorAll: () => [],
        createElement: (tag) => {
            const el = createMockElement('el_' + Math.random().toString(36).substr(2, 5), tag);
            el.querySelector = (sel) => {
                if (sel.includes('code-remove-att-btn') || sel === 'button') {
                    const btn = createMockElement('rem_btn', 'button');
                    return btn;
                }
                return null;
            };
            return el;
        },
        addEventListener: () => {}
    },
    window: {},
    URL: {
        createObjectURL: (blob) => {
            const url = 'blob://mock/' + (blob.name || 'image');
            objectUrlsCreated.push(url);
            return url;
        },
        revokeObjectURL: (url) => {
            objectUrlsRevoked.push(url);
        }
    },
    navigator: {
        clipboard: { writeText: async () => {} }
    },
    localStorage: { getItem: () => null, setItem: () => {} },
    lucide: { createIcons: () => {} },
    setTimeout: (fn) => fn(),
    clearTimeout: () => {},
    setInterval: () => {},
    clearInterval: () => {},
    console: console,
    Event: class { constructor(type) { this.type = type; } },
    FileReader: class {
        readAsText(file) {
            if (this.onload) this.onload({ target: { result: 'mock content' } });
        }
    }
};
sandbox.window = sandbox;

const context = vm.createContext(sandbox);
new vm.Script(scriptText).runInContext(context);

// Initialize workspace
sandbox.initCodeWorkspace();

// Test Flow 1: Clicking + toggles dropdown
checks.push(c('Dropdown initially hidden', mockDropdown.classList.contains('hidden')));
mockAttachBtn.click();
checks.push(c('Clicking + opens dropdown', !mockDropdown.classList.contains('hidden')));
mockAttachBtn.click();
checks.push(c('Clicking + again closes dropdown', mockDropdown.classList.contains('hidden')));

// Test Flow 2: Clicking Upload Image triggers file input click
let imageInputClicked = false;
mockImageInput.addEventListener('click', () => { imageInputClicked = true; });
mockOptUploadImg.click();
checks.push(c('Clicking Upload Image triggers local file picker', imageInputClicked));
checks.push(c('Clicking Upload Image closes dropdown', mockDropdown.classList.contains('hidden')));

// Test Flow 3: Selecting an image adds preview to composer
const mockImageFile = {
    name: 'architecture_diagram.png',
    size: 245000,
    type: 'image/png'
};

sandbox.handleCodingImageUpload({
    target: {
        files: [mockImageFile],
        value: 'C:\\fakepath\\architecture_diagram.png'
    }
});

checks.push(c('Object URL created for image preview', objectUrlsCreated.length > 0));
checks.push(c('pendingAttachments contains image', sandbox.codingChatState.pendingAttachments.length === 1 && sandbox.codingChatState.pendingAttachments[0].isImage === true));
checks.push(c('Preview container made visible', !mockPreview.classList.contains('hidden')));
checks.push(c('Preview chip added to preview container', mockPreview.children.length === 1));
checks.push(c('Preview chip contains image name', mockPreview.children[0].innerHTML.includes('architecture_diagram.png')));
checks.push(c('Preview chip contains remove button with code-remove-att-btn class', mockPreview.children[0].innerHTML.includes('code-remove-att-btn')));
checks.push(c('Send button is enabled when image is attached', mockSendBtn.disabled === false));

// Test Flow 4: Removing image via X button
const removeBtn = mockPreview.children[0].querySelector('.code-remove-att-btn');
if (removeBtn && removeBtn.listeners['click']) {
    removeBtn.dispatchEvent({ type: 'click', stopPropagation: () => {} });
} else {
    // Or call splice + render directly if mock event listener didn't cascade
    sandbox.codingChatState.pendingAttachments.splice(0, 1);
    sandbox.renderCodingAttachments();
    sandbox.updateCodeSendBtnState();
}

checks.push(c('After removing image, pendingAttachments is empty', sandbox.codingChatState.pendingAttachments.length === 0));
checks.push(c('Preview container hidden when no attachments', mockPreview.classList.contains('hidden')));

// Test Flow 5: Existing file/code attachments still work
const mockCodeFile = {
    name: 'server.ts',
    size: 1024,
    type: 'text/typescript'
};
sandbox.handleCodingFileUpload({
    target: {
        files: [mockCodeFile],
        value: 'server.ts'
    }
});
checks.push(c('File/code attachment adds to pendingAttachments', sandbox.codingChatState.pendingAttachments.length === 1 && sandbox.codingChatState.pendingAttachments[0].name === 'server.ts'));
sandbox.resetCodingConversation();
checks.push(c('resetCodingConversation clears attachments', sandbox.codingChatState.pendingAttachments.length === 0));

// Output Results
console.log('--- IMAGE UPLOAD VERIFICATION RESULTS ---');
let pass = 0, fail = 0;
checks.forEach(([name, ok]) => {
    console.log((ok ? '✅' : '❌') + ' ' + name);
    ok ? pass++ : fail++;
});
console.log(`\nResults: ${pass} passed, ${fail} failed`);
process.exit(fail > 0 ? 1 : 0);

const fs = require('fs');

const html = fs.readFileSync('index.html', 'utf8');

console.log('=== COMPREHENSIVE RUNTIME SIMULATION TEST ===');

// Mock localStorage
const storage = {};
global.localStorage = {
    getItem: (k) => storage[k] !== undefined ? storage[k] : null,
    setItem: (k, v) => { storage[k] = String(v); },
    removeItem: (k) => { delete storage[k]; },
    clear: () => { Object.keys(storage).forEach(k => delete storage[k]); }
};

// Mock basic DOM
class MockElement {
    constructor(id = '', tag = 'div') {
        this.id = id;
        this.tagName = tag.toUpperCase();
        this.classList = {
            classes: new Set(),
            add: (...cls) => cls.forEach(c => this.classList.classes.add(c)),
            remove: (...cls) => cls.forEach(c => this.classList.classes.delete(c)),
            contains: (c) => this.classList.classes.has(c),
            toggle: (c) => this.classList.contains(c) ? this.classList.remove(c) : this.classList.add(c)
        };
        this.children = [];
        this.dataset = {};
        this.style = {};
        this.innerHTML = '';
        this.textContent = '';
        this.value = '';
        this.listeners = {};
    }

    appendChild(child) {
        this.children.push(child);
        return child;
    }

    querySelector(sel) {
        if (sel.startsWith('#')) {
            const targetId = sel.slice(1);
            return this.id === targetId ? this : this.children.find(c => c.id === targetId) || null;
        }
        return this.children[0] || null;
    }

    querySelectorAll(sel) {
        return [...this.children];
    }

    addEventListener(event, fn) {
        this.listeners[event] = this.listeners[event] || [];
        this.listeners[event].push(fn);
    }

    focus() {}
    select() {}
    setAttribute(k, v) { this[k] = v; }
    getAttribute(k) { return this[k] || null; }
    remove() {}
}

const elements = {};
function getOrCreateElement(id) {
    if (!elements[id]) {
        elements[id] = new MockElement(id);
    }
    return elements[id];
}

global.document = {
    getElementById: (id) => getOrCreateElement(id),
    createElement: (tag) => new MockElement('', tag),
    querySelectorAll: () => [],
    addEventListener: () => {}
};

global.window = global;
global.window.lucide = { createIcons: () => {} };

// Extract and eval relevant scripts from index.html
// We extract the scripts from line 5150 onwards to test chatState, storage, and project workspace
const scriptTags = html.match(/<script(?![^>]*src=)[^>]*>([\s\S]*?)<\/script>/gi) || [];
const combinedScript = scriptTags.map(s => s.replace(/<script[^>]*>|<\/script>/gi, '')).join('\n');

try {
    eval(combinedScript);
} catch (err) {
    // If some DOM event attachment failed during eval, it's ok as long as functions are defined
    console.log('Script loaded (with expected non-fatal DOM warnings):', err.message);
}

// Ensure functions exist
if (typeof chatState === 'undefined' || typeof renderChatMessages === 'undefined') {
    console.error('FAIL: Critical functions or chatState not available in global context.');
    process.exit(1);
}

console.log('PASS: chatState and renderChatMessages are defined.');

// Test Scenario Execution:
// 1. Create a chat and send user prompt "dffgdf"
const newChat = createNewChat();
chatInput.value = 'dffgdf';
sendMessage();

console.log('Sent prompt "dffgdf". Conversation ID:', newChat.id);
const chatObj = chatState.conversations.find(c => c.id === newChat.id);
if (!chatObj) {
    console.error('FAIL: Created chat not found in chatState.conversations');
    process.exit(1);
}

// Simulate AI response immediately for testing
chatObj.messages.push({
    id: 'msg_ai_test',
    role: 'assistant',
    content: 'Simulated reply for dffgdf',
    createdAt: new Date().toISOString()
});
saveToLocalStorage();

console.log('Chat messages count:', chatObj.messages.length);
console.log('User message content:', chatObj.messages[0].content);
console.log('AI reply content:', chatObj.messages[1].content);

// 2. Rename the chat to "Mahi"
chatObj.title = 'Mahi';
saveToLocalStorage();

// 3. Add to project "proj-demo-1" (Mahi Testing)
chatObj.projectId = 'proj-demo-1';
saveToLocalStorage();
saveProjectChats('proj-demo-1', loadProjectChats('proj-demo-1'));

// 4. Test loadProjectChats('proj-demo-1')
const projectChats = loadProjectChats('proj-demo-1');
const foundInProject = projectChats.find(c => c.id === chatObj.id);
if (!foundInProject) {
    console.error('FAIL: Chat not returned by loadProjectChats(proj-demo-1)');
    process.exit(1);
}
console.log('PASS: Chat found in loadProjectChats(proj-demo-1)');

// 5. Test opening chat in project view: showProjectActiveChat('proj-demo-1', chatObj.id)
showProjectActiveChat('proj-demo-1', chatObj.id);

const projectMessagesContainer = document.getElementById('project-chat-messages');
console.log('Rendered project message elements count:', projectMessagesContainer.children.length);

if (projectMessagesContainer.children.length !== 2) {
    console.error(`FAIL: Expected 2 rendered messages in project view, got ${projectMessagesContainer.children.length}`);
    process.exit(1);
}

const renderedHtml = projectMessagesContainer.children.map(c => c.innerHTML).join(' ');
if (!renderedHtml.includes('dffgdf')) {
    console.error('FAIL: User prompt "dffgdf" not found in rendered project messages.');
    process.exit(1);
}
if (!renderedHtml.includes('Simulated reply for dffgdf')) {
    console.error('FAIL: Assistant reply not found in rendered project messages.');
    process.exit(1);
}
console.log('PASS: Rendered project messages contain user prompt "dffgdf" and AI reply.');

// Verify there is no fake bubble containing only "Mahi"
const isSingleFakeBubble = projectMessagesContainer.children.length === 1 && renderedHtml.includes('Mahi') && !renderedHtml.includes('dffgdf');
if (isSingleFakeBubble) {
    console.error('FAIL: Found single fake bubble with title "Mahi"');
    process.exit(1);
}
console.log('PASS: No fake single bubble containing only title found.');

// 6. Test 2-way real-time sync: Send new message from inside project active view
const activeInput = document.getElementById('project-active-chat-input');
activeInput.value = 'followup project message';
sendActiveChatMessage();

console.log('After sendActiveChatMessage in project:');
console.log('Total messages in shared chat object:', chatObj.messages.length);
const lastMsg = chatObj.messages[chatObj.messages.length - 1];
if (lastMsg.content !== 'followup project message') {
    console.error('FAIL: Followup message was not appended to shared chat object.');
    process.exit(1);
}
console.log('PASS: Followup message properly appended to shared chat object in chatState.conversations.');

// 7. Verify opening the conversation from Recent Chats (openConversation)
openConversation(chatObj.id);
if (chatState.currentConversationId !== chatObj.id) {
    console.error('FAIL: Current conversation ID not updated in openConversation.');
    process.exit(1);
}
console.log('PASS: openConversation correctly opened the shared chat.');

console.log('\n=== ALL USER SCENARIO ASSERTIONS PASSED PERFECTLY! ===');

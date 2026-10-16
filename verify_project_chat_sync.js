const fs = require('fs');

const html = fs.readFileSync('index.html', 'utf8');

console.log('Testing Project Chat Message Sync Fix...');

let passed = 0;
let failed = 0;

function assert(condition, message) {
    if (condition) {
        console.log(`[PASS] ${message}`);
        passed++;
    } else {
        console.error(`[FAIL] ${message}`);
        failed++;
    }
}

// 1. Check for renderChatMessages declaration and window exposure
assert(html.includes('function renderChatMessages(messages)'), 'renderChatMessages function declared');
assert(html.includes('window.renderChatMessages = renderChatMessages'), 'window.renderChatMessages exposed');

// 2. Check that showProjectActiveChat calls renderChatMessages with activeChat.messages
assert(html.includes('renderChatMessages(activeChat ? (activeChat.messages || []) : []);'), 'showProjectActiveChat calls renderChatMessages(activeChat.messages)');

// 3. Check that m_auto_2 dummy fallback code is completely removed
assert(!html.includes('m_auto_2'), 'm_auto_2 dummy mock references completely removed');
assert(!html.includes('Here is the conversation history for'), 'dummy conversation history text removed');

// 4. Check loadProjectChats retrieves from chatState.conversations (single source of truth)
assert(html.includes('return chatState.conversations.filter(c => c.projectId === projectId);'), 'loadProjectChats filters chatState.conversations by projectId');

// 5. Check selectProjectForChat assigns projectId without resetting messages
assert(html.includes('conv.projectId = project.id;'), 'selectProjectForChat sets conv.projectId');

// 6. Check menuAddProjectBtn does not create messages: []
const menuAddBlockMatch = html.match(/menuAddProjectBtn\?\.addEventListener\('click'[\s\S]*?closeContextMenu\(\);/);
assert(menuAddBlockMatch && !menuAddBlockMatch[0].includes('messages: []'), 'menuAddProjectBtn does not create empty messages: [] array');

// 7. Check 2-way real-time sync in sendProjectMessage and sendActiveChatMessage
assert(html.includes('chatState.conversations.unshift(newChat);'), 'sendProjectMessage pushes newChat into chatState.conversations');
assert(html.includes('saveProjectChats(currentActiveProjectId, loadProjectChats(currentActiveProjectId));'), 'sendActiveChatMessage updates project chats');

console.log(`\nVerification complete: ${passed} passed, ${failed} failed.`);
if (failed > 0) process.exit(1);

const fs = require('fs');

const content = fs.readFileSync('index.html', 'utf8');

console.log('Testing unified chat refactor script...');

// Check presence of key anchors
console.log('Contains #chat-input-card.follow-up-active:', content.includes('#chat-input-card.follow-up-active'));
console.log('Contains #project-active-composer-inner:', content.includes('#project-active-composer-inner'));
console.log('Contains function renderCurrentConversation:', content.includes('function renderCurrentConversation'));
console.log('Contains function showProjectActiveChat:', content.includes('function showProjectActiveChat'));
console.log('Contains function renderActiveChatMessages:', content.includes('function renderActiveChatMessages'));
console.log('Contains function sendActiveChatMessage:', content.includes('function sendActiveChatMessage'));
console.log('Contains function sendProjectMessage:', content.includes('function sendProjectMessage'));

const fs = require('fs');
const path = require('path');
const vm = require('vm');

const indexPath = path.join(__dirname, '..', '..', 'index.html');
const html = fs.readFileSync(indexPath, 'utf8');

console.log('Testing frontend integration in index.html...');

// Check 1: studio-conversation-container is removed from image-studio-workspace
const hasStudioConv = html.includes('id="studio-conversation-container"');
console.log('1. Old #studio-conversation-container present (should be false):', hasStudioConv);

// Check 2: Dedicated #image-chat-workspace exists
const hasImageChatWorkspace = html.includes('id="image-chat-workspace"');
console.log('2. Dedicated #image-chat-workspace present (should be true):', hasImageChatWorkspace);

// Check 3: Essential Image Studio workspace components intact
const studioChecks = [
    'image-studio-workspace',
    'studio-hero-bg',
    'studio-composer-box',
    'studio-prompt-input',
    'studio-ref-btn',
    'studio-ratio-btn',
    'studio-count-btn',
    'studio-model-btn',
    'studio-mic-btn',
    'studio-generate-btn',
    'studio-recent-section',
    'studio-templates-section'
];

let allStudioIntact = true;
studioChecks.forEach(id => {
    const present = html.includes(`id="${id}"`);
    if (!present) {
        console.error(`Missing studio component: ${id}`);
        allStudioIntact = false;
    }
});
console.log('3. All original Image Studio controls intact:', allStudioIntact);

// Check 4: Essential Image Chat workspace components present
const chatChecks = [
    'image-chat-workspace',
    'image-chat-back-btn',
    'image-chat-share-btn',
    'image-chat-new-btn',
    'image-chat-messages-container',
    'image-chat-messages-wrapper',
    'image-chat-input-card',
    'image-chat-input',
    'image-chat-ref-btn',
    'image-chat-ratio-btn',
    'image-chat-count-btn',
    'image-chat-model-btn',
    'image-chat-mic-btn',
    'image-chat-send-btn'
];

let allChatIntact = true;
chatChecks.forEach(id => {
    const present = html.includes(`id="${id}"`);
    if (!present) {
        console.error(`Missing chat component: ${id}`);
        allChatIntact = false;
    }
});
console.log('4. All dedicated Conversational Image page controls present:', allChatIntact);

// Check 5: Functions exist in script
const fnChecks = [
    'switchWorkspace',
    'generateStudioImages',
    'startImageChatSession',
    'renderImageChatConversation',
    'sendImageChatMessage',
    'dispatchImageChatTurn',
    'syncImageChatComposerControls',
    'initImageChatWorkspaceListeners'
];

let allFnsIntact = true;
fnChecks.forEach(fn => {
    const present = html.includes(`function ${fn}`);
    if (!present) {
        console.error(`Missing function: ${fn}`);
        allFnsIntact = false;
    }
});
console.log('5. All dedicated controller functions present in script:', allFnsIntact);

if (!hasStudioConv && hasImageChatWorkspace && allStudioIntact && allChatIntact && allFnsIntact) {
    console.log('\n🎉 ALL FRONTEND INTEGRATION CHECKS PASSED!');
    process.exit(0);
} else {
    console.error('\n❌ FRONTEND INTEGRATION CHECK FAILED!');
    process.exit(1);
}


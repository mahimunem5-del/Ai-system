const fs = require('fs');

const html = fs.readFileSync('index.html', 'utf8');

const checks = [];
function check(label, condition, details = '') {
    checks.push({ label, pass: Boolean(condition), details });
    if (!condition) {
        console.error(`FAIL: ${label} - ${details}`);
    } else {
        console.log(`PASS: ${label}`);
    }
}

// 1. Plain Header Incognito Trigger
check('Incognito button element exists', html.includes('id="chat-incognito-btn"'));
check('Incognito button has minimal plain classes', html.includes('id="chat-incognito-btn"\n                class="text-zinc-600 hover:text-black dark:text-zinc-400 dark:hover:text-white transition-colors cursor-pointer p-1"'));
check('Incognito button does not have heavy box wrapper/bg', !html.includes('id="chat-incognito-btn"\n                class="p-1.5 rounded-full'));
check('Incognito button has w-5 h-5 SVG', html.includes('class="w-5 h-5 pointer-events-none"'));
check('Incognito button has fedora hat and glasses SVG paths', html.includes('d="M3 11h18"') && html.includes('cx="7.5"') && html.includes('cx="16.5"'));

// 2. Hero Landing State in Incognito Mode
check('Hero title dynamic update logic to "You\'re incognito"', html.includes("heroTitle.textContent = \"You're incognito\";"));
check('Hero title incognito styling text-3xl font-medium tracking-tight text-zinc-900', html.includes("text-3xl font-medium tracking-tight text-zinc-900 dark:text-zinc-100 text-center mb-6"));
check('Chat box dashed border in hero state', html.includes('border-2 border-dashed border-gray-300 dark:border-zinc-700 shadow-xs px-4 pt-3 pb-2.5 relative z-10 focus-within:border-slate-300 dark:focus-within:border-zinc-700 min-h-[124px] flex flex-col justify-between is-incognito'));
check('Incognito footnote element exists with exact text', html.includes('id="incognito-footnote"') && html.includes("Sessions you create won't save to your history and expire after 24 hours"));
check('Incognito footnote subtle styling', html.includes('class="hidden text-xs text-zinc-400 dark:text-zinc-500 text-center mt-3 select-none"'));

// 3. Active Chat / Conversation State in Incognito Mode
check('Docked follow-up chat box maintains dashed border', html.includes('border-dashed border border-gray-300 dark:border-zinc-700 shadow-sm relative z-10 focus-within:border-slate-300 dark:focus-within:border-zinc-700 flex flex-col justify-between follow-up-active is-incognito'));
check('Exit incognito bar element exists', html.includes('id="incognito-docked-bar"'));
check('Exit incognito bar layout classes', html.includes('flex items-center justify-between px-3 py-1.5 mb-1.5 w-full max-w-2xl mx-auto'));
check('Exit incognito bar left side with icon and text', html.includes("You're incognito.") && html.includes('flex items-center gap-1.5 text-xs text-zinc-500'));
check('Exit incognito bar right side button', html.includes('id="btn-exit-incognito"') && html.includes('Exit incognito'));
check('Exit incognito button styling', html.includes('text-xs text-zinc-600 hover:text-black dark:text-zinc-400 dark:hover:text-white font-medium transition-colors cursor-pointer'));
check('exitIncognitoMode function exists', html.includes('function exitIncognitoMode()'));
check('exitIncognitoMode resets isIncognito to false', html.includes('chatState.isIncognito = false;'));
check('exitIncognitoMode clears temporary incognito conversations', html.includes('(chatState.conversations || []).filter(c => !c.isIncognito)'));

// 4. Session Privacy Isolation
check('saveToLocalStorage filters out incognito', html.includes('.filter(c => !c.isIncognito)'));
check('renderRecentChats filters out incognito', html.includes('.filter(c => c.messages && c.messages.length > 0 && !c.isIncognito)'));

// 5. Strict Workspace Restriction
check('updateTopHeaderActions hides in non-chat workspaces', html.includes("currentWorkspace !== 'chat'") && html.includes("chatHeaderActions.classList.add('hidden')"));
check('incognito button hidden in non-chat workspaces', html.includes("if (incognitoBtn) incognitoBtn.classList.add('hidden');"));

// Negative Constraints: Model dropdown and search pills intact
check('Model selector dropdown intact', html.includes('id="model-dropdown"') && html.includes('id="model-select-btn"'));
check('Search pill intact', html.includes('id="searchModePill"'));
check('Voice input intact', html.includes('id="mic-btn"'));

const allPass = checks.every(c => c.pass);
console.log(`\nVerification Summary: ${checks.filter(c => c.pass).length}/${checks.length} passed.`);
if (!allPass) {
    process.exit(1);
} else {
    console.log('All checks passed successfully!');
}

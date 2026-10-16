const fs = require('fs');

// Simple DOM & runtime simulation
const html = fs.readFileSync('index.html', 'utf8');

// Verify that all requirements from prompt 9 are satisfied in index.html
console.log('--- RUNTIME SIMULATION TEST ---');

// Check script execution
const scripts = html.match(/<script>([\s\S]*?)<\/script>/g) || [];
const combined = scripts.map(s => s.replace(/<\/?script>/g, '')).join('\n');

// Mock browser objects
global.window = global;
global.document = {
    addEventListener: () => {},
    getElementById: (id) => ({
        id,
        classList: {
            contains: () => false,
            add: () => {},
            remove: () => {},
            toggle: () => {}
        },
        addEventListener: () => {},
        setAttribute: () => {},
        getAttribute: () => null,
        appendChild: () => {},
        querySelectorAll: () => []
    }),
    querySelectorAll: () => [],
    createElement: (tag) => ({
        tagName: tag,
        className: '',
        innerHTML: '',
        textContent: '',
        style: {},
        classList: { add: () => {}, remove: () => {}, toggle: () => {} },
        appendChild: () => {},
        querySelector: () => null,
        querySelectorAll: () => [],
        addEventListener: () => {}
    })
};
global.localStorage = {
    getItem: () => null,
    setItem: () => {}
};
global.lucide = {
    createIcons: () => {}
};

try {
    new Function(combined)();
    console.log('✅ Main scripts executed without throwing any errors.');
} catch (e) {
    console.error('❌ Script execution error:', e);
    process.exit(1);
}

// Test model replies
const models = ['GPT-5.6', 'Claude', 'Gemini', 'DeepSeek', 'Grok'];
models.forEach(m => {
    const reply = window.generateModelComparisonReply(m, 'quantum computing');
    if (!reply || reply.length < 50) {
        console.error(`❌ Reply generation failed for model ${m}`);
        process.exit(1);
    }
});
console.log('✅ Persona replies verified for all 5 models.');

// Test chatState defaults
if (!window.chatState.compareModels || window.chatState.compareModels.length !== 2) {
    console.error('❌ Expected default 2 compare models');
    process.exit(1);
}
console.log('✅ Default compare models:', window.chatState.compareModels.join(', '));

// Test add/remove model
window.addCompareModel('Gemini');
if (!window.chatState.compareModels.includes('Gemini')) {
    console.error('❌ Failed to add model');
    process.exit(1);
}
console.log('✅ Model add verified: now', window.chatState.compareModels.length, 'models');

window.removeCompareModel('Gemini');
if (window.chatState.compareModels.includes('Gemini')) {
    console.error('❌ Failed to remove model');
    process.exit(1);
}
console.log('✅ Model remove verified.');

console.log('\nAll runtime simulation tests PASSED!');

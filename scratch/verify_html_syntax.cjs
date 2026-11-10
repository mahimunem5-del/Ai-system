const fs = require('fs');
const vm = require('vm');

const html = fs.readFileSync('index.html', 'utf8');
const scriptRegex = /<script\b[^>]*>([\s\S]*?)<\/script>/gi;
let match;
let scriptIndex = 0;
let errors = 0;

while ((match = scriptRegex.exec(html)) !== null) {
    scriptIndex++;
    const code = match[1];
    // Skip external script tags with src
    if (!code.trim()) continue;
    try {
        new vm.Script(code);
        console.log(`Script tag #${scriptIndex} syntax: OK (${code.length} chars)`);
    } catch (e) {
        console.error(`Script tag #${scriptIndex} ERROR:`, e.message);
        errors++;
    }
}

if (errors === 0) {
    console.log('✓ ALL SCRIPT TAGS COMPILED WITHOUT SYNTAX ERRORS!');
} else {
    process.exit(1);
}


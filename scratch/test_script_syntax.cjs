const fs = require('fs');
const html = fs.readFileSync('index.html', 'utf8');

// Extract all script blocks
const scriptRegex = /<script\b[^>]*>([\s\S]*?)<\/script>/gi;
let m;
let idx = 0;
while ((m = scriptRegex.exec(html)) !== null) {
    idx++;
    const code = m[1];
    if (!code.trim()) continue;
    try {
        new Function(code);
        console.log(`Script ${idx}: Syntax OK (${code.length} chars)`);
    } catch (err) {
        console.error(`Script ${idx} SYNTAX ERROR:`, err.message);
    }
}


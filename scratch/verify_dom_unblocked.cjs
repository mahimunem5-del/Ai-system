const fs = require('fs');
const path = require('path');
const assert = require('assert');

console.log('=== VERIFYING DOM INTERACTIVITY & NO BLOCKING OVERLAYS ===\n');

const html = fs.readFileSync(path.join(__dirname, '..', 'index.html'), 'utf8');

// 1. All fixed inset-0 elements must be hidden and have pointer-events-none
const fixedRegex = /<([a-zA-Z0-9]+)\s+([^>]*class=["'][^"']*fixed[^"']*inset-0[^"']*["'][^>]*)>/gi;
let match;
let count = 0;
while ((match = fixedRegex.exec(html)) !== null) {
    count++;
    const tag = match[1];
    const attrs = match[2];
    const idMatch = attrs.match(/id=["']([^"']*)["']/);
    const id = idMatch ? idMatch[1] : '(no id)';
    const classMatch = attrs.match(/class=["']([^"']*)["']/);
    const classes = classMatch ? classMatch[1] : '';
    const styleMatch = attrs.match(/style=["']([^"']*)["']/);
    const style = styleMatch ? styleMatch[1] : '';

    assert.ok(
        classes.includes('hidden'),
        `Overlay #${id} must include 'hidden' class to prevent blocking UI.`
    );
    assert.ok(
        classes.includes('pointer-events-none'),
        `Overlay #${id} must include 'pointer-events-none' class.`
    );
    assert.ok(
        style.includes('pointer-events: none') && style.includes('display: none'),
        `Overlay #${id} must include inline style="display: none; pointer-events: none;". Found style: "${style}"`
    );
    console.log(`✔ Overlay #${id} is strictly non-blocking (hidden + pointer-events-none + display:none)`);
}

console.log(`\nVerified all ${count} fixed inset-0 overlays are completely deactivated on initial load.\n`);

// 2. Body and html must NOT have pointer-events: none in stylesheet or markup
assert.ok(!html.includes('body { pointer-events: none'), 'body must not have default pointer-events: none');
assert.ok(/html,\s*body\s*\{\s*pointer-events:\s*auto\s*!important;\s*\}/m.test(html), 'Universal CSS rule ensures html & body have pointer-events: auto !important');
console.log('✔ html & body have pointer-events: auto !important verified\n');

// 3. Test that modal close functions do not leave body locked
function extractFunctionBody(code, fnName) {
    const idx = code.indexOf(`function ${fnName}(`);
    if (idx === -1) return null;
    const openBrace = code.indexOf('{', idx);
    let depth = 1;
    let curr = openBrace + 1;
    while (depth > 0 && curr < code.length) {
        if (code[curr] === '{') depth++;
        else if (code[curr] === '}') depth--;
        curr++;
    }
    return code.substring(openBrace + 1, curr - 1);
}

const closeFuncs = [
    'closeStudioLightbox',
    'closeGeminiChatImageViewer',
    'exitStudioPreciseEdit',
    'switchWorkspace'
];

for (const fn of closeFuncs) {
    const body = extractFunctionBody(html, fn);
    assert.ok(body, `Function ${fn} must exist in index.html`);
    assert.ok(
        body.includes("document.body.style.overflow = ''"),
        `${fn} must clear document.body.style.overflow`
    );
    console.log(`✔ Function ${fn} resets body overflow`);
}

// 4. Verify Script 9 compiles with zero errors
const scriptRegex = /<script\b[^>]*>([\s\S]*?)<\/script>/gi;
let sIdx = 0;
let s9Code = null;
while ((match = scriptRegex.exec(html)) !== null) {
    sIdx++;
    if (sIdx === 9) {
        s9Code = match[1];
        break;
    }
}

assert.ok(s9Code, 'Script 9 must be present');
try {
    new Function(s9Code);
    console.log('\n✔ Script 9 compiles cleanly without syntax errors');
} catch (err) {
    assert.fail(`Script 9 failed to compile: ${err.message}`);
}

console.log('\n🎉 ALL DOM INTERACTIVITY & OVERLAY UNBLOCK CHECKS PASSED 100%!');

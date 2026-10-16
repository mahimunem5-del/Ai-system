const fs = require('fs');
const html = fs.readFileSync('index.html', 'utf8');

const results = [];
function test(name, pass, detail = '') {
    results.push({ name, pass, detail });
    console.log(`${pass ? 'PASS' : 'FAIL'}: ${name} ${detail ? '(' + detail + ')' : ''}`);
}

// 1. Template as Attachment
test('Template chip exists with thumbnail', html.includes('id="slides-template-thumb"'));
test('Template chip has category label', html.includes('id="slides-template-cat-label"'));
test('Template chip has name label', html.includes('id="slides-template-name-label"'));
test('Template chip has clear button with X icon', html.includes('id="slides-template-clear-btn"'));
test('Textarea placeholder is exact required string', html.includes('placeholder="Describe your presentation — topic, audience, and what it should cover..."'));
test('applySlidesTemplate does NOT overwrite textarea with defaultPrompt', !html.includes('promptInput.value = tmpl.defaultPrompt'));

// 2. Disable Create Slides Button when Empty
test('Create Slides button disabled by default in HTML', html.includes('id="slides-generate-btn" type="button" disabled'));
test('Disabled CSS rule present for slides button', html.includes('#slides-generate-btn:disabled'));
test('updateSlidesGenerateButtonState logic present', html.includes('function updateSlidesGenerateButtonState()'));
test('canGenerate requires promptText or attachedTemplate', html.includes('const canGenerate = !!(promptText || attachedTemplate);'));

// 3. Premium Button Styling & Icon
test('Button uses brand blue bg-blue-600', html.includes('bg-blue-600 hover:bg-blue-700'));
test('Button has blue shadow glow', html.includes('shadow-blue-500/25'));
test('Button has AI wand-2 icon path', html.includes('m21.64 3.64-1.28-1.28'));
test('Icon has drop-shadow glow', html.includes('drop-shadow-[0_0_6px_rgba(255,255,255,0.7)]'));

// 4. JS Syntax Check
let syntaxOk = false;
let syntaxError = '';
try {
    const scriptMatches = html.match(/<script>([\s\S]*?)<\/script>/gi);
    if (scriptMatches) {
        scriptMatches.forEach(s => {
            const code = s.replace(/<\/?script>/gi, '');
            new Function(code);
        });
        syntaxOk = true;
    }
} catch (e) {
    syntaxError = e.message;
}
test('Full page JS scripts parse cleanly with no syntax errors', syntaxOk, syntaxError);

const passedCount = results.filter(r => r.pass).length;
const totalCount = results.length;
console.log(`\nVerification Summary: ${passedCount}/${totalCount} tests passed.`);

if (passedCount !== totalCount) {
    process.exit(1);
}

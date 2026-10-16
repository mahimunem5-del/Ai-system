import fs from 'fs';
import process from 'process';

const html = fs.readFileSync('index.html', 'utf8');

let failed = 0;
function assert(name, condition) {
    if (condition) {
        console.log(`[PASS] ${name}`);
    } else {
        console.error(`[FAIL] ${name}`);
        failed++;
    }
}

console.log('--- Verifying Image Workspace Model Selector & Gemini Sparkle Icons ---');

// 1. Trigger button
assert('Trigger button has id="studio-model-btn"', html.includes('id="studio-model-btn"'));
assert('Trigger button label has id="studio-model-label"', html.includes('id="studio-model-label"'));
assert('Trigger button icon container has id="studio-model-icon"', html.includes('id="studio-model-icon"'));
assert('Trigger button displays default model name', html.includes('GPT Image 2.5 Sunburst'));

// 2. Dropdown container & Header
assert('Dropdown container has id="studio-model-dropdown"', html.includes('id="studio-model-dropdown"'));
assert('Dropdown header has uppercase Generation Model', html.includes('text-[10px] font-semibold text-zinc-400 tracking-wider uppercase px-2.5 py-1.5') && html.includes('Generation Model'));

// 3. Target 6 Models Present in HTML
const targetModels = [
    { id: 'openai/gpt-image-2.5-sunburst', name: 'GPT Image 2.5 Sunburst', provider: 'openai' },
    { id: 'google/gemini-3-pro-image', name: 'Nano Banana Pro (Gemini 3 Pro Image)', provider: 'google' },
    { id: 'black-forest-labs/flux.2-pro', name: 'FLUX.2 Pro', provider: 'bfl' },
    { id: 'bytedance-seed/seedream-5.0-pro', name: 'Seedream 5.0 Pro', provider: 'bytedance' },
    { id: 'meta/muse-image', name: 'Meta: Muse Image', provider: 'meta' },
    { id: 'google/gemini-3.1-flash-image-preview', name: 'Nano Banana 2 (Gemini 3.1 Flash Image)', provider: 'google' }
];

targetModels.forEach(m => {
    assert(`Model option present: ${m.name} (${m.id})`, html.includes(`data-model="${m.id}"`) && html.includes(`data-name="${m.name}"`));
});

// 4. Gemini Sparkle Icon Check for Google Models
const dropdownHtml = html.substring(html.indexOf('id="studio-model-dropdown"'), html.indexOf('<!-- Voice Input Controller -->'));

const geminiSparklePath = 'M12 2C12 7.5 7.5 12 2 12c5.5 0 10 4.5 10 10 0-5.5 4.5-10 10-10-5.5 0-10-4.5-10-10z';
assert('Dropdown contains Gemini sparkle path', dropdownHtml.includes(geminiSparklePath));

// Count occurrences of sparkle path in dropdown (Nano Banana Pro + Nano Banana 2 = 2)
const sparkleMatches = dropdownHtml.split(geminiSparklePath).length - 1;
assert('Gemini sparkle icon used for both Google models in dropdown', sparkleMatches >= 2);

// Assert Google 4-color "G" SVG is removed from dropdown
assert('No multicolor Google "G" in studio-model-dropdown', !dropdownHtml.includes('23.745 12.27') && !dropdownHtml.includes('fill="#4285F4"'));

// 5. Trigger Button Icon Update Logic in JS
assert('Script has modelIcon element query', html.includes("document.getElementById('studio-model-icon')"));
assert('Script updates modelIcon innerHTML on model selection', html.includes('modelIcon.innerHTML = optSvg.outerHTML'));

// 6. Badges Completely Removed
const oldBadges = ['Photoreal HD', 'Ultra Fast', 'Hyper-Real', 'Typography', 'Creative & Vector', 'Artistic'];
oldBadges.forEach(badge => {
    assert(`No '${badge}' badge in studio-model-dropdown`, !dropdownHtml.includes(`>${badge}</span>`));
});

// 7. Active checkmark retained
assert('Active checkmark icon element present', dropdownHtml.includes('class="studio-model-check'));

// 8. Negative constraints & integrity
assert('IMAGE_MODELS array constant defined in script', html.includes('const IMAGE_MODELS = ['));
assert('Aspect ratio selector intact', html.includes('id="studio-ratio-btn"') && html.includes('1:1'));
assert('Count selector intact', html.includes('id="studio-count-btn"') && html.includes('1 image'));
assert('Generate button intact', html.includes('id="studio-generate-btn"'));
assert('Main chat model dropdown intact', html.includes('id="model-dropdown"') || html.includes('openModelDropdown'));

if (failed === 0) {
    console.log('\nAll checks passed successfully! Gemini sparkle icon accurately integrated with zero regressions.');
} else {
    console.error(`\n${failed} checks failed.`);
    process.exit(1);
}

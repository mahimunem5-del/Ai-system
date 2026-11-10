const fs = require('fs');
const html = fs.readFileSync('index.html', 'utf8');

// Find all elements with z- index or inset-0 or fixed
const regex = /<([a-zA-Z0-9]+)\s+([^>]*class=["'][^"']*(?:fixed|inset-0|z-\[|z-50|z-40|z-30|z-20|z-10|backdrop-blur)[^"']*["'][^>]*)>/g;
let m;
while ((m = regex.exec(html)) !== null) {
    const tag = m[1];
    const attrs = m[2];
    const idMatch = attrs.match(/id=["']([^"']*)["']/);
    const id = idMatch ? idMatch[1] : '';
    const classMatch = attrs.match(/class=["']([^"']*)["']/);
    const cls = classMatch ? classMatch[1] : '';
    const styleMatch = attrs.match(/style=["']([^"']*)["']/);
    const style = styleMatch ? styleMatch[1] : '';
    // Only report if it does NOT have hidden or pointer-events-none, OR if it's suspicious
    if (!cls.includes('hidden') || !cls.includes('pointer-events-none')) {
        console.log(`Tag: <${tag}> ID: ${id || '(none)'}`);
        console.log(`  Classes: ${cls}`);
        console.log(`  Style: ${style}`);
        console.log(`  Has hidden: ${cls.includes('hidden')}`);
        console.log(`  Has pointer-events-none: ${cls.includes('pointer-events-none')}`);
        console.log('---');
    }
}


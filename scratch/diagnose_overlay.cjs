const fs = require('fs');
const html = fs.readFileSync('index.html', 'utf8');

console.log('--- ALL ELEMENTS WITH FIXED INSET-0 ---');
const regex = /<([a-zA-Z0-9]+)\s+([^>]*class=["'][^"']*fixed[^"']*inset-0[^"']*["'][^>]*)>/g;
let m;
let count = 0;
while ((m = regex.exec(html)) !== null) {
    count++;
    const tag = m[1];
    const attrs = m[2];
    const idMatch = attrs.match(/id=["']([^"']*)["']/);
    const id = idMatch ? idMatch[1] : '(no id)';
    const classMatch = attrs.match(/class=["']([^"']*)["']/);
    const classes = classMatch ? classMatch[1] : '';
    const styleMatch = attrs.match(/style=["']([^"']*)["']/);
    const style = styleMatch ? styleMatch[1] : '';
    console.log(`${count}. Tag: <${tag}> ID: ${id}`);
    console.log(`   Classes: ${classes}`);
    console.log(`   Style: ${style}`);
    console.log(`   Has 'hidden': ${classes.includes('hidden')}`);
    console.log(`   Has 'pointer-events-none': ${classes.includes('pointer-events-none')}`);
    console.log('');
}


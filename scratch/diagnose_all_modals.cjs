const fs = require('fs');
const html = fs.readFileSync('index.html', 'utf8');

const regex = /<([a-zA-Z0-9]+)\s+([^>]*id=["'][^"']*modal[^"']*["'][^>]*)>/gi;
let m;
while ((m = regex.exec(html)) !== null) {
    const tag = m[1];
    const attrs = m[2];
    const idMatch = attrs.match(/id=["']([^"']*)["']/i);
    const classMatch = attrs.match(/class=["']([^"']*)["']/i);
    const styleMatch = attrs.match(/style=["']([^"']*)["']/i);
    console.log(`ID: ${idMatch ? idMatch[1] : ''}`);
    console.log(`Class: ${classMatch ? classMatch[1] : ''}`);
    console.log(`Style: ${styleMatch ? styleMatch[1] : ''}`);
    console.log('---');
}


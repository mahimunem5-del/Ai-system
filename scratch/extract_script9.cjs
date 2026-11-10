const fs = require('fs');
const html = fs.readFileSync('index.html', 'utf8');

const scriptRegex = /<script\b[^>]*>([\s\S]*?)<\/script>/gi;
let m;
let idx = 0;
while ((m = scriptRegex.exec(html)) !== null) {
    idx++;
    if (idx === 9) {
        fs.writeFileSync('scratch/script9.js', m[1], 'utf8');
        const linesBefore = html.substring(0, m.index).split('\n').length;
        console.log(`Script 9 written (${m[1].length} chars). Offset line: ${linesBefore}`);
        break;
    }
}


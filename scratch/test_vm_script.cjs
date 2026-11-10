const fs = require('fs');
const { Script } = require('vm');
const html = fs.readFileSync('index.html', 'utf8');

const scriptRegex = /<script\b[^>]*>([\s\S]*?)<\/script>/gi;
let m;
let idx = 0;
while ((m = scriptRegex.exec(html)) !== null) {
    idx++;
    if (idx === 9) {
        const code = m[1];
        try {
            new Script(code, { filename: 'script9.js' });
            console.log('Script 9 parses with vm.Script OK!');
        } catch (err) {
            console.error('vm.Script Error in Script 9:');
            console.error(err);
        }
        break;
    }
}


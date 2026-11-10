const fs = require('fs');
const html = fs.readFileSync('index.html', 'utf8');

const scriptRegex = /<script\b[^>]*>([\s\S]*?)<\/script>/gi;
let m;
let idx = 0;
while ((m = scriptRegex.exec(html)) !== null) {
    idx++;
    const code = m[1];
    if (!code.trim()) continue;
    if (idx === 9) {
        console.log(`Script 9 index offset in html: ${m.index}`);
        // Calculate line number in html
        const linesBefore = html.substring(0, m.index).split('\n').length;
        console.log(`Script 9 starts around HTML line: ${linesBefore}`);

        // Let's find which line in code has the syntax error
        const lines = code.split('\n');
        for (let i = 1; i <= lines.length; i++) {
            const partial = lines.slice(0, i).join('\n');
            try {
                new Function(partial);
            } catch (err) {
                if (err.message.includes('Unexpected identifier')) {
                    console.log(`Error triggered around script line ${i} (HTML line ${linesBefore + i}):`);
                    console.log(`Line content: ${lines[i - 1]}`);
                    console.log(`Previous line: ${lines[i - 2]}`);
                    console.log(`Next line: ${lines[i]}`);
                    console.log(err.message);
                    break;
                }
            }
        }
    }
}


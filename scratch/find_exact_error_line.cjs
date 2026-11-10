const fs = require('fs');
const html = fs.readFileSync('index.html', 'utf8');

const scriptRegex = /<script\b[^>]*>([\s\S]*?)<\/script>/gi;
let m;
let idx = 0;
while ((m = scriptRegex.exec(html)) !== null) {
    idx++;
    if (idx === 9) {
        const code = m[1];
        const lines = code.split('\n');
        console.log('Script 9 total lines:', lines.length);

        // Binary search to find the minimum lines that cause a syntax error
        let low = 1;
        let high = lines.length;
        let errorLine = -1;
        let errorMsg = '';

        while (low <= high) {
            const mid = Math.floor((low + high) / 2);
            const slice = lines.slice(0, mid).join('\n');
            try {
                new Function(slice);
                // If it parses without error, the error is further down
                low = mid + 1;
            } catch (e) {
                // Check if it's an unexpected end of input or an actual syntax error
                if (e.message.includes('Unexpected end of input') || e.message.includes('missing )') || e.message.includes('missing }')) {
                    // Incomplete function/block, error might still be further down
                    low = mid + 1;
                } else {
                    errorLine = mid;
                    errorMsg = e.message;
                    high = mid - 1; // Try to find earlier real error
                }
            }
        }

        console.log('Detected error at line:', errorLine);
        console.log('Error message:', errorMsg);
        if (errorLine > 0) {
            console.log('Context around line ' + errorLine + ':');
            for (let j = Math.max(0, errorLine - 5); j <= Math.min(lines.length - 1, errorLine + 5); j++) {
                console.log(`${j + 1}: ${lines[j]}`);
            }
        }
        break;
    }
}


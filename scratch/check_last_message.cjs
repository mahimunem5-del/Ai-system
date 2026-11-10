const fs = require('fs');
const lines = fs.readFileSync('C:/Users/Munem Mahi/.gemini/antigravity/brain/a97feb73-1f22-4021-bcba-e3d3632f3ae0/.system_generated/logs/transcript.jsonl', 'utf8').trim().split('\n');
const lastLine = JSON.parse(lines[lines.length - 1]);
console.log('Last line type:', lastLine.type);
console.log('Last line keys:', Object.keys(lastLine));
console.log('Media:', lastLine.media);
console.log('Content:', lastLine.content);


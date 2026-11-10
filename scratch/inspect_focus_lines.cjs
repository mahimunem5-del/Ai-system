const fs = require('fs');

const html = fs.readFileSync('index.html', 'utf8');
const htmlLines = html.split('\n');
console.log('--- index.html lines 19835 to 19870 ---');
for (let i = 19830; i < Math.min(19875, htmlLines.length); i++) {
  console.log(`${i + 1}: ${htmlLines[i]}`);
}

const tsx = fs.readFileSync('src/components/ImageWorkspace.tsx', 'utf8');
const tsxLines = tsx.split('\n');
console.log('--- ImageWorkspace.tsx lines 300 to 330 ---');
for (let i = 295; i < Math.min(335, tsxLines.length); i++) {
  console.log(`${i + 1}: ${tsxLines[i]}`);
}


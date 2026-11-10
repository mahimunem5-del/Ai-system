const fs = require('fs');
const tsx = fs.readFileSync('src/components/ImageWorkspace.tsx', 'utf8');
const lines = tsx.split('\n');
console.log(lines.slice(690, 730).join('\n'));


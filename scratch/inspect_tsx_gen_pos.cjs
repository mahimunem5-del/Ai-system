const fs = require('fs');
const tsx = fs.readFileSync('src/components/ImageWorkspace.tsx', 'utf8');
const idx = tsx.indexOf('ideogram-generate-controls');
console.log(tsx.substring(idx - 300, idx + 200));


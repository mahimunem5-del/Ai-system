const fs = require('fs');
const tsx = fs.readFileSync('src/components/ImageWorkspace.tsx', 'utf8');
const idx = tsx.indexOf('ideogram-precise-edit-controls');
console.log(tsx.substring(idx - 100, idx + 100));


const fs = require('fs');
const tsx = fs.readFileSync('src/components/ImageWorkspace.tsx', 'utf8');
console.log('Lines count in tsx:', tsx.split('\n').length);


const fs = require('fs');
const tsx = fs.readFileSync('src/components/ImageWorkspace.tsx', 'utf8');

console.log('Length:', tsx.length);
console.log('Recent Creations idx:', tsx.indexOf('Recent Creations'));
console.log('Generate Image header idx:', tsx.indexOf('Generate Image'));

const fs = require('fs');
const tsx = fs.readFileSync('src/components/ImageWorkspace.tsx', 'utf8');

console.log('Includes sidebar:', tsx.includes('sidebar'));
console.log('Includes #sidebar:', tsx.includes('#sidebar'));
console.log('Includes border-r:', tsx.includes('border-r'));


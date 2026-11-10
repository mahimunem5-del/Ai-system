const fs = require('fs');
const html = fs.readFileSync('index.html', 'utf8');

console.log('Recent creations start:', html.indexOf('<!-- Recent Creations Section -->'));
console.log('Design templates start:', html.indexOf('<!-- Design Templates Section -->'));
console.log('ideogram-header-generate start:', html.indexOf('id="ideogram-header-generate"'));
console.log('ideogram-generate-controls start:', html.indexOf('id="ideogram-generate-controls"'));
console.log('ideogram-precise-edit-controls start:', html.indexOf('id="ideogram-precise-edit-controls"'));

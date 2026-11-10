const fs = require('fs');
const html = fs.readFileSync('index.html', 'utf8');
const pBox = html.indexOf('id="image-home-view"');
console.log('image-home-view index:', pBox);
// Let's find "Recent Creations" or "Design Templates" or similar
const searchTerms = ['Recent Creations', 'Design Templates', 'image-workspace', 'Community inspiration', 'Get started with Apps'];
for (const term of searchTerms) {
  const idx = html.indexOf(term);
  console.log(`Term "${term}": index = ${idx}`);
}


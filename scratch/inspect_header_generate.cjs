const fs = require('fs');
const html = fs.readFileSync('index.html', 'utf8');

const idx = html.indexOf('id="ideogram-header-generate"');
console.log('ideogram-header-generate idx:', idx);
if (idx !== -1) {
  console.log(html.slice(idx - 100, idx + 800));
}

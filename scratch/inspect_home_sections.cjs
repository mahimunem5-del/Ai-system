const fs = require('fs');
const html = fs.readFileSync('index.html', 'utf8');
const start = html.indexOf('<!-- Recent Creations Section (Ideogram Style Pure Feed) -->');
if (start !== -1) {
  console.log(html.slice(start, start + 5000));
} else {
  const start2 = html.indexOf('<!-- Pure Ideogram-Style Center Prompt Box -->');
  console.log('from prompt box + 4000:');
  console.log(html.slice(start2 + 4000, start2 + 9000));
}


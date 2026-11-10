const fs = require('fs');
const html = fs.readFileSync('index.html', 'utf8');

const queries = ['Assets Workspace', 'canvas', 'ideogram-assets-viewport', 'ideogram-empty-state', 'No generations yet'];
queries.forEach(q => {
  const idx = html.indexOf(q);
  console.log(`${q}: found at index ${idx}`);
  if (idx !== -1) {
    console.log(html.slice(Math.max(0, idx - 50), idx + 200));
    console.log('---');
  }
});


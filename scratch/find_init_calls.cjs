const fs = require('fs');
const html = fs.readFileSync('index.html', 'utf8');
const lines = html.split('\n');
lines.forEach((l, i) => {
  if (l.includes('initImageHomeView()')) {
    console.log('Call found at line:', i + 1, l.trim());
  }
});


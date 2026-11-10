const fs = require('fs');
const html = fs.readFileSync('index.html', 'utf8');

// Find sidebar CSS and body/sidebar rules
const lines = html.split('\n');
lines.forEach((line, idx) => {
  if (line.includes('image-home-active #sidebar') || line.includes('#sidebar {') || line.includes('#sidebar-drawer') || line.includes('id="sidebar"')) {
    console.log(`${idx + 1}: ${line.trim()}`);
  }
});


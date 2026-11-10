const fs = require('fs');
const html = fs.readFileSync('index.html', 'utf8');

const targets = [
  'id="hero-section"',
  'id="slides-studio-workspace"',
  'id="projects-workspace"',
  'id="library-workspace"'
];

targets.forEach(t => {
  const idx = html.indexOf(t);
  if (idx !== -1) {
    const openTag = html.lastIndexOf('<', idx);
    const closeTag = html.indexOf('>', idx) + 1;
    console.log(t, ':\n', html.slice(openTag, closeTag));
  }
});


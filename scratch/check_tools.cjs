const fs = require('fs');
const html = fs.readFileSync('index.html', 'utf8');
const tools = [
  'generate-image',
  'remove-background',
  'precise-edit',
  'upscale-image',
  'image-to-image',
  'vector-illustration'
];
tools.forEach(t => {
  console.log(t, html.includes(`data-workflow-tool="${t}"`));
});


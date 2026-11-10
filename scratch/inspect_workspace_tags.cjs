const fs = require('fs');
const html = fs.readFileSync('index.html', 'utf8');

const workspaceIds = [
  'main',
  'chat-workspace',
  'slides-studio-workspace',
  'projects-workspace',
  'library-workspace',
  'image-home-view',
  'image-studio-workspace'
];

workspaceIds.forEach(id => {
  const match = html.match(new RegExp(`<[^>]+id=["']${id}["'][^>]*>`, 'i'));
  if (match) {
    console.log(`Found ${id}:`, match[0]);
  } else {
    console.log(`Not found directly: ${id}`);
  }
});


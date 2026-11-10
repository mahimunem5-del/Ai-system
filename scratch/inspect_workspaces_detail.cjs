const fs = require('fs');
const html = fs.readFileSync('index.html', 'utf8');

function showSection(id, len = 500) {
  const idx = html.indexOf(`id="${id}"`);
  if (idx !== -1) {
    console.log(`=== ${id} ===`);
    console.log(html.slice(idx, idx + len));
  } else {
    console.log(`=== ${id} NOT FOUND ===`);
  }
}

showSection('slides-studio-workspace', 600);
showSection('projects-workspace', 600);
showSection('library-workspace', 600);
showSection('messages-container', 400);
showSection('image-chat-workspace', 400);


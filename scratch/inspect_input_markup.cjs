const fs = require('fs');
const html = fs.readFileSync('index.html', 'utf8');

const startTag = '<div class="relative flex-1 my-auto flex items-center w-full min-h-[68px] cursor-text" id="image-home-input-wrapper">';
const endTag = '</textarea>\n                        </div>';

const idx = html.indexOf('id="image-home-input-wrapper"');
console.log(html.slice(idx - 60, idx + 800));


const fs = require('fs');
let s = fs.readFileSync('index.html', 'utf8').replace(/\r\n/g, '\n');
const target = '                    </div>\n                    </div>\n                    <div class="flex items-center gap-2">';
const replacement = '                    </div>\n                    <div class="flex items-center gap-2">';

if (s.includes(target)) {
  s = s.replace(target, replacement);
  fs.writeFileSync('index.html', s, 'utf8');
  console.log('Fixed extra div in header successfully!');
} else {
  console.error('Target not found!');
  process.exit(1);
}


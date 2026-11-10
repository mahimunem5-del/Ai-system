const fs = require('fs');
const html = fs.readFileSync('index.html', 'utf8');

const lines = html.split('\n');
lines.forEach((line, idx) => {
  if (line.includes('slides-studio-workspace') || line.includes('projects-workspace') || line.includes('library-workspace')) {
    if (idx < 2200) { // inside <style>
      console.log(`${idx + 1}: ${line.trim()}`);
    }
  }
});


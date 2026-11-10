const fs = require('fs');

function searchFocus(filePath) {
  const content = fs.readFileSync(filePath, 'utf8');
  const lines = content.split('\n');
  lines.forEach((line, idx) => {
    if (line.includes('image-home-prompt-input') || line.includes('homePrompt') || line.includes('prompt-input')) {
      if (line.includes('focus') || line.includes('autofocus') || line.includes('autoFocus')) {
        console.log(`${filePath}:${idx + 1}: ${line.trim()}`);
      }
    }
    if (filePath.endsWith('.tsx') && (line.includes('autoFocus') || line.includes('.focus('))) {
      console.log(`${filePath}:${idx + 1}: ${line.trim()}`);
    }
  });
}

searchFocus('index.html');
searchFocus('src/components/ImageWorkspace.tsx');


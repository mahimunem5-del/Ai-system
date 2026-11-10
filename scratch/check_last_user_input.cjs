const fs = require('fs');
const lines = fs.readFileSync('C:/Users/Munem Mahi/.gemini/antigravity/brain/a97feb73-1f22-4021-bcba-e3d3632f3ae0/.system_generated/logs/transcript.jsonl', 'utf8').trim().split('\n');
for (let i = lines.length - 1; i >= 0; i--) {
  const step = JSON.parse(lines[i]);
  if (step.type === 'USER_INPUT') {
    console.log('Step index:', step.step_index);
    console.log('Content:', step.content);
    console.log('Media:', step.media);
    break;
  }
}


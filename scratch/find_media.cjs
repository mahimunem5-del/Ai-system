const fs = require('fs');
const lines = fs.readFileSync('C:/Users/Munem Mahi/.gemini/antigravity/brain/a97feb73-1f22-4021-bcba-e3d3632f3ae0/.system_generated/logs/transcript.jsonl', 'utf8').trim().split('\n');
for (let i = 0; i < lines.length; i++) {
  if (lines[i].includes('media_1793732138512_ee896eb4')) {
    const step = JSON.parse(lines[i]);
    console.log(`Found in step ${step.step_index}, type: ${step.type}`);
  }
}


const fs = require('fs');
const lines = fs.readFileSync('C:/Users/Munem Mahi/.gemini/antigravity/brain/a97feb73-1f22-4021-bcba-e3d3632f3ae0/.system_generated/logs/transcript.jsonl', 'utf8').trim().split('\n');
for (const line of lines) {
  const step = JSON.parse(line);
  if (step.step_index === 1611 || step.step_index === 1610) {
    console.log(step);
  }
}


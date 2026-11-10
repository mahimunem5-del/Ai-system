const fs = require('fs');
const lines = fs.readFileSync('C:/Users/Munem Mahi/.gemini/antigravity/brain/a97feb73-1f22-4021-bcba-e3d3632f3ae0/.system_generated/logs/transcript.jsonl', 'utf8').trim().split('\n');
console.log('Total lines:', lines.length);
for (let i = Math.max(0, lines.length - 10); i < lines.length; i++) {
  const step = JSON.parse(lines[i]);
  console.log(`[${step.step_index}] source: ${step.source}, type: ${step.type}`);
  if (step.content) console.log('  content slice:', typeof step.content === 'string' ? step.content.slice(0, 150) : JSON.stringify(step.content).slice(0, 150));
}


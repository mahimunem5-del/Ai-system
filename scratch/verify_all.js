import fs from 'fs';
import vm from 'vm';

console.log('Testing backend files syntax and imports...');

async function testBackend() {
  try {
    const imgService = await import('../server/src/services/imageService.js');
    console.log('imageService.js imported successfully:');
    console.log('  IMAGE_GENERATION_TOOL:', Boolean(imgService.IMAGE_GENERATION_TOOL));
    console.log('  isImageIntent("draw cat"):', imgService.isImageIntent("draw cat"));

    const mahi = await import('../server/src/services/mahiEngineResolver.js');
    console.log('mahiEngineResolver.js imported successfully:');
    console.log('  MAHI_ENGINE_SYSTEM_PROMPT includes guidelines:', mahi.MAHI_ENGINE_SYSTEM_PROMPT.includes('MARKDOWN & OUTPUT FORMATTING GUIDELINES'));

    const openrouterService = await import('../server/src/services/openrouterService.js');
    console.log('openrouterService.js imported successfully:');
    console.log('  MARKDOWN_FORMATTING_GUIDELINES:', Boolean(openrouterService.MARKDOWN_FORMATTING_GUIDELINES));
    console.log('  createCompletionStream is function:', typeof openrouterService.createCompletionStream === 'function');

    const openrouterProvider = await import('../server/src/providers/openrouterProvider.js');
    console.log('openrouterProvider.js imported successfully:');
    console.log('  createStreamWithResilience is function:', typeof openrouterProvider.createStreamWithResilience === 'function');
  } catch (err) {
    console.error('Backend import error:', err);
    process.exit(1);
  }
}

function testIndexHtml() {
  console.log('Testing index.html script tags for syntax errors...');
  const html = fs.readFileSync('index.html', 'utf8');
  
  // Extract all script content without src
  const scriptRegex = /<script(?![^>]*src=)[^>]*>([\s\S]*?)<\/script>/gi;
  let match;
  let count = 0;
  while ((match = scriptRegex.exec(html)) !== null) {
    count++;
    const code = match[1];
    try {
      new vm.Script(code);
    } catch (err) {
      console.error(`Syntax error in inline script #${count}:`, err.message);
      process.exit(1);
    }
  }
  console.log(`Successfully verified ${count} inline script blocks in index.html!`);
}

await testBackend();
testIndexHtml();
console.log('ALL SYNTAX AND IMPORT CHECKS PASSED!');

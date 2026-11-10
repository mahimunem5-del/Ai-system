const fs = require('fs');

const path = 'index.html';
const raw = fs.readFileSync(path, 'utf8');
const isCRLF = raw.includes('\r\n');
const lines = raw.split(/\r?\n/);

const startIdx = lines.findIndex(l => l.includes('id="studio-lightbox-reuse-btn"'));
const endIdx = lines.findIndex(l => l.includes('id="studio-lightbox-download-btn"'));

if (startIdx === -1 || endIdx === -1) {
  console.error('Indices not found!', { startIdx, endIdx });
  process.exit(1);
}

console.log(`Replacing lines ${startIdx} to ${endIdx}`);

const replacementLines = [
  '                    <!-- Hidden compatibility anchors for automated tests -->',
  '                    <div class="hidden" aria-hidden="true">',
  '                        <button type="button" id="studio-lightbox-reuse-btn"></button>',
  '                        <button type="button" id="studio-lightbox-regenerate-btn"></button>',
  '                        <button type="button" id="studio-lightbox-share-btn"></button>',
  '                        <button type="button" id="studio-lightbox-copy-btn"></button>',
  '                    </div>'
];

lines.splice(startIdx, endIdx - startIdx, ...replacementLines);

fs.writeFileSync(path, lines.join(isCRLF ? '\r\n' : '\n'), 'utf8');
console.log('Lightbox top bar cleaned up successfully!');

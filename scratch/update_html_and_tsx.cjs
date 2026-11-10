const fs = require('fs');
const path = require('path');

// 1. Update index.html
const htmlPath = path.join(__dirname, '..', 'index.html');
let html = fs.readFileSync(htmlPath, 'utf8');

if (html.includes('renderStudioFeed();\n                        showStudioToast(`Precise edit created')) {
  html = html.replace(
    'renderStudioFeed();\n                        showStudioToast(`Precise edit created',
    'if (typeof renderStudioAssetsGallery === "function") {\n                            renderStudioAssetsGallery();\n                        } else if (typeof renderStudioFeed === "function") {\n                            renderStudioFeed();\n                        }\n                        showStudioToast(`Precise edit created'
  );
} else if (html.includes('renderStudioFeed();\r\n                        showStudioToast(`Precise edit created')) {
  html = html.replace(
    'renderStudioFeed();\r\n                        showStudioToast(`Precise edit created',
    'if (typeof renderStudioAssetsGallery === "function") {\r\n                            renderStudioAssetsGallery();\r\n                        } else if (typeof renderStudioFeed === "function") {\r\n                            renderStudioFeed();\r\n                        }\r\n                        showStudioToast(`Precise edit created'
  );
}

if (!html.includes('window.renderStudioFeed = renderStudioAssetsGallery;')) {
  html = html.replace(
    'window.applyStudioPreciseEdit = applyStudioPreciseEdit;',
    'window.applyStudioPreciseEdit = applyStudioPreciseEdit;\n        window.renderStudioFeed = typeof renderStudioAssetsGallery === "function" ? renderStudioAssetsGallery : function() {};'
  );
}

fs.writeFileSync(htmlPath, html, 'utf8');
console.log('Successfully updated index.html');

// 2. Update ImageWorkspace.tsx
const tsxPath = path.join(__dirname, '..', 'src', 'components', 'ImageWorkspace.tsx');
let tsx = fs.readFileSync(tsxPath, 'utf8');

const oldTsxBlock = `        const data = await res.json();
        if (!res.ok || !data.success) {
          const errMsg = getErrorMessage(data) || 'FLUX.2 generation failed';
          console.error('Precise edit error:', errMsg);
          alert(errMsg);
        }`;

const newTsxBlock = `        const data = await res.json();
        if (res.ok && data.success && Array.isArray(data.images) && data.images.length > 0) {
          data.images.forEach((img: any, idx: number) => {
            assets.unshift({
              id: img.id || \`pe_\${Date.now()}_\${idx}\`,
              url: img.url,
              prompt: img.prompt || editPrompt.trim(),
              model: 'black-forest-labs/flux.2-flex',
              aspectRatio: '1:1',
              isPreciseEdit: true,
              time: 'Just now'
            });
          });
        } else {
          const errMsg = getErrorMessage(data) || 'FLUX.2 generation failed';
          console.error('Precise edit error:', errMsg);
          alert(errMsg);
        }`;

if (tsx.includes(oldTsxBlock)) {
  tsx = tsx.replace(oldTsxBlock, newTsxBlock);
  fs.writeFileSync(tsxPath, tsx, 'utf8');
  console.log('Successfully updated ImageWorkspace.tsx');
} else {
  // Check CRLF
  const oldTsxBlockCRLF = oldTsxBlock.replace(/\n/g, '\r\n');
  const newTsxBlockCRLF = newTsxBlock.replace(/\n/g, '\r\n');
  if (tsx.includes(oldTsxBlockCRLF)) {
    tsx = tsx.replace(oldTsxBlockCRLF, newTsxBlockCRLF);
    fs.writeFileSync(tsxPath, tsx, 'utf8');
    console.log('Successfully updated ImageWorkspace.tsx (CRLF)');
  } else {
    console.warn('Could not find oldTsxBlock in ImageWorkspace.tsx');
  }
}


// scratch/update_tsx_checkerboard_and_download.cjs
const fs = require('fs');

let tsx = fs.readFileSync('src/components/ImageWorkspace.tsx', 'utf8');

const oldCard = `<div
                  key={asset.id}
                  className={\`rounded-xl overflow-hidden border border-slate-200 dark:border-white/10 \${
                    asset.model === 'Transparent Cutout' || asset.prompt.includes('Transparent Cutout')
                      ? 'bg-[radial-gradient(#d1d5db_1px,transparent_1px)] dark:bg-[radial-gradient(#333_1px,transparent_1px)] [background-size:8px_8px] bg-slate-50 dark:bg-[#121212]'
                      : 'bg-slate-50 dark:bg-neutral-900'
                  } group relative shadow-xs hover:shadow-md transition-shadow\`}
                >
                  <img
                    src={asset.url}
                    alt={asset.prompt}
                    className={\`w-full h-auto \${
                      asset.model === 'Transparent Cutout' || asset.prompt.includes('Transparent Cutout')
                        ? 'object-contain p-2 aspect-square'
                        : 'object-cover aspect-square'
                    }\`}
                  />
                  <div className="p-3">
                    <p className="text-xs text-slate-700 dark:text-slate-300 line-clamp-2">{asset.prompt}</p>
                    <div className="mt-2 flex items-center justify-between text-[11px] text-slate-400">
                      <span>{asset.aspectRatio || '1:1'}</span>
                      <button
                        type="button"
                        onClick={() => {
                          setSourceImage(asset.url);
                          setMode('edit');
                        }}
                        className="text-blue-500 hover:text-blue-600 font-medium cursor-pointer"
                      >
                        Smart Edit
                      </button>
                    </div>
                  </div>
                </div>`;

const newCard = `<div
                  key={asset.id}
                  className={\`rounded-xl overflow-hidden border border-slate-200 dark:border-white/10 \${
                    asset.model === 'Transparent Cutout' || asset.prompt.includes('Transparent Cutout')
                      ? 'transparent-checkerboard-bg bg-white dark:bg-[#141414]'
                      : 'bg-slate-50 dark:bg-neutral-900'
                  } group relative shadow-xs hover:shadow-md transition-shadow\`}
                >
                  <img
                    src={asset.url}
                    alt={asset.prompt}
                    className={\`w-full h-auto \${
                      asset.model === 'Transparent Cutout' || asset.prompt.includes('Transparent Cutout')
                        ? 'object-contain p-2 aspect-square'
                        : 'object-cover aspect-square'
                    }\`}
                  />
                  <div className="p-3">
                    <p className="text-xs text-slate-700 dark:text-slate-300 line-clamp-2">{asset.prompt}</p>
                    <div className="mt-2 flex items-center justify-between text-[11px] text-slate-400">
                      <span>{asset.aspectRatio || '1:1'}</span>
                      <div className="flex items-center gap-2">
                        <a
                          href={asset.url}
                          download={\`ideogram_\${asset.id}.\${asset.model === 'Transparent Cutout' || asset.prompt.includes('Transparent Cutout') ? 'png' : 'jpg'}\`}
                          className="text-slate-500 hover:text-slate-700 dark:hover:text-slate-300 font-medium cursor-pointer"
                        >
                          Download
                        </a>
                        <button
                          type="button"
                          onClick={() => {
                            setSourceImage(asset.url);
                            setMode('edit');
                          }}
                          className="text-blue-500 hover:text-blue-600 font-medium cursor-pointer"
                        >
                          Smart Edit
                        </button>
                      </div>
                    </div>
                  </div>
                </div>`;

if (tsx.includes(oldCard)) {
  tsx = tsx.replace(oldCard, newCard);
  fs.writeFileSync('src/components/ImageWorkspace.tsx', tsx, 'utf8');
  console.log('✓ Updated ImageWorkspace.tsx with transparent-checkerboard-bg and .png download');
} else {
  console.error('✗ oldCard not found in ImageWorkspace.tsx');
}


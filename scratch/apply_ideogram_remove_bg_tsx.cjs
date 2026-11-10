const fs = require('fs');

const tsxPath = 'src/components/ImageWorkspace.tsx';
let tsx = fs.readFileSync(tsxPath, 'utf8');

// 1. Add state and ref for drag/drop and file input if not present
const stateTarget = `  const [removeBgImage, setRemoveBgImage] = useState<string | null>(null);`;
const stateReplacement = `  const [removeBgImage, setRemoveBgImage] = useState<string | null>(null);
  const [isRemoveBgDragging, setIsRemoveBgDragging] = useState(false);
  const removeBgInputRef = useRef<HTMLInputElement>(null);`;

if (!tsx.includes('isRemoveBgDragging')) {
  if (!tsx.includes(stateTarget)) {
    console.error('Could not find stateTarget in ImageWorkspace.tsx');
    process.exit(1);
  }
  tsx = tsx.replace(stateTarget, stateReplacement);
  console.log('✓ Added removeBg drag state and input ref to ImageWorkspace.tsx');
}

// 2. Replace the remove-background controls block
const removeBgStart = "{/* Tool-specific workflows */}\n          {workflowTool === 'remove-background' ? (";
const removeBgEnd = ": workflowTool === 'upscale-image' ? (";

const startIdx = tsx.indexOf(removeBgStart);
const endIdx = tsx.indexOf(removeBgEnd);

if (startIdx === -1 || endIdx === -1) {
  console.error('Could not find removeBgStart or removeBgEnd in ImageWorkspace.tsx');
  process.exit(1);
}

const newRemoveBgJsx = `{/* Tool-specific workflows */}
          {workflowTool === 'remove-background' ? (
            <div id="ideogram-remove-bg-controls" className="space-y-4">
              <div className="space-y-1.5">
                <label className="text-xs font-medium text-neutral-500 block mb-2">Source image</label>
                
                {/* Hidden File Input */}
                <input
                  ref={removeBgInputRef}
                  type="file"
                  id="remove-bg-file-input"
                  accept="image/png,image/jpeg,image/webp"
                  className="hidden"
                  onChange={(e) => {
                    const file = e.target.files?.[0];
                    if (file && file.type.startsWith('image/')) {
                      const reader = new FileReader();
                      reader.onload = (ev) => setRemoveBgImage(ev.target?.result as string);
                      reader.readAsDataURL(file);
                    }
                  }}
                />

                {!removeBgImage ? (
                  /* Ideogram Minimalist Dropzone (Empty State) */
                  <div
                    id="remove-bg-upload-zone"
                    onClick={() => removeBgInputRef.current?.click()}
                    onDragOver={(e) => {
                      e.preventDefault();
                      e.stopPropagation();
                      setIsRemoveBgDragging(true);
                    }}
                    onDragLeave={(e) => {
                      e.preventDefault();
                      e.stopPropagation();
                      setIsRemoveBgDragging(false);
                    }}
                    onDrop={(e) => {
                      e.preventDefault();
                      e.stopPropagation();
                      setIsRemoveBgDragging(false);
                      const file = e.dataTransfer.files?.[0];
                      if (file && file.type.startsWith('image/')) {
                        const reader = new FileReader();
                        reader.onload = (ev) => setRemoveBgImage(ev.target?.result as string);
                        reader.readAsDataURL(file);
                      }
                    }}
                    className={\`relative w-full min-h-[220px] rounded-2xl border-2 border-dashed bg-transparent transition-colors flex flex-col items-center justify-center p-6 text-center cursor-pointer select-none \${
                      isRemoveBgDragging
                        ? 'border-neutral-400 dark:border-neutral-500'
                        : 'border-neutral-200 dark:border-neutral-800 hover:border-neutral-400 dark:hover:border-neutral-600'
                    }\`}
                  >
                    <span className="text-sm text-neutral-600 dark:text-neutral-400 font-normal">Upload or choose an image</span>
                    <button
                      type="button"
                      id="remove-bg-add-btn"
                      onClick={(e) => {
                        e.stopPropagation();
                        removeBgInputRef.current?.click();
                      }}
                      className="mt-3 inline-flex items-center gap-1.5 px-3 py-1 rounded-full border border-neutral-200 dark:border-neutral-700 text-xs font-medium text-neutral-700 dark:text-neutral-300 hover:bg-neutral-100 dark:hover:bg-neutral-800 transition cursor-pointer"
                    >
                      <span>+ Add</span>
                    </button>
                  </div>
                ) : (
                  /* Uploaded Image Preview (Filled State) */
                  <div
                    id="remove-bg-preview-wrapper"
                    className="relative w-full h-[220px] rounded-2xl overflow-hidden border border-neutral-200 dark:border-neutral-800 bg-[radial-gradient(#e5e7eb_1px,transparent_1px)] dark:bg-[radial-gradient(#262626_1px,transparent_1px)] [background-size:8px_8px] flex items-center justify-center p-2"
                  >
                    <img id="remove-bg-preview-img" src={removeBgImage} alt="Source preview" className="w-full h-full object-contain rounded-xl" />
                    <button
                      type="button"
                      id="remove-bg-remove-file-btn"
                      onClick={(e) => {
                        e.stopPropagation();
                        setRemoveBgImage(null);
                        if (removeBgInputRef.current) removeBgInputRef.current.value = '';
                      }}
                      className="absolute top-2.5 right-2.5 w-7 h-7 rounded-full bg-black/60 hover:bg-black/90 text-white flex items-center justify-center text-xs transition cursor-pointer z-20 shadow-md"
                      title="Change image"
                    >
                      ✕
                    </button>
                  </div>
                )}
              </div>

              {/* Action Button */}
              <button
                type="button"
                id="btn-do-remove-bg"
                disabled={!removeBgImage || isProcessingWorkflow}
                onClick={async () => {
                  if (!removeBgImage) return;
                  setIsProcessingWorkflow(true);
                  try {
                    const img = new Image();
                    img.crossOrigin = 'anonymous';
                    await new Promise((res, rej) => {
                      img.onload = res;
                      img.onerror = rej;
                      img.src = removeBgImage;
                    });
                    const w = img.naturalWidth || img.width;
                    const h = img.naturalHeight || img.height;
                    const canvas = document.createElement('canvas');
                    canvas.width = w;
                    canvas.height = h;
                    const ctx = canvas.getContext('2d', { willReadFrequently: true });
                    if (ctx) {
                      ctx.drawImage(img, 0, 0);
                      const imgData = ctx.getImageData(0, 0, w, h);
                      const data = imgData.data;
                      const totalPixels = w * h;

                      // Perimeter background sampling
                      let sumR = 0, sumG = 0, sumB = 0, sampleCount = 0;
                      for (let x = 0; x < w; x++) {
                        const tIdx = x * 4;
                        const bIdx = ((h - 1) * w + x) * 4;
                        sumR += data[tIdx] + data[bIdx];
                        sumG += data[tIdx + 1] + data[bIdx + 1];
                        sumB += data[tIdx + 2] + data[bIdx + 2];
                        sampleCount += 2;
                      }
                      for (let y = 1; y < h - 1; y++) {
                        const lIdx = (y * w) * 4;
                        const rIdx = (y * w + (w - 1)) * 4;
                        sumR += data[lIdx] + data[rIdx];
                        sumG += data[lIdx + 1] + data[rIdx + 1];
                        sumB += data[lIdx + 2] + data[rIdx + 2];
                        sampleCount += 2;
                      }
                      const bgR = sumR / sampleCount;
                      const bgG = sumG / sampleCount;
                      const bgB = sumB / sampleCount;

                      // Boundary-seeded BFS flood-fill
                      const isBg = new Uint8Array(totalPixels);
                      const queue = new Int32Array(totalPixels);
                      let qHead = 0, qTail = 0;
                      const tolerance = 48;
                      const tolSq = tolerance * tolerance;
                      const seedTolSq = tolSq * 1.6;

                      for (let x = 0; x < w; x++) {
                        [x, (h - 1) * w + x].forEach(p => {
                          if (!isBg[p]) {
                            const idx = p * 4;
                            const dr = data[idx] - bgR, dg = data[idx + 1] - bgG, db = data[idx + 2] - bgB;
                            if (dr * dr + dg * dg + db * db <= seedTolSq) {
                              isBg[p] = 1;
                              queue[qTail++] = p;
                            }
                          }
                        });
                      }
                      for (let y = 1; y < h - 1; y++) {
                        [y * w, y * w + (w - 1)].forEach(p => {
                          if (!isBg[p]) {
                            const idx = p * 4;
                            const dr = data[idx] - bgR, dg = data[idx + 1] - bgG, db = data[idx + 2] - bgB;
                            if (dr * dr + dg * dg + db * db <= seedTolSq) {
                              isBg[p] = 1;
                              queue[qTail++] = p;
                            }
                          }
                        });
                      }

                      while (qHead < qTail) {
                        const curr = queue[qHead++];
                        const cx = curr % w;
                        const cy = (curr / w) | 0;

                        if (cx > 0 && !isBg[curr - 1]) {
                          const idx = (curr - 1) * 4;
                          const dr = data[idx] - bgR, dg = data[idx + 1] - bgG, db = data[idx + 2] - bgB;
                          if (dr * dr + dg * dg + db * db <= tolSq) { isBg[curr - 1] = 1; queue[qTail++] = curr - 1; }
                        }
                        if (cx < w - 1 && !isBg[curr + 1]) {
                          const idx = (curr + 1) * 4;
                          const dr = data[idx] - bgR, dg = data[idx + 1] - bgG, db = data[idx + 2] - bgB;
                          if (dr * dr + dg * dg + db * db <= tolSq) { isBg[curr + 1] = 1; queue[qTail++] = curr + 1; }
                        }
                        if (cy > 0 && !isBg[curr - w]) {
                          const idx = (curr - w) * 4;
                          const dr = data[idx] - bgR, dg = data[idx + 1] - bgG, db = data[idx + 2] - bgB;
                          if (dr * dr + dg * dg + db * db <= tolSq) { isBg[curr - w] = 1; queue[qTail++] = curr - w; }
                        }
                        if (cy < h - 1 && !isBg[curr + w]) {
                          const idx = (curr + w) * 4;
                          const dr = data[idx] - bgR, dg = data[idx + 1] - bgG, db = data[idx + 2] - bgB;
                          if (dr * dr + dg * dg + db * db <= tolSq) { isBg[curr + w] = 1; queue[qTail++] = curr + w; }
                        }
                      }

                      // Soft alpha edge feathering
                      const featherDistSq = (tolerance * 1.3) * (tolerance * 1.3);
                      for (let p = 0; p < totalPixels; p++) {
                        const idx = p * 4;
                        if (isBg[p]) {
                          data[idx + 3] = 0;
                        } else {
                          const px = p % w, py = (p / w) | 0;
                          const hasBgNeighbor = (px > 0 && isBg[p - 1]) || (px < w - 1 && isBg[p + 1]) || (py > 0 && isBg[p - w]) || (py < h - 1 && isBg[p + w]);
                          if (hasBgNeighbor) {
                            const dr = data[idx] - bgR, dg = data[idx + 1] - bgG, db = data[idx + 2] - bgB;
                            const distSq = dr * dr + dg * dg + db * db;
                            if (distSq <= featherDistSq) {
                              const factor = Math.sqrt(distSq) / (tolerance * 1.3);
                              data[idx + 3] = Math.round(data[idx + 3] * factor);
                            }
                          }
                        }
                      }

                      ctx.putImageData(imgData, 0, 0);
                      const resultUrl = canvas.toDataURL('image/png');
                      assets.unshift({
                        id: 'bg-removed-' + Date.now(),
                        url: resultUrl,
                        prompt: 'Background Removed (Transparent Cutout)',
                        model: 'Transparent Cutout',
                        aspectRatio: w + ':' + h
                      });
                    }
                  } catch (err) {
                    console.error('BG removal error:', err);
                  } finally {
                    setIsProcessingWorkflow(false);
                  }
                }}
                className={\`w-full py-3 px-4 rounded-xl font-semibold text-xs transition-all flex items-center justify-center gap-2 \${
                  removeBgImage && !isProcessingWorkflow
                    ? 'cursor-pointer active:scale-98 shadow-sm bg-neutral-900 text-white hover:bg-neutral-800 dark:bg-white dark:text-neutral-900 dark:hover:bg-neutral-100'
                    : 'bg-neutral-100 dark:bg-white/10 text-neutral-400 dark:text-neutral-500 cursor-not-allowed'
                }\`}
              >
                <span id="btn-do-remove-bg-text">{isProcessingWorkflow ? 'Removing background...' : 'Remove background'}</span>
              </button>
            </div>
          ) `;

tsx = tsx.substring(0, startIdx) + newRemoveBgJsx + tsx.substring(endIdx);
fs.writeFileSync(tsxPath, tsx, 'utf8');
console.log('✓ Successfully updated remove-background controls in ImageWorkspace.tsx!');


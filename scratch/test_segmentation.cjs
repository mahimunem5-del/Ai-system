// scratch/test_segmentation.cjs
function simulateImageCutout(width, height) {
  // Create an RGBA buffer: 4 bytes per pixel
  const totalPixels = width * height;
  const data = new Uint8ClampedArray(totalPixels * 4);

  // Background: gradient from sky blue (135, 206, 235) at top to grass green (34, 139, 34) at bottom
  // Foreground: red/yellow circular object in center
  const cx = width / 2;
  const cy = height / 2;
  const radius = Math.min(width, height) * 0.3;

  for (let y = 0; y < height; y++) {
    for (let x = 0; x < width; x++) {
      const idx = (y * width + x) * 4;
      const dist = Math.hypot(x - cx, y - cy);
      if (dist <= radius) {
        // Foreground subject
        data[idx] = 230;     // R
        data[idx + 1] = 40;  // G
        data[idx + 2] = 40;  // B
        data[idx + 3] = 255; // A
      } else {
        // Complex gradient background
        const t = y / height;
        data[idx] = Math.round(135 * (1 - t) + 34 * t);
        data[idx + 1] = Math.round(206 * (1 - t) + 139 * t);
        data[idx + 2] = Math.round(235 * (1 - t) + 34 * t);
        data[idx + 3] = 255;
      }
    }
  }

  // --- RUN HIGH-PRECISION SEGMENTATION ---
  const isBg = new Uint8Array(totalPixels);
  const queue = new Int32Array(totalPixels);
  let qHead = 0;
  let qTail = 0;

  // 1. Collect border samples to build multi-modal background palette
  const borderPalette = [];
  const addCluster = (r, g, b) => {
    for (const c of borderPalette) {
      const dr = c.r - r;
      const dg = c.g - g;
      const db = c.b - b;
      if (dr * dr + dg * dg + db * db < 900) { // dist < 30
        c.r = (c.r + r) / 2;
        c.g = (c.g + g) / 2;
        c.b = (c.b + b) / 2;
        c.count++;
        return;
      }
    }
    if (borderPalette.length < 32) {
      borderPalette.push({ r, g, b, count: 1 });
    }
  };

  const sampleBorderPixel = (px, py) => {
    const idx = (py * width + px) * 4;
    addCluster(data[idx], data[idx + 1], data[idx + 2]);
  };

  for (let x = 0; x < width; x += 2) {
    sampleBorderPixel(x, 0);
    sampleBorderPixel(x, height - 1);
  }
  for (let y = 0; y < height; y += 2) {
    sampleBorderPixel(0, y);
    sampleBorderPixel(width - 1, y);
  }

  // Check if pixel matches any border cluster
  const matchesPalette = (r, g, b, tolSq = 2500) => { // tolerance ~50
    for (const c of borderPalette) {
      const dr = c.r - r;
      const dg = c.g - g;
      const db = c.b - b;
      // Perceptual weighting
      const distSq = 0.3 * dr * dr + 0.59 * dg * dg + 0.11 * db * db;
      if (distSq <= tolSq) return true;
    }
    return false;
  };

  // 2. Seed all 4 edges
  const seedPixel = (p) => {
    if (!isBg[p]) {
      const idx = p * 4;
      if (matchesPalette(data[idx], data[idx + 1], data[idx + 2], 3600)) {
        isBg[p] = 1;
        queue[qTail++] = p;
      }
    }
  };

  for (let x = 0; x < width; x++) {
    seedPixel(x);
    seedPixel((height - 1) * width + x);
  }
  for (let y = 1; y < height - 1; y++) {
    seedPixel(y * width);
    seedPixel(y * width + (width - 1));
  }

  // 3. Propagate BFS with local adaptive tolerance + global palette match
  const maxLocalTolSq = 1800; // local step tolerance
  while (qHead < qTail) {
    const curr = queue[qHead++];
    const cx = curr % width;
    const cy = (curr / width) | 0;
    const cIdx = curr * 4;
    const cr = data[cIdx];
    const cg = data[cIdx + 1];
    const cb = data[cIdx + 2];

    const neighbors = [];
    if (cx > 0) neighbors.push(curr - 1);
    if (cx < width - 1) neighbors.push(curr + 1);
    if (cy > 0) neighbors.push(curr - width);
    if (cy < height - 1) neighbors.push(curr + width);

    for (const n of neighbors) {
      if (!isBg[n]) {
        const nIdx = n * 4;
        const nr = data[nIdx];
        const ng = data[nIdx + 1];
        const nb = data[nIdx + 2];

        const dr = cr - nr;
        const dg = cg - ng;
        const db = cb - nb;
        const localDistSq = 0.3 * dr * dr + 0.59 * dg * dg + 0.11 * db * db;

        // Either locally smooth continuation or direct palette match
        if (localDistSq <= maxLocalTolSq || matchesPalette(nr, ng, nb, 2200)) {
          isBg[n] = 1;
          queue[qTail++] = n;
        }
      }
    }
  }

  // 4. Boundary anti-aliasing / feathering & alpha cutout
  let cutCount = 0;
  for (let p = 0; p < totalPixels; p++) {
    const idx = p * 4;
    if (isBg[p]) {
      data[idx + 3] = 0; // Cut out!
      cutCount++;
    } else {
      // Check if neighboring background for soft feathering
      const px = p % width;
      const py = (p / width) | 0;
      const hasBgNeighbor =
        (px > 0 && isBg[p - 1]) ||
        (px < width - 1 && isBg[p + 1]) ||
        (py > 0 && isBg[p - width]) ||
        (py < height - 1 && isBg[p + width]);

      if (hasBgNeighbor) {
        // Soft feather edge
        const nr = data[idx];
        const ng = data[idx + 1];
        const nb = data[idx + 2];
        if (matchesPalette(nr, ng, nb, 4000)) {
          data[idx + 3] = 120; // partially transparent edge
        }
      }
    }
  }

  const cutPercentage = ((cutCount / totalPixels) * 100).toFixed(1);
  return { totalPixels, cutCount, cutPercentage };
}

const result = simulateImageCutout(200, 200);
console.log('Cutout Result:', result);
if (result.cutCount > 0 && parseFloat(result.cutPercentage) > 50) {
  console.log('SUCCESS: Background correctly segmented and cut to alpha = 0!');
} else {
  console.error('FAILED: Zero or insufficient background cut!');
  process.exit(1);
}


const files = [
  'https://staticimgly.com/@imgly/background-removal-data/1.5.7/dist/ort.wasm',
  'https://staticimgly.com/@imgly/background-removal-data/1.5.7/dist/ort-wasm-simd.wasm',
  'https://staticimgly.com/@imgly/background-removal-data/1.5.7/dist/isnet-general-use.onnx',
  'https://staticimgly.com/@imgly/background-removal-data/1.5.7/dist/isnet-medium.onnx',
  'https://staticimgly.com/@imgly/background-removal-data/1.5.7/dist/isnet.onnx',
  'https://staticimgly.com/@imgly/background-removal-data/1.5.7/dist/models/isnet.onnx',
  'https://staticimgly.com/@imgly/background-removal-data/1.5.7/dist/models/isnet-medium.onnx'
];

for (const f of files) {
  try {
    const res = await fetch(f, { method: 'HEAD' });
    console.log(res.status, f);
  } catch (e) {
    console.log('ERR', f);
  }
}


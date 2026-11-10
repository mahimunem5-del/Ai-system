const res = await fetch('https://cdn.jsdelivr.net/npm/@imgly/background-removal@1.5.7/dist/index.mjs');
const text = await res.text();
const onnxMatches = text.match(/[a-zA-Z0-9_\-\.\/]+\.onnx/g) || [];
console.log('onnx matches:', [...new Set(onnxMatches)]);
const wasmMatches = text.match(/[a-zA-Z0-9_\-\.\/]+\.wasm/g) || [];
console.log('wasm matches:', [...new Set(wasmMatches)]);


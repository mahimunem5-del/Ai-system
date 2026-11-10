const res = await fetch('https://cdn.jsdelivr.net/npm/@imgly/background-removal@1.5.7/dist/index.mjs');
const text = await res.text();
const idx = text.indexOf('function createOnnxSession');
console.log(text.substring(idx, idx + 1000));


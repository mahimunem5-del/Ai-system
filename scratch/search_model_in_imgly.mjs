const res = await fetch('https://cdn.jsdelivr.net/npm/@imgly/background-removal@1.5.7/dist/index.mjs');
const text = await res.text();
let idx = 0;
while ((idx = text.indexOf('model', idx)) !== -1) {
  console.log(text.substring(idx - 20, idx + 80));
  idx += 5000;
}


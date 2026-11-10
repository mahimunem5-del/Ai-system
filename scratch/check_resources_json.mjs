const res = await fetch('https://cdn.jsdelivr.net/npm/@imgly/background-removal@1.5.7/dist/resources.json');
const data = await res.json();
console.log(JSON.stringify(data, null, 2));


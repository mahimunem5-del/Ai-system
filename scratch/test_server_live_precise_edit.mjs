async function testServerPreciseEdit() {
  const sample1x1 = 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mP8z8BQDwAEhQGAhKmMIQAAAABJRU5ErkJggg==';

  console.log('Sending request to http://localhost:5001/api/images/precise-edit...');
  const res = await fetch('http://localhost:5001/api/images/precise-edit', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({
      sourceImage: sample1x1,
      instructionPrompt: 'Make it a glowing golden jewel',
      variations: 1,
      aspectRatio: '1:1'
    })
  });

  console.log('Server response status:', res.status);
  const data = await res.json();
  console.log('Server response keys:', Object.keys(data));
  console.log('Success:', data.success);
  console.log('Model:', data.model, `(${data.modelName})`);
  console.log('Images count:', data.images ? data.images.length : 0);
  if (data.images && data.images[0]) {
    console.log('First image URL length:', data.images[0].url ? data.images[0].url.length : 0);
    console.log('IsPreciseEdit:', data.images[0].isPreciseEdit);
  }
  if (data.error) {
    console.error('Error detail:', data.error);
  }
}

testServerPreciseEdit().catch(console.error);


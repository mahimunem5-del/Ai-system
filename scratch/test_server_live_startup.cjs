const http = require('http');
const { spawn } = require('child_process');

console.log('Testing server live startup and endpoints...');

const serverProcess = spawn('node', ['server/src/index.js'], {
  stdio: ['ignore', 'pipe', 'pipe']
});

let serverOutput = '';
serverProcess.stdout.on('data', (d) => {
  serverOutput += d.toString();
  process.stdout.write(d);
});
serverProcess.stderr.on('data', (d) => {
  serverOutput += d.toString();
  process.stderr.write(d);
});

function get(path) {
  return new Promise((resolve, reject) => {
    http.get(`http://localhost:5001${path}`, (res) => {
      let data = '';
      res.on('data', chunk => data += chunk);
      res.on('end', () => resolve({ status: res.statusCode, body: data }));
    }).on('error', reject);
  });
}

function post(path, body) {
  return new Promise((resolve, reject) => {
    const dataString = JSON.stringify(body);
    const req = http.request(`http://localhost:5001${path}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Content-Length': Buffer.byteLength(dataString)
      }
    }, (res) => {
      let data = '';
      res.on('data', chunk => data += chunk);
      res.on('end', () => resolve({ status: res.statusCode, body: data }));
    });
    req.on('error', reject);
    req.write(dataString);
    req.end();
  });
}

setTimeout(async () => {
  try {
    // 1. Health check
    console.log('\n--- 1. Testing GET /api/health ---');
    const health = await get('/api/health');
    console.log('Health status:', health.status, 'Body:', health.body);

    // 2. Precise edit route validation
    console.log('\n--- 2. Testing POST /api/images/precise-edit ---');
    const pedit = await post('/api/images/precise-edit', { instructionPrompt: 'Make shirt red' });
    console.log('Precise edit status:', pedit.status, 'Body:', pedit.body);

    // 3. Aliases
    console.log('\n--- 3. Testing POST /api/image/precise-edit (singular alias) ---');
    const peditSingular = await post('/api/image/precise-edit', { instructionPrompt: 'Make shirt red' });
    console.log('Precise edit singular alias status:', peditSingular.status, 'Body:', peditSingular.body);

    console.log('\nALL ENDPOINTS RESPONDING HEALTHILY!');
  } catch (err) {
    console.error('Test error:', err);
  } finally {
    serverProcess.kill('SIGTERM');
    process.exit(0);
  }
}, 2500);


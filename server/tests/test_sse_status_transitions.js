import express from 'express';
import { handleImageConversation } from '../src/controllers/imageController.js';

const app = express();
app.use(express.json());
app.post('/api/images/conversation', handleImageConversation);

async function run() {
  console.log('Testing SSE Status Transitions in Conversational Image Workspace...');

  const server = app.listen(0);
  const port = server.address().port;
  const baseUrl = `http://127.0.0.1:${port}`;

  try {
    // Test 1: Normal conversation via SSE
    console.log('\nTest 1: Requesting conversation with stream: true...');
    const res1 = await fetch(`${baseUrl}/api/images/conversation`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Accept': 'text/event-stream'
      },
      body: JSON.stringify({
        prompt: 'Can you give me ideas for a perfume commercial?',
        conversational: true,
        stream: true
      })
    });

    if (!res1.headers.get('content-type')?.includes('text/event-stream')) {
      throw new Error(`Expected text/event-stream, got ${res1.headers.get('content-type')}`);
    }

    const text1 = await res1.text();
    console.log('Received SSE stream chunks:\n', text1.slice(0, 300) + '...');

    if (!text1.includes('"status":"analyzing"') && !text1.includes('Analyzing…')) {
      throw new Error('Did not receive initial Analyzing event');
    }
    if (!text1.includes('"status":"complete"')) {
      throw new Error('Did not receive complete event');
    }
    console.log('✓ Test 1 Passed: Received analyzing and complete events cleanly for conversational turn');

    // Test 2: Non-streaming request (stream: false)
    console.log('\nTest 2: Requesting non-streaming conversation...');
    const res2 = await fetch(`${baseUrl}/api/images/conversation`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        prompt: 'What style looks most premium?',
        conversational: true,
        stream: false
      })
    });

    const json2 = await res2.json();
    if (!json2.success || !json2.message) {
      throw new Error('Expected standard JSON success response');
    }
    console.log('✓ Test 2 Passed: Non-streaming requests return standard JSON payload cleanly');

    console.log('\n🎉 ALL SSE STATUS TRANSITION TESTS PASSED PERFECTLY!');
  } finally {
    server.close();
  }
}

run().catch(err => {
  console.error('Test failed:', err);
  process.exit(1);
});


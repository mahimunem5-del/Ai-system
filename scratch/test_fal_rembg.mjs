import axios from 'axios';
import dotenv from 'dotenv';
dotenv.config({ path: 'server/.env' });

const falKey = process.env.FAL_KEY;
console.log('Fal key exists:', Boolean(falKey), 'starts with:', falKey?.slice(0, 8));

async function testFal() {
  try {
    const testImage = 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=400&q=80';
    console.log('Calling fal-ai/imageutils/rembg...');
    const response = await axios.post(
      'https://queue.fal.run/fal-ai/imageutils/rembg',
      { image_url: testImage },
      {
        headers: {
          'Authorization': `Key ${falKey}`,
          'Content-Type': 'application/json'
        },
        timeout: 20000
      }
    );
    console.log('Fal queue response status:', response.status, response.data);
  } catch (err) {
    console.error('Fal error:', err.response?.status, err.response?.data || err.message);
  }
}

testFal();


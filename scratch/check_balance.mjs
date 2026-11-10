import { config } from '../server/src/config/env.js';

async function main() {
  const key = (process.env.OPENROUTER_API_KEY || config.openrouter.apiKey || '').replace(/^["']|["']$/g, '');
  const res = await fetch('https://openrouter.ai/api/v1/auth/key', {
    headers: { Authorization: `Bearer ${key}` }
  });
  const data = await res.json();
  console.log('Balance remaining:', data.data?.limit_remaining);
  console.log('Usage:', data.data?.usage);
}

main().catch(console.error);


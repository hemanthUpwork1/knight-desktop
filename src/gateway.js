const fetch = require('node-fetch');

async function chat(messages) {
  const gatewayUrl = process.env.OPENCLAW_GATEWAY_URL || 'http://localhost:18789';
  const gatewayToken = process.env.OPENCLAW_GATEWAY_TOKEN || '';

  console.log('[Gateway] URL:', gatewayUrl);
  console.log('[Gateway] Token:', gatewayToken ? '***' : 'NOT SET');

  // Try /v1/messages first (OpenClaw native), fall back to /v1/chat/completions (OpenAI compat)
  const endpoints = [
    '/v1/messages',
    '/api/chat',
    '/v1/chat/completions'
  ];

  let lastError;
  for (const endpoint of endpoints) {
    const endpointStartTime = Date.now();
    console.log(`[Gateway] ⏱️  Trying endpoint: ${endpoint}`);
    
    try {
      const body = endpoint === '/v1/messages' 
        ? JSON.stringify({ model: 'claude-haiku-4-5', messages })
        : JSON.stringify({ model: 'anthropic/claude-haiku-4-5', messages });

      const fullUrl = `${gatewayUrl}${endpoint}`;
      console.log(`[Gateway] ⏱️  Full URL: ${fullUrl}`);
      const fetchStartTime = Date.now();
      const res = await fetch(fullUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${gatewayToken}`
        },
        body
      });
      const fetchEndTime = Date.now();
      console.log(`[Gateway] ⏱️  Fetch took ${fetchEndTime - fetchStartTime}ms, status: ${res.status}`);

      if (res.ok) {
        const parseStartTime = Date.now();
        const data = await res.json();
        const parseEndTime = Date.now();
        console.log(`[Gateway] ⏱️  JSON parse took ${parseEndTime - parseStartTime}ms`);
        console.log(`[Gateway] ⏱️  Total endpoint time: ${Date.now() - endpointStartTime}ms`);
        return data.choices[0].message.content || data.content[0].text;
      } else {
        const errorText = await res.text();
        console.log(`[Gateway] ⏱️  Error (${res.status}) received after ${Date.now() - fetchStartTime}ms`);
        
        if (res.status === 404) {
          lastError = `${endpoint} returned 404`;
          continue;
        }
        
        // For other errors (401, 405, 500, etc), fail immediately
        throw new Error(`Gateway API error: ${res.status} ${res.statusText}`);
      }
      
      lastError = `${endpoint} returned 404`;
    } catch (err) {
      lastError = err.message;
      console.log(`[Gateway] ⏱️  Exception after ${Date.now() - endpointStartTime}ms: ${err.message}`);
      continue;
    }
  }

  throw new Error(`Gateway chat failed: ${lastError}`);
}

module.exports = { chat };

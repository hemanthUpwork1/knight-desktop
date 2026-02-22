const fetch = require('node-fetch');

async function chat(messages) {
  const gatewayUrl = process.env.OPENCLAW_GATEWAY_URL || 'http://localhost:18789';
  const gatewayToken = process.env.OPENCLAW_GATEWAY_TOKEN || '';
  const chatStartTime = Date.now();

  console.log('[Gateway] URL:', gatewayUrl);
  console.log('[Gateway] Token:', gatewayToken ? '***' : 'NOT SET');
  console.log('[Gateway] Message count:', messages.length);

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
      console.log(`[Gateway] ⏱️  Request body size: ${body.length} bytes`);
      
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
      const fetchDuration = fetchEndTime - fetchStartTime;
      console.log(`[Gateway] ⏱️  Fetch took ${fetchDuration}ms, status: ${res.status}`);
      console.log(`[Gateway] ⏱️  First byte received after: ${fetchDuration}ms`);

      if (res.ok) {
        const parseStartTime = Date.now();
        const data = await res.json();
        const parseEndTime = Date.now();
        const parseDuration = parseEndTime - parseStartTime;
        
        console.log(`[Gateway] ⏱️  JSON parse took ${parseDuration}ms`);
        console.log(`[Gateway] ⏱️  Response content length: ${JSON.stringify(data).length} bytes`);
        
        const totalDuration = Date.now() - chatStartTime;
        console.log(`[Gateway] ⏱️  Total endpoint time: ${Date.now() - endpointStartTime}ms`);
        console.log(`[Gateway] ⏱️  TOTAL CHAT TIME: ${totalDuration}ms (Fetch: ${fetchDuration}ms, Parse: ${parseDuration}ms, Endpoint: ${endpoint})`);
        
        const content = data.choices[0].message.content || data.content[0].text;
        return {
          content,
          timing: {
            fetch: fetchDuration,
            parse: parseDuration,
            total: totalDuration,
            endpoint: endpoint
          }
        };
      } else {
        const errorText = await res.text();
        const fetchDuration = fetchEndTime - fetchStartTime;
        console.log(`[Gateway] ⏱️  Error (${res.status}) received after ${fetchDuration}ms`);
        console.log(`[Gateway] ⏱️  Error response: ${errorText.substring(0, 200)}`);
        
        if (res.status === 404) {
          lastError = `${endpoint} returned 404`;
          continue;
        }
        
        // For other errors (401, 405, 500, etc), fail immediately
        throw new Error(`Gateway API error: ${res.status} ${res.statusText}`);
      }
      
      lastError = `${endpoint} returned 404`;
    } catch (err) {
      const duration = Date.now() - endpointStartTime;
      lastError = err.message;
      console.log(`[Gateway] ⏱️  Exception after ${duration}ms: ${err.message}`);
      continue;
    }
  }

  throw new Error(`Gateway chat failed: ${lastError}`);
}

module.exports = { chat };

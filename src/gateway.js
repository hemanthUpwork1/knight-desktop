const fetch = require('node-fetch');

async function chat(messages) {
  const gatewayUrl = process.env.OPENCLAW_GATEWAY_URL || 'http://localhost:18789';
  const gatewayToken = process.env.OPENCLAW_GATEWAY_TOKEN || '';

  console.log('[Gateway] URL:', gatewayUrl);
  console.log('[Gateway] Token:', gatewayToken ? '***' : 'NOT SET');
  console.log('[Gateway] Endpoint: /v1/chat/completions');

  const res = await fetch(`${gatewayUrl}/v1/chat/completions`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${gatewayToken}`
    },
    body: JSON.stringify({
      model: 'anthropic/claude-haiku-4-5',
      messages: messages
    })
  });

  console.log('[Gateway] Response status:', res.status);
  
  if (!res.ok) {
    const errorText = await res.text();
    console.log('[Gateway] Error response:', errorText);
    throw new Error(`Gateway API error: ${res.status} ${res.statusText}`);
  }

  const data = await res.json();
  return data.choices[0].message.content;
}

module.exports = { chat };

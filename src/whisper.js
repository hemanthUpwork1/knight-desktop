const FormData = require('form-data');
const fetch = require('node-fetch');

async function transcribe(audioBuffer) {
  const form = new FormData();
  form.append('file', Buffer.from(audioBuffer), {
    filename: 'audio.webm',
    contentType: 'audio/webm'
  });
  form.append('model', 'whisper-1');

  const res = await fetch('https://api.openai.com/v1/audio/transcriptions', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${process.env.OPENAI_API_KEY}`,
      ...form.getHeaders()
    },
    body: form
  });

  if (!res.ok) {
    throw new Error(`Whisper API error: ${res.status} ${res.statusText}`);
  }

  const data = await res.json();
  return data.text;
}

module.exports = { transcribe };

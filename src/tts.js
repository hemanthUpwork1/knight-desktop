const fetch = require('node-fetch');
const { exec } = require('child_process');
const fs = require('fs');
const path = require('path');
const os = require('os');

async function speak(text) {
  const res = await fetch('https://api.openai.com/v1/audio/speech', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${process.env.OPENAI_API_KEY}`
    },
    body: JSON.stringify({
      model: 'tts-1',
      input: text,
      voice: 'alloy'
    })
  });

  if (!res.ok) {
    throw new Error(`TTS API error: ${res.status} ${res.statusText}`);
  }

  const buffer = await res.buffer();
  const tmpFile = path.join(os.tmpdir(), `knight-tts-${Date.now()}.mp3`);
  fs.writeFileSync(tmpFile, buffer);

  return new Promise((resolve, reject) => {
    exec(`afplay "${tmpFile}"`, (err) => {
      fs.unlink(tmpFile, () => {});
      if (err) reject(err);
      else resolve();
    });
  });
}

module.exports = { speak };

/**
 * Test Whisper transcription
 * Loads test-message.mp3 and verifies transcription works
 */

const fs = require('fs');
const path = require('path');
const { transcribe } = require('../src/whisper');

async function runTest() {
  console.log('🧪 Testing Whisper transcription...\n');

  const audioPath = path.join(__dirname, 'audio', 'test-message.mp3');

  if (!fs.existsSync(audioPath)) {
    console.error(`❌ Test audio not found: ${audioPath}`);
    process.exit(1);
  }

  console.log(`📂 Loading audio: ${audioPath}`);
  const buffer = fs.readFileSync(audioPath);
  console.log(`✅ Audio loaded: ${buffer.length} bytes\n`);

  try {
    console.log('🎙️  Sending to Whisper API...');
    const result = await transcribe(buffer);
    console.log('\n✅ Transcription successful!\n');
    console.log(`📝 Transcribed text:\n"${result}"\n`);

    // Basic validation
    if (typeof result !== 'string' || result.length === 0) {
      console.error('❌ FAILED: Whisper returned empty or invalid result');
      process.exit(1);
    }

    console.log('✅ PASSED: Whisper test\n');
  } catch (err) {
    console.error(`❌ FAILED: ${err.message}\n`);
    process.exit(1);
  }
}

runTest();

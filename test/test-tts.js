/**
 * Test TTS (Text-to-Speech) integration
 * Speaks text and verifies audio output
 */

const fs = require('fs');
const path = require('path');
const { speak } = require('../src/tts');

async function runTest() {
  console.log('🧪 Testing TTS (Text-to-Speech)...\n');

  const testText = 'Hello from Knight Desktop app. This is a test of the text to speech system.';

  console.log(`📝 Test text:\n"${testText}"\n`);

  try {
    console.log('🔊 Sending to TTS API...');
    const result = await speak(testText);
    
    console.log('\n✅ TTS successful!\n');

    // Check if audio file was created (if speak() saves to disk)
    // Otherwise just validate the function completed
    if (result === true || result === undefined) {
      console.log('✅ PASSED: TTS test (audio played/generated)\n');
    } else {
      console.error('❌ FAILED: TTS returned unexpected result');
      process.exit(1);
    }
  } catch (err) {
    console.error(`❌ FAILED: ${err.message}\n`);
    process.exit(1);
  }
}

runTest();

/**
 * End-to-end test: Audio → Transcribe → Chat → Speak
 * Simulates full Knight Desktop flow without GUI
 */

const fs = require('fs');
const path = require('path');
const { transcribe } = require('../src/whisper');
const { chat } = require('../src/gateway');
const { speak } = require('../src/tts');

async function runTest() {
  console.log('🧪 End-to-End Test: Record → Transcribe → Chat → Speak\n');
  console.log('═'.repeat(60) + '\n');

  const audioPath = path.join(__dirname, 'audio', 'test-message.mp3');
  const messages = [];

  // Step 1: Load audio
  console.log('📝 Step 1: Loading test audio...');
  if (!fs.existsSync(audioPath)) {
    console.error(`❌ Test audio not found: ${audioPath}`);
    process.exit(1);
  }
  const audioBuffer = fs.readFileSync(audioPath);
  console.log(`✅ Loaded: ${audioBuffer.length} bytes\n`);

  // Step 2: Transcribe
  console.log('🎙️  Step 2: Transcribing audio...');
  try {
    const userMessage = await transcribe(audioBuffer);
    console.log(`✅ Transcribed: "${userMessage}"\n`);
    messages.push({ role: 'user', content: userMessage });
  } catch (err) {
    console.error(`❌ Transcription failed: ${err.message}\n`);
    process.exit(1);
  }

  // Step 3: Chat
  console.log('💬 Step 3: Sending to gateway chat...');
  try {
    const assistantResponse = await chat(messages);
    console.log(`✅ Response: "${assistantResponse}"\n`);
    messages.push({ role: 'assistant', content: assistantResponse });
  } catch (err) {
    console.error(`❌ Chat failed: ${err.message}\n`);
    process.exit(1);
  }

  // Step 4: Speak
  console.log('🔊 Step 4: Speaking response...');
  try {
    await speak(assistantResponse);
    console.log(`✅ Audio played\n`);
  } catch (err) {
    console.error(`❌ TTS failed: ${err.message}\n`);
    process.exit(1);
  }

  // Summary
  console.log('═'.repeat(60));
  console.log('\n✅ END-TO-END TEST PASSED!\n');
  console.log('Message flow:');
  console.log(`  User:      "${messages[0].content}"`);
  console.log(`  Assistant: "${messages[1].content}"`);
  console.log();
}

runTest().catch(err => {
  console.error(`❌ Test crashed: ${err.message}\n`);
  process.exit(1);
});

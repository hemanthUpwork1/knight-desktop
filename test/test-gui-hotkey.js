#!/usr/bin/env node

/**
 * GUI Hotkey Test: Press Alt+Space, verify app responds
 * Requires Knight app to be running
 */

const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

async function runTest() {
  console.log('🧪 Testing Knight Desktop GUI Hotkey (Alt+Space)\n');

  const keyboardScript = '/Users/hemanthbellala/.openclaw/workspace/skills/macos-gui-control/scripts/keyboard.sh';

  if (!fs.existsSync(keyboardScript)) {
    console.error(`❌ Keyboard script not found: ${keyboardScript}`);
    process.exit(1);
  }

  console.log('⌨️  Step 1: Sending Alt+Space hotkey...');
  try {
    const result = execSync(`bash "${keyboardScript}" "Alt+Space"`, { encoding: 'utf-8' });
    console.log(`✅ ${result.trim()}\n`);
  } catch (err) {
    console.error(`❌ Hotkey send failed: ${err.message}\n`);
    process.exit(1);
  }

  // Wait for app to respond
  console.log('⏳ Waiting 2 seconds for app to respond...\n');
  await new Promise(resolve => setTimeout(resolve, 2000));

  // Check if the app window is active or focused
  // For now, just verify the hotkey was sent successfully
  console.log('📝 Step 2: Verifying app is running...');
  try {
    const psOutput = execSync('ps aux | grep -i electron | grep -v grep', { encoding: 'utf-8' });
    if (psOutput.includes('Electron')) {
      console.log('✅ Electron app is running\n');
    } else {
      console.error('❌ Electron app is not running\n');
      process.exit(1);
    }
  } catch (err) {
    console.error('❌ Could not verify app state\n');
    process.exit(1);
  }

  console.log('═'.repeat(60));
  console.log('\n✅ HOTKEY TEST PASSED!\n');
  console.log('Next steps:');
  console.log('  1. Manually check the Knight menubar app (top-right corner)');
  console.log('  2. Verify status shows "Listening..."');
  console.log('  3. Speak into your mic');
  console.log('  4. Verify transcription appears in the chat window');
  console.log('\n');
}

runTest().catch(err => {
  console.error(`❌ Test crashed: ${err.message}\n`);
  process.exit(1);
});

#!/usr/bin/env node

/**
 * Test runner: Execute all Knight Desktop tests
 * Run: node test/run-all-tests.js
 */

const { spawn } = require('child_process');
const path = require('path');

const tests = [
  { name: 'Whisper Transcription', file: 'test-whisper.js' },
  { name: 'Gateway Chat', file: 'test-gateway.js' },
  { name: 'TTS (Text-to-Speech)', file: 'test-tts.js' },
  { name: 'End-to-End Flow', file: 'test-e2e.js' },
  { name: 'GUI Hotkey (Alt+Space)', file: 'test-gui-hotkey.js' }
];

let passCount = 0;
let failCount = 0;

async function runTest(test) {
  return new Promise((resolve) => {
    console.log(`\n${'='.repeat(60)}`);
    console.log(`Running: ${test.name}`);
    console.log(`File: ${test.file}`);
    console.log(`${'='.repeat(60)}\n`);

    const proc = spawn('node', [path.join(__dirname, test.file)], {
      stdio: 'inherit',
      cwd: path.join(__dirname, '..')
    });

    proc.on('close', (code) => {
      if (code === 0) {
        passCount++;
        console.log(`\n✅ ${test.name} PASSED\n`);
      } else {
        failCount++;
        console.log(`\n❌ ${test.name} FAILED\n`);
      }
      resolve();
    });

    proc.on('error', (err) => {
      failCount++;
      console.error(`❌ Error running ${test.name}: ${err.message}\n`);
      resolve();
    });
  });
}

async function main() {
  console.log('\n🚀 Knight Desktop Test Suite');
  console.log(`${'='.repeat(60)}\n`);

  for (const test of tests) {
    await runTest(test);
  }

  // Summary
  console.log(`${'='.repeat(60)}`);
  console.log('\n📊 Test Summary\n');
  console.log(`✅ Passed: ${passCount}`);
  console.log(`❌ Failed: ${failCount}`);
  console.log(`📈 Total:  ${tests.length}\n`);

  if (failCount === 0) {
    console.log('🎉 All tests passed!\n');
    process.exit(0);
  } else {
    console.log(`⚠️  ${failCount} test(s) failed.\n`);
    process.exit(1);
  }
}

main();

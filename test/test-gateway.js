/**
 * Test Gateway chat integration
 * Sends a test message and validates response
 */

const { chat } = require('../src/gateway');

async function runTest() {
  console.log('🧪 Testing Gateway chat...\n');

  const testMessages = [
    {
      role: 'user',
      content: 'Say hello back to me'
    }
  ];

  console.log('💬 Sending to gateway:');
  console.log(JSON.stringify(testMessages, null, 2));
  console.log();

  try {
    console.log('⏳ Waiting for response...');
    const response = await chat(testMessages);
    
    console.log('\n✅ Chat successful!\n');
    console.log(`📝 Gateway response:\n"${response}"\n`);

    // Basic validation
    if (typeof response !== 'string' || response.length === 0) {
      console.error('❌ FAILED: Gateway returned empty or invalid response');
      process.exit(1);
    }

    console.log('✅ PASSED: Gateway chat test\n');
  } catch (err) {
    console.error(`❌ FAILED: ${err.message}\n`);
    process.exit(1);
  }
}

runTest();

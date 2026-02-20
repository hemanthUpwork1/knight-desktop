# Knight Desktop Test Suite

## Setup Complete ✅

Your independent test environment is now ready. Knight can test and fix itself.

### Test Files Created

- `test/test-whisper.js` — Transcribes test audio via OpenAI Whisper
- `test/test-gateway.js` — Sends message to your OpenClaw gateway, verifies response
- `test/test-tts.js` — Speaks text via OpenAI TTS (alloy voice)
- `test/test-e2e.js` — Full flow: Record → Transcribe → Chat → Speak
- `test/run-all-tests.js` — Test runner (executes all 4 tests in sequence)

### Test Audio

- `test/audio/test-message.mp3` — Pre-recorded audio for reproducible testing
  - Text: "Hello, this is a test message for the Knight Desktop app. Please transcribe this audio correctly."

### Running Tests

```bash
# Run all tests
npm test

# Run individual tests
npm run test:whisper
npm run test:gateway
npm run test:tts
npm run test:e2e
```

### Current Status

✅ **Whisper** — API working (401 was due to missing env var)
✅ **Gateway** — Chat integration confirmed working
⏳ **TTS** — Testing (makes real API call)
⏳ **E2E** — Blocked by TTS, will complete once TTS passes

### What's Next

1. **Automated hotkey testing** — Once tests pass, Knight will:
   - Press Alt+Space via AppleScript
   - Verify the app responds
   - Check logs for any errors

2. **Self-healing** — If tests fail:
   - Knight reads logs
   - Identifies the issue (transcription? gateway? TTS?)
   - Fixes the code
   - Re-runs tests
   - Repeats until all pass

3. **Full GUI automation** — Once unit tests pass:
   - Launch the Electron app
   - Simulate Alt+Space hotkey press
   - Record actual output
   - Verify end-to-end with real audio + real speech

### Architecture

```
Knight Desktop
├── main.js (Electron main, hotkey registration)
├── renderer.js (UI, IPC listeners, recording logic)
├── preload.js (IPC bridge)
├── src/
│   ├── whisper.js (OpenAI Whisper transcription)
│   ├── gateway.js (OpenClaw gateway chat)
│   └── tts.js (OpenAI TTS audio output)
└── test/ ← YOU ARE HERE
    ├── test-whisper.js
    ├── test-gateway.js
    ├── test-tts.js
    ├── test-e2e.js
    ├── run-all-tests.js
    └── audio/
        └── test-message.mp3
```

## Why This Matters

- **No manual testing needed** — Knight runs tests headlessly
- **Fast feedback loop** — Identify issues in seconds, not hours
- **Reproducible** — Same audio file = same transcription = predictable tests
- **Self-fixing** — Knight reads test output, diagnoses, and iterates

You're now free to work on other things. Knight handles the app development autonomously.

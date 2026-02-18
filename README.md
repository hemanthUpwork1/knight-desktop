# Knight - Desktop AI Voice Assistant

A macOS menubar AI voice assistant built with Electron. Press F13 anywhere to activate voice input, and Knight will transcribe your speech, send it to the OpenClaw gateway for processing, and speak back the response.

## Features

- 🎤 **Voice Input**: Press F13 to start recording
- 🧠 **AI Processing**: Uses OpenClaw's Claude Haiku for responses
- 🔊 **Text-to-Speech**: Responses are spoken back using OpenAI's TTS
- 📱 **Menubar App**: Lives in the macOS menu bar, no Dock icon
- 💬 **Chat History**: See your last 5 exchanges in the popup

## Setup

### Prerequisites

- Node.js 16+
- macOS 10.13+
- OpenAI API key
- OpenClaw gateway running locally (or accessible)

### Installation

1. Clone the repository:
   ```bash
   git clone https://github.com/hemanthUpwork1/knight-desktop.git
   cd knight-desktop
   ```

2. Install dependencies:
   ```bash
   npm install
   ```

3. Set up environment variables:
   ```bash
   cp .env.example .env
   ```

4. Edit `.env` and add your OpenAI API key:
   ```
   OPENAI_API_KEY=sk-your-actual-key-here
   ```

5. Start the app:
   ```bash
   npm start
   ```

## Usage

1. Look for the microphone icon in your menu bar
2. Press **F13** anywhere on your Mac to start recording
3. Speak your message
4. Release F13 to stop recording
5. Knight will process your input and speak the response

Alternatively, click the microphone button in the popup window and hold to record.

## Building

To build a distributable macOS app:

```bash
npm run build
```

This creates a `.dmg` file in the `dist` directory.

## Architecture

- **main.js**: Electron main process, handles menubar and F13 hotkey registration
- **renderer.js**: Frontend logic for audio recording and UI updates
- **src/whisper.js**: OpenAI Whisper API integration for speech-to-text
- **src/gateway.js**: OpenClaw gateway integration for AI responses
- **src/tts.js**: OpenAI Text-to-Speech API integration

## Environment Variables

- `OPENAI_API_KEY`: Your OpenAI API key (required)
- `OPENCLAW_GATEWAY_URL`: URL of your OpenClaw gateway (default: `http://localhost:18789`)
- `OPENCLAW_GATEWAY_TOKEN`: Authentication token for the gateway (default: provided)

## License

MIT

const { app, BrowserWindow, globalShortcut, ipcMain } = require('electron');
const { menubar } = require('menubar');
const path = require('path');
const dotenv = require('dotenv');
const { uIOhook, UiohookKey } = require('uiohook-napi');

const envConfig = dotenv.config();
console.log('[Main] .env loaded from:', envConfig.parsed ? 'file' : 'not found');
console.log('[Main] OPENCLAW_GATEWAY_URL:', process.env.OPENCLAW_GATEWAY_URL);
console.log('[Main] OPENCLAW_GATEWAY_TOKEN:', process.env.OPENCLAW_GATEWAY_TOKEN ? '***' : 'NOT SET');
console.log('[Main] OPENAI_API_KEY:', process.env.OPENAI_API_KEY ? '***' : 'NOT SET');

const { transcribe } = require('./src/whisper');
const { chat } = require('./src/gateway');
const { speak } = require('./src/tts');

let mb;
let isRecording = false;
let altPressed = false;
let spacePressed = false;

app.on('ready', () => {
  const preloadPath = path.join(__dirname, 'preload.js');
  console.log('Using preload:', preloadPath);
  
  mb = menubar({
    index: `file://${path.join(__dirname, 'index.html')}`,
    windowPosition: 'topRight',
    preloadWindow: true,
    showDockIcon: false,
    width: 350,
    height: 500,
    // Pass webPreferences to menubar with correct config
    browserWindow: {
      webPreferences: {
        preload: preloadPath,
        nodeIntegration: false,
        contextIsolation: true,
        enableRemoteModule: false,
        sandbox: true
      }
    }
  });

  mb.on('ready', () => {
    // Setup push-to-talk with uiohook (detects key release)
    uIOhook.on('keydown', (e) => {
      if (e.keycode === UiohookKey.Alt) altPressed = true;
      if (e.keycode === UiohookKey.Space) spacePressed = true;

      // Start recording when Alt+Space pressed
      if (altPressed && spacePressed && !isRecording && mb.window) {
        isRecording = true;
        console.log('[Main] Alt+Space pressed, starting recording...');
        mb.window.show();
        mb.window.webContents.send('start-recording');
      }
    });

    uIOhook.on('keyup', (e) => {
      if (e.keycode === UiohookKey.Alt) altPressed = false;
      if (e.keycode === UiohookKey.Space) spacePressed = false;

      // Stop recording when either key is released
      if (isRecording && (!altPressed || !spacePressed) && mb.window) {
        isRecording = false;
        console.log('[Main] Alt+Space released, stopping recording...');
        mb.window.webContents.send('stop-recording');
      }
    });

    // Start the hook
    uIOhook.start();
    console.log('[Main] uIOhook started, listening for Alt+Space...');
  });

  mb.on('after-create-window', () => {
    console.log('[Main] Window created. Opening DevTools...');
    // Open DevTools for debugging
    mb.window.webContents.openDevTools({ mode: 'detach' });
  });

  // IPC handlers
  ipcMain.handle('transcribe', async (event, audioBuffer) => {
    try {
      const text = await transcribe(audioBuffer);
      return { success: true, text };
    } catch (err) {
      console.error('Transcribe error:', err);
      return { success: false, error: err.message };
    }
  });

  ipcMain.handle('chat', async (event, messages) => {
    try {
      const response = await chat(messages);
      return { success: true, response };
    } catch (err) {
      console.error('Chat error:', err);
      return { success: false, error: err.message };
    }
  });

  ipcMain.handle('speak', async (event, text) => {
    try {
      await speak(text);
      return { success: true };
    } catch (err) {
      console.error('TTS error:', err);
      return { success: false, error: err.message };
    }
  });
});

app.on('window-all-closed', () => {
  // Don't quit on window close for menubar apps
});

app.on('will-quit', () => {
  uIOhook.stop();
  globalShortcut.unregisterAll();
});

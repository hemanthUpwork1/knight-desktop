const { app, BrowserWindow, globalShortcut, ipcMain } = require('electron');
const { menubar } = require('menubar');
const path = require('path');
const dotenv = require('dotenv');

const envConfig = dotenv.config();
console.log('[Main] .env loaded from:', envConfig.parsed ? 'file' : 'not found');
console.log('[Main] OPENCLAW_GATEWAY_URL:', process.env.OPENCLAW_GATEWAY_URL);
console.log('[Main] OPENCLAW_GATEWAY_TOKEN:', process.env.OPENCLAW_GATEWAY_TOKEN ? '***' : 'NOT SET');
console.log('[Main] OPENAI_API_KEY:', process.env.OPENAI_API_KEY ? '***' : 'NOT SET');

const { transcribe } = require('./src/whisper');
const { chat } = require('./src/gateway');
const { speak } = require('./src/tts');

let mb;

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
    // Register Alt+Space hotkey
    globalShortcut.register('Alt+Space', () => {
      if (mb.window) {
        console.log('[Main] Alt+Space pressed, sending IPC message');
        mb.window.webContents.send('start-recording');
      }
    });
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
  globalShortcut.unregisterAll();
});

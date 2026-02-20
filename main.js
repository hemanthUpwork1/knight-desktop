const { app, BrowserWindow, globalShortcut, ipcMain } = require('electron');
const { menubar } = require('menubar');
const path = require('path');
require('dotenv').config();

const { transcribe } = require('./src/whisper');
const { chat } = require('./src/gateway');
const { speak } = require('./src/tts');

let mb;

app.on('ready', () => {
  mb = menubar({
    index: `file://${path.join(__dirname, 'index.html')}`,
    windowPosition: 'topRight',
    preloadWindow: true,
    showDockIcon: false,
    width: 350,
    height: 500
    // Icon removed - using default menubar icon
  });

  mb.on('ready', () => {
    // Register Option+Space hotkey
    globalShortcut.register('Alt+Space', () => {
      if (mb.window) {
        mb.window.webContents.send('start-recording');
      }
    });

    // Handle keyup for Alt+Space (stop recording)
    // Note: globalShortcut doesn't support keyup, so we'll use a workaround
    // by having the renderer listen for key events and send stop when appropriate
  });

  mb.on('after-create-window', () => {
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

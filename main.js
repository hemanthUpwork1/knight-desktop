const { app, BrowserWindow, globalShortcut, ipcMain, screen } = require('electron');
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

let mainWindow;
let isRecording = false;
let altPressed = false;
let spacePressed = false;

function createWindow() {
  const { width: screenWidth, height: screenHeight } = screen.getPrimaryDisplay().workAreaSize;

  mainWindow = new BrowserWindow({
    width: 220,
    height: 60,
    x: Math.round((screenWidth - 220) / 2),
    y: screenHeight - 80,
    frame: false,
    transparent: true,
    alwaysOnTop: true,
    resizable: false,
    skipTaskbar: true,
    hasShadow: false,
    focusable: false,
    webPreferences: {
      preload: path.join(__dirname, 'preload.js'),
      nodeIntegration: false,
      contextIsolation: true,
      enableRemoteModule: false,
      sandbox: true
    }
  });

  mainWindow.loadFile('index.html');
  mainWindow.setVisibleOnAllWorkspaces(true, { visibleOnFullScreen: true });

  // Uncomment to debug:
  // mainWindow.webContents.openDevTools({ mode: 'detach' });
}

app.on('ready', () => {
  createWindow();

  // Setup push-to-talk with uiohook
  uIOhook.on('keydown', (e) => {
    if (e.keycode === UiohookKey.Alt) altPressed = true;
    if (e.keycode === UiohookKey.Space) spacePressed = true;

    // Start recording when Alt+Space pressed
    if (altPressed && spacePressed && !isRecording && mainWindow) {
      isRecording = true;
      console.log('[Main] Alt+Space pressed, starting recording...');
      mainWindow.webContents.send('start-recording');
    }
  });

  uIOhook.on('keyup', (e) => {
    if (e.keycode === UiohookKey.Alt) altPressed = false;
    if (e.keycode === UiohookKey.Space) spacePressed = false;

    // Stop recording when either key is released
    if (isRecording && (!altPressed || !spacePressed) && mainWindow) {
      isRecording = false;
      console.log('[Main] Alt+Space released, stopping recording...');
      mainWindow.webContents.send('stop-recording');
    }
  });

  // Start the hook
  uIOhook.start();
  console.log('[Main] uIOhook started, listening for Alt+Space...');

  // IPC handlers
  ipcMain.handle('transcribe', async (event, audioBuffer) => {
    try {
      const startTime = Date.now();
      const text = await transcribe(audioBuffer);
      const duration = Date.now() - startTime;
      console.log(`[Main] Transcribe completed in ${duration}ms`);
      return { success: true, text, duration };
    } catch (err) {
      console.error('Transcribe error:', err);
      return { success: false, error: err.message };
    }
  });

  ipcMain.handle('chat', async (event, messages) => {
    try {
      const startTime = Date.now();
      const result = await chat(messages);
      const duration = Date.now() - startTime;
      console.log(`[Main] Chat completed in ${duration}ms`);
      
      // result might be an object with timing data (from updated gateway.js)
      const response = typeof result === 'object' && result.content ? result.content : result;
      const timing = typeof result === 'object' && result.timing ? result.timing : null;
      
      return { 
        success: true, 
        response,
        duration,
        timing
      };
    } catch (err) {
      console.error('Chat error:', err);
      return { success: false, error: err.message };
    }
  });

  ipcMain.handle('speak', async (event, text) => {
    try {
      const startTime = Date.now();
      await speak(text);
      const duration = Date.now() - startTime;
      console.log(`[Main] TTS completed in ${duration}ms`);
      return { success: true, duration };
    } catch (err) {
      console.error('TTS error:', err);
      return { success: false, error: err.message };
    }
  });
});

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit();
  }
});

app.on('activate', () => {
  if (BrowserWindow.getAllWindows().length === 0) {
    createWindow();
  }
});

app.on('will-quit', () => {
  uIOhook.stop();
  globalShortcut.unregisterAll();
});

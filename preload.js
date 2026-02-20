const { contextBridge, ipcRenderer } = require('electron');

console.log('[Preload] Loading Knight preload script...');

contextBridge.exposeInMainWorld('knight', {
  onStartRecording: (callback) => {
    console.log('[Preload] onStartRecording listener registered');
    ipcRenderer.on('start-recording', callback);
  },
  onStopRecording: (callback) => {
    console.log('[Preload] onStopRecording listener registered');
    ipcRenderer.on('stop-recording', callback);
  },
  transcribe: (audioBuffer) => {
    console.log('[Preload] transcribe called with', audioBuffer.length, 'bytes');
    return ipcRenderer.invoke('transcribe', audioBuffer);
  },
  chat: (messages) => {
    console.log('[Preload] chat called with', messages.length, 'messages');
    return ipcRenderer.invoke('chat', messages);
  },
  speak: (text) => {
    console.log('[Preload] speak called with text length', text.length);
    return ipcRenderer.invoke('speak', text);
  }
});

console.log('[Preload] Knight object exposed to window.knight');

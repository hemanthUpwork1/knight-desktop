const { contextBridge, ipcRenderer } = require('electron');

contextBridge.exposeInMainWorld('knight', {
  onStartRecording: (callback) => {
    ipcRenderer.on('start-recording', callback);
  },
  onStopRecording: (callback) => {
    ipcRenderer.on('stop-recording', callback);
  },
  transcribe: (audioBuffer) => {
    return ipcRenderer.invoke('transcribe', audioBuffer);
  },
  chat: (messages) => {
    return ipcRenderer.invoke('chat', messages);
  },
  speak: (text) => {
    return ipcRenderer.invoke('speak', text);
  }
});

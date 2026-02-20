let mediaRecorder;
let audioChunks = [];
let isRecording = false;

const statusBar = document.getElementById('statusBar');
const chatHistory = document.getElementById('chatHistory');
const micButton = document.getElementById('micButton');

// Message history for context
let messages = [];

// Initialize
async function init() {
  const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
  mediaRecorder = new MediaRecorder(stream);

  mediaRecorder.ondataavailable = (event) => {
    audioChunks.push(event.data);
  };

  mediaRecorder.onstop = async () => {
    const audioBlob = new Blob(audioChunks, { type: 'audio/webm' });
    audioChunks = [];

    statusBar.textContent = 'Transcribing...';
    const buffer = await audioBlob.arrayBuffer();
    const result = await window.knight.transcribe(buffer);

    if (!result.success) {
      statusBar.textContent = 'Transcribe failed';
      console.error('Transcription failed:', result.error);
      setTimeout(() => {
        statusBar.textContent = 'Press Alt+Space to talk';
      }, 2000);
      return;
    }

    console.log('Transcribed:', result.text);
    const userMessage = result.text;
    addMessage(userMessage, 'user');

    // Send to gateway for response
    statusBar.textContent = 'Thinking...';
    messages.push({ role: 'user', content: userMessage });

    console.log('Sending to gateway:', messages);
    const chatResult = await window.knight.chat(messages);
    if (!chatResult.success) {
      statusBar.textContent = 'Chat failed';
      console.error('Chat failed:', chatResult.error);
      setTimeout(() => {
        statusBar.textContent = 'Press Alt+Space to talk';
      }, 2000);
      return;
    }

    console.log('Chat response:', chatResult.response);
    const assistantMessage = chatResult.response;
    messages.push({ role: 'assistant', content: assistantMessage });
    addMessage(assistantMessage, 'assistant');

    // Speak the response
    statusBar.textContent = 'Speaking...';
    console.log('Speaking:', assistantMessage);
    const speakResult = await window.knight.speak(assistantMessage);
    if (!speakResult.success) {
      console.error('TTS failed:', speakResult.error);
    }

    statusBar.textContent = 'Press Alt+Space to talk';
  };
}

// IPC listener for Alt+Space hotkey from main.js
window.knight.onStartRecording(() => {
  console.log('IPC: start-recording received');
  if (!isRecording && mediaRecorder) {
    isRecording = true;
    audioChunks = [];
    mediaRecorder.start();
    statusBar.textContent = 'Listening...';
    micButton.classList.add('recording');
    console.log('Recording started');
  }
});

// Manual mic button click
micButton.addEventListener('mousedown', () => {
  console.log('Mic button pressed');
  if (!isRecording && mediaRecorder) {
    isRecording = true;
    audioChunks = [];
    mediaRecorder.start();
    statusBar.textContent = 'Listening...';
    micButton.classList.add('recording');
    console.log('Recording started (button)');
  }
});

micButton.addEventListener('mouseup', () => {
  console.log('Mic button released');
  if (isRecording && mediaRecorder) {
    isRecording = false;
    mediaRecorder.stop();
    micButton.classList.remove('recording');
    console.log('Recording stopped (button)');
  }
});

// Local keyup listener to stop recording (Alt key release)
document.addEventListener('keyup', (e) => {
  if (e.key === 'Alt') {
    console.log('Alt key released');
    if (isRecording && mediaRecorder) {
      isRecording = false;
      mediaRecorder.stop();
      micButton.classList.remove('recording');
      console.log('Recording stopped (Alt release)');
    }
  }
});

function addMessage(text, role) {
  const messageDiv = document.createElement('div');
  messageDiv.className = `message ${role}`;
  messageDiv.textContent = text;
  chatHistory.appendChild(messageDiv);
  chatHistory.scrollTop = chatHistory.scrollHeight;
}

// Initialize on page load
console.log('Knight app initializing...');
init().catch(err => {
  statusBar.textContent = 'Microphone access denied';
  console.error('Init error:', err);
});

// Set initial status
statusBar.textContent = 'Press Alt+Space to talk';

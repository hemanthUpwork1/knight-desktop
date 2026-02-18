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
      console.error(result.error);
      setTimeout(() => {
        statusBar.textContent = 'Press F13 to talk';
      }, 2000);
      return;
    }

    const userMessage = result.text;
    addMessage(userMessage, 'user');

    // Send to gateway for response
    statusBar.textContent = 'Thinking...';
    messages.push({ role: 'user', content: userMessage });

    const chatResult = await window.knight.chat(messages);
    if (!chatResult.success) {
      statusBar.textContent = 'Chat failed';
      console.error(chatResult.error);
      setTimeout(() => {
        statusBar.textContent = 'Press F13 to talk';
      }, 2000);
      return;
    }

    const assistantMessage = chatResult.response;
    messages.push({ role: 'assistant', content: assistantMessage });
    addMessage(assistantMessage, 'assistant');

    // Speak the response
    statusBar.textContent = 'Speaking...';
    const speakResult = await window.knight.speak(assistantMessage);
    if (!speakResult.success) {
      console.error(speakResult.error);
    }

    statusBar.textContent = 'Press F13 to talk';
  };
}

// Start recording from hotkey
window.knight.onStartRecording(() => {
  if (!isRecording && mediaRecorder) {
    isRecording = true;
    audioChunks = [];
    mediaRecorder.start();
    statusBar.textContent = 'Listening...';
    micButton.classList.add('recording');
  }
});

// Stop recording (triggered by keyup listener or button)
window.knight.onStopRecording(() => {
  if (isRecording && mediaRecorder) {
    isRecording = false;
    mediaRecorder.stop();
    micButton.classList.remove('recording');
  }
});

// Manual mic button click
micButton.addEventListener('mousedown', () => {
  if (!isRecording && mediaRecorder) {
    isRecording = true;
    audioChunks = [];
    mediaRecorder.start();
    statusBar.textContent = 'Listening...';
    micButton.classList.add('recording');
  }
});

micButton.addEventListener('mouseup', () => {
  if (isRecording && mediaRecorder) {
    isRecording = false;
    mediaRecorder.stop();
    micButton.classList.remove('recording');
  }
});

// Global keydown/keyup listener for F13 (code 123)
document.addEventListener('keydown', (e) => {
  if (e.keyCode === 123) {
    e.preventDefault();
    if (!isRecording && mediaRecorder) {
      isRecording = true;
      audioChunks = [];
      mediaRecorder.start();
      statusBar.textContent = 'Listening...';
      micButton.classList.add('recording');
    }
  }
});

document.addEventListener('keyup', (e) => {
  if (e.keyCode === 123) {
    e.preventDefault();
    if (isRecording && mediaRecorder) {
      isRecording = false;
      mediaRecorder.stop();
      micButton.classList.remove('recording');
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
init().catch(err => {
  statusBar.textContent = 'Microphone access denied';
  console.error('Init error:', err);
});

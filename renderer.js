let mediaRecorder;
let audioChunks = [];
let isRecording = false;
let audioContext;
let analyser;
let dataArray;
let animationId;
let currentStream;

const pill = document.getElementById('pill');
const waveform = document.getElementById('waveform');
const statusText = document.getElementById('statusText');

// Create wave bars
const NUM_BARS = 20;
for (let i = 0; i < NUM_BARS; i++) {
  const bar = document.createElement('div');
  bar.className = 'wave-bar';
  waveform.appendChild(bar);
}
const waveBars = waveform.querySelectorAll('.wave-bar');

// Message history for context
let messages = [];

function setState(state, errorMsg = '') {
  pill.classList.remove('recording', 'processing', 'error');
  if (state === 'recording') {
    pill.classList.add('recording');
  } else if (state === 'processing') {
    pill.classList.add('processing');
  } else if (state === 'error') {
    pill.classList.add('error');
    statusText.textContent = errorMsg;
  }
}

// Waveform animation
function animateWaveform() {
  if (!analyser || !isRecording) return;

  analyser.getByteFrequencyData(dataArray);

  // Sample the frequency data across the bars
  const step = Math.floor(dataArray.length / NUM_BARS);
  for (let i = 0; i < NUM_BARS; i++) {
    const value = dataArray[i * step];
    // Map 0-255 to 4-28px height
    const height = Math.max(4, (value / 255) * 28);
    waveBars[i].style.height = `${height}px`;
  }

  animationId = requestAnimationFrame(animateWaveform);
}

function stopWaveformAnimation() {
  if (animationId) {
    cancelAnimationFrame(animationId);
    animationId = null;
  }
  // Reset bars to minimum height
  waveBars.forEach(bar => {
    bar.style.height = '4px';
  });
}

// Release microphone - stops the recording indicator
function releaseMicrophone() {
  if (currentStream) {
    currentStream.getTracks().forEach(track => track.stop());
    currentStream = null;
  }
  if (audioContext) {
    audioContext.close();
    audioContext = null;
    analyser = null;
  }
  mediaRecorder = null;
}

// Start recording - acquires mic on demand
async function startRecording() {
  if (isRecording) return;

  try {
    // Acquire microphone only when needed
    currentStream = await navigator.mediaDevices.getUserMedia({ audio: true });

    // Setup audio analyzer for waveform
    audioContext = new AudioContext();
    analyser = audioContext.createAnalyser();
    analyser.fftSize = 256;
    const source = audioContext.createMediaStreamSource(currentStream);
    source.connect(analyser);
    dataArray = new Uint8Array(analyser.frequencyBinCount);

    mediaRecorder = new MediaRecorder(currentStream);

    mediaRecorder.ondataavailable = (event) => {
      audioChunks.push(event.data);
    };

    mediaRecorder.onstop = async () => {
      const recordStartTime = Date.now();
      stopWaveformAnimation();

      // Release mic immediately after recording stops
      const stream = currentStream;
      releaseMicrophone();

      setState('processing');

      const audioBlob = new Blob(audioChunks, { type: 'audio/webm' });
      audioChunks = [];
      console.log(`[Renderer] ⏱️  Audio blob size: ${audioBlob.size} bytes`);

      const transcribeStartTime = Date.now();
      const buffer = await audioBlob.arrayBuffer();
      const transcribeResult = await window.knight.transcribe(buffer);
      const transcribeEndTime = Date.now();
      const transcribeDuration = transcribeResult.duration || (transcribeEndTime - transcribeStartTime);
      console.log(`[Renderer] ⏱️  Transcribe: ${transcribeDuration}ms`);

      if (!transcribeResult.success) {
        console.error('[Renderer] Transcription failed:', transcribeResult.error);
        setState('error', 'Transcribe failed');
        setTimeout(() => setState('idle'), 2000);
        return;
      }

      console.log('[Renderer] Transcribed:', transcribeResult.text);
      const userMessage = transcribeResult.text;

      // Send to gateway for response
      messages.push({ role: 'user', content: userMessage });

      console.log(`[Renderer] Sending to gateway (messages: ${messages.length}, total size: ${JSON.stringify(messages).length} bytes)`);
      const chatStartTime = Date.now();
      const chatResult = await window.knight.chat(messages);
      const chatEndTime = Date.now();
      const chatDuration = chatResult.duration || (chatEndTime - chatStartTime);
      console.log(`[Renderer] ⏱️  Chat total: ${chatDuration}ms`);
      
      if (chatResult.timing) {
        console.log(`[Renderer] ⏱️  Chat breakdown - Network: ${chatResult.timing.fetch}ms, Parse: ${chatResult.timing.parse}ms, Endpoint: ${chatResult.timing.endpoint}`);
      }

      if (!chatResult.success) {
        console.error('[Renderer] Chat failed:', chatResult.error);
        setState('error', 'Chat failed');
        setTimeout(() => setState('idle'), 2000);
        return;
      }

      console.log('[Renderer] Chat response:', chatResult.response);
      const assistantMessage = chatResult.response;
      messages.push({ role: 'assistant', content: assistantMessage });

      // Speak the response
      console.log('[Renderer] Speaking:', assistantMessage);
      const ttsStartTime = Date.now();
      const speakResult = await window.knight.speak(assistantMessage);
      const ttsEndTime = Date.now();
      const ttsDuration = speakResult.duration || (ttsEndTime - ttsStartTime);
      console.log(`[Renderer] ⏱️  TTS: ${ttsDuration}ms`);

      if (!speakResult.success) {
        console.error('[Renderer] TTS failed:', speakResult.error);
      }

      const totalEndTime = Date.now();
      const totalDuration = totalEndTime - recordStartTime;
      
      console.log(`\n[Renderer] ========== LATENCY BREAKDOWN ==========`);
      console.log(`[Renderer] Audio Recording:  (included in total)`);
      console.log(`[Renderer] Transcribe:      ${transcribeDuration}ms`);
      console.log(`[Renderer] Chat:            ${chatDuration}ms`);
      if (chatResult.timing) {
        console.log(`[Renderer]   ├─ Network:    ${chatResult.timing.fetch}ms`);
        console.log(`[Renderer]   └─ Parse:      ${chatResult.timing.parse}ms`);
      }
      console.log(`[Renderer] TTS:             ${ttsDuration}ms`);
      console.log(`[Renderer] ────────────────────────────`);
      console.log(`[Renderer] TOTAL:           ${totalDuration}ms`);
      console.log(`[Renderer] ==========================================\n`);

      setState('idle');
    };

    isRecording = true;
    audioChunks = [];
    mediaRecorder.start();
    setState('recording');
    animateWaveform();
    console.log('[Renderer] Recording started');

  } catch (err) {
    console.error('[Renderer] Failed to start recording:', err);
    setState('error', 'Mic denied');
    setTimeout(() => setState('idle'), 2000);
  }
}

// Stop recording
function stopRecording() {
  if (!isRecording || !mediaRecorder) return;

  isRecording = false;
  mediaRecorder.stop();
  console.log('[Renderer] Recording stopped');
}

// IPC listener for key press from main.js
console.log('[Renderer] Registering IPC listeners...');
if (window.knight && window.knight.onStartRecording) {
  window.knight.onStartRecording(() => {
    console.log('[Renderer] ✅ IPC: start-recording received');
    startRecording();
  });

  window.knight.onStopRecording(() => {
    console.log('[Renderer] ✅ IPC: stop-recording received');
    stopRecording();
  });
} else {
  console.error('[Renderer] ❌ window.knight.onStartRecording not available');
}

// Initialize on page load
console.log('[Renderer] Knight app initializing...');

if (!window.knight) {
  console.error('[Renderer] ❌ window.knight is undefined! Preload script not loaded.');
  setState('error', 'Init failed');
} else {
  console.log('[Renderer] ✅ window.knight loaded successfully');
}

setState('idle');
console.log('[Renderer] Ready. Press Alt+Space to start recording...');

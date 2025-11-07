const video = document.getElementById('video');
const canvas = document.getElementById('captureCanvas');
const ctx = canvas.getContext('2d');
const sentenceBox = document.getElementById('sentenceBox');
const statusText = document.getElementById('statusText');

const startBtn = document.getElementById('startBtn');
const stopBtn = document.getElementById('stopBtn');
const clearBtn = document.getElementById('clearBtn');

let stream = null;
let running = false;
let intervalId = null;
let sentence = [];
let lastWord = '';

// Initialize camera and set canvas size to match actual video feed
async function startCamera() {
  try {
    stream = await navigator.mediaDevices.getUserMedia({ video: { width: 640, height: 480 } });
    video.srcObject = stream;
    await video.play();

    // ensure canvas matches video actual resolution
    canvas.width = video.videoWidth || 640;
    canvas.height = video.videoHeight || 480;

    statusText.textContent = "Camera started.";
  } catch (err) {
    console.error("Camera error:", err);
    statusText.textContent = "Camera access denied or unavailable.";
  }
}

async function captureAndSend() {
  if (!running) return;
  if (!video || video.readyState < 2) return; // wait for video

  ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
  const dataUrl = canvas.toDataURL('image/jpeg', 0.8);

  try {
    const resp = await fetch('/predict', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ image: dataUrl })
    });

    if (!resp.ok) {
      console.warn("Server returned", resp.status);
      statusText.textContent = `Server error: ${resp.status}`;
      setTimeout(captureAndSend, 500);
      return;
    }

    const j = await resp.json();
    console.log("Prediction response:", j);

    if (j.success) {
      const currentWord = (j.label || '').trim();
      const conf = j.confidence !== undefined ? j.confidence : null;

      // optional: ignore low-confidence (< 0.4) results
      if (conf !== null && conf < 0.25) {
        statusText.textContent = `Low confidence (${conf})`;
      } else {
        if (currentWord && currentWord !== lastWord) {
          sentence.push(currentWord);
          lastWord = currentWord;
          updateSentenceDisplay();
          statusText.textContent = `Detected: ${currentWord} (${conf})`;
        } else {
          statusText.textContent = `Detected (repeat or blank): ${currentWord || '—'}`;
        }
      }
    } else {
      // show message for debugging: usually 'no_hand' or 'no_data' etc.
      statusText.textContent = `No detection: ${j.message || 'unknown'}`;
    }

  } catch (err) {
    console.error("Prediction error:", err);
    statusText.textContent = "Network/Prediction error.";
  }

  // schedule next capture
  setTimeout(captureAndSend, 450);
}

function updateSentenceDisplay() {
  sentenceBox.textContent = sentence.join(' ');
}

startBtn.addEventListener('click', async () => {
  if (running) return;
  await startCamera();
  running = true;
  sentence = []; lastWord = '';
  updateSentenceDisplay();
  captureAndSend();
});

stopBtn.addEventListener('click', () => {
  running = false;
  if (stream) {
    stream.getTracks().forEach(t => t.stop());
    stream = null;
  }
  statusText.textContent = "Stopped.";
});

clearBtn.addEventListener('click', () => {
  sentence = [];
  lastWord = '';
  updateSentenceDisplay();
  statusText.textContent = "Cleared.";
});

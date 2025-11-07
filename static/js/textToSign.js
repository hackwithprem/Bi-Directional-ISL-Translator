const form = document.getElementById('convertForm');
const textInput = document.getElementById('textInput');
const micButton = document.getElementById('micButton');
const statusMsg = document.getElementById('statusMsg');
const videoContainer = document.getElementById('videoContainer');

// Handle text input submission
form.addEventListener('submit', async (e) => {
  e.preventDefault();
  convertText(textInput.value.trim());
});

// Handle mic button for speech input
let recognition;
let isListening = false;

if ('webkitSpeechRecognition' in window) {
  recognition = new webkitSpeechRecognition();
  recognition.continuous = true; // 👈 continuous listening
  recognition.lang = 'en-US'; // Default language
  recognition.interimResults = true;

  recognition.onresult = (event) => {
  let transcript = '';
  let isFinal = false;

  for (let i = event.resultIndex; i < event.results.length; i++) {
    transcript += event.results[i][0].transcript;
    isFinal = event.results[i].isFinal;
  }

  textInput.value = transcript;

  // 🔁 When final result is available, convert it
  if (isFinal) {
    recognition.stop(); // Stop listening after final
    isListening = false;
    micButton.textContent = '🎤 Start Speech';
    convertText(transcript.trim());
  }
};

  recognition.onerror = (e) => {
    console.error(e);
    statusMsg.textContent = 'Speech recognition error.';
  };

  recognition.onend = () => {
    statusMsg.textContent = '';
    if (isListening) {
      convertText(textInput.value.trim()); // Auto-submit on stop
    }
  };
}

micButton.addEventListener('click', () => {
  if (!recognition) {
    alert('Speech recognition not supported in your browser.');
    return;
  }

  if (!isListening) {
    recognition.start();
    isListening = true;
    micButton.textContent = '🛑 Stop Speech';
    statusMsg.textContent = 'Listening...';
  } else {
    recognition.stop();
    isListening = false;
    micButton.textContent = '🎤 Start Speech';
    statusMsg.textContent = 'Stopped listening.';
  }
});


// Send text to backend and display videos
async function convertText(text) {
  if (!text) return;

  const res = await fetch('/convert', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ text })
  });

  const data = await res.json();
  videoContainer.innerHTML = '';
  document.getElementById('replayButton').style.display = 'none';

  // 👇 Adjust for new backend response
  const videos = data.results ? data.results.map(item => item.path) : [];

  if (videos.length === 0) {
    videoContainer.innerHTML = '<p>No matching sign videos found.</p>';
    return;
  }

  // 🎥 Create video player
  const videoPlayer = document.createElement('video');
  videoPlayer.controls = true;
  videoPlayer.autoplay = true;
  videoContainer.appendChild(videoPlayer);

  let currentIndex = 0;

  const playNext = () => {
    if (currentIndex < videos.length) {
      videoPlayer.src = videos[currentIndex];
      currentIndex++;
      videoPlayer.play();
    } else {
      statusMsg.textContent = "✅ All signs played.";
      document.getElementById('replayButton').style.display = 'inline-block';
    }
  };

  videoPlayer.onended = playNext;

  // Replay logic
  document.getElementById('replayButton').onclick = () => {
    currentIndex = 0;
    document.getElementById('replayButton').style.display = 'none';
    statusMsg.textContent = '';
    playNext();
  };

  playNext();
}
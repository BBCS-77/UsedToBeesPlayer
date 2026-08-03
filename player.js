const PROFILES = {
  johnberry: {
    classmate: "John Berry",
    title: "Slow Ride",
    artist: "Foghat",
    year: "1975",
    dedication: "audio/JohnBerryDedication.mp3",
    song: "audio/Foghat-Slow-Ride.mp3"
  }
};

const params = new URLSearchParams(window.location.search);
const requestedId = (params.get("id") || "johnberry")
  .toLowerCase()
  .replace(/[^a-z0-9]/g, "");
const profile = PROFILES[requestedId] || PROFILES.johnberry;

const dedication = document.getElementById("dedicationAudio");
const song = document.getElementById("songAudio");
const playButton = document.getElementById("playSequence");
const pauseButton = document.getElementById("pauseAudio");
const restartButton = document.getElementById("restartAudio");
const statusText = document.getElementById("statusText");
const timeText = document.getElementById("timeText");
const progressFill = document.getElementById("progressFill");
const shell = document.querySelector(".player-shell");
const badge = document.querySelector(".program-badge");
const meterBars = [...document.querySelectorAll("#vuMeter span")];

document.getElementById("classmateName").textContent = profile.classmate;
document.getElementById("songTitle").textContent = profile.title;
document.getElementById("artistLine").textContent = `${profile.artist} • ${profile.year}`;
document.title = `${profile.classmate} — ${profile.title}`;

dedication.src = profile.dedication;
song.src = profile.song;

let currentAudio = null;
let audioContext = null;
let analyser = null;
let animationFrame = null;
let sourcesConnected = false;
let sequenceToken = 0;

function ensureAudioGraph() {
  if (!audioContext) {
    audioContext = new (window.AudioContext || window.webkitAudioContext)();
    analyser = audioContext.createAnalyser();
    analyser.fftSize = 128;
    analyser.smoothingTimeConstant = 0.78;
    analyser.connect(audioContext.destination);
  }

  if (!sourcesConnected) {
    const dedicationSource = audioContext.createMediaElementSource(dedication);
    const songSource = audioContext.createMediaElementSource(song);
    dedicationSource.connect(analyser);
    songSource.connect(analyser);
    sourcesConnected = true;
  }

  if (audioContext.state === "suspended") {
    audioContext.resume();
  }
}

async function playSequence() {
  sequenceToken += 1;
  const token = sequenceToken;

  stopAll(false);
  ensureAudioGraph();

  dedication.currentTime = 0;
  song.currentTime = 0;
  currentAudio = dedication;
  statusText.textContent = "Long-distance dedication";
  setPlaying(true);
  startMeter();

  try {
    await dedication.play();
  } catch (error) {
    statusText.textContent = "Press PLAY again";
    setPlaying(false);
    return;
  }

  dedication.onended = async () => {
    if (token !== sequenceToken) return;
    statusText.textContent = "Changing programs…";
    await playKaChunk();
    if (token !== sequenceToken) return;

    currentAudio = song;
    statusText.textContent = "Playing song";
    try {
      await song.play();
    } catch (error) {
      statusText.textContent = "Press PLAY to continue";
      setPlaying(false);
    }
  };
}

function playKaChunk() {
  return new Promise(resolve => {
    ensureAudioGraph();

    const now = audioContext.currentTime;
    const master = audioContext.createGain();
    master.gain.setValueAtTime(0.0001, now);
    master.gain.exponentialRampToValueAtTime(0.65, now + 0.008);
    master.gain.exponentialRampToValueAtTime(0.0001, now + 0.42);
    master.connect(audioContext.destination);

    const low = audioContext.createOscillator();
    low.type = "triangle";
    low.frequency.setValueAtTime(105, now);
    low.frequency.exponentialRampToValueAtTime(48, now + 0.18);
    low.connect(master);
    low.start(now);
    low.stop(now + 0.22);

    const clickGain = audioContext.createGain();
    clickGain.gain.setValueAtTime(0.35, now + 0.13);
    clickGain.gain.exponentialRampToValueAtTime(0.0001, now + 0.32);
    clickGain.connect(audioContext.destination);

    const click = audioContext.createOscillator();
    click.type = "square";
    click.frequency.setValueAtTime(680, now + 0.13);
    click.frequency.exponentialRampToValueAtTime(130, now + 0.28);
    click.connect(clickGain);
    click.start(now + 0.13);
    click.stop(now + 0.33);

    badge.classList.add("lit");
    setTimeout(() => badge.classList.remove("lit"), 420);
    setTimeout(resolve, 520);
  });
}

function stopAll(reset = true) {
  dedication.pause();
  song.pause();
  if (reset) {
    dedication.currentTime = 0;
    song.currentTime = 0;
  }
  currentAudio = null;
  setPlaying(false);
  stopMeter();
}

function setPlaying(isPlaying) {
  shell.classList.toggle("is-playing", isPlaying);
}

function updateProgress() {
  if (!currentAudio) return;
  const duration = currentAudio.duration || 0;
  const current = currentAudio.currentTime || 0;
  timeText.textContent = `${formatTime(current)} / ${formatTime(duration)}`;
  progressFill.style.width = duration ? `${(current / duration) * 100}%` : "0%";
}

dedication.addEventListener("timeupdate", updateProgress);
song.addEventListener("timeupdate", updateProgress);

song.addEventListener("ended", () => {
  statusText.textContent = "Finished";
  setPlaying(false);
  stopMeter();
  progressFill.style.width = "100%";
});

playButton.addEventListener("click", playSequence);

pauseButton.addEventListener("click", () => {
  if (currentAudio) currentAudio.pause();
  statusText.textContent = "Paused";
  setPlaying(false);
  stopMeter();
});

restartButton.addEventListener("click", () => {
  playSequence();
});

function startMeter() {
  if (!analyser) return;
  const data = new Uint8Array(analyser.frequencyBinCount);

  const draw = () => {
    analyser.getByteFrequencyData(data);
    let total = 0;
    for (let i = 0; i < data.length; i++) total += data[i];
    const average = total / data.length;
    const activeBars = Math.max(1, Math.round((average / 150) * meterBars.length));

    meterBars.forEach((bar, index) => {
      bar.classList.toggle("active", index < activeBars);
    });

    animationFrame = requestAnimationFrame(draw);
  };

  draw();
}

function stopMeter() {
  if (animationFrame) cancelAnimationFrame(animationFrame);
  animationFrame = null;
  meterBars.forEach(bar => bar.classList.remove("active"));
}

function formatTime(seconds) {
  if (!Number.isFinite(seconds)) return "0:00";
  const whole = Math.max(0, Math.floor(seconds));
  return `${Math.floor(whole / 60)}:${String(whole % 60).padStart(2, "0")}`;
}

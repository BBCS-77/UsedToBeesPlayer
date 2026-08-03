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
const id = (params.get("id") || "johnberry").toLowerCase().replace(/[^a-z0-9]/g, "");
const profile = PROFILES[id] || PROFILES.johnberry;

const player = document.querySelector(".player");
const dedication = document.getElementById("dedicationAudio");
const song = document.getElementById("songAudio");
const playButton = document.getElementById("playSequence");
const pauseButton = document.getElementById("pauseAudio");
const restartButton = document.getElementById("restartAudio");
const stopButton = document.getElementById("stopAudio");
const statusText = document.getElementById("statusText");
const timeText = document.getElementById("timeText");
const durationText = document.getElementById("durationText");
const progressFill = document.getElementById("progressFill");
const vuNeedle = document.querySelector(".vu-needle");

document.getElementById("classmateName").textContent = profile.classmate.toUpperCase();
document.getElementById("songTitle").textContent = profile.title;
document.getElementById("artistLine").textContent = profile.artist;
document.getElementById("yearLine").textContent = profile.year;
document.getElementById("cartridgeSong").textContent = profile.title.toUpperCase();
document.getElementById("cartridgeArtist").textContent = profile.artist.toUpperCase();
document.getElementById("cartridgeYear").textContent = profile.year;
document.title = `${profile.classmate} — ${profile.title}`;

dedication.src = profile.dedication;
song.src = profile.song;

let currentAudio = null;
let audioContext;
let analyser;
let graphReady = false;
let meterFrame;
let sequenceNumber = 0;

function setupAudioGraph() {
  if (!audioContext) {
    audioContext = new (window.AudioContext || window.webkitAudioContext)();
    analyser = audioContext.createAnalyser();
    analyser.fftSize = 128;
    analyser.smoothingTimeConstant = 0.82;
    analyser.connect(audioContext.destination);
  }

  if (!graphReady) {
    audioContext.createMediaElementSource(dedication).connect(analyser);
    audioContext.createMediaElementSource(song).connect(analyser);
    graphReady = true;
  }

  if (audioContext.state === "suspended") audioContext.resume();
}

async function startSequence() {
  sequenceNumber += 1;
  const thisRun = sequenceNumber;

  resetAudio();
  setupAudioGraph();

  currentAudio = dedication;
  statusText.textContent = "Long-distance dedication";
  setPlaying(true);
  startMeter();

  try {
    await dedication.play();
  } catch {
    statusText.textContent = "Press play again";
    setPlaying(false);
    return;
  }

  dedication.onended = async () => {
    if (thisRun !== sequenceNumber) return;

    statusText.textContent = "Changing program";
    await playKaChunk();
    if (thisRun !== sequenceNumber) return;

    currentAudio = song;
    statusText.textContent = "Now playing";
    try {
      await song.play();
    } catch {
      statusText.textContent = "Press play to continue";
      setPlaying(false);
    }
  };
}

function playKaChunk() {
  return new Promise(resolve => {
    setupAudioGraph();
    const t = audioContext.currentTime;

    const master = audioContext.createGain();
    master.gain.setValueAtTime(0.0001, t);
    master.gain.exponentialRampToValueAtTime(0.7, t + 0.01);
    master.gain.exponentialRampToValueAtTime(0.0001, t + 0.45);
    master.connect(audioContext.destination);

    const thump = audioContext.createOscillator();
    thump.type = "triangle";
    thump.frequency.setValueAtTime(115, t);
    thump.frequency.exponentialRampToValueAtTime(45, t + 0.19);
    thump.connect(master);
    thump.start(t);
    thump.stop(t + 0.22);

    const clickGain = audioContext.createGain();
    clickGain.gain.setValueAtTime(0.5, t + 0.12);
    clickGain.gain.exponentialRampToValueAtTime(0.0001, t + 0.33);
    clickGain.connect(audioContext.destination);

    const click = audioContext.createOscillator();
    click.type = "square";
    click.frequency.setValueAtTime(740, t + 0.12);
    click.frequency.exponentialRampToValueAtTime(120, t + 0.3);
    click.connect(clickGain);
    click.start(t + 0.12);
    click.stop(t + 0.34);

    setTimeout(resolve, 540);
  });
}

function resetAudio() {
  dedication.pause();
  song.pause();
  dedication.currentTime = 0;
  song.currentTime = 0;
  currentAudio = null;
  setPlaying(false);
  stopMeter();
  updateProgress();
}

function setPlaying(on) {
  player.classList.toggle("is-playing", on);
}

function pauseCurrent() {
  if (currentAudio) currentAudio.pause();
  statusText.textContent = "Paused";
  setPlaying(false);
  stopMeter();
}

function stopCurrent() {
  sequenceNumber += 1;
  resetAudio();
  statusText.textContent = "Stopped";
}

function updateProgress() {
  if (!currentAudio) {
    timeText.textContent = "0:00";
    durationText.textContent = "0:00";
    progressFill.style.width = "0%";
    return;
  }

  const current = currentAudio.currentTime || 0;
  const duration = currentAudio.duration || 0;
  timeText.textContent = formatTime(current);
  durationText.textContent = formatTime(duration);
  progressFill.style.width = duration ? `${(current / duration) * 100}%` : "0%";
}

function startMeter() {
  if (!analyser) return;
  const data = new Uint8Array(analyser.frequencyBinCount);

  const draw = () => {
    analyser.getByteFrequencyData(data);
    let sum = 0;
    for (const value of data) sum += value;
    const average = sum / data.length;
    const rotation = -78 + Math.min(58, (average / 150) * 58);
    vuNeedle.style.transform = `rotate(${rotation}deg)`;
    meterFrame = requestAnimationFrame(draw);
  };

  draw();
}

function stopMeter() {
  if (meterFrame) cancelAnimationFrame(meterFrame);
  meterFrame = null;
  vuNeedle.style.transform = "rotate(-73deg)";
}

function formatTime(value) {
  if (!Number.isFinite(value)) return "0:00";
  const total = Math.max(0, Math.floor(value));
  return `${Math.floor(total / 60)}:${String(total % 60).padStart(2, "0")}`;
}

dedication.addEventListener("timeupdate", updateProgress);
song.addEventListener("timeupdate", updateProgress);

song.addEventListener("ended", () => {
  statusText.textContent = "Finished";
  setPlaying(false);
  stopMeter();
  progressFill.style.width = "100%";
});

playButton.addEventListener("click", () => {
  if (currentAudio && currentAudio.paused && currentAudio.currentTime > 0) {
    setupAudioGraph();
    currentAudio.play();
    statusText.textContent = currentAudio === song ? "Now playing" : "Long-distance dedication";
    setPlaying(true);
    startMeter();
  } else {
    startSequence();
  }
});

pauseButton.addEventListener("click", pauseCurrent);
restartButton.addEventListener("click", startSequence);
stopButton.addEventListener("click", stopCurrent);

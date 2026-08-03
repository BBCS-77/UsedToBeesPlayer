const profile = {
  dedication: "audio/JohnBerryDedication.mp3",
  song: "audio/Foghat-Slow-Ride.mp3"
};

const player = document.querySelector(".player");
const dedication = document.getElementById("dedicationAudio");
const song = document.getElementById("songAudio");
const playButton = document.getElementById("playButton");
const restartButton = document.getElementById("restartButton");
const stopButton = document.getElementById("stopButton");
const statusText = document.getElementById("statusText");

dedication.src = profile.dedication;
song.src = profile.song;

let currentAudio = null;
let phase = "idle";
let runId = 0;
let audioContext = null;

function setPlaying(on) {
  player.classList.toggle("is-playing", on);
}

function setStatus(text) {
  statusText.textContent = text.toUpperCase();
}

async function startSequence() {
  runId += 1;
  const thisRun = runId;

  dedication.pause();
  song.pause();
  dedication.currentTime = 0;
  song.currentTime = 0;

  currentAudio = dedication;
  phase = "dedication";
  setStatus("Long-distance dedication");
  setPlaying(true);

  try {
    await dedication.play();
  } catch (error) {
    setStatus("Click play again");
    setPlaying(false);
    return;
  }

  dedication.onended = async () => {
    if (thisRun !== runId) return;
    phase = "kachunk";
    setStatus("Changing program");
    await playKaChunk();
    if (thisRun !== runId) return;

    currentAudio = song;
    phase = "song";
    setStatus("Now playing");
    try {
      await song.play();
    } catch (error) {
      setStatus("Click play to continue");
      setPlaying(false);
    }
  };
}

async function togglePlayPause() {
  if (!currentAudio || phase === "idle" || phase === "finished") {
    await startSequence();
    return;
  }

  if (currentAudio.paused) {
    try {
      await currentAudio.play();
      setStatus(phase === "song" ? "Now playing" : "Long-distance dedication");
      setPlaying(true);
    } catch {
      setStatus("Click play again");
    }
  } else {
    currentAudio.pause();
    setStatus("Paused");
    setPlaying(false);
  }
}

function stopAll() {
  runId += 1;
  dedication.pause();
  song.pause();
  dedication.currentTime = 0;
  song.currentTime = 0;
  currentAudio = null;
  phase = "idle";
  setStatus("Stopped");
  setPlaying(false);
}

function playKaChunk() {
  return new Promise(resolve => {
    audioContext ||= new (window.AudioContext || window.webkitAudioContext)();
    if (audioContext.state === "suspended") audioContext.resume();

    const t = audioContext.currentTime;
    const gain = audioContext.createGain();
    gain.gain.setValueAtTime(0.0001, t);
    gain.gain.exponentialRampToValueAtTime(0.65, t + 0.01);
    gain.gain.exponentialRampToValueAtTime(0.0001, t + 0.42);
    gain.connect(audioContext.destination);

    const thump = audioContext.createOscillator();
    thump.type = "triangle";
    thump.frequency.setValueAtTime(115, t);
    thump.frequency.exponentialRampToValueAtTime(48, t + 0.19);
    thump.connect(gain);
    thump.start(t);
    thump.stop(t + 0.22);

    const clickGain = audioContext.createGain();
    clickGain.gain.setValueAtTime(0.4, t + 0.12);
    clickGain.gain.exponentialRampToValueAtTime(0.0001, t + 0.32);
    clickGain.connect(audioContext.destination);

    const click = audioContext.createOscillator();
    click.type = "square";
    click.frequency.setValueAtTime(700, t + 0.12);
    click.frequency.exponentialRampToValueAtTime(130, t + 0.3);
    click.connect(clickGain);
    click.start(t + 0.12);
    click.stop(t + 0.34);

    setTimeout(resolve, 540);
  });
}

song.addEventListener("ended", () => {
  phase = "finished";
  currentAudio = null;
  setStatus("Finished");
  setPlaying(false);
});

playButton.addEventListener("click", togglePlayPause);
restartButton.addEventListener("click", startSequence);
stopButton.addEventListener("click", stopAll);

let profiles = [];
let currentIndex = 0;
let currentProfile = null;
let currentAudio = null;
let phase = "idle";
let runId = 0;
let program = 3;

const $ = id => document.getElementById(id);
const select = $("profileSelect");
const jingle = $("jingleAudio");
const dedication = $("dedicationAudio");
const song = $("songAudio");

const fields = {
  name: $("classmateName"),
  song: $("songTitle"),
  artist: $("artistName"),
  year: $("songYear"),
  status: $("statusText"),
  elapsed: $("elapsedTime"),
  duration: $("durationTime"),
  progress: $("progressFill"),
  program: $("programNumber")
};

boot();

async function boot() {
  try {
    const response = await fetch(`profiles.json?v=${Date.now()}`, { cache: "no-store" });
    profiles = await response.json();
    profiles.sort((a, b) => a.name.localeCompare(b.name));

    const requestedId = new URLSearchParams(location.search).get("id");
    const requestedIndex = profiles.findIndex(profile => profile.id === requestedId);
    currentIndex = requestedIndex >= 0 ? requestedIndex : 0;

    profiles.forEach((profile, index) => {
      select.add(new Option(`${profile.name} — ${profile.songTitle}`, index));
    });

    loadProfile(currentIndex);
  } catch (error) {
    console.error(error);
    setStatus("Profile data unavailable");
  }
}

function loadProfile(index) {
  if (!profiles.length) return;

  stopAll(false);
  currentIndex = (index + profiles.length) % profiles.length;
  currentProfile = profiles[currentIndex];
  select.value = String(currentIndex);

  fields.name.textContent = currentProfile.name;
  fields.song.textContent = currentProfile.songTitle;
  fields.artist.textContent = currentProfile.artist;
  fields.year.textContent = currentProfile.year;

  dedication.src = currentProfile.dedicationFile;
  song.src = currentProfile.songFile;
  dedication.load();
  song.load();

  program = 3;
  fields.program.textContent = program;
  setStatus("Ready");
  updateProgress();

  const url = new URL(location.href);
  url.searchParams.set("id", currentProfile.id);
  history.replaceState({}, "", url);
}

async function startSequence() {
  if (!currentProfile) return;

  stopAll(false);
  runId += 1;
  const token = runId;

  jingle.currentTime = 0;
  dedication.currentTime = 0;
  song.currentTime = 0;

  currentAudio = jingle;
  phase = "jingle";
  setStatus("Reunion countdown jingle");

  try {
    await jingle.play();
  } catch {
    setStatus("Press Play again");
    return;
  }

  jingle.onended = async () => {
    if (token !== runId) return;
    currentAudio = dedication;
    phase = "dedication";
    setStatus("Long-distance dedication");

    try {
      await dedication.play();
    } catch {
      setStatus("Press Play to continue");
    }
  };

  dedication.onended = async () => {
    if (token !== runId) return;
    phase = "kachunk";
    setStatus("Changing program");
    program = program === 4 ? 1 : program + 1;
    fields.program.textContent = program;
    await playKaChunk();
    if (token !== runId) return;

    currentAudio = song;
    phase = "song";
    setStatus("Now playing");

    try {
      await song.play();
    } catch {
      setStatus("Press Play to continue");
    }
  };
}

async function togglePlayPause() {
  if (!currentAudio || phase === "idle" || phase === "finished") {
    startSequence();
    return;
  }

  if (currentAudio.paused) {
    try {
      await currentAudio.play();
      setStatus(
        phase === "song" ? "Now playing" :
        phase === "dedication" ? "Long-distance dedication" :
        "Reunion countdown jingle"
      );
    } catch {
      setStatus("Press Play again");
    }
  } else {
    currentAudio.pause();
    setStatus("Paused");
  }
}

function pauseCurrent() {
  if (!currentAudio) return;
  currentAudio.pause();
  setStatus("Paused");
}

function stopAll(showStatus = true) {
  runId += 1;
  [jingle, dedication, song].forEach(audio => {
    audio.pause();
    audio.currentTime = 0;
  });

  currentAudio = null;
  phase = "idle";
  updateProgress();
  if (showStatus) setStatus("Stopped");
}

function updateProgress() {
  if (!currentAudio) {
    fields.elapsed.textContent = "0:00";
    fields.duration.textContent = "0:00";
    fields.progress.style.width = "0%";
    return;
  }

  const current = currentAudio.currentTime || 0;
  const duration = currentAudio.duration || 0;

  fields.elapsed.textContent = formatTime(current);
  fields.duration.textContent = formatTime(duration);
  fields.progress.style.width = duration ? `${(current / duration) * 100}%` : "0%";
}

function playKaChunk() {
  return new Promise(resolve => {
    const AudioContextClass = window.AudioContext || window.webkitAudioContext;
    const context = new AudioContextClass();
    const now = context.currentTime;

    const gain = context.createGain();
    gain.gain.setValueAtTime(0.0001, now);
    gain.gain.exponentialRampToValueAtTime(0.65, now + 0.01);
    gain.gain.exponentialRampToValueAtTime(0.0001, now + 0.42);
    gain.connect(context.destination);

    const oscillator = context.createOscillator();
    oscillator.type = "triangle";
    oscillator.frequency.setValueAtTime(110, now);
    oscillator.frequency.exponentialRampToValueAtTime(45, now + 0.2);
    oscillator.connect(gain);
    oscillator.start(now);
    oscillator.stop(now + 0.24);

    setTimeout(() => {
      context.close();
      resolve();
    }, 480);
  });
}

function setStatus(text) {
  fields.status.textContent = String(text).toUpperCase();
}

function formatTime(seconds) {
  const safe = Math.max(0, Math.floor(Number.isFinite(seconds) ? seconds : 0));
  return `${Math.floor(safe / 60)}:${String(safe % 60).padStart(2, "0")}`;
}

select.addEventListener("change", event => loadProfile(Number(event.target.value)));
$("previousProfile").addEventListener("click", () => loadProfile(currentIndex - 1));
$("nextProfile").addEventListener("click", () => loadProfile(currentIndex + 1));
$("randomProfile").addEventListener("click", () => {
  if (profiles.length < 2) return;
  let index = currentIndex;
  while (index === currentIndex) index = Math.floor(Math.random() * profiles.length);
  loadProfile(index);
});

$("playButton").addEventListener("click", togglePlayPause);
$("pauseButton").addEventListener("click", pauseCurrent);
$("restartButton").addEventListener("click", startSequence);
$("stopButton").addEventListener("click", () => stopAll(true));

[jingle, dedication, song].forEach(audio => {
  audio.addEventListener("timeupdate", updateProgress);
  audio.addEventListener("loadedmetadata", updateProgress);
});

song.addEventListener("ended", () => {
  phase = "finished";
  currentAudio = null;
  setStatus("Finished");
  fields.progress.style.width = "100%";
});

let profiles = [];
let currentIndex = 0;
let currentProfile = null;
let currentAudio = null;
let phase = "idle";
let runId = 0;
let audioContext = null;
let analyser = null;
let meterFrame = null;
let program = 3;

const $ = id => document.getElementById(id);
const player = document.querySelector(".player");
const select = $("profileSelect");
const jingle = $("jingleAudio");
const dedication = $("dedicationAudio");
const song = $("songAudio");
const statusText = $("statusText");
const progress = $("displayProgressFill");
const vu = $("vuNeedle");
const programNumber = $("programNumber");
const cartridge = document.querySelector(".cartridge-overlay");

const fields = {
  name: $("cartridgeName"),
  song: $("cartridgeSong"),
  artist: $("cartridgeArtist"),
  year: $("cartridgeYear"),
  displaySong: $("displaySong"),
  displayArtist: $("displayArtist"),
  displayYear: $("displayYear"),
  summary: $("profileSummary"),
  elapsed: $("elapsedTime"),
  duration: $("durationTime")
};

boot();

async function boot() {
  try {
    const response = await fetch(`profiles.json?v=${Date.now()}`, { cache: "no-store" });
    if (!response.ok) throw new Error("Unable to load profiles.json");

    profiles = await response.json();
    profiles.sort((a, b) => a.name.localeCompare(b.name));

    const requestedId = new URLSearchParams(location.search).get("id");
    const requestedIndex = profiles.findIndex(profile => profile.id === requestedId);
    currentIndex = requestedIndex >= 0 ? requestedIndex : 0;

    profiles.forEach((profile, index) => {
      select.add(new Option(`${profile.name} — ${profile.songTitle}`, index));
    });

    await loadProfile(currentIndex, false);
  } catch (error) {
    console.error(error);
    setStatus("Profile data unavailable");
  }
}

async function loadProfile(index, animate = true) {
  if (!profiles.length) return;

  stopAll(false);
  currentIndex = (index + profiles.length) % profiles.length;
  currentProfile = profiles[currentIndex];
  select.value = String(currentIndex);

  if (animate) {
    cartridge.classList.add("is-changing");
    await delay(310);
  }

  fields.name.textContent = currentProfile.name.toUpperCase();
  fields.song.textContent = currentProfile.songTitle.toUpperCase();
  fields.artist.textContent = currentProfile.artist.toUpperCase();
  fields.year.textContent = currentProfile.year;
  fields.displaySong.textContent = currentProfile.songTitle;
  fields.displayArtist.textContent = currentProfile.artist;
  fields.displayYear.textContent = currentProfile.year;
  fields.summary.textContent =
    `${currentProfile.name} chose “${currentProfile.songTitle}” by ${currentProfile.artist} (${currentProfile.year}).`;

  cartridge.className = `cartridge-overlay theme-${currentProfile.labelTheme || "cream"}`;

  dedication.src = currentProfile.dedicationFile;
  song.src = currentProfile.songFile;
  dedication.load();
  song.load();

  program = 3;
  programNumber.textContent = String(program);
  updateProgress();
  setStatus("Ready");

  const url = new URL(location.href);
  url.searchParams.set("id", currentProfile.id);
  history.replaceState({}, "", url);
}

async function startSequence() {
  if (!currentProfile) return;

  runId += 1;
  const token = runId;
  stopAll(false);

  currentAudio = jingle;
  phase = "jingle";
  jingle.currentTime = 0;
  dedication.currentTime = 0;
  song.currentTime = 0;

  setStatus("Used to Bees Reunion Countdown");
  setPlaying(true);
  startMeter();

  try {
    await jingle.play();
  } catch (error) {
    console.error(error);
    setStatus("Click play again");
    setPlaying(false);
    stopMeter();
    return;
  }

  jingle.onended = async () => {
    if (token !== runId) return;

    currentAudio = dedication;
    phase = "dedication";
    setStatus("Long-distance dedication");

    try {
      await dedication.play();
    } catch (error) {
      console.error(error);
      setStatus("Click play to continue");
      setPlaying(false);
      stopMeter();
    }
  };

  dedication.onended = async () => {
    if (token !== runId) return;

    phase = "kachunk";
    setStatus("Changing program");
    await flipProgram();
    await playKaChunk();
    if (token !== runId) return;

    currentAudio = song;
    phase = "song";
    setStatus("Now playing");

    try {
      await song.play();
    } catch (error) {
      console.error(error);
      setStatus("Click play to continue");
      setPlaying(false);
      stopMeter();
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
      setupAudio();
      await currentAudio.play();
      setStatus(statusForPhase());
      setPlaying(true);
      startMeter();
    } catch (error) {
      console.error(error);
      setStatus("Click play again");
    }
  } else {
    currentAudio.pause();
    setStatus("Paused");
    setPlaying(false);
    stopMeter();
  }
}

function statusForPhase() {
  if (phase === "jingle") return "Used to Bees Reunion Countdown";
  if (phase === "dedication") return "Long-distance dedication";
  if (phase === "song") return "Now playing";
  return "Ready";
}

function stopAll(showStatus = true) {
  runId += 1;

  [jingle, dedication, song].forEach(audio => {
    audio.pause();
    audio.currentTime = 0;
  });

  currentAudio = null;
  phase = "idle";
  setPlaying(false);
  stopMeter();
  updateProgress();

  if (showStatus) setStatus("Stopped");
}

function setPlaying(value) {
  player.classList.toggle("is-playing", value);
}

function setStatus(text) {
  statusText.textContent = String(text).toUpperCase();
}

function updateProgress() {
  if (!currentAudio) {
    fields.elapsed.textContent = "0:00";
    fields.duration.textContent = "0:00";
    progress.style.width = "0%";
    return;
  }

  const current = currentAudio.currentTime || 0;
  const duration = currentAudio.duration || 0;
  fields.elapsed.textContent = formatTime(current);
  fields.duration.textContent = formatTime(duration);
  progress.style.width = duration ? `${(current / duration) * 100}%` : "0%";
}

function setupAudio() {
  audioContext ||= new (window.AudioContext || window.webkitAudioContext)();

  if (!analyser) {
    analyser = audioContext.createAnalyser();
    analyser.fftSize = 128;
    analyser.smoothingTimeConstant = 0.82;

    audioContext.createMediaElementSource(jingle).connect(analyser);
    audioContext.createMediaElementSource(dedication).connect(analyser);
    audioContext.createMediaElementSource(song).connect(analyser);
    analyser.connect(audioContext.destination);
  }

  if (audioContext.state === "suspended") audioContext.resume();
}

function startMeter() {
  setupAudio();
  stopMeter();

  const data = new Uint8Array(analyser.frequencyBinCount);

  const draw = () => {
    analyser.getByteFrequencyData(data);
    let total = 0;
    for (const value of data) total += value;

    const average = total / data.length;
    const rotation = -77 + Math.min(60, (average / 150) * 60);
    vu.style.transform = `rotate(${rotation}deg)`;
    meterFrame = requestAnimationFrame(draw);
  };

  draw();
}

function stopMeter() {
  if (meterFrame) cancelAnimationFrame(meterFrame);
  meterFrame = null;
  vu.style.transform = "rotate(-74deg)";
}

async function flipProgram() {
  programNumber.classList.add("flip");
  await delay(170);
  program = program === 4 ? 1 : program + 1;
  programNumber.textContent = String(program);
  programNumber.classList.remove("flip");
}

function playKaChunk() {
  return new Promise(resolve => {
    setupAudio();
    const time = audioContext.currentTime;

    const master = audioContext.createGain();
    master.gain.setValueAtTime(0.0001, time);
    master.gain.exponentialRampToValueAtTime(0.72, time + 0.01);
    master.gain.exponentialRampToValueAtTime(0.0001, time + 0.46);
    master.connect(audioContext.destination);

    const thump = audioContext.createOscillator();
    thump.type = "triangle";
    thump.frequency.setValueAtTime(118, time);
    thump.frequency.exponentialRampToValueAtTime(46, time + 0.2);
    thump.connect(master);
    thump.start(time);
    thump.stop(time + 0.23);

    const clickGain = audioContext.createGain();
    clickGain.gain.setValueAtTime(0.45, time + 0.13);
    clickGain.gain.exponentialRampToValueAtTime(0.0001, time + 0.34);
    clickGain.connect(audioContext.destination);

    const click = audioContext.createOscillator();
    click.type = "square";
    click.frequency.setValueAtTime(760, time + 0.13);
    click.frequency.exponentialRampToValueAtTime(125, time + 0.31);
    click.connect(clickGain);
    click.start(time + 0.13);
    click.stop(time + 0.35);

    setTimeout(resolve, 560);
  });
}

function formatTime(seconds) {
  const safe = Math.max(0, Math.floor(Number.isFinite(seconds) ? seconds : 0));
  return `${Math.floor(safe / 60)}:${String(safe % 60).padStart(2, "0")}`;
}

function delay(milliseconds) {
  return new Promise(resolve => setTimeout(resolve, milliseconds));
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
  setPlaying(false);
  stopMeter();
  progress.style.width = "100%";
});

let profiles=[];
let currentIndex=0;
let currentProfile=null;
let phase="idle";
let runId=0;

const $=id=>document.getElementById(id);
const audio=$("sequenceAudio");
const select=$("profileSelect");
const yearbook=$("yearbookPhoto");
const video=$("aiVideo");
const current=$("currentPhoto");
const fallback=$("photoFallback");
const flash=$("mediaFlash");
const aiButton=$("showAiVideo");

const fields={
  status:$("statusText"),
  elapsed:$("elapsedTime"),
  duration:$("durationTime"),
  progress:$("progressFill")
};

const JINGLE="audio/jingles/Used-to-Bees-Reunion-Countdown.mp3";

boot();

async function boot(){
  try{
    const response=await fetch(`profiles.json?v=${Date.now()}`,{cache:"no-store"});
    if(!response.ok)throw new Error(`profiles.json ${response.status}`);

    profiles=await response.json();
    profiles.sort((a,b)=>a.name.localeCompare(b.name));

    const wanted=new URLSearchParams(location.search).get("id");
    const found=profiles.findIndex(profile=>profile.id===wanted);
    currentIndex=found>=0?found:0;

    profiles.forEach((profile,index)=>{
      select.add(new Option(`${profile.name} — ${profile.songTitle}`,index));
    });

    loadProfile(currentIndex);
  }catch(error){
    console.error(error);
    setStatus("Profile data unavailable");
  }
}

function loadProfile(index){
  stopSequence(false);

  currentIndex=(index+profiles.length)%profiles.length;
  currentProfile=profiles[currentIndex];
  select.value=String(currentIndex);

  $("activeNameLeft").textContent=currentProfile.name;
  $("songStrip").textContent=currentProfile.songTitle;
  $("artistStrip").textContent=currentProfile.artist;
  $("yearStrip").textContent=currentProfile.year;

  const profileButton=$("profileButton");
  const profileUrl=
    currentProfile.profileUrl||
    currentProfile.profileURL||
    currentProfile.classmateProfileUrl||
    "";

  if(profileUrl){
    profileButton.href=profileUrl;
    profileButton.hidden=false;
    profileButton.setAttribute(
      "aria-label",
      `Open ${currentProfile.name}'s full classmate profile`
    );
  }else{
    profileButton.hidden=true;
    profileButton.removeAttribute("href");
  }

  loadMedia();
  showMedia("yearbook");
  setStatus("Ready");
  updateProgress();

  const url=new URL(location.href);
  url.searchParams.set("id",currentProfile.id);
  history.replaceState({},"",url);
}

function loadMedia(){
  fallback.hidden=true;

  [yearbook,video,current].forEach(element=>{
    element.style.display="";
    element.classList.remove("portrait-visible");
  });

  const compactName=(currentProfile.name||"").replace(/[^A-Za-z0-9]/g,"");

  const configuredYearbook=
    currentProfile.yearbookPhoto||
    (Array.isArray(currentProfile.photos)?currentProfile.photos[0]:"");

  const configuredCurrent=
    currentProfile.currentPhoto||
    (Array.isArray(currentProfile.photos)?currentProfile.photos[1]:"");

  const configuredVideo=
    currentProfile.aiVideo||
    currentProfile.videoFile||
    currentProfile.aiVideoFile||
    "";

  const yearbookCandidates=[
    configuredYearbook,
    `photos/yearbook/${compactName}.jpg`,
    `photos/yearbook/${compactName}.jpeg`,
    `photos/yearbook/${compactName}.png`,
    `photos/yearbook/${compactName}.JPG`,
    `photos/yearbook/${compactName}.JPEG`,
    `photos/yearbook/${compactName}.PNG`
  ].filter(Boolean);

  const currentCandidates=[
    configuredCurrent,
    `photos/current/${compactName}.jpg`,
    `photos/current/${compactName}.jpeg`,
    `photos/current/${compactName}.png`,
    `photos/current/${compactName}.JPG`,
    `photos/current/${compactName}.JPEG`,
    `photos/current/${compactName}.PNG`
  ].filter(Boolean);

  loadFirstWorkingImage(yearbook,yearbookCandidates,()=>{
    fallback.hidden=true;
  },()=>{
    yearbook.style.display="none";
    showFallbackIfNeeded();
  });

  loadFirstWorkingImage(current,currentCandidates,()=>{
    fallback.hidden=true;
  },()=>{
    current.style.display="none";
    showFallbackIfNeeded();
  });

  yearbook.alt=`${currentProfile.name} in 1977`;
  current.alt=`${currentProfile.name} today`;
  yearbook.style.objectPosition=currentProfile.yearbookPhotoPosition||"center 24%";
  current.style.objectPosition=currentProfile.currentPhotoPosition||"center 24%";

  video.pause();
  video.removeAttribute("src");
  video.load();
  video.muted=currentProfile.aiVideoMuted!==false;
  video.volume=Number.isFinite(currentProfile.aiVideoVolume)
    ? Math.max(0,Math.min(1,currentProfile.aiVideoVolume))
    : 1;
  video.style.objectPosition=currentProfile.aiVideoPosition||"center 24%";

  if(configuredVideo){
    video.src=new URL(configuredVideo,document.baseURI).href;
    video.load();
    aiButton.disabled=false;
    aiButton.title="Play AI video";
  }else{
    video.style.display="none";
    aiButton.disabled=true;
    aiButton.title="No AI video is available for this classmate";
  }
}

function loadFirstWorkingImage(image,candidates,onSuccess,onFailure){
  let index=0;

  const tryNext=()=>{
    if(index>=candidates.length){
      onFailure();
      return;
    }

    const candidate=candidates[index++];
    const url=new URL(candidate,document.baseURI);
    url.searchParams.set("imgv","50");

    image.onload=()=>{
      image.style.display="";
      onSuccess();
    };
    image.onerror=tryNext;
    image.src=url.href;
  };

  tryNext();
}

function showFallbackIfNeeded(){
  const noYearbook=yearbook.style.display==="none";
  const noCurrent=current.style.display==="none";
  const noVideo=!currentProfile.aiVideo;
  fallback.hidden=!(noYearbook&&noCurrent&&noVideo);
}

function setActiveTab(which){
  $("showYearbook").classList.toggle("active",which==="yearbook");
  aiButton.classList.toggle("active",which==="video");
  $("showCurrent").classList.toggle("active",which==="current");
}

function hideAllMedia(){
  yearbook.classList.remove("portrait-visible");
  video.classList.remove("portrait-visible");
  current.classList.remove("portrait-visible");
}

function showMedia(which){
  hideAllMedia();
  setActiveTab(which);

  if(which==="yearbook"){
    video.pause();
    yearbook.classList.add("portrait-visible");
  }else if(which==="video"){
    video.classList.add("portrait-visible");
  }else{
    video.pause();
    current.classList.add("portrait-visible");
  }
}

function relayFlash(){
  flash.classList.remove("flash");
  void flash.offsetWidth;
  flash.classList.add("flash");
}

async function startSequence(){
  if(!currentProfile)return;

  stopSequence(false);
  runId+=1;
  const token=runId;

  showMedia("yearbook");
  await playAudioStage("jingle",JINGLE,"Reunion countdown jingle",token);
}

async function playAudioStage(nextPhase,source,status,token){
  if(token!==runId)return;

  phase=nextPhase;
  audio.src=source;
  audio.load();
  setStatus(status);

  try{
    await audio.play();
  }catch(error){
    console.error(`Failed to play ${nextPhase}:`,source,error);
    setStatus("Press Play to continue");
  }
}

audio.addEventListener("ended",async()=>{
  const token=runId;

  if(phase==="jingle"){
    await playAutomaticVideo(token);
    return;
  }

  if(phase==="dedication"){
    showMedia("current");
    setStatus("Changing selection");
    playKaChunkNonBlocking();

    setTimeout(()=>{
      playAudioStage(
        "song",
        currentProfile.songFile,
        "Now playing",
        token
      );
    },350);
    return;
  }

  if(phase==="song"){
    phase="finished";
    setStatus("Finished");
    fields.progress.style.width="100%";
  }
});

async function playAutomaticVideo(token){
  if(token!==runId)return;

  const videoSource=
    currentProfile.aiVideo||
    currentProfile.videoFile||
    currentProfile.aiVideoFile||
    "";

  if(!videoSource){
    await beginDedication(token);
    return;
  }

  phase="video";
  audio.pause();
  relayFlash();
  showMedia("video");
  setStatus("AI video");

  try{
    video.currentTime=0;
    await video.play();
  }catch(error){
    console.warn("AI video could not autoplay; continuing to dedication.",error);
    await beginDedication(token);
  }
}

video.addEventListener("ended",async()=>{
  if(phase!=="video"&&phase!=="manualVideo")return;

  if(phase==="manualVideo"){
    showMedia("current");
    setStatus("Ready");
    phase="idle";
    return;
  }

  await beginDedication(runId);
});

video.addEventListener("error",async()=>{
  console.error("Video error:",video.src,video.error);

  if(phase==="video"){
    await beginDedication(runId);
  }else{
    aiButton.disabled=true;
    setStatus("AI video unavailable");
  }
});

async function beginDedication(token){
  if(token!==runId)return;

  relayFlash();
  showMedia("current");

  await playAudioStage(
    "dedication",
    currentProfile.dedicationFile,
    "Long-distance dedication",
    token
  );
}

async function playOrPause(){
  if(phase==="idle"||phase==="finished"){
    startSequence();
    return;
  }

  if(phase==="video"||phase==="manualVideo"){
    if(video.paused){
      try{
        await video.play();
        setStatus("AI video");
      }catch(error){
        console.error(error);
        setStatus("Press Play again");
      }
    }else{
      video.pause();
      setStatus("Paused");
    }
    return;
  }

  if(audio.paused){
    try{
      await audio.play();
      setStatus(
        phase==="song"?"Now playing":
        phase==="dedication"?"Long-distance dedication":
        "Reunion countdown jingle"
      );
    }catch(error){
      console.error(error);
      setStatus("Press Play again");
    }
  }else{
    audio.pause();
    setStatus("Paused");
  }
}

async function playManualVideo(){
  const source=
    currentProfile.aiVideo||
    currentProfile.videoFile||
    currentProfile.aiVideoFile||
    "";

  if(!source)return;

  stopSequence(false);
  runId+=1;
  phase="manualVideo";
  relayFlash();
  showMedia("video");
  setStatus("AI video");

  try{
    video.currentTime=0;
    await video.play();
  }catch(error){
    console.error(error);
    setStatus("Press AI Video again");
  }
}

function showManualPhoto(which){
  stopSequence(false);
  phase="idle";
  showMedia(which);
  setStatus("Ready");
}

function stopSequence(show=true){
  runId+=1;

  audio.pause();
  audio.removeAttribute("src");
  audio.load();

  video.pause();
  try{video.currentTime=0}catch{}

  phase="idle";
  updateProgress();

  if(show)setStatus("Stopped");
}

function playKaChunkNonBlocking(){
  try{
    const AudioContextClass=window.AudioContext||window.webkitAudioContext;
    if(!AudioContextClass)return;

    const context=new AudioContextClass();
    const time=context.currentTime;
    const gain=context.createGain();
    const oscillator=context.createOscillator();

    gain.gain.setValueAtTime(.0001,time);
    gain.gain.exponentialRampToValueAtTime(.5,time+.01);
    gain.gain.exponentialRampToValueAtTime(.0001,time+.28);
    gain.connect(context.destination);

    oscillator.type="triangle";
    oscillator.frequency.setValueAtTime(105,time);
    oscillator.frequency.exponentialRampToValueAtTime(48,time+.18);
    oscillator.connect(gain);
    oscillator.start(time);
    oscillator.stop(time+.22);

    setTimeout(()=>context.close(),400);
  }catch(error){
    console.warn("Ka-chunk skipped",error);
  }
}

function updateProgress(){
  if(phase==="video"||phase==="manualVideo"){
    const currentTime=video.currentTime||0;
    const duration=video.duration||0;
    fields.elapsed.textContent=formatTime(currentTime);
    fields.duration.textContent=formatTime(duration);
    fields.progress.style.width=duration
      ?`${currentTime/duration*100}%`
      :"0%";
    return;
  }

  const currentTime=audio.currentTime||0;
  const duration=audio.duration||0;
  fields.elapsed.textContent=formatTime(currentTime);
  fields.duration.textContent=formatTime(duration);
  fields.progress.style.width=duration
    ?`${currentTime/duration*100}%`
    :"0%";
}

function setStatus(text){
  fields.status.textContent=String(text).toUpperCase();
}

function formatTime(seconds){
  const safe=Math.max(
    0,
    Math.floor(Number.isFinite(seconds)?seconds:0)
  );
  return `${Math.floor(safe/60)}:${String(safe%60).padStart(2,"0")}`;
}

select.addEventListener("change",event=>{
  loadProfile(Number(event.target.value));
});

$("previousProfile").addEventListener("click",()=>{
  loadProfile(currentIndex-1);
});

$("nextProfile").addEventListener("click",()=>{
  loadProfile(currentIndex+1);
});

$("randomProfile").addEventListener("click",()=>{
  if(profiles.length<2)return;
  let index=currentIndex;
  while(index===currentIndex){
    index=Math.floor(Math.random()*profiles.length);
  }
  loadProfile(index);
});

$("showYearbook").addEventListener("click",()=>{
  showManualPhoto("yearbook");
});

aiButton.addEventListener("click",playManualVideo);

$("showCurrent").addEventListener("click",()=>{
  showManualPhoto("current");
});

$("playButton").addEventListener("click",playOrPause);

$("pauseButton").addEventListener("click",()=>{
  if(phase==="video"||phase==="manualVideo"){
    video.pause();
  }else{
    audio.pause();
  }
  setStatus("Paused");
});

$("restartButton").addEventListener("click",startSequence);
$("stopButton").addEventListener("click",()=>stopSequence(true));

audio.addEventListener("timeupdate",updateProgress);
audio.addEventListener("loadedmetadata",updateProgress);
audio.addEventListener("error",()=>{
  console.error("Audio error:",audio.src,audio.error);
});

video.addEventListener("timeupdate",updateProgress);
video.addEventListener("loadedmetadata",updateProgress);

let profiles=[],currentIndex=0,currentProfile=null,phase="idle",runId=0,photoTimer=null;
const $=id=>document.getElementById(id);
const audio=$("sequenceAudio"),select=$("profileSelect"),yearbook=$("yearbookPhoto"),current=$("currentPhoto"),fallback=$("photoFallback");
const fields={status:$("statusText"),elapsed:$("elapsedTime"),duration:$("durationTime"),progress:$("progressFill")};
const JINGLE="audio/jingles/Used-to-Bees-Reunion-Countdown.mp3";

boot();

async function boot(){
  try{
    const r=await fetch(`profiles.json?v=${Date.now()}`,{cache:"no-store"});
    if(!r.ok)throw new Error(`profiles.json ${r.status}`);
    profiles=await r.json();
    profiles.sort((a,b)=>a.name.localeCompare(b.name));
    const wanted=new URLSearchParams(location.search).get("id");
    const found=profiles.findIndex(p=>p.id===wanted);
    currentIndex=found>=0?found:0;
    profiles.forEach((p,i)=>select.add(new Option(`${p.name} — ${p.songTitle}`,i)));
    loadProfile(currentIndex);
  }catch(e){console.error(e);setStatus("Profile data unavailable")}
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

  loadPhotos();
  showPhoto("yearbook");
  setStatus("Ready");
  updateProgress();

  const u=new URL(location.href);
  u.searchParams.set("id",currentProfile.id);
  history.replaceState({},"",u);
}

function loadPhotos(){
  fallback.hidden=true;
  yearbook.style.display="";
  current.style.display="";
  yearbook.classList.add("portrait-visible");
  current.classList.remove("portrait-visible");

  const compactName=(currentProfile.name||"").replace(/[^A-Za-z0-9]/g,"");
  const configuredYearbook=
    currentProfile.yearbookPhoto ||
    (Array.isArray(currentProfile.photos) ? currentProfile.photos[0] : "");
  const configuredCurrent=
    currentProfile.currentPhoto ||
    (Array.isArray(currentProfile.photos) ? currentProfile.photos[1] : "");

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

  let yearbookLoaded=false;
  let currentLoaded=false;

  loadFirstWorking(yearbook,yearbookCandidates,()=>{
    yearbookLoaded=true;
    fallback.hidden=true;
  },()=>{
    yearbook.style.display="none";
    if(!currentLoaded) fallback.hidden=false;
  });

  loadFirstWorking(current,currentCandidates,()=>{
    currentLoaded=true;
    fallback.hidden=true;
  },()=>{
    current.style.display="none";
    if(!yearbookLoaded) fallback.hidden=false;
  });

  yearbook.alt=`${currentProfile.name} in 1977`;
  current.alt=`${currentProfile.name} today`;
  yearbook.style.objectPosition=currentProfile.yearbookPhotoPosition||"center 24%";
  current.style.objectPosition=currentProfile.currentPhotoPosition||"center 24%";
}

function loadFirstWorking(img,candidates,onSuccess,onFailure){
  let index=0;

  const tryNext=()=>{
    if(index>=candidates.length){
      onFailure();
      return;
    }

    const candidate=candidates[index++];
    const url=new URL(candidate,document.baseURI);
    url.searchParams.set("imgv","46");

    img.onload=()=>{
      img.style.display="";
      onSuccess();
    };

    img.onerror=tryNext;
    img.src=url.href;
  };

  tryNext();
}

function showPhoto(which){
  clearTimeout(photoTimer);
  const today=which==="current";
  yearbook.classList.toggle("portrait-visible",!today);
  current.classList.toggle("portrait-visible",today);
  $("showYearbook").classList.toggle("active",!today);
  $("showCurrent").classList.toggle("active",today);
}

async function startSequence(){
  if(!currentProfile)return;
  stopSequence(false);
  runId+=1;
  const token=runId;
  showPhoto("yearbook");
  await playStage("jingle",JINGLE,"Reunion countdown jingle",token);
}

async function playStage(nextPhase,src,status,token){
  if(token!==runId)return;
  phase=nextPhase;
  audio.src=src;
  audio.load();
  setStatus(status);
  try{
    await audio.play();
  }catch(e){
    console.error(`Failed to play ${nextPhase}:`,src,e);
    setStatus("Press Play to continue");
  }
}

audio.addEventListener("ended",async()=>{
  const token=runId;
  if(phase==="jingle"){
    photoTimer=setTimeout(()=>showPhoto("current"),8000);
    await playStage("dedication",currentProfile.dedicationFile,"Long-distance dedication",token);
    return;
  }
  if(phase==="dedication"){
    clearTimeout(photoTimer);
    showPhoto("current");
    setStatus("Changing selection");
    playKaChunkNonBlocking();
    setTimeout(()=>playStage("song",currentProfile.songFile,"Now playing",token),350);
    return;
  }
  if(phase==="song"){
    phase="finished";
    setStatus("Finished");
    fields.progress.style.width="100%";
  }
});

async function playOrPause(){
  if(phase==="idle"||phase==="finished"){startSequence();return}
  if(audio.paused){
    try{await audio.play();setStatus(phase==="song"?"Now playing":phase==="dedication"?"Long-distance dedication":"Reunion countdown jingle")}
    catch(e){console.error(e);setStatus("Press Play again")}
  }else{
    audio.pause();
    setStatus("Paused");
  }
}

function stopSequence(show=true){
  runId+=1;
  clearTimeout(photoTimer);
  audio.pause();
  audio.removeAttribute("src");
  audio.load();
  phase="idle";
  updateProgress();
  if(show)setStatus("Stopped");
}

function playKaChunkNonBlocking(){
  try{
    const AC=window.AudioContext||window.webkitAudioContext;
    if(!AC)return;
    const ctx=new AC(),t=ctx.currentTime,g=ctx.createGain(),o=ctx.createOscillator();
    g.gain.setValueAtTime(.0001,t);
    g.gain.exponentialRampToValueAtTime(.5,t+.01);
    g.gain.exponentialRampToValueAtTime(.0001,t+.28);
    g.connect(ctx.destination);
    o.type="triangle";
    o.frequency.setValueAtTime(105,t);
    o.frequency.exponentialRampToValueAtTime(48,t+.18);
    o.connect(g);o.start(t);o.stop(t+.22);
    setTimeout(()=>ctx.close(),400);
  }catch(e){console.warn("Ka-chunk skipped",e)}
}

function updateProgress(){
  const c=audio.currentTime||0,d=audio.duration||0;
  fields.elapsed.textContent=formatTime(c);
  fields.duration.textContent=formatTime(d);
  fields.progress.style.width=d?`${c/d*100}%`:"0%";
}
function setStatus(s){fields.status.textContent=String(s).toUpperCase()}
function formatTime(s){const n=Math.max(0,Math.floor(Number.isFinite(s)?s:0));return `${Math.floor(n/60)}:${String(n%60).padStart(2,"0")}`}

select.onchange=e=>loadProfile(Number(e.target.value));
$("previousProfile").onclick=()=>loadProfile(currentIndex-1);
$("nextProfile").onclick=()=>loadProfile(currentIndex+1);
$("randomProfile").onclick=()=>{let i=currentIndex;while(i===currentIndex)i=Math.floor(Math.random()*profiles.length);loadProfile(i)};
$("showYearbook").onclick=()=>showPhoto("yearbook");
$("showCurrent").onclick=()=>showPhoto("current");
$("playButton").onclick=playOrPause;
$("pauseButton").onclick=()=>{audio.pause();setStatus("Paused")};
$("restartButton").onclick=startSequence;
$("stopButton").onclick=()=>stopSequence(true);
audio.addEventListener("timeupdate",updateProgress);
audio.addEventListener("loadedmetadata",updateProgress);
audio.addEventListener("error",()=>console.error("Audio error:",audio.src,audio.error));

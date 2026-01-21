// Where’s Raven — Raven is ALWAYS the main find.
// Extras: magnifier zoom + scene-dependent gentle audio (procedural) + Raven hop animation.

const SCENES = [
  { id:"indoor",        name:"Indoor — Day",   img:"assets/scenes/indoor.png",       audio:"indoor" },
  { id:"outdoor",       name:"Outdoor — Day",  img:"assets/scenes/outdoor.png",      audio:"outdoor" },
  { id:"indoor-night",  name:"Indoor — Night", img:"assets/scenes/indoor-night.png", audio:"indoor" },
  { id:"outdoor-night", name:"Outdoor — Night",img:"assets/scenes/outdoor-night.png",audio:"outdoor" }
];

const RAVEN = { id:"raven", label:"Raven", img:"assets/characters/raven.png", type:"character", main:true };

const CHARACTER_POOL = [
  { id:"salem",  label:"Salem",  img:"assets/characters/salem.png",  type:"character" },
  { id:"willow", label:"Willow", img:"assets/characters/willow.png", type:"character" },
  { id:"bo",     label:"Bo",     img:"assets/characters/bo.png",     type:"character" }
];

const ITEM_POOL = [
  { id:"blanket", label:"Security blanket", img:"assets/items/security-blanket.png", type:"item" },
  { id:"cookie",  label:"Cookie",           img:"assets/items/cookie.png",           type:"item" },
  { id:"mouse",   label:"Mouse toy",        img:"assets/items/mouse.png",            type:"item" },
  { id:"sock",    label:"Sock",             img:"assets/items/sock.png",             type:"item" },
  { id:"leaf",    label:"Leaf",             img:"assets/items/leaf.png",             type:"item" },
  { id:"feather", label:"Feather",          img:"assets/items/feather.png",          type:"item" },
  { id:"rock",    label:"Rock",             img:"assets/items/rock.png",             type:"item" }
];

// Per your earlier choice: 4 items per play + random extra character(s)
const ITEMS_PER_PLAY = 4;
const EXTRA_CHARACTERS = 1; // Salem/Willow/Bo random

// --- DOM ---
const startScreen = document.getElementById("startScreen");
const gameScreen  = document.getElementById("gameScreen");
const backBtn     = document.getElementById("backBtn");
const homeBtn     = document.getElementById("homeBtn");
const newPlayBtn  = document.getElementById("newPlayBtn");
const soundBtn    = document.getElementById("soundBtn");

const sceneNameEl = document.getElementById("sceneName");
const statusChip  = document.getElementById("statusChip");
const progressText= document.getElementById("progressText");

const sceneBox    = document.getElementById("sceneBox");
const sceneImg    = document.getElementById("sceneImg");
const itemsLayer  = document.getElementById("itemsLayer");
const findList    = document.getElementById("findList");
const toast       = document.getElementById("toast");
const magnifier   = document.getElementById("magnifier");

// --- State ---
let currentScene = null;
let targets = [];     // objects for this play
let found = new Set();
let soundEnabled = true;

// --- Audio (procedural, no files needed) ---
let audioCtx = null;
let audioNodes = [];
function ensureAudio(){
  if(audioCtx) return;
  audioCtx = new (window.AudioContext || window.webkitAudioContext)();
}
function stopAudio(){
  audioNodes.forEach(n=>{ try{ n.stop ? n.stop() : n.disconnect(); }catch(e){} });
  audioNodes = [];
}
function setSoundEnabled(on){
  soundEnabled = on;
  soundBtn.setAttribute("aria-pressed", on ? "true" : "false");
  soundBtn.textContent = on ? "🔊 Sound" : "🔇 Sound";
  if(!on){ stopAudio(); }
  else if(currentScene){ playSceneAudio(currentScene.audio); }
}
function playSceneAudio(kind){
  if(!soundEnabled) return;
  ensureAudio();
  stopAudio();

  // very gentle volumes
  const master = audioCtx.createGain();
  master.gain.value = 0.10;
  master.connect(audioCtx.destination);

  if(kind === "outdoor"){
    // Pink-ish noise + soft high shimmer
    const bufferSize = 2 * audioCtx.sampleRate;
    const noiseBuffer = audioCtx.createBuffer(1, bufferSize, audioCtx.sampleRate);
    const output = noiseBuffer.getChannelData(0);
    for (let i = 0; i < bufferSize; i++) output[i] = (Math.random() * 2 - 1);

    const noise = audioCtx.createBufferSource();
    noise.buffer = noiseBuffer;
    noise.loop = true;

    const bp = audioCtx.createBiquadFilter();
    bp.type = "bandpass";
    bp.frequency.value = 900;
    bp.Q.value = 0.6;

    const g1 = audioCtx.createGain();
    g1.gain.value = 0.22;

    noise.connect(bp);
    bp.connect(g1);

    // Soft tone "breeze"
    const osc = audioCtx.createOscillator();
    osc.type = "sine";
    osc.frequency.value = 160;

    const g2 = audioCtx.createGain();
    g2.gain.value = 0.06;

    // gentle movement
    const lfo = audioCtx.createOscillator();
    lfo.type = "sine";
    lfo.frequency.value = 0.06;
    const lfoGain = audioCtx.createGain();
    lfoGain.gain.value = 0.03;
    lfo.connect(lfoGain);
    lfoGain.connect(g2.gain);

    osc.connect(g2);

    // Mix
    const mix = audioCtx.createGain();
    mix.gain.value = 1.0;
    g1.connect(mix);
    g2.connect(mix);
    mix.connect(master);

    noise.start();
    osc.start();
    lfo.start();

    audioNodes.push(noise, osc, lfo, master);
  } else {
    // Indoor: soft "pad" = 2 sines + slow tremolo
    const osc1 = audioCtx.createOscillator();
    const osc2 = audioCtx.createOscillator();
    osc1.type = "sine";
    osc2.type = "sine";
    osc1.frequency.value = 220;
    osc2.frequency.value = 277.18; // gentle third

    const g = audioCtx.createGain();
    g.gain.value = 0.08;

    const trem = audioCtx.createOscillator();
    trem.type = "sine";
    trem.frequency.value = 0.08;
    const tremGain = audioCtx.createGain();
    tremGain.gain.value = 0.03;
    trem.connect(tremGain);
    tremGain.connect(g.gain);

    const lp = audioCtx.createBiquadFilter();
    lp.type = "lowpass";
    lp.frequency.value = 900;

    osc1.connect(lp);
    osc2.connect(lp);
    lp.connect(g);
    g.connect(master);

    osc1.start();
    osc2.start();
    trem.start();

    audioNodes.push(osc1, osc2, trem, master);
  }
}

function playChime(){
  if(!soundEnabled) return;
  ensureAudio();
  const now = audioCtx.currentTime;
  const o = audioCtx.createOscillator();
  const g = audioCtx.createGain();
  o.type = "sine";
  o.frequency.setValueAtTime(660, now);
  o.frequency.exponentialRampToValueAtTime(880, now + 0.16);
  g.gain.setValueAtTime(0.0001, now);
  g.gain.exponentialRampToValueAtTime(0.12, now + 0.02);
  g.gain.exponentialRampToValueAtTime(0.0001, now + 0.35);
  o.connect(g);
  g.connect(audioCtx.destination);
  o.start(now);
  o.stop(now + 0.36);
}

// --- Utilities ---
function shuffleCopy(arr){
  const a = arr.slice();
  for(let i=a.length-1;i>0;i--){
    const j = Math.floor(Math.random()*(i+1));
    [a[i],a[j]] = [a[j],a[i]];
  }
  return a;
}
function clamp(n,min,max){ return Math.max(min, Math.min(max, n)); }

function showToast(msg){
  toast.textContent = msg;
  toast.classList.add("show");
  clearTimeout(showToast._t);
  showToast._t = setTimeout(()=> toast.classList.remove("show"), 2300);
}

// --- Build a new play (shuffle items/characters each time) ---
function buildTargets(){
  found = new Set();

  // Raven always included
  const extraChars = shuffleCopy(CHARACTER_POOL).slice(0, EXTRA_CHARACTERS);

  const items = shuffleCopy(ITEM_POOL).slice(0, ITEMS_PER_PLAY);

  targets = [RAVEN, ...extraChars, ...items];

  // Checklist order: Raven first, then others
  // Already Raven first by construction.
}

// --- Place visible objects in the scene (no hidden hotspots) ---
function placeObjects(){
  itemsLayer.innerHTML = "";

  // Get scene box size after image loads
  const rect = sceneBox.getBoundingClientRect();

  // Place within safe area (avoid edges)
  const margin = 18;
  const maxX = rect.width - 92 - margin;
  const maxY = rect.height - 92 - margin;

  // Simple non-overlap attempt
  const placed = [];

  function randomSpot(){
    return {
      x: margin + Math.random()*maxX,
      y: margin + Math.random()*maxY
    };
  }
  function overlaps(x,y){
    for(const p of placed){
      const dx = p.x - x, dy = p.y - y;
      if(Math.hypot(dx,dy) < 90) return True;
    }
    return False;
  }

  // place each target
  targets.forEach(t=>{
    const img = document.createElement("img");
    img.className = "scene-object";
    img.src = t.img;
    img.alt = t.label;
    img.draggable = false;
    img.dataset.id = t.id;

    // try a few times for spacing
    let spot = randomSpot();
    for(let k=0;k<14;k++){
      let ok = true;
      for(const p of placed){
        if(Math.hypot(p.x-spot.x, p.y-spot.y) < 86){ ok=false; break; }
      }
      if(ok) break;
      spot = randomSpot();
    }
    placed.push(spot);

    img.style.left = spot.x + "px";
    img.style.top  = spot.y + "px";

    img.addEventListener("click", ()=> onFound(t, img));
    itemsLayer.appendChild(img);
  });
}

// --- Checklist ---
function renderChecklist(){
  findList.innerHTML = "";
  targets.forEach(t=>{
    const row = document.createElement("div");
    row.className = "find-item";
    row.dataset.id = t.id;

    const im = document.createElement("img");
    im.src = t.img;
    im.alt = t.label;

    const lbl = document.createElement("div");
    lbl.className = "lbl";
    lbl.textContent = t.label;

    row.appendChild(im);
    row.appendChild(lbl);
    findList.appendChild(row);
  });

  progressText.textContent = "Found 0/" + targets.length;
  statusChip.textContent = "Find Raven first";
}

function markChecklist(id){
  const el = findList.querySelector('.find-item[data-id="' + id + '"]');
  if(el) el.classList.add("found");
}

function updateProgress(){
  progressText.textContent = "Found " + found.size + "/" + targets.length;
}

// --- Sparkle helper ---
function addSparkleAt(x,y){
  const s = document.createElement("div");
  s.className = "sparkle";
  s.style.left = (x - 45) + "px";
  s.style.top  = (y - 45) + "px";
  itemsLayer.appendChild(s);
  setTimeout(()=> s.remove(), 900);
}

// --- Found logic ---
function onFound(t, el){
  if(found.has(t.id)) return;
  found.add(t.id);
  el.classList.add("found");
  markChecklist(t.id);
  updateProgress();

  // sparkle at element center
  const r = el.getBoundingClientRect();
  const box = sceneBox.getBoundingClientRect();
  addSparkleAt((r.left - box.left) + r.width/2, (r.top - box.top) + r.height/2);

  if(t.id === "blanket"){
    showToast("Raven feels safe when she finds her blanket.");
  } else if(t.id === "raven"){
    el.classList.add("raven-found");
    playChime();
    showToast("Raven feels safe when you found her.");
    statusChip.textContent = "Raven found! Keep exploring.";
    setTimeout(()=> el.classList.remove("raven-found"), 900);
  } else if(t.type === "character"){
    showToast("You found " + t.label + "!");
  } else {
    showToast("You found a cozy item!");
  }

  if(found.size === targets.length){
    setTimeout(()=> showToast("You found everything in this scene! 🐾"), 900);
  }
}

// --- Magnifier ---
function enableMagnifier(){
  const scale = 2.0;
  magnifier.style.backgroundImage = `url('${sceneImg.src}')`;
  magnifier.style.backgroundSize = (scale*100) + "%";
}

function moveMagnifier(clientX, clientY){
  const box = sceneBox.getBoundingClientRect();
  const x = clientX - box.left;
  const y = clientY - box.top;

  const mx = clamp(x, 0, box.width);
  const my = clamp(y, 0, box.height);

  magnifier.style.left = (mx - 80) + "px";
  magnifier.style.top  = (my - 80) + "px";

  // background position (zoomed)
  const bx = (mx / box.width) * 100;
  const by = (my / box.height) * 100;
  magnifier.style.backgroundPosition = `${bx}% ${by}%`;
}

let holdTimer = null;
function hookMagnifier(){
  // Desktop hover
  sceneBox.addEventListener("mousemove", (e)=>{
    magnifier.classList.add("active");
    enableMagnifier();
    moveMagnifier(e.clientX, e.clientY);
  });
  sceneBox.addEventListener("mouseleave", ()=>{
    magnifier.classList.remove("active");
  });

  // Touch: press & hold
  sceneBox.addEventListener("pointerdown", (e)=>{
    if(e.pointerType !== "touch") return;
    clearTimeout(holdTimer);
    holdTimer = setTimeout(()=>{
      magnifier.classList.add("active");
      enableMagnifier();
      moveMagnifier(e.clientX, e.clientY);
    }, 220);
  });
  sceneBox.addEventListener("pointermove", (e)=>{
    if(!magnifier.classList.contains("active")) return;
    moveMagnifier(e.clientX, e.clientY);
  });
  sceneBox.addEventListener("pointerup", ()=>{
    clearTimeout(holdTimer);
    magnifier.classList.remove("active");
  });
  sceneBox.addEventListener("pointercancel", ()=>{
    clearTimeout(holdTimer);
    magnifier.classList.remove("active");
  });
}

// --- Navigation ---
function showStart(){
  startScreen.classList.add("active");
  gameScreen.classList.remove("active");
  currentScene = null;
  stopAudio();
}

function startScene(sceneId){
  const s = SCENES.find(x=>x.id===sceneId);
  if(!s) return;
  currentScene = s;

  // ensure audio context resumes on user gesture
  if(audioCtx && audioCtx.state === "suspended"){ audioCtx.resume().catch(()=>{}); }

  sceneNameEl.textContent = s.name;
  sceneImg.onload = ()=>{
    buildTargets();
    renderChecklist();
    placeObjects();
    updateProgress();
    playSceneAudio(s.audio);
    // reset magnifier bg
    magnifier.classList.remove("active");
  };
  sceneImg.src = s.img;

  startScreen.classList.remove("active");
  gameScreen.classList.add("active");
}

function newPlay(){
  if(!currentScene) return;
  buildTargets();
  renderChecklist();
  placeObjects();
  updateProgress();
  showToast("New play — items reshuffled!");
}

// --- Init ---
document.querySelectorAll(".scene-btn").forEach(btn=>{
  btn.addEventListener("click", ()=>{
    // start audio on first gesture
    ensureAudio();
    if(audioCtx.state === "suspended"){ audioCtx.resume().catch(()=>{}); }
    startScene(btn.dataset.scene);
  });
});
backBtn.addEventListener("click", showStart);
homeBtn.addEventListener("click", showStart);
newPlayBtn.addEventListener("click", newPlay);
soundBtn.addEventListener("click", ()=>{
  // user gesture: safe to resume
  ensureAudio();
  if(audioCtx.state === "suspended"){ audioCtx.resume().catch(()=>{}); }
  setSoundEnabled(!soundEnabled);
});
setSoundEnabled(true);
hookMagnifier();
showStart();

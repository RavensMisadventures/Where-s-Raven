// Where’s Raven? — Option B
// Randomize BOTH characters and items each play (Raven may or may not appear)

function $(id){ return document.getElementById(id); }

// --- Asset pools (make sure these files exist in your repo) ---
const CHARACTER_POOL = [
  { id:"raven",  label:"Raven",  img:"assets/characters/raven.png"  },
  { id:"salem",  label:"Salem",  img:"assets/characters/salem.png"  },
  { id:"willow", label:"Willow", img:"assets/characters/willow.png" },
  { id:"bo",     label:"Bo",     img:"assets/characters/bo.png"     }
];

const ITEM_POOL = [
  { id:"blanket", label:"Security blanket", img:"assets/items/security-blanket.png" },
  { id:"cookie",  label:"Cookie",           img:"assets/items/cookie.png" },
  { id:"mouse",   label:"Mouse toy",        img:"assets/items/mouse.png" },
  { id:"sock",    label:"Sock",             img:"assets/items/sock.png" },
  { id:"leaf",    label:"Leaf",             img:"assets/items/leaf.png" },
  { id:"feather", label:"Feather",          img:"assets/items/feather.png" },
  { id:"rock",    label:"Rock",             img:"assets/items/rock.png" }
];

// --- Scenes ---
const SCENES = [
  { id:"indoor",        name:"Indoor — Day",   img:"assets/scenes/indoor.png" },
  { id:"outdoor",       name:"Outdoor — Day",  img:"assets/scenes/outdoor.png" },
  { id:"indoor-night",  name:"Indoor — Night", img:"assets/scenes/indoor-night.png" },
  { id:"outdoor-night", name:"Outdoor — Night",img:"assets/scenes/outdoor-night.png" }
];

// Hotspot position candidates (percent-based). We randomly assign chosen objects to these.
const POSITIONS = {
  "indoor": [
    {x:70,y:62,s:18},{x:63,y:72,s:16},{x:40,y:78,s:12},{x:52,y:84,s:12},{x:78,y:67,s:12},
    {x:32,y:64,s:12},{x:55,y:66,s:12},{x:82,y:80,s:10},{x:22,y:76,s:10}
  ],
  "outdoor": [
    {x:60,y:54,s:16},{x:38,y:70,s:12},{x:26,y:63,s:12},{x:19,y:67,s:12},{x:77,y:44,s:10},
    {x:68,y:72,s:10},{x:48,y:60,s:10},{x:14,y:58,s:10},{x:86,y:62,s:10}
  ],
  "indoor-night": [
    {x:68,y:64,s:18},{x:62,y:74,s:16},{x:50,y:82,s:12},{x:41,y:78,s:12},{x:77,y:69,s:12},
    {x:30,y:66,s:12},{x:56,y:62,s:12},{x:84,y:80,s:10},{x:22,y:74,s:10}
  ],
  "outdoor-night": [
    {x:58,y:56,s:16},{x:34,y:71,s:12},{x:28,y:63,s:12},{x:21,y:68,s:12},{x:76,y:46,s:10},
    {x:66,y:72,s:10},{x:46,y:60,s:10},{x:16,y:58,s:10},{x:86,y:62,s:10}
  ]
};

// --- Settings ---
const ITEMS_PER_PLAY = 4;      // user choice
const EXTRA_CHARACTERS = 1;    // random among all characters (can be Raven or Salem/Willow/Bo)

// --- State ---
let currentScene = null;
let playTargets = []; // chosen character(s) + chosen items with assigned positions
let foundIds = new Set();
let msgTimeout = null;

// --- DOM ---
const startScreen  = $("startScreen");
const gameScreen   = $("gameScreen");
const backBtn      = $("backBtn");
const sceneArea    = $("sceneArea");
const sceneImage   = $("sceneImage");
const checklistEl  = $("checklist");
const messageBar   = $("messageBar");
const sceneNameEl  = $("sceneName");
const foundCountEl = $("foundCount");

// --- Init ---
function init(){
  document.querySelectorAll(".scene-btn").forEach(btn=>{
    btn.addEventListener("click", ()=> startScene(btn.dataset.scene));
  });
  backBtn.addEventListener("click", showStart);
  showStart();
}

if(document.readyState === "loading"){
  document.addEventListener("DOMContentLoaded", init);
}else{
  init();
}

function showStart(){
  currentScene = null;
  foundIds.clear();
  startScreen.classList.add("active");
  gameScreen.classList.remove("active");
  messageBar.classList.remove("visible");
}

// Start a scene (each start = new shuffle of characters + items)
function startScene(sceneId){
  const scene = SCENES.find(s=>s.id===sceneId);
  if(!scene) return;
  currentScene = scene;
  foundIds = new Set();

  sceneImage.src = scene.img;
  sceneImage.alt = scene.name;
  sceneNameEl.textContent = scene.name;

  // Build a new randomized play set
  buildPlayTargets(sceneId);

  // Render hotspots & checklist
  renderHotspots();
  renderChecklist();
  updateFoundCount();

  startScreen.classList.remove("active");
  gameScreen.classList.add("active");
}

function buildPlayTargets(sceneId){
  // pick 1 random character (Raven may or may not appear)
  const chars = shuffleCopy(CHARACTER_POOL).slice(0, EXTRA_CHARACTERS);

  // pick 4 random items
  const items = shuffleCopy(ITEM_POOL).slice(0, ITEMS_PER_PLAY);

  // assign positions (no overlap) by taking first N positions after shuffle
  const needed = chars.length + items.length;
  const pos = shuffleCopy(POSITIONS[sceneId]).slice(0, needed);

  playTargets = [];
  let i = 0;

  for(const c of chars){
    playTargets.push({ ...c, type:"character", ...pos[i++] });
  }
  for(const it of items){
    playTargets.push({ ...it, type:"item", ...pos[i++] });
  }

  // Put character first in checklist
  playTargets.sort((a,b)=>{
    const pa = a.type === "character" ? 0 : 1;
    const pb = b.type === "character" ? 0 : 1;
    return pa - pb;
  });
}

function renderHotspots(){
  // clear existing hotspots
  sceneArea.querySelectorAll(".hotspot").forEach(el=>el.remove());

  // create hotspots
  for(const t of playTargets){
    const btn = document.createElement("button");
    btn.className = "hotspot";
    btn.type = "button";
    btn.dataset.id = t.id;
    btn.setAttribute("aria-label", t.label);

    const left = t.x - t.s/2;
    const top  = t.y - t.s/2;
    btn.style.left   = left + "%";
    btn.style.top    = top + "%";
    btn.style.width  = t.s + "%";
    btn.style.height = t.s + "%";

    btn.addEventListener("click", ()=> onHotspotClick(t, btn));
    sceneArea.appendChild(btn);
  }
}

function renderChecklist(){
  checklistEl.innerHTML = "";
  for(const t of playTargets){
    const item = document.createElement("div");
    item.className = "check-item";
    item.dataset.id = t.id;

    const img = document.createElement("img");
    img.src = t.img;
    img.alt = t.label;

    const label = document.createElement("span");
    label.textContent = t.label;

    item.appendChild(img);
    item.appendChild(label);
    checklistEl.appendChild(item);
  }
}

function markChecklistFound(id){
  const el = checklistEl.querySelector('.check-item[data-id="' + id + '"]');
  if(el) el.classList.add("found");
}

function onHotspotClick(t, btn){
  if(foundIds.has(t.id)) return;
  foundIds.add(t.id);
  markChecklistFound(t.id);
  updateFoundCount();
  addSparkle(btn);

  if(t.id === "blanket"){
    showMessage("You found Raven’s blanket. Raven feels safe when she finds her blanket.");
  } else if(t.type === "character"){
    showMessage("You found " + t.label + "!");
  } else {
    showMessage("You found a cozy item!");
  }

  if(foundIds.size === playTargets.length){
    setTimeout(()=> showMessage("You found everything in this scene! 🐾"), 900);
  }
}

function updateFoundCount(){
  const total = playTargets.length;
  const found = foundIds.size;
  foundCountEl.textContent = "Found: " + found + "/" + total;
}

function addSparkle(btn){
  const s = document.createElement("div");
  s.className = "sparkle";
  btn.appendChild(s);
  setTimeout(()=> s.remove(), 900);
}

function showMessage(text){
  messageBar.textContent = text;
  messageBar.classList.add("visible");
  if(msgTimeout) clearTimeout(msgTimeout);
  msgTimeout = setTimeout(()=> messageBar.classList.remove("visible"), 2600);
}

// helpers
function shuffleCopy(arr){
  const a = arr.slice();
  for(let i=a.length-1;i>0;i--){
    const j = Math.floor(Math.random()*(i+1));
    [a[i],a[j]] = [a[j],a[i]];
  }
  return a;
}

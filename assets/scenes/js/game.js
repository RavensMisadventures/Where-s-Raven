
// Where's Raven — Difficulty A (Raven always present, Easy & Tricky modes)
// Asset paths are matched to the user's GitHub repo.

const SCENES = [
  { id:"indoor",        name:"Indoor — daytime",   img:"assets/scenes/indoor.png" },
  { id:"indoor-night",  name:"Indoor — night",     img:"assets/scenes/indoor-night.png" },
  { id:"outdoor",       name:"Backyard — daytime", img:"assets/scenes/outdoor.png" },
  { id:"outdoor-night", name:"Backyard — night",   img:"assets/scenes/outdoor-night.png" }
];

// Raven is ALWAYS included
const RAVEN = { id:"raven", label:"Raven", img:"assets/characters/raven.png", type:"character", main:true };

const CHARACTER_POOL = [
  { id:"salem",  label:"Salem",  img:"assets/characters/salem.png",  type:"character" },
  { id:"willow", label:"Willow", img:"assets/characters/willow.png", type:"character" },
  { id:"bo",     label:"Bo",     img:"assets/characters/bo.png",     type:"character" }
];

const ITEM_POOL = [
  { id:"blanket",  label:"Security blanket", img:"assets/items/security-blanket.png", type:"item" },
  { id:"catbed",   label:"Cat bed",          img:"assets/items/cat-bed.png",          type:"item" },
  { id:"cookie",   label:"Cookie",           img:"assets/items/cookie.png",           type:"item" },
  { id:"mouse",    label:"Mouse toy",        img:"assets/items/mouse.png",            type:"item" },
  { id:"sock",     label:"Sock",             img:"assets/items/sock.png",             type:"item" },
  { id:"leaf",     label:"Leaf",             img:"assets/items/leaf.png",             type:"item" },
  { id:"feather",  label:"Feather",          img:"assets/items/feather.png",          type:"item" },
  { id:"rock",     label:"Rock",             img:"assets/items/rock.png",             type:"item" }
];

// Handcrafted hotspots per scene and difficulty (0–1 coordinate space)
const HOTSPOTS = {
  "indoor": {
    easy: [
      {x:0.35,y:0.62},{x:0.55,y:0.64},{x:0.72,y:0.60},{x:0.40,y:0.76},{x:0.58,y:0.74}
    ],
    tricky: [
      {x:0.22,y:0.55},{x:0.30,y:0.68},{x:0.48,y:0.60},{x:0.66,y:0.56},{x:0.80,y:0.54},{x:0.38,y:0.80},{x:0.64,y:0.78}
    ]
  },
  "indoor-night": {
    easy: [
      {x:0.35,y:0.62},{x:0.55,y:0.64},{x:0.72,y:0.60},{x:0.40,y:0.76},{x:0.58,y:0.74}
    ],
    tricky: [
      {x:0.22,y:0.55},{x:0.30,y:0.68},{x:0.48,y:0.60},{x:0.66,y:0.56},{x:0.80,y:0.54},{x:0.38,y:0.80},{x:0.64,y:0.78}
    ]
  },
  "outdoor": {
    easy: [
      {x:0.30,y:0.60},{x:0.50,y:0.70},{x:0.72,y:0.66},{x:0.40,y:0.78},{x:0.18,y:0.72}
    ],
    tricky: [
      {x:0.24,y:0.54},{x:0.34,y:0.62},{x:0.48,y:0.76},{x:0.70,y:0.64},{x:0.84,y:0.56},{x:0.16,y:0.82},{x:0.56,y:0.70}
    ]
  },
  "outdoor-night": {
    easy: [
      {x:0.30,y:0.60},{x:0.50,y:0.70},{x:0.72,y:0.66},{x:0.40,y:0.78},{x:0.18,y:0.72}
    ],
    tricky: [
      {x:0.24,y:0.54},{x:0.34,y:0.62},{x:0.48,y:0.76},{x:0.70,y:0.64},{x:0.84,y:0.56},{x:0.16,y:0.82},{x:0.56,y:0.70}
    ]
  }
};

// Difficulty config
const DIFF_CONFIG = {
  easy: {
    label: "Easy",
    extraCharacters: 1,
    items: 3,
    scale: 1.0,
    hintDelay: 8000
  },
  tricky: {
    label: "Tricky",
    extraCharacters: 2,
    items: 4,
    scale: 0.8,
    hintDelay: 14000
  }
};

// DOM
const startScreen = document.getElementById("startScreen");
const gameScreen  = document.getElementById("gameScreen");
const backBtn     = document.getElementById("backBtn");
const homeBtn     = document.getElementById("homeBtn");
const newPlayBtn  = document.getElementById("newPlayBtn");

const sceneBox    = document.getElementById("sceneBox");
const sceneImg    = document.getElementById("sceneImg");
const itemsLayer  = document.getElementById("itemsLayer");
const findList    = document.getElementById("findList");
const progressText= document.getElementById("progressText");
const sceneChip   = document.getElementById("sceneChip");
const diffChip    = document.getElementById("diffChip");
const toast       = document.getElementById("toast");

let currentScene = null;
let currentDifficulty = "easy";
let targets = [];
let found = new Set();
let hintTimers = new Map();

// Utils
function shuffle(arr){
  const a = arr.slice();
  for(let i=a.length-1;i>0;i--){
    const j = Math.floor(Math.random()*(i+1));
    [a[i],a[j]] = [a[j],a[i]];
  }
  return a;
}
function showToast(msg){
  toast.textContent = msg;
  toast.classList.add("show");
  clearTimeout(showToast._t);
  showToast._t = setTimeout(()=> toast.classList.remove("show"), 2100);
}

// Build targets for a play
function buildTargets(){
  found = new Set();
  hintTimers.forEach(id=> clearTimeout(id));
  hintTimers.clear();

  const cfg = DIFF_CONFIG[currentDifficulty];

  const extraChars = shuffle(CHARACTER_POOL).slice(0, cfg.extraCharacters);
  const items      = shuffle(ITEM_POOL).slice(0, cfg.items);

  targets = [RAVEN, ...extraChars, ...items];
}

// Checklist
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
  updateProgress();
}
function markChecklist(id){
  const el = findList.querySelector('.find-item[data-id="'+id+'"]');
  if(el) el.classList.add("found");
}
function updateProgress(){
  progressText.textContent = "Found " + found.size + " / " + targets.length;
}

// Place objects using hotspots
function placeObjects(){
  itemsLayer.innerHTML = "";
  const cfg = DIFF_CONFIG[currentDifficulty];

  const hsData = HOTSPOTS[currentScene.id];
  if(!hsData){
    console.warn("No hotspots for scene:", currentScene.id);
    return;
  }
  const spots = (currentDifficulty === "easy" ? hsData.easy : hsData.tricky).slice();
  if(spots.length < targets.length){
    console.warn("Not enough hotspots; some will reuse spots");
  }

  const rect = sceneBox.getBoundingClientRect();
  const w = rect.width;
  const h = rect.height;

  const shuffledSpots = shuffle(spots);

  targets.forEach((t, idx)=>{
    const spot = shuffledSpots[idx % shuffledSpots.length];
    const cx = spot.x * w;
    const cy = spot.y * h;

    const img = document.createElement("img");
    img.className = "scene-object";
    img.src = t.img;
    img.alt = t.label;
    img.dataset.id = t.id;

    const baseSize = 72;
    const size = baseSize * cfg.scale * (t.main ? 1.05 : 1.0);
    img.style.width = size + "px";
    img.style.height = size + "px";

    img.style.left = (cx - size/2) + "px";
    img.style.top  = (cy - size/2) + "px";

    img.addEventListener("click", ()=> onFound(t, img));
    itemsLayer.appendChild(img);

    const hintId = setTimeout(()=>{
      if(!found.has(t.id)){
        img.classList.add("hint-glow");
      }
    }, cfg.hintDelay);
    hintTimers.set(t.id, hintId);
  });
}

// Found logic
function onFound(t, el){
  if(found.has(t.id)) return;
  found.add(t.id);
  el.classList.remove("hint-glow");
  el.classList.add("found");
  markChecklist(t.id);
  updateProgress();

  const timerId = hintTimers.get(t.id);
  if(timerId) clearTimeout(timerId);

  if(t.id === "blanket"){
    showToast("Raven feels safe when she finds her blanket.");
  }else if(t.id === "raven"){
    el.classList.add("raven-found");
    showToast("You found Raven! 🐾");
    setTimeout(()=> el.classList.remove("raven-found"), 900);
  }else if(t.type === "character"){
    showToast("You found " + t.label + "!");
  }else{
    showToast("Nice find!");
  }

  if(found.size === targets.length){
    setTimeout(()=> showToast("You found everything in this scene!"), 900);
  }
}

// Navigation / flow
function showStart(){
  startScreen.classList.add("active");
  gameScreen.classList.remove("active");
}
function startScene(sceneId){
  const s = SCENES.find(x=>x.id===sceneId);
  if(!s) return;

  currentScene = s;
  sceneChip.textContent = s.name;
  diffChip.textContent  = DIFF_CONFIG[currentDifficulty].label;

  sceneImg.onload = ()=>{
    buildTargets();
    renderChecklist();
    placeObjects();
    showToast("Find Raven and the cozy items.");
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
  showToast("New play — same scene, new items.");
}

// Wire up UI
document.querySelectorAll(".scene-btn").forEach(btn=>{
  btn.addEventListener("click", ()=>{
    const sceneId = btn.dataset.scene;
    startScene(sceneId);
  });
});

document.querySelectorAll(".diff-btn").forEach(btn=>{
  btn.addEventListener("click", ()=>{
    document.querySelectorAll(".diff-btn").forEach(b=>b.classList.remove("active"));
    btn.classList.add("active");
    currentDifficulty = btn.dataset.diff || "easy";
  });
});

backBtn.addEventListener("click", showStart);
homeBtn.addEventListener("click", showStart);
newPlayBtn.addEventListener("click", newPlay);

// initial
showStart();

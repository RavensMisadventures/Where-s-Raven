
const OBJECTS=[
 {name:"Raven",src:"assets/characters/raven.png"},
 {name:"Salem",src:"assets/characters/salem.png"},
 {name:"Bo",src:"assets/characters/bo.png"},
 {name:"Willow",src:"assets/characters/willow.png"},
 {name:"Cookie",src:"assets/items/cookie.png"},
 {name:"Leaf",src:"assets/items/leaf.png"},
 {name:"Feather",src:"assets/items/feather.png"},
 {name:"Sock",src:"assets/items/sock.png"},
 {name:"Mouse",src:"assets/items/mouse.png"},
 {name:"Rock",src:"assets/items/rock.png"},
 {name:"Blanket",src:"assets/items/security-blanket.png"},
 {name:"Cat Bed",src:"assets/items/cat-bed.png"}
];

let level=1;
let ravenFound=false;

const scene=document.getElementById("scene");
const sceneContainer=document.getElementById("scene-container");
const findList=document.getElementById("find-list");
const startScreen=document.getElementById("start-screen");
const winOverlay=document.getElementById("win-overlay");

document.getElementById("start-btn").onclick=()=>{
 startScreen.classList.add("hidden");
 startGame();
};

document.querySelectorAll(".levels button").forEach(btn=>{
 btn.onclick=()=>{level=+btn.dataset.level;startGame();};
});

document.getElementById("play-again").onclick=startGame;
document.getElementById("back-start").onclick=()=>{
 winOverlay.classList.remove("active");
 startScreen.classList.remove("hidden");
};

function startGame(){
 ravenFound=false;
 winOverlay.classList.remove("active");
 scene.src="assets/scenes/outdoor.png";
 sceneContainer.querySelectorAll(".hidden-object").forEach(e=>e.remove());
 findList.innerHTML="";
 let count=level===1?3:level===2?5:7;
 let targets=shuffle([...OBJECTS]).slice(0,count);
 targets.forEach(obj=>{
  const li=document.createElement("li");
  li.innerHTML=`<img src="${obj.src}"><span>${obj.name}</span>`;
  findList.appendChild(li);

  const w=document.createElement("div");
  w.className="hidden-object";
  w.style.left=Math.random()*70+10+"%";
  w.style.top=Math.random()*35+55+"%";
  const depth=Math.random();
  w.style.transform=`scale(${depth<.4?.7:depth<.7?.85:1})`;
  w.style.zIndex=depth<.4?2:depth<.7?3:4;

  const img=document.createElement("img");
  img.src=obj.src;
  w.appendChild(img);

  w.onclick=()=>{
   w.classList.add("found");
   li.style.opacity=.4;
   if(obj.name==="Raven"&&!ravenFound){
    ravenFound=true;
    setTimeout(()=>winOverlay.classList.add("active"),400);
   }
  };
  sceneContainer.appendChild(w);
 });
}

function shuffle(a){return a.sort(()=>Math.random()-.5)}

const sceneImg = document.getElementById("scene");
const sceneContainer = document.getElementById("scene-container");
const findList = document.getElementById("find-list");

const startScreen = document.getElementById("start-screen");
const startBtn = document.getElementById("start-btn");

const SCENE_PATH = "assets/scenes/outdoor.png";

const OBJECTS = [
  { name: "Raven", src: "assets/characters/raven.png" },
  { name: "Salem", src: "assets/characters/salem.png" },
  { name: "Bo", src: "assets/characters/bo.png" },
  { name: "Willow", src: "assets/characters/willow.png" },
  { name: "Cookie", src: "assets/items/cookie.png" },
  { name: "Leaf", src: "assets/items/leaf.png" },
  { name: "Feather", src: "assets/items/feather.png" },
  { name: "Sock", src: "assets/items/sock.png" }
];

startBtn.addEventListener("click", () => {
  startScreen.classList.remove("active");
  initGame();
});

function initGame() {
  sceneImg.src = SCENE_PATH;
  sceneContainer.querySelectorAll(".hidden-object").forEach(el => el.remove());
  findList.innerHTML = "";

  const targets = shuffle([...OBJECTS]).slice(0, 5);

  targets.forEach(obj => {
    // left list
    const li = document.createElement("li");
    li.innerHTML = `<img src="${obj.src}"><span>${obj.name}</span>`;
    findList.appendChild(li);

    // scene object
    const wrapper = document.createElement("div");
    wrapper.className = "hidden-object";
    wrapper.style.left = `${Math.random() * 80 + 5}%`;
    wrapper.style.top = `${Math.random() * 75 + 5}%`;

    const img = document.createElement("img");
    img.src = obj.src;
    wrapper.appendChild(img);

    wrapper.addEventListener("click", () => {
      wrapper.classList.add("found");
      li.style.opacity = "0.4";
    });

    sceneContainer.appendChild(wrapper);
  });
}

function shuffle(arr) {
  return arr.sort(() => Math.random() - 0.5);
}

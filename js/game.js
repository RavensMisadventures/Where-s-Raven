// ----- Data -----------------------------------------------------------------

const SCENES = {
  outdoor: {
    key: "outdoor",
    label: "Outdoor (Day)",
    src: "assets/scenes/outdoor.png",
  },
  "outdoor-night": {
    key: "outdoor-night",
    label: "Outdoor (Night)",
    src: "assets/scenes/outdoor-night.png",
  },
  indoor: {
    key: "indoor",
    label: "Indoor (Day)",
    src: "assets/scenes/indoor.png",
  },
  "indoor-night": {
    key: "indoor-night",
    label: "Indoor (Night)",
    src: "assets/scenes/indoor-night.png",
  },
};

const CHARACTERS = [
  {
    id: "raven",
    label: "Raven",
    src: "assets/characters/raven.png",
    type: "character",
  },
  {
    id: "salem",
    label: "Salem",
    src: "assets/characters/salem.png",
    type: "character",
  },
  {
    id: "bo",
    label: "Bo",
    src: "assets/characters/bo.png",
    type: "character",
  },
  {
    id: "willow",
    label: "Willow",
    src: "assets/characters/willow.png",
    type: "character",
  },
];

const ITEMS = [
  {
    id: "cat-bed",
    label: "Cat bed",
    src: "assets/items/cat-bed.png",
    type: "item",
  },
  {
    id: "cookie",
    label: "Cookie",
    src: "assets/items/cookie.png",
    type: "item",
  },
  {
    id: "feather",
    label: "Feather",
    src: "assets/items/feather.png",
    type: "item",
  },
  {
    id: "leaf",
    label: "Leaf",
    src: "assets/items/leaf.png",
    type: "item",
  },
  {
    id: "mouse",
    label: "Mouse toy",
    src: "assets/items/mouse.png",
    type: "item",
  },
  {
    id: "rock",
    label: "Rock",
    src: "assets/items/rock.png",
    type: "item",
  },
  {
    id: "security-blanket",
    label: "Security blanket",
    src: "assets/items/security-blanket.png",
    type: "item",
  },
  {
    id: "sock",
    label: "Sock",
    src: "assets/items/sock.png",
    type: "item",
  },
];

// ----- State ----------------------------------------------------------------

const state = {
  sceneKey: "outdoor",
  difficulty: "easy",
  targets: [], // ids of objects to find
  objects: [], // full object metadata in this round
  foundIds: new Set(),
  hintTimerId: null,
  lastInteraction: Date.now(),
};

const HINT_IDLE_MS = 10000; // 10 seconds of quiet time before hint glow
const TARGET_COUNT = 5; // Raven + 4 random others

// ----- Helpers --------------------------------------------------------------

function shuffle(array) {
  const arr = array.slice();
  for (let i = arr.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [arr[i], arr[j]] = [arr[j], arr[i]];
  }
  return arr;
}

function pickTargets() {
  // Always include Raven
  const raven = CHARACTERS.find((c) => c.id === "raven");
  const others = [...CHARACTERS, ...ITEMS].filter((o) => o.id !== "raven");
  const shuffledOthers = shuffle(others);
  const chosenOthers = shuffledOthers.slice(0, TARGET_COUNT - 1);
  const combined = shuffle([raven, ...chosenOthers]);
  return combined;
}

function randomPosition(difficulty) {
  // Use percentages so layout is responsive.
  // Keep margin so items stay comfortably inside the scene.
  let min = 8;
  let max = 80;

  if (difficulty === "tricky") {
    // Allow closer to edges
    min = 3;
    max = 88;
  }

  const left = min + Math.random() * (max - min);
  const top = min + Math.random() * (max - min);

  return { left, top };
}

function objectSizePx(difficulty, sceneWidth) {
  // Scene width might be 0 very early; use a safe fallback.
  const base = sceneWidth || 800;

  if (difficulty === "easy") {
    return Math.max(70, base * 0.09); // larger on easy
  }
  return Math.max(52, base * 0.065); // smaller on tricky
}

// ----- DOM references -------------------------------------------------------

const sceneEl = document.getElementById("scene");
const targetListEl = document.getElementById("targetList");
const startButton = document.getElementById("startButton");
const sceneSelect = document.getElementById("sceneSelect");
const difficultySelect = document.getElementById("difficultySelect");
const statusText = document.getElementById("statusText");
const ravenOverlay = document.getElementById("ravenFoundOverlay");

// ----- Hint handling --------------------------------------------------------

function resetHintTimer() {
  state.lastInteraction = Date.now();

  if (state.hintTimerId) {
    clearInterval(state.hintTimerId);
  }

  state.hintTimerId = setInterval(() => {
    const now = Date.now();
    if (now - state.lastInteraction >= HINT_IDLE_MS) {
      showHint();
      state.lastInteraction = Date.now(); // reset so it doesn't fire constantly
    }
  }, 1000);
}

function showHint() {
  const remaining = state.targets.filter((t) => !state.foundIds.has(t.id));
  if (remaining.length === 0) return;

  // Clear any existing hint glows
  document.querySelectorAll(".object-image.hint").forEach((img) => {
    img.classList.remove("hint");
  });

  const choice = remaining[Math.floor(Math.random() * remaining.length)];
  const img = sceneEl.querySelector(`img[data-id="${choice.id}"]`);
  if (!img) return;

  img.classList.add("hint");

  setTimeout(() => {
    img.classList.remove("hint");
  }, 2500);
}

// ----- Rendering ------------------------------------------------------------

function renderSceneBackground() {
  const scene = SCENES[state.sceneKey];
  if (!scene) return;
  sceneEl.style.backgroundImage = `url("${scene.src}")`;
}

function clearSceneObjects() {
  while (sceneEl.firstChild) {
    sceneEl.removeChild(sceneEl.firstChild);
  }
}

function renderTargetsList() {
  targetListEl.innerHTML = "";

  state.targets.forEach((obj) => {
    const li = document.createElement("li");
    li.className = "target-item";
    li.dataset.id = obj.id;

    const img = document.createElement("img");
    img.src = obj.src;
    img.alt = obj.label;

    const span = document.createElement("span");
    span.className = "target-label";
    span.textContent = obj.label;

    li.appendChild(img);
    li.appendChild(span);
    targetListEl.appendChild(li);
  });
}

function markTargetFound(id) {
  const li = targetListEl.querySelector(`.target-item[data-id="${id}"]`);
  if (li) {
    li.classList.add("found");
  }
}

function renderObjectsInScene() {
  clearSceneObjects();
  renderSceneBackground();

  // Need real width after layout
  const sceneWidth = sceneEl.clientWidth;
  const size = objectSizePx(state.difficulty, sceneWidth);

  state.targets.forEach((obj) => {
    const { left, top } = randomPosition(state.difficulty);

    const img = document.createElement("img");
    img.src = obj.src;
    img.alt = obj.label;
    img.dataset.id = obj.id;
    img.className = "object-image";

    img.style.width = `${size}px`;
    img.style.left = `${left}%`;
    img.style.top = `${top}%`;

    img.addEventListener("click", () => handleObjectClick(obj, img));

    sceneEl.appendChild(img);
  });
}

// ----- Game Logic -----------------------------------------------------------

function handleObjectClick(obj, imgEl) {
  if (state.foundIds.has(obj.id)) return;

  state.lastInteraction = Date.now();

  state.foundIds.add(obj.id);
  imgEl.classList.add("found");
  markTargetFound(obj.id);

  if (obj.id === "raven") {
    // Small happy pop
    imgEl.classList.add("raven-pulse");
    setTimeout(() => imgEl.classList.remove("raven-pulse"), 700);

    showRavenOverlay();
  }

  checkForWin();
}

function showRavenOverlay() {
  ravenOverlay.classList.remove("hidden");
  ravenOverlay.setAttribute("aria-hidden", "false");

  setTimeout(() => {
    ravenOverlay.classList.add("hidden");
    ravenOverlay.setAttribute("aria-hidden", "true");
  }, 1600);
}

function checkForWin() {
  const allFound =
    state.targets.length > 0 &&
    state.targets.every((obj) => state.foundIds.has(obj.id));

  if (allFound) {
    statusText.textContent = "Lovely looking — you found everything!";
    // Clear hint timer so it doesn't glow after win
    if (state.hintTimerId) {
      clearInterval(state.hintTimerId);
      state.hintTimerId = null;
    }
  } else {
    const remaining = state.targets.length - state.foundIds.size;
    statusText.textContent =
      remaining === 1
        ? "Just one more to find."
        : `${remaining} friends still hiding.`;
  }
}

function startGame() {
  state.sceneKey = sceneSelect.value;
  state.difficulty = difficultySelect.value;
  state.foundIds = new Set();

  // Choose which things to find
  state.targets = pickTargets();

  // Reset UI
  statusText.textContent = "Take your time and look gently around.";
  ravenOverlay.classList.add("hidden");
  ravenOverlay.setAttribute("aria-hidden", "true");

  renderTargetsList();
  // Slight delay so layout settles before we measure width
  window.requestAnimationFrame(() => {
    renderObjectsInScene();
  });

  resetHintTimer();
}

// ----- Init -----------------------------------------------------------------

function init() {
  // Ensure selects reflect default state
  sceneSelect.value = state.sceneKey;
  difficultySelect.value = state.difficulty;

  startButton.addEventListener("click", () => {
    startGame();
  });

  // First load
  startGame();

  // Re-layout when window size changes so items stay nicely placed
  window.addEventListener("resize", () => {
    // Re-render positions but keep found state
    const currentTargets = state.targets.slice();
    const foundCopy = new Set(state.foundIds);

    renderObjectsInScene();

    // Re-apply found styling
    currentTargets.forEach((obj) => {
      if (foundCopy.has(obj.id)) {
        const img = sceneEl.querySelector(`img[data-id="${obj.id}"]`);
        if (img) img.classList.add("found");
      }
    });
  });
}

document.addEventListener("DOMContentLoaded", init);

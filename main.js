import { checkBrioStatus } from "./modules/handBrioClick.js";
import { handleBrioClick } from "./modules/handBrioClick.js";
import { closeOptionsModal } from "./modules/closeOptionsModal.js";
import { handleDesktopClick } from "./modules/handleDesktopClick.js";
import { state } from "./modules/state.js";
import { initFolders } from "./modules/handleFolderClick.js";
import { showMessage } from "./modules/showMessage.js";
import { frasesEs, frasesEn, frases } from "./modules/frases.js";
import { initProjectsFolder } from "./modules/projectsFolder.js";
import { initBookshelf } from './modules/bookshelf.js';
import { initMobileNavigation } from './modules/mobileNavigation.js';
import { initMobileGameControls } from './modules/mobileGameControls.js';
import { initMusicPlayer } from './modules/musicPlayer.js';

function portalModalsToViewport() {
  const modalSelectors = ['.modal-window', '.pdf-viewer-modal'];

  const moveModalsToBody = () => {
    const modals = document.querySelectorAll(modalSelectors.join(', '));
    modals.forEach((modal) => {
      if (modal.parentElement !== document.body) {
        document.body.appendChild(modal);
      }
    });
  };

  moveModalsToBody();

  const observer = new MutationObserver(() => {
    moveModalsToBody();
  });

  observer.observe(document.body, {
    childList: true,
    subtree: true,
  });
}

// Language state
window.languageState = {
  current: "es",
  get frases() {
    return this.current === "es" ? frasesEs : frasesEn;
  },
};
import { handleBookTycClick } from "./modules/handleBookTycClick.js";

const optionsModalCloseBtn = document.querySelector('#optionsModal > .title-bar .close-btn');
if (optionsModalCloseBtn) {
  optionsModalCloseBtn.onclick = closeOptionsModal;
}

portalModalsToViewport();
initMobileGameControls();

const actions = {
  brio: handleBrioClick,
  "monitor-bright": handleDesktopClick,
  "book-tyc": handleBookTycClick,
};

document.addEventListener("click", (e) => {
  const target = e.target;
  console.log(target);
  for (let className in actions) {
    if (target.classList.contains(className)) {
      actions[className](e);
      break;
    }
  }
});

const bookTyc = document.querySelector(".book-tyc");
bookTyc.addEventListener("mouseenter", () => {
  bookTyc.src = "./assets/img/book-tyc-on.png";
  bookTyc.style.transform = "scale(1.1)";
  bookTyc.style.zIndex = "12";
});
bookTyc.addEventListener("mouseleave", () => {
  bookTyc.src = "./assets/img/book-tyc-off.png";
  bookTyc.style.transform = "scale(1)";
  bookTyc.style.zIndex = "10";
});

const music = document.getElementById("backgroundMusic");
const desktop = document.querySelector(".desktop");
const soundToggleBtn = document.getElementById("toggleMusicBtn");
const soundIcon = document.getElementById("soundIcon");
const soundLabel = document.getElementById("soundLabel");
const mobileNavigation = initMobileNavigation();
const shownTurnOffMusicIndices = {
  es: new Set(),
  en: new Set(),
};

function initForegroundMediaAudioPolicy() {
  const foregroundMedia = new Set();
  let pausedByForeground = false;

  function isForegroundTarget(target) {
    return target instanceof HTMLMediaElement && target !== music;
  }

  function hasActiveForegroundMedia() {
    for (const media of foregroundMedia) {
      if (!media.paused && !media.ended) {
        return true;
      }
    }
    return false;
  }

  function resumeBackgroundIfPossible() {
    if (!pausedByForeground) return;
    if (!state.musicEnabled) return;
    if (hasActiveForegroundMedia()) return;

    pausedByForeground = false;
    music.play().catch(() => {});
  }

  document.addEventListener('play', (event) => {
    const target = event.target;
    if (!isForegroundTarget(target)) return;

    foregroundMedia.add(target);

    if (!music.paused) {
      pausedByForeground = true;
      music.pause();
    }
  }, true);

  const releaseForegroundMedia = (event) => {
    const target = event.target;
    if (!isForegroundTarget(target)) return;

    foregroundMedia.delete(target);
    resumeBackgroundIfPossible();
  };

  document.addEventListener('pause', releaseForegroundMedia, true);
  document.addEventListener('ended', releaseForegroundMedia, true);
}

function getUniqueTurnOffMusicPhrase() {
  const currentLanguage = window.languageState.current;
  const turnOffMusicPhrases = window.languageState.frases.turnOffMusic || [];

  if (turnOffMusicPhrases.length === 0) return "";

  const usedIndices = shownTurnOffMusicIndices[currentLanguage];

  // Restart cycle when all phrases were already shown.
  if (usedIndices.size >= turnOffMusicPhrases.length) {
    usedIndices.clear();
  }

  const availableIndices = turnOffMusicPhrases
    .map((_, index) => index)
    .filter((index) => !usedIndices.has(index));

  const selectedIndex =
    availableIndices[Math.floor(Math.random() * availableIndices.length)];
  usedIndices.add(selectedIndex);

  return turnOffMusicPhrases[selectedIndex] || "";
}

function applyMusicVisualState(isPlaying) {
  if (isPlaying) {
    desktop.src = "./assets/img/desktop-animated_speaker-on.gif";
    soundToggleBtn.dataset.enabled = "true";
    soundToggleBtn.setAttribute("aria-pressed", "true");
    soundLabel.textContent = "Sonido: ON";
    soundIcon.src = "./assets/img/sound-on.png";
    soundIcon.alt = "Sonido activo";
  } else {
    desktop.src = "./assets/img/desktop-animated_speaker-turn-off.gif";
    soundToggleBtn.dataset.enabled = "false";
    soundToggleBtn.setAttribute("aria-pressed", "false");
    soundLabel.textContent = "Sonido: OFF";
    soundIcon.src = "./assets/img/sound-off.png";
    soundIcon.alt = "Sonido desactivado";
  }
}

function applyMusicState() {
  if (state.musicEnabled) {
    music.volume = state.musicVolume;
  } else {
    music.pause();
    music.volume = 0;
  }

  applyMusicVisualState(state.musicEnabled && !music.paused && music.volume > 0);

  document.dispatchEvent(new CustomEvent('backgroundMusicStateChanged'));
}

soundToggleBtn.addEventListener("click", () => {
  state.musicEnabled = !state.musicEnabled;
  applyMusicState();

  if (state.musicEnabled) {
    music.play().catch(() => {});
  }

  if (!state.musicEnabled) {
    const randomPhrase = getUniqueTurnOffMusicPhrase();
    if (randomPhrase) {
      showMessage(randomPhrase);
    }
  }
});

music.addEventListener('play', () => {
  if (state.musicEnabled) {
    applyMusicVisualState(true);
  }
});

music.addEventListener('pause', () => {
  applyMusicVisualState(false);
});

document.addEventListener('requestMusicEnable', () => {
  if (!state.musicEnabled) {
    state.musicEnabled = true;
    applyMusicState();
  }
});

applyMusicState();
initForegroundMediaAudioPolicy();
initMusicPlayer(music);

// Language toggle button
const languageToggleBtn = document.getElementById("toggleLanguageBtn");
const languageLabel = document.getElementById("languageLabel");

languageToggleBtn.addEventListener("click", () => {
  window.languageState.current =
    window.languageState.current === "es" ? "en" : "es";
  languageLabel.textContent =
    window.languageState.current === "es" ? "ES" : "EN";
  languageToggleBtn.dataset.language = window.languageState.current;
});

document.getElementById("enterButton").addEventListener("click", () => {
  const hasVisitedBefore = localStorage.getItem("hasVisited");
  const startOverlay = document.getElementById("startOverlay");

  mobileNavigation.requestGyroscopePermission();

  checkBrioStatus();
  if (state.musicEnabled) {
    music.play();
  }
  if (startOverlay) {
    startOverlay.classList.add("is-closing");
    setTimeout(() => {
      startOverlay.style.display = "none";
    }, 450);
  }

  // Brio animation on enter
  const brio = document.querySelector(".brio");
  setTimeout(() => {
    brio.src = "./assets/img/brio-back-to-windows.gif";
  }, 2000);
  setTimeout(() => {
    brio.src = "./assets/img/brio-back.png";
  }, 2500);

  const greetings = window.languageState.frases.greetings || [];
  const greetingsBack = window.languageState.frases.greetingsBack || [];
  let source = greetings;

  // Returning visitors randomly alternate between greetings and greetingsBack
  if (hasVisitedBefore === "true") {
    source = Math.random() < 0.5 ? greetings : greetingsBack;
  }

  const randomGreeting =
    source.length > 0 ? source[Math.floor(Math.random() * source.length)] : "";

  if (randomGreeting) {
    setTimeout(() => {
      showMessage(randomGreeting);
    }, 500);
  }

  // Mark as visited
  localStorage.setItem("hasVisited", "true");
});

// Initialize folder double-click functionality
initFolders();
initBookshelf();

// Proyectos multimedia: pasa aqui tu array de rutas.
const pathProject = "./assets/img/projects/";
const projectsFolder = initProjectsFolder([
  `${pathProject}[sin nombre].png`,
  `${pathProject}Ashley.png`,
  `${pathProject}collabaishacolor2.png`,
  `${pathProject}desafio-pio.png`,
  `${pathProject}f-14.mp4`,
  `${pathProject}spoooky-pfp-ps-v2`,
]);

// Permite recargar contenido desde consola: window.setProjectsMedia([...paths])
window.setProjectsMedia = (paths) => {
  projectsFolder.setMediaPaths(paths);
};

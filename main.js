import { checkBrioStatus } from "./modules/handBrioClick.js";
import { handleBrioClick } from "./modules/handBrioClick.js";
import { getIsBrioWorking } from "./modules/handBrioClick.js";
import { resetBusyInterruptions } from "./modules/handBrioClick.js";
import { showBrioFrontIfIdle } from "./modules/handBrioClick.js";
import { closeOptionsModal, getUniqueTurnOffMusicPhrase } from "./modules/closeOptionsModal.js";
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
import { initCertificateModal } from './modules/handleCertificateClick.js';

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
checkBrioStatus();
showBrioFrontIfIdle();

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

const music = document.getElementById("backgroundMusic");
const desktop = document.querySelector(".desktop");
const soundToggleBtn = document.getElementById("toggleMusicBtn");
const soundIcon = document.getElementById("soundIcon");
const soundLabel = document.getElementById("soundLabel");
const mobileNavigation = initMobileNavigation();

function initNowPlayingWidget(audioElement) {
  const widget = document.getElementById('nowPlayingWidget');
  const text = document.getElementById('nowPlayingText');
  const controls = document.getElementById('nowPlayingControls');
  const prevBtn = document.getElementById('nowPlayingPrevBtn');
  const toggleBtn = document.getElementById('nowPlayingToggleBtn');
  const nextBtn = document.getElementById('nowPlayingNextBtn');
  if (!widget || !text || !audioElement || !controls || !prevBtn || !toggleBtn || !nextBtn) return;

  let hideControlsTimer = null;

  const clearHideControlsTimer = () => {
    if (!hideControlsTimer) return;
    clearTimeout(hideControlsTimer);
    hideControlsTimer = null;
  };

  const setControlsVisible = (isVisible) => {
    controls.hidden = !isVisible;
    widget.classList.toggle('is-open', isVisible);
    widget.setAttribute('aria-expanded', isVisible ? 'true' : 'false');
  };

  const scheduleHideControls = () => {
    clearHideControlsTimer();
    hideControlsTimer = setTimeout(() => {
      setControlsVisible(false);
    }, 3000);
  };

  const showControls = () => {
    clearHideControlsTimer();
    setControlsVisible(true);
  };

  const setPlayingState = () => {
    widget.classList.toggle('is-playing', !audioElement.paused && state.musicEnabled);
    toggleBtn.textContent = audioElement.paused ? '▶' : '⏸';
    toggleBtn.setAttribute('aria-label', audioElement.paused ? 'Reproducir' : 'Pausar');
  };

  const setTrackLabel = (detail) => {
    const title = detail?.title || 'Sin tema';
    const artist = detail?.artist || 'Brio Selection';
    text.textContent = `${title} · ${artist}`;
  };

  document.addEventListener('musicTrackChanged', (event) => {
    setTrackLabel(event.detail);
    setPlayingState();
  });

  widget.addEventListener('click', (event) => {
    if (event.target instanceof HTMLButtonElement) return;
    if (controls.hidden) {
      showControls();
      scheduleHideControls();
      return;
    }

    setControlsVisible(false);
    clearHideControlsTimer();
  });

  widget.addEventListener('keydown', (event) => {
    if (event.key !== 'Enter' && event.key !== ' ') return;
    event.preventDefault();
    showControls();
    scheduleHideControls();
  });

  widget.addEventListener('pointerenter', clearHideControlsTimer);
  widget.addEventListener('pointerleave', () => {
    if (!controls.hidden) {
      scheduleHideControls();
    }
  });

  prevBtn.addEventListener('click', (event) => {
    event.stopPropagation();
    document.dispatchEvent(new CustomEvent('musicWidgetPrevious'));
    showControls();
  });

  toggleBtn.addEventListener('click', (event) => {
    event.stopPropagation();
    document.dispatchEvent(new CustomEvent('musicWidgetTogglePlayPause'));
    showControls();
  });

  nextBtn.addEventListener('click', (event) => {
    event.stopPropagation();
    document.dispatchEvent(new CustomEvent('musicWidgetNext'));
    showControls();
  });

  audioElement.addEventListener('play', setPlayingState);
  audioElement.addEventListener('pause', setPlayingState);
  document.addEventListener('backgroundMusicStateChanged', setPlayingState);

  setTrackLabel(null);
  setPlayingState();
}

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
  const wasMusicEnabled = state.musicEnabled;
  state.musicEnabled = !state.musicEnabled;
  const justTurnedOffMusic = wasMusicEnabled && !state.musicEnabled;
  const shouldShowImmediateTurnOffMessage = justTurnedOffMusic && getIsBrioWorking() && !state.isOptionsModalOpen;

  applyMusicState();

  if (shouldShowImmediateTurnOffMessage) {
    const text = getUniqueTurnOffMusicPhrase();
    if (text) {
      const brio = document.querySelector('.brio');
      showMessage(text, brio || soundToggleBtn);
    }
  }

  if (state.musicEnabled) {
    music.play().catch(() => {});
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
initNowPlayingWidget(music);

// Language toggle button
const languageToggleBtn = document.getElementById("toggleLanguageBtn");
const languageLabel = document.getElementById("languageLabel");

languageToggleBtn.addEventListener("click", () => {
  window.languageState.current =
    window.languageState.current === "es" ? "en" : "es";
  languageLabel.textContent =
    window.languageState.current === "es" ? "ES" : "EN";
  languageToggleBtn.dataset.language = window.languageState.current;
  resetBusyInterruptions();
});

document.getElementById("enterButton").addEventListener("click", async () => {
  const hasVisitedBefore = localStorage.getItem("hasVisited");
  const startOverlay = document.getElementById("startOverlay");
  const nowPlayingWidget = document.getElementById('nowPlayingWidget');
  const brio = document.querySelector(".brio");
  const isWorkingNow = getIsBrioWorking();

  mobileNavigation.requestGyroscopePermission();

  if (isWorkingNow) {
    checkBrioStatus();
  } else if (brio) {
    brio.src = "./assets/img/brio-front.png";
  }

  if (state.musicEnabled) {
    music.play();
  }
  if (startOverlay) {
    startOverlay.classList.add("is-closing");
    setTimeout(() => {
      startOverlay.style.display = "none";
    }, 450);
  }

  if (nowPlayingWidget) {
    nowPlayingWidget.style.display = 'flex';
  }

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
    await new Promise((resolve) => setTimeout(resolve, 500));
    await showMessage(randomGreeting);
  }

  if (!isWorkingNow && brio) {
    brio.src = "./assets/img/brio-back-to-windows.gif";
    setTimeout(() => {
      brio.src = "./assets/img/brio-back.png";
    }, 500);
  }

  // Mark as visited
  localStorage.setItem("hasVisited", "true");
});

// Initialize folder double-click functionality
initFolders();
initBookshelf();
initCertificateModal();

const projectsFolder = initProjectsFolder([]);

async function loadProjectsManifest() {
  try {
    const response = await fetch('./assets/img/projects/manifest.json', { cache: 'no-store' });
    if (!response.ok) {
      throw new Error(`No se pudo cargar el manifiesto (${response.status})`);
    }

    const manifest = await response.json();
    const basePath = './assets/img/projects/';
    const mediaItems = Array.isArray(manifest)
      ? manifest
          .filter((item) => item && typeof item.file === 'string')
          .map((item) => ({
            path: `${basePath}${item.file}`,
            name: item.name || item.file,
            category: item.category || 'sin-categoria',
          }))
      : [];

    projectsFolder.setMediaItems(mediaItems);
  } catch (error) {
    console.error('Error al cargar proyectos:', error);
    projectsFolder.setMediaItems([]);
  }
}

loadProjectsManifest();

// Permite recargar contenido desde consola: window.setProjectsMedia([...paths])
window.setProjectsMedia = (paths) => {
  projectsFolder.setMediaPaths(paths);
};

// Permite recargar contenido desde consola: window.setProjectsManifest([...items])
window.setProjectsManifest = (items) => {
  projectsFolder.setMediaItems(items);
};

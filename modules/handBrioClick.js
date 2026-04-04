const brio = document.getElementsByClassName("brio");
import { showMessage } from './showMessage.js';
import { state } from './state.js';
import { closeInteractiveModals } from './modalExclusivity.js';

let isBrioWorking = false;
let isMessageActive = false;
const usedPhrases = new Set();
let busyInterruptions = 0;
const lastBusyPhraseByLevel = {
  nivel1: '',
  nivel2: '',
  nivel3: '',
};

export function getIsBrioWorking() {
  return isBrioWorking;
}

function applyBrioWorkingVisualState() {
  const monitorBright = document.querySelector('.monitor-bright');
  if (!brio[0]) return;

  if (isBrioWorking) {
    brio[0].src = './assets/img/brio-working.png';
    brio[0].style.opacity = '1';
    brio[0].style.filter = 'brightness(1.18) contrast(1.08) saturate(1.1)';
    brio[0].style.left = '0';
    brio[0].style.transform = 'none';
    brio[0].style.zIndex = 21;
    brio[0].style.width = '512px';

    if (monitorBright) {
      monitorBright.style.opacity = '1';
      monitorBright.style.zIndex = '20';
    }
    return;
  }

  brio[0].src = './assets/img/brio-back.png';
  brio[0].style.opacity = '';
  brio[0].style.filter = '';
  brio[0].style.left = '';
  brio[0].style.transform = '';
  brio[0].style.zIndex = '';
  brio[0].style.width = '';

  if (monitorBright && !state.isOptionsModalOpen) {
    monitorBright.style.opacity = '0';
    monitorBright.style.zIndex = '';
  }
}

export function setBrioWorking(nextState) {
  isBrioWorking = Boolean(nextState);
  resetBusyInterruptions();
  applyBrioWorkingVisualState();
  return isBrioWorking;
}

export function toggleBrioWorking() {
  return setBrioWorking(!isBrioWorking);
}

export function resetBusyInterruptions() {
  busyInterruptions = 0;
  lastBusyPhraseByLevel.nivel1 = '';
  lastBusyPhraseByLevel.nivel2 = '';
  lastBusyPhraseByLevel.nivel3 = '';
}

function getRandomBrioMessage() {
  const currentFrases = window.languageState.frases;
  const defaultPool = [
    ...(currentFrases.thoughtful || []),
    ...(currentFrases.philosophic || []),
    ...(currentFrases.jokes || []),
    ...(currentFrases.melancholic || []),
  ].filter(Boolean);

  const pools = defaultPool;

  if (pools.length === 0) {
    return window.languageState.current === 'es' ? 'Estoy pensando en algo...' : 'I\'m thinking about something...';
  }

  // Filter out used phrases
  let availablePhrases = pools.filter(phrase => !usedPhrases.has(phrase));

  // If all phrases have been used, reset
  if (availablePhrases.length === 0) {
    usedPhrases.clear();
    availablePhrases = pools;
  }

  // Pick random from available
  const index = Math.floor(Math.random() * availablePhrases.length);
  const selectedPhrase = availablePhrases[index];
  
  // Mark as used
  usedPhrases.add(selectedPhrase);
  
  return selectedPhrase;
}

function getBusyMessageForLevel(level) {
  const currentFrases = window.languageState.frases;
  const levelKey = `nivel${level}`;
  const pool = Array.isArray(currentFrases.busy?.[levelKey])
    ? currentFrases.busy[levelKey].filter(Boolean)
    : [];

  if (pool.length === 0) {
    return getRandomBrioMessage();
  }

  const lastPhrase = lastBusyPhraseByLevel[levelKey] || '';
  const options = pool.filter((phrase) => phrase !== lastPhrase);
  const candidates = options.length > 0 ? options : pool;
  const selectedPhrase = candidates[Math.floor(Math.random() * candidates.length)];

  lastBusyPhraseByLevel[levelKey] = selectedPhrase;
  return selectedPhrase;
}

function playDesktopOpenSfx() {
  if (!state.musicEnabled) return;

  const AudioContextClass = window.AudioContext || window.webkitAudioContext;
  if (!AudioContextClass) return;

  const context = new AudioContextClass();
  const startAt = context.currentTime;
  const gain = context.createGain();
  const volume = Math.max(0.04, Math.min(0.16, state.musicVolume * 0.18));

  gain.gain.setValueAtTime(0.0001, startAt);
  gain.gain.exponentialRampToValueAtTime(volume, startAt + 0.015);
  gain.gain.exponentialRampToValueAtTime(0.0001, startAt + 0.25);
  gain.connect(context.destination);

  const oscA = context.createOscillator();
  oscA.type = 'square';
  oscA.frequency.setValueAtTime(660, startAt);
  oscA.frequency.exponentialRampToValueAtTime(880, startAt + 0.08);
  oscA.connect(gain);
  oscA.start(startAt);
  oscA.stop(startAt + 0.12);

  const oscB = context.createOscillator();
  oscB.type = 'triangle';
  oscB.frequency.setValueAtTime(1046, startAt + 0.1);
  oscB.frequency.exponentialRampToValueAtTime(1318, startAt + 0.18);
  oscB.connect(gain);
  oscB.start(startAt + 0.1);
  oscB.stop(startAt + 0.24);

  setTimeout(() => {
    context.close().catch(() => {});
  }, 320);
}

function openDesktopBrightModal() {
  const monitorBright = document.querySelector('.monitor-bright');
  const optionsModal = document.getElementById('optionsModal');

  closeInteractiveModals('optionsModal');

  if (monitorBright) {
    monitorBright.style.opacity = '1';
    monitorBright.style.zIndex = '20';
  }

  if (optionsModal) {
    optionsModal.style.display = 'block';
    state.desktopClickCount = 2;
    state.isOptionsModalOpen = true;
    const backgroundMusic = document.getElementById('backgroundMusic');
    const isMusicOnNow = backgroundMusic
      ? (!backgroundMusic.paused && backgroundMusic.volume > 0)
      : state.musicEnabled;
    state.musicWasOnWhenOptionsOpened = isMusicOnNow;
    playDesktopOpenSfx();
  }
}

export function checkBrioStatus() {
  applyBrioWorkingVisualState();
}

export function showBrioFrontIfIdle() {
  if (isBrioWorking || !brio[0]) return;
  brio[0].src = './assets/img/brio-front.png';
}

export async function handleBrioClick(e) {
  if (isMessageActive) {
    return;
  }

  const isWorkingNow = isBrioWorking;

  if (isWorkingNow) {
    const monitorBright = document.querySelector('.monitor-bright');
    applyBrioWorkingVisualState();

    if (busyInterruptions >= 3) {
      const level4Message = getBusyMessageForLevel(4);
      isMessageActive = true;
      await showMessage(level4Message, e);
      applyBrioWorkingVisualState();
      openDesktopBrightModal();
      resetBusyInterruptions();
      isMessageActive = false;
      return;
    }

    const busyLevel = busyInterruptions + 1;
    const message = getBusyMessageForLevel(busyLevel);
    busyInterruptions += 1;

    isMessageActive = true;
    await showMessage(message, e);
    applyBrioWorkingVisualState();
    isMessageActive = false;
    return;
  }

  brio[0].src = "./assets/img/brio-turn-back.gif";
  setTimeout(() => {
    brio[0].src = "./assets/img/brio-front.png";
  }, 500);

  const message = getRandomBrioMessage();
  isMessageActive = true;
  await new Promise((resolve) => setTimeout(resolve, 500));
  await showMessage(message, e);

  // showMessage resolves when the bubble is fully hidden.
  brio[0].src = "./assets/img/brio-back-to-windows.gif";
  setTimeout(() => {
    brio[0].src = "./assets/img/brio-back.png";
  }, 500);

  isMessageActive = false;
}

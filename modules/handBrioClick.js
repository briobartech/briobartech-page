const brio = document.getElementsByClassName("brio");
import { showMessage } from './showMessage.js';

const isBrioWorking = false;
let isMessageActive = false;
const usedPhrases = new Set();

function getRandomBrioMessage() {
  const currentFrases = window.languageState.frases;
  const pools = [
    ...(currentFrases.thoughtful || []),
    ...(currentFrases.philosophic || []),
    ...(currentFrases.jokes || []),
    ...(currentFrases.melancholic || []),
  ].filter(Boolean);

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

export function checkBrioStatus() {
  if (isBrioWorking) {
    brio[0].src = "./assets/img/brio-working.png";
    brio[0].style.left = "0";
    brio[0].style.zIndex = 150;
    brio[0].style.width = "512px";
    document.querySelector('.monitor-bright').style.opacity = '1';
  }
}

export async function handleBrioClick(e) {
  if (isMessageActive) {
    return;
  }

  if (!isBrioWorking) {
    brio[0].src = "./assets/img/brio-turn-back.gif";
    setTimeout(() => {
      brio[0].src = "./assets/img/brio-front.png";
    }, 500);
  }

  const message = getRandomBrioMessage();
  isMessageActive = true;
  await new Promise((resolve) => setTimeout(resolve, 500));
  await showMessage(message, e);

  if (!isBrioWorking) {
    // showMessage resolves when the bubble is fully hidden.
    brio[0].src = "./assets/img/brio-back-to-windows.gif";
    setTimeout(() => {
      brio[0].src = "./assets/img/brio-back.png";
    }, 500);
  }

  isMessageActive = false;
}

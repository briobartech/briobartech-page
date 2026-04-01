import { state } from './state.js';
import { showMessage } from './showMessage.js';
import { getIsBrioWorking } from './handBrioClick.js';

export function getUniqueTurnOffMusicPhrase() {
    const currentLanguage = window.languageState?.current || 'es';
    const turnOffMusicPhrases = window.languageState?.frases?.turnOffMusic || [];

    if (turnOffMusicPhrases.length === 0) return '';

    if (!window.__turnOffMusicSeenIndices) {
        window.__turnOffMusicSeenIndices = {
            es: new Set(),
            en: new Set(),
        };
    }

    const usedIndices = window.__turnOffMusicSeenIndices[currentLanguage] || new Set();

    if (usedIndices.size >= turnOffMusicPhrases.length) {
        usedIndices.clear();
    }

    const availableIndices = turnOffMusicPhrases
        .map((_, index) => index)
        .filter((index) => !usedIndices.has(index));

    const selectedIndex = availableIndices[Math.floor(Math.random() * availableIndices.length)];
    usedIndices.add(selectedIndex);
    window.__turnOffMusicSeenIndices[currentLanguage] = usedIndices;

    return turnOffMusicPhrases[selectedIndex] || '';
}

export function closeOptionsModal(e) {
    const backgroundMusic = document.getElementById('backgroundMusic');
    const isMusicOn = backgroundMusic
        ? (!backgroundMusic.paused && backgroundMusic.volume > 0)
        : state.musicEnabled;
    const itWasOn = Boolean(state.musicWasOnWhenOptionsOpened);
    const isBrioWorking = getIsBrioWorking();
    const shouldShowTurnOffMessage = itWasOn && !isMusicOn;

    document.getElementById('optionsModal').style.display='none';
    const monitorBright = document.querySelector('.monitor-bright');
    if (monitorBright) {
        monitorBright.style.opacity = isBrioWorking ? '1' : '0';
        monitorBright.style.zIndex = isBrioWorking ? '20' : '';
    }
    state.desktopClickCount = 0;
    state.isOptionsModalOpen = false;
    state.musicWasOnWhenOptionsOpened = null;

    if (shouldShowTurnOffMessage) {
        const text = getUniqueTurnOffMusicPhrase();
        if (text) {
            const anchor = document.querySelector('.brio');
            setTimeout(() => showMessage(text, anchor || e), 0);
        }
    }
}
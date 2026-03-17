import { state } from './state.js';
import { showMessage } from './showMessage.js';

function getUniqueTurnOffMusicPhrase() {
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
    document.getElementById('optionsModal').style.display='none';
    document.querySelector('.monitor-bright').style.opacity='0';
    state.desktopClickCount = 0;

    if (!state.musicEnabled) {
        const text = getUniqueTurnOffMusicPhrase();
        if (text) {
            showMessage(text, e);
        }
    }
}
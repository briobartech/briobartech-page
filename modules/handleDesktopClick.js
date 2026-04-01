import { state } from './state.js';
import { closeOptionsModal } from './closeOptionsModal.js';
import { closeInteractiveModals } from './modalExclusivity.js';
export function handleDesktopClick() {
    state.desktopClickCount++;
    if (state.desktopClickCount === 1) {
        document.querySelector('.monitor-bright').style.opacity = '1';
    } else if (state.desktopClickCount === 2) {
        closeInteractiveModals('optionsModal');
        document.getElementById('optionsModal').style.display = 'block';
        state.isOptionsModalOpen = true;
        const backgroundMusic = document.getElementById('backgroundMusic');
        const isMusicOnNow = backgroundMusic
            ? (!backgroundMusic.paused && backgroundMusic.volume > 0)
            : state.musicEnabled;
        state.musicWasOnWhenOptionsOpened = isMusicOnNow;
    } else if (state.desktopClickCount === 3) {
        closeOptionsModal();
    }
}
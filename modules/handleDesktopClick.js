import { state } from './state.js';
import { closeOptionsModal } from './closeOptionsModal.js';
export function handleDesktopClick() {
    state.desktopClickCount++;
    if (state.desktopClickCount === 1) {
        document.querySelector('.monitor-bright').style.opacity = '1';
    } else if (state.desktopClickCount === 2) {
        document.getElementById('optionsModal').style.display = 'block';
    } else if (state.desktopClickCount === 3) {
        closeOptionsModal();
    }
}
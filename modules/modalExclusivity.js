import { state } from './state.js';
import { getIsBrioWorking } from './handBrioClick.js';

function isVisible(element) {
  return Boolean(element) && getComputedStyle(element).display !== 'none';
}

export function closeInteractiveModals(exceptId = '') {
  const modalIds = ['optionsModal', 'termsModal', 'certificateModal', 'pdfViewerModal'];

  modalIds.forEach((id) => {
    if (id === exceptId) return;

    const modal = document.getElementById(id);
    if (!isVisible(modal)) return;

    modal.style.display = 'none';

    if (id === 'pdfViewerModal') {
      const frame = document.getElementById('pdfViewerFrame');
      if (frame) frame.src = '';
    }

    if (id === 'optionsModal') {
      const monitorBright = document.querySelector('.monitor-bright');
      if (monitorBright) {
        const isBrioWorking = getIsBrioWorking();
        monitorBright.style.opacity = isBrioWorking ? '1' : '0';
        monitorBright.style.zIndex = isBrioWorking ? '20' : '';
      }

      state.desktopClickCount = 0;
      state.isOptionsModalOpen = false;
      state.musicWasOnWhenOptionsOpened = null;
    }
  });
}

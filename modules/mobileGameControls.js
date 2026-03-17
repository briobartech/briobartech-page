function isTouchMobile() {
  return window.matchMedia('(max-width: 900px) and (pointer: coarse)').matches;
}

function dispatchKey(type, key, code) {
  const event = new KeyboardEvent(type, {
    key,
    code,
    bubbles: true,
    cancelable: true,
  });
  document.dispatchEvent(event);
}

function isVisible(element) {
  return Boolean(element) && getComputedStyle(element).display !== 'none';
}

function triggerSnakeStartIfMenuVisible() {
  const snakeWindow = document.getElementById('snakeWindow');
  const snakeStartMenu = document.getElementById('snakeStartMenu');
  const snakeStartPlayBtn = document.getElementById('snakeStartPlayBtn');

  if (!isVisible(snakeWindow) || !isVisible(snakeStartMenu) || !snakeStartPlayBtn) {
    return false;
  }

  snakeStartPlayBtn.click();
  return true;
}

function keyFromCode(code) {
  if (code === 'Space') return ' ';
  if (code === 'KeyP') return 'p';
  if (code === 'KeyR') return 'r';
  if (code === 'Enter') return 'enter';
  return code;
}

export function initMobileGameControls() {
  if (!isTouchMobile()) return;

  const gameWindowIds = ['snakeWindow', 'racingWindow', 'brickBreakerWindow', 'battleCityWindow'];
  const optionsModal = document.getElementById('optionsModal');

  const root = document.createElement('div');
  root.className = 'mobile-brick-controls';
  root.style.display = 'none';
  root.innerHTML = `
    <div class="mobile-brick-dpad">
      <button type="button" class="mobile-brick-btn" data-key="ArrowUp" data-code="ArrowUp" aria-label="Arriba">▲</button>
      <button type="button" class="mobile-brick-btn" data-key="ArrowLeft" data-code="ArrowLeft" aria-label="Izquierda">◀</button>
      <button type="button" class="mobile-brick-btn" data-key="ArrowDown" data-code="ArrowDown" aria-label="Abajo">▼</button>
      <button type="button" class="mobile-brick-btn" data-key="ArrowRight" data-code="ArrowRight" aria-label="Derecha">▶</button>
    </div>
    <div class="mobile-brick-actions">
      <div class="mobile-brick-top-actions">
        <button type="button" class="mobile-brick-btn mobile-brick-start" data-key="enter" data-code="Enter" data-tap="true" aria-label="Start">START</button>
        <button type="button" class="mobile-brick-btn mobile-brick-reset" data-key="r" data-code="KeyR" data-tap="true" aria-label="Reset">RESET</button>
      </div>
      <button type="button" class="mobile-brick-btn mobile-brick-action" data-key=" " data-code="Space" aria-label="Interaccion">A</button>
    </div>
  `;

  document.body.appendChild(root);

  const activeKeys = new Set();

  function pressKey(key, code) {
    if (activeKeys.has(code)) return;
    activeKeys.add(code);
    dispatchKey('keydown', key, code);
  }

  function releaseKey(key, code) {
    if (!activeKeys.has(code)) return;
    activeKeys.delete(code);
    dispatchKey('keyup', key, code);
  }

  function bindHoldButton(button) {
    const key = button.dataset.key;
    const code = button.dataset.code;
    const isTapOnly = button.dataset.tap === 'true';

    if (!key || !code) return;

    if (isTapOnly) {
      button.addEventListener('click', (e) => {
        e.preventDefault();

        if (code === 'Enter' && triggerSnakeStartIfMenuVisible()) {
          return;
        }

        dispatchKey('keydown', key, code);
        dispatchKey('keyup', key, code);
      });
      return;
    }

    const onStart = (e) => {
      e.preventDefault();
      pressKey(key, code);
    };

    const onEnd = (e) => {
      e.preventDefault();
      releaseKey(key, code);
    };

    button.addEventListener('touchstart', onStart, { passive: false });
    button.addEventListener('touchend', onEnd, { passive: false });
    button.addEventListener('touchcancel', onEnd, { passive: false });
    button.addEventListener('mousedown', onStart);
    button.addEventListener('mouseup', onEnd);
    button.addEventListener('mouseleave', onEnd);
  }

  root.querySelectorAll('.mobile-brick-btn').forEach(bindHoldButton);

  function hasActiveGameWindow() {
    return gameWindowIds.some((id) => isVisible(document.getElementById(id)));
  }

  function refreshVisibility() {
    const modalOpen = isVisible(optionsModal);
    const activeGame = hasActiveGameWindow();
    root.style.display = modalOpen && activeGame ? 'flex' : 'none';

    if (root.style.display === 'none') {
      activeKeys.forEach((code) => {
        const key = keyFromCode(code);
        dispatchKey('keyup', key, code);
      });
      activeKeys.clear();
    }
  }

  const observer = new MutationObserver(refreshVisibility);
  observer.observe(document.body, {
    attributes: true,
    subtree: true,
    attributeFilter: ['style', 'class'],
  });

  window.addEventListener('resize', refreshVisibility);
  refreshVisibility();
}
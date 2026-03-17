function isMobileViewport() {
  return window.matchMedia('(pointer: coarse)').matches || navigator.maxTouchPoints > 0;
}

function isElementVisible(element) {
  return Boolean(element) && getComputedStyle(element).display !== 'none';
}

function hasBlockingOverlay() {
  return [
    document.getElementById('startOverlay'),
    document.getElementById('optionsModal'),
    document.getElementById('pdfViewerModal'),
    document.getElementById('termsModal'),
  ].some(isElementVisible);
}

function shouldIgnoreTouchTarget(target) {
  if (!(target instanceof Element)) return false;

  return Boolean(
    target.closest(
      '#optionsModal, #pdfViewerModal, #termsModal, .folder-window, .projects-viewer, button, a, input, iframe'
    )
  );
}

export function initMobileNavigation() {
  const scene = document.querySelector('.scene');
  const desktop = document.querySelector('.desktop');
  const windowsSprite = document.querySelector('.windows');
  const ASPECT_RATIO = 16 / 9;

  if (!scene || !desktop || !isMobileViewport()) {
    return {
      requestGyroscopePermission: async () => false,
    };
  }

  const state = {
    active: true,
    currentOffset: 0,
    targetOffset: 0,
    maxOffset: 0,
    animationFrameId: 0,
    touchActive: false,
    touchStartX: 0,
    touchStartOffset: 0,
    hasGyroBaseline: false,
    gyroBaseline: 0,
    gyroReady: false,
    permissionRequested: false,
  };

  function clampOffset(value) {
    return Math.max(0, Math.min(state.maxOffset, value));
  }

  function applyOffset(offset) {
    document.body.style.setProperty('--scene-offset-x', `${offset}px`);
  }

  function getSceneContentWidth() {
    const children = Array.from(scene.children).filter((child) => {
      if (!(child instanceof HTMLElement)) return false;

      const styles = getComputedStyle(child);
      return styles.display !== 'none' && styles.position !== 'fixed';
    });

    const maxRight = children.reduce((largestRight, child) => {
      const rect = child.getBoundingClientRect();
      return Math.max(largestRight, rect.right + state.currentOffset);
    }, window.innerWidth);

    return Math.max(window.innerWidth, Math.ceil(maxRight + 24));
  }

  function getInitialCenterOffset() {
    const centerAnchor = windowsSprite || desktop;
    const rect = centerAnchor.getBoundingClientRect();
    const centerX = rect.left + state.currentOffset + rect.width / 2;
    return clampOffset(centerX - window.innerWidth / 2);
  }

  function refreshBounds(preserveCurrentView = true) {
    const aspectWidth = Math.ceil(window.innerHeight * ASPECT_RATIO);
    const measuredContentWidth = getSceneContentWidth();
    const contentWidth = Math.max(aspectWidth, measuredContentWidth);

    scene.style.width = `${contentWidth}px`;
    scene.style.minWidth = `${contentWidth}px`;
    scene.style.height = `${window.innerHeight}px`;
    state.maxOffset = Math.max(0, contentWidth - window.innerWidth);

    if (preserveCurrentView) {
      state.currentOffset = clampOffset(state.currentOffset);
      state.targetOffset = clampOffset(state.targetOffset);
    } else {
      const centeredOffset = getInitialCenterOffset();
      state.currentOffset = centeredOffset;
      state.targetOffset = centeredOffset;
    }

    applyOffset(state.currentOffset);
  }

  function animate() {
    if (!state.active) return;

    if (hasBlockingOverlay()) {
      state.touchActive = false;
      state.targetOffset = state.currentOffset;
      state.animationFrameId = window.requestAnimationFrame(animate);
      return;
    }

    const delta = state.targetOffset - state.currentOffset;
    if (Math.abs(delta) > 0.1) {
      state.currentOffset += delta * 0.14;
      applyOffset(state.currentOffset);
    } else if (state.currentOffset !== state.targetOffset) {
      state.currentOffset = state.targetOffset;
      applyOffset(state.currentOffset);
    }

    state.animationFrameId = window.requestAnimationFrame(animate);
  }

  function resetGyroBaseline() {
    state.hasGyroBaseline = false;
  }

  function getHorizontalTilt(event) {
    const screenOrientation = window.screen && window.screen.orientation
      ? window.screen.orientation.angle
      : (typeof window.orientation === 'number' ? window.orientation : 0);
    const normalizedAngle = ((Number(screenOrientation) % 360) + 360) % 360;

    if (normalizedAngle === 90) {
      return typeof event.beta === 'number' ? -event.beta : null;
    }

    if (normalizedAngle === 270) {
      return typeof event.beta === 'number' ? event.beta : null;
    }

    return typeof event.gamma === 'number' ? event.gamma : null;
  }

  function onDeviceOrientation(event) {
    if (!state.gyroReady || state.touchActive || hasBlockingOverlay()) return;
    const horizontalTilt = getHorizontalTilt(event);
    if (typeof horizontalTilt !== 'number') return;

    if (!state.hasGyroBaseline) {
      state.hasGyroBaseline = true;
      state.gyroBaseline = horizontalTilt;
    }

    const relativeGamma = horizontalTilt - state.gyroBaseline;
    const limitedGamma = Math.max(-18, Math.min(18, relativeGamma));
    const ratio = (limitedGamma + 18) / 36;
    state.targetOffset = clampOffset(ratio * state.maxOffset);
  }

  function onTouchStart(event) {
    if (hasBlockingOverlay() || shouldIgnoreTouchTarget(event.target)) return;
    if (event.touches.length !== 1) return;

    state.touchActive = true;
    state.touchStartX = event.touches[0].clientX;
    state.touchStartOffset = state.targetOffset;
  }

  function onTouchMove(event) {
    if (!state.touchActive) return;
    if (hasBlockingOverlay()) {
      state.touchActive = false;
      return;
    }
    if (event.touches.length !== 1) return;

    const deltaX = event.touches[0].clientX - state.touchStartX;
    state.targetOffset = clampOffset(state.touchStartOffset - deltaX);
    event.preventDefault();
  }

  function onTouchEnd() {
    state.touchActive = false;
  }

  async function requestGyroscopePermission() {
    if (!isMobileViewport()) return false;

    state.permissionRequested = true;

    const requestables = [
      window.DeviceOrientationEvent,
      window.DeviceMotionEvent,
    ].filter(Boolean);

    if (requestables.length === 0) {
      state.gyroReady = false;
      return false;
    }

    let granted = false;

    for (const EventType of requestables) {
      if (typeof EventType.requestPermission === 'function') {
        try {
          const result = await EventType.requestPermission();
          if (result === 'granted') {
            granted = true;
          }
        } catch {
          // Ignore and keep trying other permission APIs.
        }
      } else {
        // Most Android browsers expose sensors without explicit prompt.
        granted = true;
      }
    }

    state.gyroReady = granted;

    if (state.gyroReady) {
      resetGyroBaseline();
    }

    return state.gyroReady;
  }

  document.documentElement.classList.add('is-mobile-horizontal-nav');
  document.body.classList.add('is-mobile-horizontal-nav');
  refreshBounds(false);
  animate();

  window.addEventListener('resize', () => refreshBounds(true));
  window.addEventListener('orientationchange', () => {
    resetGyroBaseline();
    window.setTimeout(() => refreshBounds(true), 180);
  });
  document.addEventListener('visibilitychange', () => {
    if (!document.hidden) {
      resetGyroBaseline();
      refreshBounds(true);
    }
  });
  window.addEventListener('deviceorientation', onDeviceOrientation);
  document.addEventListener('touchstart', onTouchStart, { passive: true });
  document.addEventListener('touchmove', onTouchMove, { passive: false });
  document.addEventListener('touchend', onTouchEnd, { passive: true });
  document.addEventListener('touchcancel', onTouchEnd, { passive: true });
  document.addEventListener('touchend', () => {
    if (!state.permissionRequested && !state.gyroReady && !hasBlockingOverlay()) {
      requestGyroscopePermission();
    }
  }, { passive: true });

  return {
    requestGyroscopePermission,
  };
}
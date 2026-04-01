const IMAGE_EXTENSIONS = new Set(['jpg', 'jpeg', 'png', 'gif', 'webp', 'bmp', 'svg', 'avif']);
const VIDEO_EXTENSIONS = new Set(['mp4', 'webm', 'ogg', 'mov', 'm4v']);

// Replace these two icons when you draw your own default file icons.
const IMAGE_ICON = './assets/img/image-icon.png';
const VIDEO_ICON = './assets/img/video-icon.png';
const FALLBACK_ICON = './assets/img/folder.png';

function getExtension(path) {
  const cleanPath = path.split('?')[0].split('#')[0];
  const ext = cleanPath.includes('.') ? cleanPath.split('.').pop() : '';
  return (ext || '').toLowerCase();
}

function getMediaType(path) {
  const ext = getExtension(path);
  if (IMAGE_EXTENSIONS.has(ext)) return 'image';
  if (VIDEO_EXTENSIONS.has(ext)) return 'video';
  return 'unknown';
}

function getFileName(path) {
  const parts = path.split('/');
  return parts[parts.length - 1] || path;
}

export function initProjectsFolder(initialPaths = []) {
  const grid = document.getElementById('projectsMediaGrid');
  const empty = document.getElementById('projectsEmpty');
  const viewer = document.getElementById('projectsViewer');
  const viewerBody = document.getElementById('projectsViewerBody');
  const caption = document.getElementById('projectsViewerCaption');
  const prevBtn = document.getElementById('projectsPrevBtn');
  const nextBtn = document.getElementById('projectsNextBtn');
  const closeBtn = document.getElementById('projectsCloseViewerBtn');
  const viewerFooter = viewer ? viewer.querySelector('.projects-viewer-footer') : null;

  if (!grid || !viewer || !viewerBody || !caption || !prevBtn || !nextBtn || !closeBtn || !empty) {
    return {
      setMediaPaths: () => {},
    };
  }

  // Keep the media viewer independent from the projects folder window.
  if (viewer.parentElement !== document.body) {
    document.body.appendChild(viewer);
  }

  let items = [];
  let currentIndex = -1;
  const isTouchDevice = window.matchMedia('(pointer: coarse)').matches;
  const MIN_ZOOM = 1;
  const MAX_ZOOM = 4;
  const ZOOM_STEP = 0.25;
  let currentZoom = 1;
  let isDragging = false;
  let dragPointerId = null;
  let dragStartX = 0;
  let dragStartY = 0;
  let lastDragTs = 0;
  let panVelocityX = 0;
  let panVelocityY = 0;
  let inertiaFrameId = null;

  const controls = document.createElement('div');
  controls.className = 'projects-viewer-controls';

  const topActions = document.createElement('div');
  topActions.className = 'projects-viewer-top-actions';

  const zoomOutBtn = document.createElement('button');
  zoomOutBtn.type = 'button';
  zoomOutBtn.className = 'projects-zoom-btn';
  zoomOutBtn.textContent = '-';
  zoomOutBtn.setAttribute('aria-label', 'Alejar imagen');

  const zoomLabel = document.createElement('span');
  zoomLabel.className = 'projects-zoom-label';
  zoomLabel.textContent = '100%';

  const zoomInBtn = document.createElement('button');
  zoomInBtn.type = 'button';
  zoomInBtn.className = 'projects-zoom-btn';
  zoomInBtn.textContent = '+';
  zoomInBtn.setAttribute('aria-label', 'Acercar imagen');

  const zoomResetBtn = document.createElement('button');
  zoomResetBtn.type = 'button';
  zoomResetBtn.className = 'projects-zoom-btn';
  zoomResetBtn.textContent = '100%';
  zoomResetBtn.setAttribute('aria-label', 'Restaurar zoom');

  const fullscreenBtn = document.createElement('button');
  fullscreenBtn.type = 'button';
  fullscreenBtn.className = 'projects-zoom-btn projects-fullscreen-btn';
  fullscreenBtn.textContent = '[]';
  fullscreenBtn.setAttribute('aria-label', 'Pantalla completa');

  closeBtn.classList.add('projects-close-top-btn');

  controls.appendChild(zoomOutBtn);
  controls.appendChild(zoomLabel);
  controls.appendChild(zoomInBtn);
  controls.appendChild(zoomResetBtn);

  topActions.appendChild(fullscreenBtn);
  topActions.appendChild(closeBtn);
  viewer.appendChild(topActions);

  if (viewerFooter) {
    viewerFooter.insertBefore(controls, caption);
  }

  function getCurrentImageElement() {
    return viewerBody.querySelector('img.projects-viewer-media');
  }

  function isImageSelected() {
    return currentIndex >= 0 && currentIndex < items.length && items[currentIndex].type === 'image';
  }

  function canPanImage() {
    return isImageSelected() && currentZoom > 1;
  }

  function stopInertia() {
    if (inertiaFrameId !== null) {
      cancelAnimationFrame(inertiaFrameId);
      inertiaFrameId = null;
    }
    panVelocityX = 0;
    panVelocityY = 0;
  }

  function startInertia() {
    if (!canPanImage()) return;

    const minSpeed = 0.015;
    const friction = 0.93;
    let lastTs = performance.now();

    const step = (ts) => {
      const dt = Math.max(1, ts - lastTs);
      lastTs = ts;

      if (!canPanImage()) {
        stopInertia();
        return;
      }

      viewerBody.scrollLeft -= panVelocityX * dt;
      viewerBody.scrollTop -= panVelocityY * dt;

      panVelocityX *= friction;
      panVelocityY *= friction;

      if (Math.abs(panVelocityX) < minSpeed && Math.abs(panVelocityY) < minSpeed) {
        stopInertia();
        return;
      }

      inertiaFrameId = requestAnimationFrame(step);
    };

    stopInertia();
    inertiaFrameId = requestAnimationFrame(step);
  }

  function stopDragging() {
    isDragging = false;
    dragPointerId = null;
    viewerBody.classList.remove('projects-viewer-body-dragging');
  }

  function updatePanUi() {
    const canPan = canPanImage();
    viewerBody.classList.toggle('projects-viewer-body-draggable', canPan);
    if (!canPan) {
      stopInertia();
      stopDragging();
    }
  }

  function updateZoomUi() {
    const imageSelected = isImageSelected();
    zoomLabel.textContent = `${Math.round(currentZoom * 100)}%`;
    zoomOutBtn.disabled = !imageSelected || currentZoom <= MIN_ZOOM;
    zoomInBtn.disabled = !imageSelected || currentZoom >= MAX_ZOOM;
    zoomResetBtn.disabled = !imageSelected || currentZoom === 1;
    updatePanUi();
  }

  function applyZoom() {
    const img = getCurrentImageElement();
    if (!img) {
      updateZoomUi();
      return;
    }

    if (currentZoom <= 1) {
      // Keep the full media visible inside the viewer bounds at default zoom.
      img.style.maxWidth = '100%';
      img.style.maxHeight = '100%';
      img.style.width = 'auto';
      img.style.height = 'auto';
    } else {
      img.style.maxWidth = 'none';
      img.style.maxHeight = 'none';
      img.style.width = `${currentZoom * 100}%`;
      img.style.height = 'auto';
    }

    viewerBody.classList.toggle('projects-viewer-body-zoomed', currentZoom > 1);
    updateZoomUi();
  }

  function setZoom(nextZoom) {
    if (!isImageSelected()) return;
    const clampedZoom = Math.min(MAX_ZOOM, Math.max(MIN_ZOOM, nextZoom));
    if (clampedZoom === currentZoom) return;
    currentZoom = clampedZoom;
    applyZoom();
  }

  function resetZoom() {
    stopInertia();
    currentZoom = 1;
    viewerBody.scrollTop = 0;
    viewerBody.scrollLeft = 0;
    applyZoom();
  }

  async function toggleFullscreen() {
    try {
      if (!document.fullscreenElement) {
        await viewer.requestFullscreen();
      } else {
        await document.exitFullscreen();
      }
    } catch {
      // Ignore fullscreen API errors on unsupported browsers.
    }
  }

  function updateFullscreenUi() {
    const isFullscreen = document.fullscreenElement === viewer;
    fullscreenBtn.textContent = isFullscreen ? '><' : '[]';
    fullscreenBtn.setAttribute('aria-label', isFullscreen ? 'Salir de pantalla completa' : 'Pantalla completa');
  }

  function renderCurrentMedia() {
    if (currentIndex < 0 || currentIndex >= items.length) return;

    const current = items[currentIndex];
    viewerBody.innerHTML = '';

    if (current.type === 'video') {
      const video = document.createElement('video');
      video.src = current.path;
      video.controls = true;
      video.preload = 'metadata';
      video.className = 'projects-viewer-media';
      viewerBody.appendChild(video);
      currentZoom = 1;
      viewerBody.classList.remove('projects-viewer-body-zoomed');
    } else {
      const img = document.createElement('img');
      img.src = current.path;
      img.alt = current.name;
      img.className = 'projects-viewer-media';
      viewerBody.appendChild(img);
      applyZoom();
    }

    caption.textContent = `${currentIndex + 1}/${items.length} - ${current.name}`;
    updateZoomUi();
  }

  function openViewer(index) {
    if (index < 0 || index >= items.length) return;
    currentIndex = index;
    viewer.style.display = 'flex';
    resetZoom();
    renderCurrentMedia();
    updateFullscreenUi();
  }

  function closeViewer() {
    viewer.style.display = 'none';
    viewerBody.innerHTML = '';
    viewerBody.classList.remove('projects-viewer-body-zoomed');
    viewerBody.classList.remove('projects-viewer-body-draggable');
    stopInertia();
    stopDragging();
    currentIndex = -1;
    currentZoom = 1;
    updateZoomUi();
  }

  function goPrev() {
    if (items.length === 0) return;
    currentIndex = (currentIndex - 1 + items.length) % items.length;
    renderCurrentMedia();
  }

  function goNext() {
    if (items.length === 0) return;
    currentIndex = (currentIndex + 1) % items.length;
    renderCurrentMedia();
  }

  function renderGrid() {
    grid.innerHTML = '';

    if (items.length === 0) {
      empty.style.display = 'block';
      return;
    }

    empty.style.display = 'none';

    items.forEach((item, index) => {
      const button = document.createElement('button');
      button.type = 'button';
      button.className = 'desktop-icon projects-item';
      button.title = item.name;

      const icon = document.createElement('img');
      icon.src = item.type === 'video' ? VIDEO_ICON : IMAGE_ICON;
      icon.alt = item.type === 'video' ? 'Video' : 'Imagen';
      icon.onerror = () => {
        icon.src = FALLBACK_ICON;
      };

      const label = document.createElement('span');
      label.textContent = item.name;

      button.appendChild(icon);
      button.appendChild(label);
      button.addEventListener(isTouchDevice ? 'click' : 'dblclick', () => openViewer(index));

      grid.appendChild(button);
    });
  }

  function setMediaPaths(paths) {
    const normalized = Array.isArray(paths) ? paths : [];
    items = normalized
      .map((path) => ({
        path,
        type: getMediaType(path),
        name: getFileName(path),
      }))
      .filter((item) => item.type === 'image' || item.type === 'video');

    closeViewer();
    renderGrid();
  }

  prevBtn.addEventListener('click', goPrev);
  nextBtn.addEventListener('click', goNext);
  closeBtn.addEventListener('click', closeViewer);
  zoomInBtn.addEventListener('click', () => setZoom(currentZoom + ZOOM_STEP));
  zoomOutBtn.addEventListener('click', () => setZoom(currentZoom - ZOOM_STEP));
  zoomResetBtn.addEventListener('click', resetZoom);
  fullscreenBtn.addEventListener('click', toggleFullscreen);

  viewerBody.addEventListener('wheel', (event) => {
    if (!isImageSelected()) return;
    event.preventDefault();
    const direction = event.deltaY < 0 ? 1 : -1;
    setZoom(currentZoom + direction * ZOOM_STEP);
  }, { passive: false });

  viewerBody.addEventListener('dblclick', () => {
    if (!isImageSelected()) return;
    setZoom(currentZoom > 1 ? 1 : 2);
  });

  viewerBody.addEventListener('pointerdown', (event) => {
    if (!canPanImage()) return;
    if (event.button !== 0) return;

    stopInertia();
    isDragging = true;
    dragPointerId = event.pointerId;
    dragStartX = event.clientX;
    dragStartY = event.clientY;
    lastDragTs = event.timeStamp;
    panVelocityX = 0;
    panVelocityY = 0;
    viewerBody.setPointerCapture(event.pointerId);
    viewerBody.classList.add('projects-viewer-body-dragging');
    event.preventDefault();
  });

  viewerBody.addEventListener('pointermove', (event) => {
    if (!isDragging || event.pointerId !== dragPointerId) return;

    const deltaX = event.clientX - dragStartX;
    const deltaY = event.clientY - dragStartY;
    const dt = Math.max(1, event.timeStamp - lastDragTs);

    viewerBody.scrollLeft -= deltaX;
    viewerBody.scrollTop -= deltaY;

    panVelocityX = deltaX / dt;
    panVelocityY = deltaY / dt;
    dragStartX = event.clientX;
    dragStartY = event.clientY;
    lastDragTs = event.timeStamp;
    event.preventDefault();
  });

  const endDrag = (event) => {
    if (!isDragging || event.pointerId !== dragPointerId) return;
    const vx = panVelocityX;
    const vy = panVelocityY;
    stopDragging();
    panVelocityX = vx;
    panVelocityY = vy;

    const launchThreshold = 0.04;
    if (Math.abs(panVelocityX) > launchThreshold || Math.abs(panVelocityY) > launchThreshold) {
      startInertia();
    } else {
      stopInertia();
    }
  };

  viewerBody.addEventListener('pointerup', endDrag);
  viewerBody.addEventListener('pointercancel', endDrag);
  viewerBody.addEventListener('lostpointercapture', endDrag);

  document.addEventListener('fullscreenchange', updateFullscreenUi);

  document.addEventListener('keydown', (event) => {
    if (viewer.style.display !== 'flex') return;
    if (event.key === 'ArrowLeft') goPrev();
    if (event.key === 'ArrowRight') goNext();
    if ((event.key === '+' || event.key === '=') && isImageSelected()) {
      event.preventDefault();
      setZoom(currentZoom + ZOOM_STEP);
    }
    if (event.key === '-' && isImageSelected()) {
      event.preventDefault();
      setZoom(currentZoom - ZOOM_STEP);
    }
    if (event.key === '0' && isImageSelected()) {
      event.preventDefault();
      resetZoom();
    }
    if (event.key.toLowerCase() === 'f') {
      event.preventDefault();
      toggleFullscreen();
    }
    if (event.key === 'Escape') closeViewer();
  });

  setMediaPaths(initialPaths);
  updateZoomUi();
  updateFullscreenUi();

  return {
    setMediaPaths,
  };
}

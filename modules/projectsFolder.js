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

  if (!grid || !viewer || !viewerBody || !caption || !prevBtn || !nextBtn || !closeBtn || !empty) {
    return {
      setMediaPaths: () => {},
    };
  }

  let items = [];
  let currentIndex = -1;
  const isTouchDevice = window.matchMedia('(pointer: coarse)').matches;

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
    } else {
      const img = document.createElement('img');
      img.src = current.path;
      img.alt = current.name;
      img.className = 'projects-viewer-media';
      viewerBody.appendChild(img);
    }

    caption.textContent = `${currentIndex + 1}/${items.length} - ${current.name}`;
  }

  function openViewer(index) {
    if (index < 0 || index >= items.length) return;
    currentIndex = index;
    viewer.style.display = 'flex';
    renderCurrentMedia();
  }

  function closeViewer() {
    viewer.style.display = 'none';
    viewerBody.innerHTML = '';
    currentIndex = -1;
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

  document.addEventListener('keydown', (event) => {
    if (viewer.style.display !== 'flex') return;
    if (event.key === 'ArrowLeft') goPrev();
    if (event.key === 'ArrowRight') goNext();
    if (event.key === 'Escape') closeViewer();
  });

  setMediaPaths(initialPaths);

  return {
    setMediaPaths,
  };
}

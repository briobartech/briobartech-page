import { state } from './state.js';

function prettifyTrackTitle(fileName) {
  return String(fileName || '')
    .replace(/\.[^/.]+$/, '')
    .replace(/[+_]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim()
    .replace(/\b\w/g, (char) => char.toUpperCase());
}

function normalizeTrackEntry(entry) {
  if (typeof entry === 'string') {
    const file = entry.trim();
    if (!file) return null;
    return {
      src: `./assets/music/${file}`,
      title: prettifyTrackTitle(file),
      artist: 'Brio Selection',
      album: 'Desktop Bright Mix',
    };
  }

  if (!entry || typeof entry !== 'object') return null;

  const file = String(entry.file || '').trim();
  if (!file) return null;

  return {
    src: `./assets/music/${file}`,
    title: String(entry.title || prettifyTrackTitle(file)),
    artist: String(entry.artist || 'Brio Selection'),
    album: String(entry.album || 'Desktop Bright Mix'),
  };
}

async function loadMusicManifest() {
  try {
    const response = await fetch('./assets/music/manifest.json', { cache: 'no-store' });
    if (!response.ok) return [];

    const data = await response.json();
    if (!Array.isArray(data)) return [];

    return data.map(normalizeTrackEntry).filter(Boolean);
  } catch {
    return [];
  }
}

export function initMusicPlayer(audioElement) {
  if (!audioElement) return null;
  audioElement.loop = false;

  const titleEl = document.getElementById('musicPlayerTitle');
  const artistEl = document.getElementById('musicPlayerArtist');
  const albumEl = document.getElementById('musicPlayerAlbum');
  const timeEl = document.getElementById('musicPlayerTime');
  const prevBtn = document.getElementById('musicPlayerPrevBtn');
  const playPauseBtn = document.getElementById('musicPlayerPlayPauseBtn');
  const nextBtn = document.getElementById('musicPlayerNextBtn');
  const shuffleBtn = document.getElementById('musicPlayerShuffleBtn');
  const volumeSlider = document.getElementById('musicPlayerVolume');
  const volumeLabel = document.getElementById('musicPlayerVolumeLabel');
  const listEl = document.getElementById('musicPlayerList');

  if (!titleEl || !artistEl || !albumEl || !timeEl || !prevBtn || !playPauseBtn || !nextBtn || !shuffleBtn || !volumeSlider || !volumeLabel || !listEl) {
    return null;
  }

  const fallbackPlaylist = [
    {
      src: './assets/music/codeman.mp3',
      title: 'Codeman',
      artist: 'Brio Selection',
      album: 'Desktop Bright Mix',
    },
    {
      src: './assets/music/cosita_sad.mp3',
      title: 'Cosita Sad',
      artist: 'Brio Selection',
      album: 'Desktop Bright Mix',
    },
    {
      src: './assets/music/cosito.mp3',
      title: 'Cosito',
      artist: 'Brio Selection',
      album: 'Desktop Bright Mix',
    },
  ];

  let playlist = [...fallbackPlaylist];
  let isShuffleEnabled = true;
  const shuffleHistory = [];

  let currentIndex = Math.max(0, playlist.findIndex((track) => audioElement.src.includes(track.src.replace('./', ''))));
  if (currentIndex < 0) currentIndex = 0;

  const getRandomIndex = () => {
    if (playlist.length === 0) return 0;
    return Math.floor(Math.random() * playlist.length);
  };

  const getRandomIndexExcept = (excludedIndex) => {
    if (playlist.length <= 1) return 0;

    let nextIndex = excludedIndex;
    while (nextIndex === excludedIndex) {
      nextIndex = getRandomIndex();
    }
    return nextIndex;
  };

  const formatTime = (seconds) => {
    if (!Number.isFinite(seconds) || seconds < 0) return '--:--';
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${String(mins).padStart(2, '0')}:${String(secs).padStart(2, '0')}`;
  };

  const updateTime = () => {
    timeEl.textContent = `${formatTime(audioElement.currentTime)} / ${formatTime(audioElement.duration)}`;
  };

  const updatePlayPauseIcon = () => {
    playPauseBtn.textContent = audioElement.paused ? '▶' : '⏸';
  };

  const updateShuffleUi = () => {
    shuffleBtn.dataset.active = isShuffleEnabled ? 'true' : 'false';
    shuffleBtn.setAttribute('aria-pressed', isShuffleEnabled ? 'true' : 'false');
  };

  const updateTrackInfo = () => {
    if (playlist.length === 0) return;
    const track = playlist[currentIndex];
    titleEl.textContent = track.title;
    artistEl.textContent = track.artist;
    albumEl.textContent = track.album;

    listEl.querySelectorAll('[data-index]').forEach((item) => {
      const index = Number(item.dataset.index);
      item.classList.toggle('is-active', index === currentIndex);
    });

    document.dispatchEvent(new CustomEvent('musicTrackChanged', {
      detail: {
        title: track.title,
        artist: track.artist,
        album: track.album,
        index: currentIndex,
        isPlaying: !audioElement.paused,
      },
    }));

    updatePlayPauseIcon();
    updateTime();
  };

  const applyEffectiveVolume = () => {
    audioElement.volume = state.musicEnabled ? state.musicVolume : 0;
    volumeLabel.textContent = `${Math.round(state.musicVolume * 100)}%`;
    volumeSlider.value = String(Math.round(state.musicVolume * 100));
  };

  const loadTrack = (index, shouldPlay = state.musicEnabled, options = {}) => {
    if (playlist.length === 0) return;

    const { recordHistory = true } = options;

    if (recordHistory && currentIndex >= 0 && currentIndex < playlist.length) {
      shuffleHistory.push(currentIndex);
      if (shuffleHistory.length > 50) {
        shuffleHistory.shift();
      }
    }

    currentIndex = (index + playlist.length) % playlist.length;
    audioElement.loop = false;
    audioElement.src = playlist[currentIndex].src;
    audioElement.currentTime = 0;

    applyEffectiveVolume();
    updateTrackInfo();

    if (shouldPlay && state.musicEnabled) {
      audioElement.play().catch(() => {});
    }
  };

  const togglePlayPause = () => {
    if (audioElement.paused) {
      if (!state.musicEnabled) {
        document.dispatchEvent(new CustomEvent('requestMusicEnable'));
      }
      applyEffectiveVolume();
      audioElement.play().catch(() => {});
    } else {
      audioElement.pause();
    }
  };

  const playNextTrack = (shouldPlay = true) => {
    if (playlist.length === 0) return;
    const nextIndex = isShuffleEnabled
      ? getRandomIndexExcept(currentIndex)
      : currentIndex + 1;
    loadTrack(nextIndex, shouldPlay, { recordHistory: true });
  };

  const playPreviousTrack = (shouldPlay = true) => {
    if (playlist.length === 0) return;

    if (isShuffleEnabled && shuffleHistory.length > 0) {
      const previousIndex = shuffleHistory.pop();
      loadTrack(previousIndex, shouldPlay, { recordHistory: false });
      return;
    }

    loadTrack(currentIndex - 1, shouldPlay, { recordHistory: true });
  };

  const renderPlaylist = () => {
    listEl.innerHTML = '';
    playlist.forEach((track, index) => {
      const item = document.createElement('button');
      item.type = 'button';
      item.className = 'music-track-item';
      item.dataset.index = String(index);
      item.textContent = `${index + 1}. ${track.title}`;
      item.addEventListener('click', () => loadTrack(index, true));
      listEl.appendChild(item);
    });
  };

  renderPlaylist();

  prevBtn.addEventListener('click', () => playPreviousTrack(true));
  nextBtn.addEventListener('click', () => playNextTrack(true));
  playPauseBtn.addEventListener('click', togglePlayPause);
  shuffleBtn.addEventListener('click', () => {
    isShuffleEnabled = !isShuffleEnabled;
    if (!isShuffleEnabled) {
      shuffleHistory.length = 0;
    }
    updateShuffleUi();
  });

  volumeSlider.addEventListener('input', () => {
    const nextVolume = Number(volumeSlider.value) / 100;
    state.musicVolume = Math.max(0, Math.min(1, nextVolume));
    applyEffectiveVolume();
  });

  audioElement.addEventListener('play', updateTrackInfo);
  audioElement.addEventListener('pause', updateTrackInfo);
  audioElement.addEventListener('timeupdate', updateTime);
  audioElement.addEventListener('loadedmetadata', updateTime);
  audioElement.addEventListener('ended', () => playNextTrack(state.musicEnabled));
  document.addEventListener('backgroundMusicStateChanged', applyEffectiveVolume);
  document.addEventListener('musicWidgetPrevious', () => playPreviousTrack(true));
  document.addEventListener('musicWidgetTogglePlayPause', togglePlayPause);
  document.addEventListener('musicWidgetNext', () => playNextTrack(true));

  updateShuffleUi();

  function syncCurrentTrack(shouldAutoplay = false) {
    if (playlist.length === 0) return;

    const matchedTrack = playlist.findIndex((track) => audioElement.src.includes(track.src.replace('./', '')));
    if (matchedTrack >= 0) {
      currentIndex = matchedTrack;
      audioElement.loop = false;
      applyEffectiveVolume();
      updateTrackInfo();
      return;
    }

    loadTrack(0, shouldAutoplay);
  }

  // Boot with a random track so the playlist starts in shuffle-like fashion.
  loadTrack(getRandomIndex(), false, { recordHistory: false });

  loadMusicManifest().then((manifestTracks) => {
    if (!Array.isArray(manifestTracks) || manifestTracks.length === 0) return;

    playlist = manifestTracks;
    renderPlaylist();

    const isBootPhase = audioElement.paused && audioElement.currentTime < 0.1;
    if (isBootPhase) {
      loadTrack(getRandomIndex(), false, { recordHistory: false });
      return;
    }

    currentIndex = Math.max(0, Math.min(currentIndex, playlist.length - 1));
    syncCurrentTrack(false);
  });

  return {
    setPlaylist: (tracks) => {
      if (!Array.isArray(tracks) || tracks.length === 0) return;
      const normalized = tracks.map(normalizeTrackEntry).filter(Boolean);
      if (normalized.length === 0) return;
      playlist = normalized;
      shuffleHistory.length = 0;
      renderPlaylist();
      loadTrack(getRandomIndex(), false, { recordHistory: false });
    },
  };
}

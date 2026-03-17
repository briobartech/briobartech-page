import { state } from './state.js';

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
  const volumeSlider = document.getElementById('musicPlayerVolume');
  const volumeLabel = document.getElementById('musicPlayerVolumeLabel');
  const listEl = document.getElementById('musicPlayerList');

  if (!titleEl || !artistEl || !albumEl || !timeEl || !prevBtn || !playPauseBtn || !nextBtn || !volumeSlider || !volumeLabel || !listEl) {
    return null;
  }

  const playlist = [
    {
      src: './assets/music/to my future love.mp3',
      title: 'To My Future Love',
      artist: 'Brio Selection',
      album: 'Desktop Bright Mix',
    },
    {
      src: './assets/music/night drive.mp3',
      title: 'Night Drive',
      artist: 'Brio Selection',
      album: 'Desktop Bright Mix',
    },
    {
      src: './assets/music/city lights.mp3',
      title: 'City Lights',
      artist: 'Brio Selection',
      album: 'Desktop Bright Mix',
    },
  ];

  let currentIndex = Math.max(0, playlist.findIndex((track) => audioElement.src.includes(track.src.replace('./', ''))));
  if (currentIndex < 0) currentIndex = 0;

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

  const updateTrackInfo = () => {
    const track = playlist[currentIndex];
    titleEl.textContent = track.title;
    artistEl.textContent = track.artist;
    albumEl.textContent = track.album;

    listEl.querySelectorAll('[data-index]').forEach((item) => {
      const index = Number(item.dataset.index);
      item.classList.toggle('is-active', index === currentIndex);
    });

    updatePlayPauseIcon();
    updateTime();
  };

  const applyEffectiveVolume = () => {
    audioElement.volume = state.musicEnabled ? state.musicVolume : 0;
    volumeLabel.textContent = `${Math.round(state.musicVolume * 100)}%`;
    volumeSlider.value = String(Math.round(state.musicVolume * 100));
  };

  const loadTrack = (index, shouldPlay = state.musicEnabled) => {
    if (playlist.length === 0) return;

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

  prevBtn.addEventListener('click', () => loadTrack(currentIndex - 1, true));
  nextBtn.addEventListener('click', () => loadTrack(currentIndex + 1, true));
  playPauseBtn.addEventListener('click', togglePlayPause);

  volumeSlider.addEventListener('input', () => {
    const nextVolume = Number(volumeSlider.value) / 100;
    state.musicVolume = Math.max(0, Math.min(1, nextVolume));
    applyEffectiveVolume();
  });

  audioElement.addEventListener('play', updateTrackInfo);
  audioElement.addEventListener('pause', updateTrackInfo);
  audioElement.addEventListener('timeupdate', updateTime);
  audioElement.addEventListener('loadedmetadata', updateTime);
  audioElement.addEventListener('ended', () => loadTrack(currentIndex + 1, state.musicEnabled));
  document.addEventListener('backgroundMusicStateChanged', applyEffectiveVolume);

  // Ensure the current source maps to one known track; fallback to first track.
  const matchedTrack = playlist.findIndex((track) => audioElement.src.includes(track.src.replace('./', '')));
  if (matchedTrack >= 0) {
    currentIndex = matchedTrack;
    audioElement.loop = false;
    applyEffectiveVolume();
    updateTrackInfo();
  } else {
    loadTrack(0, false);
  }

  return {
    setPlaylist: (tracks) => {
      if (!Array.isArray(tracks) || tracks.length === 0) return;
      // Placeholder for future dynamic playlist extension.
    },
  };
}

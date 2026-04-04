import { datos } from './datos.js';
import { hideMessage } from './showMessage.js';
import { closeInteractiveModals } from './modalExclusivity.js';
import { getIsBrioWorking, toggleBrioWorking } from './handBrioClick.js';

const SKILL_ICON_MAP = {
  'javascript': 'https://cdn.simpleicons.org/javascript/F7DF1E',
  'python': 'https://cdn.simpleicons.org/python/3776AB',
  'c#': 'https://cdn.jsdelivr.net/gh/devicons/devicon/icons/csharp/csharp-original.svg',
  'react': 'https://cdn.simpleicons.org/react/61DAFB',
  'node.js': 'https://cdn.simpleicons.org/nodedotjs/339933',
  'express': 'https://cdn.simpleicons.org/express/FFFFFF',
  'unity': 'https://cdn.simpleicons.org/unity/FFFFFF',
  'godot': 'https://cdn.simpleicons.org/godotengine/478CBF',
  'mongodb': 'https://cdn.simpleicons.org/mongodb/47A248',
  'mysql': 'https://cdn.simpleicons.org/mysql/4479A1',
  'figma': 'https://cdn.simpleicons.org/figma/F24E1E',
  'adobe photoshop': 'https://cdn.jsdelivr.net/gh/devicons/devicon/icons/photoshop/photoshop-original.svg',
  'adobe illustrator': 'https://cdn.jsdelivr.net/gh/devicons/devicon/icons/illustrator/illustrator-original.svg',
  'adobe premiere': 'https://cdn.jsdelivr.net/gh/devicons/devicon/icons/premierepro/premierepro-original.svg',
  'capcut': 'https://api.iconify.design/arcticons:capcut.svg?color=%23ffffff',
  'medibang paint': 'https://cdn.simpleicons.org/medibangpaint/00DBDE',
  'dibujo': './assets/img/image-icon.png',
  'videojuegos': 'https://cdn.jsdelivr.net/gh/devicons/devicon/icons/java/java-original.svg',
  'musica': 'https://cdn.simpleicons.org/spotify/1DB954',
  'escritura': 'https://cdn.jsdelivr.net/gh/twitter/twemoji@14.0.2/assets/svg/270d.svg',
  'literatura': 'https://cdn.jsdelivr.net/gh/twitter/twemoji@14.0.2/assets/svg/1f4d6.svg',
  'astro aficionado': 'https://cdn.jsdelivr.net/gh/twitter/twemoji@14.0.2/assets/svg/1f52d.svg',
};

const DEFAULT_GROUP_MASTERY = {
  lenguajes: 7,
  frameworks: 6,
  bases: 6,
  diseno: 6,
  hobbies: 6,
};

const GROUP_RARITY_LABEL = {
  lenguajes: 'Legendario',
  frameworks: 'Epico',
  bases: 'Raro',
  diseno: 'Artefacto',
  hobbies: 'Comun',
};

let skillMeterAnimationTimers = [];
let certificateRevealResetTimer = null;
let skillMeterStartTimer = null;
let expBarTimer = null;
let expBarReflexTimer = null;

function getAgeFromBirthdate(birthdate) {
  if (!birthdate) return null;

  const date = new Date(birthdate);
  if (Number.isNaN(date.getTime())) return null;

  const today = new Date();
  let age = today.getFullYear() - date.getFullYear();
  const monthDiff = today.getMonth() - date.getMonth();

  if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < date.getDate())) {
    age -= 1;
  }

  return Math.max(0, age);
}

function getStartOfDay(date) {
  return new Date(date.getFullYear(), date.getMonth(), date.getDate());
}

function getDayDifference(startDate, endDate) {
  const millisecondsPerDay = 24 * 60 * 60 * 1000;
  return Math.round((getStartOfDay(endDate) - getStartOfDay(startDate)) / millisecondsPerDay);
}

function getBirthdayProgress(birthdate) {
  if (!birthdate) return null;

  const birthDate = new Date(birthdate);
  if (Number.isNaN(birthDate.getTime())) return null;

  const today = getStartOfDay(new Date());
  const currentYearBirthday = new Date(today.getFullYear(), birthDate.getMonth(), birthDate.getDate());

  const lastBirthday = today >= currentYearBirthday
    ? currentYearBirthday
    : new Date(today.getFullYear() - 1, birthDate.getMonth(), birthDate.getDate());

  const nextBirthday = today >= currentYearBirthday
    ? new Date(today.getFullYear() + 1, birthDate.getMonth(), birthDate.getDate())
    : currentYearBirthday;

  const cycleLength = Math.max(1, getDayDifference(lastBirthday, nextBirthday));
  const dayPosition = Math.min(cycleLength, Math.max(1, getDayDifference(lastBirthday, today) + 1));

  return {
    cycleLength,
    dayPosition,
  };
}

function fibonacciBigInt(position) {
  let previous = 0n;
  let current = 1n;

  for (let index = 0; index < position; index += 1) {
    const next = previous + current;
    previous = current;
    current = next;
  }

  return previous;
}

function getAccumulatedFibonacciExp(position) {
  return fibonacciBigInt(position + 2) - 1n;
}

function formatBigIntCompact(value) {
  const numeric = typeof value === 'bigint' ? value : BigInt(value || 0);
  const sign = numeric < 0n ? '-' : '';
  const absolute = numeric < 0n ? -numeric : numeric;
  const digits = absolute.toString();

  if (digits.length <= 6) {
    return `${sign}${digits}`;
  }

  const mantissa = `${digits.slice(0, 1)}.${digits.slice(1, 4)}`.replace(/\.?0+$/, '');
  return `${sign}${mantissa}e${digits.length - 1}`;
}

function getFibonacciExperienceSummary(birthdate) {
  const progress = getBirthdayProgress(birthdate);
  if (!progress) return null;

  const currentExp = getAccumulatedFibonacciExp(progress.dayPosition);
  const requiredExp = getAccumulatedFibonacciExp(progress.cycleLength);
  const percentage = (progress.dayPosition / progress.cycleLength) * 100;

  return {
    currentExp,
    requiredExp,
    percentage,
    dayPosition: progress.dayPosition,
    cycleLength: progress.cycleLength,
  };
}

function renderList(container, entries, emptyText) {
  if (!container) return;

  const safeEntries = Array.isArray(entries) ? entries.filter(Boolean) : [];
  container.innerHTML = '';

  if (safeEntries.length === 0) {
    const fallback = document.createElement('li');
    fallback.textContent = emptyText;
    container.appendChild(fallback);
    return;
  }

  safeEntries.forEach((entry) => {
    const item = document.createElement('li');
    item.textContent = entry;
    container.appendChild(item);
  });
}

function renderAchievementList(container, entries, emptyText) {
  if (!container) return;

  const safeEntries = Array.isArray(entries) ? entries.filter(Boolean) : [];
  container.innerHTML = '';

  if (safeEntries.length === 0) {
    const fallback = document.createElement('li');
    fallback.textContent = emptyText;
    container.appendChild(fallback);
    return;
  }

  safeEntries.forEach((entry) => {
    const item = document.createElement('li');
    item.className = 'certificate-achievement-item';

    const icon = document.createElement('span');
    icon.className = 'certificate-achievement-icon';
    icon.textContent = '★';
    icon.setAttribute('aria-hidden', 'true');

    const text = document.createElement('span');
    text.className = 'certificate-achievement-text';
    text.textContent = entry;

    item.appendChild(icon);
    item.appendChild(text);
    container.appendChild(item);
  });
}

function renderEpithetList(container, entries, emptyText) {
  if (!container) return;

  const rarityLabelMap = {
    comun: 'Comun',
    raro: 'Raro',
    epico: 'Epico',
    legendario: 'Legendario',
  };

  const normalizeRarity = (value) => {
    const normalized = String(value || '')
      .trim()
      .toLowerCase()
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '');

    if (normalized === 'legendario' || normalized === 'epico' || normalized === 'raro' || normalized === 'comun') {
      return normalized;
    }

    return 'comun';
  };

  const getRarityForEntry = (entry, index) => {
    const rarityMap = datos.epithetRarity;

    if (Array.isArray(rarityMap) && rarityMap[index]) {
      return normalizeRarity(rarityMap[index]);
    }

    if (rarityMap && typeof rarityMap === 'object' && rarityMap[entry]) {
      return normalizeRarity(rarityMap[entry]);
    }

    // Default progression to keep a game-like spread if no explicit rarity is provided.
    if (index === 0) return 'legendario';
    if (index <= 2) return 'epico';
    if (index <= 5) return 'raro';
    return 'comun';
  };

  const normalizeEpithetKey = (value) => String(value || '')
    .trim()
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');

  const safeEntries = Array.isArray(entries) ? entries.filter(Boolean) : [];
  container.innerHTML = '';

  if (safeEntries.length === 0) {
    const fallback = document.createElement('li');
    fallback.className = 'certificate-epithet-item';
    fallback.dataset.rarity = 'comun';
    fallback.dataset.rarityLabel = rarityLabelMap.comun;
    fallback.textContent = emptyText;
    container.appendChild(fallback);
    return;
  }

  safeEntries.forEach((entry, index) => {
    const rarity = getRarityForEntry(entry, index);

    const item = document.createElement('li');
    item.className = 'certificate-epithet-item';
    item.dataset.rarity = rarity;
    item.dataset.rarityLabel = rarityLabelMap[rarity] || rarityLabelMap.comun;
    item.dataset.epithetKey = normalizeEpithetKey(entry);
    item.textContent = entry;
    container.appendChild(item);
  });
}

function normalizeSkillKey(value) {
  return String(value || '')
    .trim()
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '');
}

function getSkillIcon(skillName) {
  return SKILL_ICON_MAP[normalizeSkillKey(skillName)] || './assets/img/folder.png';
}

function clampMastery(value) {
  const numeric = Number(value);
  if (Number.isNaN(numeric)) return 0;
  return Math.max(0, Math.min(8, Math.round(numeric)));
}

function clearSkillMeterAnimationTimers() {
  skillMeterAnimationTimers.forEach((timerId) => {
    window.clearTimeout(timerId);
  });
  skillMeterAnimationTimers = [];
}

function animateExpBar() {
  const fill = document.getElementById('certificateExpFill');
  if (!fill) return;
  const target = fill.dataset.targetPercent || '0';
  fill.classList.remove('is-active');
  fill.style.width = `${target}%`;

  if (expBarReflexTimer) {
    window.clearTimeout(expBarReflexTimer);
    expBarReflexTimer = null;
  }

  expBarReflexTimer = window.setTimeout(() => {
    fill.classList.remove('is-active');
    void fill.offsetWidth;
    fill.classList.add('is-active');
    expBarReflexTimer = null;
  }, 450);
}

function animateSkillMeters(container) {
  if (!container) return;

  clearSkillMeterAnimationTimers();

  const meters = Array.from(container.querySelectorAll('.certificate-skill-meter'));
  let baseDelay = 0;

  meters.forEach((meter) => {
    const targetLevel = clampMastery(meter.dataset.targetLevel);
    const units = Array.from(meter.querySelectorAll('.certificate-skill-unit'));

    units.forEach((unit) => unit.classList.remove('is-active'));

    for (let index = 0; index < targetLevel; index += 1) {
      const timerId = window.setTimeout(() => {
        units[index]?.classList.add('is-active');
      }, baseDelay + (index * 55));

      skillMeterAnimationTimers.push(timerId);
    }

    baseDelay += 70;
  });
}

function runCertificateReveal(modal, onSkillsRootReady) {
  if (!modal) return;

  const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  const revealDuration = prefersReducedMotion ? 0 : 420;
  const stepDelay = prefersReducedMotion ? 0 : 38;

  if (certificateRevealResetTimer) {
    window.clearTimeout(certificateRevealResetTimer);
    certificateRevealResetTimer = null;
  }

  if (skillMeterStartTimer) {
    window.clearTimeout(skillMeterStartTimer);
    skillMeterStartTimer = null;
  }

  modal.classList.remove('is-opening');

  const revealSelector = [
    '.title-bar',
    '.certificate-content',
    '.certificate-profile-panel',
    '.certificate-profile-frame',
    '.certificate-profile-badge',
    '.certificate-profile-badge > *',
    '.certificate-profile-toggle',
    '.certificate-sheet',
    '.certificate-sheet-block',
    '.certificate-sheet-title',
    '.certificate-sheet-value',
    '.certificate-sheet-list > li',
  ].join(', ');

  const uniqueRevealElements = Array.from(new Set(modal.querySelectorAll(revealSelector))).sort((first, second) => {
    const firstRect = first.getBoundingClientRect();
    const secondRect = second.getBoundingClientRect();

    if (Math.abs(firstRect.top - secondRect.top) > 1) {
      return firstRect.top - secondRect.top;
    }

    if (Math.abs(firstRect.left - secondRect.left) > 1) {
      return firstRect.left - secondRect.left;
    }

    const relation = first.compareDocumentPosition(second);
    return relation & Node.DOCUMENT_POSITION_FOLLOWING ? -1 : 1;
  });

  const skillsRoot = modal.querySelector('#certificateSkillsBlock');
  let skillsRootRevealEnd = 0;

  uniqueRevealElements.forEach((element, index) => {
    const delay = index * stepDelay;
    element.classList.add('certificate-reveal');
    element.style.setProperty('--certificate-reveal-delay', `${delay}ms`);

    if (skillsRoot && (element === skillsRoot || skillsRoot.contains(element))) {
      skillsRootRevealEnd = Math.max(skillsRootRevealEnd, delay + revealDuration);
    }
  });

  window.requestAnimationFrame(() => {
    modal.classList.add('is-opening');
  });

  if (typeof onSkillsRootReady === 'function') {
    const startDelay = skillsRoot ? Math.max(0, skillsRootRevealEnd - 480) : 0;
    skillMeterStartTimer = window.setTimeout(() => {
      onSkillsRootReady();
      skillMeterStartTimer = null;
    }, startDelay);
  }

  const totalDuration = revealDuration + Math.max(0, uniqueRevealElements.length - 1) * stepDelay;
  certificateRevealResetTimer = window.setTimeout(() => {
    uniqueRevealElements.forEach((element) => {
      element.classList.remove('certificate-reveal');
      element.style.removeProperty('--certificate-reveal-delay');
    });

    modal.classList.remove('is-opening');
    certificateRevealResetTimer = null;
  }, totalDuration + 90);
}

function renderSkillList(container) {
  if (!container) return;

  const languageKey = Array.isArray(datos.skills?.programmingLanguages)
    ? 'programmingLanguages'
    : 'promgrammingLanguages';

  const groupedSkills = [
    { group: 'lenguajes', label: 'Lenguajes de Programación', items: datos.skills?.[languageKey] },
    { group: 'frameworks', label: 'Frameworks', items: datos.skills?.frameworks },
    { group: 'bases', label: 'Bases de Datos', items: datos.skills?.databases },
    { group: 'diseno', label: 'Herramientas de Diseño', items: datos.skills?.designTools },
    { group: 'hobbies', label: 'Hobbies', items: datos.skills?.hobbies },
  ];

  container.innerHTML = '';

  let hasAnySkill = false;

  groupedSkills.forEach(({ group, label, items }) => {
    const safeItems = Array.isArray(items) ? items.filter(Boolean) : [];
    if (safeItems.length === 0) return;
    hasAnySkill = true;

    const groupTitle = document.createElement('li');
    groupTitle.className = 'certificate-skill-group-title';
    groupTitle.dataset.group = group;
    groupTitle.dataset.rarity = GROUP_RARITY_LABEL[group] || 'Comun';
    groupTitle.textContent = `${label} · ${GROUP_RARITY_LABEL[group] || 'Comun'}`;
    container.appendChild(groupTitle);

    safeItems.forEach((name) => {
      const item = document.createElement('li');
      item.className = 'certificate-skill-item';
      item.dataset.group = group;

      const icon = document.createElement('img');
      icon.className = 'certificate-skill-icon';
      icon.src = getSkillIcon(name);
      icon.alt = name;
      icon.loading = 'lazy';
      icon.referrerPolicy = 'no-referrer';
      icon.onerror = () => {
        icon.src = './assets/img/folder.png';
      };

      const labelElement = document.createElement('span');
      labelElement.className = 'certificate-skill-name';
      labelElement.textContent = name;

      const meter = document.createElement('div');
      meter.className = 'certificate-skill-meter';

      const configuredMastery = datos.skillMastery?.[name];
      const level = clampMastery(configuredMastery ?? DEFAULT_GROUP_MASTERY[group] ?? 0);
      meter.dataset.targetLevel = String(level);

      for (let i = 1; i <= 8; i += 1) {
        const unit = document.createElement('span');
        unit.className = 'certificate-skill-unit';
        meter.appendChild(unit);
      }

      item.appendChild(icon);
      item.appendChild(labelElement);
      item.appendChild(meter);
      container.appendChild(item);
    });
  });

  if (!hasAnySkill) {
    const fallback = document.createElement('li');
    fallback.textContent = 'Sin skills cargadas.';
    container.appendChild(fallback);
    clearSkillMeterAnimationTimers();
    return;
  }
}

function renderCertificateData() {
  const bio = document.getElementById('certificateBio');
  const stats = document.getElementById('certificateStats');
  const skills = document.getElementById('certificateSkills');
  const achievements = document.getElementById('certificateAchievements');
  const profileName = document.getElementById('certificateProfileName');
  const profileLevel = document.getElementById('certificateProfileLevel');
  const expFill = document.getElementById('certificateExpFill');
  const expText = document.getElementById('certificateExpText');

  if (!bio || !stats || !skills || !achievements) return;

  const age = getAgeFromBirthdate(datos.birthdate);
  const level = age ?? '--';

  const role = datos.role || datos.profession || '--';
  const profession = datos.profession || '--';

  if (profileName) {
    profileName.textContent = datos.nickname || datos.name || 'Brio';
  }

  if (profileLevel) {
    profileLevel.textContent = `Nivel ${level}`;
  }

  const experienceSummary = getFibonacciExperienceSummary(datos.birthdate);
  const expPercent = experienceSummary
    ? Math.max(0, Math.min(100, experienceSummary.percentage))
    : 0;

  if (expFill) {
    expFill.style.width = '0%';
    expFill.dataset.targetPercent = String(expPercent);
  }

  if (expText) {
    expText.textContent = experienceSummary
      ? `EXP ${formatBigIntCompact(experienceSummary.currentExp)} / ${formatBigIntCompact(experienceSummary.requiredExp)}`
      : 'EXP -- / --';
  }

  const bioLines = [];
  if (datos.nickname) bioLines.push(`Apodo: ${datos.nickname}`);
  if (profession && profession !== '--') bioLines.push(profession);
  if (Array.isArray(datos.studies) && datos.studies.length > 0) {
    bioLines.push(`Estudios: ${datos.studies[0]}`);
  }
  bio.textContent = bioLines.join(' | ') || 'Pendiente de completar.';

  const roleWithoutTitle = (role || '').replace(/^Artista\s+/i, '').replace(/^["']|["']$/g, '').trim();

  const epithetEntries = Array.isArray(datos.epithets) && datos.epithets.length > 0
    ? datos.epithets
    : [
        roleWithoutTitle || role,
        'Forjador de experiencias interactivas',
        'Mentor del codigo y la logica',
      ].filter(Boolean);

  renderEpithetList(stats, epithetEntries, 'Sin epitetos cargados.');

  renderSkillList(skills);

  const achievementEntries = (Array.isArray(datos.logros) && datos.logros.length > 0)
    ? datos.logros
    : (Array.isArray(datos.certificates) ? datos.certificates : []);

  renderAchievementList(achievements, achievementEntries, 'Sin logros cargados.');
}

export function initCertificateModal() {
  const trigger = document.querySelector('.certificate-img');
  const modal = document.getElementById('certificateModal');
  const closeBtn = document.getElementById('closeCertificateModalBtn');
  const toggleBrioWorkingBtn = document.getElementById('toggleBrioWorkingBtn');

  if (!trigger || !modal || !closeBtn) return;

  const updateBrioToggleLabel = () => {
    if (!toggleBrioWorkingBtn) return;
    toggleBrioWorkingBtn.textContent = getIsBrioWorking()
      ? 'Modo Brio: Working'
      : 'Modo Brio: Idle';
  };

  const openModal = () => {
    closeInteractiveModals('certificateModal');
    hideMessage();
    renderCertificateData();
    updateBrioToggleLabel();
    modal.style.display = 'block';
    runCertificateReveal(modal, () => {
      const skills = document.getElementById('certificateSkills');
      animateSkillMeters(skills);
    });
    const expWrap = modal.querySelector('.certificate-exp-wrap');
    const revealDelayStr = expWrap?.style.getPropertyValue('--certificate-reveal-delay') || '0ms';
    const expRevealDelay = parseInt(revealDelayStr, 10) || 0;
    if (expBarTimer) window.clearTimeout(expBarTimer);
    expBarTimer = window.setTimeout(() => {
      animateExpBar();
      expBarTimer = null;
    }, expRevealDelay + 420);
  };

  const closeModal = () => {
    if (expBarTimer) {
      window.clearTimeout(expBarTimer);
      expBarTimer = null;
    }
    if (expBarReflexTimer) {
      window.clearTimeout(expBarReflexTimer);
      expBarReflexTimer = null;
    }
    const fill = document.getElementById('certificateExpFill');
    if (fill) {
      fill.style.width = '0%';
      fill.classList.remove('is-active');
    }
    if (certificateRevealResetTimer) {
      window.clearTimeout(certificateRevealResetTimer);
      certificateRevealResetTimer = null;
    }

    modal.classList.remove('is-opening');
    modal.querySelectorAll('.certificate-reveal').forEach((element) => {
      element.classList.remove('certificate-reveal');
      element.style.removeProperty('--certificate-reveal-delay');
    });

    if (skillMeterStartTimer) {
      window.clearTimeout(skillMeterStartTimer);
      skillMeterStartTimer = null;
    }

    clearSkillMeterAnimationTimers();
    modal.style.display = 'none';
  };

  trigger.addEventListener('click', openModal);
  trigger.addEventListener('keydown', (event) => {
    if (event.key !== 'Enter' && event.key !== ' ') return;
    event.preventDefault();
    openModal();
  });

  closeBtn.addEventListener('click', closeModal);

  if (toggleBrioWorkingBtn) {
    toggleBrioWorkingBtn.addEventListener('click', () => {
      toggleBrioWorking();
      updateBrioToggleLabel();
    });
  }

  modal.addEventListener('click', (event) => {
    if (event.target === modal) closeModal();
  });

  document.addEventListener('keydown', (event) => {
    if (event.key === 'Escape' && modal.style.display !== 'none') {
      closeModal();
    }
  });
}

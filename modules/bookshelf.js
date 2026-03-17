const BOOK_ICONS = [
  './assets/img/book1.svg',
  './assets/img/book2.svg',
  './assets/img/book3.svg',
  './assets/img/book4.svg',
];

const BOOKS_PER_PAGE = 60;

const BOOK_BASE_COLORS = {
  background: '#a94444',
  shadow: '#9a3838',
  front: '#d46a6a',
  light: '#ec8686',
  gold: '#e3d668',
};

const svgTemplateCache = new Map();

function hashString(value) {
  let hash = 2166136261;
  for (let i = 0; i < value.length; i += 1) {
    hash ^= value.charCodeAt(i);
    hash = Math.imul(hash, 16777619);
  }
  return hash >>> 0;
}

function mulberry32(seed) {
  let t = seed >>> 0;
  return () => {
    t += 0x6d2b79f5;
    let x = Math.imul(t ^ (t >>> 15), 1 | t);
    x ^= x + Math.imul(x ^ (x >>> 7), 61 | x);
    return ((x ^ (x >>> 14)) >>> 0) / 4294967296;
  };
}

function hslToHex(h, s, l) {
  const sat = s / 100;
  const lig = l / 100;
  const c = (1 - Math.abs(2 * lig - 1)) * sat;
  const x = c * (1 - Math.abs((h / 60) % 2 - 1));
  const m = lig - c / 2;

  let r = 0;
  let g = 0;
  let b = 0;

  if (h < 60) {
    r = c;
    g = x;
  } else if (h < 120) {
    r = x;
    g = c;
  } else if (h < 180) {
    g = c;
    b = x;
  } else if (h < 240) {
    g = x;
    b = c;
  } else if (h < 300) {
    r = x;
    b = c;
  } else {
    r = c;
    b = x;
  }

  const toHex = (value) => Math.round((value + m) * 255).toString(16).padStart(2, '0');
  return `#${toHex(r)}${toHex(g)}${toHex(b)}`;
}

function buildDeterministicBookPalette(seedKey) {
  const random = mulberry32(hashString(seedKey));
  const hue = Math.floor(random() * 360);
  const sat = 45 + Math.floor(random() * 30);
  const baseLight = 35 + Math.floor(random() * 12);

  return {
    background: hslToHex(hue, sat, baseLight),
    shadow: hslToHex(hue, sat + 5, Math.max(baseLight - 10, 15)),
    front: hslToHex(hue, Math.max(sat - 5, 35), Math.min(baseLight + 12, 80)),
    light: hslToHex(hue, Math.max(sat - 10, 30), Math.min(baseLight + 22, 92)),
    gold: hslToHex((hue + 45) % 360, 70, 62),
  };
}

async function getSvgTemplate(path) {
  if (svgTemplateCache.has(path)) {
    return svgTemplateCache.get(path);
  }

  const response = await fetch(path, { cache: 'no-store' });
  if (!response.ok) return '';

  const text = await response.text();
  svgTemplateCache.set(path, text);
  return text;
}

function replaceColor(source, from, to) {
  const pattern = new RegExp(from.replace('#', '\\#'), 'gi');
  return source.replace(pattern, to);
}

function normalizeBookSvgCanvas(svgSource) {
  // Original book SVGs are drawn inside a 400x400 canvas with large empty margins.
  // Crop to the useful area so visual and clickable area match better.
  let svg = svgSource.replace(/viewBox="[^"]+"/i, 'viewBox="95 55 110 305"');
  svg = svg.replace(/width="[^"]+"/i, 'width="110"');
  svg = svg.replace(/height="[^"]+"/i, 'height="305"');
  return svg;
}

async function buildColorizedBookSrc(path, seedKey) {
  const template = await getSvgTemplate(path);
  if (!template) return path;

  const palette = buildDeterministicBookPalette(seedKey);
  let svg = normalizeBookSvgCanvas(template);
  svg = replaceColor(svg, BOOK_BASE_COLORS.background, palette.background);
  svg = replaceColor(svg, BOOK_BASE_COLORS.shadow, palette.shadow);
  svg = replaceColor(svg, BOOK_BASE_COLORS.front, palette.front);
  svg = replaceColor(svg, BOOK_BASE_COLORS.light, palette.light);
  svg = replaceColor(svg, BOOK_BASE_COLORS.gold, palette.gold);

  const blob = new Blob([svg], { type: 'image/svg+xml' });
  return URL.createObjectURL(blob);
}

async function loadPdfManifest() {
  try {
    const response = await fetch('./assets/pdf/manifest.json', { cache: 'no-store' });
    if (!response.ok) return [];

    const data = await response.json();
    if (!Array.isArray(data)) return [];

    return data
      .filter((file) => typeof file === 'string' && file.toLowerCase().endsWith('.pdf'))
      .map((file) => `./assets/pdf/${file}`);
  } catch {
    return [];
  }
}

export async function initBookshelf() {
  const shelf = document.getElementById('bookshelfBooks');
  const modal = document.getElementById('pdfViewerModal');
  const frame = document.getElementById('pdfViewerFrame');
  const title = document.getElementById('pdfViewerTitle');
  const closeBtn = document.getElementById('closePdfViewerBtn');

  if (!shelf || !modal || !frame || !title || !closeBtn) return;

  let pdfPaths = await loadPdfManifest();
  let generatedBookUrls = [];
  let currentPage = 0;

  const pagination = document.createElement('div');
  pagination.className = 'bookshelf-pagination';
  pagination.style.display = 'none';

  const prevBtn = document.createElement('button');
  prevBtn.type = 'button';
  prevBtn.className = 'bookshelf-page-btn';
  prevBtn.textContent = '<';

  const pageLabel = document.createElement('span');
  pageLabel.className = 'bookshelf-page-label';

  const nextBtn = document.createElement('button');
  nextBtn.type = 'button';
  nextBtn.className = 'bookshelf-page-btn';
  nextBtn.textContent = '>';

  pagination.appendChild(prevBtn);
  pagination.appendChild(pageLabel);
  pagination.appendChild(nextBtn);
  shelf.insertAdjacentElement('afterend', pagination);

  function openPdf(path) {
    frame.src = path;
    title.textContent = path.split('/').pop() || 'Documento';
    modal.style.display = 'flex';
  }

  function closePdf() {
    modal.style.display = 'none';
    frame.src = '';
  }

  function updatePagination(paths) {
    const totalPages = Math.ceil(paths.length / BOOKS_PER_PAGE);

    if (totalPages <= 1) {
      pagination.style.display = 'none';
      return;
    }

    pagination.style.display = 'flex';
    pageLabel.textContent = `Lista ${currentPage + 1}/${totalPages}`;
    prevBtn.disabled = currentPage === 0;
    nextBtn.disabled = currentPage >= totalPages - 1;
  }

  async function renderBooks(paths) {
    generatedBookUrls.forEach((url) => URL.revokeObjectURL(url));
    generatedBookUrls = [];

    shelf.innerHTML = '';
    if (!Array.isArray(paths) || paths.length === 0) return;

    const totalPages = Math.ceil(paths.length / BOOKS_PER_PAGE);
    if (currentPage >= totalPages) {
      currentPage = Math.max(totalPages - 1, 0);
    }

    const start = currentPage * BOOKS_PER_PAGE;
    const end = start + BOOKS_PER_PAGE;
    const pageItems = paths.slice(start, end);

    for (let index = 0; index < pageItems.length; index += 1) {
      const pdfPath = pageItems[index];
      const absoluteIndex = start + index;
      const btn = document.createElement('button');
      btn.type = 'button';
      btn.className = 'shelf-book';
      btn.title = pdfPath.split('/').pop() || `Libro ${absoluteIndex + 1}`;

      const img = document.createElement('img');
      const sourceIcon = BOOK_ICONS[absoluteIndex % BOOK_ICONS.length];
      const colorizedSrc = await buildColorizedBookSrc(sourceIcon, `${sourceIcon}|${pdfPath}`);
      img.src = colorizedSrc;
      if (colorizedSrc.startsWith('blob:')) {
        generatedBookUrls.push(colorizedSrc);
      }
      img.alt = `Libro ${absoluteIndex + 1}`;

      btn.appendChild(img);
      btn.addEventListener('click', () => openPdf(pdfPath));
      shelf.appendChild(btn);
    }

    updatePagination(paths);
  }

  prevBtn.addEventListener('click', async () => {
    if (currentPage === 0) return;
    currentPage -= 1;
    await renderBooks(pdfPaths);
  });

  nextBtn.addEventListener('click', async () => {
    const totalPages = Math.ceil(pdfPaths.length / BOOKS_PER_PAGE);
    if (currentPage >= totalPages - 1) return;
    currentPage += 1;
    await renderBooks(pdfPaths);
  });

  closeBtn.addEventListener('click', closePdf);
  modal.addEventListener('click', (event) => {
    if (event.target === modal) closePdf();
  });

  document.addEventListener('keydown', (event) => {
    if (event.key === 'Escape' && modal.style.display === 'flex') {
      closePdf();
    }
  });

  await renderBooks(pdfPaths);

  // Utility for hot-reload from console if needed.
  window.setBookshelfPdfs = (files) => {
    if (!Array.isArray(files)) return;
    pdfPaths = files.filter((file) => typeof file === 'string' && file.toLowerCase().endsWith('.pdf'));
    currentPage = 0;
    renderBooks(pdfPaths);
  };
}

const C = window.WISH_CONFIG || { sheetSources: {} };
const fallback = {
  Allan: [
    ['SHAPING NEW TOMORROW Ease overshirt', 899, 'Shaping New Tomorrow', '', 'Tøj', 'Dark Grey · Str. M', ''],
    ['SAYSKY Reflective Pace Vest', 749, 'SAYSKY', '', 'Løb/Outdoor', 'Str. M', ''],
    ['ORAL-B IO6S elite tandenbørste', 999, 'Proshop', '', 'Elektronik', 'Sort', ''],
    ['Milwaukee multiværktøj M18 BMT-0', 1035, '10-4', '', 'Tøj', 'Sort', ''],
    ['Lego-dukke', 200, 'Lego', '', 'Lego', 'Str. M', '']
  ],
  Anne: [
    ['Fusion Womens MERINO 150 LS', 0, 'Fusion', '', 'Tøj, sko og tilbehør', 'Sort · Str. L', ''],
    ['Saucony Dame Guide løbesko', 0, 'Saucony', '', 'Tøj, sko og tilbehør', 'Str. 40,5', ''],
    ['Celler dele os', 0, 'Unipress', '', 'Bøger', 'Af Lotte Bjerg', ''],
    ['Yoga-retreat', 0, 'CathrineYoga / Britt Zives', '', 'Godt & blandet', '', '']
  ],
  Lukas: [
    ['PlayStation Store voucher', 200, 'PlayStation Store', '', 'Spil', '', ''],
    ['Zara - Blue Temptation', 259, 'Zara', '', 'Duft', '', ''],
    ['Calvin Klein underbukser (3-pack)', 265, 'Salling', '', 'Tøj', 'Str. M', ''],
    ['Spjell - LILLJETRÆ', 99, 'IKEA', '', 'Møbler', 'Sort', '']
  ],
  Daniel: [
    ['Penge til gamerudstyr', 100, '', '', 'Penge', '100 kr. og opefter', ''],
    ['10373 - LEGO BOTANICALS - Mini-bonsaitrær', 379, 'Proshop', '', 'LEGO', '', ''],
    ['31218 - LEGO ART - Japansk landskab med kirsebærblomster', 999, 'LEGO.com', '', 'LEGO', '', ''],
    ['Bleach box set 1 (vol. 1-21)', 1295, 'Fararos', '', 'Divers', '', '']
  ]
};

const persons = ['Allan', 'Anne', 'Lukas', 'Daniel'];
let person = 'Allan';
let category = 'Alle';
let sortMode = 'default';
const datasets = { ...fallback };
const SHEET_CACHE_KEY = 'onskelister-sheet-cache-v1';
const UPDATED_CACHE_KEY = 'onskelister-sheet-updated-v1';
const $ = (id) => document.getElementById(id);
let refreshInProgress = false;
let pollTimer = null;
let refreshButton = null;

function loadLocalCache(key) {
  try {
    const parsed = JSON.parse(localStorage.getItem(key) || '{}');
    return parsed && typeof parsed === 'object' && !Array.isArray(parsed) ? parsed : {};
  } catch (error) {
    console.warn('Kunne ikke læse lokal cache:', error);
    return {};
  }
}

function saveLocalCache(key, value) {
  try {
    localStorage.setItem(key, JSON.stringify(value));
  } catch (error) {
    console.warn('Kunne ikke gemme lokal cache:', error);
  }
}

const sheetCache = loadLocalCache(SHEET_CACHE_KEY);
const updated = loadLocalCache(UPDATED_CACHE_KEY);
const loadErrors = {};

for (const p of persons) {
  if (Array.isArray(sheetCache[p])) datasets[p] = sheetCache[p];
}

function parseCSV(text) {
  const rows = [];
  let row = [];
  let cell = '';
  let inQuotes = false;

  for (let i = 0; i < text.length; i++) {
    const c = text[i];
    const next = text[i + 1];

    if (c === '"' && inQuotes && next === '"') {
      cell += '"';
      i++;
    } else if (c === '"') {
      inQuotes = !inQuotes;
    } else if (c === ',' && !inQuotes) {
      row.push(cell);
      cell = '';
    } else if ((c === '\n' || c === '\r') && !inQuotes) {
      if (c === '\r' && next === '\n') i++;
      row.push(cell);
      if (row.some(v => v !== '')) rows.push(row);
      row = [];
      cell = '';
    } else {
      cell += c;
    }
  }

  if (cell || row.length) {
    row.push(cell);
    if (row.some(v => v !== '')) rows.push(row);
  }

  return rows.length ? rows.slice(1) : [];
}

function parsePrice(value) {
  if (value === null || value === undefined || value === '') return 0;

  const cleaned = String(value)
    .replace(/[^0-9,.-]/g, '')
    .replace(/\./g, '')
    .replace(',', '.');

  const n = Number(cleaned);
  return Number.isFinite(n) ? n : 0;
}

function isActiveWish(wish) {
  if (!Array.isArray(wish)) return true;
  if (wish.length <= 10) return true;

  const activeValue = String(wish[9] ?? '').trim().toLowerCase();
  if (!activeValue) return true;

  const inactiveValues = ['nej', 'no', 'false', '0', 'nein', 'inaktiv', 'disabled', 'deaktiv', 'not active', 'ikke aktiv'];
  return !inactiveValues.includes(activeValue);
}

function getWishData(wish) {
  if (!Array.isArray(wish)) {
    return { title: '', price: 0, store: '', category: '', note: '', link: '' };
  }

  if (wish.length <= 7) {
    return {
      title: String(wish[0] || ''),
      price: parsePrice(wish[1]),
      store: String(wish[2] || ''),
      category: String(wish[4] || ''),
      note: String(wish[5] || ''),
      link: String(wish[6] || '')
    };
  }

  // Google Sheets column layout: A=id, B=navn, C=pris, D=butik, E=prioritet, F=kategori, G=ikon, H=link, I=billede_url, J=aktiv, K=note
  return {
    title: String(wish[1] || ''),
    price: String(wish[2] ?? '').trim() === '' ? null : parsePrice(wish[2]),
    store: String(wish[3] || ''),
    category: String(wish[5] || ''),
    note: String(wish[10] || ''),
    link: String(wish[7] || '')
  };
}

function stringifyData(data) {
  return JSON.stringify(data || []);
}

function setupRefreshButton() {
  const updatedLabel = $('updated');
  if (!updatedLabel || refreshButton) return;

  const style = document.createElement('style');
  style.textContent = `
    .refresh-button {
      margin-right: 4px;
      padding: 2px 4px;
      border: 0;
      border-radius: 3px;
      background: transparent;
      color: var(--muted, #747c76);
      font: inherit;
      font-size: .9em;
      opacity: .7;
      cursor: pointer;
      vertical-align: baseline;
    }
    .refresh-button:hover:not(:disabled) {
      color: var(--green, #315c48);
      opacity: 1;
    }
    .refresh-button:focus-visible {
      outline: 2px solid var(--green, #315c48);
      outline-offset: 2px;
    }
    .refresh-button:disabled {
      cursor: wait;
      opacity: .55;
    }
  `;
  document.head.appendChild(style);

  refreshButton = document.createElement('button');
  refreshButton.type = 'button';
  refreshButton.className = 'refresh-button';
  refreshButton.textContent = '↻';
  refreshButton.setAttribute('aria-label', 'Hent nyeste data');
  refreshButton.title = 'Hent nyeste data';
  refreshButton.addEventListener('click', () => loadSheets(true));
  updatedLabel.insertAdjacentElement('beforebegin', refreshButton);
}

function startPolling() {
  if (pollTimer) return;
  pollTimer = setInterval(() => loadSheets(), 30000);
}

async function loadSheets(force = false) {
  if (refreshInProgress) return;
  refreshInProgress = true;
  if (refreshButton) {
    refreshButton.disabled = true;
    refreshButton.textContent = '…';
    refreshButton.setAttribute('aria-label', 'Henter nyeste data');
  }

  let changed = false;
  let statusChanged = false;

  try {
    await Promise.all(persons.map(async (p) => {
      const url = C.sheetSources?.[p];
      if (!url) return;

      try {
        const r = await fetch(url, { cache: 'no-store' });
        if (!r.ok) throw new Error('HTTP ' + r.status);

        const text = await r.text();
        const parsed = parseCSV(text.replace(/^\uFEFF/, ''));
        const next = parsed.filter(row => row && row.some(v => String(v || '').trim() !== '') && isActiveWish(row));
        const previousSerialized = stringifyData(sheetCache[p]);
        const nextSerialized = stringifyData(next);

        // Timestamp changes only when the sheet's exported data changes, not on each poll.
        if (previousSerialized !== nextSerialized) {
          datasets[p] = next;
          sheetCache[p] = next;
          updated[p] = new Date().toISOString();
          saveLocalCache(SHEET_CACHE_KEY, sheetCache);
          saveLocalCache(UPDATED_CACHE_KEY, updated);
          changed = true;
        }

        if (loadErrors[p]) {
          delete loadErrors[p];
          statusChanged = true;
        }
      } catch (e) {
        console.warn('Kunne ikke hente ' + p + 's Google Sheet:', e);
        if (!loadErrors[p]) statusChanged = true;
        loadErrors[p] = true;
      }
    }));
  } finally {
    refreshInProgress = false;
    if (refreshButton) {
      refreshButton.disabled = false;
      refreshButton.textContent = '↻';
      refreshButton.setAttribute('aria-label', 'Hent nyeste data');
    }
  }

  if (changed || statusChanged || force) render();
}

function people() {
  const n = $('people');
  n.innerHTML = '';
  persons.forEach((p) => {
    const b = document.createElement('button');
    b.type = 'button';
    b.textContent = p;
    b.className = p === person ? 'active' : '';
    b.onclick = () => {
      person = p;
      category = 'Alle';
      render();
    };
    n.appendChild(b);
  });
}

function render() {
  people();
  const timestamp = updated[person] ? new Date(updated[person]) : null;
  const formattedTimestamp = timestamp && !Number.isNaN(timestamp.getTime())
    ? timestamp.toLocaleString('da-DK', { dateStyle: 'short', timeStyle: 'short' })
    : null;

  $('title').textContent = person;
  $('updated').textContent = formattedTimestamp
    ? 'Opdateret sidst ' + formattedTimestamp
    : (loadErrors[person]
      ? 'Kunne ikke hente data fra Google Sheet'
      : (C.sheetSources?.[person]
        ? (Array.isArray(sheetCache[person]) ? 'Opdateret sidst: ukendt' : 'Henter data fra Google Sheet...')
        : 'Viser fallback-data'));

  const data = (datasets[person] || []).filter(item => isActiveWish(item));
  const cats = ['Alle', ...new Set(data.map(item => getWishData(item).category).filter(Boolean))];

  const filters = $('filters');
  filters.innerHTML = '';
  cats.forEach((c) => {
    const b = document.createElement('button');
    b.type = 'button';
    b.className = c === category ? 'active' : '';
    b.textContent = c === 'Alle' ? 'Alle' : c;
    b.onclick = () => {
      category = c;
      render();
    };
    filters.appendChild(b);
  });

  let list = category === 'Alle' ? data : data.filter(item => getWishData(item).category === category);

  if (sortMode === 'az') {
    list = [...list].sort((a, b) => (getWishData(a).title || '').localeCompare(getWishData(b).title || '', 'da'));
  } else if (sortMode === 'za') {
    list = [...list].sort((a, b) => (getWishData(b).title || '').localeCompare(getWishData(a).title || '', 'da'));
  } else if (sortMode === 'priceAsc') {
    list = [...list].sort((a, b) => (getWishData(a).price || 0) - (getWishData(b).price || 0));
  } else if (sortMode === 'priceDesc') {
    list = [...list].sort((a, b) => (getWishData(b).price || 0) - (getWishData(a).price || 0));
  }

  $('categoryTitle').textContent = category === 'Alle' ? 'Alle ønsker' : category;
  $('count').textContent = list.length + ' ønsker';

  const grid = $('grid');
  grid.innerHTML = '';

  if (!list.length) {
    grid.innerHTML = '<div class="empty">Ingen ønsker i denne kategori.</div>';
    return;
  }

  list.forEach((wish) => {
    const card = document.createElement('article');
    card.className = 'card';
    const { title, store, price, note, link } = getWishData(wish);
    const priceMarkup = price === null
      ? ''
      : `<div class="price">${price ? price.toLocaleString('da-DK') + ' kr.' : 'Pris ukendt'}</div>`;

    card.innerHTML = `
      <div class="card-main">
        <h3>${title}</h3>
        <p class="note">${note || ''}</p>
        <p class="store">${store || ''}</p>
        ${priceMarkup}
      </div>
      ${link ? '<button type="button" class="open" data-link="' + link + '">Vis detaljer</button>' : ''}
    `;

    const openBtn = card.querySelector('.open');
    if (openBtn) {
      openBtn.onclick = () => window.open(openBtn.dataset.link, '_blank', 'noopener,noreferrer');
    }

    grid.appendChild(card);
  });
}

$('sortSelect').addEventListener('change', (e) => {
  sortMode = e.target.value;
  render();
});

setupRefreshButton();
render();
loadSheets(true);
startPolling();

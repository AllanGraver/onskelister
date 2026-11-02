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
const updated = {};
const $ = (id) => document.getElementById(id);
let refreshInProgress = false;
let pollTimer = null;

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

function getWishData(wish) {
  if (!Array.isArray(wish)) {
    return { title: '', price: 0, store: '', category: '', link: '' };
  }

  const legacyFormat =
    Array.isArray(wish) &&
    wish.length >= 6 &&
    !Number.isNaN(Number(wish[0])) &&
    Number.isNaN(Number(wish[1]));

  if (legacyFormat) {
    return {
      title: String(wish[0] || ''),
      price: parsePrice(wish[1]),
      store: String(wish[2] || ''),
      category: String(wish[3] || ''),
      link: String(wish[5] || '')
    };
  }

  // Google Sheets layout:
  // A=id, B=navn, C=pris, D=butik, E=prioritet, F=kategori, G=ikon, H=link, I=billede_url, J=aktiv, K=note
  return {
    title: String(wish[1] || ''),
    price: parsePrice(wish[2]),
    store: String(wish[3] || ''),
    category: String(wish[5] || ''),
    link: String(wish[7] || '')
  };
}

function stringifyData(data) {
  return JSON.stringify(data || []);
}

function startPolling() {
  if (pollTimer) return;
  pollTimer = setInterval(() => loadSheets(), 30000);
}

async function loadSheets(force = false) {
  if (refreshInProgress && !force) return;
  refreshInProgress = true;

  let changed = false;

  try {
    await Promise.all(persons.map(async (p) => {
      const url = C.sheetSources?.[p];
      if (!url) return;

      try {
        const r = await fetch(url, { cache: 'no-store' });
        if (!r.ok) throw new Error('HTTP ' + r.status);

        const text = await r.text();
        const parsed = parseCSV(text.replace(/^\uFEFF/, ''));
        const next = parsed.filter(row => row && row.some(v => String(v || '').trim() !== ''));
        const previous = stringifyData(datasets[p]);
        const nextSerialized = stringifyData(next);

        if (previous !== nextSerialized) {
          datasets[p] = next;
          updated[p] = new Date().toLocaleString('da-DK', {
            dateStyle: 'short',
            timeStyle: 'short'
          });
          changed = true;
        }
      } catch (e) {
        console.warn('Kunne ikke hente ' + p + 's Google Sheet:', e);
      }
    }));
  } finally {
    refreshInProgress = false;
  }

  if (changed || force) render();
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
  $('title').textContent = person;
  $('updated').textContent = updated[person]
    ? 'Ønskeliste hentet ' + updated[person]
    : (C.sheetSources?.[person] ? 'Henter data fra Google Sheet...' : 'Viser fallback-data');

  const data = datasets[person] || [];
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
    const { title, store, price, category: categoryName, link } = getWishData(wish);

    card.innerHTML = `
      <h3>${title}</h3>
      <p class="note">${store}</p>
      <div class="bottom">
        <div class="price">${price ? price.toLocaleString('da-DK') + ' kr.' : 'Pris ukendt'}</div>
        <div class="priority medium">${categoryName || 'Ukendt'}</div>
      </div>
      ${link ? '<button type="button" class="open" data-link="' + link + '">Se ønskeliste</button>' : ''}
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

render();
loadSheets(true);
startPolling();

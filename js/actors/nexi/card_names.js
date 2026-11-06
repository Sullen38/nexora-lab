/* ============================================================================
 * actors/nexi/card_names.js — НАЗВИ СКІНА Й РЕЛІКВІЇ НА КАРТЦІ NEXI, КОЖНА У СВОЄМУ СТИЛІ (NX.cardNames)
 * ----------------------------------------------------------------------------
 * Власник (06.11): «на картці — назва скіна й назва реліквії, кожна зі своїм дизайном напису (цукерка — цукерковий, молот —
 * громовий тощо), дві назви поєднані: напр. CANDY + THUNDER HAMMER; назви — лише англійською (виняток із правила 4 мов);
 * ефекти й решта частин назву не змінюють — лише скін і реліквія; дизайн назви — підходящий по стилю до самого скіна й до
 * самої реліквії; з картки назви можна прибрати за бажанням». Без чужих торгових марок (docs/BRAND.md) — назви свої.
 *   NAMES  — назва (англ.) і стиль напису: готові скіни (skin), кольорові теми (theme — назва скіна для свого поєднання, що не
 *            збігається з готовим), реліквії (relic)
 *   STYLES — як малюється напис: g — перелив зверху вниз (3 кольори, дизеринг), o — контур, fx — живе оздоблення (кратне
 *            циклу картки 4 с — без шва: цукерки-посипка, блискавки, лазерний скан, золотий блиск, лід, хвиля, зорі, полум'я…)
 *   names(look) -> { skin: {t, st}, relic: {t, st} | null } — що писати на картці для образу
 *   draw(x, text, px, py, style, u, scale) -> ширина; width(text) — ширина у пікселях арту (шрифт 4×7, I — 3, M/W — 5)
 * Малюється в піксель-арті картки (nft_card.js, 96×128) — без випадковості: кадр залежить лише від тексту й фази u.
 * ========================================================================== */
NX.cardNames = (() => {
  const NAMES = {
    skin: { classic: ['CLASSIC', 'classic'], neon: ['NEON', 'neon'], forest: ['FORESTER', 'leaf'], winter: ['WINTER', 'ice'], gamer: ['GAMER', 'pixel'], techno: ['TECHNO', 'tech'],
      candy: ['CANDY', 'candy'], astro: ['ASTRONAUT', 'astro'], captain: ['CAPTAIN', 'dark'], samurai: ['SAMURAI', 'blade'], cyber: ['CYBER', 'tech'], pumpkin: ['PUMPKIN', 'pumpkin'],
      frost: ['FROST', 'ice'], royal: ['ROYAL', 'gold'], lava: ['LAVA', 'fire'], cosmos: ['COSMOS', 'star'], rainbow: ['RAINBOW', 'rainbow'] },
    theme: { standard: ['CUSTOM', 'classic'], techno: ['TECHNO', 'tech'], neon: ['NEON', 'neon'], camo: ['CAMO', 'camo'], gamer: ['GAMER', 'pixel'], space: ['SPACE', 'star'],
      desert: ['DESERT', 'sand'], forest: ['FOREST', 'leaf'], winter: ['WINTER', 'ice'], fire: ['FIRE', 'fire'], water: ['WATER', 'sea'], gold: ['GOLD', 'gold'], evil: ['EVIL', 'evil'],
      shadow: ['SHADOW', 'dark'], rainbow: ['RAINBOW', 'rainbow'], military: ['MILITARY', 'camo'], premium: ['PREMIUM', 'gold'], samurai: ['SAMURAI', 'blade'], astro: ['ASTRO', 'astro'],
      candy: ['CANDY', 'candy'], pumpkin: ['PUMPKIN', 'pumpkin'], cyber: ['CYBER', 'tech'], royal: ['ROYAL', 'gold'], frost: ['FROST', 'ice'], lava: ['LAVA', 'fire'] },
    relic: { hammer: ['THUNDER HAMMER', 'bolt'], blade: ['LASER SWORD', 'laser'], gauntlet: ['GOLDEN GAUNTLET', 'gold'], excalibur: ['EXCALIBUR', 'steel'], staff: ['CRYSTAL STAFF', 'ice'],
      trident: ['SEA TRIDENT', 'sea'], wand: ['STAR WAND', 'star'], balloon: ['BALLOON', 'balloon'], torch: ['TORCH', 'fire'], magnet: ['MAGNET', 'magnet'], shield: ['NEXI SHIELD', 'tech'],
      sword: ['SWORD', 'steel'] },
  };
  // стилі: g — перелив (верх, середина, низ), o — контур, fx — оздоблення
  const STYLES = {
    classic: { g: ['#ffffff', '#cfefff', '#7af4ff'], o: '#123a6a', fx: 'none' },
    neon: { g: ['#ffd0f8', '#ff6ae8', '#ff2ad0'], o: '#4a1050', fx: 'neon' },
    leaf: { g: ['#c8ff8a', '#5fae3a', '#2d6a2a'], o: '#1a3a12', fx: 'leaf' },
    ice: { g: ['#ffffff', '#cfefff', '#6ac4ff'], o: '#2a5a9a', fx: 'ice' },
    pixel: { g: ['#ffe14d', '#ff6a5a', '#6a5cff'], o: '#2a1040', fx: 'pixel' },
    tech: { g: ['#c8fff0', '#3bff8a', '#17a860'], o: '#0a3a28', fx: 'scan' },
    candy: { g: ['#ffffff', '#ffb0e8', '#ff6ad8'], o: '#a8488a', fx: 'candy' },
    astro: { g: ['#ffffff', '#e8ecff', '#ff8a2a'], o: '#3a3f6a', fx: 'orbit' },
    dark: { g: ['#c8a0ff', '#6a4aa8', '#2a1850'], o: '#ffd45a', fx: 'none' },
    blade: { g: ['#ffd0a0', '#ff5a5a', '#a81a2a'], o: '#ffc94d', fx: 'slash' },
    pumpkin: { g: ['#3f8a2a', '#ffb04a', '#e06a1a'], o: '#4a2a0a', fx: 'none' },
    gold: { g: ['#fff6c0', '#ffd45a', '#c07a1a'], o: '#5a3a08', fx: 'shine' },
    fire: { g: ['#fff2a0', '#ff9a2a', '#c0301a'], o: '#4a0e08', fx: 'fire' },
    star: { g: ['#ffffff', '#c8a0ff', '#6a4aff'], o: '#1a1050', fx: 'stars' },
    rainbow: { g: ['#ffffff', '#ffffff', '#ffffff'], o: '#2a2050', fx: 'rainbow' },
    camo: { g: ['#b8c080', '#7f9a5a', '#4a5a2a'], o: '#1a2010', fx: 'camo' },
    sand: { g: ['#fff0b0', '#e0b878', '#a86a2a'], o: '#4a2a10', fx: 'none' },
    sea: { g: ['#cffaff', '#4ac0ff', '#1a4ad0'], o: '#0a2060', fx: 'wave' },
    evil: { g: ['#ff8a9a', '#ff2a4a', '#6a0a2a'], o: '#2a0a40', fx: 'none' },
    bolt: { g: ['#ffffff', '#9af6ff', '#3bb8ff'], o: '#10306a', fx: 'bolt' },
    laser: { g: ['#fff0f0', '#ff6a5a', '#d01a2a'], o: '#5a0a10', fx: 'laser' },
    steel: { g: ['#ffffff', '#c8d4e8', '#6a7a9a'], o: '#1a2a5a', fx: 'glint' },
    balloon: { g: ['#ffffff', '#ff8aa8', '#ff4a6a'], o: '#5a1a30', fx: 'balloon' },
    magnet: { g: ['#ff8a8a', '#ffffff', '#6a8aff'], o: '#1a1a4a', fx: 'magnet' },
  };
  // шрифт 4×7 (I — 3, M / W — 5): латиниця, цифри, знаки
  const F = {
    A: ['.XX.', 'X..X', 'X..X', 'XXXX', 'X..X', 'X..X', 'X..X'], B: ['XXX.', 'X..X', 'X..X', 'XXX.', 'X..X', 'X..X', 'XXX.'], C: ['.XXX', 'X...', 'X...', 'X...', 'X...', 'X...', '.XXX'],
    D: ['XXX.', 'X..X', 'X..X', 'X..X', 'X..X', 'X..X', 'XXX.'], E: ['XXXX', 'X...', 'X...', 'XXX.', 'X...', 'X...', 'XXXX'], F: ['XXXX', 'X...', 'X...', 'XXX.', 'X...', 'X...', 'X...'],
    G: ['.XXX', 'X...', 'X...', 'X.XX', 'X..X', 'X..X', '.XXX'], H: ['X..X', 'X..X', 'X..X', 'XXXX', 'X..X', 'X..X', 'X..X'], I: ['XXX', '.X.', '.X.', '.X.', '.X.', '.X.', 'XXX'],
    J: ['...X', '...X', '...X', '...X', '...X', 'X..X', '.XX.'], K: ['X..X', 'X.X.', 'XX..', 'X...', 'XX..', 'X.X.', 'X..X'], L: ['X...', 'X...', 'X...', 'X...', 'X...', 'X...', 'XXXX'],
    M: ['X...X', 'XX.XX', 'X.X.X', 'X.X.X', 'X...X', 'X...X', 'X...X'], N: ['X..X', 'XX.X', 'XX.X', 'X.XX', 'X.XX', 'X..X', 'X..X'], O: ['.XX.', 'X..X', 'X..X', 'X..X', 'X..X', 'X..X', '.XX.'],
    P: ['XXX.', 'X..X', 'X..X', 'XXX.', 'X...', 'X...', 'X...'], Q: ['.XX.', 'X..X', 'X..X', 'X..X', 'X.XX', 'X..X', '.XXX'], R: ['XXX.', 'X..X', 'X..X', 'XXX.', 'XX..', 'X.X.', 'X..X'],
    S: ['.XXX', 'X...', 'X...', '.XX.', '...X', '...X', 'XXX.'], T: ['XXXX', '.X..', '.X..', '.X..', '.X..', '.X..', '.X..'], U: ['X..X', 'X..X', 'X..X', 'X..X', 'X..X', 'X..X', '.XX.'],
    V: ['X..X', 'X..X', 'X..X', 'X..X', 'X..X', '.XX.', '.XX.'], W: ['X...X', 'X...X', 'X...X', 'X.X.X', 'X.X.X', 'XX.XX', 'X...X'], X: ['X..X', 'X..X', '.XX.', '.XX.', '.XX.', 'X..X', 'X..X'],
    Y: ['X..X', 'X..X', 'X..X', '.XX.', '.X..', '.X..', '.X..'], Z: ['XXXX', '...X', '..X.', '.XX.', '.X..', 'X...', 'XXXX'],
    '0': ['.XX.', 'X..X', 'X.XX', 'XX.X', 'X..X', 'X..X', '.XX.'], '1': ['.X..', 'XX..', '.X..', '.X..', '.X..', '.X..', 'XXX.'], '2': ['.XX.', 'X..X', '...X', '..X.', '.X..', 'X...', 'XXXX'],
    '3': ['XXX.', '...X', '...X', '.XX.', '...X', '...X', 'XXX.'], '4': ['X..X', 'X..X', 'X..X', 'XXXX', '...X', '...X', '...X'], '5': ['XXXX', 'X...', 'XXX.', '...X', '...X', 'X..X', '.XX.'],
    '6': ['.XX.', 'X...', 'XXX.', 'X..X', 'X..X', 'X..X', '.XX.'], '7': ['XXXX', '...X', '..X.', '..X.', '.X..', '.X..', '.X..'], '8': ['.XX.', 'X..X', 'X..X', '.XX.', 'X..X', 'X..X', '.XX.'],
    '9': ['.XX.', 'X..X', 'X..X', '.XXX', '...X', '...X', '.XX.'], ' ': ['..', '..', '..', '..', '..', '..', '..'], '+': ['...', '.X.', '.X.', 'XXX', '.X.', '.X.', '...'],
    '-': ['...', '...', '...', 'XXX', '...', '...', '...'], "'": ['X', 'X', '.', '.', '.', '.', '.'], '#': ['.X.X.', 'XXXXX', '.X.X.', '.X.X.', '.X.X.', 'XXXXX', '.X.X.'],
  };
  const gf = ch => F[ch] || F[String(ch).toUpperCase()] || F[' '];
  const width = s => [...s].reduce((w, ch) => w + gf(ch)[0].length + 1, -1);
  const BAY = [0, 8, 2, 10, 12, 4, 14, 6, 3, 11, 1, 9, 15, 7, 13, 5];
  const rgb = h => [1, 3, 5].map(i => parseInt(h.slice(i, i + 2), 16));
  const mix = (a, b, k) => a.map((v, i) => Math.round(v + (b[i] - v) * k));
  const css = a => `rgb(${a[0]},${a[1]},${a[2]})`;
  const hsv = (h, s, v) => { const i = Math.floor(h * 6), f = h * 6 - i, p = v * (1 - s), q = v * (1 - f * s), t = v * (1 - (1 - f) * s), m = [[v, t, p], [q, v, p], [p, v, t], [p, q, v], [t, p, v], [v, p, q]][i % 6]; return m.map(c => Math.round(c * 255)); };
  const hash = (a, b) => { let h = (a * 374761393 + b * 668265263) >>> 0; h = Math.imul(h ^ (h >>> 13), 1274126177) >>> 0; return ((h ^ (h >>> 16)) >>> 0) / 4294967296; };
  const TAU = Math.PI * 2, wave = (u, n, ph = 0) => .5 + .5 * Math.sin(TAU * (u * n + ph));

  /** Перелив рядка j (0..6) по трьох кольорах з дизерингом Байєра. */
  function grad(st, i, j) {
    const G = st.G || (st.G = st.g.map(rgb)), f = Math.min(1.999, j / 6 * 2), b = Math.floor(f), k = (f - b);
    return (k * 16 > BAY[(j & 3) * 4 + (i & 3)]) ? G[Math.min(2, b + 1)] : G[b];
  }

  /** Напис text у стилі style (ключ STYLES) у точці (px, py) у пікселях арту; u — фаза циклу 0..1. Повертає ширину. */
  function draw(x, text, px, py, styleId, u) {
    const st = STYLES[styleId] || STYLES.classic, w = width(text), fx = st.fx, cells = [];
    // 1) клітинки напису (локальні координати)
    let cx = 0; for (const ch of text) { const g = gf(ch); g.forEach((row, j) => { for (let i = 0; i < row.length; i++) if (row[i] === 'X') cells.push([cx + i, j]); }); cx += g[0].length + 1; }
    const on = new Set(cells.map(([i, j]) => i + ',' + j)), has = (i, j) => on.has(i + ',' + j);
    // літери на хвилі / кульки погойдуються — зсув стовпчика (разом із контуром)
    const lift = i => fx === 'wave' ? Math.round(Math.sin(TAU * (u * 2 + i / 30))) : fx === 'balloon' ? Math.round(Math.sin(TAU * (u + i / 36)) * 1.2) : 0;
    const dot = (X, Y, col) => { x.fillStyle = col; x.fillRect(Math.round(X), Math.round(Y), 1, 1); };
    // 2) оздоблення ПІД літерами: полум'я над вогняним написом, сяйво неону й лазера
    if (fx === 'fire') for (let k = 0; k < w; k += 2) { const h = wave(u, 4, k * .17) * 2.5; for (let q = 1; q <= h; q++) dot(px + k + (q & 1), py - q, q > 1.6 ? '#ff6a1a' : '#ffe27a'); }
    if (fx === 'laser') { x.fillStyle = 'rgba(255,60,60,.35)'; x.fillRect(px - 2, py + 2, w + 4, 3); }                 // червоне сяйво по осі
    if (fx === 'neon') { x.fillStyle = 'rgba(255,80,220,.18)'; x.fillRect(px - 2, py - 2, w + 4, 11); }
    // 3) контур (навколо кожної клітинки — 8 сусідів)
    x.fillStyle = st.o; cells.forEach(([i, j]) => { const l = lift(i); for (let di = -1; di <= 1; di++) for (let dj = -1; dj <= 1; dj++) if ((di || dj) && !has(i + di, j + dj)) x.fillRect(px + i + di, py + j + dj - l, 1, 1); });
    // 4) заливка з переливом + оздоблення по клітинках
    const sweep = ((u * 2) % 1) * (w + 14) - 7;                                                              // діагональний блиск (двічі за цикл)
    cells.forEach(([i, j]) => {
      let c = grad(st, i, j);
      if (fx === 'candy') { if (((i + j) >> 1) & 1) c = mix(c, [255, 255, 255], .75); }                      // цукеркові смужки по діагоналі
      else if (fx === 'rainbow') c = hsv(((i / w) - u + 2) % 1, .75, 1 - j * .05);                             // веселка біжить
      else if (fx === 'pixel') { const r = hash(i, j); if (r > .82) c = [255, 255, 255]; else if (r > .7) c = [255, 225, 77]; } // геймерські «биті» пікселі
      else if (fx === 'magnet') c = i < w / 2 - 1 ? mix(grad(st, i, 0), [255, 60, 60], .7) : i > w / 2 + 1 ? mix(grad(st, i, 6), [60, 110, 255], .7) : [255, 255, 255];
      else if (fx === 'camo') { const r = hash(i >> 1, j >> 1); c = r < .3 ? [74, 90, 42] : r < .55 ? [184, 160, 100] : c; }
      else if (fx === 'wave') { if (j === 0) c = [255, 255, 255]; }                                              // гребінь хвилі — білий
      else if (fx === 'balloon') { const k = Math.floor(i / 5) % 4; c = mix(c, [[255, 90, 110], [90, 200, 255], [255, 225, 90], [150, 255, 140]][k], .55); if (j === 1 && (i % 5) === 1) c = [255, 255, 255]; }
      else if (fx === 'neon') { const fl = wave(u, 8) > .9 && wave(u, 1, .3) > .7 ? .5 : 1; c = c.map(v => Math.round(v * fl)); }
      else if (fx === 'bolt') { const fl = wave(u, 4) > .96 ? 1 : 0; if (fl) c = [255, 255, 255]; }                 // спалах від блискавки
      if (fx === 'shine' || fx === 'glint' || fx === 'gold') { const d = Math.abs((i - j) - sweep); if (d < 1) c = [255, 255, 255]; else if (d < 2.5) c = mix(c, [255, 255, 255], .5); }
      if (fx === 'laser' || fx === 'scan') { const sy = Math.floor(((u * 2) % 1) * 9) - 1; if (j === sy) c = mix(c, [255, 255, 255], .8); }
      x.fillStyle = css(c); x.fillRect(px + i, py + j - lift(i), 1, 1);
    });
    // 5) оздоблення поверх і поза літерами (кратне циклу — без шва)
    if (fx === 'candy') for (let k = 0; k < 9; k++) { const ph = hash(k, 7), X = px - 3 + hash(k, 1) * (w + 6), Y = py - 3 + hash(k, 2) * 12; if (wave(u, 2, ph) > .55) dot(X, Y, ['#ff6ad8', '#4ee0c0', '#ffe14d', '#ffffff'][k % 4]); }
    if (fx === 'bolt') { const ph = (u * 4) % 1; if (ph < .22) { const X0 = px + (Math.floor(u * 4) % 2 ? w + 2 : -3), dir = Math.floor(u * 4) % 2 ? 1 : -1; x.fillStyle = ph < .08 ? '#ffffff' : '#9af6ff';
      for (let k = 0; k < 7; k++) x.fillRect(X0 + dir * (k & 1 ? 1 : 0) + dir * (k >> 1), py - 3 + k, 1, 1); } }
    if (fx === 'ice') for (let k = 0; k < 6; k++) { const X = px + hash(k, 3) * w, Y = py - 2 + hash(k, 4) * 10; if (wave(u, 1, hash(k, 5)) > .8) { dot(X, Y, '#ffffff'); dot(X - 1, Y, '#cfefff'); dot(X + 1, Y, '#cfefff'); dot(X, Y - 1, '#cfefff'); dot(X, Y + 1, '#cfefff'); } }
    if (fx === 'stars') for (let k = 0; k < 8; k++) { const X = px - 3 + hash(k, 8) * (w + 6), Y = py - 3 + hash(k, 9) * 12, b = wave(u, 1 + (k % 3), hash(k, 10)); if (b > .6) dot(X, Y, b > .9 ? '#ffffff' : '#c8a0ff'); }
    if (fx === 'wave') for (let k = 0; k < 4; k++) { const ph = (u + hash(k, 11)) % 1; dot(px + hash(k, 12) * w, py + 8 - ph * 11, '#cffaff'); }
    if (fx === 'leaf') { const k = wave(u, 1); dot(px + w + 2, py + 1 + k * 4, '#8fe06a'); dot(px + w + 3, py + k * 4, '#5fae3a'); }
    if (fx === 'orbit') { const a = u * TAU; dot(px + w / 2 + Math.cos(a) * (w / 2 + 3), py + 3 + Math.sin(a) * 4.5, '#ff8a2a'); }
    if (fx === 'slash') { const ph = (u * 2) % 1; if (ph < .3) { x.fillStyle = '#ffc94d'; for (let k = 0; k < 5; k++) x.fillRect(px + w + 1 - k + Math.round(ph * 6), py - 2 + k, 1, 1); } }
    if (fx === 'magnet') { const ph = wave(u, 4); if (ph > .9) { dot(px + w / 2, py - 2, '#ffffff'); dot(px + w / 2 - 1, py - 1, '#9af6ff'); dot(px + w / 2 + 1, py - 1, '#ff9a9a'); } }
    if (fx === 'scan') { const ph = (u * 2) % 1; dot(px - 2 + ph * (w + 4), py - 2, '#3bff8a'); dot(px + w + 2 - ph * (w + 4), py + 8, '#3bff8a'); }
    return w;
  }

  /** Що писати на картці для образу: назва скіна (готовий — його; інакше — назва кольорової теми) і реліквії. */
  function names(look) {
    const id = skinOf(look), s = (id && NAMES.skin[id]) || NAMES.theme[look.theme] || NAMES.theme.standard, r = look.hand && NAMES.relic[look.hand];
    return { skin: { t: s[0], st: s[1] }, relic: r ? { t: r[0], st: r[1] } : null };
  }
  return { NAMES, STYLES, FONT: F, width, draw, names };
})();

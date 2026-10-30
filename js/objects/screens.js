/* ============================================================================
 * objects/screens.js — КАРТА СВІТУ ДЛЯ ЕКРАНІВ (розширення NX.kit)
 * ----------------------------------------------------------------------------
 *   K.scrMap(c, x, y, w, h, t, o)  — КАРТА СВІТУ: піксельні континенти крапками (кеш під розмір), сітка, промінь-радар,
 *        дуги між містами з пакетами, пінги-кільця (o.hot — «гарячі» міста рожеві, o.act — швидше, коли Nexi працює);
 *        малюється на великому екрані аналітики (objects/an_paint.js)
 *   K.WORLD — та сама мапа світу (48 × 20) — ще й для планети за вікном (world/city_sky.js)
 * Функція часу (без стану), малюється в полотна екранів, що оновлюються раз на кілька кадрів.
 * Журнал подій, розпізнавання, сторінки й мерехтіння екранів зон 28.10 — в історії git (коміт a431f03).
 * ========================================================================== */
(() => {
  const K = NX.kit, rgba = K.rgba, lit = K.lit;
  const WORLD = [
    '..........XXXXX..XXXXXX..........XXXXXXXX.......', '...XXXXXXXXXXXXX.XXXXXX.....XXXXXXXXXXXXXXXXXXX.',
    '..XXXXXXXXXXXXXX..XXXX...XXXXXXXXXXXXXXXXXXXXXX.', '....XXXXXXXXXXXXX......XXXXXXXXXXXXXXXXXXXXXXXX.',
    '......XXXXXXXXXXXX.....XXXXXXXXXXXXXXXXXXXXXX...', '.......XXXXXXXXXX.....XXXXXXXXXXXXXXXXXXXXXX....',
    '........XXXXXXXX......XXXXXXXXXXXXXXXXXXXXX.....', '.........XXXXX........XXXXXXXXXXXXXXXXXXX.......',
    '..........XXXX........XXXXXXXXXX.XXXXXXX........', '...........XXX.......XXXXXXXXXX...XXXXXX........',
    '.............XXXX.....XXXXXXXXX......XX.........', '.............XXXXXXX.....XXXXX.......XXXXXX.....',
    '.............XXXXXXXX.....XXXX.........XXXXX....', '..............XXXXXXX.....XXXXXX........XXXXX...',
    '..............XXXXXX......XXXXXX.......XXXXXX...', '..............XXXXX.......XXX..........XXXXXX...',
    '..............XXXX......................XXXXX...', '..............XXX.............................XX',
    '..............XX................................', '................................................',
  ];
  K.WORLD = WORLD;                                                                // та сама мапа світу — для планети за вікном (world/city_sky.js)
  const CITIES = { kyiv: [28.0, 4.3], warsaw: [26.8, 4.0], amsterdam: [24.7, 4.0], london: [24.0, 4.1], newyork: [14.1, 5.6], sf: [7.7, 6.0],
    tokyo: [42.7, 6.3], sydney: [44.1, 16.3], saopaulo: [17.9, 14.7], dubai: [31.3, 7.9], singapore: [37.9, 11.3], lagos: [24.4, 10.6] };
  const ROUTES = [['kyiv', 'newyork'], ['amsterdam', 'tokyo'], ['warsaw', 'saopaulo'], ['london', 'dubai'], ['kyiv', 'singapore'], ['amsterdam', 'sydney'], ['sf', 'tokyo']];
  const LAND = new Map();
  /** Континенти крапками під розмір w×h (кешується: один drawImage щоразу). */
  function landLayer(w, h, col) {
    const key = w + 'x' + h + col; let cv = LAND.get(key); if (cv) return cv;
    cv = document.createElement('canvas'); cv.width = w; cv.height = h; const x = cv.getContext('2d'), cw = w / 48, ch = h / 20, d = Math.max(1, Math.floor(Math.min(cw, ch) * .64));
    x.fillStyle = col; WORLD.forEach((row, j) => { for (let i = 0; i < 48; i++) if (row[i] === 'X') x.fillRect(Math.round(i * cw + (cw - d) / 2), Math.round(j * ch + (ch - d) / 2), d, d); });
    LAND.set(key, cv); return cv;
  }
  K.scrMap = (c, x, y, w, h, t, o = {}) => {
    const act = o.act || 0, cw = w / 48, ch = h / 20, at = n => [x + CITIES[n][0] * cw, y + CITIES[n][1] * ch], s = Math.max(2, Math.round(w / 100));
    c.save(); c.beginPath(); c.rect(x, y, w, h); c.clip();
    c.fillStyle = 'rgba(90,170,255,.12)'; for (let k = 1; k < 8; k++) c.fillRect(Math.round(x + k * w / 8), y, 1, h); for (let k = 1; k < 4; k++) c.fillRect(x, Math.round(y + k * h / 4), w, 1);   // меридіани й паралелі
    c.drawImage(landLayer(Math.round(w), Math.round(h), o.land || '#2f7fd0'), x, y);
    c.globalCompositeOperation = 'lighter';
    const sx = x + ((t * (.11 + act * .1)) % 1) * w, g = c.createLinearGradient(sx - w * .2, 0, sx, 0);                       // промінь-радар іде праворуч
    g.addColorStop(0, 'rgba(59,232,255,0)'); g.addColorStop(1, 'rgba(59,232,255,.2)'); c.fillStyle = g; c.fillRect(sx - w * .2, y, w * .2, h); c.fillStyle = 'rgba(150,245,255,.5)'; c.fillRect(sx, y, Math.max(1, s / 2), h);
    ROUTES.forEach(([a, b], k) => {                                                                                        // дуги між містами, по них біжать пакети
      const [x0, y0] = at(a), [x1, y1] = at(b), mx = (x0 + x1) / 2, my = Math.min(y0, y1) - Math.abs(x1 - x0) * .22, ph = (t * (.2 + act * .3) + k * .29) % 1.3;
      c.strokeStyle = k % 2 ? 'rgba(255,120,230,.26)' : 'rgba(90,220,255,.26)'; c.lineWidth = Math.max(1, w / 240); c.beginPath(); c.moveTo(x0, y0); c.quadraticCurveTo(mx, my, x1, y1); c.stroke();
      if (ph < 1) { const u = 1 - ph, px = u * u * x0 + 2 * u * ph * mx + ph * ph * x1, py = u * u * y0 + 2 * u * ph * my + ph * ph * y1; lit(c, Math.round(px - s / 2), Math.round(py - s / 2), s, s, k % 2 ? '#ff9ae6' : '#9af6ff'); }
    });
    Object.keys(CITIES).forEach((n, k) => {                                                                                // пінги: міста по черзі розходяться кільцем
      const [px, py] = at(n), hot = (o.hot || []).includes(n), ph = (t * (hot ? .7 : .38) + k * .37) % 1, r = .5 + ph * Math.max(5, w / 16);
      lit(c, Math.round(px - s / 2), Math.round(py - s / 2), s, s, hot ? '#ff7af0' : '#7af0ff');
      c.strokeStyle = hot ? rgba('255,120,240', (1 - ph) * .75) : rgba('120,240,255', (1 - ph) * .42); c.lineWidth = Math.max(1, s / 2); c.beginPath(); c.ellipse(px, py, r, r * .62, 0, 0, 7); c.stroke();
    });
    c.restore();
  };
})();

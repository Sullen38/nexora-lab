/* layouts/px.js — піксельні дрібниці для макетів: полотна з «пікселями» по 8 px (без розмиття), дизеринг, хвостик бабла,
   піктограми, підгін тексту під рамку. Усе малюється в цілих пікселях — як піксель-арт гри. */
const PX = (() => {
  /** Полотно w×h (CSS = реальні пікселі сторінки: макет рендериться з щільністю 1). */
  const canvas = (w, h) => { const c = document.createElement('canvas'); c.width = w; c.height = h; c.style.width = w + 'px'; c.style.height = h + 'px'; c.className = 'px'; return c; };
  const hex = h => [1, 3, 5].map(i => parseInt(h.slice(i, i + 2), 16));
  const mix = (a, b, t) => a.map((v, i) => Math.round(v + (b[i] - v) * t));
  const BAYER = [[0, 8, 2, 10], [12, 4, 14, 6], [3, 11, 1, 9], [15, 7, 13, 5]];
  /** Вертикальний градієнт з упорядкованим дизерингом (8-біт): stops — [[0, '#hex'], [1, '#hex']], блок — cell px. */
  function dither(w, h, stops, cell = 8, levels = 6) {
    const c = canvas(w, h), x = c.getContext('2d'), S = stops.map(([p, col]) => [p, hex(col)]);
    const at = p => { for (let i = 1; i < S.length; i++) if (p <= S[i][0]) { const [p0, c0] = S[i - 1], [p1, c1] = S[i]; return [c0, c1, (p - p0) / (p1 - p0 || 1)]; } return [S[S.length - 1][1], S[S.length - 1][1], 0]; };
    for (let yy = 0; yy < h; yy += cell) for (let xx = 0; xx < w; xx += cell) {
      const [c0, c1, t] = at((yy + cell / 2) / h), q = t * levels, lo = Math.floor(q), fr = q - lo, th = (BAYER[(yy / cell) % 4][(xx / cell) % 4] + .5) / 16;
      const k = Math.min(levels, lo + (fr > th ? 1 : 0)) / levels, [r, g, b] = mix(c0, c1, k);
      x.fillStyle = `rgb(${r},${g},${b})`; x.fillRect(xx, yy, cell, cell);
    }
    return c;
  }
  /** Піксельна картинка з карти рядків ('#' — колір, '.' — порожньо), клітинка — s px. */
  function map(rows, s, col) { const c = canvas(rows[0].length * s, rows.length * s), x = c.getContext('2d'); x.fillStyle = col;
    rows.forEach((r, j) => [...r].forEach((ch, i) => { if (ch === '#') x.fillRect(i * s, j * s, s, s); })); return c; }
  const ICONS = {
    chat: ['..########..', '.#........#.', '#..........#', '#..........#', '#.##.##.##.#', '#..........#', '.#........#.', '..##.######.', '...##.......', '....#.......'],
    spark: ['.....#.....', '.....#.....', '....###....', '..#######..', '#####.#####', '..#######..', '....###....', '.....#.....', '.....#.....'],
  };
  const icon = (id, s, col) => map(ICONS[id], s, col);
  /** Хвостик бабла донизу (сходинками по s px): ширина w, висота h; обвідка bd кольору line, заливка fill; dir — куди хилиться (-1 вліво, 1 вправо, 0 прямо). */
  function tail(w, h, s, line, fill, bd = 8, dir = -1) {
    const c = canvas(w + 2 * bd, h), x = c.getContext('2d'), rows = Math.floor(h / s);
    for (let j = 0; j < rows; j++) {
      const k = 1 - j / rows, ww = Math.max(s, Math.round(w * k / s) * s), off = dir < 0 ? 0 : dir > 0 ? w - ww : Math.round((w - ww) / 2 / s) * s;
      x.fillStyle = line; x.fillRect(off, j * s, ww + 2 * bd, s);
      if (ww > 0) { x.fillStyle = fill; x.fillRect(off + bd, j * s, Math.max(0, ww), s); }
    }
    x.fillStyle = fill; x.fillRect(dir < 0 ? bd : bd, 0, w, bd);   // з'єднання з баблом (без обвідки зверху)
    return c;
  }
  /** Сходинкові кути (clip-path): прямокутник зі «зрізаними» кутами по s px, n сходинок. */
  function steps(s = 8, n = 2) {
    const a = []; for (let i = 0; i <= n; i++) a.push([i * s, (n - i) * s]);
    const P = (fx, fy) => a.map(([dx, dy]) => `${fx(dx)} ${fy(dy)}`);
    const L = v => `${v}px`, R = v => `calc(100% - ${v}px)`;
    return `polygon(${[...P(L, L), ...P(R, L).reverse(), ...P(R, R), ...P(L, R).reverse()].join(',')})`;
  }
  /** Зменшувати шрифт кроком step (для піксельного — кратно 8), поки текст не влізе в рамку й у maxLines рядків. */
  function fit(el, { max, min, step = 2, lh = 1.25, lines = 2 }) {
    for (let fs = max; fs >= min; fs -= step) {
      el.style.fontSize = fs + 'px'; el.style.lineHeight = Math.round(fs * lh) + 'px';
      const n = Math.round(el.scrollHeight / Math.round(fs * lh));
      if (el.scrollWidth <= el.clientWidth + 1 && n <= lines) return fs;
    }
    return min;
  }
  /** Текст із *підсвіченим* словом -> HTML. */
  const rich = (s, cls = 'hl') => String(s).replace(/[&<>]/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;' }[c])).replace(/\[\[(.+?)\]\]/g, '<span style="white-space:nowrap">$1</span>')
    .replace(/\*(.+?)\*/g, `<em class="${cls}">$1</em>`).replace(/\n/g, '<br>');   // *слово* — підсвітити, [[слова]] — не переносити
  const plain = s => String(s).replace(/\*|\[\[|\]\]/g, '');
  const img = src => new Promise((ok, no) => { const i = new Image(); i.onload = () => ok(i); i.onerror = () => no(new Error('нема картинки ' + src)); i.src = src; });
  /** Спрайт (рідна сітка) збільшити в ціле число разів k — без розмиття. */
  async function sprite(src, k, flip) { const i = await img(src), c = canvas(i.width * k, i.height * k), x = c.getContext('2d'); x.imageSmoothingEnabled = false;
    if (flip) { x.translate(c.width, 0); x.scale(-1, 1); } x.drawImage(i, 0, 0, c.width, c.height); return c; }
  /** Шрифти — ДО вимірювань (інакше підгін тексту міряє запасний шрифт): Press Start 2P і Rubik (змінна вага — один файл). */
  const fonts = () => Promise.all(['16px "Press Start 2P"', '400 16px Rubik', '800 16px Rubik'].map(f => document.fonts.load(f, 'AaЇїЄєҐґĄąŁłŻżĳ'))).then(() => document.fonts.ready);
  return { canvas, dither, map, icon, tail, steps, fit, rich, plain, img, sprite, hex, fonts };
})();

/* ============================================================================
 * garden/plants.js — ГЕНЕРАТОР РОСЛИН САДУ ЗА ТИПАМИ (NX.gardenPlants)
 * ----------------------------------------------------------------------------
 * Кожну культуру каталогу (garden/catalog.js) малює не окремий малюнок, а генератор її ТИПУ — піксель-артом у власний
 * растр (як диван: NX.art.Raster, тон за освітленістю, дизеринг Байєра, темний контур), 6 стадій росту (0 — сіянець,
 * 5 — достигло) і 3 варіанти, щоб сусідні кущі не були однакові. Растри кешуються: щокадру — лише drawImage.
 *   sprite(id, stage 0..5, variant 0..2) -> canvas SW×SH (1 піксель = 0.5 од. кімнати); основа рослини — точка BASE.
 * Типи цього кроку (сектор «Гідропоніка»):
 *   rosette — розетка (салат): віяло хвилястих листків і світле серце; варіант 2 — червонолистий;
 *   bunch   — пучок (шпинат): овальні листки на черешках;
 *   bush    — кущик (базилік): стебло з парами глянцевих листків;
 *   feather — перисті (кріп): тонкі стебла з ниточками, наприкінці — жовті парасольки.
 * Решта типів каталогу (cap, root, cereal, vine, tree, palm…) додаються разом зі своїми секторами.
 * Унизу кожного спрайта — сітчастий горщик (у ньому рослина сидить в отворі жолоба).
 * ========================================================================== */
NX.gardenPlants = (() => {
  const { Raster, outline, hash, BAYER } = NX.art;
  const SW = 72, SH = 90, BASE = [36, 85], OUT = '#12082a', STAGES = 6;
  const PAL = {
    lettuce: ['#0d3a24', '#1a6a34', '#2f9a44', '#62cc58', '#a6ee7a', '#dcffb0'],
    red: ['#2a0c2c', '#5a1846', '#8c2a5c', '#c0506c', '#74c85a', '#b4f08a'],
    spinach: ['#062a22', '#0d4a30', '#177038', '#2a9648', '#56bc5c', '#8fe07c'],
    basil: ['#082c1c', '#10502a', '#1c7a36', '#34a446', '#6cd266', '#b4f48e'],
    dill: ['#143a1e', '#2a6a2c', '#4c9a3a', '#84c84c', '#c2ea6c', '#f0ff9a'],
  };
  const cl = (v, n) => Math.max(0, Math.min(n - 1, Math.round(v)));
  /** Листок-еліпс: основа (bx, by), довжина len у напрямку ang, півширина wd; frill — хвилястий край. */
  function leaf(r, bx, by, len, wd, ang, pal, frill, seed) {
    const ca = Math.cos(ang), sa = Math.sin(ang), cx = bx + ca * len / 2, cy = by + sa * len / 2, R = Math.ceil(len / 2 + wd) + 1;
    for (let j = -R; j <= R; j++) for (let i = -R; i <= R; i++) {
      const X = Math.round(cx + i), Y = Math.round(cy + j), dx = X - cx, dy = Y - cy, u = (dx * ca + dy * sa) / (len / 2), v = (-dx * sa + dy * ca) / wd;
      if (u * u + v * v + (frill ? (hash(X + seed, Y * 3) - .5) * frill : 0) > 1) continue;
      let q = 2.3 + u * 1.3 - dy / R * 1.1 + BAYER[(Y & 3) * 4 + (X & 3)] * 1.1;
      if (Math.abs(v) < .16 && u < .65) q -= 1;                                        // жилка
      r.set(X, Y, pal[cl(q, pal.length)]);
    }
  }
  const stem = (r, x0, y0, x1, y1, col, w = 1) => { for (let d = 0; d < w; d++) r.line(x0 + d, y0, x1 + d, y1, col); };
  function pot(r) { const [bx, by] = BASE; r.rect(bx - 5, by - 1, 11, 5, '#2a3060'); r.rect(bx - 5, by - 1, 11, 1, '#7a84c0'); r.rect(bx - 5, by, 11, 1, '#4a5490'); for (const d of [-3, 0, 3]) r.rect(bx + d, by + 2, 1, 2, '#141a44'); }
  function sprout(r, pal) { const [bx, by] = BASE; r.rect(bx, by - 6, 1, 5, pal[3]); for (const s of [-1, 1]) { r.rect(bx + s * 2 - (s < 0 ? 1 : 0), by - 8, 2, 2, pal[4]); r.set(bx + s * 4 - (s < 0 ? 1 : 0) + (s < 0 ? 1 : 0), by - 9, pal[5]); r.set(bx + s, by - 7, pal[3]); } }

  const TYPES = {
    rosette(r, q, v, pal) {
      const [bx, by] = BASE, R = 6 + q * 14, n = 5 + Math.round(q * 6);
      for (let i = n - 1; i >= 0; i--) {                                              // зовнішні листки — ширше й нижче, далі до середини
        const o = i % 2 ? (i + 1) / 2 : -i / 2, side = Math.abs(o) / (n / 2), a = -Math.PI / 2 + o * (2.7 / n) * (1 + .15 * hash(i, v));
        leaf(r, bx + o * 1.2, by - 2, R * (1.55 - .4 * side + .2 * hash(i + 3, v)), R * (.52 + .12 * hash(i + 7, v)), a * (1 + .22 * side), pal, .7, v * 13 + i);
      }
      const hr = 2 + q * 6; for (let j = -hr; j <= hr; j++) for (let i = -hr * 1.3; i <= hr * 1.3; i++) if (i * i / (hr * hr * 1.7) + j * j / (hr * hr) <= 1 + (hash(i + v, j) - .5) * .5) r.set(bx + i, by - 3 - R * .6 + j, pal[4 + (hash(i + v, j * 3) < .4 ? 1 : 0) - (j > hr * .4 ? 1 : 0)]);   // світле серце
    },
    bunch(r, q, v, pal) {
      const [bx, by] = BASE, n = 3 + Math.round(q * 6), L = 7 + q * 22;
      for (let i = n - 1; i >= 0; i--) {
        const o = i % 2 ? (i + 1) / 2 : -i / 2, a = -Math.PI / 2 + o * (2 / n) + (hash(i, v) - .5) * .2, l = L * (1 - .1 * Math.abs(o) + .25 * hash(i + 5, v));
        const ex = bx + Math.cos(a) * l, ey = by - 2 + Math.sin(a) * l; stem(r, bx, by - 2, ex, ey, pal[2], 2);
        leaf(r, ex - Math.cos(a) * 4, ey - Math.sin(a) * 4, 9 + q * 15, 3.2 + q * 4.6, a, pal, .22, v * 7 + i);
      }
    },
    bush(r, q, v, pal) {
      const [bx, by] = BASE, H = 7 + q * 46, lean = (hash(v, 9) - .5) * 6;
      stem(r, bx, by - 2, bx + lean, by - 2 - H, pal[2], 2);
      for (let h = 8, i = 0; h < H; h += 11, i++) {
        const x = bx + lean * h / H, y = by - 2 - h, s = .65 + .35 * (1 - h / (H + 10)), l = (9 + q * 13) * s, w = (3.4 + q * 3.6) * s;
        leaf(r, x + 1, y, l, w, -.12 - .15 * hash(i, v), pal, 0, i); leaf(r, x, y, l, w, Math.PI + .12 + .15 * hash(i + 2, v), pal, 0, i + 20);
        r.rect(x + l * .4, y - 2, 3, 1, pal[5]); r.rect(x - l * .55, y - 2, 3, 1, pal[5]);   // глянець
      }
      for (const d of [-.4, .4]) leaf(r, bx + lean, by - 2 - H, 5 + q * 6, 2.4 + q * 1.8, -Math.PI / 2 + d, pal, 0, 40);
    },
    feather(r, q, v, pal) {
      const [bx, by] = BASE, n = 2 + Math.round(q * 3), H = 10 + q * 62;
      for (let i = 0; i < n; i++) {
        const o = i - (n - 1) / 2, h = H * (.7 + .3 * hash(i, v + 4)), tx = bx + o * (4 + q * 8) + (hash(i + 2, v) - .5) * 5;
        for (let k = 0; k <= h; k++) { const f = k / h, x = bx + (tx - bx) * f * f, y = by - 2 - k; r.set(x, y, pal[3]); if (k < h * .5) r.set(x + 1, y, pal[2]);
          if (k > 5 && k % 3 === 0) { const d = 2 + Math.round(f * (3 + q * 5)), sg = (k / 3 | 0) % 2 ? 1 : -1; for (let m = 1; m <= d; m++) { r.set(x + sg * m, y - (m >> 1), pal[m >= d - 1 ? 5 : 4]); if (m > 2 && m % 2) r.set(x + sg * m, y - (m >> 1) - 1, pal[4]); } } }
        if (q > .7) for (let m = -6; m <= 6; m++) { const y = by - 2 - h - 3 + Math.round(m * m * .1); r.set(tx + m, y, m % 2 ? '#ffe27a' : '#fff3a8'); if (m % 2 === 0) { r.set(tx + m, y + 1, pal[4]); r.set(tx + m * .6, y + 2, pal[3]); } }   // парасолька
      }
    },
  };
  const cache = {};
  /** Растр культури id на стадії stage (0..5), варіант v (0..2). */
  function sprite(id, stage, v = 0) {
    const key = id + stage + v; if (cache[key]) return cache[key];
    const crop = NX.gardenCat.crop(id), r = Raster(SW, SH), pal = id === 'lettuce' && v === 2 ? PAL.red : (PAL[id] || PAL.lettuce);
    if (stage <= 0) sprout(r, pal); else (TYPES[crop.type] || TYPES.bunch)(r, stage / (STAGES - 1), v, pal);
    pot(r); outline(r, OUT);
    return cache[key] = r.canvas();
  }
  /** Зібрати всі растри культури (для прогріву шматками — garden.js). */
  function warm(id) { for (let s = 0; s < STAGES; s++) for (let v = 0; v < 3; v++) sprite(id, s, v); }
  return { sprite, warm, SW, SH, BASE, STAGES };
})();

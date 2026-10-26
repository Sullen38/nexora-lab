/* ============================================================================
 * world/city_kit.js — ІНСТРУМЕНТИ МІСТА ЗА ПАНОРАМНИМ ВІКНОМ (NX.ckit)
 * ----------------------------------------------------------------------------
 * Місто за вікном малюється кодом у растри (1 піксель = 0.25 од. кімнати — як усі
 * нові об'єкти) ОДИН раз, а щокадру поверх — лише живі деталі (cityscape.js).
 * Тут — спільні швидкі інструменти: растр на Uint32 (колір = одне число, а не рядок —
 * місто з мільйонами пікселів будується за частку секунди), кольори, дизеринг, шум.
 *   Ras(x0, y0, x1, y1, U)   — растр над прямокутником кімнати (U — од. на піксель):
 *       .rect(X0,Y0,X1,Y1, c|fn)  — прямокутник; fn(i, j, X, Y) -> колір c32 | 0
 *       .poly(pts, c|fn)          — многокутник (скан-рядками, правило парності)
 *       .over(i, j, c, a)         — накласти колір з прозорістю a (0..1)
 *       .dot(X, Y, c)             — один піксель у точці кімнати
 *       .canvas()                 — готове полотно
 *   col(hex) -> c32 (кешується), mix(a, b, k) -> c32, rgb(c32) -> [r, g, b]
 *   B(i, j)                  — поріг Байєра 4×4 (-.47..47) — 8-bit перелив без розмиття
 *   ramp(pal, q, i, j, g)    — тон палітри c32[] за освітленістю q 0..1 з дизерингом
 *   fade(a, b, t, i, j, k)   — перехід між двома кольорами дизерингом (k — різкість)
 *   rng(seed)                — відтворюваний випадковий генератор (місто однакове щоразу)
 *   vn(x, y), fbm(x, y)      — плавний шум (хмари, береги континентів, плями на фасадах)
 *   glyph(c, s, x, y, p)     — мініатюрний піксельний шрифт 3×5 для вивісок і реклами
 *   glow(c, x, y, r, rgb, a) — швидке світіння (спрайт з градієнтом кешується для кольору)
 * ========================================================================== */
NX.ckit = (() => {
  const BAY = NX.art.BAYER;                                                       // 16 порогів -0.47..0.47
  const B = (i, j) => BAY[(j & 3) * 4 + (i & 3)];
  const clamp = (v, a, b) => v < a ? a : v > b ? b : v;

  // ---------- кольори: c32 = ABGR (little-endian), щоб писати прямо в ImageData ----------
  const HEX = new Map();
  const col = h => { let v = HEX.get(h); if (v === undefined) { const r = parseInt(h.slice(1, 3), 16), g = parseInt(h.slice(3, 5), 16), b = parseInt(h.slice(5, 7), 16); v = ((255 << 24) | (b << 16) | (g << 8) | r) >>> 0; HEX.set(h, v); } return v; };
  const rgb = c => [c & 255, (c >>> 8) & 255, (c >>> 16) & 255];
  const pack = (r, g, b) => ((255 << 24) | (clamp(Math.round(b), 0, 255) << 16) | (clamp(Math.round(g), 0, 255) << 8) | clamp(Math.round(r), 0, 255)) >>> 0;
  /** Суміш двох кольорів (рядки або c32) -> c32. */
  const mix = (a, b, k) => { const A = rgb(typeof a === 'string' ? col(a) : a), C = rgb(typeof b === 'string' ? col(b) : b); return pack(A[0] + (C[0] - A[0]) * k, A[1] + (C[1] - A[1]) * k, A[2] + (C[2] - A[2]) * k); };
  const pal = list => list.map(col);
  /** Тон палітри за освітленістю q (0..1) + дизеринг Байєра (+ зерно g). */
  const ramp = (P, q, i, j, g = 0) => P[clamp(Math.round(clamp(q, 0, 1) * (P.length - 1) + B(i, j) * .9 + (g ? (hash2(i, j) - .5) * g : 0)), 0, P.length - 1)];
  /** Перехід a -> b дизерингом: t 0..1, k — різкість (1 — уся смуга в «шахівниці», 2 — вужча). */
  const fade = (a, b, t, i, j, k = 1.6) => (clamp((t - .5) * k + .5, 0, 1) + B(i, j) > .5 ? b : a);

  // ---------- випадковість і шум ----------
  function rng(seed) { let s = seed >>> 0; return () => { s = (s + 0x6D2B79F5) >>> 0; let t = s; t = Math.imul(t ^ (t >>> 15), t | 1); t ^= t + Math.imul(t ^ (t >>> 7), t | 61); return ((t ^ (t >>> 14)) >>> 0) / 4294967296; }; }
  const hash2 = (x, y) => { let h = (Math.imul(x | 0, 374761393) + Math.imul(y | 0, 668265263)) >>> 0; h = Math.imul(h ^ (h >>> 13), 1274126177) >>> 0; return ((h ^ (h >>> 16)) >>> 0) / 4294967296; };
  const LAT = Float32Array.from({ length: 4096 }, (_, n) => hash2(n & 63, n >> 6));
  const vn = (x, y) => { const xi = Math.floor(x), yi = Math.floor(y), fx = x - xi, fy = y - yi, sx = fx * fx * (3 - 2 * fx), sy = fy * fy * (3 - 2 * fy), L = (a, b) => LAT[(a & 63) + ((b & 63) << 6)];
    const a = L(xi, yi), b = L(xi + 1, yi), c = L(xi, yi + 1), d = L(xi + 1, yi + 1); return a + (b - a) * sx + (c - a) * sy + (a - b - c + d) * sx * sy; };
  const fbm = (x, y) => vn(x, y) * .55 + vn(x * 2.1 + 17, y * 2.1 + 5) * .3 + vn(x * 4.3 + 31, y * 4.3 + 11) * .15;

  // ---------- растр ----------
  function Ras(x0, y0, x1, y1, U = .25) {
    const W = Math.ceil((x1 - x0) / U), H = Math.ceil((y1 - y0) / U), d = new Uint32Array(W * H);
    const lo = (v, o) => Math.ceil((v - o) / U - .5);                              // перший піксель, центр якого >= v
    const R = {
      x0, y0, x1, y1, U, W, H, d,
      I: X => Math.floor((X - x0) / U), J: Y => Math.floor((Y - y0) / U),
      X: i => x0 + (i + .5) * U, Y: j => y0 + (j + .5) * U,
      get: (i, j) => (i < 0 || j < 0 || i >= W || j >= H) ? 0 : d[j * W + i],
      put(i, j, c) { if (i >= 0 && j >= 0 && i < W && j < H) d[j * W + i] = c; },
      dot(X, Y, c) { R.put(Math.floor((X - x0) / U), Math.floor((Y - y0) / U), c); },
      /** Накласти колір c з прозорістю a: на порожньому — напівпрозорий піксель. */
      over(i, j, c, a) {
        if (i < 0 || j < 0 || i >= W || j >= H || a <= 0) return; const k = j * W + i, o = d[k];
        if (a >= 1 || !o) { d[k] = a >= 1 ? c : ((Math.round(a * 255) << 24) | (c & 0xffffff)) >>> 0; return; }
        const oa = (o >>> 24) / 255, na = a + oa * (1 - a), f = a / na;
        d[k] = ((Math.round(na * 255) << 24) | (Math.round(((c >>> 16) & 255) * f + ((o >>> 16) & 255) * (1 - f)) << 16) | (Math.round(((c >>> 8) & 255) * f + ((o >>> 8) & 255) * (1 - f)) << 8) | Math.round((c & 255) * f + (o & 255) * (1 - f))) >>> 0;
      },
      rect(X0, Y0, X1, Y1, f) {
        const i0 = Math.max(0, lo(X0, x0)), i1 = Math.min(W, lo(X1, x0)), j0 = Math.max(0, lo(Y0, y0)), j1 = Math.min(H, lo(Y1, y0)), fn = typeof f === 'function';
        for (let j = j0; j < j1; j++) { const Y = y0 + (j + .5) * U, row = j * W; for (let i = i0; i < i1; i++) { const v = fn ? f(i, j, x0 + (i + .5) * U, Y) : f; if (v) d[row + i] = v; } }
      },
      /** Многокутник: для кожного рядка — перетини з ребрами, заливка проміжків (правило парності). */
      poly(pts, f) {
        const n = pts.length, fn = typeof f === 'function', cs = []; let ay = Infinity, by = -Infinity;
        for (const p of pts) { if (p[1] < ay) ay = p[1]; if (p[1] > by) by = p[1]; }
        const j0 = Math.max(0, lo(ay, y0)), j1 = Math.min(H, lo(by, y0));
        for (let j = j0; j < j1; j++) {
          const Y = y0 + (j + .5) * U; cs.length = 0;
          for (let a = 0, b = n - 1; a < n; b = a++) { const ya = pts[a][1], yb = pts[b][1]; if ((ya > Y) !== (yb > Y)) cs.push(pts[a][0] + (pts[b][0] - pts[a][0]) * (Y - ya) / (yb - ya)); }
          cs.sort((p, q) => p - q);
          for (let k = 0; k + 1 < cs.length; k += 2) { const i0 = Math.max(0, lo(cs[k], x0)), i1 = Math.min(W, lo(cs[k + 1], x0)); for (let i = i0; i < i1; i++) { const v = fn ? f(i, j, x0 + (i + .5) * U, Y) : f; if (v) d[j * W + i] = v; } }
        }
      },
      canvas() { const cv = document.createElement('canvas'); cv.width = W; cv.height = H; cv.getContext('2d').putImageData(new ImageData(new Uint8ClampedArray(d.buffer), W, H), 0, 0); return cv; },
    };
    return R;
  }

  // ---------- мініатюрний піксельний шрифт (3×5; N, M, W — 4×5) ----------
  const FONT = {
    A: ['.X.', 'X.X', 'XXX', 'X.X', 'X.X'], E: ['XXX', 'X..', 'XX.', 'X..', 'XXX'], I: ['XXX', '.X.', '.X.', '.X.', 'XXX'], O: ['XXX', 'X.X', 'X.X', 'X.X', 'XXX'],
    R: ['XX.', 'X.X', 'XX.', 'X.X', 'X.X'], X: ['X.X', 'X.X', '.X.', 'X.X', 'X.X'], N: ['X..X', 'XX.X', 'X.XX', 'X..X', 'X..X'], C: ['XXX', 'X..', 'X..', 'X..', 'XXX'],
    H: ['X.X', 'X.X', 'XXX', 'X.X', 'X.X'], T: ['XXX', '.X.', '.X.', '.X.', '.X.'], S: ['XXX', 'X..', 'XXX', '..X', 'XXX'], P: ['XX.', 'X.X', 'XX.', 'X..', 'X..'],
    '2': ['XX.', '..X', '.X.', 'X..', 'XXX'], '4': ['X.X', 'X.X', 'XXX', '..X', '..X'], '7': ['XXX', '..X', '.X.', '.X.', '.X.'], '/': ['..X', '..X', '.X.', 'X..', 'X..'],
    '♥': ['.X.X.', 'XXXXX', 'XXXXX', '.XXX.', '..X..'], ' ': ['.', '.', '.', '.', '.'], '·': ['.', '.', 'X', '.', '.'],
  };
  /** Ширина рядка s у пікселях шрифту (з проміжками 1). */
  const glyphW = s => [...s].reduce((w, ch) => w + (FONT[ch] || FONT[' '])[0].length + 1, -1);
  /** Рядок s піксельним шрифтом: c — 2D-контекст, p — розмір «пікселя» шрифту (од.), x, y — лівий верхній кут. */
  function glyph(c, s, x, y, p, color) {
    c.fillStyle = color; let cx = x;
    for (const ch of s) { const g = FONT[ch] || FONT[' ']; g.forEach((row, j) => { for (let i = 0; i < row.length; i++) if (row[i] === 'X') c.fillRect(cx + i * p, y + j * p, p, p); }); cx += (g[0].length + 1) * p; }
    return cx - x - p;
  }

  // ---------- швидке світіння: радіальний градієнт малюється в спрайт ОДИН раз для кольору, далі — drawImage ----------
  // (NX.px.glow створює градієнт щоразу — для десятків вогників міста щокадру це дорого, особливо на телефоні)
  const GLOW = new Map();
  function glowSprite(rgb) {
    let cv = GLOW.get(rgb); if (cv) return cv;
    cv = document.createElement('canvas'); cv.width = cv.height = 64; const x = cv.getContext('2d'), g = x.createRadialGradient(32, 32, 0, 32, 32, 32);
    g.addColorStop(0, `rgba(${rgb},1)`); g.addColorStop(.35, `rgba(${rgb},.45)`); g.addColorStop(1, `rgba(${rgb},0)`); x.fillStyle = g; x.fillRect(0, 0, 64, 64); GLOW.set(rgb, cv); return cv;
  }
  /** Світіння (адитивне) радіуса r кольору rgb ('r,g,b') з силою a. */
  function glow(c, x, y, r, rgb, a = 1) {
    if (a <= .01) return; const op = c.globalCompositeOperation, ga = c.globalAlpha, sm = c.imageSmoothingEnabled;
    c.globalCompositeOperation = 'lighter'; c.globalAlpha = Math.min(1, a); c.imageSmoothingEnabled = true; c.drawImage(glowSprite(rgb), x - r, y - r, r * 2, r * 2);
    c.globalCompositeOperation = op; c.globalAlpha = ga; c.imageSmoothingEnabled = sm;
  }

  return { B, BAY, clamp, col, rgb, pack, mix, pal, ramp, fade, rng, hash2, vn, fbm, Ras, FONT, glyph, glyphW, glow, glowSprite };
})();

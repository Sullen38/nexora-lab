/* ============================================================================
 * core/pixelart.js — ПІКСЕЛЬ-АРТ ІНСТРУМЕНТИ ДЛЯ ОБ'ЄКТІВ (еталон — диван)
 * ----------------------------------------------------------------------------
 * Кожен інтерактивний об'єкт малюється кодом у власну сітку пікселів один раз
 * (у canvas), а потім щокадру поверх нього — лише "живі" деталі.
 *   Raster(w, h)          — растр: set/rect/line/dashed/alpha, .canvas()
 *   shade(r, x, y, w, h, палітра, val(u,v), маска, зерно)
 *                         — об'ємна заливка: тон за освітленістю 0..1
 *                           + 8-bit дизеринг Байєра + зерно тканини
 *   rmask(w, h, tl, tr, br, bl) — маска прямокутника із заокругленими кутами
 *   bump(t)               — "пухкість" 0..1..0 (подушки, валики)
 *   outline(r, колір)     — темний контур навколо всього об'єкта
 *   mirror(r)             — ліва половина -> дзеркально на праву (симетрія)
 *   flipH(r)              — віддзеркалити весь растр
 *   hash(x, y)            — стабільний псевдовипадковий шум 0..1
 * Приклад використання: js/objects/sofa.js -> buildBody().
 * ========================================================================== */
NX.art = (() => {
  const P = NX.px;
  // ---------- растр: малюємо прямо в пікселі (швидко, без згладжування) ----------
  function Raster(w, h) {
    const d = new Uint8ClampedArray(w * h * 4), cache = {};
    const rgb = hex => cache[hex] || (cache[hex] = [1, 3, 5].map(i => parseInt(hex.slice(i, i + 2), 16)));
    const r = {
      w, h, d,
      set(x, y, hex, a = 1) {
        x = Math.round(x); y = Math.round(y); if (x < 0 || y < 0 || x >= w || y >= h) return;
        const i = (y * w + x) * 4, c = rgb(hex);
        if (a >= 1) { d[i] = c[0]; d[i + 1] = c[1]; d[i + 2] = c[2]; d[i + 3] = 255; }
        else if (d[i + 3]) { d[i] += (c[0] - d[i]) * a; d[i + 1] += (c[1] - d[i + 1]) * a; d[i + 2] += (c[2] - d[i + 2]) * a; }
      },
      alpha(x, y) { return (x < 0 || y < 0 || x >= w || y >= h) ? 0 : d[(y * w + x) * 4 + 3]; },
      rect(x, y, rw, rh, hex, a) { for (let j = 0; j < rh; j++) for (let i = 0; i < rw; i++) r.set(x + i, y + j, hex, a); },
      line(x0, y0, x1, y1, hex, a) { const n = Math.max(1, Math.round(Math.max(Math.abs(x1 - x0), Math.abs(y1 - y0)))); for (let i = 0; i <= n; i++) r.set(x0 + (x1 - x0) * i / n, y0 + (y1 - y0) * i / n, hex, a); },
      dashed(x, y, rw, rh, hex) { for (let i = 0; i < rw; i += 3) { r.set(x + i, y, hex); r.set(x + i, y + rh - 1, hex); } for (let j = 0; j < rh; j += 3) { r.set(x, y + j, hex); r.set(x + rw - 1, y + j, hex); } },
      canvas() { const cv = document.createElement('canvas'); cv.width = w; cv.height = h; cv.getContext('2d').putImageData(new ImageData(d, w, h), 0, 0); return cv; },
    };
    return r;
  }
  const BAYER = [0, 8, 2, 10, 12, 4, 14, 6, 3, 11, 1, 9, 15, 7, 13, 5].map(v => (v + .5) / 16 - .5);
  const hash = (x, y) => { const s = Math.sin(x * 127.1 + y * 311.7) * 43758.5453; return s - Math.floor(s); };
  const bump = t => Math.sqrt(Math.max(0, 1 - (2 * t - 1) ** 2));          // "пухкість" поперек подушки
  /** Об'ємна заливка фігури: тон палітри за освітленістю val(u,v) + дизеринг + зерно тканини. */
  function shade(r, x0, y0, w, h, pal, val, mask, grain = .22) {
    for (let j = 0; j < h; j++) for (let i = 0; i < w; i++) {
      const u = (i + .5) / w, v = (j + .5) / h; if (mask && !mask(u, v)) continue;
      const X = x0 + i, Y = y0 + j, q = P.clamp(val(u, v), 0, 1) * (pal.length - 1) + BAYER[(Y & 3) * 4 + (X & 3)] * .85 + (hash(X, Y) - .5) * grain;
      r.set(X, Y, pal[P.clamp(Math.round(q), 0, pal.length - 1)]);
    }
  }
  /** Маска прямокутника з окремими радіусами кутів: tl, tr, br, bl (у пікселях). */
  const rmask = (w, h, tl = 0, tr = 0, br = 0, bl = 0) => (u, v) => {
    const x = u * w, y = v * h, inC = (cx, cy, rr) => (x - cx) ** 2 + (y - cy) ** 2 <= rr * rr;
    if (tl && x < tl && y < tl) return inC(tl, tl, tl);
    if (tr && x > w - tr && y < tr) return inC(w - tr, tr, tr);
    if (br && x > w - br && y > h - br) return inC(w - br, h - br, br);
    if (bl && x < bl && y > h - bl) return inC(bl, h - bl, bl);
    return true;
  };
  function outline(r, hex) {
    const { w, h, d } = r, op = new Uint8Array(w * h), c = [1, 3, 5].map(i => parseInt(hex.slice(i, i + 2), 16));
    for (let i = 0; i < op.length; i++) op[i] = d[i * 4 + 3] > 40 ? 1 : 0;
    for (let y = 0; y < h; y++) for (let x = 0; x < w; x++) { const i = y * w + x; if (op[i]) continue;
      if ((x > 0 && op[i - 1]) || (x < w - 1 && op[i + 1]) || (y > 0 && op[i - w]) || (y < h - 1 && op[i + w])) { d[i * 4] = c[0]; d[i * 4 + 1] = c[1]; d[i * 4 + 2] = c[2]; d[i * 4 + 3] = 255; } }
  }
  /** Ліву половину копіює дзеркально на праву — обидві половини ІДЕНТИЧНІ. */
  function mirror(r) { const { w, h, d } = r; for (let y = 0; y < h; y++) for (let x = 0; x < w / 2; x++) { const a = (y * w + x) * 4, b = (y * w + w - 1 - x) * 4; for (let k = 0; k < 4; k++) d[b + k] = d[a + k]; } }
  function flipH(r) { const { w, h, d } = r; for (let y = 0; y < h; y++) for (let x = 0; x < w / 2; x++) { const a = (y * w + x) * 4, b = (y * w + w - 1 - x) * 4; for (let k = 0; k < 4; k++) { const tmp = d[a + k]; d[a + k] = d[b + k]; d[b + k] = tmp; } } }
  return { Raster, shade, rmask, outline, mirror, flipH, bump, hash, BAYER };
})();

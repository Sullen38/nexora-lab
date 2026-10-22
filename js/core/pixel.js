/* ============================================================================
 * core/pixel.js — ПІКСЕЛЬНІ ІНСТРУМЕНТИ МАЛЮВАННЯ
 * ----------------------------------------------------------------------------
 * Маленька бібліотека для 8-bit графіки на Canvas 2D:
 *   shade(hex, k)              – освітлити (k>0) / затемнити (k<0) колір
 *   rect(c,x,y,w,h,col)        – прямокутник
 *   cube(c,x,y,w,h,d,f,t,s)    – об'ємний "2.5D" куб: передня грань, верх, бік
 *   glow(c,x,y,r,col,a)        – м'яке неонове світіння (адитивне)
 *   holo(c,x,y,w,h,col,t,a)    – голографічна панель зі скан-лініями
 *   stair(c,x0,y0,x1,y1,col,s) – піксельна "сходинкова" лінія
 *   text(c,s,x,y,col,size)     – піксельний текст шрифтом Press Start 2P
 *   hash(n)                    – детермінований псевдовипадковий 0..1
 *   depthK(y) / depth(c,x,y,fn) – ПЕРСПЕКТИВА: предмет ближче до глядача
 *                                малюється більшим (як і Nexi)
 * ========================================================================== */
NX.px = (() => {
  const hx = h => [1, 3, 5].map(i => parseInt(h.slice(i, i + 2), 16));
  const toHex = a => '#' + a.map(v => Math.max(0, Math.min(255, Math.round(v))).toString(16).padStart(2, '0')).join('');
  const shade = (h, k) => { if (h[0] !== '#') return h; const c = hx(h); return toHex(k >= 0 ? c.map(v => v + (255 - v) * k) : c.map(v => v * (1 + k))); };
  const rect = (c, x, y, w, h, col) => { c.fillStyle = col; c.fillRect(x, y, w, h); };
  /** Куб з "косою" глибиною 45°: y — нижня лінія передньої грані. U — розмір пікселя. */
  function cube(c, x, y, w, h, d, f, t, s, U = 2) {
    const n = Math.max(1, Math.round(d / U));
    for (let k = 0; k < n; k++) { rect(c, x + w + k * U, y - h - (k + 1) * U, U, h, s); rect(c, x + (k + 1) * U, y - h - (k + 1) * U, w, U, t); }
    rect(c, x, y - h, w, h, f); rect(c, x, y - h, w, U, shade(f, .3)); rect(c, x, y - U, w, U, shade(f, -.35));
  }
  function glow(c, x, y, r, col, a = 1) {
    c.save(); c.globalCompositeOperation = 'lighter'; c.globalAlpha = a;
    const g = c.createRadialGradient(x, y, 0, x, y, r); g.addColorStop(0, col); g.addColorStop(1, 'rgba(0,0,0,0)');
    c.fillStyle = g; c.fillRect(x - r, y - r, r * 2, r * 2); c.restore();
  }
  function holo(c, x, y, w, h, col, t, a = 1) {
    c.save(); c.globalAlpha = a * (.85 + .15 * Math.sin(t * 17));
    c.fillStyle = col + '22'; c.fillRect(x, y, w, h);
    for (let yy = y; yy < y + h; yy += 3) rect(c, x, yy, w, .5, col + '22');
    c.strokeStyle = col; c.lineWidth = 1; c.strokeRect(x + .5, y + .5, w - 1, h - 1); c.restore();
  }
  function stair(c, x0, y0, x1, y1, col, s = 2) {
    const n = Math.max(1, Math.max(Math.abs(x1 - x0), Math.abs(y1 - y0)) / s | 0);
    for (let i = 0; i <= n; i++) rect(c, x0 + (x1 - x0) * i / n, y0 + (y1 - y0) * i / n, s, s, col);
  }
  function text(c, s, x, y, col, size = 6, align = 'left') {
    c.font = size + 'px "Press Start 2P", monospace'; c.fillStyle = col; c.textAlign = align; c.fillText(s, x, y); c.textAlign = 'left';
  }
  const hash = n => { const x = Math.sin(n * 127.1 + 311.7) * 43758.5453; return x - Math.floor(x); };
  const lerp = (a, b, t) => a + (b - a) * t, clamp = (v, a, b) => Math.max(a, Math.min(b, v));
  /** Коефіцієнт перспективи для точки підлоги y (1 = біля меблів картинки). */
  const depthK = y => NX.room.scaleAt(Math.max(y, NX.cfg.FLOOR_Y)) / NX.cfg.NEXI_SCALE_FAR;
  /** Намалювати fn() збільшеним довкола точки (x,y) за перспективою. */
  function depth(c, x, y, fn) { const k = depthK(y); c.save(); c.translate(x, y); c.scale(k, k); c.translate(-x, -y); fn(k); c.restore(); }
  return { shade, rect, cube, glow, holo, stair, text, hash, lerp, clamp, depthK, depth };
})();

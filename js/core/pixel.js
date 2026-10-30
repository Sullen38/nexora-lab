/* ============================================================================
 * core/pixel.js — ПІКСЕЛЬНІ ІНСТРУМЕНТИ МАЛЮВАННЯ
 * ----------------------------------------------------------------------------
 * Маленька бібліотека для 8-bit графіки на Canvas 2D:
 *   rect(c,x,y,w,h,col)        – прямокутник, прив'язаний до пікселів екрана
 *   glow(c,x,y,r,col,a)        – м'яке неонове світіння (адитивне)
 *   text(c,s,x,y,col,size)     – піксельний текст шрифтом Press Start 2P
 *   hash(n)                    – детермінований псевдовипадковий 0..1
 *   depthK(y) / depth(c,x,y,fn) – ПЕРСПЕКТИВА: предмет ближче до глядача
 *                                малюється більшим (як і Nexi)
 * ========================================================================== */
// ШВИДКОДІЯ: canvas shadowBlur (розмита тінь) дуже повільний, особливо на телефонах
// (сцена падала з 45 до 14 кадрів/с). Вимикаємо його глобально — неонове світіння
// дають швидкі радіальні відблиски NX.px.glow().
try { Object.defineProperty(CanvasRenderingContext2D.prototype, 'shadowBlur', { set() {}, get() { return 0; } }); } catch (e) {}
NX.px = (() => {
  /** Прямокутник, прив'язаний до реальних пікселів екрана — без розмитих країв. */
  const rect = (c, x, y, w, h, col) => {
    const K = NX.cam.k * (NX.loop.dpr || 1), x1 = Math.round(x * K) / K, y1 = Math.round(y * K) / K;
    c.fillStyle = col; c.fillRect(x1, y1, Math.max(1 / K, Math.round((x + w) * K) / K - x1), Math.max(1 / K, Math.round((y + h) * K) / K - y1));
  };
  function glow(c, x, y, r, col, a = 1) {
    c.save(); c.globalCompositeOperation = 'lighter'; c.globalAlpha = a;
    const g = c.createRadialGradient(x, y, 0, x, y, r); g.addColorStop(0, col); g.addColorStop(1, 'rgba(0,0,0,0)');
    c.fillStyle = g; c.fillRect(x - r, y - r, r * 2, r * 2); c.restore();
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
  return { rect, glow, text, hash, lerp, clamp, depthK, depth };
})();

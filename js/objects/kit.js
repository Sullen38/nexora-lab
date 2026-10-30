/* ============================================================================
 * objects/kit.js — СПІЛЬНІ ДРІБНИЦІ МАЛЮВАННЯ (NX.kit)
 * ----------------------------------------------------------------------------
 * Те, чим користуються кілька модулів чистої основи (власник, 29.10):
 *   rgba(rgb, a) / lit(c, x, y, w, h, col) / mix(a, b, k) — колір з прозорістю, піксельний прямокутник, змішування #rrggbb
 *   draw(c, S, R)                — растр NX.furn.Sheet у кімнату (рама вікна)
 *   ICON                         — піксельні іконки зон 7×7 (ai, chart, target, bot, gear, spiral)
 * Вивіски зон — objects/arc_kit.js (signPlate); карта світу для екранів — objects/screens.js. Старий конструктор крил (цегла й панелі 2D, будки, столи,
 * рослини, гаджети, наліпки) — в історії git (коміт a941612, objects/wing_kit.js).
 * ========================================================================== */
NX.kit = (() => {
  const P = NX.px, F = NX.furn;
  const rgba = (rgb, a) => `rgba(${rgb},${P.clamp(a, 0, 1)})`, lit = (c, x, y, w, h, col) => { c.fillStyle = col; c.fillRect(x, y, w, h); };
  // змішування кольорів (кольори кешуються — без розбору рядків щоразу)
  const RGBC = new Map(), HEX2 = Array.from({ length: 256 }, (_, v) => v.toString(16).padStart(2, '0'));
  const rgbOf = h => { let c = RGBC.get(h); if (!c) { c = [parseInt(h.slice(1, 3), 16), parseInt(h.slice(3, 5), 16), parseInt(h.slice(5, 7), 16)]; RGBC.set(h, c); } return c; };
  const mix = (a, b, k) => { if (k <= 0) return a; if (k >= 1) return b; const A = rgbOf(a), B = rgbOf(b); return '#' + HEX2[Math.round(A[0] + (B[0] - A[0]) * k)] + HEX2[Math.round(A[1] + (B[1] - A[1]) * k)] + HEX2[Math.round(A[2] + (B[2] - A[2]) * k)]; };
  const draw = (c, S, R) => { const w = S.x1 - S.x0, h = S.y1 - S.y0; c.imageSmoothingEnabled = R < 3.8; c.drawImage(F.fit(S.cv, w, h, R), S.x0, S.y0, w, h); };

  // ---------- іконки зон 7×7 (вивіски — arc_kit.js signPlate, плитки — arc_paint.js IC) ----------
  const ICON = {
    ai: ['..XXX..', '.XXXXX.', 'XX.X.XX', 'XXXXXXX', 'X.XXX.X', '.XX.XX.', '..X.X..'],
    chart: ['......X', '.....XX', '...X.XX', '..XX.XX', 'X.XX.XX', 'XXXX.XX', 'XXXXXXX'],
    target: ['..XXX..', '.X...X.', 'X..X..X', 'X.XXX.X', 'X..X..X', '.X...X.', '..XXX..'],
    bot: ['.X...X.', '..XXX..', '.XXXXX.', 'XX.X.XX', 'XXXXXXX', '.XXXXX.', '.X...X.'],      // майстерня (голова робота з антенами)
    gear: ['.X.X.X.', 'XXXXXXX', '.XX.XX.', 'XX...XX', '.XX.XX.', 'XXXXXXX', '.X.X.X.'],     // інструменти
    spiral: ['.XXXXX.', 'X.....X', 'X.XXX.X', 'X.X.X.X', 'X.X...X', 'X.XXXXX', 'X......'],   // портал
  };
  return { rgba, lit, mix, draw, ICON };
})();

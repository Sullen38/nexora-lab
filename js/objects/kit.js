/* ============================================================================
 * objects/kit.js — СПІЛЬНІ ДРІБНИЦІ МАЛЮВАННЯ (NX.kit)
 * ----------------------------------------------------------------------------
 * Те, чим користуються кілька модулів чистої основи (власник, 29.10):
 *   rgba(rgb, a) / lit(c, x, y, w, h, col) / mix(a, b, k) — колір з прозорістю, піксельний прямокутник, змішування #rrggbb
 *   draw(c, S, R)                — растр NX.furn.Sheet у кімнату (рама вікна)
 *   ICON                         — піксельні іконки зон 7×7 (ai, chart, target, bot, gear, spiral)
 *   sign(c, x, y, w, h, o)       — вивіска зони в єдиному стилі: пластина з неоновим кантом (o.acc), іконка (o.icon), напис
 *                                  NX.t(o.key) (4 мови); нерухома частина кешується під мову й масштаб
 * Живі екрани (карта, журнал, розпізнавання) — objects/screens.js. Старий конструктор крил (цегла й панелі 2D, будки, столи,
 * рослини, гаджети, наліпки) — в історії git (тег zones-v1, objects/wing_kit.js).
 * ========================================================================== */
NX.kit = (() => {
  const P = NX.px, F = NX.furn;
  const rgba = (rgb, a) => `rgba(${rgb},${P.clamp(a, 0, 1)})`, lit = (c, x, y, w, h, col) => { c.fillStyle = col; c.fillRect(x, y, w, h); };
  // змішування кольорів (кольори кешуються — без розбору рядків щоразу)
  const RGBC = new Map(), HEX2 = Array.from({ length: 256 }, (_, v) => v.toString(16).padStart(2, '0'));
  const rgbOf = h => { let c = RGBC.get(h); if (!c) { c = [parseInt(h.slice(1, 3), 16), parseInt(h.slice(3, 5), 16), parseInt(h.slice(5, 7), 16)]; RGBC.set(h, c); } return c; };
  const mix = (a, b, k) => { if (k <= 0) return a; if (k >= 1) return b; const A = rgbOf(a), B = rgbOf(b); return '#' + HEX2[Math.round(A[0] + (B[0] - A[0]) * k)] + HEX2[Math.round(A[1] + (B[1] - A[1]) * k)] + HEX2[Math.round(A[2] + (B[2] - A[2]) * k)]; };
  const draw = (c, S, R) => { const w = S.x1 - S.x0, h = S.y1 - S.y0; c.imageSmoothingEnabled = R < 3.8; c.drawImage(F.fit(S.cv, w, h, R), S.x0, S.y0, w, h); };

  // ---------- вивіска зони (єдиний стиль) ----------
  const ICON = {
    ai: ['..XXX..', '.XXXXX.', 'XX.X.XX', 'XXXXXXX', 'X.XXX.X', '.XX.XX.', '..X.X..'],
    chart: ['......X', '.....XX', '...X.XX', '..XX.XX', 'X.XX.XX', 'XXXX.XX', 'XXXXXXX'],
    target: ['..XXX..', '.X...X.', 'X..X..X', 'X.XXX.X', 'X..X..X', '.X...X.', '..XXX..'],
    bot: ['.X...X.', '..XXX..', '.XXXXX.', 'XX.X.XX', 'XXXXXXX', '.XXXXX.', '.X...X.'],      // майстерня (голова робота з антенами)
    gear: ['.X.X.X.', 'XXXXXXX', '.XX.XX.', 'XX...XX', '.XX.XX.', 'XXXXXXX', '.X.X.X.'],     // інструменти
    spiral: ['.XXXXX.', 'X.....X', 'X.XXX.X', 'X.X.X.X', 'X.X...X', 'X.XXXXX', 'X......'],   // портал
  };
  /** Вивіска: темна пластина з неоновим кантом кольору зони (acc[3]) і ореолом, кругла іконка зліва (ICON[o.icon]),
   *  напис NX.t(o.key) по центру, вогник-статус справа. c — контекст кімнати АБО пласке полотно грані (x, y, w, h — у його одиницях). */
  function signStatic(c, x, y, w, h, o, ta) {
    const acc = o.acc, r = h * .24, lw = Math.max(.8, h * .07), ix = x + h * .62, iy = y + h / 2, ir = h * .3, RR = (X, Y, W2, H2, rr) => { c.beginPath(); c.roundRect ? c.roundRect(X, Y, W2, H2, rr) : c.rect(X, Y, W2, H2); };
    c.fillStyle = '#0a0620'; RR(x, y, w, h, r); c.fill();
    c.strokeStyle = acc[3]; c.lineWidth = lw; RR(x + lw / 2, y + lw / 2, w - lw, h - lw, r); c.stroke();
    c.strokeStyle = acc[1]; c.lineWidth = lw * .55; RR(x + lw * 1.9, y + lw * 1.9, w - lw * 3.8, h - lw * 3.8, r * .7); c.stroke();
    c.strokeStyle = acc[3]; c.lineWidth = lw * .9; c.beginPath(); c.arc(ix, iy, ir, 0, 7); c.stroke(); c.fillStyle = '#06102e'; c.beginPath(); c.arc(ix, iy, ir - lw * .6, 0, 7); c.fill();
    const px = ir * 1.3 / 7; (ICON[o.icon] || ICON.ai).forEach((row, j) => [...row].forEach((ch, i) => ch === 'X' && lit(c, ix - 3.5 * px + i * px, iy - 3.5 * px + j * px, px + .05, px + .05, acc[3])));
    const s = NX.t(o.key), tx = x + h * 1.12, tw = w - h * 1.12 - h * .5, sz = Math.min(h * .42, tw / Math.max(1, s.length) * 1.1), tc = rgba(o.text || '154,246,255', ta);
    c.globalCompositeOperation = 'lighter'; P.glow(c, tx + tw / 2, iy, tw * .45, rgba(o.glow, .6), .12); c.globalCompositeOperation = 'source-over';
    P.text(c, s, tx + tw / 2 + sz * .04, iy + sz * .42, tc, sz, 'center'); P.text(c, s, tx + tw / 2, iy + sz * .42, tc, sz, 'center');
  }
  /** Нерухома частина вивіски — у кеш-полотно точно під масштаб контексту, раз на мову/масштаб: щокадру лише drawImage + живе
   *  (ореол канта дихає, вогник блимає). */
  const SIGNC = new Map();
  function sign(c, x, y, w, h, o) {
    const t = o.t || 0, r = h * .24, lw = Math.max(.8, h * .07), iy = y + h / 2, RR = (X, Y, W2, H2, rr) => { c.beginPath(); c.roundRect ? c.roundRect(X, Y, W2, H2, rr) : c.rect(X, Y, W2, H2); };
    const m = c.getTransform ? c.getTransform() : null, R = m ? Math.round(Math.hypot(m.a, m.b) * 100) / 100 : 0;
    const tw = w - h * 1.12 - h * .5, pad = Math.ceil(Math.max(lw * 2, tw * .45 - h / 2) + 1);
    c.save();
    if (R > 0 && R < 12 && !c.isRefl) {
      const key = [x, y, w, h, o.key, NX.i18n.lang, o.icon, o.acc[3], o.text, o.glow, R].join('|');
      let cv = SIGNC.get(key);
      if (!cv && (!document.fonts || document.fonts.status === 'loaded')) {             // кешуємо, коли шрифт уже завантажено
        cv = document.createElement('canvas'); cv.width = Math.ceil((w + pad * 2) * R); cv.height = Math.ceil((h + pad * 2) * R);
        const x2 = cv.getContext('2d'); x2.setTransform(R, 0, 0, R, (pad - x) * R, (pad - y) * R); signStatic(x2, x, y, w, h, o, .96); SIGNC.set(key, cv);
        if (SIGNC.size > 64) SIGNC.delete(SIGNC.keys().next().value);
      }
      if (cv) { c.imageSmoothingEnabled = false; c.drawImage(cv, x - pad, y - pad, cv.width / R, cv.height / R); }
      else signStatic(c, x, y, w, h, o, .88 + .12 * Math.sin(t * 2.2));
    } else signStatic(c, x, y, w, h, o, .88 + .12 * Math.sin(t * 2.2));
    c.globalCompositeOperation = 'lighter'; c.strokeStyle = rgba(o.glow, .3 + .14 * Math.sin(t * 1.8)); c.lineWidth = lw * 2.4; RR(x, y, w, h, r); c.stroke(); c.globalCompositeOperation = 'source-over';   // ореол канта дихає
    lit(c, x + w - h * .36, iy - h * .08, h * .16, h * .16, Math.sin(t * 3 + x) > 0 ? '#3bff8a' : '#1f6a45');
    c.restore();
  }
  return { rgba, lit, mix, draw, ICON, sign };
})();

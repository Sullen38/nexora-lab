/* ============================================================================
 * objects/decor_wall.js — МЕДІА-СТІНА «NEXORA · LIVE»: живий екран (Декор стін · 12)
 * ----------------------------------------------------------------------------
 * Власник (03.11): «акваріум з небезпечними рибами не подобається — на тому місці придумати інші варіанти»; обрано
 * «монітор-стіну»: панорамний екран на всю праву стіну за маніпулятором майстерні (рама й статичні панелі — objects/dc_paint.js
 * st:dc_vwall / wallPaint; розкладка — tools/wingbox/decor.py П2; екран — грань сегментів рами по дузі, без окремих вікон).
 * Тут — те, що рухається, на те саме полотно, що колись було водою (objects/decor.js drawAq -> NX.decorWall.draw), під маскою
 * (многокутник екрана між кришкою й тумбою — decor.js AQ.vwall.poly; маніпулятор майстерні малюється поверх, бо він попереду):
 *   • МІСТО: кур'єри (кольорові цятки зі шлейфом) їздять вулицями-сіткою навколо штабу Nexora, радар крутиться, від штабу
 *     розходяться кола-«пінги», пункти призначення пульсують;
 *   • ПРОДАЖІ: графік біжить ліворуч (лінія з сяйвом і заливкою, точка на кінці пульсує), число за сьогодні росте
 *     (NX.t('decor.wall.today'), цифри — NX.num) і стрілка-відсоток;
 *   • ЖУРНАЛ: рядки подій (NX.t('decor.wall.lines'), 4 мови) з часом (справжній годинник, мінус хвилини) прокручуються вгору
 *     раз на 3.5 с, курсор блимає;
 *   • СТАТУС: годинник HH:MM (двокрапка блимає), кільце-індикатор наповнюється, піксельна N пульсує, «ОНЛАЙН» із зеленим
 *     вогником, три смужки-метри дихають;
 *   • по всьому екрану — повільна «розгортка» згори вниз; тап по екрану (objects/decor_live.js tap -> NX.decorWall.tap) —
 *     кільце-хвиля від пальця й короткий спалах панелей.
 * Координати: x — уздовж екрана (0..T, як у малюнку wallPaint), y — від верху екрана (0..fh); -> світ -> екран: M (нижче).
 * Шрифт — як у вивісках кімнати (Press Start 2P). Кадр оновлюється через раз (decor.js), усе — кілька десятків мазків.
 * ========================================================================== */
(() => {
  const DC = NX.decor, WALL = NX.arc.WALL, VW = DC && DC.AQ && DC.AQ.vwall; if (!DC || !WALL || !VW) return;
  const X = NX.px3d, D2R = Math.PI / 180, hash = NX.art.hash, TAU = Math.PI * 2;
  /** Координати екрана (x уздовж 0..T, y 0..fh згори) -> світ: сегмент за s0, уздовж хорди сегмента при вставці P − .4, по висоті — між
   *  кришкою й тумбою цього сегмента (кінці yta/ytb, yba/ybb — на екрані рівні рядки, як і в малюнку wallPaint). */
  const M = (() => { const segs = VW.segs, d0 = segs[0], ov = VW.ov, fh = d0.H0 || ((d0.yba - d0.base + ov) - (d0.yta + d0.lid - ov));
    const seg = segs.map(q => { const a = VW.pt(q, q.sa, q.P - .4, 0), b = VW.pt(q, q.sb, q.P - .4, 0), a1 = VW.pt(q, q.sa, q.P, 0), b1 = VW.pt(q, q.sb, q.P, 0), L = Math.hypot(b1[0] - a1[0], b1[2] - a1[2]);   // x — як у малюнку (dc_paint.js st:dc_vwall): s0 = i · довжина сегмента при вставці P
      return { s0: q.i * L, len: Math.hypot(b[0] - a[0], b[2] - a[2]), a, b, ta: q.yta + q.lid - ov, tb: q.ytb + q.lid - ov, ba: q.yba - q.base + ov, bb: q.ybb - q.base + ov }; });
    const W = (x, y) => { let g = seg[0]; for (const q of seg) if (x >= q.s0) g = q; const u = Math.max(0, Math.min(1, (x - g.s0) / g.len)), t0 = g.ta + (g.tb - g.ta) * u, b0 = g.ba + (g.bb - g.ba) * u;
      return [g.a[0] + (g.b[0] - g.a[0]) * u, t0 + (b0 - t0) * y / fh, g.a[2] + (g.b[2] - g.a[2]) * u]; };
    return { W, S: (x, y) => X.proj(W(x, y)), T: seg.reduce((m, g) => Math.max(m, g.s0 + g.len), 0), fh }; })();
  const T = M.T, fh = M.fh, y0 = WALL.pad, y1 = fh - WALL.pad, tiles = WALL.tiles(T), ACC = WALL.acc;
  const sm = f => f * f * (3 - 2 * f), sOf = z => 520 / (520 + z);
  const S = (x, y) => M.S(x, y), kAt = (x, y) => sOf(M.W(x, y)[2]);
  const FONT = '"Press Start 2P", monospace';
  const path = (fx, pts, close) => { fx.beginPath(); pts.forEach(([x, y], k) => { const p = S(x, y); k ? fx.lineTo(p[0], p[1]) : fx.moveTo(p[0], p[1]); }); if (close) fx.closePath(); };
  const stroke = (fx, pts, w, col, a = 1) => { fx.globalAlpha = a; fx.strokeStyle = col; fx.lineWidth = w; fx.lineCap = 'round'; fx.lineJoin = 'round'; path(fx, pts); fx.stroke(); fx.globalAlpha = 1; };
  const dot = (fx, x, y, r, col, a = 1) => { const p = S(x, y), k = kAt(x, y); fx.globalAlpha = a; fx.fillStyle = col; fx.beginPath(); fx.arc(p[0], p[1], r * k, 0, TAU); fx.fill(); fx.globalAlpha = 1; };
  /** Текст піксельним шрифтом у точці малюнка (h — висота в од. світу; align — left / center / right). */
  const text = (fx, s, x, y, h, col, o = {}) => { const p = S(x, y), k = kAt(x, y); fx.font = `${Math.max(.5, h * k)}px ${FONT}`; if (o.maxW) { const w = fx.measureText(s).width; if (w > o.maxW * k) fx.font = `${Math.max(.5, h * k * o.maxW * k / w)}px ${FONT}`; } fx.textAlign = o.align || 'left'; fx.textBaseline = 'middle';
    if (o.glow) { fx.globalAlpha = (o.a == null ? 1 : o.a) * .4; fx.fillStyle = o.glow; fx.fillText(s, p[0] + .3 * k, p[1] + .3 * k); }
    fx.globalAlpha = o.a == null ? 1 : o.a; fx.fillStyle = col; fx.fillText(s, p[0], p[1]); fx.globalAlpha = 1; fx.textAlign = 'left'; };
  const grp = n => { const s = String(Math.max(0, Math.round(n))); return s.replace(/\B(?=(\d{3})+(?!\d))/g, ' '); };   // 12840 -> «12 840»
  let TAP = null;                                                                        // тап: { x, y — екран, t0 }

  // ---------- 1 МІСТО: кур'єри, радар, пінги ----------
  const [MX0, MX1] = tiles[0], MY0 = y0 + 8, MY1 = y1 - 1.2, MW = MX1 - MX0, MH = MY1 - MY0, NX_ = MX0 + 39, NY_ = MY0 + 21;   // сітка вулиць — як у wallPaint: x = MX0 + 6 + 11k, y = MY0 + 5 + 8k
  const sx = k => MX0 + 6 + 11 * k, sy = k => MY0 + 5 + 8 * k;
  /** Кур'єр: прямокутний маршрут по вулицях (кутки на перехрестях), швидкість і колір свої. */
  const COUR = Array.from({ length: 5 }, (_, k) => { const i0 = Math.floor(hash(k, 11) * 5), j0 = Math.floor(hash(k, 12) * 2), i1 = Math.min(7, i0 + 1 + Math.floor(hash(k, 13) * 3)), j1 = Math.min(3, j0 + 1 + Math.floor(hash(k, 14) * 2));
    return { r: [sx(i0), sy(j0), sx(i1), sy(j1)], sp: .035 + .03 * hash(k, 15), ph: hash(k, 16), col: ['#3be8ff', '#ff4fd8', '#ffd27a', '#3bff8a', '#ffffff'][k], dst: [sx(hash(k, 17) > .5 ? i0 : i1), sy(hash(k, 18) > .5 ? j0 : j1)] }; });
  const onRect = (r, u) => { const [x0, yy0, x1, yy1] = r, w = x1 - x0, h = yy1 - yy0, L = 2 * (w + h), d = ((u % 1) + 1) % 1 * L;
    return d < w ? [x0 + d, yy0] : d < w + h ? [x1, yy0 + d - w] : d < 2 * w + h ? [x1 - (d - w - h), yy1] : [x0, yy1 - (d - 2 * w - h)]; };
  function cityLive(fx, t) {
    fx.save(); path(fx, [[MX0, MY0], [MX1, MY0], [MX1, MY1], [MX0, MY1]], true); fx.clip();
    { const a = t * .9, R = Math.hypot(MW, MH) * .62; fx.globalCompositeOperation = 'lighter';                              // радар: промінь з хвостом
      for (let q = 0; q < 10; q++) { const b = a - q * .09; stroke(fx, [[NX_, NY_], [NX_ + Math.cos(b) * R, NY_ + Math.sin(b) * R * .8]], .5, '#3be8ff', .22 * (1 - q / 10)); }
      const f = (t % 3) / 3, rr = f * 30; stroke(fx, (() => { const P = []; for (let q = 0; q <= 24; q++) { const b = q / 24 * TAU; P.push([NX_ + Math.cos(b) * rr, NY_ + Math.sin(b) * rr * .8]); } return P; })(), .4, '#9af6ff', .35 * (1 - f));   // пінг від штабу
      fx.globalCompositeOperation = 'source-over'; }
    for (const C of COUR) { const u = t * C.sp + C.ph, p = onRect(C.r, u);                                                   // кур'єри зі шлейфом
      for (let q = 1; q <= 5; q++) { const b = onRect(C.r, u - q * .006); dot(fx, b[0], b[1], .9 - q * .12, C.col, .35 - q * .06); }
      dot(fx, p[0], p[1], 1.15, C.col); dot(fx, p[0], p[1], .5, '#ffffff');
      const g = .5 + .5 * Math.sin(t * 3 + C.ph * 9); dot(fx, C.dst[0], C.dst[1], .9 + g * .9, C.col, .18 + .2 * g); dot(fx, C.dst[0], C.dst[1], .4, C.col, .9); }   // пункт призначення пульсує
    { const g = .6 + .4 * Math.sin(t * 2.2); fx.globalCompositeOperation = 'lighter'; dot(fx, NX_, NY_, 5, '#ff4fd8', .12 * g); fx.globalCompositeOperation = 'source-over'; }   // штаб світиться
    fx.restore();
  }

  // ---------- 2 ПРОДАЖІ: графік біжить, число росте ----------
  const [GX0, GX1] = tiles[1], GY0 = y0 + 17, GY1 = y1 - 3.2, GN = 22, GSTEP = (GX1 - GX0 - 8) / (GN - 1), GSP = 1.6;         // GSP — точок за секунду
  const val = g => .5 + .26 * Math.sin(g * .6) + .13 * Math.sin(g * 1.7 + 1) + .09 * (hash(g & 1023, 5) - .5);
  function salesLive(fx, t) {
    const c = t * GSP, g0 = Math.floor(c), off = (c - g0) * GSTEP, pts = [];
    for (let i = -1; i <= GN; i++) { const x = GX0 + 4 + i * GSTEP - off; if (x < GX0 + 3 || x > GX1 - 3) continue; pts.push([x, GY1 - (GY1 - GY0) * (.08 + .82 * val(g0 + i))]); }
    if (pts.length < 2) return;
    fx.save(); path(fx, [[GX0 + 3, GY0 - 1], [GX1 - 3, GY0 - 1], [GX1 - 3, GY1], [GX0 + 3, GY1]], true); fx.clip();
    fx.globalCompositeOperation = 'lighter';
    { const a = [...pts, [pts[pts.length - 1][0], GY1], [pts[0][0], GY1]]; fx.globalAlpha = .14; fx.fillStyle = '#3bff8a'; path(fx, a, true); fx.fill(); fx.globalAlpha = 1; }   // заливка під лінією
    stroke(fx, pts, 1.6, '#3bff8a', .25); stroke(fx, pts, .55, '#9affc0');                                                   // лінія з сяйвом
    const e = pts[pts.length - 1], g = .5 + .5 * Math.sin(t * 5); dot(fx, e[0], e[1], 1.2 + g, '#3bff8a', .35); dot(fx, e[0], e[1], .6, '#ffffff');   // точка на кінці пульсує
    fx.globalCompositeOperation = 'source-over'; fx.restore();
    const n = 12840 + Math.floor(t * 1.7), pct = 12 + Math.round(4 * Math.sin(t * .05));                                     // число за сьогодні росте
    text(fx, NX.t('decor.wall.today'), GX0 + 3.5, GY0 - 5, 3, '#9af6ff', { align: 'left', a: .85, maxW: 24 });
    text(fx, '+' + grp(n), GX1 - 3, GY0 - 5, 6, '#d8ffe8', { align: 'right', glow: '#3bff8a', maxW: 40 });
    text(fx, '+' + pct + '%', GX0 + 3.5, GY0 + 3.5, 3.2, '#3bff8a', { align: 'left' });
  }

  // ---------- 3 ЖУРНАЛ: рядки подій прокручуються ----------
  const [LX0, LX1] = tiles[2], LROW = (y1 - y0 - 10) / 3, LY0 = y0 + 9, LPER = 3.5, LCOL = ['#3bff8a', '#3be8ff', '#ff4fd8', '#ffd27a'];
  const hhmm = (d, blink) => `${String(d.getHours()).padStart(2, '0')}${blink ? ':' : ' '}${String(d.getMinutes()).padStart(2, '0')}`;
  function logLive(fx, t) {
    const L = NX.t('decor.wall.lines'); if (!Array.isArray(L) || !L.length) return; const idx = Math.floor(t / LPER), f = sm((t % LPER) / LPER), now = Date.now();
    fx.save(); path(fx, [[LX0, y0 + 6.6], [LX1, y0 + 6.6], [LX1, y1], [LX0, y1]], true); fx.clip();
    void now;
    for (let r = 0; r <= 3; r++) { const li = (((idx - 2 + r) % L.length) + L.length) % L.length, y = LY0 + (r - f) * LROW + LROW * .5, a = r === 0 ? 1 - f : r === 3 ? f : 1, last = r === 2;   // рядок 0 іде вгору, 3 — заходить знизу
      dot(fx, LX0 + 3.6, y, 1.1 + (last ? .5 * (.5 + .5 * Math.sin(t * 6)) : 0), LCOL[li % 4], a);
      text(fx, L[li], LX0 + 7.2, y, 4.2, last ? '#fff4d0' : '#ffd27a', { a: a * (last ? 1 : .75), glow: last ? '#ffd27a' : null, maxW: LX1 - LX0 - 10.5 }); }
    fx.restore();
  }

  // ---------- 4 СТАТУС: годинник, кільце, N, метри ----------
  const [SX0, SX1] = tiles[3], SCX = SX0 + (SX1 - SX0) * .3, SCY = y0 + 9 + (y1 - y0 - 9) * .56, SW = SX1 - SX0;
  const NROWS = ['X...X', 'XX..X', 'X.X.X', 'X..XX', 'X...X'];
  function statusLive(fx, t) {
    const d = new Date(), blink = Math.floor(t * 2) % 2 === 0;
    text(fx, hhmm(d, blink), SX1 - 2.5, y0 + 9 + (y1 - y0 - 9) * .3, 5.2, '#ffffff', { align: 'right', glow: '#ff4fd8', maxW: SW * .58 });   // годинник (праворуч від кільця)
    { const f = (t * .06) % 1, R = 8.2, k = kAt(SCX, SCY), p = S(SCX, SCY); fx.save(); fx.globalCompositeOperation = 'lighter';   // кільце наповнюється
      fx.strokeStyle = '#ff4fd8'; fx.lineWidth = 1.8 * k; fx.lineCap = 'round'; fx.globalAlpha = .8; fx.beginPath(); fx.ellipse(p[0], p[1], R * k, R * k * .92, 0, -TAU / 4, -TAU / 4 + TAU * f); fx.stroke();
      fx.globalAlpha = .9; fx.fillStyle = '#ffffff'; const a = -TAU / 4 + TAU * f; fx.beginPath(); fx.arc(p[0] + Math.cos(a) * R * k, p[1] + Math.sin(a) * R * k * .92, .55 * k, 0, TAU); fx.fill();
      const g = .7 + .3 * Math.sin(t * 2.4); fx.globalAlpha = g; fx.fillStyle = '#9af6ff';                                   // піксельна N пульсує
      NROWS.forEach((row, j) => [...row].forEach((ch, i) => { if (ch === 'X') { const q = S(SCX - 3.75 + i * 1.5 + .75, SCY - 3.75 + j * 1.5 + .75); fx.fillRect(q[0] - .77 * k, q[1] - .77 * k, 1.54 * k, 1.54 * k); } }));
      fx.restore(); }
    { const on = .6 + .4 * Math.sin(t * 3.1), ox = SX0 + SW * .58, oy = y0 + 9 + (y1 - y0 - 9) * .62; dot(fx, ox, oy, 1.4 + on * .8, '#3bff8a', .35 * on); dot(fx, ox, oy, .9, '#3bff8a'); text(fx, NX.t('decor.wall.online'), ox + 3, oy, 3, '#bff8ff', { a: .95, maxW: SW * .4 - 3 }); }   // ОНЛАЙН
    for (let q = 0; q < 4; q++) { const h = 2.5 + 5 * (.5 + .5 * Math.sin(t * (.9 + q * .37) + q * 2)), x = SX0 + SW * .6 + q * 3.4, p0 = S(x, y1 - 2.4), p1 = S(x, y1 - 2.4 - h), k = kAt(x, y1 - 2.4);   // метри дихають
      fx.fillStyle = ['#3be8ff', '#ff4fd8', '#ffd27a', '#3bff8a'][q]; fx.globalAlpha = .85; fx.fillRect(Math.min(p0[0], p1[0]) - .9 * k, p1[1], 1.8 * k, p0[1] - p1[1]); fx.globalAlpha = 1; }
  }

  // ---------- увесь екран: розгортка, тап ----------
  function screenFx(fx, t) {
    { const f = (t * .11) % 1, y = y0 + (y1 - y0) * f; fx.save(); fx.globalCompositeOperation = 'lighter';                   // розгортка згори вниз
      for (const [x0, x1] of tiles) { fx.globalAlpha = .07; fx.fillStyle = '#9af6ff'; path(fx, [[x0, y - 1.2], [x1, y - 1.2], [x1, y + .4], [x0, y + .4]], true); fx.fill(); } fx.restore(); }
    if (TAP) { const a = t - TAP.t0; if (a < 0 || a > 1.3) TAP = null; else { const f = a / 1.3; fx.save(); fx.globalCompositeOperation = 'lighter';   // тап: кільце-хвиля й спалах панелей
      for (const [x0, x1] of tiles) { fx.globalAlpha = .18 * (1 - f) * (1 - f); fx.fillStyle = '#9af6ff'; path(fx, [[x0, y0], [x1, y0], [x1, y1], [x0, y1]], true); fx.fill(); }
      fx.globalAlpha = .8 * (1 - f); fx.strokeStyle = '#9af6ff'; fx.lineWidth = .8; fx.beginPath(); fx.arc(TAP.x, TAP.y, 2 + f * 26, 0, TAU); fx.stroke();
      fx.globalAlpha = .4 * (1 - f); fx.lineWidth = .4; fx.beginPath(); fx.arc(TAP.x, TAP.y, 1 + f * 16, 0, TAU); fx.stroke(); fx.restore(); } }
  }

  NX.decorWall = {
    /** Кадр екрана на полотно fx (координати кімнати; маску скла накладає objects/decor.js). */
    draw(fx, A, t) { void A; fx.save(); fx.imageSmoothingEnabled = true; cityLive(fx, t); salesLive(fx, t); logLive(fx, t); statusLive(fx, t); screenFx(fx, t); fx.restore(); },
    /** Тап по екрану (objects/decor_live.js): хвиля від пальця. -> true */
    tap(x, y, t) { TAP = { x, y, t0: t }; return true; },
    tiles, T, fh,
  };
})();

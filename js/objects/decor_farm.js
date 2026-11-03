/* ============================================================================
 * objects/decor_farm.js — ВЕРТИКАЛЬНА ФЕРМА NEXI: живе (Декор стін · 13)
 * ----------------------------------------------------------------------------
 * Власник (03.11, на · 12): «не подобається мені той екран — що ще можна туди придумати» → «давай 7-й варіант» — вертикальна
 * ферма. Рама й нерухоме нутро — objects/dc_paint.js (st:dc_farm / farmPaint; розкладка — tools/wingbox/decor.py П2). Тут — те,
 * що рухається, на те саме полотно, що колись було водою (objects/decor.js drawAq -> NX.decorFarm.draw), під маскою нутра
 * (маніпулятор майстерні малюється поверх — він попереду):
 *   • ЛОТКИ з рослинами їдуть по колу (патерностер): верхньою полицею — праворуч, у правій шахті опускаються (ховаються),
 *     нижньою — ліворуч, у лівій шахті — ЗБІР (спалах, іскри, листочки летять у кошик) і підйом; наверх виходять уже засіяними.
 *     Рослина РОСТЕ дорогою: на верхній полиці — паросток → кущик, на нижній — доростає й плодоносить. 14 лотків — 14 ВИДІВ,
 *     кожен один раз (салат, базилік, полуниця, томат чері, чилі, м'ята, мікрозелень, кейл, карликовий соняшник, лохина, огірок,
 *     морква, редис, горох); спрайти — піксель-арт, 6 стадій росту на вид (кеш).
 *   • ФІТОЛАМПИ дихають (рожево-фіолетове світло на ряди), з форсунок крапельних труб раз на кілька секунд іде ТУМАН, КРАПЛІ
 *     падають у лотки, рослини ледь гойдаються під вентиляцією.
 *   • тап по фермі (objects/decor_live.js tap -> NX.decorFarm.tap) — хмарка туману від пальця, рослини поруч трусяться.
 * Координати: x — уздовж нутра (0..T, як у farmPaint), y — від верху (0..fh); -> світ -> екран: M (нижче).
 * ========================================================================== */
(() => {
  const DC = NX.decor, FARM = NX.arc.FARM, VW = DC && DC.AQ && DC.AQ.farm; if (!DC || !FARM || !VW) return;
  const X = NX.px3d, hash = NX.art.hash, TAU = Math.PI * 2, { sprite, glowSpr } = DC;
  /** Координати нутра (x уздовж 0..T, y 0..fh згори) -> світ: сегмент за s0, уздовж хорди сегмента при вставці P − .4, по висоті — між
   *  кришкою й тумбою цього сегмента (кінці yta/ytb, yba/ybb — на екрані рівні рядки, як і в малюнку farmPaint). */
  const M = (() => { const segs = VW.segs, d0 = segs[0], ov = VW.ov, fh = d0.H0 || ((d0.yba - d0.base + ov) - (d0.yta + d0.lid - ov));
    const seg = segs.map(q => { const a = VW.pt(q, q.sa, q.P - .4, 0), b = VW.pt(q, q.sb, q.P - .4, 0), a1 = VW.pt(q, q.sa, q.P, 0), b1 = VW.pt(q, q.sb, q.P, 0), L = Math.hypot(b1[0] - a1[0], b1[2] - a1[2]);
      return { s0: q.i * L, len: Math.hypot(b[0] - a[0], b[2] - a[2]), a, b, ta: q.yta + q.lid - ov, tb: q.ytb + q.lid - ov, ba: q.yba - q.base + ov, bb: q.ybb - q.base + ov }; });
    const W = (x, y) => { let g = seg[0]; for (const q of seg) if (x >= q.s0) g = q; const u = Math.max(0, Math.min(1, (x - g.s0) / g.len)), t0 = g.ta + (g.tb - g.ta) * u, b0 = g.ba + (g.bb - g.ba) * u;
      return [g.a[0] + (g.b[0] - g.a[0]) * u, t0 + (b0 - t0) * y / fh, g.a[2] + (g.b[2] - g.a[2]) * u]; };
    return { W, S: (x, y) => X.proj(W(x, y)), T: seg.reduce((m, g) => Math.max(m, g.s0 + g.len), 0), fh }; })();
  const T = M.T, fh = M.fh, SH = FARM.shaft, sOf = z => 520 / (520 + z), S = (x, y) => M.S(x, y), kAt = (x, y) => sOf(M.W(x, y)[2]);
  const sm = f => f * f * (3 - 2 * f);
  const quadF = (fx, pts, fill, a = 1) => { fx.globalAlpha = a; fx.fillStyle = fill; fx.beginPath(); pts.forEach(([x, y], k) => { const p = S(x, y); k ? fx.lineTo(p[0], p[1]) : fx.moveTo(p[0], p[1]); }); fx.closePath(); fx.fill(); fx.globalAlpha = 1; };
  let TAP = null;

  // ---------- рослини: 14 видів × 6 стадій (кеш спрайтів 24×22; низ стебла — (12, 21)) ----------
  const KINDS = ['lettuce', 'basil', 'strawberry', 'tomato', 'chili', 'mint', 'micro', 'kale', 'sunflower', 'blueberry', 'cucumber', 'carrot', 'radish', 'pea'];
  const G1 = '#2a8a3a', G2 = '#4ac84a', G3 = '#9aff6a', DG = '#1a5a2a';
  /** Листок-крапля від (x, y) у напрямку a (рад), довжина l, ширина w. */
  const leaf = (S, x, y, a, l, w, c1, c2) => { const ex = x + Math.cos(a) * l, ey = y + Math.sin(a) * l, nx = -Math.sin(a) * w, ny = Math.cos(a) * w; S.tri([[x, y], [x + (ex - x) * .5 + nx, y + (ey - y) * .5 + ny], [ex, ey]], c1); S.tri([[x, y], [x + (ex - x) * .5 - nx, y + (ey - y) * .5 - ny], [ex, ey]], c2 || c1); };
  const stem = (S, x0, y0, x1, y1, c = DG) => S.line(x0, y0, x1, y1, c);
  function drawPlant(S, kind, s) {                                                       // s — стадія 0..1 (розмір і деталі)
    const k = .3 + .7 * s, bx = 12, by = 21, ripe = s > .62, h = 14 * k;
    switch (kind) {
      case 'lettuce': for (let q = 0; q < 10; q++) { const a = -Math.PI + q / 10 * Math.PI, r = 5.5 * k; leaf(S, bx, by - 1, a, r + (q % 2) * 2, 2.2 * k, q % 2 ? G2 : G3, G1); } S.ell(bx, by - 2 * k, 2.5 * k, 1.6 * k, '#c8ff9a'); break;
      case 'basil': stem(S, bx, by, bx, by - h); for (let q = 0; q < 4; q++) { const y = by - h * (.3 + q * .22); leaf(S, bx, y, -2.6, 4.5 * k, 1.8 * k, G1, G2); leaf(S, bx, y, -.55, 4.5 * k, 1.8 * k, G2, G1); } if (ripe) { S.set(bx, by - h - 1, '#ffffff'); S.set(bx - 1, by - h - 1, '#f0e8ff'); S.set(bx + 1, by - h - 1, '#f0e8ff'); } break;
      case 'strawberry': for (let q = 0; q < 6; q++) { const a = -Math.PI + .3 + q / 5 * (Math.PI - .6); leaf(S, bx, by, a, 5 * k, 2 * k, q % 2 ? G1 : G2, DG); } if (ripe) for (const [dx, dy] of [[-4, -1], [3, -2], [0, -4]]) { S.ell(bx + dx * k, by + dy * k, 1.6, 1.9, '#ff3a4a'); S.set(bx + dx * k, by + dy * k, '#ffe08a'); S.set(bx + dx * k - 1, by + dy * k - 2, '#3bff8a'); } break;
      case 'tomato': stem(S, bx, by, bx + 1, by - h); for (let q = 0; q < 3; q++) { const y = by - h * (.35 + q * .25); leaf(S, bx, y, -2.4 - q * .1, 5 * k, 1.5 * k, G1, G2); leaf(S, bx + 1, y - 1, -.6, 4 * k, 1.4 * k, G2, G1); } if (ripe) for (const [dx, dy] of [[-3, -6], [-1, -8], [3, -5], [4, -9]]) { S.ell(bx + dx * k, by + dy * k, 1.5, 1.5, s > .85 ? '#ff4a2a' : '#ffa03a'); S.set(bx + dx * k - 1, by + dy * k - 1, '#ffd0b0'); } break;
      case 'chili': stem(S, bx, by, bx, by - h * .8); for (let q = 0; q < 5; q++) { const a = -Math.PI * .9 + q * .4; leaf(S, bx, by - h * .5, a, 5 * k, 1.6 * k, G1, G2); } if (ripe) for (const [dx, dy, c] of [[-4, -3, '#ff3a2a'], [3, -2, '#ffd23a'], [0, -1, '#ff6a2a']]) { S.line(bx, by - h * .5, bx + dx * k, by + dy * k, DG); S.line(bx + dx * k, by + dy * k, bx + dx * k * 1.3, by + dy * k + 3, c, 255, 2); } break;
      case 'mint': for (let q = 0; q < 3; q++) { const x0 = bx + (q - 1) * 3 * k; stem(S, x0, by, x0, by - h * (.7 + .1 * q)); for (let w = 0; w < 3; w++) { const y = by - h * (.25 + w * .22); S.ell(x0 - 2 * k, y, 2 * k, 1.3 * k, w % 2 ? G3 : G2); S.ell(x0 + 2 * k, y - .6, 2 * k, 1.3 * k, w % 2 ? G2 : G3); } } break;
      case 'micro': for (let q = 0; q < 18 * k + 4; q++) { const x = bx - 7 + q * (14 / (18 * k + 4)), hh = (4 + 3 * hash(q, 3)) * (.5 + .5 * s); stem(S, x, by, x + (hash(q, 5) - .5) * 2, by - hh, G2); S.set(x + (hash(q, 5) - .5) * 2, by - hh - 1, q % 3 ? G3 : '#e8ffb0'); } break;
      case 'kale': for (let q = 0; q < 8; q++) { const a = -Math.PI + .2 + q / 7 * (Math.PI - .4); leaf(S, bx, by, a, 6 * k + (q % 2), 2.4 * k, q % 2 ? '#7a3aa8' : '#5a2a8a', '#2a6a4a'); S.set(bx + Math.cos(a) * 6 * k, by + Math.sin(a) * 6 * k, '#c88aff'); } break;
      case 'sunflower': stem(S, bx, by, bx, by - h, DG); leaf(S, bx, by - h * .4, -2.5, 5 * k, 2 * k, G1, G2); leaf(S, bx, by - h * .6, -.6, 5 * k, 2 * k, G2, G1); if (ripe) { for (let q = 0; q < 10; q++) { const a = q / 10 * TAU; S.ell(bx + Math.cos(a) * 3.2, by - h - 1 + Math.sin(a) * 3.2, 1.3, 1.3, q % 2 ? '#ffd23a' : '#ffb01a'); } S.ell(bx, by - h - 1, 2, 2, '#5a3a1a'); S.set(bx - 1, by - h - 2, '#8a6a3a'); } else S.ell(bx, by - h - 1, 1.5, 1.5, G2); break;
      case 'blueberry': for (let q = 0; q < 4; q++) { const a = -Math.PI * .85 + q * .25; const ex = bx + Math.cos(a) * h, ey = by + Math.sin(a) * h; stem(S, bx, by, ex, ey, '#5a4a2a'); for (let w = 0; w < 3; w++) leaf(S, bx + (ex - bx) * (.35 + w * .3), by + (ey - by) * (.35 + w * .3), a + (w % 2 ? 1.2 : -1.2), 2.6 * k, 1 * k, G1, G2); if (ripe) { S.ell(ex, ey - 1, 1.2, 1.2, '#3a4ad8'); S.set(ex - 1, ey - 2, '#8aa0ff'); } } break;
      case 'cucumber': stem(S, bx - 6, by, bx + 6, by - h, DG); for (let q = 0; q < 3; q++) { const u = .2 + q * .3, x = bx - 6 + 12 * u, y = by - h * u; S.ell(x, y - 2, 2.6 * k, 2.2 * k, q % 2 ? G2 : G1); S.set(x, y - 2, DG); } if (ripe) { S.line(bx + 1, by - h * .55, bx + 1, by - h * .55 + 5, '#2a9a3a', 255, 2); S.set(bx + 1, by - h * .55 + 5, '#1a6a2a'); S.set(bx + 2, by - h * .55 + 2, '#9aff9a'); } break;
      case 'carrot': for (let q = 0; q < 7; q++) { const a = -Math.PI * .9 + q * .3, l = h * (.6 + .4 * hash(q, 7)); stem(S, bx, by - 1, bx + Math.cos(a) * l, by - 1 + Math.sin(a) * l, q % 2 ? G2 : G3); for (let w = 1; w < 4; w++) S.set(bx + Math.cos(a) * l * w / 4 + (w % 2 ? 1 : -1), by - 1 + Math.sin(a) * l * w / 4, G3); } if (ripe) { S.ell(bx, by, 2.2, 1.2, '#ff8a2a'); S.set(bx - 1, by - 1, '#ffb060'); } break;
      case 'radish': for (let q = 0; q < 5; q++) { const a = -Math.PI * .85 + q * .32; S.ell(bx + Math.cos(a) * 4 * k, by - 2 + Math.sin(a) * 4 * k, 2.4 * k, 1.8 * k, q % 2 ? G2 : G1); stem(S, bx, by, bx + Math.cos(a) * 3 * k, by - 2 + Math.sin(a) * 3 * k, '#c84a8a'); } if (ripe) { S.ell(bx, by, 2.4, 1.6, '#e83a7a'); S.set(bx - 1, by - 1, '#ff9ac8'); } break;
      case 'pea': { const tx = bx - 3, ty = by - h - 1; S.line(tx, by, tx, ty, '#8a7a5a'); S.line(tx + 6, by, tx + 6, ty, '#8a7a5a'); S.line(tx, ty, tx + 6, ty, '#8a7a5a');
        for (let q = 0; q < 6 * k + 2; q++) { const y = by - q * 2.2, x = tx + 3 + Math.sin(q * 1.3) * 3; S.set(x, y, G2); S.set(x + 1, y - 1, G3); S.set(x - 1, y - 1, G2); }
        if (ripe) for (const [dx, dy] of [[-1, -6], [4, -9], [2, -3]]) { S.line(bx + dx, by + dy, bx + dx + 1, by + dy + 3, '#5ad84a', 255, 2); S.set(bx + dx, by + dy + 1, '#c8ff9a'); } break; }
    }
  }
  const PS = {}; const plantSpr = (kind, s) => { const st = Math.min(5, Math.floor(s * 6)), key = kind + st; return PS[key] || (PS[key] = sprite(24, 22, S => drawPlant(S, kind, (st + .5) / 6), true)); };

  // ---------- лотки по колу ----------
  const V = 34, X0 = SH + FARM.trayW / 2 + 1, X1 = T - SH - FARM.trayW / 2 - 1, RUN = X1 - X0, LOOP = 2 * RUN + 2 * V, SPEED = 1.5;   // од./с; коло ≈ 5–6 хв
  const N = KINDS.length, TR = KINDS.map((kind, k) => ({ kind, k, off: k / N * LOOP, sway: hash(k, 9) * TAU }));
  /** Де лоток у час t: { x, y (низ лотка), row (0 верх / 1 низ), s — стадія, hide — наскільки в шахті (0..1), harv — фаза збору (0..1) }. */
  function trayAt(tr, t) {
    const p = (((tr.off + t * SPEED) % LOOP) + LOOP) % LOOP;
    if (p < RUN) return { x: X0 + p, y: FARM.rail1, row: 0, s: .05 + .5 * (p / RUN), hide: 0 };                                   // верхня полиця — праворуч
    if (p < RUN + V) return { x: X1 + 2, y: FARM.rail1 + (fh - 1.4 - FARM.rail1) * (p - RUN) / V, row: 0, s: .55, hide: 1 };    // права шахта — вниз
    if (p < 2 * RUN + V) { const q = p - RUN - V; return { x: X1 - q, y: fh - 1.4, row: 1, s: .55 + .45 * (q / RUN), hide: 0 }; }   // нижня полиця — ліворуч
    const q = (p - 2 * RUN - V) / V; return { x: X0 - 2, y: fh - 1.4 - (fh - 1.4 - FARM.rail1) * q, row: 1, s: q < .15 ? 1 : .05, hide: 1, harv: q < .5 ? q / .5 : -1 };   // ліва шахта — збір і вгору
  }
  function drawTray(fx, tr, t) {
    const A = trayAt(tr, t); if (A.hide) return A;
    const w = FARM.trayW, hh = FARM.trayH, x = A.x, y = A.y, e = Math.max(0, Math.min(1, (x - (SH - 2)) / 6, ((T - SH + 2) - x) / 6));   // біля шахт — ховається (як за дверцята)
    if (e <= 0) return A;
    quadF(fx, [[x - w / 2, y - hh], [x + w / 2, y - hh], [x + w / 2 - .6, y], [x - w / 2 + .6, y]], '#2a3038', e);               // лоток
    quadF(fx, [[x - w / 2 + 1, y - hh], [x + w / 2 - 1, y - hh], [x + w / 2 - 1.2, y - hh + 1], [x - w / 2 + 1.2, y - hh + 1]], '#5a3a22', e);   // субстрат
    quadF(fx, [[x - w / 2, y - hh], [x + w / 2, y - hh], [x + w / 2, y - hh + .4], [x - w / 2, y - hh + .4]], '#6a7a8a', e);
    const sp = plantSpr(tr.kind, A.s), p = S(x, y - hh + .6), k = kAt(x, y), sc = (16 + 11 * Math.min(1, A.s + .25)) * k / 24;     // рослина: ширина 16–27 од. (ряд — ~28 од.)
    const boost = TAP && Math.abs(TAP.fx - x) < 30 && t - TAP.t0 < 1.6 ? 1 - (t - TAP.t0) / 1.6 : 0, sw = Math.sin(t * 1.7 + tr.sway) * .03 + boost * Math.sin(t * 22) * .12;
    fx.save(); fx.globalAlpha = e; fx.translate(p[0], p[1]); fx.rotate(sw); fx.drawImage(sp.cv, -12 * sc, -21 * sc, 24 * sc, 22 * sc); fx.restore();
    return A;
  }
  // ---------- світло, туман, краплі ----------
  const MIST = glowSpr('#d8f4ff', 5), LAMP = glowSpr('#ff4fd8', 8);
  const NOZ = []; for (let x = SH + FARM.nozzle / 2; x < T - SH; x += FARM.nozzle) NOZ.push(x);
  const GRAD = new WeakMap();                                                              // градієнти фітосвітла — раз на полотно (координати кімнати не змінюються)
  function lampsLive(fx, t) {
    fx.save(); fx.globalCompositeOperation = 'lighter';
    let gs = GRAD.get(fx); if (!gs) { gs = [[FARM.lamp1, FARM.rail1 - 2], [FARM.lamp2, fh - 2]].map(([y0, y1]) => { const p0 = S(SH + 1, y0), p1 = S(T - SH - 1, y1), g = fx.createLinearGradient(0, p0[1], 0, p1[1]); g.addColorStop(0, 'rgba(255,79,216,.5)'); g.addColorStop(.5, 'rgba(200,80,255,.2)'); g.addColorStop(1, 'rgba(120,60,255,0)'); return g; }); GRAD.set(fx, gs); }
    [[FARM.lamp1, FARM.rail1 - 2, 0], [FARM.lamp2, fh - 2, 2]].forEach(([y0, y1, ph], q) => { fx.globalAlpha = .75 + .2 * Math.sin(t * .9 + ph);   // фітосвітло дихає
      fx.fillStyle = gs[q]; fx.beginPath(); [[SH + 1, y0], [T - SH - 1, y0], [T - SH - 1, y1], [SH + 1, y1]].forEach(([x, y], k) => { const p = S(x, y); k ? fx.lineTo(p[0], p[1]) : fx.moveTo(p[0], p[1]); }); fx.closePath(); fx.fill(); });
    for (let q = 0; q < NOZ.length; q++) for (const [py, ty] of [[FARM.pipe1, FARM.lamp1], [FARM.pipe2, FARM.lamp2]]) {                 // точкове сяйво ламп над форсунками
      const p = S(NOZ[q], ty), k = kAt(NOZ[q], ty), r = LAMP.r * k * (.8 + .1 * Math.sin(t * 2 + q)); fx.globalAlpha = .3; fx.drawImage(LAMP.cv, p[0] - r, p[1] - r * .5, r * 2, r); void py; }
    fx.restore();
  }
  function mistLive(fx, t) {
    fx.save(); fx.globalCompositeOperation = 'lighter';
    for (let q = 0; q < NOZ.length; q++) for (const [py, row] of [[FARM.pipe1, 0], [FARM.pipe2, 1]]) {
      const per = 7 + (q % 3), ph = ((t + q * 1.7 + row * 3.1) % per); if (ph > 2.4) continue;                                       // форсунка раз на per с — 2.4 с туману
      for (let m = 0; m < 6; m++) { const f = Math.min(1, Math.max(0, (ph - m * .12) / 2.2)); if (f <= 0 || f >= 1) continue; const dx = (hash(m + q * 7, 4) - .5) * 14 * f, dy = 1.5 + f * 9 + Math.sin(t * 2 + m) * .5, x = NOZ[q] + dx, y = py + dy, p = S(x, y), r = MIST.r * kAt(x, y) * (.5 + f);
        fx.globalAlpha = .28 * (1 - f) * Math.min(1, f * 4); fx.drawImage(MIST.cv, p[0] - r, p[1] - r * .7, r * 2, r * 1.4); }
      const dp = (t * .9 + q * .37 + row) % 3; if (dp < 1) { const y = py + 1.5 + dp * dp * (row ? fh - 3 - py : FARM.rail1 - 4 - py), p = S(NOZ[q], y);   // крапля з форсунки
        fx.globalAlpha = .9; fx.fillStyle = '#c8f4ff'; fx.fillRect(p[0] - .25, p[1] - .5, .5, 1); fx.fillStyle = '#ffffff'; fx.fillRect(p[0] - .12, p[1] - .5, .25, .3); }
    }
    if (TAP) { const a = t - TAP.t0; if (a > 1.6) TAP = null; else for (let m = 0; m < 9; m++) { const f = Math.min(1, Math.max(0, (a - m * .05) / 1.4)); if (f <= 0 || f >= 1) continue; const ang = hash(m, 11) * TAU, r0 = f * (6 + 8 * hash(m, 12)), x = TAP.fx + Math.cos(ang) * r0, y = TAP.fy + Math.sin(ang) * r0 * .6 - f * 3, p = S(x, y), r = MIST.r * kAt(x, y) * (.6 + f);   // тап — хмарка від пальця
      fx.globalAlpha = .4 * (1 - f); fx.drawImage(MIST.cv, p[0] - r, p[1] - r * .7, r * 2, r * 1.4); } }
    fx.restore();
  }
  /** Збір у лівій шахті: іскри, листочки летять у кошик, спалах. */
  function harvestFx(fx, A, t, tr) {
    if (!A || A.harv == null || A.harv < 0) return; const f = A.harv, cx = SH / 2, cy = fh - 6;
    fx.save(); fx.globalCompositeOperation = 'lighter'; const p = S(cx, cy), k = kAt(cx, cy);
    fx.globalAlpha = .5 * Math.sin(f * Math.PI); const r = (4 + 6 * f) * k; fx.strokeStyle = '#9aff9a'; fx.lineWidth = .6 * k; fx.beginPath(); fx.arc(p[0], p[1] - 3 * k, r, 0, TAU); fx.stroke();
    for (let q = 0; q < 7; q++) { const a = hash(q + tr.k * 9, 21) * TAU, d = (2 + 7 * f) * k, px = p[0] + Math.cos(a) * d, py = p[1] - 4 * k + Math.sin(a) * d * .6 + f * f * 8 * k; fx.globalAlpha = .9 * (1 - f); fx.fillStyle = q % 2 ? '#3bff8a' : '#e8ffb0'; fx.fillRect(px - .4 * k, py - .4 * k, .8 * k, .8 * k); }
    fx.restore();
  }

  NX.decorFarm = {
    /** Кадр ферми на полотно fx (координати кімнати; маску нутра накладає objects/decor.js). */
    draw(fx, A, t) { void A; fx.save(); fx.imageSmoothingEnabled = true; lampsLive(fx, t);
      const back = [], front = []; for (const tr of TR) (trayAt(tr, t).row === 0 ? back : front).push(tr);                            // верхня полиця — далі за нижню (лампи між ними)
      for (const tr of [...back, ...front]) { const a = drawTray(fx, tr, t); harvestFx(fx, a, t, tr); }
      mistLive(fx, t); fx.restore(); },
    /** Тап по фермі (objects/decor_live.js): x, y — екран -> точка нутра; хмарка туману, рослини поруч трусяться. -> true */
    tap(x, y, t) { let best = null, bd = 1e9; for (let fx_ = 0; fx_ <= T; fx_ += 4) for (const fy of [8, fh / 2, fh - 6]) { const p = S(fx_, fy), d = Math.hypot(p[0] - x, p[1] - y); if (d < bd) { bd = d; best = [fx_, fy]; } }
      TAP = { fx: best[0], fy: best[1], t0: t }; return true; },
    trayAt, TR, T, fh,
  };
})();

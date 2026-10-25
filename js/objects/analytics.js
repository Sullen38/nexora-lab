/* ============================================================================
 * objects/analytics.js — ЗОНА АНАЛІТИКИ (окремий об'єкт, піксель-арт кодом)
 * ----------------------------------------------------------------------------
 * Перемальовано на ТОМУ САМОМУ місці й у тому самому стилі, що на картинці
 * кімнати (власник: "збережи стиль та інтер'єр"), але чітко й живо:
 *   БУДКА  — темно-синя панель з блакитним кантом; верх трохи скошений (як на
 *            картинці — на ньому стоїть велика строката рослина, wing_plants.js);
 *            вивіска з іконкою і написом "АНАЛІТИКА" (мова — NX.t), два голо-екрани:
 *            ліворуч — користувачі й стовпчики, праворуч — графік і "пончик";
 *            помаранчева LED-смужка справа, вогники знизу; бічна грань — до вікна
 *   СТІЛ   — рожевий неоновий край стільниці, тумби з шухлядами, темна ніша з
 *            неоновою смужкою; на столі ноутбук і планшет (живі екрани), горнятко
 *            з парою, світний кубик; бічна грань стільниці "тікає" до вікна
 * Коли Nexi працює тут (activities: obj 'analytics'), екрани прискорюються,
 * підсвічуються і показують приріст. Крісло — objects/office.js (NX.chairA).
 * Координати — одиниці кімнати (як у core/config.js).
 * ========================================================================== */
(() => {
  const P = NX.px, F = NX.furn, { NAVY, PINK, CYAN, HOLO, DESK, LIL, CHROME } = F.PAL, ramp = F.ramp;
  const rgba = (rgb, a) => `rgba(${rgb},${P.clamp(a, 0, 1)})`, lit = (c, x, y, w, h, col) => { c.fillStyle = col; c.fillRect(x, y, w, h); };
  const noise = (t, i) => .5 + .26 * Math.sin(t * 1.3 + i * 1.7) + .16 * Math.sin(t * 2.9 + i * 3.1) + .08 * Math.sin(t * 5.3 + i * .7);

  // ---------- розкладка (одиниці кімнати, як на картинці) ----------
  const BOOTH = { l: 318, r: 476, tl: 132, tr: 146, b: 276, bl: 275.5, br: 278 };   // жовта рамка власника: більша, верх 132→146 (сходиться до вікна)   // за жовтою лінією власника: верх 147→158, низ 275.5→278 (будка в перспективі, тікає до вікна)
  const topAt = X => BOOTH.tl + (X - BOOTH.l) * (BOOTH.tr - BOOTH.tl) / (BOOTH.r - BOOTH.l), botAt = X => BOOTH.bl + (X - BOOTH.l) * (BOOTH.br - BOOTH.bl) / (BOOTH.r - BOOTH.l);
  /** Точка на будці за частками (u — уздовж, v — згори вниз): усе на будці лягає в її перспективу. */
  const bp = (u, v) => { const X = BOOTH.l + u * (BOOTH.r - BOOTH.l); return [X, topAt(X) + v * (botAt(X) - topAt(X))]; };
  const Q = (u0, v0, u1, v1) => [bp(u0, v0), bp(u1, v0), bp(u1, v1), bp(u0, v1)];
  const SIGNQ = Q(.17, .12, .91, .35), ICON = bp(.27, .235);
  const SCRQ = { L: Q(.155, .4, .455, .86), R: Q(.49, .4, .885, .86) };     // екрани — чотирикутники в перспективі будки
  const DSK = { l: 326, r: 486, top: 280, bot: 346, back: 275.5 };
  const DRW = [[318, 350], [454, 484]];
  const LAP = [331, 259, 355, 272], TAB = [363, 255, 380, 269];

  // ---------- будка ----------
  function buildBooth() {
    const S = F.Sheet(312, 126, 488, 282), sideTop = F.toVP(BOOTH.r, BOOTH.tr, .03), sideBot = F.toVP(BOOTH.r, BOOTH.br, .03);
    // бічна грань (товща будки) — тікає до вікна
    S.poly([[BOOTH.r - .5, BOOTH.tr + .5], sideTop, sideBot, [BOOTH.r - .5, BOOTH.br]], (u, v, i, j) => u > .85 ? CYAN[2] : ramp(NAVY, .3 - v * .2, i, j));
    // тіло будки: чотирикутник за лініями власника
    S.poly([[BOOTH.l, BOOTH.tl], [BOOTH.r, BOOTH.tr], [BOOTH.r, BOOTH.br], [BOOTH.l, BOOTH.bl]], (u, v, i, j, X, Y) => {
      const dT = Y - topAt(X), dL = X - BOOTH.l, dR = BOOTH.r - X, dB = botAt(X) - Y, d = Math.min(dT, dL, dR, dB);
      if (d < .6) return dT < .6 ? NAVY[8] : dL < .6 ? NAVY[7] : NAVY[1];
      if (d < 1.6) return dT < 1.6 ? NAVY[6] : NAVY[3];
      if (d < 2.3 && (dT < 2.3 || dR < 2.3)) return CYAN[3];
      if (dL < 14 && dT > 6) {
        if (Math.abs(X - (BOOTH.l + 12.5)) < .5) return NAVY[6];
        if (Math.abs(X - (BOOTH.l + 7)) < .7 && ((Y | 0) % 22 === 4)) return CYAN[3];
        return ramp(NAVY, .32 - v * .15 + (dL < 3 ? .08 : 0), i, j, .12);
      }
      return ramp(NAVY, .42 - v * .22 + (1 - u) * .06, i, j, .12);
    });
    // вивіска (у перспективі будки)
    S.quad(SIGNQ, (u, v, i, j) => { const W = 106, Hh = 29, x = u * W, y = v * Hh, rad = 4.5, qx = Math.abs(x - W / 2) - (W / 2 - rad), qy = Math.abs(y - Hh / 2) - (Hh / 2 - rad);
      const d = rad - (Math.min(Math.max(qx, qy), 0) + Math.hypot(Math.max(qx, 0), Math.max(qy, 0)));          // заокруглена рамка вивіски
      if (d < 0) return null; return d < .6 ? CYAN[2] : d < 1.5 ? CYAN[4] : d < 2.2 ? NAVY[1] : d < 2.8 && v < .5 ? NAVY[6] : ramp(NAVY, .48 - v * .25, i, j); });
    S.rr(ICON[0] - 7, ICON[1] - 7, ICON[0] + 7, ICON[1] + 7, 7, (d) => d < 1.3 ? CYAN[4] : d < 1.8 ? CYAN[2] : NAVY[1]);
    S.poly([[ICON[0], ICON[1] - 4.4], [ICON[0] + 2.6, ICON[1] + .4], [ICON[0] - 2.6, ICON[1] + .4]], CYAN[4]);
    S.rr(ICON[0] - 2.8, ICON[1] - 1, ICON[0] + 2.8, ICON[1] + 4.2, 2.8, CYAN[4]);
    S.rr(ICON[0] - 1.2, ICON[1] + .4, ICON[0] + .4, ICON[1] + 2.2, .9, NAVY[1]);
    // ніша з екранами + рамки екранів (у перспективі)
    S.quad(Q(.13, .375, .905, .9), (u, v, i, j) => Math.min(u, 1 - u, v, 1 - v) < .012 ? NAVY[0] : ramp(NAVY, .15, i, j));
    for (const [u0, u1] of [[.143, .467], [.478, .897]]) S.quad(Q(u0, .385, u1, .875), (u, v, i, j) => { const d = Math.min(u * 40, (1 - u) * 40, v * 50, (1 - v) * 50); return d < .7 ? CYAN[2] : d < 1.5 ? CYAN[4] : ramp(HOLO, .55 - v * .3, i, j); });
    S.quad(Q(.03, .9, .97, .985), (u, v, i, j) => ramp(NAVY, .2, i, j));
    S.rect(BOOTH.r - 5.5, 215, BOOTH.r - 2.5, 240, (u, v) => u < .3 || u > .7 ? NAVY[1] : '#5a2a10');
    return S;
  }
  // ---------- стіл ----------
  function buildDesk() {
    const S = F.Sheet(322, 250, 500, 350), st = F.toVP(DSK.r, DSK.top, .033), sb = F.toVP(DSK.r, DSK.bot, .033);
    // бічна грань стільниці й корпусу (до вікна)
    S.poly([[DSK.r - .4, DSK.top], st, sb, [DSK.r - .4, DSK.bot]], (u, v, i, j, X, Y) => Y < DSK.top + 5 ? (Y < DSK.top + 1.2 ? PINK[6] : PINK[3]) : ramp(DESK, .3 - v * .2, i, j));
    // фасад
    S.rect(DSK.l, DSK.top + 5, DSK.r, DSK.bot - 3.5, (u, v, i, j, X, Y) => {
      const dr = DRW.find(([a, b]) => X >= a && X < b);
      if (dr) {                                                                                 // тумба з трьома шухлядами
        const [a, b] = dr, rows = [[288, 305.5], [306.5, 324], [325, 342.5]], row = rows.find(([p, q]) => Y >= p && Y < q);
        if (X < a + .6 || X > b - .6) return PINK[0];
        if (!row) return ramp(LIL, .12, i, j);
        const [p, q] = row, du = X - a, dv = Y - p, cx = (a + b) / 2, cy = (p + q) / 2;
        if (dv < .5) return LIL[7]; if (dv > q - p - .5 || du > b - a - 1.2) return LIL[0]; if (du < 1.2) return LIL[5];
        if (Math.abs(Y - cy) < .6 && Math.abs(X - cx) < (b - a) * .26) return Y < cy ? CHROME[5] : CHROME[3];   // ручка
        if (Math.abs(Y - cy) < 1.1 && Math.abs(X - cx) < (b - a) * .29) return PINK[0];
        return ramp(LIL, .55 - dv / (q - p) * .3 + (1 - du / (b - a)) * .08, i, j, .1);
      }
      if (Y < DSK.top + 8) return '#05021a';                                                   // тінь під стільницею
      if (((X - 350) % 13 + 13) % 13 < .7) return DESK[0];                                     // вертикальні рейки ніші
      return ramp(DESK, .32 - v * .25, i, j, .1);
    });
    S.rect(DSK.l, DSK.bot - 3.5, DSK.r, DSK.bot, (u, v) => v < .25 ? CHROME[2] : v > .8 ? PINK[0] : DESK[1]);   // цоколь
    // стільниця: рожевий неоновий край (як на картинці)
    S.rect(DSK.l - 1, DSK.top, DSK.r, DSK.top + 5.5, (u, v) => [PINK[7], PINK[6], PINK[5], PINK[5], PINK[4], PINK[3], PINK[2], PINK[1]][Math.min(7, (v * 8) | 0)]);
    S.rect(DSK.l - 1, DSK.back, DSK.r, DSK.top, (u, v, i, j) => v < .1 ? '#060313' : ramp(['#0b0730', '#120a36', '#1c0a3c', '#2b0c40', '#43123f', '#612758'], .1 + v * .75, i, j, .12));   // видимий верх стільниці
    // ноутбук: темна рамка екрана + база з рожевим кантом
    S.rr(LAP[0] - 2, LAP[1] - 2, LAP[2] + 2, LAP[3] + 1.6, 1.5, (d) => d < .6 ? NAVY[0] : d < 1.2 ? NAVY[5] : NAVY[1]);
    S.rect(LAP[0] - 5, LAP[3] + 1.6, LAP[2] + 5, DSK.back + 1, (u, v) => v < .35 ? CHROME[4] : v < .7 ? CHROME[2] : PINK[4]);
    // планшет на ніжці
    S.rr(TAB[0] - 1.4, TAB[1] - 1.4, TAB[2] + 1.4, TAB[3] + 1.4, 1.4, (d) => d < .6 ? NAVY[0] : NAVY[4]);
    S.rect(370.4, TAB[3] + 1.4, 373, DSK.back, CHROME[3]); S.rect(366, DSK.back - 1.2, 377, DSK.back, CHROME[4]);
    // горнятко і світний кубик
    S.rr(444, 267, 451, 276.5, [1, 1, 1.6, 1.6], (d, u, v) => d < .5 ? PINK[1] : v > .4 && v < .58 ? CYAN[4] : (u > .7 ? PINK[3] : PINK[5]));
    S.rect(450.6, 269.2, 452.8, 273.4, (u, v) => (u > .4 && v > .25 && v < .75) ? null : PINK[3]);
    S.rr(456, 269, 463, 276, 1, (d) => d < .6 ? CYAN[2] : CYAN[3]);
    return S;
  }

  // ---------- живі екрани ----------
  const [LCV, lx] = F.canvas(172, 232), [RCV, rx] = F.canvas(214, 232), [ACV, ax] = F.canvas(96, 52), [TCV, tx] = F.canvas(68, 56);
  function screenBg(c, w, h, t) {
    c.clearRect(0, 0, w, h); c.fillStyle = 'rgba(40,110,255,.18)'; c.fillRect(0, 0, w, h);
    c.fillStyle = 'rgba(160,220,255,.07)'; for (let y = (t * 12 | 0) % 4; y < h; y += 4) c.fillRect(0, y, w, 1);
  }
  /** Ліворуч: користувачі (аватарки) і стовпчики, що ростуть. */
  function drawLeft(c, t, act, prog) {
    const W = 172, H = 232; screenBg(c, W, H, t);
    P.text(c, 'USERS', 8, 20, '#bfe9ff', 12); lit(c, W - 22, 9, 10, 10, Math.sin(t * 4) > 0 ? '#3bff8a' : '#1f6a45');
    for (let k = 0; k < 3; k++) {                                                              // аватарки
      const x = 18 + k * 50, y = 34, on = Math.floor(t * (1 + act * 2)) % 3 === k;
      c.fillStyle = on ? '#ffffff' : '#9fdcff'; c.beginPath(); c.arc(x + 14, y + 12, 9, 0, 7); c.fill(); c.beginPath(); c.ellipse(x + 14, y + 36, 15, 10, 0, Math.PI, 0); c.fill();
      lit(c, x, y + 44, 28, 3, on ? '#3bff8a' : '#2a6ab0');
    }
    const base = H - 16, top = 104;
    for (let i = 0; i < 7; i++) {                                                              // стовпчики
      const v = P.clamp(noise(t * (1 + act * 1.8), i) + act * prog * .3, .12, 1), hh = v * (base - top);
      const x = 12 + i * 22; c.fillStyle = 'rgba(122,240,255,.28)'; c.fillRect(x, base - hh, 15, hh);
      lit(c, x, base - hh, 15, 3, '#e8fdff'); lit(c, x + 2, base - hh + 5, 3, hh - 7, 'rgba(255,255,255,.25)');
    }
    lit(c, 8, base + 2, W - 16, 2, '#9fdcff');
    if (act) P.text(c, '+' + (12 + Math.floor(prog * 30)) + '%', W - 10, 98, '#ffe27a', 14, 'right');
    // що Nexi вже зробив тут (останні записи, по черзі)
    const done = (NX.ui.zones.done.analytics || []).slice(-3);
    done.slice(-2).forEach((d, k) => { lit(c, 8, 70 + k * 12, 6, 6, '#3bff8a'); P.text(c, NX.t(`zones.analytics.${d.task}.t`).toUpperCase().slice(0, 22), 18, 77 + k * 12, '#bfe9ff', 7); });
  }
  /** Праворуч: лінійний графік і "пончик" частки. */
  function drawRight(c, t, act, prog) {
    const W = 214, H = 232; screenBg(c, W, H, t);
    P.text(c, 'TREND', 8, 20, '#bfe9ff', 12);
    const b = 116, h = 82; c.strokeStyle = 'rgba(160,220,255,.35)'; c.lineWidth = 1;
    for (let y = 0; y < 4; y++) { c.beginPath(); c.moveTo(8, b - y * 26); c.lineTo(W - 8, b - y * 26); c.stroke(); }
    c.lineWidth = 3; c.strokeStyle = '#ff9ae6'; c.beginPath();
    for (let x = 0; x <= W - 16; x += 4) { const v = .45 + .25 * Math.sin((x + t * (26 + act * 50)) * .045) + .12 * Math.sin((x + t * 40) * .13) + (act ? prog * .2 * x / W : 0), y = b - v * h; x ? c.lineTo(8 + x, y) : c.moveTo(8 + x, y); }
    c.stroke(); c.strokeStyle = '#e8fdff'; c.lineWidth = 2; c.beginPath();
    for (let x = 0; x <= W - 16; x += 4) { const v = .3 + .2 * Math.sin((x + t * 18) * .03 + 1.5), y = b - v * h; x ? c.lineTo(8 + x, y) : c.moveTo(8 + x, y); }
    c.stroke();
    const cx = 56, cy = 176, R = 34, share = .62 + .1 * Math.sin(t * .7) + act * prog * .2;      // "пончик"
    c.lineWidth = 14; c.strokeStyle = 'rgba(122,240,255,.35)'; c.beginPath(); c.arc(cx, cy, R, 0, 7); c.stroke();
    c.strokeStyle = '#7af0ff'; c.beginPath(); c.arc(cx, cy, R, -Math.PI / 2, -Math.PI / 2 + share * Math.PI * 2); c.stroke();
    P.text(c, Math.round(share * 100) + '%', cx, cy + 6, '#ffffff', 13, 'center');
    for (let k = 0; k < 4; k++) { lit(c, 108, 150 + k * 18, 10, 10, ['#7af0ff', '#ff9ae6', '#ffe27a', '#3bff8a'][k]); lit(c, 124, 153 + k * 18, 40 + 30 * noise(t * .5, k + 3), 4, '#bfe9ff'); }
  }
  function drawLaptop(c, t, act) {
    c.clearRect(0, 0, 96, 52); c.fillStyle = '#0b2a8a'; c.fillRect(0, 0, 96, 52);
    for (let i = 0; i < 9; i++) { const v = noise(t * (1.5 + act * 3), i + 9), h = 8 + v * 30; lit(c, 6 + i * 10, 46 - h, 7, h, i % 3 ? '#7af0ff' : '#ff9ae6'); }
    lit(c, 0, 0, 96, 7, '#1238a8'); lit(c, 4, 2, 20, 3, '#bfe9ff');
  }
  function drawTablet(c, t) {
    c.clearRect(0, 0, 68, 56); c.fillStyle = '#0b2a8a'; c.fillRect(0, 0, 68, 56);
    const a = t * .8; c.lineWidth = 8; c.strokeStyle = '#ff9ae6'; c.beginPath(); c.arc(34, 28, 16, a, a + 2.4); c.stroke();
    c.strokeStyle = '#7af0ff'; c.beginPath(); c.arc(34, 28, 16, a + 2.4, a + 4.6); c.stroke(); c.strokeStyle = '#ffe27a'; c.beginPath(); c.arc(34, 28, 16, a + 4.6, a + 6.28); c.stroke();
  }

  let BOOTHS = null, DESKS = null;
  const an = NX.addObject({
    id: 'analytics', name: 'obj.analytics', act: 'analytics', active: false, prog: 0, fr: 0,
    hit: { x: 318, y: 132, w: 168, h: 214 },
    drawBack(c, t) {
      if (!BOOTHS) { BOOTHS = buildBooth(); BOOTHS.cv = BOOTHS.canvas(); DESKS = buildDesk(); DESKS.cv = DESKS.canvas(); }
      const act = this.active ? 1 : 0, R = F.res(), sm = R < 3.8;
      c.save(); c.imageSmoothingEnabled = sm;
      const bw = BOOTHS.x1 - BOOTHS.x0, bh = BOOTHS.y1 - BOOTHS.y0; c.drawImage(F.fit(BOOTHS.cv, bw, bh, R), BOOTHS.x0, BOOTHS.y0, bw, bh);
      // живі екрани (оновлюються кожен 3-й кадр)
      if ((this.fr++ % 3) === 0) { drawLeft(lx, t, act, this.prog); drawRight(rx, t, act, this.prog); drawLaptop(ax, t, act); drawTablet(tx, t); }
      c.imageSmoothingEnabled = true;
      const sc = (cv, q) => c.drawImage(cv, q[0], q[1], q[2] - q[0], q[3] - q[1]);
      F.warp(c, LCV, SCRQ.L, Math.max(.5, 1.5 / R)); F.warp(c, RCV, SCRQ.R, Math.max(.5, 1.5 / R));
      // вивіска: напис світиться і "дихає"
      const title = NX.t('nav.analytics'), sz = Math.min(8.2, 72 / title.length), tc = rgba('154,246,255', .88 + .12 * Math.sin(t * 2.2));
      const [sx0, sy0] = bp(.58, .235); c.globalCompositeOperation = 'lighter'; P.glow(c, sx0, sy0, 42, 'rgba(59,232,255,.6)', .18 + .06 * Math.sin(t * 2) + act * .1);
      c.globalCompositeOperation = 'source-over'; c.save(); c.transform(1, (BOOTH.tr - BOOTH.tl) / (BOOTH.r - BOOTH.l), 0, 1, 0, 0); const ty2 = sy0 - sx0 * (BOOTH.tr - BOOTH.tl) / (BOOTH.r - BOOTH.l); P.text(c, title, sx0 + .5, ty2 + sz / 2, tc, sz, 'center'); P.text(c, title, sx0 + .9, ty2 + sz / 2, tc, sz, 'center'); c.restore();   // напис нахилений разом з будкою
      c.globalCompositeOperation = 'lighter';
      lit(c, BOOTH.r - 5, 215, 2.4, 25, rgba('255,150,60', .55 + .3 * Math.sin(t * 2.4)));                                  // помаранчева LED-смужка
      for (let k = 0; k < 10; k++) lit(c, 340 + k * 12, botAt(340 + k * 12) - 2.4, 3, 1.2, rgba(k % 3 ? '59,232,255' : '255,79,216', .35 + .4 * (Math.floor(t * 4 + k) % 4 === 0)));   // вогники знизу
      P.glow(c, 372, 230, 38, 'rgba(70,140,255,.6)', .16 + act * .1); P.glow(c, 428, 232, 40, 'rgba(70,140,255,.6)', .16 + act * .1);
      c.globalCompositeOperation = 'source-over';
      // стіл і речі на ньому
      const dw = DESKS.x1 - DESKS.x0, dh = DESKS.y1 - DESKS.y0; c.imageSmoothingEnabled = sm; c.drawImage(F.fit(DESKS.cv, dw, dh, R), DESKS.x0, DESKS.y0, dw, dh);
      c.imageSmoothingEnabled = true; sc(ACV, LAP); sc(TCV, TAB);
      c.globalCompositeOperation = 'lighter';
      c.fillStyle = rgba('255,79,216', .3 + .2 * Math.sin(t * 2.2) + act * .2); c.fillRect(DSK.l - 1, DSK.top + .3, DSK.r - DSK.l + 1, 1.4);   // неон краю стільниці
      const sp = DSK.l + ((t * .22) % 1) * (DSK.r - DSK.l); lit(c, sp - 5, DSK.top + .2, 10, 1, 'rgba(255,255,255,.8)');
      for (let x = 352; x < 452; x += 2) lit(c, x, 336, 1.4, 1.4, act ? `hsla(${(t * 120 + x * 4) % 360},95%,62%,.8)` : rgba('59,232,255', .35 + .3 * Math.sin(t * 2 + x * .1)));   // неон ніші
      DRW.forEach(([a, b], k) => [296.5, 315, 333.5].forEach((y, n) => lit(c, b - 3.5, y, 1.6, 1, rgba('59,232,255', .4 + .5 * Math.sin(t * 2 + k * 3 + n)))));
      lit(c, 457, 275, 5, 5, rgba('59,232,255', .25 + .15 * Math.sin(t * 3)));                                        // світний кубик
      P.glow(c, 343, 270, 18, 'rgba(59,160,255,.6)', .2 + act * .2);
      c.globalCompositeOperation = 'source-over';
      for (let i = 0; i < 3; i++) { const q = (t * .5 + i / 3) % 1; c.fillStyle = `rgba(220,230,255,${.35 * (1 - q)})`; c.fillRect(447 + Math.sin(q * 6 + i) * 1.2, 266 - q * 10, 1, 1); }   // пара над кавою
      c.restore();
    },
  });
  NX.analyticsZone = an;
})();

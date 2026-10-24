/* ============================================================================
 * objects/sofa.js — ДИВАН-ЛАУНЖ, ПОВНІСТЮ ПЕРЕМАЛЬОВАНИЙ ПІКСЕЛЬ-АРТОМ
 * ----------------------------------------------------------------------------
 * Диван більше не вирізається з картинки — він намальований кодом (як Nexi),
 * тому чіткий на будь-якому екрані й рухається ЦІЛИЙ, а не шматками.
 * Сітка: 2 пікселі дивану = 1 одиниця кімнати; розмір 468×222 px
 * (234×111 одиниць), стоїть на підлозі в точці (774, 362) і повністю
 * накриває старий диван на картинці.
 *   buildBody()   — статичне тіло: оболонка спинки з неоновим кантом, 3 стьобані
 *                   подушки, круглі валики підлокітників, пухкі подушки сидіння,
 *                   плед на підлокітнику, плінтус, ніжки. Об'єм — 8-bit переливом
 *                   з дизерингом (shade()), малюється один раз у canvas
 *   PILLOWS       — 4 декоративні подушки (окремі canvas, можуть "збиватися")
 *   drawBack()    — щокадру: тіло + подушки + LED-стрічка + вм'ятина від
 *                   того, хто сидить; усе під однією "пружиною" (squash)
 * Тап по дивану -> Nexi САМ вирішує, що робити (pick()).
 * ========================================================================== */
(() => {
  const P = NX.px, GW = 468, GH = 222, U = .5;            // розмір сітки; 1 px = 0.5 одиниці кімнати
  const OX = 774 - GW * U / 2, OY = 362 - GH * U;          // лівий верх дивану в кімнаті (657, 251)
  const C = { out: '#140a28', v0: '#21103f', v1: '#2d1657', v2: '#3b1f70', v3: '#4d2b8c', v4: '#6a3db0', hi: '#8a5ad0',
    p0: '#7a1c66', p1: '#a8288a', p2: '#d03aa6', p3: '#f05cc0', p4: '#ff9ade', neon: '#ff4fd8', chrome: '#c3cbea', chromeD: '#6a74a8',
    t0: '#123a44', t1: '#1d5c62', t2: '#2c8680', t3: '#4cb898', t4: '#8ae8b8', y0: '#c8a83a', y1: '#ffe27a' };

  // ---------- пензлі (працюють у сітці дивану) ----------
  const ins = r => { const o = []; for (let i = 0; i < r; i++) o.push(Math.round(r - Math.sqrt(r * r - (r - i - .5) ** 2))); return o; };
  const mk = (w, h) => { const cv = document.createElement('canvas'); cv.width = w; cv.height = h; const x = cv.getContext('2d', { willReadFrequently: true }); return [cv, x]; };
  function brushes(x) {
    const R = (a, b, w, h, c) => { x.fillStyle = c; x.fillRect(Math.round(a), Math.round(b), Math.round(w), Math.round(h)); };
    const RR = (a, b, w, h, r, c, top = true, bot = true) => { const I = ins(r); for (let y = 0; y < h; y++) { const k = (top && y < r) ? I[y] : (bot && y >= h - r) ? I[h - 1 - y] : 0; R(a + k, b + y, w - 2 * k, 1, c); } };
    /** Вертикальний градієнт по рядках між кольорами (8-bit: смугами по 2 px). */
    const VG = (a, b, w, h, cols, r = 0, top = true, bot = true) => { const I = ins(r); for (let y = 0; y < h; y += 2) { const q = y / h, c = cols[Math.min(cols.length - 1, Math.floor(q * cols.length))], k = (top && y < r) ? I[y] : (bot && y >= h - r) ? I[Math.max(0, h - 1 - y)] : 0; R(a + k, b + y, w - 2 * k, 2, c); } };
    return { R, RR, VG };
  }
  function outline(x, w, h, col) {
    const id = x.getImageData(0, 0, w, h), d = id.data, op = new Uint8Array(w * h), o = [parseInt(col.slice(1, 3), 16), parseInt(col.slice(3, 5), 16), parseInt(col.slice(5, 7), 16)];
    for (let i = 0; i < op.length; i++) op[i] = d[i * 4 + 3] > 40 ? 1 : 0;
    for (let yy = 0; yy < h; yy++) for (let xx = 0; xx < w; xx++) { const i = yy * w + xx; if (op[i]) continue; if ((xx > 0 && op[i - 1]) || (xx < w - 1 && op[i + 1]) || (yy > 0 && op[i - w]) || (yy < h - 1 && op[i + w])) { d[i * 4] = o[0]; d[i * 4 + 1] = o[1]; d[i * 4 + 2] = o[2]; d[i * 4 + 3] = 255; } }
    x.putImageData(id, 0, 0);
  }

  // ---------- 8-bit тонування з дизерингом (Bayer 4×4) ----------
  // shade(x, ...): заливає фігуру (mask) кольорами палітри pal за "освітленістю" val(u,v) 0..1,
  // змішуючи сусідні тони шаховим візерунком — класичний піксель-арт перелив без розмиття.
  const BAYER = [0, 8, 2, 10, 12, 4, 14, 6, 3, 11, 1, 9, 15, 7, 13, 5].map(v => (v + .5) / 16 - .5);
  const PAL = {
    velvet: ['#0d0620', '#130a2e', '#1b0f40', '#241453', '#2e1a67', '#3a217c', '#482a93', '#5a36ab'],
    pink: ['#3e0c3c', '#5c1456', '#7e1e74', '#a42a92', '#c83caa', '#e858c0', '#ff86d6'],
    teal: ['#0a222c', '#10343e', '#17484e', '#1f5e5e', '#2b7a70', '#3f9a84', '#62bca0'],
    knit: ['#5a1a5a', '#7a2a7a', '#9a3a8e', '#c04aa4', '#e070c0'],
  };
  function shade(x, x0, y0, w, h, pal, val, mask) {
    for (let j = 0; j < h; j++) for (let i = 0; i < w; i++) {
      const u = (i + .5) / w, v = (j + .5) / h; if (mask && !mask(u, v)) continue;
      const q = Math.max(0, Math.min(1, val(u, v))) * (pal.length - 1) + BAYER[((y0 + j) & 3) * 4 + ((x0 + i) & 3)] * .9;
      x.fillStyle = pal[Math.max(0, Math.min(pal.length - 1, Math.round(q)))]; x.fillRect(x0 + i, y0 + j, 1, 1);
    }
  }
  const roundMask = (w, h, r, top = true, bot = true) => (u, v) => { const px = u * w, py = v * h, dx = Math.max(0, r - px, px - (w - r)), dyT = top ? Math.max(0, r - py) : 0, dyB = bot ? Math.max(0, py - (h - r)) : 0, dy = Math.max(dyT, dyB); return dx * dx + dy * dy <= r * r; };
  const bump = t => Math.sqrt(Math.max(0, 1 - (2 * t - 1) ** 2));                     // "пухкість" поперек подушки

  // ---------- статичне тіло дивану ----------
  function buildBody() {
    const [cv, x] = mk(GW, GH), { R } = brushes(x);
    // тінь на підлозі
    x.fillStyle = 'rgba(6,2,20,.55)'; x.beginPath(); x.ellipse(GW / 2, GH - 4, GW / 2 - 6, 7, 0, 0, 7); x.fill();
    // СПИНКА: суцільна оболонка з рожевими боковинами
    shade(x, 40, 2, 388, 134, PAL.velvet, (u, v) => .18 + .12 * (1 - v), roundMask(388, 134, 22, true, false));
    shade(x, 40, 6, 22, 128, PAL.pink, (u, v) => .95 - v * .8 - Math.abs(u - .35) * .5, roundMask(22, 128, 11, true, false));
    shade(x, 406, 6, 22, 128, PAL.pink, (u, v) => .95 - v * .8 - Math.abs(u - .65) * .5, roundMask(22, 128, 11, true, false));
    for (let gx = 60; gx < 408; gx++) { const k = Math.abs(gx - 234) / 174; R(gx, 3 + Math.round(k * k * 4), 1, 2, k > .9 ? C.p3 : C.neon); }   // неоновий кант по верху
    // 3 стьобані подушки спинки (центральна вища)
    [[64, 14, 112], [178, 8, 112], [292, 14, 112]].forEach(([cx, cy, cw]) => {
      const ch = 130 - cy;
      shade(x, cx, cy, cw, ch, PAL.velvet, (u, v) => .14 + .6 * bump(u) * Math.pow(bump(Math.min(.98, v * .8 + .1)), .6) + .14 * (1 - v) - .08 * u, roundMask(cw, ch, 18, true, false));
      for (const [bu, bv] of [[.3, .32], [.7, .32], [.5, .62]]) {                               // ґудзики та складки стьобки
        const bx = Math.round(cx + cw * bu), by = Math.round(cy + ch * bv);
        for (let k = 3; k < 10; k++) { const a = .5; [[-1, -a], [1, -a], [-1, a], [1, a]].forEach(([sx, sy]) => R(bx + sx * k, by + sy * k, 1, 1, PAL.velvet[3])); }
        R(bx - 2, by - 1, 4, 3, PAL.velvet[0]); R(bx - 1, by - 2, 2, 1, PAL.velvet[0]); R(bx - 1, by - 1, 1, 1, PAL.velvet[6]);
      }
      R(cx, cy + 16, 1, ch - 16, PAL.velvet[0]); R(cx + cw - 1, cy + 16, 1, ch - 16, PAL.velvet[0]);
    });
    // ПІДЛОКІТНИКИ: круглий валик зверху, рожева зовнішня грань
    for (const side of [-1, 1]) {
      const ax = side < 0 ? 0 : 392, aw = 76, outer = side < 0 ? 0 : aw - 24;
      shade(x, ax, 122, aw, 86, PAL.velvet, (u, v) => .5 - v * .4 + (side < 0 ? u : 1 - u) * .05);                       // фронт
      shade(x, ax + outer, 122, 24, 86, PAL.pink, (u, v) => .9 - v * .75 - (side < 0 ? 1 - u : u) * .25);                 // зовнішня грань
      shade(x, ax, 98, aw, 28, PAL.velvet, (u, v) => .25 + .7 * bump(v) * (.85 + .15 * (side < 0 ? u : 1 - u)), roundMask(aw, 28, 13));   // валик
      shade(x, ax + outer, 98, 24, 28, PAL.pink, (u, v) => .3 + .7 * bump(v), roundMask(24, 28, 12));
      for (let yy = 130; yy < 200; yy += 4) R(ax + (side < 0 ? 30 : aw - 32), yy, 2, 2, PAL.velvet[1]);                     // строчка
      R(ax + (side < 0 ? 4 : aw - 6), 104, 2, 2, '#ffffff'); R(ax + (side < 0 ? 3 : aw - 6), 108, 3, 10, C.p4);            // блиск
    }
    // СИДІННЯ: дві пухкі подушки з неоновим кантом
    for (const sx of [76, 234]) {
      shade(x, sx, 120, 158, 24, PAL.velvet, (u, v) => .45 + .35 * v + .15 * bump(u), roundMask(158, 24, 10, true, false));  // верх
      shade(x, sx, 142, 158, 22, PAL.velvet, (u, v) => .25 + .5 * bump(v * .7) * bump(u * .9 + .05), roundMask(158, 22, 9, false, true));   // фронтальний валик
      for (let gx = sx + 6; gx < sx + 152; gx++) R(gx, 142, 1, 2, (gx & 3) ? C.neon : C.p3);
    }
    R(233, 120, 2, 44, PAL.velvet[0]);
    // ФРОНТАЛЬНА ПАНЕЛЬ + канавка під LED
    shade(x, 76, 162, 316, 38, PAL.velvet, (u, v) => .28 - v * .2);
    for (let px = 76 + 52; px < 392; px += 52) R(px, 164, 1, 34, PAL.velvet[0]);
    R(84, 176, 300, 10, '#0a0618'); R(84, 186, 300, 1, PAL.velvet[3]);
    // ПЛІНТУС і НІЖКИ
    shade(x, 4, 198, 460, 12, PAL.velvet, (u, v) => .15 - v * .15, roundMask(460, 12, 4, false, true)); R(10, 198, 448, 1, PAL.velvet[4]);
    for (const lx of [16, 98, 358, 440]) { R(lx, 210, 12, 10, C.chromeD); R(lx + 2, 210, 4, 10, C.chrome); R(lx + 1, 219, 10, 2, '#3a3f6a'); R(lx + 3, 211, 1, 3, '#ffffff'); }
    // ПЛЕД, перекинутий через правий підлокітник (в'язаний, з китицями)
    shade(x, 398, 94, 66, 20, PAL.knit, (u, v) => .35 + .5 * bump(v) + ((Math.floor(u * 22) % 2) ? .1 : -.05), roundMask(66, 20, 8));
    shade(x, 444, 112, 20, 58, PAL.knit, (u, v) => .7 - v * .4 + ((Math.floor(v * 14) % 2) ? .08 : -.06), roundMask(20, 58, 4, false, true));
    for (let k = 0; k < 5; k++) { R(446 + k * 4, 170, 2, 6 + (k % 2) * 3, PAL.knit[3]); R(446 + k * 4, 176 + (k % 2) * 3, 2, 2, PAL.knit[4]); }
    for (let k = 0; k < 6; k++) R(402 + k * 10, 102, 6, 2, PAL.knit[4]);
    outline(x, GW, GH, C.out);
    return cv;
  }
  // ---------- декоративні подушки (класична форма з "кутиками", візерунок-листя) ----------
  function buildPillow(w, h, flip, lying) {
    const [cv, x] = mk(w + 4, h + 4), { R } = brushes(x), p = lying ? 4.5 : 3.2;
    const mask = (u, v) => { const a = Math.abs(u * 2 - 1), b = Math.abs(v * 2 - 1); return Math.pow(a, p) + Math.pow(b, p) <= 1 - .25 * Math.min(a, b) * (1 - Math.max(a, b)); };
    shade(x, 2, 2, w, h, PAL.teal, (u, v) => .2 + .65 * bump(u) * bump(v) + .2 * (1 - v) - .1 * u, mask);
    // листки монстери: темно-зелений лист із жовтою прожилкою (як на подушках з картинки)
    const leaf = (cx, cy, len, ang) => { const ca = Math.cos(ang), sa = Math.sin(ang);
      for (let k = -len; k <= len; k++) for (let m = -6; m <= 6; m++) { const t = k / len, half = 5.5 * Math.sqrt(Math.max(0, 1 - t * t)); if (Math.abs(m) > half) continue;
        const px = Math.round(cx + ca * k - sa * m), py = Math.round(cy + sa * k + ca * m); if (!mask((px - 2 + .5) / w, (py - 2 + .5) / h)) continue;
        R(px, py, 1, 1, Math.abs(m) < 1 ? C.y1 : (Math.abs(m) > half - 1.2 ? PAL.teal[1] : ((m + k) & 3) ? PAL.teal[4] : PAL.teal[5])); } };
    (lying ? [[.25, .5, -.4, 9], [.55, .45, .35, 9], [.82, .55, -.6, 7]] : [[.32, .34, .7, 11], [.62, .58, -.5, 11], [.3, .72, .1, 8], [.72, .28, 1.9, 8]]).forEach(([u, v, a, L]) => leaf(2 + w * u, 2 + h * v, L, a));
    R(2 + w * .3, 5, w * .3, 1, PAL.teal[6]);
    if (flip) { const [c2, x2] = mk(cv.width, cv.height); x2.scale(-1, 1); x2.drawImage(cv, -cv.width, 0); outline(x2, cv.width, cv.height, '#0a1e26'); return c2; }
    outline(x, w + 4, h + 4, '#0a1e26');
    return cv;
  }
  const PILLOWS = [[buildPillow(58, 54, false, false), 110, 134, -.16], [buildPillow(72, 28, false, true), 152, 150, 0], [buildPillow(58, 54, true, false), 358, 134, .16], [buildPillow(72, 28, true, true), 316, 150, 0]]
    .map(([cv, px, py, rot], i) => ({ cv, px, py, rot, puff: 0, i }));
  let BODY = null;

  const toRoom = (gx, gy) => [OX + gx * U, OY + gy * U];
  const sofa = NX.addObject({
    id: 'sofa', name: 'obj.sofa', act: 'sofa', hit: { x: OX, y: OY, w: GW * U, h: GH * U },
    mode: 'idle', flash: 0, waves: [], sq: 1, sqV: 0, breath: 0,
    /** Що Nexi зробить на дивані — вирішує сам (зважений рандом + контекст). */
    pick() {
      const n = NX.nexi, c = NX.cat, idle = NX.time - n.lastCmd, catNear = Math.abs(c.x - 774) < 360 && !c.riding;
      const pool = [['sofa', 2], ['sofaWork', 2], ['bounce', 2], ['fluff', 1.4], ['cuddle', catNear ? 2.4 : 1], ['sleep', idle > 40 ? 2 : .7]].filter(([id]) => !(n.task && n.task.id === id));
      let r = Math.random() * pool.reduce((s, p) => s + p[1], 0); for (const [id, w] of pool) { if ((r -= w) <= 0) return id; } return 'sofa';
    },
    onTap() { NX.nexi.do(this.pick()); return true; },
    /** Хтось приземлився: диван пружинить, подушки підстрибують, пил, спалах LED. */
    land(x, power = 1) {
      this.flash = 1; this.sqV -= .9 * power; this.waves.push({ x, y: OY + 66, t: 0 });
      PILLOWS.forEach(p => { if (Math.abs(toRoom(p.px, 0)[0] - x) < 70) p.puff = Math.max(p.puff, .5 * power); });
      for (let i = 0; i < 8; i++) NX.fx.emit('dust', x + (Math.random() - .5) * 34, OY + 64);
    },
    puffAll() { PILLOWS.forEach((p, i) => setTimeout(() => { p.puff = 1; this.feathers(p); }, i * 600)); },
    feathers(p) { const [x, y] = toRoom(p.px, p.py - 20); for (let i = 0; i < 7; i++) NX.fx.emit('spark', x + (Math.random() - .5) * 18, y, { col: Math.random() < .5 ? C.t4 : C.y1, vy: -30 - Math.random() * 20, g: 30, ttl: 1.2, s: 1.5 }); },
    update(dt) {
      const n = NX.nexi; this.mode = n.loc === 'sofaLie' ? 'sleep' : (n.loc === 'sofaSit' || n.loc === 'sofaStand') ? 'busy' : 'idle';
      this.flash = Math.max(0, this.flash - dt * 2); this.waves = this.waves.filter(w => (w.t += dt) < .7);
      PILLOWS.forEach(p => p.puff = Math.max(0, p.puff - dt * 1.6));
      this.sqV += ((1 - this.sq) * 160 - this.sqV * 9) * dt; this.sq = P.clamp(this.sq + this.sqV * dt, .955, 1.03);
    },
    drawBack(c, t) {
      if (!BODY) BODY = buildBody();
      const m = this.mode, sit = m !== 'idle' || NX.cat.onSofa, K = NX.cam.k * (NX.loop.dpr || 1);
      c.save(); c.imageSmoothingEnabled = false;
      // одна "пружина" на весь диван: тіло, подушки, LED рухаються разом
      c.translate(Math.round(774 * K) / K, Math.round(362 * K) / K); c.scale(U * (1 + (1 - this.sq) * .35), U * this.sq); c.translate(-GW / 2, -GH);
      c.drawImage(BODY, 0, 0);
      // вм'ятина на сидінні під тим, хто сидить
      const seat = (rx, w) => { const gx = (rx - OX) / U; c.fillStyle = 'rgba(10,4,30,.35)'; c.beginPath(); c.ellipse(gx, 132, w, 6, 0, 0, 7); c.fill(); };
      if (NX.nexi.loc === 'sofaSit' || NX.nexi.loc === 'sofaStand') seat(NX.nexi.x, 26); if (NX.cat.onSofa) seat(NX.cat.x, 18);
      // подушки
      PILLOWS.forEach(p => { const k = 1 + Math.sin(p.puff * Math.PI) * .2, w = p.cv.width, h = p.cv.height; c.save(); c.translate(p.px, p.py); c.rotate(p.rot); c.scale(k * 1.04, k); c.drawImage(p.cv, -w / 2, -h); c.restore(); });
      // LED-стрічка в канавці фронтальної панелі
      const a = m === 'sleep' ? .5 + .15 * Math.sin(t) : .75 + .25 * Math.sin(t * 2.4);
      for (let gx = 82; gx < 386; gx += 4) { const hue = (t * 140 + gx * 1.2) % 360; c.fillStyle = m === 'sleep' ? `rgba(110,150,255,${a})` : sit ? `hsla(${hue},95%,62%,${a})` : `rgba(255,${80 + 40 * Math.sin(t * 2 + gx * .05) | 0},216,${a})`; c.fillRect(gx, 178, 3, 6); }
      const run = 82 + ((t * .6) % 1) * 304; c.fillStyle = '#ffffff'; c.fillRect(run - 8, 178, 16, 6);
      c.restore();
      // світіння (поза пружиною: м'яке, без пікселів)
      c.save(); c.globalCompositeOperation = 'lighter'; const [lx, ly] = toRoom(234, 181);
      const g = c.createLinearGradient(0, ly - 8, 0, ly + 8); g.addColorStop(0, 'rgba(255,90,220,0)'); g.addColorStop(.5, `rgba(255,90,220,${.25 + this.flash * .3})`); g.addColorStop(1, 'rgba(255,90,220,0)'); c.fillStyle = g; c.fillRect(OX + 40, ly - 8, GW * U - 80, 16);
      c.restore();
      P.glow(c, 774, 362, 140, m === 'sleep' ? 'rgba(80,120,255,.6)' : 'rgba(217,75,255,.6)', .22 + .08 * Math.sin(t * 2) + this.flash * .3);
      this.waves.forEach(w => { c.save(); c.globalAlpha = 1 - w.t / .7; c.strokeStyle = '#ffb0fa'; c.lineWidth = 1.3; c.beginPath(); c.ellipse(w.x, w.y, 9 + w.t * 70, 2 + w.t * 8, 0, 0, 7); c.stroke(); c.restore(); });
    },
    layers(t) {
      if (NX.nexi.loc !== 'sofaLie') return [];
      return [{ y: 1e4, draw: c => {                                                         // плед поверх сплячого Nexi (дихає)
        const x = 779, y = 309, w = 54, br = Math.sin(t * 1.3) * .7; P.rect(c, x, y + br, w, 15 - br, '#7a2a8a'); P.rect(c, x, y + br, w, 2, '#a84ab8');
        for (let i = 0; i < 6; i++) P.rect(c, x + 4 + i * 9, y + 6 + br, 4, 4, '#5a1a6a'); P.rect(c, x, y + 15, w, 1, '#4a1058');
      } }];
    },
  });
  // подушки як тап-зони (менші за диван — мають пріоритет)
  PILLOWS.forEach(p => NX.addObject({ id: 'pillow' + p.i, name: 'obj.pillow', act: 'pillow', get hit() { const [x, y] = toRoom(p.px - p.cv.width / 2, p.py - p.cv.height); return { x, y, w: p.cv.width * U, h: p.cv.height * U }; },
    onTap() { p.puff = 1; sofa.feathers(p); NX.nexi.emote('happy', 1.5); return true; } }));
})();

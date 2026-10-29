/* ============================================================================
 * objects/an_chair.js — КРІСЛО АНАЛІТИКИ (і фабрика гоночного крісла NX.arc.raceChair)
 * ----------------------------------------------------------------------------
 * Власник (крок 11): «постав туди теж крісло — таке саме, як у маркетингу, тільки трохи більше й колір інший: ця зона
 * ближче, тому й крісло ближче; і роби взаємодію з Nexi».
 * Модель — ТА САМА, що в маркетингу (objects/mk_chair.js: гоночне геймерське крісло в піксельному 3D, обертається; Правки
 * зон · 1 і · 4 — одне 3D-коліщатко на промінь, хрестовина стоїть, висока спинка HS 1.3). Файл маркетингу не чіпаємо (його
 * веде інший чат), тож модель тут — ФАБРИКА з параметрами: зона й місце (px картинки зони), розмір K, кут спокою, кольори.
 * Маркетинг може перейти на неї одним викликом (кольори за замовчуванням — його рожеві), тоді копії моделі не буде.
 *   СПИНКА — витягнутий профіль: «крила» на плечах, талія, шия, підголівник з двома прорізами під ремені (справжні дірки);
 *     спереду стьобана «ромбом» середина з кантом, бокові валики, вишитий N; ззаду глянцевий корпус, гоночні смуги, емблема;
 *   СИДІННЯ — платформа, стьобана подушка, бокові валики, заокруглений передній край; подушка під шию;
 *   ПІДЛОКІТНИКИ, механізм, LED-кільце; ОПОРА — газліфт у кожусі, хрестовина з 5 гранених хромованих променів з LED-смужкою,
 *     під кожним — шток і одне 3D-коліщатко. Хрестовина стоїть (на газліфті крутиться лише верх).
 * АНАЛІТИКА: K 1.85 (у маркетингу — 2; зона ближче до глядача, тож на екрані воно ~на 11 % більше, а Nexi в ньому
 * — тієї ж пропорції, над спинкою видно антену); кольори — «обсерваторія»: блакитна шкіра, темно-синя стьобка, золотий кант,
 * золоті кільця коліщат; стоїть у просторі для ніг перед столом, у спокої — спинкою до нас, рівно до стола (кут зони −20°).
 * API — як у mk_chair.js (activities.js): ready(), floor(), depth(), side() — де стати, seat() — куди сісти, turnTo(кут)
 *   (0 — до глядача, 180 — від глядача, 270 — праворуч), REST — кут спокою (до стола), sitDown() / standUp(), foot — слід.
 * ========================================================================== */
NX.arc = NX.arc || {};
NX.arc.raceChair = cfg => {
  const X = NX.px3d, A = NX.arc.kit, PL = A.PAL, P = NX.px, FL = 372, R = 4, { ramp, col } = X;
  const K = cfg.K || 2, HS = cfg.HS || 1.3, REST = cfg.rest == null ? 180 : cfg.rest, ZN = cfg.zone, AT = cfg.at;
  // кольори: за замовчуванням — рожеві маркетингу (mk_chair.js); інша зона передає свої
  const C = Object.assign({
    bol: ['#5a1458', '#c63aa8', '#7a1c6d', '#7a1c6d', '#a0288d', '#4a1048'], grain: 'rgba(255,200,240,.22)',
    quilt: ['#2a1a5e', '#1c1146', '#140c36'], puff: 'rgba(120,96,220,.4)', pipe: '#ff4fd8', stitch: 'rgba(255,214,246,.8)', lumbar: 'rgba(255,170,240,.6)',
    slotRim: 'rgba(255,170,240,.55)', emb: '#ff9af0', edge: 'rgba(255,190,240,.7)',
    shell: ['#3a2a7e', '#241a5a', '#120a36'], gloss: 'rgba(200,180,255,.22)', stripe: ['#ff9af0', '#ff4fd8', '#a0288d'], thread: '#9af6ff',
    ring: ['#ff4fd8', '#ffd6f6'], logo: ['#3be8ff', '#e4fdff'], rim: ['#ff4fd8', 'rgba(255,214,246,.8)'],
    seatPuff: 'rgba(140,110,240,.38)', seatStitch: 'rgba(255,190,240,.7)', roll: 'rgba(255,214,246,.32)', rollStitch: 'rgba(255,214,246,.6)',
    pad: ['#ff4fd8', '#ffd6f6'], side: ['#ff9af0', '#ff4fd8'], led: ['#ffd6f6', '#ff4fd8'], wheel: ['#3be8ff', '#bff8ff'],
    leather: PL.PINKP, glow: ['rgba(255,79,216,.8)', 'rgba(59,232,255,.7)'],
  }, cfg.colors || {});
  let Z = null; const zone = () => Z || (Z = NX.arc.zone && NX.arc.zone(ZN));
  // фронтальний зсув зони (sh: x + K·(z − z0)) — той самий, що в предметів розкладки; NX.arc.zone().W його вже додає, тож
  // вісь крісла беремо БЕЗ зсуву (raw), а базис і точки (shp) зсувають самі — крісло стоїть рівно там, де якір
  let SH0; const SH = () => { if (SH0 === undefined) { const L = NX.arcLayout || {}, xf = ['left', 'right'].map(sd => L[sd] && L[sd].zoneXf && L[sd].zoneXf[ZN]).find(Boolean); SH0 = xf && xf.sh ? xf.sh : null; } return SH0; };
  const shp = p => { const sh = SH(); return sh ? [p[0] + sh[0] * (p[2] - sh[1]), p[1], p[2]] : p; };
  const raw = p => { const sh = SH(); return sh ? [p[0] - sh[0] * (p[2] - sh[1]), p[1], p[2]] : p; };
  let C0 = null; const centre = () => C0 || (C0 = raw(zone().W(AT[0], AT[1], AT[2])));   // вісь крісла (світ, без зсуву)

  // ---------- СПИНКА: профіль лиця (половина праворуч, знизу вгору; [u, h] в одиницях крісла) ----------
  const PROF = [[11.8, 20], [11.7, 22.5], [11.1, 25.5], [10.8, 27.5], [11.3, 29.6], [12.3, 31.4], [12.9, 33.0], [12.6, 34.2], [11.1, 35.0], [8.4, 35.6],
    [7.8, 36.4], [7.6, 39.8], [7.2, 41.2], [6.1, 42.1], [4.2, 42.55], [0, 42.7]];
  const OUT = [...PROF, ...PROF.slice(0, -1).reverse().map(([u, h]) => [-u, h])];
  const INNER = [[8.2, 20.6], [7.8, 23.5], [7.4, 26.5], [7.7, 29.5], [8.2, 31.7], [7.5, 33.6], [5.6, 34.8], [4.9, 35.9], [4.7, 40.7], [3.8, 41.6], [0, 41.8]];
  const INN = [...INNER, ...INNER.slice(0, -1).reverse().map(([u, h]) => [-u, h])];
  const BW = 12.9, BH0 = 20, BH1 = 42.7, TILT = .07, BV = 9.4, BD = 5.4;
  const hS = h => BH0 + (h - BH0) * HS;
  const slot = (u, h) => Math.abs(Math.abs(u) - 3.2) < .7 && h > 38.4 && h < 40.8;
  const tx = (u, h) => [(u + BW) * K, (BH1 - h) * K * HS];
  const path = (c, pts, mirror = 1) => { c.beginPath(); pts.forEach(([u, h], k) => { const [x, y] = tx(u * mirror, h); k ? c.lineTo(x, y) : c.moveTo(x, y); }); c.closePath(); };
  const grad = (c, x0, y0, x1, y1, stops) => { const g = c.createLinearGradient(x0, y0, x1, y1); stops.forEach((s, i) => g.addColorStop(Array.isArray(s) ? s[0] : i / (stops.length - 1), Array.isArray(s) ? s[1] : s)); return g; };
  /** Лице спинки: бокові валики (глянець), стьобана «ромбом» середина з кантом і пунктиром-строчкою, строчка попереку,
   *  темні обідки прорізів, вишитий N. */
  const backFront = (c, fw, fh) => {
    const b = C.bol; path(c, OUT); c.fillStyle = grad(c, 0, 0, fw, 0, [[0, b[0]], [.12, b[1]], [.3, b[2]], [.7, b[3]], [.88, b[4]], [1, b[5]]]); c.fill();
    c.save(); path(c, OUT); c.clip(); c.fillStyle = C.grain; for (let y = 0; y < fh; y += 2.2) c.fillRect(0, y, fw, .35); c.restore();
    path(c, INN); c.fillStyle = grad(c, 0, 0, 0, fh, [[0, C.quilt[0]], [.5, C.quilt[1]], [1, C.quilt[2]]]); c.fill();
    c.save(); path(c, INN); c.clip(); const s = 2.6 * K;
    c.strokeStyle = 'rgba(8,4,24,.85)'; c.lineWidth = .5; for (let k = -12; k < 14; k++) { c.beginPath(); c.moveTo(k * s, 0); c.lineTo(k * s + fh, fh); c.stroke(); c.beginPath(); c.moveTo(k * s, fh); c.lineTo(k * s + fh, 0); c.stroke(); }
    c.fillStyle = C.puff; for (let y = s / 2; y < fh; y += s) for (let x = s / 2 + ((y / s | 0) % 2) * s / 2; x < fw; x += s) c.fillRect(x - .5, y - .9, 1, 1.2);
    c.restore();
    path(c, INN); c.strokeStyle = C.pipe; c.lineWidth = .8; c.stroke(); c.setLineDash([.7, .7]); c.strokeStyle = C.stitch; c.lineWidth = .3; c.stroke(); c.setLineDash([]);
    const [lx0, ly] = tx(-7.4, 27.4), [lx1] = tx(7.4, 27.4); c.setLineDash([.7, .7]); c.strokeStyle = C.lumbar; c.lineWidth = .3; c.beginPath(); c.moveTo(lx0, ly); c.lineTo(lx1, ly); c.stroke(); c.setLineDash([]);
    [-1, 1].forEach(sd => { const [x, y] = tx(sd * 3.2 - 1.1, 41.3), w = 2.2 * K, h = 3.4 * K * HS; c.fillStyle = '#05030f'; c.fillRect(x, y, w, h); c.fillStyle = C.slotRim; c.fillRect(x, y + h - .4, w, .4); });
    const [nx, ny] = tx(-1.25, 41.1), nw = 2.5 * K, nh = 2.1 * K * HS; c.strokeStyle = C.emb; c.lineWidth = .7; c.lineJoin = 'round'; c.beginPath(); c.moveTo(nx, ny + nh); c.lineTo(nx, ny); c.lineTo(nx + nw, ny + nh); c.lineTo(nx + nw, ny); c.stroke();
    path(c, OUT); c.strokeStyle = C.edge; c.lineWidth = .5; c.stroke();
  };
  /** Спинка ззаду: глянцевий корпус, дві гоночні смуги з тонкими нитками, неонова емблема з N, кант по краю, обідки прорізів. */
  const backBack = (c, fw, fh) => {
    path(c, OUT); c.fillStyle = grad(c, 0, 0, 0, fh, [[0, C.shell[0]], [.35, C.shell[1]], [1, C.shell[2]]]); c.fill();
    c.save(); path(c, OUT); c.clip();
    c.fillStyle = grad(c, 0, 0, fw, 0, [[0, 'rgba(255,255,255,0)'], [.16, C.gloss], [.24, 'rgba(255,255,255,0)']]); c.fillRect(0, 0, fw, fh);
    [-1, 1].forEach(sd => { const [x0] = tx(sd > 0 ? 1.9 : -3.7, 0), w = 1.8 * K;
      c.fillStyle = grad(c, 0, 0, 0, fh, [[0, C.stripe[0]], [.5, C.stripe[1]], [1, C.stripe[2]]]); c.fillRect(x0, 0, w, fh);
      c.fillStyle = C.thread; c.fillRect(sd > 0 ? x0 + w + .4 : x0 - .7, 0, .3, fh); });
    const [ex, ey] = tx(0, 30.4), r = 4 * K;
    c.fillStyle = '#0a0620'; c.beginPath(); c.arc(ex, ey, r, 0, 7); c.fill();
    c.strokeStyle = C.ring[0]; c.lineWidth = 1.1; c.beginPath(); c.arc(ex, ey, r * .82, 0, 7); c.stroke(); c.strokeStyle = C.ring[1]; c.lineWidth = .35; c.stroke();
    c.strokeStyle = C.logo[0]; c.lineWidth = 1.2; c.lineJoin = 'round'; const q = r * .38; c.beginPath(); c.moveTo(ex - q, ey + q); c.lineTo(ex - q, ey - q); c.lineTo(ex + q, ey + q); c.lineTo(ex + q, ey - q); c.stroke(); c.strokeStyle = C.logo[1]; c.lineWidth = .4; c.stroke();
    c.restore();
    [-1, 1].forEach(sd => { const [x, y] = tx(sd * 3.2 - 1.1, 41.3); c.fillStyle = '#05030f'; c.fillRect(x, y, 2.2 * K, 3.4 * K * HS); });
    path(c, OUT); c.strokeStyle = C.rim[0]; c.lineWidth = .9; c.stroke(); c.strokeStyle = C.rim[1]; c.lineWidth = .3; c.stroke();
  };
  /** Стьобана подушка сидіння (зверху): «ромб», кант, строчка. */
  const quilt = (c, fw, fh) => { const s = Math.min(fw, fh) / 3.4;
    c.strokeStyle = 'rgba(8,4,24,.8)'; c.lineWidth = .45; for (let k = -8; k < 10; k++) { c.beginPath(); c.moveTo(k * s, 0); c.lineTo(k * s + fh, fh); c.stroke(); c.beginPath(); c.moveTo(k * s, fh); c.lineTo(k * s + fh, 0); c.stroke(); }
    c.fillStyle = C.seatPuff; for (let y = s / 2; y < fh; y += s) for (let x = s / 2 + ((y / s | 0) % 2) * s / 2; x < fw; x += s) c.fillRect(x - .4, y - .4, .8, .8);
    c.setLineDash([.6, .6]); c.strokeStyle = C.seatStitch; c.lineWidth = .3; c.strokeRect(.8, .8, fw - 1.6, fh - 1.6); c.setLineDash([]); };
  /** Валик (зверху / спереду): глянцевий відблиск уздовж і строчка. */
  const roll = (c, fw, fh) => { c.fillStyle = C.roll; c.fillRect(0, fh * .22, fw, fh * .14); c.setLineDash([.6, .6]); c.strokeStyle = C.rollStitch; c.lineWidth = .3; c.beginPath(); c.moveTo(.5, fh * .7); c.lineTo(fw - .5, fh * .7); c.stroke(); c.setLineDash([]); };
  /** Накладка підлокітника (зверху): кольорова смуга. */
  const pad = (c, fw, fh) => { c.fillStyle = C.pad[0]; c.fillRect(fw * .38, 0, fw * .24, fh); c.fillStyle = C.pad[1]; c.fillRect(fw * .46, 0, fw * .08, fh); };

  // частини-коробки: [id, u (середина), v0 (передній край; + — назад), ширина, глибина, низ, верх, матеріал, додатково]
  const PARTS = [
    ['slab', 0, -12.4, 26, 24.2, 15, 18.6, 'shell', { ch: 1.2 }], ['cush', 0, -11.2, 16.8, 20.4, 18.6, 20.6, 'cush', { top: quilt }],
    ['bolL', -10.7, -12, 4.8, 22, 18.6, 22.8, 'pink', { ch: 1.7, top: roll }], ['bolR', 10.7, -12, 4.8, 22, 18.6, 22.8, 'pink', { ch: 1.7, top: roll }],
    ['nose', 0, -14.2, 24.6, 3.2, 15.4, 21, 'pink', { ch: 1.4, front: roll }],
    ['neck', 0, BV + (hS(36) - BH0) * TILT - 2.5, 9, 2.8, hS(34.6), hS(37.7), 'pinkL', { ch: 1.2, front: roll }],
    ['postL', -15.4, 1.2, 3.2, 3.4, 15.6, 27.4, 'steel'], ['postR', 15.4, 1.2, 3.2, 3.4, 15.6, 27.4, 'steel'],
    ['brkL', -14, .9, 3.6, 4, 15.4, 17.2, 'steel'], ['brkR', 14, .9, 3.6, 4, 15.4, 17.2, 'steel'],
    ['padL', -15.4, -7.4, 5.6, 12.6, 27.2, 29.8, 'arm', { ch: 1.1, top: pad }], ['padR', 15.4, -7.4, 5.6, 12.6, 27.2, 29.8, 'arm', { ch: 1.1, top: pad }],
    ['mech', 0, -7.2, 14.4, 14.4, 13.3, 15, 'steel'], ['ring', 0, -11.4, 22.8, 22.8, 12.6, 13.4, 'led', { cyl: 28 }],
    ['lift', 0, -2.2, 4.4, 4.4, 7.5, 13.3, 'chrome', { cyl: 16 }], ['cover', 0, -3.3, 6.6, 6.6, 3.4, 8.6, 'dark', { cyl: 16, kt: .78, base: 1 }],
    ['hub', 0, -3.8, 7.6, 7.6, 2.6, 4.6, 'dark', { cyl: 18, base: 1 }], ['hring', 0, -4.4, 8.8, 8.8, 4.6, 5.2, 'led', { cyl: 24, base: 1 }], ['cap', 0, -3.4, 6.8, 6.8, 5.2, 6.4, 'chrome', { cyl: 18, kt: .8, base: 1 }],
  ];   // base — частина хрестовини: стоїть, не крутиться з сидінням
  const MAT = { shell: { pal: PL.DESK, q: .5, bev: .8 }, cush: { pal: PL.DESK, q: .56, bev: .7 }, pink: { pal: C.leather, q: .5, bev: 1 }, pinkL: { pal: C.leather, q: .64, bev: .9 },
    arm: { pal: PL.MET, q: .4, bev: .7 }, steel: { pal: PL.STEEL, q: .6, bev: .5 }, chrome: { pal: PL.CHROME, q: .58, metal: 1, bev: 0 }, dark: { pal: PL.DARK, q: .62, bev: .4 },
    led: { pal: C.leather, q: .92, emit: 1, bev: 0 } };
  const BACK_ID = PARTS.length + 1, LEG_ID = BACK_ID + 1, WHEEL_ID = LEG_ID + 1;

  // ---------- ХРЕСТОВИНА Й КОЛІЩАТКА (стоїть: базис BASE_TURN = кут спокою; один промінь — рівно назад, за опорою) ----------
  const BASE_TURN = REST, LEG0 = .9425, TIP = [3.5, 4.4], WR = 1.6, WW = 1.6, WC = 15.6, WN = 16, SPLAY = .5;
  const WC0 = col(C.wheel[0]), WC1 = col(C.wheel[1]);
  /** Бік колеса: шина з відблиском угорі, світне кільце, хромова маточина з болтом. */
  const wheelSide = (u, v, i, j) => { const dd = Math.hypot(u - .5, v - .5);
    if (dd > .4) return ramp(PL.DARK, .34 + (v < .42 ? .22 : 0) + (u < .42 && v < .42 ? .08 : 0), i, j);
    if (dd > .26) { X.SH.fl |= X.F_EMIT; return dd > .33 ? WC0 : WC1; }
    if (dd < .07) return ramp(PL.DARK, .5, i, j);
    return ramp(PL.CHROME, .8 - dd * 1.6 + (u < .5 && v < .5 ? .08 : 0), i, j); };
  /** КОЛІЩАТКО — справжнє 3D-колесо (два боки + протектор) у точці (cu, cv) крісла; (au, av) — вісь у плані. */
  function wheel(L, Pt, cu, cv, au, av) {
    const eu = -av, ev = au, pt = (c, s, w) => Pt(cu + eu * WR * c + au * w, cv + ev * WR * c + av * w, WR * (1 + s));
    const hub = pt(0, 0, 0), ring = w => Array.from({ length: WN }, (_, k) => { const t = (k + .5) / WN * Math.PI * 2; return pt(Math.cos(t), Math.sin(t), w); });
    const nOut = poly => { let n = X.newell(poly); const m = poly.reduce((s, p) => [s[0] + p[0], s[1] + p[1], s[2] + p[2]], [0, 0, 0]).map(q => q / poly.length);
      if (X.dot(n, X.sub(m, hub)) < 0) n = n.map(q => -q); const l = Math.hypot(...n) || 1; return n.map(q => q / l); };
    const R1 = ring(WW / 2), R0 = ring(-WW / 2);
    for (const [poly, w] of [[R1, WW / 2], [R0, -WW / 2]]) { const O = pt(-1, 1, w);
      X.face(L, poly, O, X.sub(pt(1, 1, w), O), X.sub(pt(-1, -1, w), O), wheelSide, { id: WHEEL_ID, fid: WHEEL_ID, n: nOut(poly) }); }
    for (let k = 0; k < WN; k++) { const poly = [R1[k], R1[(k + 1) % WN], R0[(k + 1) % WN], R0[k]], up = Math.sin((k + 1) / WN * Math.PI * 2);
      X.face(L, poly, poly[0], X.sub(poly[3], poly[0]), X.sub(poly[1], poly[0]), (u, v, i, j) => ramp(PL.DARK, .3 + up * .28 + (u > .44 && u < .56 ? .12 : 0), i, j),
        { id: WHEEL_ID, fid: WHEEL_ID, n: nOut(poly) }); }
  }
  // КЕШ КАДРІВ: повний растр (R 4) — для кутів спокою (до стола, праворуч до Nexi, до глядача — заздалегідь), грубший (R 2) —
  // поки крісло обертається
  const keyOf = a => ((Math.round(a / 4) * 4) % 360 + 360) % 360;
  const HI = new Map(), LO = new Map(), PIN = [REST, 270, REST + 180].map(keyOf), TX = new Map(), LS = {}; let box = null;
  const put = (M, k, v, cap) => { M.set(k, v); if (M.size > cap) for (const q of M.keys()) if (!(M === HI && PIN.includes(q))) { M.delete(q); break; } };
  const texOf = (key, B, Fc, paint) => { if (!TX.has(key)) TX.set(key, A.texture(B, Fc, R, paint)); return TX.get(key); };
  const LED = [col(C.led[0]), col(C.led[1])], SIDE = [col(C.side[0]), col(C.side[1])];

  /** Витягнутий профіль спинки: грані лиця, тилу й боків. */
  function backFaces(b) {
    const V = (u, h, bk) => b.P(u * K, (BV + (hS(h) - BH0) * TILT + (bk ? BD : 0)) * K, FL - hS(h) * K);
    const fr = OUT.map(([u, h]) => V(u, h, 0)), bk = OUT.map(([u, h]) => V(u, h, 1)), out = [], sub = (p, q) => [p[0] - q[0], p[1] - q[1], p[2] - q[2]];
    const orient = (poly, ref) => { let n = X.newell(poly); const m = poly.reduce((s, p) => [s[0] + p[0] / poly.length, s[1] + p[1] / poly.length, s[2] + p[2] / poly.length], [0, 0, 0]), d = sub(m, ref);
      if (n[0] * d[0] + n[1] * d[1] + n[2] * d[2] < 0) n = [-n[0], -n[1], -n[2]]; const l = Math.hypot(...n) || 1; return [n[0] / l, n[1] / l, n[2] / l]; };
    const mid = V(0, 30, 0), cen = [(mid[0] + V(0, 30, 1)[0]) / 2, (mid[1] + V(0, 30, 1)[1]) / 2, (mid[2] + V(0, 30, 1)[2]) / 2];
    { const O = V(-BW, BH1, 0); out.push({ k: 'front', poly: fr, O, A: sub(V(BW, BH1, 0), O), B: sub(V(-BW, BH0, 0), O), fw: 2 * BW * K, fh: (BH1 - BH0) * K * HS, n: orient(fr, cen), side: 'f' }); }
    { const O = V(BW, BH1, 1); out.push({ k: 'back', poly: bk.slice().reverse(), O, A: sub(V(-BW, BH1, 1), O), B: sub(V(BW, BH0, 1), O), fw: 2 * BW * K, fh: (BH1 - BH0) * K * HS, n: orient(bk, cen), side: 'b' }); }
    for (let i = 0; i < OUT.length; i++) { const j = (i + 1) % OUT.length, poly = [fr[i], fr[j], bk[j], bk[i]], len = Math.hypot(...sub(fr[j], fr[i]));
      if (len < .05) continue; out.push({ k: 'left', poly, O: fr[i], A: sub(fr[j], fr[i]), B: sub(bk[i], fr[i]), fw: len, fh: BD * K, n: orient(poly, cen), side: 's' }); }
    return out;
  }

  /** Растр крісла під кут a (градуси): {back, front} — два полотна (позаду / попереду Nexi), x0, y0, w, h (од. кімнати). */
  function render(a, lo) {
    const key = keyOf(a); if (HI.has(key)) return HI.get(key); if (lo && LO.has(key)) return LO.get(key);
    const r = lo ? 2 : R, Cc = centre(), b = A.basis({ x: Cc[0], z: Cc[2], turn: key, sh: SH() }), Pt = (u, v, h) => b.P(u * K, v * K, FL - h * K);
    const b0 = A.basis({ x: Cc[0], z: Cc[2], turn: key }), b0s = A.basis({ x: Cc[0], z: Cc[2], turn: BASE_TURN });   // частини-коробки зсуваються самі (B.sh); b0s — хрестовина
    if (!box) {                                                                        // межі растра — одні на всі кути
      const pts = []; for (let q = 0; q < 8; q++) { const an = q / 8 * Math.PI * 2; [0, hS(BH1) + 2.5].forEach(h => pts.push(X.proj(shp([Cc[0] + Math.cos(an) * 22 * K, FL - h * K, Cc[2] + Math.sin(an) * 22 * K])))); }
      box = [Math.min(...pts.map(p => p[0])) - 3, Math.min(...pts.map(p => p[1])) - 3, Math.max(...pts.map(p => p[0])) + 3, Math.max(...pts.map(p => p[1])) + 3];
    }
    const L = LS[r] || (LS[r] = X.Layer(box[0], box[1], box[2], box[3], r)); L.c.fill(0); L.dep.fill(Infinity); L.id.fill(0); L.fid.fill(0); L.fl.fill(0);
    const front = new Set(), zc = Cc[2], Bx = { yb: FL - 20 * K };
    const BF = backFaces(b), bmid = Pt(0, BV + BD / 2 + 1.6, 0); if (bmid[2] < zc - 1.5) { front.add(BACK_ID); front.add(PARTS.findIndex(p => p[0] === 'neck') + 1); }
    BF.forEach(Fc => {
      if (!A.visible(Fc)) return;
      if (Fc.side === 's') { const base = A.shader('chair', Fc, Bx, { pal: C.leather, q: .34, bev: .25 }); X.face(L, Fc.poly, Fc.O, Fc.A, Fc.B, (u, v, i, j, t) => v < .2 ? (v < .1 ? SIDE[0] : SIDE[1]) : base(u, v, i, j, t), { id: BACK_ID, fid: BACK_ID, n: Fc.n }); return; }
      const tex = texOf('back' + Fc.side, Bx, Fc, Fc.side === 'f' ? backFront : backBack), base = A.shader('chair', Fc, Bx, { pal: PL.DESK, q: .5, bev: .3, tex }), mir = Fc.side === 'f' ? 1 : -1;
      X.face(L, Fc.poly, Fc.O, Fc.A, Fc.B, (u, v, i, j, t) => slot(mir * (-BW + u * 2 * BW), BH1 - v * (BH1 - BH0)) ? 0 : base(u, v, i, j, t), { id: BACK_ID, fid: BACK_ID, n: Fc.n });
    });
    PARTS.forEach(([nm, u, v0, w, d, h0, h1, mat, ex = {}], n) => {
      const id = n + 1, p0 = (ex.base ? b0s : b0).P(u * K, v0 * K, 0), B = { x: p0[0], z: p0[2], turn: ex.base ? BASE_TURN : key, sh: SH(), w: w * K, dep: d * K, yb: FL - h0 * K, yt: FL - h1 * K, ch: ex.ch ? [ex.ch * K, ex.ch * K] : null, cyl: ex.cyl, kt: ex.kt, id: 'chair_' + nm };
      const mid = Pt(u, v0 + d / 2, 0); if (/^pad|^post/.test(nm) && mid[2] < zc - 7) front.add(id);
      for (const Fc of A.faces(B)) {
        if (!A.visible(Fc)) continue;
        const paint = Fc.k === 'top' ? ex.top : Fc.k === 'front' ? ex.front : null, tex = paint ? texOf(nm + Fc.k, B, Fc, paint) : null;
        X.face(L, Fc.poly, Fc.O, Fc.A, Fc.B, A.shader('chair', Fc, B, Object.assign({ bev: .9, ins: 0, fog: 0 }, MAT[mat], { tex })), { id, fid: id, n: Fc.n });
      }
    });
    // ХРЕСТОВИНА: 5 гранених хромованих променів, що звужуються, по верху — LED-смужка; під кінцем кожного — шток і колесо
    const LEG = (u0, v0, i, j, side) => side === 't' ? (u0 > .4 && u0 < .6 && v0 > .08 && v0 < .92 ? (X.SH.fl |= X.F_EMIT, u0 > .46 && u0 < .54 ? LED[0] : LED[1]) : ramp(PL.CHROME, .42 + (1 - Math.abs(u0 - .5) * 2) * .4 - v0 * .08, i, j))
      : side === 'c' ? ramp(PL.STEEL, .55, i, j) : ramp(PL.CHROME, .18 + (1 - v0) * .2 + (side === 'a' ? .1 : 0), i, j);
    const sub = X.sub, bs = A.basis({ x: Cc[0], z: Cc[2], turn: BASE_TURN, sh: SH() }), Pb = (u, v, h) => bs.P(u * K, v * K, FL - h * K);
    const stem = (u0, v0, i, j) => ramp(PL.CHROME, .45 + (1 - Math.abs(u0 - .5) * 2) * .35, i, j);
    for (let q = 0; q < 5; q++) {
      const an = q / 5 * Math.PI * 2 + LEG0, cs = Math.cos(an), sn = Math.sin(an), V = (rr, o, h) => Pb(cs * rr - sn * o, sn * rr + cs * o, h);
      const A0t = V(2.6, -1.9, 5), B0t = V(2.6, 1.9, 5), A1t = V(16, -1.15, TIP[1]), B1t = V(16, 1.15, TIP[1]), A0b = V(2.6, -1.9, 2.8), B0b = V(2.6, 1.9, 2.8), A1b = V(16, -1.15, TIP[0]), B1b = V(16, 1.15, TIP[0]);
      const mid = V(9, 0, 3.6), fc = (poly, O, Ax, Bx2, side) => { let n = X.newell(poly); const m = poly.reduce((a2, p) => [a2[0] + p[0] / 4, a2[1] + p[1] / 4, a2[2] + p[2] / 4], [0, 0, 0]), d = sub(m, mid); if (n[0] * d[0] + n[1] * d[1] + n[2] * d[2] < 0) n = n.map(v => -v); const l = Math.hypot(...n) || 1; n = n.map(v => v / l);
        const F = { poly, n }; if (A.visible(F)) X.face(L, poly, O, sub(Ax, O), sub(Bx2, O), (u0, v0, i, j) => LEG(u0, v0, i, j, side), { id: LEG_ID, fid: LEG_ID, n }); };
      fc([A0t, B0t, B1t, A1t], A0t, B0t, A1t, 't'); fc([A0t, A1t, A1b, A0b], A0t, A1t, A0b, 'a'); fc([B0t, B0b, B1b, B1t], B0t, B1t, B0b, 'b'); fc([A1t, B1t, B1b, A1b], A1t, B1t, A1b, 'c');
      X.tube(L, V(WC, 0, TIP[0] + .3), V(WC, 0, 2 * WR - .2), .75 * K, stem, { id: LEG_ID, fid: LEG_ID });
      wheel(L, Pb, cs * WC, sn * WC, -Math.sign(cs) * Math.sin(SPLAY), Math.cos(SPLAY));
    }
    X.outline(L, () => A.C.out, lo ? 1 : 2);
    // два шари: позаду Nexi і попереду (спинка, коли вона між ним і глядачем); полотна — лише розміром з намальоване
    let i0 = L.W, i1 = -1, j0 = L.H, j1 = -1;
    for (let j = 0; j < L.H; j++) for (let i = 0, k = j * L.W; i < L.W; i++, k++) if (L.c[k]) { if (i < i0) i0 = i; if (i > i1) i1 = i; if (j < j0) j0 = j; if (j > j1) j1 = j; }
    if (i1 < 0) { i0 = j0 = 0; i1 = j1 = 0; }
    const W2 = i1 - i0 + 1, H2 = j1 - j0 + 1;
    const mk = sel => { const cv = document.createElement('canvas'); cv.width = W2; cv.height = H2; const x = cv.getContext('2d'), im = x.createImageData(W2, H2), d = new Uint32Array(im.data.buffer);
      for (let j = j0; j <= j1; j++) for (let i = i0, k = j * L.W + i0, o = (j - j0) * W2; i <= i1; i++, k++, o++) if (L.c[k] && sel(L.id[k])) d[o] = L.c[k];
      x.putImageData(im, 0, 0); return cv; };
    const out = { back: mk(id => !front.has(id)), front: mk(id => front.has(id)), x0: L.x0 + i0 / r, y0: L.y0 + j0 / r, w: W2 / r, h: H2 / r };
    if (lo) put(LO, key, out, 40); else put(HI, key, out, 10);
    return out;
  }

  const ks = K / 2;                                                                     // розмір відносно крісла маркетингу (K 2)
  return NX.addObject({
    id: cfg.id, name: cfg.name, act: cfg.act, REST,
    a: REST, tgt: REST, seated: false, idleT: 4,
    ready() { return !!zone(); },
    /** Точка підлоги під серединою крісла (екран) і глибина — для порядку малювання з Nexi. */
    floor() { return X.proj(shp(centre())); },
    depth() { return this.floor()[1]; },
    side() { const f = this.floor(), ft = this.foot; return [(ft ? ft[1] : f[0] + 40) + 15, Math.max(362, f[1] + 6)]; },   // праворуч від сліду крісла
    /** Куди сісти (екран). cfg.align: у зоні з сильним фронтальним зсувом (аналітика: fv 1.25) спинка, що ближче чи далі від
     *  глядача, на екрані з'їжджає вбік від сидіння — тоді Nexi зсувається до середини спинки (лише та частка, що від глибини:
     *  cos² кута — боком крісло стоїть як є), і спинка рівно ховає його, коли він працює, та рівно за ним, коли радіє. */
    seat() { const Cc = centre(), s = X.proj(shp([Cc[0], FL - 21 * K, Cc[2] + 2])), al = cfg.align || 0; if (!al) return s;
      const rr = this.a * Math.PI / 180, bv = (BV + BD / 2) * K, ca = Math.cos(rr), b = X.proj(shp([Cc[0] + Math.sin(rr) * bv, FL - 21 * K, Cc[2] + ca * bv]));
      return [s[0] + (b[0] - s[0]) * al * ca * ca, s[1]]; },
    /** Слід на підлозі (екран): коло хрестовини з коліщатками — Nexi й кіт обходять (world/room.js: route). */
    get foot() { if (!zone()) return null; if (!this._foot) { const Cc = centre(), pts = []; for (let q = 0; q < 16; q++) { const an = q / 16 * Math.PI * 2; pts.push(X.proj(shp([Cc[0] + Math.cos(an) * 17.5 * K, FL, Cc[2] + Math.sin(an) * 17.5 * K]))); }
      this._foot = [Math.min(...pts.map(p => p[0])), Math.max(...pts.map(p => p[0])), Math.min(...pts.map(p => p[1])), Math.max(...pts.map(p => p[1]))]; } return this._foot; },
    turnTo(deg) { let d = deg; while (d - this.a > 180) d -= 360; while (d - this.a < -180) d += 360; this.tgt = d; },
    spin(deg) { this.tgt = this.a + deg; },
    sitDown() { this.seated = true; }, standUp() { this.seated = false; this.turnTo(REST); },
    get span() { const f = zone() && this.floor(); return f ? [f[0] - 60 * ks, f[0] + 60 * ks] : null; },
    get hit() { if (!zone()) return null; const f = this.floor(), Cc = centre(), top = X.proj(shp([Cc[0], FL - (hS(BH1) + 1) * K, Cc[2] + BV * K]))[1]; return { x: f[0] - 33 * ks, y: top, w: 66 * ks, h: f[1] + 2 - top }; },
    update(dt, t) {
      if (!zone()) return;
      if (NX.loop.frames > 130 && !this.warm) { const k = PIN.find(q => !HI.has(q)); if (k === undefined) this.warm = true; else render(k, false); }   // кути спокою — заздалегідь, по одному за кадр
      const d = this.tgt - this.a, sp = (90 + Math.abs(d) * 5) * dt; this.a = Math.abs(d) <= sp ? this.tgt : this.a + Math.sign(d) * sp;
      if (!this.seated && Math.abs(d) < .5) { this.idleT -= dt; if (this.idleT < 0) { this.idleT = 6 + Math.random() * 6; this.turnTo(REST + (Math.random() < .5 ? 0 : (Math.random() - .5) * 10)); } }
      const n = NX.nexi;
      if (this.seated && n.loc === cfg.loc) {                                              // Nexi їде разом із кріслом: спиною / лицем / боком
        const rr = this.a * Math.PI / 180, fx = -Math.sin(rr), fz = -Math.cos(rr); n.back = fz > .2; if (Math.abs(fx) > .55) n.dir = fx > 0 ? 1 : -1;
        if (!(n.cur && (n.cur.hop || n.cur.fly))) { const s = this.seat(); n.x = s[0]; n.y = s[1]; }
      }
    },
    layers(t) {
      if (!zone()) return [];
      const fr = render(this.a, Math.abs(this.tgt - this.a) > 12), f = this.floor(), y = f[1], o = cfg.obj && NX.objects[cfg.obj], act = o && o.active, lit = .55 + .25 * Math.sin(t * 2.4) + (act ? .25 : 0);
      const draw = cv => c => { c.save(); c.imageSmoothingEnabled = true; c.drawImage(cv, fr.x0, fr.y0, fr.w, fr.h); c.restore(); };
      return [
        { y: y - .5, draw: c => { c.save(); c.fillStyle = 'rgba(4,2,14,.55)'; c.beginPath(); c.ellipse(f[0], f[1] + .5, 36 * ks, 5.2 * ks, 0, 0, 7); c.fill(); c.restore();
          P.glow(c, f[0], f[1] - 5, 40 * ks, C.glow[0], lit * .55); P.glow(c, f[0], f[1] + 1, 26 * ks, C.glow[1], lit * .3); draw(fr.back)(c); } },
        { y: y + .5, draw: draw(fr.front) },
      ];
    },
  });
};

// ---------- КРІСЛО АНАЛІТИКИ: та сама модель, більша й «обсерваторних» кольорів ----------
// Кольори: блакитна шкіра валиків і смуг, темно-синя стьобка, ЗОЛОТИЙ кант і вишитий N (латунь аналітики), темно-синій корпус,
// золоті кільця коліщат; LED-кільце й смужки хрестовини — блакитні. Кут спокою — 160° (рівно до стола: зона повернута на −20°).
NX.arc.raceChair({
  id: 'anChair', name: 'obj.analytics', act: 'analytics', obj: 'analytics', loc: 'anChair', zone: 'analytics', at: [384, 340, -32], K: 1.85, HS: 1.3, rest: 180, align: .9,
  colors: {
    bol: ['#04283c', '#2aa8d0', '#0d5574', '#0d5574', '#1a80a8', '#032236'], grain: 'rgba(200,245,255,.2)',
    quilt: ['#132a60', '#0d1c48', '#091438'], puff: 'rgba(96,170,240,.4)', pipe: '#ffc94d', stitch: 'rgba(255,240,200,.8)', lumbar: 'rgba(255,226,160,.6)',
    slotRim: 'rgba(170,240,255,.55)', emb: '#ffd27a', edge: 'rgba(190,245,255,.7)',
    shell: ['#1c3a80', '#12285c', '#0a1636'], gloss: 'rgba(180,220,255,.22)', stripe: ['#9af6ff', '#3be8ff', '#1a8ab0'], thread: '#ffd27a',
    ring: ['#ffc94d', '#fff2c4'], logo: ['#3be8ff', '#e4fdff'], rim: ['#3be8ff', 'rgba(214,250,255,.8)'],
    seatPuff: 'rgba(110,170,240,.38)', seatStitch: 'rgba(255,230,170,.7)', roll: 'rgba(214,250,255,.32)', rollStitch: 'rgba(214,250,255,.6)',
    pad: ['#3be8ff', '#e4fdff'], side: ['#9af6ff', '#3be8ff'], led: ['#e4fdff', '#3be8ff'], wheel: ['#ffc94d', '#fff2c4'],
    leather: NX.px3d.pal(['#04202e', '#073246', '#0c4a64', '#126482', '#1a80a2', '#2a9ec0', '#56c4e0', '#a6ecff']),
    glow: ['rgba(59,232,255,.8)', 'rgba(255,201,77,.6)'],
  },
});

/* ============================================================================
 * objects/tools.js — ІНСТРУМЕНТИ: дошка інтеграцій, перфодошка, верстат (усе кодом, NX.kit)
 * ----------------------------------------------------------------------------
 * Друга зона правого крила (x 1146..1312), між колоною маніпулятора й порталом:
 *   ДОШКА (x 1166..1306 × 164..306) — темна панель з блакитним неоновим кантом і бічною гранню до вікна,
 *     вивіска зони (K.sign «ІНСТРУМЕНТИ» мовою глядача, іконка — шестерня), планка з вогниками;
 *     ТРИ ПЛИТКИ ІНТЕГРАЦІЙ угорі — пошта, календар, CRM (живі: по черзі пульсують; коли Nexi працює —
 *     підключаються по одній: зелена галочка й «ОК»), знизу — екран-асистент (обличчя бота блимає,
 *     скан-лінія) і екран автоматизації (вузли зі стрілками, по них біжать імпульси), між ними —
 *     ПЕРФОДОШКА з помаранчевим підсвічуванням: ключ, молоток, викрутка, пасатижі, моток дроту
 *     гойдаються на гачках (сильніше, коли Nexi ремонтує).
 *   НАСТІННИЙ ЛІХТАР на колоні ліворуч — тепле світло (серпанок — rwing_plants.js / wingAir).
 *   ВЕРСТАТ (K.desk): рожева неонова плита, глянцевий верх з віддзеркаленням речей, тумби з шухлядами й
 *     LED, ніша з лотком кабелів і подовжувачем, бічна грань до вікна; на ньому: ЯЩИК З ІНСТРУМЕНТАМИ
 *     (кришка відкривається, коли Nexi працює), мультиметр з живим дисплеєм, паяльна станція з
 *     температурою, лампа на кронштейні (загоряється, коли Nexi тут), гвинтики, мікросхема, папери.
 * ВЗАЄМОДІЯ (як і була): тап — Nexi злітає на ранці до дошки (POI.tools.hover) і ремонтує / підключає;
 *   кабель від дошки до Nexi з імпульсами даних; задачі зони — по черзі (ui/zones.js), картка результату.
 * ========================================================================== */
(() => {
  const P = NX.px, F = NX.furn, K = NX.kit, RW = NX.rwing, { NAVY, PINK, CYAN, CHROME, OUT } = F.PAL, ramp = F.ramp, hash = NX.art.hash, rgba = K.rgba, lit = K.lit, noise = K.noise;
  const ACC = ['#0a2a4a', '#17709a', '#2aa6c8', '#3be8ff'];                         // акцент зони — блакитний
  const STEEL = ['#06051a', '#0c0a28', '#141038', '#1c164a', '#261e5e', '#322874', '#40348c', '#5244a6'];
  const BOARD = { x0: 1166, y0: 164, x1: 1306, y1: 306, sign: [1178, 172, 1294, 198] };
  const TILES = [[1180, 206, 1214, 246], [1219, 206, 1253, 246], [1258, 206, 1292, 246]], KEYS = ['mail', 'cal', 'crm'];
  const SCR = { bot: [1180, 254, 1216, 298], auto: [1258, 254, 1292, 298] }, PEG = [1220, 252, 1254, 300];
  const LCD = [1178, 204, 1294, 300];                                               // одне полотно на всі плитки й екрани
  const DESK = { l: 1146, r: 1312, top: 314, slab: 321, bot: 350, back: 306, sec: [{ a: 1150, b: 1186, kind: 'drawers', rows: 3 }, { a: 1186, b: 1270, kind: 'niche' }, { a: 1270, b: 1308, kind: 'drawers', rows: 3 }],
    refl: [[1166, 1306, '#2a9ad0', .3], [1222, 1252, '#ff9a3a', .25]], under: [{ tray: [1189, 1267], drops: [1196, 1236], strip: [1202, 1230] }] };
  const BOX = { x: 1188, w: 30, y: 312 }, METER = [1236, 300, 1250, 312], SOLDER = [1272, 302, 1292, 312], LAMP = { x: 1302, y: 312 }, LANT = { x: 1158, y: 224, w: 9, h: 24 };
  const ITEMS = [{ kind: 'papers', x: 1253.4, y: 311.6, w: 9, n: 3, seed: 6, pen: 1 }, { kind: 'pens', x: 1226, y: 311.4 }];
  const toL = (x, y, f = .035) => F.toVP(x, y, f);

  RW.shades.push({ box: [BOARD.x0, BOARD.y0, BOARD.x1, BOARD.y1], dx: 3, dy: 2.5, r: 14, k: .5 }, { box: [DESK.l, DESK.back, DESK.r, DESK.bot], dx: 2, dy: 1, r: 8, k: .45 }, { ell: [LANT.x + 6, LANT.y + 14, 7, 12], k: .4 });
  RW.drips.push({ x: 1170, y: 306, len: 8, w: .8, k: .35 }, { x: 1300, y: 164 - 1, len: 10, w: .8, k: .3 }, { x: 1162, y: LANT.y + LANT.h, len: 16, w: .9, k: .45, rust: 1 });

  // ---------- ДОШКА (4 px/од.) ----------
  function buildBoard() {
    const S = F.Sheet(1158, 156, 1312, 312), { x0, y0, x1, y1 } = BOARD;
    S.poly([[x0 + .4, y0 + 6], toL(x0, y0 + 6), toL(x0, y1), [x0 + .4, y1]], (u, v, i, j) => u > .8 ? ACC[1] : ramp(NAVY, .26 - v * .16, i, j));   // бічна грань до вікна
    S.rr(x0, y0, x1, y1, [6, 6, 1.5, 1.5], (d, u, v, i, j, X, Y) => {
      if (d < .7) return ACC[1]; if (d < 1.6) return ACC[3]; if (d < 2.3) return ACC[1];
      if (d < 3.6) return v < .5 ? NAVY[6] : NAVY[4];
      if (X > x1 - 11) return Math.abs(X - (x1 - 9.5)) < .5 ? NAVY[6] : ramp(NAVY, .3 - v * .14, i, j, .12);   // права планка (вогники — живі)
      return ramp(NAVY, .42 - v * .22, i, j, .12);
    });
    S.rr(BOARD.sign[0] - 2, BOARD.sign[1] - 2, BOARD.sign[2] + 2, BOARD.sign[3] + 2, 4, (d) => d < .6 ? '#05031a' : '#0d0828');
    S.rr(LCD[0] - 1, LCD[1] - 1, LCD[2] + 1, LCD[3] + 1, 2, (d, u, v, i, j) => d < .6 ? NAVY[0] : ramp(NAVY, .12, i, j));                  // ніша під плитки
    [...TILES, SCR.bot, SCR.auto].forEach(([a, b, c2, e]) => S.rr(a - 2.2, b - 2.2, c2 + 2.2, e + 2.2, 2.2, (d, u, v, i, j) => d < .6 ? '#06102e' : d < 1.4 ? ACC[1] : d < 2.2 ? ACC[3] : null));   // рамки
    // перфодошка: темна плита з дірочками, помаранчевий кант, гачки
    const [a, b, c2, e] = PEG;
    S.rr(a, b, c2, e, 1.2, (d, u, v, i, j, X, Y) => { if (d < .5) return OUT; if (d < 1.3) return '#ff9a3a'; if (d < 1.8) return '#3a1408'; const hx = ((X - a - 3) % 4 + 4) % 4, hy = ((Y - b - 3) % 4 + 4) % 4; return hx < 1 && hy < 1 ? '#05030e' : ramp(['#120c30', '#1a1240', '#221850'], .5 - v * .4, i, j); });
    // настінний ліхтар на колоні: кронштейн, клітка, тепле скло
    const L = LANT; S.poly([[L.x - 3, L.y + 8], [L.x + 1, L.y + 8], [L.x + 1, L.y + 12], [L.x - 3, L.y + 10]], (u, v, i, j) => ramp(CHROME, .6 - v * .3, i, j));
    S.rr(L.x, L.y, L.x + L.w, L.y + L.h, [3, 3, 1.5, 1.5], (d, u, v, i, j, X, Y) => { if (d < .5) return '#1a0804'; if (d < 1.4) return ramp(['#5c2410', '#9a4a1a', '#c8742a'], .7 - v * .4, i, j); if (Math.abs(X - L.x - L.w / 2) < .45 || ((Y - L.y) % 6) < .6) return '#6a3010'; return ramp(['#c86a1e', '#f0a03a', '#ffd06a', '#ffe9a6', '#fff8dc'], .9 - Math.abs(u - .5) * 1.4 - Math.abs(v - .5) * .5, i, j); });
    S.rr(L.x - 1, L.y - 2.6, L.x + L.w + 1, L.y + .5, 1, (d, u, v, i, j) => d < .4 ? OUT : ramp(['#3a1408', '#6e3418', '#a85a26'], .7 - v * .5, i, j));
    return S;
  }
  // ---------- ВЕРСТАТ (4 px/од.) ----------
  function buildBench() {
    const S = F.Sheet(1138, 290, 1316, 352);
    S.poly([[DESK.l + .4, DESK.top], toL(DESK.l, DESK.top, .04), toL(DESK.l, DESK.bot - 4, .04), [DESK.l + .4, DESK.bot - 4]], (u, v, i, j, X, Y) => Y < DESK.slab + .4 ? PINK[3] : ramp(['#07041a', '#0d0828', '#140c36', '#1c1146'], .32 - v * .2, i, j));   // бічна грань до вікна
    K.desk(S, DESK);
    K.trinkets(S, DESK, ITEMS, 'shadow');
    K.contacts(S, DESK, [[BOX.x - 1, BOX.x + BOX.w + 3, BOX.y - .2, .75], [METER[0], METER[2], METER[3], .7], [SOLDER[0], SOLDER[2], SOLDER[3], .7], [LAMP.x - 4, LAMP.x + 3, LAMP.y, .6]]);
    const base = K.snap(S);
    // мультиметр: корпус, дисплей (цифри — живі), перемикач, щупи
    S.rr(METER[0], METER[1], METER[2], METER[3], 1.2, (d, u, v, i, j, X, Y) => d < .4 ? OUT : (v > .12 && v < .42 && u > .14 && u < .86) ? '#0a1a10' : (Math.hypot(X - (METER[0] + METER[2]) / 2, Y - METER[3] + 3.6) < 2.2 ? CHROME[3] : ramp(['#8a6a10', '#c89a1c', '#f0c040'], .7 - v * .4, i, j)));
    [[METER[0] + 3, METER[3], 1232, 313.2, '#d0203a'], [METER[2] - 3, METER[3], 1254, 313.4, '#1a1a1a']].forEach(([x0, y0, x1, y1, col]) => { S.line(x0, y0, x1, y1, OUT, .9); S.line(x0, y0 - .2, x1, y1 - .2, col, .45); });
    // паяльна станція з підставкою й паяльником
    S.rr(SOLDER[0], SOLDER[1], SOLDER[0] + 12, SOLDER[3], 1, (d, u, v, i, j) => d < .4 ? OUT : (v > .18 && v < .5 && u > .15 && u < .85) ? '#1a0606' : ramp(['#2a1a4a', '#3a2a66', '#4a3a82'], .7 - v * .4, i, j));
    S.line(SOLDER[0] + 14, SOLDER[3], SOLDER[0] + 17, SOLDER[1] + 1, OUT, 1.6); S.line(SOLDER[0] + 14, SOLDER[3], SOLDER[0] + 17, SOLDER[1] + 1, CHROME[3], .7);   // спіраль-підставка
    S.line(SOLDER[0] + 13, SOLDER[1] + 4, SOLDER[0] + 21, SOLDER[1] - 3, OUT, 1.5); S.line(SOLDER[0] + 13, SOLDER[1] + 4, SOLDER[0] + 21, SOLDER[1] - 3, '#3a6ac0', .8);   // паяльник
    // лампа на кронштейні (світить живим, коли Nexi тут)
    S.rr(LAMP.x - 3.6, LAMP.y - 1.6, LAMP.x + 2.4, LAMP.y, .6, (d, u, v, i, j) => d < .3 ? OUT : ramp(CHROME, .6 - v * .3, i, j));
    S.line(LAMP.x - .6, LAMP.y - 1.4, LAMP.x - 2, LAMP.y - 12, OUT, 1.3); S.line(LAMP.x - .6, LAMP.y - 1.4, LAMP.x - 2, LAMP.y - 12, CHROME[3], .6);
    S.line(LAMP.x - 2, LAMP.y - 12, LAMP.x - 9, LAMP.y - 15, OUT, 1.3); S.line(LAMP.x - 2, LAMP.y - 12, LAMP.x - 9, LAMP.y - 15, CHROME[3], .6);
    S.poly([[LAMP.x - 13, LAMP.y - 17.5], [LAMP.x - 7.5, LAMP.y - 16.5], [LAMP.x - 8.5, LAMP.y - 12.4], [LAMP.x - 14.4, LAMP.y - 13.6]], (u, v, i, j) => v > .8 ? '#ffe9a6' : ramp(['#3a2470', '#5a3ca0', '#7a5ac0'], .7 - v * .4, i, j));
    // дрібниці: гвинтики, мікросхема, моток ізострічки
    [[1222, 312.6], [1224.6, 312.4], [1257, 312.8]].forEach(([x, y]) => S.rr(x - .8, y - .8, x + .8, y + .2, .4, (d) => d < .25 ? OUT : CHROME[4]));
    S.rr(1166, 309.6, 1176, 312.6, .4, (d, u, v) => d < .3 ? OUT : (u * 10 | 0) % 2 && (v < .2 || v > .8) ? CHROME[4] : '#141428');
    S.rr(1178, 308.4, 1183.4, 312.8, 2.2, (d, u, v, i, j, X, Y) => Math.hypot(X - 1180.7, Y - 310.6) < 1 ? '#0a0414' : d < .3 ? OUT : ramp(['#7a0a2a', '#b81a3a', '#e8405a'], .7 - v * .4, i, j));
    K.trinkets(S, DESK, ITEMS, 'items');
    K.gloss(S, DESK, base, .4);
    K.wire(S, [[SOLDER[0] + 12, SOLDER[3] - 1], [1288, 309], [1290, 306.6]]); K.wire(S, [[METER[2], METER[3] - 1], [1251, 308], [1250, 306.4]]);
    return S;
  }
  // ---------- ЯЩИК З ІНСТРУМЕНТАМИ (шар; кришка відкривається) ----------
  function buildBox() {
    const S = F.Sheet(0, 0, BOX.w, 12), W = BOX.w, R2 = ['#5a2410', '#8a3a18', '#c9612e', '#e88a3a', '#ffb070'];
    S.rr(0, 2, W, 12, [1, 1, .6, .6], (d, u, v, i, j, X, Y) => { if (d < .5) return OUT; if (Y < 3.4) return R2[4]; if (Math.abs(Y - 6.5) < .5) return R2[1]; if (Math.abs(X - W / 2) < 2.2 && Y > 4 && Y < 6) return Y < 4.8 ? CHROME[4] : CHROME[2]; return ramp(R2, .85 - v * .5 - (u > .85 ? .2 : 0), i, j, .06); });
    const lid = F.Sheet(0, 0, W, 4); lid.rr(0, 0, W, 3.6, [1.2, 1.2, .3, .3], (d, u, v, i, j) => d < .5 ? OUT : ramp(R2, .95 - v * .5, i, j, .06)); lid.rr(W / 2 - 4, -1, W / 2 + 4, 1.2, .5, (d) => d < .3 ? OUT : CHROME[3]);
    return { body: S.canvas(), lid: lid.canvas() };
  }

  // ---------- живі плитки й екрани (одне полотно 3 px/од., раз на 3 кадри) ----------
  const LW = Math.round((LCD[2] - LCD[0]) * 3), LH = Math.round((LCD[3] - LCD[1]) * 3), [LCV, lx] = F.canvas(LW, LH);
  const IC = {
    mail: ['XXXXXXXXX', 'XX.....XX', 'X.X...X.X', 'X..X.X..X', 'X...X...X', 'X.......X', 'XXXXXXXXX'],
    cal: ['.X.....X.', 'XXXXXXXXX', 'X.......X', 'X.X.X.X.X', 'X.......X', 'X.X.X.X.X', 'XXXXXXXXX'],
    crm: ['..XXX....', '.X...X...', '.X...X.XX', '..XXX.X..', 'XX...XXX.', 'X.X.X..X.', 'XX.XX..X.'],
  };
  const R3 = ([a, b, c2, e]) => [(a - LCD[0]) * 3, (b - LCD[1]) * 3, (c2 - a) * 3, (e - b) * 3];
  function drawLCD(c, t, on, n, prog) {
    c.clearRect(0, 0, LW, LH);
    TILES.forEach((tr, k) => {                                                       // плитки інтеграцій: пошта, календар, CRM
      const [x, y, w, h] = R3(tr), ok = k < n, pulse = (Math.floor(t * 1.2) % 3) === k, busy = on && k === n;
      const g = c.createLinearGradient(0, y, 0, y + h); g.addColorStop(0, ok ? 'rgba(30,140,90,.75)' : 'rgba(40,110,220,.6)'); g.addColorStop(1, ok ? 'rgba(10,70,50,.75)' : 'rgba(20,60,170,.6)'); c.fillStyle = g; c.fillRect(x, y, w, h);
      const ic = IC[KEYS[k]], px = 7, iw = ic[0].length * px, ix = x + (w - iw) / 2, iy = y + 12, col = ok ? '#7affb4' : (pulse || busy ? '#d8fbff' : '#7ad8ff');
      c.save(); c.globalCompositeOperation = 'lighter'; c.globalAlpha = busy ? .6 + .4 * Math.sin(t * 12) : 1;
      ic.forEach((row, j) => [...row].forEach((ch, i) => { if (ch === 'X') { c.fillStyle = col; c.fillRect(ix + i * px, iy + j * px, px - 1, px - 1); } }));
      c.restore();
      const lb = NX.t('scene.tools.' + KEYS[k]); P.text(c, lb, x + w / 2, y + h - 12, ok ? '#c8ffd8' : '#bfe9ff', Math.min(12, (w - 10) / lb.length * 1.2), 'center');
      if (ok) { c.fillStyle = '#3bff8a'; [[w - 26, h - 46, 6, 9], [w - 20, h - 40, 6, 6], [w - 14, h - 58, 6, 21]].forEach(([a, b, c2, e]) => c.fillRect(x + a, y + b, c2, e)); }   // галочка
      if (busy) { c.fillStyle = 'rgba(255,255,255,.6)'; c.fillRect(x, y + ((t * 60) % h), w, 3); }
    });
    {                                                                                // екран-асистент: обличчя бота, рядки статусу
      const [x, y, w, h] = R3(SCR.bot); c.fillStyle = 'rgba(20,70,200,.65)'; c.fillRect(x, y, w, h);
      const blink = (t % 3.5) < .15, fx = x + w / 2;
      c.fillStyle = '#9af6ff'; c.fillRect(fx - 30, y + 14, 60, 42); c.fillStyle = '#06102e'; c.fillRect(fx - 26, y + 18, 52, 34);
      c.fillStyle = on ? '#7affb4' : '#5ae8ff'; if (!blink) { c.fillRect(fx - 17, y + 27, 10, 10); c.fillRect(fx + 7, y + 27, 10, 10); } else { c.fillRect(fx - 17, y + 32, 10, 3); c.fillRect(fx + 7, y + 32, 10, 3); }
      c.fillRect(fx - 8, y + 44, 16, 3); c.fillStyle = '#9af6ff'; c.fillRect(fx - 2, y + 4, 4, 10);
      for (let k = 0; k < 4; k++) { lit(c, x + 10, y + 70 + k * 14, 8, 8, k < (on ? n + 1 : 2) ? '#3bff8a' : '#2a4a8a'); lit(c, x + 24, y + 72 + k * 14, 40 + 30 * noise(t * .4, k + 7), 4, '#bfe9ff'); }
      c.fillStyle = 'rgba(122,240,255,.5)'; c.fillRect(x, y + ((t * 18 * 3) % h), w, 2);
    }
    {                                                                                // екран автоматизації: вузли зі стрілками, імпульси
      const [x, y, w, h] = R3(SCR.auto); c.fillStyle = 'rgba(20,70,200,.65)'; c.fillRect(x, y, w, h);
      const lb = NX.t('scene.tools.auto'); P.text(c, lb, x + w / 2, y + 16, '#bfe9ff', Math.min(11, (w - 8) / lb.length * 1.2), 'center');
      const N = [[x + 18, y + 40], [x + w - 18, y + 40], [x + w / 2, y + 74], [x + 18, y + 108], [x + w - 18, y + 108]], E = [[0, 2], [1, 2], [2, 3], [2, 4]];
      c.strokeStyle = 'rgba(122,240,255,.6)'; c.lineWidth = 3; E.forEach(([a, b]) => { c.beginPath(); c.moveTo(...N[a]); c.lineTo(...N[b]); c.stroke(); });
      E.forEach(([a, b], k) => { const q = (t * (on ? 1.2 : .5) + k * .25) % 1; lit(c, N[a][0] + (N[b][0] - N[a][0]) * q - 3, N[a][1] + (N[b][1] - N[a][1]) * q - 3, 6, 6, k % 2 ? '#ffe27a' : '#ff7af0'); });
      N.forEach(([nx, ny], k) => { c.fillStyle = k === 2 ? '#ff7af0' : '#5ae8ff'; c.fillRect(nx - 7, ny - 7, 14, 14); c.fillStyle = '#06102e'; c.fillRect(nx - 4, ny - 4, 8, 8); });
    }
  }

  let BS = null, BN = null, BX = null;
  function ensure() { if (BS) return; BS = buildBoard(); BS.cv = BS.canvas(); BN = buildBench(); BN.cv = BN.canvas(); BX = buildBox(); }
  RW.static(40, () => (ensure(), BS)); RW.static(41, () => BN);                    // нерухоме — у злиття правого крила (rwing_wall.js)
  const tools = NX.addObject({
    id: 'tools', name: 'obj.tools', act: 'tools', rw: true, span: [1136, 1318],
    hit: { x: 1146, y: 160, w: 166, h: 190 }, active: false, prog: 0, fr: 0,
    ICONS: TILES.map(([a, b, c2, e]) => [a, b, c2 - a, e - b]),
    drawBack(c, t) {
      ensure();
      const P0 = NX.cfg.POI.tools, on = this.active, n = on ? Math.floor(this.prog * 4) : (this.done ? 3 : 0), R = F.res(), act = on ? 1 : 0;
      if ((this.fr++ % 3) === 0) drawLCD(lx, t, on, n, this.prog);
      c.save();
      c.imageSmoothingEnabled = true; c.globalAlpha = K.flick(t, 51); c.drawImage(LCV, LCD[0], LCD[1], LCD[2] - LCD[0], LCD[3] - LCD[1]); c.globalAlpha = 1;
      // перфодошка: помаранчеве підсвічування і інструменти на гачках (гойдаються)
      const [a, b, c2, e] = PEG; c.globalCompositeOperation = 'lighter'; RW.glow(c, (a + c2) / 2, (b + e) / 2 + 6, 26, 'rgba(255,140,60,.8)', .22 + .05 * Math.sin(t * 2.1)); c.globalCompositeOperation = 'source-over';
      const sw = k => Math.sin(t * (on ? 6 : 1.4) + k) * (on ? .18 : .06);
      const hang = (hx, hy, k, fn) => { c.save(); c.translate(hx, hy); c.rotate(sw(k)); fn(); c.restore(); P.rect(c, hx - .8, hy - .8, 1.6, 1.6, '#c3cbea'); };
      hang(a + 6, b + 5, 0, () => { P.rect(c, -.9, 0, 1.8, 14, '#c3cbea'); P.rect(c, -2.6, 0, 5.2, 2.6, '#c3cbea'); P.rect(c, -.9, .6, 1.8, 1, '#120c30'); P.rect(c, -2.6, 12.4, 5.2, 2.8, '#c3cbea'); P.rect(c, -.4, 1.6, .5, 11, '#ffffff'); });   // ключ
      hang(a + 14, b + 5, 1, () => { P.rect(c, -.9, 2, 1.8, 16, '#a0703a'); P.rect(c, -4, 0, 8, 3.6, '#aab4d6'); P.rect(c, -4, 0, 8, .9, '#e9eefc'); });                                    // молоток
      hang(a + 22, b + 5, 2, () => { P.rect(c, -.8, 0, 1.6, 9, '#c3cbea'); P.rect(c, -1.8, 9, 3.6, 8, '#ffc94d'); P.rect(c, -1.8, 9, 1, 8, '#ffe27a'); });                                  // викрутка
      hang(a + 28.5, b + 5, 3, () => { P.rect(c, -.6, 0, 1.2, 8, '#c3cbea'); P.rect(c, -1.6, 8, 3.2, 6, '#3be8ff'); });                                                                      // тестер
      hang(a + 9, b + 26, 4, () => { P.rect(c, -2.6, 0, 1.8, 10, '#aab4d6'); P.rect(c, .8, 0, 1.8, 10, '#aab4d6'); P.rect(c, -3.4, 9, 7, 5, '#d93a4a'); P.rect(c, -3.4, 9, 7, 1, '#ff7a8a'); });   // пасатижі
      hang(a + 22, b + 26, 5, () => { c.strokeStyle = '#ffc94d'; c.lineWidth = 1.4; c.beginPath(); c.arc(0, 5.5, 4.4, 0, 7); c.stroke(); c.strokeStyle = '#ffe9a0'; c.lineWidth = .5; c.beginPath(); c.arc(0, 5.5, 4.4, 3.6, 5.2); c.stroke(); });   // моток дроту
      // кант і планка дихають, вогники
      c.globalCompositeOperation = 'lighter';
      c.strokeStyle = rgba('59,232,255', .14 + .08 * Math.sin(t * 1.8) + act * .12); c.lineWidth = 3; c.beginPath(); c.roundRect ? c.roundRect(BOARD.x0 - 1, BOARD.y0 - 1, BOARD.x1 - BOARD.x0 + 2, BOARD.y1 - BOARD.y0 + 2, 7) : c.rect(BOARD.x0, BOARD.y0, BOARD.x1 - BOARD.x0, BOARD.y1 - BOARD.y0); c.stroke();
      for (let k = 0; k < 6; k++) lit(c, BOARD.x1 - 6.6, BOARD.y0 + 18 + k * 20, 1.6, 1.6, rgba('59,232,255', .3 + .6 * (Math.floor(t * 4 + k) % 4 === 0)));
      [...TILES, SCR.bot, SCR.auto].forEach(([x0, y0, x1, y1], k) => RW.glow(c, (x0 + x1) / 2, (y0 + y1) / 2, (x1 - x0) * .8, k < 3 && k < n ? 'rgba(60,255,140,.6)' : 'rgba(70,140,255,.6)', .12 + act * .08));
      const L = LANT, fl = .82 + .1 * Math.sin(t * 6.1) + .06 * Math.sin(t * 13.3);
      RW.glow(c, L.x + L.w / 2, L.y + L.h / 2, 24, 'rgba(255,180,80,.9)', .3 * fl); RW.glow(c, L.x + L.w / 2, L.y + L.h / 2, 8, 'rgba(255,230,160,1)', .4 * fl);
      c.restore();
      K.sign(c, BOARD.sign[0], BOARD.sign[1], BOARD.sign[2] - BOARD.sign[0], BOARD.sign[3] - BOARD.sign[1], { acc: ACC, icon: 'gear', key: 'nav.tools', t, glow: '59,232,255' });
      this.drawBench(c, t, act);
      // кабель від дошки до Nexi з імпульсами (коли він працює)
      if (on && !RW.patching) { const n2 = NX.nexi, x0 = 1236, y0 = 300, x1 = n2.x + 8, y1 = n2.y - 30, mx = (x0 + x1) / 2, my = Math.max(y0, y1) + 18;
        c.strokeStyle = OUT; c.lineWidth = 2.4; c.beginPath(); c.moveTo(x0, y0); c.quadraticCurveTo(mx, my, x1, y1); c.stroke(); c.strokeStyle = '#2a3a7a'; c.lineWidth = 1.2; c.stroke();
        for (let k = 0; k < 3; k++) { const q = (t * 1.5 + k / 3) % 1, px = (1 - q) * (1 - q) * x0 + 2 * (1 - q) * q * mx + q * q * x1, py = (1 - q) * (1 - q) * y0 + 2 * (1 - q) * q * my + q * q * y1; P.rect(c, px - 1, py - 1, 2.4, 2.4, '#7af0ff'); RW.glow(c, px, py, 6, 'rgba(122,240,255,.9)', .7); } }
    },
    drawBench(c, t, act) {
      if (!BN) return;
      c.save(); c.globalCompositeOperation = 'lighter';
      c.fillStyle = rgba('255,79,216', .3 + .2 * Math.sin(t * 2.2) + act * .2); c.fillRect(DESK.l + 1, DESK.top + .5, DESK.r - DESK.l - 2, 1.4);   // неон плити
      const sp = DESK.l + ((t * .2 + .5) % 1) * (DESK.r - DESK.l); lit(c, sp - 5, DESK.top + .4, 10, 1, 'rgba(255,255,255,.8)');
      for (let x = 1188; x < 1268; x += 2) lit(c, x, DESK.bot - 9.8, 1.4, 1, act ? `hsla(${(t * 120 + x * 4) % 360},95%,62%,.8)` : rgba('59,232,255', .3 + .3 * Math.sin(t * 2 + x * .1)));   // LED ніші
      for (const s of DESK.sec) for (let x = s.a + 1.5; x < s.b - 1.5; x += 2) lit(c, x, DESK.bot - 2.2, 1.3, 1.2, rgba('59,232,255', .3 + .25 * Math.sin(t * 2 + x * .12)));
      // лампа на кронштейні: загоряється, коли Nexi тут — тепле коло на верстаті
      const lv = this.lamp || 0; if (lv > .02) { RW.glow(c, LAMP.x - 11, LAMP.y - 13, 6, 'rgba(255,236,170,1)', .6 * lv); c.fillStyle = rgba('255,214,150', .16 * lv); c.beginPath(); c.moveTo(LAMP.x - 14, LAMP.y - 13.4); c.lineTo(LAMP.x - 8, LAMP.y - 12.6); c.lineTo(LAMP.x - 2, DESK.top - .6); c.lineTo(LAMP.x - 26, DESK.top - .6); c.fill(); RW.glow(c, LAMP.x - 14, DESK.top - 2, 14, 'rgba(255,214,150,.9)', .25 * lv); }
      c.globalCompositeOperation = 'source-over';
      // мультиметр і паяльна станція: живі дисплеї
      const v = act ? 4.8 + .3 * Math.sin(t * 7) : 3.3 + .02 * Math.sin(t * 3); P.text(c, NX.num(v, 2), METER[0] + 7, METER[1] + 4.6, '#7affb4', 3.2, 'center');
      const tmp = Math.round(act ? 340 + 8 * Math.sin(t * 2) : 210); P.text(c, String(tmp), SOLDER[0] + 6, SOLDER[1] + 4.6, act ? '#ff9a5a' : '#ff6a4a', 3, 'center');
      if (act && Math.random() < .08) NX.fx.emit('spark', SOLDER[0] + 21, SOLDER[1] - 3, { col: '#ffb070' });
      K.trinketsLive(c, DESK, ITEMS, t, act);
      K.underLive(c, DESK, t, act);
      K.deskShine(c, DESK, t, [[1200, 12, '90,200,255'], [1240, 22, '255,170,90'], [1290, 12, '90,232,255']], [[1222, 1252, '255,150,70', .1, 307.6], [1176, 1210, '90,200,255', .06, 307.6]]);
      c.restore();
    },
    update(dt) { this.lamp = (this.lamp || 0) + ((this.active ? 1 : 0) - (this.lamp || 0)) * Math.min(1, dt * (this.active ? 4 : 1.5)); },
    reflect(c, t) { if (BN) K.draw(c, BN, Math.min(2, F.res())); },
    layers(t) {
      const on = this.active;
      return [{ y: BOX.y, draw: c => {
        if (!BX) return; const R = F.res(), { x, w, y } = BOX;
        c.save(); c.imageSmoothingEnabled = R < 3.8; c.drawImage(BX.body, x, y - 12, w, 12);
        if (on) { c.save(); c.translate(x, y - 10); c.rotate(-.55 - Math.sin(t * 4) * .1); c.drawImage(BX.lid, 0, -3.6, w, 4); c.restore(); c.globalCompositeOperation = 'lighter'; RW.glow(c, x + w / 2, y - 9, 14, 'rgba(255,180,80,.8)', .55); c.globalCompositeOperation = 'source-over'; if (Math.random() < .15) NX.fx.emit('spark', x + w / 2, y - 10); }
        else c.drawImage(BX.lid, x, y - 12.6, w, 4);
        P.rect(c, x + w / 2 - 1.6, y - 6.6, 3.2, 2.4, on ? '#3be8ff' : '#2a3a7a');
        c.restore();
      } }];
    },
  });
  RW.reflectors.push((c, t) => tools.reflect(c, t));
})();

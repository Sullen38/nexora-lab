/* ============================================================================
 * objects/analytics.js — ЗОНА АНАЛІТИКИ: будка з екранами + стіл (конструктор NX.kit)
 * ----------------------------------------------------------------------------
 * Друга зона лівого крила (x 322..486), далі й вище за AI-центр.
 *   БУДКА — темно-синя панель з блакитним кантом, вивіска з краплею і написом
 *           (мовою глядача), два голо-екрани: USERS (аватари + стовпчики) і
 *           TREND (графік + "пончик"); стоїть на столі
 *   СТІЛ  — рожева плита 280..290, видимий верх 275..280, дві тумби з шухлядами,
 *           ніша з LED; голо-ноутбук, планшет на стійці, горнятко з парою;
 *           дрібниці (ITEMS, objects/wing_trinkets.js): склянка з ручками,
 *           роздруківка-звіт звисає з краю плити, папери, телефон на зарядці, мишка
 * Коли Nexi працює тут (obj 'analytics'), екрани прискорюються й показують
 * приріст; зроблене (NX.ui.zones.done.analytics) видно на лівому екрані.
 * Крісло — objects/office.js (NX.chairA). Рослина на даху будки — wing_plants.js.
 * ========================================================================== */
(() => {
  const P = NX.px, F = NX.furn, K = NX.kit, { NAVY, PINK, CYAN, HOLO, CHROME, OUT } = F.PAL, ramp = F.ramp, rgba = K.rgba, lit = K.lit, noise = K.noise;
  const ACC = ['#0a2a4a', '#17709a', '#2aa6c8', '#3be8ff'];
  const BOOTH = { x0: 322, y0: 128, x1: 478, y1: 278, acc: ACC, sign: [336, 138, 464, 166], icon: [350, 152], screens: [[336, 178, 398, 264], [406, 178, 466, 264]] };
  // №3: ширший верх (передній край 280 -> 283), віддзеркалення будки, кабелі за столом (лоток, пучки, роутер у ніші)
  const DESK = { l: 326, r: 486, top: 283, slab: 291, bot: 346, back: 275, sec: [{ a: 334, b: 372, kind: 'drawers', rows: 3 }, { a: 372, b: 440, kind: 'niche' }, { a: 440, b: 480, kind: 'drawers', rows: 3 }],
    refl: [[322, 478, '#2a9ad0', .3]], under: [{ tray: [375, 437], drops: [382, 424], router: [378, 394] }] };
  const LAPQ = [[336, 263], [358, 264], [358, 277], [336, 278]], LAPB = [333, 361], TAB = [368, 258, 384, 271], MUG = [452, 268, 460, 278];
  // дрібниці (objects/wing_trinkets.js): склянка з олівцями, роздруківка-звіт звисає з краю, стос паперів, телефон на зарядці, мишка
  const ITEMS = [
    { kind: 'pens', x: 386, y: 279.6 }, { kind: 'printout', x: 393.4, w: 9.2, hl: 5.6, seed: 2 }, { kind: 'papers', x: 404.2, y: 279.4, w: 10, n: 4, seed: 5 },
    { kind: 'phone', x: 416.4, y: 280, icon: 'chart' }, { kind: 'mouse', x: 468, y: 280, w: 14.6 },
  ];
  const NOTES = [{ x: 465.4, y: 179.6, s: 4.8, col: 'p', rot: .22, seed: 2 }];             // стікер на рамці правого екрана будки

  NX.wing.shades.push({ box: [BOOTH.x0, BOOTH.y0, BOOTH.x1 + 9, BOOTH.y1], dx: -3, dy: 2.5, r: 16, k: .5 });   // м'яка тінь будки на цеглі (№1; разом з бічною гранню до вікна)
  function buildBooth() { const S = F.Sheet(316, 122, 490, 284); K.booth(S, BOOTH); return S; }
  function buildDesk() {
    const S = F.Sheet(322, 248, 490, 348); K.desk(S, DESK);
    K.trinkets(S, DESK, ITEMS, 'shadow');
    K.contacts(S, DESK, [[BOOTH.x0, BOOTH.x1, DESK.back + 1.4, .55], [LAPB[0], LAPB[1], 280, .6], [TAB[0] + 2, TAB[2] - 2, 277, .7], [436, 444, 278], [MUG[0], MUG[2] + 2, 278]]);   // тіні контакту (№1): будка, ноутбук, планшет, кубик, горнятко
    const base = K.snap(S);                                                                       // верх з тінями (для глянцю)
    S.rect(LAPB[0], 275, LAPB[1], 280, (u, v, i, j) => u > .985 || u < .015 || v > .96 ? OUT : v < .14 ? ACC[3] : (v < .5 && u > .1 && u < .9 && ((u * 14) % 1 < .18 || (v * 6) % 1 < .3)) ? ACC[1] : ramp(CHROME, .55 + u * .2 - v * .3, i, j));   // база голо-ноутбука
    S.rr(TAB[0] - 1.4, TAB[1] - 1.4, TAB[2] + 1.4, TAB[3] + 1.4, 1.4, (d) => d < .6 ? NAVY[0] : NAVY[4]);                                          // планшет на стійці
    S.rect(TAB[0] + 6.6, TAB[3] + 1.4, TAB[0] + 9.4, 276, CHROME[3]); S.rect(TAB[0] + 2, 275.5, TAB[2] - 2, 277, CHROME[4]);
    S.rr(MUG[0], MUG[1], MUG[2], MUG[3], [1, 1, 1.6, 1.6], (d, u, v) => d < .5 ? PINK[1] : v > .4 && v < .58 ? CYAN[4] : (u > .7 ? PINK[3] : PINK[5]));      // горнятко
    S.rect(MUG[2] - .4, MUG[1] + 2.2, MUG[2] + 2.2, MUG[1] + 6.4, (u, v) => (u > .4 && v > .25 && v < .75) ? null : PINK[3]);
    S.rr(436, 270, 444, 278, 1, (d, u, v, i, j) => d < .5 ? OUT : (u > .25 && u < .75 && v > .3 && v < .7) ? CYAN[4] : ramp(NAVY, .45 - v * .25, i, j));   // світний кубик
    [[361, 278.6, 370, 275.8], [386, 278.4, 394, 275.8]].forEach(([a, b, c2, d]) => { S.line(a, b, c2, d, OUT, 1); S.line(a, b - .3, c2, d - .3, '#2a2454', .5); });   // кабелі
    K.trinkets(S, DESK, ITEMS, 'items');                                                          // дрібниці
    K.gloss(S, DESK, base, .4);                                                                   // віддзеркалення речей у глянці (№3)
    K.wire(S, [[444.2, 277.2], [447, 276.4], [447.6, 275.6]]);                                    // №3: кабель кубика за край
    return S;
  }
  // ---------- живі екрани ----------
  const [LCV, lx] = F.canvas(248, 344), [RCV, rx] = F.canvas(240, 344), [ACV, ax] = F.canvas(104, 80), [TCV, tx] = F.canvas(72, 64);
  function drawLeft(c, t, act, prog) {
    const W = 248, H = 344; K.screenBg(c, W, H, t);
    P.text(c, 'USERS', 10, 24, '#bfe9ff', 14); lit(c, W - 26, 11, 12, 12, Math.sin(t * 4) > 0 ? '#3bff8a' : '#1f6a45');
    for (let k = 0; k < 3; k++) { const x = 20 + k * 74, y = 42, on = Math.floor(t * (1 + act * 2)) % 3 === k;                                   // аватари
      c.fillStyle = on ? '#ffffff' : '#9fdcff'; c.beginPath(); c.arc(x + 22, y + 16, 12, 0, 7); c.fill(); c.beginPath(); c.ellipse(x + 22, y + 50, 20, 14, 0, Math.PI, 0); c.fill(); lit(c, x, y + 60, 44, 4, on ? '#3bff8a' : '#2a6ab0'); }
    const done = (NX.ui.zones.done.analytics || []).slice(-2);                                                                                  // що вже зроблено (по черзі)
    done.forEach((d, k) => { lit(c, 12, 122 + k * 16, 8, 8, '#3bff8a'); P.text(c, NX.t(`zones.analytics.${d.task}.t`).toUpperCase().slice(0, 24), 26, 131 + k * 16, '#bfe9ff', 8); });
    const base = H - 22, top = 170;
    for (let i = 0; i < 8; i++) { const v = P.clamp(noise(t * (1 + act * 1.8), i) + act * prog * .3, .12, 1), hh = v * (base - top), x = 14 + i * 29;   // стовпчики
      c.fillStyle = 'rgba(122,240,255,.28)'; c.fillRect(x, base - hh, 20, hh); lit(c, x, base - hh, 20, 4, '#e8fdff'); lit(c, x + 3, base - hh + 7, 4, Math.max(0, hh - 10), 'rgba(255,255,255,.25)'); }
    lit(c, 10, base + 3, W - 20, 3, '#9fdcff'); if (act) P.text(c, '+' + (12 + Math.floor(prog * 30)) + '%', W - 12, 160, '#ffe27a', 16, 'right');
  }
  function drawRight(c, t, act, prog) {
    const W = 240, H = 344; K.screenBg(c, W, H, t);
    P.text(c, 'TREND', 10, 24, '#bfe9ff', 14);
    const b = 170, h = 120; c.strokeStyle = 'rgba(160,220,255,.35)'; c.lineWidth = 1; for (let y = 0; y < 5; y++) { c.beginPath(); c.moveTo(10, b - y * 30); c.lineTo(W - 10, b - y * 30); c.stroke(); }
    c.lineWidth = 4; c.strokeStyle = '#ff9ae6'; c.beginPath();
    for (let x = 0; x <= W - 20; x += 4) { const v = .45 + .25 * Math.sin((x + t * (26 + act * 50)) * .045) + .12 * Math.sin((x + t * 40) * .13) + (act ? prog * .2 * x / W : 0), y = b - v * h; x ? c.lineTo(10 + x, y) : c.moveTo(10 + x, y); }
    c.stroke(); c.strokeStyle = '#e8fdff'; c.lineWidth = 2; c.beginPath();
    for (let x = 0; x <= W - 20; x += 4) { const v = .3 + .2 * Math.sin((x + t * 18) * .03 + 1.5), y = b - v * h; x ? c.lineTo(10 + x, y) : c.moveTo(10 + x, y); }
    c.stroke();
    const cx = 66, cy = 262, R = 44, share = .62 + .1 * Math.sin(t * .7) + act * prog * .2;                                                       // "пончик"
    c.lineWidth = 18; c.strokeStyle = 'rgba(122,240,255,.35)'; c.beginPath(); c.arc(cx, cy, R, 0, 7); c.stroke(); c.strokeStyle = '#7af0ff'; c.beginPath(); c.arc(cx, cy, R, -Math.PI / 2, -Math.PI / 2 + share * Math.PI * 2); c.stroke();
    P.text(c, Math.round(share * 100) + '%', cx, cy + 7, '#ffffff', 15, 'center');
    for (let k = 0; k < 4; k++) { lit(c, 130, 228 + k * 22, 12, 12, ['#7af0ff', '#ff9ae6', '#ffe27a', '#3bff8a'][k]); lit(c, 150, 232 + k * 22, 40 + 40 * noise(t * .5, k + 3), 5, '#bfe9ff'); }
  }
  function drawLaptop(c, t, act) { c.clearRect(0, 0, 104, 80); c.fillStyle = 'rgba(22,80,210,.5)'; c.fillRect(0, 0, 104, 80); c.fillStyle = '#5ae8ff'; c.fillRect(0, 0, 104, 3); c.fillRect(0, 77, 104, 3); for (let i = 0; i < 9; i++) { const v = noise(t * (1.5 + act * 3), i + 9), h = 10 + v * 50; lit(c, 8 + i * 10, 72 - h, 7, h, i % 3 ? '#7af0ff' : '#ff9ae6'); } lit(c, 6, 8, 24, 4, '#bfe9ff'); }
  function drawTablet(c, t) { c.clearRect(0, 0, 72, 64); c.fillStyle = '#0b2a8a'; c.fillRect(0, 0, 72, 64); const a = t * .8; c.lineWidth = 9; for (const [col, s, e] of [['#ff9ae6', 0, 2.4], ['#7af0ff', 2.4, 4.6], ['#ffe27a', 4.6, 6.28]]) { c.strokeStyle = col; c.beginPath(); c.arc(36, 32, 18, a + s, a + e); c.stroke(); } }

  let BS = null, DS = null;
  const an = NX.addObject({
    id: 'analytics', name: 'obj.analytics', act: 'analytics', active: false, prog: 0, fr: 0, BOOTH, DESK,
    hit: { x: 322, y: 128, w: 164, h: 218 },
    drawDesk(c, t) {
      if (!DS) { DS = buildDesk(); DS.cv = DS.canvas(); }
      const act = this.active ? 1 : 0, R = F.res();
      c.save(); K.draw(c, DS, R); c.imageSmoothingEnabled = true;
      c.globalAlpha = .9; F.warp(c, ACV, LAPQ, Math.max(.5, 1.5 / R)); c.globalAlpha = 1; c.drawImage(TCV, TAB[0], TAB[1], TAB[2] - TAB[0], TAB[3] - TAB[1]);
      c.globalCompositeOperation = 'lighter';
      c.fillStyle = rgba('59,232,255', .14 + .05 * Math.sin(t * 3)); c.beginPath(); c.moveTo(LAPB[0] + 2, 276); c.lineTo(LAPB[1] - 2, 276); c.lineTo(LAPQ[2][0], LAPQ[2][1]); c.lineTo(LAPQ[3][0], LAPQ[3][1]); c.fill();   // промінь проектора
      c.fillStyle = rgba('255,79,216', .3 + .2 * Math.sin(t * 2.2) + act * .2); c.fillRect(DESK.l + 1, DESK.top + .5, DESK.r - DESK.l - 2, 1.4);                 // неон плити
      const sp = DESK.l + ((t * .22 + .3) % 1) * (DESK.r - DESK.l); lit(c, sp - 5, DESK.top + .4, 10, 1, 'rgba(255,255,255,.8)');
      for (let x = 374; x < 438; x += 2) lit(c, x, DESK.bot - 9.8, 1.4, 1, act ? `hsla(${(t * 120 + x * 4) % 360},95%,62%,.8)` : rgba('59,232,255', .3 + .3 * Math.sin(t * 2 + x * .1)));   // LED ніші
      for (const s of DESK.sec) for (let x = s.a + 1.5; x < s.b - 1.5; x += 2) lit(c, x, DESK.bot - 2.2, 1.3, 1.2, rgba('59,232,255', .3 + .25 * Math.sin(t * 2 + x * .12)));
      P.glow(c, 347, 268, 18, 'rgba(59,160,255,.6)', .2 + act * .2);
      c.globalCompositeOperation = 'source-over';
      K.trinketsLive(c, DESK, ITEMS, t, act);                                                     // роздруківка, екран телефона, RGB мишки, стилус
      K.underLive(c, DESK, t, act);                                                               // вогники роутера під столом
      K.deskShine(c, DESK, t, [[347, 10, '90,200,255'], [400, 30, '90,200,255'], [440, 10, '90,232,255'], [376, 8, '255,200,120']], [[334, 360, '90,200,255', .1 + act * .06, 280.2], [366, 386, '120,180,255', .08, 277.2]]);   // глянець верху
      for (let i = 0; i < 3; i++) { const q = (t * .5 + i / 3) % 1; c.fillStyle = `rgba(220,230,255,${.35 * (1 - q)})`; c.fillRect(MUG[0] + 3.5 + Math.sin(q * 6 + i) * 1.2, MUG[1] - 1 - q * 10, 1, 1); }   // пара
      c.restore();
    },
    drawBack(c, t) {
      if (!BS) { BS = buildBooth(); BS.cv = BS.canvas(); }
      const act = this.active ? 1 : 0, R = F.res();
      c.save(); K.draw(c, BS, R);
      if ((this.fr++ % 3) === 0) { drawLeft(lx, t, act, this.prog); drawRight(rx, t, act, this.prog); drawLaptop(ax, t, act); drawTablet(tx, t); }
      c.imageSmoothingEnabled = true;
      const [L, Rr] = BOOTH.screens; c.drawImage(LCV, L[0], L[1], L[2] - L[0], L[3] - L[1]); c.drawImage(RCV, Rr[0], Rr[1], Rr[2] - Rr[0], Rr[3] - Rr[1]);
      const [sx0, sy0, sx1, sy1] = BOOTH.sign; c.globalCompositeOperation = 'lighter';
      c.strokeStyle = rgba('59,232,255', .14 + .08 * Math.sin(t * 1.8) + act * .12); c.lineWidth = 3; c.beginPath(); c.roundRect ? c.roundRect(BOOTH.x0 - 1, BOOTH.y0 - 1, BOOTH.x1 - BOOTH.x0 + 2, BOOTH.y1 - BOOTH.y0 + 2, 7) : c.rect(BOOTH.x0, BOOTH.y0, BOOTH.x1 - BOOTH.x0, BOOTH.y1 - BOOTH.y0); c.stroke();   // ореол канта
      BOOTH.screens.forEach(([a, b, c2, d]) => P.glow(c, (a + c2) / 2, (b + d) / 2, (c2 - a) * .7, 'rgba(70,140,255,.6)', .14 + act * .1));
      for (let k = 0; k < 6; k++) lit(c, BOOTH.x0 + 5.2, BOOTH.y0 + 20 + k * 18 + 3, 1.6, 1.6, rgba('59,232,255', .3 + .6 * (Math.floor(t * 4 + k) % 4 === 0)));   // вогники планки
      c.globalCompositeOperation = 'source-over';
      K.stuck(c, NOTES);                                                                          // стікер на рамці екрана
      K.sign(c, sx0, sy0, sx1 - sx0, sy1 - sy0, { acc: ACC, icon: 'chart', key: 'nav.analytics', t, glow: '59,232,255' });   // вивіска в єдиному стилі трьох зон
      c.restore();
      this.drawDesk(c, t);
    },
  });
  K.reflectors.push((c, t) => an.drawDesk(c, t));
  NX.analyticsZone = an;
})();

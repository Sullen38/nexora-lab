/* ============================================================================
 * objects/marketing.js — ЗОНА МАРКЕТИНГУ: будка перед вікном + стіл (конструктор NX.kit)
 * ----------------------------------------------------------------------------
 * Третя зона лівого крила (x 485..662), найдалі — перед вікном, між ліхтарем
 * і диваном.
 *   БУДКА — панель з рожевим неоновим кантом, вивіска-мішень і напис (мовою
 *           глядача), два голо-екрани: стрічка постів із лайками і воронка ADS
 *   СТІЛ  — продовжує стіл аналітики (та сама висота), ніша з рожевим LED,
 *           тумба справа (частково за диваном), два рожеві горнятка з парою;
 *           дрібниці (ITEMS, objects/wing_trinkets.js): телефон зі сповіщеннями-
 *           сердечками, блок стікерів, ескізи з ручкою, склянка з ручками;
 *           стікери-ідеї на рамках екранів будки (NOTES)
 * Коли Nexi працює тут (obj 'marketing'), пости летять швидше, спливають
 * сердечка, росте лічильник; зроблене — NX.ui.zones.done.marketing на правому екрані.
 * Крісло — objects/office.js (NX.chairM); кавомашина перед столом — coffee.js;
 * рослина на столі зліва — wing_plants.js.
 * ========================================================================== */
(() => {
  const P = NX.px, F = NX.furn, K = NX.kit, { NAVY, PINK, CYAN, CHROME, OUT } = F.PAL, ramp = F.ramp, rgba = K.rgba, lit = K.lit, noise = K.noise;
  const ACC = ['#58134f', '#a0288d', '#e656c0', '#ff84d4'];
  const BOOTH = { x0: 536, y0: 166, x1: 652, y1: 266, acc: ACC, sign: [546, 176, 642, 200], icon: [558, 188], iconKind: 'target', screens: [[548, 210, 600, 256], [608, 210, 644, 256]] };
  const DESK = { l: 485, r: 662, top: 278, slab: 288, bot: 338, back: 273, sec: [{ a: 488, b: 600, kind: 'niche' }, { a: 604, b: 650, kind: 'drawers', rows: 3 }] };
  const MUGS = [[548, 268], [566, 269]];
  // дрібниці (objects/wing_trinkets.js): телефон зі сповіщеннями-сердечками, блок стікерів, ескізи з ручкою, склянка з ручками
  const ITEMS = [
    { kind: 'phone', x: 576.2, y: 278, icon: 'heart' }, { kind: 'notes', x: 588.2, y: 277.8, w: 5.8, col: 'p' },
    { kind: 'papers', x: 597, y: 278, w: 10, n: 3, seed: 8, pen: 1 }, { kind: 'pens', x: 610, y: 277.6 },
  ];
  // стікери-ідеї на рамках екранів будки
  const NOTES = [{ x: 550.6, y: 212.4, s: 4.4, col: 'c', rot: .2, seed: 3 }, { x: 642.6, y: 254.2, s: 4.4, col: 'y', rot: -.18, seed: 6 }, { x: 638.8, y: 256.2, s: 4, col: 'g', rot: .12, seed: 9 }];

  function buildBooth() { const S = F.Sheet(530, 160, 664, 272); K.booth(S, BOOTH); return S; }
  function buildDesk() {
    const S = F.Sheet(481, 262, 664, 340); K.desk(S, DESK);
    MUGS.forEach(([x, y]) => { S.rr(x, y, x + 7, DESK.top, [1, 1, 1.6, 1.6], (d, u, v) => d < .5 ? PINK[1] : v > .38 && v < .56 ? '#ffffff' : (u > .7 ? PINK[3] : PINK[5])); S.rect(x + 6.6, y + 2, x + 8.8, y + 6.2, (u, v) => (u > .4 && v > .25 && v < .75) ? null : PINK[3]); });
    K.trinkets(S, DESK, ITEMS);                                                                   // дрібниці з тінями контакту
    return S;
  }
  // ---------- живі екрани ----------
  const [LCV, lx] = F.canvas(208, 184), [RCV, rx] = F.canvas(144, 184), POSTS = ['#ff9ae6', '#7af0ff', '#ffe27a', '#9a8cff'];
  function drawLeft(c, t, act, prog) {
    const W = 208, H = 184; K.screenBg(c, W, H, t); const sp = 14 + act * 26, off = (t * sp) % 62;
    c.save(); c.beginPath(); c.rect(0, 0, W, H); c.clip();
    for (let k = -1; k < 4; k++) { const id = k + Math.floor(t * sp / 62), y = 8 + k * 62 - off, col = POSTS[((id % 4) + 4) % 4];
      c.fillStyle = 'rgba(10,30,110,.55)'; c.fillRect(8, y, W - 16, 54); c.strokeStyle = 'rgba(160,220,255,.6)'; c.lineWidth = 2; c.strokeRect(9, y + 1, W - 18, 52);
      lit(c, 14, y + 7, 40, 40, col); lit(c, 20, y + 13, 28, 28, 'rgba(255,255,255,.35)'); lit(c, 62, y + 10, 80 + 30 * P.hash(id, 2), 5, '#e8fdff'); lit(c, 62, y + 21, 60 + 40 * P.hash(id, 3), 4, '#9fdcff');
      P.text(c, '♥' + (100 + Math.floor(P.hash(id, 4) * 900) + (act ? Math.floor(prog * 3400) : 0)), 62, y + 44, '#ff9ae6', 10); }
    c.restore();
    if (act) for (let i = 0; i < 4; i++) { const ph = (t * .7 + i / 4) % 1; c.globalAlpha = 1 - ph; P.text(c, '♥', 30 + i * 46, H - 10 - ph * 120, '#ff7ad8', 16); c.globalAlpha = 1; }
  }
  function drawRight(c, t, act, prog) {
    const W = 144, H = 184; K.screenBg(c, W, H, t); P.text(c, 'ADS', 8, 18, '#bfe9ff', 11);
    for (let k = 0; k < 4; k++) { const w = (W - 20) * (1 - k * .2) * (.9 + .1 * Math.sin(t * (1 + act * 2) + k)), y = 28 + k * 20; lit(c, (W - w) / 2, y, w, 14, ['rgba(255,154,230,.75)', 'rgba(122,240,255,.75)', 'rgba(255,226,122,.75)', 'rgba(59,255,138,.75)'][k]); }
    const cx = W / 2, cy = 138, pul = 1 + .08 * Math.sin(t * 4 + act * t * 4); for (const [r, col] of [[24, '#ff9ae6'], [16, '#ffffff'], [8, '#ff4fd8']]) { c.strokeStyle = col; c.lineWidth = 4; c.beginPath(); c.arc(cx, cy, r * pul, 0, 7); c.stroke(); }
    if (act) P.text(c, Math.round(40 + prog * 340) + ' →', cx, 178, '#ffe27a', 10, 'center');
    (NX.ui.zones.done.marketing || []).slice(-2).forEach((d, k) => { lit(c, 8, 108 + k * 11, 5, 5, '#3bff8a'); P.text(c, NX.t(`zones.marketing.${d.task}.t`).toUpperCase().slice(0, 16), 16, 114 + k * 11, '#bfe9ff', 6); });
  }

  let BS = null, DS = null;
  const mk = NX.addObject({
    id: 'marketing', name: 'obj.marketing', act: 'marketing', active: false, prog: 0, fr: 0, BOOTH, DESK,
    hit: { x: 536, y: 166, w: 116, h: 172 },
    drawDesk(c, t) {
      if (!DS) { DS = buildDesk(); DS.cv = DS.canvas(); }
      const act = this.active ? 1 : 0, R = F.res();
      c.save(); K.draw(c, DS, R); c.globalCompositeOperation = 'lighter';
      c.fillStyle = rgba('255,79,216', .3 + .2 * Math.sin(t * 2.2 + 1) + act * .2); c.fillRect(DESK.l + 1, DESK.top + .5, DESK.r - DESK.l - 2, 1.4);
      const sp = DESK.l + ((t * .2 + .5) % 1) * (DESK.r - DESK.l); lit(c, sp - 5, DESK.top + .4, 10, 1, 'rgba(255,255,255,.8)');
      for (let x = 490; x < 598; x += 2) lit(c, x, DESK.bot - 9.8, 1.4, 1, act ? `hsla(${(t * 120 + x * 4) % 360},95%,62%,.8)` : rgba('255,79,216', .3 + .3 * Math.sin(t * 2 + x * .1)));
      for (let x = 605.5; x < 648.5; x += 2) lit(c, x, DESK.bot - 2.2, 1.3, 1.2, rgba('59,232,255', .3 + .25 * Math.sin(t * 2 + x * .12)));
      c.globalCompositeOperation = 'source-over';
      K.trinketsLive(c, DESK, ITEMS, t, act);                                                     // екран телефона (сердечка), стилус
      MUGS.forEach(([x, y], k) => { for (let i = 0; i < 3; i++) { const q = (t * .5 + i / 3 + k * .4) % 1; c.fillStyle = `rgba(220,230,255,${.35 * (1 - q)})`; c.fillRect(x + 3 + Math.sin(q * 6 + i) * 1.2, y - 1 - q * 10, 1, 1); } });
      c.restore();
    },
    drawBack(c, t) {
      if (!BS) { BS = buildBooth(); BS.cv = BS.canvas(); }
      const act = this.active ? 1 : 0, R = F.res();
      c.save(); K.draw(c, BS, R);
      if ((this.fr++ % 3) === 1) { drawLeft(lx, t, act, this.prog); drawRight(rx, t, act, this.prog); }
      c.imageSmoothingEnabled = true; const [L, Rr] = BOOTH.screens; c.drawImage(LCV, L[0], L[1], L[2] - L[0], L[3] - L[1]); c.drawImage(RCV, Rr[0], Rr[1], Rr[2] - Rr[0], Rr[3] - Rr[1]);
      const [sx0, sy0, sx1, sy1] = BOOTH.sign; c.globalCompositeOperation = 'lighter';
      c.strokeStyle = rgba('255,79,216', .16 + .1 * Math.sin(t * 1.8) + act * .12); c.lineWidth = 3; c.beginPath(); c.roundRect ? c.roundRect(BOOTH.x0 - 1, BOOTH.y0 - 1, BOOTH.x1 - BOOTH.x0 + 2, BOOTH.y1 - BOOTH.y0 + 2, 7) : c.rect(BOOTH.x0, BOOTH.y0, BOOTH.x1 - BOOTH.x0, BOOTH.y1 - BOOTH.y0); c.stroke();
      BOOTH.screens.forEach(([a, b, c2, d]) => P.glow(c, (a + c2) / 2, (b + d) / 2, (c2 - a) * .7, 'rgba(70,140,255,.6)', .14 + act * .1));
      for (let k = 0; k < 4; k++) lit(c, BOOTH.x0 + 5.2, BOOTH.y0 + 20 + k * 18 + 3, 1.6, 1.6, rgba('255,120,230', .3 + .6 * (Math.floor(t * 4 + k) % 4 === 0)));
      c.globalCompositeOperation = 'source-over';
      K.stuck(c, NOTES);                                                                          // стікери на рамках екранів
      K.sign(c, sx0, sy0, sx1 - sx0, sy1 - sy0, { acc: ACC, icon: 'target', key: 'nav.marketing', t, glow: '255,79,216', text: '255,200,240' });   // вивіска в єдиному стилі
      c.restore();
      this.drawDesk(c, t);
    },
  });
  K.reflectors.push((c, t) => mk.drawDesk(c, t));
  NX.marketingZone = mk;
})();

/* ============================================================================
 * objects/workshop.js — МАЙСТЕРНЯ: капсула-сканер, екран NEXORA AI, машинерія, термінал, робот-маніпулятор
 * ----------------------------------------------------------------------------
 * Перша зона правого крила (найближча до вікна), уся кодом у стилі кімнати (NX.kit, 4 px/од.):
 *   КАПСУЛА (x 938..1072) — козирок з рожевим неоновим кантом і вивіскою зони (K.sign «МАЙСТЕРНЯ» мовою
 *     глядача, іконка — голова робота), док-купол зверху (туди «пристиковується» маніпулятор), стійки з
 *     неоновими смугами, СКЛО СКАНЕРА (живе: рожева голограма, емблема Nexi з кільцями, іконки скінів
 *     спливають, скан-лінії), платформа з кільцем-подушкою (тут стоїть Nexi — POI.workshop.pad),
 *     помаранчевою щілиною й LED, два випромінювачі на задніх кутах платформи (сканують Nexi променями).
 *   МАШИНЕРІЯ ПЕРЕД СКЛОМ (x 892..946) — блок живлення сканера: бак з рожевими котушками, 2 манометри,
 *     голо-екран «каталог скінів», кабелі до капсули, вентиляція; м'яка тінь рослини біля дивану.
 *   ГОЛО-СТІЙКА праворуч (x 1068..1094) — «примірка»: деталі скіна, а під час сканування — СКАН xx %.
 *   ТЕРМІНАЛ (x 1098..1130) — 3 екрани (код скіна, стовпчики, прогрес), консоль з шестернею, LED.
 *   ЕКРАН NEXORA AI на стіні (x 974..1088, рамка — rwing_wall.js): мапа світу з пінгами, 3 плитки-іконки,
 *     статус (онлайн, скільки задач зроблено — NX.ui.zones.done).
 *   РОБОТ-МАНІПУЛЯТОР — база на колоні (x 1146), плече, лікоть, зап'ястя з інструментом над док-куполом;
 *     суглоби рахуються зворотною кінематикою: без Nexi ледь «дихає», з Nexi на платформі працює,
 *     під час встановлення скіна смикається й іскрить.
 * ВЗАЄМОДІЯ (як і була): тап — Nexi стає на платформу (сценарій workshop), відкривається Лабораторія
 *   скінів; без Nexi над платформою крутиться голограма Nexi в поточному скіні; з Nexi — кільце сканера
 *   їздить уздовж корпусу, навколо літають 3 голограми скінів-пропозицій; install() — внутрішній
 *   маніпулятор капсули опускається до голови Nexi, іскри, спалах — скін встановлено.
 * ========================================================================== */
(() => {
  const P = NX.px, F = NX.furn, K = NX.kit, RW = NX.rwing, { NAVY, PINK, CYAN, CHROME, OUT } = F.PAL, ramp = F.ramp, hash = NX.art.hash, rgba = K.rgba, lit = K.lit, noise = K.noise;
  const ACC = ['#58134f', '#a0288d', '#e656c0', '#ff84d4'];                         // акцент зони — рожевий
  const VIO = ['#07041a', '#0e0a2a', '#17103c', '#211650', '#2c1d66', '#39257e', '#483096', '#5b3eb0'];   // фіолетова сталь капсули
  const STEEL = ['#06051a', '#0c0a28', '#141038', '#1c164a', '#261e5e', '#322874', '#40348c', '#5244a6'];
  const CAP = { x0: 946, x1: 1064, top: 158, hood: 206, bot: 318, pil: 16, sign: [954, 165, 1056, 196] };
  const GLASS = [962, 206, 1048, 318], PLAT = { x0: 938, x1: 1072, back: 316, top: 328, bot: 342 };
  const MACH = { x0: 892, x1: 946, top: 174 }, HOLL = [902, 232, 936, 292], HOLR = [1068, 238, 1094, 296];
  const TERM = { x0: 1098, x1: 1130, y0: 194, scr: [[1102, 200, 1126, 220], [1102, 224, 1126, 244], [1102, 248, 1126, 268]], gear: [1114, 289, 8.5] };
  const EMIT = [[955, 301], [1055, 301]];                                           // випромінювачі сканера (задні кути платформи)
  const ARM = { base: [1146, 160], L1: 92, L2: 80, rest: [1005, 129], dock: [1005, 150] };
  const HUB = RW.HUB, HUBIN = [HUB.x0 + 5, HUB.y0 + 5, HUB.x1 - 5, HUB.y1 - 5];
  const toL = (x, y, f = .035) => F.toVP(x, y, f);                                  // бічна грань ліворуч (до вікна)

  // м'які тіні на стіні від капсули, машинерії, термінала, маніпулятора (запікаються в стіну — rwing_wall.js)
  RW.shades.push({ box: [CAP.x0, CAP.top, CAP.x1, PLAT.bot], dx: 3, dy: 2.5, r: 16, k: .5 }, { box: [TERM.x0, TERM.y0, TERM.x1, 344], dx: 2.5, dy: 2, r: 9, k: .48 },
    { box: [HOLR[0], HOLR[1], HOLR[2], 340], dx: 2, dy: 2, r: 7, k: .4 }, { ell: [1112, 132, 40, 16], k: .3 });
  RW.drips.push({ x: 1003, y: 206, len: 10, w: .9, k: .4 }, { x: 1128, y: 344 - 150, len: 20, w: .9, k: .4, rust: 1 });

  // ---------- КАПСУЛА (растр 4 px/од.) ----------
  function buildCapsule() {
    const S = F.Sheet(928, 144, 1076, 344), { x0, x1, top, hood, bot } = CAP;
    // бічна грань ліворуч (до вікна): козирок, стійка, платформа
    S.poly([[x0 + .4, top + 6], toL(x0, top + 6), toL(x0, bot), [x0 + .4, bot]], (u, v, i, j) => u > .78 ? ACC[1] : ramp(VIO, .3 - v * .16, i, j));
    S.poly([[PLAT.x0 + .4, PLAT.back], toL(PLAT.x0, PLAT.back, .04), toL(PLAT.x0, PLAT.bot, .04), [PLAT.x0 + .4, PLAT.bot]], (u, v, i, j) => u > .8 ? '#ff4fd8' : ramp(STEEL, .3 - v * .2, i, j));
    // стійки капсули: сталь зі швами, неонова смуга з боку скла, віконця LED (світять живим)
    [[x0, x0 + CAP.pil, 1], [x1 - CAP.pil, x1, -1]].forEach(([a, b, side]) => S.rect(a, hood - 2, b, bot, (u, v, i, j, X, Y) => {
      const e = side > 0 ? b - X : X - a, o = side > 0 ? X - a : b - X;               // e — до скла, o — до зовнішнього краю
      if (o < .6 || e < .5) return OUT;
      if (e < 1.6) return e < 1.05 ? '#ffc2ec' : '#ff4fd8';                          // неонова смуга біля скла
      if (e < 2.4) return '#2a0a2e';
      if (o < 1.6) return ramp(VIO, .74 - v * .3, i, j);                             // світла кромка ззовні
      const sy = ((Y - hood) % 24 + 24) % 24; if (sy < .6) return '#05031a'; if (sy < 1.2) return VIO[6];
      if (Math.abs(X - (a + b) / 2 - side * .8) < 1.6 && sy > 6 && sy < 16) return ((Y * 1.5) | 0) % 2 ? '#0a0418' : VIO[2];   // віконце LED
      return ramp(VIO, .46 - v * .2 + (o < 4 ? .06 : 0), i, j, .1);
    }));
    // рамка скла (хром), саме скло — живе
    S.rr(GLASS[0], GLASS[1] - 1, GLASS[2], GLASS[3] + 1, 1.2, (d) => d < .5 ? OUT : d < 1.4 ? CHROME[3] : null);
    // козирок: заокруглений верх, рожевий неоновий кант, фаска, нижня губа з LED-цятками; вивіска — живою (K.sign)
    S.rr(x0, top, x1, hood, [13, 13, 2, 2], (d, u, v, i, j, X, Y) => {
      if (d < .6) return OUT; if (d < 1.7) return ACC[3]; if (d < 2.4) return ACC[1];
      if (Y > hood - 4.5) return Y > hood - 1 ? OUT : (Y > hood - 3.2 && ((X - x0) % 6) < 1.4 ? '#3a0a3a' : ramp(VIO, .62 - (Y - hood + 4.5) * .1, i, j));
      if (d < 3.6) return v < .45 ? VIO[7] : VIO[5];
      return ramp(VIO, .42 - v * .2, i, j, .1);
    });
    S.rr(CAP.sign[0] - 2, CAP.sign[1] - 2, CAP.sign[2] + 2, CAP.sign[3] + 2, 4, (d) => d < .6 ? '#05031a' : '#0d0828');   // ніша під вивіску
    // док-купол зверху: хром, блакитне кільце (сюди стикується маніпулятор)
    S.rr(990, 151, 1020, top + 2, [6, 6, 0, 0], (d, u, v, i, j) => d < .5 ? OUT : v > .62 && v < .8 ? '#3be8ff' : ramp(CHROME, .78 - v * .5 - Math.abs(u - .4) * .4, i, j));
    S.rr(999, 146.5, 1011, 152, 1.5, (d, u, v, i, j) => d < .4 ? OUT : ramp(CHROME, .6 - v * .3, i, j));
    // платформа: видимий верх (глянцева сталь, кільце-подушка), передня грань (щілина, вентиляція, LED)
    const [px, py] = NX.cfg.POI.workshop.pad;
    S.rect(PLAT.x0, PLAT.back, PLAT.x1, PLAT.top, (u, v, i, j, X, Y) => {
      const dy = PLAT.top - Y; if (dy < .5) return '#ffc2ec'; if (dy < 1.1) return '#ff4fd8'; if (dy < 1.5) return '#2a0a2e';
      const e = ((X - px) / 27) ** 2 + ((Y - py + .3) / 4.9) ** 2;
      if (e < 1 && e > .82) return e > .93 ? CHROME[4] : CHROME[2];                       // хромоване кільце-подушка
      if (e <= .82) return ramp(['#0a1636', '#0e2048', '#142a5a', '#1c386e'], .2 + (1 - e) * .5, i, j, .08);   // подушка (світиться живим)
      return ramp(STEEL, .16 + (Y - PLAT.back) / 12 * .36 + (((X * .6 + Y) | 0) % 19 === 0 ? .12 : 0), i, j, .08);
    });
    S.rect(PLAT.x0, PLAT.top, PLAT.x1, PLAT.bot, (u, v, i, j, X, Y) => {
      const dy = Y - PLAT.top; if (dy > 13.4 || X - PLAT.x0 < .5 || PLAT.x1 - X < .5) return OUT;
      if (dy > 11.6) return '#0a2a4a'; if (dy > 10.6) return '#3be8ff';                     // LED-смужка внизу
      if (Math.abs(X - 1005) < 17 && dy > 4.6 && dy < 8.4) return dy < 5.2 || dy > 7.8 ? '#3a1408' : '#ff9a3a';   // помаранчева щілина
      if ((Math.abs(X - 960) < 12 || Math.abs(X - 1050) < 12) && dy > 3.5 && dy < 9) return ((Y * 1.6) | 0) % 2 ? STEEL[0] : STEEL[4];   // вентиляція
      return ramp(STEEL, .44 - v * .3 + (dy < 1.2 ? .2 : 0), i, j, .1);
    });
    // випромінювачі сканера на задніх кутах платформи
    EMIT.forEach(([ex, ey]) => { S.rr(ex - 2.4, ey, ex + 2.4, PLAT.back + 1, .8, (d, u, v, i, j) => d < .4 ? OUT : ramp(CHROME, .65 - u * .4 - v * .2, i, j)); S.rr(ex - 3.2, ey - 3, ex + 3.2, ey + .6, 1.2, (d, u, v) => d < .4 ? OUT : v > .45 && v < .8 ? '#3be8ff' : CHROME[3]); });
    // кабелі з машинерії в ліву стійку
    K.wire(S, [[946, 236], [950, 238]], '#5a2a6a', 1.6); K.wire(S, [[946, 278], [951, 279]], '#2a5a7a', 1.6);
    K.contacts(S, { back: 300 }, [[PLAT.x0 - 1, PLAT.x1 + 1, PLAT.bot + .2, .75]]);
    return S;
  }
  // ---------- МАШИНЕРІЯ перед склом (живлення сканера) ----------
  function buildMach() {
    const S = F.Sheet(884, 160, 952, 346), { x0, x1, top } = MACH;
    S.poly([[x0 + .4, 196], toL(x0, 196), toL(x0, 344), [x0 + .4, 344]], (u, v, i, j) => u > .8 ? '#3be8ff' : ramp(STEEL, .26 - v * .16, i, j));   // бічна грань
    // основа: вентиляція, LED, ніжки
    S.rr(x0, 300, x1, 344, [2, 2, .6, .6], (d, u, v, i, j, X, Y) => {
      if (d < .6) return OUT; if (Y > 341.4) return Y > 342.6 ? OUT : '#0a1a2a';
      if (Y > 336 && Y < 337.4) return '#3be8ff';
      if (Y > 306 && Y < 330 && X > x0 + 5 && X < x1 - 5) return ((Y * 1.25) | 0) % 2 ? STEEL[0] : STEEL[3];
      return ramp(STEEL, .42 - v * .25 + (d < 1.6 ? .18 : 0), i, j, .1);
    });
    // корпус: панелі, ніша голо-екрана, 2 манометри
    S.rr(x0 + 4, 196, x1 - 4, 300, [3, 3, 0, 0], (d, u, v, i, j, X, Y) => {
      if (d < .6) return OUT; if (d < 1.6) return ramp(VIO, .7 - v * .3, i, j);
      const sy = ((Y - 196) % 26 + 26) % 26; if (sy < .6) return '#05031a';
      return ramp(VIO, .38 - v * .18, i, j, .1);
    });
    S.rr(HOLL[0] - 2.4, HOLL[1] - 2.4, HOLL[2] + 2.4, HOLL[3] + 2.4, 2.4, (d, u, v, i, j) => d < .6 ? '#06102e' : d < 1.4 ? ACC[1] : d < 2.4 ? ACC[3] : '#0a0628');   // рамка голо-екрана
    [[910, 214], [928, 214]].forEach(([gx, gy]) => S.rr(gx - 6, gy - 6, gx + 6, gy + 6, 6, (d, u, v, i, j, X, Y) => { const r = Math.hypot(X - gx, Y - gy); return r > 5.6 ? OUT : r > 4.6 ? ramp(CHROME, .8 - v * .5, i, j) : r > 4.1 ? OUT : '#e8e2ff'; }));   // манометри (стрілки — живі)
    // бак з котушками зверху: скляний циліндр, хромовані кришки (котушки світять живим)
    S.rr(x0 + 8, top + 4, x1 - 8, 198, 2, (d, u, v, i, j) => d < .5 ? OUT : (u < .16 ? '#9ad8ff' : ramp(['#1a0828', '#2a0c3e', '#3e1258', '#561a74'], .4 + Math.sin(u * Math.PI) * .4, i, j, .06)));
    [top, 196].forEach(y => S.rr(x0 + 6, y, x1 - 6, y + 4.2, 1.2, (d, u, v, i, j) => d < .5 ? OUT : ramp(CHROME, .78 - v * .5 - Math.abs(u - .35) * .5, i, j)));
    S.rr(917, top - 4, 921, top + .5, .8, (d, u, v, i, j) => d < .4 ? OUT : ramp(CHROME, .6 - u * .4, i, j));
    // м'яка тінь рослини біля дивану на машинерії (рослина стоїть перед нею — plant_care.js)
    const pc = NX.plantCare; if (pc) { const cx = pc.x + pc.w / 2 + 6, cy = pc.y + pc.h * .5, rx = pc.w * .42, ry = pc.h * .5, { w, h, d } = S.r;
      for (let j = 0; j < h; j++) for (let i = 0; i < w; i++) { const n = (j * w + i) * 4; if (!d[n + 3]) continue; const X = S.x0 + (i + .5) * S.U, Y = S.y0 + (j + .5) * S.U, e = ((X - cx) / rx) ** 2 + ((Y - cy) / ry) ** 2; if (e >= 1) continue; const k = 1 - .55 * (1 - e) ** 1.2; d[n] *= k; d[n + 1] *= k; d[n + 2] *= k; } }
    return S;
  }
  // ---------- ГОЛО-СТІЙКА праворуч і ТЕРМІНАЛ ----------
  function buildTerm() {
    const S = F.Sheet(1060, 186, 1136, 346), { x0, x1, y0 } = TERM;
    // голо-стійка: рамка екрана, стовпчик, ніжка
    S.rect(1079.4, HOLR[3] + 2, 1082.6, 334, (u, v, i, j) => u < .2 || u > .85 ? OUT : ramp(CHROME, .75 - Math.abs(u - .4) * 1.4 - v * .2, i, j));
    S.rr(1071, 333, 1091, 342, [2, 2, .5, .5], (d, u, v, i, j) => d < .5 ? OUT : v < .3 ? '#3be8ff' : ramp(STEEL, .45 - v * .3, i, j));
    S.rr(HOLR[0] - 2.4, HOLR[1] - 2.4, HOLR[2] + 2.4, HOLR[3] + 2.4, 2.4, (d, u, v, i, j) => d < .6 ? '#06102e' : d < 1.4 ? CYAN[1] : d < 2.4 ? CYAN[4] : '#061032');
    // термінал: бічна грань, корпус з блакитним кантом, ніші екранів, консоль з шестернею, вентиляція, основа
    S.poly([[x0 + .4, y0 + 4], toL(x0, y0 + 4), toL(x0, 344), [x0 + .4, 344]], (u, v, i, j) => u > .8 ? '#3be8ff' : ramp(STEEL, .26 - v * .16, i, j));
    S.rr(x0, y0, x1, 344, [4, 4, .8, .8], (d, u, v, i, j, X, Y) => {
      if (d < .6) return OUT; if (d < 1.5) return CYAN[2]; if (d < 2.2) return '#06102e';
      if (Y > 334) return Y > 342 ? OUT : ramp(STEEL, .5 - (Y - 334) * .05, i, j);
      if (Y > 306 && Y < 330 && X > x0 + 4 && X < x1 - 4) return ((Y * 1.25) | 0) % 2 ? STEEL[0] : STEEL[3];
      return ramp(STEEL, .36 - v * .16, i, j, .1);
    });
    TERM.scr.forEach(([a, b, c2, e]) => S.rr(a - 1.6, b - 1.6, c2 + 1.6, e + 1.6, 1.6, (d) => d < .5 ? '#06102e' : d < 1.1 ? CYAN[4] : '#061032'));
    S.poly([[x0 + 2.5, 276], [x1 - 2.5, 276], [x1 - 1.5, 303], [x0 + 1.5, 303]], (u, v, i, j) => v < .06 ? CHROME[4] : ramp(STEEL, .5 - v * .25, i, j, .08));   // консоль
    const [gx, gy, gr] = TERM.gear; S.rr(gx - gr - 1.4, gy - gr - 1.4, gx + gr + 1.4, gy + gr + 1.4, gr + 1.4, (d) => d < .6 ? OUT : d < 1.4 ? CHROME[3] : '#061032');
    return S;
  }
  // ---------- МАНІПУЛЯТОР: спрайти ланок (горизонтально, обертаються живим) ----------
  function link(L, th, col) {
    const W = L + th + 2, H = th + 6, S = F.Sheet(0, 0, W, H), cy = H / 2;
    S.rr(1, cy - th / 2, W - 1, cy + th / 2, th / 2, (d, u, v, i, j, X, Y) => {
      if (d < .6) return OUT;
      const tv = (Y - (cy - th / 2)) / th;
      if (tv > .3 && tv < .42 && X > th && X < W - th) return col;                    // неонова смуга
      if (tv < .18) return ramp(VIO, .78, i, j);
      return ramp(VIO, .62 - tv * .45, i, j, .08);
    });
    S.rr(th * .9, cy - th / 2 - 2.6, W * .62, cy - th / 2 + .4, 1.2, (d, u, v, i, j) => d < .45 ? OUT : v < .4 ? CHROME[4] : CHROME[2]);   // гідроциліндр зверху
    for (const x of [th * .8, W - th * .8]) S.rr(x - 1, cy - 1, x + 1, cy + 1, 1, (d, u, v) => d < .3 ? OUT : CHROME[4]);
    return { cv: S.canvas(), w: W, h: H, off: th / 2 + 1 };
  }
  function joint(r, ring) {
    const W = r * 2 + 2, S = F.Sheet(0, 0, W, W), c = W / 2;
    S.rr(1, 1, W - 1, W - 1, r, (d, u, v, i, j, X, Y) => { const rr = Math.hypot(X - c, Y - c); if (rr > r - .5) return OUT; if (rr > r - 1.6) return ramp(CHROME, .8 - v * .5, i, j); if (rr < r * .32) return rr < r * .18 ? (ring || CHROME[1]) : CHROME[3];
      if (ring && Math.abs(rr - r * .62) < .7) return ring;                                                 // кільце-підсвітка (як «спіраль» на картинці)
      return ramp(VIO, .6 - v * .35 - (u - .5) * .2, i, j, .06); });
    return { cv: S.canvas(), w: W, h: W };
  }
  function toolHead() {
    const S = F.Sheet(0, 0, 12, 18);
    S.rr(2, 0, 10, 8, 1.6, (d, u, v, i, j) => d < .5 ? OUT : ramp(VIO, .6 - v * .3, i, j));
    S.rr(3.5, 7, 8.5, 14, 1, (d, u, v, i, j) => d < .4 ? OUT : ramp(CHROME, .75 - u * .5, i, j));
    S.rr(1.5, 13, 10.5, 17, 1.4, (d, u, v) => d < .4 ? OUT : v > .45 ? '#3be8ff' : CHROME[3]);
    return { cv: S.canvas(), w: 12, h: 18 };
  }

  // ---------- живі екрани ----------
  const [HCV, hx] = F.canvas(312, 378), [GCV, gx] = F.canvas(172, 224), [LCV, lx] = F.canvas(136, 240), [RCV, rx] = F.canvas(104, 232), TS = TERM.scr.map(() => F.canvas(96, 80));
  const ICONS = { chat: ['XXXXXXX', 'X.....X', 'X.X.X.X', 'X.....X', 'XXXXXXX', '.XX....', 'X......'], mail: ['XXXXXXX', 'XX...XX', 'X.X.X.X', 'X..X..X', 'X.....X', 'XXXXXXX', '.......'],
    chart: ['......X', '.....XX', '...X.XX', '..XX.XX', 'X.XX.XX', 'XXXX.XX', 'XXXXXXX'], bot: ['.X...X.', '..XXX..', '.XXXXX.', 'XX.X.XX', 'XXXXXXX', '.XXXXX.', '.X...X.'],
    crown: ['X..X..X', 'XX.X.XX', 'XXXXXXX', 'X.X.X.X', 'XXXXXXX', '.......', '.......'], wing: ['X......', 'XX.....', 'XXX....', 'XXXX..X', '.XXXXXX', '..XXXX.', '...XX..'],
    ant: ['.X...X.', '.X...X.', '..X.X..', '...X...', '..XXX..', '.XXXXX.', '.......'], glass: ['.......', 'XXX.XXX', 'X.XXX.X', 'XXX.XXX', '.......', '.......', '.......'], star: ['...X...', '..XXX..', 'XXXXXXX', '.XXXXX.', '.XX.XX.', 'X.....X', '.......'] };
  const icon = (c, name, x, y, px, col) => { c.fillStyle = col; ICONS[name].forEach((row, j) => [...row].forEach((ch, i) => ch === 'X' && c.fillRect(x + i * px, y + j * px, px, px))); };
  function drawHub(c, t, act) {
    const W = 312, H = 378; c.clearRect(0, 0, W, H);
    const g = c.createLinearGradient(0, 0, 0, H); g.addColorStop(0, '#0d2a8a'); g.addColorStop(1, '#071650'); c.fillStyle = g; c.fillRect(0, 0, W, H);
    c.fillStyle = 'rgba(120,190,255,.08)'; for (let x = 6; x < W; x += 24) c.fillRect(x, 0, 1, H); for (let y = 6; y < H; y += 24) c.fillRect(0, y, W, 1);
    // шапка: NEXORA AI (назва — без перекладу), вогник
    const tc = '#7af0ff'; c.save(); c.globalCompositeOperation = 'lighter'; c.fillStyle = 'rgba(80,200,255,.18)'; c.fillRect(10, 10, W - 20, 40); c.restore();
    P.text(c, 'NEXORA AI', W / 2 + 1, 41, 'rgba(255,79,216,.55)', 23, 'center'); P.text(c, 'NEXORA AI', W / 2, 40, tc, 23, 'center');
    lit(c, W - 22, 16, 8, 8, Math.sin(t * 3) > 0 ? '#3bff8a' : '#1f6a45');
    // мапа світу з пінгами (wing_screens.js)
    K.scrMap(c, 10, 62, 214, 176, t, { act, hot: ['kyiv', 'warsaw', 'amsterdam', 'london', 'newyork', 'tokyo'], land: '#62b4f8' });
    // 3 плитки-іконки праворуч: чат, пошта, графік — по черзі спалахують
    ['chat', 'mail', 'chart'].forEach((n, k) => { const y = 62 + k * 60, on = (Math.floor(t * .9) + k) % 3 === 0; c.strokeStyle = on ? '#ff7af0' : '#5ae8ff'; c.lineWidth = 3; c.strokeRect(238.5, y + 1.5, 61, 51); c.fillStyle = on ? 'rgba(255,79,216,.22)' : 'rgba(59,232,255,.1)'; c.fillRect(240, y + 3, 58, 48); icon(c, n, 252, y + 10, 5, on ? '#ffc2ec' : '#9af6ff'); });
    // статус: онлайн · задач зроблено; лінія активності
    const done = Object.values(NX.ui.zones.done || {}).reduce((a, L) => a + L.length, 0) + 12;
    lit(c, 12, 254, 10, 10, Math.sin(t * 2.4) > -.4 ? '#3bff8a' : '#1f6a45');
    const on = NX.t('scene.hub.online'), tk = NX.t('scene.hub.tasks') + ' ' + done; P.text(c, on, 28, 264, '#bfe9ff', Math.min(13, 150 / on.length)); P.text(c, tk, W - 12, 264, '#ffe27a', Math.min(13, 130 / tk.length), 'right');
    c.strokeStyle = '#ff9ae6'; c.lineWidth = 3; c.beginPath(); for (let x = 0; x <= W - 24; x += 6) { const v = .5 + .3 * Math.sin((x + t * (30 + act * 50)) * .05) + .15 * Math.sin((x + t * 70) * .13), y = 352 - v * 64; x ? c.lineTo(12 + x, y) : c.moveTo(12 + x, y); } c.stroke();
    c.fillStyle = 'rgba(255,255,255,.35)'; c.fillRect(0, (t * 40) % H, W, 2); c.fillStyle = 'rgba(255,255,255,.08)'; c.fillRect(4, 4, W - 8, 10);
  }
  /** Скло сканера: рожева голограма, емблема Nexi з кільцями, іконки скінів спливають; під час сканування — смуга. */
  function drawGlass(c, t, act, prog) {
    const W = 172, H = 224; c.clearRect(0, 0, W, H);
    const g = c.createRadialGradient(W / 2, 70, 6, W / 2, 90, 150); g.addColorStop(0, '#d850cc'); g.addColorStop(.35, '#a0229c'); g.addColorStop(.75, '#4c0c6c'); g.addColorStop(1, '#22063e'); c.fillStyle = g; c.fillRect(0, 0, W, H);
    c.fillStyle = 'rgba(255,200,250,.07)'; for (let y = (t * 10 | 0) % 4; y < H; y += 4) c.fillRect(0, y, W, 1);
    c.save(); c.globalCompositeOperation = 'lighter';
    // емблема: коло з головою робота, два кільця крутяться в різні боки
    const ex = W / 2, ey = 58, a = t * (1 + act * 2);
    c.lineWidth = 3; c.strokeStyle = 'rgba(255,220,250,.75)'; c.beginPath(); c.arc(ex, ey, 30, a, a + 4.2); c.stroke();
    c.strokeStyle = 'rgba(255,140,240,.7)'; c.beginPath(); c.arc(ex, ey, 38, -a * .7, -a * .7 + 2.2); c.stroke(); c.beginPath(); c.arc(ex, ey, 38, -a * .7 + 3.2, -a * .7 + 5); c.stroke();
    c.fillStyle = 'rgba(255,230,252,.72)'; ICONS.bot.forEach((row, j) => [...row].forEach((ch, i) => ch === 'X' && c.fillRect(ex - 21 + i * 6, ey - 21 + j * 6, 6, 6)));
    // іконки скінів спливають угору й гаснуть
    ['crown', 'wing', 'ant', 'glass', 'star', 'crown'].forEach((n, k) => { const q = (t * .09 + k / 6) % 1, x = 18 + ((k * 53) % (W - 52)) + Math.sin(t + k) * 6, y = H - 24 - q * (H - 110); c.globalAlpha = Math.sin(q * Math.PI) * .7; icon(c, n, x, y, 3, k % 2 ? '#ffd4ff' : '#9af6ff'); });
    c.globalAlpha = 1;
    // іскорки
    for (let k = 0; k < 14; k++) { const ph = (t * .5 + hash(k, 3)) % 1, x = hash(k, 5) * W, y = H * (1 - ph); c.fillStyle = `rgba(255,240,255,${.6 * Math.sin(ph * Math.PI)})`; c.fillRect(x, y, 2, 2); }
    if (act) { const sy = H * (.25 + .7 * (Math.sin(t * 2.5) * .5 + .5)); const gg = c.createLinearGradient(0, sy - 14, 0, sy + 14); gg.addColorStop(0, 'rgba(120,240,255,0)'); gg.addColorStop(.5, 'rgba(160,250,255,.55)'); gg.addColorStop(1, 'rgba(120,240,255,0)'); c.fillStyle = gg; c.fillRect(0, sy - 14, W, 28); }
    c.restore();
    c.fillStyle = 'rgba(255,255,255,.1)'; c.fillRect(4, 4, W - 8, 8);
  }
  /** Голо-екран машинерії: каталог скінів — три силуети Nexi міняють кольори, підпис. */
  function drawCatalog(c, t, act) {
    const W = 136, H = 240; K.screenBg(c, W, H, t, .5);
    const s = NX.t('scene.ws.skins'); P.text(c, s, W / 2, 22, '#ffd4ff', Math.min(14, 120 / s.length), 'center');
    const COLS = [['#ff7af0', '#ffd4ff'], ['#ffe27a', '#fff2b8'], ['#7af0ff', '#d8fbff'], ['#9a8cff', '#dcd6ff'], ['#3bff8a', '#c8ffd8']];
    for (let k = 0; k < 3; k++) { const n = (Math.floor(t * (.5 + act)) + k) % COLS.length, [a, b] = COLS[n], x = 12 + k * 40, y = 50 + (k === 1 ? 0 : 12), on = k === 1;
      c.fillStyle = on ? 'rgba(255,255,255,.14)' : 'rgba(255,255,255,.05)'; c.fillRect(x - 4, y - 6, 38, 66);
      c.fillStyle = a; c.fillRect(x + 6, y, 18, 14); c.fillStyle = '#0a1236'; c.fillRect(x + 9, y + 4, 12, 6); c.fillStyle = b; c.fillRect(x + 11, y + 6, 2, 2); c.fillRect(x + 17, y + 6, 2, 2);
      c.fillStyle = a; c.fillRect(x + 8, y + 16, 14, 16); c.fillRect(x + 4, y + 18, 3, 10); c.fillRect(x + 23, y + 18, 3, 10); c.fillRect(x + 9, y + 33, 4, 10); c.fillRect(x + 17, y + 33, 4, 10); c.fillRect(x + 14, y - 5, 2, 5); }
    for (let k = 0; k < 4; k++) { const v = .3 + .6 * noise(t * .6, k + 2); lit(c, 14, 140 + k * 22, 108, 10, 'rgba(255,255,255,.08)'); lit(c, 14, 140 + k * 22, 108 * v, 10, ['#ff7af0', '#7af0ff', '#ffe27a', '#3bff8a'][k]); }
    K.glitch(c, W, H, t, K.pages(t, 4, 2, 9).sw, 4);
  }
  /** Голо-стійка праворуч: примірка — деталі скіна; під час сканування — СКАН xx %. */
  function drawFit(c, t, act, prog) {
    const W = 104, H = 232; K.screenBg(c, W, H, t, .5);
    if (act) {
      const sc = NX.t('scene.scan'), pc = Math.floor(prog * 100) + '%'; P.text(c, sc, W / 2, 30, '#bfe9ff', Math.min(14, 90 / sc.length), 'center'); P.text(c, pc, W / 2, 70, '#ffffff', 22, 'center');
      lit(c, 10, 88, W - 20, 10, 'rgba(255,255,255,.12)'); lit(c, 10, 88, (W - 20) * prog, 10, '#3bff8a');
      for (let k = 0; k < 8; k++) { const y = 112 + k * 14, ok = k < prog * 8; lit(c, 12, y, 8, 8, ok ? '#3bff8a' : '#2a4a8a'); lit(c, 26, y + 2, 40 + 30 * hash(k, 2), 4, ok ? '#bfe9ff' : '#4a6aaa'); }
      return;
    }
    const s = NX.t('scene.ws.fit'); P.text(c, s, W / 2, 22, '#bfe9ff', Math.min(13, 92 / s.length), 'center');
    const n = Math.floor(t / 3) % 4, parts = ['ant', 'crown', 'wing', 'glass'];
    c.save(); c.globalCompositeOperation = 'lighter'; c.strokeStyle = 'rgba(122,240,255,.6)'; c.lineWidth = 2; c.strokeRect(14, 40, W - 28, W - 28); icon(c, parts[n], 22, 50, 8.5, '#9af6ff'); c.restore();
    for (let k = 0; k < 5; k++) { lit(c, 12, 130 + k * 18, 6, 6, k === n ? '#ff7af0' : '#5ae8ff'); lit(c, 24, 131 + k * 18, 30 + 40 * noise(t * .4, k), 4, '#bfe9ff'); }
    K.glitch(c, W, H, t, K.pages(t, 6, 2, 8).sw, 6);
  }
  /** Три екрани термінала: код скіна (рядки), стовпчики, прогрес. */
  function drawTerm(k, c, t, act, prog) {
    const W = 96, H = 80; c.clearRect(0, 0, W, H); c.fillStyle = 'rgba(16,60,180,.7)'; c.fillRect(0, 0, W, H);
    if (k === 0) { for (let r = 0; r < 6; r++) { const w = 20 + 60 * hash(r, Math.floor(t * (1 + act * 3) + r * .3)); lit(c, 6, 6 + r * 12, w, 5, r % 3 ? '#9af6ff' : '#ff9ae6'); } if (Math.sin(t * 5) > 0) lit(c, 8 + 70 * hash(5, Math.floor(t)), 66, 6, 6, '#ffffff'); }
    else if (k === 1) { for (let i = 0; i < 8; i++) { const v = noise(t * (1.2 + act * 2), i + 5), h = 10 + v * 56; lit(c, 6 + i * 11, H - 6 - h, 8, h, i % 3 ? '#7af0ff' : '#ffe27a'); } }
    else { const v = act ? prog : (t * .07) % 1; lit(c, 6, 30, W - 12, 18, 'rgba(255,255,255,.12)'); lit(c, 6, 30, (W - 12) * v, 18, act ? '#3bff8a' : '#ff7af0'); P.text(c, Math.floor(v * 100) + '%', W / 2, 68, '#e8fdff', 14, 'center'); }
    c.fillStyle = 'rgba(255,255,255,.12)'; c.fillRect(0, 0, W, 6);
  }

  // ---------- маніпулятор: зворотна кінематика (плече й лікоть до цілі зап'ястя) ----------
  function ik(B, T, L1, L2) {
    let dx = T[0] - B[0], dy = T[1] - B[1], d = Math.hypot(dx, dy); d = Math.min(L1 + L2 - .01, Math.max(Math.abs(L1 - L2) + .01, d));
    const a = Math.atan2(dy, dx), cb = (L1 * L1 + d * d - L2 * L2) / (2 * L1 * d), a1 = a + Math.acos(P.clamp(cb, -1, 1));   // лікоть угорі
    const E = [B[0] + Math.cos(a1) * L1, B[1] + Math.sin(a1) * L1]; return { a1, E, a2: Math.atan2(T[1] - E[1], T[0] - E[0]) };
  }
  let CS = null, MS = null, TM = null, UP = null, LO = null, JB = null, JE = null, JW = null, TH = null;
  function ensure() { if (CS) return; CS = buildCapsule(); CS.cv = CS.canvas(); MS = buildMach(); MS.cv = MS.canvas(); TM = buildTerm(); TM.cv = TM.canvas(); UP = link(ARM.L1, 9, '#ff4fd8'); LO = link(ARM.L2, 7, '#3be8ff'); JB = joint(12, '#ff4fd8'); JE = joint(8, '#3be8ff'); JW = joint(5.5, null); TH = toolHead(); }
  // нерухоме — у злиття правого крила (rwing_wall.js): термінал з голо-стійкою, капсула, машинерія перед склом (вона найближча)
  RW.static(30, () => (ensure(), TM)); RW.static(31, () => CS); RW.static(32, () => MS);
  const ws = NX.addObject({
    id: 'workshop', name: 'obj.workshop', act: 'workshop', rw: true, span: [884, 1172],
    hit: { x: 892, y: 146, w: 208, h: 196 }, active: false, prog: 0, inst: 0, fr: 0, cv: document.createElement('canvas'), tc: document.createElement('canvas'),
    OFFERS: [{ theme: 'neon', ant: 'gamer', back: 'wings' }, { theme: 'gold', ant: 'crown', body: 'premium' }, { theme: 'space', body: 'cosmos', ant: 'holo', head: 'phones' }],
    install() { this.inst = 1.3; },
    update(dt) {
      if (this.inst > 0) { this.inst -= dt; const k = 1 - this.inst / 1.3; if (k > .35 && k < .7) { for (let i = 0; i < 2; i++) NX.fx.emit('spark', 1005 + (Math.random() - .5) * 8, this.nozzleY + 3); } if (k > .5 && k < .56) NX.nexiPhys.land(2); if (k > .3 && k < .4 && Math.random() < .5) NX.fx.emit('spark', ARM.dock[0] + (Math.random() - .5) * 6, ARM.dock[1] - 2, { col: '#ffe27a' }); }
    },
    /** Голограма-спрайт: тонуємо пікселі бота кольором. */
    holo(c, look, pose, t, x, footY, s, alpha, hue) {
      renderBot({ ...DEFAULT_LOOK, ...look }, pose, t, this.cv);
      const tc = this.tc; tc.width = SW; tc.height = SH; const tx = tc.getContext('2d'); tx.drawImage(this.cv, 0, 0);
      tx.globalCompositeOperation = 'source-atop'; tx.fillStyle = hue; tx.fillRect(0, 0, SW, SH);
      const sx = Math.cos(t * 1.4), w = SW * s * Math.max(.08, Math.abs(sx));
      c.save(); c.globalAlpha = alpha; c.imageSmoothingEnabled = false; c.translate(x, 0); c.scale(sx < 0 ? -1 : 1, 1); c.drawImage(tc, -w / 2, footY - FOOT * s, w, SH * s); c.restore();
    },
    get nozzleY() { const k = this.inst > 0 ? Math.sin((1 - this.inst / 1.3) * Math.PI) : 0; return 214 + k * 44; },
    /** Маніпулятор: де зараз зап'ястя (без Nexi — ледь дихає, з Nexi — працює, під час встановлення — смикається до дока). */
    armTarget(t) {
      const [rx, ry] = ARM.rest, act = this.active ? 1 : 0, k = this.inst > 0 ? Math.sin((1 - this.inst / 1.3) * Math.PI) : 0;
      return [rx + Math.sin(t * .5) * 2 + act * Math.sin(t * 1.3) * 7 + k * (ARM.dock[0] + 4 - rx), ry + Math.sin(t * .7 + 1) * 1.5 + act * Math.sin(t * 2.1) * 4 + k * (ARM.dock[1] - 9 - ry)];
    },
    drawArm(c, t) {
      const R = F.res(), B = ARM.base, T = this.armTarget(t), { a1, E, a2 } = ik(B, T, ARM.L1, ARM.L2);
      const seg = (sp, x, y, a) => { c.save(); c.translate(x, y); c.rotate(a); c.imageSmoothingEnabled = true; c.drawImage(F.fit(sp.cv, sp.w, sp.h, R), -sp.off, -sp.h / 2, sp.w, sp.h); c.restore(); };
      const jt = (sp, x, y, a = 0) => { c.save(); c.translate(x, y); if (a) c.rotate(a); c.imageSmoothingEnabled = R < 3.8; c.drawImage(F.fit(sp.cv, sp.w, sp.h, R), -sp.w / 2, -sp.h / 2, sp.w, sp.h); c.restore(); };
      // інструмент (вниз від зап'ястя) — за ланками; кабель від бази до ліктя
      c.save(); c.imageSmoothingEnabled = R < 3.8; c.drawImage(F.fit(TH.cv, TH.w, TH.h, R), T[0] - TH.w / 2, T[1] - 2, TH.w, TH.h); c.restore();
      c.strokeStyle = OUT; c.lineWidth = 1.6; c.beginPath(); c.moveTo(B[0] - 4, B[1] + 6); c.quadraticCurveTo((B[0] + E[0]) / 2, (B[1] + E[1]) / 2 + 14, E[0] + 2, E[1] + 5); c.stroke();
      c.strokeStyle = '#5a2a6a'; c.lineWidth = .7; c.stroke();
      seg(LO, E[0], E[1], a2); seg(UP, B[0], B[1], a1);
      jt(JB, B[0], B[1], t * .2); jt(JE, E[0], E[1]); jt(JW, T[0], T[1]);
      c.save(); c.globalCompositeOperation = 'lighter'; const pulse = .35 + .25 * Math.sin(t * 3) + (this.active ? .2 : 0);
      RW.glow(c, B[0], B[1], 9, 'rgba(255,79,216,.9)', pulse * .5); RW.glow(c, E[0], E[1], 6, 'rgba(59,232,255,.9)', pulse * .4); lit(c, T[0] - 4.5, T[1] + 14.2, 9, 1.4, rgba('120,240,255', .6 + .3 * Math.sin(t * 6)));
      c.restore();
    },
    drawBack(c, t) {
      ensure();
      const P0 = NX.cfg.POI.workshop.pad, act = this.active ? 1 : 0, R = F.res(), fr = this.fr++;
      // живі екрани: по черзі (кожен — раз на 3 кадри), щоб кадр не дорожчав
      if (fr % 3 === 0 || fr < 3) { drawHub(hx, t, act); drawGlass(gx, t, act, this.prog); }
      if (fr % 3 === 1 || fr < 3) { drawCatalog(lx, t, act); drawFit(rx, t, act, this.prog); }
      if (fr % 3 === 2 || fr < 3) TS.forEach(([cv, x], k) => drawTerm(k, x, t, act, this.prog));
      c.save();
      // екран NEXORA AI на стіні
      c.imageSmoothingEnabled = true; c.globalAlpha = K.flick(t, 41); c.drawImage(HCV, HUBIN[0], HUBIN[1], HUBIN[2] - HUBIN[0], HUBIN[3] - HUBIN[1]); c.globalAlpha = 1;
      c.globalCompositeOperation = 'lighter'; RW.glow(c, (HUB.x0 + HUB.x1) / 2, (HUB.y0 + HUB.y1) / 2, 70, 'rgba(60,140,255,.6)', .12 + .03 * Math.sin(t)); c.globalCompositeOperation = 'source-over';
      // термінал, капсула й машинерія — у злитті (rwing_wall.js); поверх — живі екрани, скло сканера, неон
      c.imageSmoothingEnabled = true;
      c.globalAlpha = K.flick(t, 44) * .95; c.drawImage(RCV, HOLR[0], HOLR[1], HOLR[2] - HOLR[0], HOLR[3] - HOLR[1]);
      TERM.scr.forEach(([a, b, c2, e], k) => { c.globalAlpha = K.flick(t, 45 + k); c.drawImage(TS[k][0], a, b, c2 - a, e - b); });
      c.globalAlpha = .96 * K.flick(t, 42, .6); c.drawImage(GCV, GLASS[0] + 1.5, GLASS[1] + 1, GLASS[2] - GLASS[0] - 3, GLASS[3] - GLASS[1] - 2);
      c.globalAlpha = K.flick(t, 43) * .95; c.drawImage(LCV, HOLL[0], HOLL[1], HOLL[2] - HOLL[0], HOLL[3] - HOLL[1]); c.globalAlpha = 1;
      this.live(c, t, act);
      K.sign(c, CAP.sign[0], CAP.sign[1], CAP.sign[2] - CAP.sign[0], CAP.sign[3] - CAP.sign[1], { acc: ACC, icon: 'bot', key: 'nav.workshop', t, glow: '255,79,216', text: '255,214,248' });
      c.restore();
      // голограма Nexi над порожньою платформою або орбіта пропозицій (позаду)
      c.save(); c.globalCompositeOperation = 'lighter';
      const g = c.createLinearGradient(0, P0[1] - 76, 0, P0[1]); g.addColorStop(0, 'rgba(217,75,255,0)'); g.addColorStop(1, `rgba(217,75,255,${act ? .5 : .28})`); c.fillStyle = g; c.fillRect(P0[0] - 26, P0[1] - 76, 52, 76); c.restore();
      if (!RW.patching) { if (!act) { this.holo(c, NX.nexi.look, poseFor('stand', t, false), t, P0[0], P0[1] + 3, 1.0, .7, 'rgba(80,220,255,.45)'); for (let i = 0; i < 3; i++) P.rect(c, P0[0] - 22, P0[1] - 62 + ((t * 20 + i * 20) % 60), 44, .7, 'rgba(160,240,255,.6)'); } else this.orbit(c, t, false); }
      this.drawArm(c, t);
    },
    /** Живе на капсулі: неон козирка й стійок дихає, LED, подушка, щілина, промені випромінювачів, котушки бака, стрілки манометрів, шестерня термінала. */
    live(c, t, act) {
      const [px, py] = NX.cfg.POI.workshop.pad;
      c.save(); c.globalCompositeOperation = 'lighter';
      c.strokeStyle = rgba('255,79,216', .16 + .08 * Math.sin(t * 1.6) + act * .12); c.lineWidth = 3; c.beginPath(); c.roundRect ? c.roundRect(CAP.x0 - 1, CAP.top - 1, CAP.x1 - CAP.x0 + 2, CAP.hood - CAP.top + 2, 13) : c.rect(CAP.x0, CAP.top, CAP.x1 - CAP.x0, CAP.hood - CAP.top); c.stroke();
      [CAP.x0 + CAP.pil - 2.2, CAP.x1 - CAP.pil + .6].forEach(x => { c.fillStyle = rgba('255,79,216', .22 + .1 * Math.sin(t * 2 + x) + act * .15); c.fillRect(x, CAP.hood, 1.6, CAP.bot - CAP.hood); });
      for (let k = 0; k < 18; k++) lit(c, CAP.x0 + 3 + k * 6.3, CAP.hood - 2.8, 1.4, 1, rgba(k % 2 ? '255,79,216' : '59,232,255', .35 + .6 * ((Math.floor(t * (3 + act * 5)) + k) % 6 === 0)));   // LED-цятки губи козирка
      [[CAP.x0 + 8.8, 1], [CAP.x1 - 8.8, -1]].forEach(([x, s2]) => { for (let k = 0; k < 4; k++) { const y = CAP.hood + 6 + k * 24, on = (Math.floor(t * 2) + k + (s2 > 0 ? 0 : 2)) % 4 === 0; lit(c, x - 1, y + 2, 2, 6, rgba(on ? '255,180,250' : '160,60,200', on ? .9 : .4)); } });
      RW.glow(c, px, py - .5, 30, 'rgba(59,232,255,.8)', .18 + .08 * Math.sin(t * 2) + act * .2);                                     // подушка світиться
      c.strokeStyle = rgba('120,240,255', .5 + .3 * Math.sin(t * 3)); c.lineWidth = .7; c.beginPath(); c.ellipse(px, py - .3, 24, 4.2, 0, 0, 7); c.stroke();
      lit(c, 988.5, PLAT.top + 5.2, 33, 2.4, rgba('255,170,80', .55 + .25 * Math.sin(t * 2.6))); RW.glow(c, 1005, PLAT.top + 6.4, 16, 'rgba(255,150,60,.9)', .22);   // помаранчева щілина
      c.fillStyle = rgba('59,232,255', .25 + .2 * Math.sin(t * 2)); c.fillRect(PLAT.x0 + 1, PLAT.top + 10.8, PLAT.x1 - PLAT.x0 - 2, 1);
      const sp = PLAT.x0 + ((t * .2) % 1) * (PLAT.x1 - PLAT.x0); lit(c, sp - 5, PLAT.top - .6, 10, .8, 'rgba(255,255,255,.8)');                 // іскра біжить кантом платформи
      EMIT.forEach(([ex, ey], n) => { const on = act ? .7 + .3 * Math.sin(t * 9 + n) : .3 + .2 * Math.sin(t * 2 + n); RW.glow(c, ex, ey - 1.5, 5, 'rgba(59,232,255,.9)', on * .5);
        if (act && NX.nexi.loc === 'pad') { const ty = py - 18 - Math.sin(t * 2.5) * 16; c.strokeStyle = rgba('120,240,255', .35 * on); c.lineWidth = .6; c.beginPath(); c.moveTo(ex, ey - 1.5); c.lineTo(px + (n ? 7 : -7), ty); c.stroke(); } });
      // бак машинерії: рожеві котушки світять і «біжать»
      for (let k = 0; k < 4; k++) { const y = MACH.top + 7 + k * 4.6, f = .45 + .35 * Math.sin(t * 4 - k * .9) + act * .2; lit(c, MACH.x0 + 10, y, MACH.x1 - MACH.x0 - 20, 1.4, rgba('255,90,220', f)); }
      RW.glow(c, (MACH.x0 + MACH.x1) / 2, MACH.top + 13, 20, 'rgba(255,79,216,.9)', .2 + act * .15);
      c.fillStyle = rgba('59,232,255', .3 + .25 * Math.sin(t * 1.7)); c.fillRect(MACH.x0 + 1, 336.2, MACH.x1 - MACH.x0 - 2, 1);
      c.globalCompositeOperation = 'source-over';
      [[910, 214, 0], [928, 214, 2]].forEach(([gx2, gy2, ph]) => { const a = -2.4 + 1.6 * (.5 + .5 * Math.sin(t * (.7 + act * 2) + ph)) + Math.sin(t * 23 + ph) * .04; c.strokeStyle = '#d0203a'; c.lineWidth = .7; c.beginPath(); c.moveTo(gx2, gy2); c.lineTo(gx2 + Math.cos(a) * 3.4, gy2 + Math.sin(a) * 3.4); c.stroke(); lit(c, gx2 - .5, gy2 - .5, 1, 1, '#2a1a2a'); });
      const [gx3, gy3, gr] = TERM.gear, ga = t * (act ? 2.4 : .6);                                                                       // шестерня на консолі
      c.save(); c.globalCompositeOperation = 'lighter'; c.translate(gx3, gy3); c.rotate(ga); c.fillStyle = '#5ae8ff'; for (let k = 0; k < 8; k++) { c.rotate(Math.PI / 4); c.fillRect(-1, -gr + .6, 2, 2.6); } c.strokeStyle = '#5ae8ff'; c.lineWidth = 1.4; c.beginPath(); c.arc(0, 0, gr - 3, 0, 7); c.stroke(); c.restore();
      for (let k = 0; k < 4; k++) lit(c, TERM.x0 + 4 + k * 6.4, 331, 2, 1.2, hash(k, Math.floor(t * (2 + act * 6))) > .45 ? ['#3bff8a', '#3be8ff', '#ff4fd8', '#ffe27a'][k] : '#0a1a2a');
      c.restore();
    },
    /** Орбіта з трьох голограм-пропозицій; front=true — ті, що перед Nexi. */
    orbit(c, t, front) {
      const [px, py] = NX.cfg.POI.workshop.pad;
      this.OFFERS.forEach((lk, i) => { const a = t * 1.1 + i * 2.094, s2 = Math.sin(a); if ((s2 > 0) !== front) return;
        this.holo(c, lk, poseFor('stand', t + i, false), t + i, px + Math.cos(a) * 38, py - 6 + s2 * 6, .6, .75 + s2 * .2, ['rgba(255,80,220,.5)', 'rgba(255,200,80,.5)', 'rgba(120,140,255,.5)'][i]); });
    },
    /** Віддзеркалення в підлозі під зоною (rwing_floor.js): машинерія, платформа, термінал. */
    reflect(c, t) { if (!CS) return; const R = Math.min(2, F.res()); K.draw(c, TM, R); K.draw(c, CS, R); K.draw(c, MS, R); },
    layers(t) {
      const [px, py] = NX.cfg.POI.workshop.pad, L = [];
      L.push({ y: py + .6, draw: c => {
        if (this.active && !RW.patching) {
          this.orbit(c, t, true);
          const k = Math.sin(t * 2.5) * .5 + .5, y = py - 4 - k * 56;                                                            // кільце сканера
          c.save(); c.globalCompositeOperation = 'lighter'; c.strokeStyle = '#3be8ff'; c.lineWidth = 1.5; c.beginPath(); c.ellipse(px, y, 23, 5, 0, 0, Math.PI * 2); c.stroke(); RW.glow(c, px, y, 26, 'rgba(59,232,255,.7)', .25); c.restore();
        }
        // внутрішній маніпулятор капсули: телескопічна штанга з кільцем-головкою (опускається під час встановлення)
        const ny = this.nozzleY, cx = 1005;
        P.rect(c, cx - 11, 205, 22, 4, '#2a1d52'); P.rect(c, cx - 11, 205, 22, 1, '#7a6ac0'); P.rect(c, cx - 12, 208.4, 24, .8, OUT);
        P.rect(c, cx - 3, 209, 6, ny - 209, '#7a84b8'); P.rect(c, cx - 3, 209, 1.6, ny - 209, '#c3cbea'); P.rect(c, cx + 2, 209, 1, ny - 209, '#3a4070');
        for (let y = 216; y < ny - 4; y += 9) P.rect(c, cx - 4, y, 8, 1.4, '#4a5590');
        P.rect(c, cx - 7, ny, 14, 5, '#3a3a78'); P.rect(c, cx - 7, ny, 14, 1, '#9aa4d8'); P.rect(c, cx - 4, ny + 5, 8, 2.4, this.inst > 0 ? '#ff4fd8' : '#3be8ff');
        RW.glow(c, cx, ny + 7, 13, this.inst > 0 ? 'rgba(255,80,220,.9)' : 'rgba(59,232,255,.6)', .6);
        if (this.inst > 0 && this.inst < .65 && this.inst > .45) RW.glow(c, px, py - 34, 60, 'rgba(255,255,255,.95)', .8);
      } });
      return L;
    },
  });
  RW.reflectors.push((c, t) => ws.reflect(c, t));
})();

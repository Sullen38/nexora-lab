/* ============================================================================
 * objects/rwing_wall.js — ПРАВЕ КРИЛО: СТІНА, ПІДЛОГА, АНТРЕСОЛЬ (NX.rwing)
 * ----------------------------------------------------------------------------
 * Праве крило (майстерня, інструменти, портал) перемальоване з нуля кодом як ОДНА сцена —
 * так само, як ліве (конструктор NX.kit). Картинка кімнати праворуч від вікна більше не
 * малюється (NX.room.pieces, world/cityscape.js). Тут — те, що стоїть за зонами:
 *   СТІНА (x 970..1536, до підлоги 338) — темні металеві панелі (K.panels): шви, фаски, заклепки,
 *     жалюзі, накладні плити, перфорація, технологічний канал; відсвіти від екранів, капсули,
 *     порталу й ліхтарів; м'які тіні від усього, що стоїть перед стіною (світло — згори й від
 *     вікна ЛІВОРУЧ, тож тіні трохи вниз і праворуч), патьоки, плями, кіптява, вм'ятини;
 *     неоновий плінтус. Інші файли додають свої тіні й патьоки в NX.rwing.shades / drips.
 *   ПІДЛОГА під крилом (x 887.5..1536, 330..368) — глянцева, з плиткою й калюжами світла (wing_floor.js).
 *   ДВОТАВРОВА КОЛОНА (x 1134..1158) — на ній база робота-маніпулятора майстерні (workshop.js),
 *     рожева неонова смуга, табличка з болтами, жовто-чорна смуга внизу.
 *   СТІЙКА З ІНДИКАТОРАМИ праворуч від екрана NEXORA AI (x 1090..1108) — вікна-іконки й LED.
 *   ТРУБИ: горизонтальна за маніпулятором, стояк над інструментами, кабель-канал.
 *   АНТРЕСОЛЬ — балкон уздовж стіни над інструментами й порталом (x 1160.., лицьова грань y 44..60),
 *     коробкою в перспективі кімнати (NX.persp, точка сходу 774, 220): видно лицьову грань (рожевий неон
 *     зверху, панелі з болтами, блакитний LED знизу), спід із балками й точковими світильниками (він вище
 *     очей — видно знизу, тікає до вікна) і лівий торець, що тікає до вікна; поруччя з балясинами (і вздовж
 *     торця), дві колони-опори (над інструментами й над порталом; низ ховається за ними), стовпчик з
 *     лампою-кулею на лівому куті. На антресолі — рослини й штучки (видно над поруччям, низ ховає лицьова
 *     грань), ліани звисають з її краю, під нею — підвісний ліхтар (objects/rwing_plants.js).
 * NX.rwing.patch() — нерухома копія всього крила для передньої підлоги-дзеркала (NX.room.patchFront)
 * і СЯЙВА (bloom) — як NX.wing.patch() лівого крила; сяйво запікається в ЗЛИТТЯ нерухомого (див. compose).
 * Растри: стіна й підлога 2 px/од., меблі й антресоль 4 px/од.; будуються раз, кешуються під екран.
 * ========================================================================== */
(() => {
  const P = NX.px, F = NX.furn, K = NX.kit, PZ = NX.persp, { NAVY, PINK, CYAN, CHROME, OUT } = F.PAL, ramp = F.ramp, hash = NX.art.hash, rgba = K.rgba, lit = K.lit;
  const X0 = 887.5, WX0 = 970, WX1 = 1536, FLOOR = 338;                         // з X0 крило — кодом; стіна від відкосу (970) до краю; стик стіни з підлогою
  // антресоль у координатах світу (NX.persp): плита x XL..1600 (за правий край), y YT..YB (верх/низ лицьової грані), глибина 0..ZB (до стіни);
  // поручень RAIL, середній прут MID; колони [x0, x1] біля стіни; NEWEL — стовпчик з лампою на лівому куті
  const MZ = { XL: 1160, XR: 1600, YT: 44, YB: 60, ZB: 36, RAIL: 31, MID: 37.6, POSTS: [[1180, 1192], [1386, 1400]], NEWEL: 1160 };
  const MET = ['#0a0820', '#141034', '#201a4a', '#2e2662', '#40367e', '#584ca0', '#7a70c0', '#a8a0e0'];   // фіолетова сталь (як труби лівого крила)
  const STEEL = ['#06051a', '#0c0a28', '#141038', '#1c164a', '#261e5e', '#322874', '#40348c', '#5244a6'];
  const PILLAR = { x0: 1134, x1: 1158 };                                         // колона з базою маніпулятора
  const RACK = { x0: 1090, x1: 1108, y0: 10, y1: 122 };                          // стійка з індикаторами
  const HUB = { x0: 974, y0: 12, x1: 1088, y1: 148 };                            // рамка екрана NEXORA AI (вміст — workshop.js)
  const PIPES = [{ x0: 1086, x1: 1134, y: 150, h: 4.4 }, { x0: 1158, x1: 1166, y: 150, h: 4.4 }];   // горизонтальна труба за маніпулятором
  const RISER = { x: 1316, w: 4.4, y0: 0, y1: 118 };                             // стояк над інструментами (до антресолі)
  const p = PZ.p, s = PZ.s;
  const mz = (x, y, z) => p(x, y, z);
  /** Світіння як NX.px.glow (колір у центрі -> прозоро на радіусі r, адитивно), але градієнт малюється в спрайт ОДИН раз
   *  для кольору — далі лише drawImage (P.glow створює градієнт щоразу; живих вогників у крилі десятки). */
  const GLOWS = new Map();
  function glow(c, x, y, r, col, a = 1) {
    if (a <= .01 || r <= 0) return; let sp = GLOWS.get(col);
    if (!sp) { sp = document.createElement('canvas'); sp.width = sp.height = 64; const x2 = sp.getContext('2d'), g = x2.createRadialGradient(32, 32, 0, 32, 32, 32); g.addColorStop(0, col); g.addColorStop(1, 'rgba(0,0,0,0)'); x2.fillStyle = g; x2.fillRect(0, 0, 64, 64); GLOWS.set(col, sp); }
    const op = c.globalCompositeOperation, ga = c.globalAlpha, sm = c.imageSmoothingEnabled;
    c.globalCompositeOperation = 'lighter'; c.globalAlpha = Math.min(1, a); c.imageSmoothingEnabled = true; c.drawImage(sp, x - r, y - r, r * 2, r * 2);
    c.globalCompositeOperation = op; c.globalAlpha = ga; c.imageSmoothingEnabled = sm;
  }

  // ---------- м'які тіні й патьоки на стіні (від того, що перед нею) ----------
  const OWN_SHADES = [
    { box: [HUB.x0, HUB.y0, HUB.x1, HUB.y1], dx: 3, dy: 3, r: 10, k: .5 }, { box: [RACK.x0, RACK.y0, RACK.x1, RACK.y1], dx: 2.5, dy: 2, r: 6, k: .45 },
    { box: [PILLAR.x0, 0, PILLAR.x1, FLOOR], dx: 4, dy: 0, r: 9, k: .5 },
    ...PIPES.map(q => ({ box: [q.x0, q.y, q.x1, q.y + q.h], dx: 1, dy: 2.2, r: 4, k: .5 })), { box: [RISER.x, RISER.y0, RISER.x + RISER.w, RISER.y1], dx: 2, dy: 1, r: 3.4, k: .45 },
  ];
  // тінь від антресолі: глибока смуга на стіні під її спідом + колони
  { const a = mz(MZ.XL, MZ.YB, MZ.ZB); OWN_SHADES.push({ under: [a[0] - 2, a[1] - 1, 1540, a[1] - 1], d: 46, k: .62 }); }
  MZ.POSTS.forEach(([a, b]) => { const q = mz(a, MZ.YB, MZ.ZB - 8), w = (b - a) * s(MZ.ZB - 8); OWN_SHADES.push({ box: [q[0], q[1], q[0] + w, FLOOR], dx: 3, dy: 0, r: 7, k: .45 }); });
  const OWN_DRIPS = [
    { x: 985, y: 148, len: 26, w: 1, k: .5, rust: 1 }, { x: 1078, y: 148, len: 18, w: .9, k: .45, rust: 1 }, { x: 1099, y: 122, len: 30, w: 1, k: .45 },
    { x: 1104, y: 154.4, len: 22, w: .9, k: .5, rust: 1 }, { x: 1126, y: 154.4, len: 14, w: .9, k: .45, rust: 1 }, { x: 1318, y: 118, len: 36, w: 1, k: .45, rust: 1 },
    { x: 1146, y: 6, len: 60, w: 1.4, k: .3 }, { x: 1530, y: 30, len: 90, w: 1.6, k: .3 }, { x: 1006, y: 4, len: 8, w: 1, k: .35 },
  ];
  for (let x = 1180; x < 1530; x += 52) { const a = mz(x, MZ.YB, MZ.ZB); OWN_DRIPS.push({ x: a[0] + 3, y: a[1] + 1, len: 14 + 16 * hash(x, 3), w: .9, k: .45, rust: hash(x, 5) > .5 ? 1 : 0 }); }
  // відсвіти на стіні: екрани, капсула, портал, ліхтарі, плінтус
  const LIGHTS = [
    { box: [HUB.x0 + 6, HUB.y0 + 6, HUB.x1 - 6, HUB.y1 - 6], r: 34, k: .26, col: '#2a78d8' },            // екран NEXORA AI — холодне світло
    { box: [962, 206, 1048, 318], r: 44, k: .32, col: '#c838a8' },                                        // скло сканера капсули — рожеве
    { box: [1176, 200, 1296, 300], r: 34, k: .24, col: '#1a8ab0' },                                       // плитки інструментів — блакитні
    { box: [1368, 168, 1492, 338], r: 56, k: .38, col: '#6a3ad8' }, { box: [1344, 104, 1516, 344], r: 26, k: .2, col: '#c838a8' },   // вихор порталу й рожевий кант рами
    { x: 1161, y: 240, r: 74, k: .52, col: '#c0602a' },                                                    // настінний ліхтар біля інструментів
    { x: 1420, y: 78, r: 84, k: .5, col: '#c0802a' },                                                      // золотий ліхтар над порталом
    { band: 1, x0: WX0, x1: WX1, y: 331, r: 42, k: .3, col: '#b0348a' },                                   // неоновий плінтус
    { x: 1099, y: 66, r: 40, k: .2, col: '#c838a8' }, { x: 1112, y: 268, r: 44, k: .22, col: '#1a8ab0' },   // стійка з індикаторами, термінал
    { x: 1325, y: 300, r: 36, k: .2, col: '#1a8ab0' },                                                     // пульт порталу
  ];
  // плями світла від точкових світильників антресолі (на стіні під нею)
  const SPOTS = [1238, 1310, 1474];
  SPOTS.forEach(x => { const a = mz(x, MZ.YB, MZ.ZB / 2); LIGHTS.push({ x: a[0], y: a[1] + 34, r: 36, k: .24, col: '#c86a3a' }); });

  // ---------- стіна (2 px/од.) ----------
  function buildWall() {
    const S = F.Sheet(WX0, 0, WX1, FLOOR, .5);
    K.panels(S, [WX0, 0, WX1, FLOOR - 8], LIGHTS, { panel: { w: 34, h: 31, ox: WX0 + 2, oy: 1, bands: [5], rib: 3 }, shades: [...OWN_SHADES, ...NX.rwing.shades], drips: [...OWN_DRIPS, ...NX.rwing.drips], stains: .8, grime: { top: 18, right: 12 }, cracks: .06 });
    S.rect(WX0, FLOOR - 8, WX1, FLOOR, (u, v, i, j, X, Y) => { const k = Y - (FLOOR - 8); return k < 1 ? PINK[7] : k < 2 ? PINK[5] : k < 2.6 ? PINK[2] : ((X - WX0) % 23 < .7 ? '#05031a' : ramp(['#07041a', '#0d0828', '#140c36', '#1a1046'], .45 - k / 16, i, j)); });   // плінтус з неоном
    return S;
  }
  // ---------- підлога під крилом (2 px/од.) ----------
  function buildFloor() {
    const S = F.Sheet(X0, 330, WX1, 368, .5), FL = ['#07041a', '#0c0726', '#120b34', '#1a1046', '#231658', '#2e1c6c'];
    S.rect(X0, 330, WX1, 368, (u, v, i, j, X, Y) => {
      if (Y < (X < WX0 ? 341 : FLOOR)) return null;
      const st = hash(i >> 1, 5);
      if (st > .955) return (i >> 1) % 2 ? '#3a1e6e' : '#1c3a7a';                                               // вертикальні відблиски неону
      return ramp(FL, .22 + (Y - 336) / 32 * .25 + (st > .9 ? .25 : st > .8 ? .1 : 0), i, j, .12);
    });
    return S;
  }
  // ---------- меблі стіни (4 px/од.): колона, стійка з індикаторами, рамка екрана NEXORA AI, труби ----------
  function buildFurn() {
    const S = F.Sheet(970, -2, 1330, 340);
    // колона-двотавр: полиці (світла кромка), стінка з отворами, рожевий неон уздовж правої полиці, табличка з болтами, смуга «обережно»
    const { x0, x1 } = PILLAR, cxp = (x0 + x1) / 2;
    S.rect(x0, -2, x1, FLOOR, (u, v, i, j, X, Y) => {
      const e = X - x0, f = x1 - X;
      if (e < .6 || f < .6) return OUT;
      if (e < 4 || f < 4) { if (f < 4 && f > 2.6) return Y % 1 < .5 ? '#ff4fd8' : '#ffc2ec'; return ramp(STEEL, (e < 4 ? .62 - e * .06 : .4) + (e < 1.4 ? .2 : 0) - v * .15, i, j, .08); }   // полиці двотавра (права — з неоном)
      if (Y > FLOOR - 14) return ((X + Y) % 6 < 3) ? '#ffc93a' : '#1a1020';                                                                              // жовто-чорна смуга внизу
      const hy = ((Y - 18) % 46 + 46) % 46; if (hy > 30 && hy < 40 && Math.hypot(X - cxp, hy - 35) < 4.2) return Math.hypot(X - cxp, hy - 35) < 3.4 ? '#04020e' : STEEL[5];   // отвори в стінці
      return ramp(STEEL, .32 - Math.abs(X - cxp) * .02 - v * .1, i, j, .1);
    });
    [[x0 + 4, 86, x1 - 4, 100], [x0 + 4, 196, x1 - 4, 210]].forEach(([a, b, c2, d]) => { S.rr(a, b, c2, d, .8, (dd, uu, vv, i, j) => dd < .4 ? OUT : vv < .2 ? STEEL[7] : ramp(STEEL, .55 - vv * .3, i, j)); [[a + 2, b + 2], [c2 - 2, b + 2], [a + 2, d - 2], [c2 - 2, d - 2]].forEach(([bx, by]) => S.rr(bx - .7, by - .7, bx + .7, by + .7, .7, (dd, uu, vv) => dd < .25 ? OUT : uu < .5 && vv < .5 ? CHROME[4] : CHROME[2])); });   // накладки з болтами
    // стійка з індикаторами (праворуч від екрана NEXORA AI): корпус, 6 віконець-іконок, вентиляція внизу
    const R = RACK;
    S.rr(R.x0, R.y0, R.x1, R.y1, 1.5, (d, u, v, i, j, X, Y) => {
      if (d < .6) return OUT; if (d < 1.6) return ramp(STEEL, .7 - v * .3, i, j);
      if (Y > R.y1 - 16) return (Y | 0) % 2 ? STEEL[0] : STEEL[3];
      return ramp(STEEL, .25 - v * .1, i, j, .08);
    });
    for (let k = 0; k < 6; k++) { const y = R.y0 + 5 + k * 15; S.rr(R.x0 + 3.5, y, R.x1 - 3.5, y + 11, 1.2, (d) => d < .5 ? '#3a0a3a' : d < 1.1 ? '#a0288d' : '#14061e'); }
    // рамка екрана NEXORA AI: товста, темна, з блакитним кантом; кріплення до стіни (вміст екрана — живий, workshop.js)
    const H = HUB;
    S.rr(H.x0, H.y0, H.x1, H.y1, 3, (d, u, v, i, j) => d < .6 ? OUT : d < 1.4 ? CYAN[2] : d < 2.2 ? CYAN[4] : d < 3 ? CYAN[1] : d < 5 ? ramp(STEEL, .5 - v * .3, i, j) : '#040826');
    [[H.x0 + 18, H.y1], [H.x1 - 18, H.y1]].forEach(([bx, by]) => S.poly([[bx - 5, by - .5], [bx + 5, by - .5], [bx + 3, by + 6], [bx - 3, by + 6]], (u, v, i, j) => ramp(CHROME, .65 - v * .4, i, j)));   // кронштейни знизу
    [[H.x0 + 18, H.y0], [H.x1 - 18, H.y0]].forEach(([bx, by]) => S.rect(bx - 1.2, -2, bx + 1.2, by + .5, (u) => u < .3 ? CHROME[4] : CHROME[2]));                                     // тяги до стелі
    // труби: горизонтальна за маніпулятором (фланці з рожевим неоном), стояк над інструментами
    PIPES.forEach(q => { S.rect(q.x0, q.y, q.x1, q.y + q.h, (u, v, i, j, X) => { const fl = [1098, 1122, 1162].some(f => Math.abs(X - f) < 1.6); if (fl) return v < .14 || v > .86 ? OUT : (v > .4 && v < .6 ? '#ff4fd8' : ramp(MET, .7 - v * .4, i, j)); return v < .1 || v > .9 ? OUT : ramp(MET, .78 - Math.abs(v - .3) * 1.4, i, j, .06); }); });
    S.rect(RISER.x, RISER.y0 - 2, RISER.x + RISER.w, RISER.y1, (u, v, i, j, X, Y) => { const ring = [28, 76].some(y => Math.abs(Y - y) < 1.5); return u < .1 || u > .9 ? OUT : ring ? (Math.abs(u - .5) < .3 && Math.abs(((Y - 28) % 48) - 0) < .5 ? '#3be8ff' : ramp(CHROME, .7 - u * .5, i, j)) : ramp(MET, .78 - Math.abs(u - .3) * 1.4, i, j, .06); });
    return S;
  }

  // ---------- АНТРЕСОЛЬ (4 px/од.): лицьова грань, спід, торець, поруччя, колони ----------
  /** Чотирикутник у вертикальній площині x = const (торець): глибина za..zb, висота ya..yb (світ) -> 4 точки кімнати. */
  const sideQ = (x, za, zb, ya, yb) => [mz(x, ya, za), mz(x, ya, zb), mz(x, yb, zb), mz(x, yb, za)];
  function buildMezz() {
    const S = F.Sheet(1124, 22, 1536, 178), { XL, XR, YT, YB, ZB } = MZ, Lx = PZ.p(XL, 0, ZB)[0];
    // колони-опори біля стіни: двотавр зі світлою полицею й рожевою смугою; низ ховається за дошкою інструментів / порталом
    MZ.POSTS.forEach(([a, b]) => PZ.box(S.r, S.x0, S.y0, S.U, { x0: a, x1: b, y0: YB, y1: 368, z0: ZB - 8, z1: ZB - 2 }, {
      front: (u, v, i, j) => u < .08 || u > .92 ? OUT : u < .24 ? ramp(STEEL, .64 - v * .25, i, j) : u > .76 ? (u > .8 && u < .88 ? '#ff4fd8' : ramp(STEEL, .42 - v * .2, i, j)) : ramp(STEEL, .3 - v * .14, i, j, .08),
      left: (u, v, i, j) => ramp(STEEL, .2 - v * .1, i, j),
    }));
    PZ.box(S.r, S.x0, S.y0, S.U, { x0: XL, x1: XR, y0: YT, y1: YB, z0: 0, z1: ZB }, {
      front: (u, v, i, j, X) => {                                                                             // лицьова грань: рожевий неон зверху, панелі з болтами, блакитний LED знизу
        const x = XL + u * (XR - XL), sx = ((x - XL - 2) % 46 + 46) % 46;
        if (v < .05) return CHROME[4]; if (v < .1) return OUT; if (v < .2) return v < .15 ? '#ffc2ec' : '#ff4fd8'; if (v < .25) return '#2a0a2e';
        if (v > .93) return OUT; if (v > .82) return v > .87 ? '#9af6ff' : '#3be8ff'; if (v > .78) return '#06102e';
        if (sx < .7) return '#05031a'; if (sx < 1.6) return MET[5];
        if ((Math.abs(sx - 4.5) < .7 || Math.abs(sx - 41.5) < .7) && Math.abs(v - .5) < .08) return CHROME[3];   // болти
        if (sx > 16 && sx < 30 && v > .38 && v < .64) return ((x * 2) | 0) % 2 ? MET[1] : MET[3];                 // вентиляційна ґратка
        return ramp(MET, .58 - (v - .25) * .7 + (sx < 5 ? .06 : 0), i, j, .08);
      },
      bottom: (u, v, i, j) => { const x = XL + u * (XR - XL), bx = ((x - XL) % 30 + 30) % 30; if (v > .94) return STEEL[0]; if (bx < 2.2) return bx < .7 ? STEEL[0] : ramp(STEEL, .5 - v * .2, i, j); if (v < .12) return v < .06 ? '#3be8ff' : '#0a2a4a'; return ramp(STEEL, .24 - v * .14, i, j, .08); },   // спід: балки поперек, LED по краю
      left: (u, v, i, j) => { if (v < .2 && v > .1) return u < .5 ? '#ff4fd8' : '#a0288d'; if (v > .82 && v < .93) return '#17709a'; if (v < .1 || v > .93) return OUT; return ramp(MET, .34 - u * .2 - v * .1, i, j, .08); },   // торець (тікає до вікна): неон загинається
    });
    return S;
  }
  /** Поруччя (окремий растр: штучки й рослини на антресолі стоять ЗА ним — малюється після них):
   *  балясини й поручень над лицьовою гранню і вздовж торця (тікає до вікна), стовпчик з лампою на лівому куті. */
  function buildRail() {
    const S = F.Sheet(1124, 22, 1540, 74), { XL, YT, ZB } = MZ;
    for (let x = XL + 4; x < 1540; x += 17) S.rect(x, MZ.RAIL, x + 1.1, YT, (u) => u < .45 ? CHROME[4] : CHROME[1]);
    S.rect(XL, MZ.MID - .55, 1540, MZ.MID + .55, (u, v) => v < .5 ? CHROME[3] : CHROME[1]);
    S.rect(XL - .4, MZ.RAIL - 1.2, 1540, MZ.RAIL + 1.2, (u, v, i, j) => v < .3 ? CHROME[5] : v < .65 ? ramp(CHROME, .55, i, j) : CHROME[1]);
    for (let z = 6; z < ZB - 2; z += 9) S.quad(sideQ(XL + .5, z, z + 1.6, MZ.RAIL, YT), (u, v, i, j) => u < .5 ? ramp(CHROME, .6 - v * .3, i, j) : CHROME[1]);
    S.quad(sideQ(XL + .5, 0, ZB, MZ.MID - .55, MZ.MID + .55), (u, v) => v < .5 ? CHROME[3] : CHROME[1]);
    S.quad(sideQ(XL + .2, 0, ZB, MZ.RAIL - 1.2, MZ.RAIL + 1.2), (u, v, i, j) => v < .3 ? CHROME[5] : v < .65 ? ramp(CHROME, .5, i, j) : CHROME[1]);
    // стовпчик на лівому куті (лампа-куля світить живим)
    PZ.box(S.r, S.x0, S.y0, S.U, { x0: XL - 1.6, x1: XL + 3, y0: MZ.RAIL - 5, y1: YT, z0: 0, z1: 3 }, {
      front: (u, v, i, j) => u < .12 || u > .88 ? OUT : v < .1 ? CHROME[4] : (Math.abs(v - .55) < .05 ? '#ff4fd8' : ramp(CHROME, .62 - u * .45, i, j)),
      left: (u, v, i, j) => ramp(STEEL, .4 - v * .1, i, j),
    });
    return S;
  }

  // ---------- живе ----------
  function rackLive(c, t) {
    const R = RACK, ICO = ['XX.XX', 'X.X.X', 'XXXXX', '.X.X.', 'X...X'];
    c.save(); c.globalCompositeOperation = 'lighter';
    for (let k = 0; k < 6; k++) {                                                                            // віконця: іконки по черзі спалахують рожевим
      const y = R.y0 + 5 + k * 15, on = (Math.floor(t * 1.3) + k * 2) % 6 < 2, a = on ? .9 : .35 + .1 * Math.sin(t * 2 + k);
      const g = [['.XXX.', 'X...X', 'X.X.X', 'X...X', '.XXX.'], ['XXXXX', 'X...X', 'XXXXX', 'X...X', 'XXXXX'], ['..X..', '.XXX.', 'XXXXX', '..X..', '..X..'], ['X...X', '.X.X.', '..X..', '.X.X.', 'X...X'], ['XXX..', 'X..X.', 'XXX..', 'X..X.', 'XXX..'], ICO][k];
      g.forEach((row, jj) => [...row].forEach((ch, ii) => ch === 'X' && lit(c, R.x0 + 6.4 + ii * 1.05, y + 3 + jj * 1.05, .9, .9, rgba(on ? '255,122,240' : '200,80,200', a))));
    }
    for (let k = 0; k < 4; k++) lit(c, R.x0 + 4 + k * 3, R.y1 - 20, 1.2, 1.2, hash(k, Math.floor(t * 3)) > .5 ? ['#3bff8a', '#3be8ff', '#ffe27a', '#ff4fd8'][k] : '#1a1030');
    c.restore();
  }
  function mezzLive(c, t) {
    const { XL, YT, YB, ZB } = MZ;
    c.save(); c.globalCompositeOperation = 'lighter';
    // блакитний LED по низу лицьової грані — дихає, по ньому біжить світлий імпульс
    const ph = (t * .08) % 1, xa = XL + ph * 400; c.fillStyle = rgba('150,240,255', .5); c.fillRect(xa - 26, YB - 2.6, 52, 1.6);
    c.fillStyle = rgba('59,232,255', .12 + .05 * Math.sin(t * 1.6)); c.fillRect(XL, YB - 3, 1536 - XL, 2.4);
    // рожевий неон угорі — «дихання»
    c.fillStyle = rgba('255,79,216', .18 + .08 * Math.sin(t * 1.4)); c.fillRect(XL, YT + 1.6, 1536 - XL, 1.6);
    // точкові світильники на споді
    SPOTS.forEach((x, n) => { const [px, py] = mz(x, YB, ZB / 2), f = .82 + .18 * Math.sin(t * 5.3 + n * 2) * Math.sin(t * 1.7 + n); lit(c, px - 2.4, py - .5, 4.8, 1.1, rgba('255,220,160', .9 * f)); glow(c, px, py + 1, 10, 'rgba(255,190,120,.9)', .3 * f); });
    // лампа-куля на стовпчику
    const [nx, ny] = mz(XL + .7, MZ.RAIL - 6.6, 1.5); glow(c, nx, ny, 10, 'rgba(255,150,236,.9)', .35 + .1 * Math.sin(t * 2.2)); lit(c, nx - 1.3, ny - 1.3, 2.6, 2.6, '#ffd4ff');
    c.restore();
  }
  function wallLive(c, t) {
    c.save(); c.globalCompositeOperation = 'lighter';
    c.fillStyle = rgba('255,79,216', .2 + .1 * Math.sin(t * 1.3)); c.fillRect(PILLAR.x1 - 4, -2, 1.4, FLOOR - 16);          // неон колони дихає
    c.fillStyle = rgba('255,79,216', .16 + .08 * Math.sin(t * 1.1 + 1)); c.fillRect(WX0, FLOOR - 8, WX1 - WX0, 2);          // неон плінтуса
    [1098, 1122, 1162].forEach((x, n) => glow(c, x, 152.2, 4, 'rgba(255,79,216,.9)', .14 + .06 * Math.sin(t * 2 + n)));   // фланці труби
    c.restore();
    rackLive(c, t);
  }

  let WALL = null, FLR = null, FURN = null, MEZZ = null, RAIL = null;
  function ensure() {
    if (WALL) return;
    WALL = buildWall(); WALL.cv = WALL.canvas(null); FLR = buildFloor(); FLR.cv = FLR.canvas(null); if (NX.rwing.floorFx) NX.rwing.floorFx(FLR);
    FURN = buildFurn(); FURN.cv = FURN.canvas(); MEZZ = buildMezz(); MEZZ.cv = MEZZ.canvas(); RAIL = buildRail(); RAIL.cv = RAIL.canvas();
  }
  /* ЗЛИТТЯ НЕРУХОМОГО: усі нерухомі растри крила (стіна, підлога, меблі стіни, антресоль, растри зон — у порядку z) зливаються
   * ОДИН раз в одне полотно точно під масштаб екрана; щокадру — один drawImage замість десятка великих, що перекриваються
   * (на телефоні це головне). Живе (екрани, скло сканера, вихор, неон, рослини, маніпулятор) малюється поверх.
   * Зони реєструють свої растри: NX.rwing.static(z, () => Sheet). Перебудова — при зміні масштабу або RW.ver (запікання підлоги). */
  const CX0 = 884, CY0 = -4, CX1 = WX1, CY1 = 360, STATICS = [];
  let COMP = null, CK = 0, CV = -1;
  function compose(Rd) {
    const w = Math.round((CX1 - CX0) * Rd), h = Math.round((CY1 - CY0) * Rd), cv = COMP && COMP.width === w && COMP.height === h ? COMP : document.createElement('canvas'); cv.width = w; cv.height = h;
    const c = cv.getContext('2d'), R = F.res(); c.setTransform(Rd, 0, 0, Rd, -CX0 * Rd, -CY0 * Rd);
    STATICS.sort((a, b) => a.z - b.z).forEach(st => { const S = st.get(); if (S && S.cv) K.draw(c, S, S.U >= .5 ? Math.min(2, R) : R); });
    const B = NX.rwing.bloom;                                                         // СЯЙВО (bloom) — запечене в злиття: ореоли навколо неону, екранів, ліхтарів
    if (B) { c.save(); c.beginPath(); c.rect(CX0, CY0, CX1 - CX0, CY1 - CY0); c.clip(); c.globalCompositeOperation = 'lighter'; c.imageSmoothingEnabled = true; c.imageSmoothingQuality = 'high'; c.drawImage(B.cv, B.x, 0, B.w, NX.cfg.ROOM_H); c.restore(); }
    COMP = cv;
  }
  NX.rwing = { X0, WX0, WX1, FLOOR, MZ, HUB, PILLAR, RACK, SPOTS, sideQ, mz, glow, shades: [], drips: [], bloom: null, items: [], reflectors: [],
    floor: () => FLR,                                                                 // растр підлоги під крилом (rwing_floor.js запікає в нього віддзеркалення)
    ver: 0,                                                                           // зміна нерухомого (запікання підлоги) -> злиття перебудовується
    static(z, get) { STATICS.push({ z, get }); },
    /** Нерухома копія крила (місто за склом, рама вікна, стіна, зони, рослини) -> передня підлога-дзеркало й сяйво. */
    patch() {
      this.patched = true; this.patching = true; const img = NX.room.img, RS = NX.room.RS, cv = document.createElement('canvas'); cv.width = img.naturalWidth; cv.height = img.naturalHeight; const x = cv.getContext('2d'), t = NX.time;
      x.imageSmoothingEnabled = true; x.drawImage(img, 0, 0); x.save(); x.scale(RS, RS);
      if (NX.city && NX.city.paint) NX.city.paint(x, t, 'patch', RS);
      if (NX.objects.windowFrame) NX.objects.windowFrame.drawBack(x, t);
      Object.values(NX.objects).forEach(o => { if (o.rw && o.drawBack && o.id !== 'rwingGlow') o.drawBack(x, t); });
      if (NX.objects.plant && NX.objects.plant.drawBack) NX.objects.plant.drawBack(x, t);          // рослина біля дивану стоїть перед машинерією
      const L = []; Object.values(NX.objects).forEach(o => { if (o.rw && o.layers) L.push(...o.layers(t)); });
      L.filter(Boolean).sort((a, b) => a.y - b.y).forEach(l => l.draw(x, t));
      x.restore(); this.patching = false; NX.room.patchFront(cv, 891, WX1);
      // СЯЙВО: яскраві пікселі копії -> 3 масштаби розмиття (як у лівого крила, wing_wall.js)
      try {
        const bw = Math.round(cv.width / 8), bh = Math.round(cv.height / 8), b1 = document.createElement('canvas'); b1.width = bw; b1.height = bh;
        const bx = b1.getContext('2d', { willReadFrequently: true }); bx.imageSmoothingEnabled = true; bx.drawImage(cv, 0, 0, bw, bh);
        const im = bx.getImageData(0, 0, bw, bh), d = im.data;
        for (let i = 0; i < d.length; i += 4) { const m = Math.max(d[i], d[i + 1], d[i + 2]), k = Math.max(0, (m - 125) / 130); d[i] *= k; d[i + 1] *= k; d[i + 2] *= k; }
        bx.putImageData(im, 0, 0); bx.clearRect(0, 0, Math.round(X0 * RS / 8), bh);
        const down = (src, f) => { const o = document.createElement('canvas'); o.width = Math.max(1, Math.round(src.width / f)); o.height = Math.max(1, Math.round(src.height / f)); const ox = o.getContext('2d'); ox.imageSmoothingEnabled = true; ox.drawImage(src, 0, 0, o.width, o.height); return o; };
        const b2 = down(b1, 2), b3 = down(b2, 2);
        // три масштаби змішуємо ОДИН раз в одне полотно (лише праве крило) — щокадру один drawImage, а не три на весь екран
        const sx = Math.floor(X0 * RS / 8), m = document.createElement('canvas'); m.width = bw - sx; m.height = bh; const mx = m.getContext('2d'); mx.imageSmoothingEnabled = true; mx.globalCompositeOperation = 'lighter';
        [[b1, .1], [b2, .2], [b3, .3]].forEach(([b, k]) => { mx.globalAlpha = k; mx.drawImage(b, sx * b.width / bw, 0, (bw - sx) * b.width / bw, b.height, 0, 0, m.width, bh); });
        this.bloom = { cv: m, x: sx * 8 / RS, w: (bw - sx) * 8 / RS }; this.ver++;          // злиття перебудується вже зі сяйвом
      } catch (e) { this.bloom = null; }
    },
  };
  NX.i18n.onLang(() => { if (NX.rwing.patched) setTimeout(() => NX.rwing.patch(), 350); });   // віддзеркалення вивісок — новою мовою
  NX.addObject({
    id: 'rwingBack', rw: true, fr: 0, span: [884, 1536],
    drawBack(c, t) {
      ensure();
      c.save();
      if (NX.rwing.patching) {                                                        // нерухома копія: по растру (підлога — без плитки, калюж і відбиттів)
        const R = F.res(); STATICS.sort((a, b) => a.z - b.z).forEach(st => { let S = st.get(); if (S === FLR && FLR.base) S = { ...FLR, cv: FLR.base }; if (S && S.cv) K.draw(c, S, S.U >= .5 ? Math.min(2, R) : R); });
      } else {
        const Rd = Math.min(4, Math.round(NX.cam.k * (NX.loop.dpr || 1) * 100) / 100);
        if (!COMP || CK !== Rd || CV !== NX.rwing.ver) { compose(Rd); CK = Rd; CV = NX.rwing.ver; }
        c.imageSmoothingEnabled = false; c.drawImage(COMP, CX0, CY0, CX1 - CX0, CY1 - CY0);   // точно під масштаб екрана — 1:1, без згладжування
      }
      wallLive(c, t);
      c.restore();
    },
    /** Нерухома копія крила — щойно завантажились картинка й шрифт (у update: не залежить від того, чи видно крило на екрані). */
    update() { if (++this.fr > 8 && !NX.rwing.patched && NX.room.img.naturalWidth && NX.room.front && (!document.fonts || document.fonts.status === 'loaded')) NX.rwing.patch(); },
  });
  /** Антресоль: сама плита — у злитті (вище); штучки й рослини на ній (NX.rwing.items) малюються над лицьовою гранню (обрізані
   *  по її верхньому краю — низ «ховається» за нею), поверх — поруччя (вони стоять за ним), далі — живий неон і світильники. */
  NX.addObject({
    id: 'rwingMezz', rw: true, span: [1120, 1536],
    drawBack(c, t) {
      if (!RAIL) return;
      c.save(); c.beginPath(); c.rect(1120, -60, 420, MZ.YT + 60.4); c.clip(); NX.rwing.items.forEach(f => f(c, t)); c.restore();
      c.save(); K.draw(c, RAIL, F.res()); mezzLive(c, t); c.restore();
    },
  });
  // нерухоме крила в злиття: стіна (0), підлога (1), меблі стіни (2), антресоль з колонами (10); зони — 30.. (workshop / tools / portal)
  NX.rwing.static(0, () => (ensure(), WALL)); NX.rwing.static(1, () => FLR); NX.rwing.static(2, () => FURN); NX.rwing.static(10, () => MEZZ);
})();

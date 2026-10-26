/* ============================================================================
 * objects/ai_center.js — AI-ЦЕНТР: великий екран, стіл, голо-монітор, ноутбуки
 * ----------------------------------------------------------------------------
 * Перша зона лівого крила (x 22..326). Усе намальоване кодом поверх стіни
 * (objects/wing_wall.js), з одних деталей (objects/wing_kit.js):
 *   ВЕЛИКИЙ ЕКРАН "AI-ЦЕНТР" — ПЛОСКА ГОЛОГРАМА (власник: «зроби плоским і трохи
 *       голографічним, бо на ньому в кутках якісь білі штуки»): тонкий плаский рожевий
 *       кант + блакитний обідок, напівпрозоре скло зі скан-лініями (крізь нього ледь
 *       видно цеглу), висить над плитою — знизу світить проектор. Нахил стіни (лівий
 *       край вищий, правий сходиться до вікна). Пласка картинка 640×960 (шапка з
 *       годинником, LED-графік, рожевий графік, нейро-мозок, іконки, "Задачі Nexi",
 *       еквалайзер) кладеться стовпчиками в перспективу (NX.furn.warp).
 *   2 ВЕРХНІ ЕКРАНИ на стіні над ним — мережа (NET) і журнал (LOG), той самий нахил.
 *   СТІЛ — рожева неонова плита 294..308 (x 22..326, до стику з аналітикою),
 *       видимий верх, корпус до підлоги: опора-рама, тумба з шухлядами, ніші,
 *       шафка AI-ядра з вентилятором, опора. Рослини стоять ПЕРЕД столом
 *       (objects/wing_plants.js), куток Рудика — окремо нижче (cat_corner.js).
 *   НА СТОЛІ — плоский голо-монітор зліва (KPI), голо-ноутбук чату (рожевий),
 *       головний голо-ноутбук (блакитний, тут друкує Nexi), горнятко, лампа;
 *       дрібниці (ITEMS, objects/wing_trinkets.js): папери з ручкою, склянка з
 *       ручками, блок стікерів, мишка на RGB-килимку, навушники на підставці;
 *       стікери на правій рамці великого екрана (NOTES).
 * Nexi: POI.aiDesk.top = [228, 292] — стоїть на плиті між ноутбуком і горнятком.
 * Тап по мозку — спалах думки; тап по зоні — Nexi сам бере наступну задачу.
 * РЕАКЦІЯ НА NEXI (пункт №8, objects/wing_react.js): поки Nexi на плиті, лампа горить (клацає,
 *       світить униз-ліворуч), кубик-колонка грає (еквалайзер, хвилі, ноти; великий екран — у такт),
 *       Рудик застрибує й гріється під лампою праворуч від Nexi. Без Nexi лампа вимкнена.
 * ========================================================================== */
(() => {
  const P = NX.px, F = NX.furn, K = NX.kit, RE = NX.wing.react, { Raster, outline, bump, hash, BAYER } = NX.art, { NAVY, PINK, CYAN, CHROME, OUT } = F.PAL;
  const rgba = K.rgba, lit = K.lit, noise = K.noise, ramp = F.ramp;
  const KP = ['#3a0b38', '#58134f', '#7a1c6d', '#a0288d', '#c63aa8', '#e656c0', '#ff84d4', '#ffc2ec'];   // рожевий неон рамки
  const D = ['#07041a', '#0d0828', '#140c36', '#1c1146', '#251758', '#301e6c', '#3d2784', '#4d33a0'];
  const G = ['#0a1d58', '#0d266c', '#113082', '#153c9a', '#1a48b0'], CY = CYAN, MB = ['#0b0920', '#141030', '#1e1940', '#2a2454', '#38316a', '#4c4486', '#6a62a8'];
  const C = { panel: '#0c2a78', pb: '#4a9af0' };

  // ---------- геометрія (одиниці кімнати) ----------
  // №3: верх стільниці ширший — передній край опущено (294 -> 298), речі стоять на 294, тож перед ними видно глянець;
  // refl — віддзеркалення рожевої рамки й синього скла великого екрана та голо-монітора; under — кабелі за столом у нішах
  const DESK = { l: 22, r: 326, top: 298, slab: 308, bot: 362, back: 289, end: 'none',
    refl: [[64, 236, '#3a6ad0', .3], [96, 204, '#a03a9a', .12], [26, 60, '#3a78e0', .3], [262, 318, '#5a2a9a', .2]],
    under: [{ tray: [55, 93], drops: [60, 84], strip: [64, 90] }, { tray: [153, 233], drops: [166, 214] }],
    sec: [{ a: 26, b: 52, kind: 'leg' }, { a: 96, b: 150, kind: 'drawers', rows: 3 }, { a: 236, b: 292, kind: 'core' }, { a: 304, b: 324, kind: 'leg' }] };
  const tilt = x => (x - 64) * .105;                                                   // нахил стіни: усе на ній іде вниз праворуч
  const BIGQ = [[64, 44], [236, 44 + tilt(236)], [236, 271], [64, 282.5]];          // низ піднято: голограма висить над плитою, під нею — промінь проектора
  const UPQ = { net: [[60, 7.6], [124, 7.6 + tilt(124) - tilt(60)], [124, 42.3], [60, 35.6]], log: [[132, 15.1], [196, 15.1 + tilt(196) - tilt(132)], [196, 49.9], [132, 43.1]] };
  const STAND = [136, 164];                                                            // проектор голограми на плиті
  const HOLOQ = [[26, 236], [60, 239], [60, 288], [26, 290]];
  const LP1 = { q: [[182, 258], [214, 259.5], [214, 288], [182, 289]], base: [178, 218], neon: ['#3be8ff', '#2aa6c8'], rgb: '90,232,255' };
  const LP2 = { q: [[112, 262], [142, 263.5], [142, 288], [112, 289]], base: [108, 146], neon: ['#ff4fd8', '#c63aa8'], rgb: '255,120,230' };
  const MUG = [246, 283, 254, 294], LAMP = { base: [282, 294], head: [294, 274, 308, 282] };   // лампа низенька — не лізе на стелаж позаду
  const SPK = { x0: 258, y0: 285, x1: 267, y1: 294, eq: [259.6, 286.8, 265.4, 292.2], cols: 3, rows: 3, col: '#7af0ff', waves: 1, notes: 1, seed: 1 };   // кубик-колонка: решітка = еквалайзер (№8)
  // №8: стіл реагує на Nexi (objects/wing_react.js) — Nexi на плиті (loc 'aiDesk'); Рудик сідає праворуч від нього, між кубиком-колонкою
  // і склянкою з сансев'єрою, просто під лампою (гріється); стрибає з підлоги перед шафкою AI-ядра; light — тепле світло лампи поверх кота
  RE.add('ai', { loc: 'aiDesk', cat: { x: 281.5, y: 294.8, from: [279, 382], face: -1, sy: 352 }, light: { y: 303.2, at: [285, 291, 20] } });
  // дрібниці на столі (objects/wing_trinkets.js): папери з ручкою, склянка з ручками, блок стікерів, мишка чат-ноутбука, навушники
  const ITEMS = [
    { kind: 'papers', x: 60.6, y: 294, w: 12, n: 4, seed: 3, pen: 1 }, { kind: 'pens', x: 74.6, y: 293.6 }, { kind: 'notes', x: 98.4, y: 293.8, col: 'y' },
    { kind: 'mouse', x: 146.8, y: 294, w: 15.4 }, { kind: 'headset', x: 164, y: 293.6 },
  ];
  // стікери на стіні праворуч від екрана (на голограму їх не приліпиш): між краєм екрана і блакитною трубкою
  const NOTES = [{ x: 239.6, y: 247.5, s: 4.8, col: 'y', rot: -.12, seed: 1 }, { x: 239.2, y: 254.6, s: 4.4, col: 'c', rot: .14, seed: 4 }];

  // ---------- стіл + речі на ньому (растр 4 px/од.) ----------
  function buildDesk() {
    const S = F.Sheet(DESK.l - 2, 250, DESK.r + 2, DESK.bot + 1);
    K.desk(S, DESK);
    K.trinkets(S, DESK, ITEMS, 'shadow');                                             // тіні дрібниць — до знімка верху (глянець їх не віддзеркалює)
    // тіні контакту під усім, що стоїть на столі (№1): голо-монітор, рамка, бази ноутбуків, підставка екрана, горнятко, кубик, лампа, вазон
    K.contacts(S, DESK, [[30, 56, 294], [84, 96, 293.2], [108, 146, 294, .6], [178, 218, 294, .6], [STAND[0], STAND[1], 290.6, .7], [MUG[0], MUG[2] + 2, 294], [258, 267, 294], [LAMP.base[0], LAMP.base[0] + 12, 294], [303, 313, 294]]);
    const base = K.snap(S);                                                           // верх з тінями — далі все, що відрізняється, віддзеркалиться в глянці
    // голо-монітор: хромована основа + стійка-проектор
    S.rr(30, 290, 56, 294, 1.2, (d, u, v, i, j) => d < .4 ? OUT : ramp(CHROME, .85 - v * .5, i, j));
    S.rect(41, 286, 45, 290, (u, v, i, j) => ramp(CHROME, .8 - Math.abs(u - .4), i, j));
    // бази голо-ноутбуків: тонка пластина з неоновим краєм і проекцією клавіатури
    for (const L of [LP2, LP1]) { const [a, b] = L.base;
      S.rect(a, 289, b, 294, (u, v, i, j) => { if (u > .985 || u < .015 || v > .96) return OUT; if (v < .14) return L.neon[0]; if (v < .5 && u > .1 && u < .9 && ((u * 14) % 1 < .18 || (v * 6) % 1 < .3)) return L.neon[1]; return ramp(CHROME, .55 + u * .2 - v * .3, i, j); }); }
    // горнятко з парою (рожеве, з блакитною смужкою), лампа: основа, рука, абажур
    S.rr(MUG[0], MUG[1], MUG[2], MUG[3], [1, 1, 1.6, 1.6], (d, u, v) => d < .5 ? KP[1] : v > .4 && v < .56 ? CY[4] : (u > .7 ? KP[3] : KP[5]));
    S.rect(MUG[2] - .4, MUG[1] + 2.5, MUG[2] + 2.2, MUG[1] + 7, (u, v) => (u > .4 && v > .25 && v < .75) ? null : KP[3]);
    S.rr(LAMP.base[0], LAMP.base[1] - 3, LAMP.base[0] + 12, LAMP.base[1], 1.2, (d, u, v, i, j) => d < .4 ? OUT : ramp(CHROME, .85 - v * .5, i, j));
    S.line(LAMP.base[0] + 6, LAMP.base[1] - 3, LAMP.base[0] + 9, 284, OUT, 2.4); S.line(LAMP.base[0] + 6, LAMP.base[1] - 3, LAMP.base[0] + 9, 284, CHROME[3], 1.2);
    S.line(LAMP.base[0] + 9, 284, LAMP.head[0] + 6, LAMP.head[3] - 2, OUT, 2.4); S.line(LAMP.base[0] + 9, 284, LAMP.head[0] + 6, LAMP.head[3] - 2, CHROME[4], 1.2);
    S.rr(LAMP.head[0], LAMP.head[1], LAMP.head[2], LAMP.head[3], [3, 3, 1, 1], (d, u, v, i, j) => d < .5 ? OUT : v > .8 ? (u > .25 && u < .75 ? '#5a4462' : '#3c2a4a') : ramp(KP, .85 - v * .5 - u * .2, i, j));   // №8: розсіювач вимкненої лампи (світло — живим, lampLive)
    // дрібнички (як на картинці): кубик-колонка з решіткою, рамка з фото, кабелі до задньої кромки
    S.rr(258, 285, 267, 294, 1, (d, u, v, i, j) => d < .5 ? OUT : (u > .2 && u < .8 && v > .25 && v < .75 && ((u * 12) | 0) % 2 === 0 && ((v * 8) | 0) % 2 === 0) ? CYAN[3] : ramp(NAVY, .45 - v * .25, i, j));
    S.rr(84, 283, 96, 293, .8, (d, u, v, i, j) => d < .5 ? OUT : d < 1.2 ? CHROME[3] : ramp(['#2a1860', '#5a3aa0', '#ff84d4', '#ffe27a'], .3 + .7 * Math.abs(Math.sin(u * 7) * Math.cos(v * 5)), i, j));
    [[56, 292.6, 70, 289.8], [218, 292.6, 230, 289.8], [96, 292.4, 104, 289.8]].forEach(([a, b, c2, d]) => { S.line(a, b, c2, d, OUT, 1.1); S.line(a, b - .3, c2, d - .3, '#2a2454', .5); });
    K.trinkets(S, DESK, ITEMS, 'items');                                              // папери, ручки, стікери, мишка, навушники
    K.gloss(S, DESK, base, .42);                                                      // віддзеркалення речей у глянцевому верху (№3)
    [[[267.2, 292.8], [270, 291], [272, 289.6]], [[174.2, 293], [176.8, 291.6], [176.2, 289.6]]].forEach(p => K.wire(S, p));   // №3: кабелі кубика й навушників за задній край
    return S;
  }

  // ---------- великий екран (пласкі координати 640×960) ----------
  const BW = 640, BH = 960;
  const HD = { x: 64, y: 58, w: 512, h: 96 }, C1 = { x: 64, y: 170, w: 118, h: 222 }, C2 = { x: 64, y: 404, w: 118, h: 202 };   // шапка — вивіска K.sign (як у будок)
  const BR = { x: 192, y: 170, w: 298, h: 436 }, BC = [341, 392];
  const IC = { x: 500, y: 170, w: 76, h: 436 }, TK = { x: 192, y: 622, w: 384, h: 190 }, EQ = { x: 64, y: 826, w: 512, h: 66 };
  const ICONS = [
    ['.XXXXXXX.', 'X.......X', 'X.X.X.X.X', 'X.......X', '.XXXXXXX.', '..XX.....', '..X......'],
    ['XXXXXXXXX', 'XX.....XX', 'X.X...X.X', 'X..X.X..X', 'X...X...X', 'X.......X', 'XXXXXXXXX'],
    ['.XXXXX...', '.X...XX..', '.X.XX.XX.', '.X.....X.', '.X.XXX.X.', '.X.....X.', '.XXXXXXX.'],
    ['..XXXXX..', '.X.....X.', 'X...X...X', 'X..X.X..X', '.X.....X.', '..XXXXX..', '...XXX...'],
    ['........X', '.......X.', '..X...X..', '.X.X.X...', 'X...X....', '.........', 'XXXXXXXXX'],
  ];
  const dith = (i, j) => BAYER[(j & 3) * 4 + (i & 3)];
  const rampR = (pal, q, i, j, g = 0) => pal[P.clamp(Math.round(P.clamp(q, 0, 1) * (pal.length - 1) + dith(i, j) * .9 + (g ? (hash(i, j) - .5) * g : 0)), 0, pal.length - 1)];
  function rr(r, x0, y0, w, h, rad, fn) {
    for (let j = 0; j < h; j++) for (let i = 0; i < w; i++) {
      const qx = Math.abs(i + .5 - w / 2) - (w / 2 - rad), qy = Math.abs(j + .5 - h / 2) - (h / 2 - rad), sd = Math.min(Math.max(qx, qy), 0) + Math.hypot(Math.max(qx, 0), Math.max(qy, 0)) - rad;
      if (sd > 0) continue; const col = fn(-sd, (i + .5) / w, (j + .5) / h, x0 + i, y0 + j); if (col) r.set(x0 + i, y0 + j, col);
    }
  }
  const glass = (r, x, y, w, h, q0 = .6) => { for (let j = 0; j < h; j++) for (let i = 0; i < w; i++) r.set(x + i, y + j, j % 3 === 2 ? G[0] : rampR(G, q0 - j / h * .35, x + i, y + j)); };
  /** Панель на склі: трохи світліше скло без яскравих рамок (власник: прибрати "білі рамки"), лише тонка темна межа. */
  function panel(r, p) {
    r.rect(p.x, p.y, p.w, p.h, C.panel); for (let j = 1; j < p.h; j += 3) r.rect(p.x + 1, p.y + j, p.w - 2, 1, G[1]);
    r.rect(p.x, p.y, p.w, 1, '#0a1d58'); r.rect(p.x, p.y + p.h - 1, p.w, 1, '#0a1d58'); r.rect(p.x, p.y, 1, p.h, '#0a1d58'); r.rect(p.x + p.w - 1, p.y, 1, p.h, '#0a1d58');
    r.rect(p.x + 1, p.y + 1, p.w - 2, 1, '#1a4aa8');
  }
  const bitmap = (r, rows, x, y, s, col, hi) => rows.forEach((row, j) => [...row].forEach((ch, i) => { if (ch !== 'X') return; r.rect(x + i * s, y + j * s, s, s, col); if (hi) r.rect(x + i * s, y + j * s, s, 1, hi); }));
  const NEURONS = [], SYN = [];
  // ПЛОСКА ГОЛОГРАМА (власник: «зроби його плоским і трохи голографічним, бо там на ньому в кутках якісь білі штуки»).
  // Раніше — товста «надута» рожева рамка-трубка: її світла серцевина давала білі бліки в заокруглених кутах, а рамкою
  // бігала біла іскра. Тепер кант ПЛАСКИЙ і тонкий (рівний рожевий неон + блакитний обідок, без переливу й білого),
  // скло НАПІВПРОЗОРЕ: крізь нього ледь видно цеглу, кожен третій рядок (скан-лінія) прозоріший, від країв — холодне
  // сяйво, донизу світліше (проектор на плиті). Панелі на склі — теж трохи прозорі.
  const BEZ = 13, HG = ['#071a4c', '#0a2260', '#0c2c78', '#103892', '#1446aa', '#1a58c2', '#226cd6'];
  const RGB = {}, rgbOf = h => RGB[h] || (RGB[h] = [1, 3, 5].map(i => parseInt(h.slice(i, i + 2), 16)));
  /** Піксель з прозорістю A 0..255 (Raster.set кладе лише непрозорі). */
  const putA = (r, x, y, hex, A) => { if (x < 0 || y < 0 || x >= r.w || y >= r.h) return; const i = (y * r.w + x) * 4, c = rgbOf(hex); r.d[i] = c[0]; r.d[i + 1] = c[1]; r.d[i + 2] = c[2]; r.d[i + 3] = A; };
  /** Голо-панель: напівпрозора заливка зі скан-лініями, тонка темна межа, тьмяна верхня лінія (без яскравих рамок і дужок). */
  function holoPanel(r, p) {
    for (let j = 0; j < p.h; j++) for (let i = 0; i < p.w; i++) putA(r, p.x + i, p.y + j, j % 3 === 2 ? '#0a2266' : '#0d2d7e', j % 3 === 2 ? 196 : 226);
    r.rect(p.x, p.y + p.h - 1, p.w, 1, '#0a1d58'); r.rect(p.x, p.y, 1, p.h, '#0a1d58'); r.rect(p.x + p.w - 1, p.y, 1, p.h, '#0a1d58'); r.rect(p.x, p.y, p.w, 1, '#1a4aa8');
  }
  function buildBig() {
    const r = Raster(BW, BH);
    rr(r, 0, 0, BW, BH, 26, (d, u, v, i, j) => {
      if (d < 2) return '#14062a';                                                    // темний контур
      if (d < 5.6) return d > 3.1 && d < 4.3 ? '#ff84d4' : '#d04ab4';                 // ПЛАСКИЙ рожевий неон: рівний колір, без «надутого» переливу й білої серцевини
      if (d < 8) return '#0e0626';
      if (d < 9.6) return '#2aa6c8';                                                  // блакитний обідок скла
      if (d < BEZ) return '#0a2258';
      const e = Math.min(1, (d - BEZ) / 70), scan = j % 3 === 2, q = .24 + v * .26 + (1 - e) * .3 + (hash(i >> 3, j >> 3) - .5) * .05;   // скло: світліше донизу й біля країв
      putA(r, i, j, rampR(HG, scan ? q - .2 : q, i, j), scan ? 162 : Math.round(222 + (1 - e) * 28)); return null;   // трохи прозоре; скан-лінії прозоріші
    });
    [C1, C2, BR, TK].forEach(p => holoPanel(r, p));
    for (const p of [C1, C2]) { r.rect(p.x + 10, p.y + p.h - 24, p.w - 20, 2, CY[2]); for (let x = p.x + 10; x < p.x + p.w - 10; x += 12) r.rect(x, p.y + p.h - 22, 2, 4, CY[3]); for (let y = p.y + 50; y < p.y + p.h - 24; y += 30) for (let x = p.x + 10; x < p.x + p.w - 10; x += 4) r.set(x, y, '#2a5cc0'); }
    for (let k = 0; k < 5; k++) { const t = { x: IC.x, y: IC.y + k * 87.5 | 0, w: IC.w, h: 78 }; holoPanel(r, t); bitmap(r, ICONS[k], t.x + 11, t.y + 18, 6, CY[1], CY[2]); }
    buildBrain(r);
    r.rect(TK.x + 2, TK.y + 2, TK.w - 4, 34, '#1240a0'); r.rect(TK.x + 2, TK.y + 36, TK.w - 4, 1, '#1a4aa8');
    for (let j = 0; j < EQ.h; j++) for (let i = 0; i < EQ.w; i++) putA(r, EQ.x + i, EQ.y + j, '#0a2468', j % 3 === 2 ? 170 : 214);
    return r.canvas();
  }
  /** Піксельний мозок (вигляд збоку): звивини, борозни, мозочок, стовбур; нейрони — для анімації. */
  function buildBrain(r) {
    const S = 2.25, W = 300, H = 280, ox = BC[0] - 150, oy = BC[1] - 130, kind = new Uint8Array(W * H);   // мозок більший і по центру (як на картинці)
    for (let j = 0; j < H; j++) for (let i = 0; i < W; i++) {
      const x = (i - 150) / S, y = (j - 130) / S;
      const cer = (x / 66) ** 2 + ((y + 8) / 48) ** 2 <= 1 && y < 30 - Math.max(0, x) * .3 + Math.max(0, -x - 30) * .4, cbl = ((x - 34) / 26) ** 2 + ((y - 34) / 15) ** 2 <= 1, stem = y > 22 && y < 64 && x > 4 - (y - 22) * .2 && x < 20 - (y - 22) * .2;
      kind[j * W + i] = cer ? 1 : cbl ? 2 : stem ? 3 : 0;
    }
    const inside = (i, j) => i >= 0 && j >= 0 && i < W && j < H && kind[j * W + i];
    for (let j = 0; j < H; j++) for (let i = 0; i < W; i++) {
      const k = kind[j * W + i]; if (!k) continue;
      const X = ox + i, Y = oy + j, x = (i - 150) / S, y = (j - 130) / S;
      const e1 = !inside(i - 1, j) || !inside(i + 1, j) || !inside(i, j - 1) || !inside(i, j + 1), e2 = !inside(i - 2, j) || !inside(i + 2, j) || !inside(i, j - 2) || !inside(i, j + 2);
      if (e1) { r.set(X, Y, y < 0 && x < 20 ? CY[5] : CY[4]); continue; } if (e2) { r.set(X, Y, CY[2]); continue; }
      const dist = Math.hypot(x / 70, (y + 10) / 54);
      let col = rampR(['#0c2a74', '#10368c', '#1646a6', '#1c58be', '#256cd4', '#3384e8'], .9 - dist * .75 + (-x - y) / 260, X, Y);
      if (k === 1) {
        const f = Math.sin(x * .24 + 2.4 * Math.sin(y * .15 + x * .03)) + Math.sin(y * .21 + 1.9 * Math.sin(x * .12 - .7));
        if (Math.abs(f) < .15) { col = (y < -10 && x < 10) ? CY[5] : CY[3]; if (hash(X, Y) < .045) NEURONS.push([X, Y]); } else if (Math.abs(f) < .27) col = CY[1];
        if (Math.abs(y - (8 - x * .32 + Math.sin(x * .2) * 2)) < .8 && x > -30 && x < 40) col = CY[5];
        if (Math.abs(x + 4 + y * .12) < .55 && y < -10) col = CY[3];
      } else if (k === 2) col = (Math.floor(y * 1.2) % 3 === 0) ? CY[3] : rampR(['#10368c', '#1646a6', '#1c58be'], .6 - dist * .3, X, Y);
      else col = (Math.floor(x) % 4 === 0) ? CY[2] : '#16449a';
      r.set(X, Y, col);
    }
    for (let i = 0; i < 22; i++) { const a = NEURONS[(hash(i, 3) * NEURONS.length) | 0], b = NEURONS[(hash(i, 9) * NEURONS.length) | 0]; if (a && b && Math.hypot(a[0] - b[0], a[1] - b[1]) > 50) SYN.push([a, b, hash(i, 5)]); }
  }
  // ---------- верхні екрани: мережа і журнал (320×168) ----------
  const UW = 320, UH = 168, NODES = []; let NETL = null;
  function buildUpper(kind) {
    const r = Raster(UW, UH);
    rr(r, 0, 0, UW, UH, 16, (d, u, v, i, j) => d < 2 ? '#0a1838' : d < 9 ? rampR(CY.slice(0, 5), bump((d - 2) / 7) * (.8 - v * .3), i, j) : d < 15 ? rampR(MB, .45 - v * .3, i, j) : null);
    glass(r, 15, 15, UW - 30, UH - 30, .6); r.rect(20, 20, UW - 40, 22, '#0e3488'); r.rect(20, 42, UW - 40, 2, CY[2]);
    if (kind === 'net') {                                                               // мережа — окремим шаром NETL (екран по черзі показує мережу й карту, №6)
      const n2 = Raster(UW, UH);
      for (let k = 0; k < 9; k++) NODES.push([40 + hash(k, 1) * 240, 60 + hash(k, 2) * 84]);
      NODES.forEach((a, k) => { const b = NODES[(k + 3) % 9], c2 = NODES[(k + 1) % 9]; [b, c2].forEach(q => { const n = Math.max(Math.abs(q[0] - a[0]), Math.abs(q[1] - a[1])); for (let s = 0; s < n; s += 2) n2.set(a[0] + (q[0] - a[0]) * s / n, a[1] + (q[1] - a[1]) * s / n, CY[1]); }); });
      NODES.forEach(([x, y]) => rr(n2, x - 5, y - 5, 10, 10, 5, (d) => d < 1.5 ? CY[4] : CY[1]));
      NETL = n2.canvas();
    }
    return r.canvas();
  }

  /** ЛАМПА (№8): горить, лише коли Nexi за столом — L = NX.wing.react.lamp('ai') 0..1 (з «клацанням»). Світло — униз-ліворуч,
   *  туди, де гріється Рудик: конус з двох смуг (8-bit), калюжа на глянцевому верху, відблиск на губі скла, тепла пляма на
   *  стелажі, ореол абажура, лампочка. Вимкнена — темний розсіювач і черговий вогник на основі. Серпанок у повітрі — wing_air.js. */
  function lampLive(c, t, L) {
    const [h0, , h2, h3] = LAMP.head, bx = LAMP.base[0], by = LAMP.base[1], y1 = 296.6;
    lit(c, bx + 8.7, by - 2.3, .9, .8, L > .5 ? '#ffe27a' : rgba('255,90,150', .3 + .2 * Math.sin(t * 1.3)));   // вогник на основі: черговий / увімкнено
    if (L < .01) return;
    const f = L * (.97 + .03 * Math.sin(t * 9.3));
    c.save(); c.globalCompositeOperation = 'lighter';
    P.glow(c, h0 - 2, h3 + 4, 30, 'rgba(255,186,104,.85)', .18 * f);                                                         // тепла пляма на стелажі й стіні (під абажуром — щоб він лишався рожевим)
    c.fillStyle = rgba('255,210,140', .09 * f); c.beginPath(); c.moveTo(h0 + .8, h3); c.lineTo(h2 - .8, h3); c.lineTo(h2 - 2, y1); c.lineTo(266, y1); c.fill();   // конус: широка смуга
    c.fillStyle = rgba('255,230,170', .09 * f); c.beginPath(); c.moveTo(h0 + 3, h3); c.lineTo(h2 - 3, h3); c.lineTo(h2 - 6, y1); c.lineTo(275, y1); c.fill();     //        вузька, яскравіша
    for (let s = 0; s < 3; s++) lit(c, 268 + s * 2, 294.2 + s, 36 - s * 4, 1, rgba('255,206,130', (.2 - s * .045) * f));    // калюжа світла на глянці
    lit(c, 271, DESK.top - .5, 30, .45, rgba('255,226,160', .5 * f)); lit(c, 279, DESK.top - .5, 12, .45, rgba('255,250,225', .55 * f));   // відблиск на губі скла
    P.glow(c, h0 + 7, h3 + 1, 7, 'rgba(255,236,190,1)', .34 * f);                                                             // ореол під абажуром
    c.restore();
    c.save(); c.globalAlpha = Math.min(1, L * 1.25); lit(c, h0 + 1.8, h3 - 2.5, h2 - h0 - 3.6, .9, '#ff9ec8'); lit(c, h0 + 1.3, h3 - 1.55, h2 - h0 - 2.6, 1.35, '#ffe9b0'); lit(c, h0 + 3.2, h3 - 1.2, h2 - h0 - 6.4, .75, '#ffffff'); c.restore();   // засвічений край абажура, лампочка
  }

  let DSK, BIGS, UPAS, UPBS, BIGF, bf, UAF, uaf, UBF, ubf, MONF, mf, L1F, l1, L2F, l2, PROJ = null;
  /** Промінь проектора (рахується раз): контур від щілини до низу голограми й траєкторії іскорок. */
  function proj() {
    const [pa, pb] = STAND, H0 = F.homo(BIGQ), ybot = x => H0.fwd((x - 64) / 172, 1)[1], beam = new Path2D();
    beam.moveTo(pa + 2, 287.4); beam.lineTo(pb - 2, 287.4); beam.lineTo(pb + 14, ybot(pb + 14)); beam.lineTo(pa - 14, ybot(pa - 14)); beam.closePath();
    const sp = []; for (let k = 0; k < 6; k++) { const x0 = pa + 3 + k * (pb - pa - 6) / 5, x1 = x0 + (x0 - (pa + pb) / 2) * .9; sp.push([x0, x1, ybot(x1)]); }
    return { beam, sp, top: ybot(pa) };
  }
  const MW = 256, MH = 288, L1W = 128, L1H = 160, L2W = 112, L2H = 136;
  function init() {
    DSK = buildDesk(); DSK.cv = DSK.canvas(); BIGS = buildBig(); UPAS = buildUpper('net'); UPBS = buildUpper('log');
    [BIGF, bf] = F.canvas(BW, BH); [UAF, uaf] = F.canvas(UW, UH); [UBF, ubf] = F.canvas(UW, UH); [MONF, mf] = F.canvas(MW, MH); [L1F, l1] = F.canvas(L1W, L1H); [L2F, l2] = F.canvas(L2W, L2H);
  }

  const ai = NX.addObject({
    id: 'aiPc', name: 'obj.aiPc', act: 'ai',
    hit: { x: 22, y: 4, w: 300, h: 300 }, active: false, prog: 0, burst: 0, sweep: null, nextSweep: 4, fr: 0,
    DESK, BIGQ,
    onTap(x, y) {
      const [u, v] = F.homo(BIGQ).inv(x, y), fx = u * BW, fy = v * BH;
      if (fx > BR.x && fx < BR.x + BR.w && fy > BR.y && fy < BR.y + BR.h) { this.burst = 1; for (let i = 0; i < 14; i++) NX.fx.emit('spark', x + (Math.random() - .5) * 40, y + (Math.random() - .5) * 30, { col: Math.random() < .5 ? '#7af0ff' : '#ff7af0', vy: -20 - Math.random() * 30, g: 20, ttl: 1, s: 1.2 }); }
      return false;
    },
    update(dt, t) {
      this.burst = Math.max(0, this.burst - dt * .8);
      if (this.sweep === null && t > this.nextSweep) this.sweep = 0;
      if (this.sweep !== null && (this.sweep += dt / 1.4) >= 1) { this.sweep = null; this.nextSweep = t + 8 + Math.random() * 8; }
    },
    // ===================== живий великий екран =====================
    big(c, t, act) {
      c.globalCompositeOperation = 'source-over'; c.clearRect(0, 0, BW, BH); c.drawImage(BIGS, 0, 0);   // скло напівпрозоре — спершу чистимо
      K.sign(c, HD.x, HD.y, HD.w, HD.h, { acc: ['#0a2a4a', '#17709a', '#2aa6c8', '#3be8ff'], icon: 'ai', key: 'nav.ai', t, glow: '59,232,255' });   // вивіска в єдиному стилі з будками
      const d = new Date(), hm = String(d.getHours()).padStart(2, '0') + (d.getSeconds() % 2 ? ':' : ' ') + String(d.getMinutes()).padStart(2, '0');
      P.text(c, hm, EQ.x + EQ.w - 4, EQ.y - 4, '#3be8ff', 11, 'right'); lit(c, EQ.x + 2, EQ.y - 12, 8, 8, Math.sin(t * 4) > 0 ? '#3bff8a' : '#1f6a45'); P.text(c, NX.t('scene.ai.live'), EQ.x + 14, EQ.y - 4, '#a8c4ff', 10);
      c.globalCompositeOperation = 'lighter';
      const k1 = 1 + act * 1.5, base = C1.y + C1.h - 28, top = C1.y + 44;
      for (let i = 0; i < 11; i++) { const v = P.clamp(noise(t * k1, i) * (.8 + .3 * this.burst), .08, 1), segs = Math.round(v * (base - top) / 7); for (let s = 0; s < segs; s++) lit(c, C1.x + 11 + i * 9.4, base - 6 - s * 7, 7, 5, s === segs - 1 ? '#ffffff' : CY[2 + Math.min(3, (s / segs * 4) | 0)]); }
      P.text(c, Math.round(60 + 30 * noise(t * k1, 3)) + '%', C1.x + 12, C1.y + 30, '#9af6ff', 14);
      const b2 = C2.y + C2.h - 28, h2 = C2.h - 66;
      for (let x = 0; x < C2.w - 22; x += 2) { const v = P.clamp(.45 + .25 * Math.sin((x + t * 80 * k1) * .045) + .15 * Math.sin((x + t * 50 * k1) * .11) + .1 * this.burst, 0, 1), y = b2 - v * h2; c.fillStyle = 'rgba(217,75,255,.2)'; c.fillRect(C2.x + 11 + x, y, 2, b2 - y); lit(c, C2.x + 11 + x, y, 2, 3, '#ff84d4'); }
      P.text(c, '+' + Math.round(12 + 20 * noise(t * .3, 7)) + '%', C2.x + 12, C2.y + 30, '#ff9ae0', 14);
      const [cx, cy] = BC; P.glow(c, cx, cy - 6, 190, 'rgba(59,200,255,.75)', .2 + act * .25 + this.burst * .5 + .06 * Math.sin(t * 2));
      const n = 14 + Math.round(act * 26 + this.burst * 40);
      for (let i = 0; i < n; i++) { const q = NEURONS[(hash(i, Math.floor(t * (1.5 + act * 3) + i * .37)) * NEURONS.length) | 0]; if (!q) continue; lit(c, q[0] - 2, q[1] - 2, 4, 4, '#ffffff'); c.fillStyle = 'rgba(122,240,255,.55)'; c.fillRect(q[0] - 6, q[1] - .5, 12, 1.5); c.fillRect(q[0] - .5, q[1] - 6, 1.5, 12); }
      SYN.forEach(([a, b, h], i) => { const ph = (t * (.45 + h * .5 + act * .8) + h * 3) % 1.6; if (ph > 1) return; for (let k = 0; k < 5; k++) { const q = Math.max(0, ph - k * .03); c.fillStyle = k ? `rgba(154,246,255,${.55 - k * .1})` : (i % 3 ? '#9af6ff' : '#ff9ae0'); const s = k ? 3 : 5; c.fillRect(a[0] + (b[0] - a[0]) * q - s / 2, a[1] + (b[1] - a[1]) * q - s / 2, s, s); } });
      for (let k = 0; k < 3; k++) { const a = t * (.8 + act) + k * 2.094, x = cx + Math.cos(a) * 154, y = cy + 12 + Math.sin(a) * 26; if (Math.sin(a) < 0 && Math.abs(x - cx) < 124) continue; lit(c, x - 4, y - 4, 8, 8, k === 1 ? '#ff7af0' : '#7af0ff'); lit(c, x - 2, y - 2, 4, 4, '#ffffff'); }
      const sy = BR.y + 40 + ((t * .35) % 1) * (BR.h - 80); c.fillStyle = 'rgba(122,240,255,.14)'; c.fillRect(BR.x + 4, sy, BR.w - 8, 3);
      const lvl = this.active ? this.prog : .55 + .35 * noise(t * .4, 2), bx = BR.x + 24, by = BR.y + BR.h - 34, bw = BR.w - 48;
      lit(c, bx, by, bw, 8, '#0a1d40'); lit(c, bx, by, bw * lvl, 8, this.active ? '#3bff8a' : '#3be8ff'); lit(c, bx + bw * lvl - 3, by - 3, 5, 14, '#ffffff');
      P.text(c, NX.t('scene.ai.neuro') + ' ' + Math.round(lvl * 100) + '%', BR.x + 16, BR.y + 30, '#7af0ff', 14);
      const hl = act ? Math.floor(t * 3) % 2 : Math.floor(t * .7) % 5;
      for (let k = 0; k < 5; k++) { const y = IC.y + k * 87.5 | 0, onI = k === hl || (act && k < 2 && Math.floor(t * 4 + k) % 2 === 0); if (!onI) continue; c.fillStyle = 'rgba(59,232,255,.16)'; c.fillRect(IC.x + 2, y + 2, IC.w - 4, 74); ICONS[k].forEach((row, j) => [...row].forEach((ch, i) => ch === 'X' && lit(c, IC.x + 11 + i * 6, y + 18 + j * 6, 6, 6, k === 3 ? '#ffe27a' : '#9af6ff'))); }
      const snd = RE.snd('ai'), kick = RE.beat(t).kick;                                  // №8: коли грає кубик-колонка — еквалайзер у такт (центр підстрибує на удар)
      for (let i = 0; i < 64; i++) { const v = P.clamp(noise(t * (1 + act * 2), i * .35) * (1 - snd * .2) + snd * kick * (.55 - Math.abs(i - 31.5) / 80), .1, 1), h = Math.round(v * (EQ.h - 10)); lit(c, EQ.x + 6 + i * 8, EQ.y + EQ.h - 3 - h, 5, h, i % 8 === 0 ? '#ff7af0' : (snd > .3 && v > .85 ? '#9af6ff' : '#2aa6c8')); }
      // ПЛАСКИЙ кант голограми: тонке рожеве світіння по краю й блакитне по обідку (без «надутої» трубки, білої іскри й бліків у кутах)
      const RR = (x, y, w, h, r2) => { c.beginPath(); c.roundRect ? c.roundRect(x, y, w, h, r2) : c.rect(x, y, w, h); };
      c.lineWidth = 5; c.strokeStyle = rgba('255,79,216', .15 + .07 * Math.sin(t * 1.8) + act * .06 + this.burst * .14); RR(4, 4, BW - 8, BH - 8, 24); c.stroke();
      c.lineWidth = 4; c.strokeStyle = rgba('59,232,255', .1 + .05 * Math.sin(t * 2.3 + 1)); RR(10, 10, BW - 20, BH - 20, 18); c.stroke();
      c.save(); RR(BEZ, BEZ, BW - 2 * BEZ, BH - 2 * BEZ, 14); c.clip();
      const hy = ((t * .16) % 1) * (BH + 260) - 130, hg = c.createLinearGradient(0, hy - 70, 0, hy + 70);                          // голо-розгортка: світла смуга повільно пливе згори вниз
      hg.addColorStop(0, 'rgba(90,220,255,0)'); hg.addColorStop(.5, 'rgba(90,220,255,.075)'); hg.addColorStop(1, 'rgba(90,220,255,0)'); c.fillStyle = hg; c.fillRect(0, hy - 70, BW, 140);
      if (this.sweep !== null) { const p = BEZ - 160 + this.sweep * (BW + 320); c.fillStyle = 'rgba(160,230,255,.045)'; c.beginPath(); c.moveTo(p, 0); c.lineTo(p + 80, 0); c.lineTo(p - 60, BH); c.lineTo(p - 140, BH); c.fill(); }   // легкий відблиск по склу
      c.restore();
      c.globalCompositeOperation = 'source-over';
      // ЗАДАЧІ NEXI: останні зроблені + поточна (NX.nexi.history / NX.nexi.task)
      P.text(c, NX.t('board.title'), TK.x + 14, TK.y + 26, '#3be8ff', 15); lit(c, TK.x + TK.w - 26, TK.y + 12, 12, 12, Math.sin(t * 4) > 0 ? '#3bff8a' : '#1f6a45');
      const rows = NX.nexi.history.slice(-3), cur = NX.nexi.task, all = (cur && !cur.auto ? [...rows, { title: cur.title, color: cur.color, prog: cur.prog }] : rows).slice(-3);
      all.forEach((rw, i) => { const ry = TK.y + 52 + i * 48, done = rw.prog === undefined;
        lit(c, TK.x + 14, ry, 24, 24, '#0a2a78'); c.strokeStyle = rw.color || '#3be8ff'; c.lineWidth = 2; c.strokeRect(TK.x + 15, ry + 1, 22, 22);
        if (done) { lit(c, TK.x + 20, ry + 11, 4, 4, '#3bff8a'); lit(c, TK.x + 24, ry + 15, 4, 4, '#3bff8a'); lit(c, TK.x + 28, ry + 5, 4, 10, '#3bff8a'); } else lit(c, TK.x + 21, ry + 7, 10, 10, Math.sin(t * 6) > 0 ? (rw.color || '#3be8ff') : '#0a1236');
        P.text(c, rw.title.toUpperCase().slice(0, 30), TK.x + 50, ry + 17, done ? '#a8c4ff' : '#ffffff', 12);
        if (!done) { lit(c, TK.x + 50, ry + 28, TK.w - 70, 6, '#1b2a66'); lit(c, TK.x + 50, ry + 28, (TK.w - 70) * rw.prog, 6, rw.color || '#3be8ff'); } });
      if (!all.length) { const w = NX.t('board.waiting'); P.text(c, w, TK.x + 14, TK.y + 90, '#a8c4ff', 13); if (Math.sin(t * 5) > 0) lit(c, TK.x + 18 + Math.min(370, w.length * 13), TK.y + 77, 10, 14, '#3be8ff'); }
    },
    upper(c, t, kind, act) {
      c.globalCompositeOperation = 'source-over'; c.clearRect(0, 0, UW, UH); c.drawImage(kind === 'net' ? UPAS : UPBS, 0, 0);
      lit(c, UW - 40, 26, 10, 10, Math.sin(t * 3 + (kind === 'net' ? 0 : 1)) > 0 ? '#3bff8a' : '#1f6a45');
      if (kind === 'net') {                                                             // №6: мережа <-> карта світу (по черзі, з «глітчем» перемикання)
        const pg = K.pages(t, 1, 2, 16);
        if (pg.i === 0) {
          P.text(c, NX.t('scene.ai.net'), 28, 37, '#3be8ff', 12); c.drawImage(NETL, 0, 0); c.globalCompositeOperation = 'lighter';
          NODES.forEach((a, k) => { const b = NODES[(k + 3) % 9], q = (t * (.5 + act) + k * .37) % 1; lit(c, a[0] + (b[0] - a[0]) * q - 2.5, a[1] + (b[1] - a[1]) * q - 2.5, 5, 5, k % 2 ? '#ff9ae0' : '#9af6ff'); });
          const k = Math.floor(t * 2) % 9; P.glow(c, NODES[k][0], NODES[k][1], 16, 'rgba(59,232,255,.9)', .8);
        } else { P.text(c, NX.t('scene.ai.map'), 28, 37, '#3be8ff', 12); P.text(c, NX.num(12 + noise(t * .2, 4) * 3, 1) + NX.t('scene.unit.K'), UW - 50, 37, '#9af6ff', 11, 'right'); K.scrMap(c, 22, 48, UW - 44, UH - 66, t, { act, hot: ['kyiv', 'warsaw', 'amsterdam', 'london'] }); }
        c.globalCompositeOperation = 'source-over'; K.glitch(c, UW, UH, t, pg.sw, 1);
      } else { P.text(c, NX.t('scene.ai.log'), 28, 37, '#3be8ff', 12); K.scrLog(c, 22, 48, UW - 44, UH - 64, t, { act, size: 8 }); }   // №6: живий журнал подій
      c.globalCompositeOperation = 'source-over';
    },
    /** Голо-екран: напівпрозоре блакитне скло з кантом і скан-лініями. */
    holo(c, w, h, rgb, a = .5, fill = '22,80,210') {
      c.clearRect(0, 0, w, h); c.fillStyle = rgba(fill, a); c.fillRect(0, 0, w, h); c.fillStyle = rgba('8,24,90', a * .6); for (let y = 0; y < h; y += 4) c.fillRect(0, y, w, 1);
      c.fillStyle = rgba(rgb, .72); c.fillRect(0, 0, w, 2); c.fillRect(0, h - 2, w, 2); c.fillRect(0, 0, 2, h); c.fillRect(w - 2, 0, 2, h);   // тонкий тьмяніший кант, без кутових дужок (не «білі коробки»)
    },
    monitor(c, t) {
      this.holo(c, MW, MH, '90,216,255', .9);
      const pg = K.pages(t, 3, 2, 17);                                                  // №6: KPI <-> розпізнавання (обличчя / Рудик / логотип / документ)
      if (pg.i === 1) { lit(c, 8, 8, MW - 16, 30, '#1240a0'); P.text(c, NX.t('scene.ai.vision'), 16, 30, '#9af6ff', 14); K.scrScan(c, 10, 46, MW - 20, MH - 58, t, { id: pg.id, f: pg.f, act: this.active ? 1 : 0 }); K.glitch(c, MW, MH, t, pg.sw, 3); return; }
      c.fillStyle = '#2a5cc0'; for (let x = 14; x < MW - 6; x += 30) c.fillRect(x, 48, 1, MH - 60); for (let y = 60; y < MH - 10; y += 30) c.fillRect(8, y, MW - 16, 1);
      lit(c, 8, 8, MW - 16, 30, '#1240a0'); P.text(c, NX.t('scene.ai.kpi'), 16, 30, '#9af6ff', 14); P.text(c, '+' + (18 + Math.round(6 * noise(t * .2, 1))) + '%', MW - 16, 30, '#7dff9a', 14, 'right');
      c.globalCompositeOperation = 'lighter'; const b = MH - 14, h = MH - 74;
      for (let x = 0; x < MW - 20; x += 2) { const v1 = .5 + .3 * Math.sin((x + t * 60) * .04) + .12 * Math.sin((x + t * 100) * .11), v2 = .35 + .2 * Math.sin((x + t * 44) * .03 + 2), y1 = b - v1 * h, y2 = b - v2 * h; c.fillStyle = 'rgba(122,240,255,.16)'; c.fillRect(10 + x, y1, 2, b - y1); lit(c, 10 + x, y1, 2, 3, '#e8fdff'); lit(c, 10 + x, y2, 2, 2, '#ff9ae6'); }
      const px = 10 + ((t * 60) % (MW - 20)); c.fillStyle = 'rgba(255,255,255,.35)'; c.fillRect(px, 48, 2, MH - 60); c.globalCompositeOperation = 'source-over';
      K.glitch(c, MW, MH, t, pg.sw, 3);
    },
    laptop1(c, t) {
      this.holo(c, L1W, L1H, '90,232,255', .8, '12,38,124');                       // темніше скло: на тлі голограми не «біла коробка»
      if (this.active) { const lines = Math.min(11, Math.floor(this.prog * 26) + 1); for (let i = 0; i < lines; i++) { const w = [96, 70, 88, 50, 80, 62, 92, 40, 74, 58, 86][i]; lit(c, 12, 12 + i * 12, i === lines - 1 ? w * ((t * 3) % 1) : w, 5, i % 2 ? '#ff9ae6' : '#e8fdff'); } if (this.prog > .8) { lit(c, L1W - 46, L1H - 26, 36, 16, '#3bff8a'); P.text(c, NX.t('scene.ai.ok'), L1W - 28, L1H - 13, '#0a3a1a', 10, 'center'); } }
      else { const bx = L1W / 2 + Math.sin(t * .7) * 26, by = L1H / 2 + Math.sin(t * 1.1) * 30, a = .7 + .3 * Math.sin(t * 2); ['X...X', 'XX..X', 'X.X.X', 'X..XX', 'X...X'].forEach((row, j) => [...row].forEach((ch, i) => ch === 'X' && lit(c, bx - 15 + i * 6, by - 15 + j * 6, 6, 6, rgba('110,226,255', a)))); }
    },
    laptop2(c, t) {
      this.holo(c, L2W, L2H, '255,120,230', .8, '30,24,110'); const step = 1.7, n = Math.floor(t / step), f = (t % step) / step;
      for (let k = 0; k < 6; k++) { const id = n - k, me = id % 2 === 0, w = 30 + hash(id, 2) * (L2W - 46), y = L2H - 24 - k * 20 - Math.min(1, f * 4) * 20 + 20, x = me ? L2W - 8 - w : 8; if (y < 6) continue;
        if (k === 0 && f < .35 && !me) { for (let d = 0; d < 3; d++) lit(c, x + 4 + d * 8, y + 4, 4, 4, Math.floor(t * 6) % 3 === d ? '#ffffff' : '#8aa0e0'); continue; }
        lit(c, x, y, w, 14, me ? 'rgba(90,216,255,.85)' : 'rgba(255,120,230,.75)'); lit(c, x + 4, y + 3, w * .7, 2, '#ffffff'); lit(c, x + 4, y + 8, w * .45, 2, '#ffffff'); }
    },

    /** Стіл з речами і живими голо-екранами (окремо, щоб підлога могла його віддзеркалити). */
    drawDesk(c, t) {
      if (!DSK) init();
      const act = this.active ? 1 : 0, R = F.res();
      c.save(); K.draw(c, DSK, R);
      // живі голо-екрани на столі (раз на 3 кадри): монітор — звичайно, ноутбуки — світлом
      const DX = [18, 230, 220, 296];
      if (!this.DM || this.DM.width !== Math.round((DX[2] - DX[0]) * R)) { [this.DM, this.dm] = F.canvas(Math.round((DX[2] - DX[0]) * R), Math.round((DX[3] - DX[1]) * R)); this.dfr = -1; }
      if (this.fr % 3 === 2 || this.dfr !== R) {
        this.dfr = R; this.monitor(mf, t); this.laptop1(l1, t); this.laptop2(l2, t);
        const x = this.dm; x.setTransform(1, 0, 0, 1, 0, 0); x.clearRect(0, 0, this.DM.width, this.DM.height); x.setTransform(R, 0, 0, R, -DX[0] * R, -DX[1] * R); x.imageSmoothingEnabled = true;
        const st = Math.max(1, 1.5 / R);
        x.globalAlpha = .88 * K.flick(t, 3); F.warp(x, MONF, HOLOQ, st); x.globalAlpha = 1; x.strokeStyle = 'rgba(122,240,255,.6)'; x.lineWidth = .8; x.beginPath(); HOLOQ.forEach(([a, b], i) => i ? x.lineTo(a, b) : x.moveTo(a, b)); x.closePath(); x.stroke();
        for (const [L, F2] of [[LP2, L2F], [LP1, L1F]]) { x.globalCompositeOperation = 'source-over'; x.globalAlpha = .94 * K.flick(t, L === LP1 ? 4 : 5, .7); F.warp(x, F2, L.q, st); const [a, b] = L.base, [q0, q1, q2, q3] = L.q;   // екран ноутбука — темне скло поверх голограми (не додавання світла)
          x.globalCompositeOperation = 'lighter'; x.globalAlpha = .16 + .05 * Math.sin(t * 3); x.fillStyle = L.neon[0]; x.beginPath(); x.moveTo(a + 2, 290); x.lineTo(b - 2, 290); x.lineTo(q2[0], q2[1]); x.lineTo(q3[0], q3[1]); x.fill(); }   // промінь проектора від бази до екрана
        x.globalAlpha = 1; x.globalCompositeOperation = 'source-over';
      }
      c.imageSmoothingEnabled = true; c.drawImage(this.DM, DX[0], DX[1], DX[2] - DX[0], DX[3] - DX[1]);
      // неон стола: кромка плити пульсує, бігуча іскра, LED під секціями, вентилятор, трубки опор, індикатори
      c.globalCompositeOperation = 'lighter';
      c.fillStyle = rgba('255,79,216', .28 + .16 * Math.sin(t * 2.2) + act * .18); c.fillRect(DESK.l + 1, DESK.top + .6, DESK.r - DESK.l - 2, 1.4);
      const sx = DESK.l + ((t * .22) % 1) * (DESK.r - DESK.l); lit(c, sx - 7, DESK.top + .7, 14, 1, 'rgba(255,255,255,.85)');
      for (const s of DESK.sec) for (let x = s.a + 1.5; x < s.b - 1.5; x += 2) { c.fillStyle = act ? `hsla(${(t * 120 + x * 4) % 360},95%,62%,.85)` : rgba('59,232,255', .4 + .3 * Math.sin(t * 2 + x * .12)); c.fillRect(x, DESK.bot - 2.2, 1.3, 1.2); }
      for (let x = 54; x < 94; x += 2) lit(c, x, DESK.bot - 9.8, 1.3, .9, rgba('59,232,255', .18 + .14 * Math.sin(t * 1.6 + x * .08)));
      for (let x = 152; x < 234; x += 2) lit(c, x, DESK.bot - 9.8, 1.3, .9, rgba('255,79,216', .16 + .12 * Math.sin(t * 1.6 + x * .08)));
      const core = DESK.sec[2]; K.coreLive(c, K.coreGeom(core.a, core.b, DESK.slab, DESK.bot), t, act);   // системний блок: вентилятори, логотип, LED, рідина
      K.trinketsLive(c, DESK, ITEMS, t, act);                                         // живе в дрібницях: RGB мишки, LED навушників, стилус
      K.underLive(c, DESK, t, act);                                                   // вимикач подовжувача під столом
      K.deskShine(c, DESK, t, [[43, 12, '90,200,255'], [127, 11, '255,120,230'], [198, 12, '90,232,255'], [150, 50, '255,90,210']],   // відблиски на губі скла (тепла під лампою — у lampLive)
        [[30, 56, '90,180,255', .1, 294.2], [110, 144, '255,120,230', .1, 294.2], [180, 216, '90,232,255', .12 + act * .08, 294.2]]);   // світло екранів на верху
      c.globalCompositeOperation = 'lighter';
      [DESK.sec[0], DESK.sec[3]].forEach((s, n) => { const cx = (s.a + s.b) / 2; P.glow(c, cx, 335, 14, 'rgba(59,232,255,.8)', .18 + .08 * Math.sin(t * 3 + n)); const q = (t * .7 + n * .5) % 1; lit(c, cx - 1, DESK.slab + 3 + q * (DESK.bot - DESK.slab - 8), 2, 3, 'rgba(255,255,255,.8)'); });
      c.globalCompositeOperation = 'source-over';
      lampLive(c, t, RE.lamp('ai', t));                                                // №8: лампа горить, коли Nexi за столом
      K.soundFx(c, SPK, t, RE.snd('ai'));                                              // №8: кубик-колонка грає (еквалайзер, хвилі, ноти)
      c.globalCompositeOperation = 'lighter';
      // пара над кавою; світло екранів
      for (let i = 0; i < 5; i++) { const q = (t * .5 + i / 5) % 1; c.fillStyle = `rgba(220,230,255,${.35 * (1 - q)})`; c.fillRect(MUG[0] + 3.5 + Math.sin(q * 6 + i) * 1.5, MUG[1] - 1 - q * 14, 1, 1); }
      P.glow(c, 43, 262, 34, 'rgba(59,160,255,.5)', .14 + .04 * Math.sin(t * 1.4)); P.glow(c, 198, 274, 22, 'rgba(59,232,255,.6)', .16 + act * .25); P.glow(c, 127, 276, 18, 'rgba(255,120,230,.6)', .12);
      if (act) { const [ax, ay] = [198, 258], [bx, by] = F.homo(BIGQ).fwd(BC[0] / BW, BC[1] / BH), mx2 = (ax + bx) / 2 + 14, my2 = Math.min(ay, by) - 20;   // потік даних: ноутбук -> мозок
        for (let i = 0; i < 12; i++) { const q = (t * .8 + i / 12) % 1, u = 1 - q, x = u * u * ax + 2 * u * q * mx2 + q * q * bx, y = u * u * ay + 2 * u * q * my2 + q * q * by; lit(c, x - .6, y - .6, 1.2, 1.2, i % 3 ? '#7af0ff' : '#ff7af0'); c.fillStyle = 'rgba(122,240,255,.22)'; c.fillRect(x - 1.5, y - 1.5, 3, 3); } }
      c.restore();
    },
    drawBack(c, t) {
      if (!DSK) init();
      const act = this.active ? 1 : 0, R = F.res(); this.fr++;
      // екрани на стіні: раз на 3 кадри у кеш WARP (уже в перспективі), щокадру — одна копія
      const WX = [56, 0, 240, 296];
      if (!this.WARP || this.WARP.width !== Math.round((WX[2] - WX[0]) * R)) { [this.WARP, this.wc] = F.canvas(Math.round((WX[2] - WX[0]) * R), Math.round((WX[3] - WX[1]) * R)); this.wfr = -1; }
      if (this.fr % 3 === 0 || this.wfr !== R) {
        this.wfr = R; const w = this.wc; w.setTransform(1, 0, 0, 1, 0, 0); w.clearRect(0, 0, this.WARP.width, this.WARP.height); w.setTransform(R, 0, 0, R, -WX[0] * R, -WX[1] * R); w.imageSmoothingEnabled = true;
        w.globalCompositeOperation = 'lighter';
        for (const [e, a, rgb] of [[3, .07, '255,79,216'], [8, .065, '59,190,255'], [18, .035, '59,190,255'], [32, .018, '120,90,255']]) { const q = BIGQ.map(([x, y], i) => [x + (i === 0 || i === 3 ? -e : e), y + (i < 2 ? -e : e)]); w.fillStyle = rgba(rgb, a + .02 * Math.sin(t * 1.8) + act * .02 + this.burst * .04); w.beginPath(); q.forEach(([x, y], i) => i ? w.lineTo(x, y) : w.moveTo(x, y)); w.fill(); }   // ореол на стіні: холодне світло голограми, тонкий рожевий біля канта
        w.globalCompositeOperation = 'source-over';
        this.big(bf, t, act); this.upper(uaf, t, 'net', act); this.upper(ubf, t, 'log', act);
        const ws = Math.max(1, 2.4 / R); w.globalAlpha = K.flick(t, 1); F.warp(w, UAF, UPQ.net, ws); w.globalAlpha = K.flick(t, 2); F.warp(w, UBF, UPQ.log, ws); w.globalAlpha = 1;   // ледь мерехтять (№6)
        w.globalAlpha = K.flick(t, 7, .6); F.warp(w, BIGF, BIGQ, ws); w.globalAlpha = 1;   // голограма ледь мерехтить (№6)
      }
      // ПРОЕКТОР голограми на плиті (замість хромованої підставки): темна планка з блакитною щілиною, промінь угору до низу екрана
      const [pa, pb] = STAND, PJ = PROJ || (PROJ = proj());
      c.save(); lit(c, pa - .5, 286.2, pb - pa + 1, 3.6, OUT); lit(c, pa, 286.6, pb - pa, 3, '#141a44'); lit(c, pa + 1, 286.7, pb - pa - 2, .7, '#2a3466');
      lit(c, pa + 2, 287.4, pb - pa - 4, .8, rgba('59,232,255', .7 + .3 * Math.sin(t * 3)));
      c.globalCompositeOperation = 'lighter'; c.globalAlpha = .82 + .18 * Math.sin(t * 2.6);
      c.fillStyle = c.__pjg || (c.__pjg = (() => { const g = c.createLinearGradient(0, 287, 0, PJ.top); g.addColorStop(0, 'rgba(59,232,255,.24)'); g.addColorStop(1, 'rgba(59,232,255,.03)'); return g; })()); c.fill(PJ.beam);
      c.globalAlpha = 1; PJ.sp.forEach(([x0, x1, y1], k) => { const q = (t * .7 + k * .37) % 1; c.fillStyle = rgba('154,246,255', .22 * (1 - q)); c.fillRect(x0 + (x1 - x0) * q - .3, 287 - (287 - y1) * q - .6, .6, 1.2); });   // іскорки в промені
      c.restore();
      c.save(); c.imageSmoothingEnabled = true; c.drawImage(this.WARP, WX[0], WX[1], WX[2] - WX[0], WX[3] - WX[1]); c.restore();
      K.stuck(c, NOTES);                                                              // стікери на стіні праворуч від екрана
      this.drawDesk(c, t);
    },
  });
  K.reflectors.push((c, t) => ai.drawDesk(c, t));
})();

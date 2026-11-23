/* ============================================================================
 * actors/guests/party_room.js — КІМНАТА ВЕЧІРКИ: ПІКСЕЛЬНЕ 3D У ПЕРСПЕКТИВІ КІМНАТИ (NX.partyRoom)
 * ----------------------------------------------------------------------------
 * Власник (06.11): «графіка дуже примітивна — треба рішення». Перша версія (04.11) малювала кімнату прямокутниками в
 * своєму світі 720×400. Тепер вечірка — справжній об'єм тим самим рушієм, що й зони кімнати (core/px3d.js): та сама
 * одноточкова перспектива (core/persp.js: VP (774, 220), D 520), підлога y 372, z углиб; z-буфер, темний контур по силуету
 * (outline), ВІДДЗЕРКАЛЕННЯ в глянці підлоги (reflect — неон, пульт, колонки, бар відбиваються в мокрому глянці, як у кімнаті).
 * Усе кодом, у стилі картинки кімнати: палітри темної фіолетової сталі, неон, дизеринг Байєра, жодного розмиття.
 *   build()  -> { cv, x0, y0 } — растр кімнати (R = 1: одна одиниця — один піксель; пікселі видно — це стиль) і де його класти.
 *               Збирається раз, при першому відкритті (кличе party.js: prepare() — поки Nexi іде до брами) і при зміні мови
 *               (вивіска й написи — NX.t). ~1.3 M пікселів, десятки мс.
 *   GEO      — геометрія для живого шару (party.js): танцпол, пульт, колонки, куля, лампи, гірлянди — у світових координатах.
 * Що в кімнаті: цегляна стіна, голі бічні стіни (22.11), плінтус-неон, стеля з балками й рейкою прожекторів,
 * вивіска «ВЕЧІРКА NEXI» (party.sign) з лампочками, гірлянди лампочок від кутів, дзеркальна куля на ланцюгу, DJ-пульт з
 * подіумом (Nexi стоїть за ним — вище), два стеки колонок з динаміками, бар уздовж правої стіни (стійка з неоновою
 * кромкою, за нею бармен — party.js, полиця з пляшками, що світяться, неонова вивіска «БАР», підвісна полиця з келихами), стіл із
 * закусками вздовж лівої (піца, сендвічі, фрукти, кекси, чіпси, сік), кульки на нитках,
 * афіша колекції в неоновій рамці. 06.11 («зроби стильніше, більше графіки»):
 * VJ-екран за пультом, LED-матриця пульта й гобо-прожектори (живе — party.js).
 * ========================================================================== */
NX.partyRoom = (() => {
  const X = NX.px3d, { col, pal, ramp, mixc, dim, rgb } = X, PZ = NX.persp, P = NX.px, hash = NX.art.hash;
  const FLY = 372, CEIL = -20, XL = 134, XR = 1414, ZB = 440, ZF = -240;                         // підлога, стеля, стіни, задня стіна, передній край
  // ---------- палітри (темне -> світле) ----------
  const PAL = {
    BRICK: pal(['#0c0824', '#140c32', '#1a1240', '#22184e', '#2a1e5c', '#34266c', '#3e2e7c', '#4a388e']),
    MORTAR: pal(['#07051a', '#0a0722', '#0e0a2a', '#120d32']),
    FLOOR: pal(['#05040f', '#080616', '#0b081e', '#0e0a26', '#120d2e', '#161036', '#1b1440']),
    CEIL: pal(['#0a0722', '#100c30', '#16113c', '#1c1648', '#241c56', '#2c2264']),
    STEEL: pal(['#05041a', '#0a0826', '#100d34', '#171344', '#1f1a56', '#28226a', '#332c80', '#423a98', '#5a50b4']),
    MET: pal(['#0a0820', '#120e30', '#1a1542', '#241c56', '#30266c', '#3e3284', '#50429e', '#6a5abc', '#8e80d8']),
    TOP: pal(['#060318', '#0b0730', '#120a36', '#1c0a3c', '#2b0c40', '#3e1048', '#541a56', '#6a2462', '#8a3478']),
    WOOD: pal(['#140812', '#22101c', '#321826', '#442032', '#582a3e', '#6e364a', '#864458', '#a05668', '#bc6c7c']),
    PLUM: pal(['#1a0c38', '#2a1450', '#3a1a6a', '#4a2486', '#5e30a0', '#7a44c0', '#9a60da', '#c08af0']),
    CHROME: pal(['#1a1c40', '#22264e', '#353b6a', '#555f8c', '#848db4', '#bcc5e6', '#eef2ff']),
    GOLD: pal(['#2a1604', '#4a2a08', '#6a420e', '#8e5c16', '#b47a20', '#d89a2e', '#f0bc4a', '#ffdc84', '#fff2c4']),
    PINK: pal(['#3a0b38', '#58134f', '#7a1c6d', '#a0288d', '#c63aa8', '#e656c0', '#ff84d4', '#ffc2ec']),
    LILAC: pal(['#2a1a5a', '#3c2878', '#523a98', '#6a50b4', '#8a6ad0', '#ac8ee6', '#cdb4f6', '#ead8ff']),
    CYAN: pal(['#0a3a5a', '#0f5a80', '#1a8ab0', '#2ab8e0', '#3be8ff', '#9af6ff', '#ffffff']),
    DARK: pal(['#04030c', '#08061a', '#0c0a24', '#120e30', '#18143e']),
    CERAM: pal(['#2a2448', '#3e3664', '#564c84', '#7064a4', '#8e84c2', '#b0a8dc', '#d4ceee', '#f0ecff']),
    CREAM: pal(['#5a4a3a', '#8a7460', '#b89c84', '#d8c0a8', '#f0dcc8', '#fff4e8']),
  };
  const NEONC = { pink: col('#ff4fd8'), cyan: col('#3be8ff'), lil: col('#c86aff'), gold: col('#ffd27a'), green: col('#3bff8a'), orange: col('#ff9a3a'), white: col('#ffffff') };
  const F_EMIT = X.F_EMIT, F_FLOOR = X.F_FLOOR, F_GLOSS = X.F_GLOSS;
  // ---------- матеріали ----------
  /** Світло в кімнаті: зверху-спереду (прожектори) + трохи від підлоги (неон плінтуса). q — освітленість грані 0..1. */
  const LIGHT = [0.2, -0.75, -0.62], litOf = n => { const l = Math.hypot(...LIGHT), d = (n[0] * LIGHT[0] + n[1] * LIGHT[1] + n[2] * LIGHT[2]) / l; return .42 + .36 * d; };
  /** Матеріал з фаскою: світлий верхній/лівий край, темний нижній/правий (bw од.), легкий перелив по v. fw × fh — розмір грані. */
  const bevel = (PL, q, fw, fh, bw = 2, o = {}) => (u, v, i, j) => {
    const x = u * fw, y = v * fh; let qq = q + (o.grad || 0) * (.5 - v);
    if (y < bw || x < bw) qq += .22; else if (y > fh - bw || x > fw - bw) qq -= .22;
    if (o.seam && (Math.floor(x / o.seam) !== Math.floor((x - 1) / o.seam))) qq -= .12;
    return ramp(PL, qq, i, j);
  };
  /** Цегла: ряди 14 од., цеглини 40 од. зі зсувом через ряд, шов 2 од., у кожній цеглині свій тон і подекуди скол. */
  const brick = (q, fw, fh, o = {}) => (u, v, i, j) => {
    const x = u * fw, y = v * fh, row = Math.floor(y / 14), xx = x + (row & 1) * 20, colI = Math.floor(xx / 40), bx = xx - colI * 40, by = y - row * 14;
    const hv = hash(colI + (o.seed || 0), row);
    if (by < 2 || bx < 2) return ramp(PAL.MORTAR, .5 + (hv - .5) * .4, i, j);
    let qq = q + (hv - .5) * .24 + (o.grad || 0) * (.5 - v) + (by < 4 ? .08 : by > 11 ? -.08 : 0);
    if (hv > .93 && bx > 8 && bx < 20 && by > 5 && by < 10) qq -= .3;                            // скол
    const gr = hash(Math.floor(x / 90) + (o.seed || 0) * 3, Math.floor(y / 70)); if (gr > .7) qq -= (gr - .7) * .9 * (1 - Math.abs(((x % 90) / 90 - .5) * 2)) * (1 - Math.abs(((y % 70) / 70 - .5) * 2));   // плями кіптяви
    if (v > .85) qq -= (v - .85) * 2;                                                                                                   // бруд унизу
    return ramp(PAL.BRICK, qq, i, j);
  };
  /** Підлога: темний глянець із великими плитами 80 од. (ледь помітні шви) — у ній відбивається все (F_FLOOR). */
  const floorSh = (u, v, i, j, t) => { const x = u * (XR - XL), z = v * (ZB - ZF); X.SH.fl = F_FLOOR; const gx = x % 80 < 1.5 || z % 80 < 1.5; return ramp(PAL.FLOOR, (gx ? .62 : .42) + (hash(Math.floor(x / 80), Math.floor(z / 80)) - .5) * .12 - v * .18, i, j); };
  /** Текстура з полотна: paint(c, w, h) малює в пікселях; shade бере піксель за (u, v). Прозоре — колір back або дірка. */
  function tex(w, h, paint, back = null) {
    const cv = document.createElement('canvas'); cv.width = w; cv.height = h; const c = cv.getContext('2d'); c.imageSmoothingEnabled = false; paint(c, w, h);
    const d = c.getImageData(0, 0, w, h).data;
    return (u, v) => { const x = Math.min(w - 1, Math.max(0, Math.floor(u * w))), y = Math.min(h - 1, Math.max(0, Math.floor(v * h))), k = (y * w + x) * 4; if (d[k + 3] < 40) return back === null ? 0 : back(u, v); return rgb(d[k], d[k + 1], d[k + 2]); };
  }
  // ---------- геометрія ----------
  /** Коробка: x0..x1, y0..y1 (y0 — верх), z0..z1 (z0 — ближче). M — матеріали граней: {front, top, left, right, back, bottom}. */
  function box(L, id, x0, x1, y0, y1, z0, z1, M, o = {}) {
    const fw = x1 - x0, fh = y1 - y0, fd = z1 - z0, g = (f, q, n) => (f ? f(q) : null), Fs = [];
    const F = { front: [[[x0, y0, z0], [x1, y0, z0], [x1, y1, z0], [x0, y1, z0]], [x0, y0, z0], [fw, 0, 0], [0, fh, 0], [0, 0, -1], fw, fh],
      top: [[[x0, y0, z0], [x1, y0, z0], [x1, y0, z1], [x0, y0, z1]], [x0, y0, z0], [fw, 0, 0], [0, 0, fd], [0, -1, 0], fw, fd],
      bottom: [[[x0, y1, z0], [x1, y1, z0], [x1, y1, z1], [x0, y1, z1]], [x0, y1, z0], [fw, 0, 0], [0, 0, fd], [0, 1, 0], fw, fd],
      left: [[[x0, y0, z0], [x0, y0, z1], [x0, y1, z1], [x0, y1, z0]], [x0, y0, z0], [0, 0, fd], [0, fh, 0], [-1, 0, 0], fd, fh],
      right: [[[x1, y0, z0], [x1, y0, z1], [x1, y1, z1], [x1, y1, z0]], [x1, y0, z0], [0, 0, fd], [0, fh, 0], [1, 0, 0], fd, fh],
      back: [[[x0, y0, z1], [x1, y0, z1], [x1, y1, z1], [x0, y1, z1]], [x0, y0, z1], [fw, 0, 0], [0, fh, 0], [0, 0, 1], fw, fh] };
    for (const k in F) { const [poly, O, A, B, n, w, h] = F[k], m = M[k] || M.all; if (!m) continue; X.face(L, poly, O, A, B, m(litOf(n), w, h, n), Object.assign({ id, n }, o[k] || {})); }
  }
  const mBevel = (PL, bw = 2, o = {}) => (q, w, h) => bevel(PL, q, w, h, bw, o);
  const mGloss = PL => (q, w, h) => { const b = bevel(PL, q + .1, w, h, 2); return (u, v, i, j, t) => { X.SH.fl = F_GLOSS; return b(u, v, i, j); }; };
  const mNeon = (c, hw = .5) => (q, w, h) => (u, v, i, j) => { X.SH.fl = F_EMIT; return Math.abs(v - .5) < hw * .5 ? mixc(c, NEONC.white, .35) : dim(c, .55); };
  const mFlat = (PL, q0) => (q, w, h) => (u, v, i, j) => ramp(PL, q0 == null ? q : q0, i, j);

  // ---------- геометрія для живого шару ----------
  const GEO = {
    FLY, CEIL, XL, XR, ZB, ZF, VIEW: { x0: 34, x1: 1514, y0: -120, y1: 570 }, RASTER: { y0: -240, y1: 600 },                      // видима область на комп'ютері (одиниці кімнати)
    dance: { x0: 774 - 270, x1: 774 + 270, z0: -70, z1: 170, cols: 8, rows: 4 },
    booth: { x0: 774 - 120, x1: 774 + 120, y0: 300, z0: 200, z1: 262, led: { y0: 318, y1: 352 } }, podium: { y: 318, z: 282 },   // Nexi стоїть на подіумі за пультом
    speakers: [{ x: 774 - 200, z: 250 }, { x: 774 + 200, z: 250 }],                                   // стек: 52 завширшки, 150 заввишки
    ball: { x: 774, y: 206, z: 260, r: 26 }, sign: { x0: 774 - 210, x1: 774 + 210, y0: 64, y1: 128, z: ZB - 6 },
    lamps: [774 - 420, 774 - 140, 774 + 140, 774 + 420].map(x => ({ x, y: CEIL + 14, z: 150 })),      // прожектори на рейці
    bar: { x0: 1060, x1: 1330, z0: 186, z1: 236, y0: 332, back: { z0: 296, z1: 332, y0: 140 }, shelf: { y: [190, 240, 290], z0: 268, z1: 296 } }, barman: { x: 1195, y: 346, z: 252 }, snack: { x0: 216, x1: 532, z0: 196, z1: 256, y0: 338, dishes: [['pizza', 31], ['cupcake', 88], ['fruit', 143], ['sandwich', 192], ['juice', 250], ['popcorn', 301]] }   /* dishes: що бере гість і де це стоїть (x від x0) */,
    crowd: [], rail: { z: -210, y0: 330 }, screen: { x0: 774 - 210, x1: 774 + 210, y0: 104, y1: 262, z: ZB - 5 }, foam: [{ x: XL + 150, z: ZB - 46, y: 90 }, { x: XR - 150, z: ZB - 46, y: 90 }], /* гармати піни на балконі, y — підлога балкона */ smoke: [{ x: 774 - 200, z: 190 }, { x: 774 + 200, z: 190 }],                   // VJ-екран за пультом (живе — party.js: drawScreen)
    gobos: [774 - 250, 774, 774 + 250],         // обертові прожектори-гобо
    /* 22.11 (власник: «лишаємо тільки основне»): лаунжі, аерохокей і караоке прибрано зовсім, бічні стіни голі — обабіч танцполу вільна підлога */ balcony: { y: 90, z0: ZB - 90, z1: ZB, rail: 44 }, stairs: [{ x0: XL, x1: XL + 72, z0: 130, side: -1 }, { x0: XR - 72, x1: XR, z0: 130, side: 1 }],
    minibar: { x0: 774 - 230, x1: 774 - 70, z0: ZB - 62, z1: ZB - 30, y0: 62 }, hiTables: [774 + 40, 774 + 170, 774 + 300].map(x => ({ x, z: ZB - 50 })),
    photo: { x0: XR - 230, x1: XR - 110, z0: ZB - 40, z1: ZB - 4 }, poster: { x0: 774 - 560, x1: 774 - 300, y0: 78, y1: 212 }, cat: { x: 774 - 200, y: FLY - 152, z: 280 },   // афіша колекції на задній стіні; Рудик на лівій колонці
    bulbs: [], balloons: [[560, 118, 420, 'pink'], [990, 120, 420, 'cyan']],
  };
  for (let i = 0; i < 10; i++) { const side = i < 5 ? -1 : 1, k = i % 5; GEO.crowd.push({ x: 774 + side * (120 + k * 26 + (k % 2) * 8), z: 176 + (k % 3) * 9, h: 44 + hash(i, 5) * 14, ph: hash(i, 9) * 6, w: 20 + hash(i, 2) * 8 }); }   // натовп-тло обабіч пульта
  (() => { for (let w = 0; w < 2; w++) for (let i = 0; i <= 11; i++) { const u = i / 11, xa = w ? XR - 10 : XL + 10, xb = w ? 774 + 230 : 774 - 230, x = xa + (xb - xa) * u, y = CEIL + 14 + Math.sin(u * Math.PI) * 34 + u * 8, z = ZB - 60 + (1 - u) * -120; GEO.bulbs.push([x, y, z]); } })();

  // ============================ СВІТЛО КІМНАТИ (06.11: «світло пласке — гості наклеєні») ============================
  // Джерела кольорового світла: кожен піксель растра (стіни, підлога, меблі) підфарбовується найближчими — рожеве біля бару,
  // золоте біля фуршету, cyan біля пульта й VJ-екрана, кольори прожекторів з рейки; кути темніші (ambient).
  // Те саме lightAt(x, y, z) кличе party.js для гостей, Nexi й бармена — спрайти в тому ж світлі, що й кімната.
  const LIGHTS = [
    { p: [1220, 300, 200], c: [1, .35, .85], r: 360, k: .9 }, { p: [1220, 150, 180], c: [1, .8, .4], r: 240, k: .6 }, { p: [1220, 220, 280], c: [.3, .9, 1], r: 260, k: .6 },   // бар: рожевий неон, лампи, підсвітка вітрини
    { p: [374, 300, 215], c: [1, .85, .45], r: 330, k: .9 }, { p: [374, 150, 190], c: [1, .5, .8], r: 240, k: .5 }, { p: [374, 366, 220], c: [1, .8, .35], r: 150, k: .55 },            // фуршет: золота гірлянда, рожеві лампи, золоте світіння під неоновим столом
    { p: [774, 290, 232], c: [.25, .9, 1], r: 320, k: 1 }, { p: [774, 166, 432], c: [.3, .8, 1], r: 300, k: .8 },              // пульт і VJ-екран
    { p: [774, 370, 430], c: [.25, .9, 1], r: 520, k: .35 },                                                                   // плінтус-неон
    ...[[774 - 420, [1, .3, .85]], [774 - 140, [.25, .9, 1]], [774 + 140, [1, .9, .45]], [774 + 420, [.25, 1, .55]]].map(([x, c]) => ({ p: [x, 100, 150], c, r: 300, k: .55 })),   // прожектори
    ...[XL + 150, 774 - 300, 774 + 300, XR - 150].map(x => ({ p: [x, 130, -120], c: [1, .85, .5], r: 300, k: .5 })),              // підвісні лампи спереду (над прапорцями)
    { p: [XL + 60, 30, 416], c: [.3, .9, 1], r: 260, k: .5 }, { p: [XR - 60, 30, 416], c: [1, .35, .85], r: 260, k: .5 }, { p: [774, 30, 416], c: [1, .9, .5], r: 260, k: .5 },   // прожектори другого поверху
    { p: [774, 46, 352], c: [.4, .9, 1], r: 700, k: .25 },   // LED балюстради
    { p: [774 - 150, 70, 400], c: [1, .4, .85], r: 220, k: .5 }, { p: [XR - 170, 10, 400], c: [1, .9, .8], r: 200, k: .5 },   // мінібар нагорі, фотобудка
  ];
  /** Світло в точці світу: [r, g, b] множники (ambient + сума джерел; 1 — як намальовано). */
  function lightAt(x, y, z) {
    const amb = .5 + .12 * (1 - Math.min(1, Math.abs(x - 774) / 760)) + .18 * Math.max(0, Math.min(1, (y - 60) / 312)); let r = amb, g = amb, b = amb;   // 07.11: боки світліші (було .4 + .2)
    for (const L of LIGHTS) { const dx = x - L.p[0], dy = y - L.p[1], dz = z - L.p[2], d = Math.sqrt(dx * dx + dy * dy + dz * dz); if (d >= L.r) continue; const I = L.k * (1 - d / L.r) ** 2; r += I * L.c[0] * 1.3; g += I * L.c[1] * 1.3; b += I * L.c[2] * 1.3; }
    return [r, g, b];
  }
  /** Запекти світло в растр: для кожного невипромінюючого пікселя відновлюємо точку світу з глибини (промінь від ока) і множимо колір. */
  function bake(L) {
    const { W, H, R, x0, y0, c: C, dep: DP, fl: FLg, id: ID } = L, VX = X.VX, VY = X.VY, D = X.D, R_ = X.R_, G_ = X.G_, B_ = X.B_, rgb = X.rgb;
    for (let j = 0; j < H; j++) { const Y = y0 + (j + .5) / R, dy = Y - VY; for (let i = 0; i < W; i++) { const k = j * W + i; if (!ID[k] || (FLg[k] & F_EMIT)) continue; const t = DP[k]; if (!isFinite(t)) continue;
      const dx = x0 + (i + .5) / R - VX, wx = VX + t * dx, wy = VY + t * dy, wz = -D + t * D, [lr, lg, lb] = lightAt(wx, wy, wz), c = C[k];
      C[k] = rgb(Math.min(255, R_(c) * lr), Math.min(255, G_(c) * lg), Math.min(255, B_(c) * lb), 255); } }
  }
  /** Bloom: випромінюючі пікселі — у зменшене полотно, розмиття масштабуванням, додати світлом (lighter) поверх растра. */
  function bloom(cv, L) {
    const { W, H, c: C, fl: FLg } = L, em = new Uint8ClampedArray(W * H * 4); for (let k = 0; k < W * H; k++) if (FLg[k] & F_EMIT) { const c = C[k]; em[k * 4] = X.R_(c); em[k * 4 + 1] = X.G_(c); em[k * 4 + 2] = X.B_(c); em[k * 4 + 3] = 255; }
    const e = document.createElement('canvas'); e.width = W; e.height = H; e.getContext('2d').putImageData(new ImageData(em, W, H), 0, 0);
    const s1 = document.createElement('canvas'); s1.width = W >> 2; s1.height = H >> 2; const c1 = s1.getContext('2d'); c1.imageSmoothingEnabled = true; c1.drawImage(e, 0, 0, s1.width, s1.height);
    const s2 = document.createElement('canvas'); s2.width = W >> 3; s2.height = H >> 3; const c2 = s2.getContext('2d'); c2.imageSmoothingEnabled = true; c2.drawImage(s1, 0, 0, s2.width, s2.height);
    const c = cv.getContext('2d'); c.save(); c.globalCompositeOperation = 'lighter'; c.imageSmoothingEnabled = true; c.globalAlpha = .32; c.drawImage(s1, 0, 0, W, H); c.globalAlpha = .22; c.drawImage(s2, 0, 0, W, H); c.restore();
  }
  // ============================ ЗБІРКА РАСТРА ============================
  function build() {
    const L = X.Layer(-20, GEO.RASTER.y0, 1570, GEO.RASTER.y1, 1); let id = 0;
    const F = L.W, pF = (x, y, z) => PZ.p(x, y, z);
    // --- підлога, стіни, стеля ---
    X.face(L, [[XL, FLY, ZF], [XR, FLY, ZF], [XR, FLY, ZB], [XL, FLY, ZB]], [XL, FLY, ZF], [XR - XL, 0, 0], [0, 0, ZB - ZF], floorSh, { id: ++id, n: [0, -1, 0] }); const ID_FLOOR = id;
    X.face(L, [[XL, CEIL, ZB], [XR, CEIL, ZB], [XR, FLY, ZB], [XL, FLY, ZB]], [XL, CEIL, ZB], [XR - XL, 0, 0], [0, FLY - CEIL, 0], brick(.5, XR - XL, FLY - CEIL, { grad: -.25, seed: 7 }), { id: ++id, n: [0, 0, -1] }); const ID_WALL = id;
    X.face(L, [[XL, CEIL, ZF], [XL, CEIL, ZB], [XL, FLY, ZB], [XL, FLY, ZF]], [XL, CEIL, ZF], [0, 0, ZB - ZF], [0, FLY - CEIL, 0], brick(.42, ZB - ZF, FLY - CEIL, { grad: -.25, seed: 31 }), { id: ++id, n: [1, 0, 0] });
    X.face(L, [[XR, CEIL, ZF], [XR, CEIL, ZB], [XR, FLY, ZB], [XR, FLY, ZF]], [XR, CEIL, ZF], [0, 0, ZB - ZF], [0, FLY - CEIL, 0], brick(.42, ZB - ZF, FLY - CEIL, { grad: -.25, seed: 53 }), { id: ++id, n: [-1, 0, 0] });
    X.face(L, [[XL, CEIL, ZF], [XR, CEIL, ZF], [XR, CEIL, ZB], [XL, CEIL, ZB]], [XL, CEIL, ZF], [XR - XL, 0, 0], [0, 0, ZB - ZF], (u, v, i, j) => { const x = u * (XR - XL), z = v * (ZB - ZF); return ramp(PAL.CEIL, (x % 160 < 2.5 || z % 160 < 2.5 ? .95 : .5 + (hash(Math.floor(x / 160), Math.floor(z / 160)) - .5) * .2) - v * .3, i, j); }, { id: ++id, n: [0, 1, 0] });
    // 22.11: неонових пілястрів більше немає (на задній стіні різали афішу колекції й фуршет, за баром їх не було видно)
    // плінтус-неон уздовж стін
    ++id; box(L, id, XL, XR, FLY - 5, FLY, ZB - 6, ZB, { front: mNeon(NEONC.cyan, .6), top: mFlat(PAL.STEEL, .3) });
    ++id; box(L, id, XL, XL + 6, FLY - 5, FLY, ZF, ZB - 6, { right: mNeon(NEONC.cyan, .6), top: mFlat(PAL.STEEL, .3) });
    ++id; box(L, id, XR - 6, XR, FLY - 5, FLY, ZF, ZB - 6, { left: mNeon(NEONC.cyan, .6), top: mFlat(PAL.STEEL, .3) });
    // стеля: балки й рейка прожекторів
    for (const z of [ZB - 100, ZB - 250, ZB - 400]) { ++id; box(L, id, XL, XR, CEIL, CEIL + 18, z - 9, z + 9, { front: mBevel(PAL.MET, 2, { seam: 120 }), bottom: mBevel(PAL.MET, 2), left: mBevel(PAL.MET, 2), right: mBevel(PAL.MET, 2) }); }
    ++id; box(L, id, 774 - 470, 774 + 470, CEIL + 4, CEIL + 12, GEO.lamps[0].z - 5, GEO.lamps[0].z + 5, { front: mBevel(PAL.STEEL, 1), bottom: mBevel(PAL.STEEL, 1) });
    GEO.lamps.forEach((lp, k) => { ++id; box(L, id, lp.x - 12, lp.x + 12, lp.y - 2, lp.y + 22, lp.z - 10, lp.z + 10, { all: mBevel(PAL.STEEL, 2) }); X.disc(L, [lp.x, lp.y + 20, lp.z - 10.5], 8, (u, v, i, j) => { X.SH.fl = F_EMIT; const d = Math.hypot(u - .5, v - .5); return d < .3 ? NEONC.white : [NEONC.pink, NEONC.cyan, NEONC.gold, NEONC.green][k]; }, { id }); });
    // вивіски «ВЕЧІРКА NEXI» більше немає (власник, 06.11) — на її місці більший VJ-екран; піна й дим — події (party.js)
    // гірлянди прапорців під стелею спереду (видно на телефоні, де вгорі стеля): дріт провисає, трикутники в кольорах неону
    for (const z of [-40, -170]) { ++id; const n = 26, pts = []; for (let i = 0; i <= n; i++) { const u = i / n; pts.push([XL + (XR - XL) * u, CEIL + 22 + Math.sin(u * Math.PI) * 26 + Math.sin(u * Math.PI * 6) * 3, z]); }
      for (let i = 0; i < n; i++) { const a = pts[i], b = pts[i + 1]; X.tube(L, a, b, 1, () => ramp(PAL.CHROME, .5, 0, 0), { id }); const m = [(a[0] + b[0]) / 2, (a[1] + b[1]) / 2 + 14, z], c = [NEONC.pink, NEONC.cyan, NEONC.gold, NEONC.green, NEONC.lil, NEONC.orange][i % 6];
        X.face(L, [a, b, m], a, [b[0] - a[0], b[1] - a[1], 0], [m[0] - a[0], m[1] - a[1], 0], (u, v, i2, j2) => (u + v > .9 ? dim(c, .7) : c), { id, n: [0, 0, -1] }); } }
    // підвісні лампи-конуси спереду: шнур, конус, лампочка (світиться)
    for (const x of [XL + 150, 774 - 300, 774 + 300, XR - 150]) { ++id; X.tube(L, [x, CEIL, -120], [x, CEIL + 48, -120], 1.5, () => ramp(PAL.STEEL, .5, 0, 0), { id });
      X.face(L, [[x - 14, CEIL + 64, -120], [x + 14, CEIL + 64, -120], [x + 3, CEIL + 48, -120], [x - 3, CEIL + 48, -120]], [x - 14, CEIL + 64, -120], [28, 0, 0], [0, -16, 0], (u, v, i2, j2) => ramp(PAL.MET, .55 + (u < .5 ? .15 : -.1) * (1 - v), i2, j2), { id, n: [0, 0, -1] });
      X.disc(L, [x, CEIL + 66, -120.5], 4, (u, v) => { X.SH.fl = F_EMIT; return Math.hypot(u - .5, v - .5) < .25 ? NEONC.white : NEONC.gold; }, { id }); }
    // VJ-екран за пультом: рамка зі сталі з хромовою кромкою, темне скло (живі візуалізації — party.js)
    { const Sc = GEO.screen; ++id; box(L, id, Sc.x0 - 8, Sc.x1 + 8, Sc.y0 - 8, Sc.y1 + 8, Sc.z - 2, ZB, { all: mBevel(PAL.MET, 3), front: (q, fw, fh) => { const b = bevel(PAL.MET, q, fw, fh, 3); return (u, v, i, j) => (u * fw > 8 && u * fw < fw - 8 && v * fh > 8 && v * fh < fh - 8) ? ramp(PAL.DARK, .2 + ((i + j) & 1) * .05, i, j) : (u * fw < 2 || v * fh < 2 || u * fw > fw - 2 || v * fh > fh - 2) ? ramp(PAL.CHROME, .7, i, j) : b(u, v, i, j); } });
      for (const x of [Sc.x0 - 4, Sc.x1 + 4]) X.disc(L, [x, Sc.y1 + 4, Sc.z - 2.5], 2, () => { X.SH.fl = F_EMIT; return NEONC.cyan; }, { id }); }
    // ============ БАР НА ЗАДНІЙ СТІНІ ПРАВОРУЧ ВІД DJ (06.11, власник: «попрацюй бар, алкоголь увесь різноманітний») ============
    // фронтально: вітрина на 3 полиці з 30 унікальними пляшками (10 форм × кольори × етикетки × пробки), дзеркало, підсвітка
    // полиць, вивіска «БАР», стійка зі стьобаною шкірою, хромом, LED-низом і латунним поручнем, 3 стільці, крани, шейкер, лід,
    // лимони, келихи, кулер, каса, підвісна полиця з келихами над стійкою, 3 лампи
    { const B = GEO.bar, bw = B.x1 - B.x0;
      const Bk = B.back, zm = Bk.z0 - .4; ++id; box(L, id, B.x0 - 10, B.x1 + 10, Bk.y0, FLY, Bk.z0, Bk.z1, { front: (q, w, h) => (u, v, i, j) => (u * w < 6 || u * w > w - 6 || v * h < 6 || v * h > h - 60) ? bevel(PAL.MET, q, w, h, 2)(u, v, i, j) : ramp(PAL.CHROME, .16 + Math.sin((u * 2.5 + v) * 6.283) * .07, i, j), top: mBevel(PAL.MET, 2), left: mBevel(PAL.MET, 2), right: mBevel(PAL.MET, 2) });   // задній бар: шафа зі сталевою рамою й дзеркалом
      // вивіска «БАР»: неоновий текст у рамці над вітриною
      ++id; box(L, id, B.x0 + bw / 2 - 60, B.x0 + bw / 2 + 60, Bk.y0 - 34, Bk.y0 - 4, Bk.z0, Bk.z0 + 8, { all: mBevel(PAL.STEEL, 2), front: (q, fw, fh) => { const base = bevel(PAL.STEEL, q - .1, fw, fh, 2), t = tex(Math.round(fw), Math.round(fh), (c, W, H) => { c.strokeStyle = '#ff4fd8'; c.strokeRect(2.5, 2.5, W - 5, H - 5); for (const [dx, dy, cc] of [[-1, 0, '#8a1a7a'], [1, 0, '#8a1a7a'], [0, 0, '#fff0fb']]) P.text(c, NX.t('party.bar'), W / 2 + dx, H / 2 + 7 + dy, cc, 18, 'center'); }); return (u, v, i, j) => { const cc = t(u, v); if (!cc) return base(u, v, i, j); X.SH.fl = F_EMIT; return cc; }; } });
      // ЕТАЛОН ЯКОСТІ (14.11, аудит: «пляшки заввишки з бармена й зливаються, келихи — білі квадрати»): пляшки в масштабі героя
      // (0.55 від колишнього: 19–38 од. при зрості героя ~48), 18 на полиці = 54 унікальні (форма × колір скла), етикетка проста —
      // на малому розмірі дрібний малюнок читався як «очі». Форма (10), колір (12), етикетка (4), пробка (3), декор (фольга / стрічка / сургуч).
      const GLASS = [NEONC.gold, NEONC.orange, col('#b8602a'), col('#2a8a3a'), NEONC.cyan, col('#f0f0ff'), NEONC.pink, col('#7a2a9a'), col('#c8302a'), col('#3bff8a'), col('#4a6aff'), col('#e8c060')];
      const SHAPE = [                                                                                 // силует (u, v) -> чи є скло; h — висота, w — ширина
        { h: 52, w: 22, f: (u, v) => v < .3 ? Math.abs(u - .5) < .16 : Math.abs(u - .5) < .5 - Math.max(0, v - .88) * 3 },                                       // 0 коньяк (пузата)
        { h: 56, w: 20, f: (u, v) => v < .16 ? Math.abs(u - .5) < .2 : Math.abs(u - .5) < .5 },                                                                  // 1 віскі (квадратна, широкі плечі)
        { h: 62, w: 16, f: (u, v) => v < .42 ? Math.abs(u - .5) < .17 : Math.abs(u - .5) < .5 - Math.max(0, .5 - v) * .6 },                                       // 2 вино (довга шийка)
        { h: 34, w: 24, f: (u, v) => v < .22 ? Math.abs(u - .5) < .18 : Math.abs(u - .5) < .5 - Math.abs(v - .6) * .3 },                                         // 3 фляга (низька, бочком)
        { h: 60, w: 18, f: (u, v) => v < .36 ? Math.abs(u - .5) < .16 + v * .35 : Math.abs(u - .5) < .5 },                                                       // 4 шампанське
        { h: 50, w: 18, f: (u, v) => v < .08 ? Math.hypot(u - .5, (v - .04) * 2) < .22 : v < .22 ? Math.abs(u - .5) < .13 : Math.abs(u - .5) < .5 },              // 5 джин (кулька-пробка)
        { h: 54, w: 24, f: (u, v) => Math.abs(u - .5) < .08 + v * .42 },                                                                                          // 6 лікер (трикутна)
        { h: 58, w: 26, f: (u, v) => v < .4 ? Math.abs(u - .5) < .1 : Math.hypot(u - .5, (v - .7) * 1.2) < .5 },                                                  // 7 графин (куля на довгій шийці)
        { h: 70, w: 14, f: (u, v) => v < .3 ? Math.abs(u - .5) < .22 : Math.abs(u - .5) < .5 },                                                                  // 8 абсент (дуже висока вузька)
        { h: 44, w: 28, f: (u, v) => v < .2 ? Math.abs(u - .5) < .14 : Math.hypot(u - .5, (v - .62) * 1.3) < .5 },                                                // 9 бутель (куля з ручкою)
      ];
      const NB = 18, BSC = .55; let bi = 0; B.shelf.y.forEach((sy, k) => { ++id; box(L, id, B.x0 - 4, B.x1 + 4, sy, sy + 5, B.shelf.z0, B.shelf.z1, { all: mBevel(PAL.MET, 1), front: (q, w, h) => (u, v, i, j) => { X.SH.fl = F_EMIT; return v > .5 ? mixc(NEONC.cyan, NEONC.white, .2) : ramp(PAL.MET, .6, i, j); }, bottom: (q) => (u, v, i, j) => { X.SH.fl = F_EMIT; return mixc(NEONC.cyan, NEONC.white, .15); } });   // полиця з LED-кромкою й підсвіткою знизу
        for (let b = 0; b < NB; b++, bi++) { const sh = SHAPE[bi % 10], c = GLASS[(bi * 7) % 12], lab = bi % 4, cap = bi % 3, deco = (bi * 7) % 5, x = B.x0 + 16 + b * (bw - 32) / (NB - 1), z = B.shelf.z1 - 14 + (b % 2) * 5, w0 = Math.round(sh.w * BSC), h0 = Math.round(sh.h * BSC); ++id;
          X.face(L, [[x - w0 / 2 - 2, sy - h0 * .95, zm], [x + w0 / 2 + 2, sy - h0 * .95, zm], [x + w0 / 2 + 2, sy, zm], [x - w0 / 2 - 2, sy, zm]], [x - w0 / 2 - 2, sy - h0 * .95, zm], [w0 + 4, 0, 0], [0, h0 * .95, 0], (u, v) => sh.f(u, v) ? dim(mixc(c, col('#1a1c40'), .55), .5) : 0, { id, n: [0, 0, -1] });   // відбиття в дзеркалі
          box(L, id, x - w0 / 2, x + w0 / 2, sy - h0, sy, z - w0 / 2, z + w0 / 2, { all: (q, w, h) => (u, v, i, j) => { if (!sh.f(u, v)) return 0; X.SH.fl = F_EMIT; const du = u - .5;
            if (v < .05) return cap === 0 ? ramp(PAL.GOLD, .75, i, j) : cap === 1 ? ramp(PAL.CHROME, .8, i, j) : ramp(PAL.WOOD, .65, i, j);                                                       // пробка: золота / хромова / корок
            if (deco === 1 && v < .28) return ramp(PAL.GOLD, .65 + (du < -.1 ? .2 : 0), i, j);                                                                                                    // фольга
            if (deco === 2 && v > .3 && v < .36) return col('#c81e3c');                                                                                                                             // стрічка
            if (deco === 3 && v > .08 && v < .16 && Math.abs(du) < .12) return col('#8a1020');                                                                                                      // сургуч
            const inLab = lab === 0 ? (v > .45 && v < .74 && Math.abs(du) < .34) : lab === 1 ? (v > .5 && v < .66 && Math.abs(du) < .5) : lab === 2 ? (Math.abs(du) * 1.4 + Math.abs(v - .6) * 2.2 < .4) : (Math.hypot(du * 1.3, (v - .6) * 2.4) < .32);   // прямокутна / смуга / ромб / овал
            if (inLab) { const dark = (bi & 1) === 1; return (v > .57 && v < .63) ? mixc(c, NEONC.white, dark ? .45 : .1) : dark ? col('#1a1030') : rgb(240, 236, 220); }   // етикетка: суцільна з однією смужкою кольору скла
            const hi = du < -.22 ? .42 : du > .3 ? -.05 : .08, liquid = v > .4 ? 1 : .65; return mixc(dim(c, .55 + .35 * liquid), NEONC.white, hi); } }); } });
      // стійка: стьобана шкіра + хромовані ребра + LED-низ, глянцевий верх із хромовою кромкою, рожевий неон, латунний поручень, 3 стільці
      const quilt = (q, w, h) => (u, v, i, j) => { const x = u * w, y = v * h; if (y > h - 6) { X.SH.fl = F_EMIT; return y > h - 4 ? NEONC.cyan : dim(NEONC.cyan, .5); } if (x % 24 < 2.5) return ramp(PAL.CHROME, .6 + (x % 24 < 1 ? .25 : 0), i, j);
        const cx = (x % 24) / 24 - .5, cy = ((y - 4) % 14) / 14 - .5, d = Math.hypot(cx * 1.6, cy * 2.2); return ramp(PAL.PLUM, .62 - d * .55 + (cy < -.25 ? .12 : 0) + (Math.abs(cx) > .44 || Math.abs(cy) > .42 ? -.25 : 0), i, j); };
      ++id; box(L, id, B.x0, B.x1, B.y0, FLY, B.z0, B.z1, { front: quilt, left: quilt, right: quilt, top: (q, w, h) => (u, v, i, j) => { X.SH.fl = F_GLOSS; const x = u * w, z = v * h; return (x < 2 || x > w - 2 || z < 2) ? ramp(PAL.CHROME, .75, i, j) : ramp(PAL.TOP, .55 + (hash(Math.floor(x / 6), Math.floor(z / 6)) - .5) * .08 - v * .15, i, j); } });
      ++id; box(L, id, B.x0 - 3, B.x1 + 3, B.y0 - 4, B.y0, B.z0 - 3, B.z1, { front: mNeon(NEONC.pink, .7), left: mNeon(NEONC.pink, .7), right: mNeon(NEONC.pink, .7), top: mFlat(PAL.CHROME, .8) });
      ++id; X.tube(L, [B.x0 - 10, FLY - 18, B.z0 - 14], [B.x1 + 10, FLY - 18, B.z0 - 14], 3, (u) => ramp(PAL.GOLD, .55 + (Math.abs(u - .5) < .2 ? .3 : 0), 0, 0), { id }); for (const x of [B.x0 + 10, B.x0 + bw / 2, B.x1 - 10]) X.tube(L, [x, FLY - 18, B.z0 - 14], [x, FLY - 2, B.z0 - 4], 2, () => ramp(PAL.GOLD, .5, 0, 0), { id });
      [B.x0 + 50, B.x0 + bw / 2, B.x1 - 50].forEach(x => { const z = B.z0 - 40; ++id; X.disc(L, [x, FLY - 1, z], 14, (u, v) => { const d = Math.hypot(u - .5, (v - .5) * 3); return d > .5 ? 0 : ramp(PAL.CHROME, .5 + (d < .2 ? .3 : 0), 0, 0); }, { id }); X.tube(L, [x, FLY - 2, z], [x, FLY - 40, z], 4, (u) => ramp(PAL.CHROME, .45 + (Math.abs(u - .5) < .2 ? .35 : 0), 0, 0), { id });
        box(L, id, x - 14, x + 14, FLY - 50, FLY - 40, z - 14, z + 14, { all: (q, w, h) => (u, v, i, j) => v < .25 ? mixc(NEONC.pink, NEONC.white, u < .3 ? .4 : .15) : ramp(PAL.PINK, .55 - v * .3, i, j) }); X.tube(L, [x - 12, FLY - 40, z], [x + 12, FLY - 40, z], 2, () => ramp(PAL.CHROME, .7, 0, 0), { id }); });
      // на стійці: крани, шейкер, відро з льодом, лимони, келихи з льодом і парасольками, кулер, каса
      { const zt = B.z0 + 26, y = B.y0; ++id; box(L, id, B.x0 + 30, B.x0 + 54, y - 30, y, zt - 8, zt + 8, { all: mBevel(PAL.CHROME, 1) }); [0, 1, 2].forEach(k => { const x = B.x0 + 32 + k * 10; X.tube(L, [x, y - 30, zt - 8], [x, y - 36, zt - 20], 2.5, () => ramp(PAL.CHROME, .7, 0, 0), { id }); X.disc(L, [x, y - 38, zt - 21], 3, () => [NEONC.pink, NEONC.gold, NEONC.green][k], { id }); });
        ++id; box(L, id, B.x0 + 70, B.x0 + 84, y - 26, y, zt - 7, zt + 7, { all: (q, w, h) => (u, v, i, j) => ramp(PAL.CHROME, .5 + (u < .35 ? .3 : 0) + (v < .2 ? .15 : 0), i, j) });
        ++id; box(L, id, B.x0 + 96, B.x0 + 124, y - 18, y, zt - 14, zt + 14, { all: (q, w, h) => (u, v, i, j) => v < .25 ? rgb(220, 240, 255, 230) : ramp(PAL.CHROME, .45 + (u < .3 ? .25 : 0), i, j) }); for (let k = 0; k < 5; k++) X.disc(L, [B.x0 + 100 + k * 5, y - 20, zt - 14.5 + (k % 2) * 4], 2.5, () => rgb(225, 245, 255, 200), { id });
        ++id; box(L, id, B.x0 + 134, B.x0 + 162, y - 10, y, zt - 14, zt + 14, { all: (q, w, h) => (u, v, i, j) => v > .6 ? ramp(PAL.CERAM, .6 - v * .3, i, j) : 0 }); for (let k = 0; k < 4; k++) X.disc(L, [B.x0 + 140 + k * 6, y - 12, zt - 14.5 + (k % 2) * 6], 3.5, (u, v) => { const d = Math.hypot(u - .5, v - .5); return mixc(NEONC.gold, NEONC.white, d < .2 ? .5 : .1); }, { id });
        [['gold', 0], ['cyan', 1], ['orange', 2], ['pink', 3]].forEach(([cn, k]) => { const x = B.x0 + 176 + k * 20; ++id; box(L, id, x - 7, x + 7, y - 22, y, zt - 7, zt + 7, { front: (q) => (u, v, i, j) => v < .65 ? mixc(NEONC[cn], NEONC.white, u < .3 ? .5 : .15) : ramp(PAL.CHROME, .7, i, j), left: (q) => (u, v, i, j) => v < .65 ? dim(NEONC[cn], .8) : ramp(PAL.CHROME, .5, i, j), right: (q) => (u, v, i, j) => v < .65 ? dim(NEONC[cn], .7) : ramp(PAL.CHROME, .5, i, j), top: mFlat(PAL.CHROME, .9) });
          X.tube(L, [x + 2, y - 22, zt], [x + 8, y - 34, zt], 1.5, () => NEONC.pink, { id }); X.disc(L, [x - 3, y - 26, zt - 8], 4, (u, v) => v > .5 ? 0 : mixc(NEONC.green, NEONC.white, .2), { id }); for (let m = 0; m < 2; m++) X.disc(L, [x - 2 + m * 4, y - 14 - m * 3, zt - 7.5], 1.8, () => rgb(235, 248, 255, 220), { id }); });
        ++id; box(L, id, B.x1 - 50, B.x1 - 8, y - 16, y, zt - 12, zt + 12, { all: (q, w, h) => (u, v, i, j) => { X.SH.fl = F_EMIT; return v < .3 ? rgb(200, 240, 255, 230) : mixc(NEONC.cyan, col('#0a0626'), .55 + v * .3); } }); for (let k = 0; k < 4; k++) box(L, id, B.x1 - 46 + k * 10, B.x1 - 40 + k * 10, y - 30, y - 14, zt - 3, zt + 3, { all: (q) => (u, v, i, j) => { X.SH.fl = F_EMIT; return v < .25 ? ramp(PAL.GOLD, .6, i, j) : [NEONC.green, NEONC.gold, NEONC.orange, col('#b8602a')][k]; } });
        ++id; box(L, id, B.x0 + 4, B.x0 + 28, y - 22, y, zt - 12, zt + 12, { all: mBevel(PAL.MET, 1), front: (q, w, h) => (u, v, i, j) => (v < .45 && u > .15 && u < .85) ? ((v < .4 && v > .1) ? mixc(NEONC.green, col('#0a0626'), .3) : ramp(PAL.MET, q, i, j)) : bevel(PAL.MET, q, w, h, 1)(u, v, i, j) }); }
      // підвісна полиця з келихами догори дном над стійкою; 3 лампи
      // підвісна рейка з келихами догори дном — вище верхньої полиці (була на рівні середньої й закривала пляшки білими квадратами);
      // келих — справжній силует: ніжка-диск, тонка ніжка, чаша, що розширюється донизу, напівпрозоре скло з відблиском
      { const ry = 138, zr = B.z0 + 22; ++id; box(L, id, B.x0 + 24, B.x1 - 24, ry, ry + 3, zr - 5, zr + 5, { all: mBevel(PAL.CHROME, 1), bottom: mFlat(PAL.CHROME, .5) }); for (const x of [B.x0 + 30, B.x0 + bw / 2, B.x1 - 30]) X.tube(L, [x, CEIL, zr], [x, ry, zr], 1.5, () => ramp(PAL.STEEL, .5, 0, 0), { id });
        const NG = 16, gw = 9, gh = 15; for (let k = 0; k < NG; k++) { const x = B.x0 + 36 + k * (bw - 72) / (NG - 1), y0 = ry + 3; ++id;
          X.face(L, [[x - gw / 2, y0, zr], [x + gw / 2, y0, zr], [x + gw / 2, y0 + gh, zr], [x - gw / 2, y0 + gh, zr]], [x - gw / 2, y0, zr], [gw, 0, 0], [0, gh, 0], (u, v) => { const du = Math.abs(u - .5);
            if (v < .1) return du < .38 ? rgb(225, 240, 255, 210) : 0; if (v < .46) return du < .09 ? rgb(215, 235, 255, 200) : 0;                                       // ніжка-диск, ніжка
            const wd = .14 + (v - .46) * .68; if (du > wd) return 0; X.SH.fl = F_EMIT; return v > .93 || du > wd - .1 ? rgb(235, 246, 255, 220) : u < .42 ? rgb(210, 235, 255, 130) : rgb(150, 190, 240, 70); }, { id, n: [0, 0, -1] }); } }
      [B.x0 + 40, B.x0 + bw / 2, B.x1 - 40].forEach(x => { const z = B.z0 - 10; ++id; X.tube(L, [x, CEIL, z], [x, CEIL + 70, z], 1.5, () => ramp(PAL.STEEL, .5, 0, 0), { id }); X.face(L, [[x - 16, CEIL + 88, z], [x + 16, CEIL + 88, z], [x + 4, CEIL + 70, z], [x - 4, CEIL + 70, z]], [x - 16, CEIL + 88, z], [32, 0, 0], [0, -18, 0], (u, v, i2, j2) => ramp(PAL.GOLD, .4 + (u < .5 ? .2 : -.1) * (1 - v), i2, j2), { id, n: [0, 0, -1] }); X.disc(L, [x, CEIL + 90, z - .5], 4, (u, v) => { X.SH.fl = F_EMIT; return Math.hypot(u - .5, v - .5) < .25 ? NEONC.white : NEONC.gold; }, { id }); });
    }
    // ============ ФУРШЕТ НА ЗАДНІЙ СТІНІ ЛІВОРУЧ ВІД DJ (06.11, власник: «стіл з їдою — попрацюй добре») ============
    { const C = GEO.snack, T0 = C.y0;
      // 22–23.11 (власник: «покращити фуршет», потім «якість погана, допрацюй»): ШІСТЬ ВЕЛИКИХ страв в один ряд, кожна окремим
      // предметом: піца на підставці, двоярусна вежа з кексами, ваза з фруктами, вежа сендвічів, диспенсер із соком,
      // відро попкорну. Страви — піксельні спрайти лицем до глядача (tex: лише прямокутники, 1 од. = 1 піксель): у кожної темний
      // контур, три тони (тінь / колір / світло) і відблиск зверху-зліва. Щоб золоте світло фуршету не випалювало кольори добіла,
      // спрайти й стіл наперед компенсують запечене світло (LC) — у растрі лишається лише легкий теплий відтінок.
      const LC = (x, y, z) => lightAt(x, y, z).map(v => (1 + (v - 1) * .2) / v), tn = (cc, k) => rgb(Math.min(255, X.R_(cc) * k[0]), Math.min(255, X.G_(cc) * k[1]), Math.min(255, X.B_(cc) * k[2]));
      const zm = (C.z0 + C.z1) / 2, DISH = [[31, 30], [88, 26], [143, 27], [192, 20], [231, 17], [267, 17], [301, 15]];   // центри й півширини страв (тіні на скатертині)
      // 23.11 (власник: «скатертина зовсім не подобається… стіл роби неоновий»): НЕОНОВИЙ СТІЛ у парі до бару — темна глянцева
      // стільниця з золотою LED-кромкою, царга з бірюзовою неоновою ниткою, чотири хромовані ніжки зі світними п'ятами, поперечка;
      // під столом видно підлогу. Кольори наперед компенсують запечене світло (LC), як і спрайти страв.
      const kF = LC((C.x0 + C.x1) / 2, T0 + 8, C.z0), kT = LC((C.x0 + C.x1) / 2, T0, zm), TB = ['#5a48a8', '#3a2a7c', '#281a5c', '#1a1040', '#0e0828'].map(col);
      ++id; box(L, id, C.x0, C.x1, T0, T0 + 5, C.z0, C.z1, {
        top: (q, w, h) => (u, v, i, j) => { const x = u * w;
          for (const [cx, hw] of DISH) if (((x - cx) / (hw + 2)) ** 2 + ((v - .5) / .34) ** 2 < 1) return tn(TB[4], kT);                    // тінь під стравою
          if (v > .9 || u < .006 || u > .994) return tn(TB[0], kT);                                                                         // світла фаска по краю
          return tn(TB[((x + v * 40) % 46 < 5 || (x + v * 40) % 46 > 40) ? 1 : 2], kT); },                                                    // глянець: скісні відблиски
        front: (q, w, h) => (u, v, i, j) => { const y = v * h; if (y >= 2.5) { X.SH.fl = F_EMIT; return y < 3.6 ? mixc(NEONC.gold, NEONC.white, .5) : NEONC.gold; } return tn(TB[y < 1 ? 0 : 2], kF); },
        left: mFlat(PAL.PLUM, .3), right: mFlat(PAL.PLUM, .3), bottom: mFlat(PAL.PLUM, .1) });
      ++id; box(L, id, C.x0 + 8, C.x1 - 8, T0 + 5, T0 + 13, C.z0 + 5, C.z1 - 5, { front: (q, w, h) => (u, v, i, j) => { const y = v * h, x = u * w; if (y > 3.5 && y < 5 && x > 6 && x < w - 6 && (x % 24) < 18) { X.SH.fl = F_EMIT; return NEONC.cyan; } return tn(TB[y < 1.2 ? 4 : 3], kF); }, left: mFlat(PAL.PLUM, .2), right: mFlat(PAL.PLUM, .2), bottom: mFlat(PAL.PLUM, .08) });   // царга з неоновою ниткою
      ++id; for (const lx of [C.x0 + 10, C.x1 - 16]) for (const lz of [C.z0 + 6, C.z1 - 12]) { box(L, id, lx, lx + 6, T0 + 13, FLY - 2, lz, lz + 6, { all: mBevel(PAL.CHROME, 1) }); box(L, id, lx - 1, lx + 7, FLY - 2, FLY, lz - 1, lz + 7, { all: (q, w, h) => (u, v) => { X.SH.fl = F_EMIT; return NEONC.gold; } }); }   // ніжки й світні п'яти
      ++id; box(L, id, C.x0 + 16, C.x1 - 16, FLY - 13, FLY - 10, C.z0 + 8, C.z0 + 10, { all: mBevel(PAL.CHROME, 1) });                         // поперечка
      const O = '#231036';                                                                                            // колір контуру
      const R = (c, x, y, w, h, cc) => { c.fillStyle = cc; c.fillRect(Math.round(x), Math.round(y), Math.round(w), Math.round(h)); };
      /** Піксельний еліпс рядками (без згладжування); half: -1 — лише верхня половина, 1 — лише нижня. */
      const EL = (c, cx, cy, rx, ry, cc, half = 0) => { for (let dy = (half > 0 ? 0 : -Math.round(ry)); dy <= (half < 0 ? 0 : Math.round(ry)); dy++) { const w = Math.round(rx * Math.sqrt(Math.max(0, 1 - (dy / ry) ** 2))); if (w > 0) R(c, cx - w, cy + dy, w * 2, 1, cc); } };
      const LN = (c, x0, y0, x1, y1, cc) => { const n = Math.max(Math.abs(x1 - x0), Math.abs(y1 - y0)) || 1; for (let k = 0; k <= n; k++) R(c, x0 + (x1 - x0) * k / n, y0 + (y1 - y0) * k / n, 1, 1, cc); };
      /** Кругла річ з об'ємом: контур, тінь знизу-справа, колір, світла пляма й відблиск зверху-зліва. T = [тінь, колір, світло]. */
      const ball = (c, cx, cy, rx, ry, T) => { EL(c, cx, cy, rx + 1, ry + 1, O); EL(c, cx, cy, rx, ry, T[0]); EL(c, cx - 1, cy - 1, rx - 1, ry - 1, T[1]); EL(c, cx - Math.round(rx * .35), cy - Math.round(ry * .4), Math.max(1, rx * .45), Math.max(1, ry * .4), T[2]); };
      /** Спрайт страви: низ стоїть на стільниці, x0 — лівий край, w × h — розмір у од.; emit(px, py) — які пікселі світяться. */
      const spr = (x0, w, h, z, paint, emit) => { ++id; const t = tex(w, h, paint), y0 = T0 - h, k = LC(x0 + w / 2, T0 - h / 2, z); X.face(L, [[x0, y0, z], [x0 + w, y0, z], [x0 + w, T0, z], [x0, T0, z]], [x0, y0, z], [w, 0, 0], [0, h, 0], (u, v) => { const cc = t(u, v); if (!cc) return 0; if (emit && emit(u * w, v * h)) { X.SH.fl = F_EMIT; return cc; } return tn(cc, k); }, { id, n: [0, 0, -1] }); };
      // 1. ПІЦА на круглій дошці, що стоїть на хромованій підставці й нахилена до глядача: скоринка, сир, пепероні, базилік, розрізи
      spr(C.x0 + 1, 60, 46, zm, (c) => {
        R(c, 13, 34, 3, 11, '#555f8c'); R(c, 13, 34, 1, 11, '#bcc5e6'); R(c, 44, 34, 3, 11, '#555f8c'); R(c, 44, 34, 1, 11, '#bcc5e6'); R(c, 8, 43, 44, 3, O); R(c, 9, 43, 42, 2, '#848db4'); R(c, 9, 43, 42, 1, '#eef2ff');   // підставка
        EL(c, 30, 22, 30, 20, O); EL(c, 30, 22, 29, 19, '#5a3018'); EL(c, 30, 20, 29, 19, '#8a5630'); EL(c, 29, 19, 27, 17, '#a86c3c');                  // дошка з товщиною
        EL(c, 30, 20, 25, 16, '#9a5a1c'); EL(c, 30, 19, 25, 16, '#d8943c'); EL(c, 29, 18, 24, 15, '#f2b65a'); EL(c, 26, 15, 19, 10, '#ffd486');          // скоринка: тінь, колір, світло
        EL(c, 30, 19, 21, 12, '#e09a24'); EL(c, 30, 19, 20, 11, '#ffc83c'); EL(c, 29, 18, 19, 10, '#ffd95e');                                            // сир
        for (const [x, y, rx] of [[20, 13, 5], [37, 12, 6], [27, 23, 6], [41, 21, 4], [14, 20, 3]]) EL(c, x, y, rx, 2, '#ffeb9c');                       // світлі плями сиру
        for (const a of [.35, 1.4, 2.45]) LN(c, 30 - Math.cos(a) * 20, 19 - Math.sin(a) * 11, 30 + Math.cos(a) * 20, 19 + Math.sin(a) * 11, '#d08a1e'); // розрізи
        for (const [x, y] of [[18, 15], [31, 11], [42, 16], [23, 23], [37, 25], [13, 21], [46, 22], [29, 18]]) { EL(c, x, y, 4, 3, '#7a1418'); EL(c, x, y - 1, 3, 2, '#d8382c'); R(c, x - 2, y - 2, 2, 1, '#ff8a70'); }   // пепероні
        for (const [x, y] of [[25, 14], [35, 20], [17, 19], [42, 11], [29, 26], [38, 15]]) { R(c, x, y, 3, 2, '#1f7a34'); R(c, x + 1, y, 2, 1, '#5ad468'); } });   // базилік
      // 2. ВЕЖА З КЕКСАМИ: дві лілові тарілки на хромованій ніжці (4 + 2 кекси), у кожного кекса паперова формочка зі складками,
      // закручений крем свого кольору з відблиском і вишенька; золота зірка зверху
      spr(C.x0 + 62, 52, 66, zm, (c) => { const FR = [['#c8389a', '#ff7ad0', '#ffc4ec'], ['#2a9cc8', '#6ae0ff', '#d0f8ff'], ['#d89a20', '#ffd45a', '#fff2b8'], ['#7a52d0', '#b894ff', '#e6d8ff'], ['#2aa868', '#74ecac', '#d0ffe6'], ['#d85a30', '#ff9a66', '#ffd8c0']];
        const cup = (x, y, T) => { R(c, x, y - 7, 12, 8, O); R(c, x + 1, y - 6, 10, 6, '#a8623c'); R(c, x + 1, y - 6, 10, 1, '#e0a070'); for (const k of [3, 6, 9]) R(c, x + k, y - 5, 1, 5, '#6e3820'); R(c, x + 1, y - 1, 10, 1, '#6e3820');
          c.clearRect(x, y - 2, 1, 3); c.clearRect(x + 11, y - 2, 1, 3); c.clearRect(x + 1, y, 1, 1); c.clearRect(x + 10, y, 1, 1);                       // формочка звужується донизу
          EL(c, x + 6, y - 9, 7, 4, O); EL(c, x + 6, y - 9, 6, 3, T[0]); EL(c, x + 5, y - 10, 5, 2, T[1]); EL(c, x + 6, y - 12, 5, 3, O); EL(c, x + 6, y - 12, 4, 2, T[0]); EL(c, x + 5, y - 13, 3, 1, T[1]);
          EL(c, x + 6, y - 15, 3, 2, O); EL(c, x + 6, y - 15, 2, 1, T[1]); R(c, x + 2, y - 11, 3, 1, T[2]); R(c, x + 3, y - 14, 2, 1, T[2]);
          R(c, x + 4, y - 19, 4, 4, O); R(c, x + 5, y - 18, 2, 2, '#e02440'); R(c, x + 5, y - 18, 1, 1, '#ffa8b4'); };
        R(c, 24, 6, 5, 58, O); R(c, 25, 6, 3, 58, '#848db4'); R(c, 25, 6, 1, 58, '#eef2ff');                                                             // ніжка
        R(c, 25, 0, 3, 7, '#ffcf4a'); R(c, 23, 2, 7, 3, '#ffcf4a'); R(c, 26, 1, 1, 2, '#fff6c8'); R(c, 16, 62, 21, 4, O); R(c, 17, 62, 19, 3, '#848db4'); R(c, 17, 62, 19, 1, '#eef2ff');   // зірка, основа
        for (const [y, rx, xs] of [[36, 16, [13, 27]], [60, 25, [1, 14, 27, 40]]]) { EL(c, 26, y + 1, rx + 1, 3, O); EL(c, 26, y, rx, 2, '#6a4cc0'); EL(c, 26, y - 1, rx, 2, '#a88cf0'); R(c, 26 - rx + 4, y - 2, rx, 1, '#e2d4ff'); xs.forEach((x, k) => cup(x, y - 1, FR[(k * 2 + rx) % 6])); } });
      // 3. ВАЗА З ФРУКТАМИ: бірюзова чаша на ніжці; скибка кавуна, апельсин, зелене яблуко, банан, гроно винограду через край
      spr(C.x0 + 116, 54, 50, zm, (c) => {
        for (const [cy, T] of [[16, ['#d8a01c', '#ffd83a', '#fff4a8']]]) { for (let y = 0; y < 30; y++) for (let x = 8; x < 54; x++) { const a = ((x - 33) / 19) ** 2 + ((y - cy) / 13) ** 2, b = ((x - 33) / 18) ** 2 + ((y - cy - 8) / 13) ** 2, a2 = ((x - 33) / 20) ** 2 + ((y - cy) / 14) ** 2, b2 = ((x - 33) / 17) ** 2 + ((y - cy - 9) / 12) ** 2;
            if (a <= 1 && b > 1) R(c, x, y, 1, 1, y < cy - 10 ? T[2] : y < cy - 5 ? T[1] : T[0]); else if (a2 <= 1 && b2 > 1) R(c, x, y, 1, 1, O); } R(c, 14, cy - 1, 3, 3, '#5a3a18'); R(c, 50, cy - 1, 3, 3, '#5a3a18'); }   // банан
        EL(c, 14, 29, 14, 14, O, -1); EL(c, 14, 29, 13, 13, '#1f8a40', -1); EL(c, 14, 29, 11, 11, '#d8f6c4', -1); EL(c, 14, 29, 10, 10, '#e83a54', -1); EL(c, 12, 27, 7, 6, '#ff6e80', -1); for (const [x, y] of [[9, 24], [14, 22], [19, 25], [12, 27], [17, 28]]) R(c, x, y, 1, 2, '#3a0c1c');   // кавун
        ball(c, 30, 24, 8, 8, ['#c8641a', '#ff962a', '#ffc878']); R(c, 30, 17, 2, 1, '#7a4a14');                                                          // апельсин
        ball(c, 43, 25, 7, 7, ['#3a8a24', '#6cc83c', '#c0f28a']); R(c, 43, 15, 1, 4, '#5a3a18'); R(c, 44, 15, 4, 2, '#2e9a40');                           // яблуко
        EL(c, 27, 30, 27, 15, O, 1); EL(c, 27, 30, 26, 14, '#14607e', 1); EL(c, 26, 30, 25, 13, '#2496be', 1); EL(c, 20, 30, 15, 9, '#58cdea', 1); EL(c, 16, 31, 8, 4, '#a8f0ff', 1);   // чаша
        R(c, 0, 28, 54, 4, O); R(c, 1, 29, 52, 2, '#58cdea'); R(c, 1, 29, 52, 1, '#c8f8ff'); for (let x = 6; x < 50; x += 6) R(c, x, 36 + (x % 12 ? 0 : 2), 2, 2, '#c8f8ff');   // обідок і візерунок
        R(c, 20, 44, 14, 3, O); R(c, 21, 44, 12, 2, '#14607e'); R(c, 15, 46, 24, 4, O); R(c, 16, 47, 22, 2, '#2496be'); R(c, 16, 47, 22, 1, '#58cdea');   // ніжка
        for (const [x, y] of [[44, 31], [49, 32], [42, 35], [47, 36], [51, 37], [45, 40], [49, 41], [47, 44]]) { EL(c, x, y, 3, 3, O); EL(c, x, y, 2, 2, '#6a30b8'); R(c, x - 1, y - 1, 2, 2, '#a070e8'); R(c, x - 1, y - 1, 1, 1, '#e0c8ff'); } });   // виноград
      // 4. ВЕЖА СЕНДВІЧІВ на дошці: три сендвічі зі зсувом (хліб, салат, томат, сир, шинка, хліб), шпажка з прапорцем і оливкою
      spr(C.x0 + 172, 40, 54, zm, (c) => { R(c, 0, 50, 40, 4, O); R(c, 1, 50, 38, 3, '#7a4a28'); R(c, 1, 50, 38, 1, '#b07a4a');
        [[5, 37], [3, 24], [6, 11]].forEach(([x, y]) => { R(c, x - 2, y - 1, 34, 15, O); R(c, x, y, 30, 3, '#eccb8c'); R(c, x + 1, y, 28, 1, '#fff0c4'); R(c, x, y + 2, 30, 1, '#c8964c');
          for (let i = 0; i < 32; i++) R(c, x - 1 + i, y + 3 + (i % 4 < 2 ? 0 : 1), 1, 2, i % 4 < 2 ? '#6ee070' : '#2e9a40');
          R(c, x, y + 5, 30, 2, '#d8302c'); R(c, x, y + 5, 30, 1, '#ff6c5c'); R(c, x - 1, y + 7, 32, 1, '#ffd23c'); R(c, x + 5, y + 8, 3, 1, '#ffd23c'); R(c, x + 19, y + 8, 4, 1, '#ffd23c');
          R(c, x, y + 8, 30, 2, '#e88a98'); R(c, x, y + 9, 30, 1, '#c86478'); R(c, x + 5, y + 8, 3, 1, '#ffd23c'); R(c, x + 19, y + 8, 4, 1, '#ffd23c'); R(c, x, y + 10, 30, 3, '#e0b874'); R(c, x, y + 12, 30, 1, '#a8742e'); });
        R(c, 19, 0, 3, 12, O); R(c, 20, 0, 1, 12, '#eef2ff'); R(c, 21, 0, 9, 7, O); R(c, 22, 1, 7, 5, '#ff4fd8'); R(c, 22, 1, 7, 1, '#ffa6ee'); EL(c, 20, 8, 3, 3, O); EL(c, 20, 8, 2, 2, '#5c8c2a'); R(c, 20, 7, 1, 1, '#d83a30'); });
      // 5. ДИСПЕНСЕР ІЗ СОКОМ: скляний циліндр на хромованій основі з краником, усередині сік зі скибками апельсина й льодом
      spr(C.x0 + 214, 34, 60, zm, (c) => { R(c, 13, 0, 8, 4, O); R(c, 14, 1, 6, 3, '#eef2ff'); R(c, 4, 3, 26, 7, O); R(c, 5, 4, 24, 5, '#bcc5e6'); R(c, 5, 4, 24, 1, '#ffffff'); R(c, 5, 8, 24, 1, '#555f8c');   // кришка
        R(c, 3, 9, 28, 38, O); R(c, 5, 10, 24, 5, '#4a3c78'); R(c, 5, 15, 24, 31, '#f08a1c'); R(c, 5, 15, 20, 31, '#ffa630'); R(c, 5, 15, 12, 31, '#ffb84a'); R(c, 5, 15, 24, 2, '#ffe08c');   // скло, порожній верх, сік трьома тонами, поверхня
        for (const [x, y] of [[9, 21], [19, 28], [11, 36]]) { EL(c, x + 3, y + 3, 4, 4, '#ffe9a4'); EL(c, x + 3, y + 3, 3, 3, '#ffb23c'); R(c, x + 3, y, 1, 7, '#ffe9a4'); R(c, x, y + 3, 7, 1, '#ffe9a4'); }   // скибки апельсина
        for (const [x, y] of [[20, 18], [8, 30], [22, 38]]) { R(c, x, y, 5, 5, '#ffe2b4'); R(c, x, y, 5, 1, '#ffffff'); R(c, x, y, 1, 5, '#ffffff'); }       // лід
        R(c, 6, 11, 2, 34, '#ffffff'); R(c, 9, 11, 1, 34, '#ffe0a8'); R(c, 27, 11, 2, 34, '#b85c14');                                                     // відблиск і тінь скла
        R(c, 1, 46, 32, 10, O); R(c, 2, 47, 30, 8, '#848db4'); R(c, 2, 47, 30, 2, '#eef2ff'); R(c, 2, 53, 30, 2, '#353b6a'); R(c, 13, 49, 8, 3, '#353b6a'); R(c, 15, 51, 4, 5, '#eef2ff'); R(c, 12, 47, 10, 2, '#ff4fd8');   // основа, краник, ручка
        R(c, 3, 55, 6, 5, O); R(c, 4, 55, 4, 4, '#848db4'); R(c, 25, 55, 6, 5, O); R(c, 26, 55, 4, 4, '#848db4'); }, (x, y) => y >= 15 && y < 17 && x > 4 && x < 29);   // світиться лише поверхня соку
      // 6. ВІДРО ПОПКОРНУ: смугасте відро з тінню праворуч, шапка попкорну з об'ємом
      spr(C.x0 + 286, 30, 44, zm, (c) => { for (let y = 16; y < 44; y++) { const k = (y - 16) / 28, x0 = Math.round(2 + k * 4), w = 26 - Math.round(k * 8); R(c, x0 - 1, y, w + 2, 1, O); for (let x = 0; x < w; x++) { const s = x / w, red = Math.floor(s * 7) % 2 === 0; R(c, x0 + x, y, 1, 1, red ? (s < .3 ? '#ff5e5e' : s < .7 ? '#e0323c' : '#a01a2c') : (s < .3 ? '#ffffff' : s < .7 ? '#e6def6' : '#b0a4d4')); } }
        R(c, 0, 14, 30, 4, O); R(c, 1, 15, 28, 2, '#ffffff'); R(c, 18, 15, 11, 2, '#c8bee6'); R(c, 5, 43, 20, 1, O);
        for (const [x, y, r] of [[5, 12, 4], [13, 11, 5], [21, 12, 4], [26, 13, 3], [9, 7, 4], [17, 6, 5], [23, 8, 3], [13, 3, 3]]) ball(c, x, y, r, r - 1, ['#d8b458', '#ffe9a0', '#fffbe0']); });
      // 7. СТАКАНЧИКИ (власник 23.11: «додай різних стаканчиків»): праворуч від диспенсера — високий келих із соком і соломинкою,
      // паперовий стакан із кришкою, коктейльний келих на ніжці, вежа з перевернутих паперових стаканів, низька склянка з рожевим
      spr(C.x0 + 250, 34, 30, zm, (c) => { const glass = (x, y, w, h, liq, lv) => { R(c, x - 1, y - 1, w + 2, h + 2, O); R(c, x, y, w, h, '#4a3c78'); R(c, x, y + h - lv, w, lv, liq[0]); R(c, x, y + h - lv, w - 1, lv, liq[1]); R(c, x, y + h - lv, w, 1, liq[2]); R(c, x, y, 1, h, '#ffffff'); R(c, x + w - 1, y, 1, h, '#2a2050'); };
        glass(1, 8, 6, 21, ['#d87a14', '#ffa630', '#ffe08c'], 16); LN(c, 6, 0, 3, 14, '#ff4fd8'); R(c, 6, 0, 3, 1, '#ff4fd8'); EL(c, 4, 15, 2, 2, '#ffe9a4');                 // високий келих: сік, соломинка, скибка
        for (let y = 12; y < 29; y++) { const k = (y - 12) / 17, w = 9 - Math.round(k * 2), x0 = 10 + Math.round(k); R(c, x0 - 1, y, w + 2, 1, O); for (let x = 0; x < w; x++) R(c, x0 + x, y, 1, 1, (y - 12) % 6 < 3 ? (x < 3 ? '#8af4ff' : x < 6 ? '#3be8ff' : '#1a9ac0') : (x < 3 ? '#ffffff' : x < 6 ? '#e6def6' : '#b0a4d4')); }
        R(c, 8, 9, 13, 4, O); R(c, 9, 10, 11, 2, '#f4f0ff'); R(c, 9, 10, 11, 1, '#ffffff'); R(c, 13, 3, 3, 7, O); R(c, 14, 3, 1, 7, '#3bff8a'); R(c, 9, 29, 11, 1, O);                    // паперовий стакан: кришка, соломинка
        for (let y = 9; y < 17; y++) { const hw = Math.round(6 - (y - 9) * .75); R(c, 26 - hw - 1, y, hw * 2 + 2, 1, O); R(c, 26 - hw, y, hw * 2, 1, y < 11 ? '#4a3c78' : '#1ab8d8'); if (y >= 11) R(c, 26 - hw, y, Math.max(1, hw - 1), 1, '#6ae8ff'); }
        R(c, 25, 17, 3, 9, O); R(c, 26, 17, 1, 9, '#eef2ff'); R(c, 21, 26, 11, 3, O); R(c, 22, 27, 9, 1, '#eef2ff'); R(c, 28, 6, 4, 4, O); R(c, 29, 7, 2, 2, '#e02440'); R(c, 29, 7, 1, 1, '#ffa8b4'); LN(c, 29, 9, 26, 13, '#eef2ff'); });   // коктейльний келих: ніжка, вишенька на шпажці
      // передній ряд (ближче до гостя, низьке): стос тарілок, серветки, вежа стаканів, склянка з рожевим, два паперові стаканчики
      spr(C.x0 + 6, 20, 11, C.z0 + 9, (c) => { R(c, 0, 0, 20, 11, O); for (let k = 0; k < 4; k++) { const y = 8 - k * 2 - (k === 3 ? 1 : 0); R(c, 1, y, 18, 2, '#cdbff4'); R(c, 1, y, 18, 1, '#f4eeff'); R(c, 16, y, 3, 2, '#9a86d8'); } c.clearRect(0, 0, 1, 2); c.clearRect(19, 0, 1, 2); });   // стос тарілок
      spr(C.x0 + 66, 14, 12, C.z0 + 9, (c) => { R(c, 0, 5, 14, 7, O); R(c, 1, 6, 12, 5, '#848db4'); R(c, 1, 6, 12, 1, '#eef2ff'); for (let k = 0; k < 5; k++) { R(c, 2 + k * 2, 1 + (k % 2), 2, 6, k % 2 ? '#ff9ae8' : '#ffffff'); } R(c, 1, 0, 12, 1, O); });   // серветниця
      spr(C.x0 + 120, 10, 18, C.z0 + 9, (c) => { for (let k = 0; k < 4; k++) { const y = 13 - k * 4; R(c, 0, y, 10, 5, O); R(c, 1, y + 1, 8, 3, k % 2 ? '#ff84d4' : '#ffd86a'); R(c, 1, y + 1, 2, 3, '#ffffff'); R(c, 7, y + 1, 2, 3, k % 2 ? '#c8389a' : '#d89a20'); } });   // вежа стаканів
      spr(C.x0 + 176, 9, 11, C.z0 + 9, (c) => { R(c, 0, 0, 9, 11, O); R(c, 1, 1, 7, 9, '#4a3c78'); R(c, 1, 4, 7, 6, '#e0389a'); R(c, 1, 4, 5, 6, '#ff84d4'); R(c, 1, 4, 7, 1, '#ffc4ec'); R(c, 1, 1, 1, 9, '#ffffff'); R(c, 4, 6, 2, 2, '#ffe2f4'); });   // низька склянка
      for (const [dx, T] of [[286, ['#ffd86a', '#d89a20']], [300, ['#8af0b0', '#2aa868']]]) spr(C.x0 + dx, 9, 12, C.z0 + 9, (c) => { for (let y = 1; y < 12; y++) { const k = Math.round((y - 1) / 6), w = 7 - k * 1; R(c, k, y, w + 2, 1, O); R(c, 1 + k, y, w, 1, y < 3 ? '#ffffff' : T[0]); R(c, 1 + k + w - 2, y, 2, 1, y < 3 ? '#c8bee6' : T[1]); } R(c, 0, 0, 9, 2, O); R(c, 1, 0, 7, 1, '#ffffff'); });
      [C.x0 + 54, C.x0 + 158, C.x0 + 262].forEach(x => { const z = C.z0 - 10; ++id; X.tube(L, [x, CEIL, z], [x, CEIL + 70, z], 1.5, () => ramp(PAL.STEEL, .5, 0, 0), { id }); X.face(L, [[x - 16, CEIL + 88, z], [x + 16, CEIL + 88, z], [x + 4, CEIL + 70, z], [x - 4, CEIL + 70, z]], [x - 16, CEIL + 88, z], [32, 0, 0], [0, -18, 0], (u, v, i2, j2) => ramp(PAL.PINK, .4 + (u < .5 ? .2 : -.1) * (1 - v), i2, j2), { id, n: [0, 0, -1] }); X.disc(L, [x, CEIL + 90, z - .5], 4, (u, v) => { X.SH.fl = F_EMIT; return Math.hypot(u - .5, v - .5) < .25 ? NEONC.white : NEONC.pink; }, { id }); });   // лампи над фуршетом
    }
    // афіша колекції на задній стіні (рамка; портрети — живий шар party.js: drawPoster)
    { const Po = GEO.poster; ++id; box(L, id, Po.x0, Po.x1, Po.y0, Po.y1, ZB - 4, ZB, { all: mBevel(PAL.MET, 3), front: (q, fw, fh) => { const b = bevel(PAL.MET, q, fw, fh, 3); return (u, v, i, j) => { const x = u * fw, y = v * fh, ins = x > 5 && x < fw - 5 && y > 5 && y < fh - 5, edge = (x > 3 && x < 5) || (x > fw - 5 && x < fw - 3) || (y > 3 && y < 5) || (y > fh - 5 && y < fh - 3); if (edge) { X.SH.fl = F_EMIT; return NEONC.lil; } return ins ? ramp(PAL.DARK, .15, i, j) : b(u, v, i, j); }; } });
      for (const [dx, dy] of [[0, 0], [1, 0], [0, 1], [1, 1]]) X.disc(L, [dx ? Po.x1 - 1 : Po.x0 + 1, dy ? Po.y1 - 1 : Po.y0 + 1, ZB - 4.5], 2.5, () => ramp(PAL.CHROME, .9, 0, 0), { id }); }
    // дзеркальна куля на ланцюгу
    { const B = GEO.ball; ++id; X.tube(L, [B.x, CEIL, B.z], [B.x, B.y - B.r, B.z], 2, (u, v, i, j) => ramp(PAL.CHROME, .5 + (Math.sin(v * 90) > 0 ? .2 : -.2), i, j), { id });
      ++id; X.disc(L, [B.x, B.y, B.z], B.r, (u, v, i, j) => { const dx = u - .5, dy = v - .5, d = Math.hypot(dx, dy) * 2, tx = Math.floor(u * 11), ty = Math.floor(v * 11), hv = hash(tx, ty); const q = .35 + .5 * (1 - d) + (hv - .5) * .5 + (dx < 0 && dy < 0 ? .15 : 0); return ((Math.floor(u * 44) % 4 === 0 || Math.floor(v * 44) % 4 === 0) ? ramp(PAL.STEEL, .3, i, j) : ramp(PAL.CHROME, q, i, j)); }, { id }); }
    // гірлянди: дроти (лампочки — живий шар)
    { ++id; for (let w = 0; w < 2; w++) for (let i = 1; i <= 11; i++) { const a = GEO.bulbs[w * 12 + i - 1], b = GEO.bulbs[w * 12 + i]; X.tube(L, a, b, 1.2, () => ramp(PAL.STEEL, .55, 0, 0), { id }); } }
    // DJ-пульт: подіум ззаду, корпус, глянцевий верх, передня панель з написом
    { const B = GEO.booth; ++id; box(L, id, B.x0 - 30, B.x1 + 30, GEO.podium.y, FLY, B.z1 - 10, B.z1 + 50, { front: mBevel(PAL.MET, 2, { seam: 40 }), top: mBevel(PAL.STEEL, 2), left: mBevel(PAL.MET, 2), right: mBevel(PAL.MET, 2) });
      ++id; const ID_BOOTH = id; box(L, id, B.x0, B.x1, B.y0, FLY, B.z0, B.z1, { top: mGloss(PAL.TOP), left: mBevel(PAL.MET, 2), right: mBevel(PAL.MET, 2),
        front: (q, fw, fh) => { const base = bevel(PAL.MET, q, fw, fh, 2), t = tex(Math.round(fw), Math.round(fh), (c, W, H) => { c.fillStyle = '#0a0626'; c.fillRect(6, 6, W - 12, H - 12); c.strokeStyle = '#3be8ff'; c.strokeRect(6.5, 6.5, W - 13, H - 13); P.text(c, NX.t('party.dj'), W / 2, 16, '#3be8ff', 9, 'center'); });
          return (u, v, i, j) => { const cc = t(u, v); if (!cc) return base(u, v, i, j); X.SH.fl = F_EMIT; return cc; }; } });
      ++id; box(L, id, B.x0 - 2, B.x1 + 2, B.y0 - 3, B.y0, B.z0 - 2, B.z1 + 2, { front: mNeon(NEONC.cyan, .8), top: mFlat(PAL.STEEL, .35), left: mNeon(NEONC.cyan, .8), right: mNeon(NEONC.cyan, .8) });   // неонова кромка верху
      GEO.boothId = ID_BOOTH; }
    // колонки: стек із двох скринь, два динаміки й твітер на кожній
    GEO.speakers.forEach(sp => { for (let k = 0; k < 2; k++) { const y1 = FLY - k * 76, y0 = y1 - 76, z0 = sp.z, z1 = sp.z + 60; ++id;
      box(L, id, sp.x - 28, sp.x + 28, y0, y1, z0, z1, { front: mBevel(PAL.STEEL, 3), top: mBevel(PAL.STEEL, 2), left: mBevel(PAL.STEEL, 2), right: mBevel(PAL.STEEL, 2) });
      [[y0 + 22, 15], [y0 + 54, 11]].forEach(([cy, r]) => X.disc(L, [sp.x, cy, z0 - .6], r, (u, v, i, j) => { const d = Math.hypot(u - .5, v - .5) * 2; return d > .86 ? ramp(PAL.MET, .7 - (v - .5), i, j) : d < .22 ? ramp(PAL.CHROME, .6 - d, i, j) : ramp(PAL.STEEL, .55 - d * .5 + (u < .5 ? .08 : -.08), i, j); }, { id }));
      X.face(L, [[sp.x - 20, y0 + 6, z0 - .6], [sp.x + 20, y0 + 6, z0 - .6], [sp.x + 20, y0 + 9, z0 - .6], [sp.x - 20, y0 + 9, z0 - .6]], [sp.x - 20, y0 + 6, z0 - .6], [40, 0, 0], [0, 3, 0], (u, v) => { X.SH.fl = F_EMIT; return u % .25 < .12 ? NEONC.pink : dim(NEONC.pink, .4); }, { id, n: [0, 0, -1] }); } });
    // кульки на нитках біля задньої стіни
    GEO.balloons.forEach(([x, y, z, cn]) => { const c = NEONC[cn]; ++id; X.tube(L, [x, y + 14, z], [x + (hash(x, 3) - .5) * 30, y + 70, z], 1, () => ramp(PAL.CHROME, .45, 0, 0), { id });
      ++id; X.disc(L, [x, y, z], 12, (u, v, i, j) => { const dx = u - .5, dy = (v - .5) * .85, d = Math.hypot(dx, dy) * 2; if (d > 1) return 0; X.SH.fl = F_EMIT; const hl = Math.hypot(dx + .18, dy + .2) < .16; return hl ? mixc(c, NEONC.white, .7) : d > .82 ? dim(c, .55) : d > .5 ? dim(c, .8) : c; }, { id }); });

    // піна-пушки на стовпчиках огорожі (обабіч, дивляться на танцпол) і димові машини за колонками (події — party.js)
    GEO.foam.forEach(({ x, z, y }, k) => { const dy = (y == null ? FLY : y) - FLY; ++id; box(L, id, x - 10, x + 10, 290 + dy, 330 + dy, z - 10, z + 10, { all: mBevel(PAL.STEEL, 2) }); const d = k ? -1 : 1;
      box(L, id, x - 14, x + 14, 266 + dy, 290 + dy, z - 14, z + 14, { all: mBevel(PAL.MET, 2) }); X.tube(L, [x, 272 + dy, z], [x + d * 34, 258 + dy, z - 40], 12, (u) => ramp(PAL.CHROME, .4 + (Math.abs(u - .5) < .25 ? .35 : 0), 0, 0), { id }); X.disc(L, [x + d * 36, 257 + dy, z - 42], 7, (u, v) => { const r = Math.hypot(u - .5, v - .5); return r > .5 ? 0 : r > .4 ? ramp(PAL.CHROME, .7, 0, 0) : col('#0a0626'); }, { id });
      X.disc(L, [x, 300 + dy, z - 10.5], 3, () => { X.SH.fl = F_EMIT; return NEONC.cyan; }, { id }); });
    GEO.smoke.forEach(({ x, z }) => { ++id; box(L, id, x - 22, x + 22, FLY - 26, FLY, z - 14, z + 14, { all: mBevel(PAL.STEEL, 2), front: (q, w, h) => (u, v, i, j) => (v > .35 && v < .65 && u > .2 && u < .8) ? col('#05030f') : bevel(PAL.STEEL, q, w, h, 2)(u, v, i, j) }); X.disc(L, [x + 14, FLY - 20, z - 14.5], 2, () => { X.SH.fl = F_EMIT; return NEONC.green; }, { id }); });
    // ============ ДРУГИЙ ПОВЕРХ (06.11, власник: «на всю довжину, щоб гості могли виходити нагору й сходити; пропрацюй сходи») ============
    // плита на всю ширину над задньою стіною, скляна балюстрада з LED-верхом і хромованими стійками (гості за нею — party.js
    // домальовує її поверх напівпрозоро), прожектори, бра; СХОДИ з обох боків уздовж бічних стін: 14 сходинок із LED-кромкою,
    // поручень, світильники під сходами
    { const Bc = GEO.balcony; ++id; box(L, id, XL, XR, Bc.y, Bc.y + 12, Bc.z0, Bc.z1, { front: (q, w, h) => (u, v, i, j) => v < .2 ? (() => { X.SH.fl = F_EMIT; return mixc(NEONC.lil, NEONC.white, .3); })() : bevel(PAL.MET, q, w, h, 2, { seam: 80 })(u, v, i, j), bottom: (q, w, h) => (u, v, i, j) => ramp(PAL.STEEL, .3 + ((Math.floor(u * w / 40) + Math.floor(v * h / 40)) % 2 ? .06 : 0), i, j), top: (q, w, h) => (u, v, i, j) => ramp(PAL.STEEL, .5 + (Math.floor(u * w / 60) % 2 ? .05 : 0) - v * .1, i, j) });
      X.face(L, [[XL, Bc.y - Bc.rail, Bc.z0 + 1], [XR, Bc.y - Bc.rail, Bc.z0 + 1], [XR, Bc.y, Bc.z0 + 1], [XL, Bc.y, Bc.z0 + 1]], [XL, Bc.y - Bc.rail, Bc.z0 + 1], [XR - XL, 0, 0], [0, Bc.rail, 0], (u, v, i, j) => v < .08 ? (() => { X.SH.fl = F_EMIT; return mixc(NEONC.cyan, NEONC.white, .3); })() : rgb(120, 150, 220, 70 + (Math.sin(u * 40) > .9 ? 40 : 0)), { id, n: [0, 0, -1] });   // скляна балюстрада з LED-верхом
      for (let x = XL + 6; x <= XR - 6; x += 64) X.tube(L, [x, Bc.y, Bc.z0 + 2], [x, Bc.y - Bc.rail - 2, Bc.z0 + 2], 2.5, (u) => ramp(PAL.CHROME, .4 + (Math.abs(u - .5) < .25 ? .3 : 0), 0, 0), { id });
      X.tube(L, [XL, Bc.y - Bc.rail - 2, Bc.z0 + 2], [XR, Bc.y - Bc.rail - 2, Bc.z0 + 2], 3, (u) => ramp(PAL.CHROME, .55, 0, 0), { id });   // поручень
      for (const [lx, cn] of [[XL + 60, 'cyan'], [774, 'gold'], [XR - 60, 'pink']]) { ++id; box(L, id, lx - 10, lx + 10, Bc.y - 80, Bc.y - 60, ZB - 24, ZB - 4, { all: mBevel(PAL.STEEL, 2) }); X.disc(L, [lx, Bc.y - 60, ZB - 24.5], 7, (u, v) => { X.SH.fl = F_EMIT; return Math.hypot(u - .5, v - .5) < .3 ? NEONC.white : NEONC[cn]; }, { id }); }   // прожектори на балконі
      for (const x of [XL + 200, 774 - 300, 774 + 300, XR - 200]) { ++id; box(L, id, x - 8, x + 8, Bc.y - 110, Bc.y - 96, ZB - 6, ZB, { all: mBevel(PAL.MET, 1) }); X.disc(L, [x, Bc.y - 103, ZB - 6.5], 4, (u, v) => { X.SH.fl = F_EMIT; return NEONC.gold; }, { id }); }   // бра на стіні другого поверху
      GEO.stairs.forEach(St => { const n = 14, dz = (Bc.z0 - St.z0) / n, dy = (FLY - Bc.y) / n, inner = St.side < 0 ? St.x1 : St.x0;
        for (let k = 0; k < n; k++) { const z0 = St.z0 + k * dz, y1 = FLY - k * dy, y0 = y1 - dy; ++id; box(L, id, St.x0, St.x1, y0, FLY, z0, z0 + dz, { front: (q, w, h) => (u, v, i, j) => v < .1 ? (() => { X.SH.fl = F_EMIT; return mixc(NEONC.cyan, NEONC.white, .35); })() : bevel(PAL.STEEL, q, w, h, 1)(u, v, i, j), top: (q, w, h) => (u, v, i, j) => ramp(PAL.MET, .55 - v * .15 + (u * w % 12 < 1 ? -.1 : 0), i, j), left: mBevel(PAL.STEEL, 1), right: mBevel(PAL.STEEL, 1) });
          if (k % 2 === 0) X.disc(L, [inner + St.side * -4, y1 - 4, z0 + dz / 2], 2, () => { X.SH.fl = F_EMIT; return NEONC.lil; }, { id }); }   // сходинки з LED-кромкою й світильниками збоку
        ++id; for (let k = 0; k <= n; k += 2) X.tube(L, [inner, FLY - k * dy, St.z0 + k * dz], [inner, FLY - k * dy - 36, St.z0 + k * dz], 2, () => ramp(PAL.CHROME, .5, 0, 0), { id });
        X.tube(L, [inner, FLY - 36, St.z0], [inner, Bc.y - 36, Bc.z0], 3, (u) => ramp(PAL.CHROME, .5 + (Math.abs(u - .5) < .25 ? .3 : 0), 0, 0), { id });   // поручень
        X.tube(L, [St.side < 0 ? St.x0 + 2 : St.x1 - 2, FLY - 36, St.z0], [St.side < 0 ? St.x0 + 2 : St.x1 - 2, Bc.y - 36, Bc.z0], 3, (u) => ramp(PAL.CHROME, .5 + (Math.abs(u - .5) < .25 ? .3 : 0), 0, 0), { id }); }); }
    // другий поверх: мінібар (стійка, полиця з 6 пляшками, лампочки), високі столики, диванчик — гості нагорі беруть напій
    { const M = GEO.minibar, Bc = GEO.balcony; ++id; box(L, id, M.x0, M.x1, M.y0, Bc.y, M.z0, M.z1, { front: (q, w, h) => (u, v, i, j) => v > .85 ? (() => { X.SH.fl = F_EMIT; return NEONC.pink; })() : bevel(PAL.PLUM, q, w, h, 2, { seam: 20 })(u, v, i, j), top: mGloss(PAL.TOP), left: mBevel(PAL.PLUM, 2), right: mBevel(PAL.PLUM, 2) });
      ++id; box(L, id, M.x0 + 6, M.x1 - 6, Bc.y - 64, Bc.y - 59, ZB - 14, ZB, { all: mBevel(PAL.MET, 1), bottom: () => { X.SH.fl = F_EMIT; return mixc(NEONC.cyan, NEONC.white, .2); } });
      for (let k = 0; k < 6; k++) { const x = M.x0 + 18 + k * (M.x1 - M.x0 - 36) / 5, c = [NEONC.gold, NEONC.cyan, NEONC.pink, NEONC.green, NEONC.orange, NEONC.lil][k], h0 = 26 + (k % 2) * 8; ++id; box(L, id, x - 6, x + 6, Bc.y - 64 - h0, Bc.y - 64, ZB - 12, ZB - 2, { all: (q) => (u, v, i, j) => { if (v < .3 && Math.abs(u - .5) > .22) return 0; X.SH.fl = F_EMIT; return v < .06 ? ramp(PAL.GOLD, .7, i, j) : (v > .45 && v < .7 && Math.abs(u - .5) < .3) ? rgb(240, 236, 220) : mixc(dim(c, .8), NEONC.white, u < .3 ? .4 : .08); } }); }
      for (let k = 0; k < 4; k++) { const x = M.x0 + 20 + k * 40; X.disc(L, [x, M.y0 - 1, M.z0 + 8], 4, (u, v) => v > .5 ? 0 : mixc([NEONC.gold, NEONC.cyan, NEONC.pink, NEONC.green][k], NEONC.white, .3), { id }); X.tube(L, [x, M.y0, M.z0 + 8], [x, M.y0 - 1, M.z0 + 8], 1, () => ramp(PAL.CHROME, .6, 0, 0), { id }); }   // келихи на мінібарі
      GEO.hiTables.forEach(({ x, z }) => { ++id; X.tube(L, [x, Bc.y - 42, z], [x, Bc.y, z], 2.5, (u) => ramp(PAL.CHROME, .45 + (Math.abs(u - .5) < .25 ? .3 : 0), 0, 0), { id }); X.disc(L, [x, Bc.y - 42, z - .5], 14, (u, v) => { const d = Math.hypot(u - .5, (v - .5) * 3); return d > .5 ? 0 : ramp(PAL.TOP, .5 + (d < .15 ? .3 : 0), 0, 0); }, { id }); X.disc(L, [x, Bc.y - 46, z - 3], 2, () => { X.SH.fl = F_EMIT; return NEONC.gold; }, { id }); });   // високі столики зі свічками
      // фотобудка нагорі: неонова рамка на стіні, кабінка з шторкою, камера на штативі, два прожектори (спалах — party.js)
      { const Ph = GEO.photo; ++id; box(L, id, Ph.x0, Ph.x1, Bc.y - 104, Bc.y, Ph.z0, Ph.z1, { front: (q, w, h) => (u, v, i, j) => { const x = u * w, y = v * h; if (x < 4 || x > w - 4 || y < 4) { X.SH.fl = F_EMIT; return NEONC.pink; } if (y < 22) { X.SH.fl = F_EMIT; const st = (x * .25) % 1 < .5 && y > 8 && y < 18; return st ? NEONC.gold : col('#0a0626'); } if (y < 26) { X.SH.fl = F_EMIT; return NEONC.cyan; } if (y > h - 10) return bevel(PAL.MET, q, w, h, 2)(u, v, i, j); const fold = Math.sin(x * .9) * .5 + .5; return ramp(PAL.PLUM, .35 + fold * .35 - v * .15, i, j); }, top: mBevel(PAL.MET, 2), left: mBevel(PAL.MET, 2), right: mBevel(PAL.MET, 2) });   // кабінка зі шторкою
        const cx = (Ph.x0 + Ph.x1) / 2; X.tube(L, [cx + 60, Bc.y, Ph.z0 - 30], [cx + 60, Bc.y - 50, Ph.z0 - 30], 2, () => ramp(PAL.CHROME, .5, 0, 0), { id }); box(L, id, cx + 50, cx + 70, Bc.y - 62, Bc.y - 50, Ph.z0 - 36, Ph.z0 - 24, { all: mBevel(PAL.STEEL, 1) }); X.disc(L, [cx + 60, Bc.y - 56, Ph.z0 - 36.5], 3.5, (u, v) => ramp(PAL.CHROME, .3 + (Math.hypot(u - .5, v - .5) < .25 ? .6 : 0), 0, 0), { id });   // камера на штативі
        for (const dx of [-70, 70]) { X.tube(L, [cx + dx, Bc.y, Ph.z0 - 10], [cx + dx, Bc.y - 76, Ph.z0 - 10], 2, () => ramp(PAL.CHROME, .5, 0, 0), { id }); X.disc(L, [cx + dx, Bc.y - 80, Ph.z0 - 12], 8, (u, v) => { X.SH.fl = F_EMIT; return Math.hypot(u - .5, v - .5) < .3 ? NEONC.white : mixc(NEONC.white, NEONC.gold, .5); }, { id }); } }   // софтбокси
    }
    // ============ DJ-СЦЕНА (план «сире» 5): сходинки подіуму з LED-кромкою, монітори, кейси, кабелі, CO2-гармати ============
    { const B = GEO.booth; for (let k = 0; k < 2; k++) { const y1 = FLY - k * 9, y0 = y1 - 9, x0 = B.x0 - 50 + k * 12, x1 = B.x1 + 50 - k * 12; ++id;
        box(L, id, x0, x1, y0, y1, B.z0 - 60 + k * 14, B.z1 + 50, { front: (q, w, h) => (u, v, i, j) => v < .22 ? (() => { X.SH.fl = F_EMIT; return mixc(NEONC.cyan, NEONC.white, .3); })() : bevel(PAL.MET, q, w, h, 1)(u, v, i, j), top: mFlat(PAL.STEEL, .45), left: mBevel(PAL.MET, 1), right: mBevel(PAL.MET, 1) }); }   // сходинки з LED-кромкою
      [[B.x0 - 36, 1], [B.x1 + 36, -1]].forEach(([x, d]) => { ++id; box(L, id, x - 16, x + 16, B.y0 + 10, B.y0 + 32, B.z0 - 10, B.z0 + 16, { front: (q, w, h) => (u, v, i, j) => { const dd = Math.hypot(u - .5, v - .5) * 2; return dd < .7 ? ramp(PAL.STEEL, .55 - dd * .4, i, j) : bevel(PAL.STEEL, q, w, h, 2)(u, v, i, j); }, top: mBevel(PAL.STEEL, 2), left: mBevel(PAL.STEEL, 2), right: mBevel(PAL.STEEL, 2) }); });   // монітори-клини
      ++id; box(L, id, B.x1 + 60, B.x1 + 100, FLY - 30, FLY, B.z1 - 10, B.z1 + 30, { all: mBevel(PAL.STEEL, 2), front: (q, w, h) => (u, v, i, j) => (Math.abs(u - .5) < .1 && v < .5 && v > .25) ? ramp(PAL.CHROME, .7, i, j) : bevel(PAL.STEEL, q, w, h, 2)(u, v, i, j) }); box(L, id, B.x0 - 100, B.x0 - 60, FLY - 24, FLY, B.z1 - 10, B.z1 + 26, { all: mBevel(PAL.STEEL, 2) });   // кейси
      for (let k = 0; k < 4; k++) { const x0 = B.x0 + 20 + k * 60, z = B.z1 + 20; X.tube(L, [x0, FLY - 1, z], [x0 + 40 + k * 6, FLY - 1, z + 30 - k * 8], 1.5, () => ramp(PAL.DARK, .3, 0, 0), { id }); }   // кабелі
      [[B.x0 - 30, -1], [B.x1 + 30, 1]].forEach(([x, d]) => { ++id; box(L, id, x - 7, x + 7, FLY - 60, FLY - 8, B.z0 - 30, B.z0 - 16, { all: mBevel(PAL.CHROME, 1) }); X.tube(L, [x, FLY - 60, B.z0 - 23], [x + d * 10, FLY - 80, B.z0 - 23], 6, (u) => ramp(PAL.CHROME, .5 + (Math.abs(u - .5) < .25 ? .3 : 0), 0, 0), { id }); });   // CO2-гармати обабіч
      GEO.co2 = [{ x: B.x0 - 30 - 10, y: FLY - 80, z: B.z0 - 23, d: -1 }, { x: B.x1 + 30 + 10, y: FLY - 80, z: B.z0 - 23, d: 1 }]; }
    // ============ ФАКТУРА (план «сире» 6): труби й короби під стелею, знак виходу ============
    { ++id; X.tube(L, [XL, CEIL + 30, ZB - 20], [XR, CEIL + 30, ZB - 20], 9, (u) => ramp(PAL.STEEL, .35 + (Math.abs(u - .5) < .25 ? .25 : 0), 0, 0), { id }); X.tube(L, [XL, CEIL + 46, ZB - 20], [XR, CEIL + 46, ZB - 20], 5, (u) => ramp(PAL.MET, .35 + (Math.abs(u - .5) < .25 ? .25 : 0), 0, 0), { id });   // труби вздовж задньої стіни
      for (const x of [XL + 300, 774, XR - 300]) { box(L, id, x - 7, x + 7, CEIL + 24, CEIL + 36, ZB - 28, ZB - 12, { all: mBevel(PAL.STEEL, 1) }); }                                                                                 // хомути
      ++id; box(L, id, 774 - 560, 774 - 320, CEIL, CEIL + 30, ZB - 160, ZB - 100, { front: mBevel(PAL.STEEL, 2, { seam: 40 }), bottom: mBevel(PAL.STEEL, 2), left: mBevel(PAL.STEEL, 2), right: mBevel(PAL.STEEL, 2) }); box(L, id, 774 + 320, 774 + 560, CEIL, CEIL + 30, ZB - 160, ZB - 100, { front: mBevel(PAL.STEEL, 2, { seam: 40 }), bottom: mBevel(PAL.STEEL, 2), left: mBevel(PAL.STEEL, 2), right: mBevel(PAL.STEEL, 2) });   // вентиляційні короби
      ++id; box(L, id, XR - 90, XR - 30, 70, 92, ZB - 4, ZB, { all: mBevel(PAL.STEEL, 1), front: (q, fw, fh) => { const t = tex(60, 22, (c, W, H) => { c.fillStyle = '#0a2a14'; c.fillRect(0, 0, W, H); c.strokeStyle = '#3bff8a'; c.strokeRect(1.5, 1.5, W - 3, H - 3); c.fillStyle = '#3bff8a'; c.fillRect(8, 6, 6, 10); c.fillRect(14, 9, 6, 4); c.beginPath(); c.moveTo(20, 6); c.lineTo(26, 11); c.lineTo(20, 16); c.fill(); c.fillRect(34, 8, 18, 2); c.fillRect(34, 12, 18, 2); }); return (u, v) => { X.SH.fl = F_EMIT; return t(u, v); }; } }); }   // знак виходу
    // контур і віддзеркалення в підлозі (все, що стоїть на підлозі або висить на стінах)
    X.outline(L, col('#060313'), 1); bake(L);
    X.reflect(L, i => (i === ID_FLOOR || i === 5 ? null : { y: FLY, h: 60 }), { a: .34, h: 60, emit: 2.2, streak: true });
    const cv = X.canvas(L); bloom(cv, L);
    // ГЛИБИНА ДЛЯ ЖИВОГО ШАРУ (13.11, власник: «герої ходять поверх чогось»): z світу кожного пікселя растра (підлога й порожнє — «дуже далеко»)
    // і кольори готового растра — party.js домальовує поверх гостя ті пікселі меблів, що ближчі до глядача, ніж він (occlude).
    const zb = new Float32Array(L.W * L.H), DP = L.dep, IDb = L.id, Dq = X.D; for (let k = 0; k < zb.length; k++) zb[k] = !IDb[k] || IDb[k] === ID_FLOOR || !isFinite(DP[k]) ? 1e9 : Dq * (DP[k] - 1);
    const px = new Uint32Array(cv.getContext('2d').getImageData(0, 0, L.W, L.H).data.buffer);
    return { cv, x0: L.x0, y0: L.y0, W: L.W, H: L.H, zb, px };
  }
  return { build, GEO, PAL, NEONC, LIGHTS, lightAt };
})();

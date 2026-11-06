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
 * Що в кімнаті: цегляна стіна й бічні стіни з неоновими пілястрами, плінтус-неон, стеля з балками й рейкою прожекторів,
 * вивіска «ВЕЧІРКА NEXI» (party.sign) з лампочками, гірлянди лампочок від кутів, дзеркальна куля на ланцюгу, DJ-пульт з
 * подіумом (Nexi стоїть за ним — вище), два стеки колонок з динаміками, бар уздовж правої стіни (стійка з неоновою
 * кромкою, за нею бармен — party.js, полиця з пляшками, що світяться, неонова вивіска «БАР», підвісна полиця з келихами), стіл із
 * закусками вздовж лівої (піца, сендвічі, фрукти, кекси, чіпси, сік), кульки на нитках, лаунж-диванчик зі столиком і лампою,
 * спереду — низьке огородження лаунжу (передній план), афіша колекції в неоновій рамці. 06.11 («зроби стильніше, більше графіки»):
 * VJ-екран за пультом, неонове панно на стінах (блискавка, трикутник, коло), LED-матриця пульта й гобо-прожектори (живе — party.js).
 * ========================================================================== */
NX.partyRoom = (() => {
  const X = NX.px3d, { col, pal, ramp, mixc, dim, rgb } = X, PZ = NX.persp, P = NX.px, hash = NX.art.hash;
  const FLY = 372, CEIL = 60, XL = 134, XR = 1414, ZB = 440, ZF = -340;                         // підлога, стеля, стіни, задня стіна, передній край
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
    FLY, CEIL, XL, XR, ZB, ZF, VIEW: { x0: 34, x1: 1514, y0: -140, y1: 600 }, RASTER: { y0: -170, y1: 672 },                      // видима область на комп'ютері (одиниці кімнати)
    dance: { x0: 774 - 270, x1: 774 + 270, z0: -70, z1: 170, cols: 8, rows: 4 },
    booth: { x0: 774 - 120, x1: 774 + 120, y0: 300, z0: 200, z1: 262, led: { y0: 318, y1: 352 } }, podium: { y: 318, z: 282 },   // Nexi стоїть на подіумі за пультом
    speakers: [{ x: 774 - 360, z: 210 }, { x: 774 + 360, z: 210 }],                                   // стек: 52 завширшки, 150 заввишки
    ball: { x: 774, y: 196, z: 260, r: 26 }, sign: { x0: 774 - 210, x1: 774 + 210, y0: 64, y1: 128, z: ZB - 6 },
    lamps: [774 - 420, 774 - 140, 774 + 140, 774 + 420].map(x => ({ x, y: CEIL + 14, z: 150 })),      // прожектори на рейці
    bar: { x0: 1226, x1: 1326, z0: -40, z1: 300, y0: 332 }, barman: { x: 1372, y: 346, z: 150 }, snack: { x0: 140, x1: 276, z0: 20, z1: 320, y0: 338 },
    crowd: [], rail: { z: -210, y0: 330 }, screen: { x0: 774 - 210, x1: 774 + 210, y0: 70, y1: 262, z: ZB - 5 }, foam: [{ x: 774 - 360, z: -200 }, { x: 774 + 360, z: -200 }], smoke: [{ x: 774 - 200, z: 190 }, { x: 774 + 200, z: 190 }],                   // VJ-екран за пультом (живе — party.js: drawScreen)
    neonArt: [{ x: 774 - 520, y: 150, side: -1 }, { x: 774 + 520, y: 150, side: 1 }], gobos: [774 - 250, 774, 774 + 250],         // неонове панно на бічних частинах стіни; обертові прожектори-гобо
    table: { x: 320, z: 300 }, poster: { x0: 774 - 560, x1: 774 - 300, y0: 78, y1: 212 }, sofa: { x0: 150, x1: 260, z0: 290, z1: 390 }, cat: { x: 774 - 360, y: FLY - 152, z: 240 },   // афіша колекції на задній стіні; Рудик на лівій колонці
    bulbs: [], balloons: [[214, 150, 60, 'pink'], [240, 128, 90, 'cyan'], [268, 158, 40, 'gold'], [1330, 146, 60, 'green'], [1300, 124, 100, 'orange'], [1272, 154, 40, 'lil'], [560, 118, 420, 'pink'], [990, 120, 420, 'cyan']],
  };
  for (let i = 0; i < 18; i++) { const side = i < 9 ? -1 : 1, k = i % 9; GEO.crowd.push({ x: 774 + side * (150 + k * 36 + (k % 2) * 10), z: 176 + (k % 3) * 9, h: 44 + hash(i, 5) * 14, ph: hash(i, 9) * 6, w: 20 + hash(i, 2) * 8 }); }   // натовп-тло обабіч пульта
  (() => { for (let w = 0; w < 2; w++) for (let i = 0; i <= 11; i++) { const u = i / 11, xa = w ? XR - 10 : XL + 10, xb = w ? 774 + 230 : 774 - 230, x = xa + (xb - xa) * u, y = CEIL + 14 + Math.sin(u * Math.PI) * 34 + u * 8, z = ZB - 60 + (1 - u) * -120; GEO.bulbs.push([x, y, z]); } })();

  // ============================ СВІТЛО КІМНАТИ (06.11: «світло пласке — гості наклеєні») ============================
  // Джерела кольорового світла: кожен піксель растра (стіни, підлога, меблі) підфарбовується найближчими — рожеве біля бару,
  // золоте біля фуршету, cyan біля пульта й VJ-екрана, лілове від пілястрів, кольори прожекторів з рейки; кути темніші (ambient).
  // Те саме lightAt(x, y, z) кличе party.js для гостей, Nexi й бармена — спрайти в тому ж світлі, що й кімната.
  const LIGHTS = [
    { p: [1276, 300, 130], c: [1, .35, .85], r: 360, k: .9 }, { p: [1300, 150, 150], c: [1, .8, .4], r: 220, k: .6 },           // бар: рожевий неон, лампи
    { p: [208, 300, 170], c: [1, .85, .45], r: 330, k: .9 }, { p: [208, 150, 140], c: [1, .5, .8], r: 220, k: .5 },            // фуршет: золота гірлянда, рожеві лампи
    { p: [774, 290, 232], c: [.25, .9, 1], r: 320, k: 1 }, { p: [774, 166, 432], c: [.3, .8, 1], r: 300, k: .8 },              // пульт і VJ-екран
    { p: [774, 370, 430], c: [.25, .9, 1], r: 520, k: .35 },                                                                   // плінтус-неон
    ...[XL + 160, 774 - 330, 774 + 330, XR - 160].map(x => ({ p: [x, 220, 428], c: [.8, .45, 1], r: 240, k: .55 })),           // пілястри
    ...[[774 - 420, [1, .3, .85]], [774 - 140, [.25, .9, 1]], [774 + 140, [1, .9, .45]], [774 + 420, [.25, 1, .55]]].map(([x, c]) => ({ p: [x, 100, 150], c, r: 300, k: .55 })),   // прожектори
    { p: [320, 318, 300], c: [1, .6, .25], r: 160, k: .6 },                                                                     // лампа лаунжу
    ...[XL + 150, 774 - 300, 774 + 300, XR - 150].map(x => ({ p: [x, 130, -120], c: [1, .85, .5], r: 300, k: .5 })),              // підвісні лампи спереду (прапорці, лаунж)
  ];
  /** Світло в точці світу: [r, g, b] множники (ambient + сума джерел; 1 — як намальовано). */
  function lightAt(x, y, z) {
    const amb = .4 + .2 * (1 - Math.min(1, Math.abs(x - 774) / 760)) + .18 * Math.max(0, Math.min(1, (y - 60) / 312)); let r = amb, g = amb, b = amb;
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
    // неонові пілястри на стінах (світяться — відбиваються в підлозі)
    const pil = (x, z0, z1, n) => { ++id; box(L, id, x - 6, x + 6, CEIL, FLY, z0, z1, { all: mBevel(PAL.STEEL, 2) }); X.face(L, [[x - 1.5, CEIL + 8, z0 - .5], [x + 1.5, CEIL + 8, z0 - .5], [x + 1.5, FLY - 4, z0 - .5], [x - 1.5, FLY - 4, z0 - .5]], [x - 1.5, CEIL + 8, z0 - .5], [3, 0, 0], [0, FLY - CEIL - 12, 0], (u, v, i, j) => { X.SH.fl = F_EMIT; return Math.abs(u - .5) < .25 ? mixc(NEONC.lil, NEONC.white, .3) : dim(NEONC.lil, .6); }, { id, n }); };
    for (const x of [XL + 160, 774 - 330, 774 + 330, XR - 160]) pil(x, ZB - 10, ZB, [0, 0, -1]);
    for (const z of [ZB - 200, ZB - 420]) { ++id; box(L, id, XL, XL + 10, CEIL, FLY, z - 6, z + 6, { all: mBevel(PAL.STEEL, 2) }); ++id; box(L, id, XR - 10, XR, CEIL, FLY, z - 6, z + 6, { all: mBevel(PAL.STEEL, 2) }); }
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
    // підвісні лампи-конуси спереду (над лаунжем): шнур, конус, лампочка (світиться)
    for (const x of [XL + 150, 774 - 300, 774 + 300, XR - 150]) { ++id; X.tube(L, [x, CEIL, -120], [x, CEIL + 48, -120], 1.5, () => ramp(PAL.STEEL, .5, 0, 0), { id });
      X.face(L, [[x - 14, CEIL + 64, -120], [x + 14, CEIL + 64, -120], [x + 3, CEIL + 48, -120], [x - 3, CEIL + 48, -120]], [x - 14, CEIL + 64, -120], [28, 0, 0], [0, -16, 0], (u, v, i2, j2) => ramp(PAL.MET, .55 + (u < .5 ? .15 : -.1) * (1 - v), i2, j2), { id, n: [0, 0, -1] });
      X.disc(L, [x, CEIL + 66, -120.5], 4, (u, v) => { X.SH.fl = F_EMIT; return Math.hypot(u - .5, v - .5) < .25 ? NEONC.white : NEONC.gold; }, { id }); }
    // VJ-екран за пультом: рамка зі сталі з хромовою кромкою, темне скло (живі візуалізації — party.js)
    { const Sc = GEO.screen; ++id; box(L, id, Sc.x0 - 8, Sc.x1 + 8, Sc.y0 - 8, Sc.y1 + 8, Sc.z - 2, ZB, { all: mBevel(PAL.MET, 3), front: (q, fw, fh) => { const b = bevel(PAL.MET, q, fw, fh, 3); return (u, v, i, j) => (u * fw > 8 && u * fw < fw - 8 && v * fh > 8 && v * fh < fh - 8) ? ramp(PAL.DARK, .2 + ((i + j) & 1) * .05, i, j) : (u * fw < 2 || v * fh < 2 || u * fw > fw - 2 || v * fh > fh - 2) ? ramp(PAL.CHROME, .7, i, j) : b(u, v, i, j); } });
      for (const x of [Sc.x0 - 4, Sc.x1 + 4]) X.disc(L, [x, Sc.y1 + 4, Sc.z - 2.5], 2, () => { X.SH.fl = F_EMIT; return NEONC.cyan; }, { id }); }
    // неонове панно на стінах обабіч: зигзаг-блискавка, трикутник і коло з неонових трубок різних кольорів (F_EMIT — відбиваються в підлозі)
    GEO.neonArt.forEach(({ x, y, side }, k) => { ++id; const tube = (a, b, c) => X.tube(L, [a[0], a[1], ZB - 1.5], [b[0], b[1], ZB - 1.5], 3, (u) => { X.SH.fl = F_EMIT; return Math.abs(u - .5) < .3 ? mixc(c, NEONC.white, .4) : dim(c, .7); }, { id });
      const zz = [[x - 30, y - 60], [x + 10, y - 20], [x - 10, y - 10], [x + 30, y + 40]]; for (let i = 0; i < 3; i++) tube(zz[i], zz[i + 1], NEONC.gold);                       // блискавка
      const tr = [[x - 70, y + 70], [x + 70, y + 70], [x, y - 40], [x - 70, y + 70]]; for (let i = 0; i < 3; i++) tube(tr[i], tr[i + 1], k ? NEONC.cyan : NEONC.pink);        // трикутник
      const N = 14; for (let i = 0; i < N; i++) { const a0 = i / N * 6.283, a1 = (i + 1) / N * 6.283; tube([x + Math.cos(a0) * 56, y + 20 + Math.sin(a0) * 56], [x + Math.cos(a1) * 56, y + 20 + Math.sin(a1) * 56], k ? NEONC.pink : NEONC.cyan); }   // коло
      X.disc(L, [x, y + 20, ZB - 2], 6, (u, v) => { X.SH.fl = F_EMIT; return Math.hypot(u - .5, v - .5) < .3 ? NEONC.white : NEONC.lil; }, { id }); });
    // над баром: неонова вивіска «БАР» (party.bar) у рамці та підвісна полиця з келихами догори дном
    { const B = GEO.bar, w = 90, h = 30, ys = 120, zs0 = B.z0 + 40, zs1 = zs0 + w; ++id;
      box(L, id, XR - 8, XR, ys, ys + h, zs0, zs1, { left: (q, fw, fh) => { const base = bevel(PAL.STEEL, q - .1, fw, fh, 2), t = tex(Math.round(fw), Math.round(fh), (c, W, H) => { c.strokeStyle = '#ff4fd8'; c.strokeRect(2.5, 2.5, W - 5, H - 5); P.text(c, NX.t('party.bar'), W / 2, H / 2 + 6, '#ff9af0', 16, 'center'); }); return (u, v, i, j) => { const cc = t(1 - u, v); if (!cc) return base(u, v, i, j); X.SH.fl = F_EMIT; return cc; }; }, top: mFlat(PAL.STEEL, .4), bottom: mFlat(PAL.STEEL, .3), front: mFlat(PAL.STEEL, .35) });
      ++id; box(L, id, B.x0 + 10, B.x1 - 10, 150, 156, B.z0 + 30, B.z1 - 30, { all: mBevel(PAL.MET, 1) }); for (const x of [B.x0 + 14, B.x1 - 14]) X.tube(L, [x, CEIL, B.z0 + 150], [x, 150, B.z0 + 150], 1.5, () => ramp(PAL.STEEL, .5, 0, 0), { id });   // підвісна полиця
      for (let k = 0; k < 7; k++) { const z = B.z0 + 44 + k * 32; ++id; box(L, id, B.x0 + 44, B.x1 - 44, 156, 174, z - 6, z + 6, { all: (q) => (u, v, i, j) => v < .35 ? rgb(230, 244, 255, 150) : v < .8 ? rgb(200, 220, 240, 70) : rgb(230, 244, 255, 190) }); } }   // келихи догори дном
    // лаунж: низький столик зі скляним верхом і лампа-гриб на ньому (світиться)
    { const T = GEO.table; ++id; box(L, id, T.x - 30, T.x + 30, 346, 350, T.z - 20, T.z + 20, { all: mGloss(PAL.TOP) }); for (const [dx, dz] of [[-24, -14], [24, -14], [-24, 14], [24, 14]]) X.tube(L, [T.x + dx, 350, T.z + dz], [T.x + dx, FLY, T.z + dz], 2, () => ramp(PAL.CHROME, .55, 0, 0), { id });
      ++id; X.tube(L, [T.x, 346, T.z], [T.x, 328, T.z], 2, () => ramp(PAL.CHROME, .6, 0, 0), { id }); box(L, id, T.x - 12, T.x + 12, 318, 328, T.z - 12, T.z + 12, { all: (q) => (u, v, i, j) => { X.SH.fl = F_EMIT; return v < .3 ? mixc(NEONC.orange, NEONC.white, .5) : mixc(NEONC.orange, NEONC.white, .15); } }); }
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
    // ============ БАР (06.11, власник: «бар виглядає слабо — покращити мінімум у три рази») ============
    // стійка: стьобана шкіряна передня панель із хромованими ребрами, LED-підсвітка знизу, латунний поручень для ніг, глянцевий
    // верх із дзеркальною кромкою; 3 барні стільці; за стійкою — дзеркальна вітрина з 3 підсвіченими полицями й пляшками різних
    // форм (етикетки, кришки), пивні крани, шейкер, відро з льодом, лимони; над баром — 3 підвісні лампи
    { const B = GEO.bar, fw = B.z1 - B.z0, fh = FLY - B.y0;
      const quilt = (q, w, h) => (u, v, i, j) => { const x = u * w, y = v * h; if (y > h - 6) { X.SH.fl = F_EMIT; return y > h - 4 ? NEONC.cyan : dim(NEONC.cyan, .5); }   // LED-підсвітка знизу
        if (x % 24 < 2.5) return ramp(PAL.CHROME, .6 + (x % 24 < 1 ? .25 : 0), i, j);                                                                                         // хромовані ребра
        const cx = (x % 24) / 24 - .5, cy = ((y - 4) % 14) / 14 - .5, d = Math.hypot(cx * 1.6, cy * 2.2); return ramp(PAL.PLUM, .62 - d * .55 + (cy < -.25 ? .12 : 0) + (Math.abs(cx) > .44 || Math.abs(cy) > .42 ? -.25 : 0), i, j); };   // стьобані подушки
      ++id; box(L, id, B.x0, B.x1, B.y0, FLY, B.z0, B.z1, { front: quilt, left: quilt, top: (q, w, h) => (u, v, i, j) => { X.SH.fl = F_GLOSS; const x = u * w, z = v * h; return (x < 2 || z < 2 || z > h - 2) ? ramp(PAL.CHROME, .75, i, j) : ramp(PAL.TOP, .55 + (hash(Math.floor(x / 6), Math.floor(z / 6)) - .5) * .08 - u * .2, i, j); } });
      ++id; box(L, id, B.x0 - 3, B.x1, B.y0 - 4, B.y0, B.z0 - 3, B.z1, { front: mNeon(NEONC.pink, .7), left: mNeon(NEONC.pink, .7), top: mFlat(PAL.CHROME, .8) });                  // неонова кромка верху
      ++id; X.tube(L, [B.x0 - 14, FLY - 18, B.z0 - 14], [B.x0 - 14, FLY - 18, B.z1], 3, (u) => ramp(PAL.GOLD, .55 + (Math.abs(u - .5) < .2 ? .3 : 0), 0, 0), { id }); X.tube(L, [B.x0 - 14, FLY - 18, B.z0 - 14], [B.x1, FLY - 18, B.z0 - 14], 3, (u) => ramp(PAL.GOLD, .55 + (Math.abs(u - .5) < .2 ? .3 : 0), 0, 0), { id });   // латунний поручень
      for (const z of [B.z0 + 10, B.z0 + 110, B.z0 + 210]) X.tube(L, [B.x0 - 14, FLY - 18, z], [B.x0 - 4, FLY - 2, z], 2, () => ramp(PAL.GOLD, .5, 0, 0), { id });
      [B.z0 + 50, B.z0 + 150, B.z0 + 250].forEach(z => { const x = B.x0 - 44; ++id;                                                                                            // барні стільці
        X.disc(L, [x, FLY - 1, z], 14, (u, v) => { const d = Math.hypot(u - .5, (v - .5) * 3); return d > .5 ? 0 : ramp(PAL.CHROME, .5 + (d < .2 ? .3 : 0), 0, 0); }, { id }); X.tube(L, [x, FLY - 2, z], [x, FLY - 40, z], 4, (u) => ramp(PAL.CHROME, .45 + (Math.abs(u - .5) < .2 ? .35 : 0), 0, 0), { id });
        box(L, id, x - 14, x + 14, FLY - 50, FLY - 40, z - 14, z + 14, { all: (q, w, h) => (u, v, i, j) => v < .25 ? mixc(NEONC.pink, NEONC.white, u < .3 ? .4 : .15) : ramp(PAL.PINK, .55 - v * .3, i, j) }); X.tube(L, [x - 12, FLY - 40, z], [x + 12, FLY - 40, z], 2, () => ramp(PAL.CHROME, .7, 0, 0), { id }); });
      // вітрина за стійкою: дзеркальна панель, 3 полиці з підсвіткою, пляшки різних форм
      ++id; X.face(L, [[XR - .5, 120, B.z0 + 10], [XR - .5, 120, B.z1 - 10], [XR - .5, 300, B.z1 - 10], [XR - .5, 300, B.z0 + 10]], [XR - .5, 120, B.z0 + 10], [0, 0, fw - 20], [0, 180, 0], (u, v, i, j) => ramp(PAL.CHROME, .18 + Math.sin((u * 3 + v) * 6.283) * .08 + (u < .03 || u > .97 || v < .02 || v > .98 ? .4 : 0), i, j), { id, n: [-1, 0, 0] });
      [160, 215, 270].forEach((sy, k) => { ++id; box(L, id, XR - 34, XR, sy, sy + 5, B.z0 + 14, B.z1 - 14, { all: mBevel(PAL.MET, 1), bottom: (q) => (u, v, i, j) => { X.SH.fl = F_EMIT; return mixc(NEONC.cyan, NEONC.white, .2); } });
        for (let b = 0; b < 8; b++) { const z = B.z0 + 30 + b * 32 + (k % 2) * 10, kind = (b * 3 + k * 5) % 7, c = [NEONC.gold, NEONC.orange, col('#b8602a'), col('#2a8a3a'), NEONC.cyan, col('#f0f0ff'), NEONC.pink, col('#7a2a9a')][(b + k * 3) % 8];   // 7 форм пляшок, 8 кольорів
          const h0 = [42, 30, 38, 24, 46, 34, 40][kind], w0 = [10, 14, 9, 16, 11, 12, 10][kind]; ++id;
          // силует за (u, v): 0 — коньяк (пузата), 1 — віскі (квадратна з широкими плечима), 2 — вино (довга шийка), 3 — фляга (низька широка), 4 — шампанське (фольга), 5 — джин (пряма з кулькою-пробкою), 6 — лікер (трикутна)
          const sil = (u, v) => { const du = Math.abs(u - .5); switch (kind) { case 0: return v < .3 ? du < .18 : du < .5 - Math.max(0, (v - .9)) * 2; case 1: return v < .18 ? du < .2 : true; case 2: return v < .45 ? du < .16 : du < .5 - Math.max(0, .3 - v); case 3: return v < .25 ? du < .2 : true; case 4: return v < .4 ? du < .17 + v * .3 : true; case 5: return v < .1 ? du < .22 : v < .25 ? du < .14 : true; default: return du < .1 + v * .4; } };
          box(L, id, XR - 20 - w0 / 2, XR - 20 + w0 / 2, sy - h0, sy, z - w0 / 2, z + w0 / 2, { all: (q, w, h) => (u, v, i, j) => { if (!sil(u, v)) return 0; X.SH.fl = F_EMIT;
            if (v < .07) return kind === 4 ? ramp(PAL.GOLD, .85, i, j) : kind === 5 ? ramp(PAL.CHROME, .8, i, j) : ramp(kind === 0 ? PAL.WOOD : PAL.GOLD, .6, i, j);                                                 // кришка / фольга / пробка
            if (kind === 4 && v < .3) return ramp(PAL.GOLD, .7 + (u < .4 ? .2 : 0), i, j);                                                                                                                                  // фольга шампанського
            const lab = kind === 6 ? (v > .55 && v < .8 && Math.abs(u - .5) < .25) : (v > .45 && v < .72 && u > .18 && u < .82); if (lab) { const stripe = v > .5 && v < .67 && u > .3 && u < .7; return kind % 2 ? (stripe ? col('#1a1030') : rgb(240, 236, 220)) : (stripe ? mixc(c, NEONC.white, .5) : rgb(20, 16, 40)); }   // етикетка: світла або темна
            return mixc(dim(c, .8), NEONC.white, u < .3 ? .42 : u > .82 ? -.0 : .08); } }); } });
      // кулер з льодом і пляшками на краю стійки, касовий апарат, дошка-меню з піктограмами
      { ++id; box(L, id, B.x0 + 40, B.x1 - 10, B.y0 - 16, B.y0, B.z1 - 24, B.z1 - 2, { all: (q, w, h) => (u, v, i, j) => { X.SH.fl = F_EMIT; return v < .3 ? rgb(200, 240, 255, 230) : mixc(NEONC.cyan, col('#0a0626'), .55 + v * .3); } }); for (let k = 0; k < 4; k++) box(L, id, B.x0 + 48 + k * 12, B.x0 + 54 + k * 12, B.y0 - 30, B.y0 - 14, B.z1 - 16, B.z1 - 10, { all: (q) => (u, v, i, j) => { X.SH.fl = F_EMIT; return v < .25 ? ramp(PAL.GOLD, .6, i, j) : [NEONC.green, NEONC.gold, NEONC.orange, col('#b8602a')][k]; } });
        ++id; box(L, id, B.x0 + 12, B.x0 + 44, B.y0 - 22, B.y0, B.z0 + 10, B.z0 + 36, { all: mBevel(PAL.MET, 1), front: (q, w, h) => (u, v, i, j) => (v < .45 && u > .15 && u < .85) ? ((v < .4 && v > .1) ? mixc(NEONC.green, col('#0a0626'), .3) : ramp(PAL.MET, q, i, j)) : bevel(PAL.MET, q, w, h, 1)(u, v, i, j) });   // каса з зеленим екраном
        ++id; box(L, id, XR - 4, XR, 150, 200, B.z1 - 2, B.z1 + 40, { left: (q, fw, fh) => { const t = tex(Math.round(fw), Math.round(fh), (c, W, H) => { c.fillStyle = '#0d0a2a'; c.fillRect(0, 0, W, H); c.strokeStyle = '#ffd27a'; c.strokeRect(1.5, 1.5, W - 3, H - 3); const ic = [['#ff4fd8', 'cocktail'], ['#ffe27a', 'beer'], ['#3be8ff', 'shot'], ['#3bff8a', 'juice']]; ic.forEach(([col, kind], k) => { const y = 7 + k * 11; c.fillStyle = col; if (kind === 'cocktail') { c.beginPath(); c.moveTo(5, y); c.lineTo(13, y); c.lineTo(9, y + 5); c.fill(); c.fillRect(8.5, y + 5, 1, 3); } else if (kind === 'beer') { c.fillRect(6, y + 1, 6, 7); c.fillStyle = '#fff'; c.fillRect(6, y, 6, 2); } else if (kind === 'shot') c.fillRect(7, y + 2, 4, 5); else { c.fillRect(6, y + 1, 6, 7); c.fillStyle = '#fff'; c.fillRect(8, y - 1, 1, 3); } c.fillStyle = '#c8c0e0'; for (let m = 0; m < 3 + k; m++) c.fillRect(17 + m * 4, y + 4, 3, 1); }); }); return (u, v) => t(1 - u, v); } }); }   // дошка-меню з піктограмами й «цінами»
      // на стійці: пивні крани, шейкер, відро з льодом, миска з лимонами, келихи з трубочками
      { ++id; const z0 = B.z0 + 60; box(L, id, B.x0 + 60, B.x0 + 84, B.y0 - 30, B.y0, z0 - 8, z0 + 8, { all: mBevel(PAL.CHROME, 1) }); [0, 1, 2].forEach(k => { const z = z0 - 10 + k * 10; X.tube(L, [B.x0 + 62, B.y0 - 30, z], [B.x0 + 48, B.y0 - 36, z], 2.5, () => ramp(PAL.CHROME, .7, 0, 0), { id }); X.disc(L, [B.x0 + 46, B.y0 - 38, z], 3, () => [NEONC.pink, NEONC.gold, NEONC.green][k], { id }); });   // крани
        ++id; box(L, id, B.x0 + 20, B.x0 + 34, B.y0 - 26, B.y0, B.z1 - 60, B.z1 - 46, { all: (q, w, h) => (u, v, i, j) => ramp(PAL.CHROME, .5 + (u < .35 ? .3 : 0) + (v < .2 ? .15 : 0), i, j) });                                                          // шейкер
        ++id; box(L, id, B.x0 + 56, B.x0 + 84, B.y0 - 18, B.y0, B.z1 - 50, B.z1 - 22, { all: (q, w, h) => (u, v, i, j) => v < .25 ? rgb(220, 240, 255, 230) : ramp(PAL.CHROME, .45 + (u < .3 ? .25 : 0), i, j) }); for (let k = 0; k < 5; k++) X.disc(L, [B.x0 + 62 + k * 5, B.y0 - 20, B.z1 - 36 - (k % 2) * 6], 2.5, (u, v) => rgb(225, 245, 255, 200), { id });   // відро з льодом
        ++id; box(L, id, B.x0 + 14, B.x0 + 42, B.y0 - 10, B.y0, B.z0 + 110, B.z0 + 138, { all: (q, w, h) => (u, v, i, j) => v > .6 ? ramp(PAL.CERAM, .6 - v * .3, i, j) : 0 }); for (let k = 0; k < 4; k++) X.disc(L, [B.x0 + 20 + k * 6, B.y0 - 12, B.z0 + 118 + (k % 2) * 8], 3.5, (u, v) => { const d = Math.hypot(u - .5, v - .5); return mixc(NEONC.gold, NEONC.white, d < .2 ? .5 : .1); }, { id });   // лимони
        [[B.z0 + 20, 'gold'], [B.z0 + 170, 'cyan'], [B.z0 + 230, 'orange'], [B.z0 + 290, 'pink']].forEach(([z, cn]) => { ++id; box(L, id, B.x0 + 36, B.x0 + 50, B.y0 - 22, B.y0, z - 7, z + 7, { front: (q) => (u, v, i, j) => v < .65 ? mixc(NEONC[cn], NEONC.white, u < .3 ? .5 : .15) : ramp(PAL.CHROME, .7, i, j), left: (q) => (u, v, i, j) => v < .65 ? dim(NEONC[cn], .8) : ramp(PAL.CHROME, .5, i, j), top: mFlat(PAL.CHROME, .9) }); X.tube(L, [B.x0 + 46, B.y0 - 22, z], [B.x0 + 52, B.y0 - 34, z], 1.5, () => NEONC.pink, { id }); X.disc(L, [B.x0 + 40, B.y0 - 26, z - 1], 4, (u, v) => v > .5 ? 0 : mixc(NEONC.green, NEONC.white, .2), { id }); }); }   // келихи з трубочкою й парасолькою
      [B.z0 + 40, B.z0 + 160, B.z0 + 280].forEach(z => { const x = B.x0 + 50; ++id; X.tube(L, [x, CEIL, z], [x, CEIL + 70, z], 1.5, () => ramp(PAL.STEEL, .5, 0, 0), { id });                      // лампи над баром
        X.face(L, [[x - 16, CEIL + 88, z], [x + 16, CEIL + 88, z], [x + 4, CEIL + 70, z], [x - 4, CEIL + 70, z]], [x - 16, CEIL + 88, z], [32, 0, 0], [0, -18, 0], (u, v, i2, j2) => ramp(PAL.GOLD, .4 + (u < .5 ? .2 : -.1) * (1 - v), i2, j2), { id, n: [0, 0, -1] }); X.disc(L, [x, CEIL + 90, z - .5], 4, (u, v) => { X.SH.fl = F_EMIT; return Math.hypot(u - .5, v - .5) < .25 ? NEONC.white : NEONC.gold; }, { id }); });
    }
    // ============ ФУРШЕТ ІЗ ЗАКУСКАМИ (06.11, власник: «зона з закусками виглядає слабо — покращити мінімум у три рази») ============
    // довгий стіл: біла скатертина з фалдами й LED-гірляндою по краю, хромовані марміти з кришками, триярусна підставка з кексами,
    // велика піца на дошці, вежа сендвічів, чаша пуншу з ополоником і фруктами (світиться), попкорн, фруктова тарілка, стос тарілок,
    // серветки, виделки; над столом — лампи
    { const C = GEO.snack, T0 = C.y0, cx = (C.x0 + C.x1) / 2, cz = (C.z0 + C.z1) / 2;
      const cloth = (q, w, h) => (u, v, i, j) => { const x = u * w, y = v * h; if (y < 3) { X.SH.fl = F_EMIT; return ((x % 10) < 3) ? mixc(NEONC.gold, NEONC.white, .5) : dim(NEONC.gold, .5); }   // гірлянда по краю
        const fold = Math.sin(x * .45) * .5 + .5; return ramp(PAL.CERAM, .5 + fold * .45 - v * .3 + (y > h - 3 ? -.35 : 0), i, j); };   // фалди
      ++id; box(L, id, C.x0, C.x1, T0, FLY, C.z0, C.z1, { front: cloth, right: cloth, top: (q, w, h) => (u, v, i, j) => ramp(PAL.CERAM, .9 + ((Math.floor(u * w / 10) + Math.floor(v * h / 10)) % 2 ? -.12 : 0) - v * .15, i, j) });
      // марміти: хромована основа й куполи з ручкою
      [C.z1 - 40, C.z1 - 92].forEach((z, k) => { ++id; box(L, id, cx - 26, cx + 26, T0 - 8, T0, z - 20, z + 20, { all: (q, w, h) => (u, v, i, j) => ramp(PAL.CHROME, .5 + (v < .2 ? .25 : 0) + (u < .15 ? .2 : 0), i, j) });
        X.disc(L, [cx + (k ? -4 : 4), T0 - 8, z - 20.5], 22, (u, v) => { if (v > .5) return 0; const d = Math.hypot(u - .5, (v - .5)); return ramp(PAL.CHROME, .35 + (1 - d * 2) * .5 + (Math.hypot(u - .36, v - .36) < .12 ? .35 : 0), 0, 0); }, { id }); X.tube(L, [cx + (k ? -4 : 4), T0 - 30, z - 21], [cx + (k ? -4 : 4), T0 - 36, z - 21], 3, () => ramp(PAL.CHROME, .8, 0, 0), { id }); });
      // триярусна підставка з кексами
      { const z = C.z0 + 40; ++id; X.tube(L, [cx + 24, T0, z], [cx + 24, T0 - 46, z], 2.5, () => ramp(PAL.CHROME, .7, 0, 0), { id }); [[0, 22], [16, 16], [32, 10]].forEach(([dy, r]) => { X.disc(L, [cx + 24, T0 - dy - 2, z - 1], r, (u, v) => { const d = Math.hypot(u - .5, (v - .5) * 3); return d > .5 ? 0 : ramp(PAL.CHROME, .55 + (d < .15 ? .3 : 0), 0, 0); }, { id });
        const n = r > 18 ? 6 : r > 12 ? 4 : 2; for (let k = 0; k < n; k++) { const a = k / n * 6.283, bx = cx + 24 + Math.cos(a) * (r - 6), bz = z + Math.sin(a) * (r - 6) * .5, c = [NEONC.pink, NEONC.cyan, NEONC.gold, NEONC.lil][k % 4]; ++id;
          box(L, id, bx - 4, bx + 4, T0 - dy - 10, T0 - dy - 2, bz - 4, bz + 4, { all: (q, w, h) => (u, v, i, j) => v < .5 ? mixc(c, NEONC.white, u < .3 ? .4 : .1) : ramp(PAL.WOOD, .6 - v * .3, i, j) }); X.disc(L, [bx, T0 - dy - 12, bz - 4.5], 1.8, () => col('#c81e3c'), { id }); } }); }
      // піца на дошці (велика), вежа сендвічів
      ++id; box(L, id, cx - 30, cx + 30, T0 - 3, T0, C.z0 + 90, C.z0 + 150, { all: mFlat(PAL.WOOD, .7) });
      ++id; box(L, id, cx - 26, cx + 26, T0 - 7, T0 - 3, C.z0 + 94, C.z0 + 146, { top: (q, w, h) => (u, v, i, j) => { const dx = u - .5, dy = v - .5, d = Math.hypot(dx, dy) * 2; if (d > 1) return 0; const a = Math.atan2(dy, dx), cut = Math.abs(((a / Math.PI * 4) % 1 + 1) % 1 - .5) < .025;
        if (cut) return col('#5a2a10'); if (d > .84) return ramp(PAL.GOLD, .5 + (d - .84) * 3, i, j); const hv = hash(Math.floor(u * 9), Math.floor(v * 9)); return hv > .72 ? col('#c8302a') : hv > .62 ? col('#2a8a3a') : hv > .55 ? col('#3a3a3a') : ramp(PAL.GOLD, .74 + (hv - .5) * .1, i, j); }, front: mFlat(PAL.GOLD, .5), right: mFlat(PAL.GOLD, .45) });
      ++id; for (let k = 0; k < 5; k++) box(L, id, cx - 40 + (k % 2) * 5, cx - 12 + (k % 2) * 5, T0 - 6 - k * 6, T0 - k * 6, C.z1 - 150 - (k % 2) * 3, C.z1 - 118 - (k % 2) * 3, { all: (q, w, h) => (u, v, i, j) => v < .3 ? ramp(PAL.CREAM, .7 - v, i, j) : v < .5 ? col('#3aa040') : v < .7 ? col('#e0b040') : v < .82 ? col('#c8302a') : ramp(PAL.CREAM, .65, i, j) }); X.tube(L, [cx - 26, T0 - 30, C.z1 - 134], [cx - 26, T0 - 44, C.z1 - 134], 1.5, () => ramp(PAL.CHROME, .7, 0, 0), { id }); X.disc(L, [cx - 26, T0 - 46, C.z1 - 135], 3, () => NEONC.pink, { id });   // шпажка з прапорцем
      // чаша пуншу з ополоником (світиться), попкорн, фрукти, тарілки, серветки, виделки
      ++id; box(L, id, cx - 2, cx + 38, T0 - 22, T0, C.z1 - 70, C.z1 - 30, { all: (q, w, h) => (u, v, i, j) => { if (v < .5) { X.SH.fl = F_EMIT; return hash(Math.floor(u * 8), Math.floor(v * 8) + 31) > .8 ? mixc(NEONC.orange, NEONC.white, .5) : mixc(NEONC.pink, NEONC.white, .2); } return ramp(PAL.CHROME, .5 + (u < .3 ? .25 : 0), i, j); } }); X.tube(L, [cx + 30, T0 - 22, C.z1 - 50], [cx + 44, T0 - 42, C.z1 - 50], 2, () => ramp(PAL.CHROME, .75, 0, 0), { id }); X.disc(L, [cx + 45, T0 - 44, C.z1 - 51], 3, () => ramp(PAL.CHROME, .8, 0, 0), { id });
      ++id; box(L, id, cx + 4, cx + 36, T0 - 16, T0, C.z0 + 160, C.z0 + 192, { all: (q, w, h) => (u, v, i, j) => v > .55 ? ((u * w % 6) < 3 ? col('#c8302a') : rgb(245, 240, 232)) : (hash(Math.floor(u * 7), Math.floor(v * 4) + 41) > .5 ? rgb(255, 244, 200) : rgb(240, 220, 150)) }); for (let k = 0; k < 6; k++) X.disc(L, [cx + 8 + k * 5, T0 - 18 - (k % 2) * 3, C.z0 + 166 + (k % 3) * 8], 2.5, (u, v) => rgb(255, 246, 210), { id });   // попкорн у смугастому відрі
      ++id; X.disc(L, [cx - 20, T0 - 1, C.z0 + 190], 18, (u, v) => { const d = Math.hypot(u - .5, (v - .5) * 3); return d > .5 ? 0 : ramp(PAL.CERAM, .75 + (d > .42 ? -.2 : 0), 0, 0); }, { id }); for (let k = 0; k < 9; k++) { const a = k / 9 * 6.283, r = k < 5 ? 10 : 4; X.disc(L, [cx - 20 + Math.cos(a) * r, T0 - 4, C.z0 + 190 + Math.sin(a) * r * .5 - .8], 2.6, (u, v) => { const d = Math.hypot(u - .5, v - .5); return mixc([NEONC.green, NEONC.pink, NEONC.orange][k % 3], NEONC.white, d < .2 ? .5 : .05); }, { id }); }   // фруктова тарілка
      ++id; for (let k = 0; k < 6; k++) box(L, id, cx - 42, cx - 16, T0 - 3 - k * 2.4, T0 - k * 2.4, C.z0 + 10, C.z0 + 36, { all: (q, w, h) => (u, v, i, j) => ramp(PAL.CREAM, .88 - v * .5, i, j) });   // стос тарілок
      ++id; box(L, id, cx + 20, cx + 44, T0 - 5, T0, C.z0 + 8, C.z0 + 30, { all: (q, w, h) => (u, v, i, j) => ramp(PAL.PINK, .8 - v * .2, i, j) }); for (let k = 0; k < 5; k++) X.tube(L, [cx + 30 + k * 3, T0 - 5, C.z0 + 14], [cx + 30 + k * 3, T0 - 16, C.z0 + 14], 1, () => ramp(PAL.CHROME, .7, 0, 0), { id });   // серветки й виделки
      // ще закуски (власник, 06.11: «закуски різноманітніші»): шоколадний фонтан (світиться), суші на дошці, сирна дошка з виноградом,
      // шашлички на шпажках, вежа з пончиків, макаруни, банки з цукерками, кренделі
      ++id; box(L, id, cx - 36, cx - 8, T0 - 4, T0, C.z1 - 24, C.z1 + 2, { all: mFlat(PAL.CHROME, .6) }); [[12, 0], [9, 10], [6, 20]].forEach(([r, dy]) => X.disc(L, [cx - 22, T0 - 6 - dy, C.z1 - 11 - .5], r, (u, v) => { const d = Math.hypot(u - .5, (v - .5) * 2.5); if (d > .5) return 0; X.SH.fl = F_EMIT; return mixc(col('#7a3a14'), NEONC.white, d < .2 ? .25 : .05); }, { id })); X.tube(L, [cx - 22, T0 - 6, C.z1 - 11], [cx - 22, T0 - 34, C.z1 - 11], 3, () => ramp(PAL.CHROME, .75, 0, 0), { id }); X.disc(L, [cx - 22, T0 - 36, C.z1 - 12], 4, () => ramp(PAL.CHROME, .9, 0, 0), { id });   // шоколадний фонтан
      ++id; box(L, id, cx + 6, cx + 40, T0 - 3, T0, C.z0 + 46, C.z0 + 76, { all: mFlat(PAL.DARK, .6) }); for (let k = 0; k < 6; k++) box(L, id, cx + 10 + (k % 3) * 10, cx + 18 + (k % 3) * 10, T0 - 9, T0 - 3, C.z0 + 50 + Math.floor(k / 3) * 14, C.z0 + 58 + Math.floor(k / 3) * 14, { all: (q, w, h) => (u, v, i, j) => v < .35 ? [col('#ff6a4a'), col('#ffb040'), col('#f0f0ff')][k % 3] : v < .55 ? col('#1a3a1a') : rgb(245, 245, 235) });   // суші
      ++id; box(L, id, cx - 44, cx - 12, T0 - 3, T0, C.z0 + 120, C.z0 + 150, { all: mFlat(PAL.WOOD, .75) }); [[cx - 40, '#ffe27a', 7], [cx - 28, '#ffd27a', 9], [cx - 18, '#f0e0a0', 6]].forEach(([x, cc, r]) => box(L, id, x - r / 2, x + r / 2, T0 - 9, T0 - 3, C.z0 + 128, C.z0 + 128 + r, { all: (q, w, h) => (u, v, i, j) => v < .3 ? mixc(col(cc), NEONC.white, .3) : hash(Math.floor(u * 5), Math.floor(v * 4) + 7) > .8 ? col('#c8a040') : col(cc) })); for (let k = 0; k < 7; k++) X.disc(L, [cx - 36 + (k % 4) * 4, T0 - 4 - Math.floor(k / 4) * 3, C.z0 + 143 - (k % 3)], 1.8, () => col('#6a2a9a'), { id });   // сирна дошка з виноградом
      ++id; for (let k = 0; k < 5; k++) { const z = C.z0 + 214 + k * 7; X.tube(L, [cx - 40, T0 - 2, z], [cx - 4, T0 - 2, z], 1, () => ramp(PAL.CHROME, .7, 0, 0), { id }); for (let m = 0; m < 4; m++) box(L, id, cx - 36 + m * 8, cx - 30 + m * 8, T0 - 6, T0 - 1, z - 2.5, z + 2.5, { all: (q) => (u, v, i, j) => m % 2 ? col('#a04a2a') : [col('#ff4040'), col('#3aa040'), col('#ffe27a')][k % 3] }); }   // шашлички
      ++id; [[0, 9], [8, 7], [16, 5]].forEach(([dy, r]) => { for (let m = 0; m < (r > 8 ? 4 : r > 6 ? 2 : 1); m++) { const a = m / 4 * 6.283, dx = Math.cos(a) * (r - 4), dz = Math.sin(a) * (r - 4) * .5; box(L, id, cx + 20 + dx - 4, cx + 20 + dx + 4, T0 - dy - 6, T0 - dy, C.z0 + 230 + dz - 4, C.z0 + 230 + dz + 4, { all: (q, w, h) => (u, v, i, j) => { const ring = Math.hypot(u - .5, v - .5) < .18; return ring ? 0 : v < .4 ? [NEONC.pink, col('#7a3a14'), NEONC.cyan][(m + dy) % 3] : col('#e0a060'); } }); } });   // вежа з пончиків
      ++id; for (let k = 0; k < 8; k++) box(L, id, cx + 4 + (k % 4) * 8, cx + 10 + (k % 4) * 8, T0 - 4 - Math.floor(k / 4) * 4, T0 - Math.floor(k / 4) * 4, C.z0 + 268, C.z0 + 274, { all: (q) => (u, v, i, j) => v > .4 && v < .6 ? rgb(255, 250, 240) : [NEONC.pink, NEONC.lil, NEONC.green, NEONC.gold][k % 4] });   // макаруни
      ++id; [[C.z0 + 284, NEONC.pink], [C.z0 + 296, NEONC.cyan]].forEach(([z, cc]) => { box(L, id, cx - 14, cx - 2, T0 - 16, T0, z - 5, z + 5, { all: (q, w, h) => (u, v, i, j) => { X.SH.fl = F_EMIT; return v < .15 ? ramp(PAL.CHROME, .7, i, j) : hash(Math.floor(u * 4), Math.floor(v * 6) + 53) > .5 ? mixc(cc, NEONC.white, .3) : rgb(230, 240, 255, 120); } }); });   // банки з цукерками
      ++id; for (let k = 0; k < 4; k++) X.disc(L, [cx + 30 + (k % 2) * 8, T0 - 3 - Math.floor(k / 2) * 3, C.z0 + 300 - (k % 2) * 4], 4, (u, v) => { const d = Math.hypot(u - .5, v - .5); return d > .5 || d < .18 ? 0 : col(d > .42 ? '#8a5a2a' : '#c88a40'); }, { id });   // кренделі
      [C.z0 + 40, C.z0 + 120, C.z0 + 200].forEach(z => { const x = cx; ++id; X.tube(L, [x, CEIL, z], [x, CEIL + 70, z], 1.5, () => ramp(PAL.STEEL, .5, 0, 0), { id });                                   // лампи над фуршетом
        X.face(L, [[x - 16, CEIL + 88, z], [x + 16, CEIL + 88, z], [x + 4, CEIL + 70, z], [x - 4, CEIL + 70, z]], [x - 16, CEIL + 88, z], [32, 0, 0], [0, -18, 0], (u, v, i2, j2) => ramp(PAL.PINK, .4 + (u < .5 ? .2 : -.1) * (1 - v), i2, j2), { id, n: [0, 0, -1] }); X.disc(L, [x, CEIL + 90, z - .5], 4, (u, v) => { X.SH.fl = F_EMIT; return Math.hypot(u - .5, v - .5) < .25 ? NEONC.white : NEONC.pink; }, { id }); });
    }
    // лаунж-диванчик уздовж лівої стіни (далі, біля стіни)
    { ++id; box(L, id, 150, 260, 334, FLY, 290, 390, { front: mBevel(PAL.PLUM, 3, { seam: 36 }), right: mBevel(PAL.PLUM, 3), top: mBevel(PAL.PLUM, 2) });
      ++id; box(L, id, 150, 260, 290, 334, 376, 392, { front: mBevel(PAL.PLUM, 3, { seam: 36 }), right: mBevel(PAL.PLUM, 2), top: mBevel(PAL.PLUM, 2) }); }
    // кульки на нитках (прив'язані до підлоги / меблів)
    GEO.balloons.forEach(([x, y, z, cn]) => { const c = NEONC[cn]; ++id; X.tube(L, [x, y + 14, z], [x + (hash(x, 3) - .5) * 30, y + 70, z], 1, () => ramp(PAL.CHROME, .45, 0, 0), { id });
      ++id; X.disc(L, [x, y, z], 12, (u, v, i, j) => { const dx = u - .5, dy = (v - .5) * .85, d = Math.hypot(dx, dy) * 2; if (d > 1) return 0; X.SH.fl = F_EMIT; const hl = Math.hypot(dx + .18, dy + .2) < .16; return hl ? mixc(c, NEONC.white, .7) : d > .82 ? dim(c, .55) : d > .5 ? dim(c, .8) : c; }, { id }); });

    // піна-пушки на стовпчиках огорожі (обабіч, дивляться на танцпол) і димові машини за колонками (події — party.js)
    GEO.foam.forEach(({ x, z }, k) => { ++id; box(L, id, x - 10, x + 10, 290, 330, z - 10, z + 10, { all: mBevel(PAL.STEEL, 2) }); const d = k ? -1 : 1;
      box(L, id, x - 14, x + 14, 266, 290, z - 14, z + 14, { all: mBevel(PAL.MET, 2) }); X.tube(L, [x, 272, z], [x + d * 34, 258, z + 40], 12, (u) => ramp(PAL.CHROME, .4 + (Math.abs(u - .5) < .25 ? .35 : 0), 0, 0), { id }); X.disc(L, [x + d * 36, 257, z + 42], 7, (u, v) => { const r = Math.hypot(u - .5, v - .5); return r > .5 ? 0 : r > .4 ? ramp(PAL.CHROME, .7, 0, 0) : col('#0a0626'); }, { id });
      X.disc(L, [x, 300, z - 10.5], 3, () => { X.SH.fl = F_EMIT; return NEONC.cyan; }, { id }); });
    GEO.smoke.forEach(({ x, z }) => { ++id; box(L, id, x - 22, x + 22, FLY - 26, FLY, z - 14, z + 14, { all: mBevel(PAL.STEEL, 2), front: (q, w, h) => (u, v, i, j) => (v > .35 && v < .65 && u > .2 && u < .8) ? col('#05030f') : bevel(PAL.STEEL, q, w, h, 2)(u, v, i, j) }); X.disc(L, [x + 14, FLY - 20, z - 14.5], 2, () => { X.SH.fl = F_EMIT; return NEONC.green; }, { id }); });
    // передній план: низьке огородження лаунжу обабіч (темне, з тонким неоном зверху) — три плани: огорожа → танцпол → стіна
    { const Rl = GEO.rail; [[XL + 40, 774 - 330], [774 + 330, XR - 40]].forEach(([x0, x1]) => { ++id; box(L, id, x0, x1, Rl.y0, Rl.y0 + 4, Rl.z - 3, Rl.z + 3, { all: mBevel(PAL.STEEL, 1), top: mNeon(NEONC.lil, .5) });
      for (let x = x0; x <= x1; x += (x1 - x0) / 3) { ++id; box(L, id, x - 4, x + 4, Rl.y0 + 4, FLY, Rl.z - 4, Rl.z + 4, { all: mBevel(PAL.STEEL, 1) }); } }); }
    // контур і віддзеркалення в підлозі (все, що стоїть на підлозі або висить на стінах)
    X.outline(L, col('#060313'), 1); bake(L);
    X.reflect(L, i => (i === ID_FLOOR || i === 5 ? null : { y: FLY, h: 60 }), { a: .34, h: 60, emit: 2.2, streak: true });
    const cv = X.canvas(L); bloom(cv, L); return { cv, x0: L.x0, y0: L.y0 };
  }
  return { build, GEO, PAL, NEONC, LIGHTS, lightAt };
})();

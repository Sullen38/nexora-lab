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
 * кромкою, полиця з пляшками, що світяться), стіл із тортом у три яруси вздовж лівої, кульки на нитках, лаунж-диванчик.
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
    booth: { x0: 774 - 120, x1: 774 + 120, y0: 300, z0: 200, z1: 262 }, podium: { y: 318, z: 282 },   // Nexi стоїть на подіумі за пультом
    speakers: [{ x: 774 - 360, z: 210 }, { x: 774 + 360, z: 210 }],                                   // стек: 52 завширшки, 150 заввишки
    ball: { x: 774, y: 196, z: 260, r: 26 }, sign: { x0: 774 - 210, x1: 774 + 210, y0: 64, y1: 128, z: ZB - 6 },
    lamps: [774 - 420, 774 - 140, 774 + 140, 774 + 420].map(x => ({ x, y: CEIL + 14, z: 150 })),      // прожектори на рейці
    bar: { x0: 1226, x1: 1326, z0: -40, z1: 300, y0: 332 }, barman: { x: 1372, y: 346, z: 150 }, snack: { x0: 150, x1: 262, z0: 40, z1: 270, y0: 338 },
    crowd: [], rail: { z: -210, y0: 330 }, poster: { x0: 774 - 560, x1: 774 - 300, y0: 78, y1: 212 }, cat: { x: 774 - 360, y: FLY - 152, z: 240 },   // афіша колекції на задній стіні; Рудик на лівій колонці
    bulbs: [], balloons: [[214, 150, 60, 'pink'], [240, 128, 90, 'cyan'], [268, 158, 40, 'gold'], [1330, 146, 60, 'green'], [1300, 124, 100, 'orange'], [1272, 154, 40, 'lil'], [560, 118, 420, 'pink'], [990, 120, 420, 'cyan']],
  };
  for (let i = 0; i < 18; i++) { const side = i < 9 ? -1 : 1, k = i % 9; GEO.crowd.push({ x: 774 + side * (150 + k * 36 + (k % 2) * 10), z: 176 + (k % 3) * 9, h: 44 + hash(i, 5) * 14, ph: hash(i, 9) * 6, w: 20 + hash(i, 2) * 8 }); }   // натовп-тло обабіч пульта
  (() => { for (let w = 0; w < 2; w++) for (let i = 0; i <= 11; i++) { const u = i / 11, xa = w ? XR - 10 : XL + 10, xb = w ? 774 + 230 : 774 - 230, x = xa + (xb - xa) * u, y = CEIL + 14 + Math.sin(u * Math.PI) * 34 + u * 8, z = ZB - 60 + (1 - u) * -120; GEO.bulbs.push([x, y, z]); } })();

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
    // вивіска: плита на задній стіні, текст неоном, рамка з лампочками (блимають — живий шар)
    { const S = GEO.sign, w = S.x1 - S.x0, h = S.y1 - S.y0; ++id;
      box(L, id, S.x0, S.x1, S.y0, S.y1, S.z, ZB, { all: mBevel(PAL.STEEL, 3), front: (q, fw, fh) => { const base = bevel(PAL.STEEL, q - .1, fw, fh, 3), t = tex(w, h, (c, W, H) => {
        c.strokeStyle = '#ff4fd8'; c.lineWidth = 1; c.strokeRect(5.5, 5.5, W - 11, H - 11); const sign = NX.t('party.sign'); c.font = '34px "Press Start 2P", monospace'; let tw = c.measureText(sign).width, fs = 34; if (tw > W - 44) { fs = Math.floor(34 * (W - 44) / tw); }
        for (const [dx, dy, cc] of [[-2, 0, '#8a1a7a'], [2, 0, '#8a1a7a'], [0, -2, '#8a1a7a'], [0, 2, '#8a1a7a'], [-1, 0, '#ff4fd8'], [1, 0, '#ff4fd8'], [0, -1, '#ff4fd8'], [0, 1, '#ff4fd8'], [0, 0, '#fff0fb']]) P.text(c, sign, W / 2 + dx, H / 2 + fs * .42 + dy, cc, fs, 'center'); });
        return (u, v, i, j) => { const cc = t(u, v); if (!cc) return base(u, v, i, j); X.SH.fl = F_EMIT; return cc; }; } }); }
    // афіша колекції на задній стіні (рамка; портрети — живий шар party.js: drawPoster)
    { const Po = GEO.poster; ++id; box(L, id, Po.x0, Po.x1, Po.y0, Po.y1, ZB - 4, ZB, { all: mBevel(PAL.MET, 3), front: (q, fw, fh) => { const b = bevel(PAL.MET, q, fw, fh, 3); return (u, v, i, j) => (u * fw > 4 && u * fw < fw - 4 && v * fh > 4 && v * fh < fh - 4) ? ramp(PAL.DARK || PAL.STEEL, .15, i, j) : b(u, v, i, j); } }); }
    // дзеркальна куля на ланцюгу
    { const B = GEO.ball; ++id; X.tube(L, [B.x, CEIL, B.z], [B.x, B.y - B.r, B.z], 2, (u, v, i, j) => ramp(PAL.CHROME, .5 + (Math.sin(v * 90) > 0 ? .2 : -.2), i, j), { id });
      ++id; X.disc(L, [B.x, B.y, B.z], B.r, (u, v, i, j) => { const dx = u - .5, dy = v - .5, d = Math.hypot(dx, dy) * 2, tx = Math.floor(u * 11), ty = Math.floor(v * 11), hv = hash(tx, ty); const q = .35 + .5 * (1 - d) + (hv - .5) * .5 + (dx < 0 && dy < 0 ? .15 : 0); return ((Math.floor(u * 44) % 4 === 0 || Math.floor(v * 44) % 4 === 0) ? ramp(PAL.STEEL, .3, i, j) : ramp(PAL.CHROME, q, i, j)); }, { id }); }
    // гірлянди: дроти (лампочки — живий шар)
    { ++id; for (let w = 0; w < 2; w++) for (let i = 1; i <= 11; i++) { const a = GEO.bulbs[w * 12 + i - 1], b = GEO.bulbs[w * 12 + i]; X.tube(L, a, b, 1.2, () => ramp(PAL.STEEL, .55, 0, 0), { id }); } }
    // DJ-пульт: подіум ззаду, корпус, глянцевий верх, передня панель з написом
    { const B = GEO.booth; ++id; box(L, id, B.x0 - 30, B.x1 + 30, GEO.podium.y, FLY, B.z1 - 10, B.z1 + 50, { front: mBevel(PAL.MET, 2, { seam: 40 }), top: mBevel(PAL.STEEL, 2), left: mBevel(PAL.MET, 2), right: mBevel(PAL.MET, 2) });
      ++id; const ID_BOOTH = id; box(L, id, B.x0, B.x1, B.y0, FLY, B.z0, B.z1, { top: mGloss(PAL.TOP), left: mBevel(PAL.MET, 2), right: mBevel(PAL.MET, 2),
        front: (q, fw, fh) => { const base = bevel(PAL.MET, q, fw, fh, 2), t = tex(Math.round(fw), Math.round(fh), (c, W, H) => { c.fillStyle = '#120b30'; c.fillRect(6, 6, W - 12, H - 12); c.strokeStyle = '#3be8ff'; c.strokeRect(6.5, 6.5, W - 13, H - 13); P.text(c, NX.t('party.dj'), W / 2, H / 2 + 5, '#3be8ff', 12, 'center'); for (let i = 0; i < 7; i++) { c.fillStyle = i % 2 ? '#ff4fd8' : '#3be8ff'; c.fillRect(14 + i * 32, H - 12, 14, 2); } });
          return (u, v, i, j) => { const cc = t(u, v); if (!cc) return base(u, v, i, j); X.SH.fl = F_EMIT; return cc; }; } });
      ++id; box(L, id, B.x0 - 2, B.x1 + 2, B.y0 - 3, B.y0, B.z0 - 2, B.z1 + 2, { front: mNeon(NEONC.cyan, .8), top: mFlat(PAL.STEEL, .35), left: mNeon(NEONC.cyan, .8), right: mNeon(NEONC.cyan, .8) });   // неонова кромка верху
      GEO.boothId = ID_BOOTH; }
    // колонки: стек із двох скринь, два динаміки й твітер на кожній
    GEO.speakers.forEach(sp => { for (let k = 0; k < 2; k++) { const y1 = FLY - k * 76, y0 = y1 - 76, z0 = sp.z, z1 = sp.z + 60; ++id;
      box(L, id, sp.x - 28, sp.x + 28, y0, y1, z0, z1, { front: mBevel(PAL.STEEL, 3), top: mBevel(PAL.STEEL, 2), left: mBevel(PAL.STEEL, 2), right: mBevel(PAL.STEEL, 2) });
      [[y0 + 22, 15], [y0 + 54, 11]].forEach(([cy, r]) => X.disc(L, [sp.x, cy, z0 - .6], r, (u, v, i, j) => { const d = Math.hypot(u - .5, v - .5) * 2; return d > .86 ? ramp(PAL.MET, .7 - (v - .5), i, j) : d < .22 ? ramp(PAL.CHROME, .6 - d, i, j) : ramp(PAL.STEEL, .55 - d * .5 + (u < .5 ? .08 : -.08), i, j); }, { id }));
      X.face(L, [[sp.x - 20, y0 + 6, z0 - .6], [sp.x + 20, y0 + 6, z0 - .6], [sp.x + 20, y0 + 9, z0 - .6], [sp.x - 20, y0 + 9, z0 - .6]], [sp.x - 20, y0 + 6, z0 - .6], [40, 0, 0], [0, 3, 0], (u, v) => { X.SH.fl = F_EMIT; return u % .25 < .12 ? NEONC.pink : dim(NEONC.pink, .4); }, { id, n: [0, 0, -1] }); } });
    // бар уздовж правої стіни: стійка з неоновою кромкою (за нею — місце бармена, party.js), полиця з пляшками, що світяться, келихи на стійці
    { const B = GEO.bar; ++id; box(L, id, B.x0, B.x1, B.y0, FLY, B.z0, B.z1, { front: mBevel(PAL.WOOD, 3, { seam: 24 }), left: mBevel(PAL.WOOD, 3, { seam: 24 }), top: mGloss(PAL.TOP) });
      ++id; box(L, id, B.x0 - 2, B.x1, B.y0 - 3, B.y0, B.z0 - 2, B.z1, { front: mNeon(NEONC.pink, .8), left: mNeon(NEONC.pink, .8), top: mFlat(PAL.STEEL, .35) });
      ++id; box(L, id, XR - 30, XR, 196, 202, B.z0 + 20, B.z1 - 20, { front: mBevel(PAL.MET, 1), top: mBevel(PAL.MET, 1), left: mBevel(PAL.MET, 1), bottom: mBevel(PAL.MET, 1) });   // полиця
      ['pink', 'cyan', 'gold', 'green', 'orange', 'lil', 'cyan', 'pink'].forEach((cn, k) => { const z = B.z0 + 36 + k * 34, c = NEONC[cn]; ++id;
        box(L, id, XR - 26, XR - 12, 168, 196, z - 6, z + 6, { all: (q) => (u, v, i, j) => { X.SH.fl = F_EMIT; return v < .25 ? (u > .3 && u < .7 ? dim(c, .8) : 0) : mixc(dim(c, .75), NEONC.white, u < .35 ? .35 : u > .8 ? -.0 : .05); } }); });
      [[B.z0 + 60, 'gold'], [B.z0 + 120, 'cyan'], [B.z0 + 220, 'orange']].forEach(([z, cn]) => { ++id; box(L, id, B.x0 + 36, B.x0 + 50, B.y0 - 20, B.y0, z - 7, z + 7, { front: (q) => (u, v, i, j) => v < .6 ? mixc(NEONC[cn], NEONC.white, u < .3 ? .5 : .15) : ramp(PAL.CHROME, .7, i, j), left: (q) => (u, v, i, j) => v < .6 ? dim(NEONC[cn], .8) : ramp(PAL.CHROME, .5, i, j), top: mFlat(PAL.CHROME, .9) }); }); }
    // стіл із закусками вздовж лівої стіни (власник, 06.11: «замість торту — стіл із закусками різними»): скатертина, піца на
    // дошці, гора сендвічів, миска з фруктами, кекси, чіпси в мисці, глечик соку, стос тарілок
    { const C = GEO.snack; ++id; box(L, id, C.x0, C.x1, C.y0, FLY, C.z0, C.z1, { front: mBevel(PAL.WOOD, 3, { seam: 24 }), right: mBevel(PAL.WOOD, 3, { seam: 24 }), top: (q, w, h) => (u, v, i, j) => ramp(PAL.CREAM, .8 + ((Math.floor(u * w / 12) + Math.floor(v * h / 12)) % 2 ? -.18 : 0) - v * .15, i, j) });
      ++id; box(L, id, C.x0 - 2, C.x1 + 2, C.y0 - 2, C.y0, C.z0 - 2, C.z1 + 2, { front: mNeon(NEONC.gold, .8), right: mNeon(NEONC.gold, .8), top: mFlat(PAL.STEEL, .35) });
      const T0 = C.y0, cx = (C.x0 + C.x1) / 2;
      ++id; box(L, id, cx - 26, cx + 26, T0 - 3, T0, C.z1 - 70, C.z1 - 18, { all: mFlat(PAL.WOOD, .7) });                                     // дошка з піцою
      ++id; box(L, id, cx - 22, cx + 22, T0 - 6, T0 - 3, C.z1 - 66, C.z1 - 22, { top: (q, w, h) => (u, v, i, j) => { const dx = u - .5, dy = v - .5, d = Math.hypot(dx, dy) * 2; if (d > 1) return 0; const a = Math.atan2(dy, dx), cut = Math.abs(((a / Math.PI * 4) % 1 + 1) % 1 - .5) < .03;
        if (cut) return col('#5a2a10'); if (d > .86) return ramp(PAL.GOLD, .55 + (d - .86) * 3, i, j); const pep = hash(Math.floor(u * 7), Math.floor(v * 7)) > .62; return pep ? col(hash(Math.floor(u * 7) + 3, Math.floor(v * 7)) > .5 ? '#c8302a' : '#2a8a3a') : ramp(PAL.GOLD, .72, i, j); }, front: mFlat(PAL.GOLD, .5), right: mFlat(PAL.GOLD, .45) });
      ++id; for (let k = 0; k < 4; k++) box(L, id, cx - 34 + (k % 2) * 6, cx - 10 + (k % 2) * 6, T0 - 6 - k * 6, T0 - k * 6, C.z0 + 40 - (k % 2) * 4, C.z0 + 70 - (k % 2) * 4,           // гора сендвічів
        { all: (q, w, h) => (u, v, i, j) => v < .3 ? ramp(PAL.CREAM, .7 - v, i, j) : v < .5 ? col('#3aa040') : v < .7 ? col('#e0b040') : v < .82 ? col('#c8302a') : ramp(PAL.CREAM, .65, i, j) });
      ++id; box(L, id, cx + 2, cx + 36, T0 - 14, T0, C.z0 + 36, C.z0 + 76, { all: (q, w, h) => (u, v, i, j) => v > .55 ? ramp(PAL.CHROME, .55 - (v - .55) * .6 + (u < .2 ? .2 : 0), i, j) : (() => { const f = hash(Math.floor(u * 6), Math.floor(v * 5) + 11); return col(f < .25 ? '#e03a3a' : f < .5 ? '#ffb020' : f < .75 ? '#7ad040' : '#8a40c8'); })() });   // миска з фруктами
      [[cx - 36, C.z1 - 110, '#ff84d4'], [cx - 22, C.z1 - 100, '#9af6ff'], [cx - 8, C.z1 - 112, '#ffe27a'], [cx + 6, C.z1 - 98, '#c08af0']].forEach(([x, z, c]) => { ++id; box(L, id, x - 6, x + 6, T0 - 9, T0, z - 6, z + 6, { all: (q, w, h) => (u, v, i, j) => v < .45 ? mixc(col(c), NEONC.white, u < .3 ? .4 : .1) : ramp(PAL.WOOD, .6 - v * .3, i, j) }); X.disc(L, [x, T0 - 11, z - 6.5], 2, () => col('#c81e3c'), { id }); });   // кекси з вишенькою
      ++id; box(L, id, cx + 12, cx + 44, T0 - 10, T0, C.z1 - 118, C.z1 - 86, { all: (q, w, h) => (u, v, i, j) => v > .5 ? ramp(PAL.LILAC, .6 - (v - .5) * .5, i, j) : col(hash(Math.floor(u * 8), Math.floor(v * 4) + 21) > .5 ? '#ffd27a' : '#e8b040') });   // чіпси в мисці
      ++id; box(L, id, cx + 26, cx + 42, T0 - 30, T0, C.z0 + 90, C.z0 + 106, { all: (q, w, h) => (u, v, i, j) => { X.SH.fl = F_EMIT; return v < .2 ? ramp(PAL.CHROME, .7, i, j) : mixc(NEONC.orange, NEONC.white, u < .3 ? .4 : .05); } });   // глечик соку
      ++id; for (let k = 0; k < 5; k++) box(L, id, cx - 40, cx - 16, T0 - 3 - k * 2.4, T0 - k * 2.4, C.z0 + 90, C.z0 + 114, { all: (q, w, h) => (u, v, i, j) => ramp(PAL.CREAM, .85 - v * .5, i, j) });   // стос тарілок
    }
    // лаунж-диванчик уздовж лівої стіни (далі, біля стіни)
    { ++id; box(L, id, 150, 260, 334, FLY, 290, 390, { front: mBevel(PAL.PLUM, 3, { seam: 36 }), right: mBevel(PAL.PLUM, 3), top: mBevel(PAL.PLUM, 2) });
      ++id; box(L, id, 150, 260, 290, 334, 376, 392, { front: mBevel(PAL.PLUM, 3, { seam: 36 }), right: mBevel(PAL.PLUM, 2), top: mBevel(PAL.PLUM, 2) }); }
    // кульки на нитках (прив'язані до підлоги / меблів)
    GEO.balloons.forEach(([x, y, z, cn]) => { const c = NEONC[cn]; ++id; X.tube(L, [x, y + 14, z], [x + (hash(x, 3) - .5) * 30, y + 70, z], 1, () => ramp(PAL.CHROME, .45, 0, 0), { id });
      ++id; X.disc(L, [x, y, z], 12, (u, v, i, j) => { const dx = u - .5, dy = (v - .5) * .85, d = Math.hypot(dx, dy) * 2; if (d > 1) return 0; X.SH.fl = F_EMIT; const hl = Math.hypot(dx + .18, dy + .2) < .16; return hl ? mixc(c, NEONC.white, .7) : d > .82 ? dim(c, .55) : d > .5 ? dim(c, .8) : c; }, { id }); });

    // передній план: низьке огородження лаунжу обабіч (темне, з тонким неоном зверху) — три плани: огорожа → танцпол → стіна
    { const Rl = GEO.rail; [[XL + 40, 774 - 330], [774 + 330, XR - 40]].forEach(([x0, x1]) => { ++id; box(L, id, x0, x1, Rl.y0, Rl.y0 + 4, Rl.z - 3, Rl.z + 3, { all: mBevel(PAL.STEEL, 1), top: mNeon(NEONC.lil, .5) });
      for (let x = x0; x <= x1; x += (x1 - x0) / 3) { ++id; box(L, id, x - 4, x + 4, Rl.y0 + 4, FLY, Rl.z - 4, Rl.z + 4, { all: mBevel(PAL.STEEL, 1) }); } }); }
    // контур і віддзеркалення в підлозі (все, що стоїть на підлозі або висить на стінах)
    X.outline(L, col('#060313'), 1);
    X.reflect(L, i => (i === ID_FLOOR || i === 5 ? null : { y: FLY, h: 60 }), { a: .34, h: 60, emit: 2.2, streak: true });
    return { cv: X.canvas(L), x0: L.x0, y0: L.y0 };
  }
  return { build, GEO, PAL, NEONC };
})();

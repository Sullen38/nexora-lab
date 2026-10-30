/* ============================================================================
 * objects/arc_scene.js — СТІНИ Й ПІДЛОГА КРИЛ «ПО ДУЗІ» (+ зони з розкладки) У ПІКСЕЛЬНОМУ 3D
 * ----------------------------------------------------------------------------
 * Стіни й підлога обох крил; зони й речі біля стіни з'являються,
 * коли їх додає розкладка генератора (objects/arc_layout.js <- tools/wingbox/gen_room.py) — по черзі, див. docs/HANDOFF.md.
 * Рушій — core/px3d.js (z-буфер: хто кого закриває — для кожного пікселя), матеріали — objects/arc_kit.js, малюнки граней
 * за id предмета — arc_paint.js, живі екрани — arc_live.js, форми частин (NX.arc.shape) — файли зон. Диван, передня підлога
 * кімнати, вікно й рами — свої. Антресоль, підвіси, вазони, гірлянди, постери й 3D-маніпулятор 28.10 — в історії git (a431f03).
 * Кожне крило складається з растрів (шарів), що малюються по черзі (позаду -> попереду):
 *   1. СТІНА Й ПІДЛОГА (2 px/од.) — дуга від відкосу до глядача: ліворуч цегла (домашнє, теплі відсвіти), праворуч
 *      металеві панелі (технологічне); плінтус з неоном, поручень; глянцева підлога з плиткою.
 *      Стіна — стовпчиками, підлога — рядками (швидко); світло — карта з ламп і екранів розкладки (lightsOf);
 *   2. БІЛЯ СТІНИ (3 px/од.) — колони й предмети шару 'up' (полиці) — лише якщо є в розкладці;
 *   3–5. ЗОНИ (3 px/од.) — дальня, середня, найближча; у кожної — свій z-буфер, контур і віддзеркалення в підлозі
 *      та на глянцевих стільницях.
 * Збірка — генераторами дрібними шматками (стовпчики, рядки, грані; yield — частка 0..1): при завантаженні її веде js/main.js
 * під вітальною заставкою (NX.arc.scene.bootG — і злиття, і передня підлога-дзеркало; що зараз будується — NX.arc.step для
 * підпису), потім (зміна мови) — по ~30 мс за кадр; готові шари зливаються ОДИН раз в одне полотно під масштаб екрана
 * (+ сяйво — bloom); щокадру — один drawImage на крило й живі екрани поверх (під маскою видимих пікселів). Підлоги крил
 * ідуть і під вікно (за диваном: він ближче до глядача, core/config.js SOFA) і сходяться посередині (x 774 ± 10), унизу
 * плавно переходять у передню підлогу кімнати (fadeFloor). Передня підлога кімнати на всю ширину бере віддзеркалення з
 * картинки, міста, рами вікна й цього злиття (patchFront — замість латки міста).
 * Перебудова — при зміні масштабу екрана (лише злиття) або мови (уся збірка; стара видна до готовності).
 * Живі частини зон (голограма й маніпулятор майстерні, голо-монітори й крісло маркетингу) — окремі об'єкти поверх цього
 * злиття: objects/workshop.js, marketing.js, mk_chair.js; координати зони для них — NX.arc.zone(ім'я) (нижче). Малюнки граней
 * і живі екрани зон — *_paint.js (майстерня ws_, маркетинг mk_, аналітика an_, інструменти tl_).
 * ========================================================================== */
(() => {
  const X = NX.px3d, A = NX.arc.kit, PZ = NX.persp, { col, pal, ramp, add, rgb } = X;
  const ALL = window.RWBOX || NX.arcLayout || {}, FL = 372, CEIL = -240, WIN = NX.cfg.WIN, PL = A.PAL;
  const R_ZONE = 3, R_WALL = 2, t0 = performance.now();   // зони 3 px/од. (на екрані — 1.2..2.7 px/од.: з запасом), стіни 2
  const R_HERO = { workshop: 4, marketing: 4, analytics: 4, tools: 4 };   // власник (29.10): «більше графіки, більше пікселів» — головні зони 4 px/од.
  /** ЗОНА -> СВІТ (для живих частин зон: objects/workshop.js, marketing.js, mk_chair.js): px картинки зони (X, Y) і відступ
   *  углиб v -> точка світу — як у генераторі (place з поворотом turn + фронтальний зсув frontal). Повертає null, якщо зони
   *  ще немає. Поворот — у зони, що стоїть лицем до центру дуги (середні зони, варіант Б); фронтальні — turn 0. */
  NX.arc.zone = name => {
    const pick = k => ['right', 'left'].map(sd => ALL[sd] && ALL[sd][k] && ALL[sd][k][name]).find(Boolean), Z = pick('zoneXf'); if (!Z) return null;
    const anch = Object.assign({}, ALL.right && ALL.right.anchors, ALL.left && ALL.left.anchors);
    const a = (Z.turn || 0) * Math.PI / 180, f = [-Math.sin(a), -Math.cos(a)], r = [-f[1], f[0]];   // як basis у arc_kit.js
    const W = (Xi, Yi, v = 0) => { const u = (Xi - Z.Xref) * Z.m, d = v * Z.m; let x = Z.ax + r[0] * u - f[0] * d; const z = Z.az + r[1] * u - f[1] * d; if (Z.sh) x += Z.sh[0] * (z - Z.sh[1]); return [x, FL - (Z.Yf - Yi) * Z.m, z]; };
    const item = id => ['right', 'left'].map(sd => ALL[sd] && (ALL[sd].items || []).find(i => i.id === id)).find(Boolean);   // предмет розкладки (уже зі зсувом vcenter; і привид ghost)
    return { m: Z.m, box: pick('zoneBox'), W, S: (Xi, Yi, v) => X.proj(W(Xi, Yi, v)), anchor: k => anch[k], ax: Z.ax, az: Z.az, Yf: Z.Yf, Xref: Z.Xref, item };
  };
  const MID = 774, SEAM = 10;                             // середина кімнати: тут сходяться крила (підлоги — плавно на MID ± SEAM)
  // ---------- дрібниці ----------
  function catmull(pts, n = 6) {
    if (!pts || pts.length < 2) return (pts || []).slice();
    const P = [pts[0], ...pts, pts[pts.length - 1]], out = [];
    for (let i = 1; i < P.length - 2; i++) { const [p0, p1, p2, p3] = [P[i - 1], P[i], P[i + 1], P[i + 2]];
      for (let k = 0; k < n; k++) { const t = k / n, t2 = t * t, t3 = t2 * t; out.push([0, 1].map(c => .5 * (2 * p1[c] + (-p0[c] + p2[c]) * t + (2 * p0[c] - 5 * p1[c] + 4 * p2[c] - p3[c]) * t2 + (-p0[c] + 3 * p1[c] - 3 * p2[c] + p3[c]) * t3))); } }
    out.push(pts[pts.length - 1]); return out;
  }
  const hash = NX.art.hash, BAY = NX.art.BAYER, s = z => PZ.D / (PZ.D + z), clamp = (v, a, b) => v < a ? a : v > b ? b : v;
  /** Межі предмета на екрані (з листям рослини). */
  function ext(B) {
    let x0 = 1e9, x1 = -1e9, y0 = 1e9, y1 = -1e9; const acc = q => { const p = X.proj(q); if (p[0] < x0) x0 = p[0]; if (p[0] > x1) x1 = p[0]; if (p[1] < y0) y0 = p[1]; if (p[1] > y1) y1 = p[1]; };
    A.faces(B).forEach(F => F.poly.forEach(acc));
    if (B.glow) { const pad = (B.gr || 26) * .5; x0 -= pad; x1 += pad; y0 -= pad; y1 += pad; }
    return [x0, y0, x1, y1];
  }
  const union = (list, clip) => { let b = [1e9, 1e9, -1e9, -1e9]; list.forEach(e => { b = [Math.min(b[0], e[0]), Math.min(b[1], e[1]), Math.max(b[2], e[2]), Math.max(b[3], e[3])]; }); if (clip) b = [Math.max(b[0], clip[0]), Math.max(b[1], clip[1]), Math.min(b[2], clip[2]), Math.min(b[3], clip[3])]; return b; };

  // ---------- реєстр предметів растра (номер -> опис: контур, віддзеркалення) ----------
  function Reg() { const list = [null]; return { list, add(info) { list.push(info); return list.length - 1; }, get: i => list[i] }; }
  const ACC = { marketing: '#ff4fd8', analytics: '#3be8ff', ai: '#3be8ff', workshop: '#ff4fd8', tools: '#3be8ff', portal: '#d98aff' };
  /** Стиль предмета з урахуванням зони й крила: палітра, кант, глянець. */
  function styleOf(B, side) {
    const st = B.st, o = {}, acc = ACC[B.zone];
    if (st === 'frame' || st === 'board') o.neon = acc || (st === 'board' ? '#3be8ff' : '#ff4fd8');
    if (st === 'shelf' && side === 'left') { o.pal = PL.WOOD; o.q = .6; }
    if (st === 'neon') { o.neon = '#ff4fd8'; o.nIn = 1.2; o.nW = 2.2; }
    if (B.band) o.bandC = st === 'fig' ? 'lil' : 'cyan';
    if (st === 'col') o.pal = side === 'left' ? PL.MET : PL.STEEL;
    if (st === 'chair') o.q = .44;
    if (B.sty) Object.assign(o, B.sty);                                                // розкладка: товщі фаска, шов і неоновий кант великих частин (од. світу)
    return o;
  }
  /** Чи стоїть предмет на глянцевій стільниці (тоді відбивається в ній) — інакше в підлозі. */
  function supOf(B, byId, reg) {
    const P = B.on && byId[B.on]; if (P && (P.st === 'desk' || P.st === 'bench') && P._id) return { y: P.yt, on: P._id, h: 16, k: .9 };
    return { y: FL, on: 0 };
  }
  /** Відкладене малювання: грані й спрайти шару збираються, а малюються ВІД БЛИЖЧИХ ДО ДАЛЬШИХ (run) — тоді
   *  z-буфер відкидає закриті пікселі ще до матеріалу, і збірка в рази швидша (матеріал — найдорожче). */
  function cmd(L, poly, f) { let k = 1e9; for (const q of poly) { const t = (PZ.D + q[2]) / PZ.D; if (t < k) k = t; } (L.cmds || (L.cmds = [])).push([k, f]); }
  /** Те саме генератором: пауза після кожної грані (yield — частка 0..1) — збірка дрібними шматками (заставка, js/main.js). */
  function* runG(L) { if (!L.cmds) return; const list = L.cmds.sort((a, b) => a[0] - b[0]); L.cmds = null; for (let k = 0; k < list.length; k++) { list[k][1](); yield (k + 1) / list.length; } }
  /** Підзадача-генератор у діапазоні прогресу [a, b]: її частки 0..1 -> частки батька; повертає її результат. */
  function* sub(g, a, b) { for (;;) { const r = g.next(); if (r.done) return r.value; yield a + (b - a) * (typeof r.value === 'number' ? r.value : 0); } }
  /** Що зараз будується (для підпису на заставці: js/ui/splash.js) — ключ кроку й крило/зона. */
  const note = (k, x) => { NX.arc.step = { k, x }; };
  /** Щільність текстури грані: тексель ≈ піксель растра (з урахуванням глибини). */
  const TSof = (L, Fc) => clamp(Math.round(L.R * s(A.centre(Fc)[2]) * 2) / 2, 2, 6);
  /** Набір для форм (NX.arc.shape[id | 'st:стиль'] — у файлах зон): частини-об'єми, трубки, диски, грані-многокутники
   *  в координатах предмета B; усе — один предмет (id). */
  function makeG(L, B, id, side) {
    const { P } = A.basis(B), opt = { id, fid: id };
    const faceCmd = (Fc, sh) => cmd(L, Fc.poly, () => X.face(L, Fc.poly, Fc.O, Fc.A, Fc.B, sh, { id, fid: id, n: Fc.n }));
    return {
      P, B,
      sub(u, v, w, d, yt, yb, extra = {}) { const p = P(u, v - d / 2, 0); return Object.assign({ x: p[0], z: p[2], turn: B.turn || 0, w, dep: d, yt, yb }, extra); },
      part(Pi, st, o = {}) { for (const Fc of A.faces(Pi)) { if (!A.visible(Fc)) continue; const tex = Fc.k === 'front' && Pi.deco && Pi.deco.length ? A.texture(Pi, Fc, TSof(L, Fc)) : null; faceCmd(Fc, A.shader(st, Fc, Pi, Object.assign({}, styleOf(Pi, side), o, { tex }))); } },
      partF(Pi, mk) { for (const Fc of A.faces(Pi)) { if (!A.visible(Fc)) continue; const sh = mk(Fc, Pi); if (sh) faceCmd(Fc, sh); } },
      tube(a, b, w, shade) { cmd(L, [a, b], () => X.tube(L, a, b, w, shade, opt)); },
      disc(c, r, shade) { cmd(L, [c], () => X.disc(L, c, r, shade, opt)); },
      /** Довільна пласка грань-многокутник (точки світу; O, Au, Bv — параметризація u, v: P = O + u·Au + v·Bv; n — зовнішня
       *  нормаль): арка купола аналітики (крок 11). */
      face(poly, O, Au, Bv, shade, n) { cmd(L, poly, () => X.face(L, poly, O, Au, Bv, shade, { id, fid: id, n })); },
    };
  }
  /** Предмет розкладки -> у растр L: видимі грані з матеріалами, текстура лиця (оздоби / власний малюнок), рослина;
   *  предмети з формою (NX.arc.shape[id] або ['st:стиль']) — нею. */
  function drawItem(L, B, reg, side, byId) {
    const id = reg.add({ B, sup: null, out: B.st === 'lamp' ? col('#5a2a0a') : B.st === 'clamp' || B.st === 'halo' ? col('#0a3a5a') : A.C.out }); B._id = id;
    const SHP = NX.arc.shape || {}, shp = SHP[B.id] || SHP['st:' + B.st];
    if (shp) shp(makeG(L, B, id, side), B);
    else {
      const o = styleOf(B, side), paint = NX.arc.paint && NX.arc.paint[B.id];
      for (const Fc of A.faces(B)) {
        if (!A.visible(Fc)) continue;
        if (B.notop && Fc.k === 'top') continue;
        let tex = null;
        if (Fc.k === 'front' && (paint || (B.deco && B.deco.length))) tex = A.texture(B, Fc, TSof(L, Fc), paint);
        else if (paint && paint.sides && paint.sides[Fc.k]) tex = A.texture(B, Fc, TSof(L, Fc), paint.sides[Fc.k]);
        const shade = A.shader(B.st, Fc, B, Object.assign({}, o, { tex }));
        let fid = id;                                                                                            // живий екран: лицьова грань — свій номер (маска видимих пікселів)
        if (Fc.k === 'front' && NX.arc.LIVE && NX.arc.LIVE[B.id]) { fid = reg.add({ live: B.id }); (L.live || (L.live = [])).push({ id: B.id, B, Fc, fid }); }
        cmd(L, Fc.poly, () => X.face(L, Fc.poly, Fc.O, Fc.A, Fc.B, shade, { id, fid, n: Fc.n, fl: 0 }));
      }
    }
    reg.list[id].sup = supOf(B, byId, reg);
  }

  // ---------- СТІНА Й ПІДЛОГА крила ----------
  /** Узор стіни в точці (s — відстань уздовж дуги від відкосу, y — висота світу): ліворуч цегла, праворуч панелі. */
  const BRK = pal(['#0b0618', '#120a26', '#1a1034', '#231644', '#2e1c54', '#3a2466', '#482c78', '#58368c']);
  const PAN = pal(['#05041a', '#0a0824', '#0f0c30', '#15113e', '#1c174e', '#241e60', '#2e2674', '#3a3088']);
  function brickAt(sx, y, i, j, light) {
    const bh = 8, bw = 17, row = Math.floor((y - CEIL) / bh), off = (row & 1) * bw / 2, col2 = Math.floor((sx + off) / bw);
    const lx = (sx + off) - col2 * bw, ly = (y - CEIL) - row * bh, hb = hash(col2 * 3.1 + 7, row * 1.7 + 3);
    if (lx < 1.1 || ly < 1.1) return ramp(BRK, .08 + light * .25, i, j);                                   // шов
    let q = .3 + hb * .22 + light * .55 - (ly > bh - 2 ? .08 : 0) + (ly < 2.2 ? .07 : 0) + (lx < 2.4 ? .05 : 0);
    if (hash(col2, row) > .93) q -= .15;                                                                      // темніша цеглина
    return ramp(BRK, q, i, j);
  }
  function panelAt(sx, y, i, j, light) {
    const pw = 31, ph = 46, cx = Math.floor(sx / pw), cy = Math.floor((y - CEIL) / ph), lx = sx - cx * pw, ly = (y - CEIL) - cy * ph, hb = hash(cx * 5.3 + 1, cy * 2.9 + 2);
    if (lx < .9 || ly < .9) return ramp(PAN, .05, i, j);                                                     // шов
    let q = .3 + hb * .14 + light * .6;
    if (lx < 1.8 || ly < 1.8) q += .14; else if (lx > pw - 1.8 || ly > ph - 1.8) q -= .12;                    // фаска
    if (((lx - 3.2) ** 2 + (ly - 3.2) ** 2 < .6) || ((lx - (pw - 3.2)) ** 2 + (ly - 3.2) ** 2 < .6) || ((lx - 3.2) ** 2 + (ly - (ph - 3.2)) ** 2 < .6) || ((lx - (pw - 3.2)) ** 2 + (ly - (ph - 3.2)) ** 2 < .6)) q += .3;   // заклепки
    if (hb > .78 && ly > ph * .3 && ly < ph * .62 && lx > 5 && lx < pw - 5 && ((ly | 0) % 3 === 0)) q -= .2;  // жалюзі
    return ramp(PAN, q, i, j);
  }
  /** СВІТЛО НА СТІНІ Й ПІДЛОЗІ — карта, порахована раз (клітинка CELL од.): яскравість k (темніше під стелею й біля підлоги,
   *  плями від ламп і екранів) і кольоровий відсвіт (r, g, b — додається світлом). Шейдер бере найближчу клітинку з
   *  дизерингом — тож щопікселя ні циклу по лампах, ні змішування рядків. */
  const CELL = 3;
  function lightMap(nx, ny, at, lights, base) {
    const K = new Float32Array(nx * ny), T = new Float32Array(nx * ny * 3);
    for (let jy = 0; jy < ny; jy++) for (let ix = 0; ix < nx; ix++) {
      const [x, y, z] = at(ix, jy), q = jy * nx + ix; let k = base(y), r = 0, g = 0, b = 0;
      for (const L of lights) { const d2 = ((x - L.x) ** 2 + (y - L.y) ** 2 * 1.2 + (z - L.z) ** 2) / (L.r * L.r); if (d2 < 1) { const f = (1 - d2) * (1 - d2); k += L.k * f; if (L.c) { const w = L.k * f * .85; r += X.R_(L.c) * w; g += X.G_(L.c) * w; b += X.B_(L.c) * w; } } }
      K[q] = k; T[q * 3] = r; T[q * 3 + 1] = g; T[q * 3 + 2] = b;
    }
    return { K, T, nx, ny };
  }
  /** Колір + відсвіт клітинки (адитивно). */
  const lightAdd = (c, M, q) => { const r = M.T[q * 3], g = M.T[q * 3 + 1], b = M.T[q * 3 + 2]; if (r + g + b < 2) return c; return rgb(Math.min(255, X.R_(c) + r), Math.min(255, X.G_(c) + g), Math.min(255, X.B_(c) + b)); };
  const FLOORP = pal(['#05031a', '#08051f', '#0b0726', '#0f0a2e', '#130d38', '#181044', '#1e1452']);
  function floorAt(x, z, i, j, side) {
    const ts = 30, gx = Math.floor((x - 774) / ts), gz = Math.floor(z / ts), lx = (x - 774) - gx * ts, lz = z - gz * ts, hb = hash(gx * 2.3 + 11, gz * 1.9 + 5);
    let q = .34 + hb * .14 + (z > 100 ? -.06 : 0);
    if (lx < .7 || lz < .7) q -= .22; else if (lz > ts - 1.2) q += .1;
    if (((i * 7 + j * 3) % 41) === 0) q += .25;                                                              // іскорки глянцю
    return ramp(FLOORP, q, i, j);
  }
  function* wallLayerG(Ls, side, clipPoly) {
    const W = catmull(Ls.wall, 4), sgn = side === 'right' ? 1 : -1, b = side === 'right' ? [MID - SEAM, -2, 1547, 478] : [-12, -2, MID + SEAM, 478];   // підлога — і під вікном, до середини
    const L = X.Layer(b[0], b[1], b[2], b[3], R_WALL), reg = Reg(), wid = reg.add({ wall: 1, sup: { y: FL, on: 0 }, out: 0 });
    const lights = lightsOf(Ls, side);
    // довжина дуги й точка стіни за відстанню s від відкосу
    const SEG = []; let tot = 0; for (let k = 0; k + 1 < W.length; k++) { const len = Math.hypot(W[k + 1][0] - W[k][0], W[k + 1][1] - W[k][1]); SEG.push([tot, len, W[k], W[k + 1]]); tot += len; }
    const wallPt = sx => { for (const [a, len, p, q] of SEG) if (sx <= a + len || q === W[W.length - 1]) { const u = Math.max(0, Math.min(1, (sx - a) / (len || 1))); return [p[0] + (q[0] - p[0]) * u, p[1] + (q[1] - p[1]) * u]; } return W[W.length - 1]; };
    const WM = lightMap(Math.ceil(tot / CELL) + 1, Math.ceil((FL - CEIL) / CELL) + 1, (ix, jy) => { const p = wallPt(ix * CELL); return [p[0], CEIL + jy * CELL, p[1]]; }, lights, y => .38 + .32 * Math.exp(-(((y - 120) / 210) ** 2)));
    // ПІДЛОГА (полігон усередині дуги, далі — до глядача; межі на екрані відтинає маска)
    const end = W[W.length - 1], fpoly = [...W.map(p => [p[0], FL, p[1]]), [end[0] - sgn * 80, FL, -440], [774, FL, -440], [774, FL, 185]];
    const fx0 = Math.min(...fpoly.map(p => p[0])), fx1 = Math.max(...fpoly.map(p => p[0])), FZ0 = -440, FM = lightMap(Math.ceil((fx1 - fx0) / CELL) + 1, Math.ceil((185 - FZ0) / CELL) + 1, (ix, jy) => [fx0 + ix * CELL, FL - 40, FZ0 + jy * CELL], lights, () => 0);
    const flid = reg.add({ floor: 1, sup: null, out: 0 });
    // СТІНА — стовпчиками (кожен стовпчик екрана бачить одну точку дуги: перетин променя з ламаною стіни в плані),
    // ПІДЛОГА — рядками (у рядка стала глибина). Без загальної грані й виклику матеріалу на піксель — у рази швидше.
    const segs = []; { let a = 0; for (let k = 0; k + 1 < W.length; k++) { const p = W[k], q = W[k + 1], len = Math.hypot(q[0] - p[0], q[1] - p[1]); if (len > .01) segs.push({ p, q, len, a0: a }); a += len; } }
    const { W: LW, H: LH, R, x0: lx0, y0: ly0, c: CC, dep: DEP, id: ID, fid: FID, fl: FLG } = L, VX = X.VX, VY = X.VY, DD = X.D, NEO = side === 'left' ? A.NEON.pink : A.NEON.cyan, left = side === 'left';
    const RAIL = left ? PL.WOOD : PL.CHROME;
    for (let i = 0; i < LW; i++) {
      const dx = lx0 + (i + .5) / R - VX; let bt = Infinity, bs = 0;
      for (const sg of segs) {
        const ex = sg.q[0] - sg.p[0], ez = sg.q[1] - sg.p[1], det = -dx * ez + ex * DD; if (Math.abs(det) < 1e-9) continue;
        const bx = sg.p[0] - VX, bz = sg.p[1] + DD, t = (-bx * ez + ex * bz) / det, u = (dx * bz - DD * bx) / det;
        if (u < -1e-4 || u > 1 + 1e-4 || t <= 0) continue; if (t < bt) { bt = t; bs = sg.a0 + Math.max(0, Math.min(1, u)) * sg.len; }
      }
      if (bt === Infinity) continue;
      const ixw = Math.max(0, Math.min(WM.nx - 1, Math.round(bs / CELL)));
      for (let j = 0; j < LH; j++) {
        const y = VY + (ly0 + (j + .5) / R - VY) * bt; if (y < CEIL || y > FL) continue;
        const k = j * LW + i; let c, fl = X.F_NOOUT;
        if (y > FL - 9 && y < FL - 6.6) { fl |= X.F_EMIT; c = y < FL - 8.2 || y > FL - 7.2 ? NEO[1] : NEO[2]; }                       // неоновий плінтус
        else if (y >= FL - 6.6) c = ramp(PL.STEEL, .22 + (y > FL - 1.5 ? -.1 : .05), i, j);                                        // плінтус
        else if (y > 147 && y < 153) c = ramp(RAIL, y < 148.4 ? .78 : y < 151.6 ? .55 : .25, i, j);                                 // поручень / рейка
        else {
          const b4 = BAY[(j & 3) * 4 + (i & 3)], jy = Math.max(0, Math.min(WM.ny - 1, Math.round((y - CEIL) / CELL + b4))), q = jy * WM.nx + Math.max(0, Math.min(WM.nx - 1, ixw + (b4 > .2 ? 1 : b4 < -.2 ? -1 : 0)));
          c = lightAdd(left ? brickAt(bs, y, i, j, WM.K[q]) : panelAt(bs, y, i, j, WM.K[q]), WM, q);
        }
        CC[k] = c; DEP[k] = bt; ID[k] = wid; FID[k] = wid; FLG[k] = fl;
      }
      if ((i & 15) === 15) yield .5 * i / LW;                                                               // пауза кожні 16 стовпчиків
    }
    for (let j = 0; j < LH; j++) {
      const Y = ly0 + (j + .5) / R; if (Y <= VY + .5) continue;
      const t = (FL - VY) / (Y - VY), z = DD * t - DD, jy = Math.max(0, Math.min(FM.ny - 1, Math.round((z - FZ0) / CELL)));
      for (let i = 0; i < LW; i++) {
        const k = j * LW + i; if (DEP[k] !== Infinity) continue;
        const x = VX + (lx0 + (i + .5) / R - VX) * t, b4 = BAY[(j & 3) * 4 + (i & 3)], ix = Math.max(0, Math.min(FM.nx - 1, Math.round((x - fx0) / CELL + b4)));
        CC[k] = lightAdd(floorAt(x, z, i, j, side), FM, jy * FM.nx + ix); DEP[k] = t; ID[k] = flid; FID[k] = flid; FLG[k] = X.F_FLOOR | X.F_NOOUT;
      }
      if ((j & 15) === 15) yield .5 + .25 * j / LH;
    }
    // екран NEXORA AI (праворуч) і стрічка машинерії — у шарі стіни
    yield* sub(runG(L), .75, .8);
    clipLayer(L, clipPoly); yield .82;
    yield* sub(X.reflectG(L, a => reg.get(a) && reg.get(a).sup, { a: .55, h: 50, streak: 1 }), .82, 1);
    return { L, reg };
  }
  /** Маска растра за многокутником на екрані (поза ним — прозоро). */
  function clipLayer(L, poly) {
    if (!poly) return; const cv = document.createElement('canvas'); cv.width = L.W; cv.height = L.H; const c = cv.getContext('2d');
    c.setTransform(L.R, 0, 0, L.R, -L.x0 * L.R, -L.y0 * L.R); c.beginPath(); poly.forEach(([x, y], i) => i ? c.lineTo(x, y) : c.moveTo(x, y)); c.closePath(); c.fillStyle = '#fff'; c.fill();
    const m = new Uint32Array(c.getImageData(0, 0, L.W, L.H).data.buffer);
    for (let k = 0; k < m.length; k++) if ((m[k] >>> 24) < 128) { L.c[k] = 0; L.id[k] = 0; L.fid[k] = 0; L.dep[k] = Infinity; L.fl[k] = 0; }
  }
  /** Підлога крила плавно переходить у передню підлогу кімнати (внизу), а посередині (під вікном і диваном) підлоги обох
   *  крил сходяться: права проступає поверх лівої на смузі MID ± SEAM — шву не видно. Пікселі підлоги й віддзеркалень
   *  стають прозорішими; стіни й речі не зачіпає. */
  function fadeFloor(L, side) {
    const { W, H, R, x0, y0, c: C, fl: FLG } = L, sm = v => v <= 0 ? 0 : v >= 1 ? 1 : v * v * (3 - 2 * v);
    for (let j = 0; j < H; j++) {
      const Y = y0 + (j + .5) / R; if (Y < 340) continue; const fy = Y < 368 ? 1 : sm((478 - Y) / 52);
      for (let i = 0; i < W; i++) {
        const k = j * W + i; if (!(FLG[k] & (X.F_FLOOR | X.F_REFL))) continue;
        const Xs = x0 + (i + .5) / R, fx = side === 'left' ? 1 : sm((Xs - (MID - SEAM)) / (2 * SEAM)), f = Math.min(fx, fy); if (f >= 1) continue;
        const a = Math.round((C[k] >>> 24) * f); C[k] = ((C[k] & 0x00ffffff) | (a << 24)) >>> 0;
      }
    }
  }
  /** Світло на стінах і підлозі крила (світ): x, y, z, r — радіус, k — сила, c — колір відсвіту. Береться з розкладки:
   *  лампи й ліхтарі (теплі), екрани й будки (холодні сині), неон зон (колір зони), підвісні лампи, вікно (фіолет міста). */
  function lightsOf(Ls, side) {
    const out = [], ctr = B => { const { P } = A.basis(B); return P(0, B.dep / 2, (B.yt + B.yb) / 2); }, add = (p, r, k, h) => out.push({ x: p[0], y: p[1], z: p[2], r, k, c: col(h) });
    (Ls.items || []).forEach(B => {
      if (B.glow) add(ctr(B), Math.max(60, (B.gr || 30) * 2.6), .34, B.st === 'clamp' ? '#3be8ff' : B.st === 'neon' ? '#ff4fd8' : B.st === 'gold' ? '#ffd27a' : '#ffb24a');
      else if (/_booth$|_screen$|_scr[LR]$|_tiles$|ws_back|tl_board|pt_back/.test(B.id)) { const p = ctr(B); add(p, 130, .2, B.id === 'ws_back' ? '#ff4fd8' : B.id === 'pt_back' ? '#9a4aff' : '#3b8aff'); add([p[0], B.yb - 30, p[2]], 110, .14, ACC[B.zone] || '#ff4fd8'); }
      else if (B.id === 'ws_pad') add(ctr(B), 120, .24, '#ff6ae0');                                             // пад капсули — рожеве світло на стіну й підлогу
    });
    add([side === 'left' ? 430 : 1118, 120, 180], 210, .16, '#9a4aff');                                       // вікно: фіолетове світло міста
    return out;
  }

  // ---------- БІЛЯ СТІНИ: колони, полиці (предмети шару 'up') ----------
  function* backLayerG(Ls, side, zclip) {
    const UP = (Ls.items || []).filter(B => B.layer === 'up'), byId = {}; UP.forEach(B => byId[B.id] = B);
    const es = [...UP.map(ext), ...(Ls.cols || []).map(ext)];
    if (!es.length) return null;                                                       // біля стіни нічого немає (чиста основа) — шару немає
    const b0 = union(es, zclip), bb = [b0[0], b0[1], b0[2], Math.min(zclip[3], b0[3] + 60)], L = X.Layer(bb[0], bb[1], bb[2], bb[3], R_ZONE), reg = Reg();
    (Ls.cols || []).forEach(B => drawItem(L, Object.assign({}, B, { zone: side === 'left' ? 'ai' : 'tools' }), reg, side, byId));
    UP.forEach(B => drawItem(L, B, reg, side, byId));
    yield .1;
    yield* sub(runG(L), .1, .6);
    yield* sub(X.outlineG(L, a => (reg.get(a) || {}).out, 2), .6, .8);
    yield* sub(X.reflectG(L, a => reg.get(a) && reg.get(a).sup, { a: .5, h: 60, streak: 1 }), .8, 1);
    return { L, reg };
  }
  // ---------- ЗОНИ ----------
  function* zoneLayerG(items, side, zclip, Ls, zn) {
    const byId = {}; items.forEach(B => byId[B.id] = B);
    const es = items.map(ext);
    const b0 = union(es, zclip), bb = [b0[0], b0[1], b0[2], Math.min(zclip[3], b0[3] + (b0[3] - b0[1]) * .75)];   // знизу — місце для віддзеркалення в підлозі
    const L = X.Layer(bb[0], bb[1], bb[2], bb[3], R_HERO[zn] || R_ZONE), reg = Reg();
    // спершу основи (те, на чому стоять), потім речі — глибина однаково правильна, а глянцю потрібен номер опори
    const order = items.slice().sort((a, b) => (a.on ? 1 : 0) - (b.on ? 1 : 0));
    for (let k = 0; k < order.length; k++) { drawItem(L, order[k], reg, side, byId); yield .12 * (k + 1) / order.length; }   // предмет за предметом (текстури лиць)
    yield* sub(runG(L), .12, .55);
    yield* sub(X.outlineG(L, a => (reg.get(a) || {}).out, 2), .55, .75);
    yield* sub(X.reflectG(L, a => { const r = reg.get(a); return r && r.sup && r.sup.on ? r.sup : null; }, { a: .5, h: 14 }), .75, .85);   // глянець стільниць
    yield* sub(X.reflectG(L, a => { const r = reg.get(a); return r && r.sup ? { y: FL, on: 0 } : null; }, { a: .62, h: 62, streak: 1 }), .85, 1);   // підлога
    return { L, reg };
  }

  /** Маска живої грані fid з шару li: видимі пікселі цієї грані в її z-буфері МІНУС те, що закривають шари, які малюються
   *  пізніше (ближчі зони) — інакше екран дальньої зони «просвічував» би крізь ближчу. -> {cv, x, y, w, h} (одиниці кімнати). */
  function liveMask(layers, li, fid) {
    const L = layers[li].L, { W, H, R } = L; let i0 = 1e9, i1 = -1, j0 = 1e9, j1 = -1;
    for (let j = 0; j < H; j++) for (let i = 0; i < W; i++) if (L.fid[j * W + i] === fid) { if (i < i0) i0 = i; if (i > i1) i1 = i; if (j < j0) j0 = j; if (j > j1) j1 = j; }
    if (i1 < 0) return null;
    const w = i1 - i0 + 1, h = j1 - j0 + 1, cv = document.createElement('canvas'); cv.width = w; cv.height = h; const x = cv.getContext('2d'), im = x.createImageData(w, h), d = new Uint32Array(im.data.buffer);
    const later = layers.slice(li + 1).map(l => l.L);
    for (let j = 0; j < h; j++) for (let i = 0; i < w; i++) {
      if (L.fid[(j + j0) * W + i + i0] !== fid) continue;
      const Xr = L.x0 + (i + i0 + .5) / R, Yr = L.y0 + (j + j0 + .5) / R; let hid = false;
      for (const M of later) { const ii = Math.floor((Xr - M.x0) * M.R), jj = Math.floor((Yr - M.y0) * M.R); if (ii < 0 || jj < 0 || ii >= M.W || jj >= M.H) continue; const q = jj * M.W + ii; if (M.id[q] && !(M.fl[q] & X.F_REFL)) { hid = true; break; } }
      if (!hid) d[j * w + i] = 0xffffffff;
    }
    x.putImageData(im, 0, 0); return { cv, x: L.x0 + i0 / R, y: L.y0 + j0 / R, w: w / R, h: h / R };
  }

  // ---------- ЗЛИТТЯ крила ----------
  const SIDES = {};
  /** Генератор g із заміром часу: скільки він працював (між паузами) — у acc (ms, tm — підсумок для консолі). */
  function* timed(nm, g, acc) {
    let d = 0, r; for (;;) { const a = performance.now(); r = g.next(); d += performance.now() - a; if (r.done) break; yield r.value; }
    acc.ms += d; acc.tm.push(nm + ' ' + d.toFixed(0) + (r.value && r.value.L ? '(' + (r.value.L.W * r.value.L.H / 1e6).toFixed(2) + 'MP)' : '')); return r.value;
  }
  /** Збірка крила ПО КРОКАХ (генератор): шар за шаром, а всередині шару — стовпчиками, рядками й гранями з паузами (yield —
   *  частка 0..1), щоб сторінка не «замерзала» (шар цілком — 0.1..0.5 с, на слабкому телефоні — до 2.5 с).
   *  Результат: {side, box, live, layers: [{cv, x0, y0, x1, y1}], ms}. */
  function* buildSide(side) {
    const Ls = ALL[side]; if (!Ls) return null;
    const acc = { ms: 0, tm: [] };
    // стіна — від відкосу; підлога — і під вікном (з-під порога), до середини кімнати: там підлоги крил сходяться (fadeFloor)
    const clip = side === 'right' ? [[WIN.R, -2], [1547, -2], [1547, 478], [MID - SEAM, 478], [MID - SEAM, 346], [WIN.R, 346]] : [[-12, -2], [WIN.L, -2], [WIN.L, 346], [MID + SEAM, 346], [MID + SEAM, 478], [-12, 478]];
    const zclip = side === 'right' ? [MID - SEAM, -2, 1550, 478] : [-12, -2, MID + SEAM, 478];   // дальні зони ширші — заходять за диван
    const ZN = side === 'right' ? ['workshop', 'tools', 'portal'] : ['marketing', 'analytics', 'ai'];
    const zs = ZN.map(z => [z, (Ls.items || []).filter(B => B.zone === z && B.layer !== 'up' && !B.ghost)]).filter(e => e[1].length);   // ghost — привид для живого шару (не малюється)
    // частки прогресу крила: стіна й підлога .3, біля стіни .06, зони — порівну .5, фініш .14
    note('wall', side); const layers = [yield* sub(timed('wall', wallLayerG(Ls, side, clip), acc), 0, .3)];
    note('back', side); const bk = yield* sub(timed('back', backLayerG(Ls, side, zclip), acc), .3, .36); if (bk) layers.push(bk);
    for (let n = 0; n < zs.length; n++) { const [z, it] = zs[n]; note('zone', z); layers.push(yield* sub(timed(z, zoneLayerG(it, side, zclip, Ls, z), acc), .36 + .5 * n / zs.length, .36 + .5 * (n + 1) / zs.length)); }
    const box = side === 'right' ? [MID - SEAM, -2, 1547, 478] : [-12, -2, MID + SEAM, 478];
    note('finish', side); const out = yield* sub(timed('finish', finishG(layers, side, box), acc), .86, 1);
    if (window.ARC_LOG !== 0) console.log('[arc] ' + side + ': ' + acc.tm.join(', '));
    out.ms = acc.ms; return out;
  }
  /** ПЕРЕДНІ ПРЕДМЕТИ ЗОНИ (крок 12): предмети розкладки з fg=1 (речі на столі перед живим екраном — лампа, планшет, папки)
   *  -> їхні пікселі шару окремим полотном; живий шар зони малює його ПОВЕРХ своїх голо-екранів (NX.arc.fg), інакше екран, що
   *  кладеться поверх нерухомого злиття, сховав би їх. Пікселі, закриті пізнішими (ближчими) шарами, і живі грані — пропускаються.
   *  -> {zone, cv, x, y, w, h} (одиниці кімнати) або null. */
  function fgLayer(layers, li) {
    const { L, reg } = layers[li]; if (!reg) return null; const ids = new Set(); let zone = null;
    reg.list.forEach((r, i) => { if (r && r.B && r.B.fg) { ids.add(i); zone = r.B.zone; } }); if (!ids.size) return null;
    const { W, H, R } = L, has = k => L.c[k] && ids.has(L.id[k]) && L.fid[k] === L.id[k]; let i0 = 1e9, i1 = -1, j0 = 1e9, j1 = -1;
    for (let j = 0; j < H; j++) for (let i = 0, k = j * W; i < W; i++, k++) if (has(k)) { if (i < i0) i0 = i; if (i > i1) i1 = i; if (j < j0) j0 = j; if (j > j1) j1 = j; }
    if (i1 < 0) return null;
    const w = i1 - i0 + 1, h = j1 - j0 + 1, cv = document.createElement('canvas'); cv.width = w; cv.height = h; const x = cv.getContext('2d'), im = x.createImageData(w, h), d = new Uint32Array(im.data.buffer);
    const later = layers.slice(li + 1).map(l => l.L);
    for (let j = 0; j < h; j++) for (let i = 0; i < w; i++) {
      const k = (j + j0) * W + i + i0; if (!has(k)) continue;
      const Xr = L.x0 + (i + i0 + .5) / R, Yr = L.y0 + (j + j0 + .5) / R; let hid = false;
      for (const M of later) { const ii = Math.floor((Xr - M.x0) * M.R), jj = Math.floor((Yr - M.y0) * M.R); if (ii < 0 || jj < 0 || ii >= M.W || jj >= M.H) continue; const q = jj * M.W + ii; if (M.id[q] && !(M.fl[q] & X.F_REFL)) { hid = true; break; } }
      if (!hid) d[j * w + i] = L.c[k];
    }
    x.putImageData(im, 0, 0); return { zone, cv, x: L.x0 + i0 / R, y: L.y0 + j0 / R, w: w / R, h: h / R };
  }
  /** Фініш крила: підлоги плавно в передню, маски живих екранів, передні предмети, растри -> полотна (буфери далі не потрібні). */
  function* finishG(layers, side, box) {
    const n = layers.length, live = [], cvs = [], fg = [];
    for (let k = 0; k < n; k++) { fadeFloor(layers[k].L, side); yield .3 * (k + 1) / n; }
    for (let li = 0; li < n; li++) { for (const E of (layers[li].L.live || [])) { const m = liveMask(layers, li, E.fid); if (m) live.push(Object.assign(E, { mask: m })); yield .3 + .2 * (li + 1) / n; } }   // живі екрани: маски з z-буфера
    for (let li = 0; li < n; li++) { const f = fgLayer(layers, li); if (f) fg.push(f); }
    for (let k = 0; k < n; k++) { const l = layers[k]; cvs.push({ cv: X.canvas(l.L), x0: l.L.x0, y0: l.L.y0, x1: l.L.x1, y1: l.L.y1 }); yield .5 + .5 * (k + 1) / n; }
    return { side, box, live, layers: cvs, fg };
  }
  /** Передні предмети зони (fgLayer) — живий шар зони малює їх поверх своїх екранів: NX.arc.fgDraw(c, 'analytics'). */
  NX.arc.fgDraw = (c, zone) => { for (const sd of ['left', 'right']) { const S = SIDES[sd], f = S && S.fg && S.fg.find(o => o.zone === zone); if (f) { c.save(); c.imageSmoothingEnabled = true; c.drawImage(f.cv, f.x, f.y, f.w, f.h); c.restore(); return true; } } return false; };
  /** Шари -> одне полотно під масштаб Rd (+ сяйво). Генератором: шар за шаром, сяйво — кроками. */
  function* composeG(S, Rd) {
    const [x0, y0, x1, y1] = S.box, w = Math.round((x1 - x0) * Rd), h = Math.round((y1 - y0) * Rd), cv = document.createElement('canvas'); cv.width = w; cv.height = h;
    const c = cv.getContext('2d'); c.setTransform(Rd, 0, 0, Rd, -x0 * Rd, -y0 * Rd); c.imageSmoothingEnabled = true; c.imageSmoothingQuality = 'high';
    for (let k = 0; k < S.layers.length; k++) { const l = S.layers[k]; c.drawImage(l.cv, l.x0, l.y0, l.x1 - l.x0, l.y1 - l.y0); yield .45 * (k + 1) / S.layers.length; }
    yield* sub(bloomG(cv), .45, 1); return cv;
  }
  const compose = (S, Rd) => X.drain(composeG(S, Rd));
  /** Сяйво: яскраві пікселі -> 3 масштаби розмиття -> додати світлом (запікається в злиття). */
  function* bloomG(cv) {
    const w = cv.width, h = cv.height, f = 6, bw = Math.max(1, Math.round(w / f)), bh = Math.max(1, Math.round(h / f)), b1 = document.createElement('canvas'); b1.width = bw; b1.height = bh;
    const bx = b1.getContext('2d', { willReadFrequently: true }); bx.imageSmoothingEnabled = true; bx.drawImage(cv, 0, 0, bw, bh); yield .3;
    const im = bx.getImageData(0, 0, bw, bh), d = im.data;
    // яскравість -> прозорість (колір лишається): у режимі 'lighter' темне нічого не додає й не робить прозоре (вікно) непрозорим
    for (let i = 0; i < d.length; i += 4) { const m = Math.max(d[i], d[i + 1], d[i + 2]), k = Math.min(1, Math.max(0, (m - 120) / 135)) * (d[i + 3] / 255); d[i + 3] = Math.round(k * 255); }
    bx.putImageData(im, 0, 0); yield .5;
    const down = (src, k) => { const o = document.createElement('canvas'); o.width = Math.max(1, Math.round(src.width / k)); o.height = Math.max(1, Math.round(src.height / k)); const ox = o.getContext('2d'); ox.imageSmoothingEnabled = true; ox.drawImage(src, 0, 0, o.width, o.height); return o; };
    const b2 = down(b1, 2), b3 = down(b2, 2), c = cv.getContext('2d'); yield .6;
    const L3 = [[b1, .22], [b2, .3], [b3, .34]];
    for (let n = 0; n < 3; n++) { const [b, k] = L3[n]; c.save(); c.setTransform(1, 0, 0, 1, 0, 0); c.globalCompositeOperation = 'lighter'; c.imageSmoothingEnabled = true; c.imageSmoothingQuality = 'high'; c.globalAlpha = k; c.drawImage(b, 0, 0, w, h); c.restore(); yield .6 + .4 * (n + 1) / 3; }
  }
  /** Передня підлога кімнати на всю ширину — віддзеркалення нових крил і міста за вікном (копія розміром з картинку
   *  кімнати: картинка -> місто (усе скло: диван тепер стоїть ближче й сам віддзеркалюється) -> рама вікна -> крила).
   *  Замість латки міста (world/cityscape.js patchFloor кличе цю, коли вона є). */
  function* patchFrontG() {
    const img = NX.room.img, RS = NX.room.RS; if (!img.naturalWidth || !['left', 'right'].every(sd => !ALL[sd] || (SIDES[sd] && SIDES[sd].comp))) return;
    const cv = document.createElement('canvas'); cv.width = img.naturalWidth; cv.height = img.naturalHeight; const x = cv.getContext('2d');
    const flush = () => x.getImageData(0, 0, 1, 1);                                   // браузер малює в полотно відкладено — виконати зараз, щоб шматки були дрібні
    x.drawImage(img, 0, 0); x.scale(RS, RS); x.imageSmoothingEnabled = true; flush(); yield .15;
    if (NX.city && NX.city.paint) NX.city.paint(x, NX.time, 'full', RS); flush(); yield .4;
    const fr = NX.objects.windowFrame; if (fr && fr.drawBack) fr.drawBack(x, NX.time); flush(); yield .55;
    ['left', 'right'].forEach(sd => { const S = SIDES[sd]; if (S && S.comp) x.drawImage(S.comp, S.box[0], S.box[1], S.box[2] - S.box[0], S.box[3] - S.box[1]); }); flush(); yield .7;
    NX.room.patchFront(cv, 0, NX.cfg.ROOM_W);
  }
  /** Те саме одним шматком (після зміни мови чи масштабу). Генератором — під заставкою (bootG). */
  const patchFront = () => X.drain(patchFrontG());
  NX.arc.patchFront = patchFront;

  // ---------- збірка вразбіг, показ, перебудова ----------
  // JOB — збірка обох крил кроками (по ~30 мс за кадр); поки нова збірка не готова, показується попередня (зміна мови — без блимання)
  let JOB = null, want = true;
  function* jobG() {
    const NEXT = {};
    for (const sd of ['left', 'right']) NEXT[sd] = yield* sub(buildSide(sd), sd === 'left' ? 0 : .5, sd === 'left' ? .5 : 1);
    Object.assign(SIDES, NEXT); NX.arc.built = SIDES;
    console.log('[arc] built', Object.values(SIDES).map(S => S && S.side + ' ' + S.ms.toFixed(0) + 'ms').join(', '), NX.arc.prof ? JSON.stringify(NX.arc.prof, (k, v) => typeof v === 'number' ? Math.round(v) : v) : '');
  }
  function step() {
    if (!JOB) {
      if (!want) return;
      if (document.fonts && document.fonts.status !== 'loaded' && performance.now() - t0 < 2500) return;   // написи — коли шрифт готовий
      want = false; JOB = jobG();
    }
    const a = performance.now();
    while (performance.now() - a < 30) { if (JOB.next().done) { JOB = null; break; } }
  }
  /** Масштаб злиття під екран (px растра на одиницю кімнати). */
  const rdNow = () => Math.min(4, Math.round(NX.cam.k * (NX.loop.dpr || 1) * 100) / 100);
  /** ЗБІРКА ПРИ ЗАВАНТАЖЕННІ (js/main.js — під вітальною заставкою): обидва крила, злиття під масштаб екрана й передня
   *  підлога-дзеркало — генератором дрібними шматками (yield — частка 0..1; що саме будується — NX.arc.step). Потрібні
   *  готові місто (NX.city) і розмір екрана (NX.loop.prep). Після неї draw() нічого не добудовує — перший кадр легкий. */
  function* bootG() {
    want = false; JOB = null;
    yield* sub(jobG(), 0, .86);
    const Rd = rdNow(), sds = ['left', 'right'].filter(sd => SIDES[sd]);
    for (let n = 0; n < sds.length; n++) { const S = SIDES[sds[n]]; note('compose', sds[n]); S.comp = yield* sub(composeG(S, Rd), .86 + .12 * n / sds.length, .86 + .12 * (n + 1) / sds.length); S.Rd = Rd; }
    note('mirror'); yield* sub(patchFrontG(), .98, 1);
  }
  let lastFr = -1;
  function draw(c, side) {
    if (NX.loop.frames !== lastFr) { lastFr = NX.loop.frames; step(); }                                       // один крок збірки на кадр
    const S = SIDES[side]; if (!S) return;
    const Rd = rdNow();
    if (!S.comp || S.Rd !== Rd) { S.comp = compose(S, Rd); S.Rd = Rd; if (side === 'right' || !ALL.right) setTimeout(patchFront, 0); }
    c.save(); c.imageSmoothingEnabled = false; c.drawImage(S.comp, S.box[0], S.box[1], S.box[2] - S.box[0], S.box[3] - S.box[1]); c.restore();
    if (NX.arc.live) NX.arc.live(c, side, S, NX.time);
  }
  NX.i18n.onLang(() => { want = true; });                                                                   // написи новою мовою — нова збірка (стара видна до готовності)
  NX.addObject({ id: 'arcLeft', span: [-12, MID + SEAM], drawBack(c, t) { if (!c.isRefl) draw(c, 'left'); } });
  NX.addObject({ id: 'arcRight', span: [MID - SEAM, 1547], drawBack(c, t) { if (!c.isRefl) draw(c, 'right'); } });
  /** СЛІДИ ЗОН НА ПІДЛОЗІ (обхід меблів — world/room.js obstacles): зона, що стоїть там, де ходять Nexi й кіт (середні —
   *  аналітика й інструменти: їхній перед — на y ~374), каже, де вона стоїть, — прямокутник на екрані під її частинами на
   *  підлозі (власник, крок 3: «щоб не ходив по верху об'єктів»). Дальні зони (маркетинг, майстерня) стоять за межею
   *  підлоги — сліду не треба (до них Nexi підходить спереду: крісло, пад). */
  ['right', 'left'].forEach(sd => {
    const by = {}; ((ALL[sd] || {}).items || []).forEach(B => { if (B.zone && B.layer !== 'up' && !B.on && !B.ghost && B.yb >= FL - 1) (by[B.zone] || (by[B.zone] = [])).push(B); });
    Object.entries(by).forEach(([zn, list]) => {
      let x0 = 1e9, x1 = -1e9, y0 = 1e9, y1 = -1e9;
      list.forEach(B => A.faces(B).forEach(Fc => { if (Fc.k === 'bottom') Fc.poly.forEach(q => { const p = X.proj(q); x0 = Math.min(x0, p[0]); x1 = Math.max(x1, p[0]); y0 = Math.min(y0, p[1]); y1 = Math.max(y1, p[1]); }); }));
      if (y1 > NX.cfg.FLOOR_Y + 6) NX.addObject({ id: 'foot_' + zn, foot: [x0, x1, y0, y1] });
    });
  });
  NX.arc.scene = { SIDES, compose, rebuild() { want = true; }, bootG };
})();

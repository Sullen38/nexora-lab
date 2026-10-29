/* ============================================================================
 * objects/arc_scene.js — СТІНИ Й ПІДЛОГА КРИЛ «ПО ДУЗІ» (+ зони з розкладки) У ПІКСЕЛЬНОМУ 3D
 * ----------------------------------------------------------------------------
 * Чиста основа (власник, 29.10): стіни й підлога обох крил; зони, полиці, антресоль, підвіси й оздоби з'являються,
 * коли їх додає розкладка генератора (objects/arc_layout.js <- tools/wingbox/gen_room.py) — по черзі, див. docs/HANDOFF.md.
 * Рушій — core/px3d.js (z-буфер: хто кого закриває — для кожного пікселя), матеріали — objects/arc_kit.js, малюнки граней
 * за id предмета — arc_paint.js, живі екрани — arc_live.js. Форми (лампи, крісла) й рослини (NX.arc.shape / NX.arc.plant) —
 * необов'язкові: їх зараз немає (старі — в історії git, коміт a941612). Диван, передня підлога кімнати, вікно й рами — свої.
 * Кожне крило складається з растрів (шарів), що малюються по черзі (позаду -> попереду):
 *   1. СТІНА Й ПІДЛОГА (2 px/од.) — дуга від відкосу до глядача: ліворуч цегла (домашнє, теплі відсвіти), праворуч
 *      металеві панелі (технологічне); плінтус з неоном, поручень; глянцева підлога з плиткою; екран на стіні (hub), якщо є.
 *      Стіна — стовпчиками, підлога — рядками (швидко); світло — карта з ламп і екранів розкладки (lightsOf);
 *   2. БІЛЯ СТІНИ (3 px/од.) — колони, антресоль, настінні полиці, підвіси, оздоби (DECOR) — лише якщо є в розкладці;
 *   3–5. ЗОНИ (3 px/од.) — дальня, середня, найближча; у кожної — свій z-буфер, контур і віддзеркалення в підлозі
 *      та на глянцевих стільницях; маніпулятор майстерні — у шарі майстерні.
 * Збірка — по шару за кадр (сторінка не «замерзає»); готові шари зливаються ОДИН раз в одне полотно під масштаб екрана
 * (+ сяйво — bloom); щокадру — один drawImage на крило й живі екрани поверх (під маскою видимих пікселів). Підлоги крил
 * ідуть і під вікно (за диваном: він ближче до глядача, core/config.js SOFA) і сходяться посередині (x 774 ± 10), унизу
 * плавно переходять у передню підлогу кімнати (fadeFloor). Передня підлога кімнати на всю ширину бере віддзеркалення з
 * картинки, міста, рами вікна й цього злиття (patchFront — замість латки міста).
 * Перебудова — при зміні масштабу екрана (лише злиття) або мови (уся збірка; стара видна до готовності).
 * ========================================================================== */
(() => {
  const X = NX.px3d, A = NX.arc.kit, K = NX.kit, F = NX.furn, PZ = NX.persp, { col, pal, ramp, mixc, dim, add, rgb } = X;
  const ALL = window.RWBOX || NX.arcLayout || {}, FL = 372, CEIL = -240, WIN = NX.cfg.WIN, PL = A.PAL;
  const R_ZONE = 3, R_WALL = 2, t0 = performance.now();   // зони 3 px/од. (на екрані — 1.2..2.7 px/од.: з запасом), стіни 2
  const MID = 774, SEAM = 10;                             // середина кімнати: тут сходяться крила (підлоги — плавно на MID ± SEAM)
  if (window.ARC_PROF) {                                                              // заміри збірки (лише для відлагодження: window.ARC_PROF = 1)
    const PR = NX.arc.prof = {}, wrap = (o, k, nm) => { const f = o[k]; o[k] = function () { const a = performance.now(), r = f.apply(this, arguments); PR[nm] = (PR[nm] || 0) + performance.now() - a; return r; }; };
    wrap(X, 'face', 'face'); wrap(X, 'sprite', 'sprite'); wrap(X, 'outline', 'outline'); wrap(X, 'reflect', 'reflect'); wrap(A, 'texture', 'texture'); wrap(NX.arc, 'plant', 'plant'); wrap(X, 'canvas', 'canvas'); wrap(X, 'tube', 'tube');
  }
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
    if (B.plant) { const { P } = A.basis(B), c = P(0, B.dep / 2, B.yt), k = s(c[2]), X0 = X.proj(c); x0 = Math.min(x0, X0[0] - B.fw * k / 2); x1 = Math.max(x1, X0[0] + B.fw * k / 2); if (B.hangs) y1 = Math.max(y1, X0[1] + B.fh * k); else y0 = Math.min(y0, X0[1] - B.fh * k); }
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
    if (st === 'pot' && NX.arc.potOf) { const pt = NX.arc.potOf(B); o.pal = pt.pal; o.q = .58; o.topPal = PL.TERRA; }
    if (st === 'gold' && B.plant) o.topPal = PL.TERRA;
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
  /** Вазон: теракота / кераміка / navy з неоновим обідком / хром / золото; ґрунт зверху. */
  function potShader(B, F) {
    const pt = NX.arc.potOf(B), base = A.shader('pot', F, B, { pal: pt.pal, q: .56 }), rim = col(pt.rim), band = pt.band ? col(pt.band) : 0, H = F.fh, SOIL = pal(['#120806', '#1e0e08', '#2a1408', '#3a1c0c', '#4a2410']);
    if (F.k === 'top') return (u, v, i, j) => { const d = (u - .5) ** 2 + (v - .5) ** 2; return d > .2 ? rim : d > .16 ? dim(rim, .55) : ramp(SOIL, .25 + hash(i, j) * .6 - d * 1.2, i, j); };
    return (u, v, i, j, t) => {
      const y = v * H; if (y < 1.2) { if (pt.neon) X.SH.fl |= X.F_EMIT; return y < .5 ? X.add(rim, col('#ffffff'), .3) : rim; }
      if (y < 2) return dim(base(u, v, i, j, t), .55);
      if (band && Math.abs(y - H * .34) < .55) { if (pt.neon) X.SH.fl |= X.F_EMIT; return band; }
      if (y > H - 1.2) return dim(base(u, v, i, j, t), .6);
      return base(u, v, i, j, t);
    };
  }
  /** Відкладене малювання: грані й спрайти шару збираються, а малюються ВІД БЛИЖЧИХ ДО ДАЛЬШИХ (run) — тоді
   *  z-буфер відкидає закриті пікселі ще до матеріалу, і збірка в рази швидша (матеріал — найдорожче). */
  function cmd(L, poly, f) { let k = 1e9; for (const q of poly) { const t = (PZ.D + q[2]) / PZ.D; if (t < k) k = t; } (L.cmds || (L.cmds = [])).push([k, f]); }
  function run(L) { if (!L.cmds) return; L.cmds.sort((a, b) => a[0] - b[0]).forEach(c => c[1]()); L.cmds = null; }
  /** Щільність текстури грані: тексель ≈ піксель растра (з урахуванням глибини). */
  const TSof = (L, Fc) => clamp(Math.round(L.R * s(A.centre(Fc)[2]) * 2) / 2, 2, 6);
  /** Набір для форм (NX.arc.shape — зараз немає; старі — коміт a941612, objects/arc_shapes.js): частини-об'єми, трубки, диски
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
    };
  }
  const POTLIKE = B => !!NX.arc.potOf && (B.st === 'pot' || (B.plant && B.st === 'gold'));   // вазони — лише з модулем рослин (зараз його немає)
  /** Предмет розкладки -> у растр L: видимі грані з матеріалами, текстура лиця (оздоби / власний малюнок), рослина;
   *  предмети з формою (NX.arc.shape[id] або ['st:стиль']) — нею. */
  function drawItem(L, B, reg, side, byId) {
    const id = reg.add({ B, sup: null, out: B.st === 'lamp' ? col('#5a2a0a') : B.st === 'clamp' ? col('#0a3a5a') : A.C.out }); B._id = id;
    const SHP = NX.arc.shape || {}, shp = SHP[B.id] || SHP['st:' + B.st];
    if (shp) shp(makeG(L, B, id, side), B);
    else {
      const o = styleOf(B, side), paint = NX.arc.paint && NX.arc.paint[B.id], Bf = POTLIKE(B) ? Object.assign({}, B, { kb: .78, cyl: 22 }) : B;
      for (const Fc of A.faces(Bf)) {
        if (!A.visible(Fc)) continue;
        if (B.notop && Fc.k === 'top') continue;
        let shade;
        if (POTLIKE(B)) shade = potShader(Bf, Fc);
        else if (B.plant && B.st === 'stand' && Fc.k === 'top') shade = A.shader(B.st, Fc, B, o);
        else {
          let tex = null;
          if (Fc.k === 'front' && (paint || (B.deco && B.deco.length))) tex = A.texture(B, Fc, TSof(L, Fc), paint);
          else if (paint && paint.sides && paint.sides[Fc.k]) tex = A.texture(B, Fc, TSof(L, Fc), paint.sides[Fc.k]);
          shade = A.shader(B.st, Fc, B, Object.assign({}, o, { tex }));
        }
        let fid = id;                                                                                            // живий екран: лицьова грань — свій номер (маска видимих пікселів)
        if (Fc.k === 'front' && NX.arc.LIVE && NX.arc.LIVE[B.id]) { fid = reg.add({ live: B.id }); (L.live || (L.live = [])).push({ id: B.id, B, Fc, fid }); }
        cmd(L, Fc.poly, () => X.face(L, Fc.poly, Fc.O, Fc.A, Fc.B, shade, { id, fid, n: Fc.n, fl: 0 }));
      }
    }
    if (B.plant && NX.arc.plant) {
      const big = !B.on && B.yb >= FL - 1 ? 1.3 : B.on && byId[B.on] && byId[B.on].st === 'stand' ? 1.15 : 1, fw = B.fw * big, fh = B.fh * big;
      const sp = NX.arc.plant(Object.assign({}, B, { fw, fh })), { P } = A.basis(B), top = P(0, B.dep / 2, B.yt), zf = top[2] - B.dep / 2 * .9;
      const pid = reg.add({ B, plant: 1, out: col('#04140f') });
      if (sp.hang) cmd(L, [[0, 0, zf - .6]], () => X.sprite(L, sp.img, top[0], B.yt - 2.5, zf - .6, fw, fh, { id: pid, fid: pid, hang: true }));
      else cmd(L, [[0, 0, zf - .6]], () => X.sprite(L, sp.img, top[0], B.yt + 1.2, zf - .6, fw, fh, { id: pid, fid: pid }));
      reg.list[pid].sup = { y: FL, on: 0 };
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
  function wallLayer(Ls, side, clipPoly) {
    const W = catmull(Ls.wall, 4), sgn = side === 'right' ? 1 : -1, b = side === 'right' ? [MID - SEAM, -2, 1547, 478] : [-12, -2, MID + SEAM, 478];   // підлога — і під вікном, до середини
    const L = X.Layer(b[0], b[1], b[2], b[3], R_WALL), reg = Reg(), wid = reg.add({ wall: 1, sup: { y: FL, on: 0 }, out: 0 }), fidW = wid;
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
    }
    for (let j = 0; j < LH; j++) {
      const Y = ly0 + (j + .5) / R; if (Y <= VY + .5) continue;
      const t = (FL - VY) / (Y - VY), z = DD * t - DD, jy = Math.max(0, Math.min(FM.ny - 1, Math.round((z - FZ0) / CELL)));
      for (let i = 0; i < LW; i++) {
        const k = j * LW + i; if (DEP[k] !== Infinity) continue;
        const x = VX + (lx0 + (i + .5) / R - VX) * t, b4 = BAY[(j & 3) * 4 + (i & 3)], ix = Math.max(0, Math.min(FM.nx - 1, Math.round((x - fx0) / CELL + b4)));
        CC[k] = lightAdd(floorAt(x, z, i, j, side), FM, jy * FM.nx + ix); DEP[k] = t; ID[k] = flid; FID[k] = flid; FLG[k] = X.F_FLOOR | X.F_NOOUT;
      }
    }
    // екран NEXORA AI (праворуч) і стрічка машинерії — у шарі стіни
    if (Ls.hub) { const H = Ls.hub, B = { id: 'hub', x: H.x, z: H.z, turn: H.turn, w: H.w, dep: 3, yb: H.y1, yt: H.y0, st: 'screen', deco: H.deco }; drawItem(L, B, reg, side, {}); }
    run(L);
    clipLayer(L, clipPoly);
    X.reflect(L, a => reg.get(a) && reg.get(a).sup, { a: .55, h: 50, streak: 1 });
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
      else if (/_booth$|ai_screen|ws_back|tl_board|pt_back/.test(B.id)) { const p = ctr(B); add(p, 130, .2, B.id === 'ws_back' ? '#ff4fd8' : B.id === 'pt_back' ? '#9a4aff' : '#3b8aff'); add([p[0], B.yb - 30, p[2]], 110, .14, ACC[B.zone] || '#ff4fd8'); }
    });
    (Ls.hang || []).forEach(h => { if (h.kind !== 'vine') add([h.x, (h.from != null ? h.from : 56) + h.len + 8, h.z], 70, .3, h.kind === 'red' ? '#ff4a3a' : '#ffb24a'); });
    if (Ls.hub) add([Ls.hub.x, (Ls.hub.y0 + Ls.hub.y1) / 2, Ls.hub.z - 10], 170, .26, '#3b8aff');
    add([side === 'left' ? 430 : 1118, 120, 180], 210, .16, '#9a4aff');                                       // вікно: фіолетове світло міста
    return out;
  }

  // ---------- БІЛЯ СТІНИ: колони, антресоль, полиці з вазонами, підвіси ----------
  function backLayer(Ls, side, zclip) {
    const UP = (Ls.items || []).filter(B => B.layer === 'up'), byId = {}; UP.forEach(B => byId[B.id] = B);
    const es = [...UP.map(ext), ...(Ls.cols || []).map(ext)];
    if (Ls.mezz) Ls.mezz.edge.forEach(p => { const a = X.proj([p[0], Ls.mezz.yt - 30, p[1]]), b = X.proj([p[0], Ls.mezz.yb + 4, p[1]]); es.push([a[0] - 30, a[1] - 40, a[0] + 30, b[1] + 40]); });
    (Ls.hang || []).forEach(h => { const y0 = h.from != null ? h.from : (Ls.mezz ? Ls.mezz.yb : 56), a = X.proj([h.x, y0, h.z]), b = X.proj([h.x, y0 + h.len + 30, h.z]); es.push([a[0] - 20, a[1], a[0] + 20, b[1]]); });
    const DEC = decorOf(Ls, side); DEC.forEach(d => es.push(d.ext));
    if (!es.length) return null;                                                       // біля стіни нічого немає (чиста основа) — шару немає
    const b0 = union(es, zclip), bb = [b0[0], b0[1], b0[2], Math.min(zclip[3], b0[3] + 60)], L = X.Layer(bb[0], bb[1], bb[2], bb[3], R_ZONE), reg = Reg();
    DEC.forEach(d => d.draw(L, reg, byId));
    (Ls.cols || []).forEach(B => drawItem(L, Object.assign({}, B, { zone: side === 'left' ? 'ai' : 'tools' }), reg, side, byId));
    if (Ls.mezz) mezz(L, Ls, reg);
    UP.forEach(B => drawItem(L, B, reg, side, byId));
    (Ls.hang || []).forEach(h => hang(L, Ls, h, reg));
    run(L);
    X.outline(L, a => (reg.get(a) || {}).out, 2);
    X.reflect(L, a => reg.get(a) && reg.get(a).sup, { a: .5, h: 60, streak: 1 });
    return { L, reg };
  }
  // ---------- ОЗДОБИ СТІНИ (лише в 3D, пласкі — на самій стіні): гірлянда, постери в рамках ----------
  /** Точка стіни за відстанню s від відкосу (уздовж дуги) і нормаль у кімнату; inset — на скільки від стіни. */
  function wallAt(Ls, s0, inset = 0) {
    const W = catmull(Ls.wall, 4); let acc = 0;
    for (let k = 0; k + 1 < W.length; k++) {
      const p = W[k], q = W[k + 1], len = Math.hypot(q[0] - p[0], q[1] - p[1]);
      if (s0 <= acc + len || k + 2 === W.length) { const u = Math.max(0, Math.min(1, (s0 - acc) / (len || 1))), x = p[0] + (q[0] - p[0]) * u, z = p[1] + (q[1] - p[1]) * u;
        let n = [-(q[1] - p[1]) / len, (q[0] - p[0]) / len]; if (n[0] * (774 - x) + n[1] * (60 - z) < 0) n = [-n[0], -n[1]]; return { x: x + n[0] * inset, z: z + n[1] * inset, n }; }
      acc += len;
    }
  }
  /** Оздоби крила (пласкі, на самій стіні). Чиста основа (29.10) — жодних; приклади, як було до неї:
   *    { k: 'garland', s0: 8, s1: 452, top: 9, sag: 16, n: 40 }        — гірлянда вздовж стіни (s — відстань від відкосу уздовж дуги)
   *    { k: 'poster', s: 36, w: 44, y0: -22, y1: 50, p: 'poster_nexora' } — постер у рамці (малюнок — NX.arc.paint[p], arc_paint.js) */
  const DECOR = { left: [], right: [] };
  function decorOf(Ls, side) {
    return (DECOR[side] || []).map(d => {
      if (d.k === 'poster') {
        const w = wallAt(Ls, d.s, 1.2), a = Math.atan2(-w.n[0], -w.n[1]) * 180 / Math.PI, B = { id: d.p, x: w.x, z: w.z, turn: a, w: d.w, dep: 1.2, yt: d.y0, yb: d.y1, st: 'shelf', layer: 'up' };
        return { ext: ext(B), draw: (L, reg, byId) => drawItem(L, B, reg, side, byId) };
      }
      // top — гірлянда йде під верхнім краєм видимої стіни (ближче до глядача стіна видна нижче), провисає між гачками
      const pts = []; for (let k = 0; k <= d.n; k++) { const u = k / d.n, w = wallAt(Ls, d.s0 + (d.s1 - d.s0) * u, 3), kk = s(w.z), sg = (u * 8) % 1;
        const y = d.top != null ? 220 + (d.top - 220) / kk + 6 + d.sag * 4 * sg * (1 - sg) : d.y0 + d.sag * 4 * u * (1 - u); pts.push([w.x, y, w.z]); }
      const e = pts.map(p => X.proj(p)), ex = [Math.min(...e.map(q => q[0])) - 4, Math.min(...e.map(q => q[1])) - 4, Math.max(...e.map(q => q[0])) + 4, Math.max(...e.map(q => q[1])) + 6];
      const COLS = d.cool ? ['#3be8ff', '#9af6ff', '#ff4fd8'] : ['#ffd27a', '#ff9af0', '#ffb24a', '#9af6ff', '#ffe27a'];
      return { ext: ex, draw: (L, reg) => {
        const id = reg.add({ garland: 1, sup: { y: FL, on: 0 }, out: col('#1a0a14') });
        for (let k = 0; k + 1 < pts.length; k++) X.tube(L, [pts[k][0], pts[k][1] - 1.4, pts[k][2]], [pts[k + 1][0], pts[k + 1][1] - 1.4, pts[k + 1][2]], .55, () => col('#1a1028'), { id, fid: id });
        pts.forEach((p, k) => { const c0 = col(COLS[k % COLS.length]); X.disc(L, [p[0], p[1] + 1.2, p[2]], 2.1, (u, v) => { X.SH.fl |= X.F_EMIT; return (u - .4) ** 2 + (v - .38) ** 2 < .05 ? col('#ffffff') : c0; }, { id, fid: id }); });
      } };
    });
  }
  /** Антресоль: лицьова грань (сегменти дуги), спід до стіни, торець, поруччя з балясинами. */
  function mezz(L, Ls, reg) {
    const M = Ls.mezz, E = catmull(M.edge, 2), C2 = Ls.C, id = reg.add({ mezz: 1, sup: { y: FL, on: 0 }, out: A.C.out }), Rw = Ls.R;
    const toWall = p => { const dx = p[0] - C2[0], dz = p[1] - C2[1], l = Math.hypot(dx, dz) || 1; return [C2[0] + dx / l * (Rw - 3), C2[1] + dz / l * (Rw - 3)]; };
    let acc = 0;
    for (let k = 0; k + 1 < E.length; k++) {
      const [x0, z0] = E[k], [x1, z1] = E[k + 1], len = Math.hypot(x1 - x0, z1 - z0), dx = (x1 - x0) / len, dz = (z1 - z0) / len, a0 = acc;
      let n = [-(z1 - z0), 0, (x1 - x0)]; if (n[0] * (C2[0] - x0) + n[2] * (C2[1] - z0) < 0) n = [-n[0], 0, -n[2]];
      X.face(L, [[x0, M.yt, z0], [x1, M.yt, z1], [x1, M.yb, z1], [x0, M.yb, z0]], [x0, M.yt, z0], [dx, 0, dz], [0, 1, 0], (u, v, i, j) => {
        const y = M.yt + v, sx = a0 + u, h = M.yb - M.yt;
        if (v < 1.4) { X.SH.fl |= X.F_EMIT; return v < .7 ? A.NEON.pink[2] : A.NEON.pink[1]; }
        if (v > h - 1.6) { X.SH.fl |= X.F_EMIT; const ph = ((sx * .07) % 1 + 1) % 1; return ph < .12 ? A.NEON.cyan[2] : A.NEON.cyan[1]; }
        const pc = Math.floor(sx / 26), lx = sx - pc * 26;
        if (lx < .8) return ramp(PL.STEEL, .1, i, j);
        let q = .48 + hash(pc, 3) * .1 + (v < 3 ? .15 : 0) - (v > h - 4 ? .12 : 0);
        if ((Math.abs(lx - 3) < .6 || Math.abs(lx - 23) < .6) && Math.abs(v - h / 2) < .6) q += .35;        // болти
        if (lx > 8 && lx < 18 && v > h * .3 && v < h * .7 && ((v * 2 | 0) % 2 === 0)) q -= .2;               // ґратка
        return ramp(PL.MET, q, i, j);
      }, { id, fid: id, n });
      // спід: від краю до стіни (видно знизу)
      const w0 = toWall([x0, z0]), w1 = toWall([x1, z1]);
      X.face(L, [[x0, M.yb, z0], [x1, M.yb, z1], [w1[0], M.yb, w1[1]], [w0[0], M.yb, w0[1]]], [x0, M.yb, z0], [dx, 0, dz], [w0[0] - x0, 0, w0[1] - z0], (u, v, i, j) => {
        const sx = a0 + u, beam = ((sx % 34) + 34) % 34 < 3; let q = .22 + v * .12 + (beam ? .16 : 0);
        return ramp(PL.STEEL, q, i, j);
      }, { id, fid: id, n: [0, 1, 0] });
      // поруччя: стійки й поручні
      if (k % 3 === 0) X.tube(L, [x0, M.yt, z0], [x0, M.yt - 24, z0], 1.3, (u) => ramp(PL.CHROME, .3 + (1 - Math.abs(u - .4) * 2) * .6, 0, 0), { id, fid: id });
      X.tube(L, [x0, M.yt - 24, z0], [x1, M.yt - 24, z1], 1.6, u => ramp(PL.CHROME, .35 + (1 - Math.abs(u - .35) * 2) * .62, 0, 0), { id, fid: id });
      X.tube(L, [x0, M.yt - 12, z0], [x1, M.yt - 12, z1], .9, u => ramp(PL.CHROME, .2 + (1 - Math.abs(u - .4) * 2) * .5, 0, 0), { id, fid: id });
      acc += len;
    }
    // торці (обидва краї плити — до стіни)
    [E[0], E[E.length - 1]].forEach(e0 => { const w0 = toWall(e0);
      X.face(L, [[e0[0], M.yt, e0[1]], [w0[0], M.yt, w0[1]], [w0[0], M.yb, w0[1]], [e0[0], M.yb, e0[1]]], [e0[0], M.yt, e0[1]], [w0[0] - e0[0], 0, w0[1] - e0[1]], [0, M.yb - M.yt, 0],
        (u, v, i, j) => v < .06 ? (X.SH.fl |= X.F_EMIT, A.NEON.pink[1]) : ramp(PL.MET, .38 + (v < .2 ? .1 : 0), i, j), { id, fid: id }); });
  }
  /** Підвіси: ліана (з антресолі або від стелі) або лампа на шнурі. */
  function hang(L, Ls, h, reg) {
    const y0 = h.from != null ? h.from : (Ls.mezz ? Ls.mezz.yb : 56), y1 = y0 + h.len, id = reg.add({ hang: 1, sup: { y: FL, on: 0 }, out: col('#04140f') });
    if (h.kind === 'vine') {
      if (!NX.arc.plant) return;
      const sp = NX.arc.plant({ id: 'hang_' + Math.round(h.x), x: h.x, z: h.z, hangs: 1, fw: 18, fh: h.len, plant: 1 });
      X.sprite(L, sp.img, h.x, y0 - 1, h.z, 18, h.len, { id, fid: id, hang: true }); return;
    }
    X.tube(L, [h.x, y0, h.z], [h.x, y1, h.z], .7, () => col('#0a0612'), { id, fid: id });
    const big = h.kind === 'gold' || h.kind === 'red', B = { id: 'lamp_' + Math.round(h.x), x: h.x, z: h.z - (big ? 7 : 4), turn: h.turn || 0, w: big ? 14 : 8, dep: big ? 14 : 8, yt: y1, yb: y1 + (big ? 22 : 12), st: 'lamp' };
    const lid = reg.add({ lamp: 1, sup: { y: FL, on: 0 }, out: col('#3a0a06') }), SHP = NX.arc.shape || {}, f = h.kind === 'red' ? SHP.hangRed : h.kind === 'gold' ? SHP.hangGold : SHP.hangLamp;
    if (f) f(makeG(L, B, lid, 'right'), B);
  }

  /** РОБОТ-МАНІПУЛЯТОР майстерні (розкладка: 4 точки — база на куполі, лікоть, зап'ястя, захват): товсті ланки-трубки зі
   *  світлою серединою, суглоби-диски з блакитним обідком, захват з двома пальцями й помаранчевим вогником.
   *  k — товщина під масштаб зони (розкладка: armk = масштаб зони / 1.2; більша майстерня — товща рука). */
  function arm(L, pts, reg, k = 1) {
    const id = reg.add({ arm: 1, sup: { y: FL, on: 0 }, out: A.C.out }), o = { id, fid: id }, W = [17 * k, 14 * k, 9.5 * k];
    // ланка: фіолетова сталь з об'ємом — світла смуга зверху-ліворуч (стеля), темні краї; вузька неонова пунктирна смуга
    // вздовж і сталеві хомути на кінцях (як на картинці)
    const link = flip => (u0, v, i, j) => { const u = flip ? 1 - u0 : u0;                                     // u 0 — верхній край ланки
      if (v < .05 || v > .95) return ramp(PL.CHROME, .2 + (1 - Math.abs(u - .36) * 1.8) * .55, i, j);
      if (u < .07 || u > .93) return ramp(PL.MET, .1, i, j);
      if (Math.abs(u - .62) < .05 && ((v * 11) % 1) < .55) { X.SH.fl |= X.F_EMIT; return A.NEON.cyan[1]; }
      return ramp(PL.MET, .3 + (1 - Math.abs(u - .3) * 1.9) * .6 + (Math.abs(u - .24) < .05 ? .16 : 0), i, j); };
    const upSide = (a, b) => { const m = [(a[0] + b[0]) / 2, (a[1] + b[1]) / 2, (a[2] + b[2]) / 2], p = X.cross([b[0] - a[0], b[1] - a[1], b[2] - a[2]], [X.VX - m[0], X.VY - m[1], X.EZ - m[2]]); return p[1] > 0; };   // X.tube: u 0 — бік +p
    for (let n = 0; n + 1 < pts.length; n++) cmd(L, [pts[n], pts[n + 1]], () => X.tube(L, pts[n], pts[n + 1], W[n] || 4 * k, link(upSide(pts[n], pts[n + 1])), o));
    // суглоби: сталевий диск з блакитним обідком і темною віссю (як на картинці — «око» в суглобі)
    pts.forEach((p, n) => { const r = (n === 0 ? 11 : n === pts.length - 1 ? 5.5 : 10.5) * k;
      cmd(L, [[p[0], p[1], p[2] - 1]], () => X.disc(L, [p[0], p[1], p[2] - 1], r, (u, v, i, j) => { const d = Math.hypot(u - .5, v - .5) * 2; if (d > .78) { X.SH.fl |= X.F_EMIT; return A.NEON.cyan[d > .9 ? 1 : 2]; }
        if (n && n < pts.length - 1 && d < .26) return d < .14 ? (X.SH.fl |= X.F_EMIT, A.NEON.cyan[2]) : ramp(PL.DARK, .3, i, j); return ramp(PL.STEEL, .7 - d * .5 + (u < .4 && v < .4 ? .2 : 0), i, j); }, o)); });
    // захват: два пальці й помаранчевий вогник між ними
    const e = pts[pts.length - 1], b = pts[pts.length - 2], dx = e[0] - b[0], dy = e[1] - b[1], l = Math.hypot(dx, dy) || 1, nx = dx / l, ny = dy / l;
    [-1, 1].forEach(sg => { const a = [e[0] + nx * 3 * k - ny * sg * 3.4 * k, e[1] + ny * 3 * k + nx * sg * 3.4 * k, e[2] - 1.5], c2 = [a[0] + nx * 8 * k, a[1] + ny * 8 * k, a[2]]; cmd(L, [a, c2], () => X.tube(L, a, c2, 2.2 * k, (u, v, i, j) => ramp(PL.CHROME, .3 + (1 - Math.abs(u - .4) * 2) * .5, i, j), o)); });
    const tip = [e[0] + nx * 6 * k, e[1] + ny * 6 * k, e[2] - 2]; cmd(L, [tip], () => X.disc(L, tip, 2 * k, () => { X.SH.fl |= X.F_EMIT; return A.NEON.orange[2]; }, o));
  }

  // ---------- ЗОНИ ----------
  function zoneLayer(items, side, zclip, Ls, zn) {
    const byId = {}; items.forEach(B => byId[B.id] = B);
    const es = items.map(ext); if (Ls && Ls.arm && Ls.armZone === zn) { const pad = 12 * (Ls.armk || 1); Ls.arm.forEach(p => { const q = X.proj(p); es.push([q[0] - pad, q[1] - pad, q[0] + pad, q[1] + pad]); }); }
    const b0 = union(es, zclip), bb = [b0[0], b0[1], b0[2], Math.min(zclip[3], b0[3] + (b0[3] - b0[1]) * .75)];   // знизу — місце для віддзеркалення в підлозі
    const L = X.Layer(bb[0], bb[1], bb[2], bb[3], R_ZONE), reg = Reg();
    // спершу основи (те, на чому стоять), потім речі — глибина однаково правильна, а глянцю потрібен номер опори
    const order = items.slice().sort((a, b) => (a.on ? 1 : 0) - (b.on ? 1 : 0));
    order.forEach(B => drawItem(L, B, reg, side, byId));
    if (Ls && Ls.arm && Ls.armZone === zn) arm(L, Ls.arm, reg, Ls.armk || 1);                              // маніпулятор майстерні — у z-буфері зони
    run(L);
    X.outline(L, a => (reg.get(a) || {}).out, 2);
    X.reflect(L, a => { const r = reg.get(a); return r && r.sup && r.sup.on ? r.sup : null; }, { a: .5, h: 14 });   // глянець стільниць
    X.reflect(L, a => { const r = reg.get(a); return r && r.sup ? { y: FL, on: 0 } : null; }, { a: .62, h: 62, streak: 1 });   // підлога
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
  /** Збірка крила ПО КРОКАХ (генератор): після кожного шару — пауза до наступного кадру, щоб сторінка не «замерзала»
   *  на кілька секунд (кожен шар — 0.1..0.4 с). Результат: {side, box, live, layers: [{cv, x0, y0, x1, y1}], ms}. */
  function* buildSide(side) {
    const Ls = ALL[side]; if (!Ls) return null;
    let ms = 0;
    // стіна — від відкосу; підлога — і під вікном (з-під порога), до середини кімнати: там підлоги крил сходяться (fadeFloor)
    const clip = side === 'right' ? [[WIN.R, -2], [1547, -2], [1547, 478], [MID - SEAM, 478], [MID - SEAM, 346], [WIN.R, 346]] : [[-12, -2], [WIN.L, -2], [WIN.L, 346], [MID + SEAM, 346], [MID + SEAM, 478], [-12, 478]];
    const zclip = side === 'right' ? [MID - SEAM, -2, 1550, 478] : [-12, -2, MID + SEAM, 478];   // дальні зони ширші — заходять за диван
    const tm = [], T = (nm, f) => { const a = performance.now(), r = f(), d = performance.now() - a; ms += d; tm.push(nm + ' ' + d.toFixed(0) + (r && r.L ? '(' + (r.L.W * r.L.H / 1e6).toFixed(2) + 'MP)' : '')); return r; };
    const layers = [T('wall', () => wallLayer(Ls, side, clip))]; yield;
    const bk = T('back', () => backLayer(Ls, side, zclip)); if (bk) { layers.push(bk); yield; }
    const ZN = side === 'right' ? ['workshop', 'tools', 'portal'] : ['marketing', 'analytics', 'ai'];
    for (const z of ZN) { const it = (Ls.items || []).filter(B => B.zone === z && B.layer !== 'up'); if (it.length) { layers.push(T(z, () => zoneLayer(it, side, zclip, Ls, z))); yield; } }
    const box = side === 'right' ? [MID - SEAM, -2, 1547, 478] : [-12, -2, MID + SEAM, 478];
    const live = [], out = T('finish', () => {
      layers.forEach(l => fadeFloor(l.L, side));
      layers.forEach((l, li) => (l.L.live || []).forEach(E => { const m = liveMask(layers, li, E.fid); if (m) live.push(Object.assign(E, { mask: m })); }));   // живі екрани: маски з z-буфера
      return { side, box, live, layers: layers.map(l => ({ cv: X.canvas(l.L), x0: l.L.x0, y0: l.L.y0, x1: l.L.x1, y1: l.L.y1 })) };   // буфери растрів далі не потрібні
    });
    if (window.ARC_LOG !== 0) console.log('[arc] ' + side + ': ' + tm.join(', '));
    out.ms = ms; return out;
  }
  /** Шари -> одне полотно під масштаб Rd (+ сяйво). */
  function compose(S, Rd) {
    const [x0, y0, x1, y1] = S.box, w = Math.round((x1 - x0) * Rd), h = Math.round((y1 - y0) * Rd), cv = document.createElement('canvas'); cv.width = w; cv.height = h;
    const c = cv.getContext('2d'); c.setTransform(Rd, 0, 0, Rd, -x0 * Rd, -y0 * Rd); c.imageSmoothingEnabled = true; c.imageSmoothingQuality = 'high';
    S.layers.forEach(l => c.drawImage(l.cv, l.x0, l.y0, l.x1 - l.x0, l.y1 - l.y0));
    bloom(cv); return cv;
  }
  /** Сяйво: яскраві пікселі -> 3 масштаби розмиття -> додати світлом (запікається в злиття). */
  function bloom(cv) {
    const w = cv.width, h = cv.height, f = 6, bw = Math.max(1, Math.round(w / f)), bh = Math.max(1, Math.round(h / f)), b1 = document.createElement('canvas'); b1.width = bw; b1.height = bh;
    const bx = b1.getContext('2d', { willReadFrequently: true }); bx.imageSmoothingEnabled = true; bx.drawImage(cv, 0, 0, bw, bh);
    const im = bx.getImageData(0, 0, bw, bh), d = im.data;
    // яскравість -> прозорість (колір лишається): у режимі 'lighter' темне нічого не додає й не робить прозоре (вікно) непрозорим
    for (let i = 0; i < d.length; i += 4) { const m = Math.max(d[i], d[i + 1], d[i + 2]), k = Math.min(1, Math.max(0, (m - 120) / 135)) * (d[i + 3] / 255); d[i + 3] = Math.round(k * 255); }
    bx.putImageData(im, 0, 0);
    const down = (src, k) => { const o = document.createElement('canvas'); o.width = Math.max(1, Math.round(src.width / k)); o.height = Math.max(1, Math.round(src.height / k)); const ox = o.getContext('2d'); ox.imageSmoothingEnabled = true; ox.drawImage(src, 0, 0, o.width, o.height); return o; };
    const b2 = down(b1, 2), b3 = down(b2, 2), c = cv.getContext('2d'); c.save(); c.setTransform(1, 0, 0, 1, 0, 0); c.globalCompositeOperation = 'lighter'; c.imageSmoothingEnabled = true; c.imageSmoothingQuality = 'high';
    [[b1, .22], [b2, .3], [b3, .34]].forEach(([b, k]) => { c.globalAlpha = k; c.drawImage(b, 0, 0, w, h); }); c.restore();
  }
  /** Передня підлога кімнати на всю ширину — віддзеркалення нових крил і міста за вікном (копія розміром з картинку
   *  кімнати: картинка -> місто (усе скло: диван тепер стоїть ближче й сам віддзеркалюється) -> рама вікна -> крила).
   *  Замість латки міста (world/cityscape.js patchFloor кличе цю, коли вона є). */
  function patchFront() {
    const img = NX.room.img, RS = NX.room.RS; if (!img.naturalWidth || !['left', 'right'].every(sd => !ALL[sd] || (SIDES[sd] && SIDES[sd].comp))) return;
    const cv = document.createElement('canvas'); cv.width = img.naturalWidth; cv.height = img.naturalHeight; const x = cv.getContext('2d');
    x.drawImage(img, 0, 0); x.scale(RS, RS); x.imageSmoothingEnabled = true;
    if (NX.city && NX.city.paint) NX.city.paint(x, NX.time, 'full', RS);
    const fr = NX.objects.windowFrame; if (fr && fr.drawBack) fr.drawBack(x, NX.time);
    ['left', 'right'].forEach(sd => { const S = SIDES[sd]; if (S && S.comp) x.drawImage(S.comp, S.box[0], S.box[1], S.box[2] - S.box[0], S.box[3] - S.box[1]); });
    NX.room.patchFront(cv, 0, NX.cfg.ROOM_W);
  }
  NX.arc.patchFront = patchFront;

  // ---------- збірка вразбіг, показ, перебудова ----------
  // JOB — збірка обох крил кроками (по шару за кадр); поки нова збірка не готова, показується попередня (зміна мови — без блимання)
  let JOB = null, NEXT = null, want = true;
  function step() {
    if (!JOB) {
      if (!want) return;
      if (document.fonts && document.fonts.status !== 'loaded' && performance.now() - t0 < 2500) return;   // написи — коли шрифт готовий
      want = false; NEXT = {}; JOB = (function* () { for (const sd of ['left', 'right']) NEXT[sd] = yield* buildSide(sd); })();
    }
    const a = performance.now();
    while (performance.now() - a < 30) { const r = JOB.next(); if (r.done) {
      JOB = null; Object.assign(SIDES, NEXT); NEXT = null; NX.arc.built = SIDES;
      console.log('[arc] built', Object.values(SIDES).map(S => S && S.side + ' ' + S.ms.toFixed(0) + 'ms').join(', '), NX.arc.prof ? JSON.stringify(NX.arc.prof, (k, v) => typeof v === 'number' ? Math.round(v) : v) : '');
      break; } }
  }
  let lastFr = -1;
  function draw(c, side) {
    if (NX.loop.frames !== lastFr) { lastFr = NX.loop.frames; step(); }                                       // один крок збірки на кадр
    const S = SIDES[side]; if (!S) return;
    const Rd = Math.min(4, Math.round(NX.cam.k * (NX.loop.dpr || 1) * 100) / 100);
    if (!S.comp || S.Rd !== Rd) { S.comp = compose(S, Rd); S.Rd = Rd; if (side === 'right' || !ALL.right) setTimeout(patchFront, 0); }
    c.save(); c.imageSmoothingEnabled = false; c.drawImage(S.comp, S.box[0], S.box[1], S.box[2] - S.box[0], S.box[3] - S.box[1]); c.restore();
    if (NX.arc.live) NX.arc.live(c, side, S, NX.time);
  }
  NX.i18n.onLang(() => { want = true; });                                                                   // написи новою мовою — нова збірка (стара видна до готовності)
  NX.addObject({ id: 'arcLeft', span: [-12, MID + SEAM], drawBack(c, t) { if (!c.isRefl) draw(c, 'left'); } });
  NX.addObject({ id: 'arcRight', span: [MID - SEAM, 1547], drawBack(c, t) { if (!c.isRefl) draw(c, 'right'); } });
  NX.arc.scene = { SIDES, compose, rebuild() { want = true; } };
})();

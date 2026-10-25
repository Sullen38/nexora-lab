/* ============================================================================
 * objects/wing_kit.js — КОНСТРУКТОР ЛІВОГО КРИЛА (спільні деталі для трьох зон)
 * ----------------------------------------------------------------------------
 * Усе ліве крило (AI-центр, аналітика, маркетинг, полиці, рослини) намальоване
 * кодом з одного набору деталей, тому виглядає як одна кімната:
 *   brick(S, box, lights)      — цегляна стіна з теплими/холодними відсвітами
 *   booth(S, spec)             — будка зони: панель з неоновим кантом, вивіска
 *                                з іконкою, ніша з рамками голо-екранів, бічна грань
 *   desk(S, spec)              — стіл: видимий верх, рожева неонова плита, корпус
 *                                із секціями (тумба з шухлядами / ніша / шафка / опора)
 *   plant(spec)                — рослина піксель-артом: кожен листок окремо (контур, жилки,
 *                                блік, дірки монстери, листочки папороті): монстера, папороть,
 *                                пальма, сансев'єра, ліана-потос, неонова, бонсай; горщик
 *                                navy / terra / chrome / glass -> спрайт
 *   sway(c, sp, x, y, t, ph, shake) — малює спрайт рослини: верх гойдається, горщик стоїть
 *   sign(c, x, y, w, h, o)     — вивіска зони в ЄДИНОМУ стилі (AI-центр, аналітика, маркетинг)
 *   gadget(kind) / lamp(kind)  — штучки на полички (голо-куб, куля, дрон, тераріум, робот,
 *                                колонка) і лампи (Едісона, китайський ліхтар): растр + live()
 *   coreGeom / corePC / coreLive — системний блок AI-ядра зі скляною панеллю і живою начинкою
 *   screenBg / noise / rgba / lit    — дрібниці для живих екранів
 *   trinkets / trinketsLive / stuck  — ДРІБНИЦІ НА СТОЛАХ (папери, стікери, ручки, навушники,
 *                                телефон, мишка) — окремий файл objects/wing_trinkets.js
 * Координати — одиниці кімнати; растри — 4 px/од. (NX.furn.Sheet).
 * ========================================================================== */
NX.kit = (() => {
  const P = NX.px, F = NX.furn, { NAVY, PINK, CYAN, HOLO, DESK, LIL, CHROME, OUT } = F.PAL, ramp = F.ramp, hash = NX.art.hash;
  const BRK = ['#0c0719', '#150b28', '#1e1138', '#28174a', '#341d5c', '#42256e', '#542f86', '#6a3c9a'];
  const SLAB = ['#3a0e5b', '#4d0d6e', '#5b0775', '#6d058a', '#850498', '#ac14b9', '#b317bd', '#cb53cb', '#e07ae0'];
  const GREEN = ['#04140f', '#07241a', '#0c3626', '#124a34', '#1a6244', '#237e56', '#2f9c66', '#48bc7a'];
  const GREEN2 = ['#06201a', '#0c3224', '#164a34', '#1f6644', '#2c8656', '#3fa868', '#66c884'];
  const SAGE = ['#13332c', '#1e4a3e', '#2b6652', '#3d8a66', '#58ac7e', '#86cc9a'];
  const POT = ['#0d0828', '#1a1046', '#2a1860', '#3b2480', '#4f31a0', '#6a48c0'];
  const TERRA = ['#2a1208', '#4a2010', '#6e3418', '#8e4a22', '#b06430', '#d08a4a'];
  const rgba = (rgb, a) => `rgba(${rgb},${P.clamp(a, 0, 1)})`, lit = (c, x, y, w, h, col) => { c.fillStyle = col; c.fillRect(x, y, w, h); };
  const noise = (t, i) => .5 + .26 * Math.sin(t * 1.3 + i * 1.7) + .16 * Math.sin(t * 2.9 + i * 3.1) + .08 * Math.sin(t * 5.3 + i * .7);
  const mix = (a, b, k) => { if (k <= 0) return a; if (k >= 1) return b; const A = [1, 3, 5].map(i => parseInt(a.slice(i, i + 2), 16)), B = [1, 3, 5].map(i => parseInt(b.slice(i, i + 2), 16)); return '#' + A.map((v, i) => Math.round(v + (B[i] - v) * k).toString(16).padStart(2, '0')).join(''); };

  /** Цегла (темна, залита неоном — як на картинці): box = [x0,y0,x1,y1]; lights — відсвіти:
   *    {x,y,r,k,col}            — точкове джерело (ліхтар — теплий col, екран — синій)
   *    {band:1,x0,x1,y,r,k,col} — смуга (рожева плита стола світить на стіну над собою)
   *    {box:[x0,y0,x1,y1],r,k,col} — сяйво навколо прямокутника (великий екран, будка) */
  function brick(S, [x0, y0, x1, y1], lights = []) {
    S.rect(x0, y0, x1, y1, (u, v, i, j, X, Y) => {
      const row = Math.floor(Y / 7), bx = (((X + (row & 1) * 7) % 14) + 14) % 14, by = ((Y % 7) + 7) % 7;
      const id = Math.floor((X + (row & 1) * 7) / 14) * 31 + row, mortar = bx < .8 || by < .6;
      let q = (mortar ? .02 : .11 + hash(id, 7) * .13 + (by < 1.4 ? .07 : by > 6.2 ? -.05 : 0) + (bx < 1.6 ? .03 : 0)), col = null, ck = 0;
      for (const L of lights) {
        let d;
        if (L.band) d = (X >= L.x0 && X <= L.x1) ? Math.max(0, 1 - Math.abs(Y - L.y) / L.r) : 0;
        else if (L.box) { const [a, b, c2, e] = L.box; d = Math.max(0, 1 - Math.hypot(Math.max(a - X, 0, X - c2), Math.max(b - Y, 0, Y - e)) / L.r); }
        else d = Math.max(0, 1 - Math.hypot(X - L.x, Y - L.y) / L.r);
        d = d * d * L.k; q += d * (mortar ? .4 : 1); if (L.col && d > ck) { ck = d; col = L.col; }
      }
      const base = ramp(BRK, q, i, j, mortar ? 0 : .22); return col ? mix(base, col, Math.min(.6, ck * 1.1)) : base;
    });
  }

  /** Будка зони. spec: {x0,y0,x1,y1, acc:[dark,mid,bright,hi], sign:[x0,y0,x1,y1], icon:[cx,cy], screens:[[x0,y0,x1,y1],...], side:f}
   *  Повертає нічого — малює в аркуш S. Вивіска порожня (напис — живий, мовою глядача). */
  function booth(S, sp) {
    const { x0, y0, x1, y1, acc } = sp, f = sp.side === undefined ? .03 : sp.side;
    if (f) { const a = F.toVP(x1, y0 + 6, f), b = F.toVP(x1, y1, f); S.poly([[x1 - .5, y0 + 6], a, b, [x1 - .5, y1]], (u, v, i, j) => u > .8 ? acc[1] : ramp(NAVY, .28 - v * .18, i, j)); }   // бічна грань — до вікна
    S.rr(x0, y0, x1, y1, [6, 6, 1.5, 1.5], (d, u, v, i, j, X, Y) => {
      if (d < .7) return acc[1]; if (d < 1.6) return acc[3]; if (d < 2.3) return acc[1];                      // неоновий кант
      if (d < 3.6) return v < .5 ? NAVY[6] : NAVY[4];
      if (X < x0 + 11) return Math.abs(X - (x0 + 9.5)) < .5 ? NAVY[6] : (Math.abs(X - (x0 + 6)) < .8 && ((Y | 0) % 18 === 3) ? acc[2] : ramp(NAVY, .3 - v * .14, i, j, .12));   // ліва планка з вогниками
      return ramp(NAVY, .42 - v * .22, i, j, .12);
    });
    // вивіска малюється живою (K.sign) — у єдиному стилі з AI-центром
    const scr = sp.screens, nx0 = Math.min(...scr.map(s => s[0])) - 4, ny0 = Math.min(...scr.map(s => s[1])) - 4, nx1 = Math.max(...scr.map(s => s[2])) + 4, ny1 = Math.max(...scr.map(s => s[3])) + 4;
    S.rr(nx0, ny0, nx1, ny1, 2, (d, u, v, i, j) => d < .7 ? NAVY[0] : ramp(NAVY, .14, i, j));                // ніша
    for (const [a, b, c2, e] of scr) S.rr(a - 2.4, b - 2.4, c2 + 2.4, e + 2.4, 2.4, (d, u, v, i, j) => d < .6 ? '#06102e' : d < 1.4 ? acc[1] : d < 2.4 ? acc[3] : d < 3 ? acc[2] : ramp(HOLO, .6 - v * .3, i, j));   // рамки екранів (товсті, як на картинці)
    S.rect(nx0 + 3, ny1 + 2, nx1 - 3, ny1 + 4, (u, v) => v < .5 ? NAVY[0] : NAVY[3]);                         // планка під екранами
  }

  /** Стіл. spec: {l, r, top (верх плити), slab (низ плити), bot (підлога), back (задній край видимого верху),
   *  sec: [{a,b,kind:'drawers'|'core'|'leg'|'niche'}], warm: x від якого плита тепліша, end: 'none'|'right'} */
  function desk(S, sp) {
    const { l, r, top, slab, bot, back } = sp, o = OUT, NV = ['#02010a', '#05041a', '#080a2a', '#0d143c', '#121d50', '#182866', '#20357c', '#2a4494'];
    const secAt = X => sp.sec.find(s => X >= s.a && X < s.b);
    S.rect(l, slab, r, bot, (u, v, i, j, X, Y) => {
      const s = secAt(X), d = (Y - slab) / (bot - slab);
      if (!s || s.kind === 'niche') {                                                                          // ніша: тінь під плитою, задня стінка з рейками, LED, цоколь
        if (Y < slab + 2) return NV[0];
        if (Y < bot - 10) return ((X - l) % 12 + 12) % 12 < .8 ? NV[3] : ramp(['#030112', '#05031c', '#080526', '#0b0730'], .15 + d * .6, i, j, .1);
        if (Y < bot - 9) return '#123a6a';
        return ramp(['#04021a', '#0a0628', '#120a36', '#1a0f46'], .2 + (Y - bot + 9) / 9 * .6, i, j, .15);
      }
      const { a, b } = s, du = X - a, dw = b - X;
      if (du < .5 || dw < .5) return o;
      if (Y > bot - 4) return s.kind === 'leg' ? (Y > bot - .8 ? o : ramp(CHROME, .75 - (Y - bot + 4) * .15, i, j)) : (Y > bot - .6 ? o : Y < bot - 3.2 ? CHROME[2] : NV[1]);   // п'ята / цоколь
      if (s.kind === 'drawers') {
        const n = s.rows || 3, h = (bot - 4 - slab - 6) / n, k = Math.floor((Y - slab - 6) / h), p = slab + 6 + k * h, q = p + h - 1.5;
        if (Y < slab + 6) return NV[2]; if (k < 0 || k >= n || Y >= q) return NV[0];
        const dv = Y - p, cy = (p + q) / 2;
        if (dv < .5) return NV[7]; if (dw < 1.4) return NV[0]; if (du < 1.4) return NV[6];
        if (dv > .9 && dv < 1.6 && du > 3 && dw > 3) return k % 2 ? '#ff4fd8' : '#3be8ff';                                          // LED-смужка шухляди (як на картинці)
        if (Math.abs(Y - cy) < 1 && Math.abs(X - (a + b) / 2) < (b - a) * .3) return Math.abs(Y - cy) < .4 ? '#000006' : NV[1];     // ручка-паз
        if (Math.abs(Y - cy + 1.5) < .4 && Math.abs(X - (a + b) / 2) < (b - a) * .3) return NV[6];
        return ramp(NV, .78 - dv / (q - p) * .35 + (1 - du / (b - a)) * .1, i, j, .12);
      }
      if (s.kind === 'core') return du < 1.6 || dw < 1.6 || Y < slab + 1.6 || Y > bot - 5.6 ? ramp(CHROME, .5 - d * .3, i, j) : NV[1];   // системний блок: корпус (начинка — corePC нижче)
      // опора: хромована рама (дві стійки + перекладини), всередині неонова трубка
      const cx = (a + b) / 2, hw = (b - a) / 2, st = Math.abs(X - cx) > hw - 4.5, tube = Math.abs(X - cx) < 1.6, mid = (slab + bot) / 2, bar = Math.abs(Y - mid + 8) < 1.7 || Math.abs(Y - mid - 8) < 1.7;
      if (st) return ramp(CHROME, .8 - Math.abs(Math.abs(X - cx) - (hw - 2.2)) * .35 - d * .3, i, j);
      if (bar) return ramp(CHROME, .7 - d * .2, i, j);
      if (tube) return Math.abs(X - cx) < .7 ? '#dff8ff' : '#3be8ff';
      return null;
    });
    sp.sec.filter(s => s.kind === 'core').forEach(s => corePC(S, coreGeom(s.a, s.b, slab, bot)));
    // плита: світла кромка, рожевий перелив; видимий верх — темне скло з відблиском
    S.rr(l, top, r, slab, [2, 2, 2, 2], (d, u, v, i, j, X, Y) => {
      const k = sp.warm ? P.clamp((X - sp.warm) / 70, 0, 1) : 0, dy = Y - top;
      if (d < .5) return o;
      if (dy < 1.3) return k > .5 ? '#ffe2ee' : '#ffd4ff';
      if (dy < 2.2) return k > .5 ? '#f6a0c0' : SLAB[8];
      if (sp.sec.some(s => s.kind !== 'niche' && Math.abs(X - s.a) < .45 && s.a > l + 1)) return SLAB[2];
      const q = 1 - (dy - 2.2) / (slab - top - 2.2), n = SLAB.length - 1, idx = P.clamp(Math.round(q * .95 * n + NX.art.BAYER[(j & 3) * 4 + (i & 3)] * .9), 0, n);
      return mix(SLAB[idx], ['#5a1440', '#8e286a', '#a52174', '#c32988', '#d73f90', '#e45f8c', '#ee7aa4', '#f6a0c0', '#ffc8dc'][idx], k);
    });
    S.rect(l, back, r, top, (u, v, i, j, X) => v < .12 ? '#060313' : (((X * .7 + v * 9) | 0) % 23 === 0 ? '#3a1858' : ramp(['#0b0730', '#120a36', '#1c0a3c', '#2b0c40', '#43123f', '#612758'], .1 + v * .8, i, j, .12)));
    if (sp.end === 'right') { const a = F.toVP(r, top, .03), b = F.toVP(r, bot - 4, .03); S.poly([[r - .4, top], a, b, [r - .4, bot - 4]], (u, v, i, j, X, Y) => Y < top + 5 ? PINK[3] : ramp(DESK, .3 - v * .2, i, j)); }
  }

  // ---------- рослини v2: кожен листок окремо (контур, жилки, блік, дірки монстери, листочки папороті) ----------
  const PALS = { green: GREEN, light: GREEN2, sage: SAGE, neon: ['#061a2a', '#0a2e44', '#104a62', '#187086', '#2498a8', '#34c0c8', '#5ae8ff', '#b0f8ff'] };
  /** Листок: спина від base під кутом ang (0 = вгору), довжина len, ширина w, curl — загин донизу.
   *  kind: 'broad' (монстера), 'blade' (пальма, сансев'єра, листочок папороті), 'heart' (потос), 'round' (хмарка бонсая).
   *  Повертає {poly, sp} — многокутник і зразки спини (для жилок, бліків, дірок). */
  function leaf(base, ang, len, w, curl, kind, seed) {
    const L = [], R = [], sp = [], n = 16;
    for (let k = 0; k <= n; k++) {
      const t = k / n, s = t * len, a = ang + curl * t * t * 1.6, x = base[0] + Math.sin(a) * s, y = base[1] - Math.cos(a) * s;
      let ww = kind === 'blade' ? w * (t < .15 ? t / .15 : 1 - Math.pow((t - .15) / .85, 2.2))
        : kind === 'heart' ? w * (t < .22 ? Math.sqrt(t / .22) : 1 - Math.pow((t - .22) / .78, 1.7))
        : kind === 'round' ? w * Math.sqrt(Math.max(0, 1 - Math.pow(2 * t - 1, 2))) * (.86 + .14 * Math.abs(Math.sin(t * 23 + seed)))
        : w * Math.sin(Math.PI * Math.pow(t, .75));
      if (kind === 'blade' && t > .1) ww *= .86 + .14 * Math.abs(Math.sin(t * 40 + seed));                                   // пилчастий край
      const px = Math.cos(a), py = Math.sin(a);
      L.push([x - px * ww / 2, y - py * ww / 2]); R.push([x + px * ww / 2, y + py * ww / 2]); sp.push({ x, y, px, py, hw: ww / 2, t });
    }
    return { poly: L.concat(R.reverse()), sp, len, w, kind, seed };
  }
  /** Заливка листка: контур навколо, тон за положенням на спині (t уздовж, side поперек), жилки, блік, дірки, кінчики. */
  function fillLeaf(S, lf, pal, o) {
    const sp = lf.sp, hi = pal[pal.length - 1];
    if (o.outline !== false) for (const [dx, dy] of [[-.55, 0], [.55, 0], [0, -.55], [0, .55]]) S.poly(lf.poly.map(([x, y]) => [x + dx, y + dy]), OUT);
    S.poly(lf.poly, (u, v, i, j, X, Y) => {
      let best = 0, bd = 1e9;
      for (let k = 0; k < sp.length; k++) { const d = (X - sp[k].x) ** 2 + (Y - sp[k].y) ** 2; if (d < bd) { bd = d; best = k; } }
      const s = sp[best], side = ((X - s.x) * s.px + (Y - s.y) * s.py) / Math.max(.3, s.hw), t = s.t;
      if (o.holes && t > .3 && t < .9) { const hk = Math.floor(t * 6), hc = hash(lf.seed, hk); if (hc > .4 && Math.abs(Math.abs(side) - .55) < .24 && Math.abs((t * 6) % 1 - .5) < .2 + .1 * hc) return null; }   // дірки монстери
      if (o.edge && Math.abs(side) > .72) return o.edge;                                                                                  // світлий кант (сансев'єра)
      let q = o.q0 + t * .2 - side * (o.hi ? .16 : -.1) + (Math.abs(side) > .8 ? -.12 : 0);
      if (o.bands) q += .14 * Math.sin(t * 18 + lf.seed) - .05;                                                                         // поперечні смуги
      if (o.cloud) q += .18 * hash(i >> 1, j >> 1) - .09 + (t < .35 ? .12 : 0);                                                            // хмарка бонсая: зерно
      if (o.vein && Math.abs(side) < .1 && t < .92) q += .22;                                                                             // центральна жилка
      if (o.vein && lf.kind !== 'blade' && Math.abs(side) > .12 && ((t * lf.len + Math.abs(side) * lf.w * .35) % 3.4) < .4) q += .09;     // бічні жилки
      if (o.variegate && Math.abs(side) < .4 && t > .25 && t < .8) q += .16;                                                              // світла середина (потос)
      if (o.tip && t > .78) return hash(i, j) > .3 ? (o.tip === 'pink' ? '#ff7af0' : '#5ae8ff') : hi;                                       // світні кінчики (неонова)
      if (o.rim && side < -.6 && (o.hi ? t > .15 : t > .6) && hash(i, j) > .35) return hash(j, i) > .55 ? '#7ad8ff' : '#a8ecff';         // холодний блік по краю
      return ramp(pal, q, i, j, .1);
    });
  }
  /** Гілка папороті: спина + листочки обабіч, коротші до кінчика. */
  function frond(S, base, ang, len, curl, pal, seed, q0) {
    const n = 18, pts = [];
    for (let k = 0; k <= n; k++) { const t = k / n, s = t * len, a = ang + curl * t * t * 1.6; pts.push({ x: base[0] + Math.sin(a) * s, y: base[1] - Math.cos(a) * s, a, t }); }
    for (let k = 1; k <= n; k++) S.line(pts[k - 1].x, pts[k - 1].y, pts[k].x, pts[k].y, OUT, 1.6);
    for (let k = 1; k <= n; k++) S.line(pts[k - 1].x, pts[k - 1].y, pts[k].x, pts[k].y, pal[2], .8);
    for (let k = 1; k < n; k++) { const p = pts[k], ll = len * .2 * Math.sin(Math.PI * Math.min(1, p.t * 1.1 + .08)) + .8;
      for (const side of [-1, 1]) fillLeaf(S, leaf([p.x, p.y], p.a + side * (1.05 + .2 * hash(seed, k)), ll, ll * .42, side * .25, 'blade', seed + k), pal, { q0: q0 + .1 * p.t, hi: side < 0, rim: side < 0 }); }
  }
  /** Рослина -> спрайт {cv, w, h, potTop, hang}. spec: {kind: monstera|fern|palm|sansevieria|vine|neon|bonsai, w, h,
   *  pot: navy|terra|chrome|glass|none, potW, potH, leaves, seed, hang, pal: green|light|sage|neon, neon: колір обідка} */
  function plant(sp) {
    const W = sp.w, H = sp.h, S = F.Sheet(0, 0, W, H), seed = sp.seed || 1, pot = sp.pot || 'navy', pw = sp.potW || W * .5, ph = sp.potH || H * .22;
    const potTop = sp.hang ? 0 : H - ph, cx = W / 2, pal = PALS[sp.pal] || (sp.kind === 'neon' ? PALS.neon : GREEN), n = sp.leaves || 7, k0 = sp.kind, items = [];
    if (k0 === 'vine') {                                                                                       // потос: пасма донизу, серцеподібні листки, частина — строкаті
      for (let s = 0; s < n; s++) { const x = W * (.1 + .8 * hash(seed, s)), len = H * (.45 + .55 * hash(seed, s + 9)), sw = (hash(seed, s + 3) - .5) * .5, pts = [];
        for (let k = 0; k <= 16; k++) { const t = k / 16; pts.push([x + Math.sin(t * 5 + s) * 3 * t + sw * len * t, t * len]); }
        for (let k = 1; k < pts.length; k++) S.line(pts[k - 1][0], pts[k - 1][1], pts[k][0], pts[k][1], OUT, 1.6);
        for (let k = 1; k < pts.length; k++) S.line(pts[k - 1][0], pts[k - 1][1], pts[k][0], pts[k][1], pal[3], .8);
        for (let k = 2; k < pts.length; k += 2) { const [lx, ly] = pts[k], side = (k + s) % 4 < 2 ? 1 : -1, sz = 3.6 + 2.6 * hash(seed, k * 7 + s);
          items.push({ y: ly, f: () => fillLeaf(S, leaf([lx, ly], side * (1.25 + .3 * hash(seed, k)) + .25, sz * 1.7, sz * 1.1, side * .35, 'heart', k + s * 31), pal, { q0: .42 + .15 * hash(seed, k + s), hi: side < 0, vein: 1, rim: 1, variegate: hash(seed, k * 3 + s) > .5 }) }); } }
    } else if (k0 === 'fern') {
      for (let k = 0; k < n; k++) { const u = n === 1 ? .5 : k / (n - 1), h2 = hash(seed, k + 17), ang = (u - .5) * 3.2 + (hash(seed, k) - .5) * .2, len = H * (.55 + .32 * h2) * (1 - Math.abs(u - .5) * .45);
        items.push({ y: -Math.abs(ang), f: () => frond(S, [cx + (u - .5) * W * .16, potTop + 2], ang, len, (.9 + .4 * h2) * (ang < 0 ? -1 : 1), pal, seed + k * 7, .4 + .15 * hash(seed, k + 5)) }); }
    } else if (k0 === 'bonsai') {                                                                              // стовбур з гілками, хмарки листя
      const tr = [[cx, potTop + 2], [cx - W * .06, potTop - H * .22], [cx + W * .08, potTop - H * .42], [cx - W * .04, potTop - H * .6]];
      for (let k = 1; k < tr.length; k++) S.line(tr[k - 1][0], tr[k - 1][1], tr[k][0], tr[k][1], OUT, 3.2);
      for (let k = 1; k < tr.length; k++) { S.line(tr[k - 1][0], tr[k - 1][1], tr[k][0], tr[k][1], '#6a3a1a', 1.8); S.line(tr[k - 1][0] - .4, tr[k - 1][1], tr[k][0] - .4, tr[k][1], '#9a5a2a', .6); }
      [[cx - W * .28, potTop - H * .3, W * .36, H * .17], [cx + W * .26, potTop - H * .46, W * .38, H * .18], [cx - W * .02, potTop - H * .68, W * .44, H * .2]].forEach(([x, y, w, h], k) => {
        S.line(x, y, tr[Math.min(k + 1, tr.length - 1)][0], tr[Math.min(k + 1, tr.length - 1)][1], '#6a3a1a', 1.2);
        items.push({ y, f: () => fillLeaf(S, leaf([x, y + h / 2], 0, h, w, 0, 'round', seed + k), pal, { q0: .34 + .1 * k, hi: 1, rim: 1, cloud: 1 }) }); });
    } else {
      for (let k = 0; k < n; k++) {
        const u = n === 1 ? .5 : k / (n - 1), h1 = hash(seed, k), h2 = hash(seed, k + 17);
        let ang, len, w, curl, kind, o;
        if (k0 === 'monstera') { ang = (u - .5) * 2.7 + (h1 - .5) * .3; len = H * (.5 + .28 * h2) * (1 - Math.abs(u - .5) * .5); w = W * (.3 + .12 * h1); curl = .5 + .3 * h2; kind = 'broad'; o = { holes: 1, vein: 1, rim: 1 }; }
        else if (k0 === 'palm') { ang = (u - .5) * 3 + (h1 - .5) * .2; len = H * (.6 + .28 * h2) * (1 - Math.abs(u - .5) * .3); w = W * .1; curl = 1.1 + .4 * h2; kind = 'blade'; o = { vein: 1, rim: 1 }; }
        else if (k0 === 'neon') { ang = (u - .5) * 2.2 + (h1 - .5) * .3; len = H * (.55 + .3 * h2) * (1 - Math.abs(u - .5) * .35); w = W * (.14 + .05 * h1); curl = .5 + .3 * h2; kind = 'blade'; o = { vein: 1, tip: k % 2 ? 'pink' : 'cyan' }; }
        else { ang = (u - .5) * 1 + (h1 - .5) * .25; len = H * (.5 + .35 * h2); w = W * (.14 + .05 * h1); curl = .12 * (h2 - .5); kind = 'blade'; o = { bands: 1, edge: '#d8d060', vein: 0 }; }   // сансев'єра
        if (k0 !== 'sansevieria') curl *= ang < 0 ? -1 : 1;
        const lf = leaf([cx + (u - .5) * W * .2, potTop + 2], ang, len, w, curl, kind, k * 3 + seed);
        items.push({ y: -Math.abs(ang) + (k0 === 'sansevieria' ? h2 : 0), f: () => fillLeaf(S, lf, pal, { q0: .38 + .18 * h1, hi: ang < 0, ...o }) });
      }
      if (k0 === 'palm') { S.rect(cx - 2, H * .35, cx + 2, potTop + 2, OUT); S.rect(cx - 1.4, H * .36, cx + 1.4, potTop + 2, (u, v, i, j) => ((v * 40) | 0) % 3 === 0 ? '#3a2210' : ramp(['#4a2a12', '#6a3e1c', '#8a5428'], .7 - u * .5, i, j)); }   // стовбур
    }
    items.sort((a, b) => a.y - b.y).forEach(it => it.f());                                                   // дальні (бічні/верхні) — перші, ближні — поверх
    if (pot !== 'none') {                                                                                      // горщик: navy (неоновий обідок) / terra / chrome / glass (ґрунт і LED видно)
      const px0 = cx - pw / 2, px1 = cx + pw / 2, pal2 = { terra: TERRA, chrome: CHROME, glass: ['#0a1e34', '#10304e', '#184668', '#245e84', '#3a7aa0', '#60a0c0'] }[pot] || POT, neon = sp.neon || (pot === 'terra' ? '#ffb070' : '#ff4fd8');
      S.rect(px0 + 1, potTop - 1.2, px1 - 1, potTop + 1.2, (u, v, i, j) => v < .5 ? '#1a0a2a' : ramp(['#2a1408', '#3a1c0c', '#4a2410'], .5 + hash(i, j) * .5, i, j));
      S.poly([[px0, potTop], [px1, potTop], [px1 - pw * .12, H - .5], [px0 + pw * .12, H - .5]], (u, v, i, j, X) => {
        const d = Math.min(v * ph, (1 - v) * ph), e = Math.min(X - (px0 + v * pw * .12), (px1 - v * pw * .12) - X);
        if (e < .5 || d < .4) return pot === 'glass' ? '#9ad8ff' : OUT;
        if (pot === 'glass') { if (v > .62 && v < .92) return ramp(['#2a1408', '#3a1c0c', '#4a2410', '#5a2c14'], .4 + hash(i, j) * .6, i, j); if (v >= .92) return '#5ae8ff'; return ramp(pal2, .5 - u * .35 + (Math.abs(u - .22) < .05 ? .35 : 0), i, j, .05); }
        if (v < .12) return neon; if (v < .2) return pal2[5]; if (v > .9) return pal2[0];
        return ramp(pal2, .7 - u * .5 - v * .15 + (Math.abs(u - .3) < .04 ? .2 : 0), i, j, .1);
      });
    }
    return { cv: S.canvas(), w: W, h: H, potTop, hang: !!sp.hang };
  }
  /** Малює спрайт рослини: смугами, верх гойдається (ліана — низ), shake — тап. */
  function sway(c, sp, x, y, t, ph = 0, shake = 0, s = 1) {
    const R = F.res(), U = .25, cv = F.fit(sp.cv, sp.w, sp.h, R), k = cv.width / sp.w;
    c.save(); c.imageSmoothingEnabled = R < 3.8;
    const top = sp.hang ? sp.h : sp.potTop, bands = Math.max(1, Math.round(top / 4)), bh = top / bands;
    for (let b = 0; b < bands; b++) {
      const v = sp.hang ? (b + .5) / bands : 1 - (b + .5) / bands, sw = (Math.sin(t * 1.1 + ph) * .5 + Math.sin(t * 2.3 + b * .4 + ph) * .2) * v * v * s + Math.sin(t * 18) * shake * v * 1.8;
      c.drawImage(cv, 0, b * bh * k, cv.width, bh * k + 1, x + sw, y + b * bh, sp.w, bh + 1 / k);
    }
    if (top < sp.h) c.drawImage(cv, 0, top * k, cv.width, (sp.h - top) * k, x, y + top, sp.w, sp.h - top);
    c.restore();
  }
  /** Тло голо-екрана (скло, скан-лінії). */
  function screenBg(c, w, h, t, a = .42) { c.clearRect(0, 0, w, h); const g = c.createLinearGradient(0, 0, 0, h); g.addColorStop(0, rgba('70,150,255', a)); g.addColorStop(1, rgba('30,90,230', a)); c.fillStyle = g; c.fillRect(0, 0, w, h); c.fillStyle = 'rgba(180,230,255,.08)'; for (let y = (t * 12 | 0) % 4; y < h; y += 4) c.fillRect(0, y, w, 1); c.fillStyle = 'rgba(255,255,255,.1)'; c.fillRect(0, 0, w, Math.round(h * .08)); }
  /** Напис вивіски: світиться, "дихає", вміщається в ширину. */
  function signText(c, key, cx, cy, maxW, t, col = '154,246,255') { const s = NX.t(key), sz = Math.min(8.2, maxW / s.length * 1.05), tc = rgba(col, .88 + .12 * Math.sin(t * 2.2)); P.text(c, s, cx + .4, cy + sz / 2 - .5, tc, sz, 'center'); P.text(c, s, cx, cy + sz / 2 - .5, tc, sz, 'center'); }
  // ---------- вивіска зони (єдиний стиль) ----------
  const ICON = {
    ai: ['..XXX..', '.XXXXX.', 'XX.X.XX', 'XXXXXXX', 'X.XXX.X', '.XX.XX.', '..X.X..'],
    chart: ['......X', '.....XX', '...X.XX', '..XX.XX', 'X.XX.XX', 'XXXX.XX', 'XXXXXXX'],
    target: ['..XXX..', '.X...X.', 'X..X..X', 'X.XXX.X', 'X..X..X', '.X...X.', '..XXX..'],
  };
  /** Вивіска: темна пластина з неоновим кантом кольору зони (acc[3]) і ореолом, кругла іконка зліва (ICON[o.icon]),
   *  напис NX.t(o.key) по центру (дихає), вогник-статус справа. c — контекст кімнати АБО пласке полотно екрана
   *  (x, y, w, h — у його одиницях); так три зони мають однакову вивіску. */
  function sign(c, x, y, w, h, o) {
    const t = o.t || 0, acc = o.acc, r = h * .24, lw = Math.max(.8, h * .07), ix = x + h * .62, iy = y + h / 2, ir = h * .3, RR = (X, Y, W2, H2, rr) => { c.beginPath(); c.roundRect ? c.roundRect(X, Y, W2, H2, rr) : c.rect(X, Y, W2, H2); };
    c.save();
    c.fillStyle = '#0a0620'; RR(x, y, w, h, r); c.fill();
    c.strokeStyle = acc[3]; c.lineWidth = lw; RR(x + lw / 2, y + lw / 2, w - lw, h - lw, r); c.stroke();
    c.strokeStyle = acc[1]; c.lineWidth = lw * .55; RR(x + lw * 1.9, y + lw * 1.9, w - lw * 3.8, h - lw * 3.8, r * .7); c.stroke();
    c.globalCompositeOperation = 'lighter'; c.strokeStyle = rgba(o.glow, .3 + .14 * Math.sin(t * 1.8)); c.lineWidth = lw * 2.4; RR(x, y, w, h, r); c.stroke(); c.globalCompositeOperation = 'source-over';
    c.strokeStyle = acc[3]; c.lineWidth = lw * .9; c.beginPath(); c.arc(ix, iy, ir, 0, 7); c.stroke(); c.fillStyle = '#06102e'; c.beginPath(); c.arc(ix, iy, ir - lw * .6, 0, 7); c.fill();
    const px = ir * 1.3 / 7; (ICON[o.icon] || ICON.ai).forEach((row, j) => [...row].forEach((ch, i) => ch === 'X' && lit(c, ix - 3.5 * px + i * px, iy - 3.5 * px + j * px, px + .05, px + .05, acc[3])));
    const s = NX.t(o.key), tx = x + h * 1.12, tw = w - h * 1.12 - h * .5, sz = Math.min(h * .42, tw / Math.max(1, s.length) * 1.1), tc = rgba(o.text || '154,246,255', .88 + .12 * Math.sin(t * 2.2));
    c.globalCompositeOperation = 'lighter'; P.glow(c, tx + tw / 2, iy, tw * .45, rgba(o.glow, .6), .12); c.globalCompositeOperation = 'source-over';
    P.text(c, s, tx + tw / 2 + sz * .04, iy + sz * .42, tc, sz, 'center'); P.text(c, s, tx + tw / 2, iy + sz * .42, tc, sz, 'center');
    lit(c, x + w - h * .36, iy - h * .08, h * .16, h * .16, Math.sin(t * 3 + x) > 0 ? '#3bff8a' : '#1f6a45');
    c.restore();
  }

  // ---------- гаджети на полички: статична частина — растр, живе — live(c, x, y, t) ----------
  const compose = (w, h, parts) => { const cv = document.createElement('canvas'); cv.width = w * 4; cv.height = h * 4; const x = cv.getContext('2d'); x.imageSmoothingEnabled = false; parts.forEach(([im, px, py]) => x.drawImage(im, px * 4, py * 4)); return cv; };
  function gadget(kind) {
    let W = 12, H = 14, S, cv, live = () => {};
    if (kind === 'holoCube') {                                                                                 // голо-куб: хромова база, над нею обертається каркас куба
      W = 14; H = 17; S = F.Sheet(0, 0, W, H);
      S.rr(1, H - 3.5, W - 1, H, 1, (d, u, v, i, j) => d < .4 ? OUT : v < .3 ? CHROME[4] : ramp(CHROME, .6 - v * .4, i, j)); S.rect(3, H - 3.3, W - 3, H - 2.5, '#3be8ff');
      live = (c, x, y, t) => { const cx = x + W / 2, cy = y + 6.5, a = t * .9, s = 3.8, V = []; for (let k = 0; k < 8; k++) { const vx = (k & 1 ? 1 : -1) * s, vy = (k & 2 ? 1 : -1) * s, vz = (k & 4 ? 1 : -1) * s, rx = vx * Math.cos(a) - vz * Math.sin(a), rz = vx * Math.sin(a) + vz * Math.cos(a); V.push([cx + rx, cy + vy * .8 + rz * .32]); }
        c.save(); c.globalCompositeOperation = 'lighter'; P.glow(c, cx, cy, 10, 'rgba(90,232,255,.8)', .28 + .08 * Math.sin(t * 3)); c.strokeStyle = 'rgba(120,236,255,.85)'; c.lineWidth = .5; c.beginPath();
        for (let k = 0; k < 8; k++) for (const m of [1, 2, 4]) { const n2 = k ^ m; if (n2 > k) { c.moveTo(V[k][0], V[k][1]); c.lineTo(V[n2][0], V[n2][1]); } } c.stroke(); c.fillStyle = '#ffffff'; V.forEach(([px, py]) => c.fillRect(px - .4, py - .4, .8, .8));
        c.fillStyle = rgba('90,232,255', .25 + .1 * Math.sin(t * 2)); c.beginPath(); c.moveTo(x + 3, y + H - 3); c.lineTo(x + W - 3, y + H - 3); c.lineTo(cx + 3, cy); c.lineTo(cx - 3, cy); c.fill(); c.restore(); };
    } else if (kind === 'orb') {                                                                               // куля-левітатор: рожева сфера ширяє над кільцем
      W = 12; H = 16; S = F.Sheet(0, 0, W, H);
      S.rr(1, H - 3, W - 1, H, 1.2, (d, u, v, i, j) => d < .4 ? OUT : d < 1 ? '#ff4fd8' : ramp(NAVY, .4 - v * .2, i, j));
      live = (c, x, y, t) => { const cx = x + W / 2, cy = y + 6 + Math.sin(t * 2) * 1.2, r = 3.6; c.save(); const g = c.createRadialGradient(cx - 1.2, cy - 1.2, .4, cx, cy, r); g.addColorStop(0, '#ffe0ff'); g.addColorStop(.45, '#ff5ae0'); g.addColorStop(1, '#4a1278'); c.fillStyle = g; c.beginPath(); c.arc(cx, cy, r, 0, 7); c.fill(); c.strokeStyle = OUT; c.lineWidth = .6; c.stroke();
        c.globalCompositeOperation = 'lighter'; P.glow(c, cx, cy, 9, 'rgba(255,90,224,.8)', .35); c.fillStyle = rgba('255,120,240', .45 + .2 * Math.sin(t * 4)); c.beginPath(); c.ellipse(cx, y + H - 2.2, 4.2, 1, 0, 0, 7); c.fill(); c.restore(); };
    } else if (kind === 'drone') {                                                                             // міні-дрон на стійці: гвинти крутяться, вогники блимають
      W = 20; H = 13; S = F.Sheet(0, 0, W, H);
      S.rr(7, H - 2, 13, H, .8, (d, u, v, i, j) => d < .3 ? OUT : ramp(CHROME, .6 - v * .4, i, j)); S.rect(9.4, H - 7, 10.6, H - 2, (u, v, i, j) => ramp(CHROME, .7 - Math.abs(u - .4), i, j));
      live = (c, x, y, t) => { const by = y + 4 + Math.sin(t * 3) * .5, cx = x + W / 2; c.save();
        lit(c, cx - 5, by, 10, 3, OUT); lit(c, cx - 4.4, by + .5, 8.8, 2, NAVY[4]); lit(c, cx - 2, by + 1, 4, 1, '#3be8ff');
        [[-8, -1], [8, -1]].forEach(([dx, dy], k) => { lit(c, cx + Math.min(dx, 0) - .2, by + 1.2, Math.abs(dx) + .2, .9, OUT); lit(c, cx + Math.min(dx, 0), by + 1.4, Math.abs(dx), .5, CHROME[3]);
          const a = t * 40 + k; c.strokeStyle = 'rgba(200,230,255,.55)'; c.lineWidth = .5; c.beginPath(); c.moveTo(cx + dx - Math.cos(a) * 3.2, by + dy + Math.sin(a) * .9); c.lineTo(cx + dx + Math.cos(a) * 3.2, by + dy - Math.sin(a) * .9); c.stroke();
          c.fillStyle = 'rgba(200,230,255,.18)'; c.beginPath(); c.ellipse(cx + dx, by + dy, 3.3, 1, 0, 0, 7); c.fill(); lit(c, cx + dx - .5, by + .3, 1, 1, (Math.floor(t * 4) + k) % 2 ? '#ff3b6a' : '#3bff8a'); });
        c.restore(); };
    } else if (kind === 'terrarium') {                                                                         // тераріум: скляний купол над неоновою рослиною, LED-основа
      W = 18; H = 20; S = F.Sheet(0, 0, W, H); const G = F.Sheet(0, 0, W, H);
      S.rr(1, H - 3.5, W - 1, H, 1, (d, u, v, i, j) => d < .4 ? OUT : v < .35 ? '#3be8ff' : ramp(NAVY, .45 - v * .3, i, j)); S.rect(2, H - 4.4, W - 2, H - 3.4, (u, v, i, j) => ramp(['#2a1408', '#3a1c0c', '#4a2410'], .4 + hash(i, j) * .6, i, j));
      const dome = [], cx = W / 2; for (let k = 0; k <= 20; k++) { const a = Math.PI * k / 20; dome.push([cx - Math.cos(a) * (W / 2 - 1.2), H - 4.4 - Math.sin(a) * (H - 6)]); }
      S.poly(dome, (u, v, i, j) => ramp(['#06142a', '#0a2040', '#102c54'], .5 - v * .3, i, j, .05));
      G.poly(dome, (u, v, i, j, X, Y) => { const dx = (X - cx) / (W / 2 - 1.2), dy = (Y - (H - 4.4)) / (H - 6), rr = Math.hypot(dx, dy); return rr > .9 ? (rr > .96 ? '#9ad8ff' : null) : (dx < -.45 && dy < -.3 && hash(i, j) > .55 ? '#9ad8ff' : null); });
      const pl = plant({ kind: 'neon', w: 12, h: 12, pot: 'none', leaves: 6, seed: 11, pal: 'neon' });
      cv = compose(W, H, [[S.canvas(null), 0, 0], [pl.cv, 3, H - 4.4 - 11], [G.canvas(null), 0, 0]]);
      live = (c, x, y, t) => { c.save(); c.globalCompositeOperation = 'lighter'; P.glow(c, x + W / 2, y + H - 7, 9, 'rgba(90,232,255,.9)', .22 + .08 * Math.sin(t * 2.5)); for (let k = 0; k < 3; k++) { const q = (t * .3 + k / 3) % 1; lit(c, x + 5 + k * 3 + Math.sin(q * 7 + k) * 1.5, y + H - 5 - q * 11, .7, .7, rgba('180,250,255', .8 * (1 - q))); } c.restore(); };
    } else if (kind === 'botToy') {                                                                            // мініатюрка робота: голова з візором, тіло з N, ніжки; очі блимають
      W = 10; H = 14; S = F.Sheet(0, 0, W, H);
      S.rr(2, 0, 8, 5, 1.2, (d, u, v, i, j) => d < .4 ? OUT : v > .3 && v < .72 ? '#06102e' : ramp(['#8a90b0', '#c8ccdd', '#eef2ff'], .8 - v * .5, i, j)); S.rect(4.7, -1, 5.3, 0, '#3be8ff');
      S.rr(2.5, 5.5, 7.5, 11, 1, (d, u, v, i, j) => d < .4 ? OUT : (u > .35 && u < .65 && v > .3 && v < .6) ? '#2a5cf0' : ramp(['#8a90b0', '#c8ccdd', '#eef2ff'], .75 - v * .4, i, j));
      S.rect(2.8, 11, 4.6, H, (u, v) => v > .8 ? OUT : '#3a4068'); S.rect(5.4, 11, 7.2, H, (u, v) => v > .8 ? OUT : '#3a4068'); S.rect(.8, 6, 2.5, 9.5, (u, v) => u < .25 ? OUT : '#b0b4cc'); S.rect(7.5, 6, 9.2, 9.5, (u, v) => u > .75 ? OUT : '#b0b4cc');
      live = (c, x, y, t) => { const open = Math.floor(t * .7 + x) % 5 !== 0; lit(c, x + 3.4, y + 2, 1.2, open ? 1.2 : .4, '#3be8ff'); lit(c, x + 5.6, y + 2, 1.2, open ? 1.2 : .4, '#3be8ff'); if (Math.sin(t * 5) > 0) lit(c, x + 4.6, y - 1.2, .9, .9, '#ff7af0'); };
    } else if (kind === 'speaker') {                                                                           // розумна колонка: циліндр з сіткою, LED-кільце міняє колір
      W = 8; H = 12; S = F.Sheet(0, 0, W, H);
      S.rr(.5, 0, W - .5, H, [2, 2, 1, 1], (d, u, v, i, j) => d < .4 ? OUT : v < .14 ? ramp(CHROME, .7 - u * .4, i, j) : (((i + j) & 1) && v > .25 && v < .9 && u > .12 && u < .88) ? NAVY[0] : ramp(NAVY, .5 - u * .3, i, j));
      live = (c, x, y, t) => { c.save(); c.globalCompositeOperation = 'lighter'; c.strokeStyle = `hsla(${(t * 60 + x) % 360},95%,65%,.9)`; c.lineWidth = .8; c.beginPath(); c.ellipse(x + W / 2, y + 1.4, W / 2 - .9, .9, 0, 0, 7); c.stroke(); P.glow(c, x + W / 2, y + 1.4, 5, `hsla(${(t * 60 + x) % 360},95%,65%,.8)`, .3); c.restore(); };
    }
    if (!cv) cv = S.canvas();
    return { w: W, h: H, cv, live };
  }
  // ---------- лампи: Едісона (скляна груша з ниткою), китайський ліхтар (червоний, з китицею) ----------
  function lamp(kind) {
    if (kind === 'chinese') {
      const W = 24, H = 50, S = F.Sheet(0, 0, W, H), RED = ['#5a0a10', '#8a1418', '#b82020', '#dc3030', '#f04a3a', '#ff7a5a'], GOLD = ['#6a4410', '#a8701c', '#e0a030', '#ffd468'];
      S.rect(11.4, 0, 12.6, 3, '#2a1208');                                                                       // шнур
      S.rr(8, 3, 16, 6, .8, (d, u, v, i, j) => d < .4 ? OUT : ramp(GOLD, .8 - v * .5, i, j));
      const body = []; for (let k = 0; k <= 28; k++) { const a = Math.PI * 2 * k / 28; body.push([12 + Math.cos(a) * 10.5, 19.5 + Math.sin(a) * 13.5]); }
      S.poly(body, (u, v, i, j, X, Y) => { const dx = (X - 12) / 10.5, dy = (Y - 19.5) / 13.5, rr = Math.hypot(dx, dy); if (rr > .95) return OUT;
        if (Math.abs(Math.sin(dx * 5.2)) > .93 && Math.abs(dx) < .9) return RED[1];                                                                    // ребра
        if (Math.abs(dy - .78) < .05 || Math.abs(dy + .78) < .05) return GOLD[2];                                                                     // золоті смуги
        return ramp(RED, .72 - Math.abs(dx + .25) * .55 - Math.abs(dy) * .25 + (hash(i, j) - .5) * .08, i, j); });
      S.rr(8, 32, 16, 35, .8, (d, u, v, i, j) => d < .4 ? OUT : ramp(GOLD, .8 - v * .5, i, j));
      for (let k = 0; k < 5; k++) S.line(11 + k * .5, 35, 10.5 + k * .6 + Math.sin(k) * .4, 46 + hash(k, 1) * 3, k === 2 ? RED[4] : RED[3], .5);   // китиця
      S.rr(10.4, 35, 13.6, 37.4, .6, (d) => d < .3 ? OUT : GOLD[3]);
      return { w: W, h: H, cv: S.canvas(), live: (c, x, y, t) => { c.save(); c.globalCompositeOperation = 'lighter'; P.glow(c, x + 12, y + 19.5, 30, 'rgba(255,90,60,.9)', .28 + .05 * Math.sin(t * 5 + x)); P.glow(c, x + 12, y + 19.5, 12, 'rgba(255,160,90,1)', .25); c.restore(); } };
    }
    const W = 10, H = 20, S = F.Sheet(0, 0, W, H);                                                              // Едісона
    S.rr(3, 0, 7, 4.5, [.5, .5, 1, 1], (d, u, v, i, j) => d < .4 ? OUT : ((v * 9) | 0) % 2 ? ramp(['#5a3a10', '#8a5a1a', '#c08a2a'], .6 - Math.abs(u - .4), i, j) : ramp(['#8a5a1a', '#c08a2a', '#e8b050'], .8 - Math.abs(u - .4), i, j));
    const bulb = []; for (let k = 0; k <= 24; k++) { const a = Math.PI * 2 * k / 24; bulb.push([5 + Math.cos(a) * 4.6, 12.5 + Math.sin(a) * 6.5]); } bulb[18] = [3.3, 4.5]; bulb[19] = [4.2, 4.3]; bulb[20] = [5, 4.2]; bulb[21] = [5.8, 4.3]; bulb[22] = [6.7, 4.5];
    S.poly(bulb, (u, v, i, j, X, Y) => { const dx = (X - 5) / 4.6, dy = (Y - 12.5) / 6.5, rr = Math.hypot(dx, dy); if (rr > .95 && Y > 6) return '#ffe8b0'; if (dx < -.5 && dy < -.2 && rr > .72) return '#fff4d8';
      return ramp(['#c86a1e', '#f0a03a', '#ffd06a', '#ffe9a6', '#fff8dc'], .9 - rr * .5 - Math.abs(dx) * .2, i, j); });
    for (let k = 0; k < 4; k++) S.line(3.6 + k * .9, 15 - (k % 2) * 4, 4.5 + k * .9, 11 + (k % 2) * 4, '#fffbe8', .5);                             // нитка
    return { w: W, h: H, cv: S.canvas(), live: (c, x, y, t) => { const f = .75 + .15 * Math.sin(t * 7 + x) + .08 * Math.sin(t * 13.7); c.save(); c.globalCompositeOperation = 'lighter'; P.glow(c, x + 5, y + 12, 26, 'rgba(255,190,90,.9)', .3 * f); P.glow(c, x + 5, y + 12, 8, 'rgba(255,230,160,1)', .45 * f); c.restore(); } };
  }

  // ---------- системний блок AI-ядра: скляна панель, за нею начинка ----------
  /** Геометрія блока в секції a..b столу (під плитою slab, до підлоги bot). */
  function coreGeom(a, b, slab, bot) {
    return { a, b, slab, bot, gx0: a + 3, gy0: slab + 3, gx1: b - 3, gy1: bot - 5.6, fans: [[a + 11, slab + 13, 6], [a + 11, slab + 27, 6], [a + 11, slab + 41, 6]],
      gpu: [a + 21, slab + 7, b - 5, slab + 18], ram: [a + 23, slab + 21, b - 6, slab + 31], cpu: [a + 21, slab + 34, a + 33, slab + 46], res: [a + 38, slab + 34, b - 6, slab + 47], strip: [a + 3, bot - 5, b - 3, bot - 2] };
  }
  function corePC(S, g) {
    const { gx0, gy0, gx1, gy1 } = g, PCB = ['#070a1e', '#0b1030', '#101842', '#162254'];
    S.rect(gx0, gy0, gx1, gy1, (u, v, i, j, X, Y) => (((X - gx0) % 6 < .5 && ((Y - gy0) | 0) % 3) || ((Y - gy0) % 7 < .5 && ((X - gx0) | 0) % 4 === 1)) ? PCB[3] : ramp(PCB, .35 - v * .2, i, j, .08));   // плата з доріжками
    g.fans.forEach(([fx, fy, fr]) => S.rr(fx - fr - 1, fy - fr - 1, fx + fr + 1, fy + fr + 1, fr + 1, (d, u, v, i, j, X, Y) => { const dd = Math.hypot(X - fx, Y - fy); return dd > fr + .5 ? OUT : dd > fr - .5 ? ramp(CHROME, .55 - v * .3, i, j) : dd < 1.6 ? CHROME[2] : '#03020c'; }));   // рамки вентиляторів
    const [ax, ay, bx, by] = g.gpu;
    S.rr(ax, ay, bx, by, 1, (d, u, v, i, j) => d < .4 ? OUT : v < .2 ? CHROME[3] : (u > .62 && ((u * 30) | 0) % 2) ? '#0a0e2a' : ramp(['#141a3a', '#1c2450', '#263066'], .6 - v * .3, i, j));   // GPU: корпус і ребра радіатора
    S.rr(ax + 2, ay + 3, ax + 12, by - 2, .8, (d, u, v, i, j) => d < .4 ? '#06102e' : '#0a1a44');                                                                   // вікно логотипа (світиться живим)
    const [rx0, ry0, rx1, ry1] = g.ram; for (let k = 0; k < 4; k++) { const x = rx0 + k * ((rx1 - rx0) / 4); S.rect(x, ry0, x + (rx1 - rx0) / 4 - 1.2, ry1, (u, v, i, j) => v > .85 ? ((u * 10) | 0) % 2 ? '#e0a030' : '#7a5010' : v < .18 ? '#06102e' : u < .1 || u > .9 ? OUT : ramp(['#0e1430', '#182048', '#222c60'], .5 - v * .3, i, j)); }   // пам'ять: контакти, LED-вікно
    const [cx0, cy0, cx1, cy1] = g.cpu; S.rr(cx0, cy0, cx1, cy1, 1, (d, u, v, i, j) => d < .4 ? OUT : d < 1.6 ? ramp(CHROME, .7 - v * .4, i, j) : d < 2.4 ? '#06102e' : '#0a2a4a');                                                  // водоблок процесора
    const [qx0, qy0, qx1, qy1] = g.res; S.rr(qx0, qy0, qx1, qy1, 1.5, (d, u, v, i, j) => d < .4 ? '#9ad8ff' : (u < .18 && v > .1 && v < .9) ? '#6ad0ff' : ramp(['#062040', '#0a3460', '#0e4a80'], .6 - v * .3, i, j, .06));         // резервуар з рідиною
    S.line((cx0 + cx1) / 2 + 2, cy0, (qx0 + qx1) / 2 - 3, qy0 - 1.5, OUT, 2.6); S.line((cx0 + cx1) / 2 + 2, cy0, (qx0 + qx1) / 2 - 3, qy0 - 1.5, '#0a4a6a', 1.4);                                     // трубки охолодження
    S.line(cx1, (cy0 + cy1) / 2, qx0, (qy0 + qy1) / 2, OUT, 2.6); S.line(cx1, (cy0 + cy1) / 2, qx0, (qy0 + qy1) / 2, '#0a4a6a', 1.4);
    [[gx0 + 3, gy1 - 2, gx0 + 9, gy1 - 7, '#ff4fd8'], [gx0 + 5, gy1 - 1.5, gx0 + 12, gy1 - 4, '#3be8ff'], [ax + 4, by, ax + 2, cy0 - 2, '#ffe27a']].forEach(([x0, y0, x1, y1, col]) => { S.line(x0, y0, x1, y1, OUT, 1.3); S.line(x0, y0, x1, y1, col, .5); });   // кабелі
    S.rect(gx0, gy0, gx1, gy1, (u, v, i, j) => (Math.abs(u + v * .6 - .55) < .04) ? '#2a4a7a' : (Math.abs(u + v * .6 - .66) < .015) ? '#3a5a8a' : null);                                                       // відблиск скла
    S.rr(gx0 - .6, gy0 - .6, gx1 + .6, gy1 + .6, 1, (d) => d < .6 ? '#6ab0e0' : null);                                                                                                                     // кант скла
    const [sx0, sy0, sx1, sy1] = g.strip; S.rect(sx0, sy0, sx1, sy1, (u, v) => v < .2 || v > .8 ? OUT : '#06102e');                                                                                      // передня смужка-дисплей
  }
  /** Живе в блоці: вентилятори (RGB, швидше коли Nexi працює), логотип N, LED пам'яті, процесор, потік рідини, бульбашки, дисплей. */
  function coreLive(c, g, t, act) {
    const sp = 4 + act * 14; c.save(); c.globalCompositeOperation = 'lighter';
    g.fans.forEach(([fx, fy, fr], n) => { const hue = (t * 70 + n * 120) % 360; P.glow(c, fx, fy, fr * 1.8, `hsla(${hue},95%,62%,.8)`, .18 + act * .2);
      for (let bl = 0; bl < 7; bl++) { const a = t * sp + bl * Math.PI * 2 / 7 + n; c.strokeStyle = `hsla(${hue},95%,70%,.75)`; c.lineWidth = 1.1; c.beginPath(); c.moveTo(fx + Math.cos(a) * 1.6, fy + Math.sin(a) * 1.6); c.quadraticCurveTo(fx + Math.cos(a + .5) * (fr - 1.6), fy + Math.sin(a + .5) * (fr - 1.6), fx + Math.cos(a + .9) * (fr - .6), fy + Math.sin(a + .9) * (fr - .6)); c.stroke(); }
      c.strokeStyle = `hsla(${hue},95%,70%,.9)`; c.lineWidth = .7; c.beginPath(); c.arc(fx, fy, fr + .1, 0, 7); c.stroke(); });
    const [ax, ay] = g.gpu; P.text(c, 'N', ax + 7, ay + 10.6, rgba('59,232,255', .8 + .2 * Math.sin(t * 2)), 7, 'center'); P.glow(c, ax + 7, ay + 7.5, 7, 'rgba(59,232,255,.8)', .25 + act * .2);
    for (let k = 0; k < 3; k++) lit(c, ax + 15 + k * 3, ay + 1.6, 1.4, 1.2, hash(k, Math.floor(t * (3 + act * 6))) > .5 ? ['#3bff8a', '#ffe27a', '#ff7af0'][k] : '#102040');
    const [rx0, ry0, rx1] = g.ram; for (let k = 0; k < 4; k++) { const x = rx0 + k * ((rx1 - rx0) / 4); lit(c, x + .5, ry0 + .4, (rx1 - rx0) / 4 - 2.2, 1.2, `hsla(${(t * 90 + k * 40) % 360},95%,65%,.9)`); }
    const [cx0, cy0, cx1, cy1] = g.cpu; P.glow(c, (cx0 + cx1) / 2, (cy0 + cy1) / 2, 6, 'rgba(90,232,255,.9)', .3 + .12 * Math.sin(t * 4) + act * .3); lit(c, (cx0 + cx1) / 2 - 1.5, (cy0 + cy1) / 2 - 1.5, 3, 3, rgba('180,250,255', .6 + .3 * Math.sin(t * 4)));
    const [qx0, qy0, qx1, qy1] = g.res; for (let k = 0; k < 4; k++) { const q = (t * .35 + k * .25) % 1; lit(c, qx0 + 2 + ((k * 2.3) % (qx1 - qx0 - 4)), qy1 - 1.5 - q * (qy1 - qy0 - 3), .8, .8, rgba('180,240,255', .8 * (1 - q))); }   // бульбашки
    const tubes = [[(cx0 + cx1) / 2 + 2, cy0, (qx0 + qx1) / 2 - 3, qy0 - 1.5], [cx1, (cy0 + cy1) / 2, qx0, (qy0 + qy1) / 2]];
    tubes.forEach(([x0, y0, x1, y1], n) => { for (let k = 0; k < 3; k++) { const q = ((t * (.5 + act) + k / 3 + n * .5) % 1), x = x0 + (x1 - x0) * q, y = y0 + (y1 - y0) * q; lit(c, x - .6, y - .6, 1.2, 1.2, '#5ae8ff'); } });   // потік рідини
    c.globalCompositeOperation = 'source-over';
    const [sx0, sy0, sx1, sy1] = g.strip, load = act ? .7 + .25 * Math.sin(t * 3) : .35 + .2 * Math.sin(t * .8); P.text(c, 'CORE ' + Math.round(load * 100) + '%', sx0 + 1.5, sy1 - .7, '#3be8ff', 2.2); lit(c, sx0 + 20, sy0 + .9, (sx1 - sx0 - 22) , 1.2, '#0a1a3a'); lit(c, sx0 + 20, sy0 + .9, (sx1 - sx0 - 22) * load, 1.2, act ? '#3bff8a' : '#3be8ff');
    c.restore();
  }

  const draw = (c, S, R) => { const w = S.x1 - S.x0, h = S.y1 - S.y0; c.imageSmoothingEnabled = R < 3.8; c.drawImage(F.fit(S.cv, w, h, R), S.x0, S.y0, w, h); };
  return { BRK, SLAB, GREEN, POT, brick, booth, desk, plant, sway, sign, gadget, lamp, coreGeom, corePC, coreLive, screenBg, signText, noise, rgba, lit, mix, draw, reflectors: [] };
})();

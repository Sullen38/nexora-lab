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
 *   plant(spec)                — рослина піксель-артом (монстера, папороть, пальма,
 *                                сансев'єра, ліана) у горщику кімнати -> спрайт
 *   sway(c, sp, x, y, t, ph, shake) — малює спрайт рослини: верх гойдається, горщик стоїть
 *   screenBg / noise / rgba / lit    — дрібниці для живих екранів
 * Координати — одиниці кімнати; растри — 4 px/од. (NX.furn.Sheet).
 * ========================================================================== */
NX.kit = (() => {
  const P = NX.px, F = NX.furn, { NAVY, PINK, CYAN, HOLO, DESK, LIL, CHROME, OUT } = F.PAL, ramp = F.ramp, hash = NX.art.hash;
  const BRK = ['#0c0719', '#150b28', '#1e1138', '#28174a', '#341d5c', '#42256e', '#542f86', '#6a3c9a'];
  const SLAB = ['#3a0e5b', '#4d0d6e', '#5b0775', '#6d058a', '#850498', '#ac14b9', '#b317bd', '#cb53cb', '#e07ae0'];
  const GREEN = ['#07201a', '#0b3026', '#124634', '#1a6044', '#237c54', '#2f9a64', '#45bc7a', '#7fe09a'];
  const GREEN2 = ['#0a2a1e', '#12402c', '#1c5a3a', '#2a7a4a', '#3c9c5a', '#5cc070', '#9ae08a'];
  const SAGE = ['#13332c', '#1e4a3e', '#2b6652', '#3d8a66', '#58ac7e', '#86cc9a'];
  const POT = ['#0d0828', '#1a1046', '#2a1860', '#3b2480', '#4f31a0', '#6a48c0'];
  const TERRA = ['#2a1208', '#4a2010', '#6e3418', '#8e4a22', '#b06430', '#d08a4a'];
  const rgba = (rgb, a) => `rgba(${rgb},${P.clamp(a, 0, 1)})`, lit = (c, x, y, w, h, col) => { c.fillStyle = col; c.fillRect(x, y, w, h); };
  const noise = (t, i) => .5 + .26 * Math.sin(t * 1.3 + i * 1.7) + .16 * Math.sin(t * 2.9 + i * 3.1) + .08 * Math.sin(t * 5.3 + i * .7);
  const mix = (a, b, k) => { if (k <= 0) return a; if (k >= 1) return b; const A = [1, 3, 5].map(i => parseInt(a.slice(i, i + 2), 16)), B = [1, 3, 5].map(i => parseInt(b.slice(i, i + 2), 16)); return '#' + A.map((v, i) => Math.round(v + (B[i] - v) * k).toString(16).padStart(2, '0')).join(''); };

  /** Цегла: box = [x0,y0,x1,y1]; lights = [{x,y,r,k,warm}] — відсвіти (теплі — помаранчеві, холодні — сині). */
  function brick(S, [x0, y0, x1, y1], lights = []) {
    S.rect(x0, y0, x1, y1, (u, v, i, j, X, Y) => {
      const row = Math.floor(Y / 7), bx = (((X + (row & 1) * 7) % 14) + 14) % 14, by = ((Y % 7) + 7) % 7;
      if (bx < .8 || by < .6) return '#08041a';
      const id = Math.floor((X + (row & 1) * 7) / 14) * 31 + row;
      let q = .24 + hash(id, 7) * .22 + (by < 1.4 ? .12 : by > 6.2 ? -.08 : 0) + (bx < 1.6 ? .05 : 0), warm = 0;
      for (const L of lights) { const d = Math.max(0, 1 - Math.hypot(X - L.x, Y - L.y) / L.r); q += d * d * L.k; if (L.warm) warm += d * d * L.k; }
      const col = ramp(BRK, q, i, j, .25); return warm > .08 ? mix(col, '#8a4a2a', Math.min(.55, warm)) : col;
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
    const [sx0, sy0, sx1, sy1] = sp.sign;                                                                     // вивіска
    S.rr(sx0, sy0, sx1, sy1, 4.5, (d, u, v, i, j) => d < .6 ? acc[1] : d < 1.5 ? acc[3] : d < 2.2 ? '#0a0520' : d < 2.8 && v < .5 ? NAVY[5] : ramp(['#0a0624', '#100a34', '#170f44', '#1e1454'], .75 - v * .5, i, j));
    const [ix, iy] = sp.icon; S.rr(ix - 7, iy - 7, ix + 7, iy + 7, 7, (d) => d < 1.3 ? acc[3] : d < 1.9 ? acc[1] : '#0a0520');
    if (sp.iconKind === 'target') { for (const [rr, col] of [[4.6, acc[3]], [3.2, '#0a0520'], [1.9, acc[3]], [.9, '#ffffff']]) S.rr(ix - rr, iy - rr, ix + rr, iy + rr, rr, col); }
    else { S.poly([[ix, iy - 4.4], [ix + 2.6, iy + .4], [ix - 2.6, iy + .4]], acc[3]); S.rr(ix - 2.8, iy - 1, ix + 2.8, iy + 4.2, 2.8, acc[3]); S.rr(ix - 1.2, iy + .4, ix + .4, iy + 2.2, .9, '#0a0520'); }   // крапля
    const scr = sp.screens, nx0 = Math.min(...scr.map(s => s[0])) - 4, ny0 = Math.min(...scr.map(s => s[1])) - 4, nx1 = Math.max(...scr.map(s => s[2])) + 4, ny1 = Math.max(...scr.map(s => s[3])) + 4;
    S.rr(nx0, ny0, nx1, ny1, 2, (d, u, v, i, j) => d < .7 ? NAVY[0] : ramp(NAVY, .14, i, j));                // ніша
    for (const [a, b, c2, e] of scr) S.rr(a - 1.5, b - 1.5, c2 + 1.5, e + 1.5, 2, (d, u, v, i, j) => d < .7 ? acc[1] : d < 1.5 ? acc[3] : ramp(HOLO, .55 - v * .3, i, j));   // рамки екранів
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
        if (Math.abs(Y - cy) < 1 && Math.abs(X - (a + b) / 2) < (b - a) * .3) return Math.abs(Y - cy) < .4 ? '#000006' : NV[1];     // ручка-паз
        if (Math.abs(Y - cy + 1.5) < .4 && Math.abs(X - (a + b) / 2) < (b - a) * .3) return NV[6];
        return ramp(NV, .78 - dv / (q - p) * .35 + (1 - du / (b - a)) * .1, i, j, .12);
      }
      if (s.kind === 'core') {                                                                                 // шафка AI-ядра: вентилятор + решітка
        const [fx, fy, fr] = s.fan, fd = Math.hypot(X - fx, Y - fy);
        if (fd < fr + .9) return fd > fr + .1 ? o : fd > fr - .9 ? CHROME[3] : '#03020c';
        if (Y > bot - 20 && Y < bot - 7 && X > a + 3 && X < b - 3) return ((Y - bot) % 2.4 + 2.4) % 2.4 < .8 ? '#05021a' : NV[4];
        if (X > b - 6 && X < b - 3 && Y > slab + 5 && Y < slab + 19) return '#020210';
        return ramp(NV, .6 - d * .3 + (du < 1.5 ? .2 : 0), i, j, .12);
      }
      // опора: хромована рама (дві стійки + перекладини), всередині неонова трубка
      const cx = (a + b) / 2, hw = (b - a) / 2, st = Math.abs(X - cx) > hw - 4.5, tube = Math.abs(X - cx) < 1.6, mid = (slab + bot) / 2, bar = Math.abs(Y - mid + 8) < 1.7 || Math.abs(Y - mid - 8) < 1.7;
      if (st) return ramp(CHROME, .8 - Math.abs(Math.abs(X - cx) - (hw - 2.2)) * .35 - d * .3, i, j);
      if (bar) return ramp(CHROME, .7 - d * .2, i, j);
      if (tube) return Math.abs(X - cx) < .7 ? '#dff8ff' : '#3be8ff';
      return null;
    });
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

  // ---------- рослини ----------
  /** Листок: спина від base під кутом ang (рад, 0 = вгору), довжина len, ширина w; curl — як загинається донизу.
   *  Повертає многокутник. kind: 'broad' (монстера/фікус), 'frond' (папороть), 'blade' (пальма/сансев'єра), 'heart'. */
  function leafPoly(base, ang, len, w, curl, kind, seed) {
    const L = [], R = [], n = 14;
    for (let k = 0; k <= n; k++) {
      const t = k / n, s = t * len, a = ang + curl * t * t * 1.6, x = base[0] + Math.sin(a) * s, y = base[1] - Math.cos(a) * s;
      let ww = kind === 'blade' ? w * (t < .15 ? t / .15 : 1 - Math.pow((t - .15) / .85, 2.2)) : kind === 'frond' ? w * Math.sin(Math.PI * Math.min(1, t * 1.05)) * (.7 + .3 * Math.abs(Math.sin(t * 28 + seed))) : kind === 'heart' ? w * (t < .25 ? Math.sqrt(t / .25) : 1 - Math.pow((t - .25) / .75, 1.8)) : w * Math.sin(Math.PI * Math.pow(t, .8));
      if (kind === 'broad' && t > .3 && t < .9 && Math.abs(Math.sin(t * 19 + seed)) > .82) ww *= .55;            // вирізи монстери
      const px = Math.cos(a), py = Math.sin(a);
      L.push([x - px * ww / 2, y - py * ww / 2]); R.push([x + px * ww / 2, y + py * ww / 2]);
    }
    return L.concat(R.reverse());
  }
  /** Рослина -> спрайт {cv, x0, y0, w, h, potTop}. spec: {kind, w, h, pot:'navy'|'terra'|'none', potW, potH, leaves, seed, hang} */
  function plant(sp) {
    const W = sp.w, H = sp.h, S = F.Sheet(0, 0, W, H), seed = sp.seed || 1, pot = sp.pot || 'navy', pw = sp.potW || W * .5, ph = sp.potH || H * .22;
    const potTop = sp.hang ? 0 : H - ph, cx = W / 2, pal = sp.pal === 'sage' ? SAGE : sp.pal === 'light' ? GREEN2 : GREEN;
    const leaves = [];
    const n = sp.leaves || 7;
    if (sp.kind === 'vine') {                                                                                  // ліана: кілька пасм донизу з парними листочками
      const strands = sp.leaves || 4;
      for (let s = 0; s < strands; s++) { const x = W * (.12 + .76 * hash(seed, s)), len = H * (.5 + .5 * hash(seed, s + 9)), sw = (hash(seed, s + 3) - .5) * .5;
        const pts = []; for (let k = 0; k <= 16; k++) { const t = k / 16; pts.push([x + Math.sin(t * 5 + s) * 3 * t + sw * len * t, t * len]); }
        for (let k = 1; k < pts.length; k++) S.line(pts[k - 1][0], pts[k - 1][1], pts[k][0], pts[k][1], pal[2], 1.1);
        for (let k = 2; k < pts.length; k += 2) { const [lx, ly] = pts[k], side = k % 4 ? 1 : -1, sz = 3.2 + 2 * hash(seed, k * 7 + s); leaves.push({ poly: leafPoly([lx, ly], side * (1.2 + .3 * hash(seed, k)), sz * 1.8, sz, .3, 'heart', k), hi: side > 0 }); } }
    } else {
      for (let k = 0; k < n; k++) {
        const u = n === 1 ? .5 : k / (n - 1), h1 = hash(seed, k), h2 = hash(seed, k + 17);
        let ang, len, w, curl, kind;
        if (sp.kind === 'monstera') { ang = (u - .5) * 2.6 + (h1 - .5) * .3; len = H * (.5 + .25 * h2) * (1 - Math.abs(u - .5) * .5); w = W * (.26 + .1 * h1); curl = .55 + .3 * h2; kind = 'broad'; }
        else if (sp.kind === 'fern') { ang = (u - .5) * 3.1 + (h1 - .5) * .2; len = H * (.55 + .3 * h2) * (1 - Math.abs(u - .5) * .4); w = W * .14; curl = .9 + .4 * h2; kind = 'frond'; }
        else if (sp.kind === 'palm') { ang = (u - .5) * 2.9 + (h1 - .5) * .2; len = H * (.6 + .25 * h2) * (1 - Math.abs(u - .5) * .3); w = W * .09; curl = 1.1 + .4 * h2; kind = 'blade'; }
        else { ang = (u - .5) * .9 + (h1 - .5) * .25; len = H * (.5 + .3 * h2); w = W * (.13 + .04 * h1); curl = .15 * (h2 - .5); kind = 'blade'; }   // sansevieria
        if (sp.kind !== 'sansevieria') curl *= ang < 0 ? -1 : 1;                                                                            // загинається назовні й донизу
        leaves.push({ poly: leafPoly([cx + (u - .5) * W * .2, potTop + 2], ang, len, w, curl, kind, k * 3 + seed), hi: ang < 0, u, k, kind });
      }
      if (sp.kind === 'palm') S.rect(cx - 1.4, H * .35, cx + 1.4, potTop + 2, (u, v, i, j) => ramp(['#3a2210', '#5a3418', '#7a4a22'], .7 - u * .5, i, j));   // стовбур
    }
    leaves.sort((a, b) => (a.poly[0][1] - b.poly[0][1]) || 0);
    leaves.forEach((lf, idx) => {
      const ys = lf.poly.map(p => p[1]), y0 = Math.min(...ys), y1 = Math.max(...ys), xs = lf.poly.map(p => p[0]), x0 = Math.min(...xs), x1 = Math.max(...xs);
      S.poly(lf.poly, (u, v, i, j, X, Y) => {
        const side = (X - (x0 + x1) / 2) / Math.max(1, x1 - x0), t = (Y - y0) / Math.max(1, y1 - y0);
        let q = .55 - t * .25 + (lf.hi ? .12 : -.08) - side * .18 + hash(idx, 3) * .12;
        if (sp.kind === 'sansevieria') { q = .45 + .3 * Math.sin(side * 9 + idx) - t * .1; if (Math.abs(side) > .38) return '#c8d860'; }    // світлий кант сансев'єри
        if (lf.kind === 'blade' && sp.kind === 'palm' && Math.abs(side) < .06) q += .25;                                                   // жилка
        if (lf.kind === 'broad' && Math.abs(side) < .05) q += .2;
        const col = ramp(pal, q, i, j, .14);
        return (lf.hi && t < .3 && side < -.2 && hash(i, j) > .6) ? '#6ad0ff' : col;                                                       // холодний блік зверху
      });
    });
    if (pot !== 'none') {                                                                                      // горщик кімнати: тьмяний корпус, неоновий обідок, ґрунт
      const px0 = cx - pw / 2, px1 = cx + pw / 2, pal2 = pot === 'terra' ? TERRA : POT, neon = pot === 'terra' ? '#ffb070' : (sp.neon || '#ff4fd8');
      S.rect(px0 + 1, potTop - 1.2, px1 - 1, potTop + 1.2, (u, v, i, j) => v < .5 ? '#1a0a2a' : ramp(['#2a1408', '#3a1c0c', '#4a2410'], .5 + hash(i, j) * .5, i, j));   // ґрунт
      S.poly([[px0, potTop], [px1, potTop], [px1 - pw * .12, H - .5], [px0 + pw * .12, H - .5]], (u, v, i, j, X) => {
        const d = Math.min(v * ph, (1 - v) * ph), e = Math.min(X - (px0 + v * pw * .12), (px1 - v * pw * .12) - X);
        if (e < .5 || d < .4) return OUT; if (v < .12) return neon; if (v < .2) return pal2[5]; if (v > .9) return pal2[0];
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
  function screenBg(c, w, h, t, a = .18) { c.clearRect(0, 0, w, h); c.fillStyle = rgba('40,110,255', a); c.fillRect(0, 0, w, h); c.fillStyle = 'rgba(160,220,255,.07)'; for (let y = (t * 12 | 0) % 4; y < h; y += 4) c.fillRect(0, y, w, 1); }
  /** Напис вивіски: світиться, "дихає", вміщається в ширину. */
  function signText(c, key, cx, cy, maxW, t, col = '154,246,255') { const s = NX.t(key), sz = Math.min(8.2, maxW / s.length * 1.05), tc = rgba(col, .88 + .12 * Math.sin(t * 2.2)); P.text(c, s, cx + .4, cy + sz / 2 - .5, tc, sz, 'center'); P.text(c, s, cx, cy + sz / 2 - .5, tc, sz, 'center'); }
  const draw = (c, S, R) => { const w = S.x1 - S.x0, h = S.y1 - S.y0; c.imageSmoothingEnabled = R < 3.8; c.drawImage(F.fit(S.cv, w, h, R), S.x0, S.y0, w, h); };
  return { BRK, SLAB, GREEN, POT, brick, booth, desk, plant, sway, screenBg, signText, noise, rgba, lit, mix, draw, reflectors: [] };
})();

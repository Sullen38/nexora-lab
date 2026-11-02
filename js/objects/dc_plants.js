/* ============================================================================
 * objects/dc_plants.js — РОСЛИНИ ДЕКОРУ СТІН (NX.arc.dcPlant): піксель-арт кодом, спрайт над 3D-вазоном
 * ----------------------------------------------------------------------------
 * Власник (02.11): «Nexi в нас ботанік — рослини цікаві й різні (не однакові вазони — кактуси, ліани, світні, хижі, у
 * колбах…)». Вазон — справжній 3D-циліндр (objects/dc_paint.js), а листя — плаский спрайт лицем до глядача над ним (рослини
 * майже однакові з усіх боків). Рослини v3 з 28.10 (монстера, папороть, арека, сансев'єра, ліана, неонова, бонсай: листки
 * зі спиною, розрізи монстери, пір'ясті вайї, АВТОПІДГОНКА — жоден листок не обрізаний; коміт a941612, wing_kit.js) +
 * нові: кактуси (колона з «руками» й квіткою, куля з ребрами), ехеверія, венерина мухоловка, непентес з глечиками, світні
 * гриби, зелень гідропоніки (базилік, салат, полуниця).
 *   NX.arc.dcPlant(spec) -> {d: Uint32Array (як ImageData, ABGR), sw, sh — пікселі, W, H — одиниці світу, U}
 *     spec: {kind, w, h, seed, pal: green|light|sage|neon, hang — звисає (база вгорі), leaves}
 *   Кеш — за видом, розміром і зерном (ті самі рослини після зміни мови не будуються вдруге).
 * Контур навколо всієї рослини дає рушій (outline шару «біля стіни»), жилки й контури листків — тут.
 * ========================================================================== */
NX.arc = NX.arc || {};
(() => {
  const P = NX.px, F = NX.furn, hash = NX.art.hash, ramp = F.ramp, OUT = F.PAL.OUT;
  const GREEN = ['#04140f', '#07241a', '#0c3626', '#124a34', '#1a6244', '#237e56', '#2f9c66', '#48bc7a'];
  const GREEN2 = ['#06201a', '#0c3224', '#164a34', '#1f6644', '#2c8656', '#3fa868', '#66c884'];
  const SAGE = ['#13332c', '#1e4a3e', '#2b6652', '#3d8a66', '#58ac7e', '#86cc9a'];
  const NEONP = ['#061a2a', '#0a2e44', '#104a62', '#187086', '#2498a8', '#34c0c8', '#5ae8ff', '#b0f8ff'];
  const CACT = ['#06201c', '#0b3229', '#124637', '#1b5c46', '#267656', '#349066', '#4aac7a', '#72cc96'];
  const SUCC = ['#1a2c3a', '#25404e', '#335a66', '#457a80', '#5c9a98', '#7cbab0', '#a6d8c8'];
  const RED = ['#2a0410', '#4a0818', '#6e1020', '#961a2a', '#c02a36', '#e4464a', '#ff7a6a'];
  const PALS = { green: GREEN, light: GREEN2, sage: SAGE, neon: NEONP };
  const U = .25;                                                                       // 4 px на одиницю світу (растр шару — 3)

  // ---------- листок (рослини v3, 28.10) ----------
  /** Листок: спина від base під кутом ang (0 = вгору, + = праворуч), довжина len, ширина w, curl — загин.
   *  kind: blade (вузький), heart (потос), round (хмарка бонсая), mon (монстера), broad. -> {poly, sp} — контур і спина. */
  function leaf(base, ang, len, w, curl, kind, seed) {
    const L = [], R = [], sp = [], n = kind === 'mon' ? 26 : 16;
    for (let k = 0; k <= n; k++) {
      const t = k / n, s = t * len, a = ang + curl * t * t * 1.6, x = base[0] + Math.sin(a) * s, y = base[1] - Math.cos(a) * s;
      let ww = kind === 'blade' ? w * (t < .15 ? t / .15 : 1 - Math.pow((t - .15) / .85, 2.2))
        : kind === 'heart' ? w * (t < .22 ? Math.sqrt(t / .22) : 1 - Math.pow((t - .22) / .78, 1.7))
        : kind === 'round' ? w * Math.sqrt(Math.max(0, 1 - Math.pow(2 * t - 1, 2))) * (.86 + .14 * Math.abs(Math.sin(t * 23 + seed)))
        : kind === 'mon' ? w * (t < .38 ? .6 + .4 * Math.sin(t / .38 * Math.PI / 2) : Math.cos((t - .38) / .62 * Math.PI / 2) ** .75)
        : w * Math.sin(Math.PI * Math.pow(t, .75));
      if (kind === 'blade' && t > .1) ww *= .86 + .14 * Math.abs(Math.sin(t * 40 + seed));
      const px = Math.cos(a), py = Math.sin(a);
      L.push([x - px * ww / 2, y - py * ww / 2]); R.push([x + px * ww / 2, y + py * ww / 2]); sp.push({ x, y, px, py, hw: ww / 2, t });
    }
    return { poly: L.concat(R.reverse()), sp, len, w, kind, seed };
  }
  function mapLeaf(lf, M) {
    const { kx, ky, ax, ay, dy } = M, X = x => ax + (x - ax) * kx, Y = y => ay + (y - ay) * ky + dy;
    lf.poly = lf.poly.map(([x, y]) => [X(x), Y(y)]);
    lf.sp = lf.sp.map(q => { const vx = q.px * kx, vy = q.py * ky, l = Math.hypot(vx, vy) || 1; return { x: X(q.x), y: Y(q.y), px: vx / l, py: vy / l, hw: q.hw * l, t: q.t }; });
    const g = Math.sqrt(kx * ky); lf.len *= g; lf.w *= g; return lf;
  }
  /** Заливка листка: тон за положенням на спині, жилки, блік, кант; монстера — розрізи й дірки наскрізь. */
  function fillLeaf(S, lf, pal, o) {
    const sp = lf.sp, hi = pal[pal.length - 1], W = S.W, H = S.H, idx = [], cols = [];
    const st = S.stamp || (S.stamp = new Int32Array(W * H)), id = S.leafId = (S.leafId || 0) + 1;
    S.poly(lf.poly, (u, v, i, j, X, Y) => {
      let best = 0, bd = 1e9;
      for (let k = 0; k < sp.length; k++) { const d = (X - sp[k].x) ** 2 + (Y - sp[k].y) ** 2; if (d < bd) { bd = d; best = k; } }
      const s = sp[best], side = ((X - s.x) * s.px + (Y - s.y) * s.py) / Math.max(.3, s.hw), t = s.t, as = Math.abs(side);
      let q = o.q0 + t * .2 - side * (o.hi ? .16 : -.1) + (as > .8 ? -.12 : 0), vein = false;
      if (o.mon) {
        if (t < .1 && as < .26 * (1 - t / .1)) return null;
        for (let k = 0; k < 4; k++) {
          const tk = .25 + k * .16 + (hash(lf.seed, k + (side > 0 ? 9 : 0)) - .5) * .05, tc = tk + (as - .36) * .16;
          if (as > .36 && Math.abs(t - tc) < .022 + (as - .36) * .03) return null;
          if (hash(lf.seed, k * 3 + (side > 0 ? 5 : 2)) > .42 && ((t - tk - .075) / .03) ** 2 + ((as - .19) / .075) ** 2 < 1) return null;
          if (as > .1 && Math.abs(t - tc - .075) < .012) vein = true;
        }
        if (side * (o.hi ? 1 : -1) < -.25 && side * (o.hi ? 1 : -1) > -.48 && t > .2 && t < .72) q += .1;
      }
      if (o.edge && as > .72) return o.edge;
      if (o.bands) q += .14 * Math.sin(t * 18 + lf.seed) - .05;
      if (o.cloud) q += .18 * hash(i >> 1, j >> 1) - .09 + (t < .35 ? .12 : 0);
      if (o.vein && as < .1 && t < .92) q += .22;
      if (o.vein && !o.mon && lf.kind !== 'blade' && as > .12 && ((t * lf.len + as * lf.w * .35) % 3.4) < .4) q += .09;
      if (vein) q += .1;
      if (o.variegate && as < .4 && t > .25 && t < .8) q += .16;
      let col;
      if (o.tip && t > .78) col = hash(i, j) > .3 ? (o.tip === 'pink' ? '#ff7af0' : '#5ae8ff') : hi;
      else if (o.tipc && t > o.tipt) col = hash(i, j) > .35 ? o.tipc : ramp(pal, q, i, j, .1);
      else if (o.rim && side < -.6 && (o.hi ? t > .15 : t > .6) && hash(i, j) > .35) col = hash(j, i) > .55 ? '#7ad8ff' : '#a8ecff';
      else col = ramp(pal, q, i, j, .1);
      const key = j * W + i; st[key] = id; idx.push(key); cols.push(col); return null;
    });
    if (o.outline !== false) {
      const r = o.thin ? 1 : 2;
      for (const key of idx) { const i = key % W, j = (key - i) / W;
        for (let dj = -r; dj <= r; dj++) { const jj = j + dj; if (jj < 0 || jj >= H) continue;
          for (let di = -r; di <= r; di++) { const ii = i + di; if (di * di + dj * dj > r * r + 1 || ii < 0 || ii >= W) continue; if (st[jj * W + ii] !== id) S.r.set(ii, jj, OUT); } } }
    }
    for (let q = 0; q < idx.length; q++) { const key = idx[q], i = key % W; S.r.set(i, (key - i) / W, cols[q]); }
  }
  /** Еліпс (центр, півосі) — многокутник. */
  const ell = (cx, cy, rx, ry, n = 20, a0 = 0, a1 = Math.PI * 2) => Array.from({ length: n + 1 }, (_, k) => { const a = a0 + (a1 - a0) * k / n; return [cx + Math.cos(a) * rx, cy + Math.sin(a) * ry]; });
  /** Квітка: п'ять пелюсток і серединка (у растрі S, од. світу). */
  function flower(S, x, y, r, c1, c2) {
    for (let k = 0; k < 5; k++) { const a = k / 5 * Math.PI * 2 - Math.PI / 2; S.poly(ell(x + Math.cos(a) * r * .55, y + Math.sin(a) * r * .55, r * .45, r * .45, 10), (u, v, i, j) => hash(i, j) > .7 ? c2 : c1); }
    S.poly(ell(x, y, r * .3, r * .3, 8), '#ffe27a');
  }

  // ---------- рослина -> спрайт ----------
  const CACHE = new Map();
  /** spec: {kind, w, h, seed, pal, hang, leaves}. Основа — посередині внизу спрайта (hang — угорі: ліана, непентес). */
  function dcPlant(sp) {
    const key = [sp.kind, sp.w, sp.h, sp.seed, sp.pal, sp.hang ? 1 : 0, sp.leaves].join('|'); let r = CACHE.get(key); if (r) return r;
    const W = sp.w, H = sp.h, seed = sp.seed || 1, k0 = sp.kind, S = F.Sheet(0, 0, W, H, U);
    if (OWN[k0]) OWN[k0](S, W, H, seed, sp);
    else v3(S, W, H, seed, sp);
    r = { d: new Uint32Array(S.r.d.buffer), sw: S.W, sh: S.H, W, H, U }; CACHE.set(key, r); return r;
  }

  // ---------- рослини v3 (28.10): монстера, папороть, арека, сансев'єра, ліана, неонова, бонсай ----------
  function v3(S, W, H, seed, sp) {
    const k0 = sp.kind === 'pothos' ? 'vine' : sp.kind, pal = PALS[sp.pal] || (k0 === 'neon' ? PALS.neon : GREEN), n = sp.leaves || ({ monstera: 7, fern: 13, palm: 11, vine: 6, bonsai: 3 }[k0] || 7);
    const potTop = sp.hang ? 0 : H - .4, cx = W / 2, pw = W * .4, ops = [], up = potTop - 1.5, asp = (W - 2.8) / Math.max(1, sp.hang ? H : up), hw = W / 2 - 1.4;
    const reach = (len, a, curl, k = 1.2) => Math.min(len, hw * k / Math.max(.35, Math.sin(Math.min(1.57, Math.abs(a) + .9 * Math.abs(curl)))));
    const leafOp = (base, ang, len, w, curl, kind, sd, lp, o, z) => ops.push({ t: 'leaf', base, ang, len, w, curl, kind, sd, pal: lp, o, z });
    const lineOp = (pts, col, w, z, out = true) => ops.push({ t: 'line', pts, col, w, z, out });
    function frond(base, ang, len, curl, fp, sd, q0, z, style) {
      const palm = style === 'palm', nn = Math.max(8, Math.round(len / (palm ? .95 : 1.2))), pts = [];
      for (let k = 0; k <= nn; k++) { const t = k / nn, s = t * len, a = ang + curl * t * t * 1.6; pts.push({ x: base[0] + Math.sin(a) * s, y: base[1] - Math.cos(a) * s, a, t }); }
      for (let k = 1; k < nn; k++) { const p = pts[k];
        for (const side of [-1, 1]) {
          if (palm) {
            const ll = len * .26 * Math.sin(Math.PI * Math.min(1, p.t * 1.05 + .1)) + 1; let la = p.a + side * (.6 + .12 * hash(sd, k)); la += ((la > 0 ? Math.PI : -Math.PI) - la) * .32;
            leafOp([p.x, p.y], la, ll, Math.max(.75, ll * .13), side * .22, 'blade', sd + k * 2 + (side > 0), fp, { q0: q0 + .12 * p.t + (side < 0 ? .08 : -.05), hi: side < 0, rim: side < 0 && hash(k, sd) > .45, outline: false }, z + p.t * .01);
          } else {
            const ll = len * .2 * Math.sin(Math.PI * Math.min(1, p.t * 1.05 + .08)) + .8;
            leafOp([p.x, p.y], p.a + side * (1.0 + .14 * hash(sd, k)), ll, Math.max(.7, ll * .34), side * .22, 'blade', sd + k * 2 + (side > 0), fp, { q0: q0 + .1 * p.t + (side < 0 ? .1 : -.07), hi: side < 0, rim: side < 0 && hash(k, sd) > .6, outline: false }, z + p.t * .01);
          }
        }
      }
      lineOp(pts.map(p => [p.x, p.y]), fp[Math.min(fp.length - 1, palm ? 3 : 4)], palm ? .6 : .45, z + .02, false);
    }
    if (k0 === 'vine') {                                                               // потос: крона згори, пасма з серцеподібними листками
      const rch = Math.min(W * .22, 8), xa = rch + 1.5, xb = W - rch - 1.5;
      for (let s = 0; s < n; s++) {
        const x = xa + (xb - xa) * ((s + .5) / n + (hash(seed, s) - .5) * .5 / n), len = H * (.42 + .56 * hash(seed, s + 9)), sw = (hash(seed, s + 3) - .5) * .25, pts = [];
        for (let k = 0; k <= 16; k++) { const t = k / 16; pts.push([Math.min(xb, Math.max(xa, x + Math.sin(t * 5 + s) * 2.2 * t + sw * len * t * .5)), 1.5 + t * (len - 1.5)]); }
        lineOp(pts, pal[3], .8, s * .01 - 1);
        for (let k = 2; k < pts.length; k += 2) { const [lx, ly] = pts[k], side = (k + s) % 4 < 2 ? 1 : -1, sz = Math.min(3.4 + 2.4 * hash(seed, k * 7 + s), W * .13 + 1.2);
          leafOp([lx, ly], side * (1.25 + .3 * hash(seed, k)) + .25, sz * 1.7, sz * 1.1, side * .35, 'heart', k + s * 31, pal, { q0: .42 + .15 * hash(seed, k + s), hi: side < 0, vein: 1, rim: 1, variegate: hash(seed, k * 3 + s) > .5, thin: 1 }, ly / H); }
      }
      const nc = Math.max(3, Math.round(W / 4.2));
      for (let q = 0; q < nc; q++) { const x = xa + (xb - xa) * (q + .5) / nc + (hash(seed, q + 60) - .5) * 2, side = q % 2 ? 1 : -1, sz = Math.min(3.8 + 2 * hash(seed, q + 61), W * .14 + 1.4);
        leafOp([x, 1.2 + hash(seed, q + 62) * 2.6], side * (1.85 + .5 * hash(seed, q + 63)), sz * 1.7, sz * 1.1, side * .3, 'heart', 200 + q + seed, pal, { q0: .5 + .15 * hash(seed, q + 64), hi: side < 0, vein: 1, rim: 1, variegate: hash(seed, q + 65) > .6, thin: 1 }, 2 + q * .01); }
    } else if (k0 === 'monstera') {
      const spread = P.clamp(asp * 1.5, .45, 1.05);
      for (let q = 0; q < n; q++) {
        const u = n === 1 ? .5 : q / (n - 1), h1 = hash(seed, q), h2 = hash(seed, q + 17), h3 = hash(seed, q + 33);
        const b = [cx + (u - .5) * pw * .35, potTop + 1.5], a0 = (u - .5) * 2 * spread + (h1 - .5) * .25, Lp = up * (.16 + .5 * (1 - Math.abs(u - .5) * 1.3) * (.6 + .4 * h2)), z = 1 - Lp / H + h3 * .05;
        const e = [b[0] + Math.sin(a0) * Lp, b[1] - Math.cos(a0) * Lp], c2 = [b[0] + Math.sin(a0 * .45) * Lp * .6, b[1] - Math.cos(a0 * .45) * Lp * .6], pts = [];
        for (let s2 = 0; s2 <= 10; s2++) { const tt = s2 / 10, w1 = 1 - tt; pts.push([w1 * w1 * b[0] + 2 * w1 * tt * c2[0] + tt * tt * e[0], w1 * w1 * b[1] + 2 * w1 * tt * c2[1] + tt * tt * e[1]]); }
        const la = a0 + Math.sign(a0 || (q % 2 ? 1 : -1)) * (.35 + 1.1 * h3), len = Math.min(H * (.28 + .06 * h2), W * (.5 + .12 * h2));
        lineOp(pts, pal[3], .9, z - .001);
        leafOp(e, la, len, len * (.84 + .1 * h1), Math.sign(la) * .1, 'mon', seed * 7 + q, pal, { q0: .34 + .18 * h1, hi: la < 0, vein: 1, rim: 1, mon: h1 > .12 }, z);
      }
      for (let q = 0; q < 2; q++) leafOp([cx + (q - .5) * 3, potTop - 1.5], (q - .5) * .45, up * .3, 2.4, 0, 'blade', seed + 90 + q, PALS.light, { q0: .62, hi: q === 0, rim: 1 }, -1 + q * .01);
    } else if (k0 === 'fern') {
      const spread = P.clamp(asp * .95, .55, 1.05);
      for (let q = 0; q < n; q++) {
        const u = n === 1 ? .5 : q / (n - 1), h1 = hash(seed, q), h2 = hash(seed, q + 17), ang = (u - .5) * 2 * spread + (h1 - .5) * .2, e = Math.abs(u - .5);
        const curl = (.16 + .62 * e + .14 * h2) * (ang < 0 ? -1 : 1), len = reach(up * (.74 + .3 * h2) * (1 - e * .45), ang, curl, 1.05);
        frond([cx + (u - .5) * pw * .3, potTop + 1.5], ang, len, curl, pal, seed + q * 7, .4 + .14 * hash(seed, q + 5), Math.abs(u - .5), 'fern');
      }
    } else if (k0 === 'palm') {
      const canes = [], spread = P.clamp(asp * 1.2, .7, 1.25);
      for (let q = 0; q < 3; q++) { const ca = (q - 1) * .16 + (hash(seed, q + 40) - .5) * .1, cl = up * (.38 + .14 * hash(seed, q + 41)), b = [cx + (q - 1) * 1.6, potTop + 1.5], e = [b[0] + Math.sin(ca) * cl, b[1] - Math.cos(ca) * cl];
        canes.push(e); lineOp([b, e], '#4e6a2a', 1.3, -5 + q * .01);
        for (let s2 = 3; s2 < cl - 1; s2 += 3.2) { const m = [b[0] + Math.sin(ca) * s2, b[1] - Math.cos(ca) * s2]; lineOp([[m[0] - .8, m[1]], [m[0] + .8, m[1]]], '#2e4218', .35, -4.9 + q * .01, false); }
      }
      for (let q = 0; q < n; q++) {
        const u = n === 1 ? .5 : q / (n - 1), h1 = hash(seed, q), h2 = hash(seed, q + 17), fa = (u - .5) * 2 * spread + (h1 - .5) * .2, e = Math.abs(u - .5);
        const curl = (.18 + 1.05 * e + .15 * h2) * (fa < 0 ? -1 : 1);
        frond(canes[q % 3], fa, reach(up * (.56 + .26 * h2) * (1 - e * .42), fa, curl, 1.05), curl, pal, seed + q * 5, .38 + .14 * h1, e * 2 + h1 * .1, 'palm');
      }
    } else if (k0 === 'bonsai') {
      const tr = [[cx, potTop + 1.5], [cx - W * .06, potTop - H * .22], [cx + W * .08, potTop - H * .42], [cx - W * .04, potTop - H * .6]];
      lineOp(tr, '#6a3a1a', 1.8, -2); lineOp(tr.map(([x, y]) => [x - .4, y]), '#9a5a2a', .6, -1.9, false);
      [[cx - W * .28, potTop - H * .3, W * .36, H * .17], [cx + W * .26, potTop - H * .46, W * .38, H * .18], [cx - W * .02, potTop - H * .68, W * .44, H * .2]].forEach(([x, y, w, h], k) => {
        lineOp([[x, y], tr[Math.min(k + 1, tr.length - 1)]], '#6a3a1a', 1.2, -1.95, false);
        leafOp([x, y + h / 2], 0, h, w, 0, 'round', seed + k, pal, { q0: .34 + .1 * k, hi: 1, rim: 1, cloud: 1 }, k); });
    } else {                                                                           // сансев'єра й неонова: листки-леза
      for (let q = 0; q < n; q++) {
        const u = n === 1 ? .5 : q / (n - 1), h1 = hash(seed, q), h2 = hash(seed, q + 17), neon = k0 === 'neon';
        const ang = neon ? (u - .5) * 1.6 + (h1 - .5) * .3 : (u - .5) * 1 + (h1 - .5) * .25, len = up * (neon ? (.6 + .35 * h2) * (1 - Math.abs(u - .5) * .35) : .62 + .4 * h2);
        const w = W * (.14 + .05 * h1), curl = neon ? (.3 + .25 * h2) * (ang < 0 ? -1 : 1) : .12 * (h2 - .5);
        leafOp([cx + (u - .5) * W * .2, potTop + 1.5], ang, len, w, curl, 'blade', q * 3 + seed, pal, neon ? { q0: .38 + .18 * h1, hi: ang < 0, vein: 1, tip: q % 2 ? 'pink' : 'cyan', thin: 1 } : { q0: .38 + .18 * h1, hi: ang < 0, bands: 1, edge: '#d8d060', vein: 0 }, -Math.abs(ang) + (neon ? 0 : h2));
      }
    }
    // автопідгонка: межі всіх деталей -> рівномірний масштаб від основи
    let x0 = 1e9, x1 = -1e9, y0 = 1e9, y1 = -1e9; const acc = (x, y) => { if (x < x0) x0 = x; if (x > x1) x1 = x; if (y < y0) y0 = y; if (y > y1) y1 = y; };
    ops.forEach(op => op.t === 'leaf' ? leaf(op.base, op.ang, op.len, op.w, op.curl, op.kind, op.sd).poly.forEach(([x, y]) => acc(x, y)) : op.pts.forEach(([x, y]) => acc(x, y)));
    const m = 1.1, ax = cx, ay = sp.hang ? 0 : potTop + 1.5; let kx = sp.hang ? 1.1 : 1.25, ky = kx, dy = 0;
    if (x0 < ax - .01) kx = Math.min(kx, (ax - m) / (ax - x0)); if (x1 > ax + .01) kx = Math.min(kx, (W - m - ax) / (x1 - ax));
    if (sp.hang) ky = Math.min(1, (H - m - .4) / Math.max(1, y1 - Math.min(0, y0)));
    else { if (y0 < ay - .01) ky = Math.min(ky, (ay - m) / (ay - y0)); if (y1 > ay + .01 && H - m - ay > .5) ky = Math.min(ky, (H - m - ay) / (y1 - ay)); }
    kx = Math.max(.2, kx); ky = Math.max(.2, ky); if (kx < ky * .7) ky = kx / .7; if (ky < kx * .7) kx = ky / .7;
    if (sp.hang) dy = .4 - Math.min(0, y0) * ky;
    const M = { kx, ky, ax, ay, dy }, P2 = ([x, y]) => [ax + (x - ax) * kx, ay + (y - ay) * ky + dy], k = Math.sqrt(kx * ky);
    const drawOp = op => {
      if (op.t === 'leaf') return fillLeaf(S, mapLeaf(leaf(op.base, op.ang, op.len, op.w, op.curl, op.kind, op.sd), M), op.pal, op.o);
      const pts = op.pts.map(P2), w = Math.max(.35, op.w * k);
      if (op.out) for (let q = 1; q < pts.length; q++) line(S, pts[q - 1], pts[q], OUT, w + .8);
      for (let q = 1; q < pts.length; q++) line(S, pts[q - 1], pts[q], op.col, w);
    };
    ops.sort((a, b) => a.z - b.z); ops.forEach(drawOp);
  }
  /** Товста лінія (стебло, жилка) — многокутником. */
  function line(S, a, b, col, w) {
    const dx = b[0] - a[0], dy = b[1] - a[1], l = Math.hypot(dx, dy) || 1, nx = -dy / l * w / 2, ny = dx / l * w / 2;
    S.poly([[a[0] + nx, a[1] + ny], [b[0] + nx, b[1] + ny], [b[0] - nx, b[1] - ny], [a[0] - nx, a[1] - ny]], col);
  }

  // ---------- нові рослини (02.11) ----------
  const OWN = {
    /** Кактус-колона з двома «руками» (цереус), ребра, колючки, рожева квітка на маківці. */
    cactus(S, W, H, seed) {
      const cx = W / 2 + (hash(seed, 1) - .5) * W * .1, cw = Math.max(2.6, W * .34), top = 1.6;
      const body = (x0, y0, x1, y1) => S.rr(x0, y0, x1, y1, [Math.min(x1 - x0, y1 - y0) / 2, Math.min(x1 - x0, y1 - y0) / 2, 0, 0], (d, u, v, i, j, X) => {
        if (d < .28) return OUT; const rib = ((X - x0) / (x1 - x0) * 4.2) % 1, sp = hash(i >> 1, j >> 1) > .9 && rib < .2;
        return sp ? '#e8f4d0' : ramp(CACT, .72 - u * .55 + (rib < .14 ? -.18 : 0) + (v < .08 ? .1 : 0), i, j, .08); });
      const armY = H * (.42 + .1 * hash(seed, 2)), arm2 = H * (.55 + .1 * hash(seed, 3));
      body(cx - cw * 1.25, armY - H * .26, cx - cw * .55, armY + 1.2);                 // ліва «рука»: угору
      S.rr(cx - cw * 1.25, armY - .4, cx, armY + 1.4, .7, (d, u, v, i, j) => d < .28 ? OUT : ramp(CACT, .5 - v * .2, i, j));
      body(cx + cw * .55, arm2 - H * .2, cx + cw * 1.2, arm2 + 1.2);                    // права — нижча й коротша
      S.rr(cx, arm2 - .4, cx + cw * 1.2, arm2 + 1.4, .7, (d, u, v, i, j) => d < .28 ? OUT : ramp(CACT, .45 - v * .2, i, j));
      body(cx - cw / 2, top, cx + cw / 2, H);                                           // стовбур
      flower(S, cx + cw * .1, top + .4, Math.max(1.2, cw * .42), '#ff6ad0', '#ffb0ea');
    },
    /** Кактус-куля: ребра дугами, жовті колючки, вінок дрібних квіток. */
    cactus2(S, W, H, seed) {
      const cx = W / 2, rx = W * .42, ry = Math.min(H * .44, rx * 1.05), cy = H - ry - .2;
      S.poly(ell(cx, cy, rx, ry, 28), (u, v, i, j, X, Y) => {
        const nx = (X - cx) / rx, ny = (Y - cy) / ry, rr = nx * nx + ny * ny; if (rr > .9) return OUT;
        const ang = Math.asin(P.clamp(nx / Math.sqrt(Math.max(.05, 1 - ny * ny)), -1, 1)), rib = ((ang / Math.PI + .5) * 7) % 1;
        if (rib < .1 && hash(i >> 1, j >> 1) > .55) return '#ffe9a0';
        return ramp(CACT, .62 - nx * .35 - ny * .2 + (rib < .16 ? -.2 : 0), i, j, .06);
      });
      for (let k = 0; k < 4; k++) flower(S, cx + (k - 1.5) * rx * .38, cy - ry * .82 + Math.abs(k - 1.5) * .6, Math.max(.9, rx * .2), k % 2 ? '#ffd27a' : '#ff7ab8', '#fff2c4');
    },
    /** Ехеверія: розетка товстих листків, блакитна зелень з рожевими кінчиками. */
    succ(S, W, H, seed) {
      const cx = W / 2, by = H - .6, n = 9;
      for (let ring = 0; ring < 2; ring++) for (let q = 0; q < n; q++) {
        const u = q / (n - 1), a = (u - .5) * (ring ? 2.2 : 2.9), len = (ring ? H * .55 : H * .72) * (.85 + .15 * hash(seed, q + ring * 9));
        fillLeaf(S, leaf([cx, by], a, len, len * .55, 0, 'broad', seed + q), SUCC, { q0: ring ? .55 : .4, hi: a < 0, tipc: '#ff8ab0', tipt: .8, thin: 1 });
      }
    },
    /** Венерина мухоловка: розетка листків, пастки на черешках — дві частки з «віями», червоні всередині. */
    flytrap(S, W, H, seed) {
      const cx = W / 2, by = H - .4, n = 4;
      for (let q = 0; q < 5; q++) fillLeaf(S, leaf([cx, by], (q / 4 - .5) * 2.6, H * .32, H * .14, 0, 'broad', seed + q), GREEN2, { q0: .45, hi: q < 2, thin: 1 });
      for (let q = 0; q < n; q++) {
        const u = q / (n - 1), a = (u - .5) * 1.5 + (hash(seed, q) - .5) * .3, len = H * (.5 + .3 * hash(seed, q + 5)), tx = cx + Math.sin(a) * len, ty = by - Math.cos(a) * len, r = Math.max(1.3, W * .14);
        line(S, [cx, by], [tx, ty + r * .4], OUT, .9); line(S, [cx, by], [tx, ty + r * .4], '#2f8c4a', .45);
        const lob = (dir) => S.poly(ell(tx, ty, r, r * .62, 14, dir > 0 ? Math.PI : 0, dir > 0 ? Math.PI * 2 : Math.PI).map(([x, y]) => [x, y - dir * r * .2]), (uu, vv, i, j, X, Y) => {
          const e = Math.abs(Y - ty) / (r * .62); return e > .78 ? '#7ae07a' : e > .55 ? '#3aa858' : (hash(i, j) > .5 ? '#e4364a' : '#b81e36'); });
        lob(1); lob(-1);
        for (let t = -r; t <= r; t += .7) { S.set(tx + t, ty - r * .62 - .5, '#e8ffd0'); S.set(tx + t, ty + r * .62 + .5, '#e8ffd0'); }   // «вії»
      }
    },
    /** Непентес: крона листків угорі (база — угорі), вусики з глечиками звисають униз. */
    pitcher(S, W, H, seed, sp) {
      const cx = W / 2, ty = sp.hang ? 1.2 : H * .3, n = 3;
      for (let q = 0; q < 6; q++) fillLeaf(S, leaf([cx + (q - 2.5) * .6, ty + 1.2], (q / 5 - .5) * 3.4, Math.min(W * .42, 6), 2.2, 0, 'blade', seed + q), GREEN, { q0: .45, hi: q < 3, vein: 1, thin: 1 });
      for (let q = 0; q < n; q++) {
        const x = W * (.2 + .3 * q) + (hash(seed, q) - .5) * 1.5, len = H * (.45 + .4 * hash(seed, q + 4)), pw = Math.max(1.6, W * .13), ph = Math.min(len * .5, pw * 2.4);
        const bx = x, by = ty + 1.5 + len - ph;
        line(S, [cx, ty + 1.5], [bx, by], OUT, .7); line(S, [cx, ty + 1.5], [bx, by], '#3a7a3a', .35);
        S.poly([...ell(bx, by + ph * .55, pw * .55, ph * .48, 16)], (u, v, i, j) => ramp(RED, .7 - u * .5 + (v > .7 ? -.15 : 0), i, j, .1));   // глечик
        S.poly(ell(bx, by + .4, pw * .6, .55, 12), '#f0c84a');                                                                               // губа (перистом)
        S.poly(ell(bx + pw * .25, by - .5, pw * .45, .5, 10), '#6ab84a');                                                                     // кришечка
      }
    },
    /** Світні гриби: шапки з блакитним сяйвом і цятками, світлі ніжки (світяться — сяйво й віддзеркалення). */
    shroom(S, W, H, seed) {
      const L = [[.3, .95, .26], [.62, .72, .34], [.82, .55, .2], [.46, .5, .16]];
      L.forEach(([fx, fh, fr], q) => {
        const x = W * fx, top = H * (1 - fh) + .6, r = W * fr, cy = top + r * .55;
        S.rr(x - r * .2, cy, x + r * .2, H - .2, .3, (d, u, v, i, j) => d < .25 ? OUT : ramp(['#2a3a5a', '#5a7aa0', '#a8c8e8', '#e0f0ff'], .9 - u * .7, i, j));
        S.poly(ell(x, cy, r, r * .62, 18, Math.PI, Math.PI * 2), (u, v, i, j, X, Y) => {
          if (v > .92) return '#0a3a5a'; const dot = hash(Math.round(X * 2), Math.round(Y * 2)) > .86;
          return dot ? '#eaffff' : ramp(['#0a5a70', '#118aa0', '#1ac0d0', '#3be8ff', '#9af6ff'], .9 - v * .6 - Math.abs(u - .4) * .5, i, j); });
      });
    },
    /** Стреліція «райський птах»: листки-весла віялом на довгих черешках і дві квітки-«птахи» (дзьоб-човник, помаранчевий
     *  гребінь, синій «язик») — найвища рослина антресолі. */
    strelitzia(S, W, H, seed) {
      const cx = W / 2, by = H - .3;
      for (let q = 0; q < 6; q++) {
        const u = q / 5, a = (u - .5) * 1.5 + (hash(seed, q) - .5) * .2, stem = H * (.36 + .22 * hash(seed, q + 3)), bx = cx + Math.sin(a) * stem, bb = by - Math.cos(a) * stem;
        line(S, [cx, by], [bx, bb], OUT, 1.1); line(S, [cx, by], [bx, bb], '#3a6a3a', .55);
        const len = Math.min(H * (.3 + .1 * hash(seed, q + 7)), W * .62), la = a * 1.2;
        fillLeaf(S, leaf([bx, bb], la, len, len * .4, q % 2 ? .12 : -.12, 'broad', seed + q), GREEN, { q0: .36 + .14 * hash(seed, q), hi: la < 0, vein: 1, rim: 1 });
      }
      for (let q = 0; q < 2; q++) {
        const d = q ? 1 : -1, fx = cx + d * W * .08, fy = H * (.2 + q * .12), bl = W * .3;
        line(S, [cx, by], [fx, fy + 2], OUT, .95); line(S, [cx, by], [fx, fy + 2], '#4a7a3a', .5);
        S.poly([[fx, fy + 1.3], [fx + d * bl, fy + .6], [fx + d * bl * 1.06, fy + 1.4], [fx, fy + 2.7]], (u, v, i, j) => ramp(['#2a1a4a', '#4a2a6a', '#3a6a3a', '#5a8a4a'], .25 + (d > 0 ? u : 1 - u) * .6, i, j));   // дзьоб
        for (let k = 0; k < 3; k++) { const px = fx + d * bl * (.15 + k * .22); S.poly([[px, fy + 1.1], [px + d * .7, fy - H * .08 - k * .5], [px + d * 1.7, fy + .9]], (u, v, i, j) => ramp(['#b03a06', '#e8680a', '#ff9a1a', '#ffd060'], .95 - v * .65, i, j)); }   // гребінь
        S.poly([[fx + d * bl * .25, fy + 1.3], [fx + d * bl * .8, fy + .2], [fx + d * bl * .62, fy + 1.5]], '#3a6aff');   // язик
      }
    },
    /** Орхідея-фаленопсис (живе в міні-оранжереї антресолі): широкі глянцеві листки внизу, дугою — квітконос з квітками-
     *  «метеликами» (білі пелюстки з рожевими жилками, малинова губа, жовта серединка), на кінці — бутони. */
    orchid(S, W, H, seed) {
      const cx = W / 2, by = H - .3, LP = ['#06180f', '#0a2a1a', '#123c26', '#1c5234', '#286a44', '#3a8656', '#5aa66e'];
      for (let q = 0; q < 4; q++) { const sd = q % 2 ? 1 : -1, a = sd * (1.05 + .25 * q / 3) + (hash(seed, q) - .5) * .2, len = W * (.5 + .1 * hash(seed, q + 4));
        fillLeaf(S, leaf([cx + sd * .3, by - .4 - q * .35], a, len, len * .46, sd * .5, 'broad', seed + q), LP, { q0: .4 + .1 * q / 3, hi: sd < 0, vein: 1, rim: 1 }); }
      const pts = []; for (let k = 0; k <= 20; k++) { const t = k / 20; pts.push([cx - W * .06 + Math.sin(t * 1.9) * W * .32, by - 1 - Math.sin(t * 1.75) * H * .82]); }
      for (let k = 1; k < pts.length; k++) { line(S, pts[k - 1], pts[k], OUT, .75); line(S, pts[k - 1], pts[k], '#4a6a2a', .4); }
      const PET = ['#7a2a6a', '#c870b0', '#f0c8e8', '#fff4fc'], fl = (x, y, r, k) => {
        for (const [a, rx, ry] of [[-1.57, .38, .55], [.6, .38, .55], [2.54, .38, .55]]) S.poly(ell(x + Math.cos(a) * r * .55, y + Math.sin(a) * r * .55, r * rx, r * ry, 10), (u, v, i, j) => ramp(PET, .9 - Math.hypot(u - .5, v - .5) * .6, i, j));   // чашолистки
        for (const sd of [-1, 1]) S.poly(ell(x + sd * r * .55, y - r * .05, r * .52, r * .46, 12), (u, v, i, j) => (hash(i, j + k) > .82 ? '#e05aa8' : ramp(PET, .95 - Math.hypot(u - .5, v - .5) * .5, i, j)));   // пелюстки з жилками
        S.poly(ell(x, y + r * .42, r * .3, r * .32, 10), (u, v, i, j) => ramp(['#5a0a3a', '#a01a62', '#e0308a', '#ff7ac0'], .85 - v * .5, i, j)); S.poly(ell(x, y + r * .08, r * .14, r * .14, 6), '#ffd84a');
      };
      [[.5, 1.25], [.62, 1.2], [.73, 1.12], [.83, 1.02], [.92, .9]].forEach(([t, r], k) => { const p = pts[Math.round(t * 20)]; fl(p[0] + (k % 2 ? .5 : -.4), p[1] + 1.4, Math.min(r * W * .21, 3), k); });
      [.98, 1].forEach((t, k) => { const p = pts[Math.round(t * 20)]; S.poly(ell(p[0] + .3, p[1] + .7, .55 - k * .15, .75 - k * .15, 8), (u, v, i, j) => ramp(['#4a6a2a', '#a0c070', '#f0c8e8'], .4 + v * .5, i, j)); });
    },
    /** М'ята: кущик дрібних зубчастих листочків, соковита світла зелень (аквапоніка). */
    mint(S, W, H, seed) {
      const cx = W / 2, by = H - .2, MP = ['#0e3a1e', '#16542a', '#22703a', '#34904a', '#4cb060', '#7ad080', '#b0f0a0'];
      for (let q = 0; q < 10; q++) { const u = q / 9, a = (u - .5) * 2.1, stem = H * (.2 + .55 * hash(seed, q)), e = [cx + Math.sin(a) * stem * .75, by - Math.cos(a) * stem];
        line(S, [cx, by], e, '#2a6a3a', .35); fillLeaf(S, leaf(e, a + (q % 2 ? .7 : -.7), H * .24, H * .17, 0, 'broad', seed + q), MP, { q0: .5 + .1 * hash(q, seed), hi: a < 0, vein: 1, thin: 1 }); }
    },
    /** «Нитка перлів» (сенеціо): пасма з круглих зелених намистин з відблиском, «шапка» намистин угорі. Звисає. */
    pearls(S, W, H, seed) {
      const PP = ['#14401a', '#226024', '#348034', '#4ea046', '#78c068'];
      for (let st = 0; st < 6; st++) {
        const x0 = W * (.14 + .72 * st / 5), len = H * (.42 + .52 * hash(seed, st)); let px = x0, py = .9;
        for (let k = 0; py < len - 1; k++) { const nx = x0 + Math.sin(k * .8 + st) * 1.1, ny = py + 1.2, r = .58 + .12 * hash(st, k);
          line(S, [px, py], [nx, ny], '#2a4a20', .22); S.poly(ell(nx, ny, r, r, 9), (u, v, i, j) => u < .38 && v < .42 ? '#dcffd0' : ramp(PP, .85 - Math.hypot(u - .4, v - .4) * 1.2, i, j)); px = nx; py = ny; }
      }
      for (let k = 0; k < 16; k++) { const x = W * (.08 + .84 * hash(seed, k + 40)), y = .7 + 1.7 * hash(seed, k + 41); S.poly(ell(x, y, .62, .62, 9), (u, v) => u < .38 && v < .42 ? '#dcffd0' : '#4ea046'); }
    },
    /** Традесканція «зебрина»: пасма з загостреними листками — фіолетові зі срібною серединкою. Звисає. */
    tradescantia(S, W, H, seed) {
      const TP = ['#22082e', '#3e1450', '#5c2272', '#7c3a92', '#a06ab4', '#c8a0dc', '#eedcff'];
      for (let st = 0; st < 5; st++) {
        const x0 = W * (.18 + .64 * st / 4), len = H * (.38 + .58 * hash(seed, st)), pts = [];
        for (let k = 0; k <= 12; k++) { const t = k / 12; pts.push([x0 + Math.sin(t * 4 + st) * 1.5 * t, .8 + t * (len - .8)]); }
        for (let k = 1; k < pts.length; k++) line(S, pts[k - 1], pts[k], '#4a1a5a', .3);
        for (let k = 1; k < pts.length; k += 2) { const side = (k + st) % 4 < 2 ? 1 : -1, sz = 2 + 1.3 * hash(seed, k + st);
          fillLeaf(S, leaf(pts[k], side * 1.85, sz * 1.7, sz * .85, side * .25, 'blade', seed + k + st * 9), TP, { q0: .4, hi: side < 0, variegate: 1, thin: 1 }); }
      }
    },
    /** Гліцинія: кілька листочків угорі й довгі грона дрібних бузкових квіточок (конусом донизу). Звисає. */
    wisteria(S, W, H, seed) {
      for (let q = 0; q < 6; q++) fillLeaf(S, leaf([W * (.12 + .76 * q / 5), 1.2], (q % 2 ? 1 : -1) * 1.65, 2.8, 1.1, 0, 'blade', seed + q), GREEN2, { q0: .5, thin: 1 });
      const FL = ['#4a1e86', '#7448c0', '#9c78e4', '#c8aaff', '#ece0ff'];
      for (let r = 0; r < 4; r++) { const x = W * (.18 + .64 * r / 3), len = H * (.48 + .46 * hash(seed, r)), top = 1.8;
        line(S, [x, 1], [x, top + len * .9], '#3a5a2a', .25);
        for (let k = 0; k < 46; k++) { const t = k / 46, y = top + t * len, wdt = (1 - t) * 1.7 + .35, px = x + (hash(seed, k + r * 50) - .5) * 2 * wdt;
          S.poly(ell(px, y, .55, .45, 6), FL[Math.min(4, Math.floor(hash(k, r) * 3.2 + t * 1.6))]); } }
    },
    /** Хойя: пасма з товстими восковими листками (темні, з цятками) і парасольки рожевих квіток-зірочок. Звисає. */
    hoya(S, W, H, seed) {
      for (let st = 0; st < 4; st++) {
        const x0 = W * (.2 + .6 * st / 3), len = H * (.42 + .52 * hash(seed, st)), pts = [];
        for (let k = 0; k <= 10; k++) { const t = k / 10; pts.push([x0 + Math.sin(t * 3 + st * 2) * 1.3 * t, .8 + t * (len - .8)]); }
        for (let k = 1; k < pts.length; k++) line(S, pts[k - 1], pts[k], '#3a5a2a', .32);
        for (let k = 2; k < pts.length; k += 2) { const side = (k / 2 + st) % 2 ? 1 : -1;
          fillLeaf(S, leaf(pts[k], side * 1.55, 3.1, 2.3, side * .1, 'round', seed + k + st * 7), ['#0a2a1a', '#123a24', '#1c5232', '#286a40', '#3a8450', '#5aa06a'], { q0: .44, hi: side < 0, cloud: 1, thin: 1 }); }
        const [fx, fy] = pts[pts.length - 1];
        for (let k = 0; k < 9; k++) { const a = k / 9 * 6.28, px = fx + Math.cos(a) * 1.3, py = fy + 1.4 + Math.sin(a) * 1; S.poly(ell(px, py, .62, .62, 6), k % 2 ? '#ffd0e8' : '#ff9ac8'); S.set(px, py, '#c02060'); }
      }
    },
    /** Зелень гідропоніки: базилік (овальні листки), салат (кучерява розетка), полуниця (листки й ягоди). */
    basil(S, W, H, seed) { const cx = W / 2, by = H - .2; for (let q = 0; q < 7; q++) { const a = (q / 6 - .5) * 2.4, len = H * (.45 + .4 * hash(seed, q)); fillLeaf(S, leaf([cx, by], a, len, len * .62, 0, 'broad', seed + q), GREEN2, { q0: .5 + .1 * hash(q, seed), hi: a < 0, vein: 1, thin: 1 }); } },
    lettuce(S, W, H, seed) { const cx = W / 2, by = H - .2; for (let q = 0; q < 9; q++) { const a = (q / 8 - .5) * 2.8, len = H * (.55 + .35 * hash(seed, q)); fillLeaf(S, leaf([cx, by], a, len, len * .8, (hash(q, 3) - .5) * .4, 'round', seed + q), ['#1a4a1a', '#2a6a22', '#3c8a2a', '#5aaa36', '#7cc84a', '#a8e070'], { q0: .45 + .2 * hash(seed, q + 3), hi: a < 0, cloud: 1, thin: 1 }); } },
    straw(S, W, H, seed) {
      const cx = W / 2, by = H * .55; for (let q = 0; q < 5; q++) { const a = (q / 4 - .5) * 2.4; fillLeaf(S, leaf([cx, by], a, H * .4, H * .3, 0, 'broad', seed + q), GREEN, { q0: .45, hi: a < 0, vein: 1, thin: 1 }); }
      for (let q = 0; q < 3; q++) { const x = W * (.25 + .25 * q), y = H * (.62 + .2 * hash(seed, q)); line(S, [cx, by], [x, y], '#3a7a3a', .3); S.poly(ell(x, y + .9, .9, 1.1, 10), (u, v, i, j) => hash(i, j) > .82 ? '#ffe27a' : ramp(RED, .8 - u * .4, i, j)); }
    },
  };
  NX.arc.dcPlant = dcPlant;
})();

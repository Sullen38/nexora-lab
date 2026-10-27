/* ============================================================================
 * objects/rwing_box.js — СХЕМА (СІРИЙ МАКЕТ) ОБОХ КРИЛ «ПО ДУЗІ» (лише для погодження)
 * ----------------------------------------------------------------------------
 * Вмикається адресою: #rw-box — схема з зонами; #rw-base — лише основа (стіни й підлога крил, без зон).
 * Кімната зверху — пів кола: вікно (NX.cfg.WIN, 508..1040, центр 774) в найдальшій точці, обабіч стіни загинаються
 * дугами до глядача; стіни дзеркальні відносно центру вікна, а наповнення в кожного крила своє:
 *   праворуч (технологічне): майстерня (біля вікна, прямо) -> інструменти -> портал (найближче, лицем до центру кімнати);
 *            екран NEXORA AI на стіні біля вікна, стрічка машинерії, антресоль з ботами, вазонами й золотом, колони;
 *   ліворуч (затишне): маркетинг (біля вікна) -> аналітика -> AI-центр зі стелажем (дошки, вазони з квітами, плющ,
 *            чайник-лампа, баночки, книжки, екрани); настінні полиці вздовж дуги з вазонами й книжками, ліани, ліхтар.
 * Розміри — крок 15%: найближча зона 100, середня 85, дальня 72. Кожна зона зібрана з частин картинки-концепту
 * (assets/room.webp) — коробки, циліндри, листя (bloom — квіти), оздоби на гранях, написи з NX.t. Диван, підлога, вікно
 * й рами — свої (не з цього файлу). Розкладку генерує tools/wingbox/gen_room.py (--write пише її в objects/arc_layout.js).
 * Геометрія — справжні об'єми в перспективі кімнати (NX.persp: VP 774/220, D 520; око — (774, 220, -520)):
 *   - об'єми не перетинаються (перевірка в генераторі);
 *   - хто кого закриває — за роздільною лінією в плані (з боку ока — ближче) + «стоїть на» (on): верх основи — під
 *     річчю, тіло основи — після неї; порядок рахується лише там, де обриси на екрані перекриваються;
 *   - антресоль, речі на ній, підвіси й колони біля стіни — позаду зон або вище за них: малюються перед зонами.
 * Світ: план (x, z) і висота y; z = 0 — площина картинки, підлога y = 372.
 * ========================================================================== */
(() => {
  if (!/rw-(box|base)/.test(location.hash)) return;
  const BASE = /rw-base/.test(location.hash);                                                            // #rw-base — лише основа: стіни й підлога крил (без зон)
  const PZ = NX.persp, VP = PZ.VP, D = PZ.D, EYE = [VP[0], -D], FL = 372, CEIL = -240;
  const pr = q => PZ.p(q[0], q[1], q[2]);
  // ---- вимкнути поточні крила (лише в цьому режимі) ----
  const OFF = ['workshop', 'tools', 'portal', 'rwingBack', 'rwingMezz', 'rwingFloor', 'rwingPlants', 'rwingAir',
    'wingBack', 'wingReact', 'aiPc', 'analytics', 'marketing', 'wingPlantsWall', 'wingProps', 'wingFloor', 'wingGlow', 'wingAir', 'analyticsChair', 'marketingChair'];
  const off = () => Object.values(NX.objects).forEach(o => { if (OFF.includes(o.id) || /^(r[pg]|w[pg])_/.test(o.id)) { o.drawBack = null; o.layers = null; o.draw = () => {}; o.hit = null; } });
  off(); let offDone = false;                                                                            // крісла (office.js) реєструються пізніше — ще раз на першому кадрі

  const ALL = window.RWBOX || NX.arcLayout || {};                                                      // розкладка — objects/arc_layout.js (генератор)
  // палітри: front / side / top / acc (кант)
  const ST = {
    base: ['#1c1546', '#120e30', '#2a2058', '#ff4fd8'], frame: ['#2a1650', '#180c34', '#3a2068', '#ff4fd8'], dome: ['#2c2460', '#1a1640', '#3e347c', '#3be8ff'],
    tablet: ['#0c2a5a', '#081a3a', '#123468', '#3be8ff'], fig: ['#3a2a6a', '#24184a', '#4a3a80', '#c8a0ff'], term: ['#16204a', '#0c1430', '#20306a', '#3be8ff'],
    mach: ['#1a1440', '#100c2a', '#2a2058', '#ff9a3a'], bench: ['#1a1238', '#100a26', '#3a1c5a', '#ff7ad0'], board: ['#0e1a4a', '#081030', '#14245a', '#3be8ff'],
    bot: ['#5a2a8a', '#3a1a5a', '#7a3aaa', '#e0a0ff'], item: ['#2a2460', '#1a1640', '#3a3480', '#9a8ae0'], stand: ['#221a4e', '#140f32', '#30266a', '#8a7ad0'],
    dais: ['#241a58', '#160f3a', '#33247a', '#d98aff'], pframe: ['#2a1260', '#1a0a40', '#3a1c78', '#d98aff'], gold: ['#a8741c', '#6a4810', '#d8a030', '#ffd27a'],
    pot: ['#5a3a2a', '#3a2418', '#7a4a30', '#c08060'], col: ['#1e1850', '#120e34', '#2a2468', '#5a4ab0'], shelf: ['#2a2058', '#1a1440', '#3a2c78', '#8a7ad0'],
    lamp: ['#ffb24a', '#c0782a', '#ffd27a', '#ffd27a'], clamp: ['#3be8ff', '#1a8aa8', '#8af4ff', '#8af4ff'], screen: ['#0a2a6a', '#081a40', '#123470', '#3be8ff'],
    desk: ['#241a4a', '#160f30', '#3a2a68', '#ff7ad0'], dark: ['#120e2a', '#0a0818', '#1c1640', '#5a4ab0'], neon: ['#3a1a6a', '#22104a', '#4a2a80', '#ff4fd8'],
    stone: ['#3a3a6a', '#24244a', '#4a4a80', '#7a7ab0'], glass: ['#1a3a8a', '#10246a', '#2a4aa0', '#7af4ff'], chair: ['#1c1a3a', '#100e24', '#2a2650', '#6a5ab0'],
  };
  const sty = k => ST[k] || ST.base;

  // ---------- криві ----------
  function catmull(pts, n = 6) {
    if (!pts || pts.length < 2) return (pts || []).slice();
    const P = [pts[0], ...pts, pts[pts.length - 1]], out = [];
    for (let i = 1; i < P.length - 2; i++) {
      const [p0, p1, p2, p3] = [P[i - 1], P[i], P[i + 1], P[i + 2]];
      for (let k = 0; k < n; k++) { const t = k / n, t2 = t * t, t3 = t2 * t; out.push([0, 1].map(c => .5 * (2 * p1[c] + (-p0[c] + p2[c]) * t + (2 * p0[c] - 5 * p1[c] + 4 * p2[c] - p3[c]) * t2 + (-p0[c] + 3 * p1[c] - 3 * p2[c] + p3[c]) * t3))); }
    }
    out.push(pts[pts.length - 1]); return out;
  }

  // ---------- об'єм: коробка або циліндр ----------
  /** (x, z) — середина передньої грані на підлозі; turn — поворот до центру (°); ch — [зріз лівого, правого верхнього кута]; cyl — к-сть граней циліндра. */
  function geo(B) {
    const a = (B.turn || 0) * Math.PI / 180, f = [-Math.sin(a), -Math.cos(a)], r = [-f[1], f[0]];
    const c = [B.x - f[0] * (B.back || 0), B.z - f[1] * (B.back || 0)];
    const P = (u, v, y) => [c[0] + r[0] * u - f[0] * v, y, c[1] + r[1] * u - f[1] * v];
    const w = B.w / 2, d = B.dep, yb = B.yb, yt = B.yt;
    const toEye = pts => { const m = [0, 2].map(i => pts.reduce((s, q) => s + q[i], 0) / pts.length); return [EYE[0] - m[0], EYE[1] - m[1]]; };
    const dot = (n, v) => n[0] * v[0] + n[1] * v[1];
    if (B.cyl) {
      const n = B.cyl, ring = y => Array.from({ length: n }, (_, i) => { const t = (i + .5) / n * Math.PI * 2; return P(w * Math.cos(t), d / 2 + d / 2 * Math.sin(t), y); });
      const rb = ring(yb), rt = ring(yt), sides = [];
      for (let i = 0; i < n; i++) {
        const j = (i + 1) % n, t = (i + 1) / n * Math.PI * 2, nn = [r[0] * Math.cos(t) - f[0] * Math.sin(t), r[1] * Math.cos(t) - f[1] * Math.sin(t)];
        const q = [rb[i], rb[j], rt[j], rt[i]]; sides.push({ q, vis: dot(nn, toEye(q)) > 0, k: .55 + .45 * Math.max(0, -nn[0] * .6 - nn[1] * .8) });
      }
      return { B, F: { sides, top: rt, front: rt }, P, fp: rb.map(p => [p[0], p[2]]), zc: c[1] + d / 2, cyl: true, vis: { top: yt > VP[1] } };
    }
    const [cl, crr] = B.ch || [0, 0];
    const front = cl || crr ? [P(-w, 0, yb), P(w, 0, yb), P(w, 0, yt + crr), P(w - crr, 0, yt), P(-w + cl, 0, yt), P(-w, 0, yt + cl)] : [P(-w, 0, yb), P(w, 0, yb), P(w, 0, yt), P(-w, 0, yt)];
    const F = { front, left: [P(-w, d, yb), P(-w, 0, yb), P(-w, 0, yt + cl), P(-w, d, yt + cl)], right: [P(w, 0, yb), P(w, d, yb), P(w, d, yt + crr), P(w, 0, yt + crr)],
      top: [P(-w + cl, d, yt), P(w - crr, d, yt), P(w - crr, 0, yt), P(-w + cl, 0, yt)] };
    const fp = [[P(-w, 0, 0)[0], P(-w, 0, 0)[2]], [P(w, 0, 0)[0], P(w, 0, 0)[2]], [P(w, d, 0)[0], P(w, d, 0)[2]], [P(-w, d, 0)[0], P(-w, d, 0)[2]]];
    return { B, F, P, fp, zc: c[1], vis: { front: dot(f, toEye(F.front)) > 0, left: dot([-r[0], -r[1]], toEye(F.left)) > 0, right: dot(r, toEye(F.right)) > 0, top: yt > VP[1] } };
  }
  const path = (c, pts) => { c.beginPath(); pts.forEach((q, i) => { const [x, y] = pr(q); i ? c.lineTo(x, y) : c.moveTo(x, y); }); c.closePath(); };
  const face = (c, pts, fill, line, lw = .7) => { path(c, pts); if (fill) { c.fillStyle = fill; c.fill(); } if (line) { c.strokeStyle = line; c.lineWidth = lw; c.stroke(); } };
  const seg = (c, a, b, col, lw = .7) => { const [x0, y0] = pr(a), [x1, y1] = pr(b); c.strokeStyle = col; c.lineWidth = lw; c.beginPath(); c.moveTo(x0, y0); c.lineTo(x1, y1); c.stroke(); };
  const haze = (c, pts, z) => { const k = Math.max(0, Math.min(.38, z / 400)); if (k > .01) face(c, pts, `rgba(6,4,20,${k.toFixed(3)})`); };
  const mix = (hex, k) => { const n = parseInt(hex.slice(1), 16), r = n >> 16, g = (n >> 8) & 255, b = n & 255; return `rgb(${Math.round(r * k)},${Math.round(g * k)},${Math.round(b * k)})`; };

  // ---------- оздоби на лицьовій грані (частки ширини fu й висоти fy) ----------
  const FPt = (q, fu, fy) => q.P(-q.B.w / 2 + fu * q.B.w, -.3, q.B.yt + fy * (q.B.yb - q.B.yt));
  function text(c, q, d) {
    const [u0, u1, v0, v1] = d.f, A = pr(FPt(q, u0, v0)), B = pr(FPt(q, u1, v0)), Cc = pr(FPt(q, u0, v1));
    const s = d.key ? NX.t(d.key) : d.s; c.save(); c.transform((B[0] - A[0]) / 100, (B[1] - A[1]) / 100, (Cc[0] - A[0]) / 20, (Cc[1] - A[1]) / 20, A[0], A[1]);
    c.font = '13px "Press Start 2P", monospace'; const w = c.measureText(s).width, k = Math.min(1, 92 / w); c.translate(50, 10); c.scale(k, 1);
    c.textAlign = 'center'; c.textBaseline = 'middle'; c.fillStyle = d.col || '#7af4ff'; c.fillText(s, 0, 1); c.restore();
  }
  function deco(c, q, d, t) {
    const R = (u0, u1, v0, v1) => [FPt(q, u0, v1), FPt(q, u1, v1), FPt(q, u1, v0), FPt(q, u0, v0)];
    const asp = q.B.w / Math.max(1, q.B.yb - q.B.yt);
    switch (d.t) {
      case 'r': face(c, R(...d.f), d.fill, d.line, d.lw || .7); break;
      case 'ch': { const [u0, u1, v0, v1] = d.f, k = d.k || .15, kv = k * (u1 - u0) * asp; face(c, [FPt(q, u0, v1), FPt(q, u1, v1), FPt(q, u1, v0 + kv), FPt(q, u1 - k * (u1 - u0), v0), FPt(q, u0 + k * (u1 - u0), v0), FPt(q, u0, v0 + kv)], d.fill, d.line, d.lw || .8); break; }
      case 'c': { const [cu, cv, ru] = d.f; face(c, Array.from({ length: 20 }, (_, i) => { const a = i / 20 * Math.PI * 2; return FPt(q, cu + ru * Math.cos(a), cv + ru * asp * Math.sin(a) * (d.ky || 1)); }), d.fill, d.line, d.lw || .7); break; }
      case 'l': seg(c, FPt(q, d.f[0], d.f[1]), FPt(q, d.f[2], d.f[3]), d.col, d.lw || 1); break;
      case 'p': face(c, d.pts.map(([u, v]) => FPt(q, u, v)), d.fill, d.line, d.lw || .7); break;
      case 'bars': { const [u0, u1, v0, v1] = d.f, n = d.n || 6; for (let i = 0; i < n; i++) { const h = .25 + .75 * Math.abs(Math.sin(i * 1.9 + 1.3)), cw = (u1 - u0) / n; face(c, R(u0 + i * cw + cw * .15, u0 + (i + 1) * cw - cw * .15, v1 - (v1 - v0) * h, v1), d.fill, d.line, .5); } break; }
      case 'grid': { const [u0, u1, v0, v1] = d.f, nx = d.nx, ny = d.ny, g = d.gap || .04, cw = (u1 - u0) / nx, chh = (v1 - v0) / ny;
        for (let j = 0; j < ny; j++) for (let i = 0; i < nx; i++) { face(c, R(u0 + i * cw + g * cw, u0 + (i + 1) * cw - g * cw, v0 + j * chh + g * chh, v0 + (j + 1) * chh - g * chh), d.fill, d.line, .6); if (d.icon) deco(c, q, { t: 'c', f: [u0 + (i + .5) * cw, v0 + (j + .5) * chh, cw * .22], fill: null, line: d.icon, lw: 1 }); } break; }
      case 'txt': text(c, q, d); break;
      case 'arch': {
        const [u0, u1, v0, v1] = d.f, sp = d.spring, pts = [FPt(q, u0, v1)];
        for (let i = 0; i <= 24; i++) { const a = Math.PI * i / 24; pts.push(FPt(q, (u0 + u1) / 2 - (u1 - u0) / 2 * Math.cos(a), sp - (sp - v0) * Math.sin(a))); }
        pts.push(FPt(q, u1, v1)); face(c, pts, d.fill, d.line, d.lw || 1.2);
        if (d.vortex) { const [cu, cv] = d.vortex; [[.86, '#3a1890'], [.7, '#4a22a8'], [.54, '#6a3ad8'], [.38, '#8a5af0'], [.22, '#b49af8'], [.09, '#eae0ff']].forEach(([rr, col], k) => face(c, Array.from({ length: 30 }, (_, i) => { const a = Math.PI * 2 * i / 30 + t * (k % 2 ? .5 : -.5); return FPt(q, cu + rr * (u1 - u0) / 2 * Math.cos(a), cv + rr * (u1 - u0) / 2 * asp * Math.sin(a)); }), col)); }
        break;
      }
    }
  }
  // ---------- рослина: листя віялом над вазоном (hangs — звисає вниз; bloom — квіти на кінчиках) ----------
  function foliage(c, q, t) {
    const B = q.B, top = q.P(0, B.dep / 2, B.hangs ? B.yb : B.yt), [X, Y] = pr(top), k = PZ.s(top[2]), fw = (B.fw || B.w * 1.6) * k, fh = (B.fh || B.w * 1.4) * k, n = B.leaves || 9;
    const seed = Math.abs(Math.sin(B.x * 12.9898 + B.z * 78.233)), down = B.hangs ? 1 : 0;
    const tips = [];
    for (let i = 0; i < n; i++) {
      const a = (down ? Math.PI / 2 : -Math.PI / 2) + (i / (n - 1) - .5) * (down ? 1.4 : 2.4), sw = Math.sin(t * .8 + i + seed * 6) * .04, len = fh * (.62 + .38 * Math.abs(Math.cos(i * 1.7 + seed * 9)));
      if (B.bloom && i % 2 === 0) { const r = a + Math.PI / 2 + sw; tips.push([X + Math.sin(r) * len * .92, Y - Math.cos(r) * len * .92]); }
      c.save(); c.translate(X, Y); c.rotate(a + Math.PI / 2 + sw); c.fillStyle = B.leaf ? B.leaf[i % B.leaf.length] : i % 3 === 0 ? '#2e8a4a' : i % 3 === 1 ? '#3aa858' : '#24703c'; c.strokeStyle = '#0e3a1e'; c.lineWidth = .6;
      c.beginPath(); c.ellipse(0, -len / 2, Math.max(1.2, fw / n * 1.15), len / 2, 0, 0, Math.PI * 2); c.fill(); c.stroke(); c.restore();
    }
    tips.forEach(([x, y], j) => {                                                                        // квіти (bloom): пелюстки на кінчиках листя
      const r = Math.max(1.5, fw / n * 1.2); c.fillStyle = Array.isArray(B.bloom) ? B.bloom[j % B.bloom.length] : B.bloom; c.strokeStyle = '#3a0a30'; c.lineWidth = .5;
      c.beginPath(); c.arc(x, y, r, 0, 7); c.fill(); c.stroke(); c.fillStyle = '#ffe27a'; c.beginPath(); c.arc(x, y, r * .4, 0, 7); c.fill();
    });
  }
  function glow(c, q) { const B = q.B, m = q.P(0, B.dep / 2, (B.yb + B.yt) / 2), [X, Y] = pr(m), r = (B.gr || 26) * PZ.s(m[2]), col = B.gcol || '255,190,110';
    c.save(); c.globalCompositeOperation = 'lighter'; const g = c.createRadialGradient(X, Y, 0, X, Y, r); g.addColorStop(0, `rgba(${col},.42)`); g.addColorStop(1, `rgba(${col},0)`); c.fillStyle = g; c.fillRect(X - r, Y - r, r * 2, r * 2); c.restore(); }

  function drawItem(c, it, t, mode) {                                                                   // mode: 'top' — лише верх, 'body' — без верху
    const q = it.q, B = q.B, [front, side, top, acc] = sty(B.st), F = q.F, vis = q.vis, zh = q.zc + B.dep / 2;
    if (q.cyl) {
      if (mode !== 'top') F.sides.forEach(s => { if (s.vis) face(c, s.q, mix(front, s.k), null); });
      if (mode !== 'body' && vis.top && !B.notop) face(c, F.top, top, acc + '99', .6);
      if (mode !== 'top') { F.sides.forEach(s => { if (s.vis) haze(c, s.q, zh); }); if (B.band) F.sides.forEach(s => { if (s.vis) seg(c, s.q[3], s.q[2], acc, 1.2); }); }
      if (mode !== 'top' && B.plant) foliage(c, q, t);
      if (mode !== 'top' && B.glow) glow(c, q);
      return;
    }
    if (mode !== 'body' && vis.top && B.yt > VP[1] && !B.notop) { face(c, F.top, top, acc + '88', .5); haze(c, F.top, zh); }
    if (mode === 'top') return;
    if (vis.left) { face(c, F.left, side, acc + '77', .5); haze(c, F.left, zh); }
    if (vis.right) { face(c, F.right, side, acc + '77', .5); haze(c, F.right, zh); }
    face(c, F.front, front, acc, .9);
    (B.deco || []).forEach(d => deco(c, q, d, t));
    haze(c, F.front, q.zc);
    if (B.plant) foliage(c, q, t);
    if (B.glow) glow(c, q);
  }

  // ---------- порядок: «стоїть на» + роздільна лінія в плані (лише де обриси на екрані перекриваються) ----------
  function hull(pts) {
    pts = pts.slice().sort((a, b) => a[0] - b[0] || a[1] - b[1]);
    const cr = (o, a, b) => (a[0] - o[0]) * (b[1] - o[1]) - (a[1] - o[1]) * (b[0] - o[0]), lo = [], up = [];
    for (const p of pts) { while (lo.length >= 2 && cr(lo[lo.length - 2], lo[lo.length - 1], p) <= 0) lo.pop(); lo.push(p); }
    for (const p of pts.slice().reverse()) { while (up.length >= 2 && cr(up[up.length - 2], up[up.length - 1], p) <= 0) up.pop(); up.push(p); }
    return lo.slice(0, -1).concat(up.slice(0, -1));
  }
  function nearer(A, B) {
    for (const [poly, other, sign] of [[A, B, 1], [B, A, -1]]) {
      const n = poly.length, cx = poly.reduce((s, p) => s + p[0], 0) / n, cz = poly.reduce((s, p) => s + p[1], 0) / n;
      for (let i = 0; i < n; i++) {
        const a = poly[i], b = poly[(i + 1) % n]; let nx = b[1] - a[1], nz = -(b[0] - a[0]);
        if (nx * (cx - a[0]) + nz * (cz - a[1]) > 0) { nx = -nx; nz = -nz; }
        if (other.every(q => nx * (q[0] - a[0]) + nz * (q[1] - a[1]) >= -.01)) return (nx * (EYE[0] - a[0]) + nz * (EYE[1] - a[1]) > 0) ? -sign : sign;
      }
    }
    return 0;
  }
  function overlap(A, B) {
    for (const poly of [A, B]) for (let i = 0; i < poly.length; i++) {
      const a = poly[i], b = poly[(i + 1) % poly.length], nx = b[1] - a[1], ny = -(b[0] - a[0]);
      const pa = A.map(p => nx * p[0] + ny * p[1]), pb = B.map(p => nx * p[0] + ny * p[1]);
      if (Math.max(...pa) <= Math.min(...pb) + .01 || Math.max(...pb) <= Math.min(...pa) + .01) return false;
    }
    return true;
  }
  function plan(list) {
    const byId = {}, out = [];
    list.forEach(B => { const q = geo(B); byId[B.id] = { B, q, kids: [] }; });
    list.forEach(B => { if (B.on && byId[B.on]) byId[B.on].kids.push(byId[B.id]); });
    const items = [];
    Object.values(byId).forEach(n => {
      if (n.kids.length) { n.top = { n, q: n.q, mode: 'top', after: [] }; n.body = { n, q: n.q, mode: 'body', after: [n.top] }; items.push(n.top, n.body); }
      else { n.all = { n, q: n.q, mode: 'all', after: [] }; items.push(n.all); }
    });
    const parts = n => n.kids.length ? [n.top, n.body] : [n.all];
    const under = n => { const s = []; let p = n.B.on && byId[n.B.on]; while (p) { s.push(p); p = p.B.on && byId[p.B.on]; } return s; };
    Object.values(byId).forEach(n => { if (n.B.on && byId[n.B.on]) { const p = byId[n.B.on]; parts(n).forEach(it => it.after.push(p.top)); p.body.after.push(...parts(n)); } });
    items.forEach(it => {
      const F = it.q.F; let pts;
      if (it.q.cyl) pts = [...F.top, ...F.sides.flatMap(s => s.q)]; else pts = it.mode === 'top' ? F.top : [...F.front, ...F.top, ...F.left, ...F.right];
      if (it.q.B.plant) { const B = it.q.B, top = it.q.P(0, B.dep / 2, B.hangs ? B.yb : B.yt), fw = (B.fw || B.w * 1.6) / 2, fh = (B.fh || B.w * 1.4) * (B.hangs ? -1 : 1); pts = pts.concat([[top[0] - fw, top[1] - fh, top[2]], [top[0] + fw, top[1] - fh, top[2]], [top[0] - fw, top[1], top[2]], [top[0] + fw, top[1], top[2]]]); }
      it.scr = hull(pts.map(pr));
    });
    const after = new Map(items.map(it => [it, new Set(it.after)]));
    for (let i = 0; i < items.length; i++) for (let j = i + 1; j < items.length; j++) {
      const A = items[i], Bb = items[j]; if (A.n === Bb.n) continue;
      const ua = under(A.n), ub = under(Bb.n); if (ua.includes(Bb.n) || ub.includes(A.n)) continue;
      if (!overlap(A.scr, Bb.scr)) continue;
      const k = nearer(A.q.fp, Bb.q.fp); if (k > 0) after.get(A).add(Bb); else if (k < 0) after.get(Bb).add(A);
    }
    const seen = new Set(), visit = it => { if (seen.has(it)) return; seen.add(it); after.get(it).forEach(visit); out.push(it); };
    items.slice().sort((a, b) => Math.max(...b.q.fp.map(p => p[1])) - Math.max(...a.q.fp.map(p => p[1]))).forEach(visit);
    return out;
  }

  // ---------- одне крило: стіна, підлога, екран, антресоль, підвіси, колони, зони ----------
  function side(L, opt) {
    const WALL = catmull(L.wall, 4), EDGE = L.mezz ? L.mezz.edge : [];
    const ZONE = (L.items || []).filter(B => B.layer !== 'up'), UP = (L.items || []).filter(B => B.layer === 'up');
    const ORDER = plan(ZONE), ORDER_UP = plan(UP), COLS = plan(L.cols || []);
    function drawWall(c) {
      for (let i = 0; i + 1 < WALL.length; i++) {
        const [x0, z0] = WALL[i], [x1, z1] = WALL[i + 1], ang = Math.abs(Math.atan2(z0 - z1, Math.abs(x1 - x0))), k = Math.max(0, Math.min(1, 1 - ang / 1.4));
        const col = `rgb(${Math.round(18 + 16 * k)},${Math.round(14 + 12 * k)},${Math.round(42 + 28 * k)})`;
        face(c, [[x0, CEIL, z0], [x1, CEIL, z1], [x1, FL, z1], [x0, FL, z0]], col); face(c, [[x0, CEIL, z0], [x1, CEIL, z1], [x1, FL, z1], [x0, FL, z0]], null, col, .6);
        for (let y = CEIL + 20; y < FL - 10; y += 40) seg(c, [x0, y, z0], [x1, y, z1], '#0a0820', .9);
      }
      let acc = 0; for (let i = 0; i + 1 < WALL.length; i++) {
        const [x0, z0] = WALL[i], [x1, z1] = WALL[i + 1], L0 = Math.hypot(x1 - x0, z1 - z0);
        for (let s = (56 - acc % 56) % 56; s < L0; s += 56) { const u = s / L0, x = x0 + (x1 - x0) * u, z = z0 + (z1 - z0) * u, a = pr([x, CEIL, z]), b = pr([x, FL, z]); c.fillStyle = '#2e2570'; c.fillRect(a[0] - 1.5, a[1], 3, b[1] - a[1]); c.fillStyle = '#4a3ca8'; c.fillRect(a[0] - 1.5, a[1], .8, b[1] - a[1]); }
        acc += L0;
      }
      for (let i = 0; i + 1 < WALL.length; i++) {
        const [x0, z0] = WALL[i], [x1, z1] = WALL[i + 1];
        seg(c, [x0, 150, z0], [x1, 150, z1], '#4a5a8a', 3); seg(c, [x0, 150, z0], [x1, 150, z1], '#8a9ac8', 1);
        seg(c, [x0, FL - 7, z0], [x1, FL - 7, z1], '#ff4fd8', 1.4);
      }
    }
    function drawFloor(c) {
      const W = WALL.map(([x, z]) => pr([x, FL, z])), [a0, a1] = opt.floorX;
      c.fillStyle = '#0d0826'; c.beginPath(); c.moveTo(a0, 368); W.forEach(([x, y]) => c.lineTo(x, y)); c.lineTo(a1, W[W.length - 1][1]); c.lineTo(a1, 368); c.closePath(); c.fill();
      for (let i = -20; i < 20; i++) { const xw = 774 + i * 48; seg(c, [xw, FL, 220], [xw, FL, -60], '#1c1446', .8); }
      for (const z of [160, 120, 85, 55, 28, 5]) seg(c, [-200, FL, z], [1800, FL, z], '#1a1240', .8);
    }
    function drawHub(c) {
      const H = L.hub; if (!H) return;
      const q = geo({ x: H.x != null ? H.x : (H.x0 + H.x1) / 2, z: H.z, turn: H.turn || 0, w: H.w || H.x1 - H.x0, dep: 2, yb: H.y1, yt: H.y0, deco: H.deco || [] });
      face(c, q.F.front, '#071a5a', '#3be8ff', 1.1); (q.B.deco || []).forEach(d => deco(c, q, d, 0));
      if (H.strip) { const s = H.strip, g = geo({ x: (s.x0 + s.x1) / 2, z: H.z, turn: 0, w: s.x1 - s.x0, dep: 2, yb: s.y1, yt: s.y0, deco: s.deco || [] }); face(c, g.F.front, '#0c1238', '#5a6ad8', .9); g.B.deco.forEach(d => deco(c, g, d, 0)); }
    }
    function nearestWall(p) { let best = null, bd = 1e9; for (let i = 0; i + 1 < WALL.length; i++) { const a = WALL[i], b = WALL[i + 1], dx = b[0] - a[0], dz = b[1] - a[1], t = Math.max(0, Math.min(1, ((p[0] - a[0]) * dx + (p[1] - a[1]) * dz) / (dx * dx + dz * dz))), q = [a[0] + dx * t, a[1] + dz * t], d = Math.hypot(q[0] - p[0], q[1] - p[1]); if (d < bd) { bd = d; best = q; } } return best; }
    function drawSoffit(c) {
      if (!EDGE.length) return;
      const { yb } = L.mezz, W = EDGE.map(nearestWall);
      face(c, [...EDGE.map(p => [p[0], yb, p[1]]), ...W.slice().reverse().map(p => [p[0], yb, p[1]])], '#0a0822');
      EDGE.forEach((p, i) => { if (i % 2) return; const w = W[i]; seg(c, [p[0], yb, p[1]], [w[0], yb, w[1]], '#1a1540', 1.5); });
      for (let i = 0; i + 1 < W.length; i++) seg(c, [W[i][0], yb, W[i][1]], [W[i + 1][0], yb, W[i + 1][1]], '#4a3c9a', 2.2);
    }
    function drawSlab(c) {
      if (!EDGE.length) return;
      const { yt, yb } = L.mezz;
      for (let i = 0; i + 1 < EDGE.length; i++) {
        const [x0, z0] = EDGE[i], [x1, z1] = EDGE[i + 1];
        face(c, [[x0, yt, z0], [x1, yt, z1], [x1, yb, z1], [x0, yb, z0]], '#2a2060');
        seg(c, [x0, yt, z0], [x1, yt, z1], '#ff4fd8', 1.1); seg(c, [x0, yb, z0], [x1, yb, z1], '#ff4fd8', .8);
        seg(c, [x0, (yt + yb) / 2, z0], [x1, (yt + yb) / 2, z1], '#c86aff', 2.2);
      }
      const e0 = EDGE[0], W0 = nearestWall(e0); face(c, [[e0[0], yt, e0[1]], [W0[0], yt, W0[1]], [W0[0], yb, W0[1]], [e0[0], yb, e0[1]]], '#1e1848', '#ff4fd866', .6);
    }
    function drawRail(c) {
      if (!EDGE.length) return;
      const { yt } = L.mezz;
      for (let i = 0; i + 1 < EDGE.length; i++) {
        const [x0, z0] = EDGE[i], [x1, z1] = EDGE[i + 1];
        seg(c, [x0, yt - 24, z0], [x1, yt - 24, z1], '#bcc5e6', 1.4); seg(c, [x0, yt - 12, z0], [x1, yt - 12, z1], '#6a7298', .8);
        seg(c, [x0, yt, z0], [x0, yt - 24, z0], '#848db4', .8);
      }
    }
    function drawHang(c, t) {
      (L.hang || []).forEach(h => {
        const y0 = h.from != null ? h.from : (L.mezz ? L.mezz.yb : 56), y1 = y0 + h.len;
        if (h.kind === 'vine') { const g = geo({ x: h.x, z: h.z, turn: h.turn || 0, w: h.w || 14, dep: 3, yb: y1, yt: y0 }); face(c, g.F.front, '#24703c', '#3aa858', .7); haze(c, g.F.front, h.z); return; }
        seg(c, [h.x, y0, h.z], [h.x, y1, h.z], '#0a0612', 1.1);
        const big = h.kind === 'gold' || h.kind === 'red', g = geo({ x: h.x, z: h.z - 4, turn: h.turn || 0, w: big ? 14 : 8, dep: big ? 14 : 8, yb: y1 + (big ? 22 : 12), yt: y1, st: h.kind === 'red' ? 'neon' : big ? 'gold' : 'lamp', glow: 1, gr: big ? 40 : 26, gcol: h.kind === 'red' ? '255,80,80' : undefined, cyl: big ? 10 : 0 });
        drawItem(c, { q: g }, t);
      });
    }
    function drawArm(c) {
      const A = L.arm; if (!A) return; const P2 = A.map(pr);
      [[6, '#2a2450'], [3.6, '#5a5490'], [1.2, '#9a94d0']].forEach(([lw, col]) => { c.strokeStyle = col; c.lineWidth = lw; c.lineCap = 'round'; c.beginPath(); P2.forEach(([x, y], i) => i ? c.lineTo(x, y) : c.moveTo(x, y)); c.stroke(); });
      P2.forEach(([x, y], i) => { const r = i === 0 || i === P2.length - 1 ? 3 : 5; c.fillStyle = '#3a3470'; c.beginPath(); c.arc(x, y, r, 0, 7); c.fill(); c.strokeStyle = i === P2.length - 1 ? '#ffb24a' : '#9a94d0'; c.lineWidth = 1; c.stroke(); });
      const [hx, hy] = P2[P2.length - 1]; c.save(); c.globalCompositeOperation = 'lighter'; const g = c.createRadialGradient(hx, hy, 0, hx, hy, 14); g.addColorStop(0, 'rgba(255,170,80,.5)'); g.addColorStop(1, 'rgba(255,170,80,0)'); c.fillStyle = g; c.fillRect(hx - 14, hy - 14, 28, 28); c.restore();
    }
    return {
      order: ORDER.map(it => it.n.B.id + ':' + it.mode),
      draw(c, t) {
        c.save(); c.beginPath(); opt.wallClip.forEach(([x, y], i) => i ? c.lineTo(x, y) : c.moveTo(x, y)); c.closePath(); c.clip();
        c.fillStyle = '#0b0820'; c.fillRect(opt.fill[0], -2, opt.fill[1] - opt.fill[0], 370);
        drawFloor(c); drawWall(c); if (!BASE) drawHub(c);
        c.restore();
        if (BASE) return;
        c.save(); c.beginPath(); c.rect(...opt.zoneClip); c.clip();
        COLS.forEach(it => drawItem(c, it, t, it.mode));
        drawSoffit(c); drawSlab(c);
        ORDER_UP.forEach(it => drawItem(c, it, t, it.mode));
        drawRail(c); drawHang(c, t);
        let armDone = false; const lastArm = ORDER.map(it => it.n.B.zone).lastIndexOf(L.armZone || 'workshop');
        ORDER.forEach((it, i) => { drawItem(c, it, t, it.mode); if (i === lastArm && !armDone) { drawArm(c); armDone = true; } });
        if (!armDone) drawArm(c);
        c.restore();
      },
    };
  }
  const { L: WL, R: WR } = NX.cfg.WIN;                                                                  // краї вікна (core/config.js)
  const Rs = ALL.right && side(ALL.right, { wallClip: [[WR, -2], [1547, -2], [1547, 470], [887.5, 470], [887.5, 346], [WR, 346]], fill: [887.5, 1547], floorX: [887.5, 1560], zoneClip: [860, -2, 690, 480] });
  const Ls = ALL.left && side(ALL.left, { wallClip: [[-12, -2], [WL, -2], [WL, 346], [664, 346], [664, 470], [-12, 470]], fill: [-12, 664], floorX: [664, -20], zoneClip: [-12, -2, 700, 480] });
  NX.rwingBox = { ALL, right: Rs && Rs.order, left: Ls && Ls.order };
  if (Ls) NX.addObject({ id: 'lwingBox', rw: true, span: [0, 700], drawBack(c, t) { if (!offDone) { off(); offDone = true; } Ls.draw(c, t); } });
  if (Rs) NX.addObject({ id: 'rwingBox', rw: true, span: [860, 1536], drawBack(c, t) { if (!offDone) { off(); offDone = true; } Rs.draw(c, t); } });
})();

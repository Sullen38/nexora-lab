/* ============================================================================
 * objects/rwing_box.js — СІРИЙ МАКЕТ ПРАВОГО КРИЛА «ПО ДУЗІ» (лише для погодження; вмикається адресою #rw-box)
 * ----------------------------------------------------------------------------
 * Кімната зверху — пів кола: вікно в найдальшій точці, праворуч стіна загинається дугою до глядача. Зони стоять
 * СПИНОЮ ДО ДУГИ й дивляться в її центр: майстерня біля вікна — прямо, інструменти посередині — на 36° (лицем до нас),
 * портал наприкінці дуги — на 86° (лицем до центру кімнати; тому до нас дивиться його ПРАВА сторона, а брама з вихором
 * видна під кутом, як екран AI-центру на лівій стіні). Портал — найближчий (найбільший, низ найнижче).
 * Геометрія — справжні коробки в перспективі кімнати (NX.persp: VP 774/220, D 520; око — (774, 220, -520)):
 *   - жодна коробка не входить в іншу (сліди на підлозі не перетинаються — перевірка в scratchpad plan.py);
 *   - хто кого закриває — за роздільною лінією в плані: з того боку, де око, — ближче (малюється пізніше);
 *   - антресоль і її спід вище за всі зони (y < 70), тому ніколи не закривають їх — малюються перед зонами;
 *   - стіна — гладка дуга (Catmull-Rom через опорні точки), шви сходяться до вікна, ребра на рівних кроках.
 * Розкладку можна підмінити для проб: window.RWBOX = {...} до завантаження сторінки.
 * Світ: план (x, z) і висота y; z = 0 — площина картинки, підлога y = 372.
 * ========================================================================== */
(() => {
  if (!/rw-box/.test(location.hash)) return;
  const PZ = NX.persp, VP = PZ.VP, D = PZ.D, EYE = [VP[0], -D], FL = 372, CEIL = -240;
  const pr = q => PZ.p(q[0], q[1], q[2]);
  // ---- вимкнути поточне праве крило (лише в цьому режимі) ----
  const OFF = ['workshop', 'tools', 'portal', 'rwingBack', 'rwingMezz', 'rwingFloor', 'rwingPlants', 'rwingAir'];
  Object.values(NX.objects).forEach(o => { if (OFF.includes(o.id) || /^r[pg]_/.test(o.id)) { o.drawBack = null; o.layers = null; o.draw = () => {}; } });

  // розкладка «по дузі» (scratchpad arc_gen.py): стіна — пряма до x 1200, далі дуга R 225; кожна зона стоїть спиною до дуги
  // й дивиться в її центр (turn = кут на дузі): майстерня 0°, інструменти 36° (дивляться прямо на нас), портал 86° (до нас — його права сторона)
  // розміри зон — крок 15% (власник): портал 100, інструменти 85, майстерня 72 (висота обрису на екрані)
  const LAYOUT = {"wall":[[1039.7,185],[1200,185],[1239.1,181.6],[1277.0,171.4],[1312.5,154.9],[1344.6,132.4],[1372.4,104.6],[1394.9,72.5],[1411.4,37.0],[1421.6,-0.9],[1425.0,-40.0],[1421.6,-79.1]],"mezz":{"edge":[[1242.7,109.0],[1258.1,103.7],[1272.8,96.9],[1286.7,88.5],[1299.6,78.7],[1311.5,67.7],[1322.1,55.4],[1331.4,42.1],[1339.3,27.9],[1345.7,13.0],[1350.4,-2.5],[1353.5,-18.4],[1354.9,-34.6],[1354.6,-50.8],[1352.6,-66.9],[1349.0,-82.7],[1343.7,-98.1],[1336.9,-112.8]],"yt":30,"yb":56,"pots":[3,7,11]},"hub":{"x0":1046,"x1":1200,"y0":-64,"y1":145,"z":184},"zones":[{"id":"mach","parts":[{"x":964.0,"z":161.4,"turn":0,"w":70.8,"dep":24,"yb":372,"yt":159.7,"kind":"mach"}],"acc":"#3be8ff"},{"id":"workshop","key":"nav.workshop","parts":[{"x":1058.4,"z":117.4,"turn":0,"w":230.5,"dep":40,"yb":372,"yt":354.8},{"x":1056.1,"z":117.4,"back":4,"turn":0,"w":136.1,"dep":34,"yb":354.8,"yt":153.2,"kind":"capsule"},{"x":1155.0,"z":117.4,"back":10,"turn":0,"w":29.9,"dep":22,"yb":354.8,"yt":234.9,"kind":"console","style":"mach"}],"acc":"#ff4fd8"},{"id":"tools","key":"nav.tools","parts":[{"x":1294.1,"z":89.5,"turn":36,"w":150,"dep":50,"yb":372,"yt":324},{"x":1294.1,"z":89.5,"back":36,"turn":36,"w":130,"dep":12,"yb":324,"yt":140,"kind":"board"}],"acc":"#3be8ff"},{"id":"portal","key":"nav.portal","parts":[{"x":1347.6,"z":-19.2,"turn":82,"w":104,"dep":70,"yb":372,"yt":359},{"x":1347.6,"z":-19.2,"back":24,"turn":82,"w":84,"dep":46,"yb":359,"yt":156,"kind":"gate"}],"acc":"#d98aff"}],"hang":[{"x":1279.3,"z":138.1,"len":56,"kind":"vine"},{"x":1303.3,"z":125.4,"len":32,"kind":"lamp"},{"x":1330.5,"z":104.9,"len":50,"kind":"vine"},{"x":1353.7,"z":80.1,"len":30,"kind":"lamp"},{"x":1372.2,"z":51.5,"len":54,"kind":"vine"},{"x":1387.5,"z":-3.6,"len":40,"kind":"lamp"}],"arm":[[1226,150,176],[1180,96,160],[1100,96,146],[1062,128,140]]};
  const L = window.RWBOX || LAYOUT;
  const STY = {
    workshop: { acc: '#ff4fd8', front: '#241048', side: '#150a30', top: '#2c1658' },
    tools: { acc: '#3be8ff', front: '#10204e', side: '#0a1434', top: '#1a2a62' },
    portal: { acc: '#d98aff', front: '#1e1046', side: '#130a33', top: '#2a1660' },
    mach: { acc: '#3be8ff', front: '#1a1440', side: '#100c2a', top: '#2a2058' },
    prop: { acc: '#8a7ad0', front: '#221a4e', side: '#140f32', top: '#30266a' },
    plant: { acc: '#7ae08a', front: '#1e5a3a', side: '#123020', top: '#2e7a4a' },
    pillar: { acc: '#ff4fd8', front: '#2c2470', side: '#1a1448', top: '#2c2470' },
  };

  // ---------- криві ----------
  function catmull(pts, n = 6) {
    const P = [pts[0], ...pts, pts[pts.length - 1]], out = [];
    for (let i = 1; i < P.length - 2; i++) {
      const [p0, p1, p2, p3] = [P[i - 1], P[i], P[i + 1], P[i + 2]];
      for (let k = 0; k < n; k++) { const t = k / n, t2 = t * t, t3 = t2 * t; out.push([0, 1].map(c => .5 * (2 * p1[c] + (-p0[c] + p2[c]) * t + (2 * p0[c] - 5 * p1[c] + 4 * p2[c] - p3[c]) * t2 + (-p0[c] + 3 * p1[c] - 3 * p2[c] + p3[c]) * t3))); }
    }
    out.push(pts[pts.length - 1]); return out;
  }
  const WALL = catmull(L.wall, 6);
  const EDGE = L.mezz ? catmull(L.mezz.edge, 6) : [];

  // ---------- коробки ----------
  /** (x, z) — середина передньої грані на підлозі; turn — поворот до центру (°); back — відступ углиб від цієї лінії. */
  function geo(B) {
    const a = (B.turn || 0) * Math.PI / 180, f = [-Math.sin(a), -Math.cos(a)], r = [-f[1], f[0]];     // f — «уперед» (до глядача й до центру), r — «праворуч»
    const c = [B.x - f[0] * (B.back || 0), B.z - f[1] * (B.back || 0)];
    const P = (u, v, y) => [c[0] + r[0] * u - f[0] * v, y, c[1] + r[1] * u - f[1] * v];
    const w = B.w / 2, d = B.dep;
    const F = { front: [P(-w, 0, B.yb), P(w, 0, B.yb), P(w, 0, B.yt), P(-w, 0, B.yt)], left: [P(-w, d, B.yb), P(-w, 0, B.yb), P(-w, 0, B.yt), P(-w, d, B.yt)],
      right: [P(w, 0, B.yb), P(w, d, B.yb), P(w, d, B.yt), P(w, 0, B.yt)], top: [P(-w, d, B.yt), P(w, d, B.yt), P(w, 0, B.yt), P(-w, 0, B.yt)] };
    const toEye = pts => { const m = [0, 2].map(i => pts.reduce((s, q) => s + q[i], 0) / 4); return [EYE[0] - m[0], EYE[1] - m[1]]; };
    const dot = (n, v) => n[0] * v[0] + n[1] * v[1];
    const fp = [[P(-w, 0, 0)[0], P(-w, 0, 0)[2]], [P(w, 0, 0)[0], P(w, 0, 0)[2]], [P(w, d, 0)[0], P(w, d, 0)[2]], [P(-w, d, 0)[0], P(-w, d, 0)[2]]];
    return { B, F, P, fp, zc: c[1], vis: { front: dot(f, toEye(F.front)) > 0, left: dot([-r[0], -r[1]], toEye(F.left)) > 0, right: dot(r, toEye(F.right)) > 0, top: B.yt > VP[1] } };
  }
  // опукла оболонка сліду зони (для порядку малювання)
  function hull(pts) {
    pts = pts.slice().sort((a, b) => a[0] - b[0] || a[1] - b[1]);
    const cr = (o, a, b) => (a[0] - o[0]) * (b[1] - o[1]) - (a[1] - o[1]) * (b[0] - o[0]), lo = [], up = [];
    for (const p of pts) { while (lo.length >= 2 && cr(lo[lo.length - 2], lo[lo.length - 1], p) <= 0) lo.pop(); lo.push(p); }
    for (const p of pts.slice().reverse()) { while (up.length >= 2 && cr(up[up.length - 2], up[up.length - 1], p) <= 0) up.pop(); up.push(p); }
    return lo.slice(0, -1).concat(up.slice(0, -1));
  }
  /** Хто ближче: шукаємо ребро-роздільник; з якого боку око — той і ближчий. -> 1: A ближче, -1: B ближче, 0: перетин */
  function nearer(A, B) {
    for (const [poly, other, sign] of [[A, B, 1], [B, A, -1]]) {
      const n = poly.length, cx = poly.reduce((s, p) => s + p[0], 0) / n, cz = poly.reduce((s, p) => s + p[1], 0) / n;
      for (let i = 0; i < n; i++) {
        const a = poly[i], b = poly[(i + 1) % n]; let nx = b[1] - a[1], nz = -(b[0] - a[0]);
        if (nx * (cx - a[0]) + nz * (cz - a[1]) > 0) { nx = -nx; nz = -nz; }
        if (other.every(q => nx * (q[0] - a[0]) + nz * (q[1] - a[1]) >= -.01)) {
          const eyeOut = nx * (EYE[0] - a[0]) + nz * (EYE[1] - a[1]) > 0;            // око з боку «іншого» — той ближчий
          return eyeOut ? -sign : sign;
        }
      }
    }
    return 0;
  }
  function order(items) {
    const after = new Map(items.map(it => [it, new Set()]));
    for (let i = 0; i < items.length; i++) for (let j = i + 1; j < items.length; j++) {
      const k = nearer(items[i].hull, items[j].hull);
      if (k > 0) after.get(items[i]).add(items[j]); else if (k < 0) after.get(items[j]).add(items[i]);
    }
    const out = [], seen = new Set(), visit = it => { if (seen.has(it)) return; seen.add(it); after.get(it).forEach(visit); out.push(it); };
    items.slice().sort((a, b) => Math.max(...b.hull.map(p => p[1])) - Math.max(...a.hull.map(p => p[1]))).forEach(visit);
    return out;
  }

  // ---------- малювання ----------
  const path = (c, pts) => { c.beginPath(); pts.forEach((q, i) => { const [x, y] = pr(q); i ? c.lineTo(x, y) : c.moveTo(x, y); }); c.closePath(); };
  const face = (c, pts, fill, line, lw = .8) => { path(c, pts); if (fill) { c.fillStyle = fill; c.fill(); } if (line) { c.strokeStyle = line; c.lineWidth = lw; c.stroke(); } };
  const seg = (c, a, b, col, lw = .7) => { const [x0, y0] = pr(a), [x1, y1] = pr(b); c.strokeStyle = col; c.lineWidth = lw; c.beginPath(); c.moveTo(x0, y0); c.lineTo(x1, y1); c.stroke(); };
  const haze = (c, pts, z) => { const k = Math.max(0, Math.min(.4, (z - 0) / 380)); if (k > .01) face(c, pts, `rgba(6,4,20,${k.toFixed(3)})`); };   // дальнє — темніше
  const FP = (q, fu, fy) => q.P(-q.B.w / 2 + fu * q.B.w, -.25, q.B.yt + fy * (q.B.yb - q.B.yt));            // точка на лицьовій грані (частки ширини й висоти)
  const rectOn = (c, q, fu0, fu1, fy0, fy1, fill, line) => face(c, [FP(q, fu0, fy1), FP(q, fu1, fy1), FP(q, fu1, fy0), FP(q, fu0, fy0)], fill, line, .7);
  const KIND = {
    capsule(c, q, S) { rectOn(c, q, .06, .94, .04, .2, '#0a0620', '#ff84d4'); rectOn(c, q, .12, .88, .27, .95, '#6a1670', '#ff7af0'); },
    console(c, q) { [.08, .32, .56].forEach(y => rectOn(c, q, .14, .86, y, y + .18, '#14204a', '#3be8ff')); },
    mach(c, q) { rectOn(c, q, .14, .86, .08, .2, '#0a0620', '#3be8ff'); rectOn(c, q, .14, .86, .3, .62, '#14204a', '#3be8ff'); },
    board(c, q) { rectOn(c, q, .06, .94, .05, .2, '#0a0620', '#3be8ff'); [0, 1].forEach(r => [0, 1, 2].forEach(k => rectOn(c, q, .06 + k * .3 + .015, .06 + (k + 1) * .3 - .015, .27 + r * .36, .27 + (r + 1) * .36 - .03, '#1b4ccc', '#3be8ff'))); },
    pult(c, q) { rectOn(c, q, .15, .85, .1, .45, '#14204a', '#d98aff'); },
    crate(c, q) { const a = FP(q, .1, .1), b = FP(q, .9, .9), d = FP(q, .9, .1), e = FP(q, .1, .9); seg(c, a, b, '#5a4aa0', .8); seg(c, d, e, '#5a4aa0', .8); },
    gate(c, q, S, t) {
      rectOn(c, q, .12, .88, .05, .16, '#0a0620', '#d98aff');
      const Lf = .17, Rt = .83, top0 = .22, spring = .42, pts = [FP(q, Lf, 1)];
      for (let i = 0; i <= 20; i++) { const a = Math.PI * i / 20; pts.push(FP(q, .5 - (.5 - Lf) * Math.cos(a), spring - (spring - top0) * Math.sin(a))); }
      pts.push(FP(q, Rt, 1)); face(c, pts, '#2a0f6a', '#3be8ff', 1);
      const asp = q.B.w / (q.B.yb - q.B.yt);
      [[.28, '#4a22a8'], [.2, '#6a3ad8'], [.12, '#9a7af0'], [.05, '#e8dcff']].forEach(([rr, col], k) => face(c, Array.from({ length: 28 }, (_, i) => { const a = Math.PI * 2 * i / 28 + t * (k % 2 ? .6 : -.6); return FP(q, .5 + rr * Math.cos(a), .64 + rr * asp * 1.3 * Math.sin(a)); }), col));
    },
  };
  function drawPart(c, S, q, t, mode) {                                  // mode: 'top' — лише верх, 'body' — без верху, інакше все
    const { B, F, vis } = q, acc = S.acc;
    if (mode !== 'body' && vis.top && B.yt > VP[1]) { face(c, F.top, S.top, acc + '88', .5); haze(c, F.top, q.zc + B.dep / 2); }
    if (mode === 'top') return;
    if (vis.left) { face(c, F.left, S.side, acc + '77', .5); haze(c, F.left, q.zc + B.dep / 2); }
    if (vis.right) { face(c, F.right, S.side, acc + '77', .5); haze(c, F.right, q.zc + B.dep / 2); }
    face(c, F.front, S.front, acc, 1);
    if (B.kind && KIND[B.kind]) KIND[B.kind](c, q, S, t);
    haze(c, F.front, q.zc);
  }
  function drawZone(c, Z, t) {
    const S = STY[Z.style || Z.id] || STY.prop, qs = Z.parts.map(geo), base = qs[0];
    if (qs.length > 1) {
      drawPart(c, S, base, t, 'top');                                    // верх основи — під тим, що на ній стоїть
      order(qs.slice(1).map(q => ({ q, hull: q.fp }))).forEach(it => drawPart(c, STY[it.q.B.style] || S, it.q, t));
      drawPart(c, S, base, t, 'body');
    } else drawPart(c, S, base, t);
  }
  // ---------- стіна по дузі ----------
  function drawWall(c) {
    for (let i = 0; i + 1 < WALL.length; i++) {
      const [x0, z0] = WALL[i], [x1, z1] = WALL[i + 1], ang = Math.atan2(z0 - z1, x1 - x0), k = Math.max(0, Math.min(1, 1 - ang / 1.2));
      const col = `rgb(${Math.round(18 + 18 * k)},${Math.round(14 + 14 * k)},${Math.round(42 + 32 * k)})`;
      face(c, [[x0, CEIL, z0], [x1, CEIL, z1], [x1, FL, z1], [x0, FL, z0]], col); face(c, [[x0, CEIL, z0], [x1, CEIL, z1], [x1, FL, z1], [x0, FL, z0]], null, col, .6);
      for (let y = CEIL + 20; y < FL - 10; y += 40) seg(c, [x0, y, z0], [x1, y, z1], '#0a0820', .9);                  // горизонтальні шви
    }
    let acc = 0; for (let i = 0; i + 1 < WALL.length; i++) {                                                          // ребра-пілястри кожні ~60 од. вздовж дуги
      const [x0, z0] = WALL[i], [x1, z1] = WALL[i + 1], L0 = Math.hypot(x1 - x0, z1 - z0);
      for (let s = (60 - acc % 60) % 60; s < L0; s += 60) { const u = s / L0, x = x0 + (x1 - x0) * u, z = z0 + (z1 - z0) * u, a = pr([x, CEIL, z]), b = pr([x, FL, z]); c.fillStyle = '#2e2570'; c.fillRect(a[0] - 1.6, a[1], 3.2, b[1] - a[1]); c.fillStyle = '#4a3ca8'; c.fillRect(a[0] - 1.6, a[1], .8, b[1] - a[1]); }
      acc += L0;
    }
    for (let i = 0; i + 1 < WALL.length; i++) {
      const [x0, z0] = WALL[i], [x1, z1] = WALL[i + 1];
      seg(c, [x0, 118, z0], [x1, 118, z1], '#4a5a8a', 3); seg(c, [x0, 118, z0], [x1, 118, z1], '#8a9ac8', 1);         // труба вздовж стіни
      seg(c, [x0, FL - 7, z0], [x1, FL - 7, z1], '#ff4fd8', 1.4);                                                     // неоновий плінтус
    }
  }
  // ---------- антресоль: спід, лицьова грань, поруччя, вазони (усе вище за зони — малюється перед ними) ----------
  function nearestWall(p) { let best = null, bd = 1e9; for (let i = 0; i + 1 < WALL.length; i++) { const a = WALL[i], b = WALL[i + 1], dx = b[0] - a[0], dz = b[1] - a[1], t = Math.max(0, Math.min(1, ((p[0] - a[0]) * dx + (p[1] - a[1]) * dz) / (dx * dx + dz * dz))), q = [a[0] + dx * t, a[1] + dz * t], d = Math.hypot(q[0] - p[0], q[1] - p[1]); if (d < bd) { bd = d; best = q; } } return best; }
  function drawMezz(c) {
    if (!EDGE.length) return;
    const { yt, yb } = L.mezz, W0 = nearestWall(EDGE[0]), Wn = nearestWall(EDGE[EDGE.length - 1]);
    const wi0 = WALL.findIndex(p => p[0] >= W0[0]), win = WALL.findIndex(p => p[0] >= Wn[0]);
    const back = [W0, ...WALL.slice(wi0, win < 0 ? WALL.length : win), Wn];
    face(c, [...EDGE.map(p => [p[0], yb, p[1]]), ...back.reverse().map(p => [p[0], yb, p[1]])], '#0a0822');          // спід (стеля під антресоллю)
    EDGE.forEach((p, i) => { if (i % 2) return; const w = nearestWall(p); seg(c, [p[0], yb, p[1]], [w[0], yb, w[1]], '#1a1540', 1.5); });   // балки спіду — до стіни
    for (let i = 0; i + 1 < WALL.length; i++) if (WALL[i][0] >= W0[0] - 1) seg(c, [WALL[i][0], yb, WALL[i][1]], [WALL[i + 1][0], yb, WALL[i + 1][1]], '#4a3c9a', 2.2);   // стик зі стіною
    // вазони на антресолі (за поруччям, більшають до глядача)
    (L.mezz.pots || []).forEach(i => { const p = EDGE[i], q = EDGE[i + 1] || p, w = nearestWall(p), dir = [w[0] - p[0], w[1] - p[1]], dl = Math.hypot(...dir) || 1, m = [p[0] + dir[0] / dl * 22, p[1] + dir[1] / dl * 22];
      const turn = Math.atan2(q[0] - p[0], -(q[1] - p[1])) * 180 / Math.PI - 90;
      drawPart(c, STY.plant, geo({ x: m[0], z: m[1], turn: -Math.atan2(-(q[1] - p[1]), q[0] - p[0]) * 180 / Math.PI, w: 24, dep: 20, yb: yt, yt: yt - 28 }), 0); });
    for (let i = 0; i + 1 < EDGE.length; i++) {
      const [x0, z0] = EDGE[i], [x1, z1] = EDGE[i + 1];
      face(c, [[x0, yt, z0], [x1, yt, z1], [x1, yb, z1], [x0, yb, z0]], '#2a2060');                                  // лицьова грань плити
      seg(c, [x0, yt, z0], [x1, yt, z1], '#ff4fd8', 1.1); seg(c, [x0, yb, z0], [x1, yb, z1], '#ff4fd8', .8);
      seg(c, [x0, yb - 3, z0], [x1, yb - 3, z1], '#3be8ff', 1.4);                                                     // LED-смуга
      seg(c, [x0, yt - 26, z0], [x1, yt - 26, z1], '#bcc5e6', 1.4); seg(c, [x0, yt - 13, z0], [x1, yt - 13, z1], '#6a7298', .8);   // поруччя
      seg(c, [x0, yt, z0], [x0, yt - 26, z0], '#848db4', .8);                                                         // балясини
    }
    const e0 = EDGE[0]; face(c, [[e0[0], yt, e0[1]], [W0[0], yt, W0[1]], [W0[0], yb, W0[1]], [e0[0], yb, e0[1]]], '#1e1848', '#ff4fd866', .6);   // торець біля колони
  }
  // ---------- підвіси під антресоллю (лампи, ліани) і маніпулятор майстерні — заглушки, щоб видно було, чим заповнимо ----------
  function drawHang(c, t) {
    (L.hang || []).forEach(h => {
      const y0 = L.mezz ? L.mezz.yb : 56, y1 = y0 + h.len;
      if (h.kind === 'vine') { drawPart(c, STY.plant, geo({ x: h.x, z: h.z, turn: 0, w: 14, dep: 4, yb: y1, yt: y0 }), t); return; }
      seg(c, [h.x, y0, h.z], [h.x, y1, h.z], '#0a0612', 1.1);
      const g = geo({ x: h.x, z: h.z - 4, turn: 0, w: 8, dep: 8, yb: y1 + 12, yt: y1 }); drawPart(c, { acc: '#ffd27a', front: '#ffb24a', side: '#c0782a', top: '#ffd27a' }, g, t);
      const [cx, cy] = pr([h.x, y1 + 6, h.z]); c.save(); c.globalCompositeOperation = 'lighter'; const gr = c.createRadialGradient(cx, cy, 0, cx, cy, 26); gr.addColorStop(0, 'rgba(255,190,110,.35)'); gr.addColorStop(1, 'rgba(255,190,110,0)'); c.fillStyle = gr; c.fillRect(cx - 26, cy - 26, 52, 52); c.restore();
    });
  }
  function drawArm(c) {
    const A = L.arm; if (!A) return; const P2 = A.map(pr);
    [[5, '#2a2450'], [3, '#5a5490'], [1, '#9a94d0']].forEach(([lw, col]) => { c.strokeStyle = col; c.lineWidth = lw; c.lineCap = 'round'; c.beginPath(); P2.forEach(([x, y], i) => i ? c.lineTo(x, y) : c.moveTo(x, y)); c.stroke(); });
    P2.forEach(([x, y], i) => { c.fillStyle = i ? '#ff4fd8' : '#3be8ff'; c.beginPath(); c.arc(x, y, i ? 3 : 4, 0, 7); c.fill(); c.fillStyle = '#0a0620'; c.beginPath(); c.arc(x, y, 1.4, 0, 7); c.fill(); });
  }
  // ---------- підлога під крилом ----------
  function drawFloor(c) {
    c.fillStyle = '#0d0826'; c.beginPath(); const W = WALL.map(([x, z]) => pr([x, FL, z])); c.moveTo(887.5, 368); c.lineTo(887.5, W[0][1]); W.forEach(([x, y]) => c.lineTo(x, y)); c.lineTo(1560, W[W.length - 1][1]); c.lineTo(1560, 368); c.lineTo(887.5, 368); c.closePath(); c.fill();
    for (let i = -6; i < 30; i++) { const xw = 774 + i * 48; seg(c, [xw, FL, 220], [xw, FL, -60], '#1c1446', .8); }
    for (const z of [160, 120, 85, 55, 28, 5]) seg(c, [880, FL, z], [1800, FL, z], '#1a1240', .8);
  }
  function label(c, Z) {
    if (!Z.key) return; const q = geo(Z.parts[0]), [x, y] = pr(q.P(0, -2, FL)), s = NX.t(Z.key);
    c.font = '6px "Press Start 2P", monospace'; c.textAlign = 'center'; c.fillStyle = '#000'; c.fillText(s, x + .6, y + 9.6); c.fillStyle = STY[Z.id].acc; c.fillText(s, x, y + 9); c.textAlign = 'left';
  }
  // ---------- порядок малювання: по частинах (поміст, брама, пульт… — кожна окремо) ----------
  // основа з речами на ній ділиться на «верх» (під речами) і «тіло» (після них); між зонами — роздільна лінія в плані
  const ITEMS = [];
  L.zones.forEach(Z => {
    if (Z.id === 'pillar') return;
    const S = STY[Z.style || Z.id] || STY.prop, qs = Z.parts.map(geo);
    if (qs.length > 1) {
      const top = { Z, q: qs[0], S, mode: 'top', after: [] }, ups = qs.slice(1).map(q => ({ Z, q, S: STY[q.B.style] || S, mode: 'all', up: 1, after: [top] }));
      ITEMS.push(top, ...ups, { Z, q: qs[0], S, mode: 'body', after: [top, ...ups] });
    } else ITEMS.push({ Z, q: qs[0], S, mode: 'all', after: [] });
  });
  // екранний обрис частини (опукла оболонка проєкцій кутів) — порядок важить лише там, де обриси перекриваються
  ITEMS.forEach(it => { const F = it.q.F, pts = it.mode === 'top' ? F.top : [...F.front, ...F.top, ...F.left, ...F.right]; it.scr = hull(pts.map(pr)); });
  function overlap(A, B) {                                                                              // SAT для двох опуклих многокутників на екрані
    for (const poly of [A, B]) for (let i = 0; i < poly.length; i++) {
      const a = poly[i], b = poly[(i + 1) % poly.length], nx = b[1] - a[1], ny = -(b[0] - a[0]);
      const pa = A.map(p => nx * p[0] + ny * p[1]), pb = B.map(p => nx * p[0] + ny * p[1]);
      if (Math.max(...pa) <= Math.min(...pb) + .01 || Math.max(...pb) <= Math.min(...pa) + .01) return false;
    }
    return true;
  }
  const ORDER = (() => {
    const after = new Map(ITEMS.map(it => [it, new Set(it.after)]));
    for (let i = 0; i < ITEMS.length; i++) for (let j = i + 1; j < ITEMS.length; j++) {
      const A = ITEMS[i], B = ITEMS[j];
      if (A.Z === B.Z && !(A.up && B.up)) continue;                                                     // стос однієї зони — вже впорядкований
      if (!overlap(A.scr, B.scr)) continue;
      const k = nearer(A.q.fp, B.q.fp);
      if (k > 0) after.get(A).add(B); else if (k < 0) after.get(B).add(A);
    }
    const out = [], seen = new Set(), visit = it => { if (seen.has(it)) return; seen.add(it); after.get(it).forEach(visit); out.push(it); };
    ITEMS.slice().sort((a, b) => Math.max(...b.q.fp.map(p => p[1])) - Math.max(...a.q.fp.map(p => p[1]))).forEach(visit);
    return out;
  })();
  NX.rwingBox = { order: ORDER.map(it => it.Z.id + ':' + (it.q.B.kind || it.mode)), L };
  NX.addObject({
    id: 'rwingBox', rw: true, span: [884, 1536],
    drawBack(c, t) {
      // вікно, місто й правий відкіс (window_frame.js, до x 970) не чіпаємо: стіна й підлога крила — лише поза ними
      c.save(); c.beginPath(); c.moveTo(970, -2); c.lineTo(1547, -2); c.lineTo(1547, 470); c.lineTo(887.5, 470); c.lineTo(887.5, 346); c.lineTo(970, 346); c.closePath(); c.clip();
      c.fillStyle = '#0b0820'; c.fillRect(887.5, -2, 660, 370);
      drawFloor(c); drawWall(c);
      if (L.hub) { const H = L.hub; face(c, [[H.x0, H.y0, H.z], [H.x1, H.y0, H.z], [H.x1, H.y1, H.z], [H.x0, H.y1, H.z]], '#071a5a', '#3be8ff', 1.2); }   // екран NEXORA AI
      const pil = L.zones.find(Z => Z.id === 'pillar'); if (pil) drawZone(c, pil, t);
      drawMezz(c); drawHang(c, t); drawArm(c);
      c.restore();
      c.save(); c.beginPath(); c.rect(887.5, -2, 660, 480); c.clip();                                   // зони (машинерія стоїть перед відкосом вікна)
      ORDER.forEach(it => drawPart(c, it.S, it.q, t, it.mode));
      L.zones.forEach(Z => label(c, Z));
      c.restore();
    },
  });
})();

/* ============================================================================
 * objects/rwing_box.js — СІРИЙ МАКЕТ ПРАВОГО КРИЛА «ПО ДУЗІ» (лише для погодження; вмикається адресою #rw-box)
 * ----------------------------------------------------------------------------
 * Кімната зверху — пів кола: вікно в найдальшій точці дуги, праворуч по дузі до глядача — майстерня (далеко),
 * інструменти (посередині), портал (близько). Щоб це читалося на екрані:
 *   - ближча зона більша, її низ нижче, верх вище (глибина z у перспективі кімнати NX.persp: VP 774/220, D 520);
 *   - у кожної зони видно бічну грань, звернену до вікна, — ширшає від майстерні до порталу;
 *   - зони трохи повернуті до центру кімнати: майстерня прямо, інструменти на 6°, портал на 12°
 *     (верх і низ лицьової грані порталу сходяться вліво — його правий край ближче);
 *   - стіна за зонами йде дугою (ламана в плані), шви сходяться до вікна, неоновий плінтус спускається до глядача;
 *   - антресоль — пряма плита, що тікає від правого верхнього кута вглиб до колони (видно її спід — темна стеля
 *     над інструментами й порталом), поруччя й вазони на ній більшають до глядача;
 *   - дальнє темніше (легка імла за глибиною).
 * Розміри й місця зон підібрані під картинку-концепт: на екрані вони стоять там само, але тепер це справжні
 * коробки в перспективі кімнати.
 * Усе — прості грані (заливка + кант), без деталей. Поточне праве крило в цьому режимі вимикається.
 * Світ: план (x, z) і висота y; z = 0 — площина картинки, підлога y = 372, око — (774, 220, -520).
 * ========================================================================== */
(() => {
  if (!/rw-box/.test(location.hash)) return;
  const PZ = NX.persp, VP = PZ.VP, D = PZ.D, EYE = [VP[0], VP[1], -D], FL = 372, CEIL = -240;
  const pr = q => PZ.p(q[0], q[1], q[2]);
  // ---- вимкнути поточне праве крило (лише в цьому режимі) ----
  const OFF = ['workshop', 'tools', 'portal', 'rwingBack', 'rwingMezz', 'rwingFloor', 'rwingPlants', 'rwingAir'];
  Object.values(NX.objects).forEach(o => { if (OFF.includes(o.id) || /^r[pg]_/.test(o.id)) { o.drawBack = null; o.layers = null; o.draw = () => {}; } });

  // ---------- геометрія (план зверху) ----------
  const WALL = [[1039.7, 185], [1243, 185], [1454, 140], [1623, 80], [1700, -40]];        // стіна по дузі: від правого відкосу вікна до глядача
  const MZ = { a: [1249, 122], dir: [.446, -.895], len: 420, yt: 31.6, yb: 58.4 };        // антресоль: внутрішній край — від колони (далеко) до правого верхнього кута (близько)
  const OUT = [-MZ.dir[1], MZ.dir[0]];                                                  // від краю антресолі до стіни (праворуч углиб)
  const HUB = { x0: 1040, x1: 1229, y0: -64, y1: 145, z: 184 };                         // екран NEXORA AI — на дальній стіні, прямо
  const T = (fu0, fu1, fy0, fy1, fill, line) => ({ fu0, fu1, fy0, fy1, fill, line });
  const ZONES = [
    { id: 'mach', acc: '#3be8ff', parts: [{ x: 954.7, z: 127.9, turn: 0, w: 67.3, dep: 40, yb: FL, yt: 162.7, front: '#1a1440', side: '#100c2a', top: '#2a2058',
      inner: [T(.14, .86, .08, .2, '#0a0620', '#3be8ff'), T(.14, .86, .3, .62, '#14204a', '#3be8ff')] }] },
    { id: 'pillar', acc: '#ff4fd8', parts: [{ x: 1248.7, z: 122.6, turn: 0, w: 29.7, dep: 22, yb: FL, yt: CEIL, front: '#2c2470', side: '#1a1448', clear: 1 }] },
    { id: 'workshop', key: 'nav.workshop', acc: '#ff4fd8', parts: [
      { x: 1058.4, z: 117.4, turn: 0, w: 230.5, dep: 56, yb: FL, yt: 354.8, front: '#1c1546', side: '#120e30', top: '#2a2058' },                          // платформа
      { x: 1057, z: 117.4, back: 8, turn: 0, w: 136.5, dep: 44, yb: 354.8, yt: 153, front: '#241048', side: '#150a30', top: '#2c1658',                     // капсула
        inner: [T(.06, .94, .04, .2, '#0a0620', '#ff84d4'), T(.12, .88, .27, .95, '#6a1670', '#ff7af0')] }] },
    { id: 'term', acc: '#3be8ff', parts: [{ x: 1195, z: 107.3, turn: 0, w: 55.5, dep: 30, yb: FL, yt: 189.8, front: '#18143e', side: '#0f0b28', top: '#28205a',
      inner: [T(.12, .88, .06, .22, '#14204a', '#3be8ff'), T(.12, .88, .26, .42, '#14204a', '#3be8ff'), T(.12, .88, .46, .62, '#14204a', '#3be8ff')] }] },
    { id: 'tools', key: 'nav.tools', acc: '#3be8ff', parts: [
      { x: 1304.6, z: 78.9, turn: 6, w: 182.2, dep: 56, yb: FL, yt: 321.3, front: '#1a0f3a', side: '#100826', top: '#3a1c5a' },                           // верстат
      { x: 1334.4, z: 78.9, back: 40, turn: 6, w: 152.5, dep: 14, yb: 321.3, yt: 148.8, front: '#0e1a4a', side: '#081030', top: '#14245a',                 // дошка: вивіска + 6 плиток
        inner: [T(.06, .94, .05, .2, '#0a0620', '#3be8ff'), ...[0, 1].flatMap(r => [0, 1, 2].map(k => T(.06 + k * .3 + .015, .06 + (k + 1) * .3 - .015, .27 + r * .36, .27 + (r + 1) * .36 - .03, '#1b4ccc', '#3be8ff')))] }] },
    { id: 'portal', key: 'nav.portal', acc: '#d98aff', parts: [
      { x: 1456.7, z: 29.6, turn: 12, w: 191.2, dep: 64, yb: FL, yt: 359.3, front: '#141038', side: '#0c0a28', top: '#241a58' },                          // поміст
      { x: 1463.1, z: 29.6, back: 18, turn: 12, w: 134.5, dep: 52, yb: 359.3, yt: 87, front: '#1e1046', side: '#130a33', top: '#2a1660', arch: 1,          // брама з аркою
        inner: [T(.12, .88, .06, .17, '#0a0620', '#d98aff')] }] },
  ];

  // ---------- проєкція й грані ----------
  const path = (c, pts) => { c.beginPath(); pts.forEach((q, i) => { const [x, y] = pr(q); i ? c.lineTo(x, y) : c.moveTo(x, y); }); c.closePath(); };
  const face = (c, pts, fill, line, lw = .8) => { path(c, pts); if (fill) { c.fillStyle = fill; c.fill(); } if (line) { c.strokeStyle = line; c.lineWidth = lw; c.stroke(); } };
  const seg = (c, a, b, col, lw = .7) => { const [x0, y0] = pr(a), [x1, y1] = pr(b); c.strokeStyle = col; c.lineWidth = lw; c.beginPath(); c.moveTo(x0, y0); c.lineTo(x1, y1); c.stroke(); };
  const haze = (c, pts, z, B) => { if (B && B.clear) return; const k = Math.max(0, Math.min(.42, (z - 20) / 300)); if (k > .01) face(c, pts, `rgba(6,4,20,${k.toFixed(3)})`); };   // дальнє — темніше
  /** Коробка: (x, z) — середина передньої грані на рівні основи; turn — поворот до центру (°); back — відступ углиб від цієї лінії. */
  function geo(B) {
    const a = (B.turn || 0) * Math.PI / 180, f = [-Math.sin(a), -Math.cos(a)], r = [-f[1], f[0]];     // f — «уперед» (до глядача й до центру), r — «праворуч»
    const c = [B.x - f[0] * (B.back || 0), B.z - f[1] * (B.back || 0)];
    const P = (u, v, y) => [c[0] + r[0] * u - f[0] * v, y, c[1] + r[1] * u - f[1] * v];
    const w = B.w / 2, d = B.dep;
    const F = { front: [P(-w, 0, B.yb), P(w, 0, B.yb), P(w, 0, B.yt), P(-w, 0, B.yt)], left: [P(-w, d, B.yb), P(-w, 0, B.yb), P(-w, 0, B.yt), P(-w, d, B.yt)],
      top: [P(-w, d, B.yt), P(w, d, B.yt), P(w, 0, B.yt), P(-w, 0, B.yt)] };
    const toEye = pts => { const m = [0, 1, 2].map(i => pts.reduce((s, q) => s + q[i], 0) / 4); return [EYE[0] - m[0], EYE[2] - m[2]]; };
    const vf = toEye(F.front), vl = toEye(F.left);
    return { B, F, P, zc: c[1], vis: { front: f[0] * vf[0] + f[1] * vf[1] > 0, left: -r[0] * vl[0] - r[1] * vl[1] > 0, top: B.yt > VP[1] } };
  }
  const FP = (q, fu, fy) => q.P(-q.B.w / 2 + fu * q.B.w, -.2, q.B.yt + fy * (q.B.yb - q.B.yt));            // точка на лицьовій грані (частки ширини й висоти)
  function drawPart(c, Z, q, t, top) {
    const { B, F, vis } = q;
    if (top && vis.top && B.top) { face(c, F.top, B.top, Z.acc + '88', .5); haze(c, F.top, q.zc, B); }
    if (top === 'only') return;
    if (vis.left) { face(c, F.left, B.side, Z.acc + '66', .5); haze(c, F.left, q.zc + B.dep / 2, B); }
    face(c, F.front, B.front, Z.acc, 1);
    (B.inner || []).forEach(n => face(c, [FP(q, n.fu0, n.fy1), FP(q, n.fu1, n.fy1), FP(q, n.fu1, n.fy0), FP(q, n.fu0, n.fy0)], n.fill, n.line, .7));
    if (B.arch) {                                                                                       // арка порталу: проріз з півколом угорі, вихор — кільцями
      const L = .17, R = .83, top0 = .24, spring = .44, pts = [FP(q, L, 1)];
      for (let i = 0; i <= 20; i++) { const a = Math.PI * i / 20; pts.push(FP(q, .5 - (.5 - L) * Math.cos(a), spring - (spring - top0) * Math.sin(a))); }
      pts.push(FP(q, R, 1)); face(c, pts, '#2a0f6a', '#3be8ff', 1);
      const asp = B.w / (B.yb - B.yt);
      [[.28, '#4a22a8'], [.2, '#6a3ad8'], [.12, '#9a7af0'], [.05, '#e8dcff']].forEach(([rr, col], k) => face(c, Array.from({ length: 28 }, (_, i) => { const a = Math.PI * 2 * i / 28 + t * (k % 2 ? .6 : -.6); return FP(q, .5 + rr * Math.cos(a), .66 + rr * asp * 1.3 * Math.sin(a)); }), col));
    }
    haze(c, F.front, q.zc, B);
  }
  function drawZone(c, Z, t) {
    const qs = Z.parts.map(geo), base = qs[0];
    if (qs.length > 1) { drawPart(c, Z, base, t, 'only'); qs.slice(1).forEach(q => drawPart(c, Z, q, t, true)); drawPart(c, Z, base, t, false); }   // верх основи — під верхньою частиною
    else drawPart(c, Z, base, t, true);
  }
  // ---------- стіна по дузі: грані різного тону (що ближча до глядача — то темніша), ребра-пілястри на зламах,
  //            труба вздовж стіни й неоновий плінтус — ламаються на кожному зламі, тому дугу видно між зонами ----------
  function drawWall(c) {
    const TONE = ['#2a2160', '#221a50', '#1a1440', '#130f30'];
    for (let i = 0; i + 1 < WALL.length; i++) {
      const [x0, z0] = WALL[i], [x1, z1] = WALL[i + 1];
      face(c, [[x0, CEIL, z0], [x1, CEIL, z1], [x1, FL, z1], [x0, FL, z0]], TONE[i]);
      for (let y = CEIL + 20; y < FL - 10; y += 40) seg(c, [x0, y, z0], [x1, y, z1], '#0a0820', .9);                  // горизонтальні шви — сходяться до вікна
      const n = Math.max(1, Math.round(Math.hypot(x1 - x0, z1 - z0) / 44));
      for (let j = 1; j < n; j++) { const u = j / n; seg(c, [x0 + (x1 - x0) * u, CEIL, z0 + (z1 - z0) * u], [x0 + (x1 - x0) * u, FL - 8, z0 + (z1 - z0) * u], '#0a0820', .7); }
    }
    for (let i = 0; i + 1 < WALL.length; i++) {
      const [x0, z0] = WALL[i], [x1, z1] = WALL[i + 1];
      [[118, '#4a5a8a', 3.2], [118, '#8a9ac8', 1]].forEach(([y, col, lw]) => seg(c, [x0, y, z0], [x1, y, z1], col, lw));   // труба вздовж стіни
      seg(c, [x0, FL - 7, z0], [x1, FL - 7, z1], '#ff4fd8', 1.4);                                                     // неоновий плінтус
    }
    WALL.slice(1, -1).forEach(([x, z]) => { const a = pr([x, CEIL, z]), b = pr([x, FL, z]); c.fillStyle = '#3a2f86'; c.fillRect(a[0] - 2.2, a[1], 4.4, b[1] - a[1]); c.fillStyle = '#6a5ad0'; c.fillRect(a[0] - 2.2, a[1], 1, b[1] - a[1]); });   // ребра-пілястри на зламах
  }
  // ---------- антресоль: спід (темна стеля) — до зон, лицьова грань, поруччя й вазони — після ----------
  const MP = s => [MZ.a[0] + MZ.dir[0] * s, MZ.a[1] + MZ.dir[1] * s];                                 // точка внутрішнього краю (s — відстань від колони)
  const wallAt = y => WALL.map(([x, z]) => [x, y, z]);
  function drawSoffit(c) {
    const { yb, len } = MZ, A = MP(0), B = MP(len), W = wallAt(yb).filter(q => q[0] > A[0] + 10);
    face(c, [[A[0], yb, A[1]], [B[0], yb, B[1]], [B[0] + OUT[0] * 400, yb, B[1] + OUT[1] * 400], ...W.slice().reverse(), [A[0] + OUT[0] * 90, yb, A[1] + OUT[1] * 90]], '#0a0822');
    for (let s = 0; s <= len; s += 35) { const p = MP(s); seg(c, [p[0], yb, p[1]], [p[0] + OUT[0] * 300, yb, p[1] + OUT[1] * 300], '#18143e', 1.4); }   // балки спіду — тікають до стіни
    for (let i = 1; i + 1 < WALL.length; i++) { const [x0, z0] = WALL[i], [x1, z1] = WALL[i + 1]; seg(c, [x0, yb, z0], [x1, yb, z1], '#4a3c9a', 2.4); }   // стик спіду зі стіною — балка вздовж дуги
  }
  function drawMezz(c) {
    const { yt, yb, len } = MZ, A = MP(0), B = MP(len);
    [[30, '#1e5a3a'], [85, '#2a6a3a'], [140, '#1e5a3a']].forEach(([s, col]) => { const m = MP(s);        // вазони на антресолі (за поруччям, більшають до глядача)
      drawPart(c, { acc: '#7ae08a' }, geo({ x: m[0] + OUT[0] * 26, z: m[1] + OUT[1] * 26, turn: -26.5, w: 26, dep: 22, yb: yt, yt: yt - 30, front: col, side: '#123020', top: '#2e7a4a' }), 0, true); });
    face(c, [[A[0], yt, A[1]], [B[0], yt, B[1]], [B[0], yb, B[1]], [A[0], yb, A[1]]], '#2a2060', '#ff4fd8', 1);   // лицьова грань плити
    seg(c, [A[0], yb - 3, A[1]], [B[0], yb - 3, B[1]], '#3be8ff', 1.4);                                         // LED-смуга
    for (let s = 0; s <= len; s += 18) { const m = MP(s); seg(c, [m[0], yt, m[1]], [m[0], yt - 26, m[1]], '#848db4', .8); }   // балясини
    seg(c, [A[0], yt - 26, A[1]], [B[0], yt - 26, B[1]], '#bcc5e6', 1.4);                                          // поруччя
    seg(c, [A[0], yt - 13, A[1]], [B[0], yt - 13, B[1]], '#6a7298', .8);
  }
  // ---------- підлога під крилом ----------
  function drawFloor(c) {
    c.fillStyle = '#0d0826'; c.beginPath(); const W = wallAt(FL).map(pr); c.moveTo(887.5, 372); c.lineTo(887.5, W[0][1]); W.forEach(([x, y]) => c.lineTo(x, y)); c.lineTo(1536, 372); c.closePath(); c.fill();
    for (let i = -6; i < 30; i++) { const xw = 774 + i * 48; seg(c, [xw, FL, 220], [xw, FL, -40], '#1c1446', .8); }
    for (const z of [160, 120, 85, 55, 28, 5]) seg(c, [880, FL, z], [1800, FL, z], '#1a1240', .8);
  }
  function label(c, Z) {
    if (!Z.key) return; const q = geo(Z.parts[0]), [x, y] = pr(q.P(0, -2, FL)), s = NX.t(Z.key);
    c.font = '6px "Press Start 2P", monospace'; c.textAlign = 'center'; c.fillStyle = '#000'; c.fillText(s, x + .6, y + 9.6); c.fillStyle = Z.acc; c.fillText(s, x, y + 9); c.textAlign = 'left';
  }
  NX.addObject({
    id: 'rwingBox', rw: true, span: [884, 1536],
    drawBack(c, t) {
      // вікно, місто й правий відкіс (window_frame.js, до x 970) не чіпаємо: стіна й підлога крила — лише поза ними
      c.save(); c.beginPath(); c.moveTo(970, -2); c.lineTo(1547, -2); c.lineTo(1547, 378); c.lineTo(887.5, 378); c.lineTo(887.5, 346); c.lineTo(970, 346); c.closePath(); c.clip();
      c.fillStyle = '#0b0820'; c.fillRect(887.5, -2, 660, 380);
      drawFloor(c); drawWall(c);
      face(c, [[HUB.x0, HUB.y0, HUB.z], [HUB.x1, HUB.y0, HUB.z], [HUB.x1, HUB.y1, HUB.z], [HUB.x0, HUB.y1, HUB.z]], '#071a5a', '#3be8ff', 1.2);   // екран NEXORA AI
      drawSoffit(c);
      c.restore();
      c.save(); c.beginPath(); c.rect(887.5, -2, 660, 380); c.clip();                                   // зони (машинерія стоїть перед відкосом вікна)
      ZONES.slice().sort((p, q) => q.parts[0].z - p.parts[0].z).forEach(Z => drawZone(c, Z, t));        // дальні — першими
      drawMezz(c);
      ZONES.forEach(Z => label(c, Z));
      c.restore();
    },
  });
})();

/* ============================================================================
 * objects/sofa.js — ДИВАН-ЛАУНЖ (окремий об'єкт, намальований піксель-артом)
 * ----------------------------------------------------------------------------
 * Диван намальований кодом (як Nexi): чіткий на будь-якому екрані й рухається
 * ЦІЛИЙ. Стиль — як у кімнаті: глибокий оксамит зі стьобкою "честерфілд",
 * рожеві глянцеві боковини, неонові канти, хром, віддзеркалення в підлозі.
 *
 * Сітка: 1 піксель дивану = 0.5 одиниці кімнати; 468×222 px (234×111 од.),
 * стоїть на підлозі в точці (774, 362) і накриває диван на картинці.
 *
 *   Raster/shade() — малювання прямо в пікселі: об'ємний 8-bit перелив
 *                    (дизеринг Байєра) + зерно оксамиту
 *   buildBody()    — тіло дивану. Малюється ЛІВА половина, потім mirror():
 *                    права половина — точне дзеркало, тож підлокітники
 *                    (квадратні, зі смарт-панеллю) завжди ІДЕНТИЧНІ
 *   buildPillow()  — 4 подушки з листям монстери (праві — дзеркальні)
 *   buildRefl()    — віддзеркалення дивану в глянцевій підлозі
 *   drawBack()     — щокадру: віддзеркалення -> тінь -> тіло -> вм'ятина ->
 *                    подушки -> живі неонові деталі (кант спинки з бігучою
 *                    іскрою, канти підлокітників, смарт-панелі, LED-стрічка,
 *                    значок N, підсвітка ніжок); зрідка по глянцю пробігає
 *                    відблиск фар летючої машини з вікна
 * Тап по дивану -> Nexi САМ вирішує, що робити (pick()).
 * ========================================================================== */
(() => {
  const P = NX.px, GW = 468, GH = 222, U = .5, MID = GW / 2;
  const OX = 774 - GW * U / 2, OY = 362 - GH * U;                    // лівий верх дивану в кімнаті (657, 251)

  // ---------- палітра (кольори самої кімнати) ----------
  const V = ['#0b051c', '#120a2c', '#1a0f3e', '#231452', '#2d1a66', '#39217b', '#472a92', '#5a37ab', '#7350c8'];   // оксамит
  const K = ['#3a0b38', '#58134f', '#7a1c6d', '#a0288d', '#c63aa8', '#e656c0', '#ff84d4', '#ffc2ec'];               // рожевий глянець
  const T = ['#0a222c', '#10343e', '#17484e', '#1f5e5e', '#2b7a70', '#3f9a84', '#62bca0'];                          // бірюзові подушки
  const CH = ['#2a2f5e', '#3a4070', '#5a6590', '#8a93b8', '#c3cbea', '#e9eefc'];                                    // хром
  const C = { out: '#12082a', rim: '#6c63d8', thread: '#6a4ab0', glass: '#080a22', cyanBase: '#1f8aa0', yellow: '#ffe27a', t4: T[6], y1: '#ffe27a' };
  const ARM = { x: 0, w: 76, top: 94, bot: 208, side: 22 };           // лівий підлокітник (правий — дзеркало)
  const ICONS = [37, 48, 59];                                         // центри іконок смарт-панелі (x у сітці)

  // ---------- растр: малюємо прямо в пікселі (швидко, без згладжування) ----------
  function Raster(w, h) {
    const d = new Uint8ClampedArray(w * h * 4), cache = {};
    const rgb = hex => cache[hex] || (cache[hex] = [1, 3, 5].map(i => parseInt(hex.slice(i, i + 2), 16)));
    const r = {
      w, h, d,
      set(x, y, hex, a = 1) {
        x = Math.round(x); y = Math.round(y); if (x < 0 || y < 0 || x >= w || y >= h) return;
        const i = (y * w + x) * 4, c = rgb(hex);
        if (a >= 1) { d[i] = c[0]; d[i + 1] = c[1]; d[i + 2] = c[2]; d[i + 3] = 255; }
        else if (d[i + 3]) { d[i] += (c[0] - d[i]) * a; d[i + 1] += (c[1] - d[i + 1]) * a; d[i + 2] += (c[2] - d[i + 2]) * a; }
      },
      alpha(x, y) { return (x < 0 || y < 0 || x >= w || y >= h) ? 0 : d[(y * w + x) * 4 + 3]; },
      rect(x, y, rw, rh, hex, a) { for (let j = 0; j < rh; j++) for (let i = 0; i < rw; i++) r.set(x + i, y + j, hex, a); },
      line(x0, y0, x1, y1, hex, a) { const n = Math.max(1, Math.round(Math.max(Math.abs(x1 - x0), Math.abs(y1 - y0)))); for (let i = 0; i <= n; i++) r.set(x0 + (x1 - x0) * i / n, y0 + (y1 - y0) * i / n, hex, a); },
      dashed(x, y, rw, rh, hex) { for (let i = 0; i < rw; i += 3) { r.set(x + i, y, hex); r.set(x + i, y + rh - 1, hex); } for (let j = 0; j < rh; j += 3) { r.set(x, y + j, hex); r.set(x + rw - 1, y + j, hex); } },
      canvas() { const cv = document.createElement('canvas'); cv.width = w; cv.height = h; cv.getContext('2d').putImageData(new ImageData(d, w, h), 0, 0); return cv; },
    };
    return r;
  }
  const BAYER = [0, 8, 2, 10, 12, 4, 14, 6, 3, 11, 1, 9, 15, 7, 13, 5].map(v => (v + .5) / 16 - .5);
  const hash = (x, y) => { const s = Math.sin(x * 127.1 + y * 311.7) * 43758.5453; return s - Math.floor(s); };
  const bump = t => Math.sqrt(Math.max(0, 1 - (2 * t - 1) ** 2));          // "пухкість" поперек подушки
  /** Об'ємна заливка фігури: тон палітри за освітленістю val(u,v) + дизеринг + зерно тканини. */
  function shade(r, x0, y0, w, h, pal, val, mask, grain = .22) {
    for (let j = 0; j < h; j++) for (let i = 0; i < w; i++) {
      const u = (i + .5) / w, v = (j + .5) / h; if (mask && !mask(u, v)) continue;
      const X = x0 + i, Y = y0 + j, q = P.clamp(val(u, v), 0, 1) * (pal.length - 1) + BAYER[(Y & 3) * 4 + (X & 3)] * .85 + (hash(X, Y) - .5) * grain;
      r.set(X, Y, pal[P.clamp(Math.round(q), 0, pal.length - 1)]);
    }
  }
  /** Маска прямокутника з окремими радіусами кутів: tl, tr, br, bl (у пікселях). */
  const rmask = (w, h, tl = 0, tr = 0, br = 0, bl = 0) => (u, v) => {
    const x = u * w, y = v * h, inC = (cx, cy, rr) => (x - cx) ** 2 + (y - cy) ** 2 <= rr * rr;
    if (tl && x < tl && y < tl) return inC(tl, tl, tl);
    if (tr && x > w - tr && y < tr) return inC(w - tr, tr, tr);
    if (br && x > w - br && y > h - br) return inC(w - br, h - br, br);
    if (bl && x < bl && y > h - bl) return inC(bl, h - bl, bl);
    return true;
  };
  function outline(r, hex) {
    const { w, h, d } = r, op = new Uint8Array(w * h), c = [1, 3, 5].map(i => parseInt(hex.slice(i, i + 2), 16));
    for (let i = 0; i < op.length; i++) op[i] = d[i * 4 + 3] > 40 ? 1 : 0;
    for (let y = 0; y < h; y++) for (let x = 0; x < w; x++) { const i = y * w + x; if (op[i]) continue;
      if ((x > 0 && op[i - 1]) || (x < w - 1 && op[i + 1]) || (y > 0 && op[i - w]) || (y < h - 1 && op[i + w])) { d[i * 4] = c[0]; d[i * 4 + 1] = c[1]; d[i * 4 + 2] = c[2]; d[i * 4 + 3] = 255; } }
  }
  /** Ліву половину копіює дзеркально на праву — обидві половини ІДЕНТИЧНІ. */
  function mirror(r) { const { w, h, d } = r; for (let y = 0; y < h; y++) for (let x = 0; x < w / 2; x++) { const a = (y * w + x) * 4, b = (y * w + w - 1 - x) * 4; for (let k = 0; k < 4; k++) d[b + k] = d[a + k]; } }
  function flipH(r) { const { w, h, d } = r; for (let y = 0; y < h; y++) for (let x = 0; x < w / 2; x++) { const a = (y * w + x) * 4, b = (y * w + w - 1 - x) * 4; for (let k = 0; k < 4; k++) { const tmp = d[a + k]; d[a + k] = d[b + k]; d[b + k] = tmp; } } }
  const BADGE = []; ['X...X', 'XX..X', 'X.X.X', 'X..XX', 'X...X'].forEach((row, j) => [...row].forEach((ch, i) => ch === 'X' && BADGE.push([232 + i, 190 + j])));

  // ---------- тіло дивану ----------
  function buildBody() {
    const r = Raster(GW, GH), A = ARM;
    // 1. Каркас спинки
    shade(r, 40, 2, MID - 40, 138, V, (u, v) => .14 + .14 * (1 - v), rmask(MID - 40, 138, 20));
    // 2. Рожева глянцева боковина спинки
    shade(r, 40, 8, 22, 130, K, (u, v) => .95 - v * .78 - Math.abs(u - .4) * .35, rmask(22, 130, 11));
    for (let y = 18; y < 126; y++) { r.set(45, y, K[7]); if (y % 3) r.set(46, y, K[6]); if (y % 5 > 1) r.set(53, y, K[5]); }
    // неоновий кант по верху спинки + холодне контрове світло з вікна (яскравий шар — щокадру)
    for (let x = 60; x < MID; x++) { r.set(x, 3, K[4]); r.set(x, 4, K[3]); r.set(x, 5, C.rim); }
    for (let a = 0; a <= 90; a += 1.5) { const g = a * Math.PI / 180; r.set(60 - Math.sin(g) * 18, 22 - Math.cos(g) * 18, K[4]); r.set(60 - Math.sin(g) * 17, 22 - Math.cos(g) * 17, K[3]); }
    // 3. Подушки спинки: ліва + центральна (права з'явиться дзеркалом).
    //    Справжня ромбова стьобка "честерфілд": тканина пухне в кожному ромбі,
    //    складки темніють, на перетинах — ґудзики з відблиском.
    const DH = 28, DV = 24;                                              // пів-діагоналі ромба (px)
    const lat = (px, py) => [px / (2 * DH) + py / (2 * DV), px / (2 * DH) - py / (2 * DV)];   // ромбові координати
    for (const [cx, cy, cw] of [[64, 14, 112], [178, 8, 112]]) {
      const ch = 132 - cy, m = rmask(cw, ch, 18, 18), oy = cy - 6;     // oy — ряди ґудзиків однакові на всіх подушках
      shade(r, cx, cy, cw, ch, V, (u, v) => {
        const [a, b] = lat(u * cw, cy + v * ch - oy), fa = a - Math.floor(a), fb = b - Math.floor(b);
        const puff = Math.sin(Math.PI * fa) * Math.sin(Math.PI * fb), fold = Math.min(fa, 1 - fa, fb, 1 - fb);
        return .1 + .5 * puff + .16 * (1 - v) + .1 * bump(u) - (fold < .035 ? .22 : 0) + (fa > .1 && fa < .3 && fb > .55 ? .06 : 0);
      }, m, .18);
      for (let i = 0; i < cw; i++) for (let j = 0; j < 20; j++) if (m((i + .5) / cw, (j + .5) / ch)) { r.set(cx + i, cy + j, C.rim); r.set(cx + i, cy + j + 1, V[7]); break; }   // контрове світло по верху
      for (let I = -2; I < 8; I++) for (let J = -6; J < 4; J++) {                                       // ґудзики на перетинах складок
        const bx = Math.round(cx + DH * (I + J)), by = Math.round(oy + DV * (I - J));
        if (bx < cx + 6 || bx > cx + cw - 6 || by < cy + 14 || by > 116) continue;
        r.rect(bx - 2, by - 1, 4, 3, V[0]); r.rect(bx - 1, by - 2, 2, 1, V[0]); r.set(bx - 1, by - 1, V[8]); r.set(bx, by + 2, V[5]);
      }
      r.rect(cx, cy + 18, 1, ch - 18, V[0]); r.rect(cx + 1, cy + 18, 1, ch - 18, V[5]); r.rect(cx + cw - 1, cy + 18, 1, ch - 18, V[0]);   // шви-канти
    }
    // 4. Сидіння: пухка подушка (верх + фронтальний валик) з неоновим кантом і строчкою
    shade(r, 76, 118, MID - 76, 24, V, (u, v) => .5 + .3 * v + .12 * bump(u), rmask(MID - 76, 24, 10, 6));
    shade(r, 76, 140, MID - 76, 24, V, (u, v) => .22 + .55 * bump(v * .75) * bump(u * .9 + .05), rmask(MID - 76, 24, 0, 0, 6, 9));
    for (let x = 82; x < MID - 6; x++) { r.set(x, 140, (x & 3) ? K[5] : K[4]); r.set(x, 141, K[2]); }
    for (let x = 86; x < MID - 8; x += 4) r.rect(x, 160, 2, 1, C.thread);
    r.rect(MID - 1, 118, 1, 46, V[0]);
    // 5. Фронтальна панель: вертикальні канали + канавка для LED
    shade(r, 76, 162, MID - 76, 38, V, (u, v) => .3 - v * .22);
    for (const x of [128, 180]) { r.rect(x, 164, 1, 34, V[0]); r.rect(x + 1, 164, 1, 34, V[4]); }
    r.rect(84, 175, MID - 84, 1, V[0]); r.rect(84, 176, MID - 84, 10, '#07041a'); r.rect(84, 186, MID - 84, 1, V[5]);
    // 6. ПІДЛОКІТНИК — КВАДРАТНИЙ (правий стане точним дзеркалом)
    const fh = A.bot - A.top - 17;
    shade(r, A.x, A.top + 17, A.side, fh, K, (u, v) => .88 - v * .7 - (1 - u) * .15, rmask(A.side, fh, 0, 0, 0, 3));   // рожева бокова грань
    for (let y = A.top + 22; y < A.bot - 8; y++) { r.set(4, y, K[7]); r.set(5, y, K[6]); if (y % 4) r.set(11, y, K[6]); }   // глянцеві відблиски
    for (let y = A.top + 32; y < A.bot - 10; y += 14) { r.rect(1, y, A.side - 2, 1, K[1]); r.rect(1, y + 1, A.side - 2, 1, K[5]); }   // горизонтальна стьобка
    shade(r, A.side, A.top + 17, A.w - A.side, fh, V, (u, v) => .52 - v * .38 + u * .05);                                  // фронт (оксамит)
    shade(r, A.side + 7, A.top + 25, A.w - A.side - 14, fh - 18, V, (u, v) => .6 - v * .38 + .12 * bump(u), rmask(A.w - A.side - 14, fh - 18, 4, 4, 4, 4));   // пухка вставка
    r.dashed(A.side + 5, A.top + 23, A.w - A.side - 10, fh - 14, C.thread);                                                   // строчка
    shade(r, A.x, A.top, A.w, 17, V, (u, v) => .68 + .28 * (1 - v), rmask(A.w, 17, 5, 5));                                // кришка — плоский квадратний верх
    shade(r, A.x, A.top, A.side, 17, K, (u, v) => .78 + .2 * (1 - v), rmask(A.side, 17, 5));
    r.rect(A.x + 5, A.top, A.w - 10, 1, V[8]); r.rect(A.x + 2, A.top + 15, A.w - 4, 1, V[8]); r.rect(A.x + 2, A.top + 16, A.w - 4, 1, V[2]);   // блік країв
    r.rect(A.side, A.top + 17, A.w - A.side, 2, C.cyanBase);                                                                // неоновий кант (база)
    r.rect(30, A.top + 4, 36, 8, C.glass); r.rect(30, A.top + 4, 36, 1, CH[2]); r.rect(30, A.top + 11, 36, 1, CH[3]); r.rect(30, A.top + 4, 1, 8, CH[2]); r.rect(65, A.top + 4, 1, 8, CH[3]);   // смарт-панель
    ICONS.forEach(x => r.rect(x - 1, A.top + 7, 3, 2, CH[1]));
    r.rect(A.w - 2, A.top + 19, 2, fh - 6, V[0]);                                                                           // тінь біля сидіння
    // 7. Цоколь з хромовою окантовкою, 8. хромові ніжки
    shade(r, 4, 200, MID - 4, 12, V, (u, v) => .14 - v * .12, rmask(MID - 4, 12, 0, 0, 0, 4), .1);
    r.rect(8, 200, MID - 8, 1, CH[3]); for (let x = 12; x < MID; x += 18) r.set(x, 200, CH[5]);
    for (const lx of [16, 98]) { for (let i = 0; i < 12; i++) r.rect(lx + i, 212, 1, 8, CH[P.clamp(Math.round(5 - Math.abs(i - 4) / 7 * 4), 0, 5)]); r.rect(lx - 1, 219, 14, 2, CH[1]); }
    mirror(r);
    // 9. Фірмовий значок по центру (після дзеркала — щоб літера N не віддзеркалилась)
    shade(r, 222, 188, 24, 9, CH, (u, v) => .85 - v * .45 + .1 * bump(u), rmask(24, 9, 3, 3, 3, 3), 0);
    BADGE.forEach(([x, y]) => r.set(x, y, '#0a3a4a'));
    outline(r, C.out);
    return r.canvas();
  }
  // ---------- декоративні подушки (кутики, кант, листя монстери) ----------
  function buildPillow(w, h, flip, lying) {
    const r = Raster(w + 4, h + 4), pw = lying ? 4.5 : 3.2;
    const mask = (u, v) => { const a = Math.abs(u * 2 - 1), b = Math.abs(v * 2 - 1); return a ** pw + b ** pw <= 1 - .25 * Math.min(a, b) * (1 - Math.max(a, b)); };
    shade(r, 2, 2, w, h, T, (u, v) => .2 + .65 * bump(u) * bump(v) + .2 * (1 - v) - .1 * u, mask, .15);
    for (let y = 0; y < r.h; y++) for (let x = 0; x < r.w; x++) if (r.alpha(x, y) && (!r.alpha(x - 1, y) || !r.alpha(x + 1, y) || !r.alpha(x, y - 1) || !r.alpha(x, y + 1))) r.set(x, y, y < r.h * .5 ? T[6] : T[1]);   // кант
    const leaf = (cx, cy, len, ang) => { const ca = Math.cos(ang), sa = Math.sin(ang);
      for (let k = -len; k <= len; k++) for (let m = -6; m <= 6; m++) { const q = k / len, half = 5.5 * Math.sqrt(Math.max(0, 1 - q * q)); if (Math.abs(m) > half) continue;
        const px = Math.round(cx + ca * k - sa * m), py = Math.round(cy + sa * k + ca * m); if (!r.alpha(px, py)) continue;
        r.set(px, py, Math.abs(m) < 1 ? C.yellow : Math.abs(m) > half - 1.2 ? T[1] : ((m + k) & 3) ? T[4] : T[5]); } };
    (lying ? [[.25, .5, -.4, 9], [.55, .45, .35, 9], [.82, .55, -.6, 7]] : [[.32, .34, .7, 11], [.62, .58, -.5, 11], [.3, .72, .1, 8], [.72, .28, 1.9, 8]]).forEach(([u, v, a, L]) => leaf(2 + w * u, 2 + h * v, L, a));
    r.rect(2 + w * .3, 5, w * .3, 1, T[6]);
    if (flip) flipH(r);
    outline(r, '#0a1e26');
    return r.canvas();
  }
  /** Віддзеркалення в глянцевій підлозі: тіло з затуханням + вертикальні смуги глянцю, як на картинці. */
  function buildRefl(body) {
    const cv = document.createElement('canvas'); cv.width = GW; cv.height = GH; const x = cv.getContext('2d');
    x.drawImage(body, 0, 0); x.globalCompositeOperation = 'destination-in';
    const g = x.createLinearGradient(0, GH * .4, 0, GH); g.addColorStop(0, 'rgba(0,0,0,0)'); g.addColorStop(1, 'rgba(0,0,0,1)'); x.fillStyle = g; x.fillRect(0, 0, GW, GH);
    x.globalCompositeOperation = 'destination-out';
    for (let i = 0; i < GW; i += 3) { const h = hash(i, 7); if (h > .55) { x.fillStyle = `rgba(0,0,0,${(h - .55) * 1.6})`; x.fillRect(i, 0, 2, GH); } }
    return cv;
  }
  const PILLOWS = [[buildPillow(58, 54, false, false), 110, 134, -.16], [buildPillow(72, 28, false, true), 152, 150, 0], [buildPillow(58, 54, true, false), 358, 134, .16], [buildPillow(72, 28, true, true), 316, 150, 0]]
    .map(([cv, px, py, rot], i) => ({ cv, px, py, rot, puff: 0, i }));
  let BODY = null, REFL = null, SWC = null;

  const toRoom = (gx, gy) => [OX + gx * U, OY + gy * U];
  const sofa = NX.addObject({
    id: 'sofa', name: 'obj.sofa', act: 'sofa', hit: { x: OX, y: OY, w: GW * U, h: GH * U },
    mode: 'idle', flash: 0, waves: [], sq: 1, sqV: 0, sweep: null, nextSweep: 6,
    /** Що Nexi зробить на дивані — вирішує сам (зважений рандом + контекст). */
    pick() {
      const n = NX.nexi, c = NX.cat, idle = NX.time - n.lastCmd, catNear = Math.abs(c.x - 774) < 360 && !c.riding;
      const pool = [['sofa', 2], ['sofaWork', 2], ['bounce', 2], ['fluff', 1.4], ['cuddle', catNear ? 2.4 : 1], ['sleep', idle > 40 ? 2 : .7]].filter(([id]) => !(n.task && n.task.id === id));
      let r = Math.random() * pool.reduce((s, p) => s + p[1], 0); for (const [id, w] of pool) { if ((r -= w) <= 0) return id; } return 'sofa';
    },
    onTap() { NX.nexi.do(this.pick()); return true; },
    /** Хтось приземлився: диван пружинить, подушки підстрибують, пил, спалах LED. */
    land(x, power = 1) {
      this.flash = 1; this.sqV -= .9 * power; this.waves.push({ x, y: OY + 66, t: 0 });
      PILLOWS.forEach(p => { if (Math.abs(toRoom(p.px, 0)[0] - x) < 70) p.puff = Math.max(p.puff, .5 * power); });
      for (let i = 0; i < 8; i++) NX.fx.emit('dust', x + (Math.random() - .5) * 34, OY + 64);
    },
    puffAll() { PILLOWS.forEach((p, i) => setTimeout(() => { p.puff = 1; this.feathers(p); }, i * 600)); },
    feathers(p) { const [x, y] = toRoom(p.px, p.py - 20); for (let i = 0; i < 7; i++) NX.fx.emit('spark', x + (Math.random() - .5) * 18, y, { col: Math.random() < .5 ? C.t4 : C.y1, vy: -30 - Math.random() * 20, g: 30, ttl: 1.2, s: 1.5 }); },
    update(dt, t) {
      if (this.sweep === null && t > this.nextSweep) this.sweep = 0;                     // відблиск фар летючої машини
      if (this.sweep !== null && (this.sweep += dt / 1.6) >= 1) { this.sweep = null; this.nextSweep = t + 7 + Math.random() * 8; }
      const n = NX.nexi; this.mode = n.loc === 'sofaLie' ? 'sleep' : (n.loc === 'sofaSit' || n.loc === 'sofaStand') ? 'busy' : 'idle';
      this.flash = Math.max(0, this.flash - dt * 2); this.waves = this.waves.filter(w => (w.t += dt) < .7);
      PILLOWS.forEach(p => p.puff = Math.max(0, p.puff - dt * 1.6));
      this.sqV += ((1 - this.sq) * 160 - this.sqV * 9) * dt; this.sq = P.clamp(this.sq + this.sqV * dt, .955, 1.03);
    },
    /** Кадр тіла з відблиском, що пробігає по глянцю (тільки по пікселях дивану). */
    sweepFrame() {
      if (!SWC) { SWC = document.createElement('canvas'); SWC.width = GW; SWC.height = GH; }
      const x = SWC.getContext('2d'), p = -90 + this.sweep * (GW + 180);
      x.globalCompositeOperation = 'source-over'; x.clearRect(0, 0, GW, GH); x.drawImage(BODY, 0, 0); x.globalCompositeOperation = 'source-atop';
      x.fillStyle = 'rgba(255,170,240,.24)'; x.beginPath(); x.moveTo(p, 0); x.lineTo(p + 34, 0); x.lineTo(p - 26, GH); x.lineTo(p - 60, GH); x.fill();
      x.fillStyle = 'rgba(255,255,255,.32)'; x.beginPath(); x.moveTo(p + 10, 0); x.lineTo(p + 16, 0); x.lineTo(p - 44, GH); x.lineTo(p - 50, GH); x.fill();
      return SWC;
    },
    /** LED-стрічка в канавці (рожева; RGB, коли хтось сидить; нічна синя, коли Nexi спить). */
    ledRow(c, t, m, busy) {
      const a = m === 'sleep' ? .5 + .15 * Math.sin(t) : .75 + .25 * Math.sin(t * 2.4);
      for (let gx = 86; gx < GW - 86; gx += 4) { const hue = (t * 140 + gx * 1.2) % 360; c.fillStyle = m === 'sleep' ? `rgba(110,150,255,${a})` : busy ? `hsla(${hue},95%,62%,${a})` : `rgba(255,${80 + 40 * Math.sin(t * 2 + gx * .05) | 0},216,${a})`; c.fillRect(gx, 178, 3, 6); }
      const run = 86 + ((t * .6) % 1) * (GW - 172); c.fillStyle = '#ffffff'; c.fillRect(run - 8, 178, 16, 6);
    },
    drawBack(c, t) {
      if (!BODY) { BODY = buildBody(); REFL = buildRefl(BODY); }
      const m = this.mode, busy = m !== 'idle' || NX.cat.onSofa, Kk = NX.cam.k * (NX.loop.dpr || 1);
      const X = Math.round(774 * Kk) / Kk, Y = Math.round(362 * Kk) / Kk, sx = U * (1 + (1 - this.sq) * .35), sy = U * this.sq;
      c.save(); c.imageSmoothingEnabled = false;
      // --- віддзеркалення в глянцевій підлозі (дзеркально вниз від лінії підлоги)
      c.save(); c.translate(X, Y); c.scale(sx, -sy); c.translate(-MID, -GH); c.globalAlpha = .28; c.drawImage(REFL, 0, 0);
      c.globalCompositeOperation = 'lighter'; c.globalAlpha = .3; this.ledRow(c, t, m, busy); c.restore();
      // --- тінь контакту з підлогою
      c.fillStyle = 'rgba(4,2,14,.55)'; c.beginPath(); c.ellipse(774, 362, 114, 4, 0, 0, 7); c.fill();
      // --- сам диван: одна "пружина" на весь об'єкт
      c.translate(X, Y); c.scale(sx, sy); c.translate(-MID, -GH);
      c.drawImage(this.sweep !== null ? this.sweepFrame() : BODY, 0, 0);
      const seat = (rx, w) => { const gx = (rx - OX) / U; c.fillStyle = 'rgba(10,4,30,.35)'; c.beginPath(); c.ellipse(gx, 132, w, 6, 0, 0, 7); c.fill(); };   // вм'ятина
      if (NX.nexi.loc === 'sofaSit' || NX.nexi.loc === 'sofaStand') seat(NX.nexi.x, 26); if (NX.cat.onSofa) seat(NX.cat.x, 18);
      PILLOWS.forEach(p => { const k = 1 + Math.sin(p.puff * Math.PI) * .2, w = p.cv.width, h = p.cv.height; c.save(); c.translate(p.px, p.py); c.rotate(p.rot); c.scale(k * 1.04, k); c.drawImage(p.cv, -w / 2, -h); c.restore(); });
      // --- живі неонові деталі
      c.globalCompositeOperation = 'lighter';
      c.fillStyle = `rgba(255,79,216,${.5 + .25 * Math.sin(t * 2.2) + this.flash * .4})`; c.fillRect(60, 3, GW - 120, 2);                       // кант спинки
      const sp = 60 + ((t * .22) % 1) * (GW - 120); c.fillStyle = 'rgba(255,255,255,.9)'; c.fillRect(sp - 6, 3, 12, 2);                         // бігуча іскра
      c.fillStyle = `rgba(59,232,255,${.5 + .3 * Math.sin(t * 2.6 + 1) + this.flash * .3})`;
      c.fillRect(ARM.side, ARM.top + 17, ARM.w - ARM.side, 2); c.fillRect(GW - ARM.w, ARM.top + 17, ARM.w - ARM.side, 2);                        // канти підлокітників
      const IC = ['59,232,255', '255,79,216', '255,226,122'];
      [0, 1].forEach(side => ICONS.forEach((ix, i) => {                                                                                    // смарт-панелі
        const on = busy ? Math.floor(t * 6 + i) % 3 !== 0 : Math.floor(t * 1.2 + side * 1.5) % 3 === i, x = side ? GW - 1 - ix : ix;
        c.fillStyle = `rgba(${IC[i]},${on ? .95 : .22})`; c.fillRect(x - 1, ARM.top + 7, 3, 2); }));
      this.ledRow(c, t, m, busy);
      c.fillStyle = `rgba(59,232,255,${.55 + .35 * Math.sin(t * 1.7)})`; BADGE.forEach(([x, y]) => c.fillRect(x, y, 1, 1));                     // значок N
      c.fillStyle = 'rgba(59,232,255,.28)'; [22, 104, GW - 23, GW - 105].forEach(fx => c.fillRect(fx - 7, 220, 14, 2));                          // підсвітка ніжок
      c.restore();
      // --- м'яке світіння (поза пружиною)
      c.save(); c.globalCompositeOperation = 'lighter'; const [, ly] = toRoom(MID, 181), [, ty] = toRoom(0, 3);
      let g = c.createLinearGradient(0, ly - 8, 0, ly + 8); g.addColorStop(0, 'rgba(255,90,220,0)'); g.addColorStop(.5, `rgba(255,90,220,${.25 + this.flash * .3})`); g.addColorStop(1, 'rgba(255,90,220,0)'); c.fillStyle = g; c.fillRect(OX + 40, ly - 8, GW * U - 80, 16);
      g = c.createLinearGradient(0, ty - 10, 0, ty + 1); g.addColorStop(0, 'rgba(255,79,216,0)'); g.addColorStop(1, 'rgba(255,79,216,.16)'); c.fillStyle = g; c.fillRect(OX + 30, ty - 10, GW * U - 60, 11);   // ореол канту на стіні
      c.restore();
      P.glow(c, 774, 362, 140, m === 'sleep' ? 'rgba(80,120,255,.6)' : 'rgba(217,75,255,.6)', .22 + .08 * Math.sin(t * 2) + this.flash * .3);
      this.waves.forEach(w => { c.save(); c.globalAlpha = 1 - w.t / .7; c.strokeStyle = '#ffb0fa'; c.lineWidth = 1.3; c.beginPath(); c.ellipse(w.x, w.y, 9 + w.t * 70, 2 + w.t * 8, 0, 0, 7); c.stroke(); c.restore(); });
    },
    layers(t) {
      if (NX.nexi.loc !== 'sofaLie') return [];
      return [{ y: 1e4, draw: c => {                                                         // плед поверх сплячого Nexi (дихає)
        const x = 779, y = 309, w = 54, br = Math.sin(t * 1.3) * .7; P.rect(c, x, y + br, w, 15 - br, '#7a2a8a'); P.rect(c, x, y + br, w, 2, '#a84ab8');
        for (let i = 0; i < 6; i++) P.rect(c, x + 4 + i * 9, y + 6 + br, 4, 4, '#5a1a6a'); P.rect(c, x, y + 15, w, 1, '#4a1058');
      } }];
    },
  });
  // подушки як тап-зони (менші за диван — мають пріоритет)
  PILLOWS.forEach(p => NX.addObject({ id: 'pillow' + p.i, name: 'obj.pillow', act: 'pillow', get hit() { const [x, y] = toRoom(p.px - p.cv.width / 2, p.py - p.cv.height); return { x, y, w: p.cv.width * U, h: p.cv.height * U }; },
    onTap() { p.puff = 1; sofa.feathers(p); NX.nexi.emote('happy', 1.5); return true; } }));
})();

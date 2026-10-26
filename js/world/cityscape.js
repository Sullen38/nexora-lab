/* ============================================================================
 * world/cityscape.js — ПАНОРАМНЕ ВІКНО: МІСТО ЗА СКЛОМ ПОВНІСТЮ КОДОМ (NX.city)
 * ----------------------------------------------------------------------------
 * Власник: «прибрати чорну перемичку, елементи старої картинки за диваном, зробити вікно
 * повністю панорамним». Тепер між відкосами (objects/window_frame.js) — ОДНЕ суцільне скло
 * від стелі до підлоги (за диваном теж), а за ним — нічне місто, намальоване кодом:
 *   небо, зорі, зоря-сонце, планета-Земля з кільцем, що обертається, хмари — world/city_sky.js
 *   три плани хмарочосів, вивіски, екрани, естакада монорейки — world/city_build.js
 * Кодом закрито ВСЕ вікно картинки (CLIP), крім машинерії майстерні праворуч унизу — вона стоїть
 * перед склом (окремий об'єкт, переробимо разом з майстернею). Картинку під вікном кімната більше не
 * малює взагалі (NX.room.pieces = PIECES).
 * Порядок шарів (далі -> ближче), щокадру — лише живе поверх готових кешів:
 *   НЕБО (кеш: небо, задня половина кільця, сяйво, відблиски скла) -> мерехтливі зорі -> ПЛАНЕТА (кеш раз на
 *   0.25 с) -> кільце (перед), іскри, падаюча зоря -> корабель, дирижабль, човник -> хмари (пливуть)
 *   -> прожектори, феєрверк, далекі машини -> БУДИНКИ (обидва плани й естакада одним полотном, сяйво запечене)
 *   -> вогні щогл, живі вікна, вивіски, голо-реклама, дрони, машини -> ПОТЯГ, близькі машини -> відблиск, що пробігає склом
 * Растри — 4 px/од. (будуються раз), кеші — точно під масштаб екрана й копіюються 1:1 без згладжування.
 * Швидкодія: жодного clip() за складною формою на великі шари — форма вікна запечена в растри (maskOut).
 * NX.city.fireworks(сек) — феєрверк (коли Nexi дивиться у вікно, сценарій `window`).
 * NX.city.paint(c, t, mode) — нерухома копія міста: для віддзеркалення в підлозі (wing_wall.js, patchFloor) і сяйва.
 * ========================================================================== */
NX.city = (() => {
  const P = NX.px, F = NX.furn, CK = NX.ckit, SK = NX.citySky, CB = NX.cityBuild, { FAC, NEON } = CB;
  // ---------- геометрія ----------
  const GL = { x0: 556, y0: 0, x1: 948, y1: 345 }, GW = GL.x1 - GL.x0;               // скло (під відкосами з запасом)
  // що закриваємо кодом: усе вікно картинки, крім машинерії майстерні праворуч унизу (вона перед склом)
  const CLIP = [[GL.x0, -2], [GL.x1, -2], [GL.x1, 183], [926.5, 183], [926.5, 220.5], [887.5, 220.5], [887.5, GL.y1], [GL.x0, GL.y1]];
  const SOFA_TOP = 252, SOFA = [657, 891];                                           // нижче — диван (для віддзеркалення лишаємо як було)
  const PL = { x: 754, y: 63, r: 56 }, SUN = [828, 41], RING = { a: 124, e: .19, th: -.26 };
  const DAY = 240;                                                                   // планета робить оберт за 4 хвилини
  const CLOUDS = [                                                                  // пасма: центр, розмір, тон (як на картинці: рожеві праворуч під кораблем)
    { x: 884, y: 94, w: 128, h: 14, seed: 3, k: .1 }, { x: 842, y: 108, w: 96, h: 7, seed: 4, k: .16 }, { x: 606, y: 101, w: 84, h: 9, seed: 5 },
    { x: 732, y: 126, w: 150, h: 7, seed: 8, k: .2 }, { x: 664, y: 38, w: 74, h: 4, seed: 13, k: .05 }, { x: 864, y: 22, w: 58, h: 3.4, seed: 17 },
  ];
  // ---------- середній план (як на картинці: дві високі вежі по краях, шпиль, центральна вежа під планетою) ----------
  const MID = [
    { x0: 703, x1: 720, top: 132, pal: FAC.violet, z: 3600, win: { sx: 3, sy: 3.2, w: 1.4, h: 1, lit: .42, cols: ['pink', 'white'] }, rim: { l: NEON.violet } },
    { x0: 749, x1: 768, top: 124, pal: FAC.violet, z: 3500, win: { sx: 3, sy: 3.2, w: 1.4, h: 1, lit: .45, cols: ['pink', 'cyan'] }, roof: { type: 'flat', boxes: 2 }, rim: { r: NEON.pink } },
    { x0: 799, x1: 818, top: 130, pal: FAC.blue, z: 3400, win: { style: 'bands', sy: 3.2, h: 1, lit: .45, cols: ['cyan', 'white'] }, rim: { l: NEON.cyan } },
    { x0: 874, x1: 898, top: 120, pal: FAC.teal, z: 3300, win: { sx: 3, sy: 3.2, w: 1.4, h: 1, lit: .42, cols: ['pink', 'white'] }, roof: { type: 'dome', h: 4, inset: 4 }, rim: { r: NEON.cyan } },
    { x0: 596, x1: 612, top: 118, pal: FAC.violet, z: 3200, win: { sx: 3, sy: 3.2, w: 1.4, h: 1, lit: .44, cols: ['pink', 'cyan'] }, rim: { r: NEON.pink }, roof: { type: 'ant', ant: { x: 604, h: 6 } } },
    { x0: 680, x1: 698, top: 120, pal: FAC.blue, z: 3200, win: { sx: 3, sy: 3.2, w: 1.4, h: 1, lit: .45, cols: ['cyan', 'pink'] }, rim: { l: NEON.cyan }, roof: { type: 'ant', ant: { x: 689, h: 8 } } },
    { x0: 822, x1: 846, top: 110, pal: FAC.violet, z: 3100, roof: { type: 'crown', n: 2, inset: 3, h: 2.5, neon: NEON.cyan }, win: { sx: 3, sy: 3.3, w: 1.5, h: 1, lit: .46, cols: ['pink', 'violet'] }, rim: { r: NEON.violet } },
    { x0: 612, x1: 638, top: 96, pal: FAC.blue, z: 3000, roof: { type: 'ant', ant: { x: 628, h: 10 } }, win: { sx: 3.2, sy: 3.4, w: 1.6, h: 1.1, lit: .44, cols: ['pink', 'warm'] }, sign: { x: 614.4, y: 104, w: 3.4, h: 26, seed: 3 }, rim: { l: NEON.cyan } },
    { x0: 849, x1: 870, top: 98, pal: FAC.blue, z: 2900, roof: { type: 'ant', ant: { x: 858, h: 14 } }, win: { sx: 3, sy: 3.3, w: 1.5, h: 1, lit: .48, cols: ['pink', 'cyan'] }, rim: { l: NEON.pink, r: NEON.cyan } },
    { x0: 771, x1: 795, top: 104, pal: FAC.teal, z: 2900, win: { sx: 3, sy: 3.2, w: 1.4, h: 1, lit: .44, cols: ['cyan', 'white'] }, holo: { x: 774, y: 109, w: 18, h: 10, kind: 'graph' }, rim: { r: NEON.cyan } },
    { x0: 644, x1: 676, top: 72, pal: FAC.teal, z: 2700, roof: { type: 'spire', h: 22, inset: 6, neon: NEON.cyan }, win: { style: 'bands', sy: 3.3, h: 1, lit: .46, cols: ['cyan', 'pink'] }, rim: { l: NEON.cyan, r: NEON.cyan }, bands: [[84, NEON.pink], [121, NEON.pink]] },
    { x0: 724, x1: 746, top: 62, pal: FAC.blue, z: 2500, roof: { type: 'crown', n: 2, inset: 3, h: 3, neon: NEON.pink, ant: { x: 735, h: 16 } }, win: { sx: 3.2, sy: 3.4, w: 1.6, h: 1.1, lit: .5, cols: ['pink', 'white', 'cyan'] }, rim: { l: NEON.cyan, r: NEON.pink } },
    { x0: 552, x1: 592, top: 26, pal: FAC.blue, z: 2400, roof: { type: 'crown', n: 3, inset: 3.5, h: 3, neon: NEON.cyan, ant: { x: 572, h: 12 } }, win: { sx: 3.4, sy: 3.6, w: 1.7, h: 1.2, lit: .44, cols: ['cyan', 'white'] }, rim: { r: NEON.cyan } },
    { x0: 902, x1: 952, top: 16, pal: FAC.violet, z: 2300, roof: { type: 'spire', h: 12, inset: 16, neon: NEON.pink }, win: { sx: 3.4, sy: 3.6, w: 1.7, h: 1.2, lit: .44, cols: ['pink', 'violet'] }, holo: { x: 906, y: 46, w: 12, h: 44, kind: 'tall' }, rim: { l: NEON.pink } },
  ];
  // ---------- ближній план (над диваном) + естакада монорейки ----------
  const PAD = []; for (let x = 709; x < 746; x += 4.4) PAD.push({ x, y: 227.2 });
  const NEAR = [
    { x0: 552, x1: 646, top: 166, pal: FAC.near, z: 1700, dz: 40, haze: 'near', pil: 8.8, slab: 1, win: { sx: 4.4, sy: 4.6, w: 2.4, h: 1.6, lit: .24, cols: ['pink', 'violet'] }, roof: { type: 'flat', boxes: 3 } },
    { x0: 818, x1: 868, top: 186, pal: FAC.near, z: 1600, dz: 50, haze: 'near', slab: 1, win: { style: 'bands', sy: 4.4, h: 1.5, lit: .32, cols: ['pink', 'violet'] }, bands: [[192.5, NEON.cyan]], rim: { l: NEON.cyan }, sign: { x: 862, y: 196, w: 4, h: 28, seed: 5, c: NEON.cyan, c2: NEON.pink }, roof: { type: 'flat', boxes: 1, ant: { x: 826, h: 9 }, tank: [846, 6] } },
    { x0: 752, x1: 812, top: 214, pal: FAC.near, z: 1550, dz: 50, haze: 'near', pil: 8.8, slab: 1, win: { sx: 4.4, sy: 4.6, w: 2.4, h: 1.6, lit: .28, cols: ['white', 'pink'] }, holo: { x: 757, y: 218.5, w: 50, h: 14, kind: 'wide' }, roof: { type: 'flat', boxes: 2, dish: [806, 0] } },
    { x0: 706, x1: 748, top: 228, pal: FAC.near, z: 1500, dz: 50, haze: 'near', slab: 1, win: { sx: 4.2, sy: 4.4, w: 2.2, h: 1.5, lit: .3, cols: ['pink', 'cyan'] }, roof: { type: 'flat', boxes: 0 }, pad: PAD },
    { x0: 650, x1: 700, top: 178, pal: FAC.near, z: 1450, dz: 55, haze: 'near', pil: 8.8, slab: 1, win: { sx: 4.4, sy: 4.6, w: 2.4, h: 1.6, lit: .3, cols: ['cyan', 'pink', 'warm'] }, rim: { r: NEON.pink }, sign: { x: 692.5, y: 186, w: 4, h: 30, seed: 2 }, roof: { type: 'flat', boxes: 1, ant: { x: 660, h: 10 }, tank: [674, 7], dish: [688, 0] } },
    { x0: 874, x1: 952, top: 156, pal: FAC.near, z: 1400, dz: 55, haze: 'near', pil: 9.2, slab: 1, win: { sx: 4.6, sy: 4.8, w: 2.6, h: 1.7, lit: .28, cols: ['violet', 'pink', 'warm'] }, rim: { l: NEON.violet }, roof: { type: 'flat', boxes: 3, ant: { x: 904, h: 12 } }, bands: [[163, NEON.violet]] },
  ];
  const RAIL = { y: 199.5, posts: [598, 672, 746, 820, 894] };
  // ---------- рух ----------
  const LANES = [{ y: 106, s: .55, sp: 16, dir: 1, n: 5, st: 0 }, { y: 146, s: .8, sp: 28, dir: -1, n: 5, st: 1 }, { y: 211, s: 1.15, sp: 44, dir: 1, n: 3, st: 2 }];
  const CARC = ['#ff6ad8', '#45e6ff', '#ffc94d', '#b88aff'];

  let S = null;                                                                      // готові растри й живі точки
  const path = pts => { const p = new Path2D(); pts.forEach(([x, y], i) => i ? p.lineTo(x, y) : p.moveTo(x, y)); p.closePath(); return p; };
  const CLIPP = path(CLIP);
  const KEEP = (() => { const p = new Path2D(); p.rect(GL.x0, -2, GW, SOFA_TOP + 2); p.rect(GL.x0, SOFA_TOP - 1, SOFA[0] - GL.x0, GL.y1); p.rect(SOFA[1], SOFA_TOP - 1, GL.x1 - SOFA[1], GL.y1); return p; })();
  const L = R => ({ cv: R.canvas(), x: R.x0, y: R.y0, w: R.W * R.U, h: R.H * R.U });
  /** Поза вікном (машинерія майстерні праворуч унизу) — прозоро. CLIP — прямокутні сходинки, тож перевірка проста. */
  const outside = (X, Y) => (Y > CLIP[2][1] && X > CLIP[3][0]) || (Y > CLIP[4][1] && X > CLIP[5][0]);
  function maskOut(R) { for (let j = 0; j < R.H; j++) { const Y = R.Y(j); if (Y <= CLIP[2][1]) continue; for (let i = 0; i < R.W; i++) if (outside(R.X(i), Y)) R.d[j * R.W + i] = 0; } }
  /** Промінь прожектора: спрайт з градієнтом (уздовж — згасає, поперек — м'які краї), малюється з поворотом. */
  function beamSprite() {
    const cv = document.createElement('canvas'); cv.width = 128; cv.height = 32; const x = cv.getContext('2d');
    const g = x.createLinearGradient(0, 0, 128, 0); g.addColorStop(0, 'rgba(200,220,255,.55)'); g.addColorStop(.5, 'rgba(170,200,255,.22)'); g.addColorStop(1, 'rgba(170,200,255,0)');
    x.fillStyle = g; x.beginPath(); x.moveTo(0, 15); x.lineTo(128, 0); x.lineTo(128, 32); x.lineTo(0, 17); x.fill();
    x.globalCompositeOperation = 'destination-in'; const h = x.createLinearGradient(0, 0, 0, 32); h.addColorStop(0, 'rgba(0,0,0,0)'); h.addColorStop(.5, 'rgba(0,0,0,1)'); h.addColorStop(1, 'rgba(0,0,0,0)'); x.fillStyle = h; x.fillRect(0, 0, 128, 32);
    return cv;
  }
  /** Растр A у контекст c: один раз зменшений під роздільність R (px/од.) і скопійований 1:1 без згладжування —
   *  R — ТОЧНИЙ масштаб екрана (rdev), тож копія піксель-у-піксель: чітко і найдешевше (телефон). */
  const blit = (c, A, R, dx = 0) => { c.imageSmoothingEnabled = false; c.drawImage(F.fit(A.cv, A.w, A.h, R), A.x + dx, A.y, A.w, A.h); };
  const rdev = () => Math.min(4, NX.cam.k * (NX.loop.dpr || 1));                   // точний масштаб екрана (px/од.), не більше роздільності растрів

  // ---------- спрайти ----------
  function carSprite(color) {
    const R = CK.Ras(0, 0, 9, 3.6), c = CK.col, body = [c('#12153a'), c('#1c2050'), c('#262c66'), c('#323a7e')];
    R.poly([[.4, 1.6], [1.6, .9], [7.2, .9], [8.8, 1.7], [8.8, 2.9], [.4, 2.9]], (i, j, X, Y) => body[Math.max(0, 3 - Math.floor((Y - .9) / .55))]);
    R.poly([[2.4, 1.0], [3.4, 0], [5.6, 0], [6.6, 1.0]], c(color)); R.rect(3.6, .25, 5.4, .55, CK.mix(color, '#ffffff', .6));
    R.rect(.6, 2.9, 8.6, 3.35, CK.mix(color, '#000000', .2)); R.rect(8.4, 1.6, 9, 2.2, c('#fff6c0')); R.rect(0, 1.6, .5, 2.2, c('#ff3b3b')); R.rect(1, 1.9, 8, 2.1, c('#3a4490'));
    const A = L(R), mk = (w, h, f) => { const cv = document.createElement('canvas'); cv.width = w; cv.height = h; f(cv.getContext('2d')); return cv; };
    A.flip = mk(A.cv.width, A.cv.height, x => { x.translate(A.cv.width, 0); x.scale(-1, 1); x.drawImage(A.cv, 0, 0); });   // їде ліворуч
    const [r, g, b] = CK.rgb(c(color)), grad = (x, l) => { const q = x.createLinearGradient(0, 0, 40, 0); q.addColorStop(l ? 1 : 0, `rgba(${r},${g},${b},0)`); q.addColorStop(l ? 0 : 1, `rgba(${r},${g},${b},.26)`); x.fillStyle = q; x.fillRect(0, 0, 40, 2); };
    A.trail = mk(40, 2, x => grad(x, false)); A.trailL = mk(40, 2, x => grad(x, true));   // світловий слід (згасає назад)
    return A;
  }
  function trainSprite() {
    const R = CK.Ras(0, 0, 112, 8.2), c = CK.col, r = CK.rng(41), TOP = [c('#f0e8ff'), c('#d6c8fa'), c('#b8a6ee')], LOW = [c('#a090e0'), c('#7c6ad0'), c('#5c4ab0'), c('#46389a')];
    const WINC = [c('#ffd36a'), c('#9af6ff'), c('#ffb0ee'), c('#ffe7a0')], cars = [[0, 22], [23, 45], [46, 68], [69, 91], [92, 112]];
    cars.forEach(([a, b], n) => {
      const nose = n === 0, tail = n === 4;
      R.rect(a, 0, b, 7.2, (i, j, X, Y) => {
        if (nose && Y < 6.6 - (X - a) * .62) return 0;                                 // скошений ніс
        if (tail && X > b - 2 && Y < (X - (b - 2)) * 1.6) return 0;
        if (nose && Y < 6.6 - (X - a) * .62 + 1.1) return (X - a) < 6 ? c('#1a1c48') : TOP[0];   // лобове скло
        if (Y < 1.9) return TOP[Math.min(2, Math.floor(Y / .65))];
        if (Y < 4) { const wx = (X - a) % 2.2; return wx < 1.5 && X > a + (nose ? 8 : 1) && X < b - 1 ? (r() < .97 ? WINC[Math.floor(CK.hash2(Math.floor((X - a) / 2.2), n) * 4)] : c('#14163e')) : c('#14163e'); }
        if (Y < 4.6) return LOW[0]; if (Y < 5.1) return c('#ff4fd8'); if (Y < 6.6) return LOW[1 + Math.min(2, Math.floor((Y - 5.1) / .5))];
        return c('#1a1440');
      });
      R.rect(a, 7.2, b, 8.2, (i, j) => CK.B(i, j) + .5 > (j - R.J(7.2)) / 4 ? c('#3be8ff') : 0);   // магнітна подушка світиться
      if (!tail) R.rect(b, 1.5, b + 1, 6.5, c('#0a0a24'));
    });
    R.rect(.5, 5.2, 1.6, 6, c('#ffffff')); R.rect(110.6, 3.6, 112, 4.6, c('#ff3b3b'));
    return L(R);
  }
  function airshipSprite() {
    const R = CK.Ras(0, 0, 66, 21), c = CK.col, ENV = [c('#140e40'), c('#1c1452'), c('#261c66'), c('#30247a'), c('#3c2e8e'), c('#4c3aa2'), c('#6250b8'), c('#7c6ad0')];
    const cx = 35, cy = 8.5, rx = 30, ry = 8;
    R.rect(cx - rx, cy - ry, cx + rx, cy + ry, (i, j, X, Y) => { const u = (X - cx) / rx, v = (Y - cy) / ry; if (u * u + v * v > 1) return 0;
      const rib = Math.abs(((X - 5) % 6) - 3) < .35 && Math.abs(v) < .9; let q = .55 - v * .45 + (u > 0 ? .08 : 0) - u * u * .25 - (rib ? .18 : 0); if (v > -.62 && v < -.5) q += .25;
      return ENV[CK.clamp(Math.round(q * 7 + CK.B(i, j) * .9), 0, 7)]; });
    R.poly([[0, 1], [7, 6], [9, 8.5], [2, 7.5]], c('#3a2a86')); R.poly([[0, 16], [7, 11], [9, 9], [2, 10]], c('#2a1e6a')); R.rect(0, 1, .6, 7.5, c('#ff4fd8')); R.rect(0, 10, .6, 16, c('#ff4fd8'));
    R.rect(14, 6, 50, 11.2, c('#060a26')); [[14, 6, 50, 6.3], [14, 10.9, 50, 11.2], [14, 6, 14.3, 11.2], [49.7, 6, 50, 11.2]].forEach(q => R.rect(...q, c('#3be8ff')));
    R.rect(28, 16.2, 42, 19.8, c('#1a1440')); R.rect(28, 16.2, 42, 16.5, c('#4c3aa2')); for (let x = 29.2; x < 41; x += 2.4) R.rect(x, 17.3, x + 1.3, 18.5, c('#ffd36a'));
    R.rect(33, 15.6, 37, 16.3, c('#2a1e6a'));
    return L(R);
  }
  function shipSprite() {
    const R = CK.Ras(0, 0, 45, 11.4), c = CK.col, H = [c('#ffc2ec'), c('#ff8ade'), c('#e252c4'), c('#b8309e'), c('#8a1f7a'), c('#5a1258')];
    const hull = [[0, 7.2], [5, 4.4], [13, 2.6], [30, 2.2], [35.5, .3], [38.6, .3], [39.6, 2.6], [44, 4.2], [44, 8.4], [40, 10], [8, 10.4], [2, 9.2]];
    R.poly(hull, (i, j, X, Y) => H[CK.clamp(Math.round((Y - 1) / 9.4 * 5 + CK.B(i, j) * .8 - (X > 30 && Y < 4 ? 1 : 0)), 0, 5)]);
    R.poly([[6, 4.6], [12, 2.5], [19.5, 2.3], [19.5, 4.6]], c('#101438')); R.poly([[11, 2.9], [12.4, 2.6], [19, 2.5], [19, 2.9]], c('#9af6ff'));
    R.rect(8, 6.1, 40, 6.6, c('#3be8ff')); for (let x = 21.5; x < 34; x += 2.4) R.rect(x, 4.6, x + 1.2, 5.5, c('#ffe7a0'));
    R.rect(39, 5, 44.8, 9, c('#2a1040')); R.rect(44.4, 5.2, 45, 8.8, c('#9af6ff')); R.rect(2, 9.2, 40, 9.6, c('#4a1048'));
    return L(R);
  }
  /** Піксельний текст у полотно (1 px = 1 піксель шрифту) — для білборда й дирижабля. */
  function textCanvas(s, colors) {
    const w = CK.glyphW(s) + 1, cv = document.createElement('canvas'); cv.width = w; cv.height = 5; const x = cv.getContext('2d'); let cx = 0, n = 0;
    for (const ch of s) { const g = CK.FONT[ch] || CK.FONT[' ']; if (ch !== ' ') { x.fillStyle = colors[n++ % colors.length]; g.forEach((row, j) => { for (let i = 0; i < row.length; i++) if (row[i] === 'X') x.fillRect(cx + i, j, 1, 1); }); } cx += g[0].length + 1; }
    return cv;
  }

  // ---------- побудова ----------
  const FAR_Y0 = -2, FAR_H = 160, BLD_Y0 = 2;                                        // небо: y -2..158; будинки (обидва плани разом): y 2..345
  /** Небо під будинками (y >= 150): той самий перелив, що й у неба, — у просвітах між будинками немає «дір». */
  function skyFill(R, y0) {
    const G = SK.SKY;
    for (let j = Math.max(0, R.J(y0)); j < R.H; j++) { const Y = R.Y(j); let s = 0; while (s < G.length - 2 && Y >= G[s + 1][0]) s++;
      const t2 = CK.clamp((Y - G[s][0]) / (G[s + 1][0] - G[s][0]), 0, 1); for (let i = 0; i < R.W; i++) R.d[j * R.W + i] = CK.fade(G[s][1], G[s + 1][1], t2, i, j, 1.5); }
  }
  function build() {
    const t0 = performance.now();
    const sky = SK.sky(GL.x0, FAR_Y0, GL.x1, FAR_Y0 + FAR_H, { seed: 7, sun: SUN });
    const planet = SK.Planet(PL.x, PL.y, PL.r), ring = SK.Ring(PL.x, PL.y, RING.a, RING.e, RING.th, PL.r);
    const back = CB.layer(GL.x0, BLD_Y0, GL.x1, 252, [...CB.farList(GL.x0, GL.x1, 21), ...CB.baseList(GL.x0, GL.x1, 33), ...MID], 5, R => skyFill(R, 150));
    const front = CB.layer(GL.x0, 150, GL.x1, GL.y1, NEAR, 9, R => CB.streets(R, 208, 19)); CB.rail(front.R, RAIL.y, RAIL.posts);   // між будинками — глибина вулиць
    [back.R, front.R].forEach(maskOut);                                              // форма вікна запікається в растри — щокадру без дорогого clip()
    // обидва плани — в одне полотно (щокадру один drawImage); живі точки дальнього плану, які закриває ближній, — прибираємо
    const bld = document.createElement('canvas'); bld.width = back.R.W; bld.height = Math.round((GL.y1 - BLD_Y0) / .25); const bx = bld.getContext('2d');
    bx.drawImage(back.R.canvas(), 0, 0); bx.drawImage(front.R.canvas(), 0, Math.round((150 - BLD_Y0) / .25));
    const covered = (x, y) => { const v = front.R.get(front.R.I(x), front.R.J(y)); return v !== 0 && v >>> 24 > 40; };
    const vis = o => o.x >= GL.x0 && o.x <= GL.x1 && !outside(o.x, o.y);
    const liveB = back.live, liveF = front.live;
    liveB.win = liveB.win.filter(w => vis(w) && ![[w.x, w.y], [w.x + w.w, w.y], [w.x, w.y + w.h], [w.x + w.w, w.y + w.h]].some(([x, y]) => covered(x, y)));
    liveB.lights = liveB.lights.filter(l => vis(l) && !covered(l.x, l.y)); liveB.signs = liveB.signs.filter(sg => !covered(sg.x + sg.w / 2, sg.y + sg.h - 1));
    ['win', 'lights'].forEach(k => { liveF[k] = liveF[k].filter(vis); });
    const r = CK.rng(77);
    S = {
      sky: L(sky), ringB: L(ring.back), ringF: L(ring.front), planet, prot: -1, pfit: null,
      clouds: CLOUDS.map(cl => L(SK.Cloud(cl))), bld: { cv: bld, x: GL.x0, y: BLD_Y0, w: GW, h: GL.y1 - BLD_Y0 },
      liveB, liveF, cars: CARC.map(carSprite), airship: airshipSprite(), ship: shipSprite(),
      ad: textCanvas('NEXORA AI · NEXI ♥ · ', ['#ff6ad8', '#5aeaff', '#ff6ad8', '#5aeaff', '#ffe27a', '#ff6ad8']), zep: textCanvas('NEXORA AI ♥ ', ['#9af6ff', '#ff8ade']),
      beam: beamSprite(),
      tw: Array.from({ length: 22 }, () => [GL.x0 + 6 + r() * (GW - 12), 4 + r() * 84, r() * 6.28, .9 + r() * 1.4]).filter(([x, y]) => Math.hypot(x - PL.x, y - PL.y) > PL.r + 5).slice(0, 16),
      lanes: LANES.map(Ln => Array.from({ length: Ln.n }, (_, k) => ({ x: GL.x0 + (k + r() * .6) * GW / Ln.n, c: (k + Ln.st) % 4, dy: (r() - .5) * 3 }))),
      train: null, trainT: 6 + r() * 10, trainSp: trainSprite(), skyC: null,
    };
    planet.update(0); bloom();
    NX.room.pieces = PIECES;                                                         // кімната більше не малює картинку під вікном — там усе кодом
    S.ms = Math.round(performance.now() - t0);
  }
  // що кімната ще малює з картинки (усе, крім вікна): ліворуч, праворуч, підлога під вікном, машинерія майстерні
  const PIECES = [[0, 0, GL.x0, 368], [GL.x1, 0, 1536, 368], [GL.x0, GL.y1, GL.x1, 368], [CLIP[5][0], CLIP[4][1], GL.x1, GL.y1], [CLIP[3][0], CLIP[2][1], GL.x1, CLIP[4][1]]];
  /** Сяйво міста (bloom): яскраві пікселі нерухомої копії, зменшені й розмиті в 3 масштабах (як у крила),
   *  ЗАПІКАЄТЬСЯ в небо (skyCache) і в будинки (лише на самі будинки) — щокадру нічого не коштує.
   *  Ліворуч від x 664 місто світить через сяйво крила (wingGlow бере ту саму копію з містом). */
  function bloom() {
    try {
      const w = Math.round(GW), h = Math.round(GL.y1 + 2), a = document.createElement('canvas'); a.width = w; a.height = h;   // 1 px/од.
      const x = a.getContext('2d'); x.imageSmoothingEnabled = true; x.imageSmoothingQuality = 'high'; x.translate(-GL.x0, 2); paint(x, 0, 'bloom', 1);
      const down = (src, f) => { const o = document.createElement('canvas'); o.width = Math.max(1, Math.round(src.width / f)); o.height = Math.max(1, Math.round(src.height / f)); const ox = o.getContext('2d', { willReadFrequently: true }); ox.imageSmoothingEnabled = true; ox.imageSmoothingQuality = 'high'; ox.drawImage(src, 0, 0, o.width, o.height); return o; };
      const b1 = down(a, 4), bx = b1.getContext('2d', { willReadFrequently: true }), im = bx.getImageData(0, 0, b1.width, b1.height), d = im.data;
      for (let i = 0; i < d.length; i += 4) { const m = Math.max(d[i], d[i + 1], d[i + 2]), k = Math.max(0, (m - 125) / 130); d[i] *= k; d[i + 1] *= k; d[i + 2] *= k; }   // як у крила (wing_wall.js)
      bx.putImageData(im, 0, 0); const b2 = down(b1, 2), b3 = down(b2, 2);
      const bc = document.createElement('canvas'); bc.width = b1.width; bc.height = b1.height; const cx2 = bc.getContext('2d'); cx2.globalCompositeOperation = 'lighter'; cx2.imageSmoothingEnabled = true;
      [[b1, .1], [b2, .2], [b3, .3]].forEach(([b, k]) => { cx2.globalAlpha = k; cx2.drawImage(b, 0, 0, bc.width, bc.height); });
      cx2.globalAlpha = 1; cx2.globalCompositeOperation = 'destination-out'; cx2.fillRect(0, 0, Math.round((664 - GL.x0) / GW * bc.width), bc.height);   // ліворуч від 664 — сяйво крила
      S.bloom = bc;
      // у будинки: сяйво лише поверх самих будинків (маска — їхня непрозорість), додаванням кольору
      const B = S.bld.cv, m = document.createElement('canvas'); m.width = B.width; m.height = B.height; const mx = m.getContext('2d'); mx.imageSmoothingEnabled = true;
      mx.drawImage(bc, 0, 0, bc.width, bc.height, 0, (-2 - BLD_Y0) / .25, B.width, (GL.y1 + 2) / .25);   // сяйво (y -2..345) -> пікселі будинків (y 2..345, 4 px/од.)
      mx.globalCompositeOperation = 'destination-in'; mx.drawImage(B, 0, 0);
      const bxx = B.getContext('2d'); bxx.globalCompositeOperation = 'lighter'; bxx.drawImage(m, 0, 0);
      bxx.globalCompositeOperation = 'source-atop'; bxx.setTransform(4, 0, 0, 4, -GL.x0 * 4, -BLD_Y0 * 4); glassStatic(bxx, false); bxx.setTransform(1, 0, 0, 1, 0, 0); bxx.globalCompositeOperation = 'source-over';   // відблиски скла — і на будинках
    } catch (e) { S.bloom = null; }
  }
  /** Нерухомий дальній план під екран: небо + задня половина кільця + м'яке сяйво планети + сяйво міста (будується раз на роздільність). */
  function skyCache(R) {
    if (S.skyC && S.skyR === R) return S.skyC;
    const w = Math.round(GW * R), h = Math.round(FAR_H * R), cv = S.skyC && S.skyC.width === w && S.skyC.height === h ? S.skyC : document.createElement('canvas'); cv.width = w; cv.height = h;
    const x = cv.getContext('2d'); x.setTransform(R, 0, 0, R, -GL.x0 * R, -FAR_Y0 * R);
    blit(x, S.sky, R); blit(x, S.ringB, R); P.glow(x, PL.x + 12, PL.y - 10, 72, 'rgba(60,160,255,.45)', .12);
    if (S.bloom) { x.globalCompositeOperation = 'lighter'; x.imageSmoothingEnabled = true; x.drawImage(S.bloom, GL.x0, -2, GW, GL.y1 + 2); x.globalCompositeOperation = 'source-over'; }
    glassStatic(x, true); S.skyC = cv; S.skyR = R; return cv;
  }
  /** Планета обертається: мапа зсувається раз на 0.25 с, растр один раз зменшується під екран. */
  function planetFit(t, R) {
    const step = Math.floor(t * 4), rot = step / 4 * Math.PI * 2 / DAY;
    if (S.pfit && S.pfR === R && S.prot === rot) return S.pfit;
    if (rot !== S.prot) { S.planet.update(rot); S.prot = rot; }
    const pw = Math.round(S.planet.w * R); if (!S.pfit || S.pfit.width !== pw) { S.pfit = document.createElement('canvas'); S.pfit.width = S.pfit.height = pw; }
    const px = S.pfit.getContext('2d'); px.clearRect(0, 0, pw, pw); px.imageSmoothingEnabled = true; px.imageSmoothingQuality = 'high'; px.drawImage(S.planet.cv, 0, 0, pw, pw);
    px.globalCompositeOperation = 'lighter'; px.drawImage(planetGlow(), 0, 0, pw, pw); px.globalCompositeOperation = 'source-over';   // сяйво — на самій планеті
    S.pfR = R; return S.pfit;
  }
  /** Сяйво поверх планети (сяйво міста в межах планети + м'яке блакитне світло), обрізане за її формою. Раз. */
  function planetGlow() {
    if (S.pglow) return S.pglow; const pl = S.planet, N = pl.cv.width, cv = document.createElement('canvas'); cv.width = cv.height = N; const x = cv.getContext('2d'), k = N / pl.w;
    x.globalCompositeOperation = 'lighter'; x.imageSmoothingEnabled = true;
    if (S.bloom) { const b = S.bloom, fx = b.width / GW, fy = b.height / (GL.y1 + 2); x.drawImage(b, (pl.x - GL.x0) * fx, (pl.y + 2) * fy, pl.w * fx, pl.h * fy, 0, 0, N, N); }
    P.glow(x, (PL.x + 12 - pl.x) * k, (PL.y - 10 - pl.y) * k, 72 * k, 'rgba(60,160,255,.45)', .12);
    x.globalCompositeOperation = 'destination-in'; x.drawImage(pl.cv, 0, 0); return (S.pglow = cv);
  }
  /** Хмари пливуть праворуч (по колу в межах вікна): кожна — свій спрайт. */
  function clouds(c, t, R) {
    const co = (t * .55) % GW;
    S.clouds.forEach(A => { let x = A.x + co; if (x > GL.x1) x -= GW; blit(c, A, R, x - A.x); if (x + A.w > GL.x1) blit(c, A, R, x - A.x - GW); });
  }
  /** Нерухома копія міста в контекст c (координати кімнати): для віддзеркалення в підлозі й сяйва.
   *  mode 'patch' — без частини за диваном (там віддзеркалення лишається як було). R — роздільність (px/од.). */
  function paint(c, t, mode, R = (NX.room && NX.room.RS) || 2) {
    if (!S) return;
    c.save(); c.clip(CLIPP); if (mode === 'patch') c.clip(KEEP);
    blit(c, S.sky, R); blit(c, S.ringB, R); c.imageSmoothingEnabled = true; c.drawImage(S.planet.cv, S.planet.x, S.planet.y, S.planet.w, S.planet.h); blit(c, S.ringF, R);
    S.clouds.forEach(A => blit(c, A, R)); c.imageSmoothingEnabled = true; c.drawImage(S.bld.cv, S.bld.x, S.bld.y, S.bld.w, S.bld.h);
    c.restore();
  }

  // ---------- живе ----------
  const rgba = (h, a) => { const [r, g, b] = CK.rgb(CK.col(h)); return `rgba(${r},${g},${b},${a})`; };
  function stars(c, t) {
    S.tw.forEach(([x, y, ph, f]) => { const a = Math.sin(t * f + ph); if (a < .55) return; const k = (a - .55) / .45; P.rect(c, x - .5, y - .5, 1, 1, '#ffffff'); c.fillStyle = `rgba(220,240,255,${.7 * k})`; c.fillRect(x - 2.5, y - .25, 5, .5); c.fillRect(x - .25, y - 2.5, .5, 5); });
    CK.glow(c, SUN[0], SUN[1], 11, '170,215,255', .2 + .07 * Math.sin(t * 1.3));
  }
  let star = null, fw = [], fwUntil = 0;
  function shooting(c, t, dt) {
    if (!star && Math.random() < dt * .12) star = { x: GL.x0 + 40 + Math.random() * (GW - 160), y: 6 + Math.random() * 40, t: 0 };
    if (!star) return; star.t += dt; const k = star.t / .9;
    for (let i = 0; i < 12; i++) { c.fillStyle = `rgba(255,255,255,${(1 - i / 12) * (1 - k)})`; c.fillRect(star.x + k * 96 - i * 2.6, star.y + k * 38 - i * 1.04, 1, 1); }
    if (k >= 1) star = null;
  }
  function ringSparks(c, t, front) {
    const ct = Math.cos(RING.th), st = Math.sin(RING.th), A = RING.a, Bm = RING.a * RING.e;
    for (let k = 0; k < 3; k++) { const a = t * .32 + k * 2.09, xr = A * Math.cos(a), yr = Bm * Math.sin(a); if ((yr > 0) !== front) continue;
      const x = PL.x + xr * ct - yr * st, y = PL.y + xr * st + yr * ct; if (!front && (x - PL.x) ** 2 + (y - PL.y) ** 2 < PL.r * PL.r) continue;
      CK.glow(c, x, y, 7, '160,240,255', .6); c.fillStyle = '#ffffff'; c.fillRect(x - .75, y - .75, 1.5, 1.5); }
  }
  function ship(c, t) {
    const sp = S.ship, x = 838 + Math.sin(t / 9) * 6, y = 54 + Math.sin(t * .9) * 1.2, s = 1.25;   // зависає праворуч від планети, перед вежею
    c.save(); c.translate(x, y); c.scale(s, s); c.imageSmoothingEnabled = true; c.drawImage(sp.cv, 0, 0, sp.w, sp.h);
    const fl = .6 + .4 * Math.sin(t * 31) * Math.sin(t * 17);                         // полум'я двигуна
    c.globalCompositeOperation = 'lighter'; c.fillStyle = `rgba(90,232,255,${.75 * fl})`; c.fillRect(45, 5.6, 2.2 + fl * 2, 2.8); c.fillStyle = `rgba(255,120,220,${.5 * fl})`; c.fillRect(47, 6.3, 1.6 + fl * 2.5, 1.4);
    c.globalCompositeOperation = 'source-over'; CK.glow(c, 46, 7, 6, '90,232,255', .32 * fl);
    if (Math.sin(t * 5) > 0) { c.fillStyle = '#ff3b6a'; c.fillRect(36.6, .1, 1.2, 1.2); }
    if (Math.sin(t * 5 + 2) > .4) { c.fillStyle = '#3bff8a'; c.fillRect(1.6, 7.6, 1, 1); }
    c.restore();
  }
  function airship(c, t) {
    const per = (GW + 150) / 6 + 24, q = (t % per) * 6 - 75; if (q > GW + 75) return;
    const sp = S.airship, x = GL.x0 + q - 33, y = 33 + Math.sin(t * .45) * 2;
    c.imageSmoothingEnabled = true; c.drawImage(sp.cv, x, y, sp.w, sp.h);
    const z = S.zep, off = (t * 6) % z.width; c.imageSmoothingEnabled = false;          // біжучий напис на екрані
    c.save(); c.beginPath(); c.rect(x + 14.4, y + 6.4, 35.2, 4.4); c.clip(); for (let k = -1; k < 3; k++) c.drawImage(z, x + 15 + k * z.width * .82 - off * .82, y + 6.6, z.width * .82, 4.1); c.restore();
    for (let i = 0; i < 24; i++) if ((i + Math.floor(t * 9)) % 6 < 3) { const u = (i + .5) / 24, xx = x + 7 + u * 56, yy = y + 8.5 + 8 * Math.sqrt(Math.max(0, 1 - ((xx - x - 35) / 30) ** 2)) - 1.1; c.fillStyle = i % 4 < 2 ? '#ff4fd8' : '#3be8ff'; c.fillRect(xx, yy, .9, .6); }
    if (Math.sin(t * 4) > 0) { c.fillStyle = '#ff3b3b'; c.fillRect(x + 64.4, y + 8, 1.2, 1.2); }
  }
  function shuttle(c, t) { const x = GL.x0 + ((t / 11) % 1) * (GW + 30) - 15, y = 26; P.rect(c, x, y, 8, 2.4, '#c9b4ff'); P.rect(c, x + 2.4, y - 1.6, 3.2, 1.8, '#8a6ae0'); P.rect(c, x - 2 + (Math.floor(t * 12) % 2) * .6, y + .8, 2, 1, '#ffe27a'); }
  function searchlights(c, t) {
    c.save(); c.beginPath(); c.rect(GL.x0, -2, GW, 200); c.clip(); c.globalCompositeOperation = 'lighter'; c.imageSmoothingEnabled = true; c.globalAlpha = .42;
    [[688, 176, .4, .35], [872, 178, -.3, .28]].forEach(([bx, by, ph, sp]) => { const a = -Math.PI / 2 + Math.sin(t * sp + ph * 5) * .48, len = 230;
      c.save(); c.translate(bx, by); c.rotate(a); c.drawImage(S.beam, 0, -len * .07, len, len * .14); c.restore(); });
    c.restore();
  }
  function fireworks(c, t, dt) {
    if (NX.time < fwUntil && Math.random() < dt * 2.2) fw.push({ x: GL.x0 + 50 + Math.random() * (GW - 100), y: 24 + Math.random() * 70, t: 0, col: ['#ff4fd8', '#3be8ff', '#ffc94d', '#7aff9a'][Math.random() * 4 | 0] });
    fw = fw.filter(f => (f.t += dt) < 1.4);
    fw.forEach(f => { const r = 6 + f.t * 26; c.globalAlpha = Math.max(0, 1 - f.t / 1.4); c.fillStyle = f.col; for (let i = 0; i < 16; i++) { const a = i / 16 * Math.PI * 2; c.fillRect(f.x + Math.cos(a) * r, f.y + Math.sin(a) * r + f.t * f.t * 10, 1.5, 1.5); } c.globalAlpha = 1; CK.glow(c, f.x, f.y, 20, '255,255,255', Math.max(0, .36 - f.t * .6)); });
  }
  function lane(c, t, dt, n) {
    const Ln = LANES[n];
    S.lanes[n].forEach(car => { car.x += Ln.sp * Ln.dir * dt; if (Ln.dir > 0 && car.x > GL.x1 + 20) car.x = GL.x0 - 20; if (Ln.dir < 0 && car.x < GL.x0 - 20) car.x = GL.x1 + 20;
      const sp = S.cars[car.c], s = Ln.s, y = Ln.y + car.dy, w = sp.w * s, h = sp.h * s, R = Ln.dir < 0;
      c.globalCompositeOperation = 'lighter'; c.imageSmoothingEnabled = true; c.drawImage(R ? sp.trailL : sp.trail, R ? car.x + w : car.x - 20 * s, y + h * .78, 20 * s, .5 * s); c.globalCompositeOperation = 'source-over';   // слід
      c.drawImage(R ? sp.flip : sp.cv, car.x, y, w, h);                                // спрайт уже віддзеркалений — без save/scale
      CK.glow(c, R ? car.x : car.x + w, y + h * .52, 5 * s, '255,240,180', .4); });
  }
  function drones(c, t) {
    for (let i = 0; i < 6; i++) { const a = t * .18 + i * .5, x = 812 + Math.sin(a) * 46 + Math.sin(t * 1.3 + i) * 2, y = 158 + Math.sin(a * 2) * 9 - i * 1.6;
      P.rect(c, x, y, 1.8, .7, '#9aa0c0'); P.rect(c, x - .4, y - .3, 2.6, .3, '#5a6090'); if (Math.sin(t * 7 + i) > .3) P.rect(c, x + .6, y + .7, .6, .6, i % 2 ? '#ff3b3b' : '#3bff8a'); }
  }
  function lights(c, t, Lv) {
    Lv.lights.forEach(l => { const on = ((t + l.ph) % 1.7) < .3; if (!on) { c.fillStyle = '#5a1020'; c.fillRect(l.x - .4, l.y - .4, .8, .8); return; } c.fillStyle = '#ff4a4a'; c.fillRect(l.x - .45, l.y - .45, .9, .9); CK.glow(c, l.x, l.y, 3.5, '255,60,60', .5); });
    Lv.win.forEach(w => { const a = Math.sin(t * w.f + w.ph); if (a < .25) return; c.globalAlpha = Math.min(1, (a - .25) * 4); c.fillStyle = w.c; c.fillRect(w.x, w.y, w.w, w.h); }); c.globalAlpha = 1;
    Lv.signs.forEach((s, n) => { const k = Math.floor(t * 2.2 + n * 3) % (s.cells.length + 2), flick = CK.hash2(Math.floor(t * 9), n) > .97;
      if (flick) { c.fillStyle = 'rgba(8,4,24,.55)'; c.fillRect(s.x, s.y, s.w, s.h); return; }
      s.cells.forEach(([x, y, w, h, col], i) => { if (i !== k && i !== k - 1) return; c.globalAlpha = i === k ? .85 : .35; c.fillStyle = col; c.fillRect(x, y, w, h); c.globalAlpha = 1; if (i === k) CK.glow(c, x + w / 2, y + h / 2, 5, CK.rgb(CK.col(col)).join(','), .35); }); });
    Lv.holo.forEach(h => holo(c, t, h));
    if (Lv.pad.length) Lv.pad.forEach((p, i) => { const on = (Math.floor(t * 6) - i + 40) % 8 < 2; c.fillStyle = on ? '#3bff8a' : '#0f4a2a'; c.fillRect(p.x - .5, p.y - .4, 1, .8); if (on) CK.glow(c, p.x, p.y, 3, '60,255,140', .32); });
  }
  // голо-екрани: tall — логотип N / серце / Рудик / еквалайзер по черзі; wide — біжучий рядок; graph — пульс-графік
  const CAT = ['X.....X', 'XX...XX', 'XXXXXXX', 'X.X.X.X', 'XXXXXXX', '.XX.XX.'], NEXI = ['.XXXXX.', 'X.....X', 'X.X.X.X', 'X.....X', '.XXXXX.', '..X.X..'];
  function bitmap(c, rows, x, y, p, col) { c.fillStyle = col; rows.forEach((row, j) => { for (let i = 0; i < row.length; i++) if (row[i] === 'X') c.fillRect(x + i * p, y + j * p, p, p); }); }
  function holo(c, t, h) {
    c.save(); c.beginPath(); c.rect(h.x, h.y, h.w, h.h); c.clip(); c.globalCompositeOperation = 'lighter';
    const fl = .85 + .15 * Math.sin(t * 23) * Math.sin(t * 7);
    if (h.kind === 'tall') {
      const page = Math.floor(t / 5) % 4, gl = (t % 5) < .25; c.globalAlpha = fl * (gl ? .5 : 1);
      if (page === 0) { CK.glyph(c, 'N', h.x + 1.2, h.y + 8, 2.4, '#ff6ad8'); CK.glyph(c, 'AI', h.x + .4, h.y + 25, 1.6, '#5aeaff'); }
      else if (page === 1) { const s = 1.9 + .25 * Math.sin(t * 7); CK.glyph(c, '♥', h.x + 6 - 2.5 * s, h.y + 15 - 2.5 * s, s, '#ff4fd8'); CK.glyph(c, '24', h.x + 1.6, h.y + 30, 1.2, '#ffe27a'); CK.glyph(c, '7', h.x + 7.4, h.y + 30, 1.2, '#ffe27a'); }
      else if (page === 2) { bitmap(c, CAT, h.x + .6, h.y + 13, 1.55, '#ff9a3c'); if (Math.sin(t * 3) > -.85) { c.fillStyle = '#7aff9a'; c.fillRect(h.x + .6 + 1.55 * 1, h.y + 13 + 1.55 * 3, 1.55, 1.55); c.fillRect(h.x + .6 + 1.55 * 5, h.y + 13 + 1.55 * 3, 1.55, 1.55); } }
      else for (let i = 0; i < 5; i++) { const v = .3 + .7 * Math.abs(Math.sin(t * (2 + i * .7) + i)); c.fillStyle = i % 2 ? '#5aeaff' : '#ff6ad8'; for (let k = 0; k < v * 14; k++) c.fillRect(h.x + 1 + i * 2.1, h.y + h.h - 3 - k * 2.6, 1.6, 1.8); }
    } else if (h.kind === 'wide') {
      const ad = S.ad, p = 1.75, off = (t * 9) % (ad.width * p); c.globalAlpha = fl; c.imageSmoothingEnabled = false;
      for (let k = 0; k < 3; k++) c.drawImage(ad, h.x + 12 + k * ad.width * p - off, h.y + 3, ad.width * p, 5 * p);
      c.globalCompositeOperation = 'source-over'; c.fillStyle = '#071a3a'; c.fillRect(h.x, h.y, 11.5, h.h); c.globalCompositeOperation = 'lighter';
      bitmap(c, NEXI, h.x + 1.6, h.y + 2.4, 1.2, '#9af6ff'); if (Math.sin(t * 2.3) > -.9) { c.fillStyle = '#ff6ad8'; c.fillRect(h.x + 1.6 + 1.2 * 2, h.y + 2.4 + 1.2 * 2, 1.2, 1.2); c.fillRect(h.x + 1.6 + 1.2 * 4, h.y + 2.4 + 1.2 * 2, 1.2, 1.2); }
    } else {                                                                          // graph
      c.globalAlpha = fl; c.fillStyle = '#5aeaff'; for (let i = 0; i < 18; i++) { const v = .5 + .35 * Math.sin((i + t * 6) * .7) * Math.sin((i + t * 6) * .23); c.fillRect(h.x + i, h.y + h.h - 1.2 - v * (h.h - 2.4), .9, .9); }
      c.fillStyle = '#ff6ad8'; c.fillRect(h.x + 1, h.y + 1, 5, .8);
    }
    c.globalCompositeOperation = 'source-over'; c.globalAlpha = 1; c.fillStyle = 'rgba(0,0,20,.28)'; for (let y = h.y + .5; y < h.y + h.h; y += 1.2) c.fillRect(h.x, y, h.w, .4);   // скан-лінії
    c.fillStyle = 'rgba(160,240,255,.18)'; c.fillRect(h.x, h.y + ((t * .35) % 1) * h.h, h.w, .8);
    c.restore();
    CK.glow(c, h.x + h.w / 2, h.y + h.h / 2, Math.max(h.w, h.h) * .7, h.kind === 'tall' ? '255,90,220' : '80,220,255', .08 * fl);
  }
  function train(c, t, dt) {
    if (!S.train) { S.trainT -= dt; if (S.trainT <= 0) S.train = { x: GL.x1 + 10 }; return; }
    const sp = S.trainSp, tr = S.train; tr.x -= 118 * dt; if (tr.x < GL.x0 - sp.w - 10) { S.train = null; S.trainT = 30 + Math.random() * 18; return; }
    const y = RAIL.y - 8; c.imageSmoothingEnabled = true; c.drawImage(sp.cv, tr.x, y, sp.w, sp.h);
    c.save(); c.globalCompositeOperation = 'lighter'; c.fillStyle = 'rgba(255,120,230,.35)'; c.fillRect(tr.x - 6, RAIL.y, sp.w + 12, .6); c.restore();   // відсвіт на балці
    CK.glow(c, tr.x + 1, y + 5.6, 8, '255,250,220', .5); CK.glow(c, tr.x - 10, y + 5.8, 14, '255,250,220', .15);
  }
  /** Скло: нерухомі косі відблиски й тінь під верхньою балкою запікаються в небо й будинки (glassStatic),
   *  щокадру — лише відблиск, що зрідка пробігає склом. */
  const STREAKS = [[598, 22, .045], [632, 2.2, .07], [828, 34, .032], [874, 3, .05]];
  function glassStatic(c, sky) {
    c.save(); STREAKS.forEach(([x, w, a]) => { c.fillStyle = `rgba(220,235,255,${a})`; c.beginPath(); c.moveTo(x, 0); c.lineTo(x + w, 0); c.lineTo(x + w + 150, GL.y1); c.lineTo(x + 150, GL.y1); c.fill(); });
    if (sky) { const hg = c.createLinearGradient(0, 5, 0, 17); hg.addColorStop(0, 'rgba(4,2,20,.5)'); hg.addColorStop(1, 'rgba(4,2,20,0)'); c.fillStyle = hg; c.fillRect(GL.x0, 5, GW, 12); }   // тінь під верхньою балкою
    c.restore();
  }
  function glass(c, t) {
    const g = (t % 26) / 26, gx = GL.x0 - 80 + g * (GW + 160); if (g >= .55) return;
    c.save(); c.clip(CLIPP); c.fillStyle = 'rgba(200,240,255,.05)'; c.beginPath(); c.moveTo(gx, 0); c.lineTo(gx + 14, 0); c.lineTo(gx + 164, GL.y1); c.lineTo(gx + 150, GL.y1); c.fill(); c.restore();
  }

  /** Передня підлога-дзеркало для x 664..948 (ліворуч — копія крила, wing_wall.js): картинка + місто (без частини за
   *  диваном — там лишається віддзеркалення дивана) + рама вікна + рослина біля дивану. Один раз після старту. */
  function patchFloor(t) {
    const img = NX.room.img, RS = NX.room.RS; if (!img.naturalWidth) return;
    const cv = document.createElement('canvas'); cv.width = img.naturalWidth; cv.height = img.naturalHeight; const x = cv.getContext('2d');
    x.drawImage(img, 0, 0); x.save(); x.scale(RS, RS); paint(x, t, 'patch', RS);
    ['windowFrame', 'plant'].forEach(id => { const o = NX.objects[id]; if (o && o.drawBack) o.drawBack(x, t); });
    x.restore(); NX.room.patchFront(cv, 664, 948);
  }
  let frames = 0;
  return {
    GL, CLIP, CLIPP,
    init() {},
    fireworks(sec) { fwUntil = NX.time + sec; },
    paint,
    draw(c, t, dt) {
      if (!S) build();
      const R = rdev();
      // без clip() за формою вікна (дорого на телефоні): форма запечена в растри; живе в небі — у прямокутнику вікна
      c.save();
      c.imageSmoothingEnabled = false; c.drawImage(skyCache(R), GL.x0, FAR_Y0, GW, FAR_H);   // небо, задня половина кільця, сяйво, відблиски скла
      c.save(); c.beginPath(); c.rect(GL.x0, -2, GW, 202); c.clip();
      stars(c, t); c.imageSmoothingEnabled = false; c.drawImage(planetFit(t, R), S.planet.x, S.planet.y, S.planet.w, S.planet.h);
      blit(c, S.ringF, R); ringSparks(c, t, false); ringSparks(c, t, true); shooting(c, t, dt);
      ship(c, t); airship(c, t); shuttle(c, t); clouds(c, t, R);
      searchlights(c, t); fireworks(c, t, dt); lane(c, t, dt, 0);
      c.restore();
      blit(c, S.bld, R);                                                               // обидва плани будинків разом (зі сяйвом)
      lights(c, t, S.liveB); drones(c, t); lane(c, t, dt, 1); lights(c, t, S.liveF);
      c.save(); c.beginPath(); c.rect(GL.x0, 150, CLIP[3][0] - GL.x0, 70); c.clip(); train(c, t, dt); lane(c, t, dt, 2); c.restore();   // праворуч від x 926 — машинерія майстерні
      glass(c, t);
      c.restore();
      if (++frames === 8 && !c.isRefl) patchFloor(t);
    },
  };
})();
/** Вікно як об'єкт: тап -> Nexi підходить і милується містом (феєрверк). */
NX.addObject({ id: 'cityWindow', name: 'obj.window', act: 'window', hit: { x: 574, y: 4, w: 356, h: 156 } });

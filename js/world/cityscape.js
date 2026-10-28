/* ============================================================================
 * world/cityscape.js — ПАНОРАМНЕ ВІКНО: МІСТО ЗА СКЛОМ ПОВНІСТЮ КОДОМ (NX.city)
 * ----------------------------------------------------------------------------
 * Власник: «прибрати чорну перемичку, елементи старої картинки за диваном, зробити вікно
 * повністю панорамним». Тепер між відкосами (objects/window_frame.js) — ОДНЕ суцільне скло
 * від стелі до підлоги (за диваном теж), а за ним — нічне місто, намальоване кодом:
 *   небо, зорі, зоря-сонце, планета-Земля з кільцем, що обертається, хмари — world/city_sky.js
 *   три плани хмарочосів, вивіски, екрани, естакада монорейки — world/city_build.js
 * Кодом закрито ВСЕ вікно картинки (CLIP) — скло й місто до самого відкосу; машинерія майстерні, що стоїть
 * перед склом праворуч унизу, тепер теж кодом (objects/workshop.js) і малюється поверх міста. Картинку під
 * вікном і праворуч від нього кімната більше не малює взагалі (NX.room.pieces = PIECES).
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
  const WIN = NX.cfg.WIN, GL = { x0: WIN.L + 22, y0: 0, x1: WIN.R - 22, y1: 345 }, GW = GL.x1 - GL.x0;   // скло (під відкосами з запасом; межі — core/config.js)
  // Композиція міста складена під давнє скло 556..948 (центр 752). Вікно стало ширшим і стоїть по центру кімнати (774):
  // MX переносить x-позиції (центри) на нове скло — розсуває пропорційно, розміри будинків не змінює; крайні вежі
  // прив'язані до країв скла, а горизонти (skyline), машини, зорі й хмари й так займають усю ширину.
  const MX = x => 774 + (x - 752) * GW / 392, AT = (cx, w) => ({ x0: MX(cx) - w / 2, x1: MX(cx) + w / 2 });
  // що закриваємо кодом: усе вікно картинки до відкосу (машинерія майстерні перед склом — кодом, objects/workshop.js).
  // Точки [2]..[6] колись були «сходинками» навколо машинерії картинки — лишились виродженими (одна точка), щоб maskOut/outside не змінювати.
  const CLIP = [[GL.x0, -2], [GL.x1, -2], [GL.x1, GL.y1], [GL.x1, GL.y1], [GL.x1, GL.y1], [GL.x1, GL.y1], [GL.x1, GL.y1], [GL.x0, GL.y1]];
  const SOFA_TOP = 252, SOFA = [657, 891];                                           // нижче — диван (для віддзеркалення лишаємо як було)
  const PL = { x: MX(754), y: 63, r: 56 }, SUN = [MX(828), 41], RING = { a: 124, e: .19, th: -.26 };
  const DAY = 240;                                                                   // планета робить оберт за 4 хвилини
  const CLOUDS = [                                                                  // пасма: центр, розмір, тон (як на картинці: рожеві праворуч під кораблем)
    { x: 884, y: 94, w: 128, h: 14, seed: 3, k: .22 }, { x: 842, y: 108, w: 96, h: 7, seed: 4, k: .28 }, { x: 606, y: 101, w: 84, h: 9, seed: 5, k: .14 },
    { x: 732, y: 126, w: 150, h: 7, seed: 8, k: .3 }, { x: 664, y: 38, w: 74, h: 4, seed: 13, k: .12 }, { x: 864, y: 22, w: 58, h: 3.4, seed: 17, k: .08 },
  ].map(cl => ({ ...cl, x: MX(cl.x) }));
  // ---------- МЕГАПОЛІС v3 (NX.cityMega): план за планом, від дальніх до ближніх ----------
  // far2 — бліді силуети в рожевому серпанку; far1 — піраміда-мегаспоруда й щільні квартали; mid — вежі з вивісками;
  // hero — гіганти майбутнього (аркологія за край вікна, «космічна голка», скручена вежа, ворота-арка, голка, кругла
  // вежа з голограмою, основа космічного ліфта); між планами — небесні траси й серпанок, унизу — світло міста
  const CM = NX.cityMega, col2 = CK.col;
  let TUBE = null;
  const HEROES = [
    { x0: GL.x0, x1: GL.x0 + 50, top: -6, shape: 'mega', plane: 'hero', tone: 2, decks: [[30, 6, 3], [70, 9, 3.5], [110, 6, 3], [150, 10, 3.5]], glass: true, strip: 7, outline: true, rimI: NEON.cyan, rimO: NEON.pink, lit: .42, lights: ['lav', 'cyan', 'white'], holo: { x: GL.x0 + 20, y: 78, w: 26, h: 30, kind: 'nexi' } },
    { ...AT(666, 32), top: 50, shape: 'saucer', stem: 8, pod: { y: 82, a: 16, b: 3.6 }, pod2: { y: 108, a: 9, b: 2 }, plane: 'hero', tone: 2, band: 8, outline: true, ledge: NEON.pinkL, rimI: NEON.cyan, rimO: NEON.pink, lit: .5, lights: ['cyan', 'lav', 'white'] },
    { ...AT(723, 30), top: 96, shape: 'twist', seg: 10, sh: 10, plane: 'hero', tone: 2, glass: true, band: 6, bandC: NEON.cyan, outline: true, rimI: NEON.cyanL, rimO: NEON.violet, lit: .46, lights: ['pink', 'lav', 'warm'], crown: 3 },
    { ...AT(779, 54), top: 104, shape: 'arch', leg: 9, ah: 30, plane: 'hero', tone: 2, strip: 3, stripC: NEON.pink, glass: true, outline: true, rimI: NEON.cyanL, rimO: NEON.pink, lit: .4,
      sign: { x: MX(779) - 16.25, y: 94.5, text: 'NEXORA', dir: 'h', p: 1.25, c: '#ff3fd0', c2: '#3be8ff', posts: 104.2, spill: .5, spillR: 6 } },   // великий неон «NEXORA» на арці
    { fx: R => CB.elevatorBase(R, MX(832), 140, 252, { w: 30 }) },
    { ...AT(887, 26), top: 26, shape: 'needle', k: .5, plane: 'hero', tone: 2, band: 7, outline: true, rimI: NEON.cyan, rimO: NEON.violet, lit: .5, lights: ['warm', 'cyan', 'lav'] },
    { x0: GL.x1 - 48, x1: GL.x1 + 4, top: 18, shape: 'round', plane: 'hero', tone: 2, glass: true, strip: 5, stripC: NEON.pink, outline: true, rimI: NEON.cyanL, rimO: NEON.pink, holo: { x: GL.x1 - 42, y: 60, w: 12, h: 44, kind: 'tall' }, lit: .4, crown: 4 },
  ];
  const FAR = [                                                                       // дальні плани — растр 2 px/од. (у серпанку дрібниці не потрібні), потім підкладка під BACK
    { skyline: ['far2', 31, { w: [3.5, 9], top: [128, 162], tall: .2, tallBy: 36, lit: [.18, .32], step: .68, antP: .15, shapes: [['box', 5], ['round', 2], ['needle', 2], ['dome', 1], ['setback', 1]] }] },
    { b: { ...AT(832, 176), top: 86, bot: 236, shape: 'pyramid', steps: 22, plane: 'far1', tone: 4, lit: .55, lights: ['amber', 'warm', 'pink'], ledge: col2('#ffcf7a'), ant: [{ x: MX(832), h: 4 }] } },   // піраміда-мегаспоруда вдалині
    { haze: [118, 252, '#e070e6', .32] },
    { skyline: ['far1', 47, { w: [5, 12], top: [118, 154], tall: .18, tallBy: 32, lit: [.24, .42], step: .74, antP: .25, signP: .06, shapes: [['box', 6], ['setback', 2], ['round', 2], ['needle', 1], ['dome', 1]] }] },
    { fx: R => CB.skyway(R, 121, 61, { n: 90 }) },
    { fx: R => CM.mist(R, 140, 7, '#d070e8', .5, 3) },
    { haze: [138, 252, '#d25ee0', .3] },
  ];
  const BACK = [
    { skyline: ['mid', 53, { w: [7, 16], top: [108, 150], tall: .22, tallBy: 34, lit: [.26, .52], step: .82, antP: .3, signP: .42, avoid: [[MX(779) - 23, 89, MX(779) + 23, 106]], glassP: .18, mediaP: .14, shapes: [['box', 6], ['setback', 3], ['round', 2], ['needle', 1], ['saucer', 1], ['dome', 1]] }] },
    { b: { ...AT(628, 48), top: 132, plane: 'mid', tone: 1, lit: .3, holo: { x: MX(628) - 20, y: 144, w: 40, h: 11, kind: 'wide' }, ant: [{ x: MX(628) + 12, h: 6 }] } },   // будинок з великим білбордом
    { fx: R => CB.skyway(R, 150, 9, { n: 120 }) },
    ...HEROES.map(b => (b.fx ? b : { b })),
    { fx: R => CM.mist(R, 164, 6, '#c060e0', .45, 9) },
    { haze: [170, 252, '#ff58d0', .46, 1.7] },                                         // світло вулиць знизу: основи веж тонуть у рожевому сяйві
    { fx: R => { TUBE = CB.tube(R, [MX(596), 158], [MX(750), 196], [MX(916), 150], { posts: [.3, .7], postTo: 252 }); } },   // скляна труба маглева
    { fx: R => CB.skyway(R, 172, 19, { n: 130 }) },
  ];
  const FRONT = [
    { fx: R => { R.rect(R.x0, 252, R.x1, R.y1, (i, j, X, Y) => CK.ramp(NEAR_LOW, (Y - 252) / 90, i, j)); CB.highway(R, HWY.y, HWY.posts); CB.rail(R, RAIL.y, RAIL.posts); } },   // нижче 252 — за диваном: проста темна підкладка
    { skyline: ['near', 33, { w: [12, 26], top: [226, 246], bot: 258, lit: [.2, .34], step: .92, antP: .4, antH: 9, boxes: true, signP: .5, shapes: [['box', 5], ['dome', 2], ['round', 2], ['setback', 1]] }] },
  ];
  const NEAR_LOW = CK.pal(['#1a1250', '#120c3c', '#0c082c', '#08061e']);
  /** Растр плану з переліку: {skyline}, {b: будинок}, {haze}, {fx}. */
  function megaLayer(x0, y0, x1, y1, items, seed, pre, U = BU, live = { lights: [], win: [], signs: [], holo: [], pad: [] }) {
    const R = CK.Ras(x0, y0, x1, y1, U); let n = 0;
    if (U < .5) R.own = new Uint16Array(R.W * R.H);                                 // чий піксель (номер будинку) — щоб живі вікна не світили крізь ближчі вежі
    if (pre) pre(R);
    items.forEach(it => { const tt = performance.now();
      if (it.fx) it.fx(R, live);
      else if (it.haze) CM.haze(R, ...it.haze);
      else if (it.b) CM.building(R, it.b, live, seed * 1000 + (n++) * 37 + 11);
      else if (it.skyline) CM.skyline(it.skyline[0], x0, x1, it.skyline[1], it.skyline[2]).forEach(b => CM.building(R, b, live, seed * 1000 + (n++) * 37 + 11));
      if (window.CITY_LOG) console.log('  layer item', Object.keys(it)[0], (it.skyline || [it.b && it.b.shape || ''])[0], Math.round(performance.now() - tt), 'ms');
    });
    return { R, live };
  }
  // монорейка й шосе над диваном: опори з тим самим кроком (74 і 78), симетрично відносно центру вікна, скільки влізе
  const posts = (step, off) => { const a = []; for (let x = 774 + off - Math.floor((774 + off - GL.x0 - 40) / step) * step; x < GL.x1 - 40; x += step) a.push(x); return a; };
  const RAIL = { y: 199.5, posts: posts(74, 37) }, HWY = { y: 216.5, posts: posts(78, 39) };
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
  function maskOut(R) { for (let j = 0; j < R.H; j++) { const Y = R.Y(j); if (Y <= CLIP[2][1]) continue; const xs = Y > CLIP[4][1] ? CLIP[5][0] : CLIP[3][0], i0 = Math.max(0, Math.ceil((xs - R.x0) / R.U - .5)); if (i0 < R.W) R.d.fill(0, j * R.W + i0, (j + 1) * R.W); } }
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
  // ---------- МАЙБУТНЄ: трос космічного ліфта, літаюча платформа, голограма-кит ----------
  const ELEV = { x: MX(832), top: -2, base: 140, st: 22 };
  function elevSprite() {
    const R = CK.Ras(ELEV.x - 14, ELEV.top, ELEV.x + 14, ELEV.base + 1), c = CK.col, x = ELEV.x;
    R.rect(x - 1.5, ELEV.top, x + 1.5, ELEV.base, (i, j, X) => { const d = Math.abs(X - x); return d < .3 ? c('#e8fdff') : d < .8 ? c('#7af0ff') : 0; });
    for (let j = 0; j < R.H; j++) { R.over(R.I(x - 1.2), j, c('#3be8ff'), .35); R.over(R.I(x + 1.2), j, c('#3be8ff'), .35); }   // світіння троса
    const sy = ELEV.st, D = [c('#140c3a'), c('#1e1450'), c('#2a1e6a')];                     // орбітальна станція: диск з вогнями
    R.rect(x - 11, sy - 3.4, x + 11, sy + 3.4, (i, j, X, Y) => { const e = ((X - x) / 11) ** 2 + ((Y - sy) / 3.2) ** 2; if (e > 1) return 0; if (e > .78) return Y > sy ? c('#3be8ff') : c('#ff4fd8');
      return Math.abs(Y - sy) < .45 && ((X - x + 20) % 2.2) < 1.1 ? c('#ffe7a0') : D[CK.clamp(Math.round((Y < sy ? 1.6 : .6) + CK.B(i, j) * .8), 0, 2)]; });
    R.rect(x - 2.5, sy - 7.5, x + 2.5, sy - 3, (i, j, X, Y) => Y < sy - 7 ? c('#ff4fd8') : D[1]); R.rect(x - 1.2, sy - 6.2, x + 1.2, sy - 5.2, c('#9af6ff'));
    return L(R);
  }
  function platformSprite() {
    const R = CK.Ras(-20, -14, 20, 10), c = CK.col, H = [c('#0e0838'), c('#170e4c'), c('#221662'), c('#2e2078')];
    R.rect(-15, 0, 15, 8, (i, j, X, Y) => { const e = (X / 15) ** 2 + (Y / 8) ** 2; if (e > 1 || Y < .2) return 0; const rib = Math.abs(((X + 30) % 5) - 2.5) < .35;   // корпус знизу
      return rib ? c('#3a2a8a') : H[CK.clamp(Math.round((1 - Y / 8) * 2.4 + (X < 0 ? .5 : 0) + CK.B(i, j) * .8), 0, 3)]; });
    R.rect(-5, 6.5, 5, 8.6, (i, j, X, Y) => (X / 5) ** 2 + ((Y - 7.6) / 1.1) ** 2 <= 1 ? c('#9af6ff') : 0);                   // антигравітаційне кільце
    R.rect(-17.5, -2.8, 17.5, 2.8, (i, j, X, Y) => { const e = (X / 17.5) ** 2 + (Y / 2.6) ** 2; if (e > 1) return 0; if (e > .8) return Y > 0 ? c('#3be8ff') : c('#b4f8ff');   // палуба
      return Y < 0 ? c('#3a3290') : c('#28206e'); });
    R.rect(-12, -7, -3, -1, (i, j, X, Y) => { const e = ((X + 7.5) / 4.5) ** 2 + ((Y + 1) / 6) ** 2; return e <= 1 ? (e > .78 ? c('#ff4fd8') : X < -8 ? c('#4a3aa8') : c('#2e2280')) : 0; });   // купол
    R.rect(3, -12, 7, -1, (i, j, X, Y) => X < 3.5 || X > 6.5 ? c('#3be8ff') : (Math.floor(Y) % 2 ? c('#1a1250') : c('#ffbe5c')));   // вежка з вікнами
    R.rect(4.8, -14, 5.2, -12, c('#9aa6e8'));
    return { ...L(R), ox: -20, oy: -14 };
  }
  /** Голографічний кит (горбань) у профіль, голова праворуч: силует з довгим грудним плавцем, спинним плавцем і хвостовими
   *  лопатями; заливка напівпрозора зі скан-лініями, яскравий контур, голо-сітка, лінія рота, око, складки на горлі. */
  function whaleSprite() {
    const R = CK.Ras(0, 0, 80, 31), c = CK.col, CY = c('#5af0ff'), CB2 = c('#e0fdff');
    const BODY = [[12, 13.5], [20, 11.5], [30, 9], [40, 7], [50, 5.8], [58, 5.6], [65, 6.4], [71, 8.4], [75, 11], [77.6, 13.8], [77.4, 14.8], [75, 17.6], [70, 20.6], [62, 22.7], [52, 23.1], [42, 21.7], [32, 19.4], [22, 17], [14, 15.4], [12, 14.6]];
    const PARTS = [BODY, [[26, 9.8], [29.4, 6.9], [32.6, 8.7]], [[58.5, 20.4], [52, 23.6], [41, 29.2], [39.2, 28], [48.6, 22.4]],
      [[12.5, 13.3], [6.5, 10.4], [1, 8.2], [2.8, 11.6], [5.6, 14], [2.8, 16.6], [1, 20.2], [6.5, 17.8], [12.5, 14.9]]];
    const W = R.W, H = R.H, m = new Uint8Array(W * H), cs = [];
    PARTS.forEach(pts => { const n = pts.length; for (let j = 0; j < H; j++) { const Y = R.Y(j); cs.length = 0;
      for (let a = 0, b = n - 1; a < n; b = a++) { const ya = pts[a][1], yb = pts[b][1]; if ((ya > Y) !== (yb > Y)) cs.push(pts[a][0] + (pts[b][0] - pts[a][0]) * (Y - ya) / (yb - ya)); }
      cs.sort((p, q) => p - q); for (let k = 0; k + 1 < cs.length; k += 2) for (let i = Math.max(0, R.I(cs[k])); i <= Math.min(W - 1, R.I(cs[k + 1])); i++) m[j * W + i] = 1; } });
    const inB = (i, j) => i >= 0 && j >= 0 && i < W && j < H && m[j * W + i];
    for (let j = 0; j < H; j++) for (let i = 0; i < W; i++) { if (!m[j * W + i]) continue;
      const X = R.X(i), Y = R.Y(j), edge = !inB(i - 1, j) || !inB(i + 1, j) || !inB(i, j - 1) || !inB(i, j + 1);
      const grid = X > 13 && X < 76 && (((X + 600) % 6) < .3 || Math.abs(Y - (14 + (X - 12) * -.02)) < .14);
      R.over(i, j, edge ? CB2 : CY, edge ? .95 : grid ? .5 : (j % 2 ? .12 : .24)); }
    for (let x = 64; x <= 77; x += .2) R.over(R.I(x), R.J(14.3 + (77 - x) * .14 + Math.sin((77 - x) / 13 * Math.PI) * .5), CB2, .9);   // лінія рота
    for (let k = 0; k < 4; k++) for (let x = 47 + k; x <= 70 - k * 2; x += .25) R.over(R.I(x), R.J(18.2 + k * 1.15 + (70 - x) * .06), CY, .55);   // складки на горлі
    R.rect(62.4, 12.6, 63.6, 13.8, CB2);                                                                              // око
    return L(R);
  }

  /** Текст міста поточною мовою (js/i18n/*.js -> city.*), великими літерами; немає ключа — запасний. */
  const txt = (k, def) => { const v = NX.t ? NX.t('city.' + k) : def; return String(v === 'city.' + k ? def : v).toLocaleUpperCase(); };
  /** Піксельний текст у полотно (1 px = 1 піксель шрифту) — для білборда й дирижабля. */
  function textCanvas(s, colors) {
    const w = CK.glyphW(s) + 1, cv = document.createElement('canvas'); cv.width = w; cv.height = 5; const x = cv.getContext('2d'); let cx = 0, n = 0;
    for (const ch of s) { const g = CK.gf(ch); if (ch !== ' ') { x.fillStyle = colors[n++ % colors.length]; g.forEach((row, j) => { for (let i = 0; i < row.length; i++) if (row[i] === 'X') x.fillRect(cx + i, j, 1, 1); }); } cx += g[0].length + 1; }
    return cv;
  }

  // ---------- побудова ----------
  const FAR_Y0 = -2, FAR_H = 160, BLD_Y0 = 2, BU = .25;                             // BU — од. на піксель растрів будинків (4 px/од.: дрібні вогники-вікна)                                        // небо: y -2..158; будинки (обидва плани разом): y 2..345
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
    const far = megaLayer(GL.x0, BLD_Y0, GL.x1, 252, FAR, 3, R => skyFill(R, 150), BU * 2);
    const back = megaLayer(GL.x0, BLD_Y0, GL.x1, 252, BACK, 5, R => {                     // підкладка — дальні плани (кожен їхній піксель = 2×2)
      const fw = far.R.W, fd = far.R.d, d = R.d; for (let j = 0; j < R.H; j++) { const fr = Math.min(far.R.H - 1, j >> 1) * fw, row = j * R.W; for (let i = 0; i < R.W; i++) d[row + i] = fd[fr + Math.min(fw - 1, i >> 1)]; } }, BU, far.live);
    const front = megaLayer(GL.x0, 150, GL.x1, GL.y1, FRONT, 9);                          // низ над диваном: шосе, монорейка, низькі дахи
    [back.R, front.R].forEach(maskOut);                                              // форма вікна запікається в растри — щокадру без дорогого clip()
    // обидва плани — в одне полотно (щокадру один drawImage); живі точки дальнього плану, які закриває ближній, — прибираємо
    const bld = document.createElement('canvas'); bld.width = back.R.W; bld.height = Math.round((GL.y1 - BLD_Y0) / BU); const bx = bld.getContext('2d');
    bx.drawImage(back.R.canvas(), 0, 0); bx.drawImage(front.R.canvas(), 0, Math.round((150 - BLD_Y0) / BU));
    const covered = (x, y) => { const v = front.R.get(front.R.I(x), front.R.J(y)); return v !== 0 && v >>> 24 > 40; };
    const vis = o => o.x >= GL.x0 && o.x <= GL.x1 && !outside(o.x, o.y);
    const liveB = back.live, liveF = front.live;
    const mine = (R, w) => R.own[R.J(w.y + w.h / 2) * R.W + R.I(w.x + w.w / 2)] === w.id;
    liveB.win = liveB.win.filter(w => vis(w) && mine(back.R, w) && ![[w.x, w.y], [w.x + w.w, w.y], [w.x, w.y + w.h], [w.x + w.w, w.y + w.h]].some(([x, y]) => covered(x, y)));
    // вивіска «жива», лише якщо її рамку видно (не закрита ближчою вежею в тому ж растрі, не за межами вікна)
    const signOk = (R, sg) => [[sg.x + .1, sg.y + .1], [sg.x + sg.w - .1, sg.y + .1], [sg.x + .1, sg.y + sg.h - .1], [sg.x + sg.w - .1, sg.y + sg.h - .1]].filter(([x, y]) => { const v = R.get(R.I(x), R.J(y)); return v && Math.max(...CK.rgb(v)) > 110; }).length >= 3;
    liveB.lights = liveB.lights.filter(l => vis(l) && !covered(l.x, l.y)); liveB.signs = liveB.signs.filter(sg => signOk(back.R, sg) && !covered(sg.x + sg.w / 2, sg.y + sg.h - 1));
    liveF.win = liveF.win.filter(w => mine(front.R, w)); ['win', 'lights'].forEach(k => { liveF[k] = liveF[k].filter(vis); }); liveF.signs = liveF.signs.filter(sg => signOk(front.R, sg));
    const r = CK.rng(77);
    S = {
      sky: L(sky), ringB: L(ring.back), ringF: L(ring.front), planet, prot: -1, pfit: null,
      clouds: CLOUDS.map(cl => L(SK.Cloud(cl))), bld: { cv: bld, x: GL.x0, y: BLD_Y0, w: GW, h: GL.y1 - BLD_Y0 },
      liveB, liveF, cars: CARC.map(carSprite), airship: airshipSprite(), ship: shipSprite(),
      ad: textCanvas(txt('ad', 'NEXORA AI · NEXI ♥ · '), ['#ff6ad8', '#5aeaff', '#ff6ad8', '#5aeaff', '#ffe27a', '#ff6ad8']), zep: textCanvas(txt('zep', 'NEXORA AI ♥ '), ['#9af6ff', '#ff8ade']),   // тексти — зі словника мов
      beam: beamSprite(),
      tw: Array.from({ length: 22 }, () => [GL.x0 + 6 + r() * (GW - 12), 4 + r() * 84, r() * 6.28, .9 + r() * 1.4]).filter(([x, y]) => Math.hypot(x - PL.x, y - PL.y) > PL.r + 5).slice(0, 16),
      lanes: LANES.map(Ln => Array.from({ length: Ln.n }, (_, k) => ({ x: GL.x0 + (k + r() * .6) * GW / Ln.n, c: (k + Ln.st) % 4, dy: (r() - .5) * 3 }))),
      train: null, trainT: 6 + r() * 10, trainSp: trainSprite(), skyC: null,
      elev: elevSprite(), plat: platformSprite(), whale: whaleSprite(), tube: TUBE,
    };
    planet.update(0); bloom();
    NX.room.pieces = PIECES;                                                         // кімната більше не малює картинку під вікном — там усе кодом
    S.ms = Math.round(performance.now() - t0); if (window.CITY_LOG) console.log("city build ms", S.ms);
  }
  // що кімната ще малює з картинки: ліворуч (під лівим крилом) і підлогу під вікном до правого краю дивана (далі — підлога правого крила)
  const PIECES = [[0, 0, GL.x0, 368], [GL.x0, GL.y1, 891, 368]];
  /** Сяйво міста (bloom): яскраві пікселі нерухомої копії, зменшені й розмиті в 3 масштабах (як у крила),
   *  ЗАПІКАЄТЬСЯ в небо (skyCache) і в будинки (лише на самі будинки) — щокадру нічого не коштує. На всю ширину скла. */
  function bloom() {
    try {
      const w = Math.round(GW), h = Math.round(GL.y1 + 2), a = document.createElement('canvas'); a.width = w; a.height = h;   // 1 px/од.
      const x = a.getContext('2d'); x.imageSmoothingEnabled = true; x.imageSmoothingQuality = 'high'; x.translate(-GL.x0, 2); paint(x, 0, 'bloom', 1);
      const down = (src, f) => { const o = document.createElement('canvas'); o.width = Math.max(1, Math.round(src.width / f)); o.height = Math.max(1, Math.round(src.height / f)); const ox = o.getContext('2d', { willReadFrequently: true }); ox.imageSmoothingEnabled = true; ox.imageSmoothingQuality = 'high'; ox.drawImage(src, 0, 0, o.width, o.height); return o; };
      const b1 = down(a, 4), bx = b1.getContext('2d', { willReadFrequently: true }), im = bx.getImageData(0, 0, b1.width, b1.height), d = im.data;
      for (let i = 0; i < d.length; i += 4) { const m = Math.max(d[i], d[i + 1], d[i + 2]), k = Math.max(0, (m - 125) / 130); d[i] *= k; d[i + 1] *= k; d[i + 2] *= k; }   // як у крила (wing_wall.js)
      bx.putImageData(im, 0, 0); const b2 = down(b1, 2), b3 = down(b2, 2);
      const bc = document.createElement('canvas'); bc.width = b1.width; bc.height = b1.height; const cx2 = bc.getContext('2d'); cx2.globalCompositeOperation = 'lighter'; cx2.imageSmoothingEnabled = true;
      [[b1, .14], [b2, .26], [b3, .36]].forEach(([b, k]) => { cx2.globalAlpha = k; cx2.drawImage(b, 0, 0, bc.width, bc.height); });
      S.bloom = bc;
      // у будинки: сяйво лише поверх самих будинків (маска — їхня непрозорість), додаванням кольору
      const B = S.bld.cv, m = document.createElement('canvas'); m.width = B.width; m.height = B.height; const mx = m.getContext('2d'); mx.imageSmoothingEnabled = true;
      mx.drawImage(bc, 0, 0, bc.width, bc.height, 0, (-2 - BLD_Y0) / BU, B.width, (GL.y1 + 2) / BU);   // сяйво (y -2..345) -> пікселі будинків (y 2..345, 4 px/од.)
      mx.globalCompositeOperation = 'destination-in'; mx.drawImage(B, 0, 0);
      const bxx = B.getContext('2d'); bxx.globalCompositeOperation = 'lighter'; bxx.drawImage(m, 0, 0);
      bxx.globalCompositeOperation = 'source-atop'; bxx.setTransform(1 / BU, 0, 0, 1 / BU, -GL.x0 / BU, -BLD_Y0 / BU); glassStatic(bxx, false); bxx.setTransform(1, 0, 0, 1, 0, 0); bxx.globalCompositeOperation = 'source-over';   // відблиски скла — і на будинках
    } catch (e) { S.bloom = null; }
  }
  /** Нерухомий дальній план під екран: небо + задня половина кільця + м'яке сяйво планети + сяйво міста (будується раз на роздільність). */
  function skyCache(R) {
    if (S.skyC && S.skyR === R) return S.skyC;
    const w = Math.round(GW * R), h = Math.round(FAR_H * R), cv = S.skyC && S.skyC.width === w && S.skyC.height === h ? S.skyC : document.createElement('canvas'); cv.width = w; cv.height = h;
    const x = cv.getContext('2d'); x.setTransform(R, 0, 0, R, -GL.x0 * R, -FAR_Y0 * R);
    blit(x, S.sky, R); blit(x, S.ringB, R); P.glow(x, PL.x + 12, PL.y - 10, 76, 'rgba(70,170,255,.5)', .16);
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
    P.glow(x, (PL.x + 12 - pl.x) * k, (PL.y - 10 - pl.y) * k, 76 * k, 'rgba(80,190,255,.5)', .2);
    x.globalCompositeOperation = 'destination-in'; x.drawImage(pl.cv, 0, 0); return (S.pglow = cv);
  }
  /** Хмари пливуть праворуч (по колу в межах вікна): кожна — свій спрайт. */
  function clouds(c, t, R) {
    const co = (t * .55) % GW;
    S.clouds.forEach(A => { let x = A.x + co; if (x > GL.x1) x -= GW; blit(c, A, R, x - A.x); if (x + A.w > GL.x1) blit(c, A, R, x - A.x - GW); });
  }
  /** Нерухома копія міста в контекст c (координати кімнати): для віддзеркалення в підлозі й сяйва.
   *  mode 'patch' — без частини за диваном (там віддзеркалення лишається як було), інакше ('full') — усе скло. R — роздільність (px/од.). */
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
    const sp = S.ship, x = MX(838) + Math.sin(t / 9) * 6, y = 54 + Math.sin(t * .9) * 1.2, s = 1.25;   // зависає праворуч від планети, перед вежею
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
    [[MX(688), 176, .4, .35], [MX(872), 178, -.3, .28]].forEach(([bx, by, ph, sp]) => { const a = -Math.PI / 2 + Math.sin(t * sp + ph * 5) * .48, len = 230;
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
  /** Космічний ліфт: трос зі станцією + капсули, що їдуть угору й униз. */
  function elevator(c, t, R) {
    blit(c, S.elev, R); const x = ELEV.x;
    [[(t * 6.5) % 150, 1], [(t * 4.2 + 70) % 150, -1]].forEach(([q, dir], n) => { const y = dir > 0 ? ELEV.base - q : ELEV.top + q - 6; if (y < ELEV.top - 4 || y > ELEV.base - 3) return;
      c.fillStyle = '#1a1450'; c.fillRect(x - 1.6, y, 3.2, 4.4); c.fillStyle = '#ffd36a'; c.fillRect(x - 1, y + 1, .8, .9); c.fillRect(x + .2, y + 1, .8, .9); c.fillStyle = '#ff4fd8'; c.fillRect(x - 1.6, y + 3.8, 3.2, .6);
      CK.glow(c, x, y + 2, 4.5, '120,240,255', .5); });
    CK.glow(c, x, ELEV.st, 14, '255,90,220', .18 + .06 * Math.sin(t * 1.3));
  }
  /** Голограма-кит пливе над містом справа наліво (назустріч дирижаблю), адитивно, з мерехтінням, скан-лінією й променем проектора. */
  function whale(c, t) {
    const per = 110, A = S.whale, q = ((t + 40) % per) / per, x = GL.x1 + 10 - q * (GW + A.w + 30), y = 40 + 3 * Math.sin(t * .35), fl = .8 + .2 * Math.sin(t * 13) * Math.sin(t * 3.1), yy = y + Math.sin(t * .9) * .6;
    c.save(); c.globalCompositeOperation = 'lighter'; c.globalAlpha = .8 * fl; c.imageSmoothingEnabled = true;
    c.translate(x + A.w, yy); c.scale(-1, 1); c.drawImage(A.cv, 0, 0, A.w, A.h); c.restore();                       // голова ліворуч — пливе ліворуч
    c.save(); c.globalCompositeOperation = 'lighter'; c.globalAlpha = .25 * fl; c.fillStyle = '#9af6ff'; c.fillRect(x, y + ((t * 6) % A.h), A.w, .5);
    if (Math.sin(t * .7) > .2) { c.globalAlpha = .1; c.fillStyle = '#5af0ff'; c.beginPath(); c.moveTo(x + A.w * .45, y + A.h * .8); c.lineTo(x + A.w * .35, 150); c.lineTo(x + A.w * .6, 150); c.fill(); }   // промінь проектора знизу
    c.restore(); CK.glow(c, x + A.w * .45, y + A.h * .5, 30, '90,230,255', .1 * fl);
  }
  /** Капсули маглева в скляній трубі. */
  function tubePods(c, t) {
    const pts = S.tube, N = pts.length - 1;
    for (let k = 0; k < 3; k++) { const dir = k % 2 ? -1 : 1, u = ((t * .045 * (1 + k * .15) + k / 3) % 1), idx = Math.floor((dir > 0 ? u : 1 - u) * N), [x, y] = pts[idx], [x2, y2] = pts[Math.min(N, idx + 1)], a = Math.atan2(y2 - y, x2 - x);
      c.save(); c.translate(x, y); c.rotate(a); c.fillStyle = '#e8fbff'; c.fillRect(-3, -.9, 6, 1.8); c.fillStyle = '#3be8ff'; c.fillRect(-3, .5, 6, .4); c.restore(); CK.glow(c, x, y, 5, '150,240,255', .45); }
  }
  /** Літаюча платформа з куполом і вежкою: погойдується, світиться знизу. */
  function platform(c, t, R) {
    const A = S.plat, cx = MX(779), cy = 151 + Math.sin(t * .8) * 1.3; blit(c, { ...A, x: cx + A.ox, y: cy + A.oy }, R);
    CK.glow(c, cx, cy + 8, 9, '120,240,255', .35 + .12 * Math.sin(t * 2.2));
    for (let k = 0; k < 6; k++) { const on = (Math.floor(t * 3) + k) % 6 < 2; c.fillStyle = on ? '#ff4fd8' : '#4a1a50'; c.fillRect(cx - 15 + k * 6, cy + 1.6, .8, .7); }
    if (Math.sin(t * 4) > 0) { c.fillStyle = '#ff3b3b'; c.fillRect(cx + 4.6, cy - 14.6, .8, .8); }
  }
  function drones(c, t) {
    for (let i = 0; i < 6; i++) { const a = t * .18 + i * .5, x = MX(812) + Math.sin(a) * 46 + Math.sin(t * 1.3 + i) * 2, y = 158 + Math.sin(a * 2) * 9 - i * 1.6;
      P.rect(c, x, y, 1.8, .7, '#9aa0c0'); P.rect(c, x - .4, y - .3, 2.6, .3, '#5a6090'); if (Math.sin(t * 7 + i) > .3) P.rect(c, x + .6, y + .7, .6, .6, i % 2 ? '#ff3b3b' : '#3bff8a'); }
  }
  function lights(c, t, Lv) {
    Lv.lights.forEach(l => { const on = ((t + l.ph) % 1.7) < .3; if (!on) { c.fillStyle = '#5a1020'; c.fillRect(l.x - .4, l.y - .4, .8, .8); return; } c.fillStyle = '#ff4a4a'; c.fillRect(l.x - .45, l.y - .45, .9, .9); CK.glow(c, l.x, l.y, 3.5, '255,60,60', .5); });
    Lv.win.forEach(w => { const a = Math.sin(t * w.f + w.ph); if (a < .25) return; c.globalAlpha = Math.min(1, (a - .25) * 4); c.fillStyle = w.c; c.fillRect(w.x, w.y, w.w, w.h); }); c.globalAlpha = 1;
    Lv.signs.forEach((s, n) => {                                                      // неонові написи: по літері спалахують, зрідка блимає вся вивіска
      if (CK.hash2(Math.floor(t * 9), n) > .975) { c.fillStyle = 'rgba(6,3,20,.62)'; c.fillRect(s.x, s.y, s.w, s.h); return; }
      const L = s.letters.length, k = Math.floor(t * 2.4 + n * 3.7) % (L + 3); if (k >= L) return;
      if (!s.hi) { const [r, g, b] = CK.rgb(CK.mix(s.c, '#ffffff', .65)); s.hi = `rgb(${r},${g},${b})`; s.rgb = CK.rgb(CK.col(s.c)).join(','); }
      const [ch, x, y] = s.letters[k]; c.globalAlpha = .85; CK.glyph(c, ch, x, y, s.p, s.hi); c.globalAlpha = 1; CK.glow(c, x + 1.5 * s.p, y + 2.5 * s.p, 3 + 3 * s.p, s.rgb, .4); });
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
    } else if (h.kind === 'nexi') {                                                  // велика голограма Nexi: обличчя, що кліпає й усміхається, напис
      const p = Math.min(h.w / 9, h.h / 11), ox = h.x + (h.w - 7 * p) / 2, oy = h.y + 2, blink = (t % 4.2) < .14, page = Math.floor(t / 6) % 3;
      c.globalAlpha = fl; bitmap(c, NEXI, ox, oy, p, '#9af6ff');
      c.fillStyle = page === 1 ? '#ff6ad8' : '#5aeaff'; if (!blink) { c.fillRect(ox + 2 * p, oy + 2 * p, p, p); c.fillRect(ox + 4 * p, oy + 2 * p, p, p); }   // очі
      if (page === 1) { c.fillStyle = '#ff6ad8'; c.fillRect(ox + 2 * p, oy + 3.6 * p, 3 * p, p * .6); }                                // усмішка
      c.globalAlpha = fl * .9; CK.glyph(c, page === 2 ? 'AI' : 'NEXI', h.x + (h.w - CK.glyphW(page === 2 ? 'AI' : 'NEXI') * p * .42) / 2, oy + 7.2 * p, p * .42, page === 2 ? '#ffe27a' : '#ff6ad8');
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
    CK.glow(c, h.x + h.w / 2, h.y + h.h / 2, Math.max(h.w, h.h) * .7, h.kind === 'tall' ? '255,90,220' : '80,220,255', (h.kind === 'nexi' ? .16 : .08) * fl);
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
  const STREAKS = [[598, 22, .045], [632, 2.2, .07], [828, 34, .032], [874, 3, .05]].map(([x, w, a]) => [MX(x), w, a]);
  function glassStatic(c, sky) {
    c.save(); STREAKS.forEach(([x, w, a]) => { c.fillStyle = `rgba(220,235,255,${a})`; c.beginPath(); c.moveTo(x, 0); c.lineTo(x + w, 0); c.lineTo(x + w + 150, GL.y1); c.lineTo(x + 150, GL.y1); c.fill(); });
    if (sky) { const hg = c.createLinearGradient(0, 5, 0, 17); hg.addColorStop(0, 'rgba(4,2,20,.5)'); hg.addColorStop(1, 'rgba(4,2,20,0)'); c.fillStyle = hg; c.fillRect(GL.x0, 5, GW, 12); }   // тінь під верхньою балкою
    c.restore();
  }
  function glass(c, t) {
    const g = (t % 26) / 26, gx = GL.x0 - 80 + g * (GW + 160); if (g >= .55) return;
    c.save(); c.clip(CLIPP); c.fillStyle = 'rgba(200,240,255,.05)'; c.beginPath(); c.moveTo(gx, 0); c.lineTo(gx + 14, 0); c.lineTo(gx + 164, GL.y1); c.lineTo(gx + 150, GL.y1); c.fill(); c.restore();
  }

  /** Передня підлога-дзеркало на всю ширину скла (GL.x0..GL.x1): картинка + місто (без частини за диваном — там лишається
   *  віддзеркалення дивана) + рама вікна + рослина біля дивану. Один раз після старту. */
  function patchFloor(t) {
    const img = NX.room.img, RS = NX.room.RS; if (!img.naturalWidth) return;
    const cv = document.createElement('canvas'); cv.width = img.naturalWidth; cv.height = img.naturalHeight; const x = cv.getContext('2d');
    x.drawImage(img, 0, 0); x.save(); x.scale(RS, RS); paint(x, t, 'patch', RS);
    ['windowFrame', 'plant'].forEach(id => { const o = NX.objects[id]; if (o && o.drawBack) o.drawBack(x, t); });
    x.restore(); NX.room.patchFront(cv, GL.x0, GL.x1);
  }
  let frames = 0;
  return {
    GL, CLIP, CLIPP,
    init() {},
    /** Мову змінено: вивіски й реклама — іншими словами, тож місто збирається заново (наступного кадру). */
    relang() { if (S) { S = null; frames = 0; } },
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
      if (S.elev) elevator(c, t, R);
      ship(c, t); airship(c, t); shuttle(c, t); clouds(c, t, R);
      if (S.whale) whale(c, t);
      searchlights(c, t); fireworks(c, t, dt); lane(c, t, dt, 0);
      c.restore();
      blit(c, S.bld, R);                                                               // обидва плани будинків разом (зі сяйвом)
      lights(c, t, S.liveB); drones(c, t); lane(c, t, dt, 1); lights(c, t, S.liveF);
      if (S.tube) tubePods(c, t); if (S.plat) platform(c, t, R);
      c.save(); c.beginPath(); c.rect(GL.x0, 150, GW, 70); c.clip(); train(c, t, dt); lane(c, t, dt, 2); c.restore();                      // потяг і близькі машини — до самого відкосу
      glass(c, t);
      c.restore();
      if (++frames === 8 && !c.isRefl) { if (NX.arc && NX.arc.patchFront) NX.arc.patchFront(); else patchFloor(t); }   // крила «по дузі» (#rw-3d) латають передню підлогу на всю ширину самі
    },
  };
})();
/** Вікно як об'єкт: тап -> Nexi підходить і милується містом (феєрверк). */
NX.addObject({ id: 'cityWindow', name: 'obj.window', act: 'window', hit: { x: NX.cfg.WIN.L + 40, y: 4, w: NX.cfg.WIN.R - NX.cfg.WIN.L - 80, h: 156 } });
NX.i18n.onLang(() => NX.city.relang());                                              // вивіски й реклама міста — новою мовою

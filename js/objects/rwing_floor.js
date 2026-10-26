/* ============================================================================
 * objects/rwing_floor.js — ПРАВЕ КРИЛО: ПІДЛОГА (плитка, калюжі світла, віддзеркалення) І СЯЙВО
 * ----------------------------------------------------------------------------
 * Як у лівого крила (objects/wing_floor.js), лише для x 887.5..1536:
 *   ПЛИТКА І КАЛЮЖІ — запікаються в растр підлоги під крилом (NX.rwing.floorFx, викликає rwing_wall.js),
 *     тими самими функціями, що й ліворуч (NX.wing.paintTiles / paintPuddles): плитка в перспективі,
 *     піксельні калюжі світла під неоном платформи сканера, верстата, порталу, термінала й колони.
 *   ВІДДЗЕРКАЛЕННЯ — під кожною зоною підлога відбиває те, що на ній стоїть (раз на 4 кадри: платформа
 *     сканера, машинерія, термінал, верстат, база порталу — їхні об'єкти дають reflect(c, t)); біля лінії
 *     контакту щільне, далі згасає, смуги глянцю — лише вдалині.
 *   СЯЙВО (bloom) — розмиті яскраві місця нерухомої копії крила (NX.rwing.bloom, рахує rwing_wall.js) запікаються
 *     в злиття нерухомого (rwing_wall.js -> compose): ореоли навколо неону, екранів, вихору порталу, ліхтарів —
 *     щокадру нічого не коштують (окремий адитивний шар на все крило коштував ~4 кадри/с).
 * ========================================================================== */
(() => {
  const P = NX.px, K = NX.kit, F = NX.furn, RW = NX.rwing;
  const PK = [255, 79, 216], CY = [59, 232, 255], VI = [150, 90, 255], OR = [255, 150, 70];
  // калюжі світла під неоном (x, y — центр; rx, ry; up — зсув найяскравішого до джерела; rgb; k — сила; ph — форма)
  RW.PUDDLES = [
    { x: 1004, y: 346, rx: 50, ry: 5.5, up: .5, rgb: PK, k: .7, ph: .3 }, { x: 1005, y: 345.5, rx: 16, ry: 3.6, up: .5, rgb: OR, k: .55, ph: 1.1 },   // платформа сканера: рожевий кант і помаранчева щілина
    { x: 920, y: 345.5, rx: 22, ry: 4, up: .5, rgb: PK, k: .5, ph: 2.2 },                                        // машинерія перед склом
    { x: 1115, y: 347.5, rx: 16, ry: 4, up: .5, rgb: CY, k: .55, ph: 2.8 },                                      // термінал
    { x: 1146, y: 343, rx: 10, ry: 3.5, up: .5, rgb: PK, k: .45, ph: 3.3 },                                      // неон колони
    { x: 1190, y: 354, rx: 34, ry: 5.5, up: .5, rgb: PK, k: .72, ph: 3.9 }, { x: 1262, y: 354.5, rx: 40, ry: 6, up: .5, rgb: PK, k: .78, ph: 4.4 },   // плита верстата
    { x: 1330, y: 352, rx: 14, ry: 4, up: .5, rgb: CY, k: .5, ph: 5.1 },                                         // пульт порталу
    { x: 1432, y: 363, rx: 70, ry: 5.5, up: .45, rgb: VI, k: .8, ph: 5.6 }, { x: 1432, y: 362.5, rx: 40, ry: 4, up: .45, rgb: PK, k: .55, ph: 6.2 },   // база порталу
  ];
  // запікання: растр підлоги під крилом (rwing_wall.js, 2 px/од.) — плитка й калюжі; base — без них (для нерухомої копії)
  RW.floorFx = S => {
    S.base = S.cv; const cv = document.createElement('canvas'); cv.width = S.base.width; cv.height = S.base.height; cv.getContext('2d').drawImage(S.base, 0, 0); S.cv = cv;
    const c = cv.getContext('2d'); c.save(); c.setTransform(1 / S.U, 0, 0, 1 / S.U, -S.x0 / S.U, -S.y0 / S.U);
    c.beginPath(); c.rect(RW.X0, 341, RW.WX0 - RW.X0, 30); c.rect(RW.WX0, RW.FLOOR, RW.WX1 - RW.WX0, 32); c.clip();
    if (NX.wing.paintTiles) NX.wing.paintTiles(c, 336, 368, .75); if (NX.wing.paintPuddles) NX.wing.paintPuddles(c, RW.PUDDLES); c.restore();
  };

  /* ---------------- ВІДДЗЕРКАЛЕННЯ ПІД ЗОНАМИ ---------------- */
  // лінії підлоги [x0, x1, y]: під машинерією й капсулою, термінал, верстат, база порталу
  const LINES = [[RW.X0, 1068, 342], [1068, 1134, 344], [1134, 1336, 350], [1336, RW.WX1, 358]], X0 = RW.X0, X1 = RW.WX1, Y0 = 250, H = 120;

  function streaks(w, h) {
    const s = document.createElement('canvas'); s.width = w; s.height = h; const x = s.getContext('2d');
    for (let i = 0; i < w; i += 3) { const v = P.hash(i, 9); if (v > .55) { x.fillStyle = `rgba(0,0,0,${(v - .55) * 1.8})`; x.fillRect(i, 0, 2, h); } }
    for (let j = 0; j < h; j += 2) { const k = 1 - j / h; if (k > .55) { x.fillStyle = `rgba(0,0,0,${(k - .55) * .9})`; x.fillRect(0, j, w, 1); } }
    x.globalCompositeOperation = 'destination-in'; const g = x.createLinearGradient(0, 0, 0, h); g.addColorStop(0, 'rgba(0,0,0,1)'); g.addColorStop(.62, 'rgba(0,0,0,.55)'); g.addColorStop(.86, 'rgba(0,0,0,0)'); x.fillStyle = g; x.fillRect(0, 0, w, h);
    return s;
  }
  /** Віддзеркалення ЗАПІКАЄТЬСЯ в растр підлоги один раз (усе, що відбивається, — нерухомі растри зон): щокадру нічого не коштує. */
  function bake() {
    const S = RW.floor(); if (!S || !S.cv) return false;
    const R = 2, w = Math.round((X1 - X0) * R), h = Math.round(H * R), cv = document.createElement('canvas'); cv.width = w; cv.height = h; const cx = cv.getContext('2d');
    cx.setTransform(R, 0, 0, R, -X0 * R, -Y0 * R); cx.imageSmoothingEnabled = true; RW.reflectors.forEach(f => f(cx, NX.time));
    cx.setTransform(1, 0, 0, 1, 0, 0); cx.globalCompositeOperation = 'destination-in';                    // біля лінії контакту відбиття щільне, далі швидко згасає
    const g = cx.createLinearGradient(0, 0, 0, h); g.addColorStop(0, 'rgba(0,0,0,0)'); g.addColorStop(.5, 'rgba(0,0,0,.22)'); g.addColorStop(.84, 'rgba(0,0,0,.72)'); g.addColorStop(1, 'rgba(0,0,0,1)'); cx.fillStyle = g; cx.fillRect(0, 0, w, h);
    cx.globalCompositeOperation = 'destination-out'; cx.drawImage(streaks(w, h), 0, 0);                    // смуги глянцю — лише вдалині
    const out = document.createElement('canvas'); out.width = S.cv.width; out.height = S.cv.height; const o = out.getContext('2d'); o.drawImage(S.cv, 0, 0);
    o.setTransform(1 / S.U, 0, 0, 1 / S.U, -S.x0 / S.U, -S.y0 / S.U); o.imageSmoothingEnabled = true;
    LINES.forEach(([a, b, line]) => { o.save(); o.beginPath(); o.rect(a, line, b - a, 368 - line); o.clip(); o.translate(0, line * 2); o.scale(1, -1); o.globalAlpha = .4; o.drawImage(cv, (a - X0) * R, 0, (b - a) * R, h, a, Y0, b - a, H); o.restore(); });
    S.cv = out; RW.ver++; return true;                                                                        // нове полотно — кеш під екран (F.fit) і злиття перебудуються
  }
  let baked = false, fr = 0;
  NX.addObject({
    id: 'rwingFloor', rw: true,
    drawBack(c, t) { if (!baked && !c.isRefl && !RW.patching && ++fr > 2 && RW.reflectors.length) baked = bake(); },
  });
})();

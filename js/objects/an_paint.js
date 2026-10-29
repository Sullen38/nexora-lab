/* ============================================================================
 * objects/an_paint.js — АНАЛІТИКА («ОБСЕРВАТОРІЯ ДАНИХ»): МАЛЮНКИ ГРАНЕЙ, ЖИВІ ГРАНІ, РЕЧІ НА СТОЛІ, ВМІСТ ЕКРАНА
 * ----------------------------------------------------------------------------
 * Розкладка частин — tools/wingbox/gen_room.py: analytics() (id an_*). Тут — як виглядають їхні грані (NX.arc.paint[id], пласкі
 * текстури: рушій кладе їх у перспективу) і що на них живе (NX.arc.LIVE[id]). Голо-екран, 3D-діаграма, голо-клавіатура, пара
 * над кавою — живий об'єкт objects/analytics.js (вміст екрана — NX.arc.anScreen нижче); крісло — objects/an_chair.js.
 * Крок 9 (власник: «вклади душу: більше графіки, унікальності, фішок; простір для ніг між тумбочками, унікальні краї; столи не
 * однакові; екрани — пласкі, зрідка глючать»). Характер зони: спокійна наукова обсерваторія — холодний блакитний і фіолет,
 * теплі латунні акценти (ручки шухляд, кава), скло й плавні форми.
 *   an_top     — скляна стільниця: кромка з блакитним неоном і живою стрічкою ПРОДАЖІ; зверху — темне скло з ледь видимою
 *                сіткою й «килимком» під проєктором; an_topR — заокруглений зовнішній кінець (циліндр, матеріал)
 *   an_pedL    — тумба з трьома шухлядами: латунні ручки, картки-мітки, замок; збоку (видно) — панель з неоновою смугою
 *   an_pedR    — серверна стійка: ґратка, чотири блоки з вогниками й лотками дисків, смуга навантаження (живі)
 *   an_knee    — у глибині простору для ніг: скляна «труба даних» на кріпленнях, кабелі (по трубі біжать імпульси — живі)
 *   an_mug, an_puck — верх чашки (кава з сердечком) і лінза проєктора (крок 11 — на правому краї стільниці)
 * Крок 10 — голо-кокпіт (три кіберпанк-панелі, гало-кільце, планка-емітер); крок 11 — купол обсерваторії з одним екраном.
 * Крок 12 (власник: «екран з аркою не подобається + багато пустого місця на ньому — перероби; додай робочих моментів на стіл»):
 *   вміст ВЕЛИКОГО екрана на стіні (NX.arc.anScreen): тонка темна рамка, шапка (назва, ● НАЖИВО, годинник, смужка прогресу,
 *   коли Nexi працює), чотири показники (ВИРУЧКА · ВІДВІДУВАЧІ · КОНВЕРСІЯ · ПРОДАЖІ), головний графік (у спокої — виручка; під
 *   задачу Nexi — продажі по днях, відвідувачі, прогноз), «пончик» мов, воронка конверсії, карта світу з пінгами; печатка
 *   «ЗВІТ ГОТОВИЙ ✓»; на рамці — два стікери. Пустого місця немає — екран і є фоном, що ховає цеглу.
 *   РЕЧІ НА СТОЛІ: an_pens — склянка з ручками (форма), an_keys — клавіатура (клавіші), an_tab — планшет на підставці (живий
 *   графік). Лампу на дузі, стос звітів і папки-реєстратори кроку 12 прибрано (власник: «дуже офісні»; є в коміті 7b98b9b).
 * Матеріали (NX.arc.kit.STY): chrome — хром (підставка для ніг), mug — світла кераміка. Написи — NX.t (4 мови).
 * ========================================================================== */
(() => {
  const A = NX.arc.kit, T = NX.arc.pt, PAINT = NX.arc.paint, LIVE = NX.arc.LIVE, hash = NX.art.hash, t_ = k => NX.t(k), K = NX.kit;
  const { icon, rr, inset, bolt, led, vent } = T;
  const AN = () => NX.objects.analytics || {};
  const CY = '#3be8ff', PK = '#ff4fd8', GR = '#3bff8a', GO = '#ffd27a', VI = '#9a8cff', BR = '#e0a650';
  const wave = (n, s = 0) => .5 + .22 * Math.sin(n * .55 + s) + .14 * Math.sin(n * 1.37 + 1 + s * 2) + .08 * (hash(n, 3 + s) - .5);
  // ---------- нові матеріали ----------
  const PL = A.PAL, X3 = NX.px3d;
  A.STY.chrome = A.STY.chrome || { pal: PL.CHROME, q: .55, bev: .4, ins: 0, metal: 1 };
  A.STY.mug = A.STY.mug || { pal: X3.pal(['#3a3456', '#5a5480', '#8a84b0', '#b8b2da', '#dcd8f2', '#f4f2ff', '#ffffff']), q: .62, bev: .3, ins: 0 };

  // ---------- СТІЛЬНИЦЯ ----------
  /** Кромка скляної стільниці: світла губа, тонкий блакитний неон унизу, «вікно» стрічки ПРОДАЖІ (вміст — живий). */
  PAINT.an_top = (c, fw, fh) => {
    const g = c.createLinearGradient(0, 0, 0, fh); g.addColorStop(0, 'rgba(210,240,255,.34)'); g.addColorStop(.18, 'rgba(60,90,170,.18)'); g.addColorStop(1, 'rgba(4,4,20,.55)');
    c.fillStyle = g; c.fillRect(0, 0, fw, fh); A.neon(c, 0, fh * .9, fw, fh * .9, CY, .9);
    inset(c, fw * .17, fh * .16, fw * .66, fh * .62, 'rgba(3,6,24,.85)', .6);                                      // вікно стрічки
    [[.06, .1], [.9, .94]].forEach(([a, b]) => { for (let k = 0; k < 4; k++) { c.fillStyle = k % 2 ? 'rgba(120,230,255,.5)' : 'rgba(255,255,255,.25)'; c.fillRect(fw * (a + k * .01), fh * .3, fw * .004, fh * .4); } });   // насічки
  };
  /** Стільниця зверху: темне скло (глянець — матеріал), ледь видима сітка, світний «килимок» під проєктором. */
  PAINT.an_top.sides = { top: (c, fw, fh) => {
    c.strokeStyle = 'rgba(90,200,255,.09)'; c.lineWidth = .3; for (let x = 6; x < fw; x += 7) { c.beginPath(); c.moveTo(x, 0); c.lineTo(x, fh); c.stroke(); } for (let y = 5; y < fh; y += 7) { c.beginPath(); c.moveTo(0, y); c.lineTo(fw, y); c.stroke(); }
    const cx = fw * .8, cy = fh * .59; [[26, .3], [21, .18]].forEach(([r, a]) => { c.strokeStyle = `rgba(59,232,255,${a})`; c.lineWidth = .7; c.beginPath(); c.ellipse(cx, cy, r, r * .72, 0, 0, 7); c.stroke(); });   // «килимок» під проєктором (an_puck — на правому краї)
    c.fillStyle = 'rgba(255,255,255,.1)'; c.fillRect(0, 0, fw, .6);
  } };
  /** Заокруглений зовнішній кінець стільниці (циліндр, пів-еліпс у плані): бік — та сама кромка, що й спереду (світла губа,
   *  темне скло, блакитний неон унизу), верх — сітка й відблиск. */
  PAINT.an_topR = () => {};
  PAINT.an_topR.sides = {
    side: (c, fw, fh) => { const g = c.createLinearGradient(0, 0, 0, fh); g.addColorStop(0, 'rgba(210,240,255,.34)'); g.addColorStop(.18, 'rgba(60,90,170,.18)'); g.addColorStop(1, 'rgba(4,4,20,.55)');
      c.fillStyle = g; c.fillRect(0, 0, fw, fh); A.neon(c, -.5, fh * .9, fw + .5, fh * .9, CY, .9); },
    top: (c, fw, fh) => { c.strokeStyle = 'rgba(90,200,255,.09)'; c.lineWidth = .3; for (let y = 5; y < fh; y += 7) { c.beginPath(); c.moveTo(0, y); c.lineTo(fw, y); c.stroke(); }
      c.fillStyle = 'rgba(255,255,255,.08)'; c.beginPath(); c.ellipse(fw * .35, fh * .35, fw * .18, fh * .1, -.5, 0, 7); c.fill(); },
  };
  /** Жива стрічка ПРОДАЖІ на кромці: напис, графік біжить ліворуч, крапка-«зараз», ▲ відсоток; швидше, коли Nexi працює. */
  LIVE.an_top = { every: 3, draw(c, fw, fh, t) {
    const x0 = fw * .17 + .6, x1 = fw * .83 - .6, w = x1 - x0, y = fh * .16 + .4, h = fh * .62 - .8, sp = AN().active ? 4 : 1.5;
    c.fillStyle = 'rgba(6,16,58,.96)'; c.fillRect(x0, y, w, h);
    A.txt(c, t_('scene.analytics.sales'), x0 + 1.2, y + h * .52, w * .22, h * .62, '#bff8ff', { align: 'left' });
    const gx0 = x0 + w * .25, gx1 = x0 + w * .74, step = 2.2, n0 = Math.floor(t * sp), f = t * sp - n0, pts = [];
    for (let k = 0; ; k++) { const x = gx1 - (k - f) * step; if (x < gx0 - step) break; pts.push([Math.max(gx0, Math.min(gx1, x)), y + h * (.88 - .72 * wave(n0 - k, 1))]); }
    c.save(); c.beginPath(); c.rect(gx0, y, gx1 - gx0, h); c.clip();
    c.beginPath(); c.moveTo(pts[0][0], y + h); pts.forEach(p => c.lineTo(p[0], p[1])); c.lineTo(pts[pts.length - 1][0], y + h); c.closePath(); c.fillStyle = 'rgba(59,232,255,.2)'; c.fill();
    c.strokeStyle = '#7af4ff'; c.lineWidth = .5; c.beginPath(); pts.forEach((p, i) => i ? c.lineTo(p[0], p[1]) : c.moveTo(p[0], p[1])); c.stroke(); c.restore();
    c.fillStyle = '#ffffff'; c.fillRect(pts[0][0] - .6, pts[0][1] - .6, 1.2, 1.2);
    const pct = 12 + 6 * wave(n0, 4); c.fillStyle = GR; c.beginPath(); c.moveTo(x0 + w * .77, y + h * .78); c.lineTo(x0 + w * .795, y + h * .22); c.lineTo(x0 + w * .82, y + h * .78); c.fill();
    A.txt(c, '+' + NX.num(pct, 1) + '%', x0 + w * .835, y + h * .52, w * .16, h * .6, '#b8ffd2', { align: 'left' });
  } };

  // ---------- ТУМБА З ШУХЛЯДАМИ ----------
  /** Шухляда: фаска, латунна ручка-«скоба» з бліком, картка-мітка (кольорова смужка й рядки), темний шов. */
  function drawer(c, x, y, w, h, o = {}) {
    const g = c.createLinearGradient(0, y, 0, y + h); g.addColorStop(0, '#2c2462'); g.addColorStop(1, '#171040'); c.fillStyle = g; rr(c, x, y, w, h, .9); c.fill();
    c.strokeStyle = 'rgba(170,150,255,.42)'; c.lineWidth = .4; rr(c, x + .3, y + .3, w - .6, h - .6, .8); c.stroke(); c.fillStyle = '#05030f'; c.fillRect(x + .4, y + h - .6, w - .8, .45);
    const hw = w * .36, hy = y + h * .58; c.fillStyle = '#5a3a14'; rr(c, x + w / 2 - hw / 2, hy, hw, h * .14, .5); c.fill();               // латунна ручка
    c.fillStyle = BR; rr(c, x + w / 2 - hw / 2 + .3, hy - .2, hw - .6, h * .1, .4); c.fill(); c.fillStyle = '#fff2c8'; c.fillRect(x + w / 2 - hw / 2 + .8, hy - .1, hw * .5, .35);
    c.fillStyle = 'rgba(230,240,255,.85)'; c.fillRect(x + w * .14, y + h * .2, w * .3, h * .24); c.fillStyle = o.tag || CY; c.fillRect(x + w * .14, y + h * .2, w * .06, h * .24);   // картка-мітка
    c.fillStyle = 'rgba(40,40,80,.6)'; c.fillRect(x + w * .22, y + h * .26, w * .18, .35); c.fillRect(x + w * .22, y + h * .34, w * .13, .35);
    if (o.lock) { c.fillStyle = '#0a0620'; c.beginPath(); c.arc(x + w * .82, y + h * .32, h * .07, 0, 7); c.fill(); c.fillStyle = BR; c.beginPath(); c.arc(x + w * .82, y + h * .32, h * .045, 0, 7); c.fill(); }
  }
  PAINT.an_pedL = (c, fw, fh) => {
    c.fillStyle = 'rgba(0,0,0,.35)'; c.fillRect(0, 0, fw, fh * .03);
    [[.05, CY, 1], [.355, VI, 0], [.66, PK, 0]].forEach(([y, tag, lock]) => drawer(c, fw * .07, fh * y, fw * .86, fh * .29, { tag, lock }));
    c.fillStyle = '#05030f'; c.fillRect(fw * .1, fh * .965, fw * .8, fh * .035);                                // цоколь
  };
  /** Бік тумби (зовнішній, його видно): панель зі швом, вертикальна блакитна неонова смуга, наліпка-емблема «графік». */
  PAINT.an_pedL.sides = { left: (c, fw, fh) => {
    c.fillStyle = 'rgba(8,4,26,.35)'; c.fillRect(0, 0, fw, fh); inset(c, fw * .12, fh * .08, fw * .76, fh * .84, 'rgba(10,6,34,.5)', .8);
    A.neon(c, fw * .5, fh * .12, fw * .5, fh * .88, CY, .9);
    const cx = fw * .5, cy = fh * .3; c.fillStyle = '#0a0620'; c.beginPath(); c.arc(cx, cy, fw * .2, 0, 7); c.fill(); c.strokeStyle = GO; c.lineWidth = .7; c.beginPath(); c.arc(cx, cy, fw * .2, 0, 7); c.stroke();
    icon(c, 'chart', cx, cy, fw * .22, GO);
  } };

  // ---------- СЕРВЕРНА СТІЙКА ----------
  /** Серверна стійка: ґратка вгорі, чотири блоки (вогники, лотки дисків, ручки), смуга навантаження внизу (живі — нижче). */
  const RACK = k => [.2 + k * .17, .14];                                                                              // блок k: y, висота (частки)
  PAINT.an_pedR = (c, fw, fh) => {
    vent(c, fw * .08, fh * .04, fw * .84, fh * .13, 4);
    for (let k = 0; k < 4; k++) { const [y, h] = RACK(k); inset(c, fw * .08, fh * y, fw * .84, fh * h, 'rgba(4,8,26,.9)', .5);
      for (let d = 0; d < 4; d++) { c.fillStyle = '#1a2a5a'; c.fillRect(fw * (.38 + d * .13), fh * (y + h * .3), fw * .1, fh * h * .4); c.fillStyle = 'rgba(160,200,255,.35)'; c.fillRect(fw * (.38 + d * .13), fh * (y + h * .3), fw * .1, .3); }   // лотки дисків
      c.fillStyle = '#8a93b8'; c.fillRect(fw * .1, fh * (y + h * .2), fw * .03, fh * h * .6); c.fillRect(fw * .87, fh * (y + h * .2), fw * .03, fh * h * .6); }  // ручки
    inset(c, fw * .08, fh * .9, fw * .84, fh * .06, 'rgba(3,6,20,.95)', .3);                                       // смуга навантаження
    bolt(c, fw * .05, fh * .02 + .8); bolt(c, fw * .95, fh * .02 + .8);
  };
  LIVE.an_pedR = { every: 3, draw(c, fw, fh, t) {
    const act = AN().active, sp = act ? 9 : 4;
    for (let k = 0; k < 4; k++) { const [y, h] = RACK(k);
      for (let l = 0; l < 3; l++) { const on = hash(Math.floor(t * sp) + l * 7, k * 11 + l) > (l === 0 ? .15 : .45), col = l === 0 ? GR : l === 1 ? CY : (hash(k, Math.floor(t)) > .8 ? '#ffb24a' : CY);
        if (on) led(c, fw * (.18 + l * .055), fh * (y + h * .5), col, .45); } }
    const v = .35 + .5 * (.5 + .5 * Math.sin(t * (act ? 2.4 : .9))) + .1 * hash(Math.floor(t * 4), 3);
    const g = c.createLinearGradient(fw * .09, 0, fw * .91, 0); g.addColorStop(0, '#3bff8a'); g.addColorStop(.6, '#3be8ff'); g.addColorStop(1, '#ff4fd8');
    c.fillStyle = g; c.fillRect(fw * .09, fh * .905, fw * .82 * v, fh * .05);
  } };

  // ---------- ПРОСТІР ДЛЯ НІГ: «труба даних» ----------
  /** Панель у глибині: темна, кабелі вниз до підлоги, скляна труба на кріпленнях (світиться; імпульси — живі). */
  PAINT.an_knee = (c, fw, fh) => {
    c.fillStyle = 'rgba(4,3,16,.6)'; c.fillRect(0, 0, fw, fh);
    for (let k = 0; k < 5; k++) { const x = fw * (.12 + k * .19); c.fillStyle = 'rgba(80,60,160,.35)'; c.fillRect(x, 0, .5, fh); }   // шви панелі
    [['#1a1a3a', .2], ['#2a1a4a', .34], ['#0e2a4a', .7]].forEach(([col, x]) => { c.strokeStyle = col; c.lineWidth = 1.6; c.beginPath(); c.moveTo(fw * x, fh * .5); c.bezierCurveTo(fw * x, fh * .8, fw * (x + .05), fh * .85, fw * (x + .06), fh); c.stroke(); });   // кабелі
    const y = fh * .42, h = fh * .14; c.fillStyle = 'rgba(10,40,90,.85)'; rr(c, fw * .02, y, fw * .96, h, h / 2); c.fill();             // труба
    const g = c.createLinearGradient(0, y, 0, y + h); g.addColorStop(0, 'rgba(200,250,255,.55)'); g.addColorStop(.35, 'rgba(59,232,255,.35)'); g.addColorStop(1, 'rgba(10,60,120,.4)'); c.fillStyle = g; rr(c, fw * .02, y, fw * .96, h, h / 2); c.fill();
    c.fillStyle = 'rgba(255,255,255,.45)'; c.fillRect(fw * .04, y + h * .18, fw * .92, .4);
    for (let k = 0; k < 4; k++) { const x = fw * (.16 + k * .23); c.fillStyle = '#8a93b8'; c.fillRect(x - .9, y - 1.2, 1.8, h + 2.4); c.fillStyle = '#d8dcf0'; c.fillRect(x - .9, y - 1.2, .5, h + 2.4); }   // кріплення
  };
  LIVE.an_knee = { every: 3, draw(c, fw, fh, t) {
    const y = fh * .42, h = fh * .14, sp = AN().active ? .9 : .32;
    c.save(); c.globalCompositeOperation = 'lighter'; c.beginPath(); rr(c, fw * .02, y, fw * .96, h, h / 2); c.clip();
    for (let k = 0; k < 4; k++) { const ph = (t * sp + k / 4) % 1, x = fw * (.02 + .96 * ph), g = c.createRadialGradient(x, y + h / 2, 0, x, y + h / 2, h * 1.6);
      g.addColorStop(0, 'rgba(230,255,255,.95)'); g.addColorStop(.4, 'rgba(59,232,255,.6)'); g.addColorStop(1, 'rgba(59,232,255,0)'); c.fillStyle = g; c.fillRect(x - h * 1.6, y, h * 3.2, h); }
    c.restore();
  } };

  // ---------- ЧАШКА Й ПРОЄКТОР (верх циліндрів) ----------
  PAINT.an_mug = (c, fw, fh) => {};
  PAINT.an_mug.sides = { side: (c, fw, fh) => { c.fillStyle = 'rgba(59,232,255,.85)'; c.fillRect(0, fh * .3, fw, fh * .14); c.fillStyle = 'rgba(255,79,216,.8)'; c.fillRect(0, fh * .5, fw, fh * .06); },   // фірмові смужки
    top: (c, fw, fh) => {                                                                                              // кава з латте-сердечком
    const cx = fw / 2, cy = fh / 2; c.fillStyle = '#3a1c0c'; c.beginPath(); c.ellipse(cx, cy, fw * .4, fh * .4, 0, 0, 7); c.fill();
    c.fillStyle = '#7a4a26'; c.beginPath(); c.ellipse(cx, cy, fw * .32, fh * .32, 0, 0, 7); c.fill();
    c.fillStyle = '#f2dcc0'; const s = fw * .14; c.beginPath(); c.moveTo(cx, cy + s * .9); c.bezierCurveTo(cx - s * 1.6, cy - s * .2, cx - s * .5, cy - s * 1.3, cx, cy - s * .35); c.bezierCurveTo(cx + s * .5, cy - s * 1.3, cx + s * 1.6, cy - s * .2, cx, cy + s * .9); c.fill();
  } };
  PAINT.an_puck = (c, fw, fh) => {};
  PAINT.an_puck.sides = { top: (c, fw, fh) => {                                                                       // лінза проєктора
    const cx = fw / 2, cy = fh / 2, g = c.createRadialGradient(cx, cy, 0, cx, cy, fw * .42); g.addColorStop(0, '#ffffff'); g.addColorStop(.2, '#9af6ff'); g.addColorStop(.55, '#1a8ab0'); g.addColorStop(1, '#0a1030');
    c.fillStyle = g; c.beginPath(); c.ellipse(cx, cy, fw * .42, fh * .42, 0, 0, 7); c.fill();
    c.strokeStyle = 'rgba(150,240,255,.8)'; c.lineWidth = .5; [.3, .38].forEach(k => { c.beginPath(); c.ellipse(cx, cy, fw * k, fh * k, 0, 0, 7); c.stroke(); });
  } };

  LIVE.an_sign = NX.arc.glint(7.4, 2.1);

  // ---------- РЕЧІ НА СТОЛІ (крок 12, власник: «додай якихось робочих моментів на стіл») ----------
  const SHP = NX.arc.shape = NX.arc.shape || {};
  /** СКЛЯНКА З РУЧКАМИ (an_pens): скляна склянка й чотири ручки віялом (рожева, блакитна, золота, біла). Габарит предмета:
   *  u — уздовж стола, v — углиб (G.sub: v — середина по глибині), y — висота. */
  SHP.an_pens = (G, B) => {
    const P = G.P, vm = B.dep / 2;
    G.part(G.sub(0, vm, B.w, B.dep, B.yt, B.yb, { cyl: 14 }), 'glass');
    [[-1.6, -2.4, '#ff4fd8'], [-.4, 2.2, '#3be8ff'], [.9, -1.2, '#ffd27a'], [1.9, 1.6, '#e8e8ff']].forEach(([du, dv, colr], k) => {
      const c0 = X3.col(colr), sh = (u, v, i, j) => v < .14 ? A.C.out : (u > .35 && u < .6 ? X3.add(c0, X3.col('#303030')) : c0);
      G.tube(P(du * .5, vm + dv * .4, B.yt + 2), P(du * 1.6, vm + dv, B.yt - 6.5 - (k % 2) * 1.6), .9, sh); });
  };
  /** Клавіатура: темний корпус, світлий кант, ряди клавіш зверху (підсвічування, коли Nexi друкує, — живе). */
  PAINT.an_keys = (c, fw, fh) => { c.fillStyle = '#0a0a24'; c.fillRect(0, 0, fw, fh); c.fillStyle = 'rgba(59,232,255,.7)'; c.fillRect(0, fh * .7, fw, fh * .2); };
  PAINT.an_keys.sides = { top: (c, fw, fh) => {
    c.fillStyle = '#14143a'; c.fillRect(0, 0, fw, fh);
    for (let r = 0; r < 4; r++) for (let k = 0; k < 14; k++) { const x = fw * (.03 + k * .068), y = fh * (.08 + r * .22); c.fillStyle = r === 3 && k > 3 && k < 10 ? '#2a2a5a' : '#262650'; if (r === 3 && (k <= 3 || k >= 10 || k === 4)) c.fillRect(x, y, fw * .058, fh * .18); else if (r < 3) c.fillRect(x, y, fw * .058, fh * .18); }
    c.fillStyle = '#262650'; c.fillRect(fw * .3, fh * .74, fw * .4, fh * .18);                                      // пробіл
    c.fillStyle = 'rgba(59,232,255,.35)'; c.fillRect(0, fh * .96, fw, fh * .04);
  } };
  /** Планшет на підставці: темна рамка, скло екрана (вміст — живий: стовпчики й «пончик»), камера; підставка — тінь знизу. */
  PAINT.an_tab = (c, fw, fh) => {
    c.fillStyle = '#05041a'; rr(c, 0, 0, fw, fh * .86, 1.6); c.fill(); c.strokeStyle = 'rgba(200,210,255,.55)'; c.lineWidth = .5; rr(c, .3, .3, fw - .6, fh * .86 - .6, 1.4); c.stroke();
    c.fillStyle = '#0a1a50'; c.fillRect(fw * .07, fh * .08, fw * .86, fh * .7); c.fillStyle = '#4a4a7a'; c.beginPath(); c.arc(fw * .5, fh * .04, .5, 0, 7); c.fill();
    c.fillStyle = '#1a1a3a'; c.fillRect(fw * .38, fh * .86, fw * .24, fh * .14); c.fillStyle = '#8a8ab8'; c.fillRect(fw * .38, fh * .86, fw * .24, .4);   // підставка
  };
  LIVE.an_tab = { every: 4, draw(c, fw, fh, t) {
    const x0 = fw * .07 + .3, y0 = fh * .08 + .3, w = fw * .86 - .6, h = fh * .7 - .6, act = AN().active;
    c.fillStyle = '#0a1a50'; c.fillRect(x0, y0, w, h);
    for (let k = 0; k < 6; k++) { const v = .3 + .6 * wave(Math.floor(t * (act ? 1.5 : .5)) + k, 4), bh = h * .55 * v; c.fillStyle = k === 5 ? '#ff7ad0' : '#5ae8ff'; c.fillRect(x0 + w * (.06 + k * .09), y0 + h * .9 - bh, w * .06, bh); }
    const cx = x0 + w * .78, cy = y0 + h * .48, r = Math.min(w, h) * .2; let a = -Math.PI / 2 + t * .3;
    [[.5, CY], [.3, PK], [.2, GO]].forEach(([f, colr]) => { c.strokeStyle = colr; c.lineWidth = r * .55; c.beginPath(); c.arc(cx, cy, r, a, a + f * Math.PI * 2 - .1); c.stroke(); a += f * Math.PI * 2; });
    c.fillStyle = 'rgba(255,255,255,.12)'; c.fillRect(x0, y0, w, h * .12);
  } };
  // ---------- ВЕЛИКИЙ ЕКРАН (крок 12; objects/analytics.js -> NX.arc.holo.pane, crisp) ----------
  // Власник: «екран з аркою не подобається + багато пустого місця на ньому — перероби». Один великий екран на всю ширину стола
  // (він і фон за столом), вміст — щільна панель показників без пустот: шапка, чотири показники, головний графік, «пончик» мов,
  // воронка конверсії, карта світу. S.view — що показує головний графік (задача Nexi): overview / sales / traffic / forecast;
  // S.prog — поступ задачі; S.done — печатка «ЗВІТ ГОТОВИЙ ✓» (0..1).
  const VIEW = { overview: ['scene.analytics.revenue', 'chart'], sales: ['scene.analytics.sales', 'chart'], traffic: ['scene.analytics.visitors', 'user'], forecast: ['scene.analytics.forecast', 'target'] };
  const DAYV = [.52, .64, .58, .74, .92, .46, .38], BEST = 4;                                                       // продажі по днях: п'ятниця — найкраща
  const LANG = [['UA', .38, CY], ['PL', .27, PK], ['NL', .2, VI], ['EN', .15, GO]];
  const IC7 = { cart: ['X......', 'XXXXXXX', '.X....X', '.X...X.', '.XXXXX.', '.......', '..X.X..'], ok: ['......X', '.....XX', '....XX.', 'X..XX..', 'XXXX...', '.XX....', '.......'] };
  /** Віджет: темна плитка з тонким кантом і заголовком (іконка + напис); повертає висоту заголовка. */
  function widget(c, x, y, w, h, title, ic, col = CY, hot = false) {
    c.fillStyle = hot ? 'rgba(14,40,104,.96)' : 'rgba(9,24,72,.94)'; rr(c, x, y, w, h, 1.6); c.fill();
    c.strokeStyle = hot ? 'rgba(255,210,122,.75)' : 'rgba(110,210,255,.3)'; c.lineWidth = hot ? .55 : .35; rr(c, x, y, w, h, 1.6); c.stroke();
    const th = 6.2; if (ic) icon(c, ic, x + 3.4, y + th * .55, 3.2, col);
    A.txt(c, title, x + (ic ? 6.2 : 2.6), y + th * .55, w - 9, 3, 'rgba(205,235,255,.9)', { align: 'left' });
    return th;
  }
  /** Показник угорі: підпис, велике число, стрілка й зміна, міні-графік. */
  function kpi(c, x, y, w, h, label, value, delta, col, t, seed) {
    c.fillStyle = 'rgba(9,24,72,.94)'; rr(c, x, y, w, h, 1.6); c.fill(); c.fillStyle = col; c.fillRect(x + .6, y + 2, .7, h - 4);
    c.strokeStyle = 'rgba(110,210,255,.3)'; c.lineWidth = .35; rr(c, x, y, w, h, 1.6); c.stroke();
    A.txt(c, label, x + 3, y + h * .24, w - 5, 2.9, 'rgba(190,225,255,.85)', { align: 'left' });
    A.txt(c, value, x + 3, y + h * .55, w * .62, 6.2, '#ffffff', { align: 'left', glow: col });
    c.fillStyle = GR; c.beginPath(); c.moveTo(x + 3, y + h * .87); c.lineTo(x + 4.6, y + h * .74); c.lineTo(x + 6.2, y + h * .87); c.fill();
    A.txt(c, delta, x + 7.2, y + h * .81, w * .4, 2.8, '#b8ffd2', { align: 'left' });
    c.strokeStyle = col; c.lineWidth = .45; c.beginPath();
    for (let i = 0; i <= 8; i++) { const xx = x + w * (.6 + .36 * i / 8), yy = y + h * (.86 - .3 * wave(Math.floor(t * .8) + i, seed)); i ? c.lineTo(xx, yy) : c.moveTo(xx, yy); } c.stroke();
  }
  /** Стікер на рамці: кольоровий папірець під кутом з «каракулями» (робочий момент). */
  function sticky(c, x, y, s, a, colr) {
    c.save(); c.translate(x, y); c.rotate(a); c.fillStyle = 'rgba(0,0,0,.35)'; c.fillRect(-s / 2 + .5, -s / 2 + .6, s, s); c.fillStyle = colr; c.fillRect(-s / 2, -s / 2, s, s);
    c.fillStyle = 'rgba(255,255,255,.35)'; c.fillRect(-s / 2, -s / 2, s, s * .18); c.strokeStyle = 'rgba(30,20,60,.6)'; c.lineWidth = .3;
    for (let k = 0; k < 3; k++) { c.beginPath(); c.moveTo(-s * .36, -s * .1 + k * s * .2); for (let q = 1; q <= 6; q++) c.lineTo(-s * .36 + q * s * .12 * (k === 2 ? .7 : 1), -s * .1 + k * s * .2 + (q % 2 ? -.4 : .4)); c.stroke(); }
    c.restore();
  }
  function anScreen(c, fw, fh, t, S = {}) {
    const view = VIEW[S.view] ? S.view : 'overview', act = !!S.act, prog = S.prog || 0, grow = act ? prog : 1, bz = 1.8, r = 3.2;
    // рамка й скло
    rr(c, 0, 0, fw, fh, r + 1); c.fillStyle = '#05040f'; c.fill();
    let g = c.createLinearGradient(0, 0, 0, fh); g.addColorStop(0, 'rgba(10,26,74,1)'); g.addColorStop(.5, 'rgba(6,15,50,1)'); g.addColorStop(1, 'rgba(8,12,44,1)');
    rr(c, bz, bz, fw - 2 * bz, fh - 2 * bz, r); c.fillStyle = g; c.fill();
    c.save(); rr(c, bz, bz, fw - 2 * bz, fh - 2 * bz, r); c.clip();
    c.strokeStyle = 'rgba(90,200,255,.045)'; c.lineWidth = .25; c.beginPath(); for (let x = 6; x < fw; x += 6) { c.moveTo(x, 0); c.lineTo(x, fh); } for (let y = 6; y < fh; y += 6) { c.moveTo(0, y); c.lineTo(fw, y); } c.stroke();
    c.restore();
    c.strokeStyle = 'rgba(150,220,255,.5)'; c.lineWidth = .45; rr(c, .3, .3, fw - .6, fh - .6, r + .8); c.stroke();               // край рамки
    c.strokeStyle = '#3be8ff'; c.lineWidth = .35; rr(c, bz, bz, fw - 2 * bz, fh - 2 * bz, r); c.stroke();
    c.fillStyle = 'rgba(210,245,255,.16)'; c.fillRect(r + 2, bz + .4, fw - 2 * r - 4, .3);
    // шапка: назва вигляду, ● НАЖИВО, годинник; смужка прогресу задачі
    const m = 4.2, gp = 2.6, hh = 11, [key, ic] = VIEW[view];
    icon(c, ic, m + 2.6, bz + hh * .52, 3.6, CY); A.txt(c, t_(key), m + 6.2, bz + hh * .52, fw * .5, 4.4, '#e8feff', { align: 'left', glow: CY });
    const d = new Date(), clk = String(d.getHours()).padStart(2, '0') + (Math.floor(t * 2) % 2 ? ':' : ' ') + String(d.getMinutes()).padStart(2, '0');
    A.txt(c, clk, fw - m - 1, bz + hh * .52, 14, 3.6, 'rgba(220,240,255,.9)', { align: 'right' });
    const on = Math.sin(t * 4) > -.4; c.fillStyle = on ? '#ff4f6a' : '#6a1a2a'; c.beginPath(); c.arc(fw * .66, bz + hh * .52, 1, 0, 7); c.fill();
    A.txt(c, t_('scene.marketing.live'), fw * .675, bz + hh * .52, fw * .16, 2.9, 'rgba(255,205,215,.92)', { align: 'left' });
    c.fillStyle = 'rgba(120,230,255,.28)'; c.fillRect(m, bz + hh, fw - 2 * m, .3);
    if (act) { c.fillStyle = 'rgba(255,201,77,.22)'; c.fillRect(m, bz + hh - .3, fw - 2 * m, .9); c.fillStyle = GO; c.fillRect(m, bz + hh - .3, (fw - 2 * m) * prog, .9); }
    // ряд показників
    const y1 = bz + hh + gp, kh = 21, kw = (fw - 2 * m - 3 * gp) / 4, sum = 48 + 9 * (.5 + .5 * Math.sin(t * .2)), pct = 18 + 4 * Math.sin(t * .4);
    kpi(c, m, y1, kw, kh, t_('scene.analytics.revenue'), NX.num(sum, 1) + ' ' + t_('scene.unit.k'), '+' + NX.num(pct, 1) + '%', CY, t, 1);
    kpi(c, m + (kw + gp), y1, kw, kh, t_('scene.analytics.visitors'), NX.num((12400 + t * (act ? 9 : 3)) / 1000, 1) + ' ' + t_('scene.unit.k'), '+' + NX.num(8 + Math.sin(t * .3), 1) + '%', VI, t, 2);
    kpi(c, m + (kw + gp) * 2, y1, kw, kh, t_('scene.analytics.conv'), NX.num(3.4 + .4 * Math.sin(t * .5), 1) + '%', '+0,4', PK, t, 3);
    kpi(c, m + (kw + gp) * 3, y1, kw, kh, t_('scene.analytics.sales'), NX.num(380 + Math.floor(t * (act ? 1.2 : .2)) % 60, 0), '+' + NX.num(pct * .8, 1) + '%', GO, t, 4);
    // головний графік (ліворуч) і «пончик» мов (праворуч)
    const y2 = y1 + kh + gp, h2 = (fh - bz - m - y2 - gp) * .56, gx = m, gw = (fw - 2 * m - gp) * .63, dx = gx + gw + gp, dw = fw - m - dx;
    const th = widget(c, gx, y2, gw, h2, t_(key) + (view === 'overview' ? ' · ' + t_('scene.analytics.trend') : ''), ic, CY, act);
    const px = gx + 2.4, py = y2 + th + 1, pw = gw - 4.8, ph = h2 - th - 2.6;
    for (let k = 1; k < 4; k++) { c.fillStyle = 'rgba(150,220,255,.09)'; c.fillRect(px, py + ph * k / 4, pw, .3); }
    c.save(); c.beginPath(); c.rect(px, py, pw, ph); c.clip();
    if (view === 'sales') {                                                                                       // продажі по днях: стовпчики з'являються по черзі
      const days = NX.t('scene.analytics.days'), n = 7, bw = pw / n;
      DAYV.forEach((v, k) => { const f = Math.max(0, Math.min(1, grow * n - k)), h = (ph - 6) * v * (1 - Math.pow(1 - f, 2)), x = px + bw * (k + .2), w = bw * .6, y = py + ph - 4 - h, best = k === BEST && f > .9;
        if (h > .3) { const gg = c.createLinearGradient(0, y, 0, py + ph - 4); gg.addColorStop(0, best ? '#ffe4fa' : '#e8feff'); gg.addColorStop(.25, best ? '#ff7ad0' : '#5ae8ff'); gg.addColorStop(1, best ? '#7a1a8a' : '#1a5ad0'); c.fillStyle = gg; c.fillRect(x, y, w, h); }
        if (best) { c.fillStyle = GO; star(c, x + w / 2, y - 2.2, 1.6); }
        if (Array.isArray(days)) A.txt(c, days[k], x + w / 2, py + ph - 1.6, bw * .9, 2.4, k === BEST ? '#ffe4fa' : 'rgba(170,220,255,.75)'); });
    } else {                                                                                                     // лінія: виручка / відвідувачі (живі точки) / прогноз (пунктир у майбутнє)
      const fc = view === 'forecast', tr = view === 'traffic', cut = fc ? .62 : 1, step = pw / 18, sp = act ? 1.6 : .7, n0 = Math.floor(t * sp), f0 = fc ? 0 : t * sp - n0, Pn = [];
      for (let k = -1; k <= 19; k++) { const nn = (fc ? 0 : n0) + k, x = px + (k - f0) * step, v = Math.max(.12, Math.min(.92, .42 + .2 * Math.sin(nn * (tr ? .5 : .23)) + .3 * (wave(nn, tr ? 9 : 5) - .5) + (fc ? k * .012 : 0))); Pn.push([x, py + ph * (.92 - .78 * v)]); }
      const hist = Pn.filter(p => p[0] <= px + pw * cut + step), lc = tr ? VI : CY, lrgb = tr ? '154,140,255' : '59,232,255';
      c.beginPath(); c.moveTo(hist[0][0], py + ph); hist.forEach(p => c.lineTo(p[0], p[1])); c.lineTo(hist[hist.length - 1][0], py + ph); c.closePath();
      g = c.createLinearGradient(0, py, 0, py + ph); g.addColorStop(0, `rgba(${lrgb},.4)`); g.addColorStop(1, `rgba(${lrgb},0)`); c.fillStyle = g; c.fill();
      c.strokeStyle = tr ? '#c8bcff' : '#9af6ff'; c.lineWidth = .7; c.beginPath(); hist.forEach((p, i) => i ? c.lineTo(p[0], p[1]) : c.moveTo(p[0], p[1])); c.stroke();
      if (tr) hist.forEach((p, i) => { if ((i + n0) % 3) return; c.fillStyle = '#ffffff'; c.fillRect(p[0] - .6, p[1] - .6, 1.2, 1.2); });
      if (fc) {
        const p0 = hist[hist.length - 1], xe = p0[0] + (px + pw - 3 - p0[0]) * grow, ye = p0[1] - (ph * .34) * grow, spr = ph * .2 * grow;
        c.fillStyle = 'rgba(255,201,77,.14)'; c.beginPath(); c.moveTo(p0[0], p0[1]); c.lineTo(xe, ye - spr); c.lineTo(xe, ye + spr); c.closePath(); c.fill();
        c.strokeStyle = GO; c.lineWidth = .7; c.setLineDash([1.6, 1.2]); c.beginPath(); c.moveTo(p0[0], p0[1]); c.lineTo(xe, ye); c.stroke(); c.setLineDash([]);
        c.fillStyle = '#ffffff'; c.beginPath(); c.arc(xe, ye, 1, 0, 7); c.fill(); c.strokeStyle = GO; c.lineWidth = .4; c.beginPath(); c.arc(xe, ye, 1.9, 0, 7); c.stroke();
        A.txt(c, '+' + NX.num(5 + 17 * grow, 1) + '%', Math.min(xe, px + pw - 8), Math.max(py + 3, ye - 4), 14, 3, '#ffe2a0');
      } else {
        const cu = .35 + .4 * (.5 + .5 * Math.sin(t * .6)), cxp = px + pw * cu, ki = Math.max(0, Math.min(Pn.length - 2, Math.floor((cxp - Pn[0][0]) / step))), q = (cxp - Pn[ki][0]) / step, cyp = Pn[ki][1] + (Pn[ki + 1][1] - Pn[ki][1]) * q;
        c.fillStyle = 'rgba(220,250,255,.35)'; for (let y = py + 2; y < py + ph - 1; y += 2) c.fillRect(cxp - .15, y, .3, 1);
        c.fillStyle = '#ffffff'; c.beginPath(); c.arc(cxp, cyp, 1, 0, 7); c.fill(); c.strokeStyle = lc; c.lineWidth = .4; c.beginPath(); c.arc(cxp, cyp, 1.8, 0, 7); c.stroke();
        const tw = pw * .2, tH = ph * .18, tx2 = Math.min(px + pw - tw - 1, cxp + 2.2), ty = Math.max(py + 1, cyp - tH - 2.2);
        c.fillStyle = 'rgba(16,48,140,.95)'; rr(c, tx2, ty, tw, tH, .8); c.fill(); c.strokeStyle = 'rgba(160,240,255,.7)'; c.lineWidth = .3; rr(c, tx2, ty, tw, tH, .8); c.stroke();
        A.txt(c, NX.num((tr ? 0.6 : 28) + (tr ? 1.4 : 44) * (1 - (cyp - py) / ph), 1) + ' ' + t_('scene.unit.k'), tx2 + tw / 2, ty + tH * .55, tw * .86, tH * .56, '#e8feff');
      }
    }
    c.restore();
    // «пончик» мов
    const dth = widget(c, dx, y2, dw, h2, t_('scene.analytics.users'), 'user', VI), dcx = dx + dw * .3, dcy = y2 + dth + (h2 - dth) / 2, dr = Math.min(dw * .22, (h2 - dth) * .36);
    let a0 = -Math.PI / 2 + t * .25; LANG.forEach(([code, v, colr], k) => { const b = a0 + v * Math.PI * 2 * (.97 + .03 * Math.sin(t * 2 + k)); c.strokeStyle = colr; c.lineWidth = dr * .42; c.beginPath(); c.arc(dcx, dcy, dr, a0 + .05, b - .05); c.stroke(); a0 = b; });
    A.txt(c, Math.round(LANG[0][1] * 100) + '%', dcx, dcy - dr * .12, dr * 1.1, dr * .42, '#e8feff'); A.txt(c, LANG[0][0], dcx, dcy + dr * .32, dr, dr * .3, CY);   // найбільша частка — UA
    LANG.forEach(([code, v, colr], k) => { const ly = y2 + dth + 2.6 + k * ((h2 - dth - 3) / 4); c.fillStyle = colr; c.fillRect(dx + dw * .6, ly - .7, 1.4, 1.4);
      A.txt(c, code, dx + dw * .6 + 2.4, ly, dw * .14, 2.6, 'rgba(215,240,255,.9)', { align: 'left' }); A.txt(c, Math.round(v * 100) + '%', dx + dw - 2.4, ly, dw * .2, 2.6, '#e8feff', { align: 'right' }); });
    // воронка конверсії (ліворуч) і карта світу (праворуч)
    const y3 = y2 + h2 + gp, h3 = fh - bz - m + 1.4 - y3, fw2 = (fw - 2 * m - gp) * .36, mx = m + fw2 + gp, mw = fw - m - mx;
    const fth = widget(c, m, y3, fw2, h3, t_('scene.analytics.conv'), 'target', PK), base = 1240 + Math.floor(t * (act ? 3 : .7)), rows = [['user', base, CY, 1], ['cart', Math.round(base * .31), PK, .74], ['ok', Math.round(base * .034), GR, .5]];
    const rh = (h3 - fth - 3) / 3;
    rows.forEach(([ic2, n, colr, w], k) => { const y = y3 + fth + 1 + k * rh, x0 = m + 2 + (fw2 - 4) * (1 - w) / 2, x1 = m + 2 + (fw2 - 4) * (1 + w) / 2, xn = m + 2 + (fw2 - 4) * (1 - (k < 2 ? w * .8 : w)) / 2, xm = m + fw2 - 2 - (xn - m - 2);
      c.beginPath(); c.moveTo(x0, y); c.lineTo(x1, y); c.lineTo(xm, y + rh - .8); c.lineTo(xn, y + rh - .8); c.closePath(); c.fillStyle = 'rgba(8,24,80,.9)'; c.fill(); c.strokeStyle = colr; c.lineWidth = .35; c.stroke();
      const ph2 = (t * (act ? 1.2 : .5) + k * .3) % 1; c.fillStyle = colr; c.globalAlpha = .22; c.fillRect(x0 + (x1 - x0) * ph2 - 1, y + .4, 2, rh - 1.6); c.globalAlpha = 1;
      if (IC7[ic2]) A.icon7(c, IC7[ic2], x0 + rh * .5 + .8, y + rh * .45, rh * .5, colr); else icon(c, ic2, x0 + rh * .5 + .8, y + rh * .45, rh * .5, colr);
      A.txt(c, NX.num(n, 0), (x0 + x1) / 2 + rh * .3, y + rh * .45, (x1 - x0) * .55, rh * .42, '#e8feff'); });
    const mth = widget(c, mx, y3, mw, h3, t_('scene.analytics.map'), 'target', CY, act && view === 'traffic');
    K.scrMap(c, mx + 1.4, y3 + mth + .6, mw - 2.8, h3 - mth - 2, t, { act: act ? 1 : 0, hot: ['kyiv', 'warsaw', 'amsterdam'] });
    // стікери на рамці (робочі моменти)
    sticky(c, fw - 6.4, fh - 7.2, 7.4, .14, '#ffd27a'); sticky(c, 4.6, y3 - 1.2, 6.4, -.12, '#ff9ad8');   // правий нижній кут і лівий край — там їх не закриває лампа
    // печатка «ЗВІТ ГОТОВИЙ ✓» над головним графіком
    const dn = S.done || 0; if (dn > 0) {
      const w = gw * .66, h = Math.min(ph * .5, 13), x = gx + (gw - w) / 2, y = py + (ph - h) / 2, sc = .85 + .15 * Math.min(1, dn * 4);
      c.save(); c.globalAlpha = Math.min(1, dn * 3); c.translate(x + w / 2, y + h / 2); c.scale(sc, sc); c.translate(-(x + w / 2), -(y + h / 2));
      c.fillStyle = 'rgba(6,40,30,.95)'; rr(c, x, y, w, h, 2); c.fill(); c.strokeStyle = GR; c.lineWidth = .8; rr(c, x, y, w, h, 2); c.stroke();
      c.strokeStyle = GR; c.lineWidth = 1.2; c.lineCap = 'round'; c.beginPath(); c.moveTo(x + h * .35, y + h * .52); c.lineTo(x + h * .55, y + h * .72); c.lineTo(x + h * .9, y + h * .3); c.stroke();
      A.txt(c, t_('scene.analytics.ready'), x + h * 1.1 + (w - h * 1.2) / 2, y + h / 2, w - h * 1.25, h * .34, '#d0ffe4', { glow: GR });
      c.restore(); }
  }
  function star(c, x, y, r) { c.beginPath(); for (let k = 0; k < 10; k++) { const a = -Math.PI / 2 + k * Math.PI / 5, rr2 = k % 2 ? r * .45 : r; c.lineTo(x + Math.cos(a) * rr2, y + Math.sin(a) * rr2); } c.closePath(); c.fill(); }
  NX.arc.anScreen = anScreen;
  NX.arc.anWave = wave;
})();

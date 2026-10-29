/* ============================================================================
 * objects/an_paint.js — АНАЛІТИКА («ОБСЕРВАТОРІЯ ДАНИХ»): МАЛЮНКИ ГРАНЕЙ, ЖИВІ ГРАНІ, ВМІСТ ГОЛО-ПАНЕЛЕЙ
 * ----------------------------------------------------------------------------
 * Розкладка частин — tools/wingbox/gen_room.py: analytics() (id an_*). Тут — як виглядають їхні грані (NX.arc.paint[id], пласкі
 * текстури: рушій кладе їх у перспективу) і що на них живе (NX.arc.LIVE[id]). Голо-панелі, 3D-діаграма, радар, пара над
 * кавою — живий об'єкт objects/analytics.js (вміст панелей — NX.arc.anPane нижче).
 * Крок 9 (власник: «вклади душу: більше графіки, унікальності, фішок; простір для ніг між тумбочками, унікальні краї; столи не
 * однакові; екрани — пласкі, зрідка глючать»). Характер зони: спокійна наукова обсерваторія — холодний блакитний і фіолет,
 * теплі латунні акценти (ручки шухляд, кава), скло й плавні форми.
 *   an_top     — скляна стільниця: кромка з блакитним неоном і живою стрічкою ПРОДАЖІ; зверху — темне скло з ледь видимою
 *                сіткою й «килимком» під проєктором; an_topR — заокруглений зовнішній кінець (циліндр, матеріал)
 *   an_pedL    — тумба з трьома шухлядами: латунні ручки, картки-мітки, замок; збоку (видно) — панель з неоновою смугою
 *   an_pedR    — серверна стійка: ґратка, чотири блоки з вогниками й лотками дисків, смуга навантаження (живі)
 *   an_knee    — у глибині простору для ніг: скляна «труба даних» на кріпленнях, кабелі (по трубі біжать імпульси — живі)
 *   an_mug, an_puck — верх чашки (кава з сердечком) і лінза проєктора
 * Крок 10 (власник: «екрани громосткі в профіль; треба інноваційні, футуристичні, типу кіберпанк»): шафу-рамку (шапка,
 * стовпи, «стіна даних») прибрано — ГОЛО-КОКПІТ:
 *   an_emit    — тонка планка-емітер на задньому краї стільниці (три лінзи під панелями; промені — живі)
 *   an_halo    — тонке неонове гало-кільце за панелями (форма NX.arc.shape['st:halo']: блакитна й рожева трубки, шкала, вузли)
 *   вміст трьох панелей кокпіту (NX.arc.anPane: visitors / revenue / conv) — кіберпанк-обрис зі зрізаними кутами, розщеплення
 *   кольорів на канті, шапка-вкладка, «дощ даних», шкала, штрих-код.
 * Нові матеріали (NX.arc.kit.STY): chrome — хром (підставка для ніг), mug — світла кераміка.
 * Коли Nexi працює в зоні (NX.objects.analytics.active — наступний крок), дані біжать швидше. Написи — NX.t (4 мови).
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
    const cx = fw * .49, cy = fh * .59; [[30, .3], [25, .18]].forEach(([r, a]) => { c.strokeStyle = `rgba(59,232,255,${a})`; c.lineWidth = .7; c.beginPath(); c.ellipse(cx, cy, r, r * .72, 0, 0, 7); c.stroke(); });   // «килимок» під проєктором (an_puck)
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

  // ---------- ГОЛО-КОКПІТ (крок 10): тонкі емітер і гало-кільце замість шафи-рамки ----------
  // Власник: «екрани громосткі в профіль; треба інноваційні, футуристичні, типу кіберпанк». Шапки, стовпів і «стіни даних»
  // більше немає: над столом висять три пласкі голо-панелі дугою (objects/analytics.js), їх «проєктує» тонка планка-емітер
  // на задньому краї стільниці, за ними — тонке неонове гало-кільце, на ньому вивіска й радар.
  const SHP = NX.arc.shape = NX.arc.shape || {}, NE = A.NEON;
  /** ГАЛО-КІЛЬЦЕ (форма st:halo): еліпс у площині предмета — товста блакитна неонова трубка, ближче — тонка рожева, риски-
   *  шкала назовні (як лімб телескопа), хромовані вузли з блакитним «оком»; низ ховається за столом (z-буфер). */
  SHP['st:halo'] = (G, B) => {
    const P = G.P, rx = B.w / 2, ry = (B.yb - B.yt) / 2, yc = (B.yt + B.yb) / 2, v = B.dep / 2, n = 96, TAU = Math.PI * 2;
    const at = (a, k = 1, dv = 0) => P(Math.cos(a) * rx * k, v + dv, yc - Math.sin(a) * ry * k);
    const tube = pal => (u, vv, i, j) => { X3.SH.fl |= X3.F_EMIT; return Math.abs(u - .5) < .22 ? pal[2] : pal[1]; };
    const cyan = tube(NE.cyan), pink = tube(NE.pink);
    for (let i = 0; i < n; i++) G.tube(at(i / n * TAU), at((i + 1) / n * TAU), 1.8, cyan);
    for (let i = 0; i < n / 2; i++) G.tube(at(i / (n / 2) * TAU, .955, -1.6), at((i + 1) / (n / 2) * TAU, .955, -1.6), .7, pink);
    const steel = (u, vv, i, j) => X3.ramp(PL.CHROME, .3 + (1 - Math.abs(u - .5) * 2) * .55, i, j);
    for (let k = 0; k < 60; k++) { const a = k / 60 * TAU, long = k % 5 === 0; G.tube(at(a, 1.04), at(a, long ? 1.095 : 1.065), long ? .7 : .45, steel); }   // шкала
    [25, 155, 205, 335].forEach(d => { const p = at(d * Math.PI / 180, 1, -.9);
      G.disc([p[0], p[1], p[2] - .3], 2.3, (u, vv, i, j) => { const r = Math.hypot(u - .5, vv - .5); if (r < .17) { X3.SH.fl |= X3.F_EMIT; return NE.cyan[2]; } return X3.ramp(PL.CHROME, .9 - r * 1.2 + (u < .45 && vv < .45 ? .15 : 0), i, j); }); });
  };
  /** Планка-емітер на задньому краї стільниці: темний корпус зі світлою губою, блакитна неонова щілина, три лінзи — під
   *  кожною панеллю (промені до панелей — живі, objects/analytics.js). */
  const LENS = [.08, .5, .92];
  PAINT.an_emit = (c, fw, fh) => {
    c.fillStyle = 'rgba(4,6,20,.88)'; c.fillRect(0, 0, fw, fh); c.fillStyle = 'rgba(200,240,255,.4)'; c.fillRect(0, 0, fw, fh * .16);
    A.neon(c, fw * .02, fh * .66, fw * .98, fh * .66, CY, .6);
    LENS.forEach(f => { c.fillStyle = '#05030f'; rr(c, fw * f - 4.5, fh * .14, 9, fh * .7, .8); c.fill();
      const g = c.createRadialGradient(fw * f, fh * .48, 0, fw * f, fh * .48, 4.2); g.addColorStop(0, '#ffffff'); g.addColorStop(.35, '#9af6ff'); g.addColorStop(1, 'rgba(59,232,255,0)'); c.fillStyle = g; c.fillRect(fw * f - 4.5, fh * .1, 9, fh * .8); });
  };
  PAINT.an_emit.sides = { top: (c, fw, fh) => { c.fillStyle = 'rgba(4,6,20,.6)'; c.fillRect(0, 0, fw, fh); A.neon(c, fw * .03, fh * .55, fw * .97, fh * .55, CY, 1.2);
    LENS.forEach(f => { c.fillStyle = '#ffffff'; c.fillRect(fw * f - 2.5, fh * .55 - .5, 5, 1); }); } };

  // ---------- ВМІСТ ГОЛО-ПАНЕЛЕЙ КОКПІТУ (objects/analytics.js -> NX.arc.holo.pane, crisp) ----------
  /** КІБЕРПАНК-ПАНЕЛЬ: обрис зі зрізаними кутами (ліворуч угорі й праворуч унизу), темне скло з тонкою сіткою й «дощем даних»,
   *  шапка-вкладка з назвою й іконкою, неоновий кант з розщепленням кольорів (блакитний / рожевий), білі кутові скоби, риски-
   *  шкала по лівому краю, штрих-код і вогник стану. Повертає k — розмір зрізу (вміст — від шапки вниз). */
  function cyber(c, fw, fh, title, ic, t, seed = 0) {
    const e = .8, k = Math.min(fw, fh) * .14, hh = fh * .095;
    const path = (dx = 0) => { c.beginPath(); c.moveTo(k + e + dx, e); c.lineTo(fw - e + dx, e); c.lineTo(fw - e + dx, fh - k - e); c.lineTo(fw - k - e + dx, fh - e); c.lineTo(e + dx, fh - e); c.lineTo(e + dx, k + e); c.closePath(); };
    const g = c.createLinearGradient(0, 0, 0, fh); g.addColorStop(0, 'rgba(14,34,96,.84)'); g.addColorStop(.55, 'rgba(10,18,66,.8)'); g.addColorStop(1, 'rgba(34,12,74,.86)');
    path(); c.fillStyle = g; c.fill();
    c.save(); path(); c.clip();
    c.strokeStyle = 'rgba(90,200,255,.07)'; c.lineWidth = .25; c.beginPath(); for (let x = 3; x < fw; x += 4) { c.moveTo(x, 0); c.lineTo(x, fh); } for (let y = 3; y < fh; y += 4) { c.moveTo(0, y); c.lineTo(fw, y); } c.stroke();   // сітка
    for (let i = 0; i < 7; i++) { const x = fw * (.07 + i * .14), sp = 6 + 9 * hash(i, seed + 3);                   // «дощ даних»
      for (let q = 0; q < 5; q++) { const y = ((t * sp + hash(i, q + seed) * fh + q * fh * .21) % (fh * 1.1)) - fh * .05; c.fillStyle = q === 0 ? 'rgba(200,250,255,.22)' : `rgba(90,220,255,${.1 - q * .015})`; c.fillRect(x, y, 1.1, .8); } }
    c.restore();
    c.beginPath(); c.moveTo(k + e + .6, e + .6); c.lineTo(fw * .74, e + .6); c.lineTo(fw * .74 - hh * .6, hh); c.lineTo(e + .6 + k * .4, hh); c.closePath();   // шапка-вкладка
    c.fillStyle = 'rgba(59,232,255,.2)'; c.fill();
    A.txt(c, title, k + e + 1.6, hh * .55, fw * .74 - k - hh * .7 - 2.6, hh * .58, '#e8feff', { align: 'left', glow: CY });
    icon(c, ic, fw * .84, hh * .55, hh * .55, 'rgba(190,240,255,.9)');
    c.fillStyle = Math.sin(t * 5 + seed) > 0 ? '#ff4f6a' : '#7a1a2a'; c.beginPath(); c.arc(fw * .94, hh * .55, hh * .13, 0, 7); c.fill();
    c.fillStyle = 'rgba(120,230,255,.55)'; c.fillRect(e + 1, hh + 1, fw - 2 * e - 2, .3); c.fillStyle = '#e8feff'; c.fillRect(e + 1, hh + .9, fw * .16, .5);
    for (let y = hh + 3; y < fh - k; y += 2.6) { const L = Math.round((y - hh) / 2.6) % 4 === 0; c.fillStyle = L ? 'rgba(150,240,255,.6)' : 'rgba(150,240,255,.3)'; c.fillRect(e + .9, y, L ? 1.6 : .9, .25); }   // шкала
    for (let i = 0, x = fw * .5; i < 14 && x < fw - k - 2; i++) { const w = .25 + .55 * hash(i, seed + 9); c.fillStyle = 'rgba(190,240,255,.5)'; c.fillRect(x, fh - e - 2.8, w, 1.6); x += w + .35 + .4 * hash(i, seed + 4); }   // штрих-код
    c.save(); c.globalCompositeOperation = 'lighter'; c.lineWidth = .5;
    c.strokeStyle = 'rgba(255,60,210,.55)'; path(.5); c.stroke(); c.strokeStyle = 'rgba(60,220,255,.5)'; path(-.5); c.stroke(); c.restore();   // розщеплення кольорів
    c.strokeStyle = '#8af4ff'; c.lineWidth = .55; path(); c.stroke();
    const L = Math.min(fw, fh) * .1; c.strokeStyle = '#ffffff'; c.lineWidth = 1; c.beginPath();
    c.moveTo(fw - e - L, e + .5); c.lineTo(fw - e - .5, e + .5); c.lineTo(fw - e - .5, e + L); c.moveTo(e + .5, fh - e - L); c.lineTo(e + .5, fh - e - .5); c.lineTo(e + L, fh - e - .5); c.stroke();   // скоби
    c.strokeStyle = 'rgba(255,90,220,.9)'; c.lineWidth = .5; c.beginPath(); c.moveTo(e + 1.6, k + e - .2); c.lineTo(k + e - .2, e + 1.6); c.moveTo(fw - k - e + .2, fh - e - 1.6); c.lineTo(fw - e - 1.6, fh - k - e + .2); c.stroke();   // кант зрізів
    return { k, hh };
  }
  /** Скан-смуга по панелі. */
  function sheen(c, fw, fh, t, seed) {
    c.save(); c.globalCompositeOperation = 'lighter';
    const ry = (((t + seed) * .11) % 1.3 - .15) * fh, g = c.createLinearGradient(0, ry - fh * .06, 0, ry + fh * .06);
    g.addColorStop(0, 'rgba(150,230,255,0)'); g.addColorStop(.5, 'rgba(150,230,255,.1)'); g.addColorStop(1, 'rgba(150,230,255,0)'); c.fillStyle = g; c.fillRect(0, ry - fh * .06, fw, fh * .12);
    c.restore();
  }
  /** Скляне віконце всередині панелі (кант і легкий перелив). */
  const box = (c, x, y, w, h, col = 'rgba(120,230,255,.55)') => { c.fillStyle = 'rgba(6,20,64,.7)'; c.fillRect(x, y, w, h); c.strokeStyle = col; c.lineWidth = .35; c.strokeRect(x + .2, y + .2, w - .4, h - .4); };
  const RR = (f, fw, fh) => [f[0] * fw, f[1] * fh, f[2] * fw, f[3] * fh];
  const DAYV = [.52, .64, .58, .74, .5, .34, .3], TODAY = 4;
  const LANG = [['UA', .38, CY], ['PL', .27, PK], ['NL', .2, VI], ['EN', .15, GO]];
  const IC7 = { cart: ['X......', 'XXXXXXX', '.X....X', '.X...X.', '.XXXXX.', '.......', '..X.X..'], ok: ['......X', '.....XX', '....XX.', 'X..XX..', 'XXXX...', '.XX....', '.......'] };
  /** ВІДВІДУВАЧІ (ліве крило): лічильник за сьогодні з міні-графіком, стовпчики по днях (сьогоднішній росте), частки мов, «пульс». */
  function visitors(c, fw, fh, t) {
    const act = AN().active, { hh } = cyber(c, fw, fh, t_('scene.analytics.visitors'), 'user', t, 1);
    const [cx, cy, cw, ch] = RR([.08, 0, .84, .17], fw, fh); box(c, cx, hh + 2.4, cw, ch);
    A.txt(c, t_('scene.analytics.today'), cx + cw * .06, hh + 2.4 + ch * .24, cw * .7, ch * .2, 'rgba(200,240,255,.85)', { align: 'left' });
    A.txt(c, NX.num((12400 + t * (act ? 9 : 3.2)) / 1000, 1) + ' ' + t_('scene.unit.k'), cx + cw * .06, hh + 2.4 + ch * .62, cw * .88, ch * .32, '#e8feff', { align: 'left' });
    for (let k = 0; k < 9; k++) { const h = ch * .16 * (.3 + .7 * wave(Math.floor(t * 2) + k, 2)); c.fillStyle = k === 8 ? '#ffffff' : 'rgba(59,232,255,.8)'; c.fillRect(cx + cw * (.08 + k * .095), hh + 2.4 + ch * .96 - h, cw * .06, h); }
    const by = hh + ch + 6, bh = fh * .3, bx = fw * .1, bw = fw * .8, grow = (t * (act ? .5 : .16)) % 1;
    box(c, bx - fw * .03, by - 1.4, bw + fw * .06, bh + fh * .07);
    for (let k = 1; k < 4; k++) { c.fillStyle = 'rgba(150,220,255,.13)'; c.fillRect(bx, by + bh * k / 4, bw, .3); }
    DAYV.forEach((dv, k) => {
      const today = k === TODAY, h = bh * (today ? .2 + .78 * (1 - Math.pow(1 - grow, 2)) : dv * (.96 + .04 * Math.sin(t * 1.5 + k))), x = bx + bw * (k + .16) / 7, w = bw / 7 * .68, y = by + bh - h;
      const g = c.createLinearGradient(0, y, 0, by + bh); g.addColorStop(0, today ? '#ffe4fa' : '#e8feff'); g.addColorStop(.2, today ? '#ff7ad0' : '#5ae8ff'); g.addColorStop(1, today ? '#7a1a8a' : '#1a5ad0');
      c.fillStyle = g; c.fillRect(x, y, w, h); c.fillStyle = 'rgba(255,255,255,.45)'; c.fillRect(x, y, w, Math.min(.7, h));
    });
    const days = NX.t('scene.analytics.days'); (Array.isArray(days) ? days : []).forEach((d, k) => A.txt(c, d, bx + bw * (k + .5) / 7, by + bh + fh * .03, bw / 7 * .95, fh * .022, k === TODAY ? '#ffe4fa' : 'rgba(170,220,255,.75)'));
    const ly = by + bh + fh * .08, lh = fh * .06; let x = fw * .08; const lw = fw * .84;
    LANG.forEach(([code, v, col]) => { const w = lw * v; c.fillStyle = col; c.fillRect(x + .25, ly + lh * .58, w - .5, lh * .34); A.txt(c, code, x + w / 2, ly + lh * .2, w * .9, lh * .36, 'rgba(225,245,255,.9)'); x += w; });
    const py = fh * .86, ph = fh * .045; c.strokeStyle = 'rgba(255,140,220,.85)'; c.lineWidth = .6; c.beginPath();                    // «пульс» сайту
    for (let i = 0; i <= 30; i++) { const xx = fw * (.08 + .8 * i / 30), q = ((i / 30) * 2.4 - t * (act ? 1.6 : .8)) % 1, beat = q < 0 ? q + 1 : q, v = beat < .1 ? Math.sin(beat / .1 * Math.PI) * (beat < .05 ? 1 : -.5) : 0;
      i ? c.lineTo(xx, py - v * ph) : c.moveTo(xx, py - v * ph); } c.stroke();
    sheen(c, fw, fh, t, 0);
  }
  /** ВИРУЧКА (центр): сума й ▲ відсоток, тренд (лінія з заливкою біжить, курсор із підказкою), продажі по світу (карта з
   *  пінгами), ціль місяця. */
  function revenue(c, fw, fh, t) {
    const act = AN().active, sp = act ? 3.2 : 1.1, { hh } = cyber(c, fw, fh, t_('scene.analytics.revenue'), 'chart', t, 2);
    const sum = 48 + 9 * (.5 + .5 * Math.sin(t * .2)) + ((t * (act ? .8 : .2)) % 3), pct = 18 + 4 * Math.sin(t * .4);
    A.txt(c, NX.num(sum, 1) + ' ' + t_('scene.unit.k'), fw * .08, hh + fh * .07, fw * .52, fh * .085, '#e8feff', { align: 'left', glow: CY });
    c.fillStyle = GR; c.beginPath(); c.moveTo(fw * .66, hh + fh * .1); c.lineTo(fw * .69, hh + fh * .045); c.lineTo(fw * .72, hh + fh * .1); c.fill();
    A.txt(c, '+' + NX.num(pct, 1) + '%', fw * .735, hh + fh * .072, fw * .22, fh * .05, '#b8ffd2', { align: 'left' });
    const gx = fw * .07, gy = hh + fh * .14, gw = fw * .86, gh = fh * .37; box(c, gx, gy, gw, gh);
    for (let k = 1; k < 4; k++) { c.fillStyle = 'rgba(150,220,255,.12)'; c.fillRect(gx + 1, gy + gh * k / 4, gw - 2, .3); }
    const step = gw / 16, n0 = Math.floor(t * sp), f = t * sp - n0, P = [];
    for (let k = -1; k <= 17; k++) { const n = n0 + k, x = gx + (k - f) * step, v = Math.max(.12, Math.min(.94, .5 + .24 * Math.sin(n * .11) + .34 * (wave(n, 5) - .5))); P.push([x, gy + gh * (.92 - .74 * v)]); }
    c.save(); c.beginPath(); c.rect(gx + .5, gy + .5, gw - 1, gh - 1); c.clip();
    c.beginPath(); c.moveTo(P[0][0], gy + gh); P.forEach(p => c.lineTo(p[0], p[1])); c.lineTo(P[P.length - 1][0], gy + gh); c.closePath();
    const g = c.createLinearGradient(0, gy, 0, gy + gh); g.addColorStop(0, 'rgba(255,90,220,.42)'); g.addColorStop(1, 'rgba(255,90,220,0)'); c.fillStyle = g; c.fill();
    c.strokeStyle = '#ff9af0'; c.lineWidth = .7; c.beginPath(); P.forEach((p, i) => i ? c.lineTo(p[0], p[1]) : c.moveTo(p[0], p[1])); c.stroke();
    const cu = .3 + .45 * (.5 + .5 * Math.sin(t * .7)), cxp = gx + gw * cu, ki = Math.max(0, Math.min(P.length - 2, Math.floor((cxp - P[0][0]) / step))), q = (cxp - P[ki][0]) / step, cyp = P[ki][1] + (P[ki + 1][1] - P[ki][1]) * q;
    c.fillStyle = 'rgba(220,250,255,.5)'; for (let y = gy + 2; y < gy + gh - 1; y += 2) c.fillRect(cxp - .15, y, .3, 1);
    c.fillStyle = '#ffffff'; c.beginPath(); c.arc(cxp, cyp, 1.1, 0, 7); c.fill(); c.strokeStyle = PK; c.lineWidth = .4; c.beginPath(); c.arc(cxp, cyp, 1.9, 0, 7); c.stroke();
    const tw = gw * .3, th = gh * .16, tx = Math.min(gx + gw - tw - 1, cxp + 2.2), ty = Math.max(gy + 1, cyp - th - 2.2);
    c.fillStyle = 'rgba(20,56,160,.95)'; c.fillRect(tx, ty, tw, th); c.strokeStyle = 'rgba(160,240,255,.8)'; c.lineWidth = .3; c.strokeRect(tx, ty, tw, th);
    A.txt(c, NX.num(28 + 44 * (1 - (cyp - gy) / gh), 1) + ' ' + t_('scene.unit.k'), tx + tw / 2, ty + th * .55, tw * .86, th * .6, '#e8feff');
    c.restore();
    const mx = fw * .07, my = gy + gh + fh * .035, mw = fw * .86, mh = fh * .22; box(c, mx, my, mw, mh, 'rgba(255,120,230,.5)');   // продажі по світу
    K.scrMap(c, mx + .6, my + .6, mw - 1.2, mh - 1.2, t, { act: act ? 1 : 0, hot: ['kyiv', 'warsaw', 'amsterdam'] });
    const gy2 = fh * .875, gl = fw * .74, done = .62 + .25 * ((t * (act ? .05 : .012)) % 1);                       // ціль місяця: смуга з бігунцем
    c.fillStyle = 'rgba(8,24,80,.9)'; c.fillRect(fw * .08, gy2, gl, fh * .022);
    const g3 = c.createLinearGradient(fw * .08, 0, fw * .08 + gl, 0); g3.addColorStop(0, '#3be8ff'); g3.addColorStop(1, '#ff4fd8'); c.fillStyle = g3; c.fillRect(fw * .08, gy2, gl * done, fh * .022);
    c.fillStyle = '#ffffff'; c.fillRect(fw * .08 + gl * done - .5, gy2 - .8, 1, fh * .022 + 1.6); icon(c, 'target', fw * .08 + gl + 3, gy2 + fh * .011, fh * .03, GO);
    sheen(c, fw, fh, t, 3.3);
  }
  /** КОНВЕРСІЯ (праве крило): «пончик» з відсотком, легенда мов, воронка (відвідувачі -> кошики -> замовлення: іконки й числа). */
  function conv(c, fw, fh, t) {
    const act = AN().active, { hh } = cyber(c, fw, fh, t_('scene.analytics.conv'), 'target', t, 3);
    const dcx = fw * .5, dcy = hh + fh * .2, r = Math.min(fw * .3, fh * .14), cv = 3.4 + .4 * Math.sin(t * .5);
    c.fillStyle = 'rgba(10,28,90,.96)'; c.beginPath(); c.arc(dcx, dcy, r * 1.1, 0, 7); c.fill();
    c.strokeStyle = 'rgba(150,240,255,.35)'; c.lineWidth = .3; c.beginPath(); c.arc(dcx, dcy, r * 1.22, 0, 7); c.stroke();
    let a = -Math.PI / 2 + t * .25; [[44, CY], [33, PK], [23, VI]].forEach(([v2, col], k) => { const b = a + v2 / 100 * Math.PI * 2 * (.97 + .03 * Math.sin(t * 2 + k)); c.strokeStyle = col; c.lineWidth = r * .38; c.beginPath(); c.arc(dcx, dcy, r * .78, a + .05, b - .05); c.stroke(); a = b; });
    c.fillStyle = '#0a1a50'; c.beginPath(); c.arc(dcx, dcy, r * .56, 0, 7); c.fill(); A.txt(c, NX.num(cv, 1) + '%', dcx, dcy, r * 1.05, r * .36, '#e8feff');
    [['UA', CY, .44], ['PL', PK, .33], ['NL', VI, .23]].forEach(([s, col, v2], k) => { const y = hh + fh * (.38 + k * .055), lw = fw * .42;
      c.fillStyle = col; c.fillRect(fw * .1, y - .7, 1.6, 1.4); A.txt(c, s, fw * .17, y, fw * .16, fh * .03, 'rgba(210,240,255,.85)', { align: 'left' });
      c.fillStyle = 'rgba(8,24,80,.95)'; c.fillRect(fw * .4, y - .7, lw, 1.4); c.fillStyle = col; c.fillRect(fw * .4, y - .7, lw * v2 * (1.6 + .15 * Math.sin(t * 1.3 + k)), 1.4); });
    const fy = hh + fh * .57, sh = fh * .085, base = 1240 + Math.floor(t * (act ? 3 : .7));                       // воронка
    [['user', base, CY, 1], ['cart', Math.round(base * .31), PK, .72], ['ok', Math.round(base * .034 * (1 + .03 * Math.sin(t * .5))), GR, .46]].forEach(([ic, n, col, w], k) => {
      const y = fy + k * (sh + 1.4), x0 = fw * (.5 - .4 * w), x1 = fw * (.5 + .4 * w), xn = fw * (.5 - .4 * (k < 2 ? w * .82 : w)), xm = fw - xn;
      c.beginPath(); c.moveTo(x0, y); c.lineTo(x1, y); c.lineTo(xm, y + sh); c.lineTo(xn, y + sh); c.closePath(); c.fillStyle = 'rgba(8,24,80,.85)'; c.fill(); c.strokeStyle = col; c.lineWidth = .4; c.stroke();
      const ph = (t * (act ? 1.2 : .5) + k * .3) % 1; c.fillStyle = col; c.globalAlpha = .25; c.fillRect(x0 + (x1 - x0) * ph - 1, y + .4, 2, sh - .8); c.globalAlpha = 1;
      if (IC7[ic]) A.icon7(c, IC7[ic], x0 + sh * .55 + 1, y + sh / 2, sh * .55, col); else icon(c, ic, x0 + sh * .55 + 1, y + sh / 2, sh * .55, col);
      A.txt(c, NX.num(n, 0), (x0 + x1) / 2 + sh * .3, y + sh / 2, (x1 - x0) * .55, sh * .5, '#e8feff'); });
    sheen(c, fw, fh, t, 6.1);
  }
  NX.arc.anPane = (kind, c, fw, fh, t) => (kind === 'revenue' ? revenue : kind === 'conv' ? conv : visitors)(c, fw, fh, t);
  NX.arc.anWave = wave;
})();

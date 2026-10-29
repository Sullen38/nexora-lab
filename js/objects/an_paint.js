/* ============================================================================
 * objects/an_paint.js — АНАЛІТИКА («ОБСЕРВАТОРІЯ ДАНИХ»): МАЛЮНКИ ГРАНЕЙ, ЖИВІ ГРАНІ, КУПОЛ, ВМІСТ ГОЛО-ЕКРАНА
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
 * Крок 10 — голо-кокпіт (три кіберпанк-панелі, гало-кільце, планка-емітер). Крок 11 (власник: «з екраном аналітики перебор —
 * треба простіше; або хоч якийсь фон, бо дуже цегляну стіну видно; спробуй ще щось»): кокпіт прибрано —
 *   an_dome    — КУПОЛ ОБСЕРВАТОРІЇ на стіні (форма NX.arc.shape['st:dome']): тонка плита темного скла з аркою вгорі, ледь
 *                видимі ребра купола й зорі, неоновий кант по арці, хромовані вузли; ховає цеглу за екраном
 *   вміст ОДНОГО широкого голо-екрана (NX.arc.anScreen): скло з тонким кантом, шапка (назва, ● НАЖИВО, смужка прогресу, коли
 *   Nexi працює), ліворуч — головне число, праворуч — графік, унизу — три показники; вигляд — за задачею Nexi: огляд виручки,
 *   ПРОДАЖІ за тиждень (стовпчики по днях), ВІДВІДУВАЧІ (карта з пінгами), ПРОГНОЗ (пунктир у майбутнє); по завершенні —
 *   печатка «ЗВІТ ГОТОВИЙ ✓».
 * Матеріали (NX.arc.kit.STY): chrome — хром (підставка для ніг), mug — світла кераміка, dome — темне скло купола. Написи — NX.t (4 мови).
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

  // ---------- КУПОЛ ОБСЕРВАТОРІЇ (крок 11): фон за екраном — замість гало-кільця й цегли ----------
  // Власник: «з екраном аналітики перебор — треба простіше; або хоч якийсь фон, бо дуже цегляну стіну видно». Купол — тонка
  // (2.5 px) плита темного скла на стіні: прямі боки й полога арка вгорі (як вікно обсерваторії); усередині ледь видимі ребра купола й
  // зорі, по арці — неоновий кант, на п'ятах арки й угорі — хромовані вузли. Низ — за столом.
  const SHP = NX.arc.shape = NX.arc.shape || {}, X3s = NX.px3d;
  A.STY.dome = A.STY.dome || { pal: PL.NAVY, q: .3, bev: 0, ins: 0 };
  /** Обрис купола в текстурі (fw × fh, од. світу): k — відступ усередину. Арка — пів-еліпс заввишки rise над прямими боками. */
  const domeRise = (fw, fh) => Math.min(fw / 2 * .62, fh * .48);                                   // арка пологіша за півколо: вивіска вгорі вміщається між п'ятами арки
  function arch(c, fw, fh, k = 0) { const a = fw / 2, rise = domeRise(fw, fh); c.beginPath(); c.moveTo(k, fh + 1); c.lineTo(k, rise); c.ellipse(a, rise, a - k, rise - k, 0, Math.PI, 0); c.lineTo(fw - k, fh + 1); c.closePath(); }
  /** Скло купола: темно-синій перелив, ледь видимі ребра й паралелі купола, зорі (кілька яскравіших з хрестиком), темна
   *  фаска всередині краю, неоновий кант по арці, хромовані вузли. */
  function domeArt(c, fw, fh) {
    const a = fw / 2, rise = domeRise(fw, fh);
    let g = c.createLinearGradient(0, 0, 0, fh); g.addColorStop(0, '#040720'); g.addColorStop(.45, '#070e2e'); g.addColorStop(1, '#0a1238'); c.fillStyle = g; c.fillRect(0, 0, fw, fh);
    g = c.createRadialGradient(a * .62, rise * .5, 0, a * .62, rise * .5, a * .75); g.addColorStop(0, 'rgba(110,80,220,.12)'); g.addColorStop(1, 'rgba(110,80,220,0)'); c.fillStyle = g; c.fillRect(0, 0, fw, fh);
    g = c.createRadialGradient(a * 1.4, rise * .9, 0, a * 1.4, rise * .9, a * .6); g.addColorStop(0, 'rgba(40,150,255,.09)'); g.addColorStop(1, 'rgba(40,150,255,0)'); c.fillStyle = g; c.fillRect(0, 0, fw, fh);
    c.save(); arch(c, fw, fh); c.clip();
    c.strokeStyle = 'rgba(120,190,255,.075)'; c.lineWidth = .35;                                                   // ребра купола й паралелі
    [.36, .7].forEach(k => { c.beginPath(); c.ellipse(a, rise, a * k, rise, 0, Math.PI, 0); c.stroke(); [-1, 1].forEach(sd => { c.beginPath(); c.moveTo(a + sd * a * k, rise); c.lineTo(a + sd * a * k, fh); c.stroke(); }); });
    c.beginPath(); c.moveTo(a, 0); c.lineTo(a, fh); c.stroke();
    [.4, .74].forEach(k => { const y = rise * (1 - k), hw = a * Math.sqrt(1 - k * k); c.beginPath(); c.moveTo(a - hw, y); c.lineTo(a + hw, y); c.stroke(); });
    for (let i = 0; i < 150; i++) {                                                                             // зорі (гущі вгорі)
      const x = hash(i, 71) * fw, y = Math.pow(hash(i, 73), 1.7) * fh * .92, s = hash(i, 75), big = s > .94, r = big ? .65 : .22 + s * .28;
      c.fillStyle = big ? 'rgba(235,250,255,.95)' : `rgba(${s > .5 ? '200,232,255' : '168,184,255'},${.16 + s * .32})`; c.fillRect(x - r, y - r, r * 2, r * 2);
      if (big) { c.fillStyle = 'rgba(190,236,255,.35)'; c.fillRect(x - 2.4, y - .15, 4.8, .3); c.fillRect(x - .15, y - 2.4, .3, 4.8); } }
    c.strokeStyle = 'rgba(0,0,12,.6)'; c.lineWidth = 6; arch(c, fw, fh); c.stroke();                               // темна фаска всередині краю
    c.restore();
    [['rgba(10,40,90,.9)', 2.6], ['#3be8ff', 1.1], ['#d8fcff', .38]].forEach(([st, w]) => { c.strokeStyle = st; c.lineWidth = w; arch(c, fw, fh, 1.7); c.stroke(); });   // неоновий кант
    c.strokeStyle = 'rgba(190,225,255,.4)'; c.lineWidth = .45; arch(c, fw, fh, .25); c.stroke();                   // край скла
    [[1.7, rise], [fw - 1.7, rise], [a, 1.7]].forEach(([x, y]) => { const gg = c.createRadialGradient(x - .6, y - .6, 0, x, y, 2.6); gg.addColorStop(0, '#ffffff'); gg.addColorStop(.4, '#aeb8e6'); gg.addColorStop(1, '#2a2f5e');
      c.fillStyle = gg; c.beginPath(); c.arc(x, y, 2.6, 0, 7); c.fill(); c.fillStyle = '#3be8ff'; c.beginPath(); c.arc(x, y, .8, 0, 7); c.fill(); });   // хромовані вузли
  }
  /** КУПОЛ (форма st:dome): лицьова грань — многокутник (прямі боки + арка з 48 відрізків) з текстурою domeArt; торець по обрису —
   *  тонка хромована смужка (видно збоку). Предмет B: w — ширина, yt..yb — від верху арки до низу, dep — товщина. */
  SHP['st:dome'] = (G, B) => {
    const Pp = G.P, a = B.w / 2, H = B.yb - B.yt, rise = domeRise(B.w, H), ys = B.yt + rise, n = 48, sub = X3s.sub, dot = X3s.dot;
    const outl = [[-a, B.yb], [-a, ys]]; for (let i = 1; i < n; i++) { const th = Math.PI - i / n * Math.PI; outl.push([a * Math.cos(th), ys - rise * Math.sin(th)]); } outl.push([a, ys], [a, B.yb]);
    const Fr = outl.map(([u, y]) => Pp(u, 0, y)), Bk = outl.map(([u, y]) => Pp(u, B.dep, y));
    const unit = v => { const l = Math.hypot(...v) || 1; return v.map(q => q / l); };
    let nF = X3s.newell(Fr); if (dot(nF, sub(Pp(0, -10, ys), Pp(0, 0, ys))) < 0) nF = nF.map(q => -q); nF = unit(nF);
    const O = Pp(-a, 0, B.yt), Fc = { k: 'front', poly: Fr, n: nF, fw: B.w, fh: H, O, A: sub(Pp(a, 0, B.yt), O), B: sub(Pp(-a, 0, B.yb), O) };
    G.face(Fr, Fc.O, Fc.A, Fc.B, A.shader('dome', Fc, B, { tex: A.texture(B, Fc, 3.5, domeArt), fog: 0 }), nF);
    const cen = Pp(0, B.dep / 2, ys), rim = (u, v, i, j) => v < .3 ? X3s.ramp(PL.CHROME, .7 - v, i, j) : X3s.ramp(PL.STEEL, .5, i, j);
    for (let i = 0; i < outl.length - 1; i++) {
      const poly = [Fr[i], Fr[i + 1], Bk[i + 1], Bk[i]], m = poly.reduce((s2, p) => [s2[0] + p[0] / 4, s2[1] + p[1] / 4, s2[2] + p[2] / 4], [0, 0, 0]);
      let nn = X3s.newell(poly); if (dot(nn, sub(m, cen)) < 0) nn = nn.map(q => -q); nn = unit(nn);
      G.face(poly, Fr[i], sub(Fr[i + 1], Fr[i]), sub(Bk[i], Fr[i]), rim, nn);
    }
  };

  // ---------- ГОЛО-ЕКРАН У КУПОЛІ (крок 11; objects/analytics.js -> NX.arc.holo.pane, crisp) ----------
  // Один широкий екран замість трьох панелей: спокійне скло, тонкий кант, шапка, головне число, графік, три показники. Що
  // показує — за задачею Nexi (S.view): огляд виручки (у спокої), продажі за тиждень, відвідувачі, прогноз; S.prog — поступ
  // задачі (стовпчики, пінги, пунктир ростуть), S.done — печатка «ЗВІТ ГОТОВИЙ ✓» після задачі (0..1 — проявлення/згасання).
  const VIEW = { overview: ['scene.analytics.revenue', 'chart'], sales: ['scene.analytics.sales', 'chart'], traffic: ['scene.analytics.visitors', 'user'], forecast: ['scene.analytics.forecast', 'target'] };
  const DAYV = [.52, .64, .58, .74, .92, .46, .38], BEST = 4;                                                       // продажі по днях: п'ятниця — найкраща
  const kpi = (c, x, y, w, h, ic, label, value, col, t, seed) => {
    c.fillStyle = 'rgba(10,30,84,.9)'; rr(c, x, y, w, h, 1.4); c.fill(); c.strokeStyle = 'rgba(120,220,255,.28)'; c.lineWidth = .3; rr(c, x, y, w, h, 1.4); c.stroke();
    icon(c, ic, x + h * .42, y + h * .5, h * .42, col);
    A.txt(c, label, x + h * .8, y + h * .3, w - h * .9, h * .24, 'rgba(190,225,255,.85)', { align: 'left' });
    A.txt(c, value, x + h * .8, y + h * .68, w * .5, h * .34, '#e8feff', { align: 'left' });
    c.strokeStyle = col; c.lineWidth = .45; c.beginPath();                                                       // міні-графік
    for (let i = 0; i <= 8; i++) { const xx = x + w * (.66 + .3 * i / 8), yy = y + h * (.78 - .5 * wave(Math.floor(t * .8) + i, seed)); i ? c.lineTo(xx, yy) : c.moveTo(xx, yy); } c.stroke();
  };
  function anScreen(c, fw, fh, t, S = {}) {
    const view = VIEW[S.view] ? S.view : 'overview', act = !!S.act, prog = S.prog || 0, r = 3.2, e = .6;
    // скло й кант
    let g = c.createLinearGradient(0, 0, 0, fh); g.addColorStop(0, 'rgba(12,30,82,.97)'); g.addColorStop(.55, 'rgba(7,17,54,.97)'); g.addColorStop(1, 'rgba(9,13,46,.97)');
    rr(c, e, e, fw - 2 * e, fh - 2 * e, r); c.fillStyle = g; c.fill();
    c.save(); rr(c, e, e, fw - 2 * e, fh - 2 * e, r); c.clip();
    c.strokeStyle = 'rgba(90,200,255,.05)'; c.lineWidth = .25; c.beginPath(); for (let x = 6; x < fw; x += 6) { c.moveTo(x, 0); c.lineTo(x, fh); } for (let y = 6; y < fh; y += 6) { c.moveTo(0, y); c.lineTo(fw, y); } c.stroke();
    g = c.createLinearGradient(0, 0, fw, fh); g.addColorStop(0, 'rgba(255,255,255,0)'); g.addColorStop(.42, 'rgba(255,255,255,0)'); g.addColorStop(.47, 'rgba(200,240,255,.05)'); g.addColorStop(.55, 'rgba(255,255,255,0)'); c.fillStyle = g; c.fillRect(0, 0, fw, fh);   // відблиск по склу
    c.restore();
    c.fillStyle = 'rgba(210,245,255,.2)'; c.fillRect(r + 1, e + .5, fw - 2 * r - 2, .35);
    c.strokeStyle = '#7af4ff'; c.lineWidth = .55; rr(c, e, e, fw - 2 * e, fh - 2 * e, r); c.stroke();
    c.strokeStyle = '#e8feff'; c.lineWidth = .8; const L = 6; c.beginPath();                                      // світлі кути
    [[e, e, 1, 1], [fw - e, e, -1, 1], [e, fh - e, 1, -1], [fw - e, fh - e, -1, -1]].forEach(([x, y, sx, sy]) => { c.moveTo(x + sx * (r + L), y); c.lineTo(x + sx * r, y); c.moveTo(x, y + sy * r); c.lineTo(x, y + sy * (r + L)); }); c.stroke();
    // шапка: іконка й назва вигляду, ● НАЖИВО, під нею — смужка прогресу задачі (коли Nexi працює)
    const hh = fh * .15, [key, ic] = VIEW[view];
    icon(c, ic, 7.5, hh * .56, hh * .46, CY);
    A.txt(c, t_(key), 12.5, hh * .56, fw * .55, hh * .44, '#e8feff', { align: 'left', glow: CY });
    const on = Math.sin(t * 4) > -.4; c.fillStyle = on ? '#ff4f6a' : '#6a1a2a'; c.beginPath(); c.arc(fw * .79, hh * .56, 1.1, 0, 7); c.fill();
    A.txt(c, t_('scene.marketing.live'), fw * .81, hh * .56, fw * .16, hh * .3, 'rgba(255,205,215,.92)', { align: 'left' });
    c.fillStyle = 'rgba(120,230,255,.3)'; c.fillRect(4, hh, fw - 8, .3);
    if (act) { c.fillStyle = 'rgba(255,201,77,.22)'; c.fillRect(4, hh - .25, fw - 8, .8); c.fillStyle = GO; c.fillRect(4, hh - .25, (fw - 8) * prog, .8); }
    // ліворуч — головне число й підпис; праворуч — графік вигляду
    const y0 = hh + 3, yb = fh * .74, lx = 6, lw = fw * .27, gx = fw * .33, gw = fw - gx - 5, gy = y0 + 1, gh = yb - gy;
    const grow = act ? prog : 1, sum = 48 + 9 * (.5 + .5 * Math.sin(t * .2)), pct = 18 + 4 * Math.sin(t * .4);
    let big, sub2, delta = null;
    if (view === 'sales') { big = '+' + NX.num(4 + 24 * grow, 1) + '%'; sub2 = t_('scene.analytics.sales'); }
    else if (view === 'traffic') { big = NX.num(3 + 9.4 * grow, 1) + ' ' + t_('scene.unit.k'); sub2 = t_('scene.analytics.today'); }
    else if (view === 'forecast') { big = '+' + NX.num(5 + 17 * grow, 1) + '%'; sub2 = t_('scene.analytics.forecast'); }
    else { big = NX.num(sum, 1) + ' ' + t_('scene.unit.k'); sub2 = t_('scene.analytics.today'); delta = '+' + NX.num(pct, 1) + '%'; }
    A.txt(c, sub2, lx, y0 + 4, lw, 3.4, 'rgba(190,225,255,.8)', { align: 'left' });
    A.txt(c, big, lx, y0 + 13, lw, 8.5, '#ffffff', { align: 'left', glow: CY });
    if (delta) { c.fillStyle = 'rgba(40,255,140,.14)'; rr(c, lx, y0 + 20, lw * .78, 7, 1.4); c.fill(); c.fillStyle = GR; c.beginPath(); c.moveTo(lx + 2, y0 + 25.4); c.lineTo(lx + 3.8, y0 + 21.6); c.lineTo(lx + 5.6, y0 + 25.4); c.fill();
      A.txt(c, delta, lx + 7, y0 + 23.6, lw * .6, 4, '#b8ffd2', { align: 'left' }); }
    c.fillStyle = 'rgba(8,22,70,.75)'; rr(c, gx, gy, gw, gh, 1.6); c.fill();
    for (let k = 1; k < 4; k++) { c.fillStyle = 'rgba(150,220,255,.1)'; c.fillRect(gx + 1, gy + gh * k / 4, gw - 2, .3); }
    c.save(); rr(c, gx, gy, gw, gh, 1.6); c.clip();
    if (view === 'sales') {                                                                                       // стовпчики по днях: з'являються по черзі
      const days = NX.t('scene.analytics.days'), n = 7, bw = gw / n;
      DAYV.forEach((v, k) => { const f = Math.max(0, Math.min(1, grow * n - k)), h = (gh - 6) * v * (1 - Math.pow(1 - f, 2)), x = gx + bw * (k + .2), w = bw * .6, y = gy + gh - 4.5 - h, best = k === BEST && f > .9;
        if (h > .3) { const gg = c.createLinearGradient(0, y, 0, gy + gh - 4.5); gg.addColorStop(0, best ? '#ffe4fa' : '#e8feff'); gg.addColorStop(.25, best ? '#ff7ad0' : '#5ae8ff'); gg.addColorStop(1, best ? '#7a1a8a' : '#1a5ad0'); c.fillStyle = gg; c.fillRect(x, y, w, h); }
        if (best) { c.fillStyle = GO; star(c, x + w / 2, y - 2.4, 1.6); }
        if (Array.isArray(days)) A.txt(c, days[k], x + w / 2, gy + gh - 2, bw * .9, 2.6, k === BEST ? '#ffe4fa' : 'rgba(170,220,255,.75)'); });
    } else if (view === 'traffic') {                                                                              // карта: пінги частішають
      K.scrMap(c, gx + .5, gy + .5, gw - 1, gh - 1, t, { act: act ? 1 : 0, hot: ['kyiv', 'warsaw', 'amsterdam'] });
    } else {                                                                                                     // лінія виручки; прогноз — пунктир у майбутнє
      const fc = view === 'forecast', cut = fc ? .62 : 1, step = gw / 18, n0 = Math.floor(t * (act ? 1.6 : .7)), f0 = fc ? 0 : t * (act ? 1.6 : .7) - n0, Pn = [];
      for (let k = -1; k <= 19; k++) { const nn = (fc ? 0 : n0) + k, x = gx + (k - f0) * step, v = Math.max(.12, Math.min(.92, .42 + .2 * Math.sin(nn * .23) + .3 * (wave(nn, 5) - .5) + (fc ? k * .012 : 0))); Pn.push([x, gy + gh * (.9 - .74 * v)]); }
      const hist = Pn.filter(p => p[0] <= gx + gw * cut + step);
      c.beginPath(); c.moveTo(hist[0][0], gy + gh); hist.forEach(p => c.lineTo(p[0], p[1])); c.lineTo(hist[hist.length - 1][0], gy + gh); c.closePath();
      g = c.createLinearGradient(0, gy, 0, gy + gh); g.addColorStop(0, 'rgba(59,232,255,.38)'); g.addColorStop(1, 'rgba(59,232,255,0)'); c.fillStyle = g; c.fill();
      c.strokeStyle = '#9af6ff'; c.lineWidth = .7; c.beginPath(); hist.forEach((p, i) => i ? c.lineTo(p[0], p[1]) : c.moveTo(p[0], p[1])); c.stroke();
      if (fc) {                                                                                                  // пунктир прогнозу з «віялом» невизначеності
        const p0 = hist[hist.length - 1], xe = p0[0] + (gx + gw - 3 - p0[0]) * grow, ye = p0[1] - (gh * .34) * grow, sp = gh * .2 * grow;
        c.fillStyle = 'rgba(255,201,77,.14)'; c.beginPath(); c.moveTo(p0[0], p0[1]); c.lineTo(xe, ye - sp); c.lineTo(xe, ye + sp); c.closePath(); c.fill();
        c.strokeStyle = GO; c.lineWidth = .7; c.setLineDash([1.6, 1.2]); c.beginPath(); c.moveTo(p0[0], p0[1]); c.lineTo(xe, ye); c.stroke(); c.setLineDash([]);
        c.fillStyle = '#ffffff'; c.beginPath(); c.arc(xe, ye, 1, 0, 7); c.fill(); c.strokeStyle = GO; c.lineWidth = .4; c.beginPath(); c.arc(xe, ye, 1.9, 0, 7); c.stroke();
        c.fillStyle = 'rgba(255,255,255,.25)'; for (let y = gy + 2; y < gy + gh - 1; y += 2) c.fillRect(p0[0] - .15, y, .3, 1);
      } else {                                                                                                   // курсор з підказкою
        const cu = .35 + .4 * (.5 + .5 * Math.sin(t * .6)), cxp = gx + gw * cu, ki = Math.max(0, Math.min(Pn.length - 2, Math.floor((cxp - Pn[0][0]) / step))), q = (cxp - Pn[ki][0]) / step, cyp = Pn[ki][1] + (Pn[ki + 1][1] - Pn[ki][1]) * q;
        c.fillStyle = 'rgba(220,250,255,.4)'; for (let y = gy + 2; y < gy + gh - 1; y += 2) c.fillRect(cxp - .15, y, .3, 1);
        c.fillStyle = '#ffffff'; c.beginPath(); c.arc(cxp, cyp, 1, 0, 7); c.fill(); c.strokeStyle = CY; c.lineWidth = .4; c.beginPath(); c.arc(cxp, cyp, 1.8, 0, 7); c.stroke();
        const tw = gw * .24, th = gh * .17, tx2 = Math.min(gx + gw - tw - 1, cxp + 2.2), ty = Math.max(gy + 1, cyp - th - 2.2);
        c.fillStyle = 'rgba(16,48,140,.95)'; rr(c, tx2, ty, tw, th, .8); c.fill(); c.strokeStyle = 'rgba(160,240,255,.7)'; c.lineWidth = .3; rr(c, tx2, ty, tw, th, .8); c.stroke();
        A.txt(c, NX.num(28 + 44 * (1 - (cyp - gy) / gh), 1) + ' ' + t_('scene.unit.k'), tx2 + tw / 2, ty + th * .55, tw * .86, th * .58, '#e8feff');
      }
    }
    c.restore();
    // три показники внизу
    const ky = fh * .79, kh = fh * .15, kw = (fw - 12 - 6) / 3;
    kpi(c, 6, ky, kw, kh, 'user', t_('scene.analytics.visitors'), NX.num((12400 + t * (act ? 9 : 3)) / 1000, 1) + ' ' + t_('scene.unit.k'), CY, t, 1);
    kpi(c, 6 + kw + 3, ky, kw, kh, 'target', t_('scene.analytics.conv'), NX.num(3.4 + .4 * Math.sin(t * .5), 1) + '%', PK, t, 2);
    kpi(c, 6 + (kw + 3) * 2, ky, kw, kh, 'chart', t_('scene.analytics.sales'), '+' + NX.num(pct * .8, 1) + '%', GO, t, 3);
    // печатка «ЗВІТ ГОТОВИЙ ✓» (після задачі)
    const d = S.done || 0; if (d > 0) {
      const w = gw * .74, h = gh * .36, x = gx + (gw - w) / 2, y = gy + (gh - h) / 2, sc = .85 + .15 * Math.min(1, d * 4);
      c.save(); c.globalAlpha = Math.min(1, d * 3); c.translate(x + w / 2, y + h / 2); c.scale(sc, sc); c.translate(-(x + w / 2), -(y + h / 2));
      c.fillStyle = 'rgba(6,40,30,.94)'; rr(c, x, y, w, h, 2); c.fill(); c.strokeStyle = GR; c.lineWidth = .8; rr(c, x, y, w, h, 2); c.stroke();
      c.strokeStyle = GR; c.lineWidth = 1.2; c.lineCap = 'round'; c.beginPath(); c.moveTo(x + h * .35, y + h * .52); c.lineTo(x + h * .55, y + h * .72); c.lineTo(x + h * .9, y + h * .3); c.stroke();
      A.txt(c, t_('scene.analytics.ready'), x + h * 1.1 + (w - h * 1.2) / 2, y + h / 2, w - h * 1.25, h * .34, '#d0ffe4', { glow: GR });
      c.restore(); }
  }
  function star(c, x, y, r) { c.beginPath(); for (let k = 0; k < 10; k++) { const a = -Math.PI / 2 + k * Math.PI / 5, rr2 = k % 2 ? r * .45 : r; c.lineTo(x + Math.cos(a) * rr2, y + Math.sin(a) * rr2); } c.closePath(); c.fill(); }
  NX.arc.anScreen = anScreen;
  NX.arc.anWave = wave;
})();

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
 *   an_cap, an_bpL/R — шапка з вивіскою і стовпи (світлодіоди; внутрішні грані — світло)
 *   an_back    — «стіна даних»: сітка, тьмяна карта світу, сузір'я вузлів, рейка голо-проєкторів під панелями (живе —
 *                в objects/analytics.js: рейка «дихає», імпульси біжать щілинами між панелями)
 *   an_mug, an_puck — верх чашки (кава з сердечком) і лінза проєктора
 * Нові матеріали (NX.arc.kit.STY): chrome — хром (підставка для ніг), mug — світла кераміка.
 * Коли Nexi працює в зоні (NX.objects.analytics.active — наступний крок), дані біжать швидше. Написи — NX.t (4 мови).
 * ========================================================================== */
(() => {
  const A = NX.arc.kit, T = NX.arc.pt, PAINT = NX.arc.paint, LIVE = NX.arc.LIVE, hash = NX.art.hash, t_ = k => NX.t(k), K = NX.kit;
  const { glass, icon, rr, inset, bolt, led, vent, innerLight } = T;
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

  // ---------- РАМКА: шапка, стовпи ----------
  PAINT.an_cap = (c, fw, fh) => {
    [[.012, .052], [.948, .988]].forEach(([a, b]) => vent(c, fw * a, fh * .3, fw * (b - a), fh * .44, 4));
    [.065, .935].forEach((f, s) => { for (let k = 0; k < 3; k++) led(c, fw * f, fh * (.32 + k * .19), [GR, CY, PK][(k + s) % 3], .55); });
    [.03, .97].forEach(f => { bolt(c, fw * f, fh * .14); bolt(c, fw * f, fh * .86); });
  };
  LIVE.an_cap = { every: 4, draw(c, fw, fh, t) {
    [.065, .935].forEach((f, s) => { const k = Math.floor(t * (AN().active ? 6 : 3) + s * 2) % 3; led(c, fw * f, fh * (.32 + k * .19), '#ffffff', .55); });
  } };
  const pillar = (c, fw, fh) => { for (let k = 0; k < 15; k++) led(c, fw / 2, fh * (.04 + k * .045), k % 4 ? CY : VI, .5); bolt(c, fw / 2, fh * .015 + .9); };
  const inner = (c, fw, fh) => innerLight(c, fw, fh, '59,232,255', '#b8f8ff');
  PAINT.an_bpL = pillar; PAINT.an_bpL.sides = { right: inner };
  PAINT.an_bpR = (c, fw, fh) => pillar(c, fw, fh); PAINT.an_bpR.sides = { left: inner };
  const pillarLive = dir => ({ every: 4, draw(c, fw, fh, t) {
    const n = 15, on = ((Math.floor(t * 9) * -dir) % n + n) % n;
    c.save(); c.globalCompositeOperation = 'lighter';
    for (let k = 0; k < n; k++) { const d = (k - on + n) % n, a = dir > 0 ? [1, .55, .25][d] : [1, .55, .25][(n - d) % n]; if (!a) continue;
      c.fillStyle = k % 4 ? `rgba(160,250,255,${a})` : `rgba(200,180,255,${a})`; c.beginPath(); c.arc(fw / 2, fh * (.04 + k * .045), .85, 0, 7); c.fill(); }
    c.restore();
  } });
  LIVE.an_bpL = pillarLive(1); LIVE.an_bpR = pillarLive(-1);
  LIVE.an_sign = NX.arc.glint(7.4, 2.1);

  // ---------- «СТІНА ДАНИХ» за панелями ----------
  const BK = { X0: 306, W: 186, Y0: 114, H: 226 }, BU = X => (X - BK.X0) / BK.W, BV = Y => (Y - BK.Y0) / BK.H;   // частки грані з px картинки
  const EMIT = BV(256);                                                                                            // рейка голо-проєкторів (під панелями)
  PAINT.an_back = (c, fw, fh) => {
    const g = c.createLinearGradient(0, 0, 0, fh); g.addColorStop(0, '#060c2e'); g.addColorStop(.6, '#081a46'); g.addColorStop(1, '#040822'); c.fillStyle = g; c.fillRect(0, 0, fw, fh);
    c.strokeStyle = 'rgba(70,170,255,.14)'; c.lineWidth = .3; for (let x = 4; x < fw; x += 6) { c.beginPath(); c.moveTo(x, 0); c.lineTo(x, fh); c.stroke(); } for (let y = 4; y < fh; y += 6) { c.beginPath(); c.moveTo(0, y); c.lineTo(fw, y); c.stroke(); }
    c.save(); c.globalAlpha = .45; K.scrMap(c, fw * .06, fh * .1, fw * .88, fh * .44, 1.7, { hot: ['kyiv', 'warsaw', 'amsterdam'] }); c.restore();   // тьмяна карта світу
    for (let k = 0; k < 26; k++) { const x = fw * hash(k, 3), y = fh * (.04 + .55 * hash(k, 7)); c.fillStyle = k % 5 ? 'rgba(150,230,255,.5)' : 'rgba(255,170,240,.6)'; c.fillRect(x - .5, y - .5, 1, 1); }   // сузір'я вузлів
    const ey = fh * EMIT; c.fillStyle = '#05030f'; c.fillRect(fw * .02, ey - 1.6, fw * .96, 3.2);                          // рейка голо-проєкторів
    A.neon(c, fw * .03, ey, fw * .97, ey, CY, .8);
    [[BU(312), BU(395)], [BU(403), BU(486)]].forEach(([a, b]) => { for (let k = 0; k < 6; k++) { const x = fw * (a + (b - a) * (k + .5) / 6); c.fillStyle = '#bff8ff'; c.fillRect(x - .5, ey - .5, 1, 1); }
      const g2 = c.createLinearGradient(0, ey, 0, ey - fh * .1); g2.addColorStop(0, 'rgba(59,232,255,.28)'); g2.addColorStop(1, 'rgba(59,232,255,0)'); c.fillStyle = g2; c.fillRect(fw * a, ey - fh * .1, fw * (b - a), fh * .1); });
    for (let y = ey + 4; y < fh; y += 5) { c.fillStyle = 'rgba(80,120,220,.16)'; c.fillRect(fw * .05, y, fw * .9, .4); }   // ґратка під рейкою (за столом)
  };
  // Стіна живе — дешево, поверх (objects/analytics.js: рейка «дихає», імпульси в щілинах між панелями): велика жива грань
  // за панелями коштувала кадрів, а її однаково майже не видно.

  // ---------- ВМІСТ ГОЛО-ПАНЕЛЕЙ (objects/analytics.js -> NX.arc.holo.pane) ----------
  /** Пласка голо-панель без рамки: напівпрозорий перелив, кутики, шапка з назвою й іконкою, ● НАЖИВО. */
  function paneBase(c, fw, fh, title, ic, t) {
    const g = c.createLinearGradient(0, 0, 0, fh); g.addColorStop(0, 'rgba(40,120,240,.5)'); g.addColorStop(.5, 'rgba(20,70,190,.38)'); g.addColorStop(1, 'rgba(30,60,200,.46)'); c.fillStyle = g; c.fillRect(0, 0, fw, fh);
    c.fillStyle = 'rgba(190,245,255,.9)'; const L = Math.min(fw, fh) * .08;
    [[0, 0, 1, 1], [fw, 0, -1, 1], [0, fh, 1, -1], [fw, fh, -1, -1]].forEach(([x, y, sx, sy]) => { c.fillRect(x + sx * 1 - (sx < 0 ? .6 : 0), y + sy * 1 - (sy < 0 ? L : 0), .6, L); c.fillRect(x + sx * 1 - (sx < 0 ? L : 0), y + sy * 1 - (sy < 0 ? .6 : 0), L, .6); });   // кутики
    A.txt(c, title, fw * .52, fh * .065, fw * .62, fh * .04, '#e8feff', { glow: CY });
    icon(c, ic, fw * .89, fh * .065, fh * .045, 'rgba(190,240,255,.9)');
    c.fillStyle = Math.sin(t * 5) > 0 ? '#ff4f6a' : '#7a1a2a'; c.beginPath(); c.arc(fw * .1, fh * .065, fh * .013, 0, 7); c.fill();
    c.fillStyle = 'rgba(150,230,255,.45)'; c.fillRect(fw * .06, fh * .115, fw * .88, .35);
  }
  /** Скан-смуга й відблиск по склу (у полотні панелі). */
  function sheen(c, fw, fh, t, seed) {
    c.save(); c.globalCompositeOperation = 'lighter';
    const ry = (((t + seed) * .11) % 1.3 - .15) * fh, g = c.createLinearGradient(0, ry - fh * .06, 0, ry + fh * .06);
    g.addColorStop(0, 'rgba(150,230,255,0)'); g.addColorStop(.5, 'rgba(150,230,255,.1)'); g.addColorStop(1, 'rgba(150,230,255,0)'); c.fillStyle = g; c.fillRect(0, ry - fh * .06, fw, fh * .12);
    const sk = ((t + seed * 2) % 8.3) / 1.3; if (sk < 1) { const x = -fw * .3 + sk * fw * 1.6, g2 = c.createLinearGradient(x - fw * .14, 0, x + fw * .14, 0);
      g2.addColorStop(0, 'rgba(255,255,255,0)'); g2.addColorStop(.5, 'rgba(220,245,255,.14)'); g2.addColorStop(1, 'rgba(255,255,255,0)'); c.fillStyle = g2;
      c.beginPath(); c.moveTo(x - fw * .06, 0); c.lineTo(x + fw * .14, 0); c.lineTo(x + fw * .02, fh); c.lineTo(x - fw * .18, fh); c.closePath(); c.fill(); }
    c.restore();
  }
  const RR = (f, fw, fh) => [f[0] * fw, f[1] * fh, f[2] * fw, f[3] * fh];
  const DAYV = [.52, .64, .58, .74, .5, .34, .3], TODAY = 4;
  const LANG = [['UA', .38, CY], ['PL', .27, PK], ['NL', .2, VI], ['EN', .15, GO]];
  const PANEL = { r: .8, a: 'rgba(18,58,154,.7)', b: 'rgba(12,42,122,.7)', c: 'rgba(8,30,94,.7)', lw: .45 };
  /** ВІДВІДУВАЧІ: лічильник за сьогодні з міні-графіком, стовпчики по днях (сьогоднішній росте), частки мов, «пульс» сайту. */
  function visitors(c, fw, fh, t) {
    const act = AN().active; paneBase(c, fw, fh, t_('scene.analytics.visitors'), 'user', t);
    const [cx, cy, cw, ch] = RR([.07, .15, .86, .14], fw, fh); glass(c, cx, cy, cw, ch, PANEL);
    A.txt(c, t_('scene.analytics.today'), cx + cw * .05, cy + ch * .25, cw * .5, ch * .2, 'rgba(200,240,255,.85)', { align: 'left' });
    A.txt(c, NX.num((12400 + t * (act ? 9 : 3.2)) / 1000, 1) + ' ' + t_('scene.unit.k'), cx + cw * .05, cy + ch * .66, cw * .6, ch * .34, '#e8feff', { align: 'left' });
    for (let k = 0; k < 9; k++) { const h = ch * .36 * (.3 + .7 * wave(Math.floor(t * 2) + k, 2)); c.fillStyle = k === 8 ? '#ffffff' : 'rgba(59,232,255,.8)'; c.fillRect(cx + cw * (.66 + k * .034), cy + ch * .88 - h, cw * .022, h); }
    const [bx, by, bw, bh] = RR([.09, .36, .82, .32], fw, fh), grow = (t * (act ? .5 : .16)) % 1;
    glass(c, bx - fw * .02, by - fh * .03, bw + fw * .04, bh + fh * .09, PANEL);
    for (let k = 1; k < 4; k++) { c.fillStyle = 'rgba(150,220,255,.13)'; c.fillRect(bx, by + bh * k / 4, bw, .3); }
    DAYV.forEach((dv, k) => {
      const today = k === TODAY, h = bh * (today ? .2 + .78 * (1 - Math.pow(1 - grow, 2)) : dv * (.96 + .04 * Math.sin(t * 1.5 + k))), x = bx + bw * (k + .16) / 7, w = bw / 7 * .68, y = by + bh - h;
      const g = c.createLinearGradient(0, y, 0, by + bh); g.addColorStop(0, today ? '#ffe4fa' : '#e8feff'); g.addColorStop(.2, today ? '#ff7ad0' : '#5ae8ff'); g.addColorStop(1, today ? '#7a1a8a' : '#1a5ad0');
      c.fillStyle = g; c.fillRect(x, y, w, h); c.fillStyle = 'rgba(255,255,255,.45)'; c.fillRect(x, y, w, Math.min(.7, h));
      if (today) { c.save(); c.globalCompositeOperation = 'lighter'; c.fillStyle = `rgba(255,120,230,${.2 + .25 * Math.sin(t * 6)})`; c.fillRect(x - .5, y - .5, w + 1, h + .5); c.restore(); }
    });
    c.fillStyle = 'rgba(120,230,255,.6)'; c.fillRect(bx, by + bh, bw, .45);
    const days = NX.t('scene.analytics.days'); (Array.isArray(days) ? days : []).forEach((d, k) => A.txt(c, d, bx + bw * (k + .5) / 7, by + bh + fh * .028, bw / 7 * .92, fh * .022, k === TODAY ? '#ffe4fa' : 'rgba(170,220,255,.75)'));
    const [lx, ly, lw, lh] = RR([.07, .76, .86, .07], fw, fh); let x = lx;
    LANG.forEach(([code, v, col]) => { const w = lw * v; c.fillStyle = col; rr(c, x + .3, ly + lh * .58, w - .6, lh * .34, .3); c.fill(); A.txt(c, code, x + w / 2, ly + lh * .22, w * .9, lh * .38, 'rgba(225,245,255,.9)'); x += w; });
    const py = fh * .9, ph = fh * .06; c.strokeStyle = 'rgba(255,140,220,.85)'; c.lineWidth = .6; c.beginPath();                    // «пульс» сайту
    for (let i = 0; i <= 40; i++) { const xx = fw * (.07 + .86 * i / 40), q = ((i / 40) * 3 - t * (act ? 1.6 : .8)) % 1, beat = q < 0 ? q + 1 : q, v = beat < .08 ? Math.sin(beat / .08 * Math.PI) * (beat < .04 ? 1 : -.5) : 0;
      i ? c.lineTo(xx, py - v * ph) : c.moveTo(xx, py - v * ph); } c.stroke();
    sheen(c, fw, fh, t, 0);
  }
  /** ВИРУЧКА: тренд (лінія з заливкою біжить, курсор із підказкою), ▲ відсоток, «пончик» КОНВЕРСІЯ з легендою, ціль місяця. */
  function revenue(c, fw, fh, t) {
    const act = AN().active, sp = act ? 3.2 : 1.1; paneBase(c, fw, fh, t_('scene.analytics.revenue'), 'chart', t);
    const [gx, gy, gw, gh] = RR([.07, .16, .86, .34], fw, fh); glass(c, gx, gy, gw, gh, PANEL);
    for (let k = 1; k < 4; k++) { c.fillStyle = 'rgba(150,220,255,.12)'; c.fillRect(gx + 1, gy + gh * k / 4, gw - 2, .3); }
    const step = gw / 14, n0 = Math.floor(t * sp), f = t * sp - n0, P = [];
    for (let k = -1; k <= 15; k++) { const n = n0 + k, x = gx + (k - f) * step, v = Math.max(.12, Math.min(.94, .5 + .24 * Math.sin(n * .11) + .34 * (wave(n, 5) - .5))); P.push([x, gy + gh * (.92 - .74 * v)]); }
    c.save(); c.beginPath(); c.rect(gx + 1, gy + 1, gw - 2, gh - 2); c.clip();
    c.beginPath(); c.moveTo(P[0][0], gy + gh); P.forEach(p => c.lineTo(p[0], p[1])); c.lineTo(P[P.length - 1][0], gy + gh); c.closePath();
    const g = c.createLinearGradient(0, gy, 0, gy + gh); g.addColorStop(0, 'rgba(255,90,220,.42)'); g.addColorStop(1, 'rgba(255,90,220,0)'); c.fillStyle = g; c.fill();
    c.strokeStyle = '#ff9af0'; c.lineWidth = .7; c.beginPath(); P.forEach((p, i) => i ? c.lineTo(p[0], p[1]) : c.moveTo(p[0], p[1])); c.stroke();
    const cu = .3 + .45 * (.5 + .5 * Math.sin(t * .7)), cxp = gx + gw * cu, ki = Math.max(0, Math.min(P.length - 2, Math.floor((cxp - P[0][0]) / step))), q = (cxp - P[ki][0]) / step, cyp = P[ki][1] + (P[ki + 1][1] - P[ki][1]) * q;
    c.fillStyle = 'rgba(220,250,255,.5)'; for (let y = gy + 2; y < gy + gh - 1; y += 2) c.fillRect(cxp - .15, y, .3, 1);
    c.fillStyle = '#ffffff'; c.beginPath(); c.arc(cxp, cyp, 1.1, 0, 7); c.fill(); c.strokeStyle = PK; c.lineWidth = .4; c.beginPath(); c.arc(cxp, cyp, 1.9, 0, 7); c.stroke();
    const tw = gw * .36, th = gh * .17, tx = Math.min(gx + gw - tw - 1, cxp + 2.2), ty = Math.max(gy + 1, cyp - th - 2.2);
    c.fillStyle = 'rgba(20,56,160,.95)'; rr(c, tx, ty, tw, th, .6); c.fill(); c.strokeStyle = 'rgba(160,240,255,.8)'; c.lineWidth = .3; rr(c, tx, ty, tw, th, .6); c.stroke();
    A.txt(c, NX.num(28 + 44 * (1 - (cyp - gy) / gh), 1) + ' ' + t_('scene.unit.k'), tx + tw / 2, ty + th * .55, tw * .86, th * .6, '#e8feff');
    c.restore();
    const pct = 18 + 4 * Math.sin(t * .4); c.fillStyle = GR; c.beginPath(); c.moveTo(gx + gw * .05, gy + gh * .16); c.lineTo(gx + gw * .09, gy + gh * .04); c.lineTo(gx + gw * .13, gy + gh * .16); c.fill();
    A.txt(c, '+' + NX.num(pct, 1) + '%', gx + gw * .15, gy + gh * .1, gw * .34, gh * .1, '#b8ffd2', { align: 'left' });
    const [vx, vy, vw, vh] = RR([.07, .55, .86, .27], fw, fh); glass(c, vx, vy, vw, vh, PANEL);                     // конверсія
    A.txt(c, t_('scene.analytics.conv'), vx + vw * .66, vy + vh * .15, vw * .58, vh * .11, '#e8feff', { glow: CY });
    const dcx = vx + vw * .22, dcy = vy + vh * .57, r = Math.min(vw * .17, vh * .34), conv = 3.4 + .4 * Math.sin(t * .5);
    c.fillStyle = 'rgba(10,28,90,.96)'; c.beginPath(); c.arc(dcx, dcy, r * 1.08, 0, 7); c.fill();
    let a = -Math.PI / 2 + t * .25; [[44, CY], [33, PK], [23, VI]].forEach(([v2, col], k) => { const b = a + v2 / 100 * Math.PI * 2 * (.97 + .03 * Math.sin(t * 2 + k)); c.strokeStyle = col; c.lineWidth = r * .38; c.beginPath(); c.arc(dcx, dcy, r * .78, a + .05, b - .05); c.stroke(); a = b; });
    c.fillStyle = '#0a1a50'; c.beginPath(); c.arc(dcx, dcy, r * .56, 0, 7); c.fill(); A.txt(c, NX.num(conv, 1) + '%', dcx, dcy, r * 1.05, r * .36, '#e8feff');
    [['UA', CY, .44], ['PL', PK, .33], ['NL', VI, .23]].forEach(([s, col, v2], k) => { const y = vy + vh * (.38 + k * .19), lw = vw * .3;
      c.fillStyle = col; c.fillRect(vx + vw * .44, y - .7, 1.6, 1.4); A.txt(c, s, vx + vw * .5, y, vw * .1, vh * .1, 'rgba(210,240,255,.85)', { align: 'left' });
      c.fillStyle = 'rgba(8,24,80,.95)'; c.fillRect(vx + vw * .62, y - .7, lw, 1.4); c.fillStyle = col; c.fillRect(vx + vw * .62, y - .7, lw * v2 * (1.6 + .15 * Math.sin(t * 1.3 + k)), 1.4); });
    const gy2 = fh * .88, gl = fw * .8, done = .62 + .25 * ((t * (act ? .05 : .012)) % 1);                       // ціль місяця: смуга з бігунцем
    c.fillStyle = 'rgba(8,24,80,.9)'; rr(c, fw * .1, gy2, gl, fh * .025, .6); c.fill();
    const g3 = c.createLinearGradient(fw * .1, 0, fw * .1 + gl, 0); g3.addColorStop(0, '#3be8ff'); g3.addColorStop(1, '#ff4fd8'); c.fillStyle = g3; rr(c, fw * .1, gy2, gl * done, fh * .025, .6); c.fill();
    c.fillStyle = '#ffffff'; c.fillRect(fw * .1 + gl * done - .5, gy2 - .8, 1, fh * .025 + 1.6); icon(c, 'target', fw * .1 + gl + 2.4, gy2 + fh * .012, fh * .03, GO);
    sheen(c, fw, fh, t, 3.3);
  }
  NX.arc.anPane = (kind, c, fw, fh, t) => (kind === 'revenue' ? revenue : visitors)(c, fw, fh, t);
  NX.arc.anWave = wave;
})();

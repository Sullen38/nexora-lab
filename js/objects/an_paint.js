/* ============================================================================
 * objects/an_paint.js — АНАЛІТИКА: МАЛЮНКИ ГРАНЕЙ І ЖИВІ ЕКРАНИ
 * ----------------------------------------------------------------------------
 * Розкладка частин — tools/wingbox/gen_room.py: analytics() (id an_*). Тут — як виглядають їхні грані (NX.arc.paint[id], пласкі
 * текстури: рушій кладе їх у перспективу) і що на них живе (NX.arc.LIVE[id] — лише те, що рухається). Крок 5 (29.10): лише стіл
 * і екрани («спершу лише столи й екрани, без дрібних елементів»); крісло, ноутбук і Nexi за роботою — наступним кроком.
 *   an_desk    — стіл: блакитна неонова кромка, тумби з шухлядами на обох кінцях, посередині — утоплена панель з голо-стрічкою
 *                ПРОДАЖІ (графік біжить, ▲ відсоток) і ґраткою, що «дихає»
 *   an_cap     — шапка рамки (вивіска — an_sign, arc_paint.js): ґратки й світлодіоди обабіч вивіски
 *   an_bpL/R   — стовпи рамки: колонка світлодіодів (вогник біжить), внутрішні грані — блакитне світло; an_mid — між екранами
 *   an_bb      — нижня полиця рамки (над столом видно смужку зі світлодіодами)
 *   an_scrL    — голо-екран ВІДВІДУВАЧІ: лічильник за сьогодні, стовпчики по днях тижня (сьогоднішній росте), частки мов
 *   an_scrR    — голо-екран ВИРУЧКА: тренд (лінія з заливкою біжить, курсор із підказкою), «пончик» КОНВЕРСІЯ з легендою
 * Поверх обох екранів — скан-лінія CRT, відблиск по склу й зрідка короткий глітч (як у маркетингу, але спокійніше).
 * Коли Nexi працює в зоні (живий об'єкт аналітики — наступний крок: NX.objects.analytics.active), дані біжать швидше.
 * Усі написи — NX.t (4 мови), числа — NX.num (десятковий знак мови).
 * ========================================================================== */
(() => {
  const A = NX.arc.kit, T = NX.arc.pt, PAINT = NX.arc.paint, LIVE = NX.arc.LIVE, hash = NX.art.hash, t_ = k => NX.t(k);
  const { glass, icon, rr, drawer, inset, bolt, led, vent, innerLight } = T;
  const AN = () => NX.objects.analytics || {};                                                              // живий об'єкт зони (наступний крок)
  const DESK_X0 = 240, DESK_W = 318, U = X => (X - DESK_X0) / DESK_W;                                       // частка ширини стола з px картинки
  const CY = '#3be8ff', PK = '#ff4fd8', GR = '#3bff8a', GO = '#ffd27a';
  const PANEL = { r: .8, a: '#123a9a', b: '#0c2a7a', c: '#081e5e', lw: .45 };
  /** Плавний «шум» ряду даних: сума синусоїд + трохи випадковості (n — номер точки). */
  const wave = (n, s = 0) => .5 + .22 * Math.sin(n * .55 + s) + .14 * Math.sin(n * 1.37 + 1 + s * 2) + .08 * (hash(n, 3 + s) - .5);

  // ---------- СТІЛ ----------
  /** Фасад стола: блакитна неонова кромка з глянцевою губою, тумби з шухлядами на обох кінцях (ручки, LED), посередині —
   *  утоплена панель: голо-стрічка ПРОДАЖІ (графік — живе) і ґратка-еквалайзер. Світлої смуги знизу немає (як у маркетингу). */
  PAINT.an_desk = (c, fw, fh) => {
    c.fillStyle = 'rgba(200,250,255,.22)'; c.fillRect(0, 0, fw, fh * .035); A.neon(c, 0, fh * .07, fw, fh * .07, CY, 1.5);
    c.fillStyle = 'rgba(0,0,0,.4)'; c.fillRect(0, fh * .11, fw, fh * .025);
    [[249, 303], [495, 549]].forEach(([a, b], s) => {                                                             // тумби з шухлядами
      const x = fw * U(a), w = fw * (U(b) - U(a)); inset(c, x - 1, fh * .16, w + 2, fh * .76, 'rgba(4,2,14,.65)');
      for (let k = 0; k < 3; k++) drawer(c, x, fh * (.18 + k * .245), w, fh * .225, { led: k === 0 ? (s ? PK : GR) : null, a: '#24205e', b: '#141040' });
    });
    const x0 = fw * U(315), x1 = fw * U(483), w = x1 - x0; inset(c, x0, fh * .2, w, fh * .66, 'rgba(4,2,16,.75)', 1.2);   // середня панель
    glass(c, x0 + 2, fh * .25, w - 4, fh * .3, { r: .8, a: '#123a9a', b: '#0c2a7a', c: '#081e5e', lw: .5 });
    for (let k = 0; k < 15; k++) { const x = x0 + 3 + k * (w - 6) / 14; c.fillStyle = '#03020a'; c.fillRect(x - .55, fh * .62, 1.1, fh * .18); c.fillStyle = 'rgba(59,232,255,.3)'; c.fillRect(x - .25, fh * .64, .5, fh * .14); }   // ґратка
    [x0 + 1.6, x1 - 1.6].forEach(x => { bolt(c, x, fh * .24); bolt(c, x, fh * .82); });
  };
  /** Живе на столі: голо-стрічка ПРОДАЖІ — графік біжить ліворуч, крапка на кінці, ▲ відсоток; ґратка «дихає» еквалайзером. */
  LIVE.an_desk = { every: 3, draw(c, fw, fh, t) {
    const x0 = fw * U(315) + 2, x1 = fw * U(483) - 2, w = x1 - x0, y = fh * .25, h = fh * .3, sp = AN().active ? 4 : 1.6;
    glass(c, x0, y, w, h, { r: .8, a: '#123a9a', b: '#0c2a7a', c: '#081e5e', lw: .5 });
    A.txt(c, t_('scene.analytics.sales'), x0 + 1.4, y + h * .27, w * .32, h * .3, '#bff8ff', { align: 'left' });
    const gx0 = x0 + w * .02, gx1 = x0 + w * .7, step = 2.4, n0 = Math.floor(t * sp), f = t * sp - n0, pts = [];
    for (let k = 0; ; k++) { const x = gx1 - (k - f) * step; if (x < gx0 - step) break; pts.push([Math.max(gx0, Math.min(gx1, x)), y + h * (.92 - .55 * wave(n0 - k, 1))]); }
    c.save(); c.beginPath(); c.rect(gx0, y + h * .45, gx1 - gx0, h * .55); c.clip();
    c.beginPath(); c.moveTo(pts[0][0], y + h); pts.forEach(p => c.lineTo(p[0], p[1] + h * .28)); c.lineTo(pts[pts.length - 1][0], y + h); c.closePath(); c.fillStyle = 'rgba(59,232,255,.18)'; c.fill();
    c.strokeStyle = '#7af4ff'; c.lineWidth = .55; c.beginPath(); pts.forEach((p, i) => i ? c.lineTo(p[0], p[1] + h * .28) : c.moveTo(p[0], p[1] + h * .28)); c.stroke(); c.restore();
    c.fillStyle = '#ffffff'; c.fillRect(pts[0][0] - .6, pts[0][1] + h * .28 - .6, 1.2, 1.2);
    const pct = 12 + 6 * wave(n0, 4); c.fillStyle = GR; c.beginPath(); c.moveTo(x0 + w * .74, y + h * .66); c.lineTo(x0 + w * .775, y + h * .36); c.lineTo(x0 + w * .81, y + h * .66); c.fill();   // ▲
    A.txt(c, '+' + NX.num(pct, 1) + '%', x0 + w * .825, y + h * .52, w * .155, h * .36, '#b8ffd2', { align: 'left' });
    const x0g = fw * U(315), wg = fw * U(483) - x0g; c.save(); c.globalCompositeOperation = 'lighter';
    for (let k = 0; k < 15; k++) { const v = .35 + .65 * Math.abs(Math.sin(t * (2.2 + k * .13) + k)); c.fillStyle = `rgba(59,232,255,${v * .5})`; c.fillRect(x0g + 3 + k * (wg - 6) / 14 - .25, fh * (.64 + .14 * (1 - v)), .5, fh * .14 * v); }
    c.restore();
  } };

  // ---------- РАМКА: шапка, стовпи, стовпчик, полиця ----------
  /** Шапка рамки (посередині — вивіска an_sign): ґратки й світлодіоди на краях, заклепки. */
  PAINT.an_cap = (c, fw, fh) => {
    [[.012, .052], [.948, .988]].forEach(([a, b]) => vent(c, fw * a, fh * .3, fw * (b - a), fh * .44, 4));
    [.065, .935].forEach((f, s) => { for (let k = 0; k < 3; k++) led(c, fw * f, fh * (.32 + k * .19), [GR, CY, PK][(k + s) % 3], .55); });
    [.03, .97].forEach(f => { bolt(c, fw * f, fh * .14); bolt(c, fw * f, fh * .86); });
  };
  /** Шапка живе: світлодіоди обабіч вивіски перемигуються («йдуть дані»). */
  LIVE.an_cap = { every: 4, draw(c, fw, fh, t) {
    [.065, .935].forEach((f, s) => { const k = Math.floor(t * (AN().active ? 6 : 3) + s * 2) % 3; led(c, fw * f, fh * (.32 + k * .19), '#ffffff', .55); });
  } };
  /** Стовп рамки спереду: колонка світлодіодів, заклепки, ґратка внизу (за столом її не видно — лише верх). */
  const pillar = (c, fw, fh) => { for (let k = 0; k < 9; k++) led(c, fw / 2, fh * (.05 + k * .045), k % 4 ? CY : PK, .5); bolt(c, fw / 2, fh * .015 + .9); };
  const inner = (c, fw, fh) => innerLight(c, fw, fh, '59,232,255', '#b8f8ff');
  PAINT.an_bpL = pillar; PAINT.an_bpL.sides = { right: inner };
  PAINT.an_bpR = (c, fw, fh) => pillar(c, fw, fh); PAINT.an_bpR.sides = { left: inner };
  PAINT.an_mid = (c, fw, fh) => { for (let k = 0; k < 6; k++) led(c, fw / 2, fh * (.1 + k * .16), k % 2 ? CY : '#9a8cff', .45); };
  PAINT.an_mid.sides = { left: inner, right: inner };
  /** Стовпи живуть: вогник біжить колоною світлодіодів (лівий угору, правий униз), за ним хвіст. */
  const pillarLive = dir => ({ every: 4, draw(c, fw, fh, t) {
    const n = 9, on = ((Math.floor(t * 8) * -dir) % n + n) % n;
    c.save(); c.globalCompositeOperation = 'lighter';
    for (let k = 0; k < n; k++) { const d = (k - on + n) % n, a = dir > 0 ? [1, .55, .25][d] : [1, .55, .25][(n - d) % n]; if (!a) continue;
      c.fillStyle = k % 4 ? `rgba(160,250,255,${a})` : `rgba(255,170,240,${a})`; c.beginPath(); c.arc(fw / 2, fh * (.05 + k * .045), .85, 0, 7); c.fill(); }
    c.restore();
  } });
  LIVE.an_bpL = pillarLive(1); LIVE.an_bpR = pillarLive(-1);
  /** Нижня полиця: над столом видно смужку — неонова кромка й ряд світлодіодів; верх світиться. */
  PAINT.an_bb = (c, fw, fh) => { A.neon(c, fw * .02, fh * .04, fw * .98, fh * .04, CY, 1); for (let k = 0; k < 12; k++) led(c, fw * (.08 + k * .076), fh * .16, k % 5 === 2 ? PK : '#1a8ab0', .45); };
  PAINT.an_bb.sides = { top: (c, fw, fh) => { c.fillStyle = 'rgba(59,232,255,.22)'; c.fillRect(0, 0, fw, fh * .35); } };
  LIVE.an_sign = NX.arc.glint(7.4, 2.1);                                                                   // відблиск по вивісці (не разом з маркетингом)

  // ---------- ГОЛО-ЕКРАНИ ----------
  /** Основа екрана: темна рамка, скло, шапка з назвою, ● НАЖИВО / іконка праворуч (нерухоме; вміст — живий). */
  function screenBase(c, fw, fh, title, ic) {
    c.fillStyle = '#040a2a'; c.fillRect(0, 0, fw, fh);
    glass(c, .8, .8, fw - 1.6, fh - 1.6, { r: 1.6, a: '#0f3a9e', b: '#0a2676', c: '#061a52', line: CY, lw: .8 });
    A.txt(c, title, fw * .5, fh * .085, fw * .62, fh * .05, '#e8feff', { glow: CY });
    c.fillStyle = 'rgba(150,230,255,.4)'; c.fillRect(fw * .06, fh * .15, fw * .88, .35);
    icon(c, ic, fw * .9, fh * .085, fh * .055, 'rgba(190,240,255,.85)');
    c.fillStyle = '#ff3b5c'; c.beginPath(); c.arc(fw * .09, fh * .085, fh * .016, 0, 7); c.fill();
  }
  /** Поверх екрана: блимає ●, смуга CRT, відблиск по склу, пульс рамки, зрідка — коротке мерехтіння й глітч. */
  function fx(c, fw, fh, t, seed) {
    if (Math.sin(t * 5 + seed) > 0) { c.fillStyle = '#ffd0da'; c.beginPath(); c.arc(fw * .09, fh * .085, fh * .01, 0, 7); c.fill(); }
    c.save(); c.globalCompositeOperation = 'lighter';
    const ry = (((t + seed) * .12) % 1.3 - .15) * fh, g = c.createLinearGradient(0, ry - fh * .08, 0, ry + fh * .08);
    g.addColorStop(0, 'rgba(150,230,255,0)'); g.addColorStop(.5, 'rgba(150,230,255,.08)'); g.addColorStop(1, 'rgba(150,230,255,0)'); c.fillStyle = g; c.fillRect(0, ry - fh * .08, fw, fh * .16);
    const sk = ((t + seed * 2) % 7.1) / 1.2; if (sk < 1) { const x = -fw * .3 + sk * fw * 1.6, g2 = c.createLinearGradient(x - fw * .12, 0, x + fw * .12, 0);
      g2.addColorStop(0, 'rgba(255,255,255,0)'); g2.addColorStop(.5, 'rgba(220,245,255,.13)'); g2.addColorStop(1, 'rgba(255,255,255,0)'); c.fillStyle = g2;
      c.beginPath(); c.moveTo(x - fw * .06, 0); c.lineTo(x + fw * .12, 0); c.lineTo(x + fw * .02, fh); c.lineTo(x - fw * .16, fh); c.closePath(); c.fill(); }
    c.strokeStyle = `rgba(120,240,255,${.18 + .2 * Math.sin(t * 2 + seed)})`; c.lineWidth = .8; c.strokeRect(1.3, 1.3, fw - 2.6, fh - 2.6);
    c.restore();
    const burst = ((t + seed * 3) % 9.7) < .4, f8 = Math.floor(t * 9);
    if (burst && hash(Math.floor(t * 14), 3 + seed) > .4) { c.fillStyle = 'rgba(4,8,30,.22)'; c.fillRect(0, 0, fw, fh); }
    if (burst || hash(f8, 17 + seed) > .965) {
      for (let b = 0; b < (burst ? 2 : 1); b++) { const y = fh * (.15 + .75 * hash(f8 + b * 13, 5 + seed)), h = fh * (.015 + .03 * hash(b, f8)), dx = (hash(b * 3, f8) - .5) * fw * .05;
        c.fillStyle = 'rgba(255,80,220,.38)'; c.fillRect(dx - .7, y, fw, h * .5); c.fillStyle = 'rgba(80,230,255,.38)'; c.fillRect(dx + .7, y + h * .5, fw, h * .5); }
    }
  }

  // ВІДВІДУВАЧІ: лічильник за сьогодні, стовпчики по днях (сьогодні — ПТ, росте), частки мов
  const L1 = { cnt: [.06, .19, .88, .17], bars: [.08, .42, .84, .33], lang: [.06, .86, .88, .09] };   // частки грані: x, y, w, h
  const RR = (f, fw, fh) => [f[0] * fw, f[1] * fh, f[2] * fw, f[3] * fh];
  const DAYV = [.52, .64, .58, .74, .5, .34, .3], TODAY = 4;                                                    // дні тижня (ПТ — сьогодні)
  const LANG = [['UA', .38, CY], ['PL', .27, PK], ['NL', .2, '#9a8cff'], ['EN', .15, GO]];
  PAINT.an_scrL = (c, fw, fh) => {
    screenBase(c, fw, fh, t_('scene.analytics.visitors'), 'user');
    const [cx, cy, cw, ch] = RR(L1.cnt, fw, fh); glass(c, cx, cy, cw, ch, PANEL);
    A.txt(c, t_('scene.analytics.today'), cx + cw * .05, cy + ch * .28, cw * .5, ch * .22, 'rgba(200,240,255,.85)', { align: 'left' });
    const [bx, by, bw, bh] = RR(L1.bars, fw, fh); glass(c, bx - fw * .02, by - fh * .05, bw + fw * .04, bh + fh * .14, PANEL);
    for (let k = 1; k < 4; k++) { c.fillStyle = 'rgba(150,220,255,.13)'; c.fillRect(bx, by + bh * k / 4, bw, .3); }   // сітка
    const days = NX.t('scene.analytics.days'); (Array.isArray(days) ? days : []).forEach((d, k) => A.txt(c, d, bx + bw * (k + .5) / 7, by + bh + fh * .045, bw / 7 * .9, fh * .03, k === TODAY ? '#e8feff' : 'rgba(170,220,255,.7)'));
    const [lx, ly, lw, lh] = RR(L1.lang, fw, fh); let x = lx;
    LANG.forEach(([code, v, col]) => { const w = lw * v; c.fillStyle = col; rr(c, x + .3, ly + lh * .55, w - .6, lh * .35, .3); c.fill(); A.txt(c, code, x + w / 2, ly + lh * .2, w * .9, lh * .36, 'rgba(225,245,255,.9)'); x += w; });
  };
  LIVE.an_scrL = { every: 3, draw(c, fw, fh, t) {
    const act = AN().active, [cx, cy, cw, ch] = RR(L1.cnt, fw, fh);
    const v = 12400 + t * (act ? 9 : 3.2); c.fillStyle = 'rgba(8,24,80,.96)'; c.fillRect(cx + cw * .04, cy + ch * .48, cw * .92, ch * .44);
    A.txt(c, NX.num(v / 1000, 1) + ' ' + t_('scene.unit.k'), cx + cw * .05, cy + ch * .7, cw * .62, ch * .34, '#e8feff', { align: 'left' });
    for (let k = 0; k < 9; k++) { const h = ch * .32 * (.3 + .7 * wave(Math.floor(t * 2) + k, 2)); c.fillStyle = k === 8 ? '#ffffff' : 'rgba(59,232,255,.75)'; c.fillRect(cx + cw * (.68 + k * .033), cy + ch * .9 - h, cw * .022, h); }   // міні-графік
    const [bx, by, bw, bh] = RR(L1.bars, fw, fh), grow = (t * (act ? .5 : .18)) % 1;
    c.fillStyle = 'rgba(10,30,100,.92)'; c.fillRect(bx, by, bw, bh);
    for (let k = 1; k < 4; k++) { c.fillStyle = 'rgba(150,220,255,.13)'; c.fillRect(bx, by + bh * k / 4, bw, .3); }
    DAYV.forEach((dv, k) => {
      const today = k === TODAY, h = bh * (today ? .2 + .78 * (1 - Math.pow(1 - grow, 2)) : dv * (.96 + .04 * Math.sin(t * 1.5 + k))), x = bx + bw * (k + .18) / 7, w = bw / 7 * .64, y = by + bh - h;
      const g = c.createLinearGradient(0, y, 0, by + bh); g.addColorStop(0, today ? '#ffe4fa' : '#e8feff'); g.addColorStop(.2, today ? '#ff7ad0' : '#5ae8ff'); g.addColorStop(1, today ? '#7a1a8a' : '#1a5ad0');
      c.fillStyle = g; c.fillRect(x, y, w, h); c.fillStyle = 'rgba(255,255,255,.4)'; c.fillRect(x, y, w, Math.min(.7, h));
      if (today) { c.save(); c.globalCompositeOperation = 'lighter'; c.fillStyle = `rgba(255,120,230,${.25 + .25 * Math.sin(t * 6)})`; c.fillRect(x - .5, y - .5, w + 1, h + .5); c.restore(); }
    });
    c.fillStyle = 'rgba(120,230,255,.6)'; c.fillRect(bx, by + bh, bw, .45);
    fx(c, fw, fh, t, 0);
  } };

  // ВИРУЧКА: тренд (лінія з заливкою біжить, курсор із підказкою) + «пончик» КОНВЕРСІЯ з легендою
  const R1 = { chart: [.06, .2, .88, .4], conv: [.06, .66, .88, .28] };
  PAINT.an_scrR = (c, fw, fh) => {
    screenBase(c, fw, fh, t_('scene.analytics.revenue'), 'chart');
    const [gx, gy, gw, gh] = RR(R1.chart, fw, fh); glass(c, gx, gy, gw, gh, PANEL);
    const [vx, vy, vw, vh] = RR(R1.conv, fw, fh); glass(c, vx, vy, vw, vh, PANEL);
    A.txt(c, t_('scene.analytics.conv'), vx + vw * .66, vy + vh * .17, vw * .6, vh * .14, '#e8feff', { glow: CY });
    [['UA', CY], ['PL', PK], ['NL', '#9a8cff']].forEach(([s, col], k) => { const y = vy + vh * (.42 + k * .19); c.fillStyle = col; c.fillRect(vx + vw * .4, y - .7, 1.6, 1.4); A.txt(c, s, vx + vw * .47, y, vw * .1, vh * .11, 'rgba(210,240,255,.85)', { align: 'left' }); });
  };
  LIVE.an_scrR = { every: 3, draw(c, fw, fh, t) {
    const act = AN().active, [gx, gy, gw, gh] = RR(R1.chart, fw, fh), sp = act ? 3.2 : 1.2;
    glass(c, gx + .6, gy + .6, gw - 1.2, gh - 1.2, { r: .6, a: '#10348e', b: '#0b276e', c: '#081c52', lw: .01 });
    for (let k = 1; k < 4; k++) { c.fillStyle = 'rgba(150,220,255,.12)'; c.fillRect(gx + 1, gy + gh * k / 4, gw - 2, .3); }
    // лінія тренду: хвилі виручки з коливаннями, біжить ліворуч
    const step = gw / 16, n0 = Math.floor(t * sp), f = t * sp - n0, P = [];
    for (let k = -1; k <= 17; k++) { const n = n0 + k, x = gx + (k - f) * step, v = Math.max(.12, Math.min(.94, .5 + .24 * Math.sin(n * .11) + .34 * (wave(n, 5) - .5))); P.push([x, gy + gh * (.92 - .78 * v)]); }
    c.save(); c.beginPath(); c.rect(gx + 1, gy + 1, gw - 2, gh - 2); c.clip();
    c.beginPath(); c.moveTo(P[0][0], gy + gh); P.forEach(p => c.lineTo(p[0], p[1])); c.lineTo(P[P.length - 1][0], gy + gh); c.closePath();
    const g = c.createLinearGradient(0, gy, 0, gy + gh); g.addColorStop(0, 'rgba(255,90,220,.38)'); g.addColorStop(1, 'rgba(255,90,220,0)'); c.fillStyle = g; c.fill();
    c.strokeStyle = '#ff9af0'; c.lineWidth = .7; c.beginPath(); P.forEach((p, i) => i ? c.lineTo(p[0], p[1]) : c.moveTo(p[0], p[1])); c.stroke();
    // курсор: ходить туди-сюди, крапка на лінії й підказка з сумою
    const cu = .25 + .5 * (.5 + .5 * Math.sin(t * .7)), cxp = gx + gw * cu, ki = Math.max(0, Math.min(P.length - 2, Math.floor((cxp - P[0][0]) / step))), q = (cxp - P[ki][0]) / step, cyp = P[ki][1] + (P[ki + 1][1] - P[ki][1]) * q;
    c.fillStyle = 'rgba(220,250,255,.5)'; for (let y = gy + 2; y < gy + gh - 1; y += 2) c.fillRect(cxp - .15, y, .3, 1);
    c.fillStyle = '#ffffff'; c.beginPath(); c.arc(cxp, cyp, 1.1, 0, 7); c.fill(); c.strokeStyle = PK; c.lineWidth = .4; c.beginPath(); c.arc(cxp, cyp, 1.9, 0, 7); c.stroke();
    const tw = gw * .3, th = gh * .2, tx = Math.min(gx + gw - tw - 1, cxp + 2.4), ty = Math.max(gy + 1, cyp - th - 2.4);
    c.fillStyle = 'rgba(20,56,160,.95)'; rr(c, tx, ty, tw, th, .6); c.fill(); c.strokeStyle = 'rgba(160,240,255,.8)'; c.lineWidth = .3; rr(c, tx, ty, tw, th, .6); c.stroke();
    A.txt(c, NX.num(28 + 44 * (1 - (cyp - gy) / gh), 1) + ' ' + t_('scene.unit.k'), tx + tw / 2, ty + th * .55, tw * .86, th * .6, '#e8feff');
    c.restore();
    const pct = 18 + 4 * Math.sin(t * .4); c.fillStyle = GR; c.beginPath(); c.moveTo(gx + gw * .06, gy + gh * .2); c.lineTo(gx + gw * .1, gy + gh * .06); c.lineTo(gx + gw * .14, gy + gh * .2); c.fill();
    A.txt(c, '+' + NX.num(pct, 1) + '%', gx + gw * .16, gy + gh * .13, gw * .3, gh * .14, '#b8ffd2', { align: 'left' });
    // «пончик» конверсії: сегменти «дихають», стрілка повертається
    const [vx, vy, vw, vh] = RR(R1.conv, fw, fh), dcx = vx + vw * .2, dcy = vy + vh * .55, r = Math.min(vw * .17, vh * .4), conv = 3.4 + .4 * Math.sin(t * .5);
    c.fillStyle = 'rgba(10,28,90,.96)'; c.beginPath(); c.arc(dcx, dcy, r * 1.08, 0, 7); c.fill();
    let a = -Math.PI / 2 + t * .25; [[44, CY], [33, PK], [23, '#9a8cff']].forEach(([v2, col], k) => { const b = a + v2 / 100 * Math.PI * 2 * (.97 + .03 * Math.sin(t * 2 + k)); c.strokeStyle = col; c.lineWidth = r * .38; c.beginPath(); c.arc(dcx, dcy, r * .78, a + .05, b - .05); c.stroke(); a = b; });
    c.fillStyle = '#0a1a50'; c.beginPath(); c.arc(dcx, dcy, r * .56, 0, 7); c.fill();
    A.txt(c, NX.num(conv, 1) + '%', dcx, dcy, r * 1.05, r * .38, '#e8feff');
    const lw = vw * .36; [.44, .33, .23].forEach((v2, k) => { const y = vy + vh * (.42 + k * .19); c.fillStyle = 'rgba(8,24,80,.95)'; c.fillRect(vx + vw * .58, y - .7, lw, 1.4); c.fillStyle = [CY, PK, '#9a8cff'][k]; c.fillRect(vx + vw * .58, y - .7, lw * v2 * (1.6 + .15 * Math.sin(t * 1.3 + k)), 1.4); });
    fx(c, fw, fh, t, 3.3);
  } };
})();

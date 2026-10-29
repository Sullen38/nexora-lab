/* ============================================================================
 * objects/tl_paint.js — ІНСТРУМЕНТИ: МАЛЮНКИ ГРАНЕЙ І ЖИВІ ЕКРАНИ
 * ----------------------------------------------------------------------------
 * Розкладка частин — tools/wingbox/gen_room.py: tools() (id tl_*). Тут — як виглядають їхні грані (NX.arc.paint[id], пласкі
 * текстури: рушій кладе їх у перспективу) і що на них живе (NX.arc.LIVE[id] — лише те, що рухається). Крок 5 (29.10): лише
 * верстак і екрани («спершу лише столи й екрани, без дрібних елементів»); Nexi за роботою — наступним кроком.
 *   tl_bench   — верстак: тепла помаранчева кромка (робоче світло), тумби з шухлядами інструментів на кінцях, посередині —
 *                перфодошка з інструментами (ключ, викрутка, молоток, плоскогубці) і попереджувальні смужки
 *   tl_cap     — шапка панелі (вивіска — tl_sign, arc_paint.js): ґратки й світлодіоди обабіч вивіски
 *   tl_bpL/R   — стовпи панелі (колонка світлодіодів, внутрішні грані — блакитне світло); tl_mid — між нижніми екранами
 *   tl_rail    — планка під плитками: неон і світлодіоди стану під кожною плиткою; tl_bb — низ панелі (смужка над верстаком)
 *   tl_tiles   — ряд плиток інтеграцій ПОШТА · КАЛЕНДАР · CRM: по черзі «синхронізуються» (підсвітка, кружляє індикатор,
 *                смужка прогресу, потім ✓), конверт вилітає, у календарі блимає день, у CRM додаються контакти
 *   tl_scrL    — АВТО: потік автоматизації заявка -> AI -> CRM -> пошта (пакети біжать вузлами), лічильник ЗАЯВКИ
 *   tl_scrR    — API: голограма двох шестерень у зачепленні й маніпулятора, що їх налаштовує (іскри), стан OK
 * Коли Nexi працює в зоні (живий об'єкт інструментів — наступний крок: NX.objects.tools.active), усе біжить швидше.
 * Усі написи — NX.t (4 мови): scene.tools.*; без перекладу — CRM, API, AI (правило словників).
 * ========================================================================== */
(() => {
  const A = NX.arc.kit, T = NX.arc.pt, PAINT = NX.arc.paint, LIVE = NX.arc.LIVE, hash = NX.art.hash, t_ = k => NX.t(k);
  const { glass, icon, rr, drawer, inset, bolt, led, vent, innerLight } = T;
  const TL = () => NX.objects.tools || {};                                                                  // живий об'єкт зони (наступний крок)
  const BX0 = 1118, BW = 224, U = X => (X - BX0) / BW;                                                      // частка ширини верстака з px картинки
  const CY = '#3be8ff', OR = '#ff9a3a', GR = '#3bff8a', PK = '#ff4fd8';
  const PANEL = { r: .8, a: '#123a9a', b: '#0c2a7a', c: '#081e5e', lw: .45 };
  const ease = k => k < .5 ? 2 * k * k : 1 - Math.pow(-2 * k + 2, 2) / 2;

  // ---------- ВЕРСТАК ----------
  /** Інструменти на перфодошці (силуети з бліком, c — у координатах грані; s — довжина інструмента). */
  function tool(c, kind, x, y, s, col = '#c8d0f0') {
    c.save(); c.translate(x, y); c.fillStyle = col; const hi = 'rgba(255,255,255,.55)', dk = 'rgba(10,6,30,.6)';
    if (kind === 'wrench') { c.rotate(-.5); c.fillRect(-s * .06, -s * .38, s * .12, s * .76); c.beginPath(); c.arc(0, -s * .42, s * .14, 0, 7); c.fill(); c.fillStyle = '#0a0620'; c.fillRect(-s * .05, -s * .6, s * .1, s * .16); c.fillStyle = col; c.beginPath(); c.arc(0, s * .42, s * .12, 0, 7); c.fill(); c.fillStyle = hi; c.fillRect(-s * .06, -s * .3, s * .04, s * .6); }
    else if (kind === 'driver') { c.rotate(.12); c.fillStyle = OR; rr(c, -s * .08, -s * .5, s * .16, s * .38, s * .05); c.fill(); c.fillStyle = dk; c.fillRect(-s * .02, -s * .48, s * .04, s * .34); c.fillStyle = col; c.fillRect(-s * .025, -s * .12, s * .05, s * .58); c.fillStyle = hi; c.fillRect(-s * .025, -s * .1, s * .02, s * .5); }
    else if (kind === 'hammer') { c.rotate(-.12); c.fillStyle = '#a05668'; c.fillRect(-s * .04, -s * .3, s * .08, s * .78); c.fillStyle = col; rr(c, -s * .22, -s * .46, s * .44, s * .17, s * .03); c.fill(); c.fillStyle = hi; c.fillRect(-s * .2, -s * .45, s * .4, s * .04); }
    else { c.rotate(.35); c.fillStyle = col; c.fillRect(-s * .1, -s * .45, s * .07, s * .34); c.fillRect(s * .03, -s * .45, s * .07, s * .34); c.beginPath(); c.arc(0, -s * .1, s * .08, 0, 7); c.fill();
      c.fillStyle = PK; c.fillRect(-s * .12, -s * .06, s * .08, s * .5); c.fillRect(s * .04, -s * .06, s * .08, s * .5); c.fillStyle = hi; c.fillRect(-s * .1, -s * .44, s * .02, s * .3); }   // плоскогубці
    c.restore();
  }
  /** Попереджувальні смужки (жовто-чорні). */
  function hazard(c, x, y, w, h) { c.save(); c.beginPath(); c.rect(x, y, w, h); c.clip(); c.fillStyle = '#e8b82a'; c.fillRect(x, y, w, h); c.fillStyle = '#1a1020'; for (let k = -2; k < w / h + 2; k++) { const xx = x + k * h * 1.2; c.beginPath(); c.moveTo(xx, y + h); c.lineTo(xx + h * .6, y + h); c.lineTo(xx + h * 1.2, y); c.lineTo(xx + h * .6, y); c.fill(); } c.restore(); }
  /** Фасад верстака: тепла помаранчева кромка (робоче світло), тумби з шухлядами на кінцях (помаранчеві LED), посередині —
   *  перфодошка з інструментами на гачках, унизу — попереджувальні смужки. */
  PAINT.tl_bench = (c, fw, fh) => {
    c.fillStyle = 'rgba(255,220,170,.25)'; c.fillRect(0, 0, fw, fh * .04); A.neon(c, 0, fh * .08, fw, fh * .08, OR, 1.5);
    c.fillStyle = 'rgba(0,0,0,.42)'; c.fillRect(0, fh * .12, fw, fh * .03);
    [[1124, 1166], [1294, 1336]].forEach(([a, b], s) => {                                                         // тумби з шухлядами
      const x = fw * U(a), w = fw * (U(b) - U(a)); inset(c, x - 1, fh * .17, w + 2, fh * .76, 'rgba(4,2,14,.65)');
      for (let k = 0; k < 3; k++) drawer(c, x, fh * (.19 + k * .245), w, fh * .225, { led: k === 0 ? (s ? CY : OR) : null, a: '#262060', b: '#151040' });
    });
    const x0 = fw * U(1174), x1 = fw * U(1286), w = x1 - x0; inset(c, x0, fh * .19, w, fh * .7, 'rgba(6,4,22,.85)', 1.2);   // перфодошка
    for (let y = fh * .25; y < fh * .78; y += 2.6) for (let x = x0 + 2.2; x < x1 - 1.5; x += 2.6) { c.fillStyle = 'rgba(1,1,8,.95)'; c.fillRect(x, y, .75, .75); c.fillStyle = 'rgba(150,130,240,.22)'; c.fillRect(x + .2, y + .75, .55, .25); }
    [['wrench', .14], ['driver', .33], ['hammer', .56], ['pliers', .8]].forEach(([k, f]) => tool(c, k, x0 + w * f, fh * .52, fh * .56, '#d0d8f8'));
    hazard(c, x0 + 1, fh * .8, w * .18, fh * .06); hazard(c, x1 - 1 - w * .18, fh * .8, w * .18, fh * .06);
    [x0 + 1.6, x1 - 1.6].forEach(x => { bolt(c, x, fh * .24); bolt(c, x, fh * .84); });
  };
  /** Верстак живе: робоче світло кромки ледь «дихає», на тумбах перемигуються світлодіоди. */
  LIVE.tl_bench = { every: 4, draw(c, fw, fh, t) {
    const p = .5 + .5 * Math.sin(t * 1.8); c.save(); c.globalCompositeOperation = 'lighter'; c.fillStyle = `rgba(255,170,80,${.08 + .1 * p})`; c.fillRect(0, fh * .05, fw, fh * .06); c.restore();
    [[1124, 1166], [1294, 1336]].forEach(([a, b], s) => { const x = fw * U(a), w = fw * (U(b) - U(a)), on = Math.floor(t * 2 + s) % 3; led(c, x + w - 2, fh * (.19 + on * .245) + 1.8, on ? '#ffffff' : (s ? CY : OR), .45); });
  } };

  // ---------- ПАНЕЛЬ: шапка, стовпи, планка, низ ----------
  PAINT.tl_cap = (c, fw, fh) => {
    [[.012, .052], [.948, .988]].forEach(([a, b]) => vent(c, fw * a, fh * .3, fw * (b - a), fh * .44, 4));
    [.065, .935].forEach((f, s) => { for (let k = 0; k < 3; k++) led(c, fw * f, fh * (.32 + k * .19), [OR, CY, GR][(k + s) % 3], .55); });
    [.03, .97].forEach(f => { bolt(c, fw * f, fh * .14); bolt(c, fw * f, fh * .86); });
  };
  LIVE.tl_cap = { every: 4, draw(c, fw, fh, t) { [.065, .935].forEach((f, s) => { const k = Math.floor(t * (TL().active ? 6 : 3) + s) % 3; led(c, fw * f, fh * (.32 + k * .19), '#ffffff', .55); }); } };
  const pillar = (c, fw, fh) => { for (let k = 0; k < 9; k++) led(c, fw / 2, fh * (.05 + k * .045), k % 4 ? CY : OR, .5); bolt(c, fw / 2, fh * .015 + .9); };
  const inner = (c, fw, fh) => innerLight(c, fw, fh, '59,232,255', '#b8f8ff');
  PAINT.tl_bpL = pillar; PAINT.tl_bpL.sides = { right: inner };
  PAINT.tl_bpR = (c, fw, fh) => pillar(c, fw, fh); PAINT.tl_bpR.sides = { left: inner };
  PAINT.tl_mid = (c, fw, fh) => { for (let k = 0; k < 3; k++) led(c, fw / 2, fh * (.2 + k * .3), k === 1 ? OR : CY, .45); };
  PAINT.tl_mid.sides = { left: inner, right: inner };
  const pillarLive = dir => ({ every: 4, draw(c, fw, fh, t) {
    const n = 9, on = ((Math.floor(t * 8) * -dir) % n + n) % n;
    c.save(); c.globalCompositeOperation = 'lighter';
    for (let k = 0; k < n; k++) { const d = (k - on + n) % n, a = dir > 0 ? [1, .55, .25][d] : [1, .55, .25][(n - d) % n]; if (!a) continue;
      c.fillStyle = k % 4 ? `rgba(160,250,255,${a})` : `rgba(255,200,140,${a})`; c.beginPath(); c.arc(fw / 2, fh * (.05 + k * .045), .85, 0, 7); c.fill(); }
    c.restore();
  } });
  LIVE.tl_bpL = pillarLive(1); LIVE.tl_bpR = pillarLive(-1);
  /** Планка під плитками: неонова кромка й світлодіоди стану під кожною плиткою (живі — колір стану синхронізації). */
  PAINT.tl_rail = (c, fw, fh) => { A.neon(c, fw * .01, fh * .3, fw * .99, fh * .3, CY, .9); [1, 3, 5].forEach(k => led(c, fw * k / 6, fh * .66, '#1a8ab0', .5)); };
  PAINT.tl_rail.sides = { top: (c, fw, fh) => { c.fillStyle = 'rgba(59,232,255,.2)'; c.fillRect(0, 0, fw, fh * .4); } };
  PAINT.tl_bb = (c, fw, fh) => { A.neon(c, fw * .02, fh * .04, fw * .98, fh * .04, CY, 1); for (let k = 0; k < 12; k++) led(c, fw * (.08 + k * .076), fh * .14, k % 4 === 1 ? OR : '#1a8ab0', .45); };
  PAINT.tl_bb.sides = { top: (c, fw, fh) => { c.fillStyle = 'rgba(59,232,255,.22)'; c.fillRect(0, 0, fw, fh * .35); } };
  LIVE.tl_sign = NX.arc.glint(8.1, 4.4);                                                                   // відблиск по вивісці (не разом з іншими)

  // ---------- ПЛИТКИ ІНТЕГРАЦІЙ ----------
  const TILE = [['mail', 'scene.tools.mail', CY], ['cal', 'scene.tools.cal', '#9a8cff'], ['crm', 'scene.tools.crm', PK]];
  const tileR = (k, fw, fh) => [fw * (.035 + k * .32), fh * .1, fw * .29, fh * .8];
  /** Стан синхронізації: яка плитка зараз «підключається» і наскільки (k — номер, f — 0..1), коли Nexi працює — швидше. */
  const syncAt = t => { const p = t * (TL().active ? .45 : .16), k = Math.floor(p) % 3; return { k, f: p - Math.floor(p) }; };
  PAINT.tl_tiles = (c, fw, fh) => {
    c.fillStyle = '#040a2a'; c.fillRect(0, 0, fw, fh); glass(c, .8, .8, fw - 1.6, fh - 1.6, { r: 1.4, a: '#0f3a9e', b: '#0a2676', c: '#061a52', line: CY, lw: .8 });
    TILE.forEach(([ic, key, col], k) => { const [x, y, w, h] = tileR(k, fw, fh);
      glass(c, x, y, w, h, { r: 1.2, line: col, a: '#163e9e', b: '#0d2a7a', c: '#091e5e', lw: .55 });
      icon(c, ic, x + w / 2, y + h * .4, h * .42, col === PK ? '#ff9af0' : col === CY ? '#9af6ff' : '#c8bcff');
      A.txt(c, t_(key), x + w / 2, y + h * .82, w * .86, h * .13, '#bff8ff'); });
  };
  LIVE.tl_tiles = { every: 3, draw(c, fw, fh, t) {
    const { k: on, f } = syncAt(t);
    TILE.forEach(([ic, key, col], k) => { const [x, y, w, h] = tileR(k, fw, fh), done = k < on || (k === on && f > .82);
      const st = x + w - h * .14, sy = y + h * .14;                                                         // кружечок стану в куті
      c.fillStyle = 'rgba(8,20,70,.95)'; c.beginPath(); c.arc(st, sy, h * .1, 0, 7); c.fill();
      if (k === on && !done) {                                                                              // синхронізація: підсвітка, індикатор, смужка
        c.save(); c.globalCompositeOperation = 'lighter'; c.fillStyle = `rgba(120,240,255,${.14 + .12 * Math.sin(t * 6)})`; rr(c, x, y, w, h, 1.2); c.fill(); c.restore();
        c.strokeStyle = '#e8feff'; c.lineWidth = h * .035; c.beginPath(); c.arc(st, sy, h * .065, t * 6, t * 6 + 4.2); c.stroke();
        const pw = w * .74; c.fillStyle = 'rgba(8,24,80,.95)'; c.fillRect(x + w * .13, y + h * .64, pw, h * .045); c.fillStyle = col; c.fillRect(x + w * .13, y + h * .64, pw * ease(Math.min(1, f / .82)), h * .045);
        if (ic === 'mail') { const q = (t * 1.4) % 1; c.globalAlpha = 1 - q; icon(c, 'mail', x + w * (.5 + q * .35), y + h * (.4 - q * .28), h * (.22 - q * .08), '#e8feff'); c.globalAlpha = 1; }
      } else if (done) { c.strokeStyle = GR; c.lineWidth = h * .04; c.beginPath(); c.moveTo(st - h * .05, sy); c.lineTo(st - h * .01, sy + h * .04); c.lineTo(st + h * .06, sy - h * .045); c.stroke(); }
      else { c.fillStyle = 'rgba(150,200,255,.35)'; c.beginPath(); c.arc(st, sy, h * .035, 0, 7); c.fill(); }
      if (ic === 'cal' && Math.sin(t * 4) > 0) { c.fillStyle = '#ff9af0'; c.fillRect(x + w / 2 + h * .04, y + h * .44, h * .05, h * .05); }   // у календарі блимає день
      if (ic === 'crm') { const n = 1240 + Math.floor(t * (TL().active ? 3 : .7)); c.fillStyle = 'rgba(8,24,80,.92)'; c.fillRect(x + w * .08, y + h * .03, w * .5, h * .14); A.txt(c, '+' + n, x + w * .1, y + h * .1, w * .46, h * .1, '#ffc4f0', { align: 'left' }); }
    });
  } };
  // світлодіоди стану на планці під плитками: синій — чекає, кружляє білий — синхронізація, зелений — готово
  LIVE.tl_rail = { every: 4, draw(c, fw, fh, t) { const { k: on, f } = syncAt(t); [1, 3, 5].forEach((q, k) => led(c, fw * q / 6, fh * .66, k < on || (k === on && f > .82) ? GR : k === on ? (Math.sin(t * 10) > 0 ? '#ffffff' : CY) : '#1a8ab0', .5)); } };

  // ---------- НИЖНІ ЕКРАНИ ----------
  function screenBase(c, fw, fh, title) {
    c.fillStyle = '#040a2a'; c.fillRect(0, 0, fw, fh);
    glass(c, .7, .7, fw - 1.4, fh - 1.4, { r: 1.2, a: '#0f3a9e', b: '#0a2676', c: '#061a52', line: CY, lw: .7 });
    A.txt(c, title, fw * .5, fh * .13, fw * .5, fh * .09, '#e8feff', { glow: CY }); c.fillStyle = 'rgba(150,230,255,.4)'; c.fillRect(fw * .06, fh * .24, fw * .88, .3);
  }
  /** Скан-лінія й відблиск по склу; зрідка — короткий глітч. */
  function fx(c, fw, fh, t, seed) {
    c.save(); c.globalCompositeOperation = 'lighter';
    const ry = (((t + seed) * .14) % 1.3 - .15) * fh, g = c.createLinearGradient(0, ry - fh * .1, 0, ry + fh * .1);
    g.addColorStop(0, 'rgba(150,230,255,0)'); g.addColorStop(.5, 'rgba(150,230,255,.09)'); g.addColorStop(1, 'rgba(150,230,255,0)'); c.fillStyle = g; c.fillRect(0, ry - fh * .1, fw, fh * .2);
    c.strokeStyle = `rgba(120,240,255,${.16 + .18 * Math.sin(t * 2.3 + seed)})`; c.lineWidth = .7; c.strokeRect(1.1, 1.1, fw - 2.2, fh - 2.2); c.restore();
    const f8 = Math.floor(t * 9); if (((t + seed * 3) % 10.3) < .35 || hash(f8, 23 + seed) > .97) { const y = fh * (.25 + .65 * hash(f8, 5 + seed)), h = fh * .05;
      c.fillStyle = 'rgba(255,80,220,.36)'; c.fillRect(-.7, y, fw, h * .5); c.fillStyle = 'rgba(80,230,255,.36)'; c.fillRect(.7, y + h * .5, fw, h * .5); }
  }
  // АВТО: заявка -> AI -> CRM -> пошта; пакети біжать вузлами, лічильник заявок росте
  const NODES = [['doc', .14], ['bot', .38], ['crm', .62], ['mail', .86]];
  PAINT.tl_scrL = (c, fw, fh) => {
    screenBase(c, fw, fh, t_('scene.tools.auto'));
    const y = fh * .54; c.strokeStyle = 'rgba(122,244,255,.45)'; c.lineWidth = .5; c.beginPath(); c.moveTo(fw * .14, y); c.lineTo(fw * .86, y); c.stroke();
    NODES.forEach(([ic, f]) => { glass(c, fw * f - fh * .14, y - fh * .14, fh * .28, fh * .28, { r: .8, line: '#7af4ff', a: '#163e9e', b: '#0d2a7a', c: '#091e5e', lw: .4 }); icon(c, ic, fw * f, y, fh * .16, '#bff8ff'); });
  };
  LIVE.tl_scrL = { every: 3, draw(c, fw, fh, t) {
    const y = fh * .54, sp = TL().active ? .9 : .38;
    c.save(); c.globalCompositeOperation = 'lighter';
    for (let q = 0; q < 4; q++) { const ph = (t * sp + q / 4) % 1, x = fw * (.14 + .72 * ph); c.fillStyle = q % 2 ? 'rgba(255,170,240,.95)' : 'rgba(200,250,255,.95)'; c.fillRect(x - .9, y - .9, 1.8, 1.8); c.fillStyle = 'rgba(120,230,255,.3)'; c.fillRect(x - 3, y - .35, 2.2, .7); }
    NODES.forEach(([, f], k) => { const hit = Math.abs(((t * sp * 4) % 4) - k) < .25; if (hit) { c.strokeStyle = 'rgba(160,250,255,.9)'; c.lineWidth = .6; rr(c, fw * f - fh * .16, y - fh * .16, fh * .32, fh * .32, 1); c.stroke(); } });
    c.restore();
    const n = 128 + Math.floor(t * sp * 1.2); c.fillStyle = 'rgba(8,24,80,.95)'; c.fillRect(fw * .08, fh * .76, fw * .84, fh * .15);
    A.txt(c, t_('scene.tools.leads'), fw * .1, fh * .835, fw * .5, fh * .09, 'rgba(200,240,255,.85)', { align: 'left' });
    A.txt(c, '+' + n, fw * .9, fh * .835, fw * .3, fh * .1, '#b8ffd2', { align: 'right' });
    fx(c, fw, fh, t, 1.7);
  } };
  // API: дві шестерні в зачепленні (голограма) і маніпулятор, що їх налаштовує; іскри; стан OK
  function gear(c, cx, cy, r, n, a, col, hole) {
    c.save(); c.translate(cx, cy); c.rotate(a); c.beginPath();
    for (let k = 0; k < n * 2; k++) { const r2 = k % 2 ? r : r * 1.22, a0 = k / (n * 2) * Math.PI * 2, a1 = (k + 1) / (n * 2) * Math.PI * 2; c.lineTo(Math.cos(a0) * r2, Math.sin(a0) * r2); c.lineTo(Math.cos(a1) * r2, Math.sin(a1) * r2); }
    c.closePath(); c.fillStyle = col; c.fill(); c.fillStyle = '#081c52'; c.beginPath(); c.arc(0, 0, r * hole, 0, 7); c.fill();
    c.strokeStyle = 'rgba(230,252,255,.8)'; c.lineWidth = r * .07; c.beginPath(); c.arc(0, 0, r * .68, 0, 7); c.stroke(); c.restore();
  }
  PAINT.tl_scrR = (c, fw, fh) => { screenBase(c, fw, fh, 'API'); };
  LIVE.tl_scrR = { every: 2, draw(c, fw, fh, t) {
    const sp = TL().active ? 1.6 : .7, cx = fw * .36, cy = fh * .6, r = fh * .2, r2 = r * .62;
    glass(c, fw * .05, fh * .28, fw * .9, fh * .66, { r: .8, a: '#10348e', b: '#0b276e', c: '#081c52', lw: .01 });
    c.save(); c.globalAlpha = .9; c.fillStyle = 'rgba(90,220,255,.16)'; c.beginPath(); c.moveTo(cx - r * 1.4, fh * .94); c.lineTo(cx + r * 2.6, fh * .94); c.lineTo(cx + r * 1.6, fh * .32); c.lineTo(cx - r * .6, fh * .32); c.fill();   // конус голограми
    gear(c, cx, cy, r, 10, t * sp, 'rgba(90,220,255,.85)', .3); gear(c, cx + r * 1.62, cy - r * .55, r2, 7, -t * sp * 10 / 7 + .22, 'rgba(255,140,230,.85)', .32);
    // маніпулятор (з правого краю): основа, дві ланки, «торкається» малої шестерні
    const bx = fw * .9, by = fh * .9, a1 = -2.2 + .18 * Math.sin(t * 1.3), l1 = fh * .32, ex = bx + Math.cos(a1) * l1, ey = by + Math.sin(a1) * l1, a2 = a1 - 1.1 + .25 * Math.sin(t * 2.1), l2 = fh * .24, tx = ex + Math.cos(a2) * l2, ty = ey + Math.sin(a2) * l2;
    c.strokeStyle = 'rgba(200,250,255,.9)'; c.lineCap = 'round'; c.lineWidth = fh * .05; c.beginPath(); c.moveTo(bx, by); c.lineTo(ex, ey); c.lineTo(tx, ty); c.stroke();
    c.fillStyle = '#e8feff'; [[bx, by, .05], [ex, ey, .04], [tx, ty, .03]].forEach(([x, y, k]) => { c.beginPath(); c.arc(x, y, fh * k, 0, 7); c.fill(); });
    c.restore();
    if (Math.sin(t * 7) > .55) { c.save(); c.globalCompositeOperation = 'lighter'; for (let q = 0; q < 6; q++) { const a = hash(q, Math.floor(t * 9)) * 6.28, d = fh * (.03 + .06 * hash(q + 3, Math.floor(t * 9))); c.fillStyle = q % 2 ? '#ffe2b0' : '#ffffff'; c.fillRect(tx + Math.cos(a) * d - .4, ty + Math.sin(a) * d - .4, .8, .8); } c.restore(); }   // іскри
    c.fillStyle = 'rgba(8,24,80,.95)'; c.fillRect(fw * .07, fh * .3, fw * .3, fh * .13);
    c.fillStyle = Math.sin(t * 3) > -.6 ? GR : '#1f6a45'; c.beginPath(); c.arc(fw * .11, fh * .365, fh * .025, 0, 7); c.fill();
    A.txt(c, '200 ' + t_('scene.ai.ok'), fw * .14, fh * .365, fw * .22, fh * .08, '#b8ffd2', { align: 'left' });
    fx(c, fw, fh, t, 5.2);
  } };
})();

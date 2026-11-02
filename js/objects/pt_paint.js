/* ============================================================================
 * objects/pt_paint.js — ПОРТАЛ («БРАМА»): МАЛЮНКИ ГРАНЕЙ І ЖИВІ ГРАНІ (ВИХОР)
 * ----------------------------------------------------------------------------
 * Розкладка частин — tools/wingbox/gen_room.py: portal() (id pt_*). Тут — як виглядають їхні грані (NX.arc.paint[id]) і що на
 * них живе (NX.arc.LIVE[id]); сяйво й частинки довкола — живий об'єкт objects/portal.js.
 * Крок 13 (власник: «портал — висока арка з вихором на підвищенні зі сходинками, як на концепті; якість — як у сусідніх
 * зонах, але кожна своя, з характером»). Характер зони: таємнича sci-fi брама — глибокий фіолетовий метал, бузковий і
 * рожевий неон, руни-вогники; вихор — тунель кілець від рожево-фіолетового до блакитного з білим серцем.
 *   pt_st1..3       — сходинки: рожевий / блакитний / бузковий неон по кромці, шеврони «вгору» (біжать — живі), рифлення; на
 *                     верхньому майданчику під аркою (pt_st3) — коло-емітер
 *   pt_baseL / R    — масивні цоколі колон: велика руна в рамці (дихає — жива), рифлення, заклепки
 *   pt_pillL / R    — колони: утоплений енергоканал зі склом (імпульси біжать угору — живі), руни-вогники, заклепки;
 *                     внутрішня грань лівої (її видно) — бузкові світлові панелі
 *   pt_capL / R     — капітелі: кристал посередині, неонова губа знизу
 *   pt_beam         — балка: вивіска посередині (arc_paint.js), на кінцях — «вушка» з кристалами, неон знизу
 *   pt_crest        — замковий камінь угорі: великий кристал-емблема в сяйві (живий)
 *   (крок 13.3 — власник: «портал зроби більше і масивніше»: три сходинки, цоколі й капітелі, товща балка, замковий камінь)
 *   pt_back         — ВИХОР у глибині арки (восьмикутний отвір: зрізи вгорі — темний метал); живий
 * Написів, крім вивіски (nav.portal), немає.
 * ========================================================================== */
(() => {
  const A = NX.arc.kit, T = NX.arc.pt, PAINT = NX.arc.paint, LIVE = NX.arc.LIVE, hash = NX.art.hash;
  const { rr, inset, bolt, led, vent } = T;
  const CY = '#3be8ff', PK = '#ff4fd8', LI = '#d98aff';
  const PT = () => NX.objects.portal || {};

  // ---------- СХОДИНКИ ----------
  /** Шеврони «вгору» посередині сходинки (тьмяні; живі — спалахують по черзі до брами). */
  const CHEV = 7, chev = (c, x, y, s) => { c.beginPath(); c.moveTo(x - s, y + s * .55); c.lineTo(x, y - s * .45); c.lineTo(x + s, y + s * .55); c.stroke(); };
  function riser(c, fw, fh, neonC) {
    const g = c.createLinearGradient(0, 0, 0, fh); g.addColorStop(0, 'rgba(160,110,255,.22)'); g.addColorStop(1, 'rgba(8,2,24,.5)'); c.fillStyle = g; c.fillRect(0, 0, fw, fh);
    A.neon(c, 0, fh * .14, fw, fh * .14, neonC, .75);
    c.strokeStyle = 'rgba(120,80,200,.55)'; c.lineWidth = .4; for (let k = 0; k < CHEV; k++) chev(c, fw * (.5 + (k - (CHEV - 1) / 2) * .045), fh * .6, fh * .2);
    [.06, .94].forEach(u => { bolt(c, fw * u, fh * .55, .55); }); [.2, .8].forEach(u => { c.fillStyle = 'rgba(0,0,0,.4)'; c.fillRect(fw * u, fh * .3, .4, fh * .62); });
  }
  PAINT.pt_st1 = (c, fw, fh) => riser(c, fw, fh, PK);
  PAINT.pt_st2 = (c, fw, fh) => riser(c, fw, fh, CY);
  PAINT.pt_st3 = (c, fw, fh) => riser(c, fw, fh, LI);
  /** Верх сходинки: рифлення (смуги вздовж кромки), світла смуга біля краю. */
  const tread = (c, fw, fh, col) => { c.fillStyle = 'rgba(6,2,20,.35)'; for (let y = fh * .12; y < fh; y += 2.2) c.fillRect(0, y, fw, .45); c.fillStyle = col; c.fillRect(0, 0, fw, .5); };
  const stepSide = col => (c, fw, fh) => { c.fillStyle = 'rgba(8,2,24,.4)'; c.fillRect(0, 0, fw, fh); A.neon(c, 0, fh * .14, fw, fh * .14, col, .7); };
  PAINT.pt_st1.sides = { top: (c, fw, fh) => tread(c, fw, fh, 'rgba(255,120,230,.5)'), right: stepSide(PK) };
  PAINT.pt_st2.sides = { top: (c, fw, fh) => tread(c, fw, fh, 'rgba(120,240,255,.5)'), right: stepSide(CY) };
  PAINT.pt_st3.sides = {
    top: (c, fw, fh) => {                                                                                // майданчик під аркою: коло-емітер
      tread(c, fw, fh, 'rgba(120,240,255,.5)');
      const cx = fw / 2, cy = fh * .45; [[fw * .3, .55, CY], [fw * .22, .45, LI], [fw * .13, .4, '#ffffff']].forEach(([r, a, col]) => { c.globalAlpha = a; c.strokeStyle = col; c.lineWidth = .9; c.beginPath(); c.ellipse(cx, cy, r, r * .42, 0, 0, 7); c.stroke(); });
      c.globalAlpha = .28; const g = c.createRadialGradient(cx, cy, 0, cx, cy, fw * .3); g.addColorStop(0, '#c8a0ff'); g.addColorStop(1, 'rgba(120,60,255,0)'); c.fillStyle = g; c.beginPath(); c.ellipse(cx, cy, fw * .3, fw * .13, 0, 0, 7); c.fill(); c.globalAlpha = 1;
    },
    right: stepSide(LI),
  };
  /** Шеврони біжать до брами: від країв до середини, по черзі. */
  const chevLive = col => ({ every: 4, step: 6, draw(c, fw, fh, t) {
    const sp = PT().active ? 3.2 : 1.1, ph = (t * sp) % 1, half = (CHEV - 1) / 2;
    c.lineWidth = .55; c.lineCap = 'round';
    for (let k = 0; k < CHEV; k++) { const d = Math.abs(k - half) / half, a = Math.max(0, 1 - Math.abs(((1 - d) - ph + 1) % 1 - .15) * 4); if (a < .05) continue;
      c.strokeStyle = col; c.globalAlpha = a; chev(c, fw * (.5 + (k - half) * .045), fh * .6, fh * .2); }
    c.globalAlpha = 1;
  } });
  LIVE.pt_st1 = chevLive('#ff9af0');
  LIVE.pt_st2 = chevLive('#9af6ff');
  LIVE.pt_st3 = chevLive('#e2c4ff');

  // ---------- КОЛОНИ ----------
  const RUNE = [['X.X', '.X.', 'X.X'], ['XXX', 'X..', 'XXX'], ['.X.', 'XXX', '.X.'], ['XX.', '.XX', 'XX.'], ['X..', 'XXX', '..X'], ['XXX', '.X.', '.X.']];
  const RUNE_V = k => .1 + k * .14;                                                                       // руни вздовж колони (частки висоти)
  /** Піксельна руна 3×3. */
  const rune = (c, k, cx, cy, s, col) => { c.fillStyle = col; RUNE[k % RUNE.length].forEach((row, j) => [...row].forEach((ch, i) => { if (ch === 'X') c.fillRect(cx + (i - 1.5) * s, cy + (j - 1.5) * s, s * .9, s * .9); })); };
  /** Лице колони: утоплений енергоканал зі склом посередині, руни-вогники обабіч, заклепки вгорі й унизу. */
  function pillar(c, fw, fh) {
    inset(c, fw * .3, fh * .05, fw * .4, fh * .9, 'rgba(4,2,16,.85)', .5);
    const g = c.createLinearGradient(fw * .35, 0, fw * .65, 0); g.addColorStop(0, 'rgba(90,40,180,.6)'); g.addColorStop(.5, 'rgba(200,150,255,.45)'); g.addColorStop(1, 'rgba(90,40,180,.6)');
    c.fillStyle = g; c.fillRect(fw * .37, fh * .06, fw * .26, fh * .88); c.fillStyle = 'rgba(255,255,255,.22)'; c.fillRect(fw * .41, fh * .06, .35, fh * .88);
    for (let k = 0; k < 7; k++) { c.fillStyle = 'rgba(20,8,50,.9)'; c.fillRect(fw * .36, fh * (.12 + k * .125), fw * .28, .5); }   // кільця-хомути на склі
    for (let k = 0; k < 6; k++) rune(c, k, fw * (k % 2 ? .83 : .17), fh * RUNE_V(k) + fh * .06, .62, 'rgba(160,110,240,.55)');
    [[.17, .02], [.83, .02], [.17, .98], [.83, .98]].forEach(([u, v]) => bolt(c, fw * u, fh * v, .55));
  }
  PAINT.pt_pillL = (c, fw, fh) => pillar(c, fw, fh);
  PAINT.pt_pillR = (c, fw, fh) => pillar(c, fw, fh);
  /** Внутрішня грань лівої колони (її видно крізь арку): бузкові світлові панелі зі швами — вихор світить на неї. */
  PAINT.pt_pillL.sides = { right: (c, fw, fh) => {
    c.fillStyle = 'rgba(10,4,30,.5)'; c.fillRect(0, 0, fw, fh);
    for (let k = 0; k < 5; k++) { const y = fh * (.04 + k * .19), h = fh * .16, g = c.createLinearGradient(0, 0, fw, 0); g.addColorStop(0, 'rgba(120,60,220,.25)'); g.addColorStop(1, 'rgba(210,150,255,.6)');
      c.fillStyle = g; rr(c, fw * .14, y, fw * .72, h, .8); c.fill(); c.strokeStyle = 'rgba(230,200,255,.55)'; c.lineWidth = .3; rr(c, fw * .14, y, fw * .72, h, .8); c.stroke(); }
    A.neon(c, fw * .96, fh * .02, fw * .96, fh * .98, LI, .6);
  } };
  /** Зовнішня грань правої колони: панелі, ґратка, заклепки. */
  PAINT.pt_pillR.sides = { right: (c, fw, fh) => {
    c.fillStyle = 'rgba(10,4,30,.35)'; c.fillRect(0, 0, fw, fh); inset(c, fw * .12, fh * .05, fw * .76, fh * .9, 'rgba(10,4,32,.5)', .8);
    vent(c, fw * .25, fh * .12, fw * .5, fh * .12, 5); vent(c, fw * .25, fh * .76, fw * .5, fh * .12, 5);
    for (let k = 0; k < 3; k++) rune(c, k + 2, fw * .5, fh * (.4 + k * .1), .7, 'rgba(160,110,240,.45)');
  } };
  /** Енергоканал оживає: імпульси біжать угору, руни по черзі спалахують. */
  const pillLive = seed => ({ every: 4, draw(c, fw, fh, t) {
    const sp = PT().active ? .9 : .32;
    for (let k = 0; k < 3; k++) { const ph = (t * sp + k / 3 + seed * .17) % 1, y = fh * (.94 - ph * .88), g = c.createLinearGradient(0, y - fh * .08, 0, y);
      g.addColorStop(0, 'rgba(200,150,255,0)'); g.addColorStop(1, 'rgba(255,230,255,.95)'); c.fillStyle = g; c.fillRect(fw * .38, y - fh * .08, fw * .24, fh * .08); }
    for (let k = 0; k < 6; k++) { const a = Math.max(0, Math.sin(t * 1.4 + k * 1.1 + seed * 2)) ** 6; if (a < .08) continue; c.globalAlpha = a; rune(c, k, fw * (k % 2 ? .83 : .17), fh * RUNE_V(k) + fh * .06, .62, k % 2 ? '#ff9af0' : '#e2c4ff'); }
    c.globalAlpha = 1;
  } });
  LIVE.pt_pillL = pillLive(0); LIVE.pt_pillR = pillLive(1);

  // ---------- ЦОКОЛІ Й КАПІТЕЛІ (крок 13.3: масивніша брама) ----------
  /** Цоколь: важкий блок — рифлення, рамка з великою руною посередині (тьмяна; жива — дихає), заклепки по кутах. */
  const baseRune = (c, fw, fh, col, a, k = 3) => { c.globalAlpha = a; rune(c, k, fw / 2, fh * .5, Math.min(fw, fh) * .14, col); c.globalAlpha = 1; };
  function base(c, fw, fh, k) {
    c.fillStyle = 'rgba(255,220,255,.12)'; c.fillRect(0, 0, fw, .5);
    for (let y = fh * .1; y < fh * .9; y += 1.6) { c.fillStyle = 'rgba(4,1,16,.35)'; c.fillRect(fw * .04, y, fw * .92, .35); }   // рифлення
    inset(c, fw * .22, fh * .14, fw * .56, fh * .72, 'rgba(4,2,18,.92)', .8); A.neonRect(c, fw * .22, fh * .14, fw * .56, fh * .72, LI, .4, .8);
    baseRune(c, fw, fh, 'rgba(160,110,240,.6)', 1, k);
    [[.08, .12], [.92, .12], [.08, .88], [.92, .88]].forEach(([u, v]) => bolt(c, fw * u, fh * v, .6));
    A.neon(c, fw * .02, fh * .97, fw * .98, fh * .97, PK, .55);
  }
  PAINT.pt_baseL = (c, fw, fh) => base(c, fw, fh, 3);
  PAINT.pt_baseR = (c, fw, fh) => base(c, fw, fh, 4);
  const blockSide = (c, fw, fh) => { c.fillStyle = 'rgba(8,2,24,.4)'; c.fillRect(0, 0, fw, fh); inset(c, fw * .1, fh * .16, fw * .8, fh * .68, 'rgba(10,4,32,.5)', .6); vent(c, fw * .2, fh * .32, fw * .6, fh * .36, 4); };
  PAINT.pt_baseL.sides = { right: blockSide }; PAINT.pt_baseR.sides = { right: blockSide };
  const baseLive = seed => ({ every: 4, draw(c, fw, fh, t) {
    const a = .45 + .4 * Math.max(0, Math.sin(t * (PT().active ? 3 : 1.2) + seed * 2.1)); baseRune(c, fw, fh, seed ? '#ff9af0' : '#e2c4ff', a, 3 + seed);
  } });
  LIVE.pt_baseL = baseLive(0); LIVE.pt_baseR = baseLive(1);
  /** Капітель: блок під балкою — кристал посередині, неонова губа знизу, світла смуга вгорі. */
  function cap(c, fw, fh) {
    c.fillStyle = 'rgba(255,220,255,.16)'; c.fillRect(0, 0, fw, .5);
    A.neon(c, fw * .03, fh * .9, fw * .97, fh * .9, LI, .6);
    const x = fw / 2, y = fh * .48, r = Math.min(fw * .18, fh * .34);
    c.fillStyle = '#0a0424'; c.beginPath(); c.moveTo(x, y - r * 1.25); c.lineTo(x + r, y); c.lineTo(x, y + r * 1.25); c.lineTo(x - r, y); c.closePath(); c.fill();
    c.fillStyle = '#c86aff'; c.beginPath(); c.moveTo(x, y - r * .9); c.lineTo(x + r * .68, y); c.lineTo(x, y + r * .9); c.lineTo(x - r * .68, y); c.closePath(); c.fill();
    c.fillStyle = '#f0dcff'; c.beginPath(); c.moveTo(x, y - r * .7); c.lineTo(x + r * .3, y - r * .1); c.lineTo(x - r * .2, y); c.closePath(); c.fill();
    [.12, .88].forEach(u => bolt(c, fw * u, fh * .45, .55));
  }
  PAINT.pt_capL = (c, fw, fh) => cap(c, fw, fh);
  PAINT.pt_capR = (c, fw, fh) => cap(c, fw, fh);
  PAINT.pt_capL.sides = { right: blockSide }; PAINT.pt_capR.sides = { right: blockSide };

  // ---------- БАЛКА ----------
  /** Балка: «вушка» на кінцях з кристалами, рожевий неон знизу, світла губа вгорі; посередині — вивіска (окремий предмет). */
  PAINT.pt_beam = (c, fw, fh) => {
    c.fillStyle = 'rgba(255,220,255,.14)'; c.fillRect(0, 0, fw, .5);
    A.neon(c, fw * .02, fh * .93, fw * .98, fh * .93, PK, .75);
    [fw * .045, fw * .955].forEach(x => {                                                               // кристали на кінцях
      c.fillStyle = '#0a0424'; c.beginPath(); c.moveTo(x, fh * .28); c.lineTo(x + fh * .16, fh * .5); c.lineTo(x, fh * .72); c.lineTo(x - fh * .16, fh * .5); c.closePath(); c.fill();
      c.fillStyle = '#c86aff'; c.beginPath(); c.moveTo(x, fh * .33); c.lineTo(x + fh * .11, fh * .5); c.lineTo(x, fh * .67); c.lineTo(x - fh * .11, fh * .5); c.closePath(); c.fill();
      c.fillStyle = '#f0dcff'; c.beginPath(); c.moveTo(x, fh * .36); c.lineTo(x + fh * .05, fh * .46); c.lineTo(x - fh * .03, fh * .48); c.closePath(); c.fill(); });
  };
  PAINT.pt_beam.sides = { right: (c, fw, fh) => { c.fillStyle = 'rgba(8,2,24,.35)'; c.fillRect(0, 0, fw, fh); vent(c, fw * .2, fh * .3, fw * .6, fh * .36, 4); A.neon(c, 0, fh * .93, fw, fh * .93, PK, .6); } };
  LIVE.pt_sign = NX.arc.glint(9.1, 5.3);
  /** Замковий камінь: великий кристал-емблема (ромб у ромбі) з неоновими «крилами» обабіч. */
  const gem = (c, x, y, r, k) => { [['#0a0424', 1.25], ['#9a4aff', .95], ['#d98aff', .7], ['#f6e8ff', .32]].forEach(([col, q]) => { c.fillStyle = col; c.beginPath();
    c.moveTo(x, y - r * q * k); c.lineTo(x + r * q, y); c.lineTo(x, y + r * q * k); c.lineTo(x - r * q, y); c.closePath(); c.fill(); }); };
  PAINT.pt_crest = (c, fw, fh) => {
    c.fillStyle = 'rgba(255,220,255,.16)'; c.fillRect(0, 0, fw, .5);
    A.neon(c, fw * .06, fh * .55, fw * .36, fh * .55, PK, .55); A.neon(c, fw * .64, fh * .55, fw * .94, fh * .55, PK, .55);
    gem(c, fw / 2, fh * .52, Math.min(fw * .12, fh * .36), 1.15);
    [.1, .9].forEach(u => bolt(c, fw * u, fh * .5, .55));
  };
  PAINT.pt_crest.sides = { right: blockSide };
  LIVE.pt_crest = { every: 4, draw(c, fw, fh, t) {                                                         // кристал світиться й переливається
    const a = .35 + .35 * (.5 + .5 * Math.sin(t * (PT().active ? 4 : 1.6))), x = fw / 2, y = fh * .52, r = Math.min(fw * .12, fh * .36);
    c.globalAlpha = a; const g = c.createRadialGradient(x, y, 0, x, y, r * 2.2); g.addColorStop(0, 'rgba(255,240,255,.9)'); g.addColorStop(.4, 'rgba(210,140,255,.45)'); g.addColorStop(1, 'rgba(160,80,255,0)');
    c.fillStyle = g; c.fillRect(x - r * 2.2, y - r * 2.2, r * 4.4, r * 4.4); c.globalAlpha = 1;
  } };

  // ---------- ВИХОР ----------
  // Отвір — восьмикутний: угорі зрізи (темний метал з бузковим кантом), знизу — майданчик. Нерухоме — темна безодня (видно,
  // поки живе ще не оновилось); живе — тунель кілець, що «пливуть» углиб, спіральні рукави, іскри, яскраве серце.
  const CUT = .13;                                                                                      // зріз кутів (частка ширини)
  const octo = (c, fw, fh) => { const k = fw * CUT; c.beginPath(); c.moveTo(0, fh); c.lineTo(0, k); c.lineTo(k, 0); c.lineTo(fw - k, 0); c.lineTo(fw, k); c.lineTo(fw, fh); c.closePath(); };
  PAINT.pt_back = (c, fw, fh) => {
    const g = c.createRadialGradient(fw / 2, fh * .52, 1, fw / 2, fh * .52, fh * .6); g.addColorStop(0, '#5a2ad0'); g.addColorStop(.5, '#220a66'); g.addColorStop(1, '#0a0424');
    octo(c, fw, fh); c.fillStyle = g; c.fill();
    const k = fw * CUT; [[0, 0, k, 0, 0, k], [fw, 0, fw - k, 0, fw, k]].forEach(([x0, y0, x1, y1, x2, y2]) => {   // зрізи кутів — метал
      c.fillStyle = '#1a0a3e'; c.beginPath(); c.moveTo(x0, y0); c.lineTo(x1, y1); c.lineTo(x2, y2); c.closePath(); c.fill(); A.neon(c, x1, y1, x2, y2, LI, .6); });
  };
  /** Тунель: кільце n з глибиною d (0 — край, 1 — серце): радіус і зсув центру (тунель трохи «дивиться» вгору-праворуч). */
  function ringAt(fw, fh, d) { const R = fw * .58, r = R * Math.pow(1 - d, 1.7) + fw * .02, cx = fw / 2 + d * fw * .05, cy = fh * .52 - d * fh * .06; return [cx, cy, r, r * Math.max(1.3, fh / fw * .8)]; }   // кільця — овали під висоту отвору (крок 13.2: брама висока)
  const BG = {};                                                                                        // тло вихору (перелив) — одне полотно під розмір, а не градієнт щоразу
  function bg(fw, fh, k) {
    const key = Math.round(fw * k) + 'x' + Math.round(fh * k); if (BG[key]) return BG[key];
    const cv = document.createElement('canvas'); cv.width = Math.round(fw * k); cv.height = Math.round(fh * k); const x = cv.getContext('2d'); x.scale(k, k);
    const cx0 = fw / 2, cy0 = fh * .52, g = x.createRadialGradient(cx0 + fw * .04, cy0 - fh * .05, 0, cx0, cy0, fh * .62); g.addColorStop(0, '#ffffff'); g.addColorStop(.06, '#bfe8ff'); g.addColorStop(.18, '#4a8aff');
    g.addColorStop(.36, '#5a2ad8'); g.addColorStop(.62, '#2a0c78'); g.addColorStop(1, '#0c0428'); x.fillStyle = g; x.fillRect(0, 0, fw, fh); return BG[key] = cv;
  }
  LIVE.pt_back = { every: 3, step: 3, draw(c, fw, fh, t) {
    const act = PT().active, sp = act ? .55 : .2, k = c.getTransform().a;
    c.save(); octo(c, fw, fh); c.clip();
    c.drawImage(bg(fw, fh, k), 0, 0, fw, fh); let g;
    // кільця тунелю (як на концепті) пливуть углиб, до серця: ближні — рожево-фіолетові й товсті, середні — сині, дальні —
    // блакитні й тонкі; кожне — суцільне тьмяне коло й яскраві дуги, що кружляють (сусідні — в різні боки)
    const NR = 9, col = d => d < .3 ? [255, Math.round(80 + d * 250), 235] : d < .62 ? [Math.round(180 - (d - .3) * 330), Math.round(110 + (d - .3) * 260), 255] : [110, 235, 255];
    for (let n = 0; n < NR; n++) {
      const d = ((n + t * sp * 2.2) % NR) / NR, [cx, cy, rx, ry] = ringAt(fw, fh, d), a = Math.min(1, d * 7) * (1 - d * .5), C = col(d).join(','), lw = Math.max(.4, 3 * (1 - d));
      if (d < .6) { c.strokeStyle = `rgba(${C},${a * .35})`; c.lineWidth = lw * 1.8; c.beginPath(); c.ellipse(cx, cy, rx, ry, 0, 0, 7); c.stroke(); }
      const a0 = t * (act ? 2.4 : 1) * (n % 2 ? 1 : -1.25) + n * 1.9;
      c.strokeStyle = `rgba(${C},${a * .95})`; c.lineWidth = lw;
      for (let s = 0; s < 2; s++) { c.beginPath(); c.ellipse(cx, cy, rx, ry, 0, a0 + s * 3.1416, a0 + s * 3.1416 + 1.8); c.stroke(); }
    }
    // спіральні рукави (тонкі, закручуються до серця)
    for (let arm = 0; arm < 2; arm++) { c.strokeStyle = arm % 2 ? 'rgba(255,150,240,.32)' : 'rgba(150,240,255,.32)'; c.lineWidth = .7; c.beginPath();
      for (let s = 0; s <= 24; s++) { const q = s / 24, d = q * .92, [cx, cy, rx, ry] = ringAt(fw, fh, d), a = arm * 3.1416 + q * 4.6 - t * (act ? 2.6 : 1.1); const x = cx + Math.cos(a) * rx, y = cy + Math.sin(a) * ry; s ? c.lineTo(x, y) : c.moveTo(x, y); }
      c.stroke(); }
    // іскри, що летять у серце
    for (let k = 0; k < 32; k++) { const ph = (t * (.16 + hash(k, 4) * .22) * (act ? 2 : 1) + hash(k, 1)) % 1, a0 = hash(k, 2) * 6.283 - t * (.8 + hash(k, 3)), [cx, cy, rx, ry] = ringAt(fw, fh, ph * .95);
      c.fillStyle = k % 3 ? `rgba(240,225,255,${1 - ph * .5})` : `rgba(140,245,255,${1 - ph * .5})`; const s = 1.1 * (1 - ph * .6); c.fillRect(cx + Math.cos(a0) * rx - s / 2, cy + Math.sin(a0) * ry - s / 2, s, s); }
    // серце пульсує
    const [hx, hy] = ringAt(fw, fh, 1), pr = fw * (.07 + .015 * Math.sin(t * 3.1)); g = c.createRadialGradient(hx, hy, 0, hx, hy, pr * 2.4); g.addColorStop(0, 'rgba(255,255,255,1)'); g.addColorStop(.4, 'rgba(200,240,255,.7)'); g.addColorStop(1, 'rgba(120,180,255,0)');
    c.fillStyle = g; c.fillRect(hx - pr * 2.4, hy - pr * 2.4, pr * 4.8, pr * 4.8);
    c.restore();
    // край отвору світиться (пульсує)
    c.save(); octo(c, fw, fh); c.strokeStyle = `rgba(230,190,255,${.55 + .25 * Math.sin(t * 2.3)})`; c.lineWidth = 1.1; c.stroke(); c.restore();
  } };
})();

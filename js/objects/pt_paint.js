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
 *   pt_crest        — замковий камінь угорі: великий кристал-емблема в сяйві (живий), руни обабіч
 *   (крок 14 — власник: «портал з рунами, щоб трохи магічний, технологічний і міфічний»: знаки Старшого футарку — золоті руни
 *   на балці (живі: «читаються» хвилею), на колонах і цоколях, коло рун на майданчику, обертове кільце рун по краю вихору;
 *   летючі руни довкола брами — objects/portal.js; неон, енергоканали й кристали — технологічне)
 *   (крок 13.3 — власник: «портал зроби більше і масивніше»: три сходинки, цоколі й капітелі, товща балка, замковий камінь)
 *   pt_back         — ВИХОР у глибині арки (восьмикутний отвір: зрізи вгорі — темний метал); живий
 * Крок 18 (власник, 03.11: «рун перебор — зроби менше; додай кіберпанк-моментів, щоб було поєднання технологій та магії, але
 *   руни трохи все одно лиши»): руни лишились на балці (по 9 у ряд, було 15), на цоколях, обабіч кристала й у кільці вихору
 *   (12, було 18); з колон, їхніх панелей і майданчика — прибрано. Замість них — ТЕХНО: на колонах дисплеї-стрічки
 *   (гекс-код і стовпчики даних біжать — живі), вогники стану, попереджувальні смужки; на майданчику — голо-сітка сканера з
 *   променем, що кружляє (objects/portal.js); на балці — рядок стану «ядро · стабільно · ∞%» (біжучі цифри); з цоколів — кабелі в підлогу; у
 *   вихорі — цифровий «дощ» біт разом із іскрами; летючі руни довкола брами — наполовину голо-біти (objects/portal.js).
 * Написів, крім вивіски (nav.portal), немає (цифри дисплеїв — не слова).
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
    top: (c, fw, fh) => {                                                                                // майданчик під аркою: коло-емітер і коло рун
      tread(c, fw, fh, 'rgba(120,240,255,.5)');
      { const cx = fw / 2, cy = fh * .45, rx = fw * .42, ry = fw * .42 * .42;                                   // голо-сітка сканера (техно, крок 18): овали й радіальні лінії
        c.strokeStyle = 'rgba(120,240,255,.28)'; c.lineWidth = .4; [1, .8, .6].forEach(k => { c.beginPath(); c.ellipse(cx, cy, rx * k, ry * k, 0, 0, 7); c.stroke(); });
        for (let k = 0; k < 12; k++) { const a = k / 12 * 6.283; c.beginPath(); c.moveTo(cx + Math.cos(a) * rx * .45, cy + Math.sin(a) * ry * .45); c.lineTo(cx + Math.cos(a) * rx, cy + Math.sin(a) * ry); c.stroke(); }
        for (let k = 0; k < 12; k++) { const a = k / 12 * 6.283 + .26; c.fillStyle = k % 3 ? 'rgba(120,240,255,.7)' : '#ff9af0'; c.fillRect(cx + Math.cos(a) * rx - .5, cy + Math.sin(a) * ry - .4, 1, .8); } }   // вогники по колу
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
  // РУНИ (крок 14, власник: «портал з рунами — трохи магічний, технологічний і міфічний»): знаки Старшого футарку (давнє письмо),
  // лініями в рамці 0..0.6 × 0..1 — їх малюють колони, цоколі, балка, кільце вихору, майданчик, замковий камінь і летючі руни
  // довкола брами (objects/portal.js: NX.arc.runeG). rune(c, k, cx, cy, s, col) — посередині (cx, cy), заввишки ~3.6 s.
  const FUTH = [
    [[[0, 0], [0, 1]], [[0, .32], [.55, 0]], [[0, .58], [.55, .26]]], [[[0, 1], [0, 0], [.55, .3], [.55, 1]]], [[[0, 0], [0, 1]], [[0, .25], [.45, .5], [0, .75]]],
    [[[0, 0], [0, 1]], [[0, 0], [.5, .3]], [[0, .3], [.5, .6]]], [[[0, 1], [0, 0], [.5, .25], [0, .5], [.5, 1]]], [[[.5, .15], [0, .5], [.5, .85]]],
    [[[0, 0], [.6, 1]], [[.6, 0], [0, 1]]], [[[0, 1], [0, 0], [.45, .25], [0, .5]]], [[[0, 0], [0, 1]], [[.55, 0], [.55, 1]], [[0, .35], [.55, .65]]],
    [[[.3, 0], [.3, 1]], [[0, .35], [.6, .65]]], [[[.3, .1], [0, .35], [.3, .6]], [[.3, .4], [.6, .65], [.3, .9]]], [[[.3, 0], [.3, 1]], [[.3, 0], [.6, .25]], [[.3, 1], [0, .75]]],
    [[[.3, 0], [.3, 1]], [[0, 0], [.3, .4], [.6, 0]]], [[[.55, 0], [0, .35], [.55, .65], [0, 1]]], [[[.3, 0], [.3, 1]], [[0, .35], [.3, 0], [.6, .35]]],
    [[[0, 0], [0, 1]], [[0, 0], [.5, .25], [0, .5], [.5, .75], [0, 1]]], [[[0, 1], [0, 0], [.3, .35], [.6, 0], [.6, 1]]], [[[0, 1], [0, 0], [.6, .4]], [[.6, 1], [.6, 0], [0, .4]]],
    [[[0, 1], [0, 0], [.5, .3]]], [[[.3, .15], [.6, .5], [.3, .85], [0, .5], [.3, .15]]], [[[0, 0], [0, 1], [.6, 0], [.6, 1], [0, 0]]], [[[0, 1], [.6, .45], [.3, .12], [0, .45], [.6, 1]]],
  ];
  /** Руна k (0..21) посередині (cx, cy), заввишки h, колір col; товщина — від висоти. */
  const runeG = (c, k, cx, cy, h, col, lw) => { const G = FUTH[((k % FUTH.length) + FUTH.length) % FUTH.length], x0 = cx - h * .3, y0 = cy - h / 2;
    c.strokeStyle = col; c.lineWidth = lw || Math.max(.25, h * .13); c.lineCap = 'round'; c.lineJoin = 'round';
    G.forEach(L => { c.beginPath(); L.forEach(([u, v], i) => i ? c.lineTo(x0 + u * h, y0 + v * h) : c.moveTo(x0 + u * h, y0 + v * h)); c.stroke(); }); };
  NX.arc.runeG = runeG;
  const rune = (c, k, cx, cy, s, col) => runeG(c, k * 5 + 2, cx, cy, s * 3.6, col);
  const RUNE_V = k => .1 + k * .14;                                                                       // руни вздовж колони (частки висоти)
  const GOLD = '#ffd27a', GOLDD = 'rgba(255,200,110,.5)';   // давнє золото рун (міфічне) — поруч із неоном (технологічним)
  /** Лице колони: утоплений енергоканал зі склом посередині, руни-вогники обабіч, заклепки вгорі й унизу. */
  function pillar(c, fw, fh) {
    inset(c, fw * .3, fh * .05, fw * .4, fh * .9, 'rgba(4,2,16,.85)', .5);
    const g = c.createLinearGradient(fw * .35, 0, fw * .65, 0); g.addColorStop(0, 'rgba(90,40,180,.6)'); g.addColorStop(.5, 'rgba(200,150,255,.45)'); g.addColorStop(1, 'rgba(90,40,180,.6)');
    c.fillStyle = g; c.fillRect(fw * .37, fh * .06, fw * .26, fh * .88); c.fillStyle = 'rgba(255,255,255,.22)'; c.fillRect(fw * .41, fh * .06, .35, fh * .88);
    for (let k = 0; k < 7; k++) { c.fillStyle = 'rgba(20,8,50,.9)'; c.fillRect(fw * .36, fh * (.12 + k * .125), fw * .28, .5); }   // кільця-хомути на склі
    for (const u of [.05, .71]) { inset(c, fw * u, fh * .12, fw * .24, fh * .62, 'rgba(2,8,20,.9)', .4); }                    // дисплеї-стрічки обабіч каналу (вміст — живий)
    for (const u of [.05, .71]) for (let k = 0; k < 4; k++) { const y = fh * (.78 + k * .045); c.fillStyle = k % 2 ? 'rgba(255,200,60,.8)' : 'rgba(20,8,40,.9)'; c.fillRect(fw * u, y, fw * .24, fh * .02); }   // попереджувальні смужки
    [[.18, .07, CY], [.82, .07, '#3bff8a'], [.18, .09, PK]].forEach(([u, v, col]) => led(c, fw * u, fh * v, .55, col));
    [[.17, .02], [.83, .02], [.17, .98], [.83, .98]].forEach(([u, v]) => bolt(c, fw * u, fh * v, .55));
  }
  PAINT.pt_pillL = (c, fw, fh) => pillar(c, fw, fh);
  PAINT.pt_pillR = (c, fw, fh) => pillar(c, fw, fh);
  /** Внутрішня грань лівої колони (її видно крізь арку): бузкові світлові панелі зі швами — вихор світить на неї. */
  PAINT.pt_pillL.sides = { right: (c, fw, fh) => {
    c.fillStyle = 'rgba(10,4,30,.5)'; c.fillRect(0, 0, fw, fh);
    for (let k = 0; k < 5; k++) { const y = fh * (.04 + k * .19), h = fh * .16, g = c.createLinearGradient(0, 0, fw, 0); g.addColorStop(0, 'rgba(120,60,220,.25)'); g.addColorStop(1, 'rgba(210,150,255,.6)');
      c.fillStyle = g; rr(c, fw * .14, y, fw * .72, h, .8); c.fill(); c.strokeStyle = 'rgba(230,200,255,.55)'; c.lineWidth = .3; rr(c, fw * .14, y, fw * .72, h, .8); c.stroke();
      c.strokeStyle = 'rgba(230,210,255,.5)'; c.lineWidth = .3; c.beginPath(); c.moveTo(fw * .22, y + h * .3); c.lineTo(fw * .5, y + h * .3); c.lineTo(fw * .6, y + h * .6); c.lineTo(fw * .8, y + h * .6); c.stroke();   // доріжка плати
      c.fillStyle = '#ffffff'; c.fillRect(fw * .8 - .4, y + h * .6 - .4, .8, .8); if (k === 2) runeG(c, 9, fw * .5, y + h / 2, Math.min(h * .6, fw * .5), 'rgba(255,215,140,.75)'); }   // одна руна — посередині
    A.neon(c, fw * .96, fh * .02, fw * .96, fh * .98, LI, .6);
  } };
  /** Зовнішня грань правої колони: панелі, ґратка, заклепки. */
  PAINT.pt_pillR.sides = { right: (c, fw, fh) => {
    c.fillStyle = 'rgba(10,4,30,.35)'; c.fillRect(0, 0, fw, fh); inset(c, fw * .12, fh * .05, fw * .76, fh * .9, 'rgba(10,4,32,.5)', .8);
    vent(c, fw * .25, fh * .12, fw * .5, fh * .12, 5); vent(c, fw * .25, fh * .76, fw * .5, fh * .12, 5);
    inset(c, fw * .3, fh * .4, fw * .4, fh * .2, 'rgba(2,8,20,.9)', .4); for (let k = 0; k < 4; k++) led(c, fw * (.36 + k * .09), fh * .5, .4, k % 2 ? CY : PK);   // порт із вогниками
    c.strokeStyle = 'rgba(60,40,90,.9)'; c.lineWidth = 1.2; c.beginPath(); c.moveTo(fw * .5, fh * .6); c.quadraticCurveTo(fw * .9, fh * .66, fw * .9, fh * .98); c.stroke();   // кабель униз
  } };
  /** Енергоканал оживає: імпульси біжать угору, руни по черзі спалахують. */
  const pillLive = seed => ({ every: 4, draw(c, fw, fh, t) {
    const sp = PT().active ? .9 : .32;
    for (let k = 0; k < 3; k++) { const ph = (t * sp + k / 3 + seed * .17) % 1, y = fh * (.94 - ph * .88), g = c.createLinearGradient(0, y - fh * .08, 0, y);
      g.addColorStop(0, 'rgba(200,150,255,0)'); g.addColorStop(1, 'rgba(255,230,255,.95)'); c.fillStyle = g; c.fillRect(fw * .38, y - fh * .08, fw * .24, fh * .08); }
    // дисплеї-стрічки: ліворуч — гекс-код, що сповзає; праворуч — стовпчики даних, що дихають (техно, крок 18)
    const HEX = '0123456789ABCDEF', rows = 14, rh = fh * .62 / rows, n0 = Math.floor(t * 3), sc = (t * 3) % 1;
    c.save(); c.beginPath(); c.rect(fw * .05, fh * .12, fw * .24, fh * .62); c.clip(); c.font = `${rh * .85}px monospace`; c.textBaseline = 'top';
    for (let k = -1; k < rows + 1; k++) { const r = n0 + k, hv = hash(r + seed * 97, 2), tx = HEX[Math.floor(hv * 16)] + HEX[Math.floor(hash(r, 5) * 16)]; c.fillStyle = hash(r, 7) > .85 ? '#ff9af0' : `rgba(120,240,255,${.35 + .5 * hash(r, 3)})`; c.fillText(tx, fw * .06, fh * .12 + (k + sc) * rh); }
    c.restore();
    for (let k = 0; k < 9; k++) { const v = .3 + .6 * (.5 + .5 * Math.sin(t * (1.1 + seed * .3) + k * 1.4)), h = fh * .6 * v, x = fw * (.74 + k * .02); c.fillStyle = k % 4 === 3 ? '#ff9af0' : '#5ae8ff'; c.fillRect(x, fh * .74 - h, fw * .013, h); }
    led(c, fw * .18, fh * .07, .55, Math.floor(t * 2 + seed) % 2 ? CY : 'rgba(40,80,120,.9)');
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
    c.strokeStyle = 'rgba(40,24,70,.95)'; c.lineWidth = 1.1; for (const [u0, u1] of [[.12, .04], [.88, .96]]) { c.beginPath(); c.moveTo(fw * u0, fh * .5); c.quadraticCurveTo(fw * u1, fh * .75, fw * u1, fh); c.stroke(); }   // кабелі в підлогу (техно)
    c.fillStyle = 'rgba(255,220,255,.5)'; [.12, .88].forEach(u => c.fillRect(fw * u - 1, fh * .48, 2, 1.2));
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
  const BEAM_R = 9, beamRunes = (c, fw, fh, col, a = 1, ph = null) => { for (const [yy, off] of [[.1, 0], [.86, 7]]) for (let k = 0; k < BEAM_R; k++) {
    const u = .16 + .68 * k / (BEAM_R - 1); if (ph !== null) { const d = Math.abs(((u - ph) % 1 + 1) % 1); c.globalAlpha = a * Math.max(0, 1 - Math.min(d, 1 - d) * 7); if (c.globalAlpha < .04) continue; }
    runeG(c, k + off, fw * u, fh * yy, fh * .13, col); } c.globalAlpha = 1; };
  PAINT.pt_beam = (c, fw, fh) => {
    c.fillStyle = 'rgba(255,220,255,.14)'; c.fillRect(0, 0, fw, .5);
    beamRunes(c, fw, fh, GOLDD);                                                                          // давні руни довкола вивіски (менше — крок 18)
    inset(c, fw * .09, fh * .28, fw * .07, fh * .44, 'rgba(2,8,20,.9)', .5); inset(c, fw * .84, fh * .28, fw * .07, fh * .44, 'rgba(2,8,20,.9)', .5);   // дисплеї стану на кінцях (вміст — живий)
    A.neon(c, fw * .02, fh * .93, fw * .98, fh * .93, PK, .75);
    [fw * .045, fw * .955].forEach(x => {                                                               // кристали на кінцях
      c.fillStyle = '#0a0424'; c.beginPath(); c.moveTo(x, fh * .28); c.lineTo(x + fh * .16, fh * .5); c.lineTo(x, fh * .72); c.lineTo(x - fh * .16, fh * .5); c.closePath(); c.fill();
      c.fillStyle = '#c86aff'; c.beginPath(); c.moveTo(x, fh * .33); c.lineTo(x + fh * .11, fh * .5); c.lineTo(x, fh * .67); c.lineTo(x - fh * .11, fh * .5); c.closePath(); c.fill();
      c.fillStyle = '#f0dcff'; c.beginPath(); c.moveTo(x, fh * .36); c.lineTo(x + fh * .05, fh * .46); c.lineTo(x - fh * .03, fh * .48); c.closePath(); c.fill(); });
  };
  PAINT.pt_beam.sides = { right: (c, fw, fh) => { c.fillStyle = 'rgba(8,2,24,.35)'; c.fillRect(0, 0, fw, fh); vent(c, fw * .2, fh * .3, fw * .6, fh * .36, 4); A.neon(c, 0, fh * .93, fw, fh * .93, PK, .6); } };
  LIVE.pt_beam = { every: 4, step: 6, draw(c, fw, fh, t) { beamRunes(c, fw, fh, '#ffe9b0', .95, (t * (PT().active ? .5 : .16)) % 1);   // руни спалахують хвилею
    const act = PT().active, pct = act ? 99 : 96 + Math.floor(hash(Math.floor(t * 2), 9) * 3);                                                 // дисплеї: стовпчики й відсоток ядра
    for (const u of [.09, .84]) { for (let k = 0; k < 4; k++) { const v = .35 + .6 * (.5 + .5 * Math.sin(t * 1.6 + k * 1.3 + u * 20)); c.fillStyle = k === 3 ? '#ff9af0' : '#5ae8ff'; c.fillRect(fw * (u + .008 + k * .016), fh * .7 - fh * .36 * v, fw * .01, fh * .36 * v); }
      c.font = `${fh * .11}px monospace`; c.textBaseline = 'top'; c.fillStyle = act ? '#bff8ff' : 'rgba(120,240,255,.8)'; c.fillText(pct + '%', fw * (u + .006), fh * .3); } } };
  LIVE.pt_sign = NX.arc.glint(9.1, 5.3);
  /** Замковий камінь: великий кристал-емблема (ромб у ромбі) з неоновими «крилами» обабіч. */
  const gem = (c, x, y, r, k) => { [['#0a0424', 1.25], ['#9a4aff', .95], ['#d98aff', .7], ['#f6e8ff', .32]].forEach(([col, q]) => { c.fillStyle = col; c.beginPath();
    c.moveTo(x, y - r * q * k); c.lineTo(x + r * q, y); c.lineTo(x, y + r * q * k); c.lineTo(x - r * q, y); c.closePath(); c.fill(); }); };
  PAINT.pt_crest = (c, fw, fh) => {
    c.fillStyle = 'rgba(255,220,255,.16)'; c.fillRect(0, 0, fw, .5);
    A.neon(c, fw * .06, fh * .55, fw * .36, fh * .55, PK, .55); A.neon(c, fw * .64, fh * .55, fw * .94, fh * .55, PK, .55);
    gem(c, fw / 2, fh * .52, Math.min(fw * .12, fh * .36), 1.15);
    for (let k = 0; k < 4; k++) { const x = fw * (k < 2 ? .17 + k * .1 : .73 + (k - 2) * .1); runeG(c, k * 5 + 3, x, fh * .3, fh * .28, GOLDD); }   // руни обабіч кристала
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
  // поки живе ще не оновилось); живе — тунель кілець, що «пливуть» углиб, спіральні рукави, іскри, яскраве серце (22.11 — у перспективі, див. нижче).
  const CUT = .13;                                                                                      // зріз кутів (частка ширини)
  const octo = (c, fw, fh) => { const k = fw * CUT; c.beginPath(); c.moveTo(0, fh); c.lineTo(0, k); c.lineTo(k, 0); c.lineTo(fw - k, 0); c.lineTo(fw, k); c.lineTo(fw, fh); c.closePath(); };
  PAINT.pt_back = (c, fw, fh) => {
    const g = c.createRadialGradient(fw / 2, fh * .52, 1, fw / 2, fh * .52, fh * .6); g.addColorStop(0, '#4a5cf0'); g.addColorStop(.25, '#2a0c78'); g.addColorStop(1, '#080220');
    octo(c, fw, fh); c.fillStyle = g; c.fill();
    const k = fw * CUT; [[0, 0, k, 0, 0, k], [fw, 0, fw - k, 0, fw, k]].forEach(([x0, y0, x1, y1, x2, y2]) => {   // зрізи кутів — метал
      c.fillStyle = '#1a0a3e'; c.beginPath(); c.moveTo(x0, y0); c.lineTo(x1, y1); c.lineTo(x2, y2); c.closePath(); c.fill(); A.neon(c, x1, y1, x2, y2, LI, .6); });
  };
  /* (22.11, власник зі знімком: «заповни пусту область порталу порталом, щоб не було видно стінки; покращи ефект усередині,
   * зроби більш глибоким») ТУНЕЛЬ У ПЕРСПЕКТИВІ. Отвір тепер сягає балки (розкладка: pt_back Y 82, було 100). Глибина:
   *   — кільця стоять рівно в глибину, а на екрані стискаються як 1 / (1 + z): біля серця густішають — видно, що далеко;
   *   — стінки тунелю — смуги між кільцями: біля глядача темні, далі фіолетові, сині, біля серця блакитні (ребра через одну);
   *   — тунель вигинається: дальній кінець повільно гойдається, тож серце «ходить» за краями ближніх кілець;
   *   — спіральні ребра по стінках, іскри летять углиб зі шлейфом, серце — мала яскрава точка з променями;
   *   — тінь від рами по краях отвору: вихор сидить у глибині, а не намальований на стіні.
   * ringAt(d): d 0 — край отвору, 1 — серце; повертає [cx, cy, rx, ry, s] (s — стиск перспективи 1 … SMIN). */
  const ZD = 5, SMIN = 1 / (1 + ZD);
  function ringAt(fw, fh, d, t) {
    const s = 1 / (1 + d * ZD), w = Math.pow((1 - s) / (1 - SMIN), 1.6), rx = fw * .8 * s, asp = fh / fw * .8 + (1.2 - fh / fw * .8) * w;
    return [fw / 2 + fw * (.045 + .05 * Math.sin(t * .31)) * w, fh * .52 - fh * (.04 + .018 * Math.cos(t * .27)) * w, rx, rx * asp, s];
  }
  const STOPS = [[0, 12, 3, 36], [.3, 40, 12, 112], [.55, 74, 34, 198], [.78, 58, 104, 250], [1, 112, 196, 255]];   // колір стінки: від краю до серця
  function wallCol(q, k) { let a = STOPS[0], b = STOPS[STOPS.length - 1]; for (let i = 1; i < STOPS.length; i++) if (q <= STOPS[i][0]) { a = STOPS[i - 1]; b = STOPS[i]; break; }
    const u = Math.min(1, Math.max(0, (q - a[0]) / (b[0] - a[0] || 1))); return `rgb(${Math.round((a[1] + (b[1] - a[1]) * u) * k)},${Math.round((a[2] + (b[2] - a[2]) * u) * k)},${Math.round((a[3] + (b[3] - a[3]) * u) * k)})`; }
  const WALLS = {};                                                                                     // стінки тунелю — одне полотно під розмір (овальний перелив), а не 14 заливок щоразу
  function walls(fw, fh, k) {
    const key = Math.round(fw * k) + 'x' + Math.round(fh * k); if (WALLS[key]) return WALLS[key];
    const cv = document.createElement('canvas'); cv.width = Math.round(fw * k); cv.height = Math.round(fh * k); const x = cv.getContext('2d'); x.scale(k, k);
    x.fillStyle = wallCol(0, 1); x.fillRect(0, 0, fw, fh); const asp = fh / fw * .8, R0 = fw * .8;
    x.translate(fw / 2 + fw * .035, fh * .52 - fh * .028); x.scale(1, asp); const g = x.createRadialGradient(0, 0, 0, 0, 0, R0);
    for (let i = 0; i <= 16; i++) { const q = 1 - i / 16; g.addColorStop(Math.min(1, 1 - q * (1 - SMIN)), wallCol(q, .9)); }
    x.fillStyle = g; x.beginPath(); x.arc(0, 0, R0, 0, 7); x.fill(); return WALLS[key] = cv;
  }
  const LIP = {};                                                                                       // тінь від рами по краях отвору — одне полотно під розмір
  function lip(fw, fh, k) {
    const key = Math.round(fw * k) + 'x' + Math.round(fh * k); if (LIP[key]) return LIP[key];
    const cv = document.createElement('canvas'); cv.width = Math.round(fw * k); cv.height = Math.round(fh * k); const x = cv.getContext('2d'); x.scale(k, k);
    const band = (x0, y0, x1, y1, a) => { const g = x.createLinearGradient(x0, y0, x1, y1); g.addColorStop(0, `rgba(5,1,20,${a})`); g.addColorStop(1, 'rgba(5,1,20,0)'); x.fillStyle = g; x.fillRect(0, 0, fw, fh); };
    band(0, 0, 0, fh * .16, .85); band(0, 0, fw * .2, 0, .7); band(fw, 0, fw * .8, 0, .7); band(0, fh, 0, fh * .9, .45); return LIP[key] = cv;
  }
  let GLOW = null;                                                                                      // сяйво серця: дві круглі плями, намальовані раз
  function glowSpr() { if (GLOW) return GLOW; const mk = st => { const cv = document.createElement('canvas'); cv.width = cv.height = 96; const x = cv.getContext('2d'), g = x.createRadialGradient(48, 48, 0, 48, 48, 48); st.forEach(([o, col]) => g.addColorStop(o, col)); x.fillStyle = g; x.fillRect(0, 0, 96, 96); return cv; };
    return GLOW = [mk([[0, 'rgba(150,200,255,1)'], [.4, 'rgba(110,90,255,.38)'], [1, 'rgba(90,40,220,0)']]), mk([[0, 'rgba(255,255,255,1)'], [.35, 'rgba(210,240,255,.8)'], [1, 'rgba(120,180,255,0)']])]; }
  LIVE.pt_back = { every: 3, step: 3, draw(c, fw, fh, t) {
    const act = PT().active, sp = act ? .55 : .2, k = c.getTransform().a, rot = act ? 2.4 : 1;
    c.save(); octo(c, fw, fh); c.clip();
    c.drawImage(walls(fw, fh, k), 0, 0, fw, fh);                                                      // стінки тунелю: від темних біля глядача до блакитних біля серця (одне полотно)
    // ребра стінок: темніша смуга між кожною другою парою кілець — пливуть углиб разом із кільцями
    const NR = 12, R = []; for (let n = 0; n < NR; n++) R.push([((n + t * sp * 2.2) % NR) / NR, n]); R.sort((a, b) => a[0] - b[0]);
    c.strokeStyle = 'rgba(3,1,18,.34)';
    for (let i = 0; i < NR; i++) { if (R[i][1] % 2 || R[i][0] > .7) continue; const A = ringAt(fw, fh, R[i][0], t), B = ringAt(fw, fh, i + 1 < NR ? R[i + 1][0] : 1, t);
      c.lineWidth = (A[2] - B[2] + A[3] - B[3]) / 2; c.beginPath(); c.ellipse((A[0] + B[0]) / 2, (A[1] + B[1]) / 2, (A[2] + B[2]) / 2, (A[3] + B[3]) / 2, 0, 0, 7); c.stroke(); }
    // спіральні ребра по стінках (закручуються до серця, повільно обертаються)
    for (let arm = 0; arm < 4; arm++) { c.strokeStyle = arm % 2 ? 'rgba(255,150,240,.26)' : 'rgba(150,240,255,.26)'; c.lineWidth = .6; c.beginPath();
      for (let i = 0; i <= 14; i++) { const d = Math.pow(i / 14, 1.8) * .96, [cx, cy, rx, ry] = ringAt(fw, fh, d, t), a = arm * 1.5708 + Math.sqrt(d) * 5.2 - t * rot * .45; const x = cx + Math.cos(a) * rx, y = cy + Math.sin(a) * ry; i ? c.lineTo(x, y) : c.moveTo(x, y); }
      c.stroke(); }
    // неонові кромки кілець: тьмяне суцільне коло й яскраві дуги, що кружляють (сусідні — в різні боки); далі — тонші
    const col = q => q < .45 ? [255, Math.round(90 + q * 260), 235] : q < .8 ? [Math.round(200 - (q - .45) * 300), Math.round(150 + (q - .45) * 240), 255] : [130, 238, 255];
    for (const [d, n] of R) { const [cx, cy, rx, ry, s] = ringAt(fw, fh, d, t), q = (1 - s) / (1 - SMIN), a = Math.min(1, d * 9) * Math.min(1, (1 - d) * 6), C = col(q).join(','), lw = Math.max(.35, 2.6 * s);
      if (n % 2) { c.strokeStyle = `rgba(${C},${a * .34})`; c.lineWidth = lw * .9; c.beginPath(); c.ellipse(cx, cy, rx, ry, 0, 0, 7); c.stroke(); }   // суцільне тьмяне коло — через одне (швидкодія)
      const a0 = t * rot * (n % 2 ? 1 : -1.25) + n * 1.9; c.strokeStyle = `rgba(${C},${a * .95})`; c.lineWidth = lw;
      for (let i = 0; i < 2; i++) { c.beginPath(); c.ellipse(cx, cy, rx, ry, 0, a0 + i * 3.1416, a0 + i * 3.1416 + 1.7); c.stroke(); } }
    // іскри летять у серце зі шлейфом із трьох точок (що далі — то дрібніші); без ліній — швидше
    for (let i = 0; i < 22; i++) { const ph = (t * (.1 + hash(i, 4) * .14) * (act ? 2 : 1) + hash(i, 1)) % 1, a0 = hash(i, 2) * 6.283 - t * (.25 + hash(i, 3) * .3), d0 = ph * ph * .97, al = Math.min(1, ph * 6) * (1 - ph * .35), ca = Math.cos(a0) * .92, sa = Math.sin(a0) * .92;
      c.fillStyle = i % 3 ? '#f0e1ff' : '#8cf5ff';
      for (let j = 0; j < 3; j++) { const A = ringAt(fw, fh, Math.max(0, d0 - j * (.006 + .012 * (1 - ph))), t), z = Math.max(.35, 1.3 * A[4]) * (1 - j * .22); c.globalAlpha = al * (1 - j * .33); c.fillRect(A[0] + ca * A[2] - z / 2, A[1] + sa * A[3] - z / 2, z, z); } }
    // цифровий «дощ» (техно, крок 18): біти 0/1 пливуть углиб тунелю й меншають — намальовані прямокутниками (без шрифту)
    for (let i = 0; i < 9; i++) { const ph = (t * (.07 + hash(i, 11) * .08) * (act ? 2 : 1) + hash(i, 12)) % 1, a0 = hash(i, 13) * 6.283 + t * .3, [cx, cy, rx, ry, s] = ringAt(fw, fh, ph * ph * .8, t);
      const h = Math.max(1.6, fw * .06 * s), w = h * .55, x = cx + Math.cos(a0) * rx * .86 - w / 2, y = cy + Math.sin(a0) * ry * .86 - h / 2, e = Math.max(.3, h * .16);
      c.globalAlpha = Math.min(1, ph * 5) * (1 - ph) * .85; c.fillStyle = i % 2 ? '#8cf5ff' : '#ffaaf0';
      if (hash(i + Math.floor(t * 2), 14) > .5) c.fillRect(x + w / 2 - e / 2, y, e, h); else { c.fillRect(x, y, w, e); c.fillRect(x, y + h - e, w, e); c.fillRect(x, y, e, h); c.fillRect(x + w - e, y, e, h); } }
    c.globalAlpha = 1;
    // серце: мала яскрава точка далеко в тунелі — сяйво, промені хрестом, пульс
    { const [hx, hy] = ringAt(fw, fh, 1, t), pu = .5 + .5 * Math.sin(t * 3.1), pr = fw * (.034 + .008 * pu); c.globalCompositeOperation = 'lighter';
      const G = glowSpr(), r1 = fw * .36, r2 = pr * 2.6; c.globalAlpha = .42; c.drawImage(G[0], hx - r1, hy - r1, r1 * 2, r1 * 2); c.globalAlpha = 1; c.drawImage(G[1], hx - r2, hy - r2, r2 * 2, r2 * 2);   // сяйво й ядро — готові плями (не градієнт щоразу)
      c.fillStyle = `rgba(235,248,255,${.5 + .3 * pu})`; const L = fw * (.09 + .03 * pu); c.fillRect(hx - L, hy - .25, L * 2, .5); c.fillRect(hx - .25, hy - L * 1.5, .5, L * 3);
      c.globalCompositeOperation = 'source-over'; }
    c.drawImage(lip(fw, fh, k), 0, 0, fw, fh);                                                        // тінь від рами: вихор — у глибині
    c.restore();
    // кільце рун по краю отвору (як печатка-заклинання): обертається, руни по черзі спалахують золотом
    { const NR = 12, rx = fw * .4, ry = fh * .43, cx = fw / 2, cy = fh * .53, a0 = t * (act ? .5 : .12);
      c.save(); octo(c, fw, fh); c.clip(); c.strokeStyle = 'rgba(255,214,140,.35)'; c.lineWidth = .4; [1.08, .92].forEach(k => { c.beginPath(); c.ellipse(cx, cy, rx * k, ry * k, 0, 0, 7); c.stroke(); });
      for (let k = 0; k < NR; k++) { const a = a0 + k / NR * 6.283, gl = Math.max(0, Math.sin(t * 1.7 - k * .7)) ** 4;
        c.globalAlpha = .45 + .55 * gl; runeG(c, k + 5, cx + Math.cos(a) * rx, cy + Math.sin(a) * ry, fw * .07, gl > .3 ? '#fff0c8' : '#ffc46a'); }
      c.restore(); }
    // край отвору світиться (пульсує)
    c.save(); octo(c, fw, fh); c.strokeStyle = `rgba(230,190,255,${.55 + .25 * Math.sin(t * 2.3)})`; c.lineWidth = 1.1; c.stroke(); c.restore();
  } };
})();

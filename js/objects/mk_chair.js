/* ============================================================================
 * objects/mk_chair.js — КРІСЛО МАРКЕТИНГУ (Nexi сідає й працює)
 * ----------------------------------------------------------------------------
 * Власник (29.10): «до відділу маркетингу додай крісло, на яке Nexi буде сідати»; потім (крок 3): «крісло вийшло якесь
 * калічне — зроби краще в два рази». Тепер це справжнє ГОНОЧНЕ геймерське крісло (рушій піксельного 3D — core/px3d.js,
 * матеріали — objects/arc_kit.js), що ОБЕРТАЄТЬСЯ:
 *   СПИНКА — витягнутий профіль, як у гоночного сидіння: широкі «крила» на плечах, талія, шия, підголівник з двома
 *     прорізами під ремені (справжні дірки), легкий нахил назад. Спереду — стьобана «ромбом» середина, рожеві бокові
 *     валики, вишитий N; ззаду — глянцевий корпус, дві рожеві гоночні смуги, неонова емблема N, кант;
 *   СИДІННЯ — платформа, стьобана подушка, високі бокові валики, заокруглений передній край; подушка під шию;
 *   ПІДЛОКІТНИКИ — стійки й м'які накладки з рожевою смугою; механізм, рожеве LED-кільце (світиться);
 *   ОПОРА — газліфт у кожусі, LED-кільце й хромовий ковпак на маточині, хрестовина з 5 гранених хромованих променів з
 *     рожевою LED-смужкою; під кінцем кожного — шток і ОДНЕ 3D-коліщатко (шина, світне блакитне кільце, хромова маточина).
 * Крок 4 (власник: «криве — ніжки прикольніші, крісло більше, трохи рівніше»): більше, ФРОНТАЛЬНО (зсув sh — як у стола зони),
 * спинка рівніша й нижча, у спокої — рівно (180°).
 * Правки зон · 1 (власник: «колеса в кріслі з багом — там їх по два на деяких ніжках»): замість подвійних «наклейок» — одне
 * справжнє колесо на промінь; ХРЕСТОВИНА СТОЇТЬ (на газліфті крутиться лише верх, як у справжнього крісла) — BASE_TURN.
 * Правки зон · 4 (власник: «зроби у крісла спинку більше — вона якась коротка»): спинка вища в ~1.6 раза (HS .82 -> 1.3) —
 * пропорції справжнього гоночного крісла: підголівник за головою Nexi, коли він сидить лицем до нас; коли працює спиною до
 * нас — спинка ховає його, над нею видно лише антену; у спокої верх спинки не заходить на лічильники екрана будки.
 * Кадр під кут повороту (через 4°) рендериться в растр (z-буфер, контур) і кешується: повний (R 4) — для кутів спокою,
 * грубший (R 2) — поки крісло крутиться. Растр ділиться на ДВА ШАРИ: спинка (і підлокітник, що ближче до глядача) — поверх
 * Nexi, коли вона між ним і глядачем; решта — під ним.
 * API (activities.js -> marketing): ready(), side() — де стати біля крісла, seat() — куди сісти, depth() — глибина Nexi,
 *   turnTo(кут) — повернутись (0 — до глядача, 180 — до екрана, 270 — праворуч), sitDown() / standUp(); foot — слід на
 *   підлозі (Nexi й кіт обходять крісло — world/room.js: route).
 * ========================================================================== */
(() => {
  // власник (29.10, після кроку 3): «прикольне, але якесь криве — ніжки прикольніші, саме крісло більше, трохи рівніше»:
  // K 1.5 -> 2; ФРОНТАЛЬНО, як стіл зони (той самий зсув sh, що й у розкладці: дивимося прямо), спинка рівніша (TILT),
  // у спокої стоїть рівно спинкою до нас (180°). HS — висота спинки в одиницях крісла (профіль PROF задано для 1): крок 4 —
  // .82 (нижча, над нею було видно голову Nexi), Правки зон · 4 — 1.3 (власник: «спинка якась коротка»)
  const X = NX.px3d, A = NX.arc.kit, PL = A.PAL, P = NX.px, FL = 372, R = 4, K = 2, HS = 1.3, { ramp, col } = X;
  let Z = null; const zone = () => Z || (Z = NX.arc.zone && NX.arc.zone('marketing'));
  const centre = () => zone().W(589, 337, -24);                                       // вісь крісла (px картинки зони -> світ)
  let SH0; const SH = () => { if (SH0 === undefined) { const it = ((NX.arcLayout && NX.arcLayout.left && NX.arcLayout.left.items) || []).find(i => i.zone === 'marketing' && i.sh); SH0 = it ? it.sh : null; } return SH0; };
  const shp = p => { const sh = SH(); return sh ? [p[0] + sh[0] * (p[2] - sh[1]), p[1], p[2]] : p; };   // фронтальний зсув точки світу

  // ---------- СПИНКА: профіль лиця (половина праворуч, знизу вгору; [u, h] в одиницях крісла) ----------
  const PROF = [[11.8, 20], [11.7, 22.5], [11.1, 25.5], [10.8, 27.5], [11.3, 29.6], [12.3, 31.4], [12.9, 33.0], [12.6, 34.2], [11.1, 35.0], [8.4, 35.6],
    [7.8, 36.4], [7.6, 39.8], [7.2, 41.2], [6.1, 42.1], [4.2, 42.55], [0, 42.7]];
  const OUT = [...PROF, ...PROF.slice(0, -1).reverse().map(([u, h]) => [-u, h])];   // контур: праворуч угору, ліворуч униз
  const INNER = [[8.2, 20.6], [7.8, 23.5], [7.4, 26.5], [7.7, 29.5], [8.2, 31.7], [7.5, 33.6], [5.6, 34.8], [4.9, 35.9], [4.7, 40.7], [3.8, 41.6], [0, 41.8]];
  const INN = [...INNER, ...INNER.slice(0, -1).reverse().map(([u, h]) => [-u, h])];
  const BW = 12.9, BH0 = 20, BH1 = 42.7, TILT = .07, BV = 9.4, BD = 5.4;              // межі профілю, нахил назад (на од. висоти), площина лиця, товщина
  const hS = h => BH0 + (h - BH0) * HS;                                                // висота спинки в кріслі (профіль задано до HS)
  const slot = (u, h) => Math.abs(Math.abs(u) - 3.2) < .7 && h > 38.4 && h < 40.8;   // прорізи під ремені — наскрізь
  // ---------- текстури спинки (полотно в од. світу: x = (u + BW)·K, y = (BH1 − h)·K·HS) ----------
  const tx = (u, h) => [(u + BW) * K, (BH1 - h) * K * HS];
  const path = (c, pts, mirror = 1) => { c.beginPath(); pts.forEach(([u, h], k) => { const [x, y] = tx(u * mirror, h); k ? c.lineTo(x, y) : c.moveTo(x, y); }); c.closePath(); };
  /** Лице спинки: рожеві бокові валики (глянець), стьобана «ромбом» середина з кантом і пунктиром-строчкою, поперечна строчка
   *  попереку, темні обідки прорізів, вишитий N між ними. */
  const backFront = (c, fw, fh) => {
    let g = c.createLinearGradient(0, 0, fw, 0); g.addColorStop(0, '#5a1458'); g.addColorStop(.12, '#c63aa8'); g.addColorStop(.3, '#7a1c6d'); g.addColorStop(.7, '#7a1c6d'); g.addColorStop(.88, '#a0288d'); g.addColorStop(1, '#4a1048');
    path(c, OUT); c.fillStyle = g; c.fill();
    c.save(); path(c, OUT); c.clip(); c.fillStyle = 'rgba(255,200,240,.22)'; for (let y = 0; y < fh; y += 2.2) c.fillRect(0, y, fw, .35); c.restore();   // фактура шкіри
    path(c, INN); g = c.createLinearGradient(0, 0, 0, fh); g.addColorStop(0, '#2a1a5e'); g.addColorStop(.5, '#1c1146'); g.addColorStop(1, '#140c36'); c.fillStyle = g; c.fill();
    c.save(); path(c, INN); c.clip(); const s = 2.6 * K;                                  // «ромб»: шви й пухкі подушечки
    c.strokeStyle = 'rgba(8,4,24,.85)'; c.lineWidth = .5; for (let k = -12; k < 14; k++) { c.beginPath(); c.moveTo(k * s, 0); c.lineTo(k * s + fh, fh); c.stroke(); c.beginPath(); c.moveTo(k * s, fh); c.lineTo(k * s + fh, 0); c.stroke(); }
    c.fillStyle = 'rgba(120,96,220,.4)'; for (let y = s / 2; y < fh; y += s) for (let x = s / 2 + ((y / s | 0) % 2) * s / 2; x < fw; x += s) c.fillRect(x - .5, y - .9, 1, 1.2);
    c.restore();
    path(c, INN); c.strokeStyle = '#ff4fd8'; c.lineWidth = .8; c.stroke(); c.setLineDash([.7, .7]); c.strokeStyle = 'rgba(255,214,246,.8)'; c.lineWidth = .3; c.stroke(); c.setLineDash([]);
    const [lx0, ly] = tx(-7.4, 27.4), [lx1] = tx(7.4, 27.4); c.setLineDash([.7, .7]); c.strokeStyle = 'rgba(255,170,240,.6)'; c.lineWidth = .3; c.beginPath(); c.moveTo(lx0, ly); c.lineTo(lx1, ly); c.stroke(); c.setLineDash([]);
    [-1, 1].forEach(sd => { const [x, y] = tx(sd * 3.2 - 1.1, 41.3), w = 2.2 * K, h = 3.4 * K * HS; c.fillStyle = '#05030f'; c.fillRect(x, y, w, h); c.fillStyle = 'rgba(255,170,240,.55)'; c.fillRect(x, y + h - .4, w, .4); });   // обідки прорізів
    const [nx, ny] = tx(-1.25, 41.1), nw = 2.5 * K, nh = 2.1 * K * HS; c.strokeStyle = '#ff9af0'; c.lineWidth = .7; c.lineJoin = 'round'; c.beginPath(); c.moveTo(nx, ny + nh); c.lineTo(nx, ny); c.lineTo(nx + nw, ny + nh); c.lineTo(nx + nw, ny); c.stroke();
    path(c, OUT); c.strokeStyle = 'rgba(255,190,240,.7)'; c.lineWidth = .5; c.stroke();
  };
  /** Спинка ззаду: глянцевий корпус (світліше вгорі, відблиск збоку), дві рожеві гоночні смуги з блакитними нитками,
   *  неонова емблема з N, кант по краю, обідки прорізів. */
  const backBack = (c, fw, fh) => {
    let g = c.createLinearGradient(0, 0, 0, fh); g.addColorStop(0, '#3a2a7e'); g.addColorStop(.35, '#241a5a'); g.addColorStop(1, '#120a36');
    path(c, OUT); c.fillStyle = g; c.fill();
    c.save(); path(c, OUT); c.clip();
    g = c.createLinearGradient(0, 0, fw, 0); g.addColorStop(0, 'rgba(255,255,255,0)'); g.addColorStop(.16, 'rgba(200,180,255,.22)'); g.addColorStop(.24, 'rgba(255,255,255,0)'); c.fillStyle = g; c.fillRect(0, 0, fw, fh);   // глянцевий відблиск
    [-1, 1].forEach(sd => { const [x0] = tx(sd > 0 ? 1.9 : -3.7, 0), w = 1.8 * K;         // гоночні смуги
      g = c.createLinearGradient(0, 0, 0, fh); g.addColorStop(0, '#ff9af0'); g.addColorStop(.5, '#ff4fd8'); g.addColorStop(1, '#a0288d'); c.fillStyle = g; c.fillRect(x0, 0, w, fh);
      c.fillStyle = '#9af6ff'; c.fillRect(sd > 0 ? x0 + w + .4 : x0 - .7, 0, .3, fh); });
    const [ex, ey] = tx(0, 30.4), r = 4 * K;                                               // емблема
    c.fillStyle = '#0a0620'; c.beginPath(); c.arc(ex, ey, r, 0, 7); c.fill();
    c.strokeStyle = '#ff4fd8'; c.lineWidth = 1.1; c.beginPath(); c.arc(ex, ey, r * .82, 0, 7); c.stroke(); c.strokeStyle = '#ffd6f6'; c.lineWidth = .35; c.stroke();
    c.strokeStyle = '#3be8ff'; c.lineWidth = 1.2; c.lineJoin = 'round'; const q = r * .38; c.beginPath(); c.moveTo(ex - q, ey + q); c.lineTo(ex - q, ey - q); c.lineTo(ex + q, ey + q); c.lineTo(ex + q, ey - q); c.stroke(); c.strokeStyle = '#e4fdff'; c.lineWidth = .4; c.stroke();
    c.restore();
    [-1, 1].forEach(sd => { const [x, y] = tx(sd * 3.2 - 1.1, 41.3); c.fillStyle = '#05030f'; c.fillRect(x, y, 2.2 * K, 3.4 * K * HS); });
    path(c, OUT); c.strokeStyle = '#ff4fd8'; c.lineWidth = .9; c.stroke(); c.strokeStyle = 'rgba(255,214,246,.8)'; c.lineWidth = .3; c.stroke();
  };
  /** Стьобана подушка сидіння (зверху): «ромб», кант, строчка. */
  const quilt = (c, fw, fh) => { const s = Math.min(fw, fh) / 3.4;
    c.strokeStyle = 'rgba(8,4,24,.8)'; c.lineWidth = .45; for (let k = -8; k < 10; k++) { c.beginPath(); c.moveTo(k * s, 0); c.lineTo(k * s + fh, fh); c.stroke(); c.beginPath(); c.moveTo(k * s, fh); c.lineTo(k * s + fh, 0); c.stroke(); }
    c.fillStyle = 'rgba(140,110,240,.38)'; for (let y = s / 2; y < fh; y += s) for (let x = s / 2 + ((y / s | 0) % 2) * s / 2; x < fw; x += s) c.fillRect(x - .4, y - .4, .8, .8);
    c.setLineDash([.6, .6]); c.strokeStyle = 'rgba(255,190,240,.7)'; c.lineWidth = .3; c.strokeRect(.8, .8, fw - 1.6, fh - 1.6); c.setLineDash([]); };
  /** Валик (зверху / спереду): глянцевий відблиск уздовж і строчка. */
  const roll = (c, fw, fh) => { c.fillStyle = 'rgba(255,214,246,.32)'; c.fillRect(0, fh * .22, fw, fh * .14); c.setLineDash([.6, .6]); c.strokeStyle = 'rgba(255,214,246,.6)'; c.lineWidth = .3; c.beginPath(); c.moveTo(.5, fh * .7); c.lineTo(fw - .5, fh * .7); c.stroke(); c.setLineDash([]); };
  /** Накладка підлокітника (зверху): рожева смуга. */
  const pad = (c, fw, fh) => { c.fillStyle = '#ff4fd8'; c.fillRect(fw * .38, 0, fw * .24, fh); c.fillStyle = '#ffd6f6'; c.fillRect(fw * .46, 0, fw * .08, fh); };

  // частини-коробки: [id, u (середина), v0 (передній край; + — назад), ширина, глибина, низ, верх, матеріал, додатково]
  const PARTS = [
    ['slab', 0, -12.4, 26, 24.2, 15, 18.6, 'shell', { ch: 1.2 }], ['cush', 0, -11.2, 16.8, 20.4, 18.6, 20.6, 'cush', { top: quilt }],
    ['bolL', -10.7, -12, 4.8, 22, 18.6, 22.8, 'pink', { ch: 1.7, top: roll }], ['bolR', 10.7, -12, 4.8, 22, 18.6, 22.8, 'pink', { ch: 1.7, top: roll }],
    ['nose', 0, -14.2, 24.6, 3.2, 15.4, 21, 'pink', { ch: 1.4, front: roll }],
    ['neck', 0, BV + (hS(36) - BH0) * TILT - 2.5, 9, 2.8, hS(34.6), hS(37.7), 'pinkL', { ch: 1.2, front: roll }],
    ['postL', -15.4, 1.2, 3.2, 3.4, 15.6, 27.4, 'steel'], ['postR', 15.4, 1.2, 3.2, 3.4, 15.6, 27.4, 'steel'],
    ['brkL', -14, .9, 3.6, 4, 15.4, 17.2, 'steel'], ['brkR', 14, .9, 3.6, 4, 15.4, 17.2, 'steel'],
    ['padL', -15.4, -7.4, 5.6, 12.6, 27.2, 29.8, 'arm', { ch: 1.1, top: pad }], ['padR', 15.4, -7.4, 5.6, 12.6, 27.2, 29.8, 'arm', { ch: 1.1, top: pad }],
    ['mech', 0, -7.2, 14.4, 14.4, 13.3, 15, 'steel'], ['ring', 0, -11.4, 22.8, 22.8, 12.6, 13.4, 'led', { cyl: 28 }],
    ['lift', 0, -2.2, 4.4, 4.4, 7.5, 13.3, 'chrome', { cyl: 16 }], ['cover', 0, -3.3, 6.6, 6.6, 3.4, 8.6, 'dark', { cyl: 16, kt: .78, base: 1 }],
    ['hub', 0, -3.8, 7.6, 7.6, 2.6, 4.6, 'dark', { cyl: 18, base: 1 }], ['hring', 0, -4.4, 8.8, 8.8, 4.6, 5.2, 'led', { cyl: 24, base: 1 }], ['cap', 0, -3.4, 6.8, 6.8, 5.2, 6.4, 'chrome', { cyl: 18, kt: .8, base: 1 }],
  ];   // base — частина хрестовини: стоїть, не крутиться з сидінням (BASE_TURN)
  const MAT = { shell: { pal: PL.DESK, q: .5, bev: .8 }, cush: { pal: PL.DESK, q: .56, bev: .7 }, pink: { pal: PL.PINKP, q: .5, bev: 1 }, pinkL: { pal: PL.PINKP, q: .64, bev: .9 },
    arm: { pal: PL.MET, q: .4, bev: .7 }, steel: { pal: PL.STEEL, q: .6, bev: .5 }, chrome: { pal: PL.CHROME, q: .58, metal: 1, bev: 0 }, dark: { pal: PL.DARK, q: .62, bev: .4 },
    led: { pal: PL.PINKP, q: .92, emit: 1, bev: 0 } };
  const BACK_ID = PARTS.length + 1, LEG_ID = BACK_ID + 1, WHEEL_ID = LEG_ID + 1;

  // ---------- ХРЕСТОВИНА Й КОЛІЩАТКА ----------
  // Власник (29.10, після кроку 4): «колеса в кріслі з багом — там їх по два на деяких ніжках». Було подвійне коліщатко: два
  // плоскі диски лицем до ока обабіч вилки — на променях, що дивляться на нас, вони стояли поруч (два кола), на бічних збігались
  // (одне), а під час обертання то роз'їжджались, то злипались. Тепер на кожному промені ОДНЕ справжнє 3D-колесо під кінцем
  // променя, на хромованому штоку. Хрестовина СТОЇТЬ (BASE_TURN), як у справжнього крісла: на газліфті крутиться лише верх —
  // тож коліщатка завжди однакові й не «мерехтять», коли крісло повертається.
  const BASE_TURN = 180, LEG0 = .9425;                 // поворот хрестовини (LEG0 — кут першого променя): один промінь — рівно назад, за опорою
  const TIP = [3.5, 4.4];                              // низ і верх кінця променя (над коліщатком — шток)
  const WR = 1.6, WW = 1.6, WC = 15.6, WN = 16;         // коліщатко: радіус, ширина, де стоїть на промені, граней по колу
  const SPLAY = .5;                                    // коліщатка трохи розвернуті назовні (рад): видно й бік, і протектор — об'єм
  /** Бік колеса (u, v — 0..1 по квадрату довкола кола): шина з відблиском угорі, світне блакитне кільце, хромова маточина з болтом. */
  const wheelSide = (u, v, i, j) => { const dd = Math.hypot(u - .5, v - .5);
    if (dd > .4) return ramp(PL.DARK, .34 + (v < .42 ? .22 : 0) + (u < .42 && v < .42 ? .08 : 0), i, j);
    if (dd > .26) { X.SH.fl |= X.F_EMIT; return col(dd > .33 ? '#3be8ff' : '#bff8ff'); }
    if (dd < .07) return ramp(PL.DARK, .5, i, j);
    return ramp(PL.CHROME, .8 - dd * 1.6 + (u < .5 && v < .5 ? .08 : 0), i, j); };
  /** КОЛІЩАТКО — справжнє 3D-колесо (два боки + протектор з WN граней) на підлозі в точці (cu, cv) крісла; (au, av) — вісь у
   *  плані (одинична, в осях крісла); P(u, v, h) — точка крісла -> світ. Протектор — темна гума, світліша згори й по середині. */
  function wheel(L, P, cu, cv, au, av) {
    const eu = -av, ev = au, pt = (c, s, w) => P(cu + eu * WR * c + au * w, cv + ev * WR * c + av * w, WR * (1 + s));
    const hub = pt(0, 0, 0), ring = w => Array.from({ length: WN }, (_, k) => { const t = (k + .5) / WN * Math.PI * 2; return pt(Math.cos(t), Math.sin(t), w); });
    const nOut = poly => { let n = X.newell(poly); const m = poly.reduce((s, p) => [s[0] + p[0], s[1] + p[1], s[2] + p[2]], [0, 0, 0]).map(q => q / poly.length);
      if (X.dot(n, X.sub(m, hub)) < 0) n = n.map(q => -q); const l = Math.hypot(...n) || 1; return n.map(q => q / l); };
    const R1 = ring(WW / 2), R0 = ring(-WW / 2);
    for (const [poly, w] of [[R1, WW / 2], [R0, -WW / 2]]) { const O = pt(-1, 1, w);
      X.face(L, poly, O, X.sub(pt(1, 1, w), O), X.sub(pt(-1, -1, w), O), wheelSide, { id: WHEEL_ID, fid: WHEEL_ID, n: nOut(poly) }); }
    for (let k = 0; k < WN; k++) { const poly = [R1[k], R1[(k + 1) % WN], R0[(k + 1) % WN], R0[k]], up = Math.sin((k + 1) / WN * Math.PI * 2);
      X.face(L, poly, poly[0], X.sub(poly[3], poly[0]), X.sub(poly[1], poly[0]), (u, v, i, j) => ramp(PL.DARK, .3 + up * .28 + (u > .44 && u < .56 ? .12 : 0), i, j),
        { id: WHEEL_ID, fid: WHEEL_ID, n: nOut(poly) }); }
  }
  // КЕШ КАДРІВ: повний (R = 4) — для кутів, на яких крісло стоїть (180, 270, 0 закріплені — малюються заздалегідь, у спокої),
  // і грубший (R = 2, учетверо дешевший: ~4 мс замість ~15) — поки крісло обертається (за рухом різниці не видно)
  const keyOf = a => ((Math.round(a / 4) * 4) % 360 + 360) % 360;                    // кадри — через 4°
  const HI = new Map(), LO = new Map(), PIN = [180, 270, 0].map(keyOf), TX = new Map(), LS = {}; let box = null;
  const put = (M, k, v, cap) => { M.set(k, v); if (M.size > cap) for (const q of M.keys()) if (!(M === HI && PIN.includes(q))) { M.delete(q); break; } };
  /** Текстура грані не залежить від кута — малюється раз (ключ — частина й грань). */
  const texOf = (key, B, Fc, paint) => { if (!TX.has(key)) TX.set(key, A.texture(B, Fc, R, paint)); return TX.get(key); };

  /** Витягнутий профіль спинки: грані лиця, тилу й боків (k, poly, O, A, B, n, fw, fh) для кута key. */
  function backFaces(b) {
    const V = (u, h, bk) => b.P(u * K, (BV + (hS(h) - BH0) * TILT + (bk ? BD : 0)) * K, FL - hS(h) * K);
    const fr = OUT.map(([u, h]) => V(u, h, 0)), bk = OUT.map(([u, h]) => V(u, h, 1)), out = [], sub = (p, q) => [p[0] - q[0], p[1] - q[1], p[2] - q[2]];
    const orient = (poly, ref) => { let n = X.newell(poly); const m = poly.reduce((s, p) => [s[0] + p[0] / poly.length, s[1] + p[1] / poly.length, s[2] + p[2] / poly.length], [0, 0, 0]), d = sub(m, ref);
      if (n[0] * d[0] + n[1] * d[1] + n[2] * d[2] < 0) n = [-n[0], -n[1], -n[2]]; const l = Math.hypot(...n) || 1; return [n[0] / l, n[1] / l, n[2] / l]; };
    const mid = V(0, 30, 0), cen = [(mid[0] + V(0, 30, 1)[0]) / 2, (mid[1] + V(0, 30, 1)[1]) / 2, (mid[2] + V(0, 30, 1)[2]) / 2];
    { const O = V(-BW, BH1, 0); out.push({ k: 'front', poly: fr, O, A: sub(V(BW, BH1, 0), O), B: sub(V(-BW, BH0, 0), O), fw: 2 * BW * K, fh: (BH1 - BH0) * K * HS, n: orient(fr, cen), side: 'f' }); }
    { const O = V(BW, BH1, 1); out.push({ k: 'back', poly: bk.slice().reverse(), O, A: sub(V(-BW, BH1, 1), O), B: sub(V(BW, BH0, 1), O), fw: 2 * BW * K, fh: (BH1 - BH0) * K * HS, n: orient(bk, cen), side: 'b' }); }
    for (let i = 0; i < OUT.length; i++) { const j = (i + 1) % OUT.length, poly = [fr[i], fr[j], bk[j], bk[i]], len = Math.hypot(...sub(fr[j], fr[i]));
      if (len < .05) continue; out.push({ k: 'left', poly, O: fr[i], A: sub(fr[j], fr[i]), B: sub(bk[i], fr[i]), fw: len, fh: BD * K, n: orient(poly, cen), side: 's' }); }
    return out;
  }

  /** Растр крісла під кут a (градуси): {back, front} — два полотна (позаду / попереду Nexi), x0, y0, w, h (од. кімнати).
   *  lo — грубший растр (під час обертання); якщо цей кут уже є в повному — береться він. */
  function render(a, lo) {
    const key = keyOf(a); if (HI.has(key)) return HI.get(key); if (lo && LO.has(key)) return LO.get(key);
    const r = lo ? 2 : R, C = centre(), b = A.basis({ x: C[0], z: C[2], turn: key, sh: SH() }), Pt = (u, v, h) => b.P(u * K, v * K, FL - h * K);
    const b0 = A.basis({ x: C[0], z: C[2], turn: key }), b0s = A.basis({ x: C[0], z: C[2], turn: BASE_TURN });   // без зсуву: частини-коробки зсуваються самі (B.sh); b0s — хрестовина (стоїть)
    if (!box) {                                                                        // межі растра — одні на всі кути: найдальша точка крісла від осі ~20.6 од.
      const pts = []; for (let q = 0; q < 8; q++) { const an = q / 8 * Math.PI * 2; [0, hS(BH1) + 2.5].forEach(h => pts.push(X.proj(shp([C[0] + Math.cos(an) * 22 * K, FL - h * K, C[2] + Math.sin(an) * 22 * K])))); }   // до верху спинки (hS(BH1)) із запасом
      box = [Math.min(...pts.map(p => p[0])) - 3, Math.min(...pts.map(p => p[1])) - 3, Math.max(...pts.map(p => p[0])) + 3, Math.max(...pts.map(p => p[1])) + 3];
    }
    const L = LS[r] || (LS[r] = X.Layer(box[0], box[1], box[2], box[3], r)); L.c.fill(0); L.dep.fill(Infinity); L.id.fill(0); L.fid.fill(0); L.fl.fill(0);
    const front = new Set(), zc = C[2], Bx = { yb: FL - 20 * K };
    // спинка (витягнутий профіль): прорізи — наскрізь; боки — темніша шкіра з рожевим кантом спереду
    const BF = backFaces(b), bmid = Pt(0, BV + BD / 2 + 1.6, 0); if (bmid[2] < zc - 1.5) { front.add(BACK_ID); front.add(PARTS.findIndex(p => p[0] === 'neck') + 1); }
    BF.forEach(Fc => {
      if (!A.visible(Fc)) return;
      if (Fc.side === 's') { const base = A.shader('chair', Fc, Bx, { pal: PL.PINKP, q: .34, bev: .25 }); X.face(L, Fc.poly, Fc.O, Fc.A, Fc.B, (u, v, i, j, t) => v < .2 ? col(v < .1 ? '#ff9af0' : '#ff4fd8') : base(u, v, i, j, t), { id: BACK_ID, fid: BACK_ID, n: Fc.n }); return; }
      const tex = texOf('back' + Fc.side, Bx, Fc, Fc.side === 'f' ? backFront : backBack), base = A.shader('chair', Fc, Bx, { pal: PL.DESK, q: .5, bev: .3, tex }), mir = Fc.side === 'f' ? 1 : -1;
      X.face(L, Fc.poly, Fc.O, Fc.A, Fc.B, (u, v, i, j, t) => slot(mir * (-BW + u * 2 * BW), BH1 - v * (BH1 - BH0)) ? 0 : base(u, v, i, j, t), { id: BACK_ID, fid: BACK_ID, n: Fc.n });
    });
    PARTS.forEach(([nm, u, v0, w, d, h0, h1, mat, ex = {}], n) => {
      const id = n + 1, p0 = (ex.base ? b0s : b0).P(u * K, v0 * K, 0), B = { x: p0[0], z: p0[2], turn: ex.base ? BASE_TURN : key, sh: SH(), w: w * K, dep: d * K, yb: FL - h0 * K, yt: FL - h1 * K, ch: ex.ch ? [ex.ch * K, ex.ch * K] : null, cyl: ex.cyl, kt: ex.kt, id: 'chair_' + nm };
      const mid = Pt(u, v0 + d / 2, 0); if (/^pad|^post/.test(nm) && mid[2] < zc - 7) front.add(id);
      for (const Fc of A.faces(B)) {
        if (!A.visible(Fc)) continue;
        const paint = Fc.k === 'top' ? ex.top : Fc.k === 'front' ? ex.front : null, tex = paint ? texOf(nm + Fc.k, B, Fc, paint) : null;
        const sh = A.shader('chair', Fc, B, Object.assign({ bev: .9, ins: 0, fog: 0 }, MAT[mat], { tex }));
        X.face(L, Fc.poly, Fc.O, Fc.A, Fc.B, sh, { id, fid: id, n: Fc.n });
      }
    });
    // ХРЕСТОВИНА (власник: «ніжки прикольніше»): 5 гранених хромованих променів, що звужуються до кінця, по верху кожного —
    // рожева LED-смужка; під кінцем кожного — хромований шток і ОДНЕ коліщатко (wheel; вісь — майже на глядача, трохи назовні:
    // видно бік зі світним кільцем і протектор). Стоїть: базис BASE_TURN, а не кут сидіння
    const LEG = (u0, v0, i, j, side) => side === 't' ? (u0 > .4 && u0 < .6 && v0 > .08 && v0 < .92 ? (X.SH.fl |= X.F_EMIT, col(u0 > .46 && u0 < .54 ? '#ffd6f6' : '#ff4fd8')) : ramp(PL.CHROME, .42 + (1 - Math.abs(u0 - .5) * 2) * .4 - v0 * .08, i, j))
      : side === 'c' ? ramp(PL.STEEL, .55, i, j) : ramp(PL.CHROME, .18 + (1 - v0) * .2 + (side === 'a' ? .1 : 0), i, j);
    const sub = X.sub, bs = A.basis({ x: C[0], z: C[2], turn: BASE_TURN, sh: SH() }), Pb = (u, v, h) => bs.P(u * K, v * K, FL - h * K);
    const stem = (u0, v0, i, j) => ramp(PL.CHROME, .45 + (1 - Math.abs(u0 - .5) * 2) * .35, i, j);
    for (let q = 0; q < 5; q++) {
      const an = q / 5 * Math.PI * 2 + LEG0, cs = Math.cos(an), sn = Math.sin(an), V = (r, o, h) => Pb(cs * r - sn * o, sn * r + cs * o, h);
      const A0t = V(2.6, -1.9, 5), B0t = V(2.6, 1.9, 5), A1t = V(16, -1.15, TIP[1]), B1t = V(16, 1.15, TIP[1]), A0b = V(2.6, -1.9, 2.8), B0b = V(2.6, 1.9, 2.8), A1b = V(16, -1.15, TIP[0]), B1b = V(16, 1.15, TIP[0]);
      const mid = V(9, 0, 3.6), fc = (poly, O, Ax, Bx2, side) => { let n = X.newell(poly); const m = poly.reduce((a, p) => [a[0] + p[0] / 4, a[1] + p[1] / 4, a[2] + p[2] / 4], [0, 0, 0]), d = sub(m, mid); if (n[0] * d[0] + n[1] * d[1] + n[2] * d[2] < 0) n = n.map(v => -v); const l = Math.hypot(...n) || 1; n = n.map(v => v / l);
        const F = { poly, n }; if (A.visible(F)) X.face(L, poly, O, sub(Ax, O), sub(Bx2, O), (u0, v0, i, j) => LEG(u0, v0, i, j, side), { id: LEG_ID, fid: LEG_ID, n }); };
      fc([A0t, B0t, B1t, A1t], A0t, B0t, A1t, 't'); fc([A0t, A1t, A1b, A0b], A0t, A1t, A0b, 'a'); fc([B0t, B0b, B1b, B1t], B0t, B1t, B0b, 'b'); fc([A1t, B1t, B1b, A1b], A1t, B1t, A1b, 'c');
      X.tube(L, V(WC, 0, TIP[0] + .3), V(WC, 0, 2 * WR - .2), .75 * K, stem, { id: LEG_ID, fid: LEG_ID });   // шток: з кінця променя в колесо
      wheel(L, Pb, cs * WC, sn * WC, -Math.sign(cs) * Math.sin(SPLAY), Math.cos(SPLAY));                       // вісь — майже на глядача (у базисі BASE_TURN +v дивиться на нас; +u — ліворуч на екрані)
    }
    X.outline(L, () => A.C.out, lo ? 1 : 2);
    // ділимо растр на два шари: позаду Nexi (сидіння, опора, …) і попереду (спинка, коли вона між ним і глядачем); полотна —
    // лише розміром з намальоване (менше пам'яті в кеші й менше роботи drawImage щокадру)
    let i0 = L.W, i1 = -1, j0 = L.H, j1 = -1;
    for (let j = 0; j < L.H; j++) for (let i = 0, k = j * L.W; i < L.W; i++, k++) if (L.c[k]) { if (i < i0) i0 = i; if (i > i1) i1 = i; if (j < j0) j0 = j; if (j > j1) j1 = j; }
    if (i1 < 0) { i0 = j0 = 0; i1 = j1 = 0; }
    const W2 = i1 - i0 + 1, H2 = j1 - j0 + 1;
    const mk = sel => { const cv = document.createElement('canvas'); cv.width = W2; cv.height = H2; const x = cv.getContext('2d'), im = x.createImageData(W2, H2), d = new Uint32Array(im.data.buffer);
      for (let j = j0; j <= j1; j++) for (let i = i0, k = j * L.W + i0, o = (j - j0) * W2; i <= i1; i++, k++, o++) if (L.c[k] && sel(L.id[k])) d[o] = L.c[k];
      x.putImageData(im, 0, 0); return cv; };
    const out = { back: mk(id => !front.has(id)), front: mk(id => front.has(id)), x0: L.x0 + i0 / r, y0: L.y0 + j0 / r, w: W2 / r, h: H2 / r };
    if (lo) put(LO, key, out, 40); else put(HI, key, out, 10);
    return out;
  }

  NX.addObject({
    id: 'mkChair', name: 'obj.marketing', act: 'marketing',
    a: 180, tgt: 180, seated: false, idleT: 4,
    ready() { return !!zone(); },
    /** Точка підлоги під серединою крісла (екран) і глибина — для порядку малювання з Nexi. */
    floor() { return X.proj(shp(centre())); },
    depth() { return this.floor()[1]; },
    side() { const f = this.floor(), ft = this.foot; return [(ft ? ft[1] : f[0] + 40) + 15, Math.max(362, f[1] + 6)]; },   // праворуч від сліду крісла
    seat() { const C = centre(); return X.proj(shp([C[0], FL - 21 * K, C[2] + 2])); },
    /** Слід на підлозі (екран): коло хрестовини з коліщатками — Nexi й кіт обходять (world/room.js: route). */
    get foot() { if (!zone()) return null; if (!this._foot) { const C = centre(), pts = []; for (let q = 0; q < 16; q++) { const an = q / 16 * Math.PI * 2; pts.push(X.proj(shp([C[0] + Math.cos(an) * 17.5 * K, FL, C[2] + Math.sin(an) * 17.5 * K]))); }
      this._foot = [Math.min(...pts.map(p => p[0])), Math.max(...pts.map(p => p[0])), Math.min(...pts.map(p => p[1])), Math.max(...pts.map(p => p[1]))]; } return this._foot; },
    turnTo(deg) { let d = deg; while (d - this.a > 180) d -= 360; while (d - this.a < -180) d += 360; this.tgt = d; },
    spin(deg) { this.tgt = this.a + deg; },                                                 // повний оберт (на радощах)
    sitDown() { this.seated = true; }, standUp() { this.seated = false; this.turnTo(180); },
    get span() { const f = zone() && this.floor(); return f ? [f[0] - 56, f[0] + 56] : null; },
    get hit() { if (!zone()) return null; const f = this.floor(), C = centre(), top = X.proj(shp([C[0], FL - (hS(BH1) + 1) * K, C[2] + BV * K]))[1]; return { x: f[0] - 32, y: top, w: 64, h: f[1] + 2 - top }; },   // від підлоги до верху спинки
    update(dt, t) {
      if (!zone()) return;
      if (NX.loop.frames > 120 && !this.warm) { const k = PIN.find(q => !HI.has(q)); if (k === undefined) this.warm = true; else render(k, false); }   // кути спокою — заздалегідь, по одному за кадр
      const d = this.tgt - this.a, sp = (90 + Math.abs(d) * 5) * dt; this.a = Math.abs(d) <= sp ? this.tgt : this.a + Math.sign(d) * sp;
      if (!this.seated && Math.abs(d) < .5) { this.idleT -= dt; if (this.idleT < 0) { this.idleT = 6 + Math.random() * 6; this.turnTo(180 + (Math.random() < .5 ? 0 : (Math.random() - .5) * 10)); } }   // у спокої — рівно, лише зрідка ледь повертається
      const n = NX.nexi;
      if (this.seated && n.loc === 'mkChair') {                                             // Nexi їде разом із кріслом: спиною / лицем / боком
        const r = this.a * Math.PI / 180, fx = -Math.sin(r), fz = -Math.cos(r); n.back = fz > .2; if (Math.abs(fx) > .55) n.dir = fx > 0 ? 1 : -1;
        if (!(n.cur && (n.cur.hop || n.cur.fly))) { const s = this.seat(); n.x = s[0]; n.y = s[1]; }
      }
    },
    layers(t) {
      if (!zone()) return [];
      const fr = render(this.a, Math.abs(this.tgt - this.a) > 12), f = this.floor(), y = f[1], act = NX.objects.marketing && NX.objects.marketing.active, lit = .55 + .25 * Math.sin(t * 2.4) + (act ? .25 : 0);
      const draw = cv => c => { c.save(); c.imageSmoothingEnabled = true; c.drawImage(cv, fr.x0, fr.y0, fr.w, fr.h); c.restore(); };
      return [
        { y: y - .5, draw: c => { c.save(); c.fillStyle = 'rgba(4,2,14,.55)'; c.beginPath(); c.ellipse(f[0], f[1] + .5, 36, 5.2, 0, 0, 7); c.fill(); c.restore();
          P.glow(c, f[0], f[1] - 5, 40, 'rgba(255,79,216,.8)', lit * .55); P.glow(c, f[0], f[1] + 1, 26, 'rgba(59,232,255,.7)', lit * .3); draw(fr.back)(c); } },
        { y: y + .5, draw: draw(fr.front) },
      ];
    },
  });
})();

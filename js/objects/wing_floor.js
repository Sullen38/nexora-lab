/* ============================================================================
 * objects/wing_floor.js — ГЛЯНЦЕВА ПІДЛОГА: віддзеркалення, ПЛИТКА ЗІ ШВАМИ, КАЛЮЖІ СВІТЛА (№7) + сяйво крила
 * ----------------------------------------------------------------------------
 * ВІДДЗЕРКАЛЕННЯ (як у дивана): під столами трьох зон, кріслами й рослинами підлога відбиває те,
 *   що на ній стоїть: раз на 4 кадри кадр крила (столи з речами — NX.kit.reflectors, крісла,
 *   кавомашина, куток кота, рослини на підлозі) малюється в окреме полотно, перевертається від
 *   лінії підлоги й кладеться напівпрозоро. №7 «чіткіше відбиття біля предметів»: біля лінії
 *   контакту відбиття щільне й без смуг, далі швидко згасає, а смуги глянцю («патьоки») з'являються
 *   лише на віддалі. Nexi й кіт відбиваються через refl:true у loop.js — їх тут не чіпаємо.
 * ПЛИТКА ЗІ ШВАМИ (№7): уся передня підлога кімнати й смуга підлоги під столами крила — великі
 *   глянцеві плити в перспективі: шви вглиб сходяться до точки, з якою узгоджено масштаб персонажів
 *   (NX.room.scaleAt), поперечні шви густіші вдалині; кожна плита трохи свого тону, ближня кромка
 *   шва ловить світло. Праворуч від крила (там підлога картинки) плитка проступає плавно.
 * КАЛЮЖІ СВІТЛА ПІД НЕОНОМ (№7): піксельні плями (4 рівні яскравості з дизерингом, нерівний край)
 *   під рожевим неоном столів (кілька нерівних плям уздовж кожного), під RGB AI-ядра, під трубками
 *   опор і LED тумби, перед лежанкою Рудика.
 * Плитка й калюжі ЗАПІКАЮТЬСЯ в полотна, які й так малюються щокадру (кадр не дорожчає):
 *   передня підлога кімнати — NX.room.frontFx (world/room.js, 1 px/од.), смуга під столами —
 *   NX.wing.floorFx (растр підлоги крила, wing_wall.js). Відбиття лягає поверх (як на мокрому глянці).
 * Лінія підлоги: під столом AI-центру 362, далі 346 (аналітика) і 338 (маркетинг).
 * ========================================================================== */
(() => {
  const P = NX.px, K = NX.kit, F = NX.furn, BAYER = NX.art.BAYER, X0 = 0, X1 = 680, Y0 = 240, H = 130;
  const LINES = [[X0, 326, 362], [326, 486, 346], [486, 664, 338]];              // [x0, x1, лінія підлоги] під столами
  let CV = null, cx = null, fr = 0, ST = null;

  /* ---------------- ПЛИТКА ---------------- */
  // шви вглиб сходяться до (774, −31): саме так у кімнаті ростуть персонажі (NX.room.scaleAt) — плитка з ними узгоджена;
  // ширина плити на лінії 352 — 30 од.; поперечні шви — на рівних кроках глибини: y = yv + A / u (u — ціле)
  const TV = { xv: 774, yv: -31, w0: 30, y0: 352, A: 16000 };
  const seamX = (m, y) => TV.xv + m * TV.w0 * (y - TV.yv) / (TV.y0 - TV.yv), rowY = u => TV.yv + TV.A / u;
  /** Плитка в контекст c (координати кімнати) для смуги y0..y1: тони плит, шви (темні щілини), світлі ближні кромки.
   *  lw — товщина шва (од.); fade — плитка проступає від y fade[0] до fade[1] (на підлозі картинки праворуч). */
  function paintTiles(c, y0, y1, lw, fade) {
    const W = NX.cfg.ROOM_W, uTop = Math.ceil(TV.A / (y0 - TV.yv)) + 1, uBot = Math.max(2, Math.floor(TV.A / (y1 - TV.yv))), mMin = -40, mMax = 40;
    c.save();
    for (let u = uBot; u <= uTop; u++) {                                         // тони плит: кожна плита — свій відтінок (темніша / з лавандовим полиском)
      const ya = Math.max(y0, rowY(u + 1)), yb = Math.min(y1, rowY(u)); if (yb <= ya) continue;
      for (let m = mMin; m < mMax; m++) {
        const xa0 = seamX(m, ya), xa1 = seamX(m + 1, ya), xb0 = seamX(m, yb), xb1 = seamX(m + 1, yb);
        if (Math.max(xa1, xb1) < 0 || Math.min(xa0, xb0) > W) continue;
        const h = P.hash(m * 31 + u * 7); if (h >= .3 && h <= .62) continue;
        const a = h > .62 ? .03 + (h - .62) * .09 : .05 + (.3 - h) * .22, k = fade ? P.clamp(((ya + yb) / 2 - fade[0]) / (fade[1] - fade[0]), 0, 1) : 1;
        c.fillStyle = h > .62 ? `rgba(150,120,255,${a * k})` : `rgba(0,0,14,${a * k})`;
        c.beginPath(); c.moveTo(xa0, ya); c.lineTo(xa1, ya); c.lineTo(xb1, yb); c.lineTo(xb0, yb); c.fill();
      }
    }
    const seams = new Path2D(), hi = new Path2D();                               // шви: вглиб і поперечні; світла кромка — трохи нижче поперечного шва
    for (let m = mMin; m <= mMax; m++) { const a = seamX(m, y0), b = seamX(m, y1); if (Math.max(a, b) < -50 || Math.min(a, b) > W + 50) continue; seams.moveTo(a, y0); seams.lineTo(b, y1); }
    for (let u = uBot; u <= uTop; u++) { const y = rowY(u), d = lw * .5 + .35 + (y - 336) * .004; if (y < y0 || y > y1) continue; seams.moveTo(-10, y); seams.lineTo(W + 10, y); hi.moveTo(-10, y + d); hi.lineTo(W + 10, y + d); }
    const grad = (rgb, a) => { if (!fade) return `rgba(${rgb},${a})`; const g = c.createLinearGradient(0, fade[0], 0, fade[1]); g.addColorStop(0, `rgba(${rgb},0)`); g.addColorStop(1, `rgba(${rgb},${a})`); return g; };
    c.lineWidth = lw; c.strokeStyle = grad('4,2,18', .52); c.stroke(seams);
    c.lineWidth = lw * .8; c.strokeStyle = grad('170,140,255', .14); c.stroke(hi);
    c.restore();
  }

  /* ---------------- КАЛЮЖІ СВІТЛА ---------------- */
  // x, y — центр; rx, ry — піврозміри; up — наскільки найяскравіше місце зсунуте до джерела (вгору); rgb, k — сила; ph — зерно форми
  const PK = [255, 79, 216], CY = [59, 232, 255];
  const PUDDLES = [
    // рожевий неон плит столів: кілька плям уздовж кожного стола (нерівні калюжі, а не рівна смуга)
    { x: 62, y: 367, rx: 38, ry: 7.5, up: .5, rgb: PK, k: .78, ph: 0 }, { x: 142, y: 367.5, rx: 46, ry: 8.5, up: .5, rgb: PK, k: .85, ph: .7 },
    { x: 212, y: 367, rx: 40, ry: 8, up: .5, rgb: PK, k: .8, ph: 1.4 }, { x: 296, y: 366.5, rx: 30, ry: 7, up: .5, rgb: PK, k: .72, ph: 2 },
    { x: 360, y: 350.5, rx: 34, ry: 6, up: .5, rgb: PK, k: .75, ph: 2.6 }, { x: 420, y: 351, rx: 40, ry: 6.5, up: .5, rgb: PK, k: .8, ph: 3.1 }, { x: 472, y: 350.5, rx: 22, ry: 5.5, up: .5, rgb: PK, k: .7, ph: 3.7 },
    { x: 522, y: 342.5, rx: 34, ry: 5.5, up: .5, rgb: PK, k: .75, ph: 4.2 }, { x: 590, y: 343, rx: 44, ry: 6, up: .5, rgb: PK, k: .8, ph: 4.8 }, { x: 645, y: 342.5, rx: 22, ry: 5, up: .5, rgb: PK, k: .7, ph: 5.3 },
    { x: 264, y: 367.5, rx: 26, ry: 6, up: .45, rgb: CY, k: .6, ph: 3 }, { x: 266, y: 368, rx: 18, ry: 4.5, up: .45, rgb: PK, k: .45, ph: 3.5 },   // RGB AI-ядра: блакитне й рожеве
    { x: 39, y: 366, rx: 14, ry: 4.5, up: .45, rgb: CY, k: .75, ph: 4 }, { x: 314, y: 366, rx: 12, ry: 4.5, up: .45, rgb: CY, k: .75, ph: 4.6 },   // неонові трубки опор
    { x: 123, y: 366, rx: 28, ry: 3.6, up: .5, rgb: CY, k: .5, ph: 5.2 },                       // LED під тумбою
    { x: 60, y: 406.5, rx: 30, ry: 4.5, up: .45, rgb: PK, k: .6, ph: 6 },                       // неоновий кант лежанки Рудика
  ];
  /** Піксельна калюжа: 4 рівні яскравості з дизерингом Байєра, край нерівний (шум), найяскравіше — ближче до джерела. */
  function bakePuddle(p) {
    const R2 = 2, pad = 2, w = Math.ceil((p.rx + pad) * 2 * R2), h = Math.ceil((p.ry + pad) * 2 * R2), cv = document.createElement('canvas'); cv.width = w; cv.height = h;
    const x = cv.getContext('2d'), im = x.createImageData(w, h), d = im.data, [r, g, b] = p.rgb;
    for (let j = 0; j < h; j++) for (let i = 0; i < w; i++) {
      const X = i / R2 - p.rx - pad, Y = j / R2 - p.ry - pad, wob = 1 + .16 * (K.vn(X * .12 + p.ph * 3, Y * .5) - .5) * 2;
      const q = Math.hypot(X / p.rx, (Y + p.ry * p.up) / (p.ry * (1 + p.up))) * wob; if (q >= 1) continue;
      const I = (1 - q) ** 1.4, lv = Math.floor(I * 4 + BAYER[(j & 3) * 4 + (i & 3)] + .5) / 4; if (lv <= 0) continue;
      const n = (j * w + i) * 4; d[n] = r; d[n + 1] = g; d[n + 2] = b; d[n + 3] = Math.round(255 * Math.min(1, lv));
    }
    x.putImageData(im, 0, 0); p.cv = cv; p.w = w / R2; p.h = h / R2; p.ox = p.rx + pad; p.oy = p.ry + pad;
  }
  /** Калюжі світлом у контекст c (координати кімнати). Відбиття потім лягає поверх (.4), тож тут трохи яскравіше.
   *  list — свій перелік калюж (праве крило — objects/rwing_floor.js), за замовчуванням — калюжі лівого крила. */
  function paintPuddles(c, list = PUDDLES) {
    c.save(); c.globalCompositeOperation = 'lighter'; c.imageSmoothingEnabled = false;
    list.forEach(p => { if (!p.cv) bakePuddle(p); c.globalAlpha = Math.min(1, p.k * 1.3); c.drawImage(p.cv, p.x - p.ox, p.y - p.oy, p.w, p.h); });
    c.restore();
  }
  NX.wing.paintTiles = paintTiles; NX.wing.paintPuddles = paintPuddles;           // праве крило кладе ту саму плитку й калюжі у свою підлогу (rwing_floor.js)
  // ЗАПІКАННЯ: передня підлога кімнати (room.js кличе при кожній перебудові — зміна розміру, латка крила)
  NX.room.frontFx = (c, x0, x1, front) => {
    const lw = 1 / NX.room.FR, H2 = NX.cfg.ROOM_H, y1 = H2 + front + 2;                                // шов — 1 піксель полотна (на телефоні — 8-bit «драбинкою», як і вся передня підлога)
    const RX = 891;                                                                                    // праве крило (кодом) — від x 891
    if (x0 < 664) { c.save(); c.beginPath(); c.rect(x0, H2, Math.min(x1, 664) - x0, front + 2); c.clip(); paintTiles(c, H2, y1, lw); c.restore(); }   // ліве крило: плитка без переходу
    if (x1 > 664 && x0 < RX) { c.save(); c.beginPath(); c.rect(Math.max(x0, 664), H2, Math.min(x1, RX) - Math.max(x0, 664), front + 2); c.clip(); paintTiles(c, H2, y1, lw, [H2, H2 + 46]); c.restore(); }   // під вікном і диваном (підлога картинки): плитка проступає плавно
    if (x1 > RX) { c.save(); c.beginPath(); c.rect(Math.max(x0, RX), H2, x1 - Math.max(x0, RX), front + 2); c.clip(); paintTiles(c, H2, y1, lw); c.restore(); }   // праве крило: плитка без переходу
    paintPuddles(c); if (NX.rwing && NX.rwing.PUDDLES) paintPuddles(c, NX.rwing.PUDDLES);
  };
  // ЗАПІКАННЯ: смуга підлоги під столами крила (растр wing_wall.js, 2 px/од.) — лише нижче ліній підлоги
  NX.wing.floorFx = S => {
    S.base = S.cv; const cv = document.createElement('canvas'); cv.width = S.base.width; cv.height = S.base.height; cv.getContext('2d').drawImage(S.base, 0, 0); S.cv = cv;   // base — без плитки (для нерухомої копії крила)
    const c = cv.getContext('2d'); c.save(); c.setTransform(1 / S.U, 0, 0, 1 / S.U, -S.x0 / S.U, -S.y0 / S.U);
    c.beginPath(); c.moveTo(0, 362); LINES.forEach(([a, b, y]) => { c.lineTo(a, y); c.lineTo(b, y); }); c.lineTo(664, 368); c.lineTo(0, 368); c.closePath(); c.clip();
    paintTiles(c, 336, 368, .75); paintPuddles(c); c.restore();
  };

  /* ---------------- смуги глянцю (лише вдалині від предметів) ---------------- */
  function streaks(w, h) {
    const s = document.createElement('canvas'); s.width = w; s.height = h; const x = s.getContext('2d');
    for (let i = 0; i < w; i += 3) { const v = P.hash(i, 7); if (v > .55) { x.fillStyle = `rgba(0,0,0,${(v - .55) * 1.8})`; x.fillRect(i, 0, 2, h); } }
    for (let j = 0; j < h; j += 2) { const k = 1 - j / h; if (k > .55) { x.fillStyle = `rgba(0,0,0,${(k - .55) * .9})`; x.fillRect(0, j, w, 1); } }   // піксельне «розсипання» вдалині — через рядок
    x.globalCompositeOperation = 'destination-in'; const g = x.createLinearGradient(0, 0, 0, h); g.addColorStop(0, 'rgba(0,0,0,1)'); g.addColorStop(.62, 'rgba(0,0,0,.55)'); g.addColorStop(.86, 'rgba(0,0,0,0)'); x.fillStyle = g; x.fillRect(0, 0, w, h);   // біля предмета (низ полотна) — без смуг
    return s;
  }

  NX.addObject({
    id: 'wingFloor', span: [0, 680],
    drawBack(c, t) {
      if (c.isRefl) return;
      const Kk = NX.cam.k * (NX.loop.dpr || 1), R = Math.min(2, Math.ceil(Kk * 2) / 2);
      if (!CV || CV.width !== Math.round((X1 - X0) * R)) { CV = document.createElement('canvas'); CV.width = Math.round((X1 - X0) * R); CV.height = Math.round(H * R); cx = CV.getContext('2d'); fr = 0; ST = streaks(CV.width, CV.height); }
      if ((fr++ % 4) === 0) {                                                    // раз на 4 кадри (відбиття бліде й згасає — різниці не видно, а кадр легший)
        cx.setTransform(1, 0, 0, 1, 0, 0); cx.clearRect(0, 0, CV.width, CV.height); cx.setTransform(R, 0, 0, R, -X0 * R, -Y0 * R); cx.imageSmoothingEnabled = true;
        K.reflectors.forEach(f => f(cx, t));
        const L = []; ['analyticsChair', 'marketingChair', 'coffee', 'catCorner'].forEach(id => { const o = NX.objects[id]; if (o && o.layers) L.push(...o.layers(t)); });
        Object.values(NX.objects).forEach(o => { if (o.id.startsWith('wp_') && o.d.stage === 'layer') L.push(...o.layers(t)); });
        L.filter(Boolean).sort((a, b) => a.y - b.y).forEach(l => l.draw(cx, t));
        // №7: біля лінії контакту (низ полотна) відбиття щільне, далі швидко згасає
        cx.globalCompositeOperation = 'destination-in'; cx.setTransform(1, 0, 0, 1, 0, 0);
        const g = cx.createLinearGradient(0, 0, 0, CV.height); g.addColorStop(0, 'rgba(0,0,0,0)'); g.addColorStop(.5, 'rgba(0,0,0,.22)'); g.addColorStop(.84, 'rgba(0,0,0,.72)'); g.addColorStop(1, 'rgba(0,0,0,1)'); cx.fillStyle = g; cx.fillRect(0, 0, CV.width, CV.height);
        cx.globalCompositeOperation = 'destination-out'; cx.drawImage(ST, 0, 0);                    // смуги глянцю — лише вдалині
        cx.globalCompositeOperation = 'source-over';
      }
      const put = (xa, xb, line) => { c.save(); c.beginPath(); c.rect(xa, line, xb - xa, 120); c.clip(); c.translate(0, line * 2); c.scale(1, -1); c.globalAlpha = .4; c.imageSmoothingEnabled = R < Kk; c.drawImage(CV, (xa - X0) * R, 0, (xb - xa) * R, CV.height, xa, Y0, xb - xa, H); c.restore(); };
      LINES.forEach(([a, b, y]) => put(a, b === 664 ? X1 : b, y));                // плитка й калюжі світла — уже в підлозі (запечені, №7)
    },
  });
  /* СЯЙВО КРИЛА (bloom): розмиті яскраві місця нерухомої копії крила (NX.wing.bloom, рахує wing_wall.js)
   * кладуться світлом поверх стіни, столів і будок — м'які ореоли навколо неону, екранів і ліхтарів, як на картинці.
   * Малюється після всіх drawBack крила (перед Nexi й котом), повільно "дихає". */
  NX.addObject({
    id: 'wingGlow', span: [0, 664],
    drawBack(c, t) {
      const B = NX.wing.bloom; if (!B || c.isRefl) return;
      const H = NX.cfg.ROOM_H, br = .9 + .1 * Math.sin(t * .9);                     // три масштаби вже змішані в одне полотно (wing_wall.js -> patch)
      c.save(); c.globalCompositeOperation = 'lighter'; c.imageSmoothingEnabled = true; c.globalAlpha = br; c.drawImage(B.cv, 0, 0, B.w, H); c.restore();
    },
  });
})();

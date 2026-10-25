/* ============================================================================
 * objects/wing_trinkets.js — ДРІБНИЦІ НА СТОЛАХ ЛІВОГО КРИЛА (розширення NX.kit)
 * ----------------------------------------------------------------------------
 * Власник: «дрібниці на столах: папери, стікери, ручки, навушники, телефон на
 * зарядці, мишка». Усе — піксель-арт кодом прямо в растр стола (4 px/од.), у
 * стилі кімнати: темний глянець, неонові канти, 8-bit перелив (дизеринг), контур;
 * під кожною річчю — тінь контакту на видимому верху стільниці.
 *   papers   — стос аркушів (видно край кожного), верхній з таблицею й графіком,
 *              ручка зверху (pen:1)
 *   printout — роздруківка-звіт: лежить на стільниці й ЗВИСАЄ з краю плити
 *   pens     — склянка з ручкою, олівцем, маркером і стилусом (кінчик світиться)
 *   notes    — блок стікерів, верхній листок відгорнутий
 *   phone    — телефон на бездротовій зарядці: живий екран (годинник, заряд,
 *              сповіщення з «вібрацією»), LED зарядки, кабель за стіл
 *   mouse    — ігрова мишка з RGB на килимку з RGB-кантом
 *   headset  — навушники на хромованій підставці, LED на чашках «дихають»
 *              (коли Nexi працює в зоні — грають еквалайзером)
 *   стікери на рамках екранів і будок — K.stuck (малюються після живих екранів)
 * API:
 *   K.trinkets(S, D, items)              — тіні + статичні частини в растр стола S (buildDesk зони)
 *   K.trinketsLive(c, D, items, t, act)  — живе поверх (drawDesk зони; act = Nexi працює тут)
 *   K.stuck(c, notes)                    — стікери {x, y — центр, s — розмір, col: y|p|c|g, rot, seed}
 * items: [{kind, x — лівий край, y — лінія, на якій стоїть (верх стільниці або трохи глибше), ...}]
 * D — стіл зони ({top, back, slab}). Розстановка — у файлах зон (ITEMS / NOTES):
 * ai_center.js, analytics.js, marketing.js. Нові дрібниці — лише через ці функції.
 * ========================================================================== */
(() => {
  const P = NX.px, F = NX.furn, K = NX.kit, { NAVY, CHROME, OUT } = F.PAL, ramp = F.ramp, hash = NX.art.hash, BAYER = NX.art.BAYER, rgba = K.rgba, lit = K.lit;
  const dz = (i, j) => BAYER[(j & 3) * 4 + (i & 3)] + .5;                                          // поріг Байєра 0..1 (розсип на краях)
  // папір у неоновому присмерку — лавандові тони (не білий: інакше «світиться» сяйвом крила)
  const PAPER = ['#141036', '#211b4e', '#312a68', '#453c84', '#5d53a0', '#796fba', '#958cd0', '#b1a9e2', '#ccc6f0'];
  const NOTE = {
    y: ['#4a3a0c', '#8a6e18', '#c8a42a', '#f0cc48', '#ffe27a', '#fff3b8'],
    p: ['#4a1040', '#8a2272', '#c8409e', '#ff6ec8', '#ff9ae6', '#ffd2f2'],
    c: ['#08304a', '#105a7a', '#1a8eae', '#2ac4e0', '#7af0ff', '#c8faff'],
    g: ['#08341e', '#105e36', '#1a9050', '#2ac46a', '#7affa8', '#c8ffda'],
  };
  const WALLP = ['#0c0828', '#140c3c', '#1c1252', '#261868', '#341f7e', '#4a2a94', '#6a36a8', '#8a44b8'];    // шпалери екрана телефона
  const INK = ['#2a7ad0', '#c83aa8', '#3a9a8a', '#5a4ac8'];                                         // «друк» на папері

  /** Тінь контакту: темніє видимий верх стільниці під предметом і трохи довкола (розсипом по краю). */
  function shadow(S, D, x0, x1, y, k = .85) {
    const cx = (x0 + x1) / 2, rx = (x1 - x0) / 2 + 2, ry = 2.3;
    S.rect(x0 - 2.1, y - 2.6, x1 + 2.1, y, (u, v, i, j, X, Y) => {
      if (Y < D.back + .25) return null;
      const q = ((X - cx) / rx) ** 2 + ((Y - y + .25) / ry) ** 2; if (q >= 1) return null;
      const a = k * (1 - q * q); if (a < dz(i, j) * .3) return null;
      S.r.set(i, j, '#020008', Math.min(.82, a)); return null;
    });
  }
  /** Кабель від предмета за задній край стільниці (як інші кабелі крила). */
  function cable(S, pts) {
    for (let k = 1; k < pts.length; k++) S.line(pts[k - 1][0], pts[k - 1][1], pts[k][0], pts[k][1], OUT, 1.1);
    for (let k = 1; k < pts.length; k++) S.line(pts[k - 1][0], pts[k - 1][1] - .25, pts[k][0], pts[k][1] - .25, '#2a2454', .45);
  }
  /** Верхня грань у ракурсі (паралелограм): передній край y, глибина d (у ракурсі), зсув до вікна sk.
   *  fn(uu, vv, i, j, X, Y): uu 0..1 уздовж, vv 0 (спереду) .. 1 (ззаду). */
  function topFace(S, x, y, w, d, sk, fn) {
    S.poly([[x, y], [x + w, y], [x + w + sk, y - d], [x + sk, y - d]], (u, v, i, j, X, Y) => {
      const vv = (y - Y) / d, uu = (X - x - sk * vv) / w; if (uu < 0 || uu > 1 || vv < 0 || vv > 1) return null; return fn(uu, vv, i, j, X, Y);
    });
  }

  // ---------- папери: стос аркушів ----------
  function papers(S, D, it) {
    const { x, y } = it, W = it.w || 11, n = it.n || 4, seed = it.seed || 1, th = .5, sd = 2.4, sk = .45;
    for (let k = 0; k < n; k++) {                                                                  // торці: світлий край + темна щілина; аркуші зсунуті, один стирчить
      const off = (hash(seed, k) - .5) * 1.3 + (k === n - 2 ? .9 : 0), y1 = y - k * th;
      S.rect(x + off, y1 - th, x + W + off, y1, (u, v) => u < .02 || u > .98 ? OUT : v < .5 ? PAPER[k % 2 ? 7 : 8] : PAPER[2]);
    }
    const top = y - n * th, to = (hash(seed, n) - .5) * .7;
    topFace(S, x + to, top, W, sd, sk, (uu, vv, i, j, X, Y) => {                                   // верхній аркуш: рядки тексту, заголовок, стовпчики
      if (uu < .02 || uu > .98 || vv > .9) return OUT;
      const row = Math.floor((top - Y) / .75), fr = ((top - Y) / .75) % 1;
      if (row === 2 && fr > .35 && fr < .75 && uu > .07 && uu < .34) return INK[1];                // заголовок
      if (row < 2 && fr > .35 && fr < .75 && uu > .07 && uu < .52 && hash(Math.floor(uu * 13), row + seed) > .22) return PAPER[2];
      const b = (uu - .62) / .3 * 3, bk = Math.floor(b);
      if (b > 0 && bk < 3 && b % 1 < .66 && vv > .1 && vv < .32 + .55 * hash(bk, seed + 3)) return INK[bk];
      return ramp(PAPER, .97 - vv * .32, i, j, .04);
    });
    if (it.pen) {                                                                                  // ручка навскіс поверх стосу: темний корпус, хромований блік, блакитний ковпачок
      const a = [x + W * .3, top - .45], b = [x + W * .74, top - 1.75], at = q => [a[0] + (b[0] - a[0]) * q, a[1] + (b[1] - a[1]) * q];
      S.line(a[0], a[1], b[0], b[1], OUT, 1.05); S.line(a[0], a[1], b[0], b[1], '#262a62', .5);
      const c1 = at(.72); S.line(c1[0], c1[1], b[0], b[1], '#3be8ff', .5);
      const h0 = at(.08), h1 = at(.6); S.line(h0[0], h0[1] - .17, h1[0], h1[1] - .17, CHROME[3], .17);
      S.rect(a[0] - .45, a[1] - .15, a[0] + .1, a[1] + .3, CHROME[4]);                            // кінчик
    }
  }
  // ---------- роздруківка, що звисає з краю плити (звисання — спрайт, щоб неон плити його не засвічував) ----------
  function printoutFlat(S, D, it) {
    const W = it.w || 9.5, x0 = it.x, top = D.top;
    topFace(S, x0, top, W, 2.2, .4, (uu, vv, i, j) => uu < .02 || uu > .98 || vv > .9 ? OUT : (uu > .1 && uu < .8 && ((vv * 3.3) % 1) < .3 && vv > .2) ? PAPER[4] : ramp(PAPER, .84 - vv * .2, i, j, .04));
    const L = it.hl || 5.6;                                                                        // тінь від аркуша на плиті: праворуч і знизу
    S.rect(x0 + .4, top + .6, x0 + W + 1, top + L + .7, (u, v, i, j, X, Y) => { const e = Math.max(X - (x0 + W), Y - (top + L)); if (e < 0 || e > .7) return null; S.r.set(i, j, '#120018', .5 * (1 - e / .9)); return null; });
  }
  function printoutSprite(D, it) {
    const W = it.w || 9.5, x0 = it.x, L = it.hl || 5.6, top = D.top, seed = it.seed || 2;
    const S = F.Sheet(x0 - .6, top - .5, x0 + W + .8, top + L + .8);
    S.rect(x0, top - .25, x0 + W, top + .45, (u, v) => v < .45 ? PAPER[8] : PAPER[7]);               // згин на краю плити (ловить світло)
    S.rect(x0, top + .45, x0 + W + .4, top + L, (u, v, i, j, X, Y) => {
      const vv = (Y - top) / L, lx = X - x0 - .3 * vv * vv - .12 * Math.sin(vv * 5 + seed), uu = lx / W;   // аркуш трохи вигинається до низу
      if (uu < 0 || uu > 1) return null;
      if (vv > .88) return vv > .95 ? PAPER[8] : PAPER[7];                                         // нижній край загинається до нас
      if (vv > .12 && vv < .21 && uu > .08 && uu < .58) return INK[1];                             // заголовок звіту
      if (uu > .08 && uu < .58 && vv > .27 && vv < .33 && ((uu * 30) | 0) % 3) return PAPER[3];   // підзаголовок
      const b = (uu - .1) / .52 * 4, bk = Math.floor(b), h = .22 + .42 * hash(bk, seed);
      if (b > 0 && bk < 4 && b % 1 < .6 && vv < .8 && vv > .8 - h * .55) return INK[bk % 2 ? 0 : 3]; // стовпчики
      if (Math.abs(vv - (.66 - uu * .3 - .04 * Math.sin(uu * 14))) < .035 && uu > .08 && uu < .92) return INK[2];   // лінія тренду
      if (uu > .68 && uu < .92 && vv > .38 && vv < .82 && ((vv * 10) | 0) % 2 === 0) return PAPER[3]; // колонка тексту
      return ramp(PAPER, .66 + vv * .16 - uu * .06, i, j, .05);
    });
    return { cv: S.canvas(), x0: S.x0, y0: S.y0, w: S.x1 - S.x0, h: S.y1 - S.y0 };
  }
  // ---------- склянка з ручками ----------
  function pens(S, D, it) {
    const { x, y } = it, W = 5, H = 5.4, rim = y - H;
    S.rr(x + .15, rim - .3, x + W - .15, rim + .9, .5, (d, u, v) => d < .3 ? OUT : v < .35 ? CHROME[2] : '#05030e');   // отвір склянки (задній край і темнота)
    [[1.2, -1.4, 11.6, '#c63aa8', '#ff84d4', 'pen'], [3.3, 5, 12.2, '#e0a030', '#ffe27a', 'pencil'], [2.4, 1.8, 10.4, '#141a40', '#3be8ff', 'marker'], [4, 6.4, 10, '#848db4', '#dff8ff', 'stylus']].forEach(([a, bx, bh, body, cap, kind]) => {
      const A = [x + a, rim + .35], B = [x + bx, y - bh], at = k => [A[0] + (B[0] - A[0]) * k, A[1] + (B[1] - A[1]) * k];
      S.line(A[0], A[1], B[0], B[1], OUT, 1.15); S.line(A[0], A[1], B[0], B[1], body, .55);
      if (kind === 'pencil') { const c1 = at(.84); S.line(c1[0], c1[1], B[0], B[1], '#d8a060', .5); const c2 = at(.95); S.line(c2[0], c2[1], B[0], B[1], '#1a1020', .45); }   // заточений кінчик
      else { const c1 = at(kind === 'stylus' ? .9 : .74); S.line(c1[0], c1[1], B[0], B[1], cap, .55); }                                          // ковпачок / кінчик стилуса
      if (kind === 'pen') { const c1 = at(.6), c2 = at(.78); S.line(c1[0] + .3, c1[1], c2[0] + .3, c2[1], CHROME[4], .2); }                     // кліпса
      const h0 = at(.15), h1 = at(.7); S.line(h0[0] - .18, h0[1], h1[0] - .18, h1[1], P.shade(body, .45), .16);   // блік на корпусі
    });
    S.rr(x, rim + .45, x + W, y, [.4, .4, .7, .7], (d, u, v, i, j, X, Y) => {                       // передня стінка: темне скло, неоновий обідок, блік, LED знизу
      if (d < .3) return OUT;
      if (Y < rim + .85) return '#3be8ff';
      if (Y > y - .75 && d > .5) return '#7a1c6d';
      if (Math.abs(u - .24) < .07 && v < .85) return NAVY[8];
      return ramp(NAVY, .62 - Math.abs(u - .3) * 1.1 - v * .18, i, j, .06);
    });
  }
  // ---------- блок стікерів ----------
  function notesBlock(S, D, it) {
    const { x, y } = it, W = it.w || 6.4, H = 2.8, pal = NOTE[it.col || 'y'], td = 2.1, sk = .3, ty = y - H;
    S.rect(x, ty, x + W, y, (u, v, i, j, X, Y) => { if (u < .03 || u > .97 || v > .9) return OUT; const q = (Y - ty) / .5; return q % 1 < .5 ? pal[q < 1 ? 4 : 3] : pal[2]; });   // торці листків
    topFace(S, x, ty, W, td, sk, (uu, vv, i, j) => {
      if (uu < .03 || uu > .97 || vv > .88) return OUT;
      if (uu > .6 && vv < .6 && (uu - .6) / .4 + (.6 - vv) / .6 > 1) return pal[3];                // під відгорнутим кутиком — наступний листок
      if (uu > .14 && uu < .58 && ((vv * 3) % 1) < .32 && vv > .25 && vv < .85 && ((uu * 16) | 0) % 4) return pal[1];   // «почерк»
      return ramp(pal, .92 - vv * .25, i, j, .05);
    });
    const p0 = [x + W * .6, ty], p1 = [x + W + sk * .6, ty - td * .6];                               // відгорнутий кутик: світлий зворот догори
    S.poly([p0, p1, [x + W * .86, ty - td * 1.55]], (u, v) => v < .3 ? pal[5] : u > .6 ? pal[4] : pal[5]);
    S.line(p0[0], p0[1] + .1, p1[0], p1[1] + .1, pal[1], .3);
  }
  // ---------- телефон на бездротовій зарядці ----------
  const phoneGeo = it => { const { x, y } = it; return { body: [x + .9, y - 13.2, x + 6.1, y - 2.2], scr: [x + 1.8, y - 12.2, x + 5.2, y - 3.1], lip: [x + .5, y - 2.8, x + 6.5, y - 1.6], base: [x, y - 1.75, x + 7, y], led: [x + 1.7, y - 1, x + 5.3, y - .6] }; };
  function phone(S, D, it) {
    const g = phoneGeo(it), [bx0, by0, bx1, by1] = g.body, [sx0, sy0, sx1, sy1] = g.scr;
    cable(S, [[it.x + 6.6, it.y - 1.1], [it.x + 8.4, it.y - 2.2], [it.x + 10.2, D.back + .7]]);
    S.rr(bx0, by0, bx1, by1, 1.1, (d, u, v, i, j, X, Y) => {
      if (d < .3) return OUT;
      if (d < .62) return u < .5 ? (v < .5 ? CHROME[4] : CHROME[3]) : CHROME[1];                   // металевий обідок, світліший зліва
      if (X < sx0 || X >= sx1 || Y < sy0 || Y >= sy1) return Math.abs(X - (bx0 + bx1) / 2) < .7 && Math.abs(Y - by0 - .55) < .15 ? '#2a2a52' : '#04030c';   // рамка-скло, динамік
      const su = (X - sx0) / (sx1 - sx0), sv = (Y - sy0) / (sy1 - sy0), blob = Math.max(0, 1 - Math.hypot(su - .72, sv - .3) * 2.3);
      if (Math.abs(su - .25 + sv * .4) < .025) return WALLP[6];                                     // відблиск скла
      return ramp(WALLP, .18 + sv * .45 + blob * .5, i, j, .08);                                    // шпалери (живе — годинник, заряд, сповіщення)
    });
    S.rr(g.lip[0], g.lip[1], g.lip[2], g.lip[3], .4, (d, u, v, i, j) => d < .3 ? OUT : v < .4 ? CHROME[4] : ramp(CHROME, .5 - v * .3, i, j));   // виступ, на якому стоїть телефон
    S.rr(g.base[0], g.base[1], g.base[2], g.base[3], [.7, .7, .45, .45], (d, u, v, i, j, X, Y) => {
      if (d < .3) return OUT; if (v < .28) return CHROME[3];
      const [lx0, ly0, lx1, ly1] = g.led; if (X >= lx0 && X < lx1 && Y >= ly0 && Y < ly1) return '#06261e';   // проріз LED (світить живим)
      return ramp(NAVY, .55 - v * .35, i, j, .08);
    });
  }
  const DIG = ['111101101101111', '010110010010111', '111001111100111', '111001011001111', '101101111001001', '111100111001111', '111100111101111', '111001010010010', '111101111101111', '111101111001111'];
  /** Годинник «ГГ / ХХ» у крихітне полотно 7×11 px (1 px = 1 точка цифри); перемальовується раз на хвилину. */
  const CLOCK = { key: '', cv: null };
  function clock() {
    const d = new Date(), key = String(d.getHours()).padStart(2, '0') + String(d.getMinutes()).padStart(2, '0');
    if (key === CLOCK.key) return CLOCK.cv;
    const cv = CLOCK.cv || document.createElement('canvas'); cv.width = 7; cv.height = 11; const x = cv.getContext('2d'); x.clearRect(0, 0, 7, 11); x.fillStyle = '#d6ecff';
    [...key].forEach((ch, n) => { const m = DIG[+ch], ox = (n % 2) * 4, oy = n < 2 ? 0 : 6; for (let q = 0; q < 15; q++) if (m[q] === '1') x.fillRect(ox + q % 3, oy + ((q / 3) | 0), 1, 1); });
    CLOCK.key = key; CLOCK.cv = cv; return cv;
  }
  /** Веселка для RGB-кантів: 2 оберти по 45 смужок (8° на смужку) — щокадру лише зсув, без перерахунку кольорів. */
  const RAINBOW = (() => { const cv = document.createElement('canvas'); cv.width = 90; cv.height = 1; const x = cv.getContext('2d'); for (let i = 0; i < 90; i++) { x.fillStyle = `hsl(${(i * 8) % 360},95%,62%)`; x.fillRect(i, 0, 1, 1); } return cv; })();
  const ICONCOL = { heart: '#ff6ec8', chart: '#3bff8a', chat: '#3be8ff' };
  function phoneLive(c, it, t, act) {
    const g = phoneGeo(it), [sx0, sy0, sx1, sy1] = g.scr, w = sx1 - sx0, h = sy1 - sy0, seed = hash(it.x, 7);
    const per = act ? 3.6 : 9 + seed * 6, ph = (t + seed * 9) % per, on = ph < 2.6, k = on ? Math.min(1, ph / .25, (2.6 - ph) / .3) : 0;   // сповіщення: виїжджає, тримається, ховається
    const p = .44, cx = sx0 + (w - p * 7) / 2;
    c.save();
    c.fillStyle = rgba('8,4,30', .22 - .2 * k); c.fillRect(sx0, sy0, w, h);                            // екран блокування трохи пригашений
    c.imageSmoothingEnabled = false; c.globalAlpha = .9; c.drawImage(clock(), cx, sy0 + 2.1, p * 7, p * 11); c.globalAlpha = 1;   // годинник «режиму очікування»
    const lvl = .4 + ((t * .008 + seed) % .58), by = sy1 - 1.05, bw = w - 1.3, col = lvl > .85 ? '#3bff8a' : '#3be8ff';   // заряд росте, по смужці біжить відблиск
    lit(c, sx0 + .95, by, bw, .42, '#0a1838'); lit(c, sx0 + .95, by, bw * lvl, .42, col); lit(c, sx0 + .95 + ((t * .7) % 1) * bw * lvl - .2, by, .4, .42, 'rgba(255,255,255,.75)');
    lit(c, sx0 + .42, by - .2, .3, .4, '#ffe27a'); lit(c, sx0 + .28, by + .15, .3, .4, '#ffe27a');    // блискавка
    if (k > 0) {                                                                                       // банер сповіщення: іконка кольору зони + 2 рядки
      const yy = sy0 + .2 - (1 - k) * 2; c.save(); c.beginPath(); c.rect(sx0, sy0, w, h); c.clip();
      lit(c, sx0 + .2, yy, w - .4, 1.6, 'rgba(14,20,64,.95)'); lit(c, sx0 + .2, yy, w - .4, .14, 'rgba(160,220,255,.55)');
      lit(c, sx0 + .4, yy + .35, .9, .9, ICONCOL[it.icon] || ICONCOL.chat); lit(c, sx0 + 1.5, yy + .38, w - 2, .3, '#e8fdff'); lit(c, sx0 + 1.5, yy + .92, (w - 2) * .6, .26, '#8aa8e0');
      c.restore();
    }
    c.globalCompositeOperation = 'lighter';
    P.glow(c, (sx0 + sx1) / 2, (sy0 + sy1) / 2, 7, 'rgba(90,130,255,.7)', .1 + .2 * k);              // світло екрана на стіну й стіл
    const [lx0, ly0, lx1, ly1] = g.led, br = .55 + .35 * Math.sin(t * 2.2 + seed * 6), lc = lvl > .85 ? '59,255,138' : '59,232,255';
    lit(c, lx0, ly0, lx1 - lx0, ly1 - ly0, rgba(lc, br)); P.glow(c, (lx0 + lx1) / 2, ly0 + .2, 3.4, rgba(lc, .9), .22 * br);   // LED зарядки дихає
    if (on && ph < .7 && Math.floor(t * 14) % 2) { const [bx0, by0, bx1] = g.body;                      // «вібрація»: дужки обабіч
      for (const s of [-1, 1]) { const xx = s < 0 ? bx0 - 1 : bx1 + .65; lit(c, xx, by0 + 3.2, .35, 1.3, 'rgba(220,240,255,.9)'); lit(c, xx + s * .6, by0 + 2.6, .35, 2.5, 'rgba(220,240,255,.5)'); } }
    c.restore();
  }
  // ---------- ігрова мишка на килимку ----------
  const mouseGeo = it => { const { x, y } = it, W = it.w || 15, py = y - .45, pd = 3, sk = .6; return { x0: x, x1: x + W, W, py, pd, sk, mx: x + W * .44 + sk * .4, mb: py - pd * .32, hw: 3, mh: 3.5 }; };
  function mouse(S, D, it) {
    const g = mouseGeo(it), { x0, W, py, pd, sk, mx, mb, hw, mh } = g;
    S.rect(x0, py, x0 + W, it.y, (u, v) => u < .015 || u > .985 || v > .55 ? OUT : '#1a0d3a');        // товщина килимка
    topFace(S, x0, py, W, pd, sk, (uu, vv, i, j) => {                                                  // тканина килимка з кантом (RGB — живим)
      const e = Math.min(uu * W, (1 - uu) * W, vv * pd * 1.6, (1 - vv) * pd * 1.6);
      if (e < .28) return OUT; if (e < .55) return it.edge || '#7a1c6d';
      return ramp(['#07051a', '#0c0826', '#120c34', '#1a1244', '#221852'], .3 + (1 - vv) * .3 + (uu < .3 ? .1 : 0), i, j, .14);
    });
    S.rect(mx - hw - .3, mb - mh - .3, mx + hw + .3, mb + .35, (u, v, i, j, X, Y) => {
      const dx = (X - mx) / hw, dy = (mb - Y) / mh; if (dy < -.12) return null;
      const r = Math.pow(Math.abs(dx), 2.3) + Math.pow(Math.max(0, dy), 2); if (r > 1) return null;
      if (r > .84 || dy < -.04) return OUT;
      if (dy < .14) return '#05040e';                                                                  // юбка (RGB-смужка — живим)
      if (Math.abs(dx) < .07 && dy > .52) return '#04030c';                                            // шов між кнопками
      if (dx < -.15 && dx > -.72 && r > .44 && r < .62 && dy > .4) return CHROME[4];                  // блік
      return ramp(['#101032', '#1a1a48', '#262a62', '#343a7e', '#464e9a', '#626cba'], .66 - dx * .22 + dy * .12 - r * .3, i, j, .06);
    });
  }
  function mouseLive(c, it, t, act) {
    const g = mouseGeo(it), hue = (t * (act ? 140 : 45) + it.x * 3) % 360;
    c.save(); c.globalCompositeOperation = 'lighter';
    const span = g.W - 1.1; c.imageSmoothingEnabled = false; c.globalAlpha = .8; c.drawImage(RAINBOW, hue / 8, 0, span * 2, 1, g.x0 + .55, g.py - .5, span, .26); c.globalAlpha = 1;   // RGB-кант килимка (смужка веселки зсувається)
    lit(c, g.mx - g.hw * .78, g.mb - .4, g.hw * 1.56, .3, `hsla(${hue},95%,65%,.95)`);                 // смужка на мишці
    P.glow(c, g.mx, g.mb, 4.6, `hsla(${hue},95%,60%,.9)`, .2 + act * .12);                             // підсвітка під нею
    lit(c, g.mx - .22, g.mb - g.mh + .15, .44, .62, rgba('154,246,255', .75 + .25 * Math.sin(t * 3)));   // коліщатко
    lit(c, g.mx - .3, g.mb - 1.3, .6, .48, `hsla(${(hue + 180) % 360},95%,70%,.85)`);                 // логотип
    c.restore();
  }
  // ---------- навушники на підставці ----------
  const headGeo = it => { const { x, y } = it, cx = x + 6; return { cx, by: y - 10.2, rx: 4.9, ry: 5.2, cups: [[x + .35, y - 10.8, x + 3.25, y - 4.6], [x + 8.75, y - 10.8, x + 11.65, y - 4.6]], ring: [x + 2.8, y - 1, x + 9.2], mic: [x + 3.9, y - 3.1] }; };
  function headset(S, D, it) {
    const { x, y } = it, g = headGeo(it), { cx, by, rx, ry } = g;
    S.rr(x + 1.8, y - 1.85, x + 10.2, y, [.9, .9, .5, .5], (d, u, v, i, j) => d < .3 ? OUT : v < .3 ? CHROME[4] : (v > .48 && v < .76 && u > .1 && u < .9) ? '#3a0b38' : ramp(CHROME, .55 - v * .35 - Math.abs(u - .35) * .4, i, j));   // основа (LED-кільце — живим)
    S.rect(cx - .65, y - 14.2, cx + .65, y - 1.75, (u, v, i, j) => u < .2 || u > .8 ? OUT : ramp(CHROME, .85 - Math.abs(u - .4) * 1.4 - v * .3, i, j));   // стійка
    S.rr(cx - 2.2, y - 14.6, cx + 2.2, y - 13.7, .4, (d, u, v, i, j) => d < .3 ? OUT : v < .5 ? CHROME[4] : CHROME[2]);   // гачок-планка
    S.rect(cx - rx - 1, by - ry - 1, cx + rx + 1, by + .2, (u, v, i, j, X, Y) => {                    // дужка: дуга з бліком, подушка зсередини вгорі
      const dx = X - cx, dy = Y - by; if (dy > 0) return null;
      const ro = Math.hypot(dx / (rx + .6), dy / (ry + .6)), ri = Math.hypot(dx / (rx - .55), dy / (ry - .55)), rp = Math.hypot(dx / (rx - 1.35), dy / (ry - 1.35));
      if (ro > 1) return null;
      if (ri >= 1) { if (ro > .93 || ri < 1.07) return OUT; return ramp(['#0a0a24', '#14143a', '#22265a', '#3a4088', '#8a94d0'], .5 - dy / ry * .45 - (dx < 0 ? .08 : 0), i, j, .05); }
      if (rp >= 1 && dy < -ry * .48) return rp < 1.06 ? OUT : ramp(['#1a0a30', '#2a1446', '#3a1e5c'], .5 + hash(i >> 1, j >> 1) * .4, i, j);   // м'яка подушка
      return null;
    });
    g.cups.forEach(([a, b, c2, e], n) => S.rr(a, b, c2, e, 1.2, (d, u, v, i, j) => {                  // чашки боком: зовні корпус з кантом, всередині амбушюра
      if (d < .3) return OUT;
      const out = n ? u > .45 : u < .55;
      if (!out) return ramp(['#160a2a', '#22123e', '#2e1a52'], .4 + hash(i >> 1, j) * .5, i, j);
      if ((n ? u > .72 : u < .28) && v > .15 && v < .85) return n ? '#3a0e3a' : '#0c2c44';                          // проріз LED (світить живим)
      if (Math.abs(u - (n ? .52 : .48)) < .05) return CHROME[3];                                       // хромований обідок
      return ramp(['#0a0a24', '#14143a', '#1e2050', '#2a2e6a', '#3a4088'], .55 - v * .3 + (n ? -.06 : .06), i, j, .06);
    }));
    const [m0, m1] = [[x + 1.9, y - 5.3], g.mic];                                                      // мікрофон-штанга з лівої чашки
    S.line(m0[0], m0[1], m1[0], m1[1], OUT, .95); S.line(m0[0], m0[1], m1[0], m1[1], '#2a2e6a', .42);
    S.rr(m1[0] - .55, m1[1] - .5, m1[0] + .55, m1[1] + .5, .45, (d) => d < .28 ? OUT : '#14143a');
  }
  function headsetLive(c, it, t, act) {
    const g = headGeo(it); c.save(); c.globalCompositeOperation = 'lighter';
    g.cups.forEach(([a, b, c2, e], n) => {
      const lx = n ? c2 - 1.1 : a + .5, rgb = n ? '255,110,220' : '90,236,255', y0 = b + 1, hgt = e - b - 2;
      if (act) { const lv = P.clamp(K.noise(t * 3.2, n * 5 + it.x), 0, 1); for (let s = 0; s < 5; s++) if (s / 5 < lv) lit(c, lx, y0 + hgt - (s + 1) * hgt / 5 + .08, .55, hgt / 5 - .16, rgba(rgb, .95)); }   // еквалайзер, коли Nexi працює
      else lit(c, lx, y0, .55, hgt, rgba(rgb, .7 + .3 * Math.sin(t * 1.6 + n * 1.5)));
      P.glow(c, lx + .2, b + (e - b) / 2, 4.6, `rgba(${rgb},.85)`, .16 + .08 * Math.sin(t * 1.6 + n) + act * .14);
    });
    const [rx0, ry0, rx1] = g.ring; lit(c, rx0, ry0, rx1 - rx0, .3, rgba('255,79,216', .45 + .3 * Math.sin(t * 2 + it.x)));   // LED-кільце основи
    lit(c, g.mic[0] - .22, g.mic[1] - .22, .44, .44, act ? '#3bff8a' : rgba('255,59,106', .6 + .4 * Math.sin(t * 2.5)));    // вогник мікрофона
    c.restore();
  }
  // ---------- стікери на рамках (повернутий квадратик: клейка смужка, «почерк», загнутий кутик) ----------
  function noteSprite(o) {
    const s = o.s || 5, a = o.rot || 0, ca = Math.cos(a), sa = Math.sin(a), R = s * .75, pal = NOTE[o.col || 'y'], seed = o.seed || 0;
    const S = F.Sheet(-R - .5, -R - .5, R + .5, R + .5), q = [[-1, -1], [1, -1], [1, 1], [-1, 1]].map(([px, py]) => [(px * ca - py * sa) * s / 2, (px * sa + py * ca) * s / 2]);
    S.poly(q, (u, v, i, j, X, Y) => {
      const nu = (X * ca + Y * sa) / s + .5, nv = (-X * sa + Y * ca) / s + .5, cr = nu + nv;           // координати на стікері 0..1
      if (cr > 1.74) return null;                                                                      // загнутий кутик (зрізано)
      if (cr > 1.56) return cr > 1.66 ? pal[5] : pal[1];                                               // загин і тінь під ним
      if (nv < .17) return ramp(pal, .58 - nu * .1, i, j, .05);                                        // клейка смужка
      const row = (nv - .3) / .19, rk = Math.floor(row);                                               // «почерк»: хвилясті штрихи
      if (row >= 0 && rk < 3 && Math.abs((row % 1) - .42) < .13 + .09 * Math.sin(nu * 19 + rk * 2) && nu > .14 && nu < .86 - rk * .16 && hash(Math.floor(nu * 9), rk + seed) > .22) return pal[1];
      return ramp(pal, .84 - nv * .22 - nu * .08, i, j, .05);
    });
    return { cv: S.canvas(), x0: S.x0, y0: S.y0, w: S.x1 - S.x0, h: S.y1 - S.y0 };
  }
  function stuck(c, notes) {
    const R = F.res(); c.save(); c.imageSmoothingEnabled = R < 3.8;
    notes.forEach(o => { if (!o.sp) o.sp = noteSprite(o); const s = o.sp; c.drawImage(F.fit(s.cv, s.w, s.h, R), o.x + s.x0, o.y + s.y0, s.w, s.h); });
    c.restore();
  }

  // ---------- реєстр: статичне (у растр стола) і живе ----------
  const STATIC = { papers, pens, notes: notesBlock, phone, mouse, headset, printout: printoutFlat };
  const WIDTH = { papers: it => (it.w || 11) + .6, pens: () => 5, notes: it => (it.w || 6.4) + .5, phone: () => 7, mouse: it => (it.w || 15) + .6, headset: () => 12, printout: it => it.w || 9.5 };
  const LIVE = {
    phone: phoneLive, mouse: mouseLive, headset: headsetLive,
    pens(c, it, t) { const B = [it.x + 6.4, it.y - 10]; c.save(); c.globalCompositeOperation = 'lighter'; P.glow(c, B[0], B[1], 2.6, 'rgba(122,240,255,.9)', .35 + .2 * Math.sin(t * 2.4 + it.x)); lit(c, B[0] - .25, B[1] - .25, .5, .5, rgba('223,248,255', .7 + .3 * Math.sin(t * 2.4 + it.x))); c.restore(); },   // кінчик стилуса
    printout(c, it, t, act, D) { if (!it.sp) it.sp = printoutSprite(D, it); const s = it.sp, R = F.res(); c.save(); c.imageSmoothingEnabled = R < 3.8; c.drawImage(F.fit(s.cv, s.w, s.h, R), s.x0, s.y0, s.w, s.h); c.restore(); },
  };
  /** Тіні контакту + статичні частини всіх дрібниць стола (дальні — першими). */
  function trinkets(S, D, items) {
    const list = items.slice().sort((a, b) => (a.y || D.top) - (b.y || D.top));
    list.forEach(it => { if (it.kind !== 'printout') shadow(S, D, it.x - .2, it.x + WIDTH[it.kind](it) + .2, it.y, it.kind === 'mouse' ? .55 : .85); });
    list.forEach(it => STATIC[it.kind](S, D, it));
  }
  /** Живе поверх стола: екран телефона, RGB, LED, звисання роздруківки. Викликати ПІСЛЯ неону плити. */
  function trinketsLive(c, D, items, t, act) { c.save(); c.globalCompositeOperation = 'source-over'; c.globalAlpha = 1; items.forEach(it => LIVE[it.kind] && LIVE[it.kind](c, it, t, act, D)); c.restore(); }

  Object.assign(K, { trinkets, trinketsLive, stuck, NOTE, PAPER });
})();

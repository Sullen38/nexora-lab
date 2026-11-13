/* ============================================================================
 * garden/hall.js — ГАЛЕРЕЯ БОТАНІЧНОГО САДУ: СКЛЕПІННЯ, СТІНА, ПІДЛОГА, РЕЙКОВИЙ РОБОТ (NX.gardenHall)
 * ----------------------------------------------------------------------------
 * Сад — підземна галерея-теплиця під кімнатою (схему підтвердив власник 13.11): довгий зал, сектори вздовж задньої стіни,
 * по центру — хол ліфта. Одиниці ті самі, що в кімнаті (масштаб Nexi, точка сходу підлоги (774, 220)), тож Nexi, камера,
 * бабли й частинки працюють тут без змін; галерея ширша за кімнату (garden/catalog.js: X0..X1) і гортається: телефон
 * бачить один сектор, комп'ютер — хол і по два-три сектори з боків.
 *
 * Нерухоме — РАЗ У РАСТР (1 піксель = 0.5 од., як у дивану):
 *   • секція стіни одного сектора (280 од.): скеля склепіння, арка-ферма, лампа «штучного сонця», труби, рейка робота,
 *     балка під вивіску, колони, задня панель зі світлом лампи, плінтус зі стоком. Одна секція — на всі 10 секторів;
 *   • хол ліфта (320 од.): люк у склепінні, звідки спускається острівець із сакурою, і емблема саду — паросток;
 *   • закритий сектор (ще не збудований): стелаж під чохлом, ящики з розсадою;
 *   • підлога: плитка в перспективі до точки сходу, неонова смуга під стіною, плита під острівець.
 * Щокадру — лише живе: сяйво ламп, вивіски секторів (текст — i18n garden.sec.*, однакові на всіх), рейковий робот, що
 * їздить під склепінням і зупиняється над секторами, пилинки у світлі.
 * Малюється лише те, що в кадрі.
 * ========================================================================== */
NX.gardenHall = (() => {
  const P = NX.px, CAT = NX.gardenCat, { hash, BAYER } = NX.art, mix = (a, b, k) => NX.kit.mix(a, b, Math.max(0, Math.min(1, k)));
  const YT = -110, WH = CAT.GY - YT, SC = 2;                        // верх стіни (вище за найвищу добудовану стелю), її висота, пікселів на одиницю
  // рівні секції (від верху растра): п'яти арки, її вершина, лампа, труба, кабель, рейка, балка, панель
  const A0 = 172, A1 = 66, LAMP = 122, PIPE = 148, CAB = 157, RAIL = 165, BEAM = 174, PAN = 196;
  const IN = { x: 6, y: YT + PAN, w: CAT.W - 12, h: WH - PAN - 8 };  // внутрішність секції: місце сектора (x — від його лівого краю)
  const mk = (w, h, sc = SC) => { const cv = document.createElement('canvas'); cv.width = Math.round(w * sc); cv.height = Math.round(h * sc); const c = cv.getContext('2d'); c.scale(sc, sc); c.imageSmoothingEnabled = false; return [cv, c]; };
  const R = (c, x, y, w, h, col) => { c.fillStyle = col; c.fillRect(x, y, w, h); };
  let BAY = null, LOB = null, SHUT = null, FLOOR = null, floorH = 0;

  /** Скеля склепіння: темні шари, жилки й вкраплення-кристали. */
  function rock(c, w, seed) {
    for (let y = 0; y < A0 + 6; y++) for (let x = 0; x < w; x++) {
      const h = hash(x + seed, y), band = Math.sin(y * .09 + x * .017 + seed) * .5 + .5, vein = Math.abs(Math.sin(x * .05 + y * .13 + seed * 2)) < .04;
      R(c, x, y, 1, 1, h > .99 ? '#4a5ad0' : h > .975 ? '#232c78' : vein ? '#161c54' : mix('#04061a', '#0e1340', band * .65 + BAYER[(y & 3) * 4 + (x & 3)] * .35 + .12));
    }
  }
  /** Арка-ферма від x0 до x1; під нею — «повітря» галереї. */
  function arch(c, x0, x1) {
    const m = (x0 + x1) / 2, hw = (x1 - x0) / 2, ay = x => A0 - (A0 - A1) * (1 - ((x - m) / hw) ** 4);
    for (let x = x0; x < x1; x += .5) { const y = Math.round(ay(x) * 2) / 2; R(c, x, y, .5, WH - y, '#0a0e30');
      for (let j = 0; j < 40; j += 1) { const k = 1 - j / 40; if (k * .5 > BAYER[((y * 2 + j) & 3) * 4 + ((x * 2) & 3)] + .5 - .25) R(c, x, y + j, .5, 1, '#141a50'); } }   // відсвіт під аркою
    for (let x = x0; x < x1; x += .5) { const y = Math.round(ay(x) * 2) / 2; R(c, x, y - 4, .5, 4.5, '#1c2250'); R(c, x, y - 4, .5, 1, '#6a78c4'); R(c, x, y, .5, .5, '#0a0c2a'); if (x % 12 === 0) R(c, x, y - 2, 1, 1, '#4a5aa8'); }
    for (const q of [.25, .5, .75]) { const x = x0 + (x1 - x0) * q, y = ay(x); R(c, x - 1, y, 2, RAIL - y, '#141a44'); R(c, x - 1, y, .5, RAIL - y, '#3a4690'); }   // стійки ферми
  }
  function services(c, w) {
    R(c, 0, PIPE, w, 5, '#23306e'); R(c, 0, PIPE, w, 1, '#5a6ab8'); R(c, 0, PIPE + 4, w, 1, '#0c1034');           // труба
    for (let x = 10; x < w; x += 70) { R(c, x, PIPE - 1, 4, 7, '#3a4a98'); R(c, x, PIPE - 1, 4, 1, '#8a9ad8'); }
    R(c, 0, CAB, w, 1, '#0f5a70'); for (let x = 2; x < w; x += 8) R(c, x, CAB, 4, 1, '#3be8ff');                   // LED-кабель
    R(c, 0, RAIL, w, 6, '#2e3566'); R(c, 0, RAIL, w, 1, '#8a94d0'); R(c, 0, RAIL + 5, w, 1, '#0c1034'); for (let x = 1; x < w; x += 4) R(c, x, RAIL + 2.5, 2, 1.5, '#1a2050');   // рейка робота
    R(c, 0, BEAM, w, PAN - BEAM, '#10153f'); R(c, 0, BEAM, w, 1, '#3a4aa0'); R(c, 0, PAN - 1, w, 1, '#070920');   // балка під вивіску
    R(c, 0, WH - 8, w, 8, '#1a2056'); R(c, 0, WH - 8, w, 1, '#5666c0'); for (let x = 3; x < w; x += 8) R(c, x, WH - 5, 5, 2.5, '#070920');   // плінтус зі стоком
  }
  function pillar(c, x, w, led) {
    R(c, x, RAIL, w, WH - RAIL, '#151a4a'); R(c, x, RAIL, 1, WH - RAIL, '#4656b0'); R(c, x + w - 1, RAIL, 1, WH - RAIL, '#0a0c2a');
    for (let y = PAN + 8; y < WH - 16; y += 16) R(c, x + w / 2 - 1, y, 2, 9, led);
    R(c, x - 1, RAIL, w + 2, 4, '#2c3680'); R(c, x - 1, WH - 12, w + 2, 4, '#2c3680');
  }
  /** Задня панель: світло лампи згори (дизеринг), ребра, шви. */
  function panel(c, x0, x1, tint) {
    const m = (x0 + x1) / 2;
    for (let y = PAN; y < WH - 8; y++) for (let x = x0; x < x1; x++) {
      const d = Math.hypot((x - m) * .75, (y - PAN + 20) * .55), k = Math.max(0, 1 - d / 210), q = Math.floor(k * 6 + BAYER[(y & 3) * 4 + (x & 3)] * 1.3 + .5) / 6;
      R(c, x, y, 1, 1, mix('#0a0d2e', tint, q * .85));
    }
    for (let x = x0 + 44; x < x1 - 8; x += 44) { R(c, x, PAN, 1, WH - PAN - 8, '#070920'); R(c, x + 1, PAN, .5, WH - PAN - 8, '#1c2466'); }
    for (const y of [PAN + 110, PAN + 228]) { R(c, x0, y, x1 - x0, 1, '#070920'); R(c, x0, y + 1, x1 - x0, .5, '#1c2466'); }
  }
  function lamp(c, m) {
    for (const dx of [-80, 80]) { R(c, m + dx, 84, 1, LAMP - 84, '#4656b0'); }                                     // підвіси
    R(c, m - 100, LAMP, 200, 10, '#2a1846'); R(c, m - 100, LAMP, 200, 1, '#7a5ab0'); R(c, m - 100, LAMP + 9, 200, 1, '#12082a');
    const LED = ['#ffd6f4', '#ff9ae8', '#fff3c2', '#b8a6ff'];
    for (let i = 0; i < 28; i++) { R(c, m - 97 + i * 7, LAMP + 3, 5.5, 5, LED[i % 4]); R(c, m - 97 + i * 7, LAMP + 3, 5.5, 1, '#ffffff'); }
  }

  function buildBay() {
    const W = CAT.W, [cv, c] = mk(W, WH);
    R(c, 0, 0, W, WH, '#070a24'); rock(c, W, 7); arch(c, 0, W); services(c, W); lamp(c, W / 2); panel(c, 6, W - 6, '#42207a'); pillar(c, 0, 6, '#1f8aa0'); pillar(c, W - 6, 6, '#1f8aa0');
    return cv;
  }
  function buildLobby() {
    const W = CAT.LOBBY[1] - CAT.LOBBY[0], [cv, c] = mk(W, WH), m = W / 2;
    R(c, 0, 0, W, WH, '#070a24'); rock(c, W, 31); arch(c, 0, W); services(c, W); panel(c, 8, W - 8, '#6a2076'); pillar(c, 0, 8, '#c040a8'); pillar(c, W - 8, 8, '#c040a8');
    // люк ліфта в склепінні: корпус, темний отвір, неонові кільця
    R(c, m - 70, 118, 140, 52, '#1c2250'); R(c, m - 70, 118, 140, 1, '#6a78c4'); R(c, m - 60, 130, 120, 40, '#04030c');
    for (let i = 0; i < 5; i++) R(c, m - 60 + i * 3, 134 + i * 7, 120 - i * 6, 1.5, i % 2 ? '#ff4fd8' : '#3be8ff');
    R(c, m - 76, 168, 152, 4, '#3a4690'); R(c, m - 76, 168, 152, 1, '#9aa3c8');
    // емблема саду — паросток у колі (на задній панелі)
    const ey = 310, MOSS = ['#103426', '#216036', '#2f7c40', '#45a04e', '#6ac864', '#b4f48e'];
    for (let a = 0; a < 360; a += 1) { if ((a / 10 | 0) % 2) continue; for (const rr of [50, 51]) R(c, Math.round((m + Math.cos(a / 57.3) * rr) * 2) / 2, Math.round((ey + Math.sin(a / 57.3) * rr) * 2) / 2, 1, 1, '#3bff8a'); }
    R(c, m - 1, ey - 8, 2.5, 40, MOSS[3]); R(c, m - 1, ey - 8, 1, 40, MOSS[5]);
    const lf = sx => { for (let j = -14; j <= 14; j += .5) for (let i = 0; i <= 34; i += .5) { const u = (i - 17) / 17, v = j / 14, tip = 1 - i / 40; if (u * u + v * v / (tip * tip + .05) > 1) continue;
      R(c, m + sx * (i + 1.5) - (sx < 0 ? .5 : 0), ey - 14 + j - i * .45, .5, .5, MOSS[Math.max(0, Math.min(5, Math.round(2.6 - v * 2 + u + BAYER[((j * 2) & 3) * 4 + ((i * 2) & 3)] * 1.4)))]); } };
    lf(1); lf(-1);
    return cv;
  }
  /** Сектор, що ще готується: стелаж під чохлом і ящики з розсадою. Розмір — внутрішність секції. */
  function buildShut() {
    const [cv, c] = mk(IN.w, IN.h), w = IN.w, h = IN.h;
    R(c, 30, 60, 4, h - 70, '#1c2250'); R(c, w - 34, 60, 4, h - 70, '#1c2250');
    for (let y = 56; y < h - 46; y++) for (let x = 24; x < w - 24; x++) {                                         // чохол: складки
      const f = Math.sin(x * .16 + Math.sin(y * .035) * 1.8) * .5 + .5, k = f * .7 + (y - 56) / 900 + BAYER[(y & 3) * 4 + (x & 3)] * .25;
      R(c, x, y, 1, 1, mix('#0c1036', '#262f7a', k));
    }
    R(c, 24, 56, w - 48, 1.5, '#4656b0'); R(c, 24, h - 47, w - 48, 1, '#070920');
    for (let x = 40; x < w - 40; x += 46) { R(c, x, h - 50, 2, 6, '#3a4690'); R(c, x - 1, h - 45, 4, 2, '#5a68b4'); }   // стяжки чохла
    [[34, '#3bff8a'], [104, '#3be8ff'], [174, '#ff86c4']].forEach(([x, col]) => {                                 // ящики з розсадою
      R(c, x, h - 26, 60, 24, '#1c2250'); R(c, x, h - 26, 60, 1.5, '#6a78c4'); R(c, x + 3, h - 18, 54, 1, '#0a0c2a'); R(c, x + 3, h - 10, 54, 1, '#0a0c2a'); R(c, x, h - 2, 60, 2, '#04061a');
      for (let i = 0; i < 9; i++) { const sx = x + 5 + i * 6; R(c, sx, h - 33, 1, 7, '#2f7c40'); R(c, sx - 2, h - 35, 2, 2, col); R(c, sx + 1, h - 36, 2, 2, '#6ac864'); R(c, sx, h - 34, 1, 1, '#b4f48e'); }
    });
    return cv;
  }
  /** Підлога (y від GY до низу добудованої): плитка в перспективі до точки сходу, смуга під стіною, плита під острівець. */
  function buildFloor() {
    const C = NX.cfg, X0 = CAT.X0, X1 = CAT.X1, W = X1 - X0, H = Math.max(40, C.ROOM_H + NX.cam.front0 - CAT.GY + 2), sc = NX.cam.k0 * (NX.loop.dpr || 1) > 1.3 ? 2 : 1;
    const [cv, c] = mk(W, H, sc), [vx, vy] = NX.persp.VP, D = NX.persp.D, g = CAT.GY, T = 80;
    floorH = H; c.translate(-X0, -g);
    const rows = [g]; for (let n = 1; D - n * 70 > 30; n++) rows.push(vy + (g - vy) * D / (D - n * 70)); rows.push(g + H + 4);
    const xa = (xg, y) => vx + (xg - vx) * (y - vy) / (g - vy);
    for (let r = 0; r < rows.length - 1; r++) { const y0 = rows[r], y1 = Math.min(rows[r + 1], g + H + 4); if (y0 > g + H) break;
      for (let i = -60; i < 60; i++) { const x0 = vx + i * T; if (Math.max(xa(x0 + T, y0), xa(x0 + T, y1)) < X0 || Math.min(xa(x0, y0), xa(x0, y1)) > X1) continue;
        c.fillStyle = mix((i + r) & 1 ? '#0b1236' : '#0e1848', '#050818', Math.min(.6, r * .1));
        c.beginPath(); c.moveTo(xa(x0, y0), y0); c.lineTo(xa(x0 + T, y0), y0); c.lineTo(xa(x0 + T, y1), y1); c.lineTo(xa(x0, y1), y1); c.closePath(); c.fill(); } }
    c.strokeStyle = '#22347c'; c.lineWidth = .6;
    for (let i = -60; i <= 60; i++) { const x0 = vx + i * T; c.beginPath(); c.moveTo(x0, g); c.lineTo(xa(x0, g + H), g + H); c.stroke(); }
    rows.slice(1, -1).forEach(y => R(c, X0, Math.round(y * 2) / 2, W, .5, '#22347c'));
    for (const s of CAT.SECTORS) { const m = (s.x0 + s.x1) / 2; for (let i = 0; i < 30; i++) { c.globalAlpha = .07 * (1 - i / 30); R(c, m - 90 + i * 1.5, g + 2 + i * 2, 180 - i * 3, 2, '#ff7af0'); } }   // відблиск ламп у мокрій плитці
    c.globalAlpha = 1;
    R(c, X0, g, W, 2.5, '#0f5a70'); for (let x = X0; x < X1; x += 12) R(c, x, g + .5, 7, 1, '#3be8ff');
    const L = NX.objects.sakura; if (L) {                                                                           // плита під острівець (без кілець — власник, 13.11)
      const { cx, cy, RX, RY } = L; c.fillStyle = '#060920'; c.beginPath(); c.ellipse(cx, cy + L.h + 1, RX + 6, RY + 3, 0, 0, 7); c.fill();
      c.fillStyle = '#161d52'; c.beginPath(); c.ellipse(cx, cy + L.h - .5, RX + 6, RY + 3, 0, 0, 7); c.fill();
      c.fillStyle = '#0b0f30'; c.beginPath(); c.ellipse(cx, cy + L.h - .5, RX + 1.5, RY + 1, 0, 0, 7); c.fill();
    }
    return cv;
  }

  // ---------- рейковий робот: каретка на рейці, штанга, голова-сканер ----------
  const bot = { x: 400, wait: 2, scan: 0, sec: 3 };
  function botUpdate(dt) {
    if (bot.wait > 0) { bot.wait -= dt; bot.scan = Math.min(1, bot.scan + dt * 2); if (bot.wait <= 0) bot.sec = (bot.sec + 1 + (Math.random() * 3 | 0)) % 10; return; }
    const S = CAT.SECTORS[bot.sec], tx = (S.x0 + S.x1) / 2, d = tx - bot.x; bot.scan = Math.max(0, bot.scan - dt * 3);
    if (Math.abs(d) < 1) { bot.x = tx; bot.wait = S.ready ? 6 : 1.6; } else bot.x += Math.sign(d) * Math.min(Math.abs(d), 60 * dt);
  }
  function botDraw(c, t) {
    const x = Math.round(bot.x * 2) / 2, y = YT + RAIL, arm = 12 + bot.scan * 10;
    P.rect(c, x - 13, y + 5, 26, 9, '#3a4070'); P.rect(c, x - 13, y + 5, 26, 1.5, '#9aa3c8'); P.rect(c, x - 13, y + 13, 26, 1, '#141a44');
    P.rect(c, x - 10, y + 2, 4, 4, '#141a44'); P.rect(c, x + 6, y + 2, 4, 4, '#141a44'); P.rect(c, x - 9, y + 3, 2, 2, '#6a74b0'); P.rect(c, x + 7, y + 3, 2, 2, '#6a74b0');
    P.rect(c, x - 9, y + 8, 3, 3, Math.sin(t * 6) > 0 ? '#3bff8a' : '#17482e'); P.rect(c, x + 6, y + 8, 3, 3, '#ff4fd8');
    P.rect(c, x - 1.5, y + 14, 3, arm, '#5a6590'); P.rect(c, x - 1.5, y + 14, 1, arm, '#9aa3c8'); P.rect(c, x - 6, y + 14 + arm, 12, 7, '#2a3060'); P.rect(c, x - 6, y + 14 + arm, 12, 1.5, '#7a84c0'); P.rect(c, x - 3, y + 17 + arm, 6, 3, '#3be8ff');
    if (bot.scan > .05 && CAT.SECTORS[bot.sec].ready) {                                                           // промінь-сканер над збудованим сектором
      const a = bot.scan * (.1 + .04 * Math.sin(t * 5)), sw = Math.sin(t * 1.1) * 70, y0 = y + 21 + arm;
      c.save(); c.globalCompositeOperation = 'lighter'; c.fillStyle = `rgba(59,255,138,${a})`; c.beginPath(); c.moveTo(x - 2, y0); c.lineTo(x + 2, y0); c.lineTo(x + sw + 22, y0 + 190); c.lineTo(x + sw - 22, y0 + 190); c.closePath(); c.fill(); c.restore();
    }
  }

  return {
    YT, WH, IN,
    /** Збірка растрів шматками (генератор: yield після кожного) — під час прогріву (garden.js). */
    *buildG() { BAY = buildBay(); yield; LOB = buildLobby(); yield; SHUT = buildShut(); yield; FLOOR = buildFloor(); yield; },
    /** Розмір екрана змінився — підлога іншої висоти, острівець на іншому місці. */
    layout() { if (FLOOR) FLOOR = buildFloor(); },
    update(dt) { botUpdate(dt); },
    /** Стіна й підлога в кадрі [vx0, vx1]. */
    drawBack(c, t, vx0, vx1) {
      c.imageSmoothingEnabled = false;
      for (const s of CAT.SECTORS) { if (s.x1 < vx0 || s.x0 > vx1) continue; c.drawImage(BAY, s.x0, YT, CAT.W, WH); if (!s.ready) c.drawImage(SHUT, s.x0 + IN.x, IN.y, IN.w, IN.h); }
      if (CAT.LOBBY[1] > vx0 && CAT.LOBBY[0] < vx1) c.drawImage(LOB, CAT.LOBBY[0], YT, CAT.LOBBY[1] - CAT.LOBBY[0], WH);
      const x0 = Math.max(CAT.X0, Math.floor(vx0)), x1 = Math.min(CAT.X1, Math.ceil(vx1)), sc = FLOOR.width / (CAT.X1 - CAT.X0);
      if (x1 > x0) c.drawImage(FLOOR, (x0 - CAT.X0) * sc, 0, (x1 - x0) * sc, FLOOR.height, x0, CAT.GY, x1 - x0, floorH);
    },
    /** Живе на стіні: сяйво ламп, вивіски, робот, напис холу, пилинки. */
    drawLive(c, t, vx0, vx1) {
      for (const s of CAT.SECTORS) {
        if (s.x1 < vx0 || s.x0 > vx1) continue; const m = (s.x0 + s.x1) / 2, on = s.ready, col = on ? s.col : '#2a3a8a';
        P.glow(c, m, YT + LAMP + 6, 130, 'rgba(255,130,230,.55)', (on ? .22 : .09) + .02 * Math.sin(t * 2.3 + s.i));
        const name = String(NX.t('garden.sec.' + s.id)).toUpperCase(), w = 150, y = YT + BEAM + 4;                 // вивіска: однакова на всіх секторах
        P.rect(c, m - w / 2, y, w, 15, '#050818'); P.rect(c, m - w / 2, y, w, 1, col); P.rect(c, m - w / 2, y + 14, w, 1, col); P.rect(c, m - w / 2, y, 1, 15, col); P.rect(c, m + w / 2 - 1, y, 1, 15, col);
        P.text(c, name, m, y + 10.5, on ? s.col : '#5a68b4', 6, 'center');
        if (!on) P.text(c, String(NX.t('garden.soon')), m, IN.y + 34, '#4a5ac0', 6, 'center');
      }
      if (CAT.LOBBY[1] > vx0 && CAT.LOBBY[0] < vx1) {
        const m = (CAT.LOBBY[0] + CAT.LOBBY[1]) / 2;
        P.glow(c, m, YT + 310, 90, 'rgba(59,255,138,.5)', .15 + .04 * Math.sin(t * 1.7));
        P.text(c, String(NX.t('garden.title')), m, YT + BEAM + 15.5, '#3bff8a', 8, 'center');
        P.text(c, String(NX.t('garden.count', { n: CAT.grown(), all: CAT.CROPS.length })), m, YT + 384, '#8af0ff', 6, 'center');
      }
      botDraw(c, t);
      for (let i = 0; i < 40; i++) {                                                                               // пилинки у світлі ламп
        const x = CAT.X0 + hash(i, 3) * (CAT.X1 - CAT.X0) + Math.sin(t * .3 + i) * 14, y = YT + PAN + 10 + ((hash(i, 5) * 300 + t * (3 + hash(i, 7) * 5)) % 320);
        if (x < vx0 || x > vx1) continue; c.globalAlpha = .25 + .25 * Math.sin(t * 1.2 + i * 2); P.rect(c, x, y, 1, 1, '#ffd6f4');
      }
      c.globalAlpha = 1;
    },
  };
})();

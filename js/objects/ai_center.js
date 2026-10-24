/* ============================================================================
 * objects/ai_center.js — AI-ЦЕНТР (окремий об'єкт, намальований піксель-артом)
 * ----------------------------------------------------------------------------
 * Увесь куточок AI-центру намальований кодом (як диван, еталон — sofa.js):
 * чіткий на будь-якому екрані, рухається цілим, нічого не вирізано з картинки.
 *
 * Сітка: 1 піксель = 0.5 одиниці кімнати; 632×648 px (316×324 од.),
 * лівий верх у кімнаті (24, 40), стіл стоїть на підлозі на y = 360.
 *
 * Склад (усе в одному растрі BODY, будується один раз):
 *   buildScreen()   — великий настінний голо-екран у неоновій рамці (3D-товщина):
 *                     шапка "AI-ЦЕНТР", 2 графіки, нейро-мозок, стовпчик іконок,
 *                     ВБУДОВАНА панель "Задачі Nexi" (замість старої дошки задач)
 *   buildBrain()    — піксельний мозок (звивини, мозочок, стовбур) + точки нейронів
 *   buildMonitor()  — ретро-монітор зліва (товста рамка, ніжка)
 *   buildLaptop()   — два ЦІЛІ ноутбуки (кришка + клавіатура в перспективі)
 *   buildDesk()     — стіл: глянцева стільниця, рожевий неоновий торець,
 *                     тумби з шухлядами, ніша з "AI-ядром" (сервер з вентилятором)
 *   buildProps()    — горнятко з кавою, неонова настільна лампа, рослина
 *   buildRefl()     — віддзеркалення столу в глянцевій підлозі
 * Щокадру (drawBack) оживає все: графіки, нейрони й імпульси в мозку, іконки,
 * задачі Nexi, графік на моніторі, чат на другому ноутбуці, друк на головному,
 * потік даних ноутбук -> мозок, коли Nexi працює, пара над кавою, вентилятор,
 * LED-стрічки, бігуча іскра по рамці, відблиск по склу.
 * Тап по мозку — "спалах думки"; тап по будь-якій частині — меню з 3 задачами.
 * Nexi злітає на стільницю (POI.aiDesk) і друкує на головному ноутбуці.
 * ========================================================================== */
(() => {
  const P = NX.px, A = NX.art, { Raster, outline, bump, hash, BAYER } = A;
  const U = .5, X0 = 24, Y0 = 40, GW = 632, GH = 648;
  const toRoom = (gx, gy) => [X0 + gx * U, Y0 + gy * U];
  const toGrid = (rx, ry) => [(rx - X0) / U, (ry - Y0) / U];

  // ---------- палітра (кольори кімнати) ----------
  const K = ['#3a0b38', '#58134f', '#7a1c6d', '#a0288d', '#c63aa8', '#e656c0', '#ff84d4', '#ffc2ec'];   // рожевий неон / глянець
  const D = ['#07041a', '#0d0828', '#140c36', '#1c1146', '#251758', '#301e6c', '#3d2784', '#4d33a0'];   // фіолетовий стіл
  const G = ['#02050f', '#040a1e', '#06102a', '#091636'];                                                 // скло екранів
  const CY = ['#0a2a4a', '#0f4870', '#17709a', '#2aa6c8', '#3be8ff', '#9af6ff', '#ffffff'];               // блакитне голо
  const CH = ['#2a2f5e', '#3a4070', '#5a6590', '#8a93b8', '#c3cbea', '#e9eefc'];                           // хром
  const MB = ['#0b0920', '#141030', '#1e1940', '#2a2454', '#38316a', '#4c4486', '#6a62a8'];               // корпус монітора
  const C = { out: '#0b0420', panel: '#050d26', pb: '#16336a', tick: '#3be8ff', leaf: ['#123a2a', '#1f6a4a', '#2f9a62', '#3fbf7a', '#7ae8a0'] };

  // ---------- розкладка (координати сітки) ----------
  const SCR = { x: 100, y: 8, w: 332, h: 470, r: 18 };                 // зовнішня рамка великого екрана
  const GL = { x: 114, y: 22, w: 304, h: 442 };                         // скло
  const HDR = { x: 120, y: 27, w: 292, h: 34 };
  const CH1 = { x: 120, y: 68, w: 76, h: 126 }, CH2 = { x: 120, y: 200, w: 76, h: 122 };
  const BR = { x: 202, y: 68, w: 154, h: 254 }, BC = [279, 192];       // панель мозку і центр мозку
  const ICO = { x: 362, y: 68, w: 50, h: 254 };
  const TSK = { x: 202, y: 328, w: 210, h: 102 };                       // ЗАДАЧІ NEXI (у великому екрані)
  const EQ = { x: 120, y: 436, w: 292, h: 22 };                         // нижня смуга-еквалайзер
  const MON = { x: 6, y: 326, w: 192, h: 148, r: 10 }, MS = { x: 18, y: 338, w: 168, h: 124 };
  const L1 = { x: 438, y: 430, w: 92, h: 60, deck: 15 };                // головний ноутбук (тут друкує Nexi)
  const L2 = { x: 322, y: 446, w: 80, h: 48, deck: 13 };                // другий ноутбук (чат з клієнтами)
  const S1 = { x: L1.x + 6, y: L1.y + 6, w: L1.w - 12, h: L1.h - 12 }, S2 = { x: L2.x + 5, y: L2.y + 5, w: L2.w - 10, h: L2.h - 10 };
  const DK = { l: 8, r: 620, top: 488, edge: 518, front: 529, base: 628, bot: 640 };
  const CORE = { x: 296, y: 548, w: 58, h: 78 };                        // AI-ядро в ніші столу
  const FAN = [325, 574];
  const LAMP = { x: 604, y: 446 };
  const MUG = { x: 416, y: 486 };
  const DRAWERS = [[24, 534, 140, 28], [24, 566, 140, 28], [24, 598, 140, 26], [470, 548, 136, 36], [470, 588, 136, 36]];
  const ICONS = [
    ['.XXXXXXX.', 'X.......X', 'X.X.X.X.X', 'X.......X', '.XXXXXXX.', '..XX.....', '..X......'],          // чат
    ['XXXXXXXXX', 'XX.....XX', 'X.X...X.X', 'X..X.X..X', 'X...X...X', 'X.......X', 'XXXXXXXXX'],          // лист
    ['.XXXXX...', '.X...XX..', '.X.XX.XX.', '.X.....X.', '.X.XXX.X.', '.X.....X.', '.XXXXXXX.'],          // документ
    ['..XXXXX..', '.X.....X.', 'X...X...X', 'X..X.X..X', '.X.....X.', '..XXXXX..', '...XXX...'],          // ідея
    ['........X', '.......X.', '..X...X..', '.X.X.X...', 'X...X....', '.........', 'XXXXXXXXX'],          // графік
  ];

  // ---------- допоміжне малювання ----------
  const dith = (X, Y) => BAYER[(Y & 3) * 4 + (X & 3)];
  const ramp = (pal, q, X, Y, g = 0) => pal[P.clamp(Math.round(P.clamp(q, 0, 1) * (pal.length - 1) + dith(X, Y) * .9 + (g ? (hash(X, Y) - .5) * g : 0)), 0, pal.length - 1)];
  /** Заокруглений прямокутник через відстань до краю: fn(глибина від краю, u, v, X, Y) -> колір або null. */
  function rr(r, x0, y0, w, h, rad, fn) {
    for (let j = 0; j < h; j++) for (let i = 0; i < w; i++) {
      const qx = Math.abs(i + .5 - w / 2) - (w / 2 - rad), qy = Math.abs(j + .5 - h / 2) - (h / 2 - rad);
      const sd = Math.min(Math.max(qx, qy), 0) + Math.hypot(Math.max(qx, 0), Math.max(qy, 0)) - rad;
      if (sd > 0) continue; const col = fn(-sd, (i + .5) / w, (j + .5) / h, x0 + i, y0 + j); if (col) r.set(x0 + i, y0 + j, col);
    }
  }
  /** Голо-панель: темне скло, тонка рамка, світлі кутики. */
  function panel(r, p, glow = 0) {
    r.rect(p.x, p.y, p.w, p.h, C.panel);
    for (let j = 0; j < p.h; j += 3) r.rect(p.x + 1, p.y + j, p.w - 2, 1, G[1]);                     // скан-лінії
    r.rect(p.x, p.y, p.w, 1, C.pb); r.rect(p.x, p.y + p.h - 1, p.w, 1, C.pb); r.rect(p.x, p.y, 1, p.h, C.pb); r.rect(p.x + p.w - 1, p.y, 1, p.h, C.pb);
    const tk = (x, y, dx, dy) => { r.rect(x, y, 5 * dx || 1, 1, CY[4]); r.rect(x, y, 1, 5 * dy || 1, CY[4]); };
    r.rect(p.x, p.y, 6, 1, CY[4]); r.rect(p.x, p.y, 1, 6, CY[4]); r.rect(p.x + p.w - 6, p.y, 6, 1, CY[4]); r.rect(p.x + p.w - 1, p.y, 1, 6, CY[4]);
    r.rect(p.x, p.y + p.h - 1, 6, 1, CY[4]); r.rect(p.x, p.y + p.h - 6, 1, 6, CY[4]); r.rect(p.x + p.w - 6, p.y + p.h - 1, 6, 1, CY[4]); r.rect(p.x + p.w - 1, p.y + p.h - 6, 1, 6, CY[4]);
    if (glow) for (let i = 2; i < p.w - 2; i++) r.set(p.x + i, p.y + 1, CY[2]);
    void tk;
  }
  const bitmap = (r, rows, x, y, s, col) => rows.forEach((row, j) => [...row].forEach((ch, i) => ch === 'X' && r.rect(x + i * s, y + j * s, s, s, col)));

  // ---------- великий настінний екран ----------
  function buildScreen(r) {
    // 3D-товщина корпусу (видно праворуч і знизу), потім кріплення до столу
    rr(r, SCR.x + 6, SCR.y + 7, SCR.w, SCR.h, SCR.r, (d, u, v, X, Y) => d < 1.5 ? C.out : ramp(D, .1 + .12 * (1 - v), X, Y));
    // рамка: темний контур -> неонова трубка (яскрава серцевина) -> корпус -> тонкий голо-кант
    rr(r, SCR.x, SCR.y, SCR.w, SCR.h, SCR.r, (d, u, v, X, Y) => {
      if (d < 1.5) return '#1a0630';
      if (d < 8.5) { const t = (d - 1.5) / 7; return ramp(K, bump(t) * (.72 + .28 * (1 - v)) + (u < .3 || v < .15 ? .06 : -.04), X, Y); }
      if (d < 9.5) return '#1a0a36';
      if (d < 13.5) return ramp(D, .38 - v * .26, X, Y);
      if (d < 14.5) return '#1d4f86';
      return null;
    });
    // скло: глибокий синій з ледь помітним переливом і скан-лініями
    for (let j = 0; j < GL.h; j++) for (let i = 0; i < GL.w; i++) {
      const X = GL.x + i, Y = GL.y + j, v = j / GL.h, u = i / GL.w;
      r.set(X, Y, (j % 3 === 2) ? G[0] : ramp(G, .55 - v * .35 + (1 - u) * .1, X, Y));
    }
    // шапка
    r.rect(HDR.x, HDR.y, HDR.w, HDR.h, '#061232'); for (let i = 0; i < HDR.w; i++) { r.set(HDR.x + i, HDR.y + HDR.h, CY[2]); r.set(HDR.x + i, HDR.y + HDR.h + 1, CY[0]); }
    rr(r, HDR.x + 4, HDR.y + 5, 24, 24, 6, (d, u, v, X, Y) => d < 1.5 ? CY[4] : d < 2.5 ? CY[1] : '#061a3a');      // значок-чіп
    for (let k = 0; k < 4; k++) { r.rect(HDR.x + 8 + k * 5, HDR.y + 1, 2, 4, CY[2]); r.rect(HDR.x + 8 + k * 5, HDR.y + 29, 2, 4, CY[2]); }
    // панелі
    [CH1, CH2, BR, TSK].forEach(p => panel(r, p, 1));
    for (const p of [CH1, CH2]) { r.rect(p.x + 5, p.y + p.h - 12, p.w - 10, 1, CY[2]); for (let x = p.x + 5; x < p.x + p.w - 5; x += 8) r.set(x, p.y + p.h - 11, CY[3]); }
    for (let k = 0; k < 5; k++) { const ty = ICO.y + k * 51, t = { x: ICO.x, y: ty, w: ICO.w, h: 47 }; panel(r, t); bitmap(r, ICONS[k], t.x + 12, t.y + 13, 3, CY[1]); }
    // мозок
    buildBrain(r);
    // ЗАДАЧІ NEXI: смуга заголовка
    r.rect(TSK.x + 1, TSK.y + 1, TSK.w - 2, 18, '#0a1a46'); r.rect(TSK.x + 1, TSK.y + 19, TSK.w - 2, 1, CY[2]);
    // нижня смуга-еквалайзер (основа)
    r.rect(EQ.x, EQ.y, EQ.w, EQ.h, '#030818'); r.rect(EQ.x, EQ.y, EQ.w, 1, C.pb);
    // кріплення екрана: хромова планка до стільниці
    rr(r, 150, SCR.y + SCR.h - 4, 232, 14, 4, (d, u, v, X, Y) => d < 1.5 ? C.out : v < .3 ? CH[3] : ramp(MB, .5 - v * .4, X, Y));
    for (let x = 160; x < 372; x += 10) r.rect(x, SCR.y + SCR.h + 3, 4, 2, '#0a0420');
  }

  // ---------- піксельний мозок (вигляд збоку, лоб ліворуч) ----------
  const NEURONS = [], SYN = [];
  function buildBrain(r) {
    const [cx, cy] = BC, W = 144, H = 128, ox = cx - 72, oy = cy - 60, m = new Uint8Array(W * H), kind = new Uint8Array(W * H);
    for (let j = 0; j < H; j++) for (let i = 0; i < W; i++) {
      const x = i - 72, y = j - 60;
      const cer = (x / 66) ** 2 + ((y + 8) / 48) ** 2 <= 1 && y < 30 - Math.max(0, x) * .3 + Math.max(0, -x - 30) * .4;
      const cbl = ((x - 34) / 26) ** 2 + ((y - 34) / 15) ** 2 <= 1;
      const stem = y > 22 && y < 64 && x > 4 - (y - 22) * .2 && x < 20 - (y - 22) * .2;
      if (cer) kind[j * W + i] = 1; else if (cbl) kind[j * W + i] = 2; else if (stem) kind[j * W + i] = 3;
      if (kind[j * W + i]) m[j * W + i] = 1;
    }
    const inside = (i, j) => i >= 0 && j >= 0 && i < W && j < H && m[j * W + i];
    for (let j = 0; j < H; j++) for (let i = 0; i < W; i++) {
      const k = kind[j * W + i]; if (!k) continue;
      const X = ox + i, Y = oy + j, x = i - 72, y = j - 60;
      const edge = !inside(i - 1, j) || !inside(i + 1, j) || !inside(i, j - 1) || !inside(i, j + 1);
      if (edge) { r.set(X, Y, y < 0 && x < 20 ? CY[5] : CY[4]); continue; }
      const dist = Math.hypot(x / 70, (y + 10) / 54);
      let col = ramp(['#061634', '#0a2456', '#0e3474', '#144a94'], .95 - dist * .8, X, Y);
      if (k === 1) {
        const f = Math.sin(x * .24 + 2.4 * Math.sin(y * .15 + x * .03)) + Math.sin(y * .21 + 1.9 * Math.sin(x * .12 - .7));
        if (Math.abs(f) < .2) { col = (y < -10 && x < 10) ? CY[5] : CY[3]; if (hash(X, Y) < .07) NEURONS.push([X, Y]); }
        const sulcus = Math.abs(y - (8 - x * .32 + Math.sin(x * .2) * 2)) < 1.1 && x > -30 && x < 40;   // бічна борозна
        if (sulcus) col = CY[5];
        if (Math.abs(x + 4 + y * .12) < .8 && y < -10) col = CY[2];                                       // центральна борозна
      } else if (k === 2) col = (y % 3 === 0) ? CY[3] : ramp(['#0a2456', '#0e3474', '#144a94'], .6 - dist * .3, X, Y);
      else col = (x % 4 === 0) ? CY[2] : '#0c2c62';
      r.set(X, Y, col);
    }
    for (let i = 0; i < 14; i++) { const a = NEURONS[(hash(i, 3) * NEURONS.length) | 0], b = NEURONS[(hash(i, 9) * NEURONS.length) | 0]; if (a && b && Math.hypot(a[0] - b[0], a[1] - b[1]) > 30) SYN.push([a, b, hash(i, 5)]); }
  }

  // ---------- ретро-монітор зліва ----------
  function buildMonitor(r) {
    rr(r, MON.x - 5, MON.y + 4, 12, MON.h - 10, 4, (d, u, v, X, Y) => d < 1.2 ? C.out : ramp(MB, .25 - v * .15, X, Y));          // бокова стінка (3D)
    rr(r, MON.x, MON.y, MON.w, MON.h, MON.r, (d, u, v, X, Y) => {
      if (d < 1.5) return C.out;
      if (d < 3) return u < .5 && v < .5 ? MB[6] : MB[3];                                                                         // фаска
      if (d < 11) return ramp(MB, .62 - v * .4 - u * .12, X, Y, .2);
      if (d < 12) return '#05030f';
      return null;
    });
    for (let j = 0; j < MS.h; j++) for (let i = 0; i < MS.w; i++) { const X = MS.x + i, Y = MS.y + j; r.set(X, Y, j % 3 === 2 ? G[0] : ramp(G, .6 - j / MS.h * .35, X, Y)); }
    for (let x = MS.x + 6; x < MS.x + MS.w; x += 16) for (let y = MS.y + 22; y < MS.y + MS.h - 4; y += 2) r.set(x, y, '#0a1d40');   // сітка графіка
    for (let y = MS.y + 26; y < MS.y + MS.h - 4; y += 16) for (let x = MS.x + 4; x < MS.x + MS.w - 4; x += 2) r.set(x, y, '#0a1d40');
    r.rect(MS.x + 4, MS.y + 4, MS.w - 8, 14, '#081a40');
    r.rect(MON.x + 14, MON.y + MON.h - 7, 6, 2, '#3bff8a'); r.rect(MON.x + 24, MON.y + MON.h - 7, 14, 2, MB[5]);               // кнопка живлення
    // ніжка і підставка
    for (let y = MON.y + MON.h; y < DK.top + 4; y++) { const t = (y - MON.y - MON.h) / 20; r.rect(96 - 7 - t * 2, y, 18 + t * 4, 1, ramp(CH, .55 - t * .3, 96, y)); }
    rr(r, 66, DK.top, 66, 8, 4, (d, u, v, X, Y) => d < 1.2 ? C.out : ramp(CH, .7 - v * .6, X, Y));
  }

  // ---------- ноутбук: кришка + клавіатура в перспективі ----------
  function buildLaptop(r, L, S, pal) {
    rr(r, L.x, L.y, L.w, L.h, 5, (d, u, v, X, Y) => d < 1.3 ? C.out : d < 2.5 ? pal[5] : d < (L === L1 ? 6 : 5) ? ramp(pal, .55 - v * .35, X, Y) : null);
    for (let j = 0; j < S.h; j++) for (let i = 0; i < S.w; i++) r.set(S.x + i, S.y + j, ramp(G, .7 - j / S.h * .4, S.x + i, S.y + j));
    r.rect(L.x + L.w / 2 - 1, L.y + 2, 2, 2, '#0a0a18');                                                                         // камера
    const by = L.y + L.h, dh = L.deck;
    for (let k = 0; k < dh; k++) {                                                                                             // клавіатурна частина: ширшає до глядача
      const ins = Math.round((dh - k) * .45), x0 = L.x - 4 + ins, w = L.w + 8 - ins * 2, Y = by + k;
      for (let i = 0; i < w; i++) {
        const X = x0 + i, edge = i === 0 || i === w - 1 || k === dh - 1;
        if (edge) { r.set(X, Y, C.out); continue; }
        if (k >= dh - 3) { r.set(X, Y, k === dh - 3 ? pal[5] : pal[2]); continue; }                                            // передній торець
        const kx = i - 6, ky = k - 2, key = kx >= 0 && kx < w - 12 && ky >= 0 && ky < dh - 8 && (kx % 5) < 4 && (ky % 3) < 2;
        const pad = Math.abs(i - w / 2) < 9 && k >= dh - 6 && k < dh - 3;
        r.set(X, Y, pad ? pal[4] : key ? '#120c26' : ramp(pal, .35 + k / dh * .3, X, Y));
      }
    }
    r.rect(L.x + 6, by - 1, L.w - 12, 2, pal[1]);                                                                              // шарнір
  }

  // ---------- стіл ----------
  function buildDesk(r) {
    // стільниця (верхня грань у перспективі: задній край вужчий)
    for (let Y = DK.top; Y < DK.edge; Y++) {
      const v = (Y - DK.top) / (DK.edge - DK.top), ins = Math.round((1 - v) * 6), x0 = DK.l + ins, x1 = DK.r - ins;
      for (let X = x0; X < x1; X++) {
        if (X === x0 || X === x1 - 1 || Y === DK.top) { r.set(X, Y, C.out); continue; }
        let q = .18 + v * .42; const streak = ((X + Y * 2.2) % 150 + 150) % 150; if (streak < 5) q += .3; else if (streak < 8) q += .14;
        let col = ramp(D, q, X, Y, .12);
        if (v < .35 && X > SCR.x && X < SCR.x + SCR.w) col = ramp(['#0a1238', '#0f2050', '#173070', '#20408a'], .3 + (.35 - v) * 1.4, X, Y);   // відблиск екрана в глянці
        r.set(X, Y, col);
      }
    }
    // рожевий неоновий торець стільниці
    for (let Y = DK.edge; Y < DK.front; Y++) { const k = Y - DK.edge; for (let X = DK.l; X < DK.r; X++) r.set(X, Y, X === DK.l || X === DK.r - 1 ? C.out : k === 10 ? C.out : [K[7], K[6], K[5], K[5], K[4], K[4], K[3], K[2], K[2], K[1]][k]); }
    // фасад
    for (let Y = DK.front; Y < DK.base; Y++) for (let X = DK.l + 6; X < DK.r - 6; X++) r.set(X, Y, X === DK.l + 6 || X === DK.r - 7 ? C.out : ramp(D, .3 - (Y - DK.front) / 100 * .2, X, Y, .1));
    // ніша для ніг (затінена, з рейками)
    const NX0 = 176, NX1 = 458;
    for (let Y = DK.front; Y < DK.base; Y++) for (let X = NX0; X < NX1; X++) {
      const sh = Y < DK.front + 10 ? '#020008' : (X - NX0) % 14 === 0 ? '#0c0726' : ramp(['#030112', '#060320', '#0a052c'], .2 + (Y - DK.front) / 100 * .6, X, Y);
      r.set(X, Y, X === NX0 || X === NX1 - 1 ? C.out : sh);
    }
    r.rect(NX0, 604, NX1 - NX0, 6, D[3]); r.rect(NX0, 604, NX1 - NX0, 1, D[6]); r.rect(NX0, 609, NX1 - NX0, 1, C.out);       // поперечина
    // шухляди: фаска (світло зліва-згори), ручка з хрому, гніздо для LED
    DRAWERS.forEach(([x, y, w, h]) => {
      for (let j = 0; j < h; j++) for (let i = 0; i < w; i++) {
        const X = x + i, Y = y + j; let col;
        if (i === 0 || j === 0) col = D[6]; else if (i === w - 1 || j === h - 1) col = C.out; else if (i === 1 || j === 1) col = D[5]; else col = ramp(D, .4 - j / h * .22 + (1 - i / w) * .05, X, Y, .1);
        r.set(X, Y, col);
      }
      const cx = x + w / 2, cy = y + h / 2;
      r.rect(cx - 16, cy - 2, 32, 4, C.out); r.rect(cx - 15, cy - 1, 30, 1, CH[5]); r.rect(cx - 15, cy, 30, 1, CH[3]);
      r.rect(x + w - 12, cy - 1, 4, 2, CY[1]);
    });
    // AI-ядро: сервер з решіткою, стовпчиком LED і вентилятором
    rr(r, CORE.x, CORE.y, CORE.w, CORE.h, 4, (d, u, v, X, Y) => d < 1.3 ? C.out : d < 3 ? (u < .5 ? MB[6] : MB[3]) : ramp(MB, .45 - v * .3, X, Y));
    rr(r, FAN[0] - 15, FAN[1] - 15, 30, 30, 15, (d, u, v, X, Y) => d < 1.5 ? CH[3] : d < 3 ? C.out : '#03020c');
    for (let y = CORE.y + 50; y < CORE.y + CORE.h - 6; y += 3) r.rect(CORE.x + 8, y, CORE.w - 16, 1, '#0a0820');
    // цоколь з канавкою для LED і хромові ніжки
    for (let Y = DK.base; Y < DK.bot; Y++) for (let X = DK.l + 4; X < DK.r - 4; X++) r.set(X, Y, Y === DK.base ? CH[2] : Y === DK.bot - 1 ? C.out : (Y > DK.base + 3 && Y < DK.base + 8) ? '#05021a' : D[1]);
    for (const lx of [16, 160, 470, 600]) { r.rect(lx, DK.bot, 12, 4, CH[3]); r.rect(lx, DK.bot + 3, 12, 1, CH[1]); }
  }

  // ---------- дрібниці на столі і рослина ----------
  function buildProps(r) {
    // горнятко з неоновою смужкою
    const { x, y } = MUG; rr(r, x, y + 2, 14, 18, 3, (d, u, v, X, Y) => d < 1.2 ? C.out : v > .38 && v < .55 ? CY[4] : ramp(K, .75 - u * .45, X, Y));
    r.rect(x + 2, y + 2, 10, 2, '#2a1408'); r.rect(x + 14, y + 7, 4, 1, C.out); r.rect(x + 17, y + 7, 1, 7, C.out); r.rect(x + 14, y + 13, 4, 1, C.out); r.rect(x + 15, y + 8, 2, 5, K[3]);
    // настільна лампа: основа, кронштейн, плафон
    const L = LAMP; rr(r, L.x - 14, DK.top + 10, 28, 7, 3, (d, u, v, X, Y) => d < 1.2 ? C.out : ramp(CH, .8 - v * .7, X, Y));
    r.line(L.x, DK.top + 10, L.x + 6, L.y + 22, C.out); r.line(L.x + 1, DK.top + 10, L.x + 7, L.y + 22, CH[3]); r.line(L.x + 2, DK.top + 10, L.x + 8, L.y + 22, CH[1]);
    for (let j = 0; j < 14; j++) { const w = 12 + j * 1.2, x0 = Math.round(L.x + 6 - w / 2); for (let i = 0; i < w; i++) r.set(x0 + i, L.y + 10 + j, i === 0 || i >= w - 1 || j === 0 ? C.out : ramp(K, .7 - j / 14 * .5 - i / w * .2, x0 + i, L.y + 10 + j)); }
    r.rect(L.x - 2, L.y + 24, 16, 2, '#fff2c0');
    // рослина в неоновому горщику перед столом
    const px = 396, py = 610;
    const leaf = (cx, cy, len, ang, wd) => { const ca = Math.cos(ang), sa = Math.sin(ang);
      for (let k = 0; k <= len; k++) for (let m = -wd; m <= wd; m++) { const q = k / len, half = wd * Math.sin(Math.PI * Math.min(1, q * 1.15)); if (Math.abs(m) > half) continue;
        const X = Math.round(cx + ca * k - sa * m), Y = Math.round(cy + sa * k + ca * m);
        r.set(X, Y, Math.abs(m) < .8 ? C.leaf[4] : Math.abs(m) > half - 1.1 ? C.leaf[0] : ((m + k) & 3) ? C.leaf[2] : C.leaf[3]); } };
    [[-2.2, 40, 9], [-1.85, 52, 10], [-1.45, 58, 10], [-1.15, 50, 9], [-.8, 40, 8], [-2.6, 30, 7], [-.45, 28, 7]].forEach(([a, len, wd]) => leaf(px, py - 2, len, a, wd));
    rr(r, px - 22, py, 44, 34, 6, (d, u, v, X, Y) => d < 1.3 ? C.out : v < .14 ? (v < .07 ? K[6] : K[3]) : ramp(D, .62 - v * .4 - u * .15, X, Y));
  }

  function buildBody() {
    const r = Raster(GW, GH);
    buildScreen(r); buildMonitor(r); buildDesk(r);
    buildLaptop(r, L2, S2, K.slice(0, 6)); buildLaptop(r, L1, S1, CH);
    buildProps(r);
    outline(r, C.out);
    return r.canvas();
  }
  /** Віддзеркалення столу (від стільниці до підлоги) з затуханням і смугами глянцю. */
  function buildRefl(body) {
    const h = DK.bot + 4 - DK.top, cv = document.createElement('canvas'); cv.width = GW; cv.height = h; const x = cv.getContext('2d');
    x.drawImage(body, 0, DK.top, GW, h, 0, 0, GW, h); x.globalCompositeOperation = 'destination-in';
    const g = x.createLinearGradient(0, 0, 0, h); g.addColorStop(0, 'rgba(0,0,0,0)'); g.addColorStop(1, 'rgba(0,0,0,1)'); x.fillStyle = g; x.fillRect(0, 0, GW, h);
    x.globalCompositeOperation = 'destination-out';
    for (let i = 0; i < GW; i += 3) { const v = hash(i, 11); if (v > .55) { x.fillStyle = `rgba(0,0,0,${(v - .55) * 1.6})`; x.fillRect(i, 0, 2, h); } }
    return cv;
  }

  let BODY = null, REFL = null;
  const rgba = (rgb, a) => `rgba(${rgb},${a})`;
  const lit = (c, x, y, w, h, col) => { c.fillStyle = col; c.fillRect(x, y, w, h); };
  const noise = (t, i) => .5 + .26 * Math.sin(t * 1.3 + i * 1.7) + .16 * Math.sin(t * 2.9 + i * 3.1) + .08 * Math.sin(t * 5.3 + i * .7);

  NX.addObject({
    id: 'aiPc', name: 'obj.aiPc', act: 'ai',
    hit: { x: 26, y: 44, w: 308, h: 318 }, active: false, prog: 0,
    burst: 0, sweep: null, nextSweep: 4, msgs: 0,
    /** Тап по мозку — спалах думки (меню задач однаково відкривається). */
    onTap(x, y) {
      const [gx, gy] = toGrid(x, y);
      if (gx > BR.x && gx < BR.x + BR.w && gy > BR.y && gy < BR.y + BR.h) {
        this.burst = 1; const [bx, by] = toRoom(BC[0], BC[1]);
        for (let i = 0; i < 12; i++) NX.fx.emit('spark', bx + (Math.random() - .5) * 60, by + (Math.random() - .5) * 40, { col: Math.random() < .5 ? '#7af0ff' : '#ff7af0', vy: -20 - Math.random() * 30, g: 20, ttl: 1, s: 1.5 });
      }
      return false;
    },
    update(dt, t) {
      this.burst = Math.max(0, this.burst - dt * .8);
      if (this.sweep === null && t > this.nextSweep) this.sweep = 0;
      if (this.sweep !== null && (this.sweep += dt / 1.4) >= 1) { this.sweep = null; this.nextSweep = t + 8 + Math.random() * 8; }
    },
    // ---------- живі шари (усе в координатах сітки) ----------
    header(c, t) {
      const title = NX.t('nav.ai'), sz = Math.min(18, 210 / title.length), on = .75 + .25 * Math.sin(t * 2);
      P.text(c, title, HDR.x + 36, HDR.y + 17 + sz / 2, rgba('122,240,255', on), sz);
      lit(c, HDR.x + 11, HDR.y + 12, 10, 10, rgba('59,232,255', .5 + .5 * Math.abs(Math.sin(t * 1.6)))); lit(c, HDR.x + 14, HDR.y + 15, 4, 4, '#ffffff');
      const d = new Date(), hm = String(d.getHours()).padStart(2, '0') + (d.getSeconds() % 2 ? ':' : ' ') + String(d.getMinutes()).padStart(2, '0');
      P.text(c, hm, HDR.x + HDR.w - 6, HDR.y + 15, '#3be8ff', 8, 'right');
      lit(c, HDR.x + HDR.w - 46, HDR.y + 21, 5, 5, Math.sin(t * 4) > 0 ? '#3bff8a' : '#1f6a45'); P.text(c, 'LIVE', HDR.x + HDR.w - 6, HDR.y + 28, '#7d8cc4', 6, 'right');
    },
    charts(c, t, k) {
      // 1: LED-стовпчики (блакитні)
      const n = 10, base = CH1.y + CH1.h - 13, top = CH1.y + 20;
      for (let i = 0; i < n; i++) {
        const v = P.clamp(noise(t * k, i) * (.8 + .3 * this.burst), .08, 1), segs = Math.round(v * (base - top) / 4);
        for (let s = 0; s < segs; s++) lit(c, CH1.x + 7 + i * 6.4, base - 4 - s * 4, 5, 3, s === segs - 1 ? '#ffffff' : CY[2 + Math.min(3, (s / segs * 4) | 0)]);
      }
      P.text(c, Math.round(60 + 30 * noise(t * k, 3)) + '%', CH1.x + 6, CH1.y + 14, '#9af6ff', 7);
      // 2: рожевий графік-площа, що біжить
      const b2 = CH2.y + CH2.h - 13, h2 = CH2.h - 34;
      for (let x = 0; x < CH2.w - 12; x += 2) {
        const v = P.clamp(.45 + .25 * Math.sin((x + t * 40 * k) * .09) + .15 * Math.sin((x + t * 25 * k) * .23) + .1 * this.burst, 0, 1), y = b2 - v * h2;
        c.fillStyle = 'rgba(217,75,255,.22)'; c.fillRect(CH2.x + 6 + x, y, 2, b2 - y); lit(c, CH2.x + 6 + x, y, 2, 2, '#ff84d4');
      }
      P.text(c, '+' + Math.round(12 + 20 * noise(t * .3, 7)) + '%', CH2.x + 6, CH2.y + 14, '#ff9ae0', 7);
    },
    brain(c, t, act) {
      const [cx, cy] = BC, pow = .2 + act * .25 + this.burst * .5;
      P.glow(c, cx, cy - 4, 80, 'rgba(59,200,255,.75)', pow + .06 * Math.sin(t * 2));
      // нейрони, що спалахують
      const lit_n = 10 + Math.round(act * 18 + this.burst * 30);
      for (let i = 0; i < lit_n; i++) {
        const nI = (hash(i, Math.floor(t * (1.5 + act * 3) + i * .37)) * NEURONS.length) | 0, p = NEURONS[nI]; if (!p) continue;
        lit(c, p[0] - 1, p[1] - 1, 2, 2, '#ffffff'); c.fillStyle = 'rgba(122,240,255,.6)'; c.fillRect(p[0] - 3, p[1], 6, 1); c.fillRect(p[0], p[1] - 3, 1, 6);
      }
      // імпульси між нейронами
      SYN.forEach(([a, b, h], i) => {
        const sp = .45 + h * .5 + act * .8, ph = (t * sp + h * 3) % 1.6; if (ph > 1) return;
        const x = a[0] + (b[0] - a[0]) * ph, y = a[1] + (b[1] - a[1]) * ph;
        lit(c, x - 1, y - 1, 3, 3, i % 3 ? '#9af6ff' : '#ff9ae0');
        for (let k = 1; k < 4; k++) { const q = Math.max(0, ph - k * .04); c.fillStyle = `rgba(154,246,255,${.5 - k * .14})`; c.fillRect(a[0] + (b[0] - a[0]) * q, a[1] + (b[1] - a[1]) * q, 2, 2); }
      });
      // орбіта даних навколо мозку + скан-лінія
      for (let k = 0; k < 3; k++) { const a = t * (.8 + act) + k * 2.094, x = cx + Math.cos(a) * 70, y = cy + 6 + Math.sin(a) * 12; if (Math.sin(a) < 0 && Math.abs(x - cx) < 60) continue; lit(c, x - 2, y - 2, 4, 4, k === 1 ? '#ff7af0' : '#7af0ff'); }
      const sy = BR.y + 18 + ((t * .35) % 1) * (BR.h - 36); c.fillStyle = 'rgba(122,240,255,.16)'; c.fillRect(BR.x + 3, sy, BR.w - 6, 2);
      // рівень "думки"
      const lvl = this.active ? this.prog : .55 + .35 * noise(t * .4, 2), bx = BR.x + 14, by = BR.y + BR.h - 18, bw = BR.w - 28;
      lit(c, bx, by, bw, 4, '#0a1d40'); lit(c, bx, by, bw * lvl, 4, this.active ? '#3bff8a' : '#3be8ff'); lit(c, bx + bw * lvl - 2, by - 1, 3, 6, '#ffffff');
      P.text(c, 'NEURO ' + Math.round(lvl * 100) + '%', BR.x + 8, BR.y + 14, '#7af0ff', 7);
    },
    icons(c, t, act) {
      const hl = act ? (Math.floor(t * 3) % 2) : Math.floor(t * .7) % 5;
      for (let k = 0; k < 5; k++) {
        const on = k === hl || (act && k < 2 && Math.floor(t * 4 + k) % 2 === 0), y = ICO.y + k * 51; if (!on) continue;
        c.fillStyle = 'rgba(59,232,255,.12)'; c.fillRect(ICO.x + 1, y + 1, ICO.w - 2, 45);
        c.strokeStyle = '#3be8ff'; c.lineWidth = 1; c.strokeRect(ICO.x + .5, y + .5, ICO.w - 1, 46);
        ICONS[k].forEach((row, j) => [...row].forEach((ch, i) => ch === 'X' && lit(c, ICO.x + 12 + i * 3, y + 13 + j * 3, 3, 3, k === 3 ? '#ffe27a' : '#9af6ff')));
      }
    },
    /** ЗАДАЧІ NEXI — вбудовані у великий екран (дані: NX.nexi.history і NX.nexi.task). */
    tasks(c, t) {
      const x = TSK.x, y = TSK.y;
      P.text(c, NX.t('board.title'), x + 8, y + 14, '#3be8ff', 8);
      lit(c, x + TSK.w - 14, y + 6, 7, 7, Math.sin(t * 4) > 0 ? '#3bff8a' : '#1f6a45');
      const rows = NX.nexi.history.slice(-3), cur = NX.nexi.task, all = (cur && !cur.auto ? [...rows, { title: cur.title, color: cur.color, prog: cur.prog }] : rows).slice(-3);
      all.forEach((r, i) => {
        const ry = y + 28 + i * 24, done = r.prog === undefined;
        lit(c, x + 8, ry, 12, 12, '#0a1236'); c.strokeStyle = r.color || '#3be8ff'; c.lineWidth = 1; c.strokeRect(x + 8.5, ry + .5, 11, 11);
        if (done) { lit(c, x + 11, ry + 6, 2, 2, '#3bff8a'); lit(c, x + 13, ry + 8, 2, 2, '#3bff8a'); lit(c, x + 15, ry + 3, 2, 5, '#3bff8a'); }
        else lit(c, x + 11, ry + 3, 6, 6, Math.sin(t * 6) > 0 ? (r.color || '#3be8ff') : '#0a1236');
        P.text(c, r.title.toUpperCase().slice(0, 29), x + 26, ry + 10, done ? '#7d8cc4' : '#ffffff', 6);
        if (!done) { lit(c, x + 26, ry + 15, TSK.w - 40, 3, '#1b2a66'); lit(c, x + 26, ry + 15, (TSK.w - 40) * r.prog, 3, r.color || '#3be8ff'); }
      });
      if (!all.length) { const w = NX.t('board.waiting'); P.text(c, w, x + 8, y + 50, '#7d8cc4', 7); if (Math.sin(t * 5) > 0) lit(c, x + 10 + Math.min(180, w.length * 7), y + 43, 6, 8, '#3be8ff'); }
    },
    eq(c, t, act) {
      for (let i = 0; i < 36; i++) { const v = P.clamp(noise(t * (1 + act * 2), i * .6), .1, 1), h = Math.round(v * (EQ.h - 6)); lit(c, EQ.x + 4 + i * 8, EQ.y + EQ.h - 2 - h, 5, h, i % 6 === 0 ? '#ff7af0' : '#2aa6c8'); }
    },
    monitor(c, t) {
      P.text(c, 'KPI', MS.x + 8, MS.y + 15, '#3be8ff', 7); P.text(c, '+' + (18 + Math.round(6 * noise(t * .2, 1))) + '%', MS.x + MS.w - 8, MS.y + 15, '#3bff8a', 7, 'right');
      const b = MS.y + MS.h - 6, h = MS.h - 34;
      for (let x = 0; x < MS.w - 8; x += 2) {
        const v1 = .5 + .3 * Math.sin((x + t * 30) * .07) + .12 * Math.sin((x + t * 50) * .19), v2 = .35 + .2 * Math.sin((x + t * 22) * .05 + 2);
        const y1 = b - v1 * h, y2 = b - v2 * h;
        c.fillStyle = 'rgba(59,232,255,.13)'; c.fillRect(MS.x + 4 + x, y1, 2, b - y1);
        lit(c, MS.x + 4 + x, y1, 2, 2, '#7af0ff'); lit(c, MS.x + 4 + x, y2, 2, 1, '#ff7af0');
      }
      const px = MS.x + 4 + ((t * 30) % (MS.w - 8)); c.fillStyle = 'rgba(255,255,255,.25)'; c.fillRect(px, MS.y + 22, 1, h + 6);
    },
    /** Головний ноутбук: друк відповіді, коли Nexi працює; в спокої — заставка з логотипом. */
    laptop1(c, t) {
      const s = S1;
      if (this.active) {
        const lines = Math.min(6, Math.floor(this.prog * 16) + 1);
        for (let i = 0; i < lines; i++) { const w = [60, 44, 54, 30, 50, 38][i]; lit(c, s.x + 4, s.y + 4 + i * 6, i === lines - 1 ? w * ((t * 3) % 1) : w, 3, i % 2 ? '#ff7af0' : '#7af0ff'); }
        if (this.prog > .8) { lit(c, s.x + s.w - 22, s.y + s.h - 10, 18, 7, '#3bff8a'); lit(c, s.x + s.w - 18, s.y + s.h - 7, 10, 1, '#0a3a1a'); }
        for (let i = 0; i < 14; i++) if (((t * 14 + i * 5) | 0) % 3 === 0) lit(c, L1.x + 4 + i * 6, L1.y + L1.h + 4 + (i % 3) * 3, 4, 2, '#7af0ff');      // клавіші під пальцями
      } else {
        const bx = s.x + s.w / 2 + Math.sin(t * .7) * 18, by = s.y + s.h / 2 + Math.sin(t * 1.1) * 6, a = .6 + .4 * Math.sin(t * 2);
        ['X...X', 'XX..X', 'X.X.X', 'X..XX', 'X...X'].forEach((row, j) => [...row].forEach((ch, i) => ch === 'X' && lit(c, bx - 7 + i * 3, by - 7 + j * 3, 3, 3, rgba('59,232,255', a))));
      }
    },
    /** Другий ноутбук: живий чат з клієнтами (бульбашки виїжджають знизу). */
    laptop2(c, t) {
      const s = S2, step = 1.7, n = Math.floor(t / step), f = (t % step) / step;
      c.save(); c.beginPath(); c.rect(s.x, s.y, s.w, s.h); c.clip();
      for (let k = 0; k < 4; k++) {
        const id = n - k, me = id % 2 === 0, w = 18 + hash(id, 2) * (s.w - 30), y = s.y + s.h - 10 - k * 10 - Math.min(1, f * 4) * 10 + 10;
        const x = me ? s.x + s.w - 4 - w : s.x + 4;
        if (k === 0 && f < .35 && !me) { for (let d = 0; d < 3; d++) lit(c, x + 2 + d * 4, y + 2, 2, 2, Math.floor(t * 6) % 3 === d ? '#ffffff' : '#5a6590'); continue; }
        lit(c, x, y, w, 7, me ? '#1a7aa0' : '#3a2a66'); lit(c, x + 2, y + 2, w * .7, 1, me ? '#9af6ff' : '#c3a8ff'); lit(c, x + 2, y + 4, w * .45, 1, me ? '#9af6ff' : '#c3a8ff');
      }
      c.restore();
    },
    /** Потік даних: від ноутбука, на якому друкує Nexi, у "мозок". */
    stream(c, t) {
      const [ax, ay] = [S1.x + S1.w / 2, S1.y], [bx, by] = [BC[0] + 40, BC[1] + 40], mx = ax + 10, my = BR.y + BR.h + 40;
      for (let i = 0; i < 9; i++) {
        const q = (t * .9 + i / 9) % 1, u = 1 - q, x = u * u * ax + 2 * u * q * mx + q * q * bx, y = u * u * ay + 2 * u * q * my + q * q * by;
        lit(c, x - 1.5, y - 1.5, 3, 3, i % 3 ? '#7af0ff' : '#ff7af0'); c.fillStyle = 'rgba(122,240,255,.25)'; c.fillRect(x - 3, y - 3, 6, 6);
      }
    },
    deskLive(c, t, act) {
      // неоновий торець стільниці: пульс + бігуча іскра
      c.fillStyle = rgba('255,79,216', .35 + .2 * Math.sin(t * 2.2) + act * .15); c.fillRect(DK.l + 2, DK.edge, DK.r - DK.l - 4, 3);
      const sp = DK.l + ((t * .25) % 1) * (DK.r - DK.l); lit(c, sp - 10, DK.edge, 20, 2, 'rgba(255,255,255,.85)');
      // LED-стрічка в цоколі (у роботі — веселка)
      for (let gx = DK.l + 8; gx < DK.r - 8; gx += 4) { const hue = (t * 120 + gx * 1.1) % 360; c.fillStyle = act ? `hsla(${hue},95%,62%,.85)` : rgba('59,232,255', .45 + .3 * Math.sin(t * 2 + gx * .04)); c.fillRect(gx, DK.base + 4, 3, 4); }
      // LED на шухлядах
      DRAWERS.forEach(([x, y, w, h], i) => lit(c, x + w - 12, y + h / 2 - 1, 4, 2, rgba('59,232,255', .5 + .5 * Math.sin(t * 2 + i))));
      // AI-ядро: стовпчик LED + вентилятор
      for (let k = 0; k < 6; k++) lit(c, CORE.x + 8 + (k % 2) * 6, CORE.y + 8 + (k >> 1) * 6, 3, 3, hash(k, Math.floor(t * (4 + act * 8))) > .4 ? ['#3bff8a', '#3be8ff', '#ff7af0'][k % 3] : '#0a1a20');
      P.glow(c, FAN[0], FAN[1], 22, 'rgba(59,232,255,.7)', .25 + act * .3);
      const fa = t * (4 + act * 14); for (let b = 0; b < 4; b++) { const a = fa + b * Math.PI / 2; for (let rr2 = 3; rr2 < 12; rr2 += 1.5) lit(c, FAN[0] + Math.cos(a + rr2 * .06) * rr2 - .5, FAN[1] + Math.sin(a + rr2 * .06) * rr2 - .5, 1.5, 1.5, '#5ad8ff'); }
      lit(c, FAN[0] - 2, FAN[1] - 2, 4, 4, '#c3cbea');
      // лампа: тепле світло на стільницю
      c.fillStyle = 'rgba(255,226,140,.10)'; c.beginPath(); c.moveTo(LAMP.x - 2, LAMP.y + 26); c.lineTo(LAMP.x + 14, LAMP.y + 26); c.lineTo(LAMP.x + 30, DK.edge); c.lineTo(LAMP.x - 22, DK.edge); c.fill();
      P.glow(c, LAMP.x + 6, LAMP.y + 26, 18, 'rgba(255,220,140,.9)', .45 + .05 * Math.sin(t * 7));
      // пара над кавою
      for (let i = 0; i < 4; i++) { const q = (t * .5 + i / 4) % 1; c.fillStyle = `rgba(220,230,255,${.35 * (1 - q)})`; c.fillRect(MUG.x + 5 + Math.sin(q * 6 + i) * 3, MUG.y - q * 22, 2, 2); }
    },
    frameLive(c, t, act) {
      const rnd = (o, lw, a) => { c.strokeStyle = rgba('255,79,216', a); c.lineWidth = lw; c.beginPath(); c.roundRect ? c.roundRect(SCR.x - o, SCR.y - o, SCR.w + 2 * o, SCR.h + 2 * o, SCR.r + o) : c.rect(SCR.x - o, SCR.y - o, SCR.w + 2 * o, SCR.h + 2 * o); c.stroke(); };
      const halo = .07 + .03 * Math.sin(t * 1.8) + act * .04 + this.burst * .08; rnd(4, 8, halo); rnd(10, 12, halo * .5);     // неоновий ореол рамки на стіні
      c.strokeStyle = rgba('255,120,230', .25 + .15 * Math.sin(t * 1.8) + act * .15 + this.burst * .3); c.lineWidth = 3;
      c.beginPath(); c.roundRect ? c.roundRect(SCR.x + 5, SCR.y + 5, SCR.w - 10, SCR.h - 10, SCR.r - 5) : c.rect(SCR.x + 5, SCR.y + 5, SCR.w - 10, SCR.h - 10); c.stroke();
      // іскра, що біжить по рамці
      const per = 2 * (SCR.w + SCR.h - 40), d = (t * 120) % per, W = SCR.w - 40, H = SCR.h - 40; let x, y;
      if (d < W) { x = SCR.x + 20 + d; y = SCR.y + 5; } else if (d < W + H) { x = SCR.x + SCR.w - 5; y = SCR.y + 20 + d - W; } else if (d < 2 * W + H) { x = SCR.x + SCR.w - 20 - (d - W - H); y = SCR.y + SCR.h - 5; } else { x = SCR.x + 5; y = SCR.y + SCR.h - 20 - (d - 2 * W - H); }
      P.glow(c, x, y, 12, 'rgba(255,200,250,.9)', .8); lit(c, x - 2, y - 2, 4, 4, '#ffffff');
      // відблиск, що пробігає по склу
      if (this.sweep !== null) {
        const p = GL.x - 80 + this.sweep * (GL.w + 160);
        c.save(); c.beginPath(); c.rect(GL.x, GL.y, GL.w, GL.h); c.clip();
        c.fillStyle = 'rgba(160,230,255,.10)'; c.beginPath(); c.moveTo(p, GL.y); c.lineTo(p + 40, GL.y); c.lineTo(p - 30, GL.y + GL.h); c.lineTo(p - 70, GL.y + GL.h); c.fill();
        c.fillStyle = 'rgba(255,255,255,.14)'; c.beginPath(); c.moveTo(p + 50, GL.y); c.lineTo(p + 56, GL.y); c.lineTo(p - 14, GL.y + GL.h); c.lineTo(p - 20, GL.y + GL.h); c.fill(); c.restore();
      }
    },
    drawBack(c, t) {
      if (!BODY) { BODY = buildBody(); REFL = buildRefl(BODY); }
      const act = this.active ? 1 : 0, Kk = NX.cam.k * (NX.loop.dpr || 1), X = Math.round(X0 * Kk) / Kk, Y = Math.round(Y0 * Kk) / Kk;
      const floor = Y0 + DK.bot * U;
      c.save(); c.imageSmoothingEnabled = false;
      // віддзеркалення столу в глянцевій підлозі
      c.save(); c.translate(X, floor * 2); c.scale(U, -U); c.globalAlpha = .26; c.drawImage(REFL, 0, Y0 / U + DK.top); c.restore();
      // тінь контакту з підлогою
      c.fillStyle = 'rgba(4,2,14,.55)'; c.beginPath(); c.ellipse(X0 + (DK.l + DK.r) / 2 * U, floor, (DK.r - DK.l) * U / 2, 4, 0, 0, 7); c.fill();
      // сам об'єкт (одна трансформація на весь AI-центр)
      c.translate(X, Y); c.scale(U, U);
      c.drawImage(BODY, 0, 0);
      c.globalCompositeOperation = 'lighter';
      this.charts(c, t, 1 + act * 1.5); this.brain(c, t, act); this.icons(c, t, act); this.eq(c, t, act);
      this.monitor(c, t); this.laptop2(c, t); this.deskLive(c, t, act); this.frameLive(c, t, act);
      if (act) this.stream(c, t);
      c.globalCompositeOperation = 'source-over';
      this.header(c, t); this.tasks(c, t); this.laptop1(c, t);
      // світіння скла на стіну і стіл
      P.glow(c, MS.x + MS.w / 2, MS.y + MS.h / 2, 90, 'rgba(59,232,255,.5)', .12 + .04 * Math.sin(t * 1.4));
      P.glow(c, S1.x + S1.w / 2, S1.y + S1.h / 2, 50, 'rgba(59,232,255,.6)', .18 + act * .25);
      c.restore();
    },
  });
})();

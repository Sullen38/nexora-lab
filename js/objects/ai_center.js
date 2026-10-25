/* ============================================================================
 * objects/ai_center.js — AI-ЦЕНТР У ПЕРСПЕКТИВІ (окремий об'єкт, піксель-арт кодом)
 * ----------------------------------------------------------------------------
 * Уся зона AI-центру — від підлоги до самого верху — намальована кодом
 * у перспективі самої кімнати (core/persp.js: точка сходу в центрі вікна).
 * Роздільність: 1 піксель = 0.25 одиниці кімнати (удвічі дрібніше, ніж диван).
 * Нічого не вирізано з картинки: фон під зоною повністю закритий стіною.
 *
 * Шари (усе будується один раз, потім щокадру лише "живе"):
 *   WALL   — ліва стіна кімнати (площина x = 0): цегла, плінтус з неоном,
 *            бра, колона на межі зони, торці екранів (видно товщину)
 *   BIGF   — великий екран "AI-ЦЕНТР" (пласка картинка 640×960, кладеться
 *            на стіну стовпчиками -> стоїть під кутом, як у кімнаті):
 *            шапка з годинником, 2 графіки, нейро-мозок, іконки,
 *            ВБУДОВАНА панель "Задачі Nexi", еквалайзер
 *   UPA/UPB — два верхні екрани на стіні: мережа з пакетами, журнал подій
 *   DESKS  — СТІЛ: перший і найближчий (фронтально, як на картинці), трохи
 *            перекриває стіл аналітики; плита з рожевим переливом, тумба з
 *            шухлядами, шафка AI-ядра, ніші; правий торець — до вікна (buildDeskSheet)
 *   FRONT  — речі на столі: монітор-коробка, бази голо-ноутбуків, горнятко, лампа
 *   PROPIMG — дрібнички з картинки на краю стола (tools/image/07_desk_props.py)
 *   MONF/L1F/L2F — живі екрани монітора й ноутбуків
 * Nexi злітає на стільницю (POI.aiDesk) і друкує на головному ноутбуці.
 * Тап по мозку — "спалах думки"; тап по зоні — меню з 3 задачами.
 * Вазони й ліани цієї зони — окремі об'єкти, точні копії з картинки: objects/wing_plants.js.
 * ========================================================================== */
(() => {
  const P = NX.px, { Raster, outline, bump, hash, BAYER } = NX.art, V = NX.persp;
  // меблі й підлога: та сама кімната, але точка сходу на рівні стільниць (лінії столу пологі, як у меблів картинки)
  const VD = NX.persp.desk;
  const U = .25;

  // ---------- палітра кімнати ----------
  const K = ['#3a0b38', '#58134f', '#7a1c6d', '#a0288d', '#c63aa8', '#e656c0', '#ff84d4', '#ffc2ec'];   // рожевий неон
  const D = ['#07041a', '#0d0828', '#140c36', '#1c1146', '#251758', '#301e6c', '#3d2784', '#4d33a0'];   // фіолет меблів
  const BRK = ['#0c0719', '#150b28', '#1e1138', '#28174a', '#341d5c', '#42256e', '#542f86', '#6a3c9a'];             // цегла стіни
  const G = ['#0a1d58', '#0d266c', '#113082', '#153c9a', '#1a48b0'];                                                 // скло
  const CY = ['#0a2a4a', '#0f4870', '#17709a', '#2aa6c8', '#3be8ff', '#9af6ff', '#ffffff'];
  const CH = ['#22264e', '#353b6a', '#555f8c', '#848db4', '#bcc5e6', '#eef2ff'];                           // хром
  const MB = ['#0b0920', '#141030', '#1e1940', '#2a2454', '#38316a', '#4c4486', '#6a62a8'];               // корпуси
  const C = { out: '#0b0420', panel: '#0c2a78', pb: '#4a9af0' };
  const FL = ['#07041a', '#0c0726', '#120b34', '#1a1046', '#231658', '#2e1c6c'];                          // глянцева підлога

  const dith = (i, j) => BAYER[(j & 3) * 4 + (i & 3)];
  const ramp = (pal, q, i, j, g = 0) => pal[P.clamp(Math.round(P.clamp(q, 0, 1) * (pal.length - 1) + dith(i, j) * .9 + (g ? (hash(i, j) - .5) * g : 0)), 0, pal.length - 1)];
  /** Заокруглений прямокутник у пласкому растрі: fn(глибина від краю, u, v, i, j). */
  function rr(r, x0, y0, w, h, rad, fn) {
    for (let j = 0; j < h; j++) for (let i = 0; i < w; i++) {
      const qx = Math.abs(i + .5 - w / 2) - (w / 2 - rad), qy = Math.abs(j + .5 - h / 2) - (h / 2 - rad);
      const sd = Math.min(Math.max(qx, qy), 0) + Math.hypot(Math.max(qx, 0), Math.max(qy, 0)) - rad;
      if (sd > 0) continue; const col = fn(-sd, (i + .5) / w, (j + .5) / h, x0 + i, y0 + j); if (col) r.set(x0 + i, y0 + j, col);
    }
  }
  const glass = (r, x, y, w, h, q0 = .6) => { for (let j = 0; j < h; j++) for (let i = 0; i < w; i++) r.set(x + i, y + j, j % 3 === 2 ? G[0] : ramp(G, q0 - j / h * .35, x + i, y + j)); };
  function panel(r, p, t = 12) {
    r.rect(p.x, p.y, p.w, p.h, C.panel); for (let j = 1; j < p.h; j += 3) r.rect(p.x + 1, p.y + j, p.w - 2, 1, G[1]);
    r.rect(p.x, p.y, p.w, 1, C.pb); r.rect(p.x, p.y + p.h - 1, p.w, 1, C.pb); r.rect(p.x, p.y, 1, p.h, C.pb); r.rect(p.x + p.w - 1, p.y, 1, p.h, C.pb);
    for (const [x, y, dx, dy] of [[p.x, p.y, 1, 1], [p.x + p.w - 1, p.y, -1, 1], [p.x, p.y + p.h - 1, 1, -1], [p.x + p.w - 1, p.y + p.h - 1, -1, -1]])
      for (let k = 0; k < t; k++) { r.set(x + k * dx, y, CY[4]); r.set(x, y + k * dy, CY[4]); r.set(x + k * dx, y + dy, CY[2]); r.set(x + dx, y + k * dy, CY[2]); }
    r.rect(p.x + 2, p.y + 2, p.w - 4, 1, CY[1]);
  }
  const bitmap = (r, rows, x, y, s, col, hi) => rows.forEach((row, j) => [...row].forEach((ch, i) => { if (ch !== 'X') return; r.rect(x + i * s, y + j * s, s, s, col); if (hi) r.rect(x + i * s, y + j * s, s, 1, hi); }));
  const lit = (c, x, y, w, h, col) => { c.fillStyle = col; c.fillRect(x, y, w, h); };
  const rgba = (rgb, a) => `rgba(${rgb},${P.clamp(a, 0, 1)})`;
  const noise = (t, i) => .5 + .26 * Math.sin(t * 1.3 + i * 1.7) + .16 * Math.sin(t * 2.9 + i * 3.1) + .08 * Math.sin(t * 5.3 + i * .7);
  const canvas = (w, h) => { const cv = document.createElement('canvas'); cv.width = w; cv.height = h; const x = cv.getContext('2d'); x.imageSmoothingEnabled = false; return [cv, x]; };

  // =====================================================================
  // ГЕОМЕТРІЯ СВІТУ (x, y, z) — див. core/persp.js
  // =====================================================================
  const BIG = { xw: 3, z0: 55, z1: 231, y0: 25, y1: 291 };       // великий екран (на стіні, під кутом)
  const UPA = { xw: 3, z0: 40, z1: 108, y0: -30, y1: 12 };       // верхній екран 1 (мережа) — на місці двох маленьких екранів картинки
  const UPB = { xw: 3, z0: 116, z1: 166, y0: -26, y1: 12 };      // верхній екран 2 (журнал)
  const LANT = [{ z0: 174, z1: 195, y0: -36, y1: 22, w: 4 }, { z0: 207, z1: 214, y0: -33, y1: 19, w: 2.5 }];   // теплі ліхтарі на стіні (як на картинці)
  const MON = { x0: 40, x1: 62, y0: 207, y1: 284, z0: -8, z1: 44 };   // монітор (як на картинці: корпус видно спереду, екран дивиться в кімнату)
  const LP1 = { x0: 26, x1: 48, z0: 126, z1: 150, scr: { xw: 28, z0: 127, z1: 150, y0: 266, y1: 296 }, neon: ['#3be8ff', '#2aa6c8'] };   // головний голо-ноутбук
  const LP2 = { x0: 26, x1: 46, z0: 94, z1: 116, scr: { xw: 28, z0: 95, z1: 116, y0: 270, y1: 296 }, neon: ['#ff4fd8', '#c63aa8'] };
  const MUG = { x0: 44, x1: 50, y0: 291, y1: 299, z0: 117, z1: 123 };
  const LAMP = { x: 30, z: 200 };
  const TOPY = 299;                                               // висота стільниці у світі (для речей на столі)
  const WALLR = { w: 248, h: 365 }, FRONTR = { oy: 222, w: 330, h: 142 }, FLOORR = { oy: 290, w: 350, h: 136 };

  // =====================================================================
  // СТІНА (ліва стіна кімнати, x = 0) — цегла з неоновим плінтусом
  // =====================================================================
  function buildWall() {
    const r = Raster(WALLR.w / U, WALLR.h / U), Z1 = 246, Y0 = -260, Y1 = 362;
    V.box(r, 0, 0, U, { x0: -40, x1: 0, y0: Y0, y1: Y1, z0: 0, z1: Z1 }, { right: (u, v, i, j) => {
      const z = u * Z1, Y = Y0 + v * (Y1 - Y0);
      if (z > 235) { const k = z - 235; return k < .7 || k > 10.3 ? C.out : Math.abs(k - 5.5) < .5 ? CY[3] : ramp(MB, .55 - Math.abs(k - 5.5) / 6 - (Y > 300 ? .1 : 0), i, j); }   // колона на межі зони
      if (Y > 345) { const k = Y - 345; return k < 1 ? K[7] : k < 2 ? K[5] : k < 2.6 ? K[2] : ramp(D, .25 - k / 30, i, j); }                                      // плінтус з неоном
      const row = Math.floor(Y / 7), bz = (((z + (row & 1) * 7) % 14) + 14) % 14, by = ((Y % 7) + 7) % 7;
      if (bz < .8 || by < .6) return '#08041a';                                                                                                                 // шви
      const id = Math.floor((z + (row & 1) * 7) / 14) * 31 + row;
      let q = .26 + hash(id, 7) * .24 + (by < 1.4 ? .14 : by > 6.2 ? -.1 : 0) + (bz < 1.6 ? .06 : 0);
      q += Math.max(0, 1 - Math.hypot(z - 25, Y - 256) / 60) * .45;                                                                                             // тепле світло бра
      q += Math.max(0, 1 - Math.abs(Y - 160) / 200) * Math.max(0, 1 - Math.abs(z - 143) / 140) * .12;                                                          // відсвіт екрана
      return ramp(BRK, q, i, j, .25);
    } });
    // торці екранів (товщина корпусу, видно з боку глядача) + тінь під ними
    for (const S of [BIG, UPA, UPB]) {
      V.box(r, 0, 0, U, { x0: 0, x1: S.xw, y0: S.y0, y1: S.y1, z0: S.z0 - .01, z1: S.z1 }, { front: (u, v, i, j) => u < .2 ? C.out : ramp(S === BIG ? K : MB, (S === BIG ? .55 : .5) - v * .3 + (u > .6 ? .1 : 0), i, j) });
      V.box(r, 0, 0, U, { x0: -1, x1: 0, y0: S.y1, y1: S.y1 + 5, z0: S.z0 + 2, z1: S.z1 }, { right: (u, v) => v < .5 ? '#05020f' : null });
    }
    // теплі ліхтарі на стіні над екраном (як на картинці): дах-козирок, золоте скло з рамкою, слім-лампа
    LANT.forEach((L, n) => {
      V.box(r, 0, 0, U, { x0: 0, x1: L.w, y0: L.y0, y1: L.y1, z0: L.z0, z1: L.z1 }, {
        front: (u, v, i, j) => ramp(['#3a1408', '#5c2410', '#823a18'], .6 - v * .4, i, j),
        right: (u, v, i, j) => { const e = Math.min(u * (L.z1 - L.z0), (1 - u) * (L.z1 - L.z0), v * (L.y1 - L.y0), (1 - v) * (L.y1 - L.y0));
          if (e < .6) return '#2a0a04'; if (e < 1.8) return ramp(['#5c2410', '#9a4a1a', '#d8782a', '#f4a046'], .7 - v * .4 + (u < .3 ? .2 : 0), i, j);
          if (n === 0 && Math.abs(u - .62) < .03) return '#9a4a1a';                                                    // переплет
          return ramp(['#c86a1e', '#f0a03a', '#ffd06a', '#ffe9a6', '#fff8dc'], .95 - Math.abs(u - .38) * 1.6 - Math.abs(v - .45) * .5, i, j); },
      });
      if (n === 0) V.box(r, 0, 0, U, { x0: 0, x1: 6.5, y0: L.y0 - 4, y1: L.y0, z0: L.z0 - 4, z1: L.z1 + 6 }, {                  // козирок
        right: (u, v, i, j) => v < .3 ? '#ffb070' : ramp(['#3a1408', '#6e3418', '#a85a26'], .7 - v * .5, i, j), front: () => '#5c2410', bottom: () => '#2a0a04' });
    });
    // бра (тепла лампа на стіні)
    V.box(r, 0, 0, U, { x0: 0, x1: 4, y0: 249, y1: 263, z0: 22, z1: 28 }, { front: (u, v, i, j) => ramp(CH, .6 - v * .4, i, j), right: (u, v, i, j) => v > .3 && v < .7 ? (v < .4 ? '#fff6c8' : '#ffd77a') : ramp(MB, .5 - u * .3, i, j) });
    return r.canvas();
  }

  // =====================================================================
  // ВЕЛИКИЙ ЕКРАН (пласкі координати 640×960)
  // =====================================================================
  const BW = 640, BH = 960;
  const HD = { x: 56, y: 52, w: 528, h: 70 }, C1 = { x: 56, y: 138, w: 150, h: 250 }, C2 = { x: 56, y: 400, w: 150, h: 226 };
  const BR = { x: 218, y: 138, w: 262, h: 488 }, BC = [349, 376];
  const IC = { x: 492, y: 138, w: 92, h: 488 }, TK = { x: 170, y: 640, w: 414, h: 200 }, EQ = { x: 56, y: 854, w: 528, h: 54 };
  const ICONS = [
    ['.XXXXXXX.', 'X.......X', 'X.X.X.X.X', 'X.......X', '.XXXXXXX.', '..XX.....', '..X......'],
    ['XXXXXXXXX', 'XX.....XX', 'X.X...X.X', 'X..X.X..X', 'X...X...X', 'X.......X', 'XXXXXXXXX'],
    ['.XXXXX...', '.X...XX..', '.X.XX.XX.', '.X.....X.', '.X.XXX.X.', '.X.....X.', '.XXXXXXX.'],
    ['..XXXXX..', '.X.....X.', 'X...X...X', 'X..X.X..X', '.X.....X.', '..XXXXX..', '...XXX...'],
    ['........X', '.......X.', '..X...X..', '.X.X.X...', 'X...X....', '.........', 'XXXXXXXXX'],
  ];
  const NEURONS = [], SYN = [];
  function buildBig() {
    const r = Raster(BW, BH);
    rr(r, 0, 0, BW, BH, 40, (d, u, v, i, j) => {
      if (d < 3) return '#1a0630';
      if (d < 17) return ramp(K, bump((d - 3) / 14) * (.74 + .26 * (1 - v)) + (v < .1 ? .06 : 0), i, j);
      if (d < 19) return '#1a0a36';
      if (d < 30) return ramp(D, .42 - v * .3 + (d < 21 ? .12 : 0), i, j);
      if (d < 32) return '#1d4f86';
      return null;
    });
    glass(r, 32, 32, BW - 64, BH - 64, .55);
    // шапка
    r.rect(HD.x, HD.y, HD.w, HD.h, '#0e3488'); r.rect(HD.x, HD.y + HD.h, HD.w, 2, CY[2]); r.rect(HD.x, HD.y + HD.h + 2, HD.w, 2, CY[0]);
    rr(r, HD.x + 10, HD.y + 11, 48, 48, 10, (d, u, v, i, j) => d < 2.5 ? CY[4] : d < 4.5 ? CY[1] : ramp(['#0e3488', '#1444a8', '#1a56c4'], .7 - v * .5, i, j));
    for (let k = 0; k < 5; k++) { r.rect(HD.x + 17 + k * 8, HD.y + 3, 3, 8, CY[2]); r.rect(HD.x + 17 + k * 8, HD.y + 59, 3, 8, CY[2]); r.rect(HD.x + 2, HD.y + 18 + k * 8, 8, 3, CY[2]); }
    [C1, C2, BR, TK].forEach(p => panel(r, p));
    for (const p of [C1, C2]) { r.rect(p.x + 10, p.y + p.h - 24, p.w - 20, 2, CY[2]); for (let x = p.x + 10; x < p.x + p.w - 10; x += 12) r.rect(x, p.y + p.h - 22, 2, 4, CY[3]); for (let y = p.y + 50; y < p.y + p.h - 24; y += 30) for (let x = p.x + 10; x < p.x + p.w - 10; x += 4) r.set(x, y, '#2a5cc0'); }
    for (let k = 0; k < 5; k++) { const t = { x: IC.x, y: IC.y + k * 99.5 | 0, w: IC.w, h: 90 }; panel(r, t, 8); bitmap(r, ICONS[k], t.x + 19, t.y + 24, 6, CY[1], CY[2]); }
    buildBrain(r);
    r.rect(TK.x + 2, TK.y + 2, TK.w - 4, 34, '#1240a0'); r.rect(TK.x + 2, TK.y + 36, TK.w - 4, 2, CY[2]);
    r.rect(EQ.x, EQ.y, EQ.w, EQ.h, '#0a2468'); r.rect(EQ.x, EQ.y, EQ.w, 2, C.pb);
    return r.canvas();
  }
  /** Піксельний мозок (вигляд збоку): звивини, бічна борозна, мозочок, стовбур; точки нейронів — для анімації. */
  function buildBrain(r) {
    const S = 1.8, W = 260, H = 236, ox = BC[0] - 130, oy = BC[1] - 110, kind = new Uint8Array(W * H);
    for (let j = 0; j < H; j++) for (let i = 0; i < W; i++) {
      const x = (i - 130) / S, y = (j - 108) / S;
      const cer = (x / 66) ** 2 + ((y + 8) / 48) ** 2 <= 1 && y < 30 - Math.max(0, x) * .3 + Math.max(0, -x - 30) * .4;
      const cbl = ((x - 34) / 26) ** 2 + ((y - 34) / 15) ** 2 <= 1;
      const stem = y > 22 && y < 64 && x > 4 - (y - 22) * .2 && x < 20 - (y - 22) * .2;
      kind[j * W + i] = cer ? 1 : cbl ? 2 : stem ? 3 : 0;
    }
    const inside = (i, j) => i >= 0 && j >= 0 && i < W && j < H && kind[j * W + i];
    for (let j = 0; j < H; j++) for (let i = 0; i < W; i++) {
      const k = kind[j * W + i]; if (!k) continue;
      const X = ox + i, Y = oy + j, x = (i - 130) / S, y = (j - 108) / S;
      const e1 = !inside(i - 1, j) || !inside(i + 1, j) || !inside(i, j - 1) || !inside(i, j + 1), e2 = !inside(i - 2, j) || !inside(i + 2, j) || !inside(i, j - 2) || !inside(i, j + 2);
      if (e1) { r.set(X, Y, y < 0 && x < 20 ? CY[5] : CY[4]); continue; }
      if (e2) { r.set(X, Y, CY[2]); continue; }
      const dist = Math.hypot(x / 70, (y + 10) / 54);
      let col = ramp(['#0c2a74', '#10368c', '#1646a6', '#1c58be', '#256cd4', '#3384e8'], .9 - dist * .75 + (-x - y) / 260, X, Y);
      if (k === 1) {
        const f = Math.sin(x * .24 + 2.4 * Math.sin(y * .15 + x * .03)) + Math.sin(y * .21 + 1.9 * Math.sin(x * .12 - .7));
        if (Math.abs(f) < .15) { col = (y < -10 && x < 10) ? CY[5] : CY[3]; if (hash(X, Y) < .045) NEURONS.push([X, Y]); }
        else if (Math.abs(f) < .27) col = CY[1];
        if (Math.abs(y - (8 - x * .32 + Math.sin(x * .2) * 2)) < .8 && x > -30 && x < 40) col = CY[5];                 // бічна борозна
        if (Math.abs(x + 4 + y * .12) < .55 && y < -10) col = CY[3];                                                       // центральна борозна
      } else if (k === 2) col = (Math.floor(y * 1.2) % 3 === 0) ? CY[3] : ramp(['#10368c', '#1646a6', '#1c58be'], .6 - dist * .3, X, Y);
      else col = (Math.floor(x) % 4 === 0) ? CY[2] : '#16449a';
      r.set(X, Y, col);
    }
    for (let i = 0; i < 22; i++) { const a = NEURONS[(hash(i, 3) * NEURONS.length) | 0], b = NEURONS[(hash(i, 9) * NEURONS.length) | 0]; if (a && b && Math.hypot(a[0] - b[0], a[1] - b[1]) > 50) SYN.push([a, b, hash(i, 5)]); }
  }

  // ---------- верхні екрани: мережа і журнал ----------
  const UW = 320, UH = 168, NODES = [];
  function buildUpper(kind) {
    const r = Raster(UW, UH);
    rr(r, 0, 0, UW, UH, 16, (d, u, v, i, j) => d < 2 ? '#0a1838' : d < 9 ? ramp(CY.slice(0, 5), bump((d - 2) / 7) * (.8 - v * .3), i, j) : d < 15 ? ramp(MB, .45 - v * .3, i, j) : null);
    glass(r, 15, 15, UW - 30, UH - 30, .6);
    r.rect(20, 20, UW - 40, 22, '#0e3488'); r.rect(20, 42, UW - 40, 2, CY[2]);
    if (kind === 'net') {
      for (let k = 0; k < 9; k++) NODES.push([40 + hash(k, 1) * 240, 60 + hash(k, 2) * 84]);
      NODES.forEach((a, k) => { const b = NODES[(k + 3) % 9], c2 = NODES[(k + 1) % 9]; [b, c2].forEach(q => { const n = Math.max(Math.abs(q[0] - a[0]), Math.abs(q[1] - a[1])); for (let s = 0; s < n; s += 2) r.set(a[0] + (q[0] - a[0]) * s / n, a[1] + (q[1] - a[1]) * s / n, CY[1]); }); });
      NODES.forEach(([x, y]) => rr(r, x - 5, y - 5, 10, 10, 5, (d) => d < 1.5 ? CY[4] : CY[1]));
    } else for (let y = 52; y < UH - 20; y += 12) r.rect(24, y, 6, 6, CY[0]);
    return r.canvas();
  }

  // =====================================================================
  // ПІДЛОГА (глянцева, як у кімнаті) — закриває старий стіл із картинки
  // =====================================================================
  function buildFloor() {
    const r = Raster(FLOORR.w / U, FLOORR.h / U), oy = FLOORR.oy;
    VD.box(r, 0, oy, U, { x0: -10, x1: 360, y0: 362, y1: 380, z0: -50, z1: 340 }, { top: (u, v, i, j) => {
      const X = i * U, wx = -10 + u * 370, z = -50 + v * 390;
      if (X > 334 && (i + j) % 2 === 0) return null; if (X > 340) return null;                                    // плавно переходить у підлогу картинки
      const st = hash(i >> 2, 3), seam = (((z % 32) + 32) % 32 < .5) || (((wx % 32) + 32) % 32 < .4);
      let q = .22 + (1 - v) * .2 + (st > .9 ? .25 : st > .8 ? .1 : 0) - (seam ? .1 : 0);
      if (st > .955) return (i >> 2) % 2 ? '#3a1e6e' : '#1c3a7a';                                             // вертикальні відблиски неону в глянці
      return ramp(FL, q, i, j, .12);
    } });
    return r.canvas();
  }

  // =====================================================================
  // РЕЧІ НА СТОЛІ: монітор, бази голо-ноутбуків, горнятко, лампа (у перспективі меблів)
  // =====================================================================
  function buildFront() {
    const r = Raster(FRONTR.w / U, FRONTR.h / U), oy = FRONTR.oy, B = (b, F) => VD.box(r, 0, oy, U, b, F);
    const y0 = TOPY;
    // --- монітор (як на картинці): товстий корпус дивиться на глядача, екран — у кімнату (екран кладеться щокадру)
    B({ x0: 44, x1: 52, y0: MON.y1 - 2, y1: y0, z0: 12, z1: 22 }, { right: (u, v, i, j) => ramp(CH, .8 - Math.abs(u - .4) - v * .25, i, j), front: (u, v, i, j) => ramp(CH, .5 - v * .3, i, j) });
    B({ x0: 36, x1: 58, y0: y0 - 1.2, y1: y0, z0: 4, z1: 30 }, { top: (u, v, i, j) => ramp(CH, .9 - v * .5, i, j), right: () => CH[1], front: () => CH[2] });
    B(MON, {
      front: (u, v, i, j) => { const w = (MON.x1 - MON.x0) * u, h = (MON.y1 - MON.y0) * v, e = Math.min(w, h, MON.x1 - MON.x0 - w, MON.y1 - MON.y0 - h);
        if (e < .5) return C.out; if (e < 1.4) return K[4];                                                  // рожевий кант корпусу (як на картинці)
        if (e < 2.2) return MB[5]; return ramp(['#07041a', '#0d0828', '#160c38', '#201248'], .55 - v * .35 + u * .1, i, j, .15); },
      right: (u, v, i, j) => { const w = (MON.z1 - MON.z0) * u, h = (MON.y1 - MON.y0) * v, e = Math.min(w, h, MON.z1 - MON.z0 - w, MON.y1 - MON.y0 - h);
        if (e < .5) return C.out; if (e < 1.3) return MB[6]; if (e < 3.2) return ramp(MB, .6 - v * .35, i, j); if (e < 3.8) return C.out; return '#020510'; },
    });
    // --- голо-ноутбуки: тонка база з неоновим краєм і світною проекцією клавіатури
    for (const L of [LP2, LP1]) B({ x0: L.x0, x1: L.x1, y0: 297.6, y1: 299, z0: L.z0, z1: L.z1 }, {
      top: (u, v, i, j) => { if (u > .96 || v < .02 || v > .98) return C.out; const kx = (v * 12) % 1, ky = (u * 6) % 1;
        if (u > .35 && u < .9 && v > .08 && v < .92 && (kx < .12 || ky < .14)) return L.neon[1];
        return ramp(CH, .55 + u * .25, i, j); },
      right: (u, v) => v < .45 ? L.neon[0] : CH[1], front: () => CH[2],
    });
    // --- горнятко, лампа
    B(MUG, { top: (u, v) => (u < .18 || u > .82 || v < .18 || v > .82) ? K[6] : '#2a1408', right: (u, v, i, j) => v > .42 && v < .58 ? CY[4] : ramp(K, .8 - u * .5, i, j), front: (u, v, i, j) => ramp(K, .4 - u * .2, i, j) });
    B({ x0: LAMP.x - 6, x1: LAMP.x + 6, y0: 297.6, y1: 299, z0: LAMP.z - 6, z1: LAMP.z + 6 }, { top: (u, v, i, j) => ramp(CH, .9 - v * .5, i, j), right: () => CH[1], front: () => CH[0] });
    const g = (x, y, z) => { const q = VD.p(x, y, z); return [q[0] / U, (q[1] - oy) / U]; };
    for (let k = 0; k < 3; k++) { const a = g(LAMP.x, 297.6, LAMP.z - .5 + k * .5), b = g(LAMP.x + 3, 270, LAMP.z - 6 + k * .5), c2 = g(LAMP.x + 8, 266, LAMP.z - 9 + k * .5); const col = [C.out, CH[4], CH[2]][k]; r.line(a[0], a[1], b[0], b[1], col); r.line(b[0], b[1], c2[0], c2[1], col); }
    B({ x0: LAMP.x + 2, x1: LAMP.x + 16, y0: 262, y1: 268, z0: LAMP.z - 14, z1: LAMP.z - 4 }, { right: (u, v, i, j) => v > .82 ? '#fff2c0' : ramp(K, .85 - v * .5 - u * .2, i, j), front: (u, v, i, j) => ramp(K, .4 - u * .2, i, j), top: (u, v, i, j) => ramp(K, .7 - v * .3, i, j) });
    outline(r, C.out);
    return r.canvas();
  }

  // =====================================================================
  // СТІЛ AI-ЦЕНТРУ — ПЕРШИЙ І НАЙБЛИЖЧИЙ (як на картинці): стоїть фронтально,
  // ближче за стіл аналітики й трохи перекриває його лівий край. Далі по черзі
  // йдуть аналітика й маркетинг. Малюється піксель-артом кодом (NX.furn.Sheet).
  //   стільниця: видимий верх (глянець з відблиском великого екрана), світла
  //              кромка і рожева неонова плита — кольори зняті з картинки
  //              (ліворуч фіолетово-рожева, праворуч — тепліша, від ліхтарика)
  //   корпус:    ліва опора зі світлою смужкою, ніша (там куток кота), тумба з
  //              3 шухлядами, ніша (вазон і ліхтарик), шафка AI-ядра з вентилятором,
  //              ніша (вазон), права опора; справа видно торець — він "тікає" до вікна
  // =====================================================================
  const DK = { l: 34, r: 330, back: 292, front: 298.5, slab: 308, floor: 369, inner: 355, dx: 9.6 };   // dx — товща правого торця (до вікна)
  const SEC = { legL: [46, 60], cab: [156, 204], core: [266, 298], legR: [322, 330] };   // суцільні частини корпусу (решта — ніші)
  const ROWS = [[311, 327.5], [329, 345.5], [347, 363.5]];                                // шухляди тумби
  const FANC = [282, 325, 8.6];                                                           // вентилятор AI-ядра: центр і радіус
  const PROPS = { x: 232, y: 286 };                                                       // дрібнички з картинки (tools/image/07_desk_props.py)
  const SL = ['#3a0e5b', '#4d0d6e', '#5b0775', '#6d058a', '#850498', '#ac14b9', '#b317bd', '#cb53cb', '#e07ae0'];   // плита (з картинки)
  const SW = ['#5a1440', '#8e286a', '#a52174', '#c32988', '#d73f90', '#e45f8c', '#ee7aa4', '#f6a0c0', '#ffc8dc'];   // тепліша права частина
  const NV = ['#02010a', '#05041a', '#080a2a', '#0d143c', '#121d50', '#182866', '#20357c', '#2a4494'];                // темно-синій корпус (з картинки)
  /** Змішати два кольори #rrggbb (k = 0..1). */
  const mix = (a, b, k) => { if (k <= 0) return a; if (k >= 1) return b; const A = [1, 3, 5].map(i => parseInt(a.slice(i, i + 2), 16)), B = [1, 3, 5].map(i => parseInt(b.slice(i, i + 2), 16));
    return '#' + A.map((v, i) => Math.round(v + (B[i] - v) * k).toString(16).padStart(2, '0')).join(''); };
  function buildDeskSheet() {
    const F = NX.furn, S = F.Sheet(DK.l - 2, DK.back - 4, DK.r + 14, DK.floor + 2), o = '#060313';
    const solid = X => Object.values(SEC).some(([a, b]) => X >= a && X < b);
    // глибина стола в кадрі: верх іде на 6.5 вгору, низ — на 14 (низ далі від очей, тому видно більше), праворуч — на dx
    const backY = Y => DK.back + (Y - DK.front) * (DK.inner - DK.back) / (DK.floor - DK.front);   // точка торця на задньому ребрі
    const sideTop = [DK.r + DK.dx, DK.back], sideBot = [DK.r + DK.dx, DK.inner], slabBack = backY(DK.slab);
    // --- корпус і ніші (від низу плити до підлоги)
    S.rect(DK.l, DK.slab, DK.r, DK.floor, (u, v, i, j, X, Y) => {
      if (!solid(X)) {                                                               // ніша: задня стінка, світлодіодна смужка, внутрішня підлога
        if (X < SEC.legL[0]) return null;                                            // під виступом плити — нічого (там вазон у кутку)
        if (Y < DK.slab + 2.2) return NV[0];                                         // тінь під плитою
        if (Y < DK.inner - 1) return ((X - 64) % 12 + 12) % 12 < .8 ? NV[3] : ramp(['#030112', '#05031c', '#080526', '#0b0730'], .15 + (Y - DK.slab) / (DK.inner - DK.slab) * .6, i, j, .1);
        if (Y < DK.inner) return '#123a6a';
        const q = (Y - DK.inner) / (DK.floor - DK.inner);                            // внутрішня підлога: темна, світлішає до краю
        return ramp(['#04021a', '#0a0628', '#120a36', '#1a0f46'], .15 + q * .7, i, j, .15);
      }
      // суцільна частина: шафки й опори
      const [a, b] = Object.values(SEC).find(([p, q]) => X >= p && X < q), du = X - a, dw = b - X;
      if (du < .5 || dw < .5) return o;
      if (Y > DK.floor - 5) return Y > DK.floor - .6 ? o : Y < DK.floor - 4.2 ? CH[2] : (Y > DK.floor - 2.6 && Y < DK.floor - 1.4) ? '#05021a' : NV[1];   // цоколь
      if (a === SEC.cab[0]) {                                                        // тумба з трьома шухлядами (як на картинці)
        const row = ROWS.find(([p, q]) => Y >= p && Y < q);
        if (!row) return Y < ROWS[0][0] ? NV[2] : NV[0];
        const [p, q] = row, dv = Y - p, dh = q - Y, cy = (p + q) / 2;
        if (dv < .5) return NV[7]; if (dh < .5 || dw < 1.4) return NV[0]; if (du < 1.4) return NV[6];
        if (Math.abs(Y - cy) < 1.1 && Math.abs(X - (a + b) / 2) < 9) return Math.abs(Y - cy) < .45 ? '#000006' : NV[1];   // темна прорізна ручка
        if (Math.abs(Y - cy + 1.6) < .4 && Math.abs(X - (a + b) / 2) < 9) return NV[6];
        return ramp(NV, .78 - dv / (q - p) * .35 + (1 - du / (b - a)) * .1, i, j, .12);
      }
      if (a === SEC.core[0]) {                                                       // шафка AI-ядра: вентилятор, решітка, LED-стовпчик
        const fd = Math.hypot(X - FANC[0], Y - FANC[1]);
        if (fd < FANC[2] + .9) return fd > FANC[2] + .1 ? o : fd > FANC[2] - .9 ? CH[3] : '#03020c';
        if (Y > 341 && Y < 359 && X > a + 3 && X < b - 3) return ((Y - 341) % 2.4 < .8) ? '#05021a' : NV[4];
        if (X > b - 6 && X < b - 3 && Y > 311 && Y < 336) return '#020210';
        return ramp(NV, .6 - (Y - DK.slab) / 60 * .3 + (du < 1.5 ? .2 : 0), i, j, .12);
      }
      // опори: темно-синя панель зі світлою вертикальною смужкою (як на картинці)
      if (Math.abs(X - (a + (b - a) * .45)) < .7) return NV[6];
      return ramp(NV, .45 - (Y - DK.slab) / 61 * .25 + (du < 1.2 ? .15 : 0), i, j, .12);
    });
    // --- торець справа: товща стола (плита — рожева, корпус — темно-синій), задній низ стоїть далі (вище)
    S.poly([[DK.r - .3, DK.slab], [sideTop[0], slabBack], sideBot, [DK.r - .3, DK.floor]], (u, v, i, j, X, Y) => {
      const e = (X - DK.r) / DK.dx; if (e < .08) return NV[5];                       // світле ребро
      return Y > DK.floor - 5 - e * 14 ? NV[0] : ramp(NV, .34 - v * .22 - e * .12, i, j, .1);
    });
    S.poly([[DK.r - .3, DK.front], sideTop, [sideTop[0], slabBack], [DK.r - .3, DK.slab]], (u, v, i, j, X, Y) => {
      const e = (X - DK.r) / DK.dx, top = DK.front - (DK.front - DK.back) * e, d = (Y - top) / ((DK.slab - DK.front) * (1 - e * .1));
      if (d < .12) return mix('#ffd4ff', '#f6a0c0', e);                               // кромка
      return ramp(SW, .7 - d * .65 - e * .2, i, j);
    });
    // --- видимий верх стільниці: глянець, під великим екраном — синій відблиск
    S.poly([[DK.l + 3, DK.back], [sideTop[0], sideTop[1]], [DK.r, DK.front], [DK.l, DK.front]], (u, v, i, j, X, Y) => {
      const d = (Y - DK.back) / (DK.front - DK.back), glow = Math.max(0, 1 - Math.abs(X - 150) / 95);
      if (Y < DK.back + .5) return o;
      if (glow > 0) return ramp(['#0a0a30', '#0e1450', '#122070', '#183090', '#2244b0', '#3060cc'], .15 + glow * .6 * (1 - d * .5) + d * .15, i, j, .12);
      return ramp(['#0b0730', '#120a36', '#1c0a3c', '#2b0c40', '#43123f', '#612758'], .1 + d * .75, i, j, .12);
    });
    // --- плита: світла кромка зверху, рожевий перелив униз; праворуч тепліша (світло ліхтарика)
    S.rr(DK.l, DK.front, DK.r, DK.slab, [2.2, 1.6, 1.6, 2.2], (d, u, v, i, j, X, Y) => {
      const k = P.clamp((X - 228) / 70, 0, 1), dy = Y - DK.front;
      if (dy < 1.1) return k > .5 ? '#ffe2ee' : '#ffd4ff';
      if (dy < 1.8) return k > .5 ? SW[7] : SL[8];
      const seam = [200, 262].some(sx => Math.abs(X - sx) < .45);                    // шви між панелями плити (як на картинці)
      if (seam) return SL[2];
      const q = 1 - (dy - 1.8) / (DK.slab - DK.front - 1.8), n = SL.length - 1;
      const idx = P.clamp(Math.round(q * .95 * n + BAYER[(j & 3) * 4 + (i & 3)] * .9), 0, n);
      return mix(SL[idx], SW[idx], k);                                                // плавний перехід до теплішого (без "шуму")
    });
    return S;
  }

  // ---------- полотна живих екранів ----------
  let WALL, BIGS, UPAS, UPBS, FRONT, FLOOR, DESKS, PROPIMG, BIGF, bf, UAF, uaf, UBF, ubf, MONF, mf, L1F, l1, L2F, l2;
  const MW = 256, MH = 288, L1W = 128, L1H = 160, L2W = 112, L2H = 136;
  function init() {
    WALL = buildWall(); BIGS = buildBig(); UPAS = buildUpper('net'); UPBS = buildUpper('log'); FRONT = buildFront(); FLOOR = buildFloor(); DESKS = buildDeskSheet(); DESKS.cv = DESKS.canvas();
    PROPIMG = new Image(); PROPIMG.src = (window.NX_ASSETS && NX_ASSETS['ai_desk_props.png']) || 'assets/ai_desk_props.png';
    [BIGF, bf] = canvas(BW, BH); [UAF, uaf] = canvas(UW, UH); [UBF, ubf] = canvas(UW, UH); [MONF, mf] = canvas(MW, MH); [L1F, l1] = canvas(L1W, L1H); [L2F, l2] = canvas(L2W, L2H);
  }
  /** Растр, зменшений один раз під поточну роздільність екрана (щоб щокадру не стискати 4-кратний растр). */
  const FIT = new Map();
  function fit(cv, w, h, R) {
    if (R * U >= .95) return cv;
    const key = cv, old = FIT.get(key); if (old && old.R === R) return old.cv;
    const [o, x] = canvas(Math.round(w * R), Math.round(h * R)); x.imageSmoothingEnabled = true; x.imageSmoothingQuality = 'high'; x.drawImage(cv, 0, 0, o.width, o.height);
    FIT.set(key, { R, cv: o }); return o;
  }

  NX.addObject({
    id: 'aiPc', name: 'obj.aiPc', act: 'ai',
    hit: { x: 0, y: 0, w: 330, h: 370 }, active: false, prog: 0,
    burst: 0, sweep: null, nextSweep: 4,
    /** Тап по мозку — спалах думки (меню задач однаково відкривається). */
    onTap(x, y) {
      const z = V.zAtX(x, BIG.xw), u = (z - BIG.z0) / (BIG.z1 - BIG.z0), Yw = V.VP[1] + (y - V.VP[1]) / V.s(z), fx = u * BW, fy = (Yw - BIG.y0) / (BIG.y1 - BIG.y0) * BH;
      if (fx > BR.x && fx < BR.x + BR.w && fy > BR.y && fy < BR.y + BR.h) {
        this.burst = 1;
        for (let i = 0; i < 14; i++) NX.fx.emit('spark', x + (Math.random() - .5) * 40, y + (Math.random() - .5) * 30, { col: Math.random() < .5 ? '#7af0ff' : '#ff7af0', vy: -20 - Math.random() * 30, g: 20, ttl: 1, s: 1.2 });
      }
      return false;
    },
    update(dt, t) {
      this.burst = Math.max(0, this.burst - dt * .8);
      if (this.sweep === null && t > this.nextSweep) this.sweep = 0;
      if (this.sweep !== null && (this.sweep += dt / 1.4) >= 1) { this.sweep = null; this.nextSweep = t + 8 + Math.random() * 8; }
    },

    // ===================== ЖИВИЙ ВЕЛИКИЙ ЕКРАН (пласкі координати) =====================
    big(c, t, act) {
      c.globalCompositeOperation = 'source-over'; c.drawImage(BIGS, 0, 0);
      // шапка
      const title = NX.t('nav.ai'), sz = Math.min(36, 400 / title.length), on = .8 + .2 * Math.sin(t * 2);
      P.text(c, title, HD.x + 74, HD.y + 35 + sz / 2, rgba('122,240,255', on), sz);
      lit(c, HD.x + 24, HD.y + 25, 20, 20, rgba('59,232,255', .45 + .5 * Math.abs(Math.sin(t * 1.6)))); lit(c, HD.x + 30, HD.y + 31, 8, 8, '#ffffff');
      const d = new Date(), hm = String(d.getHours()).padStart(2, '0') + (d.getSeconds() % 2 ? ':' : ' ') + String(d.getMinutes()).padStart(2, '0');
      P.text(c, hm, HD.x + HD.w - 12, HD.y + 32, '#3be8ff', 16, 'right');
      lit(c, HD.x + HD.w - 84, HD.y + 44, 10, 10, Math.sin(t * 4) > 0 ? '#3bff8a' : '#1f6a45'); P.text(c, 'LIVE', HD.x + HD.w - 12, HD.y + 56, '#a8c4ff', 12, 'right');
      c.globalCompositeOperation = 'lighter';
      // графік 1: LED-стовпчики
      const k1 = 1 + act * 1.5, base = C1.y + C1.h - 28, top = C1.y + 44;
      for (let i = 0; i < 14; i++) { const v = P.clamp(noise(t * k1, i) * (.8 + .3 * this.burst), .08, 1), segs = Math.round(v * (base - top) / 7);
        for (let s = 0; s < segs; s++) lit(c, C1.x + 11 + i * 9.4, base - 6 - s * 7, 7, 5, s === segs - 1 ? '#ffffff' : CY[2 + Math.min(3, (s / segs * 4) | 0)]); }
      P.text(c, Math.round(60 + 30 * noise(t * k1, 3)) + '%', C1.x + 12, C1.y + 30, '#9af6ff', 14);
      // графік 2: рожева площа, що біжить
      const b2 = C2.y + C2.h - 28, h2 = C2.h - 66;
      for (let x = 0; x < C2.w - 22; x += 2) { const v = P.clamp(.45 + .25 * Math.sin((x + t * 80 * k1) * .045) + .15 * Math.sin((x + t * 50 * k1) * .11) + .1 * this.burst, 0, 1), y = b2 - v * h2;
        c.fillStyle = 'rgba(217,75,255,.2)'; c.fillRect(C2.x + 11 + x, y, 2, b2 - y); lit(c, C2.x + 11 + x, y, 2, 3, '#ff84d4'); }
      P.text(c, '+' + Math.round(12 + 20 * noise(t * .3, 7)) + '%', C2.x + 12, C2.y + 30, '#ff9ae0', 14);
      // мозок: світіння, нейрони, імпульси, орбіта, скан-лінія
      const [cx, cy] = BC; P.glow(c, cx, cy - 6, 150, 'rgba(59,200,255,.75)', .2 + act * .25 + this.burst * .5 + .06 * Math.sin(t * 2));
      const n = 14 + Math.round(act * 26 + this.burst * 40);
      for (let i = 0; i < n; i++) { const q = NEURONS[(hash(i, Math.floor(t * (1.5 + act * 3) + i * .37)) * NEURONS.length) | 0]; if (!q) continue;
        lit(c, q[0] - 2, q[1] - 2, 4, 4, '#ffffff'); c.fillStyle = 'rgba(122,240,255,.55)'; c.fillRect(q[0] - 6, q[1] - .5, 12, 1.5); c.fillRect(q[0] - .5, q[1] - 6, 1.5, 12); }
      SYN.forEach(([a, b, h], i) => { const ph = (t * (.45 + h * .5 + act * .8) + h * 3) % 1.6; if (ph > 1) return;
        for (let k = 0; k < 5; k++) { const q = Math.max(0, ph - k * .03); c.fillStyle = k ? `rgba(154,246,255,${.55 - k * .1})` : (i % 3 ? '#9af6ff' : '#ff9ae0'); const s = k ? 3 : 5; c.fillRect(a[0] + (b[0] - a[0]) * q - s / 2, a[1] + (b[1] - a[1]) * q - s / 2, s, s); } });
      for (let k = 0; k < 3; k++) { const a = t * (.8 + act) + k * 2.094, x = cx + Math.cos(a) * 124, y = cy + 10 + Math.sin(a) * 22; if (Math.sin(a) < 0 && Math.abs(x - cx) < 100) continue; lit(c, x - 4, y - 4, 8, 8, k === 1 ? '#ff7af0' : '#7af0ff'); lit(c, x - 2, y - 2, 4, 4, '#ffffff'); }
      const sy = BR.y + 40 + ((t * .35) % 1) * (BR.h - 80); c.fillStyle = 'rgba(122,240,255,.14)'; c.fillRect(BR.x + 4, sy, BR.w - 8, 3);
      const lvl = this.active ? this.prog : .55 + .35 * noise(t * .4, 2), bx = BR.x + 24, by = BR.y + BR.h - 34, bw = BR.w - 48;
      lit(c, bx, by, bw, 8, '#0a1d40'); lit(c, bx, by, bw * lvl, 8, this.active ? '#3bff8a' : '#3be8ff'); lit(c, bx + bw * lvl - 3, by - 3, 5, 14, '#ffffff');
      P.text(c, 'NEURO ' + Math.round(lvl * 100) + '%', BR.x + 16, BR.y + 30, '#7af0ff', 14);
      // іконки: по черзі підсвічуються (у роботі — чат і лист)
      const hl = act ? Math.floor(t * 3) % 2 : Math.floor(t * .7) % 5;
      for (let k = 0; k < 5; k++) { const y = IC.y + k * 99.5 | 0, onI = k === hl || (act && k < 2 && Math.floor(t * 4 + k) % 2 === 0); if (!onI) continue;
        c.fillStyle = 'rgba(59,232,255,.13)'; c.fillRect(IC.x + 2, y + 2, IC.w - 4, 86); c.strokeStyle = '#3be8ff'; c.lineWidth = 2; c.strokeRect(IC.x + 1, y + 1, IC.w - 2, 88);
        ICONS[k].forEach((row, j) => [...row].forEach((ch, i) => ch === 'X' && lit(c, IC.x + 19 + i * 6, y + 24 + j * 6, 6, 6, k === 3 ? '#ffe27a' : '#9af6ff'))); }
      // еквалайзер
      for (let i = 0; i < 66; i++) { const v = P.clamp(noise(t * (1 + act * 2), i * .35), .1, 1), h = Math.round(v * (EQ.h - 10)); lit(c, EQ.x + 6 + i * 8, EQ.y + EQ.h - 3 - h, 5, h, i % 8 === 0 ? '#ff7af0' : '#2aa6c8'); }
      // рамка: пульс неону, бігуча іскра, відблиск по склу
      c.strokeStyle = rgba('255,120,230', .2 + .14 * Math.sin(t * 1.8) + act * .14 + this.burst * .3); c.lineWidth = 6; c.beginPath(); c.roundRect ? c.roundRect(10, 10, BW - 20, BH - 20, 30) : c.rect(10, 10, BW - 20, BH - 20); c.stroke();
      const per = 2 * (BW + BH - 80), dd = (t * 240) % per, W = BW - 40, H = BH - 40; let sx, sy2;
      if (dd < W) { sx = 20 + dd; sy2 = 10; } else if (dd < W + H) { sx = BW - 10; sy2 = 20 + dd - W; } else if (dd < 2 * W + H) { sx = BW - 20 - (dd - W - H); sy2 = BH - 10; } else { sx = 10; sy2 = BH - 20 - (dd - 2 * W - H); }
      P.glow(c, sx, sy2, 26, 'rgba(255,200,250,.9)', .8); lit(c, sx - 4, sy2 - 4, 8, 8, '#ffffff');
      if (this.sweep !== null) { const p = 32 - 160 + this.sweep * (BW + 320); c.save(); c.beginPath(); c.rect(32, 32, BW - 64, BH - 64); c.clip();
        c.fillStyle = 'rgba(160,230,255,.09)'; c.beginPath(); c.moveTo(p, 32); c.lineTo(p + 80, 32); c.lineTo(p - 60, BH - 32); c.lineTo(p - 140, BH - 32); c.fill();
        c.fillStyle = 'rgba(255,255,255,.13)'; c.beginPath(); c.moveTo(p + 100, 32); c.lineTo(p + 112, 32); c.lineTo(p - 28, BH - 32); c.lineTo(p - 40, BH - 32); c.fill(); c.restore(); }
      c.globalCompositeOperation = 'source-over';
      // ЗАДАЧІ NEXI (дані: NX.nexi.history і NX.nexi.task)
      P.text(c, NX.t('board.title'), TK.x + 14, TK.y + 26, '#3be8ff', 15);
      lit(c, TK.x + TK.w - 26, TK.y + 12, 12, 12, Math.sin(t * 4) > 0 ? '#3bff8a' : '#1f6a45');
      const rows = NX.nexi.history.slice(-3), cur = NX.nexi.task, all = (cur && !cur.auto ? [...rows, { title: cur.title, color: cur.color, prog: cur.prog }] : rows).slice(-3);
      all.forEach((rw, i) => { const ry = TK.y + 52 + i * 48, done = rw.prog === undefined;
        lit(c, TK.x + 14, ry, 24, 24, '#0a2a78'); c.strokeStyle = rw.color || '#3be8ff'; c.lineWidth = 2; c.strokeRect(TK.x + 15, ry + 1, 22, 22);
        if (done) { lit(c, TK.x + 20, ry + 11, 4, 4, '#3bff8a'); lit(c, TK.x + 24, ry + 15, 4, 4, '#3bff8a'); lit(c, TK.x + 28, ry + 5, 4, 10, '#3bff8a'); }
        else lit(c, TK.x + 21, ry + 7, 10, 10, Math.sin(t * 6) > 0 ? (rw.color || '#3be8ff') : '#0a1236');
        P.text(c, rw.title.toUpperCase().slice(0, 30), TK.x + 50, ry + 17, done ? '#a8c4ff' : '#ffffff', 12);
        if (!done) { lit(c, TK.x + 50, ry + 28, TK.w - 70, 6, '#1b2a66'); lit(c, TK.x + 50, ry + 28, (TK.w - 70) * rw.prog, 6, rw.color || '#3be8ff'); } });
      if (!all.length) { const w = NX.t('board.waiting'); P.text(c, w, TK.x + 14, TK.y + 90, '#a8c4ff', 13); if (Math.sin(t * 5) > 0) lit(c, TK.x + 18 + Math.min(370, w.length * 13), TK.y + 77, 10, 14, '#3be8ff'); }
    },
    upper(c, t, kind, act) {
      c.globalCompositeOperation = 'source-over'; c.drawImage(kind === 'net' ? UPAS : UPBS, 0, 0);
      P.text(c, kind === 'net' ? 'NET' : 'LOG', 28, 37, '#3be8ff', 12); lit(c, UW - 40, 26, 10, 10, Math.sin(t * 3 + (kind === 'net' ? 0 : 1)) > 0 ? '#3bff8a' : '#1f6a45');
      c.globalCompositeOperation = 'lighter';
      if (kind === 'net') {
        NODES.forEach((a, k) => { const b = NODES[(k + 3) % 9], q = (t * (.5 + act) + k * .37) % 1; lit(c, a[0] + (b[0] - a[0]) * q - 2.5, a[1] + (b[1] - a[1]) * q - 2.5, 5, 5, k % 2 ? '#ff9ae0' : '#ffffff'); });
        const k = Math.floor(t * 2) % 9; P.glow(c, NODES[k][0], NODES[k][1], 16, 'rgba(59,232,255,.9)', .8);
      } else {
        const off = (t * (14 + act * 30)) % 12;
        c.save(); c.beginPath(); c.rect(20, 48, UW - 40, UH - 66); c.clip();
        for (let r = 0; r < 11; r++) { const y = 52 + r * 12 - off, id = r + Math.floor(t * (14 + act * 30) / 12);
          lit(c, 26, y, 4, 4, ['#3bff8a', '#3be8ff', '#ff7af0'][id % 3]); lit(c, 38, y, 40 + hash(id, 1) * 120, 3, '#2aa6c8'); lit(c, 210, y, 20 + hash(id, 2) * 60, 3, '#17709a'); }
        c.restore();
      }
      c.globalCompositeOperation = 'source-over';
    },
    /** Голо-екран: напівпрозоре блакитне скло з кантом і скан-лініями (основа для монітора й ноутбуків). */
    holo(c, w, h, rgb, a = .5) {
      c.clearRect(0, 0, w, h); c.fillStyle = rgba('22,80,210', a); c.fillRect(0, 0, w, h);
      c.fillStyle = rgba('8,30,110', a * .6); for (let y = 0; y < h; y += 4) c.fillRect(0, y, w, 1);
      c.fillStyle = rgba(rgb, .95); c.fillRect(0, 0, w, 3); c.fillRect(0, h - 3, w, 3); c.fillRect(0, 0, 3, h); c.fillRect(w - 3, 0, 3, h);
      c.fillStyle = '#ffffff'; [[0, 0], [w - 10, 0], [0, h - 3], [w - 10, h - 3]].forEach(([x, y]) => c.fillRect(x, y, 10, 3));
    },
    monitor(c, t) {
      this.holo(c, MW, MH, '90,216,255', .9);
      c.fillStyle = '#2a5cc0'; for (let x = 14; x < MW - 6; x += 30) c.fillRect(x, 48, 1, MH - 60); for (let y = 60; y < MH - 10; y += 30) c.fillRect(8, y, MW - 16, 1);
      lit(c, 8, 8, MW - 16, 30, '#1240a0'); P.text(c, 'KPI', 16, 30, '#9af6ff', 14); P.text(c, '+' + (18 + Math.round(6 * noise(t * .2, 1))) + '%', MW - 16, 30, '#7dff9a', 14, 'right');
      c.globalCompositeOperation = 'lighter';
      const b = MH - 14, h = MH - 74;
      for (let x = 0; x < MW - 20; x += 2) { const v1 = .5 + .3 * Math.sin((x + t * 60) * .04) + .12 * Math.sin((x + t * 100) * .11), v2 = .35 + .2 * Math.sin((x + t * 44) * .03 + 2), y1 = b - v1 * h, y2 = b - v2 * h;
        c.fillStyle = 'rgba(122,240,255,.16)'; c.fillRect(10 + x, y1, 2, b - y1); lit(c, 10 + x, y1, 2, 3, '#e8fdff'); lit(c, 10 + x, y2, 2, 2, '#ff9ae6'); }
      const px = 10 + ((t * 60) % (MW - 20)); c.fillStyle = 'rgba(255,255,255,.35)'; c.fillRect(px, 48, 2, MH - 60);
      c.globalCompositeOperation = 'source-over';
    },
    laptop1(c, t) {
      this.holo(c, L1W, L1H, '90,232,255', .42);
      if (this.active) {
        const lines = Math.min(11, Math.floor(this.prog * 26) + 1);
        for (let i = 0; i < lines; i++) { const w = [96, 70, 88, 50, 80, 62, 92, 40, 74, 58, 86][i]; lit(c, 12, 12 + i * 12, i === lines - 1 ? w * ((t * 3) % 1) : w, 5, i % 2 ? '#ff9ae6' : '#e8fdff'); }
        if (this.prog > .8) { lit(c, L1W - 46, L1H - 26, 36, 16, '#3bff8a'); P.text(c, 'OK', L1W - 28, L1H - 13, '#0a3a1a', 10, 'center'); }
      } else {
        const bx = L1W / 2 + Math.sin(t * .7) * 26, by = L1H / 2 + Math.sin(t * 1.1) * 30, a = .7 + .3 * Math.sin(t * 2);
        ['X...X', 'XX..X', 'X.X.X', 'X..XX', 'X...X'].forEach((row, j) => [...row].forEach((ch, i) => ch === 'X' && lit(c, bx - 15 + i * 6, by - 15 + j * 6, 6, 6, rgba('200,250,255', a))));
      }
    },
    laptop2(c, t) {
      this.holo(c, L2W, L2H, '255,120,230', .38);
      const step = 1.7, n = Math.floor(t / step), f = (t % step) / step;
      for (let k = 0; k < 6; k++) { const id = n - k, me = id % 2 === 0, w = 30 + hash(id, 2) * (L2W - 46), y = L2H - 24 - k * 20 - Math.min(1, f * 4) * 20 + 20, x = me ? L2W - 8 - w : 8;
        if (y < 6) continue;
        if (k === 0 && f < .35 && !me) { for (let d = 0; d < 3; d++) lit(c, x + 4 + d * 8, y + 4, 4, 4, Math.floor(t * 6) % 3 === d ? '#ffffff' : '#8aa0e0'); continue; }
        lit(c, x, y, w, 14, me ? 'rgba(90,216,255,.85)' : 'rgba(255,120,230,.75)'); lit(c, x + 4, y + 3, w * .7, 2, '#ffffff'); lit(c, x + 4, y + 8, w * .45, 2, '#ffffff'); }
    },

    /** Копія картинки кімнати з новим AI-центром: з неї кімната будує передню підлогу (продовження і
     *  глянцеве віддзеркалення) — щоб у глянці не було "привида" старого столу з картинки. */
    patchRoom() {
      const img = NX.room.img, RS = NX.room.RS, [cv, x] = canvas(img.naturalWidth, img.naturalHeight), t = NX.time;
      x.imageSmoothingEnabled = true; x.drawImage(img, 0, 0); x.save(); x.scale(RS, RS);
      x.drawImage(WALL, 0, 0, WALLR.w, WALLR.h); x.drawImage(this.WARP, 0, -12, WALLR.w, 312);
      x.drawImage(FLOOR, 0, FLOORR.oy, FLOORR.w, FLOORR.h); if (NX.wingPlants) NX.wingPlants.drawBehind(x, t);
      // аналітика й маркетинг, потім стіл AI-центру (він найближчий), крісла і вазони крила — нерухомий кадр
      ['analytics', 'marketing'].forEach(id => { const o = NX.objects[id]; if (o && o.drawBack) o.drawBack(x, t); });
      this.drawDesk(x, t);
      [NX.chairA, NX.chairM].forEach(ch => ch && ch.layers(t).forEach(l => l.draw(x, t)));
      Object.values(NX.objects).forEach(o => { if (o.id.startsWith('wp_') && o.draw) o.draw(x, 0); });
      // нижні ряди — підлога з картинки: з них кімната тягне передню підлогу вниз (інакше потягнувся б цоколь стола,
      // а з іншою підлогою був би шов праворуч від стола)
      x.drawImage(img, 0, 362.5 * RS, 344 * RS, 5.5 * RS, 0, 362.5, 344, 5.5);
      x.restore(); this.comp = cv; NX.room.patchFront(cv, 0, 664);
    },
    /** Роздільність кешів (пікселів на одиницю): не більше 1/U, тобто рідної для растрів. */
    res(Kk) { return Math.min(1 / U, Math.ceil(Kk * 2) / 2); },
    drawBack(c, t) {
      if (!WALL) init();
      const act = this.active ? 1 : 0, Kk = NX.cam.k * (NX.loop.dpr || 1), small = Kk * U < .95;
      c.save(); c.imageSmoothingEnabled = small;                 // пікселі дрібніші за екран -> згладжене зменшення без мерехтіння
      // --- стіна
      const R = this.res(Kk); c.drawImage(fit(WALL, WALLR.w, WALLR.h, R), 0, 0, WALLR.w, WALLR.h);
      // --- екрани на стіні: оновлюються кожен 3-й кадр (20 разів/с) у кеш WARP (уже в перспективі), щокадру — лише одна копія
      if (!this.WARP || this.WARP.width !== Math.round(WALLR.w * R)) { [this.WARP, this.wc] = canvas(Math.round(WALLR.w * R), Math.round(312 * R)); this.dirty = 0; }
      if ((this.fr = (this.fr || 0) + 1) % 3 === 0 || this.dirty !== Kk) {
        this.dirty = Kk; const w = this.wc; w.setTransform(1, 0, 0, 1, 0, 0); w.clearRect(0, 0, this.WARP.width, this.WARP.height); w.setTransform(R, 0, 0, R, 0, 12 * R); w.imageSmoothingEnabled = R * U < .95;
        w.globalCompositeOperation = 'lighter';                                                           // неоновий ореол екрана на стіні
        for (const [e, a] of [[5, .07], [11, .035]]) { const q = V.wallQuad(1, BIG.z0 - e, BIG.z1 + e, BIG.y0 - e, BIG.y1 + e); w.fillStyle = rgba('255,79,216', a + .03 * Math.sin(t * 1.8) + act * .03 + this.burst * .05); w.beginPath(); q.forEach(([x, y], i) => i ? w.lineTo(x, y) : w.moveTo(x, y)); w.fill(); }
        w.globalCompositeOperation = 'source-over';
        this.big(bf, t, act); this.upper(uaf, t, 'net', act); this.upper(ubf, t, 'log', act);
        const ws = Math.max(1, 2.4 / R);                                                          // ширина смужки: на дрібних екранах — ширша (оку не видно)
        V.wall(w, UAF, UPA.xw, UPA.z0, UPA.z1, UPA.y0, UPA.y1, ws); V.wall(w, UBF, UPB.xw, UPB.z0, UPB.z1, UPB.y0, UPB.y1, ws);
        V.wall(w, BIGF, BIG.xw, BIG.z0, BIG.z1, BIG.y0, BIG.y1, ws);
      }
      c.drawImage(this.WARP, 0, -12, WALLR.w, 312);
      if (!this.comp && this.fr > 4) this.patchRoom();                                   // після кількох кадрів: усі меблі крила вже готові
      // --- глянцева підлога під виступом стільниці й біля стіни (закриває залишки старого стола картинки);
      //     нижче лінії стола — уже передня підлога кімнати (без шва)
      c.save(); c.beginPath(); c.rect(0, FLOORR.oy, FLOORR.w, DK.floor - FLOORR.oy); c.clip();
      c.drawImage(fit(FLOOR, FLOORR.w, FLOORR.h, R), 0, FLOORR.oy, FLOORR.w, FLOORR.h); c.restore();
      if (NX.wingPlants) NX.wingPlants.drawBehind(c, t);                                    // кущ у кутку й ліани — за столом і монітором (як на картинці)
      // --- тінь контакту стола з підлогою (стіл стоїть ближче — тінь трохи нижче лінії підлоги картинки)
      const g = c.createLinearGradient(0, DK.floor - 1, 0, DK.floor + 5); g.addColorStop(0, 'rgba(4,2,14,.6)'); g.addColorStop(1, 'rgba(4,2,14,0)');
      c.fillStyle = g; c.fillRect(DK.l + 8, DK.floor - 1, DK.r - DK.l, 6);
      // --- теплі ліхтарі на стіні: мерехтять
      LANT.forEach((L, n) => { const [lx, ly] = V.p(L.w, (L.y0 + L.y1) / 2, (L.z0 + L.z1) / 2); P.glow(c, lx, ly, n ? 16 : 30, 'rgba(255,180,80,.9)', .3 + .08 * Math.sin(t * 6.3 + n * 2) + .05 * Math.sin(t * 13.7 + n)); });
      c.restore();
    },
    /** Стіл — окремий шар: він найближчий, тому малюється ПІСЛЯ столу аналітики (перекриває його лівий край),
     *  а Nexi на стільниці (y більший) — уже поверх стола. */
    layers(t) { return [{ y: DK.back - 3, draw: c => this.drawDesk(c, t) }]; },
    drawDesk(c, t) {
      if (!WALL) return;
      const act = this.active ? 1 : 0, Kk = NX.cam.k * (NX.loop.dpr || 1), R = this.res(Kk);
      c.save(); c.imageSmoothingEnabled = Kk * U < .95;
      // --- сам стіл
      const dw = DESKS.x1 - DESKS.x0, dh = DESKS.y1 - DESKS.y0; c.drawImage(fit(DESKS.cv, dw, dh, R), DESKS.x0, DESKS.y0, dw, dh);
      // --- дрібнички з картинки (ноутбук, рамка, колонка, фігурка) стоять на новій стільниці
      if (PROPIMG.complete && PROPIMG.naturalWidth) { c.imageSmoothingEnabled = Kk < 2; c.drawImage(PROPIMG, PROPS.x, PROPS.y, PROPIMG.naturalWidth / 2, PROPIMG.naturalHeight / 2); }
      // --- речі на столі: монітор, бази голо-ноутбуків, горнятко, лампа
      c.imageSmoothingEnabled = Kk * U < .95;
      c.drawImage(fit(FRONT, FRONTR.w, FRONTR.h, R), 0, FRONTR.oy, FRONTR.w, FRONTR.h);
      // --- екрани на столі (у перспективі): натягуються раз на 3 кадри у два кеші (монітор — звичайно, ноутбуки — світлом)
      const DX = [40, 200, 212, 300];
      if (!this.DM || this.DM.width !== Math.round((DX[2] - DX[0]) * R)) { [this.DM, this.dm] = canvas(Math.round((DX[2] - DX[0]) * R), Math.round((DX[3] - DX[1]) * R)); [this.DL, this.dl] = canvas(this.DM.width, this.DM.height); this.dfr = -1; }
      if (this.fr % 3 === 2 || this.dfr !== R) {
        this.dfr = R; this.monitor(mf, t); this.laptop1(l1, t); this.laptop2(l2, t);
        for (const [x, cv] of [[this.dm, this.DM], [this.dl, this.DL]]) { x.setTransform(1, 0, 0, 1, 0, 0); x.clearRect(0, 0, cv.width, cv.height); x.setTransform(R, 0, 0, R, -DX[0] * R, -DX[1] * R); x.imageSmoothingEnabled = R * U * 1.2 < .95; }
        const st = Math.max(1, 1.5 / R);
        VD.wall(this.dm, MONF, MON.x1, MON.z0 + 4, MON.z1 - 4, MON.y0 + 4, MON.y1 - 4, st);
        const d = this.dl; d.globalCompositeOperation = 'lighter';
        for (const [L, F2] of [[LP2, L2F], [LP1, L1F]]) {
          const S = L.scr; d.globalAlpha = .9; VD.wall(d, F2, S.xw, S.z0, S.z1, S.y0, S.y1, Math.max(.75, st));
          const a = VD.p(S.xw, 297.6, S.z0), b = VD.p(S.xw, 297.6, S.z1), a2 = VD.p(S.xw, S.y1, S.z0), b2 = VD.p(S.xw, S.y1, S.z1);   // промінь проектора від бази до екрана
          d.globalAlpha = .18 + .06 * Math.sin(t * 3); d.fillStyle = L.neon[0]; d.beginPath(); d.moveTo(a[0], a[1]); d.lineTo(b[0], b[1]); d.lineTo(b2[0], b2[1]); d.lineTo(a2[0], a2[1]); d.fill();
        }
        d.globalAlpha = 1; d.globalCompositeOperation = 'source-over';
      }
      c.imageSmoothingEnabled = true;
      c.drawImage(this.DM, DX[0], DX[1], DX[2] - DX[0], DX[3] - DX[1]);
      c.save(); c.globalCompositeOperation = 'lighter'; c.drawImage(this.DL, DX[0], DX[1], DX[2] - DX[0], DX[3] - DX[1]); c.restore();
      c.imageSmoothingEnabled = false;
      // --- ноутбук з картинки в кінці столу: лишається оригінальним, але його екран оживає (стовпчики й стрілка вгору)
      if (!this.OLD) [this.OLD, this.oldc] = canvas(54, 54);
      if (this.fr % 3 === 1) { const o = this.oldc; o.clearRect(0, 0, 54, 54);
        for (let i = 0; i < 4; i++) { const h = 10 + 26 * noise(t * (1 + act * 2), i + 20); o.fillStyle = i % 2 ? 'rgba(122,240,255,.9)' : 'rgba(90,200,255,.8)'; o.fillRect(6 + i * 12, 50 - h, 8, h); }
        const ay = 20 - ((t * 18) % 14); o.fillStyle = 'rgba(200,250,255,.95)'; o.beginPath(); o.moveTo(27, ay); o.lineTo(37, ay + 10); o.lineTo(17, ay + 10); o.fill(); o.fillRect(23, ay + 10, 8, 8); }
      c.save(); c.globalCompositeOperation = 'lighter'; c.globalAlpha = .55; c.imageSmoothingEnabled = true;
      c.transform(27 / 54, 0, -6.5 / 54, 27 / 54, 250.5, 262.5); c.drawImage(this.OLD, 0, 0); c.restore();
      // --- живі вогники столу
      c.globalCompositeOperation = 'lighter';
      c.fillStyle = rgba('255,79,216', .28 + .16 * Math.sin(t * 2.2) + act * .18); c.fillRect(DK.l + 1, DK.front + .3, DK.r - DK.l - 2, 1.4);   // неон краю плити
      const sp = DK.l + ((t * .22) % 1) * (DK.r - DK.l); lit(c, sp - 7, DK.front + .4, 14, 1, 'rgba(255,255,255,.85)');              // бігуча іскра
      for (const [a, b] of [SEC.legL, SEC.cab, SEC.core, SEC.legR]) for (let x = a + 1.5; x < b - 1.5; x += 2) {                       // LED у цоколі (у роботі — веселка)
        const hue = (t * 120 + x * 4) % 360; c.fillStyle = act ? `hsla(${hue},95%,62%,.85)` : rgba('59,232,255', .4 + .3 * Math.sin(t * 2 + x * .12)); c.fillRect(x, DK.floor - 2.6, 1.3, 1.2); }
      for (let x = 64; x < 154; x += 2) if (x < 96 || x > 112) lit(c, x, 351, 1.3, .9, rgba('59,232,255', .18 + .14 * Math.sin(t * 1.6 + x * .08)));   // смужка в глибині ніші
      for (let x = 206; x < 264; x += 2) lit(c, x, 351, 1.3, .9, rgba('255,79,216', .16 + .12 * Math.sin(t * 1.6 + x * .08)));
      ROWS.forEach(([p, q], k) => lit(c, SEC.cab[1] - 6, (p + q) / 2 - 3, 2.4, 1, rgba('59,232,255', .45 + .5 * Math.sin(t * 2 + k * 1.7))));   // вогники шухляд
      for (let k = 0; k < 8; k++) lit(c, SEC.core[1] - 5.4, 312.5 + k * 3, 1.8, 1.6, hash(k, Math.floor(t * (4 + act * 8))) > .4 ? ['#3bff8a', '#3be8ff', '#ff7af0'][k % 3] : '#0a1a20');   // LED AI-ядра
      P.glow(c, FANC[0], FANC[1], 14, 'rgba(59,232,255,.7)', .22 + act * .3);
      const fa = t * (4 + act * 14); for (let bl = 0; bl < 5; bl++) { const a = fa + bl * Math.PI * .4; for (let r2 = 1.4; r2 < FANC[2] - 1; r2 += .5) lit(c, FANC[0] + Math.cos(a + r2 * .12) * r2 - .35, FANC[1] + Math.sin(a + r2 * .12) * r2 - .35, .7, .7, '#5ad8ff'); }
      lit(c, FANC[0] - 1, FANC[1] - 1, 2, 2, '#c3cbea');
      // лампа: тепле світло на стільницю; пара над кавою
      const [lx, ly] = VD.p(LAMP.x + 9, 268, LAMP.z - 9);
      c.fillStyle = 'rgba(255,226,140,.09)'; c.beginPath(); c.moveTo(lx - 2, ly); c.lineTo(lx + 2, ly); c.lineTo(lx + 16, DK.front); c.lineTo(lx - 14, DK.front); c.fill();
      P.glow(c, lx, ly, 10, 'rgba(255,220,140,.9)', .5 + .05 * Math.sin(t * 7));
      const [mx, my] = VD.p((MUG.x0 + MUG.x1) / 2, MUG.y0, (MUG.z0 + MUG.z1) / 2);
      for (let i = 0; i < 5; i++) { const q = (t * .5 + i / 5) % 1; c.fillStyle = `rgba(220,230,255,${.35 * (1 - q)})`; c.fillRect(mx - .5 + Math.sin(q * 6 + i) * 1.5, my - 1 - q * 14, 1, 1); }
      // потік даних: ноутбук -> мозок, коли Nexi працює
      if (act) { const S = LP1.scr, [ax, ay] = VD.p(S.xw, S.y0, (S.z0 + S.z1) / 2), zb = BIG.z0 + BC[0] / BW * (BIG.z1 - BIG.z0), [bx, by] = V.p(BIG.xw, BIG.y0 + BC[1] / BH * (BIG.y1 - BIG.y0), zb), mx2 = (ax + bx) / 2 + 14, my2 = Math.min(ay, by) - 20;
        for (let i = 0; i < 12; i++) { const q = (t * .8 + i / 12) % 1, u = 1 - q, x = u * u * ax + 2 * u * q * mx2 + q * q * bx, y = u * u * ay + 2 * u * q * my2 + q * q * by;
          lit(c, x - .6, y - .6, 1.2, 1.2, i % 3 ? '#7af0ff' : '#ff7af0'); c.fillStyle = 'rgba(122,240,255,.22)'; c.fillRect(x - 1.5, y - 1.5, 3, 3); } }
      c.globalCompositeOperation = 'source-over';
      // світло від екранів
      const [mcx, mcy] = VD.p(MON.x1, (MON.y0 + MON.y1) / 2, (MON.z0 + MON.z1) / 2); P.glow(c, mcx + 6, mcy, 40, 'rgba(59,160,255,.5)', .14 + .04 * Math.sin(t * 1.4));
      const [lcx, lcy] = VD.p(LP1.scr.xw, 284, 138); P.glow(c, lcx + 4, lcy, 22, 'rgba(59,232,255,.6)', .16 + act * .25);
      c.restore();
    },
  });
})();

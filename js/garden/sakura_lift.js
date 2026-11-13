/* ============================================================================
 * garden/sakura_lift.js — ЖИВИЙ ОСТРІВЕЦЬ ІЗ САКУРОЮ: ЛІФТ ДО БОТАНІЧНОГО САДУ
 * ----------------------------------------------------------------------------
 * Власник (13.11, скрін зі стрілкою вниз від кіл килима): «змісти ці кола трохи нижче і зроби живий острівець по розмірах
 * синього кола; куди стає Nexi, по центру цього острівка — квітуча маленька сакура-бонсай, яка переносить нас до
 * ботанічного саду: вона як ліфт спускається вниз, і ми переходимо на нову область… головне, щоб сакура не виходила на
 * диван, а Nexi бачив це як об'єкт і не ходив поверх нього, а міг тільки на живий куток застрибувати й переміщатися до
 * ботанічного саду».
 *
 * Що тут:
 *   • острівець — диск-платформа розміром із внутрішнє синє коло килима (objects/rug_dock.js: center, rx, ry): метал із
 *     блакитною LED-канавкою, зверху мох, трава, квіти, камінці, світні гриби, пелюстки. Растр збирається раз (і при зміні
 *     розміру екрана — висота еліпса залежить від нього); сітка — як у дивану: 1 піксель = 0.5·k одиниці кімнати;
 *   • сакура-бонсай по центру: стовбур із корінням на моховому горбку (один растр) і хмари цвіту (другий — ледь
 *     гойдається); щокадру лише живе — пелюстки, що падають, іскорки в кроні, сяйво, LED диска;
 *   • (13.11, «зроби цей острів ще краще») ставок із двома коропами й лотосом, кам'яний ліхтар із теплим світлом, бамбук,
 *     метелик довкола крони, світлячки; острівець пружинить, коли Nexi на нього приземляється;
 *   • (13.11, «може її трохи більшою… реалізовуй») острівець на 30% ширший і глибший, сакура на 20% більша; тап по ставку —
 *     коропи врозтіч і кола на воді, по ліхтарю — спалах, по острівцю чи сакурі — крона здригається, пелюстки, і Nexi їде;
 *     у поїздці довкола острівця вихор пелюсток, шахта світиться зеленню саду;
 *   • foot — слід на підлозі: Nexi, Рудик і м'ячик обходять острівець (world/room.js: route), тап по підлозі на ньому —
 *     Nexi стає поруч, а не зверху;
 *   • ЛІФТ: тап по острівцю чи сакурі (або слово в діалозі — i18n kw.sakura) → сценарій `sakura`: Nexi з будь-якого
 *     місця стрибає на камінь праворуч від сакури високою дугою із сальто (jump; здалеку — спершу розгін у бік острівця), острівець із ним і деревом опускається в шахту (стіни з неоновими кільцями;
 *     усе, що нижче переднього краю шахти, закриває підлога — шар-заслона перемальовує її шматок). Унизу:
 *       – є ботанічний сад (чат «Ботанічний сад»: NX.garden.enter) — викликаємо NX.garden.enter(lift); далі веде він, назад —
 *         lift.back() (острівець піднімається, Nexi зістрибує);
 *       – саду ще немає — острівець за секунду піднімається, Nexi зістрибує й каже, що сад ще росте (act.sakura.soon).
 *     Нова команда посеред поїздки — острівець сам повертається нагору.
 * Сценарій реєструється тут (NX.acts.sakura — у update, бо activities.js вантажиться пізніше й створює NX.acts), тож
 * спільний файл сценаріїв не чіпаємо. Тексти — js/i18n/*.js: obj.sakura, act.sakura, kw.sakura (4 мови).
 * Файл зроблено в чаті «Робочі зони» за прямим словом власника («тут ми зараз робимо цей центр кола»); далі — чат
 * «Ботанічний сад» (js/garden/*).
 * ========================================================================== */
(() => {
  const P = NX.px, { Raster, outline, hash, BAYER } = NX.art;
  // ---------- палітри (кольори кімнати: рослини саду за диваном, хром дивану, неон) ----------
  const MOSS = ['#0a241e', '#103426', '#17482e', '#216036', '#2f7c40', '#45a04e', '#6ac864'];
  const MET = ['#1c2250', '#3a4070', '#5a6590', '#9aa3c8'], SOIL = ['#1a0e24', '#2a1836'], LED = '#1f8aa0';
  const STONE = ['#2e2a52', '#514b82', '#7d77ae', '#a8a2d2'];
  const BARK = ['#24101c', '#44222f', '#6a3a48', '#925868'];
  const BLS = ['#74205c', '#a83484', '#dc56a4', '#ff84c2', '#ffaed8', '#ffd4ec', '#fff2f9'];
  const WAT = ['#052436', '#0a3f54', '#116278', '#249aac', '#7fe3ec'];
  const OUT = '#12082a';
  const A = 172, S = A / 132, TH = 8;                                // півширина диска (px; 13.11 — на 30% більший), масштаб розкладки речей на ньому, товщина борту (px)
  const TS = 1.2, TW = 112, THT = 88, TB = [56, 84], DB = [46, 68];  // сакура на 20% більша: растр, точка основи в ньому; DB — основа в «кресленні» (координати нижче — від неї)
  const clampI = (v, n) => Math.max(0, Math.min(n - 1, Math.round(v)));

  /** Диск-острівець: верх (еліпс A×B) і борт товщиною TH. Повертає полотно й точку центру верху в ньому. */
  function buildDisc(B) {
    const top = 16, W = 2 * A + 4, H = top + 2 * B + TH + 3, r = Raster(W, H), X0 = A + 2, Y0 = top + B;
    const moss = (x, y) => { const u = (x + .5 - X0) / A, v = (y + .5 - Y0) / B; return Math.sqrt(u * u + v * v) < .88; };
    for (let y = 0; y < H; y++) for (let x = 0; x < W; x++) {
      const u = (x + .5 - X0) / A, v = (y + .5 - Y0) / B, rr = u * u + v * v;
      if (rr <= 1) {                                                                  // верх: кант -> ґрунт -> мох
        const q = Math.sqrt(rr);
        if (q > .955) r.set(x, y, v < -.25 ? MET[3] : v > .4 ? MET[1] : MET[2]);
        else if (q > .9) r.set(x, y, SOIL[hash(x, y) < .5 ? 0 : 1]);
        else { const n = Math.sin(x * .09 + 1.3) * Math.cos(y * .4 + x * .03);
          r.set(x, y, MOSS[clampI((.3 + .3 * (1 - q) + .12 * n - v * .1 + BAYER[(y & 3) * 4 + (x & 3)] * .17 + (hash(x, y) - .5) * .13) * (MOSS.length - 1), MOSS.length)]); }
      } else if (y > Y0) {                                                            // борт: світлий кант, LED-канавка, темні панелі зі швами
        const vb = (y + .5 - Y0 - TH) / B; if (u * u + vb * vb > 1) continue;
        const s = y + .5 - (Y0 + B * Math.sqrt(Math.max(0, 1 - u * u)));
        r.set(x, y, s < 1.2 ? MET[3] : s < 2.4 ? MET[1] : s < 4.6 ? LED : s < 5.6 ? MET[0] : (x - X0 + 1200) % 24 === 0 ? '#070920' : Math.abs(u) > .8 ? '#0b0f2c' : '#141a44');
      }
    }
    // ставок (ліворуч-спереду): вода темніша вглиб, берег із камінців; латаття з лотосом. Коропи й відблиски — щокадру
    const pond = { dx: Math.round(-64 * S), y: Math.round(.26 * B), rx: Math.round(32 * S), ry: Math.max(4, B * .4) }, inPond = (x, y, m = 1.25) => { const ex = (x + .5 - X0 - pond.dx) / pond.rx, ey = (y + .5 - Y0 - pond.y) / pond.ry; return ex * ex + ey * ey < m; };
    for (let y = Math.floor(Y0 + pond.y - pond.ry - 2); y <= Y0 + pond.y + pond.ry + 2; y++) for (let x = X0 + pond.dx - pond.rx - 3; x <= X0 + pond.dx + pond.rx + 3; x++) {
      const ex = (x + .5 - X0 - pond.dx) / pond.rx, ey = (y + .5 - Y0 - pond.y) / pond.ry, e = ex * ex + ey * ey + (hash(x, y + 40) - .5) * .14; if (e > 1.14 || !moss(x, y)) continue;
      r.set(x, y, e > .9 ? (hash(x + 7, y) < .4 ? STONE[1 + (hash(x, y + 3) * 2 | 0)] : SOIL[1]) : WAT[clampI(1.3 + ey * 1.5 + BAYER[(y & 3) * 4 + (x & 3)] * 1.1 + (ey < -.55 ? -1 : 0), WAT.length)]); }
    [[-78, -.2, 1], [-52, .35, 0], [-66, .5, 0], [-58, -.45, 1]].forEach(([dx, f, lotus]) => { const x = Math.round(X0 + dx * S), y = Math.round(Y0 + pond.y + f * pond.ry); r.rect(x - 2, y, 5, 2, MOSS[5]); r.rect(x - 1, y - 1, 3, 1, MOSS[6]); r.set(x + 2, y, WAT[1]);
      if (lotus) { r.rect(x - 1, y - 2, 3, 2, BLS[4]); r.set(x, y - 3, BLS[5]); r.set(x, y - 1, '#ffe27a'); } });
    // камені: плита, на яку стає Nexi (праворуч від сакури), і два менші
    const slab = (dx, fy, rx, ry) => { rx *= S; const cx = X0 + dx * S, cy = Y0 + fy * B; for (let y = Math.floor(cy - ry); y <= cy + ry; y++) for (let x = Math.floor(cx - rx); x <= cx + rx; x++) {
      const ex = (x + .5 - cx) / rx, ey = (y + .5 - cy) / ry, e = ex * ex + ey * ey; if (e > 1 || !moss(x, y)) continue;
      r.set(x, y, STONE[ey < -.45 ? 3 : e > .72 && ey > 0 ? 0 : ey < .05 ? 2 : 1]); } };
    slab(80, .08, 21, Math.max(3, B * .36)); slab(47, .52, 9, Math.max(2, B * .2)); slab(108, -.2, 8, Math.max(2, B * .18));
    [[-18, .78], [-8, -.7], [40, .74], [-110, -.3], [56, -.62]].forEach(([dx, fy]) => { const x = Math.round(X0 + dx * S), y = Math.round(Y0 + fy * B); r.rect(x, y, 3, 2, STONE[1]); r.set(x, y, STONE[3]); r.set(x + 1, y, STONE[2]); });
    // трава: пучки на моху й уздовж заднього краю
    for (let i = 0; i < 44; i++) { const a = hash(i, 5) * 6.283, q = .28 + hash(i, 6) * .58, x = Math.round(X0 + Math.cos(a) * q * A), y = Math.round(Y0 + Math.sin(a) * q * B);
      if (!moss(x, y) || inPond(x, y) || (x - X0 > 56 * S && x - X0 < 104 * S && Math.abs(y - Y0) < B * .5)) continue;
      const hgt = 2 + (hash(i, 7) * 3 | 0); for (let j = 0; j < hgt; j++) r.set(x, y - j, MOSS[j > 1 ? 6 : 5]); r.set(x + 1, y, MOSS[5]); r.set(x + 1, y - 1, MOSS[4]); r.set(x - 1, y, MOSS[3]); }
    for (let dx = -A + 10; dx < A - 10; dx += 5) { if (hash(dx, 9) < .35) continue; const u = dx / A, y = Math.round(Y0 - B * Math.sqrt(1 - u * u) * .93), hgt = 2 + (hash(dx, 3) * 4 | 0);
      for (let j = 0; j < hgt; j++) r.set(X0 + dx + (j > 2 ? 1 : 0), y - j, MOSS[j > 2 ? 6 : 4 + (j & 1)]); r.set(X0 + dx + 2, y, MOSS[4]); r.set(X0 + dx + 2, y - 1, MOSS[5]); }
    // квіти (хрестик із серединкою) й опалі пелюстки
    for (let i = 0; i < 38; i++) { const a = hash(i, 1) * 6.283, q = .16 + hash(i, 2) * .68, x = Math.round(X0 + Math.cos(a) * q * A), y = Math.round(Y0 + Math.sin(a) * q * B);
      if (!moss(x, y) || inPond(x, y) || Math.abs(x - X0) < 26 * TS || (x - X0 > 54 * S && x - X0 < 106 * S)) continue;
      const col = ['#fff2f9', '#ff9ad8', '#ffe27a', '#8af0ff'][i % 4]; r.set(x - 1, y, col); r.set(x + 1, y, col); r.set(x, y - 1, col); r.set(x, y + 1, col); r.set(x, y, i % 4 === 2 ? '#ff9a3a' : '#ffe27a'); }
    for (let i = 0; i < 16; i++) { const a = hash(i, 11) * 6.283, q = hash(i, 12) * .8, x = Math.round(X0 + Math.cos(a) * q * A * .6), y = Math.round(Y0 + Math.sin(a) * q * B); if (moss(x, y)) { r.set(x, y, BLS[4]); r.set(x + 1, y, BLS[3]); } }
    [[-70, .1], [-44, .2], [-84, .36]].forEach(([dx, fy]) => r.rect(Math.round(X0 + dx * S), Math.round(Y0 + fy * B), 2, 1, BLS[5]));   // пелюстки на воді
    // бамбук (позаду плити): три стебла з вузлами й листям
    [[76, -.5, 16], [83, -.62, 21], [91, -.46, 13]].forEach(([dx, fy, hg], i) => { const x = Math.round(X0 + dx * S), y = Math.round(Y0 + fy * B);
      for (let j = 0; j < hg; j++) { r.set(x, y - j, j % 5 === 4 ? MOSS[2] : MOSS[5]); r.set(x + 1, y - j, j % 5 === 4 ? MOSS[1] : MOSS[3]); }
      [[-1, -1], [-2, -2], [-3, -2], [2, -1], [3, -2], [4, -2], [0, -1]].forEach(([ax, ay]) => r.set(x + ax, y - hg + 2 + ay + (i & 1), MOSS[6])); [[-2, 4], [-3, 5], [3, 6], [4, 7]].forEach(([ax, ay]) => r.set(x + ax, y - hg + ay, MOSS[5])); });
    // кам'яний ліхтар (ліворуч, за ставком): основа, ніжка, вогнище з віконцем, дашок; тепле світло — щокадру
    const lx = Math.round(X0 - 92 * S), ly = Math.round(Y0 - .42 * B);
    r.rect(lx - 3, ly - 1, 7, 2, STONE[1]); r.rect(lx - 1, ly - 6, 3, 5, STONE[2]); r.rect(lx - 1, ly - 6, 1, 5, STONE[3]); r.rect(lx - 3, ly - 7, 7, 1, STONE[1]); r.rect(lx - 3, ly - 12, 7, 5, STONE[2]); r.rect(lx - 3, ly - 12, 1, 5, STONE[3]);
    r.rect(lx - 1, ly - 11, 3, 3, '#ffd27a'); r.set(lx, ly - 10, '#fff6c8'); r.rect(lx - 5, ly - 14, 11, 2, STONE[1]); r.rect(lx - 4, ly - 15, 9, 1, STONE[3]); r.rect(lx - 1, ly - 17, 3, 2, STONE[2]);
    // світні гриби: ніжка й блакитна шапка; сяйво — щокадру
    const mush = [[-112, -.02], [-104, .26], [26, .7]].map(([dx, fy]) => { dx = Math.round(dx * S); const x = X0 + dx, y = Math.round(Y0 + fy * B);
      r.set(x, y, '#c3cbea'); r.set(x, y - 1, '#c3cbea'); r.set(x, y - 2, '#e9eefc'); r.rect(x - 2, y - 4, 5, 2, '#3be8ff'); r.rect(x - 1, y - 5, 3, 1, '#8af0ff'); r.set(x - 1, y - 4, '#d8fbff'); return [dx, y - 4 - Y0]; });
    outline(r, OUT);
    return { cv: r.canvas(), X0, Y0, mush, pond, lamp: [lx - X0, ly - 10 - Y0] };
  }

  /** Сакура-бонсай: стовбур і гілки з корінням на моховому горбку; окремо — хмари цвіту. Основа — TB. */
  function buildTree() {
    const tr = Raster(TW, THT), bl = Raster(TW, THT), [bx, by] = DB, mx = x => TB[0] + (x - bx) * TS, my = y => TB[1] + (y - by) * TS;   // «креслення» -> растр
    for (let y = TB[1] - 7; y <= TB[1] + 3; y++) for (let x = TB[0] - 24; x <= TB[0] + 24; x++) {                   // моховий горбок
      const ex = (x + .5 - TB[0]) / 24, ey = (y + .5 - TB[1] + 1.4) / 5.4; if (ex * ex + ey * ey > 1) continue;
      tr.set(x, y, MOSS[clampI(3.4 - ey * 1.6 - Math.abs(ex) * 1.2 + BAYER[(y & 3) * 4 + (x & 3)] * 1.2, MOSS.length)]); }
    const limb = pts => { for (let s = 0; s < pts.length - 1; s++) { const [x0, y0, w0] = [mx(pts[s][0]), my(pts[s][1]), pts[s][2] * TS], [x1, y1, w1] = [mx(pts[s + 1][0]), my(pts[s + 1][1]), pts[s + 1][2] * TS], n = Math.ceil(Math.hypot(x1 - x0, y1 - y0) * 2);
      for (let i = 0; i <= n; i++) { const q = i / n, x = x0 + (x1 - x0) * q, y = y0 + (y1 - y0) * q, w = w0 + (w1 - w0) * q;
        for (let d = -w; d <= w; d += .5) tr.set(x + d, y, BARK[d < -w * .35 ? 3 : d > w * .45 ? 0 : hash(Math.round(x + d), Math.round(y)) < .25 ? 1 : 2]); } } };
    limb([[bx - 3, by - 2, 1], [bx - 12, by + 1, .5]]); limb([[bx + 3, by - 2, 1], [bx + 12, by + 1, .5]]); limb([[bx, by - 1, 1], [bx + 5, by + 2, .5]]);   // коріння
    limb([[bx, by - 1, 4.5], [bx - 5, by - 11, 3.6], [bx - 9, by - 20, 3], [bx - 4, by - 28, 2.6], [bx + 1, by - 35, 2], [bx - 1, by - 44, 1.4]]);               // стовбур (S)
    limb([[bx - 8, by - 19, 1.6], [bx - 18, by - 23, 1.2], [bx - 28, by - 26, .7]]); limb([[bx - 1, by - 31, 1.5], [bx + 10, by - 34, 1.1], [bx + 21, by - 38, .7]]);
    limb([[bx - 1, by - 42, 1.1], [bx - 11, by - 47, .7]]); limb([[bx, by - 39, 1], [bx + 11, by - 46, .6]]);
    outline(tr, OUT);
    const blob = (cx, cy, rx, ry, seed) => { cx = mx(cx); cy = my(cy); rx *= TS; ry *= TS; for (let y = Math.floor(cy - ry - 1); y <= cy + ry + 1; y++) for (let x = Math.floor(cx - rx - 1); x <= cx + rx + 1; x++) {
      const ex = (x + .5 - cx) / rx, ey = (y + .5 - cy) / ry; if (ex * ex + ey * ey + (hash(x + seed, y) - .5) * .5 > 1) continue;
      const h = hash(x * 3 + seed, y * 7); bl.set(x, y, h > .94 ? BLS[6] : h < .05 && ey > 0 ? BLS[0] : BLS[clampI(3.5 - ey * 2.7 - ex * .9 + BAYER[(y & 3) * 4 + (x & 3)] * 1.5 + (h - .5), BLS.length)]); } };
    [[bx - 29, by - 29, 12, 7, 1], [bx - 15, by - 47, 14, 8.5, 2], [bx + 1, by - 54, 15, 8.5, 3], [bx + 16, by - 46, 13, 7.5, 4], [bx + 25, by - 37, 10, 6, 5], [bx + 9, by - 32, 6, 3.5, 6], [bx - 34, by - 22, 5, 3, 7], [bx - 6, by - 36, 6, 3.5, 8]].forEach(b => blob(...b));
    outline(bl, OUT);
    return { trunk: tr.canvas(), bloom: bl.canvas() };
  }

  let DISC = null, TREE = null, discB = 0;
  const lift = NX.addObject({
    id: 'sakura', name: 'obj.sakura', act: 'sakura',
    cx: 768, cy: 470, k: 1, U: .5, RX: 66, RY: 12, h: 4, D: 80,      // центр і радіуси (кімната), k — перспектива, U — од. на піксель, h — висота борту, D — глибина спуску
    drop: 0,                                                         // 0 — нагорі, 1 — унизу
    koiT: -9, koiPh: 0, rips: [], lampT: -9, shakeT: -9,             // реакції на тап: коропи, кола на воді, ліхтар, крона
    bob: 0, bobV: 0, aboard: false, jumpA: null,                     // пружина острівця (просідає, коли Nexi приземлився); Nexi на борту; крок стрибка, що триває
    layout() {
      const R = NX.objects.rug, [x, y] = R.center, k = P.depthK(y);
      this.cx = x; this.cy = y; this.k = k; this.U = .5 * k; this.RX = A / 2 * k; this.RY = R.ry * k * .58; this.h = TH * this.U;
      this.D = Math.round(FOOT * SPRITE_K * NX.room.scaleAt(y) + this.RY + this.h + 5);                 // Nexi ховається в шахті з антеною (нижче переднього краю)
      this.span = [x - this.RX - 30 * k, x + this.RX + 30 * k];
      this.foot = [x - this.RX, x + this.RX, y - this.RY - this.h, y + this.RY];
      this.hit = { x: x - this.RX, y: y - this.RY - this.h, w: this.RX * 2, h: this.RY * 2 + this.h };
      const B = Math.max(8, Math.round(this.RY / this.U)); if (B !== discB) { discB = B; DISC = buildDisc(B); }
      if (!TREE) TREE = buildTree();
    },
    /** Де Nexi стоїть на острівці (камінь праворуч від сакури). */
    stand() { return [this.cx + 40 * S * this.k, this.cy - this.h]; },
    /** Куди зістрибує: док праворуч, дзеркально ліворуч або перед острівцем — щоразу інакше. */
    exitPoint() { const [hx, hy] = NX.objects.rug.home, r = Math.random(); return NX.room.clampWalk(...(r < .4 ? [hx, hy] : r < .7 ? [2 * this.cx - hx, hy] : [this.cx + 30 * this.k, this.cy + this.RY + 18 * this.k])); },
    /** СТРИБОК ІЗ САЛЬТО (власник, 13.11: «щоб міг з будь-якого місця прикольно стрибати на острівець, а не підбігати справа»):
     *  присід, висока дуга з того місця, де Nexi стоїть, до точки to (масив або функція) — одне чи два сальто довкола середини тіла
     *  (n.roll) або «дзиґа» (pose spin), слід із пелюсток. o.dy — глибина в кінці (на острівці), o.land — що зробити при приземленні. */
    jump(to, o = {}) {
      const n = NX.nexi, k = this.k; let fr, H, flips, spin, sgn, kicked;
      const w = { pose: 'crouch', dur: 1,
        start: () => { if (typeof to === 'function') to = to(); fr = [n.x, n.y]; const L = Math.hypot(to[0] - fr[0], to[1] - fr[1]); kicked = false;
          w.dur = .16 + Math.max(.6, Math.min(1.05, .45 + L / 380)); H = Math.max(46, Math.min(104, 40 + L * .28)) * k; sgn = to[0] >= fr[0] ? 1 : -1;
          spin = Math.random() < .25; flips = L > 120 * k && Math.random() < .45 ? 2 : 1; this.jumpA = step; this.aboard = false; o.start && o.start(); },
        tick: (dt, q) => { const q0 = .16 / w.dur; if (q < q0) { n.pose = 'crouch'; return; }
          if (!kicked) { kicked = true; NX.nexiPhys.kick(3); for (let i = 0; i < 6; i++) NX.fx.emit('dust', n.x, n.y); NX.fx.emit('ring', n.x, n.y, { col: BLS[4], r0: 3, gr: 40, ttl: .35 }); }
          const e = (q - q0) / (1 - q0), g = P.lerp(fr[1], to[1], e), es = e * e * (3 - 2 * e);
          n.x = P.lerp(fr[0], to[0], e); n.gy = g; n.dy = o.dy != null ? P.lerp(fr[1], o.dy, e) : g; n.y = g - Math.sin(e * Math.PI) * H; n.air = true;
          if (spin) { n.pose = 'spin'; n.dir = Math.floor(NX.time * 14) % 2 ? 1 : -1; n.roll = 0; } else { n.pose = 'jump'; n.dir = sgn; n.roll = sgn * 6.2832 * flips * es; }
          if (Math.random() < .7) NX.fx.emit('spark', n.x + (Math.random() - .5) * 10, n.y - 22 * k, { col: Math.random() < .5 ? BLS[4] : BLS[5], vx: -sgn * 20, vy: 12, g: 50, ttl: .7, s: 1.5 }); },
        end: () => { n.x = to[0]; n.y = n.gy = to[1]; n.dy = o.dy != null ? o.dy : null; n.air = false; n.roll = 0; n.dir = sgn; this.jumpA = null; o.land && o.land(); } };
      const step = { work: w }; return step;
    },
    /** План заходу: далеко — розгін у бік острівця й відштовхування за ~130 од. до нього; близько — стрибок просто з місця. */
    plan() { const n = NX.nexi, st = this.stand(), dx = n.x - st[0], dy = n.y - st[1], L = Math.hypot(dx, dy) || 1, R = (118 + Math.random() * 30) * this.k, steps = [];
      if (L > R * 1.25) steps.push({ walk: NX.room.clampWalk(st[0] + dx / L * R, st[1] + dy / L * R), dash: true });
      steps.push(this.jump(st, { dy: st[1], land: () => this.land() })); n.queue.unshift(...steps); },
    /** Тап по сакурі (вона вища за слід острівця) — те саме, що по острівцю. */
    tapFirst(x, y) {
      if (this.drop || !DISC) return false;
      const { cx, cy, U } = this, t = NX.time, pd = DISC.pond, ex = (x - cx - pd.dx * U) / (pd.rx * U), ey = (y - cy - (pd.y - TH) * U) / (pd.ry * U), r = Math.random;
      if (ex * ex + ey * ey < 1) {                                                    // ставок: коропи кидаються врозтіч, по воді кола, бризки
        this.koiT = t; this.rips.push({ t0: t, ox: ex * pd.rx * .5, oy: ey * pd.ry * .5 }, { t0: t + .18, ox: ex * pd.rx * .5, oy: ey * pd.ry * .5 }); if (this.rips.length > 6) this.rips.splice(0, 2);
        for (let i = 0; i < 7; i++) NX.fx.emit('spark', x + (r() - .5) * 8, y, { col: WAT[4], vx: (r() - .5) * 40, vy: -30 - r() * 30, g: 120, ttl: .5, s: 1.2 }); return true; }
      const lx = cx + DISC.lamp[0] * U, ly = cy + (DISC.lamp[1] - TH) * U;
      if (Math.abs(x - lx) < 8 * U && y > ly - 9 * U && y < ly + 12 * U) {            // ліхтар: спалахує яскравіше, іскри
        this.lampT = t; for (let i = 0; i < 8; i++) NX.fx.emit('spark', lx + (r() - .5) * 6, ly, { col: r() < .5 ? '#ffd27a' : '#fff6c8', vx: (r() - .5) * 46, vy: -20 - r() * 40, g: 50, ttl: .8, s: 1.2 }); return true; }
      const w = 37 * U * TS, top = cy - this.h - 64 * U * TS; if (Math.abs(x - cx) > w || y < top || y > cy - this.RY) return false; return this.onTap();   // сакура вища за слід острівця
    },
    /** Тап по острівцю чи сакурі: крона здригається, сиплються пелюстки — і Nexi стрибає на ліфт. */
    onTap() { this.shakeT = NX.time; this.petals(22); if (NX.nexi.loc !== 'lift') NX.nexi.do('sakura'); return true; },
    petals(n = 14) { const r = Math.random; for (let i = 0; i < n; i++) NX.fx.emit('spark', this.cx + (r() - .5) * 60 * this.k, this.cy - this.h - r() * 30 * this.k + this.drop * this.D, { col: r() < .5 ? BLS[4] : BLS[5], vx: (r() - .5) * 50, vy: -20 - r() * 30, g: 60, ttl: 1.1, s: 1.5 }); },
    land() { const n = NX.nexi; NX.nexiPhys.land(3.4); this.petals(16); this.shakeT = NX.time; this.bobV = 30 * this.k; this.aboard = true; n.loc = 'lift'; NX.fx.emit('ring', n.x, n.y, { col: BLS[4], r0: 4, gr: 60, ttl: .45 }); },
    /** Крок поїздки: q 0..1, dir +1 — вниз, −1 — вгору. Nexi їде разом з острівцем. */
    ride(q, dir) { const e = q < .5 ? 2 * q * q : 1 - 2 * (1 - q) * (1 - q), n = NX.nexi; this.drop = dir > 0 ? e : 1 - e; n.y = n.gy = this.stand()[1] + this.drop * this.D + this.bob; },
    /** Унизу: є сад — далі веде він (NX.garden.enter(lift)); ні — сценарій сам піднімає острівець. */
    arrive() { this.petals(18); if (NX.garden && NX.garden.enter) { NX.nexi.queue = []; NX.garden.enter(this); } },
    /** Кроки повернення нагору (сценарій і NX.garden — lift.back()). */
    upSteps() { const n = NX.nexi; return [{ work: { pose: 'stand', dur: 2.2, tick: (dt, q) => this.ride(q, -1) } }, this.jump(() => this.exitPoint()), { loc: 'floor' }, { face: 1 }, { do: () => n.emote('happy', 2.5) }]; },
    back() { const n = NX.nexi; n.loc = 'lift'; n.x = this.stand()[0]; n.dy = this.stand()[1]; this.aboard = true; this.ride(0, -1); n.alpha = 1; n.zoom = 1; n.queue = this.upSteps(); n.cur = null; },
    update(dt) {
      if (NX.acts && !NX.acts.sakura) NX.acts.sakura = { color: '#ff86c4', route: () => {
        return [{ do: () => this.plan() }, { loc: 'lift' }, { face: 1 }, { say: NX.pick('act.sakura.lines') },
          { work: { pose: 'wave', dur: 2.6, tick: (d, q) => this.ride(q, 1) } }, { do: () => this.arrive() }, { wait: 1 },
          ...this.upSteps(), { say: NX.pick('act.sakura.soon') }]; } };
      const n = NX.nexi, sc = Math.max(0, 1 - (NX.time - this.koiT) / 1.3); this.koiPh += dt * (1 + 7 * sc * sc);
      if (this.rips.length && NX.time - this.rips[this.rips.length - 1].t0 > 1.3) this.rips.length = 0;
      if (this.drop > 0 && n.loc !== 'lift') this.drop = Math.max(0, this.drop - dt / 1.2);            // поїздку перервали — острівець сам нагору
      if (this.jumpA && n.cur !== this.jumpA) { this.jumpA = null; n.roll = 0; n.air = false; if (n.y < n.gy) n.y = n.gy; }   // стрибок перервали — на підлогу, без нахилу
      if (this.bob || this.bobV) { this.bobV += (-190 * this.bob - 13 * this.bobV) * dt; this.bob += this.bobV * dt; if (Math.abs(this.bob) < .03 && Math.abs(this.bobV) < .6) this.bob = this.bobV = 0; }
      if (this.aboard && n.loc !== 'lift') this.aboard = false;
      if (this.aboard && !this.jumpA) n.y = n.gy = this.stand()[1] + this.drop * this.D + this.bob;      // Nexi стоїть на острівці й рухається разом із ним
    },
    /** Позаду всіх: шахта (коли острівець їде) і сам диск. */
    drawBack(c, t) {
      if (!DISC) return;
      const { cx, cy, RX, RY, U, k } = this, dd = this.drop * this.D, d = dd + this.bob, Kk = NX.cam.k * (NX.loop.dpr || 1), X = Math.round(cx * Kk) / Kk, Y = Math.round((cy + d) * Kk) / Kk;
      if (dd > 0) {                                                                    // шахта: темне дно, задня стіна з неоновими кільцями
        c.save(); c.beginPath(); c.ellipse(cx, cy, RX, RY, 0, 0, 7); c.clip();
        const g = c.createLinearGradient(0, cy - RY, 0, cy + RY); g.addColorStop(0, '#1a1146'); g.addColorStop(1, this.drop > .5 ? '#0b3a26' : '#04030c'); c.fillStyle = g; c.fillRect(cx - RX, cy - RY, RX * 2, RY * 2);
        c.lineWidth = 1.2 * k; for (let z = 5 * k, i = 0; z < dd; z += 9 * k, i++) { c.strokeStyle = i % 2 ? `rgba(255,79,216,${.5 + .25 * Math.sin(t * 4 + i)})` : `rgba(59,232,255,${.55 + .25 * Math.sin(t * 4 + i)})`; c.beginPath(); c.ellipse(cx, cy + z, RX - 1, RY, 0, Math.PI, 2 * Math.PI); c.stroke(); }
        c.restore();
        P.glow(c, cx, cy + RY * .3, RX * .8, 'rgba(90,255,150,.75)', this.drop * (.34 + .08 * Math.sin(t * 3)));   // зелене сяйво саду з глибини
      }
      c.save(); c.imageSmoothingEnabled = false; c.translate(X, Y); c.scale(U, U);
      c.drawImage(DISC.cv, -DISC.X0, -(DISC.Y0 + TH));
      const pd = DISC.pond;                                                           // живе у ставку: два коропи кружляють, відблиски на воді
      for (let i = 0; i < 2; i++) { const a = this.koiPh * (i ? -.7 : .55) + i * 2.4, fx = Math.round(pd.dx + Math.cos(a) * pd.rx * .55), fy = Math.round(pd.y - TH + Math.sin(a) * pd.ry * .42), hd = (i ? 1 : -1) * Math.sin(a) > 0 ? 1 : -1;
        c.fillStyle = i ? '#fff2f9' : '#ff9a3a'; c.fillRect(fx - 1, fy, 3, 1); c.fillStyle = i ? '#ff5a4a' : '#ffe27a'; c.fillRect(fx + hd, fy, 1, 1); c.fillStyle = i ? '#ffd4ec' : '#ffc27a'; c.fillRect(fx - hd * 2, fy + (Math.floor(t * 6 + i) % 2 ? -1 : 0), 1, 1); }
      for (const rp of this.rips) { const q = (t - rp.t0) / 1.1; if (q < 0 || q > 1) continue; c.strokeStyle = `rgba(160,240,248,${(1 - q) * .9})`; c.lineWidth = 1; c.beginPath(); c.ellipse(pd.dx + rp.ox * (1 - q), pd.y - TH + rp.oy * (1 - q), pd.rx * (.12 + .78 * q), pd.ry * (.12 + .78 * q), 0, 0, 7); c.stroke(); }
      for (let i = 0; i < 3; i++) { const sI = Math.floor(t * .9 + i * .41); if ((t * .9 + i * .41) % 1 < .3) { c.fillStyle = WAT[4]; c.fillRect(Math.round(pd.dx + (hash(i, sI) - .5) * pd.rx * 1.3), Math.round(pd.y - TH + (hash(i + 5, sI) - .3) * pd.ry * .9), 2, 1); } }
      c.globalCompositeOperation = 'lighter';                                         // живе: LED у канавці борту з бігучим вогником, сяйво грибів
      c.strokeStyle = `rgba(59,232,255,${.45 + .25 * Math.sin(t * 2.4)})`; c.lineWidth = 2; c.beginPath(); c.ellipse(0, -TH + 3.4, A - 1, discB, 0, .12, Math.PI - .12); c.stroke();
      const a = .12 + ((t * .16) % 1) * (Math.PI - .24); c.strokeStyle = 'rgba(255,255,255,.85)'; c.beginPath(); c.ellipse(0, -TH + 3.4, A - 1, discB, 0, a, a + .1); c.stroke();
      c.restore();
      DISC.mush.forEach(([mx, my], i) => P.glow(c, cx + mx * U, cy + d + (my - TH) * U, 7 * k, 'rgba(59,232,255,.7)', .35 + .15 * Math.sin(t * 2 + i * 2)));
      const fl = Math.max(0, 1 - (t - this.lampT) / 1.6); P.glow(c, cx + DISC.lamp[0] * U, cy + d + (DISC.lamp[1] - TH) * U, (11 + 14 * fl) * k, 'rgba(255,196,110,.85)', .42 + .5 * fl + .1 * Math.sin(t * 7) * Math.sin(t * 2.3));   // ліхтар мерехтить
    },
    /** Сакура — шар із глибиною (хто позаду острівця — за нею); заслона — підлога перед шахтою поверх того, що опустилось. */
    layers(t) {
      if (!TREE) return [];
      const L = [{ y: this.cy, draw: c => this.drawTree(c, t) }];
      if (this.drop > 0) L.push({ y: this.cy + .5, draw: c => this.drawCover(c, t) });
      return L;
    },
    drawTree(c, t) {
      const { cx, cy, U, k } = this, d = this.drop * this.D + this.bob, Kk = NX.cam.k * (NX.loop.dpr || 1), X = Math.round(cx * Kk) / Kk, Y = Math.round((cy - this.h + 1 + d) * Kk) / Kk;
      P.glow(c, cx, Y - 40 * U * TS, 34 * k * TS, 'rgba(255,120,200,.6)', .2 + .06 * Math.sin(t * 1.6));
      const sh = Math.max(0, 1 - (t - this.shakeT) / .9), vort = Math.sin(Math.min(1, this.drop) * Math.PI);
      c.save(); c.imageSmoothingEnabled = false; c.translate(X, Y); c.scale(U, U); c.translate(-TB[0], -TB[1]);
      c.drawImage(TREE.trunk, 0, 0); c.drawImage(TREE.bloom, Math.round(Math.sin(t * 1.1) * .8 + Math.sin(t * 34) * 2.4 * sh), 0);       // крона ледь гойдається (і здригається від тапу чи приземлення)
      c.translate(TB[0], TB[1]); c.scale(TS, TS); c.translate(-DB[0], -DB[1]);                               // живе — у координатах «креслення»
      for (let i = 0; i < 4; i++) { const q = (t * .7 + i * .37) % 1; if (q < .25) { c.fillStyle = '#ffffff'; c.fillRect(18 + hash(i, Math.floor(t * .7 + i * .37)) * 56 | 0, 10 + hash(i + 9, Math.floor(t * .7 + i * .37)) * 26 | 0, 1, 1); } }   // іскорки
      for (let i = 0; i < 7; i++) {                                                   // пелюстки падають і лягають на мох
        const T = 3.2 + hash(i, 21) * 2.4, q = (t / T + hash(i, 22)) % 1, x = 14 + hash(i, 23) * 64 + Math.sin(q * 6 + i) * 5 + q * 6, y = 22 + q * q * 48;
        c.globalAlpha = q > .85 ? (1 - q) / .15 : 1; c.fillStyle = i % 2 ? BLS[4] : BLS[5]; c.fillRect(Math.round(x), Math.round(y), 2, 1); c.fillStyle = BLS[3]; c.fillRect(Math.round(x) + (Math.sin(q * 20 + i) > 0 ? 1 : 0), Math.round(y) + 1, 1, 1);
      }
      c.globalAlpha = 1;                                                              // метелик кружляє довкола крони
      const bxx = Math.round(46 + Math.cos(t * .6) * 34), byy = Math.round(26 + Math.sin(t * 1.2) * 9 + Math.sin(t * 5) * 1.5), op = Math.floor(t * 9) % 2;
      c.fillStyle = '#8af0ff'; c.fillRect(bxx - (op ? 2 : 1), byy - 1, op ? 2 : 1, 2); c.fillRect(bxx + 1, byy - 1, op ? 2 : 1, 2); c.fillStyle = '#d8fbff'; c.fillRect(bxx - (op ? 2 : 1), byy - 1, 1, 1); c.fillStyle = OUT; c.fillRect(bxx, byy - 1, 1, 2);
      c.restore();
      if (vort > .02) { c.save(); c.globalAlpha = Math.min(1, vort * 1.6);             // ліфт їде: вихор пелюсток довкола острівця
        for (let i = 0; i < 26; i++) { const a = t * (4 + (i % 3)) + i * 1.7, rr = .45 + .5 * ((i * .381) % 1), hh = ((i * .137 + t * .45) % 1) * 62 * k, px = cx + Math.cos(a) * this.RX * rr * .8, py = cy - this.h + d + Math.sin(a) * this.RY * rr - hh;
          c.fillStyle = i % 3 ? BLS[4] : BLS[5]; c.fillRect(px, py, 1.3 * k, .7 * k); c.fillStyle = BLS[3]; c.fillRect(px + (Math.sin(a * 3) > 0 ? .6 * k : 0), py + .7 * k, .7 * k, .7 * k); }
        c.restore(); }
      for (let i = 0; i < 5; i++) {                                                   // світлячки над островом
        const fx = cx + (Math.sin(t * .4 + i * 2.1) * 74 + Math.sin(t * 1.3 + i) * 6) * U, fy = Y - (30 + Math.cos(t * .33 + i * 1.7) * 18 + Math.sin(t * .9 + i * 3) * 4) * U, a = .5 + .5 * Math.sin(t * 3 + i * 4);
        P.glow(c, fx, fy, 4 * k, 'rgba(232,255,138,.9)', .5 * a); c.fillStyle = `rgba(240,255,170,${.4 + .6 * a})`; c.fillRect(fx - .35 * k, fy - .35 * k, .7 * k, .7 * k);
      }
    },
    /** Підлога перед шахтою (усе нижче її переднього краю): шматок передньої підлоги, віддзеркалення дивану й кола килима —
     *  ще раз, поверх острівця, сакури й Nexi, що опустились. Малий clip, лише під час поїздки. */
    drawCover(c, t) {
      const { cx, cy, RX, RY, k } = this, C = NX.cfg, F = NX.room.front, FR = NX.room.FR;
      const x0 = Math.floor(cx - RX - 34 * k), x1 = Math.ceil(cx + RX + 34 * k), y0 = Math.floor(cy), y1 = Math.min(C.ROOM_H + F.height / FR - 2, Math.ceil(cy + this.D + RY + 16 * k));
      c.save(); c.beginPath(); c.moveTo(x0, cy); c.lineTo(cx - RX, cy); c.ellipse(cx, cy, RX, RY, 0, Math.PI, 0, true); c.lineTo(x1, cy); c.lineTo(x1, y1); c.lineTo(x0, y1); c.closePath(); c.clip();
      c.imageSmoothingEnabled = false; c.drawImage(F, (x0 - C.ROOM_X0) * FR, (y0 - C.ROOM_H) * FR, (x1 - x0) * FR, (y1 - y0) * FR, x0, y0, x1 - x0, y1 - y0);
      const S = NX.objects.sofa, R = NX.objects.rug; if (S && S.drawBack) S.drawBack(c, t); if (R && R.drawBack) R.drawBack(c, t);
      c.restore();
      c.save(); c.strokeStyle = 'rgba(59,232,255,.5)'; c.lineWidth = 1; c.beginPath(); c.ellipse(cx, cy, RX, RY, 0, .05, Math.PI - .05); c.stroke(); c.restore();   // неоновий край шахти
    },
  });
})();

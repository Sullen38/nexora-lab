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
 *   • foot — слід на підлозі: Nexi, Рудик і м'ячик обходять острівець (world/room.js: route), тап по підлозі на ньому —
 *     Nexi стає поруч, а не зверху;
 *   • ЛІФТ: тап по острівцю чи сакурі (або слово в діалозі — i18n kw.sakura) → сценарій `sakura`: Nexi підходить до доку,
 *     застрибує на камінь праворуч від сакури, острівець із ним і деревом опускається в шахту (стіни з неоновими кільцями;
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
  const OUT = '#12082a';
  const A = 132, TH = 8, TW = 92, TB = [46, 68];                     // півширина диска (px), товщина борту (px); растр дерева й точка його основи
  const clampI = (v, n) => Math.max(0, Math.min(n - 1, Math.round(v)));

  /** Диск-острівець: верх (еліпс A×B) і борт товщиною TH. Повертає полотно й точку центру верху в ньому. */
  function buildDisc(B) {
    const top = 8, W = 2 * A + 4, H = top + 2 * B + TH + 3, r = Raster(W, H), X0 = A + 2, Y0 = top + B;
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
    // камені: плита, на яку стає Nexi (праворуч від сакури), і два менші
    const slab = (dx, fy, rx, ry) => { const cx = X0 + dx, cy = Y0 + fy * B; for (let y = Math.floor(cy - ry); y <= cy + ry; y++) for (let x = Math.floor(cx - rx); x <= cx + rx; x++) {
      const ex = (x + .5 - cx) / rx, ey = (y + .5 - cy) / ry, e = ex * ex + ey * ey; if (e > 1 || !moss(x, y)) continue;
      r.set(x, y, STONE[ey < -.45 ? 3 : e > .72 && ey > 0 ? 0 : ey < .05 ? 2 : 1]); } };
    slab(80, .08, 21, Math.max(3, B * .36)); slab(47, .52, 9, Math.max(2, B * .2)); slab(108, -.2, 8, Math.max(2, B * .18));
    [[-40, .58], [-22, -.62], [20, .66], [-100, -.18], [62, -.6]].forEach(([dx, fy]) => { const x = X0 + dx, y = Math.round(Y0 + fy * B); r.rect(x, y, 3, 2, STONE[1]); r.set(x, y, STONE[3]); r.set(x + 1, y, STONE[2]); });
    // трава: пучки на моху й уздовж заднього краю
    for (let i = 0; i < 30; i++) { const a = hash(i, 5) * 6.283, q = .28 + hash(i, 6) * .58, x = Math.round(X0 + Math.cos(a) * q * A), y = Math.round(Y0 + Math.sin(a) * q * B);
      if (!moss(x, y) || (x - X0 > 56 && x - X0 < 104 && Math.abs(y - Y0) < B * .5)) continue;
      const hgt = 2 + (hash(i, 7) * 3 | 0); for (let j = 0; j < hgt; j++) r.set(x, y - j, MOSS[j > 1 ? 6 : 5]); r.set(x + 1, y, MOSS[5]); r.set(x + 1, y - 1, MOSS[4]); r.set(x - 1, y, MOSS[3]); }
    for (let dx = -A + 10; dx < A - 10; dx += 5) { if (hash(dx, 9) < .35) continue; const u = dx / A, y = Math.round(Y0 - B * Math.sqrt(1 - u * u) * .93), hgt = 2 + (hash(dx, 3) * 4 | 0);
      for (let j = 0; j < hgt; j++) r.set(X0 + dx + (j > 2 ? 1 : 0), y - j, MOSS[j > 2 ? 6 : 4 + (j & 1)]); r.set(X0 + dx + 2, y, MOSS[4]); r.set(X0 + dx + 2, y - 1, MOSS[5]); }
    // квіти (хрестик із серединкою) й опалі пелюстки
    for (let i = 0; i < 26; i++) { const a = hash(i, 1) * 6.283, q = .16 + hash(i, 2) * .68, x = Math.round(X0 + Math.cos(a) * q * A), y = Math.round(Y0 + Math.sin(a) * q * B);
      if (!moss(x, y) || Math.abs(x - X0) < 26 || (x - X0 > 54 && x - X0 < 106)) continue;
      const col = ['#fff2f9', '#ff9ad8', '#ffe27a', '#8af0ff'][i % 4]; r.set(x - 1, y, col); r.set(x + 1, y, col); r.set(x, y - 1, col); r.set(x, y + 1, col); r.set(x, y, i % 4 === 2 ? '#ff9a3a' : '#ffe27a'); }
    for (let i = 0; i < 16; i++) { const a = hash(i, 11) * 6.283, q = hash(i, 12) * .8, x = Math.round(X0 + Math.cos(a) * q * A * .6), y = Math.round(Y0 + Math.sin(a) * q * B); if (moss(x, y)) { r.set(x, y, BLS[4]); r.set(x + 1, y, BLS[3]); } }
    // світні гриби (ліворуч): ніжка й блакитна шапка; сяйво — щокадру
    const mush = [[-76, -.1], [-64, .34], [-90, .26]].map(([dx, fy]) => { const x = X0 + dx, y = Math.round(Y0 + fy * B);
      r.set(x, y, '#c3cbea'); r.set(x, y - 1, '#c3cbea'); r.set(x, y - 2, '#e9eefc'); r.rect(x - 2, y - 4, 5, 2, '#3be8ff'); r.rect(x - 1, y - 5, 3, 1, '#8af0ff'); r.set(x - 1, y - 4, '#d8fbff'); return [dx, y - 4 - Y0]; });
    outline(r, OUT);
    return { cv: r.canvas(), X0, Y0, mush };
  }

  /** Сакура-бонсай: стовбур і гілки з корінням на моховому горбку; окремо — хмари цвіту. Основа — TB. */
  function buildTree() {
    const tr = Raster(TW, 72), bl = Raster(TW, 72), [bx, by] = TB;
    for (let y = by - 5; y <= by + 3; y++) for (let x = bx - 20; x <= bx + 20; x++) {                   // моховий горбок
      const ex = (x + .5 - bx) / 20, ey = (y + .5 - by + 1) / 4.5; if (ex * ex + ey * ey > 1) continue;
      tr.set(x, y, MOSS[clampI(3.4 - ey * 1.6 - Math.abs(ex) * 1.2 + BAYER[(y & 3) * 4 + (x & 3)] * 1.2, MOSS.length)]); }
    const limb = pts => { for (let s = 0; s < pts.length - 1; s++) { const [x0, y0, w0] = pts[s], [x1, y1, w1] = pts[s + 1], n = Math.ceil(Math.hypot(x1 - x0, y1 - y0) * 2);
      for (let i = 0; i <= n; i++) { const q = i / n, x = x0 + (x1 - x0) * q, y = y0 + (y1 - y0) * q, w = w0 + (w1 - w0) * q;
        for (let d = -w; d <= w; d += .5) tr.set(x + d, y, BARK[d < -w * .35 ? 3 : d > w * .45 ? 0 : hash(Math.round(x + d), Math.round(y)) < .25 ? 1 : 2]); } } };
    limb([[bx - 3, by - 2, 1], [bx - 12, by + 1, .5]]); limb([[bx + 3, by - 2, 1], [bx + 12, by + 1, .5]]); limb([[bx, by - 1, 1], [bx + 5, by + 2, .5]]);   // коріння
    limb([[bx, by - 1, 4.5], [bx - 5, by - 11, 3.6], [bx - 9, by - 20, 3], [bx - 4, by - 28, 2.6], [bx + 1, by - 35, 2], [bx - 1, by - 44, 1.4]]);               // стовбур (S)
    limb([[bx - 8, by - 19, 1.6], [bx - 18, by - 23, 1.2], [bx - 28, by - 26, .7]]); limb([[bx - 1, by - 31, 1.5], [bx + 10, by - 34, 1.1], [bx + 21, by - 38, .7]]);
    limb([[bx - 1, by - 42, 1.1], [bx - 11, by - 47, .7]]); limb([[bx, by - 39, 1], [bx + 11, by - 46, .6]]);
    outline(tr, OUT);
    const blob = (cx, cy, rx, ry, seed) => { for (let y = Math.floor(cy - ry - 1); y <= cy + ry + 1; y++) for (let x = Math.floor(cx - rx - 1); x <= cx + rx + 1; x++) {
      const ex = (x + .5 - cx) / rx, ey = (y + .5 - cy) / ry; if (ex * ex + ey * ey + (hash(x + seed, y) - .5) * .5 > 1) continue;
      const h = hash(x * 3 + seed, y * 7); bl.set(x, y, h > .94 ? BLS[6] : h < .05 && ey > 0 ? BLS[0] : BLS[clampI(3.7 - ey * 2 - ex * .8 + BAYER[(y & 3) * 4 + (x & 3)] * 1.5 + (h - .5), BLS.length)]); } };
    [[bx - 29, by - 29, 12, 7, 1], [bx - 15, by - 47, 14, 8.5, 2], [bx + 1, by - 54, 15, 8.5, 3], [bx + 16, by - 46, 13, 7.5, 4], [bx + 25, by - 37, 10, 6, 5], [bx + 9, by - 32, 6, 3.5, 6], [bx - 34, by - 22, 5, 3, 7], [bx - 6, by - 36, 6, 3.5, 8]].forEach(b => blob(...b));
    outline(bl, OUT);
    return { trunk: tr.canvas(), bloom: bl.canvas() };
  }

  let DISC = null, TREE = null, discB = 0;
  const lift = NX.addObject({
    id: 'sakura', name: 'obj.sakura', act: 'sakura',
    cx: 768, cy: 470, k: 1, U: .5, RX: 66, RY: 12, h: 4, D: 80,      // центр і радіуси (кімната), k — перспектива, U — од. на піксель, h — висота борту, D — глибина спуску
    drop: 0,                                                         // 0 — нагорі, 1 — унизу
    layout() {
      const R = NX.objects.rug, [x, y] = R.center, k = P.depthK(y);
      this.cx = x; this.cy = y; this.k = k; this.U = .5 * k; this.RX = (R.rx - 84) * k; this.RY = R.ry * k * (1 - 3 / 5.5); this.h = TH * this.U;
      this.D = Math.round(FOOT * SPRITE_K * NX.room.scaleAt(y) + this.RY + this.h + 5);                 // Nexi ховається в шахті з антеною (нижче переднього краю)
      this.span = [x - this.RX - 30 * k, x + this.RX + 30 * k];
      this.foot = [x - this.RX, x + this.RX, y - this.RY - this.h, y + this.RY];
      this.hit = { x: x - this.RX, y: y - this.RY - this.h, w: this.RX * 2, h: this.RY * 2 + this.h };
      const B = Math.max(8, Math.round(this.RY / this.U)); if (B !== discB) { discB = B; DISC = buildDisc(B); }
      if (!TREE) TREE = buildTree();
    },
    /** Де Nexi стоїть на острівці (камінь праворуч від сакури) і звідки застрибує (док). */
    stand() { return [this.cx + 40 * this.k, this.cy - this.h]; },
    approach() { return NX.objects.rug.home; },
    /** Тап по сакурі (вона вища за слід острівця) — те саме, що по острівцю. */
    tapFirst(x, y) { const w = 37 * this.U, top = this.cy - this.h - 64 * this.U; if (this.drop || Math.abs(x - this.cx) > w || y < top || y > this.cy - this.RY) return false; return this.onTap(); },
    onTap() { if (NX.nexi.loc !== 'lift') NX.nexi.do('sakura'); return true; },
    petals(n = 14) { const r = Math.random; for (let i = 0; i < n; i++) NX.fx.emit('spark', this.cx + (r() - .5) * 60 * this.k, this.cy - this.h - r() * 30 * this.k + this.drop * this.D, { col: r() < .5 ? BLS[4] : BLS[5], vx: (r() - .5) * 50, vy: -20 - r() * 30, g: 60, ttl: 1.1, s: 1.5 }); },
    land() { NX.nexiPhys.land(3); this.petals(10); },
    /** Крок поїздки: q 0..1, dir +1 — вниз, −1 — вгору. Nexi їде разом з острівцем. */
    ride(q, dir) { const e = q < .5 ? 2 * q * q : 1 - 2 * (1 - q) * (1 - q), n = NX.nexi; this.drop = dir > 0 ? e : 1 - e; n.y = n.gy = this.stand()[1] + this.drop * this.D; },
    /** Унизу: є сад — далі веде він (NX.garden.enter(lift)); ні — сценарій сам піднімає острівець. */
    arrive() { this.petals(18); if (NX.garden && NX.garden.enter) { NX.nexi.queue = []; NX.garden.enter(this); } },
    /** Кроки повернення нагору (сценарій і NX.garden — lift.back()). */
    upSteps() { const n = NX.nexi; return [{ work: { pose: 'stand', dur: 2.2, tick: (dt, q) => this.ride(q, -1) } }, { hop: this.approach(), hi: 22 * this.k }, { loc: 'floor' }, { face: 1 }, { do: () => n.emote('happy', 2.5) }]; },
    back() { const n = NX.nexi; n.loc = 'lift'; n.x = this.stand()[0]; n.dy = this.stand()[1]; this.ride(0, -1); n.alpha = 1; n.zoom = 1; n.queue = this.upSteps(); n.cur = null; },
    update(dt) {
      if (NX.acts && !NX.acts.sakura) NX.acts.sakura = { color: '#ff86c4', route: () => { const st = this.stand();
        return [{ walk: this.approach() }, { hop: st, hi: 22 * this.k, dy: st[1] }, { do: () => this.land() }, { loc: 'lift' }, { face: 1 }, { say: NX.pick('act.sakura.lines') },
          { work: { pose: 'wave', dur: 2.6, tick: (d, q) => this.ride(q, 1) } }, { do: () => this.arrive() }, { wait: 1 },
          ...this.upSteps(), { say: NX.pick('act.sakura.soon') }]; } };
      if (this.drop > 0 && NX.nexi.loc !== 'lift') this.drop = Math.max(0, this.drop - dt / 1.2);       // поїздку перервали — острівець сам нагору
    },
    /** Позаду всіх: шахта (коли острівець їде) і сам диск. */
    drawBack(c, t) {
      if (!DISC) return;
      const { cx, cy, RX, RY, U, k } = this, d = this.drop * this.D, Kk = NX.cam.k * (NX.loop.dpr || 1), X = Math.round(cx * Kk) / Kk, Y = Math.round((cy + d) * Kk) / Kk;
      if (d > 0) {                                                                    // шахта: темне дно, задня стіна з неоновими кільцями
        c.save(); c.beginPath(); c.ellipse(cx, cy, RX, RY, 0, 0, 7); c.clip();
        const g = c.createLinearGradient(0, cy - RY, 0, cy + RY); g.addColorStop(0, '#1a1146'); g.addColorStop(1, '#04030c'); c.fillStyle = g; c.fillRect(cx - RX, cy - RY, RX * 2, RY * 2);
        c.lineWidth = 1.2 * k; for (let z = 5 * k, i = 0; z < d; z += 9 * k, i++) { c.strokeStyle = i % 2 ? `rgba(255,79,216,${.5 + .25 * Math.sin(t * 4 + i)})` : `rgba(59,232,255,${.55 + .25 * Math.sin(t * 4 + i)})`; c.beginPath(); c.ellipse(cx, cy + z, RX - 1, RY, 0, Math.PI, 2 * Math.PI); c.stroke(); }
        c.restore();
        P.glow(c, cx, cy + RY * .3, RX * .8, 'rgba(255,120,200,.7)', this.drop * (.28 + .08 * Math.sin(t * 3)));   // рожеве сяйво саду з глибини
      }
      c.save(); c.imageSmoothingEnabled = false; c.translate(X, Y); c.scale(U, U);
      c.drawImage(DISC.cv, -DISC.X0, -(DISC.Y0 + TH));
      c.globalCompositeOperation = 'lighter';                                         // живе: LED у канавці борту з бігучим вогником, сяйво грибів
      c.strokeStyle = `rgba(59,232,255,${.45 + .25 * Math.sin(t * 2.4)})`; c.lineWidth = 2; c.beginPath(); c.ellipse(0, -TH + 3.4, A - 1, discB, 0, .12, Math.PI - .12); c.stroke();
      const a = .12 + ((t * .16) % 1) * (Math.PI - .24); c.strokeStyle = 'rgba(255,255,255,.85)'; c.beginPath(); c.ellipse(0, -TH + 3.4, A - 1, discB, 0, a, a + .1); c.stroke();
      c.restore();
      DISC.mush.forEach(([mx, my], i) => P.glow(c, cx + mx * U, cy + d + (my - TH) * U, 7 * k, 'rgba(59,232,255,.7)', .35 + .15 * Math.sin(t * 2 + i * 2)));
    },
    /** Сакура — шар із глибиною (хто позаду острівця — за нею); заслона — підлога перед шахтою поверх того, що опустилось. */
    layers(t) {
      if (!TREE) return [];
      const L = [{ y: this.cy, draw: c => this.drawTree(c, t) }];
      if (this.drop > 0) L.push({ y: this.cy + .5, draw: c => this.drawCover(c, t) });
      return L;
    },
    drawTree(c, t) {
      const { cx, cy, U, k } = this, d = this.drop * this.D, Kk = NX.cam.k * (NX.loop.dpr || 1), X = Math.round(cx * Kk) / Kk, Y = Math.round((cy - this.h + 1 + d) * Kk) / Kk;
      P.glow(c, cx, Y - 40 * U, 34 * k, 'rgba(255,120,200,.6)', .2 + .06 * Math.sin(t * 1.6));
      c.save(); c.imageSmoothingEnabled = false; c.translate(X, Y); c.scale(U, U); c.translate(-TB[0], -TB[1]);
      c.drawImage(TREE.trunk, 0, 0); c.drawImage(TREE.bloom, Math.round(Math.sin(t * 1.1) * .8), 0);       // крона ледь гойдається
      for (let i = 0; i < 4; i++) { const q = (t * .7 + i * .37) % 1; if (q < .25) { c.fillStyle = '#ffffff'; c.fillRect(18 + hash(i, Math.floor(t * .7 + i * .37)) * 56 | 0, 10 + hash(i + 9, Math.floor(t * .7 + i * .37)) * 26 | 0, 1, 1); } }   // іскорки
      for (let i = 0; i < 7; i++) {                                                   // пелюстки падають і лягають на мох
        const T = 3.2 + hash(i, 21) * 2.4, q = (t / T + hash(i, 22)) % 1, x = 14 + hash(i, 23) * 64 + Math.sin(q * 6 + i) * 5 + q * 6, y = 22 + q * q * 48;
        c.globalAlpha = q > .85 ? (1 - q) / .15 : 1; c.fillStyle = i % 2 ? BLS[4] : BLS[5]; c.fillRect(Math.round(x), Math.round(y), 2, 1); c.fillStyle = BLS[3]; c.fillRect(Math.round(x) + (Math.sin(q * 20 + i) > 0 ? 1 : 0), Math.round(y) + 1, 1, 1);
      }
      c.restore();
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

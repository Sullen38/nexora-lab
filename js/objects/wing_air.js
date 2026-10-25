/* ============================================================================
 * objects/wing_air.js — ПОВІТРЯ ЛІВОГО КРИЛА: серпанок з пилом у світлі ламп, тонкі промені від ліхтарів
 * ----------------------------------------------------------------------------
 * Пункт №5 списку «до рівня картинки». Світло стає видимим у повітрі:
 *   СЕРПАНОК — під кожним джерелом конус світла в повітрі: піксельний (смуги рівнів з
 *     дизерингом Байєра, як 8-bit), нерівний (шум — «клапті» серпанку), м'яко дихає разом
 *     з мерехтінням джерела. Растр 2 px/од. будується один раз; щокадру — лише прозорість.
 *   ПРОМЕНІ — від ліхтарів (2 настінні ліхтарі й китайський) віялом тонкі промені з чіткими
 *     краями: ядро яскравіше, край тьмяніший, згасають від джерела. Дві групи (парні/непарні)
 *     по черзі повільно «переливаються»; промені китайського ліхтаря гойдаються разом з ним.
 *   ПИЛ — порошинки (1 од.) зринають у світлі, повільно пливуть і гаснуть, мерехтять;
 *     яскраві біля джерела, тьмяні на краю конуса. Без стану: усе — функція часу.
 * Джерела: настінні ліхтарі (wing_wall.js NX.wing.LANT), лампи Едісона й китайський ліхтар
 * (wing_props.js), настільна лампа AI-центру (ai_center.js). Малюється після всього крила
 * (і після сяйва wingGlow), перед Nexi, котом і кріслами — тобто «у повітрі» перед стіною.
 * №8 (реакція на Nexi, objects/wing_react.js): lamp — світло є, лише коли лампа горить (настільна
 * лампа AI-центру світить униз-ліворуч, на місце кота; floorY — конус обривається на стільниці);
 * zone — лампа Едісона над столом зони спалахує, поки Nexi там працює.
 * ========================================================================== */
(() => {
  const P = NX.px, F = NX.furn, K = NX.kit, RE = NX.wing.react, hash = NX.art.hash, BAYER = NX.art.BAYER, rgba = K.rgba;
  const TAU = Math.PI * 2, bay = (i, j) => BAYER[(j & 3) * 4 + (i & 3)];
  const WARM = [255, 172, 92], BULB = [255, 206, 132], RED = [255, 86, 54];
  // джерела: (ax, ay) — центр; hx, hy — піврозміри корпусу (промені й серпанок починаються з його краю);
  // dir — напрям конуса (вниз = π/2), spread — піввідкриття, len — довжина; rays — скільки тонких променів;
  // haze/ray — сила серпанку й променів; dust — порошинок; fl(t) — мерехтіння як у самого джерела
  const LIGHTS = [
    { id: 'lantA', ax: 218, ay: 31, hx: 13, hy: 18, dir: Math.PI / 2, spread: 1.05, len: 118, col: WARM, rays: 9, haze: .5, ray: .62, dust: 18, seed: 1, fl: t => .85 + .1 * Math.sin(t * 6.3) + .05 * Math.sin(t * 13.7) },
    { id: 'lantB', ax: 510, ay: 171, hx: 13, hy: 25, dir: Math.PI / 2, spread: .95, len: 108, col: WARM, rays: 8, haze: .5, ray: .62, dust: 16, seed: 2, fl: t => .85 + .1 * Math.sin(t * 6.3 + 2) + .05 * Math.sin(t * 13.7 + 1) },
    { id: 'bulbA', ax: 332, ay: 38.5, hx: 5, hy: 7, dir: Math.PI / 2, spread: .6, len: 84, beam: 1, col: BULB, rays: 0, haze: .4, ray: 0, dust: 14, seed: 3, zone: 'analytics', fl: t => .78 + .14 * Math.sin(t * 7 + 327) + .08 * Math.sin(t * 13.7) },
    { id: 'bulbB', ax: 640, ay: 108.5, hx: 5, hy: 7, dir: Math.PI / 2, spread: .6, len: 76, beam: 1, col: BULB, rays: 0, haze: .4, ray: 0, dust: 12, seed: 4, zone: 'marketing', fl: t => .78 + .14 * Math.sin(t * 7 + 635) + .08 * Math.sin(t * 13.7) },
    { id: 'chinese', ax: 466, ay: 19.5, hx: 11, hy: 14, dir: Math.PI / 2, spread: 1.6, len: 58, col: RED, rays: 11, haze: .42, ray: .55, dust: 10, seed: 5, sway: { x: 466, y: -40, k: .05, ph: 454 }, fl: t => .86 + .14 * Math.sin(t * 5 + 454) },
    { id: 'deskLamp', ax: 300.5, ay: 282.4, hx: 0, hy: 0, dir: Math.PI / 2 + .5, spread: .58, len: 28, rr: 5, floorY: 296.8, beam: 1, col: [255, 222, 152], rays: 0, haze: .34, ray: 0, dust: 9, seed: 6, lamp: 'ai', fl: t => .95 + .05 * Math.sin(t * 7) },
  ];
  /** Кутова відстань від напрямку конуса. */
  const angOff = (a, dir) => Math.abs(((a - dir) % TAU + TAU * 1.5) % TAU - Math.PI);
  /** Чи точка в корпусі джерела (туди не світимо — він і так яскравий). */
  const inBody = (L, dx, dy) => Math.abs(dx) < L.hx && Math.abs(dy) < L.hy;
  /** Сила серпанку в точці: кругле сяйво біля джерела + конус, нерівний (шум), 0..1. */
  function hazeAt(L, X, Y) {
    const dx = X - L.ax, dy = Y - L.ay, d = Math.hypot(dx, dy); if (d > L.len || inBody(L, dx, dy) || (L.floorY && Y > L.floorY)) return 0;
    const da = angOff(Math.atan2(dy, dx), L.dir), round = Math.max(0, 1 - d / (L.rr || L.len * .4)) ** 2 * .55;   // rr — радіус круглого сяйва (за замовч. 0.4 довжини)
    const cone = da >= L.spread ? 0 : L.beam ? (1 - d / L.len) ** .85 * (da < L.spread * .5 ? 1 : .55)   // лампа: чіткий промінь-конус з двох смуг (8-bit)
      : (1 - d / L.len) ** 1.15 * (1 - (da / L.spread) ** 2);                                             // ліхтар: м'який конус (поверх — тонкі промені)
    return Math.max(round, cone) * (.66 + .34 * K.vn(X / 10 + L.seed * 7, Y / 7 + L.seed));
  }
  /** Тонкі промені: віяло з корпусу; ширина від ~1 од. біля джерела до 2..4.5 на кінці; ядро яскравіше. */
  function makeRays(L) {
    const out = [];
    for (let k = 0; k < L.rays; k++) {
      const a = L.dir + L.spread * .92 * ((k + .5) / L.rays * 2 - 1) + (hash(k, L.seed) - .5) * .12, c = Math.cos(a), s = Math.sin(a);
      const s0 = Math.min(L.hx / Math.max(1e-3, Math.abs(c)), L.hy / Math.max(1e-3, Math.abs(s))) + 1.2;   // старт — край корпусу
      out.push({ c, s, s0, len: L.len * (.6 + .4 * hash(k, L.seed + 9)), w0: 1.2, w1: 3 + 3.2 * hash(k, L.seed + 4), k: .6 + .4 * hash(k, L.seed + 7), g: k % 2 });
    }
    return out;
  }
  function rayAt(L, rays, g, X, Y) {
    const dx = X - L.ax, dy = Y - L.ay; let best = 0;
    for (const r of rays) {
      if (r.g !== g) continue; const s = dx * r.c + dy * r.s; if (s < r.s0 || s > r.len) continue;
      const q = Math.abs(dy * r.c - dx * r.s), w = r.w0 + (r.w1 - r.w0) * (s / r.len); if (q > w / 2) continue;
      const v = (1 - (s - r.s0) / (r.len - r.s0)) ** .9 * (q < w / 4 ? 1 : .55) * r.k; if (v > best) best = v;
    }
    return best;
  }
  /** Межі растра джерела (одиниці кімнати). */
  function bounds(L) {
    let x0 = L.ax - L.len * .45, x1 = L.ax + L.len * .45, y0 = L.ay - L.len * .45, y1 = L.ay + L.len * .45;
    for (let k = 0; k <= 16; k++) { const a = L.dir - L.spread + 2 * L.spread * k / 16, x = L.ax + Math.cos(a) * L.len, y = L.ay + Math.sin(a) * L.len; x0 = Math.min(x0, x); x1 = Math.max(x1, x); y0 = Math.min(y0, y); y1 = Math.max(y1, y); }
    return [Math.floor(x0), Math.floor(y0), Math.ceil(x1), Math.ceil(y1)];
  }
  /** Растр світла: сила 0..1 -> рівні (n) з дизерингом Байєра -> колір джерела, помножений на рівень (для 'lighter').
   *  fns — кілька шарів [fn, рівнів, підсвітлення кольору]; беремо найсильніший. Порожні краї обрізаються (менше малювати). */
  function bake(L, fns) {
    const [x0, y0, x1, y1] = bounds(L), S = F.Sheet(x0, y0, x1, y1, .5);
    S.rect(x0, y0, x1, y1, (u, v, i, j, X, Y) => {
      let best = 0, col = L.col;
      for (const [fn, n, lift] of fns) { const I = fn(X, Y); if (I <= 0) continue; const k = Math.floor(I * n + bay(i, j) + .5); if (k <= 0) continue; const m = Math.min(1, k / n); if (m > best) { best = m; col = L.col.map(v => Math.min(255, v + lift)); } }
      return best ? '#' + col.map(c => Math.round(c * best).toString(16).padStart(2, '0')).join('') : null;
    });
    const { w, h, d } = S.r; let i0 = w, i1 = -1, j0 = h, j1 = -1;                                        // обрізати порожнє
    for (let j = 0; j < h; j++) for (let i = 0; i < w; i++) if (d[(j * w + i) * 4 + 3]) { if (i < i0) i0 = i; if (i > i1) i1 = i; if (j < j0) j0 = j; if (j > j1) j1 = j; }
    if (i1 < 0) return null;
    const cv = document.createElement('canvas'); cv.width = i1 - i0 + 1; cv.height = j1 - j0 + 1; cv.getContext('2d').drawImage(S.r.canvas(), -i0, -j0);
    return { cv, x0: x0 + i0 * .5, y0: y0 + j0 * .5, x1: x0 + (i1 + 1) * .5, y1: y0 + (j1 + 1) * .5 };
  }
  /** Серпанок і половина променів — в одному растрі (один drawImage), друга половина — окремо: вона «переливається». */
  function build(L) {
    const haze = (X, Y) => hazeAt(L, X, Y);
    if (!L.rays) { L.hz = bake(L, [[haze, 6, 0]]); return; }
    const rays = makeRays(L); L.hz = bake(L, [[haze, 6, 0], [(X, Y) => rayAt(L, rays, 0, X, Y) * L.ray / L.haze, 5, 30]]); L.rB = bake(L, [[(X, Y) => rayAt(L, rays, 1, X, Y), 5, 30]]);
  }
  /** Порошинки: кожна живе 6..12 с у випадковому місці конуса (ближче до джерела — частіше), повільно пливе, мерехтить. */
  function dust(c, L, t, f) {
    const [r, g, b] = L.col, rgb = `${Math.min(255, r + 40)},${Math.min(255, g + 50)},${Math.min(255, b + 70)}`;
    for (let k = 0; k < L.dust; k++) {
      const per = 6 + 6 * hash(k, L.seed + 11), cyc = t / per + hash(k, L.seed + 12), ci = Math.floor(cyc), u = cyc - ci;
      const pu = hash(ci * 3 + k, L.seed + 13), pv = hash(ci * 5 + k, L.seed + 14) * 2 - 1, a = L.dir + pv * L.spread * .82;
      const s0 = L.hx || L.hy ? Math.min(L.hx / Math.max(.1, Math.abs(Math.cos(a))), L.hy / Math.max(.1, Math.abs(Math.sin(a)))) + 2 : 1, dist = s0 + pu ** 1.3 * (L.len * .78 - s0);
      let x = L.ax + Math.cos(a) * dist + (hash(ci, k + 31) - .5) * 6 * u + Math.sin(t * .9 + k) * .8, y = L.ay + Math.sin(a) * dist + (hash(ci, k + 37) - .3) * 5 * u;
      const life = Math.sin(Math.PI * u) ** 1.5, tw = .6 + .4 * Math.sin(t * 3.1 + k * 2.3), A = Math.min(1, life * tw * f * (1 - dist / L.len) ** .5 * 1.5); if (A < .05) continue;
      const sz = hash(k, L.seed + 15) > .7 ? 1.5 : 1; x = Math.round(x * 2) / 2; y = Math.round(y * 2) / 2; if (L.floorY && y > L.floorY - sz) continue;
      c.fillStyle = rgba(rgb, A); c.fillRect(x, y, sz, sz);
      if (sz > 1 && A > .45) { c.fillStyle = rgba(rgb, A * .35); c.fillRect(x - .5, y + .5, sz + 1, .5); }   // «зірочка» на найяскравіших
    }
  }
  /** Растр -> екран: один раз зменшений під роздільність (F.fit), без згладжування (дешевше; дизеринг уже усереднено). */
  const draw = (c, S, R, a) => { if (!S || a <= .003) return; const w = S.x1 - S.x0, h = S.y1 - S.y0; c.globalAlpha = a; c.imageSmoothingEnabled = false; c.drawImage(F.fit(S.cv, w, h, R), S.x0, S.y0, w, h); };
  NX.addObject({
    id: 'wingAir', LIGHTS,
    drawBack(c, t) {
      if (c.isRefl) return;
      const R = Math.min(2, F.res());
      c.save(); c.globalCompositeOperation = 'lighter';
      for (const L of LIGHTS) {
        if (!L.hz) build(L);
        const f = L.fl(t) * (L.lamp ? RE.lamp(L.lamp, t) : 1) * (L.zone ? 1 + .7 * RE.bulb(L.zone) : 1); if (f < .005) continue;   // №8: лампа вимкнена — світла нема; Nexi під лампою — яскравіше
        c.save();
        if (L.sway) { const { x, y, k, ph } = L.sway, a = Math.sin(t * .8 + ph) * k; c.translate(x, y); c.rotate(a); c.translate(-x, -y); }   // китайський ліхтар гойдається — і світло з ним
        draw(c, L.hz, R, L.haze * f);
        if (L.rB) draw(c, L.rB, R, L.ray * f * (.35 + .65 * Math.sin(t * .6 + L.seed) ** 2));                   // друга група променів повільно спалахує й гасне
        c.globalAlpha = 1; dust(c, L, t, f);
        c.restore();
      }
      c.restore();
    },
  });
})();

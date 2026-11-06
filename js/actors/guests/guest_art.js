/* ============================================================================
 * actors/guests/guest_art.js — ГОСТІ З ПОРТАЛУ: ПІКСЕЛЬНІ СПРАЙТИ (крок 14; HD — крок 16)
 * ----------------------------------------------------------------------------
 * Власник: «з портала з'являються рандомні відомі персонажі — піксельні, такі, щоб усі знали». Двадцять героїв казок,
 * легенд і старих книжок (суспільне надбання), намальованих кодом по-своєму — за самими казками, а не за мультфільмами
 * студій (Білосніжка без діснеївського вбрання, Чеширський кіт — бузковий, Кіт у чоботях — сірий, Джин — бурштиновий тощо).
 * Крок 16 (власник 03.11: «вони трохи так собі виглядають — треба більше графіки, домальовуй і допрацьовуй»): HD-СІТКА
 *   48×58 — та сама щільність пікселя, що в Nexi (масштаб .75; у кімнаті герої того самого розміру); кожна деталь — у три
 *   тони (світло спереду-згори, основний, тінь), обличчя з бровами, бліками в очах і рум'янцем, складки й візерунки на
 *   одязі, кольоровий контур (темніший відтінок сусіднього кольору, а не чорний). Нові дрібниці: Баба Яга — кістяна нога,
 *   хустка з квітами й латки, летить у СТУПІ з товкачем; Піноккіо — на довгому носі проростає листочок; Дон Кіхот після
 *   падіння — зірочки довкола голови; Чеширський кіт часом зникає — лишаються усмішка й очі; Жар-птиця — хвіст з «очима».
 * NX.guestArt.draw(id, pose, fr, t, cv, g) — малює героя в полотно cv (W×H, ноги — на нижньому рядку, лицем праворуч;
 * ліворуч — дзеркалить guests.js) і обводить контуром. g — стан гостя (g.nose — довжина носа, g.lostShoe — без черевичка).
 * Пози: stand / walk / run, далі — свої (sweep, search, cheer, give, watch, roll, bow, charge, fall, inspect, aim,
 * ride, fly, cast, float, rust, dig, sneeze, twirl, sit). Розмір і масштаб — size(id): [W, H, масштаб].
 * Поруч — дрібні речі на підлозі (drawProp, сітка 24×16): скриня, подарунок, черевичок, перо, лампа.
 * Пензлі: P / px — прямокутник і піксель, rod — об'ємна смуга (рукав, нога, держак), blk — заокруглений об'ємний блок,
 * skirt — спідниця-дзвін зі складками, head + face — голова й обличчя, legs + gait — ноги й крок, outline — контур.
 * ========================================================================== */
NX.guestArt = (() => {
  let x = null, lastC = null;                                                                      // lastC — колір, що вже стоїть у fillStyle (не розбирати рядок щоразу)
  const W = 48, H = 58, GY = 57;                                                                  // сітка; рядок, на якому стоять ноги
  const P = (a, b, w, h, c) => { if (w <= 0 || h <= 0) return; if (c !== lastC) { x.fillStyle = c; lastC = c; } x.fillRect(Math.round(a), Math.round(b), Math.max(1, Math.round(w)), Math.max(1, Math.round(h))); };
  /** Полотно під спрайт: розмір міняємо лише коли інший (присвоєння width скидає полотно — дорого), далі — очищення. */
  const canvasFor = (cv, w, h) => { if (cv.width !== w) cv.width = w; if (cv.height !== h) cv.height = h; x = cv.getContext('2d', { willReadFrequently: true }); x.clearRect(0, 0, w, h); lastC = null; return x; };
  const px = (a, b, c) => P(a, b, 1, 1, c);
  const S = (c, k) => shade(c, k);                                                                // світліше (k > 0) / темніше (k < 0) — skins.js
  const T = c => ({ L: S(c, .3), M: c, D: S(c, -.27), K: S(c, -.5) });                           // три тони (+ найтемніший)
  const line = (x0, y0, x1, y1, c) => { const n = Math.max(1, Math.round(Math.max(Math.abs(x1 - x0), Math.abs(y1 - y0)))); for (let i = 0; i <= n; i++) P(x0 + (x1 - x0) * i / n, y0 + (y1 - y0) * i / n, 1, 1, c); };
  /** Об'ємна смуга шириною w (рукав, нога, держак): світла кромка (ліва — у стоячих, верхня — у лежачих), основний, тінь. */
  function rod(x0, y0, x1, y1, c, w = 3) {
    const t = T(c), v = Math.abs(y1 - y0) >= Math.abs(x1 - x0), cols = w === 1 ? [c] : w === 2 ? [t.L, t.D] : w === 3 ? [t.L, c, t.D] : [t.L, c, c, t.D];
    cols.forEach((col, i) => { const o = i - Math.floor((w - 1) / 2); line(x0 + (v ? o : 0), y0 + (v ? 0 : o), x1 + (v ? o : 0), y1 + (v ? 0 : o), col); });
  }
  /** Заокруглений об'ємний блок: світлий верх і лівий край, тінь справа й знизу. */
  function blk(a, b, w, h, c, r = 1) {
    const t = T(c);
    for (let i = 0; i < h; i++) { const k = i < r ? r - i : i > h - 1 - r ? i - (h - 1 - r) : 0; P(a + k, b + i, w - 2 * k, 1, c); px(a + k, b + i, t.L); px(a + w - 1 - k, b + i, t.D); }
    P(a + r, b, w - 2 * r, 1, t.L); P(a + r, b + h - 1, w - 2 * r, 1, t.D);
  }
  /** Фігура рядками [[зсув, ширина], ...] від (x0, y0) одним кольором. */
  const spans = (x0, y0, rows, c) => rows.forEach(([a, w], i) => P(x0 + a, y0 + i, w, 1, c));
  /** Коло (заливка) радіуса r. */
  const disc = (cx, cy, r, c) => { for (let y = -r; y <= r; y++) { const w = Math.round(Math.sqrt(r * r - y * y + r * .6)); P(cx - w, cy + y, 2 * w + 1, 1, c); } };
  /** Заливка трикутника (крило, вогонь). */
  function tri(ax, ay, bx, by, cx, cy, c) {
    const x0 = Math.floor(Math.min(ax, bx, cx)), x1 = Math.ceil(Math.max(ax, bx, cx)), y0 = Math.floor(Math.min(ay, by, cy)), y1 = Math.ceil(Math.max(ay, by, cy)), d = (bx - ax) * (cy - ay) - (cx - ax) * (by - ay); if (!d) return;
    for (let yy = y0; yy <= y1; yy++) for (let xx = x0; xx <= x1; xx++) { const u = ((bx - xx) * (cy - yy) - (cx - xx) * (by - yy)) / d, v = ((cx - xx) * (ay - yy) - (ax - xx) * (cy - yy)) / d; if (u >= -.05 && v >= -.05 && u + v <= 1.05) px(xx, yy, c); }
  }
  /** Кисть 3×3. */
  const hand = (cx, cy, sk) => { P(cx - 1, cy - 1, 3, 3, sk.M); px(cx - 1, cy - 1, sk.L); px(cx + 1, cy + 1, sk.D); };
  /** Блиск-зірочка (+). */
  const star = (cx, cy, c = '#ffffff', r = 1) => { px(cx, cy, c); for (let i = 1; i <= r; i++) { px(cx - i, cy, c); px(cx + i, cy, c); px(cx, cy - i, c); px(cx, cy + i, c); } };

  // палітри шкіри
  const SK = { M: '#f4cbb0', L: '#ffe2cc', D: '#d39e82' }, PALE = { M: '#fbe6de', L: '#ffffff', D: '#e2bcb2' }, TAN = { M: '#e4b28a', L: '#f6cca8', D: '#bc8864' };
  const OLD = { M: '#dcae88', L: '#ecc6a2', D: '#b2845e' }, WOOD = { M: '#e2ae6a', L: '#f6cc8e', D: '#b8844a' }, AMBER = { M: '#e8a04a', L: '#ffc87a', D: '#b8782e' };
  const EYE = '#1a1030';

  // ---------------- КРОК, НОГИ, РУКИ ----------------
  /** Крок за кадром fr: зсуви задньої / передньої ноги (bl, fl), підйом (bu, fu), підстрибування тіла (bob), мах руками (sw). */
  function gait(pose, fr) {
    const r = pose === 'run'; if (pose !== 'walk' && !r) return { bl: 0, fl: 0, bu: 0, fu: 0, bob: 0, sw: 0 };
    const s = r ? 3 : 2; return [{ bl: -s, fl: s, bu: 0, fu: 0, bob: 0, sw: 1 }, { bl: 0, fl: 0, bu: 2, fu: 0, bob: -1, sw: 0 }, { bl: s, fl: -s, bu: 0, fu: 0, bob: 0, sw: -1 }, { bl: 0, fl: 0, bu: 0, fu: 2, bob: -1, sw: 0 }][fr % 4];
  }
  /** Нога від стегна (cx, y0) до землі yb: штанина / панчоха і черевик носком праворуч; o.peg — дерев'яна, o.bone — кістяна. */
  function leg(cx, y0, yb, c, sc, o = {}) {
    if (o.peg) { rod(cx, y0, cx, yb - 7, c, 3); P(cx - 1, yb - 8, 3, 2, '#5a3a1a'); rod(cx, yb - 6, cx, yb, '#a8763a', 2); px(cx, yb, '#5a3a1a'); return; }
    if (o.bone) { const B = '#efe6cc', BD = '#c4b48c'; rod(cx, y0, cx, yb - 2, B, 2); P(cx - 1, y0 + 3, 4, 3, B); px(cx + 2, y0 + 5, BD); px(cx - 1, y0 + 3, '#ffffff');
      P(cx - 1, yb - 3, 4, 2, B); P(cx, yb - 1, 4, 2, B); px(cx + 3, yb, BD); px(cx + 1, yb - 1, BD); return; }
    rod(cx, y0, cx, yb - 3, c, o.w || 3);
    const t = T(sc); P(cx - 1, yb - 2, 4, 1, sc); P(cx - 1, yb - 1, 5, 2, sc); P(cx - 1, yb - 2, 3, 1, t.L); P(cx - 1, yb, 5, 1, t.D); px(cx + 3, yb - 1, t.L);
    if (o.cuff) P(cx - 2, yb - 5 - (o.cuffH || 0), 5, 2 + (o.cuffH || 0), o.cuff);
  }
  function legs(g, c, sc, o = {}) {
    const hip = (o.hip || 44) + g.bob;
    leg((o.bx || 21) + g.bl, hip, GY - g.bu, S(c, -.12), S(sc, -.1), o.back || o);
    leg((o.fx || 27) + g.fl, hip, GY - g.fu, c, sc, o.front || o);
  }
  /** Де кисті за позою: [задня, передня] (B — підстрибування тіла). */
  function hands(pose, g, t, B = 0) {
    const b = Math.round(Math.sin(t * 2)), s = g.sw * (Math.abs(g.bl) > 2 ? 3 : 2);
    switch (pose) {
      case 'cheer': return [[15, 21 + b], [34, 20 - b]];
      case 'give': return [[18, 41], [37, 35]];
      case 'search': return [[18, 41], [33, 21]];
      case 'bow': return [[15, 44], [37, 44]];
      default: return [[18 + s, 41 + B], [31 - s, 41 + B]];
    }
  }
  /** Рука: рукав від плеча s до кисті h (об'ємний), манжета, кисть. */
  function arm(s, h, c, sk, o = {}) { rod(s[0], s[1], h[0], h[1] - 1, c, o.w || 3); if (o.cuff) { const v = Math.abs(h[1] - s[1]) >= Math.abs(h[0] - s[0]); P(h[0] - (v ? 1 : 2), h[1] - (v ? 3 : 1), v ? 3 : 2, v ? 1 : 3, o.cuff); } hand(h[0], h[1], sk); }

  // ---------------- ГОЛОВА Й ОБЛИЧЧЯ ----------------
  const HR = [[4, 7], [2, 11], [1, 13], [0, 15], [0, 15], [0, 15], [0, 15], [0, 15], [0, 15], [0, 15], [0, 15], [1, 14], [1, 13], [3, 11], [5, 8]];
  /** Кругла голова 15×15 (лицем праворуч, три чверті): світло спереду-згори, тінь на потилиці й під щелепою, вухо, обличчя. */
  function head(hx, hy, sk, o = {}) {
    HR.forEach(([a, w], i) => P(hx + a, hy + i, w, 1, sk.M));
    P(hx + 6, hy + 1, 6, 1, sk.L); P(hx + 9, hy + 2, 4, 1, sk.L); P(hx + 12, hy + 3, 2, 4, sk.L);
    P(hx, hy + 4, 1, 7, sk.D); P(hx + 1, hy + 11, 1, 2, sk.D); P(hx + 2, hy + 13, 2, 1, sk.D); P(hx + 4, hy + 14, 2, 1, sk.D);
    if (!o.noEar) { P(hx + 2, hy + 7, 2, 3, sk.D); px(hx + 3, hy + 8, sk.M); }
    face(hx, hy, sk, o);
  }
  /** Очі (2×3 з бліком і райдужкою; shut / happy / dot / wide), вії, брови (browA 1 — сердиті, -1 — стурбовані), ніс, рум'янець, рот. */
  function face(hx, hy, sk, o = {}) {
    const E = o.eye || EYE, ey = hy + 6 + (o.ey || 0), ex = [hx + 6, hx + 11];
    if (o.eyes === 'shut') ex.forEach(e => P(e, ey + 2, 2, 1, E));
    else if (o.eyes === 'happy') ex.forEach(e => { px(e - 1, ey + 2, E); P(e, ey + 1, 2, 1, E); px(e + 2, ey + 2, E); });
    else if (o.eyes === 'dot') ex.forEach(e => { P(e, ey + 1, 2, 2, E); px(e, ey + 1, '#ffffff'); });
    else if (o.eyes === 'wide') ex.forEach(e => { P(e - 1, ey - 1, 4, 4, '#ffffff'); P(e, ey, 2, 2, E); });
    else ex.forEach(e => { P(e, ey, 2, 3, E); px(e, ey, '#ffffff'); px(e + 1, ey + 2, o.iris || '#5a78e0'); });
    if (o.lash) { px(hx + 13, ey - 1, E); px(hx + 13, ey, E); px(hx + 5, ey, E); }
    if (o.brow) { const b = o.brow, a = o.browA || 0, by = ey - 2;
      P(hx + 5, by, 3, 1, b); P(hx + 10, by, 3, 1, b);
      if (a === 1) { px(hx + 7, by + 1, b); px(hx + 10, by + 1, b); px(hx + 5, by - 1, b); px(hx + 12, by - 1, b); }
      if (a === -1) { px(hx + 5, by + 1, b); px(hx + 12, by + 1, b); px(hx + 7, by - 1, b); px(hx + 10, by - 1, b); } }
    if (!o.noNose) { px(hx + 10, hy + 10, sk.D); px(hx + 11, hy + 10, S(sk.M, -.1)); }
    if (!o.noCheek) { P(hx + 4, hy + 10, 2, 1, o.cheek || '#ff9fb4'); px(hx + 13, hy + 10, o.cheek || '#ff9fb4'); }
    const mx = hx + 8, my = hy + 12, M = o.lip || '#9a3444';
    switch (o.mouth) {
      case 'smile': px(mx, my, M); P(mx + 1, my + 1, 3, 1, M); px(mx + 4, my, M); break;
      case 'grin': P(mx, my - 1, 5, 2, '#5a1020'); P(mx, my - 1, 5, 1, '#ffffff'); px(mx + 2, my, '#ff7a8a'); break;
      case 'o': P(mx + 1, my - 1, 3, 3, '#5a1020'); px(mx + 2, my, '#ff7a8a'); break;
      case 'flat': P(mx + 1, my, 3, 1, M); break;
      case 0: break;
      default: P(mx + 1, my, 3, 1, M); px(mx + 4, my - 1, M);
    }
  }
  /** Спідниця-дзвін: від y0 (ширина w0) до y1 (w1), центр cx; складки — темні й світлі смуги; кайма hemC (висотою hem). */
  function skirt(cx, y0, y1, w0, w1, c, o = {}) {
    const t = T(c), n = o.folds || 4;
    for (let y = y0; y <= y1; y++) {
      const k = (y - y0) / Math.max(1, y1 - y0), w = Math.round(w0 + (w1 - w0) * Math.pow(k, o.pow || 1)), x0 = Math.round(cx - w / 2 + (o.sway || 0) * k);
      P(x0, y, w, 1, c); px(x0, y, t.L); px(x0 + w - 1, y, t.D);
      if (k > .12) for (let i = 1; i < n; i++) { const fx = Math.round(x0 + w * i / n); px(fx, y, t.D); if (k > .3) px(fx - 1, y, S(c, .14)); }
      if (y > y1 - (o.hem || 0)) P(x0, y, w, 1, o.hemC || t.D);
    }
  }
  /** Віник: в'язка стебел (світлі й темні), перев'язана червоною ниткою; низ — на підлозі (y1). */
  function besom(cx, top, y1, sway = 0) {
    for (let i = 0; i <= y1 - top; i++) { const w = Math.round(3 + i * 1.25), x0 = Math.round(cx - w / 2 + sway * i / 8);
      for (let k = 0; k < w; k++) px(x0 + k, top + i, k % 3 === 0 ? '#a8802a' : k % 3 === 1 ? '#ecca62' : '#d0aa44'); }
    P(cx - 2, top + 1, 4, 2, '#c02030'); px(cx - 2, top + 1, '#ee5a6a');
  }

  /** ТІЛО В КУПАЛЬНИКУ (образи після сценок «справжньої вечірки», 06.11): фігура — плечі, тонка талія, стегна; босі ноги;
   *  купальник suit: o.one — суцільний, інакше роздільний; o.dots — у горошок, o.stripes — у смужку; o.ring — надувне коло. */
  function swimBody(g, B, sk, suit, o = {}) {
    const t = T(suit), ptn = (a, b) => o.dots ? ((a + b) % 4 === 0 ? '#ffffff' : null) : o.stripes ? (b % 3 === 0 ? '#ffffff' : null) : null;
    leg(21 + g.bl, 44 + B, GY - g.bu, S(sk.M, -.12), S(sk.M, -.1), { w: 3 }); leg(27 + g.fl, 44 + B, GY - g.fu, sk.M, sk.M, { w: 3 });   // босі ноги
    px(23 + g.bl, GY - 1 - g.bu, sk.L); px(29 + g.fl, GY - 1 - g.fu, sk.L); px(31 + g.fl, GY - g.fu, sk.D);                 // пальчики
    const TOR = [[0, 13], [0, 13], [0, 13], [1, 11], [1, 11], [2, 9], [2, 9], [2, 9], [1, 11], [0, 12], [0, 12], [-1, 13], [-1, 13], [0, 12], [1, 10], [2, 8]];   // плечі → талія → стегна
    TOR.forEach(([a, w], i) => { P(18 + a, 29 + B + i, w, 1, sk.M); px(18 + a, 29 + B + i, sk.L); px(18 + a + w - 1, 29 + B + i, sk.D); });
    px(25, 36 + B, sk.D); P(20, 29 + B, 9, 1, sk.L);                                                                      // пупок, світло на плечах
    const top = [[0, 13], [0, 13], [1, 11], [1, 11]], bot = [[-1, 13], [-1, 13], [0, 12], [1, 10], [2, 8]], from = o.one ? 0 : 4;
    (o.one ? TOR.slice(0, 11) : top).forEach(([a, w], i) => { P(18 + a, 29 + B + i, w, 1, suit); px(18 + a, 29 + B + i, t.L); px(18 + a + w - 1, 29 + B + i, t.D); for (let k = 1; k < w - 1; k++) { const c = ptn(k, i); if (c) px(18 + a + k, 29 + B + i, c); } });
    bot.forEach(([a, w], i) => { P(18 + a, 40 + B + i, w, 1, suit); px(18 + a, 40 + B + i, t.L); px(18 + a + w - 1, 40 + B + i, t.D); for (let k = 1; k < w - 1; k++) { const c = ptn(k, i + 11); if (c) px(18 + a + k, 40 + B + i, c); } });
    px(24, 31 + B, t.D); px(20, 28 + B, suit); px(28, 28 + B, suit);                                                      // виріз, бретельки
    if (o.ring) { const RC = o.ring; for (let y = -3; y <= 3; y++) { const w = Math.round(Math.sqrt(9 - y * y) * 4.6) + 10; P(24 - w / 2, 41 + B + y, w, 1, y < 0 ? S(RC, .25) : RC); P(24 - w / 2 + 3, 41 + B + y, 1, 1, '#ffffff'); }   // надувне коло
      TOR.slice(9, 14).forEach(([a, w], i) => { if (i < 2) return; P(18 + a, 38 + B + i, w, 1, i === 2 ? S(RC, .25) : RC); }); for (let i = 0; i < 5; i++) px(13 + i * 6, 41 + B, '#fff0a0'); }
  }
  /** Перефарбувати готовий кадр: кожна пара [з, на] — колір і його тони (L/M/D/K) — на відповідні тони нового кольору. */
  function recolor(pairs) {
    const Wc = x.canvas.width, Hc = x.canvas.height, id = x.getImageData(0, 0, Wc, Hc), d = id.data, map = new Map();
    const hex = c => { const n = parseInt(c.slice(1), 16); return [(n >> 16) & 255, (n >> 8) & 255, n & 255]; };
    pairs.forEach(([a, b]) => { const ta = T(a), tb = T(b); [['L', 'L'], ['M', 'M'], ['D', 'D'], ['K', 'K']].forEach(([k1, k2]) => map.set(hex(ta[k1]).join(','), hex(tb[k2]))); map.set(hex(a).join(','), hex(b)); });
    for (let i = 0; i < d.length; i += 4) { if (!d[i + 3]) continue; const m = map.get(d[i] + ',' + d[i + 1] + ',' + d[i + 2]); if (m) { d[i] = m[0]; d[i + 1] = m[1]; d[i + 2] = m[2]; } }
    x.putImageData(id, 0, 0); lastC = null;
  }
  /** Святковий ковпачок (конус у смужку з помпоном) вершиною вгору; окуляри-«сонце» на очі голови (hx, hy). */
  const partyHat = (cx, yb, h = 11, c1 = '#ff4fd8', c2 = '#ffe27a') => { for (let i = 0; i < h; i++) { const w = Math.round((h - i) * 1.1) + 1; P(cx - w / 2, yb - i, w, 1, i % 4 < 2 ? c1 : c2); px(cx - w / 2, yb - i, '#ffffff'); } disc(cx, yb - h - 1, 1, '#ffffff'); px(cx, yb - h - 2, '#3be8ff'); };
  const shades = (hx, hy, c = '#1a1030') => { P(hx + 5, hy + 5, 4, 3, c); P(hx + 10, hy + 5, 4, 3, c); px(hx + 9, hy + 6, c); px(hx + 6, hy + 5, '#5a5a8a'); px(hx + 11, hy + 5, '#5a5a8a'); P(hx + 14, hy + 6, 2, 1, c); };
  const smoke = (cx, cy, t, n = 3) => { for (let i = 0; i < n; i++) { const k = (t * .7 + i / n) % 1; px(cx + Math.round(Math.sin(k * 6 + i * 2) * 2), cy - Math.round(k * 9), k < .5 ? '#6a6a7a' : '#9a9ab0'); } };

  // =============================== ГЕРОЇ ===============================
  const D = {};

  /** 1. БАБА ЯГА — згорблена, хустка з квітами й горошком, гачкуватий ніс з бородавкою, один зуб, сиві пасма, латана сукня,
   *  фартух, шаль з китицями, лапоть і КІСТЯНА НОГА; мітла (sweep — мете); летить у СТУПІ з товкачем (ride), мітла позаду. */
  D.babaYaga = (pose, fr, t, gs) => {
    const ride = pose === 'ride', sweep = pose === 'sweep', g = gait(ride ? 'stand' : pose, fr), B = g.bob, sw = sweep ? Math.sin(t * 9) * 3 : 0;
    const DR = '#5c3c2c', SC = '#b4202e', SHW = '#3a4a3c', HL = '#dcdad4';
    /** Голова з хусткою, носом і зубом (hx, hy — ліво-верх голови). tails — кінці хустки (-1 — летять назад). */
    const yagaHead = (hx, hy, tails = 0) => {
      head(hx, hy, OLD, { eyes: 'dot', brow: HL, browA: 1, mouth: 0, cheek: '#e0907a', noEar: 1 });
      P(hx + 12, hy + 13, 3, 2, OLD.M); px(hx + 14, hy + 14, OLD.D);                                                          // гостре підборіддя
      P(hx + 8, hy + 12, 4, 1, '#4a1a10'); px(hx + 9, hy + 12, '#fff6dc');                                                    // рот з одним зубом
      P(hx + 13, hy + 6, 3, 4, OLD.M); P(hx + 15, hy + 8, 2, 3, OLD.M); px(hx + 16, hy + 11, OLD.D); px(hx + 13, hy + 6, OLD.L); px(hx + 14, hy + 7, OLD.L);   // гачкуватий ніс
      px(hx + 15, hy + 9, '#a06a48'); px(hx + 3, hy + 11, '#a06a48');                                                         // бородавки
      const t2 = T(SC); spans(hx - 2, hy - 2, [[3, 11], [1, 14], [0, 16], [0, 16], [0, 15], [0, 14], [0, 6], [0, 5], [0, 5], [0, 5], [0, 5], [0, 5], [1, 4], [1, 4], [2, 3], [2, 3]], SC);   // хустка
      P(hx + 1, hy - 2, 9, 1, t2.L); P(hx - 1, hy - 1, 4, 1, t2.L); P(hx - 2, hy + 4, 1, 9, t2.D); P(hx + 12, hy + 2, 2, 2, t2.D);
      [[0, 0], [4, -1], [8, 0], [11, 1], [1, 4], [-1, 8], [2, 11], [6, 2]].forEach(([a, b]) => px(hx + a, hy + b, '#ffe0e6'));   // горошок
      [[3, 1], [9, -1]].forEach(([a, b]) => { px(hx + a, hy + b, '#ffd23a'); px(hx + a - 1, hy + b, '#ffffff'); px(hx + a + 1, hy + b, '#ffffff'); px(hx + a, hy + b - 1, '#ffffff'); px(hx + a, hy + b + 1, '#ffffff'); });   // квіточки
      P(hx + 4, hy + 4, 8, 1, HL); px(hx + 3, hy + 5, HL); px(hx + 12, hy + 4, HL); P(hx - 2, hy + 14, 2, 3, HL); px(hx - 1, hy + 17, HL);   // сиві пасма
      P(hx + 8, hy + 14, 5, 2, SC); px(hx + 10, hy + 14, t2.L);                                                             // вузол під підборіддям
      if (tails < 0) { rod(hx + 7, hy + 15, hx - 3, hy + 17, SC, 2); rod(hx + 6, hy + 16, hx - 2, hy + 21, SC, 2); }          // кінці летять назад
      else { rod(hx + 12, hy + 15, hx + 15, hy + 19, SC, 2); rod(hx + 10, hy + 16, hx + 11, hy + 21, SC, 2); }
    };
    if (ride) {                                                                                                               // ---- СТУПА ----
      rod(15, 42, 3, 49, '#8a5a2a', 2); for (let i = 0; i < 6; i++) rod(3, 49, -1 + i * .2, 46 + i * 1.6, i % 2 ? '#ecca62' : '#c8a040', 1);   // мітла позаду: замітає сліди
      blk(17, 26, 14, 12, DR, 2); spans(15, 27, [[2, 5], [1, 6], [0, 7], [0, 6]], SHW); for (let i = 0; i < 4; i++) px(16 + i * 3, 31, '#6a7a6a');   // тулуб і шаль
      arm([20, 29], [16, 34], DR, OLD);
      yagaHead(20, 12, -1);
      rod(29, 34, 41, 13, '#9a6a3a', 3); P(38, 9, 5, 6, '#a8763e'); P(38, 9, 5, 1, '#c8965a'); px(42, 14, '#6a4220');           // товкач (держить угору)
      arm([28, 29], [33, 28], DR, OLD);
      const Wd = T('#7a4a26');                                                                                                // ступа: клепки, обручі, ніжка
      for (let y = 34; y <= 55; y++) { const k = (y - 34) / 16, w = y <= 50 ? Math.round(25 - 9 * k) : Math.round(13 + (y - 50) * .6), x0 = Math.round(23.5 - w / 2);
        P(x0, y, w, 1, Wd.M); px(x0, y, Wd.L); px(x0 + 1, y, Wd.L); px(x0 + w - 1, y, Wd.D); px(x0 + w - 2, y, Wd.D);
        if (y <= 50) for (let i = 1; i < 6; i++) px(Math.round(x0 + w * i / 6), y, Wd.D); }
      P(11, 34, 25, 2, '#a8703c'); P(12, 34, 23, 1, '#c8925a');                                                               // вінця
      [39, 47].forEach(y => { const k = (y - 34) / 16, w = Math.round(25 - 9 * k), x0 = Math.round(23.5 - w / 2); P(x0, y, w, 2, '#8a8c98'); P(x0, y, w, 1, '#c4c6d0'); for (let i = 2; i < w; i += 5) px(x0 + i, y + 1, '#ffffff'); });   // обручі
      return;
    }
    // ---- ПІШКИ ----
    const hy0 = 37 + B, bx = 40 + sw;
    if (gs && gs.look === 'swim') {                                                                                           // образ: старомодний смугастий купальник, надувне коло-каченя, окуляри
      swimBody(g, B, OLD, '#2a3a8a', { one: 1, stripes: 1, ring: '#ffd23a' }); arm([20, 31 + B], [15, 40 + B], OLD.M, OLD); yagaHead(20, 16 + B); shades(20, 16 + B);
      P(10, 36 + B, 4, 3, '#ffd23a'); P(13, 36 + B, 2, 1, '#ff8a2a'); px(11, 36 + B, '#1a1030');                                 // голова каченяти на колі
      arm([28, 31 + B], [34, 26 + B], OLD.M, OLD); P(33, 20 + B, 4, 6, '#e0f4ff'); P(34, 22 + B, 2, 3, '#ff4fd8'); px(35, 19 + B, '#ff4fd8'); return; }   // коктейль у руці
    rod(32, 30 + B, bx, 51, '#8a5a2a', 2); besom(bx + 1, 50, GY, sw * .3);                                                     // мітла
    arm([20, 33 + B], [15, 38 + B], DR, OLD);                                                                               // задня рука — на попереку
    legs(g, '#4a3a3a', '#c8a050', { fx: 27, front: { bone: 1 }, back: {} }); P(19 + g.bl, 54 - g.bu, 4, 1, '#a88030'); px(20 + g.bl, 55 - g.bu, '#a88030');   // лапоть плетений; кістяна нога
    skirt(23, 33 + B, 50, 15, 20, DR, { folds: 5, hem: 1, hemC: '#3a2418', sway: g.sw });
    P(16, 42, 5, 5, '#4a5a8a'); P(16, 42, 5, 1, '#6a7aaa'); [[16, 44], [20, 44], [18, 42], [18, 46]].forEach(([a, b]) => px(a, b, '#d8d0b0'));   // латка з шовчиками
    P(26, 36 + B, 4, 3, '#4a7a4a'); px(26, 36 + B, '#6a9a6a');                                                              // ще латка
    spans(25, 38 + B, [[0, 7], [0, 7], [0, 8], [0, 8], [-1, 9], [-1, 9], [-1, 9], [-1, 10], [-1, 10], [-2, 11]], '#8a8474');   // фартух
    P(25, 38 + B, 7, 1, '#a8a292'); for (let i = 0; i < 6; i++) px(24 + i * 2, 47 + B, '#6a6454');
    blk(16, 29 + B, 14, 10, DR, 2); spans(14, 27 + B, [[3, 5], [2, 7], [1, 8], [1, 8], [2, 7]], DR);                       // тулуб і горб
    spans(14, 28 + B, [[3, 11], [1, 15], [0, 16], [0, 15], [1, 13]], SHW); P(15, 28 + B, 10, 1, '#5a6a5a');                 // шаль
    for (let i = 0; i < 6; i++) { px(15 + i * 3, 33 + B, '#6a7a6a'); px(15 + i * 3, 34 + B, '#2a342a'); }                   // китиці
    yagaHead(20, 16 + B);
    arm([28, 32 + B], [33, hy0], DR, OLD);                                                                                  // передня рука — на держаку
  };

  /** 2. БІЛОСНІЖКА — шкіра біла, як сніг, губи червоні, як кров, волосся чорне з синіми відблисками; золотий обруч з
   *  рубіном, високий білий комір, червона сукня з золотою шнурівкою й каймою, мереживний фартух, яблуко в руці. */
  D.snowWhite = (pose, fr, t, gs) => {
    const g = gait(pose, fr), B = g.bob, [bh, fh] = hands(pose, g, t, B), HA = '#16121e', HB = '#3e4c84', RED = '#b81e2e', swim = gs && gs.look === 'swim';
    spans(13, 18 + B, [[2, 6], [1, 8], [0, 9], [0, 9], [0, 9], [0, 9], [0, 9], [0, 9], [0, 9], [0, 9], [1, 8], [1, 8], [1, 8], [1, 8], [2, 7], [2, 7], [2, 6], [3, 5], [3, 5], [4, 3]], HA);   // довге волосся позаду
    P(15, 20 + B, 1, 14, HB); P(17, 22 + B, 1, 10, '#2a3460');
    if (swim) {                                                                                                              // образ: червоний суцільний купальник у білий горошок, босоніж, червона квітка у волоссі
      swimBody(g, B, PALE, RED, { one: 1, dots: 1 }); arm([20, 31 + B], bh, PALE.M, PALE); const hx = 17, hy = 13 + B;
      head(hx, hy, PALE, { lash: 1, brow: HA, lip: '#e0203a', mouth: 'smile', iris: '#4a3a8a', cheek: '#ffa0b6', noEar: 1 });
      spans(hx - 1, hy - 2, [[3, 11], [1, 15], [0, 17], [0, 17], [0, 16], [0, 8], [0, 6], [0, 5], [0, 5], [0, 5], [0, 4], [0, 4], [0, 4], [0, 4], [1, 3]], HA);
      [[6, 3], [8, 4], [10, 3], [12, 4], [14, 3]].forEach(([a, h]) => P(hx + a, hy + 3, 2, h, HA)); P(hx + 2, hy - 1, 8, 1, HB);
      disc(hx + 2, hy + 1, 2, '#e0203a'); px(hx + 2, hy + 1, '#ffe27a'); px(hx + 1, hy, '#ff8a9a');                           // квітка
      arm([29, 31 + B], fh, PALE.M, PALE); return; }
    arm([20, 31 + B], bh, RED, PALE, { cuff: '#ffffff' });
    legs(g, '#f6f2f4', '#a0182a');
    skirt(24, 38 + B, 54, 14, 23, RED, { folds: 5, hem: 2, hemC: '#e0b040', sway: g.sw });
    spans(24, 39 + B, [[0, 7], [0, 7], [-1, 9], [-1, 9], [-1, 9], [-1, 10], [-2, 11], [-2, 11], [-2, 11], [-2, 12], [-2, 12], [-3, 13]], '#fff8f4');   // фартух
    P(24, 39 + B, 7, 1, '#ffffff'); for (let i = 0; i < 7; i++) px(22 + i * 2, 51 + B, '#d8d0e0');                           // мереживо
    blk(18, 29 + B, 13, 10, RED, 2);                                                                                       // ліф
    for (let y = 31; y < 38; y += 2) { px(26, y + B, '#e8c060'); px(28, y + B, '#e8c060'); px(27, y + 1 + B, '#ffe090'); }   // шнурівка
    P(19, 27 + B, 11, 3, '#ffffff'); P(19, 29 + B, 11, 1, '#d8d4e4'); px(19, 27 + B, '#e8e4f0');                            // високий комір
    const hx = 17, hy = 13 + B;
    head(hx, hy, PALE, { lash: 1, brow: HA, lip: '#e0203a', mouth: 'smile', iris: '#4a3a8a', cheek: '#ffa0b6', noEar: 1 });
    spans(hx - 1, hy - 2, [[3, 11], [1, 15], [0, 17], [0, 17], [0, 16], [0, 8], [0, 6], [0, 5], [0, 5], [0, 5], [0, 4], [0, 4], [0, 4], [0, 4], [1, 3]], HA);   // волосся: маківка, бік
    [[6, 3], [8, 4], [10, 3], [12, 4], [14, 3]].forEach(([a, h]) => P(hx + a, hy + 3, 2, h, HA));                           // чубчик пасмами
    P(hx + 2, hy - 1, 8, 1, HB); P(hx, hy, 3, 1, HB); px(hx + 11, hy, HB);                                                 // відблиск на волоссі
    P(hx + 1, hy + 2, 13, 1, '#e8c060'); P(hx + 1, hy + 2, 13, 1, '#e8c060'); px(hx + 3, hy + 2, '#fff0a0'); P(hx + 10, hy + 1, 2, 2, '#e0203a'); px(hx + 10, hy + 1, '#ff9aa8');   // обруч з рубіном
    arm([29, 31 + B], fh, RED, PALE, { cuff: '#ffffff' });
    if (pose !== 'search') { const [ax, ay] = pose === 'cheer' ? fh : [fh[0] + 1, fh[1] - 1];                                // яблуко
      disc(ax + 1, ay - 2, 2, '#d81e2e'); px(ax, ay - 3, '#ff8a9a'); px(ax + 2, ay, '#8a101a'); px(ax + 1, ay - 5, '#5a3a1a'); P(ax + 2, ay - 6, 2, 1, '#4aa83a'); }
  };

  /** Гном — малий: червоний ковпак із загнутим кінчиком і дзвіночком, велика біла борода, рум'яний ніс-картоплинка, кирка. */
  D.dwarf = (pose, fr, t) => {
    const g = gait(pose, fr), B = g.bob, cheer = pose === 'cheer', b = Math.round(Math.sin(t * 2)), BE = '#f4f0e6', BD = '#cfc6b8';
    const bh = cheer ? [14, 30 + b] : [17 + g.sw * 2, 48 + B], fh = cheer ? [35, 28 - b] : [32 - g.sw * 2, 46 + B];
    arm([19, 40 + B], bh, '#6e4c2c', SK);
    legs(g, '#4a3a2a', '#2e2014', { hip: 50, bx: 20, fx: 27 });
    blk(16, 38 + B, 16, 13, '#6e4c2c', 3); P(16, 47 + B, 16, 2, '#2a1a10'); P(23, 47 + B, 3, 2, '#e8c060'); px(23, 47 + B, '#fff0a0');   // каптан, пояс з пряжкою
    const hx = 16, hy = 23 + B;
    head(hx, hy, SK, { eyes: 'dot', brow: BE, mouth: 0, noNose: 1, cheek: '#ff8f9f' });
    spans(hx + 1, hy + 10, [[1, 13], [0, 15], [0, 15], [1, 14], [1, 13], [2, 12], [2, 11], [3, 10], [3, 9], [4, 8], [5, 6], [6, 4], [7, 2]], BE);   // борода
    [[3, 12], [6, 14], [9, 13], [12, 15], [5, 18], [8, 19], [11, 17]].forEach(([a, c]) => px(hx + a, hy + c, BD)); P(hx + 2, hy + 12, 2, 1, '#ffffff');
    P(hx + 7, hy + 10, 6, 2, BE); px(hx + 6, hy + 11, BD);                                                                  // вуса
    disc(hx + 12, hy + 9, 2, '#f0968a'); px(hx + 11, hy + 8, '#ffc8c0');                                                     // ніс-картоплинка
    const RD = '#c41e2c', R3 = T(RD);                                                                                       // ковпак
    for (let i = 0; i < 18; i++) { const k = i / 18, w = Math.round(17 * (1 - k)) + 1, x0 = Math.round(hx - 1 + 8.5 * k - 6 * k * k * k); P(x0, hy + 3 - i, w, 1, RD); px(x0, hy + 3 - i, R3.L); px(x0 + w - 1, hy + 3 - i, R3.D); }
    P(hx - 1, hy + 2, 17, 2, '#e8e0d0'); P(hx - 1, hy + 2, 17, 1, '#ffffff');                                               // хутряна облямівка
    disc(hx + 1, hy - 15, 1, '#ffd23a'); px(hx + 1, hy - 16, '#fff6b0');                                                     // дзвіночок
    arm([29, 40 + B], fh, '#6e4c2c', SK);
    if (cheer) { rod(fh[0], fh[1] + 3, fh[0] + 2, fh[1] - 12, '#8a6234', 2); const kx = fh[0] + 2, ky = fh[1] - 12;   // кирка вгору
      P(kx - 5, ky - 1, 11, 2, '#9aa2b4'); P(kx - 5, ky - 1, 11, 1, '#d4dae6'); px(kx - 6, ky, '#9aa2b4'); px(kx + 6, ky, '#9aa2b4'); px(kx - 7, ky + 1, '#7a8296'); px(kx + 7, ky + 1, '#7a8296'); }
    else { const lx = fh[0] + 1, ly = fh[1] + 2, fl = Math.floor(t * 7) % 2;                                             // ліхтарик гірника
      line(lx, fh[1], lx, ly, '#5a4a3a'); P(lx - 2, ly, 5, 1, '#a8802a'); P(lx - 2, ly + 1, 5, 5, '#e8b830'); P(lx - 1, ly + 2, 3, 3, fl ? '#fff6b0' : '#ffd86a'); px(lx, ly + 3, '#ffffff'); P(lx - 2, ly + 6, 5, 1, '#a8802a'); }
  };

  /** БАРМЕН (вечірка, party.js; 06.11) — свій образ: кремезний, лисий, з закрученими вусами, біла сорочка з закоченими рукавами,
   *  чорний жилет, червоний метелик, рушник на плечі; shake — трусить шейкер над головою, pour — наливає з пляшки в келих,
   *  wipe — протирає келих рушником (стоячи за стійкою; ноги ховає стійка). */
  D.bartender = (pose, fr, t) => {
    const g = gait(pose, fr), B = g.bob, sh = pose === 'shake', po = pose === 'pour', wp = pose === 'wipe', WH = '#f4f2f8', VS = '#1e1830', V3 = T(VS), b2 = Math.round(Math.sin(t * 9) * 2);
    legs(g, '#14101e', '#0a0812', { hip: 44 });
    blk(17, 28 + B, 14, 16, WH, 2); P(17, 36 + B, 14, 8, '#dcdce6');                                                    // сорочка
    P(17, 29 + B, 4, 15, VS); P(27, 29 + B, 4, 15, VS); P(17, 29 + B, 1, 15, V3.L); P(30, 29 + B, 1, 15, V3.D); px(22, 36 + B, '#e8c060'); px(22, 40 + B, '#e8c060');   // жилет, ґудзики
    P(21, 28 + B, 6, 2, '#c81e3c'); px(23, 28 + B, '#ffffff'); px(23, 29 + B, '#7a1020');                                   // метелик
    P(28, 27 + B, 4, 7, '#f0ece0'); P(29, 29 + B, 2, 1, '#c8c0a0'); P(29, 32 + B, 2, 1, '#c8c0a0');                        // рушник на плечі
    const bh = sh ? [15, 20 + b2] : po ? [19, 38 + B] : [17, 42 + B], fh = sh ? [33, 16 - b2] : po ? [35, 30 + B] : wp ? [34, 36 + B] : [31, 42 + B];
    arm([20, 31 + B], bh, WH, SK, { cuff: '#dcdce6' });
    const hx = 16, hy = 14 + B; head(hx, hy, SK, { brow: '#3a2410', eyes: Math.floor(t * 1.3) % 7 === 0 ? 'shut' : undefined, mouth: 'smile', noCheek: 1 });
    P(hx, hy + 3, 2, 6, '#3a2410'); P(hx + 1, hy + 2, 1, 1, '#3a2410'); P(hx + 4, hy, 9, 1, SK.L);                           // лисина з бліком, волосся за вухами
    P(hx + 7, hy + 11, 8, 2, '#3a2410'); px(hx + 6, hy + 11, '#3a2410'); px(hx + 15, hy + 10, '#3a2410'); px(hx + 5, hy + 10, '#3a2410');   // закручені вуса
    arm([29, 31 + B], fh, WH, SK, { cuff: '#dcdce6' });
    if (sh) { const sx = fh[0] - 1, sy = fh[1] - 12; P(sx - 2, sy, 7, 11, '#b8c0d0'); P(sx - 2, sy, 1, 11, '#e8ecf4'); P(sx + 4, sy, 1, 11, '#7a8296'); P(sx - 1, sy - 3, 5, 3, '#9aa2b4'); P(sx - 1, sy - 3, 5, 1, '#d4dae6');   // шейкер
      star(sx + 8, sy - 2 + b2, '#ffffff', 0); star(sx - 5, sy + 4 - b2, '#9af6ff', 0); }
    if (po) { const bx = fh[0] + 1, by = fh[1] - 6; rod(bx, by, bx + 8, by - 8, '#2ab8e0', 4); rod(bx + 8, by - 8, bx + 11, by - 11, '#2ab8e0', 2); px(bx + 1, by - 2, '#9af6ff');   // пляшка нахилена, струмінь, келих
      for (let i = 0; i < 4; i++) px(bx + 12, by - 10 + i * 2 + Math.floor(t * 6) % 2, '#ffe27a'); P(bx + 10, by - 2, 5, 6, '#e0f4ff'); P(bx + 11, by + 1, 3, 3, '#ffd27a'); P(bx + 12, by + 4, 1, 3, '#c8d8e0'); P(bx + 10, by + 7, 5, 1, '#c8d8e0'); }
    if (wp) { const gx = fh[0] + 2, gy = fh[1] - 7 + Math.round(Math.sin(t * 7)); P(gx, gy, 5, 6, '#e0f4ff'); px(gx + 1, gy + 1, '#ffffff'); P(gx + 2, gy + 6, 1, 3, '#c8d8e0'); P(gx, gy + 9, 5, 1, '#c8d8e0'); P(gx - 3 + Math.round(Math.sin(t * 7) * 2), gy - 2, 4, 3, '#f0ece0'); }
  };

  /** 4. ЧЕРВОНА ШАПОЧКА — червона накидка з каптуром (світла підкладка, золота застібка), каштанова коса, біла сорочка,
   *  темний ліф зі шнурівкою, синя спідниця з білим фартухом; плетений кошик з картатою серветкою й пиріжками. */
  D.redHood = (pose, fr, t) => {
    const g = gait(pose, fr), B = g.bob, [bh, fh] = hands(pose, g, t, B), RD = '#d0222e', R3 = T(RD), HAIR = '#7a4426';
    spans(13, 27 + B, [[3, 9], [2, 11], [1, 12], [1, 12], [0, 13], [0, 13], [0, 13], [0, 13], [-1, 14], [-1, 14], [-1, 14], [-1, 14], [-2, 15], [-2, 15], [-2, 15], [-2, 14], [-1, 12]], RD);   // накидка позаду
    for (let y = 30; y < 44; y += 3) px(14, y + B, R3.D); P(11, 40 + B, 2, 4, R3.D);
    arm([20, 31 + B], bh, '#f4f0f8', SK);
    legs(g, '#f0ece8', '#5a2a1a');
    skirt(24, 38 + B, 53, 14, 21, '#2c5c9c', { folds: 4, hem: 1, sway: g.sw });
    spans(24, 39 + B, [[0, 6], [0, 6], [-1, 8], [-1, 8], [-1, 8], [-1, 9], [-2, 10], [-2, 10], [-2, 10], [-2, 11]], '#fbf8f4'); for (let i = 0; i < 6; i++) px(22 + i * 2, 49 + B, '#d8d4e4');   // фартух
    blk(18, 30 + B, 13, 9, '#2a2a5a', 2); for (let y = 32; y < 38; y += 2) { px(26, y + B, '#f4f0f8'); px(28, y + B, '#f4f0f8'); }   // ліф, шнурівка
    P(19, 29 + B, 11, 2, '#f4f0f8');                                                                                        // сорочка біля шиї
    const hx = 17, hy = 13 + B;
    spans(hx - 3, hy - 3, [[4, 12], [2, 16], [1, 18], [0, 19], [0, 19], [0, 6], [0, 5], [0, 5], [0, 5], [0, 4], [0, 4], [0, 4], [0, 4], [0, 5], [0, 6], [1, 6], [2, 5]], RD);   // каптур
    P(hx - 1, hy - 2, 12, 1, R3.L); P(hx - 3, hy + 2, 1, 12, R3.D);
    head(hx, hy, SK, { lash: 1, brow: HAIR, mouth: 'smile', iris: '#3a6a3a', cheek: '#ff8ea4', noEar: 1 });
    spans(hx + 1, hy, [[1, 12], [0, 15], [0, 15], [0, 5]], '#e84a54'); P(hx + 2, hy, 10, 1, '#f27a80');                     // підкладка каптура
    P(hx + 4, hy + 3, 10, 1, HAIR); [[5, 2], [8, 2], [11, 2], [13, 1]].forEach(([a, h]) => P(hx + a, hy + 4, 2, h, HAIR));   // чубчик
    for (let i = 0; i < 4; i++) { P(hx + 13, hy + 12 + i * 2, 2, 2, i % 2 ? '#8e5432' : HAIR); } P(hx + 13, hy + 20, 2, 1, '#d0222e');   // коса з червоною стрічкою
    P(25, 28 + B, 3, 2, '#e8c060'); px(25, 28 + B, '#fff0a0');                                                              // застібка
    arm([29, 31 + B], fh, '#f4f0f8', SK);
    const [kx, ky] = pose === 'give' ? [fh[0] + 1, fh[1] + 1] : [fh[0] + 2, fh[1] + 1], WK = '#b8844a';                   // кошик
    rod(kx - 4, ky - 1, kx - 1, ky - 6, '#8a5a2a', 1); rod(kx - 1, ky - 6, kx + 3, ky - 1, '#8a5a2a', 1);
    P(kx - 4, ky - 1, 9, 6, WK); for (let i = 0; i < 9; i++) for (let j = 0; j < 6; j++) if ((i + j) % 2) px(kx - 4 + i, ky - 1 + j, '#d8a466'); P(kx - 4, ky + 4, 9, 1, '#8a5a2a');
    for (let i = 0; i < 7; i++) px(kx - 3 + i, ky - 2, i % 2 ? '#ffffff' : '#e0303a'); P(kx - 2, ky - 3, 3, 1, '#e8a050'); px(kx - 1, ky - 3, '#ffd08a');   // серветка, пиріжок
  };

  /** 5. БІЛИЙ КРОЛИК — біле хутро з сірою тінню, довгі вуха з рожевим, червоні очі, вуса; синій фрак з фалдами, картата
   *  червона камізелька, метелик; золотий кишеньковий годинник на ланцюжку (watch — дивиться, run — вуха назад). */
  D.whiteRabbit = (pose, fr, t) => {
    const g = gait(pose, fr), B = g.bob, run = pose === 'run', watch = pose === 'watch', FW = { M: '#f6f4fb', L: '#ffffff', D: '#cfcade' };
    const [bh, fh] = watch ? [[18, 41 + B], [33, 25]] : hands(pose, g, t, B);
    spans(14, 31 + B, [[3, 6], [2, 6], [1, 6], [0, 6], [0, 5], [0, 5], [0, 4], [1, 3], [2, 2], [3, 1]], '#24427e');           // фалди фрака позаду
    arm([20, 31 + B], bh, '#2c4c8c', FW);
    legs(g, FW.M, '#f0eef6', { fx: 27 }); P(19 + g.bl, 56 - g.bu, 6, 1, '#ffd0dc'); P(25 + g.fl, 56 - g.fu, 6, 1, '#ffd0dc');   // довгі лапи
    blk(17, 29 + B, 14, 16, '#2c4c8c', 2);                                                                                 // фрак
    P(22, 30 + B, 7, 12, '#c8402e'); for (let y = 31; y < 42; y += 3) P(22, y + B, 7, 1, '#9a2a1e'); for (let x2 = 23; x2 < 29; x2 += 3) P(x2, 30 + B, 1, 12, '#e0603e');   // картата камізелька
    [33, 36, 39].forEach(y => px(27, y + B, '#ffd27a')); P(22, 29 + B, 6, 2, '#ffffff'); P(24, 30 + B, 3, 2, '#d0222e');     // ґудзики, комір, метелик
    const hx = 16, hy = 14 + B, e = run ? 5 : 0;                                                                            // голова кролика
    rod(hx + 4, hy + 1, hx + 2 - e, hy - 13 + e, FW.D, 3); rod(hx + 9, hy + 1, hx + 9 - e * 1.4, hy - 14 + e, FW.M, 4); P(hx + 9 - e, hy - 11 + e, 2, 9, '#ffb4c8');   // вуха
    head(hx, hy, FW, { iris: '#ff2a3a', eye: '#a0101e', mouth: 0, noCheek: 1, noNose: 1, noEar: 1, brow: watch || run ? FW.D : 0, browA: -1, eyes: run ? 'wide' : undefined });
    P(hx + 11, hy + 9, 5, 4, FW.M); px(hx + 15, hy + 9, '#ff9fb6'); px(hx + 16, hy + 10, '#ff9fb6'); P(hx + 12, hy + 12, 3, 1, FW.D);   // мордочка, носик
    if (watch || run) P(hx + 12, hy + 12, 2, 2, '#7a2a3a');                                                                 // «запізнююсь!»
    line(hx + 15, hy + 11, hx + 19, hy + 10, '#c8c4d8'); line(hx + 15, hy + 12, hx + 19, hy + 13, '#c8c4d8');               // вуса
    arm([29, 31 + B], fh, '#2c4c8c', FW);
    const wx = fh[0] + 1, wy = fh[1] - 3; disc(wx, wy, 2, '#e8b830'); P(wx - 1, wy - 1, 3, 3, '#fff8e8'); px(wx, wy, '#2a1a10'); px(wx + 1, wy - 1, '#2a1a10'); px(wx, wy - 3, '#e8b830');   // годинник
    line(wx - 2, wy + 1, 24, 36 + B, '#ffd27a');                                                                            // ланцюжок
  };

  /** 7. ПІНОККІО — дерев'яний хлопчик (волокна, шпильки в суглобах, намальовані щічки), високий червоний паперовий ковпак,
   *  зелена курточка в квіточки з білим коміром, короткі штанці, червоні черевики. Ніс росте (g.nose) — на довгому листочок. */
  D.pinocchio = (pose, fr, t, gs) => {
    const g = gait(pose, fr), B = g.bob, [bh, fh] = hands(pose, g, t, B), n = Math.round(4 + (gs && gs.nose || 0)), GR = '#3a8c3c';
    arm([20, 31 + B], bh, GR, WOOD, { cuff: '#ffffff' });
    legs(g, WOOD.M, '#c8202e', { w: 2 }); [21 + g.bl, 27 + g.fl].forEach(lx => px(lx, 49 + B, '#7a4a1a'));                 // дерев'яні ніжки зі шпильками
    blk(19, 41 + B, 12, 5, '#8a5a2a', 1);                                                                                  // штанці
    blk(18, 29 + B, 13, 13, GR, 2); [[20, 32], [24, 35], [21, 38], [27, 31], [26, 38], [28, 35]].forEach(([a, b]) => { px(a, b + B, '#ffffff'); px(a + 1, b + B, '#ffd23a'); });   // курточка в квіточки
    P(20, 28 + B, 10, 3, '#ffffff'); P(20, 30 + B, 10, 1, '#d8d4e4'); P(24, 30 + B, 3, 2, '#d0222e');                        // комір, бантик
    const hx = 17, hy = 13 + B;
    head(hx, hy, WOOD, { mouth: 'smile', brow: '#5a3a1a', iris: '#3a2a1a', noCheek: 1, lip: '#8a3a1a' });
    P(hx + 4, hy + 10, 2, 2, '#e86a5a'); P(hx + 12, hy + 10, 2, 2, '#e86a5a');                                               // намальовані щічки
    [[3, 4], [2, 9], [5, 13]].forEach(([a, b]) => P(hx + a, hy + b, 2, 1, '#c8924e'));                                       // волокна дерева
    P(hx + 14, hy + 8, n, 2, WOOD.M); P(hx + 14, hy + 8, n, 1, WOOD.L); px(hx + 13 + n, hy + 9, WOOD.D);                     // ніс
    if (n > 9) { P(hx + 12 + n - 3, hy + 5, 2, 2, '#4aa83a'); px(hx + 12 + n - 2, hy + 7, '#2a7a2a'); px(hx + 12 + n - 4, hy + 5, '#8ae06a'); }   // листочок на носі
    P(hx + 2, hy + 1, 4, 2, '#4a2a14'); px(hx + 1, hy + 3, '#4a2a14'); px(hx + 12, hy + 2, '#4a2a14');                       // чубчик
    const R3 = T('#d02a3a');                                                                                                // ковпак
    for (let i = 0; i < 16; i++) { const k = i / 16, w = Math.round(14 * (1 - k)) + 1, x0 = Math.round(hx + 1 + 6.5 * k + 2 * k * k); P(x0, hy + 2 - i, w, 1, '#d02a3a'); px(x0, hy + 2 - i, R3.L); px(x0 + w - 1, hy + 2 - i, R3.D); if (i % 5 === 2) P(x0 + 1, hy + 2 - i, w - 2, 1, R3.D); }
    arm([29, 31 + B], fh, GR, WOOD, { cuff: '#ffffff' }); px(fh[0] - 1, fh[1] - 5, '#7a4a1a');
  };

  /** 8. КІТ У ЧОБОТЯХ — сірий кіт (білі мордочка й груди, зелені очі зі щілинками, вуса): капелюх зі страусовим пером,
   *  синій плащ, шкіряний камзол із поясом, рапіра, великі чоботи з відворотами, смугастий хвіст; bow — уклін з капелюхом. */
  D.pussBoots = (pose, fr, t) => {
    const g = gait(pose, fr), B = g.bob, bow = pose === 'bow', [bh, fh] = hands(pose, g, t, B), F = { M: '#9c9cb0', L: '#c8c8d8', D: '#6c6c86' }, WH = '#f4f2f8';
    const tw = Math.round(Math.sin(t * 3) * 1.5), TP = [[18, 43], [13, 46], [9, 45], [7, 41], [7 + tw, 37], [9 + tw, 34]];   // хвіст: товстий біля тіла, тоншає, загнутий угору
    TP.slice(1).forEach(([a, c], i) => { const [a0, c0] = TP[i]; rod(a0, c0 + B, a, c + B, i % 2 ? F.D : F.M, i < 2 ? 4 : i < 4 ? 3 : 2); });
    [[15, 45], [10, 45], [7, 40]].forEach(([a, c]) => P(a, c + B, 2, 2, F.D)); px(9 + tw, 33 + B, F.L);
    spans(13, 28 + B, [[3, 9], [2, 10], [1, 11], [0, 12], [0, 12], [-1, 13], [-1, 13], [-1, 13], [-2, 14], [-2, 14], [-2, 13], [-1, 11], [0, 9], [1, 7]], '#2a4aa0');   // плащ
    P(12, 33 + B, 1, 8, '#4a6ac8');
    arm([20, 31 + B], bh, '#2a4aa0', F);
    const boot = (cx, yb, back) => { const bc = back ? '#64381a' : '#7a4a24', b3 = T(bc);                                   // ВЕЛИКІ чоботи з відворотами
      P(cx - 2, yb - 9, 5, 8, bc); P(cx - 2, yb - 9, 1, 8, b3.L); P(cx + 2, yb - 9, 1, 8, b3.D); P(cx - 2, yb - 2, 7, 3, bc); P(cx - 2, yb - 2, 5, 1, b3.L); P(cx - 2, yb, 7, 1, b3.K);
      P(cx - 3, yb - 12, 7, 3, back ? '#8e5a2a' : '#a8703a'); P(cx - 3, yb - 12, 7, 1, back ? '#a8703a' : '#c8905a'); px(cx + 3, yb - 10, b3.D); };
    rod(21 + g.bl, 43 + g.bob, 21 + g.bl, 46 + g.bob, S(F.M, -.12), 3); rod(27 + g.fl, 43 + g.bob, 27 + g.fl, 46 + g.bob, F.M, 3);
    boot(21 + g.bl, GY - g.bu, 1); boot(27 + g.fl, GY - g.fu, 0);
    blk(18, 30 + B, 12, 14, '#8a5a2e', 2); P(22, 31 + B, 4, 10, WH); P(18, 40 + B, 12, 2, '#3a2414'); P(23, 40 + B, 3, 2, '#e8c060');   // камзол, груди, пояс
    line(16, 42 + B, 6, 53 + B, '#eef2fa'); line(17, 42 + B, 7, 53 + B, '#9aa2b4'); disc(17, 41 + B, 1, '#e8c060'); px(16, 40 + B, '#fff0a0'); P(18, 40 + B, 2, 1, '#5a3a1a');   // рапіра з гардою
    const hx = 16, hy = (bow ? 17 : 14) + B, H3 = T('#6a1e4c');
    head(hx, hy, F, { iris: '#3ac060', eye: '#14301a', mouth: 0, noCheek: 1, noNose: 1, noEar: 1 });
    [hx + 6, hx + 11].forEach(e => P(e + 1, hy + 6, 1, 3, '#0a1a0a'));                                                     // щілинки зіниць
    spans(hx + 1, hy - 3, [[1, 2], [0, 4], [0, 4]], F.M); spans(hx + 10, hy - 3, [[1, 2], [0, 4], [0, 4]], F.M); px(hx + 2, hy - 1, '#ffb4c8'); px(hx + 11, hy - 1, '#ffb4c8');   // вушка
    P(hx + 9, hy + 9, 6, 5, WH); P(hx + 12, hy + 9, 2, 1, '#ff9fb6'); px(hx + 12, hy + 11, '#8a6a7a'); px(hx + 11, hy + 12, '#8a6a7a'); px(hx + 13, hy + 12, '#8a6a7a');   // мордочка «w»
    line(hx + 15, hy + 10, hx + 20, hy + 9, '#ffffff'); line(hx + 15, hy + 12, hx + 20, hy + 13, '#ffffff');                  // вуса
    if (bow) { arm([29, 31 + B], fh, '#2a4aa0', F); P(fh[0] - 4, fh[1] - 2, 11, 3, '#6a1e4c'); P(fh[0] - 2, fh[1] - 5, 7, 3, H3.L); rod(fh[0] + 6, fh[1] - 4, fh[0] + 12, fh[1] - 12, '#ffffff', 2); }   // капелюх у руці
    else {
      P(hx - 3, hy - 1, 21, 2, '#6a1e4c'); P(hx - 3, hy - 1, 21, 1, H3.L); blk(hx + 1, hy - 6, 13, 6, '#6a1e4c', 2); P(hx + 1, hy - 2, 13, 1, '#e8c060');   // капелюх
      for (let i = 0; i < 12; i++) { const k = i / 11, fx = hx + 3 - i * 1.05, fy = hy - 5 - Math.sin(k * Math.PI) * 5 + k * 5, w = 3 - k * 1.6;   // пишне перо: вигин назад-униз, пушинки
        P(fx, fy - w / 2, 2, w + 1, '#ffffff'); px(fx, fy + w / 2 + 1, '#cfcade'); if (i % 3 === 1) px(fx - 1, fy - w / 2 - 1, '#ffffff'); if (i % 4 === 2) px(fx + 1, fy + w / 2 + 2, '#e0dcea'); }
      px(hx + 3, hy - 4, '#d8d4e4');
      arm([29, 31 + B], fh, '#2a4aa0', F);
    }
  };

  /** 9. ДОН КІХОТ — худий лицар: мідний тазик-шолом, довге обличчя, сива клиновидна борідка й вуса, сталевий панцир з
   *  заклепками, наплічник, руда накидка, круглий щит; спис (charge — навперейми); fall — лежить, довкола голови зірочки. */
  D.quixote = (pose, fr, t) => {
    const BR = '#e0b84e', BR3 = T(BR), ST = '#b4bacc', GRB = '#e2e2e6';
    if (pose === 'fall') {
      rod(4, 52, 14, 52, '#6a4a2a', 3); P(2, 50, 4, 4, '#3a2a1a');                                                       // ноги
      blk(13, 47, 17, 8, ST, 2); P(17, 48, 2, 6, '#e8ecf6');                                                                 // панцир
      disc(34, 50, 5, '#ecc8a8'); P(31, 52, 6, 4, GRB); P(30, 46, 3, 2, GRB);                                               // голова, борода
      [[32, 47], [36, 47]].forEach(([a, b]) => { px(a, b, EYE); px(a + 2, b, EYE); px(a + 1, b + 1, EYE); px(a, b + 2, EYE); px(a + 2, b + 2, EYE); });   // очі хрестиками
      disc(42, 54, 4, BR); P(39, 54, 8, 1, BR3.D);                                                                           // тазик відкотився
      rod(0, 44, 46, 41, '#8a5a2a', 2); P(45, 40, 3, 3, '#dce0ec');                                                         // спис
      for (let i = 0; i < 3; i++) { const a = t * 4 + i * 2.1; star(Math.round(34 + Math.cos(a) * 7), Math.round(42 + Math.sin(a) * 2.5), '#ffe27a'); }   // зірочки
      return;
    }
    const ch = pose === 'charge', g = gait(ch ? 'run' : pose, fr), B = g.bob, [bh, fh] = ch ? [[17, 38 + B], [35, 36 + B]] : hands(pose, g, t, B);
    spans(13, 29 + B, [[3, 6], [2, 7], [1, 7], [1, 7], [0, 7], [0, 7], [0, 7], [-1, 7], [-1, 7], [-1, 6], [-1, 5], [0, 4], [0, 3]], '#9a2a3a');   // накидка
    disc(16, 38 + B, 4, BR); disc(16, 38 + B, 2, BR3.D); px(15, 37 + B, '#fff0a0');                                        // круглий щит
    arm([20, 31 + B], bh, ST, TAN);
    legs(g, '#7a5a3a', '#3a2a1a', { w: 2 });
    blk(18, 29 + B, 12, 15, ST, 2); P(20, 31 + B, 2, 9, '#e8ecf6'); [[19, 31], [28, 31], [19, 41], [28, 41]].forEach(([a, b]) => px(a, b + B, '#6a7086'));   // панцир, заклепки
    P(24, 34 + B, 3, 2, '#8a8ea4'); P(18, 42 + B, 12, 2, '#7a2a2a');                                                       // вм'ятина, пояс
    const hx = 17, hy = 12 + B;
    head(hx, hy, TAN, { eyes: 'dot', brow: GRB, browA: 1, mouth: 0, noCheek: 1 });
    P(hx + 1, hy + 9, 3, 3, TAN.D);                                                                                        // запала щока
    spans(hx + 7, hy + 12, [[0, 7], [1, 6], [2, 5], [3, 3], [4, 2], [4, 1]], GRB); P(hx + 8, hy + 10, 7, 2, GRB); px(hx + 15, hy + 9, GRB); px(hx + 7, hy + 9, GRB);   // борідка, вуса
    px(hx + 15, hy + 7, TAN.M); px(hx + 15, hy + 8, TAN.D);                                                                // ніс
    spans(hx - 2, hy - 4, [[5, 9], [3, 13], [2, 15], [1, 17], [-1, 21]], BR); P(hx + 2, hy - 4, 7, 1, BR3.L); P(hx + 1, hy - 2, 4, 1, '#fff0a0'); P(hx - 3, hy, 21, 1, BR3.D);   // тазик-шолом
    P(hx + 13, hy - 1, 3, 2, BR3.D);                                                                                       // виріз тазика
    blk(27, 28 + B, 6, 5, ST, 2);                                                                                          // наплічник
    arm([29, 31 + B], fh, ST, TAN);
    if (ch) { rod(8, 41 + B, 46, 33 + B, '#8a5a2a', 2); P(44, 31 + B, 4, 3, '#dce0ec'); px(47, 32 + B, '#ffffff'); }        // спис навперейми
    else { rod(fh[0] + 1, fh[1] + 8, fh[0] + 3, 2, '#8a5a2a', 2); P(fh[0] + 2, 0, 3, 4, '#dce0ec'); px(fh[0] + 3, 0, '#ffffff'); }
  };

  /** 10. ШЕРЛОК ХОЛМС — кепі мисливця з навушниками, плащ-інвернес у клітинку з пелериною, гострий ніс, вигнута люлька з
   *  димком, лупа в латунній оправі (inspect — схилився до підлоги). */
  D.sherlock = (pose, fr, t) => {
    const ins = pose === 'inspect', g = gait(pose, fr), B = g.bob, [bh, fh] = ins ? [[18, 40 + B], [37, 45 + B]] : hands(pose, g, t, B), CK = '#9c7c56', CK3 = T(CK);
    const C1 = S(CK, -.13), C2 = S(CK, .1), chk = (a, b, w, h) => { for (let i = 0; i < w; i++) for (let j = 0; j < h; j++) { const u = (i + j) % 4, v = (i - j + 40) % 4; if (u === 0) px(a + i, b + j, C1); else if (v === 0) px(a + i, b + j, C2); } };
    arm([20, 31 + B], bh, CK, SK);
    legs(g, '#3c3c48', '#1c1c24');
    blk(17, 29 + B, 14, 22, CK, 2); chk(18, 31 + B, 12, 19); P(24, 30 + B, 1, 20, CK3.D);                                   // довгий плащ
    P(17, 35 + B, 14, 1, CK3.K);                                                                                           // тінь під пелериною
    spans(14, 28 + B, [[4, 14], [2, 18], [1, 19], [0, 20], [0, 20], [1, 18], [2, 16]], CK); chk(15, 29 + B, 18, 5); P(16, 28 + B, 12, 1, CK3.L); P(15, 34 + B, 18, 1, CK3.D);   // пелерина
    const hx = ins ? 20 : 17, hy = (ins ? 16 : 12) + B;
    head(hx, hy, SK, { eyes: 'dot', brow: '#3a2a1a', browA: 1, mouth: 'flat', noCheek: 1 });
    P(hx + 14, hy + 7, 2, 3, SK.M); px(hx + 15, hy + 9, SK.D);                                                             // орлиний ніс
    spans(hx - 2, hy - 3, [[4, 11], [2, 15], [1, 17], [0, 19], [0, 19]], CK); chk(hx - 1, hy - 2, 17, 4); P(hx + 2, hy - 3, 8, 1, CK3.L);   // кепі
    P(hx + 15, hy, 4, 2, CK); P(hx - 4, hy + 1, 4, 2, CK3.D); P(hx + 1, hy + 2, 3, 4, CK); px(hx + 7, hy - 4, CK3.D); px(hx + 6, hy - 5, CK3.D);   // козирки, навушник, бантик
    P(hx + 11, hy + 12, 3, 1, '#3a2414'); rod(hx + 13, hy + 13, hx + 15, hy + 16, '#e8d0a0', 2); P(hx + 14, hy + 15, 4, 3, '#e8d0a0'); P(hx + 14, hy + 15, 4, 1, '#3a2414');   // люлька
    for (let i = 0; i < 3; i++) { const k = (t * .8 + i / 3) % 1; px(hx + 16 + Math.round(Math.sin(k * 7 + i) * 1.5), hy + 13 - Math.round(k * 9), k < .6 ? '#d8d8e4' : '#9a9ab0'); }   // димок
    arm([29, 31 + B], fh, CK, SK);
    rod(fh[0], fh[1], fh[0] + 2, fh[1] + 3, '#4a2a14', 2); const lx = fh[0] + 4, ly = fh[1] + 6;                             // лупа
    disc(lx, ly, 3, '#d4a840'); disc(lx, ly, 2, '#bfe0f6'); px(lx - 1, ly - 1, '#ffffff'); px(lx, ly - 1, '#e8f8ff');
  };

  /** 11. РОБІН ГУД — зелена гостра шапочка з червоним пером, руде волосся й борідка, туніка лінкольнської зелені з
   *  розрізом на шнурівці, пояс із сумкою й кинджалом, високі чоботи, сагайдак зі стрілами, довгий лук (aim — натягує). */
  D.robinHood = (pose, fr, t) => {
    const aim = pose === 'aim', g = gait(pose, fr), B = g.bob, [bh, fh] = aim ? [[29, 27 + B], [38, 27 + B]] : hands(pose, g, t, B), GN = '#2e8a3c', HAIR = '#a8582a';
    [[10, 21], [13, 20], [16, 22]].forEach(([a, b], i) => { rod(a + 2, b + 3 + B, a + 3, b + 8 + B, '#c8a070', 1); const fc = i === 1 ? '#d02a2a' : '#f4f0e8';   // стріли з оперенням
      px(a, b + B, fc); px(a + 2, b + B, fc); P(a, b + 1 + B, 3, 1, fc); px(a + 1, b + 2 + B, fc); px(a + 1, b + B, S(fc, -.3)); });
    rod(12, 26 + B, 18, 41 + B, '#7a4a2a', 4); P(11, 26 + B, 5, 2, '#5a3218'); px(15, 33 + B, '#c8a070');                  // сагайдак
    arm([20, 31 + B], bh, GN, TAN);
    legs(g, '#6a4a2a', '#4a2e18', { cuff: '#6a4224', cuffH: 2 });
    blk(18, 29 + B, 13, 16, GN, 2); spans(18, 41 + B, [[0, 13], [-1, 15], [-1, 15]], GN); for (let x2 = 19; x2 < 32; x2 += 3) px(x2, 43 + B, T(GN).D);   // туніка з зубчастим низом
    P(26, 29 + B, 2, 5, TAN.M); [30, 32].forEach(y => P(25, y + B, 4, 1, '#c8a070'));                                      // виріз зі шнурівкою
    P(18, 39 + B, 13, 2, '#5a3a1a'); P(21, 39 + B, 3, 4, '#7a4a24'); P(27, 39 + B, 2, 5, '#c8ccd8');                       // пояс, сумка, кинджал
    line(19, 31 + B, 29, 38 + B, '#5a3218'); line(19, 32 + B, 28, 38 + B, '#7a4a24');                                       // ремінь сагайдака через груди
    const hx = 17, hy = 13 + B;
    head(hx, hy, TAN, { mouth: 'smile', brow: HAIR, iris: '#3a6a2a' });
    P(hx + 8, hy + 13, 5, 2, HAIR); px(hx + 13, hy + 12, HAIR);                                                             // борідка
    P(hx, hy + 3, 3, 7, HAIR); P(hx + 2, hy + 2, 4, 2, HAIR);                                                               // волосся
    const G3 = T(GN); spans(hx - 1, hy - 4, [[2, 12], [1, 15], [0, 17], [0, 18], [0, 18], [0, 4]], GN); P(hx + 1, hy - 4, 9, 1, G3.L); for (let i = 0; i < 6; i++) P(hx + 14 + i, hy - 3 - i * .6, 2, 2, GN);   // шапочка з гострим кінцем
    rod(hx + 3, hy - 3, hx - 4, hy - 11, '#d02a2a', 2); px(hx - 4, hy - 11, '#ff6a6a');                                    // перо
    arm([29, 31 + B], fh, GN, TAN);
    const bx = aim ? 39 : fh[0] + 1, by = aim ? 27 + B : fh[1];                                                             // лук
    for (let i = -12; i <= 12; i++) { const bxx = bx + Math.round((1 - (i / 12) ** 2) * 3); px(bxx, by + i, '#8a5a2a'); px(bxx + 1, by + i, '#b07a3a'); }
    if (aim) { line(bx, by - 12, 28, by, '#e8e0d0'); line(bx, by + 12, 28, by, '#e8e0d0'); rod(27, by, 46, by, '#c8a070', 1); P(45, by - 1, 2, 3, '#dce0ec'); P(27, by - 1, 2, 3, '#d02a2a'); }
    else { line(bx, by - 12, bx, by + 12, '#e8e0d0'); }
  };

  /** 12. БАРОН МЮНХГАУЗЕН — трикутка з золотою облямівкою й кокардою, напудрена перука з буклями й чорним бантом, пишні
   *  закручені вуса, червоний камзол з золотими галунами й ґудзиками, білий жабо, білі лосини, ботфорти; ride — верхи на ядрі. */
  // МАВКА (Леся Українка, «Лісова пісня»; 06.11 — замість Мюнхгаузена, власник: «ще якусь дівчину»): лісова дівчина з довгим
  // зелено-бірюзовим волоссям у квітах, вінок, сукня з листя, босоніж; довкола літають світлячки. 'bloom' — руки вгору, квіти.
  D.mavka = (pose, fr, t, gs) => {
    const bl = pose === 'bloom', g = gait(pose, fr), B = g.bob, [bh, fh] = bl ? [[12, 18 + Math.round(Math.sin(t * 3))], [37, 18 - Math.round(Math.sin(t * 3))]] : hands(pose, g, t, B);
    const HR_ = '#2fa88c', H3 = T(HR_), LF = '#3c9a3a', L3 = T(LF), MS = { M: '#f2e6d6', L: '#fff6ea', D: '#d6c2ae' }, swim = gs && gs.look === 'swim';
    spans(13, 18 + B, [[2, 6], [1, 8], [0, 9], [0, 9], [0, 10], [0, 10], [0, 10], [0, 10], [0, 9], [0, 9], [1, 8], [1, 8], [1, 8], [1, 7], [2, 6], [2, 6], [2, 5], [3, 4], [3, 3]], HR_);   // довге волосся позаду
    P(15, 21 + B, 1, 12, H3.D); P(17, 24 + B, 1, 8, H3.L); [[14, 26], [16, 32], [15, 37]].forEach(([a, b], i) => { px(a, b + B, i % 2 ? '#ff8fd0' : '#ffffff'); });   // пасма, квіточки у волоссі
    if (swim) { swimBody(g, B, MS, '#1e8f6a', { one: 1 }); P(20, 41 + B, 3, 2, '#ffffff'); px(21, 40 + B, '#ff8fd0'); px(23, 42 + B, '#ffe27a'); }   // образ: зелений купальник з лілією
    else { leg(21 + g.bl, 44 + B, GY - g.bu, S(MS.M, -.1), S(MS.M, -.1), { w: 3 }); leg(27 + g.fl, 44 + B, GY - g.fu, MS.M, MS.M, { w: 3 }); px(23 + g.bl, GY - 1 - g.bu, MS.L); px(29 + g.fl, GY - 1 - g.fu, MS.L);   // босі ноги
      skirt(24, 36 + B, 49, 12, 24, LF, { folds: 5, hem: 1, hemC: '#6ad04a', sway: g.sw }); for (let i = 0; i < 6; i++) { P(13 + i * 4, 48 + B + (i % 2), 3, 2, i % 2 ? L3.D : '#5ac04a'); px(14 + i * 4, 50 + B + (i % 2), L3.D); }   // сукня з листя, листяний поділ
      blk(19, 29 + B, 11, 8, LF, 2); P(20, 29 + B, 9, 2, MS.M); px(24, 31 + B, MS.D); P(19, 33 + B, 11, 1, '#6ad04a'); px(22, 35 + B, '#ffe27a'); px(27, 35 + B, '#ff8fd0'); }   // ліф з листя, пояс, квіточки
    arm([20, 31 + B], bh, MS.M, MS); const hx = 17, hy = 13 + B;
    head(hx, hy, MS, { lash: 1, brow: '#1e6a52', lip: '#d8607a', mouth: 'smile', iris: '#2a9a6a', cheek: '#ffb0b8', noEar: 1 });
    spans(hx - 1, hy - 2, [[3, 11], [1, 15], [0, 17], [0, 17], [0, 7], [0, 5], [0, 4], [0, 4], [1, 3]], HR_); P(hx + 2, hy - 1, 9, 1, H3.L);   // волосся спереду
    [[5, 3], [8, 4], [11, 3], [13, 2]].forEach(([a, h]) => P(hx + a, hy + 2, 2, h, HR_)); P(hx + 14, hy + 4, 2, 6, HR_);
    [[1, -2, '#ffffff'], [5, -3, '#ff8fd0'], [9, -4, '#ffe27a'], [13, -3, '#ffffff'], [16, -2, '#ff8fd0']].forEach(([a, b, c]) => { disc(hx + a, hy + b, 1, c); px(hx + a, hy + b, c === '#ffffff' ? '#ffe27a' : '#ffffff'); });   // вінок
    arm([29, 31 + B], fh, MS.M, MS);
    for (let i = 0; i < 4; i++) { const a = t * 1.6 + i * 1.6, fx = Math.round(24 + Math.cos(a) * (14 + i * 2)), fy = Math.round(26 + B + Math.sin(a * 1.3) * 10 - (bl ? 8 : 0)); px(fx, fy, (Math.floor(t * 6) + i) % 3 ? '#d8ff6a' : '#ffffff'); }   // світлячки
    if (bl) [[8, 20], [40, 22], [10, 34], [38, 36]].forEach(([a, b], i) => (Math.floor(t * 4) + i) % 2 === 0 && disc(a, b + B, 1, i % 2 ? '#ff8fd0' : '#ffe27a'));   // квіти розпускаються
  };
  D.stNicholas = (pose, fr, t) => {
    const g = gait(pose, fr), B = g.bob, [bh, fh] = hands(pose, g, t, B), RD = '#c4202e', GD = '#e8c060', BE = '#f6f4f0', BD = '#d4cec4';
    blk(5, 26 + B, 12, 15, '#8a6a44', 4); P(7, 24 + B, 8, 3, '#a8845a'); P(9, 23 + B, 4, 2, '#7a5a34'); P(6, 31 + B, 4, 4, '#6a5034');   // мішок з латкою
    P(10, 24 + B, 5, 4, '#d02a3a'); P(12, 24 + B, 1, 4, GD); P(10, 25 + B, 5, 1, GD);                                      // подарунок визирає
    arm([20, 31 + B], bh, RD, SK, { cuff: GD });
    legs(g, '#f2eee8', '#3a1e1e');
    skirt(24, 42 + B, 54, 15, 19, '#f2eee8', { folds: 3 });                                                                 // підризниця
    skirt(24, 29 + B, 50, 13, 21, RD, { folds: 4, hem: 2, hemC: GD, sway: g.sw });                                                      // риза
    P(23, 29 + B, 3, 21, GD); for (let y = 31; y < 49; y += 4) { px(24, y + B, '#d02a3a'); px(23, y + 1 + B, '#fff0a0'); }   // вишита смуга
    const hx = 17, hy = 15 + B;
    head(hx, hy, SK, { eyes: 'happy', brow: BE, mouth: 0, cheek: '#ff8f9f' });
    spans(hx + 1, hy + 9, [[2, 13], [1, 15], [0, 16], [0, 16], [0, 16], [1, 15], [1, 14], [2, 13], [2, 12], [3, 11], [3, 10], [4, 9], [5, 7], [6, 5], [7, 3]], BE);   // борода
    for (let i = 0; i < 6; i++) { px(hx + 3 + i * 2, hy + 12 + (i % 3) * 2, BD); px(hx + 4 + i * 2, hy + 16 + (i % 2) * 2, BD); }   // хвилі бороди
    P(hx + 7, hy + 9, 7, 2, BE); px(hx + 6, hy + 10, BD); px(hx + 11, hy + 9, '#ffffff');                                    // вуса
    px(hx + 11, hy + 8, '#ff9f9f');                                                                                         // носик
    const MT = '#f8f6ee';                                                                                                   // митра
    spans(hx + 1, hy - 12, [[5, 3], [4, 5], [3, 7], [2, 9], [2, 10], [1, 11], [1, 12], [1, 12], [1, 12], [0, 13], [0, 13], [0, 13], [0, 14], [0, 14]], MT);
    P(hx, hy, 15, 2, GD); P(hx + 7, hy - 11, 1, 12, GD); P(hx + 4, hy - 7, 8, 1, GD); px(hx + 7, hy - 7, '#fff8c0'); P(hx + 1, hy - 3, 13, 1, GD); px(hx + 2, hy - 10, '#e8e4dc');
    arm([29, 31 + B], fh, RD, SK, { cuff: GD });
    rod(fh[0] + 1, fh[1] + 12, fh[0] + 1, 4, GD, 2);                                                                        // жезл із завитком
    P(fh[0] + 1, 1, 4, 2, GD); P(fh[0] + 4, 2, 2, 4, GD); P(fh[0] + 2, 5, 3, 1, GD); px(fh[0] + 2, 4, '#fff0a0'); px(fh[0] + 1, 1, '#fff8c0');
  };

  /** 15. ПОПЕЛЮШКА — золоте волосся в зачісці з кучериком і кришталевою діадемою, рожево-перлова бальна сукня з двома
   *  ярусами воланів і поясом з бантом, буфи, довгі рукавички, блискітки, кришталеві черевички (twirl — кружляє). */
  D.cinderella = (pose, fr, t, gs) => {
    const tw = pose === 'twirl', g = gait(pose, fr), B = g.bob, [bh, fh] = tw ? [[14, 22], [35, 21]] : hands(pose, g, t, B), sw = tw ? Math.round(Math.sin(t * 8) * 2) : 0;
    const PK = '#f4b4d4', P3 = T(PK), HR_ = '#f2c84e', GLV = '#fbf6fa', swim = gs && gs.look === 'swim';
    if (swim) {                                                                                                              // образ: рожевий роздільний купальник, босоніж, діадема лишається, блискітки
      swimBody(g, B, PALE, '#ff5fc8', {}); arm([20, 31 + B], bh, PALE.M, PALE); const hx = 17, hy = 13 + B;
      head(hx, hy, PALE, { lash: 1, brow: '#c8962a', lip: '#e05a7a', mouth: 'smile', iris: '#3a7ad0', cheek: '#ffa0b8', noEar: 1 });
      spans(hx - 1, hy - 2, [[3, 11], [1, 15], [0, 17], [0, 17], [0, 7], [0, 5], [0, 4], [0, 4], [1, 3]], HR_); disc(hx + 2, hy - 3, 4, HR_); px(hx, hy - 5, '#fff0a0');
      [[5, 3], [8, 4], [11, 3], [13, 2]].forEach(([a, h]) => P(hx + a, hy + 2, 2, h, HR_)); P(hx + 2, hy - 1, 9, 1, '#fff0a0'); P(hx + 14, hy + 4, 2, 6, HR_);
      P(hx + 4, hy - 1, 8, 1, '#e8f4ff'); [5, 8, 11].forEach(a => px(hx + a, hy - 2, '#cfeaff')); px(hx + 8, hy - 3, '#ffffff');
      [[14, 33], [30, 45], [22, 50]].forEach(([a, b], i) => (Math.floor(t * 5) + i) % 3 === 0 && star(a, b + B, '#ffffff'));
      arm([29, 31 + B], fh, PALE.M, PALE); return; }
    arm([20, 31 + B], bh, GLV, { M: GLV, L: '#ffffff', D: '#dcd4e4' });
    if (gs && gs.lostShoe) { legs(g, '#fbe6de', '#cfeaff'); P(26 + g.fl, 55 - g.fu, 5, 3, '#fbe6de'); } else legs(g, '#fbe6de', '#cfeaff');
    skirt(24 + sw, 37 + B, 55, 14, 31, PK, { folds: 6, hem: 2, hemC: '#ffe2f0', pow: .8, sway: g.sw });                                 // пишна сукня
    for (let i = 0; i < 9; i++) P(11 + i * 3 + sw, 46 + B, 2, 1, P3.L);                                                     // волан
    [[14, 49], [22, 44], [30, 52], [18, 53], [34, 47], [26, 50]].forEach(([a, b], i) => (Math.floor(t * 5) + i) % 3 === 0 && star(a + sw, b + B, '#ffffff'));   // блискітки
    blk(19, 29 + B, 11, 9, PK, 2); P(20, 29 + B, 9, 2, PALE.M); px(24, 31 + B, PALE.D);                                     // ліф, декольте
    P(18, 37 + B, 13, 2, '#e8e4f4'); P(15, 36 + B, 4, 3, '#e8e4f4'); px(16, 37 + B, '#ffffff');                             // пояс з бантом
    disc(19, 30 + B, 2, P3.L); disc(30, 30 + B, 2, P3.L);                                                                  // буфи
    const hx = 17, hy = 13 + B;
    head(hx, hy, PALE, { lash: 1, brow: '#c8962a', lip: '#e05a7a', mouth: 'smile', iris: '#3a7ad0', cheek: '#ffa0b8', noEar: 1 });
    spans(hx - 1, hy - 2, [[3, 11], [1, 15], [0, 17], [0, 17], [0, 7], [0, 5], [0, 4], [0, 4], [1, 3]], HR_);              // волосся
    disc(hx + 2, hy - 3, 4, HR_); px(hx, hy - 5, '#fff0a0'); px(hx + 1, hy - 4, '#fff0a0');                                // кок-зачіска
    [[5, 3], [8, 4], [11, 3], [13, 2]].forEach(([a, h]) => P(hx + a, hy + 2, 2, h, HR_)); P(hx + 2, hy - 1, 9, 1, '#fff0a0');   // чубчик, відблиск
    P(hx + 14, hy + 4, 2, 6, HR_); px(hx + 15, hy + 10, HR_);                                                               // кучерик
    P(hx + 4, hy - 1, 8, 1, '#e8f4ff'); [5, 8, 11].forEach(a => px(hx + a, hy - 2, '#cfeaff')); px(hx + 8, hy - 3, '#ffffff');   // діадема
    arm([29, 31 + B], fh, GLV, { M: GLV, L: '#ffffff', D: '#dcd4e4' });
  };

  /** 16. МЕРЛІН — високий капелюх із широкими крисами, зірками й місяцем, кущисті брови, довга біла борода до пояса,
   *  смарагдова мантія з золотою облямівкою й зірочками, пояс-шнур із торбинкою, вузлуватий посох зі світним кристалом. */
  D.merlin = (pose, fr, t) => {
    const cast = pose === 'cast', g = gait(pose, fr), B = g.bob, [bh, fh] = cast ? [[17, 38 + B], [33, 18]] : hands(pose, g, t, B), EM = '#1a7a5a', GD = '#e8c060', BE = '#f4f4f8', BD = '#cfd0dc';
    arm([20, 31 + B], bh, EM, SK, { cuff: GD });
    legs(g, '#14563f', '#2a1a10');
    skirt(24, 29 + B, 55, 13, 21, EM, { folds: 4, hem: 2, hemC: GD, sway: g.sw });
    P(23, 30 + B, 2, 25, GD); [[19, 38], [29, 44], [17, 50], [27, 52], [21, 46]].forEach(([a, b]) => star(a, b + B, '#ffe27a', 0));   // облямівка, зірочки
    P(18, 41 + B, 13, 1, '#c8a060'); P(18, 42 + B, 3, 4, '#8a5a2a');                                                        // шнур, торбинка
    const hx = 17, hy = 15 + B;
    head(hx, hy, SK, { eyes: 'dot', brow: BE, mouth: 0, noCheek: 1 });
    P(hx + 4, hy + 4, 4, 2, BE); P(hx + 10, hy + 4, 4, 2, BE);                                                              // кущисті брови
    spans(hx + 1, hy + 9, [[2, 13], [1, 15], [0, 16], [0, 16], [1, 15], [1, 14], [2, 13], [2, 12], [3, 11], [3, 10], [4, 8], [4, 7], [5, 6], [5, 5], [6, 4], [6, 3], [7, 2], [7, 1]], BE);   // борода
    for (let i = 0; i < 7; i++) px(hx + 4 + i * 1.5, hy + 12 + (i % 3) * 3, BD);
    P(hx + 7, hy + 9, 8, 2, BE); px(hx + 12, hy + 8, SK.D); px(hx + 13, hy + 8, SK.M);                                      // вуса, ніс
    const HT = '#686894', H3 = T(HT);                                                                                       // капелюх
    P(hx - 4, hy + 1, 23, 2, HT); P(hx - 4, hy + 1, 23, 1, H3.L);
    for (let i = 0; i < 19; i++) { const k = i / 19, w = Math.round(15 * (1 - k)) + 1, x0 = Math.round(hx + 7.5 - w / 2 + (k > .7 ? (k - .7) * 14 : 0) * -1); P(x0, hy + 1 - i, w, 1, HT); px(x0, hy + 1 - i, H3.L); px(x0 + w - 1, hy + 1 - i, H3.D); }
    star(hx + 4, hy - 4, '#ffe27a'); star(hx + 9, hy - 10, '#ffe27a', 0); P(hx + 9, hy - 2, 2, 3, GD); px(hx + 10, hy - 3, HT); px(hx + 11, hy - 1, GD);   // зірки й місяць
    arm([29, 31 + B], fh, EM, SK, { cuff: GD });
    const sx = fh[0] + 1; rod(sx, fh[1] + (cast ? 22 : 14), sx, fh[1] - 9, '#7a4e24', 2); px(sx - 1, fh[1] + 4, '#5a3414'); px(sx, fh[1] - 2, '#5a3414');   // посох з вузлами
    const cr = cast ? (Math.floor(t * 8) % 2 ? '#ffffff' : '#bff8ff') : '#7ae0ff'; P(sx - 1, fh[1] - 14, 3, 5, cr); px(sx, fh[1] - 15, cr); px(sx - 1, fh[1] - 14, '#ffffff');   // кристал
    if (cast) for (let i = 0; i < 4; i++) { const a = t * 5 + i * 1.57; star(Math.round(sx + Math.cos(a) * 5), Math.round(fh[1] - 12 + Math.sin(a) * 4), i % 2 ? '#bff8ff' : '#ffe27a', 0); }
  };

  /** 17. ДЖИН — бурштинова шкіра, широкі плечі й м'язистий торс у пурпуровій камізельці з золотом, золоті браслети, руки
   *  схрещені на грудях (cast — підняті, між ними іскри); голова: великий червоний тюрбан зі складками, золотим обідком,
   *  самоцвітом і пером, загострене вухо, густі брови, широка усмішка, закручені вуса й борідка; замість ніг — димовий хвіст. */
  D.genie = (pose, fr, t) => {
    const cast = pose === 'cast', b = Math.round(Math.sin(t * 3)), RD = '#c4202e', VI = '#5a2a8a', GD = '#e8c060', A3 = AMBER;
    for (let y = 38; y <= GY; y++) { const k = (y - 38) / 19, w = Math.round(13 * (1 - k) + 2), xo = Math.round(Math.sin(t * 4 + y * .45) * 3 * k);   // димовий хвіст
      P(24 - w / 2 + xo, y, w, 1, y % 3 ? '#b48aff' : '#d4b8ff'); px(24 - w / 2 + xo, y, '#e8dcff'); if ((y + Math.floor(t * 6)) % 7 === 0) px(24 + xo + w / 2, y, '#ffffff'); }
    if (cast) { arm([16, 29 + b], [11, 17 + b], A3.M, A3); P(10, 20 + b, 3, 2, GD); }                                       // задня рука вгору
    spans(13, 26 + b, [[2, 19], [1, 21], [0, 23], [0, 23], [1, 21], [2, 19], [3, 17], [4, 15], [4, 15], [5, 13], [5, 13], [5, 13], [5, 13]], A3.M);   // торс: широкі плечі, вузька талія
    P(15, 26 + b, 17, 1, A3.L); P(18, 30 + b, 4, 1, A3.D); P(25, 30 + b, 4, 1, A3.D); px(17, 29 + b, A3.D); px(29, 29 + b, A3.D); px(23, 33 + b, A3.D); px(23, 35 + b, A3.D);   // плечі, груди, прес
    spans(13, 26 + b, [[2, 4], [1, 4], [0, 5], [0, 5], [1, 4], [2, 4], [3, 3], [4, 3], [4, 3], [5, 3], [5, 3], [5, 3], [5, 3]], VI); spans(30, 26 + b, [[0, 4], [0, 4], [0, 5], [0, 5], [0, 4], [0, 4], [0, 3], [0, 3], [0, 3], [0, 3], [0, 3], [0, 3], [0, 3]], VI);   // камізелька
    line(17, 26 + b, 21, 38 + b, GD); line(30, 26 + b, 26, 38 + b, GD);                                                      // золота облямівка
    P(17, 37 + b, 14, 3, RD); P(17, 37 + b, 14, 1, T(RD).L); P(23, 37 + b, 3, 3, GD);                                        // пояс із пряжкою
    if (!cast) { rod(15, 28 + b, 15, 34 + b, A3.M, 3); rod(32, 28 + b, 32, 34 + b, A3.M, 3);                                 // руки схрещені на грудях
      rod(15, 34 + b, 30, 32 + b, A3.D, 3); rod(32, 35 + b, 17, 33 + b, A3.M, 3); P(16, 32 + b, 2, 3, GD); P(29, 33 + b, 2, 3, GD); hand(30, 32 + b, A3); hand(17, 33 + b, A3); }
    const hx = 17, hy = 12 + b;
    head(hx, hy, A3, { brow: '#1a1010', iris: '#5a3a10', mouth: 'grin', noCheek: 1, noEar: 1 });
    P(hx + 5, hy + 4, 3, 1, '#1a1010'); P(hx + 10, hy + 4, 3, 1, '#1a1010');                                                // густі брови
    spans(hx - 1, hy + 5, [[1, 2], [0, 3], [0, 3], [1, 2], [2, 1]], A3.M); px(hx - 1, hy + 5, A3.L);                        // загострене вухо
    P(hx + 6, hy + 10, 3, 1, '#1a1010'); P(hx + 11, hy + 10, 3, 1, '#1a1010'); px(hx + 5, hy + 9, '#1a1010'); px(hx + 14, hy + 9, '#1a1010');   // вуса закручені
    spans(hx + 9, hy + 14, [[0, 3], [0, 3], [1, 2], [2, 2], [3, 1]], '#1a1010'); px(hx + 12, hy + 17, '#1a1010');             // борідка завитком
    const R3 = T(RD); spans(hx - 3, hy - 8, [[5, 11], [3, 15], [1, 19], [0, 21], [0, 21], [0, 21], [0, 21], [1, 19], [2, 17]], RD);   // тюрбан
    for (let i = 0; i < 5; i++) line(hx - 2 + i * 4, hy - 6 + (i % 2), hx + i * 4, hy - 1, R3.D); P(hx + 1, hy - 8, 10, 1, R3.L); P(hx - 2, hy - 6, 3, 2, R3.L);   // складки
    P(hx - 3, hy - 1, 21, 2, GD); P(hx - 3, hy - 1, 21, 1, '#fff0a0');                                                       // обідок
    P(hx + 9, hy - 5, 5, 5, GD); P(hx + 10, hy - 4, 3, 3, '#3ae0ff'); px(hx + 10, hy - 4, '#e0ffff');                         // самоцвіт в оправі
    rod(hx + 12, hy - 6, hx + 16, hy - 15, '#ffffff', 2); px(hx + 17, hy - 15, '#e8e4f0'); px(hx + 15, hy - 11, '#e8e4f0');   // перо
    if (cast) { arm([31, 29 + b], [37, 16 + b], A3.M, A3); P(36, 19 + b, 3, 2, GD);                                          // передня рука вгору, іскри між руками
      for (let i = 0; i < 6; i++) star(Math.round(24 + Math.cos(t * 6 + i * 1.05) * 13), Math.round(9 + b + Math.sin(t * 6 + i * 1.05) * 5), i % 2 ? '#ffe27a' : '#d4b8ff', i % 3 ? 0 : 1); }
  };

  /** 18. ЗАЛІЗНИЙ ДРОВОРУБ — увесь із бляхи: лійка на голові, голова-циліндр з намальованими очима й носом-гвинтом, тулуб-бочка
   *  з заклепками й червоним серцем, суглоби-кільця, сокира; rust — завмер із піднятою сокирою, плями іржі. */
  D.tinMan = (pose, fr, t) => {
    const rust = pose === 'rust', g = gait(rust ? 'stand' : pose, fr), B = g.bob, M3 = { M: '#b4bccc', L: '#e6ecf6', D: '#7a8296' }, MK = '#4a5266';
    const [bh, fh] = rust ? [[15, 24], [33, 19]] : hands(pose, g, t, B);
    arm([20, 31 + B], bh, M3.M, M3); P(bh[0] - 2, (31 + B + bh[1]) / 2, 4, 1, MK);                                          // рука з суглобом
    legs(g, M3.M, M3.D, { w: 4 }); [21 + g.bl, 27 + g.fl].forEach(lx => P(lx - 2, 50 + B, 5, 1, MK));
    blk(17, 28 + B, 15, 17, M3.M, 4); P(20, 30 + B, 2, 13, M3.L); P(29, 30 + B, 1, 13, M3.D); P(17, 36 + B, 15, 1, MK);      // тулуб-бочка
    [[19, 30], [30, 30], [19, 42], [30, 42], [24, 29]].forEach(([a, c]) => { px(a, c + B, '#ffffff'); px(a + 1, c + 1 + B, MK); });   // заклепки
    P(24, 31 + B, 2, 2, '#e0203a'); P(27, 31 + B, 2, 2, '#e0203a'); P(24, 33 + B, 5, 2, '#e0203a'); P(25, 35 + B, 3, 1, '#e0203a'); px(26, 36 + B, '#e0203a'); px(24, 31 + B, '#ff8a9a');   // серце
    const hx = 18, hy = 13 + B;
    blk(hx, hy, 13, 15, M3.M, 3); P(hx + 2, hy + 2, 2, 11, M3.L); P(hx, hy + 13, 13, 1, MK);                                // голова-циліндр
    [hx + 5, hx + 9].forEach(e => { P(e, hy + 5, 2, 2, '#1a1030'); px(e, hy + 5, '#ffffff'); P(e - 1, hy + 3, 4, 1, M3.D); });   // намальовані очі й брови
    P(hx + 12, hy + 7, 3, 2, M3.D); px(hx + 14, hy + 7, M3.L);                                                              // ніс-гвинт
    P(hx + 6, hy + 10, 5, 1, MK); px(hx + 5, hy + 9, MK); px(hx + 11, hy + 9, MK);                                          // рот-шарнір (усмішка)
    for (let i = 0; i < 12; i++) { const w = Math.round(2 + i * .9); P(hx + 6.5 - w / 2, hy - 12 + i, w, 1, M3.M); px(hx + 6.5 - w / 2, hy - 12 + i, M3.L); px(hx + 6.5 + w / 2 - 1, hy - 12 + i, M3.D); }   // лійка
    P(hx + 1, hy - 1, 11, 1, MK); px(hx + 6, hy - 13, M3.L);
    arm([29, 31 + B], fh, M3.M, M3); P(fh[0] - 2, (31 + B + fh[1]) / 2, 4, 1, MK);
    const ax = fh[0], ay = fh[1]; rod(ax, ay + 5, ax + (rust ? 2 : 0), ay - 10, '#8a5a2a', 2);                              // сокира
    const hx2 = ax + (rust ? 2 : 0), hy2 = ay - 12; P(hx2, hy2, 6, 5, '#d4dae6'); P(hx2 + 5, hy2 - 1, 2, 7, '#eef2fa'); P(hx2, hy2 + 4, 6, 1, '#8a92a6'); px(hx2 + 6, hy2 - 1, '#ffffff');
    if (rust) { [[19, 33], [27, 40], [21, 17], [26, 22], [16, 26], [31, 25], [22, 50]].forEach(([a, c]) => { P(a, c, 2, 1, '#b8642a'); px(a, c + 1, '#8a4a1a'); }); }   // іржа
  };

  /** 19. ДЖОН СІЛЬВЕР — пірат: трикутка з золотою облямівкою, засмагле обличчя з бакенбардами й щетиною, усмішка з золотим
   *  зубом, синій каптан з золотими ґудзиками й обшлагами, біле жабо, червоний кушак, дерев'яна нога, милиця, папуга Капітан
   *  Флінт на плечі; dig — копає скарб лопатою. */
  D.silver = (pose, fr, t) => {
    const dig = pose === 'dig', g = gait(pose, fr), B = g.bob, up = dig && Math.sin(t * 6) > 0, BL = '#1c3a8a', B3 = T(BL), GD = '#e8c060';
    const [bh, fh] = dig ? [[up ? 22 : 24, up ? 30 : 38], [up ? 29 : 32, up ? 30 : 39]] : hands(pose, g, t, B);
    if (!dig) { rod(19, 32 + B, 14, GY, '#8a5a2a', 2); P(16, 30 + B, 6, 2, '#a8763a'); }                                   // милиця
    arm([20, 31 + B], bh, BL, TAN, { cuff: GD });
    legs(g, '#3c3c48', '#1c1c24', { front: { peg: 1 }, back: {} });
    blk(17, 29 + B, 15, 19, BL, 2); P(17, 44 + B, 15, 4, B3.D);                                                             // каптан
    [31, 34, 37, 40].forEach(y => { px(28, y + B, '#ffd27a'); px(28, y + 1 + B, '#a8802a'); }); P(17, 38 + B, 15, 3, '#c4202e'); P(23, 38 + B, 3, 3, GD);   // ґудзики, кушак, пряжка
    spans(22, 28 + B, [[0, 6], [0, 5], [1, 3], [1, 2]], '#f4f0e8');                                                        // жабо
    const hx = 17, hy = 13 + B;
    head(hx, hy, TAN, { brow: '#1a1a1a', browA: 1, mouth: 0, iris: '#3a2a1a', noCheek: 1 });
    P(hx + 1, hy + 6, 2, 7, '#2a1a14'); spans(hx + 3, hy + 11, [[0, 11], [1, 10], [3, 7]], '#4a3a34');                      // бакенбарди, щетина
    P(hx + 7, hy + 11, 6, 2, '#5a1020'); P(hx + 7, hy + 11, 6, 1, '#ffffff'); px(hx + 9, hy + 11, '#ffd23a');                // усмішка з золотим зубом
    const N3 = T('#1c1c26'); spans(hx - 3, hy - 4, [[6, 9], [2, 17], [0, 21], [1, 19]], '#1c1c26'); P(hx - 3, hy - 2, 21, 1, GD); P(hx + 4, hy - 4, 7, 1, N3.L);   // трикутка
    arm([29, 31 + B], fh, BL, TAN, { cuff: GD });
    const px0 = 29, py0 = 20 + B;                                                                                          // папуга Капітан Флінт
    P(px0, py0 + 3, 5, 6, '#2aa83a'); P(px0 + 1, py0, 4, 4, '#3ac84a'); px(px0 + 3, py0 + 1, EYE); px(px0 + 4, py0 + 1, '#ffffff');
    P(px0 + 5, py0 + 2, 2, 2, '#ffd23a'); px(px0 + 6, py0 + 3, '#c89a1a'); P(px0, py0 + 5, 3, 3, '#d02a2a'); P(px0, py0 + 8, 2, 1, '#3a6ad8'); P(px0 - 1, py0 + 9, 2, 3, '#2a8a3a');
    if (dig) { rod(fh[0] - 3, fh[1] - 7, fh[0] + 3, fh[1] + 9, '#8a5a2a', 2); P(fh[0] + 1, fh[1] + 9, 6, 5, '#9aa2b4'); P(fh[0] + 1, fh[1] + 9, 6, 1, '#d4dae6'); }   // лопата
  };

  /** 3. ЧЕШИРСЬКИЙ КІТ — бузковий смугастий кіт (спрайт Рудика іншими фарбами + більше смуг), широченна зубата усмішка,
   *  жовто-зелені очі зі щілинками; сидячи часом ЗНИКАЄ — тіло тане, лишаються усмішка й очі (як у книжці). */
  const CHESH = { O: '#9a8cc4', L: '#c4b8e8', D: '#6a5a9a', S: '#4a3a74', W: '#f2eefc', N: '#ff9fc6', B: '#d8a6d0', E: '#1a2a10', OUT: [24, 16, 40] };
  D.cheshire = (pose, fr, t, gs, cv) => {
    const cp = pose === 'run' ? 'run' : pose === 'sit' ? 'sit' : 'walk'; drawCat(cp, fr, t, cv, CHESH); x = cv.getContext('2d'); lastC = null;
    const sit = cp === 'sit', bb = sit ? 0 : (fr % 4) % 2, [hx, hy] = sit ? [10, 1] : [18, 4 + bb];
    if (sit) { [[11, 13], [11, 16], [19, 14], [19, 17]].forEach(([a, b]) => P(a, b, 2, 1, CHESH.D)); P(13, 21, 6, 1, CHESH.D); }   // смуги
    else [[10, 13 + bb], [13, 12 + bb], [16, 12 + bb], [20, 13 + bb]].forEach(([a, b]) => P(a, b, 1, 4, CHESH.D));
    const fade = sit && (t % 7) > 4.2 && (t % 7) < 5.8;                                                                     // зникає: тіло тане
    if (fade) { x.save(); x.globalCompositeOperation = 'destination-out'; x.globalAlpha = .82; x.fillRect(0, 0, cv.width, cv.height); x.restore(); }
    P(hx + 1, hy + 7, 12, 3, '#ffffff'); P(hx + 1, hy + 7, 12, 1, '#2a1a3a'); P(hx, hy + 6, 1, 2, '#2a1a3a'); P(hx + 13, hy + 6, 1, 2, '#2a1a3a');   // усмішка
    for (let i = 0; i < 6; i++) px(hx + 2 + i * 2, hy + 9, '#c8c0d8'); P(hx + 2, hy + 10, 10, 1, '#2a1a3a');
    P(hx + 2, hy + 3, 3, 3, '#c8e84a'); P(hx + 8, hy + 3, 3, 3, '#c8e84a'); P(hx + 3, hy + 3, 1, 3, '#1a2a10'); P(hx + 9, hy + 3, 1, 3, '#1a2a10'); px(hx + 2, hy + 3, '#ffffff'); px(hx + 8, hy + 3, '#ffffff');   // очі
  };

  /** 6. КОЛОБОК — рум'яний круглий хлібчик: глазурований блиск, підрум'янена скоринка з цяточками, борошняний пил, великі
   *  очі й рум'янець, співає (рот «о»); котиться — обличчя й шов скоринки «обертаються». */
  D.kolobok = (pose, fr, t) => {
    const roll = pose === 'roll' || pose === 'walk' || pose === 'run', bo = roll ? Math.round(Math.abs(Math.sin(t * 9)) * 3) : 0, cx = 24, cy = 45 - bo, r = 11;
    for (let y = -r; y <= r; y++) { const w = Math.round(Math.sqrt(r * r - y * y + 4)); for (let i = -w; i <= w; i++) { const d = (i - 3) * .55 + (y - 4) * .8;   // кулька з об'ємом (світло зліва-згори)
      px(cx + i, cy + y, d < -9 ? '#ffe8a8' : d < -4 ? '#ffd27a' : d < 3 ? '#f0b04a' : d < 8 ? '#d8922e' : '#b87420'); } }
    const ph = roll ? t * 6 : 0, sx = Math.round(Math.sin(ph) * 4);
    [[-5, -3], [4, 5], [-2, 7], [6, -6], [-7, 3]].forEach(([a, b], i) => { const xx = cx + ((a + sx * 2 + 30) % 20) - 10 + (i % 2); px(xx, cy + b, '#a8641a'); px(xx + 1, cy + b, '#c8822a'); });   // цяточки скоринки
    [[-6, -7], [-3, -9], [-8, -4]].forEach(([a, b]) => px(cx + a, cy + b, '#fff8e8'));                                       // борошно
    P(cx - 6, cy - 7, 3, 2, '#ffffff'); px(cx - 7, cy - 5, '#fff6dc');                                                       // блиск глазурі
    const fx = cx + (roll ? sx : 2), sing = Math.floor(t * 3) % 2;
    [fx - 4, fx + 2].forEach(e => { P(e, cy - 4, 2, 3, EYE); px(e, cy - 4, '#ffffff'); px(e + 1, cy - 2, '#7a4a1a'); });   // очі
    P(fx - 5, cy - 6, 3, 1, '#8a4a1a'); P(fx + 1, cy - 6, 3, 1, '#8a4a1a');                                                  // брівки
    P(fx - 7, cy + 1, 2, 1, '#ff7a6a'); P(fx + 5, cy + 1, 2, 1, '#ff7a6a');                                                  // рум'янець
    if (sing) { P(fx - 1, cy + 1, 3, 3, '#5a1a10'); px(fx, cy + 2, '#ff7a6a'); } else { px(fx - 2, cy + 1, '#5a1a10'); P(fx - 1, cy + 2, 3, 1, '#5a1a10'); px(fx + 2, cy + 1, '#5a1a10'); }   // співає
  };

  /** 13. ЖАР-ПТИЦЯ — золото-вогняний птах: голова на вигнутій шиї з короною з трьох пер (світні кульки на кінцях), око з
   *  бліком, золотий дзьоб; тіло в лусочках пір'я зі світлими грудьми; велике крило з п'яти махових пер (вгору / рівно / вниз);
   *  довгий хвіст з п'яти пер, що хвилюються, — на кінці кожного «око» (червоне, золоте, біле серце). */
  D.firebird = (pose, fr, t) => {
    const wf = [0, 1, 2, 1][Math.floor(t * 8) % 4], FC = ['#fff0a0', '#ffd04a', '#ffa82a', '#ff6a1a', '#ff3a2a'];
    const TL = [['#ffd04a', '#ff6a1a'], ['#ffb02a', '#ff3a2a'], ['#ff8ae0', '#ff3ab0'], ['#ffd04a', '#ff8a1a'], ['#ffb02a', '#ff4a2a']];
    TL.forEach(([c1, c2], i) => { const ph = t * 4 + i * .8, ex = 3 + (i % 2) * 3 + Math.sin(ph) * 1.5, ey = 26 + i * 6 + Math.cos(ph) * 1.5;   // хвіст
      for (let k = 0; k <= 14; k++) { const u = k / 14, qx = 19 + (ex - 19) * u, qy = 29 + (ey - 29) * u + Math.sin(u * Math.PI) * (4 - i * 1.5) + Math.sin(u * 4 + ph) * 1.2;
        P(qx, qy, u < .55 ? 2 : 1, u < .3 ? 2 : 1, u < .5 ? c1 : c2); }
      spans(ex - 2, ey - 2, [[1, 3], [0, 5], [0, 5], [0, 5], [1, 3]], c2); P(ex - 1, ey - 1, 3, 3, '#ffd04a'); px(ex, ey, '#ffffff'); px(ex - 1, ey - 1, '#fff8c0'); });   // «очі»
    const wing = tips => { const [bx, by] = [24, 25];                                                                        // крило: віяло з п'яти махових пер
      for (let i = 0; i < tips.length - 1; i++) { tri(bx, by, ...tips[i], ...tips[i + 1], i % 2 ? '#ff8a1a' : '#ff9a2a'); tri(bx, by, (bx + tips[i][0]) / 2, (by + tips[i][1]) / 2, (bx + tips[i + 1][0]) / 2, (by + tips[i + 1][1]) / 2, '#ffc83a'); }
      tips.forEach(([tx, ty], i) => { line(bx, by, tx, ty, i % 2 ? '#e8501a' : '#ff6a1a'); line((bx + tx) / 2, (by + ty) / 2, tx, ty, '#ff3a2a'); px(tx, ty, '#fff0a0'); });
      tri(bx, by, ...tips[0], (bx * 2 + tips[0][0] + tips[1][0]) / 4, (by * 2 + tips[0][1] + tips[1][1]) / 4, '#ffe27a'); };
    if (wf === 2) wing([[13, 36], [16, 39], [20, 41], [24, 41], [28, 39]]);                                                  // крило вниз (за тілом)
    spans(17, 23, [[5, 9], [2, 14], [1, 16], [0, 17], [0, 17], [0, 17], [1, 16], [2, 14], [4, 10], [7, 5]], '#ffa82a');     // тіло
    P(20, 23, 9, 1, '#ffd86a'); spans(26, 26, [[1, 7], [0, 8], [0, 8], [1, 6], [2, 4]], '#ffe27a'); px(28, 27, '#fff6c0');     // спина, груди
    for (let i = 0; i < 4; i++) for (let j = 0; j < 2; j++) { px(19 + i * 3 + j, 27 + j * 2, '#e8702a'); px(20 + i * 3 + j, 28 + j * 2, '#ffc04a'); }   // лусочки
    rod(32, 26, 35, 21, '#ffb02a', 4); rod(34, 22, 36, 19, '#ffc83a', 3);                                                    // шия
    const hx = 34, hy = 13; spans(hx, hy, [[2, 5], [1, 7], [0, 8], [0, 8], [0, 8], [1, 7], [2, 5]], '#ffc83a'); P(hx + 2, hy, 4, 1, '#ffe48a'); px(hx + 1, hy + 1, '#ffe48a');   // голова
    P(hx + 5, hy + 2, 2, 2, EYE); px(hx + 5, hy + 2, '#ffffff'); px(hx + 4, hy + 4, '#ff5a1a');                               // око, «брова»
    P(hx + 8, hy + 3, 3, 2, '#ffa21a'); px(hx + 10, hy + 4, '#c86a10'); px(hx + 8, hy + 3, '#ffe06a'); px(hx + 11, hy + 3, '#ffd04a');   // дзьоб
    [[1, -5, '#ff8a2a'], [3, -7, '#ff4ac8'], [5, -5, '#ff8a2a']].forEach(([a, b, c], i) => { line(hx + a + 1, hy, hx + a, hy + b, c); disc(hx + a, hy + b - 1, 1, Math.floor(t * 6 + i) % 2 ? '#fff0a0' : '#ffd04a'); px(hx + a, hy + b - 1, '#ffffff'); });   // корона
    if (wf === 0) wing([[10, 8], [14, 5], [19, 4], [24, 6], [28, 10]]);                                                     // крило вгору
    else if (wf === 1) wing([[6, 20], [7, 24], [9, 28], [12, 31], [16, 33]]);                                               // крило рівно назад
  };

  /** 20. ЗМІЙ ГОРИНИЧ — зелений дракончик: луска, жовте черевце смугами, гребінь шипів, перетинчасті крила (повільно
   *  махають), хвіст зі стрілкою, кігтисті лапи; три шиї й голови з ріжками, червоними очима й зубками; sneeze — чхає вогнем. */
  D.gorynych = (pose, fr, t) => {
    const G = '#3aa84a', G3 = T(G), BL = '#e8d070', f = pose === 'walk' || pose === 'run' ? fr % 4 : 0, sn = pose === 'sneeze', wv = Math.round(Math.sin(t * 2.5) * 2);
    rod(12, 44, 4, 47, G, 3); rod(4, 47, 1, 40, G, 3); spans(-1, 35, [[2, 2], [1, 4], [0, 6], [2, 2]], G3.D);                // хвіст зі стрілкою
    spans(6, 13 - wv, [[10, 2], [8, 4], [6, 7], [4, 10], [3, 12], [2, 13], [1, 14], [1, 14], [2, 13], [3, 11], [5, 8], [7, 5]], '#2a6a3a');   // крило
    for (let i = 0; i < 4; i++) rod(17 - i, 14 - wv + i, 8 + i * 3, 23 - wv + i, '#7ade8a', 1);                              // перетинки
    blk(8, 29, 26, 17, G, 6); for (let i = 0; i < 5; i++) for (let j = 0; j < 3; j++) { px(12 + i * 4 + j * 2, 31 + j * 4, G3.D); px(13 + i * 4 + j * 2, 32 + j * 4, G3.D); }   // тіло в лусці
    spans(14, 39, [[1, 16], [0, 18], [1, 17], [3, 13]], BL); for (let i = 0; i < 4; i++) P(15, 40 + i, 16, 1, i % 2 ? '#c8a840' : BL);   // черевце
    for (let i = 0; i < 6; i++) { px(10 + i * 4, 28, G3.K); px(11 + i * 4, 27, G3.K); }                                      // гребінь шипів
    [11, 18, 26].forEach((lx, i) => { const up = (f + i) % 2 && f; rod(lx, 44, lx, GY - 2 - (up ? 1 : 0), G3.D, 4); P(lx - 1, GY - 1 - (up ? 1 : 0), 5, 2, G3.D); [0, 2, 4].forEach(c => px(lx - 1 + c, GY - (up ? 1 : 0), '#f4f0e8')); });   // лапи з кігтями
    const HD = [[25, 30, 29, 11], [28, 33, 33, 21], [22, 30, 20, 4]];                                                         // шиї: від тіла до голів
    HD.forEach(([nx, ny, hx0, hy0], i) => { const b = Math.round(Math.sin(t * 3 + i * 2)), hx = hx0, hy = hy0 + b;
      rod(nx, ny, hx + 2, hy + 6, G, 4); for (let k = 0; k < 3; k++) px(Math.round(nx + (hx + 2 - nx) * k / 3) + 1, Math.round(ny + (hy + 6 - ny) * k / 3), BL);
      spans(hx - 1, hy, [[1, 7], [0, 9], [0, 10], [0, 10], [0, 9], [1, 7]], G); P(hx, hy, 6, 1, G3.L);                        // голова
      px(hx + 1, hy - 1, '#f4f0d8'); px(hx + 1, hy - 2, '#f4f0d8'); px(hx + 3, hy - 1, '#f4f0d8');                             // ріжки
      P(hx + 3, hy + 1, 2, 2, '#ff2a2a'); px(hx + 3, hy + 1, '#ffffff'); px(hx + 8, hy + 2, G3.K);                             // око, ніздря
      const open = sn && i === 1; if (open) { P(hx + 5, hy + 4, 5, 2, '#5a1010'); px(hx + 6, hy + 4, '#ffffff'); px(hx + 8, hy + 4, '#ffffff');
        const k = (Math.sin(t * 12) + 1) / 2; spans(hx + 9, hy + 1, [[1, 3 + k * 2], [0, 4 + k * 3], [0, 5 + k * 3], [0, 5 + k * 3], [0, 4 + k * 3], [1, 3 + k * 2]], '#ff6a1a');
        spans(hx + 9, hy + 2, [[0, 2 + k * 2], [0, 3 + k * 2], [0, 3 + k * 2], [0, 2 + k * 2]], '#ffc83a'); P(hx + 9, hy + 3, 2, 2, '#fff6c0'); }   // вогонь
      else { P(hx + 5, hy + 4, 4, 1, G3.K); px(hx + 6, hy + 5, '#ffffff'); } });
  };

  // ======================= ОБРАЗИ ПІСЛЯ СЦЕНОК (справжня вечірка, 06.11) =======================
  // Малюються поверх готового кадру (до контуру): кожен герой після своєї сценки лишається в новому вигляді до кінця вечірки;
  // такий образ можна зібрати в колекцію тапом (guests.js collectAlt). Купальники — у самих D.* (swimBody).
  const LOOK = {
    pinocchio(pose, fr, t) { const B = gait(pose, fr).bob, hx = 17, hy = 13 + B; recolor([['#3a8c3c', '#2a3a2a'], ['#d02a3a', '#4a2a2a']]);   // обгорілий: курточка й ковпак у сажі, кінчик носа чорний, димок, здивовані очі
      [[20, 33], [26, 39], [23, 30], [hx + 3, hy + 9], [hx + 10, hy + 3], [hx + 6, hy - 8]].forEach(([a, b]) => { P(a, b + (b < 28 ? 0 : B), 2, 2, '#2a2228'); px(a + 1, b + (b < 28 ? 0 : B), '#4a4048'); });
      P(hx + 17, hy + 8, 3, 2, '#2a2228'); px(hx + 19, hy + 9, '#ff6a1a'); smoke(hx + 19, hy + 6, t); smoke(hx + 5, hy - 12, t, 2); face(hx, hy, WOOD, { eyes: 'wide', mouth: 'o', noCheek: 1, brow: '#5a3a1a', browA: -1 }); },
    redHood(pose, fr, t) { recolor([['#d0222e', '#7a3ad0'], ['#e84a54', '#b48aff'], ['#f27a80', '#d4b8ff']]); const B = gait(pose, fr).bob;   // накидка пофарбована пуншем у фіолетовий, світна паличка в косі, краплі
      [[14, 36], [12, 44], [16, 50]].forEach(([a, b]) => px(a, b + B, '#ff4fd8')); P(29, 25 + B, 2, 8, Math.floor(t * 4) % 2 ? '#3bff8a' : '#9af6ff'); },
    dwarf(pose, fr, t) { const B = gait(pose, fr).bob, hx = 16, hy = 23 + B;                                                 // миска з чипсами на голові замість ковпака, крихти в бороді
      for (let i = 0; i < 9; i++) { const w = 18 - i * 1.4; P(hx + 8 - w / 2, hy - 7 + i, w, 1, i < 2 ? '#e8ecf6' : i % 2 ? '#b4bccc' : '#9aa2b4'); px(hx + 8 - w / 2, hy - 7 + i, '#ffffff'); } P(hx - 2, hy - 8, 20, 1, '#d4dae6');
      [[2, -10], [6, -11], [10, -10], [13, -9]].forEach(([a, b]) => { P(hx + a, hy + b, 3, 2, '#ffd27a'); px(hx + a, hy + b, '#fff0a0'); }); [[4, 14], [9, 17], [12, 13]].forEach(([a, b]) => px(hx + a, hy + b, '#ffd27a')); },
    whiteRabbit(pose, fr, t) { const B = gait(pose, fr).bob, hx = 16, hy = 14 + B;                                          // вуха зав'язані вузлом, очі-спіральки, зірочки
      P(hx + 2, hy - 14, 10, 1, '#f6f4fb'); disc(hx + 7, hy - 11, 3, '#f6f4fb'); disc(hx + 7, hy - 11, 1, '#cfcade'); px(hx + 5, hy - 12, '#ffffff');
      [hx + 6, hx + 11].forEach(e => { P(e - 1, hy + 5, 4, 4, '#ffffff'); px(e, hy + 6, EYE); px(e + 1, hy + 6, EYE); px(e + 1, hy + 7, EYE); px(e, hy + 8, EYE); px(e - 1, hy + 7, EYE); });
      for (let i = 0; i < 3; i++) { const a = t * 3 + i * 2.1; star(Math.round(hx + 7 + Math.cos(a) * 9), Math.round(hy - 3 + Math.sin(a) * 3), '#ffe27a', 0); } },
    pussBoots(pose, fr, t) { const g = gait(pose, fr); [[21 + g.bl, GY - g.bu, 1], [27 + g.fl, GY - g.fu, 0]].forEach(([cx, yb, back]) => {   // чоботи загубив у піні — смугасті шкарпетки
      for (let i = 0; i < 12; i++) P(cx - 2, yb - 12 + i, 5, 1, i % 3 === 0 ? '#ff4fd8' : i % 3 === 1 ? '#ffffff' : '#3be8ff'); P(cx - 3, yb - 13, 7, 1, '#1a1030'); P(cx - 2, yb - 1, 7, 2, back ? '#cfcade' : '#f4f2f8'); px(cx + 4, yb - 2, '#f4f2f8'); }); },
    quixote(pose, fr, t) { if (pose === 'fall') return; const B = gait(pose, fr).bob, hx = 17, hy = 12 + B, BR = '#e0b84e', B3 = T(BR);   // тазик налазить на очі вм'ятим відром, зірочки
      for (let i = 0; i < 12; i++) { const w = 15 + Math.min(i, 3); P(hx + 7.5 - w / 2, hy - 4 + i, w, 1, i === 11 ? B3.D : BR); px(hx + 7.5 - w / 2, hy - 4 + i, B3.L); px(hx + 7.5 + w / 2 - 1, hy - 4 + i, B3.D); }
      P(hx + 3, hy + 1, 4, 2, B3.D); P(hx + 9, hy + 3, 3, 1, B3.D); P(hx + 13, hy + 6, 3, 1, '#1a1030');                      // вм'ятини, щілина
      for (let i = 0; i < 3; i++) { const a = t * 4 + i * 2.1; star(Math.round(hx + 7 + Math.cos(a) * 11), Math.round(hy - 6 + Math.sin(a) * 2), '#ffe27a', 0); } },
    sherlock(pose, fr, t) { const B = gait(pose, fr).bob, hx = pose === 'inspect' ? 20 : 17, hy = (pose === 'inspect' ? 16 : 12) + B;   // абажур на голові, бульбашки з люльки
      for (let i = 0; i < 12; i++) { const w = 12 + i * .9; P(hx + 7.5 - w / 2, hy - 10 + i, w, 1, i % 4 === 3 ? '#e8c060' : '#f4ecd0'); px(hx + 7.5 - w / 2, hy - 10 + i, '#ffffff'); px(hx + 7.5 + w / 2 - 1, hy - 10 + i, '#c8b890'); }
      for (let i = 0; i < 7; i++) px(hx + 1 + i * 2, hy + 2, '#e8c060'); P(hx + 6, hy - 12, 3, 2, '#e8c060');
      for (let i = 0; i < 3; i++) { const k = (t * .8 + i / 3) % 1; disc(hx + 17 + Math.round(Math.sin(k * 7) * 2), hy + 13 - Math.round(k * 10), 1, '#bff8ff'); } },
    robinHood(pose, fr, t) { const B = gait(pose, fr).bob, hx = 17, hy = 13 + B;                                            // стріла крізь шапочку, клаптики лопнутої кульки
      rod(hx - 6, hy - 2, hx + 18, hy - 2, '#c8a070', 1); P(hx + 18, hy - 3, 3, 3, '#dce0ec'); px(hx + 20, hy - 2, '#ffffff'); P(hx - 7, hy - 4, 2, 5, '#d02a2a'); P(hx - 9, hy - 3, 2, 3, '#f4f0e8');
      [[8, 30], [30, 36], [36, 24]].forEach(([a, b], i) => P(a, b + B, 2, 2, ['#ff4fd8', '#3be8ff', '#ffe27a'][i])); },
    stNicholas(pose, fr, t) { const B = gait(pose, fr).bob, hx = 17, hy = 15 + B; shades(hx, hy);                            // окуляри-«сонце», гавайська гірлянда, коктейль
      for (let i = 0; i < 9; i++) { disc(16 + i * 2, 27 + B + (i % 2) * 2, 1, ['#ff4fd8', '#ffe27a', '#3bff8a', '#ff7a2a'][i % 4]); px(16 + i * 2, 27 + B + (i % 2) * 2, '#ffffff'); } },
    merlin(pose, fr, t) { recolor([['#f4f4f8', '#ff9ad8'], ['#cfd0dc', '#e05ab0']]); const B = gait(pose, fr).bob, hx = 17, hy = 15 + B;   // закляття пішло не так: борода рожева, у ній квіти
      [[4, 14], [9, 20], [6, 25], [12, 16]].forEach(([a, b], i) => { disc(hx + a, hy + b, 1, i % 2 ? '#3be8ff' : '#ffe27a'); px(hx + a, hy + b, '#ffffff'); }); },
    genie(pose, fr, t) { const b = Math.round(Math.sin(t * 3)), hx = 17, hy = 12 + b; partyHat(hx + 7, hy - 8, 12, '#3be8ff', '#ff4fd8'); shades(hx, hy); },   // ковпачок на тюрбані, окуляри
    tinMan(pose, fr, t) { const B = gait(pose, fr).bob;                                                                     // обклеєний конфеті, серце світиться, кулька-серце на нитці
      [[19, 33], [27, 38], [22, 41], [29, 31], [20, 18], [27, 21], [24, 50]].forEach(([a, b], i) => P(a, b + B, 2, 2, ['#ff4fd8', '#3be8ff', '#ffe27a', '#3bff8a'][i % 4]));
      P(24, 33 + B, 5, 2, Math.floor(t * 4) % 2 ? '#ff8a9a' : '#e0203a'); line(33, 30 + B, 40, 14, '#e8e4f0'); disc(40, 10, 3, '#ff4fd8'); disc(43, 10, 3, '#ff4fd8'); P(38, 11, 8, 3, '#ff4fd8'); P(40, 14, 4, 1, '#ff4fd8'); px(42, 15, '#ff4fd8'); px(39, 8, '#ffffff'); },
    silver(pose, fr, t) { const B = gait(pose, fr).bob, hx = 17, hy = 13 + B;                                               // знайшов «скарб» під танцполом: диско-трикутка в блискітках, папуга в окулярах
      for (let i = 0; i < 8; i++) px(hx - 1 + i * 3, hy - 3 + (i % 3), (Math.floor(t * 6) + i) % 3 ? '#ffe27a' : '#ffffff'); P(29 + 2, 21 + B, 4, 2, '#1a1030'); px(30, 21 + B, '#1a1030');
      P(hx + 7, hy + 11, 6, 1, '#ffd23a'); },
    cheshire(pose, fr, t) { const sit = pose === 'sit', cx = sit ? 16 : 22, y0 = sit ? 12 : 10;                                 // у сукні Попелюшки: рожева спідничка на тулубі, діадема
      skirt(cx, y0, y0 + 9, 10, 20, '#f4b4d4', { folds: 4, hem: 1, hemC: '#ffe2f0' }); const hx = sit ? 10 : 18, hy = sit ? 1 : 4; P(hx + 3, hy - 1, 8, 1, '#e8f4ff'); [4, 7, 10].forEach(a => px(hx + a, hy - 2, '#cfeaff')); },
    kolobok(pose, fr, t) { recolor([['#f0b04a', '#7a4a2a'], ['#ffd27a', '#a8703a'], ['#d8922e', '#5a3418'], ['#b87420', '#3a2010'], ['#ffe8a8', '#c89060']]);   // у шоколаді з посипкою
      [[18, 40], [27, 38], [22, 50], [30, 48], [16, 47], [25, 44]].forEach(([a, b], i) => P(a, b, 2, 1, ['#ff4fd8', '#3be8ff', '#ffe27a', '#3bff8a'][i % 4])); },
    firebird(pose, fr, t) { recolor([['#ffa82a', '#c87a3a'], ['#ff6a1a', '#b85a3a'], ['#ffd04a', '#d8a860'], ['#ff8a1a', '#b8703a'], ['#ffc83a', '#d0a060']]);   // мокра після фонтану з пуншем: пір'я тьмяне, краплі
      for (let i = 0; i < 4; i++) { const k = (t * 1.2 + i / 4) % 1; px(8 + i * 8, 40 + Math.round(k * 14), '#9af6ff'); } },
    gorynych(pose, fr, t) { const HD = [[29, 11], [33, 21], [20, 4]]; HD.forEach(([hx0, hy0], i) => { const hy = hy0 + Math.round(Math.sin(t * 3 + i * 2));   // дві голови у ковпачках, третя спить
      if (i < 2) partyHat(hx0 + 4, hy - 1, 9, i ? '#3be8ff' : '#ff4fd8'); else { P(hx0 + 3, hy + 1, 2, 2, '#2a6a3a'); P(hx0 + 2, hy + 2, 4, 1, '#1a3a1a'); px(hx0 + 10, hy - 4 + Math.round(Math.sin(t * 2) * 2), '#bff8ff'); px(hx0 + 12, hy - 7, '#bff8ff'); } }); },
  };
  // ======================= розміри: [W, H, масштаб] =======================
  // масштаб .75 — HD-піксель, як у Nexi: у кімнаті герої того самого розміру, що й до кроку 16 (36×44 × 1)
  const SIZE = { kolobok: [48, 58, .6], cheshire: [32, 24, .82], pussBoots: [48, 58, .64], dwarf: [48, 58, .58], firebird: [48, 58, .7], gorynych: [48, 58, .8], genie: [48, 58, .8] };
  const size = id => SIZE[id] || [W, H, .75];
  /** Контур: темний, з відтінком сусіднього кольору (червона накидка — темно-червоний край, а не чорний). */
  function outline(cv, rgb = [20, 10, 40]) {
    const Wc = cv.width, Hc = cv.height, c = cv.getContext('2d', { willReadFrequently: true }), id = c.getImageData(0, 0, Wc, Hc), d = id.data, op = new Uint8Array(Wc * Hc);
    for (let i = 0; i < op.length; i++) op[i] = d[i * 4 + 3] > 40 ? 1 : 0;
    for (let yy = 0; yy < Hc; yy++) for (let xx = 0; xx < Wc; xx++) { const i = yy * Wc + xx; if (op[i]) continue;
      const j = xx > 0 && op[i - 1] ? i - 1 : xx < Wc - 1 && op[i + 1] ? i + 1 : yy > 0 && op[i - Wc] ? i - Wc : yy < Hc - 1 && op[i + Wc] ? i + Wc : -1; if (j < 0) continue;
      d[i * 4] = d[j * 4] * .3 + rgb[0] * .7; d[i * 4 + 1] = d[j * 4 + 1] * .3 + rgb[1] * .7; d[i * 4 + 2] = d[j * 4 + 2] * .3 + rgb[2] * .7; d[i * 4 + 3] = 255; }
    c.putImageData(id, 0, 0);
  }
  function draw(id, pose, fr, t, cv, g = {}) {
    const [Wd, Hd] = size(id); if (id === 'cheshire') { D.cheshire(pose, fr, t, g, cv); if (g.look && LOOK.cheshire) { LOOK.cheshire(pose, fr, t, g); outline(cv); } return cv; }   // свій контур — у drawCat
    canvasFor(cv, Wd, Hd); (D[id] || D.dwarf)(pose, fr, t, g); if (g.look && LOOK[id] && g.look !== 'swim') LOOK[id](pose, fr, t, g); outline(cv); return cv;
  }
  // ======================= кеш кадрів =======================
  // HD-герой — ~500–650 прямокутників на кадр (~0.25 мс), тож готові кадри бережемо: ключ — герой, поза, крок (лише хода),
  // фаза анімації, ніс, черевичок. Пози, що не залежать від часу, — один кадр на крок; живі (мітла, димок, блискітки, крила,
  // хвіст…) — петля з N фаз по R на секунду (ANIM). Кеш спільний, щонайбільше CAP кадрів (давні — геть).
  const ANIM = { _: { R: 6, N: 12, p: ['cheer'] }, babaYaga: { R: 12, N: 24, p: ['sweep', 'cheer'] }, dwarf: { R: 4, N: 2, p: 'all' }, pussBoots: { R: 6, N: 12, p: 'all' },
    quixote: { R: 8, N: 16, p: ['fall', 'cheer'] }, sherlock: { R: 6, N: 12, p: 'all' }, mavka: { R: 8, N: 16, p: 'all' }, cinderella: { R: 10, N: 20, p: 'all' },
    merlin: { R: 8, N: 16, p: ['cast', 'cheer'] }, genie: { R: 12, N: 24, p: 'all' }, silver: { R: 12, N: 12, p: ['dig', 'cheer'] }, gorynych: { R: 8, N: 16, p: 'all' },
    firebird: { R: 12, N: 24, p: 'all' }, kolobok: { R: 12, N: 24, p: ['roll', 'walk', 'run'] }, bartender: { R: 8, N: 16, p: ['shake', 'pour', 'wipe', 'stand'] } };
  const CACHE = new Map(), CAP = 160, CHC = document.createElement('canvas');
  /** Готовий кадр (полотно) — з кешу або намальований. Чеширський кіт дешевий і зникає за 7-секундним циклом — без кешу. */
  function frame(id, pose, fr, t, g = {}) {
    if (id === 'cheshire') return draw(id, pose, fr, t, CHC, g);
    const A = ANIM[id] || ANIM._, live = A.p === 'all' || A.p.includes(pose), ph = live ? Math.floor(t * A.R) % A.N : 0, walk = pose === 'walk' || pose === 'run';
    const key = id + '|' + pose + '|' + (walk ? fr % 4 : 0) + '|' + ph + '|' + (g.nose ? Math.round(g.nose) : 0) + '|' + (g.lostShoe ? 1 : 0) + '|' + (g.look || '');
    let cv = CACHE.get(key); if (cv) { CACHE.delete(key); CACHE.set(key, cv); return cv; }
    cv = draw(id, pose, walk ? fr % 4 : 0, live ? ph / A.R : .5, document.createElement('canvas'), Object.assign({}, g, { nose: g.nose ? Math.round(g.nose) : 0 }));
    CACHE.set(key, cv); if (CACHE.size > CAP) CACHE.delete(CACHE.keys().next().value); return cv;
  }

  // ======================= речі на підлозі (prop) =======================
  const PROP = [24, 16, .73];                                                                       // сітка й масштаб (у кімнаті — як до кроку 16: 16×12 × 1.1)
  /** Малюнок речі в полотно 24×16 (низ — нижній рядок). */
  function drawProp(type, t, cv) {
    canvasFor(cv, PROP[0], PROP[1]); const gl = (Math.sin(t * 4) + 1) / 2;
    if (type === 'chest') {                                                                         // скриня з золотом: дошки, оковка, замок, монети
      blk(3, 7, 18, 9, '#8a4a1a', 1); for (let y = 9; y < 15; y += 2) P(4, y, 16, 1, '#6a3410'); P(3, 10, 18, 1, '#ffd27a'); P(3, 7, 2, 9, '#c8a050'); P(19, 7, 2, 9, '#c8a050');
      P(10, 9, 4, 4, '#ffd27a'); px(11, 10, '#5a3a10'); px(11, 11, '#5a3a10');                    // замок
      spans(3, 2, [[2, 14], [0, 18], [0, 18], [0, 18]], '#a8602a'); P(5, 2, 14, 1, '#c8803a'); P(3, 5, 18, 1, '#ffd27a');   // віко
      [[5, 5], [8, 4], [12, 4], [16, 5]].forEach(([a, b]) => { disc(a, b + 1, 1, '#ffd23a'); px(a, b, '#fff6b0'); }); star(Math.round(6 + gl * 10), 3, gl > .5 ? '#ffffff' : '#fff0a0');
    } else if (type === 'gift') {                                                                   // подарунок: коробка, стрічка, бант, бирка
      blk(5, 6, 14, 10, '#d0222e', 1); P(11, 6, 2, 10, '#ffd27a'); P(5, 10, 14, 2, '#ffd27a'); px(11, 6, '#fff0a0');
      spans(6, 2, [[0, 3], [0, 4], [1, 4]], '#ffd27a'); spans(13, 2, [[2, 3], [1, 4], [0, 4]], '#ffd27a'); P(10, 4, 4, 2, '#e8b030');   // бант
      P(17, 12, 4, 3, '#f4f0e8'); px(16, 12, '#c8c0b0'); star(Math.round(7 + gl * 9), 8, gl > .6 ? '#ffffff' : '#ffe0e0', 0);
    } else if (type === 'shoe') {                                                                   // кришталевий черевичок з гранями
      spans(4, 10, [[0, 13], [0, 15], [1, 14], [2, 11]], '#cfeaff'); spans(14, 4, [[1, 3], [0, 4], [0, 4], [0, 4], [0, 4], [0, 4]], '#cfeaff');
      P(5, 10, 10, 1, '#ffffff'); P(15, 5, 1, 6, '#ffffff'); P(6, 12, 8, 1, '#9ad0f0'); P(17, 7, 1, 5, '#9ad0f0'); P(4, 13, 4, 1, '#7ab8e0');
      if (gl > .5) star(9, 11, '#ffffff'); else star(16, 6, '#ffffff', 0);
    } else if (type === 'feather') {                                                                // перо Жар-птиці: стрижень, вогняні волокна, «око», сяйво
      for (let i = 0; i < 17; i++) { const u = i / 16, cx = 3 + i, cy = 12 - Math.sin(u * Math.PI * .8) * 4, w = 1 + Math.sin(u * Math.PI) * 3;   // опахало ширшає до середини
        P(cx, cy - w, 1, w * 2 + 1, u < .35 ? '#ff3a2a' : u < .7 ? '#ff8a2a' : '#ffc83a'); px(cx, cy - w, u < .5 ? '#ff7a4a' : '#ffe27a'); if (i % 3 === 1) px(cx, cy + w, '#c8401a'); }
      line(3, 12, 19, 9, '#fff0a0'); rod(3, 12, 0, 15, '#c86a1a', 1);                                                      // стрижень
      disc(19, 8, 2, '#ff4ac8'); P(18, 7, 3, 3, '#ffd04a'); px(19, 8, '#ffffff'); if (gl > .4) star(11, 6, '#fff8c0', 0);   // «око» на кінці
    } else if (type === 'lamp') {                                                                   // чарівна лампа: носик, кришечка, ручка, димок
      spans(5, 8, [[3, 10], [1, 14], [0, 16], [1, 14], [4, 8]], '#e8b030'); P(6, 8, 10, 1, '#ffd86a'); P(4, 13, 14, 1, '#a87010');
      rod(19, 10, 23, 7, '#e8b030', 2); rod(5, 9, 1, 11, '#c89020', 2); px(1, 12, '#c89020'); P(9, 6, 5, 2, '#ffd86a'); px(11, 5, '#fff0a0');   // носик, ручка, кришечка
      P(8, 15, 7, 1, '#a87010'); for (let i = 0; i < 3; i++) px(22 + Math.round(Math.sin(t * 3 + i) * 1), 5 - i * 2, i % 2 ? '#d4b8ff' : '#b48aff');
    }
    outline(cv); return cv;
  }
  /** Образ кожного героя після його сценки на справжній вечірці (party_show.js). */
  const LOOKS = { babaYaga: 'swim', snowWhite: 'swim', cinderella: 'swim', pinocchio: 'burnt', redHood: 'purple', dwarf: 'bowl', whiteRabbit: 'knot', pussBoots: 'socks', quixote: 'bucket', sherlock: 'lamp', robinHood: 'arrow', mavka: 'swim', stNicholas: 'hawaii', merlin: 'pink', genie: 'hat', tinMan: 'confetti', silver: 'disco', cheshire: 'dress', kolobok: 'choco', firebird: 'wet', gorynych: 'hats' };
  return { draw, frame, size, drawProp, PROP, LOOKS };
})();

/* ============================================================================
 * objects/wing_kit.js — КОНСТРУКТОР ЛІВОГО КРИЛА (спільні деталі для трьох зон)
 * ----------------------------------------------------------------------------
 * Усе ліве крило (AI-центр, аналітика, маркетинг, полиці, рослини) намальоване
 * кодом з одного набору деталей, тому виглядає як одна кімната:
 *   brick(S, box, lights, fx)  — цегляна стіна з теплими/холодними відсвітами; fx — фактура, запечена в растр:
 *                                м'які тіні від будки/полиць/гаджетів, патьоки, плями, кіптява, тріщини
 *   contact / contacts         — тінь контакту на видимому верху стільниці (під усім, що стоїть на столі)
 *   snap / gloss / deskShine   — глянець верху: віддзеркалення речей (запікається), живі відблиски на губі скла
 *   wire / underLive           — кабелі на столі й за столом (лоток, пучки, подовжувач, роутер з вогниками)
 *   sticker(S, o)              — наліпка-висічка (логотип N, Nexi, кіт, серце, зірка, блискавка, AI, QR, «!»)
 *   booth(S, spec)             — будка зони: панель з неоновим кантом, вивіска
 *                                з іконкою, ніша з рамками голо-екранів, бічна грань
 *   desk(S, spec)              — стіл: видимий верх, рожева неонова плита, корпус
 *                                із секціями (тумба з шухлядами / ніша / шафка / опора)
 *   plant(spec)                — рослина піксель-артом v3: монстера на черешках з розрізами, пір'ясті
 *                                вайї папороті, арека з тростинами, сансев'єра, ліана з кроною, неонова,
 *                                бонсай; горщик navy / terra / chrome / glass -> спрайт. АВТОПІДГОНКА:
 *                                рослина масштабується від основи, щоб жоден листок не обрізався
 *   sway(c, sp, x, y, t, ph, shake) — малює спрайт рослини: верх гойдається, горщик стоїть
 *   sign(c, x, y, w, h, o)     — вивіска зони в ЄДИНОМУ стилі (AI-центр, аналітика, маркетинг)
 *   gadget(kind) / lamp(kind)  — штучки на полички (голо-куб, куля, дрон, тераріум, робот,
 *                                колонка) і лампи (Едісона, китайський ліхтар): растр + live();
 *                                live(c, x, y, t, lvl) — колонка грає / лампа Едісона спалахує, коли Nexi
 *                                працює в зоні (№8, objects/wing_react.js; там же K.soundFx — звук колонок)
 *   coreGeom / corePC / coreLive — системний блок AI-ядра зі скляною панеллю і живою начинкою
 *   screenBg / noise / rgba / lit    — дрібниці для живих екранів
 *   trinkets / trinketsLive / stuck  — ДРІБНИЦІ НА СТОЛАХ (папери, стікери, ручки, навушники,
 *                                телефон, мишка) — окремий файл objects/wing_trinkets.js
 * Координати — одиниці кімнати; растри — 4 px/од. (NX.furn.Sheet).
 * ========================================================================== */
NX.kit = (() => {
  const P = NX.px, F = NX.furn, { NAVY, PINK, CYAN, HOLO, DESK, LIL, CHROME, OUT } = F.PAL, ramp = F.ramp, hash = NX.art.hash;
  const BRK = ['#0c0719', '#150b28', '#1e1138', '#28174a', '#341d5c', '#42256e', '#542f86', '#6a3c9a'];
  const SLAB = ['#3a0e5b', '#4d0d6e', '#5b0775', '#6d058a', '#850498', '#ac14b9', '#b317bd', '#cb53cb', '#e07ae0'];
  const GREEN = ['#04140f', '#07241a', '#0c3626', '#124a34', '#1a6244', '#237e56', '#2f9c66', '#48bc7a'];
  const GREEN2 = ['#06201a', '#0c3224', '#164a34', '#1f6644', '#2c8656', '#3fa868', '#66c884'];
  const SAGE = ['#13332c', '#1e4a3e', '#2b6652', '#3d8a66', '#58ac7e', '#86cc9a'];
  const POT = ['#0d0828', '#1a1046', '#2a1860', '#3b2480', '#4f31a0', '#6a48c0'];
  const TERRA = ['#2a1208', '#4a2010', '#6e3418', '#8e4a22', '#b06430', '#d08a4a'];
  const rgba = (rgb, a) => `rgba(${rgb},${P.clamp(a, 0, 1)})`, lit = (c, x, y, w, h, col) => { c.fillStyle = col; c.fillRect(x, y, w, h); };
  const noise = (t, i) => .5 + .26 * Math.sin(t * 1.3 + i * 1.7) + .16 * Math.sin(t * 2.9 + i * 3.1) + .08 * Math.sin(t * 5.3 + i * .7);
  // змішування кольорів (той самий результат, але без розбору рядків щоразу: кольори кешуються — цегла будується швидше)
  const RGBC = new Map(), HEX2 = Array.from({ length: 256 }, (_, v) => v.toString(16).padStart(2, '0'));
  const rgbOf = h => { let c = RGBC.get(h); if (!c) { c = [parseInt(h.slice(1, 3), 16), parseInt(h.slice(3, 5), 16), parseInt(h.slice(5, 7), 16)]; RGBC.set(h, c); } return c; };
  const mix = (a, b, k) => { if (k <= 0) return a; if (k >= 1) return b; const A = rgbOf(a), B = rgbOf(b); return '#' + HEX2[Math.round(A[0] + (B[0] - A[0]) * k)] + HEX2[Math.round(A[1] + (B[1] - A[1]) * k)] + HEX2[Math.round(A[2] + (B[2] - A[2]) * k)]; };

  // ---------- фактура стіни: шум, м'які тіні, патьоки ----------
  const LAT = Float32Array.from({ length: 4096 }, (_, n) => hash(n & 63, n >> 6));                       // решітка шуму 64×64 (рахується раз)
  const vn = (x, y) => { const xi = Math.floor(x), yi = Math.floor(y), fx = x - xi, fy = y - yi, sx = fx * fx * (3 - 2 * fx), sy = fy * fy * (3 - 2 * fy), L = (a, b) => LAT[(a & 63) + ((b & 63) << 6)];
    const a = L(xi, yi), b = L(xi + 1, yi), c = L(xi, yi + 1), d = L(xi + 1, yi + 1); return a + (b - a) * sx + (c - a) * sy + (a - b - c + d) * sx * sy; };
  /** Межі впливу відсвіту / тіні — щоб далекі пікселі пропускати одразу. */
  const bbOf = h => { if (h.box) { const r = h.r || 0, dx = h.dx || 0, dy = h.dy || 0; return [h.box[0] + dx - r, h.box[1] + dy - r, h.box[2] + dx + r, h.box[3] + dy + r]; }
    if (h.ell) return [h.ell[0] - h.ell[2], h.ell[1] - h.ell[3], h.ell[0] + h.ell[2], h.ell[1] + h.ell[3]];
    if (h.band) return [h.x0, h.y - h.r, h.x1, h.y + h.r]; return [h.x - h.r, h.y - h.r, h.x + h.r, h.y + h.r]; };
  /** М'яка тінь на стіні в точці (X, Y) — найсильніша з переліку:
   *    {box:[x0,y0,x1,y1], dx, dy, r, k} — від прямокутника (будка, полиця, стелаж, труба, постер): зсунута на (dx, dy), розмита на r
   *    {ell:[cx,cy,rx,ry], k}            — від предмета неправильної форми (гаджет, рослина) */
  function shadeAt(X, Y, list) {
    let s = 0;
    for (const h of list) {
      const b = h.bb; if (X < b[0] || X > b[2] || Y < b[1] || Y > b[3]) continue;
      let v;
      if (h.box) { const [a, c0, c1, e] = h.box, dx = h.dx || 0, dy = h.dy || 0, d = Math.hypot(Math.max(a + dx - X, 0, X - c1 - dx), Math.max(c0 + dy - Y, 0, Y - e - dy)); v = d >= h.r ? 0 : (1 - d / h.r) ** 2; }
      else { const [cx, cy, rx, ry] = h.ell, q = ((X - cx) / rx) ** 2 + ((Y - cy) / ry) ** 2; v = q >= 1 ? 0 : (1 - q) ** 1.5; }
      if (v * h.k > s) s = v * h.k;
    }
    return s;
  }
  /** Патьоки {x, y, len, w, k, rust}: тонка смуга донизу від труби / полиці / ліхтаря — звужується, згасає, трохи петляє.
   *  Повертає силу; іржаву частку кладе в DRIP.rust (без нових масивів на кожен піксель). */
  const DRIP = { rust: 0 };
  function dripAt(X, Y, list) {
    let s = 0; DRIP.rust = 0;
    for (const d of list) {
      if (Y < d.y || Y > d.y + d.len || X < d.x - d.w - 1.5 || X > d.x + d.w + 1.5) continue;
      const t = (Y - d.y) / d.len, cx = d.x + .5 * Math.sin(Y * .23 + d.x) * t, q = Math.abs(X - cx) / (d.w * (1 - t * .55)); if (q >= 1) continue;
      const v = (1 - q * q) * (1 - t) ** .9 * d.k; if (v > s) { s = v; DRIP.rust = d.rust ? v : 0; }
    }
    return s;
  }
  /** Цегла (темна, залита неоном — як на картинці): box = [x0,y0,x1,y1]; lights — відсвіти:
   *    {x,y,r,k,col}            — точкове джерело (ліхтар — теплий col, екран — синій)
   *    {band:1,x0,x1,y,r,k,col} — смуга (рожева плита стола світить на стіну над собою)
   *    {box:[x0,y0,x1,y1],r,k,col} — сяйво навколо прямокутника (великий екран, будка)
   *  fx — фактура (усе запікається в растр один раз, кадр не дорожчає):
   *    shades — м'які тіні від предметів (shadeAt), drips — патьоки (dripAt),
   *    stains 0..1 — старі плями з темнішим «берегом» і сольові розводи внизу,
   *    grime — кіптява під стелею й у лівому куті, cracks — частка цеглин з тріщиною / вибитим кутом. */
  function brick(S, [x0, y0, x1, y1], lights = [], fx = {}) {
    lights.forEach(L => { L.bb = bbOf(L); });
    const shades0 = (fx.shades || []).map(h => ({ ...h, bb: bbOf(h) })), drips0 = (fx.drips || []).map(d => ({ ...d, bb: [d.x - d.w - 1.5, d.y, d.x + d.w + 1.5, d.y + d.len] })), st = fx.stains || 0, cr = fx.cracks || 0;
    // сітка 16×16 од.: для кожної клітинки — лише ті відсвіти / тіні / патьоки, що її торкаються (швидше в рази)
    const G = 16, nx = Math.ceil((x1 - x0) / G) + 1, ny = Math.ceil((y1 - y0) / G) + 1, cells = k => Array.from({ length: nx * ny }, () => []);
    const fill = (grid, list) => { list.forEach(h => { const b = h.bb; for (let cy = Math.max(0, Math.floor((b[1] - y0) / G)); cy <= Math.min(ny - 1, Math.floor((b[3] - y0) / G)); cy++) for (let cx = Math.max(0, Math.floor((b[0] - x0) / G)); cx <= Math.min(nx - 1, Math.floor((b[2] - x0) / G)); cx++) grid[cx + cy * nx].push(h); }); return grid; };
    const LG = fill(cells(), lights), SG = fill(cells(), shades0), DG = fill(cells(), drips0);
    S.rect(x0, y0, x1, y1, (u, v, i, j, X, Y) => {
      const cell = Math.min(nx - 1, Math.floor((X - x0) / G)) + Math.min(ny - 1, Math.floor((Y - y0) / G)) * nx, lights = LG[cell], shades = SG[cell], drips = DG[cell];
      const row = Math.floor(Y / 7), bx = (((X + (row & 1) * 7) % 14) + 14) % 14, by = ((Y % 7) + 7) % 7;
      const id = Math.floor((X + (row & 1) * 7) / 14) * 31 + row, mortar = bx < .8 || by < .6;
      let q = (mortar ? .02 : .11 + hash(id, 7) * .13 + (by < 1.4 ? .07 : by > 6.2 ? -.05 : 0) + (bx < 1.6 ? .03 : 0)), col = null, ck = 0;
      for (const L of lights) {
        const b = L.bb; if (X < b[0] || X > b[2] || Y < b[1] || Y > b[3]) continue;
        let d;
        if (L.band) d = (X >= L.x0 && X <= L.x1) ? Math.max(0, 1 - Math.abs(Y - L.y) / L.r) : 0;
        else if (L.box) { const [a, b2, c2, e] = L.box; d = Math.max(0, 1 - Math.hypot(Math.max(a - X, 0, X - c2), Math.max(b2 - Y, 0, Y - e)) / L.r); }
        else d = Math.max(0, 1 - Math.hypot(X - L.x, Y - L.y) / L.r);
        d = d * d * L.k; q += d * (mortar ? .4 : 1); if (L.col && d > ck) { ck = d; col = L.col; }
      }
      // фактура — ПІСЛЯ відсвітів і множенням, щоб читалась і там, де цеглу заливає неон
      if (st) {                                                                                             // старі плями з темнішим «берегом», сольові розводи внизу
        const n = vn(X / 34, Y / 24) * .65 + vn(X / 11 + 7.3, Y / 8 + 3.1) * .35;
        if (n > .58) q *= 1 - (Math.min(.32, (n - .58) * 1.4) + (n < .605 ? .14 : 0)) * st;
        if (Y > 200 && vn(X / 9 + 31, Y / 5 + 17) > .78) q += (mortar ? .1 : .05) * st;
      }
      if (fx.grime) { if (Y < 16) q *= 1 - (1 - Y / 16) ** 2 * .45; if (X < 9) q *= 1 - (1 - X / 9) ** 2 * .35; }   // кіптява під стелею і в куті
      if (cr && !mortar) {                                                                                  // пошкоджені цеглини: тріщина навскіс або вибитий кут
        if (hash(id, 13) < cr && bx > 1.6 && bx < 12.4 && Math.abs(by - (1.4 + (bx - 1.6) * .42 + .55 * Math.sin(bx * 2.1 + id))) < .5) q *= .2;
        else if (hash(id, 17) < cr && bx + by < 3.8) q = bx + by > 3.1 ? q + .12 : q * .35;
      }
      const sh = shades.length ? shadeAt(X, Y, shades) : 0, dr = drips.length ? dripAt(X, Y, drips) * 1.25 : 0, dk = Math.min(.88, Math.max(sh, dr)), rust = dr ? DRIP.rust * 1.25 : 0;
      if (dk > 0) { q = q * (1 - dk * .72) - dk * .04; ck *= 1 - dk * .4; }                               // тінь / патьок: темніше, але колір відсвіту лишається
      let out = ramp(BRK, q, i, j, mortar ? 0 : .22); if (col) out = mix(out, col, Math.min(.6, ck * 1.1));
      return rust > .03 ? mix(out, '#3a1a14', Math.min(.55, rust)) : out;                                  // іржаві патьоки під трубою
    });
  }
  /** Тінь контакту на видимому верху стільниці D (піксель-арт, по краю — розсипом): предмет x0..x1 стоїть на лінії y. */
  const dz = (i, j) => NX.art.BAYER[(j & 3) * 4 + (i & 3)] + .5;
  function contact(S, D, x0, x1, y, k = .85) {
    const cx = (x0 + x1) / 2, rx = (x1 - x0) / 2 + 2, ry = 2.3;
    S.rect(x0 - 2.1, y - 2.6, x1 + 2.1, y, (u, v, i, j, X, Y) => {
      if (Y < D.back + .25) return null;
      const q = ((X - cx) / rx) ** 2 + ((Y - y + .25) / ry) ** 2; if (q >= 1) return null;
      const a = k * (1 - q * q); if (a < dz(i, j) * .3) return null;
      S.r.set(i, j, '#020008', Math.min(.82, a)); return null;
    });
  }
  /** Тіні контакту списком [[x0, x1, y, k?], ...] — для речей, що вже стоять на столі (горнята, лампа, бази ноутбуків...). */
  const contacts = (S, D, list) => list.forEach(([a, b, y, k]) => contact(S, D, a, b, y, k));

  /** Будка зони. spec: {x0,y0,x1,y1, acc:[dark,mid,bright,hi], sign:[x0,y0,x1,y1], icon:[cx,cy], screens:[[x0,y0,x1,y1],...], side:f}
   *  Повертає нічого — малює в аркуш S. Вивіска порожня (напис — живий, мовою глядача). */
  function booth(S, sp) {
    const { x0, y0, x1, y1, acc } = sp, f = sp.side === undefined ? .03 : sp.side;
    if (f) { const a = F.toVP(x1, y0 + 6, f), b = F.toVP(x1, y1, f); S.poly([[x1 - .5, y0 + 6], a, b, [x1 - .5, y1]], (u, v, i, j) => u > .8 ? acc[1] : ramp(NAVY, .28 - v * .18, i, j)); }   // бічна грань — до вікна
    S.rr(x0, y0, x1, y1, [6, 6, 1.5, 1.5], (d, u, v, i, j, X, Y) => {
      if (d < .7) return acc[1]; if (d < 1.6) return acc[3]; if (d < 2.3) return acc[1];                      // неоновий кант
      if (d < 3.6) return v < .5 ? NAVY[6] : NAVY[4];
      if (X < x0 + 11) return Math.abs(X - (x0 + 9.5)) < .5 ? NAVY[6] : (Math.abs(X - (x0 + 6)) < .8 && ((Y | 0) % 18 === 3) ? acc[2] : ramp(NAVY, .3 - v * .14, i, j, .12));   // ліва планка з вогниками
      return ramp(NAVY, .42 - v * .22, i, j, .12);
    });
    // вивіска малюється живою (K.sign) — у єдиному стилі з AI-центром
    const scr = sp.screens, nx0 = Math.min(...scr.map(s => s[0])) - 4, ny0 = Math.min(...scr.map(s => s[1])) - 4, nx1 = Math.max(...scr.map(s => s[2])) + 4, ny1 = Math.max(...scr.map(s => s[3])) + 4;
    S.rr(nx0, ny0, nx1, ny1, 2, (d, u, v, i, j) => d < .7 ? NAVY[0] : ramp(NAVY, .14, i, j));                // ніша
    for (const [a, b, c2, e] of scr) S.rr(a - 2.4, b - 2.4, c2 + 2.4, e + 2.4, 2.4, (d, u, v, i, j) => d < .6 ? '#06102e' : d < 1.4 ? acc[1] : d < 2.4 ? acc[3] : d < 3 ? acc[2] : ramp(HOLO, .6 - v * .3, i, j));   // рамки екранів (товсті, як на картинці)
    S.rect(nx0 + 3, ny1 + 2, nx1 - 3, ny1 + 4, (u, v) => v < .5 ? NAVY[0] : NAVY[3]);                         // планка під екранами
  }

  /** Стіл. spec: {l, r, top (передній край верху = верх плити), slab (низ плити), bot (підлога), back (задній край верху),
   *  sec: [{a,b,kind:'drawers'|'core'|'leg'|'niche'}], warm: x від якого плита тепліша, end: 'none'|'right',
   *  refl: [[x0, x1, колір, сила]] — віддзеркалення яскравого позаду (екранів, будки) на глянцевому верху,
   *  under: [{tray:[x0,x1], drops:[x...], strip:[x0,x1], router:[x0,x1]}] — кабелі за столом у нішах (лоток, пучки, подовжувач)} */
  function desk(S, sp) {
    const { l, r, top, slab, bot, back } = sp, o = OUT, NV = ['#02010a', '#05041a', '#080a2a', '#0d143c', '#121d50', '#182866', '#20357c', '#2a4494'];
    const secAt = X => sp.sec.find(s => X >= s.a && X < s.b);
    S.rect(l, slab, r, bot, (u, v, i, j, X, Y) => {
      const s = secAt(X), d = (Y - slab) / (bot - slab);
      if (!s || s.kind === 'niche') {                                                                          // ніша: тінь під плитою, задня стінка з рейками, LED, цоколь
        if (Y < slab + 2) return NV[0];
        if (Y < bot - 10) return ((X - l) % 12 + 12) % 12 < .8 ? NV[3] : ramp(['#030112', '#05031c', '#080526', '#0b0730'], .15 + d * .6, i, j, .1);
        if (Y < bot - 9) return '#123a6a';
        return ramp(['#04021a', '#0a0628', '#120a36', '#1a0f46'], .2 + (Y - bot + 9) / 9 * .6, i, j, .15);
      }
      const { a, b } = s, du = X - a, dw = b - X;
      if (du < .5 || dw < .5) return o;
      if (Y > bot - 4) return s.kind === 'leg' ? (Y > bot - .8 ? o : ramp(CHROME, .75 - (Y - bot + 4) * .15, i, j)) : (Y > bot - .6 ? o : Y < bot - 3.2 ? CHROME[2] : NV[1]);   // п'ята / цоколь
      if (s.kind === 'drawers') {
        const n = s.rows || 3, h = (bot - 4 - slab - 6) / n, k = Math.floor((Y - slab - 6) / h), p = slab + 6 + k * h, q = p + h - 1.5;
        if (Y < slab + 6) return NV[2]; if (k < 0 || k >= n || Y >= q) return NV[0];
        const dv = Y - p, cy = (p + q) / 2;
        if (dv < .5) return NV[7]; if (dw < 1.4) return NV[0]; if (du < 1.4) return NV[6];
        if (dv > .9 && dv < 1.6 && du > 3 && dw > 3) return k % 2 ? '#ff4fd8' : '#3be8ff';                                          // LED-смужка шухляди (як на картинці)
        if (Math.abs(Y - cy) < 1 && Math.abs(X - (a + b) / 2) < (b - a) * .3) return Math.abs(Y - cy) < .4 ? '#000006' : NV[1];     // ручка-паз
        if (Math.abs(Y - cy + 1.5) < .4 && Math.abs(X - (a + b) / 2) < (b - a) * .3) return NV[6];
        return ramp(NV, .78 - dv / (q - p) * .35 + (1 - du / (b - a)) * .1, i, j, .12);
      }
      if (s.kind === 'core') return du < 1.6 || dw < 1.6 || Y < slab + 1.6 || Y > bot - 5.6 ? ramp(CHROME, .5 - d * .3, i, j) : NV[1];   // системний блок: корпус (начинка — corePC нижче)
      // опора: хромована рама (дві стійки + перекладини), всередині неонова трубка
      const cx = (a + b) / 2, hw = (b - a) / 2, st = Math.abs(X - cx) > hw - 4.5, tube = Math.abs(X - cx) < 1.6, mid = (slab + bot) / 2, bar = Math.abs(Y - mid + 8) < 1.7 || Math.abs(Y - mid - 8) < 1.7;
      if (st) return ramp(CHROME, .8 - Math.abs(Math.abs(X - cx) - (hw - 2.2)) * .35 - d * .3, i, j);
      if (bar) return ramp(CHROME, .7 - d * .2, i, j);
      if (tube) return Math.abs(X - cx) < .7 ? '#dff8ff' : '#3be8ff';
      return null;
    });
    sp.sec.filter(s => s.kind === 'core').forEach(s => corePC(S, coreGeom(s.a, s.b, slab, bot)));
    (sp.under || []).forEach(u => underCables(S, sp, u));                                                      // кабелі за столом (№3)
    // плита: світла кромка, рожевий перелив; видимий верх — темне скло з відблиском
    S.rr(l, top, r, slab, [2, 2, 2, 2], (d, u, v, i, j, X, Y) => {
      const k = sp.warm ? P.clamp((X - sp.warm) / 70, 0, 1) : 0, dy = Y - top;
      if (d < .5) return o;
      if (dy < 1.3) return k > .5 ? '#ffe2ee' : '#ffd4ff';
      if (dy < 2.2) return k > .5 ? '#f6a0c0' : SLAB[8];
      if (sp.sec.some(s => s.kind !== 'niche' && Math.abs(X - s.a) < .45 && s.a > l + 1)) return SLAB[2];
      const q = 1 - (dy - 2.2) / (slab - top - 2.2), n = SLAB.length - 1, idx = P.clamp(Math.round(q * .95 * n + NX.art.BAYER[(j & 3) * 4 + (i & 3)] * .9), 0, n);
      return mix(SLAB[idx], ['#5a1440', '#8e286a', '#a52174', '#c32988', '#d73f90', '#e45f8c', '#ee7aa4', '#f6a0c0', '#ffc8dc'][idx], k);
    });
    // видимий верх (№3 — ширший): темне скло — найтемніше біля стіни, глибший перелив до краю, м'які діагональні відблиски,
    // віддзеркалення яскравого позаду (sp.refl); біля переднього краю — «губа» скла з відблиском і тоненька тінь за нею
    const dep = top - back;
    S.rect(l, back, r, top, (u, v, i, j, X, Y) => {
      const dy = top - Y, db = Y - back;
      if (db < .55) return '#060313';                                                                            // стик зі стіною
      if (dy < .45) return '#9a70c8';                                                                            // губа скла ловить світло
      if (dy < .8) return '#140820';
      let q = .06 + Math.min(1, db / (dep - .8)) * .8; if (((X * .7 + db * 1.8) | 0) % 23 === 0) q += .16;      // перелив до краю, діагональні відблиски
      let col = ramp(TOPC, q, i, j, .1);
      for (const R of sp.refl || []) if (X >= R[0] && X < R[1]) { const a = R[3] * Math.max(0, 1 - Math.abs(db / dep - .5) * 1.9) * (1 - Math.abs((X - (R[0] + R[1]) / 2) / ((R[1] - R[0]) / 2)) ** 6); if (a > .02) col = mix(col, R[2], a); }
      return col;
    });
    if (sp.end === 'right') { const a = F.toVP(r, top, .03), b = F.toVP(r, bot - 4, .03); S.poly([[r - .4, top], a, b, [r - .4, bot - 4]], (u, v, i, j, X, Y) => Y < top + 5 ? PINK[3] : ramp(DESK, .3 - v * .2, i, j)); }
  }

  const TOPC = ['#060318', '#0b0730', '#120a36', '#1c0a3c', '#2b0c40', '#3e1048', '#541a56', '#6a2462'];       // глянцевий верх стола
  /** Кабель: темна оболонка + тонкий блік (як усі кабелі крила). pts — ламана в одиницях кімнати. */
  function wire(S, pts, hi = '#2a2454', w = 1.1) {
    for (let k = 1; k < pts.length; k++) S.line(pts[k - 1][0], pts[k - 1][1], pts[k][0], pts[k][1], OUT, w);
    for (let k = 1; k < pts.length; k++) S.line(pts[k - 1][0], pts[k - 1][1] - .25, pts[k][0], pts[k][1] - .25, hi, w * .42);
  }
  /** Кабелі за столом у ніші (№3): сітчастий лоток під плитою з кабелями, пучки донизу, подовжувач і роутер на задній стінці. */
  function underCables(S, sp, u) {
    const { slab, bot } = sp, ty = slab + 1.4, sy = bot - 16.5, ry = bot - 20;
    if (u.tray) {
      const [a, b] = u.tray;
      ['#1a1a3a', '#2a1a4a', '#3be8ff', '#22224a', '#ff4fd8'].forEach((col, k) => S.line(a + 1, ty + 1.2 + k * .62, b - 1, ty + 1.3 + k * .62, k === 2 || k === 4 ? col : OUT, k === 2 || k === 4 ? .32 : .55));   // кабелі в лотку
      S.rect(a, ty, b, ty + 4.4, (uu, vv, i, j, X, Y) => (vv < .14 || vv > .86) ? CHROME[(vv < .5) ? 3 : 1] : (((X - a) % 1.8) < .3 ? CHROME[2] : null));   // дротяний лоток
    }
    const tgt = u.strip ? [(u.strip[0] + u.strip[1]) / 2, sy] : u.router ? [(u.router[0] + u.router[1]) / 2, ry + 3] : null;
    (u.drops || []).forEach((x, n) => {                                                                          // пучки донизу: провисають до подовжувача / роутера
      for (let k = 0; k < 3; k++) {
        const x0 = x + k * .9, y0 = u.tray ? ty + 4.4 : slab + .5, ex = tgt ? tgt[0] - 4 + ((n * 3 + k) % 6) * 1.5 : x0 + 2, ey = tgt ? tgt[1] + .8 : bot - 10, mx = (x0 + ex) / 2 + (k - 1) * 1.6, my = (y0 + ey) / 2 + 4, pts = [];
        for (let q = 0; q <= 10; q++) { const tt = q / 10, a1 = 1 - tt; pts.push([a1 * a1 * x0 + 2 * a1 * tt * mx + tt * tt * ex, a1 * a1 * y0 + 2 * a1 * tt * my + tt * tt * ey]); }
        wire(S, pts, k === 1 ? (n % 2 ? '#7a2a6a' : '#1a5a7a') : '#2a2454', .9);
      }
    });
    if (u.strip) { const [a, b] = u.strip;                                                                       // подовжувач: розетки з вилками, вимикач (світить живим)
      S.rr(a, sy, b, sy + 3.4, .8, (d, uu, vv, i, j, X) => d < .35 ? OUT : vv < .22 ? NAVY[6] : (X > b - 3.4 && X < b - 1.2 && vv > .3 && vv < .75) ? '#3a0a14' : ((((X - a) % 4) > 1.2 && ((X - a) % 4) < 2.8) && vv > .35 && vv < .8 && X < b - 4) ? (((X - a) / 4 | 0) % 2 ? NAVY[0] : CHROME[3]) : ramp(NAVY, .55 - vv * .3, i, j)); }
    if (u.router) { const [a, b] = u.router;                                                                     // роутер з антенами (вогники — живим)
      [a + 2, b - 2].forEach(x => S.line(x, ry, x + (x < (a + b) / 2 ? -1.2 : 1.2), ry - 6, OUT, .8));
      S.rr(a, ry, b, ry + 4.2, 1, (d, uu, vv, i, j) => d < .35 ? OUT : vv > .62 && vv < .82 ? NAVY[0] : ramp(['#0e1236', '#161c4c', '#202a66'], .7 - vv * .4, i, j)); }
  }
  /** Живе під столом: вимикач подовжувача дихає червоним, вогники роутера блимають (швидше, коли Nexi працює). */
  function underLive(c, sp, t, act) {
    const sy = sp.bot - 16.5, ry = sp.bot - 20; c.save(); c.globalCompositeOperation = 'lighter';
    (sp.under || []).forEach((u, n) => {
      if (u.strip) { const x = u.strip[1] - 2.3; lit(c, x - 1, sy + 1.1, 2.2, 1.4, rgba('255,59,90', .55 + .3 * Math.sin(t * 2 + n))); P.glow(c, x, sy + 1.8, 3, 'rgba(255,59,90,.8)', .18); }
      if (u.router) { const [a, b] = u.router; for (let k = 0; k < 4; k++) lit(c, a + 2.2 + k * (b - a - 4.4) / 3 - .4, ry + 2.9, .8, .6, hash(k, Math.floor(t * (3 + act * 8)) + n) > .45 ? ['#3bff8a', '#3be8ff', '#3bff8a', '#ffe27a'][k] : '#0a1a2a'); }
    });
    c.restore();
  }
  /** Віддзеркалення речей на глянцевому верху (№3): кожен стовпчик растра шукає найнижчий піксель речі на верху
   *  (base — копія растра ДО речей: стіл + тіні) і віддзеркалює її донизу до губи скла, згасаючи; через піксель — трохи
   *  слабше (8-bit глянець). Працює для будь-чого, що стоїть на столі, — без окремого коду для кожної речі. */
  const snap = S => S.r.d.slice();
  function gloss(S, D, base, k = .4) {
    const { r, U, x0, y0 } = S, { w, d } = r, jb0 = Math.max(0, Math.ceil((D.back + .6 - y0) / U)), jt = Math.floor((D.top - .8 - y0) / U) - 1;
    const i0 = Math.max(0, Math.floor((D.l - x0) / U)), i1 = Math.min(w, Math.ceil((D.r - x0) / U)), item = n => d[n + 3] && (d[n] !== base[n] || d[n + 1] !== base[n + 1] || d[n + 2] !== base[n + 2] || d[n + 3] !== base[n + 3]);
    for (let i = i0; i < i1; i++) {
      let jb = -1; for (let j = jt; j >= jb0; j--) if (item((j * w + i) * 4)) { jb = j; break; }
      if (jb < 0 || jb >= jt) continue;
      let h = 0; while (h < 6 && jb - h >= jb0 && item(((jb - h) * w + i) * 4)) h++; if (h < 6) continue;   // пласкі речі (кабелі) не віддзеркалюємо
      for (let j = jb + 1, span = jt - jb + 1; j <= jt; j++) {
        const dist = j - jb, sj = jb - dist + 1; if (sj < 0) break;
        const s = (sj * w + i) * 4; if (!item(s)) continue;
        const a = k * (1 - dist / span) ** 1.3 * (((i + j) & 1) ? 1 : .75), n = (j * w + i) * 4;
        d[n] += (d[s] - d[n]) * a; d[n + 1] += (d[s + 1] - d[n + 1]) * a; d[n + 2] += (d[s + 2] - d[n + 2]) * a;
      }
    }
  }
  /** Живий глянець верху (№3): відблиски на губі скла (дихають; один повільно пробігає) і світло живих екранів,
   *  що лягає на верх перед ними. glints: [[x, півширина, rgb]], shine: [[x0, x1, rgb, сила, y — лінія бази]]. */
  function deskShine(c, D, t, glints, shine = []) {
    c.save(); c.globalCompositeOperation = 'lighter';
    shine.forEach(([a, b, rgb, k, y], n) => { const f = k * (.85 + .15 * Math.sin(t * 2.3 + n)); for (let s = 0; s < 3; s++) lit(c, a + s * .8, y + s * (D.top - .8 - y) / 3, b - a - s * 1.6, (D.top - .8 - y) / 3, rgba(rgb, f * (1 - s * .3))); });
    glints.forEach(([x, hw, rgb], n) => { const a = .32 + .22 * Math.sin(t * .9 + n * 1.7); [[1, .35], [.6, .7], [.25, 1]].forEach(([wk, ak]) => lit(c, x - hw * wk, D.top - .5, hw * wk * 2, .45, rgba(rgb, a * ak))); });
    const gx = D.l + (1 - (t * .06) % 1) * (D.r - D.l); lit(c, gx - 4, D.top - .5, 8, .45, 'rgba(235,220,255,.55)'); lit(c, gx - 1.5, D.top - .5, 3, .45, 'rgba(255,255,255,.7)');   // відблиск біжить губою
    c.restore();
  }

  // ---------- рослини v3: природні форми й АВТОПІДГОНКА — жоден листок не обрізаний краєм спрайта ----------
  // Власник: «рослини місцями обрізані та якісь недороблені». Тепер: уся рослина спершу будується як список деталей
  // (листки, стебла, жилки), рахуються її межі, і вона рівномірно масштабується від основи так, щоб уміститися
  // в спрайт w×h з полем; монстера — на черешках, з розрізами й дірками; папороть — пір'ясті вайї без «лусок»;
  // пальма (арека) — тростини, вайї з їхніх верхівок і звислі листочки; ліани — з густою кроною згори.
  const PALS = { green: GREEN, light: GREEN2, sage: SAGE, neon: ['#061a2a', '#0a2e44', '#104a62', '#187086', '#2498a8', '#34c0c8', '#5ae8ff', '#b0f8ff'] };
  /** Листок: спина від base під кутом ang (0 = вгору, + = праворуч), довжина len, ширина w, curl — загин.
   *  kind: 'blade' (вузький: пальма, сансев'єра, листочок папороті), 'heart' (потос), 'round' (хмарка бонсая),
   *        'mon' (монстера: широкий, серцеподібна основа), 'broad'. Повертає {poly, sp} — контур і зразки спини. */
  function leaf(base, ang, len, w, curl, kind, seed) {
    const L = [], R = [], sp = [], n = kind === 'mon' ? 26 : 16;
    for (let k = 0; k <= n; k++) {
      const t = k / n, s = t * len, a = ang + curl * t * t * 1.6, x = base[0] + Math.sin(a) * s, y = base[1] - Math.cos(a) * s;
      let ww = kind === 'blade' ? w * (t < .15 ? t / .15 : 1 - Math.pow((t - .15) / .85, 2.2))
        : kind === 'heart' ? w * (t < .22 ? Math.sqrt(t / .22) : 1 - Math.pow((t - .22) / .78, 1.7))
        : kind === 'round' ? w * Math.sqrt(Math.max(0, 1 - Math.pow(2 * t - 1, 2))) * (.86 + .14 * Math.abs(Math.sin(t * 23 + seed)))
        : kind === 'mon' ? w * (t < .38 ? .6 + .4 * Math.sin(t / .38 * Math.PI / 2) : Math.cos((t - .38) / .62 * Math.PI / 2) ** .75)
        : w * Math.sin(Math.PI * Math.pow(t, .75));
      if (kind === 'blade' && t > .1) ww *= .86 + .14 * Math.abs(Math.sin(t * 40 + seed));                                   // пилчастий край
      const px = Math.cos(a), py = Math.sin(a);
      L.push([x - px * ww / 2, y - py * ww / 2]); R.push([x + px * ww / 2, y + py * ww / 2]); sp.push({ x, y, px, py, hw: ww / 2, t });
    }
    return { poly: L.concat(R.reverse()), sp, len, w, kind, seed };
  }
  /** Листок з простору рослини -> у спрайт: масштаб kx, ky від точки (ax, ay) + зсув dy (контур, спина, ширина). */
  function mapLeaf(lf, M) {
    const { kx, ky, ax, ay, dy } = M, X = x => ax + (x - ax) * kx, Y = y => ay + (y - ay) * ky + dy;
    lf.poly = lf.poly.map(([x, y]) => [X(x), Y(y)]);
    lf.sp = lf.sp.map(q => { const vx = q.px * kx, vy = q.py * ky, l = Math.hypot(vx, vy) || 1; return { x: X(q.x), y: Y(q.y), px: vx / l, py: vy / l, hw: q.hw * l, t: q.t }; });
    const g = Math.sqrt(kx * ky); lf.len *= g; lf.w *= g; return lf;
  }
  /** Заливка листка: тон за положенням на спині (t уздовж, side поперек), жилки, блік, кант; монстера — виїмка,
   *  розрізи й дірки НАСКРІЗЬ (видно, що позаду). Контур — лише навколо самого листка (не в розрізах). */
  function fillLeaf(S, lf, pal, o) {
    const sp = lf.sp, hi = pal[pal.length - 1], W = S.W, H = S.H, idx = [], cols = [];
    const st = S.stamp || (S.stamp = new Int32Array(W * H)), id = S.leafId = (S.leafId || 0) + 1;            // мітки «піксель належить цьому листку» (без Map — швидше)
    S.poly(lf.poly, (u, v, i, j, X, Y) => {
      let best = 0, bd = 1e9;
      for (let k = 0; k < sp.length; k++) { const d = (X - sp[k].x) ** 2 + (Y - sp[k].y) ** 2; if (d < bd) { bd = d; best = k; } }
      const s = sp[best], side = ((X - s.x) * s.px + (Y - s.y) * s.py) / Math.max(.3, s.hw), t = s.t, as = Math.abs(side);
      let q = o.q0 + t * .2 - side * (o.hi ? .16 : -.1) + (as > .8 ? -.12 : 0), vein = false;
      if (o.mon) {                                                                                         // монстера: виїмка біля черешка, розрізи від краю, дірки
        if (t < .1 && as < .26 * (1 - t / .1)) return null;
        for (let k = 0; k < 4; k++) {
          const tk = .25 + k * .16 + (hash(lf.seed, k + (side > 0 ? 9 : 0)) - .5) * .05, tc = tk + (as - .36) * .16;
          if (as > .36 && Math.abs(t - tc) < .022 + (as - .36) * .03) return null;
          if (hash(lf.seed, k * 3 + (side > 0 ? 5 : 2)) > .42 && ((t - tk - .075) / .03) ** 2 + ((as - .19) / .075) ** 2 < 1) return null;
          if (as > .1 && Math.abs(t - tc - .075) < .012) vein = true;
        }
        if (side * (o.hi ? 1 : -1) < -.25 && side * (o.hi ? 1 : -1) > -.48 && t > .2 && t < .72) q += .1;          // глянцевий відблиск уздовж жилки
      }
      if (o.edge && as > .72) return o.edge;                                                                // світлий кант (сансев'єра)
      if (o.bands) q += .14 * Math.sin(t * 18 + lf.seed) - .05;                                              // поперечні смуги
      if (o.cloud) q += .18 * hash(i >> 1, j >> 1) - .09 + (t < .35 ? .12 : 0);                             // хмарка бонсая: зерно
      if (o.vein && as < .1 && t < .92) q += .22;                                                           // центральна жилка
      if (o.vein && !o.mon && lf.kind !== 'blade' && as > .12 && ((t * lf.len + as * lf.w * .35) % 3.4) < .4) q += .09;   // бічні жилки
      if (vein) q += .1;
      if (o.variegate && as < .4 && t > .25 && t < .8) q += .16;                                            // світла середина (потос)
      let col;
      if (o.tip && t > .78) col = hash(i, j) > .3 ? (o.tip === 'pink' ? '#ff7af0' : '#5ae8ff') : hi;       // світні кінчики (неонова)
      else if (o.rim && side < -.6 && (o.hi ? t > .15 : t > .6) && hash(i, j) > .35) col = hash(j, i) > .55 ? '#7ad8ff' : '#a8ecff';   // холодний блік по краю
      else col = ramp(pal, q, i, j, .1);
      const key = j * W + i; st[key] = id; idx.push(key); cols.push(col); return null;
    });
    if (o.outline !== false) {                                                                              // контур: сусіди листка, що йому не належать
      const r = o.thin ? 1 : 2;
      for (const key of idx) { const i = key % W, j = (key - i) / W;
        for (let dj = -r; dj <= r; dj++) { const jj = j + dj; if (jj < 0 || jj >= H) continue;
          for (let di = -r; di <= r; di++) { const ii = i + di; if (di * di + dj * dj > r * r + 1 || ii < 0 || ii >= W) continue; if (st[jj * W + ii] !== id) S.r.set(ii, jj, OUT); } } }
    }
    for (let q = 0; q < idx.length; q++) { const key = idx[q], i = key % W; S.r.set(i, (key - i) / W, cols[q]); }
  }
  /** Рослина -> спрайт {cv, w, h, potTop, hang}. spec: {kind: monstera|fern|palm|sansevieria|vine|neon|bonsai, w, h,
   *  pot: navy|terra|chrome|glass|none, potW, potH, leaves, seed, hang, pal: green|light|sage|neon, neon: колір обідка}.
   *  Деталі (листки, стебла, вайї) збираються списком у «просторі рослини», потім уся рослина рівномірно
   *  масштабується від основи (центр верху горщика; у ліани — верх) так, щоб уміститися в w×h з полем 1.4 од. */
  function plant(sp) {
    const W = sp.w, H = sp.h, seed = sp.seed || 1, pot = sp.pot || 'navy', pw = sp.potW || W * .5, ph = sp.potH || H * .22;
    const potTop = sp.hang ? 0 : H - ph, cx = W / 2, pal = PALS[sp.pal] || (sp.kind === 'neon' ? PALS.neon : GREEN), n = sp.leaves || 7, k0 = sp.kind;
    const ops = [], up = potTop - 1.5, asp = (W - 2.8) / Math.max(1, sp.hang ? H : up), hw = W / 2 - 1.4;   // up — місце над горщиком; asp — ширина/висота; hw — півширина
    /** Довжина вайї, щоб її виліт убік не перевищував півширини спрайта (з запасом на легке стискання). */
    const reach = (len, a, curl, k = 1.2) => Math.min(len, hw * k / Math.max(.35, Math.sin(Math.min(1.57, Math.abs(a) + .9 * Math.abs(curl)))));
    const leafOp = (base, ang, len, w, curl, kind, sd, lp, o, z) => ops.push({ t: 'leaf', base, ang, len, w, curl, kind, sd, pal: lp, o, z });
    const lineOp = (pts, col, w, z, out = true) => ops.push({ t: 'line', pts, col, w, z, out });
    /** Вайя (папороть / пальма): жилка-рахіс і листочки обабіч, коротші до кінчика. z >= 10 — малюється ПОПЕРЕДУ горщика. */
    function frond(base, ang, len, curl, fp, sd, q0, z, style) {
      const palm = style === 'palm', nn = Math.max(8, Math.round(len / (palm ? .95 : 1.2))), pts = [];
      for (let k = 0; k <= nn; k++) { const t = k / nn, s = t * len, a = ang + curl * t * t * 1.6; pts.push({ x: base[0] + Math.sin(a) * s, y: base[1] - Math.cos(a) * s, a, t }); }
      for (let k = 1; k < nn; k++) { const p = pts[k];
        for (const side of [-1, 1]) {
          if (palm) {                                                                                       // арека: довгі вузькі листочки звисають донизу
            const ll = len * .26 * Math.sin(Math.PI * Math.min(1, p.t * 1.05 + .1)) + 1; let la = p.a + side * (.6 + .12 * hash(sd, k)); la += ((la > 0 ? Math.PI : -Math.PI) - la) * .32;
            leafOp([p.x, p.y], la, ll, Math.max(.75, ll * .13), side * .22, 'blade', sd + k * 2 + (side > 0), fp, { q0: q0 + .12 * p.t + (side < 0 ? .08 : -.05), hi: side < 0, rim: side < 0 && hash(k, sd) > .45, outline: false }, z + p.t * .01);
          } else {                                                                                          // папороть: пір'я — листочки під кутом до кінчика
            const ll = len * .2 * Math.sin(Math.PI * Math.min(1, p.t * 1.05 + .08)) + .8;
            leafOp([p.x, p.y], p.a + side * (1.0 + .14 * hash(sd, k)), ll, Math.max(.7, ll * .34), side * .22, 'blade', sd + k * 2 + (side > 0), fp, { q0: q0 + .1 * p.t + (side < 0 ? .1 : -.07), hi: side < 0, rim: side < 0 && hash(k, sd) > .6, outline: false }, z + p.t * .01);
          }
        }
      }
      lineOp(pts.map(p => [p.x, p.y]), fp[Math.min(fp.length - 1, palm ? 3 : 4)], palm ? .6 : .45, z + .02, false);   // рахіс поверх основ листочків
    }
    if (k0 === 'vine') {                                                                                    // потос: густа крона згори (звідки спадає), пасма з серцеподібними листками
      const reach = Math.min(W * .22, 8), xa = reach + 1.5, xb = W - reach - 1.5;
      for (let s = 0; s < n; s++) {
        const x = xa + (xb - xa) * ((s + .5) / n + (hash(seed, s) - .5) * .5 / n), len = H * (.42 + .56 * hash(seed, s + 9)), sw = (hash(seed, s + 3) - .5) * .25, pts = [];
        for (let k = 0; k <= 16; k++) { const t = k / 16; pts.push([Math.min(xb, Math.max(xa, x + Math.sin(t * 5 + s) * 2.2 * t + sw * len * t * .5)), 1.5 + t * (len - 1.5)]); }
        lineOp(pts, pal[3], .8, s * .01 - 1);
        for (let k = 2; k < pts.length; k += 2) { const [lx, ly] = pts[k], side = (k + s) % 4 < 2 ? 1 : -1, sz = Math.min(3.4 + 2.4 * hash(seed, k * 7 + s), W * .13 + 1.2);
          leafOp([lx, ly], side * (1.25 + .3 * hash(seed, k)) + .25, sz * 1.7, sz * 1.1, side * .35, 'heart', k + s * 31, pal, { q0: .42 + .15 * hash(seed, k + s), hi: side < 0, vein: 1, rim: 1, variegate: hash(seed, k * 3 + s) > .5, thin: 1 }, ly / H); }
      }
      const nc = Math.max(3, Math.round(W / 4.2));                                                          // крона: листя звисає з полиці / труби
      for (let q = 0; q < nc; q++) { const x = xa + (xb - xa) * (q + .5) / nc + (hash(seed, q + 60) - .5) * 2, side = q % 2 ? 1 : -1, sz = Math.min(3.8 + 2 * hash(seed, q + 61), W * .14 + 1.4);
        leafOp([x, 1.2 + hash(seed, q + 62) * 2.6], side * (1.85 + .5 * hash(seed, q + 63)), sz * 1.7, sz * 1.1, side * .3, 'heart', 200 + q + seed, pal, { q0: .5 + .15 * hash(seed, q + 64), hi: side < 0, vein: 1, rim: 1, variegate: hash(seed, q + 65) > .6, thin: 1 }, 2 + q * .01); }
    } else if (k0 === 'monstera') {                                                                         // монстера: великі листки з розрізами й дірками на черешках
      const pole = asp < .7, ph2 = up * .86;                                                               // вузьке високе місце — монстера в'ється по кокосовій опорі
      if (pole) {
        const b = [cx, potTop + 1.5], e = [cx + .6, potTop + 1.5 - ph2];
        lineOp([b, e], '#4a2e1a', 2.6, -3);                                                                 // опора: волокниста палиця
        for (let y = e[1] + 1; y < b[1] - 1; y += 1.1) lineOp([[cx - 1.1 + .6 * (1 - (b[1] - y) / ph2), y], [cx + 1.6 - .2 * hash(y, 3), y + .5]], hash(y, 4) > .5 ? '#6a4426' : '#33200f', .35, -2.9, false);
      }
      const spread = P.clamp(asp * 1.5, .45, 1.05);
      for (let q = 0; q < n; q++) {
        const u = n === 1 ? .5 : q / (n - 1), h1 = hash(seed, q), h2 = hash(seed, q + 17), h3 = hash(seed, q + 33), sg = q % 2 ? 1 : -1;
        let b, a0, Lp, z;
        if (pole) {                                                                                         // черешок від опори на своїй висоті, по черзі ліворуч/праворуч
          const hy = (.08 + .9 * (1 - u)) * ph2; b = [cx + .4, potTop + 1.5 - hy]; a0 = sg * (.7 + .5 * h1) - (hy / ph2 - .5) * .2 * sg; Lp = 3 + 5 * h2; z = u;   // нижні — попереду
        } else { b = [cx + (u - .5) * pw * .35, potTop + 1.5]; a0 = (u - .5) * 2 * spread + (h1 - .5) * .25; Lp = up * (.16 + .5 * (1 - Math.abs(u - .5) * 1.3) * (.6 + .4 * h2)); z = 1 - Lp / H + h3 * .05; }
        const e = [b[0] + Math.sin(a0) * Lp, b[1] - Math.cos(a0) * Lp], c2 = [b[0] + Math.sin(a0 * .45) * Lp * .6, b[1] - Math.cos(a0 * .45) * Lp * .6], pts = [];
        for (let s2 = 0; s2 <= 10; s2++) { const tt = s2 / 10, w1 = 1 - tt; pts.push([w1 * w1 * b[0] + 2 * w1 * tt * c2[0] + tt * tt * e[0], w1 * w1 * b[1] + 2 * w1 * tt * c2[1] + tt * tt * e[1]]); }
        const la = a0 + Math.sign(a0 || sg) * (.35 + 1.1 * h3), len = pole ? W * (.44 + .14 * h2) : Math.min(H * (.28 + .06 * h2), W * (.5 + .12 * h2));   // то вгору, то звисають назовні
        lineOp(pts, pal[3], .9, z - .001);
        leafOp(e, la, len, len * (.84 + .1 * h1), Math.sign(la) * .1, 'mon', seed * 7 + q, pal, { q0: .34 + .18 * h1, hi: la < 0, vein: 1, rim: 1, mon: h1 > .12 }, z);
      }
      for (let q = 0; q < 2; q++) leafOp([cx + (q - .5) * 3 + (pole ? .6 : 0), potTop + 1.5 - (pole ? ph2 : 3)], (q - .5) * .45, up * (pole ? .14 : .3), 2.4, 0, 'blade', seed + 90 + q, PALS.light, { q0: .62, hi: q === 0, rim: 1 }, pole ? 2 : -1 + q * .01);   // молоді скручені листки
    } else if (k0 === 'fern') {                                                                             // папороть: пір'ясті вайї фонтаном, кілька звисають через край горщика
      const spread = P.clamp(asp * .95, .55, 1.05);
      for (let q = 0; q < n; q++) {
        const u = n === 1 ? .5 : q / (n - 1), h1 = hash(seed, q), h2 = hash(seed, q + 17), ang = (u - .5) * 2 * spread + (h1 - .5) * .2, e = Math.abs(u - .5);
        const curl = (.16 + .62 * e + .14 * h2) * (ang < 0 ? -1 : 1), len = reach(up * (.74 + .3 * h2) * (1 - e * .45), ang, curl, 1.05), front = e > .3 && h1 > .45;   // центральні — стрункі, крайні — арками до краю горщика
        frond([cx + (u - .5) * pw * .3, potTop + 1.5], ang, len, curl, pal, seed + q * 7, .4 + .14 * hash(seed, q + 5) + (front ? .08 : 0), (front ? 10 : 0) + Math.abs(u - .5), 'fern');
      }
    } else if (k0 === 'palm') {                                                                             // арека: 3 тростини з горщика, вайї з їхніх верхівок
      const canes = [];
      const spread = P.clamp(asp * 1.2, .7, 1.25);
      for (let q = 0; q < 3; q++) { const ca = (q - 1) * .16 + (hash(seed, q + 40) - .5) * .1, cl = up * (.38 + .14 * hash(seed, q + 41)), b = [cx + (q - 1) * 1.6, potTop + 1.5], e = [b[0] + Math.sin(ca) * cl, b[1] - Math.cos(ca) * cl];
        canes.push(e); lineOp([b, e], '#4e6a2a', 1.3, -5 + q * .01);
        for (let s2 = 3; s2 < cl - 1; s2 += 3.2) { const m = [b[0] + Math.sin(ca) * s2, b[1] - Math.cos(ca) * s2]; lineOp([[m[0] - .8, m[1]], [m[0] + .8, m[1]]], '#2e4218', .35, -4.9 + q * .01, false); }   // кільця на тростині
      }
      for (let q = 0; q < n; q++) {
        const u = n === 1 ? .5 : q / (n - 1), h1 = hash(seed, q), h2 = hash(seed, q + 17), fa = (u - .5) * 2 * spread + (h1 - .5) * .2, e = Math.abs(u - .5);
        const curl = (.18 + 1.05 * e + .15 * h2) * (fa < 0 ? -1 : 1);
        frond(canes[q % 3], fa, reach(up * (.56 + .26 * h2) * (1 - e * .42), fa, curl, 1.05), curl, pal, seed + q * 5, .38 + .14 * h1, e * 2 + h1 * .1, 'palm');   // центральні — вгору, крайні — арками
      }
    } else if (k0 === 'bonsai') {                                                                           // бонсай: стовбур з гілками, хмарки листя
      const tr = [[cx, potTop + 1.5], [cx - W * .06, potTop - H * .22], [cx + W * .08, potTop - H * .42], [cx - W * .04, potTop - H * .6]];
      lineOp(tr, '#6a3a1a', 1.8, -2); lineOp(tr.map(([x, y]) => [x - .4, y]), '#9a5a2a', .6, -1.9, false);
      [[cx - W * .28, potTop - H * .3, W * .36, H * .17], [cx + W * .26, potTop - H * .46, W * .38, H * .18], [cx - W * .02, potTop - H * .68, W * .44, H * .2]].forEach(([x, y, w, h], k) => {
        lineOp([[x, y], tr[Math.min(k + 1, tr.length - 1)]], '#6a3a1a', 1.2, -1.95, false);
        leafOp([x, y + h / 2], 0, h, w, 0, 'round', seed + k, pal, { q0: .34 + .1 * k, hi: 1, rim: 1, cloud: 1 }, k); });
    } else {                                                                                                // сансев'єра й неонова: листки-леза з горщика
      for (let q = 0; q < n; q++) {
        const u = n === 1 ? .5 : q / (n - 1), h1 = hash(seed, q), h2 = hash(seed, q + 17), neon = k0 === 'neon';
        const ang = neon ? (u - .5) * 1.6 + (h1 - .5) * .3 : (u - .5) * 1 + (h1 - .5) * .25, len = up * (neon ? (.6 + .35 * h2) * (1 - Math.abs(u - .5) * .35) : .62 + .4 * h2);
        const w = W * (.14 + .05 * h1), curl = neon ? (.3 + .25 * h2) * (ang < 0 ? -1 : 1) : .12 * (h2 - .5);
        leafOp([cx + (u - .5) * W * .2, potTop + 1.5], ang, len, w, curl, 'blade', q * 3 + seed, pal, neon ? { q0: .38 + .18 * h1, hi: ang < 0, vein: 1, tip: q % 2 ? 'pink' : 'cyan', thin: 1 } : { q0: .38 + .18 * h1, hi: ang < 0, bands: 1, edge: '#d8d060', vein: 0 }, -Math.abs(ang) + (neon ? 0 : h2));
      }
    }
    // ---- автопідгонка: межі всіх деталей -> рівномірний масштаб від основи (ніщо не виходить за спрайт) ----
    let x0 = 1e9, x1 = -1e9, y0 = 1e9, y1 = -1e9; const acc = (x, y) => { if (x < x0) x0 = x; if (x > x1) x1 = x; if (y < y0) y0 = y; if (y > y1) y1 = y; };
    ops.forEach(op => op.t === 'leaf' ? leaf(op.base, op.ang, op.len, op.w, op.curl, op.kind, op.sd).poly.forEach(([x, y]) => acc(x, y)) : op.pts.forEach(([x, y]) => acc(x, y)));
    // по горизонталі й вертикалі окремо (до 1.25), але рослина не сплющується більш ніж на 30 %; ліана — верх вирівнюється зсувом
    const m = 1.4, ax = cx, ay = sp.hang ? 0 : potTop + 1.5; let kx = sp.hang ? 1.1 : 1.25, ky = kx, dy = 0;
    if (x0 < ax - .01) kx = Math.min(kx, (ax - m) / (ax - x0)); if (x1 > ax + .01) kx = Math.min(kx, (W - m - ax) / (x1 - ax));
    if (sp.hang) ky = Math.min(1, (H - m - .4) / Math.max(1, y1 - Math.min(0, y0)));
    else { if (y0 < ay - .01) ky = Math.min(ky, (ay - m) / (ay - y0)); if (y1 > ay + .01 && H - m - ay > .5) ky = Math.min(ky, (H - m - ay) / (y1 - ay)); }   // униз — лише якщо під основою є місце (рослина без горщика)
    kx = Math.max(.2, kx); ky = Math.max(.2, ky); if (kx < ky * .7) ky = kx / .7; if (ky < kx * .7) kx = ky / .7;
    if (sp.hang) dy = .4 - Math.min(0, y0) * ky;
    const M = { kx, ky, ax, ay, dy }, P2 = ([x, y]) => [ax + (x - ax) * kx, ay + (y - ay) * ky + dy], k = Math.sqrt(kx * ky);   // точка простору рослини -> спрайт
    const S = F.Sheet(0, 0, W, H);
    const drawOp = op => {
      if (op.t === 'leaf') return fillLeaf(S, mapLeaf(leaf(op.base, op.ang, op.len, op.w, op.curl, op.kind, op.sd), M), op.pal, op.o);
      const pts = op.pts.map(P2), w = Math.max(.35, op.w * k);
      if (op.out) for (let q = 1; q < pts.length; q++) S.line(pts[q - 1][0], pts[q - 1][1], pts[q][0], pts[q][1], OUT, w + .8);
      for (let q = 1; q < pts.length; q++) S.line(pts[q - 1][0], pts[q - 1][1], pts[q][0], pts[q][1], op.col, w);
    };
    ops.sort((a, b) => a.z - b.z);
    ops.filter(op => op.z < 10).forEach(drawOp);                                                           // дальнє — першим, ближнє — поверх
    if (pot !== 'none') {                                                                                    // горщик: navy (неоновий обідок) / terra / chrome / glass (ґрунт і LED видно)
      const px0 = cx - pw / 2, px1 = cx + pw / 2, pal2 = { terra: TERRA, chrome: CHROME, glass: ['#0a1e34', '#10304e', '#184668', '#245e84', '#3a7aa0', '#60a0c0'] }[pot] || POT, neon = sp.neon || (pot === 'terra' ? '#ffb070' : '#ff4fd8');
      S.rect(px0 + 1, potTop - 1.2, px1 - 1, potTop + 1.2, (u, v, i, j) => v < .5 ? '#1a0a2a' : ramp(['#2a1408', '#3a1c0c', '#4a2410'], .5 + hash(i, j) * .5, i, j));
      S.poly([[px0, potTop], [px1, potTop], [px1 - pw * .12, H - .5], [px0 + pw * .12, H - .5]], (u, v, i, j, X) => {
        const d = Math.min(v * ph, (1 - v) * ph), e = Math.min(X - (px0 + v * pw * .12), (px1 - v * pw * .12) - X);
        if (e < .5 || d < .4) return pot === 'glass' ? '#9ad8ff' : OUT;
        if (pot === 'glass') { if (v > .62 && v < .92) return ramp(['#2a1408', '#3a1c0c', '#4a2410', '#5a2c14'], .4 + hash(i, j) * .6, i, j); if (v >= .92) return '#5ae8ff'; return ramp(pal2, .5 - u * .35 + (Math.abs(u - .22) < .05 ? .35 : 0), i, j, .05); }
        if (v < .12) return neon; if (v < .2) return pal2[5]; if (v > .9) return pal2[0];
        return ramp(pal2, .7 - u * .5 - v * .15 + (Math.abs(u - .3) < .04 ? .2 : 0), i, j, .1);
      });
    }
    ops.filter(op => op.z >= 10).forEach(drawOp);                                                          // вайї, що звисають через край горщика
    return { cv: S.canvas(), w: W, h: H, potTop, hang: !!sp.hang, fit: [kx, ky] };
  }
  /** Малює спрайт рослини: смугами, верх гойдається (ліана — низ), shake — тап. R — роздільність (за замовч. під екран). */
  function sway(c, sp, x, y, t, ph = 0, shake = 0, s = 1, R = F.res()) {
    const cv = F.fit(sp.cv, sp.w, sp.h, R), k = cv.width / sp.w;
    c.save(); c.imageSmoothingEnabled = R < 3.8;
    const top = sp.hang ? sp.h : sp.potTop, bands = Math.max(1, Math.round(top / 4)), bh = top / bands;
    for (let b = 0; b < bands; b++) {
      const v = sp.hang ? (b + .5) / bands : 1 - (b + .5) / bands, sw = (Math.sin(t * 1.1 + ph) * .5 + Math.sin(t * 2.3 + b * .4 + ph) * .2) * v * v * s + Math.sin(t * 18) * shake * v * 1.8;
      c.drawImage(cv, 0, b * bh * k, cv.width, bh * k + 1, x + sw, y + b * bh, sp.w, bh + 1 / k);
    }
    if (top < sp.h) c.drawImage(cv, 0, top * k, cv.width, (sp.h - top) * k, x, y + top, sp.w, sp.h - top);
    c.restore();
  }
  /** Тло голо-екрана (скло, скан-лінії). */
  function screenBg(c, w, h, t, a = .42) { c.clearRect(0, 0, w, h); const g = c.createLinearGradient(0, 0, 0, h); g.addColorStop(0, rgba('70,150,255', a)); g.addColorStop(1, rgba('30,90,230', a)); c.fillStyle = g; c.fillRect(0, 0, w, h); c.fillStyle = 'rgba(180,230,255,.08)'; for (let y = (t * 12 | 0) % 4; y < h; y += 4) c.fillRect(0, y, w, 1); c.fillStyle = 'rgba(255,255,255,.1)'; c.fillRect(0, 0, w, Math.round(h * .08)); }
  /** Напис вивіски: світиться, "дихає", вміщається в ширину. */
  function signText(c, key, cx, cy, maxW, t, col = '154,246,255') { const s = NX.t(key), sz = Math.min(8.2, maxW / s.length * 1.05), tc = rgba(col, .88 + .12 * Math.sin(t * 2.2)); P.text(c, s, cx + .4, cy + sz / 2 - .5, tc, sz, 'center'); P.text(c, s, cx, cy + sz / 2 - .5, tc, sz, 'center'); }
  // ---------- вивіска зони (єдиний стиль) ----------
  const ICON = {
    ai: ['..XXX..', '.XXXXX.', 'XX.X.XX', 'XXXXXXX', 'X.XXX.X', '.XX.XX.', '..X.X..'],
    chart: ['......X', '.....XX', '...X.XX', '..XX.XX', 'X.XX.XX', 'XXXX.XX', 'XXXXXXX'],
    target: ['..XXX..', '.X...X.', 'X..X..X', 'X.XXX.X', 'X..X..X', '.X...X.', '..XXX..'],
  };
  /** Вивіска: темна пластина з неоновим кантом кольору зони (acc[3]) і ореолом, кругла іконка зліва (ICON[o.icon]),
   *  напис NX.t(o.key) по центру (дихає), вогник-статус справа. c — контекст кімнати АБО пласке полотно екрана
   *  (x, y, w, h — у його одиницях); так три зони мають однакову вивіску. */
  function sign(c, x, y, w, h, o) {
    const t = o.t || 0, acc = o.acc, r = h * .24, lw = Math.max(.8, h * .07), ix = x + h * .62, iy = y + h / 2, ir = h * .3, RR = (X, Y, W2, H2, rr) => { c.beginPath(); c.roundRect ? c.roundRect(X, Y, W2, H2, rr) : c.rect(X, Y, W2, H2); };
    c.save();
    c.fillStyle = '#0a0620'; RR(x, y, w, h, r); c.fill();
    c.strokeStyle = acc[3]; c.lineWidth = lw; RR(x + lw / 2, y + lw / 2, w - lw, h - lw, r); c.stroke();
    c.strokeStyle = acc[1]; c.lineWidth = lw * .55; RR(x + lw * 1.9, y + lw * 1.9, w - lw * 3.8, h - lw * 3.8, r * .7); c.stroke();
    c.globalCompositeOperation = 'lighter'; c.strokeStyle = rgba(o.glow, .3 + .14 * Math.sin(t * 1.8)); c.lineWidth = lw * 2.4; RR(x, y, w, h, r); c.stroke(); c.globalCompositeOperation = 'source-over';
    c.strokeStyle = acc[3]; c.lineWidth = lw * .9; c.beginPath(); c.arc(ix, iy, ir, 0, 7); c.stroke(); c.fillStyle = '#06102e'; c.beginPath(); c.arc(ix, iy, ir - lw * .6, 0, 7); c.fill();
    const px = ir * 1.3 / 7; (ICON[o.icon] || ICON.ai).forEach((row, j) => [...row].forEach((ch, i) => ch === 'X' && lit(c, ix - 3.5 * px + i * px, iy - 3.5 * px + j * px, px + .05, px + .05, acc[3])));
    const s = NX.t(o.key), tx = x + h * 1.12, tw = w - h * 1.12 - h * .5, sz = Math.min(h * .42, tw / Math.max(1, s.length) * 1.1), tc = rgba(o.text || '154,246,255', .88 + .12 * Math.sin(t * 2.2));
    c.globalCompositeOperation = 'lighter'; P.glow(c, tx + tw / 2, iy, tw * .45, rgba(o.glow, .6), .12); c.globalCompositeOperation = 'source-over';
    P.text(c, s, tx + tw / 2 + sz * .04, iy + sz * .42, tc, sz, 'center'); P.text(c, s, tx + tw / 2, iy + sz * .42, tc, sz, 'center');
    lit(c, x + w - h * .36, iy - h * .08, h * .16, h * .16, Math.sin(t * 3 + x) > 0 ? '#3bff8a' : '#1f6a45');
    c.restore();
  }

  // ---------- гаджети на полички: статична частина — растр, живе — live(c, x, y, t) ----------
  const compose = (w, h, parts) => { const cv = document.createElement('canvas'); cv.width = w * 4; cv.height = h * 4; const x = cv.getContext('2d'); x.imageSmoothingEnabled = false; parts.forEach(([im, px, py]) => x.drawImage(im, px * 4, py * 4)); return cv; };
  function gadget(kind) {
    let W = 12, H = 14, S, cv, live = () => {};
    if (kind === 'holoCube') {                                                                                 // голо-куб: хромова база, над нею обертається каркас куба
      W = 14; H = 17; S = F.Sheet(0, 0, W, H);
      S.rr(1, H - 3.5, W - 1, H, 1, (d, u, v, i, j) => d < .4 ? OUT : v < .3 ? CHROME[4] : ramp(CHROME, .6 - v * .4, i, j)); S.rect(3, H - 3.3, W - 3, H - 2.5, '#3be8ff');
      live = (c, x, y, t) => { const cx = x + W / 2, cy = y + 6.5, a = t * .9, s = 3.8, V = []; for (let k = 0; k < 8; k++) { const vx = (k & 1 ? 1 : -1) * s, vy = (k & 2 ? 1 : -1) * s, vz = (k & 4 ? 1 : -1) * s, rx = vx * Math.cos(a) - vz * Math.sin(a), rz = vx * Math.sin(a) + vz * Math.cos(a); V.push([cx + rx, cy + vy * .8 + rz * .32]); }
        c.save(); c.globalCompositeOperation = 'lighter'; P.glow(c, cx, cy, 10, 'rgba(90,232,255,.8)', .28 + .08 * Math.sin(t * 3)); c.strokeStyle = 'rgba(120,236,255,.85)'; c.lineWidth = .5; c.beginPath();
        for (let k = 0; k < 8; k++) for (const m of [1, 2, 4]) { const n2 = k ^ m; if (n2 > k) { c.moveTo(V[k][0], V[k][1]); c.lineTo(V[n2][0], V[n2][1]); } } c.stroke(); c.fillStyle = '#ffffff'; V.forEach(([px, py]) => c.fillRect(px - .4, py - .4, .8, .8));
        c.fillStyle = rgba('90,232,255', .25 + .1 * Math.sin(t * 2)); c.beginPath(); c.moveTo(x + 3, y + H - 3); c.lineTo(x + W - 3, y + H - 3); c.lineTo(cx + 3, cy); c.lineTo(cx - 3, cy); c.fill(); c.restore(); };
    } else if (kind === 'orb') {                                                                               // куля-левітатор: рожева сфера ширяє над кільцем
      W = 12; H = 16; S = F.Sheet(0, 0, W, H);
      S.rr(1, H - 3, W - 1, H, 1.2, (d, u, v, i, j) => d < .4 ? OUT : d < 1 ? '#ff4fd8' : ramp(NAVY, .4 - v * .2, i, j));
      live = (c, x, y, t) => { const cx = x + W / 2, cy = y + 6 + Math.sin(t * 2) * 1.2, r = 3.6; c.save(); const g = c.createRadialGradient(cx - 1.2, cy - 1.2, .4, cx, cy, r); g.addColorStop(0, '#ffe0ff'); g.addColorStop(.45, '#ff5ae0'); g.addColorStop(1, '#4a1278'); c.fillStyle = g; c.beginPath(); c.arc(cx, cy, r, 0, 7); c.fill(); c.strokeStyle = OUT; c.lineWidth = .6; c.stroke();
        c.globalCompositeOperation = 'lighter'; P.glow(c, cx, cy, 9, 'rgba(255,90,224,.8)', .35); c.fillStyle = rgba('255,120,240', .45 + .2 * Math.sin(t * 4)); c.beginPath(); c.ellipse(cx, y + H - 2.2, 4.2, 1, 0, 0, 7); c.fill(); c.restore(); };
    } else if (kind === 'drone') {                                                                             // міні-дрон на стійці: гвинти крутяться, вогники блимають
      W = 20; H = 13; S = F.Sheet(0, 0, W, H);
      S.rr(7, H - 2, 13, H, .8, (d, u, v, i, j) => d < .3 ? OUT : ramp(CHROME, .6 - v * .4, i, j)); S.rect(9.4, H - 7, 10.6, H - 2, (u, v, i, j) => ramp(CHROME, .7 - Math.abs(u - .4), i, j));
      live = (c, x, y, t) => { const by = y + 4 + Math.sin(t * 3) * .5, cx = x + W / 2; c.save();
        lit(c, cx - 5, by, 10, 3, OUT); lit(c, cx - 4.4, by + .5, 8.8, 2, NAVY[4]); lit(c, cx - 2, by + 1, 4, 1, '#3be8ff');
        [[-8, -1], [8, -1]].forEach(([dx, dy], k) => { lit(c, cx + Math.min(dx, 0) - .2, by + 1.2, Math.abs(dx) + .2, .9, OUT); lit(c, cx + Math.min(dx, 0), by + 1.4, Math.abs(dx), .5, CHROME[3]);
          const a = t * 40 + k; c.strokeStyle = 'rgba(200,230,255,.55)'; c.lineWidth = .5; c.beginPath(); c.moveTo(cx + dx - Math.cos(a) * 3.2, by + dy + Math.sin(a) * .9); c.lineTo(cx + dx + Math.cos(a) * 3.2, by + dy - Math.sin(a) * .9); c.stroke();
          c.fillStyle = 'rgba(200,230,255,.18)'; c.beginPath(); c.ellipse(cx + dx, by + dy, 3.3, 1, 0, 0, 7); c.fill(); lit(c, cx + dx - .5, by + .3, 1, 1, (Math.floor(t * 4) + k) % 2 ? '#ff3b6a' : '#3bff8a'); });
        c.restore(); };
    } else if (kind === 'terrarium') {                                                                         // тераріум: скляний купол над неоновою рослиною, LED-основа
      W = 18; H = 20; S = F.Sheet(0, 0, W, H); const G = F.Sheet(0, 0, W, H);
      S.rr(1, H - 3.5, W - 1, H, 1, (d, u, v, i, j) => d < .4 ? OUT : v < .35 ? '#3be8ff' : ramp(NAVY, .45 - v * .3, i, j)); S.rect(2, H - 4.4, W - 2, H - 3.4, (u, v, i, j) => ramp(['#2a1408', '#3a1c0c', '#4a2410'], .4 + hash(i, j) * .6, i, j));
      const dome = [], cx = W / 2; for (let k = 0; k <= 20; k++) { const a = Math.PI * k / 20; dome.push([cx - Math.cos(a) * (W / 2 - 1.2), H - 4.4 - Math.sin(a) * (H - 6)]); }
      S.poly(dome, (u, v, i, j) => ramp(['#06142a', '#0a2040', '#102c54'], .5 - v * .3, i, j, .05));
      G.poly(dome, (u, v, i, j, X, Y) => { const dx = (X - cx) / (W / 2 - 1.2), dy = (Y - (H - 4.4)) / (H - 6), rr = Math.hypot(dx, dy); return rr > .9 ? (rr > .96 ? '#9ad8ff' : null) : (dx < -.45 && dy < -.3 && hash(i, j) > .55 ? '#9ad8ff' : null); });
      const pl = plant({ kind: 'neon', w: 12, h: 12, pot: 'none', leaves: 6, seed: 11, pal: 'neon' });
      cv = compose(W, H, [[S.canvas(null), 0, 0], [pl.cv, 3, H - 4.4 - 11], [G.canvas(null), 0, 0]]);
      live = (c, x, y, t) => { c.save(); c.globalCompositeOperation = 'lighter'; P.glow(c, x + W / 2, y + H - 7, 9, 'rgba(90,232,255,.9)', .22 + .08 * Math.sin(t * 2.5)); for (let k = 0; k < 3; k++) { const q = (t * .3 + k / 3) % 1; lit(c, x + 5 + k * 3 + Math.sin(q * 7 + k) * 1.5, y + H - 5 - q * 11, .7, .7, rgba('180,250,255', .8 * (1 - q))); } c.restore(); };
    } else if (kind === 'botToy') {                                                                            // мініатюрка робота: голова з візором, тіло з N, ніжки; очі блимають
      W = 10; H = 14; S = F.Sheet(0, 0, W, H);
      S.rr(2, 0, 8, 5, 1.2, (d, u, v, i, j) => d < .4 ? OUT : v > .3 && v < .72 ? '#06102e' : ramp(['#8a90b0', '#c8ccdd', '#eef2ff'], .8 - v * .5, i, j)); S.rect(4.7, -1, 5.3, 0, '#3be8ff');
      S.rr(2.5, 5.5, 7.5, 11, 1, (d, u, v, i, j) => d < .4 ? OUT : (u > .35 && u < .65 && v > .3 && v < .6) ? '#2a5cf0' : ramp(['#8a90b0', '#c8ccdd', '#eef2ff'], .75 - v * .4, i, j));
      S.rect(2.8, 11, 4.6, H, (u, v) => v > .8 ? OUT : '#3a4068'); S.rect(5.4, 11, 7.2, H, (u, v) => v > .8 ? OUT : '#3a4068'); S.rect(.8, 6, 2.5, 9.5, (u, v) => u < .25 ? OUT : '#b0b4cc'); S.rect(7.5, 6, 9.2, 9.5, (u, v) => u > .75 ? OUT : '#b0b4cc');
      live = (c, x, y, t) => { const open = Math.floor(t * .7 + x) % 5 !== 0; lit(c, x + 3.4, y + 2, 1.2, open ? 1.2 : .4, '#3be8ff'); lit(c, x + 5.6, y + 2, 1.2, open ? 1.2 : .4, '#3be8ff'); if (Math.sin(t * 5) > 0) lit(c, x + 4.6, y - 1.2, .9, .9, '#ff7af0'); };
    } else if (kind === 'speaker') {                                                                           // розумна колонка: циліндр з сіткою, LED-кільце міняє колір
      W = 8; H = 12; S = F.Sheet(0, 0, W, H);
      S.rr(.5, 0, W - .5, H, [2, 2, 1, 1], (d, u, v, i, j) => d < .4 ? OUT : v < .14 ? ramp(CHROME, .7 - u * .4, i, j) : (((i + j) & 1) && v > .25 && v < .9 && u > .12 && u < .88) ? NAVY[0] : ramp(NAVY, .5 - u * .3, i, j));
      // lvl 0..1 — колонка грає (№8, Nexi працює в її зоні — objects/wing_react.js): кільце б'є в такт і пускає світлу хвилю, решітка — еквалайзер, ноти
      live = (c, x, y, t, lvl = 0) => {
        const hue = (t * 60 + x) % 360, b = lvl > .02 ? NX.wing.react.beat(t) : null, k = b ? b.kick * lvl : 0;
        c.save(); c.globalCompositeOperation = 'lighter'; c.strokeStyle = `hsla(${hue},95%,${65 + k * 25}%,.9)`; c.lineWidth = .8 + k * .7; c.beginPath(); c.ellipse(x + W / 2, y + 1.4, W / 2 - .9, .9, 0, 0, 7); c.stroke(); P.glow(c, x + W / 2, y + 1.4, 5 + k * 5, `hsla(${hue},95%,65%,.8)`, .3 + k * .4);
        if (b) { c.strokeStyle = `hsla(${hue},95%,72%,${(1 - b.f) ** 2 * .7 * lvl})`; c.lineWidth = .5; c.beginPath(); c.ellipse(x + W / 2, y + 1.4, W / 2 - .9 + b.f * 7, .9 + b.f * 1.6, 0, 0, 7); c.stroke(); }   // світла хвиля від кільця
        c.restore();
        if (b) NX.kit.soundFx(c, { x0: x + .5, y0: y, x1: x + W - .5, y1: y + H, eq: [x + 1.3, y + 3.2, x + W - 1.3, y + H - 1.2], cols: 3, rows: 4, col: `hsl(${hue},95%,72%)`, waves: 1, notes: 1, seed: 3, wave: '255,140,230', drift: 1 }, t, lvl);
      };
    }
    if (!cv) cv = S.canvas();
    return { w: W, h: H, cv, live };
  }
  // ---------- лампи: Едісона (скляна груша з ниткою), китайський ліхтар (червоний, з китицею) ----------
  function lamp(kind) {
    if (kind === 'chinese') {
      const W = 24, H = 50, S = F.Sheet(0, 0, W, H), RED = ['#5a0a10', '#8a1418', '#b82020', '#dc3030', '#f04a3a', '#ff7a5a'], GOLD = ['#6a4410', '#a8701c', '#e0a030', '#ffd468'];
      S.rect(11.4, 0, 12.6, 3, '#2a1208');                                                                       // шнур
      S.rr(8, 3, 16, 6, .8, (d, u, v, i, j) => d < .4 ? OUT : ramp(GOLD, .8 - v * .5, i, j));
      const body = []; for (let k = 0; k <= 28; k++) { const a = Math.PI * 2 * k / 28; body.push([12 + Math.cos(a) * 10.5, 19.5 + Math.sin(a) * 13.5]); }
      S.poly(body, (u, v, i, j, X, Y) => { const dx = (X - 12) / 10.5, dy = (Y - 19.5) / 13.5, rr = Math.hypot(dx, dy); if (rr > .95) return OUT;
        if (Math.abs(Math.sin(dx * 5.2)) > .93 && Math.abs(dx) < .9) return RED[1];                                                                    // ребра
        if (Math.abs(dy - .78) < .05 || Math.abs(dy + .78) < .05) return GOLD[2];                                                                     // золоті смуги
        return ramp(RED, .72 - Math.abs(dx + .25) * .55 - Math.abs(dy) * .25 + (hash(i, j) - .5) * .08, i, j); });
      S.rr(8, 32, 16, 35, .8, (d, u, v, i, j) => d < .4 ? OUT : ramp(GOLD, .8 - v * .5, i, j));
      for (let k = 0; k < 5; k++) S.line(11 + k * .5, 35, 10.5 + k * .6 + Math.sin(k) * .4, 46 + hash(k, 1) * 3, k === 2 ? RED[4] : RED[3], .5);   // китиця
      S.rr(10.4, 35, 13.6, 37.4, .6, (d) => d < .3 ? OUT : GOLD[3]);
      return { w: W, h: H, cv: S.canvas(), live: (c, x, y, t) => { c.save(); c.globalCompositeOperation = 'lighter'; P.glow(c, x + 12, y + 19.5, 30, 'rgba(255,90,60,.9)', .28 + .05 * Math.sin(t * 5 + x)); P.glow(c, x + 12, y + 19.5, 12, 'rgba(255,160,90,1)', .25); c.restore(); } };
    }
    const W = 10, H = 20, S = F.Sheet(0, 0, W, H);                                                              // Едісона
    S.rr(3, 0, 7, 4.5, [.5, .5, 1, 1], (d, u, v, i, j) => d < .4 ? OUT : ((v * 9) | 0) % 2 ? ramp(['#5a3a10', '#8a5a1a', '#c08a2a'], .6 - Math.abs(u - .4), i, j) : ramp(['#8a5a1a', '#c08a2a', '#e8b050'], .8 - Math.abs(u - .4), i, j));
    const bulb = []; for (let k = 0; k <= 24; k++) { const a = Math.PI * 2 * k / 24; bulb.push([5 + Math.cos(a) * 4.6, 12.5 + Math.sin(a) * 6.5]); } bulb[18] = [3.3, 4.5]; bulb[19] = [4.2, 4.3]; bulb[20] = [5, 4.2]; bulb[21] = [5.8, 4.3]; bulb[22] = [6.7, 4.5];
    S.poly(bulb, (u, v, i, j, X, Y) => { const dx = (X - 5) / 4.6, dy = (Y - 12.5) / 6.5, rr = Math.hypot(dx, dy); if (rr > .95 && Y > 6) return '#ffe8b0'; if (dx < -.5 && dy < -.2 && rr > .72) return '#fff4d8';
      return ramp(['#c86a1e', '#f0a03a', '#ffd06a', '#ffe9a6', '#fff8dc'], .9 - rr * .5 - Math.abs(dx) * .2, i, j); });
    for (let k = 0; k < 4; k++) S.line(3.6 + k * .9, 15 - (k % 2) * 4, 4.5 + k * .9, 11 + (k % 2) * 4, '#fffbe8', .5);                             // нитка
    // boost 0..1 — Nexi працює під лампою (№8, objects/wing_react.js): спалахує яскравіше, нитка розжарюється добіла
    return { w: W, h: H, cv: S.canvas(), live: (c, x, y, t, boost = 0) => { const f = (.75 + .15 * Math.sin(t * 7 + x) + .08 * Math.sin(t * 13.7)) * (1 + .5 * boost); c.save(); c.globalCompositeOperation = 'lighter'; P.glow(c, x + 5, y + 12, 26 + boost * 10, 'rgba(255,190,90,.9)', .3 * f); P.glow(c, x + 5, y + 12, 8, 'rgba(255,230,160,1)', .45 * f);
      if (boost > .02) { P.glow(c, x + 5, y + 13, 5, 'rgba(255,250,225,1)', .55 * boost); c.strokeStyle = rgba('255,255,235', .9 * boost); c.lineWidth = .45; c.beginPath(); for (let k = 0; k <= 4; k++) { const px = x + 3.6 + k * .9, py = y + (k % 2 ? 11 : 15); k ? c.lineTo(px, py) : c.moveTo(px, py); } c.stroke(); }
      c.restore(); } };
  }

  // ---------- системний блок AI-ядра: скляна панель, за нею начинка ----------
  /** Геометрія блока в секції a..b столу (під плитою slab, до підлоги bot). */
  function coreGeom(a, b, slab, bot) {
    return { a, b, slab, bot, gx0: a + 3, gy0: slab + 3, gx1: b - 3, gy1: bot - 5.6, fans: [[a + 11, slab + 13, 6], [a + 11, slab + 27, 6], [a + 11, slab + 41, 6]],
      gpu: [a + 21, slab + 7, b - 5, slab + 18], ram: [a + 23, slab + 21, b - 6, slab + 31], cpu: [a + 21, slab + 34, a + 33, slab + 46], res: [a + 38, slab + 34, b - 6, slab + 47], strip: [a + 3, bot - 5, b - 3, bot - 2] };
  }
  function corePC(S, g) {
    const { gx0, gy0, gx1, gy1 } = g, PCB = ['#070a1e', '#0b1030', '#101842', '#162254'];
    S.rect(gx0, gy0, gx1, gy1, (u, v, i, j, X, Y) => (((X - gx0) % 6 < .5 && ((Y - gy0) | 0) % 3) || ((Y - gy0) % 7 < .5 && ((X - gx0) | 0) % 4 === 1)) ? PCB[3] : ramp(PCB, .35 - v * .2, i, j, .08));   // плата з доріжками
    g.fans.forEach(([fx, fy, fr]) => S.rr(fx - fr - 1, fy - fr - 1, fx + fr + 1, fy + fr + 1, fr + 1, (d, u, v, i, j, X, Y) => { const dd = Math.hypot(X - fx, Y - fy); return dd > fr + .5 ? OUT : dd > fr - .5 ? ramp(CHROME, .55 - v * .3, i, j) : dd < 1.6 ? CHROME[2] : '#03020c'; }));   // рамки вентиляторів
    const [ax, ay, bx, by] = g.gpu;
    S.rr(ax, ay, bx, by, 1, (d, u, v, i, j) => d < .4 ? OUT : v < .2 ? CHROME[3] : (u > .62 && ((u * 30) | 0) % 2) ? '#0a0e2a' : ramp(['#141a3a', '#1c2450', '#263066'], .6 - v * .3, i, j));   // GPU: корпус і ребра радіатора
    S.rr(ax + 2, ay + 3, ax + 12, by - 2, .8, (d, u, v, i, j) => d < .4 ? '#06102e' : '#0a1a44');                                                                   // вікно логотипа (світиться живим)
    const [rx0, ry0, rx1, ry1] = g.ram; for (let k = 0; k < 4; k++) { const x = rx0 + k * ((rx1 - rx0) / 4); S.rect(x, ry0, x + (rx1 - rx0) / 4 - 1.2, ry1, (u, v, i, j) => v > .85 ? ((u * 10) | 0) % 2 ? '#e0a030' : '#7a5010' : v < .18 ? '#06102e' : u < .1 || u > .9 ? OUT : ramp(['#0e1430', '#182048', '#222c60'], .5 - v * .3, i, j)); }   // пам'ять: контакти, LED-вікно
    const [cx0, cy0, cx1, cy1] = g.cpu; S.rr(cx0, cy0, cx1, cy1, 1, (d, u, v, i, j) => d < .4 ? OUT : d < 1.6 ? ramp(CHROME, .7 - v * .4, i, j) : d < 2.4 ? '#06102e' : '#0a2a4a');                                                  // водоблок процесора
    const [qx0, qy0, qx1, qy1] = g.res; S.rr(qx0, qy0, qx1, qy1, 1.5, (d, u, v, i, j) => d < .4 ? '#9ad8ff' : (u < .18 && v > .1 && v < .9) ? '#6ad0ff' : ramp(['#062040', '#0a3460', '#0e4a80'], .6 - v * .3, i, j, .06));         // резервуар з рідиною
    S.line((cx0 + cx1) / 2 + 2, cy0, (qx0 + qx1) / 2 - 3, qy0 - 1.5, OUT, 2.6); S.line((cx0 + cx1) / 2 + 2, cy0, (qx0 + qx1) / 2 - 3, qy0 - 1.5, '#0a4a6a', 1.4);                                     // трубки охолодження
    S.line(cx1, (cy0 + cy1) / 2, qx0, (qy0 + qy1) / 2, OUT, 2.6); S.line(cx1, (cy0 + cy1) / 2, qx0, (qy0 + qy1) / 2, '#0a4a6a', 1.4);
    [[gx0 + 3, gy1 - 2, gx0 + 9, gy1 - 7, '#ff4fd8'], [gx0 + 5, gy1 - 1.5, gx0 + 12, gy1 - 4, '#3be8ff'], [ax + 4, by, ax + 2, cy0 - 2, '#ffe27a']].forEach(([x0, y0, x1, y1, col]) => { S.line(x0, y0, x1, y1, OUT, 1.3); S.line(x0, y0, x1, y1, col, .5); });   // кабелі
    S.rect(gx0, gy0, gx1, gy1, (u, v, i, j) => (Math.abs(u + v * .6 - .55) < .04) ? '#2a4a7a' : (Math.abs(u + v * .6 - .66) < .015) ? '#3a5a8a' : null);                                                       // відблиск скла
    S.rr(gx0 - .6, gy0 - .6, gx1 + .6, gy1 + .6, 1, (d) => d < .6 ? '#6ab0e0' : null);                                                                                                                     // кант скла
    const [sx0, sy0, sx1, sy1] = g.strip; S.rect(sx0, sy0, sx1, sy1, (u, v) => v < .2 || v > .8 ? OUT : '#06102e');                                                                                      // передня смужка-дисплей
  }
  /** Живе в блоці: вентилятори (RGB, швидше коли Nexi працює), логотип N, LED пам'яті, процесор, потік рідини, бульбашки, дисплей. */
  function coreLive(c, g, t, act) {
    const sp = 4 + act * 14; c.save(); c.globalCompositeOperation = 'lighter';
    g.fans.forEach(([fx, fy, fr], n) => { const hue = (t * 70 + n * 120) % 360; P.glow(c, fx, fy, fr * 1.8, `hsla(${hue},95%,62%,.8)`, .18 + act * .2);
      for (let bl = 0; bl < 7; bl++) { const a = t * sp + bl * Math.PI * 2 / 7 + n; c.strokeStyle = `hsla(${hue},95%,70%,.75)`; c.lineWidth = 1.1; c.beginPath(); c.moveTo(fx + Math.cos(a) * 1.6, fy + Math.sin(a) * 1.6); c.quadraticCurveTo(fx + Math.cos(a + .5) * (fr - 1.6), fy + Math.sin(a + .5) * (fr - 1.6), fx + Math.cos(a + .9) * (fr - .6), fy + Math.sin(a + .9) * (fr - .6)); c.stroke(); }
      c.strokeStyle = `hsla(${hue},95%,70%,.9)`; c.lineWidth = .7; c.beginPath(); c.arc(fx, fy, fr + .1, 0, 7); c.stroke(); });
    const [ax, ay] = g.gpu; P.text(c, 'N', ax + 7, ay + 10.6, rgba('59,232,255', .8 + .2 * Math.sin(t * 2)), 7, 'center'); P.glow(c, ax + 7, ay + 7.5, 7, 'rgba(59,232,255,.8)', .25 + act * .2);
    for (let k = 0; k < 3; k++) lit(c, ax + 15 + k * 3, ay + 1.6, 1.4, 1.2, hash(k, Math.floor(t * (3 + act * 6))) > .5 ? ['#3bff8a', '#ffe27a', '#ff7af0'][k] : '#102040');
    const [rx0, ry0, rx1] = g.ram; for (let k = 0; k < 4; k++) { const x = rx0 + k * ((rx1 - rx0) / 4); lit(c, x + .5, ry0 + .4, (rx1 - rx0) / 4 - 2.2, 1.2, `hsla(${(t * 90 + k * 40) % 360},95%,65%,.9)`); }
    const [cx0, cy0, cx1, cy1] = g.cpu; P.glow(c, (cx0 + cx1) / 2, (cy0 + cy1) / 2, 6, 'rgba(90,232,255,.9)', .3 + .12 * Math.sin(t * 4) + act * .3); lit(c, (cx0 + cx1) / 2 - 1.5, (cy0 + cy1) / 2 - 1.5, 3, 3, rgba('180,250,255', .6 + .3 * Math.sin(t * 4)));
    const [qx0, qy0, qx1, qy1] = g.res; for (let k = 0; k < 4; k++) { const q = (t * .35 + k * .25) % 1; lit(c, qx0 + 2 + ((k * 2.3) % (qx1 - qx0 - 4)), qy1 - 1.5 - q * (qy1 - qy0 - 3), .8, .8, rgba('180,240,255', .8 * (1 - q))); }   // бульбашки
    const tubes = [[(cx0 + cx1) / 2 + 2, cy0, (qx0 + qx1) / 2 - 3, qy0 - 1.5], [cx1, (cy0 + cy1) / 2, qx0, (qy0 + qy1) / 2]];
    tubes.forEach(([x0, y0, x1, y1], n) => { for (let k = 0; k < 3; k++) { const q = ((t * (.5 + act) + k / 3 + n * .5) % 1), x = x0 + (x1 - x0) * q, y = y0 + (y1 - y0) * q; lit(c, x - .6, y - .6, 1.2, 1.2, '#5ae8ff'); } });   // потік рідини
    c.globalCompositeOperation = 'source-over';
    const [sx0, sy0, sx1, sy1] = g.strip, load = act ? .7 + .25 * Math.sin(t * 3) : .35 + .2 * Math.sin(t * .8); P.text(c, 'CORE ' + Math.round(load * 100) + '%', sx0 + 1.5, sy1 - .7, '#3be8ff', 2.2); lit(c, sx0 + 20, sy0 + .9, (sx1 - sx0 - 22) , 1.2, '#0a1a3a'); lit(c, sx0 + 20, sy0 + .9, (sx1 - sx0 - 22) * load, 1.2, act ? '#3bff8a' : '#3be8ff');
    c.restore();
  }

  // ---------- наліпки: висічка зі світлою облямівкою, іконка, тонка тінь по краю (усе власне: логотип N, Nexi, кіт Рудик) ----------
  const STK = {
    n:     { shape: 'round', bg: '#0b1434', fg: '#3be8ff', px: ['X...X', 'XX..X', 'X.X.X', 'X..XX', 'X...X'] },
    bolt:  { shape: 'round', bg: '#1a1046', fg: '#ffe27a', px: ['..XX', '.XX.', 'XXXX', '.XX.', 'XX..'] },
    heart: { shape: 'cut', fg: '#ff4fd8', px: ['.XX.XX.', 'XXXXXXX', 'XXXXXXX', '.XXXXX.', '..XXX..', '...X...'] },
    star:  { shape: 'cut', fg: '#7af0ff', px: ['...X...', '..XXX..', 'XXXXXXX', '.XXXXX.', '.XX.XX.', 'X.....X'] },
    robot: { shape: 'cut', px: ['...C...', '.WWWWW.', 'WDDDDDW', 'WDCDCDW', 'WDDDDDW', '.WWWWW.'], cols: { W: '#e8ecff', D: '#0a1236', C: '#3be8ff' } },
    cat:   { shape: 'cut', px: ['O.....O', 'OO...OO', 'OOOOOOO', 'OEOOOEO', 'OOOPOOO', '.OOOOO.'], cols: { O: '#f08a2a', E: '#2a1408', P: '#ff7aa8' } },
    ai:    { shape: 'tag', bg: '#1a1046', fg: '#ff6ec8', px: ['.X..XXX', 'X.X..X.', 'XXX..X.', 'X.X..X.', 'X.X.XXX'] },
    warn:  { shape: 'tri', bg: '#ffd23a', fg: '#1a1020', px: ['X', 'X', 'X', '.', 'X'] },
    qr:    { shape: 'square', bg: '#e6e2fa', fg: '#0a0618', px: ['XXX.XXX', 'X.X.X.X', 'XXX.XXX', '....X..', 'XXX.X.X', 'X.X..XX', 'XXX.X.X'] },
  };
  /** Наліпка в растр S: o = {kind, x, y — центр, s — розмір, rot}. Форми: round (кругла), tag (заокруглена), square,
   *  tri (трикутник-попередження), cut (висічка по контуру іконки). Наклеюється на будь-що: стіну, трубу, канал, будку. */
  function sticker(S, o) {
    const T = STK[o.kind] || STK.n, s = o.s || 4.4, a = o.rot || 0, ca = Math.cos(a), sa = Math.sin(a), px = T.px || [], gh = px.length, gw = gh ? px[0].length : 0, cut = T.shape === 'cut';
    const B = s * .11, cell = (s - 2 * B) / Math.max(gw, gh, 1) * (T.shape === 'round' ? .72 : T.shape === 'tri' ? .42 : T.shape === 'tag' ? .82 : cut ? 1 : .9), ox = -gw * cell / 2, oy = -gh * cell / 2 + (T.shape === 'tri' ? s * .12 : 0), R = s * .8;
    const at = (lx, ly) => { const ci = Math.floor((lx - ox) / cell), cj = Math.floor((ly - oy) / cell); return ci >= 0 && cj >= 0 && ci < gw && cj < gh ? px[cj][ci] : '.'; };
    const near = (lx, ly, d) => { for (let cj = 0; cj < gh; cj++) for (let ci = 0; ci < gw; ci++) { if (px[cj][ci] === '.') continue; const x0 = ox + ci * cell, y0 = oy + cj * cell, dx = Math.max(x0 - lx, 0, lx - x0 - cell), dy = Math.max(y0 - ly, 0, ly - y0 - cell); if (dx * dx + dy * dy <= d * d) return true; } return false; };
    const inShape = (lx, ly, g) => {                                                                       // g > 0 — розширити (тінь), g < 0 — звузити (поле під облямівкою)
      if (T.shape === 'round') return Math.hypot(lx, ly) <= s / 2 + g;
      if (T.shape === 'tri') { const top = -s * .45 - g, bot = s * .45 + g; return ly >= top && ly <= bot && Math.abs(lx) <= (ly - top) / (bot - top) * (s / 2 + g); }
      if (cut) return near(lx, ly, B + g);
      const hw = s / 2 + g, hh = (T.shape === 'tag' ? s * .36 : s / 2) + g, rr = Math.max(.1, s * .14 + g), qx = Math.abs(lx) - (hw - rr), qy = Math.abs(ly) - (hh - rr);
      return Math.hypot(Math.max(qx, 0), Math.max(qy, 0)) + Math.min(Math.max(qx, qy), 0) <= rr;
    };
    S.rect(o.x - R, o.y - R, o.x + R, o.y + R, (u, v, i, j, X, Y) => {
      const lx = (X - o.x) * ca + (Y - o.y) * sa, ly = -(X - o.x) * sa + (Y - o.y) * ca;                   // координати на наліпці (з поворотом)
      if (!inShape(lx, ly, 0)) return inShape(lx - .28, ly - .32, .18) ? '#0e0820' : null;                  // тонка тінь висічки праворуч-знизу
      const rim = lx + ly > s * .28 ? '#c4bee6' : '#e6e2fa';                                                 // світла облямівка (знизу-справа — у півтіні)
      if (cut) { const ch = at(lx, ly); return ch === '.' ? rim : T.cols ? T.cols[ch] : T.fg; }
      if (!inShape(lx, ly, -B)) return rim;
      const ch = at(lx, ly); return ch === '.' ? T.bg : T.fg;
    });
  }

  const draw = (c, S, R) => { const w = S.x1 - S.x0, h = S.y1 - S.y0; c.imageSmoothingEnabled = R < 3.8; c.drawImage(F.fit(S.cv, w, h, R), S.x0, S.y0, w, h); };
  return { BRK, SLAB, GREEN, POT, brick, booth, desk, plant, sway, sign, gadget, lamp, coreGeom, corePC, coreLive, screenBg, signText, noise, rgba, lit, mix, draw, contact, contacts, sticker, STK, vn, wire, snap, gloss, deskShine, underLive, reflectors: [] };
})();

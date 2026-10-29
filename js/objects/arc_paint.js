/* ============================================================================
 * objects/arc_paint.js — МАЛЮНКИ ГРАНЕЙ КРИЛ «ПО ДУЗІ» (NX.arc.paint[id])
 * ----------------------------------------------------------------------------
 * Пласкі текстури лицьових граней головних частин зон — у стилі картинки кімнати: голо-екрани (скло з переливом
 * і скан-лініями, світні графіки, карта світу, мозок-голограма, іконки), вивіски з NX.t, шухляди з ручками й LED,
 * сканер майстерні, вихор порталу, перфодошка з інструментами. Малюються раз (у полотно в одиницях грані, рушій
 * кладе їх у перспективу); живі екрани поверх — objects/arc_live.js.
 *   NX.arc.paint[id] = (c, fw, fh, B, F) => {...}   — c уже масштабоване: 1 = одиниця грані; fw × fh — розмір грані
 * Усі написи — NX.t (4 мови): nav.* (вивіски), scene.* (екрани). Ключі розкладки — objects/arc_layout.js.
 * ========================================================================== */
NX.arc = NX.arc || {};
(() => {
  const A = NX.arc.kit, K = NX.kit, X3 = NX.px3d, hash = NX.art.hash, t = k => NX.t(k);
  const PAINT = NX.arc.paint = {};
  // ---------- дрібниці ----------
  const rr = (c, x, y, w, h, r) => { c.beginPath(); c.roundRect ? c.roundRect(x, y, w, h, r) : c.rect(x, y, w, h); };
  const F = (B, i) => (B.deco && B.deco[i] && B.deco[i].f) || null;                       // прямокутник оздоби i (частки грані)
  const R = (f, fw, fh) => f ? [f[0] * fw, f[2] * fh, (f[1] - f[0]) * fw, (f[3] - f[2]) * fh] : null;
  /** Голо-скло: темна синява з переливом, скан-лінії, світлий кант, легкий відблиск угорі. */
  function glass(c, x, y, w, h, o = {}) {
    const g = c.createLinearGradient(x, y, x, y + h); g.addColorStop(0, o.a || '#1b4fc0'); g.addColorStop(.5, o.b || '#0f2f8e'); g.addColorStop(1, o.c || '#0a2266');
    c.fillStyle = '#040822'; rr(c, x - .8, y - .8, w + 1.6, h + 1.6, o.r || 1); c.fill(); c.fillStyle = g; rr(c, x, y, w, h, o.r || 1); c.fill();
    c.save(); rr(c, x, y, w, h, o.r || 1); c.clip();
    const e = c.createRadialGradient(x + w / 2, y + h / 2, Math.min(w, h) * .2, x + w / 2, y + h / 2, Math.max(w, h) * .75); e.addColorStop(0, 'rgba(60,140,255,0)'); e.addColorStop(1, 'rgba(110,200,255,.22)'); c.fillStyle = e; c.fillRect(x, y, w, h);
    c.fillStyle = 'rgba(160,225,255,.09)'; for (let yy = y + 1.2; yy < y + h; yy += 1.6) c.fillRect(x, yy, w, .55);
    c.fillStyle = 'rgba(255,255,255,.07)'; c.beginPath(); c.moveTo(x, y); c.lineTo(x + w * .45, y); c.lineTo(x + w * .25, y + h * .5); c.lineTo(x, y + h * .5); c.fill();
    c.restore();
    c.strokeStyle = o.line || '#7af4ff'; c.lineWidth = o.lw || .8; rr(c, x + .4, y + .4, w - .8, h - .8, o.r || 1); c.stroke();
  }
  /** Світні стовпчики (графік). */
  function bars(c, x, y, w, h, n, seed, o = {}) {
    const cw = w / n;
    for (let i = 0; i < n; i++) {
      const v = .25 + .75 * Math.abs(Math.sin(i * 1.7 + seed * 2.3 + Math.sin(i * .6 + seed))), bh = v * h, bx = x + i * cw + cw * .18, bw = cw * .64;
      const g = c.createLinearGradient(0, y + h - bh, 0, y + h); g.addColorStop(0, o.top || '#e8feff'); g.addColorStop(.18, o.mid || '#5ae8ff'); g.addColorStop(1, o.bot || '#1a5ad0');
      c.fillStyle = g; c.fillRect(bx, y + h - bh, bw, bh); c.fillStyle = 'rgba(255,255,255,.35)'; c.fillRect(bx, y + h - bh, bw, Math.min(.8, bh));
    }
    c.fillStyle = o.base || 'rgba(120,230,255,.6)'; c.fillRect(x, y + h, w, .6);
  }
  /** Світна лінія графіка з заливкою під нею. */
  function lineChart(c, x, y, w, h, seed, col = '#ff7af0', fill = 'rgba(255,90,220,.18)') {
    const n = 18, pts = []; for (let i = 0; i <= n; i++) pts.push([x + i / n * w, y + h * (.75 - .5 * (.5 + .5 * Math.sin(i * .7 + seed)) * (.4 + .6 * i / n))]);
    c.beginPath(); c.moveTo(x, y + h); pts.forEach(p => c.lineTo(p[0], p[1])); c.lineTo(x + w, y + h); c.closePath(); c.fillStyle = fill; c.fill();
    c.strokeStyle = col; c.lineWidth = .9; c.beginPath(); pts.forEach((p, i) => i ? c.lineTo(p[0], p[1]) : c.moveTo(p[0], p[1])); c.stroke();
    c.fillStyle = '#ffffff'; const L = pts[pts.length - 1]; c.fillRect(L[0] - .8, L[1] - .8, 1.6, 1.6);
  }
  function donut(c, cx, cy, r, parts) {
    let a = -Math.PI / 2; const tot = parts.reduce((s, p) => s + p[0], 0);
    parts.forEach(([v, col]) => { const b = a + v / tot * Math.PI * 2; c.strokeStyle = col; c.lineWidth = r * .42; c.beginPath(); c.arc(cx, cy, r * .78, a + .04, b - .04); c.stroke(); a = b; });
    c.fillStyle = '#0a1a50'; c.beginPath(); c.arc(cx, cy, r * .55, 0, 7); c.fill();
  }
  /** Піксельні іконки 7×7 (для плиток інструментів, екранів). */
  const IC = {
    mail: ['XXXXXXX', 'XX...XX', 'X.X.X.X', 'X..X..X', 'X.....X', 'X.....X', 'XXXXXXX'], cal: ['.X...X.', 'XXXXXXX', 'X.....X', 'XXXXXXX', 'X.X.X.X', 'X.X.X.X', 'XXXXXXX'],
    crm: ['..X.X..', '.XXXXX.', '..X.X..', 'X.....X', 'XX...XX', '.XXXXX.', '..XXX..'], gear: K.ICON.gear, bot: K.ICON.bot, ai: K.ICON.ai, chart: K.ICON.chart, target: K.ICON.target, spiral: K.ICON.spiral,
    chat: ['XXXXXXX', 'X.....X', 'X.X.X.X', 'X.....X', 'XXXXXXX', '.XX....', 'X......'], heart: ['.XX.XX.', 'XXXXXXX', 'XXXXXXX', 'XXXXXXX', '.XXXXX.', '..XXX..', '...X...'],
    bolt: ['....XX.', '...XX..', '..XX...', '.XXXXX.', '...XX..', '..XX...', '.XX....'], doc: ['XXXXX..', 'X...XX.', 'X.XX.XX', 'X.....X', 'X.XXX.X', 'X.....X', 'XXXXXXX'],
    wrench: ['.....XX', '....X.X', '...XXX.', '..XXX..', '.XXX...', 'XXX....', 'XX.....'], user: ['..XXX..', '.XXXXX.', '..XXX..', '.......', '.XXXXX.', 'XXXXXXX', 'XXXXXXX'],
  };
  const icon = (c, k, cx, cy, s, col) => A.icon7(c, IC[k] || IC.ai, cx, cy, s, col);
  /** Плитка-екран з іконкою і підписом. */
  function tile(c, x, y, w, h, ic, label, col = '#7af4ff') {
    glass(c, x, y, w, h, { r: 1.2, line: col, a: '#163e9e', b: '#0d2a7a', c: '#091e5e' });
    const s = Math.min(w, h) * (label ? .42 : .55); icon(c, ic, x + w / 2, y + h * (label ? .42 : .5), s, col);
    if (label) A.txt(c, label, x + w / 2, y + h * .82, w * .86, Math.min(h * .14, 3.2), '#bff8ff');
  }
  /** Мозок-голограма (вигляд збоку, як на картинці кімнати): велика півкуля зі звивинами й борознами, сильвієва й
   *  центральна борозни, мозочок зі смужками, стовбур; світлий обрис, нейрони-іскри. Піксель за пікселем — у полотно
   *  точно під щільність текстури (c уже масштабоване), потім кладеться одним drawImage. */
  function brain(c, cx, cy, r) {
    const m = c.getTransform(), TS = Math.hypot(m.a, m.b) || 1, W = Math.ceil(r * 2.3 * TS), H = Math.ceil(r * 2 * TS), cv = document.createElement('canvas'); cv.width = W; cv.height = H;
    const x2 = cv.getContext('2d'), im = x2.createImageData(W, H), d = new Uint32Array(im.data.buffer), S = W / 2.3;   // S — пікселів на r
    const kind = new Uint8Array(W * H), at = (i, j) => (i < 0 || j < 0 || i >= W || j >= H) ? 0 : kind[j * W + i];
    for (let j = 0; j < H; j++) for (let i = 0; i < W; i++) {
      const x = (i - W * .5) / S, y = (j - H * .44) / S;                                                       // x, y у частках r
      const cer = (x / 1.02) ** 2 + ((y + .06) / .74) ** 2 <= 1 && y < .46 - Math.max(0, x - .1) * .35 && !(x > .3 && y > .28);
      const tmp = ((x + .05) / .62) ** 2 + ((y - .32) / .26) ** 2 <= 1;                                       // скронева частка
      const cbl = ((x - .58) / .36) ** 2 + ((y - .5) / .2) ** 2 <= 1, stem = y > .42 && y < .9 && x > .14 - (y - .42) * .25 && x < .36 - (y - .42) * .25;
      kind[j * W + i] = cer || tmp ? 1 : cbl ? 2 : stem ? 3 : 0;
    }
    const C = ['#0c2a74', '#10368c', '#1646a6', '#1c58be', '#256cd4', '#3384e8', '#4a9cf6'].map(h => X3.col(h)), L1 = X3.col('#9af6ff'), L2 = X3.col('#e4fdff'), L3 = X3.col('#5ad8ff');
    for (let j = 0; j < H; j++) for (let i = 0; i < W; i++) {
      const k = kind[j * W + i]; if (!k) continue; const q = j * W + i, x = (i - W * .5) / S, y = (j - H * .44) / S;
      const e1 = !at(i - 1, j) || !at(i + 1, j) || !at(i, j - 1) || !at(i, j + 1), e2 = !at(i - 2, j) || !at(i + 2, j) || !at(i, j - 2) || !at(i, j + 2);
      if (e1) { d[q] = L2; continue; } if (e2) { d[q] = L3; continue; }
      const dist = Math.hypot(x / 1.0, (y + .05) / .75); let cc = X3.ramp(C, .95 - dist * .7 + (-x - y) * .18, i, j);
      if (k === 1) {
        const X = x * 30, Y = y * 30, f = Math.sin(X * .24 + 2.4 * Math.sin(Y * .15 + X * .03)) + Math.sin(Y * .21 + 1.9 * Math.sin(X * .12 - .7));
        if (Math.abs(f) < .16) cc = (y < -.15 && x < .2) ? L2 : L1; else if (Math.abs(f) < .3) cc = C[5];
        if (Math.abs(y - (.2 - x * .3 + Math.sin(x * 6) * .04)) < .028 && x > -.55 && x < .6) cc = L2;          // сильвієва борозна
        if (Math.abs(x + .05 + y * .25) < .02 && y < .1) cc = L1;                                                 // центральна
      } else if (k === 2) cc = (Math.floor(y * S * .55) % 3 === 0) ? L1 : X3.ramp(C, .6 - dist * .3, i, j);
      else cc = (Math.floor(x * S * .4) % 4 === 0) ? L3 : C[2];
      d[q] = cc;
    }
    for (let n = 0; n < 26; n++) { const i = Math.floor(hash(n, 4) * W), j = Math.floor(hash(n, 9) * H); if (kind[j * W + i] === 1) { for (let a = -1; a <= 1; a++) for (let b2 = -1; b2 <= 1; b2++) if (!a || !b2) { const ii = i + a, jj = j + b2; if (ii >= 0 && jj >= 0 && ii < W && jj < H) d[jj * W + ii] = n % 4 ? L2 : X3.col('#ff9af0'); } } }
    x2.putImageData(im, 0, 0);
    c.save(); c.globalAlpha = .96; c.imageSmoothingEnabled = false; c.drawImage(cv, cx - r * 1.15, cy - r * .88, r * 2.3, r * 2); c.restore();
  }
  /** Карта світу крапками (та сама, що на екранах лівого крила). */
  function map(c, x, y, w, h) { K.scrMap(c, x, y, w, h, 1.7, { hot: ['kyiv', 'warsaw', 'amsterdam'] }); }
  /** Шухляди: фасад з фаскою, ручка, LED-смужка. */
  function drawer(c, x, y, w, h, o = {}) {
    const g = c.createLinearGradient(0, y, 0, y + h); g.addColorStop(0, o.a || '#2a1c5a'); g.addColorStop(1, o.b || '#170f38'); c.fillStyle = g; rr(c, x, y, w, h, .8); c.fill();
    c.strokeStyle = 'rgba(160,140,255,.45)'; c.lineWidth = .45; rr(c, x + .3, y + .3, w - .6, h - .6, .7); c.stroke();
    c.fillStyle = '#05030f'; c.fillRect(x + .4, y + h - .7, w - .8, .5);
    const hw = Math.min(w * .42, 10); c.fillStyle = '#9a8ae0'; rr(c, x + w / 2 - hw / 2, y + h * .32, hw, Math.max(.9, h * .12), .5); c.fill(); c.fillStyle = '#e0d8ff'; c.fillRect(x + w / 2 - hw / 2 + .3, y + h * .32, hw - .6, .35);
    if (o.led) { c.fillStyle = o.led; c.fillRect(x + w - 2.6, y + 1.2, 1.2, 1.2); }
  }

  // ---------- ВИВІСКИ (єдиний стиль, як NX.kit.sign) ----------
  const SIGN = { mk_sign: ['nav.marketing', 'target', '#ff4fd8'], an_sign: ['nav.analytics', 'chart', '#3be8ff'], ai_sign: ['nav.ai', 'ai', '#3be8ff'],
    ws_sign: ['nav.workshop', 'bot', '#ff4fd8'], tl_sign: ['nav.tools', 'gear', '#3be8ff'], pt_sign: ['nav.portal', 'spiral', '#d98aff'] };
  const UNI = Object.values(SIGN).map(v => v[0]);                                      // усі назви зон: шрифт — один на всіх (під найдовшу)
  Object.entries(SIGN).forEach(([id, [key, ic, acc]]) => { PAINT[id] = (c, fw, fh) => A.signPlate(c, 0, 0, fw, fh, { key, icon: ic, acc, uni: UNI }); });

  // ---------- ЛІВЕ КРИЛО ----------
  /** AI-центр: великий голо-екран (рожевий неоновий кант — матеріал): графіки ліворуч, мозок по центру, іконки праворуч, еквалайзер. */
  PAINT.ai_screen = (c, fw, fh, B) => {
    const [gx, gy, gw, gh] = R(F(B, 0), fw, fh) || [fw * .05, fh * .03, fw * .9, fh * .94];
    glass(c, gx, gy, gw, gh, { r: 2, line: '#3be8ff', lw: 1 });
    const top = gy + gh * .2, colW = gw * .24;                                                                  // верх — під вивіскою
    // ліва колонка: два графіки
    glass(c, gx + 3, top, colW, gh * .3, { r: 1, a: '#123a9a', b: '#0c2a7a', c: '#081e5e', lw: .5 }); A.txt(c, '84%', gx + 3 + colW * .3, top + 3.2, colW * .5, 2.6, '#bff8ff', { align: 'center' }); bars(c, gx + 5, top + 6, colW - 4, gh * .3 - 9, 7, 1);
    glass(c, gx + 3, top + gh * .33, colW, gh * .3, { r: 1, a: '#123a9a', b: '#0c2a7a', c: '#081e5e', lw: .5 }); A.txt(c, '+21%', gx + 3 + colW * .32, top + gh * .33 + 3.2, colW * .55, 2.6, '#ff9af0'); lineChart(c, gx + 5, top + gh * .33 + 6, colW - 4, gh * .3 - 9, 2);
    // мозок
    const bx = gx + colW + 6, bw = gw - colW * 2 + 2; A.txt(c, t('scene.ai.neuro') + ' 66%', bx + bw / 2, top + 2.4, bw * .7, 2.6, '#bff8ff');
    brain(c, bx + bw / 2, top + gh * .3, Math.min(bw * .36, gh * .24));
    c.fillStyle = 'rgba(120,230,255,.5)'; c.fillRect(bx + bw * .15, top + gh * .55, bw * .7, .6); c.fillStyle = '#e8feff'; c.fillRect(bx + bw * .15, top + gh * .55, bw * .46, .6);
    // журнал «задачі Nexi» під мозком
    glass(c, bx, top + gh * .6, bw, gh * .16, { r: 1, a: '#123a9a', b: '#0c2a7a', c: '#081e5e', lw: .5 });
    for (let k = 0; k < 3; k++) { c.fillStyle = k ? 'rgba(160,230,255,.55)' : '#3bff8a'; c.fillRect(bx + 3, top + gh * .63 + k * 3, k ? bw * (.5 - k * .1) : 2, 1.1); }
    // права колонка: іконки
    const ix = gx + gw - colW * .72 - 2, iw = colW * .7, ih = gh * .1;
    ['mail', 'chat', 'doc', 'chart', 'bolt'].forEach((k, n) => tile(c, ix, top + n * (ih + 1.4), iw, ih, k, null));
    // еквалайзер унизу
    const ey = gy + gh - gh * .1, ew = gw - 8; for (let i = 0; i < 40; i++) { const v = .2 + .8 * Math.abs(Math.sin(i * .7) * Math.cos(i * .23)); c.fillStyle = i % 5 ? '#3be8ff' : '#ff7af0'; c.fillRect(gx + 4 + i * ew / 40, ey + gh * .07 * (1 - v), ew / 40 * .6, gh * .07 * v); }
  };
  /** Монітор AI-центру: графік і карта. */
  PAINT.ai_mon = (c, fw, fh) => { glass(c, fw * .06, fh * .07, fw * .88, fh * .79, { r: 1.2 }); bars(c, fw * .12, fh * .3, fw * .42, fh * .46, 6, 3); lineChart(c, fw * .58, fh * .3, fw * .3, fh * .46, 4, '#7af4ff', 'rgba(90,220,255,.15)'); A.txt(c, t('scene.ai.kpi'), fw * .2, fh * .18, fw * .3, fh * .07, '#bff8ff'); };
  PAINT.ai_top1 = (c, fw, fh) => { glass(c, fw * .06, fh * .1, fw * .88, fh * .8, { r: 1 }); A.txt(c, t('scene.ai.net'), fw * .3, fh * .26, fw * .4, fh * .13, '#bff8ff'); bars(c, fw * .12, fh * .38, fw * .76, fh * .42, 8, 5); };
  PAINT.ai_top2 = (c, fw, fh) => { glass(c, fw * .06, fh * .1, fw * .88, fh * .8, { r: 1 }); A.txt(c, t('scene.ai.log'), fw * .3, fh * .26, fw * .4, fh * .13, '#bff8ff'); for (let k = 0; k < 4; k++) { c.fillStyle = ['#3bff8a', '#3be8ff', '#9a8cff', '#ffe27a'][k]; c.fillRect(fw * .12, fh * (.42 + k * .12), 2.4, 1.2); c.fillStyle = 'rgba(180,235,255,.6)'; c.fillRect(fw * .12 + 3.6, fh * (.42 + k * .12), fw * (.55 - k * .08), 1.2); } };
  PAINT.ai_laptop = (c, fw, fh) => { glass(c, fw * .08, fh * .08, fw * .84, fh * .84, { r: 1, a: '#1a5ad0', b: '#123a9a', c: '#0c2a7a' }); for (let k = 0; k < 5; k++) { c.fillStyle = k === 2 ? '#ff9af0' : 'rgba(200,240,255,.75)'; c.fillRect(fw * .16, fh * (.22 + k * .13), fw * (.66 - (k % 3) * .14), 1.1); } };
  PAINT.ai_holo = (c, fw, fh) => {
    c.save(); const cx = fw / 2, cy = fh * .45, r = Math.min(fw, fh) * .36; c.globalAlpha = .9;
    [[1, '#7af4ff', 1.2], [.72, '#9af8ff', .8], [.45, '#e8feff', .7]].forEach(([k, col, lw]) => { c.strokeStyle = col; c.lineWidth = lw; c.beginPath(); c.ellipse(cx, cy, r * k, r * k, 0, 0, 7); c.stroke(); });
    c.fillStyle = 'rgba(90,220,255,.25)'; c.beginPath(); c.moveTo(cx - r * .3, fh); c.lineTo(cx + r * .3, fh); c.lineTo(cx + r, cy); c.lineTo(cx - r, cy); c.fill(); icon(c, 'ai', cx, cy, r * .7, '#e8feff'); c.restore();
  };
  PAINT.sh_scr1 = (c, fw, fh) => { glass(c, fw * .06, fh * .1, fw * .88, fh * .8, { r: 1 }); bars(c, fw * .12, fh * .3, fw * .5, fh * .5, 5, 7); donut(c, fw * .78, fh * .52, fh * .26, [[3, '#3be8ff'], [2, '#ff4fd8'], [1, '#9a8cff']]); };
  PAINT.sh_scr2 = (c, fw, fh) => { glass(c, fw * .06, fh * .1, fw * .88, fh * .8, { r: 1 }); map(c, fw * .1, fh * .18, fw * .8, fh * .64); };
  PAINT.sh_box = (c, fw, fh) => { drawer(c, fw * .06, fh * .08, fw * .88, fh * .4, { led: '#3bff8a' }); drawer(c, fw * .06, fh * .52, fw * .88, fh * .4); };
  PAINT.sh_books = (c, fw, fh) => {
    const cols = ['#c84a8a', '#4a8ad0', '#d8a030', '#6a4ac0', '#3aa858', '#ff7ad0', '#4ac0c0']; let x = fw * .02;
    for (let k = 0; x < fw * .98; k++) { const w = fw * (.08 + hash(k, 3) * .07), h = fh * (.72 + hash(k, 5) * .28), y = fh - h, col = cols[k % cols.length];
      if (k === 4) { c.save(); c.translate(x, fh); c.rotate(-.28); c.fillStyle = col; c.fillRect(0, -h * .95, w, h * .95); c.restore(); x += w * 1.6; continue; }
      c.fillStyle = col; c.fillRect(x, y, w, h); c.fillStyle = 'rgba(0,0,0,.35)'; c.fillRect(x + w - .5, y, .5, h); c.fillStyle = 'rgba(255,255,255,.4)'; c.fillRect(x, y + h * .18, w, .45); c.fillRect(x, y + h * .74, w, .45); c.fillStyle = 'rgba(255,255,255,.25)'; c.fillRect(x + .3, y, .35, h);
      x += w + .25; }
  };
  /** Будка аналітики: ліворуч — користувачі (стовпчики), праворуч — тренд і «пончик». */
  PAINT.an_booth = (c, fw, fh, B) => {
    const L = R(F(B, 0), fw, fh), Rr = R(F(B, 2), fw, fh);
    if (L) { glass(c, ...L, { r: 1.5 }); A.txt(c, t('scene.analytics.users'), L[0] + L[2] / 2, L[1] + L[3] * .1, L[2] * .8, L[3] * .07, '#bff8ff'); bars(c, L[0] + L[2] * .08, L[1] + L[3] * .22, L[2] * .84, L[3] * .58, 6, 2); ['UA', 'PL', 'NL', 'EN'].forEach((s, k) => A.txt(c, s, L[0] + L[2] * (.16 + k * .22), L[1] + L[3] * .9, L[2] * .2, L[3] * .06, 'rgba(190,240,255,.85)')); }
    if (Rr) { glass(c, ...Rr, { r: 1.5 }); A.txt(c, t('scene.analytics.trend'), Rr[0] + Rr[2] / 2, Rr[1] + Rr[3] * .1, Rr[2] * .8, Rr[3] * .07, '#bff8ff'); lineChart(c, Rr[0] + Rr[2] * .08, Rr[1] + Rr[3] * .2, Rr[2] * .84, Rr[3] * .32, 1.3); donut(c, Rr[0] + Rr[2] * .3, Rr[1] + Rr[3] * .72, Rr[3] * .17, [[72, '#3be8ff'], [28, '#ff4fd8']]); A.txt(c, '72%', Rr[0] + Rr[2] * .3, Rr[1] + Rr[3] * .72, Rr[3] * .2, Rr[3] * .05, '#e8feff');
      for (let k = 0; k < 3; k++) { c.fillStyle = ['#3be8ff', '#ff4fd8', '#9a8cff'][k]; c.fillRect(Rr[0] + Rr[2] * .58, Rr[1] + Rr[3] * (.62 + k * .08), 2, 1.4); c.fillStyle = 'rgba(190,240,255,.7)'; c.fillRect(Rr[0] + Rr[2] * .58 + 3, Rr[1] + Rr[3] * (.62 + k * .08) + .2, Rr[2] * .26, 1); } }
  };
  /** Монітор маркетингу на столі: стрічка постів із сердечками. */
  PAINT.mk_scr = (c, fw, fh) => { glass(c, fw * .08, fh * .08, fw * .84, fh * .78, { r: 1, a: '#1a5ad0' }); for (let k = 0; k < 3; k++) { const y = fh * (.2 + k * .2); c.fillStyle = ['#ff7ad0', '#ffd27a', '#7af4ff'][k]; c.fillRect(fw * .16, y, fh * .12, fh * .12); c.fillStyle = 'rgba(200,240,255,.75)'; c.fillRect(fw * .16 + fh * .18, y + fh * .03, fw * .4, .9); icon(c, 'heart', fw * .78, y + fh * .06, fh * .12, '#ff4fd8'); } };
  PAINT.an_scr = (c, fw, fh) => { glass(c, fw * .08, fh * .08, fw * .84, fh * .78, { r: 1, a: '#1a5ad0' }); bars(c, fw * .16, fh * .26, fw * .68, fh * .5, 5, 9); };
  /** Будка маркетингу: ліворуч — стрічка постів з сердечками, праворуч — AI-теги / реклама (мішень, воронка). */
  PAINT.mk_booth = (c, fw, fh, B) => {
    const O = R(F(B, 0), fw, fh), L = R(F(B, 1), fw, fh), Rr = R(F(B, 2), fw, fh);
    if (O) { c.fillStyle = '#060c2e'; rr(c, O[0], O[1], O[2], O[3], 1.6); c.fill(); A.neonRect(c, O[0] + .6, O[1] + .6, O[2] - 1.2, O[3] - 1.2, '#3be8ff', .7, 1.4); }
    if (L) { glass(c, ...L, { r: 1.2 }); A.txt(c, t('scene.marketing.tags'), L[0] + L[2] / 2, L[1] + L[3] * .1, L[2] * .8, L[3] * .08, '#bff8ff');
      for (let k = 0; k < 3; k++) { const y = L[1] + L[3] * (.22 + k * .26), h = L[3] * .21; c.fillStyle = 'rgba(30,70,170,.85)'; rr(c, L[0] + L[2] * .08, y, L[2] * .84, h, .8); c.fill();
        c.fillStyle = ['#ff7ad0', '#ffd27a', '#7af4ff'][k]; c.fillRect(L[0] + L[2] * .12, y + h * .18, h * .64, h * .64); c.fillStyle = 'rgba(200,240,255,.7)'; c.fillRect(L[0] + L[2] * .12 + h * .8, y + h * .25, L[2] * .4, .9); c.fillRect(L[0] + L[2] * .12 + h * .8, y + h * .55, L[2] * .28, .9);
        icon(c, 'heart', L[0] + L[2] * .8, y + h * .5, h * .44, '#ff4fd8'); } }
    if (Rr) { glass(c, ...Rr, { r: 1.2 }); A.txt(c, t('scene.marketing.ads'), Rr[0] + Rr[2] / 2, Rr[1] + Rr[3] * .1, Rr[2] * .8, Rr[3] * .08, '#bff8ff');
      const cx = Rr[0] + Rr[2] / 2, cy = Rr[1] + Rr[3] * .42, r = Math.min(Rr[2], Rr[3]) * .22; [[1, '#ff4fd8'], [.66, '#7af4ff'], [.33, '#ff4fd8']].forEach(([k, col]) => { c.strokeStyle = col; c.lineWidth = r * .14; c.beginPath(); c.arc(cx, cy, r * k, 0, 7); c.stroke(); }); c.fillStyle = '#fff'; c.beginPath(); c.arc(cx, cy, r * .12, 0, 7); c.fill();
      [.8, .6, .42].forEach((k, n) => { const w = Rr[2] * k * .8, y = Rr[1] + Rr[3] * (.7 + n * .085); c.fillStyle = ['#3be8ff', '#7a8aff', '#ff7ad0'][n]; c.fillRect(cx - w / 2, y, w, Rr[3] * .06); }); }
  };
  /** Фасади столів: шухляди з ручками, неонова кромка плити — з розкладки (лінія 'l' угорі). */
  const deskFront = (c, fw, fh, B) => {
    (B.deco || []).forEach(d => {
      if (d.t === 'l' && d.f[1] < .1) A.neon(c, 0, d.f[1] * fh + .6, fw, d.f[3] * fh + .6, d.col, 1.3);
      if (d.t === 'r') { const [x, y, w, h] = R(d.f, fw, fh); const ys = (B.deco.filter(e => e.t === 'l' && e.f[1] > .1 && e.f[0] >= d.f[0] - .01 && e.f[2] <= d.f[1] + .01).map(e => e.f[1] * fh)); const cuts = [y, ...ys.sort((a, b) => a - b), y + h];
        for (let k = 0; k + 1 < cuts.length; k++) drawer(c, x + .4, cuts[k] + .4, w - .8, cuts[k + 1] - cuts[k] - .8, { led: k === 0 ? '#3bff8a' : null }); }
    });
  };
  ['mk_desk', 'mk_deskL', 'mk_deskR', 'an_desk'].forEach(id => { PAINT[id] = deskFront; });
  PAINT.an_scr2 = PAINT.an_scr; PAINT.mk_scr2 = PAINT.mk_scr;                     // другі монітори на столах аналітики й маркетингу
  PAINT.ai_drawers = (c, fw, fh, B) => (B.deco || []).forEach((d, k) => { const [x, y, w, h] = R(d.f, fw, fh); drawer(c, x, y, w, h, { led: k === 0 ? '#3bff8a' : null }); });
  PAINT.ai_top = (c, fw, fh) => { const g = c.createLinearGradient(0, 0, 0, fh); g.addColorStop(0, '#ffc4f2'); g.addColorStop(.3, '#ff6ad5'); g.addColorStop(.75, '#c83aa8'); g.addColorStop(1, '#5a1060'); c.fillStyle = g; c.fillRect(0, 0, fw, fh); c.fillStyle = 'rgba(255,255,255,.55)'; c.fillRect(0, fh * .18, fw, .5); };
  PAINT.tl_top = PAINT.ai_top;
  ['tl_cabL', 'tl_cabR'].forEach(id => { PAINT[id] = (c, fw, fh) => { drawer(c, fw * .07, fh * .1, fw * .86, fh * .38, { led: '#3be8ff' }); drawer(c, fw * .07, fh * .54, fw * .86, fh * .38); }; });
  PAINT.an_poster = (c, fw, fh) => { c.fillStyle = '#0a0620'; rr(c, 0, 0, fw, fh, 2); c.fill(); A.neonRect(c, 1, 1, fw - 2, fh - 2, '#ff4fd8', .8, 2); icon(c, 'chart', fw / 2, fh / 2, Math.min(fw, fh) * .55, '#7af4ff'); };

  // ---------- ПОСТЕРИ В РАМКАХ (оздоби стіни, objects/arc_scene.js: DECOR) ----------
  /** «NEXORA» — синтвейв: небо, смугасте сонце, неонова сітка, силует Nexi з антеною. */
  PAINT.poster_nexora = (c, fw, fh) => {
    const m = 1.6, x = m, y = m, w = fw - m * 2, h = fh - m * 2, g = c.createLinearGradient(0, y, 0, y + h); g.addColorStop(0, '#12062e'); g.addColorStop(.55, '#5a1462'); g.addColorStop(.62, '#ff5aa8'); g.addColorStop(.64, '#1a0636'); g.addColorStop(1, '#0a0420');
    c.fillStyle = g; c.fillRect(x, y, w, h); const cx = x + w / 2, cy = y + h * .6, r = w * .3;
    c.save(); c.beginPath(); c.rect(x, y, w, h * .6); c.clip(); const sg = c.createLinearGradient(0, cy - r, 0, cy); sg.addColorStop(0, '#ffe27a'); sg.addColorStop(1, '#ff4fa8'); c.fillStyle = sg; c.beginPath(); c.arc(cx, cy, r, 0, 7); c.fill();
    c.fillStyle = '#5a1462'; for (let k = 0; k < 4; k++) c.fillRect(x, cy - r * (.15 + k * .17), w, r * (.04 + k * .015)); c.restore();
    c.strokeStyle = '#3be8ff'; c.lineWidth = .4; for (let k = 1; k < 6; k++) { const yy = cy + (h * .4) * (k / 6) ** 1.6; c.beginPath(); c.moveTo(x, yy); c.lineTo(x + w, yy); c.stroke(); }
    for (let k = -4; k <= 4; k++) { c.beginPath(); c.moveTo(cx + k * w * .04, cy); c.lineTo(cx + k * w * .3, y + h); c.stroke(); }
    c.fillStyle = '#0a0420'; c.beginPath(); c.arc(cx, cy - r * .42, r * .34, 0, 7); c.fill(); c.fillRect(cx - r * .3, cy - r * .2, r * .6, r * .2); c.fillRect(cx - .3, cy - r * .95, .6, r * .25); c.beginPath(); c.arc(cx, cy - r * .98, .9, 0, 7); c.fill();
    c.fillStyle = '#3be8ff'; c.fillRect(cx - r * .17, cy - r * .48, r * .12, r * .1); c.fillRect(cx + r * .05, cy - r * .48, r * .12, r * .1);
    A.txt(c, 'NEXORA', cx, y + h * .12, w * .8, h * .09, '#ff9af0', { glow: '#ff4fd8' });
  };
  /** «МЯУ» — рудий кіт у сонцезахисних окулярах (як Рудик). */
  PAINT.poster_meow = (c, fw, fh) => {
    const m = 1.5, x = m, y = m, w = fw - m * 2, h = fh - m * 2, g = c.createLinearGradient(0, y, 0, y + h); g.addColorStop(0, '#2a0c5a'); g.addColorStop(1, '#8a1a7a'); c.fillStyle = g; c.fillRect(x, y, w, h);
    const cx = x + w / 2, cy = y + h * .5, r = w * .3;
    c.fillStyle = '#e8862a'; c.beginPath(); c.moveTo(cx - r * .95, cy - r * .3); c.lineTo(cx - r * .7, cy - r * 1.2); c.lineTo(cx - r * .2, cy - r * .75); c.fill(); c.beginPath(); c.moveTo(cx + r * .95, cy - r * .3); c.lineTo(cx + r * .7, cy - r * 1.2); c.lineTo(cx + r * .2, cy - r * .75); c.fill();
    c.beginPath(); c.ellipse(cx, cy, r, r * .82, 0, 0, 7); c.fill(); c.fillStyle = '#ffd0a0'; c.beginPath(); c.ellipse(cx, cy + r * .35, r * .45, r * .3, 0, 0, 7); c.fill();
    c.fillStyle = '#c86418'; for (let k = -1; k <= 1; k++) c.fillRect(cx + k * r * .3 - r * .05, cy - r * .78, r * .1, r * .3);
    c.fillStyle = '#0a0420'; c.fillRect(cx - r * .8, cy - r * .2, r * .68, r * .34); c.fillRect(cx + r * .12, cy - r * .2, r * .68, r * .34); c.fillRect(cx - r * .12, cy - r * .12, r * .24, r * .08);
    c.fillStyle = '#7af4ff'; c.fillRect(cx - r * .68, cy - r * .14, r * .2, r * .07); c.fillRect(cx + r * .24, cy - r * .14, r * .2, r * .07); c.fillStyle = '#ff6ab0'; c.fillRect(cx - r * .06, cy + r * .22, r * .12, r * .08);
    A.txt(c, t('scene.poster.meow'), cx, y + h * .88, w * .8, h * .1, '#ffe27a', { glow: '#ff9a3a' });
  };
  /** Ботанічний принт: світлий папір, листок монстери з розрізами, підпис-«латиною» — штрихами. */
  PAINT.poster_leaf = (c, fw, fh) => {
    const m = 1.4, x = m, y = m, w = fw - m * 2, h = fh - m * 2; c.fillStyle = '#e8e0d0'; c.fillRect(x, y, w, h);
    const cx = x + w / 2, cy = y + h * .46, r = Math.min(w, h) * .36; c.fillStyle = '#2f8a54'; c.beginPath(); c.ellipse(cx, cy, r, r * .9, -.3, 0, 7); c.fill();
    c.strokeStyle = '#e8e0d0'; c.lineWidth = .7; for (let k = 0; k < 5; k++) { const a = -2.4 + k * .55; c.beginPath(); c.moveTo(cx + Math.cos(a) * r * .35, cy + Math.sin(a) * r * .35); c.lineTo(cx + Math.cos(a) * r * 1.1, cy + Math.sin(a) * r); c.stroke(); }
    c.strokeStyle = '#1a5a34'; c.lineWidth = .4; c.beginPath(); c.moveTo(cx - r * .6, cy + r * .6); c.lineTo(cx + r * .5, cy - r * .5); c.stroke(); c.strokeStyle = '#4a3a2a'; c.beginPath(); c.moveTo(cx - r * .6, cy + r * .6); c.lineTo(cx - r * .8, y + h * .92); c.stroke();
    c.fillStyle = '#6a5a4a'; c.fillRect(x + w * .2, y + h * .9, w * .6, .5);
  };
  /** Технічна табличка (праве крило): жовто-чорні смуги, блискавка. */
  PAINT.poster_warn = (c, fw, fh) => {
    c.fillStyle = '#ffd23a'; c.fillRect(1, 1, fw - 2, fh - 2); c.save(); c.beginPath(); c.rect(1, 1, fw - 2, fh * .22); c.rect(1, fh * .78, fw - 2, fh * .22 - 1); c.clip(); c.fillStyle = '#14101e'; for (let k = -6; k < 12; k++) { c.beginPath(); c.moveTo(k * 4, 0); c.lineTo(k * 4 + 2, 0); c.lineTo(k * 4 + 2 + fh, fh); c.lineTo(k * 4 + fh, fh); c.fill(); } c.restore();
    icon(c, 'bolt', fw / 2, fh / 2, Math.min(fw, fh) * .42, '#14101e');
  };

  // ---------- ПРАВЕ КРИЛО ----------
  /** Екран NEXORA AI: назва, карта світу з пінгами, плитки (чат, пошта, графік, бот), лінія активності. */
  PAINT.hub = (c, fw, fh) => {
    c.fillStyle = '#071a5a'; c.fillRect(0, 0, fw, fh); glass(c, 1.5, 1.5, fw - 3, fh - 3, { r: 2, line: '#3be8ff', lw: 1.1 });
    A.txt(c, 'NEXORA AI', fw * .42, fh * .14, fw * .6, fh * .085, '#bff8ff', { glow: '#3be8ff' });
    glass(c, fw * .07, fh * .25, fw * .64, fh * .42, { r: 1.2, a: '#123a9a', b: '#0c2a7a', c: '#081e5e', lw: .6 }); map(c, fw * .09, fh * .28, fw * .6, fh * .36);
    ['chat', 'mail', 'chart', 'bot'].forEach((k, n) => tile(c, fw * .76, fh * (.13 + n * .14), fw * .17, fh * .12, k, null));
    c.fillStyle = '#3bff8a'; c.fillRect(fw * .08, fh * .72, 2, 2); A.txt(c, t('scene.hub.online'), fw * .2, fh * .735, fw * .22, fh * .04, '#bff8ff', { align: 'left' });
    lineChart(c, fw * .07, fh * .78, fw * .86, fh * .14, 6, '#ff4fd8', 'rgba(255,80,220,.15)');
  };
  PAINT.hub_strip = (c, fw, fh) => { c.fillStyle = '#0c1238'; c.fillRect(0, 0, fw, fh); for (let k = 0; k < 6; k++) { const y = fh * (.05 + k * .155), h = fh * .13; c.fillStyle = '#140c34'; c.fillRect(fw * .14, y, fw * .72, h); A.neonRect(c, fw * .16, y + .4, fw * .68, h - .8, '#ff4fd8', .5, .6); for (let q = 0; q < 3; q++) { c.fillStyle = hash(k, q) > .4 ? '#3bff8a' : '#ff9af0'; c.fillRect(fw * (.28 + q * .16), y + h * .4, 1.2, 1.2); } } };
  /** Сканер майстерні: рожеве голо-скло, емблема Nexi з кільцями, іконки скінів, смуга сканування. */
  PAINT.ws_back = (c, fw, fh, B) => {
    const d = (B.deco || [])[0], [x, y, w, h] = d ? R(d.f, fw, fh) : [fw * .02, fh * .02, fw * .96, fh * .96], k = (d && d.k || .1) * w;
    c.beginPath(); c.moveTo(x, y + h); c.lineTo(x + w, y + h); c.lineTo(x + w, y + k); c.lineTo(x + w - k, y); c.lineTo(x + k, y); c.lineTo(x, y + k); c.closePath();
    const g = c.createLinearGradient(0, y, 0, y + h); g.addColorStop(0, '#d03ab8'); g.addColorStop(.5, '#8a1a8a'); g.addColorStop(1, '#4a0a5a'); c.fillStyle = g; c.fill();
    c.save(); c.clip(); c.fillStyle = 'rgba(255,190,245,.12)'; for (let yy = y; yy < y + h; yy += 1.6) c.fillRect(x, yy, w, .55);
    const cx = x + w / 2, cy = y + h * .3, r = w * .16; [[1.6, 'rgba(255,170,240,.5)', .8], [1.25, '#ff9af0', .9], [1, '#ffd6f6', 1.2]].forEach(([q, col, lw]) => { c.strokeStyle = col; c.lineWidth = lw; c.beginPath(); c.arc(cx, cy, r * q, 0, 7); c.stroke(); });
    c.fillStyle = 'rgba(255,214,246,.95)'; c.beginPath(); c.arc(cx, cy, r * .8, 0, 7); c.fill(); icon(c, 'bot', cx, cy, r * 1.1, '#8a1a8a');
    ['ai', 'heart', 'bolt', 'gear'].forEach((ic, n) => icon(c, ic, x + w * (.14 + n * .24), y + h * .62 + (n % 2) * 4, w * .09, 'rgba(255,200,245,.85)'));
    c.fillStyle = 'rgba(255,220,250,.6)'; c.fillRect(x, y + h * .5, w, .8); c.restore();
    c.strokeStyle = '#ff7af0'; c.lineWidth = 1; c.beginPath(); c.moveTo(x, y + h); c.lineTo(x, y + k); c.lineTo(x + k, y); c.lineTo(x + w - k, y); c.lineTo(x + w, y + k); c.lineTo(x + w, y + h); c.stroke();
  };
  /** Платформа майстерні (фасад, як на картинці): рожева неонова кромка, панелі зі швами, бічні блоки з ґратками вентиляції,
   *  посередині — помаранчева світна щілина в темній ніші (з ґраткою й світлою серцевиною), блакитні LED. Решта — матеріал. */
  PAINT.ws_base = (c, fw, fh) => {
    A.neon(c, 0, fh * .05 + .6, fw, fh * .05 + .6, '#ff4fd8', 1.3);
    const seam = x => { c.fillStyle = 'rgba(3,2,14,.9)'; c.fillRect(x - .5, fh * .16, 1, fh * .8); c.fillStyle = 'rgba(160,140,255,.22)'; c.fillRect(x + .5, fh * .16, .5, fh * .8); };
    [.17, .3, .7, .83].forEach(f => seam(fw * f));
    [[.05, .14], [.86, .95]].forEach(([a, b]) => { for (let k = 0; k < 4; k++) { const y = fh * (.36 + k * .13); c.fillStyle = 'rgba(3,2,14,.85)'; rr(c, fw * a, y, fw * (b - a), fh * .06, .4); c.fill(); c.fillStyle = 'rgba(160,140,255,.18)'; c.fillRect(fw * a, y + fh * .06, fw * (b - a), .35); } });
    const sw = fw * .2, sh = fh * .2, sx = fw / 2 - sw / 2, sy = fh * .46;                      // щілина
    c.fillStyle = '#07030e'; rr(c, sx - 1.6, sy - 1.6, sw + 3.2, sh + 3.2, 1.6); c.fill(); c.strokeStyle = 'rgba(170,150,255,.35)'; c.lineWidth = .4; rr(c, sx - 1.6, sy - 1.6, sw + 3.2, sh + 3.2, 1.6); c.stroke();
    const g = c.createLinearGradient(0, sy, 0, sy + sh); g.addColorStop(0, '#fff0c8'); g.addColorStop(.3, '#ffbe5a'); g.addColorStop(.75, '#ff8a2a'); g.addColorStop(1, '#b8460a'); c.fillStyle = g; rr(c, sx, sy, sw, sh, 1); c.fill();
    c.fillStyle = 'rgba(255,255,255,.75)'; c.fillRect(sx + 1.2, sy + sh * .22, sw - 2.4, .6);
    c.fillStyle = 'rgba(120,40,4,.45)'; for (let x = sx + 2.2; x < sx + sw - 1; x += 2.4) c.fillRect(x, sy + .4, .55, sh - .8);
    [.22, .245, .755, .78].forEach(f => { c.fillStyle = '#3be8ff'; c.beginPath(); c.arc(fw * f, fh * .56, .95, 0, 7); c.fill(); c.fillStyle = '#e4fdff'; c.fillRect(fw * f - .3, fh * .56 - .3, .6, .6); });
  };
  ['ws_tabL', 'ws_tabR'].forEach((id, n) => { PAINT[id] = (c, fw, fh) => { glass(c, fw * .08, fh * .05, fw * .84, fh * .9, { r: 1, a: '#1a62c8', b: '#0f3a96', c: '#0a2470' }); A.txt(c, t('scene.ws.skins'), fw / 2, fh * .12, fw * .7, fh * .05, '#bff8ff');
    for (let q = 0; q < 6; q++) { const cx = fw * (.32 + (q % 2) * .36), cy = fh * (.3 + Math.floor(q / 2) * .24); c.fillStyle = 'rgba(30,80,180,.8)'; rr(c, cx - fw * .15, cy - fh * .1, fw * .3, fh * .2, .6); c.fill(); icon(c, 'bot', cx, cy, fw * .18, ['#9af8ff', '#ff9af0', '#ffd27a', '#3bff8a', '#c8a0ff', '#ffffff'][(q + n * 2) % 6]); } }; });
  PAINT.ws_term = (c, fw, fh) => { c.fillStyle = '#0c1430'; c.fillRect(0, 0, fw, fh); [[.12, .36], [.42, .66], [.72, .94]].forEach(([a, b], k) => { const y = fh * a, h = fh * (b - a); glass(c, fw * .14, y, fw * .72, h, { r: 1 }); if (k === 0) bars(c, fw * .2, y + h * .3, fw * .6, h * .55, 5, 11); else if (k === 1) for (let q = 0; q < 4; q++) { c.fillStyle = q === 1 ? '#3bff8a' : 'rgba(190,240,255,.7)'; c.fillRect(fw * .2, y + h * (.22 + q * .18), fw * (.5 - q * .06), 1); } else lineChart(c, fw * .2, y + h * .2, fw * .6, h * .6, 3, '#7af4ff', 'rgba(90,220,255,.15)'); }); };
  PAINT.ws_ped = (c, fw, fh) => { c.fillStyle = '#0c2a5a'; rr(c, fw * .1, fh * .46, fw * .8, fh * .46, 1); c.fill(); A.neonRect(c, fw * .1, fh * .46, fw * .8, fh * .46, '#3be8ff', .6, 1); c.strokeStyle = '#7af4ff'; c.lineWidth = .8; c.beginPath(); c.arc(fw / 2, fh * .7, fw * .17, 0, 7); c.stroke(); icon(c, 'gear', fw / 2, fh * .7, fw * .2, '#7af4ff'); };
  /** Дошка інструментів: перфодошка (дірочки), інструменти на гачках у помаранчевій рамці, неонові канти. */
  PAINT.tl_board = (c, fw, fh, B) => {
    c.fillStyle = 'rgba(10,20,70,.6)'; c.fillRect(2, 2, fw - 4, fh - 4);
    for (let y = 5; y < fh - 3; y += 3.2) for (let x = 5; x < fw - 3; x += 3.2) { c.fillStyle = 'rgba(2,4,20,.9)'; c.fillRect(x, y, .8, .8); }
    (B.deco || []).forEach(d => { if (d.t === 'l') A.neon(c, d.f[0] * fw, d.f[1] * fh, d.f[2] * fw, d.f[3] * fh, d.col, 1.1); });
    const o = R(F(B, 0), fw, fh); if (o) { const [x, y, w, h] = o; c.fillStyle = '#1a0e08'; c.fillRect(x, y, w, h); A.neonRect(c, x, y, w, h, '#ff9a3a', .6, .5);
      const tools = [['wrench', '#c8d0f0'], ['gear', '#ffd27a'], ['bolt', '#ff9a3a']]; tools.forEach(([ic, col], n) => icon(c, ic, x + w * (.25 + n * .25), y + h * (.32 + (n % 2) * .3), w * .28, col)); }
  };
  PAINT.tl_tiles = (c, fw, fh) => { c.fillStyle = '#0a1440'; c.fillRect(0, 0, fw, fh); A.neonRect(c, .5, .5, fw - 1, fh - 1, '#3be8ff', .6, 1); [['mail', 'scene.tools.mail'], ['cal', 'scene.tools.cal'], ['crm', 'scene.tools.crm']].forEach(([ic, key], n) => tile(c, fw * (.03 + n * .325), fh * .08, fw * .3, fh * .84, ic, t(key))); };
  PAINT.tl_tileBL = (c, fw, fh) => tile(c, .5, .5, fw - 1, fh - 1, 'bot', null);
  PAINT.tl_tileBR = (c, fw, fh) => { glass(c, .5, .5, fw - 1, fh - 1, { r: 1.2 }); A.txt(c, t('scene.tools.auto'), fw / 2, fh * .14, fw * .7, fh * .09, '#bff8ff'); const P = [[.2, .4], [.5, .3], [.8, .45], [.35, .75], [.68, .78]]; c.strokeStyle = '#7af4ff'; c.lineWidth = .6; [[0, 1], [1, 2], [0, 3], [1, 4], [3, 4], [2, 4]].forEach(([a, b]) => { c.beginPath(); c.moveTo(P[a][0] * fw, P[a][1] * fh); c.lineTo(P[b][0] * fw, P[b][1] * fh); c.stroke(); }); P.forEach(([x, y], k) => { c.fillStyle = k === 1 ? '#ff7af0' : '#e8feff'; c.beginPath(); c.arc(x * fw, y * fh, 1.6, 0, 7); c.fill(); }); };
  PAINT.tl_item3 = (c, fw, fh) => { glass(c, fw * .1, fh * .1, fw * .8, fh * .6, { r: .6 }); c.fillStyle = '#3bff8a'; c.fillRect(fw * .25, fh * .3, fw * .5, fh * .15); };
  /** Портал: арка-отвір з глибоким вихором (статичний; живий — arc_live.js), хромований обід з неоном. */
  PAINT.pt_back = (c, fw, fh, B) => {
    const d = (B.deco || [])[0], [x0, y0, w, h] = d ? R(d.f, fw, fh) : [0, 0, fw, fh], x1 = x0 + w, y1 = y0 + h, sp = (d ? d.spring : .3) * fh, cx = (x0 + x1) / 2, rx = w / 2;
    const arch = () => { c.beginPath(); c.moveTo(x0, y1); c.lineTo(x0, sp); c.ellipse(cx, sp, rx, sp - y0, 0, Math.PI, 0); c.lineTo(x1, y1); c.closePath(); };
    arch(); c.fillStyle = '#12063a'; c.fill(); c.save(); arch(); c.clip();
    const vx = d && d.vortex ? x0 + d.vortex[0] * w : cx, vy = d && d.vortex ? y0 + d.vortex[1] * h : y0 + h * .6, R0 = w * .55;
    const g = c.createRadialGradient(vx, vy, 0, vx, vy, R0); g.addColorStop(0, '#f4ecff'); g.addColorStop(.12, '#b49af8'); g.addColorStop(.35, '#6a3ad8'); g.addColorStop(.7, '#2a1890'); g.addColorStop(1, '#12063a'); c.fillStyle = g; c.fillRect(x0, y0, w, h);
    for (let arm = 0; arm < 4; arm++) { c.strokeStyle = arm % 2 ? 'rgba(255,120,240,.75)' : 'rgba(120,230,255,.75)'; c.lineWidth = 1.2; c.beginPath();
      for (let s = 0; s <= 60; s++) { const q = s / 60, a = arm * Math.PI / 2 + q * 5.2, r = R0 * (.08 + q * .85); const x = vx + Math.cos(a) * r, y = vy + Math.sin(a) * r * .9; s ? c.lineTo(x, y) : c.moveTo(x, y); } c.stroke(); }
    for (let k = 0; k < 60; k++) { const a = hash(k, 1) * 6.28, r = R0 * (.1 + hash(k, 2) * .85); c.fillStyle = k % 3 ? '#e8d8ff' : '#7af4ff'; c.fillRect(vx + Math.cos(a) * r, vy + Math.sin(a) * r * .9, .8, .8); }
    c.restore();
    arch(); c.strokeStyle = '#bcc5e6'; c.lineWidth = 2.4; c.stroke(); arch(); c.strokeStyle = '#3be8ff'; c.lineWidth = 1; c.stroke(); arch(); c.strokeStyle = '#e4fdff'; c.lineWidth = .35; c.stroke();
  };
  NX.arc.pt = { glass, bars, lineChart, donut, icon, tile, brain, map, drawer, rr, F, R, IC };   // для живих екранів (objects/arc_live.js)
})();

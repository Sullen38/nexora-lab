/* ============================================================================
 * objects/decor_collage.js — «СТІНА КОЛЕКЦІОНЕРА» довкола сот над AI-центром (Декор стін · 53)
 * ----------------------------------------------------------------------------
 * Власник: «соти маленькі, плакати рівно між сотами — не прикольно; зроби ту область класною, насиченою, щоб її було цікаво
 * вивчати, і щоб не було порожнього місця». Соти — великий кластер (tools/wingbox/decor.py Л1), а вся вільна цегла між сотами,
 * рослинами й зонами заповнюється КОЛАЖЕМ: смішні плакати без слів (під кутом), поляроїди (Nexi, Рудик, листок), записки на
 * скотчі, наліпки, неонові значки, зверху — гірлянда з вогниками.
 * Розкладка НЕ задана руками: при першому кадрі модуль бере вільні прямокутники над зонами (dc.air з decor.py), перешкоди (екранні
 * рамки сот і рослин) і детерміновано «розкидає» речі від великих до малих: не на перешкоди, між собою — з невеликим накладанням
 * (наліпка може лягти на край плаката), з нахилом уздовж цегляних рядів ± свій кут. Тож після будь-якої зміни сот колаж сам
 * перекладається. Без текстів (словники не потрібні). Тап по речі — вона гойдається (NX.decorCollage.tap).
 * Малюється з objects/decor_live.js (шар 'art', перед сяйвом сот).
 * ========================================================================== */
(() => {
  const hash = NX.art.hash, TAU = Math.PI * 2, S = 4;                                                                   // S — px спрайта на одиницю кімнати
  const cvs = (w, h) => { const cv = document.createElement('canvas'); cv.width = Math.ceil(w * S); cv.height = Math.ceil(h * S); const c = cv.getContext('2d'); c.scale(S, S); return [cv, c]; };
  const mask = (c, rows, pal, x0, y0, p) => rows.forEach((row, j) => { for (let i = 0; i < row.length; i++) { const col = pal[row[i]]; if (col) { c.fillStyle = col; c.fillRect(x0 + i * p, y0 + j * p, p + .03, p + .03); } } });
  // ---------- малюнки (маски: символ → колір) ----------
  const ART = {
    cat: [['..y.y.y..', '..yyyyy..', '.o.....o.', '.oo...oo.', '.ooooooo.', '.kkkokkk.', '.kkkokkk.', '.ooopooo.', '.oowwwoo.', '..ooooo..'], { y: '#ffd23a', o: '#ff8a3a', k: '#101018', p: '#ff6ab0', w: '#fff0e0' }],
    nobug: [['..rrrrr..', '.r.....r.', 'r.a...ar.', 'r..ggg.rr', 'r.agggr.r', 'r..grg..r', 'r.argga.r', 'rr.ggg..r', '.r.....r.', '..rrrrr..'], { r: '#ff3a5a', g: '#3bff8a', a: '#1a8a4a' }],
    coffee: [['..s..s...', '.s..s....', '..s..s...', '.........', 'wwwwwww..', 'wwhwhwwbb', 'wwhhhww.b', 'wwwhwwwbb', 'wwwwwww..', '.wwwww...', 'ccccccccc'], { s: '#d8e8ff', w: '#f0f0ff', h: '#ff3a6a', b: '#f0f0ff', c: '#8a5a3a' }],
    cactus: [['....g....', '...ggg...', 'g..ggg..g', 'g.kkgkk.g', 'gggkgkggg', '..gggg...', '...ggg...', '...ggg.yp', '...ggg.yy', '..ttttt.y', '..ttttt..', '...ttt...'], { g: '#3bd86a', k: '#101018', t: '#d8703a', y: '#ffd23a', p: '#ff4fd8' }],
    rocket: [['....w....', '...www...', '...wbw...', '...wbw...', '...www...', '..rwwwr..', '.rrwwwrr.', '.r..o..r.', '....y....', '...y.y...'], { w: '#f0f0ff', b: '#3be8ff', r: '#ff3a5a', o: '#ff9a3a', y: '#ffd23a' }],
    ufo: [['...ccc...', '..cwwwc..', '.ccccccc.', 'ggggggggg', '.gygygyg.', '...y.y...', '..y...y..', '.y..p..y.', '....p....'], { c: '#3be8ff', w: '#e8ffff', g: '#9a8aff', y: '#b8ff3a', p: '#ff6ab0' }],
    plant: [['....g....', '.g..g..g.', '.gg.g.gg.', '..ggggg..', '...ggg...', '....g....', '..ttttt..', '..ttttt..', '...ttt...'], { g: '#3bd86a', t: '#d8703a' }],
    nexi: [['....g....', '....c....', '.ccccccc.', '.c.....c.', '.c.w.w.c.', '.c.....c.', '.c.www.c.', '.ccccccc.'], { g: '#3bff8a', c: '#3be8ff', w: '#e8ffff' }],
    rudik: [['.o.....o.', '.oo...oo.', '.ooooooo.', '.ogoooGo.', '.ooopooo.', '.oowwwoo.', '..ooooo..'], { o: '#ff8a3a', g: '#3bff8a', G: '#3bff8a', p: '#ff6ab0', w: '#fff0e0' }],
    star: [['...y...', '...y...', 'yyyyyyy', '.yyyyy.', '..yyy..', '.yy.yy.', '.y...y.'], { y: '#ffd23a' }],
    bolt: [['...cc', '..cc.', '.ccc.', 'ccccc', '.ccc.', '.cc..', 'cc...'], { c: '#3be8ff' }],
    heart: [['.pp.pp.', 'ppppppp', 'ppppppp', '.ppppp.', '..ppp..', '...p...'], { p: '#ff4fd8' }],
    smile: [['.yyyyy.', 'yyyyyyy', 'yykykyy', 'yyyyyyy', 'ykyyyky', 'yykkkyy', '.yyyyy.'], { y: '#ffd23a', k: '#2a1a08' }],
    leaf: [['....gg.', '..ggGg.', '.ggGgg.', '.gGggg.', 'gGggg..', 'Ggg....', 'G......'], { g: '#3bd86a', G: '#1a8a4a' }],
    paw: [['.w.w.w.', '.w.w.w.', '.......', '..www..', '.wwwww.', '.wwwww.', '..www..'], { w: '#f0f0ff' }],
    check: [['.ggggg.', 'ggggggw', 'gggggwg', 'gwggwgg', 'ggwwggg', 'gggwggg', '.ggggg.'], { g: '#2ac86a', w: '#ffffff' }],
    warn: [['...o...', '..ooo..', '..oko..', '.ookoo.', '.ooooo.', 'oookooo', 'ooooooo'], { o: '#ff9a3a', k: '#2a1408' }],
  };
  // ---------- типи речей: w × h (од.), малювалка спрайта ----------
  const poster = (art, bg, frame) => (c, w, h) => { c.fillStyle = '#05030c'; c.fillRect(0, 0, w, h); c.fillStyle = bg; c.fillRect(.5, .5, w - 1, h - 1); c.fillStyle = 'rgba(255,255,255,.06)'; for (let y = 1; y < h; y += 1.3) c.fillRect(.5, y, w - 1, .35);
    const [rows, pal] = ART[art], p = Math.min((w - 3) / rows[0].length, (h - 3) / rows.length); mask(c, rows, pal, (w - rows[0].length * p) / 2, (h - rows.length * p) / 2, p);
    c.strokeStyle = frame; c.lineWidth = .45; c.strokeRect(1, 1, w - 2, h - 2); c.fillStyle = 'rgba(255,255,255,.5)'; c.fillRect(w / 2 - 1.4, -.1, 2.8, 1.1); };   // рамка-неон і смужка скотчу зверху
  const polaroid = art => (c, w, h) => { c.fillStyle = '#f4f0e6'; c.fillRect(0, 0, w, h); c.fillStyle = '#1a1430'; c.fillRect(.8, .8, w - 1.6, h - 3.2); const [rows, pal] = ART[art], p = Math.min((w - 2.6) / rows[0].length, (h - 4.6) / rows.length);
    mask(c, rows, pal, (w - rows[0].length * p) / 2, .8 + (h - 4 - rows.length * p) / 2, p); c.fillStyle = '#b8b0a0'; c.fillRect(1.4, h - 1.6, w * .45, .35); c.fillStyle = '#ff3a5a'; c.beginPath(); c.arc(w / 2, .9, .7, 0, TAU); c.fill(); };   // «підпис» рискою, кнопка
  const note = col => (c, w, h) => { c.fillStyle = col; c.fillRect(0, 0, w, h); c.fillStyle = 'rgba(0,0,0,.12)'; c.fillRect(0, h - .8, w, .8); c.fillStyle = 'rgba(40,30,60,.75)'; for (let k = 0; k < 3; k++) c.fillRect(1, 1.8 + k * 1.5, (w - 2) * (k === 2 ? .55 : 1 - k * .15), .4);
    c.fillStyle = 'rgba(255,255,255,.55)'; c.fillRect(w / 2 - 1.6, -.2, 3.2, 1.2); };
  const sticker = art => (c, w, h) => { const [rows, pal] = ART[art], p = Math.min(w / (rows[0].length + 2), h / (rows.length + 2)), x0 = (w - rows[0].length * p) / 2, y0 = (h - rows.length * p) / 2;
    c.fillStyle = '#ffffff'; rows.forEach((row, j) => { for (let i = 0; i < row.length; i++) if (row[i] !== '.') c.fillRect(x0 + (i - .6) * p, y0 + (j - .6) * p, p * 2.2, p * 2.2); }); mask(c, rows, pal, x0, y0, p); };   // біла облямівка наліпки
  const neonSign = (kind, col) => (c, w, h) => { c.lineCap = 'round'; c.lineJoin = 'round'; const path = () => { c.beginPath(); const m = 1.6;
      if (kind === 'heart') { c.moveTo(w / 2, h - m); c.bezierCurveTo(-w * .2, h * .45, w * .2, -h * .05, w / 2, h * .32); c.bezierCurveTo(w * .8, -h * .05, w * 1.2, h * .45, w / 2, h - m); }
      else if (kind === 'bolt') { c.moveTo(w * .62, m); c.lineTo(w * .28, h * .52); c.lineTo(w * .55, h * .52); c.lineTo(w * .38, h - m); }
      else { c.moveTo(m, h / 2); c.lineTo(w - m, h / 2); c.moveTo(w * .62, h * .25); c.lineTo(w - m, h / 2); c.lineTo(w * .62, h * .75); } };
    for (const [lw, a, st] of [[2.4, .25, col], [1.3, .7, col], [.5, 1, '#ffffff']]) { c.globalAlpha = a; c.strokeStyle = st; c.lineWidth = lw; path(); c.stroke(); } c.globalAlpha = 1; };
  const TYPES = [
    { w: 15, h: 20, tilt: .14, sh: 1, draw: poster('cat', '#1a0c3a', '#ffd27a') }, { w: 15, h: 19, tilt: .14, sh: 1, draw: poster('rocket', '#0a1430', '#3be8ff') },
    { w: 14, h: 18, tilt: .16, sh: 1, draw: poster('cactus', '#0a2a2a', '#3bff8a') }, { w: 14, h: 15, tilt: .16, sh: 1, draw: poster('nobug', '#0c1a2a', '#ff3a5a') },
    { w: 13, h: 16, tilt: .18, sh: 1, draw: poster('coffee', '#2a0c2a', '#ff4fd8') }, { w: 13, h: 14, tilt: .18, sh: 1, draw: poster('ufo', '#10082a', '#c86aff') },
    { w: 10, h: 12, tilt: .22, sh: 1, draw: polaroid('nexi') }, { w: 10, h: 12, tilt: .22, sh: 1, draw: polaroid('rudik') }, { w: 10, h: 12, tilt: .22, sh: 1, draw: polaroid('plant') },
    { w: 10, h: 9, tilt: .1, neon: 1, draw: neonSign('heart', '#ff4fd8') }, { w: 8, h: 11, tilt: .1, neon: 1, draw: neonSign('bolt', '#3be8ff') }, { w: 11, h: 7, tilt: .1, neon: 1, draw: neonSign('arrow', '#b8ff3a') },
    { w: 7, h: 7, tilt: .25, sh: 1, draw: note('#ffe27a') }, { w: 7, h: 7, tilt: .25, sh: 1, draw: note('#ff9ad0') }, { w: 7, h: 7, tilt: .25, sh: 1, draw: note('#9affc0') }, { w: 7, h: 7, tilt: .25, sh: 1, draw: note('#9ad8ff') },
    ...['star', 'bolt', 'heart', 'smile', 'leaf', 'paw', 'check', 'warn', 'star', 'heart', 'leaf', 'smile', 'paw', 'bolt'].map(a => ({ w: 7, h: 7, tilt: .5, st: 1, draw: sticker(a) })),
  ];
  let D = null, BULBS = null;
  /** Розкладка (раз): вільні прямокутники dc.air (ліве крило, до рифу), перешкоди — екранні рамки сот, висячих, дощок. */
  function layout(H) {
    const { items, proj, basis } = H, air = []; D = []; BULBS = [];
    for (const B of items) if (B.dc && B.dc.air) for (const [x0, x1, y0, y1] of B.dc.air) if (x0 < 214 && x1 < 520) air.push([x0, Math.min(x1, 214), y0, y1]);
    if (!air.length) return;
    const bbox = B => { const { P } = basis(B), xs = [], ys = []; for (const u of [-B.w / 2, B.w / 2]) for (const v of [0, B.dep]) for (const y of [B.yt, B.yb]) { const p = proj(P(u, v, y)); xs.push(p[0]); ys.push(p[1]); } return [Math.min(...xs), Math.min(...ys), Math.max(...xs), Math.max(...ys)]; };
    const HEX = items.filter(B => B.st === 'dc_hex'), OBS = items.filter(B => ['dc_hex', 'dc_hang', 'dc_reef', 'dc_win'].includes(B.st) || B.id === 'dc_stag').map(bbox).filter(b => b[0] < 230);
    const slope = x => { let best = 0, bd = 1e9; for (const B of HEX) { const { P } = basis(B), Yc = (B.yt + B.yb) / 2, a = proj(P(-B.w / 2, B.dep, Yc)), b = proj(P(B.w / 2, B.dep, Yc)), d = Math.abs((a[0] + b[0]) / 2 - x); if (d < bd) { bd = d; let an = Math.atan2(b[1] - a[1], b[0] - a[0]); if (an > Math.PI / 2) an -= Math.PI; if (an < -Math.PI / 2) an += Math.PI; best = an; } } return best; };
    const X0 = Math.min(...air.map(a => a[0])) + 2, X1 = Math.max(...air.map(a => a[1])) - 2, yLim = x => { let y = 0; for (const a of air) if (x >= a[0] && x <= a[1]) y = Math.max(y, a[3]); return y; };
    const inter = (a, b) => Math.max(0, Math.min(a[2], b[2]) - Math.max(a[0], b[0])) * Math.max(0, Math.min(a[3], b[3]) - Math.max(a[1], b[1]));
    const place = (T, n, tries) => { for (let q = 0; q < tries; q++) {
        const x = X0 + hash(n * 31 + q, 7) * (X1 - X0), k = 1.2 - (x - X0) / (X1 - X0) * .28, w = T.w * k, h = T.h * k, lim = Math.min(yLim(x - w / 2), yLim(x), yLim(x + w / 2)); if (lim - 5 < h + 2) continue;
        const y = 5 + h / 2 + hash(n * 17 + q, 11) * (lim - 5 - h - 1), r = [x - w / 2, y - h / 2, x + w / 2, y + h / 2]; if (r[0] < X0 - 1 || r[2] > X1 + 1) continue;
        if (OBS.some(o => inter(r, o) > (T.w > 12 ? w * h * .06 : 0))) continue;                                       // великий плакат може ледь зайти за кут рамки соти
        const ov = D.reduce((s, d) => s + inter(r, d.r), 0) / (w * h); if (ov > (T.st ? .3 : T.neon ? 0 : .1)) continue;
        const [cv, c] = cvs(T.w, T.h); T.draw(c, T.w, T.h);
        D.push({ T, cv, x, y, w, h, r, ang: slope(x) + (hash(n, 3) - .5) * 2 * T.tilt, ph: hash(n, 5) * TAU, wig: -9 }); return true; } return false; };
    TYPES.forEach((T, n) => place(T, n, T.w > 12 ? 400 : 120));
    for (let n = 0; n < 60; n++) place(TYPES[6 + (n * 7) % (TYPES.length - 6)], 100 + n, 30);                                                   // решту порожнього місця добиваємо наліпками
    D.sort((a, b) => (a.T.st ? 2 : a.T.neon ? 1 : 0) - (b.T.st ? 2 : b.T.neon ? 1 : 0));                                   // плакати знизу, наліпки зверху
    for (let x = X0; x < X1 - 6; x += 30) { const x1 = Math.min(X1, x + 30); for (let q = 0; q <= 5; q++) { const f = q / 5, bx = x + (x1 - x) * f, by = 2.6 + Math.sin(f * Math.PI) * 2.4; BULBS.push([bx, by, ['#ff4fd8', '#3be8ff', '#ffd23a', '#3bff8a'][BULBS.length % 4]]); } }   // гірлянда: прогини по 30 од.
  }
  NX.decorCollage = {
    get items() { return D; },
    draw(c, t, H) {
      if (!D) layout(H); if (!D || !D.length) return; const { vx0, vx1 } = H;
      c.save(); c.imageSmoothingEnabled = false;
      if (BULBS.length) { c.strokeStyle = '#0a0818'; c.lineWidth = .5; c.beginPath(); BULBS.forEach((b, i) => i ? c.lineTo(b[0], b[1]) : c.moveTo(b[0], b[1])); c.stroke();
        BULBS.forEach((b, i) => { if (b[0] < vx0 - 4 || b[0] > vx1 + 4) return; const on = .45 + .55 * Math.max(0, Math.sin(t * 1.7 + i * 1.3)); c.globalAlpha = on; c.fillStyle = b[2]; c.fillRect(b[0] - .7, b[1], 1.4, 1.8); c.globalAlpha = on * .25; c.beginPath(); c.arc(b[0], b[1] + .9, 3, 0, TAU); c.fill(); }); c.globalAlpha = 1; }
      for (const d of D) { if (d.r[2] < vx0 - 4 || d.r[0] > vx1 + 4) continue; const wg = t - d.wig, sw = wg < 1.6 ? Math.sin(wg * 14) * .22 * Math.exp(-wg * 2.4) : 0;
        c.save(); c.translate(d.x, d.y - (d.T.st ? 0 : d.h / 2)); c.rotate(d.ang + sw + (d.T.st ? 0 : Math.sin(t * .6 + d.ph) * .008)); const oy = d.T.st ? -d.h / 2 : 0;       // плакат гойдається від верхнього краю (скотч)
        if (d.T.sh) { c.globalAlpha = .3; c.fillStyle = '#000'; c.fillRect(-d.w / 2 + .7, oy + .9, d.w, d.h); c.globalAlpha = 1; }
        if (d.T.neon) { c.globalCompositeOperation = 'lighter'; c.globalAlpha = .75 + .25 * Math.sin(t * 3 + d.ph) * (Math.sin(t * 17 + d.ph) > .96 ? .2 : 1); c.imageSmoothingEnabled = true; }
        c.drawImage(d.cv, -d.w / 2, oy, d.w, d.h); c.restore(); }
      c.restore();
    },
    /** Тап по речі колажу: гойднеться. */
    tap(x, y, t = NX.time) { if (!D) return false; for (let i = D.length - 1; i >= 0; i--) { const d = D[i]; if (x >= d.r[0] && x <= d.r[2] && y >= d.r[1] && y <= d.r[3]) { d.wig = t; return true; } } return false; },
    reset() { D = null; },
  };
})();

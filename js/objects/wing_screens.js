/* ============================================================================
 * objects/wing_screens.js — ВМІСТ ЕКРАНІВ КРИЛА (пункт №6): карта, логи, розпізнавання, мерехтіння
 * ----------------------------------------------------------------------------
 * Власник (список «до рівня картинки»): «Екрани: більше типів вмісту (карта, логи, розпізнавання),
 * легке мерехтіння». Розширення NX.kit — живі «сторінки» для будь-якого екрана крила:
 *   K.scrMap(c, x, y, w, h, t, o)  — КАРТА СВІТУ: піксельні континенти крапками (кеш під розмір),
 *        сітка, промінь-радар, дуги між містами з пакетами, пінги-кільця (o.hot — «гарячі» міста рожеві)
 *   K.scrLog(c, x, y, w, h, t, o)  — ЛОГИ: рядки «час · рівень · подія», нові з'являються знизу й
 *        штовхають старі вгору (рівні OK / AI / NET / WARN / ERR своїми кольорами), курсор блимає
 *   K.scrScan(c, x, y, w, h, t, o) — РОЗПІЗНАВАННЯ: ціль у сітці (обличчя / Рудик / логотип N /
 *        документ), лінія сканування, рамка й мітка з упевненістю, точки-орієнтири, стовпчики кандидатів
 *   K.pages(t, seed, n, per)       — яку сторінку показує екран: {i, f, sw — «глітч» перемикання 1 -> 0, id}
 *   K.glitch(c, w, h, t, sw, seed) — перешкоди під час перемикання сторінки
 *   K.flick(t, seed, k)            — ЛЕГКЕ МЕРЕХТІННЯ: яскравість майже рівна, ледь тремтить,
 *        зрідка коротко блимає (як голограма / старий CRT); множник для globalAlpha екрана
 * Хто що показує (по черзі сторінками): AI-центр — NET: мережа ↔ карта, LOG: живий журнал,
 * голо-монітор: KPI ↔ розпізнавання; аналітика — USERS ↔ карта користувачів, ноутбук: стовпчики ↔ лог;
 * маркетинг — стрічка постів ↔ розпізнавання картинок; стелаж — стовпчики ↔ карта.
 * Усе — функції часу (без стану), малюється в полотна екранів, що оновлюються раз на 3 кадри.
 * ========================================================================== */
(() => {
  const P = NX.px, K = NX.kit, hash = NX.art.hash, rgba = K.rgba, lit = K.lit;

  /* ---------------- мерехтіння, сторінки, глітч ---------------- */
  K.flick = (t, seed = 0, k = 1) => {
    const h = hash(Math.floor(t * 8), seed * 7 + 31);
    let f = 1 - .035 * (.5 + .5 * Math.sin(t * 9.1 + seed * 2.3)) * (.5 + .5 * Math.sin(t * 2.7 + seed));
    if (h > .988) f -= .3; else if (h > .972) f -= .12;                                   // зрідка — коротке блимання
    return 1 - (1 - f) * k;
  };
  K.pages = (t, seed, n, per) => { const p = t / per + seed * .618, id = Math.floor(p), f = p - id; return { i: ((id % n) + n) % n, f, sw: Math.max(0, 1 - f * per / .7), id }; };
  K.glitch = (c, w, h, t, sw, seed = 0) => {
    if (sw <= 0) return; const n = Math.floor(t * 30);
    c.save(); c.globalCompositeOperation = 'lighter';
    for (let k = 0; k < 6; k++) { const y = hash(n + k, seed) * h, hh = 2 + hash(n, k + seed) * h * .05, dx = (hash(k, n) - .5) * w * .12; c.fillStyle = k % 2 ? rgba('255,79,216', .26 * sw) : rgba('90,220,255', .32 * sw); c.fillRect(dx, y, w, hh); }
    c.restore();
  };

  /* ---------------- КАРТА ---------------- */
  // світ 48×20 клітинок (рівнокутна проєкція: x = (довгота + 180) / 7.5, y = (80 − широта) / 7)
  const WORLD = [
    '..........XXXXX..XXXXXX..........XXXXXXXX.......', '...XXXXXXXXXXXXX.XXXXXX.....XXXXXXXXXXXXXXXXXXX.',
    '..XXXXXXXXXXXXXX..XXXX...XXXXXXXXXXXXXXXXXXXXXX.', '....XXXXXXXXXXXXX......XXXXXXXXXXXXXXXXXXXXXXXX.',
    '......XXXXXXXXXXXX.....XXXXXXXXXXXXXXXXXXXXXX...', '.......XXXXXXXXXX.....XXXXXXXXXXXXXXXXXXXXXX....',
    '........XXXXXXXX......XXXXXXXXXXXXXXXXXXXXX.....', '.........XXXXX........XXXXXXXXXXXXXXXXXXX.......',
    '..........XXXX........XXXXXXXXXX.XXXXXXX........', '...........XXX.......XXXXXXXXXX...XXXXXX........',
    '.............XXXX.....XXXXXXXXX......XX.........', '.............XXXXXXX.....XXXXX.......XXXXXX.....',
    '.............XXXXXXXX.....XXXX.........XXXXX....', '..............XXXXXXX.....XXXXXX........XXXXX...',
    '..............XXXXXX......XXXXXX.......XXXXXX...', '..............XXXXX.......XXX..........XXXXXX...',
    '..............XXXX......................XXXXX...', '..............XXX.............................XX',
    '..............XX................................', '................................................',
  ];
  const CITIES = { kyiv: [28.0, 4.3], warsaw: [26.8, 4.0], amsterdam: [24.7, 4.0], london: [24.0, 4.1], newyork: [14.1, 5.6], sf: [7.7, 6.0],
    tokyo: [42.7, 6.3], sydney: [44.1, 16.3], saopaulo: [17.9, 14.7], dubai: [31.3, 7.9], singapore: [37.9, 11.3], lagos: [24.4, 10.6] };
  const ROUTES = [['kyiv', 'newyork'], ['amsterdam', 'tokyo'], ['warsaw', 'saopaulo'], ['london', 'dubai'], ['kyiv', 'singapore'], ['amsterdam', 'sydney'], ['sf', 'tokyo']];
  const LAND = new Map();
  /** Континенти крапками під розмір w×h (кешується: один drawImage щоразу). */
  function landLayer(w, h, col) {
    const key = w + 'x' + h + col; let cv = LAND.get(key); if (cv) return cv;
    cv = document.createElement('canvas'); cv.width = w; cv.height = h; const x = cv.getContext('2d'), cw = w / 48, ch = h / 20, d = Math.max(1, Math.floor(Math.min(cw, ch) * .64));
    x.fillStyle = col; WORLD.forEach((row, j) => { for (let i = 0; i < 48; i++) if (row[i] === 'X') x.fillRect(Math.round(i * cw + (cw - d) / 2), Math.round(j * ch + (ch - d) / 2), d, d); });
    LAND.set(key, cv); return cv;
  }
  K.scrMap = (c, x, y, w, h, t, o = {}) => {
    const act = o.act || 0, cw = w / 48, ch = h / 20, at = n => [x + CITIES[n][0] * cw, y + CITIES[n][1] * ch], s = Math.max(2, Math.round(w / 100));
    c.save(); c.beginPath(); c.rect(x, y, w, h); c.clip();
    c.fillStyle = 'rgba(90,170,255,.12)'; for (let k = 1; k < 8; k++) c.fillRect(Math.round(x + k * w / 8), y, 1, h); for (let k = 1; k < 4; k++) c.fillRect(x, Math.round(y + k * h / 4), w, 1);   // меридіани й паралелі
    c.drawImage(landLayer(Math.round(w), Math.round(h), o.land || '#2f7fd0'), x, y);
    c.globalCompositeOperation = 'lighter';
    const sx = x + ((t * (.11 + act * .1)) % 1) * w, g = c.createLinearGradient(sx - w * .2, 0, sx, 0);                       // промінь-радар іде праворуч
    g.addColorStop(0, 'rgba(59,232,255,0)'); g.addColorStop(1, 'rgba(59,232,255,.2)'); c.fillStyle = g; c.fillRect(sx - w * .2, y, w * .2, h); c.fillStyle = 'rgba(150,245,255,.5)'; c.fillRect(sx, y, Math.max(1, s / 2), h);
    ROUTES.forEach(([a, b], k) => {                                                                                        // дуги між містами, по них біжать пакети
      const [x0, y0] = at(a), [x1, y1] = at(b), mx = (x0 + x1) / 2, my = Math.min(y0, y1) - Math.abs(x1 - x0) * .22, ph = (t * (.2 + act * .3) + k * .29) % 1.3;
      c.strokeStyle = k % 2 ? 'rgba(255,120,230,.26)' : 'rgba(90,220,255,.26)'; c.lineWidth = Math.max(1, w / 240); c.beginPath(); c.moveTo(x0, y0); c.quadraticCurveTo(mx, my, x1, y1); c.stroke();
      if (ph < 1) { const u = 1 - ph, px = u * u * x0 + 2 * u * ph * mx + ph * ph * x1, py = u * u * y0 + 2 * u * ph * my + ph * ph * y1; lit(c, Math.round(px - s / 2), Math.round(py - s / 2), s, s, k % 2 ? '#ff9ae6' : '#9af6ff'); }
    });
    Object.keys(CITIES).forEach((n, k) => {                                                                                // пінги: міста по черзі розходяться кільцем
      const [px, py] = at(n), hot = (o.hot || []).includes(n), ph = (t * (hot ? .7 : .38) + k * .37) % 1, r = .5 + ph * Math.max(5, w / 16);
      lit(c, Math.round(px - s / 2), Math.round(py - s / 2), s, s, hot ? '#ff7af0' : '#7af0ff');
      c.strokeStyle = hot ? rgba('255,120,240', (1 - ph) * .75) : rgba('120,240,255', (1 - ph) * .42); c.lineWidth = Math.max(1, s / 2); c.beginPath(); c.ellipse(px, py, r, r * .62, 0, 0, 7); c.stroke();
    });
    c.restore();
  };

  /* ---------------- ЛОГИ ---------------- */
  const LOGS = [['OK', 'chat.reply', 'ms'], ['AI', 'intent: price', ''], ['NET', 'sync', 'n'], ['OK', 'mail.sent', '#'], ['AI', 'summary.ready', ''], ['OK', 'crm.lead', '+1'],
    ['NET', 'api 200', 'ms'], ['WARN', 'cpu', '%'], ['AI', 'lang: uk', ''], ['OK', 'post.queued', '#'], ['AI', 'sentiment +', ''], ['NET', 'cache.hit', '%'], ['OK', 'invoice.pdf', '#'],
    ['AI', 'tokens', 'k'], ['OK', 'backup', 'ms'], ['NET', 'ws.ping', 'ms'], ['AI', 'reply.draft', ''], ['ERR', 'retry 1/3', ''], ['OK', 'report.xlsx', '#'], ['AI', 'lang: pl', '']];
  const LV = { OK: '#3bff8a', AI: '#3be8ff', NET: '#9a8cff', WARN: '#ffe27a', ERR: '#ff6ec8' };
  const val = (kind, id) => kind === 'ms' ? (24 + Math.floor(hash(id, 5) * 380)) + 'ms' : kind === '#' ? '#' + (1000 + Math.floor(hash(id, 6) * 8999)) : kind === '%' ? (38 + Math.floor(hash(id, 7) * 58)) + '%'
    : kind === 'n' ? (1 + Math.floor(hash(id, 8) * 4)) + '/4' : kind === 'k' ? (1 + hash(id, 9) * 8).toFixed(1) + 'k' : kind;
  const two = v => String(v).padStart(2, '0');
  /** o = {act, size — px шрифту, rate — рядків за секунду, time — показувати час, seed}.
   *  Текст рядків рендериться в кеш-полотно лише коли з'являється новий рядок або міняється секунда (fillText дорогий),
   *  щокадру — лише зсув «в'їзду» нового рядка, підсвітка свіжого рядка й курсор. */
  const LOGC = new Map();
  K.scrLog = (c, x, y, w, h, t, o = {}) => {
    const sz = o.size || 9, lh = Math.round(sz * 1.5), rate = (o.rate || 1) * (1 + (o.act || 0) * 1.6), p = t * rate + (o.seed || 0) * 3.1, n0 = Math.floor(p), f = p - n0, rows = Math.ceil(h / lh) + 1;
    const slide = (1 - Math.min(1, f * 5)) * lh, showT = o.time !== false, sec = Math.floor(Date.now() / 1000), key = (o.seed || 0) + ':' + Math.round(w) + 'x' + Math.round(h) + ':' + sz + ':' + showT;
    let L = LOGC.get(key); if (!L) { L = { cv: document.createElement('canvas') }; L.cv.width = Math.ceil(w); L.cv.height = Math.ceil(h + lh); LOGC.set(key, L); }
    if (L.n0 !== n0 || (showT && L.sec !== sec)) {                                                                      // перерендер тексту
      L.n0 = n0; L.sec = sec; const g = L.cv.getContext('2d'); g.clearRect(0, 0, L.cv.width, L.cv.height);
      for (let r = 0; r < rows; r++) {
        const id = n0 - r, E = LOGS[Math.floor(hash(id, 3 + (o.seed || 0)) * LOGS.length)], yy = Math.round(lh + h - lh * (r + 1) + lh * .78); if (yy < 0) continue;
        let tx = 3;
        if (showT) { const d = new Date((sec - Math.round(r / rate)) * 1000); P.text(g, two(d.getHours()) + ':' + two(d.getMinutes()) + ':' + two(d.getSeconds()), tx, yy, '#5a7ab8', sz); tx += sz * 9; }
        P.text(g, E[0], tx, yy, LV[E[0]], sz); tx += sz * 5;
        const msg = (E[1] + ' ' + val(E[2], id)).trim(); P.text(g, msg, tx, yy, r === 0 ? '#e8fdff' : '#9fc8f0', sz);
        if (r === 0) L.cur = Math.min(w - sz, tx + msg.length * sz + 2);
      }
    }
    c.save(); c.beginPath(); c.rect(x, y, w, h); c.clip();
    c.fillStyle = 'rgba(59,232,255,.12)'; c.fillRect(x, y + h - lh + slide, w, lh);                                    // свіжий рядок підсвічено
    c.drawImage(L.cv, x, y - lh + slide);
    if (Math.sin(t * 8) > 0) lit(c, x + L.cur, y + h - lh + slide + lh * .78 - sz + 1, sz * .7, sz, '#3be8ff');          // курсор
    c.restore();
  };

  /* ---------------- РОЗПІЗНАВАННЯ ---------------- */
  const TARGETS = [
    { key: 'FACE', col: '#7af0ff', alt: ['USER', 'BOT'], marks: [[5, 5], [10, 5], [7.5, 8], [7.5, 10.5]], px: [
      '.....XXXXXX.....', '...XX......XX...', '..X..........X..', '.X............X.', '.X..XX....XX..X.', 'X...XX....XX...X', 'X..............X', 'X......XX......X',
      'X..............X', '.X...X....X...X.', '.X....XXXX....X.', '..X..........X..', '...XX......XX...', '.....XXXXXX.....', '......X..X......', '....XX....XX....'] },
    { key: 'CAT', col: '#ffb46a', alt: ['FOX', 'DOG'], marks: [[5, 6], [10, 6], [7.5, 9], [2, 1], [13, 1]], px: [
      '................', '.X............X.', '.XX..........XX.', '.X.X........X.X.', '.X..XXXXXXXX..X.', 'X..............X', 'X...XX....XX...X', 'X...XX....XX...X',
      'X..............X', 'X......XX......X', 'X.....X..X.....X', '.X............X.', '..XX........XX..', '....XXXXXXXX....', '................', '................'] },
    { key: 'LOGO', col: '#ff9ae6', alt: ['ICON', 'TEXT'], marks: [[3, 3], [12, 3], [3, 12], [12, 12]], px: [
      '.....XXXXXX.....', '...XX......XX...', '..X..........X..', '.X..X.....X...X.', '.X..XX....X...X.', 'X...X.X...X....X', 'X...X..X..X....X', 'X...X...X.X....X',
      'X...X....XX....X', 'X...X.....X....X', '.X..X.....X...X.', '.X............X.', '..X..........X..', '...XX......XX...', '.....XXXXXX.....', '................'] },
    { key: 'DOC', col: '#bfe9ff', alt: ['FORM', 'PHOTO'], marks: [[3, 2], [12, 2], [3, 13], [12, 13]], px: [
      '..XXXXXXXXX.....', '..X........X....', '..X.XXXXX..XX...', '..X..........X..', '..X.XXXXXXXX.X..', '..X..........X..', '..X.XXXXXXX..X..', '..X..........X..',
      '..X.XXXXXXXX.X..', '..X..........X..', '..X.XXXX.....X..', '..X..........X..', '..X.......XX.X..', '..X..........X..', '..XXXXXXXXXXXX..', '................'] },
  ];
  /** o = {act, pick — індекс цілі (інакше за id сторінки), id, f — фаза сторінки 0..1, panel — показувати кандидатів}. */
  K.scrScan = (c, x, y, w, h, t, o = {}) => {
    const T = TARGETS[((o.pick !== undefined ? o.pick : o.id || 0) % TARGETS.length + TARGETS.length) % TARGETS.length], f = o.f !== undefined ? o.f : (t * .08) % 1;
    const side = o.panel !== false && w > 150, aw = side ? w * .6 : w, cs = Math.max(2, Math.floor(Math.min(aw * .8, h * .78) / 16)), gx = Math.round(x + (aw - cs * 16) / 2), gy = Math.round(y + (h - cs * 16) / 2 + (side ? 0 : h * .04));
    const scan = Math.min(1, f / .45), sy = gy + scan * cs * 16, done = f > .45, conf = 86 + Math.floor(hash(o.id || 0, 4) * 13);
    c.save(); c.beginPath(); c.rect(x, y, w, h); c.clip();
    c.fillStyle = 'rgba(90,170,255,.1)'; for (let k = 0; k <= 16; k += 2) { c.fillRect(gx + k * cs, gy, 1, cs * 16); c.fillRect(gx, gy + k * cs, cs * 16, 1); }   // сітка
    T.px.forEach((row, j) => { for (let i = 0; i < 16; i++) if (row[i] === 'X') { const seen = gy + (j + 1) * cs <= sy; lit(c, gx + i * cs, gy + j * cs, cs - (cs > 3 ? 1 : 0), cs - (cs > 3 ? 1 : 0), seen ? T.col : 'rgba(90,140,220,.35)'); } });
    c.globalCompositeOperation = 'lighter';
    if (!done) { c.fillStyle = 'rgba(120,240,255,.22)'; c.fillRect(gx - cs, sy - cs * 1.5, cs * 18, cs * 1.5); lit(c, gx - cs, sy - 1, cs * 18, 2, '#9af6ff'); }   // лінія сканування
    T.marks.forEach(([mx, my], k) => { if (gy + my * cs > sy) return; const s = Math.max(2, cs * .7); lit(c, gx + mx * cs - s / 2, gy + my * cs - s / 2, s, s, '#ff7af0'); });   // точки-орієнтири
    c.globalCompositeOperation = 'source-over';
    if (done) {                                                                                                               // рамка й мітка з упевненістю
      const pad = cs, bx = gx - pad, by = gy - pad, bw = cs * 16 + pad * 2, bh = cs * 16 + pad * 2, bl = Math.min(1, (f - .45) / .08);
      c.strokeStyle = rgba('255,79,216', .9 * bl); c.lineWidth = Math.max(1, cs / 2); c.setLineDash([cs * 1.5, cs]); c.strokeRect(bx, by, bw, bh); c.setLineDash([]);
      const lb = T.key + ' ' + Math.round(conf * bl) + '%', fs = Math.max(6, Math.round(cs * 1.6)); lit(c, bx, by - fs - 4, lb.length * fs + 6, fs + 4, 'rgba(10,6,40,.85)'); P.text(c, lb, bx + 3, by - 3, '#ff9ae6', fs);
    }
    if (side) {                                                                                                               // кандидати: стовпчики впевненості
      const px0 = x + aw + 4, pw = w - aw - 8, fs = Math.max(6, Math.round(h / 22)), list = [[T.key, conf], [T.alt[0], Math.floor((100 - conf) * .7)], [T.alt[1], 100 - conf - Math.floor((100 - conf) * .7)]];
      list.forEach(([k2, v], n) => { const yy = y + h * .22 + n * fs * 3.2, grow = Math.min(1, Math.max(0, (f - .1 - n * .05) / .4)); P.text(c, k2, px0, yy, n ? '#7f9cd0' : '#e8fdff', fs);
        lit(c, px0, yy + fs * .5, pw, fs * .7, 'rgba(40,70,150,.6)'); lit(c, px0, yy + fs * .5, pw * v / 100 * grow, fs * .7, n ? '#5a7ab8' : '#3bff8a'); });
      P.text(c, done ? 'MATCH' : 'SCAN', px0, y + h * .12, done ? '#3bff8a' : (Math.sin(t * 6) > 0 ? '#3be8ff' : '#17709a'), fs);
    }
    c.restore();
  };
})();

/* ============================================================================
 * objects/mk_paint.js — МАРКЕТИНГ: МАЛЮНКИ ГРАНЕЙ І ЖИВІ ЕКРАНИ
 * ----------------------------------------------------------------------------
 * Розкладка частин — tools/wingbox/gen_room.py: marketing() (id mk_*). Тут — як виглядають їхні грані (NX.arc.paint[id]) і
 * що на них живе (NX.arc.LIVE[id]). Голо-монітори над проєкторами, голо-клавіатура, сповіщення, що вилітають з екрана, —
 * окремий живий об'єкт objects/marketing.js; крісло — objects/mk_chair.js.
 *   mk_desk    — стіл: рожева кромка, шухляди на обох кінцях, посередині — утоплена панель з голо-стрічкою іконок
 *   mk_booth   — шапка будки з вивіскою: динаміки, світлодіоди; mk_bpL/R — стовпи рамки (внутрішні грані — світло)
 *   mk_screen  — утоплений голо-екран: стрічка постів (AI-теги), реклама (мішень і воронка), лічильники охоплення
 *   mk_projL/R — проєктори голо-моніторів (зверху — лінза, що світиться)
 * Усі написи — NX.t (4 мови), числа — NX.num.
 * ========================================================================== */
(() => {
  const A = NX.arc.kit, T = NX.arc.pt, PAINT = NX.arc.paint, LIVE = NX.arc.LIVE, hash = NX.art.hash, t_ = k => NX.t(k);
  const { glass, icon, rr, drawer } = T;
  // додаткові іконки 7×7 (до NX.arc.pt.IC): око (охоплення), курсор (кліки), «поділитись», @
  Object.assign(T.IC, {
    eye: ['.......', '..XXX..', '.X...X.', 'X..X..X', '.X...X.', '..XXX..', '.......'], cursor: ['X......', 'XX.....', 'XXX....', 'XXXX...', 'XXXXX..', '..XX...', '...XX..'],
    share: ['.....XX', '....XXX', 'XX...X.', 'XXX.X..', 'XX...X.', '....XXX', '.....XX'], at: ['.XXXXX.', 'X.....X', 'X.XXX.X', 'X.X.X.X', 'X.XXXXX', 'X......', '.XXXXX.'],
  });
  const inset = (c, x, y, w, h, fill = 'rgba(6,3,20,.6)', r = .6) => { c.fillStyle = fill; rr(c, x, y, w, h, r); c.fill(); c.fillStyle = 'rgba(0,0,0,.55)'; c.fillRect(x, y, w, .5); c.fillRect(x, y, .5, h); c.fillStyle = 'rgba(170,150,255,.28)'; c.fillRect(x, y + h - .45, w, .45); c.fillRect(x + w - .45, y, .45, h); };
  const bolt = (c, x, y, r = .85) => { c.fillStyle = '#05030f'; c.beginPath(); c.arc(x, y, r, 0, 7); c.fill(); c.fillStyle = '#6a5ab8'; c.beginPath(); c.arc(x - r * .15, y - r * .15, r * .62, 0, 7); c.fill(); c.fillStyle = '#d8d0ff'; c.fillRect(x - r * .45, y - r * .45, r * .4, r * .4); };
  const led = (c, x, y, col, r = .75) => { c.fillStyle = '#05030f'; c.beginPath(); c.arc(x, y, r * 1.5, 0, 7); c.fill(); c.fillStyle = col; c.beginPath(); c.arc(x, y, r, 0, 7); c.fill(); c.fillStyle = '#fff'; c.fillRect(x - r * .35, y - r * .35, r * .5, r * .5); };
  const DESK_X0 = 460, DESK_W = 258, U = X => (X - DESK_X0) / DESK_W;                                       // частка ширини стола з px картинки

  // ---------- СТІЛ ----------
  /** Фасад стола: рожева неонова кромка з глянцевою губою, шухляди на обох кінцях (з ручками й LED), посередині — утоплена
   *  панель з голо-стрічкою (іконки бігають — живе) і ґраткою динаміка. Світлої смуги знизу немає (власник прибрав, крок 3). */
  PAINT.mk_desk = (c, fw, fh) => {
    c.fillStyle = 'rgba(255,200,240,.22)'; c.fillRect(0, 0, fw, fh * .035); A.neon(c, 0, fh * .07, fw, fh * .07, '#ff4fd8', 1.5);
    c.fillStyle = 'rgba(0,0,0,.4)'; c.fillRect(0, fh * .11, fw, fh * .025);
    [[467, 507], [671, 711]].forEach(([a, b], s) => {                                                               // тумби з шухлядами
      const x = fw * U(a), w = fw * (U(b) - U(a)); inset(c, x - 1, fh * .16, w + 2, fh * .76, 'rgba(4,2,14,.65)');
      for (let k = 0; k < 3; k++) drawer(c, x, fh * (.18 + k * .245), w, fh * .225, { led: k === 0 ? (s ? '#3be8ff' : '#3bff8a') : null, a: '#2e2064', b: '#191040' });
    });
    const x0 = fw * U(518), x1 = fw * U(660); inset(c, x0, fh * .2, x1 - x0, fh * .66, 'rgba(4,2,16,.75)', 1.2);  // середня панель
    glass(c, x0 + 2, fh * .27, x1 - x0 - 4, fh * .2, { r: .8, a: '#123a9a', b: '#0c2a7a', c: '#081e5e', lw: .5 });
    for (let k = 0; k < 9; k++) { const x = x0 + 4 + k * (x1 - x0 - 8) / 8; c.fillStyle = '#03020a'; c.fillRect(x - .6, fh * .58, 1.2, fh * .2); c.fillStyle = 'rgba(255,79,216,.35)'; c.fillRect(x - .3, fh * .6, .6, fh * .16); }   // ґратка
    [x0 + 1.6, x1 - 1.6].forEach(x => { bolt(c, x, fh * .24); bolt(c, x, fh * .82); });
  };
  /** Живе на столі: іконки соцмереж біжать голо-стрічкою, світлодіоди ґратки «дихають». */
  LIVE.mk_desk = { every: 3, draw(c, fw, fh, t) {
    const x0 = fw * U(518) + 2, x1 = fw * U(660) - 2, y = fh * .27, h = fh * .2, K = ['heart', 'chat', 'share', 'at', 'eye', 'cursor'];
    glass(c, x0, y, x1 - x0, h, { r: .8, a: '#123a9a', b: '#0c2a7a', c: '#081e5e', lw: .5 });
    c.save(); c.beginPath(); c.rect(x0 + .5, y, x1 - x0 - 1, h); c.clip(); const step = h * 1.5, off = (t * 9) % step;
    for (let k = -1; k < (x1 - x0) / step + 1; k++) { const n = Math.floor(t * 9 / step) + k, ic = K[((n % 6) + 6) % 6]; icon(c, ic, x1 - k * step + off - step / 2, y + h / 2, h * .62, ic === 'heart' ? '#ff6ad8' : '#9af6ff'); }
    c.restore();
    c.save(); c.globalCompositeOperation = 'lighter'; for (let k = 0; k < 9; k++) { const q = .5 + .5 * Math.sin(t * 4 - k * .7); c.fillStyle = `rgba(255,79,216,${q * .5})`; c.fillRect(fw * U(518) + 4 + k * (fw * (U(660) - U(518)) - 8) / 8 - .3, fh * .6, .6, fh * .16); } c.restore();
  } };

  // ---------- БУДКА: шапка з вивіскою, стовпи рамки ----------
  PAINT.mk_booth = (c, fw, fh) => {
    [[.035, .13], [.87, .965]].forEach(([a, b]) => { inset(c, fw * a, fh * .26, fw * (b - a), fh * .5, 'rgba(3,2,12,.8)'); for (let y = fh * .3; y < fh * .74; y += 1.5) for (let x = fw * a + 1.2; x < fw * b - .8; x += 1.5) { c.fillStyle = 'rgba(120,110,220,.45)'; c.fillRect(x - .3, y - .3, .6, .6); } });   // динаміки
    [.15, .85].forEach((f, s) => { for (let k = 0; k < 3; k++) led(c, fw * f, fh * (.3 + k * .2), ['#3bff8a', '#3be8ff', '#ff4fd8'][(k + s) % 3], .6); });
    [.03, .97].forEach(f => { bolt(c, fw * f, fh * .12); bolt(c, fw * f, fh * .88); });
  };
  /** Стовп рамки спереду: колонка світлодіодів, болти, ґратка внизу. */
  const pillar = (c, fw, fh) => { for (let k = 0; k < 9; k++) led(c, fw / 2, fh * (.1 + k * .045), k % 4 ? '#3be8ff' : '#ff4fd8', .55); bolt(c, fw / 2, fh * .04); bolt(c, fw / 2, fh * .96);
    inset(c, fw * .22, fh * .62, fw * .56, fh * .3, 'rgba(3,2,12,.8)'); for (let y = fh * .64; y < fh * .9; y += 1.4) { c.fillStyle = 'rgba(150,130,240,.4)'; c.fillRect(fw * .28, y, fw * .44, .35); } };
  /** Внутрішня грань стовпа (видно в рамці екрана): блакитна світлова смуга. */
  const innerCyan = (c, fw, fh) => { c.fillStyle = 'rgba(4,12,40,.7)'; c.fillRect(0, 0, fw, fh); const g = c.createLinearGradient(fw * .1, 0, fw * .7, 0); g.addColorStop(0, 'rgba(59,232,255,0)'); g.addColorStop(.5, '#b8f8ff'); g.addColorStop(1, 'rgba(59,232,255,0)'); c.fillStyle = g; c.fillRect(fw * .1, fh * .02, fw * .6, fh * .96);
    for (let k = 0; k < 24; k++) { c.fillStyle = 'rgba(4,12,40,.55)'; c.fillRect(fw * .1, fh * (.02 + k * .04), fw * .6, .45); } };
  PAINT.mk_bpL = pillar; PAINT.mk_bpL.sides = { right: innerCyan };
  PAINT.mk_bpR = (c, fw, fh) => pillar(c, fw, fh); PAINT.mk_bpR.sides = { left: innerCyan };
  PAINT.mk_bb = (c, fw, fh) => { A.neon(c, fw * .02, fh * .05, fw * .98, fh * .05, '#3be8ff', 1.1); };
  PAINT.mk_bb.sides = { top: (c, fw, fh) => { c.fillStyle = 'rgba(59,232,255,.25)'; c.fillRect(0, 0, fw, fh * .3); } };
  // старий екран на всю будку (28.10) — тепер mk_screen; на шапці будки живе інше: динаміки «б'ють» у такт, світлодіоди біжать
  LIVE.mk_booth = { every: 4, draw(c, fw, fh, t) {
    const beat = Math.pow(Math.max(0, Math.sin(t * 4.2)), 5) * (NX.objects.marketing && NX.objects.marketing.active ? 1 : .7);
    c.save(); c.globalCompositeOperation = 'lighter';
    [[.035, .13], [.87, .965]].forEach(([a, b]) => { const cx = fw * (a + b) / 2, cy = fh * .51;
      for (let y = fh * .3; y < fh * .74; y += 1.5) for (let x = fw * a + 1.2; x < fw * b - .8; x += 1.5) { const d = Math.hypot((x - cx) / (fw * (b - a)), (y - cy) / (fh * .5)), v = beat * Math.max(0, 1 - d * 1.5); if (v > .06) { c.fillStyle = `rgba(255,130,240,${v})`; c.fillRect(x - .3, y - .3, .6, .6); } } });
    c.restore();
    [.15, .85].forEach((f, s) => { const k = Math.floor(t * 3 + s) % 3; led(c, fw * f, fh * (.3 + k * .2), '#ffffff', .6); });
  } };
  /** Стовпи рамки: колонка світлодіодів — вогник біжить (лівий угору, правий униз), за ним хвіст. */
  const pillarLive = dir => ({ every: 4, draw(c, fw, fh, t) {
    const n = 9, on = ((Math.floor(t * 8) * -dir) % n + n) % n;
    for (let k = 0; k < n; k++) { const d = (k - on + n) % n, a = dir > 0 ? [1, .55, .25][d] : [1, .55, .25][(n - d) % n]; if (!a) continue;
      c.save(); c.globalCompositeOperation = 'lighter'; c.fillStyle = k % 4 ? `rgba(160,250,255,${a})` : `rgba(255,170,240,${a})`; c.beginPath(); c.arc(fw / 2, fh * (.1 + k * .045), .95, 0, 7); c.fill(); c.restore(); }
  } });
  LIVE.mk_bpL = pillarLive(1); LIVE.mk_bpR = pillarLive(-1);
  LIVE.mk_sign = NX.arc.glint(6.8, 0);                                                                         // відблиск по вивісці

  // ---------- ГОЛОВНИЙ ЕКРАН (утоплений голо-екран) ----------
  const L_ = [.04, .13, .44, .64], R_ = [.52, .13, .44, .64], K_ = [.04, .81, .92, .15];                       // панелі: стрічка, реклама, лічильники (частки грані)
  const RR = (f, fw, fh) => [f[0] * fw, f[1] * fh, f[2] * fw, f[3] * fh];
  PAINT.mk_screen = (c, fw, fh) => {
    c.fillStyle = '#040a2a'; c.fillRect(0, 0, fw, fh);
    glass(c, .8, .8, fw - 1.6, fh - 1.6, { r: 2, a: '#0f3a9e', b: '#0a2676', c: '#061a52', line: '#3be8ff', lw: .9 });
    c.fillStyle = '#ff3b5c'; c.beginPath(); c.arc(fw * .055, fh * .065, fh * .018, 0, 7); c.fill();                      // ● НАЖИВО
    A.txt(c, t_('scene.marketing.live'), fw * .08, fh * .066, fw * .3, fh * .035, '#ffd6e0', { align: 'left' });
    ['chat', 'at', 'share'].forEach((k, n) => icon(c, k, fw * (.86 + n * .045), fh * .066, fh * .045, 'rgba(190,240,255,.8)'));
    const [lx, ly, lw, lh] = RR(L_, fw, fh), [rx, ry, rw, rh] = RR(R_, fw, fh), [kx, ky, kw, kh] = RR(K_, fw, fh);
    glass(c, lx, ly, lw, lh, { r: 1.2, a: '#123a9a', b: '#0c2a7a', c: '#081e5e', lw: .55 }); glass(c, rx, ry, rw, rh, { r: 1.2, a: '#123a9a', b: '#0c2a7a', c: '#081e5e', lw: .55 });
    A.txt(c, t_('scene.marketing.tags'), lx + lw / 2, ly + lh * .07, lw * .8, lh * .055, '#e8feff', { glow: '#3be8ff' });
    A.txt(c, t_('scene.marketing.ads'), rx + rw / 2, ry + rh * .07, rw * .8, rh * .055, '#e8feff', { glow: '#3be8ff' });
    c.fillStyle = 'rgba(150,230,255,.4)'; c.fillRect(lx + 2, ly + lh * .13, lw - 4, .35); c.fillRect(rx + 2, ry + rh * .13, rw - 4, .35);
    const KPI = [['eye', 'reach', '#9af6ff'], ['heart', 'likes', '#ff6ad8'], ['cursor', 'clicks', '#ffd27a']];
    KPI.forEach(([ic, key, col], n) => { const x = kx + n * kw / 3; glass(c, x + .6, ky, kw / 3 - 1.2, kh, { r: .8, a: '#123a9a', b: '#0c2a7a', c: '#081e5e', lw: .45 });
      icon(c, ic, x + kh * .55, ky + kh / 2, kh * .5, col); A.txt(c, t_('scene.marketing.' + key), x + kh * 1.05, ky + kh * .3, kw / 3 - kh * 1.3, kh * .2, 'rgba(200,240,255,.85)', { align: 'left' }); });
  };
  /** Лічильники (охоплення, лайки, кліки) — ростуть самі, швидше, коли Nexi працює (objects/marketing.js: boost). */
  const kpi = t => { const M = NX.objects.marketing || {}, b = M.boost || 0; return [12400 + t * 37 + b * 900, 3812 + t * 6.5 + b * 140, 642 + t * 1.3 + b * 30]; };
  const fmt = v => v >= 10000 ? NX.num(v / 1000, 1) + ' ' + t_('scene.unit.k') : String(Math.floor(v)).replace(/\B(?=(\d{3})+(?!\d))/g, ' ');
  LIVE.mk_screen = { every: 3, draw(c, fw, fh, t) {
    const [lx, ly, lw, lh] = RR(L_, fw, fh), [rx, ry, rw, rh] = RR(R_, fw, fh), [kx, ky, kw, kh] = RR(K_, fw, fh), M = NX.objects.marketing || {};
    // стрічка постів: картки повзуть угору, нова в'їжджає з бліком; сердечко «лайкає»
    const fy = ly + lh * .16, fh2 = lh * .82; glass(c, lx + .7, fy, lw - 1.4, fh2, { r: .8, a: '#10348e', b: '#0b276e', c: '#081c52', lw: .01 });
    c.save(); c.beginPath(); c.rect(lx + .7, fy, lw - 1.4, fh2); c.clip();
    const step = fh2 * .34, sp = M.active ? 7 : 3.2, off = (t * sp) % step, base = Math.floor(t * sp / step);
    for (let k = -1; k < 4; k++) { const y = fy + k * step - off + 1, h = step - 1.4, n = base + k, col = ['#ff7ad0', '#ffd27a', '#7af4ff', '#9a8cff', '#3bff8a'][((n % 5) + 5) % 5];
      c.fillStyle = 'rgba(26,62,160,.9)'; rr(c, lx + 2, y, lw - 4, h, .7); c.fill(); c.strokeStyle = 'rgba(140,220,255,.35)'; c.lineWidth = .3; rr(c, lx + 2, y, lw - 4, h, .7); c.stroke();
      c.fillStyle = col; c.beginPath(); c.arc(lx + 2 + h * .32, y + h * .3, h * .17, 0, 7); c.fill();                              // аватар
      c.fillStyle = 'rgba(220,245,255,.85)'; c.fillRect(lx + 2 + h * .62, y + h * .2, lw * (.3 + hash(n, 2) * .2), .7); c.fillStyle = 'rgba(160,210,255,.6)'; c.fillRect(lx + 2 + h * .62, y + h * .42, lw * (.2 + hash(n, 3) * .25), .55);
      const g = c.createLinearGradient(0, y + h * .58, 0, y + h * .92); g.addColorStop(0, col); g.addColorStop(1, '#1a3a8a'); c.fillStyle = g; rr(c, lx + 2 + h * .2, y + h * .6, lw * .42, h * .3, .5); c.fill();   // картинка поста
      const liked = (t * 1.3 + hash(n, 5) * 4) % 4 < 2; icon(c, 'heart', lx + lw - 2 - h * .3, y + h * .74, h * .26, liked ? '#ff4fd8' : 'rgba(255,150,220,.45)');
      c.fillStyle = 'rgba(255,170,230,.75)'; c.fillRect(lx + lw - 2 - h * .85, y + h * .71, h * .3 * (.4 + hash(n, 7) * .6), .55);
    }
    c.restore();
    // реклама: мішень пульсує, приціл обертається, влучання іскрять; воронка під нею
    const cx = rx + rw / 2, cy = ry + rh * .42, r = Math.min(rw, rh) * .23, p = .5 + .5 * Math.sin(t * 2.4);
    glass(c, rx + .7, ry + rh * .16, rw - 1.4, rh * .52, { r: .8, a: '#10348e', b: '#0b276e', c: '#081c52', lw: .01 });
    [[1, '#ff4fd8'], [.68, '#7af4ff'], [.36, '#ff4fd8']].forEach(([k, col]) => { c.strokeStyle = col; c.lineWidth = r * .13; c.beginPath(); c.arc(cx, cy, r * k * (.94 + .06 * p), 0, 7); c.stroke(); });
    c.fillStyle = '#ffffff'; c.beginPath(); c.arc(cx, cy, r * .13, 0, 7); c.fill();
    c.save(); c.translate(cx, cy); c.rotate(t * .8); c.strokeStyle = 'rgba(220,255,255,.85)'; c.lineWidth = .45;
    for (let a = 0; a < 4; a++) { c.rotate(Math.PI / 2); c.beginPath(); c.moveTo(r * 1.15, 0); c.lineTo(r * 1.45, 0); c.stroke(); } c.restore();
    const ph = (t * .8) % 1; c.strokeStyle = `rgba(255,150,240,${1 - ph})`; c.lineWidth = .5; c.beginPath(); c.arc(cx, cy, r * (1 + ph * .45), 0, 7); c.stroke();
    const fy2 = ry + rh * .72; [.9, .66, .44].forEach((k, n) => { const w = rw * .82 * k * (.92 + .08 * Math.sin(t * 2 + n)), y = fy2 + n * rh * .085; const g = c.createLinearGradient(cx - w / 2, 0, cx + w / 2, 0); g.addColorStop(0, ['#3be8ff', '#7a8aff', '#ff7ad0'][n]); g.addColorStop(1, ['#9af6ff', '#b8a8ff', '#ffb8e8'][n]); c.fillStyle = g; rr(c, cx - w / 2, y, w, rh * .065, .5); c.fill(); });
    A.txt(c, NX.num(3.2 + .4 * Math.sin(t * .3), 1) + '%', rx + rw * .86, fy2 + rh * .2, rw * .2, rh * .045, '#e8feff');
    // лічильники
    kpi(t).forEach((v, n) => { const x = kx + n * kw / 3; c.fillStyle = 'rgba(8,24,80,.95)'; c.fillRect(x + kh * 1.0, ky + kh * .48, kw / 3 - kh * 1.25, kh * .4);
      A.txt(c, fmt(v), x + kh * 1.05, ky + kh * .68, kw / 3 - kh * 1.35, kh * .27, ['#bff8ff', '#ffc4f0', '#ffe8a8'][n], { align: 'left' }); });
    funnelFlow(c, rx, ry, rw, rh, t, M);
    feedHearts(c, lx, ly, lw, lh, t);
    fxScreen(c, fw, fh, t, M);
  } };

  // ---------- ЕКРАН «ЖИВИЙ» (власник, крок 3: «екран маркетингу ще крутіше, щоб мерехтів трохи і т. д.») ----------
  const ease = k => k < .5 ? 2 * k * k : 1 - Math.pow(-2 * k + 2, 2) / 2;
  /** Воронка «дихає» потоком: крапки-клієнти падають з широкої смуги у вузьку (коли Nexi працює — густіше). */
  function funnelFlow(c, rx, ry, rw, rh, t, M) {
    const cx = rx + rw / 2, y0 = ry + rh * .72, n = M.active ? 14 : 8;
    c.save(); c.globalCompositeOperation = 'lighter';
    for (let q = 0; q < n; q++) { const ph = (t * .55 + q / n) % 1, y = y0 + ph * rh * .23, half = rw * .41 * (1 - ph * .56), x = cx + (hash(q, 4) - .5) * 2 * half * (1 - ph * .3);
      c.fillStyle = q % 3 ? `rgba(220,250,255,${.9 - ph * .5})` : `rgba(255,190,245,${.9 - ph * .5})`; c.fillRect(x - .35, y - .35, .7, .7); }
    c.restore();
  }
  /** Над стрічкою спливають сердечка (від лайків постів). */
  function feedHearts(c, lx, ly, lw, lh, t) {
    for (let k = 0; k < 3; k++) { const ph = (t * .42 + k * .37) % 1, x = lx + lw * (.78 + .1 * Math.sin(t * 1.3 + k * 2)), y = ly + lh * (.92 - ph * .72);
      c.globalAlpha = Math.sin(ph * Math.PI) * .9; icon(c, 'heart', x, y, 1.8 + ph * 1.2, k ? '#ff9af0' : '#ff4fd8'); }
    c.globalAlpha = 1;
  }
  /** Поверх усього вмісту: блимає ● НАЖИВО; згори в'їжджають сповіщення (аватар, іконка, рядки); повзе смуга CRT; раз у
   *  кілька секунд — діагональний відблиск по склу; рамка пульсує; і зрідка екран коротко мерехтить і глітчить —
   *  смуги з розщепленням кольорів (рожевий / блакитний), зсув, «сніг». */
  function fxScreen(c, fw, fh, t, M) {
    if (Math.sin(t * 5) > 0) { c.fillStyle = '#ffd0da'; c.beginPath(); c.arc(fw * .055, fh * .065, fh * .011, 0, 7); c.fill(); }
    // сповіщення (по центру шапки): в'їжджає згори, тримається, тане; коли Nexi працює — частіше
    const per = M.active ? 2.4 : 4.6, k = (t % per) / per, n = Math.floor(t / per);
    if (k < .72) { const sl = ease(Math.min(1, k / .14)), al = k > .6 ? 1 - (k - .6) / .12 : 1, w = fw * .3, h = fh * .075, x = fw * .5 - w / 2, y = fh * .025 - (1 - sl) * h * 1.4;
      const ic = ['heart', 'chat', 'share', 'at', 'eye'][n % 5], col = ['#ff7ad0', '#ffd27a', '#7af4ff', '#9a8cff', '#3bff8a'][n % 5];
      c.save(); c.globalAlpha = al; c.beginPath(); c.rect(0, fh * .015, fw, fh * .1); c.clip();
      c.fillStyle = 'rgba(20,56,160,.95)'; rr(c, x, y, w, h, h * .3); c.fill(); c.strokeStyle = 'rgba(160,240,255,.85)'; c.lineWidth = .4; rr(c, x, y, w, h, h * .3); c.stroke();
      c.fillStyle = col; c.beginPath(); c.arc(x + h * .55, y + h / 2, h * .3, 0, 7); c.fill(); icon(c, ic, x + h * 1.45, y + h / 2, h * .5, '#e8feff');
      c.fillStyle = 'rgba(230,248,255,.9)'; c.fillRect(x + h * 2.1, y + h * .3, w * (.35 + hash(n, 2) * .25), h * .14); c.fillStyle = 'rgba(160,210,255,.7)'; c.fillRect(x + h * 2.1, y + h * .58, w * (.2 + hash(n, 3) * .3), h * .12);
      c.restore(); }
    c.save(); c.globalCompositeOperation = 'lighter';
    const ry = ((t * .11) % 1.3 - .15) * fh, g = c.createLinearGradient(0, ry - fh * .07, 0, ry + fh * .07);                    // смуга CRT
    g.addColorStop(0, 'rgba(150,230,255,0)'); g.addColorStop(.5, 'rgba(150,230,255,.08)'); g.addColorStop(1, 'rgba(150,230,255,0)'); c.fillStyle = g; c.fillRect(0, ry - fh * .07, fw, fh * .14);
    const sk = (t % 6.5) / 1.1; if (sk < 1) { const x = -fw * .25 + sk * fw * 1.5, g2 = c.createLinearGradient(x - fw * .1, 0, x + fw * .1, 0);   // відблиск по склу
      g2.addColorStop(0, 'rgba(255,255,255,0)'); g2.addColorStop(.5, 'rgba(220,245,255,.14)'); g2.addColorStop(1, 'rgba(255,255,255,0)'); c.fillStyle = g2;
      c.beginPath(); c.moveTo(x - fw * .05, 0); c.lineTo(x + fw * .1, 0); c.lineTo(x + fw * .02, fh); c.lineTo(x - fw * .13, fh); c.closePath(); c.fill(); }
    c.strokeStyle = `rgba(120,240,255,${.2 + .22 * Math.sin(t * 2.2)})`; c.lineWidth = 1; c.strokeRect(1.4, 1.4, fw - 2.8, fh - 2.8);   // рамка пульсує
    c.restore();
    // мерехтіння й глітч: короткий «напад» раз на ~7 с + рідкісні поодинокі смуги
    const f8 = Math.floor(t * 9), burst = (t % 7.3) < .55, fl = hash(Math.floor(t * 14), 3), gq = hash(f8, 11);
    if (burst && fl > .45) { c.fillStyle = `rgba(4,8,30,${.16 + fl * .2})`; c.fillRect(0, 0, fw, fh); }
    else if (fl > .95) { c.fillStyle = 'rgba(160,230,255,.06)'; c.fillRect(0, 0, fw, fh); }
    if (burst || gq > .93) {
      const nb = burst ? 3 : 1;
      for (let b = 0; b < nb; b++) { const y = fh * (.08 + .84 * hash(f8 + b * 13, 5)), h = fh * (.016 + .036 * hash(b, f8)), dx = (hash(b * 3, f8) - .5) * fw * .05;
        c.fillStyle = 'rgba(255,80,220,.44)'; c.fillRect(dx - .9, y, fw, h * .5); c.fillStyle = 'rgba(80,230,255,.44)'; c.fillRect(dx + .9, y + h * .5, fw, h * .5);
        c.fillStyle = 'rgba(235,250,255,.55)'; c.fillRect(fw * hash(b, 9), y + h * .3, fw * (.1 + .2 * hash(b, f8 + 1)), .45); }
      if (burst) for (let q = 0; q < 70; q++) { const s2 = Math.floor(t * 20); c.fillStyle = `rgba(225,240,255,${.25 + hash(q, s2) * .45})`; c.fillRect(fw * hash(q, s2 + 1), fh * hash(q + 7, s2), .6, .6); }
    }
  }

  // ---------- ПРОЄКТОРИ ГОЛО-МОНІТОРІВ ----------
  const proj = (c, fw, fh) => { A.neon(c, fw * .1, fh * .2, fw * .9, fh * .2, '#3be8ff', .8); led(c, fw * .85, fh * .62, '#3bff8a', .55); c.fillStyle = 'rgba(0,0,0,.35)'; c.fillRect(0, fh * .8, fw, fh * .2); };
  const lens = (c, fw, fh) => { const g = c.createRadialGradient(fw / 2, fh / 2, 0, fw / 2, fh / 2, Math.min(fw, fh) * .48); g.addColorStop(0, '#ffffff'); g.addColorStop(.3, '#9af6ff'); g.addColorStop(.7, '#1a8ab0'); g.addColorStop(1, 'rgba(10,30,60,0)');
    c.fillStyle = '#05030f'; c.beginPath(); c.ellipse(fw / 2, fh / 2, fw * .3, fh * .36, 0, 0, 7); c.fill(); c.fillStyle = g; c.beginPath(); c.ellipse(fw / 2, fh / 2, fw * .24, fh * .3, 0, 0, 7); c.fill(); };
  PAINT.mk_projL = proj; PAINT.mk_projL.sides = { top: lens };
  PAINT.mk_projR = (c, fw, fh) => proj(c, fw, fh); PAINT.mk_projR.sides = { top: lens };
})();

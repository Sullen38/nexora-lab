/* ============================================================================
 * objects/ai_desk.js — СТІЛ AI-ЦЕНТРУ (перший, найближчий; за лініями власника)
 * ----------------------------------------------------------------------------
 * Геометрія ТОЧНО за жовтими лініями власника (одиниці кімнати):
 *   передня грань плити: верх від (34, 286) до (315, 281), низ від (34, 293) до (315, 291)
 *   низ стола — клином: ліворуч 375, праворуч 352 (стіл стоїть косо: лівий край
 *   ближче до глядача, правий — упирається у стіл аналітики на 317)
 *   ліва опора x = 34..76 (окрема тумба з нішею-кутком для Рудика), правий край 315
 * Усе на столі (монітор, голо-ноутбуки, дрібнички з картинки) стоїть НА стільниці,
 * ніщо не провалюється: стільниця видна зверху як смужка між 281..286.
 *
 * Малюється NX.furn.Sheet (4 px/од.): плита з рожевим переливом і світлою
 * кромкою (кольори з картинки), темно-синій корпус, тумба з 3 шухлядами,
 * шафка AI-ядра з вентилятором, ніші (вазони, ліхтарик — wing objects),
 * нижня грань у перспективі (видно низ, бо стіл вище очей глядача — ні:
 * низ темний цоколь з LED). Тінь і відображення в підлозі — floor_mirror.js.
 * Живе: неон кромки, бігуча іскра, LED цоколя, вентилятор, LED ядра.
 * API: NX.aiDesk.top(x) — висота стільниці в точці x (для Nexi, вазонів).
 * ========================================================================== */
(() => {
  const P = NX.px, F = NX.furn, { NAVY, PINK, CHROME } = F.PAL, ramp = F.ramp, hash = NX.art.hash;
  const rgba = (rgb, a) => `rgba(${rgb},${P.clamp(a, 0, 1)})`, lit = (c, x, y, w, h, col) => { c.fillStyle = col; c.fillRect(x, y, w, h); };
  // ---------- лінії власника ----------
  const L = 34, R = 315;
  const topO = x => 286 - (x - L) * 5 / (R - L);          // верхній край плити (зовнішній)
  const topI = x => 293.3 - (x - L) * 2 / (R - L);        // низ плити
  const bot = x => 375 - (x - L) * 23 / (R - L);          // низ стола (клин)
  const back = x => topO(x) - 4.5;                        // задній край видимого верху стільниці
  const SEC = { legL: [L, 76], cab: [150, 198], core: [258, 290], legR: [305, R] };   // суцільні частини корпусу
  const ROWS = [[302, 318], [320, 336], [338, 354]];
  const FANC = [274, 327, 7.5];
  const SL = ['#3a0e5b', '#4d0d6e', '#5b0775', '#6d058a', '#850498', '#ac14b9', '#b317bd', '#cb53cb', '#e07ae0'];
  const SW = ['#5a1440', '#8e286a', '#a52174', '#c32988', '#d73f90', '#e45f8c', '#ee7aa4', '#f6a0c0', '#ffc8dc'];
  const NV = ['#02010a', '#05041a', '#080a2a', '#0d143c', '#121d50', '#182866', '#20357c', '#2a4494'];
  const mix = (a, b, k) => { if (k <= 0) return a; if (k >= 1) return b; const A = [1, 3, 5].map(i => parseInt(a.slice(i, i + 2), 16)), B = [1, 3, 5].map(i => parseInt(b.slice(i, i + 2), 16)); return '#' + A.map((v, i) => Math.round(v + (B[i] - v) * k).toString(16).padStart(2, '0')).join(''); };
  const solid = X => Object.values(SEC).find(([a, b]) => X >= a && X < b);

  function build() {
    const S = F.Sheet(L - 2, 274, R + 2, 382), o = '#060313';
    // --- корпус (між низом плити й низом стола)
    S.poly([[L, topI(L)], [R, topI(R)], [R, bot(R)], [L, bot(L)]], (u, v, i, j, X, Y) => {
      const yb = bot(X), yt = topI(X), sec = solid(X), d = (Y - yt) / (yb - yt);
      if (!sec) {                                                             // ніша: задня стінка з рейками, LED-смужка, внутрішня підлога
        if (Y < yt + 2) return NV[0];
        const inner = yb - 8;
        if (Y < inner - .8) return ((X - 80) % 12 + 12) % 12 < .8 ? NV[3] : ramp(['#030112', '#05031c', '#080526', '#0b0730'], .15 + d * .6, i, j, .1);
        if (Y < inner) return '#123a6a';
        return ramp(['#04021a', '#0a0628', '#120a36', '#1a0f46'], .2 + (Y - inner) / 8 * .6, i, j, .15);
      }
      const [a, b] = sec, du = X - a, dw = b - X;
      if (du < .5 || dw < .5) return o;
      if (Y > yb - 5) return Y > yb - .6 ? o : Y < yb - 4.2 ? CHROME[2] : (Y > yb - 2.6 && Y < yb - 1.4) ? '#05021a' : NV[1];   // цоколь з канавкою LED
      if (a === SEC.legL[0]) {                                                // ліва тумба: ніша-куток Рудика (рожеві полички)
        if (Y > 298 && Y < bot(X) - 6 && du > 3 && dw > 3) {
          if (Y < 300 || (Y > 332 && Y < 334.5) || (Y > 362 && Y < 364.5)) return Y < 300 ? PINK[6] : PINK[5];          // полички
          if (Y >= 300 && Y < 301.5) return PINK[3];
          if (dw < 5 && Y > 334 && Y < 362) return (Y % 3 < 1) ? '#e8c46a' : '#c89a44';                                  // дряпка-стовпчик
          return ramp(['#030112', '#07041e', '#0b062c'], .2 + (Y - 300) / 70 * .5, i, j, .1);
        }
        return ramp(NV, .42 - d * .25 + (du < 1.4 || dw < 1.4 ? .2 : 0), i, j, .12);
      }
      if (a === SEC.cab[0]) {                                                 // тумба з трьома шухлядами
        const row = ROWS.find(([p, q]) => Y >= p && Y < q); if (!row) return Y < ROWS[0][0] ? NV[2] : NV[0];
        const [p, q] = row, dv = Y - p, dh = q - Y, cy = (p + q) / 2;
        if (dv < .5) return NV[7]; if (dh < .5 || dw < 1.4) return NV[0]; if (du < 1.4) return NV[6];
        if (Math.abs(Y - cy) < 1.1 && Math.abs(X - (a + b) / 2) < 9) return Math.abs(Y - cy) < .45 ? '#000006' : NV[1];
        if (Math.abs(Y - cy + 1.6) < .4 && Math.abs(X - (a + b) / 2) < 9) return NV[6];
        return ramp(NV, .78 - dv / (q - p) * .35 + (1 - du / (b - a)) * .1, i, j, .12);
      }
      if (a === SEC.core[0]) {                                                // шафка AI-ядра
        const fd = Math.hypot(X - FANC[0], Y - FANC[1]);
        if (fd < FANC[2] + .9) return fd > FANC[2] + .1 ? o : fd > FANC[2] - .9 ? CHROME[3] : '#03020c';
        if (Y > 338 && Y < bot(X) - 7 && X > a + 3 && X < b - 3) return ((Y - 338) % 2.4 < .8) ? '#05021a' : NV[4];
        if (X > b - 6 && X < b - 3 && Y > 300 && Y < 320) return '#020210';
        return ramp(NV, .6 - d * .3 + (du < 1.5 ? .2 : 0), i, j, .12);
      }
      if (Math.abs(X - (a + (b - a) * .45)) < .7) return NV[6];               // права опора зі світлою смужкою
      return ramp(NV, .45 - d * .25 + (du < 1.2 ? .15 : 0), i, j, .12);
    });
    // --- видимий верх стільниці (вузька смужка; під великим екраном — синій відблиск)
    S.poly([[L + 2, back(L + 2)], [R, back(R)], [R, topO(R)], [L, topO(L)]], (u, v, i, j, X, Y) => {
      const glow = Math.max(0, 1 - Math.abs(X - 150) / 95);
      if (v < .12) return o;
      if (glow > 0) return ramp(['#0a0a30', '#0e1450', '#122070', '#183090', '#2244b0', '#3060cc'], .15 + glow * .6 * (1 - v * .5) + v * .15, i, j, .12);
      return ramp(['#0b0730', '#120a36', '#1c0a3c', '#2b0c40', '#43123f', '#612758'], .1 + v * .75, i, j, .12);
    });
    // --- плита: світла кромка, рожевий перелив; праворуч тепліша (ліхтарик)
    S.poly([[L, topO(L)], [R, topO(R)], [R, topI(R)], [L, topI(L)]], (u, v, i, j, X, Y) => {
      const k = P.clamp((X - 228) / 70, 0, 1), dy = Y - topO(X), h = topI(X) - topO(X);
      if (X < L + .6 || X > R - .6) return o;
      if (dy < 1.1) return k > .5 ? '#ffe2ee' : '#ffd4ff';
      if (dy < 1.8) return k > .5 ? SW[7] : SL[8];
      if ([150, 198, 258].some(sx => Math.abs(X - sx) < .45)) return SL[2];     // шви панелей
      const q = 1 - (dy - 1.8) / (h - 1.8), n = SL.length - 1, idx = P.clamp(Math.round(q * .95 * n + NX.art.BAYER[(j & 3) * 4 + (i & 3)] * .9), 0, n);
      return mix(SL[idx], SW[idx], k);
    });
    return S;
  }
  let SH = null;
  NX.aiDesk = NX.addObject({
    id: 'aiDesk', L, R, topO, topI, bot, SEC, FANC, ROWS,
    top(x) { return topO(P.clamp(x, L, R)); },
    layers(t) { return [{ y: 280, draw: c => this.draw(c, t) }]; },       // шар: ближчий за стіл аналітики (y 280 > 278), далі за Nexi на підлозі
    draw(c, t) {
      if (!SH) { SH = build(); SH.cv = SH.canvas(); }
      const Rr = F.res(), act = NX.objects.aiPc && NX.objects.aiPc.active ? 1 : 0;
      c.save(); c.imageSmoothingEnabled = Rr < 3.8;
      c.drawImage(F.fit(SH.cv, SH.x1 - SH.x0, SH.y1 - SH.y0, Rr), SH.x0, SH.y0, SH.x1 - SH.x0, SH.y1 - SH.y0);
      c.globalCompositeOperation = 'lighter';
      c.strokeStyle = rgba('255,79,216', .28 + .16 * Math.sin(t * 2.2) + act * .18); c.lineWidth = 1.4; c.beginPath(); c.moveTo(L + 1, topO(L) + .9); c.lineTo(R - 1, topO(R) + .9); c.stroke();   // неон кромки
      const sx = L + ((t * .22) % 1) * (R - L); c.strokeStyle = 'rgba(255,255,255,.85)'; c.lineWidth = 1; c.beginPath(); c.moveTo(sx - 7, topO(sx - 7) + 1); c.lineTo(sx + 7, topO(sx + 7) + 1); c.stroke();
      for (const [a, b] of Object.values(SEC)) for (let x = a + 1.5; x < b - 1.5; x += 2) { const hue = (t * 120 + x * 4) % 360; c.fillStyle = act ? `hsla(${hue},95%,62%,.85)` : rgba('59,232,255', .4 + .3 * Math.sin(t * 2 + x * .12)); c.fillRect(x, bot(x) - 2.6, 1.3, 1.2); }
      for (let x = 80; x < 148; x += 2) lit(c, x, bot(x) - 8.4, 1.3, .9, rgba('59,232,255', .18 + .14 * Math.sin(t * 1.6 + x * .08)));
      for (let x = 200; x < 256; x += 2) lit(c, x, bot(x) - 8.4, 1.3, .9, rgba('255,79,216', .16 + .12 * Math.sin(t * 1.6 + x * .08)));
      ROWS.forEach(([p, q], k) => lit(c, SEC.cab[1] - 6, (p + q) / 2 - 3, 2.4, 1, rgba('59,232,255', .45 + .5 * Math.sin(t * 2 + k * 1.7))));
      for (let k = 0; k < 7; k++) lit(c, SEC.core[1] - 5.4, 301.5 + k * 2.8, 1.8, 1.6, hash(k, Math.floor(t * (4 + act * 8))) > .4 ? ['#3bff8a', '#3be8ff', '#ff7af0'][k % 3] : '#0a1a20');
      P.glow(c, FANC[0], FANC[1], 13, 'rgba(59,232,255,.7)', .22 + act * .3);
      const fa = t * (4 + act * 14); for (let bl = 0; bl < 5; bl++) { const a = fa + bl * Math.PI * .4; for (let r2 = 1.4; r2 < FANC[2] - 1; r2 += .5) lit(c, FANC[0] + Math.cos(a + r2 * .12) * r2 - .35, FANC[1] + Math.sin(a + r2 * .12) * r2 - .35, .7, .7, '#5ad8ff'); }
      lit(c, FANC[0] - 1, FANC[1] - 1, 2, 2, '#c3cbea');
      c.restore();
    },
  });
})();

/* ============================================================================
 * objects/marketing.js — ЗОНА МАРКЕТИНГУ (окремий об'єкт, піксель-арт кодом)
 * ----------------------------------------------------------------------------
 * На тому самому місці й у тому самому стилі, що на картинці (перед вікном):
 *   БУДКА  — темно-синя панель з блакитним неоновим обідком; вивіска з рожевою
 *            рамкою, "мішенню" і написом "МАРКЕТИНГ" (NX.t); два голо-екрани:
 *            ліворуч — стрічка постів із лайками, праворуч — воронка реклами
 *   СТІЛ   — продовжує стіл аналітики (спільна тумба на стику), рожевий неоновий край,
 *            тумба з шухлядами справа, ніша з неоновою смужкою,
 *            рожеві горнятка з парою (вазони на столі — wing_plants.js)
 * Коли Nexi працює тут, пости летять швидше, сердечка спливають, росте лічильник.
 * Праву частину столу закриває диван (objects/sofa.js), тому вона не малюється.
 * Кавомашина перед столом — objects/coffee.js, крісло — objects/office.js.
 * ========================================================================== */
(() => {
  const P = NX.px, F = NX.furn, { NAVY, PINK, CYAN, HOLO, DESK, LIL, CHROME } = F.PAL, ramp = F.ramp;
  const rgba = (rgb, a) => `rgba(${rgb},${P.clamp(a, 0, 1)})`, lit = (c, x, y, w, h, col) => { c.fillStyle = col; c.fillRect(x, y, w, h); };
  const noise = (t, i) => .5 + .26 * Math.sin(t * 1.3 + i * 1.7) + .16 * Math.sin(t * 2.9 + i * 3.1) + .08 * Math.sin(t * 5.3 + i * .7);

  const BOOTH = [538, 171, 645, 263], SIGN = [544, 178, 640, 201], ICON = [556.5, 189.5];
  const SCR = { L: [553.5, 207.5, 599, 256], R: [605, 211.5, 636, 257] };
  const DSK = { l: 485, r: 662, top: 283, bot: 338 };          // починається одразу за столом аналітики (одна тумба на стику — як на картинці)
  const DRW = [[632, 656]];                                        // тумба справа (частково за диваном)
  const MUGS = [[537, 275], [559, 276]];

  function buildBooth() {
    const S = F.Sheet(532, 166, 656, 268), [l, t, r, b] = BOOTH, st = F.toVP(r, t + 6, .03), sb = F.toVP(r, b, .03);
    S.poly([[r - .5, t + 6], st, sb, [r - .5, b]], (u, v, i, j) => u > .85 ? CYAN[3] : ramp(NAVY, .28 - v * .18, i, j));   // бічна грань до вікна
    S.rr(l, t, r, b, [7, 7, 1, 1], (d, u, v, i, j, X) => {
      if (d < .7) return CYAN[2]; if (d < 1.5) return CYAN[4]; if (d < 2.2) return CYAN[2];                 // неоновий обідок
      if (d < 3.4) return v < .5 ? NAVY[6] : NAVY[4];
      if (X < l + 10) return Math.abs(X - (l + 9)) < .5 ? NAVY[6] : ramp(NAVY, .3 - v * .14, i, j, .12);    // ліва планка
      return ramp(NAVY, .42 - v * .22, i, j, .12);
    });
    S.rr(...SIGN, 5, (d, u, v, i, j) => d < .6 ? PINK[2] : d < 1.5 ? PINK[5] : d < 2.2 ? '#12062a' : d < 2.8 && v < .5 ? '#3a1a6a' : ramp(['#0e0624', '#160a34', '#1e0e44'], .7 - v * .4, i, j));
    for (const [rr, col] of [[6.5, PINK[5]], [5.2, '#160a34'], [4, PINK[6]], [2.7, '#160a34'], [1.5, PINK[7]]]) S.rr(ICON[0] - rr, ICON[1] - rr, ICON[0] + rr, ICON[1] + rr, rr, col);   // мішень
    S.rr(549, 204, 640, 260, 2, (d, u, v, i, j) => d < .7 ? NAVY[0] : ramp(NAVY, .14, i, j));
    for (const k of ['L', 'R']) { const [a, b2, c2, e] = SCR[k]; S.rr(a - 1.5, b2 - 1.5, c2 + 1.5, e + 1.5, 2, (d, u, v, i, j) => d < .7 ? CYAN[2] : d < 1.5 ? CYAN[4] : ramp(HOLO, .55 - v * .3, i, j)); }
    return S;
  }
  function buildDesk() {
    const S = F.Sheet(481, 268, 664, 342);
    S.rect(DSK.l, DSK.top + 5, DSK.r, DSK.bot - 3.5, (u, v, i, j, X, Y) => {
      const dr = DRW.find(([a, b]) => X >= a && X < b);
      if (dr) {
        const [a, b] = dr, rows = [[290, 304], [305, 319], [320, 333.5]], row = rows.find(([p, q]) => Y >= p && Y < q);
        if (X < a + .6 || X > b - .6) return PINK[0];
        if (!row) return ramp(LIL, .12, i, j);
        const [p, q] = row, du = X - a, dv = Y - p, cx = (a + b) / 2, cy = (p + q) / 2;
        if (dv < .5) return LIL[7]; if (dv > q - p - .5 || du > b - a - 1.2) return LIL[0]; if (du < 1.2) return LIL[5];
        if (Math.abs(Y - cy) < .6 && Math.abs(X - cx) < (b - a) * .26) return Y < cy ? CHROME[5] : CHROME[3];
        if (Math.abs(Y - cy) < 1.1 && Math.abs(X - cx) < (b - a) * .29) return PINK[0];
        return ramp(LIL, .55 - dv / (q - p) * .3 + (1 - du / (b - a)) * .08, i, j, .1);
      }
      if (Y < DSK.top + 8) return '#05021a';
      if (((X - 487) % 13 + 13) % 13 < .7) return DESK[0];
      return ramp(DESK, .32 - v * .25, i, j, .1);
    });
    S.rect(DSK.l, DSK.bot - 3.5, DSK.r, DSK.bot, (u, v) => v < .25 ? CHROME[2] : v > .8 ? PINK[0] : DESK[1]);
    S.rect(DSK.l - 1, DSK.top, DSK.r, DSK.top + 5.5, (u, v) => [PINK[7], PINK[6], PINK[5], PINK[5], PINK[4], PINK[3], PINK[2], PINK[1]][Math.min(7, (v * 8) | 0)]);
    S.rect(DSK.l - 1, DSK.top - .8, DSK.r, DSK.top, (u, v, i, j) => ramp(DESK, .7, i, j));
    MUGS.forEach(([x, y]) => { S.rr(x, y, x + 7, DSK.top, [1, 1, 1.6, 1.6], (d, u, v) => d < .5 ? PINK[1] : v > .38 && v < .56 ? '#ffffff' : (u > .7 ? PINK[3] : PINK[5]));
      S.rect(x + 6.6, y + 2, x + 8.8, y + 6.2, (u, v) => (u > .4 && v > .25 && v < .75) ? null : PINK[3]); });
    return S;
  }

  // ---------- живі екрани ----------
  const [LCV, lx] = F.canvas(182, 194), [RCV, rx] = F.canvas(124, 182);
  const POSTS = ['#ff9ae6', '#7af0ff', '#ffe27a', '#9a8cff'];
  function screenBg(c, w, h, t) {
    c.clearRect(0, 0, w, h); c.fillStyle = 'rgba(40,110,255,.18)'; c.fillRect(0, 0, w, h);
    c.fillStyle = 'rgba(160,220,255,.07)'; for (let y = (t * 12 | 0) % 4; y < h; y += 4) c.fillRect(0, y, w, 1);
  }
  /** Ліворуч: стрічка постів (картки з картинкою, рядками тексту й сердечками) повзе вгору. */
  function drawLeft(c, t, act, prog) {
    const W = 182, H = 194; screenBg(c, W, H, t);
    const sp = 14 + act * 26, off = (t * sp) % 62;
    c.save(); c.beginPath(); c.rect(0, 0, W, H); c.clip();
    for (let k = -1; k < 4; k++) {
      const id = k + Math.floor(t * sp / 62), y = 8 + k * 62 - off, col = POSTS[((id % 4) + 4) % 4];
      c.fillStyle = 'rgba(10,30,110,.55)'; c.fillRect(8, y, W - 16, 54); c.strokeStyle = 'rgba(160,220,255,.6)'; c.lineWidth = 2; c.strokeRect(9, y + 1, W - 18, 52);
      lit(c, 14, y + 7, 40, 40, col); lit(c, 20, y + 13, 28, 28, 'rgba(255,255,255,.35)');                      // "фото"
      lit(c, 62, y + 10, 70 + 20 * P.hash(id, 2), 5, '#e8fdff'); lit(c, 62, y + 21, 50 + 30 * P.hash(id, 3), 4, '#9fdcff');
      const likes = 100 + Math.floor(P.hash(id, 4) * 900) + (act ? Math.floor(prog * 3400) : 0);
      P.text(c, '♥' + likes, 62, y + 44, '#ff9ae6', 10);
    }
    c.restore();
    if (act) for (let i = 0; i < 4; i++) { const ph = (t * .7 + i / 4) % 1; c.globalAlpha = 1 - ph; P.text(c, '♥', 30 + i * 40, H - 10 - ph * 120, '#ff7ad8', 16); c.globalAlpha = 1; }
  }
  /** Праворуч: воронка реклами + мішень, що пульсує. */
  function drawRight(c, t, act, prog) {
    const W = 124, H = 182; screenBg(c, W, H, t);
    P.text(c, 'ADS', 8, 18, '#bfe9ff', 11);
    for (let k = 0; k < 4; k++) { const w = (W - 20) * (1 - k * .2) * (.9 + .1 * Math.sin(t * (1 + act * 2) + k)), y = 30 + k * 22; lit(c, (W - w) / 2, y, w, 16, ['rgba(255,154,230,.75)', 'rgba(122,240,255,.75)', 'rgba(255,226,122,.75)', 'rgba(59,255,138,.75)'][k]); }
    const cx = W / 2, cy = 142, pul = 1 + .08 * Math.sin(t * 4 + act * t * 4);
    for (const [r, col] of [[24, '#ff9ae6'], [16, '#ffffff'], [8, '#ff4fd8']]) { c.strokeStyle = col; c.lineWidth = 4; c.beginPath(); c.arc(cx, cy, r * pul, 0, 7); c.stroke(); }
    if (act) P.text(c, Math.round(40 + prog * 340) + ' →', cx, 176, '#ffe27a', 10, 'center');
  }

  let BOOTHS = null, DESKS = null;
  const mk = NX.addObject({
    id: 'marketing', name: 'obj.marketing', act: 'marketing', active: false, prog: 0, fr: 0,
    hit: { x: 536, y: 168, w: 116, h: 170 },
    drawBack(c, t) {
      if (!BOOTHS) { BOOTHS = buildBooth(); BOOTHS.cv = BOOTHS.canvas(); DESKS = buildDesk(); DESKS.cv = DESKS.canvas(); }
      const act = this.active ? 1 : 0, R = F.res(), sm = R < 3.8;
      c.save(); c.imageSmoothingEnabled = sm;
      const bw = BOOTHS.x1 - BOOTHS.x0, bh = BOOTHS.y1 - BOOTHS.y0; c.drawImage(F.fit(BOOTHS.cv, bw, bh, R), BOOTHS.x0, BOOTHS.y0, bw, bh);
      if ((this.fr++ % 3) === 1) { drawLeft(lx, t, act, this.prog); drawRight(rx, t, act, this.prog); }
      c.imageSmoothingEnabled = true;
      const sc = (cv, q) => c.drawImage(cv, q[0], q[1], q[2] - q[0], q[3] - q[1]); sc(LCV, SCR.L); sc(RCV, SCR.R);
      const title = NX.t('nav.marketing'), sz = Math.min(8, 70 / title.length), tc = rgba('154,246,255', .88 + .12 * Math.sin(t * 2.2 + 1));
      c.globalCompositeOperation = 'lighter';
      c.strokeStyle = rgba('59,232,255', .18 + .1 * Math.sin(t * 1.8) + act * .12); c.lineWidth = 3; c.beginPath(); c.roundRect ? c.roundRect(BOOTH[0] - 1, BOOTH[1] - 1, BOOTH[2] - BOOTH[0] + 2, BOOTH[3] - BOOTH[1] + 2, 8) : c.rect(BOOTH[0] - 1, BOOTH[1] - 1, BOOTH[2] - BOOTH[0] + 2, BOOTH[3] - BOOTH[1] + 2); c.stroke();   // ореол обідка
      P.glow(c, ICON[0], ICON[1], 14, 'rgba(255,79,216,.8)', .25 + .15 * Math.sin(t * 3));
      c.globalCompositeOperation = 'source-over'; P.text(c, title, 601.5, 189.6 + sz / 2, tc, sz, 'center'); P.text(c, title, 601.9, 189.6 + sz / 2, tc, sz, 'center');
      c.globalCompositeOperation = 'lighter'; P.glow(c, 576, 232, 36, 'rgba(70,140,255,.6)', .16 + act * .1); P.glow(c, 620, 234, 26, 'rgba(70,140,255,.6)', .14 + act * .1);
      c.globalCompositeOperation = 'source-over';
      const dw = DESKS.x1 - DESKS.x0, dh = DESKS.y1 - DESKS.y0; c.imageSmoothingEnabled = sm; c.drawImage(F.fit(DESKS.cv, dw, dh, R), DESKS.x0, DESKS.y0, dw, dh);
      c.globalCompositeOperation = 'lighter';
      c.fillStyle = rgba('255,79,216', .3 + .2 * Math.sin(t * 2.2 + 1) + act * .2); c.fillRect(DSK.l - 1, DSK.top, DSK.r - DSK.l + 1, 1.6);
      const sp = DSK.l + ((t * .2 + .5) % 1) * (DSK.r - DSK.l); lit(c, sp - 5, DSK.top + .2, 10, 1, 'rgba(255,255,255,.8)');
      for (let x = 488; x < 630; x += 2) lit(c, x, 327, 1.4, 1.4, act ? `hsla(${(t * 120 + x * 4) % 360},95%,62%,.8)` : rgba('255,79,216', .3 + .3 * Math.sin(t * 2 + x * .1)));
      DRW.forEach(([a, b]) => [297, 312, 326.5].forEach((y, n) => lit(c, b - 3.5, y, 1.6, 1, rgba('59,232,255', .4 + .5 * Math.sin(t * 2 + n)))));
      c.globalCompositeOperation = 'source-over';
      MUGS.forEach(([x, y], k) => { for (let i = 0; i < 3; i++) { const q = (t * .5 + i / 3 + k * .4) % 1; c.fillStyle = `rgba(220,230,255,${.35 * (1 - q)})`; c.fillRect(x + 3 + Math.sin(q * 6 + i) * 1.2, y - 1 - q * 10, 1, 1); } });
      c.restore();
    },
  });
  NX.marketingZone = mk;
})();

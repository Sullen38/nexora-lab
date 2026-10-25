/* ============================================================================
 * objects/ai_desk.js — СТІЛ AI-ЦЕНТРУ: ОДИН В ОДИН ЯК НА КАРТИНЦІ, ТІЛЬКИ ЧІТКО
 * ----------------------------------------------------------------------------
 * Геометрія знята з оригінальної картинки кімнати (assets/room.webp), нічого не
 * вигадано: пряма рожева неонова плита x 68..340, y 294..308 (світла кромка
 * зверху, перелив униз, праворуч тепліша); під нею темно-синій корпус до
 * підлоги (362): ліва опора 68..100, тумба з 3 шухлядами 152..202, права
 * частина 256..340 зі шафкою AI-ядра; між ними ніші (там вазони й ліхтарик
 * з картинки — wing_scene.js). Великий екран стоїть просто на плиті.
 * Малюється NX.furn.Sheet (4 px/од.); живе — неон кромки, LED, вентилятор.
 * API: NX.aiDesk.top(x) = 294 (верх плити — туди стає Nexi).
 * ========================================================================== */
(() => {
  const P = NX.px, F = NX.furn, { CHROME } = F.PAL, ramp = F.ramp, hash = NX.art.hash;
  const rgba = (rgb, a) => `rgba(${rgb},${P.clamp(a, 0, 1)})`, lit = (c, x, y, w, h, col) => { c.fillStyle = col; c.fillRect(x, y, w, h); };
  const L = 68, R = 340, TOP = 294, SLAB = 308, FLOOR = 362;
  const SEC = { legL: [L, 100], cab: [152, 202], core: [256, 292], legR: [314, R] };
  const ROWS = [[314, 329], [331, 346], [348, 360]];
  const FANC = [274, 330, 7];
  const SL = ['#3a0e5b', '#4d0d6e', '#5b0775', '#6d058a', '#850498', '#ac14b9', '#b317bd', '#cb53cb', '#e07ae0'];
  const SW = ['#5a1440', '#8e286a', '#a52174', '#c32988', '#d73f90', '#e45f8c', '#ee7aa4', '#f6a0c0', '#ffc8dc'];
  const NV = ['#02010a', '#05041a', '#080a2a', '#0d143c', '#121d50', '#182866', '#20357c', '#2a4494'];
  const mix = (a, b, k) => { if (k <= 0) return a; if (k >= 1) return b; const A = [1, 3, 5].map(i => parseInt(a.slice(i, i + 2), 16)), B = [1, 3, 5].map(i => parseInt(b.slice(i, i + 2), 16)); return '#' + A.map((v, i) => Math.round(v + (B[i] - v) * k).toString(16).padStart(2, '0')).join(''); };
  const solid = X => Object.values(SEC).find(([a, b]) => X >= a && X < b);

  function build() {
    const S = F.Sheet(L - 2, TOP - 2, R + 2, FLOOR + 1), o = '#060313';
    // --- корпус під плитою
    S.rect(L, SLAB, R, FLOOR, (u, v, i, j, X, Y) => {
      const sec = solid(X), d = (Y - SLAB) / (FLOOR - SLAB);
      if (!sec) {                                                               // ніша: тінь під плитою, задня стінка з рейками, LED-смужка, підлога
        if (Y < SLAB + 2) return NV[0];
        if (Y < 352) return ((X - 100) % 12 + 12) % 12 < .8 ? NV[3] : ramp(['#030112', '#05031c', '#080526', '#0b0730'], .15 + d * .6, i, j, .1);
        if (Y < 353) return '#123a6a';
        return ramp(['#04021a', '#0a0628', '#120a36', '#1a0f46'], .2 + (Y - 353) / 9 * .6, i, j, .15);
      }
      const [a, b] = sec, du = X - a, dw = b - X;
      if (du < .5 || dw < .5) return o;
      if (Y > FLOOR - 4) return Y > FLOOR - .6 ? o : Y < FLOOR - 3.2 ? CHROME[2] : NV[1];                            // цоколь
      if (a === SEC.cab[0]) {                                                   // тумба з трьома шухлядами (як на картинці)
        const row = ROWS.find(([p, q]) => Y >= p && Y < q); if (!row) return Y < ROWS[0][0] ? NV[2] : NV[0];
        const [p, q] = row, dv = Y - p, dh = q - Y, cy = (p + q) / 2;
        if (dv < .5) return NV[7]; if (dh < .5 || dw < 1.4) return NV[0]; if (du < 1.4) return NV[6];
        if (Math.abs(Y - cy) < 1 && Math.abs(X - (a + b) / 2) < 8) return Math.abs(Y - cy) < .4 ? '#000006' : NV[1];
        if (Math.abs(Y - cy + 1.5) < .4 && Math.abs(X - (a + b) / 2) < 8) return NV[6];
        return ramp(NV, .78 - dv / (q - p) * .35 + (1 - du / (b - a)) * .1, i, j, .12);
      }
      if (a === SEC.core[0]) {                                                  // шафка AI-ядра з вентилятором і решіткою
        const fd = Math.hypot(X - FANC[0], Y - FANC[1]);
        if (fd < FANC[2] + .9) return fd > FANC[2] + .1 ? o : fd > FANC[2] - .9 ? CHROME[3] : '#03020c';
        if (Y > 342 && Y < 356 && X > a + 3 && X < b - 3) return ((Y - 342) % 2.4 < .8) ? '#05021a' : NV[4];
        if (X > b - 6 && X < b - 3 && Y > 312 && Y < 326) return '#020210';
        return ramp(NV, .6 - d * .3 + (du < 1.5 ? .2 : 0), i, j, .12);
      }
      if (Math.abs(X - (a + (b - a) * .45)) < .7) return NV[6];                 // опори зі світлою смужкою
      return ramp(NV, .45 - d * .25 + (du < 1.2 ? .15 : 0), i, j, .12);
    });
    // --- плита: світла кромка, рожевий перелив, праворуч тепліша (ліхтарик)
    S.rr(L, TOP, R, SLAB, [2, 2, 2, 2], (d, u, v, i, j, X, Y) => {
      const k = P.clamp((X - 250) / 70, 0, 1), dy = Y - TOP;
      if (d < .5) return o;
      if (dy < 1.3) return k > .5 ? '#ffe2ee' : '#ffd4ff';
      if (dy < 2.2) return k > .5 ? SW[7] : SL[8];
      if ([152, 202, 256].some(sx => Math.abs(X - sx) < .45)) return SL[2];
      const q = 1 - (dy - 2.2) / (SLAB - TOP - 2.2), n = SL.length - 1, idx = P.clamp(Math.round(q * .95 * n + NX.art.BAYER[(j & 3) * 4 + (i & 3)] * .9), 0, n);
      return mix(SL[idx], SW[idx], k);
    });
    return S;
  }
  let SH = null;
  NX.aiDesk = NX.addObject({
    id: 'aiDesk', L, R, TOP, SLAB, FLOOR, SEC, FANC, ROWS,
    top() { return TOP; }, front: () => TOP, back: () => TOP, bot: () => FLOOR,
    layers(t) { return [{ y: 300, draw: c => this.draw(c, t) }]; },
    draw(c, t) {
      if (!SH) { SH = build(); SH.cv = SH.canvas(); }
      const Rr = F.res(), act = NX.objects.aiPc && NX.objects.aiPc.active ? 1 : 0;
      c.save(); c.imageSmoothingEnabled = Rr < 3.8;
      c.drawImage(F.fit(SH.cv, SH.x1 - SH.x0, SH.y1 - SH.y0, Rr), SH.x0, SH.y0, SH.x1 - SH.x0, SH.y1 - SH.y0);
      c.globalCompositeOperation = 'lighter';
      c.fillStyle = rgba('255,79,216', .28 + .16 * Math.sin(t * 2.2) + act * .18); c.fillRect(L + 1, TOP + .6, R - L - 2, 1.4);           // неон кромки
      const sx = L + ((t * .22) % 1) * (R - L); lit(c, sx - 7, TOP + .7, 14, 1, 'rgba(255,255,255,.85)');                                   // бігуча іскра
      for (const [a, b] of Object.values(SEC)) for (let x = a + 1.5; x < b - 1.5; x += 2) { const hue = (t * 120 + x * 4) % 360; c.fillStyle = act ? `hsla(${hue},95%,62%,.85)` : rgba('59,232,255', .4 + .3 * Math.sin(t * 2 + x * .12)); c.fillRect(x, FLOOR - 2.2, 1.3, 1.2); }
      for (let x = 102; x < 150; x += 2) lit(c, x, 352.2, 1.3, .9, rgba('59,232,255', .18 + .14 * Math.sin(t * 1.6 + x * .08)));
      for (let x = 204; x < 254; x += 2) lit(c, x, 352.2, 1.3, .9, rgba('255,79,216', .16 + .12 * Math.sin(t * 1.6 + x * .08)));
      ROWS.forEach(([p, q], k) => lit(c, SEC.cab[1] - 6, (p + q) / 2 - 3, 2.4, 1, rgba('59,232,255', .45 + .5 * Math.sin(t * 2 + k * 1.7))));
      for (let k = 0; k < 6; k++) lit(c, SEC.core[1] - 5.4, 313.5 + k * 2.4, 1.8, 1.4, hash(k, Math.floor(t * (4 + act * 8))) > .4 ? ['#3bff8a', '#3be8ff', '#ff7af0'][k % 3] : '#0a1a20');
      P.glow(c, FANC[0], FANC[1], 12, 'rgba(59,232,255,.7)', .22 + act * .3);
      const fa = t * (4 + act * 14); for (let bl = 0; bl < 5; bl++) { const a = fa + bl * Math.PI * .4; for (let r2 = 1.4; r2 < FANC[2] - 1; r2 += .5) lit(c, FANC[0] + Math.cos(a + r2 * .12) * r2 - .35, FANC[1] + Math.sin(a + r2 * .12) * r2 - .35, .7, .7, '#5ad8ff'); }
      lit(c, FANC[0] - 1, FANC[1] - 1, 2, 2, '#c3cbea');
      c.restore();
    },
  });
})();

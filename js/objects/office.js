/* ============================================================================
 * objects/office.js — ЖИВІ КРІСЛА АНАЛІТИКИ Й МАРКЕТИНГУ (піксель-арт кодом)
 * ----------------------------------------------------------------------------
 * Раніше крісла були вирізані з картинки — тепер намальовані кодом (стиль
 * кімнати: темно-синя оббивка, стьобка, неоновий кант), на тих самих місцях.
 * Крісло стоїть боком і "дивиться" ліворуч, як на картинці:
 *   спинка з подушкою під голову і значком N, сидіння, підлокітник,
 *   хромований газліфт, п'ятипроменева основа з коліщатками.
 * Поведінка (як і раніше):
 *   - коли Nexi підходить, крісло від'їжджає від столу (off -> OUT)
 *   - Nexi застрибує на сидіння, крісло під'їжджає назад РАЗОМ з ним
 *   - поки він працює, крісло трохи гойдається; при відкочуванні — оберт
 *   - LED-стрічка по краю спинки з бігучим вогником; коли Nexi сидить — RGB;
 *     підсвітка під кріслом на підлозі
 * API для сценаріїв (activities.js): NX.chairA / NX.chairM — x, y, seat, OUT, roll().
 * ========================================================================== */
(() => {
  const P = NX.px, F = NX.furn, { NAVY, CHROME } = F.PAL, ramp = F.ramp;
  const ACC = { analytics: ['#0f4870', '#17709a', '#2aa6c8', '#3be8ff', '#9af6ff'], marketing: ['#58134f', '#7a1c6d', '#c63aa8', '#ff4fd8', '#ffc2ec'] };
  // LED-стрічка по краю спинки (локальні координати крісла при масштабі 1)
  const LED = [[43.5, 50], [43.5, 14], [46, 5], [56, 1.2], [71, 1.2], [80, 5], [83.4, 14], [83.4, 60]];
  const N = ['X...X', 'XX..X', 'X.X.X', 'X..XX', 'X...X'];

  /** Крісло в растр (локальні координати, масштаб 1: 0..92 × 0..96). Геймерське: висока спинка з
   *  "крилами", подушка під голову з неоном, стьобка, акцентні смуги, хромовані підлокітники,
   *  товсте сидіння з кантом, газліфт з пружиною, п'ятипроменева основа з неоновими коліщатками. */
  function build(acc) {
    const S = F.Sheet(0, 0, 92, 96, .25), O = F.PAL.OUT;
    // основа: 3 видимі промені з коліщатками
    [[42.5, 14, 86.5], [42.5, 42.5, 86.5], [42.5, 71, 86.5]].forEach(([x0, x1, y1]) => S.line(x0, 79, x1, y1, CHROME[1], 3.6));
    [[42.5, 14, 86.5], [42.5, 42.5, 86.5], [42.5, 71, 86.5]].forEach(([x0, x1, y1]) => S.line(x0, 78.4, x1, y1 - .6, CHROME[4], 1.2));
    for (const cx of [14, 42.5, 71]) { S.rr(cx - 3.8, 86, cx + 3.8, 93.6, 3.8, (d, u, v) => d < .6 ? O : d < 1.5 ? CHROME[2] : (u < .45 && v < .45 ? CHROME[3] : NAVY[1])); S.rr(cx - 1.4, 88.6, cx + 1.4, 91.4, 1.4, acc[3]); }
    // газліфт з пружиною
    S.rect(38, 68, 47, 80, (u, v, i, j) => Math.abs(((v * 6) % 1) - .5) < .12 ? NAVY[1] : ramp(CHROME, .9 - Math.abs(u - .35) * 1.6, i, j));
    S.rr(34, 66, 51, 69.5, 1.5, (d, u, v, i, j) => d < .5 ? O : ramp(CHROME, .7 - v * .4, i, j));
    // спинка: високa, з "крилами" по боках, стьобка, акцентні смуги
    S.rr(42, 0, 85, 64, [14, 14, 4, 4], (d, u, v, i, j, X, Y) => {
      if (d < .6) return O; if (d < 1.5) return (u < .3 || v < .15) ? NAVY[8] : NAVY[5];
      if (d < 6) return ramp(NAVY, .36 - v * .2 + (u < .4 ? .08 : -.04), i, j, .1);                   // валики-крила
      if (d < 6.8) return NAVY[1];
      if (Math.abs(X - 49.5) < .8 || Math.abs(X - 77.5) < .8) return acc[2];                          // акцентні смуги
      const quilt = ((Y - 6) % 7 + 7) % 7;
      return quilt < .7 ? NAVY[2] : ramp(NAVY, .58 - v * .26 + (quilt < 2.2 ? .1 : 0) + (u < .45 ? .06 : 0), i, j, .1);
    });
    S.rr(50, 5, 77, 16.5, 5, (d, u, v, i, j) => d < .6 ? O : d < 1.4 ? acc[4] : ramp(acc, .8 - v * .55 - u * .1, i, j));    // подушка-підголівник
    S.rr(56, 22, 71, 30, 2, (d, u, v, i, j) => d < .5 ? NAVY[1] : ramp(NAVY, .2 + v * .2, i, j));                           // поперекова вставка
    N.forEach((row, j) => [...row].forEach((ch, i) => ch === 'X' && S.rect(59.5 + i * 1.2, 36 + j * 1.2, 60.7 + i * 1.2, 37.2 + j * 1.2, acc[3])));
    // підлокітник (3D): хромована стійка + м'яка накладка
    S.rect(29, 49, 35, 58, (u, v, i, j) => ramp(CHROME, .6 - u * .5, i, j));
    S.rr(11, 43, 50, 50, 3, (d, u, v, i, j) => d < .5 ? O : v < .3 ? NAVY[7] : ramp(NAVY, .4 - v * .2, i, j));
    S.rect(13, 44.5, 48, 45.3, acc[3]);
    // сидіння: товста подушка, світлий верх, кант, передній валик
    S.rr(2, 55, 78, 70, [6, 3, 3, 6], (d, u, v, i, j) => {
      if (d < .6) return O;
      if (v < .25) return d < 1.4 ? NAVY[8] : ramp(NAVY, .78 - v * .6, i, j, .08);
      if (v > .72) return ramp(NAVY, .36 - (v - .72) * .6, i, j, .1);
      return ramp(NAVY, .5 - v * .3 + (u < .25 ? .06 : 0) + (Math.abs(((u * 5) % 1) - .5) < .06 ? -.12 : 0), i, j, .1);
    });
    S.rect(4, 64.5, 76, 65.4, acc[2]);
    return S.canvas();
  }
  function makeChair(id, x, y, seat, scale, glowAt) {
    const acc = ACC[id]; let CV = null;
    return NX.addObject({
      id: id + 'Chair', x, y, seat, scale, off: 0, target: 0, wob: 0, OUT: -16, spin: 0, glowAt,
      /** Відкотити (-16) / підкотити (0) крісло; при відкочуванні — ефектний оберт. */
      roll(to) { if (to !== this.target && to === this.OUT) this.spin = 1; this.target = to; },
      update(dt, t) {
        const v = (this.target - this.off) * Math.min(1, dt * 6); this.off += v;
        const n = NX.nexi, sitting = n.seat === this; this.wob = sitting && n.cur && n.cur.work ? Math.sin(t * 2.2) * .6 : this.wob * .9;
        if (sitting) { n.x = this.x + this.seat[0] + this.off; n.y = this.y + this.seat[1]; n.gy = 362; }
        if (Math.abs(v) > .05 && Math.random() < .3) NX.fx.emit('dust', this.x + 40 * scale + this.off, this.y + 94 * scale);
        this.spin = Math.max(0, this.spin - dt * 1.4);
      },
      layers(t) {
        const X = this.x + this.off, Y = this.y, W = 92 * scale, H = 96 * scale;
        return [{ y: Y + this.seat[1] - .5, draw: c => {
          if (!CV) CV = build(acc);
          const sit = NX.nexi.seat === this, col = sit ? `hsl(${(t * 120) % 360} 95% 62%)` : acc[3];
          const [gx, gy] = this.glowAt; P.glow(c, gx + this.off, gy, 30, sit ? 'rgba(255,120,240,.7)' : (id === 'analytics' ? 'rgba(59,232,255,.5)' : 'rgba(255,79,216,.45)'), .45 + .2 * Math.sin(t * 3));   // підсвітка під кріслом
          c.save(); const R = F.res(); c.imageSmoothingEnabled = R * scale < 3.8;
          const sx = this.spin > 0 ? Math.cos(this.spin * Math.PI * 4) : 1;                                                 // оберт навколо осі
          c.translate(X + W / 2, Y + H); c.scale((1 + this.wob * .03) * (Math.abs(sx) < .15 ? .15 * Math.sign(sx || 1) : sx), 1); c.translate(-W / 2, -H);
          c.drawImage(F.fit(CV, W, H, R), 0, 0, W, H);
          c.scale(scale, scale); c.globalCompositeOperation = 'lighter'; c.strokeStyle = col; c.lineWidth = 1.3; c.beginPath();   // LED-стрічка по краю спинки
          LED.forEach(([lx, ly], i) => i ? c.lineTo(lx, ly) : c.moveTo(lx, ly)); c.stroke();
          c.globalAlpha = .35; c.lineWidth = 3.5; c.stroke(); c.globalAlpha = 1;
          const q = (t * .8) % 1, k2 = Math.floor(q * (LED.length - 1)), f2 = q * (LED.length - 1) - k2, A = LED[k2], B = LED[k2 + 1];
          c.fillStyle = '#ffffff'; c.fillRect(A[0] + (B[0] - A[0]) * f2 - 1, A[1] + (B[1] - A[1]) * f2 - 1, 2, 2);
          c.restore();
        } }];
      },
    });
  }
  // лівий верх крісла, точка сидіння (відносно нього), масштаб, де світить підсвітка на підлозі
  NX.chairA = makeChair('analytics', 383, 277, [30, 60], 1, [423, 370]);
  NX.chairM = makeChair('marketing', 588, 262, [30, 44], .8, [622, 336]);
})();

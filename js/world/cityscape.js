/* ============================================================================
 * world/cityscape.js — ЖИТТЯ ЗА ВІКНОМ (місто живе своїм життям)
 * ----------------------------------------------------------------------------
 *   - три смуги летючих машин (різна швидкість, напрям, фари, сліди)
 *   - дирижабль з LED-стрічкою, що біжить
 *   - прожектори з землі, що повільно хитаються
 *   - падаючі зорі, рій дронів з вогниками
 *   - феєрверк: NX.city.fireworks(сек) — коли Nexi дивиться у вікно
 * Усе обрізається рамкою вікна; віконна стійка домальовується поверх.
 * ========================================================================== */
NX.city = {
  WIN: { x: 472, y: 0, w: 462, h: 168 }, MULLION: [594, 0, 14, 168],
  cars: [], fw: [], fwUntil: 0, star: null,
  init() {
    const lanes = [{ y: 96, sp: 46, dir: 1, s: 1 }, { y: 128, sp: 30, dir: -1, s: .8 }, { y: 160, sp: 64, dir: 1, s: 1.2 }];
    lanes.forEach((L, li) => { for (let i = 0; i < 4; i++) this.cars.push({ ...L, x: this.WIN.x + Math.random() * this.WIN.w, col: ['#ff7af0', '#3be8ff', '#ffc94d', '#c9b4ff'][(i + li) % 4] }); });
  },
  fireworks(sec) { this.fwUntil = NX.time + sec; },
  draw(c, t, dt) {
    const P = NX.px, W = this.WIN;
    c.save(); c.beginPath(); c.rect(W.x, W.y, W.w, W.h); c.clip();
    // прожектори
    c.save(); c.globalCompositeOperation = 'lighter';
    [[700, .4], [880, -.3]].forEach(([bx, ph], i) => { const a = -Math.PI / 2 + Math.sin(t * .4 + ph * 5) * .5, len = 200; const g = c.createLinearGradient(bx, 168, bx + Math.cos(a) * len, 168 + Math.sin(a) * len); g.addColorStop(0, 'rgba(160,200,255,.18)'); g.addColorStop(1, 'rgba(160,200,255,0)');
      c.fillStyle = g; c.beginPath(); c.moveTo(bx - 3, 168); c.lineTo(bx + Math.cos(a - .06) * len, 168 + Math.sin(a - .06) * len); c.lineTo(bx + Math.cos(a + .06) * len, 168 + Math.sin(a + .06) * len); c.lineTo(bx + 3, 168); c.fill(); });
    c.restore();
    // дирижабль з LED-стрічкою
    const zx = W.x + ((t * 9) % (W.w + 160)) - 80, zy = 48 + Math.sin(t * .5) * 3;
    c.fillStyle = '#3a2a6a'; c.beginPath(); c.ellipse(zx, zy, 34, 9, 0, 0, 7); c.fill(); c.fillStyle = '#5a4a9a'; c.beginPath(); c.ellipse(zx, zy - 3, 30, 4, 0, 0, 7); c.fill();
    P.rect(c, zx - 8, zy + 8, 16, 4, '#2a1c50'); P.rect(c, zx - 22, zy - 2, 44, 4, '#0a0a20');
    for (let i = 0; i < 22; i++) if ((i + Math.floor(t * 8)) % 6 < 3) P.rect(c, zx - 21 + i * 2, zy - 1, 1, 2, i % 4 < 2 ? '#ff4fd8' : '#3be8ff');
    P.rect(c, zx + 32, zy - 1, 2, 2, Math.sin(t * 5) > 0 ? '#ff3b3b' : '#550000');
    // летючі машини
    this.cars.forEach(car => { car.x += car.sp * car.dir * dt; if (car.dir > 0 && car.x > W.x + W.w + 20) car.x = W.x - 20; if (car.dir < 0 && car.x < W.x - 20) car.x = W.x + W.w + 20;
      const s = car.s, fx = car.dir > 0 ? car.x + 8 * s : car.x - 1;
      c.save(); c.globalCompositeOperation = 'lighter'; c.globalAlpha = .35; P.rect(c, car.dir > 0 ? car.x - 18 * s : car.x + 8 * s, car.y + 1.5 * s, 18 * s, 1, car.col); c.restore();
      P.rect(c, car.x, car.y, 8 * s, 3 * s, '#1a1d40'); P.rect(c, car.x + 2 * s, car.y - 1.5 * s, 4 * s, 2 * s, car.col); P.rect(c, fx, car.y + .5, 1.5, 1.5, '#fff6c0'); P.rect(c, car.dir > 0 ? car.x - 1 : car.x + 8 * s, car.y + .5, 1.5, 1.5, '#ff3b3b');
      P.glow(c, fx, car.y + 1, 6, 'rgba(255,240,180,.9)', .5); });
    // рій дронів
    for (let i = 0; i < 5; i++) { const dx = W.x + 60 + ((t * 14 + i * 9) % (W.w - 120)), dy = 140 - i * 4 + Math.sin(t * 2 + i) * 3; P.rect(c, dx, dy, 2, 1, '#9aa0c0'); if (Math.sin(t * 7 + i) > .3) P.rect(c, dx, dy - 1, 1, 1, '#ff3b3b'); }
    // падаюча зоря
    if (!this.star && Math.random() < dt * .15) this.star = { x: W.x + 60 + Math.random() * (W.w - 120), y: 6 + Math.random() * 30, t: 0 };
    if (this.star) { const s = this.star; s.t += dt; const k = s.t / .8; for (let i = 0; i < 10; i++) P.rect(c, s.x + k * 90 - i * 3, s.y + k * 40 - i * 1.3, 1.5, 1.5, `rgba(255,255,255,${(1 - i / 10) * (1 - k)})`); if (k >= 1) this.star = null; }
    // феєрверк
    if (NX.time < this.fwUntil && Math.random() < dt * 2.2) { const fx = W.x + 50 + Math.random() * (W.w - 100), fy = 30 + Math.random() * 70, col = ['#ff4fd8', '#3be8ff', '#ffc94d', '#7aff9a'][Math.random() * 4 | 0]; this.fw.push({ x: fx, y: fy, t: 0, col }); }
    this.fw = this.fw.filter(f => (f.t += dt) < 1.4); this.fw.forEach(f => { const r = 6 + f.t * 26; for (let i = 0; i < 14; i++) { const a = i / 14 * Math.PI * 2; c.globalAlpha = Math.max(0, 1 - f.t / 1.4); P.rect(c, f.x + Math.cos(a) * r, f.y + Math.sin(a) * r + f.t * f.t * 10, 1.5, 1.5, f.col); } c.globalAlpha = 1; P.glow(c, f.x, f.y, 20, 'rgba(255,255,255,.6)', Math.max(0, .6 - f.t)); });
    c.restore();
    const [mx, my, mw, mh] = this.MULLION; c.drawImage(NX.room.img, mx, my, mw, mh, mx, my, mw, mh);   // віконна стійка поверх
  },
};
/** Вікно як об'єкт: тап -> Nexi підходить і милується містом (феєрверк). */
NX.addObject({ id: 'cityWindow', name: 'obj.window', act: 'window', hit: { x: 472, y: 0, w: 462, h: 150 } });

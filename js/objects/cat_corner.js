/* ============================================================================
 * objects/cat_corner.js — КУТОК КОТА: лежанка, дряпка з поличкою, миски, м'ячик
 * ----------------------------------------------------------------------------
 * Стан, яким користується кіт (actors/cat/cat.js) і Nexi:
 *   food  0..1 — скільки корму в мисці (кіт їсть -> менше; Nexi насипає -> 1)
 *   ball  {x,y,vx,vy} — м'ячик, який кіт ганяє по підлозі
 * Позиції мисок/м'ячика залежать від висоти добудованої підлоги (layout()).
 * ========================================================================== */
NX.addObject({
  id: 'catCorner', name: 'obj.catCorner', act: 'feedCat',
  hit: { x: 36, y: 326, w: 42, h: 38 }, food: .7,
  bowl: [148, 410], water: [172, 410], platform: [67, 326], bed: [57, 351],
  ball: { x: 300, y: 430, vx: 0, vy: 0 },
  layout() { const F = NX.cam.front, y = 368 + Math.min(44, F * .24); this.bowl = [148, y]; this.water = [172, y]; this.ball.y = NX.px.clamp(this.ball.y, 372, 368 + F - 30); },
  kick(dx, dy) { this.ball.vx += dx; this.ball.vy += dy; },
  update(dt) {
    const b = this.ball, B = NX.room.walkBounds(); b.x += b.vx * dt; b.y += b.vy * dt; b.vx *= Math.pow(.25, dt); b.vy *= Math.pow(.25, dt);
    if (b.x < B.minX || b.x > B.maxX) b.vx *= -1; if (b.y < 366 || b.y > B.maxY) b.vy *= -1; [b.x, b.y] = [NX.px.clamp(b.x, B.minX, B.maxX), NX.px.clamp(b.y, 366, B.maxY)];
  },
  layers(t) {
    const P = NX.px, s = this, F = NX.furn;
    if (!this.CV) {                                                  // лежанка й дряпка — піксель-арт у стилі кімнати (один раз)
      const S = F.Sheet(36, 326, 78, 364), { NAVY, PINK, CHROME } = F.PAL, r = F.ramp;
      // дряпка-стовпчик з рожевою поличкою зверху (за лежанкою, у ніші тумби)
      S.rect(66, 328, 73, 352, (u, v, i, j) => (v * 24 % 3 < 1) ? '#8a6038' : r(['#8a6038', '#b88a5a', '#d8a870'], .6 - u * .5, i, j));
      S.rr(60, 326, 78, 329.5, 1.2, (d, u, v) => d < .4 ? '#2a0f3a' : v < .4 ? PINK[6] : PINK[4]);
      // кругла лежанка: борт-бублик, м'яка подушка всередині, неоновий кант, ніжки
      S.poly([[40, 342], [74, 342], [77, 356], [74, 361], [40, 361], [37, 356]], (u, v, i, j, X, Y) => {
        const ex = (X - 57) / 20, ey = (Y - 351) / 10, d = Math.hypot(ex, ey);
        if (d > 1) return null; if (d > .93) return '#2a0f3a';
        if (d > .62) return r(['#3a1a5a', '#5a2a7a', '#7a4aa8', '#9a6ac8'], .75 - ey * .4 - d * .2, i, j, .12);          // борт
        if (d > .55) return '#2a1040';
        return r(['#2a1a4a', '#3d2a66', '#55408a', '#6e58aa', '#8a74c4'], .55 - ey * .35 + (Math.sin(X * 1.3) * Math.sin(Y * 1.6) > .3 ? .15 : 0), i, j, .14);   // подушка з ворсом
      });
      S.rect(38, 360.5, 76, 362.5, (u, v) => v < .4 ? PINK[3] : '#2a0f3a');
      this.CV = S.canvas(); this.CVX = S.x0; this.CVY = S.y0; this.CVW = S.x1 - S.x0; this.CVH = S.y1 - S.y0;
    }
    return [
      { y: 340, draw: c => { const R = F.res(); c.save(); c.imageSmoothingEnabled = R < 3.8; c.drawImage(F.fit(this.CV, this.CVW, this.CVH, R), this.CVX, this.CVY, this.CVW, this.CVH);
        c.globalCompositeOperation = 'lighter'; c.fillStyle = `rgba(255,79,216,${.25 + .15 * Math.sin(t * 2)})`; c.fillRect(39, 360.8, 36, 1); c.restore(); } },
      { y: s.bowl[1], draw: c => P.depth(c, s.bowl[0] + 13, s.bowl[1], () => {     // миски: автоматична годівниця з дисплеєм + миска з водою
        const [bx, by] = s.bowl, [wx, wy] = s.water;
        P.rect(c, bx - 11, by - 7, 22, 7, '#1a1040'); P.rect(c, bx - 11, by - 7, 22, 1, '#5a4a9a'); P.rect(c, bx - 10, by - 1, 20, 1, '#0a0620');
        P.rect(c, bx - 8, by - 5, 16, 3, '#d93a4a'); P.rect(c, bx - 8, by - 5, 16, 1, '#ff6a7a');
        if (s.food > .05) for (let i = 0; i < 7 * s.food; i++) P.rect(c, bx - 6 + (i * 5) % 14, by - 7 - (i > 3 ? 1 : 0), 2, 2, '#9a5a22');
        P.rect(c, bx - 3, by - 10, 6, 2.5, s.food > .3 ? '#3bff8a' : (Math.sin(t * 6) > 0 ? '#ff4f4f' : '#5a1a1a'));                  // індикатор корму
        P.rect(c, wx - 9, wy - 5, 18, 5, '#2a6aff'); P.rect(c, wx - 10, wy - 6, 20, 2, '#5a9aff'); P.rect(c, wx - 7, wy - 6, 14, 1, '#9ad8ff');
        P.rect(c, wx - 5 + Math.sin(t * 2) * 3, wy - 6, 3, 1, '#d8f0ff');                                                                       // блік на воді
      }) },
      { y: s.ball.y, draw: c => { const { x, y } = s.ball; P.depth(c, x, y, () => { P.rect(c, x - 3, y - 6, 6, 6, '#ff4f9a'); P.rect(c, x - 2, y - 6, 2, 2, '#ffb0d0'); P.rect(c, x - 3, y - 3, 6, 1, '#ffe27a'); }); } },
    ];
  },
});

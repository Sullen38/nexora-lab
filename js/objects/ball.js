/* ============================================================================
 * objects/ball.js — М'ЯЧИК: лежить на підлозі й котиться (фізика), тап — Nexi підбігає й штовхає, Рудик наздоганяє
 * ----------------------------------------------------------------------------
 * Стан: x, y — точка підлоги; vx, vy — швидкість (згасає); відскакує від країв підлоги й від меблів (сліди foot — world/room.js
 * obstacles), а не котиться під них. Висота добудованої підлоги змінюється з екраном — layout() тримає м'ячик на ній.
 * Раніше м'ячик був частиною кутка кота (objects/cat_corner.js — лежанка, дряпка, миски); куток прибрано (власник, 02.11:
 * «поки що місце для Рудика взагалі прибираємо»; узяти назад — коміт be2f780).
 * ========================================================================== */
NX.addObject({
  id: 'ball', name: 'obj.ball', act: 'kickBall',
  x: 300, y: 430, vx: 0, vy: 0,
  get hit() { const k = NX.px.depthK(this.y); return { x: this.x - 9 * k, y: this.y - 12 * k, w: 18 * k, h: 14 * k }; },
  layout() { this.y = NX.px.clamp(this.y, 372, 368 + NX.cam.front - 30); },
  /** Поштовх (од. за секунду). */
  kick(dx, dy) { this.vx += dx; this.vy += dy; },
  update(dt) {
    const B = NX.room.walkBounds(); this.x += this.vx * dt; this.y += this.vy * dt; this.vx *= Math.pow(.25, dt); this.vy *= Math.pow(.25, dt);
    if (this.x < B.minX || this.x > B.maxX) this.vx *= -1; if (this.y < 366 || this.y > B.maxY) this.vy *= -1;
    this.x = NX.px.clamp(this.x, B.minX, B.maxX); this.y = NX.px.clamp(this.y, 366, B.maxY);
    for (const r of NX.room.obstacles('cat')) if (this.x > r[0] && this.x < r[1] && this.y > r[2] && this.y < r[3]) {   // відскакує від меблів (диван, крісло, зони), а не котиться під них
      const d = [this.x - r[0], r[1] - this.x, r[2] < 370 ? Infinity : this.y - r[2], r[3] - this.y], k = d.indexOf(Math.min(...d));
      if (k === 0) { this.x = r[0]; this.vx = -Math.abs(this.vx); } else if (k === 1) { this.x = r[1]; this.vx = Math.abs(this.vx); } else if (k === 2) { this.y = r[2]; this.vy = -Math.abs(this.vy); } else { this.y = r[3]; this.vy = Math.abs(this.vy); }
    }
  },
  layers() {
    const P = NX.px, { x, y } = this;
    return [{ y, draw: c => P.depth(c, x, y, () => { P.rect(c, x - 3, y - 6, 6, 6, '#ff4f9a'); P.rect(c, x - 2, y - 6, 2, 2, '#ffb0d0'); P.rect(c, x - 3, y - 3, 6, 1, '#ffe27a'); }) }];
  },
});

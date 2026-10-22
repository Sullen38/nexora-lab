/* ============================================================================
 * objects/cat_corner.js — КУТОК КОТА: лежанка, дряпка з поличкою, миски, м'ячик
 * ----------------------------------------------------------------------------
 * Стан, яким користується кіт (actors/cat/cat.js) і Nexi:
 *   food  0..1 — скільки корму в мисці (кіт їсть -> менше; Nexi насипає -> 1)
 *   ball  {x,y,vx,vy} — м'ячик, який кіт ганяє по підлозі
 * Позиції мисок/м'ячика залежать від висоти добудованої підлоги (layout()).
 * ========================================================================== */
NX.addObject({
  id: 'catCorner', name: 'Куток кота', act: 'feedCat',
  hit: { x: 40, y: 300, w: 80, h: 60 }, food: .7,
  bowl: [150, 390], water: [176, 390], platform: [82, 313], bed: [80, 349],
  ball: { x: 300, y: 430, vx: 0, vy: 0 },
  layout() { const F = NX.cam.front, y = 368 + Math.min(30, F * .16); this.bowl = [150, y]; this.water = [176, y]; this.ball.y = NX.px.clamp(this.ball.y, 372, 368 + F - 30); },
  kick(dx, dy) { this.ball.vx += dx; this.ball.vy += dy; },
  update(dt) {
    const b = this.ball, B = NX.room.walkBounds(); b.x += b.vx * dt; b.y += b.vy * dt; b.vx *= Math.pow(.25, dt); b.vy *= Math.pow(.25, dt);
    if (b.x < B.minX || b.x > B.maxX) b.vx *= -1; if (b.y < 366 || b.y > B.maxY) b.vy *= -1; [b.x, b.y] = [NX.px.clamp(b.x, B.minX, B.maxX), NX.px.clamp(b.y, 366, B.maxY)];
  },
  layers(t) {
    const P = NX.px, s = this;
    return [
      { y: 318, draw: c => {                                       // дряпка з поличкою (за лежанкою)
        P.rect(c, 96, 318, 7, 32, '#b88a5a'); for (let y = 320; y < 350; y += 4) P.rect(c, 96, y, 7, 1, '#8a6038');
        P.cube(c, 58, 318, 46, 5, 4, '#5a2a7a', '#7a4aa8', '#3a1a5a'); P.rect(c, 66, 307, 20, 6, '#a84ab8'); P.rect(c, 66, 307, 20, 1, '#c86ad8');
      } },
      { y: 345, draw: c => {                                       // лежанка: задній борт + подушка
        [[58, 340, 44], [54, 342, 52], [52, 344, 56]].forEach(([x, y, w]) => P.rect(c, x, y, w, 2, '#7a4aa8'));
        P.rect(c, 56, 346, 48, 5, '#3a1a5a');
      } },
      { y: 351, draw: c => { P.rect(c, 52, 349, 56, 4, '#5a2a7a'); P.rect(c, 54, 353, 52, 2, '#3a1a5a'); P.rect(c, 52, 349, 56, 1, '#a84ab8'); } }, // передній борт
      { y: s.bowl[1], draw: c => P.depth(c, s.bowl[0] + 13, s.bowl[1], () => {     // миски
        const [bx, by] = s.bowl, [wx, wy] = s.water;
        P.rect(c, bx - 9, by - 5, 18, 5, '#d93a4a'); P.rect(c, bx - 10, by - 6, 20, 2, '#ff6a7a');
        if (s.food > .05) for (let i = 0; i < 7 * s.food; i++) P.rect(c, bx - 7 + (i * 5) % 14, by - 7 - (i > 3 ? 1 : 0), 2, 2, '#9a5a22');
        P.rect(c, wx - 9, wy - 5, 18, 5, '#2a6aff'); P.rect(c, wx - 10, wy - 6, 20, 2, '#5a9aff'); P.rect(c, wx - 7, wy - 6, 14, 1, '#9ad8ff');
      }) },
      { y: s.ball.y, draw: c => { const { x, y } = s.ball; P.depth(c, x, y, () => { P.rect(c, x - 3, y - 6, 6, 6, '#ff4f9a'); P.rect(c, x - 2, y - 6, 2, 2, '#ffb0d0'); P.rect(c, x - 3, y - 3, 6, 1, '#ffe27a'); }); } },
    ];
  },
});

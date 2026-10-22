/* ============================================================================
 * objects/portal.js — ПОРТАЛ (вихор + пульт керування)
 * ----------------------------------------------------------------------------
 * Вихор порталу крутиться завжди. Пульт стоїть зліва від порталу.
 * Коли this.active: вихор розкручується, з'являється стовп світла, Nexi
 * заходить усередину (зменшується, зникає) і повертається (activities.js).
 * ========================================================================== */
NX.addObject({
  id: 'portal', name: 'Портал', act: 'portal',
  hit: { x: 1335, y: 95, w: 170, h: 255 }, active: false, flare: 0,
  update(dt) { this.flare += ((this.active ? 1 : 0) - this.flare) * Math.min(1, dt * 3); },
  drawBack(c, t) {
    const P = NX.px, cx = 1428, cy = 248, f = this.flare;
    c.save(); c.globalCompositeOperation = 'lighter';
    for (let r = 0; r < 4; r++) {
      c.strokeStyle = r % 2 ? 'rgba(59,232,255,.75)' : 'rgba(217,75,255,.85)'; c.lineWidth = 2.5;
      const a0 = t * (1.2 + f * 4) * (r % 2 ? 1 : -1) + r; c.beginPath(); c.ellipse(cx, cy, 58 - r * 12, 72 - r * 14, 0, a0, a0 + 2.2); c.stroke();
    }
    if (f > .05) { const g = c.createLinearGradient(0, cy - 120, 0, 350); g.addColorStop(0, 'rgba(217,75,255,0)'); g.addColorStop(1, `rgba(217,75,255,${.35 * f})`); c.fillStyle = g; c.fillRect(cx - 45, cy - 120, 90, 350 - cy + 120); }
    c.restore();
    P.glow(c, cx, cy, 60 + f * 30, 'rgba(217,75,255,.7)', .3 + .2 * Math.sin(t * 2) + f * .4);
  },
  layers(t) {
    return [{ y: 338, draw: c => {                                       // пульт керування порталом
      const P = NX.px, on = this.active;
      P.cube(c, 1366, 338, 36, 58, 6, '#1c1440', '#2e2266', '#120c2c');
      P.rect(c, 1371, 286, 26, 17, '#06061e'); c.strokeStyle = on ? '#ff4fd8' : '#7a3a9a'; c.lineWidth = 1; c.strokeRect(1371.5, 286.5, 25, 16);
      c.beginPath(); c.ellipse(1384, 294.5, 6, 6, 0, t * 3, t * 3 + 4.5); c.stroke();
      [0, 1, 2].forEach(i => P.rect(c, 1372 + i * 9, 308, 6, 4, on && Math.floor(t * 5) % 3 === i ? '#3be8ff' : '#3a2a6a'));
      P.rect(c, 1372, 316, 24, 2, '#d94bff'); P.rect(c, 1382, 274, 4, 6, '#5a6590'); P.rect(c, 1381, 271, 6, 3, Math.sin(t * 6) > 0 ? '#ff4fd8' : '#7a3a9a');
      P.glow(c, 1384, 294, 22, 'rgba(217,75,255,.6)', on ? .7 : .35);
    } }];
  },
});

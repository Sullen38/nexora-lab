/* ============================================================================
 * objects/vacuum.js — РОБОПИЛОСОС "NEXI-MINI" (нове! в стилі кімнати)
 * ----------------------------------------------------------------------------
 * Кругла неонова "шайба" сама їздить по передній підлозі, об'їжджає краї,
 * лишає блискучий чистий слід. Рудик іноді застрибує й катається (board()).
 * Тап по пилососу -> Рудик біжить кататись. Відображається в глянці підлоги.
 * ========================================================================== */
NX.addObject({
  id: 'vacuum', name: 'obj.vacuum', act: 'vacuum', x: 300, y: 470, vx: 26, vy: 9, trail: [],
  get hit() { const k = NX.px.depthK(this.y); return { x: this.x - 16 * k, y: this.y - 12 * k, w: 32 * k, h: 14 * k }; },
  onTap() { NX.cat.goTo(this.x - 14, this.y, () => this.board(), null, true); NX.fx.emit('note', NX.cat.x, NX.cat.y - 24); return true; },
  board() { const c = NX.cat; c.startJump(this.x, this.y, () => { c.riding = true; c.rideT = 6 + Math.random() * 6; for (let i = 0; i < 3; i++) setTimeout(() => NX.fx.emit('heart', c.x, c.y - 26), i * 400); }); },
  update(dt, t) {
    const B = NX.room.walkBounds(), top = 384, bot = B.maxY - 6;
    this.x += this.vx * dt; this.y += this.vy * dt;
    if (this.x < 60 || this.x > NX.cfg.ROOM_W - 60) { this.vx *= -1; this.vy += (Math.random() - .5) * 14; }
    if (this.y < top || this.y > bot) this.vy *= -1;
    if (Math.random() < dt * .3) { const a = Math.random() * 6.28, sp = 22 + Math.random() * 10; this.vx = Math.cos(a) * sp; this.vy = Math.sin(a) * sp * .45; }
    this.x = NX.px.clamp(this.x, 60, NX.cfg.ROOM_W - 60); this.y = NX.px.clamp(this.y, top, bot);
    this.trail.push([this.x, this.y, t]); while (this.trail.length && t - this.trail[0][2] > 2.5) this.trail.shift();
  },
  drawBack(c, t) {        // блискучий чистий слід на підлозі
    this.trail.forEach(([x, y, tt], i) => { if (i % 3) return; const a = 1 - (t - tt) / 2.5; c.fillStyle = `rgba(160,240,255,${.12 * a})`; c.fillRect(x - 10, y - 1, 20, 2); if (i % 12 === 0 && Math.sin(tt * 9) > .6) NX.px.rect(c, x + 6, y - 2, 1.5, 1.5, `rgba(255,255,255,${a})`); });
  },
  layers(t) {
    const P = NX.px, x = this.x, y = this.y;
    return [{ y, refl: true, draw: c => P.depth(c, x, y, () => {
      c.fillStyle = 'rgba(0,0,0,.4)'; c.beginPath(); c.ellipse(x, y + 1, 15, 3.5, 0, 0, 7); c.fill();
      c.fillStyle = '#1b1244'; c.beginPath(); c.ellipse(x, y - 2, 14, 4, 0, 0, Math.PI); c.fill(); P.rect(c, x - 14, y - 6, 28, 4, '#2a1c60');
      c.fillStyle = '#4b32a0'; c.beginPath(); c.ellipse(x, y - 6, 14, 4, 0, 0, 7); c.fill();
      c.fillStyle = '#5d44c0'; c.beginPath(); c.ellipse(x - 2, y - 7, 8, 2, 0, 0, 7); c.fill();
      c.save(); c.strokeStyle = Math.sin(t * 3) > 0 ? '#3be8ff' : '#ff4fd8'; c.lineWidth = 1; c.shadowColor = c.strokeStyle; c.shadowBlur = 5; c.beginPath(); c.ellipse(x, y - 4, 14, 4, 0, 0, Math.PI); c.stroke(); c.restore();
      P.rect(c, x + (this.vx > 0 ? 7 : -9), y - 7, 2, 1.5, '#3bff8a'); P.rect(c, x - 2, y - 9, 4, 2, '#3be8ff');
      const br = Math.floor(t * 12) % 2; P.rect(c, x + (this.vx > 0 ? 12 : -14), y - 1, 2, 1, br ? '#c3cbea' : '#5a6590');
      P.glow(c, x, y - 2, 18, 'rgba(59,232,255,.5)', .4);
    }) }];
  },
});

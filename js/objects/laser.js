/* ============================================================================
 * objects/laser.js — ЛАЗЕРНА УКАЗКА + СЕЛФІ-СПАЛАХ (нові фішки)
 * ----------------------------------------------------------------------------
 * laser: Nexi світить червоною точкою по підлозі, точка бігає "вісімкою",
 *        Рудик ганяється за нею і стрибає (сценарій 'laser' в activities.js).
 * flash: білий спалах камери, коли Nexi робить селфі з Рудиком ('selfie').
 * ========================================================================== */
NX.addObject({
  id: 'laser', on: false, t: 0, dot: [600, 430], flash: 0,
  start() { this.on = true; this.t = 0; },
  stop() { this.on = false; },
  update(dt) {
    this.flash = Math.max(0, this.flash - dt * 3);
    if (!this.on) return; this.t += dt;
    const n = NX.nexi, a = this.t * 1.6, F = NX.cam.front;
    this.dot = NX.room.clampWalk(n.x + Math.sin(a) * 160, 400 + (Math.sin(a * 2) * .5 + .5) * Math.min(150, F * .5));
    const c = NX.cat; if (!c.riding && (this.t * 10 | 0) % 4 === 0 && c.mode !== 'jump') c.goTo(this.dot[0] - 6 * c.dir, this.dot[1], () => c.set('pounce', .4), null, true);
  },
  layers(t) {
    const L = [];
    if (this.on) L.push({ y: 1e5 - 1, draw: c => {
      const n = NX.nexi, [dx, dy] = this.dot, hx = n.x + 14 * n.dir, hy = n.y - 26;
      c.save(); c.globalCompositeOperation = 'lighter'; c.strokeStyle = 'rgba(255,40,60,.35)'; c.lineWidth = 1; c.beginPath(); c.moveTo(hx, hy); c.lineTo(dx, dy); c.stroke(); c.restore();
      NX.px.glow(c, dx, dy, 10, 'rgba(255,40,60,.9)', .9); NX.px.rect(c, dx - 1.5, dy - 1.5, 3, 3, '#ff3b4a'); NX.px.rect(c, dx - .5, dy - .5, 1, 1, '#ffffff');
    } });
    if (this.flash > 0) L.push({ y: 1e5, draw: c => { c.save(); c.globalAlpha = this.flash * .8; c.fillStyle = '#ffffff'; c.fillRect(NX.cam.x - 10, -NX.cam.top - 10, NX.cam.viewW + 20, 2000); c.restore(); } });
    return L;
  },
});

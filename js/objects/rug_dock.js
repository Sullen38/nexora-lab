/* ============================================================================
 * objects/rug_dock.js — КИЛИМ І ДОК-СТАНЦІЯ NEXI (дім, де він заряджається)
 * ----------------------------------------------------------------------------
 * Круглий неоновий килим на передній підлозі. У центрі — док зарядки:
 * сюди Nexi повертається за командою "Головна" і заряджається.
 * this.home — координати доку (перераховуються під висоту екрана).
 * ========================================================================== */
NX.addObject({
  id: 'rug', name: 'Док-станція', act: 'home',
  home: [768, 440], rx: 150, ry: 26,
  get hit() { return { x: this.home[0] - 40, y: this.home[1] - 14, w: 80, h: 22 }; },
  layout() { const F = NX.cam.front; this.home = [768, Math.round(368 + Math.max(50, F * .42))]; this.ry = Math.max(16, Math.min(34, F * .1)); },
  drawBack(c, t) {
    const P = NX.px, [x, y] = this.home, k = P.depthK(y), RX = this.rx * k, RY = this.ry * k;
    const rings = ['#2a1458', '#3a1a6a', '#2a1458', '#1d2a6a'];
    rings.forEach((col, i) => { c.fillStyle = col; c.beginPath(); c.ellipse(x, y, RX - i * 28 * k, RY - i * RY / 5.5, 0, 0, Math.PI * 2); c.fill(); });
    c.strokeStyle = 'rgba(217,75,255,.6)'; c.lineWidth = 1.5; c.setLineDash([4, 4]); c.lineDashOffset = -t * 6;
    c.beginPath(); c.ellipse(x, y, RX - 6 * k, RY - 1.5, 0, 0, Math.PI * 2); c.stroke(); c.setLineDash([]);
    const charging = NX.nexi.loc === 'dock';
    c.strokeStyle = charging ? '#3bff8a' : '#3be8ff'; c.lineWidth = 2; c.beginPath(); c.ellipse(x, y, 22 * k, 5 * k, 0, 0, Math.PI * 2); c.stroke();
    P.glow(c, x, y, 34 * k, charging ? 'rgba(59,255,138,.6)' : 'rgba(59,232,255,.5)', .45 + .2 * Math.sin(t * 3));
  },
});

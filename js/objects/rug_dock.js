/* ============================================================================
 * objects/rug_dock.js — КИЛИМ І ДОК-СТАНЦІЯ NEXI (дім, де він заряджається)
 * ----------------------------------------------------------------------------
 * Круглий неоновий килим на передній підлозі. this.center — центр кіл (під висоту екрана).
 * 13.11 (власник, скрін зі стрілкою вниз: «змісти ці кола трохи нижче і зроби живий острівець по розмірах синього кола… по
 * центру — сакура… щоб Nexi не ходив поверх нього» — зроблено в чаті «Робочі зони» за прямим словом власника): кола на 18 од.
 * нижче; внутрішнє синє коло зайняв острівець із сакурою (js/garden/sakura_lift.js), тож док зарядки — this.home — тепер на
 * килимі праворуч від острівця: сюди Nexi повертається за командою "Головна" і заряджається (без кільця — лише сяйво).
 * ========================================================================== */
NX.addObject({
  id: 'rug', name: 'obj.rug', act: 'home',
  center: [768, 458], home: [826, 474], rx: 150, ry: 26,
  get hit() { return { x: this.home[0] - 40, y: this.home[1] - 14, w: 80, h: 22 }; },
  layout() { const F = NX.cam.front, y = Math.round(368 + Math.max(50, F * .42)) + 18, k = NX.px.depthK(y); this.ry = Math.max(16, Math.min(34, F * .1)); this.center = [768, y]; this.home = [Math.round(768 + 92 * k), Math.round(y + this.ry * k * .3)]; },
  drawBack(c, t) {
    const P = NX.px, [x, y] = this.center, k = P.depthK(y), RX = this.rx * k, RY = this.ry * k, [hx, hy] = this.home, hk = P.depthK(hy);
    const rings = ['#2a1458', '#3a1a6a', '#2a1458', '#1d2a6a'];
    rings.forEach((col, i) => { c.fillStyle = col; c.beginPath(); c.ellipse(x, y, RX - i * 28 * k, RY - i * RY / 5.5, 0, 0, Math.PI * 2); c.fill(); });
    c.strokeStyle = 'rgba(217,75,255,.6)'; c.lineWidth = 1.5; c.setLineDash([4, 4]); c.lineDashOffset = -t * 6;
    c.beginPath(); c.ellipse(x, y, RX - 6 * k, RY - 1.5, 0, 0, Math.PI * 2); c.stroke(); c.setLineDash([]);
    if (NX.nexi.loc === 'dock') P.glow(c, hx, hy, 34 * hk, 'rgba(59,255,138,.6)', .35 + .15 * Math.sin(t * 3));   // кільця доку немає (власник, 13.11: «що за коло… не хочу») — лише м'яке сяйво під Nexi, поки заряджається
  },
});

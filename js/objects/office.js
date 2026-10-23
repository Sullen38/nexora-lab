/* ============================================================================
 * objects/office.js — ЖИВІ КРІСЛА + ЕКРАНИ АНАЛІТИКИ Й МАРКЕТИНГУ
 * ----------------------------------------------------------------------------
 * Крісла ВИРІЗАНІ з самої картинки (assets/chair1.png, chair2.png) і стали
 * окремими об'єктами, а місце за ними на фоні заповнене. Тому крісло "живе":
 *   - коли Nexi підходить, крісло від'їжджає від столу (off -> OUT)
 *   - Nexi застрибує на сидіння, крісло під'їжджає назад РАЗОМ з ним
 *   - поки він працює, крісло трохи крутиться-гойдається
 *   - коли встає, крісло ще мить котиться і зупиняється
 * Nexi сидить на сидінні (POI.*.chair) і малюється поверх крісла.
 * ========================================================================== */
(() => {
  const P = NX.px;
  function makeChair(id, src, x, y, seat, accent) {
    const img = new Image(); img.src = (window.NX_ASSETS && NX_ASSETS[src]) || 'assets/' + src;
    return NX.addObject({
      id: id + 'Chair', img, x, y, seat, off: 0, target: 0, wob: 0, OUT: -16,
      /** Відкотити (-16) / підкотити (0) крісло. */
      roll(to) { this.target = to; },
      update(dt, t) {
        const v = (this.target - this.off) * Math.min(1, dt * 6); this.off += v;
        const n = NX.nexi, sitting = n.seat === this; this.wob = sitting && n.cur && n.cur.work ? Math.sin(t * 2.2) * .6 : this.wob * .9;
        if (sitting) { n.x = this.x + this.seat[0] + this.off; n.y = this.y + this.seat[1]; n.gy = 362; }
        if (Math.abs(v) > .05 && Math.random() < .3) NX.fx.emit('dust', this.x + 30 + this.off, this.y + 88);
      },
      layers(t) {
        const X = this.x + this.off, Y = this.y;
        return [{ y: Y + this.seat[1] - .5, draw: c => {
          c.save(); c.imageSmoothingEnabled = false;
          c.translate(X + this.img.width / 2, Y + this.img.height); c.scale(1 + this.wob * .03, 1); c.translate(-this.img.width / 2, -this.img.height);
          if (this.img.complete) c.drawImage(this.img, 0, 0); c.restore();
        } }];
      },
    });
  }
  // [вирізаний шматок картинки: лівий верх], [сидіння відносно нього]
  NX.chairA = makeChair('analytics', 'chair1.png', 383, 252, [30, 62], '#3be8ff');
  NX.chairM = makeChair('marketing', 'chair2.png', 588, 262, [30, 44], '#d94bff');

  NX.addObject({
    id: 'analytics', name: 'obj.analytics', act: 'analytics', active: false, prog: 0, hit: { x: 330, y: 150, w: 140, h: 200 },
    drawBack(c, t) {
      if (!this.active) return; c.save(); c.globalCompositeOperation = 'lighter';
      [8, 14, 11, 18, 15].forEach((h, i) => { const hh = h * (.6 + .4 * Math.abs(Math.sin(t * 1.6 + i))) + this.prog * 10; P.rect(c, 350 + i * 7, 246 - hh, 5, hh, i === Math.floor(t * 1.5) % 5 ? '#ffc94d' : '#3be8ff'); });
      for (let i = 0; i < 6; i++) P.stair(c, 398 + i * 7, 230 - Math.sin(i + t) * 8 - i * 2, 405 + i * 7, 230 - Math.sin(i + 1 + t) * 8 - (i + 1) * 2, '#ff7af0', 1.5);
      P.text(c, '+' + (12 + Math.floor(this.prog * 30)) + '%', 400, 212, '#ffe27a', 5); c.restore();
    },
  });
  NX.addObject({
    id: 'marketing', name: 'obj.marketing', act: 'marketing', active: false, prog: 0, hit: { x: 535, y: 165, w: 115, h: 185 },
    drawBack(c, t) {
      if (!this.active) return; c.save(); c.globalCompositeOperation = 'lighter';
      for (let i = 0; i < 4; i++) { const ph = (t * .5 + i / 4) % 1, x = 552 + i * 22, y = 252 - ph * 40; c.globalAlpha = 1 - ph; P.rect(c, x, y, 14, 9, '#e9eefc'); P.rect(c, x + 4, y + 2, 2, 2, '#ff4f9a'); P.rect(c, x + 7, y + 2, 2, 2, '#ff4f9a'); P.rect(c, x + 4, y + 4, 5, 2, '#ff4f9a'); }
      c.globalAlpha = 1; P.text(c, '♥ ' + (1200 + Math.floor(this.prog * 3400)), 560, 212, '#ff7af0', 5); c.restore();
    },
  });
})();

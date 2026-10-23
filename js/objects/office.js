/* ============================================================================
 * objects/office.js — ЖИВІ КРІСЛА + ЕКРАНИ АНАЛІТИКИ Й МАРКЕТИНГУ
 * ----------------------------------------------------------------------------
 * Крісла ВИРІЗАНІ з самої картинки (assets/chair1.png, chair2.png) і стали
 * окремими об'єктами, а місце за ними на фоні заповнене. Тому крісло "живе":
 *   - коли Nexi підходить, крісло від'їжджає від столу (off -> OUT)
 *   - Nexi застрибує на сидіння, крісло під'їжджає назад РАЗОМ з ним
 *   - поки він працює, крісло трохи крутиться-гойдається
 *   - коли встає, крісло ще мить котиться і зупиняється
 *   - неонова LED-стрічка по краю спинки з бігучим вогником; коли Nexi сидить —
 *     RGB-режим; підсвітка під кріслом на підлозі; оберт навколо осі при відкочуванні
 * Nexi сидить на сидінні і малюється поверх крісла.
 * ========================================================================== */
(() => {
  const P = NX.px;
  // LED-стрічка по краю спинки (координати всередині вирізаного крісла) і де світить підсвітка на підлозі
  const LED = { analytics: [[44, 4], [53, 3], [79, 5], [85, 12], [79, 54]], marketing: [[39, 5], [60, 7], [63, 14], [58, 38]] };
  const GLOW = { analytics: [423, 341], marketing: [618, 333] };
  function makeChair(id, src, x, y, seat, accent) {
    const img = new Image(); img.src = (window.NX_ASSETS && NX_ASSETS[src]) || 'assets/' + src;
    return NX.addObject({
      id: id + 'Chair', img, x, y, seat, off: 0, target: 0, wob: 0, OUT: -16, spin: 0, accent, led: LED[id], glowAt: GLOW[id],
      /** Відкотити (-16) / підкотити (0) крісло; при відкочуванні — ефектний оберт. */
      roll(to) { if (to !== this.target && to === this.OUT) this.spin = 1; this.target = to; },
      update(dt, t) {
        const v = (this.target - this.off) * Math.min(1, dt * 6); this.off += v;
        const n = NX.nexi, sitting = n.seat === this; this.wob = sitting && n.cur && n.cur.work ? Math.sin(t * 2.2) * .6 : this.wob * .9;
        if (sitting) { n.x = this.x + this.seat[0] + this.off; n.y = this.y + this.seat[1]; n.gy = 362; }
        if (Math.abs(v) > .05 && Math.random() < .3) NX.fx.emit('dust', this.x + 30 + this.off, this.y + 88);
        this.spin = Math.max(0, this.spin - dt * 1.4);
      },
      layers(t) {
        const X = this.x + this.off, Y = this.y;
        return [{ y: Y + this.seat[1] - .5, draw: c => {
          c.save(); c.imageSmoothingEnabled = false;
          const iw = this.img.naturalWidth / 2, ih = this.img.naturalHeight / 2;   // PNG крісла в 2× роздільності
          const sit = NX.nexi.seat === this, col = sit ? `hsl(${(t * 120) % 360} 95% 62%)` : this.accent;   // з Nexi — RGB-режим
          const [gx, gy] = this.glowAt; P.glow(c, X - this.x + gx, gy, 30, sit ? 'rgba(255,120,240,.7)' : 'rgba(59,232,255,.5)', .45 + .2 * Math.sin(t * 3));   // підсвітка під кріслом
          c.restore(); c.save(); c.imageSmoothingEnabled = false;
          const sx = this.spin > 0 ? Math.cos(this.spin * Math.PI * 4) : 1;                                                 // оберт навколо осі
          c.translate(X + iw / 2, Y + ih); c.scale((1 + this.wob * .03) * (Math.abs(sx) < .15 ? .15 * Math.sign(sx || 1) : sx), 1); c.translate(-iw / 2, -ih);
          if (this.img.complete) c.drawImage(this.img, 0, 0, iw, ih);
          c.globalCompositeOperation = 'lighter'; c.strokeStyle = col; c.lineWidth = 1.2; c.shadowColor = col; c.shadowBlur = 6; c.beginPath();   // LED-стрічка по краю спинки
          this.led.forEach(([lx, ly], i) => i ? c.lineTo(lx, ly) : c.moveTo(lx, ly)); c.stroke();
          const q = (t * .8) % 1, k2 = Math.floor(q * (this.led.length - 1)), f2 = q * (this.led.length - 1) - k2, A = this.led[k2], B = this.led[k2 + 1];
          c.fillStyle = '#ffffff'; c.fillRect(A[0] + (B[0] - A[0]) * f2 - 1, A[1] + (B[1] - A[1]) * f2 - 1, 2, 2); c.restore();
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

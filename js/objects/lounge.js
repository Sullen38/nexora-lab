/* ============================================================================
 * objects/lounge.js — ЗОНА ВІДПОЧИНКУ: ПУФ, СТОЛИК З ЛАМПОЮ, ТОРШЕР
 * ----------------------------------------------------------------------------
 * Пуф: Nexi сідає й читає (сценарій 'beanbag'), кіт іноді спить на ньому.
 * Торшер праворуч — окремий об'єкт: тап -> Nexi підходить і вмикає/вимикає світло.
 * ========================================================================== */
NX.addObject({
  id: 'lounge', name: 'obj.lounge', act: 'beanbag', pos: [470, 470],
  get hit() { const [x, y] = this.pos, k = NX.px.depthK(y); return { x: x - 26 * k, y: y - 32 * k, w: 52 * k, h: 34 * k }; },
  layout() { const F = NX.cam.front; this.pos = [470, Math.round(368 + Math.max(64, F * .5))]; },
  layers(t) {
    const P = NX.px, [x, y] = this.pos;
    return [
      { y: y - 40, refl: true, draw: c => P.depth(c, x, y, () => {                                // пуф-груша (y-40: Nexi, що сидить зверху, малюється поверх) (малюємо рядками по 2px — кругла форма)
        for (let r = 0; r < 34; r += 2) {
          const k = r / 34, w = 2 * Math.round((10 + 14 * Math.sin(Math.min(1, k * 1.15) * Math.PI * .62 + .25)) / 2) * (k > .85 ? 1 - (k - .85) * 1.5 : 1);
          P.rect(c, x - w, y - 34 + r, w * 2, 2, P.shade('#d94bff', .25 - k * .55));
        }
        P.rect(c, x - 6, y - 29, 6, 3, '#ffb0fa'); P.rect(c, x - 14, y - 12, 28, 1, '#9a2ab8');           // відблиск і шов
        c.fillStyle = 'rgba(0,0,0,.35)'; c.beginPath(); c.ellipse(x, y, 26, 4, 0, 0, 7); c.fill();
        P.cube(c, x + 30, y + 2, 20, 14, 8, '#2a1c60', '#4b32a0', '#1b1244');                               // столик з лампою
        P.rect(c, x + 36, y - 22, 2, 8, '#5a6590'); P.rect(c, x + 31, y - 28, 12, 6, '#ffc94d'); P.glow(c, x + 37, y - 22, 28, 'rgba(255,201,77,.5)', .5 + .1 * Math.sin(t * 2));
      }) },
    ];
  },
});

NX.addObject({
  id: 'lamp', name: 'obj.lamp', act: 'lamp', pos: [1290, 440], on: true,
  get hit() { const [x, y] = this.pos, k = NX.px.depthK(y); return { x: x - 14 * k, y: y - 86 * k, w: 28 * k, h: 88 * k }; },
  layout() { const F = NX.cam.front; this.pos = [1290, Math.round(368 + Math.max(40, F * .3))]; },
  toggle() { this.on = !this.on; for (let i = 0; i < 8; i++) NX.fx.emit('spark', this.pos[0], this.pos[1] - 80 * NX.px.depthK(this.pos[1])); },
  layers(t) {
    const P = NX.px, [lx, ly] = this.pos;
    return [{ y: ly, refl: true, draw: c => P.depth(c, lx, ly, () => {
      P.rect(c, lx - 8, ly - 2, 16, 2, '#2a2f5e'); P.rect(c, lx - 1, ly - 70, 2, 68, '#5a6590'); P.rect(c, lx + 1, ly - 40, 3, 2, '#3a4070');
      P.rect(c, lx - 10, ly - 82, 20, 12, this.on ? '#ff9a3a' : '#6a4a3a'); P.rect(c, lx - 10, ly - 82, 20, 2, this.on ? '#ffc94d' : '#8a6a5a'); P.rect(c, lx - 10, ly - 71, 20, 1, '#3a2a1a');
      if (this.on) { P.glow(c, lx, ly - 70, 70, 'rgba(255,170,80,.5)', .6 + .08 * Math.sin(t * 1.3)); c.save(); c.globalCompositeOperation = 'lighter'; c.fillStyle = 'rgba(255,180,90,.08)'; c.beginPath(); c.moveTo(lx - 10, ly - 70); c.lineTo(lx + 10, ly - 70); c.lineTo(lx + 40, ly); c.lineTo(lx - 40, ly); c.fill(); c.restore(); }
    }) }];
  },
});

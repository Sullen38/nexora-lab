/* ============================================================================
 * objects/workshop.js — МАЙСТЕРНЯ (сканер скінів на платформі)
 * ----------------------------------------------------------------------------
 * Коли платформа порожня — над нею крутиться голограма Nexi в поточному скіні
 * (обертання імітуємо стисканням по ширині — "3D" у 8-bit).
 * Коли Nexi стоїть на платформі (this.active) — кільце сканера їздить
 * уздовж нього, летять іскри, і відкривається Лабораторія скінів.
 * ========================================================================== */
NX.addObject({
  id: 'workshop', name: 'Майстерня', act: 'workshop',
  hit: { x: 930, y: 170, w: 170, h: 165 }, active: false, cv: document.createElement('canvas'),
  drawBack(c, t) {
    const P = NX.px, [px, py] = NX.cfg.POI.workshop.pad;
    c.save(); c.globalCompositeOperation = 'lighter';
    const g = c.createLinearGradient(0, py - 70, 0, py); g.addColorStop(0, 'rgba(217,75,255,0)'); g.addColorStop(1, `rgba(217,75,255,${this.active ? .55 : .35})`);
    c.fillStyle = g; c.fillRect(px - 27, py - 70, 54, 70); c.restore();
    if (!this.active) {                                    // обертова голограма поточного скіна
      renderBot(NX.nexi.look, poseFor('stand', t, false), t, this.cv);
      const tc = this.tint || (this.tint = document.createElement('canvas')); tc.width = 36; tc.height = 40; const tx = tc.getContext('2d');
      tx.drawImage(this.cv, 0, 0); tx.globalCompositeOperation = 'source-atop'; tx.fillStyle = 'rgba(80,220,255,.45)'; tx.fillRect(0, 0, 36, 40);  // голографічний відтінок лише на пікселях бота
      const sx = Math.cos(t * 1.4), w = 36 * 1.35 * Math.max(.08, Math.abs(sx)), h = 40 * 1.35;
      c.save(); c.globalAlpha = .7; c.imageSmoothingEnabled = false; c.translate(px, 0); c.scale(sx < 0 ? -1 : 1, 1); c.drawImage(tc, -w / 2, py - h + 3, w, h); c.restore();
      for (let i = 0; i < 3; i++) P.rect(c, px - 22, py - 60 + ((t * 20 + i * 20) % 60), 44, .7, 'rgba(160,240,255,.6)');
    }
    P.glow(c, px, py - 4, 34, 'rgba(217,75,255,.6)', .5);
  },
  layers(t) {
    if (!this.active) return [];
    const [px, py] = NX.cfg.POI.workshop.pad;
    return [{ y: py + .5, draw: c => {                       // кільце сканера перед Nexi
      const k = (Math.sin(t * 2.5) * .5 + .5), y = py - 4 - k * 52;
      c.save(); c.strokeStyle = '#3be8ff'; c.lineWidth = 1.5; c.shadowColor = '#3be8ff'; c.shadowBlur = 8;
      c.beginPath(); c.ellipse(px, y, 22, 5, 0, 0, Math.PI * 2); c.stroke(); c.restore();
      if (Math.random() < .3) NX.fx.emit('spark', px + (Math.random() - .5) * 40, y);
    } }];
  },
});

/* ============================================================================
 * objects/sofa.js — ДИВАН-ЛАУНЖ (диван намальований на картинці; тут — "життя")
 * ----------------------------------------------------------------------------
 * Тап по дивану -> меню: Новини / Кіно / Подрімати / Обійми з Рудиком.
 * Усе, що оживляє диван з картинки:
 *   - LED-стрічка на сидінні: бігучий вогник; RGB, коли хтось сидить;
 *     м'яко-синя "нічна", коли Nexi спить; спалах при приземленні
 *   - підсвітка підлоги під диваном
 *   - ЖИВІ ПОДУШКИ (вирізані з картинки, assets/pillow*.png): підстрибують,
 *     коли Nexi сідає; тап по подушці -> вона пухнасто "збивається" + пір'їнки
 *   - ТЕЛЕВІЗОР за диваном (екран з картинки): новини, 8-bit кіно, нічний режим
 *   - плед, коли Nexi спить
 * mode: 'idle' | 'read' | 'movie' | 'sleep' — обчислюється з того, що робить Nexi.
 * ========================================================================== */
(() => {
  const P = NX.px, TV = { x: 730, y: 231, w: 90, h: 25 }, STRIP = { x0: 731, x1: 818, y: 333 };
  const img = src => { const i = new Image(); i.src = (window.NX_ASSETS && NX_ASSETS[src]) || 'assets/' + src; return i; };
  // подушки: [картинка, лівий верх у кімнаті, центр "пухкості"]
  const PILLOWS = [['pillowL1', 702, 270], ['pillowL2', 724, 294], ['pillowR1', 815, 270], ['pillowR2', 791, 294]].map(([n, x, y]) => ({ n, img: img(n + '.png'), x, y, puff: 0 }));

  const sofa = NX.addObject({
    id: 'sofa', name: 'obj.sofa', act: 'sofa', hit: { x: 680, y: 226, w: 190, h: 126 },
    mode: 'idle', flash: 0, waves: [], tick: 0,
    /** Хтось приземлився на диван у точці x: хвиля по подушках, пил, спалах LED. */
    land(x) { this.flash = 1; this.waves.push({ x, t: 0 }); PILLOWS.forEach(p => { if (Math.abs(p.x + 14 - x) < 60) p.puff = Math.max(p.puff, .6); }); for (let i = 0; i < 8; i++) NX.fx.emit('dust', x + (Math.random() - .5) * 30, 326); },
    update(dt, t) {
      const n = NX.nexi, id = n.task && n.task.id;
      this.mode = n.loc === 'sofaLie' ? 'sleep' : n.loc === 'sofaSit' ? (id === 'movie' ? 'movie' : 'read') : 'idle';
      this.flash = Math.max(0, this.flash - dt * 2); this.waves = this.waves.filter(w => (w.t += dt) < .7);
      PILLOWS.forEach(p => p.puff = Math.max(0, p.puff - dt * 1.6));
      if (this.mode === 'movie' && Math.random() < dt * 1.5) NX.fx.emit('spark', n.x + (Math.random() - .5) * 10, n.y - 34, { col: '#fff6d0', vx: (Math.random() - .5) * 30, vy: -40, g: 140, s: 2, ttl: .6 });   // попкорн
    },
    drawBack(c, t) {
      const m = this.mode, sit = m !== 'idle' || NX.cat.onSofa;
      // --- телевізор за диваном
      if (m !== 'idle') this.drawTV(c, t, m);
      else { c.save(); c.globalCompositeOperation = 'lighter'; P.rect(c, TV.x, TV.y + ((t * 8) % TV.h), TV.w, 1, 'rgba(122,240,255,.25)'); c.restore(); }
      // --- подушки (малюються поверх себе на картинці; масштаб >= 1, тому без "привидів")
      PILLOWS.forEach((p, i) => { if (!p.img.complete) return; const w = p.img.naturalWidth / 2, h = p.img.naturalHeight / 2, k = 1 + Math.sin(p.puff * Math.PI) * .18 + (m === 'sleep' ? Math.sin(t * 1.2 + i) * .01 : 0);
        c.save(); c.imageSmoothingEnabled = false; c.translate(p.x + w / 2, p.y + h); c.scale(k + (k - 1) * .3, k); c.drawImage(p.img, -w / 2, -h, w, h); c.restore(); });
      // --- LED-стрічка сидіння
      const col = m === 'sleep' ? 'rgba(90,140,255,' : sit ? null : 'rgba(217,75,255,', a = m === 'sleep' ? .35 + .1 * Math.sin(t) : .55 + .25 * Math.sin(t * 2.4) + this.flash * .5;
      c.save(); c.globalCompositeOperation = 'lighter';
      for (let x = STRIP.x0; x < STRIP.x1; x += 3) { const hue = (t * 140 + x * 2.4) % 360; c.fillStyle = col ? col + a + ')' : `hsla(${hue},95%,62%,${a})`; c.fillRect(x, STRIP.y - 1, 3, 2.5); }
      const run = STRIP.x0 + ((t * .6) % 1) * (STRIP.x1 - STRIP.x0); P.rect(c, run - 4, STRIP.y - 1, 8, 2.5, 'rgba(255,255,255,.9)'); P.glow(c, run, STRIP.y, 12, 'rgba(255,255,255,.7)', .6);
      [[723, 331], [826, 331]].forEach(([x, y]) => P.glow(c, x, y, 9, col ? col + '.9)' : `hsla(${(t * 140) % 360},95%,62%,.9)`, a));
      c.restore();
      // --- підсвітка підлоги + хвилі приземлення
      P.glow(c, 774, 352, 110, m === 'sleep' ? 'rgba(80,120,255,.6)' : 'rgba(217,75,255,.6)', .22 + .08 * Math.sin(t * 2) + this.flash * .3);
      this.waves.forEach(w => { c.save(); c.globalAlpha = 1 - w.t / .7; c.strokeStyle = '#ffb0fa'; c.lineWidth = 1.2; c.beginPath(); c.ellipse(w.x, 324, 8 + w.t * 60, 2 + w.t * 7, 0, 0, 7); c.stroke(); c.restore(); });
    },
    /** Телевізор: новини (коли Nexi читає), 8-bit кіно, нічний режим. */
    drawTV(c, t, m) {
      const { x, y, w, h } = TV; c.save(); c.beginPath(); c.rect(x, y, w, h); c.clip();
      P.rect(c, x, y, w, h, m === 'sleep' ? '#05061a' : '#06102e');
      if (m === 'read') {
        P.text(c, 'NEXORA NEWS', x + 3, y + 7, '#ff7af0', 4);
        [12, 18, 9, 22, 15, 26].forEach((v, i) => { const hh = v * (.7 + .3 * Math.sin(t * 2 + i)) * .5; P.rect(c, x + 60 + i * 5, y + 18 - hh, 3, hh, i === 5 ? '#3bff8a' : '#3be8ff'); });
        const msg = NX.t('sofa.news'), mw = msg.length * 4.2; c.font = '4px "Press Start 2P", monospace'; P.rect(c, x, y + h - 7, w, 7, '#1a0a3a');
        P.text(c, msg, x + w - ((t * 18) % (mw + w)), y + h - 2, '#ffe27a', 4);
      } else if (m === 'movie') {
        for (let i = 0; i < 24; i++) { const sx = x + ((P.hash(i) * w - t * (6 + P.hash(i + 9) * 18)) % w + w) % w; P.rect(c, x + (sx - x), y + P.hash(i + 3) * h, 1, 1, '#ffffff'); }
        const ph = (t / 6) % 1, sx = x - 10 + ph * (w + 20), sy = y + 9 + Math.sin(t * 3) * 3;                         // кораблик летить
        P.rect(c, sx, sy, 9, 3, '#e9eefc'); P.rect(c, sx + 3, sy - 2, 3, 2, '#3be8ff'); P.rect(c, sx - 3 + (Math.floor(t * 12) % 2), sy + 1, 3, 1, '#ff9a3a');
        const ax = x + w - 18 - ((t * 7) % (w - 10)); c.fillStyle = '#8a6a4a'; c.beginPath(); c.arc(ax, y + 16, 4, 0, 7); c.fill(); P.rect(c, ax - 2, y + 14, 2, 2, '#5a4a3a');   // астероїд
        if (ph > .82 && ph < .9) P.glow(c, sx + 9, sy, 14, 'rgba(255,200,90,.9)', 1);                                     // вибух!
        P.rect(c, x, y + h - 3, w * ph, 1.5, '#ff4fd8');                                                                  // прогрес фільму
      } else {
        c.fillStyle = '#e8ecff'; c.beginPath(); c.arc(x + w / 2, y + h / 2, 6, 0, 7); c.fill(); c.fillStyle = '#05061a'; c.beginPath(); c.arc(x + w / 2 + 3, y + h / 2 - 2, 5.5, 0, 7); c.fill();
        P.text(c, 'Zz', x + w / 2 + 8, y + 9 + Math.sin(t * 2) * 1.5, '#8a9aff', 4);
      }
      c.globalCompositeOperation = 'lighter'; for (let yy = y; yy < y + h; yy += 2) P.rect(c, x, yy, w, .5, 'rgba(255,255,255,.04)'); c.restore();
      P.glow(c, x + w / 2, y + h / 2, 50, m === 'movie' ? 'rgba(122,200,255,.6)' : 'rgba(217,75,255,.5)', m === 'sleep' ? .15 : .35 + .1 * Math.sin(t * 9));
    },
    layers(t) {
      if (NX.nexi.loc !== 'sofaLie') return [];
      return [{ y: 330, draw: c => {                                                    // плед поверх сплячого Nexi (дихає)
        const br = Math.sin(t * 1.3) * .6; P.rect(c, 760, 303 + br, 44, 13 - br, '#7a2a8a'); P.rect(c, 760, 303 + br, 44, 2, '#a84ab8');
        for (let i = 0; i < 5; i++) P.rect(c, 763 + i * 8, 308 + br, 4, 4, '#5a1a6a'); P.rect(c, 760, 315, 44, 1, '#4a1058');
      } }];
    },
  });
  // подушки як окремі тап-зони (менші за диван — мають пріоритет)
  PILLOWS.forEach(p => NX.addObject({ id: p.n, name: 'obj.pillow', act: 'pillow', get hit() { return { x: p.x + 2, y: p.y + 2, w: 26, h: 20 }; },
    onTap() { p.puff = 1; for (let i = 0; i < 6; i++) NX.fx.emit('spark', p.x + 14 + (Math.random() - .5) * 16, p.y + 8, { col: Math.random() < .5 ? '#7ad0a0' : '#ffe27a', vy: -30, g: 40, ttl: 1, s: 1.5 }); NX.nexi.emote('happy', 1.5); return true; } }));
})();

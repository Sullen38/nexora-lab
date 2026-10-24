/* ============================================================================
 * objects/sofa.js — ДИВАН-ЛАУНЖ (окремий спрайт, вирізаний з картинки)
 * ----------------------------------------------------------------------------
 * assets/sofa.png — диван з картинки, ідеально симетричний, збільшений
 * нейромережею до 4 px на одиницю (чіткий). Малюється БІЛЬШИМ (K = 1.22) і
 * трохи ближче до глядача — повністю накриває диван на фоні.
 * SP(x, y) переводить точку "старого" дивану на картинці в точку нового.
 *
 * Тап по дивану -> Nexi САМ вирішує, що робити (pick()):
 *   почитати новини · попрацювати з планшетом · подрімати · обійми з Рудиком ·
 *   пострибати як на батуті · збити подушки
 * "Життя" дивану: пружинить, коли на нього стрибають (squash), подушки
 * підстрибують, LED-стрічка на сидінні (RGB, коли хтось сидить; нічна,
 * коли Nexi спить), підсвітка підлоги, хвилі по сидінню, плед.
 * ========================================================================== */
(() => {
  const P = NX.px, K = 1.22, AX = 774, AY0 = 351, AY = 362;
  const SP = (x, y) => [AX + (x - AX) * K, AY + (y - AY0) * K];
  const img = src => { const i = new Image(); i.src = (window.NX_ASSETS && NX_ASSETS[src]) || 'assets/' + src; return i; };
  const SPR = { img: img('sofa.png'), x0: 678, y0: 256, w: 192, h: 96 };          // спрайт дивану (1x-бокс на картинці)
  const PILLOWS = [['pillowL1', 702, 270], ['pillowL2', 724, 294], ['pillowR1', 815, 270], ['pillowR2', 791, 294]].map(([n, x, y]) => ({ n, img: img(n + '.png'), x, y, puff: 0 }));
  const STRIP = { x0: 731, x1: 818, y: 333 };

  const sofa = NX.addObject({
    id: 'sofa', name: 'obj.sofa', act: 'sofa', SP, K,
    get hit() { const [x0, y0] = SP(678, 258), [x1, y1] = SP(870, 351); return { x: x0, y: y0, w: x1 - x0, h: y1 - y0 }; },
    mode: 'idle', flash: 0, waves: [], sq: 1, sqV: 0,
    /** Що Nexi зробить на дивані — вирішує сам (зважений рандом + контекст). */
    pick() {
      const n = NX.nexi, c = NX.cat, idle = NX.time - n.lastCmd, catNear = Math.abs(c.x - 774) < 360 && !c.riding;
      const pool = [['sofa', 2], ['sofaWork', 2], ['bounce', 2], ['fluff', 1.4], ['cuddle', catNear ? 2.4 : 1], ['sleep', idle > 40 ? 2 : .7]].filter(([id]) => !(n.task && n.task.id === id));
      let r = Math.random() * pool.reduce((s, p) => s + p[1], 0); for (const [id, w] of pool) { if ((r -= w) <= 0) return id; } return 'sofa';
    },
    onTap() { NX.nexi.do(this.pick()); return true; },
    /** Хтось приземлився: диван пружинить, подушки підстрибують, пил, спалах LED. */
    land(x, power = 1) {
      this.flash = 1; this.sqV -= .9 * power; const [, sy] = SP(0, 324); this.waves.push({ x, y: sy, t: 0 });
      PILLOWS.forEach(p => { if (Math.abs(SP(p.x + 14, 0)[0] - x) < 70) p.puff = Math.max(p.puff, .5 * power); });
      for (let i = 0; i < 8; i++) NX.fx.emit('dust', x + (Math.random() - .5) * 34, sy);
    },
    puffAll() { PILLOWS.forEach((p, i) => setTimeout(() => { p.puff = 1; this.feathers(p); }, i * 600)); },
    feathers(p) { const [x, y] = SP(p.x + 14, p.y + 8); for (let i = 0; i < 7; i++) NX.fx.emit('spark', x + (Math.random() - .5) * 18, y, { col: Math.random() < .5 ? '#9ae8c0' : '#ffe27a', vy: -30 - Math.random() * 20, g: 30, ttl: 1.2, s: 1.5 }); },
    update(dt) {
      const n = NX.nexi; this.mode = n.loc === 'sofaLie' ? 'sleep' : (n.loc === 'sofaSit' || n.loc === 'sofaStand') ? 'busy' : 'idle';
      this.flash = Math.max(0, this.flash - dt * 2); this.waves = this.waves.filter(w => (w.t += dt) < .7);
      PILLOWS.forEach(p => p.puff = Math.max(0, p.puff - dt * 1.6));
      this.sqV += ((1 - this.sq) * 160 - this.sqV * 9) * dt; this.sq += this.sqV * dt; this.sq = P.clamp(this.sq, .955, 1.03);   // пружина дивану
    },
    drawBack(c, t) {
      const m = this.mode, sit = m !== 'idle' || NX.cat.onSofa;
      // --- сам диван (пружинить по вертикалі від підлоги)
      if (SPR.img.complete) { const [x0, y0] = SP(SPR.x0, SPR.y0), w = SPR.w * K, h = SPR.h * K;
        c.save(); c.imageSmoothingEnabled = true; c.imageSmoothingQuality = 'high'; c.translate(AX, AY); c.scale(1 + (1 - this.sq) * .4, this.sq); c.translate(-AX, -AY);
        c.drawImage(SPR.img, x0, y0, w, h);
        // подушки "збиваються" (малюються поверх себе, масштаб >= 1)
        PILLOWS.forEach(p => { if (!p.img.complete || p.puff <= 0) return; const pw = p.img.naturalWidth / 4 * K, ph = p.img.naturalHeight / 4 * K, [px, py] = SP(p.x, p.y), k = 1 + Math.sin(p.puff * Math.PI) * .2;
          c.save(); c.translate(px + pw / 2, py + ph); c.scale(k * 1.05, k); c.drawImage(p.img, -pw / 2, -ph, pw, ph); c.restore(); });
        c.restore(); }
      // --- LED-стрічка сидіння
      const [sx0, sy] = SP(STRIP.x0, STRIP.y), [sx1] = SP(STRIP.x1, 0), col = m === 'sleep' ? 'rgba(90,140,255,' : sit ? null : 'rgba(217,75,255,', a = m === 'sleep' ? .35 + .1 * Math.sin(t) : .5 + .25 * Math.sin(t * 2.4) + this.flash * .5;
      c.save(); c.globalCompositeOperation = 'lighter';
      for (let x = sx0; x < sx1; x += 3) { const hue = (t * 140 + x * 2.4) % 360; c.fillStyle = col ? col + a + ')' : `hsla(${hue},95%,62%,${a})`; c.fillRect(x, sy - 1.5, 3, 3); }
      const run = sx0 + ((t * .6) % 1) * (sx1 - sx0); P.rect(c, run - 5, sy - 1.5, 10, 3, 'rgba(255,255,255,.9)'); P.glow(c, run, sy, 14, 'rgba(255,255,255,.7)', .6);
      [SP(723, 331), SP(826, 331)].forEach(([x, y]) => P.glow(c, x, y, 11, col ? col + '.9)' : `hsla(${(t * 140) % 360},95%,62%,.9)`, a));
      c.restore();
      // --- підсвітка підлоги + хвилі по сидінню
      P.glow(c, AX, AY, 135, m === 'sleep' ? 'rgba(80,120,255,.6)' : 'rgba(217,75,255,.6)', .22 + .08 * Math.sin(t * 2) + this.flash * .3);
      this.waves.forEach(w => { c.save(); c.globalAlpha = 1 - w.t / .7; c.strokeStyle = '#ffb0fa'; c.lineWidth = 1.3; c.beginPath(); c.ellipse(w.x, w.y, 9 + w.t * 70, 2 + w.t * 8, 0, 0, 7); c.stroke(); c.restore(); });
    },
    layers(t) {
      if (NX.nexi.loc !== 'sofaLie') return [];
      return [{ y: 1e4, draw: c => {                                                         // плед поверх сплячого Nexi (дихає)
        const [x, y] = SP(760, 303), w = 44 * K, br = Math.sin(t * 1.3) * .7; P.rect(c, x, y + br, w, 15 - br, '#7a2a8a'); P.rect(c, x, y + br, w, 2, '#a84ab8');
        for (let i = 0; i < 6; i++) P.rect(c, x + 4 + i * 9, y + 6 + br, 4, 4, '#5a1a6a'); P.rect(c, x, y + 15, w, 1, '#4a1058');
      } }];
    },
  });
  // подушки як тап-зони (менші за диван — мають пріоритет)
  PILLOWS.forEach(p => NX.addObject({ id: p.n, name: 'obj.pillow', act: 'pillow', get hit() { const [x, y] = SP(p.x + 2, p.y + 2); return { x, y, w: 26 * K, h: 20 * K }; },
    onTap() { p.puff = 1; sofa.feathers(p); NX.nexi.emote('happy', 1.5); return true; } }));
})();

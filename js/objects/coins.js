/* ============================================================================
 * objects/coins.js — МОНЕТКИ NEXORA (їх губить Лепрекон)
 * ----------------------------------------------------------------------------
 * drop(x, y) — монетка вилітає, підстрибує й лягає на підлогу, крутиться.
 * Nexi збирає монетки, коли проходить поруч (nexi.js), або тапом по монетці.
 * Рахунок — у верхньому меню (ui/hud.js), зберігається в цьому браузері.
 * ========================================================================== */
NX.addObject({
  id: 'coins', name: 'obj.coin', act: 'collect', list: [], total: 0,
  init() { try { this.total = +localStorage.getItem('nexi-coins') || 0; } catch (e) {} },
  get hit() { return null; },
  drop(x, y) { const [cx, cy] = NX.room.clampWalk(x, Math.max(y, 384)); this.list.push({ x: cx, y: cy, h: 14, vh: 60, vx: (Math.random() - .5) * 30, ph: Math.random() * 6 }); },
  at(x, y) { return this.list.find(c => Math.abs(c.x - x) < 9 && Math.abs(c.y - 3 - y) < 9); },
  take(coin) {
    this.list = this.list.filter(c => c !== coin); this.total++; try { localStorage.setItem('nexi-coins', this.total); } catch (e) {}
    for (let i = 0; i < 6; i++) NX.fx.emit('spark', coin.x, coin.y - 4, { col: '#ffd02a' }); NX.ui.hud.coins && NX.ui.hud.coins(this.total, true);
  },
  update(dt) {
    this.list.forEach(c => { if (c.h > 0 || c.vh > 0) { c.vh -= 260 * dt; c.h += c.vh * dt; c.x += c.vx * dt; if (c.h <= 0) { c.h = 0; c.vh = Math.abs(c.vh) > 25 ? -c.vh * .45 : 0; c.vx *= .5; } } });
    const n = NX.nexi; this.list.slice().forEach(c => { if (Math.hypot(c.x - n.x, (c.y - n.y) * 1.5) < 12 && n.alpha > .5 && n.y > 360) this.take(c); });
  },
  layers(t) {
    const P = NX.px;
    return this.list.map(c => ({ y: c.y, refl: true, draw: cx => P.depth(cx, c.x, c.y, () => {
      const w = Math.max(1, Math.abs(Math.cos(t * 3 + c.ph)) * 6), y = c.y - c.h - 6;
      cx.fillStyle = 'rgba(0,0,0,.35)'; cx.beginPath(); cx.ellipse(c.x, c.y, 4, 1.2, 0, 0, 7); cx.fill();
      P.rect(cx, c.x - w / 2, y, w, 6, '#ffc94d'); P.rect(cx, c.x - w / 2, y, w, 1, '#fff2a0'); P.rect(cx, c.x - w / 2, y + 5, w, 1, '#c98a1a');
      if (w > 3) P.rect(cx, c.x - .5, y + 2, 1, 2, '#c98a1a'); P.glow(cx, c.x, y + 3, 8, 'rgba(255,210,60,.8)', .4);
    }) }));
  },
});

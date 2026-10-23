/* ============================================================================
 * ui/input.js — ДОТИКИ ТА КЛІКИ ПО КІМНАТІ
 * ----------------------------------------------------------------------------
 * Пріоритет тапу: Nexi (відкрити скіни) -> кіт (погладити) -> об'єкт кімнати
 * (виконати його сценарій act) -> підлога (просто піти туди).
 * Наведення мишею підсвічує об'єкт і показує його назву.
 * ========================================================================== */
NX.input = {
  hover: null, ripples: [],
  objectAt(x, y) {
    let best = null, area = 1e9;
    Object.values(NX.objects).forEach(o => { const h = o.hit; if (!h || !o.act) return; if (x >= h.x && x <= h.x + h.w && y >= h.y && y <= h.y + h.h && h.w * h.h < area) { best = o; area = h.w * h.h; } });
    return best;
  },
  onTap(x, y) {
    NX.ui.hud.firstTouch();
    if (NX.nexi.hitTest(x, y)) { NX.nexi.lastCmd = NX.time; if (NX.nexi.loc === 'sofaLie') { NX.nexi.emote('surprise'); NX.nexi.do('home'); } else { NX.nexi.temp = 'wave'; NX.nexi.tempT = NX.time + 2; NX.ui.skinlab.show(); } return; }
    const gv = NX.visitors.hit(x, y); if (gv) { NX.visitors.tap(gv); return; }
    if (NX.cat.hitTest(x, y)) { NX.fx.emit('note', NX.cat.x, NX.cat.y - 24); NX.nexi.do('petCat'); return; }
    for (const ob of Object.values(NX.objects)) if (ob.tapFirst && ob.tapFirst(x, y)) return;   // напр. меню порталу
    const coin = NX.objects.coins.at(x, y); if (coin) { NX.nexi.do('collect'); return; }
    const o = this.objectAt(x, y); if (o) { if (o.onTap && o.onTap(x, y)) return; if (NX.ui.zones.has(o.act)) { const [sx, sy] = NX.cam.toScreen(x, y); NX.ui.zones.open(o.act, sx, sy); return; } NX.nexi.do(o.act); return; }
    if (y > NX.cfg.FLOOR_Y - 4) { this.ripples.push({ x, y: NX.room.clampWalk(x, y)[1], t: 0 }); NX.nexi.walkTo(x, y); }
  },
  onHover(x, y) {
    const n = NX.nexi.hitTest(x, y) ? 'nexi' : NX.cat.hitTest(x, y) ? 'cat' : null;
    this.hover = n || this.objectAt(x, y);
    NX.loop.canvas.style.cursor = this.hover ? 'pointer' : 'default';
  },
  drawHover(c, t) {
    const P = NX.px;
    this.ripples = this.ripples.filter(r => (r.t += 1 / 60) < .8);
    this.ripples.forEach(r => { c.save(); c.globalAlpha = 1 - r.t / .8; c.strokeStyle = '#3be8ff'; c.lineWidth = 1.5; c.beginPath(); c.ellipse(r.x, r.y, 6 + r.t * 30, 2 + r.t * 8, 0, 0, 7); c.stroke(); c.restore(); });
    const h = this.hover; if (!h || typeof h === 'string') { if (h) { const lbl = NX.t(h === 'nexi' ? 'obj.nexiTag' : 'obj.catTag'), x = h === 'nexi' ? NX.nexi.x : NX.cat.x, y = (h === 'nexi' ? NX.nexi.box[1] : NX.cat.y - 30) - 6; this.tag(c, lbl, x, y); } return; }
    const b = h.hit; c.save(); c.strokeStyle = '#3be8ff'; c.lineWidth = 1.5; c.shadowColor = '#3be8ff'; c.shadowBlur = 10; c.globalAlpha = .7 + .3 * Math.sin(t * 6); c.strokeRect(b.x, b.y, b.w, b.h); c.restore();
    this.tag(c, NX.t(h.name).toUpperCase(), b.x + b.w / 2, b.y - 4);
  },
  tag(c, s, x, y) { const P = NX.px; c.font = '5px "Press Start 2P", monospace'; const w = c.measureText(s).width + 8; P.rect(c, x - w / 2, y - 9, w, 11, '#050818ee'); c.strokeStyle = '#3be8ff'; c.lineWidth = .8; c.strokeRect(x - w / 2, y - 9, w, 11); P.text(c, s, x, y - 1, '#3be8ff', 5, 'center'); },
};

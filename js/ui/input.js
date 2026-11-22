/* ============================================================================
 * ui/input.js — ДОТИКИ ТА КЛІКИ ПО КІМНАТІ
 * ----------------------------------------------------------------------------
 * Пріоритет тапу: Nexi (помахає й щось скаже — nexi.hi; спить на дивані — прокинеться; скіни — лише в зоні СКІНИ, власник
 * 02.11) -> кіт (погладити) -> гість з порталу (репліка; actors/guests/guests.js) -> об'єкт кімнати
 * (виконати його сценарій act) -> підлога (просто піти туди).
 * Тап по Nexi, коту, зоні чи предмету й по підлозі — команда Nexi: камера телефона знову йде за ним, навіть якщо людина
 * гортала кімнату (core/camera.js: toNexi; власник 03.11); тапи по гостях і декору — ні, камера стоїть, де її лишили.
 * Наведення мишею підсвічує об'єкт і показує його назву.
 * УТРИМАННЯ ПАЛЬЦЯ НА NEXI (23.11, чат «Nexi», слово власника): якщо в руці реліквія — вона заряджається (actors/nexi/relics.js:
 * charge), і коли палець відпустити після ≥ 0,55 с — посилена здібність замість звичайного тапу (release). Повів пальцем чи
 * другий палець — скасовано. Викликає core/camera.js (pointerdown / move / up).
 * ========================================================================== */
NX.input = {
  hover: null, ripples: [], hold: false,
  onDown(x, y) { const N = NX.nexi, R = NX.objects.relics; this.hold = !!(R && R.charge && N.look.hand && N.loc !== 'sofaLie' && !NX.ui.skinlab.open && N.hitTest(x, y)); if (this.hold) R.charge(true); },
  onCancel() { if (this.hold) { this.hold = false; NX.objects.relics.charge(false); } },
  onUp(tap) { if (!this.hold) return false; this.hold = false; const ok = NX.objects.relics.release(tap); if (ok) { NX.ui.hud.firstTouch(); NX.cam.toNexi(); } return ok; },
  objectAt(x, y) {
    let best = null, area = 1e9;
    Object.values(NX.objects).forEach(o => { const h = o.hit; if (!h || !o.act) return; if (x >= h.x && x <= h.x + h.w && y >= h.y && y <= h.y + h.h && h.w * h.h < area) { best = o; area = h.w * h.h; } });
    return best;
  },
  onTap(x, y) {
    NX.ui.hud.firstTouch();
    if (NX.nexi.hitTest(x, y)) { NX.cam.toNexi(); if (NX.nexi.loc === 'sofaLie') { NX.nexi.lastCmd = NX.time; NX.nexi.emote('surprise'); NX.nexi.do('home'); } else NX.nexi.hi(); return; }
    if (NX.cat.hitTest(x, y)) { NX.fx.emit('note', NX.cat.x, NX.cat.y - 24); NX.nexi.do('petCat'); return; }
    if (NX.guests && NX.cards && NX.guests.plaqueHit(x, y)) { NX.cards.open('grid'); return; }   // табличка «ГОСТІ n/20» → сторінка карток
    const gst = NX.guests && NX.guests.hitTest(x, y); if (gst) { gst.tap(); return; }
    for (const ob of Object.values(NX.objects)) if (ob.tapFirst && ob.tapFirst(x, y)) return;   // об'єкт сам вирішує, що робити з тапом (напр. меню)
    const o = this.objectAt(x, y); if (o) { if (o.onTap && o.onTap(x, y)) return; if (NX.ui.zones.has(o.act)) { NX.nexi.do(o.act, true, { task: NX.ui.zones.pick(o.act) }); return; } NX.nexi.do(o.act); return; }
    if (y > NX.cfg.FLOOR_Y - 4) { this.ripples.push({ x, y: NX.room.clampWalk(x, y)[1], t: 0 }); NX.cam.toNexi(); NX.nexi.walkTo(x, y); }
  },
  onHover(x, y) {
    const n = NX.nexi.hitTest(x, y) ? 'nexi' : NX.cat.hitTest(x, y) ? 'cat' : null;
    this.hover = n || (NX.guests && NX.guests.hitTest(x, y)) || this.objectAt(x, y);   // гість — {box, name}
    NX.loop.canvas.style.cursor = this.hover ? 'pointer' : 'default';
  },
  drawHover(c, t) {
    const P = NX.px;
    this.ripples = this.ripples.filter(r => (r.t += 1 / 60) < .8);
    this.ripples.forEach(r => { c.save(); c.globalAlpha = 1 - r.t / .8; c.strokeStyle = '#3be8ff'; c.lineWidth = 1.5; c.beginPath(); c.ellipse(r.x, r.y, 6 + r.t * 30, 2 + r.t * 8, 0, 0, 7); c.stroke(); c.restore(); });
    const h = this.hover; if (!h || typeof h === 'string') { if (h) { const lbl = NX.t(h === 'nexi' ? 'obj.nexiTag' : 'obj.catTag'), x = h === 'nexi' ? NX.nexi.x : NX.cat.x, y = (h === 'nexi' ? NX.nexi.box[1] : NX.cat.y - 30) - 6; this.tag(c, lbl, x, y); } return; }
    const b = h.box || h.hit;                                                                 // (13.11, власник: «рамок, якими виділяється зона, взагалі не має бути — Nexi теж іноді виділяється, не круто») — рамку прибрано, лишився підпис
    this.tag(c, NX.t(h.name).toUpperCase(), b.x + b.w / 2, b.y - 4);
  },
  tag(c, s, x, y) { const P = NX.px; c.font = '5px "Press Start 2P", monospace'; const w = c.measureText(s).width + 8; P.rect(c, x - w / 2, y - 9, w, 11, '#050818ee'); c.strokeStyle = '#3be8ff'; c.lineWidth = .8; c.strokeRect(x - w / 2, y - 9, w, 11); P.text(c, s, x, y - 1, '#3be8ff', 5, 'center'); },
};

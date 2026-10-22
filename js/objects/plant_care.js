/* ============================================================================
 * objects/plant_care.js — РОСЛИНА БІЛЯ ДИВАНУ (полив)
 * ----------------------------------------------------------------------------
 * Рослина намальована на картинці; тут — зона натискання і "щаслива" реакція:
 * після поливу листя спалахує зеленими іскрами, а над ним крутяться сердечка.
 * this.happy 0..1 — скільки ще світиться після поливу.
 * ========================================================================== */
NX.addObject({
  id: 'plant', name: 'obj.plant', act: 'water', hit: { x: 862, y: 288, w: 50, h: 66 }, happy: 0,
  update(dt) { this.happy = Math.max(0, this.happy - dt / 8); if (this.happy > 0 && Math.random() < .08) NX.fx.emit('spark', 870 + Math.random() * 36, 300 + Math.random() * 30, { col: '#7aff9a' }); },
  drawBack(c, t) { if (this.happy > 0) NX.px.glow(c, 887, 316, 34, 'rgba(90,255,140,.7)', this.happy * .6); },
  watered() { this.happy = 1; for (let i = 0; i < 4; i++) setTimeout(() => NX.fx.emit('heart', 880 + Math.random() * 14, 296, { col: '#7aff9a' }), i * 300); },
});

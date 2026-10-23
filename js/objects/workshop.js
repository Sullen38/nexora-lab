/* ============================================================================
 * objects/workshop.js — МАЙСТЕРНЯ (капсула-сканер намальована на картинці)
 * ----------------------------------------------------------------------------
 * Nexi стає на платформу капсули — відкривається Лабораторія скінів.
 * install() — коли обрано новий скін: спалах світла й іскри навколо Nexi.
 * Власної графіки об'єкт не має.
 * ========================================================================== */
NX.addObject({
  id: 'workshop', name: 'obj.workshop', act: 'workshop', hit: { x: 930, y: 170, w: 170, h: 165 }, active: false, prog: 0, flash: 0,
  install() { this.flash = 1; const n = NX.nexi; for (let i = 0; i < 18; i++) NX.fx.emit('spark', n.x + (Math.random() - .5) * 34, n.y - Math.random() * 56); NX.nexiPhys.kick(2); },
  update(dt) { this.flash = Math.max(0, this.flash - dt * 2); },
  layers() { return this.flash > 0 ? [{ y: NX.nexi.y + 1, draw: c => NX.px.glow(c, NX.nexi.x, NX.nexi.y - 30, 50, 'rgba(255,255,255,.9)', this.flash * .8) }] : []; },
});

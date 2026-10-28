/* ============================================================================
 * objects/plant_care.js — РОСЛИНА БІЛЯ ДИВАНУ (полив)
 * ----------------------------------------------------------------------------
 * Раніше рослина була намальована на картинці кімнати. Тепер вікно панорамне й місто за ним
 * малюється кодом (world/cityscape.js), тож і рослина — кодом (NX.kit.plant), як усі рослини
 * лівого крила: пишна папороть (аркоподібні вайї) у темно-синьому горщику з неоновим обідком,
 * на тому ж місці — між диваном і машинерією майстерні, ПОЗАДУ підлокітника дивану (тому цей файл
 * підключено ДО sofa.js: drawBack малюється раніше за диван) і ПЕРЕД машинерією (вона — objects/workshop.js,
 * підключена раніше; м'яку тінь рослини на машинерії запікає сама машинерія).
 * Гойдається; після поливу листя спалахує зеленими іскрами, а над ним крутяться сердечка.
 * this.happy 0..1 — скільки ще світиться після поливу.
 * ========================================================================== */
(() => {
  const P = NX.px, K = NX.kit, F = NX.furn;
  // місце й розмір задані для дивану на старому місці (774, 362) — переносяться разом з диваном (core/config.js SOFA, sofaPt)
  const SK = NX.cfg.SOFA.k, at = (x, y) => NX.cfg.sofaPt(x, y), [DX, DY] = at(856, 281);
  const D = { kind: 'fern', x: DX, y: DY, w: Math.round(68 * SK), h: Math.round(73 * SK), potW: Math.round(26 * SK), potH: Math.round(17 * SK), leaves: 17, seed: 27, pal: 'light', pot: 'navy', neon: '#ff4fd8' };
  const [HX, HY] = at(862, 288), [GX, GY] = at(887, 316);
  let SP = null;
  NX.plantCare = D;                                                               // де стоїть (машинерія майстерні запікає м'яку тінь від неї)
  NX.addObject({
    id: 'plant', name: 'obj.plant', act: 'water', hit: { x: HX, y: HY, w: 50 * SK, h: 66 * SK }, happy: 0, shake: 0,
    update(dt) { this.happy = Math.max(0, this.happy - dt / 8); this.shake = Math.max(0, this.shake - dt * .9); if (this.happy > 0 && Math.random() < .08) { const [x, y] = at(870 + Math.random() * 36, 300 + Math.random() * 30); NX.fx.emit('spark', x, y, { col: '#7aff9a' }); } },
    drawBack(c, t) {
      if (!SP) SP = K.plant(D);
      c.fillStyle = 'rgba(2,0,10,.55)'; c.beginPath(); c.ellipse(D.x + D.w / 2, D.y + D.h - .4, D.potW / 2 + 2.5, 2, 0, 0, 7); c.fill();   // тінь контакту на підлозі
      K.sway(c, SP, D.x, D.y, t, 1.3, this.shake + this.happy * .15, .8);
      if (this.happy > 0) P.glow(c, GX, GY, 34 * SK, 'rgba(90,255,140,.7)', this.happy * .6);
    },
    watered() { this.happy = 1; this.shake = .6; for (let i = 0; i < 4; i++) setTimeout(() => { const [x, y] = at(880 + Math.random() * 14, 296); NX.fx.emit('heart', x, y, { col: '#7aff9a' }); }, i * 300); },
  });
})();

/* ============================================================================
 * objects/plant_care.js — РОСЛИНА БІЛЯ ДИВАНУ (полив)
 * ----------------------------------------------------------------------------
 * Раніше рослина була намальована на картинці кімнати. Тепер вікно панорамне й місто за ним
 * малюється кодом (world/cityscape.js), тож і рослина — кодом (NX.kit.plant), як усі рослини
 * лівого крила: пишна папороть (аркоподібні вайї) у темно-синьому горщику з неоновим обідком,
 * на тому ж місці — між диваном і машинерією майстерні, ПОЗАДУ підлокітника дивану (тому цей файл
 * підключено ДО sofa.js: drawBack малюється раніше за диван).
 * Під рослиною — м'яка тінь на машинерії: вона ж закриває стару рослину картинки.
 * Гойдається; після поливу листя спалахує зеленими іскрами, а над ним крутяться сердечка.
 * this.happy 0..1 — скільки ще світиться після поливу.
 * ========================================================================== */
(() => {
  const P = NX.px, K = NX.kit, F = NX.furn;
  const D = { kind: 'fern', x: 856, y: 281, w: 68, h: 73, potW: 26, potH: 17, leaves: 17, seed: 27, pal: 'light', pot: 'navy', neon: '#ff4fd8' };
  const SHADOW = { x: 891, y: 322, rx: 29, ry: 33 };                              // тінь на машинерії (праворуч від неї — картинка)
  let SP = null, SH = null;
  function buildShadow() {
    const S = F.Sheet(887.5, SHADOW.y - SHADOW.ry, SHADOW.x + SHADOW.rx, 356), PAL = ['#0c0624', '#120a32', '#180e40', '#1e124c'];
    S.rect(887.5, SHADOW.y - SHADOW.ry, SHADOW.x + SHADOW.rx, 356, (u, v, i, j, X, Y) => {
      const e = ((X - SHADOW.x) / SHADOW.rx) ** 2 + ((Y - SHADOW.y) / SHADOW.ry) ** 2; if (e > 1) return null;
      if (e > .62 && NX.art.BAYER[(j & 3) * 4 + (i & 3)] + .5 < (e - .62) / .38) return null;   // м'який край — дизерингом
      return F.ramp(PAL, .25 + (1 - e) * .1 + (Y - SHADOW.y) / SHADOW.ry * -.15, i, j, .1);
    });
    return S;
  }
  NX.addObject({
    id: 'plant', name: 'obj.plant', act: 'water', hit: { x: 862, y: 288, w: 50, h: 66 }, happy: 0, shake: 0,
    update(dt) { this.happy = Math.max(0, this.happy - dt / 8); this.shake = Math.max(0, this.shake - dt * .9); if (this.happy > 0 && Math.random() < .08) NX.fx.emit('spark', 870 + Math.random() * 36, 300 + Math.random() * 30, { col: '#7aff9a' }); },
    drawBack(c, t) {
      if (!SP) { SP = K.plant(D); SH = buildShadow(); SH.cv = SH.canvas(null); }
      K.draw(c, SH, Math.min(4, F.res()));
      c.fillStyle = 'rgba(2,0,10,.55)'; c.beginPath(); c.ellipse(D.x + D.w / 2, D.y + D.h - .4, D.potW / 2 + 2.5, 2, 0, 0, 7); c.fill();   // тінь контакту на підлозі
      K.sway(c, SP, D.x, D.y, t, 1.3, this.shake + this.happy * .15, .8);
      if (this.happy > 0) P.glow(c, 887, 316, 34, 'rgba(90,255,140,.7)', this.happy * .6);
    },
    watered() { this.happy = 1; this.shake = .6; for (let i = 0; i < 4; i++) setTimeout(() => NX.fx.emit('heart', 880 + Math.random() * 14, 296, { col: '#7aff9a' }), i * 300); },
  });
})();

/* ============================================================================
 * objects/office.js — ОФІСНІ КРІСЛА + ЕКРАНИ АНАЛІТИКИ Й МАРКЕТИНГУ
 * ----------------------------------------------------------------------------
 * Два незалежні об'єкти; крісла — ті, що намальовані на картинці кімнати:
 *   'analytics' — крісло біля екранів аналітики, на екранах ростуть графіки
 *   'marketing' — крісло біля екрану маркетингу, на екрані лайки й пости
 * Nexi сідає в крісло спиною до нас (поза sitType) і працює.
 * Спинка крісла (шматок картинки) малюється ПІСЛЯ Nexi і закриває його нижню
 * частину — так він справді сидить у кріслі, а над спинкою видно голову.
 * ========================================================================== */
(() => {
  const P = NX.px;
  /** Крісло з картинки: перемальовуємо його спинку (шматок самої картинки) поверх Nexi,
   *  тож він ніби сидить у кріслі, а над спинкою видно голову. r = [x, y, w, h] кімнати. */
  function chairBack(c, r) { c.drawImage(NX.room.img, r[0], r[1], r[2], r[3], r[0], r[1], r[2], r[3]); }
  NX.addObject({
    id: 'analytics', name: 'obj.analytics', act: 'analytics', active: false, prog: 0,
    hit: { x: 330, y: 150, w: 140, h: 200 },
    drawBack(c, t) {                                     // анімація на настінних екранах
      if (!this.active) return;
      c.save(); c.globalCompositeOperation = 'lighter';
      [8, 14, 11, 18, 15].forEach((h, i) => { const hh = h * (.6 + .4 * Math.abs(Math.sin(t * 1.6 + i))) + this.prog * 10; P.rect(c, 350 + i * 7, 246 - hh, 5, hh, i === Math.floor(t * 1.5) % 5 ? '#ffc94d' : '#3be8ff'); });
      for (let i = 0; i < 6; i++) P.stair(c, 398 + i * 7, 230 - Math.sin(i + t) * 8 - i * 2, 405 + i * 7, 230 - Math.sin(i + 1 + t) * 8 - (i + 1) * 2, '#ff7af0', 1.5);
      P.text(c, '+' + (12 + Math.floor(this.prog * 30)) + '%', 400, 212, '#ffe27a', 5); c.restore();
    },
    layers(t) { return [{ y: 276.5, draw: c => chairBack(c, [409, 263, 60, 48]) }]; },
  });
  NX.addObject({
    id: 'marketing', name: 'obj.marketing', act: 'marketing', active: false, prog: 0,
    hit: { x: 535, y: 165, w: 115, h: 185 },
    drawBack(c, t) {
      if (!this.active) return;
      c.save(); c.globalCompositeOperation = 'lighter';
      for (let i = 0; i < 4; i++) { const ph = (t * .5 + i / 4) % 1, x = 552 + i * 22, y = 252 - ph * 40; c.globalAlpha = 1 - ph; P.rect(c, x, y, 14, 9, '#e9eefc'); P.rect(c, x + 4, y + 2, 2, 2, '#ff4f9a'); P.rect(c, x + 7, y + 2, 2, 2, '#ff4f9a'); P.rect(c, x + 4, y + 4, 5, 2, '#ff4f9a'); }
      c.globalAlpha = 1; P.text(c, '♥ ' + (1200 + Math.floor(this.prog * 3400)), 560, 212, '#ff7af0', 5); c.restore();
    },
    layers(t) { return [{ y: 286.5, draw: c => chairBack(c, [597, 272, 56, 44]) }]; },
  });
})();

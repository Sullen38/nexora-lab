/* ============================================================================
 * objects/office.js — ОФІСНІ КРІСЛА + ЕКРАНИ АНАЛІТИКИ Й МАРКЕТИНГУ
 * ----------------------------------------------------------------------------
 * Два незалежні об'єкти з однаковим кріслом:
 *   'analytics' — крісло біля екранів аналітики, на екранах ростуть графіки
 *   'marketing' — крісло біля екрану маркетингу, на екрані лайки й пости
 * Nexi сідає в крісло спиною до нас (поза sitType) і працює.
 * Nexi сідає трохи вище сидіння, щоб голова й плечі виднілись над спинкою.
 * Спинка крісла малюється ПІСЛЯ Nexi, тому вона закриває його нижню частину —
 * так виглядає, ніби він справді сидить у кріслі.
 * ========================================================================== */
(() => {
  const P = NX.px;
  /** Крісло, вигляд ззаду. cx — центр, sy — сидіння, fy — підлога. */
  function chair(c, cx, sy, fy, t, accent) {
    P.rect(c, cx - 16, fy - 3, 32, 2, '#141838'); [-15, -5, 5, 13].forEach(dx => P.rect(c, cx + dx, fy - 2, 3, 3, '#0a0d24'));  // хрестовина з коліщатами
    P.rect(c, cx - 2, sy + 5, 4, fy - sy - 8, '#5a6590');                                                                       // газліфт
    P.rect(c, cx - 17, sy, 34, 6, '#3a2a7a'); P.rect(c, cx - 17, sy, 34, 1, '#5a4aa8');                                       // сидіння
    P.rect(c, cx - 15, sy - 30, 30, 31, '#2b1d5e'); P.rect(c, cx - 15, sy - 30, 4, 31, '#3a2a7a'); P.rect(c, cx + 11, sy - 30, 4, 31, '#3a2a7a');  // спинка з бортиками
    P.rect(c, cx - 13, sy - 31, 26, 1, '#5a4aa8');
    P.rect(c, cx - 1, sy - 26, 2, 22, accent); P.rect(c, cx - 7, sy - 36, 14, 6, '#3a2a7a'); P.rect(c, cx - 7, sy - 36, 14, 1, '#5a4aa8');      // неонова смужка + подушка
    P.rect(c, cx - 20, sy - 10, 4, 9, '#1a1440'); P.rect(c, cx + 16, sy - 10, 4, 9, '#1a1440');                              // підлокітники
    P.glow(c, cx, sy - 16, 24, accent === '#d94bff' ? 'rgba(217,75,255,.22)' : 'rgba(59,232,255,.22)', .6);
  }
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
    layers(t) { return [{ y: 296.5, draw: c => chair(c, 418, 296, 346, t, '#3be8ff') }]; },
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
    layers(t) { return [{ y: 300.5, draw: c => chair(c, 604, 300, 348, t, '#d94bff') }]; },
  });
})();

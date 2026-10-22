/* ============================================================================
 * world/ambient.js — "ЖИТТЯ" ФОНУ (неінтерактивні анімації картинки)
 * ----------------------------------------------------------------------------
 * Тут усе, що оживляє саму картинку, але на що не можна натиснути:
 *   - вогні у вікнах міста та зорі
 *   - іскра на кільці планети, вогник корабля, летючий транспорт
 *   - світіння і скан-лінії на настінних екранах
 *   - мерехтіння ламп, пульс "мозку" на екрані AI-центру
 * Координати — у системі кімнати (див. core/config.js).
 * ========================================================================== */
NX.ambient = {
  windows: [],
  // Настінні екрани: [x, y, w, h, колір]
  screens: [[75, 50, 162, 170, '#3be8ff'], [332, 150, 128, 105, '#3be8ff'], [537, 170, 108, 90, '#d94bff'], [968, 22, 110, 118, '#3be8ff'], [1168, 165, 130, 135, '#3be8ff'], [730, 168, 98, 40, '#3be8ff']],
  lamps: [[515, 145], [660, 236], [1418, 92], [1243, 48], [1110, 222], [35, 255]],

  /** Знаходимо темні пікселі будівель у вікні, щоб "запалювати" в них вікна. */
  init() {
    const tc = document.createElement('canvas'); tc.width = 1536; tc.height = 368; const x = tc.getContext('2d', { willReadFrequently: true }); x.drawImage(NX.room.img, 0, 0);
    const d = x.getImageData(0, 0, 1536, 368).data, H = NX.px.hash;
    for (let k = 0; k < 8000 && this.windows.length < 180; k++) {
      const px = 470 + Math.floor(H(k) * 470), py = 70 + Math.floor(H(k + 999) * 170), i = (py * 1536 + px) * 4;
      if (d[i] + d[i + 1] + d[i + 2] < 130 && d[i + 2] > d[i]) this.windows.push([px, py, H(k + 7)]);
    }
  },
  draw(c, t) {
    const P = NX.px;
    // вікна міста
    this.windows.forEach(([x, y, h], i) => { if (Math.sin(t * (.6 + (i % 4) * .4) + h * 6.28) > .35) P.rect(c, x, y, 2, 2, ['#ffe27a', '#ff7af0', '#7af0ff'][i % 3]); });
    // зорі
    for (let i = 0; i < 28; i++) { const x = 480 + P.hash(i + 50) * 460, y = 8 + P.hash(i + 80) * 60, a = Math.sin(t * 1.7 + i * 2.1); if (a > .3) { P.rect(c, x, y, 1.5, 1.5, '#fff'); if (a > .9) { P.rect(c, x - 2, y + .25, 5.5, 1, '#fff'); P.rect(c, x + .25, y - 2, 1, 5.5, '#fff'); } } }
    // планета: іскри на кільці + пульс
    for (let k = 0; k < 2; k++) { const a = t * .7 + k * Math.PI, px = 752 + 132 * Math.cos(a), py = 64 + 26 * Math.sin(a) - Math.cos(a) * 14; P.glow(c, px, py, 9, 'rgba(160,240,255,.9)', .9); P.rect(c, px - 1, py - 1, 2.5, 2.5, '#fff'); }
    P.glow(c, 765, 62, 70, 'rgba(59,150,255,.5)', .25 + .1 * Math.sin(t));
    // корабель (вогник) і маленький летючий транспорт
    P.rect(c, 862, 61, 2.5, 2.5, Math.sin(t * 6) > 0 ? '#ff3b6a' : '#7af0ff');
    const fx = 470 + ((t / 9) % 1) * 480; P.rect(c, fx, 34, 10, 3, '#c9b4ff'); P.rect(c, fx + 3, 31, 4, 3, '#c9b4ff'); P.rect(c, fx - 3 + (Math.floor(t * 12) % 2), 35, 3, 1.5, '#ffe27a');
    // екрани: світіння + скан-лінія
    this.screens.forEach(([x, y, w, h, col], i) => { c.save(); c.globalCompositeOperation = 'lighter'; c.globalAlpha = .08 + .06 * Math.sin(t * 1.3 + i); c.fillStyle = col; c.fillRect(x, y, w, h); c.globalAlpha = .3; c.fillRect(x + 3, y + ((t * .35 + i * .17) % 1) * h, w - 6, 1); c.restore(); });
    P.glow(c, 165, 135, 45, 'rgba(255,120,240,.8)', .2 + .2 * Math.sin(t * 2.4));   // "мозок" AI-центру
    this.lamps.forEach(([x, y], i) => P.glow(c, x, y, 22, 'rgba(255,200,90,.9)', .28 + .18 * Math.sin(t * 3.1 + i * 2) + (P.hash(Math.floor(t * 8) + i) > .97 ? -.2 : 0)));
  },
};

/* ============================================================================
 * objects/tools.js — ПАНЕЛЬ ІНСТРУМЕНТІВ (оживляє панель з картинки)
 * ----------------------------------------------------------------------------
 *  - 3 верхні іконки інтеграцій по черзі пульсують неоном; шестерня справді
 *    крутиться; коли Nexi працює — іконки по черзі "підключаються" (зелені ✓)
 *  - нижні екрани: скан-лінія і моргання робота
 *  - перфодошка з інструментами, що гойдаються на гачках (сильніше в роботі)
 *  - ящик на верстаті: кришка відкривається, коли Nexi ремонтує
 *  - кабель від панелі до Nexi з бігучими імпульсами даних
 * ========================================================================== */
NX.addObject({
  id: 'tools', name: 'obj.tools', act: 'tools',
  hit: { x: 1160, y: 160, w: 145, h: 160 }, active: false, prog: 0,
  ICONS: [[1188, 210, 30, 38], [1222, 210, 30, 38], [1256, 210, 34, 38]],   // квадрати іконок на картинці
  drawBack(c, t) {
    const P = NX.px, on = this.active, n = on ? Math.floor(this.prog * 4) : (this.done ? 3 : 0);
    // --- верхні іконки
    this.ICONS.forEach(([x, y, w, h], i) => {
      const ok = i < n, pulse = (Math.floor(t * 1.2) % 3) === i;
      c.save(); c.globalCompositeOperation = 'lighter'; c.strokeStyle = ok ? '#3bff8a' : '#3be8ff'; c.lineWidth = 1.2; c.shadowColor = c.strokeStyle; c.shadowBlur = ok || pulse ? 8 : 3;
      c.globalAlpha = ok ? 1 : pulse ? .9 : .35; c.strokeRect(x + .5, y + .5, w - 1, h - 1); c.restore();
      if (ok) { P.rect(c, x + w - 9, y + h - 8, 2, 3, '#3bff8a'); P.rect(c, x + w - 7, y + h - 6, 2, 2, '#3bff8a'); P.rect(c, x + w - 5, y + h - 11, 2, 6, '#3bff8a'); }
    });
    // --- шестерня, що крутиться (поверх іконки-шестерні)
    const gx = 1273, gy = 229, ga = t * (on ? 3 : .8);
    c.save(); c.globalCompositeOperation = 'lighter'; c.translate(gx, gy); c.rotate(ga); c.fillStyle = '#5ae8ff';
    for (let k = 0; k < 8; k++) { c.rotate(Math.PI / 4); c.fillRect(-1.5, -11, 3, 4); }
    c.beginPath(); c.arc(0, 0, 8, 0, 7); c.lineWidth = 2; c.strokeStyle = '#5ae8ff'; c.stroke(); c.restore();
    // --- нижні екрани: скан-лінія, моргання робота
    c.save(); c.globalCompositeOperation = 'lighter'; P.rect(c, 1190, 264 + ((t * 18) % 34), 30, 1, 'rgba(122,240,255,.5)'); c.restore();
    if ((t % 3.5) < .15) { P.rect(c, 1262, 282, 5, 2, '#06102e'); P.rect(c, 1274, 282, 5, 2, '#06102e'); }
    P.rect(c, 1214, 266, 3, 3, Math.sin(t * 5) > 0 ? '#3bff8a' : '#1f6a45');
    // --- перфодошка з інструментами (закриває шов картинки між екранами)
    const bx = 1222, by = 258, bw = 26, bh = 44;
    P.rect(c, bx, by, bw, bh, '#0e1230'); c.save(); c.strokeStyle = '#ff9a3a'; c.lineWidth = 1; c.shadowColor = '#ff9a3a'; c.shadowBlur = 5; c.strokeRect(bx + .5, by + .5, bw - 1, bh - 1); c.restore();
    for (let y = by + 4; y < by + bh - 2; y += 4) for (let x = bx + 3; x < bx + bw - 2; x += 4) P.rect(c, x, y, 1, 1, '#262c5e');
    const sw = k => Math.sin(t * (on ? 6 : 1.4) + k) * (on ? .18 : .06);
    const hang = (hx, hy, k, fn) => { c.save(); c.translate(hx, hy); c.rotate(sw(k)); fn(); c.restore(); P.rect(c, hx - 1, hy - 1, 2, 2, '#c3cbea'); };
    hang(bx + 5, by + 5, 0, () => { P.rect(c, -1, 0, 3, 15, '#c3cbea'); P.rect(c, -3, 0, 7, 3, '#c3cbea'); P.rect(c, -1, 1, 3, 1, '#0e1230'); P.rect(c, -3, 13, 7, 3, '#c3cbea'); });      // ключ
    hang(bx + 13, by + 5, 1, () => { P.rect(c, -1, 2, 2, 17, '#a0703a'); P.rect(c, -4, 0, 9, 4, '#aab4d6'); P.rect(c, -4, 0, 9, 1, '#e9eefc'); });                                   // молоток
    hang(bx + 21, by + 5, 2, () => { P.rect(c, -1, 0, 2, 10, '#c3cbea'); P.rect(c, -2, 10, 4, 8, '#ffc94d'); P.rect(c, -2, 10, 1, 8, '#ffe27a'); });                                // викрутка
    hang(bx + 9, by + 26, 3, () => { P.rect(c, -3, 0, 2, 11, '#aab4d6'); P.rect(c, 1, 0, 2, 11, '#aab4d6'); P.rect(c, -4, 10, 8, 5, '#d93a4a'); });                                 // пасатижі
    hang(bx + 19, by + 26, 4, () => { c.strokeStyle = '#ffc94d'; c.lineWidth = 1.5; c.beginPath(); c.arc(0, 6, 5, 0, 7); c.stroke(); });                                            // моток дроту
    // --- кабель від панелі до Nexi з імпульсами
    if (on) { const n2 = NX.nexi, x0 = 1236, y0 = 248, x1 = n2.x + 8, y1 = n2.y - 30;
      c.strokeStyle = '#2a3a7a'; c.lineWidth = 2; c.beginPath(); c.moveTo(x0, y0); c.quadraticCurveTo((x0 + x1) / 2, Math.max(y0, y1) + 18, x1, y1); c.stroke();
      for (let k = 0; k < 3; k++) { const q = (t * 1.5 + k / 3) % 1, mx = (x0 + x1) / 2, my = Math.max(y0, y1) + 18, px = (1 - q) * (1 - q) * x0 + 2 * (1 - q) * q * mx + q * q * x1, py = (1 - q) * (1 - q) * y0 + 2 * (1 - q) * q * my + q * q * y1; P.rect(c, px - 1, py - 1, 3, 3, '#7af0ff'); P.glow(c, px, py, 6, 'rgba(122,240,255,.9)', .7); } }
  },
  layers(t) {
    const P = NX.px, on = this.active;
    return [{ y: 312, draw: c => {
      P.cube(c, 1186, 312, 30, 11, 6, '#c9612e', '#e88a3a', '#8a3a1a'); P.rect(c, 1186, 302, 30, 1, '#ffb070');
      if (on) { c.save(); c.translate(1186, 301); c.rotate(-.5 - Math.sin(t * 4) * .1); P.rect(c, 0, -3, 30, 3, '#e88a3a'); c.restore(); P.glow(c, 1201, 304, 16, 'rgba(255,180,80,.8)', .6); if (Math.random() < .2) NX.fx.emit('spark', 1201, 303); }
      else { P.rect(c, 1194, 297, 14, 2, '#5a2a14'); P.rect(c, 1194, 297, 2, 4, '#5a2a14'); P.rect(c, 1206, 297, 2, 4, '#5a2a14'); }
      P.rect(c, 1199, 305, 4, 3, on ? '#3be8ff' : '#2a3a7a');
    } }];
  },
});

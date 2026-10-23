/* ============================================================================
 * objects/tools.js — ІНСТРУМЕНТИ (дошка з інструментами, ящик, панель інтеграцій)
 * ----------------------------------------------------------------------------
 * Перфодошка з ключем/молотком/викруткою + ящик на верстаті.
 * Коли Nexi ремонтує (this.active), він висить на ранці перед панеллю, а
 * іконки інтеграцій на настінній панелі по черзі "підключаються" (this.prog).
 * ========================================================================== */
NX.addObject({
  id: 'tools', name: 'obj.tools', act: 'tools',
  hit: { x: 1160, y: 160, w: 145, h: 160 }, active: false, prog: 0,
  icons: [[1190, 207], [1226, 207], [1260, 207]],                       // квадрати іконок на картинці
  drawBack(c, t) {
    const P = NX.px;
    // перфодошка
    P.rect(c, 1176, 262, 50, 40, '#141838'); c.strokeStyle = '#2e3478'; c.lineWidth = 1; c.strokeRect(1176.5, 262.5, 49, 39);
    for (let y = 266; y < 300; y += 5) for (let x = 1180; x < 1224; x += 5) P.rect(c, x, y, 1, 1, '#2a2f5e');
    P.rect(c, 1182, 266, 3, 18, '#c3cbea'); P.rect(c, 1180, 266, 7, 3, '#c3cbea'); P.rect(c, 1180, 282, 7, 3, '#c3cbea');   // ключ
    P.rect(c, 1194, 268, 2, 20, '#8a5a2a'); P.rect(c, 1190, 266, 10, 5, '#aab4d6');                                          // молоток
    P.rect(c, 1207, 266, 2, 12, '#c3cbea'); P.rect(c, 1206, 278, 4, 9, '#ffc94d');                                           // викрутка
    P.rect(c, 1216, 268, 2, 14, '#aab4d6'); P.rect(c, 1220, 268, 2, 14, '#aab4d6'); P.rect(c, 1215, 282, 8, 5, '#d93a4a');   // пасатижі
    // підключення іконок
    const n = this.active ? Math.floor(this.prog * 4) : (this.done ? 3 : 0);
    this.icons.forEach(([x, y], i) => {
      if (i >= n) return;
      c.save(); c.strokeStyle = '#3bff8a'; c.lineWidth = 1.5; c.shadowColor = '#3bff8a'; c.shadowBlur = 6; c.strokeRect(x, y, 30, 30); c.restore();
      P.rect(c, x + 22, y + 22, 2, 3, '#3bff8a'); P.rect(c, x + 24, y + 24, 2, 2, '#3bff8a'); P.rect(c, x + 26, y + 19, 2, 5, '#3bff8a');
    });
  },
  layers(t) {
    return [{ y: 312, draw: c => {
      NX.px.cube(c, 1186, 312, 30, 11, 6, '#c9612e', '#e88a3a', '#8a3a1a');
      NX.px.rect(c, 1194, 297, 14, 2, '#5a2a14'); NX.px.rect(c, 1194, 297, 2, 4, '#5a2a14'); NX.px.rect(c, 1206, 297, 2, 4, '#5a2a14');
      NX.px.rect(c, 1199, 305, 4, 3, this.active ? '#3be8ff' : '#2a3a7a');
    } }];
  },
});

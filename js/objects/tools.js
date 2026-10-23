/* ============================================================================
 * objects/tools.js — ІНСТРУМЕНТИ (панель інтеграцій з картинки)
 * ----------------------------------------------------------------------------
 * Коли Nexi ремонтує (this.active), він висить на ранці перед панеллю, а
 * іконки інтеграцій на настінній панелі по черзі "підключаються" (this.prog).
 * ========================================================================== */
NX.addObject({
  id: 'tools', name: 'obj.tools', act: 'tools',
  hit: { x: 1160, y: 160, w: 145, h: 160 }, active: false, prog: 0,
  icons: [[1190, 207], [1226, 207], [1260, 207]],                       // квадрати іконок на картинці
  drawBack(c, t) {
    const P = NX.px;
    // підключення іконок
    const n = this.active ? Math.floor(this.prog * 4) : (this.done ? 3 : 0);
    this.icons.forEach(([x, y], i) => {
      if (i >= n) return;
      c.save(); c.strokeStyle = '#3bff8a'; c.lineWidth = 1.5; c.shadowColor = '#3bff8a'; c.shadowBlur = 6; c.strokeRect(x, y, 30, 30); c.restore();
      P.rect(c, x + 22, y + 22, 2, 3, '#3bff8a'); P.rect(c, x + 24, y + 24, 2, 2, '#3bff8a'); P.rect(c, x + 26, y + 19, 2, 5, '#3bff8a');
    });
  },
});

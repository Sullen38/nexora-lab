/* ============================================================================
 * objects/taskboard.js — НАСТІННА ДОШКА ЗАДАЧ (над столом AI-центру)
 * ----------------------------------------------------------------------------
 * Показує 4 останні задачі Nexi: виконані з галочкою, поточна з прогресом.
 * Дані бере з NX.nexi.history і NX.nexi.task (actors/nexi/nexi.js).
 * Тільки малює (drawBack) — це частина стіни.
 * ========================================================================== */
NX.addObject({
  id: 'taskboard', name: 'Дошка задач',
  hit: { x: 210, y: 185, w: 136, h: 71 }, act: 'ai',
  drawBack(c, t) {
    const P = NX.px, { x, y, w, h } = this.hit;
    P.rect(c, x, y, w, h, '#070b26'); c.strokeStyle = '#3be8ff'; c.lineWidth = 1; c.strokeRect(x + .5, y + .5, w - 1, h - 1);
    P.rect(c, x, y, w, 11, '#0f1b4d'); P.text(c, 'ЗАДАЧІ NEXI', x + 5, y + 8, '#3be8ff', 4.5);
    P.rect(c, x + w - 10, y + 4, 4, 4, Math.sin(t * 4) > 0 ? '#3bff8a' : '#1f6a45');           // індикатор "онлайн"
    const rows = NX.nexi.history.slice(-3), cur = NX.nexi.task;
    const all = cur ? [...rows, { title: cur.title, color: cur.color, prog: cur.prog }] : rows;
    all.slice(-4).forEach((r, i) => {
      const ry = y + 15 + i * 13, done = r.prog === undefined;
      P.rect(c, x + 5, ry, 7, 7, '#0a1236'); c.strokeStyle = r.color || '#3be8ff'; c.strokeRect(x + 5.5, ry + .5, 6, 6);
      if (done) { P.rect(c, x + 7, ry + 3, 1, 2, '#3bff8a'); P.rect(c, x + 8, ry + 4, 1, 1, '#3bff8a'); P.rect(c, x + 9, ry + 1, 1, 3, '#3bff8a'); }
      P.text(c, r.title.toUpperCase().slice(0, 16), x + 16, ry + 6, done ? '#7d8cc4' : '#ffffff', 4);
      if (!done) { P.rect(c, x + 16, ry + 8, 100, 2, '#1b2a66'); P.rect(c, x + 16, ry + 8, 100 * r.prog, 2, r.color || '#3be8ff'); }
    });
    if (!all.length) P.text(c, 'ЧЕКАЮ НА ЗАДАЧУ...', x + 6, y + 26, '#7d8cc4', 4);
  },
});

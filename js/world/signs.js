/* ============================================================================
 * world/signs.js — ВИВІСКИ ЗОН МОВОЮ ГЛЯДАЧА
 * ----------------------------------------------------------------------------
 * Написи МАЙСТЕРНЯ / ІНСТРУМЕНТИ / ПОРТАЛ намальовані на картинці українською
 * (ліве крило — AI-центр, аналітика, маркетинг — пише свої вивіски саме, NX.t).
 * Для інших мов текст вивіски акуратно зафарбовується кольором її фону і
 * пишеться заново перекладом з js/i18n (ключі nav.*), неоновим піксельним
 * шрифтом. Українською показується оригінальний малюнок.
 *   box  — де на картинці текст (зафарбовуємо)
 *   maxW — скільки місця на табличці для нового тексту
 * ========================================================================== */
NX.addObject({
  id: 'signs',
  SIGNS: [
    { key: 'nav.workshop',  box: [971, 184, 1041, 200], maxW: 80, bg: '#180460' },
    { key: 'nav.tools',     box: [1201, 180, 1280, 197], maxW: 84, bg: '#001568' },
    { key: 'nav.portal',    box: [1377, 132, 1439, 153], maxW: 96, bg: '#040943' },
  ],
  drawBack(c, t) {
    if (NX.i18n.lang === 'uk') return;
    const P = NX.px;
    this.SIGNS.forEach((s, i) => {
      const [x0, y0, x1, y1] = s.box, cx = (x0 + x1) / 2, cy = (y0 + y1) / 2, txt = NX.t(s.key);
      const extra = Math.max(0, (s.maxW - (x1 - x0)) / 2);
      P.rect(c, x0 - 1 - Math.min(extra, 6), y0 - 1, x1 - x0 + 2 + 2 * Math.min(extra, 6), y1 - y0 + 2, s.bg);
      let size = Math.min(8, (y1 - y0) * .62); c.font = size + 'px "Press Start 2P", monospace';
      const w = c.measureText(txt).width; if (w > s.maxW) { size *= s.maxW / w; c.font = size + 'px "Press Start 2P", monospace'; }
      c.save(); c.textAlign = 'center'; c.textBaseline = 'middle'; c.shadowColor = '#3be8ff'; c.shadowBlur = 5 + 2 * Math.sin(t * 2 + i);
      c.fillStyle = '#8ef4ff'; c.fillText(txt, cx, cy + .5); c.shadowBlur = 0; c.fillStyle = '#d8fbff'; c.globalAlpha = .5; c.fillText(txt, cx, cy); c.restore();
    });
  },
});

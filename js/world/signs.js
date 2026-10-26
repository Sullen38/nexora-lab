/* ============================================================================
 * world/signs.js — ВИВІСКИ ЗОН МОВОЮ ГЛЯДАЧА
 * ----------------------------------------------------------------------------
 * Написи МАЙСТЕРНЯ / ІНСТРУМЕНТИ / ПОРТАЛ намальовані на картинці українською
 * (ліве крило — AI-центр, аналітика, маркетинг — пише свої вивіски саме, NX.t).
 * Для інших мов текст вивіски акуратно зафарбовується кольором її фону і
 * пишеться заново перекладом з js/i18n (ключі nav.*), неоновим піксельним
 * шрифтом. Українською показується оригінальний малюнок.
 * ВІДДЗЕРКАЛЕННЯ: передня глянцева підлога будується з картинки, тож у ній «світилися» українські
 * написи. Для інших мов кімната отримує копію картинки з перекладеними вивісками (patchFront, x 948..1536).
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
  X0: 948,                                                                          // з цього x підлога віддзеркалює картинку (ліворуч — крило й місто)
  floor: false,
  drawBack(c, t) {
    if (NX.i18n.lang === 'uk') return;
    if (!this.floor && !c.isRefl && NX.room.img.naturalWidth && NX.room.front && (this.fr = (this.fr || 0) + 1) > 20 && (!document.fonts || document.fonts.status === 'loaded')) { this.floor = true; this.patchFloor(t); }   // після завантаження шрифту
    this.paint(c, t);
  },
  /** Перекладені написи поверх намальованих. */
  paint(c, t) {
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
  /** Підлога-дзеркало праворуч: копія картинки з перекладеними вивісками (раз після старту й при зміні мови). */
  patchFloor(t) {
    const img = NX.room.img, RS = NX.room.RS, cv = document.createElement('canvas'); cv.width = img.naturalWidth; cv.height = img.naturalHeight;
    const x = cv.getContext('2d'); x.drawImage(img, 0, 0); x.save(); x.scale(RS, RS); this.paint(x, t); x.restore();
    NX.room.patchFront(cv, this.X0, NX.cfg.ROOM_W);
  },
});
NX.i18n.onLang(l => {                                                               // мову змінено: підлога — з новими написами (українською — оригінал картинки)
  const S = NX.objects.signs; S.floor = false;
  if (l === 'uk') { NX.room.patches = NX.room.patches.filter(p => p.x0 !== S.X0); if (NX.room.front) NX.room.frontFrom(NX.room.img, S.X0, NX.cfg.ROOM_W); }
});

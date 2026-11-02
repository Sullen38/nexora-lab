/* ============================================================================
 * objects/portal.js — ПОРТАЛ («БРАМА»): ЖИВИЙ ОБ'ЄКТ
 * ----------------------------------------------------------------------------
 * Нерухома частина (сходинки, колони, балка з вивіскою) і вихор у глибині арки (жива грань pt_back) — у 3D-розкладці
 * (gen_room.py: portal(); грані — objects/pt_paint.js). Тут — те, що довкола:
 *   СЯЙВО: вихор світить на колони, балку й сходинки (м'яке фіолетово-блакитне, дихає);
 *   ІСКРИ: дрібні вогники кружляють біля отвору й затягуються у вихор.
 * Крок 13 — перший крок зони (брама й вихор); подорож Nexi крізь портал (куди летимо: проєкти / команда / клієнти —
 * тексти portal.* у словниках) — наступний крок, після «так» власника. active — Nexi подорожує (вихор крутиться швидше).
 * ========================================================================== */
(() => {
  const P = NX.px, proj = NX.px3d.proj, hash = NX.art.hash;
  let Z = null; const zone = () => Z || (Z = NX.arc.zone && NX.arc.zone('portal'));
  /** Отвір арки на екрані: середина, півширина й піввисота (з розкладки — px картинки зони, як у pt_back: gen_room.py portal()). */
  const BACK = { X: [42, 158], Y: [100, 316], v: 57 };
  let HOLE = null;
  function hole() {
    if (HOLE) return HOLE; const z = zone(); if (!z) return null;
    const a = z.S(BACK.X[0], BACK.Y[0], BACK.v), b = z.S(BACK.X[1], BACK.Y[1], BACK.v); HOLE = { cx: (a[0] + b[0]) / 2, cy: a[1] + (b[1] - a[1]) * .52, rx: (b[0] - a[0]) / 2, ry: (b[1] - a[1]) / 2, k: (b[0] - a[0]) / 110 };
    return HOLE;
  }
  NX.addObject({
    id: 'portal', active: false,
    get span() { const z = zone(); return z && z.box ? [z.box[0] - 30, z.box[1] + 30] : null; },
    ready() { return !!zone(); },
    drawBack(c, t) {
      const H = hole(); if (!H) return; const act = !!this.active, br = .3 + .07 * Math.sin(t * 1.7) + (act ? .15 : 0);
      c.save(); c.globalCompositeOperation = 'lighter';
      P.glow(c, H.cx, H.cy, Math.max(H.rx * 1.9, H.ry * 1.15), 'rgba(150,80,255,.55)', br);                   // сяйво на колонах і балці (висока брама — і по висоті)
      P.glow(c, H.cx, H.cy + H.ry * .95, H.rx * 1.2, 'rgba(90,200,255,.45)', br * .7);                        // відсвіт на майданчику
      for (let k = 0; k < 14; k++) {                                                                          // іскри кружляють і затягуються у вихор
        const ph = (t * (.12 + hash(k, 3) * .1) * (act ? 2.2 : 1) + hash(k, 5)) % 1, a = hash(k, 7) * 6.283 + t * (.5 + hash(k, 9) * .6) * (k % 2 ? 1 : -1);
        const r = 1.25 - ph * .95, x = H.cx + Math.cos(a) * H.rx * r, y = H.cy + Math.sin(a) * H.ry * r * .9, s = (1 - ph * .5) * Math.max(.8, H.k * .9);
        c.globalAlpha = Math.sin(ph * Math.PI) * .9; c.fillStyle = k % 3 ? '#e8d4ff' : '#9af6ff'; c.fillRect(x - s / 2, y - s / 2, s, s);
      }
      c.restore();
    },
  });
})();

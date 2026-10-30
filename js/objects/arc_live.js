/* ============================================================================
 * objects/arc_live.js — ЖИВІ ГРАНІ КРИЛ «ПО ДУЗІ» (рушій; що саме живе — у файлах зон)
 * ----------------------------------------------------------------------------
 * Нерухоме обох крил — одне полотно (objects/arc_scene.js). Поверх нього тут кладеться те, що рухається на гранях
 * предметів; вміст визначають файли зон (objects/ws_paint.js, mk_paint.js, an_paint.js, tl_paint.js) — оживає, щойно в
 * розкладці є предмет з таким id.
 *   NX.arc.LIVE[id] = { draw(c, fw, fh, t, B), every } — малює ЛИШЕ ділянки, що змінюються (решта прозора — під нею
 *     нерухома грань), у координатах лицьової грані (як NX.arc.paint); every — раз на скільки кадрів оновлювати;
 *     draw повертає false — зараз нічого (відблиск вивіски між проходами): грань не перемальовується й не кладеться
 *   NX.arc.live(c, side, S, t) — щокадру: оновлює по черзі (вразбіг) і кладе кожен екран одним drawImage; екрани поза
 *     видимою смугою (телефон бачить ~п'яту частину кімнати) не оновлюються й не кладуться
 *   NX.arc.glint(period, off) — відблиск, що пробігає по вивісці (LIVE для *_sign)
 * Як вміст лягає в 3D: пласке полотно грані -> чотирикутник грані на екрані стовпчиками (NX.furn.warp, бо боки грані
 * вертикальні) -> МАСКА видимих пікселів цієї грані з z-буфера (те, що попереду, лишається попереду).
 * Живі екрани зон 28.10 (AI-центр, хаб, термінал, вихор порталу) — в історії git (коміт a431f03).
 * ========================================================================== */
NX.arc = NX.arc || {};
(() => {
  const F = NX.furn, X = NX.px3d, LIVE = NX.arc.LIVE = {};
  const addv = (a, b) => [a[0] + b[0], a[1] + b[1], a[2] + b[2]];
  /** Відблиск, що раз на period с пробігає по грані навскіс (вивіски зон); off — зсув, щоб вивіски блищали не разом. */
  NX.arc.glint = (period, off = 0) => ({ every: 2, draw(c, fw, fh, t) {
    const k = ((t + off) % period) / 1.1; if (k >= 1) return false; const x = -fh * 1.2 + k * (fw + fh * 2.4), g = c.createLinearGradient(x - fh * .7, 0, x + fh * .7, 0);
    g.addColorStop(0, 'rgba(255,255,255,0)'); g.addColorStop(.5, 'rgba(255,255,255,.32)'); g.addColorStop(1, 'rgba(255,255,255,0)');
    c.save(); c.globalCompositeOperation = 'lighter'; c.fillStyle = g; c.beginPath(); c.moveTo(x - fh * .3, 0); c.lineTo(x + fh * .7, 0); c.lineTo(x + fh * .2, fh); c.lineTo(x - fh * .8, fh); c.closePath(); c.fill(); c.restore();
  } });

  // ---------- рушій живого шару ----------
  const proj = X.proj;
  /** Вміст грані -> полотно під маскою (у межах видимих пікселів грані, роздільність Rd). */
  function update(E, t, Rd) {
    const Fc = E.Fc, fw = Fc.fw, fh = Fc.fh, TS = E.TS, m = E.mask;
    if (!E.src) { E.src = document.createElement('canvas'); E.src.width = Math.max(1, Math.round(fw * TS)); E.src.height = Math.max(1, Math.round(fh * TS)); }
    const sc = E.src.getContext('2d'); sc.setTransform(1, 0, 0, 1, 0, 0); sc.clearRect(0, 0, E.src.width, E.src.height); sc.setTransform(TS, 0, 0, TS, 0, 0); sc.imageSmoothingEnabled = true;
    if (LIVE[E.id].draw(sc, fw, fh, t, E.B) === false) { E.empty = true; E.Rd = Rd; if (!E.out) E.out = document.createElement('canvas'); return; }   // нічого не намальовано — грань не кладемо
    E.empty = false;
    const w = Math.max(1, Math.ceil(m.w * Rd)), h = Math.max(1, Math.ceil(m.h * Rd));
    if (!E.out || E.out.width !== w || E.out.height !== h) { E.out = document.createElement('canvas'); E.out.width = w; E.out.height = h; }
    const oc = E.out.getContext('2d'); oc.setTransform(1, 0, 0, 1, 0, 0); oc.globalCompositeOperation = 'source-over'; oc.clearRect(0, 0, w, h);
    oc.setTransform(Rd, 0, 0, Rd, -m.x * Rd, -m.y * Rd); oc.imageSmoothingEnabled = true;
    const q = E.q;
    if (Math.abs(q[0][1] - q[1][1]) < .02 && Math.abs(q[3][1] - q[2][1]) < .02) oc.drawImage(E.src, q[0][0], q[0][1], q[1][0] - q[0][0], q[3][1] - q[0][1]);   // грань паралельна екрану
    else F.warp(oc, E.src, q, 1.5);
    oc.setTransform(1, 0, 0, 1, 0, 0); oc.globalCompositeOperation = 'destination-in'; oc.imageSmoothingEnabled = true; oc.drawImage(m.cv, 0, 0, w, h); oc.globalCompositeOperation = 'source-over';
    E.Rd = Rd;
  }
  const FR = {};                                                                     // лічильник кадрів — СВІЙ для кожного крила: спільний ріс би на 2 за кадр,
  /** Щокадру: оновити (вразбіг) і покласти живі грані крила side. */                 // і грані з парним every (2, 4) на непарних місцях не оновлювались би ніколи
  NX.arc.live = (c, side, S, t) => {
    if (!S.live) return; const fr = FR[side] = (FR[side] || 0) + 1;
    const Rd = Math.min(4, Math.round(NX.cam.k * (NX.loop.dpr || 1) * 100) / 100), vx0 = NX.cam.x - 8, vx1 = NX.cam.x + NX.cam.viewW + 8;
    S.live.forEach((E, n) => {
      if (E.mask.x > vx1 || E.mask.x + E.mask.w < vx0) { E.off = true; return; }                       // поза екраном (телефон бачить ~третину кімнати) — не оновлюємо й не кладемо
      if (!E.q) { const Fc = E.Fc; E.q = [proj(Fc.O), proj(addv(Fc.O, Fc.A)), proj(addv(addv(Fc.O, Fc.A), Fc.B)), proj(addv(Fc.O, Fc.B))]; E.TS = Math.min(4, Math.max(2, Rd * 1.2)); }
      if (!E.out || E.off || E.Rd !== Rd || (fr + n) % (LIVE[E.id].every || 3) === 0) update(E, t, Rd);   // щойно повернулась на екран — одразу свіжа
      E.off = false; if (!E.empty) c.drawImage(E.out, E.mask.x, E.mask.y, E.mask.w, E.mask.h);
    });
  };
})();

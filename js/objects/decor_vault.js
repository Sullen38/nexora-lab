/* ============================================================================
 * objects/decor_vault.js — СХОВИЩЕ НАСІННЯ: живе (Декор стін · 20)
 * ----------------------------------------------------------------------------
 * Шафа з 21 кріокапсулою під далеким кінцем теплиці (розкладка — tools/wingbox/decor.py П5, малюнок — dc_paint.js PAINT.dc_vault,
 * геометрія комірок — NX.arc.VAULT.cell). Історія світу (docs/UNIVERSE.md): тут — насіння врятованих видів, яким живиться ферма.
 * Живе: капсули тихо світяться (кожна своїм кольором, дихають вразбіг), LED блимають; коли на фермі лоток засівають (decor_farm.js
 * trayAt: sow) — з капсули цього виду вилітає насінина й летить дугою в ліву шахту-сівалку свого ярусу; коли лоток збирають (harv) —
 * насінина летить назад з правої шахти в капсулу, капсула спалахує (поповнилась). Тап по капсулі — картка виду (objects/decor_guide.js).
 * Малює objects/decor_live.js (draw) у координатах кімнати; поза екраном (телефон) — не малюється.
 * ========================================================================== */
(() => {
  const DC = NX.decor, V = NX.arc.VAULT; if (!DC || !V) return;
  const X = NX.px3d, hash = NX.art.hash;
  let B = null, CAP = null, lastKind = null; const FLY = [], SEEN = {};
  /** Капсули на екрані (один раз): [{kind, row, col, x, y, w, h, cx, cy}]. */
  function caps() {
    if (CAP) return CAP; B = DC.byId.dc_vault; if (!B) return CAP = [];
    const { P } = NX.arc.kit.basis(B), fw = B.w, fh = B.yb - B.yt, at = (fx, fy) => X.proj(P(fx - fw / 2, -.1, B.yt + fy));
    CAP = [];
    for (let r = 0; r < 3; r++) for (let k = 0; k < 7; k++) { const q = V.cell(fw, fh, r, k), a = at(q.x, q.y), b = at(q.x + q.w, q.y + q.h), c = at(q.x + q.w / 2, q.y + q.h / 2);
      CAP.push({ kind: V.rows[r][k], row: r, col: k, x: Math.min(a[0], b[0]), y: Math.min(a[1], b[1]), w: Math.abs(b[0] - a[0]), h: Math.abs(b[1] - a[1]), cx: c[0], cy: c[1], col: V.col[V.rows[r][k]], glow: null }); }
    return CAP;
  }
  const glowOf = c => { if (c.glow) return c.glow; const n = 32, cv = document.createElement('canvas'); cv.width = cv.height = n; const g = cv.getContext('2d'), gr = g.createRadialGradient(n / 2, n / 2, 0, n / 2, n / 2, n / 2);
    gr.addColorStop(0, c.col); gr.addColorStop(.5, c.col + '66'); gr.addColorStop(1, c.col + '00'); g.fillStyle = gr; g.fillRect(0, 0, n, n); return c.glow = cv; };
  /** Події ферми: сівба -> насінина з капсули в ліву шахту; збір -> з правої шахти в капсулу. */
  function farmEvents(t) {
    const F = NX.decorFarm; if (!F || !F.shaft) return;
    for (const tr of F.TR) { const A = F.trayAt(tr, t), cap = CAP.find(c => c.kind === tr.kind); if (!cap) continue;
      if (A.sow >= 0 && A.sow < .6 && !(SEEN['s' + tr.k] > t - 30)) { SEEN['s' + tr.k] = t; const to = F.shaft(tr.row, 'left'); if (to) FLY.push({ x0: cap.cx, y0: cap.cy, x1: to[0], y1: to[1], t0: t, dur: 1.3, col: cap.col, cap, back: 0 }); }
      if (A.harv >= 0 && A.harv < .6 && !(SEEN['h' + tr.k] > t - 30)) { SEEN['h' + tr.k] = t; const fr = F.shaft(tr.row, 'right'); if (fr) FLY.push({ x0: fr[0], y0: fr[1], x1: cap.cx, y1: cap.cy, t0: t, dur: 1.5, col: cap.col, cap, back: 1 }); } }
  }
  function draw(c, t, vx0, vx1) {
    const C = caps(); if (!C.length || !B) return; const M = DC.byId.dc_vault; void M;
    farmEvents(t);
    const x0 = Math.min(...C.map(q => q.x)), x1 = Math.max(...C.map(q => q.x + q.w)); if (x1 < vx0 - 40 || x0 > vx1 + 40) return;
    c.save(); c.globalCompositeOperation = 'lighter';
    for (const q of C) { const ph = hash(q.row * 7 + q.col, 5) * 6.28, a = .16 + .1 * Math.sin(t * (.9 + .4 * hash(q.col, q.row)) + ph), fl = q.flash != null && t - q.flash < 1.2 ? 1 - (t - q.flash) / 1.2 : 0;
      c.globalAlpha = a + fl * .6; const r = Math.max(q.w, q.h) * (.9 + fl * .6); c.drawImage(glowOf(q), q.cx - r, q.cy - r, r * 2, r * 2);
      if (fl) { c.globalAlpha = fl; c.strokeStyle = '#d8ffe8'; c.lineWidth = .5; c.strokeRect(q.x - .6 - (1 - fl) * 2, q.y - .6 - (1 - fl) * 2, q.w + 1.2 + (1 - fl) * 4, q.h + 1.2 + (1 - fl) * 4); }
      if (Math.sin(t * 3 + ph) > .85) { c.globalAlpha = .9; c.fillStyle = '#3bff8a'; c.fillRect(q.cx - .35, q.y + q.h + .1, .7, .4); } }   // LED блимає
    for (let i = FLY.length - 1; i >= 0; i--) { const f = FLY[i], u = (t - f.t0) / f.dur; if (u >= 1) { FLY.splice(i, 1); if (f.back && f.cap) f.cap.flash = t; continue; } if (u < 0) continue;
      const e = u * u * (3 - 2 * u), x = f.x0 + (f.x1 - f.x0) * e, y = f.y0 + (f.y1 - f.y0) * e - Math.sin(u * Math.PI) * 14;
      if (f.bunch) { c.globalAlpha = .95; c.fillStyle = '#3bbf7a'; c.fillRect(x - 2, y - 1.2, 4, 2.4); c.fillStyle = '#9aff6a'; c.fillRect(x - 1.2, y - 2.2, 2.4, 1.4); c.fillRect(x + .4, y - 1.8, 1.2, 1); continue; }   // (· 30) пучок зелені
      c.globalAlpha = .9; c.fillStyle = f.col; c.fillRect(x - .7, y - .7, 1.4, 1.4); c.fillStyle = '#ffffff'; c.fillRect(x - .3, y - .3, .6, .6);
      for (let k = 1; k <= 4; k++) { const uu = Math.max(0, u - k * .05), ee = uu * uu * (3 - 2 * uu); c.globalAlpha = .5 - k * .1; c.fillRect(f.x0 + (f.x1 - f.x0) * ee - .35, f.y0 + (f.y1 - f.y0) * ee - Math.sin(uu * Math.PI) * 14 - .35, .7, .7); } }   // шлейф
    c.restore();
  }
  NX.decorVault = {
    caps, draw,
    /** Тап по капсулі -> true (вид — lastKind, картку показує objects/decor_guide.js). */
    tap(x, y, t) { for (const q of caps()) if (x >= q.x - 1.5 && x <= q.x + q.w + 1.5 && y >= q.y - 1.5 && y <= q.y + q.h + 1.5) { lastKind = q.kind; q.flash = t; return true; } return false; },
    get lastKind() { return lastKind; },
    /** Скільки насінин зараз летить (для перевірок). */
    flying() { return FLY.length; },
    /** (· 30) Пучок зелені з різака ярусу row летить у кошик Nexi (n) — зелений, 1 с. */
    harvestFx(row, n, t) { const F = NX.decorFarm; if (!F || !F.shaft) return; const fr = F.shaft(row, 'right'); if (!fr) return; const s = NX.room.scaleAt(Math.max(n.depthY(), 352)) / 1.45; FLY.push({ x0: fr[0], y0: fr[1], x1: n.x + n.dir * 10 * s, y1: n.y - 14 * s, t0: t, dur: 1, col: '#9aff6a', cap: null, back: 0, bunch: 1 }); },
    /** Для decor_check.js: нічого поза коробкою шафи (сяйво — світло, насінина — летить над зонами, як краплі дрона). */
  };
})();

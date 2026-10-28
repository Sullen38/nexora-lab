/* ============================================================================
 * world/floor_tiles.js — ПЛИТКА ПЕРЕДНЬОЇ ПІДЛОГИ (NX.floorTiles)
 * ----------------------------------------------------------------------------
 * Великі глянцеві плити в перспективі: шви вглиб сходяться до точки, з якою узгоджено масштаб персонажів
 * (NX.room.scaleAt), поперечні шви густіші вдалині; кожна плита трохи свого тону, ближня кромка шва ловить світло.
 * Плитка ЗАПІКАЄТЬСЯ в передню підлогу кімнати (world/room.js кличе NX.room.frontFx при кожній перебудові: зміна
 * розміру, латка з віддзеркаленням крил) — щокадру нічого не коштує.
 *   NX.floorTiles.paint(c, y0, y1, lw, fade) — плитка в контекст c (координати кімнати) для смуги y0..y1
 * ========================================================================== */
NX.floorTiles = (() => {
  const P = NX.px;
  // шви вглиб сходяться до (774, −31): саме так у кімнаті ростуть персонажі (NX.room.scaleAt) — плитка з ними узгоджена;
  // ширина плити на лінії 352 — 30 од.; поперечні шви — на рівних кроках глибини: y = yv + A / u (u — ціле)
  const TV = { xv: 774, yv: -31, w0: 30, y0: 352, A: 16000 };
  const seamX = (m, y) => TV.xv + m * TV.w0 * (y - TV.yv) / (TV.y0 - TV.yv), rowY = u => TV.yv + TV.A / u;
  /** lw — товщина шва (од.); fade — плитка проступає від y fade[0] до fade[1]. */
  function paint(c, y0, y1, lw, fade) {
    const W = NX.cfg.ROOM_W, uTop = Math.ceil(TV.A / (y0 - TV.yv)) + 1, uBot = Math.max(2, Math.floor(TV.A / (y1 - TV.yv))), mMin = -40, mMax = 40;
    c.save();
    for (let u = uBot; u <= uTop; u++) {                                         // тони плит: кожна плита — свій відтінок (темніша / з лавандовим полиском)
      const ya = Math.max(y0, rowY(u + 1)), yb = Math.min(y1, rowY(u)); if (yb <= ya) continue;
      for (let m = mMin; m < mMax; m++) {
        const xa0 = seamX(m, ya), xa1 = seamX(m + 1, ya), xb0 = seamX(m, yb), xb1 = seamX(m + 1, yb);
        if (Math.max(xa1, xb1) < 0 || Math.min(xa0, xb0) > W) continue;
        const h = P.hash(m * 31 + u * 7); if (h >= .3 && h <= .62) continue;
        const a = h > .62 ? .03 + (h - .62) * .09 : .05 + (.3 - h) * .22, k = fade ? P.clamp(((ya + yb) / 2 - fade[0]) / (fade[1] - fade[0]), 0, 1) : 1;
        c.fillStyle = h > .62 ? `rgba(150,120,255,${a * k})` : `rgba(0,0,14,${a * k})`;
        c.beginPath(); c.moveTo(xa0, ya); c.lineTo(xa1, ya); c.lineTo(xb1, yb); c.lineTo(xb0, yb); c.fill();
      }
    }
    const seams = new Path2D(), hi = new Path2D();                               // шви: вглиб і поперечні; світла кромка — трохи нижче поперечного шва
    for (let m = mMin; m <= mMax; m++) { const a = seamX(m, y0), b = seamX(m, y1); if (Math.max(a, b) < -50 || Math.min(a, b) > W + 50) continue; seams.moveTo(a, y0); seams.lineTo(b, y1); }
    for (let u = uBot; u <= uTop; u++) { const y = rowY(u), d = lw * .5 + .35 + (y - 336) * .004; if (y < y0 || y > y1) continue; seams.moveTo(-10, y); seams.lineTo(W + 10, y); hi.moveTo(-10, y + d); hi.lineTo(W + 10, y + d); }
    const grad = (rgb, a) => { if (!fade) return `rgba(${rgb},${a})`; const g = c.createLinearGradient(0, fade[0], 0, fade[1]); g.addColorStop(0, `rgba(${rgb},0)`); g.addColorStop(1, `rgba(${rgb},${a})`); return g; };
    c.lineWidth = lw; c.strokeStyle = grad('4,2,18', .52); c.stroke(seams);
    c.lineWidth = lw * .8; c.strokeStyle = grad('170,140,255', .14); c.stroke(hi);
    c.restore();
  }
  // передня підлога кімнати: плитка на всю ширину (запікається в полотно підлоги)
  NX.room.frontFx = (c, x0, x1, front) => {
    const H2 = NX.cfg.ROOM_H; c.save(); c.beginPath(); c.rect(x0, H2, x1 - x0, front + 2); c.clip(); paint(c, H2, H2 + front + 2, 1 / NX.room.FR); c.restore();
  };
  return { paint };
})();

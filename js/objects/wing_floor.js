/* ============================================================================
 * objects/wing_floor.js — ГЛЯНЦЕВА ПІДЛОГА ЛІВОГО КРИЛА (віддзеркалення, як у дивана)
 * ----------------------------------------------------------------------------
 * Під столами AI-центру, аналітики й маркетингу та кріслами підлога відбиває
 * те, що стоїть на ній: раз на 3 кадри кадр крила (столи, крісла, вазони,
 * кавомашина) малюється в окреме полотно, перевертається від лінії підлоги
 * і кладеться напівпрозоро з затуханням донизу та вертикальними "смугами
 * глянцю" (як у objects/sofa.js). Nexi і кіт відбиваються через refl:true у
 * loop.js — їх тут не чіпаємо. Лінія підлоги: у AI-стола вона коса
 * (NX.aiDesk.bot), у решти — 352..369.
 * ========================================================================== */
(() => {
  const P = NX.px, X0 = 20, X1 = 680, Y0 = 250, H = 130;
  let CV = null, cx = null, fr = 0;
  NX.addObject({
    id: 'wingFloor',
    drawBack(c, t) {
      const Kk = NX.cam.k * (NX.loop.dpr || 1), R = Math.min(2, Math.ceil(Kk * 2) / 2);
      if (!CV || CV.width !== Math.round((X1 - X0) * R)) { CV = document.createElement('canvas'); CV.width = Math.round((X1 - X0) * R); CV.height = Math.round(H * R); cx = CV.getContext('2d'); fr = 0; }
      if ((fr++ % 3) === 0) {
        cx.setTransform(1, 0, 0, 1, 0, 0); cx.clearRect(0, 0, CV.width, CV.height); cx.setTransform(R, 0, 0, R, -X0 * R, -Y0 * R); cx.imageSmoothingEnabled = true;
        // кадр крила: столи (drawBack-об'єкти) + шари меблів у зоні (стіл AI, речі, крісла, вазони, кавомашина)
        ['analytics', 'marketing'].forEach(id => { const o = NX.objects[id]; if (o && o.drawBack) o.drawBack(cx, t); });
        const L = [];
        ['aiDesk', 'aiPc', 'analyticsChair', 'marketingChair', 'coffee', 'catCorner'].forEach(id => { const o = NX.objects[id]; if (o && o.layers) L.push(...o.layers(t)); });
        Object.values(NX.objects).forEach(o => { if (o.id.startsWith('ws_') && o.d.stage === 'layer' && o.d.x < 660) L.push(...o.layers(t)); });
        L.filter(Boolean).sort((a, b) => a.y - b.y).forEach(l => l.draw(cx, t));
        // затухання знизу вгору (в оригіналі — далі від лінії підлоги блідіше) і смуги глянцю
        cx.globalCompositeOperation = 'destination-in'; cx.setTransform(1, 0, 0, 1, 0, 0);
        const g = cx.createLinearGradient(0, 0, 0, CV.height); g.addColorStop(0, 'rgba(0,0,0,0)'); g.addColorStop(.45, 'rgba(0,0,0,.35)'); g.addColorStop(1, 'rgba(0,0,0,1)'); cx.fillStyle = g; cx.fillRect(0, 0, CV.width, CV.height);
        cx.globalCompositeOperation = 'destination-out';
        for (let i = 0; i < CV.width; i += 3) { const h = P.hash(i, 7); if (h > .55) { cx.fillStyle = `rgba(0,0,0,${(h - .55) * 1.6})`; cx.fillRect(i, 0, 2, CV.height); } }
        cx.globalCompositeOperation = 'source-over';
      }
      // кладемо перевернуте від лінії підлоги: ліворуч (під AI-столом) лінія коса — ріжемо на 2 частини з різними осями
      const put = (xa, xb, line) => { c.save(); c.beginPath(); c.rect(xa, line, xb - xa, 120); c.clip(); c.translate(0, line * 2); c.scale(1, -1); c.globalAlpha = .26; c.imageSmoothingEnabled = true;
        c.drawImage(CV, (xa - X0) * R, 0, (xb - xa) * R, CV.height, xa, Y0, xb - xa, H); c.restore(); };
      put(X0, 342, 361.5); put(342, X1, 352);
      // світлові "доріжки" від неону столів на підлозі
      c.save(); c.globalCompositeOperation = 'lighter';
      const sw = c.createLinearGradient(0, 352, 0, 420); sw.addColorStop(0, 'rgba(255,79,216,.12)'); sw.addColorStop(1, 'rgba(255,79,216,0)'); c.fillStyle = sw; c.fillRect(316, 352, 364, 68);
      c.restore();
    },
  });
})();

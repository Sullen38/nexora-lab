/* ============================================================================
 * objects/wing_floor.js — ГЛЯНЦЕВА ПІДЛОГА ЛІВОГО КРИЛА (віддзеркалення, як у дивана)
 * ----------------------------------------------------------------------------
 * Під столами трьох зон, кріслами й рослинами підлога відбиває те, що на ній
 * стоїть: раз на 3 кадри кадр крила (столи з речами — NX.kit.reflectors,
 * крісла, кавомашина, куток кота, рослини на підлозі) малюється в окреме
 * полотно, перевертається від лінії підлоги і кладеться напівпрозоро із
 * затуханням донизу та вертикальними "смугами глянцю". Nexi й кіт
 * відбиваються через refl:true у loop.js — їх тут не чіпаємо.
 * Лінія підлоги: під столом AI-центру 362, далі 346 (аналітика) і 338 (маркетинг).
 * ========================================================================== */
(() => {
  const P = NX.px, K = NX.kit, X0 = 0, X1 = 680, Y0 = 240, H = 130;
  let CV = null, cx = null, fr = 0;
  NX.addObject({
    id: 'wingFloor',
    drawBack(c, t) {
      if (c.isRefl) return;
      const Kk = NX.cam.k * (NX.loop.dpr || 1), R = Math.min(2, Math.ceil(Kk * 2) / 2);
      if (!CV || CV.width !== Math.round((X1 - X0) * R)) { CV = document.createElement('canvas'); CV.width = Math.round((X1 - X0) * R); CV.height = Math.round(H * R); cx = CV.getContext('2d'); fr = 0; }
      if ((fr++ % 3) === 0) {
        cx.setTransform(1, 0, 0, 1, 0, 0); cx.clearRect(0, 0, CV.width, CV.height); cx.setTransform(R, 0, 0, R, -X0 * R, -Y0 * R); cx.imageSmoothingEnabled = true;
        K.reflectors.forEach(f => f(cx, t));
        const L = []; ['analyticsChair', 'marketingChair', 'coffee', 'catCorner'].forEach(id => { const o = NX.objects[id]; if (o && o.layers) L.push(...o.layers(t)); });
        Object.values(NX.objects).forEach(o => { if (o.id.startsWith('wp_') && o.d.stage === 'layer') L.push(...o.layers(t)); });
        L.filter(Boolean).sort((a, b) => a.y - b.y).forEach(l => l.draw(cx, t));
        cx.globalCompositeOperation = 'destination-in'; cx.setTransform(1, 0, 0, 1, 0, 0);
        const g = cx.createLinearGradient(0, 0, 0, CV.height); g.addColorStop(0, 'rgba(0,0,0,0)'); g.addColorStop(.45, 'rgba(0,0,0,.35)'); g.addColorStop(1, 'rgba(0,0,0,1)'); cx.fillStyle = g; cx.fillRect(0, 0, CV.width, CV.height);
        cx.globalCompositeOperation = 'destination-out';
        for (let i = 0; i < CV.width; i += 3) { const h = P.hash(i, 7); if (h > .55) { cx.fillStyle = `rgba(0,0,0,${(h - .55) * 1.6})`; cx.fillRect(i, 0, 2, CV.height); } }
        cx.globalCompositeOperation = 'source-over';
      }
      const put = (xa, xb, line) => { c.save(); c.beginPath(); c.rect(xa, line, xb - xa, 120); c.clip(); c.translate(0, line * 2); c.scale(1, -1); c.globalAlpha = .34; c.imageSmoothingEnabled = true; c.drawImage(CV, (xa - X0) * R, 0, (xb - xa) * R, CV.height, xa, Y0, xb - xa, H); c.restore(); };
      put(X0, 326, 362); put(326, 486, 346); put(486, X1, 338);
      c.save(); c.globalCompositeOperation = 'lighter';                                                        // світлові доріжки від неону столів
      const sw = c.createLinearGradient(0, 338, 0, 420); sw.addColorStop(0, 'rgba(255,79,216,.14)'); sw.addColorStop(1, 'rgba(255,79,216,0)'); c.fillStyle = sw; c.fillRect(326, 338, 340, 82);
      const sw2 = c.createLinearGradient(0, 362, 0, 430); sw2.addColorStop(0, 'rgba(255,79,216,.12)'); sw2.addColorStop(1, 'rgba(255,79,216,0)'); c.fillStyle = sw2; c.fillRect(22, 362, 304, 68);
      c.restore();
    },
  });
  /* СЯЙВО КРИЛА (bloom): розмиті яскраві місця нерухомої копії крила (NX.wing.bloom, рахує wing_wall.js)
   * кладуться світлом поверх стіни, столів і будок — м'які ореоли навколо неону, екранів і ліхтарів, як на картинці.
   * Малюється після всіх drawBack крила (перед Nexi й котом), повільно "дихає". */
  NX.addObject({
    id: 'wingGlow',
    drawBack(c, t) {
      const B = NX.wing.bloom; if (!B || c.isRefl) return;
      const { ROOM_W: W, ROOM_H: H } = NX.cfg, br = .9 + .1 * Math.sin(t * .9);
      c.save(); c.beginPath(); c.rect(0, -40, 664, H + 60); c.clip(); c.globalCompositeOperation = 'lighter'; c.imageSmoothingEnabled = true;
      [[B[0], .1], [B[1], .2], [B[2], .3]].forEach(([b, a]) => { c.globalAlpha = a * br; c.drawImage(b, 0, 0, W, H); });
      c.restore();
    },
  });
})();

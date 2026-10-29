/* ============================================================================
 * objects/marketing.js — МАРКЕТИНГ: ЖИВИЙ ОБ'ЄКТ
 * ----------------------------------------------------------------------------
 * Нерухома частина (стіл, будка з утопленим екраном, проєктори) — у 3D-розкладці (gen_room.py: marketing(); малюнки граней
 * і живий екран — objects/mk_paint.js); крісло — objects/mk_chair.js. Тут — те, що живе поверх (власник, 29.10: «монітори —
 * трохи голограмні; ефекти, фішечки; щоб Nexi з відділом взаємодіяв»):
 *   ГОЛО-МОНІТОРИ над проєкторами на столі: напівпрозорі панелі в конусі світла, трохи повернуті до крісла, з живими
 *     графіками (лайки — лінія з вогниками, охоплення — стовпчики й «пончик»), скан-лініями, мерехтінням і глітчем;
 *   ГОЛО-КЛАВІАТУРА на столі — з'являється, коли Nexi працює (клавіші спалахують під пальцями);
 *   ПОСТИ Й ЛАЙКИ: коли Nexi працює, з екрана вилітають сердечка, «+N», а на етапах задачі — голо-картка нового поста.
 * Стан для екрана й Nexi: active / prog (задача, nexi.js: work.obj = 'marketing'), boost — скільки Nexi вже напрацював
 * (лічильники на екрані ростуть швидше). Координати — px картинки зони -> світ -> екран (NX.arc.zone).
 * ========================================================================== */
(() => {
  const P = NX.px, F = NX.furn, T = NX.arc.pt, proj = NX.px3d.proj;
  let Z = null; const zone = () => Z || (Z = NX.arc.zone && NX.arc.zone('marketing'));
  const PANES = [{ side: -1, X: 489, kind: 'likes' }, { side: 1, X: 689, kind: 'reach' }];
  PANES.forEach(p => { p.cv = document.createElement('canvas'); p.cv.width = 132; p.cv.height = 92; p.x = p.cv.getContext('2d'); });
  const FX = { items: [], cards: [], mile: 0 };

  /** Вміст голо-монітора (полотно 132×92): скло, рамка з кутиками, заголовок з іконкою, графік; скан-лінії. */
  function paintPane(p, t) {
    const c = p.x, w = p.cv.width, h = p.cv.height; c.setTransform(1, 0, 0, 1, 0, 0); c.clearRect(0, 0, w, h);
    const g = c.createLinearGradient(0, 0, 0, h); g.addColorStop(0, 'rgba(90,190,255,.42)'); g.addColorStop(.5, 'rgba(40,120,255,.26)'); g.addColorStop(1, 'rgba(30,80,220,.34)'); c.fillStyle = g; c.fillRect(0, 0, w, h);
    c.strokeStyle = 'rgba(150,240,255,.85)'; c.lineWidth = 2; c.strokeRect(1, 1, w - 2, h - 2);
    c.fillStyle = '#e8feff'; [[0, 0], [w - 9, 0], [0, h - 3], [w - 9, h - 3]].forEach(([x, y]) => c.fillRect(x, y, 9, 3)); [[0, 0], [w - 3, 0], [0, h - 9], [w - 3, h - 9]].forEach(([x, y]) => c.fillRect(x, y, 3, 9));
    const head = p.kind === 'likes' ? ['heart', '#ff6ad8'] : ['eye', '#9af6ff'];
    T.icon(c, head[0], 12, 12, 11, head[1]); NX.arc.kit.txt(c, NX.t('scene.marketing.' + p.kind), 22, 12, w - 34, 9, '#e8feff', { align: 'left', glow: '#3be8ff' });
    c.fillStyle = 'rgba(160,230,255,.5)'; c.fillRect(6, 22, w - 12, 1);
    if (p.kind === 'likes') {                                                          // лінія лайків з вогниками, площа під нею, «+N»
      const n = 14, pts = []; for (let i = 0; i <= n; i++) pts.push([8 + i / n * (w - 16), h - 12 - (h - 42) * (.25 + .55 * (.5 + .5 * Math.sin(i * .62 + t * 1.3)) * (.35 + .65 * i / n))]);
      c.beginPath(); c.moveTo(8, h - 10); pts.forEach(q => c.lineTo(q[0], q[1])); c.lineTo(w - 8, h - 10); c.closePath(); c.fillStyle = 'rgba(255,90,220,.22)'; c.fill();
      c.strokeStyle = '#ff7af0'; c.lineWidth = 2; c.beginPath(); pts.forEach((q, i) => i ? c.lineTo(q[0], q[1]) : c.moveTo(q[0], q[1])); c.stroke();
      pts.forEach((q, i) => { if (i % 3) return; c.fillStyle = '#ffffff'; c.fillRect(q[0] - 1.5, q[1] - 1.5, 3, 3); });
      NX.arc.kit.txt(c, '+' + (120 + Math.floor(t * 3) % 80), w - 26, 33, 40, 8, '#ffc4f0');
    } else {                                                                          // стовпчики охоплення + «пончик»
      for (let i = 0; i < 6; i++) { const v = .3 + .7 * Math.abs(Math.sin(i * 1.3 + t * .9)), bh = v * (h - 44), x = 10 + i * 12; const g2 = c.createLinearGradient(0, h - 10 - bh, 0, h - 10); g2.addColorStop(0, '#e8feff'); g2.addColorStop(.25, '#5ae8ff'); g2.addColorStop(1, '#1a5ad0'); c.fillStyle = g2; c.fillRect(x, h - 10 - bh, 8, bh); }
      const cx = w - 30, cy = h * .6, r = 17, a0 = t * .7; [[.62, '#3be8ff'], [.25, '#ff4fd8'], [.13, '#9a8cff']].reduce((a, [f, col]) => { c.strokeStyle = col; c.lineWidth = 7; c.beginPath(); c.arc(cx, cy, r, a, a + f * Math.PI * 2 - .08); c.stroke(); return a + f * Math.PI * 2; }, a0);
      NX.arc.kit.txt(c, '72%', cx, cy, 22, 7, '#e8feff');
    }
    c.fillStyle = 'rgba(0,0,0,.22)'; for (let y = 0; y < h; y += 3) c.fillRect(0, y, w, 1);   // скан-лінії
  }

  const M = NX.addObject({
    id: 'marketing', name: 'obj.marketing', act: 'marketing', active: false, prog: 0, boost: 0,
    get span() { const z = zone(); return z && z.box ? [z.box[0] - 40, z.box[1] + 50] : null; },              // box (розкладка) — [x0, x1, y0, y1] на екрані
    get hit() { const z = zone(); if (!z || !z.box) return null; const [x0, x1, y0, y1] = z.box; return { x: x0, y: y0, w: x1 - x0, h: y1 - y0 - 8 }; },
    ready() { return !!zone(); },
    update(dt, t) {
      if (!zone()) return;
      if (this.active) {
        this.boost += dt;
        if (Math.random() < dt * 5) this.spawn(t);
        const m = this.prog > .85 ? 3 : this.prog > .55 ? 2 : this.prog > .25 ? 1 : 0; if (m > FX.mile) { FX.mile = m; this.card(t); }
      } else { FX.mile = 0; if (Math.random() < dt * .35) this.spawn(t); }
      FX.items = FX.items.filter(o => (o.a += dt) < o.ttl); FX.items.forEach(o => { o.x += o.vx * dt; o.y += o.vy * dt; o.vy *= Math.pow(.6, dt); });
      FX.cards = FX.cards.filter(o => (o.a += dt) < o.ttl);
    },
    /** Сердечко / іконка / «+N», що вилітає з екрана будки. */
    spawn(t) {
      const z = zone(), s = z.S(589, 160, 60), r = Math.random(), K = ['heart', 'heart', 'chat', 'share', 'at', 'eye'];
      FX.items.push({ x: s[0] + (Math.random() - .5) * 120, y: s[1] + 40 * Math.random(), vx: (Math.random() - .5) * 8, vy: -22 - Math.random() * 16, a: 0, ttl: 1.8 + Math.random(),
        ic: r < .25 ? null : K[Math.random() * K.length | 0], txt: r < .25 ? '+' + (1 + Math.floor(Math.random() * 40)) : null, col: Math.random() < .55 ? '#ff6ad8' : '#9af6ff' });
    },
    /** Голо-картка нового поста: вилітає з екрана, збільшується, підіймається над будкою й тане. */
    card(t) { const z = zone(), s = z.S(589, 200, 62); FX.cards.push({ x: s[0], y: s[1], a: 0, ttl: 2.6, seed: Math.floor(t * 7) }); for (let i = 0; i < 6; i++) this.spawn(t); },
    drawBack(c, t) {
      const z = zone(); if (!z) return;
      // ГОЛО-МОНІТОРИ над проєкторами
      PANES.forEach((p, n) => {
        const lens = proj(z.anchor(sd2(p)) || z.W(p.X, 276, 26)), sd = p.side, cx = lens[0] + sd * 5, by = lens[1] - 8, Wd = 56, Hd = 39;   // панель трохи назовні від лінзи
        if ((NX.loop.frames + n) % 3 === 0 || !p.ok) { paintPane(p, t); p.ok = 1; }
        const xo = cx - Wd / 2, xi = cx + Wd / 2, inner = sd < 0 ? xi : xo, dyI = 2.2;                       // внутрішній край (до крісла) — далі й нижчий
        const q = sd < 0 ? [[xo, by - Hd], [xi, by - Hd + dyI], [xi, by - dyI * .6], [xo, by]] : [[xo, by - Hd + dyI], [xi, by - Hd], [xi, by], [xo, by - dyI * .6]];
        const fl = .82 + .18 * Math.sin(t * 19 + n) * Math.sin(t * 5.3), gl = Math.sin(t * 1.3 + n * 2) > .985 ? (Math.random() - .5) * 3 : 0;
        c.save(); c.globalCompositeOperation = 'lighter';                                                      // конус світла з лінзи
        const g = c.createLinearGradient(0, lens[1], 0, by); g.addColorStop(0, 'rgba(150,240,255,.45)'); g.addColorStop(1, 'rgba(90,190,255,.08)'); c.fillStyle = g;
        c.beginPath(); c.moveTo(lens[0] - 4, lens[1]); c.lineTo(lens[0] + 4, lens[1]); c.lineTo(q[2][0], q[2][1]); c.lineTo(q[3][0], q[3][1]); c.closePath(); c.fill();
        P.glow(c, lens[0], lens[1], 10, 'rgba(150,240,255,.9)', .7); c.restore();
        c.save(); c.globalAlpha = .9 * fl; c.imageSmoothingEnabled = true; c.translate(gl, 0); F.warp(c, p.cv, q, 1.2);
        c.globalCompositeOperation = 'lighter'; c.globalAlpha = .3 * fl; F.warp(c, p.cv, q, 2.4); c.restore();
      });
      // ГОЛО-КЛАВІАТУРА (коли Nexi працює): на стільниці перед будкою, клавіші спалахують
      const kA = this.active ? 1 : 0; this.kb = (this.kb || 0) + (kA - (this.kb || 0)) * .12;
      if (this.kb > .03) {
        const yT = 282, q = [z.W(551, yT, 16), z.W(627, yT, 16), z.W(631, yT, 4), z.W(547, yT, 4)].map(proj), at = (u, v) => [q[0][0] + (q[1][0] - q[0][0]) * u + ((q[3][0] - q[0][0]) + ((q[2][0] - q[1][0]) - (q[3][0] - q[0][0])) * u) * v, q[0][1] + (q[3][1] - q[0][1]) * v];
        c.save(); c.globalCompositeOperation = 'lighter'; c.globalAlpha = this.kb;
        c.fillStyle = 'rgba(60,170,255,.22)'; c.beginPath(); q.forEach((p, i) => i ? c.lineTo(p[0], p[1]) : c.moveTo(p[0], p[1])); c.closePath(); c.fill(); c.strokeStyle = 'rgba(150,240,255,.8)'; c.lineWidth = .5; c.stroke();
        for (let r = 0; r < 3; r++) for (let k = 0; k < 12; k++) { const p0 = at((k + .15) / 12, (r + .2) / 3), p1 = at((k + .85) / 12, (r + .8) / 3), on = hashOn(k, r, t); c.fillStyle = on ? '#e8feff' : 'rgba(120,220,255,.45)'; c.fillRect(p0[0], p0[1], p1[0] - p0[0], Math.max(.5, p1[1] - p0[1])); }
        c.restore();
      }
      // сердечка, іконки, «+N»
      c.save(); FX.items.forEach(o => { const al = Math.sin(o.a / o.ttl * Math.PI); c.globalAlpha = al;
        if (o.ic) { P.glow(c, o.x, o.y, 6, o.col === '#ff6ad8' ? 'rgba(255,90,220,.6)' : 'rgba(120,230,255,.6)', al * .6); T.icon(c, o.ic, o.x, o.y, 5, o.col); }
        else { c.font = '4px "Press Start 2P", monospace'; c.fillStyle = o.col; c.textAlign = 'center'; c.fillText(o.txt, o.x, o.y); c.textAlign = 'left'; } });
      c.restore();
      // голо-картки нових постів
      FX.cards.forEach(o => {
        const k = o.a / o.ttl, sc = Math.min(1, o.a / .35), w = 38 * (.5 + .5 * sc), h = 25 * (.5 + .5 * sc), x = o.x - w / 2, y = o.y - h / 2 - Math.max(0, o.a - .5) * 30, al = k < .75 ? 1 : (1 - k) / .25;
        c.save(); c.globalAlpha = al * .92; c.fillStyle = 'rgba(14,50,150,.82)'; T.rr(c, x, y, w, h, 2); c.fill(); c.strokeStyle = '#9af6ff'; c.lineWidth = .7; T.rr(c, x, y, w, h, 2); c.stroke();
        const col = ['#ff7ad0', '#ffd27a', '#7af4ff'][o.seed % 3]; c.fillStyle = col; c.beginPath(); c.arc(x + h * .24, y + h * .24, h * .12, 0, 7); c.fill();
        c.fillStyle = 'rgba(220,245,255,.9)'; c.fillRect(x + h * .45, y + h * .17, w * .45, .9); c.fillStyle = 'rgba(160,210,255,.7)'; c.fillRect(x + h * .45, y + h * .3, w * .3, .7);
        const g = c.createLinearGradient(0, y + h * .45, 0, y + h * .9); g.addColorStop(0, col); g.addColorStop(1, '#1a3a8a'); c.fillStyle = g; c.fillRect(x + w * .08, y + h * .45, w * .58, h * .42);
        T.icon(c, 'heart', x + w * .82, y + h * .66, h * .26, '#ff4fd8'); c.globalCompositeOperation = 'lighter'; P.glow(c, o.x, y + h / 2, w * .8, 'rgba(120,200,255,.5)', al * .5); c.restore();
      });
    },
  });
  function sd2(p) { return p.side < 0 ? 'mkProjL' : 'mkProjR'; }                      // якір лінзи проєктора (розкладка)
  /** Яка клавіша голо-клавіатури зараз «натиснута» (детерміновано від часу — без випадкового мерехтіння всього ряду). */
  function hashOn(k, r, t) { const n = Math.floor(t * 9); return NX.art.hash(k * 7 + r * 31, n % 97) > .86; }
})();

/* ============================================================================
 * objects/mk_chair.js — КРІСЛО МАРКЕТИНГУ (Nexi сідає й працює)
 * ----------------------------------------------------------------------------
 * Власник (29.10): «до відділу маркетингу додай крісло, на яке Nexi буде сідати й взаємодіяти з відділом».
 * Справжня 3D-модель (рушій піксельного 3D — core/px3d.js, матеріали — objects/arc_kit.js), що ОБЕРТАЄТЬСЯ: геймерське
 * крісло в стилі кімнати — темне сидіння й спинка зі стьобкою «ромбом», рожеві канти, рожева подушка під голову, підлокітники,
 * хромований газліфт, хрестовина з коліщатками, рожеве LED-кільце під сидінням (світиться).
 *   Кадр під кут повороту рендериться в растр (z-буфер, контур) і кешується (кілька останніх кутів);
 *   растр ділиться на ДВА ШАРИ за глибиною: те, що ближче до глядача, ніж сидіння (спинка, коли крісло дивиться до екрана),
 *   малюється ПОВЕРХ Nexi, решта — під ним (core/loop.js: layers()).
 * API (activities.js -> marketing): ready(), side() — де стати біля крісла, seat() — куди сісти, depth() — глибина Nexi,
 *   turnTo(кут) — повернутись (0 — до глядача, 180 — до екрана, 270 — праворуч), sitDown() / standUp().
 * ========================================================================== */
(() => {
  const X = NX.px3d, A = NX.arc.kit, PL = A.PAL, P = NX.px, FL = 372, R = 4, K = 1.5, { ramp } = X;
  let Z = null; const zone = () => Z || (Z = NX.arc.zone && NX.arc.zone('marketing'));
  // частини: [id, u (середина, праворуч), v0 (передній край, + — назад), ширина, глибина, низ, верх (над підлогою), матеріал, додатково]
  // розмір — під Nexi: сидіння ~ на третині його зросту, спинка нижча за голову (ззаду видно голову й антену)
  const PARTS = [
    ['seat', 0, -13.5, 30, 27, 15, 21, 'cush'], ['back', 0, 10, 28, 6.5, 20, 38.5, 'cush', { ch: 6 }], ['head', 0, 8.4, 16, 3, 31, 37.5, 'pink'],
    ['armL', -16.8, -6, 4.4, 17, 25.5, 28, 'arm'], ['armR', 16.8, -6, 4.4, 17, 25.5, 28, 'arm'], ['postL', -16.8, 2.6, 2.6, 3, 20.5, 25.5, 'steel'], ['postR', 16.8, 2.6, 2.6, 3, 20.5, 25.5, 'steel'],
    ['plate', 0, -7, 16, 14, 13.4, 15, 'steel'], ['ring', 0, -12.5, 25, 25, 13, 13.9, 'led', { cyl: 28 }], ['lift', 0, -3.2, 6.4, 6.4, 3.6, 13.4, 'chrome', { cyl: 16 }],
  ];
  const MAT = { cush: { pal: PL.DESK, q: .52 }, pink: { pal: PL.PINKP, q: .58 }, arm: { pal: PL.MET, q: .45 }, steel: { pal: PL.STEEL, q: .55 }, chrome: { pal: PL.CHROME, q: .55, metal: 1 }, led: { pal: PL.PINKP, q: .92, emit: 1 } };
  /** Стьобка «ромбом» з рожевим кантом (сидіння зверху, спинка спереду) і задня панель спинки з неоновим «N». */
  const quilt = (c, fw, fh) => { c.fillStyle = 'rgba(0,0,0,0)'; const s = Math.min(fw, fh) / 3.2; c.strokeStyle = 'rgba(12,6,34,.75)'; c.lineWidth = .45;
    for (let k = -6; k < 8; k++) { c.beginPath(); c.moveTo(k * s, 0); c.lineTo(k * s + fh, fh); c.stroke(); c.beginPath(); c.moveTo(k * s, fh); c.lineTo(k * s + fh, 0); c.stroke(); }
    c.fillStyle = 'rgba(140,110,240,.35)'; for (let y = s / 2; y < fh; y += s) for (let x = s / 2 + ((y / s | 0) % 2) * s / 2; x < fw; x += s) c.fillRect(x - .3, y - .3, .6, .6);
    c.strokeStyle = '#ff4fd8'; c.lineWidth = .7; c.strokeRect(.6, .6, fw - 1.2, fh - 1.2); };
  const backPanel = (c, fw, fh) => { c.fillStyle = 'rgba(8,4,24,.55)'; c.fillRect(fw * .08, fh * .06, fw * .84, fh * .88);
    [.2, .8].forEach(f => A.neon(c, fw * f, fh * .1, fw * f, fh * .9, '#3be8ff', .7));
    c.strokeStyle = '#ff4fd8'; c.lineWidth = 1.1; c.lineJoin = 'round'; const x0 = fw * .38, x1 = fw * .62, y0 = fh * .32, y1 = fh * .62; c.beginPath(); c.moveTo(x0, y1); c.lineTo(x0, y0); c.lineTo(x1, y1); c.lineTo(x1, y0); c.stroke();
    c.strokeStyle = '#ffd6f6'; c.lineWidth = .35; c.stroke(); };
  const cache = new Map(); let Lr = null, img = null, box = null;

  /** Растр крісла під кут a (градуси): {back, front} — два полотна (позаду / попереду Nexi), x0, y0, w, h (од. кімнати). */
  function render(a) {
    const key = ((Math.round(a / 4) * 4) % 360 + 360) % 360; if (cache.has(key)) return cache.get(key);
    const z = zone(), C = z.W(589, 337, -24), b = A.basis({ x: C[0], z: C[2], turn: key }), Pt = (u, v, h) => b.P(u * K, v * K, FL - h * K);
    if (!Lr) {                                                                         // растр — один на всі кути (межі з запасом)
      const pts = []; for (let q = 0; q < 8; q++) { const an = q / 8 * Math.PI * 2; [0, 46].forEach(h => pts.push(X.proj([C[0] + Math.cos(an) * 24 * K, FL - h * K, C[2] + Math.sin(an) * 24 * K]))); }
      box = [Math.min(...pts.map(p => p[0])) - 3, Math.min(...pts.map(p => p[1])) - 3, Math.max(...pts.map(p => p[0])) + 3, Math.max(...pts.map(p => p[1])) + 3];
      Lr = X.Layer(box[0], box[1], box[2], box[3], R); img = new ImageData(new Uint8ClampedArray(Lr.c.buffer), Lr.W, Lr.H);
    }
    const L = Lr; L.c.fill(0); L.dep.fill(Infinity); L.id.fill(0); L.fid.fill(0); L.fl.fill(0);
    const front = new Set(), zc = C[2];
    PARTS.forEach(([nm, u, v0, w, d, h0, h1, mat, ex = {}], n) => {
      const id = n + 1, p0 = Pt(u, v0, 0), B = { x: p0[0], z: p0[2], turn: key, w: w * K, dep: d * K, yb: FL - h0 * K, yt: FL - h1 * K, ch: ex.ch ? [ex.ch * K, ex.ch * K] : null, cyl: ex.cyl, id: 'chair_' + nm };
      const mid = Pt(u, v0 + d / 2, 0); if (mid[2] < zc - 1.5) front.add(id);
      for (const Fc of A.faces(B)) {
        if (!A.visible(Fc)) continue;
        let tex = null; if (nm === 'seat' && Fc.k === 'top') tex = A.texture(B, Fc, R, quilt); else if (nm === 'back' && Fc.k === 'front') tex = A.texture(B, Fc, R, quilt); else if (nm === 'back' && Fc.k === 'back') tex = A.texture(B, Fc, R, backPanel);
        const sh = A.shader('chair', Fc, B, Object.assign({ bev: .9, ins: 0, fog: 0 }, MAT[mat], { tex }));
        X.face(L, Fc.poly, Fc.O, Fc.A, Fc.B, sh, { id, fid: id, n: Fc.n });
      }
    });
    // хрестовина: 5 променів-трубок з коліщатками
    const hub = Pt(0, 0, 4), base = PARTS.length + 1;
    for (let q = 0; q < 5; q++) { const an = q / 5 * Math.PI * 2 + .3, tip = Pt(Math.cos(an) * 15, Math.sin(an) * 15, 2.6), wh = Pt(Math.cos(an) * 15.5, Math.sin(an) * 15.5, 1.7);
      X.tube(L, hub, tip, 2.4 * K, (u0, v0, i, j) => ramp(PL.CHROME, .25 + (1 - Math.abs(u0 - .38) * 2) * .55, i, j), { id: base, fid: base });
      X.disc(L, wh, 1.9 * K, (u0, v0, i, j) => { const dd = Math.hypot(u0 - .5, v0 - .5); return dd > .36 ? ramp(PL.DARK, .5, i, j) : ramp(PL.STEEL, .7 - dd, i, j); }, { id: base + 1, fid: base + 1 }); }
    X.outline(L, () => A.C.out, 2);
    // ділимо растр на два шари: позаду Nexi (сидіння, хрестовина, …) і попереду (спинка, коли крісло дивиться до екрана)
    const mk = sel => { const cv = document.createElement('canvas'); cv.width = L.W; cv.height = L.H; const x = cv.getContext('2d'), im = x.createImageData(L.W, L.H), d = new Uint32Array(im.data.buffer);
      for (let k = 0; k < L.c.length; k++) if (L.c[k] && sel(L.id[k])) d[k] = L.c[k]; x.putImageData(im, 0, 0); return cv; };
    const out = { back: mk(id => !front.has(id)), front: mk(id => front.has(id)), x0: L.x0, y0: L.y0, w: L.W / R, h: L.H / R };
    cache.set(key, out); if (cache.size > 8) cache.delete(cache.keys().next().value);
    return out;
  }

  const ch = NX.addObject({
    id: 'mkChair', name: 'obj.marketing', act: 'marketing',
    a: 166, tgt: 166, seated: false, idleT: 4,
    ready() { return !!zone(); },
    /** Точка підлоги під серединою крісла (екран) і глибина — для порядку малювання з Nexi. */
    floor() { return X.proj(zone().W(589, 337, -24)); },
    depth() { return this.floor()[1]; },
    side() { const f = this.floor(); return [f[0] + 44, Math.max(362, f[1] + 6)]; },
    seat() { const z = zone(), C = z.W(589, 337, -24); return X.proj([C[0], FL - 21 * K, C[2] + 2]); },
    turnTo(deg) { let d = deg; while (d - this.a > 180) d -= 360; while (d - this.a < -180) d += 360; this.tgt = d; },
    spin(deg) { this.tgt = this.a + deg; },                                                 // повний оберт (на радощах)
    sitDown() { this.seated = true; }, standUp() { this.seated = false; this.turnTo(166); },
    get span() { const f = zone() && this.floor(); return f ? [f[0] - 40, f[0] + 40] : null; },
    get hit() { if (!zone()) return null; const f = this.floor(); return { x: f[0] - 24, y: f[1] - 60, w: 48, h: 62 }; },
    update(dt, t) {
      if (!zone()) return;
      const d = this.tgt - this.a, sp = (90 + Math.abs(d) * 5) * dt; this.a = Math.abs(d) <= sp ? this.tgt : this.a + Math.sign(d) * sp;
      if (!this.seated && Math.abs(d) < .5) { this.idleT -= dt; if (this.idleT < 0) { this.idleT = 5 + Math.random() * 6; this.turnTo(166 + (Math.random() - .5) * 26); } }
      const n = NX.nexi;
      if (this.seated && n.loc === 'mkChair') {                                             // Nexi їде разом із кріслом: спиною / лицем / боком
        const r = this.a * Math.PI / 180, fx = -Math.sin(r), fz = -Math.cos(r); n.back = fz > .2; if (Math.abs(fx) > .55) n.dir = fx > 0 ? 1 : -1;
        if (!(n.cur && (n.cur.hop || n.cur.fly))) { const s = this.seat(); n.x = s[0]; n.y = s[1]; }
      }
    },
    layers(t) {
      if (!zone()) return [];
      const fr = render(this.a), f = this.floor(), y = f[1], lit = .55 + .25 * Math.sin(t * 2.4) + (NX.objects.marketing && NX.objects.marketing.active ? .25 : 0);
      const draw = cv => c => { c.save(); c.imageSmoothingEnabled = true; c.drawImage(cv, fr.x0, fr.y0, fr.w, fr.h); c.restore(); };
      return [
        { y: y - .5, draw: c => { c.save(); c.fillStyle = 'rgba(4,2,14,.5)'; c.beginPath(); c.ellipse(f[0], f[1] + .5, 27, 4, 0, 0, 7); c.fill(); c.restore();
          P.glow(c, f[0], f[1] - 6, 30, 'rgba(255,79,216,.8)', lit * .55); draw(fr.back)(c); } },
        { y: y + .5, draw: draw(fr.front) },
      ];
    },
  });
})();

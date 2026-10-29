/* ============================================================================
 * objects/holo_panes.js — ПЛАСКІ ГОЛО-ПАНЕЛІ ЗОН У ПЕРСПЕКТИВІ (аналітика, інструменти)
 * ----------------------------------------------------------------------------
 * Крок 9 (власник: «екрани зроби пласкими теж, щоб іноді баги якісь були, але не часто»): екрани середніх зон — не коробки в
 * рамці, а тонкі голо-панелі БЕЗ РАМКИ, що висять перед «стіною» зони (аналітика — стіна даних, інструменти — перфодошка).
 * Зони повернуті й намальовані «фронтально» (tools/wingbox/gen_room.py: front_items), тож панель на екрані — чотирикутник
 * з вертикальними боками: вміст малюється в пласке полотно (од. світу × hr), а потім кладеться в перспективу стовпчиками
 * (NX.furn.warp). Кожна панель:
 *   — темна напівпрозора підкладка й РОЗЧИНЕНІ краї (рамки немає), легкий відтінок кольору панелі, темні скан-лінії, сяйво;
 *   — вміст перемальовується раз на 4 кадри (вразбіг), готова панель під масштаб екрана — одне полотно, щокадру — один
 *     drawImage; щільність полотна вмісту hr — під екран (комп'ютер ~1.5 px на од., телефон до 4): не малюємо зайвого;
 *   — «ЛАГ» ЗРІДКА: панель на 0.3–0.6 с зависає, смуги смикає вбік, кольори розходяться, сніг, яскравість скаче. Сама —
 *     раз на 14–26 с (o.lagMin / o.lagVar); o.lagMin 0 — лише коли скаже зона: p.kick(t, тривалість, вид) — так зона з
 *     кількома панелями глючить ОДНА за раз і рідко (власник: «іноді баги, але не часто»); мікро-глітч (одна смуга на 1/8 с) —
 *     ще рідше.
 * Де панель: прямокутник у px картинки зони (X, Y) перед лицем предмета розкладки item (його середина — Xc) на відстані dv
 * од. до глядача — береться з розкладки вже зі зсувом vcenter, тож панелі завжди по центру свого стола.
 *   const p = NX.arc.holo.pane({ zone, item, Xc, X: [x0, x1], Y: [y0, y1], dv, rgb, seed, paint(c, fw, fh, t) });
 *   p.draw(c, t) — у шарі кімнати (координати кімнати); p.quad() — чотирикутник на екрані (або null); p.kick(t, dur, kind).
 *   NX.arc.holo.at(zone, item, Xc, dv) -> (X, Y) => точка екрана на лиці предмета (для дешевих живих дрібниць поверх стіни).
 * ========================================================================== */
NX.arc = NX.arc || {};
NX.arc.holo = (() => {
  const A = NX.arc.kit, F = NX.furn, hash = NX.art.hash, proj = (...a) => NX.px3d.proj(...a);
  const FL = 372, EVERY = 4;
  const FEATH = {};
  /** Маска розчинених країв (біле з м'якими краями), кеш за розміром. */
  function feather(W, H) {
    const key = W + 'x' + H; if (FEATH[key]) return FEATH[key];
    const cv = document.createElement('canvas'); cv.width = W; cv.height = H; const x = cv.getContext('2d');
    x.fillStyle = '#fff'; x.fillRect(0, 0, W, H); x.globalCompositeOperation = 'destination-in';
    let g = x.createLinearGradient(0, 0, W, 0); g.addColorStop(0, 'rgba(0,0,0,0)'); g.addColorStop(.06, '#000'); g.addColorStop(.94, '#000'); g.addColorStop(1, 'rgba(0,0,0,0)'); x.fillStyle = g; x.fillRect(0, 0, W, H);
    g = x.createLinearGradient(0, 0, 0, H); g.addColorStop(0, 'rgba(0,0,0,0)'); g.addColorStop(.04, '#000'); g.addColorStop(.95, '#000'); g.addColorStop(1, 'rgba(0,0,0,0)'); x.fillStyle = g; x.fillRect(0, 0, W, H);
    return FEATH[key] = cv;
  }
  const mk = (w, h) => { const cv = document.createElement('canvas'); cv.width = Math.max(1, Math.ceil(w)); cv.height = Math.max(1, Math.ceil(h)); return cv; };
  /** Точка на лиці предмета розкладки item зони (px картинки X, Y; dv — од. світу ближче до глядача) -> екран; null — ще немає. */
  function at(zone, item, Xc, dv = .3) {
    const Z = NX.arc.zone && NX.arc.zone(zone), B = Z && Z.item(item); if (!B) return null;
    const m = Z.m, bp = A.basis(B).P; return (X, Y) => proj(bp((X - Xc) * m, -dv, FL - (Z.Yf - Y) * m));
  }

  function pane(o) {
    const P = { o, ok: false, lag: null, fr: o.seed || 0 };
    /** Чотирикутник на екрані (кімнати) і розмір у од. світу — з предмета розкладки (зі зсувом vcenter і фронтальним зсувом). */
    function geom() {
      if (P.q) return P;
      const Z = NX.arc.zone && NX.arc.zone(o.zone), B = Z && Z.item(o.item); if (!B) return null;
      const m = Z.m, bp = A.basis(B).P, y = Y => FL - (Z.Yf - Y) * m, u = X => (X - o.Xc) * m, v = -(o.dv || 6);
      const tl = proj(bp(u(o.X[0]), v, y(o.Y[0]))), tr = proj(bp(u(o.X[1]), v, y(o.Y[0]))), br = proj(bp(u(o.X[1]), v, y(o.Y[1]))), bl = proj(bp(u(o.X[0]), v, y(o.Y[1])));
      P.q = [[tl[0], tl[1]], [tr[0], tr[1]], [tr[0], br[1]], [tl[0], bl[1]]];                   // боки вертикальні: x — з верхніх кутів
      P.box = [tl[0], Math.min(tl[1], tr[1]), tr[0], Math.max(bl[1], br[1])];
      P.fw = (o.X[1] - o.X[0]) * m; P.fh = (o.Y[1] - o.Y[0]) * m;
      return P;
    }
    /** Полотна вмісту під щільність hr (px на од. світу): перестворюються, лише коли змінився масштаб екрана. */
    function canv(hr) { if (P.hr === hr) return; P.hr = hr; P.cv = mk(P.fw * hr, P.fh * hr); P.k = mk(P.fw * hr, P.fh * hr); P.ok = false; }
    /** Вміст -> підкладка, відтінок, скан-лінії, розчинені краї, сяйво (полотно k, пласке). */
    function paint(t) {
      const W = P.cv.width, H = P.cv.height, x = P.cv.getContext('2d'), sl = Math.max(1, Math.round(P.hr * .5));
      x.setTransform(1, 0, 0, 1, 0, 0); x.globalCompositeOperation = 'source-over'; x.globalAlpha = 1; x.clearRect(0, 0, W, H);
      x.setTransform(W / P.fw, 0, 0, H / P.fh, 0, 0); o.paint(x, P.fw, P.fh, t); x.setTransform(1, 0, 0, 1, 0, 0);
      x.globalCompositeOperation = 'source-atop'; const g = x.createLinearGradient(0, 0, 0, H);
      g.addColorStop(0, `rgba(${o.rgb},.1)`); g.addColorStop(.5, `rgba(${o.rgb},.03)`); g.addColorStop(1, `rgba(${o.rgb},.1)`); x.fillStyle = g; x.fillRect(0, 0, W, H);
      x.fillStyle = 'rgba(2,0,24,.2)'; for (let yy = (Math.floor(t * 18) & 1) * sl; yy < H; yy += sl * 2) x.fillRect(0, yy, W, sl);       // скан-лінії — темні смуги
      x.globalCompositeOperation = 'destination-in'; x.drawImage(feather(W, H), 0, 0); x.globalCompositeOperation = 'source-over';
      const k = P.k.getContext('2d'); k.setTransform(1, 0, 0, 1, 0, 0); k.globalCompositeOperation = 'source-over'; k.globalAlpha = 1; k.clearRect(0, 0, W, H);
      k.globalAlpha = o.shade == null ? .58 : o.shade; k.drawImage(feather(W, H), 0, 0); k.globalCompositeOperation = 'source-in'; k.fillStyle = 'rgb(4,3,24)'; k.fillRect(0, 0, W, H);   // темна підкладка з розчиненими краями
      k.globalCompositeOperation = 'source-over'; k.globalAlpha = 1; k.drawImage(P.cv, 0, 0);
      k.globalCompositeOperation = 'lighter'; k.globalAlpha = .38; const oo = P.hr * .7; k.drawImage(P.cv, oo * .6, -oo * .4);   // сяйво (одна зсунута копія)
      k.globalCompositeOperation = 'source-over'; k.globalAlpha = 1;
    }
    /** Пласку панель -> у перспективу (полотно під масштаб екрана Rd, у межах box). */
    function warp(Rd) {
      const [x0, y0, x1, y1] = P.box, w = Math.ceil((x1 - x0) * Rd) + 2, h = Math.ceil((y1 - y0) * Rd) + 2;
      if (!P.out || P.out.width !== w || P.out.height !== h) P.out = mk(w, h);
      const c = P.out.getContext('2d'); c.setTransform(1, 0, 0, 1, 0, 0); c.clearRect(0, 0, w, h);
      c.setTransform(Rd, 0, 0, Rd, -x0 * Rd, -y0 * Rd); c.imageSmoothingEnabled = true; F.warp(c, P.k, P.q, Math.max(Rd > 2 ? 1 : 1.5, (P.q[1][0] - P.q[0][0]) / 28)); P.Rd = Rd;   // ~28 стовпчиків: панель майже фронтальна
    }
    /** Лаг (зрідка): коли наступний і скільки триває; kind 0 — смуги вбік, 1 — сповзає, 2 — кольори розходяться. */
    function lagOf(t) {
      const L = P.lag || (P.lag = { next: o.lagMin === 0 ? Infinity : t + 6 + (o.seed || 0) * 4.3 + Math.random() * 8, end: -1, kind: 0, t0: 0 });
      if (t >= L.next) { L.t0 = t; L.end = t + .3 + Math.random() * .3; L.next = L.end + (o.lagMin || 14) + Math.random() * (o.lagVar || 12); L.kind = Math.floor(Math.random() * 3); }
      return t < L.end ? L : null;
    }
    function draw(c, t) {
      if (!geom()) return;
      const Rd = Math.min(4, Math.round(NX.cam.k * (NX.loop.dpr || 1) * 100) / 100), lag = lagOf(t);
      canv(Math.min(4, Math.max(1.5, Math.ceil(Rd * 1.3 * 2) / 2)));
      P.fr++;
      if (!lag && (!P.ok || P.fr % EVERY === 0 || P.Rd !== Rd)) { paint(t); warp(Rd); P.ok = true; }
      else if (P.Rd !== Rd) warp(Rd);
      const [x0, y0] = P.box, OUT = P.out, OW = OUT.width, OH = OUT.height, w = OW / P.Rd, h = OH / P.Rd;      // полотно — 1:1 до екрана (з запасом 2 px)
      const st = Math.floor(t * 14), rnd = s => hash(st * 7 + s, (o.seed || 0) * 13 + 5), seed = o.seed || 0;
      const micro = !lag && hash(Math.floor(t * 8), seed + 41) > .998;
      const fl = lag ? (rnd(1) > .85 ? .25 : .72 + .28 * rnd(2)) : .95 + .05 * Math.sin(t * 13 + seed * 2) * Math.sin(t * 3.7 + seed);
      c.save(); c.imageSmoothingEnabled = true; c.globalAlpha = fl;
      if (lag) {
        if (lag.kind === 1) { const ry = ((t - lag.t0) * 70) % h; c.beginPath(); c.rect(x0 - 4, y0, w + 8, h); c.clip(); c.drawImage(OUT, x0, y0 - ry, w, h); c.drawImage(OUT, x0, y0 - ry + h, w, h); }
        else { const B = 6, amp = lag.kind === 0 ? 5 : 2; for (let b = 0; b < B; b++) { const r = rnd(10 + b), dx = r > .3 ? (r - .5) * 2 * amp : 0; c.drawImage(OUT, 0, OH * b / B, OW, OH / B, x0 + dx, y0 + h * b / B, w, h / B); } }
        c.globalCompositeOperation = 'lighter'; const sp = lag.kind === 2 ? 2.2 : 1.2; c.globalAlpha = .26 * fl;
        c.drawImage(OUT, x0 - sp, y0, w, h); c.drawImage(OUT, x0 + sp, y0 + .4, w, h);                     // «тіні» розходяться
        c.globalAlpha = Math.min(1, fl + .2);
        for (let q = 0; q < 18; q++) { c.fillStyle = q % 3 ? 'rgba(230,252,255,.8)' : `rgba(${o.rgb},.85)`; c.fillRect(x0 + w * rnd(40 + q), y0 + h * rnd(80 + q), q % 4 ? .7 : 3, .6); }   // сніг
        c.fillStyle = `rgba(${o.rgb},.55)`; c.fillRect(x0, y0 + h * rnd(3), w, 1.2);
      } else if (micro) { const b = Math.floor(rnd(4) * 5), dx = (rnd(5) - .5) * 4; c.drawImage(OUT, x0, y0, w, h); c.drawImage(OUT, 0, OH * b / 5, OW, OH / 5, x0 + dx, y0 + h * b / 5, w, h / 5); }
      else c.drawImage(OUT, x0, y0, w, h);
      c.restore();
    }
    /** Лаг зараз (зона сама вирішує, коли): dur — секунди, kind 0 — смуги вбік, 1 — сповзає, 2 — кольори розходяться. */
    function kick(t, dur = .45, kind = Math.floor(Math.random() * 3)) { lagOf(t); Object.assign(P.lag, { t0: t, end: t + dur, kind }); }
    return { draw, kick, quad: () => geom() && P.q, box: () => geom() && P.box, get lag() { return P.lag; }, get lagging() { return !!(P.lag && NX.time < P.lag.end); } };
  }
  return { pane, feather, at };
})();

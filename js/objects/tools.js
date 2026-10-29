/* ============================================================================
 * objects/tools.js — ІНСТРУМЕНТИ («МАЙСТЕРНЯ ІНТЕГРАЦІЙ»): ЖИВИЙ ОБ'ЄКТ
 * ----------------------------------------------------------------------------
 * Нерухома частина (верстак на козлах з розпірками, полиця з ящиком і бухтою кабелю, хаб, лещата, панель з перфодошкою) —
 * у 3D-розкладці (gen_room.py: tools(); грані, живі грані й форма розпірок — objects/tl_paint.js). Тут — те, що живе поверх
 * (крок 9, власник: «екрани — пласкі, зрідка глючать; більше фішок; вклади душу»):
 *   ГОЛО-КАРТКИ ПОШТА · КАЛЕНДАР · CRM (по черзі синхронізуються) і АВТО · API — пласкі, без рамки, бурштинові, перед
 *     перфодошкою (NX.arc.holo.pane; вміст — NX.arc.tlPane); глючить ОДНА за раз і рідко (раз на 15–28 с);
 *   ПОТІК ДАНИХ: поки картка синхронізується, з хаба на верстаку до неї летять пакети;
 *   АНТЕНА хаба з вогником (коли синхронізація — розходяться радіохвилі);
 *   МАЯЧОК на шапці: бурштиновий, крутиться; коли картка готова — розганяється й спалахує;
 *   ЛЕЩАТА: раз на 5–9 с (коли Nexi працює — частіше) — сніп іскор, що відскакують від стільниці.
 * Стан для карток і Nexi (наступний крок): active / prog (nexi.js: work.obj = 'tools'); синхронізація — NX.arc.tlSync.
 * ========================================================================== */
(() => {
  const P = NX.px, proj = NX.px3d.proj, hash = NX.art.hash, D = NX.persp.D, sc = z => D / (D + z);
  let Z = null; const zone = () => Z || (Z = NX.arc.zone && NX.arc.zone('tools'));
  const CARDS = [{ kind: 'mail', X: [1141, 1197], Y: [141, 199] }, { kind: 'cal', X: [1202, 1258], Y: [141, 199] }, { kind: 'crm', X: [1263, 1319], Y: [141, 199] },
    { kind: 'auto', X: [1141, 1227], Y: [207, 277] }, { kind: 'api', X: [1233, 1319], Y: [207, 277] }];
  let cards = null;
  const mk = () => cards || (cards = CARDS.map((p, n) => NX.arc.holo.pane({ zone: 'tools', item: 'tl_back', Xc: 1230, X: p.X, Y: p.Y, dv: 7, rgb: '255,180,110', seed: n + 3, lagMin: 0, shade: .5,
    paint: (c, fw, fh, t) => NX.arc.tlPane(p.kind, c, fw, fh, t) })));
  const FX = { sparks: [], nextLag: 11 + Math.random() * 10, nextSpark: 4 + Math.random() * 3, spin: 0, flash: 0, lastK: -1 };

  /** «Жили» перфодошки живуть — дешево, поверх нерухомого злиття й ПІД картками: імпульси біжать з-за хаба вгору серединою,
   *  щілиною між рядами — до картки, що синхронізується; коли вона готова — коротко спалахують усі жили (крім нижнього ряду
   *  гнізд: його закривають хаб і стільниця). */
  let VB = null;
  function veins(c, t, s, act) {
    const W = VB || (VB = NX.arc.holo.at('tools', 'tl_back', 1230, .3)), V = NX.arc.tlVeins; if (!W || !V) return;
    c.save(); c.globalCompositeOperation = 'lighter';
    if (s.f > .82) { const k = 1 - (s.f - .82) / .18; c.strokeStyle = `rgba(255,190,110,${.6 * k})`; c.lineWidth = 1.1; c.lineCap = 'round'; c.beginPath();
      V.all.forEach(([a, b]) => { if (a[1] > 272 && b[1] > 272) return; const p = W(a[0], Math.min(272, a[1])), q = W(b[0], Math.min(272, b[1])); c.moveTo(p[0], p[1]); c.lineTo(q[0], q[1]); }); c.stroke(); }
    else {
      const pts = V.path(s.k).map(([X, Y]) => W(X, Y)), seg = pts.slice(1).map((p, i) => Math.hypot(p[0] - pts[i][0], p[1] - pts[i][1])), len = seg.reduce((x, y) => x + y, 0);
      for (let q = 0; q < 3; q++) { let d = ((t * (act ? .9 : .45) + q / 3) % 1) * len, i = 0; while (i < seg.length - 1 && d > seg[i]) d -= seg[i++];
        const u = seg[i] ? Math.min(1, d / seg[i]) : 0, x = pts[i][0] + (pts[i + 1][0] - pts[i][0]) * u, y = pts[i][1] + (pts[i + 1][1] - pts[i][1]) * u;
        P.glow(c, x, y, 3.4, 'rgba(255,170,80,.8)', .8); c.fillStyle = 'rgba(255,245,220,.95)'; c.fillRect(x - .6, y - .6, 1.2, 1.2); }
    }
    c.restore();
  }
  /** Пакети з хаба до картки, що синхронізується: дуга вгору-назад, світлі точки біжать по ній. */
  function stream(c, z, t, s, act) {
    if (!cards || s.f > .82) return; const H = z.anchor('tlAnt'), q = cards[s.k].quad(); if (!H || !q) return;
    const a = proj([H[0] - 14, H[1] - 1, H[2] - 4]), b = [(q[2][0] + q[3][0]) / 2, Math.max(q[2][1], q[3][1]) - 3], m = [(a[0] + b[0]) / 2 - 6, Math.min(a[1], b[1]) - 10];
    c.save(); c.globalCompositeOperation = 'lighter'; c.strokeStyle = 'rgba(255,170,90,.18)'; c.lineWidth = .8; c.beginPath(); c.moveTo(a[0], a[1]); c.quadraticCurveTo(m[0], m[1], b[0], b[1]); c.stroke();
    const n = act ? 7 : 4; for (let i = 0; i < n; i++) { const u = (t * (act ? 1.3 : .7) + i / n) % 1, w = 1 - u, x = w * w * a[0] + 2 * w * u * m[0] + u * u * b[0], y = w * w * a[1] + 2 * w * u * m[1] + u * u * b[1];
      c.fillStyle = i % 2 ? 'rgba(255,230,190,.95)' : 'rgba(150,240,255,.95)'; c.fillRect(x - .7, y - .7, 1.4, 1.4); P.glow(c, x, y, 2.6, 'rgba(255,170,90,.6)', .5); }
    c.restore();
  }
  /** Антена хаба: тонкий штир, вогник на кінці; поки синхронізація — радіохвилі. */
  function antenna(c, z, t, s) {
    const A0 = z.anchor('tlAnt'); if (!A0) return; const b = proj(A0), tp = proj([A0[0], A0[1] - 21, A0[2]]), k = sc(A0[2]) * 1.2;
    c.strokeStyle = '#05030f'; c.lineWidth = 1.6 * k; c.beginPath(); c.moveTo(b[0], b[1]); c.lineTo(tp[0], tp[1]); c.stroke();
    c.strokeStyle = '#8a93c8'; c.lineWidth = .9 * k; c.stroke(); c.strokeStyle = '#e0e4ff'; c.lineWidth = .3 * k; c.beginPath(); c.moveTo(b[0] - .25 * k, b[1]); c.lineTo(tp[0] - .25 * k, tp[1]); c.stroke();
    [.35, .7].forEach(f => { c.fillStyle = '#2a2a5a'; c.fillRect(b[0] + (tp[0] - b[0]) * f - 1 * k, b[1] + (tp[1] - b[1]) * f - .4 * k, 2 * k, .8 * k); });
    const busy = s.f < .82, on = busy ? Math.sin(t * 14) > 0 : Math.sin(t * 2.4) > .3; c.fillStyle = on ? (busy ? '#ffd27a' : '#3bff8a') : '#3a2a10';
    c.beginPath(); c.arc(tp[0], tp[1], 1.3 * k, 0, 7); c.fill(); if (on) P.glow(c, tp[0], tp[1], 5 * k, busy ? 'rgba(255,200,110,.85)' : 'rgba(80,255,150,.7)', .7);
    if (busy) { c.save(); c.globalCompositeOperation = 'lighter'; for (let i = 0; i < 3; i++) { const ph = (t * 1.2 + i / 3) % 1, r = (2 + ph * 10) * k; c.strokeStyle = `rgba(255,190,110,${(1 - ph) * .6})`; c.lineWidth = .5;
      [-1, 1].forEach(sd => { c.beginPath(); c.arc(tp[0], tp[1], r, sd > 0 ? -.7 : Math.PI - .7, sd > 0 ? .1 : Math.PI + .1); c.stroke(); }); } c.restore(); }
  }
  /** Маячок на шапці: темна основа, бурштиновий ковпак, усередині обертається лампа; промені віялом по боках, коли лампа
   *  дивиться на глядача — спалах. Коли картка готова — крутиться втричі швидше. */
  function beacon(c, z, t, dt) {
    const A0 = z.anchor('tlBeacon'); if (!A0) return; const b = proj(A0), k = sc(A0[2]) * 1.6;
    FX.spin += dt * (FX.flash > 0 ? 5.5 : 1.6); const ph = FX.spin % (Math.PI * 2), ca = Math.cos(ph), sa = Math.sin(ph);
    c.fillStyle = '#05030f'; c.fillRect(b[0] - 4.4 * k, b[1] - 2.4 * k, 8.8 * k, 2.4 * k); c.fillStyle = '#2a2a5a'; c.fillRect(b[0] - 3.8 * k, b[1] - 2 * k, 7.6 * k, 1.6 * k);
    const cy = b[1] - 2.4 * k, R = 3.6 * k;
    c.fillStyle = 'rgba(120,50,10,.95)'; c.beginPath(); c.ellipse(b[0], cy, R, R * 1.15, 0, Math.PI, 0); c.fill();
    const lx = b[0] + sa * R * .55, g = c.createRadialGradient(lx, cy - R * .45, 0, lx, cy - R * .45, R * 1.1); g.addColorStop(0, '#fff2c0'); g.addColorStop(.35, '#ffb24a'); g.addColorStop(1, 'rgba(255,140,40,0)');
    c.save(); c.beginPath(); c.ellipse(b[0], cy, R, R * 1.15, 0, Math.PI, 0); c.clip(); c.fillStyle = g; c.fillRect(b[0] - R, cy - R * 1.2, R * 2, R * 1.2); c.restore();
    c.fillStyle = 'rgba(255,255,255,.55)'; c.fillRect(b[0] - R * .55, cy - R * .9, R * .25, R * .5);
    c.save(); c.globalCompositeOperation = 'lighter';
    const face = Math.max(0, -ca), L = (26 + 20 * face) * k, ang = sa * 1.35, beam = (dir, a) => { const x2 = b[0] + Math.sin(dir) * L, y2 = cy - R * .45 - Math.cos(dir) * L * .28, gg = c.createLinearGradient(lx, cy, x2, y2);
      gg.addColorStop(0, `rgba(255,190,90,${a})`); gg.addColorStop(1, 'rgba(255,170,70,0)'); c.fillStyle = gg; c.beginPath(); c.moveTo(lx, cy - R * .45); c.lineTo(x2, y2 - L * .12); c.lineTo(x2, y2 + L * .12); c.closePath(); c.fill(); };
    beam(Math.PI / 2 + ang, .28 + .3 * face); beam(-Math.PI / 2 + ang, .12 + .1 * face);
    P.glow(c, b[0], cy - R * .4, (8 + 10 * face + 10 * FX.flash) * k, 'rgba(255,170,70,.9)', .35 + .45 * face + .4 * FX.flash);
    c.restore();
  }
  /** Сніп іскор з губок лещат: летять угору-вбік, падають, відскакують від стільниці, гаснуть (жовто-біле -> помаранчеве). */
  function sparkBurst(z, act) {
    const V = z.anchor('tlVise'); if (!V) return; const b = proj(V), floorY = proj([V[0], V[1] + 10.2, V[2] - 6])[1], n = act ? 18 : 12;
    for (let i = 0; i < n; i++) { const a = -Math.PI / 2 + (Math.random() - .5) * 2.4; FX.sparks.push({ x: b[0] + (Math.random() - .5) * 2, y: b[1] + .5, vx: Math.cos(a) * (14 + Math.random() * 26), vy: Math.sin(a) * (16 + Math.random() * 22) - 6, a: 0, ttl: .5 + Math.random() * .6, fy: floorY, hit: 0 }); }
    FX.burst = { x: b[0], y: b[1], a: 0 };
  }
  function sparks(c) {
    if (FX.burst && FX.burst.a < .2) P.glow(c, FX.burst.x, FX.burst.y, 10, 'rgba(255,220,150,.9)', .9 * (1 - FX.burst.a / .2));
    c.save(); c.globalCompositeOperation = 'lighter';
    FX.sparks.forEach(o => { const k = o.a / o.ttl, col = k < .3 ? '255,250,220' : k < .6 ? '255,210,120' : '255,140,50'; c.strokeStyle = `rgba(${col},${1 - k})`; c.lineWidth = .6;
      c.beginPath(); c.moveTo(o.x, o.y); c.lineTo(o.x - o.vx * .025, o.y - o.vy * .025); c.stroke(); });
    c.restore();
  }

  NX.addObject({
    id: 'tools', name: 'obj.tools', active: false, prog: 0, boost: 0,
    get span() { const z = zone(); return z && z.box ? [z.box[0] - 30, z.box[1] + 40] : null; },
    ready() { return !!zone(); },
    /** Глюк панелі зараз (i — номер, інакше випадкова): для Nexi й перевірок (наступний крок). */
    glitch(i, dur = .5) { if (!NX.arc.holo || !zone()) return; mk(); const L = cards; L[i != null ? i % L.length : Math.random() * L.length | 0].kick(NX.time, dur); },
    update(dt, t) {
      const z = zone(); if (!z || !NX.arc.holo) return; mk();
      if (t > FX.nextLag) { cards[Math.random() * cards.length | 0].kick(t, .3 + Math.random() * .3); FX.nextLag = t + 15 + Math.random() * 13; }   // глючить одна картка і рідко
      if (this.active) this.boost += dt;
      const s = NX.arc.tlSync(t), done = s.f > .82 ? s.k : -1; if (done >= 0 && FX.lastK !== done) FX.flash = 1; FX.lastK = done; FX.flash = Math.max(0, FX.flash - dt * .9);
      if (t > FX.nextSpark) { sparkBurst(z, this.active); FX.nextSpark = t + (this.active ? 2 + Math.random() * 2 : 5 + Math.random() * 4); }
      FX.sparks = FX.sparks.filter(o => (o.a += dt) < o.ttl); FX.sparks.forEach(o => { o.vy += 90 * dt; o.x += o.vx * dt; o.y += o.vy * dt; if (o.y > o.fy && !o.hit) { o.y = o.fy; o.vy *= -.35; o.vx *= .6; o.hit = 1; } });
      if (FX.burst) FX.burst.a += dt;
      this._dt = dt;
    },
    drawBack(c, t) {
      const z = zone(); if (!z || !NX.arc.holo) return; mk();
      const s = NX.arc.tlSync(t), act = !!this.active;
      veins(c, t, s, act); cards.forEach(p => p.draw(c, t));
      stream(c, z, t, s, act); antenna(c, z, t, s); beacon(c, z, t, this._dt || 0); sparks(c);
    },
  });
})();

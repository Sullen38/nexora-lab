/* ============================================================================
 * actors/guests/party_live.js — ЖИВА ВЕЧІРКА (крок 47, 06.11, чат «Персонажі»): дроп у такт, кульки, бульбашки,
 * світні палички, хвиля, балачки, пульс колонок
 * ----------------------------------------------------------------------------
 * Власник: «вечірку зроби більш живою, покращи в три рази». Усе тут — поверх party.js, через кілька гачків:
 *  tick(t, dt)   — щокадру з director (і під час справжньої вечірки): ДРОП кожні 32 біти (4 біти розгону — стробоскоп
 *                  частішає, світло пригасає; на дропі всі підстрибують (S.dropK), конфеті-гармати з обох боків, спалах,
 *                  поштовх камери), кульки дрейфують/лопаються, бульбашки з машинки біля фуршету, БАЛАЧКИ (двоє вільних гостей
 *                  поруч повертаються одне до одного й «…» по черзі), ХВИЛЯ (подія 'wave' — стрибають по черзі зліва направо),
 *                  СВІТНІ ПАЛИЧКИ (подія 'glow' — світло пригасає, усі махають паличками в такт), кіно-камера (без подій і не
 *                  на справжній вечірці — раз на ~25 с м'який наїзд ×1.2 на танцпол/бар/фуршет/балкон на 7 с).
 *  drawBack(c, t) — після світла, до гостей: пульс мембран колонок у такт, кульки під стелею (за гостями).
 *  drawFront(c,t) — після гостей: бульбашки, «…» балачок, палички в руках, ефекти дропу (спалах підлоги).
 * Гачки в party.js: director → tick; frame → drawBack/drawFront; updGuest → g.alt += S.dropK·14 / хвиля; HUD — затемнення.
 * ========================================================================== */
NX.partyLive = (() => {
  const L = { balloons: [], bubbles: [], drop: { next: 32, k: 0, build: 0 }, chat: [], camT: 0, wave: null };
  let Pp = null; const rnd = Math.random, NEON = ['#ff4fd8', '#3be8ff', '#ffe27a', '#3bff8a', '#ff7a2a', '#b48aff'];
  const G = () => NX.partyRoom.GEO, S = () => Pp.S;
  function init(P_) {
    Pp = P_; const g = G(); L.balloons = []; L.bubbles = []; L.chat = []; L.wave = null; L.drop = { next: 32, k: 0, build: 0 }; L.camT = NX.time + 18;
    for (let i = 0; i < 12; i++) L.balloons.push(mkBalloon(g, i, true));
  }
  const mkBalloon = (g, i, any) => ({ x: g.XL + 60 + rnd() * (g.XR - g.XL - 120), y: any ? g.CEIL + 30 + rnd() * 70 : 330, z: 120 + rnd() * 280, vx: (rnd() - .5) * 6, col: NEON[i % 6], ph: rnd() * 6, r: 7 + rnd() * 3, pop: 0 });

  function tick(t, dt) {
    if (!Pp || !S().on) return; const s = S(), g = G(), b = Pp.beat(), show = false, sleep = false;   // 13.11: сценарію й сну більше немає
    // ---- ДРОП у такт: розгін 4 біти → дроп (2 біти стрибають усі) ----
    const D = L.drop; if (!sleep) { if (b > D.next - 4 && b < D.next) D.build = (b - (D.next - 4)) / 4; else D.build = 0;
      if (b >= D.next) { D.next += 32; D.k = 1; s.flashT = t + .14; cannons(); s.list.forEach(q => { if (!q.trip && !q.pouf && !q.sleep && !q.rest) q.cheerT = Math.max(q.cheerT || 0, t + 1.6); }); }
      D.k = Math.max(0, D.k - dt * .55); s.dropK = D.k * Math.abs(Math.sin(b * Math.PI)); } else s.dropK = 0;
    // ---- кульки ----
    L.balloons.forEach((B, i) => { if (B.pop) { if (t > B.pop) Object.assign(B, mkBalloon(g, i, false), { pop: 0 }); return; } B.x += B.vx * dt; if (B.x < g.XL + 40 || B.x > g.XR - 40) B.vx = -B.vx; B.y = Math.max(g.CEIL + 24, B.y - 6 * dt); B.ph += dt;
      if (rnd() < .0004 || (D.k > .9 && rnd() < .02)) { B.pop = t + 8 + rnd() * 10; const [sx, sy] = Pp.pt(B.x, B.y, B.z); Pp.sparks(sx, sy, 8, [B.col, '#ffffff']); } });
    // ---- бульбашки з машинки біля фуршету ----
    const Sn = g.snack; if (rnd() < .5) L.bubbles.push({ x: Sn.x1 + 10 + rnd() * 20, y: Sn.y0 - 10, z: Sn.z0 + rnd() * 40, vy: 14 + rnd() * 10, r: 2 + rnd() * 3, ph: rnd() * 6, age: 0, ttl: 4 + rnd() * 4 });
    L.bubbles = L.bubbles.filter(bb => { bb.age += dt; bb.y -= bb.vy * dt; bb.x += Math.sin(bb.age * 2 + bb.ph) * 8 * dt; return bb.age < bb.ttl; });
    // ---- балачки: пари вільних гостей поруч ----
    L.chat = L.chat.filter(ch => t < ch.until && !ch.a.mv && !ch.b.mv); if (!show && rnd() < .01 && L.chat.length < 3) { const free = s.list.filter(q => !q.sc && !q.trip && !q.mv && !q.fly && !q.up && !q.pouf && !q.rest && !q.conga && !q.photo && !q.hockey && !q.sing && !q.fan && !L.chat.some(ch => ch.a === q || ch.b === q));
      for (const a of free) { const bq = free.find(q => q !== a && Math.abs(q.x - a.x) < 70 && Math.abs(q.z - a.z) < 50); if (bq) { L.chat.push({ a, b: bq, until: t + 6 + rnd() * 5, t0: t }); a.dir = bq.x > a.x ? 1 : -1; bq.dir = -a.dir; a.next = Math.max(a.next, t + 8); bq.next = Math.max(bq.next, t + 8); break; } } }
    // ---- хвиля ----
    const E = s.event; if (E && E.kind === 'wave') { if (!L.wave) { L.wave = { t0: t, order: s.list.filter(q => !q.fly && !q.trip && !q.pouf && !q.rest).sort((a, b2) => a.x - b2.x) }; } const W = L.wave, el = t - W.t0; W.order.forEach((q, i) => { const k = el * 3 - i * .35; q.waveK = k > 0 && k < 1 ? Math.sin(k * Math.PI) : 0; if (el > 6) q.waveK = 0; }); } else if (L.wave) { L.wave.order.forEach(q => { q.waveK = 0; }); L.wave = null; }
    s.glow = !!(E && E.kind === 'glow');
    // кіно-камери більше немає (власник, 13.11: «не треба, щоб воно само приближало») — камерою керує власник (party.js)
  }
  /** Конфеті-гармати з обох боків танцполу (на дропі). */
  function cannons() { const g = G(), s = S(); for (const side of [-1, 1]) { const [sx, sy] = Pp.fp(side < 0 ? g.dance.x0 - 30 : g.dance.x1 + 30, g.dance.z1 + 10); for (let i = 0; i < 26; i++) s.fx.push({ t: 'conf', x: sx, y: sy - 20, vx: -side * (40 + rnd() * 120), vy: -120 - rnd() * 120, g: 90, col: NEON[i % 6], ttl: 3.5, age: 0, ph: rnd() * 6 }); } }

  function drawBack(c, t) {
    if (!Pp || !S().on) return; const g = G(), pl = Pp.pulse(), D = L.drop;
    // пульс мембран колонок
    c.save(); c.globalCompositeOperation = 'lighter'; g.speakers.forEach(sp => { for (let k = 0; k < 2; k++) { const y0 = g.FLY - (k + 1) * 76; [[y0 + 22, 15], [y0 + 54, 11]].forEach(([cy, r]) => { const [sx, sy] = Pp.pt(sp.x, cy, sp.z - 2), s = Pp.sc(sp.z) / NX.cfg.NEXI_SCALE_FAR / 1.15, rr = r * s * (1 + pl * .25 + D.k * .3); c.globalAlpha = .12 + pl * .18 + D.k * .2; c.fillStyle = '#9af6ff'; c.beginPath(); c.arc(sx, sy, rr, 0, 6.283); c.fill(); }); } }); c.restore();
    // кульки під стелею (за гостями)
    c.save(); L.balloons.forEach(B => { if (B.pop) return; const [sx, sy] = Pp.pt(B.x, B.y + Math.sin(B.ph * 1.3) * 3, B.z), s = Pp.sc(B.z) / NX.cfg.NEXI_SCALE_FAR / 1.15, r = B.r * s; c.globalAlpha = .9;
      c.strokeStyle = '#e8e4f0'; c.lineWidth = 1; c.beginPath(); c.moveTo(sx, sy + r); for (let i = 1; i <= 4; i++) c.lineTo(sx + Math.sin(B.ph * 2 + i) * 2 * s, sy + r + i * 7 * s); c.stroke();
      c.fillStyle = B.col; c.beginPath(); c.ellipse(sx, sy, r, r * 1.15, 0, 0, 6.283); c.fill(); c.fillStyle = '#ffffff'; c.globalAlpha = .55; c.beginPath(); c.ellipse(sx - r * .35, sy - r * .4, r * .25, r * .35, 0, 0, 6.283); c.fill(); c.globalAlpha = .9; c.fillStyle = B.col; c.fillRect(sx - 1.5 * s, sy + r - 1, 3 * s, 2.5 * s); }); c.restore();
  }
  function drawFront(c, t) {
    if (!Pp || !S().on) return; const s = S(), b = Pp.beat();
    // бульбашки
    c.save(); L.bubbles.forEach(bb => { const [sx, sy] = Pp.pt(bb.x, bb.y, bb.z), k = Pp.sc(bb.z) / NX.cfg.NEXI_SCALE_FAR / 1.15, r = bb.r * k, a = Math.min(1, bb.age * 3, (bb.ttl - bb.age) * 2); c.globalAlpha = a * .55; c.strokeStyle = '#d8f6ff'; c.lineWidth = 1; c.beginPath(); c.arc(sx, sy, r, 0, 6.283); c.stroke(); c.globalAlpha = a * .8; c.fillStyle = '#ffffff'; c.fillRect(sx - r * .5, sy - r * .5, 1.5, 1.5); }); c.restore();
    // балачки: «…» над тим, хто говорить (по черзі кожні 1.2 с)
    c.save(); L.chat.forEach(ch => { const who = Math.floor((t - ch.t0) / 1.2) % 2 ? ch.b : ch.a, [sx, sy] = Pp.gxy(who), k = Pp.sc(who.z), [, GH, K] = NX.guestArt.size(who.id), top = sy - who.alt * k - GH * k * K - 4; c.globalAlpha = .9; c.fillStyle = '#0a0626dd'; c.fillRect(sx - 7, top - 8, 14, 8); c.strokeStyle = NX.cards ? NX.cards.col(who.id) : '#ff7af0'; c.strokeRect(sx - 6.5, top - 7.5, 13, 7); const d = Math.floor(t * 3) % 3; for (let i = 0; i < 3; i++) { c.fillStyle = i <= d ? '#ffffff' : '#6a6a9a'; c.fillRect(sx - 4 + i * 3, top - 5, 2, 2); } }); c.restore();
    // світні палички (подія glow)
    if (s.glow) { c.save(); c.globalCompositeOperation = 'lighter'; s.list.forEach((q, i) => { if (q.fly || q.sleep || q.pouf || q.rest) return; const [sx, sy] = Pp.gxy(q), k = Pp.sc(q.z), [, GH, K] = NX.guestArt.size(q.id), hy = sy - q.alt * k - GH * k * K * .55, ang = Math.sin(b * Math.PI + i) * .6, col = NEON[i % 6], x1 = sx + q.dir * 10 * k + Math.sin(ang) * 16 * k, y1 = hy - Math.cos(ang) * 16 * k;
      c.strokeStyle = col; c.lineWidth = 2.5 * k; c.globalAlpha = .9; c.beginPath(); c.moveTo(sx + q.dir * 10 * k, hy); c.lineTo(x1, y1); c.stroke(); c.globalAlpha = .35; c.fillStyle = col; c.beginPath(); c.arc(x1, y1, 7 * k, 0, 6.283); c.fill(); }); c.restore(); }
  }
  /** Затемнення для події glow і розгону дропу (малюється в HUD перед субтитрами). */
  function drawDim(c, vw, vh) { if (!Pp || !S().on) return; const s = S(), a = (s.glow ? .42 : 0) + L.drop.build * .3; if (a > 0) { c.save(); c.globalAlpha = a; c.fillStyle = '#03020c'; c.fillRect(0, 0, vw, vh); c.restore(); }
    if (L.drop.build > 0 && Math.floor(NX.time * (6 + L.drop.build * 18)) % 2 === 0) { c.save(); c.globalAlpha = .08 + L.drop.build * .12; c.fillStyle = '#ffffff'; c.fillRect(0, 0, vw, vh); c.restore(); } }
  return { init, tick, drawBack, drawFront, drawDim, L };
})();

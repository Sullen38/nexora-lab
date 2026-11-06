/* ============================================================================
 * actors/nexi/relics.js — ЗДІБНОСТІ РЕЛІКВІЙ У РУКАХ NEXI (NX.objects.relics)
 * ----------------------------------------------------------------------------
 * Власник (06.11): «реліквії в руках — кожна зі своєю здібністю: молот — Nexi іноді підіймає його вгору, і з нього б'є
 * блискавка вгору; до кожної реліквії — свій ефект, коли тапаєш на Nexi».
 * Дві нагоди показати реліквію (skins.js: ACCS slot 'hand', зараз у look.hand):
 *   ІНОДІ САМ (idle): Nexi вільний і стоїть на підлозі чи на доку — раз на 30–70 с (update);
 *   ТАП ПО NEXI (nexi.js: hi -> tap(id)): замість помаху — здібність реліквії, емоція й коротка фраза (act.relic.<id>, 4 мови);
 *     поки здібність триває, нові тапи лише підкидають Nexi (hi: «лоскотно» на третій — як було).
 * Кожна здібність — поза Nexi (poses.js: raise / swing / present / guard — тимчасова, nexi.temp) + ефект у кімнаті (шар
 * поверх Nexi: layers) + частинки (fx/particles.js). Тривалість — D с; ефект залежить від фази k = 0..1.
 *   hammer    ГРОМОВИЙ МОЛОТ — підіймає вгору, з бойка б'є блискавка в стелю, спалах, кільце грому по підлозі, іскри
 *   blade     ЛАЗЕРНИЙ МЕЧ — два розчерки лезом, неонові дуги й риски
 *   gauntlet  ЗОЛОТА РУКАВИЦЯ — стискає кулак, золоте сяйво пульсує, клацання — золоті іскри й біти
 *   excalibur ЕКСКАЛІБУР — підіймає, з неба падає стовп світла на Nexi, зорі
 *   staff     КРИШТАЛЕВИЙ ПОСОХ — кристал пульсує, сніжинки кружляють спіраллю, крижане кільце
 *   trident   МОРСЬКИЙ ТРИЗУБ — випад уперед, хвиля по підлозі й бризки-бульбашки
 *   wand      ЗОРЯНА ПАЛИЧКА — змах, зоряний слід і кільце зірок, сердечка
 *   balloon   КУЛЬКА — Nexi підстрибує тричі, кулька тягне вгору, пил
 *   torch     ФАКЕЛ — підіймає, полум'я вгору, тепле сяйво блимає, жаринки
 *   magnet    МАГНІТ — виставляє вперед, біти злітаються до магніту
 *   shield    ЩИТ NEXI — стає в захист, навколо енергетичний купол, що відбиває біти
 *   sword     МЕЧ — два розчерки, сталеві зблиски
 * Без текстів у сцені (усе — частинки й світло); фрази — лише словники.
 * ========================================================================== */
NX.objects.relics = (() => {
  const TAU = Math.PI * 2, r = Math.random;
  const POSE = { hammer: 'raise', blade: 'swing', gauntlet: 'raise', excalibur: 'raise', staff: 'raise', trident: 'present', wand: 'swing', balloon: 'hop', torch: 'raise', magnet: 'present', shield: 'guard', sword: 'swing' };
  const DUR = { hammer: 2.2, blade: 1.6, gauntlet: 2, excalibur: 2.6, staff: 2.4, trident: 1.8, wand: 2, balloon: 2.2, torch: 2.2, magnet: 2, shield: 2.4, sword: 1.6 };
  const MOOD = { hammer: 'cool', blade: 'cool', gauntlet: 'cool', excalibur: 'idea', staff: 'surprise', trident: 'happy', wand: 'love', balloon: 'happy', torch: 'happy', magnet: 'surprise', shield: 'cool', sword: 'cool' };
  const S = { act: null, next: 0, bolt: null, flash: 0, bits: [] };
  const n = () => NX.nexi;
  /** Геометрія Nexi в кімнаті: центр X, підлога Y, масштаб s (1 піксель спрайта), верх, напрям; рука вгорі / попереду. */
  function geo() {
    const N = n(), s = NX.room.scaleAt(Math.max(N.depthY(), 352)) * N.zoom * SPRITE_K, top = FOOT * s, d = N.dir < 0 ? -1 : 1;
    return { X: N.x, Y: N.y, s, top, d, up: [N.x + d * 6 * s, N.y - top - 4 * s], fwd: [N.x + d * 14 * s, N.y - top * .55], mid: [N.x, N.y - top * .5] };
  }
  const free = () => { const N = n(); return !N.cur && !N.queue.length && !NX.ui.skinlab.open && (N.loc === 'floor' || N.loc === 'dock') && N.alpha > .9 && !N.rot; };

  /** Почати здібність реліквії id (why: 'tap' | 'idle'). Повертає false, якщо Nexi зайнятий або здібність уже триває. */
  function show(id, why) {
    if (S.act || !POSE[id] || !free()) return false;
    const N = n(), t = NX.time, D = DUR[id];
    S.act = { id, t0: t, D, why, done: {} }; S.bolt = null; S.flash = 0; S.bits = [];
    N.lastCmd = t; N.back = false; N.temp = POSE[id]; N.tempT = t + D; N.hiT = 0; N.emote(MOOD[id], D + .4);
    if (why === 'tap') N.say(NX.pick('act.relic.' + id));
    if (id === 'balloon') N.hops = 0;
    return true;
  }
  /** Тап по Nexi з реліквією в руці (nexi.js: hi). */
  const tap = id => show(id, 'tap');

  function update(dt, t) {
    const N = n(), hand = N.look.hand;
    if (S.flash > 0) S.flash -= dt;
    // іноді сам — раз на 30–70 с, лише вільний на підлозі (власник: «молот іноді підіймає вгору»)
    if (!S.act) { if (!S.next) S.next = t + 20 + r() * 30; if (hand && t > S.next && !N.talking && t - N.lastCmd > 6) { S.next = t + 30 + r() * 40; show(hand, 'idle'); } return; }
    const A = S.act, k = (t - A.t0) / A.D; if (k >= 1 || N.cur || N.look.hand !== A.id) { S.act = null; S.bolt = null; S.bits = []; if (N.temp === POSE[A.id]) N.tempT = 0; S.next = t + 30 + r() * 40; return; }
    const G = geo(), F = NX.fx, once = (key, f) => { if (!A.done[key]) { A.done[key] = 1; f(); } };
    switch (A.id) {
      case 'hammer': {                                                               // 0.35: удар блискавки вгору зі спалахом і громом, далі ще два коротші
        [.35, .62, .8].forEach((at, i) => { if (k >= at) once('b' + i, () => { S.bolt = { t0: t, len: i ? 70 + r() * 40 : 150 + r() * 60, main: !i }; if (!i) { S.flash = .35; NX.nexiPhys.kick(2); F.emit('ring', G.X, G.Y, { col: '#9af6ff', gr: 140, ttl: .55 }); } }); });
        if (k > .3 && r() < .5) F.emit('spark', G.up[0] + (r() - .5) * 10, G.up[1], { col: r() < .5 ? '#9af6ff' : '#ffffff', vy: -40 - r() * 60 });
        break; }
      case 'blade': case 'sword': {                                                    // розчерки: два змахи, неонові (лазер) чи сталеві (меч) риски
        if (r() < .7) F.emit('line', G.fwd[0] + (r() - .5) * 20 * G.s, G.fwd[1] - r() * 18 * G.s, { w: 10, col: A.id === 'blade' ? (r() < .5 ? '#ff4fd8' : '#3be8ff') : '#ffffff', vx: G.d * 40 });
        if (A.id === 'sword' && r() < .3) F.emit('spark', G.fwd[0], G.fwd[1] - 10 * G.s, { col: '#ffffff' });
        break; }
      case 'gauntlet': {                                                             // кулак угору, сяйво росте; 0.5 — клацання: золоті іскри й біти
        if (k >= .5) once('snap', () => { S.flash = .25; NX.nexiPhys.kick(1.6); for (let i = 0; i < 18; i++) F.emit('spark', G.up[0], G.up[1], { col: r() < .6 ? '#ffd45a' : '#fff6c0', vx: (r() - .5) * 140, vy: -r() * 120 }); F.emit('ring', G.X, G.Y, { col: '#ffd45a', gr: 100 }); });
        if (k > .5 && r() < .4) F.emit('bit', G.X + (r() - .5) * 40 * G.s, G.Y - r() * G.top, { col: '#ffd45a', ttl: .6 });
        break; }
      case 'excalibur': {                                                            // стовп світла з неба на Nexi, зорі-іскри
        if (k >= .3) once('beam', () => { S.flash = .2; F.emit('ring', G.X, G.Y, { col: '#fff6c0', gr: 90 }); });
        if (k > .3 && r() < .5) F.emit('spark', G.X + (r() - .5) * 30 * G.s, G.Y - G.top - 10 - r() * 60, { col: '#ffffff', vy: 30 + r() * 40, g: 0, ttl: .8 });
        break; }
      case 'staff': {                                                                // кристал пульсує, сніжинки по спіралі вгору, крижане кільце
        if (k >= .25) once('frost', () => F.emit('ring', G.X, G.Y, { col: '#9af6ff', gr: 110, ttl: .7 }));
        if (r() < .6) { const a = t * 6 + r() * .4, rr = 10 + k * 22; F.emit('snow', G.X + Math.cos(a) * rr * G.s, G.Y - G.top * (.2 + k * .9), { vy: -10, vx: 0, ttl: 1.2 }); }
        if (k > .25 && r() < .3) F.emit('spark', G.up[0] + (r() - .5) * 8, G.up[1] - 4, { col: '#cfefff', vy: -20 });
        break; }
      case 'trident': {                                                              // випад — хвиля по підлозі вперед і бризки
        if (k >= .3) once('wave', () => { NX.nexiPhys.kick(1.2); F.emit('ring', G.X + G.d * 18, G.Y, { col: '#4ac0ff', gr: 120, ttl: .7 }); for (let i = 0; i < 14; i++) F.emit('bubble', G.fwd[0] + G.d * r() * 30, G.Y - r() * 20, { vx: G.d * (20 + r() * 60), vy: -30 - r() * 50 }); });
        if (k > .3 && r() < .5) F.emit('bubble', G.fwd[0] + G.d * (10 + r() * 50), G.Y - r() * 12, { vx: G.d * 30, vy: -20 });
        break; }
      case 'wand': {                                                                 // зоряний слід за кінчиком, кільце зірок, сердечка
        if (r() < .8) F.emit('spark', G.fwd[0] + (r() - .5) * 16 * G.s, G.fwd[1] - 20 * G.s + (r() - .5) * 12, { col: ['#ffe27a', '#ff7af0', '#ffffff'][r() * 3 | 0], vy: -10 - r() * 20, g: 10, ttl: .9 });
        if (k >= .45) once('ring', () => { for (let i = 0; i < 12; i++) { const a = i / 12 * TAU; F.emit('spark', G.X + Math.cos(a) * 26 * G.s, G.Y - G.top * .5 + Math.sin(a) * 18 * G.s, { col: '#ffe27a', vx: Math.cos(a) * 30, vy: Math.sin(a) * 30 - 10, g: 0, ttl: .8 }); } });
        if (k > .6 && r() < .25) F.emit('heart', G.X + (r() - .5) * 30 * G.s, G.Y - G.top);
        break; }
      case 'balloon': {                                                              // три підскоки — кулька тягне вгору
        [.1, .45, .8].forEach((at, i) => { if (k >= at) once('h' + i, () => { NX.nexiPhys.kick(2.4); for (let q = 0; q < 5; q++) F.emit('dust', G.X + (r() - .5) * 20, G.Y); }); });
        break; }
      case 'torch': {                                                                // полум'я вгору, жаринки
        if (r() < .9) F.emit('fire', G.up[0] + (r() - .5) * 6 * G.s, G.up[1] - 6 * G.s, { vy: -50 - r() * 50 });
        if (r() < .2) F.emit('spark', G.up[0] + (r() - .5) * 10, G.up[1] - 10, { col: '#ff9a3a', vy: -40 - r() * 60, g: 20, ttl: .9 });
        break; }
      case 'magnet': {                                                               // біти злітаються до магніту
        if (r() < .7 && k < .8) { const a = r() * TAU, rr = 60 + r() * 40; S.bits.push({ x: G.fwd[0] + Math.cos(a) * rr, y: G.fwd[1] + Math.sin(a) * rr * .6, col: r() < .5 ? '#ff6a6a' : '#6a8aff', age: 0 }); }
        S.bits.forEach(b => { b.age += dt; const dx = G.fwd[0] - b.x, dy = G.fwd[1] - b.y, dd = Math.hypot(dx, dy) || 1, sp = (60 + b.age * 200) * dt; b.x += dx / dd * Math.min(sp, dd); b.y += dy / dd * Math.min(sp, dd); if (dd < 3) { b.dead = 1; F.emit('spark', b.x, b.y, { col: b.col, ttl: .3 }); } });
        S.bits = S.bits.filter(b => !b.dead && b.age < 2);
        break; }
      case 'shield': {                                                               // купол, біти відскакують
        if (r() < .4 && k > .15 && k < .85) { const a = -r() * Math.PI; F.emit('bit', G.X + Math.cos(a) * 34 * G.s, G.Y - G.top * .5 + Math.sin(a) * 30 * G.s, { col: '#3be8ff', vx: Math.cos(a) * 60, vy: Math.sin(a) * 60, ttl: .5 }); }
        if (k >= .15) once('dome', () => { F.emit('ring', G.X, G.Y, { col: '#3be8ff', gr: 80 }); NX.nexiPhys.kick(1); });
        break; }
    }
  }

  /** Шар поверх Nexi: блискавка молота, стовп світла, купол щита, сяйво рукавиці / факела / посоха. */
  function layers(t) {
    const A = S.act; if (!A && S.flash <= 0) return [];
    const N = n(), G = geo(), P = NX.px;
    return [{ y: N.depthY() + 1, draw: c => {
      c.save(); c.globalCompositeOperation = 'lighter';
      if (S.flash > 0) P.glow(c, G.X, G.Y - G.top * .5, G.top * 1.4, 'rgba(255,255,255,.9)', Math.min(1, S.flash * 3));
      if (!A) { c.restore(); return; }
      const k = (t - A.t0) / A.D, [hx, hy] = G.up;
      if (A.id === 'hammer') {
        P.glow(c, hx, hy, 14 * G.s, 'rgba(120,230,255,.8)', .35 + .35 * Math.sin(t * 20));
        const B = S.bolt; if (B && t - B.t0 < .45) { const a = 1 - (t - B.t0) / .45, top = hy - B.len * (B.main ? 1 : .7), segs = 9;
          for (let pass = 0; pass < 2; pass++) { c.strokeStyle = pass ? `rgba(255,255,255,${a})` : `rgba(120,230,255,${a * .8})`; c.lineWidth = pass ? 1.5 : 4.5; c.beginPath(); c.moveTo(hx, hy);
            for (let q = 1; q <= segs; q++) { const f = q / segs, j = q < segs ? (P.hash(q * 7 + Math.floor(t * 30)) - .5) * 18 : 0; c.lineTo(hx + j, hy + (top - hy) * f); } c.stroke();
            if (B.main && pass) { c.lineWidth = 1.2; [[.5, 16 * G.d, -22], [.3, -14 * G.d, -16]].forEach(([f, dx, dy]) => { c.beginPath(); c.moveTo(hx, hy + (top - hy) * f); c.lineTo(hx + dx, hy + (top - hy) * f + dy); c.stroke(); }); } }
          P.glow(c, hx, top, 34, 'rgba(180,240,255,.9)', a * .8); P.glow(c, hx, hy, 30, 'rgba(180,240,255,.9)', a * .6); }
      } else if (A.id === 'excalibur' && k > .3) {                                     // стовп світла з неба
        const a = Math.min(1, (k - .3) * 4) * (k > .85 ? (1 - k) / .15 : 1), w = 22 * G.s, g = c.createLinearGradient(0, G.Y - G.top - 160, 0, G.Y);
        g.addColorStop(0, `rgba(255,246,200,0)`); g.addColorStop(.3, `rgba(255,246,200,${.5 * a})`); g.addColorStop(1, `rgba(255,246,200,${.15 * a})`);
        c.fillStyle = g; c.fillRect(G.X - w, G.Y - G.top - 160, w * 2, G.top + 160); P.glow(c, hx, hy - 6 * G.s, 16 * G.s, 'rgba(255,255,255,.9)', a * .6);
      } else if (A.id === 'shield' && k > .15) {                                       // купол
        const a = (k < .3 ? (k - .15) / .15 : k > .85 ? (1 - k) / .15 : 1) * .8, R = 36 * G.s;
        c.strokeStyle = `rgba(59,232,255,${a})`; c.lineWidth = 1.5; c.beginPath(); c.ellipse(G.X, G.Y - G.top * .45, R, R * .95, 0, Math.PI, TAU); c.stroke();
        c.strokeStyle = `rgba(122,244,255,${a * .5})`; c.setLineDash([3, 4]); c.lineDashOffset = -t * 30; c.beginPath(); c.ellipse(G.X, G.Y - G.top * .45, R * .85, R * .8, 0, Math.PI, TAU); c.stroke(); c.setLineDash([]);
        P.glow(c, G.X, G.Y - G.top * .45, R, 'rgba(59,232,255,.5)', a * .4);
      } else if (A.id === 'gauntlet') P.glow(c, hx, hy, (10 + 10 * k) * G.s, 'rgba(255,212,90,.9)', .3 + .3 * Math.sin(t * 12));
      else if (A.id === 'torch') P.glow(c, hx, hy - 6 * G.s, 22 * G.s, 'rgba(255,170,70,.8)', .45 + .2 * Math.sin(t * 17) + .1 * Math.sin(t * 31));
      else if (A.id === 'staff') P.glow(c, hx, hy - 4 * G.s, 14 * G.s, 'rgba(160,230,255,.9)', .3 + .3 * Math.sin(t * 8));
      else if (A.id === 'magnet') { S.bits.forEach(b => { c.fillStyle = b.col; c.fillRect(b.x - 1, b.y - 1, 2, 2); }); P.glow(c, G.fwd[0], G.fwd[1], 12 * G.s, 'rgba(255,120,120,.6)', .3); }
      else if (A.id === 'blade') { const sw = Math.sin(t * 12); c.strokeStyle = sw > 0 ? 'rgba(255,79,216,.6)' : 'rgba(59,232,255,.6)'; c.lineWidth = 2; c.beginPath(); c.arc(G.X + G.d * 6 * G.s, G.Y - G.top * .6, 24 * G.s, G.d > 0 ? -1.2 : Math.PI - .4, G.d > 0 ? .4 : Math.PI + 1.2); c.stroke(); }
      c.restore();
    } }];
  }
  return { S, show, tap, update, layers, POSE, DUR, busy: () => !!S.act };
})();

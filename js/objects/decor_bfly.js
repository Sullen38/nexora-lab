/* ============================================================================
 * objects/decor_bfly.js — МЕТЕЛИКИ КІМНАТИ (чат «Кімната — правки», 16.11)
 * ----------------------------------------------------------------------------
 * Власник (16.11, 22:29): «метеликів зроби штук 5 на всю кімнату, і щоб метелики гарненькі були — теж реальні види; і коли його
 * ловиш — теж карточка була»; раніше: «коли підлітає дрон, вони розліталися, а потім знову прилітали».
 * П'ять справжніх видів, по одному метелику кожного, літають УСІЄЮ кімнатою: морфо Менелай (синій з чорною облямівкою), монарх
 * (помаранчевий із чорними жилками й білими цятками), махаон (жовтий із чорними перев'язами, синьою стрічкою, червоним вічком і
 * хвостиками), павичеве око (чотири «очі»), птахокрилка Пріама (чорно-зелена). Вигляд — зверху, тільце вздовж руху.
 *   • Поведінка: метелик обирає квітку (гірлянда над вікном і квіти підвіконня — NX.planters.perches(); рослини декору) або точку в
 *     повітрі, летить туди хвилястою лінією, на квітці сидить 4–11 с, повільно складаючи крила, і летить далі — щоразу в інший бік
 *     кімнати. Від дрона-колібрі (NX.planters.drone()) тікає; коли дрон відлетів — повертається до квітів.
 *   • Тап (спіймати): tap(x, y, t) -> вид; метелик зривається з місця; картку показує objects/decor_guide.js (група bfly).
 *   • at(v, t) — де метелик v: потрібне котові Рудику (actors/cat/cat.js полює через NX.decorLive.butterflyAt).
 * Малюється з objects/decor_live.js (етап fx). Спрайт — раз у полотно 4 px/од.; щокадру — лише рух і помах (стиск по ширині).
 * ========================================================================== */
(() => {
  const TAU = Math.PI * 2;
  const KINDS = ['morpho', 'monarch', 'machaon', 'peacock', 'birdwing'];
  const fore = c => { c.beginPath(); c.moveTo(.35, -1.3); c.bezierCurveTo(1.6, -4.9, 5.4, -5.2, 6.3, -3.9); c.bezierCurveTo(6.5, -2.4, 4.4, -.5, .5, .3); c.closePath(); };
  const hind = (c, tail) => { c.beginPath(); c.moveTo(.45, 0); c.bezierCurveTo(3.4, -.5, 5.2, 1.2, 4.6, 2.9); if (tail) { c.lineTo(4.1, 3.7); c.lineTo(4.4, 5.6); c.lineTo(3.6, 5.5); c.lineTo(3.2, 4); } c.bezierCurveTo(3.4, 4.5, 1.5, 4.4, .45, 1.9); c.closePath(); };
  const dot = (c, x, y, r, col) => { c.fillStyle = col; c.beginPath(); c.arc(x, y, r, 0, TAU); c.fill(); };
  const rim = (c, w, col) => { c.strokeStyle = col; c.lineWidth = w * 2; c.stroke(); };                      // облямівка: обвід удвічі ширший, зовнішню половину зрізає clip
  const line = (c, x0, y0, x1, y1, w, col) => { c.strokeStyle = col; c.lineWidth = w; c.beginPath(); c.moveTo(x0, y0); c.lineTo(x1, y1); c.stroke(); };
  /** Одне крило (праве; ліве — дзеркалом): f — малювальник усередині контуру. */
  const wing = (c, path, f) => { c.save(); path(c); c.clip(); f(); c.restore(); path(c); c.strokeStyle = '#05060e'; c.lineWidth = .28; c.stroke(); };
  const PAINT = {
    morpho(c) {
      const G = c.createRadialGradient(0, -.5, .3, 0, -.5, 6.6); G.addColorStop(0, '#9af6ff'); G.addColorStop(.45, '#2a8aff'); G.addColorStop(1, '#0a2aa8');
      wing(c, hind, () => { c.fillStyle = G; c.fillRect(0, -1, 7, 7); hind(c); rim(c, .75, '#05060e'); });
      wing(c, fore, () => { c.fillStyle = G; c.fillRect(0, -6, 7, 7); fore(c); rim(c, .85, '#05060e'); for (const [x, y] of [[5.5, -3.9], [5.5, -3], [5, -2.1], [4.3, -1.4]]) dot(c, x, y, .26, '#eaffff'); line(c, .8, -1.2, 5.2, -4, .2, '#bff6ff'); });
    },
    monarch(c) {
      const veins = (x0, y0, pts) => { for (const [x, y] of pts) line(c, x0, y0, x, y, .3, '#0a0a12'); };
      wing(c, hind, () => { c.fillStyle = '#ff8a1a'; c.fillRect(0, -1, 7, 7); dot(c, 1.6, 1.4, 1.6, '#ffb040'); veins(.5, .6, [[4.9, 1.2], [4.6, 2.8], [3.2, 4.2], [1.6, 4]]); hind(c); rim(c, .8, '#0a0a12'); for (const [x, y] of [[4.5, 1.6], [4.3, 2.6], [3.7, 3.5], [2.7, 3.9], [1.7, 3.7]]) dot(c, x, y, .2, '#ffffff'); });
      wing(c, fore, () => { c.fillStyle = '#ff8a1a'; c.fillRect(0, -6, 7, 7); dot(c, 1.8, -1.6, 1.8, '#ffb040'); veins(.5, -.7, [[5.9, -4.4], [6.3, -3.2], [5.4, -1.6], [3.8, -.6]]); fore(c); rim(c, .9, '#0a0a12'); dot(c, 5.2, -3.9, .9, '#0a0a12');
        for (const [x, y] of [[5.7, -3.9], [5.8, -3.1], [5.3, -2.2], [4.6, -1.5], [3.6, -.9], [4.8, -4.2], [5.1, -3.5]]) dot(c, x, y, .2, '#ffffff'); });
    },
    machaon(c) {
      wing(c, c2 => hind(c2, 1), () => { c.fillStyle = '#ffe24a'; c.fillRect(0, -1, 7, 8); hind(c, 1); rim(c, 1.15, '#0a0a12'); for (const [x, y] of [[4.1, 1.5], [4, 2.5], [3.3, 3.3], [2.4, 3.6], [1.5, 3.3]]) dot(c, x, y, .36, '#3a7aff'); dot(c, .95, 2.35, .5, '#e8304a'); dot(c, .95, 2.35, .2, '#ffb040'); c.fillStyle = '#0a0a12'; c.fillRect(3.3, 4, 1.2, 1.8); });
      wing(c, fore, () => { c.fillStyle = '#ffe24a'; c.fillRect(0, -6, 7, 7); c.fillStyle = '#0a0a12'; c.beginPath(); c.moveTo(0, -1.6); c.lineTo(1.5, -2.9); c.lineTo(1.3, -.2); c.lineTo(0, .3); c.closePath(); c.fill();
        for (const [x, y, a] of [[2.5, -3.5, -.5], [3.7, -4, -.35]]) { c.save(); c.translate(x, y); c.rotate(a); c.fillRect(-.35, -.9, .7, 1.8); c.restore(); } fore(c); rim(c, 1, '#0a0a12'); for (const [x, y] of [[5.6, -3.5], [5.3, -2.6], [4.7, -1.8], [3.9, -1.2], [3, -.8]]) dot(c, x, y, .24, '#ffe24a'); });
    },
    peacock(c) {
      const eye = (x, y, r, mid) => { dot(c, x, y, r, '#0a0a12'); dot(c, x, y, r * .82, mid); dot(c, x + r * .1, y - r * .05, r * .52, '#5a9aff'); dot(c, x + r * .15, y, r * .26, '#0a0a12'); dot(c, x - r * .3, y - r * .35, r * .16, '#ffffff'); };
      const G = c.createRadialGradient(0, 0, .5, 0, 0, 6.5); G.addColorStop(0, '#c83a22'); G.addColorStop(1, '#6a160c');
      wing(c, hind, () => { c.fillStyle = G; c.fillRect(0, -1, 7, 7); hind(c); rim(c, .55, '#2a120a'); eye(3.3, 2, 1.1, '#cfe0ff'); });
      wing(c, fore, () => { c.fillStyle = G; c.fillRect(0, -6, 7, 7); c.fillStyle = '#1a0c08'; for (const [x, y] of [[1.9, -3.4], [3, -4.2]]) { c.save(); c.translate(x, y); c.rotate(-.5); c.fillRect(-.4, -.6, .8, 1.2); c.restore(); } dot(c, 2.5, -3.9, .4, '#ffd84a'); fore(c); rim(c, .6, '#2a120a'); eye(4.9, -3.5, 1.2, '#ffd84a'); });
    },
    birdwing(c) {
      const G = c.createLinearGradient(0, 0, 4.5, 4); G.addColorStop(0, '#d8ff4a'); G.addColorStop(1, '#1fc850');
      wing(c, hind, () => { c.fillStyle = G; c.fillRect(0, -1, 7, 7); for (const [x, y] of [[3.3, 1.2], [3.5, 2.4], [2.5, 3.2], [1.5, 2.9]]) dot(c, x, y, .4, '#0a120c'); hind(c); rim(c, .5, '#0a120c'); });
      wing(c, fore, () => { c.fillStyle = '#0a120c'; c.fillRect(0, -6, 7, 7); c.lineCap = 'round'; c.strokeStyle = '#2adf5a'; c.lineWidth = .95; c.beginPath(); c.moveTo(1, -1.9); c.quadraticCurveTo(2.6, -4.6, 5.6, -4.1); c.stroke(); c.beginPath(); c.moveTo(1.3, -.5); c.quadraticCurveTo(3.6, -.9, 5.5, -2.5); c.stroke();
        c.strokeStyle = '#b8ff6a'; c.lineWidth = .25; c.beginPath(); c.moveTo(1.2, -2); c.quadraticCurveTo(2.7, -4.5, 5.4, -4.1); c.stroke(); });
    },
  };
  const BODY = { morpho: ['#2a1c14', '#5a4030'], monarch: ['#0a0a12', '#ffffff'], machaon: ['#0a0a12', '#ffe24a'], peacock: ['#2a120a', '#7a3a22'], birdwing: ['#0a120c', '#ffd84a'] };
  const SPR = {}, U = 4, SW = 14, SH = 12.4, OX = 7, OY = 5.6;
  /** Спрайт виду: полотно 56×50 px, центр тільця — (OX, OY) у од. */
  function sprite(kind) {
    if (SPR[kind]) return SPR[kind]; const cv = document.createElement('canvas'); cv.width = SW * U; cv.height = Math.ceil(SH * U); const c = cv.getContext('2d'); c.scale(U, U); c.translate(OX, OY); c.lineJoin = 'round';
    for (const sd of [1, -1]) { c.save(); c.scale(sd, 1); PAINT[kind](c); c.restore(); }
    const [b0, b1] = BODY[kind]; c.lineCap = 'round'; for (const sd of [1, -1]) { line(c, sd * .15, -2.1, sd * 1.25, -4.3, .2, '#05060e'); dot(c, sd * 1.25, -4.3, .22, '#05060e'); }                 // вусики
    c.fillStyle = '#05060e'; c.beginPath(); c.ellipse(0, .5, .62, 2.5, 0, 0, TAU); c.fill(); dot(c, 0, -1.9, .62, '#05060e'); c.fillStyle = b0; c.beginPath(); c.ellipse(0, .5, .42, 2.3, 0, 0, TAU); c.fill(); dot(c, 0, -1.9, .42, b0);
    c.fillStyle = b1; for (let y = .6; y < 2.6; y += .55) c.fillRect(-.3, y, .6, .2); c.fillStyle = '#ffffff'; c.fillRect(-.28, -2.1, .2, .2); c.fillRect(.08, -2.1, .2, .2);
    return SPR[kind] = cv;
  }
  // ---------- поведінка ----------
  const B = KINDS.map((kind, i) => ({ kind, i, x: 180 + i * 310, y: 50 + (i % 2) * 40, vx: 0, vy: 0, tx: 0, ty: 0, mode: 'new', until: 0, rot: 0, sitRot: 0, sc: -99, perch: false }));
  let PER = [], perT = -99, lastT = 0, STAT = null;
  /** Куди можна сісти: квіти саду (гірлянда, підвіконня) + рослини декору по всій кімнаті. */
  function perches(t) {
    if (t - perT < 2.5) return PER; perT = t;
    if (!STAT) { const { basis } = NX.arc.kit, proj = NX.px3d.proj; STAT = (NX.decor ? NX.decor.items : []).filter(I => /^dc_(hp|kk|tr|rfp|hang|basket|green|mzv)/.test(I.id)).map(I => { const { P } = basis(I), q = proj(P(0, I.dep / 2, I.yt + (I.yb - I.yt) * .25)); return [q[0], q[1]]; }); }
    PER = (NX.planters && NX.planters.perches ? NX.planters.perches(t).map(q => [q[0], q[1] - 2.4]) : []).concat(STAT); return PER;
  }
  const air = (x0 = 60, x1 = 1540) => [x0 + Math.random() * (x1 - x0), 22 + Math.random() * 118];
  function pick(b, t) {
    const P = perches(t); if (P.length && Math.random() < .6) { const far = P.filter(q => Math.abs(q[0] - b.x) > 140), L = far.length && Math.random() < .6 ? far : P, q = L[Math.floor(Math.random() * L.length)]; b.tx = q[0]; b.ty = q[1]; b.perch = true; }
    else { const q = air(); b.tx = q[0]; b.ty = q[1]; b.perch = false; } b.mode = 'fly';
  }
  /** Злякати: летить геть від точки (fx, fy) у вільне повітря, швидко. */
  function flee(b, t, fx, fy) { const sg = b.x >= fx ? 1 : -1, x = Math.max(50, Math.min(1550, b.x + sg * (70 + Math.random() * 90))); b.tx = x; b.ty = Math.max(20, Math.min(140, b.y + (b.y >= fy ? 1 : -1) * (12 + Math.random() * 26))); b.perch = false; b.mode = 'fly'; b.sc = t; }
  function step(t) {
    const dt = Math.min(.1, Math.max(0, t - lastT)); lastT = t; if (!dt) return; const D = NX.planters && NX.planters.drone ? NX.planters.drone() : null;
    for (const b of B) {
      if (b.mode === 'new') pick(b, t);
      if (D && t - b.sc > 2.5 && Math.hypot(D[0] - b.x, D[1] - b.y) < 15) flee(b, t, D[0], D[1]);                                    // дрон-колібрі поруч — геть
      if (b.mode === 'sit') { if (t > b.until) pick(b, t); b.vx *= .8; b.vy *= .8; b.rot += (b.sitRot - b.rot) * Math.min(1, dt * 3); continue; }
      const dx = b.tx - b.x, dy = b.ty - b.y, d = Math.hypot(dx, dy) || 1, fast = t - b.sc < 2.2, v = fast ? 46 : 24, w = Math.sin(t * 4.6 + b.i * 2.1) * (d > 12 ? 11 : 3);   // хвиляста лінія польоту
      const wx = dx / d * v - dy / d * w, wy = dy / d * v + dx / d * w + Math.sin(t * 7.3 + b.i) * 5; b.vx += (wx - b.vx) * Math.min(1, dt * 4.5); b.vy += (wy - b.vy) * Math.min(1, dt * 4.5); b.x += b.vx * dt; b.y += b.vy * dt;
      let a = Math.atan2(b.vx, -b.vy) - b.rot; a = Math.atan2(Math.sin(a), Math.cos(a)); b.rot += a * Math.min(1, dt * 6);
      if (d < 2.6) { if (b.perch) { b.mode = 'sit'; b.until = t + 4 + Math.random() * 7; b.sitRot = (Math.random() - .5) * .9; b.x = b.tx; b.y = b.ty; } else pick(b, t); }
    }
  }
  function draw(c, t, vx0, vx1) {
    step(t); c.save(); c.imageSmoothingEnabled = true;
    for (const b of B) { if (b.x < vx0 - 12 || b.x > vx1 + 12) continue; const sit = b.mode === 'sit', k = sit ? .5 + .5 * Math.abs(Math.sin(t * 1.5 + b.i * 2)) : .22 + .78 * Math.abs(Math.sin(t * 15 + b.i * 1.7)), cv = sprite(b.kind), s = .92;
      c.save(); c.translate(b.x, b.y); c.rotate(b.rot); c.scale(k * s, s); c.drawImage(cv, -OX, -OY, SW, cv.height / U); c.restore(); }
    c.restore();
  }
  /** Спіймати: найближчий метелик у радіусі 8 од. -> його вид (метелик зривається й летить геть); інакше null. */
  function tap(x, y, t = NX.time) { let best = null, bd = 8; for (const b of B) { const d = Math.hypot(x - b.x, y - b.y); if (d < bd) { bd = d; best = b; } } if (!best) return null; flee(best, t, x, y + 6); return best.kind; }
  /** Де метелик v (для кота): {x, y, dir}. */
  const at = v => { const b = B[v]; return b ? { x: b.x, y: b.y, dir: b.vx >= 0 ? 1 : -1 } : null; };
  NX.bfly = { KINDS, sprite, draw, tap, at, all: B };
})();

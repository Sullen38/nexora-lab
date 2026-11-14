/* ============================================================================
 * garden/sec_drip.js — ДІЛЯНКА «КРАПЕЛЬНИЙ ПОЛИВ»: ТОМАТИ Й ОГІРКИ НА ШНУРАХ (як у справжній теплиці)
 * ----------------------------------------------------------------------------
 * Власник (14.11): «Ми маємо реалістично зробити догляд за всіма рослинами, які ми їмо, — помідори, огірки і т.д.».
 * Тут усе, як у тепличному господарстві:
 *   • рослини сидять не в землі, а в матах із субстрату на піднятому жолобі; стебло веде вгору ШНУР від високого дроту;
 *   • КРАПЕЛЬНИЦЯ біля кожного кореня дає воду з добривами малими порціями кілька разів на добу (чорна трубка, кілочки);
 *   • ТОМАТ: щотретій вузол — китиця: бутони → жовті квіти → їх запилюють ДЖМЕЛІ з вулика на стійці (у теплицях саме так)
 *     → зелені плоди → бурі → червоні. Збирають лише червону китицю; під нею знімають старе листя; у пазухах листків
 *     виростають ПАСИНКИ — їх обривають, щоб кущ годував плоди;
 *   • ОГІРОК: плід у кожному вузлі, без запилення (тепличні сорти такі), росте швидко, збирають часто; чіпляється вусиками;
 *   • ФРАМУГИ даху відчиняються вдень, коли спекотно, і зачиняються на ніч; унизу — труби обігріву; вночі джмелі сплять;
 *   • кущ, що віддав увесь урожай, прибирають, і на його місці росте новий сіянець.
 * Nexi (сценарій gDrip — сам у вільний час або на тап по ділянці): знімає стиглі китиці й огірки в ящик, обриває листя під
 * китицею й пасинки; немає роботи — оглядає верхівку. Тап по рослині — картка культури.
 *
 * Малювання: каркас, жолоб, мати, трубки, вулик, шафка поливу, ящик — раз у растр. Кожен кущ — власний невеликий растр,
 * який перемальовується лише коли кущ змінився (підріс, зацвів, достиг, обірвали) — не щокадру. Щокадру — джмелі, краплі,
 * фрамуги, смужки шафки, іскорки на стиглому, плоди в ящику.
 * ========================================================================== */
(() => {
  const P = NX.px, CAT = NX.gardenCat, PL = NX.gardenPlants, G = NX.garden, { Raster, hash, BAYER } = NX.art, S = CAT.sector('drip');
  const BW = 268, BH = 244, OX = S.x0 + 6, OY = CAT.GY - BH;          // місце ділянки: кут (кімната) і розмір
  const NP = 6, PX = i => 26 + i * 40, BASE_V = 186, WIRE_V = 24;     // кущі: x основи, верх мата, високий дріт (локально, од.)
  const VW = 168, VH = 336, STEP = 26, NODES = 11;                    // растр куща (px), крок вузлів (px)
  const TL = ['#0e3320', '#17502a', '#236e34', '#349041', '#52b054', '#84d070'], CL = ['#134a22', '#1f6a2c', '#2f8c38', '#48ac46', '#74cc5c', '#aee67c'];
  let FRAME = null; const ICON = {};
  ['tomato', 'cucumber'].forEach(id => { CAT.crop(id).on = true; });

  function build() {
    const cv = document.createElement('canvas'); cv.width = BW * 2; cv.height = BH * 2; const c = cv.getContext('2d'); c.scale(2, 2);
    const R = (x, y, w, h, col) => { c.fillStyle = col; c.fillRect(x, y, w, h); };
    c.fillStyle = 'rgba(214,240,255,.34)'; c.fillRect(8, 19, 252, 177);                                                                           // скло задньої стінки: кущі читаються на тлі парку
    for (let x = 50; x < 260; x += 42) R(x, 19, .5, 177, 'rgba(255,255,255,.5)'); R(8, 104, 252, .5, 'rgba(255,255,255,.5)');
    c.fillStyle = 'rgba(214,240,255,.22)'; c.beginPath(); c.moveTo(4, 18); c.lineTo(134, 2); c.lineTo(264, 18); c.closePath(); c.fill();          // скло даху
    for (let x = 4; x <= 134; x += .5) { const y = 18 - (x - 4) / 130 * 16; R(x, y, .5, 2, '#f4f7ff'); R(268 - x - .5, y, .5, 2, '#dfe6f4'); }           // крокви
    for (const x of [4, 260]) { R(x, 16, 4, 228, '#dfe6f4'); R(x, 16, 1, 228, '#ffffff'); R(x + 3, 16, 1, 228, '#9aa4c4'); R(x - 1, 240, 6, 4, '#9aa4c4'); }   // стійки
    R(4, 16, 260, 3, '#dfe6f4'); R(4, 16, 260, 1, '#ffffff'); R(8, WIRE_V, 252, .5, '#c8d0e0');                                                  // балка й високий дріт
    for (let i = 0; i < NP; i++) R(PX(i), WIRE_V, .5, BASE_V - WIRE_V, 'rgba(240,244,255,.55)');                                                  // шнури
    R(10, 196, 248, 8, '#b4bed8'); R(10, 196, 248, 1.5, '#f0f3fb'); R(10, 203, 248, 1, '#7a84a8'); for (const x of [30, 132, 234]) { R(x, 204, 3, 40, '#9aa4c4'); R(x, 204, 1, 40, '#dfe6f4'); }   // жолоб на ніжках
    for (let s = 0; s < 3; s++) { const x = 12 + s * 82; R(x, BASE_V, 78, 10, '#f6f8fd'); R(x, BASE_V + 8, 78, 2, '#c2c8dc'); R(x, BASE_V, 78, 1, '#ffffff'); R(x + 30, BASE_V + 3, 18, 4, '#3c9a3e'); R(x + 33, BASE_V + 4.5, 12, 1, '#d6f4a0'); }   // мати субстрату
    R(10, 181, 250, 1.5, '#22222c'); R(10, 181, 250, .5, '#55556a');                                                                               // трубка крапельного поливу
    for (let i = 0; i < NP; i++) { const x = PX(i) + 5; R(x, 182.5, .5, 5, '#22222c'); R(x - 1, 180, 2.5, 2, '#3be8ff'); R(PX(i) - 3, BASE_V, 6, 1.5, '#5a4030'); }
    for (const y of [228, 236]) { R(8, y, 252, 3, '#e4e8f2'); R(8, y, 252, 1, '#ffffff'); R(8, y + 2.5, 252, .5, '#9aa4c4'); }                     // труби обігріву
    for (let x = 20; x < 260; x += 60) R(x, 226, 1.5, 18, '#7a84a8');
    R(8, 132, 16, 14, '#e8c890'); R(8, 132, 16, 1.5, '#fff0c8'); R(8, 144.5, 16, 1.5, '#a8885a'); R(13, 138, 5, 3, '#3a2a1a'); R(9, 134, 6, 3, '#ffd84a'); R(9, 135, 6, 1, '#2a2040');   // вулик джмелів
    R(240, 112, 22, 44, '#2a3060'); R(240, 112, 22, 1.5, '#8a94c8'); R(240, 154.5, 22, 1.5, '#12082a'); R(243, 116, 16, 18, '#050818'); R(243, 140, 5, 5, '#3be8ff'); R(251, 140, 8, 2, '#8a94c8'); R(251, 144, 8, 2, '#8a94c8'); R(250, 156, 1.5, 25, '#22222c');   // шафка поливу
    R(236, 224, 28, 20, '#a8784a'); R(236, 224, 28, 2, '#d8a878'); for (const y of [230, 236]) R(236, y, 28, 1, '#7a5236'); R(236, 242, 28, 2, '#5a3a26'); R(236, 224, 1.5, 20, '#d8a878'); R(262.5, 224, 1.5, 20, '#7a5236');   // ящик для врожаю
    return cv;
  }

  // ---------- кущ: стан і растр ----------
  const fruit = (r, x, y, rad, pal) => { for (let j = -rad; j <= rad; j++) for (let i = -rad; i <= rad; i++) { const d = (i * i + j * j) / (rad * rad + .6); if (d > 1) continue; r.set(x + i, y + j, pal[d > .72 || (i > 0 && j > 0 && d > .4) ? 0 : (i < 0 && j < 0 && d < .5) ? 2 : 1]); } if (rad > 2) r.set(x - rad * .4, y - rad * .4, '#ffffff'); };
  const TF = { 2: ['#2a6a24', '#58a838', '#9ad85a'], 3: ['#2a6a24', '#62b23c', '#a8e062'], 4: ['#a04a14', '#f08a2a', '#ffc06a'], 5: ['#8a1418', '#e8342a', '#ff8a6a'] };
  function mk(i) { return { i, kind: i < 3 ? 'tomato' : 'cucumber', g: 0, nodes: [], cv: null, dirty: true, drawn: -1, out: 0, fade: 1 }; }
  function addNode(p, age) { const j = p.nodes.length, tom = p.kind === 'tomato'; p.nodes.push({ j, age, leaf: true, suck: false, fr: tom ? (j % 3 === 2 ? 0 : -1) : (j >= 1 ? 0 : -1), pol: !tom, tp: 0 }); }
  const hpx = p => Math.min(VH - 30, 14 + p.g * (VH - 44)), nodeY = j => 18 + j * STEP;
  function render(p) {
    const r = Raster(VW, VH), bx = VW / 2, by = VH - 2, H = hpx(p), tom = p.kind === 'tomato', pal = tom ? TL : CL, sx = y => bx + Math.sin(y * .09) * 2;
    for (let y = 0; y < H; y++) { const x = sx(y); r.set(x, by - y, pal[2]); r.set(x + 1, by - y, pal[3]); if (tom && y < H * .7) r.set(x - 1, by - y, pal[1]); }
    r.set(sx(H), by - H - 1, pal[4]); r.set(sx(H) + 1, by - H - 2, pal[5]);                                         // верхівка
    for (const nd of p.nodes) {
      const y = nodeY(nd.j); if (y > H) break; const x = sx(y), Y = by - y, sg = nd.j % 2 ? 1 : -1, sc = Math.max(.4, Math.min(1, (H - y + 8) / 70));
      if (nd.leaf) {
        const ex = x + sg * 10 * sc, ey = Y - 3 * sc; r.line(x, Y, ex, ey, pal[2]);
        if (tom) { const a = sg > 0 ? .4 : Math.PI - .4; PL.leaf(r, ex, ey, 26 * sc, 7 * sc, a, pal, .5, nd.j);                                 // складний лист: верхівковий листочок і дві пари
          for (const [d, s2] of [[5, 1], [14, .85]]) for (const up of [-1, 1]) PL.leaf(r, ex + Math.cos(a) * d * sc, ey + Math.sin(a) * d * sc, 14 * sc * s2, 4.6 * sc * s2, a + up * 1.05 * (sg > 0 ? 1 : -1), pal, .5, nd.j + d); }
        else { const a = sg > 0 ? .15 : Math.PI - .15; PL.leaf(r, ex - sg * 2, ey, 24 * sc, 10 * sc, a, pal, .35, nd.j); for (const up of [-1, 1]) PL.leaf(r, ex, ey, 14 * sc, 6 * sc, a + up * .85, pal, .35, nd.j + 9);    // широкий лопатевий лист
          for (let k = 0; k < 7; k++) r.set(x - sg * (2 + k * .8), Y - 2 - Math.sin(k * 1.1) * 3, pal[5]); }                                       // вусик
      }
      if (nd.suck) { r.line(x, Y, x + sg * 6, Y - 7, '#84d070'); r.rect(x + sg * 6 - 1, Y - 9, 3, 2, '#b4f48e'); r.rect(x + sg * 4, Y - 6, 2, 2, '#a6ee7a'); }
      const st = nd.fr; if (st < 0 || st > 5) continue; const fs = -sg;                                             // плоди — з протилежного від листка боку
      if (tom) { r.line(x, Y, x + fs * 7, Y + 3, pal[3]);
        for (let k = 0; k < 5; k++) { const fx = x + fs * (9 + (k % 2) * 7 + k * 1.2), fy = Y + 6 + k * 5.6;
          if (st === 0) { r.rect(fx, fy - 2, 2, 2, pal[4]); } else if (st === 1) { r.rect(fx - 1, fy - 2, 3, 1, '#ffe27a'); r.rect(fx, fy - 3, 1, 3, '#ffe27a'); r.set(fx, fy - 2, '#ff9a3a'); }
          else { const col = st === 4 && k > 2 ? TF[3] : TF[st]; const q = st === 2 ? 3 : st === 3 ? 5 : 6; fruit(r, fx, fy, q, col); r.rect(fx - 1, fy - q, 3, 1, '#2f7c40'); r.set(fx, fy - q - 1, '#52b054'); } } }
      else { const fx = x + fs * 5, len = [0, 0, 7, 13, 20][st] || 0; r.line(x, Y, fx, Y + 2, pal[3]);
        if (st <= 1) { r.rect(fx - 1, Y + 2, 3, 3, '#ffe27a'); r.set(fx, Y + 3, '#ff9a3a'); if (st === 1) r.rect(fx, Y + 5, 1, 3, pal[3]); }
        else { for (let k = 0; k < len; k++) { const w = k < 2 || k > len - 3 ? 1 : 2; for (let i = -w; i <= w; i++) r.set(fx + i, Y + 3 + k, i < 0 ? '#3a9440' : i === 0 ? '#1f6a2c' : '#124a20'); if (k % 4 === 1) r.set(fx - 1, Y + 3 + k, '#a6ee7a'); }
          if (st < 4) r.rect(fx - 1, Y + 3 + len, 3, 2, '#ffe27a'); } }
    }
    NX.art.outline(r, '#12082a');
    if (!p.cv) { p.cv = document.createElement('canvas'); p.cv.width = VW; p.cv.height = VH; }
    p.cv.getContext('2d').putImageData(new ImageData(r.d, VW, VH), 0, 0); p.dirty = false; p.drawn = Math.floor(H / 4);
  }
  /** Значки культур для картки (44 × 44): китиця томатів і огірок із квіткою. */
  function icons() {
    let r = Raster(44, 44); r.line(22, 4, 22, 14, TL[3]); PL.leaf(r, 22, 8, 16, 5, -.5, TL, .5, 1); PL.leaf(r, 22, 8, 14, 4.5, Math.PI + .4, TL, .5, 2);
    [[14, 22, 7], [28, 20, 7], [21, 32, 8]].forEach(([x, y, q]) => { fruit(r, x, y, q, TF[5]); r.rect(x - 1, y - q, 3, 1, '#2f7c40'); }); NX.art.outline(r, '#12082a'); ICON.tomato = r.canvas();
    r = Raster(44, 44); PL.leaf(r, 20, 12, 22, 9, -.3, CL, .35, 3); for (let k = 0; k < 26; k++) { const w = k < 2 || k > 23 ? 2 : 3; for (let i = -w; i <= w; i++) r.set(16 + k * .35 + i, 14 + k, i < -1 ? '#3a9440' : i < 2 ? '#1f6a2c' : '#124a20'); if (k % 5 === 2) r.set(15 + k * .35, 14 + k, '#a6ee7a'); }
    r.rect(24, 39, 4, 3, '#ffe27a'); NX.art.outline(r, '#12082a'); ICON.cucumber = r.canvas();
  }

  const plants = Array.from({ length: NP }, (_, i) => mk(i));
  plants.forEach((p, i) => {                                                                                      // на вході кущі різного віку: є і цвіт, і стигле
    p.g = [.95, .6, .28, .85, .5, .2][i]; const n = Math.floor((hpx(p) - 18) / STEP) + 1;
    for (let j = 0; j < n; j++) { addNode(p, (n - j) * 16); const nd = p.nodes[j]; if (nd.fr === 0) { const a = nd.age; if (p.kind === 'tomato') { nd.pol = a > 30; nd.tp = 22; nd.fr = a > 100 ? 5 : a > 84 ? 4 : a > 62 ? 3 : a > 40 ? 2 : a > 12 ? 1 : 0; } else nd.fr = a > 70 ? 4 : a > 44 ? 3 : a > 24 ? 2 : 1; } }
    if (p.kind === 'tomato' && p.nodes[1]) p.nodes[1].suck = i !== 2;
  });
  const bees = [0, 1].map(i => ({ x: 16, y: 139, tx: 16, ty: 139, wait: 2 + i * 3, node: null }));
  let dripT = 4, crate = 0;
  const nodeRoom = (p, nd) => [OX + PX(p.i), OY + BASE_V - nodeY(nd.j) / 2];
  const ripeOf = p => p.nodes.filter(nd => nd.fr === (p.kind === 'tomato' ? 5 : 4));
  const stageOf = p => ripeOf(p).length ? 2 : p.g < .2 ? 0 : 1;

  function update(dt, t) {
    const nk = G.night();
    dripT -= dt; if (dripT < -4) dripT = 9;                                                                       // порція поливу: 4 с що 13 с
    for (const p of plants) {
      if (p.out > 0) { p.out -= dt; p.fade = Math.max(0, p.out / 2); if (p.out <= 0) { Object.assign(p, mk(p.i), { cv: p.cv }); addNode(p, 0); p.g = .04; } continue; }
      p.fade = Math.min(1, p.fade + dt); if (p.g < 1) p.g = Math.min(1, p.g + dt / (p.kind === 'tomato' ? 210 : 150));
      const H = hpx(p); while (p.nodes.length < NODES && nodeY(p.nodes.length) <= H) { addNode(p, 0); p.dirty = true; }
      if (Math.floor(H / 4) !== p.drawn) p.dirty = true;
      for (const nd of p.nodes) { nd.age += dt; const f0 = nd.fr; if (f0 < 0 || f0 > 5) continue;
        if (p.kind === 'tomato') { if (f0 === 0 && nd.age > 8) nd.fr = 1; else if (f0 === 1) { if (!nd.pol && nd.age > 34) nd.pol = true; if (nd.pol) { nd.tp += dt; if (nd.tp > 6) nd.fr = 2; } } else if (f0 < 5) { nd.tp += dt; if (nd.tp > [0, 0, 22, 40, 54][f0]) nd.fr = f0 + 1; }
          if (nd.leaf && !nd.suck && nd.age > 20 && Math.random() < dt * .006 && p.nodes.filter(q => q.suck).length < 2) { nd.suck = true; p.dirty = true; } }
        else { nd.tp += dt; if (f0 < 4 && nd.tp > [5, 12, 24, 38][f0]) nd.fr = f0 + 1; }
        if (nd.fr !== f0) p.dirty = true; }
      if (p.g >= 1 && p.nodes.length >= NODES && p.nodes.every(nd => nd.fr < 0 || nd.fr > 5)) p.out = 2;         // віддав увесь урожай — на його місці новий сіянець
      if (p.dirty && p.cv !== undefined) render(p);
    }
    for (const b of bees) {                                                                                       // джмелі: вдень шукають квіти томатів, уночі — у вулику
      const d = Math.hypot(b.tx - b.x, b.ty - b.y), v = 46 * dt; if (d > v) { b.x += (b.tx - b.x) / d * v; b.y += (b.ty - b.y) / d * v; continue; }
      if (b.node) { b.wait -= dt; if (b.wait <= 0) { b.node.pol = true; b.node = null; b.wait = .6; } continue; }
      b.wait -= dt; if (b.wait > 0) continue;
      const fl = []; if (nk < .5) plants.forEach(p => p.kind === 'tomato' && !p.out && p.nodes.forEach(nd => { if (nd.fr === 1 && !nd.pol && !bees.some(q => q.node === nd)) fl.push([p, nd]); }));
      if (fl.length) { const [p, nd] = fl[Math.random() * fl.length | 0]; b.node = nd; b.tx = PX(p.i) + (nd.j % 2 ? -8 : 8); b.ty = BASE_V - nodeY(nd.j) / 2 + 6; b.wait = 1.8; }
      else if (nk > .5) { b.tx = 16; b.ty = 139; b.wait = 3; } else { b.tx = 30 + Math.random() * 200; b.ty = 40 + Math.random() * 130; b.wait = .4 + Math.random(); }
    }
  }

  G.addSector({
    id: 'drip', act: 'gDrip', S, hit: { x: OX, y: OY, w: BW, h: BH },
    *buildG() { FRAME = build(); icons(); yield; for (const p of plants) { render(p); yield; } },
    update,
    draw(c, t) {
      if (!FRAME) return; c.imageSmoothingEnabled = false; c.drawImage(FRAME, OX, OY, BW, BH);
      const open = Math.max(0, 1 - G.night() * 2) * (.5 + .5 * Math.sin(t * .2)) * .9 + (G.night() < .3 ? .25 : 0);                               // фрамуги: вдень відчинені
      c.save(); c.strokeStyle = '#f4f7ff'; c.lineWidth = 1.6; c.fillStyle = 'rgba(210,240,255,.22)';
      for (const sg of [-1, 1]) { const hx = OX + 134 + sg * 6, hy = OY + 3, ex = hx + sg * 46 * Math.cos(.12 - open * .5), ey = hy + 46 * Math.sin(.12 - open * .5); c.beginPath(); c.moveTo(hx, hy); c.lineTo(ex, ey); c.stroke(); c.beginPath(); c.moveTo(hx, hy); c.lineTo(ex, ey); c.lineTo(hx + sg * 46, hy + 6); c.closePath(); c.fill(); }
      c.restore();
      for (const p of plants) { if (!p.cv) continue; c.globalAlpha = p.fade; c.drawImage(p.cv, OX + PX(p.i) - VW / 4, OY + BASE_V - VH / 2 + 1, VW / 2, VH / 2);
        if (!p.out) for (const nd of ripeOf(p)) if (Math.sin(t * 3 + nd.j * 2 + p.i) > .78) { const [x, y] = nodeRoom(p, nd), fx = x + (nd.j % 2 ? -7 : 7); P.rect(c, fx, y + 4, 1, 3, '#ffffff'); P.rect(c, fx - 1, y + 5, 3, 1, '#ffffff'); } }
      c.globalAlpha = 1;
      if (dripT < 0) for (let i = 0; i < NP; i++) { const d = ((t * 9 + i * .37) % 1) * 5; P.rect(c, OX + PX(i) + 5, OY + 183 + d, 1, 1.5, '#bffbff'); }   // крапельниці працюють
      P.rect(c, OX + 243.5, OY + 140.5, 4, 4, dripT < 0 ? '#bffbff' : '#145a70');
      [['#3be8ff', 1.3], ['#3bff8a', .9], ['#ffe27a', 1.6]].forEach(([col, f], j) => { const h = 3 + Math.round((Math.sin(t * f + j * 2) * .5 + .5) * 10); P.rect(c, OX + 245 + j * 5, OY + 132 - h, 3, h, col); });
      for (let k = 0; k < Math.min(8, crate); k++) { const x = OX + 240 + (k % 4) * 6, y = OY + 221 - (k >> 2) * 4; P.rect(c, x, y, 4, 4, k % 3 ? '#e8342a' : '#2f8c38'); P.rect(c, x, y, 1.5, 1.5, k % 3 ? '#ff8a6a' : '#74cc5c'); }   // урожай у ящику
      for (const b of bees) { if (G.night() > .5 && Math.hypot(b.x - 16, b.y - 139) < 3) continue; const x = OX + b.x, y = OY + b.y + Math.sin(t * 20 + b.tx) * .6, fl = Math.floor(t * 30) % 2;
        P.rect(c, x - 2, y, 4, 2.5, '#ffd84a'); P.rect(c, x - .5, y, 1, 2.5, '#2a2040'); P.rect(c, x + 1.5, y, 1, 2.5, '#2a2040'); P.rect(c, x - 1.5, y - (fl ? 2 : 1), 3, 1.5, 'rgba(255,255,255,.8)'); }
    },
    tap(x, y) { for (const p of plants) if (!p.out && Math.abs(x - (OX + PX(p.i))) < 18 && y > OY + BASE_V - hpx(p) / 2 - 8 && y < OY + BASE_V + 6) { G.card(p.kind, stageOf(p), ICON[p.kind]); return true; } return false; },
    /** Сценарій Nexi (NX.acts.gDrip): знімає стиглу китицю / огірки (до двох кущів), обриває листя під китицею й пасинки; інакше оглядає. */
    route(n) {
      const f = [OX + 120, CAT.GY + 18], L = [{ walk: f }, { face: 1 }, { say: NX.pick('act.gDrip.lines') }, { work: { pose: 'crouch', dur: .25 } }, { do: () => { n.wallFloor = f; } }, { loc: 'wallHover' }];
      const at = (p, nd) => { const [x, y] = nodeRoom(p, nd); return [x - 16, Math.min(CAT.GY - 6, y + 34)]; };
      const ripe = plants.filter(p => !p.out && ripeOf(p).length).slice(0, 2), sk = plants.filter(p => !p.out && p.nodes.some(nd => nd.suck));
      let got = 0, crop = null, cut = 0, shown = false;
      ripe.forEach(p => { const list = ripeOf(p), nd = list[0]; let done = false;
        L.push({ fly: at(p, nd), dy: f[1] }, { face: 1 }, { work: { pose: 'hoverBasket', dur: 1.9, tick: (dt, q) => { if (q < .55 || done) return; done = true; crop = p.kind; n.basket = 1;
          (p.kind === 'tomato' ? [nd] : list).forEach(o => { o.fr = 6; const k = p.kind === 'tomato' ? 5 : 1; got += k; crate += k; G.harvest(p.kind, k); const [x, y] = nodeRoom(p, o); for (let j = 0; j < 7; j++) NX.fx.emit('spark', x, y + 6, { col: p.kind === 'tomato' ? (j % 2 ? '#ff8a6a' : '#ffffff') : (j % 2 ? '#aee67c' : '#ffffff'), ttl: .55 }); });
          if (p.kind === 'tomato') p.nodes.forEach(o => { if (o.j <= nd.j && o.leaf) { o.leaf = false; o.suck = false; const [x, y] = nodeRoom(p, o); for (let j = 0; j < 3; j++) NX.fx.emit('spark', x, y, { col: '#52b054', vy: 30, g: 90, ttl: .8, s: 2 }); } });   // старе листя під китицею — геть
          p.dirty = true; } } }); });
      if (sk.length) { const p = sk[0], nd = p.nodes.find(o => o.suck); let done = false;
        L.push({ fly: at(p, nd), dy: f[1] }, { face: 1 }, { work: { pose: 'hoverScan', dur: 1.3, tick: (dt, q) => { if (q < .6 || done) return; done = true; p.nodes.forEach(o => { if (o.suck) { o.suck = false; cut++; const [x, y] = nodeRoom(p, o); for (let j = 0; j < 4; j++) NX.fx.emit('spark', x, y, { col: '#b4f48e', vy: 20, g: 90, ttl: .7, s: 2 }); } }); p.dirty = true; } } }); }
      if (!ripe.length && !sk.length) { const p = plants.filter(q => !q.out)[Math.random() * NP | 0] || plants[0]; crop = p.kind;
        L.push({ fly: [OX + PX(p.i) - 16, OY + BASE_V - hpx(p) / 2 + 40], dy: f[1] }, { face: 1 }, { work: { pose: 'hoverLook', dur: 1.8, tick: (dt, q) => { if (q > .5 && !shown) { shown = true; G.card(p.kind, stageOf(p), ICON[p.kind]); } } } }); }
      L.push({ fly: f }, { loc: 'floor' }, { face: 1 },
        { do: () => { n.emote(got ? 'love' : 'happy', 2.4); const key = got ? 'harvest' : cut ? 'sucker' : 'check'; n.say(String(NX.pick('act.gDrip.' + key)).replace('{crop}', NX.t('garden.crop.' + (crop || 'tomato'))).replace('{n}', got || cut)); } },
        { work: { pose: 'cheer', dur: 1.2 } }, { do: () => { n.basket = 0; } });
      return L;
    },
  });
  S.ready = true;
})();

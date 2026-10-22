/* ============================================================================
 * actors/nexi/sprite.js — HD-МАЛЮВАННЯ NEXI ПО ПІКСЕЛЯХ (сітка 48×56)
 * ----------------------------------------------------------------------------
 * renderBot(look, pose, t, canvas) малює бота в canvas SW×SH (skins.js):
 *   спина (плащ/крила/рюкзак) -> реактивний ранець -> ноги -> тулуб -> руки
 *   -> голова (вушка, глянцевий корпус, візор) -> обличчя АБО потилиця
 *   -> антена (з пружним погойдуванням pose.antX/antY) -> аксесуари голови
 *   -> предмет у руці -> темний контур навколо всього спрайта.
 * Кожна деталь має 3 тони: світло зверху/зліва, основний, тінь знизу/справа —
 * так пікселі виглядають "об'ємно", як на концепті.
 * look — скін (skins.js), pose — поза кадру (poses.js + фізика nexi.js).
 * Зсуви пози задані в "старих" одиницях 36×40, тут множаться на 4/3 (Q()).
 * ========================================================================== */
function renderBot(look, pose, t, cv) {
  cv.width = SW; cv.height = SH;
  const x = cv.getContext('2d', { willReadFrequently: true }); x.clearRect(0, 0, SW, SH);
  const th = THEMES[look.theme] || THEMES.standard, bd = BODIES[look.body] || BODIES.standard, am = ARMS[look.arms] || ARMS.base, lg = LEGS[look.legs] || LEGS.standard;
  let shell = th.shell; if (th.rb) shell = hsl2hex((t * 90) % 360, .85, .8);
  const acc = th.acc, jnt = th.jnt, eye = th.eye, bShell = bd.shell || shell, bAcc = bd.acc || acc, limb = am.col || shell;
  // ---------- базові пензлі ----------
  const P = (a, b, w, h, c) => { x.fillStyle = c; x.fillRect(a, b, w, h); };
  const Q = v => Math.round((v || 0) * 4 / 3);
  const ins = r => { const o = []; for (let i = 0; i < r; i++) o.push(Math.round(r - Math.sqrt(r * r - (r - i - .5) ** 2))); return o; };
  const RR = (a, b, w, h, r, c) => { const I = ins(r); for (let yy = 0; yy < h; yy++) { const k = yy < r ? I[yy] : yy >= h - r ? I[h - 1 - yy] : 0; P(a + k, b + yy, w - 2 * k, 1, c); } };
  /** Об'ємний заокруглений блок: світлий верх/лівий край, темний низ/правий край. */
  const BLK = (a, b, w, h, r, c) => {
    RR(a, b, w, h, r, c); const I = ins(r), L = shade(c, .5), L2 = shade(c, .22), D = shade(c, -.25), D2 = shade(c, -.45);
    for (let yy = 0; yy < h; yy++) {
      const k = yy < r ? I[yy] : yy >= h - r ? I[h - 1 - yy] : 0;
      if (yy === 0) P(a + k + 1, b, w - 2 * k - 2, 1, L); else if (yy === 1 && h > 5) P(a + k + 1, b + 1, w - 2 * k - 3, 1, L2);
      P(a + k, b + yy, 1, 1, L2); P(a + w - k - 1, b + yy, 1, 1, D);
      if (yy >= h - 2 && h > 3) P(a + k, b + yy, w - 2 * k, 1, yy === h - 1 ? D2 : D);
    }
  };
  const line = (x0, y0, x1, y1, c, th2 = 3) => { const n = Math.max(1, Math.round(Math.max(Math.abs(x1 - x0), Math.abs(y1 - y0)))); for (let i = 0; i <= n; i++) P(Math.round(x0 + (x1 - x0) * i / n) - (th2 >> 1), Math.round(y0 + (y1 - y0) * i / n) - (th2 >> 1), th2, th2, c); };

  const b = Q(pose.bob), hxo = Q(pose.hx), hyo = Q(pose.hy), vel = pose.vel || 0;
  const bx = 13, by = 33 + b, bw = 22, bh = 12, hX = 9 + hxo, hY = 10 + b + hyo;

  // ---------- 1. спина: плащ / крила / рюкзак ----------
  if (look.back === 'cape') for (let i = 0; i < 20; i++) { const w = 18 + Math.round(i * .6), sw = Math.round((Math.sin(t * 9 + i * .3) * 1.5 - vel * 7) * i / 20); P(24 - (w >> 1) + sw, by + 1 + i, w, 1, i % 6 < 4 ? '#d93a4a' : '#a82a3a'); if (i % 6 === 0) P(24 - (w >> 1) + sw + 3, by + 1 + i, 2, 1, '#ff6a7a'); }
  if (look.back === 'wings') { const f = Math.round(Math.abs(Math.sin(t * (pose.jet ? 14 : 4.7))) * 4); for (const s of [-1, 1]) for (let i = 0; i < 6; i++) { const L = 14 - i * 2, y0 = by - 8 + i * 3 - (i < 3 ? f : f >> 1), xL = s < 0 ? bx - L + 3 : bx + bw - 3; P(xL, y0, L, 3, i % 2 ? '#9fe8ff' : '#d0b0ff'); P(s < 0 ? xL : xL + L - 1, y0, 1, 2, '#ffffff'); P(xL, y0 + 2, L, 1, i % 2 ? '#5ab8e8' : '#9a7ae8'); } }
  if (look.back === 'backpack') { BLK(bx - 4, by - 1, bw + 8, 14, 3, '#c9812e'); P(bx - 3, by + 7, 4, 4, '#8a5a1e'); P(bx + bw - 1, by + 7, 4, 4, '#8a5a1e'); }

  // ---------- 2. реактивний ранець (у польоті) ----------
  if (pose.jet) for (const jx of [6, 36]) {
    BLK(jx, by - 2, 6, 13, 2, '#8a93b8'); P(jx, by - 2, 6, 2, '#d93a4a'); P(jx + 1, by + 11, 4, 2, '#3a4060');
    const L = 5 + (Math.floor(t * 18) % 3) + Math.round((pose.thrust || 0) * 4);
    P(jx + 1, by + 13, 4, 1, '#ffffff'); P(jx + 1, by + 14, 4, L - 2, '#ffe27a'); P(jx + 2, by + 13 + L - 2, 2, 3, '#ff7a2a'); P(jx + 2, by + 13 + L, 2, 1, '#ff3b2e');
  }

  // ---------- 3. ноги ----------
  const ll = pose.ll || { dx: 0, lift: 0 }, rl = pose.rl || { dx: 0, lift: 0 }, lc = lg.col || limb, fc = lg.foot || shade(shell, -.06), lac = lg.acc || acc, hipY = by + bh;
  [[ll, 16, -1], [rl, 27, 1]].forEach(([L, lx0, side]) => {
    const lift = Q(L.lift), lx = lx0 + Q(L.dx), hL = pose.sit ? 1 : Math.max(1, 4 - b - lift), fy = hipY + hL;
    BLK(lx, hipY, 5, hL + 2, 1, lc); P(lx, hipY, 5, 1, jnt);
    if (lg.pad) { P(lx, hipY + 1, 5, 2, lg.pad); P(lx, hipY + 1, 5, 1, '#ffffff'); }
    if (lg.glow) P(lx + 2, hipY, 1, hL + 1, lg.glow);
    const fx = side < 0 ? lx - 3 : lx; BLK(fx, fy, 8, lg.boot ? 4 : 3, 1, fc); if (lg.boot) P(fx + 1, fy + 1, 6, 1, shade(fc, .35));
    P(fx, fy + (lg.boot ? 3 : 2), 8, 1, lac); if (lg.stripe) P(fx + 1, fy + 1, 6, 1, lg.stripe);
    if (lg.jet || pose.jet) { const f = Math.floor(t * 16) % 2; P(fx + 2, fy + 3, 4, 1, '#ffe27a'); P(fx + 3, fy + 4, 2, 1 + f, '#ff7a2a'); }
  });

  // ---------- 4. тулуб ----------
  BLK(bx, by, bw, bh, 3, bShell); P(bx + 4, by + 1, bw - 8, 1, shade(bShell, .6));
  if (bd.pat === 'camo') { [[2, 3, 4, 2], [14, 6, 4, 3], [8, 8, 3, 2], [17, 2, 2, 2]].forEach(r => P(bx + r[0], by + r[1], r[2], r[3], '#3a3a1f')); [[5, 6, 2, 2], [12, 2, 2, 1], [15, 9, 2, 1]].forEach(r => P(bx + r[0], by + r[1], r[2], r[3], '#c9892f')); }
  if (bd.pat === 'stars') [[2, 3], [18, 4], [4, 8], [16, 9], [10, 1], [6, 5]].forEach(([a, c], i) => { if ((i + Math.floor(t * 3)) % 3) P(bx + a, by + c, 1, 1, '#ffffff'); });
  if (bd.pat === 'lines') { P(bx + 1, by + 6, 4, 1, bAcc); P(bx + bw - 5, by + 6, 4, 1, bAcc); P(bx + 4, by + 6, 1, 3, bAcc); P(bx + bw - 5, by + 6, 1, 3, bAcc); P(bx + 4, by + 9, 1, 1, '#fff'); P(bx + bw - 5, by + 9, 1, 1, '#fff'); }
  if (bd.pat === 'trim') { P(bx + 2, by, bw - 4, 1, bAcc); P(bx + 1, by + bh - 1, bw - 2, 1, bAcc); P(bx, by + 3, 1, 6, bAcc); P(bx + bw - 1, by + 3, 1, 6, bAcc); }
  if (!pose.back) {                                                   // нагрудний значок з "N"
    RR(18, by + 2, 12, 8, 2, bAcc); RR(19, by + 3, 10, 6, 1, '#0a1236');
    const g = bd.pat === 'core' ? (Math.sin(t * 6) > 0 ? '#ffb0f8' : '#ff4fd8') : '#5ae8ff';
    P(21, by + 4, 1, 4, g); P(26, by + 4, 1, 4, g); P(22, by + 4, 1, 1, g); P(23, by + 5, 1, 1, g); P(24, by + 6, 1, 1, g); P(25, by + 7, 1, 1, g);
    if (bd.pat === 'core') P(19, by + 3, 10, 1, 'rgba(255,180,250,.5)');
  } else {                                                            // спина: батарейний відсік
    RR(18, by + 2, 12, 8, 1, shade(bShell, -.22)); for (let i = 0; i < 3; i++) P(20 + i * 3, by + 4, 2, 4, i <= Math.floor(t * 2) % 3 ? '#3bff8a' : '#1f5a3a');
  }
  P(bx + 1, by + bh - 3, bw - 2, 2, jnt); P(22, by + bh - 3, 4, 2, bAcc);                     // пояс з пряжкою
  BLK(bx - 3, by + 1, 5, 5, 2, acc); BLK(bx + bw - 2, by + 1, 5, 5, 2, acc);                    // плечові шарніри

  // ---------- 5. руки ----------
  const sh = [[bx - 1, by + 3], [bx + bw, by + 3]], hands = [pose.la || { x: -2, y: 7 }, pose.ra || { x: 2, y: 7 }];
  hands.forEach((hd, i) => {
    const s = sh[i], ex = s[0] + Q(hd.x), ey = s[1] + Q(hd.y), mx = Math.round((s[0] + ex) / 2 + (i ? 1 : -1)), my = Math.round((s[1] + ey) / 2);
    line(s[0], s[1], mx, my, limb); line(mx, my, ex, ey, limb); line(s[0], s[1] - 1, mx, my - 1, shade(limb, .45), 1);
    P(mx - 1, my - 1, 3, 3, jnt);
    if (am.pad) { BLK(mx - 2, my - 2, 5, 5, 1, '#c3cbea'); }
    if (am.glow) { x.globalAlpha = .45 + .25 * Math.sin(t * 8); RR(ex - 4, ey - 3, 9, 9, 3, am.glow); x.globalAlpha = 1; }
    const hc = am.hand || shade(shell, -.06);
    if (am.claw) { P(ex - 2, ey, 1, 4, hc); P(ex + 2, ey, 1, 4, hc); P(ex - 2, ey, 5, 1, hc); P(ex - 1, ey + 3, 1, 1, '#ffffff'); }
    else { BLK(ex - 2, ey - 1, 5, 5, 2, hc); P(ex - 2, ey - 2, 5, 1, am.hand ? shade(hc, -.3) : acc); }
    hd.ex = ex; hd.ey = ey;
  });
  if (pose.book) { BLK(17, by + 3, 14, 9, 1, '#ff7a3a'); P(23, by + 3, 2, 9, '#7a3a14'); P(18, by + 4, 4, 1, '#ffd0a0'); P(26, by + 4, 4, 1, '#ffd0a0'); }

  // ---------- 6. голова ----------
  if (look.head === 'hood') BLK(hX - 3, hY - 3, 36, 27, 7, '#2e3470');
  for (const side of [-1, 1]) { const ex = side < 0 ? hX - 4 : hX + 29, eb = Q(pose.earB); BLK(ex, hY + 6 + eb, 5, 10, 2, acc); P(ex + 1, hY + 8 + eb, 3, 6, shade(acc, -.35)); P(ex + 2, hY + 9 + eb, 1, 4, '#ffffff'); }
  BLK(hX, hY, 30, 22, 6, shell); P(hX + 6, hY + 1, 18, 1, shade(shell, .75)); P(hX + 3, hY + 3, 2, 3, shade(shell, .55));
  if (!pose.back) {
    P(hX + 7, hY + 2, 4, 1, shade(shell, -.3)); P(hX + 19, hY + 2, 4, 1, shade(shell, -.3));                    // "брови" — шви корпусу
    RR(hX + 3, hY + 4, 24, 15, 4, '#16236a'); RR(hX + 4, hY + 5, 22, 13, 3, '#060b2a');                          // візор
    P(hX + 6, hY + 6, 5, 1, '#2a3a8a'); P(hX + 6, hY + 7, 2, 1, '#1e2c70');                                    // відблиск на склі
    drawFace(P, RR, hX + 4, hY + 5, pose.face || look.face, eye, pose, t);
    P(hX + 5, hY + 20, 20, 1, shade(shell, -.22));
  } else {
    P(hX + 4, hY + 7, 22, 1, shade(shell, -.28)); P(hX + 4, hY + 13, 22, 1, shade(shell, -.28));
    for (let i = 0; i < 4; i++) P(hX + 9 + i * 3, hY + 15, 2, 4, shade(shell, -.38)); P(hX + 14, hY + 9, 2, 2, acc);
  }

  // ---------- 7. антена ----------
  if (look.head !== 'hood' && look.head !== 'hat') drawAnt(P, RR, BLK, line, look, hX, hY, acc, eye, t, Q(pose.antX), Q(pose.antY));

  // ---------- 8. аксесуари голови ----------
  if (look.head === 'hood') { P(hX - 1, hY - 2, 32, 3, '#2e3470'); P(hX + 2, hY - 2, 26, 1, '#4a52a0'); }
  if (look.head === 'hat') { BLK(hX + 3, hY - 6, 24, 9, 4, '#d93a4a'); P(hX + 1, hY + 1, 28, 3, '#a82a3a'); P(hX + 1, hY + 1, 28, 1, '#ff6a7a'); BLK(hX + 13, hY - 10, 5, 5, 2, '#ffffff'); }
  if (look.head === 'goggles') { P(hX, hY + 6, 30, 2, '#5a3a1a'); for (const gx of [hX + 5, hX + 16]) { BLK(gx, hY + 5, 10, 8, 2, '#e0902a'); RR(gx + 1, hY + 6, 8, 6, 2, '#5ae8ff'); P(gx + 2, hY + 7, 3, 1, '#ffffff'); } }
  if (look.head === 'phones') { line(hX + 1, hY + 4, hX + 4, hY - 2, '#2a2f6e', 2); line(hX + 4, hY - 3, hX + 26, hY - 3, '#2a2f6e', 2); line(hX + 26, hY - 2, hX + 29, hY + 4, '#2a2f6e', 2); for (const cx of [hX - 6, hX + 29]) { BLK(cx, hY + 5, 7, 11, 2, '#ff4fd8'); P(cx + 2, hY + 8, 3, 5, '#7a1a6a'); } }
  if (pose.shades) { P(hX + 5, hY + 8, 20, 5, '#000000'); P(hX + 5, hY + 8, 20, 1, '#2a3a7a'); P(hX + 7, hY + 9, 3, 1, '#ffffff'); }

  // ---------- 9. предмети в руках ----------
  const L0 = hands[0], R0 = hands[1];
  if (look.hand === 'shield') { BLK(L0.ex - 7, L0.ey - 6, 10, 13, 3, '#3a6aff'); P(L0.ex - 4, L0.ey - 3, 4, 6, '#cffaff'); P(L0.ex - 3, L0.ey - 2, 2, 4, '#3a6aff'); }
  if (look.hand === 'sword') { P(R0.ex, R0.ey - 17, 2, 17, '#dfe8ff'); P(R0.ex, R0.ey - 17, 1, 17, '#ffffff'); P(R0.ex - 2, R0.ey, 6, 2, '#ffc94d'); P(R0.ex, R0.ey + 2, 2, 3, '#7a4a22'); }
  const ex = R0.ex, ey = R0.ey;
  switch (pose.tool) {
    case 'hammer': P(ex, ey - 8, 2, 10, '#8a5a2a'); BLK(ex - 3, ey - 11, 8, 4, 1, '#aab4d6'); break;
    case 'wrench': P(ex, ey - 8, 2, 9, '#c3cbea'); P(ex - 2, ey - 10, 6, 3, '#c3cbea'); P(ex, ey - 10, 2, 1, '#060b2a'); break;
    case 'cup': BLK(ex - 2, ey - 5, 5, 6, 1, '#ffffff'); P(ex + 3, ey - 4, 1, 3, '#ffffff'); P(ex - 1, ey - 5, 3, 1, '#7a4a22'); break;
    case 'cable': P(ex, ey - 4, 2, 4, '#3be8ff'); P(ex, ey - 5, 2, 1, '#ffffff'); break;
    case 'mega': BLK(ex - 2, ey - 3, 4, 5, 1, '#e9eefc'); P(ex + 2, ey - 4, 2, 7, '#e9eefc'); P(ex + 4, ey - 5, 1, 9, '#ff4fd8'); break;
    case 'can': BLK(ex - 3, ey - 6, 7, 6, 1, '#3bbf7a'); line(ex + 4, ey - 4, ex + 8, ey - 7, '#3bbf7a', 1); P(ex - 2, ey - 8, 5, 2, '#2a8a5a'); break;
    case 'coin': RR(ex - 1, ey - 4, 4, 4, 1, '#ffc94d'); P(ex, ey - 3, 1, 1, '#ffffff'); break;
    case 'tablet': BLK(ex - 4, ey - 6, 9, 7, 1, '#2a2f5e'); P(ex - 3, ey - 5, 7, 5, Math.sin(t * 3) > 0 ? '#3be8ff' : '#2a8cff'); break;
  }

  // ---------- 10. голо-скін: скан-лінії ----------
  if (bd.pat === 'holo') { x.globalCompositeOperation = 'source-atop'; for (let yy = (Math.floor(t * 20) % 2); yy < SH; yy += 2) { x.fillStyle = 'rgba(160,240,255,.28)'; x.fillRect(0, yy, SW, 1); } x.globalCompositeOperation = 'source-over'; }

  // ---------- 11. темний контур ----------
  const id = x.getImageData(0, 0, SW, SH), d = id.data, o = hx(OUT), op = new Uint8Array(SW * SH);
  for (let i = 0; i < SW * SH; i++) op[i] = d[i * 4 + 3] > 40 ? 1 : 0;
  for (let yy = 0; yy < SH; yy++) for (let xx = 0; xx < SW; xx++) { const i = yy * SW + xx; if (op[i]) continue;
    if ((xx > 0 && op[i - 1]) || (xx < SW - 1 && op[i + 1]) || (yy > 0 && op[i - SW]) || (yy < SH - 1 && op[i + SW])) { d[i * 4] = o[0]; d[i * 4 + 1] = o[1]; d[i * 4 + 2] = o[2]; d[i * 4 + 3] = 255; } }
  x.putImageData(id, 0, 0);
  return cv;
}

/** Обличчя на візорі. (vx,vy) — лівий верх скла 22×13. */
function drawFace(P, RR, vx, vy, face, eye, pose, t) {
  const dim = shade(eye, -.55), lk = Math.round(pose.look || 0), blink = pose.blink && !['sleepy', 'happy'].includes(face);
  const E = [[vx + 6 + lk, vy + 5], [vx + 15 + lk, vy + 5]];
  const round = (cx, cy, big) => { RR(cx - 3, cy - 3, 7, 7, 2, dim); RR(cx - 2, cy - 2, 5, 5, 2, eye); if (big) RR(cx - 3, cy - 3, 7, 7, 2, eye); P(cx - 1, cy - 1, 2, 1, '#ffffff'); P(cx - 1, cy, 1, 1, '#ffffff'); };
  let mouth = 'line';
  if (blink) { E.forEach(([cx, cy]) => { P(cx - 2, cy, 5, 1, eye); P(cx - 1, cy + 1, 3, 1, dim); }); }
  else switch (face) {
    case 'happy': E.forEach(([cx, cy]) => { P(cx - 2, cy + 1, 1, 2, eye); P(cx - 1, cy, 1, 1, eye); P(cx, cy - 1, 1, 1, eye); P(cx + 1, cy, 1, 1, eye); P(cx + 2, cy + 1, 1, 2, eye); P(cx - 1, cy + 1, 3, 1, dim); }); mouth = 'smile'; break;
    case 'think': E.forEach(([cx, cy]) => round(cx + 1, cy - 1)); mouth = 'side'; break;
    case 'surprised': E.forEach(([cx, cy]) => { RR(cx - 3, cy - 3, 7, 7, 2, eye); RR(cx - 1, cy - 1, 3, 3, 1, '#060b2a'); P(cx - 2, cy - 2, 1, 1, '#ffffff'); }); mouth = 'o'; break;
    case 'serious': E.forEach(([cx, cy]) => { P(cx - 2, cy - 1, 5, 3, eye); P(cx - 2, cy - 2, 5, 1, dim); P(cx - 1, cy - 1, 1, 1, '#ffffff'); }); break;
    case 'sleepy': E.forEach(([cx, cy]) => { P(cx - 2, cy + 1, 5, 1, eye); P(cx - 1, cy + 2, 3, 1, dim); }); mouth = 'small'; break;
    case 'hearts': E.forEach(([cx, cy]) => { ['.XX.XX.', 'XXXXXXX', 'XXXXXXX', '.XXXXX.', '..XXX..', '...X...'].forEach((r, j) => [...r].forEach((ch, i) => ch === 'X' && P(cx - 3 + i, cy - 3 + j, 1, 1, '#ff5ae0'))); P(cx - 2, cy - 2, 1, 1, '#ffffff'); }); mouth = 'smile'; break;
    case 'sad': E.forEach(([cx, cy], k) => { P(cx - 2, cy, 5, 2, eye); P(k ? cx + 1 : cx - 2, cy - 1, 2, 1, eye); }); P(E[1][0] + 2, E[1][1] + 3, 1, 2, '#9ad8ff'); mouth = 'frown'; break;
    case 'angry': E.forEach(([cx, cy], k) => { P(cx - 2, cy, 5, 2, '#ff3b3b'); P(k ? cx - 2 : cx, cy - 2, 3, 1, '#ff3b3b'); P(k ? cx - 3 : cx + 2, cy - 3, 2, 1, '#ff3b3b'); }); mouth = 'jag'; break;
    default: E.forEach(([cx, cy]) => round(cx, cy));
  }
  if (face === 'talk' || pose.talk) mouth = 'talk';
  const mx = vx + 9, my = vy + 10, d = dim;
  switch (mouth) {
    case 'smile': P(mx - 1, my - 1, 1, 1, eye); P(mx, my, 4, 1, eye); P(mx + 4, my - 1, 1, 1, eye); break;
    case 'side': P(mx + 2, my, 2, 1, d); break;
    case 'o': RR(mx, my - 1, 4, 3, 1, eye); P(mx + 1, my, 2, 1, '#060b2a'); break;
    case 'small': P(mx + 1, my, 2, 1, d); break;
    case 'frown': P(mx - 1, my + 1, 1, 1, eye); P(mx, my, 4, 1, eye); P(mx + 4, my + 1, 1, 1, eye); break;
    case 'jag': P(mx, my, 1, 1, eye); P(mx + 1, my + 1, 1, 1, eye); P(mx + 2, my, 1, 1, eye); P(mx + 3, my + 1, 1, 1, eye); break;
    case 'talk': { const o = Math.floor(t * 10) % 3; RR(mx, my - (o ? 1 : 0), 4, 1 + o, 1, eye); break; }
    default: P(mx, my, 4, 1, d);
  }
}

/** Антени. (hX,hY) — лівий верх голови; ax/ay — пружне погойдування кінчика. */
function drawAnt(P, RR, BLK, line, look, hX, hY, acc, eye, t, ax, ay) {
  const cx = hX + 15, tip = Math.floor(t * 3) % 2 ? eye : shade(eye, .55), rgb = hsl2hex((t * 120) % 360, .9, .65);
  const rod = (x0, x1, y1, c = '#8aa0c8') => { line(x0, hY - 1, x1, y1, c, 2); };
  switch (look.ant) {
    case 'techno': for (const s of [-6, 6]) { rod(cx + s, cx + s + ax, hY - 8 + ay); BLK(cx + s + ax - 2, hY - 13 + ay, 4, 6, 1, '#ff4fd8'); P(cx + s + ax - 1, hY - 12 + ay, 1, 2, '#ffc4f4'); } break;
    case 'holo': { rod(cx, cx + ax, hY - 5 + ay); const f = Math.round(Math.sin(t * 3) * 1.5), w = Math.max(1, Math.round(Math.abs(Math.cos(t * 2)) * 2)); [1, 3, 5, 3, 1].forEach((n, j) => { const ww = Math.max(1, n - (n > 1 ? 2 - w : 0)); P(cx + ax - (ww >> 1), hY - 15 + j + f + ay, ww, 1, j === 2 ? '#ffffff' : tip); }); break; }
    case 'gamer': for (const s of [-1, 1]) { const bx0 = s < 0 ? hX + 4 : hX + 21; for (let j = 0; j < 6; j++) P(bx0 + (s < 0 ? j >> 1 : 0) + ax, hY - 1 - j + ay * (j / 6), 5 - (j >> 1), 1, j < 2 ? '#2a2f5e' : rgb); } break;
    case 'premium': for (const s of [-1, 1]) { const b0 = s < 0 ? hX + 6 : hX + 23; line(b0, hY, b0 + s * 3 + ax, hY - 7 + ay, '#ffc94d', 2); line(b0 + s * 3 + ax, hY - 7 + ay, b0 + s * 2 + ax, hY - 11 + ay, '#ffe27a', 2); P(b0 + s * 2 + ax, hY - 12 + ay, 2, 2, '#3be8ff'); } break;
    case 'horns': for (const s of [-1, 1]) { const b0 = s < 0 ? hX + 5 : hX + 24; line(b0, hY + 1, b0 - s * 3 + ax, hY - 6 + ay, '#cfd6f0', 3); line(b0 - s * 3 + ax, hY - 6 + ay, b0 - s * 5 + ax, hY - 10 + ay, '#ffffff', 2); } break;
    case 'crown': BLK(hX + 8, hY - 6, 14, 6, 1, '#ffc94d'); [[hX + 8, 3], [hX + 14, 4], [hX + 20, 3]].forEach(([px, h]) => P(px, hY - 6 - h, 2, h, '#ffc94d')); P(hX + 11, hY - 4, 2, 2, '#ff3b6a'); P(hX + 17, hY - 4, 2, 2, '#3be8ff'); P(hX + 9, hY - 6, 12, 1, '#fff0a0'); break;
    case 'neon': for (let i = 0; i < 24; i++) { const a = i / 24 * Math.PI * 2; P(Math.round(cx + ax + Math.cos(a) * 10), Math.round(hY - 6 + ay + Math.sin(a) * 2.5), 1, 1, i % 3 ? '#ff4fd8' : '#ffb0f8'); } rod(cx, cx + ax * .5, hY - 4); break;
    default: P(cx - 2, hY - 2, 4, 2, '#5a6590'); rod(cx, cx + ax, hY - 9 + ay); RR(cx + ax - 2, hY - 13 + ay, 5, 5, 2, tip); P(cx + ax - 1, hY - 12 + ay, 1, 1, '#ffffff');
  }
}

/** HSL -> #hex (для райдужної теми й RGB-антен). */
function hsl2hex(h, s, l) { const k = n => (n + h / 30) % 12, a = s * Math.min(l, 1 - l), f = n => l - a * Math.max(-1, Math.min(k(n) - 3, 9 - k(n), 1)); return '#' + [f(0), f(8), f(4)].map(v => Math.round(v * 255).toString(16).padStart(2, '0')).join(''); }

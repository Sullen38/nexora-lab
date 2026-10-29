/* ============================================================================
 * actors/nexi/sprite.js — HD-МАЛЮВАННЯ NEXI ПО ПІКСЕЛЯХ (сітка 48×56)
 * ----------------------------------------------------------------------------
 * renderBot(look, pose, t, canvas) малює бота в canvas SW×SH (skins.js):
 *   спина (плащ/крила/рюкзак) -> реактивний ранець -> ноги -> тулуб -> руки
 *   -> голова (вушка, глянцевий корпус, візор) -> обличчя АБО потилиця
 *   -> антена (з пружним погойдуванням pose.antX/antY) -> аксесуари голови
 *   -> предмет у руці (drawHandItem: молот, клинок, рукавиця, екскалібур, посох…) -> темний контур навколо всього спрайта.
 * renderItem(id, t, canvas) — той самий предмет окремо (картки «Предмети» в майстерні).
 * Кожна деталь має 3 тони: світло зверху/зліва, основний, тінь знизу/справа —
 * так пікселі виглядають "об'ємно", як на концепті.
 * look — скін (skins.js), pose — поза кадру (poses.js + фізика nexi.js).
 * Зсуви пози задані в "старих" одиницях 36×40, тут множаться на 4/3 (Q()).
 * ========================================================================== */
/** Піксельні пензлі для полотна x: P — прямокутник, RR — заокруглений, BLK — об'ємний блок, line — лінія товщиною th2. */
function pxBrush(x) {
  const P = (a, b, w, h, c) => { x.fillStyle = c; x.fillRect(a, b, w, h); };
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
  /** Піксель-маска рядками: 'X' (або інша літера з col) — піксель, '.' — порожньо. */
  const map = (rows, x0, y0, col) => rows.forEach((r, j) => [...r].forEach((ch, i) => { if (ch === '.') return; const c = typeof col === 'function' ? col(ch, i, j) : col; if (c) P(x0 + i, y0 + j, 1, 1, c); }));
  return { P, RR, BLK, line, map, ins };
}
/** Темний контур навколо всього намальованого на полотні W×H. */
function pxOutline(x, W, H) {
  const id = x.getImageData(0, 0, W, H), d = id.data, o = hx(OUT), op = new Uint8Array(W * H);
  for (let i = 0; i < W * H; i++) op[i] = d[i * 4 + 3] > 40 ? 1 : 0;
  for (let yy = 0; yy < H; yy++) for (let xx = 0; xx < W; xx++) { const i = yy * W + xx; if (op[i]) continue;
    if ((xx > 0 && op[i - 1]) || (xx < W - 1 && op[i + 1]) || (yy > 0 && op[i - W]) || (yy < H - 1 && op[i + W])) { d[i * 4] = o[0]; d[i * 4 + 1] = o[1]; d[i * 4 + 2] = o[2]; d[i * 4 + 3] = 255; } }
  x.putImageData(id, 0, 0);
}

function renderBot(look, pose, t, cv) {
  cv.width = SW; cv.height = SH;
  const x = cv.getContext('2d', { willReadFrequently: true }); x.clearRect(0, 0, SW, SH);
  const th = THEMES[look.theme] || THEMES.standard, bd = BODIES[look.body] || BODIES.standard, am = ARMS[look.arms] || ARMS.base, lg = LEGS[look.legs] || LEGS.standard;
  let shell = th.shell; if (th.rb) shell = hsl2hex((t * 90) % 360, .85, .8);
  const acc = th.acc, jnt = th.jnt, eye = th.eye, bShell = bd.shell || shell, bAcc = bd.acc || acc, limb = am.col || shell;
  // ---------- базові пензлі ----------
  const B = pxBrush(x), { P, RR, BLK, line } = B;
  const Q = v => Math.round((v || 0) * 4 / 3);

  const b = Q(pose.bob), hxo = Q(pose.hx), hyo = Q(pose.hy), vel = pose.vel || 0;
  const bx = 13, by = 33 + b, bw = 22, bh = 12, hX = 9 + hxo, hY = 10 + b + hyo;

  // ---------- 1. спина: плащ / крила / рюкзак ----------
  if (look.back === 'cape') { const cc = th.cape || '#d93a4a', cd = shade(cc, -.22), cl = shade(cc, .35);   // плащ (колір — від теми)
    for (let i = 0; i < 20; i++) { const w = 18 + Math.round(i * .6), sw = Math.round((Math.sin(t * 9 + i * .3) * 1.5 - vel * 7) * i / 20); P(24 - (w >> 1) + sw, by + 1 + i, w, 1, i % 6 < 4 ? cc : cd); if (i % 6 === 0) P(24 - (w >> 1) + sw + 3, by + 1 + i, 2, 1, cl); } }
  if (look.back === 'wings') { const f = Math.round(Math.abs(Math.sin(t * (pose.jet ? 14 : 4.7))) * 3);   // крила: 7 рядів пір'я, махають
    for (const s of [-1, 1]) for (let i = 0; i < 7; i++) { const L = 15 - Math.round(i * 1.6), y0 = by - 13 + i * 2 - (i < 4 ? f : f >> 1), xL = s < 0 ? bx + 2 - L : bx + bw - 2;
      P(xL, y0, L, 2, i % 2 ? '#bff2ff' : '#e4d4ff'); P(xL, y0 + 1, L, 1, i % 2 ? '#6ac8f0' : '#a88af0'); P(s < 0 ? xL : xL + L - 1, y0, 1, 2, '#ffffff'); } }
  if (look.back === 'backpack') { BLK(bx - 4, by - 1, bw + 8, 14, 3, '#c9812e'); P(bx - 3, by + 7, 4, 4, '#8a5a1e'); P(bx + bw - 1, by + 7, 4, 4, '#8a5a1e'); }
  if (look.back === 'scarf') { const sc = shade(acc, -.1);                                    // шарф: два хвости майорять позаду
    for (const [o, n] of [[0, 13], [3, 10]]) for (let i = 0; i < n; i++) { const w = Math.round(Math.sin(t * 8 - i * .55 + o) * 1.4 * i / n - vel * 4 * i / n), y = by + o + Math.round(i * .3) + w;
      P(bx + 3 - i, y, 1, 3, i % 4 < 2 ? sc : shade(sc, -.25)); if (i % 4 === 0) P(bx + 3 - i, y, 1, 1, shade(sc, .4)); } }

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
  if (bd.pat === 'trim' || bd.pat === 'royal') { P(bx + 2, by, bw - 4, 1, bAcc); P(bx + 1, by + bh - 1, bw - 2, 1, bAcc); P(bx, by + 3, 1, 6, bAcc); P(bx + bw - 1, by + 3, 1, 6, bAcc); }
  if (bd.pat === 'armor') for (let i = 0; i < 3; i++) { const y = by + 2 + i * 3; P(bx + 2, y, bw - 4, 1, shade(bShell, -.32)); for (let j = 0; j < 5; j++) P(bx + 3 + j * 4, y + 1, 1, 1, bAcc); }   // ламелі з золотою шнурівкою
  if (bd.pat === 'suit') { RR(bx + 1, by + 2, 5, 7, 1, '#cfd6e6'); [[1, 1, '#ff3b3b'], [3, 1, '#ffe27a'], [1, 3, '#3be8ff'], [3, 3, '#3bff8a']].forEach(([a, c, col]) => P(bx + 1 + a, by + 2 + c, 1, 1, col)); P(bx + 2, by + 7, 3, 1, '#8a93b8');   // пульт
    RR(bx + bw - 6, by + 2, 5, 5, 2, bAcc); P(bx + bw - 4, by + 4, 1, 1, '#ffffff'); }                                                                                                   // нашивка місії
  if (bd.pat === 'crystal') { [[2, 2, 5], [7, 1, 4], [15, 2, 5], [18, 6, 3]].forEach(([a, c, n]) => { for (let k = 0; k < n; k++) P(bx + a + k, by + c + k, 1, 1, shade(bShell, .55)); }); const k = Math.floor(t * 2) % 3; if (k < 2) P(bx + (k ? 17 : 5), by + (k ? 7 : 3), 1, 1, '#ffffff'); }
  if (bd.pat === 'candy') for (let yy = 1; yy < bh - 3; yy++) for (let xx = 2; xx < bw - 2; xx++) if (((xx - yy) % 6 + 6) % 6 < 2) P(bx + xx, by + yy, 1, 1, bAcc);
  if (bd.pat === 'pumpkin') [4, 9, 12, 17].forEach(xx => { P(bx + xx, by + 1, 1, bh - 4, shade(bShell, -.25)); P(bx + xx + 1, by + 2, 1, bh - 6, shade(bShell, .2)); });
  if (bd.pat === 'circuit') { const on = Math.floor(t * 4) % 4; [[1, 3, 5, 0], [bw - 6, 3, 5, 1], [2, 7, 3, 2], [bw - 5, 7, 3, 3]].forEach(([a, c, w, k]) => { const e = a + (k % 2 ? w - 1 : 0); P(bx + a, by + c, w, 1, k === on ? '#e0ffe8' : bAcc); P(bx + e, by + c, 1, 3, bAcc); P(bx + e, by + c + 3, 1, 1, '#ffffff'); }); }
  if (bd.pat === 'lava') { const g = Math.sin(t * 3) > 0 ? '#ffd27a' : '#ff9a3a'; [[2, 2, 1, 1], [3, 3, 2, 1], [5, 4, 1, 2], [16, 1, 1, 2], [17, 3, 2, 1], [19, 4, 1, 2], [9, 8, 3, 1], [12, 7, 1, 1]].forEach(([a, c, w, h], i) => P(bx + a, by + c, w, h, (i + Math.floor(t * 3)) % 4 ? '#ff6a1a' : g)); }
  if (!pose.back && bd.pat === 'pumpkin') {                           // гарбуз: замість значка — вирізане обличчя, що світиться
    const gl = Math.floor(t * 6) % 9 ? '#ffc93a' : '#fff0a0', dk = shade(bShell, -.45);
    P(20, by + 2, 1, 1, gl); P(19, by + 3, 3, 2, gl); P(27, by + 2, 1, 1, gl); P(26, by + 3, 3, 2, gl);                          // очі-трикутники
    P(18, by + 6, 12, 3, gl); P(18, by + 6, 1, 1, dk); P(29, by + 6, 1, 1, dk); [20, 23, 26].forEach(xx => P(xx, by + 6, 2, 1, dk)); [21, 24, 27].forEach(xx => P(xx, by + 8, 1, 1, dk));   // усмішка з зубцями
  } else if (!pose.back) {                                            // нагрудний значок з "N"
    RR(18, by + 2, 12, 8, 2, bAcc); RR(19, by + 3, 10, 6, 1, '#0a1236');
    const g = bd.pat === 'core' ? (Math.sin(t * 6) > 0 ? '#ffb0f8' : '#ff4fd8') : '#5ae8ff';
    P(21, by + 4, 1, 4, g); P(26, by + 4, 1, 4, g); P(22, by + 4, 1, 1, g); P(23, by + 5, 1, 1, g); P(24, by + 6, 1, 1, g); P(25, by + 7, 1, 1, g);
    if (bd.pat === 'core') P(19, by + 3, 10, 1, 'rgba(255,180,250,.5)');
  } else {                                                            // спина: батарейний відсік
    RR(18, by + 2, 12, 8, 1, shade(bShell, -.22)); for (let i = 0; i < 3; i++) P(20 + i * 3, by + 4, 2, 4, i <= Math.floor(t * 2) % 3 ? '#3bff8a' : '#1f5a3a');
  }
  P(bx + 1, by + bh - 3, bw - 2, 2, jnt); P(22, by + bh - 3, 4, 2, bAcc);                     // пояс з пряжкою
  BLK(bx - 3, by + 1, 5, 5, 2, acc); BLK(bx + bw - 2, by + 1, 5, 5, 2, acc);                    // плечові шарніри
  if (bd.pat === 'armor') [bx - 6, bx + bw - 1].forEach(x0 => { BLK(x0, by, 7, 7, 2, bShell); P(x0 + 1, by + 2, 5, 1, bAcc); P(x0 + 1, by + 4, 5, 1, bAcc); });       // наплічники
  if (bd.pat === 'royal') [bx - 5, bx + bw - 2].forEach(x0 => { BLK(x0, by, 7, 3, 1, '#ffc94d'); for (let k = 0; k < 4; k++) P(x0 + k * 2, by + 3, 1, 2, '#ffe27a'); });   // еполети з бахромою

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
    hd.ex = ex; hd.ey = ey; hd.mx = mx; hd.my = my;                                    // кисть і лікоть — для предметів у руках
  });
  if (pose.book) { BLK(17, by + 3, 14, 9, 1, '#ff7a3a'); P(23, by + 3, 2, 9, '#7a3a14'); P(18, by + 4, 4, 1, '#ffd0a0'); P(26, by + 4, 4, 1, '#ffd0a0'); }

  if (look.back === 'scarf') { const sc = shade(acc, -.1); BLK(bx + 1, by - 2, bw - 2, 4, 2, sc); P(bx + 3, by - 1, bw - 6, 1, shade(sc, .35)); P(bx + 4, by + 1, 3, 4, sc); P(bx + 4, by + 4, 3, 1, shade(sc, -.3)); }   // шарф на шиї

  // ---------- 6. голова ----------
  if (look.head === 'hood') BLK(hX - 3, hY - 3, 36, 27, 7, '#2e3470');
  for (const side of [-1, 1]) { const ex = side < 0 ? hX - 4 : hX + 29, eb = Q(pose.earB); BLK(ex, hY + 6 + eb, 5, 10, 2, acc); P(ex + 1, hY + 8 + eb, 3, 6, shade(acc, -.35)); P(ex + 2, hY + 9 + eb, 1, 4, '#ffffff'); }
  BLK(hX, hY, 30, 22, 6, shell); P(hX + 6, hY + 1, 18, 1, shade(shell, .75)); P(hX + 3, hY + 3, 2, 3, shade(shell, .55));
  if (th.hp) headPat(B, th.hp, hX, hY, shell, acc, t);                                         // візерунок теми на корпусі голови
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
  if (look.head !== 'hood' && look.head !== 'hat' && !(ACCS[look.head] && ACCS[look.head].noAnt)) drawAnt(P, RR, BLK, line, look, hX, hY, acc, eye, t, Q(pose.antX), Q(pose.antY));

  // ---------- 8. аксесуари голови ----------
  if (look.head === 'hood') { P(hX - 1, hY - 2, 32, 3, '#2e3470'); P(hX + 2, hY - 2, 26, 1, '#4a52a0'); }
  if (look.head === 'hat') { BLK(hX + 3, hY - 6, 24, 9, 4, '#d93a4a'); P(hX + 1, hY + 1, 28, 3, '#a82a3a'); P(hX + 1, hY + 1, 28, 1, '#ff6a7a'); BLK(hX + 13, hY - 10, 5, 5, 2, '#ffffff'); }
  if (look.head === 'goggles') { P(hX, hY + 6, 30, 2, '#5a3a1a'); for (const gx of [hX + 5, hX + 16]) { BLK(gx, hY + 5, 10, 8, 2, '#e0902a'); RR(gx + 1, hY + 6, 8, 6, 2, '#5ae8ff'); P(gx + 2, hY + 7, 3, 1, '#ffffff'); } }
  if (look.head === 'phones') { line(hX + 1, hY + 4, hX + 4, hY - 2, '#2a2f6e', 2); line(hX + 4, hY - 3, hX + 26, hY - 3, '#2a2f6e', 2); line(hX + 26, hY - 2, hX + 29, hY + 4, '#2a2f6e', 2); for (const cx of [hX - 6, hX + 29]) { BLK(cx, hY + 5, 7, 11, 2, '#ff4fd8'); P(cx + 2, hY + 8, 3, 5, '#7a1a6a'); } }
  if (look.head === 'kabuto') { const L = '#2a1a30', G = '#ffc94d';                          // шолом самурая: чаша, заклепки, бічні щитки, золотий гребінь
    for (const sd of [-1, 1]) { const fx2 = sd < 0 ? hX - 5 : hX + 29; BLK(fx2, hY - 1, 6, 9, 2, L); P(fx2 + 1, hY + 1, 4, 1, G); }
    BLK(hX - 1, hY - 4, 32, 8, 4, L); P(hX + 3, hY - 3, 24, 1, shade(L, .55)); for (let k = 0; k < 7; k++) P(hX + 3 + k * 4, hY, 1, 1, G);
    line(hX + 15, hY - 3, hX + 7, hY - 9, G, 2); line(hX + 15, hY - 3, hX + 23, hY - 9, G, 2); P(hX + 6, hY - 10, 2, 1, '#fff2c0'); P(hX + 22, hY - 10, 2, 1, '#fff2c0');
    RR(hX + 12, hY - 6, 7, 5, 2, G); P(hX + 14, hY - 5, 3, 2, '#d93a4a'); }
  if (look.head === 'helmet') { const cxh = hX + 15, cyh = hY + 9, rx = 20, ry = 15;          // шолом астронавта: скляна сфера, відблиск, комір
    x.fillStyle = 'rgba(190,235,255,.12)'; x.beginPath(); x.ellipse(cxh, cyh, rx, ry, 0, 0, 7); x.fill();
    for (let a = 0; a < 140; a++) { const q = a / 140 * Math.PI * 2; P(Math.round(cxh + Math.cos(q) * rx), Math.round(cyh + Math.sin(q) * ry), 1, 1, q > 3.4 && q < 4.5 ? '#ffffff' : 'rgba(200,240,255,.9)'); }
    P(cxh - 14, cyh - 8, 2, 1, '#ffffff'); P(cxh - 15, cyh - 6, 1, 3, '#ffffff'); BLK(hX + 2, hY + 21, 26, 3, 1, '#c3cbea'); P(hX + 4, hY + 22, 2, 1, '#ff8a2a'); P(hX + 24, hY + 22, 2, 1, '#ff8a2a'); }
  if (look.head === 'tricorn') { const K = '#1c1624', G = '#e8c060';                          // капітанка: поля із загнутими кутами, золотий кант і бляха
    P(hX - 3, hY - 1, 36, 3, K); P(hX - 3, hY - 1, 36, 1, shade(K, .45)); P(hX - 5, hY - 3, 4, 3, K); P(hX + 31, hY - 3, 4, 3, K);
    BLK(hX + 5, hY - 8, 20, 8, 3, K); P(hX + 6, hY - 2, 18, 1, G); P(hX - 3, hY + 1, 36, 1, G); RR(hX + 13, hY - 6, 4, 4, 1, G); P(hX + 14, hY - 5, 2, 2, '#fff2c0'); }
  if (look.head === 'bandana') { const C = shade(acc, -.05);                                   // пов'язка: стрічка, металева пластина, кінці майорять
    P(hX, hY + 1, 30, 3, C); P(hX, hY + 1, 30, 1, shade(C, .35)); RR(hX + 11, hY + 1, 8, 3, 1, '#c3cbea'); P(hX + 12, hY + 2, 6, 1, '#8a93b8');
    for (let i = 0; i < 9; i++) { const yy = hY + 2 + Math.round(i * .45 + Math.sin(t * 9 - i * .7) * (i / 9) * 1.5); P(hX - 1 - i, yy, 1, 2, C); if (i % 3 === 1) P(hX - 1 - i, yy + 2, 1, 1, shade(C, -.25)); } }
  if (look.head === 'flowers') [[2, '#ff6ad8'], [8, '#ffe27a'], [14, '#ffffff'], [20, '#ff9af0'], [26, '#7af4ff']].forEach(([dx, c], i) => {   // вінок
    const fx2 = hX + dx, fy2 = hY - 1 + (i % 2); if (i < 4) P(fx2 + 1, fy2 + 1, 4, 1, '#3f8a2a'); P(fx2 - 1, fy2, 3, 1, c); P(fx2, fy2 - 1, 1, 3, c); P(fx2, fy2, 1, 1, i === 1 ? '#ff8a2a' : '#ffe27a'); });
  if (pose.shades) { P(hX + 5, hY + 8, 20, 5, '#000000'); P(hX + 5, hY + 8, 20, 1, '#2a3a7a'); P(hX + 7, hY + 9, 3, 1, '#ffffff'); }

  // ---------- 9. предмети в руках (drawHandItem; поки руки зайняті інструментом пози чи книгою — праву не чіпаємо) ----------
  const L0 = hands[0], R0 = hands[1];
  if (look.hand && !pose.book && (look.hand === 'shield' || !pose.tool)) drawHandItem(B, look.hand, L0, R0, t);
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
  pxOutline(x, SW, SH);
  return cv;
}

/* ---------- ПРЕДМЕТИ В РУКАХ (слот hand у skins.js → ACCS) ----------
 * Власник (29.10): «у майстерні з одного боку — скіни, з другого — предмети, які він тримає в руці: молот, світловий меч,
 * золота рукавиця з каменями, екскалібур… додай йому унікальних предметів». Меч-світло й рукавиця з шістьма каменями —
 * чужий захищений дизайн, тож тут — власні: неоновий клинок (вигнуте лезо з сегментів світла) і силова рукавиця (одне ядро).
 * Малюються поверх кисті: (ex, ey) — центр кисті, (mx, my) — лікоть (для наручі); L0 — ліва рука (щит), R0 — права.
 * f — кадр анімації (10 за секунду): блискавки, полум'я, відблиски. */
function drawHandItem(B, id, L0, R0, t) {
  const { P, RR, BLK, line, map } = B, ex = R0.ex, ey = R0.ey, f = Math.floor(t * 10);
  switch (id) {
    case 'shield': { const a = L0.ex, b = L0.ey; BLK(a - 7, b - 6, 10, 13, 3, '#3a6aff'); P(a - 4, b - 3, 4, 6, '#cffaff'); P(a - 3, b - 2, 2, 4, '#3a6aff'); break; }
    case 'sword': P(ex, ey - 17, 2, 17, '#dfe8ff'); P(ex, ey - 17, 1, 17, '#ffffff'); P(ex - 2, ey, 6, 2, '#ffc94d'); P(ex, ey + 2, 2, 3, '#7a4a22'); break;
    case 'hammer': {                                     // громовий молот: короткий держак з обмоткою, важкий боєк з руною-блискавкою, розряди
      P(ex, ey - 7, 2, 12, '#5a3a22'); for (let j = 0; j < 12; j += 2) P(ex, ey - 7 + j, 2, 1, '#8a5a32');
      P(ex - 1, ey + 5, 4, 2, '#9aa6c8'); P(ex - 1, ey + 5, 4, 1, '#dfe6ff');
      BLK(ex - 6, ey - 15, 14, 8, 1, '#7c84a6'); P(ex - 6, ey - 14, 2, 6, '#5a6288'); P(ex + 6, ey - 14, 2, 6, '#4a5278'); P(ex - 4, ey - 15, 10, 1, '#d8def6');
      const r = f % 4 < 2 ? '#7af4ff' : '#e0fcff'; P(ex + 1, ey - 14, 1, 2, r); P(ex, ey - 12, 2, 1, r); P(ex, ey - 11, 1, 2, r);
      if (f % 3 !== 2) { const o = f % 2; line(ex - 5, ey - 16, ex - 7 - o, ey - 19, '#cffaff', 1); line(ex - 7 - o, ey - 19, ex - 5, ey - 21, '#ffffff', 1); line(ex + 7, ey - 16, ex + 8 + o, ey - 20, '#9af6ff', 1); }
      break;
    }
    case 'blade': {                                      // неоновий клинок: вигнуте лезо з сегментів світла, шестигранна гарда, руків'я з обмоткою
      P(ex, ey + 1, 2, 5, '#24163e'); P(ex, ey + 2, 1, 1, '#ff4fd8'); P(ex + 1, ey + 4, 1, 1, '#ff4fd8'); P(ex, ey + 6, 2, 1, '#9aa6c8');
      P(ex - 2, ey - 2, 6, 3, '#3a2a6a'); P(ex - 1, ey - 2, 4, 1, '#9a8af0'); P(ex - 2, ey - 1, 1, 1, '#3be8ff'); P(ex + 3, ey - 1, 1, 1, '#3be8ff');
      const hue = ['#ff4fd8', '#ff6ae0', '#ff9af0'][f % 3], hue2 = ['#ff9af0', '#ff4fd8', '#ff6ae0'][f % 3];
      for (let j = 0; j < 20; j++) { const o = Math.round(j * j / 130), y = ey - 3 - j;
        if (j % 5 === 4) { P(ex + o - 1, y, 3, 1, '#8a2a7a'); continue; }                    // щілини між сегментами світла
        P(ex + o - 1, y, 1, 1, hue); P(ex + o, y, 1, 1, '#ffffff'); P(ex + o + 1, y, 1, 1, hue2); }
      P(ex + 3, ey - 23, 1, 1, '#ffffff');
      break;
    }
    case 'gauntlet': {                                   // силова рукавиця: великий броньований кулак, наруч уздовж передпліччя, енергоядро, світні кісточки
      const dx = (R0.mx ?? ex) - ex, dy = (R0.my ?? ey - 8) - ey, L = Math.hypot(dx, dy) || 1, ux = dx / L, uy = dy / L;
      for (let k = 8; k >= 3; k--) BLK(Math.round(ex + ux * k) - 4, Math.round(ey + uy * k) - 4, 8, 8, 2, k % 2 ? '#3a2f78' : '#4a3e92');
      P(Math.round(ex + ux * 6), Math.round(ey + uy * 6) - 1, 1, 3, '#3be8ff');
      BLK(ex - 5, ey - 4, 11, 10, 3, '#5a4aa8'); P(ex - 4, ey - 4, 9, 3, '#8a7ae8'); P(ex - 3, ey - 4, 7, 1, '#d8d0ff');
      const kn = f % 8; for (let k = 0; k < 3; k++) P(ex - 3 + k * 3, ey - 3, 1, 1, kn === k * 2 ? '#ffffff' : '#3be8ff');
      P(ex - 2, ey - 1, 1, 3, '#2a2058'); P(ex + 1, ey - 1, 1, 3, '#2a2058');
      RR(ex - 1, ey + 1, 4, 4, 1, f % 6 < 3 ? '#3be8ff' : '#ff4fd8'); P(ex, ey + 2, 2, 1, '#ffffff');
      if (f % 4 === 0) P(ex + 6, ey - 5, 1, 1, '#ffffff'); if (f % 4 === 2) P(ex - 6, ey + 3, 1, 1, '#9af6ff');
      break;
    }
    case 'excalibur': {                                  // екскалібур: довгий клинок з рунами, золота гарда з завитками, синє руків'я, камінь
      P(ex, ey - 23, 2, 21, '#d6deff'); P(ex, ey - 23, 1, 21, '#ffffff'); P(ex + 1, ey - 22, 1, 20, '#9aa6d0'); P(ex, ey - 24, 1, 1, '#ffffff');
      for (let k = 0; k < 4; k++) P(ex, ey - 7 - k * 4, 1, 2, (f + k) % 4 === 0 ? '#ffffff' : '#7ad0ff');
      const g = (f * 2) % 34; if (g < 21) P(ex, ey - 3 - g, 2, 1, '#ffffff');
      P(ex - 4, ey - 2, 10, 2, '#e0a02a'); P(ex - 4, ey - 2, 10, 1, '#ffd45a'); P(ex - 5, ey - 3, 1, 2, '#ffd45a'); P(ex + 6, ey - 3, 1, 2, '#ffd45a');
      P(ex, ey, 2, 4, '#2a4aa8'); P(ex, ey + 1, 2, 1, '#ffd45a'); RR(ex - 1, ey + 4, 4, 3, 1, '#e0a02a'); P(ex, ey + 5, 2, 1, '#3b8cff');
      break;
    }
    case 'staff': {                                      // кришталевий посох: держак до підлоги, тримач-«лапки», кристал ширяє й світиться
      P(ex, ey - 17, 2, 26, '#6a4a2a'); for (let j = 0; j < 26; j += 3) P(ex, ey - 17 + j, 2, 1, '#9a7040');
      P(ex - 2, ey - 19, 1, 3, '#c9a040'); P(ex + 3, ey - 19, 1, 3, '#c9a040'); P(ex - 1, ey - 17, 4, 1, '#c9a040');
      const b = Math.round(Math.sin(t * 3));
      map(['...X...', '..XXX..', '.XXXXX.', 'XXXXXXX', 'XXXXXXX', '.XXXXX.', '..XXX..', '...X...'], ex - 2, ey - 29 + b, (c, i, j) => j < 3 ? (i < 3 ? '#ffffff' : '#e0f8ff') : j < 5 ? (i < 3 ? '#bff4ff' : '#7af4ff') : (i < 3 ? '#b88aff' : '#8a5aef'));
      P(ex, ey - 26 + b, 1, 2, '#ffffff');
      if (f % 3 === 0) P(ex - 5, ey - 25, 1, 1, '#cffaff'); if (f % 3 === 1) P(ex + 6, ey - 27, 1, 1, '#ffffff'); if (f % 3 === 2) P(ex + 1, ey - 32, 1, 1, '#ff9af0');
      break;
    }
    case 'trident': {                                    // морський тризуб: бронзове держало, три зубці з зазубринами, вістря світяться
      P(ex, ey - 12, 2, 20, '#b8862a'); P(ex, ey - 12, 1, 20, '#e0b050');
      P(ex - 4, ey - 14, 10, 2, '#b8862a'); P(ex - 4, ey - 14, 10, 1, '#e8c060');
      P(ex, ey - 22, 2, 8, '#d8a840'); P(ex - 4, ey - 19, 2, 5, '#d8a840'); P(ex + 4, ey - 19, 2, 5, '#d8a840');
      P(ex - 5, ey - 18, 1, 1, '#d8a840'); P(ex + 6, ey - 18, 1, 1, '#d8a840');
      const c1 = f % 4 < 2 ? '#7af4ff' : '#ffffff'; P(ex, ey - 24, 2, 2, c1); P(ex - 4, ey - 21, 2, 2, c1); P(ex + 4, ey - 21, 2, 2, c1);
      break;
    }
    case 'wand': {                                       // зоряна паличка: паличка, велика зірка, мерехтливі іскорки
      P(ex, ey - 10, 1, 13, '#e9eefc'); P(ex + 1, ey - 10, 1, 13, '#9aa6c8');
      map(['...X...', '..XXX..', 'XXXXXXX', '.XXXXX.', '..XXX..', '.XX.XX.', '.X...X.'], ex - 3, ey - 17, (c, i, j) => j < 3 && i < 4 ? '#fff0a0' : '#ffd45a'); P(ex, ey - 15, 1, 2, '#ffffff');
      [[-5, -19], [5, -20], [-4, -11], [6, -14], [0, -22]].forEach(([dx, dy], k) => { if ((f + k * 2) % 5 < 2) P(ex + dx, ey + dy, 1, 1, k % 2 ? '#ff9af0' : '#ffffff'); });
      break;
    }
    case 'balloon': {                                    // кулька-сердечко на нитці (гойдається)
      const sw = Math.round(Math.sin(t * 2) * 1.5), bx = ex + 1 + sw, by = ey - 29;
      line(ex + 1, ey - 1, bx, by + 9, '#e9eefc', 1);
      map(['.XXX.XXX.', 'XXXXXXXXX', 'XXXXXXXXX', 'XXXXXXXXX', '.XXXXXXX.', '..XXXXX..', '...XXX...', '....X....'], bx - 4, by, (c, i, j) => j < 4 && i < 4 && i + j > 1 ? '#ff9af0' : j > 4 || i > 6 ? '#d83ab8' : '#ff4fd8');
      P(bx - 2, by + 1, 2, 1, '#ffffff'); P(bx - 3, by + 2, 1, 1, '#ffffff');
      break;
    }
    case 'torch': {                                      // факел: держак, металева чаша, живе полум'я
      P(ex, ey - 6, 2, 11, '#6a4428'); P(ex, ey - 6, 1, 11, '#8a5a32'); P(ex - 1, ey - 9, 4, 3, '#8a93b8'); P(ex - 1, ey - 9, 4, 1, '#c3cbea');
      map([['..R..', '.RR..', '.RYR.', 'RYYRR', 'RYWYR', 'RYWYR', '.RYR.'], ['...R.', '..RR.', '.RYR.', 'RRYYR', 'RYWYR', 'RYWYR', '.RYR.'], ['..R..', '..RR.', '.RYR.', 'RYYYR', 'RYWYR', 'RYWYR', '.RYR.']][f % 3], ex - 1, ey - 16, c => c === 'W' ? '#ffffff' : c === 'Y' ? '#ffe27a' : '#ff7a2a');
      if (f % 4 === 1) P(ex + 1, ey - 18, 1, 1, '#ffb24a'); if (f % 4 === 3) P(ex, ey - 19, 1, 1, '#ff7a2a');
      break;
    }
    case 'magnet': {                                     // магніт-підкова: червоні плечі, срібні полюси, поле іскрить
      map(['SS...SS', 'SS...SS', 'RR...RR', 'RR...RR', 'RR...RR', 'RRR.RRR', 'RRRRRRR', '.RRRRR.'], ex - 3, ey - 11, (c, i) => c === 'S' ? (i === 0 || i === 5 ? '#ffffff' : '#c3cbea') : (i === 0 || i === 5 ? '#ff7a8a' : i > 4 ? '#b02a3a' : '#d93a4a'));
      if (f % 2) { P(ex - 2, ey - 14, 1, 1, '#9af6ff'); P(ex + 2, ey - 15, 1, 1, '#9af6ff'); P(ex, ey - 13, 1, 1, '#ffffff'); } else { P(ex, ey - 15, 1, 1, '#ffffff'); P(ex + 3, ey - 13, 1, 1, '#9af6ff'); P(ex - 3, ey - 13, 1, 1, '#9af6ff'); }
      break;
    }
  }
}
/** Предмет окремо (картки майстерні, objects/ws_paint.js): полотно W×H з контуром; кисть — внизу посередині. */
function renderItem(id, t, cv, W = 30, H = 44) {
  cv.width = W; cv.height = H; const x = cv.getContext('2d', { willReadFrequently: true }); x.clearRect(0, 0, W, H);
  const h = { ex: W >> 1, ey: H - 13, mx: W >> 1, my: H - 5 };
  drawHandItem(pxBrush(x), id, { ex: (W >> 1) + 2, ey: H - 17 }, h, t);
  pxOutline(x, W, H); return cv;
}

/** Візерунок теми на корпусі голови (лише всередині заокругленого корпусу 30×22; спереду середину закриває візор, ззаду
 *  видно весь): ribs — ребра гарбуза, stripes — смужки цукерки, circuit — схема з вогником, trim — золотий кант і камінь,
 *  facets — грані льоду з бліками, cracks — тріщини лави, що жевріють. */
function headPat(B, hp, hX, hY, shell, acc, t) {
  const { P, ins } = B, I = ins(6), inH = (x, y) => { const yy = y - hY; if (yy < 0 || yy > 21) return false; const k = yy < 6 ? I[yy] : yy > 15 ? I[21 - yy] : 0; return x >= hX + k && x <= hX + 29 - k; };
  const Q = (x, y, c) => { if (inH(x, y)) P(x, y, 1, 1, c); };
  switch (hp) {
    case 'ribs': [5, 10, 15, 20, 25].forEach(dx => { for (let y = hY + 1; y < hY + 21; y++) { Q(hX + dx, y, shade(shell, -.22)); if (y % 3) Q(hX + dx + 1, y, shade(shell, .22)); } }); break;
    case 'stripes': for (let y = hY; y < hY + 22; y++) for (let x = hX; x < hX + 30; x++) if (((x - y) % 7 + 7) % 7 < 2) Q(x, y, shade(acc, .15)); break;
    case 'circuit': { const on = Math.floor(t * 5) % 6; [[2, 2, 8, 0], [20, 2, 8, 1], [1, 9, 3, 2], [26, 9, 3, 3], [3, 19, 7, 4], [20, 19, 7, 5]].forEach(([a, c, w, k]) => {
      for (let i = 0; i < w; i++) Q(hX + a + i, hY + c, k === on ? '#e0ffe8' : acc); const e = hX + a + (k % 2 ? w - 1 : 0); Q(e, hY + c + 1, acc); Q(e, hY + c + 2, '#ffffff'); }); break; }
    case 'trim': for (let y = hY; y < hY + 22; y++) { let x0 = -1, x1 = -1; for (let x = hX; x < hX + 30; x++) if (inH(x, y)) { if (x0 < 0) x0 = x; x1 = x; } if (x0 >= 0) { P(x0 + 1, y, 1, 1, acc); P(x1 - 1, y, 1, 1, acc); } }
      for (let x = hX + 5; x < hX + 25; x++) Q(x, hY + 1, acc); Q(hX + 14, hY + 2, '#ff3b6a'); Q(hX + 15, hY + 2, '#ff3b6a'); break;
    case 'facets': [[3, 1, 6], [12, 0, 5], [21, 1, 6], [2, 14, 5], [24, 13, 5]].forEach(([a, c, n]) => { for (let k = 0; k < n; k++) Q(hX + a + k, hY + c + k, shade(shell, -.16)); for (let k = 0; k < n - 1; k++) Q(hX + a + k + 1, hY + c + k, '#ffffff'); }); break;
    case 'cracks': { const hot = Math.sin(t * 3) > 0 ? '#ffd27a' : '#ff9a3a';
      [[[4, 2], [6, 3], [7, 3], [8, 5], [10, 6]], [[22, 1], [21, 3], [23, 4], [24, 6]], [[3, 15], [5, 16], [6, 18], [8, 19]], [[25, 14], [23, 16], [24, 18]]].forEach((pts, k) => pts.forEach(([a, c], i) => { Q(hX + a, hY + c, (i + k + Math.floor(t * 4)) % 3 ? '#ff6a1a' : hot); Q(hX + a + 1, hY + c, '#ff6a1a'); })); break; }
  }
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
    case 'halo': { const y = hY - 8 + ay + Math.round(Math.sin(t * 2.4)), x0 = cx + ax;          // німб: золоте кільце ширяє над головою
      for (let i = 0; i < 32; i++) { const a = i / 32 * Math.PI * 2; P(Math.round(x0 + Math.cos(a) * 9), Math.round(y + Math.sin(a) * 2.2), 1, 1, Math.sin(a) > 0 ? '#fff4b0' : '#ffc94d'); }
      if (Math.floor(t * 3) % 4 === 0) P(x0 + 6, y - 3, 1, 1, '#ffffff'); break; }
    case 'flame': { rod(cx, cx + ax, hY - 4 + ay, '#5a2a1a'); const X0 = cx + ax - 2, Y0 = hY - 11 + ay;   // полум'я на тримачі
      [['..R..', '.RR..', '.RYR.', 'RYWYR', '.RYR.'], ['...R.', '..RR.', '.RYR.', 'RYWYR', '.RYR.'], ['..R..', '..RR.', '.RYR.', 'RYYYR', '.RYR.']][Math.floor(t * 10) % 3]
        .forEach((r, j) => [...r].forEach((ch, i) => { if (ch !== '.') P(X0 + i, Y0 + j, 1, 1, ch === 'W' ? '#ffffff' : ch === 'Y' ? '#ffe27a' : '#ff6a1a'); })); break; }
    case 'stem': P(cx - 1 + ax, hY - 5 + ay, 3, 6, '#6a4a1a'); P(cx - 1 + ax, hY - 5 + ay, 1, 6, '#8a6a2a'); P(cx + 2 + ax, hY - 6 + ay, 4, 2, '#3f8a2a'); P(cx + 5 + ax, hY - 8 + ay, 2, 2, '#5fae6a'); P(cx - 3 + ax, hY - 7 + ay, 2, 1, '#5fae6a'); break;   // хвостик гарбуза з листком
    default: P(cx - 2, hY - 2, 4, 2, '#5a6590'); rod(cx, cx + ax, hY - 9 + ay); RR(cx + ax - 2, hY - 13 + ay, 5, 5, 2, tip); P(cx + ax - 1, hY - 12 + ay, 1, 1, '#ffffff');
  }
}

/** HSL -> #hex (для райдужної теми й RGB-антен). */
function hsl2hex(h, s, l) { const k = n => (n + h / 30) % 12, a = s * Math.min(l, 1 - l), f = n => l - a * Math.max(-1, Math.min(k(n) - 3, 9 - k(n), 1)); return '#' + [f(0), f(8), f(4)].map(v => Math.round(v * 255).toString(16).padStart(2, '0')).join(''); }

/* ============================================================================
 * objects/wing_decor.js — ДЕКОР СТІНИ ЛІВОГО КРИЛА: труби, кабель-канали, постери, наліпки
 * ----------------------------------------------------------------------------
 * Власник (пункт №2 списку «до рівня картинки»): «фактура стіни: плями, патьоки, труби й
 * кабель-канали з неоном, постер/наліпки». Плями, патьоки, кіптява й тріщини запікаються
 * в саму цеглу (NX.kit.brick fx у wing_wall.js). Тут — те, що висить на стіні; усе кодом
 * у стилі кімнати (піксель-арт 4 px/од., контур, дизеринг, неон) і кидає м'яку тінь на
 * цеглу (NX.wing.shades) та лишає іржаві патьоки під трубою (NX.wing.drips):
 *   ТРУБА під стелею (x 240..531): метал з фланцями й хомутами, скляна вставка з
 *     неоновою рідиною, що тече; у фланцях — рожеві неонові прорізи
 *   СТОЯК (x 488..493) від труби вниз до стола маркетингу: муфти з неоновими кільцями,
 *     манометр (стрілка тремтить), наліпки «кіт» і «!»
 *   КАБЕЛЬ-КАНАЛИ з LED-стрічкою: лівий — від екрана NET униз до розподільчої коробки й
 *     голо-монітора (блакитний вогник біжить донизу); правий — від труби до таблички
 *     AI CHAT (рожевий імпульс угору, як живлення)
 *   ПОСТЕРИ (власні): «NEXORA» — синтвейв-сонце з силуетом Nexi над неоновою сіткою;
 *     «MEOW» — рудий кіт Рудик у пікселевих окулярах; скотч по кутах, загнутий кутик
 *   НАЛІПКИ (NX.kit.sticker): логотип N, серце, блискавка, Nexi, кіт, «!», зірка, AI, QR
 * Порядок (wing_wall.js -> wingBack): цегла -> under() (канали, стояк, труба, постери,
 * наліпки) -> полиці/стелаж/табличка -> over() (наліпка на стелажі + живе).
 * ========================================================================== */
(() => {
  const P = NX.px, F = NX.furn, K = NX.kit, { CHROME, OUT } = F.PAL, ramp = F.ramp, hash = NX.art.hash, rgba = K.rgba, lit = K.lit;
  const MET = ['#0a0820', '#141034', '#201a4a', '#2e2662', '#40367e', '#584ca0', '#7a70c0', '#a8a0e0'];   // фіолетова сталь (у тон кімнати)
  const PVC = ['#1a1440', '#262058', '#342c70', '#443a88', '#564ca2', '#6e62bc'];                        // пластик кабель-каналу
  const PAPERW = ['#5a5486', '#6e68a0', '#8580b8', '#9d98cc', '#b4afdc'];                                 // поля постерів (у неоновому присмерку)

  // ---------- геометрія (одиниці кімнати) ----------
  const PIPE = { x0: 240, x1: 531, y: 4, h: 5, flanges: [300, 372, 414, 450, 512], clamps: [268, 336, 394, 470], glass: [414, 450] };
  const RISER = { x: 488, w: 5, y1: 272, rings: [62, 140, 250], gauge: [498.4, 212, 4.4] };
  const DUCTS = [
    { x: 56.6, y0: 35.6, y1: 222, w: 5, rgb: '59,232,255', box: [52.4, 221, 63, 229], cable: [[57.6, 229], [58.4, 260], [58.2, 289]], dir: 1 },   // від NET униз до голо-монітора
    { x: 340, y0: 5, y1: 86, w: 4.4, rgb: '255,79,216', dir: -1 },                                                                         // від труби до таблички AI CHAT
  ];
  const POSTERS = [{ kind: 'sunset', x: 6, y: 176, w: 46, h: 54, rot: -.025, seed: 1 }, { kind: 'cat', x: 407, y: 16, w: 36, h: 30, rot: .035, seed: 2 }];
  const STICKERS = [
    { kind: 'n', x: 59.1, y: 118, s: 4.6, rot: .12, on: 0 }, { kind: 'heart', x: 59.1, y: 186, s: 4.2, rot: -.18, on: 0 }, { kind: 'bolt', x: 342.2, y: 54, s: 4.4, rot: .1, on: 1 },
    { kind: 'cat', x: 490.5, y: 162, s: 4.8, rot: .14, on: 'riser' }, { kind: 'warn', x: 490.5, y: 198, s: 4.4, on: 'riser' },
    { kind: 'robot', x: 398.6, y: 76, s: 5.2, rot: -.1 }, { kind: 'star', x: 324.4, y: 66, s: 4, rot: .3 }, { kind: 'qr', x: 482, y: 118, s: 4, rot: .08 },
    { kind: 'ai', x: 252.4, y: 124, s: 5.6, rot: -.06, over: 1 },                                                                          // на лівій стійці стелажа
  ];
  // м'які тіні на цеглі й іржаві патьоки під трубою — запікаються в стіну (wing_wall.js -> K.brick)
  NX.wing.shades.push(
    { box: [PIPE.x0, PIPE.y, PIPE.x1, PIPE.y + PIPE.h], dy: 2.2, r: 4.5, k: .55 },
    { box: [RISER.x, PIPE.y + PIPE.h, RISER.x + RISER.w, RISER.y1], dx: -1.2, dy: 1, r: 3.6, k: .5 }, { ell: [RISER.gauge[0] - .8, RISER.gauge[1] + 1.6, 5.4, 5.2], k: .45 },
    ...DUCTS.map(D => ({ box: [D.x, D.y0, D.x + D.w, D.y1], dx: -1, dy: 1.2, r: 2.8, k: .5 })), { box: DUCTS[0].box, dx: -1, dy: 1.5, r: 2.8, k: .45 },
    ...POSTERS.map(Q => ({ box: [Q.x, Q.y, Q.x + Q.w, Q.y + Q.h], dx: -.8, dy: 1.3, r: 2.6, k: .38 })),
  );
  NX.wing.drips.push(
    { x: 300.4, y: 10, len: 26, w: 1.1, k: .55, rust: 1 }, { x: 372.6, y: 10, len: 18, w: 1, k: .5, rust: 1 }, { x: 450.6, y: 10, len: 34, w: 1.2, k: .55, rust: 1 },
    { x: 268.2, y: 10, len: 12, w: .9, k: .45, rust: 1 }, { x: 512.6, y: 10, len: 20, w: 1, k: .45, rust: 1 }, { x: 497.6, y: 217, len: 26, w: 1, k: .55, rust: 1 },   // і з-під манометра
  );

  // ---------- шрифти постерів (5×7 і 3×5) ----------
  const F5 = {
    N: ['X...X', 'XX..X', 'X.X.X', 'X.X.X', 'X..XX', 'X...X', 'X...X'], E: ['XXXXX', 'X....', 'X....', 'XXXX.', 'X....', 'X....', 'XXXXX'],
    X: ['X...X', 'X...X', '.X.X.', '..X..', '.X.X.', 'X...X', 'X...X'], O: ['.XXX.', 'X...X', 'X...X', 'X...X', 'X...X', 'X...X', '.XXX.'],
    R: ['XXXX.', 'X...X', 'X...X', 'XXXX.', 'X.X..', 'X..X.', 'X...X'], A: ['.XXX.', 'X...X', 'X...X', 'XXXXX', 'X...X', 'X...X', 'X...X'],
    M: ['X...X', 'XX.XX', 'X.X.X', 'X.X.X', 'X...X', 'X...X', 'X...X'], W: ['X...X', 'X...X', 'X...X', 'X.X.X', 'X.X.X', 'XX.XX', 'X...X'],
  };
  const F3 = { 8: ['XXX', 'X.X', 'XXX', 'X.X', 'XXX'], '-': ['...', '...', 'XXX', '...', '...'], B: ['XX.', 'X.X', 'XX.', 'X.X', 'XX.'], I: ['XXX', '.X.', '.X.', '.X.', 'XXX'], T: ['XXX', '.X.', '.X.', '.X.', '.X.'], A: ['.X.', 'X.X', 'XXX', 'X.X', 'X.X'], ' ': ['...', '...', '...', '...', '...'] };
  /** Чи точка (lx, ly) на літері напису s: (x0, y0) — лівий верх, p — розмір «пікселя» шрифту. */
  function onText(lx, ly, s, x0, y0, p, Fn) {
    const g0 = Fn[s[0]] || Fn[' '] || Fn.N, cw = g0[0].length, ch = g0.length, gx = Math.floor((lx - x0) / p), gy = Math.floor((ly - y0) / p);
    if (gy < 0 || gy >= ch || gx < 0) return false; const k = Math.floor(gx / (cw + 1)), cx = gx % (cw + 1); if (k >= s.length || cx >= cw) return false;
    const g = Fn[s[k]]; return !!g && g[gy][cx] === 'X';
  }
  const textW = (s, p, cw) => (s.length * (cw + 1) - 1) * p;

  // ---------- постер «NEXORA»: синтвейв-сонце, силует Nexi, неонова сітка ----------
  const SKY = ['#120a30', '#1a0e42', '#241252', '#321662', '#461c72', '#5e2280', '#7a2a8c'], SUN = ['#ff4fd8', '#ff5a9e', '#ff7a5a', '#ffa44a', '#ffd25a', '#ffe9a0'];
  function sunset(lx, ly, w, h, i, j) {
    const m = 1.6, cx = w / 2, hz = 37, sy = 29, sr = 11.2;
    if (lx < m || lx > w - m || ly < m || ly > h - m) return ramp(PAPERW, .75 - ly / h * .35, i, j, .14);
    const p = .9, tx = cx - textW('NEXORA', p, 5) / 2;
    if (onText(lx, ly, 'NEXORA', tx, 4.2, p, F5)) return '#5ae8ff';
    if (onText(lx - .9, ly - .9, 'NEXORA', tx, 4.2, p, F5)) return '#c8309e';                                       // рожева тінь напису
    const p3 = .62, t3 = '8-BIT AI', tx3 = cx - textW(t3, p3, 3) / 2;
    if (onText(lx, ly, t3, tx3, h - m - 4.3, p3, F3)) return '#ff84d4';
    // силует Nexi на тлі сонця: голова з антеною, «вушка», плечі; очі світяться
    const dx = lx - cx, hy = ly - 26.6, qx = Math.abs(dx) - 3.1, qy = Math.abs(hy) - 2.2;
    const head = Math.hypot(Math.max(qx, 0), Math.max(qy, 0)) + Math.min(Math.max(qx, qy), 0) < 1.5;
    if (head && Math.abs(Math.abs(dx) - 2.1) < .65 && Math.abs(hy + .2) < .7) return '#7af8ff';                     // очі
    if (head || (Math.abs(dx) < .35 && ly > 20.8 && ly < 23) || (Math.abs(Math.abs(dx) - 5.1) < .55 && Math.abs(hy) < 1.1)) return '#0c0620';
    if (Math.hypot(dx, ly - 20.4) < .9) return '#ff6ec8';                                                           // кулька антени
    if (ly > 30 && ly < hz && Math.abs(dx) < Math.min(7.2, 2.2 + (ly - 30) * 1.9)) return '#0c0620';               // шия й плечі
    // гори перед сонцем, обрій, сітка
    const ridge = hz - 1.8 - 1.5 * Math.abs(Math.sin(lx * .55 + 1)) - 1.1 * Math.abs(Math.sin(lx * .23 + 2));
    if (ly >= hz - .35 && ly < hz + .35) return '#ff6ec8';
    if (ly > ridge && ly < hz) return ly < ridge + .45 ? '#4a1a6a' : '#1c0a34';
    if (ly >= hz) {
      const d = ly - hz, tt = dx / (d + .7);
      if ((Math.sqrt(d) * 1.8) % 1 < .16) return '#c8309e';
      if (Math.abs(((tt * 1.7) % 1 + 1) % 1 - .5) > .44) return '#2ab0d8';
      return ramp(['#0c0424', '#120830', '#1a0c3c'], .3 + d / 10 * .5, i, j);
    }
    const sd = Math.hypot(dx, ly - sy);                                                                              // сонце зі смугами знизу
    if (sd < sr) { const k = (ly - sy) / sr; if (!(k > 0 && ((ly - sy) % 2.4) < k * 1.15)) return ramp(SUN, .95 - (ly - (sy - sr)) / (2 * sr), i, j, .05); }
    if (hash(i >> 1, j >> 1) > .986 && ly < 22) return '#d8d2f2';                                                    // зорі
    return ramp(SKY, ly / hz * .95, i, j, .06);
  }
  // ---------- постер «MEOW»: рудий кіт Рудик у пікселевих окулярах ----------
  const FUR = ['#5a2a0c', '#8a4414', '#b8601e', '#e07e2c', '#f6a04a', '#ffc27a'];
  function catArt(lx, ly, w, h, i, j, seed) {
    const m = 1.4, cx = w / 2, dx = lx - cx, ady = Math.abs(dx);
    if (lx < m || lx > w - m || ly < m || ly > h - m) return ramp(PAPERW, .78 - ly / h * .35, i, j, .14);
    const p = .62, tx = cx - textW('MEOW', p, 5) / 2;
    if (onText(lx, ly, 'MEOW', tx, 22.2, p, F5)) return '#ff6ec8';
    if (onText(lx - .6, ly - .6, 'MEOW', tx, 22.2, p, F5)) return '#1a0820';
    const ex = ady, inEar = (ly < 9.4 && ly > 2.6 && ex > 3.4 + (9.4 - ly) * .2 && ex < 8.9 - (9.4 - ly) * .32);   // вушка
    if (inEar) return ex > 4.6 + (9.4 - ly) * .2 && ex < 7.6 - (9.4 - ly) * .32 && ly > 4.6 ? '#e06a9a' : ramp(FUR, .7 - (9.4 - ly) * .05, i, j);
    const hd = (dx / 9.2) ** 2 + ((ly - 13) / 7.2) ** 2;
    if (hd < 1) {
      if (ly > 10.3 && ly < 13.5 && ((ady > .9 && ady < 6.9) || (ady <= .9 && ly < 11.5)) ) {                    // окуляри + місток
        const lens = ady > .9; if (lens && ((ady - .9) + (13.5 - ly) * .8) % 3.2 < .55 && ly < 12.6) return '#9af6ff'; return '#08060f'; }
      if (ady > 6.9 && ady < 8.8 && ly > 10.5 && ly < 11.2) return '#08060f';                                        // дужки окулярів
      const mz = (dx / 4.6) ** 2 + ((ly - 16.3) / 2.7) ** 2;
      if (ly > 14.4 && ly < 15.3 && ady < .95 - (ly - 14.4) * .7) return '#ff7aa8';                                   // ніс
      if ((ady < .2 && ly > 15.3 && ly < 16.2) || (ly > 16.1 && ly < 16.6 && ady > .2 && ady < 1.3)) return '#5a2a1a'; // рот
      if (mz < 1) return ramp(['#c8b0a8', '#e2d0c8', '#f4e8e0'], .9 - mz * .5, i, j);
      if (ady < 2.8 && ly < 9.6 && ((dx + 3) / 1.9) % 1 < .38) return FUR[1];                                       // смужки на лобі
      return ramp(FUR, .82 - dx / 9.2 * .25 - (ly - 13) / 7.2 * .3, i, j, .08);
    }
    if (ly > 15 && ly < 18.4 && ady > 8.4 && ady < 13 && Math.abs(ly - (15.9 + (ady - 8.4) * (Math.floor(ly) % 2 ? .3 : -.12))) < .22) return '#e8e0f0';   // вуса
    const gl = Math.hypot(dx, ly - 13); if (gl < 14) return ramp(['#1a0e3a', '#2a1250', '#3a1662', '#4a1a70'], 1 - gl / 14, i, j, .05);   // рожеве сяйво за котом
    if (hash(i >> 1, (j >> 1) + seed) > .985) return '#ffe27a';                                                    // іскорки
    return ramp(['#0a1a30', '#0e2440', '#12304e'], .7 - ly / h * .5, i, j, .05);
  }
  /** Постер -> аркуш: трохи нахилений, загнутий нижній правий кутик, скотч по верхніх кутах. */
  function buildPoster(Q) {
    const { x, y, w, h } = Q, a = Q.rot || 0, ca = Math.cos(a), sa = Math.sin(a), cx = x + w / 2, cy = y + h / 2, R = Math.hypot(w, h) / 2 + 1.5;
    const S = F.Sheet(cx - R, cy - R, cx + R, cy + R), at = (px, py) => [cx + px * ca - py * sa, cy + px * sa + py * ca], art = Q.kind === 'sunset' ? sunset : catArt;
    S.poly([at(-w / 2, -h / 2), at(w / 2, -h / 2), at(w / 2, h / 2), at(-w / 2, h / 2)], (u, v, i, j, X, Y) => {
      const lx = (X - cx) * ca + (Y - cy) * sa + w / 2, ly = -(X - cx) * sa + (Y - cy) * ca + h / 2, cr = (w - lx) + (h - ly);
      if (cr < 4.4) return null;                                                                                   // кутик загнувся — там стіна
      if (cr < 6.6 && w - lx < 4.4 && h - ly < 4.4) return cr < 5.2 ? '#e2dcf6' : '#c4bee6';                      // зворот паперу на загині
      if (cr < 7.1) return '#2a1e48';                                                                               // тінь під загином
      return art(lx, ly, w, h, i, j, Q.seed || 0);
    });
    [[-w / 2 + 1, -h / 2 + .4, -.6], [w / 2 - 1, -h / 2 + .4, .55]].forEach(([px, py, r]) => {                     // скотч: напівпрозорий (розсип двох тонів)
      const tc = Math.cos(a + r), ts = Math.sin(a + r), [qx, qy] = at(px, py), T = (u2, v2) => [qx + u2 * tc - v2 * ts, qy + u2 * ts + v2 * tc];
      S.poly([T(-2.6, -.9), T(2.6, -.9), T(2.6, .9), T(-2.6, .9)], (u, v, i, j) => (i + j) % 2 ? '#d8d2f2' : '#a8a2cc');
    });
    S.cv = S.canvas(); return S;
  }

  // ---------- труба під стелею, стояк з манометром, кабель-канали ----------
  const cyl = (q, i, j, k = 0) => ramp(MET, .8 - Math.abs(q - .32) * 1.3 + k, i, j, .06);                         // циліндр: блік трохи вище осі
  function buildPipe() {
    const { x0, x1, y, h, glass } = PIPE, S = F.Sheet(x0 - 2, 0, x1 + 1, y + h + 3);
    S.rect(x0, y, x1, y + h, (u, v, i, j, X) => X >= glass[0] && X < glass[1] ? null : v < .1 || v > .9 ? OUT : cyl(v, i, j));
    S.rect(glass[0], y, glass[1], y + h, (u, v, i, j) => v < .08 || v > .92 ? OUT : v < .2 ? '#9ad8ff' : v > .82 ? '#1a5a8a' : ramp(['#031628', '#04203a', '#062a4a', '#0a3a62'], .55 - Math.abs(v - .42) * 1.2, i, j, .06));   // скло з рідиною (тече — живим)
    PIPE.clamps.forEach(cx => {                                                                                     // хомут + кріплення до стелі
      S.rect(cx - 1.1, 0, cx + 1.1, y, (u, v, i, j) => u < .2 || u > .8 ? OUT : ramp(MET, .55 - u * .3, i, j));
      S.rect(cx - 1, y - .45, cx + 1, y + h + .45, (u, v, i, j) => u < .15 || u > .85 || v < .06 || v > .94 ? OUT : cyl(v, i, j, -.14)); });
    PIPE.flanges.forEach(fx => S.rect(fx - 1.7, y - 1, fx + 1.7, y + h + 1, (u, v, i, j) => {                        // фланці: болти, рожевий неоновий проріз
      if (u < .1 || u > .9 || v < .06 || v > .94) return OUT;
      if (Math.abs(u - .5) < .1) return '#3a0b38';
      if (Math.abs(u - .5) > .26 && (v < .22 || v > .78) && (((u * 8) | 0) % 3) === 0) return MET[7];
      return cyl(v, i, j, .08); }));
    S.rect(RISER.x - .9, y - .8, RISER.x + RISER.w + .9, y + h + 1.8, (u, v, i, j) => u < .1 || u > .9 || v < .06 || v > .95 ? OUT : cyl(u * .8 + .05, i, j, .06));   // трійник над стояком
    S.cv = S.canvas(); return S;
  }
  function buildRiser() {
    const { x, w, y1, gauge: [gx, gy, gr] } = RISER, S = F.Sheet(x - 2, PIPE.y + PIPE.h - 1, gx + gr + 1.5, y1 + 1);
    S.rect(x, PIPE.y + PIPE.h, x + w, y1, (u, v, i, j) => u < .1 || u > .9 ? OUT : cyl(u, i, j));
    RISER.rings.forEach(ry => S.rect(x - .8, ry - 1.5, x + w + .8, ry + 1.5, (u, v, i, j) => u < .1 || u > .9 || v < .08 || v > .92 ? OUT : Math.abs(v - .5) < .15 ? '#3a0b38' : cyl(u, i, j, .08)));   // муфти з неоновим кільцем
    S.rect(x + w - .2, gy - .75, gx - gr + .5, gy + .75, (u, v, i, j) => v < .2 || v > .8 ? OUT : cyl(v, i, j));      // відвід до манометра
    S.rr(gx - gr, gy - gr, gx + gr, gy + gr, gr, (d, u, v, i, j, X, Y) => {
      const dd = Math.hypot(X - gx, Y - gy), an = Math.atan2(Y - gy, X - gx);
      if (dd > gr - .35) return OUT; if (dd > gr - 1.05) return ramp(CHROME, .85 - v * .55, i, j);                 // хромований обідок
      if (dd > gr - 1.75 && an < -.08 && an > -Math.PI + .08) { if (an > -.75) return '#c8304a'; if (((an + Math.PI) / Math.PI * 9) % 1 < .32) return '#d8d2f2'; }   // поділки, червона зона
      return ramp(['#080820', '#10102e', '#18183e'], .55 - v * .35, i, j);
    });
    STICKERS.filter(s => s.on === 'riser').forEach(s => K.sticker(S, s));
    S.cv = S.canvas(); return S;
  }
  function buildDuct(D, n) {
    const bx = D.box || [D.x, D.y0, D.x + D.w, D.y1], yEnd = D.cable ? D.cable[D.cable.length - 1][1] : D.y1, S = F.Sheet(Math.min(bx[0], D.x) - 1, D.y0 - 1, Math.max(bx[2], D.x + D.w) + 1, Math.max(bx[3], yEnd) + 1);
    if (D.cable) { const c = D.cable; for (let k = 1; k < c.length; k++) S.line(c[k - 1][0], c[k - 1][1], c[k][0], c[k][1], OUT, 1.2); for (let k = 1; k < c.length; k++) S.line(c[k - 1][0] - .2, c[k - 1][1], c[k][0] - .2, c[k][1], '#2a2454', .5); }
    S.rect(D.x, D.y0, D.x + D.w, D.y1, (u, v, i, j, X, Y) => {
      if (u < .08 || u > .92) return OUT;
      if (((Y - D.y0) % 28) < .45) return PVC[0];                                                                   // стики секцій
      if (Math.abs(u - .5) < .12) return '#080618';                                                                 // проріз LED-стрічки (світить живим)
      if (Math.abs(u - .5) < .2) return PVC[1];
      return ramp(PVC, .72 - Math.abs(u - .28) * 1.3, i, j, .05);
    });
    if (D.box) S.rr(D.box[0], D.box[1], D.box[2], D.box[3], .8, (d, u, v, i, j) => d < .35 ? OUT : v < .18 ? PVC[5] : (Math.abs(u - .78) < .08 && Math.abs(v - .5) < .2) ? '#0a2a1a' : ramp(PVC, .55 - v * .3, i, j));   // розподільча коробка з вогником
    STICKERS.filter(s => s.on === n).forEach(s => K.sticker(S, s));
    S.cv = S.canvas(); return S;
  }
  function buildSticker(o) { const R = (o.s || 4.4) * .85, S = F.Sheet(o.x - R, o.y - R, o.x + R, o.y + R); K.sticker(S, o); S.cv = S.canvas(null); return S; }

  let UNDER = null, OVER = null;
  function build() {
    UNDER = [...DUCTS.map(buildDuct), buildRiser(), buildPipe(), ...POSTERS.map(buildPoster), ...STICKERS.filter(s => s.on === undefined && !s.over).map(buildSticker)];
    OVER = STICKERS.filter(s => s.over).map(buildSticker);
  }
  NX.wing.decor = {
    PIPE, RISER, DUCTS, POSTERS, STICKERS,
    /** Під полицями й стелажем: канали, стояк, труба, постери, наліпки на цеглі. */
    under(c, t, R) { if (!UNDER) build(); c.save(); UNDER.forEach(S => K.draw(c, S, R)); c.restore(); },
    /** Над стелажем: наліпка на стійці + живе (рідина в трубі, неон фланців і муфт, LED каналів, стрілка манометра). */
    over(c, t, R) {
      if (!OVER) build();
      c.save(); OVER.forEach(S => K.draw(c, S, R));
      const { y, h, glass: [g0, g1] } = PIPE;
      c.globalCompositeOperation = 'lighter';
      lit(c, g0 + .2, y + .9, g1 - g0 - .4, h - 1.8, rgba('59,232,255', .2 + .06 * Math.sin(t * 2)));                    // рідина світиться
      for (let k = 0; k < 7; k++) { const q = ((t * .22 + k / 7) % 1), px = g0 + .6 + q * (g1 - g0 - 1.2), py = y + 1.5 + ((k * 1.7) % 2.2); lit(c, px - .5, py, 1, .5, rgba('190,250,255', .75)); }   // бульбашки течуть
      P.glow(c, (g0 + g1) / 2, y + h / 2, 16, 'rgba(59,232,255,.8)', .16 + .05 * Math.sin(t * 2));
      PIPE.flanges.forEach((fx, n) => { const a = .5 + .35 * Math.sin(t * 1.6 + n * 1.3); lit(c, fx - .2, y - .4, .4, h + .8, rgba('255,79,216', a)); P.glow(c, fx, y + h / 2, 4, 'rgba(255,79,216,.8)', .14 * a); });   // неонові прорізи фланців
      RISER.rings.forEach((ry, n) => { const a = .5 + .35 * Math.sin(t * 1.4 + n * 2); lit(c, RISER.x - .4, ry - .2, RISER.w + .8, .4, rgba('255,79,216', a)); P.glow(c, RISER.x + RISER.w / 2, ry, 4.5, 'rgba(255,79,216,.8)', .12 * a); });
      DUCTS.forEach((D, n) => {                                                                                       // LED-стрічка: тьмяне світло + вогник, що біжить
        const cx = D.x + D.w / 2, len = D.y1 - D.y0; lit(c, cx - .3, D.y0, .6, len, rgba(D.rgb, .22 + .06 * Math.sin(t * 1.3 + n)));
        for (let k = 0; k < 2; k++) { const q = ((t * (n ? .55 : .32) + k * .5) % 1), py = D.dir > 0 ? D.y0 + q * len : D.y1 - q * len; lit(c, cx - .35, py - 3, .7, 6, rgba(D.rgb, .85)); P.glow(c, cx, py, 5, `rgba(${D.rgb},.8)`, .25); }
        if (D.box) lit(c, D.box[0] + (D.box[2] - D.box[0]) * .74, D.box[1] + 3.2, .9, 1.6, Math.sin(t * 3) > 0 ? '#3bff8a' : '#14502e');
      });
      c.globalCompositeOperation = 'source-over';
      const [gx, gy, gr] = RISER.gauge, an = -Math.PI * .62 + .14 * Math.sin(t * 1.7) + .05 * Math.sin(t * 7.3);       // стрілка манометра тремтить
      c.strokeStyle = '#ff3b6a'; c.lineWidth = .45; c.beginPath(); c.moveTo(gx, gy); c.lineTo(gx + Math.cos(an) * (gr - 1.4), gy + Math.sin(an) * (gr - 1.4)); c.stroke();
      lit(c, gx - .45, gy - .45, .9, .9, CHROME[4]);
      c.restore();
    },
  };
})();

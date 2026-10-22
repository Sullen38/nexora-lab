/* ============================================================================
 * actors/cat/cat_sprite.js — МИЛИЙ РУДИЙ КІТ РУДИК (HD-сітка 32×24)
 * ----------------------------------------------------------------------------
 * drawCat(pose, frame, t, canvas) — кіт дивиться вправо (вліво дзеркалимо).
 * Мила стилістика: велика кругла голова, великі темні очі з двома бліками,
 * рожеві щічки, ротик "ω", пухнастий смугастий хвіст, білі шкарпетки.
 * Пози: walk, run, sit, happy (коли гладять), groom, sleep, eat, stretch,
 *       pounce, meow. Темний контур додається автоматично.
 * ========================================================================== */
const CAT_W = 32, CAT_H = 24;
const CATC = { O: '#f39a3c', L: '#ffc27a', D: '#d0702a', S: '#a84e14', W: '#fff6ea', N: '#ff8fb0', B: '#ff9fb5', E: '#2a140a', OUT: [52, 22, 8] };
function drawCat(pose, fr, t, cv) {
  cv.width = CAT_W; cv.height = CAT_H; const x = cv.getContext('2d', { willReadFrequently: true }); x.clearRect(0, 0, CAT_W, CAT_H);
  const P = (a, b, w, h, col) => { x.fillStyle = col; x.fillRect(a, b, w, h); }, C = CATC;
  /** Кругла "булочка": заливка з обрізаними кутами + світлий верх + темний низ. */
  const BUN = (a, b, w, h, c = C.O) => { P(a + 2, b, w - 4, h, c); P(a + 1, b + 1, w - 2, h - 2, c); P(a, b + 2, w, h - 4, c); P(a + 2, b, w - 4, 1, C.L); P(a + 1, b + 1, 2, 1, C.L); P(a + 2, b + h - 1, w - 4, 1, C.D); };
  /** Голова 13×11: вушка, мордочка, очі, щічки, носик, ротик ω. eyes: open | closed | happy | meow */
  const head = (hx, hy, eyes) => {
    for (const ex of [hx + 1, hx + 8]) { P(ex + 1, hy - 3, 2, 1, C.O); P(ex, hy - 2, 4, 1, C.O); P(ex, hy - 1, 4, 2, C.O); P(ex + 1, hy - 2, 2, 2, C.N); }   // вушка
    BUN(hx, hy, 13, 11); P(hx + 5, hy, 3, 1, C.D); P(hx + 6, hy + 1, 1, 1, C.D);                                                                         // голова + смужка на лобі
    P(hx + 4, hy + 6, 5, 4, C.W); P(hx + 3, hy + 7, 7, 3, C.W);                                                                                          // мордочка
    if (eyes === 'open' || eyes === 'meow') { for (const ex of [hx + 2, hx + 8]) { P(ex, hy + 3, 3, 4, C.E); P(ex, hy + 3, 1, 1, '#ffffff'); P(ex + 2, hy + 5, 1, 1, '#ffffff'); } }
    else if (eyes === 'happy') { for (const ex of [hx + 2, hx + 8]) { P(ex, hy + 5, 1, 1, C.E); P(ex + 1, hy + 4, 1, 1, C.E); P(ex + 2, hy + 5, 1, 1, C.E); } }
    else { for (const ex of [hx + 2, hx + 8]) { P(ex, hy + 5, 3, 1, C.E); P(ex, hy + 4, 1, 1, C.E); P(ex + 2, hy + 4, 1, 1, C.E); } }
    P(hx + 1, hy + 7, 2, 1, C.B); P(hx + 10, hy + 7, 2, 1, C.B);                                                                                         // щічки
    P(hx + 6, hy + 7, 1, 1, C.N);                                                                                                                        // носик
    if (eyes === 'meow') { P(hx + 5, hy + 8, 3, 2, '#7a1a2a'); P(hx + 6, hy + 9, 1, 1, C.N); } else { P(hx + 5, hy + 8, 1, 1, C.S); P(hx + 6, hy + 9, 1, 1, C.S); P(hx + 7, hy + 8, 1, 1, C.S); }  // ротик ω
  };
  const tail = (tx, ty, sw, up = 1) => { P(tx, ty, 3, 3, C.O); P(tx - 2, ty - 3 * up + sw, 3, 4, C.O); P(tx - 3, ty - 6 * up + sw * 2, 3, 4, C.O); P(tx - 3, ty - 6 * up + sw * 2, 3, 1, C.L); P(tx - 2, ty - 2 * up + sw, 3, 1, C.D); P(tx - 3, ty - 4 * up + sw * 2, 3, 1, C.D); };
  const paw = (px, py, h) => { P(px, py, 3, h, C.O); P(px, py + h - 1, 3, 1, C.W); P(px, py, 1, h - 1, C.L); };
  const blink = (t % 4.5) < .15 ? 'closed' : 'open';
  switch (pose) {
    case 'walk': case 'run': {
      const f = fr % 4, up = i => (f === 1 && (i === 0 || i === 3)) || (f === 3 && (i === 1 || i === 2)) ? 1 : 0, bb = f % 2;
      tail(7, 12 + bb, f < 2 ? 0 : 1, pose === 'run' ? .6 : 1);
      [9, 12, 17, 20].forEach((lx, i) => { const u = up(i); paw(lx + (u ? (i < 2 ? -1 : 1) : 0), 18 - u, 5 - u); });
      BUN(8, 11 + bb, 15, 9); P(11, 18 + bb, 9, 1, C.W); [12, 15, 18].forEach(sx => P(sx, 11 + bb, 1, 3, C.D));
      head(18, 4 + bb, blink); break;
    }
    case 'sit': case 'groom': case 'meow': case 'happy': {
      const sw = Math.round(Math.sin(t * 3)); P(5, 21, 9, 2, C.O); P(4 + sw, 19, 3, 3, C.O); P(4 + sw, 19, 3, 1, C.D);          // хвіст навколо лап
      BUN(9, 10, 12, 13); P(12, 13, 6, 9, C.W); [10, 11].forEach(sx => P(sx, 12, 1, 3, C.D));
      paw(12, 19, 4); paw(16, 19, 4);
      const g = pose === 'groom' && Math.floor(t * 3) % 2;
      head(10, 1, pose === 'groom' || pose === 'happy' ? 'happy' : pose === 'meow' ? 'meow' : blink);
      if (g) { P(19, 7, 3, 4, C.W); P(19, 7, 3, 1, C.L); }
      break;
    }
    case 'sleep': {
      const br = Math.floor(t * .8) % 2;
      P(4, 20, 18, 2, C.O); P(20, 19, 4, 3, C.O); P(22, 19, 2, 2, C.S);                                                     // хвіст обіймає
      BUN(5, 12 + br, 20, 10 - br); [9, 12, 15, 18].forEach(sx => P(sx, 12 + br, 1, 3, C.D)); P(8, 20, 12, 1, C.W);
      head(16, 10 + br, 'closed'); break;
    }
    case 'eat': {
      tail(7, 12, Math.floor(t * 3) % 2);
      [9, 12, 17, 20].forEach(lx => paw(lx, 18, 5));
      BUN(8, 11, 15, 9); [12, 15, 18].forEach(sx => P(sx, 11, 1, 3, C.D));
      head(18, 10 + (Math.floor(t * 4) % 2), 'happy'); break;
    }
    case 'stretch': {
      P(2, 6, 3, 5, C.O); P(3, 4, 2, 2, C.D);
      BUN(5, 9, 10, 8); BUN(13, 13, 10, 6); [5, 8].forEach(lx => paw(lx, 16, 6)); P(21, 19, 9, 3, C.O); P(27, 20, 3, 2, C.W);
      head(19, 9, 'closed'); break;
    }
    case 'pounce': {
      P(1, 7, 3, 3, C.O); P(3, 9, 4, 2, C.O); BUN(6, 7, 16, 8); [10, 13, 16].forEach(sx => P(sx, 7, 1, 3, C.D));
      P(3, 13, 5, 3, C.O); P(21, 12, 6, 3, C.O); P(25, 12, 2, 3, C.W); head(18, 1, 'open'); break;
    }
  }
  // темний теплий контур
  const id = x.getImageData(0, 0, CAT_W, CAT_H), d = id.data, op = new Uint8Array(CAT_W * CAT_H), o = C.OUT;
  for (let i = 0; i < op.length; i++) op[i] = d[i * 4 + 3] > 40 ? 1 : 0;
  for (let yy = 0; yy < CAT_H; yy++) for (let xx = 0; xx < CAT_W; xx++) { const i = yy * CAT_W + xx; if (op[i]) continue;
    if ((xx > 0 && op[i - 1]) || (xx < CAT_W - 1 && op[i + 1]) || (yy > 0 && op[i - CAT_W]) || (yy < CAT_H - 1 && op[i + CAT_W])) { d[i * 4] = o[0]; d[i * 4 + 1] = o[1]; d[i * 4 + 2] = o[2]; d[i * 4 + 3] = 255; } }
  x.putImageData(id, 0, 0); return cv;
}

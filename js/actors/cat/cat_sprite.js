/* ============================================================================
 * actors/cat/cat_sprite.js — МАЛЮВАННЯ РУДОГО КОТА (сітка 28×20 пікселів)
 * ----------------------------------------------------------------------------
 * drawCat(pose, frame, t, canvas) — кіт дивиться вправо (вліво дзеркалимо).
 * Пози: 'walk' (4 кадри), 'run', 'sit', 'groom', 'sleep', 'eat', 'stretch',
 *       'pounce', 'meow'. Темний контур додається автоматично, як у Nexi.
 * ========================================================================== */
const CAT_W = 28, CAT_H = 20;
const CATC = { O: '#f08a24', L: '#ffb25a', D: '#b8561a', S: '#c8641c', W: '#fff1e0', N: '#ff8aa8', E: '#7dff6a', OUT: '#2a1206' };
function drawCat(pose, fr, t, cv) {
  cv.width = CAT_W; cv.height = CAT_H; const x = cv.getContext('2d', { willReadFrequently: true }); x.clearRect(0, 0, CAT_W, CAT_H);
  const P = (a, b, w, h, col) => { x.fillStyle = col; x.fillRect(a, b, w, h); }, C = CATC;
  const head = (hx, hy, eyes) => {                         // голова 7×6 з вухами, мордочкою і носом
    P(hx, hy, 7, 6, C.O); P(hx, hy, 7, 1, C.L); P(hx, hy - 2, 2, 2, C.O); P(hx + 5, hy - 2, 2, 2, C.O); P(hx + 1, hy - 1, 1, 1, C.N); P(hx + 5, hy - 1, 1, 1, C.N);
    P(hx + 2, hy, 2, 1, C.S); P(hx + 3, hy + 3, 4, 3, C.W); P(hx + 6, hy + 3, 1, 1, C.N);
    if (eyes === 'open') { P(hx + 2, hy + 1, 1, 2, C.E); P(hx + 5, hy + 1, 1, 2, C.E); }
    else { P(hx + 1, hy + 2, 2, 1, C.D); P(hx + 4, hy + 2, 2, 1, C.D); }
    if (eyes === 'meow') { P(hx + 4, hy + 5, 2, 1, '#7a1a2a'); }
  };
  const blink = (t % 5) < .15 ? 'closed' : 'open';
  switch (pose) {
    case 'walk': case 'run': {
      const f = fr % 4, up = (i) => (f === 1 && (i === 0 || i === 3)) || (f === 3 && (i === 1 || i === 2)) ? 1 : 0;
      P(7, 9, 12, 5, C.O); P(7, 9, 12, 1, C.L); P(8, 14, 10, 1, C.W); [9, 12, 15].forEach(s => P(s, 9, 1, 2, C.S));
      [8, 10, 16, 18].forEach((lx, i) => { const u = up(i), dx = u ? (i < 2 ? -1 : 1) : 0; P(lx + dx, 14, 2, 4 - u, C.O); P(lx + dx, 18 - u, 2, 1, C.W); });
      const sw = f % 2; P(5, 9, 2, 1, C.O); P(4 - sw, 7, 2, 2, C.O); P(3 - sw, 4, 2, 3, C.O); P(3 - sw, 3, 2, 1, C.D);
      head(18, 5 + (f % 2), blink); break;
    }
    case 'sit': case 'groom': case 'meow': {
      P(9, 8, 9, 10, C.O); P(9, 8, 9, 1, C.L); P(14, 10, 4, 7, C.W); P(8, 13, 5, 6, C.O); P(10, 9, 1, 2, C.S);
      P(14, 17, 2, 2, C.W); P(16, 17, 2, 2, C.W);
      const sw = Math.floor(t * 2) % 2; P(3, 17, 7, 2, C.O); P(2, 15 + sw, 2, 2, C.O); P(2, 15 + sw, 1, 1, C.D);
      const g = pose === 'groom' && Math.floor(t * 3) % 2;
      head(13, 2, pose === 'groom' ? 'closed' : pose === 'meow' ? 'meow' : blink);
      if (g) P(19, 6, 2, 4, C.W);
      break;
    }
    case 'sleep': {
      const br = Math.floor(t * .8) % 2;
      P(6, 12 + br, 15, 7 - br, C.O); P(7, 12 + br, 13, 1, C.L); P(5, 14, 1, 4, C.O); P(21, 14, 1, 4, C.O);
      [9, 12, 15].forEach(s => P(s, 12 + br, 1, 2, C.S));
      P(16, 11 + br, 7, 6, C.O); P(17, 9 + br, 2, 2, C.O); P(21, 9 + br, 2, 2, C.O); P(18, 14 + br, 2, 1, C.D); P(21, 14 + br, 1, 1, C.D); P(20, 15 + br, 3, 2, C.W);
      P(4, 17, 15, 2, C.O); P(16, 17, 3, 2, C.D); break;
    }
    case 'eat': {
      P(6, 9, 12, 5, C.O); P(6, 9, 12, 1, C.L); [8, 11, 14].forEach(s => P(s, 9, 1, 2, C.S));
      [7, 9, 15, 17].forEach(lx => { P(lx, 14, 2, 4, C.O); P(lx, 18, 2, 1, C.W); });
      const sw = Math.floor(t * 3) % 2; P(4, 9, 2, 1, C.O); P(3, 7 - sw, 2, 2, C.O); P(2, 5 - sw, 2, 2, C.O);
      head(18, 11 + (Math.floor(t * 4) % 2), 'closed'); break;
    }
    case 'stretch': {
      P(5, 8, 8, 5, C.O); P(5, 8, 8, 1, C.L); P(12, 11, 8, 4, C.O); [6, 8].forEach(lx => { P(lx, 13, 2, 5, C.O); P(lx, 18, 2, 1, C.W); });
      P(18, 16, 7, 2, C.O); P(23, 16, 2, 2, C.W); P(3, 5, 2, 4, C.O); P(2, 3, 2, 2, C.O); head(19, 10, 'closed'); break;
    }
    case 'pounce': {
      P(6, 6, 14, 5, C.O); P(6, 6, 14, 1, C.L); P(3, 9, 4, 2, C.O); P(20, 9, 5, 2, C.O); P(23, 9, 2, 2, C.W); P(2, 10, 3, 2, C.O); P(1, 6, 2, 3, C.O);
      head(19, 2, 'open'); break;
    }
  }
  // темний контур
  const id = x.getImageData(0, 0, CAT_W, CAT_H), d = id.data, op = new Uint8Array(CAT_W * CAT_H);
  for (let i = 0; i < op.length; i++) op[i] = d[i * 4 + 3] > 40 ? 1 : 0;
  for (let yy = 0; yy < CAT_H; yy++) for (let xx = 0; xx < CAT_W; xx++) { const i = yy * CAT_W + xx; if (op[i]) continue;
    if ((xx > 0 && op[i - 1]) || (xx < CAT_W - 1 && op[i + 1]) || (yy > 0 && op[i - CAT_W]) || (yy < CAT_H - 1 && op[i + CAT_W])) { d[i * 4] = 42; d[i * 4 + 1] = 18; d[i * 4 + 2] = 6; d[i * 4 + 3] = 255; } }
  x.putImageData(id, 0, 0); return cv;
}

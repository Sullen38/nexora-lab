/* ============================================================================
 * actors/nexi/nft_card.js — КАРТКА NFT ПЕРСОНАЛЬНОГО NEXI (NX.nftCard)
 * ----------------------------------------------------------------------------
 * Піксель-арт 96×128, виводиться ×4 (384×512): небо в кольорі теми образу з зорями (розташування — від ключа образу, тож у
 * кожного Nexi своє), сяйво за Nexi, неоновий обрій і сітка підлоги, світний пад, сам Nexi (renderBot — той самий, що в
 * кімнаті), золота рамка «1/1» з кутиками й табличка внизу.
 * Написи — лише назви й коди, які не перекладаються (NEXORA, 1/1, NEXI #001, код NX-…, BASE): це майбутня КАРТИНКА NFT
 * (docs/NFT.md) — вона не залежить від мови сайту й не має імені власника (NFT можна перепродати). Шрифт — піксельний 3×5
 * міста (NX.ckit.glyph), тож картинку можна буде однаково намалювати й на сервері.
 *   NX.nftCard(look, { no }, canvas?) -> canvas (no — номер; немає — «#---»: ще не куплено)
 * ========================================================================== */
NX.nftCard = (() => {
  const W = 96, H = 128, S = 4, HOR = 90;                                              // розмір у пікселях арту, масштаб, лінія обрію
  const BAY = [0, 8, 2, 10, 12, 4, 14, 6, 3, 11, 1, 9, 15, 7, 13, 5];
  const rgbOf = h => [1, 3, 5].map(i => parseInt(h.slice(i, i + 2), 16));
  const mixRGB = (a, b, k) => a.map((v, i) => Math.round(v + (b[i] - v) * k));
  const css = a => `rgb(${a[0]},${a[1]},${a[2]})`;
  const art = document.createElement('canvas'); art.width = W; art.height = H;
  const bot = document.createElement('canvas');
  const K = () => { const k = NX.ckit; if (k && !k.FONT['#']) k.FONT['#'] = ['.X.X.', 'XXXXX', '.X.X.', 'XXXXX', '.X.X.']; return k; };   // «#» для номера

  function card(look, o = {}, cv) {
    cv = cv || document.createElement('canvas'); cv.width = W * S; cv.height = H * S;
    const x = art.getContext('2d'), ck = K(), th = THEMES[look.theme] || THEMES.standard, acc = rgbOf(th.acc), key = NX.owners.key(look);
    let seed = 7; for (const ch of key) seed = (Math.imul(seed, 31) + ch.charCodeAt(0)) >>> 0;
    const rnd = () => { seed = (Math.imul(seed, 1664525) + 1013904223) >>> 0; return seed / 4294967296; };
    // 1) небо: перелив зверху вниз (темно-синій -> колір теми -> ніч), 8-bit дизеринг Байєра; сяйво за Nexi кільцями дизерингу
    const C = [rgbOf('#0a0d36'), mixRGB(acc, rgbOf('#140a3c'), .66), rgbOf('#07051e')], im = x.createImageData(W, H), d = im.data;
    for (let y = 0; y < H; y++) for (let i = 0; i < W; i++) {
      const f = Math.min(1.999, y / HOR * 1.25), b = Math.floor(f), on = (f - b) * 16 > BAY[(y & 3) * 4 + (i & 3)], c3 = on ? C[Math.min(2, b + 1)] : C[b], q = (y * W + i) * 4;
      d[q] = c3[0]; d[q + 1] = c3[1]; d[q + 2] = c3[2]; d[q + 3] = 255;
      const r = Math.hypot(i - 48, (y - 64) * 1.1) / 36; if (r < 1 && (1 - r) * (1 - r) * 18 > BAY[(y & 3) * 4 + (i & 3)]) { d[q] = (d[q] + acc[0]) >> 1; d[q + 1] = (d[q + 1] + acc[1]) >> 1; d[q + 2] = (d[q + 2] + acc[2]) >> 1; }
    }
    x.putImageData(im, 0, 0);
    for (let s = 0; s < 28; s++) {                                                     // зорі (свої в кожного образу)
      const sx = 5 + rnd() * 86 | 0, sy = 16 + rnd() * 58 | 0, b = rnd(); x.fillStyle = b > .82 ? '#ffffff' : b > .5 ? '#bfe8ff' : '#6a70c8'; x.fillRect(sx, sy, 1, 1);
      if (b > .94) { x.fillStyle = 'rgba(191,232,255,.55)'; x.fillRect(sx - 1, sy, 3, 1); x.fillRect(sx, sy - 1, 1, 3); }
    }
    // 2) підлога: неоновий обрій і сітка в перспективі (сходиться до середини)
    x.fillStyle = '#0a0624'; x.fillRect(3, HOR, W - 6, H - HOR - 3);
    for (let g = -7; g <= 7; g++) for (let y = HOR + 1; y < H - 3; y++) { const t = (y - HOR) / (H - HOR), gx = Math.round(48 + g * (3 + t * 14)); if (gx > 3 && gx < W - 4) { x.fillStyle = `rgba(59,232,255,${.16 + t * .3})`; x.fillRect(gx, y, 1, 1); } }
    [3, 8, 15, 24].forEach(dy => { x.fillStyle = 'rgba(59,232,255,.3)'; x.fillRect(3, HOR + dy, W - 6, 1); });
    x.fillStyle = '#ff4fd8'; x.fillRect(3, HOR, W - 6, 1); x.fillStyle = 'rgba(255,170,240,.45)'; x.fillRect(3, HOR - 1, W - 6, 1);
    // 3) пад: світне кільце під ногами
    for (let i = -17; i <= 17; i++) for (let j = -4; j <= 4; j++) { const e = (i * i) / 289 + (j * j) / 16; if (e > 1) continue; x.fillStyle = e > .72 ? '#7af4ff' : e > .5 ? 'rgba(59,232,255,.55)' : 'rgba(150,240,255,.22)'; x.fillRect(48 + i, HOR + 1 + j, 1, 1); }
    // 4) сам Nexi — стоїть на паді (ряд FOOT спрайта — на обрії)
    renderBot(Object.assign({}, look, { face: 'standard' }), poseFor('stand', .5, false), .5, bot);
    x.drawImage(bot, 24, HOR + 1 - FOOT);
    // 5) рамка: темний край, золотий неон «1/1», кант кольору теми, кутики
    const frame = (n, col) => { x.fillStyle = col; x.fillRect(n, n, W - 2 * n, 1); x.fillRect(n, H - 1 - n, W - 2 * n, 1); x.fillRect(n, n, 1, H - 2 * n); x.fillRect(W - 1 - n, n, 1, H - 2 * n); };
    frame(0, '#05030f'); frame(1, '#ffc94d'); frame(2, '#8a5a10'); frame(3, css(mixRGB(acc, [5, 3, 15], .35)));
    [[5, 5, 1, 1], [W - 6, 5, -1, 1], [5, H - 6, 1, -1], [W - 6, H - 6, -1, -1]].forEach(([cx, cy, sx, sy]) => { x.fillStyle = '#ffe6a0'; for (let k = 0; k < 5; k++) { x.fillRect(cx + sx * k, cy, 1, 1); x.fillRect(cx, cy + sy * k, 1, 1); } });
    // 6) шапка: NEXORA ліворуч, 1/1 праворуч; риска кольору теми
    ck.glyph(x, 'NEXORA', 8, 7, 1, '#7af4ff'); ck.glyph(x, '1/1', W - 8 - ck.glyphW('1/1'), 7, 1, '#ffc94d');
    for (let i = 8; i < W - 8; i += 2) { x.fillStyle = css(acc); x.fillRect(i, 14, 1, 1); }
    // 7) табличка: NEXI #001 (або #--- — ще не куплено), код і мережа BASE
    x.fillStyle = 'rgba(5,3,20,.88)'; x.fillRect(7, 104, W - 14, 18); x.fillStyle = css(acc); x.fillRect(7, 104, W - 14, 1); x.fillStyle = 'rgba(255,201,77,.6)'; x.fillRect(7, 121, W - 14, 1);
    const title = 'NEXI ' + (o.no ? '#' + String(o.no).padStart(3, '0') : '#---');
    ck.glyph(x, title, Math.round((W - ck.glyphW(title)) / 2), 107, 1, '#ffffff');
    const code = NX.owners.code(look); ck.glyph(x, code, 10, 114, 1, '#9aa6e0');
    const bw = ck.glyphW('BASE') + 4; x.fillStyle = '#0052ff'; x.fillRect(W - 10 - bw, 113, bw, 7); ck.glyph(x, 'BASE', W - 8 - bw, 114, 1, '#ffffff');
    // ×4 у полотно картки (без розмиття)
    const c = cv.getContext('2d'); c.imageSmoothingEnabled = false; c.clearRect(0, 0, cv.width, cv.height); c.drawImage(art, 0, 0, W * S, H * S);
    return cv;
  }
  return card;
})();

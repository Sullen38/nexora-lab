/* ============================================================================
 * actors/nexi/nft_card.js — КАРТКА NFT ПЕРСОНАЛЬНОГО NEXI (NX.nftCard) — ЖИВА
 * ----------------------------------------------------------------------------
 * Піксель-арт 96×128, виводиться ×4 (384×512): небо в кольорі теми образу з зорями (розташування — від ключа образу, тож у
 * кожного Nexi своє), сяйво за Nexi, неоновий обрій і сітка підлоги, світний пад, сам Nexi (renderBot — той самий, що в
 * кімнаті), золота рамка «1/1» з кутиками й табличка внизу.
 * ЖИВА (власник, 03.11: «картка теж має бути анімованою, живою»): Nexi дихає, кліпає й ворушить антеною; зорі мерехтять, раз
 * за цикл — падуча зоря; сяйво за Nexi «дихає»; сітка підлоги біжить до глядача; обрій пульсує; від пада розходиться кільце;
 * золотий відблиск оббігає рамку (на кутиках — іскра); по табличці з номером проходить блиск. Цикл — LOOP = 4 с, і все в ньому
 * кратне циклу (поза «стоїть» і кліпання Nexi — теж 4 с), тож кадри зациклюються без шва: це й майбутня анімація NFT
 * (docs/NFT.md, крок 4). Випадковості немає — кадр залежить лише від образу, номера й часу.
 * НАЗВИ СКІНА Й РЕЛІКВІЇ (власник, 06.11; крок С2): на табличці — назва скіна (готовий — його, своє поєднання — назва кольорової
 * теми) і під нею «+ назва реліквії», кожна своїм стилем напису (card_names.js: цукерковий, громовий, лазерний, золотий, лід…),
 * лише англійською; назви можна прибрати за бажанням (o.names === false — табличка як була: лише NEXI #001). Код NX-… тоді в шапці.
 * Написи — лише назви й коди, які не перекладаються (NEXORA, 1/1, NEXI #001, код NX-…, BASE, назви): це майбутня КАРТИНКА NFT —
 * вона не залежить від мови сайту й не має імені власника (NFT можна перепродати). Шрифт — піксельний 3×5 міста
 * (NX.ckit.glyph), тож картку можна однаково намалювати й на сервері.
 *   NX.nftCard(look, { no, names }, canvas?, t?) -> canvas (no — номер; немає — «#---»; names — чи писати назви (так, якщо не false); t — секунди, за замовчуванням .5)
 *   NX.nftCard.play(look, { no }, canvas) / stop() — жива картка в аркуші (ui/shop.js): ~12 кадрів/с, поки аркуш відкритий;
 *     «менше руху» в системі (prefers-reduced-motion) — один нерухомий кадр
 * ========================================================================== */
NX.nftCard = (() => {
  const W = 96, H = 128, S = 4, HOR0 = 90, LOOP = 4, TAU = Math.PI * 2;                 // розмір у пікселях арту, масштаб, обрій, цикл (с)
  const BAY = [0, 8, 2, 10, 12, 4, 14, 6, 3, 11, 1, 9, 15, 7, 13, 5];
  const rgbOf = h => [1, 3, 5].map(i => parseInt(h.slice(i, i + 2), 16));
  const mixRGB = (a, b, k) => a.map((v, i) => Math.round(v + (b[i] - v) * k));
  const css = a => `rgb(${a[0]},${a[1]},${a[2]})`;
  const art = document.createElement('canvas'); art.width = W; art.height = H;
  const bot = document.createElement('canvas');
  const K = () => { const k = NX.ckit; if (k && !k.FONT['#']) k.FONT['#'] = ['.X.X.', 'XXXXX', '.X.X.', 'XXXXX', '.X.X.']; return k; };   // «#» для номера
  const wave = (u, n, ph = 0) => .5 + .5 * Math.sin(TAU * (u * n + ph));                // 0..1, n — разів за цикл (ціле — без шва)

  // нерухоме для образу (рахується раз): небо з дизерингом, зорі, колір теми
  let memo = null;
  function prep(look) {
    const key = NX.owners.key(look); if (memo && memo.key === key) return memo;
    const th = THEMES[look.theme] || THEMES.standard, acc = rgbOf(th.acc);
    let seed = 7; for (const ch of key) seed = (Math.imul(seed, 31) + ch.charCodeAt(0)) >>> 0;
    const rnd = () => { seed = (Math.imul(seed, 1664525) + 1013904223) >>> 0; return seed / 4294967296; };
    // небо: перелив зверху вниз (темно-синій -> колір теми -> ніч), 8-bit дизеринг Байєра
    const C = [rgbOf('#0a0d36'), mixRGB(acc, rgbOf('#140a3c'), .66), rgbOf('#07051e')], sky = new Uint8ClampedArray(W * H * 4);
    for (let y = 0; y < H; y++) for (let i = 0; i < W; i++) {
      const f = Math.min(1.999, y / HOR0 * 1.25), b = Math.floor(f), on = (f - b) * 16 > BAY[(y & 3) * 4 + (i & 3)], c3 = on ? C[Math.min(2, b + 1)] : C[b], q = (y * W + i) * 4;
      sky[q] = c3[0]; sky[q + 1] = c3[1]; sky[q + 2] = c3[2]; sky[q + 3] = 255;
    }
    // зорі (свої в кожного образу): місце, яскравість, фаза й швидкість мерехтіння (ціле — разів за цикл)
    const stars = []; for (let s = 0; s < 28; s++) stars.push({ x: 5 + rnd() * 86 | 0, y: 16 + rnd() * 58 | 0, b: rnd(), ph: rnd(), k: 1 + (rnd() * 3 | 0) });
    return (memo = { key, acc, sky, stars });
  }

  function card(look, o = {}, cv, t = .5) {
    cv = cv || document.createElement('canvas'); if (cv.width !== W * S) { cv.width = W * S; cv.height = H * S; }
    const m = prep(look), x = art.getContext('2d'), ck = K(), acc = m.acc, tl = ((t % LOOP) + LOOP) % LOOP, u = tl / LOOP;   // u — фаза циклу 0..1
    const NM = o.names === false ? null : NX.cardNames.names(look), lines = NM ? (NM.relic ? 2 : 1) : 0, HOR = lines === 2 ? 86 : HOR0;   // назви на табличці: з двома — обрій вище
    // 1) небо + сяйво за Nexi, що «дихає» (кільця дизерингу кольору теми)
    const im = x.createImageData(W, H), d = im.data; d.set(m.sky);
    const R = 36 + 3 * Math.sin(TAU * u * 2), G = 15 + 5 * wave(u, 2, .25);
    for (let y = 22; y < 106; y++) for (let i = 8; i < 88; i++) {
      const r = Math.hypot(i - 48, (y - 64) * 1.1) / R; if (r >= 1 || (1 - r) * (1 - r) * G <= BAY[(y & 3) * 4 + (i & 3)]) continue;
      const q = (y * W + i) * 4; d[q] = (d[q] + acc[0]) >> 1; d[q + 1] = (d[q + 1] + acc[1]) >> 1; d[q + 2] = (d[q + 2] + acc[2]) >> 1;
    }
    x.putImageData(im, 0, 0);
    // 2) зорі мерехтять (три рівні яскравості — піксель-арт), найяскравіші — з променями
    m.stars.forEach(s => { const v = s.b * (.45 + .55 * wave(u, s.k, s.ph)); if (v < .18) return;
      x.fillStyle = v > .74 ? '#ffffff' : v > .42 ? '#bfe8ff' : '#6a70c8'; x.fillRect(s.x, s.y, 1, 1);
      if (s.b > .9 && v > .8) { x.fillStyle = 'rgba(191,232,255,.55)'; x.fillRect(s.x - 1, s.y, 3, 1); x.fillRect(s.x, s.y - 1, 1, 3); } });
    if (u > .56 && u < .74) {                                                          // падуча зоря — раз за цикл
      const q = (u - .56) / .18, hx = Math.round(84 - q * 58), hy = Math.round(18 + q * 16);
      for (let k = 0; k < 6; k++) { x.fillStyle = k ? `rgba(191,232,255,${.75 - k * .12})` : '#ffffff'; x.fillRect(hx + k * 2, hy - Math.round(k * .55), 2, 1); }
    }
    // 3) підлога: сітка біжить до глядача (лінії — за перспективою, одна «клітинка» за цикл), обрій пульсує
    x.fillStyle = '#0a0624'; x.fillRect(3, HOR, W - 6, H - HOR - 3);
    for (let g = -7; g <= 7; g++) for (let y = HOR + 1; y < H - 3; y++) { const k = (y - HOR) / (H - HOR), gx = Math.round(48 + g * (3 + k * 14)); if (gx > 3 && gx < W - 4) { x.fillStyle = `rgba(59,232,255,${.16 + k * .3})`; x.fillRect(gx, y, 1, 1); } }
    for (let i = 0; i < 5; i++) { const s = (i + u) / 5, y = Math.round(HOR + 1 + (H - 5 - HOR) * s * s); x.fillStyle = `rgba(59,232,255,${(.14 + .3 * s).toFixed(3)})`; x.fillRect(3, y, W - 6, 1); }
    const hp = wave(u, 2); x.fillStyle = '#ff4fd8'; x.fillRect(3, HOR, W - 6, 1);
    x.fillStyle = `rgba(255,170,240,${(.3 + .35 * hp).toFixed(3)})`; x.fillRect(3, HOR - 1, W - 6, 1);
    if (hp > .6) { x.fillStyle = `rgba(255,120,230,${((hp - .6) * .45).toFixed(3)})`; x.fillRect(3, HOR - 2, W - 6, 1); }
    // 4) пад: світне кільце під ногами й хвиля, що розходиться від нього (двічі за цикл)
    for (let i = -17; i <= 17; i++) for (let j = -4; j <= 4; j++) { const e = (i * i) / 289 + (j * j) / 16; if (e > 1) continue; x.fillStyle = e > .72 ? '#7af4ff' : e > .5 ? 'rgba(59,232,255,.55)' : 'rgba(150,240,255,.22)'; x.fillRect(48 + i, HOR + 1 + j, 1, 1); }
    const pp = (u * 2) % 1, rx = 18 + pp * 11, ry = 4.4 + pp * 2.6; x.fillStyle = `rgba(122,244,255,${((1 - pp) * .7).toFixed(3)})`;
    for (let a = 0; a < 64; a++) { const an = a / 64 * TAU; x.fillRect(Math.round(48 + Math.cos(an) * rx), Math.round(HOR + 1 + Math.sin(an) * ry), 1, 1); }
    // 5) сам Nexi: дихає (поза «стоїть»), кліпає посередині циклу, антена погойдується; час Nexi — неперервний (крила, плащ,
    //    реліквії мають свої ритми — у живій картці без стрибка; поза й кліпання — кратні циклу)
    const tn = t + 2, po = poseFor('stand', tn, false); po.antX = Math.sin(TAU * u) * 1.4; po.antY = 0;
    renderBot(Object.assign({}, look, { face: 'standard' }), po, tn, bot);
    x.drawImage(bot, 24, HOR + 1 - FOOT);
    // 6) рамка: темний край, золотий неон «1/1», кант кольору теми, кутики
    const frame = (n, col) => { x.fillStyle = col; x.fillRect(n, n, W - 2 * n, 1); x.fillRect(n, H - 1 - n, W - 2 * n, 1); x.fillRect(n, n, 1, H - 2 * n); x.fillRect(W - 1 - n, n, 1, H - 2 * n); };
    frame(0, '#05030f'); frame(1, '#ffc94d'); frame(2, '#8a5a10'); frame(3, css(mixRGB(acc, [5, 3, 15], .35)));
    const CN = [[5, 5, 1, 1], [W - 6, 5, -1, 1], [5, H - 6, 1, -1], [W - 6, H - 6, -1, -1]];
    CN.forEach(([cx, cy, sx, sy]) => { x.fillStyle = '#ffe6a0'; for (let k = 0; k < 5; k++) { x.fillRect(cx + sx * k, cy, 1, 1); x.fillRect(cx, cy + sy * k, 1, 1); } });
    // золотий відблиск оббігає рамку (раз за цикл); біля кутика — іскра на ньому
    const PW = W - 3, PH = H - 3, P = 2 * (PW + PH), at = p => { p = ((p % P) + P) % P;
      return p < PW ? [1 + p, 1] : p < PW + PH ? [W - 2, 1 + p - PW] : p < 2 * PW + PH ? [W - 2 - (p - PW - PH), H - 2] : [1, H - 2 - (p - 2 * PW - PH)]; };
    const gp = u * P; for (let k = 0; k < 9; k++) { const [gx, gy] = at(gp - k); x.fillStyle = k < 2 ? '#ffffff' : k < 5 ? '#fff3c4' : 'rgba(255,230,160,.6)'; x.fillRect(gx, gy, 1, 1); }
    const [hx2, hy2] = at(gp), near = CN.map(([cx, cy]) => Math.hypot(cx - hx2, cy - hy2)).reduce((a, b) => Math.min(a, b), 99);
    if (near < 7) { const c = CN.find(([cx, cy]) => Math.hypot(cx - hx2, cy - hy2) === near), k = 1 - near / 7; x.fillStyle = `rgba(255,255,255,${(.5 + .5 * k).toFixed(3)})`;
      x.fillRect(c[0] - 2, c[1], 5, 1); x.fillRect(c[0], c[1] - 2, 1, 5); if (k > .5) { x.fillRect(c[0] - 3, c[1], 7, 1); x.fillRect(c[0], c[1] - 3, 1, 7); } }
    // 7) шапка: NEXORA ліворуч, код NX-… посередині, 1/1 праворуч (іноді спалахує); риска кольору теми
    const code = NX.owners.code(look);
    ck.glyph(x, 'NEXORA', 8, 7, 1, '#7af4ff'); ck.glyph(x, code, 36, 7, 1, '#9aa6e0');
    ck.glyph(x, '1/1', W - 8 - ck.glyphW('1/1'), 7, 1, u > .3 && u < .36 ? '#fff3c4' : '#ffc94d');
    for (let i = 8; i < W - 8; i += 2) { x.fillStyle = css(acc); x.fillRect(i, 14, 1, 1); }
    // 8) табличка: назви скіна й реліквії (кожна своїм стилем; якщо не прибрано), NEXI #001 (або #--- — ще не куплено) і мережа BASE;
    //    по табличці проходить блиск
    const top = lines === 2 ? 94 : lines === 1 ? 102 : 104;
    x.fillStyle = 'rgba(5,3,20,.88)'; x.fillRect(7, top, W - 14, 122 - top); x.fillStyle = css(acc); x.fillRect(7, top, W - 14, 1); x.fillStyle = 'rgba(255,201,77,.6)'; x.fillRect(7, 121, W - 14, 1);
    const title = 'NEXI ' + (o.no ? '#' + String(o.no).padStart(3, '0') : '#---');
    if (NM) {
      const CN2 = NX.cardNames, t1 = NM.skin.t; CN2.draw(x, t1, Math.round((W - CN2.width(t1)) / 2), top + 3, NM.skin.st, u);
      if (NM.relic) { let t2 = '+ ' + NM.relic.t; if (CN2.width(t2) > W - 16) t2 = NM.relic.t; CN2.draw(x, t2, Math.round((W - CN2.width(t2)) / 2), top + 11, NM.relic.st, u); }
      ck.glyph(x, title, 10, 115, 1, '#ffffff');
    } else ck.glyph(x, title, Math.round((W - ck.glyphW(title)) / 2), 107, 1, '#ffffff');
    const bw = ck.glyphW('BASE') + 4; x.fillStyle = '#0052ff'; x.fillRect(W - 10 - bw, 113, bw, 7); ck.glyph(x, 'BASE', W - 8 - bw, 114, 1, '#ffffff');
    if (u > .06 && u < .3) { const sx = Math.round(-4 + (u - .06) / .24 * (W + 8)); x.fillStyle = 'rgba(255,255,255,.28)';
      for (let y = top + 1; y < 121; y++) { const xx = sx + Math.round((121 - y) * .5); if (xx >= 7 && xx < W - 8) x.fillRect(xx, y, 2, 1); } }
    // ×4 у полотно картки (без розмиття)
    const c = cv.getContext('2d'); c.imageSmoothingEnabled = false; c.clearRect(0, 0, cv.width, cv.height); c.drawImage(art, 0, 0, W * S, H * S);
    return cv;
  }
  card.LOOP = LOOP;
  // жива картка (аркуш ui/shop.js): ~12 кадрів/с, поки відкрита; «менше руху» — нерухомий кадр
  let run = null, raf = 0;
  const still = () => !!(window.matchMedia && matchMedia('(prefers-reduced-motion: reduce)').matches);
  const tick = now => { raf = 0; if (!run) return; if (now - run.last >= 83) { run.last = now; card(run.look, run.o, run.cv, (now - run.t0) / 1000); } raf = requestAnimationFrame(tick); };
  card.play = (look, o, cv) => { card(look, o, cv, .5); if (still()) { card.stop(); return; } run = { look, o, cv, t0: performance.now() - 500, last: performance.now() }; if (!raf) raf = requestAnimationFrame(tick); };
  card.stop = () => { run = null; if (raf) cancelAnimationFrame(raf); raf = 0; };
  return card;
})();

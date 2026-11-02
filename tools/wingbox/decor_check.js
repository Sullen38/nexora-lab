// tools/wingbox/decor_check.js — ДЕКОР НЕ ЗАХОДИТЬ НА ЗОНИ: перевірка піксель у піксель на справжній сцені (dist/)
//   node tools/wingbox/decor_check.js [префікс]   ->  друкує перетин (пікселі) і де; <префікс>_decor.png — карта (зелене —
//   декор, червоне — зони й живе, жовте — перетин з полем)
// Як: 1) декор = непрозорі пікселі шару «біля стіни» (arc_scene.js: предмети 'up' з tools/wingbox/decor.py), у одиницях кімнати;
//     2) його прибираємо зі злиття, ховаємо Nexi, кота й гостей і ~12 с збираємо найменше й найбільше значення кожного пікселя
//        кадру — зони з живими частинами (маніпулятор, маячок, голо-панелі, руни порталу); 3) «порожня» кімната (лише стіни
//        крил, рама, місто): піксель, що хоч в одному кадрі відрізнявся від неї, — зайнятий; 4) перетин декору із зайнятим,
//        розширеним на MARGIN од. Вікно (місто живе) не рахуємо. Камера комп'ютера (уся кімната) — геометрія та сама, що й на телефоні.
// Перед запуском: python3 tools/build.py.
const { chromium } = require('playwright'); const fs = require('fs'), path = require('path');
const HTML = 'file://' + path.resolve(__dirname, '../../dist/nexora-lab.html'), MARGIN = 3;
(async () => {
  const pre = process.argv[2] || '/tmp/dc';
  const b = await chromium.launch(); const ctx = await b.newContext({ viewport: { width: 1600, height: 900 }, deviceScaleFactor: 2 });
  const p = await ctx.newPage(); const errs = []; p.on('pageerror', e => errs.push(e.message));
  await p.goto(HTML + '#lang-uk'); await p.waitForTimeout(1500);
  await p.waitForFunction(() => NX.arc && NX.arc.built && NX.arc.built.left && NX.arc.built.right && (!NX.boot || NX.boot.done), null, { timeout: 90000 }); await p.waitForTimeout(800);
  // 1) маска декору (S px на одиницю кімнати) і прибрати шар «біля стіни» зі злиття
  const n = await p.evaluate(() => {
    const S = 2, X0 = NX.cfg.ROOM_X0, Y0 = -20, W = Math.round((NX.cfg.ROOM_X1 - X0) * S), H = 420 * S, cv = document.createElement('canvas'); cv.width = W; cv.height = H;
    const c = cv.getContext('2d'); c.setTransform(S, 0, 0, S, -X0 * S, -Y0 * S); let n = 0;
    for (const sd of ['left', 'right']) { const B = NX.arc.built[sd]; if (B.layers.length === 5) { const l = B.layers[1]; c.drawImage(l.cv, l.x0, l.y0, l.x1 - l.x0, l.y1 - l.y0); B.layers.splice(1, 1); B.comp = null; n++; } }
    const d = c.getImageData(0, 0, W, H).data, m = new Uint8Array(W * H); for (let k = 0; k < m.length; k++) m[k] = d[k * 4 + 3] > 60 ? 1 : 0;
    window.DC = { S, X0, Y0, W, H, m }; NX.nexi.layer = () => null; NX.cat.layer = () => null; if (NX.guests) NX.guests.spawn = () => {};
    return n;
  });
  if (!n) { console.log('декору немає (шар «біля стіни» не знайдено)'); await b.close(); return; }
  await p.waitForTimeout(1200);
  // 2) найменше / найбільше значення кожного пікселя за ~12 с (зони й живе без декору)
  for (let k = 0; k < 15; k++) {
    await p.evaluate(() => { const cv = NX.loop.canvas, d = cv.getContext('2d').getImageData(0, 0, cv.width, cv.height).data;
      if (!DC.mn) { DC.mn = new Uint8Array(d); DC.mx = new Uint8Array(d); return; }
      const mn = DC.mn, mx = DC.mx; for (let i = 0; i < d.length; i++) { const v = d[i]; if (v < mn[i]) mn[i] = v; else if (v > mx[i]) mx[i] = v; } });
    await p.waitForTimeout(800);
  }
  // 3) порожня кімната -> зайняте; 4) перетин з декором, карта
  await p.evaluate(() => {
    const keep = new Set(['arcLeft', 'arcRight', 'windowFrame', 'cityWindow']);
    for (const [id, o] of Object.entries(NX.objects)) if (!keep.has(id)) { if (o.drawBack) o.drawBack = () => {}; if (o.layers) o.layers = () => []; }
    for (const sd of ['left', 'right']) { const B = NX.arc.built[sd]; B.layers = [B.layers[0]]; B.live = []; B.comp = null; }
    NX.arc.live = null;
  });
  await p.waitForTimeout(1500);
  const res = await p.evaluate(MARGIN => {
    const cv = NX.loop.canvas, e = cv.getContext('2d').getImageData(0, 0, cv.width, cv.height).data, CW = cv.width, CH = cv.height, K = NX.cam.k * NX.loop.dpr, { S, X0, Y0, W, H, m, mn, mx } = DC, WIN = NX.cfg.WIN;
    const occ = new Uint8Array(W * H);
    for (let j = 0; j < H; j++) for (let i = 0; i < W; i++) {
      const X = X0 + (i + .5) / S, Y = Y0 + (j + .5) / S; if (X > WIN.L - 2 && X < WIN.R + 2) continue;                  // вікно: місто живе — не рахуємо
      const ci = Math.round((X - NX.cam.x) * K), cj = Math.round((Y + NX.cam.top) * K); if (ci < 0 || cj < 0 || ci >= CW || cj >= CH) continue;
      const q = (cj * CW + ci) * 4; let o = 0; for (let c = 0; c < 3; c++) if (mx[q + c] - e[q + c] > 22 || e[q + c] - mn[q + c] > 22) o = 1; occ[j * W + i] = o;
    }
    const R = Math.round(MARGIN * S), grow = new Uint8Array(W * H);                                                   // поле: зайняте, розширене на MARGIN
    for (let j = 0; j < H; j++) for (let i = 0; i < W; i++) if (occ[j * W + i]) for (let dj = -R; dj <= R; dj++) { const jj = j + dj; if (jj < 0 || jj >= H) continue; for (let di = -R; di <= R; di++) { const ii = i + di; if (ii >= 0 && ii < W) grow[jj * W + ii] = 1; } }
    let hit = 0, bx = [1e9, -1e9, 1e9, -1e9]; const out = document.createElement('canvas'); out.width = W; out.height = H; const oc = out.getContext('2d'), im = oc.createImageData(W, H), od = im.data;
    for (let k = 0; k < W * H; k++) {
      const i = k % W, j = (k - i) / W, X = X0 + (i + .5) / S, Y = Y0 + (j + .5) / S, q = k * 4; let c = [10, 8, 26];
      if (occ[k]) c = [150, 30, 50]; if (m[k]) c = [60, 230, 120];
      if (m[k] && grow[k] && Y < 330) { hit++; c = [255, 230, 40]; bx = [Math.min(bx[0], X), Math.max(bx[1], X), Math.min(bx[2], Y), Math.max(bx[3], Y)]; }
      od[q] = c[0]; od[q + 1] = c[1]; od[q + 2] = c[2]; od[q + 3] = 255;
    }
    oc.putImageData(im, 0, 0); return { hit, bx: bx.map(v => Math.round(v)), png: out.toDataURL('image/png') };
  }, MARGIN);
  fs.writeFileSync(pre + '_decor.png', Buffer.from(res.png.split(',')[1], 'base64'));
  console.log(`DECOR OVER ZONES (поле ${MARGIN} од.): ` + (res.hit ? `${res.hit} пікс., x ${res.bx[0]}..${res.bx[1]}, y ${res.bx[2]}..${res.bx[3]}` : 'none') + ` · карта ${pre}_decor.png`);
  console.log(errs.join(' ; ') || 'no errors'); await b.close();
})();

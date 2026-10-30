/* ============================================================================
 * tools/same.js — ЗНІМКИ ДО Й ПІСЛЯ, ПІКСЕЛЬ У ПІКСЕЛЬ («вигляд не змінився» — для чистки й оптимізації)
 * ----------------------------------------------------------------------------
 *   node tools/same.js [ref] [--modes desk,ph] [--at 0,60,240,600] [--out /tmp/same] [--a тека] [--b тека] [--hash lang-pl]
 * Порівнює робочу копію (b) з комітом ref (a; за замовчуванням HEAD — тобто незакомічені зміни). Обидві версії віддає
 * локальний сервер (як Vercel: index.html + окремі js). Сцена жива, тож щоб кадри були порівнянні, вона детермінована:
 * годинник сторінки підмінений (Playwright clock: Date, performance.now, setTimeout, requestAnimationFrame) і йде кроками
 * по 16 мс, Math.random — з фіксованим зерном, шрифти Google вимкнено (обидві версії — запасний шрифт).
 * Кадри (canvas #world): комп'ютер 1600×900 — після заставки й через 60 / 240 / 600 кадрів (--at); телефон 390×844 —
 * ті самі моменти + камера на доку й на кожній зоні. Ще порівнюється текст інтерфейсу (HTML поверх canvas).
 * Друкує, де є різниця: скільки пікселів і найбільша різниця каналу; картинки різниці — у --out. Код виходу 1 — є різниця.
 * Самоперевірка: без змін у робочій копії (ref HEAD) має бути «однаково» скрізь.
 * ========================================================================== */
const { chromium } = require('playwright');
const http = require('http'), fs = require('fs'), path = require('path'), os = require('os'), { execSync } = require('child_process');
const ROOT = path.resolve(__dirname, '..');
const args = process.argv.slice(2), opt = {}, rest = [];
for (let i = 0; i < args.length; i++) if (args[i].startsWith('--')) opt[args[i].slice(2)] = args[++i]; else rest.push(args[i]);
const REF = rest[0] || 'HEAD', MODES = (opt.modes || 'desk,ph').split(','), AT = (opt.at || '0,60,240,600').split(',').map(Number);
const OUT = opt.out || path.join(os.tmpdir(), 'same'), HASH = opt.hash || 'lang-uk';
const MIME = { '.html': 'text/html; charset=utf-8', '.js': 'text/javascript; charset=utf-8', '.css': 'text/css', '.webp': 'image/webp', '.png': 'image/png', '.json': 'application/json' };
function serve(dir) {
  return new Promise(res => { const s = http.createServer((q, r) => {
    let f = decodeURIComponent(q.url.split('?')[0].split('#')[0]); if (f === '/') f = '/index.html';
    fs.readFile(path.join(dir, f), (e, d) => { if (e) { r.writeHead(404); r.end(); return; } r.writeHead(200, { 'content-type': MIME[path.extname(f)] || 'application/octet-stream' }); r.end(d); });
  }); s.listen(0, '127.0.0.1', () => res(s)); });
}
/** Версія ref у тимчасовій теці (git archive). */
function checkout(ref) {
  const sha = execSync(`git -C "${ROOT}" rev-parse --short ${ref}`).toString().trim(), dir = path.join(os.tmpdir(), 'nexora-' + sha);
  if (!fs.existsSync(path.join(dir, 'index.html'))) { fs.mkdirSync(dir, { recursive: true }); execSync(`git -C "${ROOT}" archive --format=tar ${sha} | tar -x -C "${dir}"`); }
  return { dir, name: sha };
}
const DEV = { desk: { viewport: { width: 1600, height: 900 }, deviceScaleFactor: 1 }, ph: { viewport: { width: 390, height: 844 }, deviceScaleFactor: 3, isMobile: true, hasTouch: true } };

/** Прогнати версію: заставка -> кадри AT (+ зони на телефоні). Повертає [{key, png, text}]. */
async function shoot(browser, url, mode) {
  const ctx = await browser.newContext(DEV[mode]); await ctx.route(/fonts\.(googleapis|gstatic)\.com/, r => r.abort());
  await ctx.addInitScript(() => { let s = 0x9e3779b9; Math.random = () => { s |= 0; s = s + 0x6D2B79F5 | 0; let t = Math.imul(s ^ s >>> 15, 1 | s); t = t + Math.imul(t ^ t >>> 7, 61 | t) ^ t; return ((t ^ t >>> 14) >>> 0) / 4294967296; }; });
  const p = await ctx.newPage(), errs = []; p.on('pageerror', e => errs.push(e.message));
  await p.clock.install({ time: new Date('2026-01-01T12:00:00Z') }); await p.clock.pauseAt(new Date('2026-01-01T12:00:01Z'));
  await p.goto(url + '#' + HASH);
  for (let i = 0; i < 20000; i++) { if (await p.evaluate(() => !!(window.NX && NX.boot && NX.boot.done))) break; await p.clock.runFor(16); if (i === 19999) throw new Error('заставка не завершилась: ' + url); }
  const out = [], grab = async key => out.push({ key, png: await p.evaluate(() => document.getElementById('world').toDataURL('image/png')), text: await p.evaluate(() => document.body.innerText) });
  let fr = 0;
  for (const n of AT) { if (n > fr) { await p.clock.runFor(16 * (n - fr)); fr = n; } await grab(mode + '@' + n); }
  if (mode === 'ph') {
    const pos = await p.evaluate(() => { const vw = NX.cam.viewW, max = Math.max(0, NX.cfg.ROOM_W - vw), at = cx => Math.max(0, Math.min(max, cx - vw / 2)), zb = {};
      for (const w of Object.values(NX.arcLayout || {})) if (w && w.zoneBox) Object.assign(zb, w.zoneBox);
      return [['dock', at(NX.objects.rug.home[0])]].concat(Object.keys(zb).sort().map(k => [k, at((zb[k][0] + zb[k][1]) / 2)])); });
    for (const [k, x] of pos) { await p.evaluate(x => { NX.cam.dragUntil = Infinity; NX.cam.x = x; }, x); await p.clock.runFor(16 * 3); await grab('ph:' + k); }
  }
  await ctx.close(); return { shots: out, errs };
}

(async () => {
  const A = opt.a ? { dir: path.resolve(opt.a), name: opt.a } : checkout(REF), B = { dir: path.resolve(opt.b || ROOT), name: opt.b || 'робоча копія' };
  const sa = await serve(A.dir), sb = await serve(B.dir), ua = `http://127.0.0.1:${sa.address().port}/index.html`, ub = `http://127.0.0.1:${sb.address().port}/index.html`;
  const browser = await chromium.launch(); fs.mkdirSync(OUT, { recursive: true });
  const cmp = await browser.newPage();   // порівняння — у браузері (без бібліотек PNG)
  let diffs = 0;
  console.log(`до: ${A.name} (${A.dir})  ·  після: ${B.name}`);
  for (const mode of MODES) {
    const [ra, rb] = [await shoot(browser, ua, mode), await shoot(browser, ub, mode)];
    for (const e of [...ra.errs.map(x => 'до: ' + x), ...rb.errs.map(x => 'після: ' + x)]) console.log('  ПОМИЛКА', e);
    for (let i = 0; i < ra.shots.length; i++) {
      const a = ra.shots[i], b = rb.shots.find(s => s.key === a.key);
      if (!b) { console.log(`  ${a.key.padEnd(16)} немає в «після»`); diffs++; continue; }
      const r = await cmp.evaluate(async ([pa, pb]) => {
        const load = src => new Promise(ok => { const im = new Image(); im.onload = () => ok(im); im.src = src; });
        const [ia, ib] = [await load(pa), await load(pb)]; if (ia.width !== ib.width || ia.height !== ib.height) return { size: `${ia.width}×${ia.height} / ${ib.width}×${ib.height}` };
        const W = ia.width, H = ia.height, cv = document.createElement('canvas'); cv.width = W; cv.height = H; const x = cv.getContext('2d', { willReadFrequently: true });
        x.drawImage(ia, 0, 0); const da = x.getImageData(0, 0, W, H).data; x.clearRect(0, 0, W, H); x.drawImage(ib, 0, 0); const db = x.getImageData(0, 0, W, H);
        let n = 0, mx = 0; const o = x.createImageData(W, H);
        for (let k = 0; k < da.length; k += 4) { const d = Math.max(Math.abs(da[k] - db.data[k]), Math.abs(da[k + 1] - db.data[k + 1]), Math.abs(da[k + 2] - db.data[k + 2]), Math.abs(da[k + 3] - db.data[k + 3]));
          if (d) { n++; if (d > mx) mx = d; o.data[k] = 255; o.data[k + 1] = 40; o.data[k + 2] = 200; o.data[k + 3] = 255; } else { o.data[k] = db.data[k] >> 2; o.data[k + 1] = db.data[k + 1] >> 2; o.data[k + 2] = db.data[k + 2] >> 2; o.data[k + 3] = 255; } }
        if (!n) return { n };
        x.putImageData(o, 0, 0); return { n, mx, all: W * H, img: cv.toDataURL('image/png') };
      }, [a.png, b.png]);
      const txt = a.text === b.text ? '' : '  · ТЕКСТ ІНТЕРФЕЙСУ ІНШИЙ';
      if (r.size) { console.log(`  ${a.key.padEnd(16)} РОЗМІР ІНШИЙ ${r.size}`); diffs++; continue; }
      if (!r.n && !txt) { console.log(`  ${a.key.padEnd(16)} однаково`); continue; }
      diffs++; const f = path.join(OUT, a.key.replace(/[^\w@-]/g, '_'));
      if (r.n) { fs.writeFileSync(f + '_diff.png', Buffer.from(r.img.split(',')[1], 'base64')); fs.writeFileSync(f + '_a.png', Buffer.from(a.png.split(',')[1], 'base64')); fs.writeFileSync(f + '_b.png', Buffer.from(b.png.split(',')[1], 'base64')); }
      console.log(`  ${a.key.padEnd(16)} ${r.n ? `РІЗНИЦЯ: ${r.n} px (${(100 * r.n / r.all).toFixed(3)} %), найбільша ${r.mx}/255 -> ${f}_diff.png` : ''}${txt}`);
    }
  }
  await browser.close(); sa.close(); sb.close();
  console.log(diffs ? `різниця в ${diffs} кадрах` : 'УСЕ ОДНАКОВО'); process.exit(diffs ? 1 : 0);
})();

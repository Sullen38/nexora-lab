/* ============================================================================
 * tools/bench.js — ЗАМІРИ: запуск (заставка, кімната готова, довгі задачі) і fps по місцях камери + розклад кадру
 * ----------------------------------------------------------------------------
 *   node tools/bench.js [ref] [--dev desk|ph] [--cpu 1|4] [--secs 5] [--dpr 3] [--runs 1] [--det 1 [--frames 120]]
 * Без ref — робоча копія; з ref (HEAD, хеш коміту) — та версія (git archive у тимчасову теку): так міряємо «до» й «після».
 * Сайт віддає локальний сервер (як Vercel: index.html + окремі js); шрифти Google вимкнено. --cpu 4 — процесор у 4 рази
 * повільніший (CDP). desk — 1600×900, ph — телефон 390×844 (DPR 3 -> кімната малюється у 2×; --dpr — інший).
 * Друкує: коли видно заставку, коли кімната готова, fps у перші 4 с після заставки, довгі задачі, етапи збірки; далі
 * для кожного місця (комп'ютер — уся кімната; телефон — док і кожна зона) — fps, p50 / p95 / max часу кадру, скільки мс
 * кадру йде на JS (NX.loop.frame) і на що саме: update / drawBack / шари кожного об'єкта, місто, кімната, Nexi, кіт.
 * Заміри — без відеокарти (Chromium headless): drawImage тут дорожчий, ніж на справжньому телефоні; порівнювати «до» й
 * «після» на тій самій машині. Місця міряються після 100-го кадру (сталий стан).
 * --det 1 — ДЕТЕРМІНОВАНО (для «до / після» однієї правки): Math.random з фіксованим зерном (заново на старті циклу), кожен
 *   кадр — рівно 1/60 с життя кімнати (годинник кадру підмінено), камера переходить на місце й міряє рівно на тих самих кадрах (з 200-го: 30 кадрів —
 *   на місці, потім --frames кадрів — замір): обидві версії бачать ті самі кадри, тож різниця мс — від правки, а не від того,
 *   що Nexi саме робив (якщо правка не змінює, скільки разів кидають кубик). Час кімнати тоді йде повільніше за справжній.
 *   --only workshop,tools (з --det) — лише ці місця. Свої заміри всередині об'єкта (для розбору):
 *   window.__benchAdd(ключ, мс), час — window.__benchNow() (годинник кадру стоїть).
 *   --flush 1 (з --det) — після кожного малювання об'єкта полотно екрана «дорисовується» (getImageData 1×1): Chrome малює
 *   відкладено, і без цього ціна растеризації падає на випадковий пізніший виклик; так видно справжню ціну кожного шару.
 * ========================================================================== */
const { chromium } = require('playwright');
const http = require('http'), fs = require('fs'), path = require('path'), os = require('os'), { execSync } = require('child_process');
const ROOT = path.resolve(__dirname, '..');
const args = process.argv.slice(2), opt = {}, rest = [];
for (let i = 0; i < args.length; i++) if (args[i].startsWith('--')) opt[args[i].slice(2)] = args[++i]; else rest.push(args[i]);
const CPU = +(opt.cpu || 1), DEV = opt.dev || 'desk', SECS = +(opt.secs || 5), RUNS = +(opt.runs || 1), DET = !!+(opt.det || 0), FRAMES = +(opt.frames || 120), FLUSH = !!+(opt.flush || 0), ONLY = opt.only ? opt.only.split(',') : null;
const MIME = { '.html': 'text/html; charset=utf-8', '.js': 'text/javascript; charset=utf-8', '.css': 'text/css', '.webp': 'image/webp', '.png': 'image/png', '.json': 'application/json' };
let DIR = ROOT, NAME = 'робоча копія';
if (rest[0]) { const sha = execSync(`git -C "${ROOT}" rev-parse --short ${rest[0]}`).toString().trim(); DIR = path.join(os.tmpdir(), 'nexora-' + sha); NAME = sha;
  if (!fs.existsSync(path.join(DIR, 'index.html'))) { fs.mkdirSync(DIR, { recursive: true }); execSync(`git -C "${ROOT}" archive --format=tar ${sha} | tar -x -C "${DIR}"`); } }
const serve = () => new Promise(res => { const s = http.createServer((q, r) => {
  let f = decodeURIComponent(q.url.split('?')[0].split('#')[0]); if (f === '/') f = '/index.html';
  fs.readFile(path.join(DIR, f), (e, d) => { if (e) { r.writeHead(404); r.end(); return; } r.writeHead(200, { 'content-type': MIME[path.extname(f)] || 'application/octet-stream', 'cache-control': 'no-store' }); r.end(d); });
}); s.listen(0, '127.0.0.1', () => res(s)); });
const DEVS = { desk: { viewport: { width: 1600, height: 900 }, deviceScaleFactor: 1 }, ph: { viewport: { width: 390, height: 844 }, deviceScaleFactor: +(opt.dpr || 3), isMobile: true, hasTouch: true } };

(async () => {
  const srv = await serve(), url = `http://127.0.0.1:${srv.address().port}/index.html#lang-uk`, b = await chromium.launch();
  console.log(`${NAME} · ${DEV} · процесор ×${CPU}`);
  for (let run = 0; run < RUNS; run++) {
    const ctx = await b.newContext(DEVS[DEV]); await ctx.route(/fonts\.(googleapis|gstatic)\.com/, r => r.abort());
    if (DET) await ctx.addInitScript(([dev, FR, FL, ONLY]) => {
      // зерно випадковості й рівний крок кадру (як tools/same.js); на старті циклу — розклад: місце i — камера з кадру
      // B + i·(W + FR), замір — кадри [B + i·(W + FR) + W, B + (i + 1)·(W + FR))
      let s = 0x9e3779b9; Math.random = () => { s |= 0; s = s + 0x6D2B79F5 | 0; let t = Math.imul(s ^ s >>> 15, 1 | s); t = t + Math.imul(t ^ t >>> 7, 61 | t) ^ t; return ((t ^ t >>> 14) >>> 0) / 4294967296; };
      const RN = performance.now.bind(performance), B = 200, W = 30, iv = setInterval(() => { if (!(window.NX && NX.loop && NX.loop.start && NX.objects)) return; clearInterval(iv); const S = NX.loop.start, F = NX.loop.frame;
        NX.loop.start = function () {
          s = 0x2545f491;
          const vw = NX.cam.viewW, max = Math.max(0, NX.cfg.ROOM_W - vw), at = cx => Math.max(0, Math.min(max, cx - vw / 2)), zb = {};
          for (const w of Object.values(NX.arcLayout || {})) if (w && w.zoneBox) Object.assign(zb, w.zoneBox);
          const PL = (dev === 'desk' ? [['кімната', null]] : [['док', at(NX.objects.rug.home[0])]].concat(['analytics', 'marketing', 'workshop', 'tools'].filter(k => zb[k]).map(k => [k, at((zb[k][0] + zb[k][1]) / 2)]))).filter(([n]) => !ONLY || ONLY.includes(n) || (n === 'док' && ONLY.includes('dock')));
          const D = window.__det = { places: PL.map(([name]) => ({ name, acc: {}, ts: [] })), end: B + PL.length * (W + FR) }, idle = {};
          const now = RN, cur = () => { const f = NX.loop.frames - B, i = Math.floor(f / (W + FR)); return f >= 0 && i < PL.length && f % (W + FR) >= W ? D.places[i] : null; };
          const add = (k, d) => { const P = cur(); if (P) P.acc[k] = (P.acc[k] || 0) + d; };
          window.__benchAdd = add; window.__benchNow = RN;                              // годинник кадру стоїть — для своїх замірів справжній
          const fl = c => { if (FL && c && c.getImageData && cur()) c.getImageData(0, 0, 1, 1); };   // --flush: дорисувати відкладене
          const wrap = (o, f, k) => { const g = o[f]; if (typeof g !== 'function') return; o[f] = function (c) { fl(c); const a = now(); try { return g.apply(this, arguments); } finally { fl(c); add(k, now() - a); } }; };
          const wrapL = (o, id) => { const L = o.layers || o.layer; if (typeof L !== 'function') return; const key = o.layers ? 'layers' : 'layer';
            o[key] = function () { const r = L.apply(this, arguments), one = l => l && Object.assign({}, l, { draw: (c, t) => { fl(c); const a = now(); try { return l.draw(c, t); } finally { fl(c); add(id + (c.isRefl ? '.refl' : '.layer'), now() - a); } } }); return Array.isArray(r) ? r.map(one) : one(r); }; };
          for (const id in NX.objects) { const o = NX.objects[id]; wrap(o, 'update', id + '.update'); wrap(o, 'drawBack', id + '.back'); wrapL(o, id); }
          wrap(NX.room, 'draw', 'room'); wrap(NX.city, 'draw', 'city'); wrap(NX.nexi, 'update', 'nexi.update'); wrap(NX.cat, 'update', 'cat.update'); wrapL(NX.nexi, 'nexi'); wrapL(NX.cat, 'cat');
          wrap(NX.fx, 'draw', 'fx'); wrap(NX.ui.hud, 'update', 'hud');
          NX.loop.frame = function () {
            const f = NX.loop.frames - B, i = Math.floor(f / (W + FR)); if (f >= 0 && i < PL.length && f % (W + FR) === 0 && PL[i][1] !== null) { NX.cam.dragUntil = Infinity; NX.cam.x = PL[i][1]; }
            // кадр бачить годинник, що стоїть рівно на 1/60 с далі за попередній: dt = 1/60 без «шуму» справжнього часу
            const P = cur(), a = now(), T = (this.last + 1 / 60) * 1000; if (P) P.ts.push(a); performance.now = () => T;
            try { return F.apply(this, arguments); } finally { performance.now = RN; if (P) { P.acc.FRAME = (P.acc.FRAME || 0) + now() - a; P.acc.__n = (P.acc.__n || 0) + 1; } }
          };
          const r = S.apply(this, arguments); this.last = 1000; return r;            // годинник кадру — від однієї точки: dt однаковий до біта
        }; }, 1);
    }, [DEV, FRAMES, FLUSH, ONLY]);
    await ctx.addInitScript(() => {
      window.__lt = []; try { new PerformanceObserver(l => l.getEntries().forEach(e => __lt.push([e.startTime, e.duration]))).observe({ type: 'longtask', buffered: true }); } catch (e) {}
      window.__f = []; const poll = t => { if (window.NX && NX.boot && NX.boot.done) { if (!window.__doneAt) window.__doneAt = performance.now(); if (t - __doneAt < 4000) __f.push(t); } requestAnimationFrame(poll); }; requestAnimationFrame(poll);
      const sp = () => { const e = document.getElementById('splash'); if (e && e.getBoundingClientRect().width) window.__splashAt = performance.now(); else requestAnimationFrame(sp); }; requestAnimationFrame(sp);
    });
    const p = await ctx.newPage(), errs = []; p.on('pageerror', e => errs.push(e.message)); p.on('console', m => { if (m.type() === 'error' && !/fonts|ERR_|net::/.test(m.text())) errs.push(m.text()); });
    const cdp = await ctx.newCDPSession(p); if (CPU > 1) await cdp.send('Emulation.setCPUThrottlingRate', { rate: CPU });
    await p.goto(url);
    await p.waitForFunction(() => window.__doneAt, null, { timeout: 300000, polling: 200 });
    await p.waitForFunction(() => window.__f.length > 1 && performance.now() - __doneAt > 4100, null, { timeout: 300000, polling: 200 });
    const boot = await p.evaluate(() => {
      const lt = __lt.filter(x => x[0] < __doneAt), f = __f, prof = {};
      for (const k in NX.boot.prof) { const v = NX.boot.prof[k]; prof[k] = Math.round(v.wall || v.work); }
      return { splash: Math.round(__splashAt || -1), ready: Math.round(__doneAt), first4: +((f.length - 1) / ((f[f.length - 1] - f[0]) / 1000)).toFixed(1), lt: lt.length, ltMax: Math.round(Math.max(0, ...lt.map(x => x[1]))), prof };
    });
    if (DET) {
      await p.waitForFunction(() => window.__det && NX.loop.frames >= __det.end + 1, null, { timeout: 1800000, polling: 500 });
      console.log(`  запуск: заставка ${boot.splash} мс · кімната готова ${boot.ready} мс · перші 4 с — ${boot.first4} fps · довгі задачі ${boot.lt} (найдовша ${boot.ltMax} мс) · етапи ${JSON.stringify(boot.prof)}`);
      const R = await p.evaluate(() => __det.places.map(P => { const ts = P.ts, d = ts.slice(1).map((v, i) => v - ts[i]).sort((a, b) => a - b), n = P.acc.__n || 1, per = {};
        for (const k in P.acc) if (k !== '__n' && k !== 'FRAME') per[k] = P.acc[k] / n;
        return { name: P.name, fps: (ts.length - 1) / ((ts[ts.length - 1] - ts[0]) / 1000), p50: d[d.length >> 1], p95: d[Math.floor(d.length * .95)], max: d[d.length - 1], js: P.acc.FRAME / n, per }; }));
      for (const r of R) { r.per['інше'] = r.js - Object.values(r.per).reduce((a, b) => a + b, 0);   // кадр поза обгортками: очищення, віддзеркалення, сортування
        const top = Object.entries(r.per).sort((a, b) => b[1] - a[1]).slice(0, 9).map(([k, v]) => `${k} ${v.toFixed(2)}`).join(' · ');
        console.log(`  ${r.name.padEnd(10)} ${r.fps.toFixed(1).padStart(5)} fps · кадр p50 ${r.p50.toFixed(1)} p95 ${r.p95.toFixed(1)} max ${r.max.toFixed(1)} мс · JS ${r.js.toFixed(1)} мс | ${top}`); }
      if (errs.length) console.log('  ПОМИЛКИ:', errs.join(' ; '));
      await ctx.close(); continue;
    }
    await p.waitForFunction(() => NX.loop.frames >= 100, null, { timeout: 300000, polling: 200 });
    const places = await p.evaluate(dev => {
      const vw = NX.cam.viewW, max = Math.max(0, NX.cfg.ROOM_W - vw), at = cx => Math.max(0, Math.min(max, cx - vw / 2)), zb = {};
      if (dev === 'desk') return [['кімната', null]];
      for (const w of Object.values(NX.arcLayout || {})) if (w && w.zoneBox) Object.assign(zb, w.zoneBox);
      return [['док', at(NX.objects.rug.home[0])]].concat(['analytics', 'marketing', 'workshop', 'tools'].filter(k => zb[k]).map(k => [k, at((zb[k][0] + zb[k][1]) / 2)]));
    }, DEV);
    await p.evaluate(() => {   // інструменти виміру: час кожного update / drawBack / шару
      const A = window.__acc = {}, now = () => performance.now(), add = (k, d) => { A[k] = (A[k] || 0) + d; };
      const wrap = (o, f, k) => { const g = o[f]; if (typeof g !== 'function') return; o[f] = function () { const a = now(); try { return g.apply(this, arguments); } finally { add(k, now() - a); } }; };
      const wrapL = (o, id) => { const L = o.layers || o.layer; if (typeof L !== 'function') return; const key = o.layers ? 'layers' : 'layer';
        o[key] = function () { const r = L.apply(this, arguments), one = l => l && Object.assign({}, l, { draw: (c, t) => { const a = now(); try { return l.draw(c, t); } finally { add(id + (c.isRefl ? '.refl' : '.layer'), now() - a); } } }); return Array.isArray(r) ? r.map(one) : one(r); }; };
      for (const id in NX.objects) { const o = NX.objects[id]; wrap(o, 'update', id + '.update'); wrap(o, 'drawBack', id + '.back'); wrapL(o, id); }
      wrap(NX.room, 'draw', 'room'); wrap(NX.city, 'draw', 'city'); wrap(NX.nexi, 'update', 'nexi.update'); wrap(NX.cat, 'update', 'cat.update'); wrapL(NX.nexi, 'nexi'); wrapL(NX.cat, 'cat');
      wrap(NX.fx, 'draw', 'fx'); wrap(NX.ui.hud, 'update', 'hud');
      const F = NX.loop.frame; NX.loop.frame = function () { const a = now(); try { return F.call(this); } finally { add('FRAME', now() - a); A.__n = (A.__n || 0) + 1; } };
    });
    console.log(`  запуск: заставка ${boot.splash} мс · кімната готова ${boot.ready} мс · перші 4 с — ${boot.first4} fps · довгі задачі ${boot.lt} (найдовша ${boot.ltMax} мс) · етапи ${JSON.stringify(boot.prof)}`);
    for (const [name, x] of places) {
      if (x !== null) await p.evaluate(x => { NX.cam.dragUntil = Infinity; NX.cam.x = x; }, x);
      await p.waitForTimeout(1200);
      const r = await p.evaluate(secs => new Promise(done => {
        for (const k in __acc) delete __acc[k];
        const ts = [], t0 = performance.now(); const f = t => { ts.push(t); if (t - t0 < secs * 1000) requestAnimationFrame(f); else {
          const d = ts.slice(1).map((v, i) => v - ts[i]).sort((a, b) => a - b), n = __acc.__n || 1, per = {};
          for (const k in __acc) if (k !== '__n' && k !== 'FRAME') per[k] = __acc[k] / n;
          done({ fps: (ts.length - 1) / ((ts[ts.length - 1] - ts[0]) / 1000), p50: d[d.length >> 1], p95: d[Math.floor(d.length * .95)], max: d[d.length - 1], js: __acc.FRAME / n, per }); } };
        requestAnimationFrame(f);
      }), SECS);
      const top = Object.entries(r.per).sort((a, b) => b[1] - a[1]).slice(0, 8).map(([k, v]) => `${k} ${v.toFixed(2)}`).join(' · ');
      console.log(`  ${name.padEnd(10)} ${r.fps.toFixed(1).padStart(5)} fps · кадр p50 ${r.p50.toFixed(1)} p95 ${r.p95.toFixed(1)} max ${r.max.toFixed(1)} мс · JS ${r.js.toFixed(1)} мс | ${top}`);
    }
    if (errs.length) console.log('  ПОМИЛКИ:', errs.join(' ; '));
    await ctx.close();
  }
  await b.close(); srv.close();
})();

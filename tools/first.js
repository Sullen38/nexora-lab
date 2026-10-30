/* ============================================================================
 * tools/first.js — ПЕРШІ СЕКУНДИ ПІСЛЯ ЗАСТАВКИ: fps і на що йде кадр (кадри 0–90 і 90–240 головного циклу)
 * ----------------------------------------------------------------------------
 *   node tools/first.js [ref] [--dev ph|desk] [--cpu 4] [--runs 3]
 * Без ref — робоча копія; з ref — та версія (git archive). Як tools/bench.js (локальний сервер, без шрифтів Google), але
 * міряє лише старт циклу: fps у перші 4 с, середній час кадру (JS) і найдорожчі update / drawBack / шари в кожному відрізку.
 * ========================================================================== */
const { chromium } = require('playwright');
const http = require('http'), fs = require('fs'), path = require('path'), os = require('os'), { execSync } = require('child_process');
const ROOT = path.resolve(__dirname, '..');
const args = process.argv.slice(2), opt = {}, rest = [];
for (let i = 0; i < args.length; i++) if (args[i].startsWith('--')) opt[args[i].slice(2)] = args[++i]; else rest.push(args[i]);
const CPU = +(opt.cpu || 4), DEV = opt.dev || 'ph', RUNS = +(opt.runs || 3);
const MIME = { '.html': 'text/html; charset=utf-8', '.js': 'text/javascript; charset=utf-8', '.css': 'text/css', '.webp': 'image/webp', '.png': 'image/png' };
let DIR = ROOT, NAME = 'робоча копія';
if (rest[0]) { const sha = execSync(`git -C "${ROOT}" rev-parse --short ${rest[0]}`).toString().trim(); DIR = path.join(os.tmpdir(), 'nexora-' + sha); NAME = sha;
  if (!fs.existsSync(path.join(DIR, 'index.html'))) { fs.mkdirSync(DIR, { recursive: true }); execSync(`git -C "${ROOT}" archive --format=tar ${sha} | tar -x -C "${DIR}"`); } }
const serve = () => new Promise(res => { const s = http.createServer((q, r) => {
  let f = decodeURIComponent(q.url.split('?')[0].split('#')[0]); if (f === '/') f = '/index.html';
  fs.readFile(path.join(DIR, f), (e, d) => { if (e) { r.writeHead(404); r.end(); return; } r.writeHead(200, { 'content-type': MIME[path.extname(f)] || 'application/octet-stream' }); r.end(d); });
}); s.listen(0, '127.0.0.1', () => res(s)); });
const DEVS = { desk: { viewport: { width: 1600, height: 900 }, deviceScaleFactor: 1 }, ph: { viewport: { width: 390, height: 844 }, deviceScaleFactor: 3, isMobile: true, hasTouch: true } };

(async () => {
  const srv = await serve(), url = `http://127.0.0.1:${srv.address().port}/index.html#lang-uk`, b = await chromium.launch();
  console.log(`${NAME} · ${DEV} · процесор ×${CPU}`);
  const all = [];
  for (let run = 0; run < RUNS; run++) {
    const ctx = await b.newContext(DEVS[DEV]); await ctx.route(/fonts\.(googleapis|gstatic)\.com/, r => r.abort());
    await ctx.addInitScript(() => {
      // перехоплюємо NX.loop.start: до першого кадру — обгортки часу для кожного об'єкта й кадру
      const iv = setInterval(() => { if (!(window.NX && NX.loop && NX.loop.start && NX.objects)) return; clearInterval(iv); const S = NX.loop.start;
        NX.loop.start = function () {
          const B = window.__b = [{}, {}], now = () => performance.now(), seg = () => NX.loop.frames < 90 ? 0 : NX.loop.frames < 240 ? 1 : -1, add = (k, d) => { const s = seg(); if (s >= 0) B[s][k] = (B[s][k] || 0) + d; };
          const wrap = (o, f, k) => { const g = o[f]; if (typeof g !== 'function') return; o[f] = function () { const a = now(); try { return g.apply(this, arguments); } finally { add(k, now() - a); } }; };
          const wrapL = (o, id) => { const L = o.layers || o.layer; if (typeof L !== 'function') return; const key = o.layers ? 'layers' : 'layer';
            o[key] = function () { const r = L.apply(this, arguments), one = l => l && Object.assign({}, l, { draw: (c, t) => { const a = now(); try { return l.draw(c, t); } finally { add(id + (c.isRefl ? '.refl' : '.layer'), now() - a); } } }); return Array.isArray(r) ? r.map(one) : one(r); }; };
          for (const id in NX.objects) { const o = NX.objects[id]; wrap(o, 'update', id + '.update'); wrap(o, 'drawBack', id + '.back'); wrapL(o, id); }
          wrap(NX.room, 'draw', 'room'); wrap(NX.city, 'draw', 'city'); wrap(NX.nexi, 'update', 'nexi.update'); wrap(NX.cat, 'update', 'cat.update'); wrapL(NX.nexi, 'nexi'); wrapL(NX.cat, 'cat');
          const F = NX.loop.frame; window.__ft = []; NX.loop.frame = function () { const s = seg(), a = now(); try { return F.call(this); } finally { const d = now() - a; if (s >= 0) { B[s].FRAME = (B[s].FRAME || 0) + d; B[s].__n = (B[s].__n || 0) + 1; } __ft.push(a); } };
          window.__t0 = now(); return S.apply(this, arguments);
        }; }, 1);
    });
    const p = await ctx.newPage(), errs = []; p.on('pageerror', e => errs.push(e.message));
    const cdp = await ctx.newCDPSession(p); if (CPU > 1) await cdp.send('Emulation.setCPUThrottlingRate', { rate: CPU });
    await p.goto(url);
    await p.waitForFunction(() => window.__t0 && NX.loop.frames >= 240, null, { timeout: 400000, polling: 250 });
    const r = await p.evaluate(() => { const f = __ft.filter(t => t - __t0 < 4000); return { fps4: (f.length - 1) / ((f[f.length - 1] - f[0]) / 1000), B: __b }; });
    all.push(r); if (errs.length) console.log('  ПОМИЛКИ:', errs.join(' ; '));
    await ctx.close();
  }
  const avg = k => all.reduce((s, r) => s + k(r), 0) / all.length;
  console.log(`  перші 4 с: ${all.map(r => r.fps4.toFixed(1)).join(' / ')} fps (середнє ${avg(r => r.fps4).toFixed(1)})`);
  for (const [s, name] of [[0, 'кадри 0–90'], [1, 'кадри 90–240']]) {
    const per = {}; all.forEach(r => { const B = r.B[s], n = B.__n || 1; for (const k in B) if (k !== '__n') per[k] = (per[k] || 0) + B[k] / n / all.length; });
    const top = Object.entries(per).filter(([k]) => k !== 'FRAME').sort((a, b) => b[1] - a[1]).slice(0, 9).map(([k, v]) => `${k} ${v.toFixed(1)}`).join(' · ');
    console.log(`  ${name}: JS ${(per.FRAME || 0).toFixed(1)} мс/кадр | ${top}`);
  }
  await b.close(); srv.close();
})();

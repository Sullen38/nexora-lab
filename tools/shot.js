/* ============================================================================
 * tools/shot.js — ШВИДКА ПЕРЕВІРКА В БРАУЗЕРІ (скриншот + помилки)
 * ----------------------------------------------------------------------------
 * Відкриває dist/nexora-lab.html у Chromium (Playwright), за бажанням запускає
 * дію Nexi, чекає і робить скриншот усього екрана або області кімнати.
 *   node tools/shot.js [дія] [чекати_мс] [x0,y0,x1,y1] [ширина] [висота] [dpr]
 * Приклади:
 *   node tools/shot.js                         -> shot.png, весь екран 1600×900
 *   node tools/shot.js bounce 4000 630,235,920,420 1600 900 2   -> крупно диван
 *   node tools/shot.js - 2000 - 390 844 2      -> телефон
 * Дія — будь-який ключ з js/actors/nexi/activities.js ("-" = без дії).
 * Перед запуском: python3 tools/build.py
 * ========================================================================== */
const { chromium } = require('playwright');
(async () => {
  const [act = '-', wait = '2500', clip = '-', W = '1600', H = '900', dpr = '1'] = process.argv.slice(2);
  const b = await chromium.launch(process.env.CHROMIUM ? { executablePath: process.env.CHROMIUM } : {}).catch(() => chromium.launch({ executablePath: '/opt/pw-browsers/chromium' }));
  const p = await (await b.newContext({ viewport: { width: +W, height: +H }, deviceScaleFactor: +dpr })).newPage();
  const errs = []; p.on('pageerror', e => errs.push(e.message)); p.on('console', m => { if (m.type() === 'error' && !/fonts|ERR_TUNNEL/.test(m.text())) errs.push(m.text()); });
  await p.goto('file://' + require('path').resolve(__dirname, '../dist/nexora-lab.html')); await p.waitForTimeout(1500);
  if (act !== '-') await p.evaluate(a => NX.nexi.do(a), act);
  await p.waitForTimeout(+wait);
  let opt = { path: 'shot.png' };
  if (clip !== '-') { const [x0, y0, x1, y1] = clip.split(',').map(Number), a = await p.evaluate(([x, y]) => NX.cam.toScreen(x, y), [x0, y0]), z = await p.evaluate(([x, y]) => NX.cam.toScreen(x, y), [x1, y1]); opt.clip = { x: a[0], y: a[1], width: z[0] - a[0], height: z[1] - a[1] }; }
  await p.screenshot(opt);
  const fps = await p.evaluate(() => new Promise(r => { let n = 0; const t0 = performance.now(); const f = () => { n++; if (performance.now() - t0 < 2000) requestAnimationFrame(f); else r((n / 2).toFixed(0)); }; requestAnimationFrame(f); }));
  console.log('shot.png', '| fps', fps, '|', errs.join(' ; ') || 'no errors'); await b.close();
})();

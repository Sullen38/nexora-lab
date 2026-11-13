/* ============================================================================
 * tools/garden/shot.js — ЗНІМОК БОТАНІЧНОГО САДУ (скриншот + fps + помилки консолі)
 * ----------------------------------------------------------------------------
 *   node tools/garden/shot.js [файл=garden.png] [чекати_мс=6000] [ширина=1600] [висота=900] [dpr=1] [js-після-входу]
 * Відкриває dist/nexora-lab.html, шле Nexi на острівець із сакурою (сценарій sakura), чекає, поки відкриється сад
 * (NX.garden.on), ще [чекати_мс] — і знімає екран. Останній аргумент — рядок JS, що виконається одразу після входу
 * (напр. "NX.nexi.do('gUp')" або "NX.cam.free=true;NX.cam.x=300"). Перед запуском: python3 tools/build.py
 * ========================================================================== */
const { chromium } = require('playwright');
(async () => {
  const [out = 'garden.png', wait = '6000', W = '1600', H = '900', dpr = '1', js = ''] = process.argv.slice(2);
  const b = await chromium.launch(process.env.CHROMIUM ? { executablePath: process.env.CHROMIUM } : {}).catch(() => chromium.launch({ executablePath: '/opt/pw-browsers/chromium' }));
  const p = await (await b.newContext({ viewport: { width: +W, height: +H }, deviceScaleFactor: +dpr })).newPage();
  const errs = []; p.on('pageerror', e => errs.push(e.message)); p.on('console', m => { if (m.type() === 'error' && !/fonts|ERR_TUNNEL/.test(m.text())) errs.push(m.text()); });
  await p.goto('file://' + require('path').resolve(__dirname, '../../dist/nexora-lab.html') + (process.env.LANG_NX ? '#lang-' + process.env.LANG_NX : ''));
  await p.waitForFunction(() => window.NX && NX.boot && NX.boot.done, null, { timeout: 90000 }); await p.waitForTimeout(500);
  await p.evaluate(() => NX.nexi.do('sakura'));
  await p.waitForFunction(() => NX.garden && NX.garden.on, null, { timeout: 30000 }).catch(() => errs.push('сад не відкрився'));
  if (js) await p.evaluate(js);
  await p.waitForTimeout(+wait);
  await p.screenshot({ path: out });
  const fps = await p.evaluate(() => new Promise(r => { let n = 0; const t0 = performance.now(); const f = () => { n++; if (performance.now() - t0 < 2000) requestAnimationFrame(f); else r((n / 2).toFixed(0)); }; requestAnimationFrame(f); }));
  const st = await p.evaluate(() => ({ on: NX.garden.on, loc: NX.nexi.loc, x: Math.round(NX.nexi.x), y: Math.round(NX.nexi.y), task: NX.nexi.task && NX.nexi.task.id }));
  console.log(out, '| fps', fps, '|', JSON.stringify(st), '|', errs.join(' ; ') || 'no errors'); await b.close();
})();

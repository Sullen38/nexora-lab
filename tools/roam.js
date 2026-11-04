/* ============================================================================
 * tools/roam.js — ВІЛЬНЕ ЖИТТЯ: чи не заходять Nexi й кіт у сліди меблів (foot)
 * ----------------------------------------------------------------------------
 *   node tools/roam.js [секунд=60]
 * Відкриває dist/nexora-lab.html, чекає, поки зникне заставка, і пришвидшує вільне життя (Nexi бере нову справу щокілька
 * секунд). Кожні 100 мс перевіряє: коли Nexi чи кіт ідуть пішки, чи не стоять вони всередині сліду меблів
 * (NX.room.obstacles — з невеликим допуском від краю). Друкує JSON: bad — перші порушення [хто, x, y, № сліду, ціль],
 * nbad — скільки всього, acts — які справи Nexi брав. Має бути nbad: 0.
 * Перед запуском: python3 tools/build.py
 * ========================================================================== */
const { chromium } = require('playwright'), path = require('path');
(async () => {
  const [secs = 60] = process.argv.slice(2);
  const b = await chromium.launch(process.env.CHROMIUM ? { executablePath: process.env.CHROMIUM } : {}).catch(() => chromium.launch({ executablePath: '/opt/pw-browsers/chromium' }));
  const p = await (await b.newContext({ viewport: { width: 1600, height: 900 } })).newPage();
  const errs = []; p.on('pageerror', e => errs.push(e.message));
  await p.goto('file://' + path.resolve(__dirname, '../dist/nexora-lab.html'));
  await p.waitForFunction(() => window.NX && NX.boot && NX.boot.done, null, { timeout: 90000 });
  await p.evaluate(() => {
    NX.cfg.IDLE_BEFORE_AUTOLIFE = 0.5; window.__bad = []; window.__acts = [];
    const inside = (x, y, r) => x > r[0] + .5 && x < r[1] - .5 && y > r[2] + .5 && y < r[3] - .5;
    const od = NX.nexi.do.bind(NX.nexi); NX.nexi.do = (id, u, o) => { window.__acts.push(id); return od(id, u, o); };
    setInterval(() => {
      const n = NX.nexi; if (n.cur && n.cur.walk) NX.room.obstacles().forEach((r, k) => { if (inside(n.x, n.y, [r[0] + 12, r[1] - 12, r[2] + 2, r[3] - 3])) window.__bad.push(['nexi', Math.round(n.x), Math.round(n.y), k, n.cur.walk.map(Math.round)]); });
      const c = NX.cat; if (c.mode === 'walk') NX.room.obstacles('cat').forEach((r, k) => { if (inside(c.x, c.y, [r[0] + 5, r[1] - 5, r[2] + 2, r[3] - 2])) window.__bad.push(['cat', Math.round(c.x), Math.round(c.y), k]); });
    }, 100);
    setInterval(() => { NX.nexi.nextLife = 0; }, 3000);
  });
  await p.waitForTimeout(+secs * 1000);
  const r = await p.evaluate(() => ({ bad: window.__bad.slice(0, 20), nbad: window.__bad.length, acts: window.__acts }));
  console.log(JSON.stringify(r)); console.log(errs.join(' ;; ') || 'no errors'); await b.close();
})();

/* ============================================================================
 * tools/splash/shot.js — ЗНІМКИ ВІТАЛЬНОЇ ЗАСТАВКИ (з dist/nexora-lab.html)
 * ----------------------------------------------------------------------------
 * Відкриває сторінку з адресою #splash-<варіант>-hold: заставка лишається, а етапи лоад-бару ставить інструмент
 * (NX_SPLASH.set), тож знімок — у потрібну мить. Комп'ютер 1600×900 і телефон 390×844.
 *   node tools/splash/shot.js <префікс> [варіанти=abc] [етапи=city:.5,wings:.6] [мова=uk]
 * Етап «js» — скрипти, «img» — картинка, «city» — місто, «wings» — 3D-крила, «ready» — готово; усі до вказаного — зроблені.
 * Приклад:  node tools/splash/shot.js /tmp/sp abc wings:.55 pl   -> /tmp/sp_a_desk.png, /tmp/sp_a_ph.png, …
 * Перед запуском: python3 tools/build.py
 * ========================================================================== */
const { chromium } = require('playwright');
const path = require('path');
(async () => {
  const [pre = 'splash', vars = 'abc', st = 'wings:.55', lang = 'uk'] = process.argv.slice(2);
  const b = await chromium.launch(), errs = [];
  for (const v of vars.split('')) for (const [nm, w, h, d] of [['desk', 1600, 900, 1], ['ph', 390, 844, 3]]) {
    const ctx = await b.newContext({ viewport: { width: w, height: h }, deviceScaleFactor: d }), p = await ctx.newPage();
    p.on('pageerror', e => errs.push(e.message));
    await p.goto('file://' + path.resolve(__dirname, '../../dist/nexora-lab.html') + `#splash-${v}-hold-lang-${lang}`);
    await p.waitForFunction(() => window.NX_SPLASH && window.NX && NX.boot, null, { timeout: 20000 });
    await p.evaluate(spec => {
      const S = window.NX_SPLASH, [k, f] = spec.split(':'), i = S.ORD.indexOf(k);
      S.ORD.forEach((s, n) => { if (n < i) S.set(s, 1); }); S.set(k, +f || .5);
      if (window.NX && NX.city) NX.city.step = 'towers'; if (window.NX && NX.arc) NX.arc.step = { k: 'zone', x: 'workshop' };   // підписи кроків — як у справжній збірці
      S.set(k, Math.min(.999, (+f || .5) + .001));
    }, st);
    await p.waitForTimeout(2200);                                                    // шрифт, переходи заливки, живий Nexi
    await p.screenshot({ path: `${pre}_${v}_${nm}.png` }); await ctx.close();
  }
  console.log(errs.join(' ; ') || 'no errors'); await b.close();
})();

/* ============================================================================
 * tools/texts.js — НАПИСИ В СЦЕНІ 4 МОВАМИ: чи немає «чужих» слів на canvas
 * ----------------------------------------------------------------------------
 *   node tools/texts.js [мс=1500]          WAIT=… ALL=1 — ще й надрукувати всі рядки
 * Для кожної мови (#lang-uk, en, pl, nl) відкриває dist/nexora-lab.html, перехоплює кожен fillText на всіх полотнах
 * (вивіски, екрани, таблички, картки) і після заставки ще [мс] збирає рядки. Підозрілі: в en / pl / nl — кирилиця, в uk —
 * латинські слова, крім дозволених без перекладу (NEXORA, NEXI, AI, KPI, CRM, API, NFT, коди мов) і шістнадцяткових кодів (дисплеї
 * порталу: AE, 3F…). Має бути suspicious: [].
 * Що довше чекати, то більше живих написів потрапить (голограма скінів, картки, сповіщення).
 * Перед запуском: python3 tools/build.py
 * ========================================================================== */
const { chromium } = require('playwright'), path = require('path');
(async () => {
  const wait = +(process.argv[2] || process.env.WAIT || 1500);
  const b = await chromium.launch(process.env.CHROMIUM ? { executablePath: process.env.CHROMIUM } : {}).catch(() => chromium.launch({ executablePath: '/opt/pw-browsers/chromium' }));
  for (const lang of ['uk', 'en', 'pl', 'nl']) {
    const ctx = await b.newContext({ viewport: { width: 1600, height: 900 } });
    await ctx.addInitScript(() => { window.__T = new Set(); const f = CanvasRenderingContext2D.prototype.fillText; CanvasRenderingContext2D.prototype.fillText = function (s, ...a) { window.__T.add(String(s)); return f.call(this, s, ...a); }; });
    const p = await ctx.newPage(); await p.goto('file://' + path.resolve(__dirname, '../dist/nexora-lab.html') + '#lang-' + lang);
    await p.waitForFunction(() => window.NX && NX.boot && NX.boot.done, null, { timeout: 90000 }); await p.waitForTimeout(wait);
    const T = await p.evaluate(() => [...window.__T]);
    const ok = /^(NEXORA|NEXI|AI|KPI|CRM|API|NFT|UA|PL|NL|EN|UK)$/;
    const bad = lang === 'uk' ? T.filter(s => (s.match(/[A-Za-z0-9]*[A-Za-z]{2,}[A-Za-z0-9]*/g) || []).some(w => !ok.test(w) && !/^[0-9A-F]+$/.test(w))) : T.filter(s => /[А-Яа-яІіЇїЄєҐґ]/.test(s));
    console.log(lang, T.length, 'strings; suspicious:', JSON.stringify(bad.slice(0, 20))); if (process.env.ALL) console.log(JSON.stringify(T));
    await ctx.close();
  }
  await b.close();
})();

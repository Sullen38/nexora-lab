/* ============================================================================
 * tools/guests/party_shot.js — ВЕЧІРКА В ПОРТАЛІ: знімки й перевірка (комп'ютер 1600×900 і телефон 390×844)
 * ----------------------------------------------------------------------------
 *   node tools/guests/party_shot.js [тека] [uk|en|pl|nl] [all|none|id1,id2]
 * Кладе в колекцію вказаних гостей (all — усіх 20, none — нікого), тапає по брамі → Nexi йде на вечірку; знімки:
 * trip-*.png (Nexi біля брами й у вихорі), party-*.png (вечірка через 2 і 6 с), back-*.png (після «← У КІМНАТУ»); fps і консоль.
 * Перед запуском: python3 tools/build.py
 * ========================================================================== */
const { chromium } = require('playwright'), path = require('path'), fs = require('fs');
const [dir = '/tmp/party', lang = 'uk', who = 'all'] = process.argv.slice(2);
(async () => {
  fs.mkdirSync(dir, { recursive: true });
  const b = await chromium.launch(process.env.CHROMIUM ? { executablePath: process.env.CHROMIUM } : {}).catch(() => chromium.launch({ executablePath: '/opt/pw-browsers/chromium' }));
  const errs = [];
  for (const [tag, vp, mob] of [['pc', { width: 1600, height: 900 }, false], ['ph', { width: 390, height: 844 }, true]]) {
    const ctx = await b.newContext({ viewport: vp, deviceScaleFactor: mob ? 2 : 1, isMobile: mob, hasTouch: mob }), p = await ctx.newPage();
    p.on('pageerror', e => errs.push(tag + ': ' + e.message)); p.on('console', m => { if (m.type() === 'error' && !/fonts|ERR_TUNNEL/.test(m.text())) errs.push(tag + ': ' + m.text()); });
    await p.goto('file://' + path.resolve(__dirname, '../../dist/nexora-lab.html') + '#lang-' + lang);
    await p.waitForFunction(() => window.NX && NX.boot && NX.boot.done, null, { timeout: 120000 }); await p.waitForTimeout(500);
    await p.evaluate(who => { NX.guests.forget(); if (who === 'all') NX.guests.collectAll(); else if (who !== 'none') who.split(',').forEach(id => NX.guests.collect({ id, x: 0, y: 0, alt: 0 })); NX.guests.S.on = false; NX.guests.S.list = []; }, who);
    const fps = async () => p.evaluate(() => new Promise(r => { let n = 0; const t0 = performance.now(); const f = () => { n++; if (performance.now() - t0 < 2000) requestAnimationFrame(f); else r((n / 2).toFixed(0)); }; requestAnimationFrame(f); }));
    await p.evaluate(() => { const z = NX.arc.zone('portal'), [x0, x1, y0, y1] = z.box; NX.cam.dragUntil = 0; NX.input.onTap((x0 + x1) / 2, (y0 + y1) / 2); });   // тап по брамі
    await p.waitForTimeout(2600); await p.screenshot({ path: path.join(dir, `trip-${tag}-1.png`) });
    await p.waitForFunction(() => NX.nexi.cur && NX.nexi.cur.fade, null, { timeout: 30000 }).catch(() => {}); await p.waitForTimeout(500); await p.screenshot({ path: path.join(dir, `trip-${tag}-2.png`) });
    await p.waitForFunction(() => NX.party.on, null, { timeout: 30000 }); await p.waitForTimeout(2000); await p.screenshot({ path: path.join(dir, `party-${tag}-1.png`) });
    await p.waitForTimeout(4000); await p.screenshot({ path: path.join(dir, `party-${tag}-2.png`) }); const f1 = await fps();
    if (mob) { await p.evaluate(() => { const V = NX.partyRoom.GEO.VIEW; NX.party.S.x = Math.max(V.x0, V.x1 - NX.party.S.viewW); }); await p.waitForTimeout(300); await p.screenshot({ path: path.join(dir, `party-${tag}-3.png`) }); }
    await p.evaluate(() => { const g = NX.party.S.list[0]; if (g) { const sy = (NX.persp.p(g.x, 372, g.z)[1] - 30 - NX.party.S.y) * NX.party.S.k; const sx = (NX.persp.p(g.x, 372, g.z)[0] - NX.party.S.x) * NX.party.S.k; NX.loop.canvas.dispatchEvent(new PointerEvent('pointerdown', { clientX: sx, clientY: sy, bubbles: true })); NX.loop.canvas.dispatchEvent(new PointerEvent('pointerup', { clientX: sx, clientY: sy, bubbles: true })); } });
    await p.waitForTimeout(600); await p.screenshot({ path: path.join(dir, `party-${tag}-tap.png`) });
    await p.evaluate(() => NX.party.close()); await p.waitForTimeout(2500); await p.screenshot({ path: path.join(dir, `back-${tag}.png`) }); const f2 = await fps();
    console.log(tag, '| fps party', f1, '| fps room', f2); await ctx.close();
  }
  console.log(dir, '|', errs.join(' ; ') || 'no errors'); await b.close();
})();

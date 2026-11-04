/* ============================================================================
 * tools/guests/sheet.js — ГОСТІ З ПОРТАЛУ: АРКУШ СПРАЙТІВ + ЗНІМКИ В КІМНАТІ
 * ----------------------------------------------------------------------------
 * Відкриває dist/nexora-lab.html у Chromium (Playwright) і робить:
 *   1) sheet-1.png, sheet-2.png — усі 20 героїв (+ гном) кадрами з guest_art.js: stand / walk і свої пози сценки (×4, з підписами з
 *      словника guests.<id>.n), щоб оцінити вигляд кожного крупно;
 *   2) room.png — усі 20 рядами перед брамою в кімнаті (NX.guests.demo(), комп'ютер 1600×900);
 *   3) ph-<id>.png — за бажанням: телефон 390×844, гість у кімнаті на своїй сценці (NX.guests.spawn(id), камера на ньому).
 *   node tools/guests/sheet.js [тека] [uk|en|pl|nl] [ph:id1,id2|ph:all]
 * Перед запуском: python3 tools/build.py
 * ========================================================================== */
const { chromium } = require('playwright'), path = require('path'), fs = require('fs');
const [dir = '/tmp/guests', lang = 'uk', phArg = ''] = process.argv.slice(2);
const POSES = {   // пози сценки кожного (SCENES / TAP у guests.js); g — стан гостя для кадру
  babaYaga: ['sweep', 'ride'], snowWhite: ['search', 'cheer'], cheshire: ['sit'], redHood: ['give', 'cheer'], whiteRabbit: ['watch', 'run'],
  kolobok: ['roll'], pinocchio: [['stand', { nose: 9 }], 'cheer'], pussBoots: ['bow'], quixote: ['charge', 'fall'], sherlock: ['inspect'],
  robinHood: ['aim', 'cheer'], munchausen: ['ride'], firebird: ['fly'], stNicholas: ['give', 'cheer'], cinderella: ['twirl', ['stand', { lostShoe: 1 }]],
  merlin: ['cast'], genie: ['float', 'cast'], tinMan: ['rust', 'cheer'], silver: ['dig', 'cheer'], gorynych: ['sneeze'], dwarf: ['cheer'] };
(async () => {
  fs.mkdirSync(dir, { recursive: true });
  const b = await chromium.launch(process.env.CHROMIUM ? { executablePath: process.env.CHROMIUM } : {}).catch(() => chromium.launch({ executablePath: '/opt/pw-browsers/chromium' }));
  const ctx = await b.newContext({ viewport: { width: 1600, height: 900 }, deviceScaleFactor: 1 }), p = await ctx.newPage();
  const errs = []; p.on('pageerror', e => errs.push(e.message)); p.on('console', m => { if (m.type() === 'error' && !/fonts|ERR_TUNNEL/.test(m.text())) errs.push(m.text()); });
  await p.goto('file://' + path.resolve(__dirname, '../../dist/nexora-lab.html') + '#lang-' + lang);
  await p.waitForFunction(() => window.NX && NX.boot && NX.boot.done, null, { timeout: 120000 }); await p.waitForTimeout(500);
  // 1) аркуші спрайтів: два файли по ~10 героїв, два стовпці, спрайти ×3 (видно на телефоні)
  const sheets = await p.evaluate(POSES => {
    const ids = [...NX.guests.IDS, 'dwarf'], SC = 3, cols = 2, maxP = 4, cellW = 52 * SC * maxP, cellH = 58 * SC + 70, perSheet = 11, out = [];
    for (let s0 = 0; s0 < ids.length; s0 += perSheet) {
      const part = ids.slice(s0, s0 + perSheet), rows = Math.ceil(part.length / cols), cv = document.createElement('canvas'); cv.width = cols * cellW + 30; cv.height = rows * cellH + 20; const c = cv.getContext('2d');
      c.fillStyle = '#12102a'; c.fillRect(0, 0, cv.width, cv.height); c.imageSmoothingEnabled = false; c.font = '15px monospace'; c.textBaseline = 'top';
      part.forEach((id, i) => {
        const poses = ['stand', 'walk', ...(POSES[id] || [])].slice(0, maxP), X0 = 15 + (i % cols) * cellW, Y0 = 10 + Math.floor(i / cols) * cellH;
        c.fillStyle = '#ffe27a'; c.fillText((NX.t(`guests.${id}.n`) || id) + '  (' + id + ')', X0, Y0);
        poses.forEach((ps, j) => { const [pose, g] = Array.isArray(ps) ? ps : [ps, {}], img = NX.guestArt.frame(id, pose, 1, .4, g), x = X0 + j * 52 * SC, y = Y0 + 30;
          c.drawImage(img, x, y + (58 - img.height) * SC, img.width * SC, img.height * SC); c.fillStyle = '#9ab'; c.fillText(pose + (g.nose ? ' +nose' : g.lostShoe ? ' -shoe' : ''), x, y + 58 * SC + 4); });
      });
      out.push(cv.toDataURL());
    }
    return out;
  }, POSES);
  sheets.forEach((d, i) => fs.writeFileSync(path.join(dir, `sheet-${i + 1}.png`), Buffer.from(d.split(',')[1], 'base64')));
  // 2) усі 20 в кімнаті (комп'ютер)
  await p.evaluate(() => { NX.guests.demo(); NX.cam.dragUntil && NX.cam.dragUntil(1e9); }); await p.waitForTimeout(1200);
  await p.screenshot({ path: path.join(dir, 'room.png') });
  // 3) телефон: гість на сценці
  if (phArg.startsWith('ph:')) {
    const list = phArg.slice(3) === 'all' ? await p.evaluate(() => NX.guests.IDS) : phArg.slice(3).split(',');
    const pc = await b.newContext({ viewport: { width: 390, height: 844 }, deviceScaleFactor: 2, isMobile: true, hasTouch: true }), pp = await pc.newPage();
    pp.on('pageerror', e => errs.push('ph: ' + e.message)); pp.on('console', m => { if (m.type() === 'error' && !/fonts|ERR_TUNNEL/.test(m.text())) errs.push('ph: ' + m.text()); });
    await pp.goto('file://' + path.resolve(__dirname, '../../dist/nexora-lab.html') + '#lang-' + lang);
    await pp.waitForFunction(() => window.NX && NX.boot && NX.boot.done, null, { timeout: 120000 }); await pp.waitForTimeout(500);
    for (const id of list) {
      await pp.evaluate(id => { NX.guests.S.on = false; NX.guests.S.list = []; NX.guests.spawn(id); }, id);
      for (let k = 0; k < 3; k++) {                                       // три кадри: поява, сценка, репліка
        await pp.waitForTimeout(k === 0 ? 1500 : 3500);
        await pp.evaluate(() => { const g = NX.guests.S.list[0]; if (g) { NX.cam.focus && NX.cam.focus(() => g.x, 2, true); NX.cam.dragUntil && NX.cam.dragUntil(NX.time + 2); } });
        await pp.waitForTimeout(250); await pp.screenshot({ path: path.join(dir, `ph-${id}-${k}.png`) });
      }
    }
    await pc.close();
  }
  console.log(dir, '|', errs.join(' ; ') || 'no errors'); await b.close();
})();

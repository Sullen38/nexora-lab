// tools/wingbox/shot.js — знімки сірого макета крил (схеми) з dist/nexora-lab.html
//   node tools/wingbox/shot.js <префікс> [режими...] [--layout розкладка.json] [--hash rw-box|rw-base|rw-3d|none]
// Режими: desk — увесь екран 1600×900; roomc — лише кімната (0..1536 × 0..368); zoomR — праве крило; zoomL — ліве;
//         ph — телефон 390×844 (позиції камери: PHX='[["ph1",930],["ph2",1250]]', за замовчуванням ліве, центр, праве);
//         ids — список об'єктів кімнати (id, span, які шари малює).
// --layout підставляє розкладку генератора (window.RWBOX) без перебудови сайту; без нього — та, що вшита в rwing_box.js.
// Перед знімками: python3 tools/build.py (знімки беруть dist/). Помилки сторінки друкуються в кінці.
const { chromium } = require('playwright');
const fs = require('fs'), path = require('path');
const HTML = 'file://' + path.resolve(__dirname, '../../dist/nexora-lab.html');
(async () => {
  const args = process.argv.slice(2), opt = {}, rest = [];
  for (let i = 0; i < args.length; i++) if (args[i].startsWith('--')) opt[args[i].slice(2)] = args[++i]; else rest.push(args[i]);
  const [pre = 'shot', ...modes] = rest, W = modes.length ? modes : ['desk'];
  const L = opt.layout ? JSON.parse(fs.readFileSync(opt.layout, 'utf8')) : null, hash = opt.hash || 'rw-box';
  const b = await chromium.launch(), errs = [];
  async function page(w, h, dpr) {
    const ctx = await b.newContext({ viewport: { width: w, height: h }, deviceScaleFactor: dpr });
    if (L) await ctx.addInitScript(L => { window.RWBOX = L; }, L);
    const p = await ctx.newPage();
    p.on('pageerror', e => errs.push(e.stack ? e.stack.split('\n').slice(0, 4).join(' | ') : e.message));
    p.on('console', m => { if (m.type() === 'error' && !/fonts|ERR_TUNNEL|net::/.test(m.text())) errs.push(m.text()); });
    await p.goto(HTML + '#' + (hash === 'none' ? '' : hash + ',') + 'lang-uk'); await p.waitForTimeout(2200);
    if (hash === 'rw-3d') { await p.waitForFunction(() => NX.arc && NX.arc.built && NX.arc.built.left, null, { timeout: 30000 }); await p.waitForTimeout(600); }   // 3D: дочекатися збірки (по шару за кадр)
    return p;
  }
  const crop = async (p, x0, y0, x1, y1, file) => {
    const a = await p.evaluate(([x, y]) => NX.cam.toScreen(x, y), [x0, y0]), z = await p.evaluate(([x, y]) => NX.cam.toScreen(x, y), [x1, y1]);
    const X = Math.max(0, a[0]), Y = Math.max(0, a[1]); await p.screenshot({ path: file, clip: { x: X, y: Y, width: Math.min(1600, z[0]) - X, height: Math.min(900, z[1]) - Y } });
  };
  if (W.some(m => ['desk', 'roomc', 'zoomR', 'zoomL', 'ids'].includes(m))) {
    const p = await page(1600, 900, 2);
    if (W.includes('desk')) await p.screenshot({ path: pre + '_desk.png' });
    if (W.includes('roomc')) await crop(p, 0, 0, 1536, 368, pre + '_roomc.png');
    if (W.includes('zoomR')) await crop(p, 880, -10, 1536, 440, pre + '_zoomR.png');
    if (W.includes('zoomL')) await crop(p, 0, -10, 700, 440, pre + '_zoomL.png');
    if (W.includes('ids')) console.log((await p.evaluate(() => Object.values(NX.objects).map(o => `${o.id}${o.span ? '[' + o.span.map(Math.round).join('..') + ']' : ''}${o.drawBack ? ' B' : ''}${o.layers ? ' L' : ''}${o.hit ? ' H' : ''}`))).join(' | '));
    await p.close();
  }
  if (W.includes('ph')) for (const [k, x] of (process.env.PHX ? JSON.parse(process.env.PHX) : [['ph1', 120], ['ph2', 640], ['ph3', 1250]])) {
    const p = await page(390, 844, 3);
    await p.evaluate(x => { NX.cam.dragUntil = performance.now() + 1e9; NX.cam.x = x; }, x); await p.waitForTimeout(800);
    await p.screenshot({ path: pre + '_' + k + '.png' }); await p.close();
  }
  console.log(errs.join(' ; ') || 'no errors'); await b.close();
})();

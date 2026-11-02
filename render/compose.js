'use strict';
/* ============================================================================
 * render/compose.js — ЗІБРАТИ КАРТИНКУ З МАКЕТА: layouts/<макет>.html + дані -> PNG точного розміру
 * ----------------------------------------------------------------------------
 * Макет відкривається з локального сервера теки репозиторію (кадри гри — з out/raw/…), шрифти — ті самі, що в грі
 * (перехоплення fonts.googleapis.com / fonts.gstatic.com, rig/game.js). Щільність 1: 1 піксель макета = 1 піксель файлу,
 * кадри гри кладуться 1:1, спрайти — у ціле число разів. Після рендеру — перевірка: розмір, без прозорості (магазини
 * хочуть 24-біт PNG), текст не вилазить за рамки.
 *   const { compose } = require('./render/compose'); await compose([{ layout: 'shot', out: 'a.png', data: {...} }]);
 * ========================================================================== */
const { chromium } = require('playwright');
const fs = require('fs'), path = require('path');
const { serve, routeFonts, ROOT } = require('../rig/game');

/** Розмір і канали PNG із заголовка (IHDR): colorType 2 — RGB, 6 — RGBA. */
function pngInfo(file) { const b = fs.readFileSync(file); return { w: b.readUInt32BE(16), h: b.readUInt32BE(20), bits: b[24], color: b[25] }; }

async function compose(jobs, { browser } = {}) {
  const srv = await serve(ROOT), base = `http://127.0.0.1:${srv.address().port}`;
  const own = !browser; browser = browser || await chromium.launch();
  const res = [];
  for (const j of jobs) {
    const { W } = j.data, auto = j.data.H === 'auto';   // 'auto' — висота за вмістом (аркуші перегляду)
    let H = auto ? 8000 : j.data.H; const ctx = await browser.newContext({ viewport: { width: W, height: H }, deviceScaleFactor: 1 });
    await routeFonts(ctx); const p = await ctx.newPage(), errs = []; p.on('pageerror', e => errs.push(e.message)); p.on('console', m => m.type() === 'error' && errs.push(m.text()));
    await p.goto(`${base}/layouts/${j.layout}.html`);
    const rel = o => JSON.parse(JSON.stringify(o, (k, v) => typeof v === 'string' && v.startsWith(ROOT) ? '/' + path.relative(ROOT, v) : v));   // шляхи -> адреси сервера
    let info; try { info = await p.evaluate(d => window.build(d), rel(j.data)); } catch (e) { errs.push(e.message); }
    if (auto && info && info.h) H = info.h;
    fs.mkdirSync(path.dirname(j.out), { recursive: true });
    await p.screenshot({ path: j.out, type: 'png', clip: { x: 0, y: 0, width: W, height: H } });
    await ctx.close();
    const pi = pngInfo(j.out), bad = [];
    if (pi.w !== W || pi.h !== H) bad.push(`розмір ${pi.w}×${pi.h}`);
    if (pi.color !== 2) bad.push(`не RGB (colorType ${pi.color})`);
    if (info && info.over && info.over.length) bad.push('текст вилазить: ' + info.over.join(', '));
    res.push({ out: j.out, info, errs, bad });
    console.log(`${path.relative(ROOT, j.out)} ${W}×${H}${info && info.bandPct ? ` · смуга ${info.bandPct} %` : ''}${bad.length ? ' · ПРОБЛЕМА: ' + bad.join('; ') : ''}${errs.length ? ' · ПОМИЛКИ: ' + errs.join('; ') : ''}`);
  }
  if (own) await browser.close(); srv.close();
  return res;
}

module.exports = { compose, pngInfo };

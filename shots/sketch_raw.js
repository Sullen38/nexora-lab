'use strict';
/* ============================================================================
 * shots/sketch_raw.js — СИРІ КАДРИ ДЛЯ ЕСКІЗІВ СТИЛЮ (Реклама · 1)
 * ----------------------------------------------------------------------------
 *   node shots/sketch_raw.js [мова] [--only as,inset,desk]
 * Кадри -> out/raw/sketch/<мова>/:
 *   as_ai.png     1320×2295  AI-центр: Nexi на столі, нейро-лінк (720 кадрів після «AI-центр»), для стилів A і B
 *   inset_ai.png  1242×2154  те саме для стилю C (кадр гри — у рамці з полями)
 *   gp_ai.png / gpinset_ai.png  1080×1536 / 1014×1488 — те саме для Google Play (--only gp,gpinset)
 *   *.json        де Nexi на кадрі, кадр, коміт гри
 *   desk.png      2796×1574  уся кімната (комп'ютер; 1,68 пікселя на одиницю кімнати) — тло банерів
 *   nexi_*.png, cat_sit.png  спрайти Nexi й Рудика в рідній сітці (48×56, 32×24) — збільшуємо лише в ціле число разів
 * ========================================================================== */
const { chromium } = require('playwright');
const fs = require('fs'), path = require('path');
const { open, ROOT } = require('../rig/game');

const lang = process.argv[2] && !process.argv[2].startsWith('--') ? process.argv[2] : 'uk';
const oi = process.argv.indexOf('--only'), ONLY = oi > 0 ? process.argv[oi + 1].split(',') : ['as', 'inset', 'desk'];
const OUT = path.join(ROOT, 'out/raw/sketch', lang);
const png = (file, dataUrl) => fs.writeFileSync(file, Buffer.from(dataUrl.split(',')[1], 'base64'));

(async () => {
  fs.mkdirSync(OUT, { recursive: true });
  const b = await chromium.launch(), log = [];
  const job = async (name, dev, fn) => {
    if (!ONLY.includes(name)) return;
    const t0 = Date.now(), g = await open(b, { ...dev, lang }); await g.boot(); await fn(g);
    log.push(`${name}: ${((Date.now() - t0) / 1000).toFixed(0)} с${g.errs.length ? ' · ПОМИЛКИ ' + g.errs.join(' ; ') : ''} · гра ${g.rev}`); await g.close();
  };
  // AI-центр: та сама команда, що тап по зоні; перша задача зони в чистому браузері — «Відповісти клієнту»
  const ai = file => async g => { await g.run('NX.ui.chat.go("ai")'); await g.step(720); await g.shot(path.join(OUT, file + '.png'));
    // де Nexi на кадрі (пікселі файлу) — для хвостика бабла й вирізів
    const m = await g.eval(() => { const d = devicePixelRatio, [x, y] = NX.cam.toScreen(NX.nexi.x, NX.nexi.y); return { nexi: [Math.round(x * d), Math.round(y * d)], frame: NX.loop.frames, lang: NX.i18n.lang }; });
    fs.writeFileSync(path.join(OUT, file + '.json'), JSON.stringify({ ...m, rev: g.rev, dev: g.opt }, null, 1)); };
  await job('as', { w: 440, h: 765, dpr: 3 }, ai('as_ai'));
  await job('inset', { w: 414, h: 718, dpr: 3 }, ai('inset_ai'));
  await job('gp', { w: 360, h: 512, dpr: 3 }, ai('gp_ai'));             // Google Play: 1080×1536 під смугою 384 (20 %)
  await job('gpinset', { w: 338, h: 496, dpr: 3 }, ai('gpinset_ai'));   // Google Play, стиль C: 1014×1488 у рамці
  await job('desk', { w: 1398, h: 787, dpr: 2, mobile: false }, async g => {
    await g.step(300); await g.shot(path.join(OUT, 'desk.png'));
    // спрайти — наявними функціями гри (renderBot / poseFor — sprite.js / poses.js; drawCat — cat_sprite.js)
    const sp = await g.eval(() => {
      const bot = (pose, t, look) => { const cv = document.createElement('canvas'); cv.width = SW; cv.height = SH; renderBot(look || NX.nexi.look, poseFor(pose, t, false), t, cv); return cv.toDataURL('image/png'); };
      const cat = (pose, fr, t) => { const cv = document.createElement('canvas'); cv.width = CAT_W; cv.height = CAT_H; drawCat(pose, fr, t, cv); return cv.toDataURL('image/png'); };
      return { nexi_stand: bot('stand', 0), nexi_wave: bot('wave', .55), nexi_cheer: bot('cheer', .3), cat_sit: cat('sit', 0, 0), skins: Object.keys(SKINS) };
    });
    for (const k of ['nexi_stand', 'nexi_wave', 'nexi_cheer', 'cat_sit']) png(path.join(OUT, k + '.png'), sp[k]);
    log.push('скіни: ' + sp.skins.join(', '));
  });
  await b.close(); console.log(log.join('\n'));
})();

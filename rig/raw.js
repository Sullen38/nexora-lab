'use strict';
/* ============================================================================
 * rig/raw.js — СИРІ КАДРИ ГРИ: сцена з scenes/index.js на потрібному «пристрої» й мовою
 * ----------------------------------------------------------------------------
 *   node rig/raw.js <сцена> [--dev as|gp|pv|vert|desk|yt] [--lang uk|en|pl|nl] [--o '{"zone":"ai"}'] [--dpr 1]
 *                          [--hash owners-demo] [--out out/raw/<сцена>]
 * Пристрої (CSS-пікселі × щільність = пікселі кадру; телефон — кімната по висоті, комп'ютер — уся кімната по ширині):
 *   as   440×765 @3 = 1320×2295 — App Store 6.9″ (кадр під підписом: 1320×2868 мінус смуга 573)
 *   gp   360×512 @3 = 1080×1536 — Google Play телефон (1080×1920 мінус смуга 384 = 20 %)
 *   pv   443×960 @2 = 886×1920  — прев'ю-відео App Store
 *   vert 540×960 @2 = 1080×1920 — вертикальні ролики (Reels / TikTok / Shorts)
 *   desk 1600×900 @2 = 3200×1800 — уся кімната (банер 1024×500 — виріз з нього)
 *   yt   1920×1080 @1            — промо-відео Google Play (YouTube), уся кімната
 * --dpr 1 — швидкий огляд (той самий кадр, менша роздільність). Друкує коміт гри й помилки сторінки.
 * ========================================================================== */
const { chromium } = require('playwright');
const fs = require('fs'), path = require('path');
const { open, ROOT } = require('./game');
const { SCENES } = require('../scenes');

const DEVS = { as: { w: 440, h: 765, dpr: 3 }, gp: { w: 360, h: 512, dpr: 3 }, pv: { w: 443, h: 960, dpr: 2 },
  vert: { w: 540, h: 960, dpr: 2 }, desk: { w: 1600, h: 900, dpr: 2 }, yt: { w: 1920, h: 1080, dpr: 1 } };

async function shootScene({ scene, dev = 'as', lang = 'uk', o = {}, dpr, hash = [], out, browser, sharp = true }) {
  const D = { ...DEVS[dev] }; if (dpr) D.dpr = +dpr;
  const own = !browser; browser = browser || await chromium.launch();
  const g = await open(browser, { ...D, lang, hash, sharp });
  await g.boot();
  fs.mkdirSync(out, { recursive: true });
  const files = [];
  const snap = async name => { const f = path.join(out, `${name}.png`); await g.shot(f); files.push(f); };
  await SCENES[scene](g, snap, o);
  const errs = g.errs.filter(e => !/favicon/.test(e)), rev = g.rev;
  await g.close(); if (own) await browser.close();
  return { files, errs, rev };
}

if (require.main === module) (async () => {
  const args = process.argv.slice(2), opt = {}, rest = [];
  for (let i = 0; i < args.length; i++) if (args[i].startsWith('--')) opt[args[i].slice(2)] = args[++i]; else rest.push(args[i]);
  const scene = rest[0]; if (!SCENES[scene]) { console.log('сцени:', Object.keys(SCENES).join(', ')); process.exit(1); }
  const o = opt.o ? JSON.parse(opt.o) : {}, out = opt.out || path.join(ROOT, 'out/raw', scene + (o.zone || o.id ? '_' + (o.zone || o.id) : ''));
  const t0 = Date.now();
  const r = await shootScene({ scene, dev: opt.dev || 'as', lang: opt.lang || 'uk', o, dpr: opt.dpr, hash: opt.hash ? opt.hash.split(',') : [], out, sharp: opt.sharp !== '0' });
  console.log(`${scene}: ${r.files.length} кадрів -> ${out} · гра ${r.rev} · ${((Date.now() - t0) / 1000).toFixed(0)} с${r.errs.length ? ' · ПОМИЛКИ: ' + r.errs.join(' ; ') : ''}`);
})();

module.exports = { shootScene, DEVS };

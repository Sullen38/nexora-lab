'use strict';
/* ============================================================================
 * shots/sketch.js — ЕСКІЗИ СТИЛЮ (Реклама · 1): скріншот App Store 1320×2868 і банер Google Play 1024×500
 * у трьох стилях — A «Неонова вивіска», B «Слово Nexi», C «Голо-рамка».
 *   node shots/sketch.js [uk,en,pl,nl]     (спершу: node shots/sketch_raw.js <мова> — сирі кадри гри)
 * -> out/sketches/<мова>/{shot,banner}_<стиль>.png
 * ========================================================================== */
const path = require('path'), fs = require('fs');
const { compose } = require('../render/compose');
const { ROOT } = require('../rig/game');

const LANGS = (process.argv[2] || 'uk').split(','), COPY = require('../copy/sketch.json');
const AS = { W: 1320, H: 2868, band: 573 };                       // кадр гри 1320×2295 (440×765 @3) під смугою 573 (20 %)

const jobs = [];
for (const lang of LANGS) {
  const raw = f => path.join(ROOT, 'out/raw/sketch', lang, f), out = f => path.join(ROOT, 'out/sketches', lang, f);
  const meta = fs.existsSync(raw('as_ai.json')) ? require(raw('as_ai.json')) : { nexi: [517, 1360] };
  const t = COPY.shot_ai[lang], b = COPY.banner[lang];
  const full = { src: raw('as_ai.png'), x: 0, y: AS.band, w: 1320, h: 2295 };
  jobs.push({ layout: 'shot', out: out('shot_a.png'), data: { ...AS, style: 'a', app: full, t } });
  jobs.push({ layout: 'shot', out: out('shot_b.png'), data: { ...AS, style: 'b', app: full, t, avatar: raw('nexi_stand.png'), tailX: meta.nexi[0] } });
  jobs.push({ layout: 'shot', out: out('shot_c.png'), data: { ...AS, style: 'c', band: 654, app: { src: raw('inset_ai.png'), x: 39, y: 674, w: 1242, h: 2154, rad: 48 }, t } });
  const bg = { src: raw('desk.png'), x: 900, y: 170 }, B = { W: 1024, H: 500, bg, nexi: raw('nexi_wave.png'), cat: raw('cat_sit.png'), t: b };
  jobs.push({ layout: 'banner', out: out('banner_a.png'), data: { ...B, style: 'a' } });
  jobs.push({ layout: 'banner', out: out('banner_b.png'), data: { ...B, style: 'b' } });
  jobs.push({ layout: 'banner', out: out('banner_c.png'), data: { ...B, style: 'c', shot: { src: raw('as_ai.png'), x: 320, y: 1040, w: 400, h: 430 } } });
  // Google Play 1080×1920 (смуга 384 = 20 %) — якщо є сирі кадри gp (node shots/sketch_raw.js <мова> --only gp,gpinset)
  if (fs.existsSync(raw('gp_ai.png'))) {
    const GP = { W: 1080, H: 1920, band: 384 }, gm = require(raw('gp_ai.json')), gfull = { src: raw('gp_ai.png'), x: 0, y: GP.band, w: 1080, h: 1536 };
    jobs.push({ layout: 'shot', out: out('gp_a.png'), data: { ...GP, style: 'a', app: gfull, t } });
    jobs.push({ layout: 'shot', out: out('gp_b.png'), data: { ...GP, style: 'b', app: gfull, t, avatar: raw('nexi_stand.png'), tailX: gm.nexi[0] } });
    jobs.push({ layout: 'shot', out: out('gp_c.png'), data: { ...GP, style: 'c', app: { src: raw('gpinset_ai.png'), x: 33, y: 400, w: 1014, h: 1488, rad: 44 }, t } });
  }
}
compose(jobs).then(r => process.exit(r.some(x => x.bad.length || x.errs.length) ? 1 : 0));

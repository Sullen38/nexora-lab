'use strict';
/* shots/overview.js — аркуші для перегляду ескізів (не для магазинів): out/sketches/overview_*.png
 *   node shots/overview.js */
const path = require('path'), fs = require('fs');
const { compose } = require('../render/compose');
const { ROOT } = require('../rig/game');
const S = (l, f) => path.join(ROOT, 'out/sketches', l, f), has = f => fs.existsSync(f);
const STY = [
  ['a', 'A · НЕОНОВА ВИВІСКА', 'Підпис — у вивісці, як вивіски зон у кімнаті. Найбільше «з гри».'],
  ['b', 'B · СЛОВО NEXI', 'Nexi говорить сам — бабл, як у грі, хвостик на Nexi. Найбільше характеру.'],
  ['c', 'C · ГОЛО-РАМКА', 'Великий заголовок, кадр гри у світній рамці. Найбільше «по-діловому».'],
];
const LANGS = ['uk', 'en', 'pl', 'nl'].filter(l => has(S(l, 'shot_a.png')));
const base = { W: 2072, H: 'auto', cw: 624 };
const jobs = [
  { layout: 'overview', out: path.join(ROOT, 'out/sketches/overview_uk.png'), data: { ...base,
    title: 'NEXORA AI · РЕКЛАМА · 1 — ТРИ СТИЛІ', lead: 'Ескізи: скріншот App Store (1320×2868) і банер Google Play (1024×500), українською. Кадр гри — справжній, 1:1; підпис — у смузі ≤ 20 % висоти. Тексти — чернетка.',
    cols: STY.map(([k, t, n]) => ({ title: t, note: n, items: [{ src: S('uk', `shot_${k}.png`), cap: 'App Store · 1320×2868' }, { src: S('uk', `banner_${k}.png`), cap: 'Google Play · банер 1024×500' }] })) } },
];
if (has(S('uk', 'gp_a.png'))) jobs.push({ layout: 'overview', out: path.join(ROOT, 'out/sketches/overview_gp.png'), data: { ...base,
  title: 'GOOGLE PLAY · 1080×1920', lead: 'Ті самі три стилі на телефоні Google Play: підпис займає рівно 20 % кадру (більше Google не радить), решта — справжній кадр гри 1:1.',
  cols: STY.map(([k, t, n]) => ({ title: t, note: n, items: [{ src: S('uk', `gp_${k}.png`), cap: 'Google Play · 1080×1920' }] })) } });
if (LANGS.length > 1) {
  jobs.push({ layout: 'overview', out: path.join(ROOT, 'out/sketches/overview_langs.png'), data: { ...base,
    title: '4 МОВИ · ПІДПИСИ', lead: 'Верх скріншотів App Store: uk, en, pl, nl. Гра в кадрі — тією ж мовою (#lang-xx), шрифт підганяється, щоб найдовша мова влізла.',
    cols: STY.map(([k, t]) => ({ title: t, note: '', grid: 1, items: LANGS.map(l => ({ src: S(l, `shot_${k}.png`), cap: l.toUpperCase(), ar: 1320, crop: 1000 })) })) } });
  jobs.push({ layout: 'overview', out: path.join(ROOT, 'out/sketches/overview_banners.png'), data: { ...base,
    title: '4 МОВИ · БАНЕРИ', lead: 'Банер Google Play 1024×500 чотирма мовами — окремий файл для кожної мови (вимога Google).',
    cols: STY.map(([k, t]) => ({ title: t, note: '', grid: 1, items: LANGS.map(l => ({ src: S(l, `banner_${k}.png`), cap: l.toUpperCase() })) })) } });
}
compose(jobs).then(() => {});

/* ============================================================================
 * tools/splash/gen_splash.js — ПІКСЕЛЬ-АРТ ВІТАЛЬНОЇ ЗАСТАВКИ (дані для index.html)
 * ----------------------------------------------------------------------------
 * Заставка мусить з'явитися миттєво — ще до шрифтів і решти скриптів, тож її піксель-арт лежить прямо в index.html
 * у вигляді рядків-«ASCII-арту» (палітра + символ на піксель), а малює його крихітний inline-скрипт заставки кодом
 * (fillRect, як і все в кімнаті). Цей інструмент цей арт ГЕНЕРУЄ:
 *   nexi  — Nexi 48×56 у стандартному скіні: той самий renderBot (js/actors/nexi/sprite.js), що малює його в кімнаті,
 *           поза «стоїть», очі відкриті; щойно sprite.js завантажиться — заставка оживляє Nexi тим самим кодом (js/ui/splash.js)
 *   logo  — «NEXORA AI» піксельним шрифтом 7×7 (штрихи по 2 px, як у Press Start 2P — шрифт інтерфейсу)
 *   dig   — цифри 0–9 і % для відсотків лоад-бару (той самий шрифт)
 *   ico   — значки етапів 9×9: код, картинка, місто, 3D-куб, зірка «готово»
 *   bolt  — блискавка заряду 5×8
 *   FONT  — піксельний шрифт підписів 5×7 (великі літери: латиниця з польськими, українська кирилиця, цифри, знаки) —
 *           у js/ui/splash.js: підписи зі словників малюються ним кодом, без очікування шрифтів Google
 * Запуск:  node tools/splash/gen_splash.js            -> надрукувати дані
 *          node tools/splash/gen_splash.js --write    -> вписати в index.html (/*px:begin*\/ … /*px:end*\/) і
 *                                                       js/ui/splash.js (/*font:begin*\/ … /*font:end*\/)
 * Потрібен Playwright (як і для знімків tools/shot.js).
 * ========================================================================== */
const { chromium } = require('playwright');
const fs = require('fs'), path = require('path');
const ROOT = path.resolve(__dirname, '../..');

// ---------- шрифт 7×7 (2-піксельні вертикалі) ----------
const FONT = {
  N: ['XX...XX', 'XXX..XX', 'XXXX.XX', 'XX.XXXX', 'XX..XXX', 'XX...XX', 'XX...XX'],
  E: ['XXXXXXX', 'XX.....', 'XX.....', 'XXXXXX.', 'XX.....', 'XX.....', 'XXXXXXX'],
  X: ['XX...XX', 'XX...XX', '.XX.XX.', '..XXX..', '.XX.XX.', 'XX...XX', 'XX...XX'],
  O: ['.XXXXX.', 'XX...XX', 'XX...XX', 'XX...XX', 'XX...XX', 'XX...XX', '.XXXXX.'],
  R: ['XXXXXX.', 'XX...XX', 'XX...XX', 'XXXXXX.', 'XX.XX..', 'XX..XX.', 'XX...XX'],
  A: ['..XXX..', '.XX.XX.', 'XX...XX', 'XX...XX', 'XXXXXXX', 'XX...XX', 'XX...XX'],
  I: ['XXXXXX', '..XX..', '..XX..', '..XX..', '..XX..', '..XX..', 'XXXXXX'],
  ' ': ['...', '...', '...', '...', '...', '...', '...'],
  0: ['.XXXXX.', 'XX...XX', 'XX..XXX', 'XX.X.XX', 'XXX..XX', 'XX...XX', '.XXXXX.'],
  1: ['...XX..', '..XXX..', '...XX..', '...XX..', '...XX..', '...XX..', '.XXXXXX'],
  2: ['.XXXXX.', 'XX...XX', '.....XX', '...XXX.', '.XXX...', 'XX.....', 'XXXXXXX'],
  3: ['.XXXXX.', 'XX...XX', '.....XX', '...XXX.', '.....XX', 'XX...XX', '.XXXXX.'],
  4: ['...XXX.', '..XXXX.', '.XX.XX.', 'XX..XX.', 'XXXXXXX', '....XX.', '....XX.'],
  5: ['XXXXXXX', 'XX.....', 'XXXXXX.', '.....XX', '.....XX', 'XX...XX', '.XXXXX.'],
  6: ['..XXXX.', '.XX....', 'XX.....', 'XXXXXX.', 'XX...XX', 'XX...XX', '.XXXXX.'],
  7: ['XXXXXXX', 'XX...XX', '....XX.', '...XX..', '..XX...', '..XX...', '..XX...'],
  8: ['.XXXXX.', 'XX...XX', 'XX...XX', '.XXXXX.', 'XX...XX', 'XX...XX', '.XXXXX.'],
  9: ['.XXXXX.', 'XX...XX', 'XX...XX', '.XXXXXX', '.....XX', '....XX.', '.XXXX..'],
  '%': ['XX....X', 'XX...XX', '....XX.', '...XX..', '..XX...', 'XX...XX', 'X....XX'],
};
// ---------- значки етапів 9×9 ----------
const ICO = {
  js: [
    '.........',
    '...X.X...',
    '..X...X..',
    '.X..X..X.',
    'X..X....X',
    '.X..X..X.',
    '..X...X..',
    '...X.X...',
    '.........'],
  img: [
    'XXXXXXXXX',
    'X.......X',
    'X.....X.X',
    'X.......X',
    'X..X....X',
    'X.XXX.X.X',
    'XXXXXXXXX',
    'XXXXXXXXX',
    '.........'],
  city: [
    '......X..',
    '......X..',
    '.XX..XXX.',
    '.XX..X.X.',
    '.XXX.XXX.',
    'XX.XXX.X.',
    'XXXXXXXXX',
    'X.XX.XX.X',
    'XXXXXXXXX'],
  wings: [
    '....X....',
    '..XX.XX..',
    'XX.....XX',
    'X.XX.XX.X',
    'X...X...X',
    'X...X...X',
    'XX..X..XX',
    '..XXXXX..',
    '....X....'],
  ready: [
    '....X....',
    '....X....',
    '...XXX...',
    'XXXXXXXXX',
    '.XXXXXXX.',
    '..XXXXX..',
    '..XX.XX..',
    '.XX...XX.',
    '.X.....X.'],
};
const BOLT = ['..XXX', '.XXX.', 'XXX..', 'XXXXX', '..XX.', '.XX..', 'XX...', 'X....'];

// ---------- ПІКСЕЛЬНИЙ ШРИФТ ПІДПИСІВ 5×7 (великі літери): латиниця + польські, кирилиця (українська), цифри, знаки ----------
// Клітинка — 12 рядків: 3 над літерою (наголоси, крапки, ґ), 7 — сама літера, 2 під нею (хвостики Д Ц Щ, огонек Ą Ę, кома).
// Літери, що збігаються з латиницею (А В Е К М Н О Р С Т Х І), — псевдоніми (ALIAS у js/ui/splash.js), без копій.
const ACUTE = ['...X.', '..X..', '.....'], OGON = ['...X.', '...XX'];
const PF = {
  A: ['.XXX.', 'X...X', 'X...X', 'XXXXX', 'X...X', 'X...X', 'X...X'], B: ['XXXX.', 'X...X', 'X...X', 'XXXX.', 'X...X', 'X...X', 'XXXX.'],
  C: ['.XXX.', 'X...X', 'X....', 'X....', 'X....', 'X...X', '.XXX.'], D: ['XXXX.', 'X...X', 'X...X', 'X...X', 'X...X', 'X...X', 'XXXX.'],
  E: ['XXXXX', 'X....', 'X....', 'XXXX.', 'X....', 'X....', 'XXXXX'], F: ['XXXXX', 'X....', 'X....', 'XXXX.', 'X....', 'X....', 'X....'],
  G: ['.XXX.', 'X...X', 'X....', 'X.XXX', 'X...X', 'X...X', '.XXXX'], H: ['X...X', 'X...X', 'X...X', 'XXXXX', 'X...X', 'X...X', 'X...X'],
  I: ['XXX', '.X.', '.X.', '.X.', '.X.', '.X.', 'XXX'], J: ['..XXX', '...X.', '...X.', '...X.', '...X.', 'X..X.', '.XX..'],
  K: ['X...X', 'X..X.', 'X.X..', 'XX...', 'X.X..', 'X..X.', 'X...X'], L: ['X....', 'X....', 'X....', 'X....', 'X....', 'X....', 'XXXXX'],
  M: ['X...X', 'XX.XX', 'X.X.X', 'X.X.X', 'X...X', 'X...X', 'X...X'], N: ['X...X', 'XX..X', 'X.X.X', 'X..XX', 'X...X', 'X...X', 'X...X'],
  O: ['.XXX.', 'X...X', 'X...X', 'X...X', 'X...X', 'X...X', '.XXX.'], P: ['XXXX.', 'X...X', 'X...X', 'XXXX.', 'X....', 'X....', 'X....'],
  Q: ['.XXX.', 'X...X', 'X...X', 'X...X', 'X.X.X', 'X..X.', '.XX.X'], R: ['XXXX.', 'X...X', 'X...X', 'XXXX.', 'X.X..', 'X..X.', 'X...X'],
  S: ['.XXXX', 'X....', 'X....', '.XXX.', '....X', '....X', 'XXXX.'], T: ['XXXXX', '..X..', '..X..', '..X..', '..X..', '..X..', '..X..'],
  U: ['X...X', 'X...X', 'X...X', 'X...X', 'X...X', 'X...X', '.XXX.'], V: ['X...X', 'X...X', 'X...X', 'X...X', 'X...X', '.X.X.', '..X..'],
  W: ['X...X', 'X...X', 'X...X', 'X.X.X', 'X.X.X', 'X.X.X', '.X.X.'], X: ['X...X', 'X...X', '.X.X.', '..X..', '.X.X.', 'X...X', 'X...X'],
  Y: ['X...X', 'X...X', '.X.X.', '..X..', '..X..', '..X..', '..X..'], Z: ['XXXXX', '....X', '...X.', '..X..', '.X...', 'X....', 'XXXXX'],
  // польські
  'Ą': { top: null, rows: 'A', bot: OGON }, 'Ę': { rows: 'E', bot: OGON }, 'Ć': { top: ACUTE, rows: 'C' }, 'Ń': { top: ACUTE, rows: 'N' },
  'Ó': { top: ACUTE, rows: 'O' }, 'Ś': { top: ACUTE, rows: 'S' }, 'Ź': { top: ACUTE, rows: 'Z' }, 'Ż': { top: ['.....', '..X..', '.....'], rows: 'Z' },
  'Ł': ['X....', 'X....', 'X.X..', 'XX...', 'X....', 'X....', 'XXXXX'],
  // кирилиця (українська)
  'Б': ['XXXXX', 'X....', 'X....', 'XXXX.', 'X...X', 'X...X', 'XXXX.'], 'Г': ['XXXXX', 'X....', 'X....', 'X....', 'X....', 'X....', 'X....'],
  'Ґ': { top: ['.....', '.....', '....X'], rows: ['XXXXX', 'X....', 'X....', 'X....', 'X....', 'X....', 'X....'] },
  'Д': { rows: ['..XX.', '.X.X.', '.X.X.', '.X.X.', '.X.X.', '.X.X.', 'XXXXX'], bot: ['X...X', '.....'] },
  'Є': ['.XXX.', 'X...X', 'X....', 'XXXX.', 'X....', 'X...X', '.XXX.'], 'Ж': ['X.X.X', 'X.X.X', '.XXX.', '..X..', '.XXX.', 'X.X.X', 'X.X.X'],
  'З': ['.XXX.', 'X...X', '....X', '..XX.', '....X', 'X...X', '.XXX.'], 'И': ['X...X', 'X...X', 'X..XX', 'X.X.X', 'XX..X', 'X...X', 'X...X'],
  'Ї': { top: ['...', 'X.X', '...'], rows: 'I' }, 'Й': { top: ['.X.X.', '..X..', '.....'], rows: 'И' },
  'Л': ['..XXX', '.X..X', '.X..X', '.X..X', '.X..X', '.X..X', 'X...X'], 'П': ['XXXXX', 'X...X', 'X...X', 'X...X', 'X...X', 'X...X', 'X...X'],
  'У': ['X...X', 'X...X', 'X...X', '.XXXX', '....X', 'X...X', '.XXX.'], 'Ф': ['..X..', '.XXX.', 'X.X.X', 'X.X.X', '.XXX.', '..X..', '..X..'],
  'Ц': { rows: ['X..X.', 'X..X.', 'X..X.', 'X..X.', 'X..X.', 'X..X.', 'XXXXX'], bot: ['....X', '.....'] },
  'Ч': ['X...X', 'X...X', 'X...X', '.XXXX', '....X', '....X', '....X'], 'Ш': ['X.X.X', 'X.X.X', 'X.X.X', 'X.X.X', 'X.X.X', 'X.X.X', 'XXXXX'],
  'Щ': { rows: ['X.X.X', 'X.X.X', 'X.X.X', 'X.X.X', 'X.X.X', 'X.X.X', 'XXXXX'], bot: ['....X', '.....'] },
  'Ь': ['X....', 'X....', 'X....', 'XXXX.', 'X...X', 'X...X', 'XXXX.'], 'Ю': ['X..X.', 'X.X.X', 'X.X.X', 'XXX.X', 'X.X.X', 'X.X.X', 'X..X.'],
  'Я': ['.XXXX', 'X...X', 'X...X', '.XXXX', '..X.X', '.X..X', 'X...X'],
  // цифри
  0: ['.XXX.', 'X...X', 'X..XX', 'X.X.X', 'XX..X', 'X...X', '.XXX.'], 1: ['..X..', '.XX..', '..X..', '..X..', '..X..', '..X..', '.XXX.'],
  2: ['.XXX.', 'X...X', '....X', '...X.', '..X..', '.X...', 'XXXXX'], 3: ['XXXXX', '...X.', '..X..', '...X.', '....X', 'X...X', '.XXX.'],
  4: ['...X.', '..XX.', '.X.X.', 'X..X.', 'XXXXX', '...X.', '...X.'], 5: ['XXXXX', 'X....', 'XXXX.', '....X', '....X', 'X...X', '.XXX.'],
  6: ['..XX.', '.X...', 'X....', 'XXXX.', 'X...X', 'X...X', '.XXX.'], 7: ['XXXXX', '....X', '...X.', '..X..', '.X...', '.X...', '.X...'],
  8: ['.XXX.', 'X...X', 'X...X', '.XXX.', 'X...X', 'X...X', '.XXX.'], 9: ['.XXX.', 'X...X', 'X...X', '.XXXX', '....X', '...X.', '.XX..'],
  // знаки
  ' ': ['...', '...', '...', '...', '...', '...', '...'], '.': ['.', '.', '.', '.', '.', '.', 'X'], ',': { rows: ['..', '..', '..', '..', '..', '.X', '.X'], bot: ['X.', '..'] },
  '!': ['X', 'X', 'X', 'X', 'X', '.', 'X'], '?': ['.XXX.', 'X...X', '....X', '...X.', '..X..', '.....', '..X..'], ':': ['.', '.', 'X', '.', '.', 'X', '.'],
  '-': ['....', '....', '....', 'XXXX', '....', '....', '....'], '&': ['.XX..', 'X..X.', 'X.X..', '.X...', 'X.X.X', 'X..X.', '.XX.X'],
  '/': ['....X', '...X.', '...X.', '..X..', '.X...', '.X...', 'X....'], '%': ['XX..X', 'XX..X', '...X.', '..X..', '.X...', 'X..XX', 'X..XX'],
  "'": ['X', 'X', '.', '.', '.', '.', '.'], '(': ['..X', '.X.', 'X..', 'X..', 'X..', '.X.', '..X'], ')': ['X..', '.X.', '..X', '..X', '..X', '.X.', 'X..'],
  '+': ['.....', '..X..', '..X..', 'XXXXX', '..X..', '..X..', '.....'], '·': ['.', '.', '.', 'X', '.', '.', '.'], '"': ['X.X', 'X.X', '...', '...', '...', '...', '...'],
};
/** Шрифт -> рядок: знак, ширина (1..5), 12 рядків по символу base32 (біт c — стовпчик c зліва). */
function packFont() {
  const B32 = '0123456789abcdefghijklmnopqrstuv'; let out = '';
  for (const ch of Object.keys(PF)) {
    let g = PF[ch]; if (Array.isArray(g)) g = { rows: g };
    const rows = typeof g.rows === 'string' ? (Array.isArray(PF[g.rows]) ? PF[g.rows] : PF[g.rows].rows) : g.rows, w = rows[0].length;
    const cell = [...(g.top || ['', '', '']).map(r => r || ''), ...rows, ...(g.bot || ['', ''])];
    if (cell.length !== 12) throw new Error('знак ' + ch + ': ' + cell.length + ' рядків');
    out += ch + w + cell.map(r => { let v = 0; for (let c = 0; c < Math.min(w, r.length); c++) if (r[c] === 'X') v |= 1 << c; return B32[v]; }).join('');
  }
  return out;
}

/** Рядки маски -> один рядок даних ('.' / 'X'), ширина w. */
const pack = rows => ({ w: rows[0].length, h: rows.length, d: rows.join('') });
/** Текст шрифтом FONT -> маска (пробіл між знаками 1 px). */
function text(s) {
  const gl = [...s].map(ch => FONT[ch]), h = 7, rows = Array.from({ length: h }, () => '');
  gl.forEach((g, n) => { for (let j = 0; j < h; j++) rows[j] += g[j] + (n < gl.length - 1 ? '.' : ''); });
  return pack(rows);
}

(async () => {
  const b = await chromium.launch(), p = await b.newPage();
  for (const f of ['js/actors/nexi/skins.js', 'js/actors/nexi/sprite.js', 'js/actors/nexi/poses.js']) await p.addScriptTag({ path: path.join(ROOT, f) });
  // Nexi: стандартний скін, поза «стоїть» у мить, коли очі відкриті й без підскоку (t 2.5)
  const nexi = await p.evaluate(() => {
    const cv = document.createElement('canvas'); cv.width = SW; cv.height = SH;
    renderBot(Object.assign({}, DEFAULT_LOOK), poseFor('stand', 2.5, false), 2.5, cv);
    const d = cv.getContext('2d').getImageData(0, 0, SW, SH).data, pal = [], idx = {}, AL = '0123456789abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ_$';
    let s = '';
    for (let i = 0; i < SW * SH; i++) {
      if (d[i * 4 + 3] < 128) { s += '.'; continue; }
      const h = [0, 1, 2].map(k => d[i * 4 + k].toString(16).padStart(2, '0')).join('');
      if (!(h in idx)) { idx[h] = pal.length; pal.push(h); }
      s += AL[idx[h]];
    }
    if (pal.length > AL.length) throw new Error('палітра завелика: ' + pal.length);
    return { w: SW, h: SH, p: pal.join(','), d: s };
  });
  await b.close();
  const dig = {}; '0123456789%'.split('').forEach(ch => { dig[ch] = pack(FONT[ch]).d; });
  const ico = {}; Object.keys(ICO).forEach(k => { ico[k] = pack(ICO[k]).d; });
  const PX = { nexi, logo: text('NEXORA AI'), dig, ico, bolt: pack(BOLT) };
  const js = 'var PX=' + JSON.stringify(PX) + ';', fnt = 'const FONT = ' + JSON.stringify(packFont()) + ';';
  if (process.argv.includes('--write')) {
    const put = (file, tag, body) => {
      const f = path.join(ROOT, file), src = fs.readFileSync(f, 'utf8'), re = new RegExp('/\\*' + tag + ':begin\\*/[\\s\\S]*?/\\*' + tag + ':end\\*/');
      if (!re.test(src)) throw new Error(file + ': немає міток /*' + tag + ':begin*/ … /*' + tag + ':end*/');
      fs.writeFileSync(f, src.replace(re, () => '/*' + tag + ':begin*/' + body + '/*' + tag + ':end*/'));
    };
    put('index.html', 'px', js); put('js/ui/splash.js', 'font', fnt);
    console.log('index.html: піксель-арт заставки (' + js.length + ' байт; палітра Nexi — ' + nexi.p.split(',').length + ' кольорів); js/ui/splash.js: шрифт (' + Object.keys(PF).length + ' знаків, ' + fnt.length + ' байт)');
  } else console.log(js + '\n' + fnt);
})();

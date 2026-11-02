'use strict';
/* ============================================================================
 * rig/game.js — ВІДКРИТИ ГРУ З КЛОНУ ДЛЯ ЗЙОМКИ (гру лише читаємо: у клоні нічого не змінюється)
 * ----------------------------------------------------------------------------
 * • Сервер — тека клону Sullen38/nexora-lab (як tools/bench.js у грі: index.html + окремі js), адреса 127.0.0.1.
 * • Шрифти: сайт просить fonts.googleapis.com / fonts.gstatic.com (мережа чату їх не пускає) — запит перехоплюємо й
 *   віддаємо ті самі шрифти з .cache/fonts (google/fonts: ofl/pressstart2p, ofl/rubik, ofl/jetbrainsmono).
 * • Детерміновано, як tools/same.js у грі: годинник сторінки підмінений (Playwright clock) і йде лише тоді, коли ми
 *   крокуємо; Math.random — з фіксованим зерном (і те саме зерно ще раз у мить старту головного циклу); кожен кадр гри —
 *   рівно 1/60 с. Дубль повторюється кадр у кадр, навіть без відеокарти.
 * • sharp (за замовчуванням так): полотно кімнати — у повній роздільності екрана (гра заради швидкодії обмежує до 2×,
 *   і на 3× екрані браузер розтягує полотно з розмиттям). Сцену це не змінює — лише чіткість пікселів.
 * Використання (див. rig/raw.js):
 *   const g = await open(browser, { w: 440, h: 765, dpr: 3, lang: 'uk' }); await g.boot();
 *   await g.run('NX.nexi.do("marketing")'); await g.until('NX.nexi.loc === "mkChair"', 900); await g.shot('a.png');
 * ========================================================================== */
const http = require('http'), fs = require('fs'), path = require('path'), { execSync } = require('child_process');

const ROOT = path.resolve(__dirname, '..');
const GAME = path.resolve(process.env.NX_GAME || path.join(ROOT, '.cache/nexora-lab'));
const FONTS = path.resolve(process.env.NX_FONTS || path.join(ROOT, '.cache/fonts/ofl'));
const MIME = { '.html': 'text/html; charset=utf-8', '.js': 'text/javascript; charset=utf-8', '.css': 'text/css; charset=utf-8',
  '.webp': 'image/webp', '.png': 'image/png', '.jpg': 'image/jpeg', '.json': 'application/json', '.svg': 'image/svg+xml',
  '.ttf': 'font/ttf', '.woff2': 'font/woff2' };

/** Статичний сервер теки (лише читання). */
function serve(dir) {
  return new Promise(res => {
    const s = http.createServer((q, r) => {
      let f = decodeURIComponent(q.url.split('?')[0].split('#')[0]); if (f.endsWith('/')) f += 'index.html';
      const file = path.join(dir, path.normalize(f).replace(/^(\.\.[/\\])+/, ''));
      if (!file.startsWith(dir)) { r.writeHead(403); r.end(); return; }
      fs.readFile(file, (e, d) => { if (e) { r.writeHead(404); r.end(); return; }
        r.writeHead(200, { 'content-type': MIME[path.extname(file)] || 'application/octet-stream', 'cache-control': 'no-store' }); r.end(d); });
    });
    s.listen(0, '127.0.0.1', () => res(s));
  });
}

/** Ті самі гарнітури, що просить index.html гри (Press Start 2P; Rubik 400–700; JetBrains Mono 400–500) — з файлів google/fonts. */
const FONT_CSS = [
  ["'Press Start 2P'", '400', 'pressstart2p/PressStart2P-Regular.ttf'],
  ["'Rubik'", '300 900', 'rubik/Rubik[wght].ttf'],
  ["'JetBrains Mono'", '100 800', 'jetbrainsmono/JetBrainsMono[wght].ttf'],
].map(([fam, w, f]) => `@font-face{font-family:${fam};font-style:normal;font-weight:${w};font-display:swap;src:url(https://fonts.gstatic.com/nx/${encodeURI(f).replace(/\[/g, '%5B').replace(/\]/g, '%5D')}) format('truetype')}`).join('\n');

/** Перехоплення шрифтів у контексті Playwright (і для гри, і для наших макетів). */
async function routeFonts(ctx) {
  if (!fs.existsSync(path.join(FONTS, 'pressstart2p/PressStart2P-Regular.ttf'))) throw new Error('немає шрифтів у ' + FONTS + ' — спершу tools/setup.sh');
  await ctx.route(/^https:\/\/fonts\.googleapis\.com\//, r => r.fulfill({ status: 200, contentType: 'text/css; charset=utf-8', headers: { 'access-control-allow-origin': '*' }, body: FONT_CSS }));
  await ctx.route(/^https:\/\/fonts\.gstatic\.com\//, r => {
    const m = r.request().url().match(/\/nx\/(.+)$/), rel = m && path.normalize(decodeURIComponent(m[1]));
    const file = rel && path.join(FONTS, rel);
    if (!file || !file.startsWith(FONTS) || !fs.existsSync(file)) return r.fulfill({ status: 404, body: '' });
    return r.fulfill({ status: 200, contentType: 'font/ttf', headers: { 'access-control-allow-origin': '*' }, body: fs.readFileSync(file) });
  });
}

/** Коміт гри, з якого знімаємо (пишемо в метадані кадрів). */
function gameRev() { try { return execSync(`git -C "${GAME}" log -1 --format=%h·%cs`).toString().trim(); } catch (e) { return '?'; } }

const RNG = `(() => { let s = 0x9e3779b9; window.__seed = v => { s = v; };
  Math.random = () => { s |= 0; s = s + 0x6D2B79F5 | 0; let t = Math.imul(s ^ s >>> 15, 1 | s); t = t + Math.imul(t ^ t >>> 7, 61 | t) ^ t; return ((t ^ t >>> 14) >>> 0) / 4294967296; }; })();`;

/**
 * Відкрити гру. opt: w, h — CSS-пікселі вікна; dpr — щільність; mobile (тач-телефон; за замовчуванням — якщо h > w);
 * lang uk|en|pl|nl; hash — додаткові ключі адреси (напр. ['owners-demo']); seed — зерно головного циклу; sharp — див. шапку.
 */
async function open(browser, opt = {}) {
  const { w = 440, h = 765, dpr = 3, lang = 'uk', hash = [], seed = 0x2545f491, sharp = true } = opt;
  const mobile = opt.mobile != null ? opt.mobile : h > w;
  const srv = await serve(GAME);
  const ctx = await browser.newContext({ viewport: { width: w, height: h }, deviceScaleFactor: dpr, isMobile: mobile, hasTouch: mobile, locale: { uk: 'uk-UA', en: 'en-US', pl: 'pl-PL', nl: 'nl-NL' }[lang] });
  await routeFonts(ctx);
  await ctx.addInitScript(RNG);
  const page = await ctx.newPage(), errs = [];
  page.on('pageerror', e => errs.push(e.message));
  page.on('console', m => { if (m.type() === 'error') errs.push(m.text()); });
  await page.clock.install({ time: new Date('2026-01-01T12:00:00Z') });
  await page.clock.pauseAt(new Date('2026-01-01T12:00:01Z'));
  const url = `http://127.0.0.1:${srv.address().port}/index.html#` + ['lang-' + lang, ...hash].join('-');
  await page.goto(url);
  // полотно в роздільності екрана (до збірки крил: їхні растри будуються під NX.cam.k * NX.loop.dpr)
  if (sharp) await page.evaluate(() => {
    const L = NX.loop, R = L.resize;
    L.resize = function () { R.apply(this, arguments); const d = devicePixelRatio || 1;
      if (this.dpr !== d) { this.dpr = d; this.canvas.width = Math.round(innerWidth * d); this.canvas.height = Math.round(innerHeight * d);
        NX.room.build(); Object.values(NX.objects).forEach(o => o.layout && o.layout()); } };
  });

  const ev = (fn, arg) => page.evaluate(fn, arg);
  const frames = () => ev(() => (window.NX && NX.loop ? NX.loop.frames : 0));
  const g = {
    page, ctx, errs, url, rev: gameRev(), opt: { w, h, dpr, lang, hash, seed, sharp, mobile },
    /** До кінця вітальної заставки (+ base кадрів, щоб перехід скінчився). Зерно й рівний крок кадру — як у tools/same.js. */
    async boot(base = 160) {
      for (let i = 0; i < 20000; i++) {
        const done = await ev(seed => {
          if (window.NX && NX.loop && NX.loop.start && !NX.loop.__seeded) {
            const f = NX.loop.start, fr = NX.loop.frame;
            NX.loop.start = function () { __seed(seed); const r = f.apply(this, arguments); this.last = 1000; return r; };
            NX.loop.frame = function () { const T = (this.last + 1 / 60) * 1000, pn = performance.now; performance.now = () => T;
              try { return fr.apply(this, arguments); } finally { performance.now = pn; } };
            NX.loop.__seeded = 1;
          }
          return !!(window.NX && NX.boot && NX.boot.done);
        }, seed);
        if (done) break;
        await page.clock.runFor(16);
        if (i === 19999) throw new Error('заставка не завершилась');
      }
      await g.to(base);
      // чіткість: полотно справді в роздільності екрана (інакше кадри вийдуть розмитими — краще впасти, ніж тихо зняти погано)
      if (sharp && !(await ev(() => NX.loop.dpr === (devicePixelRatio || 1) && NX.loop.canvas.width === Math.round(innerWidth * devicePixelRatio)))) throw new Error('полотно не в роздільності екрана (sharp)');
      return g;
    },
    frames,
    /** Крок до кадру n головного циклу (кожен кадр — 1/60 с часу кімнати). */
    async to(n) { for (let f = await frames(), i = 0; f < n && i < 100000; i++) { await page.clock.runFor(16 * Math.min(8, n - f)); f = await frames(); } },
    /** n кадрів уперед. */
    async step(n = 1) { await g.to((await frames()) + n); },
    /** Крокувати, поки умова (рядок JS у сторінці) не стане істинною; не довше max кадрів. Повертає, скільки кадрів минуло. */
    async until(cond, max = 3600, every = 1) {
      const f0 = await frames();
      for (let k = 0; k <= max; k += every) { if (await ev(c => !!(0, eval)(c), cond)) return k; await g.step(every); }
      throw new Error(`не дочекались «${cond}» за ${max} кадрів`);
    },
    /** Виконати рядок JS у сторінці (через наявні функції гри NX.…). */
    run: code => ev(c => (0, eval)(c), code),
    eval: ev,
    /** Знімок вікна (полотно + HTML-інтерфейс гри) у PNG; clip — у CSS-пікселях. */
    shot: (file, clip) => page.screenshot({ path: file, type: 'png', clip, animations: 'allow', caret: 'initial' }),
    async close() { await ctx.close(); srv.close(); },
  };
  return g;
}

module.exports = { open, serve, routeFonts, FONT_CSS, GAME, FONTS, ROOT, gameRev };

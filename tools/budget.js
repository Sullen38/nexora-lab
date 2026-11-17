/* ============================================================================
 * tools/budget.js — БЮДЖЕТ ШВИДКОДІЇ: скільки мс кадру коштує кожен шар і хто перевищив свій ліміт
 * ----------------------------------------------------------------------------
 *   node tools/budget.js                      робоча копія проти лімітів із tools/budget.json (комп'ютер + телефон)
 *   node tools/budget.js --ref <коміт>        «до / після»: той коміт і робоча копія на ЦІЙ машині, шар за шаром
 *   node tools/budget.js --write              записати нові ліміти з поточного заміру (лише чат «Ядро», зі слова власника)
 *   [--dev desk,ph] [--tol 25] [--frames 120] [--retry 1]
 * Міряє через tools/bench.js --det 1 --flush 1 (ті самі кадри, кожен шар «дорисовується» — видно справжню ціну шару, а сума
 * шарів ≈ час кадру). Для телефона береться найдорожче місце камери (док і кожна зона).
 * 1) Без --ref: ліміти з budget.json — це цифри з контейнера чатів (усі чати працюють у такому самому), тож порівняння чесне
 *    лише там. Шар без рядка в бюджеті має ліміт NEW (0.6 мс): новий шар дорожчий за це — спершу рядок у бюджеті (чат «Ядро»).
 * 2) З --ref: ліміти не потрібні, машина будь-яка (так перевіряє GitHub на кожен push): падіння — якщо кадр подорожчав
 *    більше ніж на --tol % (за замовчуванням 25); шари, що подорожчали, друкуються таблицею.
 * --retry 1 — якщо перевищено, заміряти ще раз і вважати падінням лише повторене (сусіди по серверу дають випадкові сплески).
 * Код виходу 1 — бюджет перевищено. Друкує таблицю «шар · було / ліміт · стало».
 * ========================================================================== */
const { execFileSync } = require('child_process'), fs = require('fs'), path = require('path'), os = require('os');
const ROOT = path.resolve(__dirname, '..'), FILE = path.join(__dirname, 'budget.json');
const args = process.argv.slice(2), opt = {};
for (let i = 0; i < args.length; i++) if (args[i].startsWith('--')) { const k = args[i].slice(2); opt[k] = k === 'write' ? '1' : args[++i]; }
const DEVS = (opt.dev || 'desk,ph').split(','), TOL = +(opt.tol || 25) / 100, FRAMES = opt.frames || '120', RETRY = +(opt.retry || 0);
const NEW = 0.6, NAMES = { desk: 'комп\'ютер 1600×900', ph: 'телефон 390×844' };

// один замір: { frame — мс JS на кадр (найдорожче місце), fps — найнижчий, layers — { шар: мс } (найбільше з усіх місць), ready — мс до готової кімнати }
function measure(ref, dev) {
  const out = path.join(os.tmpdir(), `budget-${process.pid}-${dev}.json`), a = [path.join(__dirname, 'bench.js')];
  if (ref) a.push(ref);
  a.push('--dev', dev, '--det', '1', '--flush', '1', '--frames', FRAMES, '--json', out);
  execFileSync(process.execPath, a, { cwd: ROOT, stdio: ['ignore', 'ignore', 'inherit'], timeout: 20 * 60 * 1000 });
  const r = JSON.parse(fs.readFileSync(out, 'utf8')), layers = {}; fs.unlinkSync(out);
  let frame = 0, fps = Infinity, at = '';
  for (const P of r.places) { if (P.js > frame) { frame = P.js; at = P.name; } fps = Math.min(fps, P.fps); for (const k in P.per) layers[k] = Math.max(layers[k] || 0, P.per[k]); }
  return { frame, fps, at, layers, ready: r.boot.ready, errs: r.errs || [] };
}
const f2 = v => v.toFixed(2).padStart(6), row = (a, b, c, d) => console.log('  ' + a.padEnd(24) + String(b).padStart(8) + String(c).padStart(8) + '  ' + (d || ''));

// --- «до / після» проти коміту (будь-яка машина) ---
function versus(dev) {
  const A = measure(opt.ref, dev), B = measure(null, dev), over = [], d = (B.frame - A.frame) / A.frame;
  console.log(`\n${NAMES[dev]} — «до» ${opt.ref} / «після» робоча копія (мс на кадр)`);
  row('шар', 'до', 'після', '');
  row('КАДР (усе разом)', f2(A.frame), f2(B.frame), `${d >= 0 ? '+' : ''}${(d * 100).toFixed(0)} % · fps ${A.fps.toFixed(1)} → ${B.fps.toFixed(1)}`);
  const keys = [...new Set([...Object.keys(A.layers), ...Object.keys(B.layers)])].sort((x, y) => (B.layers[y] || 0) - (B.layers[x] || 0));
  for (const k of keys) { const a = A.layers[k] || 0, b = B.layers[k] || 0, up = b - a > 0.3 && b > a * (1 + TOL), dn = a - b > 0.3 && a > b * (1 + TOL);
    if (up) over.push(k); if (b >= 0.5 || a >= 0.5 || up) row(k, f2(a), f2(b), up ? '← ПОДОРОЖЧАВ' : dn ? 'подешевшав' : ''); }
  console.log(`  кімната готова: ${A.ready} → ${B.ready} мс`);
  if (B.errs.length) console.log('  ПОМИЛКИ КОНСОЛІ:', B.errs.join(' ; '));
  return { bad: d > TOL || B.errs.length > 0, over, d };
}

// --- проти лімітів із budget.json (контейнер чатів) ---
function limits(dev, L) {
  const B = measure(null, dev), over = [];
  console.log(`\n${NAMES[dev]} — робоча копія проти бюджету (мс на кадр; найнижчий fps ${B.fps.toFixed(1)}, найдорожче місце — ${B.at})`);
  row('шар', 'ліміт', 'зараз', '');
  const bad = B.frame > L.frame; if (bad) over.push('КАДР');
  row('КАДР (усе разом)', f2(L.frame), f2(B.frame), bad ? '← ПЕРЕВИЩЕНО' : '');
  for (const k of Object.keys(B.layers).sort((x, y) => B.layers[y] - B.layers[x])) { const lim = L.layers[k], v = B.layers[k], up = v > (lim || NEW);
    if (up) over.push(k); if (lim || up) row(k, lim ? f2(lim) : 'немає', f2(v), up ? (lim ? '← ПЕРЕВИЩЕНО' : '← новий шар без рядка в бюджеті') : ''); }
  if (B.errs.length) console.log('  ПОМИЛКИ КОНСОЛІ:', B.errs.join(' ; '));
  return { bad: over.length > 0 || B.errs.length > 0, over, B };
}

const up1 = v => Math.ceil(v * 10) / 10;
if (opt.write) {
  const J = { 'що це': 'Бюджет швидкодії: ліміт мс на кадр для кожного шару. Пише лише tools/budget.js --write (чат «Ядро»). Таблиця для людей — docs/chats/core.md.',
    measured: new Date().toISOString().slice(0, 10), commit: execFileSync('git', ['-C', ROOT, 'rev-parse', '--short', 'HEAD']).toString().trim() };
  for (const dev of DEVS) { const a = measure(null, dev), b = measure(null, dev), layers = {};       // два заміри — беремо більший (запас на шум)
    for (const k of new Set([...Object.keys(a.layers), ...Object.keys(b.layers)])) { const v = Math.max(a.layers[k] || 0, b.layers[k] || 0); if (v >= 0.4) layers[k] = up1(Math.max(v * 1.3, v + 0.4)); }
    const frame = Math.max(a.frame, b.frame);
    J[dev] = { frame: up1(frame * 1.15), now: +frame.toFixed(1), layers: Object.fromEntries(Object.entries(layers).sort((x, y) => y[1] - x[1])) };
    console.log(`${NAMES[dev]}: кадр ${frame.toFixed(1)} мс → ліміт ${J[dev].frame}; шарів із рядком — ${Object.keys(layers).length}`); }
  fs.writeFileSync(FILE, JSON.stringify(J, null, 1) + '\n'); console.log('записано', path.relative(ROOT, FILE)); process.exit(0);
}
const L = opt.ref ? null : JSON.parse(fs.readFileSync(FILE, 'utf8'));
let fail = [];
for (const dev of DEVS) {
  let r = opt.ref ? versus(dev) : limits(dev, L[dev]);
  for (let i = 0; r.bad && i < RETRY; i++) { console.log('  …перевищено — заміряю ще раз (випадковий сплеск не рахується)'); r = opt.ref ? versus(dev) : limits(dev, L[dev]); }
  if (r.bad) fail.push(`${NAMES[dev]}: ${opt.ref ? `кадр +${(r.d * 100).toFixed(0)} %` : r.over.join(', ')}`);
  else if (opt.ref && r.over.length) console.log(`  увага (не падіння): подорожчали шари ${r.over.join(', ')}`);
}
console.log(fail.length ? `\nБЮДЖЕТ ПЕРЕВИЩЕНО — ${fail.join(' · ')}` : '\nбюджет: у межах');
process.exit(fail.length ? 1 : 0);

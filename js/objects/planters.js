/* ============================================================================
 * objects/planters.js — ЗЕЛЕНЬ ПЕРЕД ВІКНОМ ЗА ДИВАНОМ (Декор стін · 31 → · 34)
 * ----------------------------------------------------------------------------
 * Власник (· 31–· 33): «за диваном перед вікном — вазонів прикольних, щоб читалися; …все одно не подобається — запропонуй краще».
 * Рішення · 34: замість ряду дрібних горщиків — ОДИН довгий неоновий ЖАРДИНЬЄР за диваном (кант видно над спинкою) і кілька
 * «ГЕРОЇВ» — великі рослини з чистим силуетом, намальовані як цілісний піксель-арт (великі форми, 3 тони, темний контур), з
 * КОНТРОВИМ світлом від міста (тіло темне, краї листя — тонкий бірюзово-рожевий рім). Кожен герой — свій і новий вид.
 * Спрайт героя: малюється контурними фігурами на полотні 2 px/од., потім піксельний прохід: альфа в поріг, кольори — до палітри
 * (без напівтонів), рім на краях з боку світла (зліва — бірюза, справа — рожевий). Жардиньєр — прямокутниками в одиницях кімнати.
 * Малюється drawBack після стін / вікна (перед рамами), диван і персонажі — поверх. Тап по листю — картка довідника (група 'floor').
 * ========================================================================== */
(() => {
  const C = NX.cfg, FY = C.FLOOR_Y, hash = NX.art.hash, TAU = Math.PI * 2;
  const JAR = { x0: 662, x1: 892, y: FY + 4, h: 86, d: 10 };                                                          // високий короб: кант на y≈282 — над спинкою дивана (≈288)                                                          // жардиньєр: x, низ (підлога), висота, «глибина» верху
  // герої: x — центр на верхній кромці жардиньєра; w, h — од.; kind — вид (довідник floor.*)
  const HEROES = [
    { kind: 'yucca', x: 760, w: 60, h: 104, seed: 11, back: 1, young: [10, -96, -.2], old: [-22, -50, -1.9] },                // задній шар: синюватий серпанок; young/old — якір нового / пожовклого листка (dx, dy, кут)
    { kind: 'strelitzia', x: 836, w: 64, h: 116, seed: 5, back: 1, young: [6, -100, -.1], old: [-24, -42, -2.1] },
    { kind: 'philodendron', x: 722, w: 96, h: 92, seed: 3, young: [-6, -72, -.35], old: [-38, -30, -2.3] },
    { kind: 'areca', x: 796, w: 84, h: 94, seed: 7, young: [4, -82, .1], old: [34, -28, -.9] },
    { kind: 'cereus', x: 880, w: 24, h: 84, seed: 9 },
    { kind: 'asplenium', x: 756, w: 54, h: 38, seed: 13 },                                                               // низький передній
    // (· 37) квітучі малята спереду: кожен — свій вид і свій колір
    { slot: 1, kind: 'saintpaulia', x: 724, w: 30, h: 22, seed: 21 },
    { slot: 1, kind: 'kalanchoe', x: 750, w: 28, h: 26, seed: 22 },
    { kind: 'anthurium', x: 792, w: 34, h: 34, seed: 23 },
    { slot: 1, kind: 'viola', x: 826, w: 30, h: 22, seed: 24 },
    { slot: 1, kind: 'primula', x: 862, w: 30, h: 26, seed: 25 },
  ];
  // (· 39) висячий сад над вікном: гачок на стельовій рейці (y HOOK_Y), рослина звисає вниз; x — центр, w/h — од.
  const RAIL = { x0: 552, x1: 998, y: 1 }, HOOK_Y = 4;
  // (16.11, 22:29, власник: «зробимо на всю площину вікна, і менше розміром, і щоб були різні види; не треба таким довгим донизу — просто
  // попід верх усі види ліан») НИЗЬКА ГІРЛЯНДА на всю ширину вікна: десять видів квітучих ліан упритул (крок 23 од.), короткі батоги
  const HANG = ['petrea', 'allamanda', 'bougainvillea', 'plumbago', 'jasmine', 'campsis', 'clematis', 'quisqualis', 'lonicera', 'mandevilla']
    .map((kind, i) => ({ kind, x: 572.5 + 45 * i, w: 28, h: 24, seed: 31 + i, hang: 1, S: 4 }));
  const RVINE = { kind: '_railvine', x: (552 + 998) / 2, w: 998 - 552, h: 6, seed: 77, hang: 1, S: 4 };   // лоза вздовж рейки — один спрайт
  // ---------- палітри ----------
  const PAL = { out: '#04120c', d0: '#082218', d1: '#0f3a2a', d2: '#176a44', d3: '#2a9a62', hi: '#5cd08a', stem: '#3a5a2e', stemHi: '#6a8a4a', rimL: '#3be8ff', rimR: '#ff6ad8', bark: '#4a3a2a', barkHi: '#7a6040', spine: '#e8e0a0', white: '#e8f0ff', blue: '#4a6ae0', purple: '#7a3ac8', lilac: '#b88aff', yellow: '#ffd84a', orange: '#ff7a30', red: '#e8304a', pink: '#ff8ad0', cream: '#fff0c0', silver: '#b8c8d8', sage: '#7aa890', dusty: '#6a9a98', gray: '#98ac9c', grayD: '#5a7064', moss: '#3a6a30', copper: '#c8803a', copperHi: '#f0b070', terra: '#b05a3a', terraHi: '#d88a5a', teal: '#2ac8c0', navy: '#1a2048', navyHi: '#2a3468', magenta: '#e83a9a', sky: '#8ac8ff' };
  const HEX = Object.values(PAL).map(h => [parseInt(h.slice(1, 3), 16), parseInt(h.slice(3, 5), 16), parseInt(h.slice(5, 7), 16)]);
  const FLOWERS = ['saintpaulia', 'kalanchoe', 'anthurium', 'viola', 'primula'], STAGES = 4, PERIOD = 170;              // цвітіння: 4 стадії спрайта, цикл 170 с
  /** Бутон замість квітки на ранній стадії: зелена крапля з кольоровим кінчиком. Повертає true, якщо намалював бутон. */
  const bud = (c, x, y, st, col) => { if (st >= .3) return false; const k = .6 + st; c.fillStyle = PAL.out; c.beginPath(); c.ellipse(x, y, 1.6 * k + 1, 2.2 * k + 1, 0, 0, TAU); c.fill(); c.fillStyle = PAL.d3; c.beginPath(); c.ellipse(x, y, 1.6 * k, 2.2 * k, 0, 0, TAU); c.fill(); c.fillStyle = col; c.beginPath(); c.ellipse(x, y - 1.2 * k, .9 * k, 1.1 * k, 0, 0, TAU); c.fill(); return true; };
  const pt = (c, x, y, col) => { if (c.__pts) c.__pts.push([x, y, col]); };
  // ---------- малювання героїв (полотно 2 px/од.) ----------
  /** (16.11, 23:10, власник: «можемо ми їх краще намалювати?» → «так») ВДАЧА ВИДУ — у кожної ліани свій силует, листя й зелень:
   *  n — пагонів, len — їх довжина від/до, sp — розліт убік, py — дуга (більше — спершу вбік, тоді донизу), wav — хвиля,
   *  leaf — форма листка (oval | lance | round — парні | tri — трійчастий | pinn — перистий), lk — розмір, ld — крок листя,
   *  g — три тони зелені (тінь, тіло, світло), fl — квіти 'a' уздовж пагона чи 't' лише на кінці, fd — крок квітів. */
  const HAB = {
    petrea:        { n: 6, len: [3, 8],   sp: 8,  py: 1.3, wav: .5,  leaf: 'oval',  lk: 1.2,  ld: 2, g: ['d1', 'd2', 'd3'],           fl: 't', fd: 9 },
    allamanda:     { n: 6, len: [6, 17],  sp: 6,  py: 1.1, wav: 1,   leaf: 'lance', lk: 1.15, ld: 2, g: ['d1', 'd2', 'hi'],           fl: 'a', fd: 4 },
    bougainvillea: { n: 8, len: [7, 18],  sp: 9,  py: 1.5, wav: 1.3, leaf: 'oval',  lk: .75,  ld: 3, g: ['d0', 'd1', 'd2'],           fl: 'a', fd: 2 },
    plumbago:      { n: 6, len: [5, 17],  sp: 7,  py: 1.1, wav: 1,   leaf: 'oval',  lk: .8,   ld: 2, g: ['grayD', 'dusty', 'sage'],   fl: 't', fd: 9 },
    jasmine:       { n: 7, len: [8, 21],  sp: 6,  py: 1,   wav: 1.7, leaf: 'pinn',  lk: .8,   ld: 2, g: ['d1', 'd2', 'd3'],           fl: 'a', fd: 3 },
    campsis:       { n: 5, len: [6, 16],  sp: 8,  py: 1.2, wav: .8,  leaf: 'pinn',  lk: 1.35, ld: 3, g: ['d1', 'd2', 'hi'],           fl: 't', fd: 9 },
    clematis:      { n: 6, len: [8, 19],  sp: 7,  py: 1.1, wav: 1.9, leaf: 'tri',   lk: .95,  ld: 2, g: ['d1', 'd2', 'hi'],           fl: 'a', fd: 4 },
    quisqualis:    { n: 5, len: [6, 15],  sp: 8,  py: 1.2, wav: .9,  leaf: 'oval',  lk: 1.1,  ld: 2, g: ['d1', 'd2', 'd3'],           fl: 't', fd: 9 },
    lonicera:      { n: 6, len: [8, 18],  sp: 7,  py: 1.1, wav: 1.4, leaf: 'round', lk: 1.1,  ld: 2, g: ['grayD', 'sage', 'gray'],    fl: 'a', fd: 5 },
    mandevilla:    { n: 6, len: [8, 18],  sp: 8,  py: 1.1, wav: 1.6, leaf: 'oval',  lk: 1.4,  ld: 3, g: ['d0', 'd1', 'd3'],           fl: 'a', fd: 4 },
  };
  /** Еліпси з контуром: спершу всі контури, тоді всі заливки — сусідні пелюстки не ріжуть одна одну. L = [x, y, rx, ry, rot, колір]. */
  const EL = (c, L, o = .55) => { for (const pass of [0, 1]) for (const [x, y, rx, ry, rot, col] of L) { c.fillStyle = pass ? col : PAL.out; c.beginPath(); c.ellipse(x, y, rx + (pass ? 0 : o), ry + (pass ? 0 : o), rot || 0, 0, TAU); c.fill(); } };
  /** Гостра пластинка (листок чи пелюстка) від (0,0) уздовж осі x: довжина L, піврозмах Wd. */
  const blade = (c, L, Wd) => { c.beginPath(); c.moveTo(0, 0); c.quadraticCurveTo(L * .45, -Wd, L, 0); c.quadraticCurveTo(L * .45, Wd, 0, 0); c.closePath(); };
  const tube = (c, x0, y0, x1, y1, w, col, bend = 0) => { const mx = (x0 + x1) / 2 + bend, my = (y0 + y1) / 2; for (const pass of [0, 1]) { c.strokeStyle = pass ? col : PAL.out; c.lineWidth = w + (pass ? 0 : 1.1); c.beginPath(); c.moveTo(x0, y0); c.quadraticCurveTo(mx, my, x1, y1); c.stroke(); } };
  /** Квітка виду у вузлі N {x, y, i, v, back, sd}; st — стадія (бутон → повний цвіт). pt() запам'ятовує центр і колір — звідти летять пелюстки. */
  const FLW = {
    petrea(c, N, st) { if (bud(c, N.x, N.y + 2, st, PAL.lilac)) return; const n = 5 + Math.round(7 * st), L = [];                                       // довге бузкове гроно, що звужується донизу
      tube(c, N.x, N.y, N.x + Math.sin(N.v) * .8, N.y + n * 1.25, .5, PAL.stem);
      for (let j = 0; j < n; j++) { const f = j / n; L.push([N.x + (j % 2 ? 1 : -1) * 1.25 * (1 - f * .7) + Math.sin(j * 1.3 + N.v) * .35 + Math.sin(N.v) * .8 * f, N.y + 1.2 + j * 1.25, 1.15 * (1 - f * .45), 1.15 * (1 - f * .45), 0, N.back ? PAL.purple : (j % 4 === 1 ? PAL.white : PAL.lilac)]); }
      EL(c, L); c.fillStyle = N.back ? PAL.lilac : PAL.purple; for (const q of L) if (q[2] > .8) c.fillRect(q[0] - .25, q[1] - .25, .5, .5);
      pt(c, N.x, N.y + n * .7, PAL.lilac); },
    allamanda(c, N, st) { if (bud(c, N.x, N.y, st, PAL.yellow)) return; const m = .6 + .4 * st, L = [];                                               // золота сурма: п'ять круглих лопатей вітрячком
      for (let j = 0; j < 5; j++) { const a = j / 5 * TAU + N.v; L.push([N.x + Math.cos(a) * 1.65 * m, N.y + Math.sin(a) * 1.65 * m, 1.75 * m, 1.3 * m, a + .6, N.back ? PAL.copperHi : (j === 3 ? PAL.cream : PAL.yellow)]); }
      EL(c, L); c.fillStyle = PAL.orange; c.beginPath(); c.arc(N.x, N.y, .95 * m, 0, TAU); c.fill(); c.fillStyle = PAL.red; c.fillRect(N.x - .3, N.y - .3, .6, .6); pt(c, N.x, N.y, PAL.yellow); },
    bougainvillea(c, N, st) { if (bud(c, N.x, N.y, st, PAL.magenta)) return; const m = .6 + .4 * st, L = [];                                           // три паперові приквітки навколо кремових квіточок
      for (let j = 0; j < 3; j++) { const a = j / 3 * TAU + N.i * 1.3 + N.v; L.push([N.x + Math.cos(a) * 1.25 * m, N.y + Math.sin(a) * 1.25 * m, 1.9 * m, 1.3 * m, a, N.back ? PAL.red : (j ? PAL.magenta : PAL.pink)]); }
      EL(c, L); c.fillStyle = PAL.cream; c.fillRect(N.x - .5, N.y - .5, .5, .5); c.fillRect(N.x + .1, N.y, .5, .5); pt(c, N.x, N.y, PAL.magenta); },
    plumbago(c, N, st) { if (bud(c, N.x, N.y + 1, st, PAL.sky)) return; const n = 4 + Math.round(5 * st), L = [];                                      // блакитна куля з дрібних п'ятипелюсткових квіток
      for (let j = 0; j < n; j++) { const rr = 3 * Math.sqrt(j / n), a = j * 2.4 + N.v; L.push([N.x + Math.cos(a) * rr, N.y + 1.8 + Math.sin(a) * rr * .85, 1.15, 1.15, 0, N.back ? PAL.blue : (j % 3 === 1 ? PAL.white : PAL.sky)]); }
      EL(c, L); c.fillStyle = N.back ? PAL.sky : PAL.blue; for (const q of L) c.fillRect(q[0] - .25, q[1] - .25, .5, .5); pt(c, N.x, N.y + 1.8, PAL.sky); },
    jasmine(c, N, st) { EL(c, [[N.x - N.sd * 1.7, N.y + 1.5, .5, .95, N.sd * .4, PAL.pink]], .45); if (bud(c, N.x, N.y, st, PAL.pink)) return; const m = .6 + .4 * st, L = [];   // біла зірочка з вузьких пелюсток і рожевий бутон поруч
      for (let j = 0; j < 5; j++) { const a = j / 5 * TAU + N.i * .7; L.push([N.x + Math.cos(a) * 1.55 * m, N.y + Math.sin(a) * 1.55 * m, 1.35 * m, .62 * m, a, N.back ? PAL.silver : PAL.white]); }
      EL(c, L, .5); c.fillStyle = PAL.yellow; c.fillRect(N.x - .4, N.y - .4, .8, .8); pt(c, N.x, N.y, PAL.white); },
    campsis(c, N, st) { if (bud(c, N.x, N.y + 1, st, PAL.orange)) return; const m = .6 + .4 * st, A = st > .6 ? [-.75, .05, .8] : [-.5, .5], E = [];   // пучок помаранчевих сурм із червоним розтрубом
      for (const a of A) { const l = (4.4 + (a === .05 ? 1 : 0)) * m, ex = N.x + Math.sin(a) * l, ey = N.y + Math.cos(a) * l; tube(c, N.x, N.y, ex, ey, 1.25 * m, PAL.orange, Math.sin(a) * .8); E.push([ex, ey, 1.75 * m, 1.25 * m, -a, N.back ? PAL.terra : PAL.red]); }
      EL(c, E); c.fillStyle = PAL.yellow; for (const q of E) { c.beginPath(); c.ellipse(q[0], q[1], .8 * m, .5 * m, q[4], 0, TAU); c.fill(); } pt(c, N.x, N.y + 3, PAL.orange); },
    clematis(c, N, st) { if (bud(c, N.x, N.y, st, PAL.blue)) return; const m = .6 + .4 * st;                                                            // велика зірка з шести гострих пелюсток зі світлою смужкою
      for (const pass of [0, 1]) for (let j = 0; j < 6; j++) { c.save(); c.translate(N.x, N.y); c.rotate(j / 6 * TAU + N.v); blade(c, 3.5 * m, 1.15 * m); if (!pass) { c.strokeStyle = PAL.out; c.lineWidth = 1.1; c.stroke(); } else { c.fillStyle = N.back ? PAL.purple : PAL.blue; c.fill(); c.strokeStyle = N.back ? PAL.blue : PAL.lilac; c.lineWidth = .32; c.beginPath(); c.moveTo(.9, 0); c.lineTo(2.9 * m, 0); c.stroke(); } c.restore(); }
      EL(c, [[N.x, N.y, .95, .95, 0, PAL.cream]], .45); c.fillStyle = PAL.yellow; c.fillRect(N.x - .35, N.y - .35, .7, .7); pt(c, N.x, N.y, PAL.blue); },
    quisqualis(c, N, st) { if (bud(c, N.x, N.y + 1, st, PAL.pink)) return; const n = 3 + Math.round(2 * st), COL = [PAL.white, PAL.pink, PAL.red, PAL.pink, PAL.red, PAL.white];   // гроно на довгих трубочках: білі, рожеві й червоні разом
      const F = []; for (let j = 0; j < n; j++) { const a = (j / (n - 1) - .5) * 2.1 + Math.sin(N.v + j) * .15, l = 4 + (j % 2) * 1.6; F.push([N.x + Math.sin(a) * l, N.y + Math.cos(a) * l * .9 + 1, a, COL[(j + N.v) % 6]]); }
      for (const f of F) tube(c, N.x, N.y, f[0], f[1], .45, PAL.pink, Math.sin(f[2]) * .6);
      for (const f of F) { const L = []; for (let k = 0; k < 5; k++) { const a = k / 5 * TAU + f[2]; L.push([f[0] + Math.cos(a) * 1.05, f[1] + Math.sin(a) * 1.05, 1.05, .62, a, N.back && f[3] === PAL.white ? PAL.pink : f[3]]); } EL(c, L, .45); c.fillStyle = PAL.cream; c.fillRect(f[0] - .25, f[1] - .25, .5, .5); }
      pt(c, N.x, N.y + 3.5, PAL.pink); pt(c, N.x, N.y + 3.5, PAL.red); },
    lonicera(c, N, st) { if (bud(c, N.x, N.y + 1, st, PAL.cream)) return; const m = .6 + .4 * st, n = 4;                                               // віночок тонких кремових трубочок із тичинками
      for (let j = 0; j < n; j++) { const a = (j / (n - 1) - .5) * 2.2, l = 3.9 * m, ex = N.x + Math.sin(a) * l, ey = N.y + .6 + Math.cos(a) * l * .85, col = N.back ? PAL.yellow : (j % 2 ? PAL.cream : PAL.yellow);
        tube(c, N.x, N.y + .4, ex, ey, .9 * m, col, Math.sin(a) * 1.1); EL(c, [[ex, ey, 1.25 * m, .8 * m, -a, j % 2 ? PAL.white : PAL.cream]], .5); if (N.back) continue;
        c.strokeStyle = PAL.white; c.lineWidth = .25; c.beginPath(); c.moveTo(ex, ey); c.lineTo(ex + Math.sin(a) * 1.5, ey + Math.cos(a) * 1.3); c.stroke(); c.fillStyle = PAL.yellow; c.fillRect(ex + Math.sin(a) * 1.5 - .25, ey + Math.cos(a) * 1.3 - .25, .5, .5); }
      pt(c, N.x, N.y + 2.5, PAL.cream); },
    mandevilla(c, N, st) { if (bud(c, N.x, N.y, st, PAL.pink)) return; const m = .6 + .4 * st, L = [];                                                 // велика рожева лійка з жовтим горлом
      for (let j = 0; j < 5; j++) { const a = j / 5 * TAU + N.v * .9; L.push([N.x + Math.cos(a) * 1.75 * m, N.y + Math.sin(a) * 1.75 * m, 1.95 * m, 1.5 * m, a + .7, N.back ? PAL.magenta : PAL.pink]); }
      EL(c, L); if (!N.back) { c.fillStyle = PAL.white; c.beginPath(); c.ellipse(L[3][0] - .3, L[3][1] - .4, .8 * m, .4 * m, .4, 0, TAU); c.fill(); }
      c.fillStyle = PAL.magenta; c.beginPath(); c.arc(N.x, N.y, 1.15 * m, 0, TAU); c.fill(); c.fillStyle = PAL.yellow; c.beginPath(); c.arc(N.x, N.y, .6 * m, 0, TAU); c.fill(); pt(c, N.x, N.y, PAL.pink); },
  };
  const DRAW = {
    /** (17.11, власник: «хочеться покращити якість саду за диваном» → «так») ГЕРОЇ САДУ ЗА ДИВАНОМ — дрібний піксель (4 px/од.), тонкий
     *  контур O, у кожного виду своя фактура: світла й тіньова сторона листка, жилки, блиск. Силуети й місця — ті самі.
     *  Філодендрон Селло: стовбурець із рубцями, 7 перисто-розсічених листків — у кожної лопаті своя жилка, на верхніх — блиск. */
    philodendron(c, W, H, seed) {
      const cx = W / 2, by = H - 2, O = .7; c.lineCap = 'round'; c.lineJoin = 'round';
      EL(c, [[cx, by - 4, 7.5, 4.8, 0, PAL.stem]], O); c.fillStyle = PAL.stemHi; c.beginPath(); c.ellipse(cx - 2, by - 5.6, 3.6, 1.3, 0, 0, TAU); c.fill(); c.fillStyle = PAL.bark; for (let k = 0; k < 4; k++) c.fillRect(cx - 5 + k * 3, by - 3.4 + (k % 2), 1.7, .5);   // основа з рубцями
      const leaves = [];
      for (let q = 0; q < 7; q++) { const u = (q + .5) / 7, a = (u - .5) * 2.9 + (hash(seed, q) - .5) * .25, back = q % 2 === 0, st = (back ? .5 : .42) * H * (.85 + .3 * hash(seed, q + 3)), len = H * (back ? .5 : .44); leaves.push({ a, st, len, back, q }); }
      leaves.sort((p, q) => (q.back - p.back) || (Math.abs(q.a) - Math.abs(p.a)));
      for (const L of leaves) {
        const { a, st, len, back } = L, sx = cx, sy = by - 5, ex = cx + Math.sin(a) * st, ey = sy - Math.cos(a) * st, pet = (o = 0) => { c.beginPath(); c.moveTo(sx + o, sy); c.quadraticCurveTo(sx + Math.sin(a) * st * .5 + o, sy - Math.cos(a) * st * .3, ex + o, ey); c.stroke(); };
        c.strokeStyle = PAL.out; c.lineWidth = 3.4; pet(); c.strokeStyle = back ? PAL.stem : PAL.stemHi; c.lineWidth = 2; pet(); c.strokeStyle = back ? PAL.stemHi : PAL.hi; c.lineWidth = .4; pet(-.55);   // черешок із бліком
        const la = a * .72, dx = Math.sin(la), dy = -Math.cos(la), nx = Math.cos(la), ny = Math.sin(la), fill = back ? PAL.d1 : PAL.d2, hi = back ? PAL.d2 : PAL.d3, lobes = [];
        for (let k = 0; k < 7; k++) { const t = (k + .6) / 7.6, px = ex + dx * len * t, py = ey + dy * len * t, ll = len * (.27 + .14 * Math.sin(t * Math.PI)) * (k === 6 ? .6 : 1), lw = len * (.052 + .02 * Math.sin(t * Math.PI));
          for (const sd of (k === 6 ? [0] : [-1, 1])) { const ang = la + sd * (1.05 - t * .45), mx = px + Math.sin(ang) * ll * .5, my = py - Math.cos(ang) * ll * .5; lobes.push({ mx, my, ll, lw, ang, sd, px, py }); } }
        c.fillStyle = PAL.out; for (const o of lobes) { c.beginPath(); c.ellipse(o.mx, o.my, o.lw + O, o.ll * .5 + O, o.ang, 0, TAU); c.fill(); }
        c.strokeStyle = PAL.out; c.lineWidth = 3.2; c.beginPath(); c.moveTo(ex, ey); c.lineTo(ex + dx * len, ey + dy * len); c.stroke();
        for (const o of lobes) { c.fillStyle = fill; c.beginPath(); c.ellipse(o.mx, o.my, o.lw, o.ll * .5, o.ang, 0, TAU); c.fill();
          c.fillStyle = hi; c.beginPath(); c.ellipse(o.mx - Math.cos(o.ang) * o.lw * .42, o.my - Math.sin(o.ang) * o.lw * .42, o.lw * .5, o.ll * .4, o.ang, 0, TAU); c.fill();                    // світла половина лопаті
          c.strokeStyle = back ? PAL.d0 : PAL.d1; c.lineWidth = .35; c.beginPath(); c.moveTo(o.px, o.py); c.lineTo(o.px + Math.sin(o.ang) * o.ll * .86, o.py - Math.cos(o.ang) * o.ll * .86); c.stroke();   // жилка лопаті
          if (!back && o.sd <= 0) { c.fillStyle = PAL.hi; c.beginPath(); c.ellipse(o.mx - Math.cos(o.ang) * o.lw * .5 + Math.sin(o.ang) * o.ll * .12, o.my - Math.sin(o.ang) * o.lw * .5 - Math.cos(o.ang) * o.ll * .12, o.lw * .2, o.ll * .16, o.ang, 0, TAU); c.fill(); } }   // блиск
        c.strokeStyle = back ? PAL.d0 : PAL.d1; c.lineWidth = 1.7; c.beginPath(); c.moveTo(ex, ey); c.lineTo(ex + dx * len * .97, ey + dy * len * .97); c.stroke();
        c.strokeStyle = back ? PAL.d2 : PAL.hi; c.lineWidth = .5; c.beginPath(); c.moveTo(ex, ey); c.lineTo(ex + dx * len * .93, ey + dy * len * .93); c.stroke();                               // світла середня жилка
      }
    },
    /** Арека: пучок золотавих стебел, 9 дуг-вай; на кожній — тонкий золотавий рахіс і по 20 пар вузьких листочків, що звисають. */
    areca(c, W, H, seed) {
      const cx = W / 2, by = H - 2, N = 22; c.lineCap = 'round'; c.lineJoin = 'round';
      for (let k = 0; k < 5; k++) { const x = cx - 6 + k * 3, h = 6 + (k % 2) * 3; c.fillStyle = PAL.out; c.fillRect(x - 1.5, by - h - .7, 3, h + .7); c.fillStyle = k % 2 ? PAL.spine : PAL.stemHi; c.fillRect(x - .9, by - h, 1.8, h); c.fillStyle = PAL.bark; for (let y = by - h + 2; y < by - 1; y += 2.6) c.fillRect(x - .9, y, 1.8, .4); }   // стебла з кільцями
      const fr = []; for (let q = 0; q < 9; q++) { const u = (q + .5) / 9, a = (u - .5) * 3.1 + (hash(seed, q) - .5) * .2, back = q % 2 === 1; fr.push({ a, back, len: H * (back ? .9 : .78) * (.85 + .25 * hash(seed, q + 5)), q }); }
      fr.sort((p, q) => (q.back - p.back) || (Math.abs(q.a) - Math.abs(p.a)));
      for (const F of fr) { const { a, back, len } = F, sx = cx, sy = by - 4, pts = []; for (let i = 0; i <= N; i++) { const t = i / N, bend = t * t * .9 * Math.sign(a || 1) * (Math.abs(a) * .5 + .3); pts.push([sx + Math.sin(a + bend) * len * t, sy - Math.cos(a + bend) * len * t]); }
        const fill = back ? PAL.d1 : PAL.d2, hi = back ? PAL.d2 : PAL.d3;
        for (const pass of [0, 1, 2]) for (let i = 3; i < N; i++) { const [x, y] = pts[i], [x1, y1] = pts[i + 1], da = Math.atan2(y1 - y, x1 - x), t = i / N, ll = len * (.22 + .1 * Math.sin(t * Math.PI)) * (i > N - 2 ? .6 : 1);
          for (const sd of [-1, 1]) { if (pass === 2 && (back || sd > 0)) continue; const ang = da + sd * (1.15 - t * .25) + .35, ex = x + Math.cos(ang) * ll, ey = y + Math.sin(ang) * ll;
            c.strokeStyle = pass === 0 ? PAL.out : pass === 1 ? (sd < 0 && !back ? hi : fill) : PAL.hi; c.lineWidth = pass === 0 ? 2.6 : pass === 1 ? 1.4 : .3;
            c.beginPath(); c.moveTo(x, y); c.quadraticCurveTo((x + ex) / 2, (y + ey) / 2 + 2.5 - (pass === 2 ? .35 : 0), ex, ey + 1.5); c.stroke(); } }
        const rach = () => { c.beginPath(); c.moveTo(pts[0][0], pts[0][1]); for (const q of pts) c.lineTo(q[0], q[1]); c.stroke(); };
        c.strokeStyle = PAL.out; c.lineWidth = 2.5; rach(); c.strokeStyle = back ? PAL.stem : PAL.stemHi; c.lineWidth = 1.2; rach(); if (!back) { c.strokeStyle = PAL.spine; c.lineWidth = .35; rach(); } }
    },
    /** Стреліція Ніколая: стовбурець із лусками, 7 довгих черешків із широкими «банановими» листками — надриви по краях, часті бічні
     *  жилки, світла середня; біла квітка-«птах» у синьому човнику. */
    strelitzia(c, W, H, seed) {
      const cx = W / 2, by = H - 2, O = .7; c.lineCap = 'round'; c.lineJoin = 'round';
      c.fillStyle = PAL.out; c.fillRect(cx - 7.7, by - 11.7, 15.4, 11.7); c.fillStyle = PAL.bark; c.fillRect(cx - 7, by - 11, 14, 11); for (let y = by - 10, k = 0; y < by - 1; y += 2.4, k++) { c.fillStyle = PAL.barkHi; c.fillRect(cx - 6.4 + (k % 2) * 3, y, 4.6, .6); c.fillStyle = PAL.out; c.fillRect(cx - 7, y + 1.2, 14, .3); }   // стовбурець із лусками
      const ls = []; for (let q = 0; q < 7; q++) { const u = (q + .5) / 7, a = (u - .5) * 1.5 + (hash(seed, q) - .5) * .15, back = q % 2 === 0; ls.push({ a, back, st: H * (back ? .5 : .42) * (.85 + .3 * hash(seed, q + 2)), len: H * (back ? .5 : .46), q }); }
      ls.sort((p, q) => (q.back - p.back) || (Math.abs(q.a) - Math.abs(p.a)));
      for (const L of ls) { const { a, back, st, len, q } = L, sx = cx, sy = by - 10, ex = sx + Math.sin(a) * st, ey = sy - Math.cos(a) * st, la = a * .55, dx = Math.sin(la), dy = -Math.cos(la), nx = Math.cos(la), ny = Math.sin(la), wd = len * .22;
        const pet = (o = 0) => { c.beginPath(); c.moveTo(sx + o, sy); c.lineTo(ex + o, ey); c.stroke(); }; c.strokeStyle = PAL.out; c.lineWidth = 3.6; pet(); c.strokeStyle = back ? PAL.stem : PAL.stemHi; c.lineWidth = 2.2; pet(); c.strokeStyle = back ? PAL.stemHi : PAL.hi; c.lineWidth = .4; pet(-.6);
        const wAt = (t, sd) => wd * Math.sin(Math.min(1, t * 1.25) * Math.PI * .5) * (1 - t * t * .5) * (((Math.abs(t - .4) < .02 || Math.abs(t - .7) < .02) && hash(seed, q * 3 + sd + Math.round(t * 10)) > .35) ? .45 : 1);
        const edge = (sd, pass) => { c.beginPath(); c.moveTo(ex, ey); for (let i = 1; i <= 10; i++) { const t = i / 10, w = wAt(t, sd); c.lineTo(ex + dx * len * t + nx * sd * w, ey + dy * len * t + ny * sd * w); } c.lineTo(ex + dx * len, ey + dy * len); for (let i = 10; i >= 1; i--) { const t = i / 10; c.lineTo(ex + dx * len * t, ey + dy * len * t); } c.closePath(); if (pass === 0) { c.strokeStyle = PAL.out; c.lineWidth = 2 * O; c.stroke(); } c.fillStyle = pass === 0 ? PAL.out : (back ? (sd < 0 ? PAL.d2 : PAL.d1) : (sd < 0 ? PAL.d3 : PAL.d2)); c.fill(); };
        for (const pass of [0, 1]) for (const sd of [-1, 1]) edge(sd, pass);
        for (const sd of [-1, 1]) { c.strokeStyle = back ? (sd < 0 ? PAL.d1 : PAL.d0) : (sd < 0 ? PAL.d2 : PAL.d1); c.lineWidth = .3; for (let i = 1; i < 24; i++) { const t = i / 25, t2 = Math.min(1, t + .07), w = wd * Math.sin(Math.min(1, t2 * 1.25) * Math.PI * .5) * (1 - t2 * t2 * .5) * .9; c.beginPath(); c.moveTo(ex + dx * len * t, ey + dy * len * t); c.lineTo(ex + dx * len * t2 + nx * sd * w, ey + dy * len * t2 + ny * sd * w); c.stroke(); } }   // часті бічні жилки
        c.strokeStyle = back ? PAL.d0 : PAL.d1; c.lineWidth = 1.6; c.beginPath(); c.moveTo(ex, ey); c.lineTo(ex + dx * len * .96, ey + dy * len * .96); c.stroke(); c.strokeStyle = back ? PAL.d3 : PAL.hi; c.lineWidth = .5; c.beginPath(); c.moveTo(ex, ey); c.lineTo(ex + dx * len * .9, ey + dy * len * .9); c.stroke();
        if (!back) { c.fillStyle = PAL.hi; c.beginPath(); c.ellipse(ex + dx * len * .45 - nx * wd * .5, ey + dy * len * .45 - ny * wd * .5, wd * .12, len * .16, la, 0, TAU); c.fill(); } }   // блиск на світлій половині
      const fx = cx + 14, fy = by - H * .72; c.strokeStyle = PAL.out; c.lineWidth = 3.2; c.beginPath(); c.moveTo(cx + 2, by - 10); c.lineTo(fx, fy + 10); c.stroke(); c.strokeStyle = PAL.stemHi; c.lineWidth = 1.8; c.stroke();   // квітконіс
      const boat = (e, col) => { c.fillStyle = col; c.beginPath(); c.moveTo(fx - 3 - e, fy + 11 + e); c.lineTo(fx + 11 + e, fy + 5.5 + e * .3); c.lineTo(fx + 9.5, fy + 1.6 - e); c.lineTo(fx - 2 - e, fy + 5.4 - e); c.closePath(); c.fill(); };
      boat(O, PAL.out); boat(0, PAL.blue); c.fillStyle = PAL.sky; c.beginPath(); c.moveTo(fx - 1.5, fy + 6.4); c.lineTo(fx + 9, fy + 2.6); c.lineTo(fx + 9.3, fy + 3.6); c.lineTo(fx - 1.2, fy + 7.6); c.closePath(); c.fill();
      for (const pass of [0, 1, 2]) for (const [ang, l] of [[-1.25, 11], [-.95, 13.5], [-.68, 10.5]]) { c.strokeStyle = pass === 0 ? PAL.out : pass === 1 ? PAL.white : PAL.silver; c.lineWidth = pass === 0 ? 2.8 : pass === 1 ? 1.5 : .35; c.beginPath(); c.moveTo(fx + 1, fy + 6); c.quadraticCurveTo(fx + 1 + Math.cos(ang) * l * .5 - 1, fy + 6 + Math.sin(ang) * l * .5, fx + 1 + Math.cos(ang) * l, fy + 6 + Math.sin(ang) * l); c.stroke(); }
      c.strokeStyle = PAL.out; c.lineWidth = 1.6; c.beginPath(); c.moveTo(fx + 2, fy + 5.5); c.lineTo(fx + 8.5, fy - 2); c.stroke(); c.strokeStyle = PAL.blue; c.lineWidth = .8; c.stroke();   // синій «язичок»
    },
    /** Юка: стовбур у рубцях і 2 голови — віяла гострих мечів: у кожного світла й тіньова половина, середня лінія й сухий кінчик. */
    yucca(c, W, H, seed) {
      const cx = W / 2, by = H - 2, O = .7; c.lineCap = 'round'; c.lineJoin = 'round';
      c.fillStyle = PAL.out; c.fillRect(cx - 6.2, by - H * .5 - O, 12.4, H * .5 + O); c.fillStyle = PAL.bark; c.fillRect(cx - 5.5, by - H * .5, 11, H * .5); c.fillStyle = PAL.out; c.fillRect(cx + 2.8, by - H * .5, 2.7, H * .5); c.fillStyle = PAL.bark; c.globalAlpha = .55; c.fillRect(cx + 2.8, by - H * .5, 2.7, H * .5); c.globalAlpha = 1;
      for (let y = by - H * .49, k = 0; y < by - 2; y += 2.6, k++) { c.fillStyle = PAL.barkHi; c.fillRect(cx - 5.2 + (k % 2) * 2.6, y, 3.4, .6); c.fillRect(cx + .2 + (k % 2) * 2, y + 1.2, 2.2, .5); c.fillStyle = PAL.out; c.fillRect(cx - 5.5, y + .9, 11, .25); }   // рубці від старого листя
      for (const [hx, hy, R, n] of [[cx - 6, by - H * .5, H * .4, 22], [cx + 7, by - H * .62, H * .38, 20]]) { const bl = []; for (let i = 0; i < n; i++) { const a = (i / (n - 1) - .5) * 3.4 + (hash(seed, i + hx) - .5) * .12; bl.push({ a, len: R * (.72 + .28 * hash(seed, i * 7 + hx)), back: Math.abs(a) > 1.1 || i % 3 === 1 }); }
        bl.sort((p, q) => (q.back - p.back) || (Math.abs(q.a) - Math.abs(p.a)));
        for (const pass of [0, 1]) for (const B of bl) { const sa = Math.sin(B.a), ca = Math.cos(B.a), ex = hx + sa * B.len, ey = hy - ca * B.len, w = 3.8, mxp = hx + sa * B.len * .45, myp = hy - ca * B.len * .45;
          const body = k => { c.beginPath(); c.moveTo(hx - ca * w / 2 * k, hy - sa * w / 2 * k); c.quadraticCurveTo(mxp - ca * w * .62 * k, myp - sa * w * .62 * k, ex, ey); if (k === 1) c.quadraticCurveTo(mxp + ca * w * .62, myp + sa * w * .62, hx + ca * w / 2, hy + sa * w / 2); else c.lineTo(hx, hy); c.closePath(); };
          if (pass === 0) { body(1); c.strokeStyle = PAL.out; c.lineWidth = 2 * O; c.stroke(); c.fillStyle = PAL.out; c.fill(); }
          else { body(1); c.fillStyle = B.back ? PAL.d1 : PAL.d2; c.fill(); body(2); c.fillStyle = B.back ? PAL.d2 : PAL.d3; c.fill(); c.strokeStyle = B.back ? PAL.d0 : PAL.hi; c.lineWidth = .35; c.beginPath(); c.moveTo(hx + sa * 3, hy - ca * 3); c.lineTo(hx + sa * B.len * .9, hy - ca * B.len * .9); c.stroke(); c.fillStyle = PAL.bark; c.fillRect(ex - .4, ey - .4, .8, .8); } } }   // сухий кінчик
    },
    /** Аспленіум (гніздовий папороть): розетка з 11 широких хвилястих листків — темна середня жилка, тонкі бічні, смуга блиску. */
    asplenium(c, W, H, seed) {
      const cx = W / 2, by = H - 2, O = .7; c.lineCap = 'round'; c.lineJoin = 'round';
      const ls = []; for (let i = 0; i < 11; i++) { const a = (i / 10 - .5) * 3 + (hash(seed, i) - .5) * .2; ls.push({ a, len: H * (.75 + .25 * hash(seed, i + 4)) * (1 - Math.abs(a) * .12), back: i % 2 === 0 }); }
      ls.sort((p, q) => (q.back - p.back) || (Math.abs(q.a) - Math.abs(p.a)));
      for (const pass of [0, 1]) for (const L of ls) { const dx = Math.sin(L.a), dy = -Math.cos(L.a), nx = Math.cos(L.a), ny = Math.sin(L.a), wd = L.len * .2, wAt = t => wd * Math.sin(t * Math.PI * .9) * (1 + .18 * Math.sin(t * 14 + seed)), P = (t, s) => [cx + dx * L.len * t + nx * s, by - 3 + dy * L.len * t + ny * s];
        const half = sd => { c.beginPath(); c.moveTo(cx, by - 3); for (let i = 1; i <= 12; i++) { const t = i / 12, q = P(t, sd * wAt(t)); c.lineTo(q[0], q[1]); } const e = P(1, 0); c.lineTo(e[0], e[1]); c.closePath(); };
        if (pass === 0) { for (const sd of [-1, 1]) { half(sd); c.strokeStyle = PAL.out; c.lineWidth = 2 * O; c.stroke(); c.fillStyle = PAL.out; c.fill(); } continue; }
        half(-1); c.fillStyle = L.back ? PAL.d2 : PAL.d3; c.fill(); half(1); c.fillStyle = L.back ? PAL.d1 : PAL.d2; c.fill();
        c.lineWidth = .3; for (const sd of [-1, 1]) { c.strokeStyle = L.back ? (sd < 0 ? PAL.d1 : PAL.d0) : (sd < 0 ? PAL.d2 : PAL.d1); for (let i = 1; i < 11; i++) { const t = i / 11, t2 = Math.min(1, t + .06), a0 = P(t, 0), a1 = P(t2, sd * wAt(t2) * .88); c.beginPath(); c.moveTo(a0[0], a0[1]); c.lineTo(a1[0], a1[1]); c.stroke(); } }   // бічні жилки
        const m0 = P(0, 0), m1 = P(.93, 0); c.strokeStyle = PAL.bark; c.lineWidth = .9; c.beginPath(); c.moveTo(m0[0], m0[1]); c.lineTo(m1[0], m1[1]); c.stroke();
        if (!L.back) { const h0 = P(.3, -wd * .45), h1 = P(.8, -wd * .4); c.strokeStyle = PAL.hi; c.lineWidth = .5; c.beginPath(); c.moveTo(h0[0], h0[1]); c.lineTo(h1[0], h1[1]); c.stroke(); } }
      EL(c, [[cx, by - 2.6, 3.2, 1.6, 0, PAL.bark]], .5);                                                                                                 // «гніздо» в серці розетки
    },
    /** Квітучі малята: DRAW отримує стадію st (0 — бутони, 1 — повне цвітіння) і пише центри квіток у c.__pts (для пелюсток і гостей).
     *  Сенполія: оксамитова розетка (жилка й пушок-блік на кожному листку), фіалкові квіти з бузковими верхніми пелюстками. */
    saintpaulia(c, W, H, seed, st = 1) {
      const cx = W / 2, by = H - 2, O = .65; c.lineJoin = 'round'; c.lineCap = 'round';
      for (const pass of [0, 1]) for (let i = 0; i < 9; i++) { const a = (i / 8 - .5) * 3.3, r = H * .55, lx = cx + Math.sin(a) * r * .75, ly = by - 4 - Math.cos(a) * r * .35, R = H * .22; c.fillStyle = pass ? (i % 2 ? PAL.d2 : PAL.d1) : PAL.out; c.beginPath(); c.ellipse(lx, ly, R + (pass ? 0 : O), R * .8 + (pass ? 0 : O), a * .3, 0, TAU); c.fill();
        if (pass) { c.fillStyle = i % 2 ? PAL.d3 : PAL.d2; c.beginPath(); c.ellipse(lx - 1, ly - 1.2, R * .5, R * .3, a * .3, 0, TAU); c.fill(); c.strokeStyle = PAL.d0; c.lineWidth = .3; c.beginPath(); c.moveTo(lx - Math.sin(a) * R * .8, ly + R * .5); c.lineTo(lx + Math.sin(a) * R * .7, ly - R * .5); c.stroke(); if (i % 2) { c.fillStyle = PAL.hi; c.fillRect(lx - 1.8, ly - 1.8, .5, .5); c.fillRect(lx - .4, ly - 2.2, .5, .5); } } }
      for (let f = 0; f < 5; f++) { const fx = cx + (f - 2) * 5.5 + (hash(seed, f) - .5) * 2, fy = by - H * .68 - (f % 2) * 3; if (bud(c, fx, fy, st, PAL.purple)) continue; const m = .5 + .5 * st, L = [];
        for (let k = 0; k < 5; k++) { const a = k / 5 * TAU + f - 1.2; L.push([fx + Math.cos(a) * 2.1 * m, fy + Math.sin(a) * 2.1 * m, 2 * m, 1.45 * m, a, k < 2 ? PAL.lilac : PAL.purple]); } EL(c, L, O);
        c.fillStyle = PAL.yellow; c.fillRect(fx - .8, fy - .5, .7, .7); c.fillRect(fx + .1, fy - .1, .7, .7); pt(c, fx, fy, PAL.purple); }
    },
    /** Каланхое: м'ясисті зубчасті листки з жилкою, три щитки дрібних чотирипелюсткових квіток. */
    kalanchoe(c, W, H, seed, st = 1) {
      const cx = W / 2, by = H - 2, O = .65; c.lineJoin = 'round'; c.lineCap = 'round';
      for (const pass of [0, 1]) for (let i = 0; i < 7; i++) { const a = (i / 6 - .5) * 2.8, r = H * .5, lx = cx + Math.sin(a) * r * .7, ly = by - 3 - Math.cos(a) * r * .4; c.fillStyle = pass ? (i % 2 ? PAL.d3 : PAL.d2) : PAL.out; c.beginPath(); const R = H * .2 + (pass ? 0 : O); for (let k = 0; k <= 24; k++) { const t = k / 24 * TAU, rr = R * (1 + .1 * Math.cos(t * 8)); c.lineTo(lx + Math.cos(t) * rr, ly + Math.sin(t) * rr * .75); } c.closePath(); c.fill();
        if (pass) { c.strokeStyle = i % 2 ? PAL.d2 : PAL.d1; c.lineWidth = .35; c.beginPath(); c.moveTo(lx - H * .15, ly); c.lineTo(lx + H * .15, ly); c.stroke(); c.fillStyle = i % 2 ? PAL.hi : PAL.d3; c.beginPath(); c.ellipse(lx - 1, ly - H * .07, H * .08, H * .03, 0, 0, TAU); c.fill(); } }
      for (let s2 = 0; s2 < 3; s2++) { const sx = cx + (s2 - 1) * 8, sy = by - H * .55; c.strokeStyle = PAL.out; c.lineWidth = 2.1; c.beginPath(); c.moveTo(sx, sy + 6); c.lineTo(sx, sy - 4); c.stroke(); c.strokeStyle = PAL.stemHi; c.lineWidth = .9; c.stroke();
        if (bud(c, sx, sy - 5, st, PAL.orange)) continue; const m = .4 + .6 * st, L = [];
        for (let k = 0; k < 10; k++) { const a = hash(seed, s2 * 9 + k) * TAU, r = (1 + hash(seed, k + s2) * 3.6) * m; L.push([sx + Math.cos(a) * r, sy - 5 + Math.sin(a) * r * .7, 1.35 * m, 1.35 * m, 0, k % 3 ? PAL.orange : PAL.red]); } EL(c, L, .55);
        c.fillStyle = PAL.yellow; for (const q of L) c.fillRect(q[0] - .3, q[1] - .3, .6, .6); pt(c, sx, sy - 5, PAL.orange); }
    },
    /** Антуріум: глянцеві серця листя з жилками, червоні покривала з блиском і жовтий качан. */
    anthurium(c, W, H, seed, st = 1) {
      const cx = W / 2, by = H - 2, O = .7; c.lineCap = 'round'; c.lineJoin = 'round';
      const heart = (x, y, R, ang, fill, hi, vein) => { for (const pass of [0, 1]) { c.save(); c.translate(x, y); c.rotate(ang); c.fillStyle = pass ? fill : PAL.out; const e = pass ? 0 : O; c.beginPath(); c.moveTo(0, R + e); c.bezierCurveTo(-R * 1.1 - e, R * .3, -R * 1.1 - e, -R * .8 - e, 0, -R * .35); c.bezierCurveTo(R * 1.1 + e, -R * .8 - e, R * 1.1 + e, R * .3, 0, R + e); c.fill();
        if (pass) { if (hi) { c.fillStyle = hi; c.beginPath(); c.moveTo(0, R); c.bezierCurveTo(-R * 1.1, R * .3, -R * 1.1, -R * .8, 0, -R * .35); c.closePath(); c.fill(); }
          c.strokeStyle = vein; c.lineWidth = .32; c.beginPath(); c.moveTo(0, -R * .3); c.lineTo(0, R * .85); for (const s of [-1, 1]) { c.moveTo(0, -R * .2); c.quadraticCurveTo(s * R * .6, -R * .3, s * R * .75, R * .1); c.moveTo(0, R * .1); c.quadraticCurveTo(s * R * .45, R * .1, s * R * .55, R * .45); } c.stroke(); } c.restore(); } };
      const stalk = (x, y, col) => { c.strokeStyle = PAL.out; c.lineWidth = 2.3; c.beginPath(); c.moveTo(cx, by - 3); c.lineTo(x, y); c.stroke(); c.strokeStyle = col; c.lineWidth = 1; c.stroke(); };
      for (const [a, r, back] of [[-1.1, .5, 1], [1.0, .5, 1], [-.45, .62, 0], [.5, .6, 0], [0, .42, 0]]) { const lx = cx + Math.sin(a) * H * r * .8, ly = by - 4 - Math.cos(a) * H * r * .6; stalk(lx, ly, PAL.stem); heart(lx, ly - 3, H * .17, a * .5 + Math.PI, back ? PAL.d1 : PAL.d2, back ? PAL.d2 : PAL.d3, back ? PAL.d0 : PAL.hi); }
      for (const [a, r] of [[-.7, .95], [.6, 1.0]]) { const fx = cx + Math.sin(a) * H * r * .45, fy = by - 4 - Math.cos(a) * H * r * .75; stalk(fx, fy + 2, PAL.stemHi); if (bud(c, fx, fy, st, PAL.red)) continue; const R = H * .14 * (.5 + .5 * st); heart(fx, fy - 2, R, a * .4 + Math.PI, PAL.red, PAL.pink, PAL.terra);
        c.fillStyle = PAL.white; c.beginPath(); c.ellipse(fx - R * .45, fy - 2 - R * .2, R * .14, R * .3, .5, 0, TAU); c.fill();
        c.strokeStyle = PAL.out; c.lineWidth = 2.5; c.beginPath(); c.moveTo(fx, fy - 2); c.lineTo(fx + Math.sin(a * .4) * 7 * st, fy - 2 - Math.cos(a * .4) * 7 * st); c.stroke(); c.strokeStyle = PAL.yellow; c.lineWidth = 1.3; c.stroke(); c.strokeStyle = PAL.cream; c.lineWidth = .4; c.stroke(); pt(c, fx, fy - 2, PAL.red); }
    },
    /** Віола: листки з жилкою, «личка» — темні верхні пелюстки, жовта нижня з вусиками. */
    viola(c, W, H, seed, st = 1) {
      const cx = W / 2, by = H - 2, O = .6; c.lineCap = 'round';
      for (const pass of [0, 1]) for (let i = 0; i < 8; i++) { const a = (i / 7 - .5) * 3, lx = cx + Math.sin(a) * W * .4, ly = by - 3 - Math.cos(a) * H * .25; c.fillStyle = pass ? (i % 2 ? PAL.d2 : PAL.d1) : PAL.out; c.beginPath(); c.ellipse(lx, ly, 2.6 + (pass ? 0 : O), 3.4 + (pass ? 0 : O), a, 0, TAU); c.fill(); if (pass) { c.strokeStyle = i % 2 ? PAL.d3 : PAL.d2; c.lineWidth = .32; c.beginPath(); c.moveTo(lx + Math.sin(a) * 2.6, ly - Math.cos(a) * 2.6); c.lineTo(lx - Math.sin(a) * 2.6, ly + Math.cos(a) * 2.6); c.stroke(); } }
      for (let f = 0; f < 4; f++) { const fx = cx + (f - 1.5) * 7 + (hash(seed, f) - .5) * 2, fy = by - H * .6 - (f % 2) * 4, cols = f % 2 ? [PAL.purple, PAL.yellow, PAL.lilac] : [PAL.lilac, PAL.yellow, PAL.purple];
        c.strokeStyle = PAL.out; c.lineWidth = 1.9; c.beginPath(); c.moveTo(fx, fy + 3); c.lineTo(fx + (f - 1.5) * .8, by - 4); c.stroke(); c.strokeStyle = PAL.stemHi; c.lineWidth = .8; c.stroke(); if (bud(c, fx, fy, st, cols[0])) continue; const m = .5 + .5 * st;
        EL(c, [[-2.2, -2, 2.4, cols[0]], [2.2, -2, 2.4, cols[0]], [-2.6, .8, 2, cols[2]], [2.6, .8, 2, cols[2]], [0, 2.2, 2.8, cols[1]]].map(([dx, dy, r, col]) => [fx + dx * m, fy + dy * m, r * m, r * .85 * m, 0, col]), O);
        c.strokeStyle = PAL.purple; c.lineWidth = .3; c.beginPath(); for (const s of [-.9, -.3, .3, .9]) { c.moveTo(fx, fy + 1 * m); c.lineTo(fx + s * 1.6 * m, fy + 3.6 * m); } c.stroke();
        c.fillStyle = PAL.out; c.beginPath(); c.arc(fx, fy + .8 * m, .8, 0, TAU); c.fill(); c.fillStyle = PAL.orange; c.fillRect(fx - .4, fy + .4 * m, .8, .8); pt(c, fx, fy, cols[0]); }
    },
    /** Примула: зморшкуваті листки з жилками, щиток квіток із жовтим вічком. */
    primula(c, W, H, seed, st = 1) {
      const cx = W / 2, by = H - 2, O = .65; c.lineJoin = 'round'; c.lineCap = 'round';
      for (const pass of [0, 1]) for (let i = 0; i < 7; i++) { const a = (i / 6 - .5) * 3.1, lx = cx + Math.sin(a) * W * .36, ly = by - 3 - Math.cos(a) * H * .2; c.save(); c.translate(lx, ly); c.rotate(a * .6); c.fillStyle = pass ? (i % 2 ? PAL.d2 : PAL.d1) : PAL.out; c.beginPath(); const e = pass ? 0 : O; for (let k = 0; k <= 28; k++) { const t = k / 28 * TAU, rr = (1 + .08 * Math.cos(t * 11)); c.lineTo(Math.cos(t) * (3 + e) * rr, Math.sin(t) * (5 + e) * rr); } c.closePath(); c.fill();
        if (pass) { c.strokeStyle = i % 2 ? PAL.d3 : PAL.d2; c.lineWidth = .32; c.beginPath(); c.moveTo(0, 4.2); c.lineTo(0, -4); for (const y of [-2, 0, 2]) for (const s of [-1, 1]) { c.moveTo(0, y + .8); c.lineTo(s * 2.1, y - .6); } c.stroke(); } c.restore(); }
      c.strokeStyle = PAL.out; c.lineWidth = 2.4; c.beginPath(); c.moveTo(cx, by - 4); c.lineTo(cx, by - H * .6); c.stroke(); c.strokeStyle = PAL.stemHi; c.lineWidth = 1.1; c.stroke();
      const m = .5 + .5 * st; for (let f = 0; f < 6; f++) { const a = f / 6 * TAU + .3, fx = cx + Math.cos(a) * 6.5, fy = by - H * .66 + Math.sin(a) * 3.5, col = f % 2 ? PAL.pink : PAL.cream; if (st < .3) { bud(c, fx, fy, st, col); continue; } const L = []; for (let k = 0; k < 5; k++) { const b = k / 5 * TAU + f; L.push([fx + Math.cos(b) * 1.9 * m, fy + Math.sin(b) * 1.9 * m, 1.55 * m, 1.3 * m, b, col]); } EL(c, L, O);
        c.fillStyle = PAL.orange; c.beginPath(); c.arc(fx, fy, 1.2 * m, 0, TAU); c.fill(); c.fillStyle = PAL.yellow; c.fillRect(fx - .5, fy - .5, 1, 1); pt(c, fx, fy, col); }
    },
    // ---------- (· 39) висячі: малюються від ГОРИ (y 0 — гачок), кашпо зверху, рослина звисає ----------
    /** (16.11, 23:10) КУЩ ЛІАНИ над вікном (спрайт 4 px/од., гачок — центр верху): від вузла під кліпсою розходяться пагони за вдачею
     *  виду (HAB) — свій силует, своє листя, своя зелень; квіти FLW[вид] уздовж пагонів чи на кінцях, зі стадією st (0 — бутони,
     *  1 — повний цвіт); на вільних кінцях — вусики. Над пагонами — шапка листя, що ховає вузол. */
    _garland(c, W, H0, seed, st, kind) { const H = HAB[kind], G = H.g.map(k => PAL[k]), cx = W / 2; c.lineCap = 'round'; c.lineJoin = 'round';
      const one = (L, Wd, back) => { blade(c, L, Wd); c.strokeStyle = PAL.out; c.lineWidth = 1.1; c.stroke(); c.fillStyle = back ? G[0] : G[1]; c.fill(); c.beginPath(); c.moveTo(0, 0); c.quadraticCurveTo(L * .45, -Wd, L, 0); c.closePath(); c.fillStyle = back ? G[1] : G[2]; c.fill(); c.strokeStyle = back ? PAL.out : G[0]; c.lineWidth = .28; c.beginPath(); c.moveTo(.3, 0); c.lineTo(L * .85, 0); c.stroke(); };
      const leaf = (x, y, ang, back, k = 1, type = H.leaf) => { const s = H.lk * k; c.save(); c.translate(x, y); c.rotate(ang);
        if (type === 'oval') one(4.2 * s, 1.7 * s, back); else if (type === 'lance') one(5.4 * s, 1.15 * s, back);
        else if (type === 'round') { one(2.9 * s, 2 * s, back); c.rotate(Math.PI); one(2.9 * s, 2 * s, back); }
        else if (type === 'tri') { c.strokeStyle = PAL.out; c.lineWidth = .9; c.beginPath(); c.moveTo(0, 0); c.lineTo(1.6 * s, 0); c.stroke(); c.strokeStyle = G[1]; c.lineWidth = .35; c.stroke(); c.translate(1.6 * s, 0); for (const a of [-.75, .75, 0]) { c.save(); c.rotate(a); one(3.3 * s, 1 * s, back); c.restore(); } }
        else { const R = 5.2 * s; c.strokeStyle = PAL.out; c.lineWidth = .9; c.beginPath(); c.moveTo(0, 0); c.lineTo(R, 0); c.stroke(); c.strokeStyle = G[1]; c.lineWidth = .35; c.stroke(); for (let j = 1; j <= 3; j++) for (const sd of [-1, 1]) { c.save(); c.translate(R * j / 3.6, 0); c.rotate(sd * 1.05); one(2.1 * s, .8 * s, back); c.restore(); } c.save(); c.translate(R, 0); one(2.2 * s, .8 * s, back); c.restore(); }
        c.restore(); };
      const S0 = [], nodes = []; for (let i = 0; i < H.n; i++) { const u = H.n > 1 ? i / (H.n - 1) * 2 - 1 : 0, r = hash(seed, i), len = H.len[0] + (H.len[1] - H.len[0]) * (1 - Math.abs(u) * .25) * (.1 + .9 * hash(seed * 3, i * 7 + 2)), K = Math.max(4, Math.round(len / 1.7)), sx = cx + u * 5.5, dx = u * H.sp + (r - .5) * 2, pts = [];
        for (let k = 0; k <= K; k++) { const t = k / K; pts.push([sx + dx * (1 - (1 - t) * (1 - t)) + Math.sin(t * 4.2 + i * 1.7 + seed) * H.wav * t, 2.4 + len * Math.pow(t, H.py)]); } S0.push({ pts, back: i % 2 === 0, i, u }); }
      S0.sort((p, q) => q.back - p.back);
      for (const V of S0) { c.strokeStyle = PAL.out; c.lineWidth = 1.5; c.beginPath(); V.pts.forEach((q, k) => k ? c.lineTo(q[0], q[1]) : c.moveTo(q[0], q[1])); c.stroke(); c.strokeStyle = V.back ? PAL.stem : PAL.stemHi; c.lineWidth = .55; c.stroke();
        const K = V.pts.length - 1, endFl = H.fl === 't' || V.i % 2 === 1;
        for (let k = 1; k <= K; k++) { const [x, y] = V.pts[k], sd = (k + V.i) % 2 ? -1 : 1, isFl = H.fl === 'a' ? (k >= 2 && k < K && (k + V.i) % H.fd === 0) : false;
          if (k === K) { if (endFl) nodes.push({ x, y, i: k, v: V.i, back: V.back, sd }); continue; }
          if (isFl) nodes.push({ x: x - sd * .9, y, i: k, v: V.i, back: V.back, sd }); else if (k % H.ld === 0 || H.ld === 2 && H.fl === 't') leaf(x, y, (sd > 0 ? .55 : Math.PI - .55) + (hash(seed + V.i, k) - .5) * .5, V.back, .8 + .3 * hash(seed + k, V.i)); }
        if (!endFl) { const e = V.pts[K]; c.strokeStyle = PAL.out; c.lineWidth = 1.2; c.beginPath(); c.moveTo(e[0], e[1]); c.bezierCurveTo(e[0] + 1.6, e[1] + 1.6, e[0] + 1.8, e[1] + 3.4, e[0] + .4, e[1] + 3.2); c.stroke(); c.strokeStyle = PAL.stemHi; c.lineWidth = .4; c.stroke(); } }   // вусик на вільному кінці
      const CN = H.leaf === 'pinn' || H.leaf === 'tri' ? 7 : 9; for (const back of [true, false]) for (let j = 0; j < CN; j++) { if ((j % 2 === 0) !== back) continue; const f = j / (CN - 1), a = Math.PI * (.2 + .6 * f) + (hash(seed, j + 40) - .5) * .4; leaf(cx + (f - .5) * 10, 2.4 + Math.sin(f * Math.PI) * .6, a, back, .95); }   // шапка листя над вузлом
      EL(c, [[cx, 1.7, 2.2, 1.1, 0, PAL.bark]]); c.fillStyle = PAL.barkHi; c.fillRect(cx - 1.4, 1.1, 2.4, .4);                                                                                    // здерев'янілий вузол під кліпсою
      nodes.sort((p, q) => q.back - p.back || p.y - q.y); for (const N of nodes) FLW[kind](c, N, st); },
    /** (16.11, 23:10) ЛОЗА ВЗДОВЖ РЕЙКИ: тонкий пагін обвиває рейку від куща до куща (видно лише витки «спереду»), з дрібним листям і
     *  вусиками — десять кущів читаються як один сад. Один спрайт на всю довжину рейки. */
    _railvine(c, W, H0, seed) { c.lineCap = 'round'; c.lineJoin = 'round'; const Y = x => 2.6 + 1.9 * Math.sin(x * .42), front = x => Math.cos(x * .42) > -.25;
      const seg = (lw, col, dy = 0) => { c.strokeStyle = col; c.lineWidth = lw; let on = false; c.beginPath(); for (let x = 0; x <= W; x += .5) { if (front(x)) { on ? c.lineTo(x, Y(x) + dy) : c.moveTo(x, Y(x) + dy); on = true; } else on = false; } c.stroke(); };
      seg(1.5, PAL.out); seg(.7, PAL.stem); seg(.25, PAL.stemHi, -.2);
      for (let x = 3, k = 0; x < W - 2; x += 3.4 + hash(seed, k) * 2.6, k++) { if (!front(x) || Math.abs(((x + 2.5) % 45) - 22.5) < 7) continue; const up = k % 2 === 0, a = up ? -1.1 - hash(k, 3) * .8 : 1.1 + hash(k, 4) * .8; c.save(); c.translate(x, Y(x)); c.rotate(a);
        if (k % 7 === 3) { c.strokeStyle = PAL.out; c.lineWidth = 1.1; c.beginPath(); c.moveTo(0, 0); c.bezierCurveTo(1.5, .2, 2.6, -1, 1.6, -1.6); c.stroke(); c.strokeStyle = PAL.stemHi; c.lineWidth = .35; c.stroke(); }
        else { const L = 2.3 + hash(k, 9) * 1.2; blade(c, L, L * .42); c.strokeStyle = PAL.out; c.lineWidth = 1; c.stroke(); c.fillStyle = k % 3 ? PAL.d2 : PAL.d1; c.fill(); c.beginPath(); c.moveTo(0, 0); c.quadraticCurveTo(L * .45, -L * .42, L, 0); c.closePath(); c.fillStyle = k % 3 ? PAL.d3 : PAL.d2; c.fill(); } c.restore(); } },
    /** Калатея (мала, передня): розетка округлих листків із темно-світлими смугами й пурпуровим низом. */
    calathea(c, W, H, seed) { const cx = W / 2, by = H - 2; c.lineJoin = 'round';
      const ls = []; for (let i = 0; i < 9; i++) { const a = (i / 8 - .5) * 3 + (hash(seed, i) - .5) * .2; ls.push({ a, len: H * (.55 + .4 * hash(seed, i + 2)), back: i % 2 === 0 }); } ls.sort((p, q) => q.back - p.back);
      for (const pass of [0, 1]) for (const L of ls) { const ex = cx + Math.sin(L.a) * L.len * .8, ey = by - 4 - Math.cos(L.a) * L.len * .8, R = H * .2; c.strokeStyle = PAL.out; c.lineWidth = 2.4; c.beginPath(); c.moveTo(cx, by - 3); c.lineTo(ex, ey); c.stroke(); if (pass) { c.strokeStyle = '#7a3a6a'; c.lineWidth = 1; c.stroke(); }
        c.save(); c.translate(ex, ey); c.rotate(L.a * .6); c.fillStyle = pass ? (L.back ? PAL.d1 : PAL.d2) : PAL.out; const e = pass ? 0 : 1.4; c.beginPath(); c.ellipse(0, 0, R + e, R * 1.35 + e, 0, 0, TAU); c.fill();
        if (pass) { c.fillStyle = L.back ? PAL.d2 : PAL.hi; for (let k = -3; k <= 3; k++) { c.beginPath(); c.ellipse(k * R * .3, 0, R * .1, R * 1.2 * (1 - Math.abs(k) * .12), 0, 0, TAU); c.fill(); } c.fillStyle = PAL.d0; c.fillRect(-.5, -R * 1.3, 1, R * 2.6); } c.restore(); } },
    /** Алоказія (мала, передня): 4 стрілоподібні листки з білими жилками на високих черешках. */
    alocasia(c, W, H, seed) { const cx = W / 2, by = H - 2; c.lineJoin = 'round'; c.lineCap = 'round';
      const ls = [[-.9, .8, 1], [.8, .85, 1], [-.3, 1, 0], [.4, .95, 0]];
      for (const pass of [0, 1]) for (const [a, l, back] of ls) { const ex = cx + Math.sin(a) * H * l * .5, ey = by - 4 - Math.cos(a) * H * l * .75; c.strokeStyle = PAL.out; c.lineWidth = 3; c.beginPath(); c.moveTo(cx, by - 3); c.lineTo(ex, ey); c.stroke(); if (pass) { c.strokeStyle = back ? PAL.stem : PAL.stemHi; c.lineWidth = 1.3; c.stroke(); }
        const R = H * .22; c.save(); c.translate(ex, ey); c.rotate(a * .5); c.fillStyle = pass ? (back ? PAL.d1 : PAL.d2) : PAL.out; const e = pass ? 0 : 1.4; c.beginPath(); c.moveTo(0, R * 1.3 + e); c.lineTo(-R - e, -R * .2); c.lineTo(-R * .45, -R * 1.1 - e); c.lineTo(0, -R * .6); c.lineTo(R * .45, -R * 1.1 - e); c.lineTo(R + e, -R * .2); c.closePath(); c.fill();
        if (pass) { c.strokeStyle = back ? PAL.d3 : PAL.cream; c.lineWidth = .9; c.beginPath(); c.moveTo(0, R * 1.1); c.lineTo(0, -R * .5); c.moveTo(0, R * .3); c.lineTo(-R * .7, -R * .3); c.moveTo(0, R * .3); c.lineTo(R * .7, -R * .3); c.moveTo(0, -R * .2); c.lineTo(-R * .35, -R * .85); c.moveTo(0, -R * .2); c.lineTo(R * .35, -R * .85); c.stroke(); } c.restore(); } },
    /** Цереус: стовп із двома бічними пагонами — п'ять ребер у трьох тонах, ареоли з променями колючок, блік на маківці. */
    cereus(c, W, H, seed) {
      const cx = W / 2, by = H - 2, O = .7, T = [PAL.d1, PAL.d2, PAL.d3, PAL.d2, PAL.d1], col = (x, y0, w, h, r) => { c.fillStyle = PAL.out; c.beginPath(); c.roundRect(x - w / 2 - O, y0 - O, w + 2 * O, h + 2 * O, r + O); c.fill();
        c.save(); c.beginPath(); c.roundRect(x - w / 2, y0, w, h, r); c.clip(); const rb = 5, rw = w / rb;
        for (let i = 0; i < rb; i++) { c.fillStyle = T[i]; c.fillRect(x - w / 2 + i * rw, y0, rw + .1, h); if (i) { c.fillStyle = PAL.d0; c.fillRect(x - w / 2 + i * rw - .15, y0, .3, h); } }
        c.fillStyle = PAL.hi; c.fillRect(x - w / 2 + 2 * rw + .3, y0 + 1.2, .5, h * .45); c.restore();
        for (let i = 0; i < rb; i++) for (let y = y0 + 2.5 + (i % 2) * 1.6; y < y0 + h - 2; y += 3.4) { const ax = x - w / 2 + (i + .5) * rw; c.strokeStyle = PAL.spine; c.lineWidth = .22; c.beginPath(); for (const a of [-2.4, -1.57, -.75]) { c.moveTo(ax, y); c.lineTo(ax + Math.cos(a) * 1.1, y + Math.sin(a) * 1.1); } c.stroke(); c.fillStyle = PAL.cream; c.fillRect(ax - .3, y - .3, .6, .6); } };
      col(cx - 5, by - H * .55, 7, H * .55, 3.5); col(cx + 5, by - H * .68, 7, H * .68, 3.5); col(cx, by - H + 2, 9, H - 2, 4.5);
      EL(c, [[cx, by - 1.6, 7.5, 2, 0, PAL.bark]], .5); c.fillStyle = PAL.barkHi; for (let k = 0; k < 5; k++) c.fillRect(cx - 6 + k * 2.7, by - 2.4 + (k % 2) * .8, 1.2, .5);
    },
    /** Нічна квітка цереуса (окремий спрайт, малюється лише вночі): велика біла воронка з жовтою серединою на боці стовпа. */
    cereusBloom(c, W, H) {
      const cx = W / 2 - 6, cy = H * .3; c.lineCap = 'round'; c.strokeStyle = PAL.out; c.lineWidth = 3.5; c.beginPath(); c.moveTo(cx + 8, cy + 6); c.lineTo(cx + 2, cy + 2); c.stroke(); c.strokeStyle = PAL.d2; c.lineWidth = 1.6; c.stroke();
      for (const pass of [0, 1]) for (let i = 0; i < 9; i++) { const a = Math.PI * .55 + (i / 8 - .5) * 2.6, l = 7 + (i % 2) * 2; c.strokeStyle = pass ? PAL.white : PAL.out; c.lineWidth = pass ? 2.2 : 4.2; c.beginPath(); c.moveTo(cx + 2, cy + 2); c.lineTo(cx + 2 + Math.cos(a) * l, cy + 2 + Math.sin(a) * l); c.stroke(); }
      c.fillStyle = PAL.spine; c.beginPath(); c.arc(cx + 2, cy + 2, 1.8, 0, TAU); c.fill();
    },
  };
  for (const k of Object.keys(FLW)) DRAW[k] = (c, W, H, seed, st = 1) => DRAW._garland(c, W, H, seed, st, k);   // види гірлянди — секції однієї лози
  // ---------- піксельний прохід: поріг альфи, палітра, рім з боку світла ----------
  function pixelize(cv) {
    const w = cv.width, h = cv.height, c = cv.getContext('2d'), im = c.getImageData(0, 0, w, h), d = im.data, n = w * h, op = new Uint8Array(n);
    for (let i = 0; i < n; i++) { const q = i * 4; if (d[q + 3] < 110) { d[q + 3] = 0; continue; } d[q + 3] = 255; op[i] = 1;
      let best = 0, bd = 1e9; for (let k = 0; k < HEX.length; k++) { const P = HEX[k], dd = (d[q] - P[0]) ** 2 + (d[q + 1] - P[1]) ** 2 + (d[q + 2] - P[2]) ** 2; if (dd < bd) { bd = dd; best = k; } }
      d[q] = HEX[best][0]; d[q + 1] = HEX[best][1]; d[q + 2] = HEX[best][2]; }
    const RL = HEX[Object.keys(PAL).indexOf('rimL')], RR = HEX[Object.keys(PAL).indexOf('rimR')], OUTI = HEX[0];
    for (let y = 0; y < h; y++) for (let x = 0; x < w; x++) { const i = y * w + x; if (!op[i]) continue; const q = i * 4;
      const isOut = d[q] === OUTI[0] && d[q + 1] === OUTI[1] && d[q + 2] === OUTI[2]; if (!isOut) continue;                                   // рім — лише на контурних пікселях
      const upL = (y > 0 && x > 0 && !op[i - w - 1]) || (y > 0 && !op[i - w]) || (x > 0 && !op[i - 1]), upR = (y > 0 && x < w - 1 && !op[i - w + 1]) || (y > 0 && !op[i - w]) || (x < w - 1 && !op[i + 1]);
      if (upL && hash(x, y) < .85) { d[q] = RL[0]; d[q + 1] = RL[1]; d[q + 2] = RL[2]; } else if (upR && hash(x, y + 7) < .7) { d[q] = RR[0]; d[q + 1] = RR[1]; d[q + 2] = RR[2]; } }
    c.putImageData(im, 0, 0); return cv;
  }
  const SPR = {}, PADU = 40;                                                                                      // запас полотна, щоб крайні лопаті не різалися
  /** Спрайт героя: малюємо на великому полотні, далі обрізаємо до вмісту (нічого не різане) і запам'ятовуємо, де в ньому точка основи. */
  function spriteOf(p, kind = p.kind, stage = STAGES - 1) {
    const key = kind + ':' + stage; if (SPR[key]) return SPR[key]; const S = p.S || 4, P = PADU, big = document.createElement('canvas'); big.width = (p.w + 2 * P) * S; big.height = (p.h + 2 * P) * S; const c = big.getContext('2d'); c.scale(S, S); c.translate(P, P); c.__pts = []; DRAW[kind](c, p.w, p.h, p.seed, stage / (STAGES - 1));
    const pts = c.__pts.map(([x, y, col]) => [x - p.w / 2, y - p.h, col]);                                               // центри квіток відносно основи (од. кімнати)
    pixelize(big); const im = c.getImageData(0, 0, big.width, big.height).data; let x0 = big.width, y0 = big.height, x1 = -1, y1 = -1;
    for (let y = 0; y < big.height; y++) for (let x = 0; x < big.width; x++) if (im[(y * big.width + x) * 4 + 3]) { if (x < x0) x0 = x; if (x > x1) x1 = x; if (y < y0) y0 = y; if (y > y1) y1 = y; }
    if (x1 < 0) { x0 = y0 = 0; x1 = y1 = 1; } const cv = document.createElement('canvas'); cv.width = x1 - x0 + 1; cv.height = y1 - y0 + 1; cv.getContext('2d').drawImage(big, -x0, -y0);
    cv.base = [(P + p.w / 2) * S - x0, (P + (p.hang ? 0 : p.h)) * S - y0]; cv.S = S; cv.pts = pts;                        // висячі: основа — точка гачка (центр верху)                                        // точка основи (центр низу) у пікселях спрайта
    if (!p.hang) { const g = cv.getContext('2d'), gy = cv.base[1], gr = g.createLinearGradient(0, gy - Math.min(cv.height * .55, 36 * S), 0, gy); g.globalCompositeOperation = 'source-atop';   // (17.11) глибина: низ куща в тіні сусідів, задній ряд — у синьому серпанку
      gr.addColorStop(0, 'rgba(4,10,26,0)'); gr.addColorStop(1, 'rgba(4,10,26,' + (p.back ? .62 : p.h < 40 ? .28 : .5) + ')'); g.fillStyle = gr; g.fillRect(0, 0, cv.width, cv.height); if (p.back) { g.fillStyle = 'rgba(44,56,150,.2)'; g.fillRect(0, 0, cv.width, cv.height); } }
    return SPR[key] = cv;
  }
  const px = (c, x, y, w, h, col) => { c.fillStyle = col; c.fillRect(x, y, w, h); };
  /** (17.11) ВЕРХ КОРОБА (4 px/од., малюється раз): металева рама зі скосом, заклепками й поділками, під нею тінь; ґрунт — мульча з кори,
   *  камінці, перліт і подушечки моху. Неон, краплі й індикатори — живі, у drawJar. */
  let JTOP = null;
  function jarTop() { if (JTOP) return JTOP; const S = 4, w = JAR.x1 - JAR.x0, d = JAR.d, cv = document.createElement('canvas'); cv.width = w * S; cv.height = d * S; const c = cv.getContext('2d'); c.scale(S, S);
    const R = (x, y, ww, hh, col) => { c.fillStyle = col; c.fillRect(x, y, ww, hh); };
    R(0, 0, w, d, '#1a2148'); R(0, 0, w, .5, '#4a5aa0'); R(0, .5, w, .5, '#2c3672'); R(0, d - .6, w, .6, '#0c1026'); R(0, 0, .6, d, '#2c3672'); R(w - .6, 0, .6, d, '#0c1026');                 // рама зі скосом
    R(2, 1.5, w - 4, d - 3, '#120c08'); R(2, 1.5, w - 4, 1, '#050408'); R(2, 2.5, w - 4, .5, '#1c130c'); R(2, 1.5, .5, d - 3, '#050408');                                               // ґрунт і тінь від рами
    for (let k = 0; k < 520; k++) { const x = 2.5 + hash(k, 1) * (w - 6), y = 3 + hash(k, 2) * (d - 5.2), r = hash(k, 3);
      if (r < .5) R(x, y, .8 + hash(k, 4) * 1.4, .5, r < .25 ? '#4a3220' : '#2e1f14'); else if (r < .7) R(x, y, .5, .5, '#6a4a2c'); else if (r < .82) { R(x, y, 1, .75, '#5a6478'); R(x, y, .5, .25, '#8a94a8'); } else if (r < .9) R(x, y, .25, .25, '#e8e4d8'); else { R(x - .25, y, 1.75, .75, '#1f4a2a'); R(x, y - .25, 1.25, .5, '#3a7a3e'); R(x + .25, y - .25, .5, .25, '#6ab85a'); } }   // кора, камінці, перліт, мох
    for (let x = 5; x < w - 4; x += 12) { R(x, d - 1.25, .75, .5, '#5a6aa8'); R(x + .25, d - 1.25, .25, .25, '#b8c8ff'); }                                                                // заклепки
    for (let x = 3; x < w - 2; x += 3) R(x, .5, .25, x % 12 === 3 ? .75 : .5, '#6a7ac0');                                                                                                  // поділки на кромці
    return JTOP = cv; }
  /** Жардиньєр: довгий кібер-короб; видно верх (кант з неоном, ґрунт) над спинкою дивана. */
  function drawJar(c, t, LK) {
    const { x0, x1, y, h, d } = JAR, top = y - h, w = x1 - x0;
    c.save(); c.globalAlpha = .35; c.fillStyle = '#000'; c.fillRect(x0 - 3, y - 1, w + 6, 3); c.restore();
    px(c, x0, top, w, h, '#10142e'); px(c, x0 + 1, top + d, w - 2, h - d, '#171c3e');                                                      // корпус
    for (let x = x0 + 6; x < x1 - 6; x += 12) px(c, x, top + d + 6, 7, 1, '#2a3468');                                                        // щілини вентиляції
    c.save(); c.imageSmoothingEnabled = false; c.drawImage(jarTop(), x0, top, w, d); c.restore();                                              // (17.11) верх короба — чіткий, намальований раз
    c.save(); c.globalCompositeOperation = 'lighter'; c.globalAlpha = .85 * Math.min(1.3, LK); px(c, x0, top, w, .9, '#3be8ff'); px(c, x0, top + d - .8, w, .6, '#3be8ff');
    c.globalAlpha = .18 * LK; const g = c.createLinearGradient(0, top - 6, 0, top); g.addColorStop(0, 'rgba(59,232,255,0)'); g.addColorStop(1, 'rgba(59,232,255,1)'); c.fillStyle = g; c.fillRect(x0, top - 6, w, 6); c.restore();   // неон і його відсвіт
    px(c, x0 + 4, top + 4.5, w - 8, 1, '#3a4a6a'); for (let x = x0 + 18; x < x1 - 10; x += 26) { px(c, x, top + 4, 2, 2, '#5a6a8a'); const ph = (t * .5 + x * .013) % 1; if (HUM.drip && ph < .3) { c.save(); c.globalAlpha = .9 - ph * 2; px(c, x + .5, top + 6 + ph * 10, 1, 1.6, '#8ae8ff'); c.restore(); } }   // крапельна трубка з емітерами, краплі в ґрунт
    for (let k = 0; k < 3; k++) { const on = Math.floor(t * 1.5 + k) % 3 === 0; c.save(); c.globalAlpha = on ? .95 : .3; px(c, x1 - 12 + k * 3, top + d + 2, 1.6, 1.2, on ? '#3bff8a' : '#1a6a3a'); c.restore(); }   // індикатори
  }
  let hit = null;
  // ---------- (· 38) ЖИТТЯ ЖАРДИНЬЄРА: цвітіння по циклу, пелюстки, вологість і дисплей, гості-комахи, відблиск на дивані ----------
  const TOP = () => JAR.y - JAR.h + 2;
  const FL = HEROES.filter(p => FLOWERS.includes(p.kind)); FL.forEach((p, i) => { p.t0 = -PERIOD * (.25 + .6 * i / FL.length); });   // цикли зсунуто — цвітуть не разом
  /** Стадія цвітіння 0..1 за часом: бутон (0–.15 циклу) → розкривання (до .25) → повне (до .8) → опадання (стрибком) → бутон. */
  HANG.forEach((p, i) => { p.t0 = -PERIOD * (.3 + .55 * ((i * 2) % HANG.length) / HANG.length); });   // (16.11) ліани над вікном цвітуть тим самим циклом, кожна у свій час
  const stageOf = (p, t) => { const u = ((t - p.t0) % PERIOD + PERIOD) % PERIOD / PERIOD; return u < .15 ? 0 : u < .25 ? (u - .15) / .1 : u < .8 ? 1 : 0; };
  const PET = [], HUM = { v: .9, drip: 0 };
  function flowerPts(p, t) { const cv = spriteOf(p, p.kind, Math.round(stageOf(p, t) * (STAGES - 1))); return cv.pts.map(([x, y, col]) => [p.x + x, TOP() + y, col]); }
  /** Пелюстки летять з квіток рослини p (n штук) — лягають на кант і зникають. */
  function shed(p, t, n = 6) { const pts = flowerPts(p, t); if (!pts.length) return; for (let i = 0; i < n; i++) { const q = pts[(i * 7 + p.seed) % pts.length]; PET.push({ x: q[0] + (Math.random() - .5) * 2, y: q[1], vx: (Math.random() - .5) * 6, vy: -4 - Math.random() * 6, col: q[2], t0: t, ph: Math.random() * TAU }); } }
  /** (16.11) Квіти арки (секція p) у координатах кімнати з кольором — звідси летять пелюстки й сюди підлітає дрон-колібрі. */
  function hangPts(p, t) { const cv = spriteOf(p, p.kind, Math.round(stageOf(p, t) * (STAGES - 1))); return cv.pts.map(([x, y, col]) => [p.x + x, HOOK_Y + y + p.h, col]); }
  /** Пелюстки з арки: колір — тієї квітки, з якої зірвались. (16.11, 21:58, власник: «щоб пелюсток падало менше — іноді одна-дві, і щоб
   *  падали реалістичніше, як падає пелюстка») падають рідко й «гойдалкою»: пелюстка ковзає вбік, сповільнюється й перевертається на
   *  краю розмаху, тоді ковзає назад (sw — частота, amp — розмах, vt — швидкість падіння, dr — знесення). */
  function shedHang(p, t, n = 1) { const pts = hangPts(p, t); if (!pts.length) return; for (let i = 0; i < n; i++) { const q = pts[Math.floor(Math.random() * pts.length)]; PET.push({ x: q[0] + (Math.random() - .5) * 2, y: q[1] + 1, col: q[2], t0: t + i * .9, ph: Math.random() * TAU, life: 70, big: 1, sw: 1.5 + Math.random() * .9, amp: 5 + Math.random() * 5, vt: 2.6 + Math.random() * 1.6, dr: (Math.random() - .5) * 1.6 }); } }
  const ARC = { next: 4 };
  function tickLife(t, dt) {
    for (const p of HANG) { const st = stageOf(p, t); if (p.lastSt === 1 && st === 0) shedHang(p, t, 2); p.lastSt = st; }                  // (16.11) секція відцвіла — дві пелюстки
    if (t > ARC.next) { const bl = HANG.filter(p => stageOf(p, t) > .6); if (bl.length) shedHang(bl[Math.floor(Math.random() * bl.length)], t, Math.random() < .25 ? 2 : 1); ARC.next = t + 8 + Math.random() * 10; }   // зрідка — одна, часом дві
    for (const p of FL) { const st = stageOf(p, t); if (p.lastSt === 1 && st === 0) shed(p, t, 7); p.lastSt = st; }                  // цикл добіг до опадання
    HUM.v = Math.max(0, HUM.v - dt / 300); if (HUM.v < .3) HUM.drip = 1; if (HUM.drip) { HUM.v = Math.min(1, HUM.v + dt / 40); if (HUM.v >= .95) HUM.drip = 0; }   // сама поливається, як пересохла
    for (let i = PET.length - 1; i >= 0; i--) { const q = PET[i], a = t - q.t0; if (a > (q.life || 9)) { PET.splice(i, 1); continue; } if (a < 0) continue;
      if (q.big && q.y < TOP() + 3) { const ph = q.ph + q.sw * a; q.x += (q.amp * Math.sin(ph) + q.dr) * dt; q.y += q.vt * (.4 + .6 * Math.abs(Math.cos(ph))) * dt; if (q.y >= TOP() + 3) { q.y = TOP() + 3 + Math.random() * 3; q.land = t; } continue; }
      if (q.y < TOP() + 3) { q.vy += 14 * dt; q.vy = Math.min(q.vy, q.cap || 9); q.x += (q.vx + Math.sin(t * 5 + q.ph) * 6) * dt; q.y += q.vy * dt; if (q.y >= TOP() + 3) { q.y = TOP() + 3 + Math.random() * 3; q.land = t; } } }
  }
  /** (16.11) ДРОН-КОЛІБРІ гірлянди: один, перелітає від квітки до квітки (зависає, крильця миготять). Метелики кімнати — окремий модуль
   *  objects/decor_bfly.js: вони тікають від цього дрона (NX.planters.drone()) й сідають на ці квіти (NX.planters.perches()). */
  const HB = { x: 777, y: 24, t: 0, k: -1, tx: 777, ty: 24, dir: 1 };
  const BEES = [0, 1, 2].map(i => ({ x: 610 + i * 160, y: 16, tx: 0, ty: 0, next: 0, i, dir: 1 })), BT = { t: 0 };
  /** (16.11, 23:10) БДЖОЛИ-ЗАПИЛЮВАЧІ (три, вдень): перелітають із квітки на квітку, частіше на сусідній кущ; уночі спочивають. */
  function drawBees(c, t, night, all) {
    const dt = Math.min(.1, Math.max(0, t - BT.t)); BT.t = t; if (night > .6) return;
    for (const b of BEES) { if (t > b.next) { const near = all.filter(q => Math.abs(q[0] - b.x) < 70), L = near.length && Math.random() < .7 ? near : all, q = L[Math.floor(Math.random() * L.length)]; b.tx = q[0] + (Math.random() - .5) * 1.5; b.ty = q[1] - 1.6; b.next = t + 2.5 + Math.random() * 4.5; }
      const dx = b.tx - b.x, dy = b.ty - b.y, d = Math.hypot(dx, dy), stp = Math.min(d, 34 * dt); if (d > .05) { b.x += dx / d * stp; b.y += dy / d * stp; if (Math.abs(dx) > .5) b.dir = dx > 0 ? 1 : -1; }
      const x = b.x + Math.sin(t * 9 + b.i * 2) * (d > 1 ? 1.1 : .35), y = b.y + Math.sin(t * 13 + b.i) * (d > 1 ? .9 : .3), wf = Math.sin(t * 70 + b.i);
      c.save(); c.translate(x, y); c.scale(b.dir, 1); c.globalAlpha = (1 - night / .6);
      c.fillStyle = '#04120c'; c.beginPath(); c.ellipse(0, 0, 1.75, 1.2, 0, 0, TAU); c.fill(); c.fillStyle = '#ffd84a'; c.beginPath(); c.ellipse(0, 0, 1.3, .8, 0, 0, TAU); c.fill(); c.fillStyle = '#04120c'; c.fillRect(-.55, -.8, .4, 1.6); c.fillRect(.25, -.75, .4, 1.5); c.fillRect(1.05, -.4, .5, .5);
      c.globalAlpha *= .6; c.fillStyle = '#e8f6ff'; c.beginPath(); c.ellipse(-.3, -1.2 - wf * .3, 1.1, .55, -.5 + wf * .3, 0, TAU); c.fill(); c.beginPath(); c.ellipse(.5, -1.1 + wf * .3, .9, .45, .4 - wf * .3, 0, TAU); c.fill(); c.restore(); }
  }
  /** (16.11, 23:10) НІЧ У ВИСЯЧОМУ САДУ: квіти ледь світяться своїм кольором, між кущами — світлячки. */
  function drawNightGarden(c, t, night, all) {
    if (night < .03) return; c.save(); c.globalCompositeOperation = 'lighter';
    for (let i = 0; i < all.length; i++) { const q = all[i]; c.globalAlpha = night * (.3 + .1 * Math.sin(t * 1.1 + i)); c.fillStyle = q[2]; c.beginPath(); c.arc(q[0], q[1], 3, 0, TAU); c.fill(); }
    for (let i = 0; i < 8; i++) { const a = night * Math.max(0, Math.sin(t * 1.25 + i * 1.9)); if (a < .03) continue; const w = RAIL.x1 - RAIL.x0 - 20, x = RAIL.x0 + 10 + ((i * 61 + Math.sin(t * .17 + i * 2.3) * 34 + 800) % w), y = 23 + 10 * Math.sin(t * .29 + i * 1.7) + 3 * Math.sin(t * .9 + i);
      c.globalAlpha = a * .3; c.fillStyle = '#c8ff6a'; c.beginPath(); c.arc(x, y, 3.6, 0, TAU); c.fill(); c.globalAlpha = a; c.fillStyle = '#eaffa0'; c.fillRect(x - .8, y - .8, 1.6, 1.6); }
    c.restore();
  }
  function drawArcLife(c, t, night = 0) {
    const all = HANG.flatMap(p => hangPts(p, t)); if (!all.length) return; drawNightGarden(c, t, night, all); drawBees(c, t, night, all);
    const k = Math.floor(t / 5.2); if (k !== HB.k) { HB.k = k; const q = all[Math.floor(hash(k, 5) * all.length)]; HB.dir = q[0] > HB.x ? 1 : -1; HB.tx = q[0] - HB.dir * 7; HB.ty = q[1] - .8; }
    const dt = Math.min(.1, Math.max(0, t - HB.t)); HB.t = t; HB.x += (HB.tx - HB.x) * Math.min(1, dt * 2.4); HB.y += (HB.ty - HB.y) * Math.min(1, dt * 2.4);
    const dx = HB.x + Math.sin(t * 2.1) * .5, dy = HB.y + Math.sin(t * 3.3) * .7; HB.dx = dx; HB.dy = dy;
    { const wf = Math.sin(t * 40); c.save(); c.translate(dx, dy); c.scale(HB.dir * 1.3, 1.3); c.lineCap = 'round';
      c.globalAlpha = .5; c.fillStyle = '#bff6ff'; c.beginPath(); c.moveTo(-.4, -.6); c.lineTo(-3.8, -3.4 - wf * 1.3); c.lineTo(1.3, -2.8 - wf * .9); c.closePath(); c.fill(); c.globalAlpha = .28; c.beginPath(); c.moveTo(-.4, .2); c.lineTo(-3.6, 2.6 + wf * 1.1); c.lineTo(.8, 2 + wf * .7); c.closePath(); c.fill();   // крильця миготять
      c.globalAlpha = 1; c.fillStyle = '#04120c'; c.beginPath(); c.moveTo(-2.4, 0); c.lineTo(-5, -1.1); c.lineTo(-4.7, 1.3); c.closePath(); c.fill(); c.fillStyle = '#1a2048'; c.beginPath(); c.moveTo(-2.4, .1); c.lineTo(-4.5, -.6); c.lineTo(-4.3, .9); c.closePath(); c.fill();   // хвіст
      c.fillStyle = '#04120c'; c.beginPath(); c.ellipse(0, 0, 3, 1.8, 0, 0, TAU); c.fill(); c.beginPath(); c.arc(2.3, -.6, 1.6, 0, TAU); c.fill(); c.fillStyle = '#2ac8c0'; c.beginPath(); c.ellipse(0, 0, 2.4, 1.25, 0, 0, TAU); c.fill(); c.fillStyle = '#8af0e0'; c.fillRect(-1.6, -.9, 2.6, .4);
      c.fillStyle = '#e8f0ff'; c.beginPath(); c.ellipse(.3, .6, 1.5, .5, 0, 0, TAU); c.fill(); c.fillStyle = '#1a2048'; c.beginPath(); c.arc(2.3, -.6, 1.1, 0, TAU); c.fill(); c.fillStyle = '#3be8ff'; c.fillRect(2.5, -1, .7, .7);
      c.strokeStyle = '#04120c'; c.lineWidth = .8; c.beginPath(); c.moveTo(3.2, -.5); c.lineTo(5.8, -.1); c.stroke(); c.strokeStyle = '#b8c8d8'; c.lineWidth = .36; c.stroke();
      c.globalCompositeOperation = 'lighter'; c.globalAlpha = .7; c.fillStyle = '#3be8ff'; c.fillRect(-2.9, .7, .8, .8); c.restore(); }
  }
  function drawPetals(c, t) { for (const q of PET) { const a = q.land ? Math.max(0, 1 - (t - q.land) / 6) : 1; c.globalAlpha = a; c.fillStyle = q.col; const r = q.land ? 0 : Math.sin(t * 6 + q.ph); if (q.big) { if (t < q.t0) continue; const ph = q.ph + q.sw * (t - q.t0), tilt = q.land ? .2 : Math.sin(ph) * .95, wd = q.land ? 1 : .35 + .65 * Math.abs(Math.cos(ph));   // пелюстка-човник: нахиляється за рухом, на краю розмаху видно ребром
      c.save(); c.translate(q.x, q.y); c.rotate(tilt); c.fillStyle = '#04120c'; c.beginPath(); c.ellipse(0, 0, 1.9, 1.15 * wd + .45, 0, 0, TAU); c.fill(); c.fillStyle = q.col; c.beginPath(); c.ellipse(0, 0, 1.45, .8 * wd, 0, 0, TAU); c.fill(); c.globalAlpha = a * .45; c.fillStyle = '#ffffff'; c.fillRect(-.9, -.35 * wd, .9, .3); c.restore(); continue; }
      c.fillRect(q.x - 1, q.y - .6, 2 + Math.abs(r), 1.2); } c.globalAlpha = 1; }
  /** Голодисплей на лівому краю канта: вологість (крапля + смуга), температура (стовпчик), кільце таймера поливу. Без тексту. */
  function drawPanel(c, t, LK) {
    const x = JAR.x0 + 2, y = TOP() - 32, w = 54, h = 24, a = .75 + .15 * Math.sin(t * 3), T = NX.t, n = NX.planters.PL.length;
    c.save(); c.globalAlpha = .72; c.fillStyle = '#071226'; c.fillRect(x, y, w, h); c.globalAlpha = a * Math.min(1.2, LK); c.strokeStyle = '#3be8ff'; c.lineWidth = .6; c.strokeRect(x + .3, y + .3, w - .6, h - .6);
    c.fillStyle = '#3be8ff'; c.fillRect(x, y + h, 1, 8); c.fillRect(x + w - 1, y + h, 1, 8);                                                                   // ніжки до канта
    NX.px.text(c, T('decor.garden.title'), x + w / 2, y + 5.5, '#7aff9a', 3.1, 'center'); NX.px.text(c, T('decor.garden.count', { n }), x + w / 2, y + 10.5, '#9ad8ff', 2.5, 'center');   // (· 43) табличка-голограма
    c.fillStyle = '#1a3a5a'; c.fillRect(x + 3, y + 12.6, w - 6, .5);
    const hv = HUM.v, hc = hv < .3 ? '#ff6a5a' : '#3be8ff'; c.fillStyle = hc; c.beginPath(); c.moveTo(x + 5, y + 15); c.lineTo(x + 7, y + 18.5); c.lineTo(x + 3, y + 18.5); c.closePath(); c.fill(); c.fillRect(x + 3, y + 18, 4, 1.5);   // крапля
    c.globalAlpha = .35 * a; c.fillRect(x + 9, y + 16, 16, 2.2); c.globalAlpha = a; c.fillRect(x + 9, y + 16, 16 * hv, 2.2);                                     // смуга вологості
    c.fillStyle = '#ffb04a'; c.fillRect(x + 30, y + 15, 2, 4); c.fillRect(x + 29.5, y + 18, 3, 1.5); c.globalAlpha = .35 * a; c.fillRect(x + 34, y + 16, 12, 2.2); c.globalAlpha = a; c.fillRect(x + 34, y + 16, 12 * (.55 + .05 * Math.sin(t * .3)), 2.2);   // температура
    c.strokeStyle = '#b8ff3a'; c.lineWidth = 1; c.beginPath(); c.arc(x + w - 4.5, y + 17, 2.4, -Math.PI / 2, -Math.PI / 2 + TAU * ((t * .02) % 1)); c.stroke();   // кільце таймера
    if (HUM.drip) { c.globalAlpha = .5 + .5 * Math.sin(t * 8); c.fillStyle = '#8ae8ff'; c.fillRect(x + 9, y + 20.5, 16, 1.2); }
    c.restore();
  }
  // ---------- гості: колібрі-бражник удень, нічний метелик до квітки цереуса (метелики — objects/decor_bfly.js) ----------
  const BUG = {}; function bug(kind) { if (BUG[kind]) return BUG[kind]; const S = 2, cv = document.createElement('canvas'); cv.width = 20 * S; cv.height = 12 * S; const c = cv.getContext('2d'); c.scale(S, S);
    if (kind === 'moth') { for (const sd of [-1, 1]) { c.fillStyle = '#2a2018'; c.beginPath(); c.ellipse(10 + sd * 4, 6, 4.4, 3, sd * .5, 0, TAU); c.fill(); c.fillStyle = '#9a8a60'; c.beginPath(); c.ellipse(10 + sd * 4, 6, 3.2, 2, sd * .5, 0, TAU); c.fill(); c.fillStyle = '#e8d8a0'; c.fillRect(10 + sd * 4 - .5, 5.5, 1, 1); } c.fillStyle = '#3a2a18'; c.fillRect(9, 3, 2, 7); }
    if (kind === 'hum' || kind === 'humW') { c.fillStyle = '#2a1a10'; c.beginPath(); c.ellipse(10, 7, 4.5, 2.4, 0, 0, TAU); c.fill(); c.fillStyle = '#8a6a3a'; c.beginPath(); c.ellipse(10, 7, 3.4, 1.6, 0, 0, TAU); c.fill(); c.fillStyle = '#ff7a30'; c.fillRect(11.5, 7.5, 2.5, 1); c.fillStyle = '#2a1a10'; c.fillRect(14.5, 6.5, 5, .8);   // тіло, помаранчеві задні крила, хоботок
      c.fillStyle = kind === 'hum' ? '#6a5a40' : '#c8b890'; c.beginPath(); c.ellipse(9, kind === 'hum' ? 3.5 : 5, 2.2, kind === 'hum' ? 3 : 1.4, .3, 0, TAU); c.fill(); }
    return BUG[kind] = cv; }
  const VIS = { tgt: null, t0: -9, from: null };
  function drawVisitors(c, t, night) {
    const day = 1 - night; c.save(); c.imageSmoothingEnabled = false;
    if (day > .05) { const pts = FL.flatMap(p => flowerPts(p, t)); if (pts.length) {
      if (!VIS.tgt || t - VIS.t0 > 7) { VIS.from = VIS.tgt; VIS.tgt = pts[Math.floor(hash(Math.floor(t / 7), 1) * pts.length)]; VIS.t0 = t; }                  // бражник: зависає біля квітки, через 7 с — до іншої
      const q = VIS.tgt, f = Math.min(1, (t - VIS.t0) / 1.2), e = f * f * (3 - 2 * f), src = VIS.from || q, hx = src[0] + (q[0] - src[0]) * e - 9 + Math.sin(t * 7) * .6, hy = src[1] + (q[1] - src[1]) * e - 5 + Math.sin(t * 9) * .8;
      c.save(); c.globalAlpha = day; c.translate(hx, hy); c.drawImage(bug(Math.floor(t * 30) % 2 ? 'humW' : 'hum'), -7, -4.9, 14, 8.4); c.restore(); } }
    if (night > .05) { const cp = HEROES.find(p => p.kind === 'cereus'), bx = cp.x - 4, by = TOP() - cp.h * .7 + 2, a = t * 1.6, r = 7 + Math.sin(t * .9) * 3, x = bx + Math.cos(a) * r, y = by + Math.sin(a * 1.3) * r * .5 - 2;   // нічний метелик кружляє біля квітки цереуса
      c.globalAlpha = night; c.translate(x, y); if (Math.cos(a) < 0) c.scale(-1, 1); const k = Math.floor(t * 12) % 2 ? .6 : 1; c.drawImage(bug('moth'), -6.5 * k, -4, 13 * k, 7.8); }
    c.restore();
  }
  /** (· 39) Стельова рейка з LED і гачками, висячі рослини: гойдаються від гачка (зсув низу), вночі LED ярче. */
  function drawHanging(c, t, LK, night) {
    const { x0, x1, y } = RAIL; px(c, x0, y, x1 - x0, 3, '#0c1026'); px(c, x0, y + 3, x1 - x0, .8, '#2a3468');
    c.save(); c.globalCompositeOperation = 'lighter'; c.globalAlpha = .6 + .4 * night; for (let x = x0 + 6; x < x1 - 4; x += 11) px(c, x, y + 1.2, 2, .8, Math.floor(x / 11 + t * 2) % 7 === 0 ? '#ffffff' : '#3be8ff'); c.restore();
    { const cv = spriteOf(RVINE), S = cv.S; c.save(); c.imageSmoothingEnabled = false; c.drawImage(cv, RVINE.x - cv.base[0] / S, y - 1 - cv.base[1] / S, cv.width / S, cv.height / S); c.restore(); }   // лоза вздовж рейки
    for (const p of HANG) { const st = stageOf(p, t), cv = spriteOf(p, p.kind, Math.round(st * (STAGES - 1))), S = cv.S, w = cv.width / S, h = cv.height / S, bx = cv.base[0] / S, by = cv.base[1] / S, sh = Math.sin(t * .55 + p.x * .012) * .016 + Math.sin(t * 1.7 + p.x * .03) * .004;   // кущі гойдаються одним подихом
      c.save(); c.imageSmoothingEnabled = false; c.translate(p.x, HOOK_Y); c.transform(1, 0, sh, 1, 0, 0); c.drawImage(cv, -bx, -by, w, h); c.restore();
      px(c, p.x - 3, y - .4, 6, 5, '#04060f'); px(c, p.x - 2.5, y, 5, 4.2, '#161c40'); px(c, p.x - 2.5, y, 5, .7, '#3a4a8a'); px(c, p.x - 2.5, y + 3.6, 5, .6, '#0a0e22'); px(c, p.x - 1.4, y + 1.5, 2.8, 1.5, '#04060f');   // кліпса-тримач
      c.save(); c.globalCompositeOperation = 'lighter'; c.globalAlpha = st >= 1 ? .75 + .25 * Math.sin(t * 2.2 + p.x) : st > 0 ? .9 : .55; px(c, p.x - 1, y + 1.8, 2, .9, st >= 1 ? '#ff6ad8' : st > 0 ? '#ffd84a' : '#3be8ff'); c.restore(); }   // вогник: бутони — блакитний, розкривається — жовтий, цвіте — рожевий
    drawArcLife(c, t, night);   // (13.11) білий спалах-прямокутник при тапі прибрано (власник: «без обводок і рамок»)
  }
  // ---------- (· 41) ЖИТТЯ ЛИСТЯ: новий листок після поливу, пожовклий листок падає на кант, Nexi прибирає (prune); гекон; гроу-лампа; роса ----------
  const LEAFY = HEROES.filter(p => p.young), FALLEN = [], LIFE = { nextOld: 240 + Math.random() * 120 };
  function youngLeaf(c, k, lit) {                                                                                            // згорнутий молодий листок: конус, що розкривається (k 0..1)
    const L = 10 + 8 * k, w = 2 + 4 * k; c.lineCap = 'round'; c.lineJoin = 'round';
    for (const pass of [0, 1]) { c.fillStyle = pass ? (lit ? PAL.hi : PAL.d3) : PAL.out; const e = pass ? 0 : 1.2; c.beginPath(); c.moveTo(0, e); c.quadraticCurveTo(-w - e, -L * .5, -w * .3, -L - e); c.lineTo(w * .3, -L - e); c.quadraticCurveTo(w + e, -L * .5, 0, e); c.fill(); }
    c.strokeStyle = PAL.d2; c.lineWidth = .9; c.beginPath(); c.moveTo(0, -1); c.lineTo(0, -L * .9); c.stroke(); if (k > .5) { c.strokeStyle = PAL.cream; c.lineWidth = .7; c.beginPath(); c.moveTo(-w * .5, -L * .3); c.lineTo(-w * .7, -L * .7); c.stroke(); }
  }
  function oldLeaf(c, k) {                                                                                                   // пожовклий листок (k 0..1 — жовтіє далі й опускається)
    const L = 16, w = 5; c.lineJoin = 'round'; c.rotate(k * .5);
    for (const pass of [0, 1]) { c.fillStyle = pass ? (k < .5 ? '#c8c84a' : '#e8a83a') : PAL.out; const e = pass ? 0 : 1.3; c.beginPath(); c.moveTo(0, e); c.quadraticCurveTo(-w - e, -L * .4, 0, -L - e); c.quadraticCurveTo(w + e, -L * .4, 0, e); c.fill(); }
    c.fillStyle = '#8a5a2a'; for (let i = 0; i < 4; i++) c.fillRect(-2 + (i % 2) * 3, -L * .25 - i * 2.8, 1.2, 1.2); c.strokeStyle = '#8a7a2a'; c.lineWidth = .8; c.beginPath(); c.moveTo(0, -1); c.lineTo(0, -L * .9); c.stroke();
  }
  function lifeTick(t, dt) {
    for (const p of LEAFY) { if (p.old && !p.old.dropped && t - p.old.t0 > 70) { p.old.dropped = 1; FALLEN.push({ x: p.x + p.old.dx, y: TOP() + p.old.dy, y1: TOP() + 2 + Math.random() * 3, vx: (Math.random() - .5) * 8, t0: t, ph: Math.random() * TAU, land: 0 }); p.old = null; }
      if (p.young && t - p.young.t0 > 110) p.young = null; }
    if (t > LIFE.nextOld) { LIFE.nextOld = t + 240 + Math.random() * 180; const cand = LEAFY.filter(p => !p.old); if (cand.length && FALLEN.length < 3) { const p = cand[Math.floor(Math.random() * cand.length)]; p.old = { t0: t, dx: p.oldA[0], dy: p.oldA[1] }; } }
    for (const f of FALLEN) { if (f.land) continue; f.y += Math.min(10, 4 + (t - f.t0) * 6) * dt; f.x += (f.vx + Math.sin(t * 4 + f.ph) * 7) * dt; if (f.y >= f.y1) { f.y = f.y1; f.land = t; } }
  }
  function drawLife(c, t, LK) {
    const top = TOP();
    for (const p of LEAFY) { if (p.young) { const k = Math.min(1, (t - p.young.t0) / 90), a = t - p.young.t0 > 95 ? Math.max(0, 1 - (t - p.young.t0 - 95) / 15) : 1; c.save(); c.globalAlpha = a; c.translate(p.x + p.youngA[0], top + p.youngA[1]); c.rotate(p.youngA[2] + Math.sin(t * .9) * .04); c.scale(.6 + .4 * k, .6 + .4 * k); youngLeaf(c, k, !p.back); c.restore(); }
      if (p.old) { const k = Math.min(1, (t - p.old.t0) / 70); c.save(); c.translate(p.x + p.oldA[0], top + p.oldA[1]); c.rotate(p.oldA[2] + Math.PI + Math.sin(t * 1.3) * .05); oldLeaf(c, k); c.restore(); } }
    for (const f of FALLEN) { c.save(); c.translate(f.x, f.y); c.rotate(f.land ? 1.4 : Math.sin(t * 3 + f.ph) * .6); c.scale(.7, .7); oldLeaf(c, 1); c.restore(); }
    void LK;
  }
  // гекон: живе на ареці, повільно перелазить між трьома точками, підлаштовує колір під листя, язиком стріляє в метелика поруч
  const GK = { pts: [[-18, -38], [8, -58], [24, -30]], i: 0, j: 0, t0: -99, next: 30 + Math.random() * 20, tongue: -9 };
  const GECKO = [0, 1].map(f => { const cv = document.createElement('canvas'); cv.width = 36; cv.height = 16; const c = cv.getContext('2d'); c.scale(2, 2);
    c.fillStyle = PAL.out; c.beginPath(); c.ellipse(9, 4.5, 6.5, 2.6, 0, 0, TAU); c.fill(); c.beginPath(); c.ellipse(15.2, 4, 2.6, 2, 0, 0, TAU); c.fill(); c.beginPath(); c.moveTo(3, 4.5); c.quadraticCurveTo(-1, 2 + f * 3, 0.5, 7 - f * 3); c.lineWidth = 2.2; c.strokeStyle = PAL.out; c.stroke();
    c.fillStyle = '#7ac85a'; c.beginPath(); c.ellipse(9, 4.5, 5.5, 1.8, 0, 0, TAU); c.fill(); c.beginPath(); c.ellipse(15.2, 4, 1.9, 1.4, 0, 0, TAU); c.fill(); c.strokeStyle = '#7ac85a'; c.lineWidth = 1.1; c.beginPath(); c.moveTo(3.5, 4.5); c.quadraticCurveTo(-1, 2 + f * 3, 0.5, 7 - f * 3); c.stroke();
    c.fillStyle = '#4a8a3a'; for (let i = 0; i < 4; i++) c.fillRect(5 + i * 2.4, 3.6, 1, 1); c.fillStyle = PAL.out; for (const [x, y] of [[6, 6.2], [11.5, 6.2], [6.5 + f, 2.6], [12 - f, 2.6]]) { c.fillRect(x, y, .9, 1.6 - (y < 3 ? .9 : 0)); c.fillRect(x - .6, y + (y < 3 ? -.4 : 1.2), 2.1, .6); }
    c.fillStyle = '#101010'; c.fillRect(16.3, 3.2, 1, 1); c.fillStyle = '#ffffff'; c.fillRect(16.3, 3.2, .5, .5); return cv; });
  function drawGecko(c, t, night) {
    const A = HEROES.find(p => p.kind === 'areca'); if (!A) return; const top = TOP();
    if (t > GK.next) { GK.next = t + 35 + Math.random() * 25; GK.i = GK.j; GK.j = (GK.j + 1 + Math.floor(Math.random() * 2)) % 3; GK.t0 = t; }
    const u = Math.min(1, (t - GK.t0) / 7), e = u * u * (3 - 2 * u), a = GK.pts[GK.i], b = GK.pts[GK.j], x = A.x + a[0] + (b[0] - a[0]) * e, y = top + a[1] + (b[1] - a[1]) * e, moving = u < 1, fr = moving ? Math.floor(t * 6) % 2 : 0, dir = b[0] >= a[0] ? 1 : -1;
    c.save(); c.imageSmoothingEnabled = false; c.translate(x, y); if (dir < 0) c.scale(-1, 1); c.rotate(moving ? Math.atan2(b[1] - a[1], Math.abs(b[0] - a[0])) * .5 : 0); c.drawImage(GECKO[fr], -9, -4, 18, 8);
    c.globalCompositeOperation = 'source-atop'; c.globalAlpha = .35 + .25 * Math.sin(t * .3 + GK.j); c.fillStyle = night > .5 ? '#2a4a8a' : '#1a6a3a'; c.fillRect(-9, -4, 18, 8); c.restore();   // маскується під листя
    if (!moving && VIS.tgt && Math.hypot(VIS.tgt[0] - x, VIS.tgt[1] - y) < 26 && t - GK.tongue > 12 && hash(Math.floor(t), 3) < .02) GK.tongue = t;
    if (t - GK.tongue < .3) { const k = Math.sin((t - GK.tongue) / .3 * Math.PI), tx = x + dir * (8 + 18 * k), ty = y - 1 - 4 * k; c.save(); c.strokeStyle = '#ff6a8a'; c.lineWidth = 1; c.beginPath(); c.moveTo(x + dir * 8, y - 1); c.lineTo(tx, ty); c.stroke(); c.fillStyle = '#ff6a8a'; c.fillRect(tx - .8, ty - .8, 1.6, 1.6); c.restore(); }
  }
  /** Гроу-лампа на рейці (вночі): рожево-фіолетова смуга і рожевий відтінок на верхівках листя. */
  function drawGrowLamp(c, t, night) {
    if (night < .03) return; const { x0, x1, y } = RAIL; c.save(); c.globalCompositeOperation = 'lighter'; c.globalAlpha = night * (.5 + .1 * Math.sin(t * 1.3)); px(c, x0 + 30, y + 3.5, x1 - x0 - 60, 1, '#ff4fd8'); c.restore();   // (· 45) лише смуга — без конуса й відтінку на листі (власник: рослини тьмяніли)
  }
  /** Роса на світанку: блискітки на квітках і листі, гаснуть із днем. */
  function drawDew(c, t) {
    const nm = NX.daylight && NX.daylight.name ? NX.daylight.name(t) : 'day'; if (nm !== 'dawn') return; const v = NX.daylight.v(t), a = Math.max(0, 1 - Math.abs(v - .45) / .4); if (a <= 0) return; const top = TOP();
    c.save(); c.globalCompositeOperation = 'lighter'; for (const p of HEROES) { if (p.hang) continue; for (let i = 0; i < 6; i++) { const x = p.x + (hash(p.seed, i) - .5) * p.w * .8, y = top - p.h * (.15 + .7 * hash(p.seed, i + 9)), tw = .5 + .5 * Math.sin(t * 3 + i * 1.7 + p.seed); c.globalAlpha = a * tw; c.fillStyle = '#e8ffff'; c.fillRect(x, y, 1, 1); c.globalAlpha = a * tw * .4; c.fillRect(x - 1, y, 3, 1); c.fillRect(x, y - 1, 1, 3); } } c.restore();
  }
  for (const p of LEAFY) { p.youngA = p.young; p.oldA = p.old; p.young = null; p.old = null; }                              // якорі → youngA/oldA; стан — young/old
  let lastT = 0;
  NX.planters = {
    JAR, HEROES, HANG, RAIL, PL: HEROES.concat(HANG), FLOWERS,
    tap(x, y) { let best = null; for (const p of HEROES) { const top = TOP(); if (x >= p.x - p.w / 2 && x <= p.x + p.w / 2 && y >= top - p.h && y <= top) { const d = Math.abs(x - p.x) / (p.w / 2); if (!best || d < best.d) best = { p, d }; } }
      if (!best) return false; hit = best.p.kind; best.p.flash = NX.time; if (FLOWERS.includes(hit)) shed(best.p, NX.time, 3); return true; },
    get lastKind() { return hit; },
    tapHang(x, y) { let best = null; for (const p of HANG) if (x >= p.x - p.w / 2 - 4 && x <= p.x + p.w / 2 + 4 && y >= HOOK_Y - 3 && y <= HOOK_Y + p.h + 2) { const d = Math.abs(x - p.x) / (p.w / 2); if (!best || d < best.d) best = { p, d }; } if (!best) return false; hit = best.p.kind; best.p.flash = NX.time; shedHang(best.p, NX.time, 1); return true; },
    sprite: spriteOf,
    /** (16.11) Для метеликів кімнати (objects/decor_bfly.js): квіти, на які можна сісти — гірлянда над вікном і квіти на підвіконні. */
    perches(t = NX.time) { return HANG.flatMap(p => hangPts(p, t)).concat(FL.flatMap(p => flowerPts(p, t))); },
    /** Де зараз дрон-колібрі гірлянди — метелики від нього тікають. */
    drone() { return HB.dx == null ? null : [HB.dx, HB.dy]; },
    /** Полив (Nexi, activities.js jardin): вологість повна, бутони, що чекали, одразу йдуть у розкривання; квіти «кивають» пелюстками. */
    water(t = NX.time) { HUM.v = 1; HUM.drip = 0; for (const p of LEAFY) if (!p.young && hash(Math.floor(t), p.seed) < .7) p.young = { t0: t + 20 + 40 * hash(p.seed, 5) }; for (const p of FL) { const u = ((t - p.t0) % PERIOD + PERIOD) % PERIOD / PERIOD; if (u < .15 || u >= .8) p.t0 = t - PERIOD * .15; shed(p, t, 2); } },
    hum() { return HUM.v; },
    /** (· 44) Nexi пересаджує: один із передніх малят (крім квітучих у повному цвіті) міняється на вид із ротації — калатея, алоказія,
     *  і назад на квітку; повертає {from, to} або null. */
    repot(t = NX.time) { const ROT = ['calathea', 'alocasia', 'saintpaulia', 'kalanchoe', 'viola', 'primula'], slots = HEROES.filter(p => p.slot); if (!slots.length) return null;
      const p = slots.reduce((a, b) => (a.rep || 0) <= (b.rep || 0) ? a : b), used = new Set(HEROES.map(q => q.kind)), cand = ROT.filter(k => !used.has(k)); if (!cand.length) return null;
      const to = cand[Math.floor(hash(Math.floor(t), p.seed) * cand.length)], from = p.kind; p.kind = to; p.rep = t; p.t0 = t - PERIOD * .1; p.young = null; p.flash = t; if (!FLOWERS.includes(to)) { p.w = 34; p.h = 30; } else { p.w = 30; p.h = 24; }
      if (FLOWERS.includes(to) && !FL.includes(p)) FL.push(p); if (!FLOWERS.includes(to)) { const i = FL.indexOf(p); if (i >= 0) FL.splice(i, 1); } hit = to; return { from, to }; },
    repotSpot() { const slots = HEROES.filter(p => p.slot), p = slots.reduce((a, b) => (a.rep || 0) <= (b.rep || 0) ? a : b), top = TOP(), z = NX.persp.zOf((352 - NX.persp.VP[1]) / (372 - NX.persp.VP[1])); return { x: p.x, y: top - 30, z, dir: p.x < 790 ? 1 : -1 }; },
    /** (· 42) Де Nexi сидить на канті: між філодендроном і арекою; hoverAt ставить її на точку (y — рівень канта, вона «сидить» на ньому). */
    rimSpot() { const top = TOP(), z = NX.persp.zOf((352 - NX.persp.VP[1]) / (372 - NX.persp.VP[1])); return { x: RIMX, y: top + 6, z }; },   // (17.11) де стати на канті — за останнім тапом
    sitSpot() { const top = TOP(), z = NX.persp.zOf((352 - NX.persp.VP[1]) / (372 - NX.persp.VP[1])); return { x: 764, y: top - 14, z, dir: 1 }; },
    /** (· 42) Рудик копає ґрунт: грудки летять, вологість трохи падає; Nexi (якщо вільна) свариться. */
    dig(x, t = NX.time) { for (let i = 0; i < 5; i++) PET.push({ x: x + (Math.random() - .5) * 4, y: TOP() + 1, vx: (Math.random() - .5) * 14, vy: -8 - Math.random() * 10, col: Math.random() < .5 ? '#3a2a18' : '#1c1410', t0: t - 6, ph: Math.random() * TAU }); HUM.v = Math.max(0, HUM.v - .05); },
    /** (· 41) Є пожовклий або опалий листок — Nexi йде з кошиком (activities.js prune). */
    needsPrune() { return FALLEN.length > 0 || LEAFY.some(p => p.old); },
    pruneSpot() { const p = LEAFY.find(q => q.old) || LEAFY[0], top = TOP(), z = NX.persp.zOf((352 - NX.persp.VP[1]) / (372 - NX.persp.VP[1])); return { x: p.x, y: top - 36, z, dir: p.x < 790 ? 1 : -1 }; },
    prune(t = NX.time) { let n = FALLEN.length; FALLEN.length = 0; for (const p of LEAFY) if (p.old) { p.old = null; n++; p.young = p.young || { t0: t + 10 }; } return n; },
    needsWater() { return HUM.v < .35 && !HUM.drip; },
    /** Струснути рослину (Рудик нюхає й чхає): пелюстки летять. */
    shake(kind, t = NX.time) { const p = FL.find(q => q.kind === kind) || FL[0]; shed(p, t, 8); p.flash = t; },
    /** Куди Nexi цілить лійкою: дві точки над жардиньєром (екран, од. кімнати) з глибиною задньої стіни. */
    waterSpots() { const top = TOP(), z = NX.persp.zOf((352 - NX.persp.VP[1]) / (372 - NX.persp.VP[1])); return [{ id: 'jarL', x: 724, y: top - 34, z, dir: 1 }, { id: 'jarR', x: 846, y: top - 34, z, dir: -1 }]; },
    /** Місце для Рудика на канті між віолою й примулою: точка на канті й точка підлоги перед диваном, звідки стрибати. */
    catSpot() { const x = 846, [fx, fy] = NX.cfg.sofaPt ? NX.cfg.sofaPt(x, 384) : [x, 384]; return { x, y: TOP() + 1, from: [fx, fy], flower: 'viola' }; },
  };
  let RIMX = 774;
  NX.addObject({
    id: 'planters', span: [540, 1010],
    /** (17.11) ПРОХІДНА СМУГА ЗА ДИВАНОМ: тап по коробу між рослинами й спинкою дивана — Nexi стає на кант саду в тому місці
     *  (activities.js: jarStand). Уже стоїть на канті — перестрибує вздовж нього, без спуску на підлогу. */
    tapFirst(x, y) { const S = NX.objects.sofa, top = TOP(), n = NX.nexi; if (!S || !n || x < JAR.x0 || x > JAR.x1 || y <= top || y >= (S.backTop || top + 22)) return false;
      RIMX = Math.max(JAR.x0 + 14, Math.min(JAR.x1 - 14, x)); const sp = NX.planters.rimSpot();
      if (n.loc === 'wallHover' && n.dy != null && !n.cur && !n.queue.length && Math.abs(n.y - sp.y) < 4 && n.x > JAR.x0 && n.x < JAR.x1) { n.lastCmd = NX.time; n.queue = [{ hop: [sp.x, sp.y], dy: n.dy }, { face: sp.x < n.x ? -1 : 1 }]; n.cur = null; }
      else n.do('jarStand');
      return true; },
    drawBack(c, t) {
      const dt = Math.min(.1, Math.max(0, t - lastT)); lastT = t; tickLife(t, dt); lifeTick(t, dt);
      const LK = NX.decorLight ? NX.decorLight.k(t) : 1, vx0 = NX.cam.x - 80, vx1 = NX.cam.x + NX.cam.viewW + 80; if (RAIL.x1 < vx0 || RAIL.x0 > vx1) return;
      drawJar(c, t, LK);
      const top = TOP(), night = Math.max(0, Math.min(1, (LK - 1) / .7));
      c.save(); c.beginPath(); c.rect(JAR.x0 - 80, 0, JAR.x1 - JAR.x0 + 160, top + 1); c.clip();                           // нижче канта героїв не малюємо — вони «в ґрунті»
      for (const p of HEROES) { if (p.x + p.w < vx0 || p.x - p.w > vx1) continue; const cv = spriteOf(p, p.kind, FLOWERS.includes(p.kind) ? Math.round(stageOf(p, t) * (STAGES - 1)) : STAGES - 1), S = cv.S, w = cv.width / S, h = cv.height / S, bx = cv.base[0] / S, byy = cv.base[1] / S, sh = Math.sin(t * .7 + p.seed) * .012 + Math.sin(t * 1.9 + p.seed * 2) * .004;
        c.save(); c.imageSmoothingEnabled = false; c.translate(p.x, top); c.transform(1, 0, sh, 1, 0, 0);                   // легке погойдування: верх ходить, основа стоїть
        c.drawImage(cv, -bx, -byy, w, h);
        if (p.kind === 'cereus' && night > .05) { const bl = spriteOf(p, 'cereusBloom'); c.globalAlpha = night; c.drawImage(bl, -bl.base[0] / S, -bl.base[1] / S, bl.width / S, bl.height / S); c.globalCompositeOperation = 'lighter'; c.globalAlpha = night * (.25 + .1 * Math.sin(t * 2)); c.fillStyle = '#fff6c0'; c.beginPath(); c.arc(-4, -p.h * .7 + 2, 9, 0, TAU); c.fill(); }   // (· 36) цереус квітне вночі
        c.restore(); }   // (13.11) білий спалах-прямокутник при тапі прибрано (власник: «без обводок і рамок»)
      drawLife(c, t, LK); drawGecko(c, t, night); drawPanel(c, t, LK); c.restore();
      drawPetals(c, t); drawVisitors(c, t, night); drawDew(c, t);
      if (night > .05) for (let i = 0; i < 7; i++) { const ph = t * (.25 + .08 * (i % 3)) + i * 1.7, x = JAR.x0 + 14 + ((i * 37 + Math.sin(ph) * 22 + 400) % (JAR.x1 - JAR.x0 - 28)), y = top - 24 - (i % 4) * 16 + Math.sin(ph * 1.6) * 9, a = night * (.35 + .65 * Math.max(0, Math.sin(ph * 3 + i)));   // світлячки над жардиньєром уночі
        c.save(); c.globalCompositeOperation = 'lighter'; c.globalAlpha = a; c.fillStyle = '#c8ff6a'; c.fillRect(x, y, 1.4, 1.4); c.globalAlpha = a * .35; c.beginPath(); c.arc(x + .7, y + .7, 3.5, 0, TAU); c.fill(); c.restore(); }
      drawHanging(c, t, LK, night); drawGrowLamp(c, t, night);
    },
    /** Відблиск неону жардиньєра на спинці дивана (шар одразу після тіла дивана) — зв'язує рослини з кімнатою. */
    layers(t) { const SF = NX.cfg.SOFA || { y: 414, k: 1.13 }; return [{ y: SF.y - 24 + .5, draw: c => { const LK = NX.decorLight ? NX.decorLight.k(t) : 1, y0 = SF.y - 126 * SF.k + 2, x0 = Math.max(JAR.x0, 650), x1 = Math.min(JAR.x1, 900);
      c.save(); c.globalCompositeOperation = 'lighter'; const g = c.createLinearGradient(0, y0, 0, y0 + 9); g.addColorStop(0, 'rgba(59,232,255,' + (.28 * Math.min(1.3, LK)) + ')'); g.addColorStop(1, 'rgba(59,232,255,0)'); c.fillStyle = g; c.fillRect(x0, y0, x1 - x0, 9); c.restore(); } }]; },
  });
})();

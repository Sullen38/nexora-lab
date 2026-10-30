/* ============================================================================
 * objects/arc_paint.js — МАЛЮНКИ ГРАНЕЙ КРИЛ «ПО ДУЗІ»: реєстр NX.arc.paint[id], вивіски зон і спільне «залізо» граней
 * ----------------------------------------------------------------------------
 * Пласкі текстури лицьових граней частин зон — у стилі картинки кімнати. Малюються раз (у полотно в одиницях грані,
 * рушій objects/arc_scene.js кладе їх у перспективу); живі грані поверх — NX.arc.LIVE (objects/arc_live.js).
 * Малюнки зон — у їхніх файлах: майстерня objects/ws_paint.js, маркетинг mk_paint.js, аналітика an_paint.js,
 * інструменти tl_paint.js (вони визначають ws_* / mk_* / an_* / tl_* самі). Тут — те, що спільне:
 *   NX.arc.paint[id] = (c, fw, fh, B, F) => {...}   — c уже масштабоване: 1 = одиниця грані; fw × fh — розмір грані
 *   вивіски зон (*_sign) — однакові на всіх (A.signPlate, шрифт під найдовшу назву, і майбутніх зон теж);
 *   NX.arc.pt — голо-скло, іконки 7×7, шухляди, утоплена панель, заклепка, світлодіод, ґратка.
 * Усі написи — NX.t (4 мови): nav.* (вивіски). Ключі розкладки — objects/arc_layout.js.
 * Малюнки граней зон 28.10 (AI-центр, полиці, постери, екран NEXORA AI, портал) — в історії git (коміт a431f03).
 * ========================================================================== */
NX.arc = NX.arc || {};
(() => {
  const A = NX.arc.kit, K = NX.kit;
  const PAINT = NX.arc.paint = {};
  // ---------- дрібниці ----------
  const rr = (c, x, y, w, h, r) => { c.beginPath(); c.roundRect ? c.roundRect(x, y, w, h, r) : c.rect(x, y, w, h); };
  /** Голо-скло: темна синява з переливом, скан-лінії, світлий кант, легкий відблиск угорі. */
  function glass(c, x, y, w, h, o = {}) {
    const g = c.createLinearGradient(x, y, x, y + h); g.addColorStop(0, o.a || '#1b4fc0'); g.addColorStop(.5, o.b || '#0f2f8e'); g.addColorStop(1, o.c || '#0a2266');
    c.fillStyle = '#040822'; rr(c, x - .8, y - .8, w + 1.6, h + 1.6, o.r || 1); c.fill(); c.fillStyle = g; rr(c, x, y, w, h, o.r || 1); c.fill();
    c.save(); rr(c, x, y, w, h, o.r || 1); c.clip();
    const e = c.createRadialGradient(x + w / 2, y + h / 2, Math.min(w, h) * .2, x + w / 2, y + h / 2, Math.max(w, h) * .75); e.addColorStop(0, 'rgba(60,140,255,0)'); e.addColorStop(1, 'rgba(110,200,255,.22)'); c.fillStyle = e; c.fillRect(x, y, w, h);
    c.fillStyle = 'rgba(160,225,255,.09)'; for (let yy = y + 1.2; yy < y + h; yy += 1.6) c.fillRect(x, yy, w, .55);
    c.fillStyle = 'rgba(255,255,255,.07)'; c.beginPath(); c.moveTo(x, y); c.lineTo(x + w * .45, y); c.lineTo(x + w * .25, y + h * .5); c.lineTo(x, y + h * .5); c.fill();
    c.restore();
    c.strokeStyle = o.line || '#7af4ff'; c.lineWidth = o.lw || .8; rr(c, x + .4, y + .4, w - .8, h - .8, o.r || 1); c.stroke();
  }
  /** Піксельні іконки 7×7 (для плиток інструментів, екранів). */
  const IC = {
    mail: ['XXXXXXX', 'XX...XX', 'X.X.X.X', 'X..X..X', 'X.....X', 'X.....X', 'XXXXXXX'], cal: ['.X...X.', 'XXXXXXX', 'X.....X', 'XXXXXXX', 'X.X.X.X', 'X.X.X.X', 'XXXXXXX'],
    crm: ['..X.X..', '.XXXXX.', '..X.X..', 'X.....X', 'XX...XX', '.XXXXX.', '..XXX..'], gear: K.ICON.gear, bot: K.ICON.bot, ai: K.ICON.ai, chart: K.ICON.chart, target: K.ICON.target, spiral: K.ICON.spiral,
    chat: ['XXXXXXX', 'X.....X', 'X.X.X.X', 'X.....X', 'XXXXXXX', '.XX....', 'X......'], heart: ['.XX.XX.', 'XXXXXXX', 'XXXXXXX', 'XXXXXXX', '.XXXXX.', '..XXX..', '...X...'],
    bolt: ['....XX.', '...XX..', '..XX...', '.XXXXX.', '...XX..', '..XX...', '.XX....'], doc: ['XXXXX..', 'X...XX.', 'X.XX.XX', 'X.....X', 'X.XXX.X', 'X.....X', 'XXXXXXX'],
    wrench: ['.....XX', '....X.X', '...XXX.', '..XXX..', '.XXX...', 'XXX....', 'XX.....'], user: ['..XXX..', '.XXXXX.', '..XXX..', '.......', '.XXXXX.', 'XXXXXXX', 'XXXXXXX'],
  };
  const icon = (c, k, cx, cy, s, col) => A.icon7(c, IC[k] || IC.ai, cx, cy, s, col);
  // «Залізо» граней (майстерня, маркетинг, аналітика, інструменти)
  /** Утоплена панель: темне дно, тінь зверху й ліворуч, світла кромка знизу й праворуч. */
  function inset(c, x, y, w, h, fill = 'rgba(6,3,20,.6)', r = .6) {
    c.fillStyle = fill; rr(c, x, y, w, h, r); c.fill(); c.fillStyle = 'rgba(0,0,0,.55)'; c.fillRect(x, y, w, .5); c.fillRect(x, y, .5, h);
    c.fillStyle = 'rgba(170,150,255,.28)'; c.fillRect(x, y + h - .45, w, .45); c.fillRect(x + w - .45, y, .45, h);
  }
  /** Заклепка: темне кільце, світлий блік угорі ліворуч. */
  const bolt = (c, x, y, r = .85) => { c.fillStyle = '#05030f'; c.beginPath(); c.arc(x, y, r, 0, 7); c.fill(); c.fillStyle = '#6a5ab8'; c.beginPath(); c.arc(x - r * .15, y - r * .15, r * .62, 0, 7); c.fill(); c.fillStyle = '#d8d0ff'; c.fillRect(x - r * .45, y - r * .45, r * .4, r * .4); };
  /** Світлодіод: темна оправа, кольорове тіло, біла іскра. */
  const led = (c, x, y, col, r = .75) => { c.fillStyle = '#05030f'; c.beginPath(); c.arc(x, y, r * 1.5, 0, 7); c.fill(); c.fillStyle = col; c.beginPath(); c.arc(x, y, r, 0, 7); c.fill(); c.fillStyle = '#fff'; c.fillRect(x - r * .35, y - r * .35, r * .5, r * .5); };
  /** Ґратка вентиляції: щілини з темним нутром і світлою нижньою губою. */
  function vent(c, x, y, w, h, n) {
    inset(c, x, y, w, h, 'rgba(4,2,14,.7)'); const g = h / n;
    for (let k = 0; k < n; k++) { const yy = y + g * k + g * .3; c.fillStyle = '#020108'; c.fillRect(x + w * .08, yy, w * .84, g * .42); c.fillStyle = 'rgba(150,130,240,.35)'; c.fillRect(x + w * .08, yy + g * .42, w * .84, .35); }
  }
  /** Шухляди: фасад з фаскою, ручка, LED-смужка. */
  function drawer(c, x, y, w, h, o = {}) {
    const g = c.createLinearGradient(0, y, 0, y + h); g.addColorStop(0, o.a || '#2a1c5a'); g.addColorStop(1, o.b || '#170f38'); c.fillStyle = g; rr(c, x, y, w, h, .8); c.fill();
    c.strokeStyle = 'rgba(160,140,255,.45)'; c.lineWidth = .45; rr(c, x + .3, y + .3, w - .6, h - .6, .7); c.stroke();
    c.fillStyle = '#05030f'; c.fillRect(x + .4, y + h - .7, w - .8, .5);
    const hw = Math.min(w * .42, 10); c.fillStyle = '#9a8ae0'; rr(c, x + w / 2 - hw / 2, y + h * .32, hw, Math.max(.9, h * .12), .5); c.fill(); c.fillStyle = '#e0d8ff'; c.fillRect(x + w / 2 - hw / 2 + .3, y + h * .32, hw - .6, .35);
    if (o.led) { c.fillStyle = o.led; c.fillRect(x + w - 2.6, y + 1.2, 1.2, 1.2); }
  }

  // ---------- ВИВІСКИ (єдиний стиль: A.signPlate) ----------
  const SIGN = { mk_sign: ['nav.marketing', 'target', '#ff4fd8'], an_sign: ['nav.analytics', 'chart', '#3be8ff'], ai_sign: ['nav.ai', 'ai', '#3be8ff'],
    ws_sign: ['nav.workshop', 'bot', '#ff4fd8'], tl_sign: ['nav.tools', 'gear', '#3be8ff'], pt_sign: ['nav.portal', 'spiral', '#d98aff'] };
  const UNI = Object.values(SIGN).map(v => v[0]);                                      // усі назви зон: шрифт — один на всіх (під найдовшу)
  Object.entries(SIGN).forEach(([id, [key, ic, acc]]) => { PAINT[id] = (c, fw, fh) => A.signPlate(c, 0, 0, fw, fh, { key, icon: ic, acc, uni: UNI }); });

  NX.arc.pt = { glass, icon, drawer, rr, IC, inset, bolt, led, vent };   // для малюнків і живого зон (*_paint.js, marketing.js, analytics.js)
})();

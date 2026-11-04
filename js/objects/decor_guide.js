/* ============================================================================
 * objects/decor_guide.js — ДОВІДНИК БОТАНІКА (Декор стін · 18): картка врятованого виду
 * ----------------------------------------------------------------------------
 * Історія світу (docs/UNIVERSE.md): усі рослини й рибки в кімнаті — види, які Nexi урятував. Тап по рослині на стіні, по
 * лотку теплиці, по рибі чи медузі (і по нерухомих мешканцях рифу — мурена, вугри, анемона, краб…) показує КАРТКУ:
 * «ВРЯТОВАНИЙ ВИД · №NN», спрайт виду (той самий піксель-арт, що в кімнаті), назва мовою сайту, латина, де живе, стадія
 * росту (теплиця) і лічильник «Врятовано видів: N». Розмітка — index.html (#guide), стилі — css/hud.css (.guide),
 * тексти — i18n decor.guide.* (назви видів sp.<група>.<вид>, латина — лише в uk.js: одна на всі мови).
 * Як знаходимо вид: живі рослини — objects/decor_live.js (tap -> 'plant', спрайт LP); нерухомі (соти, витки, корч, стрілки
 * антресолі, орхідея в оранжереї, платицеріум) — коробки предметів розкладки з dc.kind / dc.plant (tapStatic); теплиця —
 * NX.decorFarm.nearTray; акваріуми — NX.decor.crewAt (риби й медузи) і NX.decorAqua.residents (нерухомі).
 * Реєстр видів — зі словника (порядок: стіни, ферма, риф, медузарій); номер виду — його місце в реєстрі.
 * (· 19) БИРКИ: біля кожної рослини на стіні — маленька табличка з її номером (9 × 7 од., у лівому нижньому куті коробки рослини,
 * тож на зони не заходить; цифри — піксельний шрифт 3 × 5, це числа, не текст). Тап по виду й сканування підсвічують бирку.
 * ІНВЕНТАРИЗАЦІЯ: Nexi (actors/nexi/activities.js census) на ранці підлітає до бирок і читає їх ручним сканером — зелений промінь
 * від сканера до бирки (scanFrom), бирка спалахує, картка виду відкривається сама (як від тапу).
 * Камера на картку не реагує (тап по декору — не команда Nexi). Картка сама ховається за HIDE с; тап по ній — закрити.
 * ========================================================================== */
(() => {
  const X = NX.px3d, HIDE = 6.5, GROUPS = ['wall', 'farm', 'reef', 'jelly'];
  const $ = id => document.getElementById(id);
  let REG = null, cur = null, timer = 0;
  /** Реєстр видів зі словника: [{grp, kind, no}] і мапа kind -> запис. */
  function reg() {
    if (REG) return REG; const list = [], by = {};
    for (const grp of GROUPS) { const d = NX.t('decor.guide.sp.' + grp); if (!d || typeof d !== 'object') continue; for (const kind of Object.keys(d)) { const e = { grp, kind, no: list.length + 1 }; list.push(e); by[grp + '.' + kind] = e; } }
    return REG = { list, by, n: list.length };
  }
  const find = (grp, kind) => reg().by[grp + '.' + kind] || null;
  const WALL_ALIAS = { fungi: 'shroom', green: 'orchid' };                                                   // тапи decor_live без спрайта рослини -> вид

  // ---------- нерухомі рослини: коробки на екрані з розкладки (один раз) ----------
  let STAT = null;
  function statics() {
    if (STAT) return STAT; STAT = []; const DC = NX.decor; if (!DC || !NX.arc.kit) return STAT;
    const live = NX.arc.dcLive || {};
    for (const B of DC.items) { const d = B.dc; if (!d) continue; const kind = d.plant || d.kind; if (!kind || !find('wall', kind) || live[B.id] || B.st === 'dc_pylon') continue;
      const { P } = NX.arc.kit.basis(B); let x0 = 1e9, y0 = 1e9, x1 = -1e9, y1 = -1e9;
      for (const u of [-B.w / 2, B.w / 2]) for (const v of [0, B.dep]) for (const y of [B.yt, B.yb]) { const q = X.proj(P(u, v, y)); x0 = Math.min(x0, q[0]); x1 = Math.max(x1, q[0]); y0 = Math.min(y0, q[1]); y1 = Math.max(y1, q[1]); }
      STAT.push({ kind, x0, x1, y0, y1, a: (x1 - x0) * (y1 - y0), z: P(0, B.dep / 2, B.yb)[2] }); }
    return STAT;
  }

  // ---------- (· 19) бирки з номерами ----------
  const TW = 9, TH = 7, TR = 4;                                                                                 // плата (од.) і px на од. у кеші
  const DIG = ['111101101101111', '010110010010111', '111001111100111', '111001111001111', '101101111001001', '111100111001111', '111100111101111', '111001001001001', '111101111101111', '111101111001111'];
  const TAGS = { list: [], n: -1, cv: {}, flash: {} }; let SCAN = null;
  function tagSprite(no) {
    if (TAGS.cv[no]) return TAGS.cv[no]; const cv = document.createElement('canvas'); cv.width = TW * TR; cv.height = TH * TR; const c = cv.getContext('2d'); c.scale(TR, TR);
    c.fillStyle = '#0a1030'; c.fillRect(0, .5, TW, TH - .5); c.fillStyle = '#3be8ff'; c.fillRect(0, .5, TW, .5); c.fillRect(0, TH - .5, TW, .5); c.fillRect(0, .5, .5, TH - .5); c.fillRect(TW - .5, .5, .5, TH - .5);
    c.fillStyle = '#9af6ff'; c.fillRect(TW / 2 - .5, 0, 1, .5); c.fillStyle = '#060a24'; c.fillRect(TW / 2 - .25, 1, .5, .5);                         // вушко й дірочка
    const s = String(no).padStart(2, '0'); c.fillStyle = '#9af6ff';
    for (let i = 0; i < 2; i++) { const d = DIG[+s[i]], ox = 1 + i * 4; for (let q = 0; q < 15; q++) if (d[q] === '1') c.fillRect(ox + q % 3, 1.5 + Math.floor(q / 3), 1, 1); }
    return TAGS.cv[no] = cv;
  }
  /** Усі бирки рослин стін (живі LP + нерухомі): [{kind, no, x, y, z, cx, cy}] — x, y — лівий верхній кут плати (екран), cx, cy — центр. */
  function tags() {
    const DL = NX.decorLive, LP = DL ? DL.LP : []; if (LP.length === TAGS.n) return TAGS.list; TAGS.n = LP.length; const out = [], seen = {};
    const put = (kind, x0, y1, z) => { const e = find('wall', kind); if (!e || seen[kind]) return; seen[kind] = 1; const x = x0 + 1, y = y1 - TH - .5; out.push({ kind, no: e.no, x, y, z, cx: x + TW / 2, cy: y + TH / 2 }); };
    for (const L of LP) if (L.e && L.e.sp) put(L.e.sp.kind, L.x0, L.y1, L.e.P3 ? L.e.P3[2] : 100);
    for (const S of statics()) put(S.kind, S.x0, S.y1, S.z);
    return TAGS.list = out;
  }
  function flashTag(kind, t) { TAGS.flash[kind] = t; }
  function drawTags(c, t, vx0, vx1) {
    for (const g of tags()) { if (g.x + TW < vx0 || g.x > vx1) continue; c.drawImage(tagSprite(g.no), g.x, g.y, TW, TH);
      const f = TAGS.flash[g.kind]; if (f != null && t - f < 1.6) { const a = 1 - (t - f) / 1.6; c.save(); c.globalCompositeOperation = 'lighter'; c.globalAlpha = .7 * a; c.fillStyle = '#3bff8a'; c.fillRect(g.x - .5, g.y - .5, TW + 1, TH + 1);
        c.globalAlpha = a; c.strokeStyle = '#b8ffc8'; c.lineWidth = .6; c.strokeRect(g.x - 1.5 - (1 - a) * 3, g.y - 1.5 - (1 - a) * 3, TW + 3 + (1 - a) * 6, TH + 3 + (1 - a) * 6); c.restore(); } }
    if (SCAN && t - SCAN.t0 < SCAN.dur) {                                                                         // промінь сканера: пунктир від руки до бирки, біжить до бирки
      const k = Math.min(1, (t - SCAN.t0) / .35), dx = SCAN.x1 - SCAN.x0, dy = SCAN.y1 - SCAN.y0, L = Math.hypot(dx, dy); c.save(); c.globalCompositeOperation = 'lighter';
      for (let s = (t * 40) % 3; s < L * k; s += 3) { const u = s / L; c.globalAlpha = .95 - u * .3; c.fillStyle = '#8affc0'; c.fillRect(SCAN.x0 + dx * u - .7, SCAN.y0 + dy * u - .7, 1.4, 1.4); }
      c.globalAlpha = .4 + .25 * Math.sin(t * 30); c.strokeStyle = '#3bff8a'; c.lineWidth = 1.1; c.beginPath(); c.moveTo(SCAN.x0, SCAN.y0); c.lineTo(SCAN.x0 + dx * k, SCAN.y0 + dy * k); c.stroke();
      if (k >= 1) { const r = 3 + 2 * Math.sin(t * 9); c.globalAlpha = .6; c.beginPath(); c.arc(SCAN.x1, SCAN.y1, r, 0, 6.2832); c.stroke(); }
      c.restore(); }
  }

  // ---------- спрайт виду на полотно картки ----------
  function drawSprite(e, info) {
    const cv = $('guide').querySelector('canvas'); if (!cv) return; const n = 64, R = Math.min(3, Math.max(1, Math.round(devicePixelRatio || 1))); cv.width = cv.height = n * R; cv.style.width = cv.style.height = n + 'px';
    const c = cv.getContext('2d'); c.setTransform(R, 0, 0, R, 0, 0); c.clearRect(0, 0, n, n); c.imageSmoothingEnabled = false;
    const fit = (src, pad = 6) => {                                                                          // обрізати порожнє навколо спрайта й вписати в полотно
      const w = src.width, h = src.height; let x0 = w, y0 = h, x1 = -1, y1 = -1; try { const d = src.getContext('2d').getImageData(0, 0, w, h).data; for (let y = 0; y < h; y++) for (let x = 0; x < w; x++) if (d[(y * w + x) * 4 + 3] > 40) { if (x < x0) x0 = x; if (x > x1) x1 = x; if (y < y0) y0 = y; if (y > y1) y1 = y; } } catch (err) { x0 = y0 = 0; x1 = w - 1; y1 = h - 1; }
      if (x1 < 0) { x0 = y0 = 0; x1 = w - 1; y1 = h - 1; } const sw = x1 - x0 + 1, sh = y1 - y0 + 1, k = Math.min((n - pad * 2) / sw, (n - pad * 2) / sh, 4), dw = sw * k, dh = sh * k; c.drawImage(src, x0, y0, sw, sh, (n - dw) / 2, (n - dh) / 2, dw, dh); };
    try {
      if (e.grp === 'wall') { const sp = NX.arc.dcSpec && NX.arc.dcSpec[e.kind], r = sp && NX.arc.dcPlant(sp); if (!r) return;
        const o = document.createElement('canvas'); o.width = r.sw; o.height = r.sh; const oc = o.getContext('2d'), im = oc.createImageData(r.sw, r.sh); new Uint32Array(im.data.buffer).set(r.d); oc.putImageData(im, 0, 0); fit(o, 4); return; }
      if (e.grp === 'farm') { const S = NX.decorFarm && NX.decorFarm.plantSpr(e.kind, info && info.s != null ? info.s : 1); if (S) fit(S.cv); return; }
      const S = NX.decor.frame && (NX.decor.SPR[e.kind] || (NX.decor.JELLY && NX.decor.JELLY[e.kind])) ? NX.decor.frame(e.kind, 0) : null;
      if (S) { fit(S.cv); return; }
      if (info && info.aq) {                                                                                  // нерухомі мешканці: шматок живого шару акваріума навколо точки
        const M = NX.decor.MK[info.aq]; if (!M || !M.out) return; const Rd = M.out.width / M.w, r = Math.max(6, info.r || 6), sx = (info.x - r - M.x) * Rd, sy = (info.y - r - M.y) * Rd;
        c.imageSmoothingEnabled = true; c.drawImage(M.out, sx, sy, 2 * r * Rd, 2 * r * Rd, 2, 2, n - 4, n - 4); }
    } catch (err) { /* спрайта нема — картка без малюнка */ }
  }

  // ---------- картка ----------
  function render() {
    const el = $('guide'); if (!el || !cur) return; const { e, info } = cur, T = NX.t, R = reg();
    el.querySelector('b').textContent = T('decor.guide.head') + ' · ' + T('decor.guide.no') + String(e.no).padStart(3, '0');
    el.querySelector('.gn').textContent = T(`decor.guide.sp.${e.grp}.${e.kind}`);
    const lat = T('decor.guide.latin.' + e.kind); el.querySelector('small').textContent = lat.startsWith('decor.') ? '' : lat;
    const kindT = e.grp === 'reef' ? 'fish' : e.grp === 'jelly' ? 'jel' : 'plant';
    el.querySelector('.gw').textContent = T('decor.guide.kind.' + kindT) + ' · ' + T('decor.guide.where.' + e.grp) + (e.grp === 'farm' && info && info.s != null ? ' · ' + T('decor.guide.stage', { s: Math.min(6, Math.floor(info.s * 6) + 1) }) : '');
    el.querySelector('.gc').textContent = T('decor.guide.count', { n: R.n });
    el.style.borderColor = { wall: '#3bff8a', farm: '#b8ff3a', reef: '#3be8ff', jelly: '#d94bff' }[e.grp];
    drawSprite(e, info);
  }
  function show(e, info) {
    const el = $('guide'); if (!el || !e) return; cur = { e, info }; render(); el.classList.add('show'); if (e.grp === 'wall') flashTag(e.kind, NX.time);
    clearTimeout(timer); timer = setTimeout(hide, HIDE * 1000);
  }
  function hide() { const el = $('guide'); if (el) el.classList.remove('show'); cur = null; }
  { const el = $('guide'); if (el) el.addEventListener('click', hide); }                                    // розмітка — вище скриптів (index.html)
  NX.i18n.onLang(() => { REG = null; if (cur) render(); });

  NX.decorGuide = {
    reg, statics, show, hide, tags, TW, TH,
    /** (· 19) Бирки й промінь сканера на живий шар (objects/decor_live.js draw). */
    draw: drawTags,
    /** Для decor_check.js: плати бирок (нерухомі, усередині коробок рослин). */
    extentTo(c) { c.fillStyle = '#fff'; for (const g of tags()) c.fillRect(g.x, g.y, TW, TH); },
    /** Куди летіти Nexi читати бирки на стіні side: [{kind, x, y, z}] (центр бирки; z — глибина рослини), 3 випадкові, зліва направо. */
    scanSpots(side, n = 3) { const all = tags().filter(g => side === 'left' ? g.cx < 774 : g.cx >= 774), pick = []; while (all.length && pick.length < n) pick.push(all.splice(Math.random() * all.length | 0, 1)[0]); return pick.sort((a, b) => a.cx - b.cx).map(g => ({ kind: g.kind, x: g.cx, y: g.cy, z: g.z })); },
    /** Nexi сканує: промінь від руки (hx, hy) до бирки виду kind, dur с; на половині — бирка спалахує й картка виду відкривається. */
    scanFrom(hx, hy, kind, t, dur = 1.6) { const g = tags().find(q => q.kind === kind); if (!g) return; SCAN = { x0: hx, y0: hy, x1: g.cx, y1: g.cy, t0: t, dur, kind }; },
    scanTick(hx, hy, t, k) { if (!SCAN) return; SCAN.x0 = hx; SCAN.y0 = hy; if (k > .45 && !SCAN.done) { SCAN.done = 1; show(find('wall', SCAN.kind)); } },
    scanEnd() { SCAN = null; },
    /** Тап, який уже влучив у декор (objects/decor_live.js tap): hit — що саме, L — рослина LP (hit 'plant'). */
    tap(hit, x, y, t, L) {
      if (hit === 'plant' && L && L.e && L.e.sp) return show(find('wall', L.e.sp.kind));
      if (WALL_ALIAS[hit]) return show(find('wall', WALL_ALIAS[hit]));
      if (hit === 'hex') return void this.tapStatic(x, y);                                                   // рослина в соті (бонсай, ехеверія, кактус, сансев'єрія)
      if (hit === 'farm' && NX.decorFarm && NX.decorFarm.nearTray) { const tr = NX.decorFarm.nearTray(x, y, t); if (tr && tr.d < 30) return show(find('farm', tr.kind), tr); return; }
      if (hit === 'aq') { const TP = NX.decorLive && NX.decorLive.TP, aq = TP && TP.aq && TP.aq.aq; if (!aq) return;
        let best = null, bd = 1e9;
        for (const f of NX.decor.crewAt(aq, t)) { const d = Math.hypot(f.x - x, f.y - y) - Math.max(f.w, f.h) * .35; if (d < bd) { bd = d; best = { e: find(aq, f.kind), info: null }; } }
        if (NX.decorAqua && NX.decorAqua.residents) for (const r of NX.decorAqua.residents(aq, t)) { const d = Math.hypot(r.x - x, r.y - y) - r.r * .5; if (d < bd) { bd = d; best = { e: find(aq, r.kind), info: { aq, x: r.x, y: r.y, r: r.r } }; } }
        if (best && best.e && bd < 9) show(best.e, best.info); }
    },
    /** Тап повз живе: чи влучив у нерухому рослину (соти, витки на цеглі, даваллія, платицеріум, монстера антресолі…). -> true */
    tapStatic(x, y) {
      let best = null; for (const S of statics()) if (x >= S.x0 - 1 && x <= S.x1 + 1 && y >= S.y0 - 1 && y <= S.y1 + 1 && (!best || S.a < best.a)) best = S;
      if (!best) return false; show(find('wall', best.kind)); return true;
    },
  };
})();

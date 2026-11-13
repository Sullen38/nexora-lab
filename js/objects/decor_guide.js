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
 * (· 19) ІНВЕНТАРИЗАЦІЯ: Nexi (actors/nexi/activities.js census) на ранці підлітає до рослин і читає їх ручним сканером — зелений
 * промінь від сканера до рослини (scanFrom), кільце на ній, картка виду відкривається сама (як від тапу). Бирки з номерами біля
 * рослин були в · 19 і прибрані в · 21 (власник: «таблички з номерами прибираємо — просто коли на рослину жмемо, інформація»).
 * Камера на картку не реагує (тап по декору — не команда Nexi). Картка сама ховається за HIDE с; тап по ній — закрити.
 * (· 27) РЕЧІ NEXI: штучки в сотах-полицях (куля, книжки, тераріум, колба, мікроскоп, статуетка — dc_art, ART_KINDS) теж мають
 * картку: «РІЧ NEXI · №N», назва й підпис-історія (i18n decor.guide.art.items.<kind>.n / .d), малюнок — шматок зібраної сцени
 * (NX.arc.built[side].comp) навколо штучки. Тап по порожньому місцю соти відкриває картку її вмісту (рослини чи речі). Речі не
 * входять у реєстр урятованих видів (свій лічильник count).
 * ========================================================================== */
(() => {
  const X = NX.px3d, HIDE = 6.5, HIDE_ART = 12, GROUPS = ['wall', 'garden', 'floor', 'farm', 'reef', 'jelly'];   // (· 43) garden — сад за диваном (жардиньєр + висячі)   // (· 31) floor — вазони перед вікном
  const $ = id => document.getElementById(id);
  let REG = null, cur = null, timer = 0;
  /** Реєстр видів зі словника: [{grp, kind, no}] і мапа kind -> запис. */
  function reg() {
    if (REG) return REG; const list = [], by = {};
    for (const grp of GROUPS) { const d = NX.t('decor.guide.sp.' + grp); if (!d || typeof d !== 'object') continue; for (const kind of Object.keys(d)) { const e = { grp, kind, no: list.length + 1 }; list.push(e); by[grp + '.' + kind] = e; } }
    return REG = { list, by, n: list.length };
  }
  const ART_KINDS = NX.decorArt ? NX.decorArt.KINDS : [];                                                          // (· 27, · 55) речі Nexi в сотах — 13 артефактів (objects/decor_art.js)
  const find = (grp, kind) => grp === 'art' ? (ART_KINDS.includes(kind) ? { grp, kind, no: ART_KINDS.indexOf(kind) + 1 } : null) : (reg().by[grp + '.' + kind] || null);
  const WALL_ALIAS = { fungi: 'shroom', green: 'orchid' };                                                   // тапи decor_live без спрайта рослини -> вид

  // ---------- нерухомі рослини: коробки на екрані з розкладки (один раз) ----------
  let STAT = null, HEXC = [];
  function statics() {
    if (STAT) return STAT; STAT = []; const DC = NX.decor; if (!DC || !NX.arc.kit) return STAT;
    const live = NX.arc.dcLive || {};
    const box = B => { const { P } = NX.arc.kit.basis(B); let x0 = 1e9, y0 = 1e9, x1 = -1e9, y1 = -1e9;
      for (const u of [-B.w / 2, B.w / 2]) for (const v of [0, B.dep]) for (const y of [B.yt, B.yb]) { const q = X.proj(P(u, v, y)); x0 = Math.min(x0, q[0]); x1 = Math.max(x1, q[0]); y0 = Math.min(y0, q[1]); y1 = Math.max(y1, q[1]); }
      return { x0, x1, y0, y1, a: (x1 - x0) * (y1 - y0), z: P(0, B.dep / 2, B.yb)[2] }; };
    HEXC = [];
    for (const B of DC.items) { const d = B.dc; if (!d) continue;
      if (B.st === 'dc_hex') { HEXC.push(Object.assign({ id: B.id }, box(B))); continue; }                                   // (· 27) комірки сот — для тапу повз вміст
      const art = B.st === 'dc_art' && ART_KINDS.includes(d.kind), kind = d.plant || d.kind;
      if (!kind || (!art && !find('wall', kind)) || live[B.id] || B.st === 'dc_pylon') continue;
      STAT.push(Object.assign({ kind, grp: art ? 'art' : 'wall', on: B.on || null, neon: art && B.on && DC.byId[B.on] && DC.byId[B.on].dc ? DC.byId[B.on].dc.neon : null }, box(B))); }
    return STAT;
  }

  // ---------- (· 19, · 21) точки рослин для сканера Nexi ----------
  const SP = { list: [], n: -1 }; let SCAN = null;
  /** Усі рослини стін (живі LP + нерухомі): [{kind, no, cx, cy, z}] — cx, cy — точка на рослині (екран, нижня третина), z — глибина. */
  function spots() {
    const DL = NX.decorLive, LP = DL ? DL.LP : []; if (LP.length === SP.n) return SP.list; SP.n = LP.length; const out = [], seen = {};
    const put = (kind, x0, x1, y0, y1, z) => { const e = find('wall', kind); if (!e || seen[kind]) return; seen[kind] = 1; out.push({ kind, no: e.no, cx: (x0 + x1) / 2, cy: y0 + (y1 - y0) * .62, z }); };
    for (const L of LP) if (L.e && L.e.sp) put(L.e.sp.kind, L.x0, L.x1, L.y0, L.y1, L.e.P3 ? L.e.P3[2] : 100);
    for (const S of statics()) if (S.grp === 'wall') put(S.kind, S.x0, S.x1, S.y0, S.y1, S.z);
    return SP.list = out;
  }
  function drawScan(c, t) {
    if (!SCAN || t - SCAN.t0 >= SCAN.dur) return;                                                                 // промінь сканера: пунктир від руки до рослини, біжить до неї
    const k = Math.min(1, (t - SCAN.t0) / .35), dx = SCAN.x1 - SCAN.x0, dy = SCAN.y1 - SCAN.y0, L = Math.hypot(dx, dy); c.save(); c.globalCompositeOperation = 'lighter';
    for (let s = (t * 40) % 3; s < L * k; s += 3) { const u = s / L; c.globalAlpha = .95 - u * .3; c.fillStyle = '#8affc0'; c.fillRect(SCAN.x0 + dx * u - .7, SCAN.y0 + dy * u - .7, 1.4, 1.4); }
    c.globalAlpha = .4 + .25 * Math.sin(t * 30); c.strokeStyle = '#3bff8a'; c.lineWidth = 1.1; c.beginPath(); c.moveTo(SCAN.x0, SCAN.y0); c.lineTo(SCAN.x0 + dx * k, SCAN.y0 + dy * k); c.stroke();
    if (k >= 1) { const r = 4 + 2.5 * Math.sin(t * 9); c.globalAlpha = .6; c.beginPath(); c.arc(SCAN.x1, SCAN.y1, r, 0, 6.2832); c.stroke(); c.globalAlpha = .35; c.beginPath(); c.arc(SCAN.x1, SCAN.y1, r * 1.8, 0, 6.2832); c.stroke(); }
    c.restore();
  }

  // ---------- спрайт виду на полотно картки ----------
  function drawSprite(e, info) {
    const cv = $('guide').querySelector('canvas'); if (!cv) return; const n = 64, R = Math.min(3, Math.max(1, Math.round(devicePixelRatio || 1))); cv.width = cv.height = n * R; cv.style.width = cv.style.height = n + 'px';
    const c = cv.getContext('2d'); c.setTransform(R, 0, 0, R, 0, 0); c.clearRect(0, 0, n, n); c.imageSmoothingEnabled = false;
    const fit = (src, pad = 6) => {                                                                          // обрізати порожнє навколо спрайта й вписати в полотно
      const w = src.width, h = src.height; let x0 = w, y0 = h, x1 = -1, y1 = -1; try { const d = src.getContext('2d').getImageData(0, 0, w, h).data; for (let y = 0; y < h; y++) for (let x = 0; x < w; x++) if (d[(y * w + x) * 4 + 3] > 40) { if (x < x0) x0 = x; if (x > x1) x1 = x; if (y < y0) y0 = y; if (y > y1) y1 = y; } } catch (err) { x0 = y0 = 0; x1 = w - 1; y1 = h - 1; }
      if (x1 < 0) { x0 = y0 = 0; x1 = w - 1; y1 = h - 1; } const sw = x1 - x0 + 1, sh = y1 - y0 + 1, k = Math.min((n - pad * 2) / sw, (n - pad * 2) / sh, 4), dw = sw * k, dh = sh * k; c.drawImage(src, x0, y0, sw, sh, (n - dw) / 2, (n - dh) / 2, dw, dh); };
    try {
      if (e.grp === 'art') return;                                                                             // (· 55) артефакт соти малює artCard (живий кадр)
      if (e.grp === 'floor' || e.grp === 'garden') { const p = NX.planters && NX.planters.PL.find(q => q.kind === e.kind); if (!p) return;
        if (NX.planters.sprite) { fit(NX.planters.sprite(p), 4); return; }                                               // (· 34) герой перед вікном — власний спрайт
        const r = NX.arc.dcPlant({ kind: p.kind, w: p.w, h: p.h, seed: p.seed, lit: 1, pad: 14 }); if (!r) return;
        const o = document.createElement('canvas'); o.width = r.sw; o.height = r.sh; const oc = o.getContext('2d'), im = oc.createImageData(r.sw, r.sh); new Uint32Array(im.data.buffer).set(r.d); oc.putImageData(im, 0, 0); fit(o, 4); return; }
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

  // ---------- (· 55) картка артефакта: об'єкт цілий, збільшений і ЖИВИЙ ----------
  /** Полотно 96×96: ніша-сота кольору своєї комірки (контур шестикутника, сяйво, поличка), на ній артефакт ×3 — той самий
   *  спрайт, що стоїть у кімнаті (NX.decorArt.sprite), кадр за кадром, поки картка відкрита. */
  let raf = 0;
  function artCard() {
    cancelAnimationFrame(raf); if (!cur || cur.e.grp !== 'art' || !NX.decorArt) return; raf = requestAnimationFrame(artCard);
    const cv = $('guide').querySelector('canvas'), n = 100, m = n / 2, R = Math.min(3, Math.max(1, Math.round(devicePixelRatio || 1))), t = performance.now() / 1000, neon = (cur.info && cur.info.neon) || '#ffd27a', DA = NX.decorArt;
    if (cv.width !== n * R) { cv.width = cv.height = n * R; cv.style.width = cv.style.height = n + 'px'; }
    const c = cv.getContext('2d'); c.setTransform(R, 0, 0, R, 0, 0); c.clearRect(0, 0, n, n); c.imageSmoothingEnabled = false;
    c.fillStyle = '#0a0a26'; c.fillRect(0, 0, n, n);
    const P6 = (q, r) => [m + r * Math.cos(q * Math.PI / 3), m + r * Math.sin(q * Math.PI / 3)], hexP = r => { c.beginPath(); for (let q = 0; q < 6; q++) { const p = P6(q, r); q ? c.lineTo(p[0], p[1]) : c.moveTo(p[0], p[1]); } c.closePath(); };
    const g = c.createRadialGradient(m, m - 8, 4, m, m, m + 2); g.addColorStop(0, neon + '66'); g.addColorStop(.6, neon + '1c'); g.addColorStop(1, '#0a0a2600'); hexP(48); c.fillStyle = '#12103a'; c.fill(); c.fillStyle = g; c.fill();
    c.globalAlpha = .55 + .25 * Math.sin(t * 2); c.strokeStyle = neon; c.lineWidth = 2; hexP(47); c.stroke(); c.globalAlpha = .25; c.lineWidth = 1; hexP(42); c.stroke(); c.globalAlpha = 1;
    const u = (t * .5) % 6, i = Math.floor(u), f = u - i, A = P6(i, 47), B = P6((i + 1) % 6, 47); c.fillStyle = '#ffffff'; c.fillRect(A[0] + (B[0] - A[0]) * f - 1.5, A[1] + (B[1] - A[1]) * f - 1.5, 3, 3);   // вогник по кромці — як у кімнаті
    const S = 3, w = DA.W * S, h = DA.H * S, x = m - w / 2, y = 96 - h;                                              // ×3 — цілі пікселі, артефакт увесь у кадрі
    c.fillStyle = neon; c.globalAlpha = .8; c.fillRect(m - 28, 96, 56, 1); c.globalAlpha = .35; c.fillStyle = '#05020f'; c.beginPath(); c.ellipse(m, 96, w * .36, 2.5, 0, 0, 6.2832); c.fill(); c.globalAlpha = 1;
    c.drawImage(DA.sprite(cur.e.kind, t), x, y, w, h);
  }

  // ---------- картка ----------
  function render() {
    const el = $('guide'); if (!el || !cur) return; const { e, info } = cur, T = NX.t, R = reg();
    if (e.grp === 'art') {                                                                                   // (· 27) картка речі Nexi: назва, підпис-історія, золота рамка
      el.querySelector('b').textContent = T('decor.guide.art.head') + ' · ' + T('decor.guide.no') + String(e.no).padStart(2, '0');
      el.querySelector('.gn').textContent = T(`decor.guide.art.items.${e.kind}.n`); el.querySelector('small').textContent = T(`decor.guide.art.items.${e.kind}.d`);
      el.querySelector('.gw').textContent = T('decor.guide.art.kind') + ' · ' + T('decor.guide.art.where'); el.querySelector('.gc').textContent = T('decor.guide.art.count', { n: ART_KINDS.length });
      el.style.borderColor = (info && info.neon) || '#ffd27a'; artCard(); return; }
    el.querySelector('b').textContent = T('decor.guide.head') + ' · ' + T('decor.guide.no') + String(e.no).padStart(3, '0');
    el.querySelector('.gn').textContent = T(`decor.guide.sp.${e.grp}.${e.kind}`);
    const lat = T('decor.guide.latin.' + e.kind); el.querySelector('small').textContent = lat.startsWith('decor.') ? '' : lat;
    const kindT = e.grp === 'reef' ? 'fish' : e.grp === 'jelly' ? 'jel' : 'plant', gs = e.grp === 'wall' && NX.decorGrow ? NX.decorGrow.state(e.kind) : null;   // (· 22) росте / цвіте
    el.querySelector('.gw').textContent = T('decor.guide.kind.' + kindT) + ' · ' + T('decor.guide.where.' + e.grp) + (e.grp === 'farm' && info && info.s != null ? ' · ' + T('decor.guide.stage', { s: Math.min(6, Math.floor(info.s * 6) + 1) }) : '') + (gs ? ' · ' + T('decor.guide.grow.' + gs) : '');
    el.querySelector('.gc').textContent = T('decor.guide.count', { n: R.n });
    el.style.borderColor = { wall: '#3bff8a', garden: '#7aff9a', floor: '#9aff6a', farm: '#b8ff3a', reef: '#3be8ff', jelly: '#d94bff' }[e.grp];
    drawSprite(e, info);
  }
  function show(e, info) {
    const el = $('guide'); if (!el || !e) return; cur = { e, info }; render(); el.classList.add('show');
    clearTimeout(timer); timer = setTimeout(hide, (e.grp === 'art' ? HIDE_ART : HIDE) * 1000);                    // (· 55) артефакт — довше: є на що дивитись
  }
  function hide() { const el = $('guide'); if (el) el.classList.remove('show'); cur = null; }
  { const el = $('guide'); if (el) el.addEventListener('click', hide); }                                    // розмітка — вище скриптів (index.html)
  NX.i18n.onLang(() => { REG = null; if (cur) render(); });

  NX.decorGuide = {
    reg, statics, show, hide, spots,
    /** (· 19) Промінь сканера на живий шар (objects/decor_live.js draw). */
    draw: drawScan,
    /** Куди летіти Nexi сканувати рослини на стіні side: [{kind, x, y, z}] (точка на рослині; z — глибина), 3 випадкові, зліва направо. */
    scanSpots(side, n = 3) { const all = spots().filter(g => side === 'left' ? g.cx < 774 : g.cx >= 774), pick = []; while (all.length && pick.length < n) pick.push(all.splice(Math.random() * all.length | 0, 1)[0]); return pick.sort((a, b) => a.cx - b.cx).map(g => ({ kind: g.kind, x: g.cx, y: g.cy, z: g.z })); },
    /** Nexi сканує: промінь від руки (hx, hy) до рослини виду kind, dur с; на половині — картка виду відкривається. */
    scanFrom(hx, hy, kind, t, dur = 1.6) { const g = spots().find(q => q.kind === kind); if (!g) return; SCAN = { x0: hx, y0: hy, x1: g.cx, y1: g.cy, t0: t, dur, kind }; },
    scanTick(hx, hy, t, k) { if (!SCAN) return; SCAN.x0 = hx; SCAN.y0 = hy; if (k > .45 && !SCAN.done) { SCAN.done = 1; show(find('wall', SCAN.kind)); } },
    scanEnd() { SCAN = null; },
    /** Тап, який уже влучив у декор (objects/decor_live.js tap): hit — що саме, L — рослина LP (hit 'plant'). */
    tap(hit, x, y, t, L) {
      if (hit === 'plant' && L && L.e && L.e.sp) return show(find('wall', L.e.sp.kind));
      if (WALL_ALIAS[hit]) return show(find('wall', WALL_ALIAS[hit]));
      if (hit === 'hex') return void this.tapStatic(x, y);
      if (hit === 'vault' && NX.decorVault) return show(find('farm', NX.decorVault.lastKind));
      if (hit === 'planter' && NX.planters) return show(find('garden', NX.planters.lastKind) || find('floor', NX.planters.lastKind));                   // (· 31) вазон перед вікном                   // (· 20) капсула сховища насіння                                                   // рослина в соті (бонсай, ехеверія, кактус, сансев'єрія)
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
      if (!best) { let hx = null; for (const H of HEXC) if (x >= H.x0 && x <= H.x1 && y >= H.y0 && y <= H.y1 && (!hx || H.a < hx.a)) hx = H;   // (· 27) тап по порожньому місцю соти — вміст соти
        if (hx) best = statics().find(S => S.on === hx.id) || null; }
      if (!best) return false; show(find(best.grp, best.kind), best.grp === 'art' ? { box: best, neon: best.neon } : null); return true;
    },
  };
})();

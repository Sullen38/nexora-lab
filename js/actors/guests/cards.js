/* ============================================================================
 * actors/guests/cards.js — КАРТКИ ГОСТЕЙ: СТОРІНКА КОЛЕКЦІЇ «PARTY» І КАРТКА ГЕРОЯ (крок 43, 06.11, чат «Персонажі»)
 * ----------------------------------------------------------------------------
 * Власник: «карточки поміняй, зроби красивіше; красивий напис PARTY на сторінці, де видно всі карточки гостей; карточки
 * анімовані; картка дівчат у купальнику / спеленого Буратіно теж — у колекції, якщо тапати на них у новому луці; на героя
 * нажимаєш — карточка з ним відкривається».
 * Спільний екран для кімнати (тап по табличці «ГОСТІ n/20» біля брами) і вечірки (тап по постеру «Колекція друзів»):
 *  • СІТКА: напис PARTY — великі неонові літери, кожна гойдається й міняє колір, подвійна тінь, іскри; під ним підзаголовок.
 *    Картки: голографічний фон у кольорі героя, «пливуть» (sin), світна рамка пульсує, по картці біжить блік, герой
 *    анімований (кадри stand за часом), табличка з ім'ям. Якщо зібрано ОБРАЗ (guests.alts) — картка час від часу сама
 *    перевертається (3D-фліп через scaleX) і показує героя в новому вигляді з зірочкою «ОБРАЗ». Незібрані — чорний силует,
 *    «перешкоди», «?». Внизу — шкала n/20 і лічильник образів.
 *  • КАРТКА ГЕРОЯ (тап по картці в сітці або по герою на вечірці): велика картка з нахилом за часом, герой крупно (пози
 *    stand → cheer → walk по колу), ім'я, репліка з guests.<id>.t (міняється), чіп образу; тап по картці — фліп на образ
 *    (якщо є); тап поза карткою — назад до сітки (або закрити, якщо відкрито з героя).
 * Малюється поверх усього в екранних координатах (core/loop.js для кімнати, party.js drawHud для вечірки); тапи перехоплює
 * core/camera.js (кімната) і party.js (вечірка) через NX.cards.tap(sx, sy).
 * ========================================================================== */
NX.cards = (() => {
  const S = { on: false, mode: 'grid', id: null, t0: 0, from: 'grid', flip: {}, hero: null, boxes: [], tapN: 0 };
  const P = () => NX.px, A = () => NX.guestArt, NEON = ['#ff4fd8', '#3be8ff', '#ffe27a', '#3bff8a', '#ff7a2a', '#b48aff'];
  const R = (c, x, y, w, h, col) => { c.fillStyle = col; c.fillRect(x, y, w, h); };
  const COLS = { babaYaga: '#9ad83a', snowWhite: '#ff5a7a', cheshire: '#c88aff', redHood: '#ff4a4a', whiteRabbit: '#9af6ff', kolobok: '#ffd23a', pinocchio: '#ff9a3a', pussBoots: '#ffb05a', quixote: '#c8c8e0', sherlock: '#8ab4ff', robinHood: '#5ad86a', mavka: '#5ae0a0', firebird: '#ffb02a', stNicholas: '#ff6a6a', cinderella: '#7ac8ff', merlin: '#b48aff', genie: '#3be8ff', tinMan: '#b0c4d8', silver: '#ff8a5a', gorynych: '#5ae07a' };
  const col = id => COLS[id] || '#ff4fd8';
  const hexA = (h, a) => h + Math.round(a * 255).toString(16).padStart(2, '0');

  function open(mode = 'grid', id = null) { S.on = true; S.mode = mode; S.id = id; S.t0 = NX.time; S.from = mode; S.hero = id ? { t0: NX.time, flip: 0, sx: 1 } : null; document.body.classList.add('nx-cards'); }
  function close() { S.on = false; S.hero = null; document.body.classList.remove('nx-cards'); }

  /** Рамка-картка в піксельному стилі: зрізані кути, подвійна рамка, голограма. */
  function frame(c, x, y, w, h, cl, a, got) {
    const g = c.createLinearGradient(x, y, x + w, y + h); g.addColorStop(0, got ? '#1a1448' : '#0a0820'); g.addColorStop(.5, got ? '#120e3a' : '#07051a'); g.addColorStop(1, got ? '#1c1050' : '#0a0820'); c.fillStyle = g;
    c.beginPath(); c.moveTo(x + 6, y); c.lineTo(x + w - 6, y); c.lineTo(x + w, y + 6); c.lineTo(x + w, y + h - 6); c.lineTo(x + w - 6, y + h); c.lineTo(x + 6, y + h); c.lineTo(x, y + h - 6); c.lineTo(x, y + 6); c.closePath(); c.fill();
    if (got) { const hg = c.createLinearGradient(x, y, x + w, y + h * .6); hg.addColorStop(0, hexA(cl, 0)); hg.addColorStop(.5, hexA(cl, .22 * a)); hg.addColorStop(1, hexA(cl, 0)); c.fillStyle = hg; c.fill(); }
    c.lineWidth = 1.5; c.strokeStyle = got ? cl : '#2a2260'; c.globalAlpha *= got ? .6 + a * .4 : 1; c.stroke(); c.globalAlpha /= got ? .6 + a * .4 : 1;
    if (got) { c.lineWidth = 2; c.strokeStyle = '#ffffff'; c.globalAlpha *= .7; for (const [qx, qy, dx, dy] of [[x, y + 6, 1, 1], [x + w, y + 6, -1, 1], [x, y + h - 6, 1, -1], [x + w, y + h - 6, -1, -1]]) { c.beginPath(); c.moveTo(qx, qy + dy * 8); c.lineTo(qx, qy); c.lineTo(qx + dx * 6, qy - dy * 6); c.stroke(); } c.globalAlpha /= .7; }
  }
  /** Блік по картці: діагональна смуга, що біжить (кліп у прямокутник картки). */
  function sheen(c, x, y, w, h, t, ph) {
    const k = ((t * .35 + ph) % 1.6) - .3, sx = x + k * (w + h) - h; c.save(); c.beginPath(); c.rect(x, y, w, h); c.clip(); const g = c.createLinearGradient(sx, y, sx + 30, y + 30); g.addColorStop(0, 'rgba(255,255,255,0)'); g.addColorStop(.5, 'rgba(255,255,255,.18)'); g.addColorStop(1, 'rgba(255,255,255,0)'); c.fillStyle = g; c.beginPath(); c.moveTo(sx, y + h); c.lineTo(sx + h, y); c.lineTo(sx + h + 30, y); c.lineTo(sx + 30, y + h); c.closePath(); c.fill(); c.restore();
  }
  /** Герой на картці: кадр за часом, тінь-кружок, зірочки для образу. */
  function hero(c, id, look, cx, cy, maxW, maxH, t, pose = 'stand') {
    const img = A().frame(id, pose, Math.floor(t * 7), t, { look: look || '' }), [GW, GH, K] = A().size(id), s = Math.min(maxH / (GH * K), maxW / (GW * K)), w = GW * K * s, h = GH * K * s;
    c.save(); c.imageSmoothingEnabled = false; c.globalAlpha *= .35; c.fillStyle = '#000'; c.beginPath(); c.ellipse(cx, cy + 2, w * .4, 4, 0, 0, 6.283); c.fill(); c.restore();
    c.save(); c.imageSmoothingEnabled = false; c.drawImage(img, cx - w / 2, cy - h, w, h); c.restore(); return [w, h];
  }
  /** Напис PARTY: літери гойдаються, колір біжить по спектру, подвійна тінь, іскри довкола. */
  function title(c, cx, y, size, t, txt) {
    c.save(); c.font = `${size}px "Press Start 2P", monospace`; c.textBaseline = 'middle'; c.textAlign = 'left'; const ws = [...txt].map(ch => c.measureText(ch).width), tot = ws.reduce((a, b) => a + b, 0) + (txt.length - 1) * size * .12; let x = cx - tot / 2;
    P().glow(c, cx, y, tot * .7, '#ff4fd8', .18 + Math.sin(t * 2) * .05);
    [...txt].forEach((ch, i) => { const dy = Math.sin(t * 2.2 + i * .9) * size * .12, cl = NEON[(i + Math.floor(t * 1.5)) % 6], cl2 = NEON[(i + 3 + Math.floor(t * 1.5)) % 6];
      c.fillStyle = '#2a0a3a'; c.fillText(ch, x + 4, y + dy + 4); c.fillStyle = cl2; c.fillText(ch, x + 2, y + dy + 2); c.fillStyle = cl; c.fillText(ch, x, y + dy); c.fillStyle = '#ffffff'; c.globalAlpha = .5; c.fillText(ch, x - 1, y + dy - 1); c.globalAlpha = 1;
      c.fillStyle = '#fff'; c.fillRect(x + ws[i] * .25, y + dy - size * .42, 2, 2); x += ws[i] + size * .12; });
    for (let i = 0; i < 10; i++) { const k = (t * .7 + i / 10) % 1, sx = cx + Math.cos(i * 2.4 + t * .9) * tot * .62, sy = y + Math.sin(i * 1.9 + t * 1.3) * size * .8; c.globalAlpha = 1 - k; c.fillStyle = NEON[i % 6]; c.fillRect(sx - 1.5, sy - 1.5, 3, 3); }
    c.restore();
  }
  /** Фон сторінки: темний градієнт, зорі, що пливуть, голо-сітка, віньєтка. */
  function backdrop(c, vw, vh, t, a) {
    const g = c.createLinearGradient(0, 0, 0, vh); g.addColorStop(0, 'rgba(10,6,30,.96)'); g.addColorStop(1, 'rgba(3,2,12,.98)'); c.fillStyle = g; c.fillRect(0, 0, vw, vh);
    c.globalAlpha = a * .5; for (let i = 0; i < 60; i++) { const sx = ((i * 97.3 + t * (6 + i % 5 * 3)) % (vw + 20)) - 10, sy = (i * 53.7) % vh, tw = .4 + Math.sin(t * 3 + i) * .4; c.fillStyle = i % 7 ? '#ffffff' : NEON[i % 6]; c.globalAlpha = a * tw * .6; c.fillRect(sx, sy, i % 9 ? 1 : 2, i % 9 ? 1 : 2); }
    c.globalAlpha = a * .07; for (let y = (t * 12) % 18; y < vh; y += 18) R(c, 0, y, vw, 1, '#3be8ff'); c.globalAlpha = a;
  }

  /** СІТКА КАРТОК. */
  function drawGrid(c, vw, vh, t) {
    const ids = NX.guests.IDS, got = NX.guests.collection(), alts = NX.guests.alts(), port = vh > vw, cols = port ? 4 : 5, rows = Math.ceil(ids.length / cols), k0 = Math.min(1, (t - S.t0) / .3);
    const tsz = port ? Math.min(34, vw / 7) : 44, top = port ? 110 : 112, cw = Math.min(port ? 150 : 210, (vw - 24) / cols), ch = Math.min(port ? (vh - top - 70) / rows : 190, (vh - top - 64) / rows), gx0 = (vw - cw * cols) / 2;
    c.save(); c.globalAlpha = k0; backdrop(c, vw, vh, t, k0); title(c, vw / 2, port ? 44 : 46, tsz, t, NX.t('cards.title')); P().text(c, NX.t('cards.sub'), vw / 2, port ? 82 : 86, '#9af6ff', port ? 7 : 8, 'center');
    S.boxes = []; c.imageSmoothingEnabled = false;
    ids.forEach((id, i) => {
      const cx = gx0 + (i % cols) * cw + cw / 2, fl = Math.sin(t * 1.6 + i * 1.3) * 3, cy = top + Math.floor(i / cols) * ch + fl, bw = cw - 10, bh = ch - 10, has = got.includes(id), alt = alts[id], cl = col(id), pl = .5 + Math.sin(t * 3 + i) * .5;
      S.boxes.push({ id, x: cx - bw / 2, y: cy, w: bw, h: bh, has });
      // фліп на образ: кожна картка з образом перевертається раз на ~6 с (фаза i), 0.6 с анімації; у стані «образ» — 2.4 с
      let look = '', sx = 1; if (has && alt) { const ph = (t * .8 + i * .7) % 6, fk = ph < .6 ? ph / .6 : ph > 3 && ph < 3.6 ? (ph - 3) / .6 : -1; if (fk >= 0) { sx = Math.cos(fk * Math.PI); look = (ph < .6 ? fk > .5 : fk <= .5) ? alt : ''; } else look = ph >= .6 && ph <= 3 ? alt : ''; }
      c.save(); c.translate(cx, cy + bh / 2); c.scale(Math.max(.04, Math.abs(sx)), 1); c.translate(-cx, -cy - bh / 2);
      frame(c, cx - bw / 2, cy, bw, bh, cl, pl, has);
      if (has) { P().glow(c, cx, cy + bh * .5, bw * .5, cl, .18 + pl * .1); hero(c, id, look, cx, cy + bh - 26, bw - 20, bh - 44, t + i); sheen(c, cx - bw / 2, cy, bw, bh, t, i * .37);
        const nm = (look ? (NX.t(`cards.looks.${look}`) || '') : '') || NX.t(`guests.${id}.n`) || id; c.font = '6px "Press Start 2P", monospace'; const fs = c.measureText(nm).width > bw - 12 ? 5 : 6, nw = Math.min(bw - 6, c.measureText(nm).width * fs / 6 + 12);
        R(c, cx - nw / 2, cy + bh - 19, nw, 13, '#0a0626'); c.strokeStyle = hexA(cl, .8); c.lineWidth = 1; c.strokeRect(cx - nw / 2 + .5, cy + bh - 18.5, nw - 1, 12); P().text(c, nm, cx, cy + bh - 9, look ? '#ffffff' : '#ffe27a', fs, 'center');
        if (alt) { const st = look ? '★' : '☆'; P().text(c, st, cx + bw / 2 - 9, cy + 11, '#ffe27a', 7, 'center'); }
        const spk = (t * 2 + i) % 6.283; R(c, cx + Math.cos(spk) * bw * .38, cy + bh * .45 + Math.sin(spk * 1.7) * bh * .3, 2, 2, '#ffffff'); }
      else { c.save(); c.filter = 'brightness(0)'; c.globalAlpha *= .85 + Math.sin(t * 7 + i) * .08; hero(c, id, '', cx, cy + bh - 26, bw - 20, bh - 44, 0); c.restore();
        c.save(); c.globalAlpha *= .3; for (let y = cy + 3; y < cy + bh - 3; y += 3) if (Math.sin(y * .7 + t * 9 + i) > .6) R(c, cx - bw / 2 + 3, y, bw - 6, 1, '#3a3270'); c.restore(); P().text(c, '?', cx, cy + bh - 9, '#8a82c0', 9, 'center'); }
      c.restore();
    });
    const pw = Math.min(vw - 60, 420), px0 = vw / 2 - pw / 2, py = vh - (port ? 46 : 40); R(c, px0, py, pw, 8, '#0f0c2e'); c.strokeStyle = '#3be8ff'; c.lineWidth = 1; c.strokeRect(px0 + .5, py + .5, pw - 1, 7); const prog = got.length / ids.length; if (prog) { const gg = c.createLinearGradient(px0, 0, px0 + pw * prog, 0); gg.addColorStop(0, '#3be8ff'); gg.addColorStop(1, '#ff4fd8'); c.fillStyle = gg; c.fillRect(px0 + 1, py + 1, pw * prog - 2, 6); }
    P().text(c, `${got.length}/${ids.length}`, px0 + pw + 6, py + 7, '#ffe27a', 7); P().text(c, `★ ${Object.keys(alts).length}/${ids.length}`, px0 - 6, py + 7, '#ffe27a', 7, 'right');
    P().text(c, NX.t('cards.hint'), vw / 2, vh - (port ? 22 : 18), '#8a8aa8', 6, 'center'); c.restore();
  }
  /** КАРТКА ГЕРОЯ. */
  function drawHero(c, vw, vh, t) {
    const H = S.hero, id = S.id, has = NX.guests.collection().includes(id), alt = NX.guests.alts()[id], cl = col(id), port = vh > vw, k0 = Math.min(1, (t - H.t0) / .3), ease = 1 - Math.pow(1 - k0, 3);
    const w = port ? Math.min(280, vw - 40) : 260, h = port ? Math.min(400, vh - 160) : Math.min(360, vh - 120), cx = vw / 2, cy = vh / 2 + (port ? 10 : 0), x = cx - w / 2, y = cy - h / 2;
    c.save(); c.globalAlpha = k0; backdrop(c, vw, vh, t, k0); title(c, vw / 2, port ? 44 : 46, port ? 30 : 36, t, NX.t('cards.title'));
    if (H.flipT) { const fk = Math.min(1, (t - H.flipT) / .5); H.sx = Math.cos(fk * Math.PI); if (fk >= .5 && !H.flipped) { H.flipped = true; H.flip = H.flip ? 0 : 1; } if (fk >= 1) { H.flipT = 0; H.flipped = false; H.sx = 1; } }
    const sx = H.sx || 1, tilt = Math.sin(t * 1.3) * .02, look = H.flip && alt ? alt : '';
    c.translate(cx, cy); c.scale((.9 + .1 * ease) * Math.max(.04, Math.abs(sx)), .9 + .1 * ease); c.rotate(tilt); c.translate(-cx, -cy);
    P().glow(c, cx, cy, w * .7, cl, .3 + Math.sin(t * 2.5) * .08); frame(c, x, y, w, h, cl, .5 + Math.sin(t * 3) * .5, has);
    for (let i = 0; i < 14; i++) { const a = i / 14 * 6.283 + t * .4, rr = w * .62 + Math.sin(t * 2 + i) * 8; c.fillStyle = NEON[i % 6]; c.globalAlpha = k0 * (.4 + Math.sin(t * 3 + i) * .3); c.fillRect(cx + Math.cos(a) * rr, cy + Math.sin(a) * rr * (h / w), 3, 3); } c.globalAlpha = k0;
    S.boxes = [{ id, x, y, w, h, has, big: true }];
    const nm = NX.t(`guests.${id}.n`) || id; P().text(c, nm.toUpperCase(), cx, y + 26, '#ffe27a', port ? 9 : 10, 'center'); R(c, x + 20, y + 36, w - 40, 1, hexA(cl, .8));
    if (has) { const poses = ['stand', 'cheer', 'walk', 'stand'], pose = poses[Math.floor((t - H.t0) / 2.2) % 4]; const [, hh] = hero(c, id, look, cx, y + h - 92, w - 40, h - 150, t, pose); sheen(c, x, y, w, h, t, .2);
      const L = NX.t(`guests.${id}.t`) || NX.t(`guests.${id}.s`) || []; if (L.length) { const li = Math.floor((t - H.t0) / 3.5) % L.length, txt = L[li]; c.font = '6px "Press Start 2P", monospace'; const lines = wrap(c, txt, w - 36); lines.forEach((ln, i) => P().text(c, ln, cx, y + h - 66 + i * 10, '#e8e4ff', 6, 'center')); }
      const chipTxt = look ? '★ ' + (NX.t(`cards.looks.${look}`) || NX.t('cards.look')) : alt ? '☆ ' + NX.t('cards.flipHint') : NX.t('cards.noLook'); c.font = '6px "Press Start 2P", monospace'; const cwid = c.measureText(chipTxt).width + 14; R(c, cx - cwid / 2, y + h - 30, cwid, 14, '#0a0626'); c.strokeStyle = look ? '#ffe27a' : hexA(cl, .7); c.strokeRect(cx - cwid / 2 + .5, y + h - 29.5, cwid - 1, 13); P().text(c, chipTxt, cx, y + h - 20, look ? '#ffe27a' : '#bdb8e0', 6, 'center'); }
    else { c.save(); c.filter = 'brightness(0)'; hero(c, id, '', cx, y + h - 92, w - 40, h - 150, 0); c.restore(); P().text(c, '?', cx, y + h - 40, '#4a4280', 14, 'center'); P().text(c, NX.t('cards.unknown'), cx, y + h - 20, '#8a8aa8', 6, 'center'); }
    c.restore(); c.save(); c.globalAlpha = k0; P().text(c, NX.t('cards.back'), vw / 2, vh - (port ? 22 : 18), '#8a8aa8', 6, 'center'); c.restore();
  }
  function wrap(c, s, maxW) { const out = []; let ln = ''; s.split(' ').forEach(wd => { const tr = ln ? ln + ' ' + wd : wd; if (c.measureText(tr).width > maxW && ln) { out.push(ln); ln = wd; } else ln = tr; }); if (ln) out.push(ln); return out.slice(0, 3); }

  function draw(c, vw, vh, t) { if (!S.on) return; c.save(); c.setTransform(NX.loop.dpr, 0, 0, NX.loop.dpr, 0, 0); if (S.mode === 'hero' && S.id) drawHero(c, vw, vh, t); else drawGrid(c, vw, vh, t); c.restore(); }
  /** Тап в екранних координатах; true — спожито. */
  function tap(sx, sy) {
    if (!S.on) return false; const t = NX.time; if (t - S.t0 < .25) return true;
    const hit = S.boxes.find(b => sx >= b.x && sx <= b.x + b.w && sy >= b.y && sy <= b.y + b.h);
    if (S.mode === 'hero') { if (hit && hit.has && NX.guests.alts()[S.id] && !S.hero.flipT) { S.hero.flipT = t; return true; } if (S.from === 'hero') close(); else { S.mode = 'grid'; S.hero = null; S.t0 = t; } return true; }
    if (hit) { S.mode = 'hero'; S.id = hit.id; S.hero = { t0: t, flip: 0, sx: 1 }; S.t0 = t; return true; }
    close(); return true;
  }
  return { open, close, draw, tap, S, col, get on() { return S.on; } };
})();

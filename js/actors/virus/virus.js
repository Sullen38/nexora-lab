/* ============================================================================
 * actors/virus/virus.js — ВІРУС В AI-ЦЕНТРІ (крок 15)
 * ----------------------------------------------------------------------------
 * Власник (02.11): «якийсь вірус стрибнув на стіл AI, а Рудик його там спопелив поглядом, як Супермен, — таким червоним
 * лазером з очей… але без перебору, щоб іноді мелькало».
 *   ІНЦИДЕНТ — рідко: перший за ~1.5 хв після старту, далі раз на 2.5–4.5 хв; лише коли Nexi не за столом AI-центру (і не
 *     летить туди), а Рудика не забрали Nexi (гладить, годує, селфі…) чи гості (Чеширський кіт, Колобок…) — тоді чекаємо.
 *   1) ТРИВОГА (1.6 с): голо-екран «лагає», шапка червона «ВІРУС!», вірус повзе по мозку (objects/ai_paint.js: aiScreen);
 *      кромка стола й ядра в тумбі блимають червоним;
 *   2) вірус ВИСТРИБУЄ з екрана на стільницю, бігає по ній і «гризе» (іскри); в екрані лишається дірка-глітч;
 *   3) РУДИК (actors/cat/cat.js: hunt): очі червоніють, біжить і застрибує на стіл — вірус тікає на другий край і тремтить
 *      «!»; Рудик пригинається, очі розжарюються — ЛАЗЕР з очей; вірус розлітається пікселями, на столі — димок і слід;
 *   4) екран: зелена печатка з лапкою, «ЗАГРОЗУ ЗНИЩЕНО · АНТИВІРУС: РУДИК»; Nexi (вільний; дрімав — тривога будить)
 *      прибігає подивитись (activities.js: virus; стає перед серединою стола — на телефоні видно і вірус, і Рудика; Рудик
 *      чекає його, пригнувшись, до 6 с) і дякує Рудику.
 *   Рудик не дістався за ~30 с (або Nexi злетів на стіл) — вірус стрибає назад в екран, і AI видаляє його сам.
 * Малюнок — сітка 18×16 кодом: зелений «глітч-жук» з колючками-пікселями, злими очима, зубатою посмішкою й лапками;
 *   контур — як у кота; зрідка глітчить (смуги зсуваються). Тексти на екрані — scene.ai.virus / clean / guard (4 мови).
 * Публічно: NX.virus.S (стан: alert, cleanT, by, v), busy(), sprite(fr, mode) — для екрана; для перевірки — NX.virus.spawn().
 * ========================================================================== */
NX.virus = (() => {
  const S = { next: 85 + Math.random() * 25, v: null, alert: null, cleanT: -99, by: null, scorch: null, huntReq: false, on: true, hole: null };
  const rnd = Math.random, P = NX.px, zone = () => NX.arc && NX.arc.zone && NX.arc.zone('ai');
  const DX0 = 50, DX1 = 178, DY = 284, DV = 6;                                                     // стільниця: межі X, верх Y, глибина (px картинки зони)
  const VW = 18, VH = 16, K = .75;                                                                 // сітка спрайта; масштаб у кімнаті (як Nexi: SPRITE_K)
  const OUT_SCR = [.56, .6];                                                                       // де на екрані (частки скла) вірус вистрибує
  const CATBUSY = ['cuddle', 'petCat', 'feedCat', 'selfie', 'kickBall'], GUESTCAT = ['cheshire', 'kolobok', 'pussBoots', 'gorynych'];
  const deskPt = X => zone().S(X, DY, DV), scale = X => NX.room.scaleAt(zone().S(X, 352, DV)[1]) * K;

  // ---------------- МАЛЮНОК ----------------
  const CACHE = {};
  /** Кадр спрайта: fr — крок лапок, mode — n звичайний, f страх (великі очі, рот «О», краплина), z під лазером (спалах). */
  function sprite(fr, mode = 'n') {
    const key = (fr % 2) + mode; if (CACHE[key]) return CACHE[key];
    const cv = document.createElement('canvas'); cv.width = VW; cv.height = VH; const x = cv.getContext('2d', { willReadFrequently: true });
    const p = (a, b, w, h, col) => { x.fillStyle = col; x.fillRect(a, b, w, h); }, z = mode === 'z';
    const G = z ? '#fff2ec' : '#5cff4a', GL = z ? '#ffffff' : '#d2ffa8', GD = z ? '#ffb4a0' : '#1f9e3a', M = z ? '#ffffff' : '#ff3ad8', Kk = '#140620', R = '#ff2438', W = '#ffffff';
    p(6, 2, 1, 2, GD); p(5, 1, 1, 1, GD); p(3, 0, 2, 2, M); p(11, 2, 1, 2, GD); p(12, 1, 1, 1, GD); p(13, 0, 2, 2, M);                 // вусики з кульками
    p(0, 6, 2, 2, M); p(1, 8, 1, 1, GD); p(16, 6, 2, 2, M); p(16, 8, 1, 1, GD); p(1, 11, 1, 1, M); p(16, 11, 1, 1, M);                 // колючки-пікселі
    [[5, 8], [4, 10], [3, 12], [2, 14], [2, 14], [2, 14], [2, 14], [2, 14], [3, 12], [4, 10], [6, 6]].forEach(([a, w], i) => p(a, 3 + i, w, 1, G));   // тіло
    p(5, 4, 4, 1, GL); p(4, 5, 2, 1, GL); p(3, 6, 1, 2, GL);                                                                        // блік
    p(3, 11, 12, 1, GD); p(4, 12, 10, 1, GD); p(6, 13, 6, 1, GD); p(12, 4, 1, 1, GD); p(13, 9, 1, 1, GD); p(4, 9, 1, 1, GD);          // тінь і плями
    if (mode === 'f') { p(4, 5, 4, 4, W); p(10, 5, 4, 4, W); p(6, 7, 1, 1, Kk); p(12, 7, 1, 1, Kk); p(7, 10, 3, 2, Kk); p(15, 2, 1, 2, '#9ae8ff'); }   // страх
    else {
      p(4, 6, 3, 3, W); p(10, 6, 3, 3, W); p(6, 7, 1, 2, z ? '#ff8a7a' : R); p(12, 7, 1, 2, z ? '#ff8a7a' : R);                      // очі, зіниці вперед
      p(3, 4, 2, 1, Kk); p(5, 5, 2, 1, Kk); p(10, 5, 2, 1, Kk); p(12, 4, 2, 1, Kk);                                                 // злі брови
      p(6, 10, 6, 2, Kk); [6, 8, 10].forEach(tx => p(tx, 10, 1, 1, W)); [7, 9, 11].forEach(tx => p(tx, 11, 1, 1, W));                 // зубата посмішка
    }
    for (let i = 0; i < 4; i++) { const lx = 4 + i * 3, up = (i + fr) % 2; p(lx, 13, 1, up ? 2 : 3, GD); if (!up) p(lx + (i < 2 ? -1 : 1), 15, 1, 1, GD); }   // лапки крокують
    const id = x.getImageData(0, 0, VW, VH), d = id.data, op = new Uint8Array(VW * VH);                                          // темний контур
    for (let i = 0; i < op.length; i++) op[i] = d[i * 4 + 3] > 40 ? 1 : 0;
    for (let yy = 0; yy < VH; yy++) for (let xx = 0; xx < VW; xx++) { const i = yy * VW + xx; if (op[i]) continue;
      if ((xx > 0 && op[i - 1]) || (xx < VW - 1 && op[i + 1]) || (yy > 0 && op[i - VW]) || (yy < VH - 1 && op[i + VW])) { d[i * 4] = 26; d[i * 4 + 1] = 6; d[i * 4 + 2] = 34; d[i * 4 + 3] = 255; } }
    x.putImageData(id, 0, 0); return CACHE[key] = cv;
  }

  // ---------------- ДЛЯ КОТА (actors/cat/cat.js: hunt / aim) ----------------
  const api = {
    alive: () => !!S.v,
    onDesk: () => !!S.v && /desk|fear|zap/.test(S.v.ph),
    x: () => S.v ? S.v.x : 0,
    /** Куди влучає лазер — середина тіла. */
    hit: () => S.v ? [S.v.x, S.v.y - S.v.alt - VH * S.v.s * S.v.zoom * .5] : [0, 0],
    flee(side) { if (S.v) S.v.flee = side; },
    fear() { const v = S.v; if (v && v.ph === 'desk') { v.ph = 'fear'; v.t = 0; } },
    zap() { const v = S.v; if (v) { v.ph = 'zap'; v.t = 0; } },
    kill,
  };

  // ---------------- ЖИТТЯ ----------------
  function canStart() {
    const n = NX.nexi, c = NX.cat;
    if (n.loc === 'aiDesk' || (n.task && (n.task.id === 'ai' || CATBUSY.includes(n.task.id))) || c.mode === 'jump' || c.hunting) return false;
    if (NX.guests && NX.guests.S.list.some(g => GUESTCAT.includes(g.id))) return false;
    return !!(NX.objects.aicenter && NX.objects.aicenter.scrPt(.5, .5));
  }
  function start() {
    const t = NX.time; S.v = { ph: 'screen', t: 0, ft: 0, fr: 0, X: 118, x: 0, y: 0, alt: 0, dir: -1, zoom: .5, s: scale(118), tx: 118, wait: 0, flee: null, fled: false, tdesk: 0 };
    const p = NX.objects.aicenter.scrPt(...OUT_SCR); S.v.x = p[0]; S.v.y = p[1];
    S.alert = { t0: t }; S.hole = null; S.huntReq = true; NX.objects.aicenter.glitch(.7);
    const n = NX.nexi;                                                                                                // Nexi вільний (чи дрімає на дивані — тривога будить) — біжить подивитись
    if (!NX.ui.skinlab.open && (!n.task || n.task.auto) && NX.acts.virus) n.do('virus', false); else n.emote('surprise', 2.5);
  }
  /** Вірус знищено (by: 'cat' — лазер Рудика; 'ai' — утік в екран, AI видалив сам). */
  function end(by) {
    S.v = null; S.alert = null; S.cleanT = NX.time; S.by = by; S.huntReq = false; S.next = NX.time + 150 + rnd() * 110;
    if (NX.cat.hunting) NX.cat.huntEnd();
    const n = NX.nexi; if (!(n.task && n.task.id === 'virus')) n.emote(by === 'cat' ? 'love' : 'happy', 2.2);
  }
  function kill() {
    const v = S.v; if (!v) return; const [x, y] = api.hit();
    for (let i = 0; i < 30; i++) { const a = rnd() * 6.283, sp = 30 + rnd() * 80;                                                     // розлітається пікселями
      NX.fx.emit('bit', x, y, { vx: Math.cos(a) * sp, vy: Math.sin(a) * sp * .7 - 45, g: 170, ttl: .6 + rnd() * .5, s: 1.2 + rnd() * 1.4, col: ['#5cff4a', '#d2ffa8', '#ff3ad8', '#ffffff', '#3be8ff'][rnd() * 5 | 0] }); }
    for (let i = 0; i < 7; i++) NX.fx.emit('steam', x + (rnd() - .5) * 12, y + 2, { col: 'rgba(150,140,160,.55)', ttl: 1.2 + rnd() * .6 });
    S.scorch = { x: v.x, y: v.y, s: v.s, t0: NX.time };
    end('cat');
  }
  function update(dt, t) {
    if (!zone() || !(NX.boot && NX.boot.done)) return;
    const v = S.v;
    if (!v) { if (S.on && t > S.next) { if (canStart()) start(); else S.next = t + 6; } return; }
    v.t += dt; v.ft += dt; if (v.ft > (v.flee != null && v.fled && v.ph === 'desk' ? .06 : .11)) { v.ft = 0; v.fr++; }
    if (NX.nexi.loc === 'aiDesk' && !/back|zap/.test(v.ph)) { v.ph = 'back'; v.t = 0; v.from = [v.x, v.y]; }        // Nexi на столі — AI забирає вірус сам (лазер — дограє)
    if (S.huntReq && NX.cat.mode !== 'jump') { S.huntReq = false; NX.cat.hunt(api); }
    const A = NX.objects.aicenter;
    if (v.ph === 'screen') { if (v.t > 1.6) { v.ph = 'jump'; v.t = 0; v.from = A.scrPt(...OUT_SCR) || [v.x, v.y]; v.X = 104 + rnd() * 28; v.to = deskPt(v.X); S.hole = OUT_SCR; } return; }
    if (v.ph === 'jump') {                                                                                          // з екрана — на стільницю
      const k = Math.min(1, v.t / .7), e = k * k * (3 - 2 * k); v.x = P.lerp(v.from[0], v.to[0], e); v.y = P.lerp(v.from[1], v.to[1], k) - Math.sin(k * Math.PI) * 30; v.zoom = .45 + .55 * e; v.s = scale(v.X);
      v.dir = Math.sign(v.to[0] - v.from[0]) || v.dir; if (rnd() < .7) NX.fx.emit('bit', v.x + (rnd() - .5) * 8, v.y - 6 * v.s, { col: rnd() < .5 ? '#5cff4a' : '#ff3ad8', ttl: .5 });
      if (k >= 1) { v.ph = 'desk'; v.t = 0; v.y = v.to[1]; v.zoom = 1; v.tx = DX0 + rnd() * (DX1 - DX0); for (let i = 0; i < 5; i++) NX.fx.emit('dust', v.x, v.y); }
      return;
    }
    if (v.ph === 'back') {                                                                                          // назад в екран — AI видаляє
      if (!v.from) v.from = [v.x, v.y]; const to = A.scrPt(...OUT_SCR) || v.from, k = Math.min(1, v.t / .6);
      v.x = P.lerp(v.from[0], to[0], k); v.y = P.lerp(v.from[1], to[1], k) - Math.sin(k * Math.PI) * 26; v.zoom = 1 - .55 * k;
      if (k >= 1) end('ai'); return;
    }
    if (v.ph === 'desk') {
      v.tdesk += dt;
      if (v.flee != null && !v.fled) { v.fled = true; v.tx = v.flee < 0 ? DX0 + 2 : DX1 - 2; v.wait = 0; }              // кіт іде — тікає на другий край
      if (v.wait > 0) { v.wait -= dt; v.walk = false; if (rnd() < dt * 7) NX.fx.emit('spark', v.x + v.dir * 6 * v.s, v.y - 2, { col: rnd() < .5 ? '#ff3ad8' : '#5cff4a' }); }   // гризе стіл
      else { const d = v.tx - v.X, st = (v.fled ? 70 : 30) * dt; v.walk = true; if (Math.abs(d) > .5) v.dir = Math.sign(d);
        if (Math.abs(d) <= st) { v.X = v.tx; if (v.fled) v.wait = 99; else { v.wait = .35 + rnd() * .9; v.tx = DX0 + rnd() * (DX1 - DX0); } } else v.X += Math.sign(d) * st; }
      [v.x, v.y] = deskPt(v.X); v.s = scale(v.X);
      if (v.fled) { const c = NX.cat; if (Math.abs(c.x - v.x) > 2) v.dir = Math.sign(c.x - v.x); }                    // дивиться на кота
      if ((v.tdesk > 30 && !/aiDesk/.test(NX.cat.at || '')) || v.tdesk > 45) { v.ph = 'back'; v.t = 0; v.from = null; }
      return;
    }
    if (v.ph === 'fear') { v.walk = false; const c = NX.cat; if (Math.abs(c.x - v.x) > 2) v.dir = Math.sign(c.x - v.x); if (v.t > 10) { v.ph = 'back'; v.t = 0; v.from = null; } return; }   // кіт чекає Nexi ≤ 6 с
    if (v.ph === 'zap') { v.walk = false; if (v.t > 3) { v.ph = 'back'; v.t = 0; v.from = null; } }                        // лазер триває 0.9 с — далі kill()
  }

  // ---------------- МАЛЮВАННЯ ----------------
  function layers() {
    const out = [], t = NX.time, sc = S.scorch;
    if (sc && t - sc.t0 < 4.5) { const a = Math.min(1, 4.5 - (t - sc.t0)) * .55;                                                  // слід на стільниці
      out.push({ y: sc.y + 1, draw: c => { c.save(); c.globalAlpha = a; c.fillStyle = '#1a0a08'; c.beginPath(); c.ellipse(sc.x, sc.y - 1, 8 * sc.s, 1.8 * sc.s, 0, 0, 7); c.fill();
        c.globalAlpha = a * .8; c.fillStyle = '#ff6a3a'; c.fillRect(sc.x - 2 * sc.s, sc.y - 1.6, 1.2 * sc.s, .8 * sc.s); c.fillRect(sc.x + 2.5 * sc.s, sc.y - 1.2, .8 * sc.s, .7 * sc.s); c.restore(); } }); }
    const v = S.v; if (!v || v.ph === 'screen') return out;
    const s = v.s * v.zoom, w = VW * s, h = VH * s;
    out.push({ y: v.ph === 'jump' || v.ph === 'back' ? v.y + 40 : v.y + 7, box: [v.x - w / 2 - 3, v.y - h - 12, v.x + w / 2 + 3, v.y + 2], draw: c => {
      const mode = v.ph === 'zap' ? (Math.floor(t * 24) % 2 ? 'z' : 'f') : v.ph === 'fear' || (v.fled && v.ph === 'desk') ? 'f' : 'n';
      const cv = sprite(v.walk ? v.fr : 0, mode), sh = v.ph === 'fear' || v.ph === 'zap' ? (rnd() - .5) * 1.4 : 0, hop = v.walk ? Math.abs(Math.sin(v.fr * 1.6)) * 1.2 : 0;
      const x0 = v.x - w / 2 + sh, y0 = v.y - v.alt - h - hop;
      c.save(); c.globalAlpha = .4; c.fillStyle = '#000'; c.beginPath(); c.ellipse(v.x, v.y, w * .36, 1.6 * s, 0, 0, 7); c.fill(); c.globalAlpha = 1;
      c.imageSmoothingEnabled = false; c.translate(x0 + w / 2, 0); c.scale(v.dir < 0 ? -1 : 1, 1);
      if (P.hash(Math.floor(t * 9) + 7) > .8 && v.ph !== 'zap') {                                                                  // глітч: смуги зсуваються, кольори розходяться
        for (let b = 0; b < 4; b++) { const dx = (P.hash(Math.floor(t * 30) + b) - .5) * 3 * s; c.drawImage(cv, 0, VH * b / 4, VW, VH / 4, -w / 2 + dx, y0 + h * b / 4, w, h / 4); }
        c.globalCompositeOperation = 'lighter'; c.globalAlpha = .45; c.drawImage(cv, -w / 2 + 1.4 * s, y0, w, h); c.globalAlpha = .3; c.drawImage(cv, -w / 2 - 1.4 * s, y0, w, h);
      } else c.drawImage(cv, -w / 2, y0, w, h);
      c.restore();
      if (v.ph === 'zap') P.glow(c, v.x, y0 + h / 2, w * .9, 'rgba(255,90,60,.9)', .6);
      if (v.ph === 'fear' || (v.fled && v.ph === 'desk' && v.wait > 0)) { const bob = Math.sin(t * 14) * .8; c.save(); c.fillStyle = '#ff4a5a'; c.fillRect(v.x - .9 * s, y0 - 9 * s + bob, 1.8 * s, 5 * s); c.fillRect(v.x - .9 * s, y0 - 3 * s + bob, 1.8 * s, 1.6 * s); c.restore(); }   // «!»
    } });
    return out;
  }
  NX.addObject({ id: 'virus', update, layers });
  return { S, api, sprite, OUT_SCR,
    /** Іде інцидент (тривога / вірус на столі) — Рудик не йде на стіл сам, Nexi не злітає працювати. */
    busy: () => !!S.v,
    /** Для перевірки й знімків: почати інцидент зараз (умови не перевіряються). */
    spawn() { if (!S.v && zone()) start(); return S.v; },
  };
})();

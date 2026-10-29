/* ============================================================================
 * objects/workshop.js — МАЙСТЕРНЯ (СКІНИ): ЖИВИЙ ОБ'ЄКТ
 * ----------------------------------------------------------------------------
 * Нерухома частина майстерні (платформа, капсула, балка, купол, проєктори) — у 3D-розкладці (gen_room.py: workshop(),
 * малюнки граней — objects/ws_paint.js). Тут — те, що живе поверх неї (власник, 29.10: «голограма Nexi з різними скінами;
 * ефекти, фішечки; щоб Nexi міг туди ставати»):
 *   ГОЛОГРАМА NEXI на паді капсули: стоїть у конусі світла, показує ГОТОВІ СКІНИ по черзі (повний оберт — на ребрі змінює
 *     скін, нові пікселі «збираються» скан-лінією), мерехтить, глітчить, назва скіна на голо-табличці в кольорі рідкості;
 *   РЕЛІКВІЇ (власник, 29.10: «предмети — як реліквії, окремо; три кружляють навколо голограми, після оберту змінюються —
 *     колекція Nexi»): три предмети з руки летять по еліпсу навколо голограми (позаду — тьмяніші й менші, спереду —
 *     поверх неї), кожен на правому краю орбіти з іскрами змінюється на наступну реліквію колекції;
 *   МАНІПУЛЯТОР на куполі: дихає в спокої, час від часу сканує голограму променем, а коли Nexi в капсулі міняє скін —
 *     нахиляється й «встановлює» його блискавкою (іскри, спалах);
 *   СКАНУВАННЯ: коли Nexi в капсулі — голограма гасне, кільця сканера бігають по ньому, пад горить яскравіше;
 *   світло: сяйво пада, рожеве світло на підлогу перед платформою, частинки в конусі;
 *   ГОЛО-ПАНЕЛІ СКІНИ й АКСЕСУАРИ обабіч капсули (Правки зон · 2: «голографічними та безрамочними, довшими до низу й
 *     трохи ширшими»): світять з проєкторів на платформі — без рамки, з розчиненими краями; Правки зон · 3 («менш прозорі,
 *     насиченіші, хай підлагують іноді»): щільні насичені кольори, раз на 4–9 с — «лаг» (завис, смуги вбік, сповзання, сніг).
 * Nexi: activities.js -> workshop (злітає на пад: pad(), depth(); enter() / leave(); install() — з ui/skinlab.js).
 * Координати — px картинки зони -> світ -> екран (NX.arc.zone, як у генераторі). Усе кодом, без картинок.
 * ========================================================================== */
(() => {
  const P = NX.px;
  let Z = null; const zone = () => Z || (Z = NX.arc.zone && NX.arc.zone('workshop'));
  // голограма показує готові скіни (actors/nexi/skins.js: SKINS) — без реліквій у руці: реліквії кружляють окремо
  const PRESETS = Object.keys(SKINS);
  const PERIOD = 3.6, SPIN = .9;                                                           // показ скіна, з них оберт (с)
  const ORB = 6.5, RX = 40, RY = 9, RH = 30;                                               // оберт реліквії навколо голограми (с), півосі орбіти, висота реліквії
  // маніпулятор (px картинки зони і відступ углиб v): спокій / «сканую голограму» / «встановлюю скін»
  const ARM = { rest: [[1005, 128, 36.5], [1062, 96, 36.5], [1128, 134, 36.5], [1114, 158, 36.5]],
    look: [[1005, 128, 36.5], [1056, 90, 33], [1120, 120, 27], [1100, 142, 22]],
    zap: [[1005, 128, 36.5], [1064, 94, 30], [1104, 152, 14], [1082, 176, 2]] };
  const S = { idx: 0, shown: 0, mat: 1, occ: false, holoA: 1, scan: 0, zap: 0, look: 0, lookT: 6, fast: 0, motes: [], bolts: [], last: -1 };
  const botCv = document.createElement('canvas'), holoCv = document.createElement('canvas'); holoCv.width = SW; holoCv.height = SH;
  const hx = holoCv.getContext('2d', { willReadFrequently: true });
  const presetOf = i => PRESETS[((i % PRESETS.length) + PRESETS.length) % PRESETS.length], look = i => skinLook(presetOf(i));
  // реліквії: кадр предмета (sprite.js → renderItem) оновлюється 10 разів за секунду (блискавки, полум'я, відблиски); межі
  // намальованого — раз, щоб будь-яка реліквія була однакового розміру на орбіті
  const RCV = {};
  function relic(id, t) {
    const f = Math.floor(t * 10), o = RCV[id] || (RCV[id] = { cv: document.createElement('canvas'), f: -1 });
    if (o.f !== f) { o.f = f; renderItem(id, t, o.cv);
      if (!o.bb) { const W = o.cv.width, H = o.cv.height, d = o.cv.getContext('2d').getImageData(0, 0, W, H).data; let x0 = W, y0 = H, x1 = 0, y1 = 0;
        for (let y = 0; y < H; y++) for (let x = 0; x < W; x++) if (d[(y * W + x) * 4 + 3] > 40) { x0 = Math.min(x0, x); x1 = Math.max(x1, x + 1); y0 = Math.min(y0, y); y1 = Math.max(y1, y + 1); }
        o.bb = x1 > x0 ? [x0, y0, x1, y1] : [0, 0, W, H]; } }
    return o;
  }
  /** Три реліквії на орбіті: кут, позиція, глибина (спереду / позаду), масштаб (зникає й «вистрибує» на правому краю —
   *  там змінюється на наступну реліквію колекції: слот k показує HAND_ITEMS[k + 3·оберти]). */
  function relics(t, cx, cy) {
    const out = [], w = Math.PI * 2 / ORB;
    for (let k = 0; k < 3; k++) {
      const th = t * w + k * Math.PI * 2 / 3, n = Math.floor(th / (Math.PI * 2)), ph = th - n * Math.PI * 2, d = Math.min(ph, Math.PI * 2 - ph);   // d — відстань до точки зміни (0 рад, праворуч)
      const sn = Math.sin(th), pop = d < .32 ? d / .32 : 1;
      out.push({ id: HAND_ITEMS[(k + 3 * n) % HAND_ITEMS.length], x: cx + Math.cos(th) * RX, y: cy + sn * RY + Math.sin(t * 2.2 + k * 2) * 1.2, front: sn > 0, k: (.82 + .2 * (sn + 1) / 2) * pop, swap: d < .2 ? 1 - d / .2 : 0, th });
    }
    return out;
  }
  /** Реліквія на орбіті: темна «підкладка» (щоб предмет читався на яскравій капсулі), сяйво, кільце-п'єдестал, слід позаду,
   *  сам предмет (позаду — тьмяніший), іскри в мить зміни. Розмір — RH (власник: «щоб було видно їх»). */
  function drawRelic(c, t, r, a) {
    const o = relic(r.id, t), [x0, y0, x1, y1] = o.bb, s = Math.min(RH / (y1 - y0), 2) * r.k, hh = (y1 - y0) * s, my = r.y - hh / 2;
    c.save();
    const bg = c.createRadialGradient(r.x, my, 0, r.x, my, hh * .6 + 2); bg.addColorStop(0, `rgba(12,4,34,${a * (r.front ? .55 : .35)})`); bg.addColorStop(1, 'rgba(12,4,34,0)');
    c.fillStyle = bg; c.fillRect(r.x - hh, my - hh, hh * 2, hh * 2);
    c.globalCompositeOperation = 'lighter';
    P.glow(c, r.x, my, hh * .55 + 3, r.front ? 'rgba(255,210,140,.8)' : 'rgba(160,200,255,.6)', a * (r.front ? .5 : .28));
    c.strokeStyle = `rgba(255,230,190,${a * (r.front ? .55 : .25)})`; c.lineWidth = .5; c.beginPath(); c.ellipse(r.x, r.y + .5, 6 * r.k, 1.6 * r.k, 0, 0, 7); c.stroke();   // кільце-«п'єдестал» під реліквією
    for (let j = 1; j <= 4; j++) { const th = r.th - j * .14, xx = r.x - (Math.cos(r.th) - Math.cos(th)) * RX, yy = r.y - (Math.sin(r.th) - Math.sin(th)) * RY; c.fillStyle = `rgba(255,230,180,${a * .35 / j})`; c.fillRect(xx - .6, yy - .6, 1.2, 1.2); }   // слід
    if (r.swap > 0) for (let q = 0; q < 8; q++) { const an = q / 8 * Math.PI * 2 + t * 5, rr2 = 5 + (1 - r.swap) * 9; c.fillStyle = `rgba(255,240,200,${r.swap * a})`; c.fillRect(r.x + Math.cos(an) * rr2 - .7, my + Math.sin(an) * rr2 - .7, 1.4, 1.4); }
    c.restore();
    if (s > .02) { c.save(); c.imageSmoothingEnabled = false; c.globalAlpha = a * (r.front ? 1 : .8); c.drawImage(o.cv, r.x - (x0 + x1) / 2 * s, r.y - y1 * s, o.cv.width * s, o.cv.height * s); c.restore(); }
  }
  /** Орбіта реліквій — пунктирний еліпс, що повільно «біжить»: дальня половина (позаду голограми) або ближня. */
  function orbit(c, t, cx, cy, a, front) {
    c.save(); c.globalCompositeOperation = 'lighter'; c.setLineDash([2, 2]); c.lineDashOffset = -t * 6; c.lineWidth = .6;
    c.strokeStyle = `rgba(255,214,150,${a * (front ? .5 : .28)})`; c.beginPath(); c.ellipse(cx, cy, RX, RY, 0, front ? 0 : Math.PI, front ? Math.PI : Math.PI * 2); c.stroke(); c.restore();
  }
  const ease = k => k < .5 ? 2 * k * k : 1 - Math.pow(-2 * k + 2, 2) / 2;

  // ГОЛО-ПАНЕЛІ СКІНИ / АКСЕСУАРИ (Правки зон · 2, власник: «панелі зі скінами та аксесуарами зроби голографічними та
  // безрамочними — так буде краще; довшими до низу й трохи ширшими»): прямокутник у px картинки зони (X, Y — було 899..943 ×
  // 236..300) і відступ углиб HV; вміст — ws_paint.js NX.arc.wsPane, тут — сама голограма: краї розчиняються (рамки немає),
  // сяйво, скан-лінії, мерехтіння; знизу — промінь із проєктора на платформі (якорі wsProjL/R).
  // Правки зон · 3 (власник: «зроби менш прозорі; хай будуть більш насичені та підлагують іноді — буде круто»): темніша
  // підкладка й щільна насичена завіса (стійки крізь панель ледь видно), скан-лінії — темні смуги, а не «дірки»; «ЛАГ» — раз
  // на 4–9 с панель на 0.35–0.75 с зависає (кадр не оновлюється), а її «смикає»: смуги вбік / зображення сповзає / кольори
  // розходяться (блакитна й рожева «тінь»), сніг, яскравість скаче, зрідка — мить без сигналу; між лагами — мікро-глітч.
  const HPANES = [{ side: -1, X: [896, 950], lens: 'wsProjL', rgb: '150,240,255' }, { side: 1, X: [1060, 1114], lens: 'wsProjR', rgb: '255,160,240' }];
  const HY = [236, 318], HV = 3, HR = 4;                                                   // HR — px полотна на од. екрана
  let FEATHER = null;
  /** Маска «розчинених країв» (біле з м'якими краями) — одна на обидві панелі. */
  function feather(W, H) {
    if (FEATHER && FEATHER.width === W && FEATHER.height === H) return FEATHER;
    const cv = document.createElement('canvas'); cv.width = W; cv.height = H; const x = cv.getContext('2d');
    x.fillStyle = '#fff'; x.fillRect(0, 0, W, H); x.globalCompositeOperation = 'destination-in';
    let g = x.createLinearGradient(0, 0, W, 0); g.addColorStop(0, 'rgba(0,0,0,0)'); g.addColorStop(.05, '#000'); g.addColorStop(.95, '#000'); g.addColorStop(1, 'rgba(0,0,0,0)'); x.fillStyle = g; x.fillRect(0, 0, W, H);
    g = x.createLinearGradient(0, 0, 0, H); g.addColorStop(0, 'rgba(0,0,0,0)'); g.addColorStop(.03, '#000'); g.addColorStop(.94, '#000'); g.addColorStop(1, 'rgba(0,0,0,0)'); x.fillStyle = g; x.fillRect(0, 0, W, H);
    return FEATHER = cv;
  }
  const mkCv = (p, k = 1) => { const cv = document.createElement('canvas'); cv.width = Math.ceil(p.r[2] * HR * k); cv.height = Math.ceil(p.r[3] * HR * k); return cv; };
  /** Полотна панелі (раз): межі на екрані й розмір у од. світу; вміст (cv), готова голограма (k) і темна підкладка з
   *  розчиненими краями (shade). */
  function paneInit(p) {
    const z = zone(), a = z.S(p.X[0], HY[0], HV), b = z.S(p.X[1], HY[1], HV);
    p.r = [a[0], a[1], b[0] - a[0], b[1] - a[1]]; p.fw = (p.X[1] - p.X[0]) * z.m; p.fh = (HY[1] - HY[0]) * z.m;
    p.cv = mkCv(p); p.x = p.cv.getContext('2d'); p.k = mkCv(p); p.kx = p.k.getContext('2d'); p.shade = mkCv(p);
    const s = p.shade.getContext('2d'); s.drawImage(feather(p.shade.width, p.shade.height), 0, 0); s.globalCompositeOperation = 'source-in'; s.fillStyle = 'rgba(4,2,22,.62)'; s.fillRect(0, 0, p.shade.width, p.shade.height);
  }
  /** Голограма панелі (раз на 3 кадри): вміст NX.arc.wsPane, легкий відтінок кольору панелі, темні скан-лінії, краї
   *  розчиняються; потім зведення в одне полотно k — підкладка + вміст + сяйво (щокадру кладеться лише воно). */
  function panePaint(p, t) {
    const x = p.x, W = p.cv.width, H = p.cv.height;
    x.setTransform(1, 0, 0, 1, 0, 0); x.globalCompositeOperation = 'source-over'; x.clearRect(0, 0, W, H);
    x.setTransform(W / p.fw, 0, 0, H / p.fh, 0, 0); NX.arc.wsPane(p.side, x, p.fw, p.fh, t); x.setTransform(1, 0, 0, 1, 0, 0);
    x.globalCompositeOperation = 'source-atop'; const g = x.createLinearGradient(0, 0, 0, H);                         // легкий голографічний відтінок
    g.addColorStop(0, `rgba(${p.rgb},.1)`); g.addColorStop(.5, `rgba(${p.rgb},.04)`); g.addColorStop(1, `rgba(${p.rgb},.12)`); x.fillStyle = g; x.fillRect(0, 0, W, H);
    x.fillStyle = 'rgba(2,0,24,.22)'; for (let y = (Math.floor(t * 20) & 1) * 2; y < H; y += 4) x.fillRect(0, y, W, 2);   // скан-лінії — темні смуги
    x.globalCompositeOperation = 'destination-in'; x.drawImage(feather(W, H), 0, 0); x.globalCompositeOperation = 'source-over';
    const k = p.kx, o = HR * .7; k.globalCompositeOperation = 'source-over'; k.globalAlpha = 1; k.clearRect(0, 0, W, H); k.drawImage(p.shade, 0, 0); k.drawImage(p.cv, 0, 0);
    k.globalCompositeOperation = 'lighter'; k.globalAlpha = .36; k.drawImage(p.cv, o, 0); k.drawImage(p.cv, -o, -o * .6);   // сяйво
    k.globalCompositeOperation = 'source-over'; k.globalAlpha = 1;
  }
  /** «Тіні» для розходження кольорів у лагу: той самий (завислий) кадр, від якого лишено лише блакитне / рожеве (множення
   *  на колір: світле в кадрі — яскрава тінь, темне — ледь видна; суцільна заливка засвічувала панель у біле). Половинна
   *  роздільність — тінь однаково розмита, а початок лагу не «гальмує» кадр. */
  function ghosts(p) {
    if (!p.gc) { p.gc = mkCv(p, .5); p.gm = mkCv(p, .5); }
    [[p.gc, '#00f0ff'], [p.gm, '#ff2ad8']].forEach(([cv, col]) => { const g = cv.getContext('2d'), W = cv.width, H = cv.height;
      g.globalCompositeOperation = 'source-over'; g.clearRect(0, 0, W, H); g.drawImage(p.k, 0, 0, W, H);
      g.globalCompositeOperation = 'multiply'; g.fillStyle = col; g.fillRect(0, 0, W, H);
      g.globalCompositeOperation = 'destination-in'; g.drawImage(p.k, 0, 0, W, H); g.globalCompositeOperation = 'source-over'; });
  }
  /** «Лаг» панелі: коли наступний і скільки триває; kind — 0: смуги смикає вбік, 1: зображення сповзає вгору, 2: завис і
   *  сильне розходження кольорів. Повертає стан, поки лаг триває, інакше null. */
  function lagOf(p, t, n) {
    const L = p.lag || (p.lag = { next: t + 3 + n * 2.5 + Math.random() * 2, end: -1, kind: 0, t0: 0 });
    if (t >= L.next) {
      if (NX.arc.wsPaneFlip && NX.arc.wsPaneFlip(p.side, t) < .8) { L.next = t + .3; return null; }      // саме гортається — не заморожувати спалах карток
      L.t0 = t; L.end = t + .35 + Math.random() * .4; L.next = L.end + 4 + Math.random() * 5; L.kind = Math.floor(Math.random() * 3); ghosts(p);
    }
    return t < L.end ? L : null;
  }
  /** Голо-панель: промінь із лінзи проєктора, готова голограма (ледь мерехтить; у «лагу» — смикається, сповзає, кольори
   *  розходяться, сніг; між лагами — мікро-глітч на мить), пікселі даних летять з лінзи вгору. */
  function drawPane(c, t, p, n) {
    if (!p.cv) paneInit(p);
    const lag = lagOf(p, t, n);
    if (!lag && ((NX.loop.frames + n) % 3 === 0 || !p.ok)) { panePaint(p, t); p.ok = 1; }          // у лагу кадр «зависає»
    const [x, y, w, h] = p.r, L = NX.px3d.proj(zone().anchor(p.lens)), K = p.k, KW = K.width, KH = K.height;
    const st = Math.floor(t * 14), rnd = s => NX.art.hash(st * 7 + s, n * 13 + 5);                   // «ривки» лагу — 14 разів за секунду
    const micro = !lag && NX.art.hash(Math.floor(t * 8), n + 31) > .982;                                // мікро-глітч на мить
    const fl = lag ? (rnd(1) > .86 ? .22 : .7 + .3 * rnd(2)) : .96 + .04 * Math.sin(t * 17 + n * 2) * Math.sin(t * 4.3 + n);
    c.save(); c.globalCompositeOperation = 'lighter'; c.globalAlpha = fl;                                // промінь: з лінзи — віялом угору в панель
    const g = c.createLinearGradient(0, L[1], 0, y + h * .45); g.addColorStop(0, `rgba(${p.rgb},.46)`); g.addColorStop(.35, `rgba(${p.rgb},.18)`); g.addColorStop(1, `rgba(${p.rgb},0)`);
    c.fillStyle = g; c.beginPath(); c.moveTo(L[0] - w * .3, L[1]); c.lineTo(L[0] + w * .3, L[1]); c.lineTo(x + w * .98, y + h * .45); c.lineTo(x + w * .02, y + h * .45); c.closePath(); c.fill();
    P.glow(c, L[0], L[1], 16, `rgba(${p.rgb},.9)`, .55 + .2 * Math.sin(t * 3 + n));
    c.fillStyle = `rgba(${p.rgb},.9)`; c.fillRect(L[0] - w * .28, L[1] - .4, w * .56, .8);
    c.restore();
    c.save(); c.imageSmoothingEnabled = true; c.globalAlpha = fl;
    if (lag) {
      if (lag.kind === 1) {                                                                              // сповзання вгору з «загортанням»
        const ry = ((t - lag.t0) * 80) % h; c.save(); c.beginPath(); c.rect(x - 6, y, w + 12, h); c.clip();
        const dx = (rnd(3) - .5) * 3; c.drawImage(K, x + dx, y - ry, w, h); c.drawImage(K, x + dx, y - ry + h, w, h); c.restore();
      } else {                                                                                           // смуги смикає вбік
        const B = 7, amp = lag.kind === 0 ? 7 : 3;
        for (let b = 0; b < B; b++) { const r = rnd(10 + b), dx = r > .3 ? (r - .5) * 2 * amp : 0; c.drawImage(K, 0, KH * b / B, KW, KH / B, x + dx, y + h * b / B, w, h / B); }
      }
      c.globalCompositeOperation = 'lighter'; const sp = lag.kind === 2 ? 2.6 : 1.4;                      // кольори розходяться
      c.globalAlpha = (lag.kind === 2 ? .34 : .28) * fl; c.drawImage(p.gc, x - sp, y, w, h); c.drawImage(p.gm, x + sp, y + .5, w, h);
      c.globalAlpha = Math.min(1, fl + .2);
      for (let q = 0; q < 26; q++) { c.fillStyle = q % 3 ? 'rgba(230,252,255,.8)' : `rgba(${p.rgb},.85)`; c.fillRect(x + w * rnd(40 + q), y + h * rnd(80 + q), q % 4 ? .8 : 3.5, .7); }   // «сніг»
      c.fillStyle = `rgba(${p.rgb},.6)`; c.fillRect(x, y + h * rnd(3), w, 1.6);                           // яскрава смуга розгортки
    } else if (micro) {                                                                                  // мікро-глітч: одна смуга вбік
      const b = Math.floor(rnd(4) * 6), dx = (rnd(5) - .5) * 6; c.drawImage(K, x, y, w, h); c.drawImage(K, 0, KH * b / 6, KW, KH / 6, x + dx, y + h * b / 6, w, h / 6);
    } else c.drawImage(K, x, y, w, h);
    c.globalCompositeOperation = 'lighter';
    for (let k = 0; k < 7; k++) { const ph = (t * .45 + k / 7 + n * .3) % 1, xx = L[0] + (x + w * (.12 + .76 * NX.art.hash(k, n + 7)) - L[0]) * Math.min(1, ph * 2.2), yy = L[1] - (L[1] - y - h * .1) * ph;   // пікселі даних
      c.globalAlpha = Math.sin(ph * Math.PI) * .85; c.fillStyle = k % 2 ? 'rgba(220,252,255,1)' : `rgba(${p.rgb},1)`; c.fillRect(xx - .5, yy - .5, 1, 1); }
    c.restore();
  }

  /** Кадр голограми (48×56): Nexi в скіні -> голографічний відтінок, скан-лінії, «збирання» знизу вгору, глітч. */
  function holoFrame(t, back, pose) {
    const L = look(S.shown), p = poseFor(pose, t, false); if (back) p.back = 1;
    renderBot(L, p, t, botCv);
    hx.globalCompositeOperation = 'source-over'; hx.clearRect(0, 0, SW, SH); hx.drawImage(botCv, 0, 0);
    hx.globalCompositeOperation = 'source-atop'; const g = hx.createLinearGradient(0, 0, 0, SH); g.addColorStop(0, 'rgba(140,240,255,.3)'); g.addColorStop(.6, 'rgba(120,190,255,.18)'); g.addColorStop(1, 'rgba(255,120,240,.28)'); hx.fillStyle = g; hx.fillRect(0, 0, SW, SH);
    hx.globalCompositeOperation = 'destination-out'; hx.fillStyle = 'rgba(0,0,0,.34)'; for (let y = (Math.floor(t * 30) & 1); y < SH; y += 2) hx.fillRect(0, y, SW, 1);
    if (S.mat < 1) { const cut = SH * (1 - ease(S.mat)); hx.fillStyle = '#000'; hx.fillRect(0, 0, SW, Math.floor(cut)); }
    hx.globalCompositeOperation = 'source-over';
    if (Math.sin(t * 1.7) > .97) { const y = (t * 97 % SH) | 0, h = 3 + (t * 13 % 4 | 0), dx = Math.sin(t * 50) > 0 ? 2 : -2; hx.drawImage(holoCv, 0, y, SW, h, dx, y, SW, h); }   // глітч-зсув
    return holoCv;
  }

  /** Маніпулятор 2D-ланками в площині лиця (фронтальний вигляд): тіні-контур, об'ємна ланка (світлий верх), неонова
   *  пунктирна смуга, хомути, суглоби з блакитним обідком і «оком», захват з помаранчевим вогником; кабель уздовж плеча. */
  function drawArm(c, t, Pts, k) {
    const sc = p => p[2] || 1, W = [14, 11.5, 8];
    const link = (a, b, w, n) => {
      const dx = b[0] - a[0], dy = b[1] - a[1], L = Math.hypot(dx, dy) || 1; let nx = -dy / L, ny = dx / L; if (ny > 0) { nx = -nx; ny = -ny; }   // n — догори
      c.lineCap = 'round'; c.strokeStyle = '#060313'; c.lineWidth = w + 2; c.beginPath(); c.moveTo(a[0], a[1]); c.lineTo(b[0], b[1]); c.stroke();
      const g = c.createLinearGradient(a[0] + nx * w / 2, a[1] + ny * w / 2, a[0] - nx * w / 2, a[1] - ny * w / 2);
      g.addColorStop(0, '#9a8ae8'); g.addColorStop(.18, '#6a5abc'); g.addColorStop(.5, '#3e3284'); g.addColorStop(.85, '#241c56'); g.addColorStop(1, '#120e30');
      c.strokeStyle = g; c.lineWidth = w; c.beginPath(); c.moveTo(a[0], a[1]); c.lineTo(b[0], b[1]); c.stroke();
      c.strokeStyle = 'rgba(220,210,255,.55)'; c.lineWidth = Math.max(.6, w * .09); c.beginPath(); c.moveTo(a[0] + nx * w * .3, a[1] + ny * w * .3); c.lineTo(b[0] + nx * w * .3, b[1] + ny * w * .3); c.stroke();   // блік
      c.setLineDash([2.4, 1.8]); c.lineDashOffset = -t * (n % 2 ? 5 : -5); c.strokeStyle = '#3be8ff'; c.lineWidth = Math.max(.7, w * .13);
      c.beginPath(); c.moveTo(a[0] - nx * w * .22, a[1] - ny * w * .22); c.lineTo(b[0] - nx * w * .22, b[1] - ny * w * .22); c.stroke(); c.setLineDash([]);
      [[a, .16], [b, .84]].forEach(([, f]) => { const x = a[0] + dx * f, y = a[1] + dy * f; c.strokeStyle = '#bcc5e6'; c.lineWidth = w * .2; c.lineCap = 'butt'; c.beginPath(); c.moveTo(x + nx * w * .52, y + ny * w * .52); c.lineTo(x - nx * w * .52, y - ny * w * .52); c.stroke(); });   // хомути
    };
    const joint = (p, r, eye) => {
      c.fillStyle = '#060313'; c.beginPath(); c.arc(p[0], p[1], r + 1, 0, 7); c.fill();
      const g = c.createRadialGradient(p[0] - r * .35, p[1] - r * .35, r * .1, p[0], p[1], r); g.addColorStop(0, '#e8e4ff'); g.addColorStop(.35, '#8e80d8'); g.addColorStop(.8, '#3e3284'); g.addColorStop(1, '#1a1542');
      c.fillStyle = g; c.beginPath(); c.arc(p[0], p[1], r, 0, 7); c.fill();
      c.strokeStyle = '#3be8ff'; c.lineWidth = Math.max(.8, r * .16); c.beginPath(); c.arc(p[0], p[1], r * .82, 0, 7); c.stroke();
      if (eye) { c.fillStyle = '#0a0620'; c.beginPath(); c.arc(p[0], p[1], r * .34, 0, 7); c.fill(); c.fillStyle = '#9af6ff'; c.beginPath(); c.arc(p[0], p[1], r * .16, 0, 7); c.fill(); }
    };
    const [b0, e1, w2, g3] = Pts;
    // кабель: від бази до ліктя, провисає
    c.strokeStyle = '#0a0820'; c.lineWidth = 1.6 * k; c.beginPath(); c.moveTo(b0[0] + 3 * k, b0[1] + 2 * k); c.quadraticCurveTo((b0[0] + e1[0]) / 2 + 2, (b0[1] + e1[1]) / 2 + 9 * k, e1[0] - 2 * k, e1[1] + 4 * k); c.stroke();
    c.strokeStyle = 'rgba(255,79,216,.55)'; c.lineWidth = .5; c.stroke();
    link(b0, e1, W[0] * k * sc(b0), 0); link(e1, w2, W[1] * k * sc(e1), 1); link(w2, g3, W[2] * k * sc(w2), 2);
    joint(b0, 10 * k * sc(b0), true); joint(e1, 9.5 * k * sc(e1), true); joint(w2, 7 * k * sc(w2), true);
    // захват: два пальці під кутом до останньої ланки, помаранчевий вогник між ними
    const dx = g3[0] - w2[0], dy = g3[1] - w2[1], L = Math.hypot(dx, dy) || 1, ux = dx / L, uy = dy / L, fl = 7 * k * sc(w2);
    [-.45, .45].forEach(a => { const ca = Math.cos(a), sa = Math.sin(a), vx = ux * ca - uy * sa, vy = ux * sa + uy * ca;
      c.lineCap = 'round'; c.strokeStyle = '#060313'; c.lineWidth = 3.6 * k; c.beginPath(); c.moveTo(g3[0], g3[1]); c.lineTo(g3[0] + vx * fl, g3[1] + vy * fl); c.stroke();
      c.strokeStyle = '#bcc5e6'; c.lineWidth = 2 * k; c.stroke(); });
    joint(g3, 4.6 * k * sc(w2), false);
    const tip = [g3[0] + ux * fl * .75, g3[1] + uy * fl * .75], on = .6 + .4 * Math.sin(t * 5);
    P.glow(c, tip[0], tip[1], 9 * k, 'rgba(255,170,70,.9)', on); c.fillStyle = '#fff2c8'; c.beginPath(); c.arc(tip[0], tip[1], 1.3 * k, 0, 7); c.fill();
    return tip;
  }
  /** Точки маніпулятора на екрані: суміш поз (спокій / скан / встановлення) + легке «дихання». */
  function armPts(t) {
    const z = zone(), wl = S.look, zk = Math.min(1, S.zap), wz = S.zap > 0 ? (zk < .22 ? ease(zk / .22) : zk > .8 ? ease((1 - zk) / .2) : 1) : 0;   // нахил — тримає — назад
    return ARM.rest.map((r, n) => {
      const l = ARM.look[n], q = ARM.zap[n], sw = n ? [0, 2.2, 3, 2.4][n] : 0;
      let X = r[0] + (l[0] - r[0]) * wl, Y = r[1] + (l[1] - r[1]) * wl, v = r[2] + (l[2] - r[2]) * wl;
      X += (q[0] - X) * wz; Y += (q[1] - Y) * wz; v += (q[2] - v) * wz;
      X += Math.sin(t * .7 + n) * sw; Y += Math.sin(t * .9 + n * 1.7) * sw * .8;
      const w = z.W(X, Y, v), s = NX.persp.D / (NX.persp.D + w[2]), p = NX.px3d.proj(w); return [p[0], p[1], s / .77];
    });
  }

  const W = NX.addObject({
    id: 'workshop', name: 'obj.workshop', act: 'workshop',
    get span() { const z = zone(); return z && z.box ? [z.box[0] - 30, z.box[1] + 40] : null; },              // box (розкладка) — [x0, x1, y0, y1] на екрані
    get hit() { const z = zone(); if (!z || !z.box) return null; const [x0, x1, y0, y1] = z.box; return { x: x0, y: y0 + 30, w: x1 - x0, h: y1 - y0 - 30 }; },
    ready() { return !!zone(); },
    get state() { return S; },                                                              // для перевірок (tools/*)
    get panes() { return HPANES; },                                                         // голо-панелі — для перевірок (лаг: panes[i].lag)
    /** Пад капсули (куди злітає Nexi) і точка на підлозі перед платформою; глибина Nexi в капсулі (масштаб і порядок). */
    pad() { return zone().S(1005, 316, 28); },
    front() { return [this.pad()[0], 362]; },
    depth() { return 357; },
    enter() { S.occ = true; S.scan = 0; },
    leave() { S.occ = false; S.scan = 0; },
    /** Встановлення скіна (ui/skinlab.js -> installFx, коли Nexi в капсулі): маніпулятор нахиляється й «зашиває» скін. */
    install() { S.zap = .001; NX.nexiPhys.kick(2); NX.nexi.emote('surprise', 1.2); },
    /** Вільний час: Nexi милується голограмою — вона швидко прокручує кілька скінів і сипле іскрами. */
    show() { S.fast = 3.4; },
    update(dt, t) {
      if (!zone()) return;
      S.holoA += ((S.occ ? 0 : 1) - S.holoA) * Math.min(1, dt * 5);
      if (S.occ) S.scan += dt;
      if (S.zap > 0) { const was = S.zap; S.zap += dt / 1.7; if (was < .4 && S.zap >= .4) this.burst(); if (S.zap >= 1) S.zap = 0; }   // 1.7 с: нахил, блискавка, повернення
      if (S.fast > 0) S.fast -= dt;
      // скан голограми маніпулятором — час від часу
      S.lookT -= dt; if (S.lookT < 0 && !S.occ) { S.lookT = 9 + Math.random() * 6; S.lookOn = 2.4; }
      if (S.lookOn > 0) S.lookOn -= dt; S.look += (((S.lookOn > 0) ? 1 : 0) - S.look) * Math.min(1, dt * 2.2);
      // зміна скіна голограми: на ребрі оберту (невидимо) — наступний, і пікселі «збираються» знову
      const per = S.fast > 0 ? 1.1 : PERIOD, ph = (t % per) / per, spin = SPIN / per;
      if (ph > 1 - spin * .75 && S.last !== Math.floor(t / per)) { S.last = Math.floor(t / per); S.shown++; S.mat = 0; }
      if (S.mat < 1) S.mat = Math.min(1, S.mat + dt / .55);
      // частинки в конусі
      if (S.holoA > .2 && Math.random() < .5) { const [px, py] = this.pad(); S.motes.push({ x: px + (Math.random() - .5) * 34, y: py - 2, vy: -14 - Math.random() * 18, a: 0, ttl: 1.6 + Math.random(), c: Math.random() < .5 ? '154,246,255' : '255,154,240' }); }
      S.motes = S.motes.filter(m => (m.a += dt) < m.ttl); S.motes.forEach(m => { m.y += m.vy * dt; m.x += Math.sin(m.a * 4 + m.y) * dt * 6; });
      S.bolts = S.bolts.filter(b => (b.a += dt) < b.ttl);
    },
    /** Іскри й спалах на Nexi в момент «встановлення» скіна. */
    burst() { const n = NX.nexi; for (let i = 0; i < 18; i++) NX.fx.emit('spark', n.x + (Math.random() - .5) * 34, n.y - Math.random() * 54, { col: Math.random() < .5 ? '#ffd27a' : '#ffffff' }); S.flash = .35; },
    drawBack(c, t) {
      const z = zone(); if (!z) return;
      const [px, py] = this.pad(), hs = NX.room.scaleAt(357) * SPRITE_K * 1.16, fy = 359;
      HPANES.forEach((p, n) => drawPane(c, t, p, n));                                       // голо-панелі СКІНИ / АКСЕСУАРИ
      c.save();
      // рожеве світло на підлогу перед платформою й сяйво пада
      const fl = c.createRadialGradient(px, fy + 3, 4, px, fy + 3, 120); fl.addColorStop(0, 'rgba(255,90,220,.22)'); fl.addColorStop(1, 'rgba(255,90,220,0)');
      c.globalCompositeOperation = 'lighter'; c.fillStyle = fl; c.save(); c.translate(px, fy + 3); c.scale(1, .16); c.translate(-px, -(fy + 3)); c.fillRect(px - 120, fy - 117, 240, 240); c.restore();
      P.glow(c, px, py - 2, 34 + (S.occ ? 10 : 0), S.occ ? 'rgba(255,140,240,.8)' : 'rgba(255,110,230,.65)', .4 + .15 * Math.sin(t * 3));
      // конус світла з пада (голограма) або колона сканера (Nexi в капсулі)
      const H = 78, a = S.occ ? .5 : .32 * S.holoA + .08;
      const g = c.createLinearGradient(0, py, 0, py - H); g.addColorStop(0, `rgba(170,240,255,${a})`); g.addColorStop(.5, `rgba(255,140,240,${a * .45})`); g.addColorStop(1, 'rgba(255,140,240,0)');
      c.fillStyle = g; c.beginPath(); c.moveTo(px - 20, py); c.lineTo(px + 20, py); c.lineTo(px + 31, py - H); c.lineTo(px - 31, py - H); c.closePath(); c.fill();
      for (let k = 0; k < 5; k++) { const ph = (t * .6 + k * .2) % 1, xx = px - 18 + 36 * ((k * .37 + t * .05) % 1); c.fillStyle = `rgba(200,250,255,${.25 * Math.sin(ph * Math.PI)})`; c.fillRect(xx, py - H * ph - 8, .6, 8); }
      S.motes.forEach(m => { c.fillStyle = `rgba(${m.c},${Math.sin(m.a / m.ttl * Math.PI) * .9})`; c.fillRect(m.x, m.y, 1, 1); });
      // кільця, що підіймаються конусом (з них «збирається» голограма)
      if (S.holoA > .1) for (let k = 0; k < 3; k++) { const ph = (t * .42 + k / 3) % 1, yy = py - 3 - ph * 60, rx = 17 + ph * 9, al = Math.sin(ph * Math.PI) * .55 * S.holoA;
        c.strokeStyle = k % 2 ? `rgba(130,240,255,${al})` : `rgba(255,160,240,${al})`; c.lineWidth = .7; c.beginPath(); c.ellipse(px, yy, rx, rx * .2, 0, 0, 7); c.stroke(); }
      // новий скін «збирається»: потік пікселів з обох голо-панелей дугою в голограму
      if (S.mat < 1 && S.holoA > .3 && z.anchor('wsTabL')) {
        const TL = NX.px3d.proj(z.anchor('wsTabL')), TR = NX.px3d.proj(z.anchor('wsTabR')), to = [px, py - 34];
        for (let q = 0; q < 16; q++) { const u = (S.mat * 1.6 + q / 16) % 1, fr = q % 2 ? TL : TR, x = fr[0] + (to[0] - fr[0]) * u, y = fr[1] + (to[1] - fr[1]) * u - Math.sin(u * Math.PI) * 16;
          c.fillStyle = q % 2 ? `rgba(160,240,255,${1 - u * .5})` : `rgba(255,170,240,${1 - u * .5})`; c.fillRect(x - .7, y - .7, 1.4, 1.4); }
      }
      c.restore();
      // ГОЛОГРАМА (і реліквії на орбіті навколо неї: ті, що позаду, — до голограми, ті, що спереду, — після)
      if (S.holoA > .02) {
        const per = S.fast > 0 ? 1.1 : PERIOD, ph = (t % per) / per, spin = SPIN / per;
        let th = 0; if (ph > 1 - spin) th = ease((ph - (1 - spin)) / spin) * Math.PI * 2;
        const cs = Math.cos(th), back = cs < 0, pose = S.mat < 1 ? 'cheer' : (Math.floor(t / per) % 3 === 1 ? 'wave' : 'stand');
        if (!S.hc || (NX.loop.frames & 1) === 0) S.hc = holoFrame(t, back, pose);                   // кадр голограми — раз на 2 кадри
        const cv = S.hc, hover = 5 + Math.sin(t * 2) * 1.5, w = SW * hs, h = SH * hs, top = FOOT * hs, fl2 = (.86 + .14 * Math.sin(t * 23) * Math.sin(t * 7)) * S.holoA;
        const oy = py - hover - top * .42, RL = relics(t, px, oy);
        orbit(c, t, px, oy, S.holoA, false); RL.filter(r => !r.front).forEach(r => drawRelic(c, t, r, S.holoA));
        c.save(); c.imageSmoothingEnabled = false; c.translate(px, py - hover); c.scale(Math.max(.06, Math.abs(cs)), 1);
        c.globalAlpha = .84 * fl2; c.drawImage(cv, -w / 2, -top, w, h);
        c.globalCompositeOperation = 'lighter'; c.globalAlpha = .28 * fl2; c.drawImage(cv, -w / 2 + .8, -top, w, h); c.drawImage(cv, -w / 2 - .8, -top - .6, w, h);
        c.restore();
        if (S.mat < 1) { const yy = py - hover - top + h * .93 * (1 - ease(S.mat)); c.save(); c.globalCompositeOperation = 'lighter'; c.fillStyle = 'rgba(220,255,255,.9)'; c.fillRect(px - w * .32, yy, w * .64, .9); P.glow(c, px, yy, 16, 'rgba(160,240,255,.7)', .5); c.restore(); }
        orbit(c, t, px, oy, S.holoA, true); RL.filter(r => r.front).forEach(r => drawRelic(c, t, r, S.holoA));
        // голо-табличка: назва скіна в рамці кольору рідкості; каруселька скінів
        const id = presetOf(S.shown), rc = RARITY[SKINS[id].rar], name = NX.t('skin.skin.' + id).toUpperCase(), ty = py - hover - top - 9, N = PRESETS.length, cur = ((S.shown % N) + N) % N;
        c.save(); c.globalAlpha = S.holoA; c.font = '4px "Press Start 2P", monospace'; const tw = Math.min(64, c.measureText(name).width + 10);
        c.fillStyle = 'rgba(6,18,60,.78)'; c.fillRect(px - tw / 2, ty - 5, tw, 8); c.strokeStyle = rc; c.lineWidth = .6; c.strokeRect(px - tw / 2 + .3, ty - 4.7, tw - .6, 7.4);
        c.fillStyle = rc; c.fillRect(px - tw / 2 + 1.6, ty - 1.9, 1.6, 1.6);                                                                                        // вогник рідкості
        c.fillStyle = '#f4fbff'; c.textAlign = 'center'; c.textBaseline = 'middle'; c.fillText(name, px + 1, ty - .7, tw - 6); c.textAlign = 'left'; c.textBaseline = 'alphabetic';
        for (let k = 0; k < N; k++) { const on = k === cur; c.fillStyle = on ? rc : 'rgba(150,230,255,.4)'; c.fillRect(px - N * 1.4 + k * 2.8, ty + 4.5, on ? 1.8 : 1.2, on ? 1.8 : 1.2); }
        c.restore();
      }
      // СКАНУВАННЯ Nexi в капсулі: кільця бігають по ньому, з боків — світлові колони
      if (S.occ) {
        const n = NX.nexi, Hn = 56, k0 = Math.min(1, S.scan / .4);
        c.save(); c.globalCompositeOperation = 'lighter';
        for (let k = 0; k < 3; k++) { const ph = (S.scan * .7 + k / 3) % 1, yy = n.y - Hn * (1 - ph), al = Math.sin(ph * Math.PI) * .85 * k0;
          c.strokeStyle = k % 2 ? `rgba(120,240,255,${al})` : `rgba(255,150,240,${al})`; c.lineWidth = 1.1; c.beginPath(); c.ellipse(n.x, yy, 22, 4.2, 0, 0, 7); c.stroke(); }
        [-1, 1].forEach(sd => { const g2 = c.createLinearGradient(0, n.y, 0, n.y - 70); g2.addColorStop(0, `rgba(255,150,240,${.35 * k0})`); g2.addColorStop(1, 'rgba(255,150,240,0)'); c.fillStyle = g2; c.fillRect(n.x + sd * 30 - 1.5, n.y - 70, 3, 70); });
        c.restore();
      }
      // МАНІПУЛЯТОР (+ промінь скану голограми / блискавка встановлення)
      const pts = armPts(t), tip = drawArm(c, t, pts, (NX.arcLayout && NX.arcLayout.right && NX.arcLayout.right.armRig || {}).k || 1.2);
      if (S.look > .6 && S.holoA > .3) { c.save(); c.globalCompositeOperation = 'lighter'; const hy = py - 40; const g3 = c.createLinearGradient(tip[0], tip[1], px, hy); g3.addColorStop(0, 'rgba(150,240,255,.75)'); g3.addColorStop(1, 'rgba(150,240,255,0)');
        c.strokeStyle = g3; c.lineWidth = 1.2; c.beginPath(); c.moveTo(tip[0], tip[1]); c.lineTo(px + Math.sin(t * 3) * 14, hy + Math.cos(t * 2.3) * 16); c.stroke(); c.restore(); }
      if (S.zap > .24 && S.zap < .8) { const n = NX.nexi, hx2 = n.x, hy2 = n.y - 40; c.save(); c.globalCompositeOperation = 'lighter';
        for (let pass = 0; pass < 2; pass++) { c.strokeStyle = pass ? '#ffffff' : 'rgba(255,170,90,.8)'; c.lineWidth = pass ? .7 : 2.2; c.beginPath(); c.moveTo(tip[0], tip[1]);
          for (let q = 1; q <= 7; q++) { const f = q / 7, j = q < 7 ? (Math.random() - .5) * 7 : 0; c.lineTo(tip[0] + (hx2 - tip[0]) * f + j, tip[1] + (hy2 - tip[1]) * f + j * .5); } c.stroke(); }
        P.glow(c, hx2, hy2, 26, 'rgba(255,220,150,.9)', .7); c.restore(); }
      if (S.flash > 0) { S.flash -= 1 / 60; const n = NX.nexi; P.glow(c, n.x, n.y - 28, 46, 'rgba(255,255,255,.9)', S.flash * 2); }
    },
  });
})();

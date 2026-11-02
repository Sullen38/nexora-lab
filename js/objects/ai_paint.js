/* ============================================================================
 * objects/ai_paint.js — AI-ЦЕНТР («НЕЙРОЦЕНТР»): МАЛЮНКИ ГРАНЕЙ, ЖИВІ ГРАНІ, ВМІСТ ГОЛО-ЕКРАНА
 * ----------------------------------------------------------------------------
 * Розкладка частин — tools/wingbox/gen_room.py: aicenter() (id ai_*). Тут — як виглядають їхні грані (NX.arc.paint[id], пласкі
 * текстури: рушій кладе їх у перспективу) і що на них живе (NX.arc.LIVE[id]); голо-екран — живий об'єкт objects/aicenter.js
 * (вміст — NX.arc.aiScreen нижче).
 * Крок 13 (власник: «AI-центр — великий голо-екран у неоновій рамці (мозок-нейромережа, графіки) над довгим столом з
 * моніторами; якість — як у сусідніх зонах, але кожна своя, з характером»).
 * Характер зони: «мозок кімнати» — глибокий індиго, рожевий неон рамки й кромки (як на концепті), блакитні голограми; по
 * фасадах біжать «нейронні» доріжки з вузлами-синапсами.
 *   ai_top     — стільниця: глянцева кромка з рожевим неоном і «шиною синапсів» (імпульси — живі), посередині — значок «AI»;
 *                зверху — темне скло з ледь видимими доріжками й колом-майданчиком посередині (сюди Nexi злітатиме)
 *   ai_pedL    — тумба-«ядро»: колона ядер у склі (ядра світяться хвилею — живі), від неї розходяться доріжки; бік — доріжки
 *   ai_pedR    — тумба з трьома шухлядами (ручки — неонові риски), вогники стану
 *   ai_knee    — задня панель простору для ніг: доріжки сходяться до «синапсу» з м'яким сяйвом, лоток з кабелем
 *   (крок 13.1 — кімната ширша з боків, куточок кота прибрано: стіл на тумбах замість опор-«водоспадів» з нішею)
 *   ai_monL/R  — монітори по краях стола: чат з клієнтом / лист (нерухомі; передні — поверх голо-екрана)
 *   ai_screen  — висока рамка на столі: шапка з вивіскою, утоплене скло під голо-екран, пульт за моніторами; бік — ґратка
 *   (крок 13.2 — на 15 % більша за аналітику, від неї до краю кімнати; 13.3 — ще ширша: рамка й стіл трохи заходять на бік аналітики)
 * Написи — NX.t (4 мови): scene.ai.* (екран), nav.ai (вивіска — arc_paint.js).
 * ========================================================================== */
(() => {
  const A = NX.arc.kit, T = NX.arc.pt, PAINT = NX.arc.paint, LIVE = NX.arc.LIVE, hash = NX.art.hash, t_ = k => NX.t(k);
  const { icon, rr, inset, bolt, led, vent } = T;
  const CY = '#3be8ff', PK = '#ff4fd8', GR = '#3bff8a', GO = '#ffd27a', VI = '#9a8cff';
  const AI = () => NX.objects.aicenter || {};

  // ---------- «нейронні» доріжки: ламані з вузлами (спільне для граней) ----------
  /** Доріжка друкованої плати: від (x, y) кроками вправо / вгору / вниз під 45°, вузол-синапс на кінці. seed — свій візерунок. */
  function trace(c, x, y, len, seed, col = 'rgba(59,232,255,.5)', w = .35, dir = 1) {
    c.strokeStyle = col; c.lineWidth = w; c.beginPath(); c.moveTo(x, y); let px = x, py = y;
    for (let k = 0; k < 3; k++) { const h = hash(seed, k), seg = len * (.2 + .3 * h); if (k === 1) { const dy = (h > .5 ? 1 : -1) * seg * .5; px += dir * seg * .5; py += dy; } else px += dir * seg; c.lineTo(px, py); }
    c.stroke(); c.fillStyle = '#0a0624'; c.beginPath(); c.arc(px, py, w * 2.4, 0, 7); c.fill(); c.strokeStyle = col; c.lineWidth = w * .9; c.beginPath(); c.arc(px, py, w * 2.4, 0, 7); c.stroke();
    return [px, py];
  }
  /** Тонкий голо-напис-рядок (замість тексту — риски різної довжини). */
  const dash = (c, x, y, w, h, col) => { c.fillStyle = col; c.fillRect(x, y, w, h); };

  // ---------- СТІЛЬНИЦЯ ----------
  const BUS = n => .08 + .84 * n / 15;                                                                 // вузли шини синапсів уздовж кромки (16 шт.)
  /** Кромка стільниці: глянцева губа, рожевий неон унизу, шина синапсів (тьмяна основа; імпульси — живі), значок «AI» посередині. */
  PAINT.ai_top = (c, fw, fh) => {
    const g = c.createLinearGradient(0, 0, 0, fh); g.addColorStop(0, 'rgba(255,190,240,.3)'); g.addColorStop(.2, 'rgba(90,40,150,.22)'); g.addColorStop(1, 'rgba(6,2,22,.6)');
    c.fillStyle = g; c.fillRect(0, 0, fw, fh); A.neon(c, 0, fh * .86, fw, fh * .86, PK, .85);
    const y = fh * .44; c.fillStyle = 'rgba(40,120,200,.45)'; c.fillRect(fw * .06, y - .18, fw * .88, .36);
    for (let n = 0; n < 16; n++) { if (n === 7 || n === 8) continue; const x = fw * BUS(n); c.fillStyle = '#0a0624'; c.fillRect(x - .7, y - .7, 1.4, 1.4); c.fillStyle = 'rgba(120,230,255,.6)'; c.fillRect(x - .4, y - .4, .8, .8); }
    const bw = fw * .085, bx = fw / 2 - bw / 2; c.fillStyle = '#0a0624'; rr(c, bx, fh * .14, bw, fh * .6, .9); c.fill(); A.neonRect(c, bx + .3, fh * .14 + .3, bw - .6, fh * .6 - .6, CY, .35, .7);   // значок «AI»
    icon(c, 'ai', fw / 2, fh * .44, fh * .44, '#bff8ff');
    c.fillStyle = 'rgba(255,255,255,.18)'; c.fillRect(0, 0, fw, .3);
  };
  /** Стільниця зверху: темне скло, ледь видимі доріжки, коло-майданчик посередині (сюди Nexi злітатиме — наступний крок). */
  PAINT.ai_top.sides = {
    top: (c, fw, fh) => {
      for (let k = 0; k < 9; k++) { const x = fw * (.05 + k * .11), y = fh * (.25 + .5 * hash(k, 7)); trace(c, x, y, fw * .07, k + 3, 'rgba(59,232,255,.13)', .3, k % 2 ? 1 : -1); }
      const cx = fw / 2, cy = fh * .5; [[fw * .1, .32], [fw * .075, .2]].forEach(([r, a]) => { c.strokeStyle = `rgba(255,79,216,${a})`; c.lineWidth = .6; c.beginPath(); c.ellipse(cx, cy, r, r * .6, 0, 0, 7); c.stroke(); });
      for (let k = 0; k < 4; k++) { const a = k * Math.PI / 2, r = fw * .1; c.fillStyle = 'rgba(255,150,235,.45)'; c.fillRect(cx + Math.cos(a) * r * 1.12 - .6, cy + Math.sin(a) * r * .67 - .3, 1.2, .6); }
      c.fillStyle = 'rgba(255,255,255,.08)'; c.fillRect(0, fh - .6, fw, .6);
    },
    left: (c, fw, fh) => { const g = c.createLinearGradient(0, 0, 0, fh); g.addColorStop(0, 'rgba(255,190,240,.28)'); g.addColorStop(1, 'rgba(6,2,22,.6)'); c.fillStyle = g; c.fillRect(0, 0, fw, fh); A.neon(c, 0, fh * .86, fw, fh * .86, PK, .85); },
  };
  /** Шина синапсів оживає: імпульси біжать від середини до країв і назад, вузли спалахують, коли імпульс проходить. */
  LIVE.ai_top = { every: 4, step: 6, draw(c, fw, fh, t) {
    const y = fh * .44, act = AI().active, sp = act ? .55 : .22, n = act ? 5 : 3;
    for (let k = 0; k < n; k++) {
      const ph = (t * sp + k / n) % 1, side = k % 2 ? 1 : -1, x = fw / 2 + side * (fw * .06 + ph * fw * .4), tail = side * fw * .035;
      const g = c.createLinearGradient(x - tail, 0, x, 0); g.addColorStop(0, 'rgba(59,232,255,0)'); g.addColorStop(1, 'rgba(180,250,255,.95)');
      c.fillStyle = g; c.fillRect(Math.min(x, x - tail), y - .3, Math.abs(tail), .6); c.fillStyle = '#ffffff'; c.fillRect(x - .45, y - .45, .9, .9);
      for (let m = 0; m < 16; m++) { const nx = fw * BUS(m); if (Math.abs(nx - x) < fw * .018) { c.fillStyle = k % 2 ? '#ff9af0' : '#9af6ff'; c.fillRect(nx - .65, y - .65, 1.3, 1.3); } }
    }
  } };

  // ---------- ТУМБИ ----------
  /** Ліва тумба — «ЯДРО»: скляна колона з ядрами (світяться хвилею — живі), від неї розходяться доріжки, ґратка внизу. */
  const CORES = 8, coreY = (fh, k) => fh * (.12 + k * .095), TUBE = [.5, .3];                          // ядра: y; труба — середина й ширина (частки)
  PAINT.ai_pedL = (c, fw, fh) => {
    c.fillStyle = 'rgba(0,0,0,.35)'; c.fillRect(0, 0, fw, fh * .03); inset(c, fw * .06, fh * .05, fw * .88, fh * .82, 'rgba(8,4,28,.5)', .8);
    const tx = fw * TUBE[0], tw = fw * TUBE[1];
    for (let k = 0; k < CORES; k++) { const y = coreY(fh, k); trace(c, tx - tw / 2, y, fw * .32, k * 5 + 2, 'rgba(59,232,255,.38)', .32, -1); trace(c, tx + tw / 2, y + fh * .04, fw * .32, k * 7 + 5, 'rgba(255,79,216,.32)', .32, 1); }
    c.fillStyle = 'rgba(4,10,36,.94)'; rr(c, tx - tw / 2, fh * .06, tw, fh * .78, tw * .45); c.fill(); A.neonRect(c, tx - tw / 2, fh * .06, tw, fh * .78, CY, .35, tw * .45);
    for (let k = 0; k < CORES; k++) { const y = coreY(fh, k); c.fillStyle = '#10204e'; rr(c, tx - tw * .32, y - fh * .028, tw * .64, fh * .056, .5); c.fill(); c.fillStyle = 'rgba(120,200,255,.35)'; c.fillRect(tx - tw * .28, y - fh * .026, tw * .56, .3); }
    c.fillStyle = 'rgba(255,255,255,.14)'; c.fillRect(tx - tw * .3, fh * .08, .5, fh * .74);                // блік на склі
    vent(c, fw * .14, fh * .89, fw * .72, fh * .07, 2); c.fillStyle = '#05030f'; c.fillRect(fw * .08, fh * .97, fw * .84, fh * .03);   // цоколь
  };
  /** Бік лівої тумби (зовнішній — його видно): доріжки й рожевий неон. */
  PAINT.ai_pedL.sides = { left: (c, fw, fh) => {
    c.fillStyle = 'rgba(8,4,28,.35)'; c.fillRect(0, 0, fw, fh); inset(c, fw * .08, fh * .06, fw * .84, fh * .88, 'rgba(10,6,34,.5)', .8);
    for (let k = 0; k < 7; k++) trace(c, fw * .1, fh * (.12 + k * .12), fw * .55, k * 3 + 1, 'rgba(59,232,255,.42)', .35);
    A.neon(c, fw * .04, fh * .08, fw * .04, fh * .92, PK, .6);
  } };
  /** Ядра світяться хвилею знизу вгору (швидше, коли Nexi працює). */
  LIVE.ai_pedL = { every: 4, draw(c, fw, fh, t) {
    const tx = fw * TUBE[0], tw = fw * TUBE[1], sp = AI().active ? 2.2 : .8;
    for (let k = 0; k < CORES; k++) { const ph = (t * sp - (CORES - 1 - k) * .14) % 1, a = Math.max(0, 1 - ph * 2.2), y = coreY(fh, k); if (a < .05) continue;
      c.globalAlpha = a; c.fillStyle = k % 3 === 0 ? '#ff9af0' : '#9af6ff'; rr(c, tx - tw * .3, y - fh * .024, tw * .6, fh * .048, .5); c.fill();
      c.fillStyle = '#ffffff'; c.fillRect(tx - tw * .18, y - fh * .011, tw * .36, fh * .022); c.globalAlpha = 1; }
  } };
  /** Права тумба: три шухляди (світлі ручки-риски з рожевим і блакитним, мітки), на верхній — вогники стану. */
  function drawer(c, x, y, w, h, tag) {
    const g = c.createLinearGradient(0, y, 0, y + h); g.addColorStop(0, '#2a1e5e'); g.addColorStop(1, '#150e3a'); c.fillStyle = g; rr(c, x, y, w, h, .9); c.fill();
    c.strokeStyle = 'rgba(170,150,255,.42)'; c.lineWidth = .4; rr(c, x + .3, y + .3, w - .6, h - .6, .8); c.stroke(); c.fillStyle = '#05030f'; c.fillRect(x + .4, y + h - .6, w - .8, .45);
    const hw = w * .44; c.fillStyle = '#0a0624'; rr(c, x + w / 2 - hw / 2, y + h * .5, hw, h * .16, .6); c.fill(); A.neon(c, x + w / 2 - hw / 2 + .6, y + h * .58, x + w / 2 + hw / 2 - .6, y + h * .58, tag, .45);   // ручка-неон
    c.fillStyle = 'rgba(230,240,255,.8)'; c.fillRect(x + w * .1, y + h * .18, w * .2, h * .2); c.fillStyle = tag; c.fillRect(x + w * .1, y + h * .18, w * .04, h * .2);   // мітка
  }
  PAINT.ai_pedR = (c, fw, fh) => {
    c.fillStyle = 'rgba(0,0,0,.35)'; c.fillRect(0, 0, fw, fh * .03);
    [[.05, PK], [.355, CY], [.66, PK]].forEach(([y, tag]) => drawer(c, fw * .06, fh * y, fw * .88, fh * .28, tag));
    [CY, GR, PK].forEach((col, k) => led(c, fw * (.72 + k * .07), fh * .1, col, .35));
    c.fillStyle = '#05030f'; c.fillRect(fw * .08, fh * .965, fw * .84, fh * .035);                           // цоколь
  };
  /** Бік правої тумби (до простору для ніг — його видно): панель з доріжками. */
  PAINT.ai_pedR.sides = { left: (c, fw, fh) => {
    c.fillStyle = 'rgba(8,4,28,.4)'; c.fillRect(0, 0, fw, fh); inset(c, fw * .06, fh * .05, fw * .88, fh * .9, 'rgba(10,6,34,.45)', .8);
    for (let k = 0; k < 6; k++) trace(c, fw * .9, fh * (.14 + k * .13), fw * .6, k * 4 + 9, 'rgba(59,232,255,.34)', .32, -1);
  } };

  // ---------- ПРОСТІР ДЛЯ НІГ ----------
  /** Задня панель: доріжки сходяться до «синапсу» посередині (м'яке рожево-блакитне сяйво), лоток з кабелем угорі. */
  PAINT.ai_knee = (c, fw, fh) => {
    c.fillStyle = 'rgba(10,6,28,.6)'; c.fillRect(0, 0, fw, fh);
    const gx = fw * .5, gy = fh * .55, g = c.createRadialGradient(gx, gy, 1, gx, gy, fw * .32); g.addColorStop(0, 'rgba(255,90,210,.22)'); g.addColorStop(.5, 'rgba(60,140,255,.1)'); g.addColorStop(1, 'rgba(40,20,90,0)');
    c.fillStyle = g; c.fillRect(0, 0, fw, fh);
    for (let k = 0; k < 6; k++) { const y = fh * (.3 + k * .1); trace(c, fw * .04, y, fw * .38, k * 3 + 11, 'rgba(59,232,255,.3)', .3, 1); trace(c, fw * .96, y + fh * .03, fw * .38, k * 5 + 13, 'rgba(255,79,216,.26)', .3, -1); }
    c.fillStyle = '#0a0624'; c.beginPath(); c.arc(gx, gy, 2.2, 0, 7); c.fill(); A.neonRect(c, gx - 2.2, gy - 2.2, 4.4, 4.4, PK, .4, 2.2); icon(c, 'ai', gx, gy, 2.6, '#bff8ff');
    inset(c, fw * .02, fh * .06, fw * .96, fh * .11, 'rgba(4,2,14,.85)', .4);                              // лоток з кабелем
    A.neon(c, fw * .03, fh * .115, fw * .97, fh * .115, CY, .45);
    for (let k = 0; k < 9; k++) { const x = fw * (.06 + k * .11); c.fillStyle = '#2a2050'; c.fillRect(x - .5, fh * .06, 1, fh * .11); }
    c.fillStyle = 'rgba(0,0,0,.4)'; c.fillRect(0, fh * .86, fw, fh * .14);                                  // тінь унизу
  };

  // ---------- МОНІТОРИ НА СТОЛІ ----------
  /** Рамка монітора, скло; вміст — чат з клієнтом (kind 0) або лист (kind 1); вогник живлення. */
  function monitor(c, fw, fh, kind) {
    c.fillStyle = '#05041a'; rr(c, 0, 0, fw, fh, 1.2); c.fill(); c.strokeStyle = 'rgba(200,190,255,.55)'; c.lineWidth = .4; rr(c, .25, .25, fw - .5, fh - .5, 1); c.stroke();
    const x0 = fw * .05, y0 = fh * .07, w = fw * .9, h = fh * .8, g = c.createLinearGradient(0, y0, 0, y0 + h); g.addColorStop(0, '#12307a'); g.addColorStop(1, '#0a1a4e');
    c.fillStyle = g; c.fillRect(x0, y0, w, h); c.fillStyle = 'rgba(160,220,255,.12)'; c.fillRect(x0, y0, w, h * .14);
    if (!kind) {                                                                                             // чат: запит клієнта, відповідь Nexi, «друкує»
      c.fillStyle = '#ff7ad0'; c.beginPath(); c.arc(x0 + 2, y0 + h * .07, 1, 0, 7); c.fill(); dash(c, x0 + 3.6, y0 + h * .05, w * .3, .7, 'rgba(220,240,255,.8)');
      c.fillStyle = 'rgba(160,140,255,.35)'; rr(c, x0 + 1.5, y0 + h * .22, w * .58, h * .26, 1.2); c.fill(); [.29, .38].forEach((v, k) => dash(c, x0 + 3, y0 + h * v, w * (k ? .32 : .46), .55, 'rgba(230,230,255,.85)'));
      c.fillStyle = 'rgba(59,232,255,.42)'; rr(c, x0 + w * .38, y0 + h * .54, w * .58, h * .24, 1.2); c.fill(); [.6, .69].forEach((v, k) => dash(c, x0 + w * .42, y0 + h * v, w * (k ? .3 : .48), .55, '#e8feff'));
      [0, 1, 2].forEach(k => { c.fillStyle = 'rgba(200,240,255,.8)'; c.beginPath(); c.arc(x0 + 3 + k * 1.6, y0 + h * .88, .45, 0, 7); c.fill(); });
    } else {                                                                                                 // лист: конверт, рядки, кнопка «надіслати»
      icon(c, 'mail', x0 + 3, y0 + h * .1, 2.6, '#9af6ff'); dash(c, x0 + 5.4, y0 + h * .07, w * .36, .7, 'rgba(220,240,255,.8)');
      for (let k = 0; k < 5; k++) dash(c, x0 + 1.6, y0 + h * (.28 + k * .11), w * (.82 - (k === 4 ? .38 : hash(k, 9) * .2)), .5, 'rgba(200,225,255,.6)');
      c.fillStyle = '#ff4fd8'; rr(c, x0 + w * .64, y0 + h * .82, w * .3, h * .13, .8); c.fill(); c.fillStyle = '#ffe0f6'; c.fillRect(x0 + w * .69, y0 + h * .875, w * .2, .45);
      c.strokeStyle = GR; c.lineWidth = .5; c.beginPath(); c.moveTo(x0 + 1.6, y0 + h * .86); c.lineTo(x0 + 2.4, y0 + h * .92); c.lineTo(x0 + 3.8, y0 + h * .8); c.stroke();
    }
    c.fillStyle = 'rgba(255,255,255,.07)'; c.beginPath(); c.moveTo(x0, y0); c.lineTo(x0 + w * .3, y0); c.lineTo(x0 + w * .12, y0 + h); c.lineTo(x0, y0 + h); c.fill();   // відблиск на склі
    c.fillStyle = kind ? GR : CY; c.fillRect(fw / 2 - .5, fh * .92, 1, .5);
  }
  PAINT.ai_monL = (c, fw, fh) => monitor(c, fw, fh, 0);
  PAINT.ai_monR = (c, fw, fh) => monitor(c, fw, fh, 1);

  // ---------- ВИСОКА РАМКА ЕКРАНА ----------
  /** Частки лиця рамки (кроки 13.2–13.3 — рамка X −13..249, Y 50..284 у gen_room.py aicenter(); скло — SCR у objects/aicenter.js):
   *  шапка з вивіскою — до hd, скло — u sx0..sx1, v sy0..sy1, нижче — пульт за моніторами (від pt). */
  const FR = { hd: .19, sx0: .048, sx1: .952, sy0: .2094, sy1: .7778, pt: .81 };
  /** Рамка: шапка під вивіску, утоплене скло під голо-екран (сам екран — живий: objects/aicenter.js), пульт унизу (за
   *  моніторами: ґратки, «навантаження ядер» — стовпчики, вогники), рожеві «кутики» на зрізах. */
  PAINT.ai_screen = (c, fw, fh) => {
    const sx0 = fw * FR.sx0, sx1 = fw * FR.sx1, sy0 = fh * FR.sy0, sy1 = fh * FR.sy1;
    inset(c, fw * .045, fh * .022, fw * .91, fh * (FR.hd - .03), 'rgba(6,3,22,.75)', 1.2);                  // шапка (за вивіскою)
    [.07, .93].forEach(u => { for (let k = 0; k < 3; k++) { c.fillStyle = 'rgba(255,120,230,.55)'; c.fillRect(fw * u - .4, fh * (.05 + k * .035), .8, fh * .02); } });
    c.fillStyle = '#03030f'; rr(c, sx0 - 1.2, sy0 - 1.2, sx1 - sx0 + 2.4, sy1 - sy0 + 2.4, 2.2); c.fill();   // утоплене скло
    c.strokeStyle = 'rgba(120,230,255,.6)'; c.lineWidth = .45; rr(c, sx0 - .7, sy0 - .7, sx1 - sx0 + 1.4, sy1 - sy0 + 1.4, 2); c.stroke();
    c.fillStyle = '#0a1a50'; c.fillRect(sx0, sy0, sx1 - sx0, sy1 - sy0);
    [[sx0 - 1.2, sy0 - 1.2, 1, 1], [sx1 + 1.2, sy0 - 1.2, -1, 1], [sx0 - 1.2, sy1 + 1.2, 1, -1], [sx1 + 1.2, sy1 + 1.2, -1, -1]].forEach(([x, y, dx, dy]) => {   // рожеві кутики скла
      c.strokeStyle = '#ff7ad8'; c.lineWidth = .55; c.beginPath(); c.moveTo(x + dx * 5, y); c.lineTo(x, y); c.lineTo(x, y + dy * 5); c.stroke(); });
    // пульт унизу (боки — за моніторами, посередині видно): ґратки, «навантаження ядер», вогники
    const py = fh * FR.pt, ph = fh * (.985 - FR.pt);
    inset(c, fw * .05, py, fw * .9, ph, 'rgba(6,3,22,.7)', 1);
    vent(c, fw * .08, py + ph * .2, fw * .2, ph * .6, 5); vent(c, fw * .72, py + ph * .2, fw * .2, ph * .6, 5);
    for (let k = 0; k < 9; k++) { const x = fw * (.33 + k * .038), h = ph * (.25 + .5 * hash(k, 41)); c.fillStyle = 'rgba(20,40,110,.9)'; c.fillRect(x, py + ph * .2, fw * .022, ph * .62);
      c.fillStyle = k % 4 === 3 ? 'rgba(255,122,216,.85)' : 'rgba(122,244,255,.75)'; c.fillRect(x, py + ph * .82 - h, fw * .022, h); }
    for (let k = 0; k < 5; k++) led(c, fw * (.41 + k * .045), py + ph * .92, [CY, GR, PK, CY, GO][k], .3);
    A.neon(c, fw * .06, py - fh * .006, fw * .94, py - fh * .006, PK, .45);
  };
  PAINT.ai_screen.sides = { left: (c, fw, fh) => { vent(c, fw * .15, fh * .3, fw * .7, fh * .4, 9); A.neon(c, fw * .5, fh * .08, fw * .5, fh * .26, PK, .5); } };
  LIVE.ai_sign = NX.arc.glint(8.3, 3.7);

  // ---------- ГОЛО-ЕКРАН (objects/aicenter.js -> NX.arc.holo.pane, crisp) ----------
  // Як на концепті: посередині — МОЗОК-НЕЙРОМЕРЕЖА (нейрони, зв'язки, сигнали біжать і спалахують), ліворуч — показники й журнал,
  // праворуч — «зір» (сканер) і карта; унизу — хвиля «думки» й потік токенів. Пустого місця немає.
  // S.act — Nexi працює (швидше, яскравіше), S.prog — поступ задачі (смужка в шапці).
  // Силует мозку збоку (лоб — ліворуч): опорні точки (частки рамки мозку), гладка крива через них; мозочок і стовбур — окремо.
  const OUT = [[.1, .64], [.03, .46], [.08, .24], [.24, .09], [.46, .03], [.68, .06], [.86, .18], [.97, .38], [.94, .58], [.82, .66], [.66, .72], [.46, .76], [.28, .73], [.16, .7]];
  const inPoly = (u, v, P) => { let s = false; for (let i = 0, j = P.length - 1; i < P.length; j = i++) if ((P[i][1] > v) !== (P[j][1] > v) && u < (P[j][0] - P[i][0]) * (v - P[i][1]) / (P[j][1] - P[i][1]) + P[i][0]) s = !s; return s; };
  const N = [];                                                                                             // нейрони мозку: точки в межах силуету (u, v — частки рамки мозку)
  for (let k = 0; N.length < 30 && k < 600; k++) { const u = .06 + .9 * hash(k, 11), v = .06 + .72 * hash(k, 23); if (inPoly(u, v, OUT) && N.every(p => Math.hypot(p.u - u, (p.v - v) * .9) > .1)) N.push({ u, v, k }); }
  N.forEach(p => { p.nb = N.filter(q => q !== p).sort((a, b) => Math.hypot(a.u - p.u, a.v - p.v) - Math.hypot(b.u - p.u, b.v - p.v)).slice(0, 3); });
  const E = []; N.forEach((p, i) => p.nb.forEach(q => { const j = N.indexOf(q); if (i < j || !q.nb.includes(p)) E.push([p, q, hash(i, j)]); }));
  /** Гладка замкнена крива через точки (середини відрізків — кінці, точки — керуючі). */
  function smooth(c, pts) { const n = pts.length, mid = i => [(pts[i][0] + pts[(i + 1) % n][0]) / 2, (pts[i][1] + pts[(i + 1) % n][1]) / 2]; c.beginPath(); const m0 = mid(n - 1); c.moveTo(m0[0], m0[1]); for (let i = 0; i < n; i++) { const m = mid(i); c.quadraticCurveTo(pts[i][0], pts[i][1], m[0], m[1]); } c.closePath(); }
  /** МОЗОК-НЕЙРОМЕРЕЖА: сяйво й кільця-сканер позаду, силует з борознами, мозочок і стовбур, зв'язки з сигналами, нейрони. */
  function brain(c, x, y, w, h, t, act) {
    const sp = act ? 1.6 : .7, P = p => [x + p.u * w, y + p.v * h], cx = x + w * .5, cy = y + h * .42;
    let g = c.createRadialGradient(cx, cy, 1, cx, cy, w * .62); g.addColorStop(0, `rgba(80,190,255,${act ? .34 : .24})`); g.addColorStop(1, 'rgba(40,80,200,0)'); c.fillStyle = g; c.fillRect(x - 6, y - 6, w + 12, h + 12);
    for (let k = 0; k < 3; k++) { const r = w * (.5 + k * .07), a0 = t * (k % 2 ? -.5 : .35) + k * 2; c.strokeStyle = `rgba(120,230,255,${.28 - k * .07})`; c.lineWidth = .35;   // кільця-сканер довкола
      for (let s = 0; s < 3; s++) { c.beginPath(); c.ellipse(cx, cy, r, r * .78, 0, a0 + s * 2.09, a0 + s * 2.09 + 1.3); c.stroke(); } }
    const S = OUT.map(([u, v]) => [x + u * w, y + v * h]);
    c.fillStyle = 'rgba(30,70,170,.42)'; c.beginPath(); c.ellipse(x + w * .78, y + h * .76, w * .15, h * .09, -.15, 0, 7); c.fill(); c.strokeStyle = '#7af4ff'; c.lineWidth = .55; c.stroke();   // мозочок
    for (let k = 0; k < 3; k++) { c.strokeStyle = 'rgba(122,244,255,.35)'; c.lineWidth = .3; c.beginPath(); c.ellipse(x + w * .78, y + h * .76, w * (.11 - k * .03), h * (.065 - k * .018), -.15, .3, 2.9); c.stroke(); }
    c.fillStyle = 'rgba(30,70,170,.42)'; c.beginPath(); c.moveTo(x + w * .56, y + h * .74); c.quadraticCurveTo(x + w * .6, y + h * .88, x + w * .58, y + h * .99); c.lineTo(x + w * .66, y + h * .99); c.quadraticCurveTo(x + w * .67, y + h * .86, x + w * .7, y + h * .72); c.closePath(); c.fill(); c.strokeStyle = '#7af4ff'; c.lineWidth = .5; c.stroke();   // стовбур
    smooth(c, S); c.fillStyle = 'rgba(18,66,160,.5)'; c.fill(); c.strokeStyle = '#8af6ff'; c.lineWidth = .8; c.stroke();
    c.save(); smooth(c, S); c.clip();
    c.strokeStyle = 'rgba(140,240,255,.42)'; c.lineWidth = .45;                                             // борозни: центральна, бічна й звивини
    [[[.5, .03], [.47, .3], [.4, .58]], [[.24, .64], [.46, .5], [.74, .46]], [[.12, .3], [.24, .4], [.2, .55]], [[.3, .14], [.34, .32], [.28, .44]], [[.66, .1], [.62, .26], [.7, .38]], [[.82, .24], [.76, .38], [.88, .5]], [[.56, .62], [.66, .58], [.8, .6]]]
      .forEach(([a, b, d]) => { c.beginPath(); c.moveTo(x + a[0] * w, y + a[1] * h); c.quadraticCurveTo(x + b[0] * w, y + b[1] * h, x + d[0] * w, y + d[1] * h); c.stroke(); });
    E.forEach(([p, q, s]) => { const a = P(p), b = P(q); c.strokeStyle = 'rgba(122,244,255,.24)'; c.lineWidth = .3; c.beginPath(); c.moveTo(a[0], a[1]); c.lineTo(b[0], b[1]); c.stroke();   // зв'язки й сигнали
      const ph = (t * sp * (.6 + s * .7) + s * 7) % 1.6; if (ph < 1) { const px = a[0] + (b[0] - a[0]) * ph, py = a[1] + (b[1] - a[1]) * ph; c.fillStyle = s > .55 ? '#ffb4f0' : '#e8feff'; c.fillRect(px - .45, py - .45, .9, .9); } });
    c.restore();
    N.forEach((p, i) => { const [px, py] = P(p), fl = Math.max(0, Math.sin(t * sp * 2.3 + i * 1.7)) ** 8, r = .65 + fl * .6;   // нейрони: спалахують по черзі
      c.fillStyle = fl > .3 ? (i % 4 === 0 ? '#ff9af0' : '#ffffff') : '#7af4ff'; c.beginPath(); c.arc(px, py, r, 0, 7); c.fill();
      if (fl > .3) { c.strokeStyle = `rgba(200,250,255,${fl * .6})`; c.lineWidth = .3; c.beginPath(); c.arc(px, py, r + 1.2, 0, 7); c.stroke(); } });
  }
  /** Каркасний глобус, що обертається, з пінгами (чистий і на малому віджеті — замість мапи материків). */
  const PINGS = [[50, 30], [52, 21], [52, 5], [40, -74], [35, 139], [-23, -46], [1, 103]];
  function globe(c, cx, cy, R, t, act) {
    const rot = t * (act ? .5 : .22), g = c.createRadialGradient(cx - R * .3, cy - R * .3, 0, cx, cy, R); g.addColorStop(0, 'rgba(60,140,255,.35)'); g.addColorStop(1, 'rgba(20,50,140,.2)');
    c.fillStyle = g; c.beginPath(); c.arc(cx, cy, R, 0, 7); c.fill(); c.strokeStyle = '#7af4ff'; c.lineWidth = .45; c.stroke();
    c.strokeStyle = 'rgba(122,244,255,.35)'; c.lineWidth = .3;
    [-.6, -.3, 0, .3, .6].forEach(la => { const yy = cy + Math.sin(la) * R, rr3 = Math.cos(la) * R; c.beginPath(); c.ellipse(cx, yy, rr3, rr3 * .22, 0, 0, 7); c.stroke(); });
    for (let k = 0; k < 6; k++) { const a = rot + k * Math.PI / 6, rx = Math.abs(Math.cos(a)) * R; c.beginPath(); c.ellipse(cx, cy, Math.max(.1, rx), R, 0, 0, 7); c.stroke(); }
    PINGS.forEach(([la, lo], k) => { const a = lo * Math.PI / 180 + rot, b = la * Math.PI / 180, z = Math.cos(b) * Math.cos(a); if (z < 0) return;
      const px = cx + Math.cos(b) * Math.sin(a) * R, py = cy - Math.sin(b) * R, ph = (t * .6 + k * .37) % 1, hot = k < 3;
      c.fillStyle = hot ? '#ff7af0' : '#c8fcff'; c.fillRect(px - .55, py - .55, 1.1, 1.1);
      c.strokeStyle = hot ? `rgba(255,120,240,${(1 - ph) * .8})` : `rgba(160,250,255,${(1 - ph) * .5})`; c.lineWidth = .3; c.beginPath(); c.arc(px, py, .6 + ph * 2.4, 0, 7); c.stroke(); });
  }
  /** Віджет: темна плитка з тонким кантом і заголовком (як на екрані аналітики, але з рожевою рискою зони). */
  function widget(c, x, y, w, h, title, ic, col = CY) {
    c.fillStyle = 'rgba(9,22,70,.94)'; rr(c, x, y, w, h, 1.4); c.fill(); c.strokeStyle = 'rgba(110,210,255,.3)'; c.lineWidth = .35; rr(c, x, y, w, h, 1.4); c.stroke();
    c.fillStyle = PK; c.fillRect(x + 1.2, y + .4, w * .22, .4);
    const th = 5.6; if (ic) icon(c, ic, x + 3, y + th * .55, 2.9, col);
    A.txt(c, title, x + (ic ? 5.6 : 2.2), y + th * .55, w - 7, 2.7, 'rgba(205,235,255,.9)', { align: 'left' });
    return th;
  }
  function aiScreen(c, fw, fh, t, S = {}) {
    const act = !!S.act, prog = S.prog || 0, bz = 1.6, r = 3, m = 3.4, gp = 2.2;
    // скло: глибока синява, сітка, кант
    rr(c, 0, 0, fw, fh, r + 1); c.fillStyle = '#04030f'; c.fill();
    let g = c.createLinearGradient(0, 0, 0, fh); g.addColorStop(0, '#0c2470'); g.addColorStop(.55, '#071648'); g.addColorStop(1, '#0a0f3c');
    rr(c, bz, bz, fw - 2 * bz, fh - 2 * bz, r); c.fillStyle = g; c.fill();
    c.save(); rr(c, bz, bz, fw - 2 * bz, fh - 2 * bz, r); c.clip();
    c.strokeStyle = 'rgba(90,200,255,.05)'; c.lineWidth = .25; c.beginPath(); for (let x = 5; x < fw; x += 5) { c.moveTo(x, 0); c.lineTo(x, fh); } for (let y = 5; y < fh; y += 5) { c.moveTo(0, y); c.lineTo(fw, y); } c.stroke();
    c.restore();
    c.strokeStyle = '#3be8ff'; c.lineWidth = .35; rr(c, bz, bz, fw - 2 * bz, fh - 2 * bz, r); c.stroke(); c.fillStyle = 'rgba(210,245,255,.16)'; c.fillRect(r + 2, bz + .4, fw - 2 * r - 4, .3);
    // шапка: «НЕЙРО · МЕРЕЖА», ● НАЖИВО, сигнал; смужка поступу задачі
    const hh = 9.4;
    icon(c, 'ai', m + 2.4, bz + hh * .52, 3.4, '#ff9af0'); A.txt(c, t_('scene.ai.neuro') + ' · ' + t_('scene.ai.net'), m + 5.8, bz + hh * .52, fw * .5, 4, '#e8feff', { align: 'left', glow: CY });
    const on = Math.sin(t * 4) > -.4; c.fillStyle = on ? '#ff4f6a' : '#6a1a2a'; c.beginPath(); c.arc(fw * .7, bz + hh * .52, .95, 0, 7); c.fill();
    A.txt(c, t_('scene.ai.live'), fw * .715, bz + hh * .52, fw * .15, 2.8, 'rgba(255,205,215,.92)', { align: 'left' });
    for (let k = 0; k < 4; k++) { const hgt = 1.2 + k * .9, lit = (Math.floor(t * (act ? 6 : 2)) + k) % 5 !== 0; c.fillStyle = lit ? '#9af6ff' : 'rgba(120,200,255,.3)'; c.fillRect(fw - m - 7 + k * 1.6, bz + hh * .78 - hgt, 1, hgt); }
    c.fillStyle = 'rgba(120,230,255,.28)'; c.fillRect(m, bz + hh, fw - 2 * m, .3);
    if (act) { c.fillStyle = 'rgba(255,79,216,.22)'; c.fillRect(m, bz + hh - .3, fw - 2 * m, .9); c.fillStyle = PK; c.fillRect(m, bz + hh - .3, (fw - 2 * m) * prog, .9); }
    // колонки: ліворуч KPI й журнал, посередині мозок, праворуч зір і карта
    const y1 = bz + hh + gp, yB = fh - bz - m - 11, cw = (fw - 2 * m) * .25, h1 = (yB - y1 - gp) * .55, h2 = yB - y1 - gp - h1, rx = fw - m - cw;
    // KPI: стовпчики ростуть і спадають, останній — рожевий
    let th = widget(c, m, y1, cw, h1, t_('scene.ai.kpi'), 'chart');
    const n = 7, bw = (cw - 4) / n, base = y1 + h1 - 2;
    for (let k = 0; k < n; k++) { const v = .35 + .55 * (.5 + .5 * Math.sin(t * (act ? 1.4 : .6) + k * 1.3)) * (.6 + .4 * hash(k, 5)), bh = (h1 - th - 4) * v, bx = m + 2 + k * bw + bw * .18;
      const gg = c.createLinearGradient(0, base - bh, 0, base); gg.addColorStop(0, k === n - 1 ? '#ffe0f8' : '#e8feff'); gg.addColorStop(.3, k === n - 1 ? '#ff7ad0' : '#5ae8ff'); gg.addColorStop(1, k === n - 1 ? '#6a1a8a' : '#1a5ad0'); c.fillStyle = gg; c.fillRect(bx, base - bh, bw * .64, bh); }
    // ЖУРНАЛ: рядки повзуть угору, у кінці — ОК
    const ly = y1 + h1 + gp; th = widget(c, m, ly, cw, h2, t_('scene.ai.log'), 'doc', VI);
    c.save(); c.beginPath(); c.rect(m + 1, ly + th, cw - 2, h2 - th - 1); c.clip();
    const rowH = 3.6, sc = (t * (act ? 2.2 : .8)) % 1, n0 = Math.floor(t * (act ? 2.2 : .8));
    for (let k = -1; k < 7; k++) { const y = ly + th + 1 + (k - sc) * rowH, s = n0 + k, tag = [CY, PK, GR, GO][Math.floor(hash(s, 3) * 4)];
      c.fillStyle = tag; c.fillRect(m + 1.8, y, 1.2, 1.2); dash(c, m + 4, y + .25, (cw - 13) * (.45 + .5 * hash(s, 7)), .6, 'rgba(200,225,255,.6)');
      A.txt(c, t_('scene.ai.ok'), m + cw - 4.4, y + .7, 6, 2.2, '#b8ffd2'); }
    c.restore();
    // МОЗОК
    const bx0 = m + cw + gp, bww = rx - gp - bx0, bh = Math.min((yB - y1) * .86, bww * .82); brain(c, bx0 + bww * .06, y1 + (yB - y1 - bh) * .45, bww * .88, bh, t, act);
    // ЗІР: сканер-радар з цілями
    th = widget(c, rx, y1, cw, h1, t_('scene.ai.vision'), 'target', PK);
    const rcx = rx + cw / 2, rcy = y1 + th + (h1 - th) / 2, rr2 = Math.min(cw * .38, (h1 - th) * .42), ang = t * (act ? 2.4 : 1.1);
    c.strokeStyle = 'rgba(120,230,255,.4)'; c.lineWidth = .35; [1, .62, .3].forEach(k => { c.beginPath(); c.arc(rcx, rcy, rr2 * k, 0, 7); c.stroke(); });
    c.beginPath(); c.moveTo(rcx - rr2, rcy); c.lineTo(rcx + rr2, rcy); c.moveTo(rcx, rcy - rr2); c.lineTo(rcx, rcy + rr2); c.stroke();
    g = c.createConicGradient ? c.createConicGradient(ang - .9, rcx, rcy) : null;
    if (g) { g.addColorStop(0, 'rgba(59,232,255,0)'); g.addColorStop(.14, 'rgba(59,232,255,.38)'); g.addColorStop(.15, 'rgba(59,232,255,0)'); c.fillStyle = g; c.beginPath(); c.arc(rcx, rcy, rr2, 0, 7); c.fill(); }
    c.strokeStyle = '#9af6ff'; c.lineWidth = .45; c.beginPath(); c.moveTo(rcx, rcy); c.lineTo(rcx + Math.cos(ang) * rr2, rcy + Math.sin(ang) * rr2); c.stroke();
    for (let k = 0; k < 4; k++) { const a = hash(k, 31) * 6.28, d = rr2 * (.3 + .6 * hash(k, 37)), seen = ((ang - a) % 6.283 + 6.283) % 6.283, al = Math.max(.15, 1 - seen / 4);
      c.fillStyle = k === 0 ? `rgba(255,120,220,${al})` : `rgba(160,250,255,${al})`; c.fillRect(rcx + Math.cos(a) * d - .6, rcy + Math.sin(a) * d - .6, 1.2, 1.2); }
    // КАРТА: каркасний глобус з пінгами (Київ, Варшава, Амстердам — рожеві)
    th = widget(c, rx, ly, cw, h2, t_('scene.ai.map'), 'target', CY);
    globe(c, rx + cw / 2, ly + th + (h2 - th) / 2, Math.min(cw * .36, (h2 - th) * .4), t, act);
    // унизу — хвиля «думки» й потік токенів
    const wy = yB + gp, wh = fh - bz - m + 1.2 - wy; c.fillStyle = 'rgba(9,22,70,.94)'; rr(c, m, wy, fw - 2 * m, wh, 1.4); c.fill(); c.strokeStyle = 'rgba(110,210,255,.3)'; c.lineWidth = .35; rr(c, m, wy, fw - 2 * m, wh, 1.4); c.stroke();
    c.save(); c.beginPath(); c.rect(m + .6, wy + .6, fw - 2 * m - 1.2, wh - 1.2); c.clip();
    const amp = wh * (act ? .36 : .22), wx0 = m + 2, ww = (fw - 2 * m) * .55;
    c.strokeStyle = '#ff7ad8'; c.lineWidth = .5; c.beginPath();
    for (let k = 0; k <= 60; k++) { const u = k / 60, x = wx0 + u * ww, y = wy + wh / 2 + Math.sin(u * 18 - t * 5) * Math.sin(u * 3.1 + t * .7) * amp; k ? c.lineTo(x, y) : c.moveTo(x, y); } c.stroke();
    c.strokeStyle = 'rgba(122,244,255,.55)'; c.lineWidth = .35; c.beginPath();
    for (let k = 0; k <= 60; k++) { const u = k / 60, x = wx0 + u * ww, y = wy + wh / 2 + Math.sin(u * 11 + t * 3.3) * amp * .55; k ? c.lineTo(x, y) : c.moveTo(x, y); } c.stroke();
    const tx0 = wx0 + ww + 3, tw = fw - m - 2 - tx0, step = 3.4, sh = (t * (act ? 9 : 4)) % step;
    for (let k = 0; k * step < tw + step; k++) { const x = tx0 + k * step - sh, s = Math.floor(t * (act ? 9 : 4) / step) - k, wv = 1.2 + 1.6 * hash(s, 2);
      c.fillStyle = hash(s, 4) > .8 ? 'rgba(255,122,216,.85)' : 'rgba(122,244,255,.7)'; c.fillRect(x, wy + wh * .38, wv, wh * .24); }
    c.restore();
  }
  NX.arc.aiScreen = aiScreen;
})();

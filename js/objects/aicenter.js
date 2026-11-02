/* ============================================================================
 * objects/aicenter.js — AI-ЦЕНТР («НЕЙРОЦЕНТР»): ЖИВИЙ ОБ'ЄКТ
 * ----------------------------------------------------------------------------
 * Нерухома частина (стіл на всю ширину зони на двох тумбах; монітори; висока рамка з вивіскою і пультом) — у
 * 3D-розкладці (gen_room.py: aicenter(); грані — objects/ai_paint.js). Тут — те, що живе поверх.
 * Крок 13 (перший крок зони — лише стіл і головний екран; власник: «далі, після мого "так", — Nexi в ній працює»):
 *   ГОЛО-ЕКРАН у рамці (NX.arc.holo.pane, crisp, непрозорий; вміст — NX.arc.aiScreen: мозок-нейромережа, показники, журнал,
 *     сканер «зір», карта, хвиля «думки»; перемальовується раз на 5 кадрів); довкола — м'яке сяйво на стіні; зрідка (раз на
 *     24–42 с) коротко «лагає»;
 *   МОНІТОРИ на столі (fg у розкладці) рушій малює ще раз ПОВЕРХ екрана (NX.arc.fgDraw).
 * Крок 14 (власник: «зроби взаємодію з Nexi»): Nexi злітає на стіл (коло-майданчик посередині стільниці), стає спиною до
 *   нас і працює: екран показує задачу (рожева смужка поступу в шапці, мозок і сигнали швидші), у кінці — «✓» на екрані й
 *   картка результату (ui/zones.js: «відповісти клієнту», «лист партнеру», «підсумок зустрічі» — раніше з дивану).
 *   front() — де стати перед столом, top() — куди злетіти, depth() — глибина для масштабу; begin(task) / finish().
 *   Під столом — лежанка Рудика (ai_bed у розкладці; кіт — actors/cat/cat.js).
 * active / prog — Nexi працює (nexi.js: work.obj = 'aicenter').
 * ========================================================================== */
(() => {
  const P = NX.px;
  let Z = null; const zone = () => Z || (Z = NX.arc.zone && NX.arc.zone('ai'));
  // голо-екран (px картинки зони): привид ai_scr — вісь (X 118), вирівняна по центру стола; екран — у склі рамки (рамка — X −13..249,
  // Y 50..284 у gen_room.py aicenter(); частки скла — ai_paint.js FR)
  const SCR = { X: [-0.4, 236.4], Y: [99, 232], Xc: 118 };
  const S = { act: false, prog: 0, task: null, doneT: -99 };                                 // стан для вмісту екрана (ai_paint.js)
  let pane = null;
  const mk = () => pane || (pane = NX.arc.holo.pane({ zone: 'ai', item: 'ai_scr', Xc: SCR.Xc, X: SCR.X, Y: SCR.Y, v: 0, rgb: '150,240,255', seed: 5, lagMin: 0, crisp: true, shade: 1, every: 5,
    paint: (c, fw, fh, t) => NX.arc.aiScreen(c, fw, fh, t, S) }));
  const FX = { nextLag: 24 + Math.random() * 14 };
  /** М'яке сяйво екрана на стіні довкола (під екраном): блакитне й трохи рожевого від рамки. Овали під форму екрана (крок 13.3:
   *  екран став широким — коло на всю його ширину заливало вдвічі більше пікселів, а видно сяйво лише довкола рамки). */
  function glow(c, q, t, act) {
    const cx = (q[0][0] + q[1][0]) / 2, cy = (q[0][1] + q[3][1]) / 2, w = q[1][0] - q[0][0], h = q[3][1] - q[0][1], a = .24 + .05 * Math.sin(t * 1.1) + (act ? .1 : 0);
    c.save(); c.translate(cx, cy); c.scale(1, Math.min(1, h / w * 1.2)); P.glow(c, 0, 0, w * .62, 'rgba(70,170,255,.5)', a); c.restore();
    c.save(); c.translate(cx, q[0][1]); c.scale(1, .45); P.glow(c, 0, 0, w * .45, 'rgba(255,80,210,.4)', a * .5); c.restore();
  }
  const proj = NX.px3d.proj;
  NX.addObject({
    id: 'aicenter', name: 'obj.aiPc', act: 'ai', active: false, prog: 0,
    get span() { const z = zone(); return z && z.box ? [z.box[0] - 30, z.box[1] + 30] : null; },
    get hit() { const z = zone(); if (!z || !z.box) return null; const [x0, x1, y0, y1] = z.box; return { x: x0, y: y0, w: x1 - x0, h: y1 - y0 - 10 }; },
    ready() { return !!zone(); },
    /** Де стати перед столом (підлога перед ним, по центру) — і звідки злітати. */
    front() { const z = zone(), f = NX.objects.foot_ai && NX.objects.foot_ai.foot, x = proj(z.W(118, 352, -12))[0]; return NX.room.clampWalk(x, (f ? f[3] : 445) + 8); },
    /** Куди злетіти: коло-майданчик посередині стільниці (ноги Nexi — на ній). */
    top() { const p = proj(zone().W(118, 284, 20)); return [p[0], p[1] + 2]; },
    depth() { return this.front()[1] - 14; },
    begin(task) { S.task = task; S.doneT = -99; },
    finish() { S.doneT = NX.time; S.task = null; },
    update(dt, t) {
      if (!zone() || !NX.arc.holo) return; mk();
      S.act = !!this.active; S.prog = this.prog || 0; S.t = t;
      if (t > FX.nextLag) { if (!S.act) pane.kick(t, .3 + Math.random() * .3); FX.nextLag = t + 24 + Math.random() * 18; }   // зрідка й не під час роботи
    },
    drawBack(c, t) {
      if (!zone() || !NX.arc.holo) return; mk();
      const q = pane.quad(); if (q) glow(c, q, t, !!this.active);
      pane.draw(c, t);
      if (NX.arc.fgDraw) NX.arc.fgDraw(c, 'ai');                                               // монітори на столі — поверх екрана
    },
  });
})();

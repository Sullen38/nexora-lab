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
 * active / prog — Nexi працює (наступний крок: «відповісти клієнту», «лист партнеру», «підсумок зустрічі»).
 * ========================================================================== */
(() => {
  const P = NX.px;
  let Z = null; const zone = () => Z || (Z = NX.arc.zone && NX.arc.zone('ai'));
  // голо-екран (px картинки зони): привид ai_scr — вісь (X 118), вирівняна по центру стола; екран — у склі рамки (рамка — X −13..249,
  // Y 50..284 у gen_room.py aicenter(); частки скла — ai_paint.js FR)
  const SCR = { X: [-0.4, 236.4], Y: [99, 232], Xc: 118 };
  const S = { act: false, prog: 0 };                                                          // стан для вмісту екрана (ai_paint.js)
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
  NX.addObject({
    id: 'aicenter', active: false, prog: 0,
    get span() { const z = zone(); return z && z.box ? [z.box[0] - 30, z.box[1] + 30] : null; },
    ready() { return !!zone(); },
    update(dt, t) {
      if (!zone() || !NX.arc.holo) return; mk();
      S.act = !!this.active; S.prog = this.prog || 0;
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

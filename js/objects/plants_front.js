/* ============================================================================
 * objects/plants_front.js — ВЕЛИКІ РОСЛИНИ НА ПЕРЕДНЬОМУ ПЛАНІ (у кутах кімнати)
 * ----------------------------------------------------------------------------
 * Стоять на передній підлозі в лівому й правому кутах — найближче до глядача,
 * дають відчуття глибини. Раніше це були грубі «смужки»-листки, і на комп'ютері
 * від них видно було лише кінчики біля краю екрана (власник: «рослини місцями
 * обрізані та якісь недороблені»). Тепер — справжні рослини кодом (NX.kit.plant):
 *   ліворуч — монстера на кокосовій опорі, праворуч — пальма-арека,
 * обидві повністю в кадрі: стоять на передній підлозі на ~78 % її глибини,
 * розмір — за глибиною передньої підлоги (комп'ютер / телефон), гойдаються;
 * тап — шелест (як рослини крила). Сортуються за глибиною разом з Nexi й котом і
 * віддзеркалюються в глянцевій підлозі. Растри будуються, коли браузер вільний
 * (після перших кадрів), — старт кімнати від цього не сповільнюється.
 * ========================================================================== */
(() => {
  const K = NX.kit, F = NX.furn;
  const DEFS = [
    { id: 'plantFrontL', x: 48, spec: { kind: 'monstera', w: 64, h: 150, potW: 30, potH: 26, leaves: 12, seed: 21 } },
    { id: 'plantFrontR', x: NX.cfg.ROOM_W - 60, spec: { kind: 'palm', w: 88, h: 160, potW: 32, potH: 26, leaves: 14, seed: 23, neon: '#3be8ff' } },
  ];
  DEFS.forEach(d => {
    NX.addObject({
      id: d.id, name: 'obj.plant', act: 'rustle', hit: null, shake: 0, ph: d.x * .013,
      /** Де стоїть і якого розміру: низ горщика — на 78 % глибини передньої підлоги, висота — ~55 % її глибини. */
      geo() { const fr = NX.cam.front, s = Math.max(.55, Math.min(1.25, fr * .55 / d.spec.h)), bot = NX.cfg.ROOM_H + fr * .78; return { s, x: d.x - d.spec.w * s / 2, y: bot - d.spec.h * s, bot }; },
      update(dt) { this.shake = Math.max(0, this.shake - dt * .9); const g = this.geo(); this.hit = { x: g.x + 6, y: g.y, w: d.spec.w * g.s - 12, h: d.spec.h * g.s }; },
      onTap() { this.shake = 1; NX.nexi.emote('happy', 1.5); const g = this.geo(); for (let i = 0; i < 8; i++) NX.fx.emit('spark', g.x + Math.random() * d.spec.w * g.s, g.y + Math.random() * d.spec.h * g.s * .6, { col: Math.random() < .6 ? '#9aff7a' : '#ffe27a', vy: -20 - Math.random() * 20, g: 30, ttl: 1, s: 1.1 }); return true; },
      layers(t) {
        if (!this.sp) { if (!this.wait) { this.wait = 1; const go = () => { this.sp = K.plant(d.spec); }; window.requestIdleCallback ? requestIdleCallback(go, { timeout: 900 }) : setTimeout(go, 300); } return []; }
        const g = this.geo();
        return [{ y: g.bot, refl: true, draw: c => {
          c.save();
          c.globalAlpha = .45; c.fillStyle = '#000'; c.beginPath(); c.ellipse(d.x, g.bot - 1, d.spec.potW * g.s * .62, 3.2 * g.s, 0, 0, 7); c.fill(); c.globalAlpha = 1;   // тінь на підлозі
          c.translate(g.x, g.y); c.scale(g.s, g.s); K.sway(c, this.sp, 0, 0, t, this.ph, this.shake, 1, Math.min(4, F.res() * g.s));
          c.restore();
        } }];
      },
    });
  });
})();

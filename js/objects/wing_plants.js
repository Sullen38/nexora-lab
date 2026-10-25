/* ============================================================================
 * objects/wing_plants.js — РОСЛИНИ ЛІВОГО КРИЛА (піксель-арт кодом, NX.kit.plant)
 * ----------------------------------------------------------------------------
 * Жодного вирізання з картинки: кожна рослина згенерована кодом у стилі
 * кімнати (темна зелень з холодними бліками, горщик з неоновим обідком) і
 * стоїть на своєму чіткому місці, нічого не перекриваючи:
 *   bigLeft  — велика монстера на підлозі в самому лівому куті (перед столом)
 *   floorA/B — папороть і сансев'єра на підлозі ПЕРЕД столом AI-центру
 *   topVine  — ліана звисає з верхньої полиці над AI-центром
 *   shelfVine— ліана з верхньої полиці стелажа
 *   boothTop — пальма на даху будки аналітики
 *   winVine  — ліана над ліхтарем біля вікна
 *   mkDesk   — папороть на столі маркетингу (ліворуч, над кавомашиною)
 * Усі гойдаються (верх хитається, горщик стоїть; ліани — навпаки), тап — шелест.
 * stage 'wall' — малюються в drawBack (за столами), 'layer' — за глибиною y.
 * ========================================================================== */
(() => {
  const P = NX.px, K = NX.kit;
  const LIST = [
    { id: 'bigLeft', kind: 'monstera', x: 0, y: 278, w: 38, h: 96, potW: 22, potH: 18, leaves: 8, seed: 3, stage: 'layer', depth: 374, s: 1 },
    { id: 'floorA', kind: 'fern', x: 148, y: 312, w: 46, h: 66, potW: 18, potH: 13, leaves: 11, seed: 5, stage: 'layer', depth: 378, s: .8, pal: 'light' },
    { id: 'floorB', kind: 'sansevieria', x: 198, y: 311, w: 34, h: 70, potW: 18, potH: 14, leaves: 7, seed: 8, stage: 'layer', depth: 381, s: .5 },
    { id: 'topVine', kind: 'vine', x: 6, y: 5, w: 40, h: 120, hang: 1, pot: 'none', leaves: 5, seed: 2, stage: 'wall', s: 1 },
    { id: 'shelfVine', kind: 'vine', x: 258, y: 29, w: 44, h: 56, hang: 1, pot: 'none', leaves: 4, seed: 6, stage: 'wall', s: .8, pal: 'sage' },
    { id: 'boothTop', kind: 'palm', x: 416, y: 58, w: 58, h: 72, potW: 20, potH: 14, leaves: 9, seed: 4, stage: 'wall', s: 1, neon: '#3be8ff' },
    { id: 'winVine', kind: 'vine', x: 486, y: 0, w: 44, h: 84, hang: 1, pot: 'none', leaves: 4, seed: 9, stage: 'wall', s: .9, pal: 'light' },
    { id: 'mkDesk', kind: 'fern', x: 494, y: 236, w: 34, h: 43, potW: 15, potH: 10, leaves: 9, seed: 7, stage: 'layer', depth: 279, s: .7, pal: 'sage' },
  ];
  const wall = [];
  LIST.forEach(d => {
    const o = NX.addObject({
      id: 'wp_' + d.id, name: 'obj.plant', act: 'rustle', d, shake: 0, ph: P.hash(d.x, d.y) * 6, hit: { x: d.x + 2, y: d.y, w: d.w - 4, h: d.h },
      onTap() { this.shake = 1; NX.nexi.emote('happy', 1.5); for (let i = 0; i < 8; i++) NX.fx.emit('spark', d.x + Math.random() * d.w, d.y + Math.random() * d.h * .6, { col: Math.random() < .6 ? '#9aff7a' : '#ffe27a', vy: -20 - Math.random() * 20, g: 30, ttl: 1, s: 1.1 }); return true; },
      update(dt) { this.shake = Math.max(0, this.shake - dt * .9); },
      draw(c, t) { if (!this.sp) this.sp = K.plant(d); K.sway(c, this.sp, d.x, d.y, t, this.ph, this.shake, d.s); },
      layers(t) { return d.stage === 'layer' ? [{ y: d.depth, draw: c => this.draw(c, t) }] : []; },
    });
    if (d.stage === 'wall') wall.push(o);
  });
  NX.addObject({ id: 'wingPlantsWall', drawBack(c, t) { wall.forEach(o => o.draw(c, t)); } });
})();

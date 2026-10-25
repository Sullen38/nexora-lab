/* ============================================================================
 * objects/wing_plants.js — РОСЛИНИ ЛІВОГО КРИЛА (піксель-арт кодом, NX.kit.plant)
 * ----------------------------------------------------------------------------
 * Жодного вирізання з картинки: кожна рослина згенерована кодом у стилі
 * кімнати (темна зелень з холодними бліками, горщик з неоновим обідком) і
 * стоїть на своєму чіткому місці, нічого не перекриваючи:
 *   bigLeft  — велика монстера на кокосовій опорі на підлозі в самому лівому куті (перед столом)
 *   floorA/B — папороть і сансев'єра на підлозі ПЕРЕД столом AI-центру
 *   topVine  — ліана звисає з верхньої полиці над AI-центром
 *   shelfVine— ліана з верхньої полиці стелажа
 *   boothTop — пальма на даху будки аналітики
 *   winVine  — ліана над ліхтарем біля вікна
 *   mkDesk   — папороть на столі маркетингу (ліворуч, над кавомашиною)
 *   shelfBonsai / shelfNeon — бонсай у хромі й неонова рослина у склі на нових поличках
 *   deskGlass — сансев'єра у скляному кубі на столі AI-центру (праворуч)
 * Усі гойдаються (верх хитається, горщик стоїть; ліани — навпаки), тап — шелест.
 * Рослини v3 (NX.kit.plant): автопідгонка — кожна рослина вміщується у свій прямокутник w×h повністю,
 * жоден листок не обрізаний краєм (власник: «місцями обрізані та якісь недороблені»).
 * stage 'wall' — малюються в drawBack (за столами), 'layer' — за глибиною y.
 * ========================================================================== */
(() => {
  const P = NX.px, K = NX.kit;
  const LIST = [
    { id: 'bigLeft', kind: 'monstera', x: 0, y: 270, w: 42, h: 104, potW: 22, potH: 18, leaves: 12, seed: 3, stage: 'layer', depth: 374, s: 1 },
    { id: 'floorA', kind: 'fern', x: 146, y: 306, w: 50, h: 72, potW: 18, potH: 13, leaves: 15, seed: 5, stage: 'layer', depth: 378, s: .8, pal: 'light' },
    { id: 'floorB', kind: 'sansevieria', x: 198, y: 307, w: 36, h: 74, potW: 18, potH: 14, leaves: 9, seed: 8, stage: 'layer', depth: 381, s: .5 },
    { id: 'topVine', kind: 'vine', x: 4, y: 5, w: 46, h: 116, hang: 1, pot: 'none', leaves: 7, seed: 2, stage: 'wall', s: 1 },
    { id: 'shelfVine', kind: 'vine', x: 253, y: 29, w: 30, h: 52, hang: 1, pot: 'none', leaves: 4, seed: 6, stage: 'wall', s: .8, pal: 'sage' },
    { id: 'boothTop', kind: 'palm', x: 408, y: 50, w: 66, h: 80, potW: 20, potH: 14, leaves: 13, seed: 4, stage: 'wall', s: 1, neon: '#3be8ff' },
    { id: 'winVine', kind: 'vine', x: 484, y: 0, w: 46, h: 72, hang: 1, pot: 'none', leaves: 6, seed: 9, stage: 'wall', s: .9, pal: 'light' },
    { id: 'mkDesk', kind: 'fern', x: 492, y: 232, w: 38, h: 47, potW: 15, potH: 10, leaves: 12, seed: 7, stage: 'layer', depth: 279, s: .7, pal: 'sage' },
    { id: 'shelfBonsai', kind: 'bonsai', x: 504, y: 76, w: 24, h: 28, potW: 16, potH: 6, seed: 12, stage: 'wall', s: .3, pot: 'chrome' },
    { id: 'shelfNeon', kind: 'neon', x: 30, y: 128, w: 24, h: 32, potW: 12, potH: 9, leaves: 7, seed: 13, stage: 'wall', s: .6, pot: 'glass' },
    { id: 'deskGlass', kind: 'sansevieria', x: 300, y: 262, w: 16, h: 32, potW: 10, potH: 8, leaves: 5, seed: 14, stage: 'layer', depth: 294.5, s: .4, pot: 'glass' },
  ];
  // м'яка тінь рослин біля стіни (на поличках, на будці, ліани) — на цеглі за листям (№1; запікається в стіну)
  LIST.filter(d => d.stage === 'wall').forEach(d => NX.wing.shades.push({ ell: [d.x + d.w / 2 - .9, d.y + d.h * .45 + 2, d.w * (d.hang ? .4 : .48), d.h * (d.hang ? .44 : .5)], k: d.hang ? .3 : .45 }));
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

/* ============================================================================
 * objects/wing_react.js — РЕАКЦІЯ СТОЛІВ НА NEXI (пункт №8 списку «до рівня картинки»)
 * ----------------------------------------------------------------------------
 * Коли Nexi приходить працювати за стіл зони, стіл оживає:
 *   ЛАМПА ЗАГОРЯЄТЬСЯ — настільна лампа AI-центру «клацає» (два коротких блимання) і світить
 *     теплим конусом униз-ліворуч на стільницю, у повітря (wing_air.js) і на стелаж позаду;
 *     коли Nexi йде — за мить гасне. Лампи Едісона над аналітикою (bulbA) і маркетингом
 *     (bulbB) спалахують яскравіше, поки Nexi працює під ними (wing_props.js, wing_air.js).
 *   КОЛОНКА ПОКАЗУЄ ЗВУК — кубик-колонка AI-центру, кубик аналітики й розумна колонка
 *     маркетингу «грають» у такт (112 уд/хв): решітка стає еквалайзером, у боки йдуть
 *     піксельні звукові хвилі, вгору виринають ноти (K.soundFx); еквалайзер великого
 *     екрана AI-центру підхоплює ритм.
 *   КІТ ПРИХОДИТЬ НА СТІЛ — Рудик (actors/cat/cat.js → toDesk) біжить до столу, застрибує й
 *     вмощується біля Nexi: на AI-центрі — під лампою (гріється, частіше дрімає), на аналітиці
 *     й маркетингу — ліворуч від крісла. Nexi радіє (♥, інколи фраза desk.cat з i18n).
 *     Коли Nexi йде — кіт потягується й зістрибує туди, звідки застрибнув.
 * Зони описують себе самі (ai_center.js / analytics.js / marketing.js):
 *   NX.wing.react.add(id, { loc — де стоїть/сидить Nexi (NX.nexi.loc),
 *     cat: {x, y — місце на столі, from — точка підлоги для стрибка, face — куди дивиться,
 *           sy — глибина для масштабу (як у Nexi за столом)},
 *     light: {y — шар, at: [x, y, r]} — тепле світло лампи поверх кота (необов'язково) })
 * Стан для малювання: here(id), lamp(id) 0..1 (з «клацанням»), snd(id) 0..1, bulb(id) 0..1, beat(t).
 * Хвилі й ноти — функції часу, без частинок і стану (як пил у wing_air.js) — кадр не дорожчає.
 * ========================================================================== */
(() => {
  const P = NX.px, K = NX.kit, hash = NX.art.hash, rgba = K.rgba, lit = K.lit;
  const BPM = 112, SPB = 60 / BPM;                                                // темп «музики» колонок
  const Z = {};
  /** Такт: n — номер удару, f — фаза 0..1, kick — удар (різкий спалах, швидке згасання). */
  const beat = t => { const p = t / SPB, n = Math.floor(p), f = p - n; return { n, f, p, kick: (1 - f) ** 4 }; };

  /** Рівень лампи 0..1. Nexi став за стіл -> за .25 с «клац» (блим-блим) і світить; пішов -> ще .7 с світить і гасне за .3 с.
   *  Якщо Nexi повернувся, поки лампа ще горить, — без блимання. */
  function lamp(id, t = NX.time) {
    const z = Z[id]; if (!z) return 0;
    if (z.on) {
      const a = t - z.t0; if (a < .25) return z.lv0;
      const b = a - .25; return b < .06 ? .95 : b < .14 ? .06 : b < .2 ? .8 : b < .27 ? .15 : Math.min(1, .6 + (b - .27) * 2.5);
    }
    const b = t - z.t1 - .7; return b < 0 ? z.lv1 : Math.max(0, z.lv1 * (1 - b / .3));
  }

  /** Нота піксель-артом (одиниці кімнати): ♪ — з прапорцем, ♫ — дві з ребром. */
  function note(c, x, y, col, dbl) {
    x = Math.round(x * 2) / 2; y = Math.round(y * 2) / 2; c.fillStyle = col;
    c.fillRect(x, y + 2.6, 1.7, 1.2); c.fillRect(x + 1.2, y, .6, 3.2);
    if (dbl) { c.fillRect(x + 2.6, y + 3, 1.7, 1.2); c.fillRect(x + 3.8, y + .4, .6, 3.2); c.fillRect(x + 1.2, y, 3.2, .8); }
    else { c.fillRect(x + 1.8, y + .5, .7, .7); c.fillRect(x + 2.4, y + 1.1, .6, 1); }
  }

  /** ЗВУК З КОЛОНКИ (адитивно, поверх її корпусу). s = {x0, y0, x1, y1 — корпус; eq: [x0, y0, x1, y1] — решітка, cols, rows,
   *  col — колір смужок; bg — темне тло під еквалайзером (якщо решітка сама світиться); waves — хвилі в обидва боки (rgb — wave);
   *  notes — ноти вгору (drift — знос убік); seed}. lvl 0..1 — гучність (плавно). */
  K.soundFx = (c, s, t, lvl) => {
    if (lvl < .02) return;
    const sd = s.seed || 0, b = beat(t), cx = (s.x0 + s.x1) / 2, cy = (s.y0 + s.y1) / 2, w = s.x1 - s.x0;
    c.save();
    if (s.eq && s.bg) { c.globalAlpha = Math.min(1, lvl * 1.3) * .9; lit(c, s.eq[0], s.eq[1], s.eq[2] - s.eq[0], s.eq[3] - s.eq[1], s.bg); c.globalAlpha = 1; }   // віконце гасне — у ньому еквалайзер
    c.globalCompositeOperation = 'lighter';
    // корпус «гупає»: на удар — світлий обвід
    c.strokeStyle = rgba(s.wave || '120,240,255', .3 * b.kick * lvl); c.lineWidth = .6; c.strokeRect(s.x0 - .3, s.y0 - .3, w + .6, s.y1 - s.y0 + .6);
    // еквалайзер на решітці: стовпчики-крапки знизу вгору; перший (бас) підстрибує на удар
    if (s.eq) {
      const [a0, b0, a1, b1] = s.eq, n = s.cols || 3, m = s.rows || 3, cw = (a1 - a0) / n, rh = (b1 - b0) / m;
      for (let i = 0; i < n; i++) {
        const v = P.clamp((K.noise(t * 2.6, i * 1.9 + sd) - .22) * 1.45 + b.kick * (i ? .3 : .6), 0, 1) * lvl, h = Math.max(1, Math.round(v * m));
        for (let k = 0; k < h; k++) lit(c, a0 + i * cw + cw * .16, b1 - (k + 1) * rh + rh * .14, cw * .68, rh * .72, k === h - 1 && v > .55 ? '#ffffff' : (s.col || '#7af0ff'));
      }
    }
    // звукові хвилі: кожен удар — дуга з крапок, що розходиться в боки від корпусу й гасне (видно 2 останні)
    if (s.waves) for (let k = 0; k < 2; k++) {
      const age = (b.f + k) / 2, r = w * .55 + 1.2 + age * 10, a = (1 - age) ** 1.3 * lvl; if (a < .04) continue;
      c.fillStyle = rgba(s.wave || '120,240,255', a);
      for (const side of [-1, 1]) for (let q = -2; q <= 2; q++) { const ang = q * .3, x = cx + side * Math.cos(ang) * r, y = cy + Math.sin(ang) * r * .85; c.globalAlpha = 1 - Math.abs(q) * .2; c.fillRect(Math.round(x * 2) / 2 - .55, Math.round(y * 2) / 2 - .55, 1.1, 1.1); }
      c.globalAlpha = 1;
    }
    // ноти: одна на 2 удари; виринає над колонкою, пливе вгору з погойдуванням і гасне за ~2 с
    if (s.notes) {
      const per = SPB * 2, pp = t / per + sd * .37, n0 = Math.floor(pp), life = 2;
      for (let k = 0; k < 5; k++) {
        const id = n0 - k, age = (pp - id) * per; if (age > life || age < 0) continue;
        const h1 = hash(id, 3 + sd), x = cx - 1.2 + (h1 - .5) * w * .7 + Math.sin(age * 2.8 + id) * 1.6 + age * (s.drift === undefined ? 1.4 : s.drift), y = s.y0 - 3.5 - age * 8.5;
        const a = Math.sin(Math.PI * Math.min(1, age / life)) ** .6 * lvl;
        note(c, x, y, rgba(['255,226,122', '255,122,240', '122,240,255'][((id % 3) + 3) % 3], a * .95), hash(id, 9) > .6);
      }
    }
    c.restore();
  };

  const R = NX.wing.react = {
    Z, BPM, beat,
    /** Зона описує себе: id — як сценарій Nexi ('ai', 'analytics', 'marketing'). */
    add(id, spec) { Z[id] = Object.assign({ on: false, t0: -9, t1: -9, lv0: 0, lv1: 0, snd: 0, bulb: 0, greeted: false }, spec); },
    here(id) { const z = Z[id]; return !!z && NX.nexi.loc === z.loc; },
    lamp, snd(id) { return Z[id] ? Z[id].snd : 0; }, bulb(id) { return Z[id] ? Z[id].bulb : 0; },
    /** Кіт приземлився на стіл (cat.js) або Nexi прийшов, а кіт уже там: Nexi радіє — раз за візит. */
    greet(id) {
      const z = Z[id], n = NX.nexi; if (!z || z.greeted || n.loc !== z.loc) return; z.greeted = true;
      n.emote('love', 2.4); for (let i = 0; i < 2; i++) setTimeout(() => NX.fx.emit('heart', NX.cat.x + (i ? 3 : -3), NX.cat.y - 26), 250 + i * 450);
      if (NX.time > (this.sayT || 0) && Math.random() < .45) { this.sayT = NX.time + 45; setTimeout(() => { if (!n.talking && n.loc === z.loc) n.say(NX.pick('desk.cat')); }, 900); }
    },
    /** Кіт: коли Nexi йде до столу зони (task.id = id зони, у черзі — його місце) або вже там — раз за візит кличемо Рудика
     *  (через .6..2 с, як справжній кіт); коли Nexi пішов з того столу — за 1..2 с кіт потягується й зістрибує. */
    cat(t) {
      const n = NX.nexi, c = NX.cat; if (!c || !c.toDesk) return;
      let want = null; for (const id in Z) if (n.loc === Z[id].loc) want = id;
      if (!want && n.task && Z[n.task.id] && n.queue.some(a => a.loc === Z[n.task.id].loc)) want = n.task.id;
      if (want !== this.want) { this.want = want; this.wantT = t + .6 + Math.random() * 1.4; this.sent = false; }
      if (want && !this.sent && t > this.wantT && c.canDesk()) { this.sent = true; c.toDesk(want, Z[want].cat); }
      if (c.desk && c.desk.id !== want) { if (!this.leaveT) this.leaveT = t + 1 + Math.random(); if (t > this.leaveT) { this.leaveT = 0; c.leaveDesk(); } }
      else this.leaveT = 0;
    },
  };

  NX.addObject({
    id: 'wingReact',
    update(dt, t) {
      const n = NX.nexi;
      for (const id in Z) {
        const z = Z[id], at = n.loc === z.loc, back = z.on && !at && n.task && n.task.id === id && n.queue.some(a => a.loc === z.loc);
        const here = at || back;                                                 // злітає й повертається за той самий стіл (ще одна задача тут) — лампа не гасне
        if (here !== z.on) {
          if (here) { z.lv0 = lamp(id, t); z.on = true; z.t0 = z.lv0 > .5 ? t - 9 : t; z.greeted = false; if (NX.cat.desk && NX.cat.desk.id === id && NX.cat.desk.phase === 'on') setTimeout(() => R.greet(id), 800); }
          else { z.lv1 = lamp(id, t); z.on = false; z.t1 = t; }
        }
        const play = here && t - z.t0 > .55;                                     // музика — одразу після «клацання» лампи
        z.snd += ((play ? 1 : 0) - z.snd) * Math.min(1, dt * (play ? 2.5 : 1.3));
        z.bulb += ((here ? 1 : 0) - z.bulb) * Math.min(1, dt * (here ? 1.8 : .9));
      }
      R.cat(t);
    },
    /** Тепле світло лампи поверх кота на столі (шар одразу за ним), щоб Рудик справді «грівся» під лампою. */
    layers(t) {
      const out = [];
      for (const id in Z) {
        const z = Z[id]; if (!z.light) continue; const L = lamp(id, t); if (L < .02) continue;
        out.push({ y: z.light.y, draw: c => { const [x, y, r] = z.light.at; P.glow(c, x, y, r, 'rgba(255,196,120,.9)', .17 * L); P.glow(c, x + 2, y - 2, r * .45, 'rgba(255,232,180,.9)', .1 * L); } });
      }
      return out;
    },
  });
})();

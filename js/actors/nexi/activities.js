/* ============================================================================
 * actors/nexi/activities.js — СЦЕНАРІЇ: ЩО NEXI РОБИТЬ У КОЖНІЙ ЗОНІ КІМНАТИ
 * ----------------------------------------------------------------------------
 * Кожен сценарій:
 *   title  – назва задачі (чип унизу екрана і дошка задач)
 *   steps  – кроки, що показуються під час роботи
 *   nav    – яка вкладка меню підсвічується
 *   lines  – що Nexi каже (обирається випадково)
 *   route(n) – список дій для черги (формат див. у nexi.js)
 * Щоб додати нову взаємодію: додай сюди сценарій і (за потреби) точку в
 * core/config.js → POI. Решта коду не змінюється.
 * ========================================================================== */
(() => {
  const P = () => NX.cfg.POI, pick = a => a[Math.random() * a.length | 0];
  NX.acts = {
    home: { title: 'Док-станція', nav: 'home', steps: ['Повертаюсь на док', 'Заряджаюсь'],
      lines: ['Привіт! Я Nexi, твій AI-помічник для бізнесу. Натисни на будь-яку зону кімнати, і я піду туди працювати.', 'Я вдома, на зарядці. Чим займемось?'],
      route() { const h = NX.objects.rug.home; return [{ walk: h }, { loc: 'dock' }, { face: 1 }, { say: pick(this.lines) }, { work: { pose: 'wave', dur: 2.5 } }]; } },

    ai: { title: 'AI-центр: відповідь клієнту', nav: 'ai', color: '#3be8ff',
      steps: ['Злітаю на стіл', 'Читаю запит клієнта', 'Пишу відповідь', 'Надіслано ✓'],
      lines: ['AI-центр: відповідаю клієнтам, пишу листи й підсумки зустрічей.', 'Читаю ваші документи і за секунди знаходжу потрібне.', 'Генерую ідеї для акцій та назв. Опиши задачу, і я візьмусь.'],
      route() { const p = P().aiDesk; return [{ walk: p.floor }, { fly: p.top }, { loc: 'aiDesk' }, { face: -1 }, { say: pick(this.lines) }, { work: { pose: 'type', dur: 11, obj: 'aiPc', face: -1 } }, { do: () => NX.nexi.emote('happy') }]; } },

    analytics: { title: 'Аналітика: звіт продажів', nav: 'analytics', color: '#ffc94d',
      steps: ['Сідаю за екрани', 'Збираю дані', 'Будую графік', 'Звіт готовий ✓'],
      lines: ['Аналітика: збираю продажі, трафік і витрати в один звіт.', 'Бачу, де падає конверсія, і підкажу, що виправити.'],
      route() { const p = P().analytics; return [{ walk: p.floor }, { hop: p.chair }, { loc: 'chairA' }, { say: pick(this.lines) }, { work: { pose: 'sitType', dur: 11, obj: 'analytics', back: true } }]; } },

    marketing: { title: 'Маркетинг: кампанія', nav: 'marketing', color: '#d94bff',
      steps: ['Сідаю за екран', 'Пишу пост', 'Запускаю рекламу', 'Охоплення росте ✓'],
      lines: ['Маркетинг: пишу пости, розсилки та рекламу у вашому стилі.', 'Підберу аудиторію і заплануюю кампанії на тиждень.'],
      route() { const p = P().marketing; return [{ walk: p.floor }, { hop: p.chair }, { loc: 'chairM' }, { say: pick(this.lines) }, { work: { pose: 'sitType', dur: 11, obj: 'marketing', back: true } }]; } },

    workshop: { title: 'Майстерня: новий скін', nav: 'workshop', color: '#ff7af0',
      steps: ['Стаю на сканер', 'Сканую корпус', 'Обирай скін ✓'],
      lines: ['Майстерня: тут я міряю нові скіни. Обирай праворуч!', 'Мій розмір і рухи сталі, а скіни можна міняти скільки завгодно.'],
      route() { const p = P().workshop; return [{ walk: p.floor }, { hop: p.pad }, { loc: 'pad' }, { face: 1 }, { say: pick(this.lines) }, { do: () => NX.ui.skinlab.show() }, { work: { pose: 'scan', dur: 6, obj: 'workshop' } }]; } },

    tools: { title: 'Інструменти: інтеграції', nav: 'tools', color: '#3bff8a',
      steps: ['Злітаю до панелі', 'Підключаю пошту', 'Підключаю календар', 'Підключаю CRM ✓'],
      lines: ['Інструменти: підключаю CRM, пошту, месенджери й календар.', 'Автоматизую рутину: нагадування, рахунки, заявки з сайту.'],
      route() { const p = P().tools; return [{ walk: p.floor }, { fly: p.hover }, { loc: 'hover' }, { say: pick(this.lines) }, { work: { pose: 'hoverFix', dur: 10, obj: 'tools', back: true, tick: () => Math.random() < .25 && NX.fx.emit('spark', NX.nexi.x + 6, NX.nexi.y - 40) } }]; } },

    portal: { title: 'Портал: бізнес-простір', nav: 'portal', color: '#d94bff',
      steps: ['Відкриваю портал', 'Синхронізую простір', 'Повертаюсь ✓'],
      lines: ['Портал веде у ваш бізнес-простір: проєкти, команда, клієнти.', 'Синхронізую все, що налаштовано. Зараз повернусь!'],
      route() { const p = P().portal; return [{ walk: p.floor }, { walk: p.step }, { loc: 'portalStep' }, { face: 1 }, { say: pick(this.lines) },
        { do: () => NX.objects.portal.active = true }, { fade: { alpha: 0, zoom: .35, y: p.gate[1], dur: 1.4 } },
        { work: { pose: 'stand', dur: 3 } }, { fade: { alpha: 1, zoom: 1, y: p.step[1], dur: 1.2 } },
        { do: () => { NX.objects.portal.active = false; NX.nexi.emote('cool', 2); } }, { walk: p.floor }, { loc: 'floor' }]; } },

    coffee: { title: 'Кава-перерва', nav: null, color: '#ffc94d', steps: ['Варю каву', 'П\'ю каву ☕'],
      lines: ['Кава-перерва! Навіть AI іноді заряджається кавою.', 'Секунду, зварю собі каву.'],
      route() { const p = P().coffee, m = NX.objects.coffee; return [{ walk: p.stand }, { face: -1 }, { say: pick(this.lines) },
        { work: { pose: 'press', dur: 3.2, start: () => m.brew = .01 } }, { do: () => { m.brew = 0; m.cup = false; } }, { work: { pose: 'drink', dur: 5 } }]; } },

    sofa: { title: 'Відпочинок на дивані', nav: null, color: '#7a5cff', steps: ['Сідаю на диван', 'Читаю новини'],
      lines: ['Трохи відпочину й почитаю бізнес-новини.', 'Диван — найкраще місце для нових ідей.'],
      route() { const p = P().sofa; return [{ walk: p.floor }, { hop: p.sit }, { loc: 'sofaSit' }, { face: 1 }, { say: pick(this.lines) }, { work: { pose: 'sitRead', dur: 12 } }]; } },

    sleep: { title: 'Сон на дивані', nav: null, color: '#7d8cc4', steps: ['Лягаю', 'Zzz...'], lines: ['Щось я втомився... Розбуди, коли буду потрібен.'],
      route() { const p = P().sofa; return [{ walk: p.floor }, { say: this.lines[0] }, { hop: p.lie }, { loc: 'sofaLie' }, { rot: -90 }, { face: 1 },
        { work: { pose: 'sleep', dur: 9999, tick: () => Math.random() < .02 && NX.fx.emit('z', NX.nexi.x - 14, NX.nexi.y - 16) } }]; } },

    petCat: { title: 'Погладити кота', nav: null, color: '#ff7a2a', steps: ['Іду до Рудика', 'Гладжу ♥'],
      lines: ['Рудик, іди сюди! Хто тут найкращий кіт?', 'Кото-перерва: погладжу Рудика.'],
      route() { const c = NX.cat, side = c.x > 700 ? -1 : 1, gy = Math.max(c.ground, 362), [x, y] = NX.room.clampWalk(c.x + side * 26, gy);
        return [{ walk: [x, y] }, { face: -side }, { say: pick(this.lines) }, { do: () => NX.cat.purr(4.5) }, { work: { pose: 'pet', dur: 4 } }, { do: () => NX.nexi.emote('love') }]; } },

    feedCat: { title: 'Нагодувати кота', nav: null, color: '#ff7a2a', steps: ['Іду до мисок', 'Насипаю корм ✓'],
      lines: ['Рудик голодний! Насиплю корму.'],
      route() { const b = NX.objects.catCorner.bowl; return [{ walk: [b[0] + 22, b[1] + 2] }, { face: -1 }, { say: this.lines[0] }, { work: { pose: 'pour', dur: 3, end: () => { NX.objects.catCorner.food = 1; NX.cat.hunger = .75; } } }]; } },

    dance: { title: 'Танець на килимі', nav: null, color: '#ff4fd8', steps: ['Музика!', 'Танцюю ♪'],
      route() { const h = NX.objects.rug.home; return [{ walk: [h[0] + 40, h[1]] }, { work: { pose: 'dance', dur: 6, tick: () => Math.random() < .05 && NX.fx.emit('note', NX.nexi.x, NX.nexi.y - 50) } }]; } },

    arcade: { title: 'Гра на автоматі', nav: null, color: '#d94bff', steps: ['Кидаю монетку', 'Граю ★'],
      lines: ['Перерва на 8-bit! Побʼю свій рекорд.', 'Одну партію і назад до роботи.'],
      route() { const [x, y] = NX.objects.arcade.pos; const k = NX.px.depthK(y); return [{ walk: [x + 34 * k, y + 4] }, { face: -1 }, { say: pick(this.lines) }, { work: { pose: 'type', dur: 9, obj: 'arcade', face: -1 } }, { do: () => NX.nexi.emote('happy') }]; } },

    beanbag: { title: 'Релакс на пуфі', nav: null, color: '#d94bff', steps: ['Сідаю на пуф', 'Читаю'],
      lines: ['Посиджу на пуфі, почитаю про нові тренди.'],
      route() { const [x, y] = NX.objects.lounge.pos, k = NX.px.depthK(y); return [{ walk: [x + 30 * k, y + 8] }, { hop: [x, y - 22 * k] }, { loc: 'beanbag' }, { face: 1 }, { say: this.lines[0] }, { work: { pose: 'sitRead', dur: 11 } }]; } },

    wander: { title: 'Прогулянка кімнатою', nav: null, color: '#3be8ff', steps: ['Гуляю'],
      route() { const b = NX.room.walkBounds(); return [{ walk: NX.room.clampWalk(80 + Math.random() * 1380, b.minY + Math.random() * (b.maxY - b.minY)) }, { work: { pose: 'think', dur: 2.5 } }]; } },
  };
})();

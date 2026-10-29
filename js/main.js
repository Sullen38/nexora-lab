/* ============================================================================
 * main.js — ЗАПУСК ПІД ВІТАЛЬНОЮ ЗАСТАВКОЮ
 * Заставка (index.html + js/ui/splash.js) з'являється одразу й показує справжні етапи на лоад-барі:
 *   скрипти -> картинка кімнати -> місто за вікном -> 3D-крила -> перший кадр («готово»).
 * Важке (місто, 3D-крила, злиття під екран, перший кадр) — генераторами ДРІБНИМИ ШМАТКАМИ з паузами для браузера
 * (NX.boot.run): лоад-бар рухається, а не «замерзає». Далі — збережений скін, інтерфейс, головний цикл і плавний
 * перехід заставки в кімнату (NX.boot.reveal), привітання.
 * ========================================================================== */
(async () => {
  const B = NX.boot; let ui = false, placed = false;
  B.set('js', 1);                                                                    // останній скрипт — отже, усі завантажені
  B.live();                                                                          // Nexi на заставці оживає (якщо ще ні)
  if (/hold/.test(location.hash)) return;                                            // знімки заставки (tools/splash/shot.js, адреса #splash-a-hold): лишити її як є, етапи ставить інструмент
  try {
    // 1) КАРТИНКА КІМНАТИ — вантажиться з самого початку (index.html), паралельно зі скриптами; тут її декодуємо — теж
    //    паралельно: місту вона не потрібна, тож на повільному інтернеті місто будується, поки картинка ще йде
    const img = (async () => { await NX.room.load(await B.roomSrc()); try { await NX.room.img.decode(); } catch (e) {} B.set('img', 1); })();
    NX.i18n.lang = NX.i18n.detect(); document.documentElement.lang = NX.i18n.lang;   // мова телефону / збережена
    // 2) МІСТО ЗА ВІКНОМ
    NX.city.init();
    await B.run(NX.city.buildGen(), 'city');
    await img;
    // 3) 3D-КРИЛА: потрібні картинка кімнати (дзеркальна підлога), розмір екрана (камера, стеля, підлога) і шрифт написів
    NX.loop.prep();
    await B.fonts();
    await B.run(NX.arc.scene.bootG(), 'wings');
    NX.city.markPatched();                                                           // передня підлога-дзеркало вже зібрана
    // 4) ГОТОВО: скін, інтерфейс, Nexi на доку, камера на ньому, перший кадр по шматках
    try { Object.assign(NX.nexi.look, JSON.parse(localStorage.getItem('nexi-look') || '{}'), { face: 'standard' }); } catch (e) {}   // вирази — емоції Nexi, не збережений вибір
    NX.ui.skinlab.init(); NX.ui.chat.init(); NX.ui.hud.init(); ui = true;
    [NX.nexi.x, NX.nexi.y] = NX.objects.rug.home; NX.nexi.gy = NX.nexi.y; placed = true;
    NX.cam.x = NX.px.clamp(NX.nexi.x - NX.cam.viewW / 2, 0, Math.max(0, NX.cfg.ROOM_W - NX.cam.viewW));   // телефон: одразу на Nexi
    await B.run(NX.loop.warmG(), 'ready');
  } catch (e) {
    console.error('[boot]', e);                                                       // щось не так — кімната однаково запуститься,
    if (NX.arc.scene) NX.arc.scene.rebuild();                                         // а недобудоване добудується по ходу (як до заставки)
    if (!ui) try { NX.ui.skinlab.init(); NX.ui.chat.init(); NX.ui.hud.init(); } catch (e2) { console.error(e2); }
  }
  NX.loop.start();
  if (!placed) { [NX.nexi.x, NX.nexi.y] = NX.objects.rug.home; NX.nexi.gy = NX.nexi.y; }
  NX.ui.chat.add('b', NX.t('chat.greet'));
  await B.reveal();                                                                  // плавний перехід заставки в кімнату
  setTimeout(() => NX.nexi.do('home', false), 300);
})();

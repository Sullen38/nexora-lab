/* ============================================================================
 * main.js — ЗАПУСК
 * Порядок: завантажити картинку кімнати -> підготувати "життя" фону ->
 * відновити збережений скін -> інтерфейс -> головний цикл -> привітання.
 * ========================================================================== */
(async () => {
  await NX.room.load(window.NX_ROOM_SRC || 'assets/room.webp');
  NX.i18n.lang = NX.i18n.detect(); document.documentElement.lang = NX.i18n.lang;   // мова телефону / збережена
  NX.ambient.init(); NX.city.init();
  try { Object.assign(NX.nexi.look, JSON.parse(localStorage.getItem('nexi-look') || '{}')); } catch (e) {}
  NX.ui.skinlab.init(); NX.ui.chat.init(); NX.ui.hud.init();
  NX.loop.start();
  [NX.nexi.x, NX.nexi.y] = NX.objects.rug.home; NX.nexi.gy = NX.nexi.y;
  NX.ui.chat.add('b', NX.t('chat.greet'));
  setTimeout(() => NX.nexi.do('home', false), 600);
})();

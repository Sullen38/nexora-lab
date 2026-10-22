/* ============================================================================
 * main.js — ЗАПУСК
 * Порядок: завантажити картинку кімнати -> підготувати "життя" фону ->
 * відновити збережений скін -> інтерфейс -> головний цикл -> привітання.
 * ========================================================================== */
(async () => {
  await NX.room.load(window.NX_ROOM_SRC || 'assets/room.webp');
  NX.ambient.init();
  try { Object.assign(NX.nexi.look, JSON.parse(localStorage.getItem('nexi-look') || '{}')); } catch (e) {}
  NX.ui.hud.init(); NX.ui.skinlab.init(); NX.ui.chat.init();
  NX.loop.start();
  [NX.nexi.x, NX.nexi.y] = NX.objects.rug.home; NX.nexi.gy = NX.nexi.y;
  NX.ui.chat.add('b', 'Привіт! Я Nexi. Натисни на будь-яку зону кімнати, і я піду туди працювати. Натисни на мене, щоб змінити скін.');
  setTimeout(() => NX.nexi.do('home', false), 600);
})();

/* ============================================================================
 * garden/catalog.js — КАТАЛОГ БОТАНІЧНОГО САДУ: СЕКТОРИ Й КУЛЬТУРИ (NX.gardenCat)
 * ----------------------------------------------------------------------------
 * Власник (13.11): «Nexi доглядає всі овочі й фрукти світу, які він урятував, — саме те, що їдять люди; решта рослин —
 * лише фон. Теплиця сама все доглядає, і під кожну рослину — та технологія, що їй потрібна в реальному житті».
 *
 * Це файл ДАНИХ (логіки тут немає): хто де росте і як.
 *   W, X0, X1, LOBBY, GY — геометрія галереї в одиницях кімнати: ширина сектора (майже екран телефона), краї галереї
 *                        (вона ширша за кімнату — гортається), хол ліфта (по центру — острівець із сакурою, x 768),
 *                        лінія підлоги під стіною.
 *   SECTORS            — 10 секторів зліва направо (схему підтвердив власник 13.11): прохолодне крило → ліфт → тепле.
 *                        id, col — неон вивіски, t / h — клімат (°C, % вологості), ready — сектор уже збудовано.
 *   CROPS              — культури: id (назви 4 мовами — js/i18n/*.js garden.crop.<id>), latin (одна на всі мови),
 *                        sec — сектор, type — як її малює генератор (garden/plants.js), days — днів до врожаю в житті
 *                        (від цього — швидкість росту на екрані), no — номер у каталозі.
 * Додати культуру = один рядок тут + назва в чотирьох словниках.
 * ========================================================================== */
NX.gardenCat = (() => {
  const W = 280, LOBBY = [608, 928], X0 = LOBBY[0] - 5 * W, X1 = LOBBY[1] + 5 * W, GY = 440;
  const SECTORS = [
    { id: 'mush', col: '#b48cff', t: 14, h: 92 },      // грибна камера: темрява, туман, блоки субстрату
    { id: 'soil', col: '#ffb46a', t: 16, h: 60 },      // ґрунтові гряди: коренеплоди
    { id: 'grain', col: '#ffe27a', t: 18, h: 50 },     // зернові під лампами: яруси лотків
    { id: 'hydro', col: '#3bff8a', t: 20, h: 65 },     // гідропоніка: жолоби з тонким шаром розчину
    { id: 'aero', col: '#3be8ff', t: 20, h: 70 },      // аеропоніка: вежі, корені в тумані
    { id: 'drip', col: '#ff6a5a', t: 24, h: 70 },      // субстрат і крапельний полив
    { id: 'paddy', col: '#6ad8ff', t: 26, h: 80 },     // чеки з рисом і аквапоніка
    { id: 'orchard', col: '#ff86c4', t: 22, h: 55 },   // сад на шпалерах
    { id: 'dry', col: '#ffc94d', t: 32, h: 25 },       // суха зона
    { id: 'dome', col: '#7aff9a', t: 28, h: 88 },      // тропічний купол
  ];
  SECTORS.forEach((s, i) => { s.i = i; s.x0 = i < 5 ? X0 + i * W : LOBBY[1] + (i - 5) * W; s.x1 = s.x0 + W; s.ready = false; });
  const C = (id, sec, type, latin, days) => ({ id, sec, type, latin, days });
  const CROPS = [
    C('champignon', 'mush', 'cap', 'Agaricus bisporus', 21), C('oyster', 'mush', 'shelf', 'Pleurotus ostreatus', 18), C('shiitake', 'mush', 'cap', 'Lentinula edodes', 60),
    C('carrot', 'soil', 'root', 'Daucus carota', 75), C('beet', 'soil', 'root', 'Beta vulgaris', 60), C('onion', 'soil', 'bulb', 'Allium cepa', 100), C('garlic', 'soil', 'bulb', 'Allium sativum', 240),
    C('wheat', 'grain', 'cereal', 'Triticum aestivum', 110), C('barley', 'grain', 'cereal', 'Hordeum vulgare', 90), C('buckwheat', 'grain', 'cereal', 'Fagopyrum esculentum', 80), C('maize', 'grain', 'stalk', 'Zea mays', 95),
    C('lettuce', 'hydro', 'rosette', 'Lactuca sativa', 45), C('spinach', 'hydro', 'bunch', 'Spinacia oleracea', 40), C('basil', 'hydro', 'bush', 'Ocimum basilicum', 60), C('dill', 'hydro', 'feather', 'Anethum graveolens', 50),
    C('strawberry', 'aero', 'berry', 'Fragaria × ananassa', 90), C('potato', 'aero', 'tuber', 'Solanum tuberosum', 100),
    C('tomato', 'drip', 'vine', 'Solanum lycopersicum', 80), C('cucumber', 'drip', 'vine', 'Cucumis sativus', 60), C('pepper', 'drip', 'shrub', 'Capsicum annuum', 75),
    C('rice', 'paddy', 'cereal', 'Oryza sativa', 120),
    C('apple', 'orchard', 'tree', 'Malus domestica', 150), C('pear', 'orchard', 'tree', 'Pyrus communis', 140), C('grape', 'orchard', 'vine', 'Vitis vinifera', 160),
    C('date', 'dry', 'palm', 'Phoenix dactylifera', 200), C('fig', 'dry', 'tree', 'Ficus carica', 120), C('pomegranate', 'dry', 'tree', 'Punica granatum', 170),
    C('banana', 'dome', 'palm', 'Musa acuminata', 300), C('cacao', 'dome', 'tree', 'Theobroma cacao', 170), C('coffee', 'dome', 'shrub', 'Coffea arabica', 240),
  ];
  CROPS.forEach((c, i) => { c.no = i + 1; });
  return {
    W, X0, X1, LOBBY, GY, SECTORS, CROPS,
    sector: id => SECTORS.find(s => s.id === id),
    crop: id => CROPS.find(c => c.id === id),
    of: sec => CROPS.filter(c => c.sec === sec),
    /** Скільки культур уже росте в саду (у збудованих секторах). */
    grown: () => CROPS.filter(c => SECTORS.find(s => s.id === c.sec).ready).length,
  };
})();

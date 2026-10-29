/* ============================================================================
 * actors/nexi/skins.js — КАТАЛОГ СКІНІВ NEXI (тільки дані, без логіки)
 * ----------------------------------------------------------------------------
 * Структура бота незмінна (HD-сітка 48×56 пікселів), змінюються лише скіни:
 *   THEMES  – кольорові теми (весь корпус)      BODIES – тулуб / корпус
 *   ARMS    – руки                              LEGS   – ноги
 *   FACES   – екран обличчя                     ANTS   – антени
 *   ACCS    – аксесуари (слоти back/head/hand)  FX     – ефекти частинок
 *   MOODS   – емоції                            ACTIONS – дії (анімації)
 * Щоб додати скін: додай запис у потрібний словник і, якщо треба, його
 * малювання в actors/nexi/sprite.js. Більше нічого чіпати не треба.
 * ========================================================================== */
const SW=48,SH=56,FOOT=52,OUT='#0a0f2e';   // розмір спрайта; FOOT — рядок, де стоять ноги
const SPRITE_K=0.75;                        // HD-піксель = 0.75 старого: розмір бота в кімнаті не змінився
const hx=h=>[1,3,5].map(i=>parseInt(h.slice(i,i+2),16));
const toHex=a=>'#'+a.map(v=>Math.max(0,Math.min(255,Math.round(v))).toString(16).padStart(2,'0')).join('');
const shade=(h,k)=>{const c=hx(h);return toHex(k>=0?c.map(v=>v+(255-v)*k):c.map(v=>v*(1+k)))};
// themes (Ноги / Теми): shell, accent, joint, eye
const THEMES={
standard:{n:'Стандарт',shell:'#e9eefc',acc:'#3b8cff',jnt:'#46508a',eye:'#3be8ff'},
techno:{n:'Техно',shell:'#a8d6e6',acc:'#17c3c9',jnt:'#2d5c78',eye:'#3bffe0'},
neon:{n:'Неон',shell:'#c68cf0',acc:'#ff4fd8',jnt:'#4a2a7a',eye:'#ff7af0'},
camo:{n:'Камуфляж',shell:'#7f9a5a',acc:'#c98b3a',jnt:'#3d4a2a',eye:'#d9ff7a'},
gamer:{n:'Геймер',shell:'#d85a5a',acc:'#6a5cff',jnt:'#5a1f2f',eye:'#ffe14d'},
space:{n:'Космос',shell:'#8a82d8',acc:'#4a5cff',jnt:'#2a2a6a',eye:'#9ad0ff'},
desert:{n:'Пустеля',shell:'#e0b878',acc:'#c9712e',jnt:'#7a5a2a',eye:'#fff0a0'},
forest:{n:'Ліс',shell:'#5fae6a',acc:'#2d7a3a',jnt:'#1f4a2a',eye:'#b6ff8a'},
winter:{n:'Зима',shell:'#d8f2ff',acc:'#7ad0ff',jnt:'#5a8ab0',eye:'#7af0ff'},
fire:{n:'Вогонь',shell:'#ff9a4a',acc:'#ff3b2e',jnt:'#7a2a1a',eye:'#ffe27a'},
water:{n:'Вода',shell:'#5ab4f0',acc:'#2a6aff',jnt:'#1f3f7a',eye:'#bff4ff'},
gold:{n:'Золото',shell:'#ffd45a',acc:'#e0902a',jnt:'#8a5a1a',eye:'#fff4b0'},
evil:{n:'Злий',shell:'#6a2a8a',acc:'#ff2a4a',jnt:'#2a1040',eye:'#ff3b3b'},
shadow:{n:'Тінь',shell:'#4a5070',acc:'#8a8aff',jnt:'#1a1d33',eye:'#b0a8ff'},
rainbow:{n:'Райдуга',shell:'#ffb0e0',acc:'#7a8aff',jnt:'#5a3a8a',eye:'#ffffff',rb:true},
military:{n:'Військовий',shell:'#8a8f78',acc:'#c8b45a',jnt:'#3a3d2e',eye:'#9affb0'},
premium:{n:'Преміум',shell:'#f2e0b0',acc:'#d9a02a',jnt:'#6a4a2a',eye:'#ffe27a'}};
const BODIES={
standard:{n:'Стандарт'},
techno:{n:'Техно',shell:'#6ab8d0',acc:'#ff4fd8',pat:'lines'},
energy:{n:'Енергія',shell:'#2a46b0',acc:'#ff4fd8',pat:'core'},
holo:{n:'Голограма',shell:'#4ad0ff',acc:'#cffaff',pat:'holo'},
camo:{n:'Камуфляж',shell:'#6a6a3a',acc:'#e09a3a',pat:'camo'},
premium:{n:'Преміум',shell:'#e8902a',acc:'#ffe27a',pat:'trim'},
cyborg:{n:'Кіборг',shell:'#8a3ab8',acc:'#ff5ac8',pat:'lines'},
cosmos:{n:'Космос',shell:'#1a2a7a',acc:'#6ab0ff',pat:'stars'}};
const ARMS={
base:{n:'Базові'},gloves:{n:'Рукавиці',hand:'#ff7a3a'},tools:{n:'Інструменти',hand:'#9aa6c8',claw:1},
holo:{n:'Голограма',col:'#3be8ff',hand:'#cffaff'},armor:{n:'Броня',col:'#8a93b8',hand:'#5a6590',pad:1},
power:{n:'Енергія',hand:'#ff4fd8',glow:'#ff4fd8'},neon:{n:'Неон',col:'#ff6ae0',hand:'#3be8ff'},gold:{n:'Золото',col:'#ffd45a',hand:'#e0902a'}};
const LEGS={standard:{n:'Стандарт'},boots:{n:'Черевики',foot:'#7a4a22',acc:'#3a1d0e',boot:1},sneakers:{n:'Кросівки',foot:'#f4f6ff',acc:'#ff4fd8',stripe:'#3be8ff'},
armor:{n:'Броня',col:'#8a93b8',pad:'#c3cbea',foot:'#5a6590'},neon:{n:'Неон',glow:'#3be8ff',foot:'#ff4fd8',acc:'#ff9af0'},jet:{n:'Реактивні',foot:'#5a6590',acc:'#ff7a2a',jet:1},
magnet:{n:'Магнітні',foot:'#d93a4a',acc:'#c3cbea'},gold:{n:'Золоті',col:'#ffd45a',foot:'#e0902a',acc:'#fff0a0'}};
const FACES={standard:'Стандарт',happy:'Щасливий',think:'Думка',surprised:'Сюрприз',talk:'Говорить',serious:'Серйозний',sleepy:'Сонний',hearts:'Сердечка'};
const ANTS={standard:'Стандарт',techno:'Техно',holo:'Голограма',gamer:'Геймер',premium:'Преміум',horns:'Роги',crown:'Корона',neon:'Неон'};
const ACCS={backpack:{n:'Рюкзак',slot:'back'},cape:{n:'Плащ',slot:'back'},wings:{n:'Крила',slot:'back'},hood:{n:'Капюшон',slot:'head'},hat:{n:'Шапка',slot:'head'},goggles:{n:'Окуляри',slot:'head'},phones:{n:'Навушники',slot:'head'},
// предмети в руках (малюються в sprite.js → drawHandItem; назви — js/i18n/*.js → skin.acc)
hammer:{n:'Громовий молот',slot:'hand'},blade:{n:'Неоновий клинок',slot:'hand'},gauntlet:{n:'Силова рукавиця',slot:'hand'},excalibur:{n:'Екскалібур',slot:'hand'},
staff:{n:'Кришталевий посох',slot:'hand'},trident:{n:'Морський тризуб',slot:'hand'},wand:{n:'Зоряна паличка',slot:'hand'},balloon:{n:'Кулька',slot:'hand'},
torch:{n:'Факел',slot:'hand'},magnet:{n:'Магніт',slot:'hand'},shield:{n:'Щит',slot:'hand'},sword:{n:'Меч',slot:'hand'}};
const HAND_ITEMS=Object.keys(ACCS).filter(k=>ACCS[k].slot==='hand');
const FX={none:'Без ефекту',sparks:'Іскри',energy:'Енергія',aura:'Аура',trail:'Слід',rain:'Дощ',snow:'Сніг',fire:'Вогонь',water:'Вода',neon:'Неон'};
const MOODS={happy:'Радість',love:'Любов',surprise:'Сюрприз',idea:'Ідея',sleepy:'Сон',sad:'Сум',angry:'Злість',cool:'Круто'};
const ACTIONS={stand:'Стоїть',walk:'Ходить',run:'Біжить',wave:'Привіт',think:'Думає',point:'Вказує',talk:'Розповідає',cheer:'Радіє',spin:'Оберт',stretch:'Потягується',look:'Роззирається',jump:'Стрибає',work:'Працює',sleep:'Сон',dance:'Танцює',read:'Читає',meditate:'Медитує',bye:'Прощається',drink:'П\'є каву',hammer:'Ремонтує'};
const DEFAULT_LOOK={face:'standard',ant:'standard',body:'standard',arms:'base',theme:'standard',back:null,head:null,hand:null,fx:'none'};


/* ============================================================================
 * actors/nexi/skins.js — КАТАЛОГ СКІНІВ NEXI (тільки дані, без логіки)
 * ----------------------------------------------------------------------------
 * Структура бота незмінна (HD-сітка 48×56 пікселів), змінюються лише скіни:
 *   SKINS   – ГОТОВІ СКІНИ (повний образ + рідкість: звичайний / рідкісний / епічний / легендарний) — перша вкладка лабораторії,
 *             планшет і голограма майстерні
 *   THEMES  – кольорові теми (весь корпус; hp — візерунок на голові, cape — колір плаща)   BODIES – тулуб / корпус (pat — візерунок)
 *   ARMS    – руки                              LEGS   – ноги
 *   FACES   – вирази обличчя: їх обирає сам Nexi (емоції, nexi.js moodLife) — у лабораторії їх немає (власник, 29.10)
 *   ANTS    – антени
 *   ACCS    – аксесуари (слоти back / head) і РЕЛІКВІЇ (слот hand — предмети в руці; окрема вкладка, кружляють навколо
 *             голограми в майстерні)                                FX     – ефекти частинок
 *   MOODS   – емоції                            ACTIONS – дії (анімації)
 * Щоб додати скін: додай запис у потрібний словник і, якщо треба, його
 * малювання в actors/nexi/sprite.js. Більше нічого чіпати не треба.
 * ========================================================================== */
const SW=48,SH=56,FOOT=52,OUT='#0a0f2e';   // розмір спрайта; FOOT — рядок, де стоять ноги
const SPRITE_K=0.75;                        // HD-піксель = 0.75 старого: розмір бота в кімнаті не змінився
const hx=h=>[1,3,5].map(i=>parseInt(h.slice(i,i+2),16));
const toHex=a=>'#'+a.map(v=>Math.max(0,Math.min(255,Math.round(v))).toString(16).padStart(2,'0')).join('');
// shade — щокадру сотні разів (renderBot: кожен об'ємний блок — 4 відтінки), тож відтінок рахується раз і береться з кешу
// (веселкова тема дає нові кольори щокадру — кеш чиститься, коли росте понад 4000)
const SHADES=new Map();
const shade=(h,k)=>{const key=h+'|'+k;let v=SHADES.get(key);if(v===undefined){const c=hx(h);v=toHex(k>=0?c.map(v=>v+(255-v)*k):c.map(v=>v*(1+k)));if(SHADES.size>4000)SHADES.clear();SHADES.set(key,v);}return v};
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
shadow:{n:'Тінь',shell:'#4a5070',acc:'#8a8aff',jnt:'#1a1d33',eye:'#b0a8ff',cape:'#2a2440'},
rainbow:{n:'Райдуга',shell:'#ffb0e0',acc:'#7a8aff',jnt:'#5a3a8a',eye:'#ffffff',rb:true},
military:{n:'Військовий',shell:'#8a8f78',acc:'#c8b45a',jnt:'#3a3d2e',eye:'#9affb0'},
premium:{n:'Преміум',shell:'#f2e0b0',acc:'#d9a02a',jnt:'#6a4a2a',eye:'#ffe27a'},
// нові (29.10, «скіни привабливіші»): hp — візерунок на голові (sprite.js → headPat)
samurai:{n:'Самурай',shell:'#c22e44',acc:'#ffc94d',jnt:'#3a0f18',eye:'#ff9a4a'},
astro:{n:'Астронавт',shell:'#f4f6fc',acc:'#ff8a2a',jnt:'#56608e',eye:'#ffd27a'},
candy:{n:'Цукерка',shell:'#ffc8ea',acc:'#4ee0c0',jnt:'#a86aa8',eye:'#ff5ad8',hp:'stripes'},
pumpkin:{n:'Гарбуз',shell:'#ff8f2e',acc:'#3f8a2a',jnt:'#5a2a0a',eye:'#ffe27a',hp:'ribs',cape:'#5a2a8a'},
cyber:{n:'Кібер',shell:'#323a4c',acc:'#3bff8a',jnt:'#0e1218',eye:'#3bff8a',hp:'circuit'},
royal:{n:'Королівський',shell:'#7a46d0',acc:'#ffd45a',jnt:'#2a1050',eye:'#ffe9a0',hp:'trim',cape:'#c0283c'},
frost:{n:'Іній',shell:'#d6f2ff',acc:'#5ab8ff',jnt:'#4a7ab0',eye:'#e8fcff',hp:'facets'},
lava:{n:'Лава',shell:'#4a2a2c',acc:'#ff6a1a',jnt:'#1a0808',eye:'#ffb03a',hp:'cracks'}};
const BODIES={
standard:{n:'Стандарт'},
techno:{n:'Техно',shell:'#6ab8d0',acc:'#ff4fd8',pat:'lines'},
energy:{n:'Енергія',shell:'#2a46b0',acc:'#ff4fd8',pat:'core'},
holo:{n:'Голограма',shell:'#4ad0ff',acc:'#cffaff',pat:'holo'},
camo:{n:'Камуфляж',shell:'#6a6a3a',acc:'#e09a3a',pat:'camo'},
premium:{n:'Преміум',shell:'#e8902a',acc:'#ffe27a',pat:'trim'},
cyborg:{n:'Кіборг',shell:'#8a3ab8',acc:'#ff5ac8',pat:'lines'},
cosmos:{n:'Космос',shell:'#1a2a7a',acc:'#6ab0ff',pat:'stars'},
armor:{n:'Обладунок',pat:'armor'},suit:{n:'Скафандр',pat:'suit'},crystal:{n:'Кристал',pat:'crystal'},candy:{n:'Смужки',pat:'candy'},
pumpkin:{n:'Гарбуз',pat:'pumpkin'},circuit:{n:'Схема',pat:'circuit'},royal:{n:'Мантія',pat:'royal'},lava:{n:'Лава',shell:'#3a2022',acc:'#ff6a1a',pat:'lava'}};
const ARMS={
base:{n:'Базові'},gloves:{n:'Рукавиці',hand:'#ff7a3a'},tools:{n:'Інструменти',hand:'#9aa6c8',claw:1},
holo:{n:'Голограма',col:'#3be8ff',hand:'#cffaff'},armor:{n:'Броня',col:'#8a93b8',hand:'#5a6590',pad:1},
power:{n:'Енергія',hand:'#ff4fd8',glow:'#ff4fd8'},neon:{n:'Неон',col:'#ff6ae0',hand:'#3be8ff'},gold:{n:'Золото',col:'#ffd45a',hand:'#e0902a'}};
const LEGS={standard:{n:'Стандарт'},boots:{n:'Черевики',foot:'#7a4a22',acc:'#3a1d0e',boot:1},sneakers:{n:'Кросівки',foot:'#f4f6ff',acc:'#ff4fd8',stripe:'#3be8ff'},
armor:{n:'Броня',col:'#8a93b8',pad:'#c3cbea',foot:'#5a6590'},neon:{n:'Неон',glow:'#3be8ff',foot:'#ff4fd8',acc:'#ff9af0'},jet:{n:'Реактивні',foot:'#5a6590',acc:'#ff7a2a',jet:1},
magnet:{n:'Магнітні',foot:'#d93a4a',acc:'#c3cbea'},gold:{n:'Золоті',col:'#ffd45a',foot:'#e0902a',acc:'#fff0a0'}};
const FACES={standard:'Стандарт',happy:'Щасливий',think:'Думка',surprised:'Сюрприз',talk:'Говорить',serious:'Серйозний',sleepy:'Сонний',hearts:'Сердечка'};
const ANTS={standard:'Стандарт',techno:'Техно',holo:'Голограма',gamer:'Геймер',premium:'Преміум',horns:'Роги',crown:'Корона',neon:'Неон',halo:'Німб',flame:'Полум\'я',stem:'Хвостик'};
const ACCS={backpack:{n:'Рюкзак',slot:'back'},cape:{n:'Плащ',slot:'back'},wings:{n:'Крила',slot:'back'},scarf:{n:'Шарф',slot:'back'},
hood:{n:'Капюшон',slot:'head'},hat:{n:'Шапка',slot:'head'},goggles:{n:'Окуляри',slot:'head'},phones:{n:'Навушники',slot:'head'},
kabuto:{n:'Шолом самурая',slot:'head',noAnt:1},helmet:{n:'Шолом астронавта',slot:'head',noAnt:1},tricorn:{n:'Капітанка',slot:'head',noAnt:1},bandana:{n:'Пов\'язка',slot:'head'},flowers:{n:'Вінок',slot:'head'},
// РЕЛІКВІЇ — предмети в руках (малюються в sprite.js → drawHandItem; назви — js/i18n/*.js → skin.acc)
hammer:{n:'Громовий молот',slot:'hand'},blade:{n:'Лазерний меч',slot:'hand'},gauntlet:{n:'Золота рукавиця',slot:'hand'},excalibur:{n:'Екскалібур',slot:'hand'},
staff:{n:'Кришталевий посох',slot:'hand'},trident:{n:'Морський тризуб',slot:'hand'},wand:{n:'Зоряна паличка',slot:'hand'},balloon:{n:'Кулька',slot:'hand'},
torch:{n:'Факел',slot:'hand'},magnet:{n:'Магніт',slot:'hand'},shield:{n:'Щит Nexi',slot:'hand'},sword:{n:'Меч',slot:'hand'}};
const HAND_ITEMS=Object.keys(ACCS).filter(k=>ACCS[k].slot==='hand');            // реліквії
const WEAR_ACCS=Object.keys(ACCS).filter(k=>ACCS[k].slot!=='hand');              // аксесуари (спина, голова)
const ACC_ITEMS=Object.fromEntries(WEAR_ACCS.map(k=>[k,ACCS[k]])), RELICS=Object.fromEntries(HAND_ITEMS.map(k=>[k,ACCS[k]]));
// ГОТОВІ СКІНИ — повний образ і рідкість (власник, 29.10: «скіни привабливіші, додай нові»): лабораторія (перша вкладка),
// планшет СКІНИ й голограма в майстерні. Реліквію й ефект скін не чіпає.
const RARITY={common:'#9ab4d8',rare:'#3b9cff',epic:'#c86aff',legendary:'#ffc94d'};
const SKINS={
classic:{rar:'common',look:{theme:'standard'}},
neon:{rar:'common',look:{theme:'neon',ant:'neon',legs:'neon'}},
forest:{rar:'common',look:{theme:'forest',back:'backpack',legs:'boots'}},
winter:{rar:'common',look:{theme:'winter',head:'hat',legs:'boots'}},
gamer:{rar:'rare',look:{theme:'gamer',ant:'gamer',head:'phones',legs:'sneakers'}},
techno:{rar:'rare',look:{theme:'techno',body:'techno',ant:'techno',head:'goggles'}},
candy:{rar:'rare',look:{theme:'candy',body:'candy',head:'flowers',legs:'sneakers'}},
astro:{rar:'rare',look:{theme:'astro',body:'suit',head:'helmet',back:'backpack',legs:'boots'}},
captain:{rar:'rare',look:{theme:'shadow',body:'royal',head:'tricorn',back:'cape',legs:'boots'}},
samurai:{rar:'epic',look:{theme:'samurai',body:'armor',head:'kabuto',arms:'armor',legs:'armor'}},
cyber:{rar:'epic',look:{theme:'cyber',body:'circuit',head:'bandana',back:'scarf',arms:'neon',legs:'neon'}},
pumpkin:{rar:'epic',look:{theme:'pumpkin',body:'pumpkin',ant:'stem',back:'cape'}},
frost:{rar:'epic',look:{theme:'frost',body:'crystal',ant:'holo',back:'wings',arms:'holo'}},
royal:{rar:'legendary',look:{theme:'royal',body:'royal',ant:'crown',back:'cape',arms:'gold',legs:'gold'}},
lava:{rar:'legendary',look:{theme:'lava',body:'lava',ant:'flame',arms:'power'}},
cosmos:{rar:'legendary',look:{theme:'space',body:'cosmos',ant:'halo',back:'wings',arms:'holo'}},
rainbow:{rar:'legendary',look:{theme:'rainbow',body:'holo',ant:'neon',back:'wings',legs:'sneakers'}}};
/** Повний образ скіна (усі частини: чого скін не задає — стандартне; реліквію й ефект бере з base). */
const skinLook=(id,base)=>Object.assign({},DEFAULT_LOOK,{hand:base?base.hand:null,fx:base?base.fx:'none'},SKINS[id].look,{face:'standard'});
/** Який готовий скін зараз на Nexi (або null). */
const skinOf=L=>Object.keys(SKINS).find(id=>{const s=skinLook(id);return['theme','body','arms','legs','ant','head','back'].every(k=>(s[k]??DEFAULT_LOOK[k])===(L[k]??DEFAULT_LOOK[k]));})||null;
const FX={none:'Без ефекту',sparks:'Іскри',energy:'Енергія',aura:'Аура',trail:'Слід',rain:'Дощ',snow:'Сніг',fire:'Вогонь',water:'Вода',neon:'Неон'};
const MOODS={happy:'Радість',love:'Любов',surprise:'Сюрприз',idea:'Ідея',sleepy:'Сон',sad:'Сум',angry:'Злість',cool:'Круто'};
const ACTIONS={stand:'Стоїть',walk:'Ходить',run:'Біжить',wave:'Привіт',think:'Думає',point:'Вказує',talk:'Розповідає',cheer:'Радіє',spin:'Оберт',stretch:'Потягується',look:'Роззирається',jump:'Стрибає',work:'Працює',sleep:'Сон',dance:'Танцює',read:'Читає',meditate:'Медитує',bye:'Прощається',drink:'П\'є каву',hammer:'Ремонтує'};
const DEFAULT_LOOK={face:'standard',ant:'standard',body:'standard',arms:'base',legs:'standard',theme:'standard',back:null,head:null,hand:null,fx:'none'};


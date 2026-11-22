/* ============================================================================
 * actors/nexi/poses.js — ПОЗИ ТА АНІМАЦІЇ NEXI
 * ----------------------------------------------------------------------------
 * poseFor(name, t, moving) повертає позу кадру: зсуви голови/тіла, куди
 * дивляться руки (вектор від плеча), підйом ніг, обличчя, предмет у руці.
 * Рухи однакові для всіх скінів, тому скін ніколи не ламає анімацію.
 * ========================================================================== */
function poseFor(a,t,moving){
 const p={bob:0,hx:0,hy:0,ll:{dx:0,lift:0},rl:{dx:0,lift:0},la:{x:-2,y:7},ra:{x:2,y:7},blink:(t%4)<.12,moving};
 const s=Math.sin;
 switch(a){
 case'walk':case'run':{const sp=a==='run'?14:8,ph=Math.floor(t*sp)%4;
  p.ll={dx:ph===1?1:ph===3?-1:0,lift:ph===1?2:0};p.rl={dx:ph===3?1:ph===1?-1:0,lift:ph===3?2:0};
  p.bob=ph%2?-1:0;p.hy=ph%2?0:1;const sw=ph<2?1:-1;p.la={x:-2-sw*2,y:6+(sw>0?-2:0)};p.ra={x:2+sw*2,y:6+(sw<0?-2:0)};
  if(a==='run'){p.la={x:-4,y:5-(ph%2)};p.ra={x:4,y:5-((ph+1)%2)};p.hx=1}break}
 case'hammer':{const up=Math.sin(t*7.85398)>0;p.ra=up?{x:2,y:-7}:{x:6,y:2};p.la={x:-3,y:5};p.tool='hammer';p.bob=up?0:1;break}
 case'drink':{const k=Math.floor(t/2)%2;p.ra=k?{x:-3,y:-3}:{x:3,y:4};p.tool='cup';if(k)p.face='happy';break}
 case'reach':{p.ra={x:4+Math.round(Math.sin(t*1.5708)),y:-8+Math.round(Math.cos(t*3.14159))};p.tool='cable';p.hx=1;break}
 case'shout':{p.ra={x:5,y:-3};p.tool='mega';p.talk=1;p.la={x:-4,y:2+Math.round(Math.sin(t*6.28319)*2)};break}
 case'type':{const k=Math.floor(t*9)%2;p.la={x:-3,y:3+k};p.ra={x:3,y:4-k};p.hy=1;break}
 case'watch':p.back=1;p.sit=1;p.bob=3;p.la={x:-3,y:3};p.ra={x:3,y:3+(Math.floor(t/2.2)%3===0?-6:0)};p.hy=Math.round(Math.sin(t*.7));break;
 case'sitPet':{const k=Math.sin(t*6)>0;p.sit=1;p.bob=3;p.ra={x:6,y:k?2:1};p.la={x:-3,y:4};p.face='happy';break}
 case'sitTablet':p.sit=1;p.bob=3;p.la={x:1,y:3};p.ra={x:-1,y:3};p.tool='tablet';p.hy=1;if(Math.floor(t/2.5)%3===1)p.face='think';break;
 case'sitWork':{const k=Math.floor(t*9)%2;p.sit=1;p.bob=3;p.la={x:-5,y:1+k};p.ra={x:-3,y:2-k};p.hx=-1;if(Math.floor(t/3)%3===2){p.face='think';p.la={x:-3,y:5};p.ra={x:3,y:-6}}break}
 case'sitType':{const k=Math.floor(t*9)%2;p.back=1;p.work=1;p.sit=1;p.bob=3;p.la={x:-2,y:-2+k};p.ra={x:2,y:-1-k};break}
 case'sit':p.sit=1;p.bob=3;p.la={x:-3,y:4};p.ra={x:3,y:4};p.ll={dx:-1,lift:0};p.rl={dx:1,lift:0};break;
 case'sitCheer':{const j=Math.abs(s(t*6.28319));p.sit=1;p.bob=3-Math.round(j);p.la={x:-4,y:-5};p.ra={x:4,y:-5};p.face='happy';break}   // сидячи радіє (крісло маркетингу)
 case'sitRead':p.sit=1;p.bob=3;p.la={x:3,y:2};p.ra={x:-1,y:2};p.hy=1;p.book=1;break;
 case'fly':p.jet=1;p.ll={dx:0,lift:1};p.rl={dx:0,lift:1};p.la={x:-4,y:5};p.ra={x:4,y:5};p.bob=Math.round(Math.sin(t*8));break;
 case'hoverFix':{const up=Math.sin(t*8)>0;p.jet=1;p.ra=up?{x:3,y:-6}:{x:6,y:-1};p.la={x:-4,y:3};p.tool='hammer';p.bob=Math.round(Math.sin(t*5));p.back=1;break}
 case'pet':{const k=Math.sin(t*6)>0;p.ra={x:4,y:k?8:7};p.la={x:-3,y:6};p.hy=1;p.face='happy';break}
 case'pour':p.ra={x:5,y:3};p.la={x:-3,y:5};p.tool='cup';p.hy=1;break;
 case'press':{const k=Math.floor(t*4)%2;p.ra={x:5,y:k?0:2};p.la={x:-3,y:6};break}
 case'scan':p.la={x:-5,y:-4};p.ra={x:5,y:-4};p.bob=Math.sin(t*4)>0?-1:0;p.face='surprised';break;
 case'hop':p.ll={dx:0,lift:2};p.rl={dx:0,lift:2};p.la={x:-4,y:-1};p.ra={x:4,y:-1};break;
 case'slide':p.bob=1;p.hx=1;p.la={x:-7,y:1};p.ra={x:6,y:3};p.ll={dx:-2,lift:0};p.rl={dx:2,lift:0};p.face='happy';break;   // (13.11) на дошці: низька стійка, руки врозліт
 case'roll':p.bob=2;p.hy=1;p.la={x:-2,y:3};p.ra={x:2,y:3};p.ll={dx:0,lift:2};p.rl={dx:0,lift:2};p.face='happy';break;           // (13.11) колесо: згрупувався
 case'crouch':p.bob=2;p.la={x:-3,y:5};p.ra={x:3,y:5};p.ll={dx:-1,lift:0};p.rl={dx:1,lift:0};break;
 case'spin':p.la={x:-5,y:-3};p.ra={x:5,y:-3};p.face='happy';p.bob=-1;break;
 case'stretch':{const k=Math.sin(t*2)>0;p.la={x:-3,y:k?-9:-7};p.ra={x:3,y:k?-9:-7};p.bob=k?-1:0;p.face='sleepy';break}
 case'look':p.look=Math.round(Math.sin(t*1.3)*1.4);p.hx=Math.round(Math.sin(t*1.3));p.ra={x:3,y:6};break;
 case'jump':p.ll={dx:-1,lift:2};p.rl={dx:1,lift:2};p.la={x:-5,y:-5};p.ra={x:5,y:-5};p.face='happy';break;
 case'gaze':p.back=1;p.la={x:1,y:6};p.ra={x:-1,y:6};p.hy=Math.round(Math.sin(t*.8));break;
case'sitGaze':p.sit=1;p.back=1;p.bob=3;p.la={x:1,y:5};p.ra={x:-1,y:5};p.ll={dx:-1,lift:0};p.rl={dx:1,lift:0};p.hy=Math.round(Math.sin(t*.8));break;   // (Декор стін · 42) сидить на канті жардиньєра спиною, дивиться на місто
 case'water':p.ra={x:6,y:1+Math.round(Math.sin(t*4))};p.la={x:-3,y:6};p.tool='can';p.hy=1;break;
 // (Декор стін · 6) на ранці біля стіни: поливає з лійки, сипле корм, тисне кнопку годівнички, роздивляється
 case'hoverWater':p.jet=1;p.ll={dx:0,lift:1};p.rl={dx:0,lift:1};p.ra={x:6,y:2+Math.round(Math.sin(t*4))};p.la={x:-4,y:4};p.tool='can';p.hy=1;p.bob=Math.round(Math.sin(t*5));break;
 case'hoverPour':{const k=Math.floor(t*5)%2;p.jet=1;p.ll={dx:0,lift:1};p.rl={dx:0,lift:1};p.ra={x:6,y:k?1:3};p.la={x:-4,y:4};p.tool='cup';p.hy=1;p.bob=Math.round(Math.sin(t*5));break}
 case'hoverPress':{const k=Math.floor(t*4)%2;p.jet=1;p.ll={dx:0,lift:1};p.rl={dx:0,lift:1};p.ra={x:6,y:k?-1:1};p.la={x:-4,y:4};p.bob=Math.round(Math.sin(t*5));break}
 case'hoverLook':p.jet=1;p.ll={dx:0,lift:1};p.rl={dx:0,lift:1};p.la={x:-4,y:5};p.ra={x:4,y:5};p.look=Math.round(Math.sin(t*1.3)*1.4);p.hx=Math.round(Math.sin(t*1.3));p.bob=Math.round(Math.sin(t*5));p.face='happy';break;
 // (Декор стін · 7) на ранці перед другим поверхом: кличе дрона-поливальника — махає лійкою
 case'hoverBasket':{p.jet=1;p.ll={dx:0,lift:1};p.rl={dx:0,lift:1};p.ra={x:6,y:1+Math.round(Math.sin(t*4))};p.la={x:-4,y:4};p.tool='basket';p.full=!!(NX.nexi&&NX.nexi.basket);p.look=1;p.bob=Math.round(Math.sin(t*5));break}   // (Декор стін · 30) тримає кошик під різаком теплиці
case'hoverScan':{const k=Math.floor(t*6)%2;p.jet=1;p.ll={dx:0,lift:1};p.rl={dx:0,lift:1};p.ra={x:7,y:-2+(k?1:0)};p.la={x:-4,y:4};p.tool='scanner';p.look=1;p.bob=Math.round(Math.sin(t*5));break}   // (Декор стін · 19) сканує рослину ручним сканером
case'hoverCall':p.jet=1;p.ll={dx:0,lift:1};p.rl={dx:0,lift:1};p.ra={x:5,y:-3+Math.round(Math.sin(t*9.42478)*2)};p.la={x:-4,y:4};p.tool='can';p.face='happy';p.bob=Math.round(Math.sin(t*5));break;
 case'toss':{const k=(t%1.2)<.5;p.ra=k?{x:3,y:-8}:{x:7,y:0};p.tool=k?'coin':null;p.face='happy';break}
 case'push':{const k=Math.floor(t*5)%2;p.back=1;p.work=1;p.ra={x:3,y:k?-2:0};p.la={x:-3,y:k?0:-2};break}
 case'carry':p.la={x:-2,y:3};p.ra={x:2,y:3};p.tool='tablet';break;
 case'wave':p.ra={x:4,y:-4+Math.round(s(t*9.42478)*2)};p.hy=0;p.bob=Math.sin(t*4.71239)>0?0:-1;break;
 case'bye':p.ra={x:5,y:-3+Math.round(s(t*12.56637)*2)};p.la={x:-3,y:6};break;
 case'think':p.ra={x:-4,y:-5};p.hx=-1;p.face='think';p.bob=0;break;
 case'point':p.ra={x:6,y:-1};p.hx=1;break;
 // ЗДІБНОСТІ РЕЛІКВІЙ (actors/nexi/relics.js): підняти вгору, розчерки, випад уперед, захист щитом
 case'relic':{const R=NX.objects.relics&&NX.objects.relics.cur();if(R)return relicPose(R.id,R.k,t);break}   // (23.11) своя постановка кожної реліквії — relicPose нижче
 case'raise':{p.ra={x:3,y:-12};p.la={x:-3,y:5};p.bob=-1;p.hy=-1;p.face='serious';break}
 case'swing':{const k=Math.sin(t*12)>0;p.ra=k?{x:8,y:-7}:{x:9,y:3};p.la={x:-4,y:4};p.hx=1;p.bob=k?-1:0;p.face='serious';break}
 case'present':{const k=Math.sin(t*5)>0;p.ra={x:k?10:8,y:0};p.la={x:-4,y:5};p.hx=1;p.bob=k?0:1;break}
 case'guard':p.la={x:-9,y:0};p.ra={x:3,y:5};p.bob=1;p.ll={dx:-1,lift:0};p.rl={dx:2,lift:0};p.face='serious';break;
 case'talk':p.talk=1;p.la={x:-5,y:2+Math.round(s(t*6.28319)*2)};p.ra={x:5,y:2+Math.round(s(t*6.28319+2)*2)};p.bob=Math.sin(t*6.28319)>.5?-1:0;break;
 case'cheer':{const j=Math.abs(s(t*6.28319));p.bob=-Math.round(j*3);p.la={x:-4,y:-5};p.ra={x:4,y:-5};p.ll.lift=0;p.face='happy';break}
 case'work':{const k=Math.floor(t*9)%2;p.la={x:-2,y:2+k*2};p.ra={x:2,y:4-k*2};p.hy=1;p.bob=0;break}
 case'sleep':p.bob=1;p.hy=2;p.hx=1;p.blink=false;p.face='sleepy';p.la={x:-2,y:6};p.ra={x:2,y:6};break;
 case'dance':{const k=Math.floor(t*6)%4;p.bob=k%2?-1:0;p.la={x:k<2?-5:-3,y:k<2?-4:3};p.ra={x:k<2?3:5,y:k<2?3:-4};p.ll={dx:k<2?-1:0,lift:k%2?2:0};p.rl={dx:k<2?0:1,lift:k%2?0:2};p.hx=k<2?-1:1;p.face='happy';break}
 case'read':p.la={x:3,y:3};p.ra={x:-1,y:3};p.hy=1;p.book=1;break;
 case'meditate':p.bob=Math.round(s(t*1.5708)*1);p.la={x:3,y:5};p.ra={x:-3,y:5};p.ll={dx:2,lift:2};p.rl={dx:-2,lift:2};p.blink=true;break;
 default:p.bob=Math.sin(t*1.5708)>.4?-1:0;}
 return p;
}

/* ---------- ПОСТАНОВКА ЗДІБНОСТЕЙ РЕЛІКВІЙ (23.11; власник: «пропрацювати краще реліквії та взаємодії з ними») ----------
 * Раніше на 12 реліквій було 5 спільних поз, а піднятий предмет обрізався краєм спрайта (48×56). Тепер у кожної реліквії
 * своя постановка за фазою здібності k = 0..1: ключові кадри [k, рука x, рука y, кут предмета°, присід, голова x, ліва x, ліва y].
 * Кут 0 — предмет вістрям угору, додатний — нахил УПЕРЕД (у бік погляду). Поки триває здібність, предмет малює не спрайт
 * (pose.noItem), а шар relics.js поверх Nexi — цілим, з обертанням (pose.item: кут у радіанах і рука 'r' / 'l').
 * Рукавиця й кулька лишаються в спрайті (вони не виходять за його край). */
const RELIC_KEYS={
 hammer:[[0,3,5,0,0,0],[.2,0,-10,-38,-1,-1],[.46,0,-11,-44,-1,-1],[.54,8,4,108,2,1],[.86,8,4,108,2,1],[1,3,5,0,0,0]],            // замах за плече -> удар об підлогу
 blade:[[0,3,5,0,0,0],[.14,7,-2,0,0,1],[.5,7,-3,400,-1,1],[.82,7,-2,720,0,1],[1,3,5,720,0,0]],                                    // два повні оберти леза
 sword:[[0,3,5,0,0,0],[.16,1,-7,0,-1,0],[.42,1,-7,0,-1,0],[.52,5,-5,180,2,0],[.88,5,-5,180,2,0],[1,3,5,0,0,0]],               // салют -> клинок у підлогу, на коліно
 katana:[[0,3,5,0,0,0],[.14,-4,4,-112,2,-1],[.44,-4,4,-112,2,-1],[.48,10,-6,62,1,1],[.74,10,-6,62,1,1],[.92,4,2,0,0,0],[1,3,5,0,0,0]],   // іай: стійка з клинком біля стегна -> миттєвий розчерк
 excalibur:[[0,3,5,0,0,0],[.22,1,-12,0,-1,0,-1,-12],[.86,1,-12,0,-1,0,-1,-12],[1,3,5,0,0,0]],                                    // двома руками над головою
 staff:[[0,5,2,0,0,0],[.2,6,-4,0,-1,0],[.3,6,2,0,1,0],[.86,6,1,0,1,0],[1,5,2,0,0,0]],                                           // підняв і вдарив п'ятою посоха об підлогу
 trident:[[0,3,5,0,0,0],[.22,-2,0,78,0,-1],[.36,-2,0,84,1,-1],[.42,11,0,90,1,1],[.78,11,0,90,1,1],[1,3,5,0,0,0]],               // відвів назад -> випад
 wand:[[0,3,5,0,0,0],[.15,6,-5,20,0,1],[.85,6,-5,20,0,1],[1,3,5,0,0,0]],                                                        // кінчик малює коло (додається в relicPose)
 torch:[[0,3,5,0,0,0],[.2,3,-10,0,-1,0],[.85,3,-10,0,-1,0],[1,3,5,0,0,0]],                                                      // підняв і поводить з боку в бік
 magnet:[[0,3,5,0,0,0],[.2,9,0,90,0,1],[.85,9,0,90,0,1],[1,3,5,0,0,0]],                                                         // полюсами вперед
 shield:[[0,-2,7,0,0,0],[.14,-8,0,0,1,0],[.86,-8,0,0,1,0],[1,-2,7,0,0,0]]};                                                     // щит — ліва рука (x, y тут — лівої)
function relicPose(id,k,t){
 const K=RELIC_KEYS[id];
 if(!K){const p=poseFor(id==='balloon'?'hop':'raise',t,false);return p}                                                          // рукавиця, кулька — як було
 k=Math.max(0,Math.min(1,k));let i=1;while(i<K.length-1&&K[i][0]<k)i++;
 const A=K[i-1],B=K[i],f=(k-A[0])/Math.max(1e-6,B[0]-A[0]),e=f*f*(3-2*f),L=n=>(A[n]??(n===6?-3:5))+((B[n]??(n===6?-3:5))-(A[n]??(n===6?-3:5)))*e;
 const p={bob:Math.round(L(4)),hx:Math.round(L(5)),hy:0,ll:{dx:0,lift:0},rl:{dx:0,lift:0},la:{x:-3,y:5},ra:{x:2,y:7},blink:false,moving:false,noItem:1,face:'serious'};
 let ang=L(3);
 if(id==='shield'){p.la={x:Math.round(L(1)),y:Math.round(L(2))};p.ra={x:3,y:5};p.ll={dx:-1,lift:0};p.rl={dx:2,lift:0};p.item={ang:0,hand:'l'};return p}
 p.ra={x:Math.round(L(1)),y:Math.round(L(2))};p.la={x:Math.round(L(6)),y:Math.round(L(7))};
 if(id==='wand'&&k>.15&&k<.85){const a=(k-.15)/.7*Math.PI*4;p.ra={x:Math.round(6+Math.cos(a)*3),y:Math.round(-5+Math.sin(a)*3)};ang=20+Math.sin(a)*24;p.face='happy'}
 if(id==='torch'&&k>.2&&k<.85)ang=Math.sin((k-.2)/.65*Math.PI*4)*14;
 if(id==='blade')p.face='happy';
 if((id==='sword'||id==='katana'||id==='hammer')&&p.bob>=2){p.ll={dx:-2,lift:0};p.rl={dx:2,lift:0}}                              // широка стійка
 if(id==='excalibur'&&k>.3&&k<.86)p.hy=-1;
 p.item={ang:ang*Math.PI/180,hand:'r'};return p}

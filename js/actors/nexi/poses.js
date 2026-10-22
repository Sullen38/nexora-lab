/* ============================================================================
 * actors/nexi/poses.js — ПОЗИ ТА АНІМАЦІЇ NEXI
 * ----------------------------------------------------------------------------
 * poseFor(name, t, moving) повертає позу кадру: зсуви голови/тіла, куди
 * дивляться руки (вектор від плеча), підйом ніг, обличчя, предмет у руці.
 * Рухи однакові для всіх скінів, тому скін ніколи не ламає анімацію.
 * ========================================================================== */
const REST={la:{x:-2,y:7},ra:{x:2,y:7}};
function poseFor(a,t,moving){
 const p={bob:0,hx:0,hy:0,ll:{dx:0,lift:0},rl:{dx:0,lift:0},la:{x:-2,y:7},ra:{x:2,y:7},blink:(t%4)<.12,moving};
 const s=Math.sin;
 switch(a){
 case'walk':case'run':{const sp=a==='run'?14:8,ph=Math.floor(t*sp)%4;
  p.ll={dx:ph===1?1:ph===3?-1:0,lift:ph===1?2:0};p.rl={dx:ph===3?1:ph===1?-1:0,lift:ph===3?2:0};
  p.bob=ph%2?-1:0;const sw=ph<2?1:-1;p.la={x:-2-sw,y:7+(sw>0?-1:0)};p.ra={x:2+sw,y:7+(sw<0?-1:0)};
  if(a==='run'){p.la={x:-4,y:5-(ph%2)};p.ra={x:4,y:5-((ph+1)%2)};p.hx=1}break}
 case'hammer':{const up=Math.sin(t*7.85398)>0;p.ra=up?{x:2,y:-7}:{x:6,y:2};p.la={x:-3,y:5};p.tool='hammer';p.bob=up?0:1;break}
 case'drink':{const k=Math.floor(t/2)%2;p.ra=k?{x:-3,y:-3}:{x:3,y:4};p.tool='cup';if(k)p.face='happy';break}
 case'reach':{p.ra={x:4+Math.round(Math.sin(t*1.5708)),y:-8+Math.round(Math.cos(t*3.14159))};p.tool='cable';p.hx=1;break}
 case'shout':{p.ra={x:5,y:-3};p.tool='mega';p.talk=1;p.la={x:-4,y:2+Math.round(Math.sin(t*6.28319)*2)};break}
 case'type':{const k=Math.floor(t*9)%2;p.la={x:-3,y:3+k};p.ra={x:3,y:4-k};p.hy=1;break}
 case'sitType':{const k=Math.floor(t*9)%2;p.back=1;p.sit=1;p.bob=3;p.la={x:-2,y:-2+k};p.ra={x:2,y:-1-k};break}
 case'sit':p.sit=1;p.bob=3;p.la={x:-3,y:4};p.ra={x:3,y:4};p.ll={dx:-1,lift:0};p.rl={dx:1,lift:0};break;
 case'sitRead':p.sit=1;p.bob=3;p.la={x:3,y:2};p.ra={x:-1,y:2};p.hy=1;p.book=1;break;
 case'fly':p.jet=1;p.ll={dx:0,lift:1};p.rl={dx:0,lift:1};p.la={x:-4,y:5};p.ra={x:4,y:5};p.bob=Math.round(Math.sin(t*8));break;
 case'hoverFix':{const up=Math.sin(t*8)>0;p.jet=1;p.ra=up?{x:3,y:-6}:{x:6,y:-1};p.la={x:-4,y:3};p.tool='hammer';p.bob=Math.round(Math.sin(t*5));p.back=1;break}
 case'pet':{const k=Math.sin(t*6)>0;p.ra={x:4,y:k?8:7};p.la={x:-3,y:6};p.hy=1;p.face='happy';break}
 case'pour':p.ra={x:5,y:3};p.la={x:-3,y:5};p.tool='cup';p.hy=1;break;
 case'press':{const k=Math.floor(t*4)%2;p.ra={x:5,y:k?0:2};p.la={x:-3,y:6};break}
 case'scan':p.la={x:-5,y:-4};p.ra={x:5,y:-4};p.bob=Math.sin(t*4)>0?-1:0;p.face='surprised';break;
 case'hop':p.ll={dx:0,lift:2};p.rl={dx:0,lift:2};p.la={x:-4,y:-1};p.ra={x:4,y:-1};break;
 case'wave':p.ra={x:4,y:-4+Math.round(s(t*9.42478)*2)};p.hy=0;p.bob=Math.sin(t*4.71239)>0?0:-1;break;
 case'bye':p.ra={x:5,y:-3+Math.round(s(t*12.56637)*2)};p.la={x:-3,y:6};break;
 case'think':p.ra={x:-4,y:-5};p.hx=-1;p.face='think';p.bob=0;break;
 case'point':p.ra={x:6,y:-1};p.hx=1;break;
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

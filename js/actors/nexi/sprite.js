/* ============================================================================
 * actors/nexi/sprite.js — МАЛЮВАННЯ NEXI ПО ПІКСЕЛЯХ
 * ----------------------------------------------------------------------------
 * renderBot(look, pose, t, canvas) малює бота в маленький canvas 36×40:
 *   ранець(jet) -> аксесуари на спині -> ноги -> тулуб -> руки -> голова
 *   -> обличчя (або потилиця, якщо pose.back) -> антена -> аксесуари голови
 *   -> предмет у руці -> автоматичний темний контур.
 * look — обраний скін (skins.js), pose — поза кадру (poses.js).
 * Потім actors/nexi/nexi.js масштабує цей canvas у кімнату.
 * ========================================================================== */
function renderBot(look,pose,t,scratch){
 const c=scratch||document.createElement('canvas');c.width=SW;c.height=SH;
 const x=c.getContext('2d',{willReadFrequently:true});x.clearRect(0,0,SW,SH);
 const th=THEMES[look.theme]||THEMES.standard,bd=BODIES[look.body]||BODIES.standard,am=ARMS[look.arms]||ARMS.base;
 let shell=th.shell,acc=th.acc,eye=th.eye;
 if(th.rb){const h=(t*90)%360;shell=`hsl(${h} 90% 80%)`}
 const bShell=bd.shell||shell,bAcc=bd.acc||acc,jnt=th.jnt,limb=am.col||shell;
 const P=(px,py,w,h,col)=>{x.fillStyle=col;x.fillRect(px,py,w,h)};
 const box=(px,py,w,h,col,cut)=>{ // shaded block, optional clipped corners
  P(px,py,w,h,col);P(px,py,w,1,shade(col,.35));P(px,py+h-1,w,1,shade(col,-.3));P(px+w-1,py,1,h,shade(col,-.15));P(px,py,1,h,shade(col,.15));
  if(cut){x.clearRect(px,py,1,1);x.clearRect(px+w-1,py,1,1);x.clearRect(px,py+h-1,1,1);x.clearRect(px+w-1,py+h-1,1,1)}};
 const line=(x0,y0,x1,y1,col,th2=2)=>{const n=Math.max(Math.abs(x1-x0),Math.abs(y1-y0),1);for(let i=0;i<=n;i++){P(Math.round(x0+(x1-x0)*i/n),Math.round(y0+(y1-y0)*i/n),th2,th2,col)}};
 const b=pose.bob|0,hxo=pose.hx|0,hyo=pose.hy|0,gy=36;
 // --- back accessories
 const fl=Math.sin(t*7.85398);
 if(look.back==='backpack'){box(9,21+b,18,8,'#c9812e');P(13,25+b,10,3,'#8a5a1e');P(10,21+b,1,8,'#5a3a14');P(25,21+b,1,8,'#5a3a14')}
 if(look.back==='cape'){const w=Math.round(fl*1.5)+(pose.moving?3:0);for(let i=0;i<14;i++){P(11-w*i/14|0,21+i+b,14+((w*i/14)|0),1,i%4<2?'#d93a4a':'#a82a3a')}}
 if(look.back==='wings'){const f=Math.round(Math.abs(fl)*4);for(const s of[-1,1]){const bx=s<0?11:24;for(let i=0;i<5;i++){const L=9-i;const ex=s<0?bx-L:bx;P(ex,16+i*2+b-f+(i>2?f:0),L,2,i%2?'#7ae0ff':'#c89cff')}}}
 // --- реактивний ранець (вмикається, коли Nexi летить)
 if(pose.jet){for(const jx of[8,25]){box(jx,20+b,4,9,'#8a93b8',1);P(jx,20+b,4,1,'#d93a4a');const fl=Math.floor(t*14)%2;P(jx,29+b,4,1,'#ffe27a');P(jx+1,30+b,2,2+fl,'#ff7a2a');P(jx+1,32+b+fl,2,1,'#ff3b2e')}}
 // --- legs
 const ll=pose.ll||{dx:0,lift:0},rl=pose.rl||{dx:0,lift:0};
 for(const [lg,bx] of[[ll,13],[rl,19]]){const top=29+b,h=pose.sit?2:Math.max(2,6-lg.lift-b);const lx=bx+(lg.dx|0);
  const LG=LEGS[look.legs]||LEGS.standard,lc=LG.col||limb,fc=LG.foot||shade(shell,-.1),ac=LG.acc||acc;
  box(lx,top,4,h,lc);P(lx,top+1,4,1,jnt);if(LG.pad)P(lx,top+2,4,2,LG.pad);if(LG.glow)P(lx+1,top,2,Math.max(1,h-1),LG.glow);
  if(LG.boot){box(lx-1,top+h-2,6,3,fc);P(lx-1,top+h-2,6,1,shade(fc,.3))}else box(lx-1,top+h-1,6,2,fc);
  P(lx-1,top+h,6,1,ac);if(LG.stripe)P(lx,top+h-1,4,1,LG.stripe);
  if(LG.jet){const f=Math.floor(t*12)%2;P(lx,top+h+1,4,1,'#ffe27a');P(lx+1,top+h+2,2,1+f,'#ff7a2a')}}
 // --- body
 const bw=Math.round(1+0*b);
 box(12,20+b,12,9,bShell,1);P(13,28+b,10,1,jnt);
 if(bd.pat==='camo'){[[13,22,3,2],[19,24,3,3],[16,27,3,1],[21,21,2,2]].forEach(r=>P(r[0],r[1]+b,r[2],r[3],'#3a3a1f'));[[14,25,2,2],[21,26,2,2]].forEach(r=>P(r[0],r[1]+b,r[2],r[3],'#c9892f'))}
 if(bd.pat==='stars'){[[13,21],[22,23],[14,27],[21,27],[12,24]].forEach((s,i)=>{if((i+Math.floor(t*2))%3)P(s[0],s[1]+b,1,1,'#fff')})}
 if(bd.pat==='lines'){P(12,24+b,3,1,bAcc);P(21,24+b,3,1,bAcc);P(13,27+b,2,1,bAcc);P(21,27+b,2,1,bAcc)}
 if(bd.pat==='trim'){P(12,20+b,12,1,bAcc);P(12,27+b,12,1,bAcc)}
 if(bd.pat==='holo'){P(12,22+b,1,5,'#fff');P(23,22+b,1,5,'#fff')}
 if(pose.back){P(13,22+b,10,1,shade(bShell,-.25));P(13,24+b,10,1,shade(bShell,-.25));P(13,26+b,10,1,shade(bShell,-.25));P(17,21+b,2,7,shade(bShell,-.15))}
 // chest badge with N
 if(!pose.back){
 P(15,21+b,6,6,'#0a1236');P(15,21+b,6,1,bAcc);P(15,26+b,6,1,bAcc);P(15,21+b,1,6,bAcc);P(20,21+b,1,6,bAcc);
 const gl=bd.pat==='core'?'#ff9af0':'#4ad9ff';
 [[16,22],[16,23],[16,24],[16,25],[19,22],[19,23],[19,24],[19,25],[17,23],[18,24]].forEach(p=>{if(p[1]<=25)P(p[0],p[1]+b,1,1,gl)});
} // end badge
 // --- arms
 const sh=[[11,22+b],[24,22+b]],hands=[pose.la||{x:-2,y:7},pose.ra||{x:2,y:7}];
 hands.forEach((hd,i)=>{const s=sh[i],ex=s[0]+hd.x,ey=s[1]+hd.y;
  line(s[0],s[1],ex,ey,limb,2);
  P((s[0]+ex)>>1,(s[1]+ey)>>1,2,2,jnt);
  if(am.pad)P((s[0]+ex)>>1,((s[1]+ey)>>1)-1,3,3,'#c3cbea');
  if(am.glow){x.globalAlpha=.5;P(ex-1,ey-1,4,4,am.glow);x.globalAlpha=1}
  const hc=am.hand||shade(shell,-.1);
  if(am.claw){P(ex-1,ey,1,3,hc);P(ex+1,ey,1,3,hc);P(ex-1,ey,3,1,hc)}else box(ex-1,ey,3,3,hc,1);
  hd.ex=ex;hd.ey=ey;});
 if(pose.book){box(13,24+b,10,6,'#ff7a3a');P(17,24+b,2,6,'#7a3a14')}
 // --- head
 const hX=9+hxo,hY=6+b+hyo;
 if(look.head==='hood'){box(hX-2,hY-2,22,17,'#2e3470',1);P(hX-1,hY+11,20,3,'#232857')}
 box(hX-2,hY+5,2,6,acc,0);box(hX+18,hY+5,2,6,acc,0);P(hX-2,hY+7,1,2,'#fff');P(hX+19,hY+7,1,2,'#fff');
 box(hX,hY,18,14,shell,1);P(hX+2,hY+1,14,1,shade(shell,.6));
 if(pose.back){P(hX+2,hY+2,14,10,shade(shell,-.12));P(hX+3,hY+4,12,1,shade(shell,-.3));P(hX+3,hY+8,12,1,shade(shell,-.3));P(hX+8,hY+5,2,2,acc)}else{
 P(hX+2,hY+2,14,10,'#050a26');P(hX+2,hY+2,1,1,shell);P(hX+15,hY+2,1,1,shell);P(hX+2,hY+11,1,1,shell);P(hX+15,hY+11,1,1,shell);
 P(hX+3,hY+10,12,1,'#0f1d5a');
 drawFace(x,P,hX+2,hY+2,pose.face||look.face,eye,pose,t);
 }
 // --- antenna
 drawAnt(x,P,look,hX,hY,acc,eye,t,shell);
 // --- head accessories
 if(look.head==='hat'){box(hX+1,hY-3,16,5,'#d93a4a',1);P(hX-1,hY+1,20,2,'#a82a3a');P(hX+7,hY-5,4,2,'#fff')}
 if(look.head==='phones'){P(hX,hY-2,18,2,'#2a2f6e');P(hX,hY-2,2,7,'#2a2f6e');P(hX+16,hY-2,2,7,'#2a2f6e');box(hX-3,hY+3,4,8,'#ff4fd8');box(hX+17,hY+3,4,8,'#ff4fd8')}
 if(look.head==='goggles'){P(hX,hY+1,18,2,'#6a4a1a');for(const gx of[hX+3,hX+10]){box(gx,hY+3,5,5,'#e0902a',1);P(gx+1,hY+4,3,3,'#7af0ff')}}
 // --- hand accessories
 if(look.hand==='shield'){const h=hands[0];box(h.ex-4,h.ey-3,6,9,'#3a6aff',1);P(h.ex-3,h.ey,4,3,'#cffaff')}
 if(look.hand==='sword'){const h=hands[1];P(h.ex,h.ey-11,1,12,'#dfe8ff');P(h.ex-1,h.ey,3,1,'#ffd45a')}
 if(pose.tool){const h=hands[1],ex=h.ex,ey=h.ey;
  if(pose.tool==='hammer'){P(ex,ey-6,1,7,'#8a5a2a');P(ex-2,ey-8,5,3,'#aab4d6');P(ex-2,ey-8,5,1,'#e9eefc')}
  if(pose.tool==='cup'){P(ex-1,ey-3,3,4,'#ffffff');P(ex+2,ey-2,1,2,'#ffffff');P(ex-1,ey-3,3,1,'#6a3a1a')}
  if(pose.tool==='cable'){P(ex,ey-3,2,3,'#3be8ff');P(ex,ey-4,2,1,'#ffffff')}
  if(pose.tool==='mega'){P(ex-1,ey-2,3,3,'#e9eefc');P(ex+2,ey-3,1,5,'#e9eefc');P(ex+3,ey-4,1,7,'#ff4fd8')}}
 if(pose.shades){P(hX+3,hY+4,12,3,'#000');P(hX+3,hY+4,12,1,'#2a3a7a')}
 // outline pass
 const id=x.getImageData(0,0,SW,SH),d=id.data,o=hx(OUT);const op=new Uint8Array(SW*SH);
 for(let i=0;i<SW*SH;i++)op[i]=d[i*4+3]>40?1:0;
 for(let yy=0;yy<SH;yy++)for(let xx=0;xx<SW;xx++){const i=yy*SW+xx;if(op[i])continue;
  if((xx>0&&op[i-1])||(xx<SW-1&&op[i+1])||(yy>0&&op[i-SW])||(yy<SH-1&&op[i+SW])){d[i*4]=o[0];d[i*4+1]=o[1];d[i*4+2]=o[2];d[i*4+3]=255}}
 x.putImageData(id,0,0);
 return c;
}
function drawFace(x,P,fx,fy,face,eye,pose,t){ // visor origin (fx,fy) 14x10
 const lx=fx+2,rx=fx+8,ey=fy+3,bl=pose.blink,dim=shade(eye,-.45);
 const eyes=(w,h,ring)=>{for(const ex of[lx,rx]){
  if(bl){P(ex,ey+1,4,1,eye);continue}
  P(ex,ey,4,h,eye);if(ring)P(ex+1,ey+1,2,h-2,'#050a26');
  x.clearRect(ex,ey,1,1);x.clearRect(ex+3,ey,1,1);x.clearRect(ex,ey+h-1,1,1);x.clearRect(ex+3,ey+h-1,1,1);
  P(ex-1,ey+1,1,h-2,dim);P(ex+4,ey+1,1,h-2,dim);P(ex+1,ey-1,2,1,dim);P(ex+1,ey+h,2,1,dim)}};
 let mouth=1;
 switch(face){
 case'happy':for(const ex of[lx,rx]){P(ex,ey+2,1,1,eye);P(ex+1,ey+1,2,1,eye);P(ex+3,ey+2,1,1,eye)}P(fx+5,fy+7,4,1,eye);P(fx+4,fy+6,1,1,eye);P(fx+9,fy+6,1,1,eye);mouth=0;break;
 case'think':eyes(4,4,1);P(lx+1,ey+1,2,2,eye);P(rx+1,ey+1,2,2,eye);break;
 case'surprised':for(const ex of[lx-0,rx]){P(ex-1,ey-1,6,6,eye);P(ex,ey,4,4,'#050a26');P(ex+1,ey+1,2,2,eye)}P(fx+6,fy+7,2,2,eye);mouth=0;break;
 case'serious':for(const ex of[lx,rx]){P(ex,ey+1,4,2,eye)}P(lx,ey,4,1,dim);P(rx,ey,4,1,dim);break;
 case'sleepy':for(const ex of[lx,rx]){P(ex,ey+2,4,1,eye);P(ex+1,ey+3,2,1,dim)}break;
 case'hearts':for(const ex of[lx,rx]){P(ex,ey,2,1,'#ff5ae0');P(ex+3,ey,1,1,'#ff5ae0');P(ex-1,ey,1,1,'#ff5ae0');P(ex-1,ey+1,6,1,'#ff5ae0');P(ex,ey+2,4,1,'#ff5ae0');P(ex+1,ey+3,2,1,'#ff5ae0')}break;
 case'sad':for(const ex of[lx,rx]){P(ex,ey+1,4,2,eye)}P(lx,ey,1,1,eye);P(rx+3,ey,1,1,eye);P(fx+5,fy+7,4,1,eye);P(fx+4,fy+8,1,1,eye);P(fx+9,fy+8,1,1,eye);mouth=0;break;
 case'angry':for(const ex of[lx,rx]){P(ex,ey+1,4,3,'#ff3b3b')}P(lx,ey,2,1,'#ff3b3b');P(rx+2,ey,2,1,'#ff3b3b');P(lx+2,ey-1,2,1,dim);P(rx,ey-1,2,1,dim);break;
 default:eyes(4,4,0)}
 if(face==='talk'||pose.talk){const o=Math.floor(t*9)%3;P(fx+5,fy+7,4,1+(o===1),eye);P(fx+6,fy+7+(o===1?1:0),2,1,eye)}
 else if(mouth&&face!=='sleepy')P(fx+5,fy+7,4,1,dim);
}
function drawAnt(x,P,look,hX,hY,acc,eye,t,shell){
 const cx=hX+8,tip=Math.floor(t*3)%2?eye:shade(eye,.5);
 if(look.head==='hood'||look.head==='hat')return;
 switch(look.ant){
 case'techno':P(cx,hY-5,2,5,'#8aa0c8');P(cx-1,hY-8,4,4,'#ff4fd8');P(cx,hY-8,2,1,'#ffc4f4');break;
 case'holo':P(cx,hY-3,2,3,'#8aa0c8');const f=Math.round(Math.sin(t*3.14159));[[0,-8],[-1,-7],[1,-7],[0,-6]].forEach(p=>P(cx+p[0],hY+p[1]+f,p[0]?1:2,1,tip));P(cx,hY-7+f,2,1,'#fff');break;
 case'gamer':for(const s of[hX+3,hX+13]){P(s,hY-5,2,5,'#8aa0c8');P(s-1,hY-7,4,3,s<hX+8?'#ff4fd8':'#7a5cff')}break;
 case'premium':for(const s of[-1,1]){const bx=s<0?hX+2:hX+14;P(bx,hY-3,2,3,'#ffc94d');P(bx+s,hY-5,2,2,'#ffc94d');P(bx+2*s,hY-7,2,2,'#ffe27a')}break;
 case'horns':for(const s of[-1,1]){const bx=s<0?hX+1:hX+15;P(bx,hY-3,2,3,'#cfd6f0');P(bx-s,hY-5,2,2,'#cfd6f0');P(bx-2*s,hY-7,2,2,'#ffffff')}break;
 case'crown':P(hX+4,hY-4,10,4,'#ffc94d');P(hX+4,hY-6,2,2,'#ffc94d');P(hX+8,hY-7,2,3,'#ffc94d');P(hX+12,hY-6,2,2,'#ffc94d');P(hX+8,hY-2,2,2,'#ff3b6a');P(hX+4,hY-4,10,1,'#fff0a0');break;
 case'neon':[[5,-1],[4,-2],[4,-3],[5,-4],[6,-5],[9,-5],[10,-4],[11,-3],[11,-2],[10,-1]].forEach(p=>P(hX+p[0],hY+p[1],1,1,'#ff4fd8'));P(hX+8,hY-1,2,1,'#8aa0c8');break;
 default:P(cx,hY-5,2,5,'#8aa0c8');P(cx-1,hY-7,4,3,tip);P(cx,hY-7,2,1,'#fff');}
}

// ================= tutorial demos: a little looping pixel "video" for each lesson =================
// The game pauses, a pixel finger (or mouse and keys on a computer) shows the move, and the confirm
// button wakes up after three seconds so nobody dismisses it by accident. The scene is drawn with the game's own
// sprites, held weapons, slashes and telegraphs (the same way the shop's try-on stage works), on a small stage.
const DEMO_W=200,DEMO_H=112,DEMO_WAIT=3;
const DEMO_LEN={move:3,dash:2.6,tap:2.2,swipe:2.6,hold:3,parry:3.2,tool:2.4,tech:3.6,heal:2.6,thirst:2.8};
function tutDemo(st,onDone){
  if(!st||!DEMO_LEN[st.id]||!$('demoOv')){onDone&&onDone();return;}
  S.demo={id:st.id,t:0,open:0,touch:!!S.touchUI,onDone,last:performance.now()};
  S.swipe=null;S.trace=null;try{keys.clear();}catch(_){}
  $('demoTitle').textContent=st.name;$('demoTxt').textContent=S.touchUI?st.touch:st.key;
  const n=(S.pro?PRO_STEPS:TUT).filter(x=>DEMO_LEN[x.id]),i=n.indexOf(st);$('demoK').textContent=i>=0?`Lesson ${i+1} / ${n.length}`:'Lesson';
  demoBtn();$('demoOv').hidden=false;sfx('blip',700);requestAnimationFrame(demoFrame);
}
function demoBtn(){const d=S.demo,b=$('demoOk');if(!d||!b)return;const left=Math.ceil(DEMO_WAIT-d.open),lbl=d.id==='hud'&&d.tab<HUD_TABS.length-1?'Next':'Got it';b.disabled=left>0;b.textContent=left>0?`${tr(lbl)} (${left})`:lbl;}
function demoClose(){
  const d=S.demo;if(!d||d.open<DEMO_WAIT)return;if(d.id==='hud'&&d.tab<HUD_TABS.length-1){hudTab(d.tab+1);sfx('click');return;}if(d.id==='hud')hudClose();S.demo=null;$('demoOv').hidden=true;last=performance.now();sfx('learn');d.onDone&&d.onDone();
}
function demoFrame(now){
  const d=S.demo;if(!d)return;const dt=Math.min(0.05,(now-d.last)/1000);d.last=now;d.t+=dt;const before=Math.ceil(DEMO_WAIT-d.open);d.open+=dt;if(Math.ceil(DEMO_WAIT-d.open)!==before)demoBtn();
  const cv=$('demoCv'),g=cv.getContext('2d');g.imageSmoothingEnabled=false;if(d.id==='hud')drawHudTab(g,d);else drawDemo(g,d.id,d.t%DEMO_LEN[d.id],d.touch);
  requestAnimationFrame(demoFrame);
}
// ---------- tiny pixel pieces ----------
const DM={g:null};
const dr=(x,y,w,h,c,a)=>{const g=DM.g;if(a!=null)g.globalAlpha=a;g.fillStyle=c;g.fillRect(Math.round(x),Math.round(y),w,h);if(a!=null)g.globalAlpha=1;};
const dline=(x0,y0,x1,y1,c,a,th)=>{const n=Math.max(1,Math.ceil(Math.hypot(x1-x0,y1-y0)));for(let i=0;i<=n;i++)dr(x0+(x1-x0)*i/n,y0+(y1-y0)*i/n,th||1,th||1,c,a);};
const dring=(x,y,r,c,k,a)=>{const n=Math.max(8,Math.round(r*6));for(let i=0;i<n*(k==null?1:k);i++){const an=-Math.PI/2+i/n*Math.PI*2;dr(x+Math.cos(an)*r,y+Math.sin(an)*r,1,1,c,a);}};
const ease=u=>u<0?0:u>1?1:u*u*(3-2*u);
const seg=(t,a,b)=>clamp((t-a)/(b-a),0,1);
function dtext(s,x,y,c,size,align){const g=DM.g;g.font=`${size||8}px Silkscreen, monospace`;g.textAlign=align||'center';g.textBaseline='alphabetic';g.fillStyle='#000';g.fillText(s,x+1,y+1);g.fillStyle=c;g.fillText(s,x,y);}
// a pixel hand, finger pointing up-left; the fingertip is (x,y)
const HAND=['..o.....','.o#o....','.o#o....','.o#ooo..','.o#o#ooo','oo#o#o#o','o#######o','o#######o','.o#####o.','.o#####o.','..o###o..','..ooooo..'];
function dHand(x,y,press){const g=DM.g;g.save();g.translate(Math.round(x),Math.round(y));g.scale(2,2);x=0;y=0;const ox=Math.round(x)-2,oy=Math.round(y)+(press?1:0);HAND.forEach((row,j)=>{for(let i=0;i<row.length;i++){const ch=row[i];if(ch==='o')dr(ox+i,oy+j,1,1,'#000');else if(ch==='#')dr(ox+i,oy+j,1,1,press?'#d8c8b0':'#f4ece0');}});
  if(press){dring(x,y,4,'#ffffff',1,0.7);}g.restore();}
const ARROW=['o.......','oo......','o#o.....','o##o....','o###o...','o####o..','o#####o.','o###ooo.','o#o#o...','oo.o#o..','...oo...'];
function dCursor(x,y,press){const g=DM.g;g.save();g.translate(Math.round(x),Math.round(y));g.scale(2,2);x=0;y=0;ARROW.forEach((row,j)=>{for(let i=0;i<row.length;i++){const ch=row[i];if(ch==='o')dr(x+i,y+j,1,1,'#000');else if(ch==='#')dr(x+i,y+j,1,1,'#ffffff');}});if(press)dring(x,y,4,'#ffffff',1,0.7);g.restore();}
// the mouse, with the pressed button lit
function dMouse(x,y,btn){const g=DM.g;g.save();g.translate(Math.round(x),Math.round(y));g.scale(1.6,1.6);x=0;y=0;dr(x,y,11,15,'#000');dr(x+1,y+1,9,13,'#2a2028');dr(x+1,y+1,4,6,btn==='l'?'#ff4a5c':'#4a4250');dr(x+6,y+1,4,6,btn==='r'?'#ff4a5c':'#4a4250');dr(x+5,y+1,1,6,'#000');g.restore();}
function dKey(x,y,label,down,w){w=w||11;dr(x,y+(down?1:2),w,11,'#000');dr(x,y+(down?1:0),w,10,down?'#ff4a5c':'#4a4250');dr(x+1,y+(down?2:1),w-2,8,down?'#c8203a':'#2a2028');dtext(label,x+w/2,y+(down?9:8),down?'#ffffff':'#ece4d7',8);}
function dBtn(x,y,label,down,r){const g=DM.g;r=Math.max(r||9,10);g.beginPath();g.arc(x,y+(down?1:0),r,0,Math.PI*2);g.fillStyle=down?'#ff4a5c':'rgba(236,228,215,0.18)';g.fill();g.lineWidth=1;g.strokeStyle=down?'#ffffff':'rgba(236,228,215,0.6)';g.stroke();const ic={DASH:'dash',KUNAI:'kunai',HEAL:'heal',THIRST:'thirst',MEND:'mend',SHURI:'shuri',THROW:'throw',TAKE:'take'}[label];
  if(ic){const Bm=BTN_ICONS[ic],ox=Math.round(x-6),oy=Math.round(y-6+(down?1:0));Bm.forEach((row,j)=>{for(let i=0;i<row.length;i++)if(btnOn(ic,row[i]))dr(ox+i,oy+j,1,1,'#ece4d7');});}
  else dtext(label,x,y+3+(down?1:0),'#ffffff',label.length>3?6:8);}
function dSpark(x,y,k,c){for(let i=0;i<8;i++){const a=i/8*Math.PI*2,r=3+k*7;dr(x+Math.cos(a)*r,y+Math.sin(a)*r,1,1,c||'#ffffff',1-k);}}
function dStick(cx,cy,dx,dy,a){const g=DM.g;g.globalAlpha=a;g.beginPath();g.arc(cx,cy,10,0,Math.PI*2);g.strokeStyle='rgba(236,228,215,0.7)';g.stroke();g.beginPath();g.arc(cx+dx,cy+dy,5,0,Math.PI*2);g.fillStyle='rgba(236,228,215,0.5)';g.fill();g.globalAlpha=1;}
// ---------- the stage: the game's own drawing, pointed at a small canvas ----------
let TD_FLOOR=null;
function tdFloor(){
  if(TD_FLOOR)return TD_FLOOR;const c=mk(DEMO_W,DEMO_H),g=c.getContext('2d');
  g.fillStyle='#0d0a0f';g.fillRect(0,0,DEMO_W,DEMO_H);
  g.fillStyle='#17121a';g.fillRect(0,0,DEMO_W,34);g.fillStyle='#211a24';for(let x=4;x<DEMO_W;x+=24)g.fillRect(x,6,19,22);
  g.fillStyle='#2c2330';for(let x=4;x<DEMO_W;x+=24){g.fillRect(x+9,6,1,22);g.fillRect(x,16,19,1);}
  g.fillStyle='#3a2a1e';g.fillRect(0,34,DEMO_W,2);g.fillStyle='#120e14';g.fillRect(0,36,DEMO_W,1);
  for(let y=37;y<DEMO_H;y+=7){g.fillStyle=(y/7|0)%2?'#16111a':'#141017';g.fillRect(0,y,DEMO_W,7);g.fillStyle='#0f0b11';g.fillRect(0,y,DEMO_W,1);for(let x=(y*7)%29;x<DEMO_W;x+=29+((x*y)%13))g.fillRect(x,y,1,7);}
  const d=g.getImageData(0,0,DEMO_W,DEMO_H),p=d.data;for(let y=0;y<DEMO_H;y++)for(let x=0;x<DEMO_W;x++){const u=(x-DEMO_W/2)/(DEMO_W/2),v=(y-DEMO_H*0.62)/(DEMO_H*0.75),k=Math.max(0,Math.min(1,(u*u+v*v-0.4)*0.85)),i=(y*DEMO_W+x)*4;p[i]*=1-k*0.7;p[i+1]*=1-k*0.7;p[i+2]*=1-k*0.7;}
  g.putImageData(d,0,0);return TD_FLOOR=c;
}
// world units are the game's (two per stage pixel); feet stand on this line
const TDY=172,tdw=x=>x*PX;
function tdHero(x,y,o={}){
  const face=o.face||1,f=o.frame||0;shadow(x,y,12);
  if(o.ghosts)for(const gx of o.ghosts)drawSpr('player',f,gx,y,1,true,0.28,face<0);
  const r=drawSpr('player',f,x,y,1,!!o.white,o.alpha,face<0);if(!r)return null;
  if(!o.noWeapon&&!(f>=3&&f<=7&&!o.drink)){const id=P.wpn?P.wpn.id:'katana',a=o.aim!=null?o.aim:(face>0?-0.5:Math.PI+0.5);drawHeld(r.hand,a,id,false,!!o.blood,false,false,{face,g:o.grow==null?(o.blood?1:0):o.grow});}
  return r;
}
function tdFoe(key,x,y,o={}){
  const T=TYPES[key]||TYPES.ronin,look=T.look||key,sp=SPR[look];if(!sp)return null;
  const face=o.face||-1;if(o.dead){lx.globalAlpha=Math.max(0,1-o.dead);}shadow(x,y,12);
  const r=drawSpr(look,o.frame||0,x,y,face,!!o.white,o.dead?Math.max(0.05,1-o.dead):undefined);lx.globalAlpha=1;if(!r)return null;
  if(!o.dead)weapon(T.weapon,r.hand,face,o.pose||'idle',1.3);
  if(o.stun){const top=r.sy+Math.max(0,sp.h-36);for(let i=0;i<3;i++){const t=S.gt*5+i*2.1;pset(LX(x)+Math.cos(t)*5,top-6+Math.sin(t),C.spirit);}}
  return r;
}
// a cut, laid out along points and shown at a given progress (0..1 drawing, then fading)
function tdCut(pts,u,o={}){
  const c=makeCut(pts,1000,Object.assign({team:o.team||'p'},o.cut||{}));c.d=clamp(u,0,1)*c.len;c.done=u>=1;
  if(c.done){c.fadeMax=0.35;c.fade=0.35*clamp(1-(u-1)/0.6,0,1);if(c.fade<=0)return;}
  if(o.blood){const tc=tsCut(),w=10;if(!drawSkinCut(c,w))drawCut(c,tc[0],tc[1],w);}
  else if(o.col)drawCut(c,o.core||C.white,o.col,o.w||6);
  else{const ss=slashSet();drawCut(c,ss.core,setCol(ss.edge),o.w||(o.tap?5:7));}
}
const tdArc=(cx,cy,r,a0,a1,n)=>{const p=[];n=n||14;for(let i=0;i<=n;i++){const a=a0+(a1-a0)*i/n;p.push({x:cx+Math.cos(a)*r,y:cy+Math.sin(a)*r*0.8});}return p;};
const tdLine=(x0,y0,x1,y1)=>[{x:x0,y:y0},{x:x1,y:y1}];
function tdHitFx(x,y,t0,t,cols){const u=(t-t0)/0.45;if(u<0||u>1)return;cols=cols||slashSet().burst||[C.hi,C.white];for(let i=0;i<14;i++){const a=i/14*Math.PI*2+i,v=20+(i*37%40);pset(LX(x+Math.cos(a)*v*u*2),LY(y+Math.sin(a)*v*u*2),cols[i%cols.length],1-u);}}
// the windup exactly as it looks in a fight: a real telegraph on a stand-in foe
function tdTele(key,x,y,pts,k){const fake={state:'wind',t:(1-k),wind:1,cuts:[makeCut(pts,1000,{team:'e'})],x,y:y-13*0.6,r:13,look:(TYPES[key]||TYPES.ronin).look||key,T:TYPES[key]||TYPES.ronin};try{drawTelegraph(fake);}catch(_){}}
function drawDemo(g,id,t,touch){
  DM.g=g;DM.t=t;flush();const keep=lx,X0=S.X0,Y0=S.Y0,gt=S.gt,face=S.face;lx=g;S.X0=0;S.Y0=0;S.gt=t;S.face=1;
  try{g.setTransform(1,0,0,1,0,0);g.globalAlpha=1;g.drawImage(tdFloor(),0,0);demoScene(id,t,touch);flush();}
  catch(e){try{console.error(e);}catch(_){}}
  lx=keep;S.X0=X0;S.Y0=Y0;S.gt=gt;S.face=face;
  demoOverlay(id,t,touch);
}
function demoScene(id,t,touch){
  const y=TDY;
  switch(id){
    case'move':{const u=t/3,x=200+Math.sin(u*Math.PI*2)*90,yy=y-6+Math.sin(u*Math.PI*4)*-14,dir=Math.cos(u*Math.PI*2)>=0?1:-1;tdHero(x,yy,{face:dir,frame:[0,1,2,1][Math.floor(t*9)%4]});break;}
    case'dash':{const k=ease(seg(t,0.9,1.12)),x=120+k*130,ghosts=t>0.9&&t<1.3?[x-24,x-48,x-72].filter(g=>g>120):null;
      const sw=seg(t,0.95,1.35),fx=320;tdFoe('ronin',fx,y,{frame:t<0.95?3:4,pose:t<0.95?'wind':'strike'});
      if(t<0.95)tdTele('ronin',fx,y,tdLine(fx-30,y-26,90,y-26),seg(t,0.1,0.95));
      if(sw>0)tdCut(tdLine(fx-30,y-26,90,y-26),sw*1.15,{team:'e',col:C.curse,core:C.white,w:6});
      tdHero(x,y,{ghosts,frame:0});break;}
    case'tap':{const hx=150,fx=232,hit=t>0.78&&t<0.95;tdFoe('ronin',fx+(t>0.78?Math.min(8,(t-0.78)*60):0),y,{white:hit});
      const anim=t>0.7&&t<0.94;tdHero(hx,y,{frame:anim?(t<0.77?6:7):0});
      if(t>0.7)tdCut(tdArc(hx+14,y-30,44,-1.1,1.0),seg(t,0.7,0.82)+Math.max(0,t-0.82)*0.9,{tap:true});tdHitFx(fx,y-30,0.78,t);break;}
    case'swipe':{const hx=110,fx=262,u=seg(t,0.55,1.1),kill=t>0.95;tdFoe('ronin',fx,y,{white:kill&&t<1.1,dead:t>1.1?seg(t,1.1,1.8):0,frame:kill?4:0});
      tdHero(hx,y,{frame:t>0.55&&t<0.8?(t<0.6?3:t<0.68?4:5):0});
      if(t>0.55)tdCut(tdLine(205,70,315,205),u+Math.max(0,t-1.1)*1.6);tdHitFx(fx,y-28,0.95,t);break;}
    case'hold':{const hx=110,fx=300,fill=seg(t,0.5,1.6),rel=t>1.8,k=seg(t,1.8,1.9);tdFoe('ronin',fx,y,{white:rel&&t<2.05,dead:t>2.05?seg(t,2.05,2.6):0});
      const h=tdHero(hx,y,{frame:rel&&t<2.0?6:0,aim:-0.1});
      if(t>0.45&&!rel){const px=LX(hx),py=LY(y-14),n=32,col=fill>=1?(Math.floor(t*12)%2?C.white:C.hi):C.bone;for(let i=0;i<n;i++){if(i/n>fill)break;const an=-Math.PI/2+i/n*Math.PI*2;pset(px+Math.cos(an)*12,py+10+Math.sin(an)*5,col);}}
      if(rel)tdCut(tdLine(hx+20,y-28,hx+250,y-28),k+Math.max(0,t-1.9)*1.5,{w:9});tdHitFx(fx,y-28,1.9,t);break;}
    case'parry':{const hx=120,fx=300,path=tdLine(fx-30,y-28,hx-20,y-28),strike=seg(t,1.05,1.75),broke=t>1.32;
      tdFoe('hatamoto',fx,y,{frame:t<1.05?3:4,pose:t<1.05?'wind':'strike',stun:broke&&t<2.6});
      if(t<1.05)tdTele('hatamoto',fx,y,path,seg(t,0.1,1.05));
      else if(!broke)tdCut(path,strike*1.2,{team:'e',col:C.curse,core:C.white,w:6});
      tdHero(hx,y,{frame:t>1.1&&t<1.3?(t<1.16?3:t<1.22?4:5):0});
      const sx=210;if(t>1.12)tdCut(tdLine(sx,y-80,sx,y+24),seg(t,1.12,1.3)+Math.max(0,t-1.3)*1.2);
      if(broke&&t<2.2){tdHitFx(sx,y-28,1.32,t,[C.spirit,C.white,C.bone]);if(t<1.9)ptext('PARRY',LX(sx),LY(y-60),C.spirit,8);}break;}
    case'tool':{const hx=100,fx=330,k=seg(t,0.65,1.0),hit=t>1.0;
      lx.fillStyle='#2a2028';lx.fillRect(LX(210),LY(y-60),12,22);lx.fillStyle='#3a3040';lx.fillRect(LX(210),LY(y-60),12,2);
      tdFoe('teppo',fx,y-30,{white:hit&&t<1.15,dead:t>1.15?seg(t,1.15,1.7):0});tdHero(hx,y,{frame:t>0.62&&t<0.75?7:0});
      if(t>0.65&&t<1.0){const x=LX(hx+20+k*(fx-hx-30)),yy=LY(y-28-k*28);pline(x-4,yy,x,yy,C.steel);pset(x+1,yy,C.white);pset(x-5,yy,'#8a5a34');}
      tdHitFx(fx,y-56,1.0,t);break;}
    case'tech':{const hx=200,spin=t>1.95&&t<2.9,s=seg(t,1.95,2.9),dead=t>2.4?seg(t,2.4,3):0;tdFoe('ronin',95,y,{face:1,white:spin&&t<2.4,dead});tdFoe('ronin',305,y,{white:spin&&t<2.4,dead});
      tdHero(hx,y,{blood:spin,frame:0});
      const k=seg(t,0.6,1.8),R=58,n=Math.floor(k*48),set=slashSet();
      if(t>0.6&&t<2.15){const a=t>1.8?1-seg(t,1.8,2.15):1;for(let i=0;i<n;i++){const an=-Math.PI/2+i/48*Math.PI*2,col=setCol(set.tr,i>>2);pset(LX(hx+Math.cos(an)*R),LY(y-28+Math.sin(an)*R*0.8),col,a);pset(LX(hx+Math.cos(an)*R)+1,LY(y-28+Math.sin(an)*R*0.8),col,a);}}
      if(spin){for(let i=0;i<3;i++){const a0=s*Math.PI*5+i*2.1;tdCut(tdArc(hx,y-28,70,a0,a0+1.6,10),1,{blood:true});}if(t<2.6)ptext('BLOOD SPIN',LX(hx),LY(y-100),C.hi,8);}break;}
    case'heal':{const hx=200,k=seg(t,0.75,1.35),drink=t>0.7&&t<1.5;tdHero(hx,y,{frame:drink?3:0,drink});
      if(drink)for(let i=0;i<16;i++){const ph=((t*2.5)+i*0.37)%1,a=i*2.399,r=30*(1-ph);pset(LX(hx+Math.cos(a)*r),LY(y-14+Math.sin(a)*r),i%2?C.hi:C.blood);}if(t>1.35&&t<1.85)tdHitFx(hx,y-14,1.35,t,[C.hi,C.blood,C.white]);break;}
    case'thirst':{const hx=120,on=t>0.6,g2=seg(t,0.6,1.0),sl=seg(t,1.4,1.65);
      tdFoe('ronin',262,y-20,{white:sl>0.6&&t<1.75,dead:t>1.75?seg(t,1.75,2.4):0});tdFoe('ronin',300,y+12,{white:sl>0.8&&t<1.75,dead:t>1.75?seg(t,1.75,2.4):0});
      if(on)thirstAura(thirstSkin(),t,LX(hx),LY(y)-8,Math.min(1,(t-0.6)/0.3));if(t>0.6&&t<1.3)thirstAct(thirstSkin(),(t-0.6)/0.7,LX(hx),LY(y)-8,t);
      tdHero(hx,y,{blood:on,grow:g2,frame:t>1.4&&t<1.6?(t<1.46?3:t<1.52?4:5):0});
      if(t>1.4)tdCut(tdLine(210,60,330,215),sl+Math.max(0,t-1.65)*1.4,{blood:true});break;}
    default:if(typeof THREAT_SCENE!=='undefined'&&THREAT_SCENE[id])THREAT_SCENE[id](t,y);
  }
}
// the HUD bits a lesson points at, drawn like the real ones (souls, the blood bar)
function tdHud(hp,orb,flash){const g=DM.g;
  for(let i=0;i<5;i++){const x=8+i*9,y=6,c=i<hp?'#ff4a5c':'#3a3040';g.fillStyle='#000';for(let j=0;j<=6;j++){const w=j<=3?j:6-j;g.fillRect(x+3-w-1,y+j,w*2+3,1);}g.fillStyle=c;for(let j=0;j<=6;j++){const w=j<=3?j:6-j;g.fillRect(x+3-w,y+j,w*2+1,1);}if(i<hp){g.fillStyle='#ff8a95';g.fillRect(x+2,y+2,1,1);}}
  g.fillStyle='#000';g.fillRect(7,15,52,5);g.fillStyle='#2a1218';g.fillRect(8,16,50,3);g.fillStyle=flash?'#ff8a95':'#b8142a';g.fillRect(8,16,Math.round(50*orb),3);}
function demoOverlay(id,t,touch){
  const y=Math.round(TDY/PX),W=DEMO_W;
  const press=(on,x,yy)=>touch?dHand(x,yy,on):dCursor(x,yy,on);
  switch(id){
    case'move':{if(touch){const a=seg(t,0,0.25),u=t/3,sx=Math.cos(u*Math.PI*2)*8,sy=Math.cos(u*Math.PI*4)*-4;dStick(26,88,sx,sy,a);dHand(26+sx,88+sy,true);}
      else{const u=t/3,right=Math.cos(u*Math.PI*2)>=0,up=Math.cos(u*Math.PI*4)>0;dKey(22,72,'W',up);dKey(10,84,'A',!right);dKey(22,84,'S',!up);dKey(34,84,'D',right);}break;}
    case'dash':{if(touch){const down=t>0.8&&t<1.1;dBtn(178,80,'DASH',down,11);dHand(180,82,down);}else dKey(78,92,'SPACE',t>0.8&&t<1.1,44);break;}
    case'tap':{const my=112-ease(seg(t,0,0.6))*44;press(t>0.7&&t<0.9,108,my);if(!touch)dMouse(176,80,t>0.7&&t<0.9?'l':'');break;}
    case'swipe':{const u=ease(seg(t,0.55,1.1)),x=102+u*55,yy=35+u*67;if(t<1.35){press(t>0.55&&t<1.1,t<0.55?x+30*(1-seg(t,0,0.55)):x,t<0.55?yy+30*(1-seg(t,0,0.55)):yy);}if(!touch)dMouse(176,80,t>0.55&&t<1.1?'l':'');break;}
    case'hold':{const rel=t>1.8,fill=seg(t,0.5,1.6);if(t>0.25&&t<1.95)press(!rel,100,52);if(!touch)dMouse(176,80,t>0.4&&!rel?'l':'');if(t>0.5&&!rel)dtext(fill>=1?'LET GO':'HOLD STILL',100,40,fill>=1?'#ffffff':'#968b97',8);break;}
    case'parry':{const yy=t<1.12?40:40+ease(seg(t,1.12,1.3))*52;if(t>0.75&&t<1.5)press(t>1.12&&t<1.3,105,yy);if(!touch)dMouse(176,80,t>1.12&&t<1.3?'l':'');break;}
    case'tool':{if(touch){const down=t>0.5&&t<0.75;dBtn(178,80,'KUNAI',down,11);dHand(180,82,down);}else dKey(150,80,'X',t>0.5&&t<0.75);break;}
    case'tech':{const k=seg(t,0.6,1.8),R=29,an=-Math.PI/2+k*Math.PI*2,cx=100+Math.cos(an)*R,cy=72+Math.sin(an)*R*0.8;
      if(touch){const down=t>0.25&&t<0.5;dBtn(178,80,'技',down,10);if(t<0.55)dHand(180,82,down);else if(t<1.9)dHand(cx,cy,true);}
      else{const arm=t>0.3&&t<1.85;dMouse(176,80,arm?'r':'');if(t>0.45&&t<1.9)dCursor(cx,cy,true);if(arm)dtext('HOLD',184,76,'#ff4a5c',6);}break;}
    case'heal':{const k=seg(t,0.75,1.35);tdHud(3+Math.round(k*2),1-k*0.45,false);if(touch){const down=t>0.55&&t<0.8;dBtn(178,80,'HEAL',down,11);dHand(180,82,down);}else dKey(150,80,'Q',t>0.55&&t<0.8);break;}
    case'thirst':{const on=t>0.6,g2=seg(t,0.6,1.0);tdHud(5,on?1-g2*0.9:1,!on&&Math.floor(t*8)%2);if(touch){const down=t>0.4&&t<0.65;dBtn(178,80,'THIRST',down,12);dHand(180,82,down);}else dKey(150,80,'R',t>0.4&&t<0.65);break;}
    default:if(typeof THREAT_OVER!=='undefined'&&THREAT_OVER[id])THREAT_OVER[id](t,touch);
  }
}

// ================= tutorial demos: a little looping pixel "video" for each lesson =================
// The game pauses, a pixel finger (or mouse and keys on a computer) shows the move, and the confirm
// button wakes up after five seconds so nobody dismisses it by accident.
const DEMO_W=200,DEMO_H=112,DEMO_WAIT=5;
const DEMO_LEN={move:3,dash:2.6,tap:2.2,swipe:2.6,hold:3,parry:3.2,tool:2.4,tech:3.6,heal:2.6,thirst:2.8};
function tutDemo(st,onDone){
  if(!st||!DEMO_LEN[st.id]||!$('demoOv')){onDone&&onDone();return;}
  S.demo={id:st.id,t:0,open:0,touch:!!S.touchUI,onDone,last:performance.now()};
  S.swipe=null;S.trace=null;try{keys.clear();}catch(_){}
  $('demoTitle').textContent=st.name;$('demoTxt').textContent=S.touchUI?st.touch:st.key;
  const n=(S.pro?PRO_STEPS:TUT).filter(x=>DEMO_LEN[x.id]),i=n.indexOf(st);$('demoK').textContent=i>=0?`Lesson ${i+1} / ${n.length}`:'Lesson';
  demoBtn();$('demoOv').hidden=false;sfx('blip',700);requestAnimationFrame(demoFrame);
}
function demoBtn(){const d=S.demo,b=$('demoOk');if(!d||!b)return;const left=Math.ceil(DEMO_WAIT-d.open);b.disabled=left>0;b.textContent=left>0?`Got it (${left})`:'Got it';}
function demoClose(){
  const d=S.demo;if(!d||d.open<DEMO_WAIT)return;S.demo=null;$('demoOv').hidden=true;last=performance.now();sfx('learn');d.onDone&&d.onDone();
}
function demoFrame(now){
  const d=S.demo;if(!d)return;const dt=Math.min(0.05,(now-d.last)/1000);d.last=now;d.t+=dt;const before=Math.ceil(DEMO_WAIT-d.open);d.open+=dt;if(Math.ceil(DEMO_WAIT-d.open)!==before)demoBtn();
  const cv=$('demoCv'),g=cv.getContext('2d');g.imageSmoothingEnabled=false;drawDemo(g,d.id,d.t%DEMO_LEN[d.id],d.touch);
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
// you: white hair, red coat, your blade
function dYou(x,y,face,o={}){const g=DM.g;g.save();g.translate(Math.round(x),Math.round(y));g.scale(2,2);x=0;y=0;
  face=face||1;dr(x-4,y+1,9,2,'#000',0.5);
  if(o.ghost)for(let k=1;k<=3;k++){dr(x-2-face*k*6,y-11,5,11,'#ff4a5c',0.25/k);}
  dr(x-2,y-10,5,10,'#b8142a');dr(x-2,y-10,5,2,'#ece4d7');dr(x-1,y-13,3,3,'#e8c8a8');dr(x-2,y-14,5,2,'#f4f0ea');dr(x-2,y-3,5,3,'#2a2028');
  const L=o.blade||6,c=o.red?'#ff4a5c':'#d8d4cc';for(let k=0;k<L;k++)dr(x+face*(3+k),y-7-(o.up?Math.round(k*0.5):0),1,1,k===L-1?'#ffffff':c);
  if(o.red)for(let k=0;k<L;k+=3)dr(x+face*(3+k),y-8,1,1,'#ff8a95');
  g.restore();
}
// a rōnin in a straw hat
function dFoe(x,y,o={}){const g=DM.g;g.save();g.translate(Math.round(x),Math.round(y));g.scale(2,2);x=0;y=0;try{
  if(o.dead){dr(x-5,y-2,11,3,'#3a3040',0.8);dr(x-4,y-1,2,1,'#ff4a5c');return;}
  const fl=o.flash?'#ffffff':null;dr(x-4,y+1,9,2,'#000',0.5);
  dr(x-2,y-10,5,10,fl||'#3a3040');dr(x-1,y-13,3,3,fl||'#c8a888');dr(x-4,y-14,9,2,fl||'#8a6a33');dr(x-2,y-15,5,1,fl||'#8a6a33');
  if(o.gun){dr(x-9,y-7,7,1,'#6a5a4a');dr(x-10,y-7,1,1,'#968b97');}else dr(x-7,y-7,5,1,'#968b97');
  if(o.stun)for(let k=0;k<3;k++){const a=DM.t*6+k*2.1;dr(x+Math.cos(a)*5,y-18+Math.sin(a)*1.5,1,1,'#ffe066');}
  }finally{g.restore();}
}
// a pixel hand, finger pointing up-left; the fingertip is (x,y)
const HAND=['..o.....','.o#o....','.o#o....','.o#ooo..','.o#o#ooo','oo#o#o#o','o#######o','o#######o','.o#####o.','.o#####o.','..o###o..','..ooooo..'];
function dHand(x,y,press){const g=DM.g;g.save();g.translate(Math.round(x),Math.round(y));g.scale(2,2);x=0;y=0;const ox=Math.round(x)-2,oy=Math.round(y)+(press?1:0);HAND.forEach((row,j)=>{for(let i=0;i<row.length;i++){const ch=row[i];if(ch==='o')dr(ox+i,oy+j,1,1,'#000');else if(ch==='#')dr(ox+i,oy+j,1,1,press?'#d8c8b0':'#f4ece0');}});
  if(press){dring(x,y,4,'#ffffff',1,0.7);}g.restore();}
const ARROW=['o.......','oo......','o#o.....','o##o....','o###o...','o####o..','o#####o.','o###ooo.','o#o#o...','oo.o#o..','...oo...'];
function dCursor(x,y,press){const g=DM.g;g.save();g.translate(Math.round(x),Math.round(y));g.scale(2,2);x=0;y=0;ARROW.forEach((row,j)=>{for(let i=0;i<row.length;i++){const ch=row[i];if(ch==='o')dr(x+i,y+j,1,1,'#000');else if(ch==='#')dr(x+i,y+j,1,1,'#ffffff');}});if(press)dring(x,y,4,'#ffffff',1,0.7);g.restore();}
// the mouse, with the pressed button lit
function dMouse(x,y,btn){const g=DM.g;g.save();g.translate(Math.round(x),Math.round(y));g.scale(1.6,1.6);x=0;y=0;dr(x,y,11,15,'#000');dr(x+1,y+1,9,13,'#2a2028');dr(x+1,y+1,4,6,btn==='l'?'#ff4a5c':'#4a4250');dr(x+6,y+1,4,6,btn==='r'?'#ff4a5c':'#4a4250');dr(x+5,y+1,1,6,'#000');g.restore();}
function dKey(x,y,label,down,w){w=w||11;dr(x,y+(down?1:2),w,11,'#000');dr(x,y+(down?1:0),w,10,down?'#ff4a5c':'#4a4250');dr(x+1,y+(down?2:1),w-2,8,down?'#c8203a':'#2a2028');dtext(label,x+w/2,y+(down?9:8),down?'#ffffff':'#ece4d7',8);}
function dBtn(x,y,label,down,r){const g=DM.g;g.font=`${label.length>3?6:8}px Silkscreen, monospace`;r=Math.max(r||9,Math.ceil(g.measureText(label).width/2)+3);g.beginPath();g.arc(x,y+(down?1:0),r,0,Math.PI*2);g.fillStyle=down?'#ff4a5c':'rgba(236,228,215,0.18)';g.fill();g.lineWidth=1;g.strokeStyle=down?'#ffffff':'rgba(236,228,215,0.6)';g.stroke();dtext(label,x,y+3+(down?1:0),'#ffffff',label.length>3?6:8);}
function dSpark(x,y,k,c){for(let i=0;i<8;i++){const a=i/8*Math.PI*2,r=3+k*7;dr(x+Math.cos(a)*r,y+Math.sin(a)*r,1,1,c||'#ffffff',1-k);}}
function dStick(cx,cy,dx,dy,a){const g=DM.g;g.globalAlpha=a;g.beginPath();g.arc(cx,cy,10,0,Math.PI*2);g.strokeStyle='rgba(236,228,215,0.7)';g.stroke();g.beginPath();g.arc(cx+dx,cy+dy,5,0,Math.PI*2);g.fillStyle='rgba(236,228,215,0.5)';g.fill();g.globalAlpha=1;}
// ---------- the scenes ----------
function drawDemo(g,id,t,touch){
  DM.g=g;DM.t=t;g.globalAlpha=1;g.fillStyle='#120c10';g.fillRect(0,0,DEMO_W,DEMO_H);
  for(let y=8;y<DEMO_H;y+=12)for(let x=(y/12%2)*10;x<DEMO_W;x+=20)dr(x,y,18,1,'#1c141a');
  const W=DEMO_W,H=DEMO_H,py=74;
  switch(id){
    case'move':{const u=t/3,dx=Math.sin(u*Math.PI*2)*30,dy=Math.sin(u*Math.PI*4)*-6;dYou(90+dx,py+dy,Math.cos(u*Math.PI*2)>=0?1:-1);
      if(touch){const a=seg(t,0,0.25),sx=Math.cos(u*Math.PI*2)*8,sy=Math.cos(u*Math.PI*4)*-4;dStick(28,90,sx,sy,a);dHand(28+sx,90+sy,true);}
      else{const right=Math.cos(u*Math.PI*2)>=0,up=Math.cos(u*Math.PI*4)>0;dKey(24,74,'W',up);dKey(12,86,'A',!right);dKey(24,86,'S',!up);dKey(36,86,'D',right);}break;}
    case'dash':{const k=ease(seg(t,0.9,1.15)),x=60+k*70,sw=seg(t,0.6,1.3);dFoe(165,py);
      if(sw>0&&sw<1){dline(158,py-15,158-sw*120,py-15+Math.sin(sw*3)*3,'#ff2040',1,2);}
      dYou(x,py,1,{ghost:t>0.9&&t<1.3});if(t>0.95&&t<1.4)dtext('DASH',x,py-46,'#9ad8ff',8);
      if(touch){const down=t>0.8&&t<1.1;dBtn(176,80,'DASH',down,11);dHand(178,82,down);}else{dKey(78,84,'SPACE',t>0.8&&t<1.1,44);}break;}
    case'tap':{const fx=dYou,hit=t>0.75&&t<0.95;dYou(70,py,1);dFoe(112,py,{flash:hit});
      if(t>0.72&&t<1.05){const k=seg(t,0.72,1.0);for(let i=0;i<14;i++){const a=-1.2+i/13*2.4*k;dr(70+Math.cos(a)*24,py-14+Math.sin(a)*14,2,1,i>11?'#ffffff':'#ff4a5c');}}
      const mx=96+ease(seg(t,0,0.6))*0,my=140-ease(seg(t,0,0.6))*84;
      if(touch)dHand(96,my,t>0.7&&t<0.9);else{dCursor(96,my-4,t>0.7&&t<0.9);dMouse(176,80,t>0.7&&t<0.9?'l':'');}break;}
    case'swipe':{const k=ease(seg(t,0.5,1.1)),x0=100,y0=34,x1=150,y1=96,cx=x0+(x1-x0)*k,cy=y0+(y1-y0)*k,cut=k>0.55;dYou(60,py,1);
      dFoe(126,py,{dead:cut&&t>1.05,flash:cut&&t<=1.05});
      if(t>0.5&&t<2.0){const a=t>1.2?1-seg(t,1.2,2.0):1;dline(x0,y0,cx,cy,'#ff4a5c',a,3);dline(x0,y0,cx,cy,'#ffffff',a,1);}
      const hx=t<0.5?x0+ (1-seg(t,0,0.5))*30:cx,hy=t<0.5?y0+(1-seg(t,0,0.5))*40:cy;
      if(t<1.4){if(touch)dHand(hx,hy,t>0.5&&t<1.1);else{dCursor(hx,hy,t>0.5&&t<1.1);dMouse(176,80,t>0.5&&t<1.1?'l':'');}}break;}
    case'hold':{const fill=seg(t,0.5,1.6),rel=t>1.8,k=seg(t,1.8,2.15);dYou(60,py,1,{up:!rel&&fill>0});dFoe(150,py,{flash:rel&&k>0.8&&t<2.3});
      if(t>0.4&&!rel){dring(100,py-40,7,fill>=1?(Math.floor(t*10)%2?'#ffffff':'#ff4a5c'):'#ece4d7',fill);}
      if(rel&&t<2.6){const a=1-seg(t,2.15,2.6);dline(66,py-14,66+k*86,py-14,'#ff4a5c',a,4);dline(66,py-14,66+k*86,py-14,'#ffffff',a,1);if(k>0.9)dSpark(150,py-15,seg(t,2.1,2.5));}
      if(t>0.25&&t<1.95){if(touch)dHand(100,py-40,!rel);else{dCursor(100,py-40,!rel);dMouse(176,80,t>0.4&&!rel?'l':'');}}
      if(t>0.5&&!rel)dtext(fill>=1?'LET GO':'HOLD STILL',100,py-52,fill>=1?'#ffffff':'#968b97',8);break;}
    case'parry':{const ex=150,head=seg(t,0.9,1.7),broke=t>1.32;dYou(55,py,1);dFoe(ex,py,{stun:broke});
      if(t<0.9){for(let x=ex-8;x>62;x-=4)dr(x,py-15,2,1,'#ffe066',0.3+0.3*Math.sin(t*20));dtext('!',ex,py-46,'#ffe066',8);}
      else if(!broke){const hx=ex-8-head*88;dline(ex-8,py-15,hx,py-15,'#ffe066',1,2);}
      const sx=104,k=ease(seg(t,1.05,1.35)),sy0=py-46,sy1=py+18,cy=sy0+(sy1-sy0)*k;
      if(t>1.05&&t<2.1){const a=t>1.5?1-seg(t,1.5,2.1):1;dline(sx,sy0,sx,cy,'#ff4a5c',a,3);dline(sx,sy0,sx,cy,'#ffffff',a,1);}
      if(broke&&t<2.3){dSpark(sx,py-15,seg(t,1.32,1.9),'#9ad8ff');dtext('PARRY',sx,py-40,'#9ad8ff',8);}
      if(t>0.7&&t<1.55){const hy=t<1.05?sy0:cy;if(touch)dHand(sx,hy,t>1.05&&t<1.35);else{dCursor(sx,hy,t>1.05&&t<1.35);dMouse(176,80,t>1.05&&t<1.35?'l':'');}}break;}
    case'tool':{const k=seg(t,0.65,1.0),hit=t>1.0&&t<1.25;dYou(50,py,1);dFoe(160,py-10,{gun:true,flash:hit,dead:t>1.25});
      dr(100,py-40,10,22,'#3a3040');dr(100,py-40,10,2,'#4a4250');
      if(t>0.65&&t<1.0){const x=56+k*98,y=py-15-k*2;dr(x,y,4,1,'#d8d4cc');dr(x+4,y,1,1,'#ffffff');}
      if(touch){const down=t>0.5&&t<0.75;dBtn(150,80,'KUNAI',down,11);dHand(152,82,down);}else dKey(150,80,'X',t>0.5&&t<0.75);break;}
    case'tech':{const arm=t>0.3,k=seg(t,0.6,1.8),spin=t>1.9&&t<2.9;dYou(100,py,1,{red:spin});
      dFoe(60,py,{dead:t>2.4,flash:spin&&t<=2.4});dFoe(140,py,{dead:t>2.4,flash:spin&&t<=2.4});
      const R=26,ang=-Math.PI/2+k*Math.PI*2,cx=100+Math.cos(ang)*R,cy=py-15+Math.sin(ang)*R*0.7;
      if(t>0.6&&t<2.2){const a=t>1.8?1-seg(t,1.8,2.2):1;for(let i=0;i<k*60;i++){const an=-Math.PI/2+i/60*Math.PI*2;dr(100+Math.cos(an)*R,py-15+Math.sin(an)*R*0.7,2,2,'#b8142a',a*0.9);}}
      if(spin){const s=seg(t,1.9,2.9);for(let i=0;i<6;i++){const an=s*Math.PI*6+i/6*Math.PI*2;dline(100,py-15,100+Math.cos(an)*30,py-15+Math.sin(an)*20,'#ff4a5c',1-s);}dtext('BLOOD SPIN',100,py-46,'#ff4a5c',8);}
      if(touch){const down=t>0.25&&t<0.5;dBtn(176,80,'技',down,10);if(t<0.55)dHand(178,82,down);else if(t<1.9)dHand(cx,cy,true);}
      else{dMouse(176,80,arm&&t<1.85?'r':'');if(t>0.45&&t<1.9)dCursor(cx,cy,true);if(arm&&t<1.85)dtext('HOLD',183,84,'#ff4a5c',6);}break;}
    case'heal':{const k=seg(t,0.75,1.3),hp=3+Math.round(k*2);dYou(100,py,1);
      for(let i=0;i<5;i++){const x=10+i*9,on=i<hp;dr(x,8,7,6,on?'#ff4a5c':'#3a3040');dr(x+1,7,2,1,on?'#ff4a5c':'#3a3040');dr(x+4,7,2,1,on?'#ff4a5c':'#3a3040');if(on&&i>=3&&k>0&&k<1)dSpark(x+3,10,k);}
      const orb=1-k*0.45;dr(10,20,40,4,'#2a2028');dr(10,20,Math.round(40*orb),4,'#b8142a');
      if(k>0&&k<1)for(let i=0;i<4;i++)dr(96+Math.sin(t*20+i)*6,py-24-((t*40+i*7)%16),1,1,'#ff4a5c');
      if(touch){const down=t>0.55&&t<0.8;dBtn(176,80,'HEAL',down,11);dHand(178,82,down);}else dKey(150,80,'Q',t>0.55&&t<0.8);break;}
    case'thirst':{const on=t>0.6,g2=seg(t,0.6,1.0),sl=seg(t,1.4,1.7);dYou(70,py,1,{red:on,blade:6+Math.round(g2*14)});
      if(on)for(let i=0;i<6;i++){const ph=(t*1.2+i/6)%1;dr(64+(i*5)%14,py-26+ph*22,1,1,'#ff4a5c',1-ph);}
      dFoe(130,py-16,{dead:t>1.7,flash:sl>0&&t<=1.7});dFoe(150,py+6,{dead:t>1.7,flash:sl>0&&t<=1.7});
      if(t>1.4&&t<2.3){const a=t>1.8?1-seg(t,1.8,2.3):1;dline(90,py-40,90+sl*80,py+20,'#ff2040',a,4);dline(90,py-40,90+sl*80,py+20,'#ffffff',a,1);}
      dr(10,20,40,4,'#2a2028');dr(10,20,Math.round(40*(on?1-g2*0.9:1)),4,Math.floor(t*8)%2&&!on?'#ff8a95':'#b8142a');
      if(touch){const down=t>0.4&&t<0.65;dBtn(176,80,'THIRST',down,12);dHand(178,82,down);}else dKey(150,80,'R',t>0.4&&t<0.65);break;}
  }
}

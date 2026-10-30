// ================= input, update, draw, HUD, debug, loop =================
const keys=new Set();
const joy={x:0,y:0,id:null,cx:0,cy:0};
function moveVec(){
  let x=0,y=0;
  if(keys.has('a')||keys.has('arrowleft'))x--;if(keys.has('d')||keys.has('arrowright'))x++;
  if(keys.has('w')||keys.has('arrowup'))y--;if(keys.has('s')||keys.has('arrowdown'))y++;
  x+=joy.x;y+=joy.y;const m=Math.hypot(x,y);if(m>1){x/=m;y/=m;}return{x,y};
}
const playing=()=>S.mode==='run'&&S.running&&!S.choosing&&!S.dialog&&!S.demo&&S.dead<=0;
function dash(){
  if(!playing()||S.slide||S.held||P.dashCd>0||P.dashT>0)return;
  const m=moveVec();let d;
  if(Math.hypot(m.x,m.y)<0.1){const a=Math.atan2(S.aim.y-P.y,S.aim.x-P.x);d={x:Math.cos(a),y:Math.sin(a)};}else{const l=Math.hypot(m.x,m.y);d={x:m.x/l,y:m.y/l};}
  P.dashDir=d;P.dashT=CFG.dashTime;P.dashCd=CFG.dashCd*S.mods.dashCdMul;P.inv=Math.max(P.inv,CFG.dashTime+0.07);S.dashStart={x:P.x,y:P.y};sfx('dash');tutEvent('dash');
  if(Math.abs(d.x)>0.2)S.face=d.x>0?1:-1;
}
function useKey(){if(!playing())return;if(S.prompt)interact(S.prompt);}
addEventListener('keydown',e=>{
  if(window.__bkLive!==LIVE)return;
  const k=e.key.toLowerCase();
  if(e.target.closest&&e.target.closest('input,select,textarea'))return;
  if(k==='m'){toggleSound();return;}
  if(k==='`'&&devOn()){e.preventDefault();if($('dbgOv').hidden)openDebug();else $('dbgOv').hidden=true;return;}
  if(!$('menuOv').hidden||!$('helpOv').hidden||!$('dbgOv').hidden){if(k==='escape'||(k==='p'&&S.paused)){e.preventDefault();handleBack();}return;}
  if(S.demo){e.preventDefault();if(!e.repeat&&(k===' '||k==='enter'||k==='e'))demoClose();else if(S.demo.id==='hud'&&(k==='arrowright'||k==='arrowleft'||k==='d'||k==='a'))hudTab(S.demo.tab+(k==='arrowright'||k==='d'?1:-1));return;}
  if(S.dialog){
    if(dlgMini()){if(k===' '||k==='enter'||k==='e'){e.preventDefault();if(!e.repeat)dlgPress();}return;}
    if(S.dialog.typing){if([' ','enter','e','1','2','3','4'].includes(k)){e.preventDefault();skipType();}return;}
    if(['1','2','3','4'].includes(k)){e.preventDefault();dlgChoose(+k-1);return;}
    if((k===' '||k==='enter'||k==='e')&&S.dialog.choices&&S.dialog.choices.length===1){e.preventDefault();dlgChoose(0);return;}
    return;
  }
  if(S.forgeOpen){if(k==='escape'||k==='e'){e.preventDefault();closeForge();}return;}
  if(S.choosing){if(['1','2','3','4','5'].includes(k)){e.preventDefault();chooserPick(+k-1);}else if(k==='escape'&&S.chooser&&S.chooser.cancel){e.preventDefault();chooserPick(-1);}return;}
  if(S.mode==='title'){if(!S.titleOpen){e.preventDefault();openTitleMenu();return;}
    if(['arrowdown','arrowup','s','w'].includes(k)){e.preventDefault();const bs=[...$('tMenu').querySelectorAll('button')],i=bs.indexOf(document.activeElement),j=(i+(k==='arrowdown'||k==='s'?1:-1)+bs.length)%bs.length;bs[j].focus();sfx('blip',1000);}return;}
  if(S.mode==='hub'){if(k==='escape'){$('hub').hidden=true;showTitle();return;}if(k==='enter'&&!(e.target.closest&&e.target.closest('button'))){const b=$('descendBtn');if(b)b.click();}return;}
  if(S.mode==='summary')return;
  if(S.paused){if(k==='escape'||k==='p'){e.preventDefault();resume();}return;}
  if(k==='escape'||k==='p'){pause();return;}
  if(e.target.closest&&e.target.closest('button,summary'))return;
  if([' ','arrowup','arrowdown','arrowleft','arrowright'].includes(k))e.preventDefault();
  keys.add(k);if(e.repeat)return;
  if(k===' '||k==='shift')dash();else if(k==='e')useKey();else if(k==='q')drinkBlood();else if(k==='f')mendWeapon();else if(k==='r')bloodthirst();else if(k==='g')throwWeapon();else if(k==='x')throwTool('kunai');else if(k==='c')throwTool('shuri');else if(k==='t')armTrace();
});
addEventListener('keyup',e=>keys.delete(e.key.toLowerCase()));
addEventListener('blur',()=>keys.clear());

function toScreen(e){const r=cv.getBoundingClientRect();return{x:(e.clientX-r.left)/r.width*VW,y:(e.clientY-r.top)/r.height*VH};}
const s2w=s=>({x:s.x+S.X0,y:s.y+S.Y0});
cv.addEventListener('contextmenu',e=>e.preventDefault());
function cvDown(e){
  if(dlgMini()){e.preventDefault();dlgPress();return;}
  if(!playing())return;
  if(e.button===1){e.preventDefault();throwWeapon();return;}
  if(e.button===2||(e.button===0&&e.ctrlKey)){e.preventDefault();if(S.trace)return;S.mouse=toScreen(e);if(beginTrace(e.pointerId,s2w(S.mouse))){try{cv.setPointerCapture(e.pointerId);}catch(_){}}return;}
  if(e.button!==0||S.swipe||S.trace)return;
  e.preventDefault();try{cv.setPointerCapture(e.pointerId);}catch(_){}
  S.mouse=toScreen(e);const w=s2w(S.mouse);
  if(S.traceArm){beginTrace(e.pointerId,w);return;}
  S.aim=w;S.swipe={id:e.pointerId,pts:[w],t0:performance.now(),touch:e.pointerType!=='mouse'};
}
cv.addEventListener('pointerdown',cvDown);
cv.addEventListener('pointerleave',()=>{S.mouseIn=false;});
cv.addEventListener('pointermove',e=>{
  const sc=toScreen(e);
  if(e.pointerType==='mouse'){S.mouse=sc;S.mouseIn=true;if(!S.mouseSeen){S.mouseSeen=true;cv.classList.toggle('nocur',CFG.cursor);}}
  if(S.trace&&e.pointerId===S.trace.id){S.mouse=sc;const evs=e.getCoalescedEvents?e.getCoalescedEvents():[];for(const ev of (evs.length?evs:[e]))addTracePt(s2w(toScreen(ev)));return;}
  const sw=S.swipe;if(!sw||e.pointerId!==sw.id)return;
  S.mouse=sc;
  const evs=e.getCoalescedEvents?e.getCoalescedEvents():[];
  for(const ev of (evs.length?evs:[e])){const p=s2w(toScreen(ev));if(dist(p,sw.pts[sw.pts.length-1])>=3)sw.pts.push(p);}
});
const endSwipe=e=>{if(S.trace&&e.pointerId===S.trace.id){addTracePt(s2w(toScreen(e)));endTrace();return;}if(S.swipe&&e.pointerId===S.swipe.id){const p=s2w(toScreen(e));if(dist(p,S.swipe.pts[S.swipe.pts.length-1])>=1)S.swipe.pts.push(p);releaseSwipe();}};
cv.addEventListener('pointerup',endSwipe);cv.addEventListener('pointercancel',endSwipe);
// dynamic thumbstick: touch anywhere in the lower-left zone and the stick appears under your thumb
const joyEl=$('joy'),knob=$('knob'),joyZone=$('joyZone');
function joyPlace(x,y){const zr=stageEl.getBoundingClientRect(),w=joyEl.offsetWidth;joyEl.style.left=(x-zr.left-w/2)+'px';joyEl.style.top=(y-zr.top-w/2)+'px';joyEl.style.bottom='auto';}
function joyMove(e){const max=joyEl.offsetWidth*0.36,dx=e.clientX-joy.cx,dy=e.clientY-joy.cy,d=Math.hypot(dx,dy)||1,k=Math.min(1,d/max);
  if(d>max*1.35){joy.cx+=dx/d*(d-max*1.35);joy.cy+=dy/d*(d-max*1.35);joyPlace(joy.cx,joy.cy);} // the base follows a thumb that drifts too far
  joy.x=dx/d*k;joy.y=dy/d*k;knob.style.transform=`translate(calc(-50% + ${joy.x*max}px),calc(-50% + ${joy.y*max}px))`;}
joyZone.addEventListener('pointerdown',e=>{e.preventDefault();if(joy.id!==null){cvDown(e);return;}joy.id=e.pointerId;try{joyZone.setPointerCapture(e.pointerId);}catch(_){}joy.cx=e.clientX;joy.cy=e.clientY;joyPlace(e.clientX,e.clientY);joyEl.classList.add('on');joyMove(e);});
joyZone.addEventListener('pointermove',e=>{if(e.pointerId===joy.id)joyMove(e);});
const joyEnd=e=>{if(e.pointerId===joy.id){joy.id=null;joy.x=joy.y=0;knob.style.transform='';joyEl.classList.remove('on');joyEl.style.left='';joyEl.style.top='';joyEl.style.bottom='';}};
joyZone.addEventListener('pointerup',joyEnd);joyZone.addEventListener('pointercancel',joyEnd);
// little toys: some menu pieces can be grabbed and flung, then spring back
let toy=null;
document.addEventListener('pointerdown',e=>{const el=e.target.closest&&e.target.closest('[data-toy]');if(!el||el.closest('[hidden]'))return;e.preventDefault();e.stopPropagation();
  toy={el,x0:e.clientX,y0:e.clientY,lx:e.clientX,vx:0};el.style.transition='none';el.classList.add('held');try{el.setPointerCapture(e.pointerId);}catch(_){}sfx('blip',900);},true);
document.addEventListener('pointermove',e=>{if(!toy)return;const dx=e.clientX-toy.x0,dy=e.clientY-toy.y0;toy.vx=toy.vx*0.6+(e.clientX-toy.lx)*0.4;toy.lx=e.clientX;toy.el.style.transform=`translate(${dx}px,${dy}px) rotate(${clamp(toy.vx*3,-35,35)}deg) scale(1.08)`;});
const toyUp=()=>{if(!toy)return;const el=toy.el;el.classList.remove('held');el.style.transition='transform .6s cubic-bezier(.25,1.7,.45,1)';el.style.transform='';toy=null;sfx('blip',520);};
document.addEventListener('pointerup',toyUp);document.addEventListener('pointercancel',toyUp);
// hover ticks on menu buttons
document.addEventListener('pointerover',e=>{const b=e.target.closest&&e.target.closest('.btn,.perk,.ftab,.dlg-choices button,.chip');if(b&&b!==document._hov&&e.pointerType==='mouse'){document._hov=b;if(!b.disabled)sfx('blip',1200);}});
$('tDash').addEventListener('pointerdown',e=>{e.preventDefault();dash();});
$('demoOk').addEventListener('click',e=>{e.preventDefault();demoClose();});
$('demoTabs').addEventListener('click',e=>{const b=e.target.closest('[data-hg]');if(!b)return;e.preventDefault();sfx('click');hudTab(+b.dataset.hg);});
$('tTrace').addEventListener('pointerdown',e=>{e.preventDefault();armTrace();});
for(const [id,fn] of [['tHeal',()=>drinkBlood()],['tMend',()=>mendWeapon()],['tUlt',()=>bloodthirst()],['tKunai',()=>throwTool('kunai')],['tShuri',()=>throwTool('shuri')],['tThrow',()=>throwWeapon()],['tUse',()=>useKey()]])$(id).addEventListener('pointerdown',e=>{e.preventDefault();fn();});
$('tPause').addEventListener('pointerdown',e=>{e.preventDefault();if(S.paused)resume();else pause();});
// ---------- touch + fullscreen ----------
const stageEl=$('stage'),ROOT=document.documentElement;
const COARSE=matchMedia('(pointer:coarse)').matches;
function markTouch(){if(!ROOT.classList.contains('touchui')){ROOT.classList.add('touchui');S.touchUI=true;}}
if(COARSE)markTouch();
addEventListener('pointerdown',e=>{if(e.pointerType==='touch')markTouch();},{capture:true,passive:true});
let fsNative=false;
const isFS=()=>stageEl.classList.contains('fs');
function enterFS(){
  stageEl.classList.add('fs');ROOT.classList.add('fsmode');
  const rq=stageEl.requestFullscreen||stageEl.webkitRequestFullscreen;
  if(rq&&!(document.fullscreenElement||document.webkitFullscreenElement)){try{fsNative=true;const pr=rq.call(stageEl,{navigationUI:'hide'});if(pr&&pr.catch)pr.catch(()=>{fsNative=false;});}catch(_){fsNative=false;}}
  try{const o=screen.orientation;if(o&&o.lock){const pr=o.lock('landscape');if(pr&&pr.catch)pr.catch(()=>{});}}catch(_){}
  scrollTo(0,0);
}
function exitFS(){
  stageEl.classList.remove('fs');ROOT.classList.remove('fsmode');
  if(document.fullscreenElement||document.webkitFullscreenElement){try{(document.exitFullscreen||document.webkitExitFullscreen).call(document);}catch(_){}}fsNative=false;
}
function toggleFS(){if(isFS())exitFS();else enterFS();}
const fsChange=()=>{if(!(document.fullscreenElement||document.webkitFullscreenElement)&&fsNative){fsNative=false;exitFS();}};
document.addEventListener('fullscreenchange',fsChange);document.addEventListener('webkitfullscreenchange',fsChange);

function syncSnd(){$('sndBtn').textContent=CFG.sound?'Sound on':'Sound off';}
function toggleSound(){CFG.sound=!CFG.sound;save();auInit();auVol();syncSnd();syncDebug();}
$('sndBtn').addEventListener('click',e=>{toggleSound();e.currentTarget.blur();});
document.addEventListener('visibilitychange',()=>{if(document.hidden&&S.mode==='run'&&S.running&&!S.choosing&&!S.dialog)pause();});

// ---------- camera ----------
function updateCam(dt){
  if(!Number.isFinite(P.x)||!Number.isFinite(P.y)){const R=S.room;P.x=R?R.w/2:VW/2;P.y=R?R.h/2:VH/2;P.vx=P.vy=P.kx=P.ky=0;S.slide=null;}
  if(!Number.isFinite(S.kick.x)||!Number.isFinite(S.kick.y)){S.kick.x=0;S.kick.y=0;}
  if(!Number.isFinite(S.aim.x)||!Number.isFinite(S.aim.y))S.aim={x:P.x+60,y:P.y};
  if(!Number.isFinite(S.cam.x)||!Number.isFinite(S.cam.y)){S.cam.x=P.x;S.cam.y=P.y;}
  if(!Number.isFinite(S.ts))S.ts=1;if(!(S.hitstop<2))S.hitstop=0;
  const R=S.room;if(!R)return;
  let tx=P.x,ty=P.y-14;if(!S.swipe&&S.mode==='run'){tx+=(S.aim.x-P.x)*CFG.camLead;ty+=(S.aim.y-P.y)*CFG.camLead;}
  const k=Math.min(1,dt*(S.slide?14:7));S.cam.x+=(tx-S.cam.x)*k;S.cam.y+=(ty-S.cam.y)*k;
  const cc=(v,W,V)=>W<=V?W/2:clamp(v,V/2,W-V/2);
  S.cam.x=cc(S.cam.x,R.w,VW);S.cam.y=cc(S.cam.y,R.h,VH);
  const kx=RM||!CFG.shake?0:S.kick.x,ky=RM||!CFG.shake?0:S.kick.y;
  S.X0=Math.round((cc(S.cam.x+kx,R.w,VW)-VW/2)/PX)*PX;S.Y0=Math.round((cc(S.cam.y+ky,R.h,VH)-VH/2)/PX)*PX;
}

// ---------- update ----------
function update(dt){
  if(S.gmx&&!S.inHub){if(S.gmx.speed!==1)dt*=S.gmx.speed;
    if(S.gmx.tide&&S.floor&&!['store','arena','hub'].includes(S.floor.kind)&&S.dead<=0){S.tideT=(S.tideT==null?90:S.tideT)-dt;if(S.tideT<=0){S.tideTick=(S.tideTick||0)-dt;if(S.tideTick<=0){S.tideTick=10;if(P.inv<=0)hurtPlayer({owner:null,hazName:'the rising tide'},true);}}}}
  if(S.trans){updateTrans(dt);updateCam(dt);return;}
  if(S.swipe&&performance.now()-S.swipe.t0>(S.swipe.hold&&curW().id==='yari'?3200:S.swipe.hold&&curW().id==='kusari'?2400:1500))releaseSwipe();
  if(S.slowT>0)S.slowT-=dt;
  if(S.banner){S.banner.t-=dt;if(S.banner.t<=0)S.banner=null;}
  if(!S.banner&&S.featBanner){S.banner=S.featBanner;S.featBanner=null;}
  if(S.itemBanner){S.itemBanner.t-=dt;if(S.itemBanner.t<=0)S.itemBanner=null;}
  const tracing=!!(S.trace||S.traceArm);
  const target=(tracing?traceSlowT():(S.swipe&&CFG.slowmoOn?CFG.slowmo:1)*(S.slowT>0?CFG.parrySlow:1))*CFG.timeScale;
  S.ts+=(target-S.ts)*Math.min(1,dt*(target<S.ts?30:8));
  let gdt=dt*S.ts,pdt=gdt;
  if(S.hitstop>0){S.hitstop-=dt;gdt=0;pdt=dt*0.18;if(S.hitstop<=0){S.hitstop=0;S.pauseVictims.clear();}}
  S.cdTap=Math.max(0,S.cdTap-gdt);S.cdCut=Math.max(0,S.cdCut-gdt);S.cdLock=Math.max(0,S.cdLock-gdt);
  for(const k in S.abCd)if(S.abCd[k]>0){S.abCd[k]-=gdt;if(S.abCd[k]<=0){S.abCd[k]=0;if(k==='teleport')sfx('ready');}}
  if(S.buffer&&!S.swipe){const b=S.buffer;if(cutWait(swipeIsTap(b))<=0){S.buffer=null;S.swipe=b;releaseSwipe();}else if(S.gt-b.bufT>0.3)S.buffer=null;}
  if(S.denyT>0)S.denyT-=dt;
  S.gt+=gdt;
  S.shake=Math.max(0,S.shake-dt*32);S.hurt=Math.max(0,S.hurt-dt*2.5);S.bladeFlash=Math.max(0,S.bladeFlash-dt*5);
  S.flash=Math.max(0,S.flash-dt);const kd0=Math.max(0,1-dt*12);S.kick.x*=kd0;S.kick.y*=kd0;S.comboPop=Math.max(0,S.comboPop-dt*6);
  if(S.comboT>0){S.comboT-=gdt;if(S.comboT<=0)S.combo=0;}
  if(S.stats&&S.dead<=0)S.stats.time+=dt;
  if(S.anim){S.anim.t+=gdt;if(S.anim.t>(S.anim.kind==='down'?0.24:0.22))S.anim=null;}
  if(CFG.infMeter)addMeter(999);
  updateWeapons(gdt);
  if(!S.swipe&&!S.trace)S.aim=s2w(S.mouse);
  if(!S.anim&&Math.abs(S.aim.x-P.x)>3)S.face=S.aim.x>P.x?1:-1;
  updateParts(pdt);updateCorpses(gdt);updateAmbient(gdt);
  for(const b of S.bolts)b.life-=dt;S.bolts=S.bolts.filter(b=>b.life>0);
  if(S.dead>0){S.dead-=dt;if(S.dead<=0)onDeath();updateCam(dt);return;}

  P.dashCd=Math.max(0,P.dashCd-gdt);P.inv=Math.max(0,P.inv-gdt);if(P.slowT>0)P.slowT-=gdt;
  let moving=false;
  if(updateLeap(gdt)){}
  else if(S.slide){
    const sl=S.slide;sl.t+=gdt;const u=Math.min(1,sl.t/sl.dur),dd=easeOut(u)*sl.len;
    let i=1;while(i<sl.cum.length-1&&sl.cum[i]<dd)i++;
    const a=sl.pts[i-1],b=sl.pts[i],seg=(sl.cum[i]-sl.cum[i-1])||1,t=clamp((dd-sl.cum[i-1])/seg,0,1);
    P.x=a.x+(b.x-a.x)*t;P.y=a.y+(b.y-a.y)*t;P.vx=P.vy=0;
    S.ghosts.push({x:P.x,y:P.y,look:'player',face:S.face,life:0.2});if(u>=1)S.slide=null;
  }else if(P.dashT>0){
    P.dashT-=gdt;P.x+=P.dashDir.x*CFG.dashSpeed*gdt;P.y+=P.dashDir.y*CFG.dashSpeed*gdt;S.ghosts.push({x:P.x,y:P.y,look:'player',face:S.face,life:0.2});
    if(P.dashT<=0){
      if(S.mods.afterimage&&S.dashStart){const end={x:P.x,y:P.y};if(dist(S.dashStart,end)>20)S.slashes.push(makeCut([S.dashStart,end],1e6,{team:'p',ult:false,ab:{},hr:CFG.hitRadius,child:true}));}
      if(S.mods.foxdash){burstAt({x:P.x,y:P.y-10},{ab:{},ult:false,fox:true,pts:null,team:'p',hits:new Set(),d:0,len:1,cum:[0,1]},60);sfx('fox');for(let i=0;i<10;i++)S.parts.push({x:P.x,y:P.y-10,vx:rand(-120,120),vy:rand(-120,60),life:0.5,max:0.5,size:1,col:C.fox});}
      S.dashStart=null;
    }
  }else{const m=moveVec(),sp=CFG.moveSpeed*S.mods.moveMul*(P.slowT>0?0.5:1)*(S.drink?0.3:1),k=Math.min(1,gdt*14);P.vx+=(m.x*sp-P.vx)*k;P.vy+=(m.y*sp-P.vy)*k;P.x+=P.vx*gdt;P.y+=P.vy*gdt;moving=Math.hypot(P.vx,P.vy)>40;if(moving&&!S.anim&&Math.abs(P.vx)>30&&!S.mouseSeen)S.face=P.vx>0?1:-1;}
  P.moving=moving;
  if(S.drink){const dr=S.drink;dr.t+=gdt;const t=S.tipW;if(Math.random()<gdt*40){const a=Math.random()*Math.PI*2;S.parts.push({x:P.x+Math.cos(a)*30,y:P.y-14+Math.sin(a)*30,vx:-Math.cos(a)*70,vy:-Math.sin(a)*70,life:0.4,max:0.4,size:1,col:Math.random()<0.5?C.hi:C.blood});}
    if(dr.t>=dr.dur){S.drink=null;S.meter=Math.max(0,S.meter-dr.need);S.full=S.meter>=100;heal(S.mods.drinkHeal);if(capOn('orb','trans')&&P.wpn&&P.wpn.dur<P.wpn.max){P.wpn.dur=Math.min(P.wpn.max,P.wpn.dur+P.wpn.max/2);text(P.x,P.y-62,'TRANSFUSED',C.steel);}sfx('drank');S.flash=Math.max(S.flash,0.08);burst(P.x,P.y-14,18,C.hi,200,0.5,2);}}
  if(moving){P.stepT-=gdt;if(P.stepT<=0){P.stepT=0.24;P.alt=!P.alt;sfx('step',P.alt);burst(P.x+(P.alt?4:-4),P.y+P.r*0.6,2,'#5a4a50',40,0.3,1);
    for(const p of S.room.pools)if(dist(p,P)<p.r){P.bloody=8;break;}
    if(P.bloody>0){P.bloody--;const d=D();d.fillStyle=P.bloody>4?'#5e0a16':'#3e0810';d.fillRect(Math.round(P.x/PX)+(P.alt?2:-2),Math.round((P.y+P.r*0.6)/PX),1,1);}}}
  if(btOn()&&Math.random()<gdt*30){const t=S.tipW;S.parts.push({x:t.x,y:t.y,vx:rand(-10,10),vy:rand(40,90),life:0.35,max:0.35,size:1,col:C.blood,stamp:true});}
  if(P.hp===1){S.heartT-=dt;if(S.heartT<=0){S.heartT=0.9;sfx('heart');S.hurt=Math.max(S.hurt,0.35);}}
  P.x+=P.kx*gdt;P.y+=P.ky*gdt;const kd=Math.max(0,1-gdt*8);P.kx*=kd;P.ky*=kd;
  if(!S.leap&&pushOut(P,P.r,true)&&P.dashT>0)P.dashT=Math.min(P.dashT,0.02);
  updateHazards(gdt);
  clampPlayer();
  if(S.trans)return;

  for(const e of [...S.enemies])updateEnemy(e,gdt);
  for(let i=0;i<S.enemies.length;i++){const a=S.enemies[i];
    for(let j=i+1;j<S.enemies.length;j++){const b=S.enemies[j],dx=b.x-a.x,dy=b.y-a.y,d=Math.hypot(dx,dy)||1,m=a.r+b.r+4;if(d<m){const p=(m-d)/2;a.x-=dx/d*p;a.y-=dy/d*p;b.x+=dx/d*p;b.y+=dy/d*p;}}
    if(a.state!=='spawn'&&a.state!=='strike'&&!S.slide&&!S.leap&&!a.T.fly){const dx=a.x-P.x,dy=a.y-P.y,d=Math.hypot(dx,dy)||1,m=a.r+P.r;if(d<m){a.x+=dx/d*(m-d);a.y+=dy/d*(m-d);}}
    Object.assign(a,inArena(a,a.r));pushOut(a,a.r,!(a.T.fly||a.T.blink||a.T.kamikaze||a.T.phase||a.smoke||a.T.sumo));
  }
  stepCuts(gdt);updateShots(gdt);updateFoes(gdt);updateOrbs(gdt);updateObjs(gdt);updateEvent(gdt);updateFollower(gdt);if(S.trans)return;
  for(const o of S.room.objs)if(o.leaving!==undefined){o.leaving-=gdt;if(o.leaving<=0)o.gone=true;}
  for(const p of S.pending)p.t-=gdt;
  const due=S.pending.filter(p=>p.t<=0);S.pending=S.pending.filter(p=>p.t>0);for(const p of due)p.fn();
  checkRoomState();
  updateCam(dt);
}
function updateParts(gdt){
  for(const p of S.parts){p.x+=p.vx*gdt;p.y+=p.vy*gdt;const k=Math.max(0,1-gdt*5);p.vx*=k;p.vy*=k;p.life-=gdt;if(p.life<=0&&p.stamp&&S.room)stamp(p.x,p.y+10,p.size*2,0.5);}
  S.parts=S.parts.filter(p=>p.life>0);
  for(const t of S.texts){t.t-=gdt;t.y-=22*gdt;}S.texts=S.texts.filter(t=>t.t>0);
  for(const g of S.ghosts)g.life-=gdt;S.ghosts=S.ghosts.filter(g=>g.life>0);
  for(const r of S.rings)r.life-=gdt;S.rings=S.rings.filter(r=>r.life>0);
  for(const m of S.marks)m.life-=gdt;S.marks=S.marks.filter(m=>m.life>0);
}

// ---------- drawing ----------
const LX=x=>(x-S.X0)/PX,LY=y=>(y-S.Y0)/PX;
const travelProf=u=>u<0.9?Math.pow(u/0.9,0.6):(1-u)/0.1;
const lensProf=u=>Math.pow(Math.sin(Math.PI*u),0.7);
function pxSliver(s,from,to,hw,prof,edge,core,a){
  const span=to-from;if(span<0.5)return;const n=Math.max(2,Math.ceil(span/2));
  for(let i=0;i<=n;i++){const d=from+span*i/n,p=posAt(s,d),t=tangentAt(s,d),w=hw*prof(i/n),r=Math.round(w),cr=Math.floor(w*0.4),x=LX(p.x),y=LY(p.y);
    if(r<=0){pset(x,y,edge,a);continue;}for(let k=-r;k<=r;k++)pset(x-t.y*k,y+t.x*k,Math.abs(k)<=cr?core:edge,a);}
}
// thirst skins with a slash of their own: fire licks up off a hellfire cut; a blood moon cut is dark, silver-rimmed and drips
function drawSkinCut(s,wpx){
  const T=thirstSkin();if(!T.cutfx)return false;
  const fading=s.done&&s.linger<=0,a=fading?clamp(s.fade/s.fadeMax,0,1):1;
  if(T.cutfx==='fire'){
    drawCut(s,'#3a0a00',HEAT[2],wpx*1.5);drawCut(s,'#fff6c0',(S.gt*14|0)%2?HEAT[3]:HEAT[2],wpx);
    for(let d=0;d<s.d;d+=3){const p=posAt(s,d),x=LX(p.x),y=LY(p.y),f=Math.sin(d*0.55+S.gt*24)+0.6*Math.sin(d*0.21-S.gt*9),h=Math.max(0,Math.round((f+1)*2.6*a));
      for(let j=1;j<=h;j++)pset(x+Math.round(Math.sin(S.gt*30+d+j)*0.6),y-2-j,HEAT[clamp(4-j,0,4)],a*(1-j/(h+2)));
      if(h>4&&(d/3+(S.gt*20|0))%5===0)pset(x,y-h-4,'#1a0a08',a*0.6);}
    return true;}
  if(T.cutfx==='moon'){
    const b=tsBeat();drawCut(s,'#f0e8ff','#f0e8ff',wpx*1.45);drawCut(s,'#0a0004',b>0.4?'#ff3050':'#c0001e',wpx*(1+0.3*b));
    for(let d=9;d<s.d;d+=22){const p=posAt(s,d),t=tangentAt(s,d),x=LX(p.x)-t.y*5,y=LY(p.y)+t.x*5-4;// little crescent moons beside the cut
      for(let i=0;i<9;i++){const an=Math.PI*0.35+i/8*Math.PI*1.3;pset(x+Math.cos(an)*2.5,y+Math.sin(an)*2.5,'#f0e8ff',a);}}
    for(let d=4;d<s.d;d+=7){const p=posAt(s,d),ph=((S.gt*1.6)+d*0.13)%1;if(ph>0.85)continue;const x=LX(p.x),y=LY(p.y)+2+ph*9;pset(x,y,'#ff1030',a*(1-ph));pset(x,y-1,'#a0001a',a*(1-ph)*0.7);}
    return true;}
  return false;
}
function drawCut(s,core,edge,wpx){
  const fading=s.done&&s.linger<=0,a=fading?clamp(s.fade/s.fadeMax,0,1):1;
  if(!s.done&&s.d<s.len&&!s.isTap&&s.kind!=='kunai'){const step=6;for(let d=Math.ceil(s.d/step)*step;d<s.len;d+=step){const p=posAt(s,d);pset(LX(p.x),LY(p.y),edge,0.6);}}
  if(s.d>0.5&&s.kind!=='kunai'){let prof=travelProf,w=wpx/2;
    if(s.done){prof=lensProf;w=s.linger>0?wpx*(0.3+0.1*Math.round(Math.sin(S.gt*30))):wpx/2*(0.4+0.6*a);}
    pxSliver(s,0,s.d,w,prof,edge,core,fading?a:1);}
  if(!s.done){const h=head(s),t=tangentAt(s,s.d),x=LX(h.x),y=LY(h.y);
    if(s.kind==='arrow'){pline(x-t.x*7,y-t.y*7,x,y,'#8a6a33');pset(x,y,C.white);pset(x-t.y,y+t.x,C.steel);pset(x+t.y,y-t.x,C.steel);pset(x-t.x*7-t.y,y-t.y*7+t.x,C.bone);pset(x-t.x*7+t.y,y-t.y*7-t.x,C.bone);}
    else if(s.kind==='shuriken'){const r=(S.gt*20|0)%2;for(const [dx,dy] of r?[[0,-2],[0,2],[-2,0],[2,0]]:[[-2,-2],[2,2],[-2,2],[2,-2]])pset(x+dx,y+dy,C.steel);pset(x,y,C.white);pset(x+1,y,C.steel);pset(x-1,y,C.steel);pset(x,y+1,C.steel);pset(x,y-1,C.steel);}
    else if(s.kind==='thrown'){flush();const ic=icon('w_'+s.wicon),r=Math.floor(S.gt*16)%4;lx.save();lx.translate(x,y);lx.rotate(r*Math.PI/2);lx.drawImage(ic,-8,-8);lx.restore();}
    else if(s.kind==='bullet'){pline(x-t.x*10,y-t.y*10,x,y,s.blood?C.hi:'#ffe7a8',0.7);pset(x,y,C.white);pset(x+t.x,y+t.y,C.white);}
    else if(s.kind==='kunai'){pline(x-t.x*6,y-t.y*6,x,y,C.steel);pset(x,y,C.white);pline(x-t.x*6,y-t.y*6,x-t.x*9,y-t.y*9,'#3a2a1c');pset(x-t.x*10,y-t.y*10,C.hi);}
    else if(s.kind==='boomer'){const r=(S.gt*24|0)%2;for(const [dx,dy] of r?[[0,-3],[0,3],[-3,0],[3,0]]:[[-2,-2],[2,2],[-2,2],[2,-2]])pline(x,y,x+dx,y+dy,C.hi);pset(x,y,C.white);}
    else if(s.kind==='crescent'){pline(x-t.y*3,y+t.x*3,x+t.x*2,y+t.y*2,C.white);pline(x+t.y*3,y-t.x*3,x+t.x*2,y+t.y*2,C.white);}
    else if(s.kind==='chain'){forTrail(s,(a,b)=>{const n=Math.ceil(dist(a,b)/6);for(let i=0;i<=n;i+=1){const q={x:a.x+(b.x-a.x)*i/n,y:a.y+(b.y-a.y)*i/n};pset(LX(q.x),LY(q.y),i%2?'#8a8a92':C.steel);}return false;});pline(x,y,x-t.y*4,y+t.x*4,C.white);pline(x,y,x-t.x*3,y-t.y*3,'#6b4423');}
    else if(s.kind==='neck'){if(SPR.rokuroHead){const img=t.x<0?SPR.rokuroHead.l:SPR.rokuroHead.c;lx.drawImage(img,Math.round(x-6),Math.round(y-8));}}
    else{pset(x,y,C.white);pset(x+t.x,y+t.y,C.white);pset(x+t.x*2,y+t.y*2,core);pset(x-t.y,y+t.x,core);pset(x+t.y,y-t.x,core);}}
  if(s.blocked&&s.blockAt){const x=LX(s.blockAt.x),y=LY(s.blockAt.y);for(let k=-2;k<=2;k++){pset(x+k,y+k,C.bone,a);pset(x+k,y-k,C.bone,a);}}
}
function drawSpr(key,f,x,y,face,white,alpha,flip){
  const sp=SPR[key];if(!sp)return null;f=Math.min(f,sp.frames.length-1);
  const fl=flip!==undefined?flip:face<0,img=white?(fl?sp.wl:sp.wr)[f]:(fl?sp.l:sp.r)[f],ax=fl?sp.w-1-sp.ax:sp.ax;
  const sx=Math.round(LX(x)-ax),sy=Math.round(LY(y)-sp.ay);
  if(alpha!==undefined&&alpha<1)lx.globalAlpha=alpha;lx.drawImage(img,sx,sy);lx.globalAlpha=1;
  const h=sp.frames[f].hand;return{sx,sy,fl,sp,hand:{x:sx+(fl?sp.w-1-h.x:h.x),y:sy+h.y}};
}
function shadow(x,y,r){const cx=Math.round(LX(x)),cy=Math.round(LY(y)),w=Math.max(3,Math.round(r/PX*1.25)),h=Math.max(1,Math.round(w*0.35));lx.fillStyle='rgba(5,3,5,0.5)';for(let yy=-h;yy<=h;yy++){const ww=Math.round(w*Math.sqrt(Math.max(0,1-(yy*yy)/((h+0.5)*(h+0.5)))));lx.fillRect(cx-ww,cy+yy,ww*2+1,1);}}
function weapon(kind,h,face,pose,scale){
  let a;
  if(pose==='wind'||pose==='draw')a=face>0?-2.35:-0.79;else if(pose==='strike')a=face>0?0.15:Math.PI-0.15;else if(pose==='guard')a=-Math.PI/2+face*0.25;else a=face>0?0.95:Math.PI-0.95;
  const c=Math.cos(a),s=Math.sin(a),L=n=>n*scale,hx=h.x,hy=h.y,seg=(from,to,col,th)=>pline(hx+c*L(from),hy+s*L(from),hx+c*L(to),hy+s*L(to),col,1,th);
  switch(kind){
    case'katana':seg(-3,-1,'#2a1a10');pset(hx,hy,C.curse);seg(1,10,C.steel,scale>1.4?2:1);pset(hx+c*L(10),hy+s*L(10),C.white);break;
    case'yari':seg(-6,16,'#6b4423');seg(16,20,C.steel);pset(hx+c*L(20),hy+s*L(20),C.white);break;
    case'kanabo':seg(-2,0,'#2a1a10');seg(0,11,'#2b2b2b',2);for(let k=3;k<=11;k+=3)pset(hx+c*L(k)-s,hy+s*L(k)+c,'#8a8a8a');break;
    case'tanto':pset(hx,hy,C.curse);seg(1,5,C.steel);break;
    case'oar':seg(-4,14,'#6b4423');{const c2=Math.cos(a),s2=Math.sin(a);for(let k=12;k<18;k++)for(let j=-1;j<=1;j++)pset(hx+c2*L(k)-s2*j,hy+s2*L(k)+c2*j,'#8a5a2e');}break;
    case'staff':seg(-6,16,'#8a6a3a');pset(hx+c*L(16),hy+s*L(16),C.steel);pset(hx+c*L(17),hy+s*L(17),C.white);break;
    case'naginata':seg(-6,14,'#6b4423');seg(14,18,C.steel);pset(hx+c*L(18)-s*1.5,hy+s*L(18)+c*1.5,C.steel);break;
    case'twin':seg(-3,-1,'#2a1a10');pset(hx,hy,C.curse);seg(1,10,C.steel,scale>1.4?2:1);pset(hx+c*L(10),hy+s*L(10),C.white);{const c2=Math.cos(a+0.9*face),s2=Math.sin(a+0.9*face);pline(hx+c2*L(1),hy+s2*L(1),hx+c2*L(7),hy+s2*L(7),C.steel);}break;
    case'chain':{pset(hx,hy,'#6b4423');pline(hx,hy,hx+c*L(4),hy+s*L(4),'#6b4423');const tx=hx+c*L(4),ty=hy+s*L(4);pline(tx,ty,tx-s*L(3)*face,ty+c*L(3)*face,C.steel);for(let k=1;k<6;k++)pset(hx-face*k*0.8,hy+k*1.4+Math.sin(S.gt*6+k)*0.6,'#8a8a92');break;}
    case'ladle':seg(-2,9,'#8a6a3a');{const bx=hx+c*L(10),by=hy+s*L(10);pdisc(bx,by,1,'#6a4a2a');pset(bx,by,C.water);}break;
    case'musket':seg(-5,-1,'#6b4423',2);seg(-1,14,'#4a4a52');pset(hx+c*L(14),hy+s*L(14),'#2a2a2a');if(pose==='draw')for(let k=0;k<2;k++)pset(hx+c*L(15+k),hy+s*L(15+k),'#ffd27a',0.6);break;
    case'fan':{for(let i=-2;i<=2;i++){const aa=a+i*0.22;pline(hx,hy,hx+Math.cos(aa)*6*scale,hy+Math.sin(aa)*6*scale,i%2?'#5a8a3a':'#7aaa4a');}break;}
    case'bow':{const f=face;for(let k=-7;k<=7;k++){pset(hx+f*(1+Math.round(3*Math.cos(k/7*Math.PI/2))),hy+k,'#6b4423');}
      const pull=pose==='draw'?3:0;pline(hx+f,hy-7,hx+f*(1-pull),hy,'#dddddd',0.8);pline(hx+f*(1-pull),hy,hx+f,hy+7,'#dddddd',0.8);if(pose==='draw')pline(hx-f*pull,hy,hx+f*9,hy,'#8a6a33');break;}
  }
}
function playerFrame(){if(S.drink)return 3;if(S.anim){const t=S.anim.t;if(S.anim.kind==='down')return t<0.05?3:t<0.11?4:5;return t<0.07?6:7;}if(P.moving)return[0,1,2,1][Math.floor(S.gt*9)%4];return 0;}
function playerFlip(){if(S.anim)return S.anim.dir.x<0;return S.face<0;}
function drawPlayer(){
  if(S.dead>0||P.hp<=0||!SPR.player)return;
  const z=P.z||0;shadow(P.x,P.y+P.r*0.6,P.r*(1-Math.min(0.5,z/220)));
  const blink=P.inv>0&&P.dashT<=0&&!S.slide&&!S.leap&&S.hitstop<=0&&!S.counter&&Math.floor(S.gt*20)%2===0,pj=pauseJitter(P),struck=pj!==0;
  const o=drawSpr('player',S.leap?4:playerFrame(),P.x+pj*PX,P.y+P.r*0.6-z,1,blink||struck,blink&&!struck?0.6:1,playerFlip());if(!o)return;
  if(P.shield>0){const bx=o.fl?o.sx+22:o.sx+6,by=o.sy+4;for(let i=0;i<5;i++)pline(bx-i,by+i,bx+i,by+i,i%2?'#a8323a':'#c84a52');pline(bx,by+4,bx,by+12,'#6b4423');}
  if(P.slowT>0)for(let i=0;i<4;i++)pline(o.sx+8+i*4,o.sy+14,o.sx+12+i*2,o.sy+30,C.web,0.5);
  // the weapon in hand
  const sw=S.swipe,h=o.hand,holdA=sw&&sw.hold?holdAim(sw):null,a=S.anim?Math.atan2(S.anim.dir.y,S.anim.dir.x):holdA!==null?holdA:Math.atan2(LY(S.aim.y)-h.y,LX(S.aim.x)-h.x),c=Math.cos(a),s=Math.sin(a),tired=S.cdCut>0.05||!!S.drink;
  // the sprite's own swing frames carry the cut, so the weapon in hand steps aside until the swing ends
  const L=S.anim&&curW().style!=='gun'?0:drawHeld(h,a,curW().id,wBroken(),btFor(curW().id),tired,P.wpn&&P.wpn.cursed);S.tipW={x:S.X0+(h.x+c*L)*PX,y:S.Y0+(h.y+s*L)*PX};
  if(btOn()||S.btFx){const T=thirstSkin(),ax=LX(P.x),ay=LY(P.y)-8-(P.z||0)/PX;if(btOn())thirstAura(T,S.gt,ax,ay,S.bt&&S.bt.t<0.4?S.bt.t/0.4:1);if(S.btFx){const u=(S.gt-S.btFx)/0.7;if(u>1)S.btFx=null;else thirstAct(T,u,ax,ay,S.gt);}}
  drawOrb();
  // stances, charge, reload
  const px=LX(P.x),py=LY(P.y-14-z);
  if(S.counter){const cs=S.counter,k=cs.t/cs.max,n=28;for(let i=0;i<n;i++){if(i/n>k)break;const an=-Math.PI/2+i/n*Math.PI*2+S.gt*2;pset(px+Math.cos(an)*15,py+Math.sin(an)*13,cs.col);}if(Math.floor(S.gt*8)%2)ptext(cs.glyph,px,py-24,cs.col,8);}
  if(sw&&sw.hold){const k=sw.k||0,W=curW(),col=k>=1?(Math.floor(S.gt*12)%2?C.white:C.hi):C.bone,n=32;for(let i=0;i<n;i++){if(i/n>k)break;const an=-Math.PI/2+i/n*Math.PI*2;pset(px+Math.cos(an)*12,py+10+Math.sin(an)*5,col);}
    if(W.id==='yari'&&!wBroken()){const R=140*reachMul('yari')/PX;for(const o2 of [-0.7,0.7])for(let d=6;d<R;d+=4)pset(px+Math.cos(a+o2)*d,py+Math.sin(a+o2)*d,C.steel,0.5);}
    if(W.id==='musket'&&(!wBroken()||btFor('musket'))&&S.reload<=0){const R=(80+260*k)/PX;for(let d=8;d<R;d+=2)pset(px+Math.cos(a)*d,py+Math.sin(a)*d,k>=1?C.hi:'#ff8a95',0.7);}
    if(W.id==='kusari'&&!wBroken()){for(let i=0;i<14;i++){const an=S.gt*14+i/14*Math.PI*2,r=34;pset(px+Math.cos(an)*r,py+10+Math.sin(an)*r*0.8,i%2?'#8a8a92':C.steel);}const an=S.gt*14;pdisc(px+Math.cos(an)*38,py+10+Math.sin(an)*30,1,C.white);}}
  if(curW().id==='musket'&&S.reload>0&&!wBroken()){const bw=26,bx=Math.round(px-bw/2),by=Math.round(py-30),f=1-S.reload/Math.max(0.01,S.reloadMax),[w0,w1]=reloadWin();flush();lx.fillStyle='#000';lx.fillRect(bx-1,by-1,bw+2,4);lx.fillStyle='#2a2028';lx.fillRect(bx,by,bw,2);
    lx.fillStyle=S.jam?'#5a4a52':C.mon;lx.fillRect(bx+Math.round(bw*w0),by,Math.max(1,Math.round(bw*(w1-w0))),2);lx.fillStyle=S.jam?C.ash:C.white;lx.fillRect(bx+Math.round(bw*f),by-1,1,4);}
  if(S.touchUI){flush();const bx=Math.round(LX(P.x))-7,by=Math.round(LY(P.y+P.r*0.6))+3;if(S.cdTap>0&&S.cdTapMax>0){lx.fillStyle='#000';lx.fillRect(bx-1,by-1,16,3);lx.fillStyle=C.bone;lx.fillRect(bx,by,Math.round(14*S.cdTap/S.cdTapMax),1);}if(S.cdCut>0&&S.cdCutMax>0){lx.fillStyle='#000';lx.fillRect(bx-1,by+2,16,3);lx.fillStyle=C.hi;lx.fillRect(bx,by+3,Math.round(14*S.cdCut/S.cdCutMax),1);}}
}
// the weapon in hand. Everything is captured, joined into solid lines and outlined in black; skins only change colours.
function bloodGrow(P2,k0,n,g,jf){const m=Math.round(n*g);for(let i=0;i<m;i++){const k=k0+i,q=P2(k,jf?jf(k):0);pset(q.x,q.y,tsGrow(i));tsLick(P2,k,i);}if(m>0){const q=P2(k0+m,jf?jf(k0+m):0);pset(q.x,q.y,tsGlint());}return k0+m;}
function drawHeld(h,a,id,broken,blood,tired,cursed,opt){
  const c=Math.cos(a),s=Math.sin(a),P2=(k,j)=>({x:h.x+c*k-s*(j||0),y:h.y+s*k+c*(j||0)}),seg=(k0,k1,col,th,j)=>{const A=P2(k0,j),B=P2(k1,j);pline(A.x,A.y,B.x,B.y,col,1,th);};
  const pk=(k,j,col)=>{const q=P2(k,j);pset(q.x,q.y,col);},bend=(k0,j0,k1,j1,col)=>{const A=P2(k0,j0),B=P2(k1,j1);pline(A.x,A.y,B.x,B.y,col);};
  const SK=opt&&opt.skin||wSkinCols(id),steel=tired&&SK.dflt?'#6a7076':SK.b,glow=blood?(Math.floor(S.gt*14)%2?tsGlint():tsGrow(2)):cursed?C.phase:SK.glow&&!tired?SK.glow:null;let tip=6;
  const up=opt&&opt.face?-opt.face:-S.face,g=opt&&opt.g!=null?opt.g:blood&&S.bt?Math.min(1,(S.bt.max-S.bt.t)/0.3):0;
  capBegin();
  switch(id){
    case'reserve':seg(-3,-1,SK.h);pset(h.x,h.y,SK.t);seg(1,5,steel);tip=6;if(blood){for(let k=6;k<22;k++){pk(k,0,tsGrow(k));tsLick(P2,k,k);}tip=22;}break;
    case'katana':seg(-4,-1,SK.h);pset(h.x,h.y,SK.t);pk(0,1,SK.t);pk(0,-1,SK.t);if(broken){seg(1,7,steel);pk(8,1,steel);tip=8;}
      else{const fl=SK.flick&&Math.floor(S.gt*14)%3===0;seg(1,14,fl?C.white:steel);if(SK.hm&&!tired)for(let k=4;k<14;k+=4)pk(k,0,SK.hm);pk(15,0,SK.tip);tip=15;}break;
    case'yari':seg(-8,broken?10:16,'#8a5a2e');if(broken){pset(P2(11,1).x,P2(11,1).y,'#c8925a');tip=11;}else{seg(16,21,steel);pset(P2(17,1).x,P2(17,1).y,'#c23a2a');pset(P2(22).x,P2(22).y,C.white);tip=22;}break;
    case'kanabo':seg(-3,0,'#3a2418',2);const ce=broken?6:12;seg(0,ce,'#2b2b2b',2);for(let k=2;k<ce;k+=3){const q=P2(k,1);pset(q.x,q.y,'#8a8a8a');}if(broken){pset(P2(ce+1,1).x,P2(ce+1,1).y,'#5a4a3a');pset(P2(ce+1,-1).x,P2(ce+1,-1).y,'#5a4a3a');}tip=ce+1;break;
    case'kusari':if(blood){seg(-6,16,'#3a1a1e');for(let k=0;k<9;k++){const t=k/8,q=P2(16-t*3,-(1+Math.sin(t*Math.PI)*5+t*6)*S.face);pset(q.x,q.y,k%3===0?C.white:C.hi);const q2=P2(15-t*3,-(1+Math.sin(t*Math.PI)*4+t*5)*S.face);pset(q2.x,q2.y,C.blood);}tip=17;}
      else{seg(-2,4,'#8a5a2e');{const b=P2(4);const q=P2(4,-4*S.face);pline(b.x,b.y,q.x,q.y,steel);const q3=P2(3,-5*S.face);pset(q3.x,q3.y,steel);}if(!broken)for(let k=1;k<7;k++)pset(h.x-S.face*k*0.7,h.y+k*1.5+Math.sin(S.gt*7+k)*0.7,k%2?'#8a8a92':C.steel);else{pset(h.x-S.face,h.y+2,'#8a8a92');}tip=5;}break;
    case'musket':seg(-6,-1,'#6b4423',2);seg(-1,14,'#4a4a52');seg(-1,14,'#7a7a82',1,-1);pset(P2(15).x,P2(15).y,C.steel);if(broken){pset(P2(6,-1).x,P2(6,-1).y,'#c23a2a');pset(P2(7).x,P2(7).y,'#c23a2a');}else if(S.reload>0){pset(P2(4,1).x,P2(4,1).y,'#ffd27a');}tip=15;break;
    case'nodachi':seg(-7,-1,SK.h);for(let k=-6;k<=-2;k+=2)pk(k,0,SK.t);pset(h.x,h.y,SK.t);pk(0,1,SK.t);pk(0,-1,SK.t);
      if(broken){seg(1,10,steel);pk(11,up,steel);tip=11;break;}
      bend(1,0,17,0,steel);bend(17,0,21,up,steel);if(SK.hm&&!tired)for(let k=5;k<17;k+=5)pk(k,0,SK.hm);pk(22,up,SK.tip);tip=22;
      if(g>0)tip=bloodGrow(P2,22,9,g,k=>up*(k>26?2:1));break;
    case'naginata':seg(-10,13,SK.wd);for(let k=-10;k<=13;k+=5)pk(k,0,SK.w2);if(SK.inlay)for(let k=-8;k<=12;k+=4)pk(k,0,SK.inlay);pk(14,0,SK.t);pk(14,1,SK.t);pk(14,-1,SK.t);
      if(broken){seg(15,18,steel);tip=18;break;}
      bend(15,0,19,up,steel);bend(19,up,22,3*up,steel);if(SK.hm&&!tired){pk(17,0,SK.hm);pk(20,2*up,SK.hm);}pk(23,4*up,SK.tip);tip=23;
      if(g>0)tip=bloodGrow(P2,24,8,g,k=>up*(4+Math.floor((k-23)/3)));break;
    case'bo':seg(-12,broken?4:14,SK.wd);for(let k=-12;k<=(broken?4:14);k+=4)pk(k,0,SK.node||SK.w2);if(SK.ofuda){pk(4,0,'#ece4d7');pk(-6,0,'#ece4d7');}
      seg(-14,-13,SK.cap);if(!broken){seg(15,16,SK.cap);tip=16;}else{pk(5,up,SK.w2);tip=5;}
      if(g>0){tip=bloodGrow(P2,17,6,g);bloodGrow((k,j)=>P2(-k,j),15,6,g);}break;
    case'tessen':seg(-2,8,SK.rib);seg(1,9,broken?SK.paper2:SK.paper,1,up);if(!broken){seg(3,9,SK.paper2,1,2*up);pk(6,up,SK.mark);}seg(9,10,SK.edge,1,up);pk(10,2*up,SK.edge);tip=10;
      if(g>0)tip=bloodGrow(P2,11,6,g,()=>up);break;
    case'kama':seg(-3,5,SK.h);pk(6,0,SK.t);
      {const bl=broken?[[6,-1],[6,-2],[5,-3]]:[[6,-1],[6,-2],[6,-3],[5,-4],[5,-5],[4,-6]];bl.forEach(([k,j],i)=>pk(k,j*S.face,SK.hm&&i%2&&!tired?SK.hm:steel));
        if(!broken){for(const [k,j] of [[7,-1],[7,-2],[7,-3],[6,-4]])pk(k,j*S.face,steel);
          if(g>0){const ext=[[3,-7],[2,-8],[1,-8],[0,-8],[-1,-8],[-2,-7],[-3,-7],[-4,-6]],m=Math.round(ext.length*g);for(let i=0;i<m;i++)pk(ext[i][0],ext[i][1]*S.face,i===m-1?tsGlint():tsGrow(i));for(let i=0;i<Math.min(3,m);i++)pk([5,4,3][i],[-6,-7,-8][i]*S.face,tsGrow(1));}
          else pk(3,-7*S.face,SK.tip);}}
      tip=7;break;
  }
  if(glow)for(let k=0;k<tip;k+=2){const q=P2(k,1);pset(q.x,q.y,glow,0.6);}
  capEnd(CFG.wOutline!==false,opt&&opt.sink);
  return tip;
}
function drawOrb(){
  const f=clamp(S.meter/orbMax(),0,1),ready=S.meter>=btCost(),thirst=btOn();
  const ox=P.x-S.face*22,oy=P.y-46+Math.sin(S.gt*2.4)*2;S.orbW={x:ox,y:oy};
  const X=LX(ox),Y=LY(oy),R=2+f*10+(thirst?2:0),n=Math.round(3+f*46+(thirst?14:0));
  if(!S.orbP)S.orbP=[];while(S.orbP.length<n)S.orbP.push({a:rand(0,6.283),r:Math.sqrt(Math.random()),sp:rand(1.2,3.6)*(Math.random()<0.5?-1:1),ph:rand(0,6.283),wob:rand(0.6,1.4)});if(S.orbP.length>n)S.orbP.length=n;
  const pulse=ready?0.85+0.15*Math.sin(S.gt*8):1,OP=tsOrb();
  for(const q of S.orbP){const a=q.a+S.gt*q.sp,rr=R*q.r*pulse*(0.85+0.15*Math.sin(S.gt*3*q.wob+q.ph)),x=X+Math.cos(a)*rr,y=Y+Math.sin(a)*rr*0.85;
    const core=q.r<0.4,col=thirst&&Math.random()<0.15?OP[4]:core?(f>0.5?OP[0]:OP[1]):q.r<0.75?OP[2]:OP[3];pset(x,y,col);
    if(f>0.3&&!core){const a2=a-q.sp*0.06;pset(X+Math.cos(a2)*rr,Y+Math.sin(a2)*rr*0.85,OP[3],0.6);}}
  if(f>0.45&&Math.random()<f*0.25)S.parts.push({x:ox+rand(-R,R)*PX*0.6,y:oy+R*PX*0.5,vx:rand(-8,8),vy:rand(30,70),life:0.5,max:0.5,size:1,col:C.blood,stamp:false});
  if(ready&&!thirst){for(let i=0;i<16;i++){if(Math.floor(S.gt*6+i)%3)continue;const t=i/16*Math.PI*2+S.gt;pset(X+Math.cos(t)*(R+3),Y+Math.sin(t)*(R+3)*0.85,OP[1],0.8);}}
  const r=Math.round(R);
  if(P.wpn){const w=P.wpn,bx=Math.round(X)-6,by=Math.round(Y)+r+4,fr=w.dur/w.max;flush();lx.fillStyle='#000';lx.fillRect(bx-1,by-1,14,3);lx.fillStyle=w.dur<=0?'#5a5a62':fr<0.25?C.hi:w.cursed?C.phase:C.steel;lx.fillRect(bx,by,w.dur<=0?12:Math.max(1,Math.round(12*fr)),1);}
  if(S.bt&&S.bt.max&&!S.bt.strike){flush();lx.fillStyle=C.hi;lx.fillRect(Math.round(X)-6,Math.round(Y)-r-5,Math.round(12*S.bt.t/S.bt.max),1);}
}
function drawEnemy(e){
  const T=e.T,big=T.big||1,sp=SPR[e.look];if(!sp)return;
  if(e.air){shadow(e.x,e.y+e.r*0.5,e.r*0.6);return;}
  let drop=0,lift=T.fly?10+Math.sin(e.anim*4)*2:0;
  if(T.hop&&e.state==='strafe'){const ph=e.hopT%1;if(ph<=0.62)lift=Math.sin(Math.PI*ph/0.62)*12;}
  if(e.state==='spawn'){const k=1-Math.max(0,e.t)/e.spawnT;drop=Math.pow(1-k,2)*(e.boss?260:150);shadow(e.x,e.y+e.r*0.5,e.r*(0.3+0.7*k)*(big>1?1.2:1));if(k<0.15)return;}
  else shadow(e.x,e.y+e.r*0.5,e.r*(big>1?1.2:1)*(lift>0?0.8:1));
  const moving=Math.hypot(e.vx,e.vy)>30&&e.state==='strafe';
  let fr=e.state==='wind'?3:(e.state==='strike'||e.poseT>0)?4:moving||T.blink||e.look==='onibi'?[0,1,2,1][Math.floor(e.anim*8)%4]:0;
  // sheets with real swing frames: a clean ready pose for the windup, then the swing plays through as the strike lands
  if(sp.anim){if(e.state==='wind')fr=sp.anim.wind;else if(e.state==='strike'||e.poseT>0){const set=['sweep','spin','wcut','gust'].includes(e.pat)?sp.anim.side:sp.anim.down,k=clamp(1-Math.max(0,e.poseT)/0.25,0,0.999);fr=e.poseT>0?set[Math.floor(k*set.length)]:sp.anim.wind;}}
  if(e.state==='hide')fr=5;
  if(e.pat==='shellspin'&&e.state==='strike')fr=5;
  const lean=e.state==='wind'?-e.face:e.state==='strike'?e.face:0,alpha=e.smoke?0.28+0.1*Math.sin(S.gt*20):T.blink?(e.blinkT>0?0.4:0.88):e.illusion?0.62:1;
  const fx=e.x+(lean+pauseJitter(e))*PX,fy=e.y+e.r*0.6-drop-lift;
  if(e.elite&&Math.floor(S.gt*6)%2===0){const fl=e.face<0,ax=fl?sp.w-1-sp.ax:sp.ax,sx=Math.round(LX(fx)-ax),sy=Math.round(LY(fy)-sp.ay),g=fl?sp.gl:sp.gr;for(const [dx,dy] of [[1,0],[-1,0],[0,1],[0,-1]])lx.drawImage(g,sx+dx,sy+dy);}
  let o;
  if(e.pat==='neck'&&e.state==='strike'&&e.cuts[0]&&!e.cuts[0].done){
    const fl=e.face<0,ax=fl?sp.w-1-sp.ax:sp.ax,sx=Math.round(LX(fx)-ax),sy=Math.round(LY(fy)-sp.ay),img=(fl?sp.l:sp.r)[4];
    lx.drawImage(img,0,12,sp.w,sp.h-12,sx,sy+12,sp.w,sp.h-12);o={sx,sy,hand:{x:sx,y:sy}};
    const hd=head(e.cuts[0]),nx=sx+(fl?sp.w-1-15:15),ny=sy+13;pline(nx,ny,LX(hd.x),LY(hd.y),'#000',1,2);pline(nx,ny,LX(hd.x),LY(hd.y),PAL.pale[0]);flush();
  }else o=drawSpr(e.look,fr,fx,fy,e.face,e.flash>0.5,alpha);
  if(!o)return;
  if(e.illusion&&Math.floor(S.gt*10)%3===0){lx.globalAlpha=0.35;lx.drawImage(e.face>0?sp.gr:sp.gl,o.sx,o.sy);lx.globalAlpha=1;}
  if(e.armorT>0&&Math.floor(S.gt*14)%2===0){lx.globalAlpha=0.6;lx.drawImage(e.face>0?sp.gr:sp.gl,o.sx,o.sy);lx.globalAlpha=1;}
  if(e.state==='recover'||e.state==='stun'){lx.globalAlpha=0.45;lx.drawImage(e.face>0?sp.gr:sp.gl,o.sx,o.sy);lx.globalAlpha=1;}
  if(isDuel(e)&&!e.smoke&&e.state!=='spawn'){const tp=o.sy+Math.max(0,sp.h-36)-6;pset(LX(e.x),tp,C.duel);pset(LX(e.x)-1,tp-1,C.duel);pset(LX(e.x)+1,tp-1,C.duel);}
  if(e.state!=='hide'&&!e.smoke&&!e.disarmed&&!(e.pat==='neck'&&e.state==='strike')){const pose=e.state==='guard'?'guard':e.state==='wind'?(e.pose||'wind'):(e.state==='strike'||e.poseT>0)?'strike':'idle';weapon(T.weapon,o.hand,e.face,pose,1.3*big);}
  const top=o.sy+Math.max(0,sp.h-36);
  if(e.state==='recover'){for(let x=o.sx+4;x<o.sx+sp.w-4;x+=2)pset(x,top,C.spirit,0.8);}
  if(e.state!=='spawn'&&e.state!=='hide'&&!e.boss&&!e.illusion&&!e.T.sumo&&!e.smoke&&!e.T.dummy&&!e.practice){const n=e.max,y0=top-3;
    if(n>12){const W=20,f=clamp(e.hp/n,0,1),x0=Math.round(LX(e.x)-W/2);lx.fillStyle='#3a3040';lx.fillRect(x0,y0,W,1);lx.fillStyle=e.elite?C.mon:C.bone;lx.fillRect(x0,y0,Math.ceil(W*f),1);}
    else{const w=n>8?1:2,tot=n*(w+1),x0=Math.round(LX(e.x)-tot/2);for(let i=0;i<n;i++){lx.fillStyle=i<e.hp?(e.elite?C.mon:C.bone):'#3a3040';lx.fillRect(x0+i*(w+1),y0,w,1);}}}
  if(e.state==='stun'){for(let i=0;i<3;i++){const t=S.gt*5+i*2.1;pset(LX(e.x)+Math.cos(t)*5,top-6+Math.sin(t),C.spirit);}}
  if(e.bleedT>0&&Math.floor(S.gt*6)%2)pset(LX(e.x)+2,top+6,C.blood);
}
function drawTelegraph(e){
  if(e.state!=='wind')return;
  const k=1-Math.max(0,e.t)/e.wind,a=0.35+0.6*k,sp=SPR[e.look];
  for(const s of e.cuts){
    if(s.kind==='neck')continue;
    // the whole path as a dashed line with a dark edge, and a solid bar filling along it like a fuse: when it reaches the end, the cut comes
    const col=s.tcol||(s.phase?C.phase:C.curse),fill=k*s.len,dash=s.delay?10:6;
    for(let d=0;d<s.len;d+=PX){const p=posAt(s,d),x=LX(p.x),y=LY(p.y),on=d<=fill;
      if(on){pset(x+1,y+1,'#000',0.7);pset(x,y,col,1);pset(x,y-1,col,0.85);}
      else if(d%dash<dash*0.6){pset(x+1,y+1,'#000',0.5);pset(x,y,col,0.25+0.45*k);}}
    {const B=s.pts[s.pts.length-1],t=tangentAt(s,s.len),x=LX(B.x),y=LY(B.y),ac=k>0.75&&Math.floor(S.gt*12)%2?C.white:col;
      pline(x,y,x-t.x*5-t.y*4,y-t.y*5+t.x*4,ac,0.5+0.5*k);pline(x,y,x-t.x*5+t.y*4,y-t.y*5-t.x*4,ac,0.5+0.5*k);}
    const A=s.pts[0];pdisc(LX(A.x),LY(A.y),k>0.6?2:1,col,0.6+0.4*k);
    if(s.carry){const B=s.pts[s.pts.length-1],t=tangentAt(s,s.len),x=LX(B.x),y=LY(B.y);pline(x,y,x-t.x*4-t.y*3,y-t.y*4+t.x*3,col,a);pline(x,y,x-t.x*4+t.y*3,y-t.y*4-t.x*3,col,a);}
  }
  if(e.pat==='neck'&&e.cuts[0]){const s=e.cuts[0];for(let d=0;d<s.len;d+=8){const p=posAt(s,d);pset(LX(p.x),LY(p.y),C.curse,a*0.8);}}
  if(e.shotsPlan){const cy=e.y-14,col=e.shotsPlan[0].kind==='feather'?C.ash:shotCol(e.shotsPlan[0].kind);
    for(const s of e.shotsPlan){if(s.orbit){const x=LX(e.x+Math.cos(s.a+S.gt*2)*34),y=LY(cy+Math.sin(s.a+S.gt*2)*34);pdisc(x,y,1+Math.round(k*1.5),col,0.5+0.5*k);}
      else{for(let d=10;d<70;d+=8)pset(LX(e.x+Math.cos(s.a)*d),LY(cy+Math.sin(s.a)*d),col,a);pdisc(LX(e.x+Math.cos(s.a)*10),LY(cy+Math.sin(s.a)*10),Math.round(k*2),col);}}}
  const c0=e.cuts[0]||(e.shotsPlan&&{tier:2}),tierN=(c0&&c0.tier)||1,top=Math.round(LY(e.y+e.r*0.6-(e.T.fly?10:0))-sp.ay-4)+Math.max(0,sp.h-36);
  for(let i=0;i<tierN;i++)pset(Math.round(LX(e.x))-(tierN-1)+i*2,top,c0&&c0.tcol?c0.tcol:c0&&c0.phase?C.phase:C.curse);
  // a "!" over anyone about to strike, flashing faster as the cut gets close
  if(e.cuts.length&&k>0.35&&Math.floor(S.gt*(k>0.75?14:7))%2===0){const tc=c0&&c0.tcol?c0.tcol:c0&&c0.phase?C.phase:C.curse;ptext('!',Math.round(LX(e.x)),top-4,tc,8);}
}
function drawShots(){
  for(const s of S.shots){const x=LX(s.x),y=LY(s.y),sp=Math.hypot(s.vx,s.vy)||1,tx=s.vx/sp,ty=s.vy/sp;
    if(s.kind==='fox'){pdisc(x,y,2,C.fox);pset(x,y,'#ffe7a8');for(let i=1;i<5;i++)pset(x-tx*i*2+Math.sin(S.gt*30+i)*0.6,y-ty*i*2,i<3?C.fox:'#c8501a',1-i*0.18);}
    else if(s.kind==='web'){const r=3;pline(x-r,y-r,x+r,y+r,C.web);pline(x-r,y+r,x+r,y-r,C.web);pline(x-r,y,x+r,y,C.web,0.7);pcircle(x,y,2,C.web,0.6);}
    else if(s.kind==='ice'){pline(x-tx*5,y-ty*5,x+tx*2,y+ty*2,C.ice);pset(x+tx*3,y+ty*3,C.white);}
    else if(s.kind==='frost'||s.kind==='flame'){const g=Math.min(2,s.t*3),fr=s.kind==='frost';pdisc(x,y,1+g,fr?'#d8f6ff':C.fire,0.75);pdisc(x,y,Math.max(0,g-1),fr?C.white:'#ffe7a8',0.9);if(Math.random()<0.4)pset(x-tx*4+rand(-1,1),y-ty*4+rand(-1,1),fr?C.ice:'#ff9a3c',0.6);}
    else if(s.kind==='feather'){pline(x-tx*6,y-ty*6,x,y,'#2a2030');pline(x-tx*6-ty*1.5,y-ty*6+tx*1.5,x-tx*3,y-ty*3,'#4a3a50');pset(x,y,C.bone);}
    else if(s.kind==='kunai'){pline(x-tx*6,y-ty*6,x,y,C.steel);pset(x,y,C.white);pset(x-tx*7,y-ty*7,C.hi);}
    else if(s.kind==='coin'){const w=Math.floor(S.gt*10+s.x)%3?2:1;for(let dx=-w;dx<=w;dx++)for(let dy=-2;dy<=2;dy++)if(Math.abs(dx)+Math.abs(dy)<4)pset(x+dx,y+dy,dx===-w?'#a8822a':C.mon);pset(x,y,'#3a2a10');}
    else if(s.kind==='petal'){pdisc(x,y,2,'#f4a0b8');pset(x-1,y-1,'#ffe0ea');pset(x+tx*2,y+ty*2,'#c8607a');}
    else if(s.kind==='ofuda'){pline(x-ty*2,y+tx*2,x+ty*2,y-tx*2,'#e8e0c8',1,2);pset(x,y,'#c01830');}
    else if(s.kind==='bone'){pline(x-tx*3,y-ty*3,x+tx*3,y+ty*3,'#e8e0d0',1,2);pset(x+tx*3,y+ty*3,C.white);}
    else if(s.kind==='ink'){pdisc(x,y,3,'#1a1024');pdisc(x-1,y-1,1,'#5a4a6a');for(let i=1;i<4;i++)pset(x-tx*i*2,y-ty*i*2+i*0.5,'#1a1024',1-i*0.25);}
    else{pdisc(x,y,2,C.water);pset(x-1,y-1,C.white);pset(x-tx*4,y-ty*4,C.water,0.6);}}
}
function drawObj(o){
  const x=LX(o.x),y=LY(o.y),bob=Math.round(Math.sin(S.gt*3+o.x)*1.5);
  switch(o.kind){
    case'coin':{const z=Math.round(o.z/PX);if(z>0)pset(x,y+1,'#00000088');const w=Math.floor(S.gt*6+o.x)%4===0?1:2;for(let dx=-w;dx<=w;dx++)for(let dy=-2;dy<=2;dy++)if(Math.abs(dx)+Math.abs(dy)<4)pset(x+dx,y-z-2+dy,dx===-w?'#a8822a':C.mon);pset(x,y-z-2,'#3a2a10');break;}
    case'shard':{const z=Math.round(o.z/PX),g=0.5+0.5*Math.sin(S.gt*5+o.x);pset(x,y-z-6,C.shard);pline(x-1,y-z-5,x-1,y-z-2,'#a81a30');pline(x,y-z-5,x,y-z-1,C.shard);pline(x+1,y-z-5,x+1,y-z-2,'#ff8a9a');pset(x,y-z-6,g>0.7?C.white:C.shard);break;}
    case'quest':{flush();const z=Math.round(Math.sin(S.gt*3)*2);lx.drawImage(icon('plate'),x-8,y-18+z);if(Math.floor(S.gt*3)%2)pset(x+5,y-16+z,C.white);break;}
    case'onigiri':case'vial':{flush();const z=Math.round(o.z/PX);lx.drawImage(icon(o.kind),x-8,y-z-14+bob);break;}
    case'weapon':{flush();const z=Math.round((o.z||0)/PX),w=o.w;if(o.price)lx.drawImage(PROPS.pedestal,x-11,y-8);const ic=icon('w_'+w.id),gy=y-(o.price?24:12)-z+bob;
      if(w.named||w.cursed){const g=w.cursed?C.phase:C.mon;for(const [dx,dy] of [[1,0],[-1,0],[0,1],[0,-1]])lx.drawImage(tinted(ic,g),x-8+dx,gy+dy);}lx.drawImage(ic,x-8,gy);if(w.dur<=0){pset(x-1,gy+8,'#c23a2a');pset(x,gy+9,'#c23a2a');pset(x+1,gy+8,'#c23a2a');}
      if(Math.floor(S.gt*3)%2)pset(x+5,gy+2,C.white);if(o.price)ptext(`${o.price}文`,x,y+14,S.mon>=o.price?C.mon:C.ash,8);break;}
    case'toolpack':{flush();const z=Math.round((o.z||0)/PX);lx.drawImage(icon('tools'),x-8,y-14-z+bob);break;}
    case'item':{flush();if(o.price||o.ped)lx.drawImage(PROPS.pedestal,x-11,y-8);
      const ic=ITEM[o.id]?icon(ITEM[o.id].icon):icon(o.id==='heart'?'omamori:#ff4a5c':o.id);lx.drawImage(ic,x-8,y-26+bob);
      if(Math.floor(S.gt*3)%2)pset(x+5,y-24+bob,C.white);
      if(o.price)ptext(`${o.price}文`,x,y+14,S.mon>=o.price?C.mon:C.ash,8);break;}
    case'chest':flush();lx.drawImage(o.open?PROPS.chestOpen:PROPS.chest,x-10,y-12);break;
    case'npc':case'merchant':{if(o.hidden)break;flush();const sp=SPR[o.spr];if(!sp)break;
      if(o.inWater){const fl=P.x<o.x,ax=fl?sp.w-1-sp.ax:sp.ax;lx.drawImage((fl?sp.l:sp.r)[0],0,0,sp.w,sp.h-10,Math.round(x-ax),Math.round(y-sp.ay+4),sp.w,sp.h-10);break;}
      const face=o.faceAway?(P.x<o.x?1:-1):(P.x<o.x?-1:1);
      const alpha=o.leaving!==undefined?clamp(o.leaving/0.6,0,1):1;
      drawSpr(o.spr,o.tag?[0,1,2,1][Math.floor(S.gt*12)%4]:[0,0,1,0][Math.floor(S.gt*2)%4],o.x,o.y+8,o.tag?(P.x<o.x?1:-1):face,false,alpha);
      if(o.duel&&!o.done&&Math.floor(S.gt*2)%2===0)ptext('決闘',x,y-sp.h+2,C.duel,8);
      if(o.zzz){const t=S.gt%2;ptext('z',x+10+t*4,y-30-t*8,C.ash,8);}
      if(!o.done&&!o.zzz&&!o.duel&&!o.tag&&!o.act&&Math.floor(S.gt*2)%2===0&&o.kind==='npc')ptext(S.quest&&S.quest.npc===o?(S.quest.has?'!':'…'):'!',x,y-sp.h+4,C.curse,8);
      break;}
    case'exit':if(o.gate&&!S.floor.gateOpen){flush();lx.globalAlpha=0.55;lx.drawImage(PROPS.torii,x-24,y-38);lx.globalAlpha=1;for(let i=0;i<5;i++){pline(x-11,y-30+i*6,x+11,y-24+i*6,'#8a8a92');pline(x-11,y-24+i*6,x+11,y-30+i*6,'#5a5a62');}pdisc(x,y-14,3,C.curse);pset(x,y-14,'#000');ptext(`SEALED · ${roomsLeft()} LEFT`,x,y+10,C.ash,8);break;}
    {flush();lx.drawImage(PROPS.torii,x-24,y-38);const g=0.5+0.5*Math.sin(S.gt*4);for(let i=0;i<14;i++){const yy=y-28+i*2;pline(x-9,yy,x+9,yy,i%2?'#ff4a5c':'#b8142a',0.3+0.4*g);}ptext('DESCEND',x,y+10,C.hi,8);break;}
  }
}
function drawMarcher(m){if(m.x<-40||m.x>S.room.w+40)return;flush();const sp=SPR[m.spr];if(!sp)return;drawSpr(m.spr,[0,1,2,1][Math.floor(S.gt*8+m.ph)%4],m.x,m.y+8,1,false,0.9);const hx=Math.round(LX(m.x)+6),hy=Math.round(LY(m.y)-sp.h+10);pset(hx,hy,Math.floor(S.gt*6+m.ph)%2?'#ffd27a':'#ff9a4a');pset(hx,hy+1,'#c23a2a');}
function drawFollower(){const f=S.follower;if(!f)return;flush();drawSpr('warashi',f.moving?[0,1,2,1][Math.floor(S.gt*10)%4]:0,f.x,f.y+6,f.face,false,f.leaving!==undefined?clamp(f.leaving,0,1):1);}
function escapePct(){const F=S.floor;if(!F||F.kind==='hub')return 0;const rs=[...F.rooms.values()].filter(r=>r.type==='combat'||r.type==='boss'),done=rs.filter(r=>r.cleared).length;return Math.min(100,Math.round(((F.n-1)+(rs.length?done/rs.length:0)*0.95)/totalFloors()*100));}
function drawCompactHud(){
  const x0=6,y0=6;
  for(let i=0;i<P.max+(P.shield?1:0);i++){const cx=x0+4+i*11,cy=y0+4,shield=i>=P.max,on=shield||i<P.hp,col=shield?C.steel:on?C.hi:'#3a3040';
    for(let dy=-4;dy<=4;dy++){const w=4-Math.abs(dy);for(let dx=-w;dx<=w;dx++){const edge=Math.abs(dx)===w;if(on||edge)pset(cx+dx,cy+dy,on&&!edge?col:(on?shade(col,0.6):col));}}}
  flush();const bw=96,by=y0+13,om=orbMax(),m=clamp(S.meter/om,0,1),rdy=S.meter>=btCost();lx.fillStyle=C.out;lx.fillRect(x0-1,by-1,bw+2,7);lx.fillStyle='#2a1015';lx.fillRect(x0,by,bw,5);
  lx.fillStyle=btOn()||(rdy&&Math.floor(S.gt*4)%2)?C.hi:C.blood;lx.fillRect(x0,by,Math.round(bw*m),5);lx.fillStyle='#ff8a95';lx.fillRect(x0,by,Math.round(bw*m),1);
  for(const [v,col] of [[healCost(),C.bone],[mendCost(),C.steel],[btCost(),C.hi]]){if(v>=om)continue;lx.fillStyle=col;lx.fillRect(x0+Math.round(bw*v/om),by-1,1,7);}
  lx.fillStyle=C.mon;lx.fillRect(x0,y0+23,4,4);ptext(String(S.mon),x0+7,y0+28,C.mon,8,'left');const sx=x0+40;lx.fillStyle=C.shard;lx.fillRect(sx+1,y0+22,2,6);lx.fillRect(sx,y0+23,4,4);ptext(`${S.carry||0} CARRIED`,sx+7,y0+28,C.shard,8,'left');
  const w=P.wpn,wy=y0+38;flush();lx.drawImage(icon('w_'+(w?w.id:'reserve')),x0-2,wy-10);ptext(wName(w).toUpperCase(),x0+16,wy,w&&w.cursed?C.phase:C.bone,8,'left');
  if(w){lx.fillStyle='#000';lx.fillRect(x0+15,wy+2,52,4);lx.fillStyle=w.dur<=0?'#5a5a62':w.dur/w.max<0.25?C.hi:C.steel;lx.fillRect(x0+16,wy+3,w.dur<=0?50:Math.max(1,Math.round(50*w.dur/w.max)),2);}
  ptext(`${escapePct()}%`,LW-8,LH-6,C.ash,8,'right');
}
function drawAbilityChips(){
  if(S.mode!=='run')return;const ab=abilitiesFor(false),ks=Object.keys(ABCD).filter(k=>ab[k]);const W=curW(),tech=knownTech(techW()),hasT=tech.length>0;
  if(hasT){const yy=S.touchUI?S.mapBottom+12:LH-6,cd=S.traceCd||0,mx=S.traceCdMax||1,rd=cd<=0&&!wBroken(),w=Math.max(46,tech.length*12+20);lx.fillStyle='rgba(6,4,5,0.8)';lx.fillRect(3,yy-12,w,14);flush();
    ptext('技',9,yy-2,rd?C.hi:'#6a3a42',8);tech.forEach((sk,i)=>{shapeGlyph(sk.shape,16+i*12,yy-10,rd?KCOL[sk.kind]:'#4a3a42');});flush();
    lx.fillStyle=rd?C.hi:'#3a1a22';lx.fillRect(4,yy+1,w-2,1);if(!rd&&cd>0){lx.fillStyle=C.blood;lx.fillRect(4,yy+1,Math.round((w-2)*(1-cd/mx)),1);}
    if(!S.touchUI&&rd&&S.mouseSeen)ptext('RIGHT-CLICK',w+6,yy-2,'#5a4a52',8,'left');}
  ks.forEach((k,i0)=>{const i=i0+(hasT?1.4:0),yy=S.touchUI?S.mapBottom+12+i*11:LH-6-i*11,cd=CFG.abilityCds?(S.abCd[k]||0):0,mx=S.abCdMax[k]||1,rd=cd<=0;
    lx.fillStyle='rgba(6,4,5,0.78)';lx.fillRect(3,yy-9,36,11);lx.fillStyle=rd?C.spirit:'#3a1a22';lx.fillRect(4,yy,34,1);
    if(!rd){lx.fillStyle=C.blood;lx.fillRect(4,yy,Math.round(34*(1-cd/mx)),1);}ptext(ABLBL[k],21,yy-2,rd?C.bone:'#6a5a62',8);});
}
// trace mode: the brush stroke, and a scroll of the shapes you know
function drawTrace(){
  const tr=S.trace,armed=S.traceArm&&!tr;
  if(S.ink){const k=S.ink.t/S.ink.max,p=S.ink.pts;for(let i=1;i<p.length;i++)pline(LX(p[i-1].x),LY(p[i-1].y),LX(p[i].x),LY(p[i].y),S.ink.col,k,2);}
  if(!tr&&!armed)return;
  const W=curW(),tech=knownTech(techW()),g=S.glyph&&S.enemies.includes(S.glyph.e)?S.glyph:null;
  const segs=tr?traceSegs(tr):[],reads=segs.map(segTech),cur=reads[reads.length-1]||{},match=cur.sk||null,gHit=g&&reads.some(r=>r.shape===g.shape);
  flush();lx.fillStyle='rgba(10,2,5,0.42)';lx.fillRect(0,0,LW,LH);{const pu=0.5+0.5*Math.sin(S.gt*30);lx.fillStyle=`rgba(184,20,42,${0.25+0.2*pu})`;lx.fillRect(0,0,LW,2);lx.fillRect(0,LH-2,LW,2);lx.fillRect(0,0,2,LH);lx.fillRect(LW-2,0,2,LH);}
  {const px=LX(P.x),py=LY(P.y-14);for(let i=0;i<20;i++){const an=i/20*Math.PI*2+S.gt;pset(px+Math.cos(an)*16,py+Math.sin(an)*14,C.blood,0.5);}}
  if(tr){
    const stroke=(p,col)=>{for(let pass=0;pass<2;pass++)for(let i=1;i<p.length;i++){const a=LX(p[i-1].x),b=LY(p[i-1].y),c=LX(p[i].x),d=LY(p[i].y),n=Math.max(1,Math.ceil(Math.hypot(c-a,d-b)));for(let k=0;k<=n;k++){const x=a+(c-a)*k/n,y=b+(d-b)*k/n;if(pass)pdisc(x,y,1,col);else pdisc(x+1,y+1,1,'#000',0.5);}}
      for(let i=1;i<p.length;i++)pline(LX(p[i-1].x),LY(p[i-1].y),LX(p[i].x),LY(p[i].y),slashSet().trc,0.8);};
    const SS=slashSet();segs.forEach((p,i)=>{const r=reads[i],col=g&&r.shape===g.shape?KCOL.G:r.sk?KCOL[r.sk.kind]:setCol(SS.tr,i);stroke(p,col);});
    for(const si of tr.splits){const q=tr.pts[si];pdisc(LX(q.x),LY(q.y),3,'#1a0a10');pdisc(LX(q.x),LY(q.y),2,C.hi);pset(LX(q.x),LY(q.y),C.white);}
    if(Math.random()<0.3)sfx('ink');
    const q=tr.pts[tr.pts.length-1];pdisc(LX(q.x),LY(q.y),2,match||gHit?C.white:C.hi);
    const still=(performance.now()-tr.lastMove)/240;if(match&&tr.splits.length<maxLinks()&&still>0.25&&still<1){for(let i=0;i<16;i++){if(i/16>still)break;const an=-Math.PI/2+i/16*Math.PI*2;pset(LX(q.x)+Math.cos(an)*6,LY(q.y)+Math.sin(an)*6,C.hi);}}
    const left=1-(performance.now()-tr.t0)/1000/(traceMaxT()+(tr.ext||0));flush();lx.fillStyle='#000';lx.fillRect(LW/2-60,LH-12,120,4);lx.fillStyle=left<0.3?C.hi:C.bone;lx.fillRect(LW/2-59,LH-11,Math.round(118*clamp(left,0,1)),2);}
  // the scroll: the lord's glyph first, then the shapes you know
  const ents=(g?[{shape:g.shape,name:'Break the glyph',kind:'G',glyph:true}]:[]).concat(tech),done=new Set(reads.filter(r=>r.sk).map(r=>r.sk.id));
  const n=ents.length,cw=Math.min(72,Math.floor((LW-16)/Math.max(1,n))),w=Math.max(80,n*cw+8),x0=Math.round(LW/2-w/2),y0=S.touchUI?6:8,H=48;flush();
  lx.fillStyle='rgba(12,6,8,0.88)';lx.fillRect(x0,y0,w,H);lx.fillStyle=C.blood;lx.fillRect(x0,y0,w,1);lx.fillRect(x0,y0+H-1,w,1);
  ents.forEach((sk,i)=>{const cx=x0+4+i*cw,on=sk.glyph?gHit:(match===sk||done.has(sk.id)),col=on?C.white:KCOL[sk.kind];if(on||sk.glyph&&Math.floor(S.gt*6)%2){lx.fillStyle=KCOL[sk.kind];lx.globalAlpha=on?1:0.35;lx.fillRect(cx,y0+2,cw-2,H-4);lx.globalAlpha=1;}flush();
    shapeGlyph(sk.shape,cx+cw/2-8,y0+4,on?'#000':col,15);flush();const ws=sk.name.toUpperCase().split(' '),l1=ws.length>1?ws.slice(0,Math.ceil(ws.length/2)).join(' '):ws[0],l2=ws.length>1?ws.slice(Math.ceil(ws.length/2)).join(' '):'';
    ptext(l1,cx+cw/2,y0+(l2?32:36),on?'#000':C.bone,8);if(l2)ptext(l2,cx+cw/2,y0+41,on?'#000':C.bone,8);});
  if(!n)ptext('NO TECHNIQUES',LW/2,y0+28,C.ash,8);
  const names=reads.filter(r=>r.sk).map(r=>r.sk.name.toUpperCase());
  const msg=armed?'DRAW A SHAPE':gHit?'THE GLYPH, ANSWERED':names.length>1?names.join(' + '):match?match.name.toUpperCase():cur.shape?`${SHAPES[cur.shape].toUpperCase()}: NOTHING`:g?'TRACE THE GLYPH':'TRACE A SHAPE';
  ptext(msg,LW/2,y0+H+11,gHit?KCOL.G:match?KCOL[match.kind]:C.ash,8);
  if(tr&&match&&tr.splits.length<maxLinks()&&S.traceCd<=0)ptext('HOLD STILL TO CHAIN ANOTHER',LW/2,y0+H+21,'#7a6a72',8);
  if(S.traceCd>0&&!g)ptext(`RECHARGING ${S.traceCd.toFixed(1)}s`,LW/2,y0+H+21,C.ash,8);
}
function drawAuras(){
  for(const a of S.auras){const cx=LX(P.x),cy=LY(P.y-8-(P.z||0)),r=a.r/PX,fade=clamp(a.t/0.3,0,1);
    if(a.kind==='petal'){for(let i=0;i<6;i++){const an=S.gt*3.2+i/6*Math.PI*2,x=cx+Math.cos(an)*r,y=cy+Math.sin(an)*r*0.8;pdisc(x,y,2,C.hi,fade);pset(x,y,C.white,fade);pline(x,y,x-Math.cos(an+1.4)*4,y-Math.sin(an+1.4)*3,C.blood,fade);}}
    else if(a.kind==='spin'){for(let i=0;i<2;i++){const an=S.gt*22+i*Math.PI,x1=cx+Math.cos(an)*r,y1=cy+Math.sin(an)*r*0.8;pline(cx,cy,x1,y1,'#8a5a2e',fade);pset(x1,y1,C.white,fade);}pcircle(cx,cy,r,C.steel,0.35*fade);}
    else if(a.kind==='whirl'){const an=S.gt*18;for(let k=0;k<3;k++){const b=an-k*0.5,x1=cx+Math.cos(b)*r,y1=cy+Math.sin(b)*r*0.8;pline(cx,cy,x1,y1,k?'#3a3a3a':'#2b2b2b',fade*(1-k*0.3),k?1:2);}pcircle(cx,cy,r,C.ash,0.3*fade);}}
  for(const hk of S.hooks){const e=hk.e;if(!S.enemies.includes(e))continue;const a={x:LX(S.tipW.x),y:LY(S.tipW.y)},b={x:LX(e.x),y:LY(e.y-14)},n=Math.ceil(Math.hypot(b.x-a.x,b.y-a.y)/2);for(let i=0;i<=n;i++){const t=i/n;pset(a.x+(b.x-a.x)*t,a.y+(b.y-a.y)*t+Math.sin(t*Math.PI)*2,i%2?'#8a8a92':C.steel);}}
  if(S.railAim){const k=1-S.railAim.t/0.35,a=S.railAim.a,x=LX(P.x),y=LY(P.y-12);for(let d=6;d<700;d+=3)pset(x+Math.cos(a)*d,y+Math.sin(a)*d,Math.floor(S.gt*30)%2?C.hi:C.white,0.3+0.6*k);}
}
function drawObstacle(o){flush();const x=Math.round(LX(o.x))-1,y=Math.round(LY(o.y))-1-o.rise;if(x>LW||y>LH||x+o.img.width<0||y+o.img.height<0)return;
  if(o.flash>0){o.flash-=0.1;lx.drawImage(tinted(o.img,'#ffffff'),x,y);}else lx.drawImage(o.img,x,y);}
function updateHazards(gdt){
  const R=S.room;if(!R.haz||!R.haz.length)return;
  for(const h of R.haz){const t=(S.gt+h.off)%h.per,st=t<h.per-1.2?'off':t<h.per-0.5?'warn':'on';
    if(st==='on'&&h.state!=='on'){h.id++;if(onScreen({x:h.x,y:h.y}))sfx(curBiome().art.haz==='fire'?'fire':'spike');}
    h.state=st;if(st!=='on')continue;
    if(P.inv<=0&&!CFG.god&&S.dead<=0&&!S.slide&&rectHit(h,P.x,P.y+4,2))hurtPlayer({owner:null,hitP:false,hazName:curBiome().art.haz==='fire'?'fire vent':'spike trap'});
    for(const e of [...S.enemies]){if(e.state==='spawn'||e.T.fly||e.T.blink||e.T.phase||e.smoke||e.T.kamikaze||e.T.sumo)continue;const key=h.uid+':'+h.id;if(e.hazKey===key||!rectHit(h,e.x,e.y+4,2))continue;e.hazKey=key;
      damageEnemy(e,e.boss?2:1);e.flash=1;spray(e.x,e.y-10,8,0,-1);text(e.x,e.y-44,'TRAPPED',C.curse);if(e.hp<=0)kill(e,null);}
    if(curBiome().art.haz==='fire'&&Math.random()<gdt*30)S.parts.push({x:h.x+rand(4,36),y:h.y+rand(4,36),vx:rand(-20,20),vy:rand(-160,-80),life:0.4,max:0.4,size:2,col:Math.random()<0.5?C.fire:'#ffd27a'});}
}
function drawHazards(){
  const R=S.room;if(!R.haz)return;const hell=curBiome().art.haz==='fire';
  for(const h of R.haz){const x=Math.round(LX(h.x)),y=Math.round(LY(h.y)),w=Math.round(h.w/PX),hh=Math.round(h.h/PX);if(x>LW||y>LH||x+w<0||y+hh<0)continue;
    lx.fillStyle=hell?'#1a0e0c':'#262228';lx.fillRect(x,y,w,hh);lx.fillStyle=hell?'#3a1a10':'#3a363c';lx.fillRect(x,y,w,1);lx.fillRect(x,y,1,hh);lx.fillStyle='#0e0c10';lx.fillRect(x+w-1,y,1,hh);lx.fillRect(x,y+hh-1,w,1);
    for(let j=0;j<4;j++)for(let i=0;i<4;i++){const px=x+3+i*5,py=y+3+j*5;
      if(hell){pset(px,py,h.state==='off'?'#0a0606':h.state==='warn'?(Math.floor(S.gt*12)%2?'#ff7a2a':'#8a2a10'):'#ffd27a');pset(px+1,py,h.state==='on'?C.fire:'#0a0606');}
      else if(h.state==='on'){pset(px,py-2,C.white);pset(px,py-1,C.steel);pset(px,py,C.steel);pset(px-1,py,'#8a9298');pset(px+1,py,'#8a9298');}
      else if(h.state==='warn'){pset(px,py,Math.floor(S.gt*14+i+j)%3?'#8a9298':C.white);}
      else pset(px,py,'#0e0c10');}}
}
function drawDeco(d){flush();if(d.prop){const img=PROPS[d.prop];lx.drawImage(img,Math.round(LX(d.x)-img.width/2),Math.round(LY(d.y)-img.height+2));return;}
  if(d.spr&&SPR[d.spr]){drawSpr(d.spr,0,d.x,d.y,1);return;}const img=PROPS[d.spr];if(img)lx.drawImage(img,Math.round(LX(d.x)-img.width/2),Math.round(LY(d.y)-img.height+2));}
function drawCorpse(c){
  const o=corpseOff(c,easeOut(Math.min(1,c.t/0.45))),j=pauseJitter(c),X=Math.round(LX(c.x)-c.ax)+j,Y=Math.round(LY(c.y)-c.ay),dark=c.t>2.4?clamp((c.t-2.4)/0.8,0,1):0;
  if(j!==0||(S.hitstop>0&&S.pauseVictims.has(c))){lx.drawImage(c.wA,X+o[0],Y+o[1]);lx.drawImage(c.wB,X+o[2],Y+o[3]);return;}
  lx.drawImage(c.A,X+o[0],Y+o[1]);lx.drawImage(c.B,X+o[2],Y+o[3]);
  if(dark>0){lx.globalAlpha=dark;lx.drawImage(c.dA,X+o[0],Y+o[1]);lx.drawImage(c.dB,X+o[2],Y+o[3]);lx.globalAlpha=1;}
}
function drawSwipe(){
  const sw=S.swipe,last=sw.pts[sw.pts.length-1];
  if(!sw.moved&&dist(sw.pts[0],last)<16)return;
  for(let i=1;i<sw.pts.length;i+=2)pset(LX(sw.pts[i].x),LY(sw.pts[i].y),C.ash,0.5);
  const W=curW(),col=btFor(W.id)?C.hi:C.bone,a=Math.atan2(last.y-sw.pts[0].y,last.x-sw.pts[0].x);let pts,used=0;
  if(W.style==='smash'){const maxR=(160+25*up('kanabo','hop'))*(wBroken()?brokenLen('kanabo'):1),f={x:last.x,y:last.y+10},d=dist(f,P),k=d>maxR?maxR/d:1,tx=P.x+(f.x-P.x)*k,ty=P.y+(f.y-P.y)*k;
    pcircle(LX(tx),LY(ty),Math.max(3,(W.shock||40)*0.5/PX),col,0.8);pline(LX(P.x),LY(P.y),LX(tx),LY(ty),col,0.4);pset(LX(tx),LY(ty),col);return;}
  if(W.style==='trace'){const ab=abilitiesFor(false);if(W.id==='katana')ab.curve=true;pts=buildPath(sw.pts,ab).pts;used=Math.min(1,(ab.curve?polyLen(sw.pts):dist(sw.pts[0],last))/maxLen());}
  else{const L=W.style==='thrust'?W.len*reachMul('yari'):W.style==='chain'?(wBroken()?64:W.len*reachMul('kusari')*(1+0.15*up('kusari','chain'))):110,la=lineAim(sw,L);pts=bodyLine(la,L);}
  for(let i=1;i<pts.length;i++)pline(LX(pts[i-1].x),LY(pts[i-1].y),LX(pts[i].x),LY(pts[i].y),col,0.85);
  for(const p of pts)if(p.b)pdisc(LX(p.x),LY(p.y),1,col);
  if(used>0){const cx=LX(P.x),cy=LY(P.y-20),r=10;for(let i=0;i<40;i++){const u=i/40;if(u>1-used)break;const an=-Math.PI/2+u*Math.PI*2;pset(cx+Math.cos(an)*r,cy+Math.sin(an)*r,used>=1?C.hi:col);}}
}
function drawOrbs(){for(const o of S.orbs){const x=LX(o.x),y=LY(o.y),sp=Math.hypot(o.vx,o.vy)||1;pset(x,y,C.hi);pset(x+1,y,C.hi);pset(x,y+1,C.blood);pset(x-o.vx/sp*2,y-o.vy/sp*2,C.blood,0.6);}}
function drawOffscreen(){
  const pad=6;
  for(const e of S.enemies){const sx=LX(e.x),sy=LY(e.y);if(sx>-4&&sx<LW+4&&sy>-4&&sy<LH+4)continue;
    const cx=LW/2,cy=LH/2,dx=sx-cx,dy=sy-cy,k=Math.min((LW/2-pad)/Math.abs(dx||1e-6),(LH/2-pad)/Math.abs(dy||1e-6)),px=cx+dx*k,py=cy+dy*k,an=Math.atan2(dy,dx),c=Math.cos(an),s=Math.sin(an),col=e.boss?C.hi:e.state==='wind'?C.curse:C.ash;
    pline(px+c*3,py+s*3,px-c*2-s*3,py-s*2+c*3,col);pline(px+c*3,py+s*3,px-c*2+s*3,py-s*2-c*3,col);}
}
// ---------- lighting ----------
const lightCv=mk(LW,LH),lc=lightCv.getContext('2d');
const BANDS=[[0,1],[0.38,1],[0.38,0.78],[0.6,0.78],[0.6,0.5],[0.78,0.5],[0.78,0.2],[0.92,0.2],[0.92,0],[1,0]];
function lightAt(x,y,r,a){const X=LX(x),Y=LY(y),R=r/PX;if(R<1||X<-R||X>LW+R||Y<-R||Y>LH+R)return;const G=lc.createRadialGradient(X,Y,0,X,Y,R);for(const [o,v] of BANDS)G.addColorStop(o,`rgba(0,0,0,${v*a})`);lc.fillStyle=G;lc.fillRect(X-R,Y-R,R*2,R*2);}
function drawLighting(){
  const dark=S.gmx&&S.gmx.dark&&!S.inHub?0.93:clamp(curBiome().dark*CFG.darkness,0,0.95);if(dark<=0.01)return;
  lc.globalCompositeOperation='source-over';lc.clearRect(0,0,LW,LH);lc.fillStyle=`rgba(10,5,20,${dark})`;lc.fillRect(0,0,LW,LH);
  lc.globalCompositeOperation='destination-out';
  const R=S.room;
  for(const l of R.lights)lightAt(l.x,l.y,l.r*(0.9+0.06*Math.sin(S.gt*7+l.ph)+0.04*Math.sin(S.gt*19+l.ph*2)),1);
  if(P.hp>0)lightAt(P.x,P.y-14,(btOn()?190:140)*S.mods.lightMul,0.9);
  for(const s of S.slashes)if(!s.done||s.fireTrail&&s.linger>0){const h=s.done?posAt(s,s.len/2):head(s);lightAt(h.x,h.y,s.ult?130:s.fireTrail?90:70,0.8);}
  for(const s of S.eslashes)if(!s.done&&!s.guard){const h=head(s);lightAt(h.x,h.y,50,0.6);}
  for(const s of S.shots)lightAt(s.x,s.y,s.kind==='fox'?70:50,0.7);
  for(const r of S.rings)lightAt(r.x,r.y,r.r*1.8,r.life/0.35);
  for(const e of S.enemies){if(e.state==='wind')lightAt(e.x,e.y-14,40,0.5);if(e.look==='onibi')lightAt(e.x,e.y-14,110,0.9);}
  if(S.event&&S.event.marchers)for(const m of S.event.marchers)lightAt(m.x,m.y-16,90,0.8);
  if(S.event&&S.event.tal)for(const t of S.event.tal)if(t.hx!==undefined)lightAt(t.hx,t.hy,40,0.5);
  for(const h of R.haz||[])if(h.state==='on'&&curBiome().art.haz==='fire')lightAt(h.x+20,h.y+10,80,0.8);
  for(const o of R.objs)if(o.kind==='exit'&&!(o.gate&&!S.floor.gateOpen))lightAt(o.x,o.y-20,160,0.9);else if(o.kind==='item')lightAt(o.x,o.y-20,60,0.5);
  lx.save();lx.setTransform(1,0,0,1,0,0);lx.drawImage(lightCv,0,0);lx.globalCompositeOperation='lighter';
  for(const l of R.lights){const X=LX(l.x),Y=LY(l.y),Rr=l.r*0.75/PX;if(X<-Rr||X>LW+Rr||Y<-Rr||Y>LH+Rr)continue;const f=0.85+0.15*Math.sin(S.gt*7+l.ph),G=lx.createRadialGradient(X,Y,0,X,Y,Rr);
    G.addColorStop(0,`rgba(${l.col},${0.13*f})`);G.addColorStop(0.45,`rgba(${l.col},${0.13*f})`);G.addColorStop(0.45,`rgba(${l.col},${0.06*f})`);G.addColorStop(0.8,`rgba(${l.col},${0.06*f})`);G.addColorStop(0.8,`rgba(${l.col},0)`);lx.fillStyle=G;lx.fillRect(X-Rr,Y-Rr,Rr*2,Rr*2);}
  lx.restore();
}
function drawFlames(){
  for(const l of S.room.lights){
    if(l.fx===undefined)continue;const X=Math.round(LX(l.fx)),Y=Math.round(LY(l.fy));if(X<-6||X>LW+6||Y<-6||Y>LH+6)continue;
    const f=Math.sin(S.gt*9+l.ph)+Math.sin(S.gt*23+l.ph*1.7)*0.5,blue=l.col.startsWith('1');
    const c1=blue?'#d8f6ff':'#fff3c4',c2=blue?'#6ec8ff':'#ffd27a',c3=blue?'#3a7ad8':'#ff9a4a';
    if(l.kind==='lantern'){pset(X,Y,f>0?'#ffe7a8':'#ffc76a');pset(X-1,Y,c3,0.8);pset(X+1,Y,c3,0.6);pset(X,Y+1,c3,0.6);if(f>0.6)pset(X,Y-1,c2);}
    else if(l.kind==='brazier'){for(let i=0;i<5;i++){const xx=X-3+i*1.5,hh=2+Math.round(Math.abs(Math.sin(S.gt*11+i+l.ph))*4);pline(xx,Y,xx,Y-hh,i%2?c2:c3);pset(xx,Y-hh,c1);}}
    else{pset(X,Y,f>0.2?c1:c2);pset(X,Y-1,c3,f>0?0.9:0.4);if(l.kind==='toro'){pset(X-1,Y,c2,0.8);pset(X+1,Y,c2,0.8);}}
  }
}
// ---------- screen-space UI drawn into the pixel buffer ----------
function drawMinimap(){
  if(!CFG.minimap||!S.floor||(S.gmx&&S.gmx.fog))return;
  const rooms=[...S.floor.rooms.values()].filter(r=>r.seen||r.visited||S.revealAll);if(!rooms.length)return;
  const xs=rooms.map(r=>r.gx),ys=rooms.map(r=>r.gy),mnx=Math.min(...xs),mny=Math.min(...ys),cw=11,ch=7,ox=6,oy=56;S.mapBottom=oy+(Math.max(...ys)-mny+1)*(ch+2)+4;
  lx.fillStyle='rgba(10,8,11,0.65)';lx.fillRect(ox-3,oy-3,(Math.max(...xs)-mnx+1)*(cw+2)+4,(Math.max(...ys)-mny+1)*(ch+2)+4);
  for(const r of rooms){const x=ox+(r.gx-mnx)*(cw+2),y=oy+(r.gy-mny)*(ch+2),cur=r===S.room;
    lx.fillStyle=cur?'#ece4d7':r.visited?'#5a4a52':'#2e2731';lx.fillRect(x,y,cw,ch);
    if(r.doors.e&&(r.visited||cur))lx.fillRect(x+cw,y+3,2,1);if(r.doors.s&&(r.visited||cur))lx.fillRect(x+5,y+ch,1,2);
    const ic={boss:C.hi,mini:'#ff8a95',rest:C.spirit,store:C.mon,shop:C.mon,treasure:'#ffe066',event:C.phase,duel:C.duel,hermit:'#7ad890',gate:S.floor.gateOpen?C.spirit:C.ash}[r.type];
    if(S.quest&&((!S.quest.has&&r===S.quest.target)||(S.quest.has&&r===S.quest.R))&&Math.floor(S.gt*3)%2){lx.fillStyle='#e8eef8';lx.fillRect(x+1,y+1,cw-2,ch-2);}
    if(ic&&(r.seen||S.revealAll)&&!(r.type==='duel'&&r.duelDone)){lx.fillStyle=ic;if(r.type==='duel'){lx.fillRect(x+3,y+1,1,1);lx.fillRect(x+4,y+2,1,1);lx.fillRect(x+5,y+3,1,1);lx.fillRect(x+6,y+4,1,1);lx.fillRect(x+7,y+5,1,1);lx.fillRect(x+7,y+1,1,1);lx.fillRect(x+6,y+2,1,1);lx.fillRect(x+4,y+4,1,1);lx.fillRect(x+3,y+5,1,1);}else if(r.type==='gate'){lx.fillRect(x+3,y+1,5,1);lx.fillRect(x+4,y+2,1,4);lx.fillRect(x+6,y+2,1,4);}else if(r.type==='boss'){lx.fillRect(x+4,y+2,3,2);lx.fillRect(x+4,y+4,1,1);lx.fillRect(x+6,y+4,1,1);}else lx.fillRect(x+4,y+2,3,3);}
    if(cur){lx.fillStyle='#b8142a';lx.fillRect(x+5,y+3,1,1);}}
  if(S.floor.kind==='combat'){const n=roomsLeft();ptext(S.floor.gateOpen?'STAIRS OPEN':`${n} ROOM${n===1?'':'S'} LEFT`,ox-2,S.mapBottom+7,S.floor.gateOpen?C.spirit:C.ash,8,'left');S.mapBottom+=11;}
}
function wrapText(str,max){const cj=trWrap(str,max);if(cj)return cj;str=tr(str);const words=str.split(' '),lines=[];let cur='';for(const w of words){if((cur+' '+w).trim().length>max){lines.push(cur.trim());cur=w;}else cur+=' '+w;}if(cur.trim())lines.push(cur.trim());return lines;}
function drawBanners(){
  if(S.banner){const a=clamp(Math.min(S.banner.t,2.4-S.banner.t)*3,0,1),h=Math.round(12*a);lx.fillStyle='#000';lx.fillRect(0,0,LW,h);lx.fillRect(0,LH-h,LW,h);}
  if(S.boss&&S.enemies.includes(S.boss)){const b=S.boss,w=220,x0=(LW-w)/2|0,y0=LH-14;
    lx.fillStyle=C.out;lx.fillRect(x0-1,y0-1,w+2,6);lx.fillStyle='#2a1015';lx.fillRect(x0,y0,w,4);lx.fillStyle=b.enraged?C.hi:C.blood;lx.fillRect(x0,y0,Math.round(w*Math.max(0,b.hp)/b.max),4);lx.fillStyle='#ff8a95';lx.fillRect(x0,y0,Math.round(w*Math.max(0,b.hp)/b.max),1);
    ptext(b.T.name,LW/2,y0-3,C.bone,8);}
  if(S.banner){const bn=S.banner,a=clamp(Math.min(bn.t,2.4-bn.t)*3,0,1);lx.globalAlpha=a*0.85;lx.fillStyle='#060405';lx.fillRect(0,LH/2-24,LW,40);lx.fillStyle=C.blood;lx.fillRect(0,LH/2-24,LW,1);lx.fillRect(0,LH/2+15,LW,1);lx.globalAlpha=a;
    ptext(bn.name,LW/2,LH/2,C.hi,16);ptext(bn.title.toUpperCase(),LW/2,LH/2+11,C.bone,8);lx.globalAlpha=1;}
  if(S.itemBanner){const ib=S.itemBanner,a=clamp(Math.min(ib.t,3.2-ib.t)*4,0,1),lines=wrapText(ib.desc.toUpperCase(),68);lx.globalAlpha=a;
    lx.fillStyle='rgba(6,4,5,0.85)';lx.fillRect(40,26,LW-80,30+lines.length*10);lx.fillStyle=C.mon;lx.fillRect(40,26,LW-80,1);
    lx.drawImage(icon(ib.icon),48,32);if(ib.shape){flush();lx.fillStyle='#000';lx.fillRect(LW-62,30,17,17);shapeGlyph(ib.shape,LW-58,34,C.hi);flush();}ptext(ib.name.toUpperCase(),LW/2+8,42,C.mon,16);lines.forEach((l,i)=>ptext(l,LW/2+8,54+i*10,C.bone,8));lx.globalAlpha=1;}
}
function drawPrompt(){
  const o=S.prompt;if(!o||!playing())return;const x=LX(o.x),sp=SPR[o.spr],y=LY(o.y)-(o.kind==='item'?34:(sp?sp.h:30))-6;
  const label=(o.kind==='item'&&o.id==='whet')?'WHETSTONE SERVICE':o.label?o.label:o.kind==='item'&&!o.price&&ITEM[o.id]?(ownedItem(o.id)?'ALREADY CARRIED':`SWAP FOR ${ITEM[o.id].name.toUpperCase()}`):o.act==='armorer'?'WEAPONS':o.act==='hubshop'?'UNLOCKS':o.act==='archivist'?'ASK':o.act==='monk'?'RECORDS':o.kind==='merchant'?'TALK':o.kind==='weapon'?`${o.price?'BUY':'TAKE'} ${wName(o.w).toUpperCase()}`:o.kind==='item'?`${ITEM[o.id]?ITEM[o.id].name.toUpperCase():o.id==='heart'?'SOUL ORB':o.id==='tools'?'TOOL RESTOCK':o.id.toUpperCase()}`:o.duel?'DUEL':o.smith?'FORGE':'TALK';
  lx.fillStyle='#000';lx.fillRect(x-5,y-8,10,10);lx.fillStyle=C.bone;lx.fillRect(x-4,y-7,8,8);ptext('E',x,y,'#000',8);
  ptext(label,x,y-11,C.bone,8);
  if(o.kind==='item'&&ITEM[o.id])wrapText(ITEM[o.id].desc.toUpperCase(),50).forEach((l,i)=>ptext(l,x,y-28-i*9+(wrapText(ITEM[o.id].desc,50).length-1)*9,C.ash,8));
  else if(o.kind==='item'){const d={onigiri:'+1 SOUL',vial:'+35 BLOOD',heart:'+1 MAX SOUL',tools:'REFILL KUNAI AND SHURIKEN'}[o.id];if(d)ptext(d,x,y-20,C.ash,8);}
  else if(o.kind==='weapon'){const w=o.w,lines=[`${Math.ceil(w.dur)}/${w.max} DURABILITY${w.dur<=0?' · BROKEN':''}`];if(w.perk)lines.push(NAMED_PERKS.find(q=>q.id===w.perk).desc.toUpperCase());if(w.cursed){const cu=CURSES.find(q=>q.id===w.cursed);lines.push(`CURSE: ${cu.desc.toUpperCase()}`);}lines.forEach((l,i)=>ptext(l,x,y-20-i*9,w.cursed&&i===lines.length-1?C.phase:C.ash,8));}
}
// ---------- title scene: a blood moon over the gates of hell ----------
const TT={petals:[],stars:[]};
function drawTitle(){
  const t=S.gt;lx.setTransform(1,0,0,1,0,0);lx.globalAlpha=1;
  const bands=['#0b0610','#120814','#1a0a16','#260c18','#360f1a','#4a121c','#5e161c','#74201c'];
  for(let y=0;y<LH;y++){const f=y/(LH*0.78),i=Math.min(bands.length-1,Math.floor(f*bands.length)),fr=f*bands.length-i;let c=bands[i];if(fr>0.5&&i<bands.length-1)c=((y+(t*10|0))%2)?bands[i+1]:c;lx.fillStyle=c;lx.fillRect(0,y,LW,1);}
  if(!TT.stars.length)for(let i=0;i<70;i++)TT.stars.push({x:Math.random()*LW,y:Math.random()*LH*0.5,p:Math.random()*6});
  for(const st of TT.stars){if(Math.sin(t*2+st.p)>0.3)pset(st.x,st.y,'#d8c8d8',0.7);}
  const mx=LW*0.7,my=86,mr=44;lx.fillStyle='rgba(255,90,90,0.07)';for(const r of [70,60,52]){lx.beginPath();lx.arc(mx,my,r,0,7);lx.fill();}
  for(let y=-mr;y<=mr;y++){const w=Math.round(Math.sqrt(mr*mr-y*y));for(let x=-w;x<=w;x++){const n=Math.sin(x*0.31+y*0.17)+Math.sin(x*0.07-y*0.23)*1.4;const sh=(x+y*0.6)/mr;pset(mx+x,my+y,sh<-0.75||y>mr-3?'#b04a46':n>1.75?'#dc8278':n<-1.9?'#d06a62':sh>0.55?'#f4b0a0':'#eb9c8c');}}
  const ridge=(base,amp,f1,f2,col,spd)=>{lx.fillStyle=col;for(let x=0;x<LW;x++){const h=base-amp*(0.6*Math.sin((x+t*spd)*f1)+0.4*Math.sin((x+t*spd)*f2+1.7));lx.fillRect(x,Math.round(h),1,LH-Math.round(h));}};
  ridge(LH*0.62,30,0.013,0.041,'#2a0c16',2);ridge(LH*0.72,22,0.021,0.067,'#1a0810',4);
  flush();const tx=Math.round(LW*0.5),ty=Math.round(LH*0.66);lx.fillStyle='#120408';lx.fillRect(tx-30,ty-46,60,4);lx.fillRect(tx-34,ty-50,68,4);lx.fillRect(tx-22,ty-38,44,3);lx.fillRect(tx-20,ty-42,5,46);lx.fillRect(tx+15,ty-42,5,46);
  lx.fillStyle='#0a0306';lx.beginPath();lx.moveTo(LW*0.38,LH);lx.lineTo(LW*0.52,LH*0.8);lx.lineTo(LW,LH*0.76);lx.lineTo(LW,LH);lx.fill();
  for(let i=0;i<5;i++){const fy=LH*0.74+i*7,off=(t*(6+i*3)+i*90)%(LW+200)-100;lx.globalAlpha=0.08;lx.fillStyle='#e8c8d0';lx.fillRect(off-120,fy,240,3);lx.fillRect(off+260-LW,fy+2,200,2);}lx.globalAlpha=1;
  const sp=SPR.player;if(sp){const fr=Math.floor(t*1.2)%6===0?3:0,img=sp.r[fr],sc=2,px=Math.round(LW*0.66),py=Math.round(LH*0.8);lx.imageSmoothingEnabled=false;lx.drawImage(img,px-sp.ax*sc,py-img.height*sc,img.width*sc,img.height*sc);
    const hx=px+(sp.frames[fr].hand.x-sp.ax)*sc,hy=py+(sp.frames[fr].hand.y-img.height)*sc;for(let k=0;k<12;k++)pset(hx+k*1.6,hy+k*0.9,k<4?C.steel:(k%3?C.blood:C.hi));if(Math.random()<0.08)S.parts.push({x:S.X0+(hx+18)*PX,y:S.Y0+(hy+11)*PX,vx:0,vy:60,life:0.6,max:0.6,size:1,col:C.blood});
    lx.fillStyle='rgba(0,0,0,0.4)';lx.fillRect(px-14,py,28,2);}
  if(TT.petals.length<46)TT.petals.push({x:LW+Math.random()*40,y:Math.random()*LH*0.9-20,vx:-rand(18,40),vy:rand(6,16),ph:Math.random()*6,c:Math.random()<0.7?'#f2a7b8':'#ff4a5c'});
  for(const q of TT.petals){q.x+=q.vx*0.016;q.y+=(q.vy+Math.sin(t*2+q.ph)*10)*0.016;pset(q.x,q.y,q.c);if(Math.floor(t*4+q.ph)%2)pset(q.x+1,q.y,q.c);if(q.x<-5||q.y>LH+5){q.x=LW+rand(0,40);q.y=rand(-20,LH*0.8);}}
  for(const q of S.parts){const x=(q.x-S.X0)/PX,y=(q.y-S.Y0)/PX;pset(x,y,q.col,clamp(q.life/q.max*1.5,0,1));}
  flush();
  for(let y=0;y<LH;y+=2){lx.fillStyle='rgba(0,0,0,0.06)';lx.fillRect(0,y,LW,1);}
  ctx.setTransform(1,0,0,1,0,0);ctx.imageSmoothingEnabled=false;ctx.drawImage(low,0,0);
}
function draw(){
  if(S.mode==='title'){drawTitle();return;}
  const R=S.room;if(!R)return;
  const sh=RM||!CFG.shake?0:Math.round((Math.random()-.5)*S.shake/PX),sh2=RM||!CFG.shake?0:Math.round((Math.random()-.5)*S.shake/PX);
  lx.setTransform(1,0,0,1,0,0);lx.globalAlpha=1;lx.globalCompositeOperation='source-over';lx.fillStyle='#060405';lx.fillRect(0,0,LW,LH);
  lx.setTransform(1,0,0,1,sh,sh2);
  const fx=S.X0/PX,fy=S.Y0/PX;
  lx.drawImage(R.floorCv,fx,fy,LW,LH,0,0,LW,LH);lx.drawImage(R.decalCv,fx,fy,LW,LH,0,0,LW,LH);
  if(R.onsen){const cx=LX(R.onsen.x),cy=LY(R.onsen.y);for(let y=-14;y<=14;y++){const w=Math.round(46*Math.sqrt(1-(y*y)/(15*15)));lx.fillStyle=Math.abs(y)>11||Math.abs(w)>43?'#4a4e56':y<-6?'#3a7ab8':'#2a5a98';lx.fillRect(cx-w,cy+y,w*2,1);}
    for(let i=0;i<3;i++){const t=(S.gt*0.6+i/3)%1;pset(cx-20+i*20+Math.sin(S.gt+i)*3,cy-10-t*24,'#e8eef8',1-t);}}
  if(R.ring){const cx=LX(R.ring.x),cy=LY(R.ring.y),rr=R.ring.r/PX;pcircle(cx,cy,rr+1,'#5a4a2a');pcircle(cx,cy,rr,'#c8a868');pcircle(cx,cy,rr-1,'#e8d0a0',0.5);pline(cx-14,cy-4,cx-14,cy+4,C.bone,0.7);pline(cx+14,cy-4,cx+14,cy+4,C.bone,0.7);flush();}
  // doors: bars while the room is locked, a hint of what lies beyond
  const dh=Math.round(DW*2/PX),bcol=curBiome().art.bar;
  for(const d in R.doors){const nb=neighbor(R,d);let x0,y0,w,h;
    if(d==='n'){x0=R.w/2/PX-dh/2;y0=0;w=dh;h=WP;}else if(d==='s'){x0=R.w/2/PX-dh/2;y0=R.h/PX-WP;w=dh;h=WP;}else if(d==='w'){x0=0;y0=R.h/2/PX-dh/2;w=WP;h=dh;}else{x0=R.w/PX-WP;y0=R.h/2/PX-dh/2;w=WP;h=dh;}
    const X=x0-fx,Y=y0-fy;
    if(!R.cleared){lx.fillStyle=bcol;if(w>h)for(let x=X+2;x<X+w;x+=5)lx.fillRect(x,Y,2,h);else for(let y=Y+2;y<Y+h;y+=5)lx.fillRect(X,y,w,2);}
    // make every doorway easy to spot: lit posts either side, light spilling onto the floor, and a chevron pointing out when it is open
    {const open=R.cleared,ix=d==='w'?1:d==='e'?-1:0,iy=d==='n'?1:d==='s'?-1:0,pc=open?'#e8c15a':C.hi,pulse=0.55+0.35*Math.sin(S.gt*5);
      if(w>h){lx.fillStyle=pc;lx.fillRect(X-3,Y-2,3,h+4);lx.fillRect(X+w,Y-2,3,h+4);}else{lx.fillStyle=pc;lx.fillRect(X-2,Y-3,w+4,3);lx.fillRect(X-2,Y+h,w+4,3);}
      if(open){lx.globalAlpha=0.14;lx.fillStyle='#ece4d7';lx.fillRect(X,Y,w,h);for(let k=0;k<18;k++){lx.globalAlpha=0.3*(1-k/18);lx.fillStyle='#ece4d7';if(w>h)lx.fillRect(X,iy>0?Y+h+k:Y-1-k,w,1);else lx.fillRect(ix>0?X+w+k:X-1-k,Y,1,h);}lx.globalAlpha=1;
        const cx=X+w/2,cy=Y+h/2,ax=ix>0?X+w+12:ix<0?X-13:cx,ay=iy>0?Y+h+12:iy<0?Y-13:cy;
        for(let j=0;j<2;j++){const off=j*4;for(let i=-5;i<=5;i++){const px=ix?ax-ix*(Math.abs(i)-off)*1+0:ax+i,py=iy?ay-iy*(Math.abs(i)-off):ay+i;
          const qx=ix?ax+ix*(Math.abs(i)-off):ax+i,qy=iy?ay+iy*(Math.abs(i)-off):ay+i;pset(qx+1,qy+1,'#000000',0.6*pulse);pset(qx,qy,'#e8c15a',pulse*(j?0.65:1));}}}
      else{lx.globalAlpha=0.25+0.15*Math.sin(S.gt*4);lx.fillStyle=C.hi;lx.fillRect(X,Y,w,h);lx.globalAlpha=1;}}
    if(nb&&(nb.seen||S.revealAll)&&['boss','mini','rest','shop','treasure','event','duel','gate','hermit'].includes(nb.type)){const col={hermit:'#7ad890',boss:C.hi,mini:'#ff8a95',rest:C.spirit,shop:C.mon,treasure:'#ffe066',event:C.phase,duel:C.duel,gate:C.spirit}[nb.type];const cx=X+w/2,cy=d==='n'?Y+h+4:d==='s'?Y-5:Y+h/2,cxx=d==='w'?X+w+4:d==='e'?X-5:cx;pdisc(cxx,cy,1,col,0.9);}
  }
  flush();
  drawHazards();flush();drawFoeGround();flush();
  if(S.floor&&S.floor.n===1&&R.type==='start'&&S.mode==='run'&&!S.pro){const a=0.85;lx.globalAlpha=a;const H=S.touchUI?['STICK TO MOVE  ·  DASH BUTTON','TAP · SWIPE · HOLD: THREE MOVES PER WEAPON','PRESS 技 THEN DRAW A CIRCLE: BLOOD SPIN','SPEND THE ORB: HEAL · MEND · THIRST']:['WASD MOVE  ·  SPACE DASH  ·  CLICK, SWIPE OR HOLD TO ATTACK','HOLD RIGHT-CLICK AND DRAW A CIRCLE: BLOOD SPIN','E TAKE WEAPONS  ·  G OR MIDDLE-CLICK THROWS THEM','Q HEAL  ·  F MEND  ·  R BLOODTHIRST  ·  X C TOOLS'];H.forEach((t,i)=>ptext(t,LX(R.w/2),LY(R.h/2-120+i*20),'#7a6a72',8));lx.globalAlpha=1;}
  for(const g of S.ghosts){const sp=SPR[g.look];if(!sp)continue;const red=g.look==='player';if(red&&!sp.redL){sp.redL=tinted(sp.gl,'#e0283e');sp.redR=tinted(sp.gr,'#e0283e');}lx.globalAlpha=g.life/0.2*(red?0.6:0.45);const fl=g.face<0,ax=fl?sp.w-1-sp.ax:sp.ax;lx.drawImage(red?(fl?sp.redL:sp.redR):(fl?sp.gl:sp.gr),Math.round(LX(g.x)-ax),Math.round(LY(g.y+P.r*0.6)-sp.ay));}
  lx.globalAlpha=1;
  const actors=[...(R.obs||[]).filter(o=>o.img&&!o.dead).map(o=>({y:o.y+o.h,f:()=>drawObstacle(o)})),...((S.event&&S.event.marchers)||[]).map(m=>({y:m.y,f:()=>drawMarcher(m)})),...(S.follower?[{y:S.follower.y,f:drawFollower}]:[]),...R.deco.map(d=>({y:d.y,f:()=>drawDeco(d)})),...R.objs.map(o=>({y:o.y+(o.kind==='exit'?-30:0),f:()=>drawObj(o)})),...S.corpses.map(c=>({y:c.depth,f:()=>drawCorpse(c)})),...S.enemies.map(e=>({y:e.y,f:()=>{drawEnemy(e);drawElemOn(e);}})),{y:P.y,f:drawPlayer}].sort((a,b)=>a.y-b.y);
  for(const a of actors){a.f();flush();}
  drawAmbient();flush();
  if(CFG.lighting)drawLighting();
  drawFlames();
  for(const r of S.rings){const k=1-r.life/0.35;pcircle(LX(r.x),LY(r.y),r.r*(0.4+0.6*k)/PX,r.col||C.hi,r.life/0.35);}
  for(const e of S.enemies)drawTelegraph(e);
  drawFoeAir();flush();
  drawShots();flush();
  for(const s of S.eslashes){if(s.guard)drawCut(s,C.white,C.steel,5);else if(s.col){drawCut(s,s.core||C.white,s.col,(s.hr||8)*0.75);if(s.kind==='bolt'&&!s.done){const h=head(s);for(let i=0;i<3;i++)pset(LX(h.x)+rand(-4,4),LY(h.y)+rand(-4,4),'#ffe066');}}else if(s.phase)drawCut(s,'#efe6ff',C.phase,6);else if(s.kind==='wind')drawCut(s,C.white,C.wind,6);else if(s.kind==='fire')drawCut(s,'#d8f6ff',C.water,7);else if(s.kind==='neck')drawCut(s,PAL.pale[0],'#2a1a1a',4);else if(s.kind==='chain')drawCut(s,C.steel,'#3a3a42',2);else if(s.kind==='smoke')drawCut(s,'#d8d0d8',C.smoke,9);else if(s.kind==='shove')drawCut(s,'#e8f8ff','#6aa84f',11);else if(s.kind==='tongue')drawCut(s,'#ffb0c0','#e0607a',5);else drawCut(s,'#fff6e0',C.curse,(s.hr||8)*0.75);}
  for(const s of S.slashes){if(s.blocked)drawCut(s,C.bone,C.ash,5);else if(s.kind==='bullet')drawCut(s,s.blood?C.white:'#fff6e0',s.blood?C.hi:C.mon,s.blood?6:2);else if(s.kind==='thrown')drawCut(s,C.white,C.steel,4);else if(s.kind==='chain'&&!s.blood)drawCut(s,C.white,'#8a8a92',4);else if(s.blood){const tc=tsCut(),w=Math.max(8,s.hr*0.9);if(!drawSkinCut(s,w))drawCut(s,tc[0],tc[1],w);if(!s.done||s.linger>0)tsCutFx(s);}else if(s.ult){const tc=tsCut(),w=Math.max(10,s.hr*0.9);if(!drawSkinCut(s,w))drawCut(s,tc[0],tc[1],w);}else if(s.ghost)drawCut(s,'#2a1a3a',C.phase,Math.max(6,s.hr*0.8));else if(s.isWave)drawCut(s,C.white,C.wind,Math.max(6,s.hr*0.7));else if(s.fireTrail&&s.done)drawCut(s,'#d8f6ff',C.water,Math.max(6,s.hr));else{const ss=slashSet();drawCut(s,ss.core,setCol(ss.edge),Math.max(6,s.hr*(s.isTap?0.7:0.8)));}}
  for(const m of S.marks){const x=LX(m.x),y=LY(m.y),L=m.ult?16:11;pline(x-m.c*L,y-m.s*L,x+m.c*L,y+m.s*L,m.life>0.06?C.white:C.hi,1,m.ult?2:1);}
  for(const b of S.bolts){let x=LX(b.a.x),y=LY(b.a.y);const tx=LX(b.b.x),ty=LY(b.b.y);for(let i=1;i<=6;i++){const nx=x+(tx-x)/(7-i)+(i<6?rand(-4,4):0),ny=y+(ty-y)/(7-i)+(i<6?rand(-4,4):0);pline(x,y,nx,ny,i%2?'#e8f0ff':'#9ab8ff');x=nx;y=ny;}}
  drawOrbs();drawAuras();
  if(S.swipe)drawSwipe();
  for(const p of S.parts){const x=LX(p.x),y=LY(p.y),a=clamp(p.life/p.max*1.5,0,1);pset(x,y,p.col,a);if(p.size>1){pset(x+1,y,p.col,a);pset(x,y+1,p.col,a);}}
  drawArenaDark();
  if(CFG.hitboxes){pcircle(LX(P.x),LY(P.y),P.r/PX,C.spirit);for(const e of S.enemies)pcircle(LX(e.x),LY(e.y),e.r/PX,C.hi);for(const s of S.slashes)if(!s.done){const h=head(s);pcircle(LX(h.x),LY(h.y),s.hr/PX,C.bone);}}
  flush();
  for(const t of S.texts){if(Math.floor(t.t*20)%2&&t.t<0.3)continue;ptext(t.s,LX(t.x),LY(t.y),t.col,t.big?16:8);}
  if(CFG.hitboxes)for(const e of S.enemies)ptext(`${e.state}${e.react?'>'+e.react.kind:''}`,LX(e.x)+10,LY(e.y),C.ash,8,'left');
  drawPrompt();
  if(S.mode==='run'&&P.hp>0&&S.meter>=btCost()&&!btOn()&&!S.drink&&S.gt%6<2.5&&Math.floor(S.gt*3)%2===0)ptext(S.touchUI?'THIRST READY':'R  BLOODTHIRST',LX(P.x),LY(P.y)-44,C.hi,8);
  lx.setTransform(1,0,0,1,0,0);
  drawEvent();flush();
  drawOffscreen();flush();
  if(S.mode==='run'){S.mapBottom=56;drawCompactHud();drawMinimap();drawAbilityChips();
    if(S.gmx&&S.gmx.tide&&S.tideT!=null&&S.floor&&!['store','arena','hub'].includes(S.floor.kind)){const t=Math.max(0,Math.ceil(S.tideT));ptext(t>0?`TIDE ${t}`:'THE TIDE IS IN',LW/2,S.touchUI?60:58,t>15?C.water||'#6ec8ff':C.hi,8);}
    if(S.gm&&S.gm.id==='waves'&&S.gm.wave)ptext(`WAVE ${S.gm.wave}`,LW-6,S.touchUI?50:12,C.bone,8,'right');
    if(S.gm&&S.gm.id==='rush')ptext(`${S.gm.idx} / ${RUSH_LIST().length} · ${fmtTime((Date.now()-S.gm.t0)/1000)}`,LW-6,S.touchUI?50:12,C.bone,8,'right');}
  if(S.combo>=3&&S.dead<=0){const rk=comboRank(S.combo),col=rk?rk.col:C.bone,x=LW-6,y=(S.touchUI?44:20)-(S.comboPop>0.5?1:0);
    ptext('×'+S.combo,x,y,col,16,'right');if(rk)ptext(rk.name,x,y+10,col,8,'right');const w=Math.round(40*clamp(S.comboT/3,0,1));lx.fillStyle=C.out;lx.fillRect(x-41,y+13,42,3);lx.fillStyle=col;lx.fillRect(x-40+(40-w),y+14,w,1);}
  drawBanners();
  if(S.mode==='run'){drawFoeHud();flush();drawTrace();}
  if(CFG.god)ptext('INVINCIBLE',LW-4,LH-6,C.curse,8,'right');else if(cheatsOn())ptext('CHEATS',LW-4,LH-6,C.curse,8,'right');
  if(S.hurt>0){const a=S.hurt*0.6;for(let x=0;x<LW;x++)for(let y=0;y<6;y++){pset(x,y,C.blood,a);pset(x,LH-1-y,C.blood,a);}for(let y=6;y<LH-6;y++)for(let x=0;x<6;x++){pset(x,y,C.blood,a);pset(LW-1-x,y,C.blood,a);}flush();}
  if(S.dead>0){lx.globalAlpha=0.7;lx.fillStyle='#060405';lx.fillRect(0,LH/2-20,LW,36);lx.globalAlpha=1;ptext('YOUR SOUL SCATTERS',LW/2,LH/2,C.hi,8);if(!S.pro)ptext(`LEVEL ${flName()}`,LW/2,LH/2+11,C.ash,8);}
  if(S.flash>0&&CFG.flashes!==false){lx.globalAlpha=Math.min(0.55,S.flash*5);lx.fillStyle='#ffffff';lx.fillRect(0,0,LW,LH);lx.globalAlpha=1;}
  if(S.trans){const a=S.trans.phase==='out'?S.trans.t/0.16:1-S.trans.t/0.16;lx.globalAlpha=clamp(a,0,1);lx.fillStyle='#000';lx.fillRect(0,0,LW,LH);lx.globalAlpha=1;}
  if(CFG.cursor&&S.mouseSeen&&S.mouseIn&&S.mode==='run'&&S.running&&!S.choosing&&!S.dialog){
    const x=Math.round(S.mouse.x/PX),y=Math.round(S.mouse.y/PX),col=S.denyT>0||btOn()?C.hi:C.bone;
    const ring=(v,mx,r,c)=>{if(v<=0||mx<=0)return;const f=v/mx,n=Math.round(r*3.6);for(let i=0;i<n;i++){if(i/n>f)break;const an=-Math.PI/2+i/n*Math.PI*2;pset(x+Math.cos(an)*r,y+Math.sin(an)*r,c);}};
    ring(Math.max(S.cdCut,S.cdLock),Math.max(S.cdCutMax,0.01),9,S.denyT>0&&S.denyKind==='cut'?C.hi:C.blood);ring(Math.max(S.cdTap,S.cdLock),Math.max(S.cdTapMax,0.01),6,S.denyT>0&&S.denyKind==='tap'?C.hi:C.ash);
    for(const [dx,dy] of [[1,0],[-1,0],[0,1],[0,-1]])for(const r of [2,3,4])pset(x+dx*r+1,y+dy*r+1,C.out);pset(x+1,y+1,C.out);flush();
    for(const [dx,dy] of [[1,0],[-1,0],[0,1],[0,-1]])for(const r of [2,3,4])pset(x+dx*r,y+dy*r,col);pset(x,y,col);flush();
  }
  ctx.setTransform(1,0,0,1,0,0);ctx.imageSmoothingEnabled=false;ctx.drawImage(low,0,0);
  const slowK=clamp((CFG.timeScale-S.ts)/Math.max(0.05,CFG.timeScale),0,1);
  if(slowK>0.05){const g=ctx.createRadialGradient(LW/2,LH/2,LH*0.35,LW/2,LH/2,LH*0.85);g.addColorStop(0,'rgba(6,4,5,0)');g.addColorStop(1,`rgba(6,4,5,${0.6*slowK})`);ctx.fillStyle=g;ctx.fillRect(0,0,LW,LH);}
}

// ---------- HUD ----------
const hc={};
function setT(id,v){if(hc[id]!==v){hc[id]=v;$(id).textContent=v;}}
function setW(id,v){if(hc[id]!==v){hc[id]=v;$(id).style.width=v;}}
function updateHUD(){
  stageEl.classList.toggle('titling',S.mode==='title'||S.mode==='hub');
  const hk=P.hp+'/'+P.max+'/'+P.shield;
  if(hc.hp!==hk){hc.hp=hk;$('hp').innerHTML=Array.from({length:P.max},(_,i)=>`<span class="pip${i<P.hp?'':' lost'}"></span>`).join('')+(P.shield?'<span class="pip shield" title="Karakasa"></span>':'');}
  const om=orbMax(),m=Math.floor(S.meter),fr=v=>Math.round(clamp(v/om,0,1)*100)+'%';
  setW('meterFill',fr(S.meter));setT('meterPct',`${m} / ${om}`);setT('lenVal',`Kunai ${S.tools?S.tools.kunai:0} · Shuriken ${S.tools?S.tools.shuri:0}`);
  if(hc.mk!==om+'/'+healCost()+'/'+mendCost()+'/'+btCost()){hc.mk=om+'/'+healCost()+'/'+mendCost()+'/'+btCost();$('mkHeal').style.left=fr(healCost());$('mkMend').style.left=fr(mendCost());$('mkBt').style.left=fr(Math.min(om-1,btCost()));}
  const mw=$('meterWrap');mw.classList.toggle('full',S.meter>=btCost());mw.classList.toggle('armed',btOn());
  {const w=P.wpn;setT('wpnName',wName(w));setT('wpnDur',w?(w.dur<=0?'Broken':`${Math.ceil(w.dur)}/${w.max}`):'∞');setW('wpnFill',w?Math.round(w.dur/w.max*100)+'%':'100%');const el=$('wpnName').parentNode.parentNode;el.classList.toggle('broken',!!w&&w.dur<=0);el.classList.toggle('cursed',!!(w&&w.cursed));}
  setT('meterHint',S.drink?'Drinking…':btOn()?(S.bt.strike?'Bloodthirst: your next strike':`Bloodthirst ${S.bt.t.toFixed(1)}s`):`Q heal ${healCost()} · F mend ${mendCost()} · R thirst ${btCost()}`);
  setW('tapFill',Math.round((S.cdTapMax>0?1-S.cdTap/S.cdTapMax:1)*100)+'%');setT('tapVal',S.cdTap>0?S.cdTap.toFixed(1)+'s':'Ready');
  setW('cutFill',Math.round((S.cdCutMax>0?1-S.cdCut/S.cdCutMax:1)*100)+'%');setT('cutVal',S.cdCut>0?S.cdCut.toFixed(1)+'s':'Ready');
  {const tc=S.traceCd||0,kn=S.mode==='run'?knownTech(techW()).length:0;setW('trFill',Math.round((tc>0?1-tc/(S.traceCdMax||1):1)*100)+'%');setT('trVal',S.mode!=='run'?'–':!kn?'None':tc>0?tc.toFixed(1)+'s':`Ready · ${kn}`);
   const v=(tc>0?1-tc/(S.traceCdMax||1):1).toFixed(2);if(hc.tcd!==v){hc.tcd=v;$('tTrace').style.setProperty('--cd',v);}$('tTrace').classList.toggle('off',!kn||wBroken());$('tTrace').classList.toggle('armed',!!(S.traceArm||S.trace));}
  $('tHeal').classList.toggle('off',S.meter<healCost()||P.hp>=P.max);$('tMend').classList.toggle('off',!P.wpn||S.meter<mendCost()||P.wpn.dur>=P.wpn.max);$('tUlt').classList.toggle('ready',S.meter>=btCost()&&!btOn());
  setT('tKunaiN',String(S.tools?S.tools.kunai:0));setT('tShuriN',String(S.tools?S.tools.shuri:0));$('tKunai').classList.toggle('off',!S.tools||!S.tools.kunai);$('tShuri').classList.toggle('off',!S.tools||!S.tools.shuri);$('tThrow').classList.toggle('off',!P.wpn);
  {const pr=S.prompt;$('tUse').hidden=!pr;if(pr)setT('tUseL',pr.kind==='weapon'?(pr.price?'Buy':'Take'):pr.kind==='item'?'Buy':pr.smith?'Forge':'Talk');}
  const dc=CFG.dashCd*S.mods.dashCdMul;setW('dashFill',Math.round((dc>0?1-P.dashCd/dc:1)*100)+'%');setT('dashVal',P.dashCd>0?P.dashCd.toFixed(1)+'s':'Ready');
  {const v=(dc>0?1-P.dashCd/dc:1).toFixed(2);if(hc.dcd!==v){hc.dcd=v;$('tDash').style.setProperty('--cd',v);}}
  setT('monVal',String(S.mon));
  setT('floorVal',S.mode==='hub'||S.mode==='title'?'Shrine':S.floor?`${flName()} · ${S.floor.biome.name} · ${escapePct()}%`:'–');
  setT('shardVal',String(META.shards));setT('carryVal',S.mode==='run'?String(S.carry||0):'–');
}

// ---------- debug bench ----------
const fmt=(v,step)=>step<0.1?v.toFixed(2):step<1?v.toFixed(1):String(Math.round(v));
function buildDebug(){
  let html='';for(const B of BIOMES){html+=`<h4>${B.name} · ${B.jp}</h4>`;for(const k of TKEYS.filter(k=>TYPES[k].biome===B.key)){const T=TYPES[k];html+=`<div class="ros"><label><input type="checkbox" id="ros-${k}"><span>${esc(T.name)}<br><small>${esc(T.desc)}</small></span></label><button class="chip" type="button" data-spawn="${k}">Spawn</button></div>`;}
    for(const bk of [...B.bosses,...B.minis]){const Bo=BOSSES[bk];html+=`<div class="ros"><span style="flex:1">${esc(Bo.name)} <small>${Bo.mini?'mini boss':'lord'} · ${esc(Bo.title)}</small></span><button class="chip" type="button" data-boss="${Bo.key}">Spawn</button></div>`;}}
  html+='<h4>Duelists · duel rooms only</h4>';for(const k of TKEYS.filter(k=>TYPES[k].biome==='duel')){const T=TYPES[k];html+=`<div class="ros"><span style="flex:1">${esc(T.name)}<br><small>${esc(T.desc)}</small></span><button class="chip" type="button" data-spawn="${k}" data-duel="1">Spawn</button></div>`;}
  $('dbgRoster').innerHTML=html;
  $('dbgAbil').innerHTML='<div class="hd">Ability</div><div class="hd">Cut</div><div class="hd ult">Blood</div>'+ABILS.map(([k,l,d])=>`<div class="nm">${l}<small>${d}</small></div><label class="ck"><input type="checkbox" id="ab-normal-${k}" aria-label="${l} on normal cut"></label><label class="ck"><input type="checkbox" id="ab-ult-${k}" aria-label="${l} on blood strike"></label>`).join('');
  $('dbgToggles').innerHTML=TOGGLES.map(([k,l])=>`<label class="tg"><input type="checkbox" id="cfg-${k}"> ${l}</label>`).join('');
  $('dbgGroups').innerHTML=GROUPS.map(([g,items])=>`<div class="sec"><h3>${g}</h3>${items.map(([k,l,mn,mx,st])=>`<label class="sl" for="cfg-${k}"><span class="row"><span>${l}</span><output id="out-${k}"></output></span><input type="range" id="cfg-${k}" min="${mn}" max="${mx}" step="${st}"></label>`).join('')}</div>`).join('');
  for(const k of TKEYS){const el=$('ros-'+k);if(el)el.addEventListener('change',()=>{CFG.roster[k]=el.checked;save();el.blur();});}
  $('dbgRoster').addEventListener('click',e=>{const b=e.target.closest('[data-spawn],[data-boss]');if(!b)return;b.blur();if(S.mode!=='run'||S.inHub)startRun(0);
    if(b.dataset.boss){const e2=spawnEnemy(b.dataset.boss,{boss:true});S.boss=e2;S.room.cleared=false;}else{spawnEnemy(b.dataset.spawn,{duel:!!b.dataset.duel});S.room.cleared=false;}});
  for(const g of ['normal','ult'])for(const [k] of ABILS){const el=$(`ab-${g}-${k}`);el.addEventListener('change',()=>{CFG[g][k]=el.checked;if(k==='teleport'&&!el.checked)CFG[g].ricochet=false;save();syncDebug();el.blur();});}
  for(const [k] of TOGGLES){const el=$('cfg-'+k);el.addEventListener('change',()=>{CFG[k]=el.checked;save();el.blur();if(k==='sound'||k==='music'){auInit();auVol();syncSnd();}if(k==='cursor')cv.classList.toggle('nocur',CFG.cursor&&S.mouseSeen);});}
  for(const [,items] of GROUPS)for(const [k,,,,st,u] of items){const el=$('cfg-'+k);el.addEventListener('input',()=>{CFG[k]=parseFloat(el.value);$('out-'+k).textContent=fmt(CFG[k],st)+(u?' '+u:'');if(k==='sfxVol'||k==='musicVol')auVol();save();if(S.mode==='hub')renderHub();});el.addEventListener('change',()=>el.blur());}
  syncDebug();
}
function syncDebug(){
  for(const k of TKEYS){const el=$('ros-'+k);if(el)el.checked=!!CFG.roster[k];}
  for(const g of ['normal','ult'])for(const [k] of ABILS){const el=$(`ab-${g}-${k}`);el.checked=!!CFG[g][k];if(k==='ricochet')el.disabled=!CFG[g].teleport;}
  for(const [k] of TOGGLES)$('cfg-'+k).checked=!!CFG[k];
  for(const [,items] of GROUPS)for(const [k,,,,st,u] of items){$('cfg-'+k).value=CFG[k];$('out-'+k).textContent=fmt(CFG[k],st)+(u?' '+u:'');}
}
let wipeArmed=0;
document.querySelector('.dbg-actions').addEventListener('click',e=>{
  const b=e.target.closest('[data-act]');if(!b)return;b.blur();const act=b.dataset.act;
  if(act==='defaults'){CFG=fresh();save();syncDebug();syncSnd();auVol();return;}
  if(act==='shards'){META.shards+=100;saveMeta();if(S.mode==='hub')renderHub();return;}
  if(act==='wipe'){if(performance.now()-wipeArmed<3000){META={shards:0,up:{},wseen:{},runs:0,wins:0,bestFloor:0,kills:0,seen:{},legacy:true,realms:0,startW:''};saveMeta();b.textContent='Shrine progress reset';wipeArmed=0;if(S.mode==='hub')renderHub();}else{wipeArmed=performance.now();b.textContent='Click again to confirm';setTimeout(()=>{b.textContent='Reset shrine progress';},3000);}return;}
  if(S.mode!=='run'||S.inHub){if(['restart','next','boss','encounter','item','perk','duel','trinket','weapon','named','cursed','skills'].includes(act))startRun(0);else return;}
  if(act==='fill')addMeter(999);
  else if(act==='heal')P.hp=P.max;
  else if(act==='mon')S.mon+=50;
  else if(act==='item')giveItem(randomItem(1));
  else if(act==='perk')offerPerk();
  else if(act==='clear'){for(const en of [...S.enemies]){en.hp=0;kill(en,null);}if(S.room.waves)S.room.waves=[];}
  else if(act==='map')S.revealAll=!S.revealAll;
  else if(act==='boss'){const B=BOSSES[realmPick().boss];const e2=spawnEnemy(B.key,{boss:true});S.boss=e2;S.room.cleared=false;S.banner={name:B.name,title:B.title,t:2.4};sfx('gong');}
  else if(act==='next')nextFloor();
  else if(act==='restart')startRun(0);
  else if(act==='encounter'){S.dbgEnc=((S.dbgEnc??-1)+1)%ENCOUNTERS.length;const enc=ENCOUNTERS[S.dbgEnc];S.room.objs=S.room.objs.filter(o=>o.kind!=='npc');enc.setup(S.room,clamp(P.x+110,WALL+160,S.room.w-WALL-160),clamp(P.y,WALL+120,S.room.h-WALL-90));b.textContent=`Encounter: ${enc.id} (next)`;}
  else if(act==='duel'){S.room.duel=makeDuel();startDuel(null);}
  else if(act==='trinket')giveItem(randomItem(0,0));
  else if(act==='weapon'){S.dbgW=((S.dbgW??-1)+1)%WKEYS.length;const w=makeWeapon(WKEYS[S.dbgW],{});P.wpn=null;equip(w);b.textContent=`Weapon: ${WEAPONS[w.id].name} (next)`;}
  else if(act==='skills'){S.dbgTech=!S.dbgTech;text(P.x,P.y-60,S.dbgTech?'ALL TECHNIQUES (THIS RUN)':'TECHNIQUES: ONLY FORGED ONES',C.hi);b.textContent=S.dbgTech?'Techniques: all (on)':'Learn all techniques (this run)';}
  else if(act==='breakw'){if(P.wpn){P.wpn.dur=1;wear(1);}}
  else if(act==='named'){const id=pick(WKEYS);P.wpn=null;equip(makeWeapon(id,{named:true,name:`Hayate's ${WEAPONS[id].name}`,perk:pick(NAMED_PERKS).id}));}
  else if(act==='cursed'){const id=pick(WKEYS);P.wpn=null;equip(makeWeapon(id,{cursed:pick(CURSES).id}));}
});

// ---------- loop ----------
let last=performance.now();
const LIVE={};window.__bkLive=LIVE;
let errCount=0;
function showErr(err){errCount++;try{console.error(err);}catch(_){}const box=$('errBox');if(!box)return;box.hidden=false;box.textContent=`Something broke (${errCount}×): ${err&&err.message?err.message:String(err)}. Send me this line. Refreshing the page usually clears it.`;}
function frame(now){
  if(CFG.cheatMoney||CFG.cheatTools||CFG.cheatTech)cheatTick();
  if(window.__bkLive!==LIVE){try{AU.ctx&&AU.ctx.close();}catch(_){}return;}
  try{
    const dt=clamp(((now||performance.now())-last)/1000,0,0.05);last=now||performance.now();S.frameN++;
    if(S.mode==='run'&&S.running&&!S.choosing&&!S.dialog&&!S.demo){update(dt);threatTick();}
    else{if(S.dialog)miniTick(dt);if(S.trans&&S.mode==='run')updateTrans(dt);updateCam(0.016);if(!S.paused&&!S.choosing&&!S.dialog){S.gt+=dt;updateAmbient(dt);updateParts(dt);if(S.room)updateCorpses(dt);}}
    musicTick();draw();updateHUD();
  }catch(err){showErr(err);try{lx.setTransform(1,0,0,1,0,0);lx.globalAlpha=1;lx.globalCompositeOperation='source-over';BUF=new Map();}catch(_){}}
  requestAnimationFrame(frame);
}
async function start(){
  try{document.fonts&&document.fonts.load('8px Silkscreen');document.fonts.load('16px Silkscreen');}catch(_){}
  loadCfg();loadMeta();applySettings();buildSprites();buildProps();buildProps2();
  await loadPlayer();if(!PL.ready)playerFallback();await loadChars();try{applyLook();}catch(_){}
  buildButtonIcons();buildDebug();syncSnd();
  S.floor=genFloor(1);enterRoom(S.floor.start,null);
  showTitle();studioSplash();
  requestAnimationFrame(frame);
}
window.__bk={TR,tr,LANG,tutDemo,threatCard,THREATS,hudGuide,hudTab,HUD_TABS,demoClose,drawDemo,TUT,studioSplash,ELEMS,elemProc,hermitOffer,placeHermitRoom,MUS,songFor,startPrologue,proEvent,proFall,PRO_STEPS,claimGift,giftState,pvLook,genFloorX:genFloor,modeFloorX:modeFloor,hurtPlayer,buzz,dailyCfg,startMode,modeScore,flName,totalFloors,cosGrant,cosEquip,cosOwned,COS,rollSpin,spinState,applyLook,featEvent,featCheck,FEATS,SHRINE_NPCS,MENU_ACTS,onDeath,reviveRun,ARM,bestPct,MODIFIERS,openTrials,openHellPick,startSpar,storyGate,ACTS,nextFloor,interact,skipType,dlgChoose,chooserPick,closeForge,closeDialog,neighbor,dash,throwTool,drinkBlood,roomsLeft,showSummary,ITEM,startTutorial,tutEvent,endTutorial,continueRun,saveRun,loadRunData,clearRun,menuOpen,menuClose,handleBack,playEnding,pause,resume,showTitle,enterHub,glyphPts,SHAPE_PTS,startWind,launchStrike,updateFoes,glyphBreak,traceSegs,segTech,updateTrace,aiSkill,BOSSES,TYPES,enterRoom,startRun,shieldBlocks,BIOMESX:BIOMES,S,P,CFG:()=>CFG,DUELS,makeWeapon,equip,wear,throwWeapon,throwTool,mendWeapon,bloodthirst,openForge,closeForge,openTree,closeTree,buyTreeNode,treeLayout,nodeState,TV,TREES,WEAPONS,SKILLS,readShape,shapeStats,castTech,makeCut,tryCounter,startHook,beginTrace,endTrace,addTracePt,armTrace,knownTech,curW,bankShards,META2:()=>META,genObstacles,reachableOK,SMPR:()=>[SMP_READY,Object.keys(SMP).length],drinkBlood,startDuel,makeDuel,startSumo,startParade,startTengu,startTag,dlgPress,dlgMini,liarPuzzle,META:()=>META,update,releaseSwipe,spawnEnemy,startWind,showSummary,startRun,nextFloor,offerPerk,takePerk,giveItem,interact,goRoom,enterRoom,ENC,ENCOUNTERS,TYPES,BOSSES,ITEMS,SPR,dlgChoose,qdPress,showHub};
try{window.claude?.hot?.snapshot?.(()=>({}));}catch(_){}
window.claude?.hot?.ready?window.claude.hot.ready(()=>start()):start();

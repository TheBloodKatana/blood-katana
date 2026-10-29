// ================= the try-on stage: a little live scene where your samurai shows off whatever you are looking at =================
// It is the game's own drawing: the same sprites, the same held-weapon code, the same slash colours, drawn into a small canvas.
const PVW=112,PVH=60;
const PV={cv:null,g:null,raf:0,t:0,last:0,look:null,parts:[],cuts:[],ink:[],loop:-1,hitT:0,shake:0,spr:new Map(),floor:null,cast:false};
// what to show: start from what you wear and swap in the items being looked at
function pvLook(keys){
  const st=cosState(),L={o:equippedOid(),set:slashSet(),w:'katana',skin:null};
  for(const key of [].concat(keys||[])){const it=COS[key];if(!it)continue;
    if(it.type==='o')L.o=it.id;else if(it.type==='s')L.set=it;else if(it.type==='k'){L.w='katana';L.skin=it;}else if(it.type==='w'){L.w=it.w;L.skin=it;}else if(it.type==='t')L.thirst=it;}
  if(!L.skin)L.skin=wSkinCols(L.w);
  return L;
}
function pvSprite(oid,set){
  const k=oid+'|'+set.id;let sp=PV.spr.get(k);if(sp)return sp;
  if(PV.spr.size>30)PV.spr.clear();
  const L=lookFrames(oid,set);sp={ax:L.ax,frames:L.frames,w:L.frames[0].c.width,h:L.frames[0].c.height};PV.spr.set(k,sp);return sp;
}
function pvFloor(){
  if(PV.floor)return PV.floor;const c=mk(PVW,PVH),g=c.getContext('2d');
  g.fillStyle='#0d0a0f';g.fillRect(0,0,PVW,PVH);
  // a dojo wall with a paper screen, then the plank floor
  g.fillStyle='#17121a';g.fillRect(0,0,PVW,24);g.fillStyle='#211a24';for(let x=4;x<PVW;x+=22){g.fillRect(x,4,17,17);}
  g.fillStyle='#2c2330';for(let x=4;x<PVW;x+=22){g.fillRect(x+8,4,1,17);g.fillRect(x,12,17,1);}
  g.fillStyle='#3a2a1e';g.fillRect(0,24,PVW,2);g.fillStyle='#120e14';g.fillRect(0,26,PVW,1);
  for(let y=27;y<PVH;y+=6){g.fillStyle=(y/6|0)%2?'#16111a':'#141017';g.fillRect(0,y,PVW,6);g.fillStyle='#0f0b11';g.fillRect(0,y,PVW,1);
    for(let x=((y*7)%23);x<PVW;x+=23+((x*y)%11)){g.fillRect(x,y,1,6);}}
  // vignette
  const d=g.getImageData(0,0,PVW,PVH),p=d.data;for(let y=0;y<PVH;y++)for(let x=0;x<PVW;x++){const u=(x-PVW/2)/(PVW/2),v=(y-PVH*0.6)/(PVH*0.7),k=Math.max(0,Math.min(1,(u*u+v*v-0.35)*0.9)),i=(y*PVW+x)*4;p[i]*=1-k*0.75;p[i+1]*=1-k*0.75;p[i+2]*=1-k*0.75;}
  g.putImageData(d,0,0);return PV.floor=c;
}
// ---- the scene script, one loop every 4.4 s ----
const PX0=38,PY0=51,DX0=78;
const PV_BEATS=[{t:0.55,k:'side'},{t:1.3,k:'down'},{t:2.1,k:'trace'},{t:2.62,k:'cast'}];
function pvCut(cx,cy,r,a0,a1,w,set){PV.cuts.push({cx,cy,r,a0,a1,w,set,t:0,trav:0.09,ling:0.06,fade:0.2});}
function pvBurst(x,y,n,cols,sp){for(let i=0;i<n;i++){const a=Math.random()*Math.PI*2,v=(sp||1)*(30+Math.random()*80);PV.parts.push({x,y,vx:Math.cos(a)*v,vy:Math.sin(a)*v-20,life:0.3+Math.random()*0.45,max:0.75,col:cols[i%cols.length],size:Math.random()<0.3?2:1});}}
const pvCutSet=()=>{const L=PV.look,T=L.thirst;return T?{core:T.core,edge:T.edge,burst:T.ac,fx:T.cutfx}:L.set;};
function pvHit(n,big){const s=pvCutSet();PV.hitT=0.09;PV.shake=big?0.12:0.06;pvBurst(DX0,PY0-14,n,s.burst,big?1.4:1);if(PV.audible)sfx(big?'slash':'hit');}
function pvStep(dt){
  const T0=PV.t,T1=PV.t+dt;PV.t=T1;const lp=Math.floor(T1/4.4);
  if(lp!==PV.loop){PV.loop=lp;PV.ink=[];PV.cast=false;}
  const lt0=T0-lp*4.4,lt1=T1-lp*4.4,L=PV.look;
  for(const b of PV_BEATS)if(lt0<b.t&&lt1>=b.t){
    if(b.k==='side'){PV.anim={k:'side',t:0};pvCut(PX0+6,PY0-14,24,-1.15,1.0,7,pvCutSet());setTimeout(()=>PV.cv&&pvHit(10),60);}
    else if(b.k==='down'){PV.anim={k:'down',t:0};pvCut(PX0+4,PY0-16,22,-1.9,0.55,7,pvCutSet());setTimeout(()=>PV.cv&&pvHit(10),60);}
    else if(b.k==='trace'){PV.ink=[];PV.traceT=0;}
    else if(b.k==='cast'){PV.cast=true;pvCut(DX0-2,PY0-14,18,-2.4,0.8,9,pvCutSet());pvCut(DX0+2,PY0-14,18,-0.7,2.4,9,pvCutSet());setTimeout(()=>PV.cv&&pvHit(24,true),70);}
  }
  if(PV.traceT!=null){PV.traceT+=dt;const k=Math.min(1,PV.traceT/0.45);const n=Math.floor(k*30);while(PV.ink.length<n){const i=PV.ink.length,a=-Math.PI/2+i/30*Math.PI*2;PV.ink.push({x:DX0+Math.cos(a)*15,y:PY0-15+Math.sin(a)*12});}if(PV.traceT>0.8){PV.traceT=null;PV.ink=[];}}
  if(PV.anim){PV.anim.t+=dt;if(PV.anim.t>0.24)PV.anim=null;}
  for(const c of PV.cuts)c.t+=dt;PV.cuts=PV.cuts.filter(c=>c.t<c.trav+c.ling+c.fade);
  for(const p of PV.parts){p.x+=p.vx*dt;p.y+=p.vy*dt;const k=Math.max(0,1-dt*5);p.vx*=k;p.vy*=k;p.life-=dt;}PV.parts=PV.parts.filter(p=>p.life>0);
  PV.hitT=Math.max(0,PV.hitT-dt);PV.shake=Math.max(0,PV.shake-dt);
}
function pvDrawCut(c){
  const set=c.set,u=Math.min(1,c.t/c.trav),done=c.t>=c.trav,fadeK=done?Math.max(0,1-Math.max(0,c.t-c.trav-c.ling)/c.fade):1;
  const span=(c.a1-c.a0)*u,n=Math.max(4,Math.ceil(Math.abs(span)*c.r/2));
  for(let i=0;i<=n;i++){const v=i/n,a=c.a0+span*v,x=c.cx+Math.cos(a)*c.r,y=c.cy+Math.sin(a)*c.r*0.8,tx=-Math.sin(a),ty=Math.cos(a)*0.8;
    const prof=done?Math.pow(Math.sin(Math.PI*v),0.7):(v<0.9?Math.pow(v/0.9,0.6):(1-v)/0.1),w=c.w/2*prof*(done?(0.4+0.6*fadeK):1),r=Math.round(w),cr=Math.floor(w*0.4);
    const edge=set.fx==='fire'?HEAT[2+((i+(PV.t*14|0))%2)]:set.fx==='moon'?'#c0001e':setCol(set.edge,i>>2);if(r<=0){pset(x,y,edge,fadeK);continue;}
    const al=done?fadeK:1;
    if(set.fx==='fire'){const R2=r+1;for(let k=-R2;k<=R2;k++)pset(x-ty*k,y+tx*k,Math.abs(k)<=cr?'#fff6c0':Math.abs(k)>r?HEAT[1]:edge,al);
      if(i%2===0){const h=Math.round((Math.sin(i*0.9+PV.t*24)+1)*2*al);for(let j=1;j<=h;j++)pset(x,y-R2-j,HEAT[clamp(4-j,0,4)],al*(1-j/(h+2)));}continue;}
    if(set.fx==='moon'){const R2=r+1;for(let k=-R2;k<=R2;k++)pset(x-ty*k,y+tx*k,Math.abs(k)>r?'#f0e8ff':Math.abs(k)<=cr?'#0a0004':edge,al);
      if(i%5===0){const ph=(PV.t*1.6+i*0.13)%1;pset(x,y+R2+1+ph*6,'#ff1030',al*(1-ph));}continue;}
    for(let k=-r;k<=r;k++)pset(x-ty*k,y+tx*k,Math.abs(k)<=cr?set.core:edge,al);}
  if(!done){const a=c.a0+span,x=c.cx+Math.cos(a)*c.r,y=c.cy+Math.sin(a)*c.r*0.8;pset(x,y,'#ffffff');pset(x+1,y,'#ffffff');}
}
function pvShadow(x,y,w){for(let yy=-1;yy<=1;yy++){const ww=Math.round(w*Math.sqrt(1-yy*yy/4));for(let xx=-ww;xx<=ww;xx++)pset(x+xx,y+yy,'#050305',0.5);}}
function pvRender(){
  const L=PV.look,g=PV.g;if(!g||!L)return;
  flush();const keep=lx,gt=S.gt,face=S.face;lx=g;S.gt=PV.t;S.face=1;TS_LEND=L.thirst||null;
  try{
    g.setTransform(1,0,0,1,0,0);g.globalAlpha=1;g.drawImage(pvFloor(),0,0);
    const sx=PV.shake>0?Math.round((Math.random()-.5)*2):0;g.setTransform(1,0,0,1,sx,0);
    // the straw dummy
    pvShadow(DX0,PY0,6);flush();
    const dm=SPR.dummy;if(dm){const wob=PV.hitT>0?1:0,img=PV.hitT>0.04?dm.wr[0]:dm.r[0];g.drawImage(img,Math.round(DX0-dm.ax+wob),Math.round(PY0-dm.ay));}
    // the hero
    const sp=pvSprite(L.o,L.set),an=PV.anim,f=an?(an.k==='down'?(an.t<0.05?3:an.t<0.11?4:5):(an.t<0.07?6:7)):0,fr=sp.frames[Math.min(f,sp.frames.length-1)];
    pvShadow(PX0,PY0,6);flush();
    const ox=Math.round(PX0-sp.ax),oy=Math.round(PY0-(sp.h-1));g.drawImage(fr.c,ox,oy);
    // the weapon in hand, hidden while the swing frames carry the cut, just like in a fight
    const T=L.thirst,lt0=PV.t-PV.loop*4.4,tg=T?Math.max(0,Math.min(1,(lt0-0.2)/0.35))*(lt0>4.1?Math.max(0,(4.4-lt0)/0.3):1):0;
    if(T&&tg>0){thirstAura(T,PV.t,PX0,PY0-18,tg);thirstAct(T,(lt0-0.2)/0.7,PX0,PY0-18,PV.t);}
    if(!an){const h={x:ox+fr.hand.x,y:oy+fr.hand.y},blood=T?true:PV.loop%2===1,lt=lt0,gg=T?tg:blood?Math.max(0,Math.min(1,(lt-3.2)/0.35))*(lt>4.15?Math.max(0,(4.4-lt)/0.25):1):0;
      const a=PV.cast?-0.2:L.w==='kama'?-0.15:-0.55-Math.sin(PV.t*2)*0.04;
      drawHeld(h,a,L.w,false,gg>0,false,false,{skin:L.skin,face:1,g:gg});}
    flush();
    for(const c of PV.cuts)pvDrawCut(c);
    // the drawn technique glyph, in the set's trace colours
    PV.ink.forEach((q,i)=>{const col=setCol(L.set.tr,i>>2);pset(q.x,q.y,col);pset(q.x+1,q.y,col);if(i===PV.ink.length-1){pset(q.x,q.y-1,L.set.trc||'#ffffff');pset(q.x+1,q.y-1,L.set.trc||'#ffffff');}});
    for(const p of PV.parts){const a=Math.min(1,p.life/p.max*1.5);pset(p.x,p.y,p.col,a);if(p.size>1){pset(p.x+1,p.y,p.col,a);pset(p.x,p.y+1,p.col,a);}}
    flush();g.setTransform(1,0,0,1,0,0);
  }catch(e){try{console.error(e);}catch(_){}}
  lx=keep;S.gt=gt;S.face=face;TS_LEND=null;
}
function pvFrame(now){
  if(!PV.cv||!PV.cv.isConnected){pvStop();return;}
  const dt=Math.min(0.05,(now-(PV.last||now))/1000);PV.last=now;pvStep(dt);pvRender();PV.raf=requestAnimationFrame(pvFrame);
}
function pvMount(cv,keys){
  if(!cv)return;pvStop();PV.cv=cv;PV.g=cv.getContext('2d');PV.g.imageSmoothingEnabled=false;PV.look=pvLook(keys);PV.keys=keys;
  PV.t=0.3;PV.loop=-1;PV.parts=[];PV.cuts=[];PV.ink=[];PV.anim=null;PV.traceT=null;PV.last=0;PV.audible=false;
  pvRender();PV.raf=requestAnimationFrame(pvFrame);
}
function pvSet(keys){if(!PV.cv)return;PV.look=pvLook(keys);PV.keys=keys;PV.t=0.3;PV.loop=-1;PV.cuts=[];PV.ink=[];PV.parts=[];PV.anim=null;PV.traceT=null;}
function pvStop(){if(PV.raf)cancelAnimationFrame(PV.raf);PV.raf=0;PV.cv=null;PV.g=null;}

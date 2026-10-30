// ================= foes that push back: grabs, sky rain, ground waves, breath, ink, shields, hovering, eaters, glyph duels, and the pack AI =================
const GRABC='#e0306a';
const RAINK={blade:{col:C.steel,core:C.white},ice:{col:C.ice,core:C.white},bolt:{col:'#ffe066',core:C.white},fire:{col:C.fire,core:'#ffe7a8'},coin:{col:C.mon,core:'#fff3c4'},bone:{col:'#d8d0c0',core:C.white},
  ofuda:{col:'#e8e0c8',core:'#c01830'},ink:{col:'#3a2a4a',core:'#8a6aa8'},blood:{col:C.hi,core:C.white},spike:{col:'#8a9298',core:C.white}};
RAINK.bell={col:'#c8a050',core:'#fff3c4'};RAINK.slam={col:C.hi,core:C.white};
const RAINSFX={blade:'tap',ice:'shotcut',bolt:'zap',fire:'fire',coin:'coin',bone:'crate',ofuda:'paper',ink:'splash',blood:'hit',spike:'spike'};
const SHOTCOL={fox:C.fox,web:C.web,ice:C.ice,water:C.water,frost:'#d8f6ff',flame:C.fire,feather:'#2a2030',ink:'#3a2a4a',kunai:C.steel,coin:C.mon,petal:'#f4a0b8',ofuda:'#e8e0c8',bone:'#e8e0d0'};
const shotCol=k=>SHOTCOL[k]||C.water;
const realmN=()=>S.floor?S.floor.realm||0:0;
// how sharp the foes are: grows with every realm and a little with every floor
const aiSkill=()=>clamp(0.45+0.06*realmN()+(S.floor?0.015*((S.floor.stage||1)-1):0),0.3,1);
const leadK=()=>clamp(0.3+0.07*realmN(),0.3,0.95);
function predictP(t){const k=leadK();return{x:P.x+P.vx*t*k,y:P.y+P.vy*t*k};}
function glyphPts(shape,cx,cy,R){const P0=SHAPE_PTS[shape]||SHAPE_PTS.v;return P0.map(([x,y])=>({x:cx+x*R,y:cy+y*R}));}

// ---------- new attack patterns: built when the windup starts, or (later) the moment it lands ----------
function newPattern(e,pat,c){
  if(SIGS[pat])return SIGS[pat](e,c);
  const M=CFG.eSlashMul;
  switch(pat){
    case'grab':return{cuts:[c.line(Math.min(c.d+60,300),c.base*1.25,{carry:true,kind:'grab',grab:true,phase:true,hr:13,tier:3,tcol:GRABC,col:GRABC,core:'#ffd0e0'})],tele:1.05};
    case'devour':return{cuts:[c.line(Math.min(c.d+80,340),c.base*1.1,{carry:true,kind:'grab',grab:true,devour:true,phase:true,hr:22,tier:3,tcol:GRABC,col:'#8a1a2a',core:'#ffb0b0'})],tele:1.15};
    case'bolt':return{cuts:[c.line(Math.min(c.d+170,540),2400*M,{carry:true,kind:'bolt',tier:3,hr:10,tcol:'#ffe066',col:'#ffe066',core:C.white})],tele:0.95};
    case'rain':return{later:rainLater,tele:1.1,pose:'draw'};
    case'spikes':return{later:spikesLater,tele:1.0};
    case'ring':return{later:ringLater,tele:1.05};
    case'breath':return{later:ee=>{breathStream(ee,ee.T.breath||'frost');return[];},tele:1.0,pose:'draw'};
    case'feathers':return{shots:[-2,-1,0,1,2].map(i=>({a:c.aShot+i*0.15,sp:600,kind:'feather',r:5})),later:ee=>{ee.busyT=0.4;S.pending.push({t:0.3,fn:()=>{if(S.enemies.includes(ee)&&ee.state==='strike')featherVolley(ee,4,0.2,640);}});return[];},tele:0.95,pose:'strike'};
    case'inkblot':return{shots:[-0.3,0,0.3].map(o=>({a:c.aShot+o,sp:320,kind:'ink',r:8,home:1.6,homeT:0.7})),tele:1.0};
    case'sixarm':return{later:ee=>{const b=c.base*1.3;seqCuts(ee,6,0.13,i=>{const pp=predictP(0.2),a=i*Math.PI/6+rand(-0.3,0.3),L=86;return eCut(ee,[{x:pp.x-Math.cos(a)*L,y:pp.y-Math.sin(a)*L},{x:pp.x+Math.cos(a)*L,y:pp.y+Math.sin(a)*L}],b,{tier:2,hr:10});});return[];},tele:1.05};
  }
  return null;
}
// cuts that land one after another while the foe stays committed to the strike
function seqCuts(e,n,gap,build){e.busyT=Math.max(e.busyT||0,n*gap+0.12);
  for(let i=0;i<n;i++)S.pending.push({t:i*gap,fn:()=>{if(!S.enemies.includes(e)||e.state!=='strike')return;for(const c of [].concat(build(i)||[])){S.eslashes.push(c);e.cuts.push(c);}if(onScreen(e))sfx('eswing');}});}
// a mark on the ground, then something falls on it
function skyMark(e,x,y,r,delay,kind,fn){const m={x,y,r,t:delay,max:delay,kind,owner:e,fn};S.tmarks.push(m);return m;}
function impact(e,x,y,r,kind){
  const K=RAINK[kind]||RAINK.blade,a=Math.random()*Math.PI;
  for(const b of [a,a+Math.PI/2])S.eslashes.push(makeCut([{x:x-Math.cos(b)*r*0.8,y:y-Math.sin(b)*r*0.8},{x:x+Math.cos(b)*r*0.8,y:y+Math.sin(b)*r*0.8}],1e6,{team:'e',owner:null,hitP:true,phase:true,hr:6,col:K.col,core:K.core,fx:true}));
  burst(x,y,12,K.col,240,0.4,2);S.rings.push({x,y,r,life:0.25,col:K.col});S.shake+=e&&e.boss?2:1;
  if(onScreen({x,y}))sfx(RAINSFX[kind]||'tap');
  if(P.inv<=0&&!CFG.god&&S.dead<=0&&!(P.z>8)&&dist(P,{x,y})<r*0.7+P.r*0.5){const hp0=P.hp;hurtPlayer({owner:e,hitP:false,kind:'rain',rk:kind});
    if(P.hp<hp0){if(kind==='ice'){P.slowT=Math.max(P.slowT,1.3);text(P.x,P.y-62,'FROZEN',C.ice);}
      if(kind==='ink'){S.inkLock=Math.max(S.inkLock||0,2.5);text(P.x,P.y-62,'BRUSH BLOTTED',C.phase);}
      if(kind==='coin'&&S.mon>0){const k=Math.min(S.mon,5);S.mon-=k;text(P.x,P.y-62,`TOLL −${k}文`,C.mon);}}}
}
function rainLater(e){
  const R=e.T.rain||{kind:'blade',n:5,r:100},n=R.n+(e.enraged?2:0),rad=e.boss?50:42,pts=[inArena(predictP(0.6),30)];
  for(let i=1,tries=0;i<n&&tries<90;tries++){const a=Math.random()*Math.PI*2,r=Math.sqrt(Math.random())*R.r*1.6+24,q=inArena({x:P.x+Math.cos(a)*r,y:P.y+Math.sin(a)*r},30);if(pts.every(o=>dist(o,q)>rad*1.1)){pts.push(q);i++;}}
  pts.forEach((q,i)=>skyMark(e,q.x,q.y,rad,0.62+i*0.07,R.kind,m=>impact(e,m.x,m.y,m.r,m.kind)));
  e.busyT=0.62+pts.length*0.07+0.1;return[];
}
function spikesLater(e){
  const pp=predictP(0.4),d=dist(pp,e)||1,ux=(pp.x-e.x)/d,uy=(pp.y-e.y)/d,L=Math.min(560,d+140);let i=0;
  for(let s=e.r+34;s<L;s+=46,i++){const q=inArena({x:e.x+ux*s,y:e.y+uy*s},20);skyMark(e,q.x,q.y,30,0.32+i*0.06,'spike',m=>impact(e,m.x,m.y,m.r,'spike'));}
  if(e.enraged)for(let k=-2;k<=2;k++){if(!k)continue;const q=inArena({x:pp.x-uy*k*48,y:pp.y+ux*k*48},20);skyMark(e,q.x,q.y,30,0.32+i*0.06+Math.abs(k)*0.06,'spike',m=>impact(e,m.x,m.y,m.r,'spike'));}
  e.busyT=0.32+i*0.06+0.3;return[];
}
const ringCol=()=>({ice:C.ice,hell:C.fire,river:C.water,peaks:'#ffe066',gakido:'#9a8aa8'})[curBiome().key]||C.curse;
function groundWave(e,o){const w=Object.assign({x:e.x,y:e.y,r:e.r,v:300,max:560,gapA:Math.random()*Math.PI*2,gapW:0.9,owner:e,hit:false,kind:'shock',col:C.curse,t:0},o);S.gwaves.push(w);return w;}
function ringLater(e){
  const R=e.T.ring||{n:1,gap:true},n=R.n+(e.enraged?1:0),col=ringCol(),kind=curBiome().key==='ice'?'frost':'shock';
  for(let i=0;i<n;i++)S.pending.push({t:i*0.38,fn:()=>{if(!S.enemies.includes(e))return;groundWave(e,{col,kind,gapW:R.gap?0.9:0,v:280+20*realmN()});S.shake+=3;if(onScreen(e))sfx('smash');}});
  e.busyT=n*0.38;return[];
}
function breathStream(e,kind){const n=11,gap=0.06;e.busyT=n*gap+0.15;e.breathDir=Math.random()<0.5?1:-1;
  for(let i=0;i<n;i++)S.pending.push({t:i*gap,fn:()=>{if(!S.enemies.includes(e)||e.state!=='strike')return;const cy=e.y-14,pp=predictP(0.35),base=Math.atan2(pp.y-12-cy,pp.x-e.x),a=base+(i/(n-1)-0.5)*0.7*e.breathDir+rand(-0.06,0.06),sp=kind==='frost'?330:380;
    S.shots.push({x:e.x+Math.cos(a)*e.r,y:cy+Math.sin(a)*e.r,vx:Math.cos(a)*sp,vy:Math.sin(a)*sp,spd:sp,r:7,kind,home:0,homeT:0,t:0,life:1.05,owner:e});if(i%3===0&&onScreen(e))sfx(kind==='frost'?'gust':'fire');}});}
function featherVolley(e,n,spread,sp){const cy=e.y-14,d=dist(P,e),pp=predictP(d/sp),a0=Math.atan2(pp.y-12-cy,pp.x-e.x);
  for(let i=0;i<n;i++){const a=a0+(i-(n-1)/2)*spread;S.shots.push({x:e.x+Math.cos(a)*e.r,y:cy+Math.sin(a)*e.r,vx:Math.cos(a)*sp,vy:Math.sin(a)*sp,spd:sp,r:5,kind:'feather',home:0,homeT:0,t:0,life:1.4,owner:e});}sfx('shuriken');}

// ---------- grabs: no parry, no counter stance. Dash through them ----------
function grabbed(s){
  const o=s.owner,hp0=P.hp;hurtPlayer(s,true);if(P.hp>=hp0||S.dead>0)return;
  S.held={e:o,t:0.5};P.kx=P.ky=0;S.slide=null;P.dashT=0;S.swipe=null;S.buffer=null;S.trace=null;S.traceArm=0;S.cdLock=Math.max(S.cdLock,0.55);P.dashCd=Math.max(P.dashCd,0.55);
  text(P.x,P.y-58,'GRABBED',C.hi,true);sfx('clang');
  if(o&&S.enemies.includes(o)){o.state='recover';o.t=0.75;for(const c of o.cuts)if(!c.done){c.done=true;c.fade=c.fadeMax=0.1;}
    if(s.devour){const h=Math.max(3,Math.round(o.max*0.06));o.hp=Math.min(o.max,o.hp+h);text(o.x,o.y-62,`DEVOURS +${h}`,C.hi);sfx('mochi');}
    if((o.T.disarm||s.disarm)&&P.wpn&&!P.wpn.own){const w=P.wpn;P.wpn=null;const a=Math.atan2(P.y-o.y,P.x-o.x)+rand(-0.6,0.6);dropWeapon(w,P.x+Math.cos(a)*210,P.y+Math.sin(a)*210);text(P.x,P.y-74,'STRIPPED OF YOUR WEAPON',C.hi);S.wpnBanner=null;}}
}
// ---------- shields: only the front. Flank them, hook them, swap them, or slam them ----------
function shieldBlocks(e,s){
  if(!e.T.shield||e.noShieldT>S.gt||s.ult||s.pierceArmor||s.hook)return false;
  if(['stun','recover','spawn','hide','eat'].includes(e.state))return false;
  if(s.kind==='smash'){e.noShieldT=S.gt+(e.boss?4:999);burst(e.x,e.y-14,20,C.steel,320,0.5,2.5);text(e.x,e.y-60,'SHIELD SHATTERED',C.hi,true);sfx('gbreak');S.shake+=5;
    if(!e.boss)S.pending.push({t:0,fn:()=>{if(S.enemies.includes(e))stunEnemy(e,0.8);}});return false;}
  const sd={x:Math.cos(e.shA||0),y:Math.sin(e.shA||0)},dp=dist(P,e)||1;
  if(((P.x-e.x)*sd.x+(P.y-e.y)*sd.y)/dp<0.34)return false;
  if(s.pts&&s.cum){const t=cutDir(s,e);if(-(t.x*sd.x+t.y*sd.y)<-0.35)return false;}
  return true;
}
function shieldClang(e,s){
  const sx=e.x+Math.cos(e.shA)*(e.r+4),sy=e.y-12+Math.sin(e.shA)*(e.r+4);burst(sx,sy,12,C.steel,320,0.3,2);sfx('clang');hitPause(3,e,1);S.shake+=2;
  if(!e.shMsg||S.gt>e.shMsg){e.shMsg=S.gt+2.5;text(e.x,e.y-58,'SHIELD · FLANK, HOOK OR SLAM',C.steel);}
  if(!s.child&&!s.aura&&!s.thrown&&s.kind!=='bullet'&&s.kind!=='kunai'){staggerPlayer(s.isTap?0.3:0.2);const a=Math.atan2(P.y-e.y,P.x-e.x);P.kx+=Math.cos(a)*140;P.ky+=Math.sin(a)*140;}
  if(s.wid&&!s.child)wear(1,s);
}
// lords are warded while they paint
function wardHit(e,s){burst(e.x,e.y-20,10,'#1a0a10',220,0.35,2);burst(e.x,e.y-20,6,C.hi,200,0.3,1);sfx('clang');hitPause(2,e,1);
  if(!e.wardMsg||S.gt>e.wardMsg){e.wardMsg=S.gt+1.5;text(e.x,e.y-62,'WARDED · TRACE THE GLYPH',C.hi);}
  if(!s.child&&!s.aura)staggerPlayer(0.15);}

// ---------- glyph duels ----------
function glyphBegin(e){
  const sh=pick(e.T.glyphs),dur=Math.max(1.7,2.7-0.08*realmN())*(e.enraged?0.88:1);
  if(e.T.final&&e.enraged&&!e.combo){e.combo=1;e.comboPat='glyph';}
  e.glyphShape=sh;e.wind=e.t=dur;e.feintAt=null;e.later=glyphUnleash;S.glyph={e,shape:sh,t:0,dur};threatQueue('glyph',0);
  text(e.x,e.y-84,'A GLYPH',C.hi,true);sfx('paper');sfx('gong');
}
function glyphUnleash(e){
  const sh=e.glyphShape||'v';S.glyph=null;const c={x:P.x,y:P.y-8},pts=glyphPts(sh,c.x,c.y,140).map(p=>inArena(p,6));
  S.tmarks.push({x:c.x,y:c.y,r:140,t:0.55,max:0.55,kind:'glyph',pts,owner:e,fn:()=>{const cut=eCut(e,pts,1500*CFG.eSlashMul,{tier:3,phase:true,hr:13,col:'#ff2040',core:C.white,kind:'glyph'});S.eslashes.push(cut);e.cuts.push(cut);S.shake+=8;sfx('ult');groundWave(e,{col:'#ff2040',v:320});}});
  e.busyT=0.75;text(e.x,e.y-72,'筆',C.hi,true);return[];
}
function glyphBreak(g){
  const e=g.e;S.glyph=null;if(!S.enemies.includes(e))return;
  e.later=null;for(const c of e.cuts)if(!c.done){c.done=true;c.fade=c.fadeMax=0.1;}e.cuts=[];e.shotsPlan=null;
  const dmg=Math.max(4,Math.round(e.max*0.1));stunEnemy(e,2.2);e.armorT=0;damageEnemy(e,dmg);e.flash=1;
  for(const q of glyphPts(g.shape,e.x,e.y-e.r*2-60,40))for(let i=0;i<3;i++)S.parts.push({x:q.x,y:q.y,vx:(e.x-q.x)*rand(2,4),vy:(e.y-14-q.y)*rand(2,4),life:0.35,max:0.35,size:2,col:Math.random()<0.5?C.hi:'#1a0a10'});
  spray(e.x,e.y-14,26,0,-1);text(e.x,e.y-84,'GLYPH BROKEN',C.hi,true);text(e.x,e.y-66,`−${dmg}`,C.white);
  sfx('parry');sfx('gong');S.flash=0.14;S.shake+=12;S.slowT=Math.max(S.slowT,0.9);hitPause(14,e,3);addMeter(25);addCombo(3);
  if(S.stats)S.stats.glyphs=(S.stats.glyphs||0)+1;
  if(e.hp<=0)kill(e,null);
}
// the sumi's ink wave: wipes stances, auras, traces and lingering trails
function eraseBrush(){let any=false;if(S.counter){S.counter=null;any=true;}if(S.auras.length){S.auras=[];any=true;}if(S.trace){S.trace=null;any=true;}S.traceArm=0;
  S.inkLock=Math.max(S.inkLock||0,1.4);text(P.x,P.y-58,any?'ERASED':'INK',C.phase);sfx('paper');burst(P.x,P.y-14,14,'#2a1a34',200,0.5,2);}

// ---------- the pack: tokens, surrounding, reading you ----------
function attackers(){let n=0;for(const o of S.enemies)if(!o.boss&&!o.illusion&&(o.state==='wind'||o.state==='strike'))n++;return n;}
const tokenMax=()=>2+Math.floor(realmN()/2)+(S.floor&&S.floor.stage>=8?1:0);
const hasGrab=e=>e.T.pats.includes('grab')||(e.enraged&&e.T.enr&&e.T.enr.includes('grab'));
function aiMayAttack(e,d){
  if(e.illusion||e.T.kamikaze)return true;
  if(S.counter&&!hasGrab(e)&&Math.random()<aiSkill()*(e.boss?0.8:1)){e.cd=Math.min(0.6,S.counter.t+0.1);return false;}
  if(!e.boss&&attackers()>=tokenMax()){e.cd=rand(0.12,0.3);return false;}
  return true;
}
function aiPickPat(e,d){
  if(e.nextPat){const p=e.nextPat;e.nextPat=null;return p;}
  if(S.counter&&hasGrab(e)&&d<320)return'grab';
  if(e.boss&&S.swipe&&S.swipe.hold&&(S.swipe.k||0)>0.3&&Math.random()<aiSkill()){const q=e.T.pats.find(p=>['dash','iai','lunge','charge','bolt'].includes(p));if(q)return q;}
  return null;
}
function findPerch(e){
  const holes=(S.room.obs||[]).filter(o=>o.type==='hole');if(!holes.length)return null;let best=null,bs=1e9;
  for(const o of holes)for(let k=0;k<3;k++){const q={x:o.x+o.w*rand(0.25,0.75),y:o.y+o.h*rand(0.25,0.75)},dp=dist(q,P);if(dp<100)continue;const sc=Math.abs(dp-e.pref)+0.35*dist(q,e);if(sc<bs){bs=sc;best=q;}}
  return best&&Math.abs(dist(best,P)-e.pref)<240?best:null;
}
// steering on top of the basic orbit: eaters go to the fallen, fliers to their pits, the pack spreads around you and out of your aim
function foeSteer(e,v,d,ux,uy,spd){
  const T=e.T,sk=aiSkill();
  if(T.eats&&e.hp<e.max&&S.remains.length){let best=null,bd=440;for(const r of S.remains){const q=dist(r,e);if(q<bd){bd=q;best=r;}}
    if(best){if(bd<18){e.state='eat';e.t=1.0;best.eaten=true;e.vx=e.vy=0;text(e.x,e.y-52,'FEEDS',C.blood);sfx('mochi');return{x:0,y:0};}const k=spd*1.25/bd;return{x:(best.x-e.x)*k,y:(best.y-e.y)*k};}}
  if(T.hover&&e.perch){const dx=e.perch.x-e.x,dy=e.perch.y-e.y,dd=Math.hypot(dx,dy);
    if(dist(e.perch,P)<80)e.perch=null;else if(dd>14)return{x:dx/dd*spd*1.3,y:dy/dd*spd*1.3};else return{x:uy*spd*0.25*e.orbit,y:-ux*spd*0.25*e.orbit};}
  if(e.boss||T.kamikaze||e.smoke||T.blink)return v;
  let x=v.x,y=v.y;const ae=Math.atan2(e.y-P.y,e.x-P.x);
  let spread=0;for(const o of S.enemies){if(o===e||o.state==='spawn'||o.boss)continue;const da=wrapA(ae-Math.atan2(o.y-P.y,o.x-P.x));if(Math.abs(da)<1&&Math.abs(dist(o,P)-d)<160)spread+=Math.sign(da||(Math.random()-0.5))*(1-Math.abs(da));}
  x+=uy*spread*spd*0.9*sk;y+=-ux*spread*spd*0.9*sk;
  if(S.mouseSeen&&!S.touchUI&&d<460&&e.state==='strafe'){const da=wrapA(ae-Math.atan2(S.aim.y-P.y,S.aim.x-P.x));if(Math.abs(da)<0.45){const s=Math.sign(da||1);x+=uy*s*spd*0.9*sk;y+=-ux*s*spd*0.9*sk;}}
  const sw=S.swipe;if(sw&&sw.hold&&(sw.k||0)>0.25&&d<maxLen()+80){x-=ux*spd*1.3*sk;y-=uy*spd*1.3*sk;}
  return{x,y};
}
function eatTick(e,gdt){e.vx*=0.8;e.vy*=0.8;if(Math.random()<gdt*20)S.parts.push({x:e.x+rand(-8,8),y:e.y-6,vx:rand(-60,60),vy:rand(-90,-20),life:0.35,max:0.35,size:1,col:C.blood,stamp:true});
  if(e.t<=0){const h=e.T.heavy?4:2;e.hp=Math.min(e.max,e.hp+h);text(e.x,e.y-52,`+${h}`,C.blood);e.state='strafe';e.cd=Math.min(e.cd,0.3);plan(e);}}

// ---------- per frame ----------
function updateFoes(gdt){
  updateTutorial(gdt);if(S.pro)updatePrologue(gdt);
  updateArena(gdt);updateLineWaves(gdt);if(S.bossLine){S.bossLine.t-=gdt;if(S.bossLine.t<=0)S.bossLine=null;}
  if(S.inkLock>0)S.inkLock-=gdt;if(S.fuseT>0)S.fuseT-=gdt;
  const h=S.held;
  if(h){h.t-=gdt;const e=h.e;
    if(e&&S.enemies.includes(e)&&S.dead<=0){const d=dist(P,e)||1,ux=(P.x-e.x)/d,uy=(P.y-e.y)/d,stop=e.r+P.r+2,k=Math.min(1,gdt*14);P.x+=(e.x+ux*stop-P.x)*k;P.y+=(e.y+uy*stop-P.y)*k;P.vx=P.vy=0;
      if(h.t<=0){P.kx=ux*720;P.ky=uy*720;S.held=null;S.shake+=5;sfx('smash');burst(P.x,P.y-14,10,C.bone,220,0.4,2);}}
    else S.held=null;}
  for(const w of S.gwaves){if(w.line)continue;w.r+=w.v*gdt;w.t+=gdt;
    if(w.erase)for(const s of S.slashes){if(!s.done||s.erased)continue;if(dist(posAt(s,s.len/2),w)<w.r){s.erased=true;s.linger=0;s.fade=Math.min(s.fade||0.08,0.08);s.fadeMax=Math.max(s.fadeMax,0.08);}}
    if(!w.hit&&S.dead<=0&&Math.abs(dist(P,w)-w.r)<10+P.r*0.6){const aa=Math.atan2(P.y-w.y,P.x-w.x);if(!(w.gapW>0&&Math.abs(wrapA(aa-w.gapA))<w.gapW/2)){
      if(w.erase){w.hit=true;eraseBrush();}
      else if(P.inv<=0&&!CFG.god&&!(P.z>8)){w.hit=true;const hp0=P.hp;hurtPlayer({owner:w.owner,hitP:false,wave:true});if(P.hp<hp0&&w.kind==='frost'){P.slowT=Math.max(P.slowT,1.4);text(P.x,P.y-62,'FROZEN',C.ice);}}}}}
  S.gwaves=S.gwaves.filter(w=>w.line?w.r<=w.max:w.r<w.max);
  for(const m of S.tmarks){m.t-=gdt;if(m.owner&&!S.enemies.includes(m.owner)){m.dead=true;continue;}if(m.t<=0){m.dead=true;if(m.fn)m.fn(m);}}
  S.tmarks=S.tmarks.filter(m=>!m.dead);
  for(const r of S.remains)r.t-=gdt;S.remains=S.remains.filter(r=>r.t>0&&!r.eaten);
  const sk=aiSkill();
  for(const e of S.enemies){const T=e.T;if(e.state==='spawn')continue;
    if(e.busyT>0)e.busyT-=gdt;
    if(e.cstance>0){e.cstance-=gdt;if(Math.random()<gdt*10)S.parts.push({x:e.x+rand(-14,14),y:e.y-rand(4,30),vx:0,vy:-30,life:0.3,max:0.3,size:1,col:C.steel});}
    if(T.shield){const ta=Math.atan2(P.y-e.y,P.x-e.x);if(e.shA===undefined)e.shA=ta;if(!['wind','strike','stun','recover'].includes(e.state)){const rate=(1.8+0.2*realmN())*gdt;e.shA+=clamp(wrapA(ta-e.shA),-rate,rate);}}
    if(T.erase){if(e.eraseT===undefined)e.eraseT=rand(2,3.5);e.eraseT-=gdt;
      if(e.eraseT<=0){e.eraseT=rand(3.6,5.2);if(e.state!=='stun'){groundWave(e,{erase:true,v:520,max:300,col:'#1a1024',kind:'ink',gapW:0});burst(e.x,e.y-14,20,'#2a1a34',260,0.6,3);text(e.x,e.y-58,'墨',C.phase,true);if(onScreen(e))sfx('splash');}}}
    // a counter stance raised mid-windup: the sharp ones see it and pull out
    if(e.state==='wind'&&S.counter&&e.counterRead!==S.counter&&e.pat!=='glyph'&&!['grab','devour','rain','ring','spikes','summon','clones'].includes(e.pat)&&e.t>0.15){e.counterRead=S.counter;
      if(Math.random()<sk*(e.boss?0.8:0.6)){const d=dist(P,e)||1;e.state='strafe';e.cuts=[];e.shotsPlan=null;e.later=null;e.cd=Math.min(1.2,S.counter.t+0.15);e.step={x:-(P.x-e.x)/d,y:-(P.y-e.y)/d,t:0.12};text(e.x,e.y-54,'READS YOU',C.curse);}}
    // punish a whiff
    if(e.state==='strafe'&&(S.cdCut>0.3||S.cdTap>0.22)&&e.cd>0.15&&dist(e,P)<T.range&&Math.random()<gdt*(e.boss?2:1.4)*sk)e.cd=0.08;
  }
  const g=S.glyph;if(g){g.t+=gdt;const e=g.e;if(!S.enemies.includes(e)||e.state!=='wind'||e.pat!=='glyph')S.glyph=null;}
}

// ---------- drawing ----------
function drawFoeGround(){
  drawArenaGround();
  for(const m of S.tmarks){const k=1-m.t/m.max,x=LX(m.x),y=LY(m.y);
    if(m.kind==='tline'){const a=0.3+0.6*k;for(let i=1;i<m.pts.length;i++){const A=m.pts[i-1],B=m.pts[i],n=Math.ceil(dist(A,B)/8);for(let j=0;j<=n;j++)pset(LX(A.x+(B.x-A.x)*j/n),LY(A.y+(B.y-A.y)*j/n),m.col,a);}continue;}
    if(m.kind==='glyph'){const a=(0.35+0.55*k)*(Math.floor(S.gt*16)%2?1:0.7);for(let i=1;i<m.pts.length;i++)pline(LX(m.pts[i-1].x),LY(m.pts[i-1].y),LX(m.pts[i].x),LY(m.pts[i].y),'#ff2040',a,2);continue;}
    const K=RAINK[m.kind]||RAINK.blade,r=m.r/PX;pdisc(x,y,Math.max(1,r*(0.25+0.75*k)),'#000',0.18+0.22*k);pcircle(x,y,r+1,'#000',0.5);pcircle(x,y,r,K.col,0.55+0.35*k);pcircle(x,y,Math.max(1,r*(1-k)),k>0.7?C.hi:K.col,0.7+0.3*k);if(k>0.75&&Math.floor(S.gt*20)%2)pdisc(x,y,1,C.white);
    if(m.kind!=='spike'){const fall=(1-k)*70;pline(x,y-fall-6,x,y-fall,K.col,0.9);pset(x,y-fall,K.core);}}
  for(const w of S.gwaves){if(w.line)continue;const x=LX(w.x),y=LY(w.y),r=w.r/PX,a=clamp((w.max-w.r)/80,0,1),n=Math.max(24,Math.round(r*2.4));
    for(let i=0;i<n;i++){const an=i/n*Math.PI*2;if(w.gapW>0&&Math.abs(wrapA(an-w.gapA))<w.gapW/2)continue;const c=Math.cos(an),s=Math.sin(an);pset(x+c*(r+1),y+s*(r+1),'#000',a*0.6);pset(x+c*r,y+s*r,w.col,a);pset(x+c*(r-1),y+s*(r-1),w.erase?'#000':C.white,a*0.7);}}
}
function drawFoeAir(){
  drawArenaAir();
  for(const e of S.enemies){if(e.state==='spawn')continue;const sp=SPR[e.look],x=LX(e.x),top=LY(e.y)-(sp?sp.h:30);
    if(e.T.shield&&!(e.noShieldT>S.gt)){const raised=!['stun','recover'].includes(e.state),y=LY(e.y-10),r=(e.r+7)/PX;for(let i=-5;i<=5;i++){const an=e.shA+i*0.16;pset(x+Math.cos(an)*r,y+Math.sin(an)*r*0.8,raised?C.steel:'#5a5a62',raised?0.75:0.4);}}
    if(e.T.erase&&e.eraseT!==undefined&&e.eraseT<0.7){const k=1-e.eraseT/0.7,y=LY(e.y-14);for(let i=0;i<10;i++){const an=S.gt*6+i/10*Math.PI*2,r=(1-k)*24+4;pdisc(x+Math.cos(an)*r,y+Math.sin(an)*r*0.8,1,'#1a1024',0.8);}}
    if(e.state==='eat'&&Math.floor(S.gt*6)%2)ptext('喰',x,top-4,C.blood,8);
    if(e.cstance>0){const y=LY(e.y-14),r=e.r/PX+6;for(let i=0;i<24;i++){const an=i/24*Math.PI*2+S.gt*3;if(i%3)pset(x+Math.cos(an)*r,y+Math.sin(an)*r*0.85,C.steel,0.9);}if(Math.floor(S.gt*6)%2)ptext('構',x,top-6,C.steel,8);}
    if(e.state==='wind'&&(e.pat==='grab'||e.pat==='devour')&&Math.floor(S.gt*10)%2)ptext('掴',x,top-6,GRABC,8);
    if(e.state==='wind'&&['rain','ring','spikes','breath','summon','clones','sixarm'].includes(e.pat)){const k=1-Math.max(0,e.t)/e.wind,y=LY(e.y-14),col=e.pat==='rain'?(RAINK[(e.T.rain||{}).kind]||RAINK.blade).col:e.pat==='ring'?ringCol():C.curse;pcircle(x,y,(e.r/PX+16)*(1-k)+e.r/PX*0.5,col,0.4+0.5*k);}
  }
  const g=S.glyph;if(g&&S.enemies.includes(g.e)){const e=g.e,k=clamp(g.t/(g.dur*0.7),0,1),left=clamp(1-g.t/g.dur,0,1),sp=SPR[e.look],R=17,P0=SHAPE_PTS[g.shape];
    const cx=Math.round(LX(e.x)),cy=Math.max(R+8,Math.round(LY(e.y)-(sp?sp.h:40)-26));
    flush();lx.fillStyle='rgba(8,4,6,0.6)';lx.fillRect(cx-R-6,cy-R-6,R*2+12,R*2+12);lx.fillStyle='#5a0a14';lx.fillRect(cx-R-6,cy-R-6,R*2+12,1);lx.fillRect(cx-R-6,cy+R+5,R*2+12,1);
    const tot=P0.length-1,upto=k*tot;
    for(let i=1;i<=Math.ceil(upto)&&i<=tot;i++){const f=Math.min(1,upto-(i-1)),a=P0[i-1],b=P0[i],bx=a[0]+(b[0]-a[0])*f,by=a[1]+(b[1]-a[1])*f;
      pline(cx+a[0]*R+1,cy+a[1]*R+1,cx+bx*R+1,cy+by*R+1,'#000',0.6,3);pline(cx+a[0]*R,cy+a[1]*R,cx+bx*R,cy+by*R,k>=1&&Math.floor(S.gt*10)%2?C.white:'#e0203a',1,2);
      if(i===Math.ceil(upto)&&k<1)pdisc(cx+bx*R,cy+by*R,1,C.white);}
    for(let i=0;i<36;i++){if(i/36>left)break;const an=-Math.PI/2+i/36*Math.PI*2;pset(cx+Math.cos(an)*(R+9),cy+Math.sin(an)*(R+9),left<0.3?C.hi:C.bone,0.85);}
    if(Math.floor(S.gt*4)%2)ptext('TRACE IT',cx,cy+R+16,C.hi,8);}
}
function drawFoeHud(){
  drawTutorial();drawPrologue();
  if(S.bossLine){const a=clamp(Math.min(S.bossLine.t,2.8-S.bossLine.t)*3,0,1);lx.globalAlpha=a;ptext(`"${S.bossLine.text}"`,LW/2,LH-28,C.hi,8);lx.globalAlpha=1;}
  const g=S.glyph;
  if(g&&S.enemies.includes(g.e)&&!S.trace){const w=150,x0=Math.round(LW/2-w/2),y0=LH-62,left=clamp(1-g.t/g.dur,0,1);flush();
    lx.fillStyle='rgba(8,4,6,0.85)';lx.fillRect(x0,y0,w,30);lx.fillStyle=C.hi;lx.fillRect(x0,y0,w,1);lx.fillRect(x0,y0+29,Math.round(w*left),1);
    lx.fillStyle='#000';lx.fillRect(x0+4,y0+5,20,20);shapeGlyph(g.shape,x0+6,y0+7,C.hi,16);flush();
    ptext('ANSWER THE GLYPH',x0+90,y0+12,C.hi,8);ptext(S.touchUI?'PRESS 技 · DRAW IT':'HOLD RIGHT-CLICK · DRAW IT',x0+90,y0+23,C.bone,8);}
  if(S.inkLock>0){const a=clamp(S.inkLock/1.5,0,1)*0.75;flush();lx.globalAlpha=a;lx.fillStyle='#120a18';
    for(const [bx,by,br] of [[0,0,26],[LW,0,22],[0,LH,22],[LW,LH,26],[LW*0.5,0,14]]){for(let yy=-br;yy<=br;yy++){const ww=Math.round(Math.sqrt(br*br-yy*yy));lx.fillRect(bx-ww,by+yy,ww*2,1);}}
    lx.globalAlpha=1;if(Math.floor(S.gt*3)%2)ptext('墨 · BRUSH BLOTTED',LW/2,LH-70,C.phase,8);}
}

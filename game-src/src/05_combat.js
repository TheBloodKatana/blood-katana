// ================= state + combat =================
const S={mode:'hub',running:false,paused:false,choosing:false,dialog:null,trans:null,summary:false,
  gt:0,ts:1,hitstop:0,slowT:0,shake:0,hurt:0,dead:0,flash:0,kick:{x:0,y:0},
  meter:0,full:false,armed:false,bladeFlash:0,tipW:{x:0,y:0},
  swipe:null,slide:null,buffer:null,cdTap:0,cdCut:0,cdLock:0,cdTapMax:0,cdCutMax:0,abCd:{},abCdMax:{},denyT:0,denyKind:'',tapTimes:[],tapChain:0,tapLast:-9,cutCount:0,anim:null,
  drink:null,event:null,duel:null,follower:null,quest:null,firstCutUsed:false,
  enemies:[],slashes:[],eslashes:[],shots:[],parts:[],texts:[],ghosts:[],pending:[],rings:[],orbs:[],marks:[],corpses:[],petals:[],bolts:[],
  mods:freshMods(),perkAb:{},owned:{},items:[],mon:0,shardsRun:0,kills:0,parries:0,blocks:0,dodges:0,guards:0,
  combo:0,comboT:0,comboPop:0,floor:null,room:null,boss:null,banner:null,itemBanner:null,stats:null,hint:{cut:false,armed:false},
  mouse:{x:VW/2+80,y:VH/2},aim:{x:VW/2+80,y:VH/2},cam:{x:VW/2,y:VH/2},X0:0,Y0:0,mouseSeen:false,mouseIn:false,
  pauseVictims:new Map(),frameN:0,face:1,darumaUsed:false,favorUsed:false,heartT:0,offer:[]};
const P={x:VW/2,y:VH/2,r:11,vx:0,vy:0,kx:0,ky:0,hp:5,max:5,dashT:0,dashCd:0,dashDir:{x:1,y:0},inv:0,shield:0,slowT:0,moving:false,stepT:0,alt:false,bloody:0};
const ETIERS=[420,640,900];
const maxLen=()=>wLen()*S.mods.lenMul*(btFor('reserve')?1.9:1);
const tier=s=>s>=1e5?'Instant':s<530?'Slow':s<780?'Swift':'Lightning';
const fl=()=>S.floor?S.floor.diff:1;
let FAM=0;
const isDuel=e=>!!(e&&(e.duelist||e.T.duel));
const abCdTime=k=>(k==='teleport'?CFG.slideCd:ABCD[k])*S.mods.abCdMul;
function abReady(k){return!CFG.abilityCds||(S.abCd[k]||0)<=0;}
function abUse(k){if(!CFG.abilityCds)return;const t=abCdTime(k);S.abCd[k]=t;S.abCdMax[k]=t;}
function cutDir(s,e){if(s&&s.pts&&s.cum){const t=tangentAt(s,s.d);if(Number.isFinite(t.x))return t;}const dx=e.x-P.x,dy=e.y-P.y,l=Math.hypot(dx,dy)||1;return{x:dx/l,y:dy/l};}
function staggerPlayer(t,why){S.cdCut=Math.max(S.cdCut,t);S.cdTap=Math.max(S.cdTap,t);S.cdCutMax=Math.max(S.cdCutMax,S.cdCut);S.cdTapMax=Math.max(S.cdTapMax,S.cdTap);S.buffer=null;S.tapChain=-1;if(why)text(P.x,P.y-40,why,C.ash);}
function rayTo(st,a,L,r){const R=S.room,x0=WALL+r,x1=R.w-WALL-r,y0=WALL+r,y1=R.h-WALL-r,c=Math.cos(a),s=Math.sin(a);let t=L;
  if(c>1e-6)t=Math.min(t,(x1-st.x)/c);else if(c<-1e-6)t=Math.min(t,(x0-st.x)/c);if(s>1e-6)t=Math.min(t,(y1-st.y)/s);else if(s<-1e-6)t=Math.min(t,(y0-st.y)/s);
  t=Math.max(0,t);return{x:st.x+c*t,y:st.y+s*t};}
function inArena(p,r){const R=S.room;return{x:clamp(p.x,WALL+r,R.w-WALL-r),y:clamp(p.y,WALL+r,R.h-WALL-r)};}
function D(){return S.room.dctx;}

function text(x,y,s,col,big){S.texts.push({x,y,s,col,big:!!big,t:0.9});}
function burst(x,y,n,col,spd,life,size,stampIt){for(let i=0;i<n;i++){const a=Math.random()*Math.PI*2,v=spd*rand(.3,1);S.parts.push({x,y,vx:Math.cos(a)*v,vy:Math.sin(a)*v,life:life*rand(.6,1),max:life,size:size>3.2?2:1,col,stamp:stampIt});}}
function addMeter(v){const b=S.meter;S.meter=Math.min(orbMax(),S.meter+v);const c=btCost();if(b<c&&S.meter>=c){S.full=true;text(P.x,P.y-50,'BLOODTHIRST READY',C.hi);sfx('full');}}
function readAi(){$('rAi').textContent=`${S.dodges} / ${S.guards}`;$('rParry').textContent=`${S.parries} / ${S.blocks}`;}
function stamp(x,y,r,a){const cx=Math.round(x/PX),cy=Math.round(y/PX),rr=Math.max(1,Math.round(r/PX)),d=D();
  for(let yy=-rr;yy<=rr;yy++)for(let xx=-rr;xx<=rr;xx++){if(xx*xx+yy*yy>rr*rr+rr)continue;const X=cx+xx,Y=cy+yy;if((BAYER[(X&3)+((Y&3)<<2)]+0.5)/16>=a)continue;d.fillStyle=(xx+yy)%3===0?'#7a0d1c':'#5e0a16';d.fillRect(X,Y,1,1);}}
function scar(pts,col){const d=D();d.fillStyle=col||'#3a0a12';for(let i=1;i<pts.length;i++){const a=pts[i-1],b=pts[i],n=Math.ceil(dist(a,b)/PX);for(let k=0;k<=n;k++){if(Math.random()<0.6)continue;d.fillRect(Math.round((a.x+(b.x-a.x)*k/n)/PX),Math.round((a.y+(b.y-a.y)*k/n)/PX),1,1);}}}

// ---------- blood orbs ----------
function spawnOrbs(x,y,n,total){
  if(total<=0||S.dead>0)return;const v=total*S.mods.gainMul*(1+0.1*up('orb','gain'))*(1+Math.min(0.25,S.combo*0.01))/n;
  for(let i=0;i<n;i++){const a=Math.random()*Math.PI*2,sp=rand(120,340);S.orbs.push({x,y,vx:Math.cos(a)*sp,vy:Math.sin(a)*sp,v,t:0,delay:rand(0.1,0.28)});}
}
function updateOrbs(gdt){
  const tip=S.orbW||S.tipW;
  for(const o of S.orbs){
    o.t+=gdt;
    if(o.t<o.delay){const k=Math.max(0,1-gdt*6);o.vx*=k;o.vy*=k;}
    else{const dx=tip.x-o.x,dy=tip.y-o.y,d=Math.hypot(dx,dy)||1,sp=350+1600*(o.t-o.delay),k=Math.min(1,gdt*9);
      o.vx+=(dx/d*sp-o.vx)*k;o.vy+=(dy/d*sp-o.vy)*k;
      if(d<12||o.t>3){o.dead=true;addMeter(o.v);S.bladeFlash=1;sfx('orb');S.parts.push({x:tip.x,y:tip.y,vx:rand(-40,40),vy:rand(-40,40),life:0.15,max:0.15,size:1,col:C.hi});continue;}}
    o.x+=o.vx*gdt;o.y+=o.vy*gdt;
  }
  S.orbs=S.orbs.filter(o=>!o.dead);
}

// ---------- cuts (polylines) ----------
function makeCut(pts,speed,o){
  const cum=[0];for(let i=1;i<pts.length;i++)cum.push(cum[i-1]+dist(pts[i-1],pts[i]));
  return Object.assign({pts,cum,len:Math.max(1,cum[cum.length-1]),speed,d:0,done:false,blocked:false,fade:0,fadeMax:0.2,linger:0,hits:new Set(),lingerHits:new Map(),ab:{},hr:8},o);
}
function segIndex(s,d){let i=1;while(i<s.cum.length-1&&s.cum[i]<d)i++;return i;}
function posAt(s,d){d=clamp(d,0,s.len);const i=segIndex(s,d),a=s.pts[i-1],b=s.pts[i],seg=(s.cum[i]-s.cum[i-1])||1,t=clamp((d-s.cum[i-1])/seg,0,1);return{x:a.x+(b.x-a.x)*t,y:a.y+(b.y-a.y)*t};}
function tangentAt(s,d){const i=segIndex(s,clamp(d,0,s.len)),a=s.pts[i-1],b=s.pts[i],l=dist(a,b)||1;return{x:(b.x-a.x)/l,y:(b.y-a.y)/l};}
const head=s=>posAt(s,s.d);
function forTrail(s,fn){const end=s.d;for(let i=1;i<s.pts.length;i++){if(s.cum[i-1]>=end)break;const b=s.cum[i]<=end?s.pts[i]:posAt(s,end);if(fn(s.pts[i-1],b))return true;}return false;}
function trailLive(o){return(!o.done||o.linger>0)&&o.d>=1;}

function breakCut(s,pt,by){
  s.d=clamp(s.d-dist(pt,head(s)),0,s.len);s.blocked=true;s.blockAt=pt;s.done=true;s.linger=0;s.fade=s.fadeMax=0.35;
  if(s.team==='e'){
    const e=s.owner,alive=e&&S.enemies.includes(e);
    if(s.guard){
      burst(pt.x,pt.y,16,C.steel,380,0.35,2.5);text(pt.x,pt.y-16,'GUARD BROKEN',C.hi);sfx('gbreak');addCombo(1);
      if(alive)stunEnemy(e,e.T.heavy?0.5:0.9);S.shake+=4;hitPause(6,alive?e:null,1);$('rClash').textContent='You cut through a guard';
    }else{
      if(alive){stunEnemy(e,e.T.heavy?0.7:1.2);const a=Math.atan2(e.y-pt.y,e.x-pt.x),f=e.T.heavy?60:200;e.kx=Math.cos(a)*f;e.ky=Math.sin(a)*f;for(const c of e.cuts||[])if(!c.done){c.done=true;c.fade=c.fadeMax=0.2;}}
      burst(pt.x,pt.y,26,C.bone,520,0.35,3);burst(pt.x,pt.y,10,slashSet().spark==='#ffffff'?C.spirit:slashSet().spark,300,0.5,3);
      text(pt.x,pt.y-16,'PARRY',C.spirit,true);tutEvent('parry');featEvent('parry');buzz(25,'MEDIUM');wear(1);if(alive)tryDisarm(e);spawnOrbs(pt.x,pt.y,4,CFG.parryGain+S.mods.parryBlood);S.parries++;sfx('parry');addCombo(2);S.flash=0.09;
      hitPause(10,alive?e:null,1);S.shake+=7;$('rClash').textContent='Foe cut hit your trail';
      if(CFG.parrySlowOn&&!(S.gmx&&S.gmx.noslow))S.slowT=CFG.parrySlowTime*(S.mods.composure?2:1);
      if(S.mods.composure)P.dashCd=0;
    }
  }else{
    if(by&&by.guard){
      burst(pt.x,pt.y,18,C.steel,420,0.35,2.5);text(pt.x,pt.y-16,'GUARDED',C.steel);sfx('guarded');
      const e=by.owner;if(e&&S.enemies.includes(e))e.riposte=true;
      if(e&&(isDuel(e)||e.boss)&&!s.child){staggerPlayer(0.6,'PARRIED');const a=Math.atan2(P.y-e.y,P.x-e.x);P.kx+=Math.cos(a)*240;P.ky+=Math.sin(a)*240;}
      else if(s.isTap)staggerPlayer(0.55,'DEFLECTED');
      S.shake+=4;hitPause(5,null);$('rClash').textContent='Foe guard stopped your cut';
    }else{burst(pt.x,pt.y,14,C.ash,300,0.3,2.5);text(pt.x,pt.y-16,'BLOCKED',C.curse);S.shake+=3;sfx('block');$('rClash').textContent='Your cut hit a foe trail';}
    S.blocks++;if(s.wid)wear(by&&by.guard?2:1,s);
    if(s.ab.teleport&&!s.child)slideAlong(s,s.d);
  }
  readAi();
}
function blockCheck(s,prev,cur){
  if(!CFG.trailBlocks||s.phase)return;
  const others=s.team==='p'?S.eslashes:S.slashes;
  for(const o of others){
    if(o===s||o.phase||o.noBlock||!trailLive(o))continue;
    let pt=null;forTrail(o,(a,b)=>{pt=segX(prev,cur,a,b);return!!pt;});
    if(!pt)continue;
    if(s.team==='p'&&s.ab.pierce){breakCut(o,pt,s);continue;}
    breakCut(s,pt,o);return;
  }
}
function processStep(s,prev,cur){
  blockCheck(s,prev,cur);if(s.done)return;
  if(S.room.obs&&S.room.obs.length&&!s.guard)for(const o of S.room.obs){if(o.type!=='crate'||o.dead||s.hits.has(o))continue;if(segRect(prev,cur,{x:o.x-s.hr,y:o.y-s.hr,w:o.w+2*s.hr,h:o.h+2*s.hr})!==null){s.hits.add(o);hitCrate(o);}}
  if(s.team==='p'){
    for(const e of [...S.enemies]){
      if(e.state==='spawn'||e.state==='dodge'||e.smoke||s.hits.has(e))continue;
      if(segDist({x:e.x,y:e.y-(e.T.fly?10:0)},prev,cur)<e.r+s.hr){
        if(s.isTap&&!s.ult&&e.readT>S.gt&&!['stun','recover'].includes(e.state)){e.readT=0;e.state='guard';e.t=0.25;e.vx=e.vy=0;breakCut(s,{x:cur.x,y:cur.y},{guard:true,owner:e});return;}
        s.hits.add(e);hitEnemy(e,s);if(s.done)return;}
    }
  }else if(!s.guard){
    const o=s.owner;
    if(s.carry&&o&&S.enemies.includes(o)&&o.state==='strike')Object.assign(o,inArena(cur,o.r));
    if(!s.hitP&&P.inv<=0&&!CFG.god&&segDist(P,prev,cur)<P.r+s.hr*0.5){if(s.shove)shovePlayer(s);else hurtPlayer(s);}
    else if(!s.ghosted&&P.dashT>0&&capOn('body','ghost')&&segDist(P,prev,cur)<P.r+s.hr*0.5+4){s.ghosted=true;P.dashCd=0;S.slowT=Math.max(S.slowT,0.5);text(P.x,P.y-50,'GHOST STEP',C.spirit);sfx('blink');}
  }
}
function hitCrate(o){o.hp--;o.flash=1;if(o.hp>0)return;o.dead=true;const cx=o.x+o.w/2,cy=o.y+o.h/2,R=S.room;R.obs=R.obs.filter(x=>x!==o);
  burst(cx,cy-6,18,'#8a5a34',260,0.6,3);burst(cx,cy-6,8,'#c8a868',200,0.5,2);sfx('crate');S.shake+=2;
  const r=Math.random();if(r<0.35)scatter(R,'coin',cx,cy,ri(1,3));else if(r<0.43)addObj(R,{kind:'onigiri',x:cx,y:cy,z:10,vz:120});else if(r<0.48)scatter(R,'shard',cx,cy,1);else if(r<0.53)addObj(R,{kind:'vial',x:cx,y:cy,z:10,vz:120});}
function finishCut(s){
  s.done=true;if(s.clipAt&&!s.blocked&&!s.guard){burst(s.clipAt.x,s.clipAt.y,6,C.steel,180,0.25,1);sfx('shotcut');}
  if(s.team==='p'){
    const end=s.pts[s.pts.length-1];
    if(s.ab.linger)s.linger=CFG.lingerTime;else s.fade=s.fadeMax=Math.max(0.05,CFG.trailLinger+S.mods.trail);
    if(s.ab.fire&&!s.isWave){s.linger=Math.max(s.linger,2.0);s.fireTrail=true;if(!s.ab.linger)s.noBlock=true;sfx('fire');}
    if(s.ab.teleport&&!s.child)slideAlong(s,s.len);
    if(s.ab.burst)burstAt(end,s);
    if(s.shock&&!s.blocked){burstAt(end,s,s.shock);sfx(s.quake?'smash':'land');S.shake+=s.quake?12:4;if(s.quake){for(let i=0;i<10;i++){const a=i/10*Math.PI*2;spawnChild([end,rayTo({x:end.x,y:end.y},a,220,2)],s,{kind:'smash',speed:700,hr:12});}text(end.x,end.y-40,'EARTHQUAKE',C.hi,true);}for(const e of S.enemies){const d=dist(e,end);if(d<s.shock+e.r&&d>1&&!e.T.heavy){e.kx+=(e.x-end.x)/d*420;e.ky+=(e.y-end.y)/d*420;}}}
    if(s.thrown){burst(end.x,end.y,18,C.steel,260,0.5,2);sfx('gbreak');}
    if(s.grapple&&!s.grappled){if(s.bite){grappleZip(s.bite,null);text(s.bite.x,s.bite.y-20,'BITE',C.steel);sfx('clang');}else text(end.x,end.y-20,'NOTHING TO BITE',C.ash);}
    if(s.tags&&!s.blocked)burstAt(end,{team:'p',ab:{},hits:new Set(),fam:++FAM,dmgBonus:0},55);
    if(s.ab.echo&&!s.child)S.pending.push({t:CFG.echoDelay,fn:()=>spawnChild(s.pts,s)});
    if(s.ab.wave&&!s.isWave&&!s.child&&s.len>20){const t=tangentAt(s,s.len),st=end,en=inArena({x:end.x+t.x*240,y:end.y+t.y*240},4);if(dist(st,en)>30){const w=makeCut(clipPts([st,en],['wall'],2).pts,1050,{team:'p',ult:s.ult,ab:{},hr:s.hr*1.3,child:true,isWave:true,fam:s.fam});S.slashes.push(w);sfx('gust');}}
    if(s.ab.vortex&&!s.child){for(const e of S.enemies){if(e.state==='spawn')continue;let best=null,bd=1e9;forTrail(s,(a,b)=>{const q=segNear(e,a,b),d=dist(q,e);if(d<bd){bd=d;best=q;}return false;});
      if(best&&bd<150&&bd>8){const f=(e.T.heavy?180:520)*(1-bd/150)+120;e.kx+=(best.x-e.x)/bd*f;e.ky+=(best.y-e.y)/bd*f;}}S.rings.push({x:posAt(s,s.len/2).x,y:posAt(s,s.len/2).y,r:60,life:0.3,col:C.wind});}
    scar(s.pts,s.fireTrail?'#2a1a3a':null);
  }else if(s.guard)s.linger=s.stance?0.7:0.4;
  else s.fade=s.fadeMax=Math.max(0.05,CFG.trailLinger);
}
function advanceCut(s,dist0){
  let remain=dist0;
  while(remain>0&&!s.done){const step=Math.min(remain,10);remain-=step;const prev=head(s);s.d=Math.min(s.len,s.d+step);const cur=head(s);processStep(s,prev,cur);if(!s.done&&s.d>=s.len)finishCut(s);}
}
function stepCuts(gdt){
  const live=[...S.slashes,...S.eslashes].filter(s=>!s.done);const N=4;
  for(let k=0;k<N;k++)for(const s of (k%2?live.slice().reverse():live)){if(!s.done)advanceCut(s,s.speed*gdt/N);}
  for(const s of S.slashes){
    if(!s.done||s.linger<=0)continue;
    s.linger-=gdt;
    for(const e of [...S.enemies]){
      if(e.state==='spawn'||e.state==='dodge'||e.smoke)continue;
      const lt=s.lingerHits.get(e);if(lt!==undefined&&S.gt-lt<0.5)continue;
      if(forTrail(s,(a,b)=>segDist(e,a,b)<e.r+s.hr*0.7)){s.lingerHits.set(e,S.gt);hitEnemy(e,s);}
    }
    if(s.fireTrail&&Math.random()<gdt*30){const p=posAt(s,Math.random()*s.len);S.parts.push({x:p.x+rand(-3,3),y:p.y,vx:rand(-10,10),vy:rand(-60,-30),life:0.4,max:0.4,size:1,col:Math.random()<0.5?C.water:'#d8f6ff'});}
    if(s.linger<=0){s.linger=0;s.fade=s.fadeMax=0.25;}
  }
  for(const s of S.eslashes){if(s.done&&s.linger>0){s.linger-=gdt;if(s.linger<=0){s.linger=0;s.fade=s.fadeMax=0.2;}}}
  for(const s of S.slashes)if(s.done&&s.linger<=0)s.fade-=gdt;
  for(const s of S.eslashes)if(s.done&&s.linger<=0)s.fade-=gdt;
  S.slashes=S.slashes.filter(s=>!s.done||s.linger>0||s.fade>0);
  S.eslashes=S.eslashes.filter(s=>!s.done||s.linger>0||s.fade>0);
}
function slideAlong(s,stopD){
  const path=[{x:P.x,y:P.y}];
  for(let i=1;i<s.pts.length-1;i++)if(s.pts[i].b&&s.cum[i]<stopD)path.push(s.pts[i]);
  path.push(inArena(posAt(s,stopD),P.r));
  {const cp=clipPts(path,['wall','crate','hole'],P.r-1);path.length=0;path.push(...cp.pts);}
  const cum=[0];for(let i=1;i<path.length;i++)cum.push(cum[i-1]+dist(path[i-1],path[i]));
  let len=cum[cum.length-1];if(len<4)return;
  if(len>CFG.slideMax){const tp=truncate(path,CFG.slideMax);path.length=0;path.push(...tp);cum.length=1;for(let i=1;i<path.length;i++)cum.push(cum[i-1]+dist(path[i-1],path[i]));len=cum[cum.length-1];}
  S.slide={pts:path,cum,len,t:0,dur:clamp(len/CFG.slideSpeed,0.12,0.5)};P.dashT=0;P.inv=Math.max(P.inv,0.08);sfx('dash');
}
function burstAt(p,s,r){
  const rad=r||CFG.burstRadius;
  S.rings.push({x:p.x,y:p.y,r:rad,life:0.35,col:s&&s.fox?C.fox:C.hi});S.shake+=3;
  for(const e of [...S.enemies]){if(e.state==='spawn'||e.state==='dodge'||e.smoke)continue;if(dist(e,p)<rad+e.r)hitEnemy(e,s);}
  for(const o of S.eslashes){if(!o.done&&!o.phase&&dist(head(o),p)<rad)breakCut(o,head(o),s);}
  for(const sh of S.shots)if(dist(sh,p)<rad){sh.dead=true;shotCut(sh);}
}
function spawnChild(pts,parent,extra){
  const ab=Object.assign({},parent.ab,{echo:false,cross:false,triple:false,teleport:false,ghost:false,kunai:false,wave:parent.ab.wave});
  const cp=clipPts(pts.map(p=>({x:p.x,y:p.y})),['wall'],2);
  const c=makeCut(cp.pts,parent.speed,Object.assign({team:'p',ult:parent.ult,ab,hr:parent.hr,child:true,fam:parent.fam},extra));
  if(c.len>=6)S.slashes.push(c);return c;
}

// ---------- swiping, click slash, ricochet ----------
const bnd=()=>{const R=S.room;return{x0:WALL+3,x1:R.w-WALL-3,y0:WALL+3,y1:R.h-WALL-3};};
const isOut=p=>{const b=bnd();return p.x<b.x0||p.x>b.x1||p.y<b.y0||p.y>b.y1;};
function wallHit(a,b){
  const B=bnd();let best=null;const tryT=(t,axis,v)=>{if(t>1e-6&&t<=1&&(!best||t<best.t))best={t,axis,v};};
  if(b.x<B.x0)tryT((B.x0-a.x)/(b.x-a.x),'x',B.x0);if(b.x>B.x1)tryT((B.x1-a.x)/(b.x-a.x),'x',B.x1);
  if(b.y<B.y0)tryT((B.y0-a.y)/(b.y-a.y),'y',B.y0);if(b.y>B.y1)tryT((B.y1-a.y)/(b.y-a.y),'y',B.y1);
  return best;
}
function reflectPath(raw,maxB){
  const out=[inArena(raw[0],3)];let fx=1,ox=0,fy=1,oy=0,prev=out[0],n=0;
  for(let i=1;i<raw.length;i++){
    const p={x:fx*raw[i].x+ox,y:fy*raw[i].y+oy};let g=0;
    while(isOut(p)&&n<maxB&&g++<6){const h=wallHit(prev,p);if(!h)break;const q={x:prev.x+(p.x-prev.x)*h.t,y:prev.y+(p.y-prev.y)*h.t,b:true};out.push(q);n++;
      if(h.axis==='x'){fx=-fx;ox=2*h.v-ox;p.x=2*h.v-p.x;}else{fy=-fy;oy=2*h.v-oy;p.y=2*h.v-p.y;}prev=q;}
    out.push(p);prev=p;
  }
  return{pts:out,bounces:n};
}
function resample(raw,gap){const out=[raw[0]];for(let i=1;i<raw.length;i++){if(dist(out[out.length-1],raw[i])>=gap)out.push(raw[i]);}const l=raw[raw.length-1];if(out[out.length-1]!==l)out.push(l);return out;}
function truncate(pts,L){const out=[pts[0]];let acc=0;for(let i=1;i<pts.length;i++){const d=dist(pts[i-1],pts[i]);if(acc+d>=L){const k=(L-acc)/(d||1);out.push({x:pts[i-1].x+(pts[i].x-pts[i-1].x)*k,y:pts[i-1].y+(pts[i].y-pts[i-1].y)*k});return out;}acc+=d;out.push(pts[i]);}return out;}
function buildPath(raw,ab){
  let pts=ab.curve?resample(raw,8):[raw[0],raw[raw.length-1]];
  pts=truncate(pts,maxLen());let bounces=0;
  if(ab.teleport&&ab.ricochet&&pts.length>=2){const e=pts[pts.length-1],p=pts[pts.length-2],l=dist(e,p)||1,probe={x:e.x+(e.x-p.x)/l*CFG.ricoBonus,y:e.y+(e.y-p.y)/l*CFG.ricoBonus};
    if(isOut(e)||isOut(probe)){pts=pts.slice(0,-1).concat([probe]);const r=reflectPath(pts,CFG.ricoMax);pts=r.pts;bounces=r.bounces;}}
  return{pts:pts.map(p=>{const q=inArena(p,2);if(p.b)q.b=true;return q;}),bounces};
}
// a crescent around the body toward an angle (clicks, sweeps, spins)
function arcPts(a,R,span,dir){const cx=P.x,cy=P.y-12,pts=[],n=Math.max(12,Math.round(span*6));
  for(let i=0;i<=n;i++){const t=i/n,an=a-dir*span/2+dir*span*t,rr=R*(0.8+0.2*Math.sin(Math.PI*t));pts.push(rayTo({x:cx,y:cy},an,rr,2));}return pts;}
function abilitiesFor(ult){
  const ab=Object.assign({},ult?CFG.ult:CFG.normal);
  for(const k in S.perkAb)if(S.perkAb[k])ab[k]=true;
  if(!ab.teleport)ab.ricochet=false;
  return ab;
}
function swipeIsTap(sw){const last=sw.pts[sw.pts.length-1];return dist(sw.pts[0],last)<16&&polyLen(sw.pts)<26;}
function cutWait(isTap){return Math.max(S.cdLock,isTap?S.cdTap:S.cdCut);}
// three base moves for every weapon: click (tap), swipe (drag), hold (press without moving)
const HOLD_T=0.3;
function chargeK(holdT){const mul=curW().id==='reserve'?Math.pow(0.8,up('reserve','rdraw')):1;return clamp((holdT-HOLD_T)/(0.6*mul),0,1);}
function releaseSwipe(){
  const sw=S.swipe;if(!sw)return;S.swipe=null;
  if(S.gmx&&S.gmx.brush&&!S.inHub){S.denyT=0.3;sfx('deny');if(!S.brushWarn||S.gt-S.brushWarn>2){S.brushWarn=S.gt;text(P.x,P.y-50,'ONLY THE BRUSH',C.curse);}return;}
  sw.tEnd=sw.tEnd||performance.now();
  if(S.drink){S.denyT=0.25;sfx('deny');return;}
  if(S.leap){return;}
  const last=sw.pts[sw.pts.length-1],moved=sw.moved||dist(sw.pts[0],last)>=16,holdT=(sw.tEnd-sw.t0)/1000;
  const isHold=!moved&&holdT>=HOLD_T,isTap=!moved&&!isHold,W=curW(),blood=btFor(W.id);
  if(isHold){if(cutWait(false)>0&&W.style!=='gun'){S.denyT=0.3;S.denyKind='cut';sfx('deny');return;}doHold(sw,chargeK(holdT));tutEvent('hold');return;}
  if(CFG.cutRecovery){const w=cutWait(isTap);if(w>0&&!(isTap&&W.style==='gun'&&S.reload>0&&!wBroken())){if(w<=0.14){sw.bufT=S.gt;S.buffer=sw;}else{S.denyT=0.3;S.denyKind=isTap?'tap':'cut';sfx('deny');}return;}}
  if(isTap&&gunTap(last))return;
  let tgt=last;
  if(isTap){const da=Math.atan2(last.y-(P.y-12),last.x-P.x),reach=CFG.tapRadius*W.tapReach*2.2+70,e=autoAim(da,W.style==='thrust'?200:reach,1.0,true);if(e)tgt={x:e.x,y:e.y-10};}
  let ab=abilitiesFor(false);
  if(isTap&&!CFG.tapAbilities){const k2={};for(const k of TAP_ABS)if(ab[k])k2[k]=true;ab=k2;}
  const used=[];
  if(CFG.abilityCds){for(const k in ABCD){if(!ab[k]||k==='chain'||k==='kunai')continue;if((S.abCd[k]||0)>0)ab[k]=false;else used.push(k);}if(!ab.teleport)ab.ricochet=false;}
  let fin=false;
  if(isTap){S.tapChain=(S.gt-S.tapLast<0.7)?S.tapChain+1:0;S.tapLast=S.gt;fin=S.tapChain%3===2;}
  const dirA=isTap?Math.atan2(tgt.y-(P.y-12),tgt.x-P.x):Math.atan2(last.y-sw.pts[0].y,last.x-sw.pts[0].x);
  const dur=Math.max(0.03,(sw.tEnd-sw.t0)/1000);
  const c={isTap,fin,ab,used,W,blood,dirA};
  tutEvent(isTap?'tap':'swipe');
  if(!isTap&&W.style==='smash'){hopSlam(last,dirA,c);return;}
  const mv=isTap?tapMove(W,tgt,fin,dirA):dragMove(W,sw,dirA,ab,{dur,chord:dist(sw.pts[0],last),rawLen:polyLen(sw.pts)});
  if(mv)launchCut(mv,c);
}
function tapMove(W,tgt,fin,a){
  const br=wBroken(),dir=(S.tapChain%2===0)?1:-1,R0=CFG.tapRadius*S.mods.tapReach*W.tapReach*(br?0.8:1)*reachMul(W.id)*(W.id==='reserve'?1+0.08*up('reserve','rreach'):1);
  switch(W.id){
    case'katana':if(fin&&!br)return{pts:bodyLine(a,140*reachMul('katana')),speed:CFG.tapSpeed*1.5,step:{a,L:28},kind:'spear',bonus:1,name:'TSUKI'};break;
    case'yari':if(fin)return{pts:arcPts(a,95*(1+0.15*up('yari','sweep'))*(br?0.8:1),3.6,dir),speed:CFG.tapSpeed,o:{fling:420},bonus:1,noPierce:true,name:'SWEEP'};
      return{pts:bodyLine(a,150*(br?brokenLen('yari'):1)*reachMul('yari')),speed:CFG.tapSpeed*1.2,kind:'spear'};
    case'kanabo':if(fin)return{pts:arcPts(a,74,5.4,dir),speed:CFG.tapSpeed*0.8,o:{fling:520},bonus:1,shockR:0,name:'SWEEP'};
      return{pts:bodyLine(a,clamp(dist(tgt,{x:P.x,y:P.y-12})-6,40,72),6),speed:1150,shockR:46};
    case'kusari':if(btFor('kusari'))return{pts:arcPts(a,72,3.9,dir),speed:CFG.tapSpeed*0.9,bonus:fin?1:0,o:{scythe:2.2}};
      if(S.reap&&!br){S.reap=null;return{pts:arcPts(a,50,3.6,dir),speed:CFG.tapSpeed,bonus:2,name:'REAP',o:{scythe:1.8,fling:300}};}
      break;
    case'nodachi':if(fin&&!br)return{pts:arcPts(a,R0*1.5,3.4,dir),speed:CFG.tapSpeed*0.8,bonus:1+up('nodachi','cleave'),o:{fling:360,hr:14},name:'CLEAVE',cdMul:1.2};
      return{pts:arcPts(a,R0*(btFor('nodachi')?1.5:1),2.4,dir),speed:CFG.tapSpeed*0.85,bonus:0,cdMul:1.1};
    case'tessen':return{pts:arcPts(a,R0*(fin?1.25:1),fin?2.6:2.0,dir),speed:CFG.tapSpeed*1.1,bonus:fin?1:0,o:{fling:fin?320:0}};
    case'bo':if(fin)return{pts:arcPts(a,95*(br?0.75:1),3.8,dir),speed:CFG.tapSpeed,o:{fling:560},bonus:1,noPierce:true,name:'SWEEP'};
      return{pts:bodyLine(a,(br?80:125)*reachMul('bo')),speed:CFG.tapSpeed*1.2,kind:'spear',o:{fling:240,stunT:0.3+0.15*up('bo','stagger')}};
    case'kama':return{pts:arcPts(a,R0*(btFor('kama')?1.5:1),fin?2.8:2.2,dir),speed:CFG.tapSpeed*1.1,bonus:fin?1:0,o:{bleed:true,scythe:btFor('kama')?1.6:0}};
    case'naginata':if(fin)return{pts:arcPts(a,(br?90:130)*(1+0.15*up('naginata','sweep2')),3.6,dir),speed:CFG.tapSpeed,o:{fling:420},bonus:1,name:'SWEEP'};
      return{pts:bodyLine(a,(br?110:190)*reachMul('naginata')),speed:CFG.tapSpeed*1.2,kind:'spear'};
  }
  return{pts:arcPts(a,R0*(fin?1.3:1)*(btFor('reserve')?1.4:1),fin?2.7:2.1,dir),speed:CFG.tapSpeed*(fin?0.85:1),bonus:fin?1+(W.id==='reserve'?up('reserve','rfin'):0):0};
}
// straight weapons (spear, chain, bayonet): with a mouse the line goes from you to where the swipe ends;
// on touch it follows the flick. Either way it leans onto a foe close to that line.
function lineAim(sw,L){
  const A=sw.pts[0],B=sw.pts[sw.pts.length-1],drag=Math.atan2(B.y-A.y,B.x-A.x),dEnd=Math.hypot(B.x-P.x,B.y-(P.y-10));
  let a=!sw.touch&&dEnd>55?Math.atan2(B.y-(P.y-10),B.x-P.x):drag;
  let best=null,bs=1e9;for(const e of S.enemies){if(e.state==='spawn'||e.state==='hide'||e.smoke)continue;const dx=e.x-P.x,dy=e.y-12-(P.y-10),d=Math.hypot(dx,dy);if(d>L+e.r+10)continue;
    const da=Math.abs(wrapA(Math.atan2(dy,dx)-a)),perp=Math.sin(Math.min(da,Math.PI/2))*d;if(da>0.45||perp>e.r+38)continue;const sc=da*2+d/L;if(sc<bs){bs=sc;best=e;}}
  return best?Math.atan2(best.y-12-(P.y-10),best.x-P.x):a;
}
function dragMove(W,sw,a,ab,m){
  const br=wBroken(),bl=br?brokenLen(W.id):1;
  switch(W.style){
    case'thrust':{const L=W.len*bl*reachMul('yari')*(btFor('yari')?1.4:1);a=lineAim(sw,L);return{pts:bodyLine(a,L),speed:clamp(m.chord/m.dur,900,2600)*1.2,step:{a,L:34},kind:'spear'};}
    case'chain':if(br)return{pts:arcPts(lineAim(sw,64),64,2.6,1),speed:CFG.tapSpeed};
      {const bt=btFor('kusari'),L=W.len*reachMul('kusari')*(1+0.15*up('kusari','chain'))*(bt?1.15:1);a=lineAim(sw,L);return{pts:bodyLine(a,L),speed:1750,kind:'chain',o:{hook:true,hookMax:bt?3:1},noPierce:true};}
    case'gun':a=lineAim(sw,110*bl);return{pts:bodyLine(a,110*bl,10),speed:1900,step:{a,L:46},kind:'spear',name:'BAYONET'};
    case'fan':{const bt=btFor('tessen'),gu=1+0.2*up('tessen','gust'),L=(br?120:230)*gu*(bt?1.3:1);a=lineAim(sw,L);return{pts:bodyLine(a,L),speed:1400,isWave:true,bonus:bt?1:0,o:{fling:(br?260:520)*gu,hr:bt?24:20,isWave:true},noPierce:true,name:bt?null:null};}
    case'staff':{a=lineAim(sw,110);const side=wrapA(a-Math.atan2(sw.pts[sw.pts.length-1].y-sw.pts[0].y,sw.pts[sw.pts.length-1].x-sw.pts[0].x))>0?1:-1;return{pts:arcPts(a,br?80:110,3.4,side),speed:CFG.tapSpeed*1.05,o:{fling:620,stunT:0.4},noPierce:true};}
    case'hook':if(br)return{pts:arcPts(lineAim(sw,60),60,2.6,1),speed:CFG.tapSpeed,o:{bleed:true}};
      {const L=W.len*(1+0.15*up('kama','hookr'))*(btFor('kama')?1.2:1);a=lineAim(sw,L);return{pts:bodyLine(a,L),speed:1800,kind:'chain',o:{hook:true,hookMax:btFor('kama')?2:1,bleed:true},noPierce:true};}
    case'polearm':{const R=(br?100:145)*(1+0.15*up('naginata','sweep2'));a=lineAim(sw,R);return{pts:arcPts(a,R,2.9,1),speed:CFG.tapSpeed*1.05,o:{fling:320},bonus:0,child2:btFor('naginata')};}
  }
  if(W.id==='nodachi')ab.pierce=true;
  if(W.id==='katana')ab.curve=true;
  const r=buildPath(sw.pts,ab);
  return{pts:r.pts,bounces:r.bounces,speed:clamp((ab.curve?m.rawLen:m.chord)/m.dur,CFG.slashMin,Math.max(CFG.slashMin,CFG.slashMax)),trace:true};
}
// the kanabo: hop toward where the swipe ends and bring the club down on that spot
function hopSlam(target,a0,c){
  const W=curW(),maxR=(160+25*up('kanabo','hop'))*(wBroken()?brokenLen('kanabo'):1),feet={x:target.x,y:target.y+10};
  let d=dist(feet,P),tx=feet.x,ty=feet.y;if(d>maxR){tx=P.x+(tx-P.x)/d*maxR;ty=P.y+(ty-P.y)/d*maxR;d=maxR;}
  const ang=Math.atan2(ty-P.y,tx-P.x),hl=Math.min(110,Math.max(0,d-50));
  let land=clipPts([{x:P.x,y:P.y},rayTo({x:P.x,y:P.y},ang,hl,P.r)],['wall','crate'],P.r-1).pts.pop();land=freeSpot(S.room,land.x,land.y,P.r);
  S.cdLock=Math.max(S.cdLock,0.32);for(const k of c.used)abUse(k);S.face=Math.cos(ang)>0?1:-1;S.anim={kind:'down',t:0,dir:{x:Math.cos(ang),y:Math.sin(ang)}};
  const slam=()=>{const L=clamp(Math.hypot(tx-P.x,ty-P.y)+12,40,W.len*1.2);launchCut({pts:bodyLine(Math.atan2(ty-P.y,tx-P.x),L,6),speed:1300,shockR:W.shock,o:{famCap:1},cdMul:1.15},Object.assign({},c,{used:[]}));};
  if(dist(land,P)>8){leapTo(land,0.2,16,slam,false);sfx('dash');}else slam();
}
// held attacks
function doHold(sw,k){
  const W=curW(),br=wBroken(),blood=btFor(W.id),a=holdAim(sw),full=k>=1,c={isTap:false,fin:false,ab:{},used:[],W,blood,dirA:a,hold:true};
  let mv=null;
  switch(W.id){
    case'reserve':mv={pts:bodyLine(a,(170+150*k)*(1+0.25*up('reserve','rhold'))),speed:1000,o:{ab:{pierce:true},isWave:!blood,hr:12},bonus:full?1:0,name:full?'BLOOD WAVE':null,cdMul:1.1};break;
    case'katana':if(br){mv={pts:bodyLine(a,150),speed:2600,bonus:0};break;}
      mv={pts:bodyLine(a,(200+120*k)*reachMul('katana')),speed:1e6,bonus:1+Math.round(2*k)+up('katana','iai'),step:{a,L:36},o:{hr:15,noBlock:full},name:full?'IAI':null,cdMul:1.15};P.inv=Math.max(P.inv,0.15);sfx('draw');break;
    case'yari':mv={pts:bodyLine(a,W.len*(br?brokenLen('yari'):1)*reachMul('yari')),speed:2400,kind:'spear',bonus:full?1:0,step:{a,L:20}};break;
    case'kanabo':mv={pts:arcPts(a,70+40*k,6.2,S.face),speed:1100+400*k,bonus:1+Math.round(2*k),o:{fling:500+300*k,hr:16+6*k},shockR:0,name:full?'CRUSHING SWING':null,cdMul:1.25};break;
    case'kusari':if(br){mv={pts:arcPts(a,70,3.2,1),speed:CFG.tapSpeed,bonus:0};break;}
      {const L=W.len*1.4*reachMul('kusari')*(1+0.15*up('kusari','chain'));mv={pts:bodyLine(a,L),speed:2000,kind:'chain',bonus:1,o:{hook:true,hookMax:btFor('kusari')?3:1},noPierce:true,name:'FLING',cdMul:1.3};}break;
    case'musket':if(!br||blood){gunTap({x:P.x+Math.cos(a)*100,y:P.y-12+Math.sin(a)*100},{aimed:true,k});return;}
      mv={pts:bodyLine(a,110,10),speed:1900,step:{a,L:30},kind:'spear'};break;
    case'nodachi':{const R=(br?80:110+40*k)*(1+0.2*up('nodachi','draw'))*(blood?1.4:1);mv={pts:arcPts(a,R,6.3,S.face),speed:1500+700*k,bonus:1+Math.round(2*k),o:{fling:320,hr:14},name:full?'CRESCENT DRAW':null,cdMul:1.3};break;}
    case'tessen':{const t=1.0+0.6*k+0.3*up('tessen','mirror');counterStance(t,src=>{text(P.x,P.y-50,'MIRROR FAN',C.spirit,true);addMeter(10);const o=src.owner;
        if(o&&S.enemies.includes(o)){const ang=Math.atan2(o.y-12-(P.y-12),o.x-P.x);if(src.shot||!src.pts)skCut([{x:P.x,y:P.y-12},rayTo({x:P.x,y:P.y-12},ang,600,2)],1800,{dmgBonus:1+(blood?2:0),hr:9,kind:'bullet',fam:++FAM});
          else{stunEnemy(o,o.boss?0.6:1.4);if(!o.boss&&!o.T.heavy){o.kx=Math.cos(ang)*620;o.ky=Math.sin(ang)*620;}}}},{multi:k>=1,col:C.spirit,glyph:'鏡'});
      S.cdLock=Math.max(S.cdLock,0.25);S.cdCut=S.cdCutMax=1.2*wCdMul(false);sfx('guarded');return;}
    case'bo':{const L=(br?90:130+90*k)*(1+0.2*up('bo','vault'));let to=rayTo({x:P.x,y:P.y},a,L,P.r);to=clipPts([{x:P.x,y:P.y},to],['wall'],P.r).pts.pop();to=freeSpot(S.room,to.x,to.y,P.r);
      const quake=blood;S.face=Math.cos(a)>0?1:-1;sfx('dash');S.cdCut=S.cdCutMax=1.1*wCdMul(false);S.cdLock=Math.max(S.cdLock,0.3);
      leapTo(to,0.38,40,()=>{burstAt({x:P.x,y:P.y},{ab:{},team:'p',hits:new Set(),fam:++FAM,dmgBonus:quake?3:1,d:0,len:1,cum:[0,1]},quake?150:80);for(const e of S.enemies)if(dist(e,P)<(quake?170:95)&&e.state!=='spawn')stunEnemy(e,e.boss?0.4:(quake?1.4:0.8));
        S.shake+=quake?14:7;sfx(quake?'smash':'land');burst(P.x,P.y,quake?30:14,'#6a5a60',quake?280:200,0.5,2);if(quake){S.bt=null;text(P.x,P.y-60,'SHATTER',C.hi,true);S.flash=Math.max(S.flash,0.1);}});return;}
    case'kama':mv={pts:arcPts(a,(br?55:70+30*k)*(blood?1.4:1),3.4,S.face),speed:1500,bonus:1,o:{bleed:true,reapFeed:true,scythe:blood?1.8:0,hr:12},name:full?'REAP':null,cdMul:1.2};break;
    case'naginata':{const R=(br?95:120+30*k)*(1+0.15*up('naginata','sweep2'));mv={pts:arcPts(a,R,12.6,S.face),speed:1700+300*up('naginata','wheel'),bonus:1+up('naginata','wheel'),o:{fling:380,famCap:2},name:full?'WHEEL':null,cdMul:1.35};break;}
  }
  if(mv)launchCut(mv,c);
}
function launchCut(mv,c){
  const {isTap,fin,ab,used,W,blood}=c;
  const clp=clipPts(mv.pts,['wall'],2),pts=clp.pts;if(pts.length<2)return;
  let speed=mv.speed*S.mods.speedMul;if(ab.instant)speed=1e6;
  if(wTrick()&&W.pierce&&!mv.noPierce)ab.pierce=true;if(blood&&(W.id==='reserve'||W.id==='yari'||W.id==='nodachi'))ab.pierce=true;if(blood&&W.id==='katana')ab.echo=true;
  const scy=mv.o&&mv.o.scythe;
  const hr=CFG.hitRadius*(isTap?1.35:1)*(ab.wide?2.5:1)*(W.hr/9)*(blood&&W.id==='reserve'?1.8:1)*(scy?(+scy||1.5):1);
  let bonus=(mv.bonus||0)+W.dmg+(P.wpn&&P.wpn.perk==='keen'?1:0)+(blood&&(W.id==='katana'||W.id==='reserve'||W.id==='kusari')?1:0);if(S.mods.firstCut&&!S.firstCutUsed){bonus++;S.firstCutUsed=true;}
  const quake=blood&&W.id==='kanabo';
  const sb=mv.shockR!==undefined?mv.shockR:(isTap?0:(W.shock||0));
  const shock=W.shock&&wTrick()?(quake?230:sb*(1+0.15*up('kanabo','quake'))):0;
  const main=makeCut(pts,speed,Object.assign({team:'p',ult:false,ab,hr,noBlock:isTap&&CFG.tapNoParry,isTap,dmgBonus:bonus+(quake?3:0),fam:++FAM,clipAt:clp.hit,wid:P.wpn?P.wpn.uid:0,blood:blood||scy,shock,quake,kind:mv.kind},mv.o||{}));
  if(main.len<6)return;
  if(quake)S.bt=null;
  if(blood&&W.id==='yari'&&!isTap&&!fin)for(const o of [-0.22,0.22])spawnChild(bodyLine(c.dirA+o,W.len*1.4),main);
  if(mv.child2)S.pending.push({t:0.08,fn:()=>{const R=(mv.child2R||175);spawnChild(arcPts(c.dirA,R,2.9,-1),main,{blood:true});}});
  S.slashes.push(main);S.cutCount++;for(const k of used)abUse(k);
  if(mv.step)stepSlide(mv.step.a,mv.step.L);
  if(mv.name)text(P.x,P.y-50,mv.name,blood||scy?C.hi:C.bone);
  sfx(isTap?'tap':'slash',isTap?fin:speed);if(mv.kind==='chain'){sfx('chain');sfx('eswing');}S.hint.cut=true;if(S.stats)S.stats.cuts++;
  const dirA=Math.atan2(pts[pts.length-1].y-pts[0].y,pts[pts.length-1].x-pts[0].x),fa=mv.kind==='spear'||mv.kind==='chain'?dirA:c.dirA,dx=Math.cos(fa),dy=Math.sin(fa);
  S.anim={kind:(fin||Math.abs(dy)>0.72)?'down':'side',t:0,dir:{x:dx,y:dy}};if(Math.abs(dx)>0.15)S.face=dx>0?1:-1;
  if(CFG.cutRecovery){
    const rm=Math.max(0.55,S.mods.recoverMul)*(mv.cdMul||1);S.cdLock=CFG.cutLock;
    if(isTap){S.cdTap=S.cdTapMax=CFG.tapCd*(fin?1.35:1)*rm*wCdMul(true);}
    else{S.cdCut=S.cdCutMax=(CFG.cutCdBase+CFG.cutCdLen*Math.min(1,main.len/Math.max(60,W.style==='trace'?maxLen():W.len)))*rm*wCdMul(false);}
  }
  if(isTap){
    S.tapTimes=S.tapTimes.filter(t=>S.gt-t<1.6);S.tapTimes.push(S.gt);const spam=S.tapTimes.length;
    if(CFG.aiReadSpam)for(const e of [...S.enemies]){
      if(!['strafe','wind','guard'].includes(e.state)||e.T.sumo)continue;
      const duel=isDuel(e);if(!duel&&spam<3)continue;
      let near=false;forTrail({pts,cum:main.cum,d:main.len},(a,b)=>{if(segDist(e,a,b)<e.r+hr+6)near=true;return near;});
      const chance=duel?Math.min(0.92,0.5+0.12*spam):e.boss?Math.min(0.9,0.45*(spam-2)):Math.min(0.9,0.35*(spam-2));
      if(!near||Math.random()>chance)continue;
      const kind=e.T.guard>0&&CFG.aiParry?'guard':e.T.dodge>0&&CFG.aiDodge?'dodge':null;if(!kind)continue;
      text(e.x,e.y-52,'READ',C.curse);if(kind==='guard')e.readT=S.gt+0.5;else doReact(e,{s:main,kind});
    }
  }
  const A=pts[0],B=pts[pts.length-1],cl=dist(A,B)||1,nx=-(B.y-A.y)/cl,ny=(B.x-A.x)/cl;
  if(ab.cross){const M=posAt(main,main.len/2),L=Math.min(main.len,180)/2;spawnChild([inArena({x:M.x-nx*L,y:M.y-ny*L},2),inArena({x:M.x+nx*L,y:M.y+ny*L},2)],main);}
  if(ab.triple)for(const o of [-30,30])spawnChild(pts.map(p=>inArena({x:p.x+nx*o,y:p.y+ny*o},2)),main);
  if(ab.ghost){const cx=P.x,cy=P.y-12;S.pending.push({t:0.12,fn:()=>{spawnChild(pts.map(p=>inArena({x:2*cx-p.x,y:2*cy-p.y},2)),main,{ghost:true});}});}
  if(ab.kunai&&abReady('kunai')){const tgt=nearestEnemy(P,700);if(tgt){abUse('kunai');const a0=Math.atan2(tgt.y-12-(P.y-12),tgt.x-P.x);for(const o of [-0.16,0,0.16]){const a=a0+o,st={x:P.x,y:P.y-12};spawnChild([st,rayTo({x:st.x,y:st.y},a,380,2)],main,{kind:'kunai',hr:6,speed:1400,ab:{},noBlock:true});}sfx('shuriken');}}
  $('rSlash').textContent=`${speed>=1e5?'instant':Math.round(speed)+' px/s'} · ${Math.round(main.len)} px${mv.bounces?` · ${mv.bounces} bounce${mv.bounces>1?'s':''}`:''} · ${c.hold?'Hold':isTap?(fin?'Finisher':'Slash'):tier(speed)}`;
}
function nearestEnemy(p,maxD){let best=null,bd=maxD||1e9;for(const e of S.enemies){if(e.state==='spawn'||e.state==='hide')continue;const d=dist(e,p);if(d<bd){bd=d;best=e;}}return best;}

// ---------- foes ----------
function spawnEnemy(key,opt){
  opt=opt||{};const T=opt.boss?BOSSES[key]:TYPES[key];if(!T)return null;
  if(S.gmx&&S.gmx.eliteAll&&!opt.boss&&!T.dummy&&!T.sumo&&!opt.illusion&&!opt.elite)opt=Object.assign({},opt,{elite:true});
  const R=S.room;let p=opt.pos;
  if(!p){for(let i=0;i<80;i++){p={x:rand(WALL+60,R.w-WALL-60),y:rand(WALL+80,R.h-WALL-60)};if(dist(p,P)>(opt.boss?280:230)&&!blockedAt(p.x,p.y,T.r+8))break;}}
  const f=fl(),hpMul=opt.boss?CFG.bossHpMul*(1+0.18*(f-1)):T.sumo?1:CFG.enemyHpMul*(1+0.2*(f-1))*(opt.elite?1.7:1)*(opt.duel&&!T.duel?1.6:1);
  let hp=opt.illusion?1:Math.max(1,Math.round(T.hp*hpMul));
  if(S.gmx&&!opt.illusion&&!T.sumo&&!T.dummy&&!S.inHub){if(opt.boss)hp=Math.max(1,Math.round(hp*S.gmx.bossHpMul));else hp=S.gmx.ippon?1:Math.max(1,Math.round(hp*S.gmx.hpMul));}
  const spawnT=opt.boss?1.4:opt.quick?0.35:rand(0.7,1.0);
  const e={T,key,look:T.look,boss:!!opt.boss,elite:!!opt.elite,illusion:!!opt.illusion,x:p.x,y:p.y,r:T.r,hp,max:hp,state:'spawn',t:spawnT,spawnT,vx:0,vy:0,kx:0,ky:0,face:P.x>p.x?1:-1,anim:Math.random()*3,
    cd:CFG.eCooldown*T.cd*rand(0.6,1.1),dodgeCd:0,guardCd:0,flash:0,cuts:[],shotsPlan:null,wind:CFG.telegraph,planT:0,orbit:1,pref:150,pace:1,step:null,react:null,seen:new WeakSet(),combo:0,comboPat:null,riposte:false,feintAt:null,dv:null,bleedT:0,pose:'idle',poseT:0,enraged:false,armorT:0,hitLog:[],hopT:Math.random(),hidden:false,
    duelist:!!opt.duel,famHits:new Map(),ifr:0,stunImm:0,smoke:false,smokeT:rand(1.5,2.5),readT:0,desp:false};
  if(T.hide&&!opt.noHide)e.wantHide=true;
  if(e.boss&&S.gmx&&S.gmx.enraged)e.enraged=true;
  S.enemies.push(e);return e;
}
function plan(e){
  const ch=CFG.aiChaos,T=e.T;
  e.planT=rand(0.25,1.2)*(1.4-ch)*(T.blink?2:1);
  e.orbit=Math.random()<0.5?-1:1;e.pref=rand(T.pref[0],T.pref[1]);
  e.pace=Math.random()<0.15+0.2*ch?0:rand(0.4,1.3);
  if(!T.blink&&!T.hop&&Math.random()<ch*0.7){const a=Math.random()*Math.PI*2;e.step={x:Math.cos(a),y:Math.sin(a),t:rand(0.08,0.16)};}
  if(T.hover)e.perch=findPerch(e);
}
function stunEnemy(e,t){if(e.state==='wind'){e.cuts=[];e.shotsPlan=null;}e.state='stun';e.t=t;e.react=null;e.combo=0;e.feintAt=null;e.step=null;}
function blinkTo(e,p){const q=inArena(p,e.r);burst(e.x,e.y-14,10,C.phase,200,0.4,2);e.x=q.x;e.y=q.y;burst(e.x,e.y-14,10,C.phase,200,0.4,2);e.blinkT=0.25;if(onScreen(e))sfx('blink');}
function eCut(e,pts,sp,extra){const cp=clipPts(pts.map(p=>inArena(p,2)),extra&&(extra.kind==='bullet'||extra.kind==='arrow')?['wall','crate']:['wall'],2);return makeCut(cp.pts,sp,Object.assign({team:'e',owner:e,hitP:false,hr:8,clipAt:cp.hit},extra));}
const ftele=()=>CFG.telegraph*Math.max(0.75,1-0.05*(fl()-1));
function startWind(e,forced,teleMul){
  const T=e.T,cy=e.y-14,d=dist(P,e)||1,ux=(P.x-e.x)/d,uy=(P.y-e.y)/d,a0=Math.atan2(uy,ux),pp=predictP(d/480),aShot=Math.atan2(pp.y-12-cy,pp.x-e.x);
  const pats=e.enraged&&T.enr?T.pats.concat(T.enr):T.pats,CLOSE=['dash','charge','iai','dive','lunge','shellspin','wcut','shove','grab','devour','sixarm'];
  let pat=forced||pick(pats);if(e.disarmed&&!forced)pat='cross';
  if(pat==='glyph'&&(!T.glyphs||S.glyph))pat=pats.find(p=>p!=='glyph'&&!CLOSE.includes(p))||'cross';e.later=null;e.busyT=0;
  if(CLOSE.includes(pat)&&d>((pat==='charge'||pat==='iai'||pat==='dive')?460:320))pat=pats.find(p=>!CLOSE.includes(p))||pat;
  const ti=Math.floor(Math.random()*3),base=ETIERS[ti]*CFG.eSlashMul,phase=!!T.phase&&pat!=='cage';
  let cuts=[],shots=null,tele=T.tele,pose='wind';e.combo=0;
  const crossAt=(sp,L0)=>{const lead=0.12+0.25*CFG.aiChaos,cx=P.x+P.vx*lead,cyy=P.y+P.vy*lead,a=a0+Math.PI/2+rand(-0.5,0.5),L=(L0||85)*(e.boss?1.25:1),s=Math.random()<.5?1:-1;
    return eCut(e,[{x:cx-Math.cos(a)*L*s,y:cyy-Math.sin(a)*L*s},{x:cx+Math.cos(a)*L*s,y:cyy+Math.sin(a)*L*s}],sp,{tier:ti+1,phase,hr:e.boss?10:8});};
  const line=(L,sp,o)=>eCut(e,[{x:e.x+ux*(e.r+2),y:e.y+uy*(e.r+2)},{x:e.x+ux*L,y:e.y+uy*L}],sp,Object.assign({tier:ti+1},o));
  const radial=(n,L,sp,o)=>{const out=[];for(let i=0;i<n;i++){const a=a0+i*Math.PI*2/n;out.push(eCut(e,[{x:e.x+Math.cos(a)*(e.r+4),y:e.y+Math.sin(a)*(e.r+4)},{x:e.x+Math.cos(a)*(e.r+4+L),y:e.y+Math.sin(a)*(e.r+4+L)}],sp,Object.assign({tier:1,kind:'smash',hr:12},o)));}return out;};
  const nx=newPattern(e,pat,{d,ux,uy,a0,aShot,base,ti,phase,line});
  if(nx){cuts=nx.cuts||[];shots=nx.shots||null;tele*=nx.tele||1;if(nx.pose)pose=nx.pose;e.later=nx.later||null;}
  else switch(pat){
    case'cross':cuts=[crossAt(base)];break;
    case'double':cuts=[crossAt(base)];e.combo=1;e.comboPat='cross';break;
    case'combo3':cuts=[crossAt(base*1.1)];e.combo=2;e.comboPat='cross';break;
    case'flurry':cuts=[crossAt(base*1.15,60)];e.combo=2;e.comboPat='flurry';tele*=0.8;break;
    case'dash':cuts=[line(Math.min(d+90,330),base*1.15,{carry:true})];break;
    case'lunge':cuts=[line(Math.min(d+40,210),base*1.2,{carry:true})];break;
    case'dive':cuts=[line(Math.min(d+50,420),base*1.2,{carry:true,kind:'dive'})];tele*=1.1;break;
    case'shellspin':cuts=[line(Math.min(d+80,360),base*1.1,{carry:true,kind:'spin',hr:14})];break;
    case'charge':cuts=[line(Math.min(d+180,560),base*1.25,{carry:true,hr:16})];tele*=1.2;break;
    case'iai':cuts=[line(Math.min(d+150,470),2200*CFG.eSlashMul,{carry:true,tier:3})];break;
    case'thrust':cuts=[line(Math.min(d+110,390),base*1.1,{kind:'spear'})];break;
    case'tongue':cuts=[eCut(e,[{x:e.x+ux*6,y:cy},{x:e.x+ux*Math.min(d+30,160),y:cy+uy*Math.min(d+30,160)}],950*CFG.eSlashMul,{tier:3,kind:'tongue',hr:6})];tele*=0.8;break;
    case'neck':{const L=Math.min(d+70,430),hy=e.y-26;cuts=[eCut(e,[{x:e.x,y:hy},{x:e.x+Math.cos(aShot)*L,y:hy+Math.sin(aShot)*L}],650*CFG.eSlashMul,{tier:2,kind:'neck',hr:9})];break;}
    case'shuriken':cuts=[-0.22,0,0.22].map(o=>{const a=aShot+o,L=Math.min(d+90,560);return eCut(e,[{x:e.x+Math.cos(a)*e.r,y:cy+Math.sin(a)*e.r},{x:e.x+Math.cos(a)*L,y:cy+Math.sin(a)*L}],950*CFG.eSlashMul,{tier:3,kind:'shuriken',hr:6});});tele*=0.9;pose='strike';break;
    case'arrow':cuts=[eCut(e,[{x:e.x+ux*e.r,y:cy+uy*e.r},{x:e.x+ux*760,y:cy+uy*760}],1050*CFG.eSlashMul,{tier:3,kind:'arrow',track:true,hr:6})];pose='draw';break;
    case'smash':cuts=radial(e.boss?12:6,e.boss?280:150,520*CFG.eSlashMul);break;
    case'quake':cuts=radial(10,260,480*CFG.eSlashMul);e.combo=1;e.comboPat='smash';break;
    case'drum':cuts=radial(8,120,430*CFG.eSlashMul,{hr:10});tele*=1.1;break;
    case'explode':cuts=radial(8,80,520*CFG.eSlashMul,{kind:'fire',hr:10});break;
    case'sweep':{const pts=[],R=78*(e.boss?1.3:1),sd=Math.random()<.5?1:-1;for(let i=0;i<=14;i++){const a=a0+sd*(-1.25+2.5*i/14);pts.push({x:e.x+Math.cos(a)*R,y:e.y+Math.sin(a)*R});}cuts=[eCut(e,pts,base*1.2,{tier:ti+1,hr:11})];break;}
    case'spin':{const pts=[],R=48,sd=Math.random()<.5?1:-1;for(let i=0;i<=20;i++){const a=a0+sd*i/20*Math.PI*2;pts.push({x:e.x+Math.cos(a)*R,y:e.y+Math.sin(a)*R*0.8});}cuts=[eCut(e,pts,620*CFG.eSlashMul,{tier:2,hr:11})];break;}
    case'gust':{const px=-uy,py=ux,L=d+160;for(const o of [-60,-30,0,30,60])cuts.push(eCut(e,[{x:e.x+px*o-ux*20,y:e.y+py*o-uy*20},{x:e.x+px*o+ux*L,y:e.y+py*o+uy*L}],700*CFG.eSlashMul,{tier:2,kind:'wind',hr:7,push:420}));tele*=1.05;break;}
    case'claw':{if(T.blink){const a=Math.random()*Math.PI*2;blinkTo(e,{x:P.x+Math.cos(a)*95,y:P.y+Math.sin(a)*95});}
      const cxp=P.x,cyp=P.y,L=70,r1=Math.random()*Math.PI;cuts=[r1,r1+Math.PI/2].map(a=>eCut(e,[{x:cxp-Math.cos(a)*L,y:cyp-Math.sin(a)*L},{x:cxp+Math.cos(a)*L,y:cyp+Math.sin(a)*L}],760*CFG.eSlashMul,{tier:2,phase}));tele*=0.65;break;}
    case'fan':{const n=e.boss?5:3,L=d+120;for(let i=0;i<n;i++){const off=(i-(n-1)/2)*0.32,a=a0+off,bend=(i-(n-1)/2)*90,pts=[];
      for(let k=0;k<=12;k++){const t=k/12,bx=e.x+Math.cos(a)*L*t,by=e.y+Math.sin(a)*L*t,s=Math.sin(Math.PI*t)*bend;pts.push({x:bx-Math.sin(a)*s,y:by+Math.cos(a)*s});}
      cuts.push(eCut(e,pts,620*CFG.eSlashMul,{tier:2,phase}));}break;}
    case'cage':{const h=95,cx0=P.x,cy0=P.y,c=[[-h,-h],[h,-h],[h,h],[-h,h]];for(let i=0;i<4;i++){const A=c[i],B=c[(i+1)%4];cuts.push(eCut(e,[{x:cx0+A[0],y:cy0+A[1]},{x:cx0+B[0]+(B[0]-A[0])*0.15,y:cy0+B[1]+(B[1]-A[1])*0.15}],380*CFG.eSlashMul,{tier:1}));}
      cuts.push(...[0,Math.PI/2].map(a=>eCut(e,[{x:cx0-Math.cos(a)*h,y:cy0-Math.sin(a)*h},{x:cx0+Math.cos(a)*h,y:cy0+Math.sin(a)*h}],300*CFG.eSlashMul,{tier:1,delay:0.5})));tele*=1.2;break;}
    case'spit':shots=[{a:aShot,sp:520,kind:'water',r:6}];break;
    case'web':shots=[{a:aShot,sp:470,kind:'web',r:8}];break;
    case'foxfire':shots=[-0.55,0,0.55].map(o=>({a:aShot+o,sp:250,kind:'fox',r:6,home:3,homeT:1.3}));tele*=1.1;break;
    case'ring9':shots=Array.from({length:9},(_,i)=>({a:i/9*Math.PI*2,sp:230,kind:'fox',r:7,home:2.2,homeT:1.5,orbit:true}));tele*=1.2;break;
    case'icicle':shots=[-0.5,-0.25,0,0.25,0.5].map(o=>({a:aShot+o,sp:560,kind:'ice',r:6}));break;
    case'chain':cuts=[line(Math.min(d+60,380),base*1.25,{kind:'chain',pull:true,hr:7})];tele*=1.05;break;
    case'wcut':cuts=[line(Math.min(d+110,300),base*1.35,{carry:true,kind:'wind',hr:8})];tele*=0.85;break;
    case'ladle':shots=[-0.42,-0.21,0,0.21,0.42].map(o=>({a:aShot+o,sp:330,kind:'water',r:6}));break;
    case'smoke':cuts=radial(8,110,470*CFG.eSlashMul,{kind:'smoke',hr:11});break;
    case'shove':cuts=[line(Math.min(d+70,250),base*1.1,{carry:true,kind:'shove',hr:16,shove:true})];break;
    case'musket':cuts=[eCut(e,[{x:e.x+ux*e.r,y:cy+uy*e.r},{x:e.x+ux*780,y:cy+uy*780}],3000*CFG.eSlashMul,{tier:3,kind:'bullet',track:true,hr:5})];pose='draw';tele*=1.0;break;
    case'clones':case'summon':tele*=1.1;break;
  }
  if(e.disarmed){for(const c of cuts)if(c.len>70){const p=truncate(c.pts,70);Object.assign(c,makeCut(p,c.speed,{team:'e',owner:e,hitP:false,hr:7,tier:c.tier}));}tele*=1.25;}
  e.cuts=cuts;e.shotsPlan=shots;e.pose=pose;e.pat=pat;
  const enr=e.enraged?0.8:1;
  e.state='wind';e.wind=e.t=Math.max(0.08,(teleMul||1)*S.mods.teleMul*ftele()*tele*rand(0.75,1.25)*(e.riposte?0.45:1)*enr*(e.desp?0.85:1));
  e.feintAt=CFG.aiFeint&&!forced&&!e.riposte&&T.feint>0&&Math.random()<CFG.feintChance*T.feint?e.wind*rand(0.3,0.6):null;
  e.riposte=false;e.vx*=0.2;e.vy*=0.2;if(onScreen(e))sfx('wind',phase?'phase':'');
  if(pat==='glyph')glyphBegin(e);
}
function launchStrike(e){
  e.state='strike';e.pose='strike';e.poseT=0.25;
  if(e.later){const f=e.later;e.later=null;const extra=f(e);if(extra&&extra.length)e.cuts=e.cuts.concat(extra);}
  for(const c of e.cuts){if(c.delay)S.pending.push({t:c.delay,fn:()=>{if(S.enemies.includes(e))S.eslashes.push(c);else c.done=true;}});else S.eslashes.push(c);}
  if(e.shotsPlan){const cy=e.y-14;for(const s of e.shotsPlan){const ox=s.orbit?Math.cos(s.a)*34:Math.cos(s.a)*e.r,oy=s.orbit?Math.sin(s.a)*34:Math.sin(s.a)*e.r;
      S.shots.push({x:e.x+ox,y:cy+oy,vx:Math.cos(s.a)*s.sp,vy:Math.sin(s.a)*s.sp,spd:s.sp,r:s.r,kind:s.kind,home:s.home||0,homeT:s.homeT||0,t:0,life:4,owner:e});}
    sfx({web:'web',water:'splash',ink:'splash',feather:'shuriken',ice:'shotcut'}[e.shotsPlan[0].kind]||'fox');}
  if(e.pat==='clones'){const k=e.T.clone||'kitsune';for(let i=0;i<2;i++){const a=Math.random()*Math.PI*2;const c=spawnEnemy(k,{illusion:true,quick:true,pos:rayTo({x:e.x,y:e.y},a,110,20)});if(c){c.cd=0.4;c.summoned=e;}}text(e.x,e.y-60,'ILLUSIONS',C.fox);}
  if(e.pat==='summon'){const pool=e.T.summon||['gaki'],n=Math.min(e.boss?3:2,7-S.enemies.length);for(let i=0;i<n;i++){const a=Math.random()*Math.PI*2,m=spawnEnemy(pick(pool),{quick:true,pos:rayTo({x:e.x,y:e.y},a,120,20)});if(m)m.summoned=e;}if(n>0)text(e.x,e.y-60,pool[0]==='gaki'?'RISE, HUNGRY ONES':'TO ME!',C.hi);}
  if(e.pat==='bolt'&&onScreen(e))sfx('zap');
  if(e.pat==='smash'||e.pat==='quake'||e.pat==='drum'){S.shake+=e.boss?10:5;burst(e.x,e.y,14,C.ash,260,0.5,2);}
  if(e.pat==='explode'){S.pending.push({t:0.05,fn:()=>{if(S.enemies.includes(e)){e.hp=0;kill(e,null,true);}}});}
  if(onScreen(e))sfx(e.pat==='arrow'?'arrow':e.pat==='shuriken'?'shuriken':(e.pat==='smash'||e.pat==='quake')?'smash':e.pat==='drum'?'pon':e.pat==='gust'?'gust':e.pat==='explode'?'fire':'eswing');
}
function closestAhead(s,e){
  let best=null;
  for(let i=1;i<s.pts.length;i++){
    if(s.cum[i]<=s.d)continue;
    const a0=s.cum[i-1]<s.d?head(s):s.pts[i-1],aAlong=Math.max(s.cum[i-1],s.d),b=s.pts[i];
    const dx=b.x-a0.x,dy=b.y-a0.y,l2=dx*dx+dy*dy,l=Math.sqrt(l2)||1;
    const t=l2?clamp(((e.x-a0.x)*dx+(e.y-a0.y)*dy)/l2,0,1):0,px=a0.x+dx*t,py=a0.y+dy*t,dd=Math.hypot(e.x-px,e.y-py);
    if(!best||dd<best.d)best={d:dd,along:aAlong+l*t,x:px,y:py,dir:{x:dx/l,y:dy/l}};
  }
  return best;
}
function scanThreats(e){
  if(e.react)return;const T=e.T;
  for(const s of S.slashes){
    if(s.done||e.seen.has(s))continue;e.seen.add(s);if(s.skill&&Math.random()<0.6)continue;
    const c=closestAhead(s,e);if(!c||c.d>e.r+s.hr+12)continue;
    const duel=isDuel(e),skill=(duel?2.2:e.boss?(e.enraged?1.7:1.35):1)*(1+0.035*realmN()),react=e.T.reflex??(duel?Math.min(CFG.aiReaction,0.06):e.boss?Math.min(CFG.aiReaction,0.09):CFG.aiReaction);
    if((c.along-s.d)/s.speed<=react)continue;
    const canG=CFG.aiParry&&e.guardCd<=0&&T.guard>0,canD=CFG.aiDodge&&e.dodgeCd<=0&&T.dodge>0;
    let kind=null;
    if(canG&&Math.random()<Math.min(0.95,CFG.parryChance*T.guard*skill))kind='guard';else if(canD&&Math.random()<Math.min(0.95,CFG.dodgeChance*T.dodge*skill))kind='dodge';
    if(kind){e.react={t:react*rand(0.8,1.2),s,kind};break;}
  }
}
function doDodge(e,c){
  if(e.state==='wind'){e.cuts=[];e.shotsPlan=null;}
  e.feintAt=null;S.dodges++;readAi();e.dodgeCd=e.T.blink?1.2:isDuel(e)?0.55:0.9;if(isDuel(e)&&Math.random()<0.6)e.riposte=true;
  if(e.T.blink){const a=Math.random()*Math.PI*2,r=rand(140,220);blinkTo(e,{x:P.x+Math.cos(a)*r,y:P.y+Math.sin(a)*r});e.state='strafe';e.cd=Math.min(e.cd,0.3);return;}
  let vx=e.x-c.x,vy=e.y-c.y,l=Math.hypot(vx,vy);
  if(l<2){vx=-c.dir.y;vy=c.dir.x;if(Math.random()<.5){vx=-vx;vy=-vy;}l=1;}
  vx/=l;vy/=l;const j=rand(-0.4,0.4),cs=Math.cos(j),sn=Math.sin(j);
  e.dv={x:(vx*cs-vy*sn)*640,y:(vx*sn+vy*cs)*640};e.state='dodge';e.t=0.18;
}
function doReact(e,r){
  const s=r.s;
  if(s.done||!S.enemies.includes(e)||['stun','spawn','strike','recover','dodge','hide'].includes(e.state))return;
  const c=closestAhead(s,e);if(!c||c.d>e.r+s.hr+12)return;
  if(r.kind==='guard'){
    let g=c.along-(e.r+s.hr+18);const minG=s.d+s.speed*0.035+6;if(g<minG)g=minG;
    if(g>=c.along+4){if(CFG.aiDodge&&e.dodgeCd<=0&&e.T.dodge>0)doDodge(e,c);return;}
    const Q=posAt(s,g),t=tangentAt(s,g),sg=Math.random()<.5?1:-1,L=e.boss?56:42;
    S.eslashes.push(makeCut([inArena({x:Q.x+t.y*L*sg,y:Q.y-t.x*L*sg},2),inArena({x:Q.x-t.y*L*sg,y:Q.y+t.x*L*sg},2)],2600,{team:'e',owner:e,guard:true}));
    if(e.state==='wind'){e.cuts=[];e.shotsPlan=null;}
    e.state='guard';e.t=0.3;e.guardCd=isDuel(e)?0.3:e.boss?0.4:0.6;e.vx=e.vy=0;e.feintAt=null;S.guards++;readAi();if(isDuel(e)&&Math.random()<0.5)e.riposte=true;
  }else doDodge(e,c);
}
// duelists and bosses read the cut you are still tracing: hold it on them too long and they set a guard or step aside
function readStance(e,gdt,d){
  const sw=S.swipe;if(!sw||sw.pts.length<2||e.guardCd>0||e.react||e.T.guard<=0||d>maxLen()+80)return;
  const A=sw.pts[0],B=sw.pts[sw.pts.length-1],l=dist(A,B);if(l<24)return;
  const ext={x:A.x+(B.x-A.x)/l*Math.max(l,maxLen()),y:A.y+(B.y-A.y)/l*Math.max(l,maxLen())};if(segDist(e,A,ext)>e.r+46)return;
  const held=(performance.now()-sw.t0)/1000;if(held<0.12)return;
  if(Math.random()>gdt*(isDuel(e)?3.2:1.6)*(e.enraged?1.4:1)*(e.T.stance||1))return;
  if(e.T.dodge>e.T.guard*1.2&&CFG.aiDodge&&e.dodgeCd<=0){const c={x:e.x-(B.x-A.x)/l*10,y:e.y-(B.y-A.y)/l*10,dir:{x:(B.x-A.x)/l,y:(B.y-A.y)/l}};doDodge(e,c);text(e.x,e.y-52,'READ',C.curse);return;}
  const ux=(P.x-e.x)/(d||1),uy=(P.y-e.y)/(d||1),cx=e.x+ux*(e.r+20),cy=e.y-8+uy*(e.r+20),L=e.boss?60:46;
  const g=makeCut([inArena({x:cx-uy*L,y:cy+ux*L},2),inArena({x:cx+uy*L,y:cy-ux*L},2)],2600,{team:'e',owner:e,guard:true,stance:true});
  S.eslashes.push(g);e.state='guard';e.t=0.45;e.guardCd=isDuel(e)?0.9:1.3;e.vx=e.vy=0;S.guards++;readAi();text(e.x,e.y-52,'STANCE',C.curse);if(onScreen(e))sfx('wind');
}
function popHide(e){if(e.state!=='hide')return;e.state='strafe';e.cd=0.35;plan(e);burst(e.x,e.y-14,18,'#cfc8b8',220,0.5,2);text(e.x,e.y-50,'POMF!',C.mon,true);sfx('pon');S.shake+=2;}
function damageEnemy(e,dmg){
  if(S.pro&&!e.proBoss)dmg=Math.max(dmg,e.hp);
  if(CFG.cheatOhko&&!e.T.dummy&&!e.proBoss)dmg=Math.max(dmg,e.hp);
  e.hp-=dmg;e.flash=1;
  if(S.mods.exec&&!e.boss&&e.hp>0&&e.hp<=2){e.hp=0;text(e.x,e.y-44,'EXECUTED',C.hi);}
  if(e.boss&&!e.enraged&&e.hp>0&&e.hp<=e.max/2){e.enraged=true;text(e.x,e.y-60,'ENRAGED',C.hi,true);S.shake+=8;sfx('enrage');e.armorT=1.2;if(e.T.enr&&e.T.enr.length){e.nextPat=e.T.enr[0];e.cd=Math.min(e.cd,0.6);}if(ENRAGE[e.key])S.bossLine={text:ENRAGE[e.key],t:2.8};}
  if(e.boss&&!e.desp&&e.hp>0&&e.hp<=e.max*0.25&&e.T.minions){e.desp=true;text(e.x,e.y-74,'DESPERATION',C.hi,true);sfx('gong');S.shake+=8;for(const k of e.T.minions){const a=Math.random()*Math.PI*2;spawnEnemy(k,{quick:true,pos:rayTo({x:e.x,y:e.y},a,150,30)});}}
}
function deflect(e,s){
  const t=cutDir(s,e);burst(e.x-t.x*10,e.y-14-t.y*10,16,C.steel,380,0.3,2.5);text(e.x,e.y-56,'DEFLECTED',C.steel);sfx('clang');hitPause(4,e,1);S.shake+=3;
  if(!s.child&&!s.fox){staggerPlayer(0.4);const a=Math.atan2(P.y-e.y,P.x-e.x);P.kx+=Math.cos(a)*200;P.ky+=Math.sin(a)*200;}
  e.riposte=true;
}
function sumoHit(e,s){
  if(s.fam){const n=e.famHits.get(s.fam)||0;if(n>=1)return;e.famHits.set(s.fam,n+1);}
  const t=cutDir(s,e),f=(s.ult?950:s.isTap?560:480);e.kx=t.x*f;e.ky=t.y*f;e.flash=1;
  if(e.state==='wind'||e.state==='strafe'){e.state='stun';e.t=0.35;e.cuts=[];}
  hitPause(5,e,1);S.shake+=3;sfx('pon');burst(e.x,e.y-10,10,'#cfe8f0',220,0.4,2);text(e.x,e.y-44,pick(['OOF','HNNG','DOSU!','NOKOTTA!']),C.bone);
}
function hitEnemy(e,s){
  if(!S.enemies.includes(e)||e.smoke||e.air)return;
  if(S.pro&&proHit(e,s))return;
  if(e.T.sumo){sumoHit(e,s);return;}
  if(e.boss&&e.ifr>S.gt&&!s.ult)return;
  if(s.fam){const n=e.famHits.get(s.fam)||0;if(n>=(s.famCap||(s.ult?3:2)))return;e.famHits.set(s.fam,n+1);if(e.famHits.size>24)e.famHits=new Map([[s.fam,n+1]]);}
  if(e.state==='hide')popHide(e);
  if(e.cstance>0&&!s.ult){e.cstance=0;e.busyT=0;deflect(e,s);text(e.x,e.y-64,'COUNTERED',C.hi,true);S.pending.push({t:0.04,fn:()=>{if(S.enemies.includes(e)&&!e.air){e.state='strafe';e.cuts=[];startWind(e,'iai',0.3);}}});return;}
  if(e.state==='wind'&&e.pat==='glyph'&&!s.ult){wardHit(e,s);return;}
  if(shieldBlocks(e,s)){shieldClang(e,s);return;}
  if((e.boss||isDuel(e))&&e.armorT>0&&!s.ult&&!s.pierceArmor){deflect(e,s);return;}
  if(e.boss)e.ifr=S.gt+0.1;
  damageEnemy(e,elemDmg(e,s,(s.ult?CFG.ultDmg:1)+(s.child||s.fox?0:S.mods.dmg)+(s.dmgBonus||0)+(S.gmx&&S.gmx.berserk&&!s.child?(S.combo>=25?2:S.combo>=10?1:0):0)));
  const t=cutDir(s,e),f=(s.ult?380:260)*(e.T.heavy?0.25:1);e.kx=t.x*f;e.ky=t.y*f;
  if(s.fling&&!e.boss&&!e.T.heavy){const d=dist(e,P)||1;e.kx=(e.x-P.x)/d*s.fling;e.ky=(e.y-P.y)/d*s.fling;}
  if(s.knockSide&&!e.boss&&!e.T.heavy){const n={x:-t.y,y:t.x},side=(e.x-P.x)*n.x+(e.y-P.y)*n.y>0?1:-1;e.kx=n.x*side*560+t.x*200;e.ky=n.y*side*560+t.y*200;}
  if(s.tool&&capOn('tools','poison'))e.bleedT=1.5;
  if(s.thrown&&e.hp>0&&!e.boss)S.pending.push({t:0,fn:()=>{if(S.enemies.includes(e))stunEnemy(e,0.7);}});
  if(s.wid&&!s.child)wear(1,s);if(P.wpn&&P.wpn.perk==='leech'&&s.wid===P.wpn.uid)addMeter(2);
  hitPause((s.ult?11:7)+(e.T.heavy?2:0)+(s.dmgBonus?3:0),e,s.ult||s.dmgBonus?2:1);S.shake+=s.ult?5:3;S.kick.x+=t.x*7;S.kick.y+=t.y*7;
  spray(e.x,e.y-14,s.ult?18:11,t.x,t.y);
  S.marks.push({x:e.x,y:e.y-16,c:t.x,s:t.y,life:0.12,ult:!!s.ult||!!s.dmgBonus});
  sfx('hit');addCombo(1);if(S.stats)S.stats.hits++;
  if(!s.ult&&!e.illusion)spawnOrbs(e.x,e.y-14,2,CFG.hitGain);
  if(S.mods.bleed&&e.hp>0)e.bleedT=1.5;
  if(s.bleed&&e.hp>0){e.bleedT=1.5;e.bleedPlus=up('kama','bleed');}
  if(s.reapFeed&&!s.child){addMeter(s.reapFeed===2?16:8);if(btFor('kama')){S.reapN=(S.reapN||0)+1;if(S.reapN>=3){S.reapN=0;heal(1);}}}
  if(s.ab.chain&&!s.isChain&&(s.ult||abReady('chain'))){if(!s.ult)abUse('chain');const others=S.enemies.filter(o=>o!==e&&o.state!=='spawn'&&!o.smoke&&!o.T.sumo&&dist(o,e)<180).sort((a,b)=>dist(a,e)-dist(b,e)).slice(0,2);
    for(const o of others){S.bolts.push({a:{x:e.x,y:e.y-14},b:{x:o.x,y:o.y-14},life:0.18});damageEnemy(o,1);o.flash=1;spray(o.x,o.y-14,5,0,-1);if(o.hp<=0)kill(o,null);}if(others.length)sfx('zap');}
  if(s.tags&&!s.child){s.done=true;s.fade=s.fadeMax=0.1;const at={x:e.x,y:e.y-10};S.pending.push({t:0,fn:()=>burstAt(at,{team:'p',ab:{},hits:new Set(),fam:++FAM,dmgBonus:0},55)});}
  elemTryProc(e,s);
  if(e.hp<=0){kill(e,s);return;}
  if(s.hook){s.hookN=(s.hookN||0)+1;if(s.hookN>=(s.hookMax||1)){s.done=true;s.fade=s.fadeMax=0.2;}startHook(e,s);return;}
  if(s.grapple&&!s.grappled){s.grappled=true;s.done=true;s.fade=s.fadeMax=0.2;grappleZip({x:e.x,y:e.y},e);return;}
  if(s.stunT&&!(e.boss&&e.armorT>0)){stunEnemy(e,e.boss?s.stunT*0.4:s.stunT);return;}
  e.hitLog=(e.hitLog||[]).filter(t=>S.gt-t<1);e.hitLog.push(S.gt);
  const poiseN=e.boss||isDuel(e)?CFG.poiseHits:Math.max(1,CFG.poiseHits-(e.T.heavy?1:0));
  if(CFG.poise&&!s.noPoise&&e.armorT<=0&&e.hitLog.length>=poiseN){
    e.armorT=e.boss||isDuel(e)?1.5:1.2;e.hitLog=[];e.kx=e.ky=0;text(e.x,e.y-56,'BREAKS FREE',C.hi);sfx('gbreak');S.shake+=4;
    if(CFG.enemyAttack&&!['strike','spawn','dodge','hide'].includes(e.state)){e.state='strafe';e.react=null;e.riposte=true;startWind(e,null,1);}
    return;
  }
  if(e.armorT>0){e.kx*=0.2;e.ky*=0.2;return;}
  if(s.ab.stun&&!(e.stunImm>S.gt)){stunEnemy(e,e.T.heavy?0.4:0.8);e.stunImm=S.gt+1.6;}
  else if(e.state==='eat'||(!e.T.heavy&&(e.state==='wind'||e.state==='guard')))stunEnemy(e,0.3);
}
function kill(e,s,quiet){
  S.enemies=S.enemies.filter(x=>x!==e);if(e.markT>0)elemOnKill(e);
  if(!e.illusion&&!quiet)try{featEvent('kill',e);}catch(_){}
  if(e.spar){S.tutSafe=false;S.pending.push({t:0.6,fn:()=>{S.banner={name:'WELL STRUCK',title:'The duelist bows and leaves',t:2};}});}
  if(S.gmx&&S.gmx.vampire&&!e.illusion&&!e.practice){S.vampN=(S.vampN||0)+1;if(S.vampN>=4){S.vampN=0;heal(1);}}
  for(const c of e.cuts||[])if(!c.done){c.done=true;c.fade=c.fadeMax=0.15;}
  if(e.illusion){burst(e.x,e.y-14,20,C.fox,240,0.5,2);text(e.x,e.y-40,'POOF',C.fox);sfx('blink');return;}
  if(e.T.kamikaze){burst(e.x,e.y-14,26,C.water,300,0.6,3);S.rings.push({x:e.x,y:e.y-14,r:50,life:0.3,col:C.water});if(!quiet){sfx('kill');addCombo(1);}S.kills++;if(S.stats)S.stats.kills++;dropLoot(e);onEnemyGone(e);return;}
  const corpse=CFG.corpses?bisect(e,s):null;
  hitPause(e.boss?28:(s&&s.ult?16:13),corpse,e.boss?3:2);
  S.room.pools.push({x:e.x,y:e.y,r:e.boss?70:30});if(S.room.pools.length>30)S.room.pools.shift();
  if(!e.boss&&S.remains)S.remains.push({x:e.x,y:e.y,t:12});
  sfx('kill');
  if(s&&s.team==='p'){s.kc=(s.kc||0)+1;if(s.kc>=2)text(e.x,e.y-70,s.kc===2?'DOUBLE CUT':s.kc===3?'TRIPLE CUT':'MASSACRE',C.curse,true);}
  const big=e.boss?3:e.T.heavy?2:1;
  for(let i=0;i<7*big;i++)stamp(e.x+rand(-14,14)*big,e.y+rand(-10,10)*big,rand(3,11),rand(.35,.7));
  burst(e.x,e.y-14,22*big,C.blood,380,0.6,3.5,true);burst(e.x,e.y-14,10,C.ash,160,0.6,2.5);
  spawnOrbs(e.x,e.y-14,9,CFG.killGain*(e.boss?2:1));
  S.kills++;if(S.stats)S.stats.kills++;
  if(btOn()&&!S.bt.strike&&capOn('orb','frenzy')){S.bt.t+=1;S.bt.max=Math.max(S.bt.max,S.bt.t);text(P.x,P.y-58,'FRENZY +1s',C.hi);}
  if(s&&s.ab&&s.ab.drain&&P.hp<P.max){P.hp++;text(P.x,P.y-44,'+1 SOUL',C.hi);}
  else if(S.mods.drainChance>0&&P.hp<P.max&&Math.random()<S.mods.drainChance){P.hp++;text(P.x,P.y-44,'+1 SOUL',C.hi);sfx('heal');}
  dropLoot(e);enemyDrop(e);restockTools(0.2+0.15*up('tools','trefill')+(e.key==='shinobi'?0.6:0));
  if(e.boss){S.boss=null;S.flash=0.2;sfx('gong');if(S.stats)S.stats.bosses++;S.slowT=Math.max(S.slowT,0.8);S.shake+=12;text(e.x,e.y-70,'DEFEATED',C.hi,true);
    for(const o of [...S.enemies])if(o.illusion||o.key==='gaki'||o.summoned){o.hp=0;kill(o,null,true);}onBossDefeated(e);}
  onEnemyGone(e);
}
function shovePlayer(s){
  if(tryCounter(s))return;
  s.hitP=true;const o=s.owner||P,a=Math.atan2(P.y-o.y,P.x-o.x);P.kx=Math.cos(a)*820;P.ky=Math.sin(a)*820;S.slide=null;P.dashT=0;
  S.shake+=6;hitPause(6,P,1);sfx('mochi');burst(P.x,P.y-14,10,'#cfe8f0',200,0.4,2);text(P.x,P.y-50,'SHOVED',C.bone);
}
function hurtPlayer(s,noCounter){
  if(S.tutSafe){s.hitP=true;P.inv=0.5;text(P.x,P.y-50,S.pro?'GRAZED':'TOO SLOW · AGAIN',C.ash);sfx('block');return;}
  if(s.grab&&!noCounter){grabbed(s);return;}
  if(!noCounter&&tryCounter(s))return;
  if(S.duel&&S.duel.D.ippon&&S.enemies.some(isDuel)){s.hitP=true;duelLost(s);return;}
  if(P.shield>0){P.shield=0;s.hitP=true;P.inv=0.6;text(P.x,P.y-50,'CAUGHT BY KARAKASA',C.steel);sfx('shield');burst(P.x,P.y-14,16,C.steel,260,0.4,2);hitPause(6,null);return;}
  s.hitP=true;P.hp--;if(S.lordHurt!=null)S.lordHurt++;P.inv=0.9+S.mods.hurtInv;S.hurt=1;S.shake+=8;buzz(P.hp<=0?220:70);hitPause(P.hp<=1?14:9,P,2);S.slide=null;
  if(S.drink){S.drink=null;text(P.x,P.y-36,'SPILLED',C.blood);}
  if(S.follower&&!S.follower.leaving){S.follower.leaving=0.8;text(P.x,P.y-74,'THE CHILD RUNS OFF',C.ash);sfx('giggle');}
  const o=s.owner||P,a=Math.atan2(P.y-o.y,P.x-o.x),kb=s.pull?-460:(s.push||320);P.kx=Math.cos(a)*kb;P.ky=Math.sin(a)*kb;S.kick.x+=Math.cos(a)*12;S.kick.y+=Math.sin(a)*12;
  burst(P.x,P.y-14,14,C.hi,240,0.5,3);sfx('hurt');
  if(S.combo>=5)text(P.x,P.y-60,'COMBO LOST',C.ash);S.combo=0;S.comboT=0;
  if(S.stats)S.stats.hurt++;
  if(P.hp<=0){
    if(capOn('body','unbroken')&&!S.unbrokenUsed){S.unbrokenUsed=true;P.hp=1;P.inv=1.6;text(P.x,P.y-60,'UNBROKEN',C.hi,true);sfx('learn');S.flash=0.15;S.slowT=Math.max(S.slowT,0.8);return;}
    if(S.mods.daruma&&!S.darumaUsed){S.darumaUsed=true;P.hp=1;P.inv=1.6;text(P.x,P.y-60,'THE DARUMA RISES',C.hi,true);sfx('pickup');S.flash=0.15;return;}
    if(false){S.favorUsed=true;P.hp=2;P.inv=2;text(P.x,P.y-60,'KITSUNE\'S FAVOR',C.fox,true);sfx('pickup');S.flash=0.15;burst(P.x,P.y-14,30,C.fox,300,0.8,3);return;}
    S.dead=1.8;S.swipe=null;S.slide=null;S.bt=null;S.trace=null;S.held=null;S.glyph=null;S.force=null;S.dark=null;S.traceArm=0;S.counter=null;S.auras=[];S.hooks=[];S.leap=null;P.z=0;S.orbs=[];burst(P.x,P.y-14,40,C.hi,300,1.2,3);sfx('death');S.slowT=1.2;
    if(S.stats)S.stats.killer=s.owner&&s.owner.T?(s.owner.T.name||s.owner.T.title):(s.hazName||'');
  }
}
function updateEnemy(e,gdt){
  const T=e.T;
  e.flash=Math.max(0,e.flash-gdt*6);e.t-=gdt;e.cd=Math.max(0,e.cd-gdt);e.anim+=gdt;
  e.dodgeCd=Math.max(0,e.dodgeCd-gdt);e.guardCd=Math.max(0,e.guardCd-gdt);e.planT-=gdt;if(e.blinkT>0)e.blinkT-=gdt;if(e.armorT>0)e.armorT-=gdt;
  if(e.bleedT>0){e.bleedT-=gdt;if(e.bleedT<=0){damageEnemy(e,1+(e.bleedPlus||0));e.bleedPlus=0;burst(e.x,e.y-14,8,C.blood,160,0.4,2.5,true);text(e.x,e.y-40,'BLEED',C.blood);if(e.hp<=0){kill(e,null);return;}}}
  if(e.elemFx&&elemTick(e,gdt))return;
  e.x+=e.kx*gdt;e.y+=e.ky*gdt;const kd=Math.max(0,1-gdt*7);e.kx*=kd;e.ky*=kd;
  const d=dist(P,e)||1,ux=(P.x-e.x)/d,uy=(P.y-e.y)/d;
  if(Math.abs(P.x-e.x)>4&&e.state!=='strike'&&e.state!=='dodge'&&e.state!=='hide')e.face=P.x>e.x?1:-1;
  if(e.react){e.react.t-=gdt;if(e.react.t<=0){const r=e.react;e.react=null;doReact(e,r);}}
  const spd=CFG.enemySpeed*T.spd*(e.enraged?1.2:1)*(1+0.04*(fl()-1))*(e.slowT>0?0.5:1);
  if(T.smoke&&e.state!=='spawn'){
    e.smokeT-=gdt;
    if(e.smoke){if(e.smokeT<=0||d<80){e.smoke=false;e.smokeT=rand(2.6,3.6);burst(e.x,e.y-14,20,C.smoke,200,0.6,3);if(CFG.enemyAttack&&e.state==='strafe'){e.cd=0;startWind(e,'smoke',0.7);}}}
    else if(e.state==='strafe'&&e.smokeT<=0){e.smoke=true;e.smokeT=rand(1.3,1.9);burst(e.x,e.y-14,16,C.smoke,160,0.5,3);text(e.x,e.y-44,'SMOKE',C.smoke);}
    if(e.smoke&&Math.random()<gdt*20)S.parts.push({x:e.x+rand(-10,10),y:e.y-rand(0,24),vx:rand(-20,20),vy:rand(-40,-10),life:0.6,max:0.6,size:2,col:Math.random()<0.5?C.smoke:'#5a5262'});
  }
  switch(e.state){
    case'spawn':if(e.t<=0){land(e);if(e.wantHide){e.state='hide';e.wantHide=false;}else{e.state='strafe';plan(e);}}break;
    case'hide':if(d<150)popHide(e);break;
    case'strafe':{
      if(e.planT<=0){plan(e);if(T.blink&&CFG.enemyMove&&Math.random()<0.6){const a=Math.random()*Math.PI*2;blinkTo(e,{x:P.x+Math.cos(a)*e.pref,y:P.y+Math.sin(a)*e.pref});}}
      let vx=0,vy=0;
      if(CFG.enemyMove&&!T.blink){
        if(T.kamikaze||e.smoke){vx=ux*spd*(e.smoke?1.6:1);vy=uy*spd*(e.smoke?1.6:1);}
        else{let radial=clamp((d-e.pref)/40,-1,1);if(T.flee&&d<T.pref[0])radial=-1.4;const tang=e.orbit*e.pace;vx=(ux*radial-uy*tang)*spd;vy=(uy*radial+ux*tang)*spd;
          if(e.step){e.step.t-=gdt;vx+=e.step.x*560;vy+=e.step.y*560;if(e.step.t<=0)e.step=null;}}
        {const v2=foeSteer(e,{x:vx,y:vy},d,ux,uy,spd);vx=v2.x;vy=v2.y;if(e.state==='eat')break;}
        if(T.hop){const ph=(e.hopT+=gdt*1.8)%1;if(ph>0.62){vx=0;vy=0;}else{vx*=1.7;vy*=1.7;}if(ph>0.62&&e.lastPh<=0.62)burst(e.x,e.y+4,4,'#6a5a60',60,0.3,1);e.lastPh=ph;}
      }
      const k=Math.min(1,gdt*6);e.vx+=(vx-e.vx)*k;e.vy+=(vy-e.vy)*k;
      e.x+=e.vx*gdt;e.y+=e.vy*gdt;footprints(e,gdt);
      if((isDuel(e)||e.boss)&&CFG.aiParry)readStance(e,gdt,d);
      if(isDuel(e)&&S.cdCut>0.2&&S.cdTap>0.12&&e.cd>0.2&&Math.random()<gdt*2.5)e.cd=0.12;
      if(CFG.enemyAttack&&e.cd<=0&&d<T.range&&!e.smoke&&aiMayAttack(e,d))startWind(e,aiPickPat(e,d),1);
      break;}
    case'wind':
      e.vx*=0.85;e.vy*=0.85;
      if(!CFG.enemyAttack){e.state='strafe';e.cuts=[];e.shotsPlan=null;break;}
      for(const c of e.cuts)if(c.track&&e.t>0.3){const cy=e.y-14,a=Math.atan2(P.y-12-cy,P.x-e.x),L=760,cp=clipPts([rayTo({x:e.x,y:cy},a,e.r,2),rayTo({x:e.x,y:cy},a,L,2)],['wall','crate'],2);c.pts=cp.pts.length>1?cp.pts:[cp.pts[0],{x:cp.pts[0].x+1,y:cp.pts[0].y}];c.clipAt=cp.hit;c.cum=[0];for(let i=1;i<c.pts.length;i++)c.cum.push(c.cum[i-1]+dist(c.pts[i-1],c.pts[i]));c.len=c.cum[c.cum.length-1];}
      if(e.shotsPlan&&e.t>0.25){const cy=e.y-14,pq=predictP(d/480),a=Math.atan2(pq.y-12-cy,pq.x-e.x);for(const s of e.shotsPlan)if(!s.orbit)s.a=a+(s.off??(s.off=s.a-a));}
      if(e.feintAt!==null&&e.t<=e.feintAt){e.state='strafe';e.cuts=[];e.shotsPlan=null;e.feintAt=null;e.cd=rand(0.1,0.35);e.step={x:-ux,y:-uy,t:0.12};break;}
      if(e.t<=0)launchStrike(e);
      break;
    case'strike':{
      const alive=e.cuts.filter(c=>!c.done&&(S.eslashes.includes(c)||c.delay));
      if(!alive.length&&!(e.busyT>0)){
        const blocked=e.cuts.some(c=>c.blocked);
        if(e.combo>0&&!blocked){const rem=e.combo-1,cp=e.comboPat||'cross';startWind(e,cp==='flurry'?'flurry':cp,cp==='smash'?0.5:0.3);e.combo=rem;e.comboPat=cp;}
        else{e.state='recover';e.t=CFG.recover*(T.recover||1)*(e.enraged?0.7:1);e.cuts=[];e.shotsPlan=null;e.combo=0;}
      }
      break;}
    case'recover':e.vx*=0.9;e.vy*=0.9;if(e.t<=0){e.state='strafe';e.cd=e.riposte?0.05:CFG.eCooldown*T.cd*rand(0.6,1.4)*(e.enraged?0.6:1)*Math.max(0.7,1-0.06*(fl()-1));plan(e);}break;
    case'stun':if(e.t<=0){e.state='strafe';e.cd=Math.min(0.4,CFG.eCooldown);plan(e);}break;
    case'dodge':e.x+=e.dv.x*gdt;e.y+=e.dv.y*gdt;S.ghosts.push({x:e.x,y:e.y,look:e.look,face:e.face,life:0.18});if(e.t<=0){e.state='strafe';e.cd=Math.min(e.cd,0.25+Math.random()*0.3);plan(e);}break;
    case'guard':if(e.t<=0){e.state='strafe';if(e.riposte)e.cd=0;plan(e);}break;
    case'eat':eatTick(e,gdt);break;
  }
  if(e.state==='strafe'||e.state==='wind'||e.state==='guard')scanThreats(e);
  if(e.poseT>0)e.poseT-=gdt;
}

// ---------- foe projectiles: foxfire, webs, water, ice. Your trails and tips cut them down ----------
function shotCut(s){burst(s.x,s.y,10,shotCol(s.kind),220,0.35,2);sfx('shotcut');}
function updateShots(gdt){
  const R=S.room;
  for(const s of S.shots){
    s.t+=gdt;s.life-=gdt;
    if(s.spin){const c=Math.cos(s.spin*gdt),sn=Math.sin(s.spin*gdt),vx=s.vx*c-s.vy*sn;s.vy=s.vx*sn+s.vy*c;s.vx=vx;}
    if(s.accel&&s.t>(s.accelT||0)&&Math.hypot(s.vx,s.vy)<720){const k=1+s.accel*gdt;s.vx*=k;s.vy*=k;}
    if(s.stopT&&s.t>=s.stopT&&!s.stopped){s.stopped=true;s.vx=s.vy=0;}
    if(s.goT&&s.t>=s.goT&&!s.flying){s.flying=true;const a=Math.atan2(P.y-12-s.y,P.x-s.x);s.vx=Math.cos(a)*s.goSp;s.vy=Math.sin(a)*s.goSp;}
    if(s.home>0&&s.t<s.homeT){const dx=P.x-s.x,dy=(P.y-12)-s.y,d=Math.hypot(dx,dy)||1,k=Math.min(1,gdt*s.home);s.vx+=(dx/d*s.spd-s.vx)*k;s.vy+=(dy/d*s.spd-s.vy)*k;}
    s.x+=s.vx*gdt;s.y+=s.vy*gdt;
    if(s.x<WALL||s.x>R.w-WALL||s.y<WALL-14||s.y>R.h-WALL){s.dead=true;burst(s.x,s.y,5,C.ash,100,0.3,1);continue;}
    {let wh=null;for(const o of R.obs||[])if(!o.dead&&o.type!=='hole'&&rectHit(o,s.x,s.y+12,s.r*0.5)){wh=o;break;}if(wh){s.dead=true;burst(s.x,s.y,8,C.ash,120,0.3,1);if(wh.type==='crate')hitCrate(wh);continue;}}
    let cut=false;
    for(const c of S.slashes){if(c.d<1)continue;if(c.done&&c.linger<=0&&c.fade<c.fadeMax*0.4)continue;
      if(forTrail(c,(a,b)=>segDist(s,a,b)<s.r+4)){cut=true;break;}}
    if(cut){s.dead=true;shotCut(s);spawnOrbs(s.x,s.y,1,1);addCombo(1);continue;}
    if(P.inv<=0&&!CFG.god&&S.dead<=0&&Math.hypot(P.x-s.x,(P.y-12)-s.y)<P.r+s.r){s.dead=true;
      if(tryCounter({owner:s.owner,hitP:false,shot:s}))continue;
      if(s.kind==='web'){P.slowT=1.8;text(P.x,P.y-50,'WEBBED',C.web);sfx('web');burst(P.x,P.y-14,10,C.web,120,0.5,1);}
      else if(s.kind==='ink'){S.inkLock=Math.max(S.inkLock||0,3);S.trace=null;text(P.x,P.y-52,'BRUSH BLOTTED',C.phase);sfx('splash');burst(P.x,P.y-14,12,'#2a1a34',160,0.5,2);}
      else{const hp0=P.hp;hurtPlayer({owner:s.owner,hitP:false,shot:s});if(P.hp<hp0&&s.kind==='frost'){P.slowT=Math.max(P.slowT,1.6);text(P.x,P.y-62,'FROSTBITE',C.ice);}}continue;}
    if(s.life<=0)s.dead=true;
  }
  S.shots=S.shots.filter(s=>!s.dead);
}

// ---------- feel: combos, hit pause, spray, corpses, footprints ----------
const RANKS=[[60,'ASURA','#b48cff'],[40,'DEMON','#ff4a5c'],[25,'BLOODSTORM','#e0283e'],[12,'RUTHLESS','#d9a648'],[5,'SHARP','#93dcca']];
function comboRank(n){for(const r of RANKS)if(n>=r[0])return{name:r[1],col:r[2]};return null;}
function addCombo(n){
  const before=comboRank(S.combo);S.combo+=n;S.comboT=3;S.comboPop=1;
  if(S.stats)S.stats.bestCombo=Math.max(S.stats.bestCombo,S.combo);
  if(S.combo>=25&&S.combo%5<n)featEvent('combo',S.combo);
  const after=comboRank(S.combo);if(after&&(!before||after.name!==before.name)){text(P.x,P.y-66,after.name,after.col,true);sfx('combo',S.combo);}
}
function onScreen(p){return p.x>S.X0-60&&p.x<S.X0+VW+60&&p.y>S.Y0-60&&p.y<S.Y0+VH+60;}
function spray(x,y,n,dx,dy){const a0=Math.atan2(dy,dx);for(let i=0;i<n;i++){const a=a0+rand(-0.7,0.7)+(Math.random()<0.25?Math.PI:0),v=rand(120,420);S.parts.push({x,y,vx:Math.cos(a)*v,vy:Math.sin(a)*v,life:rand(0.25,0.55),max:0.55,size:Math.random()<0.3?2:1,col:Math.random()<0.25?C.hi:C.blood,stamp:true});}}
function land(e){burst(e.x,e.y+e.r*0.5,e.boss?24:10,'#6a5a60',e.boss?260:140,0.45,2);if(onScreen(e))sfx('land');if(e.boss){S.shake+=10;S.rings.push({x:e.x,y:e.y,r:120,life:0.35});}else S.shake+=1.5;}
function footprints(e,gdt){
  if(e.T.blink||e.T.kamikaze||e.T.fly||e.look==='yurei'||Math.hypot(e.vx,e.vy)<40)return;
  e.stepT=(e.stepT||0)-gdt;if(e.stepT>0)return;e.stepT=0.22;e.alt=!e.alt;
  for(const p of S.room.pools)if(Math.hypot(p.x-e.x,p.y-e.y)<p.r){e.bloody=7;break;}
  if(e.bloody>0){e.bloody--;const fx=Math.round(e.x/PX)+(e.alt?1:-1),fy=Math.round((e.y+e.r*0.6)/PX),d=D();d.fillStyle=e.bloody>3?'#5e0a16':'#3e0810';d.fillRect(fx,fy,1,1);if(e.T.heavy)d.fillRect(fx+(e.alt?1:-1),fy,1,1);}
}
function bisect(e,s){
  const sp=SPR[e.look];if(!sp)return null;const img=(e.face>0?sp.r:sp.l)[0],w=img.width,h=img.height;
  let tx,ty;if(s&&s.pts){const t=tangentAt(s,s.d);tx=t.x;ty=t.y;}else{const a=rand(0,Math.PI);tx=Math.cos(a);ty=Math.sin(a);}
  const nx=-ty,ny=tx,cx=w/2,cy=h*0.55,B=w+h;
  const half=sg=>{const c=mk(w,h),g=c.getContext('2d');g.save();g.beginPath();
    g.moveTo(cx-tx*B,cy-ty*B);g.lineTo(cx+tx*B,cy+ty*B);g.lineTo(cx+tx*B+nx*B*sg,cy+ty*B+ny*B*sg);g.lineTo(cx-tx*B+nx*B*sg,cy-ty*B+ny*B*sg);g.closePath();g.clip();
    g.drawImage(img,0,0);g.globalCompositeOperation='source-atop';g.strokeStyle='#e0283e';g.lineWidth=2.2;g.beginPath();g.moveTo(cx-tx*B,cy-ty*B);g.lineTo(cx+tx*B,cy+ty*B);g.stroke();g.restore();return c;};
  const A=half(1),Bh=half(-1);
  if(S.corpses.length>=14)S.corpses[0].t=99;
  const ax=e.face>0?sp.ax:sp.w-1-sp.ax;
  const c={A,B:Bh,dA:tinted(A,'#2a0910'),dB:tinted(Bh,'#2a0910'),wA:tinted(A,'#ffffff'),wB:tinted(Bh,'#ffffff'),x:e.x,y:e.y+e.r*0.6,ax,ay:sp.ay,depth:e.y-2,w,h,nx,ny,t:0,boss:e.boss};
  S.corpses.push(c);return c;
}
function hitPause(frames,victim,amp){if(!CFG.hitPause)return;S.hitstop=Math.max(S.hitstop,frames/60*CFG.hitPauseMul);if(victim)S.pauseVictims.set(victim,Math.max(S.pauseVictims.get(victim)||0,amp||1));}
function pauseJitter(o){if(S.hitstop<=0||!CFG.hitShake)return 0;const a=S.pauseVictims.get(o);if(!a)return 0;return(S.frameN&1?1:-1)*Math.max(1,Math.round(a*CFG.hitShake))*(S.hitstop<0.04?0.5:1);}
function corpseOff(c,u){const d=u*(c.boss?8:5),dr=Math.round(u*3),ax=Math.round(c.nx*d),ay=Math.round(c.ny*d*0.3);return[ax,ay+(c.ny<0?dr:0),-ax,-ay+(c.ny>=0?dr:0)];}
function updateCorpses(gdt){
  for(const c of S.corpses){
    c.t+=gdt;
    if(c.t<0.6&&Math.random()<0.7)S.parts.push({x:c.x+rand(-8,8)*(c.boss?2:1),y:c.y-c.h*PX*0.45+rand(-4,4),vx:rand(-50,50),vy:rand(-70,10),life:0.35,max:0.35,size:1,col:C.blood,stamp:true});
    if(c.t>3.2){const o=corpseOff(c,1),X=Math.round(c.x/PX-c.ax),Y=Math.round(c.y/PX-c.ay),d=D();d.globalAlpha=0.7;d.drawImage(c.dA,X+o[0],Y+o[1]);d.drawImage(c.dB,X+o[2],Y+o[3]);d.globalAlpha=1;c.gone=true;}
  }
  if(S.corpses.some(c=>c.gone))S.corpses=S.corpses.filter(c=>!c.gone);
}

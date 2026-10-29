// ================= techniques: hold right-click, trace a shape while time slows, release =================
// ---------- reading a traced shape ----------
const wrapA=a=>{while(a>Math.PI)a-=2*Math.PI;while(a<-Math.PI)a+=2*Math.PI;return a;};
function shapeStats(raw){
  if(!raw||raw.length<3)return null;const r0=resample(raw,6);if(r0.length<4)return null;const pts=r0.map((p,i)=>i===0||i===r0.length-1?p:{x:(r0[i-1].x+p.x*2+r0[i+1].x)/4,y:(r0[i-1].y+p.y*2+r0[i+1].y)/4});const L=polyLen(pts);if(L<70)return null;
  let x0=1e9,y0=1e9,x1=-1e9,y1=-1e9;for(const p of pts){x0=Math.min(x0,p.x);y0=Math.min(y0,p.y);x1=Math.max(x1,p.x);y1=Math.max(y1,p.y);}
  const size=Math.max(30,x1-x0,y1-y0),hd=[];for(let i=1;i<pts.length;i++)hd.push(Math.atan2(pts[i].y-pts[i-1].y,pts[i].x-pts[i-1].x));
  let total=0;for(let i=1;i<hd.length;i++)total+=wrapA(hd[i]-hd[i-1]);
  const w=2,mean=(a,b)=>{let sx=0,sy=0;for(let j=a;j<b;j++){sx+=Math.cos(hd[j]);sy+=Math.sin(hd[j]);}return Math.atan2(sy,sx);};
  const cand=[];for(let i=w;i<=hd.length-w;i++){const d=wrapA(mean(i,i+w)-mean(i-w,i));if(Math.abs(d)>0.9)cand.push({i,d});}
  const corners=[];for(const c of cand){const m=corners[corners.length-1];if(m&&c.i-m.i<=w+1){if(Math.abs(c.d)>Math.abs(m.d)){m.i=c.i;m.d=c.d;}}else corners.push({...c});}
  // a corner right at the very ends is just a hook from lifting the pen
  const cs=corners.filter(c=>c.i>1&&c.i<hd.length-1);
  return{pts,L,size,total,corners:cs,endR:dist(pts[0],pts[pts.length-1])/size};
}
function readShape(raw){
  const st=shapeStats(raw);if(!st)return null;const T=Math.abs(st.total),cs=st.corners,sharp=cs.filter(c=>Math.abs(c.d)>1.3),same=a=>a.every(c=>Math.sign(c.d)===Math.sign(a[0].d));
  if(T>9.4&&sharp.length<=2)return'spiral';
  if(sharp.length>=2&&sharp.length<=3&&same(sharp)&&T>3.0&&T<7.4&&cs.length<=4)return'tri';
  if(T>4.8&&sharp.length<=1)return'loop';
  if(cs.length===0){if(T<1.1)return'line';if(T>=1.4&&T<=4.8)return'arc';return null;}
  if(cs.length===1){const d=Math.abs(cs[0].d),P0=st.pts,k=Math.min(P0.length-1,cs[0].i),A=P0[0],M=P0[k],E=P0[P0.length-1],l1x=M.x-A.x,l1y=M.y-A.y,l2x=E.x-M.x,l2y=E.y-M.y,
      la=Math.acos(clamp((l1x*l2x+l1y*l2y)/((Math.hypot(l1x,l1y)*Math.hypot(l2x,l2y))||1),-1,1));
    if(la>2.76||(d>2.6&&st.endR<0.3))return'rev';if(d>0.85)return T>2.2&&d<1.6?'arc':'v';return null;}
  if(cs.length===2){if(Math.sign(cs[0].d)!==Math.sign(cs[1].d))return'z';return T>3.0?'tri':null;}
  let alt=1,best=1;for(let i=1;i<cs.length;i++){if(Math.sign(cs[i].d)!==Math.sign(cs[i-1].d)){alt++;best=Math.max(best,alt);}else alt=1;}
  if(best>=3)return'zz';
  return null;
}
// ---------- trace mode ----------
const traceSlowT=()=>capOn('brush','zen')?0.06:0.12;
const traceMaxT=()=>capOn('brush','zen')?3.3:2.2;
const KCOL={O:C.hi,D:C.steel,M:C.spirit,G:'#ff2040'};
function techCd(sk){if(CFG.noTechCd||S.inHub)return 0.05;return (S.gmx&&S.gmx.brush?0.35:1)*Math.max(3,sk.cd*Math.pow(0.92,up('brush','tcd'))-(sk.w==='reserve'?1.5*up('reserve','rskl'):up(sk.w,'skl')));}
function traceReady(quiet){
  if(!playing()||S.drink||S.leap||S.held)return false;const W=curW();
  if(S.inkLock>0){if(!quiet){text(P.x,P.y-52,'BRUSH BLOTTED',C.phase);sfx('deny');}return false;}
  if(S.glyph)return true; // a lord is painting: you may always answer, techniques or not
  if(!knownTech(techW()).length){if(!quiet){text(P.x,P.y-56,`NO TECHNIQUES FOR THE ${W.name.toUpperCase()} YET`,C.ash);text(P.x,P.y-44,'THE BLIND SMITH CAN TEACH THEM',C.curse);sfx('deny');}return false;}
  if(wBroken()){if(!quiet){text(P.x,P.y-50,'TOO BROKEN FOR TECHNIQUE · MEND IT',C.ash);sfx('deny');}return false;}
  if(S.traceCd>0){if(!quiet){text(P.x,P.y-50,`TRACE · ${S.traceCd.toFixed(1)}s`,C.ash);sfx('deny');}return false;}
  return true;
}
function beginTrace(id,p){
  if(!traceReady())return false;
  const now=performance.now();S.swipe=null;S.buffer=null;S.traceArm=0;S.trace={id,pts:[p],t0:now,lastMove:now,splits:[],ext:0};sfx('paper');return true;
}
function armTrace(){if(S.traceArm){S.traceArm=0;return;}if(S.trace||!traceReady())return;S.swipe=null;S.traceArm=performance.now()+3500;sfx('paper');text(P.x,P.y-56,'DRAW A SHAPE',C.bone);}
function addTracePt(p){const tr=S.trace;if(!tr)return;if(dist(p,tr.pts[tr.pts.length-1])>=3){tr.pts.push(p);tr.lastMove=performance.now();}}
// ink chains: hold the brush still for a breath and the stroke splits; every piece is read as its own shape
const maxLinks=()=>capOn('brush','third')?2:1;
function traceSegs(tr){const out=[];let a=0;for(const s of tr.splits||[]){out.push(tr.pts.slice(a,s+1));a=s;}out.push(tr.pts.slice(a));return out;}
function segTech(pts){const sh=pts.length>=3?readShape(pts):null;return{shape:sh,sk:sh?knownTech(techW()).find(s=>s.shape===sh):null};}
const traceFailCd=()=>CFG.noTechCd||S.inHub?0:up('brush','tfail')?1:2.5;
function endTrace(){
  const tr=S.trace;if(!tr)return;S.trace=null;
  const segs=traceSegs(tr).filter(p=>p.length>=3),reads=segs.map(segTech),shapes=reads.map(r=>r.shape);
  if(S.glyph&&shapes.includes(S.glyph.shape)){glyphBreak(S.glyph);S.ink={pts:tr.pts,t:0.7,max:0.7,col:C.hi};return;}
  const locked=S.traceCd>0||wBroken()||!knownTech(techW()).length,picks=[],used=new Set();
  if(!locked)reads.forEach((r,i)=>{if(r.sk&&!used.has(r.sk.id)){used.add(r.sk.id);picks.push({sk:r.sk,p:segs[i]});}});
  if(!picks.length){const sh=shapes.find(Boolean);S.ink={pts:tr.pts,t:0.5,max:0.5,col:C.ash};if(!locked)S.traceCd=S.traceCdMax=traceFailCd();
    text(P.x,P.y-56,S.glyph?(sh?`${SHAPES[sh].toUpperCase()} · NOT THE GLYPH`:'THE SHAPE FADES'):sh?`${SHAPES[sh].toUpperCase()} · NO TECHNIQUE`:'THE SHAPE FADES',C.ash);sfx('deny');return;}
  if(picks.length===1){castTech(picks[0].sk,picks[0].p);return;}
  // fused: every technique at once, for the sum of their recharges, striking harder while they last
  let cd=0;for(const q of picks)cd+=techCd(q.sk);cd*=Math.pow(0.9,up('brush','link'));
  S.fuseT=1.6;S.fuseBonus=picks.length>=3?2:1;
  picks.forEach((q,i)=>{if(i===0)castTech(q.sk,q.p,{chain:true,idx:0});else S.pending.push({t:i*0.16,fn:()=>{if(S.dead<=0)castTech(q.sk,q.p,{chain:true,idx:i});}});});
  S.traceCd=S.traceCdMax=CFG.noTechCd||S.inHub?0.05:cd;S.ink={pts:tr.pts,t:0.9,max:0.9,col:C.hi};
  text(P.x,P.y-100,picks.length>=3?'THREE STROKES':'INK CHAIN',C.hi,true);sfx('chain');S.shake+=4;
  if(S.stats)S.stats.chains=(S.stats.chains||0)+1;
}
function updateTrace(){
  const now=performance.now(),tr=S.trace;
  if(tr){
    if(now-tr.lastMove>240&&tr.splits.length<maxLinks()){const segs=traceSegs(tr),cur=segs[segs.length-1],r=segTech(cur),done=new Set(segs.slice(0,-1).map(p=>segTech(p).sk).filter(Boolean).map(k=>k.id));
      if(cur.length>=6&&((r.sk&&!done.has(r.sk.id)&&S.traceCd<=0)||(S.glyph&&r.shape===S.glyph.shape))){tr.splits.push(tr.pts.length-1);tr.ext+=1.3;sfx('chain');const q=tr.pts[tr.pts.length-1];burst(q.x,q.y,10,C.hi,120,0.4,2);text(q.x,q.y-18,r.sk?r.sk.name.toUpperCase():'墨',KCOL[r.sk?r.sk.kind:'G'],false);}
      tr.lastMove=now;}
    if(now-tr.t0>(traceMaxT()+(tr.ext||0))*1000)endTrace();}
  if(S.traceArm&&now>S.traceArm)S.traceArm=0;
}
function traceInfo(pts){
  let cx=0,cy=0;for(const p of pts){cx+=p.x;cy+=p.y;}cx/=pts.length;cy/=pts.length;
  const a=pts[0],b=pts[pts.length-1];let far=a,fd=0;for(const p of pts){const d=dist(p,a);if(d>fd){fd=d;far=p;}}
  const c={x:cx,y:cy},toC=Math.atan2(cy-(P.y-12),cx-P.x),near=dist(c,{x:P.x,y:P.y-12})<50;
  const e=autoAim(near?facingA():toC,560,near?0.9:0.7,true);
  const aimA=e?Math.atan2(e.y-12-(P.y-12),e.x-P.x):near?facingA():toC;
  return{pts,c,a,b,far,dirA:Math.atan2(b.y-a.y,b.x-a.x),farA:Math.atan2(far.y-a.y,far.x-a.x),chord:dist(a,b),reach:fd,aimA,target:e};
}
// ---------- shared pieces the techniques are built from ----------
function skCut(pts,speed,o){if(o&&o.kind==='bullet'){const cp=clipPts(pts,['wall'],2);pts=cp.pts;o.clipAt=cp.hit;}const W=curW(),c=makeCut(pts,speed,Object.assign({team:'p',ab:{},hr:W.hr*1.2,fam:S.skFam,wid:P.wpn?P.wpn.uid:0,blood:true,skill:true,noPoise:true},o));if(S.fuseT>0)c.dmgBonus=(c.dmgBonus||0)+(S.fuseBonus||1);if(c.len>=6)S.slashes.push(c);return c;}
function linePath(a,L,kinds,from){const st=from||{x:P.x,y:P.y},tgt=rayTo({x:st.x,y:st.y},a,L,P.r),cp=clipPts([st,tgt],kinds||['wall','crate','hole'],P.r-1);return cp.pts;}
function slidePath(path,dur,inv){const cum=[0];for(let i=1;i<path.length;i++)cum.push(cum[i-1]+dist(path[i-1],path[i]));const len=cum[cum.length-1];if(len<4)return false;
  S.slide={pts:path,cum,len,t:0,dur};P.dashT=0;if(inv)P.inv=Math.max(P.inv,inv);return true;}
function stepSlide(a,L){if(S.slide||S.leap)return;const p=linePath(a,L);slidePath(p,0.08,0);}
function counterStance(t,fn,o){S.counter=Object.assign({t,max:t,fn,multi:false,col:C.steel,glyph:'構'},o||{});sfx('guarded');}
function tryCounter(src){
  const c=S.counter;if(!c||c.t<=0||(src&&src.hazName))return false;
  src.hitP=true;if(!c.multi)S.counter=null;
  if(src.pts&&src.team==='e'&&!src.done)breakCut(src,head(src),null);
  P.inv=Math.max(P.inv,0.3);S.flash=Math.max(S.flash,0.06);c.fn(src);return true;
}
function addAura(o){const a=Object.assign({t:1,r:50,tick:0.3,next:0.05,dmg:0,block:false,pull:0,knock:0,kind:'spin'},o);a.max=a.t;S.auras.push(a);return a;}
function updateAuras(gdt){
  for(const a of S.auras){
    a.t-=gdt;a.next-=gdt;const cx=P.x,cy=P.y-8;
    if(a.pull)for(const e of S.enemies){if(e.state==='spawn'||e.boss||e.T.heavy||e.T.sumo)continue;const d=Math.hypot(e.x-cx,e.y-cy)||1;if(d<a.r*3.2&&d>a.r*0.55){e.kx+=(cx-e.x)/d*a.pull*gdt*7;e.ky+=(cy-e.y)/d*a.pull*gdt*7;}}
    if(a.next<=0){a.next=a.tick;const src={team:'p',ab:{},hits:new Set(),fam:++FAM,dmgBonus:a.dmg,aura:true,noPoise:true,kind:a.kind,child:true};
      for(const e of [...S.enemies]){if(e.state==='spawn'||e.state==='dodge'||e.smoke)continue;const d=Math.hypot(e.x-cx,e.y-cy);if(d>a.r+e.r||(a.inner&&d<a.inner))continue;
        hitEnemy(e,src);if(a.reap)addMeter(3);if(a.knock&&S.enemies.includes(e)&&!e.boss&&!e.T.heavy){const dd=Math.hypot(e.x-P.x,e.y-P.y)||1;e.kx=(e.x-P.x)/dd*a.knock;e.ky=(e.y-P.y)/dd*a.knock;}}}
    if(a.block){for(const o of S.eslashes){if(o.done||o.guard||(o.phase&&!a.phase))continue;const h=head(o);if(Math.hypot(h.x-cx,h.y-cy)<a.r+8)breakCut(o,h,null);}
      for(const sh of S.shots)if(!sh.dead&&Math.hypot(sh.x-cx,sh.y-cy)<a.r+sh.r){sh.dead=true;shotCut(sh);if(a.feed)addMeter(4);}}
  }
  S.auras=S.auras.filter(a=>a.t>0);
}
function leapTo(to,dur,h,onLand,inv){S.leap={x0:P.x,y0:P.y,x1:to.x,y1:to.y,t:0,dur,h,onLand};S.slide=null;P.dashT=0;if(inv!==false)P.inv=Math.max(P.inv,dur+0.08);}
function updateLeap(gdt){
  const L=S.leap;if(!L)return false;L.t+=gdt;const u=Math.min(1,L.t/L.dur);
  P.x=L.x0+(L.x1-L.x0)*u;P.y=L.y0+(L.y1-L.y0)*u;P.z=Math.sin(Math.PI*u)*L.h;P.vx=P.vy=0;
  if(L.h>20&&Math.random()<0.6)S.ghosts.push({x:P.x,y:P.y-P.z,look:'player',face:S.face,life:0.14});
  if(u>=1){S.leap=null;P.z=0;pushOut(P,P.r,true);if(L.onLand)L.onLand();}
  return true;
}
// ---------- the kusarigama hook ----------
function startHook(e,s){
  if(!S.enemies.includes(e))return;const heavy=e.boss||e.T.heavy||e.T.sumo;
  if(!heavy&&e.hookImm>S.gt){text(e.x,e.y-56,'SLIPS THE CHAIN',C.ash);sfx('clang');return;}e.hookImm=S.gt+2.4;
  if(heavy){const d=dist(e,P)||1,stop=e.r+P.r+10,t={x:e.x-(e.x-P.x)/d*stop,y:e.y-(e.y-P.y)/d*stop},path=clipPts([{x:P.x,y:P.y},inArena(t,P.r)],['wall','crate','hole'],P.r-1).pts;
    slidePath(path,clamp(d/1500,0.1,0.32),0.3);S.hooks.push({e,mode:'zip',t:0,max:0.4});text(e.x,e.y-60,'TOO HEAVY · REELED IN',C.steel);}
  else{for(const c of e.cuts||[])if(!c.done){c.done=true;c.fade=c.fadeMax=0.15;}e.cuts=[];e.shotsPlan=null;e.react=null;e.state='stun';e.t=0.6;
    S.hooks.push({e,mode:'reel',t:0,max:0.9});text(e.x,e.y-56,'HOOKED',C.steel);}
  sfx('clang');sfx('chain');
}
function updateHooks(gdt){
  for(const h of S.hooks){
    h.t+=gdt;const e=h.e;if(!S.enemies.includes(e)){h.done=true;continue;}
    if(h.mode==='reel'){const d=dist(e,P)||1,stop=P.r+e.r+10,sp=980*(1+0.25*up('kusari','reel'));
      if(d>stop+1){const mv=Math.min(d-stop,sp*gdt);e.x+=(P.x-e.x)/d*mv;e.y+=(P.y-e.y)/d*mv;e.kx=e.ky=0;e.state='stun';e.t=Math.max(e.t,0.3);if(Math.random()<0.5)S.parts.push({x:e.x+rand(-6,6),y:e.y+e.r*0.5,vx:rand(-20,20),vy:-rand(10,40),life:0.3,max:0.3,size:1,col:'#6a5a60'});}
      if(d<=stop+2||h.t>h.max){h.done=true;stunEnemy(e,0.55+0.15*up('kusari','reel'));S.reap={t:0.9};sfx('thunk');S.shake+=3;text(e.x,e.y-44,'REAP IT',C.hi);}}
    else if(!S.slide||h.t>h.max){h.done=true;stunEnemy(e,e.boss?0.25:0.5);S.reap={t:0.9};sfx('thunk');}
  }
  S.hooks=S.hooks.filter(h=>!h.done);
  if(S.reap){S.reap.t-=gdt;if(S.reap.t<=0)S.reap=null;}
}
function grappleZip(to,e){
  const d=dist(to,P)||1,stop=e?e.r+P.r+6:P.r+4,t={x:to.x-(to.x-P.x)/d*stop,y:to.y-(to.y-P.y)/d*stop},path=clipPts([{x:P.x,y:P.y},inArena(t,P.r)],['wall','crate','hole'],P.r-1).pts;
  if(!slidePath(path,clamp(d/1700,0.08,0.3),0.4))return;sfx('dash');
  if(e)S.pending.push({t:clamp(d/1700,0.08,0.3),fn:()=>{if(!S.enemies.includes(e))return;stunEnemy(e,e.boss?0.4:1.3);const a=Math.atan2(e.y-P.y,e.x-P.x);if(!e.boss&&!e.T.heavy){e.kx=Math.cos(a)*520;e.ky=Math.sin(a)*520;}text(e.x,e.y-54,'KICKED',C.bone);sfx('smash');S.shake+=5;hitPause(6,e,1);}});
}
// ---------- the musket ----------
function fireBall(a,o={}){
  const L=o.len||WEAPONS.musket.shot.len,st={x:P.x+Math.cos(a)*14,y:P.y-12+Math.sin(a)*14},end={x:st.x+Math.cos(a)*L,y:st.y+Math.sin(a)*L};
  const cp=o.walls===false?{pts:[st,end],hit:null}:clipPts([st,rayTo(st,a,L,2)],['wall'],2);
  const c=makeCut(cp.pts,o.speed||5200,{team:'p',ab:o.pierce?{pierce:true}:{},hr:o.hr||5,kind:o.kind||'bullet',blood:!!o.blood,dmgBonus:o.dmg??3,fam:o.fam||++FAM,famCap:o.famCap,wid:P.wpn?P.wpn.uid:0,clipAt:cp.hit,noBlock:!!o.noBlock,pierceArmor:!!o.pierceArmor,skill:o.skill,child:o.skill});
  S.slashes.push(c);
  if(!o.quiet){for(let i=0;i<10;i++)S.parts.push({x:st.x+Math.cos(a)*8,y:st.y+Math.sin(a)*8,vx:Math.cos(a+rand(-0.5,0.5))*rand(40,160),vy:Math.sin(a+rand(-0.5,0.5))*rand(40,160)-20,life:rand(0.4,0.9),max:0.9,size:2,col:Math.random()<0.3?'#ffd27a':'#8a8090'});sfx('gun');}
  return c;
}
const reloadWin=()=>{const w=0.15+0.06*up('musket','sweet');return[0.52-w/2,0.52+w/2];};
function startReload(){const W=WEAPONS.musket;S.reload=S.reloadMax=W.reload*wCdMul(false)*Math.pow(0.88,up('musket','reload'));S.jam=false;}
function activeReload(){
  if(S.jam){sfx('deny');return;}
  const f=1-S.reload/Math.max(0.01,S.reloadMax),[a,b]=reloadWin();
  if(f>=a&&f<=b){S.reload=0;S.perfect=true;text(P.x,P.y-56,'PERFECT RELOAD',C.mon,true);sfx('ready');sfx('click');burst(P.x+S.face*10,P.y-16,12,C.mon,160,0.4,1);}
  else{S.jam=true;S.reload+=0.45;S.reloadMax+=0.45;text(P.x,P.y-50,'JAMMED',C.ash);sfx('clang');}
}
// ---------- casting ----------
function castTech(sk,pts,o){
  const I=traceInfo(pts),W=curW(),fam=S.skFam=++FAM,aim=I.aimA,len=I.chord,chain=!!(o&&o.chain);
  if(!chain){S.traceCd=S.traceCdMax=techCd(sk);S.ink={pts,t:0.7,max:0.7,col:slashSet().id==='crimson'?KCOL[sk.kind]:setCol(slashSet().tr)};}
  text(P.x,P.y-70-(chain?o.idx*16:0),sk.name.toUpperCase(),KCOL[sk.kind],true);castBurst(P.x,P.y-14);sfx('ult');S.flash=Math.max(S.flash,0.06);S.shake+=4;hitPause(4,null);
  const face=a=>{S.face=Math.cos(a)>0?1:-1;S.anim={kind:'down',t:0,dir:{x:Math.cos(a),y:Math.sin(a)}};};face(aim);
  const ring=(n,r0,r1,sp,o)=>{for(let i=0;i<n;i++){const a=i/n*Math.PI*2;skCut([{x:P.x+Math.cos(a)*r0,y:P.y-10+Math.sin(a)*r0},rayTo({x:P.x,y:P.y-10},a,r1,2)],sp,o);}};
  switch(sk.id){
    // ----- broken katana -----
    case'r_spin':ring(10,14,120,1500,{dmgBonus:1});break;
    case'r_flash':{const a=I.dirA,p=linePath(a,clamp(len*1.2,120,300));if(slidePath(p,0.12,0.3)){skCut(p.map(q=>({x:q.x,y:q.y-10})),1e6,{dmgBonus:1,hr:14,famCap:1});sfx('dash');face(a);}break;}
    case'r_mirror':counterStance(1.0,src=>{addMeter(15);text(P.x,P.y-50,'MIRRORED',C.hi);
        if(src.owner&&S.enemies.includes(src.owner)&&(src.shot||!src.pts)){const o=src.owner,a=Math.atan2(o.y-12-(P.y-12),o.x-P.x);skCut([{x:P.x,y:P.y-12},rayTo({x:P.x,y:P.y-12},a,600,2)],1800,{dmgBonus:1,hr:8,kind:'bullet',fam:++FAM});}},{multi:true,col:C.hi,glyph:'鏡'});break;
    case'r_return':{const a=I.farA,st={x:P.x,y:P.y-12},far=rayTo({x:st.x,y:st.y},a,280,2);skCut([st,far,{x:st.x+Math.cos(a)*4,y:st.y+Math.sin(a)*4}],1100,{dmgBonus:1,hr:11,ab:{pierce:true},kind:'boomer',famCap:2});sfx('eswing');break;}
    case'r_thousand':{const c=inArena(I.c,40);for(let i=0;i<16;i++)S.pending.push({t:i*0.035,fn:()=>{const p={x:c.x+rand(-80,80),y:c.y+rand(-60,60)},a=rand(0,Math.PI*2),h=rand(22,36);skCut([inArena({x:p.x-Math.cos(a)*h,y:p.y-Math.sin(a)*h},2),rayTo({x:p.x,y:p.y},a,h,2)],1e6,{hr:9,famCap:5});if(i%3===0)sfx('tap');}});break;}
    case'r_petal':addAura({kind:'petal',t:4,r:48,tick:0.35,block:true,feed:true});sfx('fire');break;
    // ----- katana -----
    case'k_sanren':for(let k=0;k<3;k++)S.pending.push({t:k*0.11,fn:()=>{const a=aim+(k-1)*0.18;skCut(bodyLine(a,270),2600,{dmgBonus:1});sfx('slash',2400);}});
      S.pending.push({t:0.34,fn:()=>{const p=linePath(aim,180);slidePath(p,0.14,0.2);}});break;
    case'k_swallow':{const o={x:P.x,y:P.y-10},p=linePath(aim+Math.PI,180);slidePath(p,0.16,0.35);sfx('dash');
      S.pending.push({t:0.22,fn:()=>{for(const d of [0.785,-0.785]){const a=aim+d;skCut([inArena({x:o.x-Math.cos(a)*70,y:o.y-Math.sin(a)*70},2),rayTo({x:o.x,y:o.y},a,70,2)],1e6,{dmgBonus:1,hr:14,ab:{linger:true},famCap:3});}sfx('slash',2600);}});break;}
    case'k_mikiri':counterStance(0.9,src=>{const o=src.owner;text(P.x,P.y-52,'MIKIRI',C.steel,true);S.slowT=Math.max(S.slowT,0.7);
        if(o&&S.enemies.includes(o)){const d=dist(o,P)||1,a=Math.atan2(o.y-P.y,o.x-P.x);if(d>60){const p=linePath(a,d-o.r-P.r-4);slidePath(p,0.08,0.4);}
          S.pending.push({t:0.09,fn:()=>{if(!S.enemies.includes(o))return;const st={x:P.x-Math.cos(a)*20,y:P.y-10-Math.sin(a)*20};skCut([st,rayTo({x:o.x,y:o.y-10},a,50,2)],1e6,{dmgBonus:3,hr:16,noBlock:true,pierceArmor:true,fam:++FAM});sfx('slash',3000);hitPause(10,o,2);}});}},{col:C.steel,glyph:'見'});break;
    case'k_moon':{const a=I.dirA,p=linePath(a,clamp(len*1.2,140,320));if(slidePath(p,0.1,0.45)){sfx('draw');face(a);const path=p.map(q=>({x:q.x,y:q.y-10})),A=p[0],Bq=p[p.length-1];
        const marked=S.enemies.filter(e=>e.state!=='spawn'&&!e.smoke&&segDist(e,A,Bq)<e.r+34);for(const e of marked){e.flash=1;S.marks.push({x:e.x,y:e.y-16,c:Math.cos(a),s:Math.sin(a),life:0.3,ult:true});}
        S.pending.push({t:0.34,fn:()=>{skCut(path,1e6,{hr:16,noBlock:true,famCap:1});const f2=++FAM;for(const e of marked){if(!S.enemies.includes(e))continue;skCut([{x:e.x-Math.cos(a)*40,y:e.y-14-Math.sin(a)*40},{x:e.x+Math.cos(a)*40,y:e.y-14+Math.sin(a)*40}],1e6,{dmgBonus:2,hr:16,noBlock:true,pierceArmor:true,famCap:1,fam:f2});}
          sfx('slash',3200);S.flash=Math.max(S.flash,0.08);S.shake+=6;const m=path[Math.floor(path.length/2)];text(m.x,m.y-30,marked.length?`斬 ×${marked.length}`:'斬',C.white,true);}});}break;}
    case'k_crescent':{const nx=-Math.sin(aim),ny=Math.cos(aim);for(let i=-4;i<=4;i++){const off=i*15,back=Math.abs(i)*Math.abs(i)*4,st={x:P.x+nx*off-Math.cos(aim)*back,y:P.y-10+ny*off-Math.sin(aim)*back};
        skCut([inArena(st,2),rayTo({x:st.x,y:st.y},aim,480,2)],880,{hr:11,ab:{pierce:true},famCap:2,kind:'crescent'});}sfx('gust');break;}
    // ----- yari -----
    case'y_lunge':{const a=I.farA,p=linePath(a,240);slidePath(p,0.2,0.28);skCut(bodyLine(a,380),2400,{dmgBonus:2,ab:{pierce:true},hr:10,kind:'spear'});face(a);break;}
    case'y_vault':{const a=I.dirA,L=clamp(len*1.3,150,280);let to=rayTo({x:P.x,y:P.y},a,L,P.r);to=clipPts([{x:P.x,y:P.y},to],['wall'],P.r).pts.pop();to=freeSpot(S.room,to.x,to.y,P.r);face(a);sfx('dash');
      leapTo(to,0.42,46,()=>{for(let i=0;i<6;i++){const b=i/6*Math.PI*2;skCut(bodyLine(b,110),2200,{dmgBonus:1,ab:{pierce:true},hr:8,kind:'spear',famCap:2});}S.shake+=6;sfx('land');burst(P.x,P.y,14,'#6a5a60',200,0.5,2);});break;}
    case'y_root':counterStance(2.0,src=>{const o=src.owner;text(P.x,P.y-52,'ROOTED',C.steel,true);if(o&&S.enemies.includes(o)){const a=Math.atan2(o.y-P.y,o.x-P.x);skCut(bodyLine(a,Math.min(260,dist(o,P)+40)),2800,{dmgBonus:2,ab:{pierce:true},kind:'spear',stunT:1.2,fam:++FAM});}},{col:C.steel,glyph:'根',root:{next:0,done:new Set()}});break;
    case'y_hundred':for(let i=0;i<8;i++)S.pending.push({t:i*0.07,fn:()=>{const a=aim+rand(-0.3,0.3);skCut(bodyLine(a,WEAPONS.yari.len*0.9),2600,{ab:{pierce:true},hr:8,kind:'spear',famCap:4});sfx('tap',i%3===2);}});break;
    case'y_wall':addAura({kind:'spin',t:1.5,r:60,tick:0.3,block:true,knock:440});sfx('gust');break;
    // ----- kanabo -----
    case'b_split':ring(12,16,210,620,{dmgBonus:2,hr:13,kind:'smash'});burstAt({x:P.x,y:P.y},{ab:{},team:'p',hits:new Set(),fam,d:0,len:1,cum:[0,1],dmgBonus:1},120);sfx('smash');S.shake+=10;break;
    case'b_charge':{const a=I.dirA,L=clamp(len*1.3,160,320),p=linePath(a,L,['wall','hole']),pl=polyLen(p);if(pl>10){const dur=clamp(pl/900,0.18,0.36);slidePath(p,dur,dur+0.15);face(a);
        skCut(p.map(q=>({x:q.x,y:q.y-8})),pl/dur,{dmgBonus:1,hr:22,kind:'smash',ab:{pierce:true},knockSide:true,famCap:1});sfx('dash');sfx('smash');S.shake+=5;}break;}
    case'b_patience':counterStance(1.1,()=>{text(P.x,P.y-52,'THE GROUND ANSWERS',C.hi,true);burstAt({x:P.x,y:P.y},{ab:{},team:'p',hits:new Set(),fam:++FAM,dmgBonus:2,d:0,len:1,cum:[0,1]},140);
        for(const e of S.enemies)if(dist(e,P)<160&&e.state!=='spawn')stunEnemy(e,e.boss?0.6:1.5);for(let i=0;i<10;i++){const a=i/10*Math.PI*2;skCut([{x:P.x+Math.cos(a)*16,y:P.y+Math.sin(a)*16},rayTo({x:P.x,y:P.y},a,170,2)],700,{hr:12,kind:'smash',famCap:1,fam:++FAM});}
        S.shake+=12;sfx('smash');},{col:C.hi,glyph:'忍'});break;
    case'b_whirl':addAura({kind:'whirl',t:2.0,r:66,tick:0.32,pull:200,knock:0});sfx('gust');break;
    case'b_meteor':{let to=I.c;const d=dist(to,P);if(d>300)to={x:P.x+(to.x-P.x)/d*300,y:P.y+(to.y-P.y)/d*300};to=freeSpot(S.room,inArena(to,P.r).x,inArena(to,P.r).y,P.r);sfx('dash');
      leapTo(to,0.6,110,()=>{burstAt({x:P.x,y:P.y},{ab:{},team:'p',hits:new Set(),fam:++FAM,dmgBonus:3,d:0,len:1,cum:[0,1]},150);for(const e of S.enemies)if(dist(e,P)<175&&e.state!=='spawn')stunEnemy(e,e.boss?0.5:1.2);
        for(let i=0;i<12;i++){const a=i/12*Math.PI*2;skCut([{x:P.x+Math.cos(a)*20,y:P.y+Math.sin(a)*20},rayTo({x:P.x,y:P.y},a,200,2)],650,{hr:12,kind:'smash',famCap:1,fam:++FAM});}
        for(let i=0;i<14;i++)stamp(P.x+rand(-40,40),P.y+rand(-26,26),rand(4,12),0.5);S.shake+=16;sfx('smash');S.flash=Math.max(S.flash,0.1);text(P.x,P.y-60,'METEOR',C.hi,true);});break;}
    // ----- kusarigama -----
    case'c_bind':{const c=I.c;let r=0;for(const p of pts)r=Math.max(r,dist(p,c));r=Math.max(90,r+30);let n=0;
      for(const e of [...S.enemies]){if(e.state==='spawn'||e.smoke||dist(e,c)>r)continue;n++;e.kx=(c.x-e.x)*3;e.ky=(c.y-e.y)*3;stunEnemy(e,e.boss?0.8:2.0);damageEnemy(e,1);e.flash=1;if(e.hp<=0)kill(e,null);}
      S.rings.push({x:c.x,y:c.y,r,life:0.35,col:C.steel});text(c.x,c.y-30,n?`BOUND ×${n}`:'BIND',C.steel);sfx('clang');break;}
    case'c_grapple':{const a=I.dirA,raw={x:P.x+Math.cos(a)*400,y:P.y-10+Math.sin(a)*400},end=inArena(raw,2),cp=clipPts([{x:P.x,y:P.y-10},end],['wall','crate'],2),bit=!!cp.hit||dist(end,raw)>2;
      skCut(cp.pts,2200,{dmgBonus:1,hr:10,kind:'chain',grapple:true,bite:bit?cp.pts[cp.pts.length-1]:null,blood:false,famCap:1});face(a);sfx('eswing');break;}
    case'c_swap':{const a=I.farA;let e=autoAim(a,340,0.6,false)||nearestEnemy(P,260);if(!e){text(P.x,P.y-50,'NOTHING TO HOOK',C.ash);break;}
      S.bolts.push({a:{x:P.x,y:P.y-12},b:{x:e.x,y:e.y-12},life:0.2});
      if(e.boss||e.T.heavy){grappleZip({x:e.x,y:e.y},e);break;}
      const pp={x:P.x,y:P.y},ep={x:e.x,y:e.y};P.x=ep.x;P.y=ep.y;e.x=pp.x;e.y=pp.y;pushOut(P,P.r,true);for(const c of e.cuts||[])if(!c.done){c.done=true;c.fade=c.fadeMax=0.15;}e.cuts=[];
      stunEnemy(e,1.4);P.inv=Math.max(P.inv,0.45);burst(pp.x,pp.y-14,12,C.steel,200,0.4,2);burst(ep.x,ep.y-14,12,C.steel,200,0.4,2);text(e.x,e.y-54,'SWAPPED',C.steel);sfx('blink');break;}
    case'c_reap':{const R=130,c={x:P.x,y:P.y-10},path=[];for(let i=0;i<=40;i++){const t=aim+i/32*Math.PI*2;path.push(inArena({x:c.x+Math.cos(t)*R,y:c.y+Math.sin(t)*R*0.85},2));}
      skCut(path,1900,{dmgBonus:1,hr:12,kind:'chain',fling:600,famCap:2,blood:false});sfx('gust');break;}
    case'c_ward':counterStance(1.1,src=>{const o=src.owner;text(P.x,P.y-52,'SNARED',C.steel,true);
        if(o&&S.enemies.includes(o)){S.bolts.push({a:{x:P.x,y:P.y-12},b:{x:o.x,y:o.y-12},life:0.25});if(!o.boss&&!o.T.heavy){const a=Math.atan2(o.y-P.y,o.x-P.x),q=freeSpot(S.room,P.x+Math.cos(a)*(o.r+P.r+8),P.y+Math.sin(a)*(o.r+P.r+8),o.r);o.x=q.x;o.y=q.y;}stunEnemy(o,o.boss?0.6:1.6);tryDisarm(o,true);}
        else{addMeter(10);}},{col:C.steel,glyph:'網'});break;
    // ----- musket -----
    case'm_volley':for(const o of [-0.16,0,0.16])fireBall(aim+o,{dmg:2,quiet:o!==0,skill:true});S.reload=0;S.shake+=8;break;
    case'm_recoil':{for(let i=0;i<5;i++)fireBall(aim+(i-2)*0.11,{len:280,dmg:1,fam,famCap:3,quiet:i!==2,skill:true});const p=linePath(aim+Math.PI,220);slidePath(p,0.22,0.4);S.shake+=8;S.reload=0;burst(P.x+Math.cos(aim)*16,P.y-12+Math.sin(aim)*16,18,'#8a8090',220,0.6,2);break;}
    case'm_quick':counterStance(1.0,src=>{const o=src.owner;text(P.x,P.y-52,'QUICKDRAW',C.mon,true);const sd=Math.random()<0.5?1:-1,a0=o?Math.atan2(o.y-P.y,o.x-P.x):aim;slidePath(linePath(a0+sd*Math.PI/2,50),0.07,0.4);
        S.pending.push({t:0.08,fn:()=>{const a=o&&S.enemies.includes(o)?Math.atan2(o.y-12-(P.y-12),o.x-P.x):aim;fireBall(a,{dmg:6,pierce:true,blood:true,pierceArmor:true,len:900,skill:true});S.reload=0;S.shake+=8;}});},{col:C.mon,glyph:'抜'});break;
    case'm_smoke':{const c={x:P.x,y:P.y};S.clouds.push({x:c.x,y:c.y,r:120,t:2.2,max:2.2});for(const e of S.enemies)if(dist(e,c)<140&&e.state!=='spawn'){stunEnemy(e,e.boss?0.8:2.2);text(e.x,e.y-50,'?',C.ash);}
      for(const s of S.shots)if(dist(s,c)<140){s.dead=true;}P.inv=Math.max(P.inv,1.2);S.reload=0;S.smokeShot=true;const m=moveVec(),a=Math.hypot(m.x,m.y)>0.1?Math.atan2(m.y,m.x):aim+Math.PI;slidePath(linePath(a,140),0.18,1.2);
      burst(c.x,c.y-12,40,C.smoke,260,1.0,3);sfx('fire');break;}
    case'm_rail':{const a=aim;S.railAim={a,t:0.35};sfx('draw');S.pending.push({t:0.35,fn:()=>{S.railAim=null;const st={x:P.x,y:P.y-12};const c=makeCut([st,{x:st.x+Math.cos(a)*1400,y:st.y+Math.sin(a)*1400}],12000,{team:'p',ab:{pierce:true},hr:11,kind:'bullet',blood:true,dmgBonus:4,fam:++FAM,pierceArmor:true,skill:true,noPoise:true,wid:P.wpn?P.wpn.uid:0});S.slashes.push(c);
        sfx('gun');sfx('ult');S.shake+=14;S.flash=Math.max(S.flash,0.12);P.kx-=Math.cos(a)*420;P.ky-=Math.sin(a)*420;}});break;}
    // ----- nodachi -----
    case'nd_heaven':{const a=I.dirA,p=linePath(a,clamp(len*1.2,140,300));slidePath(p,0.16,0.3);face(a);sfx('dash');
      S.pending.push({t:0.18,fn:()=>{const nx=-Math.sin(a),ny=Math.cos(a),c={x:P.x+Math.cos(a)*40,y:P.y-10+Math.sin(a)*40};skCut([inArena({x:c.x-nx*90,y:c.y-ny*90},2),inArena({x:c.x+nx*90,y:c.y+ny*90},2)],1e6,{dmgBonus:2,hr:16,noBlock:true,famCap:1,stunT:0.8});sfx('slash',3000);S.shake+=8;}});break;}
    case'nd_wall':counterStance(1.0,()=>{text(P.x,P.y-52,'IRON WALL',C.steel,true);const R=125,c={x:P.x,y:P.y-10},path=[];for(let i=0;i<=40;i++){const t=aim+i/40*Math.PI*2;path.push(inArena({x:c.x+Math.cos(t)*R,y:c.y+Math.sin(t)*R*0.85},2));}
        skCut(path,1e6,{dmgBonus:2,hr:14,fling:420,famCap:1,fam:++FAM,noBlock:true});sfx('slash',3000);S.shake+=8;S.slowT=Math.max(S.slowT,0.5);},{col:C.steel,glyph:'壁'});break;
    case'nd_moon':{const R=175,path=[];for(let i=0;i<=30;i++){const t=aim-1.3+i/30*2.6;path.push(inArena({x:P.x+Math.cos(t)*R,y:P.y-10+Math.sin(t)*R},2));}skCut(path,2200,{dmgBonus:2,hr:16,ab:{pierce:true},famCap:1});sfx('gust');sfx('slash',2600);S.shake+=6;break;}
    case'nd_mountain':for(let k=0;k<3;k++)S.pending.push({t:k*0.16,fn:()=>{const a=aim+(k-1)*0.35;skCut(bodyLine(a,320),2400,{dmgBonus:2,hr:15,stunT:0.9,famCap:1,fam:++FAM});sfx('smash');S.shake+=5;}});break;
    case'nd_storm':{const R=140,c={x:P.x,y:P.y-10},path=[];for(let i=0;i<=80;i++){const t=aim+i/40*Math.PI*2;path.push(inArena({x:c.x+Math.cos(t)*R,y:c.y+Math.sin(t)*R*0.85},2));}
      for(const e of S.enemies)if(e.state!=='spawn'&&!e.boss&&!e.T.heavy&&dist(e,P)<260){const d=dist(e,P)||1;e.kx=(P.x-e.x)/d*420;e.ky=(P.y-e.y)/d*420;}
      skCut(path,2400,{dmgBonus:1,hr:14,famCap:2});sfx('gust');break;}
    // ----- tessen -----
    case'ts_step':{const a=I.dirA,p=linePath(a,clamp(len*1.2,120,280)),o={x:P.x,y:P.y};if(slidePath(p,0.14,0.45)){face(a);sfx('gust');for(const s of S.shots)if(segDist(s,o,{x:P.x,y:P.y})<70)s.dead=true;
      skCut([{x:o.x,y:o.y-10},{x:p[p.length-1].x,y:p[p.length-1].y-10}],1600,{hr:22,isWave:true,fling:420,famCap:1});}break;}
    case'ts_mirror':counterStance(1.5,src=>{addMeter(12);text(P.x,P.y-50,'FANNED BACK',C.spirit);const o=src.owner;
        if(o&&S.enemies.includes(o)){const a=Math.atan2(o.y-12-(P.y-12),o.x-P.x);if(src.shot||!src.pts)skCut([{x:P.x,y:P.y-12},rayTo({x:P.x,y:P.y-12},a,600,2)],1800,{dmgBonus:2,hr:9,kind:'bullet',fam:++FAM});else{stunEnemy(o,o.boss?0.5:1.2);}}},{multi:true,col:C.spirit,glyph:'舞'});break;
    case'ts_gale':for(let i=-2;i<=2;i++){const a=aim+i*0.24;skCut([{x:P.x+Math.cos(a)*14,y:P.y-12+Math.sin(a)*14},rayTo({x:P.x,y:P.y-12},a,330,2)],1300,{hr:16,isWave:true,fling:560,famCap:1,dmgBonus:1});}sfx('gust');S.shake+=5;break;
    case'ts_leaves':for(let i=0;i<14;i++)S.pending.push({t:i*0.03,fn:()=>{const a=aim+rand(-0.5,0.5);skCut([{x:P.x,y:P.y-12},rayTo({x:P.x,y:P.y-12},a,rand(220,340),2)],1700,{hr:7,famCap:4,kind:'crescent'});if(i%4===0)sfx('tap');}});break;
    case'ts_tornado':addAura({kind:'whirl',t:2.0,r:70,tick:0.3,block:true,knock:520,pull:0});sfx('gust');break;
    // ----- bo -----
    case'bo_vault':{const a=I.dirA,L=clamp(len*1.4,170,320);let to=rayTo({x:P.x,y:P.y},a,L,P.r);to=clipPts([{x:P.x,y:P.y},to],['wall'],P.r).pts.pop();to=freeSpot(S.room,to.x,to.y,P.r);face(a);sfx('dash');
      leapTo(to,0.45,52,()=>{for(let i=0;i<8;i++){const b=i/8*Math.PI*2;skCut(bodyLine(b,90),2200,{dmgBonus:1,hr:9,kind:'spear',stunT:0.6,famCap:1,fam:++FAM});}S.shake+=6;sfx('land');burst(P.x,P.y,14,'#6a5a60',200,0.5,2);});break;}
    case'bo_rebound':counterStance(1.1,src=>{const o=src.owner;text(P.x,P.y-52,'REBOUND',C.steel,true);if(o&&S.enemies.includes(o)){const a=Math.atan2(o.y-P.y,o.x-P.x);stunEnemy(o,o.boss?0.7:1.8);if(!o.boss&&!o.T.heavy){o.kx=Math.cos(a)*900;o.ky=Math.sin(a)*900;}damageEnemy(o,1);o.flash=1;if(o.hp<=0)kill(o,null);}else addMeter(10);sfx('clang');S.shake+=6;},{col:C.steel,glyph:'返'});break;
    case'bo_sweep':{const R=105,path=[];for(let i=0;i<=36;i++){const t=aim+i/36*Math.PI*1.6;path.push(inArena({x:P.x+Math.cos(t)*R,y:P.y-6+Math.sin(t)*R*0.8},2));}skCut(path,1700,{dmgBonus:1,hr:14,stunT:1.2,famCap:1});sfx('gust');break;}
    case'bo_crush':{let to=I.c;const d=dist(to,P);if(d>260)to={x:P.x+(to.x-P.x)/d*260,y:P.y+(to.y-P.y)/d*260};to=freeSpot(S.room,inArena(to,P.r).x,inArena(to,P.r).y,P.r);sfx('dash');
      leapTo(to,0.5,80,()=>{burstAt({x:P.x,y:P.y},{ab:{},team:'p',hits:new Set(),fam:++FAM,dmgBonus:3,d:0,len:1,cum:[0,1]},120);for(const e of S.enemies)if(dist(e,P)<140&&e.state!=='spawn')stunEnemy(e,e.boss?0.6:1.6);S.shake+=12;sfx('smash');text(P.x,P.y-60,'CRUSH',C.hi,true);});break;}
    case'bo_spin':addAura({kind:'spin',t:2.0,r:62,tick:0.3,block:true,knock:520});sfx('gust');break;
    // ----- kama -----
    case'km_hook':{const a=I.dirA,raw={x:P.x+Math.cos(a)*380,y:P.y-10+Math.sin(a)*380},end=inArena(raw,2),cp=clipPts([{x:P.x,y:P.y-10},end],['wall','crate'],2),bit=!!cp.hit||dist(end,raw)>2;
      skCut(cp.pts,2100,{dmgBonus:1,hr:10,kind:'chain',hook:true,hookMax:1,bleed:true,bite:bit?cp.pts[cp.pts.length-1]:null,grapple:false,blood:false,famCap:1});if(bit&&!autoAim(a,380,0.3,false))S.pending.push({t:0.2,fn:()=>grappleZip(cp.pts[cp.pts.length-1],null)});face(a);sfx('eswing');break;}
    case'km_reaper':counterStance(1.0,src=>{const o=src.owner;text(P.x,P.y-52,'REAPED',C.hi,true);S.slowT=Math.max(S.slowT,0.6);
        if(o&&S.enemies.includes(o)){const a=Math.atan2(o.y-P.y,o.x-P.x);S.pending.push({t:0.06,fn:()=>{if(!S.enemies.includes(o))return;const hp0=o.hp;skCut([{x:P.x,y:P.y-12},rayTo({x:o.x,y:o.y-10},a,40,2)],1e6,{dmgBonus:3,hr:16,noBlock:true,pierceArmor:true,bleed:true,fam:++FAM});
          S.pending.push({t:0.05,fn:()=>{if(!S.enemies.includes(o)||o.hp<=0)heal(1);}});sfx('slash',3000);}});}},{col:C.hi,glyph:'刈'});break;
    case'km_harvest':{const R=120,path=[];for(let i=0;i<=28;i++){const t=aim-1.1+i/28*2.2;path.push(inArena({x:P.x+Math.cos(t)*R,y:P.y-10+Math.sin(t)*R},2));}skCut(path,1900,{dmgBonus:1,hr:14,reapFeed:2,bleed:true,famCap:1});sfx('gust');break;}
    case'km_rain':{const c=inArena(I.c,40);for(let i=0;i<8;i++)S.pending.push({t:i*0.05,fn:()=>{const p={x:c.x+rand(-60,60),y:c.y+rand(-45,45)},a=rand(0,Math.PI*2),h=rand(20,32);skCut([inArena({x:p.x-Math.cos(a)*h,y:p.y-Math.sin(a)*h},2),rayTo({x:p.x,y:p.y},a,h,2)],1e6,{hr:9,famCap:4,bleed:true});if(i%3===0)sfx('tap');}});break;}
    case'km_spiral':addAura({kind:'petal',t:3,r:52,tick:0.3,block:false,feed:true,reap:true,dmg:0});sfx('fire');break;
    // ----- naginata -----
    case'ng_charge':{const a=I.dirA,p=linePath(a,clamp(len*1.3,150,320),['wall','hole']),pl=polyLen(p);if(pl>10){const dur=clamp(pl/1000,0.16,0.32);slidePath(p,dur,dur+0.15);face(a);
      skCut(p.map(q=>({x:q.x+Math.cos(a)*40,y:q.y-10+Math.sin(a)*40})),pl/dur,{dmgBonus:1,hr:14,kind:'spear',ab:{pierce:true},famCap:1});sfx('dash');}break;}
    case'ng_guard':addAura({kind:'spin',t:1.4,r:70,tick:0.3,block:true,knock:460});sfx('gust');break;
    case'ng_reap':{const R=170,path=[];for(let i=0;i<=30;i++){const t=aim-1.25+i/30*2.5;path.push(inArena({x:P.x+Math.cos(t)*R,y:P.y-10+Math.sin(t)*R},2));}skCut(path,2000,{dmgBonus:1,hr:15,fling:600,famCap:1});sfx('gust');break;}
    case'ng_petals':for(let k=0;k<3;k++)S.pending.push({t:k*0.2,fn:()=>{slidePath(linePath(aim,34),0.08,0.15);const R=135,sd=k%2?-1:1,path=[];for(let i=0;i<=24;i++){const t=aim+sd*(-1.1+i/24*2.2);path.push(inArena({x:P.x+Math.cos(t)*R,y:P.y-10+Math.sin(t)*R},2));}skCut(path,2000,{dmgBonus:1,hr:13,fling:360,famCap:1,fam:++FAM});sfx('slash',2200);}});break;
    case'ng_wheel':{const R=150,c={x:P.x,y:P.y-10},path=[];for(let i=0;i<=80;i++){const t=aim+i/40*Math.PI*2;path.push(inArena({x:c.x+Math.cos(t)*R,y:c.y+Math.sin(t)*R*0.85},2));}skCut(path,2300,{dmgBonus:2,hr:14,fling:420,famCap:2});sfx('gust');break;}
  }
  if(P.wpn)wear(2);if(up('brush','tblood'))addMeter(8*up('brush','tblood'));if(capOn('brush','stroke'))P.inv=Math.max(P.inv,1);
  S.cdLock=Math.max(S.cdLock,0.2);if(S.stats)S.stats.techs=(S.stats.techs||0)+1;tutEvent('tech');featEvent('tech');
}
function updateSkills(gdt){
  updateTrace();updateAuras(gdt);updateHooks(gdt);
  if(S.traceCd>0){S.traceCd-=gdt;if(S.traceCd<=0){S.traceCd=0;sfx('ready');}}
  const c=S.counter;if(c){c.t-=gdt;if(c.t<=0)S.counter=null;
    else if(c.root){c.root.next-=gdt;if(c.root.next<=0){const e=S.enemies.find(e=>e.state!=='spawn'&&!e.smoke&&!c.root.done.has(e)&&dist(e,P)<150);
      if(e){c.root.done.add(e);c.root.next=0.3;const a=Math.atan2(e.y-P.y,e.x-P.x);skCut(bodyLine(a,170),2800,{dmgBonus:1,ab:{pierce:true},kind:'spear',stunT:1.0,fam:++FAM});sfx('tap',true);}}}}
  for(const k of S.clouds){k.t-=gdt;if(Math.random()<gdt*40){const a=rand(0,6.28),r=Math.sqrt(Math.random())*k.r;S.parts.push({x:k.x+Math.cos(a)*r,y:k.y-10+Math.sin(a)*r*0.7,vx:rand(-15,15),vy:rand(-25,-5),life:0.8,max:0.8,size:2,col:Math.random()<0.5?C.smoke:'#5a5262'});}}
  S.clouds=S.clouds.filter(k=>k.t>0);
  if(S.railAim){S.railAim.t-=gdt;}
  if(S.ink){S.ink.t-=gdt;if(S.ink.t<=0)S.ink=null;}
  // held attacks: brace, chain whirl
  const sw=S.swipe;if(sw&&!S.trace){const last=sw.pts[sw.pts.length-1];if(!sw.moved&&dist(sw.pts[0],last)>=16)sw.moved=true;const ht=(performance.now()-sw.t0)/1000;
    sw.hold=!sw.moved&&ht>=HOLD_T;sw.k=sw.hold?chargeK(ht):0;if(sw.hold&&!sw.fx1){sw.fx1=true;sfx('draw');}if(sw.hold&&sw.k>=1&&!sw.fx2){sw.fx2=true;sfx('ready');}
    const W=curW();
    if(sw.hold&&!wBroken()&&W.id==='yari'){sw.brace=(sw.brace||0)-gdt;if(sw.brace<=0){const a=holdAim(sw),e=autoAim(a,140*reachMul('yari'),0.7,false);if(e){sw.brace=0.45;skCut(bodyLine(Math.atan2(e.y-12-(P.y-12),e.x-P.x),170*reachMul('yari')),2800,{dmgBonus:1,ab:{pierce:true},kind:'spear',stunT:0.5+0.2*up('yari','brace'),fam:++FAM,blood:false,skill:false,hr:8,wid:P.wpn?P.wpn.uid:0,noPoise:false});sfx('tap',true);text(e.x,e.y-50,'BRACED',C.steel);}}}
    if(sw.hold&&!wBroken()&&W.id==='kusari'){sw.whirl=(sw.whirl||0)-gdt;if(sw.whirl<=0){sw.whirl=0.4;const src={team:'p',ab:{},hits:new Set(),fam:++FAM,dmgBonus:0,aura:true,noPoise:true,kind:'chain',child:true};let n=0;for(const e of [...S.enemies]){if(e.state==='spawn'||e.smoke)continue;const d=dist(e,P);if(d<80+e.r&&d>24){hitEnemy(e,src);n++;}}if(n)wear(0.5);if(Math.random()<0.6)sfx('eswing');}}
  }
}
function holdAim(sw){const t=sw.pts[0];let a=Math.atan2(t.y-(P.y-12),t.x-P.x);if(!S.touchUI&&S.mouseSeen)a=Math.atan2(S.aim.y-(P.y-12),S.aim.x-P.x);const e=autoAim(a,520,0.3,false);return e?Math.atan2(e.y-12-(P.y-12),e.x-P.x):a;}

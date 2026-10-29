// ================= weapons in hand, the blood orb, tools, pattern skills =================
let WUID=1;
const curW=()=>WEAPONS[P.wpn?P.wpn.id:'reserve'];
const wBroken=()=>!!(P.wpn&&P.wpn.dur<=0);
const wUp=(n,id)=>up(id||curW().id,n);
const brokenLen=id=>0.6+0.1*up(id,'brk'),brokenCd=id=>1.35-0.1*up(id,'brk'),brokenTrick=id=>up(id,'brk')>=2&&id!=='musket';
const btOn=()=>!!(S.bt&&S.bt.t>0);
const btFor=id=>btOn()&&S.bt.id===id;
const reachMul=id=>{id=id||curW().id;return id==='reserve'?1:1+0.08*up(id,'reach');};
function wLen(){const W=curW();let L=W.id==='reserve'?shortestCut():W.len*reachMul(W.id)*(W.id==='katana'?1+0.12*up('katana','flow'):1);if(wBroken())L*=brokenLen(W.id);if(btFor('nodachi'))L*=1.8;return L;}
function wCdMul(tap){
  const W=curW();let m=(tap?W.tap:W.cd)*Math.pow(0.92,W.id==='reserve'?0:wUp('cd'))*(W.id==='reserve'?Math.pow(0.94,up('reserve','rcd')):1);
  if(wBroken())m*=brokenCd(W.id);if(P.wpn&&P.wpn.perk==='swift')m*=0.85;if(btFor('katana')||btFor('kusari'))m*=0.65;return m;
}
const wTrick=()=>!wBroken()||brokenTrick(curW().id);
function wDurMax(id,named){return Math.round(WEAPONS[id].dur*(1+0.2*up(id,'dur'))*(named?1.25:1));}
function makeWeapon(id,o={}){
  const max=Math.round(wDurMax(id,o.named)*(o.perk==='tough'?1.5:1)*(o.cursed?1.4:1)*(o.fine?1.3:1));
  return{uid:WUID++,id,max,dur:Math.max(1,Math.round(max*(o.worn??1))),name:o.name||(o.fine?'Fine '+WEAPONS[id].name.toLowerCase():WEAPONS[id].name),named:!!o.named,fine:!!o.fine,perk:o.perk||(o.fine?'keen':null),cursed:o.cursed||null};
}
function wName(w){return w?(w.cursed?`Cursed ${w.name}`:w.name):WEAPONS.reserve.name;}
function equip(w){
  if(P.wpn&&P.wpn.cursed==='bound'&&P.wpn.dur>0){text(P.x,P.y-50,'THE CURSED BLADE WILL NOT LET GO',C.phase);sfx('deny');return false;}
  if(P.wpn)dropWeapon(P.wpn,P.x,P.y+14);
  brittleCheck(w);P.wpn=w;S.pickedWeapon=true;S.bt=null;S.reload=0;sfx('arm');S.wpnBanner={w,t:2.4};
  if(!META.wseen[w.id]){META.wseen[w.id]=true;saveMeta();text(P.x,P.y-74,`NEW AT THE FORGE: ${WEAPONS[w.id].name.toUpperCase()} MASTERY`,C.curse);}
  return true;
}
function brittleCheck(w){if(w&&S.gmx&&S.gmx.brittle&&!w.brittled){w.brittled=true;w.dur=Math.max(1,Math.ceil(w.dur/2));}}
function dropWeapon(w,x,y){const p=freeSpot(S.room,x,y,10);addObj(S.room,{kind:'weapon',w,x:p.x,y:p.y,z:12,vz:160});}
function wear(n,s){
  const w=P.wpn;if(!w||w.dur<=0)return;if(s&&s.wid&&s.wid!==w.uid)return;
  if(w.cursed==='brittle')n*=2;if(S.gmx)n*=S.gmx.wearMul;n*=1-0.25*up(w.id,'temper');const was=w.dur;w.dur=Math.max(0,w.dur-n);
  if(was>0&&w.dur<=0){featEvent('break');text(P.x,P.y-60,`${WEAPONS[w.id].name.toUpperCase()} BROKEN`,C.ash,true);sfx('gbreak');burst(P.x+S.face*10,P.y-16,18,C.steel,260,0.5,2);S.bt=S.bt&&S.bt.id===w.id?null:S.bt;S.shake+=4;}
  else if(was>w.max*0.2&&w.dur<=w.max*0.2){text(P.x,P.y-56,'CRACKING',C.ash);sfx('click');}
}
// ---------- the blood orb ----------
const orbMax=()=>100+20*up('orb','cap');
const healCost=()=>Math.round(40*S.mods.drinkCost)-5*up('orb','heal');
const mendCost=()=>50-6*up('orb','mend');
function btCost(){const W=curW();return Math.round(W.bt.cost*(1-0.1*wUp('btc'))*(P.wpn&&P.wpn.perk==='light'?0.8:1));}
function btTime(){const W=curW();return(W.bt.time||0)+up('orb','btime')+1.5*wUp('btp')+(W.id==='reserve'?up('reserve','rthirst'):0)+(P.wpn&&P.wpn.perk==='thirst'?2:0);}
function orbSpend(v){S.meter=Math.max(0,S.meter-v);S.full=false;}
function drinkBlood(){
  if(!playing()||S.drink)return;if(S.gmx&&S.gmx.noHeal){text(P.x,P.y-50,'NOTHING HEALS YOU HERE',C.ash);sfx('deny');return;}const need=healCost();
  if(S.meter<need-0.01){text(P.x,P.y-50,`HEAL NEEDS ${need} BLOOD`,C.ash);sfx('deny');return;}
  if(P.hp>=P.max){text(P.x,P.y-50,'SOUL ALREADY WHOLE',C.ash);sfx('deny');return;}
  S.drink={t:0,dur:CFG.drinkTime,need};S.swipe=null;sfx('drink');text(P.x,P.y-50,'DRINKING',C.blood);tutEvent('heal');
}
function mendWeapon(){
  if(!playing())return;const w=P.wpn;
  if(!w){text(P.x,P.y-50,'YOUR OWN BLADE IS PAST MENDING',C.ash);sfx('deny');return;}
  if(w.dur>=w.max){text(P.x,P.y-50,'NOTHING TO MEND',C.ash);sfx('deny');return;}
  const c=mendCost();if(S.meter<c-0.01){text(P.x,P.y-50,`MEND NEEDS ${c} BLOOD`,C.ash);sfx('deny');return;}
  orbSpend(c);w.dur=w.max;text(P.x,P.y-50,'MENDED',C.hi);sfx('draw');burst(P.x+S.face*10,P.y-16,16,C.hi,180,0.5,2);S.bladeFlash=1;
}
function bloodthirst(){
  if(!playing())return;const W=curW(),c=btCost();
  if(btFor(W.id)){text(P.x,P.y-50,'ALREADY THIRSTING',C.ash);return;}
  if(S.meter<c-0.01){text(P.x,P.y-50,`BLOODTHIRST NEEDS ${c} BLOOD`,C.ash);sfx('deny');return;}
  orbSpend(c);if(P.wpn)P.wpn.dur=P.wpn.max;
  S.bt=W.bt.type==='strike'?{id:W.id,strike:true,t:25,max:25}:{id:W.id,t:btTime(),max:btTime()};
  text(P.x,P.y-64,W.bt.type==='strike'?'BLOODTHIRST · ONE STRIKE':'BLOODTHIRST',C.hi,true);sfx('ult');S.flash=0.12;S.shake+=5;burst(P.x,P.y-16,30,C.hi,300,0.6,3);
}
// ---------- drops, disarming, throwing ----------
function titleName(s){return s.split(' ').map(w=>w[0]+w.slice(1).toLowerCase()).join(' ');}
function enemyDrop(e){
  if(e.illusion||e.T.sumo||e.practice)return;
  if(e.disarmed||(S.gmx&&S.gmx.noDrops))return;
  let id=DROPMAP[e.T.weapon];const special=e.boss||isDuel(e);
  if(!id&&e.boss)id=pick(['katana','yari']);if(!id)return;
  if(!special&&Math.random()>(e.elite?0.6:0.22))return;
  let o={worn:special?1:rand(0.55,1)};
  if(special){const who=e.boss?titleName(e.T.name):(S.duel&&S.duel.D&&isDuel(e)&&e.T.duel?S.duel.D.name.split(' ')[1]:e.T.name);o={named:true,name:`${who}'s ${WEAPONS[id].name}`,perk:pick(NAMED_PERKS).id,worn:1};}
  else if(Math.random()<0.07)o.cursed=pick(CURSES).id;
  dropWeapon(makeWeapon(id,o),e.x,e.y);
}
function tryDisarm(e,force){
  if(!e||e.boss||e.disarmed||e.T.sumo||!DROPMAP[e.T.weapon]||!S.enemies.includes(e))return;
  if(!force&&Math.random()>(isDuel(e)?0.25:0.5))return;
  e.disarmed=true;text(e.x,e.y-70,'DISARMED',C.curse,true);sfx('clang');stunEnemy(e,1.0);
  const id=DROPMAP[e.T.weapon],w=makeWeapon(id,{worn:rand(0.5,0.9)});const a=Math.atan2(e.y-P.y,e.x-P.x);dropWeapon(w,e.x+Math.cos(a)*50,e.y+Math.sin(a)*50);
}
function throwWeapon(){
  if(!playing()||S.drink)return;const w=P.wpn;
  if(!w){text(P.x,P.y-50,'NOTHING TO THROW',C.ash);sfx('deny');return;}
  if(w.cursed==='bound'&&w.dur>0){text(P.x,P.y-50,'IT WILL NOT LEAVE YOUR HAND',C.phase);sfx('deny');return;}
  const tp=aimPoint(600,0.9,true),a=Math.atan2(tp.y-(P.y-12),tp.x-P.x),st={x:P.x,y:P.y-12},L=560;
  const cp=clipPts([st,rayTo({x:st.x,y:st.y},a,L,2)],['wall'],2);
  const dmg=({katana:2,yari:2,kanabo:4,kusari:2,musket:2,nodachi:3,tessen:2,bo:3,kama:2,naginata:3}[w.id]||2)-(w.dur<=0?1:0)+(w.perk==='keen'?1:0);
  const c=makeCut(cp.pts,1300,{team:'p',ab:w.id==='yari'||w.id==='naginata'?{pierce:true}:{},hr:w.id==='kanabo'||w.id==='bo'?16:11,kind:'thrown',wicon:w.id,noBlock:true,dmgBonus:dmg,fam:++FAM,thrown:true,clipAt:cp.hit});
  S.slashes.push(c);P.wpn=null;S.bt=null;S.reload=0;sfx('eswing');sfx('dash');S.face=Math.cos(a)>0?1:-1;S.anim={kind:'side',t:0,dir:{x:Math.cos(a),y:Math.sin(a)}};
  text(P.x,P.y-50,`${WEAPONS[w.id].name.toUpperCase()} THROWN`,C.bone);
}
// ---------- tools: kunai and shuriken, no weapon needed ----------
const toolMax=k=>k==='kunai'?3+up('tools','kunai'):2+up('tools','shuri');
function throwTool(k){
  if(!playing()||S.drink)return;if((S.tools[k]||0)<=0){text(P.x,P.y-50,k==='kunai'?'NO KUNAI LEFT':'NO SHURIKEN LEFT',C.ash);sfx('deny');return;}
  if(S.toolCd>0)return;S.tools[k]--;S.toolCd=0.25;tutEvent('tool');
  const tp=aimPoint(k==='kunai'?720:420,0.9,true),a0=Math.atan2(tp.y-(P.y-12),tp.x-P.x),st={x:P.x,y:P.y-12},td=up('tools','tdmg'),fam=++FAM;
  const spread=k==='kunai'?[0]:[-0.26,0,0.26],boom=k!=='kunai'&&capOn('tools','boom');
  for(const o of spread){const a=a0+o,L=k==='kunai'?720:400,cp=clipPts([st,rayTo({x:st.x,y:st.y},a,L,2)],['wall'],2);if(boom)cp.pts.push({x:P.x,y:P.y-12});
    S.slashes.push(makeCut(cp.pts,k==='kunai'?1600:1050,{team:'p',ab:{},hr:6,kind:k==='kunai'?'kunai':'shuriken',noBlock:true,dmgBonus:(k==='kunai'?1:0)+td,fam:k==='kunai'?fam:++FAM,famCap:boom?2:undefined,tool:true,tags:k==='kunai'&&capOn('tools','tags')}));}
  sfx('shuriken');S.face=Math.cos(a0)>0?1:-1;
}
function restockTools(chance){
  if(Math.random()>chance)return;const ks=['kunai','shuri'].filter(k=>S.tools[k]<toolMax(k));if(!ks.length)return;const k=pick(ks);S.tools[k]++;
  S.parts.push({x:P.x,y:P.y-30,vx:0,vy:-40,life:0.5,max:0.5,size:1,col:C.steel});
}
// ---------- per-weapon cuts ----------
function bodyLine(dirA,L,from){const st={x:P.x+Math.cos(dirA)*(from??10),y:P.y-10+Math.sin(dirA)*(from??10)};return clipPts([st,rayTo({x:st.x,y:st.y},dirA,L,2)],['wall'],2).pts;}
function gunTap(target,o={}){
  const W=curW();if(W.style!=='gun')return false;
  const blood=btFor('musket');
  if(!blood&&wBroken())return false;
  if(!blood&&S.reload>0){if(!o.aimed)activeReload();else{text(P.x,P.y-50,'NOT LOADED',C.ash);sfx('deny');}return true;}
  if(!o.aimed){const da=Math.atan2(target.y-(P.y-12),target.x-P.x),e=autoAim(da,760,0.35,false);if(e)target={x:e.x,y:e.y-12};}
  const a=Math.atan2(target.y-(P.y-12),target.x-P.x),perfect=S.perfect,smoke=S.smokeShot,k=o.k||0;
  const dmg=(blood?9:W.shot.dmg-1)+(P.wpn.perk==='keen'?1:0)+(perfect?2:0)+(smoke?3:0)+(o.aimed?1+Math.round(2*k):0);
  fireBall(a,{len:blood?1200:o.aimed?1000:W.shot.len,speed:blood?7000:5200,hr:blood?9:5,blood:blood||perfect,dmg,pierce:blood||perfect||k>=1,noBlock:blood,quiet:true});
  sfx('gun');S.shake+=blood?10:6;S.kick.x-=Math.cos(a)*10;S.kick.y-=Math.sin(a)*10;P.kx-=Math.cos(a)*(blood?380:220);P.ky-=Math.sin(a)*(blood?380:220);
  const st={x:P.x+Math.cos(a)*14,y:P.y-12+Math.sin(a)*14};
  for(let i=0;i<14;i++)S.parts.push({x:st.x+Math.cos(a)*8,y:st.y+Math.sin(a)*8,vx:Math.cos(a+rand(-0.5,0.5))*rand(40,160),vy:Math.sin(a+rand(-0.5,0.5))*rand(40,160)-20,life:rand(0.4,0.9),max:0.9,size:2,col:Math.random()<0.3?'#ffd27a':'#8a8090'});
  if(perfect){S.perfect=false;text(P.x,P.y-60,'PERFECT SHOT',C.mon);}if(smoke){S.smokeShot=false;text(P.x,P.y-60,'FROM THE SMOKE',C.smoke);}
  if(blood){S.bt=null;text(P.x,P.y-60,'BLOOD BULLET',C.hi,true);S.flash=0.1;}else{wear(1);startReload();}
  S.cdTap=S.cdTapMax=0.25;S.cdLock=CFG.cutLock;S.face=Math.cos(a)>0?1:-1;S.anim={kind:'side',t:0,dir:{x:Math.cos(a),y:Math.sin(a)}};
  return true;
}
// soft lock-on: the closest foe inside the cone you are facing, otherwise the closest foe in range
function autoAim(dirA,range,cone,fallback=true){let best=null,bs=1e9;for(const e of S.enemies){if(e.state==='spawn'||e.state==='hide'||e.smoke||e.illusion&&false)continue;const dx=e.x-P.x,dy=e.y-12-(P.y-12),d=Math.hypot(dx,dy);if(d>range)continue;
  const da=Math.abs(Math.atan2(Math.sin(Math.atan2(dy,dx)-dirA),Math.cos(Math.atan2(dy,dx)-dirA)));const sc=da<=cone?d*(1+da):fallback?1e5+d:1e9;if(sc<bs){bs=sc;best=e;}}return bs<1e9?best:null;}
const facingA=()=>S.touchUI||!S.mouseSeen?(S.face>0?0:Math.PI):Math.atan2(S.aim.y-(P.y-12),S.aim.x-P.x);
function aimPoint(range,cone,fallback){const e=autoAim(facingA(),range,cone,fallback);return e?{x:e.x,y:e.y-12}:{x:P.x+Math.cos(facingA())*100,y:P.y-12+Math.sin(facingA())*100};}
function updateWeapons(gdt){
  if(S.reload>0){S.reload-=gdt;if(S.reload<=0){S.reload=0;if(P.wpn&&P.wpn.id==='musket'&&!wBroken())sfx('click');}}
  if(S.toolCd>0)S.toolCd-=gdt;
  updateSkills(gdt);
  if(S.bt&&S.bt.t>0){S.bt.t-=gdt;if(S.bt.t<=0){S.bt=null;text(P.x,P.y-50,'THE THIRST FADES',C.ash);}}
  if(P.wpn&&P.wpn.cursed==='drain'&&S.meter>0)S.meter=Math.max(0,S.meter-1.6*gdt);
  if(S.wpnBanner){S.wpnBanner.t-=gdt;if(S.wpnBanner.t<=0)S.wpnBanner=null;}
}

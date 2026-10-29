// ================= game modes: the daily and weekly challenges, trials, hell levels, infinite, waves, boss rush =================
// S.gm describes the run (id, modifiers, seed...). S.gmx is what the modifiers add up to; the core reads S.gmx.
const MODIFIERS=[
  // trade-offs
  {id:'ippon',name:'Ippon',kind:'trade',mult:1.6,desc:'Every foe dies to one cut. So do you.'},
  {id:'kaze',name:'Kaze',kind:'trade',mult:1.2,desc:'You move a third faster and dash twice as often, but foes take more cutting.'},
  {id:'glass',name:'Glass blade',kind:'trade',mult:1.2,desc:'Foes have half their health, but weapons break twice as fast.'},
  {id:'ironbody',name:'Iron body',kind:'trade',mult:1.3,desc:'+3 max soul, but nothing heals you.'},
  {id:'vampire',name:'Vampire',kind:'trade',mult:1.25,desc:'Lose a soul in every new fight. Every fourth kill heals one.'},
  {id:'brush',name:'Only the brush',kind:'trade',mult:1.5,desc:'Your weapon cannot cut. Techniques recharge three times faster.'},
  {id:'oath',name:'Rōnin\'s oath',kind:'trade',mult:1.15,desc:'Foes drop no weapons, but yours never breaks.'},
  {id:'wanderer',name:'Wanderer',kind:'trade',mult:1.1,desc:'No shops anywhere, but foes drop twice the mon.'},
  {id:'moonless',name:'Moonless',kind:'trade',mult:1.2,desc:'Near total darkness, but half again as many shards.'},
  {id:'berserk',name:'Berserk',kind:'trade',mult:1.15,desc:'Your cuts grow stronger as your combo climbs.'},
  {id:'haste',name:'Haste',kind:'trade',mult:1.3,desc:'Everything, you included, moves a third faster.'},
  // pain
  {id:'elite',name:'Elite blood',kind:'pain',mult:1.4,desc:'Every foe is elite.'},
  {id:'horde',name:'Horde',kind:'pain',mult:1.3,desc:'Half again as many foes.'},
  {id:'fuse',name:'Short fuse',kind:'pain',mult:1.35,desc:'Foes wind up 30% faster.'},
  {id:'enraged',name:'Enraged lords',kind:'pain',mult:1.25,desc:'Lords and wardens start enraged.'},
  {id:'bounty',name:'Bounty',kind:'pain',mult:1.3,desc:'A sword saint joins every third fight.'},
  {id:'tide',name:'Rising tide',kind:'pain',mult:1.3,desc:'Ninety seconds a floor. Then the water takes a soul every ten.'},
  {id:'fog',name:'Fog',kind:'pain',mult:1.05,desc:'No minimap.'},
  {id:'brittle',name:'Brittle',kind:'pain',mult:1.1,desc:'Every weapon starts half broken.'},
  {id:'stingy',name:'Stingy',kind:'pain',mult:1.1,desc:'Foes drop half the mon.'},
  {id:'iron',name:'Iron foes',kind:'pain',mult:1.5,desc:'Foes have twice the health.'},
  {id:'noslow',name:'No breath',kind:'pain',mult:1.1,desc:'Parrying no longer slows time.'},
  // gifts
  {id:'novice',name:'Novice blessing',kind:'gift',mult:0.7,desc:'+2 max soul.'},
  {id:'second',name:'Second wind',kind:'gift',mult:0.75,desc:'One free revive.'},
  {id:'lucky',name:'Lucky',kind:'gift',mult:0.8,desc:'Better treasure and more mon.'}];
const MOD_BY={};MODIFIERS.forEach(m=>MOD_BY[m.id]=m);
function computeGmx(mods){
  const x={hpMul:1,bossHpMul:1,eliteAll:false,enemyN:1,coinMul:1,shardMul:1,wearMul:1,noHeal:false,noDrops:false,noShops:false,brush:false,speed:1,dark:false,tide:false,fog:false,bounty:false,enraged:false,ippon:false,vampire:false,berserk:false,teleMul:1,maxAdd:0,moveMul:1,dashMul:1,noslow:false,second:false,lucky:false,brittle:false};
  for(const id of mods||[])switch(id){
    case'ippon':x.ippon=true;x.bossHpMul*=0.25;break;case'kaze':x.moveMul*=1.33;x.dashMul*=0.5;x.hpMul*=1.5;x.bossHpMul*=1.3;break;
    case'glass':x.hpMul*=0.5;x.bossHpMul*=0.6;x.wearMul*=2;break;case'ironbody':x.maxAdd+=3;x.noHeal=true;break;case'vampire':x.vampire=true;break;
    case'brush':x.brush=true;break;case'oath':x.noDrops=true;x.wearMul=0;break;case'wanderer':x.noShops=true;x.coinMul*=2;break;
    case'moonless':x.dark=true;x.shardMul*=1.5;break;case'berserk':x.berserk=true;break;case'haste':x.speed*=1.33;break;
    case'elite':x.eliteAll=true;break;case'horde':x.enemyN*=1.5;break;case'fuse':x.teleMul*=0.7;break;case'enraged':x.enraged=true;break;
    case'bounty':x.bounty=true;break;case'tide':x.tide=true;break;case'fog':x.fog=true;break;case'brittle':x.brittle=true;break;
    case'stingy':x.coinMul*=0.5;break;case'iron':x.hpMul*=2;x.bossHpMul*=1.6;break;case'noslow':x.noslow=true;break;
    case'novice':x.maxAdd+=2;break;case'second':x.second=true;break;case'lucky':x.lucky=true;x.coinMul*=1.5;break;
    case'hellhp':x.hpMul*=1.06;x.bossHpMul*=1.06;break;}
  return x;
}
const modMult=mods=>(mods||[]).reduce((a,id)=>a*(MOD_BY[id]?MOD_BY[id].mult:1.06),1);
// ---------- seeds: the daily and weekly runs are the same for everyone ----------
function hashStr(s){let h=2166136261;for(const c of s){h^=c.charCodeAt(0);h=Math.imul(h,16777619)>>>0;}return h>>>0;}
function mulberry(a){return function(){a|=0;a=a+0x6D2B79F5|0;let t=Math.imul(a^a>>>15,1|a);t=t+Math.imul(t^t>>>7,61|t)^t;return((t^t>>>14)>>>0)/4294967296;};}
function withSeed(seed,fn){const r=Math.random,g=mulberry(seed);Math.random=g;try{return fn();}finally{Math.random=r;}}
function dailyCfg(weekly){
  const key=weekly?'week-'+weekNo():'day-'+dayKey(),seed=hashStr(key),rnd=mulberry(seed);
  const pool=MODIFIERS.filter(m=>m.kind!=='gift'&&m.id!=='fog'),mods=[];
  while(mods.length<(weekly?5:3)){const m=pool[Math.floor(rnd()*pool.length)].id;if(!mods.includes(m)&&!(m==='brush'&&mods.includes('ippon'))&&!(m==='ippon'&&mods.includes('brush')))mods.push(m);}
  return{key,seed,realm:Math.floor(rnd()*BIOMES.length),mods,diff:weekly?2.4:1.7};
}
// ---------- starting a mode ----------
const MODE_NAMES={story:'Descent',daily:'Daily challenge',weekly:'Weekly ordeal',trial:'Trial',hell:'Hell Level',infinite:'Infinite',waves:'Waves',rush:'Boss Rush'};
function startMode(id,o={}){
  let gm={id,mods:[],score:0,t0:Date.now()},realm=0;
  if(id==='daily'||id==='weekly'){const c=dailyCfg(id==='weekly');Object.assign(gm,{mods:c.mods,seed:c.seed,key:c.key,diff:c.diff,oneRealm:true,noRevive:true});realm=c.realm;}
  else if(id==='trial'){gm.mods=o.mods||[];realm=o.realm||0;gm.oneRealm=!!o.oneRealm;}
  else if(id==='hell'){gm.level=o.level||1;gm.mods=hellMods(gm.level);}
  else if(id==='infinite'){gm.twists=[];}
  else if(id==='waves'||id==='rush'){gm.arena=true;gm.wave=0;gm.idx=0;realm=id==='rush'?0:ri(0,BIOMES.length-1);gm.realm=realm;gm.noRevive=id==='rush';}
  S.gmNext=gm;startRun(realm,true);
}
function applyMode(){
  // called by startRun: S.gmNext becomes S.gm and the modifiers take hold
  S.gm=S.gmNext||{id:'story',mods:[]};S.gmNext=null;S.gmx=computeGmx(S.gm.mods);S.modeRules={noRevive:!!S.gm.noRevive};
  if(S.gmx.second)S.freeRevive=true;
}
function modeFloor(n){
  const gm=S.gm;
  if(gm&&gm.arena)return arenaFloor();
  const F=gm&&gm.seed?withSeed(gm.seed+n*7919,()=>genFloor(n)):genFloor(n);
  if(gm&&gm.diff)F.diff=gm.diff+(F.stage-1)*0.11;
  return F;
}
// ---------- the arena: one big room for waves and the boss rush ----------
function arenaFloor(){
  const gm=S.gm,bi=gm.realm||0,biome=BIOMES[bi],r={gx:0,gy:0,type:'arena',dist:0};
  Object.assign(r,{size:'b',doors:{},visited:false,seen:true,cleared:false,obs:[],haz:[],built:false,objs:[],pools:[],waves:null,enc:null});[r.w,r.h]=ROOM_SIZES.b;r.w=Math.max(r.w,VW);
  return{n:1,realm:bi,biome,stage:1,kind:'arena',bossStage:false,diff:1,rooms:new Map([[rkey(0,0),r]]),start:r,boss:r,gateOpen:true};
}
const RUSH_LIST=()=>BIOMES.flatMap(B=>[...B.minis,...B.bosses]);
function modeArenaStart(R){R.obs=[];R.haz=[];S.pending.push({t:1.2,spawn:true,fn:()=>arenaNext()});}
function arenaNext(){
  const gm=S.gm;if(!gm||S.dead>0)return;
  if(gm.id==='waves'){gm.wave++;const w=gm.wave;S.floor.diff=1+w*0.13;
    if(w%10===0){const B=BIOMES[Math.min(BIOMES.length-1,Math.floor((w-1)/10))],key=w%20===0?pick(B.bosses):pick(B.minis);const e=spawnEnemy(key,{boss:true,pos:{x:S.room.w/2,y:S.room.h*0.36}});S.boss=e;S.banner={name:`WAVE ${w}`,title:BOSSES[key].name,t:2};sfx('gong');return;}
    const tier=Math.min(BIOMES.length-1,Math.floor((w-1)/3)),pool=[...new Set(BIOMES.slice(Math.max(0,tier-1),tier+1).flatMap(B=>B.pool))],n=Math.min(12,Math.round((2+w*0.55)*(S.gmx?S.gmx.enemyN:1)));
    const list=[];for(let i=0;i<n;i++)list.push({key:pick(pool),elite:Math.random()<Math.min(0.35,0.02*w)});S.room.waves=[list];spawnWave(S.room);
    S.banner={name:`WAVE ${w}`,title:w<4?'Hold the ring':`${n} foes`,t:1.4};sfx('gong');return;}
  if(gm.id==='rush'){const L=RUSH_LIST();if(gm.idx>=L.length){modeVictory();return;}const key=L[gm.idx],bi=BIOMES.findIndex(B=>B.minis.includes(key)||B.bosses.includes(key));
    S.floor.diff=bi+1;const e=spawnEnemy(key,{boss:true,pos:{x:S.room.w/2,y:S.room.h*0.36}});S.boss=e;S.lordHurt=0;S.banner={name:`${gm.idx+1} / ${L.length}`,title:BOSSES[key].name,t:2.2};sfx('gong');S.shake+=6;}
}
function modeArenaTick(R){
  const gm=S.gm;if(!gm||gm.id!=='waves')return;
  if(S.enemies.length===0&&!S.pending.some(p=>p.spawn)){const w=gm.wave;gm.score=w;
    if(w>0){text(P.x,P.y-60,`WAVE ${w} HELD`,C.spirit,true);if(w%5===0){heal(1);S.pending.push({t:0.8,fn:()=>offerPerk()});}if(w%3===0)scatter(R,'coin',R.w/2,R.h/2,ri(3,6));}
    S.pending.push({t:w%5===0?2.6:1.6,spawn:true,fn:()=>arenaNext()});}
}
function modeBossDown(e){
  const gm=S.gm;
  if(gm.id==='rush'){gm.idx++;gm.score=gm.idx;if(S.lordHurt===0)featEvent('lord');else{fAdd('lords');}S.lordHurt=null;heal(2);
    S.pending.push({t:1.6,spawn:true,fn:()=>{if(gm.idx%4===0&&gm.idx<RUSH_LIST().length)offerPerk();S.pending.push({t:gm.idx%4===0?1.0:0.4,spawn:true,fn:()=>arenaNext()});}});return;}
  if(gm.id==='waves'){fAdd('lords');S.pending.push({t:1.2,fn:()=>offerPerk()});}
}
// ---------- infinite: the hells go on, and every lord leaves a curse ----------
function infiniteTwist(){
  const gm=S.gm;if(S.floor.n<totalFloorsBase())return;
  const pool=MODIFIERS.filter(m=>m.kind==='pain'&&!gm.mods.includes(m.id));if(!pool.length){gm.mods.push('hellhp');}else{const m=pick(pool);gm.mods.push(m.id);S.pending.push({t:3.4,fn:()=>{S.banner={name:'A NEW TORMENT',title:m.name+' · '+m.desc,t:3};}});}
  S.gmx=computeGmx(gm.mods);recomputeMods();
}
const totalFloorsBase=()=>BIOMES.length*FPR;
// ---------- hell levels ----------
const HELL_ORDER=['fuse','elite','horde','enraged','stingy','brittle','bounty','noslow','fog','tide','iron','hellhp','hellhp','hellhp','hellhp','hellhp','hellhp','hellhp','hellhp','hellhp'];
const hellMods=L=>HELL_ORDER.slice(0,Math.max(1,Math.min(20,L)));
function openHellPick(){
  const top=Math.min(20,(META.hell||0)+1);
  openChooser({eyebrow:'Shrine keeper',title:'Which hell?',sub:'Each level keeps every curse below it and adds one more. Escape to open the next.',cards:Array.from({length:top},(_, i)=>{const L=i+1,m=HELL_ORDER[i];return{kind:`Hell Level ${L}${L<=(META.hell||0)?' · escaped':''}`,name:m==='hellhp'?'Thicker hides':MOD_BY[m].name,desc:m==='hellhp'?'Foes have 6% more health.':MOD_BY[m].desc};}).reverse(),cancel:'Not yet',pick:i=>startMode('hell',{level:top-i})});
}
function hellCleared(){const L=S.gm.level||1;if(L>(META.hell||0)){META.hell=L;META.koban=(META.koban||0)+20+L*5;S.featBanner={name:`HELL LEVEL ${L} ESCAPED`,title:`+${20+L*5} koban · Level ${Math.min(20,L+1)} opens`,t:3};}saveMeta();}
// ---------- trials: choose your own curses ----------
let TRIAL={mods:[],realm:0};
function openTrials(){
  const cards=MODIFIERS.map(m=>({kind:(TRIAL.mods.includes(m.id)?'✓ ':'')+m.kind+' · ×'+m.mult,name:m.name,desc:m.desc}));
  cards.push({kind:'Score ×'+modMult(TRIAL.mods).toFixed(2),name:'Begin the trial',desc:TRIAL.mods.length?TRIAL.mods.map(id=>MOD_BY[id].name).join(', '):'No curses chosen yet.'});
  openChooser({eyebrow:'Trials',title:'Choose your curses',sub:'Pick any. Each one changes the score.',cards,cancel:'Leave',pick:i=>{
    if(i===MODIFIERS.length){const top=Math.min(BIOMES.length-1,META.realms||0);openChooser({eyebrow:'Trials',title:'Where does it begin?',cards:BIOMES.slice(0,top+1).map((B,j)=>({kind:`Realm ${j+1}`,name:B.name,desc:'The trial ends at this realm\'s lord.'})),cancel:'Back',onCancel:openTrials,pick:j=>startMode('trial',{mods:TRIAL.mods.slice(),realm:j,oneRealm:true})});return;}
    const id=MODIFIERS[i].id;TRIAL.mods=TRIAL.mods.includes(id)?TRIAL.mods.filter(x=>x!==id):TRIAL.mods.concat(id);openTrials();}});
}
// ---------- the gate: how do you descend? ----------
ACTS.gate=function(o){
  const dc=dailyCfg(false),wc=dailyCfg(true),d=META.daily||{},cards=[
    {kind:'Story',name:'The descent',desc:'A hundred floors to the man who took your blade.',go:'story'},
    {kind:d.done===dc.key?'Cleared today':'Daily challenge',name:BIOMES[dc.realm].name,desc:dc.mods.map(id=>MOD_BY[id].name).join(' · ')+`. Same run for everyone today. Streak ${d.streak||0}.`,go:'daily'},
    {kind:d.wdone===wc.key?'Cleared this week':'Weekly ordeal',name:BIOMES[wc.realm].name,desc:wc.mods.map(id=>MOD_BY[id].name).join(' · ')+'. Harder. 100 koban the first time each week.',go:'weekly'},
    {kind:npcHere('kappa')?'Waves':'Locked',name:'Waves',desc:npcHere('kappa')?`Hold the ring. Best ${(META.rec&&META.rec.waves)||0}.`:'Beat a kappa at sumo twice.',go:'waves',dis:!npcHere('kappa')},
    {kind:npcHere('usagi')?'Infinite':'Locked',name:'Infinite',desc:npcHere('usagi')?`The hells never end. Deepest ${(META.rec&&META.rec.infinite)||0}.`:'Reach floor 50.',go:'infinite',dis:!npcHere('usagi')},
    {kind:npcHere('tengu')?'Boss Rush':'Locked',name:'Boss Rush',desc:npcHere('tengu')?'Every warden and lord, back to back.':'Fell five lords.',go:'rush',dis:!npcHere('tengu')},
    {kind:npcHere('keeper')?'Hell Levels':'Locked',name:'Hell Levels',desc:npcHere('keeper')?`Escaped up to level ${META.hell||0}.`:'Escape the hundred hells once.',go:'hell',dis:!npcHere('keeper')},
    {kind:npcHere('keeper')?'Trials':'Locked',name:'Trials',desc:npcHere('keeper')?'Pick your own curses for a score.':'Escape the hundred hells once.',go:'trial',dis:!npcHere('keeper')}];
  openChooser({eyebrow:'The gate',title:'How do you descend?',cards,cancel:'Not yet',pick:i=>{const g=cards[i].go;
    if(g==='story')storyGate();else if(g==='hell')openHellPick();else if(g==='trial')openTrials();else startMode(g);}});
};
function storyGate(){startMode('story');}
// ---------- winning a one-realm run, and the scoreboard ----------
function modeScore(){
  const gm=S.gm,st=S.stats||{};if(!gm)return 0;
  if(gm.id==='waves')return gm.wave*100+(st.kills||0)*5;
  if(gm.id==='rush')return gm.idx*250;
  if(gm.id==='infinite')return S.floor?S.floor.n*100:0;
  const floors=S.floor?((S.floor.stage||1)-1):0;return Math.round((floors*100+(st.kills||0)*5+(st.bosses||0)*200+(gm.won?1000:0))*modMult(gm.mods));
}
function modeVictory(){const gm=S.gm;if(!gm||S.mode!=='run'||gm.won)return;gm.won=true;if(gm.id==='rush')featEvent('rush');bankShards();giveShards(0);showSummary(true);}
function modeSummary(win){
  const gm=S.gm;if(!gm||gm.id==='story')return'';
  const sc=modeScore(),cells=[];META.rec=META.rec||{};let note='';
  if(gm.id==='daily'||gm.id==='weekly'){const d=META.daily=META.daily||{streak:0,best:0};const k=gm.id==='daily'?'day:'+gm.key:'week:'+gm.key;const prev=(META.rec[k]||0);META.rec[k]=Math.max(prev,sc);
    if(win){if(gm.id==='daily'&&d.done!==gm.key){const y=new Date(Date.now()-864e5);d.streak=d.last===dayKey(y)?(d.streak||0)+1:1;d.last=dayKey();d.done=gm.key;d.best=Math.max(d.best||0,d.streak);META.koban=(META.koban||0)+30;note=`+30 koban · streak ${d.streak}`;featEvent('daily');}
      if(gm.id==='weekly'&&d.wdone!==gm.key){d.wdone=gm.key;META.koban=(META.koban||0)+100;note='+100 koban';}}}
  if(gm.id==='waves')META.rec.waves=Math.max(META.rec.waves||0,gm.wave-(S.enemies.length?1:0));
  if(gm.id==='infinite')META.rec.infinite=Math.max(META.rec.infinite||0,S.floor?S.floor.n:0);
  if(gm.id==='rush'){const t=(Date.now()-gm.t0)/1000,r=META.rec.rush||{n:0,t:0};if(gm.idx>r.n||(gm.idx===r.n&&gm.won&&(!r.t||t<r.t)))META.rec.rush={n:gm.idx,t:gm.won?t:0};}
  saveMeta();try{featCheck();}catch(_){}
  const c=(l,v,k)=>`<div><span>${l}</span><b${k?` class="${k}"`:''}>${v}</b></div>`;
  return c('Mode',MODE_NAMES[gm.id]+(gm.level?' '+gm.level:''))+c('Score',sc.toLocaleString(),'shard')+(gm.id==='waves'?c('Waves',gm.wave):'')+(gm.id==='rush'?c('Bosses',`${gm.idx}/${RUSH_LIST().length}`):'')+(note?c('Reward',note):'')+(gm.mods.length?`<div class="wide"><span>Curses</span><b>${esc(gm.mods.filter(m=>MOD_BY[m]).map(m=>MOD_BY[m].name).join(', '))}</b></div>`:'');
}

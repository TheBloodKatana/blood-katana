// ================= feats, the bestiary, and the people who come to live at the shrine =================
// Everything here is driven by featEvent(kind, data), called from the moments that matter in a run.
function fstate(){if(!META.feat)META.feat={done:{},n:{}};if(!META.best)META.best={};if(!META.npc)META.npc={};return META.feat;}
const fN=k=>fstate().n[k]||0;
function fAdd(k,v){const f=fstate();f.n[k]=(f.n[k]||0)+(v==null?1:v);return f.n[k];}
const FEATS=[
  {id:'kills500',name:'Five hundred cuts',desc:'Cut down 500 foes.',goal:500,stat:()=>META.kills+(S.stats&&S.running?S.stats.kills:0),reward:['o:akagami',20]},
  {id:'kills2000',name:'Two thousand cuts',desc:'Cut down 2000 foes.',goal:2000,stat:()=>META.kills+(S.stats&&S.running?S.stats.kills:0),reward:[50]},
  {id:'lord1',name:'Lordslayer',desc:'Fell your first lord.',goal:1,stat:()=>fN('lords'),reward:[20]},
  {id:'lords10',name:'Ten lords',desc:'Fell ten lords.',goal:10,stat:()=>fN('lords'),reward:[40]},
  {id:'nohit',name:'Untouched',desc:'Fell a lord without being hit once.',goal:1,stat:()=>fN('nohit'),reward:[50]},
  {id:'realm5',name:'Halfway down',desc:'Reach the fifth realm.',goal:41,stat:()=>META.bestFloor,reward:[30]},
  {id:'win1',name:'The blade made whole',desc:'Escape the hundred hells.',goal:1,stat:()=>META.wins,reward:[100]},
  {id:'brokenwin',name:'Nothing but the blade',desc:'Escape carrying only the broken katana.',goal:1,stat:()=>fN('brokenwin'),reward:['o:sumi','k:sumi']},
  {id:'parry500',name:'Turned aside',desc:'Parry 500 blows.',goal:500,stat:()=>fN('parry'),reward:[30]},
  {id:'combo50',name:'Unbroken flow',desc:'Reach a 50 combo.',goal:50,stat:()=>fN('combo'),reward:[20],max:true},
  {id:'duels10',name:'Ten duels',desc:'Win 10 duels.',goal:10,stat:()=>fN('duels'),reward:['o:sohei']},
  {id:'break50',name:'Hard on steel',desc:'Break 50 weapons.',goal:50,stat:()=>fN('break'),reward:['k:rust']},
  {id:'traces1000',name:'The thousand-stroke brush',desc:'Cast 1000 techniques.',goal:1000,stat:()=>fN('tech'),reward:['s:sumi']},
  {id:'forge5',name:'The full rack',desc:'Forge all five shrine weapons.',goal:5,stat:()=>FORGE_W.filter(k=>up('hub','start_'+k)).length,reward:[40]},
  {id:'nodachi100',name:'Greatsword',desc:'Cut down 100 foes with the nodachi.',goal:100,stat:()=>fN('k_nodachi'),reward:['w:nodachi:lacquer']},
  {id:'bobamboo',name:'Bamboo and bamboo',desc:'Fell the lord of the Whispering Bamboo carrying the bō.',goal:1,stat:()=>fN('bobamboo'),reward:['w:bo:bamboo']},
  {id:'naginataduels',name:'Onna-musha',desc:'Win 5 duels with the naginata.',goal:5,stat:()=>fN('duel_naginata'),reward:['w:naginata:onna']},
  {id:'best50',name:'Half the scroll',desc:'Fill half the bestiary.',goal:50,stat:()=>bestPct(),reward:['s:rei']},
  {id:'best100',name:'Every name written',desc:'Fill the whole bestiary.',goal:100,stat:()=>bestPct(),reward:['o:hone','k:hone']},
  {id:'daily1',name:'Daily devotion',desc:'Clear a daily challenge.',goal:1,stat:()=>fN('daily'),reward:['o:tabibito',20]},
  {id:'daily7',name:'A week of devotion',desc:'Clear daily challenges 7 days in a row.',goal:7,stat:()=>(META.daily&&META.daily.best)||0,reward:['o:yuki','s:yuki']},
  {id:'daily14',name:'A fortnight of devotion',desc:'Clear daily challenges 14 days in a row.',goal:14,stat:()=>(META.daily&&META.daily.best)||0,reward:['k:hyo']},
  {id:'spin50',name:'Fortune\'s friend',desc:'Spin the wheel 50 times.',goal:50,stat:()=>(META.spin&&META.spin.total)||0,reward:[20]},
  {id:'waves20',name:'The tide holds',desc:'Survive 20 waves.',goal:20,stat:()=>(META.rec&&META.rec.waves)||0,reward:[30],max:true},
  {id:'rush',name:'Forty lords',desc:'Finish the Boss Rush.',goal:1,stat:()=>fN('rush'),reward:[80]},
  {id:'inf120',name:'Below the bottom',desc:'Reach floor 120 in Infinite.',goal:120,stat:()=>(META.rec&&META.rec.infinite)||0,reward:[50],max:true},
  {id:'hell5',name:'Fifth hell',desc:'Escape on Hell Level 5.',goal:5,stat:()=>(META.hell||0),reward:[60]},
  {id:'hell20',name:'Twentieth hell',desc:'Escape on Hell Level 20.',goal:20,stat:()=>(META.hell||0),reward:[200]},
];
function featCheck(){
  const f=fstate();let got=[];
  for(const ft of FEATS){if(f.done[ft.id])continue;if(ft.stat()>=ft.goal){f.done[ft.id]=1;got.push(ft);
    for(const r of ft.reward){if(typeof r==='number')META.koban=(META.koban||0)+r;else cosGrant(r);}}}
  if(got.length){saveMeta();const ft=got[0];S.featBanner={name:'FEAT · '+ft.name.toUpperCase(),title:featRewardText(ft),t:3};sfx('learn');}
  npcCheck();
}
function featRewardText(ft){return ft.reward.map(r=>typeof r==='number'?`${r} koban`:(COS[r]?COS[r].name:r)).join(' · ');}
// ---------- the bestiary: ten of each foe, one of each warden and lord ----------
const BEST_KEYS=()=>Object.keys(TYPES).filter(k=>!['dummy','sumo'].includes(k)&&TYPES[k].biome!=='hub'&&TYPES[k].biome!=='event'&&TYPES[k].biome!=='boss').concat(Object.keys(BOSSES));
const bestNeed=k=>BOSSES[k]?1:10;
function bestPct(){const ks=BEST_KEYS(),b=META.best||{};let s=0;for(const k of ks)s+=Math.min(1,(b[k]||0)/bestNeed(k));return Math.floor(s/ks.length*100);}
// ---------- events from the run ----------
function featEvent(kind,d){
  fstate();
  switch(kind){
    case'kill':{const e=d;if(e.practice||e.illusion||e.T.dummy)return;const k=e.key;META.best[k]=(META.best[k]||0)+1;fAdd('k_'+curW().id);if(e.boss)S.bossesThisRun=(S.bossesThisRun||0)+1;break;}
    case'lord':{fAdd('lords');if(S.lordHurt===0)fAdd('nohit');if(curW().id==='bo'&&S.floor&&S.floor.realm===1)fAdd('bobamboo');break;}
    case'parry':fAdd('parry');break;
    case'tech':fAdd('tech');break;
    case'break':fAdd('break');break;
    case'combo':{const f=fstate();f.n.combo=Math.max(f.n.combo||0,d);break;}
    case'duel':fAdd('duels');fAdd('duel_'+curW().id);break;
    case'win':if(!S.pickedWeapon)fAdd('brokenwin');break;
    case'ramen':fAdd('ramen');break;case'sumo':fAdd('sumo');break;case'dice':fAdd('dice');break;
    case'daily':fAdd('daily');break;case'rush':fAdd('rush');break;
  }
  if(kind!=='kill'||Math.random()<0.2)featCheck();
}
// ---------- people who come to the shrine ----------
const SHRINE_NPCS=[
  {id:'ramen',name:'Ramen master',spr:'ramen',task:'Eat at his stall in the descent three times',goal:3,stat:()=>fN('ramen'),give:'A bowl before every descent: +1 soul for the run'},
  {id:'kappa',name:'Kappa',spr:'kappa',task:'Beat a kappa at sumo twice',goal:2,stat:()=>fN('sumo'),give:'Opens Waves at the gate'},
  {id:'usagi',name:'Moon rabbit',spr:'usagi',task:'Reach floor 50',goal:50,stat:()=>META.bestFloor,give:'Opens Infinite at the gate'},
  {id:'tengu',name:'Old tengu',spr:'tengu',task:'Fell five lords',goal:5,stat:()=>fN('lords'),give:'Opens the Boss Rush at the gate'},
  {id:'gambler',name:'Tanuki gambler',spr:'gambler',task:'Win at chinchirorin five times',goal:5,stat:()=>fN('dice'),give:'Dice for shards at the shrine'},
  {id:'fox',name:'Fox maiden',spr:'kitsune',task:'Finish ten runs',goal:10,stat:()=>META.runs,give:'A blessing: start the next run with a boon'},
  {id:'ronin',name:'Wandering rōnin',spr:'wanderer',task:'Win five duels',goal:5,stat:()=>fN('duels'),give:'Sparring with a duelist at the shrine'},
  {id:'keeper',name:'Shrine keeper',spr:'miko',task:'Escape the hundred hells once',goal:1,stat:()=>META.wins,give:'Opens Trials and the Hell Levels at the gate'}];
const npcHere=id=>!!(META.npc||{})[id];
function npcCheck(){let n=null;for(const p of SHRINE_NPCS)if(!npcHere(p.id)&&p.stat()>=p.goal){META.npc[p.id]=1;n=p;}if(n){saveMeta();S.featBanner={name:n.name.toUpperCase()+' COMES TO THE SHRINE',title:n.give,t:3.2};sfx('gong');}}
const NPC_SPOTS={ramen:[-470,120],kappa:[-500,300],usagi:[500,-170],tengu:[-430,-170],gambler:[120,90],fox:[-110,90],ronin:[520,330],keeper:[0,-60]};
function placeShrineNpcs(R){
  const cx=R.w/2,cy=R.h/2;
  addObj(R,{kind:'npc',act:'collector',spr:'merchant',x:cx,y:cy+300,name:'The Collector',label:'ARMORY'});
  for(const p of SHRINE_NPCS)if(npcHere(p.id)){const [dx,dy]=NPC_SPOTS[p.id];addObj(R,{kind:'npc',act:'npc_'+p.id,spr:p.spr,x:cx+dx,y:cy+dy,name:p.name});}
}
ACTS.collector=()=>{ARM.tab='o';ARM.spin=null;menuOpen('armory',false);};
ACTS.npc_ramen=o=>openDialog({spr:'ramen',name:'Ramen master',title:'the shrine stall',text:'"You came all the way up for my broth? Sit. A bowl before you go down."',choices:[
  {label:S.hubBowl?'You already ate':'Eat a bowl (30 血晶) · +1 soul this descent',dis:S.hubBowl||META.shards<30,fn:()=>{META.shards-=30;META.ramen=(META.ramen||0)+1;S.hubBowl=true;saveMeta();sfx('heal');say('Smoky, rich, too much pepper. You feel heavier in the best way.');}},{label:'Leave',fn:closeDialog}]});
ACTS.npc_kappa=o=>openDialog({spr:'kappa',name:'Kappa',title:'the ring',text:`"You threw me twice. Now try a real fight: they come in waves, and they don't stop." Best: ${(META.rec&&META.rec.waves)||0} waves.`,choices:[{label:'Go to the waves',fn:()=>{closeDialog();startMode('waves');}},{label:'Leave',fn:closeDialog}]});
ACTS.npc_usagi=o=>openDialog({spr:'usagi',name:'Moon rabbit',title:'below the bottom',text:`"The hells go on past the castle, you know. Down and down, and every lord you pass leaves a curse behind." Deepest: floor ${(META.rec&&META.rec.infinite)||0}.`,choices:[{label:'Descend forever',fn:()=>{closeDialog();startMode('infinite');}},{label:'Leave',fn:closeDialog}]});
ACTS.npc_tengu=o=>openDialog({spr:'tengu',name:'Old tengu',title:'forty lords',text:`"Every lord and warden, one after another, no floors in between. I will be counting." ${META.rec&&META.rec.rush?`Best: ${META.rec.rush.n} bosses${META.rec.rush.t?' · '+fmtTime(META.rec.rush.t):''}.`:''}`,choices:[{label:'Begin the rush',fn:()=>{closeDialog();startMode('rush');}},{label:'Leave',fn:closeDialog}]});
ACTS.npc_gambler=o=>{const bet=b=>{META.shards-=b;const me=chinchiro(),him=chinchiro(),fmt=r=>r.f.map(n=>`[${n}]`).join('')+' '+r.name;let res;
    if(me.score>him.score){const w=me.score>=40?b*3:b*2;META.shards+=w;res=`You win ${w-b} 血晶.`;}else if(me.score<him.score)res=`You lose ${b} 血晶.`;else{META.shards+=b;res='A draw.';}saveMeta();sfx('dice');
    say(`You: ${fmt(me)}\nTanuki: ${fmt(him)}\n${res}`,[{label:`Again (${b} 血晶)`,dis:META.shards<b,fn:()=>bet(b)},{label:'Leave',fn:closeDialog}]);};
  openDialog({spr:'gambler',name:'Tanuki gambler',title:'shrine dice',text:`"Shards for stakes, up here. Only shards." You have ${META.shards}.`,choices:[{label:'Bet 20 血晶',dis:META.shards<20,fn:()=>bet(20)},{label:'Bet 50 血晶',dis:META.shards<50,fn:()=>bet(50)},{label:'Leave',fn:closeDialog}]});};
ACTS.npc_fox=o=>openDialog({spr:'kitsune',name:'Fox maiden',title:'a blessing',text:'"Ten times down and ten times back. Let me tie a blessing to you for the next one."',choices:[
  {label:META.foxBless?'Already blessed':'Be blessed (60 血晶) · start the next run with a boon',dis:!!META.foxBless||META.shards<60,fn:()=>{META.shards-=60;META.foxBless=1;saveMeta();sfx('learn');say('She ties a red thread around your wrist. It is warm.');}},{label:'Leave',fn:closeDialog}]});
ACTS.npc_ronin=o=>openDialog({spr:'wanderer',name:'Wandering rōnin',title:'sparring',text:'"I know a duelist who would cross blades with you. Wooden rules: nobody bleeds for real."',choices:[
  {label:'Spar with a sword saint',fn:()=>{closeDialog();startSpar();}},{label:'Leave',fn:closeDialog}]});
ACTS.npc_keeper=o=>openDialog({spr:'miko',name:'Shrine keeper',title:'the deeper hells',text:`"You came back. Most do not. There are worse hells than the hundred, if you want them." Hell Level cleared: ${META.hell||0}.`,choices:[
  {label:'Hell Levels',fn:()=>{closeDialog();openHellPick();}},{label:'Trials',fn:()=>{closeDialog();openTrials();}},{label:'Leave',fn:closeDialog}]});
function startSpar(){
  const R=S.room,e=spawnEnemy(pick(['kensei','nitoryu','sojutsu']),{pos:{x:clamp(P.x+170,WALL+60,R.w-WALL-60),y:P.y},quick:true,duel:true});if(!e)return;
  e.practice=true;e.spar=true;S.tutSafe=true;S.banner={name:'SPARRING',title:'Cut them down. Nobody bleeds for real',t:2};sfx('gong');
}
function fmtTime(t){const m=Math.floor(t/60),s=Math.floor(t%60);return`${m}:${String(s).padStart(2,'0')}`;}
// ---------- the archivist keeps the feats and the bestiary ----------
MENUS.feats=function(){const f=fstate();
  menuShow(`<div class="mv-head"><div class="mv-title">Feats</div><div class="sh-bal"><span>${Object.keys(f.done).length}/${FEATS.length}</span></div><button class="btn ghost mv-x" type="button" data-m="back">Back</button></div>
    <div class="mv-body sh-body"><div class="ft-list">${FEATS.map(ft=>{const v=Math.min(ft.goal,ft.stat()),d=!!f.done[ft.id];return`<div class="ft${d?' done':''}"><b>${esc(ft.name)}</b><span>${esc(ft.desc)}</span><i>${esc(featRewardText(ft))}</i><em>${d?'Done':`${v}/${ft.goal}`}</em><div class="ftbar"><div style="width:${v/ft.goal*100}%"></div></div></div>`;}).join('')}</div>
    <div class="set-sec"><h3>At the shrine</h3><div class="ft-list">${SHRINE_NPCS.map(p=>{const v=Math.min(p.goal,p.stat()),d=npcHere(p.id);return`<div class="ft${d?' done':''}"><b>${esc(p.name)}</b><span>${esc(p.task)}.</span><i>${esc(p.give)}</i><em>${d?'Here':`${v}/${p.goal}`}</em><div class="ftbar"><div style="width:${v/p.goal*100}%"></div></div></div>`;}).join('')}</div></div></div>`,'feats');$('menuInner').classList.add('wide');};
MENUS.bestiary=function(){const b=META.best||{},ks=BEST_KEYS();
  menuShow(`<div class="mv-head"><div class="mv-title">Bestiary</div><div class="sh-bal"><span>${bestPct()}%</span></div><button class="btn ghost mv-x" type="button" data-m="back">Back</button></div>
    <div class="mv-body sh-body"><div class="bs-grid">${ks.map(k=>{const T=TYPES[k]||BOSSES[k],n=b[k]||0,need=bestNeed(k),seen=n>0;return`<div class="bs${n>=need?' full':''}${BOSSES[k]?' boss':''}"><canvas data-spr="${seen?(T.look||k):''}" width="36" height="36"></canvas><b>${seen?esc(T.name):'???'}</b><span>${seen?esc(T.title||T.desc||''):''}</span><em>${Math.min(n,need)}/${need}</em></div>`;}).join('')}</div></div>`,'bestiary');
  $('menuInner').classList.add('wide');
  for(const cv of $('menuInner').querySelectorAll('canvas[data-spr]')){const sp=SPR[cv.dataset.spr];const g=cv.getContext('2d');g.imageSmoothingEnabled=false;if(!sp){g.fillStyle='#2e2731';g.fillRect(12,8,12,22);continue;}const img=sp.r[0],s=Math.min(36/img.width,36/img.height);g.drawImage(img,(36-img.width*s)/2,36-img.height*s,img.width*s,img.height*s);}
};

// ================= core: constants, settings, helpers, audio, pixel plotting =================
const VH=600,PX=2,LH=VH/PX,WALL=40,WP=WALL/PX,DW=46;
// the view is always 600 tall; its width follows the screen so the game fills phones edge to edge
const viewW=()=>{const a=Math.min(2.4,Math.max(1.5,(innerWidth||900)/Math.max(1,innerHeight||600)));return Math.round(VH*a/4)*4;};
let VW=viewW(),LW=VW/PX;
const $=id=>document.getElementById(id);
const C={ink:'#110e12',bone:'#ece4d7',ash:'#968b97',blood:'#b8142a',hi:'#ff4a5c',spirit:'#93dcca',steel:'#c4ccd2',curse:'#d9a648',phase:'#b48cff',line:'#2e2731',out:'#000000',white:'#ffffff',dark:'#1a1220',
  mon:'#e8c15a',shard:'#ff3355',water:'#6ec8ff',fox:'#ff9a3c',web:'#e8e8f2',ice:'#bfe8ff',fire:'#ff7a2a',wind:'#bfe6b0',poison:'#9ad05a',duel:'#ff8a3a',smoke:'#8a8090'};
const RM=matchMedia('(prefers-reduced-motion: reduce)').matches;
const PFONT='Silkscreen, monospace';

// ---------- abilities (debug table: always-on for normal cuts / blood strike) ----------
const ABILS=[
  ['curve','Curved path','Follows your swipe instead of a straight line'],
  ['teleport','Slide','You slide to wherever the cut stops'],
  ['ricochet','Ricochet','Needs Slide. Cuts aimed at a wall bounce off it and you slide along'],
  ['instant','Instant','The whole cut lands at once and cannot be read'],
  ['echo','Echo','The same cut repeats a moment later'],
  ['cross','Cross','Adds a second cut across the middle'],
  ['triple','Triple','Two parallel cuts beside it'],
  ['linger','Linger','Trail stays as a damaging wall that blocks'],
  ['pierce','Pierce','Breaks enemy trails and guards instead of stopping'],
  ['burst','Burst','Blast at the end of the cut'],
  ['stun','Stun','Hits stun the enemy'],
  ['drain','Drain','Kills restore one soul'],
  ['wide','Wide','Hit width ×2.5'],
  ['wave','Wind wave','A blade of wind flies on past the end of the cut'],
  ['chain','Chain lightning','Hits arc to two nearby foes'],
  ['vortex','Vortex','Foes near the cut are dragged into it'],
  ['ghost','Shadow clone','A shadow repeats your cut, mirrored through you'],
  ['kunai','Kunai','Every third cut throws three kunai at the nearest foe'],
  ['fire','Onibi fire','Cuts leave a burning trail']
];
const ABDEF={normal:{},ult:{pierce:true,cross:true,burst:true,wide:true}};
// every ability that adds extra cuts or movement has its own cooldown; click slashes only carry the on-hit ones
const ABCD={teleport:0,echo:1.4,cross:0.9,triple:1.1,ghost:1.6,wave:1.0,burst:1.2,vortex:1.8,fire:2.2,linger:1.8,kunai:1.6,chain:0.7,instant:1.2};
const ABLBL={teleport:'SLIDE',echo:'ECHO',cross:'CROSS',triple:'TWIN',ghost:'SHADE',wave:'WIND',burst:'BURST',vortex:'VORTX',fire:'FIRE',linger:'WALL',kunai:'KUNAI',chain:'CHAIN',instant:'INSTA'};
const TAP_ABS=['stun','chain','drain','pierce'];
for(const [k] of ABILS){ABDEF.normal[k]=ABDEF.normal[k]||false;ABDEF.ult[k]=ABDEF.ult[k]||false;}

const DEF={
  moveSpeed:230,dashSpeed:820,dashTime:0.15,dashCd:1.0,maxHp:5,
  lengthBase:150,lengthMax:420,killGain:10,hitGain:1.5,parryGain:6,
  slashMin:300,slashMax:2600,tapSpeed:1500,tapRadius:44,tapCd:0.42,cutCdBase:0.3,cutCdLen:0.42,cutLock:0.1,slideCd:2.4,drinkTime:0.6,hitRadius:9,ultDmg:3,ultWidth:14,lingerTime:1.5,echoDelay:0.25,burstRadius:70,
  slideSpeed:1700,slideMax:300,ricoBonus:220,ricoMax:3,
  enemyHpMul:1,enemySpeed:150,eSlashMul:1,telegraph:0.6,eCooldown:1.1,recover:0.55,bossHpMul:1,roomEnemyMul:1,
  aiReaction:0.12,dodgeChance:0.45,parryChance:0.35,feintChance:0.25,aiChaos:0.5,poiseHits:3,
  timeScale:1,slowmo:0.3,parrySlow:0.25,parrySlowTime:0.6,trailLinger:0.2,parryGrace:0.1,parryGraceTut:0.45,camLead:0.15,darkness:1,
  hitPauseMul:1,hitShake:1,sfxVol:0.7,musicVol:0.5,startFloor:1,shardMul:1,stagesPerBiome:2,
  trailBlocks:true,parrySlowOn:true,hitPause:true,cutRecovery:true,poise:true,aiReadSpam:true,tapNoParry:false,abilityCds:true,tapAbilities:false,
  sound:true,music:true,dev:false,vibe:true,flashes:true,tsize:1,topac:0.8,lighting:true,ambient:true,corpses:true,cursor:true,minimap:true,
  slowmoOn:false,noTechCd:false,enemyAttack:true,enemyMove:true,aiDodge:true,aiParry:true,aiFeint:true,lang:'auto',god:false,infMeter:false,cheatMoney:false,cheatOhko:false,cheatTools:false,cheatTech:false,hitboxes:false,shake:true
};
const GROUPS=[
  ['Player',[['moveSpeed','Move speed',100,450,5],['dashSpeed','Dash speed',300,1600,20],['dashTime','Dash time',0.05,0.4,0.01,'s'],['dashCd','Dash cooldown',0,3,0.05,'s'],['maxHp','Starting soul',1,12,1],['slideSpeed','Slide speed',600,6000,100,'px/s'],['slideMax','Longest slide',60,900,10,'px'],['drinkTime','Time to drink blood',0.1,2,0.05,'s']]],
  ['Blade',[['lengthBase','Shortest cut (before shrine)',20,400,5,'px'],['lengthMax','Cut length when full',40,1400,10,'px'],['killGain','Blood per kill',0,100,1,'%'],['hitGain','Blood per hit',0,30,1,'%'],['parryGain','Blood per parry',0,50,1,'%']]],
  ['Cuts',[['slashMin','Slowest cut',50,1500,10,'px/s'],['slashMax','Fastest cut',300,6000,50,'px/s'],['tapSpeed','Click slash speed',300,4000,50,'px/s'],['tapRadius','Click slash reach',20,120,2,'px'],['tapCd','Click slash cooldown',0,1.5,0.02,'s'],['cutCdBase','Swipe cooldown, short cut',0,1.5,0.02,'s'],['cutCdLen','Extra cooldown at full length',0,2,0.02,'s'],['cutLock','Lockout after any cut',0,0.5,0.01,'s'],['slideCd','Slide cooldown',0,6,0.1,'s'],['hitRadius','Cut width',2,30,1,'px'],['ultDmg','Blood strike damage',1,10,1],['ultWidth','Blood strike width',4,60,1,'px'],['lingerTime','Linger time',0.2,5,0.1,'s'],['echoDelay','Echo delay',0.05,1,0.05,'s'],['burstRadius','Burst radius',20,200,5,'px'],['ricoBonus','Ricochet reach past wall',40,800,10,'px'],['ricoMax','Ricochet max bounces',1,8,1]]],
  ['Enemies',[['roomEnemyMul','Foes per room',0.25,3,0.05,'×'],['enemyHpMul','Health',0.25,4,0.05,'×'],['enemySpeed','Move speed',0,350,5],['eSlashMul','Cut speed',0.25,3,0.05,'×'],['telegraph','Wind-up',0.1,2,0.05,'s'],['eCooldown','Attack cooldown',0,4,0.05,'s'],['recover','Recovery after attack',0,2,0.05,'s'],['bossHpMul','Boss health',0.25,4,0.05,'×']]],
  ['Duel AI',[['aiReaction','Reaction time',0,0.5,0.01,'s'],['dodgeChance','Dodge chance',0,1,0.05],['parryChance','Guard chance',0,1,0.05],['feintChance','Feint chance',0,1,0.05],['aiChaos','Unpredictability',0,1,0.05],['poiseHits','Hits before breaking free',1,8,1]]],
  ['Run',[['stagesPerBiome','Levels per realm',1,3,1],['startFloor','Start on level (counting from 1)',1,12,1],['shardMul','Shard drops',0,5,0.25,'×']]],
  ['Hit pause',[['hitPauseMul','Pause length',0.25,3,0.05,'×'],['hitShake','Victim shake',0,3,1,'px']]],
  ['Audio',[['sfxVol','Effects volume',0,1,0.05],['musicVol','Music volume',0,1,0.05]]],
  ['World',[['darkness','Darkness',0,1.6,0.05,'×'],['timeScale','Game speed',0.1,2,0.05,'×'],['slowmo','Swipe slow-mo',0.05,1,0.05,'×'],['parrySlow','Parry slow-mo',0.05,1,0.05,'×'],['parrySlowTime','Parry slow-mo time',0.1,2,0.05,'s'],['trailLinger','Trail fade after cut',0,1,0.05,'s'],['camLead','Camera look-ahead',0,0.5,0.01]]]
];
const TOGGLES=[['noTechCd','Techniques: no recharge'],['cutRecovery','Cut cooldowns'],['abilityCds','Ability cooldowns'],['tapAbilities','Click slashes trigger abilities'],['poise','Foes break free after rapid hits'],['aiReadSpam','Foes read click spam'],['tapNoParry','Click slashes can\'t parry'],['hitPause','Hit pause'],['sound','Sound'],['music','Music'],['lighting','Lighting'],['ambient','Ambient particles'],['corpses','Bisected corpses'],['cursor','Pixel cursor'],['minimap','Minimap'],['trailBlocks','Trails block cuts'],['parrySlowOn','Parry slows time'],['slowmoOn','Slow-mo while swiping'],['enemyAttack','Foes attack'],['enemyMove','Foes move'],['aiDodge','Foes dodge'],['aiParry','Foes guard'],['aiFeint','Foes feint'],['god','Invincible'],['infMeter','Infinite blood'],['hitboxes','Show hitboxes and AI state'],['shake','Screen shake']];
const KEY='blood-katana-debug-v12';
let TKEYS=[];// filled in data
function fresh(){const c=Object.assign(JSON.parse(JSON.stringify(DEF)),{normal:Object.assign({},ABDEF.normal),ult:Object.assign({},ABDEF.ult),roster:{}});for(const k of TKEYS)c.roster[k]=true;return c;}
let CFG=null;
function loadCfg(){
  CFG=fresh();
  try{const s=JSON.parse(localStorage.getItem(KEY)||'{}');
    for(const k in DEF)if(k in s&&typeof s[k]===typeof DEF[k])CFG[k]=s[k];
    for(const g of ['normal','ult'])if(s[g])for(const [k] of ABILS)if(typeof s[g][k]==='boolean')CFG[g][k]=s[g][k];
    if(s.roster)for(const k of TKEYS)if(typeof s.roster[k]==='boolean')CFG.roster[k]=s.roster[k];
  }catch(_){}
  for(const k in DEF)if(typeof DEF[k]==='number'&&!Number.isFinite(CFG[k]))CFG[k]=DEF[k];
}
function save(){try{localStorage.setItem(KEY,JSON.stringify(CFG));}catch(_){}}

// ---------- helpers ----------
const clamp=(v,a,b)=>v<a?a:v>b?b:v;
const rand=(a,b)=>a+Math.random()*(b-a);
const ri=(a,b)=>Math.floor(rand(a,b+1));
const pick=a=>a[Math.floor(Math.random()*a.length)];
const shuffle=a=>{for(let i=a.length-1;i>0;i--){const j=Math.floor(Math.random()*(i+1));[a[i],a[j]]=[a[j],a[i]];}return a;};
const dist=(a,b)=>Math.hypot(a.x-b.x,a.y-b.y);
function segDist(p,a,b){const dx=b.x-a.x,dy=b.y-a.y,l=dx*dx+dy*dy;let t=l?((p.x-a.x)*dx+(p.y-a.y)*dy)/l:0;t=clamp(t,0,1);return Math.hypot(p.x-(a.x+dx*t),p.y-(a.y+dy*t));}
function segNear(p,a,b){const dx=b.x-a.x,dy=b.y-a.y,l=dx*dx+dy*dy;let t=l?((p.x-a.x)*dx+(p.y-a.y)*dy)/l:0;t=clamp(t,0,1);return{x:a.x+dx*t,y:a.y+dy*t};}
function segX(a,b,c,d){const r1=b.x-a.x,r2=b.y-a.y,s1=d.x-c.x,s2=d.y-c.y,den=r1*s2-r2*s1;if(Math.abs(den)<1e-6)return null;const t=((c.x-a.x)*s2-(c.y-a.y)*s1)/den,u=((c.x-a.x)*r2-(c.y-a.y)*r1)/den;if(t>=0&&t<=1&&u>=0&&u<=1)return{x:a.x+r1*t,y:a.y+r2*t};return null;}
function polyLen(pts){let l=0;for(let i=1;i<pts.length;i++)l+=dist(pts[i-1],pts[i]);return l;}
const easeOut=u=>1-Math.pow(1-u,3);
function mk(w,h){const c=document.createElement('canvas');c.width=Math.max(1,w|0);c.height=Math.max(1,h|0);return c;}
function esc(s){return String(s).replace(/[&<>"]/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;'}[c]));}

// ---------- audio (all procedural) ----------
const AU={ctx:null,out:null,sfx:null,mus:null,musIn:null,nb:null,last:{},next:0,step:0,orbChain:0,orbT:0,drone:null};
function auInit(){
  if(AU.ctx){if(AU.ctx.state==='suspended')AU.ctx.resume();return;}
  try{
    const A=window.AudioContext||window.webkitAudioContext;if(!A)return;
    const c=new A();AU.ctx=c;
    const comp=c.createDynamicsCompressor();comp.threshold.value=-14;comp.ratio.value=4;comp.connect(c.destination);
    AU.out=c.createGain();AU.out.connect(comp);
    AU.sfx=c.createGain();AU.sfx.connect(AU.out);
    AU.mus=c.createGain();AU.mus.connect(AU.out);
    AU.musIn=c.createGain();const lp=c.createBiquadFilter();lp.type='lowpass';lp.frequency.value=2600;
    const dl=c.createDelay(1);dl.delayTime.value=0.36;const fb=c.createGain();fb.gain.value=0.32;
    AU.musIn.connect(lp);lp.connect(AU.mus);lp.connect(dl);dl.connect(fb);fb.connect(dl);dl.connect(AU.mus);
    const nb=c.createBuffer(1,c.sampleRate,c.sampleRate),d=nb.getChannelData(0);for(let i=0;i<d.length;i++)d[i]=Math.random()*2-1;AU.nb=nb;
    AU.next=c.currentTime+0.1;auVol();buildSamples();
  }catch(_){AU.ctx=null;}
}
function auVol(){if(!AU.ctx)return;const t=AU.ctx.currentTime;AU.sfx.gain.setTargetAtTime(CFG.sound?CFG.sfxVol*0.9:0,t,0.02);AU.mus.gain.setTargetAtTime(CFG.sound&&CFG.music?CFG.musicVol*0.9:0,t,0.15);}
const pm=()=>0.62+0.38*clamp(S.ts,0,1); // sounds drop in pitch during slow-mo
function tone(f,dur,o={}){
  const c=AU.ctx;if(!c||!CFG.sound)return;const t=c.currentTime+Math.max(0,o.delay||0),k=o.nopm?1:pm();
  const os=c.createOscillator(),g=c.createGain();os.type=o.type||'sine';
  os.frequency.setValueAtTime(f*k,t);if(o.to)os.frequency.exponentialRampToValueAtTime(Math.max(20,o.to*k),t+(o.glide||dur));
  const v=o.vol??0.2;g.gain.setValueAtTime(0.0001,t);g.gain.exponentialRampToValueAtTime(v,t+(o.atk||0.003));g.gain.exponentialRampToValueAtTime(0.0001,t+dur);
  os.connect(g);g.connect(o.dest||AU.sfx);os.start(t);os.stop(t+dur+0.05);
}
function hiss(dur,o={}){
  const c=AU.ctx;if(!c||!CFG.sound)return;const t=c.currentTime+Math.max(0,o.delay||0),k=o.nopm?1:pm();
  const src=c.createBufferSource();src.buffer=AU.nb;src.loop=true;
  const f=c.createBiquadFilter();f.type=o.ft||'bandpass';f.Q.value=o.q||1;
  f.frequency.setValueAtTime((o.f||1200)*k,t);if(o.to)f.frequency.exponentialRampToValueAtTime(o.to*k,t+dur);
  const g=c.createGain(),v=o.vol??0.2;g.gain.setValueAtTime(0.0001,t);g.gain.exponentialRampToValueAtTime(v,t+(o.atk||0.004));g.gain.exponentialRampToValueAtTime(0.0001,t+dur);
  src.connect(f);f.connect(g);g.connect(o.dest||AU.sfx);src.start(t,Math.random()*0.5);src.stop(t+dur+0.05);
}
function metal(base,dur,vol){[1,1.47,2.09,2.76,3.52].forEach((r,i)=>tone(base*r,dur*(1-i*0.12),{vol:vol/(1+i*0.7),type:i?'sine':'triangle'}));}
function pluck(f,delay,vol,dest){
  const c=AU.ctx;if(!c)return;const t=c.currentTime+Math.max(0,delay||0);
  for(const [m,tp,v] of [[1,'triangle',1],[2,'sine',0.35],[3,'sine',0.12]]){
    const os=c.createOscillator(),g=c.createGain();os.type=tp;os.frequency.setValueAtTime(f*m*1.02,t);os.frequency.exponentialRampToValueAtTime(f*m,t+0.04);
    g.gain.setValueAtTime(0.0001,t);g.gain.exponentialRampToValueAtTime((vol||0.1)*v,t+0.004);g.gain.exponentialRampToValueAtTime(0.0001,t+1.4/m);
    os.connect(g);g.connect(dest||AU.musIn);os.start(t);os.stop(t+1.5);
  }
}
function flute(f,delay,dur,vol){ // breathy shakuhachi-ish note
  const c=AU.ctx;if(!c)return;const t=c.currentTime+Math.max(0,delay||0);
  const os=c.createOscillator(),g=c.createGain(),vib=c.createOscillator(),vg=c.createGain();
  os.type='sine';os.frequency.setValueAtTime(f*0.97,t);os.frequency.exponentialRampToValueAtTime(f,t+0.12);
  vib.frequency.value=5.5;vg.gain.value=f*0.012;vib.connect(vg);vg.connect(os.frequency);
  g.gain.setValueAtTime(0.0001,t);g.gain.exponentialRampToValueAtTime(vol,t+0.15);g.gain.setValueAtTime(vol,t+dur*0.6);g.gain.exponentialRampToValueAtTime(0.0001,t+dur);
  os.connect(g);g.connect(AU.musIn);os.start(t);vib.start(t);os.stop(t+dur+0.05);vib.stop(t+dur+0.05);
  hiss(dur*0.8,{f:f*2,q:6,vol:vol*0.25,delay:delay,dest:AU.musIn,nopm:true});
}
function drum(t,f,vol,dec){const c=AU.ctx,os=c.createOscillator(),g=c.createGain();os.frequency.setValueAtTime(f,t);os.frequency.exponentialRampToValueAtTime(f*0.45,t+dec);g.gain.setValueAtTime(0.0001,t);g.gain.exponentialRampToValueAtTime(vol,t+0.004);g.gain.exponentialRampToValueAtTime(0.0001,t+dec);os.connect(g);g.connect(AU.mus);os.start(t);os.stop(t+dec+0.05);}
function startDrone(){
  const c=AU.ctx,g=c.createGain();g.gain.value=0.05;g.connect(AU.mus);
  const oscs=[73.42,110,146.83].map(f=>{const o=c.createOscillator();o.type='sine';o.frequency.value=f;o.detune.value=rand(-6,6);o.connect(g);o.start();return o;});
  const lfo=c.createOscillator(),lg=c.createGain();lfo.frequency.value=0.07;lg.gain.value=0.025;lfo.connect(lg);lg.connect(g.gain);lfo.start();
  AU.drone={g,oscs};
}
function setDrone(root){if(!AU.drone)return;const t=AU.ctx.currentTime;[1,1.5,2].forEach((m,i)=>AU.drone.oscs[i].frequency.setTargetAtTime(root*m,t,0.8));}
const SCALES={in:[293.66,311.13,392,440,466.16,587.33,622.25,783.99,880],yo:[293.66,329.63,392,440,493.88,587.33,659.25,783.99,880],min:[220,261.63,293.66,329.63,392,440,523.25,587.33],hell:[146.83,155.56,196,220,233.08,293.66,311.13]};
const TAIKO=[1,0,0,1,0,0,1,0,1,0,1,0,0,0,2,2];
// ---------- the soundtrack director: which song plays, and whether its fight layers are in ----------
const MUS={E:null,id:null,fight:null,next:null,at:0};
function songFor(){
  if(S.mode==='title')return'title';
  if(S.pro)return S.room&&S.room.pro===4?'kuroda':'castle';
  if(S.inHub||(S.floor&&S.floor.kind==='hub'))return'shrine';
  const b=S.boss;if(b&&S.enemies.includes(b)&&!b.practice)return b.key==='usurper'?'kuroda':'lord';
  if(S.gm&&S.gm.id==='rush')return'lord';
  const k=curBiome().key;return SONGS.some(x=>x.id===k)?k:'dojo';
}
function musicTick(){
  const c=AU.ctx;if(!c)return;
  if(!MUS.E){try{MUS.E=createEngine(c,AU.mus);}catch(_){return;}}
  const E=MUS.E,id=CFG.sound&&CFG.music?songFor():null,now=performance.now();
  if(id!==MUS.next){MUS.next=id;MUS.at=now+(E.playing?700:0);if(E.playing)E.stop(0.25);const sg=SONGS.find(x=>x.id===id);if(sg)E.warm(sg);}
  if(MUS.id!==MUS.next&&now>=MUS.at){MUS.id=MUS.next;const sg=SONGS.find(x=>x.id===MUS.id);if(sg){E.fight=!!MUS.fight;E.play(sg);}}
  const fight=S.mode==='run'&&S.dead<=0&&S.enemies.some(e=>!e.T.dummy&&!e.practice&&!e.illusion);
  if(fight!==MUS.fight){MUS.fight=fight;E.setFight(fight);}
}
function sfx(name,arg){
  if(!AU.ctx||!CFG.sound)return;
  const now=performance.now(),gap={blip:28,hit:40,orb:25,wind:70,eswing:50,block:60,land:80,blink:80,combo:100,coin:30,step:70,shotcut:50,fire:60}[name]||0;
  if(gap&&now-(AU.last[name]||0)<gap)return;AU.last[name]=now;
  try{if(playSample(name,arg))return;}catch(_){}
  switch(name){
    case'slash':{const sp=clamp((arg||800)/2600,0,1);hiss(0.16+0.08*(1-sp),{f:900+2600*sp,to:300+900*sp,q:1.6,vol:0.22});hiss(0.06,{f:6000,ft:'highpass',vol:0.05});break;}
    case'tap':hiss(0.09,{f:arg?1800:2600,to:arg?500:900,q:2,vol:arg?0.24:0.18});if(arg)tone(160,0.12,{to:70,vol:0.12});break;
    case'ult':hiss(0.35,{f:500,to:3500,q:2,vol:0.3});tone(110,0.4,{to:55,vol:0.22,type:'sawtooth'});break;
    case'hit':tone(160,0.12,{to:50,vol:0.32});hiss(0.08,{f:700,to:200,q:0.8,vol:0.25,ft:'lowpass'});break;
    case'kill':tone(120,0.25,{to:40,vol:0.35});hiss(0.3,{f:1400,to:200,q:0.7,vol:0.22,ft:'lowpass'});tone(2600,0.18,{vol:0.05,type:'triangle',to:2300});break;
    case'parry':metal(880,0.9,0.22);hiss(0.05,{f:5000,ft:'highpass',vol:0.25});tone(220,0.6,{to:110,vol:0.08,delay:0.04});break;
    case'guarded':metal(520,0.4,0.14);hiss(0.04,{f:3000,ft:'highpass',vol:0.15});break;
    case'block':metal(360,0.25,0.1);break;
    case'gbreak':metal(640,0.35,0.14);hiss(0.12,{f:2000,to:500,vol:0.15});break;
    case'shotcut':metal(1200,0.18,0.07);hiss(0.05,{f:4000,ft:'highpass',vol:0.1});break;
    case'orb':{AU.orbChain=now-AU.orbT<400?Math.min(AU.orbChain+1,14):0;AU.orbT=now;tone(660*Math.pow(2,[0,2,3,7,9,12,14,15,19,21,24,26,27,31,33][AU.orbChain]/12),0.08,{vol:0.045,type:'triangle',nopm:true});break;}
    case'coin':tone(1568,0.06,{vol:0.05,type:'square',nopm:true});tone(2093,0.09,{vol:0.04,type:'square',delay:0.04,nopm:true});break;
    case'shard':[0,7,12].forEach((s,i)=>tone(880*Math.pow(2,s/12),0.25,{vol:0.05,type:'triangle',delay:i*0.05,nopm:true}));break;
    case'heal':[0,4,7].forEach((s,i)=>tone(523.25*Math.pow(2,s/12),0.3,{vol:0.05,type:'sine',delay:i*0.07,nopm:true}));break;
    case'pickup':[0,4,7,12,16].forEach((s,i)=>tone(392*Math.pow(2,s/12),0.4,{vol:0.06,type:'triangle',delay:i*0.06,nopm:true}));break;
    case'buy':tone(1318.5,0.08,{vol:0.06,type:'square',nopm:true});tone(1760,0.15,{vol:0.05,type:'square',delay:0.06,nopm:true});break;
    case'door':tone(140,0.12,{to:90,vol:0.2,type:'triangle',nopm:true});hiss(0.15,{f:600,to:300,vol:0.12,nopm:true});tone(110,0.1,{vol:0.15,delay:0.12,type:'triangle',nopm:true});break;
    case'chest':tone(196,0.1,{vol:0.15,type:'triangle',nopm:true});[0,4,7].forEach((s,i)=>tone(784*Math.pow(2,s/12),0.2,{vol:0.05,type:'square',delay:0.1+i*0.05,nopm:true}));break;
    case'stairs':[12,7,4,0,-5].forEach((s,i)=>tone(523*Math.pow(2,s/12),0.3,{vol:0.06,type:'triangle',delay:i*0.08,nopm:true}));break;
    case'pon':tone(300,0.12,{to:600,vol:0.18,type:'sine'});hiss(0.2,{f:800,vol:0.12});break;
    case'splash':hiss(0.25,{f:2000,to:500,q:0.8,vol:0.14});break;
    case'fox':tone(1046,0.2,{to:1568,vol:0.05,type:'triangle'});break;
    case'web':hiss(0.18,{f:3000,to:1500,q:5,vol:0.07});break;
    case'gust':hiss(0.4,{f:400,to:1400,q:0.5,vol:0.16});break;
    case'fire':hiss(0.3,{f:900,to:300,q:0.6,vol:0.1});break;
    case'zap':for(let i=0;i<3;i++)hiss(0.04,{f:5000-i*800,q:3,vol:0.08,delay:i*0.03});tone(1800,0.08,{to:400,vol:0.05,type:'square'});break;
    case'dash':hiss(0.18,{f:400,to:1600,q:0.7,vol:0.14});break;
    case'step':hiss(0.035,{f:arg?520:340,ft:'lowpass',vol:0.035});break;
    case'hurt':tone(90,0.35,{to:35,vol:0.4,type:'square'});hiss(0.2,{f:500,to:100,vol:0.25,ft:'lowpass'});break;
    case'shield':metal(700,0.5,0.15);break;
    case'wind':tone(arg==='phase'?1200:1800,0.05,{vol:0.035,type:'square',to:arg==='phase'?600:2400});break;
    case'eswing':hiss(0.14,{f:700,to:2400,q:1.2,vol:0.12});break;
    case'arrow':hiss(0.22,{f:2500,to:1200,q:3,vol:0.08});tone(180,0.06,{vol:0.08,type:'triangle'});break;
    case'shuriken':for(let i=0;i<3;i++)hiss(0.05,{f:4000,q:4,vol:0.06,delay:i*0.04});break;
    case'smash':tone(70,0.6,{to:30,vol:0.5});hiss(0.5,{f:300,to:60,vol:0.35,ft:'lowpass'});break;
    case'land':tone(90,0.12,{to:40,vol:0.16});hiss(0.12,{f:400,ft:'lowpass',vol:0.1});break;
    case'blink':tone(1400,0.25,{to:300,vol:0.05});tone(1412,0.25,{to:306,vol:0.04});break;
    case'arm':tone(220,0.5,{to:880,vol:0.1,type:'sawtooth'});hiss(0.4,{f:300,to:2000,vol:0.08});break;
    case'full':[0,4,7,12].forEach((s,i)=>tone(587.33*Math.pow(2,s/12),0.5,{vol:0.05,type:'triangle',delay:i*0.06,nopm:true}));break;
    case'gong':[1,1.53,2.1,2.9,3.7].forEach((r,i)=>tone(73*r,3-i*0.4,{vol:0.22/(1+i),atk:0.01,nopm:true}));hiss(0.6,{f:200,ft:'lowpass',vol:0.2,nopm:true});break;
    case'enrage':tone(70,0.8,{to:140,vol:0.18,type:'sawtooth'});tone(73,0.8,{to:146,vol:0.14,type:'sawtooth'});break;
    case'boon':[0,3,5,7,10,12].forEach((s,i)=>pluck(293.66*Math.pow(2,s/12),i*0.07,0.12));break;
    case'blip':tone((arg||600)*rand(0.94,1.06),0.04,{vol:0.022,type:'square',nopm:true});tone((arg||600)*2,0.02,{vol:0.008,type:'triangle',nopm:true});break;
    case'talk':tone(rand(500,700),0.04,{vol:0.03,type:'square',nopm:true});break;
    case'deny':tone(240,0.05,{vol:0.06,type:'square',nopm:true});break;
    case'click':tone(1200,0.03,{vol:0.05,type:'square',nopm:true});break;
    case'dice':for(let i=0;i<5;i++)tone(rand(1500,2500),0.03,{vol:0.05,type:'square',delay:i*0.05,nopm:true});break;
    case'death':tone(60,1.4,{to:25,vol:0.45,nopm:true});hiss(1.2,{f:800,to:80,vol:0.25,ft:'lowpass',nopm:true});break;
    case'heart':tone(55,0.12,{vol:0.3,nopm:true});tone(50,0.12,{vol:0.22,delay:0.16,nopm:true});break;
    case'combo':[0,7].forEach((s,i)=>tone(880*Math.pow(2,(Math.min(arg,40)/40*12+s)/12),0.09,{vol:0.04,type:'square',delay:i*0.05,nopm:true}));break;
    case'drink':for(let i=0;i<4;i++)tone(300-i*40,0.12,{to:200-i*30,vol:0.08,type:'sine',delay:i*0.12,nopm:true});hiss(0.5,{f:500,to:200,q:2,vol:0.06,nopm:true});break;
    case'drank':[0,3,7,12].forEach((s,i)=>tone(392*Math.pow(2,s/12),0.4,{vol:0.06,type:'triangle',delay:i*0.05,nopm:true}));tone(80,0.3,{vol:0.2,nopm:true});break;
    case'clang':metal(1100,0.5,0.2);hiss(0.06,{f:6000,ft:'highpass',vol:0.2});tone(140,0.2,{to:90,vol:0.12});break;
    case'ready':tone(1760,0.05,{vol:0.03,type:'triangle',nopm:true});tone(2349,0.08,{vol:0.03,type:'triangle',delay:0.04,nopm:true});break;
    case'mochi':tone(110,0.15,{to:60,vol:0.35,nopm:true});hiss(0.08,{f:600,ft:'lowpass',vol:0.2,nopm:true});break;
    case'paper':hiss(0.12,{f:3500,to:1500,q:1.5,vol:0.12});tone(900,0.05,{vol:0.04,type:'triangle'});break;
    case'giggle':for(let i=0;i<4;i++)tone(1200+i*120+rand(-40,40),0.06,{vol:0.035,type:'sine',delay:i*0.07,nopm:true});break;
    case'duel':drum(AU.ctx.currentTime,90,0.5,0.5);drum(AU.ctx.currentTime+0.18,90,0.4,0.4);hiss(0.4,{f:1800,to:600,q:1,vol:0.1,nopm:true});break;
    case'chain':for(let i=0;i<5;i++)tone(rand(2200,3400),0.03,{vol:0.035,type:'square',delay:i*0.03,nopm:true});break;
    case'learn':[0,4,7,11,14,19].forEach((s,i)=>tone(261.6*Math.pow(2,s/12),1.2,{vol:0.05,type:'triangle',delay:i*0.09,nopm:true}));metal(660,1.6,0.12);break;
    case'temper':metal(440,1.2,0.18);[0,7,12].forEach((s,i)=>tone(220*Math.pow(2,s/12),0.8,{vol:0.06,type:'triangle',delay:0.1+i*0.08,nopm:true}));break;
  }
}


// ---------- sampled sound effects, synthesized once at startup (physical-ish models: modal steel, filtered air, wet impacts) ----------
const SMP={};let SMP_READY=false;
function bqc(type,f,Q,sr){const w=2*Math.PI*Math.min(f,sr*0.45)/sr,c=Math.cos(w),s=Math.sin(w),a=s/(2*Q);let b0,b1,b2;
  if(type==='bp'){b0=a;b1=0;b2=-a;}else if(type==='lp'){b0=(1-c)/2;b1=1-c;b2=(1-c)/2;}else{b0=(1+c)/2;b1=-(1+c);b2=(1+c)/2;}
  const a0=1+a;return{b0:b0/a0,b1:b1/a0,b2:b2/a0,a1:-2*c/a0,a2:(1-a)/a0};}
function flt(type,f,Q,sr){return{c:bqc(type,f,Q,sr),x1:0,x2:0,y1:0,y2:0,type,Q,sr};}
function fset(F,f){F.c=bqc(F.type,f,F.Q,F.sr);}
function fstep(F,x){const c=F.c,y=c.b0*x+c.b1*F.x1+c.b2*F.x2-c.a1*F.y1-c.a2*F.y2;F.x2=F.x1;F.x1=x;F.y2=F.y1;F.y1=y;return y;}
const nz=()=>Math.random()*2-1;
function gen(dur,fn){const sr=AU.ctx.sampleRate,n=Math.ceil(dur*sr),d=new Float32Array(n);fn(d,sr,n);
  let pk=0;for(let i=0;i<n;i++){const v=Math.abs(d[i]);if(v>pk)pk=v;}const k=pk>0?0.92/pk:1;const fo=Math.min(n,Math.floor(sr*0.015));
  for(let i=0;i<n;i++)d[i]*=k;for(let i=0;i<fo;i++)d[n-1-i]*=i/fo;
  const b=AU.ctx.createBuffer(1,n,sr);b.getChannelData(0).set(d);return b;}
// a ringing piece of steel: free-free bar modes + a cloud of high partials in detuned pairs (the shimmer of a blade)
function steel(d,sr,n,o){
  const modes=[];for(const r of o.ratios||[1,2.756,5.404,8.933])modes.push({f:o.f0*r,a:1/Math.pow(r,0.55),d:o.dec/Math.pow(r,0.45)});
  for(let i=0;i<(o.extra||0);i++){const f=rand(o.lo,o.hi),a=rand(0.25,0.7)*(o.bright??1),dd=o.dec*rand(0.12,0.55);modes.push({f,a,d:dd});modes.push({f:f+rand(1.5,7),a:a*rand(0.4,0.9),d:dd*rand(0.8,1.2)});}
  const off=Math.floor((o.at||0)*sr),g=o.gain??1;
  for(const m of modes){if(m.f>sr*0.45)continue;const w=2*Math.PI*m.f/sr,ph=Math.random()*6.283,dk=Math.exp(-1/(m.d*sr));let amp=m.a*g,s1=Math.sin(ph),s0=Math.sin(ph-w);const c2=2*Math.cos(w),lim=Math.min(n-off,Math.ceil(m.d*sr*7));
    for(let i=0;i<lim;i++){const s=c2*s1-s0;s0=s1;s1=s;d[i+off]+=amp*s*(i<40?i/40:1);amp*=dk;}}
  if(o.click){const F=flt('hp',2500,0.7,sr),L=Math.floor(sr*0.006);for(let i=0;i<L&&i+off<n;i++)d[i+off]+=o.click*fstep(F,nz())*(1-i/L);}
  if(o.burst){const F=flt('bp',o.burstF||3500,0.9,sr),L=Math.floor(sr*0.04);for(let i=0;i<L&&i+off<n;i++)d[i+off]+=o.burst*fstep(F,nz())*Math.exp(-i/(sr*0.008));}
}
// air moved by a blade or a body: band-passed noise whose centre sweeps (doppler) under a swell envelope, plus a faint edge whistle
function air(d,sr,n,o){
  const F=flt('bp',o.f1,o.q,sr),G=flt('bp',o.f1*2.4,o.q*2,sr),pk=o.peak??0.4;let ph=0;
  for(let i=0;i<n;i++){const t=i/n;if(i%24===0){const fc=t<pk?o.f1+(o.f2-o.f1)*(t/pk):o.f2+(o.f3-o.f2)*((t-pk)/(1-pk));fset(F,fc);fset(G,fc*2.4);if(o.whistle)ph=fc;}
    const env=t<pk?Math.pow(t/pk,o.atk??2):Math.pow(Math.max(0,1-(t-pk)/(1-pk)),o.rel??1.7),x=nz();
    let v=fstep(F,x)+(o.edge??0.35)*fstep(G,x);if(o.whistle)v+=o.whistle*Math.sin(2*Math.PI*ph*1.6*i/sr)*0.02;if(o.flutter)v*=1+o.flutter*Math.sin(i/sr*2*Math.PI*o.flutterF);d[i]+=env*v*(o.gain??1);}
}
function thump(d,sr,n,o){const off=Math.floor((o.at||0)*sr);let ph=0;for(let i=0;i+off<n;i++){const t=i/sr,f=o.f2+(o.f1-o.f2)*Math.exp(-t/(o.sweep||0.04));ph+=2*Math.PI*f/sr;const e=Math.exp(-t/o.dec)*(i<30?i/30:1);if(e<1e-4)break;let v=Math.sin(ph)*e*(o.gain??1);if(o.drive)v=Math.tanh(v*o.drive)/Math.tanh(o.drive);d[i+off]+=v;}}
function noiseHit(d,sr,n,o){const F=flt(o.type||'bp',o.f,o.q||0.8,sr),off=Math.floor((o.at||0)*sr);for(let i=0;i+off<n;i++){const t=i/sr,e=Math.exp(-t/o.dec)*(i<(o.atkS||20)?i/(o.atkS||20):1);if(e<1e-4)break;d[i+off]+=fstep(F,nz())*e*(o.gain??1);}}
function crackle(d,sr,n,o){const F=flt('lp',o.f||3000,0.7,sr),off=Math.floor((o.at||0)*sr),L=Math.floor(o.len*sr);let h=0;for(let i=0;i<L&&i+off<n;i++){if(Math.random()<o.dens)h=nz();else h*=0.6;d[i+off]+=fstep(F,h)*(o.gain??1)*(1-i/L);}}
const SMP_DEF={
  slashF:()=>gen(0.2,(d,sr,n)=>air(d,sr,n,{f1:900,f2:3400,f3:1300,q:1.6,peak:0.35,edge:0.45,whistle:0})),
  slashS:()=>gen(0.32,(d,sr,n)=>air(d,sr,n,{f1:500,f2:1900,f3:700,q:1.3,peak:0.45})),
  tap:()=>gen(0.14,(d,sr,n)=>air(d,sr,n,{f1:1300,f2:3600,f3:1600,q:2,peak:0.3,edge:0.5})),
  ult:()=>gen(0.9,(d,sr,n)=>{air(d,sr,n,{f1:300,f2:2600,f3:500,q:1.1,peak:0.25,rel:1.2,gain:1.2});steel(d,sr,n,{f0:rand(700,800),dec:0.5,extra:8,lo:2500,hi:8000,gain:0.25,bright:0.8});}),
  eswing:()=>gen(0.28,(d,sr,n)=>air(d,sr,n,{f1:450,f2:1700,f3:650,q:1.2,peak:0.5})),
  dash:()=>gen(0.26,(d,sr,n)=>air(d,sr,n,{f1:250,f2:850,f3:350,q:0.8,peak:0.4,edge:0.1,flutter:0.5,flutterF:38})),
  hit:()=>gen(0.3,(d,sr,n)=>{noiseHit(d,sr,n,{f:rand(1800,2600),q:0.7,dec:0.035,gain:1});thump(d,sr,n,{f1:150,f2:55,dec:0.06,gain:1.1,drive:2});crackle(d,sr,n,{len:0.16,dens:0.03,f:2600,gain:0.5});}),
  kill:()=>gen(0.75,(d,sr,n)=>{noiseHit(d,sr,n,{f:rand(1500,2200),q:0.6,dec:0.08,gain:1.1});thump(d,sr,n,{f1:120,f2:40,dec:0.12,gain:1.2,drive:2.5});crackle(d,sr,n,{len:0.45,dens:0.025,f:2200,gain:0.6});thump(d,sr,n,{at:0.3,f1:90,f2:45,dec:0.09,gain:0.6});noiseHit(d,sr,n,{at:0.3,type:'lp',f:500,dec:0.08,gain:0.4});}),
  hurt:()=>gen(0.45,(d,sr,n)=>{thump(d,sr,n,{f1:130,f2:42,dec:0.1,gain:1.3,drive:3});noiseHit(d,sr,n,{type:'lp',f:700,dec:0.07,gain:0.7});noiseHit(d,sr,n,{f:1800,q:0.7,dec:0.025,gain:0.5});}),
  clash:()=>gen(1.9,(d,sr,n)=>steel(d,sr,n,{f0:rand(380,560),dec:1.1,extra:11,lo:1800,hi:7800,click:0.9,burst:0.8,burstF:4000})),
  block:()=>gen(0.7,(d,sr,n)=>{steel(d,sr,n,{f0:rand(300,420),dec:0.28,extra:7,lo:1200,hi:4200,bright:0.7,click:0.6,burst:0.5,burstF:2500});thump(d,sr,n,{f1:240,f2:160,dec:0.04,gain:0.5});}),
  ting:()=>gen(0.45,(d,sr,n)=>steel(d,sr,n,{f0:rand(1100,1500),dec:0.18,extra:4,lo:4000,hi:9000,click:0.5})),
  shatter:()=>gen(1.2,(d,sr,n)=>{steel(d,sr,n,{f0:rand(450,600),dec:0.55,extra:10,lo:2000,hi:8500,click:1,burst:1});for(let k=0;k<5;k++)steel(d,sr,n,{f0:rand(1800,3200),dec:0.06,extra:2,lo:5000,hi:9000,at:0.03+k*rand(0.02,0.05),gain:0.35});}),
  coin:()=>gen(0.4,(d,sr,n)=>{steel(d,sr,n,{f0:rand(2700,3100),ratios:[1,1.42,2.18,2.66],dec:0.12,click:0.3});steel(d,sr,n,{f0:rand(2700,3100),ratios:[1,1.42,2.18,2.66],dec:0.08,at:0.06,gain:0.5});}),
  draw:()=>gen(1.0,(d,sr,n)=>{const F=flt('bp',2000,7,sr),G=flt('bp',3100,9,sr);const L=Math.floor(sr*0.38);for(let i=0;i<L;i++){const t=i/L;if(i%24===0){fset(F,1800+3600*t);fset(G,2900+4200*t);}const x=nz();d[i]+=(fstep(F,x)+0.7*fstep(G,x))*Math.pow(t,1.3)*(1+0.3*Math.sin(i/sr*2*Math.PI*60));}
    steel(d,sr,n,{f0:rand(820,900),dec:0.6,extra:8,lo:3000,hi:9000,at:0.37,gain:0.8,click:0.4});}),
  gong:()=>gen(4.2,(d,sr,n)=>{steel(d,sr,n,{f0:rand(70,76),ratios:[1,1.47,1.95,2.38,2.9,3.48,4.1,4.7,5.3,6.1,7.2],dec:3.2,extra:6,lo:500,hi:1500,bright:0.25});thump(d,sr,n,{f1:90,f2:60,dec:0.08,gain:0.5});}),
  smash:()=>gen(1.1,(d,sr,n)=>{thump(d,sr,n,{f1:90,f2:28,dec:0.28,sweep:0.08,gain:1.4,drive:3});noiseHit(d,sr,n,{type:'lp',f:380,dec:0.3,gain:1});crackle(d,sr,n,{at:0.04,len:0.6,dens:0.012,f:2400,gain:0.7});}),
  land:()=>gen(0.3,(d,sr,n)=>{thump(d,sr,n,{f1:110,f2:45,dec:0.06,gain:1});noiseHit(d,sr,n,{type:'lp',f:900,dec:0.05,gain:0.5});}),
  step:()=>gen(0.09,(d,sr,n)=>{noiseHit(d,sr,n,{type:'lp',f:rand(700,1100),dec:0.014,gain:1});thump(d,sr,n,{f1:rand(200,260),f2:150,dec:0.018,gain:0.5});}),
  arrow:()=>gen(0.4,(d,sr,n)=>{air(d,sr,n,{f1:1800,f2:3200,f3:1500,q:3,peak:0.3,gain:0.7});let ph=0;for(let i=0;i<n;i++){const t=i/n;ph+=2*Math.PI*(2700-900*t)/sr;d[i]+=Math.sin(ph)*0.25*Math.sin(Math.PI*t);}}),
  shuriken:()=>gen(0.3,(d,sr,n)=>{const F=flt('bp',4200,2.5,sr);for(let i=0;i<n;i++){const t=i/n;d[i]+=fstep(F,nz())*Math.sin(Math.PI*t)*(0.5+0.5*Math.sin(i/sr*2*Math.PI*45));}}),
  splash:()=>gen(0.5,(d,sr,n)=>{noiseHit(d,sr,n,{f:1100,q:0.6,dec:0.12,gain:0.8});for(let k=0;k<14;k++){const at=rand(0,0.3),f=rand(500,1600);let ph=0;const o=Math.floor(at*sr),L=Math.floor(sr*0.04);for(let i=0;i<L&&o+i<n;i++){ph+=2*Math.PI*f*(1+i/L*0.8)/sr;d[o+i]+=Math.sin(ph)*0.25*Math.exp(-i/(L*0.3));}}}),
  gun:()=>gen(1.3,(d,sr,n)=>{noiseHit(d,sr,n,{type:'lp',f:2600,dec:0.05,gain:1.6,atkS:4});thump(d,sr,n,{f1:140,f2:40,dec:0.16,sweep:0.03,gain:1.5,drive:4});crackle(d,sr,n,{at:0.02,len:0.5,dens:0.02,f:1800,gain:0.35});noiseHit(d,sr,n,{at:0.05,type:'lp',f:500,dec:0.35,gain:0.5});}),
  click:()=>gen(0.12,(d,sr,n)=>steel(d,sr,n,{f0:rand(2600,3200),ratios:[1,1.7,2.9],dec:0.025,click:0.8})),
  thunk:()=>gen(0.25,(d,sr,n)=>{thump(d,sr,n,{f1:180,f2:110,dec:0.07,gain:1});noiseHit(d,sr,n,{type:'lp',f:1200,dec:0.03,gain:0.5});}),
  death:()=>gen(1.6,(d,sr,n)=>{thump(d,sr,n,{f1:90,f2:35,dec:0.2,gain:1.2,drive:2});[0.35,0.55,0.68,0.76].forEach((at,k)=>steel(d,sr,n,{f0:rand(500,620),dec:0.35-k*0.06,extra:5,lo:2000,hi:6500,at,gain:0.7-k*0.15,click:0.4}));})
};
const SMP_VAR={clash:4,block:3,hit:4,kill:3,slashF:3,slashS:2,tap:3,eswing:2,hurt:2,coin:3,step:4,ting:3,shatter:2,smash:2,land:2,click:2,thunk:2};
function buildSamples(){
  if(!AU.ctx||SMP_READY)return;const keys=Object.keys(SMP_DEF);let i=0;
  // a small room for everything to ring in
  try{const c=AU.ctx,sr=c.sampleRate,L=Math.floor(sr*1.6),ir=c.createBuffer(2,L,sr);for(let ch=0;ch<2;ch++){const d=ir.getChannelData(ch);let lp=0;for(let j=0;j<L;j++){const t=j/sr,k=0.15+0.8*Math.min(1,t/1.2);lp+=(nz()-lp)*(1-k*0.9);d[j]=lp*Math.exp(-t/0.38)*(j<sr*0.012?0.3:1);}}
    AU.rev=c.createConvolver();AU.rev.buffer=ir;const rg=c.createGain();rg.gain.value=0.9;AU.rev.connect(rg);rg.connect(AU.sfx);}catch(_){AU.rev=null;}
  const step=()=>{const t0=performance.now();while(i<keys.length&&performance.now()-t0<12){const k=keys[i++];try{SMP[k]=[];for(let v=0;v<(SMP_VAR[k]||1);v++)SMP[k].push(SMP_DEF[k]());}catch(_){delete SMP[k];}}
    if(i<keys.length)setTimeout(step,0);else SMP_READY=true;};
  step();
}
function play(key,o={}){
  const bank=SMP[key];if(!bank||!bank.length||!AU.ctx)return false;const c=AU.ctx,src=c.createBufferSource();src.buffer=pick(bank);
  src.playbackRate.value=(o.rate||1)*(o.nopm?1:pm());const g=c.createGain();g.gain.value=o.vol??0.6;src.connect(g);g.connect(AU.sfx);
  if(AU.rev&&(o.wet??0.2)>0){const s=c.createGain();s.gain.value=o.wet??0.2;g.connect(s);s.connect(AU.rev);}
  src.start(c.currentTime+(o.delay||0));return true;
}
function playSample(name,arg){
  const r=rand(0.95,1.05);
  switch(name){
    case'slash':return play((arg||800)>1300?'slashF':'slashS',{vol:0.5,rate:r*(0.9+0.2*clamp((arg||800)/2600,0,1)),wet:0.12});
    case'tap':return play('tap',{vol:arg?0.6:0.42,rate:arg?0.82:r,wet:0.1});
    case'ult':return play('ult',{vol:0.75,wet:0.35});
    case'eswing':return play('eswing',{vol:0.4,rate:r,wet:0.15});
    case'dash':return play('dash',{vol:0.42,rate:r,wet:0.08});
    case'hit':return play('hit',{vol:0.75,rate:r,wet:0.12});
    case'kill':return play('kill',{vol:0.85,rate:r,wet:0.2});
    case'hurt':return play('hurt',{vol:0.9,rate:r,wet:0.15});
    case'parry':return play('clash',{vol:0.85,rate:r,wet:0.45});
    case'clang':return play('clash',{vol:0.6,rate:1.2*r,wet:0.3});
    case'guarded':return play('block',{vol:0.65,rate:r,wet:0.25});
    case'block':return play('block',{vol:0.45,rate:1.15*r,wet:0.2});
    case'gbreak':return play('shatter',{vol:0.8,rate:r,wet:0.35});
    case'shotcut':return play('ting',{vol:0.4,rate:r,wet:0.2});
    case'coin':return play('coin',{vol:0.3,rate:rand(0.94,1.1),nopm:true,wet:0.1});
    case'step':return play('step',{vol:0.16,rate:arg?1.08:0.94,wet:0.05});
    case'gong':return play('gong',{vol:0.75,nopm:true,wet:0.5});
    case'smash':return play('smash',{vol:0.9,rate:r,wet:0.25});
    case'land':return play('land',{vol:0.45,rate:r,wet:0.1});
    case'arrow':return play('arrow',{vol:0.5,rate:r,wet:0.1});
    case'shuriken':return play('shuriken',{vol:0.45,rate:r,wet:0.1});
    case'arm':return play('draw',{vol:0.6,wet:0.35});
    case'temper':return play('clash',{vol:0.8,rate:0.62,nopm:true,wet:0.6});
    case'death':return play('death',{vol:0.9,nopm:true,wet:0.4});
    case'splash':return play('splash',{vol:0.5,rate:r,wet:0.15});
    case'wind':return play('click',{vol:0.22,rate:arg==='phase'?0.7:r,wet:0.1});
    case'mochi':return play('thunk',{vol:0.7,rate:r,wet:0.15});
    case'gun':return play('gun',{vol:0.95,rate:r,wet:0.5});
    case'crate':play('thunk',{vol:0.6,rate:1.3*r,wet:0.1});return play('land',{vol:0.4,rate:1.4*r,wet:0.1});
    case'thunk':return play('thunk',{vol:0.7,rate:r,wet:0.15});
    case'draw':return play('draw',{vol:0.55,rate:r,wet:0.3});
    case'spike':return play('ting',{vol:0.3,rate:0.7*r,wet:0.1});
    case'duel':play('draw',{vol:0.5,wet:0.4,nopm:true});return play('gong',{vol:0.4,rate:1.5,nopm:true,wet:0.4});
  }
  return false;
}

// ---------- canvases + pixel plotting (batched per colour, ordered dither for alpha) ----------
const cv=$('game'),ctx=cv.getContext('2d');
const low=mk(LW,LH);let lx=low.getContext('2d');lx.imageSmoothingEnabled=false;
let dpr=1;
// the screen canvas holds the low-res frame 1:1; CSS (image-rendering:pixelated) does the upscale on the GPU
function fit(){dpr=1;const w=viewW();if(w!==VW){VW=w;LW=VW/PX;low.width=LW;lx.imageSmoothingEnabled=false;if(typeof lightCv!=='undefined')lightCv.width=LW;}
  if(cv.width!==LW)cv.width=LW;if(cv.height!==LH)cv.height=LH;document.documentElement.style.setProperty('--ar',String(LW/LH));}
fit();addEventListener('resize',fit);
const BAYER=[0,8,2,10,12,4,14,6,3,11,1,9,15,7,13,5];
let BUF=new Map();
// capture: held weapons draw into CAP first so they can be 4-connected and outlined, then land in the buffer
let CAP=null,CAPS=null;
function capBegin(){CAP=new Map();CAPS=[];}
function capEnd(outline,sink){
  const M=CAP,soft=CAPS;CAP=null;CAPS=null;const K=(x,y)=>(y+64)*4096+(x+64);
  // fill diagonal-only steps so the outline can't cut a thin line into dots
  for(const [k,v] of [...M]){const x=v[0],y=v[1];for(const dy of [-1,1]){if(M.has(K(x+1,y+dy))&&!M.has(K(x+1,y))&&!M.has(K(x,y+dy)))M.set(K(x+1,y),[x+1,y,v[2]]);}}
  const O=[];if(outline){const seen=new Set();for(const v of M.values()){const x=v[0],y=v[1];for(const [dx,dy] of [[1,0],[-1,0],[0,1],[0,-1]]){const k=K(x+dx,y+dy);if(!M.has(k)&&!seen.has(k)){seen.add(k);O.push([x+dx,y+dy]);}}}}
  const SO=[];for(let i=0;i<soft.length;i+=4)if(!M.has(K(soft[i],soft[i+1])))SO.push([soft[i],soft[i+1],soft[i+2],soft[i+3]]);
  if(sink){sink([...M.values()],O,SO);return;}
  for(const [x,y] of O)pset(x,y,'#000000');for(const v of SO)pset(v[0],v[1],v[2],v[3]);for(const v of M.values())pset(v[0],v[1],v[2]);
}
function pset(x,y,col,a){x=Math.round(x);y=Math.round(y);
  if(CAP){if(a!==undefined&&a<1)CAPS.push(x,y,col,a);else CAP.set((y+64)*4096+(x+64),[x,y,col]);return;}if(x<0||y<0||x>=LW||y>=LH)return;if(a!==undefined&&a<1&&(BAYER[(x&3)+((y&3)<<2)]+0.5)/16>=a)return;let b=BUF.get(col);if(!b){b=[];BUF.set(col,b);}b.push(x,y);}
function flush(){for(const [col,b] of BUF){lx.fillStyle=col;for(let i=0;i<b.length;i+=2)lx.fillRect(b[i],b[i+1],1,1);}BUF=new Map();}
function pline(x0,y0,x1,y1,col,a,th){
  x0=Math.round(x0);y0=Math.round(y0);x1=Math.round(x1);y1=Math.round(y1);
  const dx=Math.abs(x1-x0),dy=-Math.abs(y1-y0),sx=x0<x1?1:-1,sy=y0<y1?1:-1;let e=dx+dy,n=0;
  for(;;){pset(x0,y0,col,a);if(th>1){pset(x0+1,y0,col,a);pset(x0,y0+1,col,a);}if(x0===x1&&y0===y1||n++>2000)break;const e2=2*e;if(e2>=dy){e+=dy;x0+=sx;}if(e2<=dx){e+=dx;y0+=sy;}}
}
function pcircle(cx,cy,r,col,a){cx=Math.round(cx);cy=Math.round(cy);r=Math.round(r);let x=r,y=0,e=1-r;while(x>=y){for(const [px,py] of [[x,y],[y,x],[-y,x],[-x,y],[-x,-y],[-y,-x],[y,-x],[x,-y]])pset(cx+px,cy+py,col,a);y++;if(e<0)e+=2*y+1;else{x--;e+=2*(y-x)+1;}}}
function pdisc(cx,cy,r,col,a){cx=Math.round(cx);cy=Math.round(cy);for(let y=-r;y<=r;y++)for(let x=-r;x<=r;x++)if(x*x+y*y<=r*r+r*0.8)pset(cx+x,cy+y,col,a);}
function ptext(str,x,y,col,size,align){lx.font=`${size||8}px ${PFONT}`;lx.textAlign=align||'center';lx.textBaseline='alphabetic';lx.fillStyle=C.out;lx.fillText(str,Math.round(x)+1,Math.round(y)+1);lx.fillStyle=col;lx.fillText(str,Math.round(x),Math.round(y));}

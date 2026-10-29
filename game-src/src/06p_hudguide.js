// ================= "Your screen": the tutorial card again, with a tab for every part of the HUD =================
// Each tab draws the real HUD (the same drawing calls a run uses) with sample numbers, zooms in on one part and
// dims the rest. The foe tab stages a real foe winding up. Opens before the first lesson, and from How to play.
const HUD_TABS=[
  {id:'souls',name:'Souls',text:'Your souls are your life. Each hit takes one; lose them all and the run ends. Soul orbs and the hot spring refill them. A steel one is a shield that breaks first.'},
  {id:'orb',name:'Blood orb',text:'The blood orb fills as you cut foes down. The ticks show what you can afford: white heals, grey mends your weapon, red is Bloodthirst. It flashes when Bloodthirst is ready.'},
  {id:'purse',name:'Mon & shards',text:'Gold is mon: spend it at merchants during this run. Red is the blood shards you carry. They are only banked at a store floor or the rest place; die first and they scatter.'},
  {id:'weapon',name:'Weapon',text:'The weapon in your hand and how worn it is. Every hit wears it down, and the bar turns red near the end. Mend it with the orb or a whetstone, or take another.'},
  {id:'map',name:'Map',text:'The rooms you have found. White is where you are; icons mark stores, treasure, duels and the stairs. Below: rooms left before the stairs open. Open doorways glow gold, sealed ones red.'},
  {id:'tech',name:'Technique',text:'技 and the techniques your weapon knows. Bright means ready to trace. Dark means recharging, and the line underneath fills back up.'},
  {id:'escape',name:'Progress',text:'How far you are through all 100 floors.'},
  {id:'foes',name:'Foes',text:'The dashes over a foe are its health. A dashed line and a ! mean it is winding up to strike along that line: dash through it, step aside, or cut across it to parry.'},
  {id:'buttons',name:'Buttons',key:'Keys',text:'Heal, Mend and Thirst spend the blood orb. Kunai and Shuri throw tools; the number is how many are left. Throw hurls your weapon, Dash dodges, 技 arms a technique, Take picks things up and talks.',keyText:'Q heal · F mend · R Bloodthirst · X kunai · C shuriken · G throw your weapon · Space dash · E take or talk · Right-click trace a technique · Esc pause'},
];
const HG_W=220;
function hudGuide(onDone){
  if(!$('demoOv')){onDone&&onDone();return;}
  S.demo={id:'hud',tab:0,t:0,open:0,touch:!!S.touchUI,onDone,last:performance.now(),snap:null};
  S.swipe=null;S.trace=null;try{keys.clear();}catch(_){}
  $('demoOv').querySelector('.demo-box').classList.add('hud');
  const tb=$('demoTabs');tb.hidden=false;tb.innerHTML=HUD_TABS.map((x,i)=>`<button type="button" data-hg="${i}">${esc(tr(S.touchUI||!x.key?x.name:x.key))}</button>`).join('');
  hudTab(0);$('demoOv').hidden=false;sfx('blip',700);requestAnimationFrame(demoFrame);
}
function hudTab(i){
  const d=S.demo;if(!d||d.id!=='hud')return;d.tab=clamp(i,0,HUD_TABS.length-1);d.t=0;const x=HUD_TABS[d.tab];
  $('demoK').textContent=`${tr('Your screen')} · ${d.tab+1} / ${HUD_TABS.length}`;$('demoTitle').textContent=d.touch||!x.key?x.name:x.key;$('demoTxt').textContent=d.touch||!x.keyText?x.text:x.keyText;
  const tb=$('demoTabs');[...tb.children].forEach((b,j)=>b.classList.toggle('on',j===d.tab));const on=tb.children[d.tab];if(on&&on.scrollIntoView)try{on.scrollIntoView({block:'nearest',inline:'center'});}catch(_){}
  demoBtn();
}
function hudClose(){const box=$('demoOv').querySelector('.demo-box');box.classList.remove('hud');const tb=$('demoTabs');tb.hidden=true;tb.innerHTML='';}
// the real HUD, drawn onto a small canvas with sample numbers; state is put back afterwards
function hudSnap(){
  const c=mk(HG_W,LH),g=c.getContext('2d');g.imageSmoothingEnabled=false;
  const keep={lx,LW,touch:S.touchUI,floor:S.floor,room:S.room,mon:S.mon,carry:S.carry,meter:S.meter,mode:S.mode,gmx:S.gmx,quest:S.quest,reveal:S.revealAll,traceCd:S.traceCd,traceCdMax:S.traceCdMax,mapBottom:S.mapBottom,hp:P.hp,max:P.max,shield:P.shield,wpn:P.wpn,dbg:S.dbgTech};
  flush();
  try{
    lx=g;LW=HG_W;S.touchUI=true;S.mode='run';S.gmx=null;S.quest=null;S.revealAll=false;S.mon=48;S.carry=12;S.meter=orbMax()*0.62;S.traceCd=0;
    P.max=5;P.hp=4;P.shield=0;
    const w=makeWeapon('katana');w.dur=Math.round(w.max*0.6);P.wpn=w;if(!knownTech('katana').length)S.dbgTech=true;
    const R=(gx,gy,type,o)=>Object.assign({gx,gy,type,seen:true,visited:false,cleared:false,doors:{e:true,s:true}},o||{});
    const rooms=[R(0,0,'combat',{visited:true,cleared:true}),R(1,0,'combat',{visited:true}),R(2,0,'treasure'),R(1,1,'combat'),R(2,1,'shop'),R(0,1,'gate',{doors:{}})];
    const F={kind:'combat',n:3,stage:3,gateOpen:false,rooms:new Map(rooms.map((r,i)=>[i,r])),biome:keep.floor&&keep.floor.biome||{name:''}};
    S.floor=F;S.room=rooms[1];S.mapBottom=56;
    drawCompactHud();drawMinimap();drawAbilityChips();flush();
  }catch(e){try{console.error(e);}catch(_){}}
  const mb=S.mapBottom;
  lx=keep.lx;LW=keep.LW;S.touchUI=keep.touch;S.floor=keep.floor;S.room=keep.room;S.mon=keep.mon;S.carry=keep.carry;S.meter=keep.meter;S.mode=keep.mode;S.gmx=keep.gmx;S.quest=keep.quest;S.revealAll=keep.reveal;S.traceCd=keep.traceCd;S.traceCdMax=keep.traceCdMax;S.mapBottom=keep.mapBottom;
  P.hp=keep.hp;P.max=keep.max;P.shield=keep.shield;P.wpn=keep.wpn;S.dbgTech=keep.dbg;
  return{c,mb};
}
function hudFocus(id,mb){
  switch(id){
    case'souls':return[1,0,5*11+6,13];
    case'orb':return[3,16,100,10];
    case'purse':return[3,26,98,10];
    case'weapon':return[2,33,92,17];
    case'map':return[1,51,48,mb-51-9];
    case'tech':return[1,mb-1,64,17];
    case'escape':return[HG_W-30,LH-16,28,14];
  }
  return null;
}
function drawHudTab(g,d){
  const tab=HUD_TABS[d.tab];g.setTransform(1,0,0,1,0,0);g.globalAlpha=1;g.drawImage(tdFloor(),0,0);
  if(tab.id==='foes'){drawHudFoe(g,d.t);return;}
  if(tab.id==='buttons'){drawHudButtons(g,d.t,d.touch);return;}
  if(!d.snap)d.snap=hudSnap();
  const f=hudFocus(tab.id,d.snap.mb);if(!f)return;
  const sc=f[2]<=100&&f[3]<=54?2:1,vw=DEMO_W/sc,vh=DEMO_H/sc;
  const wx=clamp(Math.round(f[0]+f[2]/2-vw/2),0,HG_W-vw),wy=clamp(Math.round(f[1]+f[3]/2-vh/2),0,LH-vh);
  g.fillStyle='rgba(0,0,0,0.35)';g.fillRect(0,0,DEMO_W,DEMO_H);
  g.drawImage(d.snap.c,wx,wy,vw,vh,0,0,DEMO_W,DEMO_H);
  const rx=(f[0]-wx)*sc,ry=(f[1]-wy)*sc,rw=f[2]*sc,rh=f[3]*sc;
  g.fillStyle='rgba(6,4,5,0.62)';g.fillRect(0,0,DEMO_W,ry);g.fillRect(0,ry+rh,DEMO_W,DEMO_H-ry-rh);g.fillRect(0,ry,rx,rh);g.fillRect(rx+rw,ry,DEMO_W-rx-rw,rh);
  const p=Math.floor(d.t*3)%2,col=p?'#ff4a5c':'#b8142a';g.fillStyle=col;g.fillRect(rx-2,ry-2,rw+4,1);g.fillRect(rx-2,ry+rh+1,rw+4,1);g.fillRect(rx-2,ry-2,1,rh+4);g.fillRect(rx+rw+1,ry-2,1,rh+4);
  // a pixel finger pointing at it
  const bob=Math.round(Math.sin(d.t*5)*2),hx=Math.min(DEMO_W-18,rx+rw+6+bob),hy=Math.min(DEMO_H-20,ry+rh/2);DM.g=g;
  if(hx<DEMO_W-20)dHand(hx,hy,false);else dHand(Math.max(6,rx-16-bob),Math.min(DEMO_H-20,ry+rh+4),false);
}
// a real foe, its health dashes and its windup, on the lesson stage
function drawHudFoe(g,t){
  const c=HG_FOE||(HG_FOE=mk(DEMO_W/2,DEMO_H/2)),q=c.getContext('2d');q.imageSmoothingEnabled=false;q.setTransform(1,0,0,1,0,0);q.drawImage(tdFloor(),0,20,DEMO_W/2,DEMO_H/2,0,0,DEMO_W/2,DEMO_H/2);
  DM.g=g;flush();const keep=lx,X0=S.X0,Y0=S.Y0,gt=S.gt;lx=q;S.X0=0;S.Y0=0;S.gt=t;
  try{
    const T=TYPES.ronin,cyc=t%2.6,k=clamp(cyc/1.8,0,1),y=88,ex=150,path=tdLine(ex-26,y-24,30,y-24);
    tdHero(40,y,{frame:0});
    const e={T,look:T.look||'ronin',x:ex,y:y-13*0.6,r:13,vx:0,vy:0,anim:t,face:-1,hp:3,max:4,state:cyc<1.8?'wind':'strafe',t:(1-k)*1,wind:1,poseT:0,flash:0,cuts:[makeCut(path,1000,{team:'e'})],pat:T.pat,elite:false};
    drawEnemy(e);if(e.state==='wind')drawTelegraph(e);flush();
  }catch(e){try{console.error(e);}catch(_){}}
  lx=keep;S.X0=X0;S.Y0=Y0;S.gt=gt;
  g.drawImage(c,0,0,DEMO_W/2,DEMO_H/2,0,0,DEMO_W,DEMO_H);
  const p=Math.floor(t*3)%2?'#ff4a5c':'#b8142a';
  dtext('HEALTH',172,14,p,6);dline(166,17,154,30,'#ece4d7');
}
let HG_FOE=null;
// every button (or key) and what it does, drawn the way the game draws them
function drawHudButtons(g,t,touch){
  DM.g=g;g.fillStyle='rgba(6,4,5,0.55)';g.fillRect(0,0,DEMO_W,DEMO_H);
  const list=touch?[['HEAL','Heal'],['MEND','Mend'],['THIRST','Thirst'],['KUNAI','Kunai'],['SHURI','Shuri'],['THROW','Throw'],['DASH','Dash'],['技','Technique'],['TAKE','Take'],['II','Pause']]
    :[['Q','Heal'],['F','Mend'],['R','Thirst'],['X','Kunai'],['C','Shuri'],['G','Throw'],['SPACE','Dash'],['RMB','Technique'],['E','Take'],['ESC','Pause']];
  const lit=Math.floor(t/0.9)%list.length;
  list.forEach(([b,l],i)=>{const cx=22+(i%5)*39,cy=i<5?30:78,on=i===lit;
    if(touch){if(b==='II'){dr(cx-9,cy-9,18,18,on?'#ff4a5c':'#2a2028');dr(cx-3,cy-5,2,10,'#ece4d7');dr(cx+1,cy-5,2,10,'#ece4d7');}else dBtn(cx-2,cy-2,b,on,10);}
    else dKey(cx-(b.length>2?14:5),cy-6,b,on,b.length>2?28:undefined);
    dtext(l.toUpperCase(),cx,cy+20,on?'#ffffff':'#968b97',6);});
}

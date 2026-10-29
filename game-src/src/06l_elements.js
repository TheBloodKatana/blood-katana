// ================= Enkū, the element hermit, and the six elements he binds to your weapon =================
// From level x-3 on, a side room can hold his little shrine. One element per run; picking it again ranks it up to III.
// Every weapon or technique hit has a 10% chance to set it off (Void: 5%). Kunai, shuriken and thrown weapons never do.
const ELEMS=[
 {id:'fire',name:'Fire',jp:'火',col:'#ff5a1a',c2:'#ffb02a',c3:'#fff0a0',p:0.10,proc:'Sets the foe alight: three burn ticks over three seconds.',ranks:['','Burns spread to the nearest foe.','Four ticks, and burning foes take +1 from your cuts.']},
 {id:'frost',name:'Frost',jp:'氷',col:'#6ac8ff',c2:'#bfe8ff',c3:'#ffffff',p:0.10,proc:'Half speed for 2.5 s. The third chill freezes the foe solid.',ranks:['','Frozen foes shatter for 2 more damage when struck.','Two chills are enough to freeze.']},
 {id:'thunder',name:'Thunder',jp:'雷',col:'#ffe066',c2:'#9ad8ff',c3:'#ffffff',p:0.10,proc:'A bolt jumps to two foes nearby.',ranks:['','Three jumps.','Everything it touches is stunned for a moment.']},
 {id:'wind',name:'Wind',jp:'風',col:'#7ad890',c2:'#c8f8e0',c3:'#ffffff',p:0.10,proc:'A gust blade flies on through the foe, cutting a line and pushing back.',ranks:['','Two gust blades in a fan.','The gust drags nearby foes together first.']},
 {id:'earth',name:'Earth',jp:'土',col:'#b08a50',c2:'#7a6a5a',c3:'#e8d8b0',p:0.10,proc:'Stone spikes: a one-second stagger that breaks guard and armour.',ranks:['','The spikes ring outward and stagger foes around it.','Staggered foes take double damage.']},
 {id:'void',name:'Void',jp:'空',col:'#b48cff',c2:'#2a1a3a',c3:'#ffffff',p:0.05,proc:'Marks the foe: your next hit on it deals double. Foes under 15% health are executed.',ranks:['','Execute below 20%.','When a marked foe dies the mark jumps to the next one.']},
];
const ELEM_BY={};ELEMS.forEach(E=>ELEM_BY[E.id]=E);
const ROMAN=['','I','II','III'];
const elemNow=()=>S.elem&&ELEM_BY[S.elem.id];
const elemRank=()=>S.elem?S.elem.rank:0;
const SWAP_COST=30;

// ---------- the hermit's room ----------
function placeHermitRoom(R,cx,cy){
  R.deco.push({prop:'hokora',x:cx+70,y:cy-40});
  addObj(R,{kind:'npc',act:'hermit',spr:'enku',x:cx-20,y:cy-20,name:'Enkū'});
}
ACTS.hermit=function(o){
  const E=elemNow(),line=o.used?'"The mountain has answered you once on this level. Walk on."':
    `"Every blade has a temper under its temper. Pick one. When it bites, the mountain bites with it."${E?` You carry ${E.name} ${ROMAN[S.elem.rank]}.`:''}`;
  openDialog({spr:'enku',name:'Enkū',title:'the element hermit',text:line,choices:o.used?[{label:'Leave',fn:closeDialog}]:[{label:'Show me',fn:()=>{closeDialog();hermitOffer(o);}},{label:'Not today',fn:closeDialog}]});
};
function hermitOffer(o){
  const cur=S.elem,pool=shuffle(ELEMS.filter(E=>!cur||E.id!==cur.id)).slice(0,cur&&cur.rank<3?2:3);
  if(cur&&cur.rank<3)pool.unshift(ELEM_BY[cur.id]);
  const cards=pool.map(E=>{const same=cur&&cur.id===E.id,swap=cur&&!same;
    return{kind:same?`Rank ${ROMAN[cur.rank+1]} · free`:swap?`Swap · ${SWAP_COST} coins`:'Free',name:`${E.jp} ${E.name}`,desc:same?E.ranks[cur.rank]:E.proc+(E.p<0.1?' Rarer: 5% per hit.':''),dis:swap&&S.mon<SWAP_COST};});
  openChooser({cancel:'Not today',eyebrow:'Enkū, the element hermit',title:cur?'Rank up, or trade tempers':'Choose a temper',sub:'One element at a time. Every hit has a 10% chance to set it off.',cards,
    pick:j=>{const E=pool[j],same=cur&&cur.id===E.id;
      if(cur&&!same){if(S.mon<SWAP_COST){sfx('deny');return;}S.mon-=SWAP_COST;}
      S.elem=same?{id:E.id,rank:cur.rank+1}:{id:E.id,rank:1};o.used=true;
      text(P.x,P.y-60,`${E.name.toUpperCase()} ${ROMAN[S.elem.rank]}`,E.col,true);sfx('learn');sfx('gong');burst(P.x,P.y-16,30,E.col,260,0.6,2);
      if(typeof featEvent==='function')try{featEvent('element',E.id);}catch(_){}
      renderPerkStrip();}});
}

// ---------- procs ----------
function elemChance(){const E=elemNow();return E?E.p:0;}
function elemTryProc(e,s){
  if(!S.elem||s.elem||s.tool||s.thrown||s.child||s.team!=='p')return;
  if(Math.random()>=elemChance())return;elemProc(e,s);
}
function elemNear(e,r,n){return S.enemies.filter(o=>o!==e&&o.state!=='spawn'&&!o.smoke&&!o.air&&!o.T.sumo&&!o.T.dummy&&dist(o,e)<r).sort((a,b)=>dist(a,e)-dist(b,e)).slice(0,n);}
function elemProc(e,s){
  const E=elemNow(),rk=elemRank();e.elemFx=true;
  switch(E.id){
    case'fire':{const ign=o=>{o.elemFx=true;o.burnT=rk>=3?4:3;o.burnTick=1;};ign(e);if(rk>=2)for(const o of elemNear(e,110,1))ign(o);
      burst(e.x,e.y-14,14,E.col,180,0.5,2);text(e.x,e.y-48,'IGNITED',E.c2);sfx('fire');break;}
    case'frost':{e.chill=(e.chill||0)+1;e.slowT=2.5;burst(e.x,e.y-14,12,E.c2,140,0.5,2);
      if(e.chill>=(rk>=3?2:3)){e.chill=0;e.frozen=1.5;stunEnemy(e,e.boss?0.6:1.5);text(e.x,e.y-48,'FROZEN',E.c2,true);sfx('shotcut');S.rings.push({x:e.x,y:e.y-12,r:40,life:0.35,col:E.c2});}
      else text(e.x,e.y-48,'CHILLED',E.c2);break;}
    case'thunder':{const hits=elemNear(e,190,rk>=2?3:2);let from={x:e.x,y:e.y-14};
      for(const o of hits){S.bolts.push({a:from,b:{x:o.x,y:o.y-14},life:0.2});damageEnemy(o,1);o.flash=1;if(rk>=3)stunEnemy(o,o.boss?0.15:0.4);if(o.hp<=0)kill(o,null);from={x:o.x,y:o.y-14};}
      if(rk>=3)stunEnemy(e,e.boss?0.15:0.4);burst(e.x,e.y-14,10,E.col,220,0.3,1);sfx('zap');break;}
    case'wind':{const a0=Math.atan2(e.y-P.y,e.x-P.x);
      if(rk>=3)for(const o of elemNear(e,150,4)){const d=dist(o,e)||1;o.kx+=(e.x-o.x)/d*380;o.ky+=(e.y-o.y)/d*380;}
      for(const off of rk>=2?[-0.32,0.32]:[0]){const a=a0+off,st={x:e.x+Math.cos(a)*10,y:e.y-10+Math.sin(a)*10},en=inArena({x:st.x+Math.cos(a)*280,y:st.y+Math.sin(a)*280},4);
        const pts=clipPts([st,en],['wall'],2).pts;if(pts.length<2||dist(pts[0],pts[pts.length-1])<20)continue;
        const c=makeCut(pts,1150,{team:'p',ab:{pierce:true},hr:11,isWave:true,elem:true,fam:++FAM,dmgBonus:0,wid:0,noPoise:true});S.slashes.push(c);}
      sfx('gust');break;}
    case'earth':{const st=o=>{o.elemFx=true;stunEnemy(o,o.boss?0.35:1);o.armorT=0;o.cstance=0;o.stagT=1;for(let i=0;i<5;i++)S.parts.push({x:o.x+rand(-14,14),y:o.y+rand(-4,6),vx:0,vy:-rand(40,90),life:0.45,max:0.45,size:2,col:i%2?E.col:E.c3});};
      st(e);if(rk>=2)for(const o of elemNear(e,90,6))st(o);S.rings.push({x:e.x,y:e.y,r:rk>=2?90:30,life:0.35,col:E.col});S.shake+=4;text(e.x,e.y-48,'STAGGERED',E.c3);sfx('smash');break;}
    case'void':{const th=rk>=2?0.2:0.15;
      if(!e.boss&&e.hp>0&&e.hp<=Math.ceil(e.max*th)){e.hp=0;text(e.x,e.y-52,'EXECUTED',E.col,true);burst(e.x,e.y-14,24,E.col,260,0.5,2);sfx('ult');S.flash=0.08;break;}
      e.markT=3;e.markFresh=true;text(e.x,e.y-48,'MARKED',E.col);sfx('blink');break;}
  }
}
// extra damage from tempers already on the foe, worked out before a hit lands
function elemDmg(e,s,d){
  if(!S.elem||!e.elemFx)return d;const rk=elemRank(),id=S.elem.id;
  if(id==='fire'&&rk>=3&&e.burnT>0)d+=1;
  if(id==='frost'&&rk>=2&&e.frozen>0){d+=2;e.frozen=0;burst(e.x,e.y-14,18,'#bfe8ff',260,0.4,2);text(e.x,e.y-48,'SHATTER','#bfe8ff');}
  if(id==='earth'&&rk>=3&&e.stagT>0)d*=2;
  if(id==='void'&&e.markT>0&&!e.markFresh){d*=2;e.markT=0;}
  e.markFresh=false;return d;
}
// timers on a foe; returns true when a burn killed it
function elemTick(e,gdt){
  if(e.slowT>0)e.slowT-=gdt;if(e.frozen>0)e.frozen-=gdt;if(e.stagT>0)e.stagT-=gdt;if(e.markT>0)e.markT-=gdt;
  if(e.burnT>0){e.burnT-=gdt;e.burnTick-=gdt;if(Math.random()<gdt*14)S.parts.push({x:e.x+rand(-8,8),y:e.y-rand(4,24),vx:rand(-6,6),vy:-rand(30,60),life:0.35,max:0.35,size:1,col:pick(['#ff5a1a','#ffb02a','#fff0a0'])});
    if(e.burnTick<=0){e.burnTick=1;damageEnemy(e,1);text(e.x,e.y-40,'BURN','#ffb02a');if(e.hp<=0){kill(e,null);return true;}}}
  return false;
}
function elemOnKill(e){if(e.markT>0&&S.elem&&S.elem.id==='void'&&S.elem.rank>=3){const n=elemNear(e,220,1)[0];if(n){n.elemFx=true;n.markT=3;n.markFresh=false;S.bolts.push({a:{x:e.x,y:e.y-14},b:{x:n.x,y:n.y-14},life:0.18});}}}
// what a tempered foe looks like
function drawElemOn(e){
  if(!e.elemFx||e.air)return;const x=LX(e.x),y=LY(e.y),top=y-(SPR[e.look]?SPR[e.look].h:30)+2;
  if(e.frozen>0){for(let yy=top+4;yy<y;yy+=3)for(let xx=-6;xx<=6;xx+=3)pset(x+xx+((yy>>1)&1),yy,'#bfe8ff',0.55);}
  if(e.slowT>0&&!(e.frozen>0)&&Math.floor(S.gt*5)%2)pset(x+rand(-6,6),y-rand(2,20),'#ffffff');
  if(e.markT>0){const r=6;for(let i=0;i<12;i++){const a=i/12*Math.PI*2+S.gt*3;if(i%2)pset(x+Math.cos(a)*r,top-4+Math.sin(a)*r*0.5,'#b48cff');}pset(x,top-4,'#ffffff');}
  if(e.stagT>0)for(let i=0;i<3;i++){const a=S.gt*6+i*2.1;pset(x+Math.cos(a)*7,top-2+Math.sin(a)*2,'#e8d8b0');}
}
function elemChip(){const E=elemNow();return E?`<span class="pchip elem" style="border-color:${E.col};color:${E.col}" title="${esc(E.proc)}">${E.jp} ${E.name} ${ROMAN[S.elem.rank]}</span>`:'';}

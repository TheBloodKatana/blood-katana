// ================= the Shrine of the Broken Blade (hub), the rest place, and the people in them =================
const HUB_UP=[ // permanent unlocks sold by the hub tanuki, paid with banked shards
  {id:'slots',name:'A bigger pouch',desc:'Carry one more treasure.',max:2,cost:[60,120]},
  {id:'boons',name:'A deeper soul',desc:'Hold one more boon.',max:1,cost:[100]},
  {id:'tools',name:'Tool belt',desc:'Start every run with one more kunai and shuriken.',max:2,cost:[45,90]}
];
const WARASHI_TIPS=[
  'Lords paint shapes in the air before their worst attacks. Trace the same shape while they paint it and the attack breaks on them.',
  'Draw a shape, hold still for a breath until the ink pools, then draw a second one. Two techniques, one stroke. It costs both recharges.',
  'Shields only face one way. Get behind them, or hook them, or bring something heavy.',
  'Pink lunges marked 掴 are grabs. No parry and no counter stance stops them. Dash through, or be somewhere else.',
  'The ink monks wipe your trails away and blot your brush. Kill them first if you rely on techniques.',
  'Floaters over the water and the clouds are out of reach of short blades. Chains, spears, guns and kunai reach them.',
  'You can only carry four treasures and four boons. The altar at the rest place lets you change one.',
  'Shards are only safe at the store floor of a new realm, or at the rest place after the mini boss.'
];
const ACTS={
  onsen(o){openDialog({spr:'merchant',name:'Hot spring',title:'rest',text:'Steam curls off the water. The ache in your soul loosens just looking at it.',choices:[
    {label:'Bathe (heal fully)',dis:o.used,fn:()=>{o.used=true;P.hp=P.max;sfx('heal');S.flash=0.1;say('You sink to the chin. When you climb out, you are whole again.');}},
    {label:'Leave',fn:closeDialog}]});},
  altar(o){const boons=Object.keys(S.owned);openDialog({spr:'jizo',name:'Altar of Change',title:'once per visit',text:'A stone altar with two candles. Whatever you lay on it comes back as something else.',choices:[
    {label:'Exchange a boon',dis:o.used||!boons.length,fn:()=>{closeDialog();openChooser({eyebrow:'Altar of Change',title:'Which boon do you lay on the altar?',cards:boons.map(id=>{const p=PERKS.find(x=>x.id===id);return{kind:'Exchange',name:p.name,desc:p.desc};}),cancel:'Nothing',
      pick:i=>{const old=boons[i];const pool=shuffle(PERKS.filter(p=>perkAvailable(p)&&p.id!==old)).slice(0,3);if(!pool.length)return;o.used=true;
        openChooser({eyebrow:'Altar of Change',title:'It comes back as…',cards:pool.map(p=>({kind:p.kind,name:p.name,desc:p.desc})),pick:j=>{delete S.owned[old];S.owned[pool[j].id]=1;recomputeMods();if(pool[j].onTake)pool[j].onTake();text(P.x,P.y-50,pool[j].name.toUpperCase(),C.hi);sfx('learn');}});}});}},
    {label:'Reforge a treasure',dis:o.used||!S.items.length,fn:()=>{closeDialog();openChooser({eyebrow:'Altar of Change',title:'Which treasure do you lay on the altar?',cards:S.items.map(k=>({kind:'Reforge',name:ITEM[k].name,desc:ITEM[k].desc})),cancel:'Nothing',
      pick:i=>{o.used=true;const old=S.items[i],t=ITEM[old].tier,nw=randomItem(Math.max(0,t-1),Math.min(3,t+1));S.items[i]=nw;recomputeMods();S.itemBanner={name:ITEM[nw].name,desc:ITEM[nw].desc,icon:ITEM[nw].icon,t:3};sfx('learn');}});}},
    {label:'Leave',fn:closeDialog}]});},
  gate(o){
    // the descent always starts at the top: no skipping to realms already opened
    {openDialog({spr:'miko',name:'The gate',title:'the descent',text:'Past the torii the stairs go down into the first realm. A hundred floors stand between you and the man who took your blade.',choices:[{label:'Descend',fn:()=>{closeDialog();startRun(0);}},{label:'Not yet',fn:closeDialog}]});return;}
  },
  armorer(o){
    // the rack: copies of blades pried from the dead (30 shards), and five weapons only the shrine forges
    const seen=WKEYS.filter(k=>!FORGE_W.includes(k)&&META.wseen[k]),list=seen.concat(FORGE_W);
    const cards=list.map(k=>{const W=WEAPONS[k],own=up('hub','start_'+k),cur=META.startW===k,cost=FORGE_W.includes(k)?W.forge:30;
      return{kind:cur?'Carried':own?'Yours · carry it':FORGE_W.includes(k)?`Forge · ${cost} 血晶`:`Commission · ${cost} 血晶`,name:W.name+' '+W.jp,desc:[W.desc,...W.moves].join(' · '),dis:cur||(!own&&META.shards<cost),k,own,cost};});
    cards.push({kind:META.startW?'Put it down':'Carried',name:'Only the broken blade',desc:'Go down with nothing but your own blade.',dis:!META.startW,k:''});
    openChooser({eyebrow:'Old armorer',title:'The rack',sub:`"Every blade you take from the dead, I copy. Five more I forge myself." You have ${META.shards} 血晶.`,cards,cancel:'Leave',pick:i=>{const c=cards[i];
      if(!c.k){META.startW='';saveMeta();P.wpn=null;return;}
      if(!c.own){META.shards-=c.cost;META.up['hub.start_'+c.k]=1;if(!META.wseen[c.k]){META.wseen[c.k]=true;}sfx('temper');if(typeof featEvent==='function')featEvent('forge',c.k);}
      META.startW=c.k;saveMeta();P.wpn=makeWeapon(c.k,{});S.wpnBanner={w:P.wpn,t:2};}});
  },
  hubshop(o){
    const ch=HUB_UP.map(u=>{const lv=up('hub',u.id),done=lv>=u.max,c=done?0:u.cost[lv];return{label:done?`${u.name} · owned`:`${u.name} · ${c} 血晶 · ${u.desc}`,dis:done||META.shards<c,fn:()=>{META.shards-=c;META.up['hub.'+u.id]=lv+1;saveMeta();sfx('buy');sfx('temper');recomputeMods();if(u.id==='tools'){S.tools.kunai++;S.tools.shuri++;}say('"Pon! A pleasure. Come back richer."',[{label:'Continue',fn:()=>ACTS.hubshop(o)}]);}};});
    ch.push({label:'Leave',fn:closeDialog});
    openDialog({spr:'merchant',name:'Tanuki quartermaster',title:'shrine stores',text:`"Shards for comforts, comforts for shards. You have ${META.shards}."`,choices:ch});
  },
  archivist(o){
    const lords=Object.values(BOSSES).filter(b=>!b.mini).length,seen=Object.keys(META.seen||{}).length;
    openDialog({spr:'archivist',name:'Kitsune archivist',title:'keeper of names',text:`"${META.kills} foes cut down. ${seen} kinds of foe written into my scrolls. ${(META.realms||0)} realm${(META.realms||0)===1?'':'s'} opened of ${BIOMES.length}. ${lords} lords wait below."`,choices:[
      {label:'Feats',fn:()=>{closeDialog();menuOpen('feats',false);}},{label:'Bestiary',fn:()=>{closeDialog();menuOpen('bestiary',false);}},
      {label:'Ask about the lords',fn:()=>say('"Every realm has two lords and two lesser wardens. Which ones you meet is fate. The worst of them paint shapes in the air. Paint the same shape back, quickly, and their own brush cuts them."')},
      {label:'Ask about the realms',fn:()=>say(`"${BIOMES.map((B,i)=>`${i+1}. ${B.name}`).join('  ')}. The last one is not a hell at all. It is his castle."`)},
      {label:'Leave',fn:closeDialog}]});
  },
  monk(o){
    openDialog({spr:'monk2',name:'Old monk',title:'records',text:`"Runs: ${META.runs}. Escapes: ${META.wins}. Deepest: level ${META.bestFloor?`${Math.ceil(META.bestFloor/FPR)}-${(META.bestFloor-1)%FPR+1}`:'none'}. Mastery of the Blood Tree: ${masteryPct()}%."`,choices:[
      {label:'Look at the Blood Tree',fn:()=>{closeDialog();openTree({view:false});}},
      {label:S.tut?'Stop training':'Train with the straw man',fn:()=>{closeDialog();if(S.tut)endTutorial(true);else startTutorial();}},
      {label:'Relive the last night',fn:()=>{closeDialog();startPrologue();}},
      {label:'Leave',fn:closeDialog}]});
  },
  warashi(o){openDialog({spr:'warashi',name:'Zashiki-warashi',title:'shrine child',text:pick(WARASHI_TIPS),choices:[{label:'Another one',fn:()=>say(pick(WARASHI_TIPS),[{label:'Thanks',fn:closeDialog}])},{label:'Thanks',fn:closeDialog}]});}
};
function populateHub(R){
  const cx=R.w/2,cy=R.h/2;
  R.deco.push({prop:'shrine',x:cx,y:WALL+170},{prop:'sakura',x:cx-470,y:WALL+190},{prop:'sakura',x:cx+470,y:WALL+190},{prop:'rack',x:cx-300,y:cy+250},{prop:'nobori',x:cx-560,y:cy+120},{prop:'nobori',x:cx+560,y:cy+120});
  R.deco.push({prop:'gate',x:cx+600,y:cy-20});addObj(R,{kind:'npc',hidden:true,act:'gate',x:cx+600,y:cy-10,name:'The gate',label:'DESCEND',big:20});
  placeSmith(R,cx-640,cy-40);
  addObj(R,{kind:'npc',act:'armorer',spr:'armorer',x:cx-250,y:cy+240,name:'Old armorer'});
  addObj(R,{kind:'npc',act:'hubshop',spr:'merchant',x:cx+260,y:cy+240,name:'Tanuki quartermaster'});
  addObj(R,{kind:'npc',act:'archivist',spr:'archivist',x:cx+170,y:WALL+250,name:'Kitsune archivist'});
  addObj(R,{kind:'npc',act:'monk',spr:'monk2',x:cx-170,y:WALL+250,name:'Old monk'});
  addObj(R,{kind:'npc',act:'warashi',spr:'warashi',x:cx+380,y:cy+60,name:'Zashiki-warashi'});
  R.onsen={x:cx+430,y:cy+330};
  placeShrineNpcs(R);
}

// ================= training: a short, skippable lesson with the straw man the first time you reach the shrine =================
const TUT=[
  {id:'move',name:'Move',key:'WASD or the arrow keys',touch:'Put your thumb in the lower left. The stick appears under it'},
  {id:'dash',name:'Dash',key:'Space. You pass through attacks while dashing',touch:'DASH. You pass through attacks while dashing'},
  {id:'tap',name:'Quick slash',key:'Click near the straw man',touch:'Tap near the straw man'},
  {id:'swipe',name:'Cut',key:'Drag the mouse in a line through him',touch:'Swipe a line through him'},
  {id:'hold',name:'Charged move',key:'Press and hold still, then let go',touch:'Hold your finger still, then lift it'},
  {id:'parry',name:'Parry',key:'Your sparring partner swings slowly. Cut across his yellow line as it travels',touch:'Your sparring partner swings slowly. Swipe across his yellow line as it travels'},
  {id:'tech',name:'Technique',key:'Hold right-click and draw a circle: Blood Spin',touch:'Press 技, then draw a circle: Blood Spin'},
];
function startTutorial(){
  S.tut={i:0,moved:0,lx:P.x,ly:P.y,done:false,t:0};S.tutSafe=true;sfx('learn');
  S.banner={name:'TRAINING',title:'The straw man has all day',t:2.2};tutDemo(TUT[0]);
}
function endTutorial(skipped){
  if(!S.tut)return;S.tut=null;S.tutSafe=false;META.tut=1;saveMeta();
  for(const e of [...S.enemies])if(e.practice){e.hp=0;kill(e,null,true);}
  if(!skipped){S.banner={name:'TRAINING COMPLETE',title:'The gate east of the shrine leads down',t:2.6};sfx('gong');addMeter(30);}
}
function tutEvent(ev){
  if(S.pro)proEvent(ev);
  const t=S.tut;if(!t||t.done)return;const st=TUT[t.i];if(!st||st.id!==ev)return;tutNext();
}
function tutNext(){
  const t=S.tut;t.i++;sfx('learn');text(P.x,P.y-60,'✓',C.spirit,true);
  if(t.i>=TUT.length){endTutorial(false);return;}
  tutDemo(TUT[t.i]);
  if(TUT[t.i].id==='parry')spawnSparring();
  if(TUT[t.i].id==='tech'){for(const e of [...S.enemies])if(e.practice){e.hp=0;kill(e,null,true);}S.traceCd=0;}
}
function spawnSparring(){
  const R=S.room,e=spawnEnemy('ronin',{pos:{x:clamp(P.x+150,WALL+60,R.w-WALL-60),y:P.y},quick:true});if(!e)return;
  e.practice=true;e.hp=e.max=999;e.T=Object.assign({},e.T,{name:'Sparring partner',pats:['cross'],tele:2.6,cd:1.6,dodge:0,guard:0,feint:0,range:420,pref:[110,160]});e.cd=1.2;
}
function updateTutorial(gdt){
  const t=S.tut;if(!t)return;t.t+=gdt;
  if(TUT[t.i]&&TUT[t.i].id==='move'){t.moved+=Math.hypot(P.x-t.lx,P.y-t.ly);if(t.moved>260)tutNext();}
  t.lx=P.x;t.ly=P.y;
  if(TUT[t.i]&&TUT[t.i].id==='parry'&&!S.enemies.some(e=>e.practice))spawnSparring();
}
function drawTutorial(){
  const t=S.tut;if(!t||S.trace||S.traceArm)return;const st=TUT[t.i];if(!st)return;
  const w=Math.min(LW-130,250),x0=Math.max(116,Math.round(LW/2-w/2)),y0=S.touchUI?8:6,lines=wrapText((S.touchUI?st.touch:st.key).toUpperCase(),Math.floor(w/5.2));flush();
  lx.fillStyle='rgba(8,4,6,0.86)';lx.fillRect(x0,y0,w,22+lines.length*9);lx.fillStyle=C.spirit;lx.fillRect(x0,y0,w,1);
  for(let i=0;i<TUT.length;i++){lx.fillStyle=i<t.i?C.spirit:i===t.i?C.bone:'#3a3040';lx.fillRect(x0+w-8-(TUT.length-1-i)*6,y0+5,4,4);}
  ptext(`TRAINING ${t.i+1}/${TUT.length} · ${st.name.toUpperCase()}`,x0+6,y0+11,C.spirit,8,'left');
  lines.forEach((l,i)=>ptext(l,x0+6,y0+21+i*9,C.bone,8,'left'));
}

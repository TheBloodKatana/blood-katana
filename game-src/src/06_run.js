// ================= run loop: the shrine hub, rooms, loot, shops, rest places, encounters, boons =================
// ---------- economy helpers ----------
function giveMon(n){if(n<=0)return;if(S.gmx)n=Math.max(1,Math.round(n*S.gmx.coinMul));S.mon+=n;text(P.x,P.y-54,`+${n} 文`,C.mon);sfx('coin');}
function takeMon(n){S.mon=Math.max(0,S.mon-n);}
function giveShards(n){if(n<=0)return;if(S.gmx&&S.gmx.shardMul!==1)n=Math.round(n*S.gmx.shardMul);S.shardsRun+=n;S.carry+=n;text(P.x,P.y-62,`+${n} 血晶 CARRIED`,C.shard);sfx('shard');}
function bankShards(why){if(S.carry<=0||S.dead>0)return;META.shards+=S.carry;S.banner={name:`${S.carry} 血晶 BANKED`,title:why||'The Blind Smith keeps them safe now',t:2.4};S.carry=0;saveMeta();sfx('shard');}
function heal(n){if(S.gmx&&S.gmx.noHeal&&!S.inHub)return;const b=P.hp;P.hp=Math.min(P.max,P.hp+n);if(P.hp>b){text(P.x,P.y-50,`+${P.hp-b} SOUL`,C.hi);sfx('heal');burst(P.x,P.y-14,10,C.hi,140,0.5,2);}}
function addMax(n){S.runMax=(S.runMax||0)+n;recomputeMods();}
const shopMul=()=>S.mods.discount*(S.follower&&S.follower.leaving===undefined?0.85:1);
// treasures and boons are limited: nothing stacks, and when the slots are full you choose what to let go
const itemSlots=()=>4+up('hub','slots');
const boonSlots=()=>4+up('hub','boons');
function recomputeMods(){
  const before=P.max;S.mods=freshMods();S.perkAb={};
  S.mods.dashCdMul*=Math.pow(0.9,up('body','dash'));S.mods.discount*=Math.pow(0.92,up('body','haggle'));
  for(const id of S.items){const it=ITEM[id];if(!it)continue;if(it.apply)it.apply(S.mods);if(it.ab)for(const k of it.ab)S.perkAb[k]=true;}
  for(const id in S.owned){const p=PERKS.find(x=>x.id===id);if(!p)continue;if(p.apply)p.apply(S.mods);if(p.ab)for(const k of p.ab)S.perkAb[k]=true;}
  if(S.gmx){S.mods.moveMul*=S.gmx.moveMul;S.mods.dashCdMul*=S.gmx.dashMul;S.mods.teleMul*=S.gmx.teleMul;}
  P.max=Math.max(1,CFG.maxHp+up('body','soul')+S.mods.maxHp+(S.runMax||0)+(S.gmx?S.gmx.maxAdd:0));if(S.gmx&&S.gmx.ippon)P.max=1;
  if(before&&P.max>before)P.hp+=P.max-before;P.hp=Math.min(P.hp,P.max);
  if(!S.mods.roomShield)P.shield=0;
  renderPerkStrip();
}
function ownedItem(id){return S.items.includes(id);}
function randomItem(minTier,maxTier){const lo=Math.min(maxTier??3,(minTier??1)+(S.gmx&&S.gmx.lucky?1:0)),hi=maxTier??3,inT=i=>i.pool!==false&&i.tier>=lo&&i.tier<=hi;
  let pool=ITEMS.filter(i=>inT(i)&&!ownedItem(i.id)&&!(S.room&&S.room.objs&&S.room.objs.some(o=>o.id===i.id)));if(!pool.length)pool=ITEMS.filter(i=>inT(i)&&!ownedItem(i.id));if(!pool.length)pool=ITEMS.filter(inT);return pick(pool).id;}
function giveItem(id){
  const it=ITEM[id];if(!it)return true;
  if(it.consume){it.consume();S.itemBanner={name:it.name,desc:it.desc,icon:it.icon,t:2.4};sfx('pickup');return true;}
  if(ownedItem(id)){text(P.x,P.y-50,'YOU ALREADY CARRY ONE',C.ash);sfx('deny');return false;}
  if(S.items.length>=itemSlots())return false;
  S.items.push(id);recomputeMods();if(id==='karakasa')P.shield=1;
  S.itemBanner={name:it.name,desc:it.desc,icon:it.icon,t:3.2};sfx('pickup');S.flash=Math.max(S.flash,0.06);return true;
}
// make room for a new treasure: pick one to drop on the floor (or walk away)
function swapItem(id,done){
  const it=ITEM[id];
  openChooser({eyebrow:`Treasures · ${S.items.length}/${itemSlots()} slots`,title:`Your pouch is full. Make room for ${it.name}?`,sub:it.desc,
    cards:S.items.map(k=>({kind:'Drop this',name:ITEM[k].name,desc:ITEM[k].desc})),cancel:'Leave it',
    pick:i=>{const old=S.items[i];S.items.splice(i,1);const p=freeSpot(S.room,P.x+rand(-30,30),P.y+30,10);addObj(S.room,{kind:'item',id:old,x:p.x,y:p.y,dropT:1.2});giveItem(id);if(done)done(true);},
    onCancel:()=>{if(done)done(false);}});
}
// ---------- the generic chooser (boons, swaps, the altar, the hub) ----------
function openChooser(o){
  S.chooser=o;S.choosing=true;S.swipe=null;S.trace=null;keys.clear();
  $('perkEyebrow').textContent=o.eyebrow||'';$('perkTitle').textContent=o.title||'';$('perkSub').textContent=o.sub||'';$('perkSub').hidden=!o.sub;
  $('perkCards').innerHTML=o.cards.map((p,i)=>`<button class="perk${p.dis?' dis':''}" type="button" data-i="${i}"${p.dis?' disabled':''}><span class="pk"><span>${esc(p.kind||'')}</span><span>${i+1}</span></span><span class="pn">${esc(p.name)}</span><span class="pd">${esc(p.desc||'')}</span></button>`).join('')+(o.cancel?`<button class="perk skip" type="button" data-i="-1"><span class="pk"><span>&nbsp;</span><span>Esc</span></span><span class="pn">${esc(o.cancel)}</span></button>`:'');
  $('perkOv').hidden=false;sfx('boon');coolDown($('perkCards'),450);
  const first=$('perkCards').querySelector('button:not([disabled])');if(first)first.focus({preventScroll:true});
}
function closeChooser(){S.chooser=null;S.choosing=false;$('perkOv').hidden=true;last=performance.now();}
function chooserPick(i){
  const o=S.chooser;if(!o)return;
  if(i<0){if(!o.cancel)return;closeChooser();sfx('click');if(o.onCancel)o.onCancel();return;}
  const c=o.cards[i];if(!c||c.dis)return;closeChooser();sfx('click');o.pick(i);
}

// ---------- room objects: pickups, items, NPCs, the exit ----------
function addObj(R,o){o.t=0;o.z=o.z||0;o.vz=o.vz||0;o.vx=o.vx||0;o.vy=o.vy||0;R.objs.push(o);return o;}
function scatter(R,kind,x,y,n,extra){for(let i=0;i<n;i++){const a=Math.random()*Math.PI*2,v=rand(60,220);addObj(R,Object.assign({kind,x,y,vx:Math.cos(a)*v,vy:Math.sin(a)*v*0.7,z:rand(6,14),vz:rand(140,260)},extra));}}
function dropLoot(e){if(e.practice)return;
  if(e.illusion||e.T.dummy)return;const R=S.room,f=fl();
  const coinN=e.boss?ri(12,18):(Math.random()<0.55?ri(1,2)+(e.elite?3:0):(e.elite?3:0));
  scatter(R,'coin',e.x,e.y,Math.round(coinN*S.mods.coinMul*(capOn('body','luck')?1.25:1)*(S.follower&&S.follower.leaving===undefined?1.5:1)));
  let sh=0;const chance=0.08*CFG.shardMul;
  if(e.boss)sh=Math.round((10+f*5)*CFG.shardMul*(e.T.mini?0.5:1));else{if(Math.random()<chance)sh=1;if(e.elite)sh+=Math.round(ri(2,3)*CFG.shardMul);}
  scatter(R,'shard',e.x,e.y,sh);
}
// weapons as loot: worn ones from the dead, fine and named ones from chests, treasure rooms and lords
function lootWeapon(q){const id=pick(WKEYS);
  if(q==='named'){const nm=pick(DUEL_GIV);return makeWeapon(id,{named:true,name:`${nm}'s ${WEAPONS[id].name}`,perk:pick(NAMED_PERKS).id});}
  if(q==='fine')return makeWeapon(id,{fine:true});return makeWeapon(id,{worn:q==='worn'?rand(0.45,0.8):rand(0.85,1)});}
function claimPair(o){if(!o.pair)return;for(const x of S.room.objs)if(x!==o&&x.pair===o.pair&&!x.gone){x.gone=true;burst(x.x,x.y-20,14,'#cfc8b8',160,0.5,2);}text(o.x,o.y-50,'THE OTHER FADES',C.ash);}
function updateObjs(gdt){
  const R=S.room;
  for(const o of R.objs){
    o.t+=gdt;if(o.dropT>0)o.dropT-=gdt;
    if(o.kind==='coin'||o.kind==='shard'||o.kind==='onigiri'||o.kind==='vial'||o.kind==='weapon'||o.kind==='toolpack'){
      if(o.z>0||o.vz>0){o.vz-=700*gdt;o.z+=o.vz*gdt;if(o.z<0){o.z=0;o.vz=o.vz<-80?-o.vz*0.35:0;}}
      o.x+=o.vx*gdt;o.y+=o.vy*gdt;const k=Math.max(0,1-gdt*4);o.vx*=k;o.vy*=k;Object.assign(o,inArena(o,6));pushOut(o,6,true);
      const d=dist(o,P);
      if((o.kind==='coin'||o.kind==='shard')&&o.t>0.45&&d<80*S.mods.magnet&&S.dead<=0){o.x+=(P.x-o.x)/d*Math.min(d,420*gdt);o.y+=(P.y-o.y)/d*Math.min(d,420*gdt);}
      if(d<20&&o.t>0.3&&S.dead<=0){
        if(o.kind==='coin'){o.gone=true;S.mon+=1;sfx('coin');S.parts.push({x:o.x,y:o.y-6,vx:0,vy:-60,life:0.3,max:0.3,size:1,col:C.mon});}
        else if(o.kind==='shard'){o.gone=true;S.shardsRun++;S.carry++;sfx('shard');text(o.x,o.y-20,'+1 血晶',C.shard);}
        else if(o.kind==='onigiri'&&P.hp<P.max){o.gone=true;heal(1);}
        else if(o.kind==='vial'){o.gone=true;addMeter(25);sfx('orb');text(P.x,P.y-50,'+25 BLOOD',C.hi);}
        else if(o.kind==='toolpack'){o.gone=true;S.tools.kunai=toolMax('kunai');S.tools.shuri=toolMax('shuri');sfx('pickup');text(P.x,P.y-50,'TOOLS RESTOCKED',C.steel);}
      }
    }else if(o.kind==='quest'){if(dist(o,P)<24&&S.dead<=0){o.gone=true;if(S.quest)S.quest.has=true;S.itemBanner={name:'The tenth plate',desc:'Bring it back to the woman at the well.',icon:'plate',t:3.2};sfx('pickup');burst(o.x,o.y-14,16,'#d8e0f0',200,0.6,2);}}
    else if(o.kind==='item'&&!o.price){if(dist(o,P)<24&&S.dead<=0&&!(o.dropT>0)&&(S.items.length<itemSlots()||(ITEM[o.id]&&ITEM[o.id].consume))&&!ownedItem(o.id)){if(giveItem(o.id)){o.gone=true;claimPair(o);burst(o.x,o.y-20,20,C.mon,200,0.6,2);}}}
    else if(o.kind==='chest'&&!o.open){if(dist(o,P)<26){o.open=true;sfx('chest');S.shake+=2;const r=Math.random();
      if(r<0.38){const w=lootWeapon(Math.random()<0.3?'fine':'std');dropWeapon(w,o.x,o.y+24);}
      else if(r<0.52)addObj(R,{kind:'item',id:randomItem(0,1),x:o.x,y:o.y+24});
      else{scatter(R,'coin',o.x,o.y,ri(6,12));if(Math.random()<0.5)scatter(R,'shard',o.x,o.y,ri(1,2));}}}
    else if(o.kind==='exit'){if(dist(o,P)<30&&!S.choosing&&!S.trans&&S.dead<=0){if(o.gate&&!S.floor.gateOpen){if(!o.warnT||S.gt-o.warnT>1.5){o.warnT=S.gt;text(o.x,o.y-60,`SEALED · ${roomsLeft()} ROOM${roomsLeft()===1?'':'S'} STILL HOLD FOES`,C.ash);sfx('deny');}}else{o.gone=true;sfx('stairs');nextFloor();return;}}}
  }
  R.objs=R.objs.filter(o=>!o.gone);
  // interaction prompt
  S.prompt=null;let bd=40;
  for(const o of R.objs){
    const free=o.kind==='item'&&!o.price&&ITEM[o.id]&&!ITEM[o.id].consume&&(S.items.length>=itemSlots()||ownedItem(o.id));
    if(!(o.kind==='npc'&&!o.done)&&!(o.kind==='item'&&o.price)&&!free&&o.kind!=='merchant'&&o.kind!=='weapon')continue;
    const d=dist(o,P);if(d<bd+(o.big||0)){bd=d;S.prompt=o;}
  }
}
function buyConsumable(o){
  if(o.id==='onigiri')heal(1);else if(o.id==='tools'){S.tools.kunai=toolMax('kunai');S.tools.shuri=toolMax('shuri');text(P.x,P.y-50,'TOOLS RESTOCKED',C.steel);}
  else if(o.id==='vial'){addMeter(25);text(P.x,P.y-50,'+25 BLOOD',C.hi);}else if(o.id==='heart'){addMax(1);heal(1);text(P.x,P.y-50,'+1 MAX SOUL',C.hi);}
  else if(o.id==='whet'){if(P.wpn){P.wpn.dur=P.wpn.max;text(P.x,P.y-50,'WEAPON MENDED',C.steel);}}
}
function interact(o){
  if(o.kind==='weapon'){if(o.price&&S.mon<o.price){text(o.x,o.y-40,'NOT ENOUGH MON',C.ash);sfx('deny');return;}if(!equip(o.w))return;if(o.price){takeMon(o.price);sfx('buy');}o.gone=true;claimPair(o);S.room.objs=S.room.objs.filter(x=>x!==o);return;}
  if(o.kind==='item'){
    const it=ITEM[o.id],price=o.price||0;
    if(price&&S.mon<price){text(o.x,o.y-40,'NOT ENOUGH MON',C.ash);sfx('deny');return;}
    const take=()=>{if(price){takeMon(price);sfx('buy');}o.gone=true;claimPair(o);S.room.objs=S.room.objs.filter(x=>x!==o);};
    if(!it){take();buyConsumable(o);return;}
    if(ownedItem(o.id)){text(P.x,P.y-50,'YOU ALREADY CARRY ONE',C.ash);sfx('deny');return;}
    if(it.consume||S.items.length<itemSlots()){take();giveItem(o.id);return;}
    swapItem(o.id,ok=>{if(ok)take();});return;
  }
  if(o.kind==='merchant'){merchantTalk(o);return;}
  if(o.kind==='npc'&&!o.done){if(o.act&&ACTS[o.act]){ACTS[o.act](o);return;}if(o.duel){duelTalk(o);return;}if(o.smith){openForge(o);return;}const enc=ENC[o.enc];if(enc)enc.start(o);}
}

// ---------- rooms ----------
function shopStock(R,cx,cy,master){
  const ids=[];for(const t of master?[ri(1,2),ri(1,3),ri(2,3)]:[0,ri(0,1),ri(1,3)]){let id,g=0;do{id=randomItem(t,t===0?0:3);}while(ids.includes(id)&&g++<20);ids.push(id);}
  [-120,-40,40].forEach((dx,i)=>{const it=ITEM[ids[i]];addObj(R,{kind:'item',id:ids[i],x:cx+dx,y:cy+20,price:Math.max(3,Math.round(PRICE[it.tier]*(master?1.15:1)*shopMul()))});});
  const w1=master?lootWeapon(Math.random()<0.4?'named':'fine'):lootWeapon('std');addObj(R,{kind:'weapon',w:w1,x:cx,y:cy+110,price:Math.round((master?34:22)*shopMul())});
  if(master){const w2=lootWeapon('fine');addObj(R,{kind:'weapon',w:w2,x:cx+120,y:cy+110,price:Math.round(30*shopMul())});addObj(R,{kind:'item',id:'whet',x:cx+120,y:cy+20,price:Math.max(2,Math.round(10*shopMul()))});}
  addObj(R,{kind:'item',id:'tools',x:cx-120,y:cy+110,price:Math.max(2,Math.round(7*shopMul()))});
  if(!master){const cons=pick(['onigiri','vial','heart']);addObj(R,{kind:'item',id:cons,x:cx+120,y:cy+20,price:Math.max(2,Math.round((cons==='heart'?30:cons==='vial'?9:5)*shopMul()))});}
  else{addObj(R,{kind:'item',id:'heart',x:cx-200,y:cy+20,price:Math.max(2,Math.round(26*shopMul()))});addObj(R,{kind:'item',id:'vial',x:cx-200,y:cy+110,price:Math.max(2,Math.round(8*shopMul()))});}
}
function placeSmith(R,fx,fy){R.deco.push({prop:'forge',x:fx,y:fy});R.lights.push({kind:'brazier',x:fx,y:fy-16,r:170,col:'255,120,50',ph:0,fx:fx-10,fy:fy-20});addObj(R,{kind:'npc',enc:'smith',spr:'smith',x:fx+46,y:fy+4,name:'The Blind Smith',smith:true});}
function fillRest(R,cx,cy){
  R.onsen={x:cx-330,y:cy+150};addObj(R,{kind:'npc',hidden:true,act:'onsen',x:cx-330,y:cy+150,name:'Hot spring',label:'BATHE',big:30});
  R.deco.push({prop:'altar',x:cx+330,y:cy+150});addObj(R,{kind:'npc',hidden:true,act:'altar',x:cx+330,y:cy+160,name:'Altar of Change',label:'CHANGE A BLESSING'});
  addObj(R,{kind:'merchant',spr:'merchant',x:cx,y:cy-150,name:'Old tanuki',master:true});shopStock(R,cx,cy-70,true);
  addObj(R,{kind:'exit',x:cx,y:R.h-WALL-90});R.lights.push({kind:'toro',x:cx-330,y:cy+110,r:200,col:'255,190,120',ph:1});
}
function populateRoom(R){
  const cx=R.w/2,cy=R.h/2;
  if(R.type==='treasure'){const pr=Math.random();addObj(R,{kind:'item',id:randomItem(1,2),x:cx-70,y:cy,ped:true,pair:pr});addObj(R,{kind:'weapon',w:lootWeapon(Math.random()<0.25?'named':'fine'),x:cx+70,y:cy,ped:true,pair:pr});if(Math.random()<0.4)scatter(R,'shard',cx,cy+60,ri(1,2));}
  if(R.type==='gate'){addObj(R,{kind:'exit',x:cx,y:cy+20,gate:true});if(S.floor.gateOpen&&!R.gateChest){R.gateChest=true;const p=freeSpot(R,cx,cy+110,20);addObj(R,{kind:'chest',x:p.x,y:p.y});}}
  if(R.type==='shop'&&S.gmx&&S.gmx.noShops)R.type='treasure';
  if(R.type==='treasure'&&R.built&&!R.objs.length){const pr=Math.random();addObj(R,{kind:'item',id:randomItem(1,2),x:cx-70,y:cy,ped:true,pair:pr});addObj(R,{kind:'weapon',w:lootWeapon('fine'),x:cx+70,y:cy,ped:true,pair:pr});}
  if(R.type==='shop'){addObj(R,{kind:'merchant',spr:'merchant',x:cx,y:WALL+80,name:'Tanuki merchant'});shopStock(R,cx,cy,false);}
  if(R.type==='store'){placeSmith(R,cx-420,cy+40);if(!(S.gmx&&S.gmx.noShops)){addObj(R,{kind:'merchant',spr:'merchant',x:cx+120,y:cy-120,name:'Tanuki merchant'});shopStock(R,cx+120,cy-40,false);}R.deco.push({prop:'hokora',x:cx-420,y:cy-170});
    addObj(R,{kind:'exit',x:cx,y:WALL+90});if(S.floor.n>1)addObj(R,{kind:'onigiri',x:cx-60,y:cy+200});}
  if(R.type==='rest')fillRest(R,cx,cy);
  if(R.type==='hermit')placeHermitRoom(R,cx,cy);
  if(R.type==='event'){
    const used=S.usedEnc||(S.usedEnc=new Set());
    const pool=ENCOUNTERS.filter(e=>!used.has(e.id));const enc=pool.length?pick(pool):pick(ENCOUNTERS);used.add(enc.id);
    R.enc=enc.id;enc.setup(R,cx,cy);
  }
  if(R.type==='duel'){R.duel=makeDuel();const D=R.duel;R.deco.push({prop:'nobori',x:cx-150,y:cy-60},{prop:'nobori',x:cx+150,y:cy-60});addObj(R,{kind:'npc',enc:'duel',spr:D.look,x:cx,y:cy-24,name:D.name,duel:true});}
  if(R.questPlate&&!(S.quest&&S.quest.has))addObj(R,{kind:'quest',id:'plate',x:cx+rand(-80,80),y:cy+rand(-40,40)});
  if(R.type==='start'&&S.floor.n>1&&Math.random()<0.5)addObj(R,{kind:'onigiri',x:cx+60,y:cy+40});
  if(R.type==='hub')populateHub(R);
}
const realmPick=()=>S.realmPick&&S.realmPick[S.floor.realm]||{boss:curBiome().bosses[0],mini:curBiome().minis[0]};
function startRoomCombat(R){
  if(S.pro){proRoomStart(R);return;}
  if(R.type==='arena'){modeArenaStart(R);return;}
  if(R.type==='boss'||R.type==='mini'){S.lordHurt=0;const key=R.type==='boss'?realmPick().boss:realmPick().mini,B=BOSSES[key];const e=spawnEnemy(key,{boss:true,pos:{x:R.w/2,y:R.h*0.36}});S.boss=e;S.banner={name:B.name,title:B.title,t:2.4};S.shake+=6;sfx('gong');return;}
  if(!R.waves){
    const f=fl(),B=curBiome(),size=R.size==='b'?2:R.size==='s'?0:1;
    let n=Math.max(1,Math.round((1.6+Math.min(f,7)*0.55+ri(0,2)+size)*CFG.roomEnemyMul*(S.gmx?S.gmx.enemyN:1)));
    // the first few descents ease you in: one foe fewer per room in the first realm's opening floors
    if(S.floor.realm===0&&S.floor.stage<=4&&(META.runs||0)<4)n=Math.max(1,n-1);
    const pool=B.pool.filter(k=>CFG.roster[k]);const usePool=pool.length?pool:B.pool;
    const list=[];for(let i=0;i<n;i++)list.push({key:pick(usePool),elite:Math.random()<Math.min(0.3,0.04+0.025*f)});
    R.waves=n>=4?[list.slice(0,Math.ceil(n*0.6)),list.slice(Math.ceil(n*0.6))]:[list];
  }
  spawnWave(R);
  if(S.gmx&&S.gmx.bounty&&R.type==='combat'){S.bountyN=(S.bountyN||0)+1;if(S.bountyN%3===0)S.pending.push({t:1.6,fn:()=>{if(S.room!==R)return;const e=spawnEnemy(pick(['kensei','nitoryu','sojutsu']),{});if(e)text(e.x,e.y-60,'A BOUNTY HUNTER',C.hi,true);sfx('gong');}});}
}
function spawnWave(R){
  const w=R.waves.shift();if(!w)return;
  for(const s of w){const T=TYPES[s.key];if(!T)continue;const n=T.swarm||1;let p0=null;
    for(let i=0;i<n;i++){const e=spawnEnemy(s.key,{elite:s.elite&&i===0,duel:s.duel,pos:p0?inArena({x:p0.x+rand(-50,50),y:p0.y+rand(-40,40)},20):null});if(e&&!p0)p0={x:e.x,y:e.y};}}
}
function clearRoom(R){
  R.cleared=true;sfx('door');const c0=freeSpot(R,R.w/2,R.h/2,20),cx=c0.x,cy=c0.y;S.pending.push({t:0.8,fn:checkGate});
  if(S.duel&&S.duel.R===R){const D=S.duel.D;S.duel=null;R.duelDone=true;featEvent('duel');const pr=Math.random();addObj(R,{kind:'item',id:randomItem(D.tier),x:cx-50,y:cy,ped:true,pair:pr});addObj(R,{kind:'weapon',w:lootWeapon('named'),x:cx+50,y:cy,ped:true,pair:pr});scatter(R,'shard',cx,cy,D.shards+3);if(D.mon)scatter(R,'coin',cx,cy,D.mon);S.banner={name:'VICTORY',title:`${D.name} bows`,t:2.2};sfx('gong');S.flash=0.12;return;}
  if(R.type==='combat')text(P.x,P.y-60,'CLEARED',C.bone);
  if(R.fightReward){const k=R.fightReward;R.fightReward=null;if(k==='chest')addObj(R,{kind:'chest',x:cx,y:cy});else if(k==='item')addObj(R,{kind:'item',id:randomItem(1,2),x:cx,y:cy,ped:true});else scatter(R,'coin',cx,cy,ri(8,14));return;}
  if(R.type==='combat'){
    const r=Math.random();
    if(r<0.38)scatter(R,'coin',cx,cy,ri(3,6));
    else if(r<0.48)addObj(R,{kind:'onigiri',x:cx,y:cy,z:20,vz:120});
    else if(r<0.55)addObj(R,{kind:'vial',x:cx,y:cy,z:20,vz:120});
    else if(r<0.63)addObj(R,{kind:'chest',x:cx,y:cy});
    else if(r<0.72)scatter(R,'shard',cx,cy,1);
    else if(r<0.82)dropWeapon(lootWeapon(Math.random()<0.5?'worn':'std'),cx,cy);
  }
}
function roomsLeft(){return S.floor?[...S.floor.rooms.values()].filter(r=>r.type==='combat'&&!r.cleared).length:0;}
function checkGate(){
  const F=S.floor;if(!F||F.kind!=='combat'||F.gateOpen||roomsLeft()>0)return;
  F.gateOpen=true;S.banner={name:'THE WAY DOWN OPENS',title:`Level ${flName()} cleared`,t:2.4};sfx('gong');S.flash=0.08;
  const G=F.boss;if(G.built&&!G.gateChest){G.gateChest=true;const p=freeSpot(G,G.w/2,G.h/2+130,20);addObj(G,{kind:'chest',x:p.x,y:p.y});}
}
function checkRoomState(){
  const R=S.room;if(R.cleared||S.dead>0||S.event||R.type==='hub'||S.pro)return;
  if(R.type==='arena'){modeArenaTick(R);return;}
  if(S.enemies.length===0&&!S.pending.some(p=>p.spawn)){
    if(R.waves&&R.waves.length){S.pending.push({t:0.6,spawn:true,fn:()=>{text(P.x,P.y-60,'MORE COME',C.curse);spawnWave(R);}});}
    else if((R.type!=='boss'&&R.type!=='mini')||!S.boss)clearRoom(R);
  }
}
function enterRoom(R,fromDir){
  const fresh=!R.visited;
  if(!R.built){buildRoom(R);populateRoom(R);}
  S.room=R;S.event=null;S.drink=null;S.firstCutUsed=false;R.visited=true;R.seen=true;for(const d in R.doors){const n=neighbor(R,d);if(n)n.seen=true;}
  for(const o of S.orbs)addMeter(o.v);
  Object.assign(S,{enemies:[],slashes:[],eslashes:[],shots:[],corpses:[],marks:[],rings:[],bolts:[],ghosts:[],pending:[],orbs:[],parts:[],texts:[],swipe:null,buffer:null,slide:null,boss:null,petals:[],auras:[],hooks:[],clouds:[],counter:null,leap:null,trace:null,traceArm:0,reap:null,railAim:null,glyph:null,tmarks:[],gwaves:[],held:null,remains:[],zones:[],force:null,dark:null,bossLine:null});P.z=0;
  const M=WALL+P.r+30,side=fromDir?OPP[fromDir]:null;
  if(side==='w'){P.x=M;P.y=R.h/2;}else if(side==='e'){P.x=R.w-M;P.y=R.h/2;}else if(side==='n'){P.x=R.w/2;P.y=M+10;}else if(side==='s'){P.x=R.w/2;P.y=R.h-M;}else{P.x=R.w/2;P.y=R.h/2+(R.type==='hub'?200:R.type==='store'?140:60);}
  P.vx=P.vy=P.kx=P.ky=0;P.dashT=0;P.inv=Math.max(P.inv,0.5);
  if(S.mods.roomShield)P.shield=1;
  if(S.follower){const f=S.follower;f.x=P.x-20;f.y=P.y+4;if(f.leaving===undefined&&fresh&&fromDir){f.rooms--;if(f.rooms<=0){f.leaving=1.2;S.pending.push({t:0.6,fn:()=>{text(P.x,P.y-70,'THE CHILD WAVES GOODBYE',C.bone);giveShards(2);heal(1);}});}}}
  S.cam.x=P.x;S.cam.y=P.y;updateCam(1);
  if(R.type==='rest'&&fresh)S.pending.push({t:0.4,fn:()=>{bankShards('The shrine at the rest place keeps them safe');S.banner=S.banner||{name:'A PLACE TO REST',title:'Bathe, trade, change a blessing',t:2.4};}});
  if(R.type==='hub')spawnEnemy('dummy',{pos:{x:R.w/2,y:R.h/2+40},quick:true});
  if(!R.cleared&&fresh&&S.gmx&&S.gmx.vampire&&R.type!=='arena'&&P.hp>1){P.hp--;text(P.x,P.y-50,'THE THIRST TAKES A SOUL',C.blood);}
  if(!R.cleared)startRoomCombat(R);
  setDrone(curBiome().music.drone);
}
function goRoom(d){
  if(S.trans)return;const R=S.room,n=neighbor(R,d);if(!n)return;
  S.trans={t:0,phase:'out',dir:d,to:n};sfx('step',1);
}
function updateTrans(dt){
  const T=S.trans;if(!T)return;T.t+=dt;
  if(T.phase==='out'&&T.t>=0.16){enterRoom(T.to,T.dir);T.phase='in';T.t=0;}
  else if(T.phase==='in'&&T.t>=0.16)S.trans=null;
}
// player movement limits: walls, plus open doorways you can walk through
function clampPlayer(){
  const R=S.room,r=P.r,open=R.cleared;
  let x=P.x,y=P.y;
  const inDY=Math.abs(y-R.h/2)<DW-r,inDX=Math.abs(x-R.w/2)<DW-r;
  const minX=(open&&R.doors.w&&inDY)?-60:WALL+r,maxX=(open&&R.doors.e&&inDY)?R.w+60:R.w-WALL-r;
  const minY=(open&&R.doors.n&&inDX)?-60:WALL+r,maxY=(open&&R.doors.s&&inDX)?R.h+60:R.h-WALL-r;
  x=clamp(x,minX,maxX);y=clamp(y,minY,maxY);
  if(x<WALL+r||x>R.w-WALL-r)y=clamp(y,R.h/2-DW+r,R.h/2+DW-r);
  if(y<WALL+r||y>R.h-WALL-r)x=clamp(x,R.w/2-DW+r,R.w/2+DW-r);
  P.x=x;P.y=y;
  if(!S.trans&&S.dead<=0){if(x<WALL*0.4)goRoom('w');else if(x>R.w-WALL*0.4)goRoom('e');else if(y<WALL*0.4)goRoom('n');else if(y>R.h-WALL*0.4)goRoom('s');}
}

// ---------- lords, floors, runs ----------
function onEnemyGone(){}
function onBossDefeated(e){
  if(S.gm&&S.gm.arena){modeBossDown(e);return;}
  const R=S.room;
  addObj(R,{kind:'onigiri',x:e.x+30,y:e.y+20,z:20,vz:120});
  if(e.T.mini){dropWeapon(lootWeapon('named'),e.x-30,e.y+10);S.pending.push({t:0.9,fn:()=>{S.banner={name:'THE WAY TO REST OPENS',title:`${e.T.name} is gone`,t:2.4};if(R.restInside&&!R.restDone){R.restDone=true;fillRest(R,R.w/2,R.h/2);}}});return;}
  featEvent('lord');S.lordHurt=null;
  if(S.gm&&S.gm.oneRealm&&!e.T.mini){S.pending.push({t:1.8,fn:()=>modeVictory()});return;}
  META.realms=Math.max(META.realms||0,Math.min(BIOMES.length-1,S.floor.realm+1));saveMeta();
  if(S.floor.n>=totalFloors()){S.pending.push({t:2.6,fn:()=>{giveShards(Math.round(40*CFG.shardMul));bankShards();META.wins++;featEvent('win');if(S.gm&&S.gm.id==='hell')hellCleared();saveMeta();clearRun();playEnding(e);}});return;}
  if(S.gm&&S.gm.id==='infinite')infiniteTwist();
  dropWeapon(lootWeapon('named'),e.x-40,e.y+10);
  S.pending.push({t:1.0,fn:()=>{offerPerk();addObj(R,{kind:'exit',x:R.w/2,y:R.h*0.3});}});
}
function floorBanner(){const F=S.floor,B=F.biome;S.banner={name:B.name.toUpperCase(),title:`Level ${flName()} · ${B.jp}${F.kind==='store'?' · the smith and the merchant':F.kind==='mini'?' · something guards the rest place':F.kind==='lord'?' · the lord waits':' · clear every room'}`,t:2.6};}
function nextFloor(){
  if(S.gm&&S.gm.oneRealm&&S.floor.kind==='lord'){modeVictory();return;}
  const n=S.floor.n+1;if(n>totalFloors()){showSummary(true);return;}
  S.floor=modeFloor(n);S.darumaUsed=false;S.usedEnc=S.usedEnc||new Set();S.quest=null;S.duel=null;S.event=null;S.tideT=90;S.tideTick=0;
  if(S.stats)S.stats.floor=n;if(countsDepth())META.bestFloor=Math.max(META.bestFloor,n);saveMeta();
  if(S.floor.stage===1){bankShards();S.unbrokenUsed=false;if(capOn('orb','brim'))S.meter=Math.max(S.meter,orbMax()/3);}S.tools.kunai=Math.min(toolMax('kunai'),S.tools.kunai+1);S.tools.shuri=Math.min(toolMax('shuri'),S.tools.shuri+1);
  S.tut=null;S.tutSafe=false;S.trans={t:0,phase:'in'};enterRoom(S.floor.start,null);floorBanner();saveRun();
}
function resetRunState(){
  Object.assign(S,{mods:freshMods(),perkAb:{},owned:{},items:[],runMax:0,mon:10*up('body','purse'),shardsRun:0,carry:0,bt:null,reload:0,toolCd:0,wpnBanner:null,forgeOpen:false,tools:{kunai:toolMax('kunai')+up('hub','tools'),shuri:toolMax('shuri')+up('hub','tools')},traceCd:0,traceCdMax:1,trace:null,traceArm:0,auras:[],hooks:[],clouds:[],counter:null,leap:null,reap:null,ink:null,railAim:null,perfect:false,jam:false,reloadMax:1,smokeShot:false,unbrokenUsed:false,dbgTech:false,kills:0,parries:0,blocks:0,dodges:0,guards:0,combo:0,comboT:0,glyph:null,tmarks:[],gwaves:[],held:null,remains:[],zones:[],force:null,dark:null,bossLine:null,inkLock:0,tut:null,pro:null,elem:null,tutSafe:false,fuseT:0,fuseBonus:1,chooser:null,
    meter:0,full:false,armed:false,dead:0,hurt:0,slowT:0,hitstop:0,flash:0,cdTap:0,cdCut:0,cdLock:0,cdTapMax:0,cdCutMax:0,abCd:{},abCdMax:{},buffer:null,tapTimes:[],tapChain:0,cutCount:0,anim:null,
    drink:null,event:null,duel:null,follower:null,quest:null,firstCutUsed:false,
    darumaUsed:false,favorUsed:false,reviveUsed:false,charmUsed:false,adShards:false,usedEnc:new Set(),itemBanner:null,banner:null,summary:false,choosing:false,dialog:null,paused:false,
    stats:{time:0,bestCombo:0,cuts:0,hits:0,bosses:0,kills:0,hurt:0,killer:'',floor:1,techs:0},hint:{cut:false,armed:false}});
  S.pauseVictims.clear();
  P.max=CFG.maxHp+up('body','soul');P.hp=P.max;P.shield=0;P.slowT=0;P.inv=1;P.dashCd=0;P.wpn=null;P.z=0;
  recomputeMods();P.hp=P.max;
}
// the shrine between runs
function enterHub(){
  auInit();resetRunState();S.gm=null;S.gmx=null;S.modeRules=null;try{featCheck();}catch(_){}
  S.floor=genHub();S.inHub=true;S.realmPick=null;
  enterRoom(S.floor.start,null);
  S.mode='run';S.running=true;
  for(const id of ['hub','overlay','dlg','perkOv','title'])$(id).hidden=true;
  if(META.startW&&META.wseen[META.startW])P.wpn=makeWeapon(META.startW,{});
  S.banner={name:'SHRINE OF THE BROKEN BLADE',title:'Rest, prepare, then walk through the gate',t:2.6};S.tut=null;S.tutSafe=false;
  if(!META.tut&&!META.pro)S.pending.push({t:1.6,fn:()=>{if(S.inHub&&!S.dialog&&!S.tut)openDialog({spr:'monk2',name:'Old monk',title:'the shrine',text:'"Your hands have forgotten the blade. The straw man has not. Will you train before you go down?"',choices:[{label:'Train with the straw man',fn:()=>{closeDialog();startTutorial();}},{label:'I remember. Skip it',fn:()=>{closeDialog();META.tut=1;saveMeta();}}]});}});
  renderPerkStrip();last=performance.now();
}
function startRun(realm,viaMode){
  auInit();
  if(!viaMode)S.gmNext={id:'story',mods:[]};
  const keepW=P.wpn&&S.inHub&&META.startW&&up('hub','start_'+META.startW)?P.wpn.id:null;
  resetRunState();S.inHub=false;applyMode();recomputeMods();P.hp=P.max;
  const rp=()=>BIOMES.map(B=>({boss:pick(B.bosses),mini:pick(B.minis)}));S.realmPick=S.gm.seed?withSeed(S.gm.seed,rp):rp();
  const free=S.gm.arena||S.gm.oneRealm||S.gm.id==='daily'||S.gm.id==='weekly',r=clamp(realm|0,0,free?BIOMES.length-1:Math.min(BIOMES.length-1,META.realms||0));
  if(capOn('orb','brim'))S.meter=orbMax()/3;
  S.floor=modeFloor(1+r*FPR);S.stats.floor=S.floor.n;S.tideT=90;
  enterRoom(S.floor.start,null);
  if(keepW){P.wpn=makeWeapon(keepW,{worn:0.7});brittleCheck(P.wpn);}S.pickedWeapon=!!P.wpn;
  if((META.ramen||0)>0){META.ramen--;addMax(1);P.hp=P.max;S.banner={name:'A BOWL OF RAMEN',title:'+1 soul for this descent',t:2.2};}
  S.mode='run';S.running=true;
  for(const id of ['hub','overlay','dlg','perkOv','title'])$(id).hidden=true;
  if(S.gm.arena)S.banner={name:MODE_NAMES[S.gm.id].toUpperCase(),title:S.gm.id==='waves'?'They come in waves. Hold the ring':'Every warden and lord, one after another',t:2.4};else floorBanner();
  if(S.gm.mods.length)S.pending.push({t:2.8,fn:()=>{if(!S.banner)S.banner={name:'CURSES',title:S.gm.mods.filter(m=>MOD_BY[m]).map(m=>MOD_BY[m].name).join(' · '),t:3};}});
  if(META.foxBless&&!S.gm.arena){META.foxBless=0;S.pending.push({t:1.4,fn:()=>offerPerk()});}
  META.runs++;if(countsDepth())META.bestFloor=Math.max(META.bestFloor,S.floor.n);saveMeta();
  renderPerkStrip();last=performance.now();saveRun();
}

// ---------- boons: one of each, limited slots ----------
function perkAvailable(p){
  if(p.kind==='Ability')return false;
  if(S.owned[p.id])return false;
  if(p.ab)return p.ab.some(k=>!CFG.normal[k]&&!S.perkAb[k]);
  return true;
}
function offerPerk(){
  if(S.dead>0)return;
  const pool=shuffle(PERKS.filter(perkAvailable));const offer=pool.slice(0,3);if(!offer.length)return;
  const n=Object.keys(S.owned).length;
  openChooser({eyebrow:`Boon · level ${flName()} · ${n}/${boonSlots()} slots`,title:'Choose what the blade remembers',
    cards:offer.map(p=>({kind:p.kind,name:p.name,desc:p.desc})),cancel:n>=boonSlots()?'Keep the boons I have':null,
    pick:i=>takeBoon(offer[i])});
}
function takeBoon(p){
  const give=()=>{S.owned[p.id]=1;recomputeMods();if(p.onTake)p.onTake();text(P.x,P.y-50,p.name.toUpperCase(),C.hi);sfx('boon');};
  if(Object.keys(S.owned).length<boonSlots()){give();return;}
  const ids=Object.keys(S.owned);
  openChooser({eyebrow:`Boons · ${ids.length}/${boonSlots()} slots`,title:`Let one go to take ${p.name}?`,sub:p.desc,
    cards:ids.map(id=>{const q=PERKS.find(x=>x.id===id);return{kind:'Forget this',name:q.name,desc:q.desc};}),cancel:'Keep what I have',
    pick:i=>{delete S.owned[ids[i]];give();}});
}
function takePerk(i){chooserPick(i);}
function renderPerkStrip(){
  const el=$('perkStrip');if(!el||!S.items)return;const ids=Object.keys(S.owned||{});
  const items=S.items.map(id=>`<span class="pchip item" title="${esc(ITEM[id].desc)}">${esc(ITEM[id].name)}</span>`).join('');
  const boons=ids.map(id=>{const p=PERKS.find(x=>x.id===id);return p?`<span class="pchip" title="${esc(p.desc)}">${esc(p.name)}</span>`:'';}).join('');
  const el2=elemChip();el.hidden=!(items||boons||el2);el.innerHTML=(el2?`<span class="label">Temper</span>`+el2:'')+(items?`<span class="label">Treasures ${S.items.length}/${itemSlots()}</span>`+items:'')+(boons?`<span class="label">Boons ${ids.length}/${boonSlots()}</span>`+boons:'');
}
$('perkCards').addEventListener('click',e=>{if($('perkCards').classList.contains('cool'))return;const b=e.target.closest('[data-i]');if(b)chooserPick(+b.dataset.i);});

// ---------- dialog ----------
function portrait(spr){
  const c=$('dlgPortrait'),g=c.getContext('2d');g.imageSmoothingEnabled=false;g.clearRect(0,0,40,40);g.fillStyle='#0a080b';g.fillRect(0,0,40,40);
  const sp=SPR[spr]||PROPS[spr];if(!sp)return;const img=sp.r?sp.r[0]:sp;
  const k=img.width>34?Math.min(40/img.width,40/img.height):1;g.drawImage(img,Math.round((40-img.width*k)/2),Math.round(40-img.height*k),img.width*k,img.height*k);
}
function voiceOf(name){let h=0;for(const c of String(name))h=(h*31+c.charCodeAt(0))>>>0;return 260+(h%9)*70;}
function coolDown(el,ms){if(!el)return;el.classList.add('cool');clearTimeout(el._ct);el._ct=setTimeout(()=>el.classList.remove('cool'),ms||380);}
function openDialog(d){S.dialog=d;d.voice=d.voice||voiceOf(d.name);S.swipe=null;keys.clear();portrait(d.spr);renderDialog();}
function renderDialog(){
  const d=S.dialog;if(!d){$('dlg').hidden=true;return;}
  d.text=tr(d.text);
  $('dlg').hidden=false;$('dlgName').innerHTML=`${esc(d.name)}${d.title?`<small>${esc(d.title)}</small>`:''}`;
  const t=$('dlgText');t.className=d.big?'big':'';
  if(d.big||dlgMini()||(d.typedText===d.text&&!d.typing)){t.textContent=d.text;d.typing=false;showChoices();return;}
  d.typedText=d.text;d.shown=0;d.typing=true;d.hold=0;t.textContent='';$('dlgChoices').innerHTML='';
}
function showChoices(){const d=S.dialog;if(!d)return;d.typing=false;const el=$('dlgChoices');
  el.innerHTML=(d.choices||[]).map((c,i)=>`<button type="button" data-i="${i}"${c.dis?' disabled':''} style="animation-delay:${-i*0.7}s"><kbd>${i+1}</kbd>${esc(c.label)}</button>`).join('');coolDown(el,420);}
function typeTick(dt){const d=S.dialog;if(!d||!d.typing)return;
  // a short breath after sentence ends; it never re-reads text it already showed, so runs like "..." or '?"' can't loop
  if(d.hold>0){d.hold-=dt;return;}
  const b=Math.floor(d.shown);d.shown=Math.min(d.text.length,d.shown+dt*(d.speed||55));const n=Math.floor(d.shown);
  if(n>b){const ch=d.text[n-1];if(/[.!?…]/.test(ch)&&/\s/.test(d.text[n]||'')){d.hold=0.12;d.shown=n;}if(/[^\s]/.test(ch||'')&&n%2===0)sfx('blip',d.voice);$('dlgText').textContent=d.text.slice(0,n);}
  if(n>=d.text.length){$('dlgText').textContent=d.text;showChoices();}}
function skipType(){const d=S.dialog;if(d&&d.typing){d.shown=d.text.length;$('dlgText').textContent=d.text;showChoices();return true;}return false;}
function say(text,choices){if(!S.dialog)return;S.dialog.text=text;S.dialog.big=false;S.dialog.choices=choices||[{label:'Continue',fn:closeDialog}];renderDialog();}
function closeDialog(){const d=S.dialog;S.dialog=null;$('dlg').hidden=true;last=performance.now();if(d&&d.after)d.after();}
function dlgMini(){const d=S.dialog;return!!(d&&((d.qd&&d.qd.phase!=='done')||(d.rh&&d.rh.phase!=='done')));}
function dlgPress(){const d=S.dialog;if(!d)return;if(d.qd&&d.qd.phase!=='done')qdPress();else if(d.rh&&d.rh.phase!=='done')rhPress();}
function miniTick(dt){qdTick(dt);rhTick(dt);typeTick(dt);}
function dlgChoose(i){const d=S.dialog;if(!d||dlgMini())return;if(d.typing){skipType();return;}if($('dlgChoices').classList.contains('cool'))return;const c=(d.choices||[])[i];if(!c||c.dis)return;sfx('click');c.fn();}
$('dlgChoices').addEventListener('click',e=>{const b=e.target.closest('[data-i]');if(b){b.blur();dlgChoose(+b.dataset.i);}});
$('dlg').addEventListener('pointerdown',e=>{if(dlgMini()){e.preventDefault();dlgPress();return;}if(S.dialog&&S.dialog.typing&&!e.target.closest('[data-toy]')){e.preventDefault();skipType();}});
function startQuickdraw(win,lose){const d=S.dialog;d.qd={phase:'wait',t:0,goAt:rand(1.3,3.0),win,lose};d.text='Hands on hilts. Wait for it…';d.choices=[];renderDialog();sfx('wind');}
function qdTick(dt){const q=S.dialog&&S.dialog.qd;if(!q||q.phase==='done')return;q.t+=dt;
  if(q.phase==='wait'&&q.t>=q.goAt){q.phase='go';q.goT=q.t;S.dialog.text='斬!';S.dialog.big=true;renderDialog();metal(900,0.4,0.15);}
  else if(q.phase==='go'&&q.t-q.goT>0.42)qdResolve(false,'Too slow.');}
function qdPress(){const q=S.dialog&&S.dialog.qd;if(!q||q.phase==='done')return;if(q.phase==='wait')qdResolve(false,'You flinched first.');else qdResolve(true,`${Math.round((q.t-q.goT)*1000)} ms.`);}
function qdResolve(win,why){const q=S.dialog.qd;q.phase='done';S.dialog.big=false;sfx(win?'kill':'hurt');(win?q.win:q.lose)(why);}
function npcLeave(o){o.done=true;o.leaving=0.6;burst(o.x,o.y-14,16,'#cfc8b8',160,0.5,2);}
function roomFight(R,list){R.cleared=false;R.waves=[list];spawnWave(R);sfx('gong');S.shake+=4;}
function chinchiro(){
  for(let tries=0;tries<3;tries++){const f=[ri(1,6),ri(1,6),ri(1,6)].sort((a,b)=>a-b),k=f.join('');
    if(f[0]===f[2])return{f,score:f[0]===1?100:50+f[0],name:f[0]===1?'PINZORO':'TRIPLE '+f[0]};
    if(k==='456')return{f,score:40,name:'SHIGORO'};if(k==='123')return{f,score:-10,name:'HIFUMI'};
    if(f[0]===f[1])return{f,score:f[2],name:'POINT '+f[2]};if(f[1]===f[2])return{f,score:f[0],name:'POINT '+f[0]};
    if(tries===2)return{f,score:0,name:'NOTHING'};}
}
function merchantTalk(o){
  const lines=['"Pon! Everything here is genuine. Mostly."','"That kettle in the corner is my cousin. Do not touch my cousin."','"No refunds. No haggling. Some haggling."','"I take mon, leaves, and gossip. Mostly mon."'];
  openDialog({spr:'merchant',name:'Tanuki merchant',title:'shopkeeper',text:pick(lines),choices:[
    {label:'Haggle',dis:o.haggled,fn:()=>{o.haggled=true;if(Math.random()<0.45){for(const x of S.room.objs)if(x.price)x.price=Math.max(1,Math.round(x.price*0.8));say('"Fine, fine! For you, twenty percent off. Tell no one."');}else{for(const x of S.room.objs)if(x.price)x.price+=2;say('He narrows his eyes and adds 2 mon to every price, out of spite.');}}},
    {label:'Ask about the kettle',fn:()=>say('"It is NOT my cousin. Why would you say that. Buy something."')},
    {label:'Leave',fn:closeDialog}]});
}

// ---------- encounters (one per event room, never repeated in a run) ----------
// Several are real minigames in the room: sumo, the night parade, the tengu's talismans, tag, mochi pounding, a liar puzzle, a fetch quest
const ENCOUNTERS=[
  {id:'kappa',setup(R,x,y){addObj(R,{kind:'npc',enc:'kappa',spr:'kappa',x,y,name:'Kappa'});},
   start(o){openDialog({spr:'kappa',name:'Kappa',title:'river imp',text:'A kappa blocks the way and bows so deeply that the water in its head-dish trembles. Behind it, someone has drawn a sumo ring in the dust.',choices:[
     {label:'Challenge it to sumo',fn:()=>{closeDialog();startSumo(o);}},
     {label:'Bow back, deeper',fn:()=>{giveMon(12);npcLeave(o);say('It bows lower. You bow lower. The dish empties. The kappa flops over, powerless, and pays you 12 mon to refill it from your canteen.');}},
     {label:'Buy a cucumber (5 mon)',dis:S.mon<5,fn:()=>{takeMon(5);heal(1);o.done=true;say('Crunchy, cold, and somehow restorative. +1 soul. The kappa looks very proud of its cucumber.');}},
     {label:'Walk past',fn:()=>{npcLeave(o);say('"Coward," it hisses. You hear it practicing its stomps long after you leave.');}}]});}},
  {id:'gambler',setup(R,x,y){addObj(R,{kind:'npc',enc:'gambler',spr:'gambler',x,y,name:'Tanuki gambler',rounds:0});},
   start(o){const bet=b=>{takeMon(b);sfx('dice');const me=chinchiro(),him=chinchiro();o.rounds++;
       const fmt=r=>r.f.map(n=>`[${n}]`).join('')+' '+r.name;let res;
       if(me.score>him.score){featEvent('dice');const win=me.score>=40?b*3:b*2;giveMon(win);res=`You win ${win-b} mon.`;}
       else if(me.score<him.score){if(me.score<0){const extra=Math.min(S.mon,b);takeMon(extra);res=`Hifumi! You pay double. −${b+extra} mon.`;}else res=`You lose ${b} mon.`;}
       else{giveMon(b);res='A draw. Your bet comes back.';}
       const more=o.rounds<3?[{label:`Again (${b} mon)`,dis:S.mon<b,fn:()=>bet(b)}]:[];
       say(`You: ${fmt(me)}\nTanuki: ${fmt(him)}\n${res}`,more.concat([{label:'Leave',fn:()=>{o.done=o.rounds>=3;closeDialog();}}]));};
     openDialog({spr:'gambler',name:'Tanuki gambler',title:'chinchirorin',text:'A tanuki sits behind a bowl and three dice. "Chinchirorin! Roll better than me and I pay double. Roll four-five-six and I pay triple."',choices:[
       {label:'Bet 10 mon',dis:S.mon<10||o.rounds>=3,fn:()=>bet(10)},{label:'Bet 25 mon',dis:S.mon<25||o.rounds>=3,fn:()=>bet(25)},
       {label:'Ask if the dice are loaded',fn:()=>say('He looks deeply hurt. Then, very slowly, he swaps the dice for different dice.',[{label:'Bet 10 mon',dis:S.mon<10||o.rounds>=3,fn:()=>bet(10)},{label:'Leave',fn:closeDialog}])},
       {label:'Leave',fn:closeDialog}]});}},
  {id:'ronin',setup(R,x,y){addObj(R,{kind:'npc',enc:'ronin',spr:'wanderer',x,y,name:'Wandering rōnin'});},
   start(o){openDialog({spr:'wanderer',name:'Wandering rōnin',title:'duelist',text:'A rōnin waits in the doorway, hand resting on his hilt. "They say your blade is broken. Show me how fast it leaves the scabbard."',choices:[
     {label:'Accept a quick-draw duel',fn:()=>startQuickdraw(why=>{npcLeave(o);const id=randomItem(1,2);addObj(S.room,{kind:'item',id,x:o.x,y:o.y+30});say(`${why} His hat falls in two. Then, after a polite pause, so does he. He leaves his treasure behind.`);},
        why=>{o.done=true;if(P.hp>1){P.hp--;S.hurt=1;}say(`${why} You never saw his sword move. He sheathes it, sighs, and walks away disappointed. −1 soul.`,[{label:'Continue',fn:()=>{npcLeave(o);closeDialog();}}]);})},
     {label:'Bow and step aside',fn:()=>{npcLeave(o);giveShards(1);say('He nods. Respect costs nothing and pays a little: a single blood shard glints where he stood.');}},
     {label:'Insult his hat',fn:()=>{o.done=true;o.gone=true;S.room.fightReward='item';S.dialog.after=()=>roomFight(S.room,[{key:'ronin',elite:true,duel:true}]);say('"It was my father\'s hat." He draws, and he is better than you hoped.',[{label:'Draw',fn:closeDialog}]);}}]});}},
  {id:'kitsune',setup(R,x,y){addObj(R,{kind:'npc',enc:'kitsune',spr:'kitsune',x,y,name:'Fox maiden'});},
   start(o){openDialog({spr:'kitsune',name:'Fox maiden',title:'kitsune',text:'A fox in a shrine maiden\'s robes smiles with far too many teeth. "A trade, little blade?"',choices:[
     {label:'Trade 1 max soul for a treasure',dis:P.max<=2,fn:()=>{P.max--;P.hp=Math.min(P.hp,P.max);npcLeave(o);giveItem(randomItem(2));say('She takes it gently, like catching a moth. Something heavier settles in your pack.');}},
     {label:'Pay 20 mon for her blessing',dis:S.mon<20,fn:()=>{takeMon(20);addMeter(40);npcLeave(o);say('Warmth runs down the length of the blade. +40% blood.');}},
     {label:'Ask her riddle',fn:()=>{const q=pick([['What has a mouth but never eats, a bed but never sleeps?',['A river','A futon','A kappa'],0],['The more you take, the more you leave behind. What are they?',['Footsteps','Souls','Coins'],0],['I have keys but open no locks, and I sing when struck.',['A koto','A gate','A tanuki'],0]]);
        const ch=shuffle(q[1].map((t,i)=>({t,ok:i===q[2]})));say(`"${q[0]}"`,ch.map(c=>({label:c.t,fn:()=>{npcLeave(o);if(c.ok){giveShards(3);say('Her tails swish with delight. Three blood shards fall from her sleeve.');}else{const n=Math.min(S.mon,10);takeMon(n);say(`She laughs, and your purse is lighter by ${n} mon. Foxes always collect.`);}}})));}},
     {label:'Refuse',fn:()=>{giveMon(5);npcLeave(o);say('She laughs and is gone. Your purse feels heavier. You decide not to check why.');}}]});}},
  {id:'omikuji',setup(R,x,y){R.deco.push({prop:'hokora',x,y:y-6});addObj(R,{kind:'npc',enc:'omikuji',spr:'miko',x:x+50,y:y+10,name:'Shrine keeper'});},
   start(o){const draw=()=>{takeMon(5);o.done=true;const r=Math.random();
       if(r<0.12){giveItem(randomItem(0,1));say('大吉 Great blessing. Something falls out of the fortune box with your slip.');}
       else if(r<0.37){addMeter(30);say('吉 Blessing. "Your blade will drink well." +30% blood.');}
       else if(r<0.65){giveMon(8);say('小吉 Small blessing. "You will find money on the floor." You look down. You do. +8 mon.');}
       else if(r<0.9)say('凶 Curse. "Your next meal will be disappointing." The keeper suggests tying it to the shrine and walking away.',[{label:'Tie it to the shrine',fn:()=>say('You tie the fortune to the rope. Bad luck stays here. Probably.')},{label:'Keep it anyway',fn:()=>{if(P.hp>1)P.hp--;giveShards(2);say('Bold. You lose a soul to bad luck, but your stubbornness hardens into two blood shards.');}}]);
       else{S.room.fightReward='coins';S.dialog.after=()=>roomFight(S.room,[{key:'gaki'},{key:'gaki'}]);say('大凶 Great curse. Hungry ghosts smell bad luck and come running.',[{label:'Brace',fn:closeDialog}]);}};
     openDialog({spr:'miko',name:'Shrine keeper',title:'omikuji',text:'A tiny roadside shrine with a box of fortunes. The keeper taps a sign: "5 mon. No refunds. The gods are busy."',choices:[
       {label:'Draw a fortune (5 mon)',dis:S.mon<5,fn:draw},{label:'Leave',fn:closeDialog}]});}},
  {id:'jizo',setup(R,x,y){for(let i=0;i<6;i++)R.deco.push({spr:'jizo',x:x-150+i*60,y:y-50,jizo:true});addObj(R,{kind:'npc',enc:'jizo',spr:'jizo',x,y:y+40,name:'Six jizō',hidden:true});},
   start(o){openDialog({spr:'jizo',name:'Six jizō',title:'roadside guardians',text:'Six stone jizō stand in a row, snow piling on their bare heads.',choices:[
     {label:'Buy them straw hats (12 mon)',dis:S.mon<12,fn:()=>{takeMon(12);o.done=true;for(const d of S.room.deco)if(d.jizo)d.spr='jizohat';addMax(1);sfx('heal');say('You run out of hats at the sixth and give it your own headband. That night you dream of rice cakes. +1 max soul.');}},
     {label:'Brush the snow off their heads',fn:()=>{o.done=true;heal(1);say('Cold hands, warm heart. +1 soul.');}},
     {label:'Leave',fn:closeDialog}]});}},
  {id:'ramen',setup(R,x,y){R.deco.push({prop:'yatai',x:x-10,y:y-8});addObj(R,{kind:'npc',enc:'ramen',spr:'ramen',x:x+56,y:y+12,name:'Ramen master'});},
   start(o){openDialog({spr:'ramen',name:'Ramen master',title:'yatai',text:'A ramen stall glows in the dark. The old man nods. "Eight mon. Best broth this side of the underworld."',choices:[
     {label:'Eat (8 mon)',dis:S.mon<8,fn:()=>{takeMon(8);heal(1);addMeter(20);o.done=true;featEvent('ramen');say('Rich, smoky, a little too much pepper. +1 soul, +20% blood.');}},
     {label:'Eat and run',fn:()=>{o.done=true;o.gone=true;S.room.fightReward='coins';S.dialog.after=()=>roomFight(S.room,[{key:pick(curBiome().pool),elite:true}]);say('You slurp and sprint. Behind you, the old man whistles, and something large comes out of the back of the stall.',[{label:'Fight it',fn:closeDialog}]);}},
     {label:'Ask what is in the broth',fn:()=>say('He stares at you for a long time. "Broth."')},
     {label:'Leave',fn:closeDialog}]});}},
  {id:'noppera',setup(R,x,y){addObj(R,{kind:'npc',enc:'noppera',spr:'noppera',x,y,name:'Traveler',faceAway:true});},
   start(o){const tip=n=>()=>{giveMon(3);npcLeave(o);say(`He bows, thanks you, and walks straight into the ${n} wall. He leaves a small tip.`);};
     openDialog({spr:'noppera',name:'Traveler',title:'lost?',text:'A man in a fine kimono stands with his back to you. "Excuse me, traveler... which way to Edo?"',choices:[
       {label:'Point left',fn:tip('left')},{label:'Point right',fn:tip('right')},
       {label:'Ask him to turn around',fn:()=>{o.faceAway=false;giveMon(12);say('He turns. He has no face. You scream. He screams. You both run in opposite directions. He drops his purse. +12 mon.',[{label:'Continue',fn:()=>{npcLeave(o);closeDialog();}}]);}}]});}},
  {id:'onsen',setup(R,x,y){R.onsen={x,y:y+10};addObj(R,{kind:'npc',enc:'onsen',spr:'monkey',x:x+20,y:y+4,name:'Snow monkey',inWater:true});},
   start(o){openDialog({spr:'monkey',name:'Snow monkey',title:'hot spring',text:'Steam rises from a hot spring. A snow monkey in the water watches you with deep suspicion.',choices:[
     {label:'Soak',fn:()=>{o.done=true;heal(2);if(S.mon>0&&Math.random()<0.4){const n=Math.ceil(S.mon*0.3);takeMon(n);say(`Bliss. Two of your bruises forgive you. When you climb out, the monkey is counting your mon. −${n} mon.`);}else say('Bliss. Two of your bruises forgive you. +2 souls.');}},
     {label:'Splash the monkey',fn:()=>{if(Math.random()<0.3){o.done=true;giveShards(1);say('You win the splash war. The monkey sulks and flicks a blood shard at you from under the water.');}else say('It splashes back, harder, with both hands. You lose. Nothing gained but humility.');}},
     {label:'Leave',fn:closeDialog}]});}},
  {id:'karakasa',setup(R,x,y){addObj(R,{kind:'npc',enc:'karakasa',spr:'kasa',x,y,name:'Old umbrella'});},
   start(o){openDialog({spr:'kasa',name:'Old umbrella',title:'karakasa',text:'An old paper umbrella hops over on one leg, sticks out a long tongue, and wiggles. It wants to be used again.',choices:[
     {label:'Open it',fn:()=>{npcLeave(o);giveItem('karakasa');say('It shivers with joy and settles on your back. It will catch the first blow in every room.');}},
     {label:'Lick it back',fn:()=>{o.done=true;giveShards(2);say('It is delighted. You are not. It coughs up two blood shards as thanks.');}},
     {label:'Leave',fn:()=>{npcLeave(o);say('It droops and hops away. You feel like a monster.');}}]});}},
  {id:'sleeper',setup(R,x,y){addObj(R,{kind:'npc',enc:'sleeper',spr:'sleeper',x,y,name:'Sleeping oni',zzz:true});},
   start(o){openDialog({spr:'sleeper',name:'Sleeping oni',title:'snoring',text:'An oni snores on a pile of mon. A long string of drool is about to land on it.',choices:[
     {label:'Sneak the mon',fn:()=>{o.done=true;if(Math.random()<0.55){giveMon(30);say('You fill your pockets. The oni mumbles "five more minutes" and rolls over. +30 mon.');}
       else{o.gone=true;S.room.fightReward='chest';S.dialog.after=()=>{roomFight(S.room,[{key:'oni',elite:true}]);};say('One coin clinks. One eye opens.',[{label:'Run? No. Fight.',fn:closeDialog}]);}}},
     {label:'Draw a mustache on him',fn:()=>{o.done=true;giveShards(3);say('A masterpiece. Even the oni would agree. You leave before he wakes. +3 shards for artistic merit.');}},
     {label:'Leave quietly',fn:closeDialog}]});}},
  // --- new: gameplay encounters ---
  {id:'parade',setup(R,x,y){addObj(R,{kind:'npc',enc:'parade',spr:'chochin',x,y,name:'Lantern bearer'});},
   start(o){openDialog({spr:'chochin',name:'Lantern bearer',title:'hyakki yagyō',text:'A paper lantern with one eye hops up to you, trembling. "The Night Parade of a Hundred Demons comes through here. Any moment now. If they see a living soul..." It does not finish the sentence.',choices:[
     {label:'Hide and keep perfectly still',fn:()=>{closeDialog();startParade(o);}},
     {label:'Pay the toll and walk with them (20 mon)',dis:S.mon<20,fn:()=>{takeMon(20);npcLeave(o);giveItem(randomItem(1,2));say('You fall in step behind a giant skeleton. Nobody minds. At the end of the room a one-legged umbrella trades you something for your coins.');}},
     {label:'Ambush the parade',fn:()=>{o.done=true;o.gone=true;const R=S.room,B=curBiome();R.fightReward='chest';S.dialog.after=()=>{R.cleared=false;R.waves=[[{key:pick(B.pool),elite:true},{key:pick(B.pool)},{key:pick(B.pool)}],[{key:pick(B.pool),elite:true},{key:pick(B.pool)}]];spawnWave(R);sfx('gong');};say('You draw. The lantern faints. The parade turns, all hundred heads at once.',[{label:'Come on, then',fn:closeDialog}]);}}]});}},
  {id:'tengu',setup(R,x,y){addObj(R,{kind:'npc',enc:'tengu',spr:'tengu',x,y,name:'Old tengu'});},
   start(o){openDialog({spr:'tengu',name:'Old tengu',title:'sword teacher',text:'A long-nosed tengu taps a stack of paper talismans with its fan. "Ushiwakamaru learned from me. You... we will see. I throw twelve. Cut them before they burn."',choices:[
     {label:'Train with the tengu',fn:()=>{closeDialog();startTengu(o);}},
     {label:'Ask about Ushiwakamaru',fn:()=>say('"Small. Annoying. Jumped on bridges a lot. Very good student." It sniffs. "Unlike you, probably."')},
     {label:'Leave',fn:closeDialog}]});}},
  {id:'mochi',setup(R,x,y){R.deco.push({prop:'usu',x:x-26,y:y+6});addObj(R,{kind:'npc',enc:'mochi',spr:'usagi',x:x+16,y,name:'Moon rabbit'});},
   start(o){openDialog({spr:'usagi',name:'Moon rabbit',title:'mochitsuki',text:'A white rabbit with a wooden mallet stands over a stone mortar of steaming rice. "I pound, you turn. Turn it when the mallet is UP. Not when it is coming DOWN." It flexes its ears meaningfully.',choices:[
     {label:'Turn the mochi',fn:()=>startMochi(o)},
     {label:'Ask why it lives on the moon',fn:()=>say('"Rent is very cheap."')},
     {label:'Leave',fn:closeDialog}]});}},
  {id:'boxes',setup(R,x,y){const pz=liarPuzzle();R.puzzle=pz;[-100,0,100].forEach((dx,i)=>{R.deco.push({prop:'box',x:x+dx,y:y},{spr:BOXSPR[i],x:x+dx,y:y-13});});addObj(R,{kind:'npc',enc:'boxes',spr:'chochin',x,y:y+28,name:'Three heirlooms',hidden:true});},
   start(o){const pz=S.room.puzzle,lines=pz.st.map(s=>`${tr(cap(BOXN[s.sp]))}: ${tr(liarLine(s))}`).join('\n');
     openDialog({spr:'chochin',name:'Three heirlooms',title:'tsukumogami',text:`A lantern, an umbrella and a sandal, each a hundred years old and each sitting on a box. "One box holds a treasure. The other two hold... something else. Only ONE of us is telling the truth."\n${lines}`,choices:[
       ...[0,1,2].map(i=>({label:`Open the ${BOXN[i]}'s box`,fn:()=>{o.done=true;if(i===pz.ans){giveItem(randomItem(1,2));say(`The ${BOXN[pz.st.findIndex(s=>liarTrue(s,pz.ans))]} was the honest one. It looks very smug about it.`);}
         else if(Math.random()<0.5){S.room.fightReward='coins';S.dialog.after=()=>roomFight(S.room,[{key:pick(curBiome().pool),elite:true},{key:pick(curBiome().pool),elite:true}]);say('Wrong box. Something with too many teeth climbs out.',[{label:'Fight',fn:closeDialog}]);}
         else{const n=Math.min(S.mon,15);takeMon(n);say(`Wrong box. A cloud of soot, and your purse is ${n} mon lighter. All three heirlooms giggle.`);}}})),
       {label:'Leave',fn:closeDialog}]});}},
  {id:'okiku',setup(R,x,y){R.deco.push({prop:'well',x,y:y-6});addObj(R,{kind:'npc',enc:'okiku',spr:'okiku',x:x+52,y:y+8,name:'Okiku'});},
   start(o){
     if(S.quest&&S.quest.npc===o){
       if(!S.quest.has){openDialog({spr:'okiku',name:'Okiku',title:'still counting',text:'"...seven... eight... nine." She looks at you with hollow eyes. "Somewhere on this floor. Please."',choices:[{label:'Keep looking',fn:closeDialog}]});return;}
       openDialog({spr:'okiku',name:'Okiku',title:'at peace',text:'She takes the plate in both hands and counts, slowly. "...eight... nine... ten." For the first time in three hundred years, she stops counting. She smiles.',choices:[
         {label:'Ask for her blessing',fn:()=>{S.quest=null;addMax(1);heal(1);npcLeave(o);say('A cool hand on your forehead, and she is gone. +1 max soul.');}},
         {label:'Ask what lies at the bottom of the well',fn:()=>{S.quest=null;giveItem(randomItem(3,3));npcLeave(o);say('"Things people threw away." She drops something precious into your hands, and is gone.');}}]});return;}
     openDialog({spr:'okiku',name:'Okiku',title:'by the old well',text:'A pale woman sits by an old well, counting plates. "One... two... three..." all the way to nine. Then she screams, and starts again.',choices:[
       {label:'Offer to find the tenth plate',fn:()=>{startPlateQuest(o);}},
       {label:'Count with her, and say "ten"',fn:()=>{o.done=true;if(Math.random()<0.5){giveShards(2);say('"...nine." "Ten," you say, holding up your empty hand. She stares at it for a long time, then laughs, the first laugh this well has heard in centuries. +2 shards.');}else{if(P.hp>1)P.hp--;S.hurt=1;sfx('hurt');say('"...nine." "Ten," you say. She turns her head all the way around. You decide to leave. −1 soul.');}}},
       {label:'Leave',fn:closeDialog}]});}},
  {id:'zashiki',setup(R,x,y){addObj(R,{kind:'npc',enc:'zashiki',spr:'warashi',x,y,name:'Zashiki-warashi'});},
   start(o){openDialog({spr:'warashi',name:'Zashiki-warashi',title:'house spirit',text:'A child in a red kimono peeks at you from behind a pillar and giggles. Houses with a zashiki-warashi are said to prosper. Houses it leaves... do not.',choices:[
     {label:'Play tag',fn:()=>{closeDialog();startTag(o);}},
     {label:'Ask it to come along',fn:()=>{o.gone=true;S.follower={x:o.x,y:o.y,rooms:3,face:1};say('It thinks about it, then takes your sleeve. While it follows you, foes drop more mon and shops give you a discount. Try not to get hurt in front of it.');}},
     {label:'Leave',fn:()=>{npcLeave(o);say('It sticks its tongue out at you and vanishes into the wall.');}}]});}}
];
const ENC=Object.fromEntries(ENCOUNTERS.map(e=>[e.id,e]));
const cap=s=>s[0].toUpperCase()+s.slice(1);

// --- the liar puzzle: three statements, exactly one true, exactly one box consistent with that ---
const BOXN=['lantern','umbrella','sandal'],BOXSPR=['chochin','kasa','zori'];
const liarTrue=(s,t)=>s.type==='in'?t===s.tg:t!==s.tg;
function liarPuzzle(){for(let k=0;k<400;k++){const st=[0,1,2].map(sp=>({sp,type:Math.random()<0.5?'in':'not',tg:ri(0,2)}));const sols=[0,1,2].filter(t=>st.filter(s=>liarTrue(s,t)).length===1);if(sols.length===1)return{st,ans:sols[0]};}
  return{st:[{sp:0,type:'in',tg:0},{sp:1,type:'in',tg:0},{sp:2,type:'not',tg:2}],ans:1};}
function liarLine(s){const who=s.tg===s.sp?'my box':`the ${BOXN[s.tg]}'s box`;return s.type==='in'?`"The treasure is in ${who}."`:`"The treasure is not in ${who}."`;}

// --- Okiku's plate: hidden in another room of this floor ---
function startPlateQuest(o){
  const cands=[...S.floor.rooms.values()].filter(r=>r!==S.room&&r.type!=='boss'&&r.type!=='start'),fresh=cands.filter(r=>!r.visited),t=pick(fresh.length?fresh:cands);
  if(!t){say('She shakes her head. "Not here. Never here."');return;}
  t.questPlate=true;if(t.built)addObj(t,{kind:'quest',id:'plate',x:t.w/2+rand(-80,80),y:t.h/2+rand(-40,40)});
  S.quest={npc:o,R:S.room,target:t,has:false};
  say('She points a trembling finger through the wall. A pale mark appears on your map. "There. Bring it back to me."');
}

// --- the moon rabbit's rhythm game, played inside the dialog box ---
function startMochi(o){const d=S.dialog;d.rh={phase:'ready',t:0,beat:0,total:8,score:0,bonks:0,pressed:false,npc:o};d.text='Ready... the rabbit lifts the mallet.';d.big=false;d.choices=[];renderDialog();}
function rhShow(){const d=S.dialog,r=d.rh;d.title=`mochitsuki · ${Math.min(r.beat+1,r.total)}/${r.total}`;d.big=true;d.text=r.phase==='pound'?'ぺったん ▼':'TURN!';renderDialog();}
function rhTick(dt){const r=S.dialog&&S.dialog.rh;if(!r||r.phase==='done')return;r.t+=dt;
  const iv=Math.max(0.32,0.62-r.beat*0.04);
  if(r.phase==='ready'&&r.t>1.1){r.phase='pound';r.t=0;rhShow();}
  else if(r.phase==='pound'&&r.t>=iv){r.phase='turn';r.t=0;r.pressed=false;sfx('mochi');S.shake+=2;rhShow();}
  else if(r.phase==='turn'&&r.t>=0.38){r.beat++;if(r.beat>=r.total){rhEnd();return;}r.phase='pound';r.t=0;rhShow();}}
function rhPress(){const d=S.dialog,r=d.rh;if(r.phase==='turn'&&!r.pressed){r.pressed=true;r.score++;sfx('click');d.text='✓';renderDialog();}
  else if(r.phase==='pound'){r.bonks++;sfx('hurt');S.hurt=0.6;d.text='OUCH';renderDialog();}}
function rhEnd(){const d=S.dialog,r=d.rh;r.phase='done';d.big=false;d.title='mochitsuki';let msg;
  if(r.score>=7&&r.bonks===0){heal(2);addMeter(30);msg=`${r.score}/8. Perfect mochi, soft as a cloud. The rabbit thumps its foot in approval. +2 souls, +30% blood.`;}
  else if(r.score>=5){heal(1);msg=`${r.score}/8. Good mochi. A little lumpy. +1 soul.`;}
  else{addMeter(10);msg=`${r.score}/8. You produce something that was once rice. The rabbit eats it anyway, out of politeness. +10% blood.`;}
  if(r.bonks>=2){if(P.hp>1)P.hp--;S.hurt=1;msg+=` Also, your fingers are flat. −1 soul.`;}
  say(msg,[{label:'Thank the rabbit',fn:()=>{npcLeave(r.npc);closeDialog();}}]);}

// ---------- room events with real gameplay ----------
function endEvent(){const ev=S.event;S.event=null;return ev;}
function unlockRoom(R){R.cleared=true;sfx('door');}
function updateEvent(gdt){const ev=S.event;if(!ev)return;ev.t+=gdt;const h=EVRT[ev.kind];if(h&&h.update)h.update(ev,gdt);}
function drawEvent(){const ev=S.event;if(!ev)return;const h=EVRT[ev.kind];if(h&&h.draw)h.draw(ev);}
function eventTimer(label,sub,frac,col){ptext(label,LW/2,22,col||C.bone,8);if(sub)ptext(sub,LW/2,32,C.ash,8);if(frac!==undefined){const w=120,x0=LW/2-w/2;lx.fillStyle=C.out;lx.fillRect(x0-1,36,w+2,4);lx.fillStyle='#2a1015';lx.fillRect(x0,37,w,2);lx.fillStyle=col||C.bone;lx.fillRect(x0,37,Math.round(w*clamp(frac,0,1)),2);}}
// sumo: push the kappa out of the ring before it pushes you
function startSumo(o){
  const R=S.room;o.hidden=true;o.done=true;R.ring={x:R.w/2,y:R.h/2+10,r:170};
  P.x=R.ring.x-90;P.y=R.ring.y;P.vx=P.vy=P.kx=P.ky=0;
  const e=spawnEnemy('sumo',{quick:true,pos:{x:R.ring.x+90,y:R.ring.y}});e.cd=1.4;
  S.event={kind:'sumo',t:0,dur:35,R,foe:e,npc:o};R.cleared=false;S.banner={name:'SUMO',title:'Cut and shove it out of the ring',t:2.2};sfx('duel');
}
function sumoEnd(ev,res){
  const R=ev.R,e=ev.foe,o=ev.npc;S.enemies=S.enemies.filter(x=>x!==e);S.eslashes=S.eslashes.filter(c=>c.owner!==e);
  endEvent();o.hidden=false;o.x=e.x;o.y=e.y;unlockRoom(R);
  if(res==='win'){featEvent('sumo');text(e.x,e.y-60,'YORIKIRI!',C.hi,true);S.flash=0.1;sfx('gong');
    openDialog({spr:'kappa',name:'Kappa',title:'defeated',text:'The kappa lands on its back, dish first. It sits up, bows so low the last of its water spills out, and presents you with its most treasured possession.',choices:[{label:'Accept it',fn:()=>{giveItem(randomItem(1,2));npcLeave(o);closeDialog();}}]});}
  else if(res==='lose'){const n=Math.min(S.mon,12);takeMon(n);text(P.x,P.y-60,'OUT!',C.ash,true);
    openDialog({spr:'kappa',name:'Kappa',title:'champion',text:`You stumble out of the ring. The kappa does a little victory stomp and helps itself to ${n} mon "for the lesson."`,choices:[{label:'Bow, humbled',fn:()=>{npcLeave(o);closeDialog();}}]});}
  else openDialog({spr:'kappa',name:'Kappa',title:'exhausted',text:'Neither of you gives an inch. The kappa wheezes, declares a draw, and hands you a cucumber out of respect. +1 soul.',choices:[{label:'Share the cucumber',fn:()=>{heal(1);npcLeave(o);closeDialog();}}]});
}
// the night parade: stand completely still while a hundred demons walk past
function startParade(o){
  const R=S.room;o.hidden=true;o.done=true;
  const ks=shuffle(['kappa','tanuki','kasa','onibi','gaki','kitsune','tengu','yurei','rokuro','oni','hannya','zori','chochin','jorogumo','aooni','funa']).slice(0,11);
  const spd=(R.w+140+ks.length*62)/11;
  S.event={kind:'parade',t:0,R,npc:o,spd,grace:1.2,marchers:ks.map((k,i)=>({spr:k,x:-70-i*62,y:R.h/2-60+Math.sin(i*1.7)*34,ph:Math.random()*6}))};
  R.cleared=false;S.banner={name:'百鬼夜行',title:'The night parade. Do not move. Do not cut.',t:2.2};sfx('gong');
}
function paradeSpotted(ev){
  const R=ev.R,B=curBiome();endEvent();text(P.x,P.y-60,'SPOTTED!',C.hi,true);S.shake+=8;sfx('enrage');
  const near=ev.marchers.filter(m=>m.x>0&&m.x<R.w&&TYPES[m.spr]).slice(0,4);
  const list=near.map((m,i)=>({key:m.spr,elite:i<2}));while(list.length<4)list.push({key:pick(B.pool),elite:false});
  R.fightReward='chest';R.waves=[list];spawnWave(R);
}
function paradeDone(ev){const R=ev.R;endEvent();unlockRoom(R);text(P.x,P.y-60,'THEY PASS YOU BY',C.spirit,true);giveShards(4);addObj(R,{kind:'item',id:randomItem(0,1),x:clamp(P.x+60,WALL+40,R.w-WALL-40),y:P.y,ped:true});}
// tengu training: cut twelve falling talismans
function startTengu(o){S.event={kind:'tengu',t:0,R:S.room,npc:o,tal:[],spawned:0,total:12,hits:0,miss:0,next:1.2};S.room.cleared=false;S.banner={name:'TENGU TRAINING',title:'Cut each talisman before it burns',t:2};sfx('gust');}
function tenguEnd(ev){
  const o=ev.npc,h=ev.hits;endEvent();unlockRoom(ev.R);let msg,fn=null;
  if(h>=11){msg=`${h} of 12. The tengu's nose twitches. "...Adequate. Do not tell anyone I said so." It tosses you something from its sleeve.`;fn=()=>giveItem(randomItem(2,3));}
  else if(h>=8){msg=`${h} of 12. "Hm. Sloppy, but alive." It hands you a trinket like a teacher handing back homework.`;fn=()=>giveItem(randomItem(0,1));}
  else if(h>=5){msg=`${h} of 12. "Buy yourself a better sword." It flicks 15 mon at your head.`;fn=()=>giveMon(15);}
  else{msg=`${h} of 12. The tengu laughs so hard its nose wobbles, then smacks you across the room with its fan for wasting its afternoon.`;fn=()=>{P.kx=-560;P.ky=-200;sfx('gust');};}
  openDialog({spr:'tengu',name:'Old tengu',title:'verdict',text:msg,choices:[{label:'Bow',fn:()=>{fn();npcLeave(o);closeDialog();}}]});
}
// tag with the zashiki-warashi
function startTag(o){S.event={kind:'tag',t:0,dur:12,R:S.room,npc:o,vx:0,vy:0,jk:0,side:1};o.tag=true;S.room.cleared=false;S.banner={name:'TAG!',title:'Catch the child within 12 seconds',t:1.6};sfx('giggle');}
function tagEnd(ev,win){
  const o=ev.npc;endEvent();unlockRoom(ev.R);o.tag=false;
  if(win){o.gone=true;S.follower={x:o.x,y:o.y,rooms:4,face:1};giveShards(2);text(P.x,P.y-60,'CAUGHT!',C.hi,true);sfx('giggle');
    openDialog({spr:'warashi',name:'Zashiki-warashi',title:'it likes you',text:'It shrieks with laughter and decides you are its favorite person. It will follow you for a few rooms: foes drop more mon and shops give you a discount. +2 shards. Do not get hurt in front of it.',choices:[{label:'Lead the way',fn:closeDialog}]});}
  else{giveMon(1);npcLeave(o);text(P.x,P.y-60,'TOO SLOW',C.ash,true);openDialog({spr:'warashi',name:'Zashiki-warashi',title:'gone',text:'It runs straight into a wall and through it, giggling. A single coin rolls out after it.',choices:[{label:'Fine',fn:closeDialog}]});}
}
const EVRT={
  sumo:{update(ev){const R=ev.R,e=ev.foe,rg=R.ring;if(!S.enemies.includes(e))S.enemies.push(e);
      if(e.state!=='stun'&&Math.hypot(e.kx,e.ky)<90){const d=Math.hypot(e.x-rg.x,e.y-rg.y);if(d>rg.r-16){e.x=rg.x+(e.x-rg.x)/d*(rg.r-16);e.y=rg.y+(e.y-rg.y)/d*(rg.r-16);}}
      const out=o=>Math.hypot(o.x-rg.x,o.y-rg.y)>rg.r+6;
      if(out(e))sumoEnd(ev,'win');else if(out(P))sumoEnd(ev,'lose');else if(ev.t>=ev.dur)sumoEnd(ev,'draw');},
    draw(ev){eventTimer(`SUMO · ${Math.max(0,Math.ceil(ev.dur-ev.t))}`,'SHOVE IT OUT OF THE RING',1-ev.t/ev.dur);}},
  parade:{update(ev,gdt){for(const m of ev.marchers)m.x+=ev.spd*gdt;
      const m=moveVec(),moved=Math.hypot(m.x,m.y)>0.15||!!S.swipe||P.dashT>0||!!S.slide||S.slashes.some(c=>!c.done);
      if(ev.t>ev.grace&&moved){paradeSpotted(ev);return;}
      if(ev.marchers.every(q=>q.x>ev.R.w+50))paradeDone(ev);},
    draw(ev){const left=ev.marchers.filter(q=>q.x<ev.R.w+50).length;eventTimer('DO NOT MOVE',`${left} DEMONS STILL TO PASS`,left/ev.marchers.length,C.hi);}},
  tengu:{update(ev,gdt){ev.next-=gdt;
      if(ev.spawned<ev.total&&ev.next<=0){ev.spawned++;ev.next=rand(0.45,0.85)*(ev.spawned>7?0.8:1);const p=inArena({x:P.x+rand(-260,260),y:P.y+rand(-150,170)},50);ev.tal.push({x:p.x,y:p.y,z:70,life:2.6,max:2.6,ph:Math.random()*6});sfx('paper');}
      for(const t of ev.tal){t.life-=gdt;t.z=Math.max(4,70*(t.life/t.max));t.hx=t.x+Math.sin(ev.t*3+t.ph)*6;t.hy=t.y-t.z;const hp={x:t.hx,y:t.hy};
        for(const c of S.slashes){if(c.d<1)continue;if(c.done&&c.linger<=0&&c.fade<c.fadeMax*0.5)continue;if(forTrail(c,(a,b)=>segDist(hp,a,b)<13)){t.cut=true;break;}}
        if(t.cut){ev.hits++;burst(hp.x,hp.y,14,'#f1e8d0',220,0.5,2);burst(hp.x,hp.y,5,C.blood,140,0.4,1);sfx('paper');text(hp.x,hp.y-14,String(ev.hits),C.bone);addCombo(1);}
        else if(t.life<=0){ev.miss++;burst(hp.x,hp.y,10,C.fire,120,0.5,2);sfx('fire');}}
      ev.tal=ev.tal.filter(t=>!t.cut&&t.life>0);
      if(ev.spawned>=ev.total&&!ev.tal.length)tenguEnd(ev);},
    draw(ev){for(const t of ev.tal){shadow(t.x,t.y,8);flush();const x=Math.round(LX(t.hx)),y=Math.round(LY(t.hy));lx.drawImage(icon('ofuda'),x-8,y-8);if(t.life<0.9&&Math.floor(S.gt*14)%2){pset(x-2,y+7,C.fire);pset(x+1,y+7,C.fire);pset(x,y+6,'#ffd27a');}}
      eventTimer(`TALISMANS ${ev.hits} / ${ev.total}`,`${ev.total-ev.spawned} LEFT TO THROW`,ev.hits/ev.total);}},
  tag:{update(ev,gdt){const o=ev.npc,R=ev.R;ev.jk-=gdt;
      const dx=o.x-P.x,dy=o.y-P.y,d=Math.hypot(dx,dy)||1;let ax=dx/d,ay=dy/d;
      const m=110;if(o.x<WALL+m)ax+=1.4;if(o.x>R.w-WALL-m)ax-=1.4;if(o.y<WALL+m)ay+=1.4;if(o.y>R.h-WALL-m)ay-=1.4;
      if(ev.jk<=0){ev.jk=rand(0.5,1.0);ev.side=Math.random()<0.5?-1:1;}
      const tx=ax-ay*0.7*ev.side,ty=ay+ax*0.7*ev.side,l=Math.hypot(tx,ty)||1,sp=d<130?212:140,k=Math.min(1,gdt*7);
      ev.vx+=(tx/l*sp-ev.vx)*k;ev.vy+=(ty/l*sp-ev.vy)*k;o.x+=ev.vx*gdt;o.y+=ev.vy*gdt;Object.assign(o,inArena(o,14));
      if(Math.random()<gdt*0.7)sfx('giggle');
      if(d<P.r+16)tagEnd(ev,true);else if(ev.t>=ev.dur)tagEnd(ev,false);},
    draw(ev){eventTimer(`TAG · ${Math.max(0,Math.ceil(ev.dur-ev.t))}`,'DASH TO CATCH IT',1-ev.t/ev.dur);}}
};

// ---------- follower ----------
function updateFollower(gdt){const f=S.follower;if(!f)return;
  if(f.leaving!==undefined){f.leaving-=gdt;f.x+=(f.x>P.x?1:-1)*140*gdt;f.y-=20*gdt;if(f.leaving<=0)S.follower=null;return;}
  const tx=P.x-S.face*28,ty=P.y+6,dx=tx-f.x,dy=ty-f.y,d=Math.hypot(dx,dy);
  if(d>6){const sp=Math.min(d*5,330);f.x+=dx/d*sp*gdt;f.y+=dy/d*sp*gdt;f.moving=true;}else f.moving=false;f.face=P.x>f.x?1:-1;}

// ---------- duel rooms ----------
const DUEL_FAM=['Kurogane','Tsukikage','Hayabusa','Shiranui','Akagane','Kagerō','Mizuchi','Raikō','Sakuraba','Kiyosu','Hōzuki','Amagiri'];
const DUEL_GIV=['Jūbei','Hayate','Genji','Sōma','Tetsu','Raizō','Kyōsuke','Ren','Sanosuke','Kaede','Tomoe','Isuzu'];
const DUEL_EPI=['the Left-Handed','of the Nine Cuts','Who Never Blinks','the Quiet Rain','of the Red Hachimaki','the Unbowed','Half-Moon','the Patient','the Last Student','Thousand Cuts'];
const DUELS=[
  {id:'kenjutsu',look:'kensei',title:'Kenjutsu duel',desc:'Sword against sword, to the end.',waves:[['kensei']],tier:2,shards:4},
  {id:'nito',look:'nitoryu',title:'Two-sword style',desc:'He draws both blades and grins.',waves:[['nitoryu']],tier:2,shards:4},
  {id:'sojutsu',look:'sojutsu',title:'Spear against sword',desc:'His spear has twice your reach. Get inside it.',waves:[['sojutsu']],tier:2,shards:4},
  {id:'gauntlet',look:'kensei',title:'Three in a row',desc:'Two of his students first, then the master. No rest between.',waves:[['ronin'],['ronin'],['kensei']],tier:2,shards:7,mon:20},
  {id:'pair',look:'sojutsu',title:'Brothers',desc:'Two brothers, sword and spear, fight as one.',waves:[['kensei','sojutsu']],tier:3,shards:6,minFloor:2},
  {id:'ippon',look:'ippon',title:'Ippon · one cut',desc:'One clean cut decides it, for either of you. If he lands first, he takes two souls instead of your life.',waves:[['ippon']],tier:3,shards:4,ippon:true}
];
function makeDuel(){const v=pick(DUELS.filter(d=>!d.minFloor||fl()>=d.minFloor));return Object.assign({},v,{name:`${pick(DUEL_FAM)} ${pick(DUEL_GIV)}`,epithet:pick(DUEL_EPI)});}
function duelTalk(o){
  const D=S.room.duel,greet=pick(['They say a broken blade still cuts. Show me.','I have waited in this hall for a worthy opponent. You will have to do.','Bow, draw, and do not disappoint me.','My sword has not left its scabbard in nine years. Today, perhaps.','You walk like someone who has never lost. Let us fix that.']);
  openDialog({spr:D.look,name:D.name,title:D.epithet,text:`"${greet}"\n${D.title}. ${D.desc}\nThe prize: a ${D.tier>=3?'legendary':'fine'} treasure and ${D.shards} blood shards. He parries, he dodges, he reads every lazy cut.`,choices:[
    {label:'Bow and draw',fn:()=>{closeDialog();startDuel(o);}},
    {label:'Decline',fn:()=>{o.done=true;say('"Then live, and come back sharper."');}}]});
}
function startDuel(o){
  const R=S.room;if(!R.duel)R.duel=makeDuel();const D=R.duel;if(o)o.gone=true;R.cleared=false;S.duel={D,R};
  R.waves=D.waves.map(w=>w.map(k=>({key:k,duel:true})));
  S.pending.push({t:0.6,spawn:true,fn:()=>spawnWave(R)});
  S.banner={name:D.name.toUpperCase(),title:`${D.title} · ${D.epithet}`,t:2.4};sfx('duel');S.shake+=4;
}
function duelLost(){
  const R=S.room,D=S.duel.D;S.duel=null;
  for(const e of S.enemies){burst(e.x,e.y-14,20,'#cfc8b8',200,0.6,2);for(const c of e.cuts||[])c.done=true;}
  S.enemies=[];S.eslashes=[];S.shots=[];R.waves=[];
  const lost=Math.max(0,Math.min(2,P.hp-1));P.hp-=lost;P.inv=1.5;S.hurt=1;S.shake+=10;hitPause(14,P,2);sfx('hurt');S.flash=0.15;
  text(P.x,P.y-60,'IPPON',C.hi,true);R.cleared=true;R.duelDone=true;
  S.pending.push({t:0.9,fn:()=>openDialog({spr:D.look,name:D.name,title:'victor',text:`His blade stops a hair from your throat. "Not today." He takes ${lost?`${lost} soul${lost>1?'s':''}`:'nothing but your pride'} and walks out into the dark.`,choices:[{label:'Rise',fn:closeDialog}]})});
}

// ---------- shrine hub ----------
function drawHubBlade(c){
  const g=c.getContext('2d'),W=c.width,H=c.height;g.imageSmoothingEnabled=false;g.fillStyle='#0a080b';g.fillRect(0,0,W,H);
  const y=H/2|0,x0=14;g.fillStyle='#2a1a10';g.fillRect(x0,y-1,12,3);for(let i=0;i<12;i+=3){g.fillStyle='#ece4d7';g.fillRect(x0+i+1,y-1,1,1);}
  g.fillStyle='#d9a648';g.fillRect(x0+12,y-4,3,9);g.fillStyle='#c4ccd2';g.fillRect(x0+15,y-1,10,3);g.fillStyle='#e8eef2';g.fillRect(x0+15,y-1,10,1);
  const L=Math.round(6+masteryPct()/100*(W-x0-36));for(let i=0;i<L;i++){g.fillStyle=i%5===4?'#ff4a5c':'#b8142a';g.fillRect(x0+25+i,y-1,1,3);}g.fillStyle='#ff8a95';g.fillRect(x0+25,y-1,L,1);
  g.fillStyle='#3a2a2c';for(let i=L+3;i<W-x0-14;i+=3)g.fillRect(x0+25+i,y,1,1);
}
const pctBar=(v,max)=>{const p=max?Math.round(v/max*100):0;return`<span class="pbar"><i style="width:${p}%"></i></span><b>${p}%</b>`;};
function renderHub(){
  const trees=TREES.map(t=>`<li class="${treeOpen(t)?'':'locked'}"><span>${esc(t.name)}</span>${treeOpen(t)?pctBar(treeLv(t),treeMax(t)):'<em>pick one up to unlock</em>'}</li>`).join('');
  $('hubInner').innerHTML=`<div class="hub">
    <div class="hub-head"><div class="big" data-toy>血階</div><div><h2>Shrine of the Broken Blade</h2><p>Strip weapons from the dead, feed the blood orb, and climb. Shards are only safe once you finish a realm and reach the Blind Smith at the start of the next one. Die before that and they are lost. He forges them into the Blood Tree: every branch ends in a technique.</p></div></div>
    <div class="hub-grid">
      <div class="hub-card"><canvas id="hubBlade" width="160" height="22" data-toy></canvas>
        <div class="row"><span class="label">Mastery</span><b>${masteryPct()}%</b></div>
        <div class="row"><span class="label">Banked shards</span><b class="shard">${META.shards}</b></div>
        <div class="row"><span class="label">Escape record</span><b>${META.bestFloor?Math.round((META.bestFloor-1)/totalFloors()*100)+'%':'–'}</b></div>
        <div class="row"><span class="label">Weapons known</span><b>${WKEYS.filter(k=>META.wseen[k]).length} / ${WKEYS.length}</b></div>
        <div class="row"><span class="label">Techniques</span><b>${Object.values(SKILLS).filter(k=>k.innate||tipOwned(k.w,k.id)).length} / ${Object.keys(SKILLS).length}</b></div>
      </div>
      <div class="hub-card"><div class="row"><span class="label">The Blood Tree</span><button class="chip" type="button" id="hubTree">Explore the tree</button></div><ol class="ms trees">${trees}</ol></div>
    </div>
    <div class="hub-stats"><span>Runs <b>${META.runs}</b></span><span>Victories <b>${META.wins}</b></span><span>Deepest level <b>${META.bestFloor?`${Math.ceil(META.bestFloor/SPB())}-${(META.bestFloor-1)%SPB()+1}`:'–'}</b></span><span>Foes cut <b>${META.kills}</b></span></div>
    <div class="hub-go"><button class="btn ghost" type="button" id="hubBack">Title screen</button><button class="btn" type="button" id="descendBtn">To the shrine</button></div>
  </div>`;
  drawHubBlade($('hubBlade'));
  $('descendBtn').addEventListener('click',()=>{$('descendBtn').blur();$('hub').hidden=true;if(loadRunData()){showTitle();menuOpen('confirmNew',false);return;}if(S.touchUI&&!isFS()&&!isApp())enterFS();enterHub();});
  $('hubBack').addEventListener('click',()=>{$('hub').hidden=true;showTitle();});
  $('hubTree').addEventListener('click',()=>openTree({view:true}));
}
function showHub(){
  S.mode='hub';S.running=false;S.summary=false;S.dialog=null;$('dlg').hidden=true;$('overlay').hidden=true;$('perkOv').hidden=true;
  renderHub();$('hub').hidden=false;coolDown($('hubInner'),450);const b=$('descendBtn');if(b)b.focus({preventScroll:true});
}
function showSummary(win,afterEnding){
  if(S.forgeOpen)closeForge();
  clearRun();menuClose();
  S.running=false;S.summary=true;S.mode='summary';keys.clear();S.dialog=null;$('dlg').hidden=true;$('perkOv').hidden=true;S.choosing=false;
  if(!win){S.lostShards=S.carry||0;S.carry=0;}else S.lostShards=0;
  META.kills+=S.stats?S.stats.kills:0;saveMeta();try{featCheck();}catch(_){}
  const st=S.stats||{},m=Math.floor((st.time||0)/60),sc=Math.floor((st.time||0)%60);
  $('ovBig').textContent=win?'刀成':'魂散';
  const mh=modeSummary(win),gmid=S.gm&&S.gm.id;
  $('ovText').textContent=win&&gmid&&gmid!=='story'&&gmid!=='hell'?`${MODE_NAMES[gmid]} cleared.`:win?'The blade is whole, and the hundred hells are behind you. For now.':(st.killer?`Your soul scatters on level ${flName()}, cut down by ${/^[AEIOUĀĒĪŌŪ]/i.test(st.killer)?'an':'a'} ${st.killer}.`:`Your soul scatters on level ${flName()}.`);
  const names=S.items.map(id=>ITEM[id].name).concat(Object.keys(S.owned).map(id=>PERKS.find(p=>p.id===id).name));
  const cell=(l,v,c)=>`<div><span>${l}</span><b${c?` class="${c}"`:''}>${v}</b></div>`;
  $('ovStats').innerHTML=cell(win?'Shards banked':'Carried shards lost',win?`+${S.shardsRun}`:`${S.lostShards}`,'shard')+cell('Banked (safe)',META.shards)+cell('Level',flName())+cell('Foes cut',st.kills||0)+cell('Bosses',st.bosses||0)+cell('Best combo',st.bestCombo||0)+cell('Time',`${m}:${String(sc).padStart(2,'0')}`)+`<div class="wide"><span>Carried</span><b>${esc(names.join(', ')||'Nothing but the blade')}</b></div>`+mh;
  $('ovStats').hidden=false;
  const bonus=Math.min(300,Math.max(0,(S.shardsRun||0)-(S.lostShards||0)));
  $('ovBtns').innerHTML=(bonus>0&&!S.adShards?`<button class="btn ghost" type="button" id="adShardBtn">Watch an ad · +${bonus} 血晶</button>`:'')+`<button class="btn" type="button" id="againBtn">Back to the shrine</button><button class="btn ghost" type="button" id="toShrine">Records</button><button class="btn ghost" type="button" id="toTitle">Title screen</button>`;
  if($('adShardBtn'))$('adShardBtn').addEventListener('click',()=>rewardedAd('shards',()=>{if(S.adShards)return;S.adShards=true;META.shards+=bonus;saveMeta();const b=$('adShardBtn');if(b){b.disabled=true;b.textContent=`+${bonus} 血晶 banked`;}sfx('coin');}));
  $('toShrine').addEventListener('click',showHub);$('toTitle').addEventListener('click',()=>{$('overlay').hidden=true;showTitle();});$('againBtn').addEventListener('click',()=>{$('overlay').hidden=true;enterHub();});
  $('overlay').hidden=false;$('againBtn').focus({preventScroll:true});coolDown($('ovBtns'),900);
}
function pause(){
  if(S.mode!=='run'||!S.running||S.choosing||S.dialog)return;
  S.running=false;S.paused=true;S.swipe=null;S.trace=null;S.traceArm=0;keys.clear();sfx('click');
  MENU.stack=[];menuOpen('pause',false);
}
function resume(){if(!S.paused)return;S.paused=false;S.running=true;menuClose();$('helpOv').hidden=true;$('dbgOv').hidden=true;$('overlay').hidden=true;last=performance.now();auInit();}

// ---------- title screen ----------
function showTitle(){
  if(S.forgeOpen)closeForge();
  S.mode='title';S.running=false;S.summary=false;S.dialog=null;S.paused=false;S.choosing=false;
  for(const id of ['dlg','overlay','perkOv','hub'])$(id).hidden=true;
  $('title').hidden=false;$('tMenu').hidden=!S.titleOpen;$('tPress').hidden=!!S.titleOpen;
  $('tFoot').textContent=`${META.shards} 血晶 banked · mastery ${masteryPct()}% · ${META.runs} run${META.runs===1?'':'s'}${META.wins?` · ${META.wins} escape${META.wins>1?'s':''}`:''}`;
  $('tFs').textContent=isFS()?'Exit fullscreen':'Fullscreen';$('tFs').hidden=isApp()||!(document.fullscreenEnabled||document.webkitFullscreenEnabled);
  const sv=loadRunData();$('tCont').hidden=!sv;if(sv)$('tCont').textContent=`Continue · ${flNameOf(sv.n)}`;$('tDesc').classList.toggle('main',!sv);
  $('tVer').textContent=`v${VERSION}${devOn()?' · developer tools on':''}`;menuClose();$('helpOv').hidden=true;$('dbgOv').hidden=true;
  if(S.titleOpen){coolDown($('tMenu'),350);const b=$('tMenu').querySelector('button');if(b)b.focus({preventScroll:true});maybeShowGift();}
  syncGiftBadge();
}
function openTitleMenu(){if(S.titleOpen)return;S.titleOpen=true;auInit();sfx('gong');$('tPress').hidden=true;$('tMenu').hidden=false;coolDown($('tMenu'),450);const b=$('tMenu').querySelector('button');if(b)b.focus({preventScroll:true});syncGiftBadge();maybeShowGift();}
$('title').addEventListener('pointerdown',e=>{if(!S.titleOpen&&!e.target.closest('[data-toy]')){e.preventDefault();openTitleMenu();}});
$('tMenu').addEventListener('click',e=>{const b=e.target.closest('[data-go]');if(!b||$('tMenu').classList.contains('cool'))return;sfx('click');const go=b.dataset.go;
  if(go==='continue'){$('title').hidden=true;if(S.touchUI&&!isFS()&&!isApp())enterFS();continueRun();}
  else if(go==='descend'){if(loadRunData()){menuOpen('confirmNew',false);return;}$('title').hidden=true;if(S.touchUI&&!isFS()&&!isApp())enterFS();if(!META.pro&&!(META.runs>0)&&!META.tut){startPrologue();return;}enterHub();}
  else if(go==='shrine'){$('title').hidden=true;showHub();}
  else if(go==='fs'){toggleFS();b.textContent=isFS()?'Exit fullscreen':'Fullscreen';}
  else if(go==='settings'){menuOpen('settings',false);}
  else if(go==='armory'){ARM.tab='o';ARM.spin=null;ARM.sel=null;menuOpen('armory',false);}
  else if(go==='gift'){GIFT.msg='';menuOpen('gift',false);}
  else if(go==='credits'){menuOpen('credits',false);}
  else if(go==='how'){openHelp();}
});

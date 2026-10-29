// ================= the prologue: the last night of your life =================
// You storm the Usurper's castle at the height of your power, learn every move on the way up, and he kills you anyway.
// Hell takes your soul and your broken blade, and the game proper begins at the shrine.
const PRO_STEPS=[
  {room:0,id:'move',name:'Move',key:'WASD or the arrow keys',touch:'Thumb in the lower left: the stick appears under it'},
  {room:0,id:'dash',name:'Dash',key:'Space. You pass through attacks while dashing',touch:'Press DASH. You pass through attacks while dashing'},
  {room:1,id:'tap',name:'Quick slash',key:'Click near a guard',touch:'Tap near a guard',spawn:[['ronin',220,0]]},
  {room:1,id:'swipe',name:'Cut',key:'Drag the mouse in a line through them',touch:'Swipe a line through them',spawn:[['ronin',230,-90],['ronin',230,90]]},
  {room:1,id:'hold',name:'Charged move',key:'Press and hold still, then let go',touch:'Hold your finger still, then lift it',spawn:[['ronin',200,-60],['ronin',260,60]]},
  {room:2,id:'parry',name:'Parry',key:'He swings slowly. Cut across his yellow line as it travels',touch:'He swings slowly. Swipe across his yellow line as it travels',spawn:[['hatamoto',220,0,'parry']]},
  {room:2,id:'tool',name:'Throw',key:'X throws a kunai at the gunner. Walls stop bullets',touch:'Press KUNAI to throw one at the gunner. Walls stop bullets',spawn:[['teppo',420,-140],['teppo',420,140]]},
  {room:3,id:'tech',name:'Technique',key:'Hold right-click and draw a circle: Blood Spin',touch:'Press 技, then draw a circle: Blood Spin',spawn:[['ronin',130,0],['ronin',-130,0],['ronin',0,-110],['ronin',0,110]]},
  {room:3,id:'heal',name:'Heal',key:'An arrow found you. Q drinks blood from your orb',touch:'An arrow found you. Press HEAL to drink blood from your orb'},
  {room:3,id:'thirst',name:'Bloodthirst',key:'Your orb is full. R: your blade drinks and grows. Cut them all down',touch:'Your orb is full. Press THIRST: your blade drinks and grows. Cut them all down',
    spawn:[['hatamoto',260,-120],['hatamoto',260,120],['kunoichi',-220,-140],['kunoichi',-220,140],['ronin',320,0],['ronin',-300,0],['iaido',0,-170],['shinobi',0,170]]},
  {room:4,id:'boss',name:'Kuroda',key:'Kill the Usurper',touch:'Kill the Usurper'},
];
const PRO_ROOMS=[
  {name:'THE CASTLE GATE',title:'The last night of the Usurper\'s war'},
  {name:'THE OUTER COURT',title:'His guards are no match for you'},
  {name:'THE INNER COURT',title:'Keep moving'},
  {name:'THE KEEP STAIRS',title:'Everything he has left'},
  {name:'THE TENSHU',title:'Kuroda Nobutsuna waits at the top'},
];
function proFloor(){
  const B=BIOMES.find(b=>b.key==='castle')||BIOMES[BIOMES.length-1],rooms=new Map(),sizes=['s','w','b','w','b'];
  for(let i=0;i<5;i++){const r={gx:i,gy:0,type:i===0?'start':i===4?'boss':'pro',pro:i,size:sizes[i],dist:i};[r.w,r.h]=ROOM_SIZES[r.size];
    r.doors={};if(i>0)r.doors.w=true;if(i<4)r.doors.e=true;
    Object.assign(r,{visited:false,seen:false,cleared:false,obs:[],haz:[],built:false,objs:[],pools:[],waves:null,enc:null});rooms.set(rkey(i,0),r);}
  return{n:1,realm:BIOMES.indexOf(B),biome:B,stage:1,kind:'prologue',bossStage:false,diff:1,rooms,start:rooms.get(rkey(0,0)),boss:rooms.get(rkey(4,0)),gateOpen:true};
}
function startPrologue(){
  auInit();resetRunState();S.gm=null;S.gmx=null;S.modeRules=null;S.inHub=false;S.realmPick=null;
  S.floor=proFloor();
  S.pro={i:0,moved:0,lx:0,ly:0,t:0,bossT:0,bossHits:0,fall:null,stepSpawned:-1};
  // at the height of your power: the true blade, a deep soul, nothing can touch you
  P.max=8;P.hp=8;P.wpn=makeWeapon('katana',{name:'Chigiri, the true blade'});P.wpn.max*=4;P.wpn.dur=P.wpn.max;
  S.tools={kunai:6,shuri:3};S.tutSafe=true;
  enterRoom(S.floor.start,null);
  S.mode='run';S.running=true;S.paused=false;
  for(const id of ['hub','overlay','dlg','perkOv','title','menuOv','helpOv'])$(id).hidden=true;$('stage').classList.remove('titling');
  S.banner={name:PRO_ROOMS[0].name,title:PRO_ROOMS[0].title,t:3};sfx('gong');
  renderPerkStrip();last=performance.now();
}
const proStep=()=>S.pro&&PRO_STEPS[S.pro.i];
function proRoomStart(R){
  // rooms open their doors only when their lessons are done
  if(R.pro===2&&!R.proWalls){R.proWalls=true;const cx=R.w/2,cy=R.h/2;for(const [x,y] of [[cx+130,cy-150],[cx+130,cy+110]]){const o={type:'wall',x:x-28,y:y-28,w:56,h:56,hp:0,uid:Math.random()};R.obs.push(o);paintObstacle(o);}}
  const b=PRO_ROOMS[R.pro];S.banner={name:b.name,title:b.title,t:2.6};
  if(R.pro===4){const e=spawnEnemy('usurper',{boss:true,pos:{x:R.w/2+160,y:R.h/2-40}});S.boss=e;if(e){e.proBoss=true;}S.bossLine={text:'So you are the blade they sing about.',t:3.2};S.shake+=6;sfx('gong');}
  proSpawnStep();
}
function proSpawnStep(){
  const st=proStep();if(!st||!S.room||S.room.pro!==st.room||S.pro.stepSpawned===S.pro.i)return;S.pro.stepSpawned=S.pro.i;
  if(st.id==='heal'){P.hp=Math.max(2,P.hp-3);S.hurt=1;text(P.x,P.y-60,'AN ARROW FINDS YOU',C.hi);sfx('hurt');S.meter=Math.max(S.meter,healCost()+2);}
  if(st.id==='thirst')S.meter=orbMax();
  if(st.id==='tech')S.traceCd=0;
  for(const [k,dx,dy,tag] of st.spawn||[]){const R=S.room,pos=inArena({x:clamp(P.x+dx,WALL+60,R.w-WALL-60),y:clamp(P.y+dy,WALL+60,R.h-WALL-60)},24);const e=spawnEnemy(k,{pos});if(!e)continue;
    if(tag==='parry'){e.proGuard=true;e.T=Object.assign({},e.T,{pats:['cross'],tele:2.4,cd:1.5,dodge:0,guard:0,feint:0,range:420,pref:[110,160]});e.cd=1.2;}
    if(k==='teppo')e.cd=1.6;}
}
function proEvent(ev){
  const st=proStep();if(!st||st.id!==ev||!S.room||S.room.pro!==st.room)return;
  if(ev==='parry')for(const e of S.enemies)if(e.proGuard){e.proGuard=false;stunEnemy(e,1.2);text(e.x,e.y-60,'NOW CUT HIM DOWN',C.spirit);}
  S.pro.i++;sfx('learn');text(P.x,P.y-60,'✓',C.spirit,true);
  const nx=proStep();if(nx&&nx.room===st.room)S.pending.push({t:0.5,fn:proSpawnStep});
}
function proRoomDone(R){const st=proStep();return!st||st.room>R.pro;}
function updatePrologue(gdt){
  const p=S.pro;if(!p||S.dead>0)return;p.t+=gdt;const st=proStep(),R=S.room;if(!R)return;
  if(st&&st.id==='move'&&R.pro===0){p.moved+=Math.hypot(P.x-p.lx,P.y-p.ly);if(p.moved>260)proEvent('move');}
  p.lx=P.x;p.ly=P.y;
  // a lesson that needs someone to practise on brings them back
  if(st&&st.room===R.pro&&st.spawn&&!S.enemies.length&&!S.pending.some(x=>x.spawn)&&p.stepSpawned===p.i&&st.id!=='thirst'){p.stepSpawned=-1;S.pending.push({t:0.5,spawn:true,fn:proSpawnStep});}
  if(st&&st.id==='thirst'&&R.pro===3){if(btOn())proEvent('thirst');else if(!S.drink)S.meter=Math.max(S.meter,orbMax());}
  if(!R.cleared&&R.pro<4&&proRoomDone(R)&&!S.enemies.length&&!S.pending.some(x=>x.spawn)){R.cleared=true;sfx('door');text(P.x,P.y-60,'THE WAY IS OPEN →',C.bone);}
  // the duel he lets you have, and the end of it
  if(R.pro===4&&!p.fall){p.bossT+=gdt;if(p.bossT>10||p.bossHits>=6)proFall();}
  if(p.fall)updateFall(gdt);
}
function proFall(){
  const e=S.boss;S.pro.fall={t:0,stage:0};S.swipe=null;S.trace=null;S.traceArm=0;S.counter=null;
  if(e){e.state='strafe';e.cuts=[];e.cd=99;e.kx=e.ky=0;}
  S.bossLine={text:'A song. I am the silence after it.',t:3};
}
function updateFall(gdt){
  const f=S.pro.fall,e=S.boss;f.t+=gdt;
  if(e){e.cd=99;if(e.state==='wind'||e.state==='strike'){e.state='strafe';e.cuts=[];}}
  if(f.stage===0&&f.t>1.3){f.stage=1; // he catches the blade and snaps it
    if(P.wpn)P.wpn.dur=0;S.bt=null;burst(P.x+S.face*16,P.y-18,40,C.steel,420,0.7,3);text(P.x,P.y-64,'YOUR BLADE BREAKS',C.hi,true);sfx('gbreak');S.flash=0.2;S.shake+=12;S.slowT=Math.max(S.slowT,1.4);}
  if(f.stage===1&&f.t>2.6){f.stage=2;if(e){const a=Math.atan2(e.y-P.y,e.x-P.x);e.x=P.x+Math.cos(a)*40;e.y=P.y+Math.sin(a)*40;e.face=P.x<e.x?-1:1;burst(e.x,e.y-14,20,C.curse,300,0.4,2);}sfx('dash');}
  if(f.stage===2&&f.t>2.9){f.stage=3;S.tutSafe=false;P.inv=0;P.shield=0;P.hp=1;S.mods.daruma=false;S.unbrokenUsed=true;S.darumaUsed=true;hurtPlayer({owner:e||P},true);S.bossLine={text:'Kneel.',t:2.5};}
}
// the boss cannot be hurt tonight; the guards fall to a single cut
function proHit(e,s){
  if(e.proBoss){deflect(e,s);S.pro.bossHits++;if(S.pro.bossHits===3)S.bossLine={text:'Is that all the song has?',t:2.6};return true;}
  if(e.proGuard){deflect(e,s);text(e.x,e.y-70,'PARRY HIM FIRST',C.ash);return true;}
  return false;
}
function proFallen(){
  S.running=false;MENU.stack=[];
  menuShow(`<div class="mv-head"><div class="mv-kanji">地獄</div><div class="mv-title">You fell</div></div>
    <div class="mv-body"><p class="mv-note pro-story">Kuroda Nobutsuna broke your blade and your neck on the last night of his war.</p>
    <p class="mv-note pro-story">Hell took your soul, and the pieces of the sword came down with you. At the edge of the underworld there is a shrine that keeps the souls who still want something.</p>
    <p class="mv-note pro-story">You want something. Climb back through the hells. Take back what he took.</p></div>
    <div class="mv-list"><button class="btn" type="button" data-m="prowake">Wake</button></div>`,'profall');
}
function proFinish(){
  S.pro=null;S.tutSafe=false;META.pro=1;META.tut=1;saveMeta();menuClose();
  enterHub();
  S.banner={name:'SHRINE OF THE BROKEN BLADE',title:'The edge of the underworld',t:3.2};
  S.pending.push({t:2.2,fn:()=>{if(S.inHub&&!S.dialog)openDialog({spr:'monk2',name:'Old monk',title:'the shrine',text:'"You fell a long way, samurai. Kuroda keeps the strength he cut out of you. Go down through the hells and take it back, one floor at a time. Come back here when you fall again. You will."',choices:[{label:'I will',fn:closeDialog}]});}});
}
Object.assign(MENU_ACTS,{prowake(){proFinish();},proskip(){menuClose();S.paused=false;proFallen();}});
function drawPrologue(){
  const p=S.pro;if(!p||S.trace||S.traceArm||p.fall)return;const st=proStep();if(!st||!S.room||S.room.pro!==st.room)return;
  const w=Math.min(LW-130,260),x0=Math.max(116,Math.round(LW/2-w/2)),y0=S.touchUI?8:6,lines=wrapText((S.touchUI?st.touch:st.key).toUpperCase(),Math.floor(w/5.2));flush();
  lx.fillStyle='rgba(8,4,6,0.86)';lx.fillRect(x0,y0,w,22+lines.length*9);lx.fillStyle=C.hi;lx.fillRect(x0,y0,w,1);
  const N=PRO_STEPS.length;for(let i=0;i<N;i++){lx.fillStyle=i<p.i?C.hi:i===p.i?C.bone:'#3a3040';lx.fillRect(x0+w-8-(N-1-i)*6,y0+5,4,4);}
  ptext(`THE LAST NIGHT · ${st.name.toUpperCase()}`,x0+6,y0+11,C.hi,8,'left');
  lines.forEach((l,i)=>ptext(l,x0+6,y0+21+i*9,C.bone,8,'left'));
}

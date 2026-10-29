// ================= the Blood Tree: the Blind Smith's forge as a living tree you can drag, zoom and climb =================
// normalized drawings of each traced shape, used by the tree, the trace panel and the HUD
const SHAPE_PTS=(()=>{const o={},arc=(cx,cy,r,a0,a1,n)=>{const p=[];for(let i=0;i<=n;i++){const a=a0+(a1-a0)*i/n;p.push([cx+Math.cos(a)*r,cy+Math.sin(a)*r]);}return p;};
  o.line=[[-0.9,0.55],[0.9,-0.55]];o.arc=arc(0.2,0,0.85,Math.PI*0.32,Math.PI*1.68,18);o.v=[[-0.8,-0.75],[0,0.8],[0.8,-0.75]];
  o.rev=[[-0.9,-0.28],[0.72,-0.1],[0.82,0],[0.72,0.1],[-0.9,0.28]];o.z=[[-0.8,-0.75],[0.8,-0.75],[-0.8,0.75],[0.8,0.75]];
  o.tri=[[0,-0.85],[0.85,0.7],[-0.85,0.7],[0,-0.85]];o.zz=[[-0.95,-0.6],[-0.48,0.6],[0,-0.6],[0.48,0.6],[0.95,-0.6]];o.loop=arc(0,0,0.8,0,Math.PI*2,26);
  o.spiral=(()=>{const p=[];for(let i=0;i<=44;i++){const t=i/44,a=t*Math.PI*4,r=0.12+0.8*t;p.push([Math.cos(a)*r,Math.sin(a)*r]);}return p;})();return o;})();
function shapeGlyph(sh,x,y,col,s){const P0=SHAPE_PTS[sh];if(!P0)return;const k=(s||9)/2,cx=x+k,cy=y+k;for(let i=1;i<P0.length;i++)pline(cx+P0[i-1][0]*k,cy+P0[i-1][1]*k,cx+P0[i][0]*k,cy+P0[i][1]*k,col);}
function shapePath(g,sh,cx,cy,s,upto){const P0=SHAPE_PTS[sh];if(!P0)return;const n=upto===undefined?P0.length:Math.max(2,Math.ceil(P0.length*upto));g.beginPath();for(let i=0;i<n;i++){const x=cx+P0[i][0]*s,y=cy+P0[i][1]*s;i?g.lineTo(x,y):g.moveTo(x,y);}g.stroke();}

// ---------- layout: a trunk, ten boughs, and their branches ----------
let TL=null;
function treeLayout(){
  if(TL)return TL;
  const nodes=[],edges=[],TOP=-5300,trunk=[];
  for(let i=0;i<=30;i++){const t=i/30;trunk.push({x:Math.sin(t*5.4+0.6)*30*(1-t*0.5),y:t*TOP});}
  const trunkAt=y=>{const t=clamp(y/TOP,0,1),i=Math.min(29,Math.floor(t*30)),f=t*30-i;return{x:trunk[i].x+(trunk[i+1].x-trunk[i].x)*f,y};};
  const root={key:'root',type:'root',x:0,y:30,r:36};nodes.push(root);
  const order={'-1':['brush','tools','reserve','yari','kusari','nodachi','bo','naginata'],'1':['orb','body','katana','kanabo','musket','tessen','kama']};
  for(const sx of [-1,1])order[sx].forEach((id,k)=>{
    const t=TREES.find(q=>q.id===id),ay=sx<0?-320-k*660:-650-k*660,att=trunkAt(ay+70);
    const hub={key:id+'.hub',type:'hub',tree:t,x:sx*600,y:ay-150,r:32,side:sx};nodes.push(hub);
    if(t.innate){const I={key:id+'.innate',type:'innate',tree:t,x:hub.x+sx*10,y:hub.y+86,r:20};nodes.push(I);edges.push({kind:'twig',tree:t,a:hub,b:I,to:I});}
    edges.push({kind:'bough',tree:t,a:att,b:hub,c1:{x:att.x+sx*210,y:att.y-20},c2:{x:hub.x-sx*230,y:hub.y+70},w0:30,w1:13});
    const n=t.branches.length,spread=n>=5?0.86:n===3?0.62:0.42,base=sx>0?0:Math.PI,tilt=sx>0?-0.3:0.3,wpn=!!t.w,R0=wpn?1:0.8;
    t.branches.forEach((b,bi)=>{
      const f=n===1?0:bi/(n-1)*2-1,ang=base+tilt+f*spread*sx,dir={x:Math.cos(ang),y:Math.sin(ang)},perp={x:-dir.y,y:dir.x},np=b.nodes.length;let prev=hub;
      b.nodes.forEach((nd,j)=>{const d=((np===1?205:158+j*108/(np-1))+(bi%2?14:0))*R0,wob=Math.sin(d*0.035+bi*1.7)*7;
        const N={key:t.id+'.'+nd.id,type:'node',tree:t,branch:b,bi,j,nd,x:hub.x+dir.x*d+perp.x*wob,y:hub.y+dir.y*d+perp.y*wob,r:18};nodes.push(N);edges.push({kind:'twig',tree:t,a:prev,b:N,to:N});prev=N;});
      const T2={key:tipKey(t,b),type:'tip',tree:t,branch:b,bi,x:hub.x+dir.x*380*R0,y:hub.y+dir.y*380*R0,r:27,dir};nodes.push(T2);edges.push({kind:'twig',tree:t,a:prev,b:T2,to:T2});
    });
  });
  TL={nodes,edges,trunk,root,TOP};return TL;
}
// ---------- node state ----------
const tvSkill=N=>N.type==='innate'?SKILLS[N.tree.innate]:N.type==='tip'&&N.branch.tip.skill?SKILLS[N.branch.tip.skill]:null;
function nodeLv(N){if(N.type==='innate')return 1;if(N.type==='node')return Math.min(N.nd.max,up(N.tree.id,N.nd.id));if(N.type==='tip')return META.up[N.key]?1:0;return 0;}
function nodeMax(N){return N.type==='node'?N.nd.max:1;}
function nodeState(N){
  if(N.type==='root'||N.type==='innate')return'owned';if(!treeOpen(N.tree))return'closed';if(N.type==='hub')return'owned';
  const lv=nodeLv(N),mx=nodeMax(N);if(lv>=mx)return'owned';
  if(N.type==='node'){const prev=N.j>0?N.branch.nodes[N.j-1]:null;if(prev&&up(N.tree.id,prev.id)<1)return'locked';return lv>0?'partial':'avail';}
  return N.branch.nodes.every(nd=>up(N.tree.id,nd.id)>=nd.max)?'avail':'locked';
}
function nodeCost(N){return N.type==='node'?upgCost(N.nd.cost,nodeLv(N)):N.type==='tip'?N.branch.tip.cost:0;}
function nodeName(N){if(N.type==='root')return'Your blade';if(N.type==='innate')return SKILLS[N.tree.innate].name;if(N.type==='hub')return N.tree.name;if(N.type==='node')return N.nd.name;const sk=tvSkill(N);return sk?sk.name:N.branch.tip.name;}
const treePct=t=>Math.round(treeLv(t)/treeMax(t)*100);
// ---------- view state ----------
const TV={open:false,view:false,cam:{x:0,y:-900,z:0.5},fly:null,ptr:new Map(),drag:null,pinch:null,sel:null,hover:null,hold:null,vel:{x:0,y:0},parts:[],petals:[],learned:null,shake:0,t:0,last:0,cv:null,g:null,toast:null};
function tvFitAll(){const el=TV.cv;if(!el)return{x:0,y:-1500,z:0.3};const w=el.clientWidth||600,h=el.clientHeight||400;const z=clamp(Math.min(w/2300,(h-90)/5800),0.06,0.6);return{x:0,y:-2560-45/z,z};}
function tvFocus(t){const L=treeLayout(),hub=L.nodes.find(n=>n.type==='hub'&&n.tree===t);if(!hub)return;const el=TV.cv,w=el?el.clientWidth:600,h=el?el.clientHeight:400;
  const z=clamp(Math.min(w/1000,(h-110)/640),0.34,1.2);TV.fly={x:hub.x+hub.side*175,y:hub.y-75-50/z,z,k:0};}
function openTree(o={}){
  TV.view=!!o.view;TV.open=true;S.forgeOpen=true;if(!TV.view){S.choosing=true;S.swipe=null;S.trace=null;keys.clear();}
  S.forgeLine=pick(SMITH_LINES);buildTreeDom();$('forgeOv').hidden=false;sfx(TV.view?'paper':'temper');
  TV.sel=null;TV.hover=null;TV.hold=null;TV.learned=null;TV.parts=[];
  const W=TV.view?null:curW(),t=TREES.find(q=>q.id===(W?W.id:'reserve'))||TREES[0];
  TV.cam=Object.assign({},tvFitAll());tvFocus(t);TV.fly.delay=0.35;
  TV.last=performance.now();cancelAnimationFrame(TV.raf);TV.raf=requestAnimationFrame(treeFrame);
}
function closeTree(){
  if(!TV.open)return;TV.open=false;S.forgeOpen=false;cancelAnimationFrame(TV.raf);$('forgeOv').hidden=true;
  if(!TV.view){S.choosing=false;last=performance.now();}else if(S.mode==='hub')renderHub();
}
const openForge=()=>openTree({view:false}),closeForge=closeTree;
const SMITH_LINES=['"I forged your blade once. I can hear it crying from here."','"Bring me blood that has hardened. I will make the steel remember."','"Hell has terrible taste in swords. Strip them anyway."','"Your hands are steadier than last time. A little."','"Every lord you cut down gives me another piece of your blade."','"A technique is a branch you climb to the end. No shortcuts. I checked."','"The tree remembers every drop. So do I. Mostly."'];
// ---------- forging ----------
function buyTreeNode(N){
  if(TV.view){tvToast('Only the Blind Smith can forge. He waits at the start of every realm.');sfx('deny');return false;}
  const st=nodeState(N);if(st!=='avail'&&st!=='partial'){sfx('deny');TV.shake=4;return false;}
  const c=nodeCost(N);if(META.shards<c){sfx('deny');TV.shake=6;tvToast(`You need ${c-META.shards} more 血晶`);return false;}
  META.shards-=c;META.up[N.key]=N.type==='node'?(META.up[N.key]|0)+1:1;saveMeta();
  if(S.mode==='run'){const k=N.key;if(k==='body.soul'){P.max++;P.hp++;}else if(k==='body.dash')S.mods.dashCdMul*=0.9;else if(k==='body.haggle')S.mods.discount*=0.92;else if(k==='tools.kunai')S.tools.kunai++;else if(k==='tools.shuri')S.tools.shuri++;
    else if(N.type==='node'&&N.nd.id==='dur'&&P.wpn&&P.wpn.id===N.tree.id){const nm=wDurMax(N.tree.id,P.wpn.named);P.wpn.dur+=Math.max(0,nm-P.wpn.max);P.wpn.max=nm;}}
  const n=N.type==='tip'?60:22;for(let i=0;i<n;i++){const a=Math.random()*Math.PI*2,v=rand(60,N.type==='tip'?420:220);TV.parts.push({x:N.x,y:N.y,vx:Math.cos(a)*v,vy:Math.sin(a)*v-60,life:rand(0.5,1.1),max:1.1,col:Math.random()<0.6?'#ff4a5c':Math.random()<0.5?'#ffd27a':'#ece4d7',s:rand(1.5,3.5)});}
  if(N.type==='tip'){TV.learned={N,t:0};sfx('learn');TV.shake=10;}else{sfx('temper');TV.shake=3;}
  N.pop=1;tvRenderInfo();tvRenderTop();return true;
}
// ---------- DOM ----------
function buildTreeDom(){
  const tabs=[`<button type="button" class="tr-tab" data-fit="1">Whole tree<small>${masteryPct()}%</small></button>`].concat(TREES.map(t=>`<button type="button" class="tr-tab${treeOpen(t)?'':' locked'}" data-tree="${t.id}">${esc(t.name)}<small>${treeOpen(t)?treePct(t)+'%':'locked'}</small></button>`)).join('');
  $('forgeInner').innerHTML=`<div class="tree-ui" id="treeUi">
    <canvas id="trCv"></canvas>
    <div class="tr-top" id="trTop"></div>
    <div class="tr-tabs" id="trTabs">${tabs}</div>
    <div class="tr-info" id="trInfo" hidden></div>
    <div class="tr-toast" id="trToast" hidden></div>
    <div class="tr-zoom"><button type="button" class="chip" data-z="in" aria-label="Zoom in">+</button><button type="button" class="chip" data-z="out" aria-label="Zoom out">−</button><button type="button" class="chip" data-z="fit" aria-label="Whole tree">⤢</button></div>
    <div class="tr-help" id="trHelp">${S.touchUI?'Drag to look around · pinch to zoom · tap a node':'Drag to look around · scroll to zoom · click a node'}${TV.view?' to read it':', hold it to forge'}</div>
  </div>`;
  TV.cv=$('trCv');TV.g=TV.cv.getContext('2d');tvRenderTop();
  $('trTabs').addEventListener('click',e=>{const b=e.target.closest('button');if(!b)return;sfx('blip',900);if(b.dataset.fit){TV.fly=Object.assign(tvFitAll(),{k:0});return;}const t=TREES.find(q=>q.id===b.dataset.tree);if(t)tvFocus(t);});
  document.querySelector('.tr-zoom').addEventListener('click',e=>{const b=e.target.closest('button');if(!b)return;sfx('blip',900);const z=b.dataset.z;if(z==='fit')TV.fly=Object.assign(tvFitAll(),{k:0});else tvZoomAt(TV.cv.clientWidth/2,TV.cv.clientHeight/2,z==='in'?1.35:1/1.35,true);});
  const cv=TV.cv;
  cv.addEventListener('pointerdown',tvDown);cv.addEventListener('pointermove',tvMove);cv.addEventListener('pointerup',tvUp);cv.addEventListener('pointercancel',tvUp);cv.addEventListener('pointerleave',e=>{if(e.pointerType==='mouse'&&!TV.drag){TV.hover=null;tvRenderInfo();}});
  cv.addEventListener('wheel',e=>{e.preventDefault();const r=cv.getBoundingClientRect();tvZoomAt(e.clientX-r.left,e.clientY-r.top,Math.exp(-e.deltaY*0.0016*(e.deltaMode===1?18:1)));},{passive:false});
  cv.addEventListener('dblclick',e=>{const r=cv.getBoundingClientRect();if(!tvHit(e.clientX-r.left,e.clientY-r.top))tvZoomAt(e.clientX-r.left,e.clientY-r.top,1.6,true);});
  cv.addEventListener('contextmenu',e=>e.preventDefault());
}
function tvRenderTop(){
  const el=$('trTop');if(!el)return;
  el.innerHTML=`<div class="tr-who">${TV.view?'':'<canvas id="trSmith" width="40" height="40" data-toy></canvas>'}<div class="tr-txt"><div class="tr-name">${TV.view?'The Blood Tree':'The Blind Smith'}</div><div class="tr-line">${TV.view?'Every branch ends in a technique. The Blind Smith forges them at the start of each realm.':esc(S.forgeLine||SMITH_LINES[0])}</div></div></div>
    <div class="tr-bank"><span class="label">Banked</span><b class="shard">${META.shards} 血晶</b><span class="label">Mastery</span><b>${masteryPct()}%</b></div>
    <button type="button" class="btn tr-close" id="trClose">${TV.view?'Back':'Back to the climb'}</button>`;
  const c=$('trSmith');if(c){const g=c.getContext('2d');g.imageSmoothingEnabled=false;g.fillStyle='#0a080b';g.fillRect(0,0,40,40);const sp=SPR.smith;if(sp)g.drawImage(sp.r[0],4,8);}
  $('trClose').addEventListener('click',closeTree);
  const tb=$('trTabs');if(tb)tb.querySelectorAll('[data-tree]').forEach(b=>{const t=TREES.find(q=>q.id===b.dataset.tree);b.querySelector('small').textContent=treeOpen(t)?treePct(t)+'%':'locked';});
  const fb=tb&&tb.querySelector('[data-fit] small');if(fb)fb.textContent=masteryPct()+'%';
}
function tvToast(msg){const el=$('trToast');if(!el)return;el.textContent=msg;el.hidden=false;TV.toast=2.2;}
function tvRenderInfo(){
  const el=$('trInfo');if(!el)return;const N=TV.sel||TV.hover;if(!N){el.hidden=true;return;}el.hidden=false;
  const st=nodeState(N),lv=nodeLv(N),mx=nodeMax(N),c=nodeCost(N),t=N.tree,sk=tvSkill(N);
  let kind='',name=nodeName(N),desc='',extra='',btn='';
  if(N.type==='root'){kind='The trunk';desc=`Everything grows from the broken blade. ${masteryPct()}% of the tree is forged.`;extra=`<div class="ti-meta">${Object.values(SKILLS).filter(k=>k.innate||tipOwned(k.w,k.id)).length} of ${Object.keys(SKILLS).length} techniques learned</div>`;}
  else if(N.type==='hub'){kind=t.w?'Weapon':'Craft';desc=t.w&&WEAPONS[t.w]?WEAPONS[t.w].desc:t.desc;
    if(t.w&&WEAPONS[t.w]){const W=WEAPONS[t.w];extra=`<ul class="ti-moves">${W.moves.map(m=>`<li>${esc(m)}</li>`).join('')}<li>Bloodthirst: ${esc(W.thirst)}</li>${W.broke?`<li>Broken: ${esc(W.broke.toLowerCase())}</li>`:''}</ul>`;}
    if(t.innate)extra+=`<div class="ti-meta">Innate technique: <b>${esc(SKILLS[t.innate].name)}</b>, trace ${esc(SHAPES[SKILLS[t.innate].shape])}</div>`;
    extra+=`<div class="ti-meta">${treeOpen(t)?`${treePct(t)}% forged · ${t.branches.filter(b=>META.up[tipKey(t,b)]).length} of ${t.branches.length} branch tips`:'Pick one up in the realms to wake this bough.'}</div>`;}
  else if(N.type==='node'){kind=`${t.name} · ${N.branch.name} branch`;desc=N.nd.desc;extra=`<div class="ti-lv">${Array.from({length:mx},(_,i)=>`<i class="${i<lv?'on':''}"></i>`).join('')}<span>Level ${lv} / ${mx}</span></div>`;}
  else if(N.type==='innate'){kind=`Technique · ${KINDS[sk.kind]} · innate`;desc=sk.desc;extra=`<div class="ti-meta ti-shape"><canvas id="tiGlyph" width="44" height="44"></canvas><span>Yours from the start. Hold right-click and trace <b>${esc(SHAPES[sk.shape])}</b> while holding the broken katana. Recharges in ${Math.round(techCd(sk))}s.</span></div>`;}
  else{const capT=!sk;kind=sk?`Technique · ${KINDS[sk.kind]}`:`${t.name} · capstone`;desc=sk?sk.desc:N.branch.tip.desc;
    if(sk)extra=`<div class="ti-meta ti-shape"><canvas id="tiGlyph" width="44" height="44"></canvas><span>Hold right-click and trace <b>${esc(SHAPES[sk.shape])}</b> while holding the ${esc(WEAPONS[sk.w].name.toLowerCase())}. Recharges in ${Math.round(techCd(sk))}s.${S.touchUI?' On touch: press 技, then draw.':''}</span></div>`;
    extra+=`<div class="ti-meta">The tip of the ${esc(N.branch.name)} branch. ${st==='owned'?(sk?'Learned.':'Forged.'):'Master every node on the branch to reach it.'}</div>`;}
  if(N.type==='node'||N.type==='tip'){
    let why='';if(st==='closed')why='This bough is still asleep';else if(st==='owned')why=N.type==='tip'?(sk?'Learned':'Forged'):'Mastered';else if(st==='locked')why=N.type==='tip'?'Master the whole branch first':`Needs ${N.branch.nodes[N.j-1].name} first`;else if(META.shards<c)why=`Need ${c} 血晶 · you have ${META.shards}`;
    if(TV.view)btn=`<div class="ti-note">${st==='owned'?why:`Costs ${c} 血晶 at the Blind Smith`}</div>`;
    else btn=`<button type="button" class="btn${why?' ghost':''}" id="tiBuy"${why?' disabled':''}>${why||`${N.type==='tip'?(sk?'Learn':'Forge'):'Forge'} · ${c} 血晶`}</button>${why?'':'<span class="ti-hint">or hold the node</span>'}`;}
  el.innerHTML=`<button type="button" class="ti-x" id="tiX" aria-label="Close">×</button><div class="ti-kind">${esc(kind)}</div><div class="ti-name">${esc(name)}</div><div class="ti-desc">${esc(desc)}</div>${extra}<div class="ti-act">${btn}</div>`;
  el.style.borderTopColor=sk?KCOL[sk.kind]:st==='owned'?'var(--blood-hi)':'var(--line)';
  const b=$('tiBuy');if(b)b.addEventListener('click',()=>buyTreeNode(N));$('tiX').addEventListener('click',()=>{TV.sel=null;TV.hover=null;tvRenderInfo();});
  const gc=$('tiGlyph');if(gc&&sk){const g=gc.getContext('2d');g.lineWidth=3;g.lineCap='round';g.lineJoin='round';g.strokeStyle=KCOL[sk.kind];shapePath(g,sk.shape,22,22,15);}
}
// ---------- input ----------
const tvW2S=(x,y)=>{const c=TV.cam,el=TV.cv;return{x:(x-c.x)*c.z+el.clientWidth/2,y:(y-c.y)*c.z+el.clientHeight/2};};
const tvS2W=(x,y)=>{const c=TV.cam,el=TV.cv;return{x:(x-el.clientWidth/2)/c.z+c.x,y:(y-el.clientHeight/2)/c.z+c.y};};
function tvHit(sx,sy){const w=tvS2W(sx,sy),L=treeLayout();let best=null,bd=1e9;for(const n of L.nodes){const d=Math.hypot(n.x-w.x,n.y-w.y),r=n.r+Math.max(6,10/TV.cam.z);if(d<r&&d<bd){bd=d;best=n;}}return best;}
function tvZoomAt(sx,sy,f,anim){const c=TV.cam,w=tvS2W(sx,sy),z=clamp(c.z*f,0.12,2.4);if(anim){const el=TV.cv;TV.fly={x:w.x-(sx-el.clientWidth/2)/z,y:w.y-(sy-el.clientHeight/2)/z,z,k:0,fast:true};return;}c.z=z;c.x=w.x-(sx-TV.cv.clientWidth/2)/z;c.y=w.y-(sy-TV.cv.clientHeight/2)/z;TV.fly=null;}
function tvLocal(e){const r=TV.cv.getBoundingClientRect();return{x:e.clientX-r.left,y:e.clientY-r.top};}
function tvDown(e){
  e.preventDefault();try{TV.cv.setPointerCapture(e.pointerId);}catch(_){}const p=tvLocal(e);TV.ptr.set(e.pointerId,p);TV.fly=null;TV.vel={x:0,y:0};
  if(TV.ptr.size===2){const [a,b]=[...TV.ptr.values()];TV.pinch={d0:Math.hypot(a.x-b.x,a.y-b.y)||1,z0:TV.cam.z,w:tvS2W((a.x+b.x)/2,(a.y+b.y)/2)};TV.drag=null;TV.hold=null;return;}
  const n=tvHit(p.x,p.y);TV.drag={x0:p.x,y0:p.y,cx:TV.cam.x,cy:TV.cam.y,moved:false,node:n,lx:p.x,ly:p.y,lt:performance.now()};
  if(n&&(n.type==='node'||n.type==='tip'))TV.hold={N:n,t:0,id:e.pointerId,rep:0};
  TV.cv.classList.add('grabbing');
}
function tvMove(e){
  const p=tvLocal(e);if(TV.ptr.has(e.pointerId))TV.ptr.set(e.pointerId,p);
  if(TV.pinch&&TV.ptr.size>=2){const [a,b]=[...TV.ptr.values()],d=Math.hypot(a.x-b.x,a.y-b.y),z=clamp(TV.pinch.z0*d/TV.pinch.d0,0.12,2.4),mx=(a.x+b.x)/2,my=(a.y+b.y)/2;TV.cam.z=z;TV.cam.x=TV.pinch.w.x-(mx-TV.cv.clientWidth/2)/z;TV.cam.y=TV.pinch.w.y-(my-TV.cv.clientHeight/2)/z;return;}
  const D=TV.drag;
  if(D){const dx=p.x-D.x0,dy=p.y-D.y0;if(!D.moved&&Math.hypot(dx,dy)>7){D.moved=true;TV.hold=null;}
    if(D.moved){TV.cam.x=D.cx-dx/TV.cam.z;TV.cam.y=D.cy-dy/TV.cam.z;const now=performance.now(),dt=Math.max(1,now-D.lt);TV.vel={x:-(p.x-D.lx)/dt*16/TV.cam.z,y:-(p.y-D.ly)/dt*16/TV.cam.z};D.lx=p.x;D.ly=p.y;D.lt=now;}
    return;}
  if(e.pointerType==='mouse'){const n=tvHit(p.x,p.y);if(n!==TV.hover){TV.hover=n;if(n){sfx('blip',n.type==='tip'?1400:1100);n.pop=Math.max(n.pop||0,0.5);}if(!TV.sel)tvRenderInfo();}TV.cv.classList.toggle('pointing',!!n);}
}
function tvUp(e){
  const D=TV.drag;TV.ptr.delete(e.pointerId);if(TV.ptr.size<2)TV.pinch=null;TV.cv.classList.remove('grabbing');
  if(D&&!D.moved){const n=D.node;if(!(TV.hold&&TV.hold.rep>0)){TV.sel=n||null;if(n){sfx('blip',1300);n.pop=1;}tvRenderInfo();}}
  if(D&&D.moved&&performance.now()-D.lt>90)TV.vel={x:0,y:0};
  TV.drag=null;TV.hold=null;
}
addEventListener('keydown',e=>{if(!TV.open)return;const k=e.key.toLowerCase(),c=TV.cam,st=60/c.z;
  if(['arrowleft','a'].includes(k)){c.x-=st;TV.fly=null;}else if(['arrowright','d'].includes(k)){c.x+=st;TV.fly=null;}else if(['arrowup','w'].includes(k)){c.y-=st;TV.fly=null;}else if(['arrowdown','s'].includes(k)){c.y+=st;TV.fly=null;}
  else if(k==='+'||k==='='){tvZoomAt(TV.cv.clientWidth/2,TV.cv.clientHeight/2,1.25,true);}else if(k==='-'||k==='_'){tvZoomAt(TV.cv.clientWidth/2,TV.cv.clientHeight/2,0.8,true);}else return;e.preventDefault();});
// ---------- loop + drawing ----------
function treeFrame(now){
  if(!TV.open)return;
  try{const dt=clamp((now-TV.last)/1000,0,0.05);TV.last=now;TV.t+=dt;tvUpdate(dt);drawTree();}catch(err){showErr(err);}
  TV.raf=requestAnimationFrame(treeFrame);
}
function tvUpdate(dt){
  const c=TV.cam;
  if(TV.fly){const f=TV.fly;if(f.delay>0){f.delay-=dt;}else{const k=Math.min(1,dt*(f.fast?9:3.6));c.x+=(f.x-c.x)*k;c.y+=(f.y-c.y)*k;c.z+=(f.z-c.z)*k;if(Math.abs(f.x-c.x)<0.5&&Math.abs(f.y-c.y)<0.5&&Math.abs(f.z-c.z)<0.002)TV.fly=null;}}
  else if(!TV.drag&&(Math.abs(TV.vel.x)+Math.abs(TV.vel.y)>0.05)){c.x+=TV.vel.x*dt*60;c.y+=TV.vel.y*dt*60;const k=Math.max(0,1-dt*5);TV.vel.x*=k;TV.vel.y*=k;}
  c.x=clamp(c.x,-1250,1250);c.y=clamp(c.y,-5700,260);
  if(TV.hold){const h=TV.hold;h.t+=dt;const need=h.rep?0.42:0.6;if(h.t>=need){h.t=0;h.rep++;TV.sel=h.N;if(!buyTreeNode(h.N)||nodeState(h.N)==='owned'){TV.hold=null;}tvRenderInfo();}}
  for(const p of TV.parts){p.x+=p.vx*dt;p.y+=p.vy*dt;p.vy+=260*dt;p.vx*=Math.max(0,1-dt*2);p.life-=dt;}TV.parts=TV.parts.filter(p=>p.life>0);
  for(const n of treeLayout().nodes)if(n.pop>0)n.pop=Math.max(0,n.pop-dt*3);
  if(TV.learned){TV.learned.t+=dt;if(TV.learned.t>2.8)TV.learned=null;}
  if(TV.shake>0)TV.shake=Math.max(0,TV.shake-dt*30);
  if(TV.toast!==null&&TV.toast>0){TV.toast-=dt;if(TV.toast<=0){TV.toast=null;const el=$('trToast');if(el)el.hidden=true;}}
  const W=TV.cv.clientWidth,H=TV.cv.clientHeight;if(TV.petals.length<30)TV.petals.push({x:Math.random()*W+40,y:-10-Math.random()*H*0.5,vx:-rand(8,26),vy:rand(14,34),ph:Math.random()*6,s:rand(1.5,3)});
  for(const q of TV.petals){q.x+=(q.vx+Math.sin(TV.t*1.4+q.ph)*10)*dt;q.y+=q.vy*dt;if(q.y>H+10||q.x<-10){q.x=Math.random()*W+40;q.y=-10;}}
}
const TVC={closed:'#140e12',locked:'#2c2228',avail:'#7a4a52',partial:'#a8323e',owned:'#d0203a'};
function drawTree(){
  const cv=TV.cv,g=TV.g,dpr=Math.min(2,window.devicePixelRatio||1),W=cv.clientWidth,H=cv.clientHeight;if(!W||!H)return;
  if(cv.width!==Math.round(W*dpr)||cv.height!==Math.round(H*dpr)){cv.width=Math.round(W*dpr);cv.height=Math.round(H*dpr);}
  const L=treeLayout(),c=TV.cam,z=c.z,t=TV.t;
  g.setTransform(dpr,0,0,dpr,0,0);
  const bg=g.createRadialGradient(W*0.5,H*0.25,0,W*0.5,H*0.4,Math.max(W,H)*0.9);bg.addColorStop(0,'#2a0d16');bg.addColorStop(0.5,'#12070b');bg.addColorStop(1,'#050304');g.fillStyle=bg;g.fillRect(0,0,W,H);
  // a blood moon far behind, drifting slower than the tree
  {const mx=W*0.78-(c.x*0.04*z),my=H*0.2-(c.y+1300)*0.02*z,mr=Math.min(W,H)*0.16;g.fillStyle='rgba(255,80,90,0.05)';for(const k of [1.6,1.3]){g.beginPath();g.arc(mx,my,mr*k,0,7);g.fill();}g.fillStyle='#3a1218';g.beginPath();g.arc(mx,my,mr,0,7);g.fill();g.fillStyle='#4a161e';g.beginPath();g.arc(mx-mr*0.2,my-mr*0.15,mr*0.75,0,7);g.fill();}
  const sh=TV.shake?(Math.random()-0.5)*TV.shake:0,sh2=TV.shake?(Math.random()-0.5)*TV.shake:0;
  g.setTransform(dpr*z,0,0,dpr*z,dpr*(W/2-c.x*z+sh),dpr*(H/2-c.y*z+sh2));
  const vis=(x,y,r)=>{const s=tvW2S(x,y);return s.x>-r*z-80&&s.x<W+r*z+80&&s.y>-r*z-80&&s.y<H+r*z+80;};
  // ground and roots
  g.fillStyle='#0d0709';g.beginPath();g.ellipse(0,60,900,120,0,Math.PI,0,true);g.fill();g.fillStyle='#120a0d';g.beginPath();g.ellipse(0,52,520,60,0,Math.PI,0,true);g.fill();
  g.strokeStyle='#1d1216';g.lineCap='round';for(let i=0;i<7;i++){const a=Math.PI*(0.12+i*0.126),len=180+((i*53)%90);g.lineWidth=14-i%3*3;g.beginPath();g.moveTo(Math.cos(a)*30,10);g.quadraticCurveTo(Math.cos(a)*len*0.5,40+Math.sin(a)*20,Math.cos(a)*len,60+((i*37)%40));g.stroke();}
  // trunk: tapered, with a vein of blood that climbs as you master the tree
  const tr=L.trunk;for(let pass=0;pass<2;pass++){for(let i=1;i<tr.length;i++){const u=i/tr.length;g.lineWidth=(pass?62:72)*(1-u*0.7);g.strokeStyle=pass?'#3a222a':'#1a0e12';g.beginPath();g.moveTo(tr[i-1].x,tr[i-1].y);g.lineTo(tr[i].x,tr[i].y);g.stroke();}}
  g.strokeStyle='rgba(255,255,255,0.03)';g.lineWidth=6;g.beginPath();tr.forEach((p,i)=>i?g.lineTo(p.x-14*(1-i/tr.length),p.y):g.moveTo(p.x-14,p.y));g.stroke();
  {const m=masteryPct()/100,n=Math.max(1,Math.round(m*(tr.length-1)));g.strokeStyle='#b8142a';g.lineWidth=4;g.shadowColor='#ff2040';g.shadowBlur=12;g.beginPath();for(let i=0;i<=n;i++){const p=tr[i];i?g.lineTo(p.x+Math.sin(i*1.3)*4,p.y):g.moveTo(p.x,p.y);}g.stroke();g.shadowBlur=0;}
  // boughs
  for(const e of L.edges){if(e.kind!=='bough')continue;const open=treeOpen(e.tree),pct=treePct(e.tree)/100;const bz=(u)=>{const a=e.a,b=e.b,c1=e.c1,c2=e.c2,v=1-u;return{x:v*v*v*a.x+3*v*v*u*c1.x+3*v*u*u*c2.x+u*u*u*b.x,y:v*v*v*a.y+3*v*v*u*c1.y+3*v*u*u*c2.y+u*u*u*b.y};};
    let p0=bz(0);for(let i=1;i<=24;i++){const u=i/24,p=bz(u);g.lineWidth=e.w0+(e.w1-e.w0)*u;g.strokeStyle=open?'#3a222a':'#1a1216';g.beginPath();g.moveTo(p0.x,p0.y);g.lineTo(p.x,p.y);g.stroke();p0=p;}
    if(open&&pct>0){g.strokeStyle='#b8142a';g.lineWidth=3;g.shadowColor='#ff2040';g.shadowBlur=8;g.beginPath();const n=Math.max(2,Math.round(24*Math.min(1,0.25+pct)));for(let i=0;i<=n;i++){const p=bz(i/24);i?g.lineTo(p.x,p.y):g.moveTo(p.x,p.y);}g.stroke();g.shadowBlur=0;}}
  // twigs
  for(const e of L.edges){if(e.kind!=='twig')continue;if(!vis((e.a.x+e.b.x)/2,(e.a.y+e.b.y)/2,200))continue;const st=nodeState(e.to),a=e.a,b=e.b,mx=(a.x+b.x)/2,my=(a.y+b.y)/2,nx=-(b.y-a.y),ny=b.x-a.x,nl=Math.hypot(nx,ny)||1,bend=10*(e.to.bi%2?1:-1);
    g.lineWidth=e.to.type==='tip'?7:9;g.strokeStyle=st==='closed'?'#1a1216':'#2e1c22';g.beginPath();g.moveTo(a.x,a.y);g.quadraticCurveTo(mx+nx/nl*bend,my+ny/nl*bend,b.x,b.y);g.stroke();
    const lit=st==='owned'||st==='partial'?TVC.owned:st==='avail'?TVC.avail:null;if(lit){g.lineWidth=st==='avail'?2:3.5;g.strokeStyle=lit;if(st!=='avail'){g.shadowColor='#ff2040';g.shadowBlur=10;}g.setLineDash(st==='avail'?[6,7]:[]);g.lineDashOffset=-t*20;g.beginPath();g.moveTo(a.x,a.y);g.quadraticCurveTo(mx+nx/nl*bend,my+ny/nl*bend,b.x,b.y);g.stroke();g.setLineDash([]);g.shadowBlur=0;}}
  // nodes
  const lbl=z>0.42,font=(px,w)=>`${w||''} ${px}px DotGothic16, "Hiragino Sans", sans-serif`;
  for(const n of L.nodes){if(!vis(n.x,n.y,n.r+60))continue;const st=nodeState(n),hot=n===TV.hover||n===TV.sel,pop=1+(n.pop||0)*0.12+(hot?0.06:0);
    g.save();g.translate(n.x,n.y);g.scale(pop,pop);
    if(n.type==='root'){g.strokeStyle='#5a4a3a';g.lineWidth=8;g.beginPath();g.moveTo(-2,-8);g.lineTo(-2,22);g.stroke();g.fillStyle='#d9a648';g.fillRect(-16,-14,28,6);g.strokeStyle='#c4ccd2';g.lineWidth=6;g.beginPath();g.moveTo(-2,-14);g.lineTo(6,-84);g.stroke();g.strokeStyle='#ff4a5c';g.lineWidth=2;g.beginPath();g.moveTo(1,-30);g.lineTo(5,-80);g.stroke();
      if(lbl){g.font=font(18);g.textAlign='center';g.fillStyle='#ff4a5c';g.fillText('血刀',0,52);g.font=font(12);g.fillStyle='#968b97';g.fillText(`MASTERY ${masteryPct()}%`,0,70);}g.restore();continue;}
    if(n.type==='hub'){const open=st!=='closed';g.fillStyle=open?'#1b1015':'#0e090b';g.strokeStyle=open?'#d9a648':'#2e2731';g.lineWidth=3;g.beginPath();g.arc(0,0,n.r,0,7);g.fill();g.stroke();
      if(open){const p=treePct(n.tree)/100;g.strokeStyle='#ff4a5c';g.lineWidth=4;g.beginPath();g.arc(0,0,n.r+6,-Math.PI/2,-Math.PI/2+p*Math.PI*2);g.stroke();}
      if(n.tree.w&&open){const ic=icon('w_'+n.tree.w);g.imageSmoothingEnabled=false;g.drawImage(ic,-24,-24,48,48);}else{g.font=font(26);g.textAlign='center';g.textBaseline='middle';g.fillStyle=open?'#ece4d7':'#3a3040';g.fillText(open?(n.tree.g||n.tree.jp||'?'):'?',0,1);g.textBaseline='alphabetic';}
      if(z>0.08){const fz=Math.max(17,13/z);g.font=font(fz);g.textAlign=n.side>0?'left':'right';g.fillStyle=open?'#ece4d7':'#5a4a52';const lx2=n.side>0?-n.r-10:n.r+10;g.textAlign=n.side>0?'right':'left';g.fillText(n.tree.name.toUpperCase(),lx2,-4);g.font=font(fz*0.78);g.fillStyle=open?'#ff4a5c':'#5a4a52';g.fillText(open?`${treePct(n.tree)}%`:'ASLEEP',lx2,fz*0.85);}
      g.restore();continue;}
    const col=st==='owned'?'#ff4a5c':st==='partial'||st==='avail'?'#d9a648':st==='locked'?'#3a2e34':'#1e171c',pulse=st==='avail'?0.5+0.5*Math.sin(t*4+n.x*0.01):0;
    if(n.type==='node'){g.fillStyle=st==='owned'?'#2a0c12':'#140d10';g.beginPath();g.arc(0,0,n.r,0,7);g.fill();g.lineWidth=2.5;g.strokeStyle=col;if(pulse){g.shadowColor='#d9a648';g.shadowBlur=12*pulse;}g.stroke();g.shadowBlur=0;
      const mx=n.nd.max,lv=nodeLv(n);for(let i=0;i<mx;i++){const a0=-Math.PI/2+i/mx*Math.PI*2+0.12,a1=-Math.PI/2+(i+1)/mx*Math.PI*2-0.12;g.strokeStyle=i<lv?'#ff4a5c':'#2e2731';g.lineWidth=4;g.beginPath();g.arc(0,0,n.r+6,a0,a1);g.stroke();}
      g.font=font(16);g.textAlign='center';g.textBaseline='middle';g.fillStyle=st==='owned'?'#ece4d7':st==='locked'||st==='closed'?'#4a3e46':'#d9a648';g.fillText(n.nd.g,0,1);g.textBaseline='alphabetic';
      if(z>1.05||hot){const nm=n.nd.name.toUpperCase();g.font=font(11);const tw=g.measureText(nm).width;g.fillStyle='rgba(5,3,4,0.75)';g.fillRect(-tw/2-3,n.r+12,tw+6,14);g.fillStyle=st==='owned'?'#ece4d7':'#c8bcc4';g.fillText(nm,0,n.r+23);}}
    else{const sk=tvSkill(n),kc=sk?KCOL[sk.kind]:'#d9a648';g.rotate(Math.PI/4);const r=n.r*0.78;if(n.type==='innate'&&lbl){g.rotate(-Math.PI/4);g.font=font(11);g.textAlign='center';g.fillStyle='#968b97';g.fillText('INNATE',0,n.r+36);g.rotate(Math.PI/4);}
      if(st==='owned'){const gr=g.createLinearGradient(-r,-r,r,r);gr.addColorStop(0,'#ff4a5c');gr.addColorStop(1,'#6a0a18');g.fillStyle=gr;}else g.fillStyle=st==='avail'?'#1f1014':'#110b0e';
      if(st==='owned'||pulse){g.shadowColor=st==='owned'?'#ff2040':kc;g.shadowBlur=st==='owned'?18:22*pulse;}g.fillRect(-r,-r,r*2,r*2);g.shadowBlur=0;g.lineWidth=3;g.strokeStyle=st==='owned'?'#ffd0d6':st==='avail'?kc:col;g.strokeRect(-r,-r,r*2,r*2);g.rotate(-Math.PI/4);
      g.lineCap='round';g.lineJoin='round';g.lineWidth=3;g.strokeStyle=st==='owned'?'#fff':st==='avail'?kc:st==='locked'?'#4a3e46':'#2a2026';
      if(sk)shapePath(g,sk.shape,0,0,n.type==='innate'?8:11);else{g.font=font(18);g.textAlign='center';g.textBaseline='middle';g.fillStyle=g.strokeStyle;g.fillText(n.branch.tip.g||'極',0,1);g.textBaseline='alphabetic';}
      if(lbl&&st!=='closed'){const nm=nodeName(n).toUpperCase(),ty=n.type==='innate'||(n.dir&&n.dir.y>0.3)?n.r+22:-n.r-12;g.font=font(12);g.textAlign='center';g.fillStyle='rgba(5,3,4,0.7)';const tw=g.measureText(nm).width;g.fillRect(-tw/2-4,ty-11,tw+8,15);g.fillStyle=st==='owned'?'#ece4d7':st==='avail'?kc:'#6a5a62';g.fillText(nm,0,ty);
        if(sk&&z>0.75){g.font=font(10);g.fillStyle='#968b97';g.fillText(KINDS[sk.kind].toUpperCase(),0,ty+(ty>0?13:-14));}}}
    if(TV.hold&&TV.hold.N===n&&TV.hold.t>0.05){const need=TV.hold.rep?0.42:0.6;g.strokeStyle='#ffd27a';g.lineWidth=4;g.beginPath();g.arc(0,0,n.r+12,-Math.PI/2,-Math.PI/2+Math.min(1,TV.hold.t/need)*Math.PI*2);g.stroke();}
    if(n===TV.sel){g.strokeStyle='rgba(236,228,215,0.7)';g.lineWidth=1.5;g.setLineDash([4,5]);g.lineDashOffset=t*10;g.beginPath();g.arc(0,0,n.r+16,0,7);g.stroke();g.setLineDash([]);}
    g.restore();}
  for(const p of TV.parts){g.globalAlpha=clamp(p.life/p.max*1.4,0,1);g.fillStyle=p.col;g.fillRect(p.x-p.s/2,p.y-p.s/2,p.s,p.s);}g.globalAlpha=1;
  // screen space: petals, vignette, celebration
  g.setTransform(dpr,0,0,dpr,0,0);
  for(const q of TV.petals){g.fillStyle=Math.floor(TV.t*3+q.ph)%2?'#f2a7b8':'#c8364a';g.globalAlpha=0.6;g.fillRect(q.x,q.y,q.s,q.s*0.7);}g.globalAlpha=1;
  const vg=g.createRadialGradient(W/2,H/2,Math.min(W,H)*0.35,W/2,H/2,Math.max(W,H)*0.75);vg.addColorStop(0,'rgba(0,0,0,0)');vg.addColorStop(1,'rgba(0,0,0,0.65)');g.fillStyle=vg;g.fillRect(0,0,W,H);
  if(TV.learned){const lr=TV.learned,k=lr.t,a=clamp(Math.min(k*4,(2.8-k)*2),0,1),sk=tvSkill(lr.N);g.globalAlpha=a*0.85;g.fillStyle='#060405';g.fillRect(0,H*0.32,W,H*0.36);g.fillStyle='#b8142a';g.fillRect(0,H*0.32,W,2);g.fillRect(0,H*0.68-2,W,2);g.globalAlpha=a;
    g.textAlign='center';g.font=font(Math.min(14,W/40));g.fillStyle='#968b97';g.fillText(sk?'TECHNIQUE LEARNED':'CAPSTONE FORGED',W/2,H*0.4);g.font=font(Math.min(34,W/16));g.fillStyle='#ff4a5c';g.fillText(nodeName(lr.N).toUpperCase(),W/2,H*0.4+Math.min(40,W/14));
    if(sk){g.strokeStyle=KCOL[sk.kind];g.lineWidth=4;g.lineCap='round';g.lineJoin='round';shapePath(g,sk.shape,W/2,H*0.6,Math.min(26,H*0.06),clamp(k/1.0,0,1));g.font=font(12);g.fillStyle='#ece4d7';g.fillText(`TRACE ${SHAPES[sk.shape].toUpperCase()}`,W/2,H*0.66);}
    g.globalAlpha=1;}
}

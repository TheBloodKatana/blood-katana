// ================= every lord and warden fights differently: signature moves, arena hazards, phases =================
// new arena pieces: zones on the floor, beams across the room, waves that sweep the whole arena, pulls and winds, darkness, leaps
const PHC='#8a5aff';
function beamPts(p,a){return[rayTo({x:p.x,y:p.y},a+Math.PI,3000,4),rayTo({x:p.x,y:p.y},a,3000,4)];}
function bouncePath(st,a,n,r){
  const R=S.room,pts=[{x:st.x,y:st.y}];let cur={x:st.x,y:st.y},dir=a;
  for(let i=0;i<=n;i++){const end=rayTo(cur,dir,3000,r+2);pts.push(end);
    const hx=end.x<=WALL+r+4||end.x>=R.w-WALL-r-4,hy=end.y<=WALL+r+4||end.y>=R.h-WALL-r-4;
    if(hx)dir=Math.PI-dir;if(hy)dir=-dir;if(!hx&&!hy)break;cur=end;}
  return pts;
}
function zone(o){const z=Object.assign({r:32,t:4,armT:0,next:0,kind:'fire',owner:null},o);z.max=z.t;S.zones.push(z);return z;}
// a cut that only appears after a delay, with its line telegraphed on the floor until then
function teleCut(e,cut,delay,col){e.busyT=Math.max(e.busyT||0,delay+0.25);S.tmarks.push({x:cut.pts[0].x,y:cut.pts[0].y,r:0,t:delay,max:delay,kind:'tline',pts:cut.pts,col:col||cut.tcol||C.curse,owner:e,look:cut.phantom||null,
  fn:()=>{if(!S.enemies.includes(e))return;S.eslashes.push(cut);e.cuts.push(cut);if(onScreen(cut.pts[0]))sfx('eswing');}});}
function phantomCut(e,from,to,sp,o){return eCut(e,[from,to],sp,Object.assign({phantom:e.look,tier:2,tcol:PHC,col:PHC,core:'#e8d8ff',phase:true,hr:10},o));}
// leaping: the foe is out of reach until it lands on the marked spot
function leapAt(e,to,dur,r,onLand){
  to=inArena(to,e.r+4);e.air=true;e.busyT=Math.max(e.busyT||0,dur+0.2);burst(e.x,e.y,14,C.ash,200,0.4,2);sfx('dash');
  S.tmarks.push({x:to.x,y:to.y,r,t:dur,max:dur,kind:'slam',owner:e,fn:()=>{if(!S.enemies.includes(e))return;e.air=false;e.x=to.x;e.y=to.y;land(e);impact(e,to.x,to.y,r,'blade');groundWave(e,{x:to.x,y:to.y,col:C.curse,v:300,gapW:0.9});if(onLand)onLand();}});
}
const fwd=(e,d)=>{const L=dist(P,e)||1;return{x:(P.x-e.x)/L,y:(P.y-e.y)/L,a:Math.atan2(P.y-e.y,P.x-e.x),d:L};};
function arcCut(e,cx,cy,R,a0,a1,sp,o){const pts=[],n=Math.max(8,Math.round(Math.abs(a1-a0)*8));for(let i=0;i<=n;i++){const a=a0+(a1-a0)*i/n;pts.push({x:cx+Math.cos(a)*R,y:cy+Math.sin(a)*R*0.85});}return eCut(e,pts,sp,o||{});}
function shot(e,a,sp,kind,o){S.shots.push(Object.assign({x:e.x+Math.cos(a)*e.r,y:e.y-14+Math.sin(a)*e.r,vx:Math.cos(a)*sp,vy:Math.sin(a)*sp,spd:sp,r:6,kind,home:0,homeT:0,t:0,life:4,owner:e},o||{}));}

const SIGS={
  // ---------- Moonlit Dojo ----------
  shadowstep(e,c){const f=fwd(e),p={x:P.x+f.x*85,y:P.y+f.y*85};blinkTo(e,p);const g=fwd(e),a=g.a+Math.PI/2,L=95;
    if(e.enraged){e.combo=1;e.comboPat='shadowstep';}
    return{cuts:[eCut(e,[{x:P.x-Math.cos(a)*L,y:P.y-Math.sin(a)*L},{x:P.x+Math.cos(a)*L,y:P.y+Math.sin(a)*L}],c.base*1.35,{tier:3,hr:11})],tele:0.6};},
  shadows(e,c){const n=e.enraged?4:3,a0=Math.random()*Math.PI*2,out=[];
    for(let i=0;i<n;i++){const a=a0+i*Math.PI*2/n,from=inArena({x:P.x+Math.cos(a)*210,y:P.y+Math.sin(a)*210},20),to=rayTo(from,Math.atan2(P.y-from.y,P.x-from.x),430,20);out.push(phantomCut(e,from,to,1900*CFG.eSlashMul,{delay:i*0.32}));}
    return{cuts:out,tele:1.4};},
  leap(e,c){return{later:ee=>{leapAt(ee,predictP(0.7),0.85,72);return[];},tele:0.8,pose:'wind'};},
  weapons(e,c){return{later:ee=>{seqCuts(ee,5,0.3,i=>{const f=fwd(ee),pp=predictP(0.3);
      if(i%2===0)return eCut(ee,[{x:ee.x+f.x*ee.r,y:ee.y+f.y*ee.r},rayTo({x:ee.x,y:ee.y},Math.atan2(pp.y-ee.y,pp.x-ee.x),420,4)],c.base*1.35,{tier:3,kind:'spear',hr:7});
      const mid={x:(ee.x+pp.x)/2-f.y*90*(i%4?1:-1),y:(ee.y+pp.y)/2+f.x*90*(i%4?1:-1)},pts=[];for(let k=0;k<=12;k++){const t=k/12,u=1-t;pts.push({x:u*u*ee.x+2*u*t*mid.x+t*t*(pp.x+f.x*60),y:u*u*ee.y+2*u*t*mid.y+t*t*(pp.y+f.y*60)});}
      return eCut(ee,pts,c.base*1.1,{tier:2,hr:10,col:C.steel,core:C.white});});return[];},tele:1.0};},
  whirl(e,c){return{later:ee=>{seqCuts(ee,6,0.24,i=>{const f=fwd(ee);if(f.d>90){ee.x+=f.x*42;ee.y+=f.y*42;Object.assign(ee,inArena(ee,ee.r));}return arcCut(ee,ee.x,ee.y-6,78,i*1.3,i*1.3+Math.PI*2,1500*CFG.eSlashMul,{tier:2,hr:11});});return[];},tele:0.9};},
  kata(e,c){return{later:ee=>{seqCuts(ee,5,0.2,i=>{const pp=predictP(0.2);if(i===4){const f=fwd(ee);return eCut(ee,[{x:ee.x,y:ee.y},rayTo({x:ee.x,y:ee.y},f.a,Math.min(f.d+90,330),ee.r)],c.base*1.5,{tier:3,carry:true,hr:9});}
      const a=[0.6,2.2,0,Math.PI/2][i]+fwd(ee).a,L=80;return eCut(ee,[{x:pp.x-Math.cos(a)*L,y:pp.y-Math.sin(a)*L},{x:pp.x+Math.cos(a)*L,y:pp.y+Math.sin(a)*L}],c.base*1.3,{tier:2,hr:9});});return[];},tele:0.8};},
  counter(e,c){return{later:ee=>{ee.cstance=1.4;ee.busyT=1.4;ee.pose='guard';text(ee.x,ee.y-60,'構',C.steel,true);sfx('guarded');return[];},tele:0.25,pose:'guard'};},
  smokebomb(e,c){return{later:ee=>{burst(ee.x,ee.y-14,30,C.smoke,260,0.7,3);S.clouds.push({x:ee.x,y:ee.y,r:70,t:1.2,max:1.2});const a=Math.random()*Math.PI*2;blinkTo(ee,{x:P.x+Math.cos(a)*230,y:P.y+Math.sin(a)*230});ee.busyT=0.6;
      S.pending.push({t:0.35,fn:()=>{if(!S.enemies.includes(ee))return;const f=fwd(ee);for(let k=-2;k<=2;k++)shot(ee,f.a+k*0.17,560,'kunai',{r:5,life:1.6});sfx('shuriken');}});return[];},tele:0.7};},
  kunairain(e,c){return{later:ee=>{for(let i=0;i<10;i++){const a=Math.random()*Math.PI*2,r=Math.sqrt(Math.random())*150,q=i===0?predictP(0.5):inArena({x:P.x+Math.cos(a)*r,y:P.y+Math.sin(a)*r},30);skyMark(ee,q.x,q.y,30,0.55+i*0.05,'blade',m=>impact(ee,m.x,m.y,m.r,'blade'));}ee.busyT=1;return[];},tele:0.9,pose:'draw'};},
  // ---------- Whispering Bamboo ----------
  tailsweep(e,c){return{later:ee=>{const a0=fwd(ee).a-Math.PI*0.9;seqCuts(ee,9,0.11,i=>arcCut(ee,ee.x,ee.y-8,125,a0+i*0.22,a0+i*0.22+1.1,1700*CFG.eSlashMul,{tier:2,hr:11,col:C.fox,core:'#ffe7a8'}));return[];},tele:1.0};},
  spiral(e,c){const kind=e.T.spiralKind||'fox';return{later:ee=>{const arms=e.enraged?4:3,steps=16;ee.busyT=steps*0.1;let base=Math.random()*6.28;
      for(let s=0;s<steps;s++)S.pending.push({t:s*0.1,fn:()=>{if(!S.enemies.includes(ee))return;for(let k=0;k<arms;k++)shot(ee,base+k*Math.PI*2/arms,210,kind,{r:6,life:3,spin:0.35});base+=0.33;if(s%3===0)sfx('fox');}});return[];},tele:0.9};},
  thundercloud(e,c){return{later:ee=>{S.dark={t:4.5,max:4.5};text(ee.x,ee.y-70,'雷',C.mon,true);sfx('zap');for(let i=0;i<6;i++)S.pending.push({t:0.3+i*0.55,fn:()=>{if(!S.enemies.includes(ee))return;const q=predictP(0.4);skyMark(ee,q.x,q.y,40,0.6,'bolt',m=>impact(ee,m.x,m.y,m.r,'bolt'));}});ee.busyT=0.6;return[];},tele:0.9,pose:'draw'};},
  kettle(e,c){const f=fwd(e),pts=bouncePath(e,f.a,3,e.r);text(e.x,e.y-60,'POMF!',C.mon,true);return{cuts:[eCut(e,pts,c.base*1.45,{carry:true,kind:'spin',tier:3,hr:18,tcol:C.mon})],tele:0.9};},
  tornado(e,c){return{later:ee=>{zone({kind:'tornado',x:ee.x,y:ee.y,r:36,t:5,chase:115,owner:ee});if(ee.enraged)zone({kind:'tornado',x:ee.x+40,y:ee.y,r:30,t:4,chase:150,owner:ee});sfx('gust');ee.busyT=0.4;return[];},tele:0.8};},
  // ---------- Drowned Temple ----------
  snowveil(e,c){return{later:ee=>{const a=Math.random()*Math.PI*2;blinkTo(ee,{x:P.x+Math.cos(a)*240,y:P.y+Math.sin(a)*240});for(let i=0;i<8;i++){const b=Math.random()*Math.PI*2,r=Math.sqrt(Math.random())*170,q=i===0?predictP(0.6):inArena({x:P.x+Math.cos(b)*r,y:P.y+Math.sin(b)*r},30);skyMark(ee,q.x,q.y,40,0.6+i*0.07,'ice',m=>impact(ee,m.x,m.y,m.r,'ice'));}ee.busyT=1;return[];},tele:0.9};},
  icepath(e,c){return{later:ee=>{const f=fwd(ee);for(let i=1;i<=7;i++){const q=inArena({x:ee.x+f.x*i*48,y:ee.y+f.y*i*48},20);zone({kind:'ice',x:q.x,y:q.y,r:26,t:4.5,armT:0.1+i*0.05,owner:null});}sfx('shotcut');ee.busyT=0.4;return[];},tele:0.8};},
  serpent(e,c){const f=fwd(e),L=Math.min(520,f.d+160),pts=[];for(let k=0;k<=14;k++){const t=k/14,s=Math.sin(t*Math.PI*2)*55;pts.push(inArena({x:e.x+f.x*L*t-f.y*s,y:e.y+f.y*L*t+f.x*s},e.r));}
    return{cuts:[eCut(e,pts,c.base*1.3,{carry:true,tier:3,hr:14,tcol:'#ff7a2a',col:'#ff7a2a',core:'#ffe7a8'})],later:ee=>{pts.forEach((q,i)=>{if(i%2===0)zone({kind:'fire',x:q.x,y:q.y,r:24,t:4,armT:0.25+i*0.03,owner:null});});return[];},tele:1.0};},
  bell(e,c){return{later:ee=>{const q=predictP(0.8);skyMark(ee,q.x,q.y,84,0.95,'bell',m=>{impact(ee,m.x,m.y,m.r,'coin');groundWave(ee,{x:m.x,y:m.y,col:C.mon,v:320,gapW:0.9});sfx('gong');S.shake+=10;});ee.busyT=1.1;return[];},tele:0.8,pose:'draw'};},
  webfield(e,c){return{later:ee=>{for(let i=0;i<4;i++){const a=i*Math.PI/2+Math.random()*0.6,q=inArena({x:P.x+Math.cos(a)*(i?95:20),y:P.y+Math.sin(a)*(i?95:20)},30);zone({kind:'web',x:q.x,y:q.y,r:40,t:6,armT:0.3,owner:ee});}sfx('web');ee.busyT=0.4;return[];},tele:0.8};},
  crawl(e,c){return{later:ee=>{const a=Math.random()*Math.PI*2;blinkTo(ee,{x:P.x+Math.cos(a)*270,y:P.y+Math.sin(a)*270});const f=fwd(ee);
      teleCut(ee,eCut(ee,[{x:ee.x,y:ee.y},rayTo({x:ee.x,y:ee.y},f.a,Math.min(f.d+90,420),ee.r)],1500*CFG.eSlashMul,{carry:true,kind:'grab',grab:true,phase:true,hr:14,tier:3,tcol:GRABC,col:GRABC,core:'#ffd0e0'}),0.42,GRABC);return[];},tele:0.6};},
  wail(e,c){return{later:ee=>{for(let i=0;i<2;i++)S.pending.push({t:i*0.3,fn:()=>{if(S.enemies.includes(ee))groundWave(ee,{col:'#d8d8f0',v:380,gapW:0.8});}});text(ee.x,ee.y-60,'泣',C.phase,true);ee.busyT=0.7;return[];},tele:0.8};},
  // ---------- Oni Hell ----------
  fissure(e,c){return{later:ee=>{const f=fwd(ee);[-0.5,0,0.5].forEach((o,j)=>{for(let i=1;i<=9;i++){const q=inArena({x:ee.x+Math.cos(f.a+o)*(ee.r+i*44),y:ee.y+Math.sin(f.a+o)*(ee.r+i*44)},20);skyMark(ee,q.x,q.y,28,0.35+i*0.06+j*0.04,'fire',m=>impact(ee,m.x,m.y,m.r,'fire'));}});ee.busyT=1.1;return[];},tele:0.9};},
  judgement(e,c){const a=Math.random()*Math.PI,out=[];for(const b of [a,a+Math.PI/2]){const [A,B]=beamPts(P,b);out.push(eCut(e,[A,B],1e6,{tier:3,phase:true,hr:13,kind:'beam',tcol:C.hi,col:C.hi,core:C.white}));}text(e.x,e.y-70,'裁',C.hi,true);return{cuts:out,tele:1.8};},
  gates(e,c){return{later:ee=>{for(let i=0;i<4;i++){const a=Math.PI/4+i*Math.PI/2;zone({kind:'fire',x:P.x+Math.cos(a)*95,y:P.y+Math.sin(a)*95,r:40,t:5,armT:0.6,owner:ee});}const q=predictP(0.5);skyMark(ee,q.x,q.y,50,1.0,'fire',m=>impact(ee,m.x,m.y,m.r,'fire'));ee.busyT=0.8;return[];},tele:0.9,pose:'draw'};},
  bullrush(e,c){const f=fwd(e),pts=bouncePath(e,f.a,e.enraged?3:2,e.r);return{cuts:[eCut(e,pts,c.base*1.5,{carry:true,tier:3,hr:18})],tele:1.0};},
  spearline(e,c){return{later:ee=>{seqCuts(ee,5,0.16,i=>{const f=fwd(ee),a=f.a+(i-2)*0.28;return eCut(ee,[{x:ee.x+Math.cos(a)*ee.r,y:ee.y+Math.sin(a)*ee.r},rayTo({x:ee.x,y:ee.y},a,400,4)],c.base*1.5,{tier:3,kind:'spear',hr:8});});return[];},tele:0.9};},
  // ---------- Sanzu River ----------
  coinring(e,c){return{later:ee=>{const n=e.enraged?20:16;for(let i=0;i<n;i++)shot(ee,i*Math.PI*2/n,90,'coin',{r:6,life:4.5,accel:1.9,accelT:0.5});sfx('coin');ee.busyT=0.4;return[];},tele:0.8};},
  tidal(e,c){return{later:ee=>{const R=S.room,f=fwd(ee),horiz=Math.abs(f.x)>Math.abs(f.y),dir=horiz?Math.sign(f.x):Math.sign(f.y);
      S.gwaves.push({line:true,horiz,pos:horiz?(dir>0?WALL:R.w-WALL):(dir>0?WALL:R.h-WALL),v:300*dir,gapC:horiz?rand(WALL+80,R.h-WALL-80):rand(WALL+80,R.w-WALL-80),gapW:110,owner:ee,hit:false,col:C.water,kind:'water',x:0,y:0,r:0,max:1e9,t:0});
      sfx('splash');S.shake+=6;ee.busyT=0.5;return[];},tele:1.0,pose:'draw'};},
  whirlpool(e,c){return{later:ee=>{S.force={mode:'pull',owner:ee,str:250,t:2.6};for(let s=0;s<10;s++)S.pending.push({t:s*0.24,fn:()=>{if(!S.enemies.includes(ee))return;shot(ee,s*0.9,260,'water',{r:6,life:2});}});ee.busyT=2.4;text(ee.x,ee.y-70,'渦',C.water,true);sfx('splash');return[];},tele:0.9};},
  ghostboats(e,c){const R=S.room,horiz=Math.random()<0.5,out=[];for(let i=-1;i<=1;i++){const off=i*90;
      const A=horiz?{x:WALL+4,y:clamp(P.y+off,WALL+20,R.h-WALL-20)}:{x:clamp(P.x+off,WALL+20,R.w-WALL-20),y:WALL+4},B=horiz?{x:R.w-WALL-4,y:A.y}:{x:A.x,y:R.h-WALL-4};
      out.push(phantomCut(e,A,B,1300*CFG.eSlashMul,{delay:(i+1)*0.35,hr:16,phantom:'sendo'}));}return{cuts:out,tele:1.6};},
  coil(e,c){return{later:ee=>{seqCuts(ee,2,0.35,i=>arcCut(ee,ee.x,ee.y-6,110,i*2,i*2+Math.PI*2,1600*CFG.eSlashMul,{tier:2,hr:13,col:'#5a8a6a',core:'#d8f0e0'}));for(let k=0;k<8;k++)shot(ee,k*Math.PI/4,300,'water',{r:6,life:1.6});return[];},tele:0.9};},
  // ---------- Frozen Hell ----------
  blizzard(e,c){return{later:ee=>{const a=Math.random()*Math.PI*2;S.force={mode:'push',ax:Math.cos(a),ay:Math.sin(a),str:170,t:3.2,owner:ee};for(let i=0;i<8;i++)S.pending.push({t:0.2+i*0.35,fn:()=>{if(!S.enemies.includes(ee))return;const q=predictP(0.5);skyMark(ee,q.x+rand(-30,30),q.y+rand(-30,30),36,0.55,'ice',m=>impact(ee,m.x,m.y,m.r,'ice'));}});text(ee.x,ee.y-70,'吹雪',C.ice,true);sfx('gust');ee.busyT=0.6;return[];},tele:0.9};},
  frostbite(e,c){return{later:ee=>{for(let i=0;i<3;i++){const a=Math.random()*Math.PI*2,q=inArena({x:P.x+Math.cos(a)*(i?60:0),y:P.y+Math.sin(a)*(i?60:0)},30);zone({kind:'ice',x:q.x,y:q.y,r:44,t:4,armT:0.5,owner:ee});}for(let k=-2;k<=2;k++)shot(ee,fwd(ee).a+k*0.2,520,'ice',{r:6,life:1.6});ee.busyT=0.4;return[];},tele:0.8};},
  lotus(e,c){return{later:ee=>{for(let w=0;w<3;w++)S.pending.push({t:w*0.45,fn:()=>{if(!S.enemies.includes(ee))return;for(let i=0;i<12;i++)shot(ee,i*Math.PI/6+w*0.26,170+w*30,'petal',{r:6,life:3.4,spin:w%2?0.5:-0.5});sfx('fox');}});ee.busyT=1.3;return[];},tele:0.9};},
  icewall(e,c){return{later:ee=>{const R=S.room,vert=Math.random()<0.5;for(const off of [-85,85]){for(let i=0;i<12;i++){const q=vert?{x:clamp(P.x+off,WALL+20,R.w-WALL-20),y:WALL+30+i*((R.h-2*WALL-60)/11)}:{x:WALL+30+i*((R.w-2*WALL-60)/11),y:clamp(P.y+off,WALL+20,R.h-WALL-20)};skyMark(ee,q.x,q.y,28,0.5+i*0.04,'ice',m=>impact(ee,m.x,m.y,m.r,'ice'));}}ee.busyT=1;return[];},tele:0.9};},
  glacier(e,c){const f=fwd(e),L=Math.min(f.d+150,460),end=rayTo({x:e.x,y:e.y},f.a,L,e.r);return{cuts:[eCut(e,[{x:e.x,y:e.y},end],c.base*1.35,{carry:true,tier:3,hr:16,tcol:C.ice})],
    later:ee=>{for(let i=1;i<=6;i++){const t=i/6;zone({kind:'ice',x:ee.x+(end.x-ee.x)*t,y:ee.y+(end.y-ee.y)*t,r:26,t:4,armT:0.2+t*0.3,owner:null});}return[];},tele:1.0};},
  // ---------- Hungry Ghosts ----------
  hunger(e,c){return{later:ee=>{S.force={mode:'pull',owner:ee,str:320,t:1.8};text(ee.x,ee.y-70,'餓',C.hi,true);sfx('mochi');const f=()=>{const g=fwd(ee);return eCut(ee,[{x:ee.x,y:ee.y},rayTo({x:ee.x,y:ee.y},g.a,Math.min(g.d+60,300),ee.r)],c.base*1.2,{carry:true,kind:'grab',grab:true,devour:true,phase:true,hr:22,tier:3,tcol:GRABC,col:'#8a1a2a',core:'#ffb0b0'});};
      S.pending.push({t:1.3,fn:()=>{if(S.enemies.includes(ee))teleCut(ee,f(),0.4,GRABC);}});ee.busyT=2.2;return[];},tele:0.9};},
  feast(e,c){return{later:ee=>{const m=S.enemies.find(o=>o!==ee&&!o.boss&&o.summoned===ee&&dist(o,ee)<320);
      if(m){burst(m.x,m.y-14,20,C.blood,260,0.5,3);m.hp=0;kill(m,null,true);const h=Math.round(ee.max*0.05);ee.hp=Math.min(ee.max,ee.hp+h);text(ee.x,ee.y-60,`FEASTS +${h}`,C.hi);sfx('mochi');}
      for(let k=-3;k<=3;k++)shot(ee,fwd(ee).a+k*0.16,460,'bone',{r:6,life:1.8});ee.busyT=0.4;return[];},tele:0.8};},
  inkflood(e,c){return{later:ee=>{for(let i=0;i<5;i++){const a=i*Math.PI*2/5+Math.random(),q=inArena({x:P.x+Math.cos(a)*(i?80:0),y:P.y+Math.sin(a)*(i?80:0)},30);zone({kind:'ink',x:q.x,y:q.y,r:40,t:5,armT:0.5,owner:ee});}sfx('splash');ee.busyT=0.4;return[];},tele:0.9};},
  lament(e,c){return{later:ee=>{for(let i=0;i<3;i++){const a=Math.random()*Math.PI*2,m=spawnEnemy('onibi',{quick:true,pos:rayTo({x:ee.x,y:ee.y},a,80,20)});if(m)m.summoned=ee;}text(ee.x,ee.y-60,'泣',C.phase,true);ee.busyT=0.4;return[];},tele:0.9};},
  // ---------- Ashura Battlefield ----------
  threefaces(e,c){return{later:ee=>{const a0=fwd(ee).a;seqCuts(ee,4,0.26,i=>{const out=[];for(let k=0;k<3;k++){const a=a0+k*Math.PI*2/3+i*0.5;out.push(eCut(ee,[{x:ee.x+Math.cos(a)*ee.r,y:ee.y+Math.sin(a)*ee.r},rayTo({x:ee.x,y:ee.y},a,300,4)],1700*CFG.eSlashMul,{tier:2,hr:10}));}return out;});return[];},tele:0.9};},
  bonehands(e,c){return{later:ee=>{for(let i=0;i<3;i++)S.pending.push({t:i*0.55,fn:()=>{if(!S.enemies.includes(ee))return;const q=predictP(0.6);skyMark(ee,q.x,q.y,72,0.8,'bone',m=>{impact(ee,m.x,m.y,m.r,'bone');S.shake+=8;sfx('smash');});}});ee.busyT=1.2;return[];},tele:0.9,pose:'draw'};},
  volley(e,c){return{later:ee=>{const f=fwd(ee),a=f.a+Math.PI/2;for(let i=-5;i<=5;i++){const q=inArena({x:P.x+Math.cos(a)*i*36+f.x*rand(-20,20),y:P.y+Math.sin(a)*i*36+f.y*rand(-20,20)},20);skyMark(ee,q.x,q.y,26,0.7+Math.abs(i)*0.03,'blade',m=>impact(ee,m.x,m.y,m.r,'blade'));}text(ee.x,ee.y-60,'放て!',C.curse,true);ee.busyT=1;return[];},tele:0.9,pose:'draw'};},
  cavalry(e,c){const R=S.room,out=[],horiz=Math.random()<0.5;for(let i=0;i<3;i++){const off=(i-1)*80,A=horiz?{x:WALL+4,y:clamp(P.y+off,WALL+20,R.h-WALL-20)}:{x:clamp(P.x+off,WALL+20,R.w-WALL-20),y:WALL+4},B=horiz?{x:R.w-WALL-4,y:A.y}:{x:A.x,y:R.h-WALL-4};
      out.push(phantomCut(e,i%2?B:A,i%2?A:B,1700*CFG.eSlashMul,{delay:i*0.3,hr:16,phantom:'kiba'}));}return{cuts:out,tele:1.5};},
  // ---------- Tengu Peaks ----------
  dive3(e,c){return{later:ee=>{let n=e.enraged?3:2;const go=()=>{if(!S.enemies.includes(ee)||n--<=0)return;leapAt(ee,predictP(0.6),0.7,60,()=>S.pending.push({t:0.25,fn:go}));};go();ee.busyT=2.5;return[];},tele:0.7};},
  drumroll(e,c){return{later:ee=>{const a0=Math.random()*Math.PI;for(let i=0;i<4;i++){const a=a0+i*Math.PI/4,[A,B]=beamPts(predictP(0.2),a);teleCut(ee,eCut(ee,[A,B],1e6,{tier:3,phase:true,hr:12,kind:'beam',tcol:'#ffe066',col:'#ffe066',core:C.white}),0.55+i*0.3,'#ffe066');}text(ee.x,ee.y-70,'雷',C.mon,true);sfx('pon');return[];},tele:0.8};},
  murder(e,c){return{later:ee=>{for(let i=0;i<10;i++){const a=-Math.PI/2+(i-4.5)*0.3;shot(ee,a,280,'feather',{r:5,life:3,home:1.4,homeT:1.6});}sfx('shuriken');ee.busyT=0.4;return[];},tele:0.8};},
  gale(e,c){return{later:ee=>{const f=fwd(ee);S.force={mode:'push',ax:f.x,ay:f.y,str:270,t:2.4,owner:ee};seqCuts(ee,3,0.3,i=>{const g=fwd(ee),a=g.a+(i-1)*0.3;return eCut(ee,[{x:ee.x,y:ee.y},rayTo({x:ee.x,y:ee.y},a,420,4)],c.base*1.3,{tier:2,kind:'wind',hr:8,push:420});});sfx('gust');return[];},tele:0.9};},
  // ---------- the Castle ----------
  execution(e,c){const out=[];for(const b of [Math.PI/4,-Math.PI/4]){const [A,B]=beamPts(P,b);out.push(eCut(e,[A,B],1e6,{tier:3,phase:true,hr:15,kind:'beam',tcol:C.hi,col:C.hi,core:C.white}));}
    const n=3,a0=Math.random()*6.28;for(let i=0;i<n;i++){const a=a0+i*Math.PI*2/n,from=inArena({x:P.x+Math.cos(a)*220,y:P.y+Math.sin(a)*220},20);out.push(phantomCut(e,from,rayTo(from,Math.atan2(P.y-from.y,P.x-from.x),440,20),2000*CFG.eSlashMul,{delay:0.5+i*0.25}));}
    text(e.x,e.y-74,'斬首',C.hi,true);return{cuts:out,tele:2.0};},
  talismans(e,c){return{later:ee=>{const n=8;for(let i=0;i<n;i++)shot(ee,i*Math.PI*2/n,300,'ofuda',{r:6,life:4,stopT:0.35,goT:0.9+i*0.06,goSp:520});sfx('paper');ee.busyT=0.5;return[];},tele:0.8};},
  pentagram(e,c){const R=130,cx=P.x,cy=P.y,pts=[];for(let i=0;i<=5;i++){const a=-Math.PI/2+i*Math.PI*4/5;pts.push(inArena({x:cx+Math.cos(a)*R,y:cy+Math.sin(a)*R},6));}
    return{cuts:[eCut(e,pts,1300*CFG.eSlashMul,{tier:3,phase:true,hr:12,tcol:C.phase,col:C.phase,core:'#efe6ff'})],tele:1.7};},
  shieldwall(e,c){return{later:ee=>{const f=fwd(ee);for(let i=-1;i<=1;i++){const m=spawnEnemy('tate',{quick:true,pos:inArena({x:ee.x+f.x*90-f.y*i*50,y:ee.y+f.y*90+f.x*i*50},20)});if(m){m.summoned=ee;m.cd=1;}}
      seqCuts(ee,3,0.25,i=>{const g=fwd(ee);return eCut(ee,[{x:ee.x,y:ee.y},rayTo({x:ee.x,y:ee.y},g.a+(i-1)*0.15,380,4)],c.base*1.4,{tier:3,kind:'spear',hr:7});});text(ee.x,ee.y-60,'構え!',C.curse,true);return[];},tele:1.0};},
  shadowdance(e,c){return{later:ee=>{for(let i=0;i<3;i++)S.pending.push({t:i*0.5,fn:()=>{if(!S.enemies.includes(ee))return;const a=Math.random()*Math.PI*2;blinkTo(ee,{x:P.x+Math.cos(a)*95,y:P.y+Math.sin(a)*95});
      const b=Math.random()*Math.PI,L=70;teleCut(ee,eCut(ee,[{x:P.x-Math.cos(b)*L,y:P.y-Math.sin(b)*L},{x:P.x+Math.cos(b)*L,y:P.y+Math.sin(b)*L}],1e6,{tier:2,hr:10,tcol:C.phase,col:C.phase,core:'#efe6ff'}),0.32,C.phase);}});ee.busyT=1.7;return[];},tele:0.6};},
};
// each boss's moveset: signature moves first, then the stock ones that suit them. enr = what they add once enraged
const KITS={
  kagemaru:{pats:['combo3','shadowstep','iai','shadows','glyph'],enr:['shadows','shadowstep','glyph']},
  benkei:{pats:['sweep','weapons','leap','thrust','glyph'],enr:['whirl','leap','glyph']},
  shihan:{pats:['combo3','kata','counter','dash'],enr:['kata','counter','iai']},
  fuma:{pats:['shuriken','smokebomb','clones','dash'],enr:['smokebomb','kunairain']},
  tamamo:{pats:['foxfire','tailsweep','spiral','clones'],enr:['spiral','tailsweep','ring9']},
  nue:{pats:['bolt','thundercloud','charge','gust','glyph'],enr:['thundercloud','bolt','glyph']},
  tanukid:{pats:['drum','kettle','summon','ring'],enr:['kettle','ring']},
  kamaosa:{pats:['wcut','tornado','gust','dash'],enr:['tornado','wcut']},
  shirayuki:{pats:['fan','snowveil','claw','icepath'],enr:['snowveil','icepath','glyph']},
  kiyohime:{pats:['breath','serpent','bell','fan','glyph'],enr:['serpent','bell','glyph']},
  joro:{pats:['web','webfield','sweep','summon'],enr:['webfield','web']},
  onryo:{pats:['claw','crawl','wail','fan'],enr:['crawl','grab']},
  goki:{pats:['quake','charge','leap','fissure','summon'],enr:['fissure','leap','glyph']},
  enma:{pats:['judgement','gates','summon','smash','glyph'],enr:['judgement','gates','glyph']},
  gozu:{pats:['charge','smash','bullrush','quake'],enr:['bullrush','quake']},
  mezu:{pats:['thrust','spearline','lunge','spikes'],enr:['spearline','spikes']},
  datsueba:{pats:['grab','coinring','rain','summon','glyph'],enr:['grab','coinring','glyph']},
  umibozu:{pats:['tidal','whirlpool','spit','summon','glyph'],enr:['tidal','whirlpool','glyph']},
  sendochf:{pats:['sweep','ghostboats','ladle','gust'],enr:['ghostboats','gust']},
  nureonna:{pats:['tongue','grab','coil','spit'],enr:['coil','grab']},
  yukijo:{pats:['breath','blizzard','frostbite','icicle','glyph'],enr:['blizzard','frostbite','glyph']},
  guren:{pats:['lotus','ring','cage','fan','glyph'],enr:['lotus','ring9','glyph']},
  tsurarah:{pats:['rain','icewall','icicle','claw'],enr:['icewall','rain']},
  frostgen:{pats:['smash','glacier','ring','charge'],enr:['glacier','ring']},
  gakiking:{pats:['grab','hunger','summon','quake','glyph'],enr:['hunger','devour','glyph']},
  shokujin:{pats:['grab','feast','inkblot','summon','glyph'],enr:['feast','grab','glyph']},
  sumibozu:{pats:['inkblot','inkflood','claw'],enr:['inkflood','rain']},
  ubume:{pats:['wail','lament','claw','foxfire'],enr:['lament','wail']},
  ashura:{pats:['sixarm','threefaces','combo3','charge','glyph'],enr:['threefaces','sixarm','glyph']},
  gasha:{pats:['sweep','bonehands','grab','summon','glyph'],enr:['bonehands','grab','glyph']},
  shirgen:{pats:['combo3','volley','summon','iai'],enr:['volley','iai']},
  kibamu:{pats:['charge','cavalry','spikes','thrust'],enr:['cavalry','charge']},
  sojobo:{pats:['gust','feathers','dive3','glyph','summon'],enr:['dive3','feathers','glyph']},
  raijin:{pats:['drumroll','thundercloud','bolt','drum','glyph'],enr:['drumroll','thundercloud','glyph']},
  karasuchf:{pats:['feathers','murder','dive','cross'],enr:['murder','dive']},
  fujin:{pats:['gust','gale','tornado','wcut'],enr:['gale','tornado']},
  usurper:{pats:['combo3','iai','counter','dash','glyph','flurry'],enr:['execution','glyph','counter','iai']},
  onmyoji:{pats:['talismans','pentagram','clones','glyph','fan'],enr:['pentagram','talismans','glyph']},
  hatachf:{pats:['thrust','shieldwall','shove','sweep'],enr:['shieldwall','thrust']},
  kagero:{pats:['grab','shadowdance','shuriken','clones'],enr:['shadowdance','grab']},
};
for(const k in KITS){const b=BOSSES[k];if(!b)continue;b.pats=KITS[k].pats.slice();b.enr=KITS[k].enr.slice();}
BOSSES.tamamo.spiralKind='fox';BOSSES.guren.spiralKind='petal';BOSSES.onmyoji.spiralKind='ofuda';
BOSSES.shirayuki.glyphs=BOSSES.shirayuki.glyphs||['arc','zz'];BOSSES.goki.glyphs=BOSSES.goki.glyphs||['tri','rev'];
// a short line each lord shouts when they enrage, so the second phase announces itself
const ENRAGE={kagemaru:'You saw my shadow. Now meet the rest.',benkei:'Seven weapons. You have seen two.',tamamo:'Nine tails. Count them.',nue:'The sky is mine.',shirayuki:'Snow hides everything.',kiyohime:'You ran from me once.',
  goki:'The earth splits for me.',enma:'Your sentence is death.',datsueba:'Pay the toll.',umibozu:'The river rises.',yukijo:'Freeze.',guren:'Bloom.',gakiking:'So hungry.',shokujin:'More.',ashura:'Six arms. Three faces. One death.',
  gasha:'Your bones next.',sojobo:'The wind obeys its king.',raijin:'LISTEN.',usurper:'Enough. Kneel.',onmyoji:'Every name I write is a curse.'};

// ---------- per frame: zones, forces, darkness ----------
function updateArena(gdt){
  if(S.dark){S.dark.t-=gdt;if(S.dark.t<=0)S.dark=null;}
  const F=S.force;if(F){F.t-=gdt;if(F.t<=0||(F.owner&&!S.enemies.includes(F.owner))||S.dead>0)S.force=null;
    else if(!S.slide&&!S.leap&&P.dashT<=0){if(F.mode==='pull'){const d=dist(P,F.owner)||1;if(d>F.owner.r+P.r+6){P.x+=(F.owner.x-P.x)/d*F.str*gdt;P.y+=(F.owner.y-P.y)/d*F.str*gdt;}}
      else{P.x+=F.ax*F.str*gdt;P.y+=F.ay*F.str*gdt;}
      if(Math.random()<gdt*30)S.parts.push({x:P.x+rand(-80,80),y:P.y+rand(-60,40),vx:F.mode==='pull'?(F.owner.x-P.x)*0.8:F.ax*300,vy:F.mode==='pull'?(F.owner.y-P.y)*0.8:F.ay*300,life:0.35,max:0.35,size:1,col:F.mode==='pull'?C.water:'#d8e8f0'});}}
  for(const z of S.zones){z.t-=gdt;if(z.armT>0){z.armT-=gdt;continue;}
    if(z.owner&&!S.enemies.includes(z.owner)&&z.kind==='tornado'){z.t=Math.min(z.t,0.3);}
    if(z.chase){const d=dist(P,z)||1;z.x+=(P.x-z.x)/d*z.chase*gdt;z.y+=(P.y-z.y)/d*z.chase*gdt;Object.assign(z,inArena(z,z.r*0.5));if(Math.random()<gdt*30){const a=Math.random()*6.28;S.parts.push({x:z.x+Math.cos(a)*z.r,y:z.y-8+Math.sin(a)*z.r*0.6,vx:-Math.sin(a)*160,vy:Math.cos(a)*80-40,life:0.3,max:0.3,size:1,col:C.wind});}}
    if(z.kind==='fire'&&Math.random()<gdt*12)S.parts.push({x:z.x+rand(-z.r,z.r)*0.7,y:z.y+rand(-z.r,z.r)*0.5,vx:rand(-10,10),vy:rand(-90,-40),life:0.4,max:0.4,size:1,col:Math.random()<0.5?C.fire:'#ffd27a'});
    z.next-=gdt;if(S.dead>0||dist(P,z)>z.r+P.r*0.4)continue;
    if(z.kind==='ice'||z.kind==='web'){P.slowT=Math.max(P.slowT,0.35);}
    else if(z.kind==='ink'){P.slowT=Math.max(P.slowT,0.3);S.inkLock=Math.max(S.inkLock||0,0.6);}
    else if((z.kind==='fire'||z.kind==='tornado')&&z.next<=0&&P.inv<=0&&!CFG.god&&!(P.z>8)){z.next=0.8;hurtPlayer({owner:z.owner||null,hitP:false,zone:true,hazName:null});}
  }
  S.zones=S.zones.filter(z=>z.t>0);
}
function drawArenaGround(){
  for(const z of S.zones){const x=LX(z.x),y=LY(z.y),r=z.r/PX,a=clamp(z.t/0.5,0,1)*(z.armT>0?0.35:1);
    if(z.kind==='fire'){for(let i=0;i<Math.round(r*2.4);i++){const an=i/(r*2.4)*Math.PI*2;pset(x+Math.cos(an)*r,y+Math.sin(an)*r*0.7,Math.floor(S.gt*12+i)%3?C.fire:'#ffd27a',a);}if(z.armT<=0)pdisc(x,y,Math.max(1,r*0.55),'#7a2010',0.35*a);}
    else if(z.kind==='ice'){pdisc(x,y,r,'#bfe8ff',0.32*a);pcircle(x,y,r,'#e8f8ff',0.7*a);}
    else if(z.kind==='web'){for(let k=0;k<6;k++){const an=k*Math.PI/3;pline(x,y,x+Math.cos(an)*r,y+Math.sin(an)*r*0.8,C.web,0.6*a);}pcircle(x,y,r*0.5,C.web,0.5*a);pcircle(x,y,r,C.web,0.5*a);}
    else if(z.kind==='ink'){pdisc(x,y,r,'#120a18',0.6*a);pcircle(x,y,r,'#3a2a4a',0.8*a);}
    else if(z.kind==='tornado'){for(let k=0;k<4;k++){const an=S.gt*9+k*Math.PI/2;for(let j=2;j<r;j+=2)pset(x+Math.cos(an+j*0.25)*j,y-j*0.6+Math.sin(an+j*0.25)*j*0.4,k%2?C.wind:'#ffffff',0.8*a);}}}
  for(const w of S.gwaves){if(!w.line)continue;const R=S.room,thick=3;
    for(let i=-thick;i<=thick;i++){const col=i===-thick||i===thick?'#000':Math.abs(i)<2?'#d8f0ff':w.col;
      if(w.horiz){const X=LX(w.pos)+i;for(let yy=WALL;yy<R.h-WALL;yy+=PX){if(Math.abs(yy-w.gapC)<w.gapW/2)continue;pset(X,LY(yy),col,0.9);}}
      else{const Y=LY(w.pos)+i;for(let xx=WALL;xx<R.w-WALL;xx+=PX){if(Math.abs(xx-w.gapC)<w.gapW/2)continue;pset(LX(xx),Y,col,0.9);}}}}
}
function drawArenaAir(){
  // phantoms: the boss's shadow standing at the start of a dash, then riding it
  for(const s of S.eslashes){if(!s.phantom||s.done)continue;const h=head(s);phantomAt(s.phantom,h.x,h.y,tangentAt(s,s.d).x<0?-1:1,0.75);}
  for(const e of S.enemies)if(e.state==='wind')for(const c of e.cuts)if(c.phantom)phantomAt(c.phantom,c.pts[0].x,c.pts[0].y,c.pts[1].x<c.pts[0].x?-1:1,0.35+0.4*(1-Math.max(0,e.t)/e.wind));
  for(const m of S.tmarks)if(m.kind==='tline'&&m.look)phantomAt(m.look,m.pts[0].x,m.pts[0].y,1,0.5);
}
function phantomAt(look,x,y,face,a){const sp=SPR[look];if(!sp)return;if(!sp.phR){sp.phR=tinted(sp.r[3]||sp.r[0],PHC);sp.phL=flipped(sp.phR);}flush();const fl=face<0,ax=fl?sp.w-1-sp.ax:sp.ax;lx.globalAlpha=a;lx.drawImage(fl?sp.phL:sp.phR,Math.round(LX(x)-ax),Math.round(LY(y+12)-sp.ay));lx.globalAlpha=1;}
function drawArenaDark(){
  if(!S.dark)return;const k=clamp(Math.min(S.dark.t,S.dark.max-S.dark.t)/0.5,0,1)*0.86,X=LX(P.x),Y=LY(P.y-14);flush();
  const g=lx.createRadialGradient(X,Y,18,X,Y,70);g.addColorStop(0,'rgba(4,2,8,0)');g.addColorStop(1,`rgba(4,2,8,${k})`);lx.fillStyle=g;lx.fillRect(0,0,LW,LH);
}
function updateLineWaves(gdt){
  for(const w of S.gwaves){if(!w.line)continue;w.pos+=w.v*gdt;const R=S.room;
    if(w.pos<WALL-20||w.pos>(w.horiz?R.w:R.h)-WALL+20){w.r=w.max+1;continue;}
    const pc=w.horiz?P.x:P.y,oc=w.horiz?P.y:P.x;
    if(!w.hit&&S.dead<=0&&Math.abs(pc-w.pos)<12+P.r*0.5&&Math.abs(oc-w.gapC)>w.gapW/2-P.r*0.5&&P.inv<=0&&!CFG.god&&!(P.z>8)){w.hit=true;hurtPlayer({owner:w.owner,hitP:false,wave:true});if(w.horiz)P.kx+=Math.sign(w.v)*500;else P.ky+=Math.sign(w.v)*500;}
    if(Math.random()<gdt*40){const q=w.horiz?{x:w.pos,y:rand(WALL,R.h-WALL)}:{x:rand(WALL,R.w-WALL),y:w.pos};if(Math.abs((w.horiz?q.y:q.x)-w.gapC)>w.gapW/2)S.parts.push({x:q.x,y:q.y,vx:(w.horiz?Math.sign(w.v)*120:rand(-30,30)),vy:(w.horiz?rand(-30,30):Math.sign(w.v)*120)-30,life:0.35,max:0.35,size:2,col:Math.random()<0.5?'#d8f0ff':C.water});}
  }
}

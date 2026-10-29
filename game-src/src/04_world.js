// ================= world: floors of rooms, biome art, lights, ambient =================
const ROOM_SIZES={s:[900,600],w:[1400,600],t:[900,920],b:[1300,880],hub:[1600,1000]};
const DIRS={n:[0,-1],s:[0,1],w:[-1,0],e:[1,0]},OPP={n:'s',s:'n',w:'e',e:'w'};
const rkey=(x,y)=>x+','+y;
function curBiome(){return S.floor?S.floor.biome:BIOMES[0];}


// ---------- room obstacles: walls, breakable crates, pits (block walking only), timed traps ----------
// ten floors per realm: 1 store, 5 mini boss + rest place, 10 the realm's lord
const FPR=10,SPB=()=>FPR;
const totalFloors=()=>S.gm&&S.gm.id==='infinite'?1e9:BIOMES.length*FPR;
const countsDepth=()=>!S.gm||['story','hell','infinite'].includes(S.gm.id);
const floorKind=st=>st===1?'store':st===5?'mini':st===FPR?'lord':'combat';
function flName(){const f=S.floor;if(!f||f.kind==='hub')return'Shrine';if(f.kind==='prologue')return'The last night';if(f.kind==='arena')return S.gm&&S.gm.id==='waves'?`Wave ${S.gm.wave}`:'Arena';return`${Math.ceil(f.n/FPR)}-${f.stage}`;}
function rectHit(r,x,y,pad){return x>r.x-pad&&x<r.x+r.w+pad&&y>r.y-pad&&y<r.y+r.h+pad;}
function rectsOverlap(a,b){return a.x<b.x+b.w&&a.x+a.w>b.x&&a.y<b.y+b.h&&a.y+a.h>b.y;}
function segRect(a,b,r){let t0=0,t1=1;const dx=b.x-a.x,dy=b.y-a.y;
  for(const [p,q] of [[-dx,a.x-r.x],[dx,r.x+r.w-a.x],[-dy,a.y-r.y],[dy,r.y+r.h-a.y]]){
    if(Math.abs(p)<1e-9){if(q<0)return null;}else{const t=q/p;if(p<0){if(t>t1)return null;if(t>t0)t0=t;}else{if(t<t0)return null;if(t<t1)t1=t;}}}
  return t0;}
const solids=(holes,crates=true)=>(S.room&&S.room.obs||[]).filter(o=>!o.dead&&(o.type==='wall'||(crates&&o.type==='crate')||(holes&&o.type==='hole')));
function blockedAt(x,y,r,holes=true){for(const o of solids(holes))if(rectHit(o,x,y,r))return true;return false;}
// push a circle out of solid rects (walls, crates, optionally pits)
function pushOut(o,rad,holes){
  const R=S.room;if(!R||!R.obs||!R.obs.length)return false;let hit=false;
  for(const b of R.obs){if(b.dead||(b.type==='hole'&&!holes))continue;
    const qx=clamp(o.x,b.x,b.x+b.w),qy=clamp(o.y,b.y,b.y+b.h),dx=o.x-qx,dy=o.y-qy,d=Math.hypot(dx,dy);
    if(d>=rad)continue;hit=true;
    if(d>0.001){o.x=qx+dx/d*rad;o.y=qy+dy/d*rad;}
    else{const l=o.x-b.x,r=b.x+b.w-o.x,t=o.y-b.y,bt=b.y+b.h-o.y,m=Math.min(l,r,t,bt);if(m===l)o.x=b.x-rad;else if(m===r)o.x=b.x+b.w+rad;else if(m===t)o.y=b.y-rad;else o.y=b.y+b.h+rad;}}
  return hit;
}
// cut a polyline at the first wall it runs into (rects that contain the start point are ignored)
function clipPts(pts,types,pad){
  const R=S.room;if(!R||!R.obs||pts.length<2)return{pts,hit:null};
  const rs=R.obs.filter(o=>!o.dead&&types.includes(o.type)).map(o=>({x:o.x-pad,y:o.y-pad,w:o.w+2*pad,h:o.h+2*pad})).filter(r=>!rectHit(r,pts[0].x,pts[0].y,0));
  if(!rs.length)return{pts,hit:null};
  const out=[pts[0]];
  for(let i=1;i<pts.length;i++){const a=out[out.length-1],b=pts[i];let best=null;for(const r of rs){const t=segRect(a,b,r);if(t!==null&&(best===null||t<best))best=t;}
    if(best!==null){const t=Math.max(0,best-0.02),q={x:a.x+(b.x-a.x)*t,y:a.y+(b.y-a.y)*t};out.push(q);return{pts:out,hit:q};}
    out.push(b);}
  return{pts:out,hit:null};
}
function freeSpot(R,x,y,r){if(!R.obs||!R.obs.length)return{x,y};for(let k=0;k<80;k++){const a=k*2.4,d=k*9,p=inArena({x:x+Math.cos(a)*d,y:y+Math.sin(a)*d},r+4);if(!blockedAt(p.x,p.y,r+4))return p;}return{x,y};}
function doorZones(R){const W=R.w,H=R.h,cx=W/2,cy=H/2,z=[];
  if(R.doors.n)z.push({x:cx-80,y:0,w:160,h:WALL+150});if(R.doors.s)z.push({x:cx-80,y:H-WALL-150,w:160,h:WALL+150});
  if(R.doors.w)z.push({x:0,y:cy-80,w:WALL+160,h:160});if(R.doors.e)z.push({x:W-WALL-160,y:cy-80,w:WALL+160,h:160});
  if(['start','boss','gate','mini','rest','store','hub'].includes(R.type))z.push({x:cx-90,y:cy-60,w:180,h:200});return z;}
function genObstacles(R){
  R.obs=[];R.haz=[];
  const ok=R.type==='combat'||((R.type==='boss'||R.type==='mini')&&Math.random()<0.6)||(R.type==='gate'&&Math.random()<0.5);if(!ok)return;
  const W=R.w,H=R.h,iw=W-2*WALL,ih=H-2*WALL,cx=W/2,cy=H/2,d=S.floor.diff||1;
  const add=(type,x,y,w,h)=>R.obs.push({type,x:Math.round(x),y:Math.round(y),w:Math.round(w),h:Math.round(h),hp:type==='crate'?1:0,uid:Math.random()});
  const crates=(x,y,n)=>{for(let i=0;i<n;i++){const c=inArena({x:x+ri(-2,2)*42,y:y+ri(-1,1)*42},40);if(!R.obs.some(o=>rectHit(o,c.x,c.y,30)))add('crate',c.x-19,c.y-19,38,38);}};
  if(R.type==='boss'||R.type==='gate'||R.type==='mini'){const ox=iw*0.27,oy=ih*0.27;for(const [sx,sy] of [[-1,-1],[1,-1],[-1,1],[1,1]])add('wall',cx+sx*ox-28,cy+sy*oy-28,56,56);}
  else{
    const PATS={
      pillars:()=>{const ox=iw*0.22,oy=ih*0.22;for(const [sx,sy] of [[-1,-1],[1,-1],[-1,1],[1,1]])add('wall',cx+sx*ox-26,cy+sy*oy-26,52,52);},
      twin:()=>{const h=ih*0.36;for(const sx of [-1,1])add('wall',cx+sx*iw*0.26-24,cy-h/2,48,h);},
      pit:()=>add('hole',cx-iw*0.13,cy-ih*0.14,iw*0.26,ih*0.28),
      pits:()=>{const h=ih*0.34;for(const sx of [-1,1])add('hole',cx+sx*iw*0.3-iw*0.07,cy-h/2,iw*0.14,h);},
      corners:()=>{for(const [sx,sy] of [[-1,-1],[1,-1],[-1,1],[1,1]]){const x=cx+sx*iw*0.32,y=cy+sy*ih*0.3;add('wall',x-(sx<0?0:120),y-20,120,40);add('wall',x-20,y-(sy<0?0:110),40,110);}},
      bars:()=>{const w=iw*0.3;for(const sy of [-1,1])add('wall',cx-w/2,cy+sy*ih*0.27-20,w,40);},
      moat:()=>{const w=iw*0.34,h=ih*0.1;add('hole',cx-w/2,cy-ih*0.26-h/2,w,h);add('hole',cx-w/2,cy+ih*0.26-h/2,w,h);},
      scatter:()=>{for(let i=0;i<ri(3,5);i++){const x=rand(WALL+90,W-WALL-130),y=rand(WALL+90,H-WALL-130);add(Math.random()<0.65?'wall':'hole',x,y,ri(1,2)*40,ri(1,2)*40);}},
      ponds:()=>{for(let i=0;i<ri(2,3);i++){const x=rand(WALL+100,W-WALL-220),y=rand(WALL+90,H-WALL-180);add('hole',x,y,ri(2,3)*40,ri(1,2)*40);}}
    };
    const keys=Object.keys(PATS),n=Math.random()<0.2?0:Math.random()<0.3?2:1;
    for(const k of shuffle(keys.slice()).slice(0,n))PATS[k]();
    if(Math.random()<0.7)crates(rand(WALL+80,W-WALL-80),rand(WALL+80,H-WALL-80),ri(2,5));
    if(Math.random()<0.25)crates(rand(WALL+80,W-WALL-80),rand(WALL+80,H-WALL-80),ri(1,3));
    // timed traps, more of them deeper down
    if(Math.random()<0.25+0.1*d){const per=rand(2.6,3.4),base=Math.random()*per,x0=rand(WALL+80,W-WALL-260),y0=rand(WALL+80,H-WALL-160),horiz=Math.random()<0.6,len=ri(3,5);
      for(let i=0;i<len;i++)R.haz.push({x:x0+(horiz?i*40:0),y:y0+(horiz?0:i*40),w:40,h:40,per,off:base+i*0.12,id:0,uid:Math.random(),act:false});}
    if(Math.random()<0.12+0.06*d){const per=rand(2.4,3.2),x0=rand(WALL+80,W-WALL-160),y0=rand(WALL+80,H-WALL-160);for(let i=0;i<4;i++)R.haz.push({x:x0+(i%2)*40,y:y0+Math.floor(i/2)*40,w:40,h:40,per,off:Math.random()*per,id:0,uid:Math.random(),act:false});}
  }
  // keep doorways clear, keep everything inside, and make sure every door and most of the floor is reachable
  const zones=doorZones(R),inside=o=>o.x>=WALL+20&&o.y>=WALL+20&&o.x+o.w<=W-WALL-20&&o.y+o.h<=H-WALL-20;
  R.obs=R.obs.filter(o=>inside(o)&&!zones.some(z=>rectsOverlap(o,z)));
  R.haz=R.haz.filter(h=>inside(h)&&!zones.some(z=>rectsOverlap(h,z))&&!R.obs.some(o=>rectsOverlap(o,h)));
  for(let tries=0;tries<12&&!reachableOK(R);tries++){const bl=R.obs.filter(o=>o.type!=='crate');if(!bl.length)break;R.obs.splice(R.obs.indexOf(pick(bl)),1);}
}
function reachableOK(R){
  const G=20,cols=Math.ceil(R.w/G),rows=Math.ceil(R.h/G),blk=new Uint8Array(cols*rows),seen=new Uint8Array(cols*rows);
  for(let j=0;j<rows;j++)for(let i=0;i<cols;i++){const x=i*G+G/2,y=j*G+G/2;if(x<WALL+12||y<WALL+12||x>R.w-WALL-12||y>R.h-WALL-12){blk[j*cols+i]=1;continue;}
    for(const o of R.obs)if(o.type!=='crate'&&rectHit(o,x,y,12)){blk[j*cols+i]=1;break;}}
  const start=Math.floor(R.h/2/G)*cols+Math.floor(R.w/2/G);let s0=start;if(blk[s0]){s0=blk.findIndex(v=>!v);if(s0<0)return false;}
  const q=[s0];seen[s0]=1;let n=0;while(q.length){const c=q.pop();n++;const i=c%cols,j=(c/cols)|0;for(const [di,dj] of [[1,0],[-1,0],[0,1],[0,-1]]){const ii=i+di,jj=j+dj;if(ii<0||jj<0||ii>=cols||jj>=rows)continue;const k=jj*cols+ii;if(!blk[k]&&!seen[k]){seen[k]=1;q.push(k);}}}
  const free=blk.reduce((a,v)=>a+(v?0:1),0);
  const doorPts=[];if(R.doors.n)doorPts.push([R.w/2,WALL+34]);if(R.doors.s)doorPts.push([R.w/2,R.h-WALL-34]);if(R.doors.w)doorPts.push([WALL+34,R.h/2]);if(R.doors.e)doorPts.push([R.w-WALL-34,R.h/2]);
  for(const [x,y] of doorPts){const k=Math.floor(y/G)*cols+Math.floor(x/G);if(!seen[k])return false;}
  return n>=free*0.92;
}
// pre-rendered art for walls and crates, per realm style
function paintObstacle(o){
  const A=curBiome().art,st=A.wall,w=Math.round(o.w/PX),h=Math.round(o.h/PX),rise=o.type==='crate'?4:{bamboo:16,palisade:14,screen:14}[st]||10,s=SPC(w+2,h+rise+2),{R,P}=s,X=1,Y=1;
  if(o.type==='crate'){
    const pal=A.crate;
    R(X,Y+rise,w,h,pal[1]);R(X,Y,w,h,pal[0]);R(X,Y,w,1,pal[2]);R(X,Y,1,h,pal[2]);for(let i=0;i<Math.max(w,h);i++){P(X+Math.round(i*w/Math.max(w,h)),Y+Math.round(i*h/Math.max(w,h)),pal[1]);P(X+w-1-Math.round(i*w/Math.max(w,h)),Y+Math.round(i*h/Math.max(w,h)),pal[1]);}
    R(X,Y+h,w,rise,pal[1]);R(X,Y+h,w,1,'#000');for(let x=X+2;x<X+w;x+=4)R(x,Y+h+1,1,rise-1,shade(pal[1],0.8));
  }else if(st==='bamboo'){
    R(X,Y+rise,w,h,'#1a2412');for(let x=X;x<X+w;x+=3){const c=pick([['#5a8a3a','#3a6a2a','#7aaa4a'],['#4a7a32','#2e5a22','#6a9a42']]),top=Y+ri(0,4);R(x,top,3,h+rise-top+Y,c[0]);R(x,top,1,h+rise-top+Y,c[1]);R(x+2,top,1,h+rise-top+Y,c[2]);for(let y=top+ri(3,7);y<Y+h+rise;y+=ri(7,10))R(x,y,3,1,'#2a4a1a');P(x+1,top-1,'#7aaa4a');P(x+2,top-2,'#5a8a3a');}
  }else if(st==='palisade'){
    const pal=A.wpal;R(X,Y+rise,w,h,pal[1]);for(let x=X;x<X+w;x+=4){const top=Y+ri(0,3);R(x,top+2,4,h+rise-top,pal[0]);R(x,top+2,1,h+rise-top,pal[3]);R(x+3,top+2,1,h+rise-top,pal[2]);P(x+1,top,pal[2]);P(x+2,top,pal[2]);P(x+1,top+1,pal[0]);P(x+2,top+1,pal[0]);}
    R(X,Y+rise+3,w,2,'#2a1a10');R(X,Y+rise+h-5,w,2,'#2a1a10');
  }else if(st==='screen'){
    const pal=A.wpal;R(X,Y,w,rise,pal[1]);R(X,Y+rise,w,h,pal[0]);R(X,Y,w,1,pal[2]);R(X+2,Y+rise+2,w-4,h-4,pal[3]);for(let x=X+2;x<X+w-2;x+=6)R(x,Y+rise+2,1,h-4,'#c8bca0');for(let y=Y+rise+2;y<Y+rise+h-2;y+=6)R(X+2,y,w-4,1,'#c8bca0');
    R(X,Y+rise,w,1,pal[2]);R(X,Y+rise+h-1,w,1,pal[2]);R(X,Y+rise,1,h,pal[2]);R(X+w-1,Y+rise,1,h,pal[2]);for(let x=X+1;x<X+w;x+=8)R(x,Y+2,4,rise-4,shade(pal[1],1.4));
  }else if(st==='ice'){
    const pal=A.wpal;R(X,Y,w,rise,pal[2]);R(X,Y+rise,w,h,pal[0]);R(X,Y+rise,2,h,pal[1]);R(X,Y,w,1,'#ffffff');
    for(let k=0;k<Math.max(2,w/10);k++){let x=X+ri(2,w-3),y=Y+rise+ri(0,2);for(let i=0;i<h;i+=1){P(x,y,pal[1]);y++;x+=ri(-1,1);if(y>=Y+rise+h-1)break;}}
    for(let i=0;i<w*h/30;i++)P(X+ri(0,w-1),Y+ri(0,rise+h-1),'#f4fbff');for(let x=X;x<X+w;x+=3)P(x,Y+rise+h-1+((x/3)%2),pal[1]);
  }else if(st==='stump'){
    const pal=A.wpal;R(X,Y+rise,w,h,pal[0]);R(X,Y,w,rise,pal[2]);for(let y=Y+rise;y<Y+rise+h;y+=3)for(let x=X+((y/3)%2?2:0);x<X+w;x+=5)R(x,y,3,1,pal[1]);
    for(let k=0;k<Math.max(1,w/14);k++){const x=X+ri(1,w-2);for(let i=0;i<5;i++)P(x+ri(-1,1),Y+rise+h+i-2,pal[1]);}for(let i=0;i<w/6;i++)P(X+ri(0,w-1),Y+ri(0,rise-1),pal[3]);
  }else if(st==='rock'){
    const pal=A.wpal;R(X,Y,w,rise,pal[2]);R(X,Y+rise,w,h,pal[0]);R(X,Y,w,1,shade(pal[2],1.2));
    for(let i=0;i<w*h/9;i++)P(X+ri(0,w-1),Y+rise+ri(0,h-1),pick([pal[1],pal[3],pal[0],pal[2]]));for(let i=0;i<w*rise/8;i++)P(X+ri(0,w-1),Y+ri(0,rise-1),pick([pal[0],shade(pal[2],1.15)]));
    if(curBiome().key==='peaks')for(let i=0;i<w/5;i++)P(X+ri(0,w-1),Y+ri(0,2),'#5a7a3a');else for(let i=0;i<w/4;i++)P(X+ri(0,w-1),Y+rise+h-1-ri(0,2),'#2a4a4a');
  }else{
    const pal=A.wpal;
    R(X,Y,w,rise,pal[2]);R(X,Y+rise,w,h,pal[0]);R(X,Y,w,1,shade(pal[2],1.2));
    if(st==='plank'){for(let x=X+3;x<X+w;x+=6)R(x,Y+rise,1,h,pal[3]);R(X,Y+rise,w,2,pal[1]);R(X,Y+rise+h-3,w,3,pal[3]);for(let x=X+1;x<X+w;x+=8)R(x,Y+1,5,rise-2,shade(pal[2],0.9));}
    else if(st==='brick'){for(let y=Y+rise;y<Y+rise+h;y+=6){R(X,y,w,1,pal[3]);for(let x=X+((y/6)%2?3:0);x<X+w;x+=8)R(x,y,1,6,pal[3]);}for(let i=0;i<w*h/40;i++)P(X+ri(0,w-1),Y+ri(0,rise+h-1),Math.random()<0.5?'#3e5a3a':pal[1]);}
    else{for(let i=0;i<w*h/10;i++)P(X+ri(0,w-1),Y+rise+ri(0,h-1),pick([pal[1],pal[3],pal[2]]));for(let k=0;k<Math.max(1,w/12);k++){let x=X+ri(2,w-3),y=Y+rise+ri(1,3);for(let i=0;i<h;i+=1){P(x,y,i%3?'#a8321a':'#ff6a2a');y++;x+=ri(-1,1);if(y>=Y+rise+h)break;}}}
  }
  if(o.type!=='crate')R(X,Y+rise+h-1,w,1,'#000');
  outlineCanvas(s.c);o.img=s.c;o.rise=rise;
}
function paintHole(R,o,F){
  const A=curBiome().art,st=A.hole,pal=A.hpal,x=Math.round(o.x/PX),y=Math.round(o.y/PX),w=Math.round(o.w/PX),h=Math.round(o.h/PX);
  F(x-1,y-1,w+2,h+2,pal[2]);F(x,y,w,h,pal[0]);
  if(st==='lava'){for(let i=0;i<w*h/6;i++)F(x+ri(0,w-1),y+ri(0,h-1),1,1,pick(['#ffb04a','#c8321a','#ff7a2a','#8a1a0a']));R.lights.push({kind:'lava',x:o.x+o.w/2,y:o.y+o.h/2,r:Math.max(o.w,o.h)*0.9,col:'255,90,30',ph:Math.random()*9});}
  else if(st==='pit'){F(x,y,w,3,pal[1]);for(let i=0;i<w;i+=5)F(x+i,y+h-ri(1,3),ri(2,4),3,'#2a1e21');for(let i=0;i<h;i+=7)F(x+w-ri(1,3),y+i,3,ri(2,4),'#2a1e21');}
  else if(st==='ice'){F(x,y,w,3,pal[1]);for(let i=0;i<w;i+=3){F(x+i,y,1,ri(2,5),pal[2]);F(x+i+1,y,1,ri(1,3),'#d8ecf8');}for(let i=0;i<w*h/40;i++)F(x+ri(1,w-2),y+ri(4,h-2),1,1,'#2a4a6a');}
  else if(st==='bones'){F(x,y,w,3,pal[1]);for(let i=0;i<w*h/45;i++){const bx=x+ri(2,w-5),by=y+ri(4,h-3);F(bx,by,3,1,'#c8bca0');F(bx,by-1,1,1,'#c8bca0');F(bx+2,by+1,1,1,'#c8bca0');}}
  else if(st==='trench'){F(x,y,w,2,pal[1]);for(let i=2;i<w;i+=6){F(x+i,y+ri(2,h-6),1,4,'#6a4a2a');F(x+i,y+2,1,2,'#8a6a3a');}for(let i=0;i<w*h/50;i++)F(x+ri(1,w-3),y+ri(3,h-2),ri(2,4),1,pal[1]);}
  else if(st==='sky'){F(x,y,w,h,pal[0]);for(let i=0;i<w*h/30;i++){const cx=x+ri(0,w-4),cy=y+ri(2,h-2);F(cx,cy,ri(3,7),1,pal[1]);}F(x,y,w,2,'#3a3a34');F(x,y+2,w,1,'#6a8aa8');}
  else if(st==='pond'){F(x,y,w,2,pal[1]);for(let i=0;i<w*h/60;i++)F(x+ri(1,w-3),y+ri(3,h-2),ri(2,4),1,pal[1]);for(let i=0;i<Math.max(1,w*h/400);i++){const lx=x+ri(3,w-6),ly=y+ri(4,h-4);F(lx,ly,4,2,'#4a8a3a');F(lx+1,ly,1,1,'#ff9aa8');}if(w>14){const kx=x+ri(3,w-8),ky=y+ri(4,h-4);F(kx,ky,4,1,'#ff8a3a');F(kx+1,ky+1,2,1,'#ffffff');}}
  else{F(x,y,w,2,pal[1]);for(let i=0;i<w*h/50;i++)F(x+ri(1,w-3),y+ri(3,h-2),ri(2,4),1,pal[1]);if(curBiome().key==='bamboo'&&w>12){const lx=x+ri(3,w-6),ly=y+ri(4,h-4);F(lx,ly,4,2,'#4a8a3a');F(lx+1,ly,1,1,'#7aba5a');}
    if(curBiome().key==='river'){for(let i=0;i<w*h/120;i++){const lx=x+ri(2,w-5),ly=y+ri(3,h-3);F(lx,ly,3,1,'#5a9aa0');}if(Math.random()<0.5)R.lights.push({kind:'lava',x:o.x+o.w/2,y:o.y+o.h/2,r:Math.max(o.w,o.h)*0.6,col:'90,200,180',ph:Math.random()*9});}}
}

// ---------- floors ----------
function roomLayout(target){
  let best=null;
  for(let guard=0;guard<80;guard++){
    const rooms=new Map();rooms.set(rkey(0,0),{gx:0,gy:0,type:'start'});const list=[[0,0]];let g=0;
    while(rooms.size<target&&g++<600){const [bx,by]=pick(list),[dx,dy]=pick(Object.values(DIRS)),nx=bx+dx,ny=by+dy;
      if(rooms.has(rkey(nx,ny))||Math.abs(nx)>3||Math.abs(ny)>3)continue;
      const nb=Object.values(DIRS).filter(([a,b])=>rooms.has(rkey(nx+a,ny+b))).length;if(nb>1&&Math.random()<0.85)continue;
      rooms.set(rkey(nx,ny),{gx:nx,gy:ny,type:'combat'});list.push([nx,ny]);}
    const deg=r=>Object.values(DIRS).filter(([a,b])=>rooms.has(rkey(r.gx+a,r.gy+b))).length;
    const ends=[...rooms.values()].filter(r=>r.type!=='start'&&deg(r)===1).length;
    if(!best||ends>best.ends)best={rooms,ends};if(ends>=2&&rooms.size>=target)break;
  }
  return best.rooms;
}
function genHub(){
  const r={gx:0,gy:0,type:'hub'},rooms=new Map([[rkey(0,0),r]]);
  Object.assign(r,{size:'hub',w:ROOM_SIZES.hub[0],h:ROOM_SIZES.hub[1],doors:{},visited:false,seen:true,cleared:true,obs:[],haz:[],built:false,objs:[],pools:[],waves:null,enc:null,dist:0});
  return{n:0,realm:-1,biome:HUB_BIOME,stage:0,kind:'hub',bossStage:false,diff:1,rooms,start:r,boss:r,gateOpen:true};
}
function genFloor(n){
  const inf=S.gm&&S.gm.id==='infinite',bi=inf?Math.floor((n-1)/FPR)%BIOMES.length:clamp(Math.floor((n-1)/FPR),0,BIOMES.length-1),biome=BIOMES[bi],stage=(n-1)%FPR+1,kind=floorKind(stage),diff=(inf?Math.floor((n-1)/FPR):bi)+1+(stage-1)*0.11;
  const rooms=kind==='store'?new Map([[rkey(0,0),{gx:0,gy:0,type:'store'}]]):roomLayout(kind==='combat'?4+(stage>5?1:0)+(bi>=4?1:0)+ri(0,1):kind==='mini'?4:3);
  const distm=new Map([[rkey(0,0),0]]),q=[[0,0]];
  while(q.length){const [x,y]=q.shift();for(const [dx,dy] of Object.values(DIRS)){const k=rkey(x+dx,y+dy);if(rooms.has(k)&&!distm.has(k)){distm.set(k,distm.get(rkey(x,y))+1);q.push([x+dx,y+dy]);}}}
  const deg=r=>Object.values(DIRS).filter(([a,b])=>rooms.has(rkey(r.gx+a,r.gy+b))).length;
  const all=[...rooms.values()];all.forEach(r=>r.dist=distm.get(rkey(r.gx,r.gy))||0);
  let boss=null;
  if(kind!=='store'){
    let ends=all.filter(r=>r.type!=='start'&&deg(r)===1).sort((a,b)=>b.dist-a.dist);
    boss=ends[0]||all.filter(r=>r.type!=='start').sort((a,b)=>b.dist-a.dist)[0];
    boss.type=kind==='combat'?'gate':kind==='mini'?'mini':'boss';ends=ends.filter(r=>r!==boss);
    if(kind==='mini'){ // the rest place opens up beyond the mini boss
      const free=Object.values(DIRS).map(([dx,dy])=>({x:boss.gx+dx,y:boss.gy+dy})).filter(p=>!rooms.has(rkey(p.x,p.y))&&Object.values(DIRS).filter(([a,b])=>rooms.has(rkey(p.x+a,p.y+b))).length===1);
      if(free.length){const p=pick(free),rr={gx:p.x,gy:p.y,type:'rest',dist:boss.dist+1};rooms.set(rkey(p.x,p.y),rr);all.push(rr);}else boss.restInside=true;
    }
    if(kind==='combat'){
      const combats=()=>all.filter(r=>r.type==='combat').length,takeEnd=()=>ends.length&&combats()>2?ends.splice(Math.floor(Math.random()*ends.length),1)[0]:null;
      // Enkū's shrine: a quiet side room, from the third level of each realm on
      if(stage>=3&&!(S.gm&&S.gm.arena)&&Math.random()<0.25){let hm=takeEnd();
        if(!hm){for(const r of shuffle(all.filter(x=>x.type==='combat'))){const free=Object.values(DIRS).map(([dx,dy])=>({x:r.gx+dx,y:r.gy+dy})).filter(q=>!rooms.has(rkey(q.x,q.y))&&Object.values(DIRS).filter(([a,b])=>rooms.has(rkey(q.x+a,q.y+b))).length===1);
          if(free.length){const q=pick(free);hm={gx:q.x,gy:q.y,dist:r.dist+1};rooms.set(rkey(q.x,q.y),hm);all.push(hm);break;}}}
        if(hm)hm.type='hermit';}
      if(Math.random()<0.55){const tr=takeEnd();if(tr)tr.type='treasure';}
      if(Math.random()<0.22){const du=takeEnd();if(du)du.type='duel';}
      if(Math.random()<0.18){const sh=takeEnd();if(sh)sh.type='shop';}
      const pool=shuffle(all.filter(r=>r.type==='combat'&&r.dist>=1));if(pool.length>2&&Math.random()<0.55)pool[0].type='event';
    }
  }
  for(const r of all){
    r.size=['boss','mini','duel','rest','store'].includes(r.type)?'b':r.type==='gate'?'w':r.type==='combat'?pick(['s','s','w','t','b']):'s';
    [r.w,r.h]=ROOM_SIZES[r.size];
    r.doors={};for(const d in DIRS){const [dx,dy]=DIRS[d];if(rooms.has(rkey(r.gx+dx,r.gy+dy)))r.doors[d]=true;}
    Object.assign(r,{visited:false,seen:false,cleared:!['combat','boss','mini'].includes(r.type),obs:[],haz:[],built:false,objs:[],pools:[],waves:null,enc:null});
  }
  return{n,realm:bi,biome,stage,kind,bossStage:kind==='lord',diff,rooms,start:rooms.get(rkey(0,0)),boss:boss||rooms.get(rkey(0,0)),gateOpen:kind!=='combat'};
}
function roomAt(gx,gy){return S.floor.rooms.get(rkey(gx,gy));}
function neighbor(R,d){const [dx,dy]=DIRS[d];return roomAt(R.gx+dx,R.gy+dy);}

// ---------- room painting (low-res, one canvas per room) ----------
function buildRoom(R){
  const FW=R.w/PX,FH=R.h/PX;
  R.floorCv=mk(FW,FH);R.decalCv=mk(FW,FH);R.dctx=R.decalCv.getContext('2d');R.lights=[];R.deco=[];
  const g=R.floorCv.getContext('2d'),F=(x,y,w,h,c)=>{g.fillStyle=c;g.fillRect(Math.round(x),Math.round(y),Math.round(w),Math.round(h));};
  const A=curBiome().art;
  ({dojo:paintDojo,bamboo:paintBamboo,temple:paintTemple,hell:paintHell,river:paintRiver,ice:paintIce,gakido:paintGakido,ashura:paintAshura,peaks:paintPeaks,castle:paintCastle,hub:paintHub})[A.paint](R,F,FW,FH);
  if(CFG.details!==false)try{paintDetails(R,F,FW,FH,R.type==='hub'?'hub':A.paint);}catch(_){}
  genObstacles(R);for(const o of R.obs){if(o.type==='hole')paintHole(R,o,F);else paintObstacle(o);}
  // door openings
  const dh=Math.round(DW*2/PX),frame=A.frame;
  for(const d in R.doors){
    if(d==='n'){F(FW/2-dh/2-2,0,dh+4,WP,frame);F(FW/2-dh/2,0,dh,WP,'#060405');}
    if(d==='s'){F(FW/2-dh/2-2,FH-WP,dh+4,WP,frame);F(FW/2-dh/2,FH-WP,dh,WP,'#060405');}
    if(d==='w'){F(0,FH/2-dh/2-2,WP,dh+4,frame);F(0,FH/2-dh/2,WP,dh,'#060405');}
    if(d==='e'){F(FW-WP,FH/2-dh/2-2,WP,dh+4,frame);F(FW-WP,FH/2-dh/2,WP,dh,'#060405');}
  }
  // room-type floor marks
  if(R.type==='treasure'){const cx=FW/2,cy=FH/2;g.strokeStyle='rgba(232,193,90,0.25)';g.lineWidth=1;for(const r of [26,34])for(let a=0;a<64;a++){const t=a/64*Math.PI*2;if(a%2)F(cx+Math.cos(t)*r,cy+Math.sin(t)*r*0.6,1,1,'rgba(232,193,90,0.35)');}}
  if(R.type==='boss'||R.type==='mini'){const cx=FW/2,cy=FH/2,rr=R.type==='mini'?0.7:1;for(let a=0;a<140;a++){const t=a/140*Math.PI*2;F(cx+Math.cos(t)*90*rr,cy+Math.sin(t)*60*rr,1,1,'rgba(184,20,42,0.45)');if(a%3===0)F(cx+Math.cos(t)*70*rr,cy+Math.sin(t)*46*rr,1,1,'rgba(184,20,42,0.3)');}}
  if(R.type==='gate'){const cx=FW/2,cy=FH/2;for(let a=0;a<90;a++){const t=a/90*Math.PI*2;F(cx+Math.cos(t)*60,cy-12+Math.sin(t)*34,1,1,'rgba(236,228,215,0.25)');}}
  if(R.type==='duel'){const x0=FW/2-110,y0=FH/2-70,w=220,h=140;for(let x=x0;x<=x0+w;x++){if(x%2)continue;F(x,y0,1,1,'#c8a868');F(x,y0+h,1,1,'#c8a868');}for(let y=y0;y<=y0+h;y++){if(y%2)continue;F(x0,y,1,1,'#c8a868');F(x0+w,y,1,1,'#c8a868');}
    for(let x=x0+10;x<x0+w;x+=22){F(x,y0+1,1,3,'#ece4d7');F(x+1,y0+3,1,2,'#ece4d7');}F(FW/2-1,FH/2-20,2,8,'rgba(236,228,215,0.25)');F(FW/2-1,FH/2+12,2,8,'rgba(236,228,215,0.25)');}
  if(R.type==='shop'){for(const [x,y] of [[-120,20],[-40,20],[40,20],[120,20]]){const X=FW/2+x/PX,Y=FH/2+y/PX;F(X-14,Y-6,28,14,'#4a141c');F(X-14,Y-6,28,1,'#6a2a30');F(X-14,Y+7,28,1,'#2a0a10');}}
  R.built=true;
}
function wallLights(R,kind,col,r){
  const FW=R.w,FH=R.h,lights=[];
  for(let x=170;x<FW-100;x+=330){if(Math.abs(x-FW/2)<90)continue;lights.push({kind,x,y:WALL+18,r,col,ph:Math.random()*9,fx:x,fy:7*PX,wall:'n'});}
  for(let y=200;y<FH-120;y+=300){if(Math.abs(y-FH/2)<90)continue;for(const x of [WALL*0.5,FW-WALL*0.5])lights.push({kind:'sconce',x,y,r:r*0.8,col,ph:Math.random()*9,fx:x,fy:y-4*PX});}
  R.lights.push(...lights);
}
function paintDojo(R,F,FW,FH){
  F(0,0,FW,FH,'#120c0e');
  const planks=['#2a1e21','#2f2226','#271b1e','#2c2023','#251a1d'];
  for(let y=WP,row=0;y<FH-WP;y+=8,row++){
    let x=WP-((row*23)%37);
    while(x<FW-WP){const len=46+((row*13+x*7)%34),x0=Math.max(x,WP),x1=Math.min(x+len,FW-WP);
      F(x0,y,x1-x0,8,planks[(row*3+((x/7)|0))%planks.length]);F(x0,y,1,8,'#1a1114');if(((row+x)%5)===0)F(x0+4,y+3,1,1,'#3a2a2c');x+=len;}
    F(WP,y+7,FW-2*WP,1,'#1d1316');F(WP,y,FW-2*WP,1,'#33262a');
  }
  for(let i=0;i<FW*FH/60;i++)F(WP+Math.random()*(FW-2*WP)|0,WP+Math.random()*(FH-2*WP)|0,1+(Math.random()*3|0),1,Math.random()<.5?'#352729':'#21171a');
  for(let i=0;i<ri(1,3);i++){const mw=ri(50,80),mh=ri(26,36),mx=ri(WP+20,FW-WP-20-mw),my=ri(WP+20,FH-WP-20-mh);
    F(mx-1,my-1,mw+2,mh+2,'#140e0c');F(mx,my,mw,mh,'#2f2d1f');for(let yy=my+1;yy<my+mh;yy+=2)F(mx+1,yy,mw-2,1,'#2a281a');F(mx,my,mw,2,'#1f1c12');F(mx,my+mh-2,mw,2,'#1f1c12');}
  F(0,0,FW,WP,'#24160e');F(0,0,FW,2,'#3b2618');
  for(let x=4;x<FW-4;x+=14){F(x,4,13,WP-8,'#5d5446');F(x,4+((WP-8)>>1),13,1,'#3a2a1c');F(x+6,4,1,WP-8,'#3a2a1c');F(x,4,13,1,'#6d6456');}
  F(0,WP-4,FW,4,'#1b100a');
  F(0,WP,WP,FH-WP,'#1b1214');F(FW-WP,WP,WP,FH-WP,'#1b1214');F(0,FH-WP,FW,WP,'#1b1214');
  for(let y=WP;y<FH;y+=20){F(0,y,WP,1,'#120b0d');F(FW-WP,y,WP,1,'#120b0d');}
  F(WP-1,WP,1,FH-2*WP,'#2c1d1f');F(FW-WP,WP,1,FH-2*WP,'#2c1d1f');F(WP,FH-WP,FW-2*WP,1,'#2c1d1f');
  for(let i=0;i<5;i++)for(let x=WP;x<FW-WP;x++)if((x+i)%(i+1)===0)F(x,WP+i,1,1,'#140d10');
  wallLights(R,'lantern','255,165,90',210);
  for(const l of R.lights){const X=Math.round(l.x/PX),fy=Math.round(l.fy/PX);
    if(l.kind==='lantern'){F(X,0,1,3,'#120a08');F(X-3,3,7,9,'#a8281e');F(X-4,4,9,7,'#c23a2a');F(X-3,3,7,1,'#1a0e0c');F(X-3,11,7,1,'#1a0e0c');F(X-3,5,1,5,'#ff7a55');F(X+2,5,1,5,'#7a1a12');F(X,12,1,3,'#d9a648');}
    else{F(X-2,fy+3,5,1,'#3a2a1c');F(X-1,fy+4,3,1,'#2a1d14');F(X,fy+1,1,2,'#ece4d7');}}
}
function paintBamboo(R,F,FW,FH){
  F(0,0,FW,FH,'#151a10');F(WP,WP,FW-2*WP,FH-2*WP,'#1d2416');
  for(let i=0;i<FW*FH/30;i++){const x=WP+Math.random()*(FW-2*WP)|0,y=WP+Math.random()*(FH-2*WP)|0;F(x,y,1,1,pick(['#232c1a','#182014','#2a3420','#1a2012']));}
  for(let i=0;i<FW*FH/700;i++){const x=ri(WP+4,FW-WP-4),y=ri(WP+4,FH-WP-4);F(x,y,1,3,'#3a5a2a');F(x+1,y+1,1,2,'#2e4a22');F(x-1,y+2,1,1,'#2e4a22');}
  for(let i=0;i<FW*FH/900;i++){const x=ri(WP+4,FW-WP-4),y=ri(WP+4,FH-WP-4);F(x,y,2,1,pick(['#6a7a2a','#5a4a22','#7a8a3a']));}
  for(let i=0;i<ri(2,4);i++){const x=ri(WP+30,FW-WP-30),y=ri(WP+30,FH-WP-30),w=ri(6,10),h=ri(4,6);F(x-w/2,y-h/2,w,h,'#3a3e3a');F(x-w/2,y-h/2,w,1,'#5a5e58');F(x-w/2,y-h/2+1,2,h-1,'#2e322e');}
  const stalk=(x,y0,y1)=>{const c=pick([['#5a8a3a','#3a6a2a','#7aaa4a'],['#4a7a32','#2e5a22','#6a9a42'],['#6a9a42','#4a7a32','#8aba5a']]);F(x,y0,3,y1-y0,c[0]);F(x,y0,1,y1-y0,c[1]);F(x+2,y0,1,y1-y0,c[2]);for(let y=y0+ri(2,8);y<y1;y+=ri(9,13))F(x,y,3,1,'#2a4a1a');};
  F(0,0,FW,WP,'#0e140a');for(let x=0;x<FW;x+=ri(3,5))stalk(x,0,WP);
  F(0,WP,WP,FH,'#0e140a');F(FW-WP,WP,WP,FH,'#0e140a');F(0,FH-WP,FW,WP,'#0e140a');
  for(let x=0;x<WP;x+=ri(3,5)){stalk(x,WP,FH);stalk(FW-WP+x,WP,FH);}
  for(let x=WP;x<FW-WP;x+=ri(3,5))stalk(x,FH-WP,FH);
  for(let i=0;i<5;i++)for(let x=WP;x<FW-WP;x++)if((x+i)%(i+1)===0)F(x,WP+i,1,1,'#10160c');
  for(const [px,py] of [[0.18,0.2],[0.82,0.2],[0.18,0.82],[0.82,0.82]]){if(Math.random()<0.25)continue;const x=R.w*px,y=R.h*py;R.deco.push({spr:'toro',x,y});R.lights.push({kind:'toro',x,y:y-26,r:180,col:'255,170,90',ph:Math.random()*9,fx:x,fy:y-34});}
}
function paintTemple(R,F,FW,FH){
  F(0,0,FW,FH,'#14161a');
  for(let y=WP,row=0;y<FH-WP;y+=12,row++)for(let x=WP-(row%2)*8;x<FW-WP;x+=16){const x0=Math.max(WP,x),w=Math.min(16,FW-WP-x0);F(x0,y,w,12,pick(['#2a2e36','#2e323a','#272b32','#30343c']));F(x0,y,w,1,'#383c44');F(x0,y+11,w,1,'#1c1f26');F(x0,y,1,12,'#1c1f26');
    if(Math.random()<0.12){let cx=x0+ri(2,12),cy=y+ri(2,9);for(let k=0;k<5;k++){F(cx,cy,1,1,'#1a1d24');cx+=ri(-1,1);cy+=1;}}
    if(Math.random()<0.1)F(x0+ri(0,10),y+ri(0,8),ri(2,5),ri(1,3),'#2e3a2a');}
  F(0,0,FW,WP,'#cfc8b8');for(let x=0;x<FW;x+=6){F(x,0,6,6,'#2a2a30');F(x+1,5,4,1,'#3a3a42');F(x,6,1,1,'#1a1a20');}
  F(0,6,FW,1,'#1a1a20');for(let i=0;i<FW/12;i++)F(ri(0,FW),ri(8,WP-4),ri(2,6),ri(1,3),'#b8b0a0');F(0,WP-3,FW,3,'#2a1a12');
  F(0,WP,WP,FH,'#3a3e46');F(FW-WP,WP,WP,FH,'#3a3e46');F(0,FH-WP,FW,WP,'#3a3e46');
  for(let y=WP;y<FH;y+=10){F(0,y,WP,1,'#2a2e36');F(FW-WP,y,WP,1,'#2a2e36');}for(let x=0;x<FW;x+=14)F(x,FH-WP,1,WP,'#2a2e36');
  for(let i=0;i<5;i++)for(let x=WP;x<FW-WP;x++)if((x+i)%(i+1)===0)F(x,WP+i,1,1,'#101216');
  for(let x=120;x<R.w-80;x+=ri(140,220)){if(Math.abs(x-R.w/2)<90)continue;R.deco.push({spr:'grave',x,y:WALL+30});}
  for(const [px,py] of [[0.15,0.78],[0.85,0.78]]){const x=R.w*px,y=R.h*py;R.deco.push({spr:'toro',x,y});R.lights.push({kind:'toro',x,y:y-26,r:170,col:'150,190,255',ph:Math.random()*9,fx:x,fy:y-34});}
  wallLights(R,'candle','140,180,255',180);
}
function paintHell(R,F,FW,FH){
  F(0,0,FW,FH,'#0e0606');F(WP,WP,FW-2*WP,FH-2*WP,'#1e0e0e');
  for(let i=0;i<FW*FH/180;i++){const x=ri(WP,FW-WP),y=ri(WP,FH-WP),w=ri(6,16),h=ri(4,10);F(x,y,w,h,pick(['#2a1414','#241010','#2e1616']));F(x,y,w,1,'#341a1a');}
  for(let i=0;i<FW*FH/40;i++)F(ri(WP,FW-WP),ri(WP,FH-WP),1,1,pick(['#3a1a14','#140808','#4a2a20']));
  for(let k=0;k<ri(4,7);k++){let x=ri(WP+20,FW-WP-20),y=ri(WP+20,FH-WP-20);const n=ri(20,50);
    for(let i=0;i<n;i++){F(x,y,1,1,'#ff5a1a');if(i%3===0)F(x,y,1,1,'#ffb04a');x+=ri(-1,1);y+=pick([-1,0,1,1]);x=clamp(x,WP,FW-WP);y=clamp(y,WP,FH-WP);}
    if(Math.random()<0.6)R.lights.push({kind:'lava',x:x*PX,y:y*PX,r:90,col:'255,80,30',ph:Math.random()*9});}
  const rock=(x,y,w,h)=>{F(x,y,w,h,'#140a0a');for(let i=0;i<w*h/12;i++)F(x+ri(0,w-1),y+ri(0,h-1),1,1,pick(['#1e0e0e','#0a0404','#2a1010']));};
  rock(0,0,FW,WP);rock(0,WP,WP,FH);rock(FW-WP,WP,WP,FH);rock(0,FH-WP,FW,WP);
  F(WP,WP-1,FW-2*WP,1,'#5a1a10');F(WP-1,WP,1,FH-2*WP,'#5a1a10');F(FW-WP,WP,1,FH-2*WP,'#5a1a10');F(WP,FH-WP,FW-2*WP,1,'#5a1a10');
  for(const [px,py] of [[0.12,0.16],[0.88,0.16],[0.12,0.86],[0.88,0.86]]){const x=R.w*px,y=R.h*py;R.deco.push({spr:'brazier',x,y});R.lights.push({kind:'brazier',x,y:y-14,r:200,col:'255,110,50',ph:Math.random()*9,fx:x,fy:y-16});}
}

// shared bits for the newer painters: a rim of wall around the room, scattered specks
function rim(F,FW,FH,c0,c1,c2){F(0,0,FW,WP,c0);F(0,WP,WP,FH,c0);F(FW-WP,WP,WP,FH,c0);F(0,FH-WP,FW,WP,c0);F(WP,WP-1,FW-2*WP,1,c1);F(WP-1,WP,1,FH-2*WP,c1);F(FW-WP,WP,1,FH-2*WP,c1);F(WP,FH-WP,FW-2*WP,1,c1);
  for(let i=0;i<5;i++)for(let x=WP;x<FW-WP;x++)if((x+i)%(i+1)===0)F(x,WP+i,1,1,c2);}
function specks(F,FW,FH,n,cols,w,h){for(let i=0;i<n;i++)F(ri(WP,FW-WP),ri(WP,FH-WP),w||1,h||1,pick(cols));}
function paintRiver(R,F,FW,FH){ // grey pebble shore of the river of the dead
  F(0,0,FW,FH,'#16191c');F(WP,WP,FW-2*WP,FH-2*WP,'#24282c');
  for(let i=0;i<FW*FH/14;i++){const x=ri(WP,FW-WP-2),y=ri(WP,FH-WP-2),c=pick(['#2e3338','#383e44','#1e2226','#43494f']);F(x,y,2,1,c);if(Math.random()<0.3)F(x,y+1,1,1,'#14171a');}
  for(let k=0;k<ri(3,6);k++){const x=ri(WP+20,FW-WP-30),y=ri(WP+20,FH-WP-20);for(let i=0;i<ri(3,7);i++)F(x+i*3,y-i%2,2,3,'#5a5e64');F(x,y+3,12,1,'#101214');}
  rim(F,FW,FH,'#0e1418','#2a4a50','#0a0e10');for(let x=0;x<FW;x+=3)F(x,ri(2,WP-4),2,1,pick(['#1a3a40','#2a5a60','#0e2a30']));
  for(let i=0;i<ri(2,4);i++){const x=ri(WP+30,FW-WP-30),y=ri(WP+30,FH-WP-30);R.lights.push({kind:'lava',x:x*PX,y:y*PX,r:120,col:'90,200,180',ph:Math.random()*9});F(x,y,2,2,'#5ae8c8');F(x,y,1,1,'#d8fff4');}
  for(const [px,py] of [[0.16,0.18],[0.84,0.18],[0.16,0.84],[0.84,0.84]]){if(Math.random()<0.35)continue;const x=R.w*px,y=R.h*py;R.deco.push({spr:'toro',x,y});R.lights.push({kind:'toro',x,y:y-26,r:160,col:'120,220,200',ph:Math.random()*9,fx:x,fy:y-34});}
}
function paintIce(R,F,FW,FH){ // the crimson lotus hell: ice that splits like petals
  F(0,0,FW,FH,'#16243a');
  for(let y=WP,row=0;y<FH-WP;y+=14,row++)for(let x=WP-(row%2)*10;x<FW-WP;x+=20){const x0=Math.max(WP,x),w=Math.min(20,FW-WP-x0);F(x0,y,w,14,pick(['#9ab8d4','#a8c4dc','#8eaeca','#b4cee4']));F(x0,y,w,1,'#d8ecf8');F(x0,y+13,w,1,'#6a8aaa');F(x0,y,1,14,'#7a9aba');}
  for(let k=0;k<ri(4,8);k++){let x=ri(WP+10,FW-WP-10),y=ri(WP+10,FH-WP-10);for(let i=0;i<ri(10,30);i++){F(x,y,1,1,'#5a7a9a');x+=ri(-1,1);y+=ri(-1,1);}}
  for(let k=0;k<ri(2,5);k++){const cx=ri(WP+30,FW-WP-30),cy=ri(WP+30,FH-WP-30);for(let i=0;i<8;i++){const a=i/8*Math.PI*2;F(cx+Math.round(Math.cos(a)*4),cy+Math.round(Math.sin(a)*3),2,2,'#c23a3a');}F(cx,cy,2,2,'#ffd27a');}
  rim(F,FW,FH,'#4a6a8a','#d8ecf8','#3a5a7a');for(let x=0;x<FW;x+=2)F(x,WP-ri(1,5),1,ri(1,4),'#d8ecf8');
  wallLights(R,'candle','150,200,255',170);
}
function paintGakido(R,F,FW,FH){ // cracked, starving earth
  F(0,0,FW,FH,'#1a140c');F(WP,WP,FW-2*WP,FH-2*WP,'#5a4a2e');
  for(let i=0;i<FW*FH/18;i++)F(ri(WP,FW-WP),ri(WP,FH-WP),ri(1,3),1,pick(['#4e402a','#665434','#54462c','#6e5c3a']));
  for(let k=0;k<ri(8,14);k++){let x=ri(WP+5,FW-WP-5),y=ri(WP+5,FH-WP-5);const n=ri(8,22);for(let i=0;i<n;i++){F(x,y,1,1,'#2e2418');x+=pick([-1,0,1]);y+=pick([-1,0,1]);}}
  for(let i=0;i<ri(2,5);i++){const x=ri(WP+20,FW-WP-20),y=ri(WP+20,FH-WP-20);F(x,y,4,1,'#c8bca0');F(x+1,y-1,1,1,'#c8bca0');F(x+4,y+1,1,1,'#c8bca0');}
  rim(F,FW,FH,'#2e2418','#6a5a42','#1a140c');
  for(const [px,py] of [[0.14,0.2],[0.86,0.2],[0.14,0.82],[0.86,0.82]]){if(Math.random()<0.4)continue;const x=R.w*px,y=R.h*py;R.deco.push({prop:'deadtree',x,y});}
  for(let i=0;i<3;i++){const x=R.w*rand(0.25,0.75),y=R.h*rand(0.25,0.75);R.lights.push({kind:'lava',x,y,r:110,col:'200,200,90',ph:Math.random()*9});}
}
function paintAshura(R,F,FW,FH){ // an endless battlefield of red mud
  F(0,0,FW,FH,'#140a08');F(WP,WP,FW-2*WP,FH-2*WP,'#3a2018');
  for(let i=0;i<FW*FH/16;i++)F(ri(WP,FW-WP),ri(WP,FH-WP),ri(1,4),1,pick(['#44261c','#321a12','#4e2c20','#2a140e']));
  for(let i=0;i<ri(10,20);i++){const x=ri(WP+8,FW-WP-8),y=ri(WP+8,FH-WP-8),a=rand(-0.6,0.6);for(let k=0;k<6;k++)F(x+Math.round(k*Math.cos(a)),y+Math.round(k*Math.sin(a)*0.4)-k,1,1,'#6a4a2a');F(x+5,y-6,2,1,'#c8bca0');}
  for(let i=0;i<ri(3,6);i++){const x=ri(WP+20,FW-WP-20),y=ri(WP+20,FH-WP-20);F(x-3,y,8,3,'#2a0e0a');F(x-2,y+1,6,1,'#5e0a14');}
  rim(F,FW,FH,'#24140c','#7a4a2a','#140a06');for(let x=2;x<FW;x+=5){F(x,2,3,WP-6,'#5a3a22');F(x+1,1,1,1,'#7a5232');}
  for(const [px,py] of [[0.12,0.16],[0.88,0.16],[0.12,0.86],[0.88,0.86]]){const x=R.w*px,y=R.h*py;R.deco.push({spr:'brazier',x,y});R.lights.push({kind:'brazier',x,y:y-14,r:190,col:'255,110,50',ph:Math.random()*9,fx:x,fy:y-16});}
  for(let x=200;x<R.w-150;x+=ri(260,380)){if(Math.abs(x-R.w/2)<100)continue;R.deco.push({prop:'nobori',x,y:WALL+40});}
}
function paintPeaks(R,F,FW,FH){ // a mountaintop above the clouds
  F(0,0,FW,FH,'#a8c8e8');F(WP,WP,FW-2*WP,FH-2*WP,'#5e5e56');
  for(let i=0;i<FW*FH/12;i++)F(ri(WP,FW-WP),ri(WP,FH-WP),ri(1,3),1,pick(['#6a6a60','#54544c','#72726a','#4c4c44']));
  for(let i=0;i<FW*FH/220;i++){const x=ri(WP,FW-WP),y=ri(WP,FH-WP);F(x,y,ri(2,5),ri(1,2),pick(['#4a6a3a','#5a7a42','#3a5a2e']));}
  rim(F,FW,FH,'#8ab8e0','#d8ecf8','#c8e0f4');for(let i=0;i<FW/3;i++){const x=ri(0,FW),y=ri(0,WP-4);F(x,y,ri(4,10),2,'#e8f4fc');}for(let i=0;i<FH/3;i++){for(const x0 of [0,FW-WP]){F(x0+ri(0,WP-6),ri(0,FH),ri(3,8),2,'#e8f4fc');}}
  for(let x=180;x<R.w-120;x+=ri(320,420)){if(Math.abs(x-R.w/2)<100)continue;R.deco.push({prop:'shimenawa',x,y:WALL+44});}
}
function paintCastle(R,F,FW,FH){ // tatami halls of the Usurper's keep
  F(0,0,FW,FH,'#0e0a0c');
  for(let y=WP,row=0;y<FH-WP;y+=20,row++)for(let x=WP+(row%2)*20;x<FW-WP;x+=40){const x0=Math.max(WP,x),w=Math.min(40,FW-WP-x0);F(x0,y,w,20,row%2?'#8a8a52':'#7e7e4a');for(let k=2;k<20;k+=2)F(x0,y+k,w,1,'#74744a');F(x0,y,w,1,'#2a2214');F(x0,y,1,20,'#2a2214');if(w>4)F(x0+1,y+1,w-1,1,'#d9a648');}
  rim(F,FW,FH,'#1a1418','#d9a648','#0e0a0c');for(let x=4;x<FW-4;x+=16){F(x,4,15,WP-8,'#f4ead8');F(x,4,15,1,'#d9a648');F(x+7,4,1,WP-8,'#c8bca0');F(x,4+((WP-8)>>1),15,1,'#c8bca0');}
  wallLights(R,'lantern','255,190,110',200);
  for(const l of R.lights){const X=Math.round(l.x/PX),fy=Math.round(l.fy/PX);if(l.kind==='lantern'){F(X-3,2,7,10,'#f4ead8');F(X-3,2,7,1,'#1a1418');F(X-3,11,7,1,'#1a1418');F(X-2,4,5,6,'#ffd27a');}else{F(X-2,fy+3,5,1,'#3a2a1c');F(X,fy+1,1,2,'#ece4d7');}}
}
function paintHub(R,F,FW,FH){ // the Shrine of the Broken Blade at night: gravel, stone path, a pond
  F(0,0,FW,FH,'#120e10');F(WP,WP,FW-2*WP,FH-2*WP,'#2e2a2c');
  for(let i=0;i<FW*FH/10;i++)F(ri(WP,FW-WP),ri(WP,FH-WP),1,1,pick(['#3a3638','#26222a','#423e40','#1e1a1e']));
  for(let y=FH/2-8;y<FH-WP;y+=10)for(const dx of [-6,2]){F(FW/2+dx,y,8,7,'#5a5658');F(FW/2+dx,y,8,1,'#6e6a6c');}
  for(let x=WP;x<FW-WP;x+=10){F(x,FH/2-4,8,7,'#5a5658');F(x,FH/2-4,8,1,'#6e6a6c');}
  for(let i=0;i<FW*FH/500;i++){const x=ri(WP+4,FW-WP-4),y=ri(WP+4,FH-WP-4);F(x,y,1,1,'#f2a7b8');}
  rim(F,FW,FH,'#24160e','#3b2618','#1a100a');for(let x=4;x<FW-4;x+=14){F(x,4,13,WP-8,'#5d5446');F(x,4,13,1,'#6d6456');F(x+6,4,1,WP-8,'#3a2a1c');}
  for(const [px,py] of [[0.1,0.3],[0.9,0.3],[0.1,0.8],[0.9,0.8],[0.35,0.15],[0.65,0.15]]){const x=R.w*px,y=R.h*py;R.deco.push({spr:'toro',x,y});R.lights.push({kind:'toro',x,y:y-26,r:190,col:'255,170,90',ph:Math.random()*9,fx:x,fy:y-34});}
}

// ---------- ambient particles (petals / leaves / snow / embers) ----------
function newAmb(any){
  const t=curBiome().ambient,x0=S.X0,y0=S.Y0;let x,y;
  if(any){x=x0+Math.random()*VW;y=y0+Math.random()*VH;}
  else if(t==='ember'){x=x0+Math.random()*VW;y=y0+VH+20;}
  else if(t==='snow'||t==='ash'){x=x0+Math.random()*VW;y=y0-20;}
  else if(t==='wind'||t==='mist'||t==='dust'){x=x0-30;y=y0+Math.random()*VH;}
  else if(Math.random()<0.5){x=x0-30;y=y0+Math.random()*VH;}else{x=x0+Math.random()*VW;y=y0-30;}
  const cols={petal:['#f2a7b8','#ffd1dc'],leaf:['#7a9a3a','#a8b84a','#5a7a2a'],snow:['#e8eef8','#c8d4e8'],ember:['#ff7a2a','#ffb04a'],ash:['#8a8086','#5a5258','#b0a8ac'],mist:['#7ab0b0','#a8d0cc'],dust:['#c8a868','#a88848'],wind:['#e8f4fc','#c8e0f4']}[t];
  return{x,y,vx:0,vy:0,ph:Math.random()*9,spin:Math.random()*4,col:pick(cols),t};
}
function updateAmbient(gdt){
  const L=S.petals;if(!CFG.ambient){L.length=0;return;}
  const t=curBiome().ambient,n=t==='snow'?46:t==='mist'?18:t==='wind'?26:30;
  while(L.length<n)L.push(newAmb(true));
  const M=60,k=Math.min(1,gdt*1.5);
  for(const p of L){
    if(p.t!==t){p.dead=true;continue;}
    let tx,ty;
    if(t==='petal'){tx=38+Math.sin(S.gt*0.7+p.ph)*18;ty=22+Math.cos(S.gt*1.1+p.ph)*10;}
    else if(t==='leaf'){tx=24+Math.sin(S.gt*0.5+p.ph)*30;ty=16+Math.cos(S.gt*0.9+p.ph)*14;}
    else if(t==='snow'){tx=8+Math.sin(S.gt*0.6+p.ph)*14;ty=30;}
    else if(t==='ash'){tx=4+Math.sin(S.gt*0.4+p.ph)*10;ty=16;}
    else if(t==='mist'){tx=12+Math.sin(S.gt*0.3+p.ph)*6;ty=Math.cos(S.gt*0.4+p.ph)*5;}
    else if(t==='dust'){tx=30+Math.sin(S.gt*0.8+p.ph)*20;ty=Math.cos(S.gt*0.7+p.ph)*8;}
    else if(t==='wind'){tx=220+Math.sin(p.ph)*60;ty=Math.sin(S.gt+p.ph)*10;}
    else{tx=Math.sin(S.gt*1.3+p.ph)*20;ty=-40-Math.sin(p.ph)*15;}
    p.vx+=(tx-p.vx)*k;p.vy+=(ty-p.vy)*k;p.x+=p.vx*gdt;p.y+=p.vy*gdt;p.spin+=gdt*(3+Math.abs(p.vx)/40);
    for(const s of S.slashes){if(s.done)continue;const h=head(s),dx=p.x-h.x,dy=p.y-h.y,d=Math.hypot(dx,dy)||1;
      if(d<40){const tt=tangentAt(s,s.d);p.vx+=(tt.x*300+dx/d*140)*gdt*10;p.vy+=(tt.y*300+dy/d*140)*gdt*10;
        if(d<8&&t!=='ember'&&t!=='mist'&&t!=='wind'){S.parts.push({x:p.x,y:p.y,vx:-tt.y*60,vy:tt.x*60,life:0.7,max:0.7,size:1,col:p.col},{x:p.x,y:p.y,vx:tt.y*60,vy:-tt.x*60,life:0.7,max:0.7,size:1,col:p.col});p.dead=true;}}}
    if(P.dashT>0||S.slide){const dx=p.x-P.x,dy=p.y-P.y,d=Math.hypot(dx,dy)||1;if(d<44){p.vx+=dx/d*2000*gdt;p.vy+=dy/d*2000*gdt;}}
    if(p.x<S.X0-M||p.x>S.X0+VW+M||p.y<S.Y0-M||p.y>S.Y0+VH+M)p.dead=true;
  }
  for(let i=0;i<L.length;i++)if(L[i].dead)L[i]=newAmb(false);
}
function drawAmbient(){
  for(const p of S.petals){const x=LX(p.x),y=LY(p.y),r=Math.floor(p.spin)%4;
    if(p.t==='snow'||p.t==='ash'){pset(x,y,p.col);if(r===0)pset(x+1,y,p.col,0.5);}
    else if(p.t==='mist'){for(let k=-3;k<=3;k++)pset(x+k,y+((k+r)%2),p.col,0.25);}
    else if(p.t==='wind'){pline(x-6,y,x,y,p.col,0.5);}
    else if(p.t==='dust'){pset(x,y,p.col,0.7);}
    else if(p.t==='ember'){pset(x,y,p.col);if(r<2)pset(x,y+1,'#a8321a',0.7);}
    else{pset(x,y,p.col);pset(x+(r<2?1:0),y+(r<2?0:1),r%2?shade(p.col,0.8):p.col);}}
}

// ---------- small things on the floor: pebbles, flowers, grass, bones, petals, picked per realm ----------
// They are painted into the room's floor once, so they cost nothing while you play.
function paintDetails(R,F,FW,FH,key){
  const Rn=Math.random,rr=(a,b)=>a+Math.floor(Rn()*(b-a+1)),pk=a=>a[Math.floor(Rn()*a.length)];
  const dh=Math.round(DW/PX)+8,spot=(m)=>{for(let k=0;k<12;k++){const x=rr(WP+m,FW-WP-m),y=rr(WP+m+3,FH-WP-m);const nearN=Math.abs(x-FW/2)<dh&&(y<WP+28||y>FH-WP-28),nearW=Math.abs(y-FH/2)<dh&&(x<WP+28||x>FW-WP-28);if(!nearN&&!nearW)return[x,y];}return[rr(WP+m,FW-WP-m),rr(WP+m,FH-WP-m)];};
  const D={
    pebble(x,y,c){c=c||['#5a5650','#3e3a36','#7a766e'];const w=rr(2,3),h=Rn()<0.5?2:1;F(x,y+h,w,1,'rgba(0,0,0,0.45)');F(x,y,w,h,c[0]);F(x,y,1,1,c[2]);if(h>1)F(x+w-1,y+1,1,1,c[1]);},
    gravel(x,y){for(let i=0;i<5;i++)F(x+rr(-3,3),y+rr(-2,2),1,1,pk(['#4a4640','#5e5a52','#36322e']));},
    grass(x,y,c){c=c||['#3a5a2a','#4e7a34','#2a4220'];F(x,y-2,1,3,c[0]);F(x-1,y-1,1,2,c[2]);F(x+1,y-3,1,4,c[1]);if(Rn()<0.5)F(x+2,y-1,1,2,c[2]);},
    deadgrass(x,y){D.grass(x,y,['#6a5a3a','#8a7448','#4a3e28']);},
    flower(x,y,p,cn){p=p||pk(['#ece4d7','#f2c14e','#b48cff','#f2a7b8']);cn=cn||'#e8c15a';F(x,y+1,1,2,'#3a5a2a');F(x-1,y,1,1,p);F(x+1,y,1,1,p);F(x,y-1,1,1,p);F(x,y+1,1,1,p);F(x,y,1,1,cn);},
    lily(x,y){F(x,y,1,3,'#2e4a22');const c='#d8203a';F(x-2,y-2,1,1,c);F(x+2,y-2,1,1,c);F(x-1,y-1,1,1,c);F(x+1,y-1,1,1,c);F(x,y-1,1,1,'#ff4a5c');F(x-2,y-3,1,1,'#ff8a95');F(x+2,y-3,1,1,'#ff8a95');F(x,y-3,1,1,'#ff8a95');},
    lilies(x,y){for(let i=0;i<rr(2,4);i++)D.lily(x+rr(-6,6),y+rr(-3,3));},
    leaf(x,y,c){c=c||pk(['#6a7a2a','#7a8a3a','#5a6a24','#8a6a2a']);F(x,y,2,1,c);F(x+1,y-1,1,1,c);},
    petal(x,y){F(x,y,1,1,pk(['#f2a7b8','#ffd0dc','#e8889a']));if(Rn()<0.3)F(x+1,y,1,1,'#f2a7b8');},
    paper(x,y){F(x,y,3,2,'#cfc8b8');F(x,y+2,3,1,'rgba(0,0,0,0.3)');if(Rn()<0.6)F(x+1,y,1,2,'#b8142a');},
    straw(x,y){F(x,y,rr(2,4),1,pk(['#8a7448','#6a5a3a','#a8925a']));},
    shoot(x,y){F(x,y-3,1,1,'#7aaa4a');F(x-1,y-2,3,1,'#8a6a3a');F(x-1,y-1,3,1,'#6a4a28');F(x-2,y,5,1,'#5a3a20');},
    moss(x,y){for(let i=0;i<7;i++)F(x+rr(-3,3),y+rr(-2,2),rr(1,2),1,pk(['#2e3a2a','#3a4a30','#26321f']));},
    puddle(x,y,c){c=c||['#1e2a36','#2a3a4a','#4a5a6a'];const w=rr(6,11);for(let yy=-2;yy<=2;yy++){const ww=Math.round(w*Math.sqrt(1-yy*yy/6.5));F(x-ww,y+yy,ww*2,1,c[0]);}F(x-w+2,y-1,w-1,1,c[1]);F(x-2,y-1,2,1,c[2]);},
    bone(x,y){F(x,y,4,1,'#d8d0c0');F(x-1,y-1,1,1,'#d8d0c0');F(x-1,y+1,1,1,'#d8d0c0');F(x+4,y-1,1,1,'#d8d0c0');F(x+4,y+1,1,1,'#d8d0c0');F(x,y+1,4,1,'rgba(0,0,0,0.3)');},
    skull(x,y){F(x,y,3,2,'#d8d0c0');F(x,y+2,1,1,'#d8d0c0');F(x+2,y+2,1,1,'#d8d0c0');F(x,y+1,1,1,'#1a1010');F(x+2,y+1,1,1,'#1a1010');},
    crack(x,y,c,glow){for(let i=0;i<rr(6,12);i++){F(x,y,1,1,c||'#0e0a0a');if(glow&&i%3===1)F(x,y,1,1,glow);x+=rr(-1,1);y+=pk([-1,0,1,1]);}},
    ember(x,y){F(x,y,1,1,pk(['#ff5a1a','#ffb04a','#c23a1a']));},
    arrow(x,y){const d=pk([1,-1]);for(let i=0;i<6;i++)F(x+i,y+Math.round(i*0.3*d),1,1,'#6b4423');F(x+6,y+Math.round(1.8*d),1,1,'#8a8a92');F(x-1,y-1,1,1,'#ece4d7');F(x-1,y+1,1,1,'#ece4d7');},
    spear(x,y){for(let i=0;i<12;i++)F(x+i,y,1,1,'#5a3a20');F(x+12,y,2,1,'#8a8a92');F(x+5,y,1,1,'#3a2414');},
    cairn(x,y){F(x-3,y,7,2,'#5a5a5e');F(x-2,y-2,5,2,'#6e6e72');F(x-1,y-4,3,2,'#8a8a8e');F(x,y-6,2,2,'#a2a2a6');F(x-3,y,1,2,'#3e3e42');F(x-2,y+2,5,1,'rgba(0,0,0,0.35)');F(x-2,y,1,1,'#3e3e42');},
    shard(x,y){F(x,y-2,1,3,'#bfe8ff');F(x+1,y-1,1,2,'#7ab8d8');F(x-1,y,1,1,'#e8f8ff');},
    snow(x,y){F(x,y,rr(2,4),1,'#d8e4ec');if(Rn()<0.5)F(x+1,y-1,1,1,'#eef6fb');},
    wisp(x,y){F(x,y,rr(4,9),1,'rgba(236,240,248,0.18)');},
    rock(x,y,c){c=c||['#4a4a4e','#6a6a6e','#2e2e32'];const w=rr(4,7),h=rr(3,4);F(x,y,w,h,c[0]);F(x,y,w,1,c[1]);F(x,y+h-1,w,1,c[2]);F(x,y+h,w,1,'rgba(0,0,0,0.35)');},
  };
  const SETS={
    dojo:[['petal',26],['straw',22],['paper',3],['pebble',6]],
    bamboo:[['grass',46],['flower',14],['leaf',34],['shoot',5],['pebble',14]],
    temple:[['moss',22],['puddle',5],['pebble',16],['leaf',10],['flower',3]],
    hell:[['bone',8],['skull',3],['crack',8],['ember',34],['pebble',14]],
    river:[['pebble',80],['cairn',9],['lilies',6],['grass',8]],
    ice:[['shard',14],['snow',26],['crack',8],['pebble',8]],
    gakido:[['crack',18],['deadgrass',24],['bone',6],['pebble',16],['skull',2]],
    ashura:[['arrow',14],['spear',3],['puddle',5],['pebble',14],['bone',3]],
    peaks:[['grass',30],['flower',12],['pebble',22],['rock',6],['wisp',16]],
    castle:[['petal',24],['gravel',16],['paper',3],['pebble',8]],
    hub:[['lily',10],['grass',22],['pebble',22],['petal',14],['flower',4]],
  }[key];
  if(!SETS)return;
  const k=(FW*FH)/(450*300)*1.3;
  for(const [name,n] of SETS){const N=Math.round(n*k*(0.75+Rn()*0.5));for(let i=0;i<N;i++){const [x,y]=spot(4);
    if(name==='crack')D.crack(x,y,key==='ice'?'#7ab8d8':key==='hell'?'#0a0404':'#2a2016',key==='hell'?'#ff5a1a':null);
    else if(name==='puddle')D.puddle(x,y,key==='ashura'?['#3a0a0e','#5a1018','#8a2a30']:null);
    else if(name==='pebble')D.pebble(x,y,key==='hell'?['#3a1a14','#1e0e0c','#5a2a20']:key==='river'?pk([['#6a6e72','#4a4e52','#9a9ea2'],['#5a5e62','#3a3e42','#8a8e92'],['#7a7a76','#5a5a56','#aaaaa6']]):null);
    else if(name==='flower'&&key==='peaks')D.flower(x,y,pk(['#7ab8ff','#f2c14e','#ece4d7']));
    else if(name==='flower'&&key==='temple')D.flower(x,y,'#ece4d7','#f2a7b8');
    else D[name](x,y);}}
  // a few taller things along the walls: bamboo clumps, reeds, stone stacks
  const tall={bamboo:['clump',rr(3,6)],river:['reeds',rr(2,4)],peaks:['pine',rr(1,3)],gakido:['stump',rr(1,3)],temple:['reeds',rr(0,2)]}[key];
  if(tall){for(let i=0;i<tall[1];i++){const side=rr(0,3);let x,y;
      if(side===0){x=rr(WALL+40,R.w-WALL-40);y=WALL+rr(30,60);}else if(side===1){x=rr(WALL+40,R.w-WALL-40);y=R.h-WALL-rr(6,20);}else if(side===2){x=WALL+rr(16,40);y=rr(WALL+60,R.h-WALL-20);}else{x=R.w-WALL-rr(16,40);y=rr(WALL+60,R.h-WALL-20);}
      if(Math.abs(x-R.w/2)<DW+60&&(side<2))continue;if(Math.abs(y-R.h/2)<DW+60&&side>=2)continue;
      R.deco.push({prop:detailProp(tall[0]),x,y});}}
}
function detailProp(name){
  const id='dt_'+name;if(PROPS[id])return id;
  let c;
  if(name==='clump'){c=mk(16,48);const g=c.getContext('2d'),F=(x,y,w,h,col)=>{g.fillStyle=col;g.fillRect(x,y,w,h);};
    for(const [x,h,cc] of [[2,40,['#4a7a32','#2e5a22','#6a9a42']],[7,46,['#5a8a3a','#3a6a2a','#7aaa4a']],[11,34,['#4a7a32','#2e5a22','#6a9a42']]]){const y0=48-h;F(x,y0,3,h,cc[0]);F(x,y0,1,h,cc[1]);F(x+2,y0,1,h,cc[2]);for(let y=y0+5;y<48;y+=7)F(x,y,3,1,cc[1]);
      F(x+3,y0+4,3,1,'#5a9a3a');F(x-2,y0+9,3,1,'#5a9a3a');F(x+3,y0+14,2,1,'#4a8a32');}
  }else if(name==='reeds'){c=mk(12,22);const g=c.getContext('2d'),F=(x,y,w,h,col)=>{g.fillStyle=col;g.fillRect(x,y,w,h);};
    for(const [x,h] of [[2,16],[5,21],[8,14],[10,18]]){F(x,22-h,1,h,'#5a6a3a');F(x,22-h,1,3,'#8a6a3a');}F(1,20,10,2,'#3a4a2a');
  }else if(name==='pine'){c=mk(22,34);const g=c.getContext('2d'),F=(x,y,w,h,col)=>{g.fillStyle=col;g.fillRect(x,y,w,h);};
    F(10,22,3,12,'#4a3020');for(const [y,w] of [[2,4],[6,8],[10,12],[14,16],[18,20]]){F(11-w/2,y,w,4,'#2a4a2a');F(11-w/2,y,w,1,'#3a6a3a');F(11-w/2,y+3,w,1,'#1a321c');}
  }else{c=mk(14,10);const g=c.getContext('2d'),F=(x,y,w,h,col)=>{g.fillStyle=col;g.fillRect(x,y,w,h);};F(2,3,10,7,'#5a3e24');F(2,3,10,2,'#8a6a44');F(4,3,6,1,'#a8885a');F(1,8,12,2,'#3a2614');F(6,4,2,1,'#6a4a2a');}
  if(typeof outlineCanvas==='function')outlineCanvas(c);PROPS[id]=c;return id;
}

// ================= sprites: the player sheet + procedural foes/NPCs/props/icons in the same style =================
// Style rules taken from the player sheet: 1px black outline, 2-tone skin (light/shadow), pleated hakama, ~28px tall figures,
// head 7 wide with the face on the right, obi band at the waist, light from the front-right (shadow on the left edge).
function SPC(w,h){
  const c=mk(w,h),g=c.getContext('2d');
  const R=(x,y,ww,hh,col)=>{if(!col||ww<=0||hh<=0)return;g.fillStyle=col;g.fillRect(Math.round(x),Math.round(y),Math.round(ww),Math.round(hh));};
  const P=(x,y,col)=>R(x,y,1,1,col);
  const E=(cx,cy,rx,ry,col)=>{for(let y=-ry;y<=ry;y++)for(let x=-rx;x<=rx;x++){if((x*x)/((rx+0.5)*(rx+0.5))+(y*y)/((ry+0.5)*(ry+0.5))<=1)P(cx+x,cy+y,col);}};
  const L=(x0,y0,x1,y1,col,th)=>{x0=Math.round(x0);y0=Math.round(y0);x1=Math.round(x1);y1=Math.round(y1);const dx=Math.abs(x1-x0),dy=-Math.abs(y1-y0),sx=x0<x1?1:-1,sy=y0<y1?1:-1;let e=dx+dy;for(let n=0;n<300;n++){P(x0,y0,col);if(th)P(x0,y0+1,col);if(x0===x1&&y0===y1)break;const e2=2*e;if(e2>=dy){e+=dy;x0+=sx;}if(e2<=dx){e+=dx;y0+=sy;}}};
  const clear=(x,y,ww,hh)=>g.clearRect(x,y,ww||1,hh||1);
  return{c,g,R,P,E,L,clear,w,h};
}
function outlineCanvas(c,col){
  const g=c.getContext('2d'),w=c.width,h=c.height,d=g.getImageData(0,0,w,h).data,op=(x,y)=>x>=0&&y>=0&&x<w&&y<h&&d[(y*w+x)*4+3]>0,o=[];
  for(let y=0;y<h;y++)for(let x=0;x<w;x++)if(!op(x,y)&&(op(x-1,y)||op(x+1,y)||op(x,y-1)||op(x,y+1)))o.push(x,y);
  g.fillStyle=col||'#000';for(let i=0;i<o.length;i+=2)g.fillRect(o[i],o[i+1],1,1);return c;
}
function tinted(src,col){const c=mk(src.width,src.height),g=c.getContext('2d');g.drawImage(src,0,0);g.globalCompositeOperation='source-in';g.fillStyle=col;g.fillRect(0,0,c.width,c.height);return c;}
function flipped(src){const c=mk(src.width,src.height),g=c.getContext('2d');g.translate(c.width,0);g.scale(-1,1);g.drawImage(src,0,0);return c;}
function shade(hex,k){const n=parseInt(hex.slice(1),16),r=(n>>16)&255,g=(n>>8)&255,b=n&255;const f=v=>Math.max(0,Math.min(255,Math.round(v*k)));return'#'+((1<<24)|(f(r)<<16)|(f(g)<<8)|f(b)).toString(16).slice(1);}

const PAL={skin:['#e5a56b','#cf6a48'],pale:['#f1e0d2','#cfbeaf'],ghost:['#eef0ff','#b6b8d8'],white:['#f1e0d2','#b59f8d'],black:['#2a2328','#161216'],
  maroon:['#7d382f','#5b1d30'],gray:['#4c433b','#342c29'],red:['#c23a2a','#8a1a14'],gold:['#e8c15a','#a8822a']};

// ---------- generic humanoid (used for rōnin, yōkai in clothes, NPCs, bosses at larger sizes) ----------
// frames: 0-2 walk (hem sway + bob), 3 wind-up (arm raised back), 4 strike (arm forward)
function hairAndHat(s,o,g){
  const{R,P,L,E}=s,{hx,hy,headW:w,headH:h}=g,hr=o.hair||PAL.black,mid=hx+Math.floor(w/2);
  switch(o.hairStyle){
    case'wild':R(hx-1,hy-1,w,3,hr[0]);P(hx-2,hy,hr[0]);P(hx,hy-2,hr[0]);P(hx+3,hy-2,hr[0]);P(hx+w-2,hy-2,hr[1]);R(hx-1,hy+1,3,h-1,hr[0]);R(hx-1,hy+h-1,2,3,hr[1]);P(hx+w-1,hy+1,hr[0]);break;
    case'topknot':R(hx,hy,w,2,hr[0]);R(hx,hy+1,2,h-3,hr[0]);R(hx+1,hy-2,3,2,hr[0]);P(hx+2,hy-3,hr[1]);R(hx+3,hy,w-4,1,hr[1]);break;
    case'tied':R(hx,hy,w,2,hr[0]);R(hx-1,hy+1,2,h-2,hr[0]);R(hx-3,hy+2,2,2,hr[0]);P(hx-4,hy+4,hr[1]);break;
    case'long':R(hx-1,hy-1,w+1,3,hr[0]);R(hx-1,hy+1,3,h+7,hr[0]);R(hx+w-2,hy+1,2,2,hr[0]);R(hx-1,hy+h+4,2,4,hr[1]);break;
    case'geisha':R(hx-1,hy-1,w+1,3,hr[0]);R(hx-1,hy+1,3,h-2,hr[0]);E(mid,hy-3,Math.floor(w/2),2,hr[0]);P(mid+2,hy-4,'#e8c15a');P(mid+3,hy-5,'#ff4a5c');break;
    case'yurei':R(hx-1,hy-1,w+2,h+1,hr[0]);P(hx+w-2,hy+Math.floor(h/2),'#ffffff');R(hx-1,hy+h,3,10,hr[0]);R(hx+w-2,hy+h,2,7,hr[0]);R(hx+2,hy+h,2,5,hr[1]);break;
    case'okappa':R(hx-1,hy-1,w+2,4,hr[0]);R(hx-1,hy+2,2,h-2,hr[0]);R(hx+w-1,hy+2,2,2,hr[0]);R(hx,hy+2,w-1,1,hr[1]);break;
    case'spiky':R(hx-1,hy-1,w+1,4,hr[0]);for(let i=0;i<w+2;i+=2)P(hx-2+i,hy-2-(i%4?0:1),hr[0]);R(hx-2,hy+1,3,h,hr[0]);P(hx-3,hy+3,hr[0]);P(hx+w-1,hy+2,hr[1]);R(hx-1,hy+2,2,h-2,hr[1]);break;
  }
  switch(o.hat){
    case'kasa':{const c=o.hatCol||['#c9a25a','#8a6a33'];R(hx-4,hy+1,w+8,1,c[1]);R(hx-3,hy,w+6,1,c[0]);R(hx-1,hy-1,w+2,1,c[0]);R(hx+1,hy-2,w-2,1,c[0]);P(mid,hy-3,c[1]);for(let x=hx-3;x<hx+w+3;x+=2)P(x,hy,c[1]);break;}
    case'jingasa':{const c=o.hatCol||['#2b2b33','#16161c'];R(hx-3,hy+1,w+6,1,c[1]);R(hx-2,hy,w+4,1,c[0]);R(hx,hy-1,w,1,c[0]);R(hx+2,hy-2,w-4,1,c[0]);P(mid,hy,'#b8142a');break;}
    case'hood':{const c=o.hatCol;R(hx-1,hy-1,w+1,h+1,c[0]);R(hx-1,hy-1,2,h+1,c[1]);R(hx+w-3,hy+2,3,2,g.sk[0]);P(hx+w-2,hy+2,'#000');if(o.mask)R(hx+w-3,hy+4,3,2,o.mask);break;}
    case'cowl':{const c=o.hatCol;R(hx-1,hy-1,w+1,h+1,c[0]);R(hx-1,hy-1,2,h+1,c[1]);R(hx+w-3,hy+2,3,3,g.sk[0]);P(hx+w-2,hy+3,'#000');break;}
    case'band':{const c=o.band||'#b8142a';R(hx,hy+2,w,1,c);R(hx-3,hy+2,3,1,c);P(hx-4,hy+3,c);break;}
    case'hachimaki':{R(hx,hy+2,w,1,'#ffffff');R(hx-2,hy+2,2,1,'#ffffff');P(hx-3,hy+3,'#ffffff');break;}
    case'tokin':{R(hx+w-4,hy-2,3,2,'#1a1418');P(hx+w-3,hy-3,'#1a1418');break;}
    case'kabuto':{const c=o.hatCol;R(hx-2,hy-1,w+3,3,c[0]);R(hx-3,hy+2,3,4,c[0]);R(hx-3,hy+5,3,1,c[1]);R(hx-2,hy-1,w+3,1,c[1]);const k=o.crest||'#e8c15a';L(hx+2,hy-1,hx,hy-6,k);L(hx+w-2,hy-1,hx+w,hy-6,k);P(mid,hy-1,k);P(mid,hy-2,'#b8142a');
      if(o.menpo){R(hx+w-4,hy+h-4,4,3,o.menpo);P(hx+w-1,hy+h-3,'#ffffff');R(hx+w-4,hy+h-2,4,1,shade(o.menpo,0.6));}break;}
    case'tenkan':R(hx+w-5,hy+1,4,1,'#ffffff');R(hx+w-4,hy+2,2,1,'#ffffff');break;
    case'tsuno':{R(hx-2,hy-3,w+3,4,'#ffffff');R(hx-2,hy-3,w+3,1,'#e0e0ee');R(hx-2,hy+1,2,h-3,'#d0d0e0');break;}
  }
  if(o.horns){const hc=o.hornCol||'#e8dcc0',hl=o.hornLen||3;R(hx+1,hy-hl,1,hl,hc);R(hx+w-2,hy-hl,1,hl,hc);P(hx,hy-hl-1,hc);P(hx+w-1,hy-hl-1,hc);}
  if(o.ears){const ec=o.ears;R(hx+1,hy-3,2,3,ec[0]);R(hx+w-3,hy-3,2,3,ec[0]);P(hx+2,hy-2,ec[1]);P(hx+w-2,hy-2,ec[1]);}
  if(o.mustache)R(hx+w-3,hy+h-3,3,1,o.mustache);
  if(o.fangs){P(hx+w-2,hy+h-2,'#ffffff');P(hx+w-4,hy+h-2,'#ffffff');}
  if(o.closedEyes){R(hx+w-3,hy+Math.floor(h*0.5),2,1,'#000');}
}
function human(o,f){
  const W=o.W||32,H=o.H||32,s=SPC(W,H),{R,P,L,E}=s;
  const cx=o.cx??13,legH=o.legH??11,torH=o.torH??6,obiH=o.obiH??2,headH=o.headH??8,headW=o.headW??7,bodyW=o.bodyW??9;
  const base=H-2,bob=(f===1||f===2)?1:0;
  const legTop=base-legH+1,obiY=legTop-obiH+bob,torY=obiY-torH,hy=torY-headH,hx=cx-Math.floor(headW/2)+1;
  const bL=cx-Math.floor(bodyW/2),bR=bL+bodyW-1;
  const sk=o.skin||PAL.skin,rb=o.robe,hk=o.hak||rb,sh=o.sash||PAL.white;
  const G={cx,bL,bR,torY,hy,hx,headW,headH,legTop,base,obiY,bodyW,legH,torH,sk,rb};
  if(o.back)o.back(s,f,G);
  R(bL-1,torY+1,2,torH+1,rb[1]); // back sleeve
  const hem=[[-2,2],[-3,3],[-5,2],[-3,2],[-2,4],[-2,2]][f]||[-2,2];
  if(o.legs==='pants'){
    const sw=f===1?1:f===2?-1:f===4?1:0,lw=Math.max(2,Math.round(bodyW/3)),pc=o.pants||hk;
    R(bL+1-sw,legTop,lw,legH-1,pc[0]);R(bR-lw+sw,legTop,lw,legH-1,pc[0]);R(bL+1-sw,legTop,1,legH-1,pc[1]);
    R(bL-sw,base,lw+1,1,o.feet||'#1a1418');R(bR-lw+sw,base,lw+1,1,o.feet||'#1a1418');
  }else if(o.legs==='tail'){
    for(let i=0;i<legH;i++){const t=i/Math.max(1,legH-1),w=Math.max(1,Math.round(bodyW*(1-t*0.82))),sway=Math.round(Math.sin(t*3+f*1.3)*1.6*t)-Math.round(t*3);
      R(bL+Math.floor((bodyW-w)/2)+sway,legTop+i,w,1,i>legH*0.55?rb[1]:rb[0]);}
  }else{
    const k=o.skirt?0.45:1;
    for(let y=legTop;y<=base;y++){const t=(y-legTop)/Math.max(1,base-legTop),l=Math.round(bL+hem[0]*t*k),r=Math.round(bR+hem[1]*t*k);
      for(let x=l;x<=r;x++){const dark=o.skirt?(x-l)<2:((x-l)<2||((x-l)%3===0));P(x,y,dark?hk[1]:hk[0]);}}
    if(o.geta){R(bL,base+0,3,1,'#3a2a1c');R(bR-2,base,3,1,'#3a2a1c');}
  }
  R(bL,torY,bodyW,torH,rb[0]);R(bL,torY,2,torH,rb[1]);
  if(o.armor){for(let y=torY+1;y<torY+torH;y+=2)R(bL+1,y,bodyW-2,1,o.armor[1]);R(bL-2,torY,3,4,o.armor[0]);R(bL-2,torY+3,3,1,o.armor[1]);if(o.lace)for(let y=torY+1;y<torY+torH;y+=2)P(cx,y,o.lace);}
  if(o.bare){P(cx+1,torY+2,sk[1]);P(cx+1,torY+3,sk[1]);P(cx-1,torY+2,sk[1]);if(torH>7){P(cx,torY+5,sk[1]);P(cx+2,torY+5,sk[1]);}}
  else{const c0=o.collar||PAL.white[0];P(cx,torY,c0);P(cx+1,torY,sk[0]);P(cx+2,torY,c0);P(cx,torY+1,c0);P(cx+1,torY+1,sk[1]);P(cx+2,torY+1,rb[1]);P(cx+1,torY+2,c0);}
  R(bL,obiY,bodyW,obiH,sh[0]);for(let x=bL+1;x<=bR;x+=3)P(x,obiY+obiH-1,sh[1]);
  if(o.loin){R(bL+2,legTop,bodyW-4,Math.round(legH*0.35),o.loin[0]);for(let x=bL+3;x<bR-1;x+=3)R(x,legTop,1,Math.round(legH*0.35),o.loin[1]);}
  if(o.apron)R(bL+2,obiY-1,bodyW-3,Math.round(legH*0.75)+2,o.apron);
  let hand;const arm=o.arm||rb[0],aw=bodyW>11?3:2;
  if(f===3){L(bR-1,torY+1,cx-1,torY-5,arm,1);if(aw>2)L(bR,torY+1,cx,torY-5,arm,1);R(cx-3,torY-7,2,2,sk[0]);hand={x:cx-2,y:torY-6};}
  else if(f===4){R(bR-1,torY+1,7+(aw-2)*2,aw,arm);R(bR+6+(aw-2)*2,torY+1,2,2,sk[0]);hand={x:bR+7+(aw-2)*2,y:torY+2};}
  else{R(bR-1,torY+1,aw,torH-1,arm);R(bR,torY+torH-1,2,2,sk[0]);hand={x:bR+1,y:torY+torH};}
  if(o.head)o.head(s,f,G);
  else{
    R(hx,hy,headW,headH,sk[0]);s.clear(hx,hy);s.clear(hx+headW-1,hy);s.clear(hx,hy+headH-1);
    R(hx,hy+1,1,headH-2,sk[1]);R(hx+1,hy+headH-1,headW-2,1,sk[1]);
    if(!o.noFace){const ey=hy+Math.floor(headH*0.5);P(hx+headW-2,ey,o.eye||'#000');if(o.brow)P(hx+headW-2,ey-1,o.brow);P(hx+headW-1,ey+2,sk[1]);P(hx+2,ey,sk[1]);}
    hairAndHat(s,o,G);
  }
  if(o.front)o.front(s,f,Object.assign(G,{hand}));
  outlineCanvas(s.c);
  return{c:s.c,hand};
}

// ---------- yōkai bodies ----------
function kappaS(f){
  const s=SPC(32,32),{R,P,E,L}=s,G=['#6aa84f','#3f7a35'],B='#d9c27a',SH=['#6a5a32','#3e331c'];
  if(f===5){E(15,24,8,6,SH[0]);E(15,24,6,4,SH[1]);for(let x=9;x<22;x+=3)L(x,19,x,29,SH[0]);P(15,18,G[0]);outlineCanvas(s.c);return{c:s.c,hand:{x:15,y:22}};}
  const bob=(f===1||f===2)?1:0,sw=f===1?1:f===2?-1:0;
  R(10-sw,26,3,4,G[1]);R(15+sw,26,3,4,G[0]);R(9-sw,29,5,1,G[1]);R(14+sw,29,5,1,G[1]);
  E(9,21+bob,5,6,SH[0]);E(9,21+bob,3,4,SH[1]);for(let y=17;y<26;y+=3)L(5,y+bob,12,y+bob,SH[1]);
  E(14,21+bob,5,6,G[0]);E(16,22+bob,3,4,B);R(10,17+bob,2,8,G[1]);
  const hy=8+bob;E(15,hy+4,5,5,G[0]);E(12,hy+5,2,3,G[1]);
  R(19,hy+5,3,2,'#e8c15a');P(21,hy+6,'#b88a2a');P(17,hy+3,'#ffffff');P(18,hy+3,'#000');
  for(let x=10;x<=20;x+=2)P(x,hy,'#2a3a1a');R(11,hy+1,9,1,'#2a3a1a');E(15,hy-1,3,1,'#cfe8f0');P(14,hy-1,'#ffffff');
  let hand;
  if(f===3){L(16,17+bob,13,12+bob,G[0],1);hand={x:13,y:11+bob};}else if(f===4){R(17,18+bob,6,2,G[0]);P(23,18+bob,G[1]);hand={x:23,y:18+bob};}else{R(17,18+bob,2,5,G[0]);P(18,23+bob,G[1]);hand={x:19,y:22+bob};}
  outlineCanvas(s.c);return{c:s.c,hand};
}
function tanukiS(f,variant){
  const s=SPC(32,32),{R,P,E,L}=s,FU=['#8a5a34','#5e3a1e'],BE='#e8d2a8',MK='#2a1a12';
  if(f===5){ // bunbuku chagama: the tanuki pretending to be a tea kettle
    E(14,24,7,6,'#4a4a52');E(13,25,5,4,'#5c5c66');R(7,19,15,2,'#3a3a40');R(12,16,5,3,'#4a4a52');P(14,15,'#2a2a30');
    L(21,24,25,20,'#4a4a52',1);L(9,18,14,13,'#2a2a30');L(14,13,19,18,'#2a2a30');P(6,28,FU[0]);P(5,27,FU[0]);
    outlineCanvas(s.c);return{c:s.c,hand:{x:20,y:22}};
  }
  const bob=(f===1||f===2)?1:0,sw=f===1?1:f===2?-1:0;
  if(variant==='merchant'){E(7,16+bob,5,6,'#3a5aa8');P(5,13+bob,'#e8e0d0');P(8,17+bob,'#e8e0d0');P(6,19+bob,'#e8e0d0');}
  E(6,24+bob,3,4,FU[0]);P(5,22+bob,MK);P(5,25+bob,MK);
  R(10-sw,27,3,3,FU[1]);R(15+sw,27,3,3,FU[1]);
  E(14,22+bob,7,7,FU[0]);E(16,23+bob,4,5,BE);R(8,19+bob,2,6,FU[1]);
  const hy=8+bob;E(15,hy+5,5,4,FU[0]);R(10,hy+1,2,2,FU[1]);R(18,hy+1,2,2,FU[1]);
  R(13,hy+4,6,2,MK);P(17,hy+4,'#ffffff');P(17,hy+5,'#000');R(18,hy+6,3,2,BE);P(21,hy+6,'#000');
  if(variant==='merchant'){R(8,hy+1,15,1,'#8a6a33');R(9,hy,13,1,'#c9a25a');R(11,hy-1,9,1,'#c9a25a');R(13,hy-2,5,1,'#c9a25a');}
  else{P(15,hy-1,'#5aa84a');P(16,hy-2,'#5aa84a');P(14,hy,'#3a7a2a');}
  let hand;
  if(f===3){L(18,17+bob,16,11+bob,FU[0],1);hand={x:16,y:10+bob};}else if(f===4){R(19,19+bob,5,2,FU[0]);hand={x:24,y:19+bob};}else{R(19,18+bob,2,4,FU[0]);hand={x:20,y:22+bob};}
  if(variant==='gambler'){E(22,27,3,2,'#3a2a1c');E(22,26,2,1,'#5a4030');P(20,29,'#ffffff');P(25,29,'#ffffff');}
  outlineCanvas(s.c);return{c:s.c,hand};
}
function kasaS(f){
  const s=SPC(32,32),{R,P,E,L}=s,PA=['#a8323a','#6a1a22'],RIB='#3a1a10';
  const hopY=f===1?-4:f===2?-2:0,squash=f===0?1:0,gy=hopY<0?hopY:0;
  R(14,24+hopY,2,5,'#e5a56b');R(11,29+gy,7,1,'#3a2a1c');P(11,30+gy,'#3a2a1c');P(17,30+gy,'#3a2a1c');
  for(let y=4;y<=24;y++){const t=(y-4)/20,w=Math.round(1+t*6+squash*t),l=14-w,r=15+w;for(let x=l;x<=r;x++)P(x,y+hopY,(x-l)<2?PA[1]:PA[0]);}
  for(let y=9;y<=24;y+=5){const w=Math.round(1+(y-4)/20*6);L(14-w,y+hopY,15+w,y+hopY,RIB);}
  P(14,3+hopY,RIB);P(15,2+hopY,RIB);
  E(16,13+hopY,2,2,'#ffffff');P(17,13+hopY,'#000');
  const tl=f===4?8:f===3?1:3;R(16,18+hopY,tl,1,'#e0607a');P(16+tl-1,19+hopY,'#e0607a');
  outlineCanvas(s.c);return{c:s.c,hand:{x:16+tl,y:18+hopY}};
}
function onibiS(f){
  const s=SPC(32,32),{R,P,E,L}=s,C1='#6ec8ff',C2='#d8f6ff',C3='#3a7ad8';
  const fl=[0,1,-1,1,2,0][f]||0;
  E(15,21,6,6,C3);E(15,21,5,5,C1);E(15,22,3,3,C2);
  for(const [x,h] of [[11,4],[14,7+fl],[17,5-fl],[19,3]]){L(x,17,x+(fl>0?1:-1),17-h,C1);P(x+(fl>0?1:-1),17-h,C2);}
  P(13,21,'#06204a');P(17,21,'#06204a');R(14,24,3,1,'#06204a');if(f===3||f===4)R(14,23,3,2,'#06204a');
  outlineCanvas(s.c,'#06142a');return{c:s.c,hand:{x:15,y:21}};
}
function joroS(f){
  const s=SPC(40,32),{R,P,E,L}=s,AB=['#2a2228','#161216'],ST='#e8c15a',LEG='#2a2026';
  const sw=[0,1,-1,0,1,0][f]||0;
  const tips=[[3,30],[7,31],[11,31],[15,31],[20,31],[24,31],[28,31],[33,30]];
  tips.forEach(([x,y],i)=>{const kx=(i%2?sw:-sw),sx=12+i*1.6;L(sx,23,x+kx,y-6,LEG);L(x+kx,y-6,x+kx,y,LEG);});
  E(10,19,8,6,AB[0]);E(10,19,6,4,AB[1]);for(let x=5;x<16;x+=3)R(x,16,1,6,ST);
  E(19,22,4,3,AB[0]);
  const bob=(f===1||f===2)?1:0,torY=11+bob;
  R(20,torY,7,8,'#a8283a');R(20,torY,2,8,'#6a1a24');R(20,torY+7,7,1,'#e8c15a');P(23,torY,'#f1e0d2');P(24,torY+1,'#f1e0d2');
  const hx=21,hy=torY-8;R(hx,hy,6,7,'#f1e0d2');R(hx,hy+1,1,5,'#cfbeaf');P(hx+4,hy+3,'#000');P(hx+5,hy+5,'#c23a2a');
  R(hx-1,hy-1,7,3,'#161216');R(hx-1,hy+1,3,12,'#161216');P(hx+5,hy-2,'#e8c15a');
  let hand;
  if(f===3){L(26,torY+1,23,torY-5,'#a8283a',1);hand={x:22,y:torY-6};}else if(f===4){R(26,torY+1,7,2,'#a8283a');R(33,torY+1,2,2,'#f1e0d2');hand={x:34,y:torY+2};}else{R(26,torY+1,2,5,'#a8283a');R(27,torY+5,2,2,'#f1e0d2');hand={x:28,y:torY+6};}
  outlineCanvas(s.c);return{c:s.c,hand};
}
function gakiS(f){
  const s=SPC(32,32),{R,P,E,L}=s,SK=['#a8ac92','#6e725c'],BE='#b8bc9e';
  const bob=(f===1||f===2)?1:0,sw=f===1?1:f===2?-1:0;
  R(11-sw,24,2,6,SK[1]);R(16+sw,24,2,6,SK[0]);R(10-sw,29,3,1,SK[1]);R(16+sw,29,3,1,SK[1]);
  R(10,22+bob,9,3,'#5a4a3a');for(let x=11;x<19;x+=3)P(x,24+bob,'#3a2a20');
  E(15,19+bob,5,5,SK[0]);E(16,20+bob,3,3,BE);
  R(11,12+bob,7,4,SK[0]);R(11,12+bob,2,4,SK[1]);P(14,13+bob,SK[1]);P(14,15+bob,SK[1]);
  const hx=14,hy=5+bob;R(hx,hy,6,7,SK[0]);R(hx,hy+1,1,5,SK[1]);P(hx+4,hy+3,'#ff3a3a');P(hx+5,hy+5,'#000');R(hx+3,hy+6,3,1,'#2a1a1a');
  P(hx,hy-1,'#2a2a2a');P(hx+2,hy-1,'#2a2a2a');P(hx+1,hy-2,'#2a2a2a');P(hx+4,hy-1,'#2a2a2a');
  let hand;
  if(f===3){L(17,13+bob,14,7+bob,SK[0]);hand={x:13,y:6+bob};}else if(f===4){R(17,14+bob,7,1,SK[0]);R(24,13+bob,2,2,SK[1]);hand={x:25,y:14+bob};}else{L(17,13+bob,19,20+bob,SK[0]);P(20,21+bob,SK[1]);hand={x:20,y:21+bob};}
  outlineCanvas(s.c);return{c:s.c,hand};
}
function jizoS(f,hat){
  const s=SPC(32,32),{R,P,E}=s,ST=['#9a9aa2','#6a6a72'];
  R(9,23,12,8,ST[0]);R(9,23,2,8,ST[1]);E(15,23,6,3,ST[0]);
  R(10,18,10,5,'#c23a2a');R(10,18,2,5,'#8a1a14');
  E(15,13,4,4,ST[0]);E(13,14,1,2,ST[1]);R(13,13,2,1,'#3a3a40');R(16,13,2,1,'#3a3a40');P(15,16,'#5a5a62');
  if(hat){R(9,9,13,1,'#8a6a33');R(10,8,11,1,'#c9a25a');R(12,7,7,1,'#c9a25a');R(14,6,3,1,'#c9a25a');}
  if(f===5){for(let x=10;x<21;x+=2)P(x,9,'#ffffff');P(11,22,'#ffffff');P(19,21,'#ffffff');}
  outlineCanvas(s.c);return{c:s.c,hand:{x:20,y:20}};
}
function kamaS(f){ // kamaitachi: a weasel with a sickle for a paw
  const s=SPC(32,32),{R,P,E,L}=s,FU=['#c8925a','#8a5a2e'],BE='#f4e6c8';
  const bob=(f===1||f===2)?1:0,sw=f===1?1:f===2?-1:0;
  for(let i=0;i<8;i++){const t=i/7;P(Math.round(9-t*6),Math.round(23+bob-t*8+Math.sin(t*3+f)*1.2),i>5?BE:FU[0]);P(Math.round(9-t*6),Math.round(24+bob-t*8+Math.sin(t*3+f)*1.2),FU[1]);}
  R(10-sw,27,2,3,FU[1]);R(18+sw,27,2,3,FU[1]);
  E(14,25+bob,6,3,FU[0]);E(15,26+bob,4,1,BE);R(9,24+bob,2,3,FU[1]);
  const hy=17+bob;E(21,hy+3,3,3,FU[0]);P(19,hy-1,FU[0]);P(20,hy,FU[1]);P(22,hy-1,FU[0]);R(22,hy+4,3,2,BE);P(23,hy+2,'#000');P(25,hy+4,'#2a1a10');
  let hand;
  if(f===3){L(19,23+bob,17,16+bob,FU[0]);hand={x:16,y:15+bob};}else if(f===4){R(19,23+bob,6,1,FU[0]);hand={x:25,y:23+bob};}else{L(19,24+bob,21,27+bob,FU[0]);hand={x:22,y:27+bob};}
  L(hand.x,hand.y,hand.x+2,hand.y-3,'#c4ccd2');L(hand.x+2,hand.y-3,hand.x+5,hand.y-3,'#e8eef2');P(hand.x+6,hand.y-2,'#c4ccd2');
  if(f===4)for(let i=0;i<3;i++)L(4+i*3,14+i*3,9+i*3,13+i*3,'#bfe6b0');
  outlineCanvas(s.c);return{c:s.c,hand};
}
function enenraS(f){ // enenra: a body of smoke with a face
  const s=SPC(32,32),{R,P,E}=s,SM=['#7a7080','#4e4656','#a89cb0'];
  const w=[0,1,-1,1,2,0][f]||0;
  E(15,24,8,5,SM[1]);E(11+w,19,6,6,SM[0]);E(19-w,17,6,6,SM[0]);E(15,12+w,6,5,SM[2]);E(15,13+w,5,4,SM[0]);
  for(let i=0;i<5;i++)P(8+i*4,28+((i+f)%2),SM[1]);
  R(12,12+w,2,1,'#ff5a1a');R(17,12+w,2,1,'#ff5a1a');R(13,15+w,5,1,'#1a1418');if(f===3||f===4)R(13,15+w,5,2,'#1a1418');
  outlineCanvas(s.c,'#1a141e');return{c:s.c,hand:{x:22,y:16}};
}
function usagiS(f){ // the moon rabbit and its mochi mallet
  const s=SPC(32,32),{R,P,E,L}=s,W=['#f4f0ec','#c8c0c0'];
  const up=f===3,bob=(f===1||f===2)?1:0;
  R(11,27,3,3,W[1]);R(16,27,3,3,W[0]);E(14,22+bob,6,6,W[0]);E(12,23+bob,3,4,W[1]);
  E(15,12+bob,4,4,W[0]);R(13,3+bob,2,7,W[0]);R(17,2+bob,2,8,W[0]);P(13,5+bob,'#f0a0b0');P(17,4+bob,'#f0a0b0');P(17,12+bob,'#c23a2a');P(19,14+bob,'#f0a0b0');
  R(10,19+bob,9,2,'#c23a2a');
  const hx=up?18:22,hy=up?6:20;L(17,20+bob,hx,hy,'#a87a4a',1);R(hx-2,hy-3,6,4,'#8a5a2e');R(hx-2,hy-3,6,1,'#c8925a');
  outlineCanvas(s.c);return{c:s.c,hand:{x:hx,y:hy}};
}
function chochinS(f){ // chōchin-obake: a split paper lantern with a tongue
  const s=SPC(32,32),{R,P,E,L}=s,PA=['#f4ead8','#c8b896'],RB='#a83a2a';
  const bob=[0,-1,-2,-1,0,0][f]||0;
  R(13,4+bob,6,2,'#2a2328');R(13,27+bob,6,2,'#2a2328');
  for(let y=6;y<27;y++){const t=(y-6)/20,w=Math.round(5+Math.sin(Math.PI*t)*3);for(let x=16-w;x<=15+w;x++)P(x,y+bob,(x-(16-w))<2?PA[1]:PA[0]);}
  for(let y=8;y<27;y+=3){const t=(y-6)/20,w=Math.round(5+Math.sin(Math.PI*t)*3);L(16-w,y+bob,15+w,y+bob,RB);}
  E(18,12+bob,2,2,'#ffffff');P(19,12+bob,'#000');R(13,18+bob,8,2,'#3a0a0a');R(17,19+bob,2,4+(f%2),'#e0607a');
  outlineCanvas(s.c);return{c:s.c,hand:{x:20,y:20}};
}
function zoriS(f){ // bake-zōri: a haunted straw sandal on two little legs
  const s=SPC(32,32),{R,P,E,L}=s,ST=['#c8a868','#8a6a3a'];
  const bob=(f===1||f===2)?1:0,sw=f===1?1:f===2?-1:0;
  R(12-sw,25,1,4,'#2a1a10');R(18+sw,25,1,4,'#2a1a10');R(11-sw,29,3,1,'#2a1a10');R(17+sw,29,3,1,'#2a1a10');
  E(15,16+bob,6,9,ST[0]);E(13,16+bob,3,8,ST[1]);for(let y=9;y<25;y+=2)L(10,y+bob,20,y+bob,ST[1]);
  L(15,10+bob,12,16+bob,'#c23a2a');L(15,10+bob,18,16+bob,'#c23a2a');
  E(16,14+bob,2,2,'#ffffff');P(17,14+bob,'#000');R(13,19+bob,5,1,'#3a1a10');
  outlineCanvas(s.c);return{c:s.c,hand:{x:20,y:18}};
}
function monkeyS(f){
  const s=SPC(32,32),{R,P,E}=s,FU=['#8a7a6a','#5e5048'],FACE='#e07a7a';
  const bob=(f===1||f===2)?1:0;
  E(14,25+bob,6,5,FU[0]);E(11,26+bob,3,3,FU[1]);E(15,17+bob,5,5,FU[0]);E(16,18+bob,3,3,FACE);P(17,17+bob,'#000');P(15,17+bob,'#000');R(15,20+bob,3,1,'#8a3a3a');
  R(19,23+bob,3,2,FU[0]);
  outlineCanvas(s.c);return{c:s.c,hand:{x:21,y:24}};
}

// ---------- looks: every foe, boss and NPC ----------
const TAILS=(n,big)=>(s,f,g)=>{const O=['#f0a050','#c87830'],Wt='#f4ece0';for(let i=0;i<n;i++){const a=-2.2+i*(n>1?1.7/(n-1):0)+Math.sin(f*0.8+i)*0.08,L=(big?13:7)+(i%2),x0=g.bL+1,y0=g.obiY;
  for(let k=0;k<=L;k++){const x=x0+Math.cos(a)*k,y=y0+Math.sin(a)*k*0.8,r=Math.round((big?2.5:1.5)*Math.sin(Math.PI*Math.min(1,k/L*1.1))+0.6);s.E(Math.round(x),Math.round(y),r,r,k>L-2?Wt:(k%3?O[0]:O[1]));}}};
const LOOKS={
  ronin:   {robe:['#3e4a6a','#262f48'],hak:PAL.gray,sash:['#c9b18a','#8a7552'],hairStyle:'wild',hat:'kasa'},
  yari:    {robe:['#7a2f28','#4a1a18'],armor:['#3a3a44','#24242c'],lace:'#b8142a',hak:PAL.gray,hairStyle:'tied',hat:'jingasa'},
  shinobi: {robe:['#2a2a40','#17172b'],legs:'pants',pants:['#22223a','#141428'],hat:'hood',hatCol:['#2a2a40','#17172b'],mask:'#2a2a40',sash:['#3a3a52','#22223a'],
            back:(s,f,g)=>{s.R(g.bL-3,g.torY,3,1,'#b8142a');s.P(g.bL-4,g.torY+1+(f%2),'#b8142a');s.P(g.bL-5,g.torY+2,'#b8142a');}},
  archer:  {robe:['#3d5a3a','#28402a'],hak:['#d8cfbf','#a89e8c'],sash:['#7a5a2a','#4a3a1a'],hairStyle:'tied',hat:'band',
            back:(s,f,g)=>{s.R(g.bL-2,g.torY-3,2,g.torH+3,'#6b4423');s.P(g.bL-2,g.torY-4,'#ece4d7');s.P(g.bL-1,g.torY-5,'#ece4d7');s.P(g.bL-3,g.torY-5,'#ece4d7');}},
  monk:    {robe:['#ddd5c4','#a99f8c'],hak:PAL.black,sash:['#b8902a','#7a5a1a'],hat:'cowl',hatCol:['#ece4d7','#b8ae9c'],bodyW:10},
  iaido:   {robe:['#1f2a44','#141c30'],hak:['#e0d8c8','#aaa090'],sash:['#d9a648','#8a6a2a'],hairStyle:'topknot'},
  kitsune: {robe:PAL.white,hak:PAL.red,sash:['#c23a2a','#8a1a14'],collar:'#c23a2a',back:TAILS(3),
            head:(s,f,g)=>{const{R,P}=s,{hx,hy,headW:w,headH:h}=g,W0='#f4ece0',W1='#c9bca8',O='#e8803a';R(hx,hy+1,w-1,h-2,W0);R(hx,hy+1,1,h-2,W1);R(hx+w-1,hy+3,3,3,W0);P(hx+w+1,hy+3,'#000');R(hx+1,hy+h-2,w-2,1,W1);
              R(hx,hy-2,2,3,W0);P(hx+1,hy-1,O);R(hx+w-3,hy-2,2,3,W0);P(hx+w-2,hy-1,O);P(hx+w-2,hy+3,'#000');P(hx+w-3,hy+2,'#c23a2a');P(hx+w-1,hy+2,'#c23a2a');}},
  tengu:   {skin:['#c84a3a','#8a2a20'],robe:['#e8e0d0','#b0a890'],hak:['#d8d0c0','#a8a090'],sash:['#3a3a44','#24242c'],hairStyle:'wild',hair:PAL.black,hat:'tokin',geta:true,brow:'#000',
            back:(s,f,g)=>{const k=f===1||f===2?1:0;for(let i=0;i<7;i++){const y=g.torY-4+i*2+k,len=6-Math.abs(i-2);s.L(g.bL,y,g.bL-len-2,y-2+i*0.3,i%2?'#1a1418':'#2e2a30',1);}},
            front:(s,f,g)=>{s.R(g.hx+g.headW,g.hy+3,4,1,g.sk[0]);s.P(g.hx+g.headW+3,g.hy+4,g.sk[1]);s.P(g.cx-1,g.torY+1,'#d9a648');s.P(g.cx+2,g.torY+3,'#d9a648');}},
  yurei:   {skin:PAL.ghost,robe:['#f0f0fa','#b8b8d0'],legs:'tail',hairStyle:'yurei',sash:['#d8d8e8','#a8a8c0'],collar:'#d8d8e8',noFace:true},
  rokuro:  {skin:PAL.pale,robe:['#6a4a8a','#43305a'],hak:['#5a3a7a','#3a2552'],skirt:true,sash:['#e8c15a','#a8822a'],hairStyle:'geisha',collar:'#c23a2a'},
  hannya:  {skin:PAL.pale,robe:['#ece6da','#b0a898'],hak:['#7d1a26','#4a0f18'],hairStyle:'long',sash:['#c23a2a','#8a1a14'],
            head:(s,f,g)=>{const{R,P}=s,{hx,hy,headW:w,headH:h}=g;R(hx-1,hy-1,w+1,3,'#161216');R(hx-1,hy+1,3,h+7,'#161216');R(hx,hy,w,h,'#f4ead8');R(hx,hy+1,1,h-2,'#c8b896');
              P(hx+w-2,hy+3,'#e8c15a');P(hx+w-3,hy+3,'#000');R(hx+1,hy+h-3,w-1,1,'#c23a2a');P(hx+3,hy+h-2,'#ffffff');P(hx+5,hy+h-2,'#ffffff');R(hx+1,hy-3,1,3,'#e8c15a');R(hx+w-2,hy-3,1,3,'#e8c15a');P(hx,hy-4,'#e8c15a');P(hx+w-1,hy-4,'#e8c15a');}},
  oni:     {W:40,H:40,cx:19,legH:12,torH:9,obiH:3,headH:9,headW:9,bodyW:14,skin:['#c84a3a','#8a2a20'],robe:['#c84a3a','#8a2a20'],bare:true,legs:'pants',pants:['#c84a3a','#8a2a20'],sash:['#e8b030','#2a1a10'],loin:['#e8b030','#2a1a10'],hairStyle:'wild',hair:['#2a1a1a','#160c0c'],horns:true,fangs:true},
  aooni:   {W:40,H:40,cx:19,legH:12,torH:9,obiH:3,headH:9,headW:9,bodyW:14,skin:['#4a6ac8','#2a3a8a'],robe:['#4a6ac8','#2a3a8a'],bare:true,legs:'pants',pants:['#4a6ac8','#2a3a8a'],sash:['#e8b030','#2a1a10'],loin:['#e8b030','#2a1a10'],hairStyle:'wild',hair:['#e8e0d0','#a8a090'],horns:true,hornLen:4,fangs:true},
  kagemaru:{W:44,H:44,cx:19,legH:15,torH:9,obiH:2,headH:9,headW:8,bodyW:13,robe:['#6a1a26','#420f18'],armor:['#2a2a33','#18181e'],lace:'#d9a648',hak:PAL.black,sash:['#d9a648','#8a6a2a'],hat:'kabuto',hatCol:['#2a2a33','#18181e'],crest:'#e8c15a',menpo:'#a8283a',
            back:(s,f,g)=>{s.L(g.bL-2,g.obiY,g.bL-8,g.obiY-9,'#c4ccd2');s.P(g.bL-1,g.obiY+1,'#d9a648');}},
  tamamo:  {W:48,H:44,cx:24,legH:14,torH:9,obiH:2,headH:9,headW:8,bodyW:12,skin:PAL.pale,robe:['#f4ead8','#c8b896'],hak:PAL.red,skirt:true,sash:['#e8c15a','#a8822a'],collar:'#c23a2a',hairStyle:'long',hair:['#f4f0f4','#c8c0c8'],ears:['#f4f0f4','#e8803a'],back:TAILS(9,true)},
  shirayuki:{W:44,H:44,cx:20,legH:15,torH:9,obiH:2,headH:9,headW:8,bodyW:12,skin:PAL.ghost,robe:['#f6f6ff','#c6c6dc'],legs:'tail',sash:['#e0e0f0','#b0b0c8'],hairStyle:'long',hat:'tsuno',collar:'#c23a2a'},
  goki:    {W:56,H:56,cx:27,legH:17,torH:13,obiH:3,headH:12,headW:12,bodyW:20,skin:['#7a3a9a','#4a1a6a'],robe:['#7a3a9a','#4a1a6a'],bare:true,armor:['#b8902a','#7a5a1a'],legs:'pants',pants:['#3a3a44','#24242c'],sash:['#c23a2a','#8a1a14'],loin:['#2a2a33','#18181e'],hairStyle:'spiky',hair:['#f4f0e8','#c8c0b0'],horns:true,hornLen:6,hornCol:'#f4e8c8',fangs:true},
  // NPCs
  noppera: {robe:['#4a5a3a','#2e3a24'],hak:PAL.gray,hairStyle:'topknot',noFace:true},
  ramen:   {robe:['#3a5a8a','#24385a'],hak:PAL.gray,hairStyle:'topknot',hair:['#9a9aa2','#6a6a72'],hat:'hachimaki',apron:'#ece4d7',mustache:'#9a9aa2'},
  miko:    {robe:PAL.white,hak:PAL.red,skirt:true,sash:['#c23a2a','#8a1a14'],hairStyle:'long',collar:'#c23a2a',skin:PAL.pale},
  wanderer:{robe:['#5a3a2a','#3a2418'],hak:PAL.gray,sash:['#c9b18a','#8a7552'],hairStyle:'wild',hat:'kasa',hatCol:['#a8803a','#6a5020']},
  smith:   {robe:['#4a3a30','#2e241e'],hak:PAL.gray,hairStyle:'topknot',hair:['#d8d0c8','#a8a098'],hat:'band',band:'#ece4d7',apron:'#6a4a2a',mustache:'#d8d0c8',bodyW:10,
            front:(s,f,g)=>{s.R(g.hx+1,g.hy+3,g.headW-1,2,'#ece4d7');}},
  warashi: {W:28,H:28,cx:12,legH:7,torH:5,obiH:2,headH:8,headW:8,bodyW:8,skin:PAL.pale,robe:['#c23a2a','#8a1a14'],hak:['#c23a2a','#8a1a14'],skirt:true,sash:['#e8c15a','#a8822a'],hairStyle:'okappa'},
  // new foes
  teppo:   {robe:['#5a4a2a','#3a2e1a'],armor:['#3a3a44','#24242c'],lace:'#c8a050',hak:PAL.gray,hairStyle:'tied',hat:'jingasa',hatCol:['#3a2a1a','#24180e'],
            back:(s,f,g)=>{s.R(g.bL-2,g.obiY-1,2,3,'#c8a050');s.P(g.bL-3,g.obiY,'#8a6a2a');}},
  kusari:  {robe:['#3a4a2a','#24301a'],legs:'pants',pants:['#2e3a22','#1c2414'],sash:['#7a5a2a','#4a3a1a'],hat:'hood',hatCol:['#3a4a2a','#24301a'],mask:'#24301a'},
  funa:    {skin:PAL.ghost,robe:['#c8d4e0','#8a9ab0'],legs:'tail',hairStyle:'yurei',hair:['#1a2028','#0e1218'],sash:['#5a6a80','#3a4a5a'],collar:'#3a4a5a',noFace:true,hat:'tenkan'},
  // duelists
  kensei:  {robe:['#e8e0d0','#b0a890'],hak:PAL.black,sash:['#b8142a','#7a0d1c'],hairStyle:'topknot',hat:'hachimaki',collar:'#b8142a'},
  nitoryu: {robe:['#4a4a52','#2e2e36'],hak:['#2a2328','#161216'],sash:['#d9a648','#8a6a2a'],hairStyle:'wild',hair:['#3a3036','#1e181c'],hat:'band',band:'#d9a648',
            back:(s,f,g)=>{s.L(g.bL-2,g.obiY,g.bL-7,g.obiY-6,'#c4ccd2');s.P(g.bL-1,g.obiY+1,'#d9a648');}},
  sojutsu: {robe:['#2a4a7a','#1a2e50'],armor:['#3a3a44','#24242c'],lace:'#d9a648',hak:PAL.gray,hairStyle:'tied',hat:'band',band:'#ffffff'},
  ippon:   {robe:['#1a1418','#0e0a0c'],hak:['#3a1a20','#22101a'],sash:['#ece4d7','#b0a898'],hairStyle:'long',hair:['#e8e0d0','#a8a090'],closedEyes:true}
};
// which body builder draws each look, and where its feet anchor sits
const BUILD={
  kappa:{fn:kappaS,n:6},tanuki:{fn:f=>tanukiS(f,''),n:6},kasa:{fn:kasaS,n:5},onibi:{fn:onibiS,n:5},jorogumo:{fn:joroS,n:5,ax:19},gaki:{fn:gakiS,n:5},
  merchant:{fn:f=>tanukiS(f,'merchant'),n:5},gambler:{fn:f=>tanukiS(f,'gambler'),n:5},jizo:{fn:f=>jizoS(f,false),n:6},jizohat:{fn:f=>jizoS(f,true),n:5},monkey:{fn:monkeyS,n:5},
  sleeper:{fn:f=>human(Object.assign({},LOOKS.oni,{closedEyes:true}),0),n:1,ax:19},
  kamaitachi:{fn:kamaS,n:5},enenra:{fn:enenraS,n:5},usagi:{fn:usagiS,n:5},chochin:{fn:chochinS,n:5},zori:{fn:zoriS,n:5}
};
const SPR={};
function regSprite(key,frames,ax,ghostCol){
  const w=frames[0].c.width,h=frames[0].c.height;
  SPR[key]={w,h,ax,ay:h-1,frames,r:frames.map(x=>x.c),l:frames.map(x=>flipped(x.c)),wr:frames.map(x=>tinted(x.c,'#ffffff')),wl:frames.map(x=>flipped(tinted(x.c,'#ffffff'))),
    gr:tinted(frames[0].c,ghostCol||C.curse),gl:flipped(tinted(frames[0].c,ghostCol||C.curse)),dk:tinted(frames[0].c,'#2a0910')};
}
function buildSprites(){
  for(const k in LOOKS){const o=LOOKS[k];const fr=[0,1,2,3,4].map(f=>human(o,f));regSprite(k,fr,o.cx??13);}
  SPR.okiku=SPR.yurei;
  for(const k in BUILD){const b=BUILD[k];const fr=[];for(let f=0;f<b.n;f++)fr.push(b.fn(f));regSprite(k,fr,b.ax??14);}
  // rokurokubi head on its own, for the stretching-neck attack
  const hs=SPC(12,12);hs.R(2,3,7,7,PAL.pale[0]);hs.R(2,4,1,5,PAL.pale[1]);hs.P(7,6,'#000');hs.P(8,8,'#c23a2a');hs.R(1,2,8,3,'#161216');hs.R(1,4,2,5,'#161216');hs.P(6,1,'#e8c15a');outlineCanvas(hs.c);
  SPR.rokuroHead={c:hs.c,l:flipped(hs.c)};
}

// ---------- the player: user's sheet (8 frames, 32×32 native) ----------
const PLAYER_B64='__PLAYER_B64__';
// hand pixel per frame (sheet faces right). 0-2 walk, 3-5 downward slash, 6-7 side slash (arm sweeps to the left)
const PL={ready:false,hands:[[11,22],[11,23],[11,24],[20,22],[20,23],[19,23],[7,15],[6,14]],ax:13};
function loadPlayer(){
  return new Promise(res=>{
    let done=false;const fin=()=>{if(!done){done=true;res();}};
    const img=new Image();
    img.onload=()=>{try{
      const fr=[];for(let i=0;i<8;i++){const c=mk(32,32),g=c.getContext('2d');g.drawImage(img,(i%3)*32,Math.floor(i/3)*32,32,32,0,0,32,32);fr.push({c,hand:{x:PL.hands[i][0],y:PL.hands[i][1]}});}
      regSprite('player',fr,PL.ax,C.spirit);PL.ready=true;}catch(_){}fin();};
    img.onerror=fin;img.src='data:image/png;base64,'+PLAYER_B64;setTimeout(fin,2500);
  });
}
// ---------- hand-made foe sheets built on the player's body and poses (same 8-frame layout) ----------
const CHAR_B64=__CHAR_B64__;
function loadChars(){
  // every foe sheet is one strip of frames. Sword users carry the swing frames (and a clean ready pose for the windup); the rest carry walk + cast/aim
  return Promise.all(Object.entries(CHAR_B64).map(([key,d])=>new Promise(res=>{
    const img=new Image();let done=false;const fin=()=>{if(!done){done=true;res();}};
    img.onload=()=>{try{const st=[];for(let i=0;i<d.n;i++){const c=mk(d.w,d.h),g=c.getContext('2d');g.drawImage(img,i*d.w,0,d.w,d.h,0,0,d.w,d.h);st.push({c,hand:{x:d.hands[i][0],y:d.hands[i][1]}});}
      const fr=d.map.map(i=>st[i]);
      if(d.anim){const c=mk(d.w,d.h),g=c.getContext('2d');g.drawImage(st[3].c,0,0);const id=g.getImageData(0,0,d.w,d.h);for(let j=0;j<id.data.length;j+=4)if(id.data[j]===255&&id.data[j+1]===255&&id.data[j+2]===255)id.data[j+3]=0;g.putImageData(id,0,0);fr.push({c,hand:st[3].hand});}
      regSprite(key,fr,d.ax,key.startsWith('pc_')?C.spirit:undefined);if(d.anim)SPR[key].anim={wind:8,down:[3,4,5],side:[6,7]};}catch(_){}fin();};
    img.onerror=fin;img.src='data:image/png;base64,'+d.b64;setTimeout(fin,4000);}))).then(()=>{if(SPR.yurei)SPR.okiku=SPR.yurei;if(SPR.oni)SPR.sleeper=SPR.oni;});
}
function playerFallback(){const fr=[0,1,2,3,4,3,4,4].map(f=>human({robe:PAL.maroon,hak:PAL.gray,hairStyle:'spiky',hair:PAL.hair},f));regSprite('player',fr,13,C.spirit);}

// ---------- props ----------
const PROPS={};
function buildProps(){
  let s=SPC(22,14);s.R(1,2,20,4,'#9a9aa2');s.R(1,2,20,1,'#c0c0c8');s.R(3,6,16,7,'#6a6a72');s.R(3,6,2,7,'#4a4a52');s.R(1,12,20,1,'#4a4a52');outlineCanvas(s.c);PROPS.pedestal=s.c;
  s=SPC(20,16);s.R(1,4,18,10,'#7a4a2a');s.R(1,4,18,3,'#9a6a3a');s.R(1,4,2,10,'#5a3418');s.R(1,7,18,1,'#e8c15a');s.R(8,6,4,4,'#e8c15a');s.P(9,7,'#3a2a10');s.R(1,13,18,1,'#4a2a14');outlineCanvas(s.c);PROPS.chest=s.c;
  s=SPC(20,16);s.R(1,8,18,6,'#7a4a2a');s.R(1,8,2,6,'#5a3418');s.R(1,8,18,1,'#e8c15a');s.R(2,2,16,4,'#5a3418');s.R(2,2,16,1,'#9a6a3a');s.R(4,6,12,2,'#1a0e08');outlineCanvas(s.c);PROPS.chestOpen=s.c;
  s=SPC(48,40);const Rr=['#c23a2a','#8a1a14'];s.R(4,2,40,4,'#1a1418');s.R(2,1,44,2,'#1a1418');s.R(7,8,34,3,Rr[0]);s.R(10,6,4,34,Rr[0]);s.R(34,6,4,34,Rr[0]);s.R(10,6,1,34,Rr[1]);s.R(34,6,1,34,Rr[1]);s.R(22,6,4,5,'#1a1418');s.R(8,38,8,2,'#2a2a2a');s.R(32,38,8,2,'#2a2a2a');outlineCanvas(s.c);PROPS.torii=s.c;
  s=SPC(46,38);s.R(3,14,40,16,'#7a4a2a');s.R(3,14,40,2,'#9a6a3a');s.R(3,14,2,16,'#5a3418');s.R(1,4,44,3,'#3a2418');s.R(4,7,38,7,'#c23a2a');for(let x=6;x<42;x+=6)s.R(x,7,1,7,'#ece4d7');s.R(5,30,4,6,'#3a2418');s.R(37,30,4,6,'#3a2418');s.E(8,33,4,4,'#3a2418');s.E(38,33,4,4,'#3a2418');s.E(41,10,2,3,'#c23a2a');s.P(41,10,'#ffd27a');outlineCanvas(s.c);PROPS.yatai=s.c;
  s=SPC(30,32);s.R(3,10,24,3,'#3a2418');s.R(1,8,28,3,'#5a3a24');s.R(6,13,18,14,'#a87a4a');s.R(6,13,2,14,'#7a4a2a');s.R(10,17,10,9,'#3a2418');s.R(9,27,12,4,'#6a6a72');s.R(12,19,6,5,'#c23a2a');s.P(14,21,'#ece4d7');s.P(15,22,'#ece4d7');s.R(13,4,4,4,'#c23a2a');outlineCanvas(s.c);PROPS.hokora=s.c;
  s=SPC(14,24);s.R(4,2,6,4,'#9a9aa2');s.R(2,6,10,4,'#6a6a72');s.R(5,10,4,10,'#9a9aa2');s.R(5,10,1,10,'#6a6a72');s.R(3,20,8,3,'#6a6a72');s.R(5,7,4,2,'#2a2a30');outlineCanvas(s.c);PROPS.toro=s.c;
  s=SPC(10,20);s.R(2,2,6,17,'#8a8a92');s.R(2,2,2,17,'#5a5a62');s.R(3,0,4,2,'#8a8a92');for(let y=5;y<16;y+=3)s.R(5,y,2,1,'#3a3a40');outlineCanvas(s.c);PROPS.grave=s.c;
  s=SPC(32,30);s.R(3,20,26,8,'#6a6a72');s.E(16,27,13,2,'#6a6a72');for(let x=5;x<29;x+=4)s.R(x,21,1,7,'#4a4a52');s.R(3,24,26,1,'#4a4a52');s.E(16,20,13,4,'#8a8a92');s.E(16,20,10,2,'#0a0a10');
  s.R(4,2,2,20,'#5a3a24');s.R(26,2,2,20,'#5a3a24');s.R(3,2,26,2,'#3a2418');s.R(15,4,1,9,'#c8bca0');s.R(13,12,5,4,'#7a4a2a');s.R(13,12,5,1,'#a87a4a');outlineCanvas(s.c);PROPS.well=s.c;
  s=SPC(14,44);s.R(2,0,2,44,'#3a2418');s.R(4,3,9,30,'#ece4d7');s.R(4,3,9,3,'#b8142a');s.R(4,30,9,3,'#b8142a');s.R(6,9,5,1,'#1a1418');s.R(8,10,1,6,'#1a1418');s.R(6,14,5,1,'#1a1418');s.R(6,19,5,1,'#1a1418');s.R(7,20,3,5,'#1a1418');s.R(1,2,12,1,'#3a2418');outlineCanvas(s.c);PROPS.nobori=s.c;
  s=SPC(22,16);s.R(1,3,20,12,'#7a5a3a');s.R(1,3,20,2,'#9a7a4a');s.R(1,3,2,12,'#5a3a24');s.R(10,3,2,12,'#5a3a24');s.R(1,9,20,1,'#c23a2a');outlineCanvas(s.c);PROPS.box=s.c;
  s=SPC(34,30);s.R(2,6,14,22,'#3a3036');s.R(2,6,14,2,'#5a4a50');s.R(4,14,10,8,'#1a0e0a');s.R(5,15,8,6,'#ff7a2a');s.R(6,16,6,3,'#ffd27a');s.R(6,2,6,4,'#2a2228');s.R(18,16,14,4,'#4a4a52');s.R(18,16,14,1,'#7a7a82');s.R(22,20,6,6,'#3a3a42');s.R(19,26,12,2,'#2a2a30');s.R(29,13,2,4,'#c4ccd2');outlineCanvas(s.c);PROPS.forge=s.c;
  s=SPC(24,18);s.E(12,11,10,5,'#7a7a82');s.R(2,11,20,5,'#7a7a82');s.E(12,16,10,2,'#5a5a62');s.E(12,10,8,3,'#4a4a52');s.E(12,9,7,2,'#f4f0e8');s.P(10,8,'#ffffff');s.P(14,9,'#e8e0d0');outlineCanvas(s.c);PROPS.usu=s.c;
  s=SPC(18,14);s.R(1,4,16,8,'#6a3a1a');s.E(9,5,7,2,'#ff7a2a');s.E(9,4,5,1,'#ffd27a');s.R(1,10,16,2,'#3a1a0a');s.R(3,12,2,2,'#2a1a0a');s.R(13,12,2,2,'#2a1a0a');outlineCanvas(s.c);PROPS.brazier=s.c;
}

// ---------- item icons (16×16) ----------
const ICONS={};
function iconS(key){
  const s=SPC(16,16),{R,P,E,L}=s,[k,arg]=key.split(':');
  switch(k){
    case'omamori':R(4,4,8,10,arg);R(4,4,2,10,shade(arg,0.65));R(6,7,4,4,'#f1e0d2');P(7,8,arg);P(8,9,arg);R(6,1,4,3,'#f1e0d2');P(7,3,'#d9a648');P(8,3,'#d9a648');break;
    case'daruma':E(8,9,5,6,'#c23a2a');E(6,9,2,5,'#8a1a14');E(9,7,3,2,'#f1e0d2');P(8,7,'#000');P(10,7,'#000');R(7,12,3,1,'#e8c15a');break;
    case'maneki':E(8,11,4,4,'#f4f0e8');E(8,6,3,3,'#f4f0e8');P(6,3,'#f4f0e8');P(10,3,'#f4f0e8');R(11,3,2,4,'#f4f0e8');R(6,8,5,1,'#c23a2a');P(8,9,'#e8c15a');P(7,6,'#000');P(9,6,'#000');P(6,12,'#e8803a');break;
    case'hannya':E(8,9,5,6,'#f4ead8');L(4,5,2,1,'#e8c15a');L(12,5,14,1,'#e8c15a');P(6,8,'#e8c15a');P(10,8,'#e8c15a');R(5,12,7,1,'#c23a2a');P(6,13,'#ffffff');P(10,13,'#ffffff');break;
    case'kmask':E(8,8,5,5,'#f4f0e8');R(3,2,2,4,'#f4f0e8');R(11,2,2,4,'#f4f0e8');P(4,3,'#c23a2a');P(12,3,'#c23a2a');L(5,7,7,8,'#c23a2a');L(11,7,9,8,'#c23a2a');R(7,11,3,2,'#f4f0e8');P(8,12,'#000');break;
    case'fan':for(let i=0;i<5;i++)L(8,10,3+i*2.5,2,i%2?'#5a8a3a':'#7aaa4a',1);E(8,5,5,3,'#6a9a4a');L(8,10,8,15,'#6b4423');break;
    case'hyotan':E(8,11,4,4,'#e0903a');E(8,5,3,3,'#e0903a');E(7,11,2,3,'#b8682a');R(6,8,5,1,'#c23a2a');R(7,1,2,2,'#6b4423');break;
    case'chochin':E(8,8,4,5,'#c23a2a');R(5,3,7,1,'#1a1418');R(5,13,7,1,'#1a1418');for(let y=5;y<12;y+=2)R(5,y,7,1,'#a82a1e');P(7,8,'#ffd27a');P(8,8,'#ffd27a');R(8,1,1,2,'#1a1418');break;
    case'shuriken':L(3,3,13,13,'#c4ccd2',1);L(13,3,3,13,'#c4ccd2',1);R(6,6,4,4,'#8a9298');P(8,8,'#000');break;
    case'suzu':E(8,9,4,4,'#e8c15a');E(7,8,2,2,'#f8e08a');R(5,10,7,1,'#8a6a1a');P(8,12,'#3a2a0a');L(8,5,8,1,'#c23a2a');break;
    case'geta':R(3,5,10,4,'#a87a4a');R(3,5,10,1,'#c8946a');R(4,9,2,4,'#5a3a1a');R(10,9,2,4,'#5a3a1a');L(5,5,8,2,'#c23a2a');L(8,2,11,5,'#c23a2a');break;
    case'kabuto':E(8,9,5,4,'#3a3a44');E(6,8,2,3,'#24242c');R(2,11,12,2,'#2a2a33');L(5,6,3,1,'#e8c15a');L(11,6,13,1,'#e8c15a');P(8,6,'#c23a2a');break;
    case'raijin':E(8,8,6,6,'#c23a2a');E(8,8,4,4,'#e8d8b8');P(8,7,'#000');P(7,8,'#000');P(9,9,'#000');P(10,7,'#000');R(2,8,1,1,'#e8c15a');R(13,8,1,1,'#e8c15a');break;
    case'fujin':E(8,9,5,5,'#5a9a5a');E(6,9,2,4,'#3a7a3a');R(6,3,5,2,'#e8e0d0');L(6,9,10,8,'#bfe6b0');L(10,8,9,11,'#bfe6b0');break;
    case'scroll':R(3,5,10,6,'#e8dcc0');R(2,4,1,8,'#6b4423');R(13,4,1,8,'#6b4423');for(let x=5;x<12;x+=2)R(x,6,1,4,'#2a2328');P(9,9,'#c23a2a');break;
    case'fude':L(3,13,10,6,'#a87a4a',1);L(10,6,13,3,'#1a1418',1);P(13,2,'#1a1418');R(3,13,2,1,'#c23a2a');break;
    case'yata':E(8,8,5,5,'#c8a050');E(8,8,3,3,'#e8f0f8');P(7,6,'#ffffff');R(7,13,2,2,'#c23a2a');break;
    case'magatama':E(9,7,4,4,'#3aa86a');L(6,9,4,13,'#3aa86a',1);E(10,6,1,1,'#7ad8a0');P(9,7,'#000');break;
    case'tsuba':E(8,8,6,6,'#3a3a3a');E(8,8,4,4,'#5a5a5a');s.clear(7,5,2,6);P(5,5,'#e8c15a');P(11,11,'#e8c15a');break;
    case'toishi':R(2,6,12,5,'#8a8a90');R(2,6,12,1,'#b0b0b8');R(2,10,12,1,'#5a5a62');P(6,7,'#6ec8ff');P(10,8,'#6ec8ff');break;
    case'ofuda':R(5,1,6,14,'#f1e8d0');R(5,1,1,14,'#c8bca0');R(7,3,2,1,'#c23a2a');R(6,5,4,1,'#c23a2a');L(7,7,9,10,'#c23a2a');R(6,12,4,1,'#c23a2a');break;
    case'kanzashi':L(3,13,11,5,'#c4ccd2');E(12,4,2,2,'#ff4a5c');P(12,4,'#e8c15a');P(10,7,'#ff4a5c');P(9,9,'#ff4a5c');break;
    case'onibilamp':R(4,4,8,10,'#3a3a44');R(5,5,6,8,'#0a1a2a');E(8,9,2,3,'#6ec8ff');P(8,8,'#d8f6ff');R(4,2,8,2,'#24242c');R(7,0,2,2,'#24242c');break;
    case'kasa':for(let y=3;y<9;y++){const w=Math.round((y-2)*1.3);R(8-w,y,w*2,1,(y%2)?'#a8323a':'#c84a52');}L(8,8,8,14,'#6b4423');P(7,14,'#6b4423');E(10,5,1,1,'#ffffff');P(10,5,'#000');break;
    case'onigiri':for(let y=3;y<13;y++){const w=Math.round((y-2)*0.6);R(8-w,y,w*2+1,1,'#f4f0e8');}R(5,10,7,3,'#1a2a1a');P(8,6,'#d8d0c0');break;
    case'vial':R(6,2,4,2,'#a87a4a');R(5,4,6,10,'#c23a2a');R(5,4,1,10,'#8a1a14');P(8,6,'#ff8a95');R(5,4,6,1,'#e0d0d0');break;
    case'waraji':E(8,8,3,6,'#c8a868');E(7,8,2,5,'#8a6a3a');for(let y=3;y<14;y+=2)R(5,y,7,1,'#a88848');L(8,3,6,8,'#c23a2a');L(8,3,10,8,'#c23a2a');break;
    case'goen':E(8,8,6,6,'#d9a648');E(8,8,4,4,'#a8822a');E(8,8,2,2,'#000');s.clear(7,7,3,3);P(4,6,'#f8e08a');break;
    case'hachimaki':R(2,6,12,3,'#ece4d7');R(2,6,12,1,'#ffffff');E(8,7,2,1,'#c23a2a');L(13,8,15,12,'#ece4d7');L(12,8,13,13,'#ece4d7');break;
    case'bokken':L(3,13,12,4,'#a87a4a',1);L(3,13,5,11,'#3a2418',1);R(4,10,3,1,'#2a1a10');break;
    case'tabi':R(4,3,6,8,'#ece4d7');R(4,10,9,4,'#ece4d7');R(4,3,2,11,'#b8b0a0');R(9,10,1,4,'#b8b0a0');R(4,13,9,1,'#968b97');break;
    case'sakazuki':E(8,8,6,3,'#c23a2a');E(8,7,5,2,'#ece4d7');E(8,7,3,1,'#f4f0e8');R(6,10,5,2,'#8a1a14');break;
    case'soroban':R(1,3,14,10,'#5a3a24');R(2,4,12,8,'#2a1a10');R(2,6,12,1,'#5a3a24');for(let x=3;x<14;x+=2){P(x,5,'#c8a868');P(x,8,'#c8a868');P(x,10,'#c8a868');}break;
    case'juzu':for(let i=0;i<12;i++){const a=i/12*Math.PI*2;P(8+Math.round(Math.cos(a)*5),7+Math.round(Math.sin(a)*5),i%2?'#6a3a1a':'#8a5a2a');}R(7,12,2,3,'#c23a2a');P(8,15,'#c23a2a');break;
    case'tsuru':L(2,9,8,6,'#ece4d7',1);L(8,6,14,9,'#ece4d7',1);L(8,6,8,12,'#d8d0c0');L(13,9,15,6,'#ece4d7');P(15,5,'#c23a2a');break;
    case'ami':for(let y=3;y<14;y+=3)L(3,y,13,y,'#c8bca0');for(let x=3;x<14;x+=3)L(x,3,x,13,'#c8bca0');P(3,3,'#5a3a24');P(13,3,'#5a3a24');break;
    case'kendama':L(8,4,8,14,'#a87a4a',1);R(5,8,7,2,'#a87a4a');E(8,3,3,3,'#c23a2a');P(7,2,'#ff8a95');break;
    case'ika':L(8,1,8,15,'#a87a4a');E(8,6,3,4,'#e0903a');E(7,6,1,3,'#b8682a');for(let x=5;x<12;x+=2)L(x,9,x,13,'#e0903a');P(9,5,'#3a1a0a');break;
    case'furin':E(8,6,4,3,'#bfe6f8');R(4,8,9,1,'#6ec8ff');L(8,9,8,12,'#ece4d7');R(6,12,4,3,'#ece4d7');P(7,13,'#c23a2a');R(8,1,1,2,'#3a2a20');break;
    case'kiseru':L(2,12,13,5,'#3a2418');R(12,3,3,3,'#c8a050');R(1,11,3,2,'#c8a050');P(13,2,'#968b97');P(14,1,'#968b97');break;
    case'tenugui':R(3,4,10,9,'#3a6ac8');for(let y=5;y<13;y+=2)for(let x=4;x<13;x+=3)P(x+(y%4?1:0),y,'#ece4d7');R(3,4,10,1,'#5a8ae8');break;
    case'w_katana':L(2,14,13,3,'#c4ccd2',1);P(13,3,'#ffffff');L(2,14,4,12,'#2a1a10',1);R(4,11,3,1,'#d9a648');break;
    case'w_reserve':L(2,14,7,9,'#c4ccd2',1);L(7,9,9,8,'#8a9298');L(2,14,4,12,'#2a1a10',1);R(4,11,3,1,'#d9a648');P(9,7,'#ff4a5c');break;
    case'w_yari':L(1,15,12,4,'#8a5a2e',1);L(12,4,15,1,'#c4ccd2',1);P(15,0,'#ffffff');R(11,4,3,1,'#c23a2a');break;
    case'w_kanabo':L(3,14,6,11,'#3a2418',1);for(let i=0;i<7;i++){const x=6+i,y=11-i;R(x-1,y-1,3,3,'#2b2b2b');}for(let i=1;i<7;i+=2)P(6+i,10-i,'#8a8a8a');break;
    case'w_kusari':L(3,3,6,9,'#8a5a2e',1);L(3,3,8,1,'#c4ccd2',1);for(let i=0;i<6;i++)P(7+i,10+Math.round(Math.sin(i)*1.5),i%2?'#8a8a92':'#c4ccd2');E(13,12,1,1,'#5a5a62');break;
    case'w_nodachi':L(1,15,15,1,'#c4ccd2',1);P(15,0,'#ffffff');L(1,15,4,12,'#2a1a10',1);R(4,11,3,1,'#d9a648');P(3,13,'#d9a648');break;
    case'w_tessen':for(let i=0;i<6;i++){const a=-2.4+i*0.36;L(4,12,4+Math.cos(a)*10,12+Math.sin(a)*10,i%2?'#8a1024':'#b8142a',1);}L(4,12,13,3,'#2a2a30');L(4,12,-1,7,'#2a2a30');E(8,7,1,1,'#ece4d7');break;
    case'w_bo':L(1,15,15,1,'#c8a070',1);L(1,15,2,14,'#8a8a92',1);L(14,2,15,1,'#8a8a92',1);P(8,8,'#a8804e');break;
    case'w_kama':L(3,14,9,6,'#8a5a2e',1);L(9,6,10,5,'#5a5a64');L(10,5,13,4,'#c4ccd2',1);L(13,4,14,6,'#c4ccd2');P(14,7,'#ffffff');break;
    case'w_naginata':L(1,15,11,5,'#6b4423',1);R(10,5,2,1,'#d9a648');L(12,4,14,2,'#c4ccd2',1);L(14,2,15,0,'#c4ccd2');P(15,0,'#ffffff');break;
    case'w_musket':L(1,12,15,5,'#5a5a62',1);L(1,12,6,10,'#6b4423',1);R(0,12,3,3,'#6b4423');P(15,5,'#2a2a2a');P(8,9,'#c8a050');break;
    case'tools':L(3,13,9,4,'#c4ccd2');P(9,3,'#ffffff');L(2,14,4,12,'#3a2a1c');for(const [dx,dy] of [[0,-2],[0,2],[-2,0],[2,0]])P(11+dx,11+dy,'#c4ccd2');P(11,11,'#5a5a62');break;
    case'plate':E(8,8,6,5,'#f4f4f8');E(8,8,4,3,'#d8e0f0');E(8,8,6,5,'#f4f4f8');E(8,8,5,4,'#3a5aa8');E(8,8,4,3,'#f4f4f8');P(6,7,'#3a5aa8');P(10,9,'#3a5aa8');break;
    default:E(8,8,5,5,'#ffffff');
  }
  outlineCanvas(s.c);return s.c;
}
function icon(key){if(!ICONS[key])ICONS[key]=iconS(key);return ICONS[key];}

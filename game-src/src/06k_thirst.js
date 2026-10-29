// ================= Bloodthirst and technique skins, drawn in the game =================
// thirstSkin() is what you wear; the try-on stage can lend one for a frame through TS_LEND.
let TS_LEND=null;
function thirstSkin(){if(TS_LEND)return TS_LEND;const st=cosState(),it=COS[st.eq.t];return it&&cosOwned(it.key)?it:COS['t:crimson'];}
function trng(seed){let s=seed>>>0;return()=>((s=(s*1664525+1013904223)>>>0)/4294967296);}
const tsRain=i=>['#ff4a5c','#ff9a3a','#ffe066','#5ad8a0','#9ad8ff','#b48cff'][(Math.floor(S.gt*10)+(i||0))%6];
// the grown blade: dark, bright, a glint every seventh pixel
function tsGrow(i){const G=thirstSkin().grow;if(G==='rainbow')return tsRain(i);return i%7===0?G[2]:(i%3===2?G[1]:G[0]);}
function tsGlint(){const G=thirstSkin().grow;return G==='rainbow'?'#ffffff':G[2];}
function tsCut(){const T=thirstSkin();return[T.core,setCol(T.edge,0)];}
function tsOrb(){const T=thirstSkin(),G=T.grow;if(G==='rainbow')return[tsRain(1),tsRain(2),tsRain(3),'#3a2030','#ffffff'];return[G[1],G[1],G[0],tsDark(G[0]),G[2]];}
function tsDark(h){const n=parseInt(h.slice(1),16),r=(n>>16)&255,g=(n>>8)&255,b=n&255,f=0.55;return'#'+[r,g,b].map(v=>Math.round(v*f).toString(16).padStart(2,'0')).join('');}
function thirstAura(S,t,cx,cy,k){
  if(k<=0)return;const C=S.ac,R=trng(11),pick=i=>C[i%C.length];
  switch(S.aura){
    case'drip':for(let i=0;i<8;i++){const x0=cx-9+R()*18,ph=(t*0.9+R())%1;pset(x0,cy-14+ph*22,pick(i),k*(1-ph));if(ph<0.3)pset(x0,cy-15+ph*22,C[2],k)}break;
    case'ink':for(let i=0;i<6;i++){const ph=(t*0.6+R())%1,a=R()*6.28,r=6+ph*8;pdisc(cx+Math.cos(a)*r,cy-6+Math.sin(a)*r*0.7,ph<0.5?1:0,pick(i),k*(1-ph))}break;
    case'petal':for(let i=0;i<10;i++){const ph=(t*0.5+R())%1,a=R()*6.28+t*1.5,r=8+R()*4;const x=cx+Math.cos(a)*r,y=cy+2-ph*26;pset(x,y,pick(i),k*(1-ph*0.6));if(i%2)pset(x+1,y,pick(i+1),k*(1-ph))}break;
    case'frost':for(let i=0;i<10;i++){const ph=(t*0.4+R())%1,x=cx-12+R()*24,y=cy+4-ph*16;pset(x,y,ph<0.5?'#ffffff':C[0],k*(1-ph));if(i%4===0){pset(x+1,y,C[1],k*0.6);pset(x-1,y,C[1],k*0.6)}}for(let x=-9;x<=9;x++)if((x+Math.floor(t*6))%3)pset(cx+x,cy+12,C[1],k*0.7);break;
    case'leaf':for(let i=0;i<8;i++){const ph=(t*0.7+R())%1,a=R()*6.28+ph*5,r=6+ph*9;const x=cx+Math.cos(a)*r,y=cy-4+Math.sin(a)*r*0.6;pset(x,y,C[0],k);pset(x+1,y-1,C[1],k)}break;
    case'ember':for(let i=0;i<12;i++){const ph=(t*1.1+R())%1,x=cx-10+R()*20+Math.sin(t*4+i)*2,y=cy+8-ph*26;if((Math.floor(t*14)+i)%3)pset(x,y,pick(i),k*(1-ph))}break;
    case'smoke':for(let i=0;i<7;i++){const ph=(t*0.5+R())%1,x=cx-8+R()*16+Math.sin(t*2+i)*3,y=cy+6-ph*20;pdisc(x,y,Math.round(1+ph*2),pick(i),k*(0.85-ph*0.7))}break;
    case'flame':for(let i=0;i<16;i++){const ph=(t*1.6+R())%1,x0=cx-10+R()*20,x=x0+Math.sin(t*9+i)*1.5,y=cy+12-ph*(14+R()*14);pset(x,y,ph<0.3?C[2]:ph<0.6?C[1]:C[0],k*(1-ph*0.8))}break;
    case'moon':{const r=15;for(let i=0;i<30;i++){const a=i/30*6.28+t*0.4;if(i%3)pset(cx+Math.cos(a)*r,cy-2+Math.sin(a)*r*0.35-12,C[0],k*0.8)}for(let i=0;i<6;i++){const ph=(t*0.8+R())%1,x=cx-12+R()*24,y=cy-16+R()*24;if(Math.sin(t*6+i*2)>0.3){pset(x,y,'#ffffff',k);pset(x+1,y,C[0],k*0.6);pset(x-1,y,C[0],k*0.6);pset(x,y+1,C[0],k*0.6);pset(x,y-1,C[0],k*0.6)}}}break;
    case'gold':for(let i=0;i<12;i++){const ph=(t*0.55+R())%1,x=cx-12+R()*24+Math.sin(t*3+i)*2,y=cy-18+ph*30;pset(x,y,(Math.floor(t*12)+i)%2?C[0]:C[1],k*(1-ph*0.5))}break;
    case'fox':for(let i=0;i<4;i++){const a=t*2.4+i/4*6.28,x=cx+Math.cos(a)*14,y=cy-4+Math.sin(a)*6;const front=Math.sin(a)>0;for(let j=0;j<4;j++){pset(x-Math.cos(a)*j*0.8,y-j-Math.sin(t*10+i)*0.5,j<1?C[2]:j<3?C[0]:C[1],k*(front?1:0.55)*(1-j*0.18))}}break;
    case'bolt':{for(let b=0;b<2;b++){const sd=Math.floor(t*7)+b*13,Rb=trng(sd);if(Rb()<0.55){let x=cx-10+Rb()*20,y=cy-18;for(let s=0;s<6;s++){const nx=x+(Rb()-0.5)*6,ny=y+5;pline(x,y,nx,ny,s%2?C[0]:C[1],k);x=nx;y=ny}}}
      // Raijin's ring of drums floating around the shoulders
      for(let i=0;i<6;i++){const a=t*0.8+i/6*6.28,x=cx+Math.cos(a)*16,y=cy-14+Math.sin(a)*4;pdisc(x,y,1,'#c8203a',k);pset(x,y,'#ffe066',k)}}break;
    case'ring':{const r=12+Math.sin(t*3)*1.5;for(let i=0;i<40;i++){const a=i/40*6.28;pset(cx+Math.cos(a)*r,cy-4+Math.sin(a)*r*0.9,i%5?C[0]:C[1],k*0.8)}pdisc(cx+Math.cos(t)*r,cy-4+Math.sin(t)*r*0.9,1,C[1],k)}break;
    case'void':{for(let i=0;i<10;i++){const ph=(t*0.7+R())%1,a=R()*6.28,r=18-ph*16;pset(cx+Math.cos(a)*r,cy-4+Math.sin(a)*r*0.8,ph<0.5?'#ffffff':'#000000',k)}const r=10+Math.sin(t*5)*1;for(let i=0;i<24;i++){const a=i/24*6.28;pset(cx+Math.cos(a)*r,cy-4+Math.sin(a)*r*0.8,i%2?'#000000':'#ffffff',k*0.5)}}break;
    case'firework':for(let f=0;f<2;f++){const ph=(t*0.7+f*0.5)%1,ox=cx-10+f*20,oy=cy-18+f*4;if(ph<0.25)pset(ox,oy+18-ph*72,'#ffffff',k);else{const u=(ph-0.25)/0.75;for(let i=0;i<12;i++){const a=i/12*6.28;pset(ox+Math.cos(a)*u*9,oy+Math.sin(a)*u*9+u*u*4,C[(i+f)%C.length],k*(1-u))}}}break;
    case'dragon':{// a jade dragon spirit coiling around you
      for(let j=0;j<26;j++){const a=t*2.2-j*0.28,x=cx+Math.cos(a)*(13-j*0.12),y=cy-2+Math.sin(a)*5-j*0.55+Math.sin(t*3+j*0.5)*1;const front=Math.sin(a)>0;
        pset(x,y,j===0?C[2]:j%3===0?C[1]:C[0],k*(front?1:0.45));if(j<20&&j%2===0)pset(x,y-1,C[1],k*(front?0.9:0.35));if(j===0){pset(x+1,y-1,C[2],k);pset(x-1,y-2,'#ffffff',k)}}}break;
  }
}
function thirstAct(S,u,cx,cy,t){
  if(u<0||u>1)return;const C=S.ac,R=trng(5),k=1-u;
  switch(S.act){
    case'splash':case'inksplash':for(let i=0;i<18;i++){const a=R()*6.28,v=6+R()*16;pdisc(cx+Math.cos(a)*v*u,cy+Math.sin(a)*v*u+u*u*10,S.act==='inksplash'&&u<0.4?1:0,C[i%C.length],k)}break;
    case'petalburst':case'leafgust':for(let i=0;i<20;i++){const a=R()*6.28,v=8+R()*16;pset(cx+Math.cos(a)*v*u+Math.sin(t*8+i)*2,cy+Math.sin(a)*v*u+u*6,C[i%C.length],k);pset(cx+Math.cos(a)*v*u+1,cy+Math.sin(a)*v*u+u*6,C[(i+1)%C.length],k)}break;
    case'shatter':for(let i=0;i<16;i++){const a=i/16*6.28,v=4+u*18;pline(cx+Math.cos(a)*v*0.6,cy+Math.sin(a)*v*0.6,cx+Math.cos(a)*v,cy+Math.sin(a)*v,i%2?C[0]:C[2],k)}break;
    case'flare':for(let i=0;i<22;i++){const x=cx-12+R()*24,y=cy+8-u*(18+R()*20);pset(x,y,C[i%3],k);pset(x,y+1,C[(i+1)%3],k*0.6)}{const r=u*20;for(let i=0;i<32;i++){const a=i/32*6.28;pset(cx+Math.cos(a)*r,cy+Math.sin(a)*r*0.5+8,C[0],k)}}break;
    case'smokepuff':for(let i=0;i<10;i++){const a=R()*6.28,v=4+R()*10;pdisc(cx+Math.cos(a)*v*(0.4+u),cy+Math.sin(a)*v*(0.4+u)*0.6,Math.round(1+u*3),C[i%3],k)}break;
    case'moonrise':{const r=4+u*18;for(let i=0;i<36;i++){const a=i/36*6.28;pset(cx+Math.cos(a)*r,cy-4+Math.sin(a)*r,i%2?C[0]:'#ffffff',k)}pdisc(cx,cy-24+u*4,Math.round(3-u*2),'#ffffff',k)}break;
    case'goldrain':for(let i=0;i<24;i++){const x=cx-16+R()*32,y=cy-30+u*36*(0.6+R()*0.6);pset(x,y,i%2?C[0]:C[1],k)}break;
    case'wispring':for(let i=0;i<8;i++){const a=i/8*6.28+u*3,r=4+u*16;pdisc(cx+Math.cos(a)*r,cy-4+Math.sin(a)*r*0.6,1,i%2?C[0]:C[2],k)}break;
    case'thunder':{// a bolt from the sky onto your head, then a ring
      if(u<0.45){let x=cx+2,y=cy-40;const Rb=trng(Math.floor(t*30));for(let s=0;s<8;s++){const nx=x+(Rb()-0.5)*8,ny=y+5.5;pline(x,y,nx,ny,s%2?'#ffffff':C[0]);pline(x+1,y,nx+1,ny,C[1],0.6);x=nx;y=ny}}
      const r=u*22;for(let i=0;i<36;i++){const a=i/36*6.28;pset(cx+Math.cos(a)*r,cy+10+Math.sin(a)*r*0.35,i%3?C[0]:C[1],k)}}break;
    case'eclipse':{const r=12;pdisc(cx,cy-6,Math.round(r*Math.min(1,u*2)),'#1a0a10',k);for(let i=0;i<44;i++){const a=i/44*6.28;pset(cx+Math.cos(a)*(r+1),cy-6+Math.sin(a)*(r+1),C[0],k)}}break;
    case'inversion':{const r=u*28;for(let i=0;i<48;i++){const a=i/48*6.28;pset(cx+Math.cos(a)*r,cy-4+Math.sin(a)*r*0.8,'#ffffff',k);pset(cx+Math.cos(a)*(r+1),cy-4+Math.sin(a)*(r+1)*0.8,'#000000',k)}}break;
    case'fireworks':for(let f=0;f<3;f++){const ox=cx-14+f*14,oy=cy-14-f%2*6;for(let i=0;i<14;i++){const a=i/14*6.28,v=u*12;pset(ox+Math.cos(a)*v,oy+Math.sin(a)*v+u*u*5,C[(i+f)%C.length],k)}}break;
    case'roar':{for(let w=0;w<3;w++){const r=4+u*24-w*5;if(r<2)continue;for(let i=0;i<40;i++){const a=i/40*6.28;pset(cx+Math.cos(a)*r,cy-4+Math.sin(a)*r*0.7,w===0?C[0]:C[1],k*(1-w*0.25))}}}break;
  }
}

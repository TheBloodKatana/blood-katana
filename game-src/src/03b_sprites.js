// ================= sprites for the new realms: foes, lords, mini bosses, hub NPCs =================
// a builder scaled up with crisp pixels (used for the big versions of small yōkai)
function scaledB(fn,k){return f=>{const r=fn(f),c=r.c,w=Math.round(c.width*k),h=Math.round(c.height*k),o=mk(w,h),g=o.getContext('2d');g.imageSmoothingEnabled=false;g.drawImage(c,0,0,w,h);return{c:o,hand:{x:Math.round(r.hand.x*k),y:Math.round(r.hand.y*k)}};};}
function wispS(f,pal){ // hitodama: a soul flame
  const s=SPC(32,32),{P,E,L}=s,[C3,C1,C2]=pal;const fl=[0,1,-1,1,2,0][f]||0;
  E(15,21,6,6,C3);E(15,21,5,5,C1);E(15,22,3,3,C2);
  for(let i=0;i<9;i++){const t=i/8;P(Math.round(15-t*6+Math.sin(t*5+f)*2),Math.round(26+t*4),i<4?C1:C3);}
  for(const [x,h] of [[12,6],[15,9+fl],[18,6-fl]]){L(x,17,x+(fl>0?1:-1),17-h,C1);P(x+(fl>0?1:-1),17-h,C2);}
  P(13,21,'#06202a');P(17,21,'#06202a');
  outlineCanvas(s.c,'#061a1e');return{c:s.c,hand:{x:15,y:21}};
}
function sumiS(f){ // sumi-bōzu: a monk made of ink, with a brush
  const s=SPC(32,32),{R,P,E,L}=s,K=['#1a1418','#0a0608','#3a3036'];const w=[0,1,-1,1,2,0][f]||0,bob=(f===1||f===2)?1:0;
  E(15,24,9,6,K[1]);E(15,18+bob,8,9,K[0]);E(13,16+bob,4,5,K[2]);
  for(let i=0;i<6;i++)P(7+i*3,29+((i+f)%2),K[1]);
  E(18,14+bob,2,2,'#f4ead8');P(19,14+bob,'#000');E(13,14+bob,1,1,'#f4ead8');R(14,19+bob,5,1,'#5a0a14');
  let hand;if(f===3){L(20,18+bob,22,10+bob,K[0],1);hand={x:22,y:9+bob};}else if(f===4){R(21,17+bob,6,2,K[0]);hand={x:27,y:17+bob};}else{R(21,18+bob,2,5,K[0]);hand={x:22,y:23+bob};}
  L(hand.x,hand.y,hand.x+3,hand.y-5,'#a87a4a');P(hand.x+3,hand.y-6,'#1a1418');P(hand.x+4,hand.y-7,'#1a1418');
  for(let i=0;i<3;i++)P(10+i*5+w,27+(i%2),'#000');
  outlineCanvas(s.c,'#000');return{c:s.c,hand};
}
function beastS(f,v){ // four-legged yōkai seen from the side: raijū, nue
  const big=v==='nue',W=big?48:36,H=big?40:30,s=SPC(W,H),{R,P,E,L}=s,k=big?1.35:1;
  const pal=v==='nue'?{fur:['#c8902a','#8a5a1a'],str:'#2a1a10',tail:['#3a7a3a','#1e4a1e']}:{fur:['#dce8ff','#8aa0d8'],str:'#ffe66a',tail:['#ffe66a','#c8a020']};
  const bob=(f===1||f===2)?1:0,st=f===1?2:f===2?-2:f===4?3:0,base=H-2,cx=Math.round(W*0.45),by=base-Math.round(9*k);
  for(const [lx,ph] of [[cx-Math.round(8*k),1],[cx-Math.round(4*k),-1],[cx+Math.round(5*k),-1],[cx+Math.round(9*k),1]]){const x=lx+ph*st;L(lx,by+2,x,base,pal.fur[1]);L(lx+1,by+2,x+1,base,pal.fur[ph>0?1:0]);}
  E(cx,by-bob,Math.round(11*k),Math.round(5*k),pal.fur[0]);E(cx-2,by+2-bob,Math.round(9*k),Math.round(2*k),pal.fur[1]);
  if(v==='nue')for(let x=cx-10;x<cx+12;x+=4)L(x,by-6-bob,x+1,by+3-bob,pal.str);else{L(cx-6,by-4-bob,cx-2,by-1-bob,pal.str);L(cx-2,by-1-bob,cx+1,by-5-bob,pal.str);L(cx+1,by-5-bob,cx+5,by-1-bob,pal.str);}
  // tail
  const tx=cx-Math.round(11*k);for(let i=0;i<Math.round(10*k);i++){const t=i/(10*k),x=tx-i,y=by-2-Math.round(Math.sin(t*3+f*0.8)*4*k)-Math.round(t*5*k);P(x,y-bob,pal.tail[i%3?0:1]);P(x,y+1-bob,pal.tail[1]);}
  if(v==='nue'){const hx=tx-Math.round(10*k),hy=by-Math.round(9*k)-bob;E(hx,hy,2,2,pal.tail[0]);P(hx-1,hy,'#ffe66a');P(hx-2,hy+1,'#c23a2a');}
  else{const zx=tx-Math.round(10*k),zy=by-Math.round(7*k)-bob;L(zx,zy,zx+2,zy+2,'#ffffff');L(zx+2,zy+2,zx,zy+4,'#ffffff');}
  // head
  const hx=cx+Math.round(11*k),hy=by-Math.round(5*k)-bob;
  if(v==='nue'){E(hx,hy,Math.round(5*k),Math.round(5*k),'#5a3a2a');E(hx+2,hy+1,Math.round(3*k),Math.round(3*k),'#d06a5a');P(hx+3,hy-1,'#ffe66a');P(hx+4,hy-1,'#000');R(hx+2,hy+3,4,1,'#2a0a0a');P(hx-3,hy-5,'#5a3a2a');P(hx-4,hy-6,'#5a3a2a');}
  else{E(hx,hy,4,3,pal.fur[0]);R(hx+2,hy,4,2,pal.fur[0]);P(hx+5,hy+1,'#2a2a40');P(hx+2,hy-1,'#ffe66a');P(hx,hy-4,pal.fur[0]);P(hx-1,hy-5,pal.fur[1]);}
  let hand={x:hx+Math.round(5*k),y:hy+2};if(f===4&&v==='raiju')for(let i=0;i<4;i++)L(cx-12+i*6,by-10-i,cx-8+i*6,by-6-i,'#ffe66a');
  outlineCanvas(s.c);return{c:s.c,hand};
}
function umiS(f){ // umibōzu: a vast dark monk rising out of the sea
  const s=SPC(56,56),{R,P,E}=s,D=['#1a2a3a','#0e1822','#2a4258'];const w=[0,1,-1,1,2,0][f]||0;
  E(28,50,22,6,'#1a4a50');for(let x=6;x<50;x+=3)P(x,46+((x+f)%3),'#5a9aa0');
  E(28,32,18,18,D[0]);E(22,28,10,12,D[2]);E(28,16+w,13,11,D[0]);E(24,14+w,6,6,D[2]);
  E(23,18+w,3,3,'#f4f0e0');E(34,18+w,3,3,'#f4f0e0');P(24,18+w,'#000');P(35,18+w,'#000');
  if(f===3||f===4)E(28,26+w,5,3,'#060a0e');
  for(let i=0;i<8;i++)P(10+i*5,40+((i+f)%2),'#3a6a7a');
  outlineCanvas(s.c,'#06080c');return{c:s.c,hand:{x:44,y:30}};
}
function skelS(f){ // gashadokuro: a starving skeleton the size of a gate
  const s=SPC(56,56),{R,P,E,L}=s,B=['#e8e0cc','#a8a090','#5a5448'];const bob=(f===1||f===2)?1:0,up=f===3,str=f===4;
  for(let i=0;i<6;i++){const y=26+i*4+bob;L(18,y,38,y,B[i%2]);}R(27,24+bob,2,22,B[1]);
  E(28,48,10,3,B[2]);L(20,48,16,54,B[1]);L(36,48,40,54,B[1]);
  const hy=6+bob;E(28,hy+8,10,9,B[0]);E(24,hy+8,3,3,'#1a0e0a');E(32,hy+8,3,3,'#1a0e0a');P(24,hy+8,'#ff3a3a');P(32,hy+8,'#ff3a3a');R(25,hy+14,7,2,B[1]);for(let x=25;x<32;x+=2)P(x,hy+16,B[0]);P(28,hy+11,'#1a0e0a');
  L(18,26+bob,10,34+bob,B[0]);L(10,34+bob,8,44+bob,B[1]);
  let hand;if(up){L(38,26+bob,44,14+bob,B[0]);L(44,14+bob,40,4+bob,B[1]);hand={x:40,y:4+bob};}else if(str){L(38,26+bob,48,28+bob,B[0]);L(48,28+bob,55,26+bob,B[1]);hand={x:55,y:26+bob};}else{L(38,26+bob,46,34+bob,B[0]);L(46,34+bob,48,44+bob,B[1]);hand={x:48,y:44+bob};}
  for(const [x,y] of [[hand.x-2,hand.y],[hand.x+2,hand.y],[hand.x,hand.y+2]])P(x,y,B[0]);
  outlineCanvas(s.c,'#120a08');return{c:s.c,hand};
}
function dummyS(f){ // the straw training dummy
  const s=SPC(32,32),{R,P,E,L}=s,ST=['#c8a868','#8a6a3a'];const sh=f===4?1:0;
  R(15,18,2,13,'#5a3a24');R(11,30,10,1,'#3a2418');
  E(16+sh,15,6,6,ST[0]);E(14+sh,15,3,5,ST[1]);for(let y=10;y<21;y+=2)L(11+sh,y,21+sh,y,ST[1]);
  R(6+sh,12,20,2,'#5a3a24');R(13+sh,5,7,7,'#f1e8d0');R(13+sh,5,1,7,'#c8bca0');P(17+sh,7,'#000');P(15+sh,7,'#000');R(15+sh,10,3,1,'#c23a2a');
  outlineCanvas(s.c);return{c:s.c,hand:{x:24,y:13}};
}
// new heads and backs
const CROW=(s,f,g)=>{const{R,P}=s,{hx,hy,headW:w,headH:h}=g;R(hx-1,hy,w+1,h,'#1a1820');R(hx-1,hy+1,2,h-2,'#0e0c12');R(hx+w,hy+3,3,2,'#e8b030');P(hx+w+2,hy+5,'#a87a20');P(hx+w-2,hy+2,'#ff3a3a');P(hx+1,hy-1,'#1a1820');P(hx+3,hy-2,'#1a1820');};
const WINGS=(s,f,g)=>{const k=f===1||f===2?1:0;for(let i=0;i<8;i++){const y=g.torY-6+i*2+k,len=8-Math.abs(i-2);s.L(g.bL,y,g.bL-len-3,y-3+i*0.3,i%2?'#1a1820':'#2e2a36',1);}};
const SHIELD=(s,f,g)=>{const x=g.bR+1,y=g.torY-2;s.R(x,y,5,g.torH+g.legH-2,'#6a4a2a');s.R(x,y,1,g.torH+g.legH-2,'#8a6a3a');s.R(x+4,y,1,g.torH+g.legH-2,'#3a2414');s.R(x+1,y+3,3,3,'#c23a2a');s.P(x+2,y+4,'#e8c15a');for(let yy=y+1;yy<y+g.torH+g.legH-2;yy+=4)s.P(x+2,yy+8,'#3a2414');};
const OX=(s,f,g)=>{const{R,P,E}=s,{hx,hy,headW:w,headH:h}=g;E(hx+Math.floor(w/2),hy+Math.floor(h/2),Math.ceil(w/2),Math.ceil(h/2),'#6a3a1e');R(hx+w-2,hy+h-4,4,3,'#a87a5a');P(hx+w+1,hy+h-3,'#000');P(hx+w-2,hy+2,'#ff3a3a');
  R(hx-3,hy-1,3,1,'#e8dcc0');P(hx-4,hy-2,'#e8dcc0');R(hx+w,hy-1,3,1,'#e8dcc0');P(hx+w+3,hy-2,'#e8dcc0');P(hx+w,hy+h-1,'#e8c15a');};
const HORSE=(s,f,g)=>{const{R,P}=s,{hx,hy,headW:w,headH:h}=g;R(hx,hy,w,h,'#8a8a92');R(hx+w-1,hy+3,4,h-2,'#8a8a92');R(hx,hy+1,1,h-2,'#5a5a62');P(hx+w+2,hy+h-1,'#000');P(hx+w-2,hy+2,'#ffe66a');R(hx-1,hy-2,2,3,'#5a5a62');R(hx+2,hy-3,2,3,'#8a8a92');R(hx-2,hy+1,2,h,'#2a2a2a');};
const EBOSHI=(s,f,g)=>{const{R,P}=s,{hx,hy,headW:w,headH:h,sk}=g;R(hx,hy,w,h,sk[0]);R(hx,hy+1,1,h-2,sk[1]);P(hx+w-2,hy+Math.floor(h/2),'#000');P(hx+w-1,hy+Math.floor(h/2)+2,sk[1]);R(hx-1,hy-6,w-1,7,'#1a1418');R(hx+1,hy-8,w-4,2,'#1a1418');R(hx-1,hy,w+1,1,'#2a2228');R(hx,hy+h-2,3,3,'#1a1418');};
const ENMA=(s,f,g)=>{const{R,P}=s,{hx,hy,headW:w,headH:h,sk}=g;R(hx,hy,w,h,sk[0]);R(hx,hy+1,1,h-2,sk[1]);P(hx+w-2,hy+4,'#ffe66a');P(hx+w-3,hy+4,'#000');R(hx-1,hy+h-4,w+2,5,'#1a1418');R(hx+w-3,hy+h-3,2,1,'#c23a2a');
  R(hx-2,hy-4,w+4,4,'#1a1418');R(hx-2,hy-4,w+4,1,'#d9a648');R(hx+1,hy-7,w-2,3,'#1a1418');P(hx+Math.floor(w/2),hy-3,'#ffe66a');s.P(hx+Math.floor(w/2),hy-2,'#c23a2a');};
const SIXARMS=(s,f,g)=>{const sk=g.sk;for(let i=0;i<2;i++){const y=g.torY+1+i*3,sw=(f===3?-2:f===4?2:0)*(i?1:-1);s.L(g.bL,y,g.bL-6,y-3+sw,sk[0],1);s.L(g.bR,y,g.bR+6,y-3-sw,sk[0],1);s.P(g.bL-7,y-4+sw,'#c4ccd2');s.P(g.bR+7,y-4-sw,'#c4ccd2');s.P(g.bL-8,y-5+sw,'#c4ccd2');s.P(g.bR+8,y-5-sw,'#c4ccd2');}};
const DRUMS=(s,f,g)=>{const cx=g.cx,cy=g.torY-2,r=Math.round(g.bodyW*0.95);for(let i=0;i<8;i++){const a=i/8*Math.PI*2+f*0.2;s.E(Math.round(cx+Math.cos(a)*r),Math.round(cy+Math.sin(a)*r*0.8),2,2,i%2?'#c23a2a':'#e8c15a');}for(let i=0;i<24;i++){const a=i/24*Math.PI*2;s.P(Math.round(cx+Math.cos(a)*r),Math.round(cy+Math.sin(a)*r*0.8),'#6b4423');}};
const WINDBAG=(s,f,g)=>{const cx=g.bL-3,cy=g.torY-4;s.E(cx,cy,6,5,'#e8e0d0');s.E(cx-1,cy+1,4,3,'#b8b0a0');s.L(cx+3,cy-4,cx+6,cy-6,'#c23a2a');for(let i=0;i<3;i++)s.L(cx-8-i*2,cy-2+i*3,cx-5-i*2,cy-1+i*3,'#bfe6b0');};
const BLADEHALF=(s,f,g)=>{s.L(g.bL-1,g.obiY+1,g.bL-9,g.obiY-11,'#ff4a5c');s.L(g.bL-2,g.obiY+1,g.bL-10,g.obiY-11,'#8a0d1c');s.P(g.bL,g.obiY+2,'#d9a648');};
const WEAPONRACK=(s,f,g)=>{for(let i=0;i<5;i++){const x=g.bL-4+i*3,top=g.torY-7-(i%2)*2;s.L(x,g.obiY,x+(i-2),top,i%2?'#c4ccd2':'#8a5a2e');s.P(x+(i-2),top-1,'#ffffff');}};
const LOTUS=(s,f,g)=>{const cx=g.cx,cy=g.torY-1;for(let i=0;i<10;i++){const a=i/10*Math.PI*2+f*0.15,r=g.bodyW;s.E(Math.round(cx+Math.cos(a)*r),Math.round(cy+Math.sin(a)*r*0.7),2,1,i%2?'#ff4a5c':'#c23a2a');}};
const BANNER=(s,f,g)=>{s.R(g.bL-3,g.torY-14,1,g.torH+16,'#3a2418');s.R(g.bL-9,g.torY-14+(f%2),6,10,'#ece4d7');s.R(g.bL-9,g.torY-14+(f%2),6,2,'#c23a2a');s.R(g.bL-7,g.torY-10+(f%2),2,4,'#1a1418');};
const BUNDLE=(s,f,g)=>{s.E(g.bR+2,g.torY+4,3,3,'#f4ead8');s.P(g.bR+3,g.torY+3,'#e5a56b');s.P(g.bR+4,g.torY+3,'#000');};
Object.assign(LOOKS,{
  tate:     {robe:['#7a2f28','#4a1a18'],armor:['#3a3a44','#24242c'],lace:'#b8142a',hak:PAL.gray,hairStyle:'tied',hat:'jingasa',front:SHIELD},
  karasu:   {robe:['#2a2830','#16141a'],legs:'pants',pants:['#22202a','#121016'],sash:['#c23a2a','#7a1a14'],head:CROW,back:WINGS,geta:true},
  datsue:   {skin:['#d8c8b8','#a89888'],robe:['#e8e4dc','#b0aca4'],hak:['#d8d4cc','#a8a49c'],skirt:true,sash:['#6a5a4a','#4a3a2a'],hairStyle:'yurei',hair:['#e8e8ec','#b8b8c0'],collar:'#a89888'},
  sendo:    {skin:PAL.ghost,robe:['#2a3a5a','#18243a'],hak:['#3a4a6a','#24304a'],sash:['#c9b18a','#8a7552'],hairStyle:'wild',hair:['#1a2028','#0e1218'],hat:'kasa',hatCol:['#a8803a','#6a5020']},
  yukionna: {skin:PAL.ghost,robe:['#f6f8ff','#c0c8e0'],legs:'tail',sash:['#a8c8f0','#6a8ac0'],hairStyle:'long',hair:['#161a22','#0a0c12'],collar:'#a8c8f0'},
  tsurara:  {W:28,H:28,cx:12,legH:7,torH:5,obiH:2,headH:8,headW:8,bodyW:8,skin:['#c8e0f8','#8ab0d8'],robe:['#6a90c0','#4a6a98'],hak:['#6a90c0','#4a6a98'],skirt:true,sash:['#e8f4ff','#a8c8e0'],hairStyle:'spiky',hair:['#f4fbff','#c8e0f0']},
  frostoni: {W:40,H:40,cx:19,legH:12,torH:9,obiH:3,headH:9,headW:9,bodyW:14,skin:['#c8dcec','#8aa8c4'],robe:['#c8dcec','#8aa8c4'],bare:true,legs:'pants',pants:['#c8dcec','#8aa8c4'],sash:['#4a6a9a','#2a3a5a'],loin:['#4a6a9a','#2a3a5a'],hairStyle:'wild',hair:['#f4fbff','#c8dce8'],horns:true,hornLen:4,hornCol:'#6ab0e0',fangs:true},
  jikininki:{skin:['#8a9480','#5a6252'],robe:['#8a9480','#5a6252'],bare:true,legs:'pants',pants:['#4a3a2a','#2e2418'],sash:['#4a3a2a','#2e2418'],loin:['#4a3a2a','#2e2418'],fangs:true,eye:'#ff3a3a',bodyW:8},
  shiryo:   {skin:['#a8b4a0','#6e7a68'],robe:['#3a4a3a','#24301f'],armor:['#4a5a4a','#2e3a2e'],lace:'#8a2a2a',hak:PAL.black,sash:['#5a4a2a','#3a2e1a'],hat:'kabuto',hatCol:['#3a4a3a','#24301f'],crest:'#8a8a6a',eye:'#9affd0'},
  kiba:     {skin:['#a8b4a0','#6e7a68'],robe:['#4a2a2a','#2e1818'],armor:['#3a3a44','#24242c'],lace:'#c8a050',hak:PAL.black,sash:['#c8a050','#8a6a2a'],head:HORSE},
  yamabushi:{robe:['#e8e0d0','#b0a890'],hak:['#d8d0c0','#a8a090'],sash:['#e8803a','#a85a1a'],hairStyle:'wild',hair:PAL.black,hat:'tokin',mustache:'#2a2328',front:(s,f,g)=>{for(let i=0;i<3;i++)s.P(g.cx-2+i*2,g.torY+2,'#e8803a');}},
  hatamoto: {robe:['#1a1418','#0e0a0c'],armor:['#2a2228','#161216'],lace:'#d9a648',hak:PAL.black,sash:['#d9a648','#8a6a2a'],hat:'kabuto',hatCol:['#1a1418','#0e0a0c'],crest:'#d9a648',menpo:'#2a2228'},
  kunoichi: {skin:PAL.pale,robe:['#3a2a4a','#22182e'],legs:'pants',pants:['#2e2240','#1a1226'],hat:'hood',hatCol:['#3a2a4a','#22182e'],mask:'#22182e',sash:['#c23a2a','#7a1a14'],back:(s,f,g)=>{s.R(g.bL-3,g.torY,3,1,'#c23a2a');s.P(g.bL-4,g.torY+1+(f%2),'#c23a2a');}},
  // mini bosses and lords
  shihan:   {W:40,H:40,cx:17,legH:14,torH:8,obiH:2,headH:9,headW:8,bodyW:11,robe:['#f4f0e8','#c0b8a8'],hak:PAL.black,sash:['#1a1418','#0e0a0c'],hairStyle:'topknot',hair:['#c8c0b8','#9a928a'],mustache:'#c8c0b8',brow:'#c8c0b8'},
  fuma:     {W:40,H:44,cx:18,legH:16,torH:9,obiH:2,headH:9,headW:8,bodyW:11,robe:['#24321e','#141c10'],legs:'pants',pants:['#1c2618','#10160c'],hat:'hood',hatCol:['#24321e','#141c10'],mask:'#141c10',sash:['#7a1a14','#4a0e0a'],eye:'#ff3a3a',back:(s,f,g)=>{s.R(g.bL-3,g.torY-1,3,1,'#c23a2a');s.P(g.bL-4,g.torY+(f%2),'#c23a2a');s.P(g.bL-5,g.torY+1,'#c23a2a');}},
  benkei:   {W:52,H:52,cx:24,legH:17,torH:11,obiH:3,headH:10,headW:9,bodyW:16,robe:['#2a2328','#161216'],hak:PAL.black,sash:['#ece4d7','#b0a898'],hat:'cowl',hatCol:['#ece4d7','#b8ae9c'],back:WEAPONRACK,brow:'#000'},
  tanukid:  {}, kamaosa:{}, joro:{}, gakiking:{}, sumibozu:{}, umibozu:{}, gasha:{}, nue:{}, raiju:{}, hitodama:{}, sumi:{}, dummy:{},
  kiyohime: {W:44,H:48,cx:20,legH:18,torH:9,obiH:2,headH:9,headW:8,bodyW:12,skin:PAL.pale,robe:['#e8f0e0','#a8b8a0'],legs:'tail',sash:['#3a8a5a','#1e5a3a'],hairStyle:'long',hair:['#161216','#0a080a'],horns:true,hornLen:3,hornCol:'#d8f0c0',collar:'#3a8a5a'},
  onryo:    {W:40,H:44,cx:18,legH:16,torH:9,obiH:2,headH:9,headW:8,bodyW:11,skin:PAL.ghost,robe:['#f0e0e4','#c0a8b0'],legs:'tail',hairStyle:'yurei',sash:['#a8283a','#6a1a24'],collar:'#a8283a',noFace:true},
  enma:     {W:56,H:56,cx:27,legH:17,torH:13,obiH:3,headH:12,headW:12,bodyW:20,skin:['#c84a3a','#8a2a20'],robe:['#1a1418','#0e0a0c'],hak:['#2a2228','#161216'],sash:['#d9a648','#8a6a2a'],collar:'#d9a648',head:ENMA},
  gozu:     {W:44,H:44,cx:20,legH:14,torH:10,obiH:3,headH:10,headW:10,bodyW:15,skin:['#a8402e','#7a2a1e'],robe:['#a8402e','#7a2a1e'],bare:true,legs:'pants',pants:['#2a2a33','#18181e'],sash:['#e8b030','#2a1a10'],loin:['#2a2a33','#18181e'],head:OX},
  mezu:     {W:44,H:44,cx:20,legH:14,torH:10,obiH:3,headH:9,headW:8,bodyW:14,skin:['#4a6ac8','#2a3a8a'],robe:['#4a6ac8','#2a3a8a'],bare:true,legs:'pants',pants:['#2a2a33','#18181e'],sash:['#e8b030','#2a1a10'],loin:['#2a2a33','#18181e'],head:HORSE},
  datsueba: {W:44,H:44,cx:20,legH:15,torH:9,obiH:2,headH:9,headW:8,bodyW:13,skin:['#d8c8b8','#a89888'],robe:['#e8e4dc','#b0aca4'],hak:['#d8d4cc','#a8a49c'],skirt:true,sash:['#6a5a4a','#4a3a2a'],hairStyle:'yurei',hair:['#e8e8ec','#b8b8c0'],collar:'#a89888',fangs:true,eye:'#ffe66a'},
  sendochf: {W:40,H:44,cx:18,legH:16,torH:9,obiH:2,headH:9,headW:8,bodyW:12,skin:PAL.ghost,robe:['#2a3a5a','#18243a'],hak:['#3a4a6a','#24304a'],sash:['#c9b18a','#8a7552'],hairStyle:'wild',hair:['#1a2028','#0e1218'],hat:'kasa',hatCol:['#7a5a2a','#4a3418'],eye:'#9affd0'},
  nureonna: {W:44,H:48,cx:20,legH:18,torH:9,obiH:2,headH:9,headW:8,bodyW:12,skin:['#c8e0c8','#8ab08a'],robe:['#3a6a5a','#244a3a'],legs:'tail',sash:['#1e3a2e','#10241a'],hairStyle:'long',hair:['#0e1a16','#06100c'],collar:'#1e3a2e',eye:'#ffe66a'},
  yukijo:   {W:44,H:48,cx:20,legH:18,torH:9,obiH:2,headH:9,headW:8,bodyW:12,skin:PAL.ghost,robe:['#f6f8ff','#c0c8e0'],legs:'tail',sash:['#a8c8f0','#6a8ac0'],hairStyle:'long',hair:['#161a22','#0a0c12'],hat:'tsuno',collar:'#a8c8f0'},
  guren:    {W:48,H:48,cx:23,legH:17,torH:9,obiH:2,headH:9,headW:8,bodyW:12,skin:PAL.pale,robe:['#c23a2a','#8a1a14'],hak:['#a82a22','#6a1410'],skirt:true,sash:['#f4ead8','#c8b896'],hairStyle:'long',hair:['#f4f0f4','#c8c0c8'],back:LOTUS,collar:'#f4ead8'},
  tsurarah: {W:40,H:44,cx:18,legH:16,torH:9,obiH:2,headH:9,headW:8,bodyW:11,skin:['#e0f0ff','#a8c8e8'],robe:['#6a90c0','#4a6a98'],hak:['#5a80b0','#3a5a88'],skirt:true,sash:['#e8f4ff','#a8c8e0'],hairStyle:'geisha',hair:['#f4fbff','#c8e0f0'],collar:'#e8f4ff'},
  frostgen: {W:48,H:48,cx:23,legH:15,torH:11,obiH:3,headH:10,headW:10,bodyW:16,skin:['#c8dcec','#8aa8c4'],robe:['#c8dcec','#8aa8c4'],bare:true,armor:['#4a6a9a','#2a3a5a'],legs:'pants',pants:['#3a4a6a','#24304a'],sash:['#4a6a9a','#2a3a5a'],hairStyle:'spiky',hair:['#f4fbff','#c8dce8'],horns:true,hornLen:5,hornCol:'#6ab0e0',fangs:true},
  shokujin: {W:44,H:44,cx:20,legH:15,torH:10,obiH:2,headH:9,headW:9,bodyW:13,skin:['#8a9480','#5a6252'],robe:['#6a5a4a','#463a30'],hak:['#4a3a2a','#2e2418'],sash:['#8a2a22','#5a1a14'],hat:'cowl',hatCol:['#6a5a4a','#463a30'],fangs:true,eye:'#ff3a3a',front:(s,f,g)=>{for(let i=0;i<5;i++)s.P(g.cx-2+i,g.torY+3+(i%2),'#3a2418');}},
  ubume:    {W:40,H:44,cx:18,legH:16,torH:9,obiH:2,headH:9,headW:8,bodyW:11,skin:PAL.ghost,robe:['#f0f0fa','#b8b8d0'],legs:'tail',hairStyle:'yurei',sash:['#d8d8e8','#a8a8c0'],collar:'#d8d8e8',noFace:true,front:BUNDLE},
  ashura:   {W:52,H:52,cx:24,legH:16,torH:12,obiH:3,headH:10,headW:10,bodyW:16,skin:['#c84a3a','#8a2a20'],robe:['#c84a3a','#8a2a20'],bare:true,armor:['#d9a648','#8a6a2a'],legs:'pants',pants:['#3a2a44','#22182e'],sash:['#d9a648','#8a6a2a'],hairStyle:'spiky',hair:['#1a1418','#0e0a0c'],back:SIXARMS,brow:'#000',fangs:true},
  shirgen:  {W:44,H:48,cx:20,legH:16,torH:10,obiH:2,headH:9,headW:9,bodyW:13,skin:['#a8b4a0','#6e7a68'],robe:['#3a2a2a','#241818'],armor:['#5a4a2a','#3a2e1a'],lace:'#c23a2a',hak:PAL.black,sash:['#c8a050','#8a6a2a'],hat:'kabuto',hatCol:['#5a4a2a','#3a2e1a'],crest:'#e8c15a',menpo:'#3a2e1a',back:BANNER,eye:'#9affd0'},
  kibamu:   {W:44,H:48,cx:20,legH:16,torH:10,obiH:2,headH:9,headW:8,bodyW:13,skin:['#a8b4a0','#6e7a68'],robe:['#6a1a1a','#420e0e'],armor:['#2a2a33','#18181e'],lace:'#c23a2a',hak:PAL.black,sash:['#c23a2a','#7a1a14'],head:HORSE,back:BANNER},
  sojobo:   {W:48,H:48,cx:23,legH:16,torH:10,obiH:2,headH:10,headW:9,bodyW:13,skin:['#c84a3a','#8a2a20'],robe:['#e8e0d0','#b0a890'],hak:['#3a3a44','#24242c'],sash:['#d9a648','#8a6a2a'],hairStyle:'wild',hair:['#f4f0e8','#c8c0b0'],hat:'tokin',geta:true,brow:'#f4f0e8',mustache:'#f4f0e8',back:WINGS,
             front:(s,f,g)=>{s.R(g.hx+g.headW,g.hy+3,5,1,g.sk[0]);s.P(g.hx+g.headW+4,g.hy+4,g.sk[1]);}},
  raijin:   {W:52,H:52,cx:25,legH:16,torH:12,obiH:3,headH:10,headW:10,bodyW:16,skin:['#c84a3a','#8a2a20'],robe:['#c84a3a','#8a2a20'],bare:true,legs:'pants',pants:['#e8b030','#2a1a10'],sash:['#e8b030','#2a1a10'],loin:['#e8b030','#2a1a10'],hairStyle:'wild',hair:['#f4f0e8','#c8c0b0'],horns:true,hornLen:3,fangs:true,back:DRUMS},
  karasuchf:{W:40,H:44,cx:18,legH:15,torH:9,obiH:2,headH:9,headW:8,bodyW:12,robe:['#1a1820','#0e0c12'],armor:['#3a3a44','#24242c'],lace:'#c23a2a',legs:'pants',pants:['#22202a','#121016'],sash:['#c23a2a','#7a1a14'],head:CROW,back:WINGS,geta:true},
  fujin:    {W:48,H:48,cx:23,legH:15,torH:11,obiH:3,headH:10,headW:10,bodyW:15,skin:['#5a9a5a','#3a6a3a'],robe:['#5a9a5a','#3a6a3a'],bare:true,legs:'pants',pants:['#e8e0d0','#b0a890'],sash:['#c23a2a','#7a1a14'],loin:['#e8e0d0','#b0a890'],hairStyle:'wild',hair:['#e8e0d0','#a8a090'],horns:true,hornLen:2,fangs:true,back:WINDBAG},
  usurper:  {W:48,H:48,cx:22,legH:16,torH:10,obiH:2,headH:9,headW:9,bodyW:13,robe:['#1a0a0e','#0e0408'],armor:['#2a1418','#160a0c'],lace:'#ff4a5c',hak:PAL.black,sash:['#b8142a','#7a0d1c'],hat:'kabuto',hatCol:['#1a0a0e','#0e0408'],crest:'#ff4a5c',menpo:'#b8142a',back:BLADEHALF},
  onmyoji:  {W:44,H:48,cx:20,legH:17,torH:10,obiH:2,headH:9,headW:8,bodyW:13,skin:PAL.pale,robe:['#f4f0f8','#c0b8d0'],hak:['#5a3a7a','#3a2552'],sash:['#5a3a7a','#3a2552'],collar:'#5a3a7a',head:EBOSHI,front:(s,f,g)=>{s.R(g.hand?g.hand.x:g.bR,g.hand?g.hand.y-4:g.torY,2,4,'#f1e8d0');s.P(g.hand?g.hand.x:g.bR,g.hand?g.hand.y-3:g.torY+1,'#c23a2a');}},
  hatachf:  {W:44,H:44,cx:20,legH:15,torH:10,obiH:2,headH:9,headW:9,bodyW:13,robe:['#1a1418','#0e0a0c'],armor:['#3a3a44','#24242c'],lace:'#d9a648',hak:PAL.gray,sash:['#d9a648','#8a6a2a'],hat:'kabuto',hatCol:['#2a2228','#161216'],crest:'#d9a648',front:SHIELD},
  kagero:   {W:40,H:44,cx:18,legH:16,torH:9,obiH:2,headH:9,headW:8,bodyW:11,skin:PAL.pale,robe:['#2a1a2e','#160e1a'],legs:'pants',pants:['#22162a','#120a16'],hairStyle:'long',hair:['#161216','#0a080a'],sash:['#c23a2a','#7a1a14'],mask:'#160e1a',back:(s,f,g)=>{s.R(g.bL-4,g.torY,4,1,'#c23a2a');s.P(g.bL-5,g.torY+1+(f%2),'#c23a2a');s.P(g.bL-6,g.torY+2,'#c23a2a');}},
  // hub people
  archivist:{skin:PAL.pale,robe:['#3a2a4a','#22182e'],hak:['#c9b18a','#8a7552'],skirt:true,sash:['#d9a648','#8a6a2a'],hairStyle:'geisha',hair:['#f4f0f4','#c8c0c8'],ears:['#f4f0f4','#e8803a'],back:TAILS(2)},
  monk2:    {robe:['#d9a648','#a87a2a'],hak:['#8a5a2a','#5a3a1a'],sash:['#c23a2a','#7a1a14'],closedEyes:true,bodyW:10},
  armorer:  {robe:['#4a4a52','#2e2e36'],hak:PAL.gray,armor:['#3a3a44','#24242c'],lace:'#c8a050',hairStyle:'tied',hair:['#8a8a92','#5a5a62'],mustache:'#8a8a92',hat:'band',band:'#c23a2a'}
});
// the placeholder entries above are drawn by their own builders, not the humanoid one
for(const k of ['tanukid','kamaosa','joro','gakiking','sumibozu','umibozu','gasha','nue','raiju','hitodama','sumi','dummy'])delete LOOKS[k];
Object.assign(BUILD,{
  hitodama:{fn:f=>wispS(f,['#1a7a6a','#5ae8c8','#d8fff4']),n:5},sumi:{fn:sumiS,n:5},raiju:{fn:f=>beastS(f,'raiju'),n:5,ax:16},nue:{fn:f=>beastS(f,'nue'),n:5,ax:22},
  umibozu:{fn:umiS,n:5,ax:28},gasha:{fn:skelS,n:5,ax:28},dummy:{fn:dummyS,n:5,ax:16},
  tanukid:{fn:scaledB(f=>tanukiS(f,'merchant'),1.5),n:5,ax:21},kamaosa:{fn:scaledB(kamaS,1.4),n:5,ax:20},joro:{fn:scaledB(joroS,1.3),n:5,ax:25},
  gakiking:{fn:scaledB(gakiS,1.7),n:5,ax:24},sumibozu:{fn:scaledB(sumiS,1.4),n:5,ax:21}
});
// ---------- props for the new realms, the rest place and the hub ----------
function buildProps2(){
  let s=SPC(30,40);const B=['#3a2a1c','#24180e'];s.R(13,14,4,25,B[0]);s.R(13,14,1,25,B[1]);s.L(15,18,6,8,B[0],1);s.L(6,8,3,2,B[0]);s.L(15,16,24,6,B[0],1);s.L(24,6,27,3,B[0]);s.L(15,24,22,18,B[0]);s.L(10,13,8,7,B[1]);s.R(9,38,12,2,'#1a120a');outlineCanvas(s.c);PROPS.deadtree=s.c;
  s=SPC(40,20);for(let x=2;x<38;x++)s.P(x,4+Math.round(Math.sin(x/38*Math.PI)*4),'#c8a868');for(let x=2;x<38;x++)s.P(x,5+Math.round(Math.sin(x/38*Math.PI)*4),'#8a6a3a');for(let i=0;i<4;i++){const x=7+i*8,y=8+Math.round(Math.sin(x/38*Math.PI)*4);s.R(x,y,3,6,'#f4f0e8');s.P(x+1,y+6,'#f4f0e8');s.P(x,y+3,'#c8bca0');}s.R(1,2,2,16,'#5a5a52');s.R(37,2,2,16,'#5a5a52');outlineCanvas(s.c);PROPS.shimenawa=s.c;
  s=SPC(72,70);s.R(33,34,6,34,'#3a2418');s.R(33,34,2,34,'#24160e');s.L(36,40,20,26,'#3a2418',1);s.L(36,38,54,24,'#3a2418',1);s.L(36,48,48,40,'#3a2418');
  for(let i=0;i<70;i++){const a=Math.random()*Math.PI*2,r=Math.sqrt(Math.random()),x=36+Math.cos(a)*30*r,y=24+Math.sin(a)*18*r;s.E(Math.round(x),Math.round(y),2,2,pick(['#f2a7b8','#e88aa0','#ffd1dc','#d8708a']));}s.R(26,67,20,2,'#1a100a');outlineCanvas(s.c);PROPS.sakura=s.c;
  s=SPC(96,64);s.R(10,30,76,30,'#5a2a1a');s.R(10,30,76,3,'#7a3a22');s.R(14,36,68,24,'#2a1610');for(let x=18;x<80;x+=12)s.R(x,36,2,24,'#7a3a22');s.R(4,22,88,6,'#1a1418');s.R(0,26,96,3,'#2a2228');s.R(8,16,80,6,'#1a1418');s.R(20,10,56,6,'#1a1418');s.R(40,6,16,4,'#1a1418');s.R(44,24,8,6,'#d9a648');s.R(40,48,16,12,'#c23a2a');s.R(47,48,2,12,'#7a1a14');s.R(8,60,80,3,'#6a6a72');outlineCanvas(s.c);PROPS.shrine=s.c;
  s=SPC(44,34);s.R(2,8,40,3,'#5a3a24');s.R(2,24,40,3,'#5a3a24');s.R(3,8,3,24,'#3a2418');s.R(38,8,3,24,'#3a2418');
  const ic=['w_katana','w_yari','w_kanabo','w_kusari','w_musket'];ic.forEach((k,i)=>{s.g.drawImage(icon(k),2+i*8,8);});outlineCanvas(s.c);PROPS.rack=s.c;
  s=SPC(30,26);s.R(3,12,24,12,'#6a6a72');s.R(3,12,24,2,'#8a8a92');s.R(3,12,2,12,'#4a4a52');s.R(9,6,12,6,'#7a7a82');s.R(10,4,2,3,'#ece4d7');s.R(18,4,2,3,'#ece4d7');s.P(10,3,'#ffd27a');s.P(18,3,'#ffd27a');s.R(13,8,4,3,'#c23a2a');s.P(14,9,'#ffd27a');outlineCanvas(s.c);PROPS.altar=s.c;
  s=SPC(52,46);const Rr=['#c23a2a','#8a1a14'];s.R(4,2,44,4,'#1a1418');s.R(2,1,48,2,'#1a1418');s.R(8,9,36,3,Rr[0]);s.R(11,6,4,40,Rr[0]);s.R(37,6,4,40,Rr[0]);s.R(11,6,1,40,Rr[1]);s.R(37,6,1,40,Rr[1]);s.R(23,6,6,5,'#d9a648');s.R(9,44,8,2,'#2a2a2a');s.R(35,44,8,2,'#2a2a2a');outlineCanvas(s.c);PROPS.gate=s.c;
}

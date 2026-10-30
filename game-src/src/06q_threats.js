// ================= new-threat cards: the first time a run meets something tricky, the game pauses and shows it =================
// Same card and stage as the lessons. Each one is shown once ever (META.threats), a moment after the foe arrives.
const THREATS={
  grab:{name:'Grabs',jp:'掴',len:3,text:'Pink lunges marked 掴 are grabs. No parry or counter stops them: dash through, or get out of the way.'},
  phase:{name:'Spirit cuts',jp:'霊',len:3.2,text:'Purple spirit cuts pass straight through your trails, so they cannot be parried. Dash or step aside.'},
  shield:{name:'Shields',jp:'盾',len:3.4,text:'A shield only faces one way and turns slowly to follow you. Get behind it, hook it, or smash through with a heavy weapon.'},
  erase:{name:'Ink monks',jp:'墨',len:3.2,text:'Ink monks send out a black wave that wipes your trails and blots your brush, so you cannot trace for a moment. Cut them down first.'},
  glyph:{name:'Glyphs',jp:'符',len:3.6,text:'This lord paints a glyph and is warded while it does. Trace the same shape before it finishes and the glyph cuts them instead. Miss, and it lands on you.'},
};
for(const k in THREATS)DEMO_LEN['th_'+k]=THREATS[k].len;
function threatOf(e){const T=e.T||{},p=T.pats||[],o=[];if(p.includes('grab')||p.includes('devour'))o.push('grab');if(T.phase)o.push('phase');if(T.shield)o.push('shield');if(T.erase)o.push('erase');return o;}
const threatSeen=id=>!!(META.threats&&META.threats[id]);
function threatQueue(id,delay){
  if(!THREATS[id]||threatSeen(id)||S.pro||S.tut||S.inHub||(S.gm&&S.gm.id==='rush'))return;
  S.threatQ=S.threatQ||[];if(!S.threatQ.some(q=>q.id===id))S.threatQ.push({id,at:S.gt+(delay==null?1.1:delay)});
}
function threatSpawned(e){if(!e||e.illusion||e.T.dummy||e.practice)return;for(const id of threatOf(e))threatQueue(id);}
function threatTick(){
  const q=S.threatQ;if(!q||!q.length||S.demo||S.dialog||S.choosing||S.dead>0||!S.running||S.mode!=='run'||S.paused||S.trace)return;
  const i=q.findIndex(x=>S.gt>=x.at);if(i<0)return;const {id}=q.splice(i,1)[0];if(threatSeen(id))return;
  META.threats=META.threats||{};META.threats[id]=1;saveMeta();threatCard(id);
}
function threatCard(id,onDone){
  const th=THREATS[id];if(!th||!$('demoOv')){onDone&&onDone();return;}
  S.demo={id:'th_'+id,t:0,open:0,touch:!!S.touchUI,onDone,last:performance.now()};S.swipe=null;S.trace=null;try{keys.clear();}catch(_){}
  $('demoTitle').textContent=th.name;$('demoTxt').textContent=th.text;$('demoK').textContent=`${tr('New threat')} · ${th.jp}`;
  demoBtn();$('demoOv').hidden=false;sfx('gong');requestAnimationFrame(demoFrame);
}
// ---------- the scenes, on the lesson stage with the game's own drawing ----------
function tdDash(x0,x1,y,t0,t1,t){const k=ease(seg(t,t0,t1)),x=x0+(x1-x0)*k,on=t>t0&&t<t1+0.25,g=on?[1,2,3].map(i=>x-(x1-x0)*0.12*i).filter(v=>(x1>x0?v>x0:v<x0)):null;return{x,ghosts:g};}
function tdDots(pts,col,k,a){for(let i=1;i<pts.length;i++){const A=pts[i-1],B=pts[i],n=Math.ceil(dist(A,B)/10);for(let j=0;j<=n;j++){if(j%2)continue;const u=j/n;pset(LX(A.x+(B.x-A.x)*u),LY(A.y+(B.y-A.y)*u),col,a==null?0.9:a);}}
  if(k!=null){const B=pts[pts.length-1],A=pts[0],L=dist(A,B)*k;let d=0;for(let i=1;i<pts.length&&d<L;i++){const P0=pts[i-1],P1=pts[i],sg=dist(P0,P1),u=Math.min(1,(L-d)/sg);pline(LX(P0.x),LY(P0.y),LX(P0.x+(P1.x-P0.x)*u),LY(P0.y+(P1.y-P0.y)*u),col,1,2);d+=sg;}}}
function tdShield(x,y,a,raised){const r=(13+7)/PX,cx=LX(x),cy=LY(y-10);for(let i=-5;i<=5;i++){const an=a+i*0.16;pset(cx+Math.cos(an)*r,cy+Math.sin(an)*r*0.8,raised?C.steel:'#5a5a62',raised?0.95:0.5);pset(cx+Math.cos(an)*(r+1),cy+Math.sin(an)*(r+1)*0.8,'#000',0.5);}}
const THREAT_SCENE={
  th_grab(t,y){const fx0=300,line=tdLine(fx0-20,y-24,90,y-24),lunge=seg(t,1.0,1.35),fx=fx0-lunge*170,d=tdDash(130,340,y,0.95,1.2,t);
    if(t<1.0){tdDots(line,GRABC,seg(t,0.1,1.0));if(Math.floor(t*10)%2)ptext('掴',LX(fx0),LY(y-62),GRABC,8);}
    if(lunge>0&&lunge<1)tdCut(tdLine(fx0-20,y-24,fx-10,y-24),1,{team:'e',col:GRABC,core:'#ffd0e0',w:7});
    tdFoe('datsue',fx,y,{frame:t<1?3:4,face:-1});tdHero(d.x,y,{ghosts:d.ghosts,face:t>1.3?-1:1});
    if(t>1.25&&t<2.2)ptext('DASH',LX(d.x),LY(y-60),C.spirit,8);},
  th_phase(t,y){const hx=120,fx=310,trail=tdLine(212,y-90,212,y+30),k=seg(t,1.0,1.7),dodge=ease(seg(t,1.05,1.3))*-40;
    if(t>0.25)tdCut(trail,t<0.45?seg(t,0.25,0.45):t<2.2?1:1+(t-2.2)*1.5);
    tdFoe('yurei',fx,y,{frame:t<1?3:4});
    if(t<1.0)tdDots(tdLine(fx-24,y-24,80,y-24),C.phase,seg(t,0.3,1.0));
    if(k>0)tdCut(tdLine(fx-24,y-24,80,y-24),k*1.1,{team:'e',col:C.phase,core:'#f0e8ff',w:6});
    if(k>0.4&&k<1&&Math.floor(t*8)%2)ptext('THROUGH',LX(212),LY(y-100),C.phase,8);
    tdHero(hx,y+dodge,{frame:0});},
  th_shield(t,y){const fx=250,go=tdDash(110,360,y,1.2,1.5,t),hx=go.x,face=t>1.5?-1:1,want=Math.atan2(0,hx-fx),cur=t<1.2?Math.PI:Math.PI+clamp((t-1.5)*0.9,0,0.9)*(hx>fx?-1:1);
    const front=t<1.2;tdFoe('tate',fx,y,{face:hx<fx?-1:1,white:t>1.95&&t<2.1});tdShield(fx,y,cur,true);
    tdHero(hx,y,{ghosts:go.ghosts,face,frame:(t>0.5&&t<0.65)||(t>1.85&&t<2.0)?7:0});
    if(t>0.5)tdCut(tdArc(hx+14*face,y-30,40,-1.0,1.0),seg(t,0.5,0.62)+Math.max(0,t-0.62)*1.5,{tap:true});
    if(t>0.6&&t<1.1){tdHitFx(fx-30,y-26,0.6,t,[C.steel,C.white]);ptext('BLOCKED',LX(fx-30),LY(y-70),C.curse,8);}
    if(t>1.85){tdCut(tdArc(hx-14,y-30,40,Math.PI+1.0,Math.PI-1.0),seg(t,1.85,1.97)+Math.max(0,t-1.97)*1.5,{tap:true});tdHitFx(fx+10,y-28,1.95,t);}},
  th_erase(t,y){const hx=110,fx=320,wave=seg(t,1.0,1.8),R=wave*240,trailX=230,gone=R>fx-trailX;
    if(t>0.25&&!gone)tdCut(tdLine(trailX,y-90,trailX,y+30),seg(t,0.25,0.45));
    if(wave>0&&wave<1){const cx=LX(fx),cy=LY(y),r=R/PX;for(let i=0;i<72;i++){const an=i/72*Math.PI*2,c=Math.cos(an),s=Math.sin(an);pset(cx+c*(r+1),cy+s*(r+1)*0.6,'#7a5aa0',0.9);pset(cx+c*r,cy+s*r*0.6,'#1a1024');pset(cx+c*(r-1),cy+s*(r-1)*0.6,'#1a1024');pset(cx+c*(r-2),cy+s*(r-2)*0.6,'#000',0.6);}}
    const d=tdDash(hx,fx-60,y,2.0,2.25,t);tdFoe('sumi',fx,y,{white:t>2.35&&t<2.5,dead:t>2.5?seg(t,2.5,3.1):0});
    if(wave>0&&wave<0.45){const k=1-wave/0.45;for(let i=0;i<10;i++){const an=t*6+i/10*Math.PI*2,r=(1-k)*24+4;pdisc(LX(fx)+Math.cos(an)*r,LY(y-14)+Math.sin(an)*r*0.8,1,'#1a1024',0.8);}}
    if(gone&&t<2.0&&Math.floor(t*6)%2)ptext('墨 · BRUSH BLOTTED',LX(200),LY(y-100),C.phase,8);
    tdHero(d.x,y,{ghosts:d.ghosts,frame:t>2.3&&t<2.45?6:0});if(t>2.3)tdCut(tdLine(d.x+20,y-28,fx+30,y-28),seg(t,2.3,2.4)+Math.max(0,t-2.4)*1.5);tdHitFx(fx,y-28,2.38,t);},
  th_glyph(t,y){const B=BOSSES.kagemaru||Object.values(BOSSES)[0],look=B.look,bx=300,sh=SHAPE_PTS.v?'v':Object.keys(SHAPE_PTS)[0],P0=SHAPE_PTS[sh],k=seg(t,0.2,2.2),fired=t>1.9;
    const by=y+14;shadow(bx,by,16);drawSpr(look,0,bx,by,-1,fired&&t>2.05&&t<2.2);
    const R=15,cx=Math.round(LX(bx))-44,cy=30;
    if(!fired){flush();lx.fillStyle='rgba(8,4,6,0.6)';lx.fillRect(cx-R-6,cy-R-6,R*2+12,R*2+12);lx.fillStyle='#5a0a14';lx.fillRect(cx-R-6,cy-R-6,R*2+12,1);lx.fillRect(cx-R-6,cy+R+5,R*2+12,1);
      const tot=P0.length-1,upto=k*tot;for(let i=1;i<=Math.ceil(upto)&&i<=tot;i++){const f=Math.min(1,upto-(i-1)),a=P0[i-1],b=P0[i],ex=a[0]+(b[0]-a[0])*f,ey=a[1]+(b[1]-a[1])*f;pline(cx+a[0]*R,cy+a[1]*R,cx+ex*R,cy+ey*R,'#e0203a',1,2);}
      if(Math.floor(t*8)%2)ptext('WARDED',cx,cy+R+14,C.hi,8);}
    // your trace, drawn over the stage like the real brush
    const tk=seg(t,0.7,1.8),hx=110,gx=150,gy=y-60,GR=34;if(t>0.7&&t<2.0){const tot=P0.length-1,upto=tk*tot;for(let i=1;i<=Math.ceil(upto)&&i<=tot;i++){const f=Math.min(1,upto-(i-1)),a=P0[i-1],b=P0[i];pline(LX(gx+a[0]*GR),LY(gy+a[1]*GR),LX(gx+(a[0]+(b[0]-a[0])*f)*GR),LY(gy+(a[1]+(b[1]-a[1])*f)*GR),C.hi,1,2);}}
    if(fired){const pts=P0.map(p=>({x:bx+p[0]*60,y:by-50+p[1]*50}));tdCut(pts,seg(t,1.9,2.1)+Math.max(0,t-2.1)*1.2,{col:'#ff2040',core:C.white,w:7});tdHitFx(bx,by-40,2.05,t);if(t<2.8)ptext('YOUR GLYPH',cx,cy+4,C.hi,8);}
    tdHero(hx,y,{frame:0});},
};
const THREAT_OVER={
  th_grab(t,touch){const down=t>0.9&&t<1.15;if(touch){dBtn(178,80,'DASH',down,11);dHand(180,82,down);}else dKey(78,92,'SPACE',down,44);},
  th_phase(t,touch){if(touch){const a=seg(t,0.9,1.1),sy=-ease(seg(t,1.0,1.3))*8;dStick(26,88,0,sy,a);if(t>0.9&&t<1.6)dHand(26,88+sy,true);}else dKey(22,80,'W',t>1.0&&t<1.4);},
  th_shield(t,touch){const down=t>1.15&&t<1.4;if(touch){dBtn(178,80,'DASH',down,11);dHand(180,82,down);}else dKey(78,92,'SPACE',down,44);},
  th_erase(){},
  th_glyph(t,touch){const P0=SHAPE_PTS[SHAPE_PTS.v?'v':Object.keys(SHAPE_PTS)[0]],tk=seg(t,0.7,1.8),tot=P0.length-1,u=tk*tot,i=Math.min(tot-1,Math.floor(u)),f=u-i,a=P0[i],b=P0[i+1],x=75+(a[0]+(b[0]-a[0])*f)*17,yy=Math.round(TDY/PX)-30+(a[1]+(b[1]-a[1])*f)*17;
    if(touch){const down=t>0.35&&t<0.6;dBtn(178,80,'技',down,10);if(t<0.65)dHand(180,82,down);else if(t<1.9)dHand(x,yy,true);}else{if(t>0.6&&t<1.9){dCursor(x,yy,true);dMouse(176,80,'r');}}},
};

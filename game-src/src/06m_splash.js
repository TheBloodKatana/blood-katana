// ================= studio card: OneManArmy, before the title =================
// A line of soldiers on the horizon, one figure in front of them, one cut. Tap or any key skips it.
const SPLASH={on:false,t:0,last:0,skip:false,done:null};
function studioSplash(done){
  const ov=$('studio'),cv=$('studioCv');if(!ov||!cv){done&&done();return;}
  SPLASH.on=true;SPLASH.t=0;SPLASH.skip=false;SPLASH.done=done;SPLASH.last=performance.now();ov.hidden=false;ov.classList.remove('out');
  const skip=e=>{if(!SPLASH.on)return;e.stopPropagation();if(e.cancelable)e.preventDefault();if(SPLASH.t<2.9)SPLASH.t=2.9;};
  SPLASH.skipFn=skip;for(const ev of ['pointerdown','keydown','touchstart'])window.addEventListener(ev,skip,{capture:true,passive:false});
  requestAnimationFrame(splashFrame);
}
function splashEnd(){
  SPLASH.on=false;const ov=$('studio');for(const ev of ['pointerdown','keydown','touchstart'])window.removeEventListener(ev,SPLASH.skipFn,{capture:true});
  ov.classList.add('out');setTimeout(()=>{ov.hidden=true;},420);const d=SPLASH.done;SPLASH.done=null;d&&d();
}
function splashFrame(now){
  if(!SPLASH.on)return;const dt=Math.min(0.05,(now-SPLASH.last)/1000);SPLASH.last=now;SPLASH.t+=dt;const t=SPLASH.t;
  const cv=$('studioCv'),g=cv.getContext('2d'),W=cv.width,H=cv.height;g.imageSmoothingEnabled=false;
  g.fillStyle='#000';g.fillRect(0,0,W,H);
  const fade=t>2.9?Math.max(0,1-(t-2.9)/0.45):1;g.globalAlpha=fade;
  const gy=116,cut=1.55,N=24;
  // the horizon
  g.fillStyle='#1a0a10';g.fillRect(0,gy+1,W,1);
  // the army: helmets and spears, appearing left to right; after the cut their tops slide off
  for(let i=0;i<N;i++){const x=Math.round(18+i*(W-36)/(N-1)),appear=clamp((t-0.35-i*0.025)/0.3,0,1);if(appear<=0)continue;
    const fell=t>cut+i*0.012?Math.min(1,(t-cut-i*0.012)/0.5):0,a=appear*(1-fell*0.75);g.globalAlpha=fade*a;
    g.fillStyle='#4a1420';g.fillRect(x-2,gy-7,5,8);g.fillRect(x-1,gy-9+Math.round(fell*5),3,2);// body, head
    g.fillStyle='#6a2030';g.fillRect(x-3,gy-10+Math.round(fell*6),7,1);// kasa hat
    g.fillStyle='#968b97';const sx=x+3;g.fillRect(sx,gy-17+Math.round(fell*9),1,10);g.fillStyle='#d8d4cc';g.fillRect(sx,gy-19+Math.round(fell*9),1,2);// spear
    if(fell>0&&fell<1){g.fillStyle='#ff4a5c';for(let k=0;k<3;k++)g.fillRect(x-2+((i*7+k*5)%6),gy-6-Math.round(fell*(6+k*3)),1,1);}}
  g.globalAlpha=fade;
  // the one in front
  const fa=clamp((t-0.9)/0.35,0,1),fx=W/2,fy=gy+16;
  if(fa>0){g.globalAlpha=fade*fa;g.fillStyle='#000';g.fillRect(fx-4,fy-1,9,2);
    g.fillStyle='#ece4d7';g.fillRect(fx-2,fy-12,5,11);g.fillRect(fx-1,fy-15,3,3);g.fillStyle='#b8142a';g.fillRect(fx-2,fy-12,5,2);
    const flick=Math.round(Math.sin(t*8)*1);g.fillRect(fx+3,fy-12+flick,3,1);g.fillRect(fx+6,fy-11+flick,2,1);// scarf in the wind
    g.fillStyle='#2a2028';g.fillRect(fx-2,fy-4,5,3);
    // the blade: sheathed, then drawn for the cut
    g.fillStyle='#d8d4cc';if(t<cut)g.fillRect(fx-6,fy-6,5,1);else{for(let k=0;k<9;k++)g.fillRect(fx+3+k,fy-9-Math.round(k*0.6),1,1);}}
  g.globalAlpha=fade;
  // the cut: a white line across the whole line of soldiers, then its afterglow
  if(t>cut-0.05&&t<cut+0.6){const u=clamp((t-cut+0.05)/0.14,0,1),x1=Math.round(10+u*(W-20)),y=gy-8,glow=t>cut+0.1?1-(t-cut-0.1)/0.5:1;
    g.globalAlpha=fade*glow;g.fillStyle='#ff4a5c';g.fillRect(10,y-1,x1-10,3);g.fillStyle='#ffffff';g.fillRect(10,y,x1-10,1);g.globalAlpha=fade;}
  if(t>cut&&t<cut+0.08){g.globalAlpha=fade*0.35;g.fillStyle='#fff';g.fillRect(0,0,W,H);g.globalAlpha=fade;}
  // the name
  const ta=clamp((t-1.85)/0.4,0,1);
  if(ta>0){g.globalAlpha=fade*ta;g.textAlign='center';g.textBaseline='alphabetic';
    g.font="12px DotGothic16, sans-serif";g.fillStyle='#ff4a5c';g.fillText('一騎当千',W/2,44);
    g.font="16px Silkscreen, monospace";const name='ONEMANARMY',sp=3;let w=0;for(const ch of name)w+=g.measureText(ch).width+sp;w-=sp;let x=W/2-w/2;
    g.textAlign='left';for(const ch of name){g.fillStyle='#000';g.fillText(ch,x+1,159);g.fillStyle='#ece4d7';g.fillText(ch,x,158);x+=g.measureText(ch).width+sp;}
    g.font="8px Silkscreen, monospace";g.textAlign='center';g.fillStyle='#968b97';g.globalAlpha=fade*ta*0.8;g.fillText('PRESENTS',W/2,171);}
  g.globalAlpha=1;
  if(t>3.35){splashEnd();return;}
  requestAnimationFrame(splashFrame);
}

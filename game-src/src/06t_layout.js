// ================= touch layout editor: move and size every button, and size the thumbstick zone =================
// Saved in settings (CFG.tlay, a JSON string). Offsets are stored as fractions of the screen height so a layout
// survives rotating or a different phone.
const TL_BTNS=['tHeal','tMend','tUlt','tKunai','tShuri','tThrow','tUse','tTrace','tDash','tPause'];
const TL_DEF={b:{},zw:0.4,zh:0.68,js:1,left:false};
function tlGet(){try{const o=JSON.parse(CFG.tlay||'{}');return Object.assign({},TL_DEF,o,{b:Object.assign({},o.b||{})});}catch(_){return JSON.parse(JSON.stringify(TL_DEF));}}
function tlSet(L){CFG.tlay=JSON.stringify(L);save();applyTouchLayout();}
function applyTouchLayout(){
  const L=tlGet(),H=innerHeight||400,tsz=CFG.tsize||1,root=document.documentElement;
  root.classList.toggle('lefty',!!L.left);
  for(const id of TL_BTNS){const el=$(id);if(!el)continue;const b=L.b[id]||{},k=id==='tPause'?1:tsz;
    el.style.translate=b.dx||b.dy?`${(b.dx||0)*H/k}px ${(b.dy||0)*H/k}px`:'';el.style.scale=b.s&&b.s!==1?String(b.s):'';}
  const z=$('joyZone');if(z){z.style.width=Math.round(L.zw*100)+'%';z.style.height=Math.round(L.zh*100)+'%';}
  root.style.setProperty('--jsz',String(L.js||1));
}
// ---------- the editor ----------
const TLE={on:false,sel:null,drag:null,L:null};
function openLayoutEditor(){
  if(!S.touchUI){return;}TLE.on=true;TLE.L=tlGet();TLE.sel=null;menuClose();
  document.documentElement.classList.add('layedit');$('layEd').hidden=false;tleRender();sfx('click');
}
function closeLayoutEditor(saveIt){
  if(saveIt)tlSet(TLE.L);else applyTouchLayout();
  TLE.on=false;TLE.drag=null;document.documentElement.classList.remove('layedit');$('layEd').hidden=true;
  for(const id of TL_BTNS){const el=$(id);if(el)el.classList.remove('tl-sel');}
  menuOpen('settings',false);
}
function tleApply(){const keep=CFG.tlay;CFG.tlay=JSON.stringify(TLE.L);applyTouchLayout();CFG.tlay=keep;}
function tleRender(){
  tleApply();const L=TLE.L,sel=TLE.sel,b=sel&&(L.b[sel]||{});
  for(const id of TL_BTNS){const el=$(id);if(el)el.classList.toggle('tl-sel',id===sel);}
  const nm=sel?($(sel).getAttribute('aria-label')||$(sel).textContent||sel).trim():'';
  $('layBar').innerHTML=`<div class="tl-row"><b>${esc(tr(sel?nm:'Drag a button to move it. Drag the dashed box to size the stick zone.'))}</b></div>
    <div class="tl-row">${sel?`<span>${esc(tr('Size'))}</span><button type="button" class="chip" data-tl="s-">−</button><span class="tl-v">${Math.round((b.s||1)*100)}%</span><button type="button" class="chip" data-tl="s+">+</button><button type="button" class="chip" data-tl="reset1">${esc(tr('Reset button'))}</button>`:
      `<span>${esc(tr('Stick'))}</span><button type="button" class="chip" data-tl="j-">−</button><span class="tl-v">${Math.round(L.js*100)}%</span><button type="button" class="chip" data-tl="j+">+</button>`}
      <button type="button" class="chip${L.left?' on':''}" data-tl="left">${esc(tr('Left-handed'))}</button><button type="button" class="chip" data-tl="reset">${esc(tr('Reset all'))}</button><button type="button" class="chip" data-tl="cancel">${esc(tr('Cancel'))}</button><button type="button" class="btn" data-tl="done">${esc(tr('Done'))}</button></div>`;
  const z=$('joyZone').getBoundingClientRect(),st=$('stage').getBoundingClientRect(),box=$('layZone');
  box.style.left=(z.left-st.left)+'px';box.style.top=(z.top-st.top)+'px';box.style.width=z.width+'px';box.style.height=z.height+'px';
  box.querySelector('span').textContent=tr('Stick zone')+` ${Math.round(L.zw*100)}% × ${Math.round(L.zh*100)}%`;
}
function tleBtnAt(x,y){for(const id of TL_BTNS){const el=$(id);if(!el)continue;const r=el.getBoundingClientRect();if(!r.width)continue;if(x>=r.left-4&&x<=r.right+4&&y>=r.top-4&&y<=r.bottom+4)return id;}return null;}
document.addEventListener('pointerdown',e=>{
  if(!TLE.on)return;if(e.target.closest('#layBar'))return;e.preventDefault();e.stopPropagation();
  const id=tleBtnAt(e.clientX,e.clientY),L=TLE.L,H=innerHeight||400;
  if(id){TLE.sel=id;const b=L.b[id]||(L.b[id]={});TLE.drag={kind:'btn',id,x0:e.clientX,y0:e.clientY,dx0:b.dx||0,dy0:b.dy||0};sfx('blip',900);tleRender();return;}
  const zr=$('joyZone').getBoundingClientRect(),hx=L.left?zr.left:zr.right;
  if(Math.abs(e.clientX-hx)<26&&Math.abs(e.clientY-zr.top)<26||e.target.closest('#layZone')){TLE.sel=null;TLE.drag={kind:'zone',x0:e.clientX,y0:e.clientY,w0:L.zw,h0:L.zh};tleRender();return;}
  TLE.sel=null;tleRender();
},true);
document.addEventListener('pointermove',e=>{
  const d=TLE.drag;if(!TLE.on||!d)return;e.preventDefault();const L=TLE.L,H=innerHeight||400,W=innerWidth||800;
  if(d.kind==='btn'){const b=L.b[d.id];b.dx=d.dx0+(e.clientX-d.x0)/H;b.dy=d.dy0+(e.clientY-d.y0)/H;}
  else{L.zw=clamp(d.w0+(L.left?-1:1)*(e.clientX-d.x0)/W,0.15,0.6);L.zh=clamp(d.h0-(e.clientY-d.y0)/H,0.25,1);}
  tleRender();
},true);
document.addEventListener('pointerup',e=>{if(!TLE.on)return;if(TLE.drag){TLE.drag=null;e.preventDefault();e.stopPropagation();}},true);
document.addEventListener('click',e=>{
  if(!TLE.on)return;const t=e.target.closest('[data-tl]');if(!t)return;e.preventDefault();e.stopPropagation();sfx('click');const L=TLE.L,a=t.dataset.tl,sel=TLE.sel;
  if(a==='done')return closeLayoutEditor(true);if(a==='cancel')return closeLayoutEditor(false);
  if(a==='s+'||a==='s-'){const b=L.b[sel]||(L.b[sel]={});b.s=clamp(Math.round(((b.s||1)+(a==='s+'?0.1:-0.1))*10)/10,0.6,1.8);}
  if(a==='j+'||a==='j-')L.js=clamp(Math.round((L.js+(a==='j+'?0.1:-0.1))*10)/10,0.6,1.6);
  if(a==='reset1'&&sel)delete L.b[sel];
  if(a==='left'){L.left=!L.left;L.b={};}
  if(a==='reset'){TLE.L=JSON.parse(JSON.stringify(TL_DEF));TLE.sel=null;}
  tleRender();
},true);
addEventListener('resize',()=>{try{applyTouchLayout();if(TLE.on)tleRender();}catch(_){}});

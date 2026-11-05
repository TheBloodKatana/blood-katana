// ================= crisp pixel text: every pixel of a pixel font lands on whole screen pixels =================
// Tiny5 is drawn on an 8px grid and DotGothic16 on a 16px grid. A size that isn't a whole multiple of that grid in real
// screen pixels (CSS size x devicePixelRatio x any CSS zoom) gets smeared across pixels and looks blurry. This snaps
// each element's font size to the nearest size that lands on the grid, and redoes it when the screen changes.
const CRISP={dpr:0,busy:false,queue:new Set()};
function crispStep(fam){fam=(fam||'').split(',')[0].replace(/["']/g,'').trim();return fam==='Tiny5'?8:fam==='DotGothic16'?16:0;}
function crispZoom(e){let z=1;for(let p=e;p&&p.nodeType===1;p=p.parentElement){const v=parseFloat(getComputedStyle(p).zoom);if(v&&v!==1)z*=v;}return z;}
function crispEl(e){
  if(!(e instanceof HTMLElement)||e.tagName==='CANVAS'||e.tagName==='SCRIPT'||e.tagName==='STYLE')return;
  let txt=false;for(const n of e.childNodes)if(n.nodeType===3&&n.textContent.trim()){txt=true;break;}if(!txt)return;
  if(e.dataset.fs0===undefined){e.dataset.fs0=e.style.fontSize||'';}
  else{e.style.fontSize=e.dataset.fs0;}
  const s=getComputedStyle(e),step=crispStep(s.fontFamily);if(!step)return;
  const css=parseFloat(s.fontSize);if(!css)return;const k=(window.devicePixelRatio||1)*crispZoom(e),dev=css*k;
  const snapped=Math.max(step,Math.round(dev/step)*step)/k;if(Math.abs(snapped-css)>0.01)e.style.fontSize=snapped.toFixed(3)+'px';
}
function crispTree(root){if(!root)return;crispEl(root);if(root.querySelectorAll)for(const e of root.querySelectorAll('*'))crispEl(e);}
function crispFlush(){CRISP.busy=false;const q=[...CRISP.queue];CRISP.queue.clear();for(const e of q)if(e.isConnected)crispTree(e);}
function crispSoon(e){CRISP.queue.add(e);if(!CRISP.busy){CRISP.busy=true;requestAnimationFrame(crispFlush);}}
function crispAll(){CRISP.dpr=window.devicePixelRatio||1;crispSoon(document.body);}
(function(){
  if(typeof MutationObserver==='undefined'||!document.body)return;
  // only new elements need a look; text changes inside an element already snapped keep their size
  new MutationObserver(ms=>{for(const m of ms)for(const n of m.addedNodes)if(n.nodeType===1)crispSoon(n);else if(n.nodeType===3&&m.target.nodeType===1&&m.target.dataset.fs0===undefined)crispSoon(m.target);})
    .observe(document.body,{childList:true,subtree:true});
  addEventListener('resize',()=>{clearTimeout(CRISP.rt);CRISP.rt=setTimeout(crispAll,120);});
  try{document.fonts&&document.fonts.ready.then(crispAll);}catch(_){}
  setInterval(()=>{if((window.devicePixelRatio||1)!==CRISP.dpr)crispAll();},1500);
  crispAll();
})();

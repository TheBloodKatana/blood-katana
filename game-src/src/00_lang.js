// ================= languages: English in the source, the rest looked up where text is shown =================
// Text is caught where it reaches the screen (canvas text, the DOM, dialogs), so game code stays in English.
// Keys are the English strings; {0}, {1} stand for numbers and names filled in at runtime.
const LANGS=[['auto','Auto'],['en','English'],['pt','Português'],['ja','日本語'],['fr','Français'],['ru','Русский'],['zh','中文']];
const LANG_PICK=(()=>{try{const s=JSON.parse(localStorage.getItem('blood-katana-debug-v12')||'{}');return s.lang||'auto';}catch(_){return'auto';}})();
const LANG=(()=>{let v=LANG_PICK;if(v==='auto'||!LANGS.some(l=>l[0]===v)){const n=((navigator.languages&&navigator.languages[0])||navigator.language||'en').toLowerCase();
  v=n.startsWith('pt')?'pt':n.startsWith('ja')?'ja':n.startsWith('fr')?'fr':n.startsWith('ru')?'ru':n.startsWith('zh')?'zh':'en';}return v;})();
const CJK=LANG==='ja'||LANG==='zh';
const I18N_SRC=__LANG_JSON__;
const TR={exact:new Map(),lower:new Map(),pats:[],memo:new Map(),out:new Set(),miss:new Map(),html:new Map()};
const trNorm=s=>s.replace(/\s+/g,' ').trim();
if(LANG!=='en'){
  const esc=s=>s.replace(/[.*+?^$()|[\]\\{}]/g,'\\$&');
  for(const k in I18N_SRC){const v=I18N_SRC[k]&&I18N_SRC[k][LANG];if(!v)continue;TR.out.add(v);TR.out.add(trNorm(v));
    if(k.includes('<')){TR.html.set(trNorm(k),v);continue;}
    if(/\{\d\}/.test(k)){if(!/[A-Za-z]{2}|'s /.test(k.replace(/\{\d\}/g,'')))continue;
      // whitespace in a key matches any run of whitespace, so multi-line text keeps its line breaks in the captured parts
      const re=new RegExp('^'+esc(k.trim()).replace(/[ \t]*\n\s*/g,'\u0001').replace(/\s+/g,'\\s+').replace(/\u0001/g,'\\s*\\n\\s*').replace(/\\\{(\d)\\\}/g,'([\\s\\S]*?)')+'$','i'),order=[...k.matchAll(/\{(\d)\}/g)].map(m=>+m[1]);
      TR.pats.push({re,order,v,len:k.length});}
    else{const n=trNorm(k);TR.exact.set(n,v);if(!TR.lower.has(n.toLowerCase()))TR.lower.set(n.toLowerCase(),v);}}
  TR.pats.sort((a,b)=>b.len-a.len);
  document.documentElement.lang=LANG==='zh'?'zh-Hans':LANG;
}
const trUp=s=>s.toLocaleUpperCase(LANG);
function trCore(t){
  const n=trNorm(t);
  let r=TR.exact.get(n);if(r!=null)return r;
  const up=/[A-Z]/.test(n)&&n===n.toUpperCase();
  r=TR.lower.get(n.toLowerCase());if(r!=null)return up?trUp(r):r;
  for(const p of TR.pats){const m=p.re.exec(t);if(!m||m.slice(1).some(x=>x&&x.includes(' · ')))continue;
    const parts=[];p.order.forEach((ix,gi)=>parts[ix]=m[gi+1]);
    let o=p.v.replace(/\{(\d)\}/g,(_,i)=>{const s=parts[+i];return s==null?'':trPart(s);});
    return up?trUp(o):o;}
  return trSplit(t,n);
}
// text built from pieces: try " · " segments, then sentences, then short runs of capitalised words (names, "Earth II")
function trSplit(t,n){
  const q=/^"([\s\S]+)"$/.exec(n);if(q&&!q[1].includes('"')){const r=trCore(q[1]);if(r!=null)return (LANG==='ja'||LANG==='zh'?'「':LANG==='fr'?'« ':LANG==='ru'?'«':'"')+r+(LANG==='ja'||LANG==='zh'?'」':LANG==='fr'?' »':LANG==='ru'?'»':'"');}
  if(n.includes(' · ')){let hit=false;const o=n.split(' · ').map(x=>{const r=trPart(x);if(r!==x)hit=true;return r;});if(hit)return o.join(' · ');}
  const ss=n.split(/(?<=[.!?…"”])\s+(?=["“A-Z0-9])/);
  if(ss.length>1){const o=[];for(const x of ss){const r=/[A-Za-z]/.test(x)?trCore(x):x;if(r==null)return null;o.push(r);}return o.join(CJK?'':' ');}
  const ws=n.split(' ');
  if(ws.length>1&&ws.length<=4&&ws.every(w=>!/[A-Za-z]/.test(w)||/^[A-ZĀĒĪŌŪ]/.test(w))){const o=[];
    for(const w of ws){if(!/[A-Za-z]/.test(w)){o.push(w);continue;}const r=TR.exact.get(w)??TR.lower.get(w.toLowerCase());if(r==null)return null;o.push(w===w.toUpperCase()&&w.length>1?trUp(r):r);}
    const d=CJK?o.filter((x,i)=>x!==o[i-1]):o;return d.join(CJK?'':' ');}
  return null;
}
function trPart(s){const t=s.trim();if(!t||!/[A-Za-z]/.test(t)||TR.out.has(t))return s;const r=trCore(t);return r==null?s:s.replace(t,r);}
function tr(s){
  if(LANG==='en'||typeof s!=='string'||!s||TR.out.has(s))return s;
  const hit=TR.memo.get(s);if(hit!==undefined)return hit;
  const m=/^(\s*)([\s\S]*?)(\s*)$/.exec(s),t=m[2];let r=s;
  if(/[A-Za-z]/.test(t)&&!TR.out.has(t)){const x=trCore(t);if(x!=null){r=m[1]+x+m[3];TR.out.add(r);}else if(TR.miss.size<4000)TR.miss.set(t,(TR.miss.get(t)||0)+1);}
  if(TR.memo.size>6000)TR.memo.clear();TR.memo.set(s,r);return r;
}
// ---------- canvas: every fillText and measureText goes through tr(), and non-Latin text gets a readable size ----------
if(LANG!=='en'){
  const P=CanvasRenderingContext2D.prototype,fT=P.fillText,sT=P.strokeText,mT=P.measureText;
  const big=LANG==='ru'?1.25:1.5,CJKF=LANG==='zh'?"'Noto Sans SC','Noto Sans CJK SC','PingFang SC','Microsoft YaHei',sans-serif":"DotGothic16,'Noto Sans JP','Noto Sans CJK JP',sans-serif";
  const withFont=(g,s,fn)=>{if(!/[^\u0000-ɏ]/.test(s)){return fn();}const f=g.font,m=/^(.*?)(\d+(?:\.\d+)?)px\s+(.*)$/.exec(f);if(!m)return fn();
    // the Latin pixel face is tiny and has no glyphs for these scripts: swap it and size up; faces that already cover them keep their size
    const pix=/silkscreen/i.test(m[3]),sz=pix?Math.round(+m[2]*big):+m[2];
    if(!pix&&LANG!=='zh')return fn();
    g.font=`${m[1]}${sz}px ${LANG==='ru'?'DotGothic16, '+m[3]:CJKF}`;try{return fn();}finally{g.font=f;}};
  P.fillText=function(s,x,y,w){const t=tr(String(s));return withFont(this,t,()=>w==null?fT.call(this,t,x,y):fT.call(this,t,x,y,w));};
  P.strokeText=function(s,x,y,w){const t=tr(String(s));return withFont(this,t,()=>w==null?sT.call(this,t,x,y):sT.call(this,t,x,y,w));};
  P.measureText=function(s){const t=tr(String(s));return withFont(this,t,()=>mT.call(this,t));};
}
// ---------- the DOM: translate text and a few attributes as they appear ----------
const TR_SKIP=new Set(['SCRIPT','STYLE','TEXTAREA','INPUT','CANVAS']);
function trNode(n){
  if(LANG==='en')return;
  if(n.nodeType===3){const p=n.parentNode;if(!p||TR_SKIP.has(p.nodeName)||(p.closest&&p.closest('[data-notr]')))return;const v=n.data;if(!/[A-Za-z]/.test(v))return;const t=tr(v);if(t!==v)n.data=t;return;}
  if(n.nodeType!==1||TR_SKIP.has(n.nodeName)||n.hasAttribute('data-notr'))return;
  if(TR.html.size&&n.firstElementChild&&/^(LI|DD|P)$/.test(n.nodeName)){const h=TR.html.get(trNorm(n.innerHTML));if(h!=null){n.setAttribute('data-notr','');n.innerHTML=h;return;}}
  for(const a of ['title','aria-label','placeholder']){const v=n.getAttribute(a);if(v&&/[A-Za-z]/.test(v)){const t=tr(v);if(t!==v)n.setAttribute(a,t);}}
  for(let c=n.firstChild;c;c=c.nextSibling)trNode(c);
}
if(LANG!=='en'){
  trNode(document.body||document.documentElement);document.title=tr(document.title);
  new MutationObserver(ms=>{for(const m of ms){if(m.type==='characterData')trNode(m.target);else{for(const n of m.addedNodes)trNode(n);if(m.type==='attributes')trNode(m.target);}}})
    .observe(document.documentElement,{subtree:true,childList:true,characterData:true,attributes:true,attributeFilter:['title','aria-label','placeholder']});
}
// wrap a line for the canvas: translated first, and broken by character where a language has no spaces
function trWrap(str,max){str=tr(str);if(!CJK||/\s/.test(str.trim()))return null;const lines=[],w=Math.max(4,Math.floor(max*0.55));for(let i=0;i<str.length;i+=w)lines.push(str.slice(i,i+w));return lines;}

// ================= the app around the game: menus, settings, saving a run, the back button, credits, the ending =================
const VERSION='1.0.0';
const RUN_KEY='blood-katana-run-v1';
const isApp=()=>!!(window.Capacitor&&(window.Capacitor.isNativePlatform?window.Capacitor.isNativePlatform():true));
// Test builds show a Cheats section in Settings. Set this to false before a Play Store release.
const CHEATS_BUILD=true;
const devOn=()=>!!(CFG.dev||/[?&]dev\b/.test(location.search));

// ---------- a run is saved at the start of every floor; Continue picks it up there ----------
function saveRun(){
  if(!S.floor||S.inHub||S.pro||S.dead>0||S.mode!=='run'||(S.gm&&S.gm.arena))return;
  const d={v:1,n:S.floor.n,realmPick:S.realmPick,hp:P.hp,shield:P.shield||0,wpn:P.wpn,items:S.items,owned:S.owned,runMax:S.runMax||0,mon:S.mon,carry:S.carry,shardsRun:S.shardsRun,
    tools:S.tools,meter:S.meter,stats:S.stats,unbrokenUsed:!!S.unbrokenUsed,usedEnc:[...(S.usedEnc||[])],gm:S.gm,reviveUsed:!!S.reviveUsed,elem:S.elem||null,t:Date.now()};
  try{localStorage.setItem(RUN_KEY,JSON.stringify(d));}catch(_){}
}
function loadRunData(){try{const d=JSON.parse(localStorage.getItem(RUN_KEY)||'null');return d&&d.v===1&&d.n>=1&&d.n<=totalFloors()?d:null;}catch(_){return null;}}
function clearRun(){try{localStorage.removeItem(RUN_KEY);}catch(_){}}
function continueRun(){
  const d=loadRunData();if(!d){enterHub();return;}
  auInit();S.gmNext=d.gm||{id:'story',mods:[]};resetRunState();S.inHub=false;applyMode();recomputeMods();S.reviveUsed=!!d.reviveUsed;
  S.realmPick=Array.isArray(d.realmPick)&&d.realmPick.length===BIOMES.length?d.realmPick:BIOMES.map(B=>({boss:pick(B.bosses),mini:pick(B.minis)}));
  Object.assign(S,{items:(d.items||[]).filter(id=>ITEM[id]),owned:d.owned||{},runMax:d.runMax||0,mon:d.mon|0,carry:d.carry|0,shardsRun:d.shardsRun|0,tools:d.tools||S.tools,meter:+d.meter||0,
    stats:Object.assign(S.stats,d.stats||{}),unbrokenUsed:!!d.unbrokenUsed,usedEnc:new Set(d.usedEnc||[]),elem:d.elem&&ELEM_BY[d.elem.id]?d.elem:null});
  for(const id in S.owned)if(!PERKS.find(p=>p.id===id))delete S.owned[id];
  if(d.wpn&&WEAPONS[d.wpn.id]){P.wpn=d.wpn;P.wpn.uid=WUID++;}
  recomputeMods();P.hp=clamp(d.hp|0,1,P.max);P.shield=d.shield||0;
  S.floor=modeFloor(d.n);S.stats.floor=d.n;S.tideT=90;
  enterRoom(S.floor.start,null);
  S.mode='run';S.running=true;S.paused=false;
  for(const id of ['hub','overlay','dlg','perkOv','title','menuOv','helpOv'])$(id).hidden=true;
  $('stage').classList.remove('titling');
  floorBanner();renderPerkStrip();last=performance.now();
}

// ---------- menus ----------
const MENU={stack:[]};
function menuShow(html,name){
  const mi=$('menuInner'),same=name===MENU.cur&&!$('menuOv').hidden;
  // redrawing the menu already on screen (a tab, a toggle) is instant: no pop-in, no tap cooldown, same scroll
  const sc=same?[...mi.querySelectorAll('.mv-body')].map(x=>x.scrollTop):null,inner=mi.scrollTop;
  if(typeof pvStop==='function')pvStop();
  mi.classList.remove('wide');mi.classList.toggle('still',same);mi.innerHTML=html;$('menuOv').hidden=false;MENU.cur=name;
  if(same){mi.classList.remove('cool');const bs=mi.querySelectorAll('.mv-body');if(ARM.keepScroll!==false){sc.forEach((v,i)=>{if(bs[i])bs[i].scrollTop=v;});mi.scrollTop=inner;}ARM.keepScroll=true;}
  else{coolDown(mi,220);const b=mi.querySelector('.btn:not([disabled]),button');if(b&&!S.touchUI)b.focus({preventScroll:true});}
}
function menuOpen(name,push=true){if(push&&MENU.cur&&!$('menuOv').hidden)MENU.stack.push(MENU.cur);(MENUS[name]||MENUS.pause)();}
function menuClose(){$('menuOv').hidden=true;MENU.stack=[];MENU.cur=null;}
function menuBack(){
  const prev=MENU.stack.pop();
  if(prev){menuOpen(prev,false);return;}
  menuClose();
  if(S.paused)resume();
}
const chip=t=>`<span class="pchip">${esc(t)}</span>`;
const MENUS={
  pause(){
    const inv=S.inHub?'':`<div class="mv-body"><div class="set-sec"><h3>Level ${flName()} · ${esc(curBiome().name)}</h3>
      <div class="inv">${chip(wName(P.wpn)+(P.wpn?` · ${Math.ceil(P.wpn.dur)}/${P.wpn.max}`:''))}${S.items.map(id=>`<span class="pchip item">${esc(ITEM[id].name)}</span>`).join('')}${Object.keys(S.owned).map(id=>chip(PERKS.find(p=>p.id===id).name)).join('')}</div></div></div>`;
    menuShow(`<div class="mv-head"><div class="mv-kanji">休</div><div class="mv-title">Paused</div></div>
      <div class="mv-list">
        <button class="btn" type="button" data-m="resume">Resume</button>
        <button class="btn ghost" type="button" data-m="settings">Settings</button>
        <button class="btn ghost" type="button" data-m="how">How to play</button>
        ${devOn()?'<button class="btn ghost" type="button" data-m="debug">Debug bench</button>':''}
        ${S.tut?'<button class="btn ghost" type="button" data-m="skiptut">Skip training</button>':''}${S.pro?'<button class="btn ghost" type="button" data-m="proskip">Skip the prologue</button>':''}
        <button class="btn ghost" type="button" data-m="quit">${S.inHub?'Title screen':'Save and quit'}</button>
        ${S.inHub?'':'<button class="btn ghost" type="button" data-m="abandon">Abandon run</button>'}
      </div>${S.inHub?'':'<p class="mv-note">Quitting saves the run at the start of this floor.</p>'}${inv}`,'pause');
  },
  settings(){
    const T=(k,label,note)=>`<div class="set-row"><span>${label}${note?`<small>${note}</small>`:''}</span><button type="button" class="tgl${CFG[k]?' on':''}" data-t="${k}">${CFG[k]?'On':'Off'}</button></div>`;
    const R=(k,label,min,max,st)=>`<div class="set-row"><span>${label}</span><input type="range" min="${min}" max="${max}" step="${st}" value="${CFG[k]}" data-r="${k}"></div>`;
    const seg=(k,label,opts)=>`<div class="set-row"><span>${label}</span><div class="seg">${opts.map(([v,l])=>`<button type="button" data-s="${k}" data-v="${v}" class="${CFG[k]==v?'on':''}">${l}</button>`).join('')}</div></div>`;
    menuShow(`<div class="mv-head"><div class="mv-title">Settings</div><button class="btn ghost mv-x" type="button" data-m="back">Back</button></div>
      <div class="mv-body">
        <div class="set-sec"><h3>Language</h3><div class="set-row"><span>Language<small>Auto follows your phone</small></span><div class="seg lang" data-notr>${LANGS.map(([v,l])=>`<button type="button" data-m="lang" data-v="${v}" class="${LANG_PICK===v?'on':''}">${v==='auto'?tr('Auto'):l}</button>`).join('')}</div></div></div>
        <div class="set-sec"><h3>Sound</h3>${T('sound','Sound')}${T('music','Music')}${R('sfxVol','Effects volume',0,1,0.05)}${R('musicVol','Music volume',0,1,0.05)}</div>
        <div class="set-sec"><h3>Screen</h3>${T('shake','Screen shake')}${T('flashes','Screen flashes','White flashes on big hits and parries')}${T('lighting','Lighting','Turn off on slow phones')}${T('ambient','Ambient particles')}${T('corpses','Bodies cut in two')}${T('minimap','Minimap')}${S.touchUI?'':T('cursor','Pixel cursor')}
          ${R('darkness','Darkness',0.4,1.4,0.05)}</div>
        <div class="set-sec"><h3>Feel</h3>${T('hitPause','Hit pause','The freeze-frame when a cut lands')}${T('parrySlowOn','Parry slows time')}${T('slowmoOn','Slow motion while swiping','Easier aiming, slower fights')}</div>
        ${S.touchUI?`<div class="set-sec"><h3>Touch</h3>${T('vibe','Vibration','A buzz when you are hit or parry')}${seg('tsize','Button size',[[0.85,'S'],[1,'M'],[1.18,'L']])}${seg('topac','Button opacity',[[0.55,'Faint'],[0.8,'Half'],[1,'Solid']])}</div>`:''}
        ${devOn()?`<div class="set-sec"><h3>Developer</h3><div class="set-row"><span>Debug bench</span><button type="button" class="tgl" data-m="debug">Open</button></div>
          <div class="set-row"><span>Developer tools<small>Tap the version on the title five times to show this again</small></span><button type="button" class="tgl on" data-t="dev">On</button></div></div>`:''}
        ${CHEATS_BUILD||devOn()?cheatSection(T):''}
        <div class="set-sec"><h3>Progress</h3><div class="set-row"><span>Erase everything<small>Banked shards, the Blood Tree, unlocks, records and any saved run</small></span><button type="button" class="tgl" data-m="wipe">Erase</button></div></div>
      </div>`,'settings');
  },
  credits(){
    menuShow(`<div class="mv-head"><div class="mv-title">Credits</div><button class="btn ghost mv-x" type="button" data-m="back">Back</button></div>
      <div class="mv-body credits">
        <div class="mv-kanji">血刀</div>
        <div><h4>A game by</h4><p>Weird Animations</p></div>
        <div><h4>Design, art direction and the hero's sprite</h4><p>Weird Animations</p></div>
        <div><h4>Fonts</h4><p>Silkscreen · DotGothic16 · JetBrains Mono</p><small>Used under the SIL Open Font License 1.1</small></div>
        <div><h4>Thanks</h4><p>Everyone who died on level 1-1 so the rest of you didn't have to.</p></div>
        <small>Version ${VERSION}</small>
      </div>`,'credits');
  },
  confirmNew(){
    menuShow(`<div class="mv-head"><div class="mv-title">A run is waiting</div></div><div class="mv-body"><p class="mv-note">You have a saved descent on level ${flNameOf(loadRunData().n)}. Starting over abandons it.</p></div>
      <div class="mv-list"><button class="btn" type="button" data-m="continue">Continue the saved run</button><button class="btn ghost" type="button" data-m="newrun">Abandon it and start over</button><button class="btn ghost" type="button" data-m="back">Back</button></div>`,'confirmNew');
  },
  confirmWipe(){
    menuShow(`<div class="mv-head"><div class="mv-title">Erase everything?</div></div><div class="mv-body"><p class="mv-note">Your shards, the whole Blood Tree, shrine unlocks, records and saved run will be gone for good.</p></div>
      <div class="mv-list"><button class="btn" type="button" data-m="dowipe">Erase it all</button><button class="btn ghost" type="button" data-m="back">Keep it</button></div>`,'confirmWipe');
  }
};
const flNameOf=n=>`${Math.ceil(n/FPR)}-${(n-1)%FPR+1}`;
$('menuOv').addEventListener('click',e=>{
  const t=e.target.closest('[data-t],[data-m],[data-s]');if(!t||$('menuInner').classList.contains('cool'))return;sfx('click');
  if(t.dataset.t){const k=t.dataset.t;CFG[k]=!CFG[k];save();applySettings();if(k==='dev'&&!CFG[k]){menuOpen('settings',false);return;}t.classList.toggle('on',CFG[k]);t.textContent=CFG[k]?'On':'Off';return;}
  if(t.dataset.s){const k=t.dataset.s;CFG[k]=parseFloat(t.dataset.v);save();applySettings();t.parentElement.querySelectorAll('button').forEach(b=>b.classList.toggle('on',b===t));return;}
  const m=t.dataset.m;
  if(typeof MENU_ACTS!=='undefined'&&MENU_ACTS[m]){MENU_ACTS[m](t);return;}
  if(m==='resume')menuBack();
  else if(m==='back')menuBack();
  else if(m==='settings')menuOpen('settings');
  else if(m==='credits')menuOpen('credits');
  else if(m==='how'){openHelp();}
  else if(m==='debug'){openDebug();}
  else if(m==='quit'){menuClose();S.paused=false;showTitle();}
  else if(m==='skiptut'){endTutorial(true);menuBack();}
  else if(m==='abandon'){menuClose();S.paused=false;if(S.stats)S.stats.killer='';showSummary(false);}
  else if(m==='continue'){menuClose();$('title').hidden=true;continueRun();}
  else if(m==='newrun'){clearRun();menuClose();$('title').hidden=true;enterHub();}
  else if(m==='wipe')menuOpen('confirmWipe');
  else if(m==='dowipe'){try{localStorage.removeItem(META_KEY);}catch(_){}clearRun();META=freshMeta();META.legacy=true;saveMeta();try{applyLook();}catch(_){}menuClose();showTitle();}
});
$('menuOv').addEventListener('input',e=>{const r=e.target.closest('[data-r]');if(!r)return;CFG[r.dataset.r]=parseFloat(r.value);save();applySettings();});
function applySettings(){
  auInit();auVol();syncSnd();
  const R=document.documentElement;R.style.setProperty('--tsz',CFG.tsize||1);R.style.setProperty('--top',CFG.topac||0.8);
  cv.classList.toggle('nocur',CFG.cursor&&S.mouseSeen);
  try{syncDebug();}catch(_){}
}
// help and debug overlays
function openHelp(){$('helpOv').hidden=false;coolDown($('helpOv'),250);}
$('helpTabs').addEventListener('click',e=>{const b=e.target.closest('[data-tab]');if(!b)return;sfx('click');for(const x of $('helpTabs').children)x.classList.toggle('on',x===b);for(const p of document.querySelectorAll('.hpane'))p.hidden=p.id!==b.dataset.tab;});
function openDebug(){$('dbgOv').hidden=false;}
document.addEventListener('click',e=>{const c=e.target.closest('[data-close]');if(c){sfx('click');$(c.dataset.close).hidden=true;}});
// the version on the title, tapped five times, unlocks the developer tools
{let taps=0,tt=0;$('tVer').addEventListener('pointerdown',e=>{e.stopPropagation();const now=performance.now();taps=now-tt<600?taps+1:1;tt=now;if(taps>=5){taps=0;CFG.dev=!CFG.dev;save();text(P.x,P.y,'',C.ash);$('tVer').textContent=`v${VERSION}${CFG.dev?' · developer tools on':''}`;sfx(CFG.dev?'learn':'deny');}});}

// ---------- haptics: phones only, and only when the setting is on ----------
let buzzT=0;
function buzz(ms,style){
  if(!CFG.vibe||!S.touchUI)return;const now=performance.now();if(now-buzzT<60)return;buzzT=now;
  const H=window.Capacitor&&Capacitor.Plugins&&Capacitor.Plugins.Haptics;
  try{if(H){if(style&&H.impact)H.impact({style});else if(H.vibrate)H.vibrate({duration:ms});return;}if(navigator.vibrate)navigator.vibrate(ms);}catch(_){}
}
// ---------- the back button (Android) and Escape ----------
function handleBack(){
  if(!$('dbgOv').hidden){$('dbgOv').hidden=true;return true;}
  if(!$('helpOv').hidden){$('helpOv').hidden=true;return true;}
  if(!$('menuOv').hidden){if(MENU.cur==='revive'){MENU_ACTS.reviveno();return true;}menuBack();return true;}
  if(S.forgeOpen){try{closeTree();}catch(_){}try{closeForge();}catch(_){}return true;}
  if(S.choosing&&S.chooser&&S.chooser.cancel){chooserPick(-1);return true;}
  if(S.dialog){if(!dlgMini()){const leave=(S.dialog.choices||[]).findIndex(c=>/leave|not yet|nothing|thanks|no\b/i.test(c.label||''));if(leave>=0){dlgChoose(leave);return true;}}return true;}
  if(S.mode==='run'&&S.running){pause();return true;}
  if(S.mode==='hub'||S.mode==='summary'){$('hub').hidden=true;$('overlay').hidden=true;showTitle();return true;}
  return false;
}
(function backButton(){
  const cap=window.Capacitor,App=cap&&cap.Plugins&&cap.Plugins.App;
  if(App&&App.addListener){App.addListener('backButton',()=>{if(!handleBack()&&App.exitApp)App.exitApp();});return;}
  if(!isApp())return;   // in a normal browser the browser's own Back button keeps its meaning
  const arm=()=>{try{history.pushState({bk:1},'');}catch(_){}};arm();
  addEventListener('popstate',()=>{if(handleBack())arm();});
})();
// pause whenever the app goes to the background
document.addEventListener('visibilitychange',()=>{if(document.hidden){if(S.mode==='run'&&S.running&&!S.choosing&&!S.dialog)pause();try{if(AU.ctx&&AU.ctx.state==='running')AU.ctx.suspend();}catch(_){}}else{try{if(AU.ctx&&AU.ctx.state==='suspended'&&!S.paused)AU.ctx.resume();}catch(_){}}});
addEventListener('pagehide',()=>{if(S.mode==='run'&&!S.inHub)saveMetaOnly();});
function saveMetaOnly(){try{saveMeta();}catch(_){}}

// ---------- the ending ----------
function playEnding(lord){
  S.running=false;S.mode='summary';keys.clear();
  const usurper=lord&&lord.key==='usurper';
  const lines=usurper?[
    'Kuroda Nobutsuna kneels in the ash of his own castle.',
    'The blade he broke in you is whole again, and it remembers his name.',
    'You do not take his head. You take back what was yours, and leave him with the hundred hells he built.',
    'Somewhere below, a shrine bell rings once.'
  ]:[
    'Ashiya Dōkan’s paper soldiers burn, one by one, until only his shadow is left.',
    'His last spell was the one that broke your blade. It breaks on him instead.',
    'The castle goes quiet. The Usurper is gone, fled into the dark with what is left of his court.',
    'Your blade is whole. The hunt is not over. Somewhere below, a shrine bell rings once.'
  ];
  menuShow(`<div class="mv-kanji" style="text-align:center">刀成</div><div class="mv-title" style="text-align:center">The blade is whole</div>
    <div class="ending">${lines.map((l,i)=>`<p style="animation-delay:${0.6+i*1.8}s">${esc(l)}</p>`).join('')}</div>
    <div class="mv-list"><button class="btn" type="button" data-m="endsum">Continue</button></div>`,'ending');
  sfx('gong');
}
$('menuOv').addEventListener('click',e=>{const t=e.target.closest('[data-m="endsum"]');if(!t)return;menuClose();showSummary(true,true);});
// ---------- cheats, for testing builds ----------
const cheatsOn=()=>!!(CFG.cheatMoney||CFG.cheatOhko||CFG.cheatTools||CFG.cheatTech||CFG.infMeter||CFG.noTechCd);
function cheatSection(T){
  return`<div class="set-sec cheats"><h3>Cheats <small>test build</small></h3>
    ${T('god','Invincible','Nothing can hurt you')}${T('cheatOhko','One-hit kills','Every foe and lord dies to one cut')}${T('cheatMoney','Endless koban and 血晶','Never run out of either')}
    ${T('infMeter','Endless blood orb','Heal, mend and thirst whenever you like')}${T('cheatTools','Endless kunai and shuriken')}${T('cheatTech','Every technique','All techniques for every weapon, without forging')}${T('noTechCd','No technique recharge')}
    <div class="set-row"><span>Unlock everything<small>Every skin, weapon, Blood Tree node, shrine NPC, realm and hell level. Undo it with Erase everything</small></span><button type="button" class="tgl" data-m="cheatall">Unlock</button></div>
    <div class="set-row"><span>Reset today's spin and gift<small>Spin again, claim the next daily gift</small></span><button type="button" class="tgl" data-m="cheatday">Reset</button></div></div>`;
}
function cheatTick(){
  if(CFG.cheatMoney){if((META.koban||0)<99999)META.koban=99999;if(META.shards<99999)META.shards=99999;}
  if(CFG.cheatTools&&S.tools){S.tools.kunai=Math.max(S.tools.kunai||0,9);S.tools.shuri=Math.max(S.tools.shuri||0,9);}
  if(CFG.cheatTech)S.dbgTech=true;
}
function cheatUnlockAll(){
  for(const k in COS)cosState().own[k]=1;
  for(const k of WKEYS){META.wseen[k]=1;META.up['hub.start_'+k]=1;}
  try{for(const N of treeLayout().nodes)if(N.type==='node'||N.type==='tip')META.up[N.key]=nodeMax(N);}catch(_){}
  for(const n of SHRINE_NPCS)META.npc[n.id]=1;
  META.realms=BIOMES.length-1;META.hell=Math.max(META.hell||0,19);META.tut=1;META.pro=1;
  saveMeta();try{applyLook();}catch(_){}
}

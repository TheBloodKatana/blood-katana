// ================= the Armory: wardrobe, shop, the daily spin, koban, rewarded ads and purchases =================
// Real money goes through buyProduct (Google Play Billing in the store build); ads through rewardedAd (AdMob).
// Until those are wired to an account, both run as clearly-labelled test flows so everything can be tried.
const ARM={tab:'o',wtab:'nodachi',pending:null,spin:null};
const SRC_TEXT=s=>s==='free'?'Free':s==='shop'?'Shop':s==='paid'?'Paid':s==='best'?'Bestiary: fill every page':s==='daily1'?'Clear a daily challenge':s.startsWith('daily')?`Daily challenge streak of ${s.slice(5)}`:s.startsWith('feat:')?'Feat: '+((FEATS.find(f=>f.id===s.slice(5))||{}).name||'a feat'):s;
function itemHow(it){
  if(cosOwned(it.key))return cosEquipped(it.key)?'Equipped':'Owned · tap to equip';
  if(it.r==='legendary')return PAID_PRICE+(weekendLegend()===it.key&&isWeekend()?' · in the spin this weekend':'');
  if(it.src==='shop'){const p=RAR[it.r].koban;return`${p} koban`+(it.r==='epic'||it.r==='common'||it.r==='rare'?' · or the spin':'');}
  return SRC_TEXT(it.src)+(it.r==='common'||it.r==='rare'?' · or the spin':'');
}
// ---------- previews drawn into small canvases ----------
function prevOutfit(cv,id){const sp=id==='default'?(BASE_PLAYER||SPR.player):SPR['pc_'+id];const g=cv.getContext('2d');g.imageSmoothingEnabled=false;g.clearRect(0,0,cv.width,cv.height);if(sp)g.drawImage(sp.r[0],4,2,24,28,0,0,24,28);}
function prevWeapon(cv,wid,skin){
  const g=cv.getContext('2d');g.clearRect(0,0,cv.width,cv.height);const f0=S.face;S.face=1;
  const L={katana:15,reserve:15,nodachi:22,naginata:24,bo:16,kama:8,tessen:10}[wid]||15,h={x:wid==='bo'?Math.round(cv.width/2):6,y:Math.round(cv.height/2)+(wid==='kama'?3:0)};
  try{drawHeld(h,wid==='kama'?-0.2:-0.12,wid,false,false,false,null,{skin,face:1,g:0,sink:(sol,out)=>{g.fillStyle='#000';for(const [x,y] of out)g.fillRect(x,y,1,1);for(const v of sol){g.fillStyle=v[2];g.fillRect(v[0],v[1],1,1);}}});}catch(_){}
  S.face=f0;
}
function prevSet(cv,set){
  const g=cv.getContext('2d');g.clearRect(0,0,cv.width,cv.height);const W=cv.width,H=cv.height;
  const px=(x,y,c)=>{g.fillStyle=c;g.fillRect(Math.round(x),Math.round(y),1,1);};
  for(let i=0;i<=24;i++){const a=-1.25+i/24*2.4,w=3*Math.pow(Math.sin(Math.PI*i/24),0.7),r=Math.round(w),x=W*0.28+Math.cos(a)*11,y=H/2+Math.sin(a)*11;
    for(let k=-r;k<=r;k++)px(x+Math.cos(a)*k,y+Math.sin(a)*k,Math.abs(k)<=Math.floor(w*0.4)?set.core:setCol(set.edge,i>>2));}
  for(let i=0;i<=30;i++){const a=-Math.PI/2+i/30*Math.PI*1.7,x=W*0.72+Math.cos(a)*7,y=H/2+Math.sin(a)*6;px(x,y,setCol(set.tr,i>>2));px(x+1,y,setCol(set.tr,i>>2));}
  set.burst.forEach((c,i)=>px(W*0.72+[-2,2,0][i%3],H/2+[0,1,-2][i%3],c));
}
// little pixel icons for supplies and spin prizes
function paintIcon(cv,kind){
  const g=cv.getContext('2d');g.clearRect(0,0,cv.width,cv.height);const P=(x,y,c,w,h)=>{g.fillStyle=c;g.fillRect(x,y,w||1,h||1);};
  if(kind==='ramen'){P(2,7,'#000',14,1);P(1,8,'#000',16,1);P(2,8,'#c8203a',14,1);P(2,9,'#000',14,4);P(3,9,'#b8142a',12,3);P(5,10,'#ece4d7',8,1);P(4,13,'#000',10,1);P(5,13,'#7a0d1c',8,1);
    for(const x of [4,6,8,10,12,13])P(x,5+(x%3),'#ffe066',1,3-(x%3));P(3,6,'#f2c14e',12,1);P(12,0,'#6b4423',1,7);P(14,0,'#6b4423',1,7);P(6,5,'#ece4d7',3,1);P(7,4,'#f2a7b8',1,1);}
  else if(kind==='charm'){P(4,0,'#000',6,1);P(5,1,'#e8c15a',4,2);P(3,3,'#000',8,1);P(2,4,'#000',1,10);P(11,4,'#000',1,10);P(3,14,'#000',8,1);P(3,4,'#c8203a',8,10);P(4,5,'#e8506a',1,8);P(6,6,'#e8c15a',2,1);P(6,8,'#e8c15a',2,1);P(5,10,'#e8c15a',4,1);P(7,6,'#e8c15a',1,6);}
  else if(kind==='koban'){P(3,1,'#000',8,1);P(1,3,'#000',1,8);P(12,3,'#000',1,8);P(3,12,'#000',8,1);P(2,2,'#000',1,1);P(11,2,'#000',1,1);P(2,11,'#000',1,1);P(11,11,'#000',1,1);P(2,3,'#e8c15a',10,8);P(3,2,'#e8c15a',8,10);P(4,3,'#fff0a0',2,6);P(6,5,'#b8902e',2,4);P(5,6,'#b8902e',4,1);}
  else if(kind==='gift'){P(1,5,'#000',16,1);P(1,6,'#000',1,9);P(16,6,'#000',1,9);P(1,15,'#000',16,1);P(2,6,'#b8142a',14,9);P(2,6,'#e8506a',14,2);P(8,5,'#e8c15a',2,10);P(2,9,'#e8c15a',14,1);P(5,1,'#000',3,1);P(10,1,'#000',3,1);P(4,2,'#000',1,3);P(13,2,'#000',1,3);P(5,2,'#e8c15a',3,3);P(10,2,'#e8c15a',3,3);P(8,3,'#fff0a0',2,2);}
  else if(kind==='shard'){P(6,0,'#000',2,1);P(5,1,'#000',1,2);P(8,1,'#000',1,2);P(4,3,'#000',1,5);P(9,3,'#000',1,5);P(5,8,'#000',1,3);P(8,8,'#000',1,3);P(6,11,'#000',2,1);P(6,1,'#ff4a5c',2,10);P(5,3,'#b8142a',4,5);P(6,2,'#ffffff',1,3);P(5,8,'#7a0d1c',3,2);}
}
// a thirst skin's card: a blood blade in its colours with a whisper of its aura
function prevThirst(cv,it){const g=cv.getContext('2d');g.clearRect(0,0,cv.width,cv.height);flush();const keep=lx,gt=S.gt;lx=g;TS_LEND=it;S.gt=performance.now()/1000;
  try{for(let i=0;i<22;i++){const x=6+i*1.3,y=15-i*0.55;pset(x,y,tsGrow(i));pset(x,y+1,tsGrow(i+1));}pset(35,3,tsGlint());thirstAura(it,1.3,20,12,0.9);flush();}catch(_){}
  lx=keep;S.gt=gt;TS_LEND=null;}
function paintPreviews(){
  for(const cv of $('menuInner').querySelectorAll('canvas[data-pv]')){const key=cv.dataset.pv,it=COS[key];if(!it)continue;
    if(it.type==='o')prevOutfit(cv,it.id);else if(it.type==='k')prevWeapon(cv,'katana',it);else if(it.type==='w')prevWeapon(cv,it.w,it);else if(it.type==='s')prevSet(cv,it);else if(it.type==='t')prevThirst(cv,it);}
  for(const cv of $('menuInner').querySelectorAll('canvas[data-icon]'))paintIcon(cv,cv.dataset.icon);
}
// ---------- the armory menu ----------
const pvAttr=it=>`data-pv="${it.key}" width="${it.type==='o'?24:it.type==='s'||it.type==='t'?40:44}" height="${it.type==='o'?28:20}"`;
function armCard(it){
  const own=cosOwned(it.key),eq=cosEquipped(it.key),lock=!own&&!(it.r==='legendary'||it.src==='shop'),sel=ARM.sel&&ARM.sel.key===it.key;
  const pw=it.type==='o'?24:it.type==='s'||it.type==='t'?40:44,ph=it.type==='o'?28:20;
  return`<button type="button" class="sh-card r-${it.r}${eq?' eq':''}${lock?' lock':''}${sel?' sel':''}" data-m="armitem" data-key="${it.key}">
    <canvas data-pv="${it.key}" width="${pw}" height="${ph}" style="width:${pw*(it.type==='o'?2.5:2)}px;height:${ph*(it.type==='o'?2.5:2)}px"></canvas>
    <span class="sh-nm">${esc(it.name)}</span><span class="sh-r">${it.r}</span><span class="sh-how">${esc(itemHow(it))}</span></button>`;
}
const SUPPLIES={ramen:{name:'Ramen ticket',desc:'+1 soul for your next run.',cost:40,icon:'ramen'},charm:{name:'Revive charm',desc:'Rise once when you fall. You choose when to burn it.',cost:90,icon:'charm'}};
function wEqKey(w){const st=cosState();return st.eq.w[w]&&cosOwned(st.eq.w[w])?st.eq.w[w]:'w:'+w+':'+COS_WSKINS[w][0].id;}
// what the stage shows for the current tab and selection
function armKeys(){
  const sl=ARM.sel;
  if(sl&&sl.key)return[sl.key];
  if(sl&&sl.bundle)return BUNDLES.find(b=>b.id===sl.bundle).items;
  if(ARM.tab==='w')return[wEqKey(ARM.wtab)];
  if(ARM.tab==='t')return[cosState().eq.t];
  if(ARM.tab==='spin'){if(ARM.spin&&ARM.spin.item)return[ARM.spin.item];return[weekendLegend()];}
  return[];
}
const rarTag=r=>`<span class="sh-r r-${r}">${r}</span>`;
function armInfo(){
  const sl=ARM.sel,st=cosState();
  if(sl&&sl.key){const it=COS[sl.key],own=cosOwned(it.key),eq=cosEquipped(it.key),paid=it.r==='legendary',buyable=paid||it.src==='shop';
    const btn=own?(eq?'<button class="btn ghost" type="button" disabled>Equipped</button>':`<button class="btn" type="button" data-m="armequip">Equip</button>`)
      :buyable?`<button class="btn" type="button" data-m="armask">Buy · ${paid?PAID_PRICE:RAR[it.r].koban+' koban'}</button>`:`<button class="btn ghost" type="button" disabled>Locked</button>`;
    return`<div class="ai-head"><b>${esc(it.name)}</b>${rarTag(it.r)}</div><p class="ai-sub">${esc(it.label)} · ${esc(itemHow(it))}</p>${btn}`;}
  if(sl&&sl.bundle){const b=BUNDLES.find(x=>x.id===sl.bundle),owned=b.items.every(cosOwned);
    return`<div class="ai-head"><b>${esc(b.name)}</b></div><ul class="ai-list">${b.items.map(k=>`<li>${rarTag(COS[k].r)} ${esc(COS[k].name)} <i>${esc(COS[k].label)}</i>${cosOwned(k)?' <em>owned</em>':''}</li>`).join('')}</ul>
      ${(()=>{const pr=bundlePrice(b),cut=pr<b.koban&&!owned?` <s>${b.koban}</s>`:'';return owned?'<button class="btn ghost" type="button" disabled>Owned</button>':(META.koban||0)>=pr?`<button class="btn" type="button" data-m="buybundle" data-id="${b.id}">Buy · ${pr} koban${cut}</button>`:`<button class="btn ghost" type="button" disabled>${pr} koban · you have ${META.koban||0}</button>`;})()}${!owned&&bundlePrice(b)<b.koban?'<p class="ai-sub">Cheaper for the pieces you already own.</p>':''}`;}
  if(sl&&sl.pack){const p=KOBAN_PACKS.find(x=>x.id===sl.pack);return`<div class="ai-head"><canvas data-icon="koban" width="14" height="14" class="ai-ic"></canvas><b>${p.koban} koban</b></div><p class="ai-sub">Spend koban on skins, bundles and supplies.</p><button class="btn" type="button" data-m="buypack" data-id="${p.id}">Buy · ${p.price}</button>`;}
  if(sl&&sl.sup){const u=SUPPLIES[sl.sup];return`<div class="ai-head"><canvas data-icon="${u.icon}" width="18" height="16" class="ai-ic"></canvas><b>${esc(u.name)}</b></div><p class="ai-sub">${esc(u.desc)} You have ${META[sl.sup]||0}.</p>${(META.koban||0)>=u.cost?`<button class="btn" type="button" data-m="buysup" data-id="${sl.sup}">Buy · ${u.cost} koban</button>`:`<button class="btn ghost" type="button" disabled>${u.cost} koban · you have ${META.koban||0}</button>`}`;}
  if(ARM.tab==='spin'){const leg=COS[weekendLegend()];if(ARM.spin&&ARM.spin.item){const it=COS[ARM.spin.item];return`<div class="ai-head"><b>${esc(it.name)}</b>${rarTag(it.r)}</div><p class="ai-sub">${esc(it.label)} · yours now</p>${cosEquipped(it.key)?'':`<button class="btn" type="button" data-m="armequip" data-key="${it.key}">Equip</button>`}`;}
    return`<div class="ai-head"><b>${esc(leg.name)}</b>${rarTag('legendary')}</div><p class="ai-sub">${isWeekend()?'In the spin this weekend':'In the spin next weekend'} · ${esc(leg.label)}</p>`;}
  if(ARM.tab==='w'){const it=COS[wEqKey(ARM.wtab)];return`<div class="ai-head"><b>${esc(WEAPONS[ARM.wtab].name)}</b></div><p class="ai-sub">Wearing: ${esc(it.name)}. Tap a skin to try it on.</p>`;}
  const o=COS[st.eq.o]&&cosOwned(st.eq.o)?COS[st.eq.o]:null,k=COS[st.eq.k]&&cosOwned(st.eq.k)?COS[st.eq.k]:COS['k:steel'],ss=slashSet();
  return`<div class="ai-head"><b>Your look</b></div><p class="ai-sub">${esc(o?o.name:'Default outfit')} · ${esc(k?k.name:'Tamahagane')} · ${esc(ss.name)} slashes. Tap anything to try it on.</p>`;
}
function armRefreshSide(){const inf=$('armInfo');if(inf){inf.innerHTML=armInfo();for(const cv of inf.querySelectorAll('canvas[data-icon]'))paintIcon(cv,cv.dataset.icon);}pvSet(armKeys());
  for(const el of $('menuInner').querySelectorAll('[data-sel]'))el.classList.toggle('sel',el.dataset.sel===selId(ARM.sel));}
const selId=sl=>!sl?'':sl.key?'k:'+sl.key:sl.bundle?'b:'+sl.bundle:sl.pack?'p:'+sl.pack:'s:'+sl.sup;
// a bundle costs less for every piece you already own: the full price, scaled by the value of the pieces still missing
function bundleItemValue(k){const it=COS[k];return it.koban||(RAR[it.r]&&RAR[it.r].koban)||600;}
function bundlePrice(b){const all=b.items.reduce((a,k)=>a+bundleItemValue(k),0),miss=b.items.filter(k=>!cosOwned(k)).reduce((a,k)=>a+bundleItemValue(k),0);return miss<=0?0:Math.max(10,Math.round(b.koban*miss/all/10)*10);}
MENUS.armory=function(){
  const st=cosState(),tab=ARM.tab;
  const tabs=[['o','Outfits'],['k','Katana'],['w','Weapons'],['s','Slash sets'],['t','Thirst'],['spin','Daily spin'],['koban','Koban']];
  let body='';
  if(tab==='o'||tab==='k'||tab==='s'||tab==='t'){const list=Object.values(COS).filter(x=>x.type===tab);body=`<div class="sh-grid">${list.map(armCard).join('')}</div>`;}
  else if(tab==='w'){body=`<div class="mv-tabs sub">${Object.keys(COS_WSKINS).map(w=>`<button type="button" class="${ARM.wtab===w?'on':''}" data-m="armw" data-w="${w}">${WEAPONS[w].name}</button>`).join('')}</div>
    <div class="sh-grid">${COS_WSKINS[ARM.wtab].map(x=>armCard(COS['w:'+ARM.wtab+':'+x.id])).join('')}</div>`;}
  else if(tab==='spin'){const sp=spinState(),can=sp.free>0&&!ARM.spinning,adLeft=AD_SPINS-sp.ads,leg=COS[weekendLegend()];
    body=`<div class="spin-wrap"><div class="reel" id="reel"><div class="reel-strip" id="reelStrip">${ARM.spin&&ARM.spin.reel?ARM.spin.reel:reelIdle()}</div><div class="reel-mark"></div></div>
      <div class="spin-res ${ARM.spin?ARM.spin.rar||'':'idle'}" id="spinRes">${ARM.spin?esc(ARM.spin.text):'福引 · daily spin'}</div>
      <div class="mv-list"><button class="btn" type="button" data-m="spinfree"${can?'':' disabled'}>${sp.free>0?'Free spin':'Free spin used · back tomorrow'}</button>
      <button class="btn ghost" type="button" data-m="spinad"${adLeft>0&&!ARM.spinning?'':' disabled'}>${adLeft>0?`Watch an ad to spin · ${adLeft} left today`:'No ad spins left today'}</button></div>
      <table class="odds"><thead><tr><th>Prize</th><th>Chance</th></tr></thead><tbody>${spinOdds().map(([k,p])=>`<tr class="${k==='epic'?'ep':k==='legend'?'gold':''}"><td>${esc(k==='legend'?'This weekend\'s legendary: '+leg.name:SPIN_NAMES[k])}</td><td>${p}%</td></tr>`).join('')}</tbody></table>
      <p class="mv-note">One free spin a day and up to ${AD_SPINS} more for watching ads. Spins are never sold. Anything you already own turns into koban.</p></div>`;}
  else if(tab==='koban'){const S2=selId(ARM.sel);body=`<div class="set-sec"><h3>Koban</h3><div class="sh-grid packs">${KOBAN_PACKS.map(p=>`<button type="button" class="sh-card pack${S2==='p:'+p.id?' sel':''}" data-m="armsel" data-sel="p:${p.id}"><canvas data-icon="koban" width="14" height="14" style="width:42px;height:42px"></canvas><span class="sh-nm">${p.koban} koban</span><span class="sh-how">${p.price}</span></button>`).join('')}</div></div>
    <div class="set-sec"><h3>Bundles</h3>${BUNDLES.map(b=>{const owned=b.items.every(cosOwned);return`<button type="button" class="sh-row bundle${S2==='b:'+b.id?' sel':''}" data-m="armsel" data-sel="b:${b.id}"><span class="bthumbs">${b.items.map(k=>`<canvas ${pvAttr(COS[k])} style="width:${COS[k].type==='o'?24:COS[k].type==='s'?40:44}px;height:${COS[k].type==='o'?28:20}px"></canvas>`).join('')}</span><b>${esc(b.name)}</b><i>${owned?'Owned':bundlePrice(b)+' koban'}</i></button>`;}).join('')}</div>
    <div class="set-sec"><h3>Supplies</h3>${Object.entries(SUPPLIES).map(([id,u])=>`<button type="button" class="sh-row${S2==='s:'+id?' sel':''}" data-m="armsel" data-sel="s:${id}"><canvas data-icon="${u.icon}" width="18" height="16" style="width:36px;height:32px"></canvas><b>${esc(u.name)}</b><i>${u.cost} koban</i></button>`).join('')}</div>
    <p class="mv-note">Koban also come from feats, daily challenges, the 7-day gift, the spin and duplicates.</p>${NP()?'<button class="btn ghost" type="button" data-m="restore">Restore purchases</button>':''}`;}
  menuShow(`<div class="mv-head"><div class="mv-title">Armory <span class="mv-sub">武具蔵</span></div><div class="sh-bal"><span>${META.koban||0} koban</span><span>${META.shards} 血晶</span></div><button class="btn ghost mv-x" type="button" data-m="back">Back</button></div>
    <div class="mv-tabs">${tabs.map(([k,l])=>`<button type="button" class="${tab===k?'on':''}" data-m="armtab" data-tab="${k}">${l}</button>`).join('')}</div>
    <div class="arm-split"><div class="arm-side"><canvas class="pv-stage" id="pvStage" width="${PVW}" height="${PVH}"></canvas><div class="arm-info" id="armInfo">${armInfo()}</div></div>
    <div class="mv-body sh-body arm-main">${body}</div></div>`,'armory');
  $('menuInner').classList.add('wide');paintPreviews();pvMount($('pvStage'),armKeys());
  if(!ARM.spinning&&ARM.spin&&ARM.spin.x!=null&&$('reelStrip'))$('reelStrip').style.transform=`translateX(${-ARM.spin.x}px)`;
};
MENUS.armbuy=function(){
  const it=COS[ARM.pending];if(!it){menuBack();return;}const paid=it.r==='legendary',price=paid?PAID_PRICE:RAR[it.r].koban+' koban',can=paid||(META.koban||0)>=RAR[it.r].koban;
  menuShow(`<div class="mv-head"><div class="mv-title">${esc(it.name)}</div><button class="btn ghost mv-x" type="button" data-m="back">Back</button></div>
    <div class="mv-body sh-buy"><canvas class="pv-stage big" id="pvStage" width="${PVW}" height="${PVH}"></canvas>
      <p>${rarTag(it.r)} · ${esc(it.label)}</p><p class="mv-note">${paid?'Legendary items are bought with real money.':can?`You have ${META.koban||0} koban.`:`You have ${META.koban||0} koban. You need ${RAR[it.r].koban}.`}</p></div>
    <div class="mv-list"><button class="btn" type="button" data-m="armconfirm"${can?'':' disabled'}>Buy · ${price}</button>${!paid&&!can?'<button class="btn ghost" type="button" data-m="armtab" data-tab="koban">Get koban</button>':''}<button class="btn ghost" type="button" data-m="back">Not now</button></div>`,'armbuy');
  $('menuInner').classList.remove('wide');pvMount($('pvStage'),[it.key]);
};
MENUS.testbuy=function(){
  const p=ARM.purchase;menuShow(`<div class="mv-head"><div class="mv-title">Test purchase</div></div><div class="mv-body"><p class="mv-note">${esc(p.label)} · ${esc(p.price)}</p><p class="mv-note">Store billing is not connected in this build, so nothing is charged. In the Play Store version this opens Google Play's payment sheet.</p></div>
    <div class="mv-list"><button class="btn" type="button" data-m="testok">Complete test purchase</button><button class="btn ghost" type="button" data-m="testno">Cancel</button></div>`,'testbuy');
};
// ---------- money and ads ----------
// Google Play Billing through @capgo/native-purchases. Product ids: legend_<item> (one-time), koban_s/m/l (consumable).
const NP=()=>isApp()&&window.Capacitor&&Capacitor.Plugins&&Capacitor.Plugins.NativePurchases;
const skuOf=key=>'legend_'+key.replace(/:/g,'_');
function buyProduct(sku,label,price,onOk,consumable){
  const bill=NP();
  if(bill&&bill.purchaseProduct){
    bill.purchaseProduct({productIdentifier:sku,productType:'inapp',quantity:1}).then(r=>{
      if(consumable&&r&&r.purchaseToken&&bill.consumePurchase)bill.consumePurchase({purchaseToken:r.purchaseToken}).catch(()=>{});
      onOk();}).catch(()=>{sfx('deny');});
    return;}
  ARM.purchase={sku,label,price,onOk};menuOpen('testbuy');
}
function restorePurchases(quiet){
  const bill=NP();if(!bill||!bill.getPurchases)return;
  bill.getPurchases({productType:'inapp'}).then(r=>{let n=0;for(const p of (r&&r.purchases)||[]){const it=Object.values(COS).find(x=>x.r==='legendary'&&skuOf(x.key)===p.productIdentifier);if(it&&!cosOwned(it.key)){cosGrant(it.key);n++;}}
    if(!quiet&&MENU.cur==='armory'){menuOpen('armory',false);}}).catch(()=>{});
}
// AdMob rewarded ads through @capacitor-community/admob, with Google's consent form where the law asks for it
const ADMOB_REWARDED='ca-app-pub-3940256099942544/5224354917'; // Google's public test unit. Replace with your own before release.
let AD_BUSY=false,AD_READY=null;
function adInit(){
  const Ad=isApp()&&window.Capacitor&&Capacitor.Plugins&&Capacitor.Plugins.AdMob;if(!Ad||AD_READY)return AD_READY;
  AD_READY=(async()=>{try{let ci=await Ad.requestConsentInfo();if(ci&&ci.isConsentFormAvailable&&ci.status==='REQUIRED')ci=await Ad.showConsentForm();if(ci&&ci.canRequestAds===false)return false;await Ad.initialize({});return true;}catch(_){return false;}})();
  return AD_READY;
}
function rewardedAd(placement,onReward){
  if(AD_BUSY)return;AD_BUSY=true;const done=ok=>{AD_BUSY=false;if(ok)onReward();};
  const Ad=isApp()&&window.Capacitor&&Capacitor.Plugins&&Capacitor.Plugins.AdMob;
  if(Ad&&Ad.prepareRewardVideoAd){(async()=>{let got=false,h=null;
    try{if(!(await adInit())){done(false);text(P.x,P.y-50,'ADS ARE OFF',C.ash);return;}
      h=await Ad.addListener('onRewardedVideoAdReward',()=>{got=true;});await Ad.prepareRewardVideoAd({adId:ADMOB_REWARDED});const r=await Ad.showRewardVideoAd();done(got||!!(r&&r.amount!=null));}
    catch(_){done(false);text(P.x,P.y-50,'NO AD AVAILABLE',C.ash);}
    try{h&&h.remove&&h.remove();}catch(_){}})();return;}
  // test placeholder: a short countdown standing in for the ad
  const ov=$('adOv');ov.hidden=false;let t=3;$('adTxt').textContent=`Test ad · ${placement} · ${t}`;sfx('click');
  const iv=setInterval(()=>{t--;$('adTxt').textContent=`Test ad · ${placement} · ${t}`;if(t<=0){clearInterval(iv);ov.hidden=true;done(true);}},1000);
}
setTimeout(()=>{try{adInit();restorePurchases(true);}catch(_){}},1500);
// ---------- the spin: a reel of prizes that rolls past the marker and slows onto what you won ----------
const RCW=78; // one reel card, px
function prizeCard(pz,win){
  const it=pz.item?COS[pz.item]:null;
  if(it)return`<div class="rc r-${it.r}${win?' win':''}"><canvas ${pvAttr(it)}></canvas><span>${esc(it.name)}</span></div>`;
  const ic={shardsS:['shard','10 血晶'],shardsL:['shard','30 血晶'],koban5:['koban','5 koban'],ramen:['ramen','Ramen'],revive:['charm','Revive charm'],koban:['koban',pz.text||'koban']}[pz.kind]||['koban',pz.text||''];
  return`<div class="rc r-${pz.kind==='shardsL'||pz.kind==='revive'?'rare':'common'}${win?' win':''}"><canvas data-icon="${ic[0]}" width="18" height="16"></canvas><span>${esc(ic[1])}</span></div>`;
}
function fillerPrize(){
  const rows=spinOdds();let r=Math.random()*100,k='shardsS';for(const [kk,p] of rows){if(r<p){k=kk;break;}r-=p;}
  if(k==='common'||k==='rare'||k==='epic'){const L=Object.values(COS).filter(x=>x.r===k&&x.src!=='free');return{kind:k,item:L[Math.floor(Math.random()*L.length)].key};}
  if(k==='legend')return{kind:k,item:weekendLegend()};return{kind:k};
}
function reelIdle(){
  // a calm strip that shows a bit of everything the spin can give
  const show=[{kind:'shardsS'},{kind:'koban5'},{kind:'common',item:Object.values(COS).find(x=>x.r==='common'&&x.src!=='free').key},{kind:'ramen'},{kind:'rare',item:Object.values(COS).find(x=>x.r==='rare'&&x.src==='shop').key},{kind:'shardsL'},{kind:'revive'},{kind:'epic',item:Object.values(COS).find(x=>x.r==='epic').key},{kind:'shardsS'}];
  return show.map(p=>prizeCard(p)).join('');
}
function doSpin(kind){
  const sp=spinState();if(ARM.spinning)return;if(kind==='free'&&sp.free<=0)return;if(kind==='ad'&&sp.ads>=AD_SPINS)return;
  const go=()=>{if(kind==='free')sp.free--;else sp.ads++;
    const res=rollSpin(),it=res.item?COS[res.item]:null;
    const win=it?{kind:res.kind,item:res.item}:{kind:/koban \(/.test(res.text)?'koban':res.kind,text:res.text};
    const N=44,WI=38,cards=[];for(let i=0;i<N;i++)cards.push(i===WI?win:fillerPrize());
    ARM.spinning=true;ARM.spin={text:'…',rar:'',reel:cards.map((c,i)=>prizeCard(c)).join('')};ARM.sel=null;ARM.tab='spin';menuOpen('armory',false);
    const dur=4600,off=(Math.random()-0.5)*RCW*0.6,t0=performance.now();let lastIdx=-1,raf=0;
    const target=()=>{const box=$('reel');const W=box?box.clientWidth:600;return WI*RCW+RCW/2-W/2+off;};
    const ease=u=>1-Math.pow(1-u,4);
    const step=now=>{const u=Math.min(1,(now-t0)/dur),x=target()*ease(u),strip=$('reelStrip');
      if(strip)strip.style.transform=`translateX(${-x}px)`;
      const box=$('reel'),mid=x+(box?box.clientWidth/2:300),idx=Math.floor(mid/RCW);if(idx!==lastIdx){lastIdx=idx;sfx('blip');}
      if(u<1){raf=requestAnimationFrame(step);ARM.spinAnim.raf=raf;return;}
      ARM.spinning=false;ARM.spinAnim=null;
      ARM.spin={text:res.text,rar:it?'r-'+it.r:'',item:res.item||null,reel:cards.map((c,i)=>prizeCard(c,i===WI)).join(''),x};
      sfx(it&&(it.r==='epic'||it.r==='legendary')?'gong':'coin');if(it&&(it.r==='epic'||it.r==='legendary'))sfx('learn');
      if(typeof featEvent==='function')featEvent('spin',res);
      if(MENU.cur==='armory'&&ARM.tab==='spin')menuOpen('armory',false);};
    ARM.spinAnim={raf:requestAnimationFrame(step),reattach(){}};
  };
  if(kind==='ad')rewardedAd('spin',go);else go();
}
// ---------- clicks inside the armory ----------
const MENU_ACTS={
  armtab(t){if(ARM.spinning)return;ARM.tab=t.dataset.tab;ARM.keepScroll=false;ARM.sel=null;if(ARM.tab!=='spin')ARM.spin=null;if(MENU.cur!=='armory'){MENU.stack=[];}menuOpen('armory',false);},
  armw(t){ARM.wtab=t.dataset.w;ARM.keepScroll=false;ARM.sel=null;menuOpen('armory',false);},
  armitem(t){const key=t.dataset.key,it=COS[key];if(!it)return;
    if(cosOwned(key)&&!cosEquipped(key)){cosEquip(key);sfx('arm');ARM.sel={key};menuOpen('armory',false);return;}
    ARM.sel={key};sfx('blip');armRefreshSide();},
  armsel(t){const v=t.dataset.sel,k=v.slice(2),c=v[0];ARM.sel=c==='b'?{bundle:k}:c==='p'?{pack:k}:c==='s'?{sup:k}:{key:k};armRefreshSide();},
  armequip(t){const key=t.dataset.key||(ARM.sel&&ARM.sel.key);if(key&&cosEquip(key)){sfx('arm');menuOpen('armory',false);}},
  armask(){if(!ARM.sel||!ARM.sel.key)return;ARM.pending=ARM.sel.key;menuOpen('armbuy');},
  armconfirm(){const it=COS[ARM.pending];if(!it)return;
    const grant=()=>{cosGrant(it.key);cosEquip(it.key);sfx('buy');sfx('learn');if(typeof featEvent==='function')featEvent('buy',it.key);MENU.stack=[];ARM.tab=it.type==='w'?'w':it.type;if(it.type==='w')ARM.wtab=it.w;ARM.sel={key:it.key};menuOpen('armory',false);};
    if(it.r==='legendary'){buyProduct(skuOf(it.key),it.name,PAID_PRICE,grant);return;}
    const p=RAR[it.r].koban;if((META.koban||0)<p){sfx('deny');return;}META.koban-=p;saveMeta();grant();},
  spinfree(){doSpin('free');},spinad(){doSpin('ad');},
  buypack(t){const p=KOBAN_PACKS.find(x=>x.id===t.dataset.id);buyProduct(p.id,p.koban+' koban',p.price,()=>{META.koban=(META.koban||0)+p.koban;saveMeta();sfx('coin');MENU.stack=[];ARM.tab='koban';menuOpen('armory',false);},true);},
  buybundle(t){const b=BUNDLES.find(x=>x.id===t.dataset.id),pr=bundlePrice(b);if(pr<=0)return;if((META.koban||0)<pr){sfx('deny');text(P.x,P.y-50,'NOT ENOUGH KOBAN',C.ash);return;}META.koban-=pr;for(const k of b.items)if(!cosOwned(k))cosGrant(k);saveMeta();sfx('buy');sfx('learn');menuOpen('armory',false);},
  buysup(t){const id=t.dataset.id,c=SUPPLIES[id].cost;if((META.koban||0)<c){sfx('deny');return;}META.koban-=c;META[id]=(META[id]||0)+1;saveMeta();sfx('buy');menuOpen('armory',false);},
  testok(){const p=ARM.purchase;ARM.purchase=null;menuBack();if(p)p.onOk();},
  testno(){ARM.purchase=null;menuBack();},
  revivead(){menuClose();rewardedAd('revive',()=>reviveRun('RISEN'));},
  revivecharm(){if(!((META.charm||0)>0)||S.charmUsed)return;menuClose();META.charm--;S.charmUsed=true;saveMeta();reviveRun('THE CHARM BURNS',true);},
  reviveno(){menuClose();showSummary(false);},
  restore(){restorePurchases(false);sfx('click');},
  armory(){ARM.tab='o';ARM.spin=null;ARM.sel=null;menuOpen('armory');},
};
// ---------- falling, and rising again ----------
function reviveRun(why,charm){
  S.dead=0;if(!charm)S.reviveUsed=true;P.hp=P.max;P.inv=2.5;S.running=true;S.mode='run';S.paused=false;
  S.eslashes=[];S.shots=[];S.tmarks=[];for(const e of S.enemies){if(e.state==='wind'||e.state==='strike'){e.state='strafe';e.cuts=[];}e.cd=Math.max(e.cd,1.2);}
  if(S.stats)S.stats.killer='';burst(P.x,P.y-14,40,C.hi,320,0.9,3);text(P.x,P.y-64,why,C.hi,true);sfx('learn');S.flash=0.15;S.slowT=Math.max(S.slowT,1);last=performance.now();
}
function onDeath(){
  if(S.pro){proFallen();return;}
  if(S.freeRevive){S.freeRevive=false;reviveRun('SECOND WIND');return;}
  // a fall is never spent for you: choose to burn a charm, watch an ad, or let the run end
  const noRev=!!(S.modeRules&&S.modeRules.noRevive)||S.inHub,charm=(META.charm||0)>0&&!S.charmUsed&&!noRev,ad=!S.reviveUsed&&!noRev;
  if(charm||ad){S.running=false;MENU.stack=[];
    const opts=(charm?`<button class="btn" type="button" data-m="revivecharm">${esc(tr('Burn a revive charm ({0} left)').replace('{0}',META.charm))}</button>`:'')+(ad?`<button class="btn${charm?' ghost':''}" type="button" data-m="revivead">Watch an ad to rise again</button>`:'');
    menuShow(`<div class="mv-head"><div class="mv-kanji">魂</div><div class="mv-title">Your soul scatters</div></div><div class="mv-body"><p class="mv-note">Rise again with a full soul, or let the run end here.</p></div>
      <div class="mv-list">${opts}<button class="btn ghost" type="button" data-m="reviveno">Let it end</button></div>`,'revive');return;}
  showSummary(false);
}

Object.assign(MENU_ACTS,{
  cheatall(t){cheatUnlockAll();sfx('learn');t.textContent='Done';t.classList.add('on');},
  cheatday(t){const sp=spinState();sp.free=1;sp.ads=0;giftState().day='';saveMeta();syncGiftBadge();sfx('coin');t.textContent='Done';t.classList.add('on');},
});

// ================= the 7-day gift: something every day you play, and a skin of your choice on the seventh =================
// Days only move forward on days you claim, so missing a day never costs you progress.
const GIFT_DAYS=[{k:'koban',n:20,icon:'koban'},{k:'shards',n:60,icon:'shard'},{k:'ramen',n:1,icon:'ramen'},{k:'koban',n:30,icon:'koban'},{k:'shards',n:120,icon:'shard'},{k:'charm',n:1,icon:'charm'},{k:'skin',icon:'gift'}];
const giftLabel=d=>d.k==='koban'?`${d.n} koban`:d.k==='shards'?`${d.n} 血晶`:d.k==='ramen'?'Ramen ticket':d.k==='charm'?'Revive charm':'A rare or epic skin, your pick';
function giftState(){if(!META.gift||typeof META.gift!=='object')META.gift={day:'',idx:0,cycle:0,pick:null};return META.gift;}
const giftReady=()=>giftState().day!==dayKey();
// three skins to choose from on day seven: two rares and an epic you don't own, fixed once offered
function giftPicks(){
  const g=giftState();if(g.pick&&g.pick.length&&g.pick.some(k=>COS[k]&&!cosOwned(k)))return g.pick.filter(k=>COS[k]);
  const pool=r=>Object.values(COS).filter(x=>x.r===r&&x.src!=='free'&&x.src!=='paid'&&!cosOwned(x.key)).map(x=>x.key),shuf=a=>{for(let i=a.length-1;i>0;i--){const j=Math.floor(Math.random()*(i+1));[a[i],a[j]]=[a[j],a[i]];}return a;};
  const ep=shuf(pool('epic')),ra=shuf(pool('rare'));let out=[...ra.slice(0,2),...ep.slice(0,1)];
  if(out.length<3)out=out.concat(ep.slice(1,1+3-out.length));if(out.length<3)out=out.concat(ra.slice(2,2+3-out.length));
  g.pick=out;saveMeta();return out;
}
function giftAdvance(){const g=giftState();g.day=dayKey();g.idx++;if(g.idx>=7){g.idx=0;g.cycle++;g.pick=null;}saveMeta();}
function claimGift(){
  const g=giftState();if(!giftReady())return;const d=GIFT_DAYS[g.idx];
  if(d.k==='skin'){const P2=giftPicks();if(P2.length){GIFT.sel=P2[0];menuOpen('giftpick');return;}META.koban+=250;giftAdvance();sfx('coin');GIFT.msg='You own every skin there is: 250 koban instead.';menuOpen('gift',false);return;}
  if(d.k==='koban')META.koban=(META.koban||0)+d.n;else if(d.k==='shards')META.shards+=d.n;else META[d.k]=(META[d.k]||0)+d.n;
  giftAdvance();sfx('coin');sfx('learn');GIFT.msg=`Day ${g.idx===0?7:g.idx}: ${giftLabel(d)}. See you tomorrow.`;menuOpen('gift',false);syncGiftBadge();
}
const GIFT={sel:null,msg:''};
MENUS.gift=function(){
  const g=giftState(),ready=giftReady();
  const tiles=GIFT_DAYS.map((d,i)=>{const done=i<g.idx,today=i===g.idx&&ready,cls=done?'done':today?'today':'';
    return`<div class="gift-tile ${cls}${i===6?' big':''}"><span class="gd">Day ${i+1}</span><canvas data-icon="${d.icon}" width="18" height="16"></canvas><span class="gl">${esc(i===6?'Skin of your choice':giftLabel(d))}</span>${done?'<span class="gk">✓</span>':''}</div>`;}).join('');
  menuShow(`<div class="mv-head"><div class="mv-kanji">贈</div><div class="mv-title">Daily gift</div><button class="btn ghost mv-x" type="button" data-m="back">Back</button></div>
    <div class="mv-body"><div class="gift-grid">${tiles}</div>${GIFT.msg?`<p class="mv-note gift-msg">${esc(GIFT.msg)}</p>`:''}<p class="mv-note">Open the game on seven different days to reach the seventh gift. Missing a day never resets it.</p></div>
    <div class="mv-list">${ready?`<button class="btn" type="button" data-m="giftclaim">Claim day ${g.idx+1}</button>`:'<button class="btn ghost" type="button" disabled>Come back tomorrow</button>'}</div>`,'gift');
  $('menuInner').classList.add('wide');paintPreviews();GIFT.msg='';
};
MENUS.giftpick=function(){
  const P2=giftPicks();if(!GIFT.sel||!P2.includes(GIFT.sel))GIFT.sel=P2[0];const it=COS[GIFT.sel];
  menuShow(`<div class="mv-head"><div class="mv-kanji">選</div><div class="mv-title">Pick your skin</div><button class="btn ghost mv-x" type="button" data-m="back">Later</button></div>
    <div class="arm-split"><div class="arm-side"><canvas class="pv-stage" id="pvStage" width="${PVW}" height="${PVH}"></canvas><div class="arm-info"><div class="ai-head"><b>${esc(it.name)}</b>${rarTag(it.r)}</div><p class="ai-sub">${esc(it.label)}</p><button class="btn" type="button" data-m="gifttake">Take ${esc(it.name)}</button></div></div>
    <div class="mv-body arm-main"><div class="sh-grid">${P2.map(k=>{const x=COS[k];return`<button type="button" class="sh-card r-${x.r}${k===GIFT.sel?' sel':''}" data-m="giftsel" data-key="${k}"><canvas ${pvAttr(x)} style="width:${x.type==='o'?60:x.type==='s'?80:88}px;height:${x.type==='o'?70:40}px"></canvas><span class="sh-nm">${esc(x.name)}</span><span class="sh-r">${x.r}</span><span class="sh-how">${esc(x.label)}</span></button>`;}).join('')}</div>
    <p class="mv-note">Whatever you pick is yours to keep. The other two may come back in a later week.</p></div></div>`,'giftpick');
  $('menuInner').classList.add('wide');paintPreviews();pvMount($('pvStage'),[GIFT.sel]);
};
Object.assign(MENU_ACTS,{
  gift(){GIFT.msg='';menuOpen('gift');},
  giftclaim(){claimGift();},
  giftsel(t){GIFT.sel=t.dataset.key;menuOpen('giftpick',false);},
  gifttake(){const k=GIFT.sel;if(!k||!giftReady())return;cosGrant(k);cosEquip(k);giftAdvance();sfx('gong');sfx('learn');GIFT.msg=`${COS[k].name} is yours. It's on you now.`;MENU.stack=[];menuOpen('gift',false);syncGiftBadge();},
});
function syncGiftBadge(){const b=$('tGift');if(b)b.classList.toggle('dot',giftReady());}
// the first time the title menu opens on a new day, the gift greets you
function maybeShowGift(){if(!giftReady()||S.giftShownDay===dayKey()||!META.tut)return;S.giftShownDay=dayKey();setTimeout(()=>{if(S.mode==='title'&&$('menuOv').hidden){GIFT.msg='';menuOpen('gift',false);}},500);}

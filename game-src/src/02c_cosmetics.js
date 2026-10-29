// ================= cosmetics: outfits, katana skins, weapon skins, slash sets · koban · the daily spin =================
// rarity: common and rare are cheap or earned, epic is bought with koban or won from the spin, legendary is paid only
// (one legendary joins the spin each weekend). src: free · shop · paid · feat:<id> · best (bestiary) · daily1 · daily7 · daily14
const RAR={common:{col:'#968b97',koban:60,dupe:15},rare:{col:'#93dcca',koban:150,dupe:40},epic:{col:'#b48cff',koban:400,dupe:100},legendary:{col:'#e3b24f',koban:0,dupe:250}};
const PAID_PRICE='US$2.99';
const COS_OUTFITS=[
  {id:'default',name:'Broken Blade',jp:'折れ刃',r:'common',src:'free'},
  {id:'akagami',name:'Red Thread',jp:'赤髪',r:'common',src:'feat:kills500'},
  {id:'aizome',name:'Indigo Rōnin',jp:'藍染',r:'common',src:'shop'},
  {id:'sakura',name:'Sakura',jp:'桜',r:'common',src:'shop'},
  {id:'momiji',name:'Autumn Leaf',jp:'紅葉',r:'common',src:'shop'},
  {id:'koke',name:'Moss Garden',jp:'苔',r:'common',src:'shop'},
  {id:'yami',name:'Midnight',jp:'闇',r:'rare',src:'shop'},
  {id:'sumi',name:'Ink Wash',jp:'墨絵',r:'rare',src:'feat:brokenwin'},
  {id:'hone',name:'Bone Collector',jp:'骨',r:'rare',src:'best'},
  {id:'yuki',name:'Snowfall',jp:'雪',r:'rare',src:'daily7'},
  {id:'kasa',name:'Straw-hat Rōnin',jp:'笠',r:'rare',src:'shop'},
  {id:'tabibito',name:'Wanderer',jp:'旅人',r:'rare',src:'daily1'},
  {id:'shinobi',name:'Shinobi',jp:'忍',r:'rare',src:'shop'},
  {id:'sohei',name:'Warrior Monk',jp:'僧兵',r:'rare',src:'feat:duels10'},
  {id:'tengu',name:'Mountain Tengu',jp:'天狗',r:'epic',src:'shop'},
  {id:'hannya',name:'Hannya',jp:'般若',r:'epic',src:'shop'},
  {id:'matsuri',name:'Summer Festival',jp:'祭',r:'epic',src:'shop'},
  {id:'raiden',name:'Thunder God',jp:'雷電',r:'epic',src:'shop'},
  {id:'kin',name:'Gilded Lord',jp:'金',r:'epic',src:'shop'},
  {id:'shogun',name:'Shōgun',jp:'将軍',r:'legendary',src:'paid'},
  {id:'kitsune',name:'Kitsune',jp:'狐',r:'legendary',src:'paid'},
  {id:'oni',name:'Oni Lord',jp:'鬼',r:'legendary',src:'paid'},
  {id:'yurei',name:'Yūrei',jp:'幽霊',r:'legendary',src:'paid'},
  {id:'chigetsu',name:'Blood Moon',jp:'血月',r:'legendary',src:'paid'}];
const COS_BLADES=[ // the katana and the broken blade
  {id:'steel',name:'Tamahagane',jp:'玉鋼',r:'common',src:'free',h:'#2a1a10',t:'#d9a648',b:'#c4ccd2',tip:'#ffffff'},
  {id:'rust',name:'Rusted',jp:'錆',r:'common',src:'feat:break50',h:'#3a2418',t:'#6a4a3a',b:'#8a5a3a',hm:'#b07040',tip:'#c89a70'},
  {id:'kuro',name:'Black Steel',jp:'黒鋼',r:'common',src:'shop',h:'#b8142a',t:'#2a2a30',b:'#4a4a56',hm:'#6a6a78',tip:'#c8ccd8'},
  {id:'shu',name:'Vermilion',jp:'朱',r:'common',src:'shop',h:'#1a1418',t:'#1a1418',b:'#c8203a',tip:'#ff8a95'},
  {id:'hisui',name:'Jade',jp:'翡翠',r:'rare',src:'shop',h:'#1a2a20',t:'#d9a648',b:'#5ad8a0',hm:'#a8f0d0',tip:'#e8fff4'},
  {id:'hone',name:'Bone',jp:'骨',r:'rare',src:'best',h:'#5a3a3a',t:'#8a7e70',b:'#ece4d7',hm:'#c0b4a0',tip:'#ffffff'},
  {id:'sumi',name:'Ink',jp:'墨',r:'rare',src:'feat:brokenwin',h:'#ece4d7',t:'#18181c',b:'#3a3a42',hm:'#c8c8d0',tip:'#ffffff'},
  {id:'sakura',name:'Cherry Wood',jp:'桜木',r:'rare',src:'shop',h:'#6a4a2a',t:'#f2a7b8',b:'#c89a6a',hm:'#e8b8a8',tip:'#f2a7b8'},
  {id:'hyo',name:'Frost',jp:'氷',r:'rare',src:'daily14',h:'#2a3a4a',t:'#bfe8ff',b:'#bfe8ff',hm:'#ffffff',tip:'#ffffff',glow:'#9ad8ff'},
  {id:'tsuki',name:'Moonlight',jp:'月光',r:'epic',src:'shop',h:'#1a1a2a',t:'#c8d0ff',b:'#e0e4ff',tip:'#ffffff',glow:'#c8d0ff'},
  {id:'raiden',name:'Thunder',jp:'雷',r:'epic',src:'shop',h:'#1a1a22',t:'#ffe066',b:'#ffe066',hm:'#ffffff',tip:'#ffffff',glow:'#9ad8ff',flick:true},
  {id:'kin',name:'Gold Leaf',jp:'金箔',r:'epic',src:'shop',h:'#2a2024',t:'#2a2024',b:'#e8c15a',hm:'#fff6d0',tip:'#ffffff'},
  {id:'noroi',name:'Cursed',jp:'呪',r:'epic',src:'shop',h:'#1a1020',t:'#6a4a9a',b:'#6a4a9a',hm:'#9a7ac8',tip:'#e0d0ff',glow:'#b48cff'},
  {id:'ryu',name:'Dragon Bone',jp:'竜骨',r:'legendary',src:'paid',h:'#3a2a1a',t:'#3ad860',b:'#e8dcc0',hm:'#c8a060',tip:'#ffffff',glow:'#3ad860'},
  {id:'chigetsu',name:'Blood Moon',jp:'血月',r:'legendary',src:'paid',h:'#1a0a10',t:'#ff2040',b:'#5a0a18',hm:'#ff2040',tip:'#ff8a95',glow:'#ff4a5c'}];
const COS_WSKINS={
  nodachi:[
    {id:'steel',name:'Field Steel',r:'common',src:'free',h:'#2a1a10',t:'#d9a648',b:'#c4ccd2',tip:'#ffffff'},
    {id:'lacquer',name:'Red Lacquer',r:'rare',src:'feat:nodachi100',h:'#b8142a',t:'#1a1418',b:'#9aa2aa',hm:'#e8eef4',tip:'#ffffff'},
    {id:'moon',name:'Pale Moon',r:'epic',src:'shop',h:'#1a1a2a',t:'#c8d0ff',b:'#e0e4ff',hm:'#ffffff',tip:'#ffffff',glow:'#c8d0ff'},
    {id:'oni',name:'Oni Cleaver',r:'legendary',src:'paid',h:'#2a1010',t:'#e8c15a',b:'#7a2228',hm:'#ff4a5c',tip:'#ff8a95',glow:'#ff4a5c'}],
  tessen:[
    {id:'iron',name:'Iron Fan',r:'common',src:'free',rib:'#2a2a30',paper:'#b8142a',paper2:'#8a1024',mark:'#ece4d7',edge:'#4a4a56'},
    {id:'sakura',name:'Sakura Fan',r:'rare',src:'shop',rib:'#6a4a2a',paper:'#fff0f4',paper2:'#e0c8d0',mark:'#f2a7b8',edge:'#c89a6a'},
    {id:'crane',name:'Crane Fan',r:'epic',src:'shop',rib:'#1a1418',paper:'#ece4d7',paper2:'#c0b4a0',mark:'#c23a2a',edge:'#e8c15a'},
    {id:'thunder',name:'Storm Fan',r:'epic',src:'shop',rib:'#1a1a22',paper:'#3a3a4e',paper2:'#26263a',mark:'#ffe066',edge:'#ffe066'}],
  bo:[
    {id:'oak',name:'White Oak',r:'common',src:'free',wd:'#c8a070',w2:'#a8804e',cap:'#8a8a92'},
    {id:'bamboo',name:'Green Bamboo',r:'rare',src:'feat:bobamboo',wd:'#7aa85a',w2:'#5a8a3e',cap:'#3e6a2a',node:'#3e6a2a'},
    {id:'iron',name:'Iron-shod',r:'rare',src:'shop',wd:'#4a4450',w2:'#2a2430',cap:'#c4ccd2'},
    {id:'shrine',name:'Shrine Staff',r:'epic',src:'shop',wd:'#c8203a',w2:'#9a1428',cap:'#e8c15a',ofuda:true}],
  kama:[
    {id:'farm',name:'Farmer’s Kama',r:'common',src:'free',h:'#8a5a2e',t:'#5a5a64',b:'#c4ccd2',tip:'#ffffff'},
    {id:'reaper',name:'Reaper',r:'epic',src:'shop',h:'#ece4d7',t:'#2a2024',b:'#4a4a52',hm:'#8a8a94',tip:'#ffffff',glow:'#93dcca'},
    {id:'harvest',name:'Golden Harvest',r:'legendary',src:'paid',h:'#3a2a1a',t:'#e8c15a',b:'#e8c15a',hm:'#fff6d0',tip:'#ffffff',glow:'#ffe066'}],
  naginata:[
    {id:'temple',name:'Temple Naginata',r:'common',src:'free',wd:'#6b4423',w2:'#4a2e18',t:'#d9a648',b:'#c4ccd2',tip:'#ffffff'},
    {id:'onna',name:'Onna-musha',r:'rare',src:'feat:naginataduels',wd:'#b8142a',w2:'#7a0d1c',t:'#e8c15a',b:'#d8dee4',tip:'#ffffff',inlay:'#e8e0f0'},
    {id:'frost',name:'Glacier',r:'epic',src:'shop',wd:'#3a4a5a',w2:'#2a3644',t:'#bfe8ff',b:'#bfe8ff',hm:'#ffffff',tip:'#ffffff',glow:'#9ad8ff'},
    {id:'pyre',name:'Funeral Pyre',r:'legendary',src:'paid',wd:'#ece4d7',w2:'#b8ae9c',t:'#1a1418',b:'#ff8a2a',hm:'#fff0a0',tip:'#ffffff',glow:'#ff6a1a'}]};
const COS_SETS=[
  {id:'crimson',name:'Crimson',jp:'紅',r:'common',src:'free',core:'#ffffff',edge:'#b8142a',tr:'#b8142a',trc:'#ffffff',burst:['#ff4a5c','#b8142a','#ffffff'],spark:'#ffffff',fx:'blood'},
  {id:'sakura',name:'Sakura',jp:'桜',r:'rare',src:'shop',core:'#fff0f4',edge:'#f2a7b8',tr:'#f2a7b8',trc:'#ffffff',burst:['#f2a7b8','#ff6a8a','#fff0f4'],spark:'#ffffff',fx:'petals'},
  {id:'kaze',name:'Jade Wind',jp:'翠風',r:'rare',src:'shop',core:'#e8fff4',edge:'#5ad8a0',tr:'#5ad8a0',trc:'#e8fff4',burst:['#5ad8a0','#3a9a6a','#c8f8e0'],spark:'#e8fff4',fx:'leaves'},
  {id:'sumi',name:'Ink',jp:'墨',r:'rare',src:'feat:traces1000',core:'#d8d4cc',edge:'#3a3a42',tr:'#18181c',trc:'#8a8a94',burst:['#18181c','#3a3a42','#5a5a64'],spark:'#d8d4cc',fx:'ink'},
  {id:'yuki',name:'Frost',jp:'雪',r:'rare',src:'daily7',core:'#ffffff',edge:'#9ad8ff',tr:'#bfe8ff',trc:'#ffffff',burst:['#ffffff','#bfe8ff','#9ad8ff'],spark:'#ffffff',fx:'snow'},
  {id:'rei',name:'Spirit',jp:'霊',r:'rare',src:'best',core:'#e0fff8',edge:'#93dcca',tr:'#93dcca',trc:'#e0fff8',burst:['#93dcca','#5ab8a8','#e0fff8'],spark:'#e0fff8',fx:'wisps'},
  {id:'kage',name:'Shadow',jp:'影',r:'epic',src:'shop',core:'#2a1a3a',edge:'#b48cff',tr:'#6a4a9a',trc:'#d8c8ff',burst:['#b48cff','#6a4a9a','#2a1a3a'],spark:'#d8c8ff',fx:'smoke'},
  {id:'gokuen',name:'Hellfire',jp:'獄炎',r:'epic',src:'shop',core:'#fff0a0',edge:'#ff6a1a',tr:'#ff8a2a',trc:'#ffe0a0',burst:['#ff6a1a','#ffb02a','#fff0a0'],spark:'#ffe0a0',fx:'embers'},
  {id:'raiden',name:'Raiden',jp:'雷電',r:'epic',src:'shop',core:'#ffffff',edge:'#ffe066',tr:'#ffe066',trc:'#fffbe0',burst:['#ffe066','#9ad8ff','#ffffff'],spark:'#9ad8ff',fx:'bolts'},
  {id:'tsuki',name:'Moonlight',jp:'月',r:'epic',src:'shop',core:'#ffffff',edge:'#c8d0ff',tr:'#c8d0ff',trc:'#ffffff',burst:['#ffffff','#c8d0ff','#8a96e0'],spark:'#ffffff',fx:'sparkle'},
  {id:'kin',name:'Gold Leaf',jp:'金箔',r:'epic',src:'shop',core:'#fff6d0',edge:'#e8c15a',tr:'#e8c15a',trc:'#fff6d0',burst:['#e8c15a','#fff6d0','#b08a30'],spark:'#ffffff',fx:'gold'},
  {id:'hotaru',name:'Fireflies',jp:'蛍',r:'epic',src:'shop',core:'#f4ffd0',edge:'#c8ff6a',tr:'#c8ff6a',trc:'#f4ffd0',burst:['#c8ff6a','#f4ffd0','#8ac83a'],spark:'#f4ffd0',fx:'fireflies'},
  {id:'chigetsu',name:'Blood Moon',jp:'血月',r:'legendary',src:'paid',core:'#1a0a10',edge:'#ff2040',tr:'#ff2040',trc:'#ffb0b8',burst:['#ff2040','#ff8a95','#1a0a10'],spark:'#ff8a95',fx:'ring'},
  {id:'kokuyo',name:'Void',jp:'黒曜',r:'legendary',src:'paid',core:'#000000',edge:'#ffffff',tr:'#ffffff',trc:'#000000',burst:['#ffffff','#000000','#968b97'],spark:'#000000',fx:'void'},
  {id:'matsuri',name:'Festival',jp:'祭',r:'legendary',src:'paid',core:'#ffffff',edge:'rainbow',tr:'rainbow',trc:'#ffffff',burst:['#ff4a5c','#ffe066','#5ad8a0','#9ad8ff','#b48cff'],spark:'#ffffff',fx:'fireworks'}];
// Bloodthirst and technique skins: the grown blade, the aura, the trigger burst, technique cuts and the blood orb
const COS_THIRST=[
 {id:'crimson',name:'Crimson',jp:'紅血',r:'common',src:'free',grow:['#b8142a','#ff4a5c','#ffffff'],core:'#1a0a10',edge:'#ff4a5c',aura:'drip',ac:['#b8142a','#ff4a5c','#ffffff'],act:'splash'},
 {id:'sumi',name:'Ink Blood',jp:'墨血',r:'rare',src:'feat:thirst300',grow:['#18181c','#4a4a54','#d8d4cc'],core:'#ece4d7',edge:'#18181c',aura:'ink',ac:['#18181c','#3a3a42','#d8d4cc'],act:'inksplash'},
 {id:'sakura',name:'Sakura Blood',jp:'桜血',r:'rare',src:'shop',grow:['#d86a8a','#f2a7b8','#fff0f4'],core:'#fff0f4',edge:'#f2a7b8',aura:'petal',ac:['#f2a7b8','#ff8aa8','#fff0f4'],act:'petalburst'},
 {id:'hyo',name:'Frostbite',jp:'凍血',r:'rare',src:'feat:daily21',grow:['#3a8ac8','#9ad8ff','#ffffff'],core:'#ffffff',edge:'#9ad8ff',aura:'frost',ac:['#bfe8ff','#9ad8ff','#ffffff'],act:'shatter'},
 {id:'hisui',name:'Jade Spirit',jp:'翠血',r:'rare',src:'feat:best75',grow:['#2a9a6a','#5ad8a0','#e8fff4'],core:'#e8fff4',edge:'#5ad8a0',aura:'leaf',ac:['#5ad8a0','#3a9a6a','#c8f8e0'],act:'leafgust'},
 {id:'oki',name:'Ember',jp:'燠',r:'rare',src:'shop',grow:['#c84a1a','#ff8a2a','#fff0a0'],core:'#fff0a0',edge:'#ff8a2a',aura:'ember',ac:['#ff6a1a','#ffb02a','#fff0a0'],act:'flare'},
 {id:'kage',name:'Oni Shadow',jp:'鬼影',r:'epic',src:'shop',grow:['#3a1a5a','#b48cff','#e8d8ff'],core:'#2a1a3a',edge:'#b48cff',aura:'smoke',ac:['#6a4a9a','#b48cff','#2a1a3a'],act:'smokepuff'},
 {id:'gokuen',name:'Hellfire',jp:'獄炎',r:'epic',src:'shop',grow:['#ff3a0a','#ffb02a','#fff6c0'],core:'#fff6c0',edge:'#ff5a1a',aura:'flame',ac:['#ff3a0a','#ffb02a','#fff6c0'],act:'flare'},
 {id:'tsuki',name:'Moonblood',jp:'月血',r:'epic',src:'shop',grow:['#6a72b0','#c8d0ff','#ffffff'],core:'#ffffff',edge:'#c8d0ff',aura:'moon',ac:['#c8d0ff','#ffffff','#8a96e0'],act:'moonrise'},
 {id:'kin',name:'Gold Leaf',jp:'金血',r:'epic',src:'shop',grow:['#b08a30','#e8c15a','#fff6d0'],core:'#fff6d0',edge:'#e8c15a',aura:'gold',ac:['#e8c15a','#fff6d0','#b08a30'],act:'goldrain'},
 {id:'kitsunebi',name:'Foxfire',jp:'狐火',r:'epic',src:'shop',grow:['#2a6ac8','#6ac8ff','#e0f4ff'],core:'#e0f4ff',edge:'#6ac8ff',aura:'fox',ac:['#6ac8ff','#2a6ac8','#e0f4ff'],act:'wispring'},
 {id:'raijin',name:'Raijin',jp:'雷神',r:'epic',src:'shop',grow:['#c8a020','#ffe066','#ffffff'],core:'#ffffff',edge:'#ffe066',aura:'bolt',ac:['#ffe066','#9ad8ff','#ffffff'],act:'thunder'},
 {id:'chigetsu',name:'Blood Moon',jp:'血月',r:'legendary',src:'paid',grow:['#5a0a18','#ff2040','#ff8a95'],core:'#1a0a10',edge:'#ff2040',aura:'ring',ac:['#ff2040','#ff8a95','#1a0a10'],act:'eclipse'},
 {id:'kokuyo',name:'Void',jp:'黒曜',r:'legendary',src:'paid',grow:['#000000','#ffffff','#968b97'],core:'#000000',edge:'#ffffff',aura:'void',ac:['#ffffff','#000000','#968b97'],act:'inversion'},
 {id:'matsuri',name:'Festival',jp:'祭',r:'legendary',src:'paid',grow:'rainbow',core:'#ffffff',edge:'rainbow',aura:'firework',ac:['#ff4a5c','#ffe066','#5ad8a0','#9ad8ff','#b48cff'],act:'fireworks'},
 {id:'ryujin',name:'Ryūjin',jp:'竜神',r:'legendary',src:'paid',grow:['#1a7a4a','#3ad860','#e8fff0'],core:'#e8fff0',edge:'#3ad860',aura:'dragon',ac:['#3ad860','#1a7a4a','#e8c15a'],act:'roar'}];
// one registry: o:outfit · k:katana skin · w:<weapon>:skin · s:slash set · t:thirst skin
const COS={};
COS_OUTFITS.forEach(x=>COS['o:'+x.id]=Object.assign({key:'o:'+x.id,type:'o',label:'Outfit'},x));
COS_BLADES.forEach(x=>COS['k:'+x.id]=Object.assign({key:'k:'+x.id,type:'k',label:'Katana'},x));
for(const w in COS_WSKINS)COS_WSKINS[w].forEach(x=>COS['w:'+w+':'+x.id]=Object.assign({key:'w:'+w+':'+x.id,type:'w',w,label:WEAPONS[w].name,jp:WEAPONS[w].jp},x));
COS_SETS.forEach(x=>COS['s:'+x.id]=Object.assign({key:'s:'+x.id,type:'s',label:'Slash set'},x));
COS_THIRST.forEach(x=>COS['t:'+x.id]=Object.assign({key:'t:'+x.id,type:'t',label:'Thirst skin'},x));
const BUNDLES=[{id:'raiden',name:'Raiden set',desc:'Thunder God outfit, Thunder katana, Raiden slash set, the Storm Fan and the Raijin thirst skin.',items:['o:raiden','k:raiden','s:raiden','w:tessen:thunder','t:raijin'],koban:1100}];
const KOBAN_PACKS=[{id:'koban_s',koban:300,price:'US$0.99'},{id:'koban_m',koban:1000,price:'US$2.99'},{id:'koban_l',koban:2500,price:'US$5.99'}];

// ---------- ownership and equipment (kept in META) ----------
function cosState(){if(!META.cos)META.cos={own:{},eq:{o:'o:default',k:'k:steel',s:'s:crimson',t:'t:crimson',w:{}}};if(!META.cos.eq.w)META.cos.eq.w={};if(!META.cos.eq.t)META.cos.eq.t='t:crimson';if(META.koban==null)META.koban=0;return META.cos;}
function cosOwned(key){const it=COS[key];return!!it&&(it.src==='free'||!!cosState().own[key]);}
function cosGrant(key,why){
  const it=COS[key];if(!it)return null;
  if(cosOwned(key)){const k=RAR[it.r].dupe;META.koban+=k;saveMeta();return{dupe:true,koban:k,it};}
  cosState().own[key]=1;saveMeta();return{dupe:false,it};
}
function cosEquip(key){const it=COS[key];if(!it||!cosOwned(key))return false;const st=cosState();
  if(it.type==='w')st.eq.w[it.w]=key;else st.eq[it.type]=key;saveMeta();if(it.type==='o'||it.type==='s')applyLook();return true;}
function cosEquipped(key){const it=COS[key],st=cosState();if(!it)return false;return it.type==='w'?(st.eq.w[it.w]||'w:'+it.w+':'+COS_WSKINS[it.w][0].id)===key:st.eq[it.type]===key;}
function slashSet(){const st=cosState(),it=COS[st.eq.s];return it&&cosOwned(st.eq.s)?it:COS['s:crimson'];}
function setCol(c,i){return c==='rainbow'?['#ff4a5c','#ff9a3a','#ffe066','#5ad8a0','#9ad8ff','#b48cff'][(Math.floor(S.gt*10)+(i||0))%6]:c;}
function wSkinCols(id){
  const st=cosState();let key=null;
  if(id==='katana'||id==='reserve')key=st.eq.k;else if(COS_WSKINS[id])key=st.eq.w[id]||null;
  const it=key&&cosOwned(key)?COS[key]:null;
  if(it&&!(it.src==='free'))return it;
  return WDEF_COLS[id]||WDEF_COLS.katana;
}
const WDEF_COLS={
  katana:{dflt:true,h:'#2a1a10',t:'#d9a648',b:'#c4ccd2',tip:'#ffffff'},reserve:{dflt:true,h:'#2a1a10',t:'#d9a648',b:'#c4ccd2',tip:'#ffffff'},
  nodachi:{dflt:true,h:'#2a1a10',t:'#d9a648',b:'#c4ccd2',tip:'#ffffff'},kama:{dflt:true,h:'#8a5a2e',t:'#5a5a64',b:'#c4ccd2',tip:'#ffffff'},
  naginata:{dflt:true,wd:'#6b4423',w2:'#4a2e18',t:'#d9a648',b:'#c4ccd2',tip:'#ffffff'},bo:{dflt:true,wd:'#c8a070',w2:'#a8804e',cap:'#8a8a92'},
  tessen:{dflt:true,rib:'#2a2a30',paper:'#b8142a',paper2:'#8a1024',mark:'#ece4d7',edge:'#4a4a56'}};
// the player sprite: the chosen outfit, with the swing smear recoloured to the chosen slash set
let BASE_PLAYER=null;
// the hero's frames in a given outfit, with the white swing smear recoloured to a slash set
function lookFrames(oid,set){
  const src=oid==='default'?BASE_PLAYER:(SPR['pc_'+oid]||BASE_PLAYER);
  const hexRGB=h=>[parseInt(h.slice(1,3),16),parseInt(h.slice(3,5),16),parseInt(h.slice(5,7),16)];
  const core=hexRGB(set.core),edge=hexRGB(set.edge==='rainbow'?'#ffe066':set.edge),keepWhite=set.id==='crimson'&&oid!=='chigetsu';
  return{ax:src.ax,frames:src.frames.map(f=>{const c=mk(f.c.width,f.c.height),g=c.getContext('2d');g.drawImage(f.c,0,0);
    if(!keepWhite){const d=g.getImageData(0,0,c.width,c.height),p=d.data,W=c.width,H=c.height,isW=(x,y)=>x>=0&&y>=0&&x<W&&y<H&&p[(y*W+x)*4+3]===255&&p[(y*W+x)*4]===255&&p[(y*W+x)*4+1]===255&&p[(y*W+x)*4+2]===255;
      const red=oid==='chigetsu'&&set.id==='crimson',ch=[];for(let y=0;y<H;y++)for(let x=0;x<W;x++)if(isW(x,y)){const rim=!(isW(x+1,y)&&isW(x-1,y)&&isW(x,y+1)&&isW(x,y-1));ch.push([x,y,red?(rim?[255,74,92]:[255,140,150]):(rim?edge:core)]);}
      for(const [x,y,col] of ch){const i=(y*W+x)*4;p[i]=col[0];p[i+1]=col[1];p[i+2]=col[2];}g.putImageData(d,0,0);}
    return{c,hand:f.hand};})};
}
function equippedOid(){const st=cosState();return COS[st.eq.o]&&cosOwned(st.eq.o)?st.eq.o.slice(2):'default';}
function applyLook(){
  if(!SPR.player)return;if(!BASE_PLAYER)BASE_PLAYER=SPR.player;
  const L=lookFrames(equippedOid(),slashSet());regSprite('player',L.frames,L.ax,C.spirit);
}
// burst of the slash set's colours when a technique lands
function castBurst(x,y){const set=slashSet(),C3=set.burst;for(let i=0;i<22;i++){const a=Math.random()*Math.PI*2,v=rand(60,220);S.parts.push({x,y,vx:Math.cos(a)*v,vy:Math.sin(a)*v-(set.fx==='embers'||set.fx==='wisps'?80:0),life:rand(0.35,0.8),max:0.8,size:set.fx==='petals'||set.fx==='leaves'?2:1,col:C3[i%C3.length]});}}

// ---------- the daily spin ----------
function dayKey(d){d=d||new Date();return d.getFullYear()+'-'+String(d.getMonth()+1).padStart(2,'0')+'-'+String(d.getDate()).padStart(2,'0');}
function isWeekend(d){d=d||new Date();const w=d.getDay();return w===0||w===6;}
function weekNo(d){d=d||new Date();const t=new Date(Date.UTC(d.getFullYear(),d.getMonth(),d.getDate()));const day=t.getUTCDay()||7;t.setUTCDate(t.getUTCDate()+4-day);const y0=new Date(Date.UTC(t.getUTCFullYear(),0,1));return Math.ceil(((t-y0)/864e5+1)/7)+t.getUTCFullYear()*53;}
const LEGENDS=()=>Object.values(COS).filter(x=>x.r==='legendary').map(x=>x.key);
function weekendLegend(d){const L=LEGENDS();return L[weekNo(d)%L.length];}
const AD_SPINS=3;
function spinState(){const t=dayKey();if(!META.spin||META.spin.day!==t)META.spin={day:t,free:1,ads:0,total:(META.spin&&META.spin.total)||0};return META.spin;}
function spinOdds(d){
  const we=isWeekend(d),rows=[['shards25',we?43.5:44],['shards75',18],['koban5',12],['ramen',9],['revive',6],['common',6],['rare',4],['epic',1]];
  if(we)rows.push(['legend',0.5]);return rows;
}
const SPIN_NAMES={shards25:'25 shards',shards75:'75 shards',koban5:'5 koban',ramen:'Ramen ticket: +1 soul on your next run',revive:'Revive charm: one revive on your next run',common:'A common skin you don\'t own',rare:'A rare skin you don\'t own',epic:'An epic you don\'t own',legend:'This weekend\'s legendary'};
function rollSpin(){
  const rows=spinOdds();let r=Math.random()*100,pick='shards25';for(const [k,p] of rows){if(r<p){pick=k;break;}r-=p;}
  const unowned=rr=>Object.values(COS).filter(x=>x.r===rr&&x.src!=='free'&&!cosOwned(x.key));
  let res={kind:pick};
  switch(pick){
    case'shards25':META.shards+=25;res.text='25 血晶';break;
    case'shards75':META.shards+=75;res.text='75 血晶';break;
    case'koban5':META.koban+=5;res.text='5 koban';break;
    case'ramen':META.ramen=(META.ramen||0)+1;res.text='Ramen ticket';break;
    case'revive':META.charm=(META.charm||0)+1;res.text='Revive charm';break;
    case'common':case'rare':case'epic':{const L=unowned(pick);if(!L.length){const k=RAR[pick].dupe;META.koban+=k;res.text=`${k} koban (you own every ${pick})`;break;}const it=pick===pick&&L[Math.floor(Math.random()*L.length)];cosGrant(it.key);res.item=it.key;res.text=it.name;break;}
    case'legend':{const key=weekendLegend(),g=cosGrant(key);res.item=key;res.text=g.dupe?`${COS[key].name} (owned: +${g.koban} koban)`:COS[key].name;break;}
  }
  spinState().total++;saveMeta();return res;
}

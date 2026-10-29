// ================= data: foes, bosses, biomes, items, boons, shrine =================
// foes: hp/spd relative; dodge/guard/feint scale the Duel AI sliders. Flags change behaviour (see combat).
const TYPES={
  ronin:   {name:'Rōnin',biome:'dojo',desc:'Cross cuts, combos, dash-through',hp:5,spd:1,r:13,look:'ronin',weapon:'katana',pats:['cross','cross','dash','double'],dodge:1,guard:1,feint:1,tele:1,cd:1,range:240,pref:[110,200]},
  yari:    {name:'Ashigaru',biome:'dojo',desc:'Long spear thrusts from range',hp:4,spd:0.8,r:13,look:'yari',weapon:'yari',pats:['thrust'],dodge:0.4,guard:0,feint:0.5,tele:1.2,cd:1.1,range:330,pref:[170,250]},
  shinobi: {name:'Shinobi',biome:'dojo',desc:'Fast, slippery, throws shuriken',hp:3,spd:1.5,r:12,look:'shinobi',weapon:'tanto',pats:['shuriken','shuriken','dash'],dodge:1.7,guard:0.3,feint:1,tele:0.8,cd:0.85,range:420,pref:[170,280]},
  archer:  {name:'Yumi archer',biome:'dojo',desc:'Keeps away, fires tracking arrows',hp:3,spd:0.85,r:12,look:'archer',weapon:'bow',pats:['arrow'],dodge:0.9,guard:0,feint:0.4,tele:1.6,cd:1.3,range:650,pref:[330,440],flee:true},
  monk:    {name:'Sōhei',biome:'dojo',desc:'Naginata sweeps, guards often',hp:7,spd:0.75,r:14,look:'monk',weapon:'naginata',pats:['sweep','sweep','thrust'],dodge:0.3,guard:2.2,feint:0.4,tele:1.2,cd:1.2,range:220,pref:[90,170]},
  kappa:   {name:'Kappa',biome:'bamboo',desc:'Spits water, spins in its shell',hp:4,spd:0.9,r:12,look:'kappa',weapon:'none',pats:['spit','spit','shellspin'],dodge:0.8,guard:0,feint:0.3,tele:1.0,cd:1.0,range:380,pref:[150,240]},
  tanuki:  {name:'Tanuki',biome:'bamboo',desc:'Hides as a tea kettle, drums shockwaves',hp:5,spd:0.8,r:13,look:'tanuki',weapon:'none',pats:['drum','drum','lunge'],dodge:0.5,guard:0,feint:0.6,tele:1.1,cd:1.1,range:200,pref:[80,150],hide:true},
  kitsune: {name:'Kitsune',biome:'bamboo',desc:'Blinks, throws homing foxfire',hp:4,spd:0,r:12,look:'kitsune',weapon:'none',pats:['foxfire','foxfire','claw'],dodge:1.2,guard:0,feint:0.6,tele:1.1,cd:1.1,range:420,pref:[180,280],blink:true},
  tengu:   {name:'Tengu',biome:'bamboo',desc:'Flies, dives, blasts gusts from its fan',hp:5,spd:1.1,r:13,look:'tengu',weapon:'fan',pats:['gust','dive','cross'],dodge:1.3,guard:0.6,feint:0.8,tele:1.0,cd:1.0,range:340,pref:[140,240],fly:true},
  kasa:    {name:'Kasa-obake',biome:'bamboo',desc:'Hopping umbrella, spins and licks',hp:3,spd:1.2,r:11,look:'kasa',weapon:'none',pats:['spin','tongue'],dodge:0.6,guard:0,feint:0.5,tele:0.9,cd:0.9,range:150,pref:[60,110],hop:true},
  yurei:   {name:'Yūrei',biome:'temple',desc:'Blinks around, phase cuts ignore trails',hp:4,spd:0,r:12,look:'yurei',weapon:'none',pats:['claw','fan'],dodge:1,guard:0,feint:0.5,tele:1.1,cd:1.1,range:300,pref:[180,260],blink:true,phase:true},
  onibi:   {name:'Onibi',biome:'temple',desc:'Drifting flame that bursts when close',hp:1,spd:0.9,r:9,look:'onibi',weapon:'none',pats:['explode'],dodge:0,guard:0,feint:0,tele:0.7,cd:0.4,range:80,pref:[0,30],kamikaze:true,swarm:2},
  rokuro:  {name:'Rokurokubi',biome:'temple',desc:'Her neck stretches across the room',hp:5,spd:0.7,r:12,look:'rokuro',weapon:'none',pats:['neck','neck','cross'],dodge:0.5,guard:0.6,feint:0.5,tele:1.0,cd:1.2,range:420,pref:[200,300],neck:true},
  jorogumo:{name:'Jorōgumo',biome:'temple',desc:'Spider woman, slowing webs and leg sweeps',hp:7,spd:0.9,r:15,look:'jorogumo',weapon:'none',pats:['web','web','sweep'],dodge:0.4,guard:0.4,feint:0.4,tele:1.0,cd:1.1,range:420,pref:[160,260]},
  iaido:   {name:'Iaidō master',biome:'temple',desc:'Near-instant draw, long recovery',hp:5,spd:0.9,r:13,look:'iaido',weapon:'katana',pats:['iai'],dodge:0.8,guard:1.6,feint:0,tele:0.5,cd:1.8,range:320,pref:[150,230],recover:2.2},
  gaki:    {name:'Gaki',biome:'temple',desc:'Starving ghosts in packs, lunge fast',hp:2,spd:1.5,r:10,look:'gaki',weapon:'none',pats:['lunge'],dodge:0.3,guard:0,feint:0.2,tele:0.8,cd:0.9,range:200,pref:[60,120],swarm:3},
  oni:     {name:'Oni',biome:'hell',desc:'Huge, slow, ground smash, super armor',hp:12,spd:0.6,r:18,look:'oni',weapon:'kanabo',pats:['smash','cross'],dodge:0,guard:0.35,feint:0,tele:1.5,cd:1.4,range:220,pref:[60,120],heavy:true},
  aooni:   {name:'Ao-oni',biome:'hell',desc:'Blue oni that charges across the room',hp:10,spd:0.85,r:17,look:'aooni',weapon:'kanabo',pats:['charge','smash'],dodge:0,guard:0.3,feint:0.2,tele:1.3,cd:1.3,range:420,pref:[120,220],heavy:true},
  teppo:   {name:'Teppō ashigaru',biome:'dojo',desc:'Musketeer. Long aim, one deadly ball',hp:3,spd:0.7,r:12,look:'teppo',weapon:'musket',pats:['musket'],dodge:0.5,guard:0,feint:0.2,tele:1.5,cd:1.7,range:720,pref:[300,430],flee:true},
  hannya:  {name:'Hannya',biome:'hell',desc:'Jealous demon, a flurry of claws',hp:5,spd:1.3,r:12,look:'hannya',weapon:'tanto',pats:['flurry','dash'],dodge:1.1,guard:0.5,feint:1,tele:0.85,cd:1.0,range:260,pref:[100,180]},
  kusari:  {name:'Kusarigama',biome:'dojo',desc:'Chain-sickle that yanks you in',hp:4,spd:1,r:12,look:'kusari',weapon:'chain',pats:['chain','chain','cross'],dodge:1,guard:0.4,feint:0.8,tele:1.1,cd:1.15,range:380,pref:[170,260]},
  kamaitachi:{name:'Kamaitachi',biome:'bamboo',desc:'Sickle weasels riding the wind, in threes',hp:2,spd:1.7,r:10,look:'kamaitachi',weapon:'none',pats:['wcut'],dodge:1.3,guard:0,feint:0.4,tele:0.8,cd:1.1,range:300,pref:[120,210],swarm:3},
  funa:    {name:'Funayūrei',biome:'temple',desc:'Drowned sailors bailing water at you',hp:4,spd:0.8,r:12,look:'funa',weapon:'ladle',pats:['ladle','ladle','claw'],dodge:0.6,guard:0,feint:0.4,tele:1.0,cd:1.15,range:420,pref:[180,280],phase:true},
  enenra:  {name:'Enenra',biome:'hell',desc:'Living smoke. Untouchable until it takes shape',hp:6,spd:1.2,r:14,look:'enenra',weapon:'none',pats:['smoke','cross'],dodge:0,guard:0,feint:0,tele:0.9,cd:1.2,range:200,pref:[60,120],smoke:true},
  // duelists: only in duel rooms. They read your cuts, parry often, and punish anything sloppy
  kensei:  {name:'Kensei',biome:'duel',desc:'Sword saint. Reads everything',hp:10,spd:1.15,r:13,look:'kensei',weapon:'katana',pats:['combo3','cross','dash','iai','double'],dodge:2.2,guard:2.6,feint:1.6,tele:0.85,cd:0.8,range:320,pref:[110,190],duel:true},
  nitoryu: {name:'Nitōryū',biome:'duel',desc:'Two swords, endless flurries',hp:9,spd:1.25,r:13,look:'nitoryu',weapon:'twin',pats:['flurry','flurry','double','dash'],dodge:2.0,guard:2.2,feint:1.4,tele:0.8,cd:0.75,range:280,pref:[90,170],duel:true},
  sojutsu: {name:'Sōjutsu master',biome:'duel',desc:'Spear master. Keeps you at the tip',hp:10,spd:1,r:13,look:'sojutsu',weapon:'yari',pats:['thrust','thrust','sweep','lunge'],dodge:1.6,guard:2.6,feint:1.2,tele:0.9,cd:0.8,range:370,pref:[170,240],duel:true},
  ippon:   {name:'Ichigeki',biome:'duel',desc:'One cut decides it, for either of you',hp:1,spd:1.1,r:13,look:'ippon',weapon:'katana',pats:['iai','dash','cross'],dodge:2.8,guard:3,feint:2,tele:0.8,cd:0.9,range:340,pref:[130,210],duel:true,reflex:0.03,stance:2},
  sumo:    {name:'Sumo kappa',biome:'event',desc:'Push it out of the ring',hp:999,spd:1.1,r:14,look:'kappa',weapon:'none',pats:['shove'],dodge:0.5,guard:0,feint:0.6,tele:0.75,cd:0.8,range:300,pref:[50,110],sumo:true}
};
TKEYS=Object.keys(TYPES);
const BOSSES={
  kagemaru: {key:'kagemaru',name:'KAGEMARU',title:'the Twin Blade',hp:30,spd:1.15,r:18,look:'kagemaru',weapon:'katana',big:1.5,pats:['combo3','dash','cross','double','iai'],enr:['flurry','iai','combo3'],minions:['ronin','shinobi'],dodge:1.3,guard:1.8,feint:1.3,tele:0.9,cd:0.75,range:320,pref:[120,200],heavy:true},
  tamamo:   {key:'tamamo',name:'TAMAMO',title:'the Nine-Tailed',hp:35,spd:0,r:16,look:'tamamo',weapon:'none',big:1.3,pats:['ring9','foxfire','fan','clones'],enr:['ring9','clones','claw'],minions:['kitsune','kitsune'],dodge:1.3,guard:0,feint:0.6,tele:1.0,cd:0.85,range:480,pref:[200,300],blink:true,heavy:true},
  shirayuki:{key:'shirayuki',name:'SHIRAYUKI',title:'the Drowned Bride',hp:40,spd:0,r:16,look:'shirayuki',weapon:'none',big:1.3,pats:['fan','cage','claw','icicle'],enr:['cage','icicle','claw'],minions:['yurei','onibi'],dodge:1.2,guard:0,feint:0.6,tele:1.0,cd:0.85,range:440,pref:[200,300],blink:true,phase:true,heavy:true},
  goki:     {key:'goki',name:'GŌKI',title:'Lord of the Oni',hp:58,spd:0.65,r:24,look:'goki',weapon:'kanabo',big:1.9,pats:['quake','charge','smash','cross','summon'],enr:['quake','summon','charge'],minions:['oni','enenra'],dodge:0,guard:0.5,feint:0,tele:1.3,cd:0.95,range:340,pref:[80,160],heavy:true}
};
// ten realms, ten floors each. Floor 1 is a store floor, floor 5 a mini boss and a rest place, floor 10 the realm's lord.
// art: crate / wall / hole palettes and styles used by the room painter. haz: spike or fire traps.
const BIOMES=[
  {key:'dojo',name:'Moonlit Dojo',jp:'道場',pool:['ronin','yari','shinobi','archer','monk','kusari','teppo','tate'],bosses:['kagemaru','benkei'],minis:['shihan','fuma'],dark:0.5,ambient:'petal',music:{scale:'in',beat:0.42,drone:73.42},
   art:{paint:'dojo',crate:['#8a5a34','#5e3a1e','#a8784a'],wall:'plank',wpal:['#3a2a20','#24180f','#5a4230','#1a120c'],hole:'pit',hpal:['#050304','#140c0a','#3b2618'],frame:'#3b2618',bar:'#5d3a20',haz:'spike'}},
  {key:'bamboo',name:'Whispering Bamboo',jp:'竹林',pool:['kappa','tanuki','kitsune','tengu','kasa','kamaitachi','karasu'],bosses:['tamamo','nue'],minis:['tanukid','kamaosa'],dark:0.42,ambient:'leaf',music:{scale:'yo',beat:0.46,drone:82.41,flute:true},
   art:{paint:'bamboo',crate:['#b8a060','#7a6a3a','#d8c080'],wall:'bamboo',hole:'water',hpal:['#1a3a5a','#2a5a8a','#3a2a18'],frame:'#3a4a22',bar:'#5a8a3a',haz:'spike'}},
  {key:'temple',name:'Drowned Temple',jp:'古寺',pool:['yurei','onibi','rokuro','jorogumo','iaido','gaki','funa','sumi'],bosses:['shirayuki','kiyohime'],minis:['joro','onryo'],dark:0.62,ambient:'snow',music:{scale:'min',beat:0.55,drone:55,flute:true},
   art:{paint:'temple',crate:['#6a5a4a','#463a30','#8a7a68'],wall:'brick',wpal:['#5a5e66','#3a3e46','#7a7e86','#2a2e36'],hole:'water',hpal:['#0a141e','#16283a','#2a2e36'],frame:'#2a2a30',bar:'#5a5a62',haz:'spike'}},
  {key:'hell',name:'Oni Hell',jp:'地獄',pool:['oni','aooni','hannya','gaki','enenra','iaido','teppo'],bosses:['goki','enma'],minis:['gozu','mezu'],dark:0.5,ambient:'ember',music:{scale:'hell',beat:0.36,drone:49,taiko:true},
   art:{paint:'hell',crate:['#5a3020','#3a1a10','#7a4a30'],wall:'lava',wpal:['#2a1414','#180a0a','#3e2020','#0e0606'],hole:'lava',hpal:['#ff5a1a','#c8321a','#3a0e0a'],frame:'#3a0e0a',bar:'#7a2a1a',haz:'fire'}},
  {key:'river',name:'Sanzu River',jp:'三途川',pool:['funa','kappa','hitodama','datsue','sendo','yurei'],bosses:['datsueba','umibozu'],minis:['sendochf','nureonna'],dark:0.58,ambient:'mist',music:{scale:'min',beat:0.6,drone:51.9,flute:true},
   art:{paint:'river',crate:['#5a5048','#3a342e','#7a7064'],wall:'rock',wpal:['#3a3e44','#24282e','#565c64','#16181c'],hole:'water',hpal:['#0e2a30','#1a4a50','#2a3236'],frame:'#24282e',bar:'#4a5a5e',haz:'spike'}},
  {key:'ice',name:'Guren, the Frozen Hell',jp:'紅蓮',pool:['yukionna','tsurara','frostoni','kamaitachi','yurei','tate'],bosses:['yukijo','guren'],minis:['tsurarah','frostgen'],dark:0.4,ambient:'snow',music:{scale:'min',beat:0.5,drone:61.7},
   art:{paint:'ice',crate:['#8aa8c0','#5a7890','#b8d0e0'],wall:'ice',wpal:['#a8c8e0','#6a90b0','#d8ecf8','#4a6a8a'],hole:'ice',hpal:['#0a1a2e','#16304a','#8ab0d0'],frame:'#4a6a8a',bar:'#8ab0d0',haz:'spike'}},
  {key:'gakido',name:'Realm of Hungry Ghosts',jp:'餓鬼道',pool:['gaki','jikininki','sumi','onibi','rokuro','hannya'],bosses:['gakiking','shokujin'],minis:['sumibozu','ubume'],dark:0.55,ambient:'dust',music:{scale:'min',beat:0.48,drone:46.2},
   art:{paint:'gakido',crate:['#6a5a3a','#463a22','#8a7a52'],wall:'stump',wpal:['#4a3a2a','#2e2418','#6a5a42','#1a140c'],hole:'bones',hpal:['#0e0a06','#1e1810','#5a4a32'],frame:'#2e2418',bar:'#6a5a3a',haz:'spike'}},
  {key:'ashura',name:'Ashura Battlefield',jp:'修羅道',pool:['shiryo','tate','teppo','archer','kiba','oni'],bosses:['ashura','gasha'],minis:['shirgen','kibamu'],dark:0.48,ambient:'ash',music:{scale:'hell',beat:0.4,drone:55,taiko:true},
   art:{paint:'ashura',crate:['#6a4a2a','#4a2e18','#8a6a42'],wall:'palisade',wpal:['#5a3a22','#3a2414','#7a5232','#1e120a'],hole:'trench',hpal:['#120806','#2a140c','#4a2a1a'],frame:'#3a2414',bar:'#7a4a2a',haz:'fire'}},
  {key:'peaks',name:'Tengu Peaks',jp:'天狗山',pool:['tengu','karasu','kamaitachi','raiju','yamabushi','kitsune'],bosses:['sojobo','raijin'],minis:['karasuchf','fujin'],dark:0.3,ambient:'wind',music:{scale:'yo',beat:0.44,drone:65.4,flute:true},
   art:{paint:'peaks',crate:['#7a6a52','#54483a','#9a8a6e'],wall:'rock',wpal:['#5a5a52','#3a3a34','#7a7a70','#24241e'],hole:'sky',hpal:['#8ab8e0','#c8e0f4','#5a5a52'],frame:'#3a3a34',bar:'#6a6a5a',haz:'spike'}},
  {key:'castle',name:'The Usurper\'s Castle',jp:'天守閣',pool:['hatamoto','shinobi','teppo','tate','kunoichi','iaido','kusari'],bosses:['usurper','onmyoji'],minis:['hatachf','kagero'],dark:0.45,ambient:'petal',music:{scale:'in',beat:0.4,drone:69.3,taiko:true},
   art:{paint:'castle',crate:['#5a2a1a','#3a1a10','#8a4a2a'],wall:'screen',wpal:['#1a1418','#0e0a0c','#d9a648','#f4ead8'],hole:'pond',hpal:['#0a1e2a','#1a3a4a','#3a2a1a'],frame:'#1a1418',bar:'#d9a648',haz:'spike'}}
];
// the hub between runs: the Shrine of the Broken Blade
const HUB_BIOME={key:'hub',name:'Shrine of the Broken Blade',jp:'神社',pool:[],bosses:[],minis:[],dark:0.45,ambient:'petal',music:{scale:'in',beat:0.6,drone:65.4,flute:true},
  art:{paint:'hub',crate:['#8a5a34','#5e3a1e','#a8784a'],wall:'plank',wpal:['#3a2a20','#24180f','#5a4230','#1a120c'],hole:'pond',hpal:['#0a1e2a','#1a3a4a','#3a2a1a'],frame:'#3b2618',bar:'#5d3a20',haz:'spike'}};

// treasures: found on pedestals, sold by the tanuki, given by strangers. Tier 0 are trinkets: small, cheap, common
const ITEMS=[
  {id:'waraji',name:'Straw Waraji',desc:'Move 5% faster.',icon:'waraji',tier:0,apply:m=>{m.moveMul*=1.05;}},
  {id:'goen',name:'Five-Mon Coin',desc:'Foes drop 15% more mon.',icon:'goen',tier:0,apply:m=>{m.coinMul*=1.15;}},
  {id:'hachi',name:'Hachimaki',desc:'Blood gain +12%.',icon:'hachimaki',tier:0,apply:m=>{m.gainMul*=1.12;}},
  {id:'bokken',name:'Bokken Charm',desc:'Click slashes reach 10% farther.',icon:'bokken',tier:0,apply:m=>{m.tapReach*=1.1;}},
  {id:'tabi',name:'Split-toe Tabi',desc:'Dash cooldown −8%.',icon:'tabi',tier:0,apply:m=>{m.dashCdMul*=0.92;}},
  {id:'sakazuki',name:'Sake Cup',desc:'Parries give 6% more blood.',icon:'sakazuki',tier:0,apply:m=>{m.parryBlood+=6;}},
  {id:'soroban',name:'Soroban',desc:'Shops are 8% cheaper.',icon:'soroban',tier:0,apply:m=>{m.discount*=0.92;}},
  {id:'juzu',name:'Prayer Beads',desc:'Drinking blood only needs 85% of the bar.',icon:'juzu',tier:0,apply:m=>{m.drinkCost=Math.min(m.drinkCost,0.85);}},
  {id:'tsuru',name:'Paper Crane',desc:'Your first cut in each room deals +1 damage.',icon:'tsuru',tier:0,apply:m=>{m.firstCut=true;}},
  {id:'ami',name:'Fishing Net',desc:'Mon and shards come to you from twice as far.',icon:'ami',tier:0,apply:m=>{m.magnet*=2;}},
  {id:'kendama',name:'Kendama',desc:'Combos last one second longer.',icon:'kendama',tier:0,apply:m=>{m.comboTime+=1;}},
  {id:'ika',name:'Grilled Squid',desc:'Eaten on the spot. +1 soul.',icon:'ika',tier:0,consume:()=>heal(1)},
  {id:'furin',name:'Wind Chime',desc:'Foes wind up 6% slower.',icon:'furin',tier:0,apply:m=>{m.teleMul*=1.06;}},
  {id:'kiseru',name:'Kiseru Pipe',desc:'Cut cooldowns −6%.',icon:'kiseru',tier:0,apply:m=>{m.recoverMul*=0.94;}},
  {id:'tenugui',name:'Tenugui',desc:'After a hit you stay untouchable 0.25s longer.',icon:'tenugui',tier:0,apply:m=>{m.hurtInv+=0.25;}},
  {id:'aka',name:'Red Omamori',desc:'+1 max soul.',icon:'omamori:#c23a2a',tier:1,apply:m=>{m.maxHp+=1;}},
  {id:'ao',name:'Blue Omamori',desc:'Move 12% faster.',icon:'omamori:#3a6ac8',tier:1,apply:m=>{m.moveMul*=1.12;}},
  {id:'kin',name:'Gold Omamori',desc:'Foes drop 50% more mon.',icon:'omamori:#e8c15a',tier:1,apply:m=>{m.coinMul*=1.5;}},
  {id:'daruma',name:'Daruma',desc:'Once per floor a fatal hit leaves you at 1 soul. Fall seven times, rise eight.',icon:'daruma',tier:3,apply:m=>{m.daruma=1;}},
  {id:'maneki',name:'Maneki-neko',desc:'Shops are 25% cheaper.',icon:'maneki',tier:1,apply:m=>{m.discount*=0.75;}},
  {id:'hannya',name:'Hannya Mask',desc:'+1 damage on every cut you draw yourself.',icon:'hannya',tier:2,apply:m=>{m.dmg++;}},
  {id:'kmask',name:'Kitsune Mask',desc:'Every dash ends in a burst of foxfire.',icon:'kmask',tier:2,apply:m=>{m.foxdash=true;}},
  {id:'fan',name:'Tengu Fan',desc:'Cuts release a blade of wind that keeps flying.',icon:'fan',pool:false,tier:2,ab:['wave']},
  {id:'hyotan',name:'Sake Gourd',desc:'Blood gain +40%.',icon:'hyotan',tier:1,apply:m=>{m.gainMul*=1.4;}},
  {id:'chochin',name:'Paper Lantern',desc:'You shine brighter and foes wind up 20% slower.',icon:'chochin',tier:1,apply:m=>{m.lightMul*=1.5;m.teleMul*=1.2;}},
  {id:'shuri',name:'Shuriken Pouch',desc:'Swiped cuts throw three kunai at the nearest foe (1.6s cooldown).',icon:'shuriken',pool:false,tier:2,ab:['kunai']},
  {id:'suzu',name:'Temple Bell',desc:'Parries refill your dash and 15% blood.',icon:'suzu',tier:1,apply:m=>{m.parryBlood+=15;m.composure=true;}},
  {id:'geta',name:'Tall Geta',desc:'Dash cooldown −30%.',icon:'geta',tier:1,apply:m=>{m.dashCdMul*=0.7;}},
  {id:'kabuto',name:'Old Kabuto',desc:'+2 max soul, but you move 8% slower.',icon:'kabuto',tier:2,apply:m=>{m.maxHp+=2;m.moveMul*=0.92;}},
  {id:'raijin',name:'Raijin\'s Drum',desc:'Hits arc lightning to two nearby foes.',icon:'raijin',pool:false,tier:3,ab:['chain']},
  {id:'fujin',name:'Fūjin\'s Wind Bag',desc:'Foes near your cut are dragged into it.',icon:'fujin',pool:false,tier:2,ab:['vortex']},
  {id:'scroll',name:'Shadow Scroll',desc:'A shadow repeats each cut, mirrored through you.',icon:'scroll',pool:false,tier:3,ab:['ghost']},
  {id:'fude',name:'Calligraphy Brush',desc:'Cuts follow the curve of your swipe.',icon:'fude',pool:false,tier:2,ab:['curve']},
  {id:'yata',name:'Yata Mirror',desc:'Every cut repeats a moment later.',icon:'yata',pool:false,tier:3,ab:['echo']},
  {id:'magatama',name:'Magatama',desc:'You slide to wherever your cut stops (2.4s cooldown).',icon:'magatama',pool:false,tier:2,ab:['teleport']},
  {id:'tsuba',name:'Iron Tsuba',desc:'Cut cooldowns −20%.',icon:'tsuba',tier:1,apply:m=>{m.recoverMul*=0.8;}},
  {id:'toishi',name:'Whetstone',desc:'Cuts can be 20% longer.',icon:'toishi',tier:1,apply:m=>{m.lenMul*=1.2;}},
  {id:'ofuda',name:'Ofuda',desc:'Hits stun foes.',icon:'ofuda',pool:false,tier:2,ab:['stun']},
  {id:'kanzashi',name:'Blood Kanzashi',desc:'Kills have a 20% chance to restore a soul.',icon:'kanzashi',tier:2,apply:m=>{m.drainChance+=0.2;}},
  {id:'onibi',name:'Onibi Lantern',desc:'Cuts leave a trail of ghost fire.',icon:'onibilamp',pool:false,tier:2,ab:['fire']},
  {id:'karakasa',name:'Karakasa',desc:'The first hit in each room is caught by a grateful old umbrella.',icon:'kasa',tier:3,pool:false,apply:m=>{m.roomShield=true;}}
];
const ITEM=Object.fromEntries(ITEMS.map(i=>[i.id,i]));
const PRICE={0:8,1:15,2:24,3:34};

// boons: offered after each boss
const PERKS=[
  {id:'keen',name:'Keen Edge',desc:'+1 damage on every cut you draw yourself.',kind:'Boon',apply:m=>{m.dmg++;}},
  {id:'reach',name:'Long Edge',desc:'Cuts can be 25% longer.',kind:'Boon',apply:m=>{m.lenMul*=1.25;}},
  {id:'swift',name:'Swift Hand',desc:'Your cuts travel 25% faster.',kind:'Boon',apply:m=>{m.speedMul*=1.25;}},
  {id:'thirst',name:'Thirsty Steel',desc:'Blood gain +40%.',kind:'Boon',apply:m=>{m.gainMul*=1.4;}},
  {id:'ghoststep',name:'Ghost Step',desc:'Dash cooldown −30%.',kind:'Boon',apply:m=>{m.dashCdMul*=0.7;}},
  {id:'wind',name:'Second Wind',desc:'+1 max soul and a full heal.',kind:'Boon',apply:m=>{m.maxHp+=1;},onTake:()=>{P.hp=P.max;}},
  {id:'iron',name:'Iron Trail',desc:'Your trails stay solid 0.3s longer after a cut.',kind:'Boon',apply:m=>{m.trail+=0.3;}},
  {id:'focus',name:'Quiet Spirit',desc:'Ability cooldowns −20%.',kind:'Boon',apply:m=>{m.abCdMul*=0.8;}},
  {id:'calm',name:'Still Water',desc:'Cut cooldowns −15%.',kind:'Boon',apply:m=>{m.recoverMul*=0.85;}},
  {id:'commune',name:'Blood Communion',desc:'Drinking a full blade restores two souls.',kind:'Passive',apply:m=>{m.drinkHeal=2;}},
  {id:'after',name:'Afterimage',desc:'Dashing leaves an instant cut along your path.',kind:'Passive',apply:m=>{m.afterimage=true;}},
  {id:'bleed',name:'Hemorrhage',desc:'Hit foes bleed for 1 more damage after 1.5s.',kind:'Passive',apply:m=>{m.bleed=true;}},
  {id:'exec',name:'Executioner',desc:'Any hit kills a regular foe left at 2 health or less.',kind:'Passive',apply:m=>{m.exec=true;}},
  {id:'compo',name:'Composure',desc:'Parry slow-mo lasts twice as long and refreshes your dash.',kind:'Passive',apply:m=>{m.composure=true;}},
  {id:'senses',name:'Sharpened Senses',desc:'Foe wind-ups last 30% longer.',kind:'Passive',apply:m=>{m.teleMul*=1.3;}},
  {id:'greed',name:'Tanuki\'s Greed',desc:'Foes drop twice the mon.',kind:'Passive',apply:m=>{m.coinMul*=2;}},
  {id:'echo',name:'Echo Blade',desc:'Every cut repeats a moment later.',kind:'Ability',ab:['echo']},
  {id:'slide',name:'Phantom Slide',desc:'You slide to wherever your cut stops (2.4s cooldown).',kind:'Ability',ab:['teleport']},
  {id:'rebound',name:'Rebound',desc:'Cuts aimed at a wall bounce off it, and you slide along with them.',kind:'Ability',ab:['teleport','ricochet']},
  {id:'cross',name:'Crossing Fate',desc:'Every cut adds a second cut across its middle.',kind:'Ability',ab:['cross']},
  {id:'linger',name:'Lingering Malice',desc:'Finished cuts stay as damaging walls.',kind:'Ability',ab:['linger']},
  {id:'sunder',name:'Sunder',desc:'Cuts break through foe trails and guards.',kind:'Ability',ab:['pierce']},
  {id:'twin',name:'Twin Fang',desc:'Two parallel cuts join every cut.',kind:'Ability',ab:['triple']},
  {id:'storm',name:'Raiden\'s Blessing',desc:'Hits arc lightning to two nearby foes.',kind:'Ability',ab:['chain']},
  {id:'gale',name:'Gale Edge',desc:'A blade of wind flies on past every cut.',kind:'Ability',ab:['wave']}
];
const freshMods=()=>({dmg:0,lenMul:1,speedMul:1,gainMul:1,dashCdMul:1,trail:0,teleMul:1,afterimage:false,bleed:false,exec:false,composure:false,
  coinMul:1,discount:1,daruma:0,moveMul:1,recoverMul:1,lightMul:1,drainChance:0,parryBlood:0,foxdash:false,roomShield:false,
  abCdMul:1,tapReach:1,drinkCost:1,drinkHeal:1,firstCut:false,magnet:1,comboTime:0,hurtInv:0,maxHp:0});

// ================= weapons: what you strip from the dead =================
// Every weapon has three base moves: click, swipe, and hold (press without moving, then let go).
// style: trace (cut follows the swipe), thrust (straight line from the body), smash (hop-slam where your swipe ends), chain (hook and reel), gun (click fires)
const WEAPONS={
  reserve:{id:'reserve',name:'Broken katana',jp:'折れ刀',style:'trace',len:0,hr:9,dmg:0,dur:0,cd:1,tap:1,tapReach:1,bt:{type:'state',time:6,cost:100},desc:'Your own blade. It cannot break any further.',
    moves:['Click: three-cut combo','Swipe: a straight cut','Hold: a blood wave'],thirst:'Longer, piercing blood cuts'},
  katana: {id:'katana',name:'Katana',jp:'刀',style:'trace',len:250,hr:10,dmg:0,dur:42,cd:0.85,tap:0.9,tapReach:1.15,bt:{type:'state',time:6,cost:100},desc:'The cut follows your hand exactly, curves and all.',broke:'Shorter and slower',
    moves:['Click: two draw-cuts, then a stepping thrust','Swipe: the cut follows your exact curve','Hold: Iaido, an instant charged draw'],thirst:'Every cut echoes'},
  yari:   {id:'yari',name:'Yari',jp:'槍',style:'thrust',len:310,hr:8,dmg:0,dur:36,cd:1.0,tap:0.95,tapReach:1,pierce:true,bt:{type:'state',time:6,cost:100},desc:'Huge reach, breaks guards, keeps foes at the tip.',broke:'Short stick, no longer breaks guards',
    moves:['Click: two jabs, then a wide sweep','Swipe: step into a long thrust','Hold: brace, skewering anything that comes close'],thirst:'Three thrusts at once'},
  kanabo: {id:'kanabo',name:'Kanabō',jp:'金棒',style:'smash',len:150,hr:16,dmg:1,dur:30,cd:1.6,tap:1.4,tapReach:0.95,shock:72,bt:{type:'strike',cost:100},desc:'Slow and crushing. You hop to where your swipe ends and slam it.',broke:'No shockwave',
    moves:['Click: two overheads, then a full sweep','Swipe: hop and slam where the swipe ends','Hold: wind up a spinning swing'],thirst:'One earthquake'},
  kusari: {id:'kusari',name:'Kusarigama',jp:'鎖鎌',style:'chain',len:340,hr:8,dmg:0,dur:34,cd:1.15,tap:0.9,tapReach:0.8,bt:{type:'state',time:7,cost:100},desc:'Hook foes with the chain and reel them in. Big ones reel you to them.',broke:'Sickle only, the chain is snapped',
    moves:['Click: sickle cuts. Right after a hook: Reap','Swipe: throw the chain, hook and reel','Hold: whirl the chain around you, let go to fling it'],thirst:'Blood Scythe: huge sweeping scythe, the chain hooks three'},
  musket: {id:'musket',name:'Teppō',jp:'鉄砲',style:'gun',len:90,hr:9,dmg:0,dur:16,cd:1.1,tap:1,tapReach:0.85,reload:1.6,shot:{len:760,dmg:4},bt:{type:'strike',cost:100},desc:'Click to fire, click again in the gold part of the reload for a perfect reload.',broke:'The barrel is cracked: it cannot fire',
    moves:['Click: fire. While reloading, click in the gold zone','Swipe: bayonet lunge','Hold: aim down the sight for a heavy shot'],thirst:'One blood bullet'},
  // the five starter weapons forged at the shrine (they also turn up in the descent)
  nodachi:{id:'nodachi',name:'Nodachi',jp:'野太刀',style:'trace',len:330,hr:12,dmg:0,dur:40,cd:1.25,tap:1.25,tapReach:1.35,bt:{type:'state',time:6,cost:100},forge:400,desc:'A greatsword. The longest reach of any blade, and the slowest.',broke:'Half a blade, still heavy',
    moves:['Click: slow, wide cuts. The third one cleaves','Swipe: the cut follows your hand and breaks through guards','Hold: Crescent Draw, a full circle around you'],thirst:'Blood runs past the tip: almost double reach, piercing'},
  tessen:{id:'tessen',name:'Tessen',jp:'鉄扇',style:'fan',len:200,hr:14,dmg:0,dur:48,cd:0.9,tap:0.8,tapReach:0.9,bt:{type:'state',time:7,cost:100},forge:350,desc:'An iron war fan. Parries anything, pushes everything.',broke:'Torn paper, weak gusts',
    moves:['Click: quick strikes with the closed fan, a wide parry','Swipe: open the fan, a gust that pushes foes back and swats shots','Hold: Mirror Fan, turns the next blow or shot back'],thirst:'Blood spikes on every rib: gusts cut deep'},
  bo:{id:'bo',name:'Bō',jp:'棒',style:'staff',len:200,hr:11,dmg:0,dur:44,cd:1.0,tap:0.9,tapReach:1.1,bt:{type:'strike',cost:100},forge:250,desc:'No edge, all reach. Staggers, sweeps and knocks foes into each other.',broke:'A short stick',
    moves:['Click: jabs that stagger. The third sweeps','Swipe: a sweep that throws foes aside','Hold: Pole Vault over the next attack, landing in a slam'],thirst:'One blood-tipped vault that shatters the ground'},
  kama:{id:'kama',name:'Kama',jp:'鎌',style:'hook',len:230,hr:9,dmg:0,dur:34,cd:0.8,tap:0.75,tapReach:0.85,bt:{type:'state',time:6,cost:100},forge:300,desc:'A sickle. Short and fast, and every cut bleeds.',broke:'A chipped hook, no throw',
    moves:['Click: hooking cuts that make foes bleed','Swipe: throw the sickle and hook the first foe back to you','Hold: Reap, a crescent that feeds the orb for every foe it cuts'],thirst:'The hook grows into a blood scythe that heals you'},
  naginata:{id:'naginata',name:'Naginata',jp:'薙刀',style:'polearm',len:280,hr:11,dmg:0,dur:40,cd:1.1,tap:1.0,tapReach:1.25,bt:{type:'state',time:6,cost:100},forge:450,desc:'A curved blade on a long shaft. Sweeps that keep crowds at bay.',broke:'A shaft with a stub of blade',
    moves:['Click: long thrusts. The third sweeps wide','Swipe: a wide sweeping arc in front of you','Hold: Wheel, the blade spins around you twice'],thirst:'Every sweep leaves a second arc of blood'}
};
const WKEYS=['katana','yari','kanabo','kusari','musket','nodachi','tessen','bo','kama','naginata'];
const FORGE_W=['nodachi','tessen','bo','kama','naginata'];
const DROPMAP={katana:'katana',twin:'katana',yari:'yari',kanabo:'kanabo',chain:'kusari',musket:'musket',naginata:'naginata',staff:'bo',fan:'tessen'};
const NAMED_PERKS=[
  {id:'swift',desc:'Cuts recover 15% faster'},{id:'tough',desc:'+50% durability'},{id:'thirst',desc:'Bloodthirst lasts 2s longer'},
  {id:'leech',desc:'Hits feed the orb +2'},{id:'keen',desc:'+1 damage'},{id:'light',desc:'Bloodthirst costs 20% less'}
];
const CURSES=[
  {id:'drain',name:'Thirsting',desc:'Drinks from your orb while you hold it'},
  {id:'bound',name:'Bound',desc:'Cannot be thrown or dropped until it breaks'},
  {id:'brittle',name:'Brittle',desc:'Wears out twice as fast'}
];

// ================= techniques: hold right-click and trace a shape, time slows while you draw =================
// kind: O offense, D defense (parries, counters, guards), M mobility (dashes, leaps)
const SHAPES={line:'a straight line',arc:'a curve, like a C',v:'a V',rev:'a line and back',z:'a Z',tri:'a triangle',zz:'a zigzag, like a W',loop:'a circle',spiral:'a double circle'};
const KINDS={O:'Offense',D:'Defense',M:'Mobility'};
const SKILLS={
  r_spin:    {w:'reserve',name:'Blood Spin',shape:'loop',kind:'O',cd:10,innate:true,desc:'Ten blood blades burst out in a ring around you.'},
  r_flash:   {w:'reserve',name:'Flash Step',shape:'line',kind:'M',cd:8,desc:'Blink along the line you drew, untouchable, cutting everything you pass through.'},
  r_mirror:  {w:'reserve',name:'Blood Mirror',shape:'v',kind:'D',cd:11,desc:'For a breath, every blow that reaches you is parried and every projectile turned back. Each one feeds the orb.'},
  r_return:  {w:'reserve',name:'Blood Return',shape:'rev',kind:'O',cd:9,desc:'Hurl a blood blade that flies out and comes back, cutting both ways and eating projectiles.'},
  r_thousand:{w:'reserve',name:'Thousand Cuts',shape:'zz',kind:'O',cd:12,desc:'The air where you drew bursts into a storm of small cuts.'},
  r_petal:   {w:'reserve',name:'Petal Guard',shape:'spiral',kind:'D',cd:15,desc:'Six blood petals orbit you for four seconds, cutting foes and shattering their cuts and shots.'},
  k_sanren:  {w:'katana',name:'Sanren',shape:'z',kind:'O',cd:9,desc:'Three lightning draw-cuts toward your aim, then you dash through.'},
  k_swallow: {w:'katana',name:'Swallow Return',shape:'rev',kind:'M',cd:9,desc:'Leap back out of reach and leave a cross-cut hanging where you stood.'},
  k_mikiri:  {w:'katana',name:'Mikiri',shape:'v',kind:'D',cd:10,desc:'A reading stance. The next blow that reaches you is turned aside and answered with a cut nothing can block.'},
  k_moon:    {w:'katana',name:'Moonlit Draw',shape:'line',kind:'M',cd:11,desc:'Dash along the line with the blade sheathed. A heartbeat later, everything you passed is cut at once.'},
  k_crescent:{w:'katana',name:'Crescent Moon',shape:'arc',kind:'O',cd:13,desc:'Release a wall of steel crescents that rolls forward, piercing foes and shattering their cuts.'},
  y_lunge:   {w:'yari',name:'Lunge',shape:'rev',kind:'M',cd:8,desc:'Vault forward behind a guard-breaking thrust, untouchable while you move.'},
  y_vault:   {w:'yari',name:'Pole Vault',shape:'line',kind:'M',cd:10,desc:'Plant the spear and vault over pits, crates and foes. You land in a ring of thrusts.'},
  y_root:    {w:'yari',name:'Iron Root',shape:'v',kind:'D',cd:11,desc:'Brace for two seconds: any foe that steps into reach is skewered, and any blow at you is answered first.'},
  y_hundred: {w:'yari',name:'Hundred Thrusts',shape:'zz',kind:'O',cd:11,desc:'Eight piercing thrusts in a blur, fanned toward your aim.'},
  y_wall:    {w:'yari',name:'Spinning Wall',shape:'loop',kind:'D',cd:13,desc:'Spin the spear: every cut and projectile that reaches you breaks, and foes are thrown back.'},
  b_split:   {w:'kanabo',name:'Earthsplitter',shape:'v',kind:'O',cd:10,desc:'Slam the ground: twelve shockwave lines and a crushing blast around you.'},
  b_charge:  {w:'kanabo',name:'Oni Charge',shape:'line',kind:'M',cd:10,desc:'Charge along the line like a bull, unstoppable, battering foes and crates aside.'},
  b_patience:{w:'kanabo',name:"Oni's Patience",shape:'rev',kind:'D',cd:11,desc:'Raise the club and wait. The next blow is absorbed and the ground answers with a stunning quake.'},
  b_whirl:   {w:'kanabo',name:'Whirlwind',shape:'loop',kind:'O',cd:12,desc:'Spin the club for two seconds, dragging foes in and battering them. You can move while you spin.'},
  b_meteor:  {w:'kanabo',name:'Meteor',shape:'tri',kind:'M',cd:14,desc:'Leap high into the air and come crashing down where you drew, cratering everything around.'},
  c_bind:    {w:'kusari',name:'Bind',shape:'loop',kind:'O',cd:10,desc:'The chain wraps everything inside your circle, drags it together and stuns it.'},
  c_grapple: {w:'kusari',name:'Grapple',shape:'line',kind:'M',cd:7,desc:'Hurl the chain along the line and zip to whatever it bites. A foe gets a flying kick.'},
  c_swap:    {w:'kusari',name:'Changing Places',shape:'rev',kind:'D',cd:9,desc:'Hook the nearest foe and swap places with it. Its attack is wasted and it stands there stunned.'},
  c_reap:    {w:'kusari',name:'Reaping Circle',shape:'arc',kind:'O',cd:11,desc:'Whirl the weighted chain in a huge circle, cutting everything around you and hurling it outward.'},
  c_ward:    {w:'kusari',name:'Snare Ward',shape:'z',kind:'D',cd:12,desc:'Whip the chain into a web. The next attack is caught, and its owner is yanked to your feet, stunned and disarmed.'},
  m_volley:  {w:'musket',name:'Volley',shape:'loop',kind:'O',cd:10,desc:'Three shots at once without reloading, fanned toward your aim.'},
  m_recoil:  {w:'musket',name:'Recoil Leap',shape:'rev',kind:'M',cd:8,desc:'Fire a blast of shot and let the recoil throw you far back, untouchable.'},
  m_quick:   {w:'musket',name:'Quickdraw',shape:'v',kind:'D',cd:10,desc:'Wait for it. When a blow comes, you slip it and put a ball through the attacker. Free reload.'},
  m_smoke:   {w:'musket',name:'Smoke Bomb',shape:'zz',kind:'M',cd:11,desc:'Vanish in smoke. Foes inside lose you and stand dazed while you slip away and reload.'},
  m_rail:    {w:'musket',name:'Thunder Rail',shape:'line',kind:'O',cd:14,desc:'Pack the barrel with blood and fire a rail that pierces everything along the line, walls included.'},
  nd_heaven: {w:'nodachi',name:'Heaven\'s Step',shape:'line',kind:'M',cd:9,desc:'Dash along the line, then bring the greatsword straight down where you stop.'},
  nd_wall:   {w:'nodachi',name:'Iron Wall',shape:'v',kind:'D',cd:11,desc:'Plant the blade. The next blow that reaches you is answered by a full circle of steel.'},
  nd_moon:   {w:'nodachi',name:'Moon Splitter',shape:'arc',kind:'O',cd:11,desc:'One enormous crescent sweep that pierces everything in front of you.'},
  nd_mountain:{w:'nodachi',name:'Falling Mountain',shape:'z',kind:'O',cd:12,desc:'Three overhead cleaves fanned toward your aim. Each one stuns.'},
  nd_storm:  {w:'nodachi',name:'Storm Circle',shape:'loop',kind:'O',cd:14,desc:'Spin the greatsword twice around you, dragging foes into the blade.'},
  ts_step:   {w:'tessen',name:'Butterfly Step',shape:'line',kind:'M',cd:8,desc:'Flutter along the line, untouchable, leaving a gust behind that swats every shot.'},
  ts_mirror: {w:'tessen',name:'Mirror Dance',shape:'v',kind:'D',cd:11,desc:'For a breath and a half, every blow is parried and every shot is fanned back at its owner.'},
  ts_gale:   {w:'tessen',name:'Gale',shape:'arc',kind:'O',cd:10,desc:'Five blades of wind fan out from the open fan, cutting and throwing foes back.'},
  ts_leaves: {w:'tessen',name:'Thousand Leaves',shape:'zz',kind:'O',cd:12,desc:'A storm of small wind blades scatters toward your aim.'},
  ts_tornado:{w:'tessen',name:'Tornado',shape:'loop',kind:'D',cd:14,desc:'Spin the fan into a whirlwind: shots and cuts that reach you break, foes are hurled away.'},
  bo_vault:  {w:'bo',name:'Long Vault',shape:'line',kind:'M',cd:8,desc:'Vault far along the line, untouchable, and land with a ring of jabs.'},
  bo_rebound:{w:'bo',name:'Rebound',shape:'v',kind:'D',cd:10,desc:'Hold the staff across. The next attacker is thrown across the room and stunned.'},
  bo_sweep:  {w:'bo',name:'Leg Sweep',shape:'arc',kind:'O',cd:10,desc:'A low sweep all around you that knocks every foe off its feet.'},
  bo_crush:  {w:'bo',name:'Skull Crusher',shape:'tri',kind:'O',cd:12,desc:'Leap to where you drew and bring the staff down, stunning everything around.'},
  bo_spin:   {w:'bo',name:'Spinning Staff',shape:'loop',kind:'D',cd:13,desc:'Spin the staff for two seconds. Cuts and shots break on it and foes bounce away.'},
  km_hook:   {w:'kama',name:'Hook and Pull',shape:'line',kind:'M',cd:7,desc:'Throw the sickle along the line. A foe is dragged to you stunned. A wall pulls you to it.'},
  km_reaper: {w:'kama',name:'Reaper\'s Patience',shape:'v',kind:'D',cd:10,desc:'Wait. The next blow is slipped and answered with a cut nothing blocks. A kill heals one soul.'},
  km_harvest:{w:'kama',name:'Harvest',shape:'arc',kind:'O',cd:10,desc:'A wide crescent of hooks. Every foe it cuts feeds the orb twice over.'},
  km_rain:   {w:'kama',name:'Red Rain',shape:'zz',kind:'O',cd:11,desc:'Eight quick cuts where you drew. Everything they touch bleeds.'},
  km_spiral: {w:'kama',name:'Death Spiral',shape:'loop',kind:'O',cd:14,desc:'Sickles orbit you for three seconds, cutting foes and feeding you their blood.'},
  ng_charge: {w:'naginata',name:'Charging Blade',shape:'line',kind:'M',cd:8,desc:'Rush along the line behind the blade, piercing everything in your path.'},
  ng_guard:  {w:'naginata',name:'Moon Guard',shape:'v',kind:'D',cd:11,desc:'Whirl the shaft in front of you: cuts and shots break, foes are pushed back.'},
  ng_reap:   {w:'naginata',name:'Crescent Reap',shape:'arc',kind:'O',cd:10,desc:'A huge sweeping arc that throws every foe in front of you.'},
  ng_petals: {w:'naginata',name:'Falling Petals',shape:'z',kind:'O',cd:12,desc:'Three sweeping arcs, left, right and left again, stepping forward each time.'},
  ng_wheel:  {w:'naginata',name:'Great Wheel',shape:'loop',kind:'O',cd:14,desc:'The blade spins around you twice at full reach.'}
};
for(const k in SKILLS)SKILLS[k].id=k;

// ================= the Blood Tree: permanent upgrades bought with banked blood shards at the Blind Smith =================
// a tree has a hub and branches. A branch is a run of nodes [id,name,desc,maxLv,baseCost,glyph] that ends in a tip.
// Weapon tips are techniques. To buy a node the one before it needs a level; to take the tip the whole branch must be mastered.
const ND=(id,name,desc,max,cost,g)=>({id,name,desc,max,cost,g:g||'・'});
const WB=(w,spc)=>{const sk=Object.values(SKILLS).filter(s=>s.w===w&&!s.innate);return[
  {name:'Rhythm',nodes:[ND('cd','Rhythm','Its cooldowns 8% faster',3,12,'速'),ND('reach','Reach','Its cuts and clicks reach 8% farther',2,14,'伸')],tip:{skill:sk[0].id,cost:30}},
  {name:'Steel',nodes:[ND('dur','Folded steel','+20% durability',3,10,'鋼'),ND('temper','Temper','Wears down 25% slower',2,14,'鍛')],tip:{skill:sk[1].id,cost:40}},
  {name:'Thirst',nodes:[ND('btc','Thirst cost','Bloodthirst costs 10% less',3,14,'渇'),ND('btp','Thirst power','Longer bloodthirst, stronger strikes',3,16,'血')],tip:{skill:sk[2].id,cost:45}},
  {name:'Survival',nodes:[ND('brk','Survivor','Its broken form keeps more power',2,18,'折'),ND('skl','Technique','Traces recharge 1s faster with it',2,20,'技')],tip:{skill:sk[3].id,cost:55}},
  {name:'Mastery',nodes:spc,tip:{skill:sk[4].id,cost:70}}];};
const TREES=[
  {id:'brush',name:'The Brush',jp:'筆',g:'筆',desc:'Tracing itself: right-click, draw, release.',branches:[
    {name:'Stillness',nodes:[ND('tcd','Steady hand','Traces recharge 8% faster',3,14,'静')],tip:{id:'zen',name:'Still Water',desc:'Time slows even further while you trace, and you get half again as long to draw.',cost:40,g:'水'}},
    {name:'Ink',nodes:[ND('tfail','Forgiving ink','A shape that misses only costs 1 second',1,16,'墨'),ND('tblood','Blood ink','Each technique feeds the orb +8',2,16,'朱')],tip:{id:'stroke',name:'Brushstroke',desc:'Casting a technique makes you untouchable for one second.',cost:55,g:'画'}},
    {name:'Linking',nodes:[ND('link','Linked ink','Ink chains cost 10% less recharge',2,18,'連')],tip:{id:'third',name:'Third Stroke',desc:'Chain a third shape into the same trace. Three fused techniques strike twice as hard.',cost:60,g:'参'}}]},
  {id:'orb',name:'Blood orb',jp:'血',g:'血',desc:'The orb that floats beside you.',branches:[
    {name:'Vessel',nodes:[ND('cap','Deep orb','Store 20 more blood',3,20,'器')],tip:{id:'brim',name:'Brimming',desc:'Start every realm with the orb a third full.',cost:45,g:'満'}},
    {name:'Mercy',nodes:[ND('heal','Cheap healing','Healing costs 5 less',3,15,'癒'),ND('mend','Cheap mending','Mending costs 6 less',3,15,'繕')],tip:{id:'trans',name:'Transfusion',desc:'Drinking from the orb also mends half your weapon.',cost:50,g:'輸'}},
    {name:'Hunger',nodes:[ND('gain','Hunger','+10% blood from kills and hits',3,18,'飢'),ND('btime','Long thirst','Bloodthirst lasts 1s longer',3,22,'長')],tip:{id:'frenzy',name:'Frenzy',desc:'Every kill during bloodthirst makes it last a second longer.',cost:60,g:'狂'}}]},
  {id:'tools',name:'Tools',jp:'具',g:'具',desc:'Kunai and shuriken, no weapon needed.',branches:[
    {name:'Kunai',nodes:[ND('kunai','Kunai belt','+1 kunai',3,12,'苦')],tip:{id:'tags',name:'Explosive Tags',desc:'Kunai burst on impact, hurting everything nearby.',cost:40,g:'爆'}},
    {name:'Shuriken',nodes:[ND('shuri','Shuriken pouch','+1 shuriken',3,12,'星')],tip:{id:'boom',name:'Returning Stars',desc:'Shuriken fly back to your hand, cutting again on the way.',cost:40,g:'返'}},
    {name:'Craft',nodes:[ND('tdmg','Sharpened steel','Tools deal +1 damage',2,25,'研'),ND('trefill','Scavenger','Kills restock tools more often',3,15,'拾')],tip:{id:'poison',name:'Poisoned Steel',desc:'Tool hits make foes bleed.',cost:50,g:'毒'}}]},
  {id:'body',name:'Body',jp:'身',g:'身',desc:'The soul inside the armor.',branches:[
    {name:'Iron',nodes:[ND('soul','Iron soul','+1 max soul',2,45,'魂')],tip:{id:'unbroken',name:'Unbroken',desc:'Once per realm, a killing blow leaves you on one soul instead.',cost:70,g:'不'}},
    {name:'Feet',nodes:[ND('dash','Light feet','Dash recharges 10% faster',3,16,'足')],tip:{id:'ghost',name:'Ghost Step',desc:'Dashing through an enemy cut refunds the dash and slows time.',cost:50,g:'影'}},
    {name:'Trade',nodes:[ND('purse','Coin purse','Start runs with 10 more mon',3,10,'銭'),ND('haggle','Haggler','Shops 8% cheaper',3,14,'商')],tip:{id:'luck',name:'Lucky Coin',desc:'Foes drop a quarter more mon.',cost:35,g:'福'}}]},
  {id:'reserve',w:'reserve',name:'Broken katana',jp:'折',innate:'r_spin',desc:'Your own blade. Blood Spin is yours from the start.',branches:[
    {name:'Edge',nodes:[ND('len','Longer shard','Its cuts reach 14px farther',5,10,'刃')],tip:{skill:'r_flash',cost:30}},
    {name:'Hand',nodes:[ND('rcd','Quick hand','Its cooldowns 6% faster',3,18,'手')],tip:{skill:'r_mirror',cost:40}},
    {name:'Return',nodes:[ND('rskl','Blood memory','Traces recharge 1.5s faster with it',2,20,'憶'),ND('rhold','Blood draw','Its held wave flies 25% farther',2,14,'波')],tip:{skill:'r_return',cost:45}},
    {name:'Storm',nodes:[ND('rfin','Finisher','Its third click hits 1 harder',1,24,'終'),ND('rreach','Wide arc','Its clicks reach 8% farther',2,14,'弧')],tip:{skill:'r_thousand',cost:55}},
    {name:'Bloom',nodes:[ND('rthirst','Blood blade','Bloodthirst lasts 1s longer on it',2,18,'咲'),ND('rdraw','Quick draw','Holds charge 20% faster',2,16,'抜')],tip:{skill:'r_petal',cost:70}}]},
  {id:'katana',w:'katana',name:'Katana',jp:'刀',branches:WB('katana',[ND('iai','Iaido','The held draw hits 1 harder',2,16,'居'),ND('flow','Flowing hand','Traced cuts reach 12% farther',2,16,'流')])},
  {id:'yari',w:'yari',name:'Yari',jp:'槍',branches:WB('yari',[ND('sweep','Wide sweep','The sweep reaches 15% farther',2,16,'払'),ND('brace','Brace','Braced thrusts stun longer',2,16,'構')])},
  {id:'kanabo',w:'kanabo',name:'Kanabō',jp:'棒',branches:WB('kanabo',[ND('quake','Heavy','Shockwaves 15% wider',2,16,'震'),ND('hop','Bound','The hop slam reaches farther',2,16,'跳')])},
  {id:'kusari',w:'kusari',name:'Kusarigama',jp:'鎖',branches:WB('kusari',[ND('reel','Fast reel','Hooked foes come 25% faster and stay stunned longer',2,16,'引'),ND('chain','Long chain','The chain reaches 15% farther',2,16,'鎖')])},
  {id:'musket',w:'musket',name:'Teppō',jp:'砲',branches:WB('musket',[ND('reload','Quick hands','Reloads 12% faster',2,16,'装'),ND('sweet','Steady','The perfect-reload window is wider',2,16,'的')])},
  {id:'nodachi',w:'nodachi',name:'Nodachi',jp:'太',branches:WB('nodachi',[ND('cleave','Cleave','The third click cleaves 1 harder',2,16,'断'),ND('draw','Crescent','The held circle is 20% wider',2,16,'円')])},
  {id:'tessen',w:'tessen',name:'Tessen',jp:'扇',branches:WB('tessen',[ND('gust','Gale','Gusts push 20% harder and farther',2,16,'風'),ND('mirror','Mirror','Mirror Fan waits 0.3s longer',2,16,'鏡')])},
  {id:'bo',w:'bo',name:'Bō',jp:'杖',branches:WB('bo',[ND('stagger','Stagger','Jabs stun longer',2,16,'突'),ND('vault','Vault','Pole Vault goes 20% farther',2,16,'跳')])},
  {id:'kama',w:'kama',name:'Kama',jp:'鎌',branches:WB('kama',[ND('bleed','Deep cuts','Bleeding hits 1 harder',2,16,'血'),ND('hookr','Long hook','The thrown hook reaches 15% farther',2,16,'鉤')])},
  {id:'naginata',w:'naginata',name:'Naginata',jp:'薙',branches:WB('naginata',[ND('sweep2','Wide sweep','Sweeps reach 15% farther',2,16,'払'),ND('wheel','Wheel','The Wheel spins faster and hits 1 harder',2,16,'輪')])}
];
const upgCost=(base,lv)=>Math.round(base*(1+0.7*lv));
const tipKey=(t,b)=>t.id+'.'+(b.tip.skill||b.tip.id);
const TOTAL_LV=TREES.reduce((a,t)=>a+t.branches.reduce((b,br)=>b+br.nodes.reduce((c,n)=>c+n.max,0)+1,0),0);

// meta progress (kept forever)
const META_KEY='blood-katana-shrine-v2';
const freshMeta=()=>({shards:0,up:{},wseen:{},runs:0,wins:0,bestFloor:0,kills:0,seen:{},legacy:false,realms:0,startW:'',tut:0,
  koban:0,cos:{own:{},eq:{o:'o:default',k:'k:steel',s:'s:crimson',t:'t:crimson',w:{}}},spin:{day:'',free:1,ads:0,total:0},npc:{},feat:{done:{},n:{}},best:{},rec:{},daily:{streak:0,best:0},hell:0,ramen:0,charm:0,foxBless:0,gift:{day:'',idx:0,cycle:0,pick:null},pro:0});
let META=freshMeta();
function loadMeta(){
  try{const m=JSON.parse(localStorage.getItem(META_KEY)||'{}');for(const k in META)if(k in m&&typeof m[k]===typeof META[k])META[k]=m[k];
    if(!m.legacy){const old=JSON.parse(localStorage.getItem('blood-katana-shrine-v1')||'{}');if(old.level){META.up['reserve.len']=Math.min(5,Math.round(old.level/3));META.shards+=old.shards|0;}META.legacy=true;}}catch(_){}
  META.shards=Math.max(0,META.shards|0);if(typeof META.up!=='object'||!META.up)META.up={};if(typeof META.wseen!=='object'||!META.wseen)META.wseen={};
}
function saveMeta(){try{localStorage.setItem(META_KEY,JSON.stringify(META));}catch(_){}}
const up=(tree,node)=>META.up[tree+'.'+node]|0;
const tipOwned=(tree,id)=>!!META.up[tree+'.'+id];
const treeLv=t=>t.branches.reduce((a,b)=>a+b.nodes.reduce((c,n)=>c+Math.min(n.max,up(t.id,n.id)),0)+(META.up[tipKey(t,b)]?1:0),0);
const treeMax=t=>t.branches.reduce((a,b)=>a+b.nodes.reduce((c,n)=>c+n.max,0)+1,0);
const masteryPct=()=>Math.round(TREES.reduce((a,t)=>a+treeLv(t),0)/TOTAL_LV*100);
const treeOpen=t=>!t.w||t.w==='reserve'||!!META.wseen[t.w];
const shortestCut=()=>CFG.lengthBase+14*up('reserve','len');
const capOn=(tree,id)=>tipOwned(tree,id);
// techniques you know for a weapon: the innate one plus every tip you have forged
function knownTech(w){return Object.values(SKILLS).filter(s=>s.w===w&&(s.innate||tipOwned(w,s.id)||(typeof S!=='undefined'&&S.dbgTech)));}

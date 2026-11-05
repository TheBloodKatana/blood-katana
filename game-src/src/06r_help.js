// ================= How to play: the lesson videos and threat cards again, as a browsable guide =================
// Every card plays the same scene as its lesson or threat card, drawn by the game's own renderer.
const HELP_MOVES=[
  {id:'move',name:'Move',key:'WASD or the arrow keys.',touch:'Put your thumb anywhere in the lower left: the stick appears under it.'},
  {id:'dash',name:'Dash',key:'Space. You pass through attacks while dashing.',touch:'DASH. You pass through attacks while dashing.'},
  {id:'tap',name:'Quick slash',key:'Click near a foe. Every third click is the weapon\'s finisher.',touch:'Tap near a foe. Every third tap is the weapon\'s finisher.'},
  {id:'swipe',name:'Cut',key:'Drag a line through foes: the weapon\'s main move.',touch:'Swipe a line through foes: the weapon\'s main move.'},
  {id:'hold',name:'Charged move',key:'Press and hold still, then let go.',touch:'Hold your finger still, then lift it.'},
  {id:'parry',name:'Parry',key:'Cut across a foe\'s yellow line as it travels. It breaks their guard.',touch:'Swipe across a foe\'s yellow line as it travels. It breaks their guard.'},
  {id:'tool',name:'Tools',key:'X throws a kunai, C a fan of shuriken. Walls stop bullets.',touch:'KUNAI and SHURI throw tools; the number is how many are left.'},
  {id:'tech',name:'Technique',key:'Hold right-click and draw a shape. Time slows while you draw.',touch:'Press 技, then draw a shape anywhere. Time slows while you draw.'},
  {id:'heal',name:'Heal',key:'Q drinks from the blood orb and gives back a soul.',touch:'HEAL drinks from the blood orb and gives back a soul.'},
  {id:'thirst',name:'Bloodthirst',key:'R when the orb is full: your blade drinks and grows.',touch:'THIRST when the orb is full: your blade drinks and grows.'},
];
const HELP={raf:0,last:0,t:0};
function helpCard(id,name,text){return`<div class="hcard"><canvas width="${DEMO_W}" height="${DEMO_H}" data-hdemo="${id}"></canvas><h5>${esc(tr(name))}</h5><p>${esc(tr(text))}</p></div>`;}
function buildHelp(){
  const touch=!!S.touchUI,b=$('helpBasics'),t=$('helpThreats');
  if(b)b.innerHTML=HELP_MOVES.map(m=>helpCard(m.id,m.name,touch?m.touch:m.key)).join('');
  if(t)t.innerHTML=Object.entries(THREATS).map(([k,v])=>helpCard('th_'+k,v.name,v.text)).join('')+
    helpCard('parry','Wind-ups','A filling line, an arrowhead and a flashing ! show where and when a foe will strike. Cut across the line to parry, or dash through it.');
  for(const k of document.querySelectorAll('#helpTabs .kbd-only'))k.hidden=touch;
  cancelAnimationFrame(HELP.raf);HELP.last=performance.now();HELP.raf=requestAnimationFrame(helpFrame);
}
function helpFrame(now){
  const ov=$('helpOv');if(!ov||ov.hidden)return;HELP.raf=requestAnimationFrame(helpFrame);
  const dt=Math.min(0.05,(now-HELP.last)/1000);if(dt<1/31)return;HELP.last=now;HELP.t+=dt;
  for(const cv of ov.querySelectorAll('.hpane:not([hidden]) canvas[data-hdemo]')){
    const r=cv.getBoundingClientRect();if(r.bottom<0||r.top>innerHeight||!r.width)continue;
    const id=cv.dataset.hdemo,len=DEMO_LEN[id]||3,g=cv.getContext('2d');g.imageSmoothingEnabled=false;
    try{drawDemo(g,id,(HELP.t+(id.length*0.37))%len,!!S.touchUI);}catch(_){}
  }
}

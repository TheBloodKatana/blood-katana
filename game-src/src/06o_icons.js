// ================= pixel icons for the touch buttons =================
// 12×12 bitmaps turned into crisp SVGs, so the on-screen buttons read like the game rather than like an emulator overlay.
const BTN_PAL={k:'#0a0608',r:'#ff4a5c',d:'#b8142a',w:'#ece4d7',s:'#a8acb6',g:'#6a6270',b:'#8a5a34',y:'#e8c15a',c:'#9ad8ff',o:'#ff9a3a'};
const BTN_ICONS={
  heal:['............','....wwww....','....wwww....','....wwww....','.wwwwwwwwww.','.wwwwwwwwww.','.wwwwwwwwww.','.wwwwwwwwww.','....wwww....','....wwww....','....wwww....','............'],
  mend:['............','.sssssss.ss.','.sssssssss..','.sssssss....','...bb.......','...bb.......','...bb.......','...bb.......','...bb.......','...bb.......','...bb.......','............'],
  thirst:['..........k.','.........kwk','........kwsk','.......kwsk.','......kwsk..','.....kwsk...','..kk.krsk...','..kykrrk....','...kykk.....','..kbkky.....','.kbk..r.....','.kk...r.....'],
  kunai:['.....kk.....','....kwsk....','....kwsk....','...kwssk....','...kwsssk...','...kwsssk...','....kwsk....','.....kk.....','....kbbk....','....kbbk....','....kykk....','...ky.yk....'],
  shuri:['............','.....kk.....','....kwwk....','....kwwk....','..kkswwskk..','.kwwwkksssk.','.kwwwkksssk.','..kksssskk..','....kssk....','....kssk....','.....kk.....','............'],
  throw:['..........kk','.........kwk','........kwsk','.......kwsk.','..g...kwsk..','.g...kwsk...','g...kwsk....','.g.kkskk....','..kykk......','.kbky.......','kbk.........','kk..........'],
  dash:['............','......kk....','......kwk...','.gg.kkkwwk..','....kwwwwwk.','ggg.kwwwwwwk','....kwwwwwk.','.gg.kkkwwk..','......kwk...','......kk....','............','............'],
  take:['............','...k.k.k....','..kwkwkwk...','..kwkwkwk.k.','..kwwwwwkkwk','..kwwwwwwkwk','..kwwwwwwwk.','..kwwwwwwwk.','...kwwwwwk..','....kwwwk...','....kkkkk...','............'],
};
// one colour, one shade: every drawn pixel is filled with the button's text colour; outlines drop out, and a few
// pixels can be cut out as negative space through BTN_HOLES
const BTN_HOLES={};
const btnOn=(name,ch)=>ch!=='.'&&ch!=='k'&&!(BTN_HOLES[name]||'').includes(ch);
function iconSvg(name){const B=BTN_ICONS[name];if(!B)return'';let r='';
  B.forEach((row,y)=>{for(let x=0;x<row.length;x++)if(btnOn(name,row[x]))r+=`<rect x="${x}" y="${y}" width="1.02" height="1.02"/>`;});
  return`<svg class="ti" viewBox="0 0 12 12" shape-rendering="crispEdges" fill="currentColor" aria-hidden="true">${r}</svg>`;}
// each button keeps a spoken name (aria-label, translated like everything else) and shows an icon plus, for tools, a count
function buildButtonIcons(){
  const set=(id,icon,label,count)=>{const b=$(id);if(!b)return;b.setAttribute('aria-label',label);b.title=label;b.innerHTML=iconSvg(icon)+(count?`<b class="tcount" id="${id}N">0</b>`:'');b.classList.add('ticon');};
  set('tHeal','heal','Heal');set('tMend','mend','Mend');set('tUlt','thirst','Thirst');
  set('tKunai','kunai','Kunai',true);set('tShuri','shuri','Shuri',true);set('tThrow','throw','Throw');
  set('tDash','dash','Dash');
  const u=$('tUse');if(u){u.classList.add('ticon','wide');u.innerHTML=iconSvg('take')+'<span class="tlbl" id="tUseL">Take</span>';}
}

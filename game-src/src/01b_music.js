// ================= the soundtrack: engine and songs, in their own scope =================
const {createEngine,compileSong,SONGS}=(()=>{
// ================= the soundtrack engine (also used by the concept soundboard) =================
// ================= Blood Katana music engine =================
// Every sound is synthesised in WebAudio: plucked strings by Karplus-Strong, breath and drums from shaped noise.
// Songs are written as patterns (see songs.js) and compiled to an event list that loops from a chosen section.
const NOTE_IX={c:0,'c#':1,db:1,d:2,'d#':3,eb:3,e:4,f:5,'f#':6,gb:6,g:7,'g#':8,ab:8,a:9,'a#':10,bb:10,b:11};
function noteHz(n){const m=/^([a-g](?:#|b)?)(-?\d)$/.exec(n);if(!m)return null;return 440*Math.pow(2,(NOTE_IX[m[1]]+12*(+m[2]+1)-69)/12);}
function notePc(n){const m=/^([a-g](?:#|b)?)/.exec(n);return m?NOTE_IX[m[1]]:null;}
const DRUMS=new Set(['odaiko','taiko','rim','shime','kane','rin','hyoshigi','mokugyo','suzu','clap','shout','furin','drip','kotsu']);

// ---------- compile a song into timed events ----------
function parseTokens(str){return str.trim().split(/\s+/).filter(Boolean);}
function drumTokens(str){return str.replace(/\s+/g,'').split('');}
function compileSong(song){
  const stepDur=60/song.bpm/song.spb,bar=song.bar||16,events=[],secs=[];let t=0,loopStart=0,loopIdx=0;
  song.order.forEach((pn,oi)=>{
    const P=song.parts[pn];if(!P)throw new Error(song.id+': no part '+pn);const steps=P.bars*bar;
    if(oi===(song.loop||0))loopStart=t;
    for(const tn in P.t){
      const I=song.inst[tn];if(!I)throw new Error(song.id+': no instrument '+tn);
      let spec=P.t[tn],r=1;if(Array.isArray(spec)){r=spec[0];spec=spec[1];}
      const drum=DRUMS.has(I.i),toks=drum?drumTokens(spec):parseTokens(spec),n=Math.floor(steps/r);
      if(!toks.length)continue;
      for(let k=0;k<n;k++){
        const tok=toks[k%toks.length];if(tok==='.'||tok==='-')continue;
        let j=k+1;while(j<n&&toks[j%toks.length]==='-')j++;
        const base=k*r,sw=song.swing&&base%2===1?song.swing*stepDur:0,dur=(j-k)*r*stepDur;
        if(drum){const vel=tok==='X'?1.25:tok==='o'?0.55:1;events.push({t:t+base*stepDur+sw,tr:tn,drum:true,ch:tok,vel,dur});continue;}
        const m=/^([a-g#0-9+-]+?)([!,^~<>]*)$/.exec(tok);if(!m)throw new Error(song.id+': bad token '+tok+' in '+tn);
        const notes=m[1].split('+'),mods=m[2];
        for(const nn of notes)if(noteHz(nn)===null)throw new Error(song.id+': bad note '+nn+' in '+tn);
        events.push({t:t+base*stepDur+sw,tr:tn,notes,dur,vel:mods.includes('!')?1.3:mods.includes(',')?0.6:1,mods});
      }
    }
    secs.push({name:P.label||pn,t0:t,t1:t+steps*stepDur});t+=steps*stepDur;
  });
  events.sort((a,b)=>a.t-b.t);loopIdx=events.findIndex(e=>e.t>=loopStart-1e-6);
  return{events,secs,total:t,loopStart,loopLen:t-loopStart,loopIdx:loopIdx<0?0:loopIdx,stepDur};
}

// ---------- the engine ----------
function createEngine(ctx,dest){
  const E={ctx,ks:new Map(),tracks:{},fight:true,muted:new Set(),song:null,c:null,playing:false};
  const sr=ctx.sampleRate;
  // master: compressor, reverb send, tempo delay send
  const master=ctx.createGain();master.gain.value=0.62;
  const comp=ctx.createDynamicsCompressor();comp.threshold.value=-16;comp.knee.value=8;comp.ratio.value=3.5;comp.attack.value=0.01;comp.release.value=0.25;
  const lim=ctx.createDynamicsCompressor();lim.threshold.value=-3;lim.knee.value=0;lim.ratio.value=20;lim.attack.value=0.002;lim.release.value=0.1;
  master.connect(comp);comp.connect(lim);lim.connect(dest||ctx.destination);
  const an=ctx.createAnalyser?ctx.createAnalyser():null;if(an){an.fftSize=512;lim.connect(an);}E.analyser=an;
  const rev=ctx.createConvolver();{const len=Math.floor(sr*3.2),ir=ctx.createBuffer(2,len,sr);for(let c=0;c<2;c++){const d=ir.getChannelData(c);let lp=0;for(let i=0;i<len;i++){const k=i/len;lp=lp*0.6+(Math.random()*2-1)*0.4;d[i]=lp*Math.pow(1-k,3.2)*(i<sr*0.012?i/(sr*0.012):1);}}rev.buffer=ir;}
  const revIn=ctx.createGain();revIn.gain.value=0.55;revIn.connect(rev);rev.connect(master);
  const dly=ctx.createDelay(2),dfb=ctx.createGain(),dlp=ctx.createBiquadFilter(),dIn=ctx.createGain();dfb.gain.value=0.33;dlp.type='lowpass';dlp.frequency.value=2400;dIn.gain.value=0.6;
  dIn.connect(dly);dly.connect(dlp);dlp.connect(dfb);dfb.connect(dly);dlp.connect(master);dlp.connect(revIn);
  E.master=master;
  const nbuf=ctx.createBuffer(1,sr*2,sr);{const d=nbuf.getChannelData(0);for(let i=0;i<d.length;i++)d[i]=Math.random()*2-1;}
  const noise=(t,dur)=>{const s=ctx.createBufferSource();s.buffer=nbuf;s.loop=true;s.start(t,Math.random()*1.5);s.stop(t+dur+0.05);return s;};
  const env=(g,t,a,peak,hold,rel)=>{g.gain.setValueAtTime(0.0001,t);g.gain.exponentialRampToValueAtTime(Math.max(0.0002,peak),t+a);if(hold>0)g.gain.setValueAtTime(Math.max(0.0002,peak),t+a+hold);g.gain.exponentialRampToValueAtTime(0.0001,t+a+hold+rel);};
  const osc=(type,f,t,stop)=>{const o=ctx.createOscillator();o.type=type;o.frequency.setValueAtTime(f,t);o.start(t);o.stop(stop);return o;};
  const filt=(type,f,q)=>{const b=ctx.createBiquadFilter();b.type=type;b.frequency.value=f;if(q!=null)b.Q.value=q;return b;};

  // Karplus-Strong plucked strings, cached per pitch
  function ksBuf(kind,f){
    const key=kind+'|'+f.toFixed(2);let b=E.ks.get(key);if(b)return b;
    const C={koto:{dur:2.0,t60:1.9,bright:0.55,buzz:0},shami:{dur:1.2,t60:0.9,bright:0.85,buzz:0.35},biwa:{dur:2.4,t60:2.3,bright:0.7,buzz:0.55},crystal:{dur:2.2,t60:2.1,bright:0.95,buzz:0}}[kind];
    const n=Math.floor(C.dur*sr),P=Math.max(2,Math.round(sr/f)),line=new Float32Array(P);
    let lp=0;for(let i=0;i<P;i++){const w=Math.random()*2-1;lp=lp+(w-lp)*C.bright;line[i]=lp;}
    // a pick position comb: remove the 1/8 harmonic node for a hollower koto
    if(kind==='koto'||kind==='crystal'){const o=Math.max(1,Math.round(P/8)),cp=line.slice();for(let i=0;i<P;i++)line[i]=cp[i]-0.6*cp[(i+o)%P];}
    const decay=Math.pow(0.001,P/(sr*C.t60));
    b=ctx.createBuffer(1,n,sr);const d=b.getChannelData(0);let idx=0,mx=0;
    for(let i=0;i<n;i++){const a=line[idx],nx=line[(idx+1)%P];d[i]=a;line[idx]=decay*(kind==='crystal'?0.9*a+0.1*nx:0.5*(a+nx));idx=(idx+1)%P;const v=Math.abs(d[i]);if(v>mx)mx=v;}
    if(C.buzz){for(let i=0;i<n;i++){const v=d[i]/mx;d[i]=Math.tanh(v*(1+C.buzz*4))*0.8;}mx=1;}
    if(kind==='crystal'){// add a pure bell partial on top
      for(let i=0;i<n;i++){const tt=i/sr;d[i]=d[i]/mx*0.7+0.35*Math.sin(2*Math.PI*f*2*tt)*Math.exp(-tt*1.6);}mx=1;}
    for(let i=0;i<n;i++)d[i]/=mx;
    E.ks.set(key,b);return b;
  }
  function pluck(kind,f,t,dur,vel,I,mods,out){
    const s=ctx.createBufferSource();s.buffer=ksBuf(kind,f);const g=ctx.createGain(),v=(I.v||0.4)*vel*(kind==='koto'?1.6:kind==='crystal'?1.25:1);
    s.playbackRate.setValueAtTime(1,t);
    if(mods.includes('^')){const at=t+Math.min(dur*0.45,0.25);s.playbackRate.setValueAtTime(1,at);s.playbackRate.linearRampToValueAtTime(Math.pow(2,(I.bend||2)/12),at+0.07);}
    if(mods.includes('~')){const lfo=osc('sine',5.5,t+0.2,t+dur+1),lg=ctx.createGain();lg.gain.value=0.012;lfo.connect(lg);lg.connect(s.playbackRate);}
    g.gain.setValueAtTime(v,t);
    if(I.mono||I.mute){const end=t+Math.max(0.08,dur);g.gain.setValueAtTime(v,end-0.02);g.gain.exponentialRampToValueAtTime(0.0001,end+0.06);}
    const tone=kind==='shami'?filt('peaking',2600,1.2):filt('lowpass',kind==='biwa'?2200:kind==='crystal'?9000:3800,0.7);if(kind==='shami')tone.gain.value=6;
    s.connect(tone);tone.connect(g);g.connect(out);s.start(t);s.stop(t+(I.mono||I.mute?dur+0.1:2.6));
    if(kind==='shami'||kind==='biwa'){// the bachi strike
      const nz=noise(t,0.03),bf=filt('bandpass',kind==='biwa'?1500:3000,2),ng=ctx.createGain();env(ng,t,0.001,v*0.5,0,0.03);nz.connect(bf);bf.connect(ng);ng.connect(out);}
  }
  function wind(f,t,dur,vel,I,mods,out,flavor){
    // shakuhachi / nohkan: breathy triangle with a scoop up into the note and late vibrato
    const v=(I.v||0.3)*vel,end=t+dur,bright=flavor==='nokan'?3600:2000;
    const o1=osc(flavor==='nokan'?'sawtooth':'triangle',f,t,end+0.3),o2=osc('sine',f*2,t,end+0.3),lp=filt('lowpass',bright,0.8),g=ctx.createGain(),g2=ctx.createGain();g2.gain.value=0.18;
    if(!mods.includes('>')){o1.frequency.setValueAtTime(f*(mods.includes('^')?0.89:0.965),t);o1.frequency.exponentialRampToValueAtTime(f,t+(mods.includes('^')?0.22:0.08));}
    else{o1.frequency.setValueAtTime(f*1.12,t);o1.frequency.setValueAtTime(f,t+0.06);}
    o2.frequency.setValueAtTime(f*2,t);
    const vib=osc('sine',5.2,t,end+0.3),vg=ctx.createGain();vg.gain.setValueAtTime(0,t);vg.gain.linearRampToValueAtTime(f*(mods.includes('~')?0.025:0.011),t+Math.min(0.45,dur*0.7));vib.connect(vg);vg.connect(o1.frequency);vg.connect(o2.frequency);
    env(g,t,0.07,v,Math.max(0,dur-0.16),0.18);
    o1.connect(lp);o2.connect(g2);g2.connect(lp);lp.connect(g);g.connect(out);
    const nz=noise(t,dur+0.2),bf=filt('bandpass',f*1.6,1.4),ng=ctx.createGain();env(ng,t,0.03,v*(flavor==='nokan'?0.5:0.38),Math.max(0,dur-0.12),0.15);nz.connect(bf);bf.connect(ng);ng.connect(out);
    const ch=noise(t,0.08),cf=filt('highpass',4000),cg=ctx.createGain();env(cg,t,0.004,v*0.4,0,0.06);ch.connect(cf);cf.connect(cg);cg.connect(out);
  }
  function pad(fs,t,dur,vel,I,out,kind){
    // shō (bright reed cluster), choir (formant saws), strings (warm saws)
    const v=(I.v||0.2)*vel/Math.sqrt(fs.length),end=t+dur,atk=I.atk||(kind==='sho'?0.35:0.6),rel=I.rel||1.2;
    const g=ctx.createGain();env(g,t,atk,v,Math.max(0,dur-atk),rel);
    let dst=g;
    if(kind==='choir'){const vow=I.vowel||'oo',F=vow==='ah'?[730,1090]:vow==='ee'?[300,2200]:[330,800],sum=ctx.createGain();for(const ff of F){const b=filt('bandpass',ff,7);sum.connect(b);b.connect(g);}dst=sum;}
    else{const lp=filt('lowpass',kind==='sho'?2400:kind==='brass'?1200:1100,0.6);lp.connect(g);dst=lp;if(kind==='brass'){lp.frequency.setValueAtTime(400,t);lp.frequency.linearRampToValueAtTime(2200,t+0.12);lp.frequency.exponentialRampToValueAtTime(900,t+0.6);}}
    for(const f of fs){for(const dt of kind==='sho'?[-5,5]:[-9,0,9]){const o=osc(kind==='sho'?'square':'sawtooth',f,t,end+rel+0.1);o.detune.value=dt;if(kind==='choir'){const vb=osc('sine',5+Math.random(),t,end+rel+0.1),vg=ctx.createGain();vg.gain.value=f*0.008;vb.connect(vg);vg.connect(o.frequency);}
      if(kind==='brass'){o.frequency.setValueAtTime(f*0.94,t);o.frequency.exponentialRampToValueAtTime(f,t+0.08);}o.connect(dst);}}
    g.connect(out);
  }
  function bass(f,t,dur,vel,I,out){
    const v=(I.v||0.35)*vel*0.68,end=t+Math.max(0.1,dur*0.95),o=osc('triangle',f,t,end+0.2),o2=osc('sine',f,t,end+0.2),g=ctx.createGain(),lp=filt('lowpass',700,0.7);
    g.gain.setValueAtTime(0.0001,t);g.gain.exponentialRampToValueAtTime(v,t+0.012);g.gain.exponentialRampToValueAtTime(v*0.6,t+0.2);g.gain.setValueAtTime(v*0.6,end-0.03);g.gain.exponentialRampToValueAtTime(0.0001,end+0.08);
    o.connect(lp);o2.connect(lp);lp.connect(g);g.connect(out);
  }
  function drum(ch,t,vel,I,out){
    const v=(I.v||0.5)*vel,kind=I.i;
    const tone=(f0,f1,dec,amp,type)=>{const o=osc(type||'sine',f0,t,t+dec+0.05),g=ctx.createGain();o.frequency.exponentialRampToValueAtTime(Math.max(20,f1),t+dec*0.7);env(g,t,0.003,amp,0,dec);o.connect(g);g.connect(out);};
    const nz=(ft,f,q,dec,amp)=>{const s=noise(t,dec),b=filt(ft,f,q),g=ctx.createGain();env(g,t,0.002,amp,0,dec);s.connect(b);b.connect(g);g.connect(out);};
    if(ch==='r'){for(let i=0;i<3;i++)drum('x',t+i*0.045,vel*(0.6+i*0.2),I,out);return;}
    switch(kind){
      case'odaiko':tone(68,34,1.3,v);tone(136,60,0.25,v*0.4);nz('lowpass',220,0.7,0.35,v*0.7);break;
      case'taiko':tone(128,62,0.55,v);nz('lowpass',500,0.7,0.14,v*0.55);nz('bandpass',1800,1,0.03,v*0.25);break;
      case'rim':nz('bandpass',2400,3,0.05,v*2.2);tone(1150,1100,0.04,v*0.9);break;
      case'shime':tone(360,280,0.14,v*0.8);nz('bandpass',1900,1.6,0.09,v*0.6);break;
      case'kane':[1,2.76,5.4,8.93].forEach((r,i)=>tone(880*r,880*r,0.5/(1+i*0.5),v/(1+i),'sine'));nz('highpass',6000,null,0.04,v*0.3);break;
      case'rin':{const f=I.f||(ch==='o'?1320:880);[1,2.73,5.2].forEach((r,i)=>tone(f*r,f*r*0.998,3.5/(1+i*0.8),v/(1+i*1.5),'sine'));break;}
      case'hyoshigi':tone(1900,1850,0.04,v);tone(2700,2650,0.03,v*0.6);nz('highpass',3000,null,0.015,v*0.5);break;
      case'kotsu':tone(1300,1150,0.05,v*0.7);nz('bandpass',2600,3,0.03,v*0.4);break;
      case'mokugyo':tone(540,470,0.09,v);nz('bandpass',950,3,0.04,v*0.4);break;
      case'suzu':nz('highpass',7000,null,0.12,v*0.5);[5200,6400,7600].forEach((f,i)=>tone(f,f,0.18,v*0.12,'sine'));break;
      case'clap':nz('bandpass',1200,1,0.08,v);nz('bandpass',1400,1,0.06,v*0.6);break;
      case'furin':{const f=1900+Math.random()*1600;[1,2.4,4.1].forEach((r,i)=>tone(f*r,f*r,2.4/(1+i),v*0.18/(1+i),'sine'));break;}
      case'drip':tone(1500+Math.random()*500,500,0.07,v*0.5);break;
      case'shout':{// a short kakegoe, "yo!" / "ha!"
        const f0=ch==='X'?260:200,o=osc('sawtooth',f0,t,t+0.35),g=ctx.createGain();o.frequency.linearRampToValueAtTime(f0*1.25,t+0.06);o.frequency.exponentialRampToValueAtTime(f0*0.7,t+0.3);
        const sum=ctx.createGain();for(const ff of [650,1100,2500]){const b=filt('bandpass',ff,6);o.connect(b);b.connect(sum);}env(g,t,0.02,v*1.8,0.08,0.18);sum.connect(g);g.connect(out);nz('bandpass',2000,1,0.06,v*0.4);break;}
    }
  }
  function horn(f,t,dur,vel,I,out){ // horagai conch: a wide breathy brass bellow
    const v=(I.v||0.3)*vel,end=t+dur,o=osc('sawtooth',f*0.9,t,end+0.4),o2=osc('sawtooth',f*1.005,t,end+0.4),lp=filt('lowpass',300,1.2),g=ctx.createGain();
    o.frequency.exponentialRampToValueAtTime(f,t+0.18);lp.frequency.setValueAtTime(300,t);lp.frequency.linearRampToValueAtTime(1500,t+0.25);lp.frequency.setValueAtTime(1500,end-0.1);lp.frequency.exponentialRampToValueAtTime(300,end+0.3);
    env(g,t,0.18,v,Math.max(0,dur-0.25),0.35);o.connect(lp);o2.connect(lp);lp.connect(g);g.connect(out);
    const nz=noise(t,dur+0.3),bf=filt('bandpass',f*3,1),ng=ctx.createGain();env(ng,t,0.1,v*0.3,Math.max(0,dur-0.2),0.3);nz.connect(bf);bf.connect(ng);ng.connect(out);
  }
  // ambient beds that run under a whole song
  function startAmb(kind){
    stopAmb();if(!kind)return;const g=ctx.createGain();g.gain.value=0;g.connect(master);g.gain.setTargetAtTime(1,ctx.currentTime,1.2);
    const s=ctx.createBufferSource();s.buffer=nbuf;s.loop=true;s.start();const nodes=[s,g];
    const add=(type,f,q,vol,lfoF,lfoD)=>{const b=filt(type,f,q),gg=ctx.createGain();gg.gain.value=vol;s.connect(b);b.connect(gg);gg.connect(g);if(lfoF){const l=ctx.createOscillator(),lg=ctx.createGain();l.frequency.value=lfoF;lg.gain.value=lfoD;l.connect(lg);lg.connect(b.frequency);l.start();nodes.push(l);}};
    if(kind==='wind')add('bandpass',500,0.8,0.05,0.08,300);
    if(kind==='highwind'){add('bandpass',900,2,0.04,0.11,500);add('bandpass',2400,4,0.012,0.07,900);}
    if(kind==='water'){add('lowpass',600,0.5,0.03,0.2,150);add('bandpass',2600,3,0.008,0.5,600);}
    if(kind==='fire'){add('lowpass',300,0.5,0.06,0.3,80);add('highpass',5000,0.5,0.006,1.1,1500);}
    if(kind==='ice')add('bandpass',3200,6,0.012,0.05,1400);
    if(kind==='drone')add('lowpass',140,0.4,0.08,0.05,30);
    E.amb={g,nodes};
  }
  function stopAmb(){if(!E.amb)return;const {g,nodes}=E.amb;g.gain.setTargetAtTime(0,ctx.currentTime,0.3);setTimeout(()=>{nodes.forEach(n=>{try{n.stop&&n.stop();}catch(_){}});try{g.disconnect();}catch(_){}},1500);E.amb=null;}

  function trackBus(tn,I){
    let T=E.tracks[tn];if(T)return T;
    const g=ctx.createGain(),pan=ctx.createStereoPanner?ctx.createStereoPanner():null;g.gain.value=E.muted.has(tn)||(I.layer==='fight'&&!E.fight)?0:1;
    if(pan){pan.pan.value=I.pan||0;g.connect(pan);pan.connect(master);}else g.connect(master);
    const rs=ctx.createGain();rs.gain.value=I.rev??0.3;g.connect(rs);rs.connect(revIn);
    if(I.dly){const ds=ctx.createGain();ds.gain.value=I.dly;g.connect(ds);ds.connect(dIn);}
    T=E.tracks[tn]={g,I};return T;
  }
  function voice(ev,t){
    const I=E.song.inst[ev.tr],out=trackBus(ev.tr,I).g;
    if(ev.drum){drum(ev.ch,t,ev.vel,I,out);return;}
    const fs=ev.notes.map(n=>noteHz(n)*Math.pow(2,I.oct||0));
    switch(I.i){
      case'koto':case'shami':case'biwa':case'crystal':fs.forEach((f,i)=>pluck(I.i,f,t+(I.strum?i*I.strum:0),ev.dur,ev.vel,I,ev.mods,out));
        if(ev.mods.includes('<')&&fs.length===1)pluck(I.i,fs[0]*Math.pow(2,-2/12),t-0.06,0.06,ev.vel*0.6,I,'',out);break;
      case'shaku':case'nokan':fs.forEach(f=>wind(f,t,ev.dur,ev.vel,I,ev.mods,out,I.i));break;
      case'sho':case'choir':case'strings':case'brass':pad(fs,t,ev.dur,ev.vel,I,out,I.i);break;
      case'bass':fs.forEach(f=>bass(f,t,ev.dur,ev.vel,I,out));break;
      case'horn':fs.forEach(f=>horn(f,t,ev.dur,ev.vel,I,out));break;
    }
  }
  // ---------- transport ----------
  E.load=function(song){if(E.song&&E.song!==song)E.ks.clear();E.stop();for(const k in E.tracks){try{E.tracks[k].g.disconnect();}catch(_){}}E.tracks={};E.song=song;E.c=compileSong(song);for(const tn in song.inst)trackBus(tn,song.inst[tn]);};
  E.play=function(song){if(song)E.load(song);if(!E.song)return;E.t0=ctx.currentTime+0.12;E.i=0;E.off=0;E.playing=true;startAmb(E.song.amb);
    if(E.timer)clearInterval(E.timer);E.timer=setInterval(E.pump,25);E.pump();};
  E.pump=function(){if(!E.playing)return;const c=E.c,hz=ctx.currentTime+0.3;
    while(true){if(E.i>=c.events.length){if(!c.events.length)return;E.i=c.loopIdx;E.off+=c.loopLen;}
      const ev=c.events[E.i],at=E.t0+ev.t+E.off;if(at>hz)break;if(at>=ctx.currentTime-0.05)voice(ev,Math.max(at,ctx.currentTime));E.i++;}};
  E.stop=function(fade){E.playing=false;if(E.timer)clearInterval(E.timer);E.timer=null;stopAmb();const t=ctx.currentTime;for(const k in E.tracks){const g=E.tracks[k].g;g.gain.cancelScheduledValues(t);g.gain.setTargetAtTime(0,t,fade||0.08);}
    const old=E.tracks;E.tracks={};setTimeout(()=>{for(const k in old)try{old[k].g.disconnect();}catch(_){}},800+(fade||0)*4000);if(E.song)for(const tn in E.song.inst)trackBus(tn,E.song.inst[tn]);};
  // the song position, folded into the loop
  E.songTime=function(){if(!E.playing)return 0;const st=ctx.currentTime-E.t0,c=E.c;if(st<c.loopStart)return st;return c.loopStart+((st-c.loopStart)%c.loopLen);};
  E.section=function(){const t=E.songTime();const s=E.c&&E.c.secs.find(x=>t>=x.t0&&t<x.t1);return s?s.name:'';};
  E.setFight=function(on){E.fight=on;const t=ctx.currentTime;for(const k in E.tracks){const T=E.tracks[k];if(T.I.layer==='fight'&&!E.muted.has(k))T.g.gain.setTargetAtTime(on?1:0,t,0.6);}};
  E.setMute=function(tn,m){if(m)E.muted.add(tn);else E.muted.delete(tn);const T=E.tracks[tn];if(!T)return;const on=!m&&!(T.I.layer==='fight'&&!E.fight);T.g.gain.setTargetAtTime(on?1:0,ctx.currentTime,0.05);};
  E.warm=function(song){const c=compileSong(song),need=[];const seen=new Set();for(const ev of c.events){const I=song.inst[ev.tr];if(ev.drum||!['koto','shami','biwa','crystal'].includes(I.i))continue;for(const n of ev.notes){const f=noteHz(n)*Math.pow(2,I.oct||0),k=I.i+'|'+f.toFixed(2);if(!seen.has(k)){seen.add(k);need.push([I.i,f]);}}}
    let i=0;const step=()=>{const t0=performance.now();while(i<need.length&&performance.now()-t0<4){ksBuf(need[i][0],need[i][1]);i++;}if(i<need.length)setTimeout(step,16);};step();};
  E.voice=voice;E.trackBus=trackBus;
  return E;
}
// offline: schedule everything up to T seconds at once (used to measure and to export)
function renderSchedule(E,song,T,only){E.load(song);E.fight=true;let off=0,i=0;const c=E.c;
  while(true){if(i>=c.events.length){i=c.loopIdx;off+=c.loopLen;}const ev=c.events[i];const at=0.05+ev.t+off;if(at>T)break;if(!only||only===ev.tr)E.voice(ev,at);i++;}}

// ================= Blood Katana: the songs =================
// Patterns: one token per step (or per r steps when written [r,'...']). '-' holds, '.' rests, 'a4+e5' is a chord.
// Suffixes: ! accent, , soft, ^ bend or scoop, ~ deep vibrato, < grace from below. Drum lanes: X accent, x hit, o soft, r roll.
// layer:'fight' tracks only play while foes are in the room.
const J=(...a)=>a.join(' '),RP=(s,n)=>Array(n).fill(s).join(' ');

// the leitmotif, in D miyako-bushi (D Eb G A Bb): sixteen-step bars
const THEME=J(
  'a4 - - - - - bb4 - a4 - - - g4 - - -','d5 - - - - - eb5 d5 bb4 - - - a4 - - -','g4 - - - a4 - bb4 - a4 - g4 - eb4 - - -','d4~ - - - - - - - - - - - . . . .',
  'd5 - - - - - eb5 - d5 - - - bb4 - - -','a4 - - - bb4 - a4 - g4 - - - a4 - - -','bb4 - - - a4 - g4 - eb4 - - - g4 - eb4 -','d4~ - - - - - - - - - - - - - - -');
const KOTO_D='d3 a3 d4 eb4 a4 eb4 d4 a3',KOTO_BB='bb2 d3 g3 bb3 d4 bb3 g3 d3',KOTO_G='g2 d3 g3 a3 d4 a3 g3 d3',KOTO_A='a2 eb3 a3 bb3 d4 bb3 a3 eb3';

const SONGS=[
// ----------------------------------------------------------------- 1
{id:'title',title:'Blood Katana',jp:'血刀',where:'Title screen',bpm:66,spb:4,bar:16,key:'D miyako-bushi',scale:'d eb g a bb',amb:'wind',
 mood:'The leitmotif. A lone shakuhachi over koto, the great drum answering each phrase. Slow, proud, a little sad.',
 inst:{sh:{i:'shaku',v:0.42,pan:0.08,rev:0.55,dly:0.12},ko:{i:'koto',v:0.3,pan:-0.25,rev:0.35},hi:{i:'koto',v:0.2,pan:0.35,rev:0.5,dly:0.2},sm:{i:'shami',v:0.16,pan:-0.1,rev:0.3,mono:true},
   sho:{i:'sho',v:0.07,rev:0.7},bi:{i:'biwa',v:0.28,pan:-0.05,rev:0.4,bend:2},od:{i:'odaiko',v:0.55,rev:0.45},rin:{i:'rin',v:0.3,rev:0.75}},
 parts:{
  in:{bars:2,label:'Intro',t:{rin:'X...............................',sho:[16,'d4+a4+d5 a3+d4+a4'],hi:[4,'a5 . d5 . bb5 . a5 .']}},
  a:{bars:8,label:'Theme',t:{sh:THEME,ko:[2,J(KOTO_D,KOTO_BB,KOTO_G,KOTO_D,KOTO_BB,KOTO_D,KOTO_G,KOTO_A)],sho:[16,'d4+a4 bb3+d4 g3+d4 d4+a4 bb3+d4 d4+a4 g3+d4 a3+eb4'],od:'X...............................................................'}},
  b:{bars:8,label:'Theme, the drums answer',t:{sh:THEME,sm:THEME.replace(/([a-g]b?)(\d)/g,(m,n,o)=>n+(o-1)),ko:[2,J(KOTO_D,KOTO_BB,KOTO_G,KOTO_D,KOTO_BB,KOTO_D,KOTO_G,KOTO_A)],
     hi:[8,'a5 d5 bb5 g5 g5 d5 a5 d5 bb5 d6 a5 eb5 g5 bb5 a5 d5'],bi:[8,'d2^ - bb1 - g1 - d2 - bb1 - d2 - g1 a1^ d2 -'],od:'X.......o.......X.......x...x...',rin:'X...............................................................'}},
  c:{bars:4,label:'Koto alone',t:{ko:[2,'d5 - eb5^ - d5 - bb4 - a4 - - - g4 - a4 - bb4 - a4 - g4 - eb4 - d4~ - - - - - . .'],sho:[16,'d4+a4 g3+d4 bb3+eb4 a3+d4'],bi:[16,'d2 g1 bb1 a1^']}}},
 order:['in','a','b','c'],loop:1},
// ----------------------------------------------------------------- 2
{id:'shrine',title:'Shrine of the Broken Blade',jp:'神社',where:'The shrine between runs',bpm:84,spb:2,bar:6,key:'D yō',scale:'d e g a b',amb:'water',
 mood:'Six-eight, warm and a little homesick. The leitmotif turned major. Wind chimes and the hot spring.',
 inst:{ko:{i:'koto',v:0.36,pan:0.1,rev:0.4},ar:{i:'koto',v:0.2,pan:-0.3,rev:0.35},sh:{i:'shaku',v:0.32,pan:0.2,rev:0.55,dly:0.1},bs:{i:'bass',v:0.16},fu:{i:'furin',v:0.5,pan:0.4,rev:0.7},dr:{i:'drip',v:0.35,pan:-0.4,rev:0.6},mo:{i:'mokugyo',v:0.12,rev:0.4}},
 parts:{
  in:{bars:2,label:'Intro',t:{ar:'d3 a3 d4 e4 d4 a3 g2 d3 g3 a3 g3 d3',fu:'x...........',dr:'......x.....'}},
  a:{bars:8,label:'Koto',t:{ko:J('a4 - b4 a4 - g4','d5 - - e5 d5 b4','a4 - - g4 - e4','d4 - - - . .','e4 - g4 a4 - b4','d5 - e5 d5 - b4','a4 - b4 g4 - e4','d4 - - - - .'),
     ar:J('d3 a3 d4 e4 d4 a3','g2 d3 g3 a3 g3 d3','d3 a3 d4 e4 d4 a3','a2 e3 a3 b3 a3 e3','d3 a3 d4 e4 d4 a3','g2 d3 g3 a3 g3 d3','e3 b3 e4 g4 e4 b3','d3 a3 d4 e4 d4 a3'),
     bs:[6,'d2 g2 d2 a2 d2 g2 e2 d2'],fu:'x.......................x.......................',dr:'.........x.................x....................',mo:'x.....'}},
  b:{bars:8,label:'Shakuhachi',t:{sh:J('d5 - - e5 - -','g5 - e5 d5 - -','b4 - d5 e5 - d5','a4 - - - - -','g4 - a4 b4 - d5','e5 - - d5 b4 -','a4 - b4 a4 - g4','d4 - - - - -'),
     ko:[3,'d4 b3 g4 d4 b3 e4 a3 e4 g4 d4 e4 g4 a4 e4 d4 a3'],ar:J('d3 a3 d4 e4 d4 a3','g2 d3 g3 a3 g3 d3','e3 b3 e4 g4 e4 b3','a2 e3 a3 b3 a3 e3','g2 d3 g3 a3 g3 d3','e3 b3 e4 g4 e4 b3','a2 e3 a3 b3 a3 e3','d3 a3 d4 e4 d4 a3'),
     bs:[6,'d2 g2 e2 a2 g2 e2 a2 d2'],fu:'......x.........................x...............',mo:'x.....'}},
  c:{bars:8,label:'Together',t:{ko:J('a5 - b5 a5 - g5','d6 - - e6 d6 b5','a5 - - g5 - e5','d5 - - - . .','e5 - g5 a5 - b5','d6 - e6 d6 - b5','a5 - b5 g5 - e5','d5 - - - - .'),
     sh:J('d5 - - - - -','b4 - - - - -','e5 - - d5 - -','a4 - - - - -','g4 - - - - -','b4 - - - - -','d5 - - b4 - -','a4 - - - - -'),
     ar:J('d3 a3 d4 e4 d4 a3','g2 d3 g3 a3 g3 d3','d3 a3 d4 e4 d4 a3','a2 e3 a3 b3 a3 e3','d3 a3 d4 e4 d4 a3','g2 d3 g3 a3 g3 d3','e3 b3 e4 g4 e4 b3','d3 a3 d4 e4 d4 a3'),
     bs:[6,'d2 g2 d2 a2 d2 g2 e2 d2'],fu:'x.................x.............................',dr:'....x...................x.......................',mo:'x.....'}}},
 order:['in','a','b','c'],loop:1},
// ----------------------------------------------------------------- 3
{id:'dojo',title:'Moonlit Dojo',jp:'道場',where:'Realm 1 · levels 1-1 to 1-10',bpm:104,spb:4,bar:16,key:'D miyako-bushi',scale:'d eb g a bb',amb:'wind',
 mood:'A shamisen riff that never sits still, wooden clappers keeping time. Taiko joins when blades come out.',
 inst:{sm:{i:'shami',v:0.26,pan:-0.15,rev:0.25,mono:true},sh:{i:'shaku',v:0.36,pan:0.12,rev:0.45,dly:0.1},bs:{i:'bass',v:0.26},hy:{i:'hyoshigi',v:0.3,pan:0.3,rev:0.4},
   ta:{i:'taiko',v:0.5,rev:0.3,layer:'fight'},si:{i:'shime',v:0.3,pan:0.25,rev:0.25,layer:'fight'},ka:{i:'kane',v:0.12,pan:-0.3,rev:0.3,layer:'fight'},ko:{i:'koto',v:0.22,pan:-0.35,rev:0.35,layer:'fight'}},
 parts:{
  in:{bars:2,label:'Intro',t:{sm:[2,'d3 d4 a3 d4 eb4 d4 a3 g3 d3 d4 a3 d4 bb3 a3 g3 a3'],hy:'x.......x.......x.......x...x.x.'}},
  a:{bars:8,label:'Prowl',t:{sm:[2,J('d3 d4 a3 d4 eb4 d4 a3 g3','d3 d4 a3 d4 bb3 a3 g3 a3','g2 g3 d3 g3 a3 g3 d3 bb2','a2 a3 eb3 a3 bb3 a3 g3 eb3')],
     sh:[2,J('d5 - - - eb5 d5 bb4 -','a4 - - - - - . .','g4 - a4 bb4 a4 - g4 eb4','d4 - - - - - . .','d5 - - eb5 g5 - eb5 d5','bb4 - - - a4 - g4 -','a4 - bb4 a4 g4 - eb4 g4','a4 - - - - - - -')],
     bs:[4,'d2 - d2 a2 d2 - - - g2 - g2 d3 a2 - a2 -'],hy:'x.......x.......',ta:'X..x..x.X...x...X..x..x.X.x.x.xx',si:'..x...x...x...x.',ka:'x...x...x...x...',ko:[2,'. d4 . a4 . eb5 . d5']}},
  b:{bars:8,label:'Strike',t:{sm:[2,J('d3 d4 a3 d4 eb4 d4 a3 g3','d3 d4 a3 d4 bb3 a3 g3 a3','g2 g3 d3 g3 a3 g3 d3 bb2','a2 a3 eb3 a3 bb3 a3 g3 eb3')],
     sh:[2,J('a5 - - g5 a5 - bb5 a5','g5 - eb5 - d5 - - -','eb5 - d5 - bb4 - a4 -','g4 - a4 - bb4 - - -','a5 - - g5 a5 - d6 -','bb5 - a5 - g5 - eb5 -','d5 - eb5 - g5 - a5 -','d5 - - - - - - -')],
     bs:[2,'d2 . d2 d2 . d2 a2 . d2 . d2 d2 . a2 d3 . g2 . g2 g2 . g2 d3 . a2 . a2 a2 . bb2 a2 .'],hy:'x...x...x...x...',ta:'X..x..x.X...x...X..x..x.X.x.x.xx',si:'..x...x...x.x.x.',ka:'x...x...x...x...',ko:[2,'d4 a4 d5 a4 eb5 a4 d5 a4']}},
  br:{bars:4,label:'Breath',t:{sm:[2,'d3 . . . d3 . . . g2 . . . a2 . a2 .'],hy:'x...............',ta:'X.......x.......X.......x..x.x.r',sh:[4,'d5 - - - - - - - bb4 - a4 - g4 - a4 -']}}},
 order:['in','a','b','br'],loop:1},
// ----------------------------------------------------------------- 4
{id:'bamboo',title:'Whispering Bamboo',jp:'竹林',where:'Realm 2',bpm:96,spb:4,bar:16,key:'E yō',scale:'e f# a b c#',amb:'wind',swing:0.12,
 mood:'Mischief in the grove: a skipping koto, wood blocks and bamboo clappers. Foxes and tanuki laughing somewhere.',
 inst:{ko:{i:'koto',v:0.28,pan:-0.2,rev:0.3,mute:true},sh:{i:'shaku',v:0.34,pan:0.15,rev:0.45,dly:0.15},lo:{i:'koto',v:0.3,oct:-1,mute:true,rev:0.2},mo:{i:'mokugyo',v:0.3,pan:0.3,rev:0.35},kt:{i:'kotsu',v:0.25,pan:-0.35,rev:0.35},
   ta:{i:'taiko',v:0.42,rev:0.3,layer:'fight'},si:{i:'shime',v:0.28,pan:0.2,layer:'fight'},su:{i:'suzu',v:0.25,pan:0.4,rev:0.5,layer:'fight'}},
 parts:{
  in:{bars:2,label:'Intro',t:{ko:[2,'e4 b4 a4 b4 e5 b4 a4 f#4 c#4 a4 f#4 a4 c#5 a4 f#4 e4'],kt:'..x...x...x..x.x'}},
  a:{bars:8,label:'Grove',t:{ko:[2,J('e4 b4 a4 b4 e5 b4 a4 f#4','c#4 a4 f#4 a4 c#5 a4 f#4 e4','f#4 b4 a4 b4 f#5 b4 a4 f#4','e4 b4 a4 b4 e5 b4 c#5 b4')],
     sh:[2,J('b4 - c#5 b4 a4 - f#4 -','e4 - f#4 a4 b4 - - -','c#5 - e5 c#5 b4 - a4 -','b4 - - - - - . .','e5 - - f#5 e5 c#5 b4 -','a4 - b4 c#5 b4 - a4 f#4','e4 - f#4 - a4 - b4 a4','e4 - - - - - . .')],
     lo:[4,'e2 - b2 - a2 - e2 - b2 - f#2 - e2 - b2 -'],mo:'x..x..x.x..x....',kt:'..x...x...x..x.x',ta:'X.....x.X.x.....',si:'....x.......x.x.',su:'x.......x.......'}},
  b:{bars:8,label:'Tricks',t:{ko:[2,J('e4 b4 a4 b4 e5 b4 a4 f#4','c#4 a4 f#4 a4 c#5 a4 f#4 e4','f#4 b4 a4 b4 f#5 b4 a4 f#4','e4 b4 a4 b4 e5 b4 c#5 b4')],
     sh:[2,J('e5 - . e5 f#5 e5 c#5 .','b4 - . . . . . .','a4 - . a4 b4 a4 f#4 .','e4 - . . . . . .','f#4 a4 b4 c#5 e5 - c#5 b4','a4 - b4 - c#5 - e5 -','f#5 - e5 c#5 b4 - a4 -','b4 - - - - - - -')],
     lo:[4,'e2 - b2 - a2 - e2 - b2 - f#2 - e2 - b2 -'],mo:'x..x..x.x..x..x.',kt:'..x...x...x..x.x',ta:'X.....x.X.x...x.',si:'....x.......x.xx',su:'x...x...x...x...'}}},
 order:['in','a','b'],loop:1},
// ----------------------------------------------------------------- 5
{id:'temple',title:'Drowned Temple',jp:'古寺',where:'Realm 3',bpm:60,spb:4,bar:16,key:'A miyako-bushi',scale:'a bb d e f',amb:'water',
 mood:'Underwater bells. A slow shō chord, drops of high koto, a choir somewhere below. The great drum when spirits rise.',
 inst:{sho:{i:'sho',v:0.08,rev:0.8},cr:{i:'crystal',v:0.22,pan:0.3,rev:0.7,dly:0.3},bi:{i:'biwa',v:0.26,pan:-0.2,rev:0.5,bend:1},ch:{i:'choir',v:0.16,rev:0.8,vowel:'oo'},rin:{i:'rin',v:0.32,rev:0.85,f:660},dr:{i:'drip',v:0.3,pan:-0.4,rev:0.7},
   od:{i:'odaiko',v:0.5,rev:0.6,layer:'fight'},bs:{i:'bass',v:0.24,layer:'fight'}},
 parts:{
  in:{bars:2,label:'Intro',t:{sho:[16,'a3+e4+bb4 f3+a3+e4'],rin:'X...............................',dr:'..........x.................x...'}},
  a:{bars:8,label:'Sunken',t:{sho:[16,'a3+e4+bb4 f3+a3+e4 d3+a3+f4 e3+bb3+d4 a3+e4+bb4 f3+a3+e4 d3+a3+f4 e3+a3+e4'],
     cr:[2,J('a5 . . . e5 . . .','. . bb5 . . . a5 .','f5 . . . e5 . d5 .','e5 . . . . . . .','a5 . . . bb5 . a5 .','f5 . . . e5 . . .','d5 . e5 . f5 . e5 .','a4 . . . . . . .')],
     bi:[4,'a2 - - - f2 - - - d2 - - . e2^ - - -'],rin:'X...............................................................',dr:'......x.........x.........x.....',od:'X.......o.......',bs:[4,'a1 . . a1 f1 . . f1 d1 . . d1 e1 . . e1']}},
  b:{bars:8,label:'Voices',t:{sho:[16,'a3+e4+bb4 f3+a3+e4 d3+a3+f4 e3+bb3+d4 a3+e4+bb4 f3+a3+e4 d3+a3+f4 e3+a3+e4'],
     ch:[4,J('e5 - f5 e5','d5 - - -','bb4 - a4 -','e4 - - -','a4 - bb4 d5','e5 - f5 -','e5 - d5 bb4','a4 - - -')],
     cr:[2,'. . . . a5 . . . . . . . e5 . . .'],bi:[4,'a2 - - - f2 - - - d2 - - . e2^ - - -'],rin:'X...............................................................',od:'X.......o.......',bs:[4,'a1 . . a1 f1 . . f1 d1 . . d1 e1 . . e1']}}},
 order:['in','a','b'],loop:1},
// ----------------------------------------------------------------- 6
{id:'hell',title:'Oni Hell',jp:'地獄',where:'Realm 4',bpm:132,spb:4,bar:16,key:'G phrygian pentatonic',scale:'g ab c d eb',amb:'fire',
 mood:'Iron drums and a buzzing biwa riff. A noh flute shrieks over it. Brass and a choir of the damned in the fights.',
 inst:{bi:{i:'biwa',v:0.3,pan:-0.15,rev:0.25,mono:true},bs:{i:'bass',v:0.3},od:{i:'odaiko',v:0.55,rev:0.35},nk:{i:'nokan',v:0.26,pan:0.15,rev:0.5,dly:0.1},
   ta:{i:'taiko',v:0.45,rev:0.25,layer:'fight'},ri:{i:'rim',v:0.3,pan:0.3,layer:'fight'},br:{i:'brass',v:0.16,rev:0.35,layer:'fight'},sm:{i:'shami',v:0.18,pan:0.25,mono:true,layer:'fight'},ch:{i:'choir',v:0.12,rev:0.6,vowel:'ah',layer:'fight'},hn:{i:'horn',v:0.24,rev:0.6}},
 parts:{
  in:{bars:2,label:'Intro',t:{od:'X...............X.......X.......',hn:[16,'g3 ab3']}},
  a:{bars:8,label:'Furnace',t:{bi:[2,'g2 g2 ab2 g2 . g2 d3 c3 g2 g2 ab2 g2 eb3 d3 c3 ab2'],bs:[2,'g1 . g1 . g1 . ab1 . g1 . g1 . eb1 . d1 .'],od:'X.......X..x....',ta:'x.x.X.x.x.x.X.xx',ri:'..x...x...x...x.',
     br:[4,'g3+d4 . . . ab3+eb4 . . . g3+d4 . . g3+d4 c4+g4 - - -']}},
  b:{bars:8,label:'The damned',t:{bi:[2,'g2 g2 ab2 g2 . g2 d3 c3 g2 g2 ab2 g2 eb3 d3 c3 ab2'],bs:[2,'g1 . g1 . g1 . ab1 . g1 . g1 . eb1 . d1 .'],od:'X.......X..x....',ta:'x.x.X.x.x.x.X.xx',ri:'..x...x...x...x.',
     nk:[4,J('g4 - - ab4','g4 - d4 -','eb4 - d4 c4','d4 - - -','g4 - ab4 c5','d5 - c5 ab4','g4 - ab4 g4','d4 - - -')],sm:[4,J('g3 - - ab3','g3 - d3 -','eb3 - d3 c3','d3 - - -','g3 - ab3 c4','d4 - c4 ab3','g3 - ab3 g3','d3 - - -')],
     ch:[16,'g3+d4 ab3+eb4 c4+g4 d4+ab4 g3+d4 ab3+eb4 eb4+g4 d4+ab4'],br:[4,'g3+d4 . . . ab3+eb4 . . . g3+d4 . . g3+d4 c4+g4 - - -']}},
  c:{bars:8,label:'Chains',t:{bs:[4,'g1 - - - g1 - - - ab1 - - - g1 - - -'],ta:'X...x...X..xx...',od:'X...............',ch:[16,'g3+d4 g3+d4 ab3+eb4 ab3+eb4 c4+g4 c4+g4 d4+ab4 d4+ab4'],hn:[16,'g3 . ab3 . c4 . d4 .'],bi:[4,'g2 . . . . . . . ab2 . . . . . . .']}}},
 order:['in','a','b','c'],loop:1},
// ----------------------------------------------------------------- 7
{id:'river',title:'Sanzu River',jp:'三途川',where:'Realm 5',bpm:56,spb:2,bar:6,key:'B♭ minor pentatonic',scale:'bb db eb f ab',amb:'water',
 mood:'The crossing of the dead, in three-four. A biwa rolling like the current, a shakuhachi lament, a choir across the water.',
 inst:{bi:{i:'biwa',v:0.26,pan:-0.2,rev:0.5},sh:{i:'shaku',v:0.38,pan:0.15,rev:0.6,dly:0.15},ch:{i:'choir',v:0.14,rev:0.85,vowel:'oo'},hi:{i:'crystal',v:0.16,pan:0.4,rev:0.75,dly:0.25},rin:{i:'rin',v:0.26,rev:0.85,f:587},
   ta:{i:'taiko',v:0.4,rev:0.45,layer:'fight'},bs:{i:'bass',v:0.24,layer:'fight'}},
 parts:{
  in:{bars:2,label:'Intro',t:{bi:'bb2 f3 bb3 db4 bb3 f3 ab2 eb3 ab3 bb3 ab3 eb3',rin:'X...........'}},
  a:{bars:8,label:'Lament',t:{bi:J('bb2 f3 bb3 db4 bb3 f3','ab2 eb3 ab3 bb3 ab3 eb3','eb2 bb2 eb3 f3 eb3 bb2','bb2 f3 bb3 db4 bb3 f3','bb2 f3 bb3 db4 bb3 f3','f2 db3 f3 ab3 f3 db3','ab2 eb3 ab3 bb3 ab3 eb3','bb2 f3 bb3 db4 bb3 f3'),
     sh:J('f4 - - - db4 eb4','f4 - ab4 - f4 eb4','db4 - - - bb3 -','bb3~ - - - - -','db5 - - - bb4 ab4','f4 - ab4 bb4 - ab4','f4 - eb4 db4 - eb4','bb3~ - - - - -'),
     rin:'X...............................................',ta:'X.x.........',bs:[6,'bb1 ab1 eb1 bb1 bb1 f1 ab1 bb1']}},
  b:{bars:8,label:'The far shore',t:{bi:J('bb2 f3 bb3 db4 bb3 f3','ab2 eb3 ab3 bb3 ab3 eb3','eb2 bb2 eb3 f3 eb3 bb2','bb2 f3 bb3 db4 bb3 f3','bb2 f3 bb3 db4 bb3 f3','f2 db3 f3 ab3 f3 db3','ab2 eb3 ab3 bb3 ab3 eb3','bb2 f3 bb3 db4 bb3 f3'),
     ch:[3,'f4 db4 eb4 - db4 bb3 bb3 - ab4 f4 ab4 bb4 f4 eb4 f4 -'],hi:J('f5 . db5 . . .','eb5 . . . ab5 .','f5 . . . . .','db6 . bb5 . . .','ab5 . f5 . eb5 .','f5 . . . . .','. . . . . .','. . . . . .'),
     rin:'X...............................................',ta:'X.x.........',bs:[6,'bb1 ab1 eb1 bb1 bb1 f1 ab1 bb1']}}},
 order:['in','a','b'],loop:1},
// ----------------------------------------------------------------- 8
{id:'ice',title:'Guren, the Frozen Hell',jp:'紅蓮',where:'Realm 6',bpm:80,spb:4,bar:16,key:'F♯ miyako-bushi',scale:'f# g b c# d',amb:'ice',
 mood:'Glass koto that sounds like falling ice, a cold shō, the shakuhachi breathing frost. Tight high drums in the fights.',
 inst:{cr:{i:'crystal',v:0.24,pan:-0.25,rev:0.6,dly:0.25},sho:{i:'sho',v:0.07,rev:0.85},sh:{i:'shaku',v:0.34,pan:0.15,rev:0.6,dly:0.12},rin:{i:'rin',v:0.22,rev:0.85,f:1480},bs:{i:'bass',v:0.2},
   si:{i:'shime',v:0.3,pan:0.25,layer:'fight'},ta:{i:'taiko',v:0.42,rev:0.4,layer:'fight'},su:{i:'suzu',v:0.22,pan:-0.4,rev:0.6,layer:'fight'}},
 parts:{
  in:{bars:2,label:'Intro',t:{cr:[2,'f#4 c#5 d5 c#5 f#5 c#5 d5 b4 f#4 c#5 d5 c#5 g5 d5 c#5 b4'],rin:'X...............................'}},
  a:{bars:8,label:'Frost',t:{cr:[2,J('f#4 c#5 d5 c#5 f#5 c#5 d5 b4','f#4 c#5 d5 c#5 g5 d5 c#5 b4','g4 d5 b4 d5 g5 d5 b4 g4','f#4 c#5 b4 c#5 f#5 c#5 b4 g4')],
     sh:[2,J('c#5 - - - d5 c#5 b4 -','f#4 - - - - - . .','g4 - b4 - c#5 - d5 c#5','b4 - - - - - . .','f#5 - - - g5 f#5 d5 -','c#5 - - - b4 - g4 -','f#4 - g4 b4 c#5 - b4 g4','f#4 - - - - - - -')],
     sho:[16,'f#3+c#4+g4 f#3+c#4+g4 g3+d4+f#4 b2+f#3+d4'],bs:[8,'f#2 - g2 - b1 - f#2 -'],rin:'X...............................................................',si:'x.x..x.xx.x..x.x',ta:'X.......x..x....',su:'....x.......x...'}},
  b:{bars:8,label:'Red lotus',t:{cr:[2,J('c#6 - - - d6 c#6 b5 -','f#5 - - - - - . .','g5 - b5 - c#6 - d6 c#6','b5 - - - - - . .','f#6 - - - g6 f#6 d6 -','c#6 - - - b5 - g5 -','f#5 - g5 b5 c#6 - b5 g5','f#5 - - - - - - -')],
     sh:[8,'f#5 - c#5 - d5 - b4 - c#5 - g4 - b4 - f#4 -'],sho:[16,'f#3+c#4+g4 f#3+c#4+g4 g3+d4+f#4 b2+f#3+d4'],bs:[8,'f#2 - g2 - b1 - f#2 -'],rin:'X...............................................................',si:'x.x..x.xx.x..x.x',ta:'X.......x..x....',su:'....x.......x...'}}},
 order:['in','a','b'],loop:1},
// ----------------------------------------------------------------- 9
{id:'gakido',title:'Realm of Hungry Ghosts',jp:'餓鬼道',where:'Realm 7',bpm:120,spb:2,bar:7,key:'C miyako-bushi, in seven',scale:'c db f g ab',amb:'drone',
 mood:'Seven-eight, always one step short. Two shamisen a little out of tune with each other, a wood fish, a choir of mouths.',
 inst:{s1:{i:'shami',v:0.22,pan:-0.3,rev:0.3,mono:true},s2:{i:'shami',v:0.18,pan:0.3,rev:0.3,mono:true,oct:0.012},sh:{i:'shaku',v:0.32,pan:0.1,rev:0.6,dly:0.15},mo:{i:'mokugyo',v:0.32,pan:0.2,rev:0.4},
   ch:{i:'choir',v:0.13,rev:0.8,vowel:'ee'},bs:{i:'bass',v:0.24},ta:{i:'taiko',v:0.44,rev:0.35,layer:'fight'},hy:{i:'hyoshigi',v:0.2,pan:-0.2,layer:'fight'}},
 parts:{
  in:{bars:2,label:'Intro',t:{s1:'c3 c3 g3 db3 c3 g3 ab3 c3 c3 g3 db3 f3 db3 c3',mo:'X..x.x.'}},
  a:{bars:8,label:'Hunger',t:{s1:'c3 c3 g3 db3 c3 g3 ab3 c3 c3 g3 db3 f3 db3 c3',s2:'. c3 . db3 . g3 . . c3 . db3 . db3 .',mo:'X..x.x.',bs:[7,'c2 c2 db2 c2'],ch:[7,'c4+db4+g4 c4+db4+g4 db4+f4+ab4 c4+f4+g4'],
     sh:J('g4^ - - ab4 g4 - f4','db4 - - c4 - - -','f4 - g4 ab4 - g4 f4','g4~ - - - - - -','c5^ - - db5 c5 - ab4','g4 - ab4 g4 f4 - db4','c4 - db4 f4 - db4 c4','c4~ - - - - - -'),ta:'X..x.x.X..x.xx',hy:'..x.x.x'}},
  b:{bars:8,label:'Mouths',t:{s1:J('g4 - - ab4 g4 - f4','db4 - - c4 - - -','f4 - g4 ab4 - g4 f4','g4 - - - - - -','c5 - - db5 c5 - ab4','g4 - ab4 g4 f4 - db4','c4 - db4 f4 - db4 c4','c4 - - - - - -'),s2:J('g4 - - ab4 g4 - f4','db4 - - c4 - - -','f4 - g4 ab4 - g4 f4','g4 - - - - - -','c5 - - db5 c5 - ab4','g4 - ab4 g4 f4 - db4','c4 - db4 f4 - db4 c4','c4 - - - - - -'),
     mo:'X..x.x.',bs:[7,'c2 c2 db2 c2'],ch:[7,'c4+db4+g4 db4+f4+ab4 c4+f4+g4 c4+db4+g4'],ta:'X..x.x.X..x.xx',hy:'..x.x.x'}},
  c:{bars:8,label:'Empty bowls',t:{mo:'X......',ch:[14,'c4+db4+g4 db4+f4+ab4 c4+db4+g4 c4+f4+g4'],bs:[14,'c2 db2 c2 c2'],sh:[7,'g4~ - ab4^ f4 db4~ - c4 -'],ta:'X.............'}}},
 order:['in','a','b','c'],loop:1},
// ----------------------------------------------------------------- 10
{id:'ashura',title:'Ashura Battlefield',jp:'修羅道',where:'Realm 8',bpm:144,spb:4,bar:16,key:'D minor pentatonic',scale:'d f g a c',amb:'fire',
 mood:'An endless war. Conch horns calling, war drums in three ranks, a shamisen at full gallop, soldiers shouting.',
 inst:{hn:{i:'horn',v:0.26,rev:0.6},od:{i:'odaiko',v:0.52,rev:0.35},bs:{i:'bass',v:0.28},
   sm:{i:'shami',v:0.22,pan:-0.2,mono:true,layer:'fight'},ta:{i:'taiko',v:0.42,pan:-0.15,layer:'fight'},t2:{i:'taiko',v:0.34,pan:0.25,layer:'fight'},si:{i:'shime',v:0.24,pan:0.3,layer:'fight'},ka:{i:'kane',v:0.12,pan:-0.35,layer:'fight'},
   yo:{i:'shout',v:0.3,rev:0.5,layer:'fight'},nk:{i:'nokan',v:0.24,pan:0.12,rev:0.5,dly:0.08,layer:'fight'},br:{i:'brass',v:0.14,rev:0.4,layer:'fight'}},
 parts:{
  in:{bars:2,label:'Intro',t:{hn:[16,'d4 a3'],od:'X...............X.......X.X.X...'}},
  a:{bars:8,label:'Charge',t:{sm:'d4 d4 a3 d4 c4 d4 a3 g3 d4 d4 a3 d4 f4 d4 c4 a3',bs:[2,'d2 . d2 d2 . d2 c2 . d2 . d2 d2 . f2 g2 a2'],od:'X.......X.......',ta:'X..xX..xX.xxX..x',t2:'..x...x...x.x.x.',si:'x.x.x.x.x.x.x.x.',ka:'x...x...x...x...',
     hn:[4,'d4 - - - . . . . a3 - - - . . . . c4 - - - . . . . d4 - - - . . . .'],yo:[16,'.......X'],br:[8,'d3+a3 - c3+g3 - f3+c4 - d3+a3 -']}},
  b:{bars:8,label:'No retreat',t:{sm:'d4 d4 a3 d4 c4 d4 a3 g3 d4 d4 a3 d4 f4 d4 c4 a3',bs:[2,'d2 . d2 d2 . d2 c2 . d2 . d2 d2 . f2 g2 a2'],od:'X.......X.......',ta:'X..xX..xX.xxX..x',t2:'..x...x...x.x.x.',si:'x.x.x.x.x.x.x.x.',ka:'x...x...x...x...',
     nk:[2,J('d5 - f5 g5 a5 - g5 f5','d5 - - - c5 - a4 -','g4 - a4 c5 d5 - c5 a4','d5 - - - - - . .','f5 - g5 a5 c6 - a5 g5','f5 - d5 - c5 - a4 c5','d5 - c5 a4 g4 - f4 g4','d4 - - - - - - -')],br:[8,'d3+a3 - c3+g3 - f3+c4 - d3+a3 -']}},
  c:{bars:4,label:'War cry',t:{od:'X...X...X...X...',ta:'XxxxXxxxXxxxXrxr',yo:'X...............X...............X.......X.......X...X...X.X.X.X.',hn:[16,'d4 c4 a3 d4'],bs:[4,'d2 - - - c2 - - - a1 - - - d2 - - -']}}},
 order:['in','a','b','c'],loop:1},
// ----------------------------------------------------------------- 11
{id:'peaks',title:'Tengu Peaks',jp:'天狗山',where:'Realm 9',bpm:116,spb:4,bar:16,key:'G yō',scale:'g a c d e',amb:'highwind',
 mood:'Above the clouds. Rolling koto like wind through pines, a flute that climbs and climbs, a shout from the next ridge.',
 inst:{ko:{i:'koto',v:0.22,pan:-0.25,rev:0.4},sh:{i:'shaku',v:0.36,pan:0.12,rev:0.5,dly:0.12},bs:{i:'bass',v:0.22},lo:{i:'koto',v:0.22,oct:-1,pan:0.25,rev:0.3},
   ta:{i:'taiko',v:0.4,rev:0.35,layer:'fight'},si:{i:'shime',v:0.24,pan:0.3,layer:'fight'},yo:{i:'shout',v:0.24,rev:0.7,layer:'fight'},su:{i:'suzu',v:0.2,pan:-0.4,rev:0.6,layer:'fight'}},
 parts:{
  in:{bars:2,label:'Intro',t:{ko:'g3 d4 g4 a4 d5 a4 g4 d4 g3 d4 g4 a4 c5 a4 g4 d4 c3 g3 c4 d4 g4 d4 c4 g3 c3 g3 c4 d4 e4 d4 c4 g3'}},
  a:{bars:8,label:'Ridge',t:{ko:J('g3 d4 g4 a4 d5 a4 g4 d4 g3 d4 g4 a4 c5 a4 g4 d4','c3 g3 c4 d4 g4 d4 c4 g3 c3 g3 c4 d4 e4 d4 c4 g3','g3 d4 g4 a4 d5 a4 g4 d4 g3 d4 g4 a4 c5 a4 g4 d4','d3 a3 d4 e4 a4 e4 d4 a3 d3 a3 d4 e4 g4 e4 d4 a3',
       'g3 d4 g4 a4 d5 a4 g4 d4 g3 d4 g4 a4 c5 a4 g4 d4','c3 g3 c4 d4 g4 d4 c4 g3 c3 g3 c4 d4 e4 d4 c4 g3','a2 e3 a3 c4 e4 c4 a3 e3 a2 e3 a3 c4 d4 c4 a3 e3','d3 a3 d4 e4 a4 e4 d4 a3 d3 a3 d4 e4 g4 e4 d4 a3'),
     sh:[2,J('d5 - - e5 g5 - e5 d5','c5 - - - a4 - g4 -','d5 - e5 - g5 - a5 g5','a5 - - - - - . .','g5 - - a5 g5 e5 d5 -','e5 - d5 c5 a4 - c5 -','d5 - c5 a4 g4 - a4 c5','d5 - - - - - . .')],
     bs:[8,'g2 - c2 - g2 - d2 - g2 - c2 - a1 - d2 -'],lo:[4,'g3 . d3 . c3 . g3 . g3 . d3 . d3 . a3 .'],ta:'X.....x.X...x...',si:'....x.......x..x',su:'x.......x.......',yo:[16,'X.......']}},
  b:{bars:8,label:'Above the clouds',t:{ko:J('g3 d4 g4 a4 d5 a4 g4 d4 g3 d4 g4 a4 c5 a4 g4 d4','c3 g3 c4 d4 g4 d4 c4 g3 c3 g3 c4 d4 e4 d4 c4 g3','a2 e3 a3 c4 e4 c4 a3 e3 a2 e3 a3 c4 d4 c4 a3 e3','d3 a3 d4 e4 a4 e4 d4 a3 d3 a3 d4 e4 g4 e4 d4 a3',
       'g3 d4 g4 a4 d5 a4 g4 d4 g3 d4 g4 a4 c5 a4 g4 d4','c3 g3 c4 d4 g4 d4 c4 g3 c3 g3 c4 d4 e4 d4 c4 g3','d3 a3 d4 e4 a4 e4 d4 a3 d3 a3 d4 e4 g4 e4 d4 a3','g3 d4 g4 a4 d5 a4 g4 d4 g3 d4 g4 a4 c5 a4 g4 d4'),
     sh:[2,J('g5 - - - a5 - g5 e5','g5 - - - - - . .','e5 - g5 a5 c6 - a5 g5','a5 - - - - - . .','d6 - - c6 a5 - g5 -','e5 - g5 - a5 - c6 -','d6 - c6 a5 g5 - e5 d5','g5 - - - - - - -')],
     bs:[8,'g2 - c2 - a1 - d2 - g2 - c2 - d2 - g2 -'],lo:[4,'g3 . d3 . c3 . g3 . a3 . e3 . d3 . a3 .'],ta:'X.....x.X...x.x.',si:'....x.......x..x',su:'x...x...x...x...',yo:[16,'X.......']}}},
 order:['in','a','b'],loop:1},
// ----------------------------------------------------------------- 12
{id:'castle',title:'The Usurper\'s Castle',jp:'天守閣',where:'Realm 10',bpm:120,spb:4,bar:16,key:'E miyako-bushi',scale:'e f a b c',amb:'drone',
 mood:'Court music turned to war. Gagaku shō chords and a high dragon flute, then the whole garrison with drums, brass and choir.',
 inst:{sho:{i:'sho',v:0.08,rev:0.7},nk:{i:'nokan',v:0.26,pan:0.1,rev:0.5,dly:0.1},ko:{i:'koto',v:0.22,pan:-0.3,rev:0.35},ka:{i:'kane',v:0.12,pan:0.3,rev:0.4},bs:{i:'bass',v:0.24},
   sm:{i:'shami',v:0.22,pan:-0.15,mono:true,layer:'fight'},ta:{i:'taiko',v:0.44,layer:'fight'},od:{i:'odaiko',v:0.5,rev:0.4,layer:'fight'},br:{i:'brass',v:0.15,rev:0.4,layer:'fight'},ch:{i:'choir',v:0.13,rev:0.7,vowel:'ah',layer:'fight'}},
 parts:{
  in:{bars:2,label:'Intro',t:{sho:[16,'e4+a4+b4 f4+a4+c5'],ka:'x...........................x.x.'}},
  a:{bars:8,label:'The court',t:{sho:[16,'e4+a4+b4 f4+a4+c5 a3+e4+b4 e4+b4+c5 e4+a4+b4 f4+a4+c5 a3+e4+b4 e4+b4'],
     nk:[2,J('e5 - - f5 e5 - c5 -','b4 - - - a4 - - -','c5 - b4 a4 f4 - a4 -','b4 - - - - - . .','e5 - - f5 a5 - f5 e5','c5 - - - b4 - a4 -','f4 - a4 b4 c5 - b4 a4','e4 - - - - - - -')],
     ko:[2,'e3 b3 e4 f4 b4 f4 e4 b3'],bs:[4,'e2 - e2 b2 f2 - c3 - a2 - e2 - b2 - - -'],ka:'x...x...x...x...',
     sm:[2,'e3 e4 b3 e4 f4 e4 b3 a3 e3 e4 b3 e4 c4 b3 a3 b3'],ta:'X...x.x.X..x.x..',od:'X...............',br:[8,'e3+b3 - f3+c4 - a3+e4 - e3+b3 -'],ch:[16,'e4+b4 f4+c5 a3+e4 e4+b4']}},
  b:{bars:8,label:'The garrison',t:{sm:[2,'e3 e4 b3 e4 f4 e4 b3 a3 e3 e4 b3 e4 c4 b3 a3 b3'],
     nk:[2,J('e5 - - f5 e5 - c5 -','b4 - - - a4 - - -','c5 - b4 a4 f4 - a4 -','b4 - - - - - . .','e6 - - f6 e6 - c6 -','b5 - - - a5 - b5 -','c6 - b5 a5 f5 - a5 b5','e5 - - - - - - -')],
     ko:[2,'e3 b3 e4 f4 b4 f4 e4 b3'],bs:[2,'e2 . e2 e2 . e2 b2 . f2 . f2 f2 . c3 a2 . a2 . a2 a2 . e2 a2 . b2 . b2 b2 . b2 b2 .'],ka:'x...x...x...x...',ta:'X...x.x.X..x.x.x',od:'X.......X.......',
     br:[8,'e3+b3 - f3+c4 - a3+e4 - e3+b3 -'],ch:[16,'e4+b4 f4+c5 a3+e4 e4+b4'],sho:[16,'e4+a4+b4 f4+a4+c5 a3+e4+b4 e4+b4+c5']}}},
 order:['in','a','b'],loop:1},
// ----------------------------------------------------------------- 13
{id:'lord',title:'A Lord Stands',jp:'主',where:'Every lord fight',bpm:152,spb:4,bar:16,key:'A miyako-bushi',scale:'a bb d e f',amb:'drone',
 mood:'The boss theme. A sixteenth-note shamisen engine, the great drum on the downbeat, brass and a choir on every hit.',
 inst:{sm:{i:'shami',v:0.24,pan:-0.2,mono:true,rev:0.2},s2:{i:'shami',v:0.16,pan:0.25,mono:true,rev:0.2},od:{i:'odaiko',v:0.55,rev:0.35},ta:{i:'taiko',v:0.42},ri:{i:'rim',v:0.28,pan:0.3},bs:{i:'bass',v:0.28},
   br:{i:'brass',v:0.17,rev:0.35},ch:{i:'choir',v:0.13,rev:0.6,vowel:'ah'},nk:{i:'nokan',v:0.26,pan:0.1,rev:0.5,dly:0.08},hn:{i:'horn',v:0.24,rev:0.6}},
 parts:{
  in:{bars:2,label:'Intro',t:{sm:'a3 a3 e4 a3 f4 a3 e4 a3 bb3 a3 e4 a3 f4 e4 d4 bb3',od:'X.......X.......X...X...X.X.XXXX',hn:[16,'a3 bb3']}},
  a:{bars:8,label:'Clash',t:{sm:'a3 a3 e4 a3 f4 a3 e4 a3 bb3 a3 e4 a3 f4 e4 d4 bb3',s2:[2,'. e4 . e4 . f4 . e4'],od:'X.......X.....x.',ta:'x.xxX.x.x.xxX.xr',ri:'..x...x...x...x.',bs:[2,'a1 a1 a1 a1 bb1 bb1 a1 a1 f1 f1 f1 f1 e1 e1 e1 e1'],
     br:[4,'a3+e4 . . a3+e4 bb3+f4 - . . f3+d4 . . f3+d4 e3+bb3 - - -'],ch:[8,'a4+e5 - . . bb4+f5 - . . f4+d5 - . . e4+bb4 - - -']}},
  b:{bars:8,label:'Duel',t:{sm:'a3 a3 e4 a3 f4 a3 e4 a3 bb3 a3 e4 a3 f4 e4 d4 bb3',od:'X.......X.....x.',ta:'x.xxX.x.x.xxX.xr',ri:'..x...x...x...x.',bs:[2,'a1 a1 a1 a1 bb1 bb1 a1 a1 f1 f1 f1 f1 e1 e1 e1 e1'],
     nk:[2,J('a5 - - - bb5 a5 f5 e5','d5 - - - e5 - f5 -','e5 - - - d5 bb4 a4 -','bb4 - a4 - - - . .','a5 - - bb5 a5 - f5 -','e5 - f5 - d5 - bb4 -','a4 - bb4 d5 e5 - f5 e5','a5 - - - - - - -')],
     br:[4,'a3+e4 . . a3+e4 bb3+f4 - . . f3+d4 . . f3+d4 e3+bb3 - - -']}},
  c:{bars:4,label:'Breath before the last cut',t:{od:'X...............',ch:[16,'a3+e4+bb4 f3+d4+a4 d3+a3+f4 e3+bb3+e4'],hn:[16,'a3 . f3 e3'],ta:'................x.x.x.x.xxxxXXXX'}}},
 order:['in','a','b','c'],loop:1},
// ----------------------------------------------------------------- 14
{id:'kuroda',title:'Kuroda Nobutsuna',jp:'黒田',where:'The Usurper · and the prologue\'s last fight',bpm:138,spb:4,bar:16,key:'D miyako-bushi',scale:'d eb g a bb',amb:'fire',
 mood:'The leitmotif, stolen. Your own theme played back at you in brass and choir, over a buzzing biwa and the great drum.',
 inst:{bi:{i:'biwa',v:0.3,pan:-0.15,mono:true,rev:0.25},bs:{i:'bass',v:0.28},od:{i:'odaiko',v:0.56,rev:0.35},ta:{i:'taiko',v:0.42},ri:{i:'rim',v:0.26,pan:0.3},ka:{i:'kane',v:0.1,pan:-0.3},
   br:{i:'brass',v:0.2,rev:0.4},ch:{i:'choir',v:0.15,rev:0.7,vowel:'ah'},sh:{i:'shaku',v:0.38,rev:0.7,dly:0.15},rin:{i:'rin',v:0.3,rev:0.8}},
 parts:{
  in:{bars:2,label:'Intro',t:{od:'X...............X.......X...X...',ch:[16,'d4+a4 a3+eb4+bb4'],bi:[4,'d2^ - - - eb2 - d2 -']}},
  a:{bars:8,label:'The Usurper',t:{bi:[2,'d2 d2 eb2 d2 . d2 a2 g2 d2 d2 eb2 d2 bb2 a2 g2 eb2'],bs:[2,'d1 . d1 d1 . d1 . d1'],od:'X.......X..X....',ta:'x.x.X.x.x.xxX.x.',ri:'....x.......x...',ka:'x...x...x...x...',
     ch:[16,'d4+a4 bb3+d4+g4 g3+d4+a4 a3+eb4+bb4 d4+a4 bb3+d4+g4 g3+d4+a4 a3+eb4+bb4']}},
  b:{bars:8,label:'Your theme, in his hands',t:{bi:[2,'d2 d2 eb2 d2 . d2 a2 g2 d2 d2 eb2 d2 bb2 a2 g2 eb2'],bs:[2,'d1 . d1 d1 . d1 . d1'],od:'X.......X..X....',ta:'x.x.X.x.x.xxX.x.',ri:'....x.......x...',
     br:[2,THEME.split(' ').slice(0,64).join(' ').replace(/([a-g]b?)(\d)/g,(m,n,o)=>n+(o-1))],ch:[2,THEME.split(' ').slice(0,64).join(' ')]}},
  c:{bars:4,label:'Kneel',t:{sh:THEME.split(' ').slice(0,64).join(' '),rin:'X...............................................................',bs:[16,'d1 bb1 g1 a1'],od:'X...............................................X.......X...X.X.'}}},
 order:['in','a','b','c'],loop:1},
];

return{createEngine,compileSong,SONGS};})();

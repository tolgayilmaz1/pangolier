// ═══════════════════════════════════════════════════
// PANGOLIER PRODUCTION AUDIO ENGINE — FIXED
// ana_menu.ogg -> ana menü
// bolumler.ogg -> oyun içi, loop, her dünya/bölüm farklı noktadan
// ara_dunya_harita.ogg -> harita / bölüm geçiş ekranları
// ═══════════════════════════════════════════════════
(()=>{
  const AUDIO_DIR='assets/audio/';
  let unlocked=false;
  let currentMusic=null;
  let musicKind='none';
  let musicWorld=0;
  const musicVol={menu:.45,level:.38,map:.55};
  const tracks={
    menu:new Audio(AUDIO_DIR+'ana_menu.ogg'),
    level:new Audio(AUDIO_DIR+'bolumler.ogg'),
    map:new Audio(AUDIO_DIR+'ara_dunya_harita.ogg')
  };
  Object.values(tracks).forEach(a=>{a.loop=true;a.preload='auto';a.volume=.4;});

  function fadeOut(a,ms=350){
    if(!a)return;
    const start=a.volume||0, t0=performance.now();
    function step(t){
      const p=Math.min(1,(t-t0)/ms);
      a.volume=start*(1-p);
      if(p<1)requestAnimationFrame(step);
      else{try{a.pause();}catch{} a.volume=start;}
    }
    requestAnimationFrame(step);
  }

  function safePlay(a){
    if(!a)return;
    try{
      a.muted=false;
      const p=a.play();
      if(p&&p.catch)p.catch(()=>{});
    }catch{}
  }

  function switchMusic(kind,offset,opts={}){
    const next=tracks[kind];
    if(!next)return;
    const force=!!opts.force;
    // Aynı müzik zaten çalıyorsa yeniden başa sarma; sadece devam ettir.
    // Böylece dünya haritası -> araç/uçak animasyonunda müzik kopmaz.
    if(currentMusic===next&&!next.paused&&!force){
      next.muted=false;
      next.volume=musicVol[kind]??.4;
      safePlay(next);
      return;
    }
    const old=currentMusic;
    currentMusic=next;
    musicKind=kind;
    next.volume=0;
    next.muted=false;
    try{
      const dur=Number.isFinite(next.duration)?next.duration:0;
      if(typeof offset==='number'&&Number.isFinite(offset)&&dur>1){
        next.currentTime=Math.min(Math.max(0,offset),Math.max(0,dur-1));
      }else if(kind!=='level'&&force){
        next.currentTime=0;
      }
    }catch{}
    safePlay(next);
    const target=musicVol[kind]??.4, t0=performance.now();
    function step(t){
      if(currentMusic!==next)return;
      const p=Math.min(1,(t-t0)/420);
      next.volume=target*p;
      if(p<1)requestAnimationFrame(step);
    }
    requestAnimationFrame(step);
    if(old&&old!==next)fadeOut(old,180);
  }

  function levelOffset(worldIndex=0){
    const a=tracks.level;
    const dur=(Number.isFinite(a.duration)&&a.duration>8)?a.duration:60;
    return ((worldIndex*17.31)+(Date.now()%29000)/1000)%Math.max(8,dur-3);
  }

  // Mobil/tarayıcı autoplay kilidini açar. ÖNEMLİ: çalan müziği artık pause etmiyor.
  window.resumeAC=function(){
    if(unlocked){
      if(currentMusic&&currentMusic.paused)safePlay(currentMusic);
      return;
    }
    unlocked=true;
    Object.values(tracks).forEach(a=>{try{a.load();}catch{}});
    if(currentMusic)safePlay(currentMusic);
  };

  window.startMenuMusic=function(){switchMusic('menu',0,{force:false})};
  window.startBGM=function(worldIndex=0){musicWorld=worldIndex;switchMusic('level',levelOffset(worldIndex),{force:true});};
  window.setBGMWorld=function(worldIndex=0){musicWorld=worldIndex;};

  // Sadece oyun içi müziği durdurur. Harita müziğini yanlışlıkla kesmez.
  window.stopBGM=function(){
    if(musicKind==='level'&&currentMusic){fadeOut(currentMusic,300);currentMusic=null;musicKind='none';}
  };
  window.stopAllMusic=function(){
    if(currentMusic)fadeOut(currentMusic,300);
    currentMusic=null;musicKind='none';
  };
  window.playMapMusic=function(){switchMusic('map',0,{force:false})};
  window.forceMapMusic=function(){switchMusic('map',0,{force:true})};
  window.stopMapMusic=function(){if(musicKind==='map'&&currentMusic){fadeOut(currentMusic,220);currentMusic=null;musicKind='none';}};

  let ac=null;
  function ctx(){try{ac=ac||new (window.AudioContext||window.webkitAudioContext)();if(ac.state==='suspended')ac.resume();return ac;}catch{return null;}}
  function tone(freq=440,dur=.08,type='sine',gain=.05,slide=0){
    const c=ctx(); if(!c)return;
    const o=c.createOscillator(), g=c.createGain();
    o.type=type; o.frequency.setValueAtTime(freq,c.currentTime);
    if(slide)o.frequency.exponentialRampToValueAtTime(Math.max(30,freq+slide),c.currentTime+dur);
    g.gain.setValueAtTime(gain,c.currentTime);
    g.gain.exponentialRampToValueAtTime(.0001,c.currentTime+dur);
    o.connect(g);g.connect(c.destination);o.start();o.stop(c.currentTime+dur+.02);
  }
  function noise(dur=.08,gain=.04){
    const c=ctx(); if(!c)return;
    const len=Math.floor(c.sampleRate*dur), b=c.createBuffer(1,len,c.sampleRate), d=b.getChannelData(0);
    for(let i=0;i<len;i++)d[i]=(Math.random()*2-1)*(1-i/len);
    const s=c.createBufferSource(), g=c.createGain(); s.buffer=b; g.gain.value=gain; s.connect(g); g.connect(c.destination); s.start();
  }

  window.setMusicVolume=function(v){
    const n=Math.max(0,Math.min(1,Number(v)));
    musicVol.menu=n*.60; musicVol.level=n*.50; musicVol.map=n*.65;
    if(currentMusic)currentMusic.volume=musicVol[musicKind]??n;
    try{localStorage.setItem('pangMusicVol',String(n));}catch{}
  };
  window.getMusicVolume=function(){try{return Number(localStorage.getItem('pangMusicVol')||'0.8')}catch{return .8}};
  setTimeout(()=>window.setMusicVolume(window.getMusicVolume()),0);

  window.SFX={
    pop:(sz=1)=>{tone(520+sz*90,.06,'triangle',.045,260);noise(.055,.035)},
    combo:(n=2)=>{tone(600+n*80,.07,'square',.035,180);setTimeout(()=>tone(820+n*60,.08,'triangle',.03,120),45)},
    bonus:()=>{tone(720,.07,'sine',.035,180);setTimeout(()=>tone(980,.09,'sine',.035,220),60)},
    hit:()=>{tone(110,.12,'sawtooth',.06,-55);noise(.12,.06)},
    jump:()=>tone(360,.08,'triangle',.035,160),
    land:()=>noise(.045,.035),
    step:()=>noise(.025,.012),
    bounce:(sz=1)=>tone(170+sz*55,.055,'sine',.03,80),
    clang:()=>{tone(410,.09,'square',.035,-120);noise(.06,.025)},
    freeze:()=>tone(900,.16,'sine',.04,-500),
    hook:()=>tone(300,.10,'square',.035,190),
    bomb:()=>{tone(80,.20,'sawtooth',.07,-35);noise(.22,.08)},
    die:()=>{tone(240,.22,'sawtooth',.05,-150);setTimeout(()=>tone(120,.25,'sawtooth',.05,-60),170)},
    levelup:()=>{[520,660,780,1040].forEach((f,i)=>setTimeout(()=>tone(f,.10,'triangle',.04,90),i*75))},
    fire:()=>{tone(620,.04,'square',.018,-120);noise(.022,.010)},
    achievement:()=>{[660,880,1100].forEach((f,i)=>setTimeout(()=>tone(f,.11,'sine',.04,90),i*80))}
  };
  ['pointerdown','touchstart','keydown','click'].forEach(ev=>window.addEventListener(ev,()=>resumeAC(),{once:true,passive:true}));
})();

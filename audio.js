// ═══════════════════════════════════════════════════
// PANGOLIER AUDIO ENGINE — MOBILE SAFE FIX
// ana_menu.ogg -> ana menü
// bolumler.ogg -> oyun içi, loop, her dünya/bölüm farklı noktadan
// ara_dunya_harita.ogg -> harita / bölüm geçiş ekranları
// ═══════════════════════════════════════════════════
(()=>{
  const AUDIO_DIR='assets/audio/';
  let unlocked=false;
  let currentMusic=null;
  let musicKind='none';
  let wantedKind='none';
  let musicWorld=0;
  let masterVol=Number(localStorage.getItem('pangMusicVol')||'0.8');
  if(!Number.isFinite(masterVol)) masterVol=.8;

  const baseVol={menu:.60,level:.50,map:.65};
  const tracks={
    menu:new Audio(AUDIO_DIR+'ana_menu.ogg'),
    level:new Audio(AUDIO_DIR+'bolumler.ogg'),
    map:new Audio(AUDIO_DIR+'ara_dunya_harita.ogg')
  };

  Object.keys(tracks).forEach(k=>{
    const a=tracks[k];
    a.loop=true;
    a.preload='auto';
    a.playsInline=true;
    a.setAttribute('playsinline','');
    a.volume=(baseVol[k]||.5)*masterVol;
  });

  function targetVol(kind){return (baseVol[kind]||.5)*masterVol;}

  function safePlay(a){
    if(!a)return;
    try{
      a.muted=false;
      const p=a.play();
      if(p&&p.catch)p.catch(()=>{});
    }catch(e){}
  }

  function fadeOut(a,ms=180){
    if(!a)return;
    const start=a.volume||0, t0=performance.now();
    function step(t){
      const p=Math.min(1,(t-t0)/ms);
      a.volume=start*(1-p);
      if(p<1)requestAnimationFrame(step);
      else{try{a.pause();}catch(e){} a.volume=start;}
    }
    requestAnimationFrame(step);
  }

  function pauseOthers(kind){
    Object.keys(tracks).forEach(k=>{
      if(k!==kind){try{tracks[k].pause();}catch(e){}}
    });
  }

  function levelOffset(worldIndex=0){
    const a=tracks.level;
    const dur=(Number.isFinite(a.duration)&&a.duration>8)?a.duration:60;
    return ((Number(worldIndex||0)*17.31)+((Date.now()%29000)/1000))%Math.max(8,dur-3);
  }

  function switchMusic(kind,offset,opts={}){
    const next=tracks[kind];
    if(!next)return;
    wantedKind=kind;

    const force=!!opts.force;
    if(currentMusic===next&&!next.paused&&!force){
      next.volume=targetVol(kind);
      safePlay(next);
      return;
    }

    const old=currentMusic;
    currentMusic=next;
    musicKind=kind;
    pauseOthers(kind);

    try{
      const dur=Number.isFinite(next.duration)?next.duration:0;
      if(typeof offset==='number'&&Number.isFinite(offset)&&dur>1){
        next.currentTime=Math.min(Math.max(0,offset),Math.max(0,dur-1));
      }else if(force&&(kind==='menu'||kind==='map')){
        next.currentTime=0;
      }
    }catch(e){}

    next.volume=targetVol(kind);
    safePlay(next);
    if(old&&old!==next)fadeOut(old,120);
  }

  // Mobilde gerçek unlock: kullanıcı dokunuşunda kısa muted play/pause yapar.
  function hardUnlock(){
    if(unlocked)return;
    unlocked=true;
    Object.keys(tracks).forEach(k=>{
      const a=tracks[k];
      try{a.load();}catch(e){}
      try{
        const oldMuted=a.muted, oldVol=a.volume;
        a.muted=true;
        a.volume=0;
        const p=a.play();
        if(p&&p.then){
          p.then(()=>{
            try{a.pause(); if(k!=='level')a.currentTime=0;}catch(e){}
            a.muted=oldMuted;
            a.volume=oldVol;
          }).catch(()=>{a.muted=oldMuted;a.volume=oldVol;});
        }else{
          try{a.pause(); if(k!=='level')a.currentTime=0;}catch(e){}
          a.muted=oldMuted;
          a.volume=oldVol;
        }
      }catch(e){}
    });
  }

  window.resumeAC=function(){
    hardUnlock();
    if(currentMusic){
      currentMusic.volume=targetVol(musicKind);
      safePlay(currentMusic);
    }
  };

  window.startMenuMusic=function(){window.resumeAC();switchMusic('menu',0,{force:false});};
  window.playMapMusic=function(){window.resumeAC();switchMusic('map',0,{force:false});};
  window.forceMapMusic=function(){window.resumeAC();switchMusic('map',0,{force:true});};
  window.setBGMWorld=function(worldIndex=0){musicWorld=Number(worldIndex||0);};
  window.startBGM=function(worldIndex=0){window.resumeAC();musicWorld=Number(worldIndex||0);switchMusic('level',levelOffset(musicWorld),{force:true});};

  window.stopBGM=function(){
    if(musicKind==='level'&&currentMusic){fadeOut(currentMusic,180);currentMusic=null;musicKind='none';}
  };
  window.stopMapMusic=function(){
    if(musicKind==='map'&&currentMusic){fadeOut(currentMusic,160);currentMusic=null;musicKind='none';}
  };
  window.stopAllMusic=function(){
    if(currentMusic)fadeOut(currentMusic,180);
    currentMusic=null;musicKind='none';wantedKind='none';
  };

  window.setMusicVolume=function(v){
    const n=Math.max(0,Math.min(1,Number(v)));
    masterVol=n;
    try{localStorage.setItem('pangMusicVol',String(n));}catch(e){}
    Object.keys(tracks).forEach(k=>{tracks[k].volume=targetVol(k);});
  };
  window.getMusicVolume=function(){return masterVol;};

  // State'e göre müziği toparla. Bu sadece audio tarafı; ekran/controller'a dokunmaz.
  window.__pangAudioSync=function(){
    try{
      const visible=id=>{const el=document.getElementById(id);return !!el&&el.style.display!=='none'&&getComputedStyle(el).display!=='none';};
      if(visible('mapOv')||visible('trans')){if(wantedKind!=='map'||!currentMusic||currentMusic.paused)window.playMapMusic();return;}
      const ov=document.getElementById('ov');
      if(ov&&ov.style.display!=='none'&&getComputedStyle(ov).display!=='none'){
        if(wantedKind!=='menu'||!currentMusic||currentMusic.paused)window.startMenuMusic();return;
      }
      if(typeof running!=='undefined'&&running){
        if(wantedKind!=='level'||!currentMusic||currentMusic.paused)window.startBGM(musicWorld);return;
      }
    }catch(e){}
  };

  ['pointerdown','touchstart','click','keydown'].forEach(ev=>{
    document.addEventListener(ev,()=>{window.resumeAC();setTimeout(()=>window.__pangAudioSync(),0);},{passive:true});
  });
  window.addEventListener('orientationchange',()=>[120,450,900,1600].forEach(ms=>setTimeout(()=>window.__pangAudioSync(),ms)),{passive:true});
  window.addEventListener('resize',()=>setTimeout(()=>window.__pangAudioSync(),180),{passive:true});
  if(window.visualViewport)window.visualViewport.addEventListener('resize',()=>setTimeout(()=>window.__pangAudioSync(),180),{passive:true});
  setInterval(()=>{if(unlocked)window.__pangAudioSync();},1000);
  setTimeout(()=>{try{if(document.getElementById('ov'))window.startMenuMusic();}catch(e){}},350);

  // SFX layer
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
})();

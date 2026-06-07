// ═══════════════════════════════════════════════════
// CANVAS SETUP
// ═══════════════════════════════════════════════════
const C=document.getElementById('c'),ctx=C.getContext('2d');
const GW=640,GH=480; C.width=GW; C.height=GH;
const FLOOR=GH-46, CEIL=36, TAU=Math.PI*2;
const G_PLAYER=0.38;   // tuned jump gravity: lower, tighter platform jumps
const G_BALLOON=0.065;  // original dreamy balloon float

function resize(){
  const isTouch=('ontouchstart' in window)||navigator.maxTouchPoints>0;
  const vv=window.visualViewport;
  const vw=Math.round(vv?.width || window.innerWidth || document.documentElement.clientWidth || 640);
  const vh=Math.round(vv?.height || window.innerHeight || document.documentElement.clientHeight || 480);
  document.documentElement.style.setProperty('--app-height', vh+'px');

  const mctrl=document.getElementById('mctrl');
  const ctrlVisible = !!(isTouch && mctrl && getComputedStyle(mctrl).display !== 'none');
  const portrait = vh >= vw;

  // Mobilde oyun küçük kalmasın:
  // Portrait: canvas ekranın genişliğini ve joystick dışındaki tüm yüksekliği doldurur.
  // Landscape: canvas tüm ekranı doldurur, kontroller oyun üstünde kalır.
  let ctrlH = 0;
  let gameW = vw;
  let gameH = vh;

  if(ctrlVisible && portrait){
    ctrlH = Math.min(190, Math.max(145, Math.round(vh*0.22)));
    gameH = Math.max(360, vh - ctrlH - Math.round((window.navigator.standalone?0:0)));
  } else if(ctrlVisible && !portrait){
    ctrlH = 0;
    gameH = vh;
  } else {
    // Menü / harita / geçiş ekranlarında kontrol alanı ayırma yok.
    ctrlH = 0;
    gameH = vh;
  }

  // Menüde 4:3 oranını koru; oyun sırasında mobilde alanı doldur.
  let cw, ch;
  if(ctrlVisible && isTouch){
    cw = vw;
    ch = Math.max(260, Math.min(gameH, vh));
  } else {
    const s=Math.min(vw/GW, vh/GH);
    cw=Math.max(260, Math.round(GW*s));
    ch=Math.max(195, Math.round(GH*s));
  }

  C.style.width=cw+'px';
  C.style.height=ch+'px';
  C.style.maxWidth='100vw';
  C.style.maxHeight=gameH+'px';
  C.style.alignSelf='center';

  const gc=document.getElementById('gc');
  if(gc){
    gc.style.position='fixed';
    gc.style.left='0';
    gc.style.top='0';
    gc.style.width='100vw';
    gc.style.height=vh+'px';
    gc.style.minHeight=vh+'px';
    gc.style.overflow='hidden';
    gc.style.background='#000';
    gc.style.alignItems='center';
    gc.style.justifyContent='flex-start';
  }

  if(mctrl){
    mctrl.style.display = ctrlVisible ? 'block' : mctrl.style.display;
    mctrl.style.height=(portrait ? ctrlH : vh)+'px';
    mctrl.style.top=ctrlVisible ? (portrait ? ch+'px' : '0px') : '0px';
    mctrl.style.bottom='auto';
    mctrl.style.left='0';
    mctrl.style.right='0';
    mctrl.style.width='100vw';
    mctrl.style.position='absolute';
  }

  // Joystick canvas biraz büyüsün ama alt alanı taşırmasın.
  const joy=document.getElementById('joyCanvas');
  if(joy){
    const js = ctrlVisible && portrait ? Math.min(150, Math.max(118, ctrlH-22)) : Math.min(150, Math.max(112, Math.round(vh*0.22)));
    joy.style.width=js+'px';
    joy.style.height=js+'px';
    joy.style.left='10px';
    joy.style.bottom='8px';
  }

  ['btnUp','btnUpD'].forEach(id=>{const b=document.getElementById(id); if(b){
    const sz = ctrlVisible && portrait ? Math.min(58, Math.max(50, Math.round(ctrlH*0.34))) : 64;
    b.style.width=sz+'px'; b.style.height=sz+'px'; b.style.fontSize=Math.round(sz*0.45)+'px';
  }});
  ['btnFire','btnFireD'].forEach(id=>{const b=document.getElementById(id); if(b){
    const sz = ctrlVisible && portrait ? Math.min(72, Math.max(62, Math.round(ctrlH*0.43))) : 80;
    b.style.width=sz+'px'; b.style.height=sz+'px'; b.style.fontSize=Math.round(sz*0.40)+'px';
  }});

  // Overlay'ler her zaman tüm görünen ekranı kaplasın.
  ['ov','charSelectOv','ctrlSelectOv','mapOv','trans'].forEach(id=>{
    const el=document.getElementById(id);
    if(el){
      el.style.width='100vw';
      el.style.height=vh+'px';
      el.style.maxHeight=vh+'px';
    }
  });
}
resize();
addEventListener('resize',resize);
// Android'de adres çubuğu kaybolunca tekrar hesapla
addEventListener('orientationchange',()=>setTimeout(resize,300));
screen.orientation&&screen.orientation.addEventListener('change',()=>setTimeout(resize,300));

// roundRect polyfill
if(!CanvasRenderingContext2D.prototype.roundRect){
  CanvasRenderingContext2D.prototype.roundRect=function(x,y,w,h,r){
    r=Math.min(r||0,w/2,h/2);
    this.beginPath();this.moveTo(x+r,y);this.arcTo(x+w,y,x+w,y+h,r);this.arcTo(x+w,y+h,x,y+h,r);this.arcTo(x,y+h,x,y,r);this.arcTo(x,y,x+w,y,r);this.closePath();return this;
  };
}

// ═══════════════════════════════════════════════════
// i18n

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
// ═══════════════════════════════════════════════════
const I18N={
  tr:{
    score:'SKOR',lives:'CAN',level:'BÖLÜM',start:'▶ MACERAYA BAŞLA',
    hiscore:'🏆 EN YÜKSEK SKORLAR',clear:'Sıfırla',
    controls:'← → Hareket | SPACE Mızrak ateşle\n↑/W Zıpla | Balon ipe değince hasar alır',
    gameOver:'OYUN BİTTİ',newRecord:'YENİ REKOR!',
    play:'▶ OYNA',hi:'🏆 EN İYİ',cred:'ℹ YAPIMCILAR',
    noScore:'Henüz skor yok.',
  },
  en:{
    score:'SCORE',lives:'LIVES',level:'LEVEL',start:'▶ START ADVENTURE',
    hiscore:'🏆 HIGH SCORES',clear:'Clear',
    controls:'← → Move | SPACE Fire\n↑/W Jump | Balloon touching rope = damage',
    gameOver:'GAME OVER',newRecord:'NEW RECORD!',
    play:'▶ PLAY',hi:'🏆 BEST',cred:'ℹ CREDITS',
    noScore:'No scores yet.',
  }
};
let lang=localStorage.getItem('panglang')||'en';
function t(k){return(I18N[lang]||I18N.tr)[k]||k}
function setLang(l){
  lang=l;localStorage.setItem('panglang',l);
  document.getElementById('btnTR').style.background=l==='tr'?'#ff4757':'#0d0d22';
  document.getElementById('btnTR').style.color=l==='tr'?'#fff':'#aaa';
  document.getElementById('btnEN').style.background=l==='en'?'#ff4757':'#0d0d22';
  document.getElementById('btnEN').style.color=l==='en'?'#fff':'#aaa';
  applyLang();
}
function applyLang(){
  
  document.getElementById('tbHi').textContent=t('hi');
  document.getElementById('tbCred').textContent=t('cred');
  document.getElementById('btnStart').textContent=t('start');
  const hiTitle=document.querySelector('#pHi > div');
  if(hiTitle)hiTitle.textContent=t('hiscore');
  document.getElementById('btnClear').textContent=t('clear');
  renderHi();
}
// apply on load
setTimeout(()=>setLang(lang),0);
// Rainbow Ylmz
function renderYlmz(){
  const el=document.getElementById('ylmzSpan');
  if(!el)return;
  const cols=['#ff4757','#ffa502','#ffd700','#2ed573','#74b9ff','#a29bfe','#fd79a8'];
  el.innerHTML='Ylmz'.split('').map((c,i)=>`<span style="color:${cols[i%cols.length]};font-weight:bold">${c}</span>`).join('');
}
setTimeout(renderYlmz,100);

// Credits kaydırma animasyonu — alttan yukarı
let credPos=180,credRaf=null,credActive=false;
function startCredScroll(){
  stopCredScroll();
  credActive=true;
  const el=document.getElementById('credScroll');
  if(!el)return;
  credPos=180;
  el.style.top=credPos+'px';
  function step(){
    if(!credActive)return;
    credPos-=0.55;
    if(credPos<-el.scrollHeight) credPos=180;
    el.style.top=Math.round(credPos)+'px';
    credRaf=requestAnimationFrame(step);
  }
  credRaf=requestAnimationFrame(step);
}
function stopCredScroll(){
  credActive=false;
  if(credRaf){cancelAnimationFrame(credRaf);credRaf=null;}
  const el=document.getElementById('credScroll');
  if(el) el.style.top='180px';
}
setTimeout(()=>{
  const tbHi=document.getElementById('tbHi');
  const tbCred=document.getElementById('tbCred');
  if(tbHi)  tbHi.addEventListener('click',stopCredScroll);
  if(tbCred)tbCred.addEventListener('click',()=>setTimeout(startCredScroll,60));
},300);


function rgba(hex,a){
  const r=parseInt(hex.slice(1,3),16),g=parseInt(hex.slice(3,5),16),b=parseInt(hex.slice(5,7),16);
  return `rgba(${r},${g},${b},${a})`;
}

// safe primitives
function sarc(x,y,r){if(!isFinite(x+y+r)||r<.1)return;ctx.arc(x,y,r,0,TAU)}
function sell(x,y,rx,ry,rot){rx=Math.abs(rx);ry=Math.abs(ry);if(rx<.1||ry<.1)return;ctx.ellipse(x,y,rx,ry,rot||0,0,TAU)}
function crect(x,y,w,h,r){ctx.beginPath();ctx.roundRect(x,y,w,h,r||0);ctx.fill()}

// ═══════════════════════════════════════════════════
// LOGO ANIMATION

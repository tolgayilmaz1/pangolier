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
  const ctrlH=isTouch?190:0;
  const vw=window.innerWidth;
  const vh=window.innerHeight-ctrlH;
  // Tam ekranı doldur — max sınır yok, aspect ratio koru
  const s=Math.min(vw/GW, vh/GH);
  const cw=Math.round(GW*s);
  const ch=Math.round(GH*s);
  C.style.width=cw+'px';
  C.style.height=ch+'px';
  const gc=document.getElementById('gc');
  gc.style.width=cw+'px';
  gc.style.height=ch+'px';
  // Overlay'leri de aynı boyuta getir
  ['ov','charSelectOv','ctrlSelectOv','mapOv','trans'].forEach(id=>{
    const el=document.getElementById(id);
    if(el){el.style.width=cw+'px';el.style.height=ch+'px';}
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

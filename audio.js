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
  const vw=window.innerWidth;
  const vh=window.innerHeight;
  const isPortrait=vw<vh;

  // Portrait modda: genişliği baz al, ctrl alanı daha az
  const ctrlH=isTouch?(isPortrait?Math.round(vh*0.38):190):0;
  const avW=vw;
  const avH=vh-ctrlH;

  // Canvas scale — portrait'te genişliği tam kullan
  const s=Math.min(avW/GW, avH/GH);
  const cw=Math.round(GW*s);
  const ch=Math.round(GH*s);

  C.style.width=cw+'px';
  C.style.height=ch+'px';

  const gc=document.getElementById('gc');
  gc.style.width=vw+'px';        // gc tam ekran genişliği
  gc.style.height=vh+'px';       // gc tam ekran yüksekliği
  gc.style.display='flex';
  gc.style.flexDirection='column';
  gc.style.alignItems='center';
  gc.style.justifyContent=isPortrait?'flex-start':'center';
  gc.style.paddingTop=isPortrait?'0':'0';

  // Canvas'ı gc içinde üstte ortala
  C.style.display='block';
  C.style.marginTop='0';

  // mctrl — portrait'te canvas altına yerleştir
  const mctrl=document.getElementById('mctrl');
  if(mctrl&&isTouch){
    mctrl.style.position='fixed';
    mctrl.style.bottom='0';
    mctrl.style.left='0';
    mctrl.style.width='100vw';
    mctrl.style.height=ctrlH+'px';
  }

  // Oyun overlay'leri (ov, mapOv, trans) canvas boyutunda
  ['ov','mapOv','trans'].forEach(id=>{
    const el=document.getElementById(id);
    if(el){el.style.width=cw+'px';el.style.height=ch+'px';}
  });

  // Karakter ve controller seçim ekranları TAM EKRAN — canvas boyutundan bağımsız
  ['charSelectOv','ctrlSelectOv'].forEach(id=>{
    const el=document.getElementById(id);
    if(el){
      el.style.position='fixed';
      el.style.top='0';el.style.left='0';
      el.style.width='100vw';el.style.height='100vh';
      el.style.removeProperty('inset');
    }
  });
}
resize();
addEventListener('resize',resize);
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
// ═══════════════════════════════════════════════════
const logoEl=document.getElementById('logo'),lc=logoEl.getContext('2d');
const LL=['P','A','N','G','O','L','I','E','R'];
const LC=['#ff4757','#ffa502','#ffd700','#2ed573','#74b9ff','#a29bfe','#fd79a8','#ff6b35','#00cec9'];
let lf=0,lRaf=null;

function drawPangolin(ctx2,cx,cy,frame){
  const pt=frame*.05;
  ctx2.save();ctx2.translate(cx,cy);
  // tail
  ctx2.strokeStyle='#8B5E2A';ctx2.lineWidth=6;ctx2.lineCap='round';
  ctx2.beginPath();
  ctx2.moveTo(22,0);
  ctx2.quadraticCurveTo(42,-8+Math.sin(pt)*2, 46,6+Math.sin(pt*.8)*2);
  ctx2.stroke();
  ctx2.strokeStyle='#A87030';ctx2.lineWidth=4;
  ctx2.beginPath();
  ctx2.moveTo(44,5);ctx2.quadraticCurveTo(54,14,48,20);ctx2.stroke();
  ctx2.fillStyle='#C89040';ctx2.beginPath();ctx2.arc(47,20,4,0,Math.PI*2);ctx2.fill();
  // body
  const bG=ctx2.createRadialGradient(-2,0,3,0,0,20);
  bG.addColorStop(0,'#D4943A');bG.addColorStop(.5,'#A86C22');bG.addColorStop(1,'#7A4C12');
  ctx2.fillStyle=bG;
  ctx2.beginPath();ctx2.ellipse(0,0,22,12,0,0,Math.PI*2);ctx2.fill();
  // scales
  [[-14,-5,8,5],[-4,-6,8,5],[6,-5,8,5],[16,-4,7,5],
   [-18,0,7,4.5],[-8,0,8,4.5],[2,0,8,4.5],[12,1,8,4.5],[20,2,6,4],
   [-14,5,7,4.5],[-4,6,8,4.5],[6,6,8,4.5],[16,5,7,4.5]].forEach(([sx,sy,srx,sry])=>{
    ctx2.fillStyle='#C8882E';
    ctx2.beginPath();ctx2.ellipse(sx,sy,srx,sry,-.15,0,Math.PI*2);ctx2.fill();
    ctx2.strokeStyle='#7A4C10';ctx2.lineWidth=.6;
    ctx2.beginPath();ctx2.ellipse(sx,sy,srx,sry,-.15,0,Math.PI*2);ctx2.stroke();
  });
  // head
  ctx2.fillStyle='#D4943A';
  ctx2.beginPath();ctx2.ellipse(-24,0,10,8,-.1,0,Math.PI*2);ctx2.fill();
  ctx2.fillStyle='#C88828';
  ctx2.beginPath();ctx2.ellipse(-32,1,8,5,.05,0,Math.PI*2);ctx2.fill();
  // ear
  ctx2.fillStyle='#C88828';ctx2.beginPath();ctx2.ellipse(-23,-7,3.5,4,-.2,0,Math.PI*2);ctx2.fill();
  ctx2.fillStyle='#F0C080';ctx2.beginPath();ctx2.ellipse(-23,-7,2,2.3,-.2,0,Math.PI*2);ctx2.fill();
  // eye
  ctx2.fillStyle='#fff';ctx2.beginPath();ctx2.arc(-25,-1,3,0,Math.PI*2);ctx2.fill();
  ctx2.fillStyle='#2A1000';ctx2.beginPath();ctx2.arc(-25,-1,2,0,Math.PI*2);ctx2.fill();
  ctx2.fillStyle='rgba(255,255,255,.9)';ctx2.beginPath();ctx2.arc(-23.8,-2,0.9,0,Math.PI*2);ctx2.fill();
  // nostril
  ctx2.fillStyle='#8A5010';ctx2.beginPath();ctx2.arc(-37,.5,1.2,0,Math.PI*2);ctx2.fill();
  ctx2.beginPath();ctx2.arc(-37,-1.5,1.2,0,Math.PI*2);ctx2.fill();
  // legs
  [[-15,0],[-4,Math.PI],[6,Math.PI*.5],[16,Math.PI*1.5]].forEach(([lx,ph])=>{
    const sw2=Math.sin(pt*4+ph)*5;
    ctx2.strokeStyle='#8A5010';ctx2.lineWidth=4;ctx2.lineCap='round';
    ctx2.beginPath();ctx2.moveTo(lx,10);ctx2.lineTo(lx+sw2*.3,18+Math.abs(sw2)*.2);ctx2.stroke();
    ctx2.fillStyle='#C88A3A';ctx2.beginPath();ctx2.ellipse(lx+sw2*.3,20+Math.abs(sw2)*.2,4,2.5,.3,0,Math.PI*2);ctx2.fill();
  });
  ctx2.restore();
}

function animLogo(){
  lc.clearRect(0,0,320,110);
  const lt=lf*.04;

  // ── Floating balloons ABOVE letters ──────────────
  const BDATA=[
    {col:'#ff4757',s:'#c0392b',x:26, baseY:14,r:10,phase:0   },
    {col:'#ffa502',s:'#c47400',x:60, baseY:12,r:9, phase:.8  },
    {col:'#ffd700',s:'#c8a000',x:100,baseY:15,r:10,phase:1.4 },
    {col:'#2ed573',s:'#1a8a45',x:145,baseY:10,r:9, phase:2.1 },
    {col:'#74b9ff',s:'#0055aa',x:188,baseY:14,r:10,phase:2.7 },
    {col:'#a29bfe',s:'#6c5ce7',x:228,baseY:12,r:9, phase:3.3 },
    {col:'#fd79a8',s:'#c0547c',x:268,baseY:14,r:9, phase:3.9 },
  ];
  BDATA.forEach(b=>{
    const by=b.baseY+Math.sin(lt+b.phase)*3.5;
    lc.fillStyle='rgba(0,0,0,.12)';
    lc.beginPath();lc.ellipse(b.x,36,b.r*.5,3,0,0,Math.PI*2);lc.fill();
    const bg=lc.createRadialGradient(b.x-b.r*.3,by-b.r*.3,b.r*.1,b.x,by,b.r);
    bg.addColorStop(0,'#fff');bg.addColorStop(.25,b.col);bg.addColorStop(1,b.s);
    lc.fillStyle=bg;lc.beginPath();lc.arc(b.x,by,b.r,0,Math.PI*2);lc.fill();
    lc.strokeStyle=b.s;lc.lineWidth=1.2;lc.beginPath();lc.arc(b.x,by,b.r,0,Math.PI*2);lc.stroke();
    lc.fillStyle='rgba(255,255,255,.35)';lc.beginPath();lc.ellipse(b.x-b.r*.3,by-b.r*.3,b.r*.22,b.r*.13,-.5,0,Math.PI*2);lc.fill();
    lc.fillStyle=b.s;lc.beginPath();lc.arc(b.x,by+b.r,2,0,Math.PI*2);lc.fill();
    lc.strokeStyle=b.s+'88';lc.lineWidth=.8;
    lc.beginPath();lc.moveTo(b.x,by+b.r+2);lc.lineTo(b.x,38);lc.stroke();
  });

  // ── PANGOLIER letters ─────────────────────────────
  const sx2=8,sp=34;
  for(let i=0;i<9;i++){
    const x=sx2+i*sp+14, y=54+Math.sin(lt+i*1.1)*3.5;
    lc.shadowColor=LC[i];lc.shadowBlur=10+Math.sin(lt+i)*3;
    lc.fillStyle=LC[i];
    const isBig=(i===0||i===8);
    const baseSize=isBig?88:24;
    const yOff=isBig?-18:0;
    lc.font=`bold ${baseSize+Math.sin(lt+i*.9)*2}px 'Courier New'`;
    lc.textAlign='center';lc.textBaseline='middle';
    lc.fillText(LL[i],x,y+yOff);
  }
  lc.shadowBlur=0;

  // ── tiny pangolin below ───────────────────────────
  lc.save();lc.scale(.55,.55);
  drawPangolin(lc,290,158,lf);
  lc.restore();

  // tagline
  lc.fillStyle='#444';lc.font='8px Courier New';lc.textAlign='center';
  lc.fillText(lang==='tr'?'Zırhlı Balon Avcısı':'The Armored Balloon Hunter',155,100);

  lf++;lRaf=requestAnimationFrame(animLogo);
}
animLogo();

// ═══════════════════════════════════════════════════
// TABS
// ═══════════════════════════════════════════════════
function switchTab(n){
  ['Hi','Cred'].forEach(tab=>{
    document.getElementById('tb'+tab).classList.toggle('on',tab===n);
    document.getElementById('p'+tab).classList.toggle('on',tab===n);
  });
  if(n==='Hi')renderHi();
}
document.getElementById('tbHi').onclick=()=>switchTab('Hi');
document.getElementById('tbCred').onclick=()=>switchTab('Cred');

// ═══════════════════════════════════════════════════
// HI SCORE
// ═══════════════════════════════════════════════════
const HS='panghv3';
function getHi(){try{return JSON.parse(localStorage.getItem(HS)||'[]')}catch{return[]}}
function cleanPlayerName(n){
  n=String(n||'').trim().toUpperCase();
  n=n.replace(/[^A-Z0-9ĞÜŞİÖÇ _.-]/g,'');
  if(!n)n='PLAYER';
  return n.slice(0,14);
}
function addHi(s,l){
  let a=getHi();
  a.push({n:cleanPlayerName(playerName),s,l,d:new Date().toLocaleDateString('tr-TR')});
  a.sort((x,y)=>y.s-x.s);
  a=a.slice(0,8);
  try{localStorage.setItem(HS,JSON.stringify(a))}catch{}
}
function renderHi(){
  const a=getHi(),el=document.getElementById('hiList');
  el.innerHTML=a.length?a.map((e,i)=>{
    const nm=cleanPlayerName(e.n||'PLAYER');
    return `<div>${['🥇','🥈','🥉'][i]||i+1+'.'} <span style="color:#74b9ff">${nm}</span> <b style="color:#ffd700;float:right">${e.s}</b><br><span style="color:#444;margin-left:22px">${t('level')}${e.l} · ${e.d}</span></div>`;
  }).join(''):`<span style="color:#333">${t('noScore')}</span>`;
}
document.getElementById('btnClear').onclick=()=>{try{localStorage.removeItem(HS)}catch{}renderHi()};

function showNameOv(){}
function hideNameOv(){}
function refreshActivePlayerLabel(){
  const inp=document.getElementById('nameFirstInput');
  const el=document.getElementById('activePlayerName');
  if(inp&&playerName&&playerName!=='PLAYER'){
    inp.value=playerName;
    if(el)el.textContent='HOŞ GELDİN, '+playerName;
  }
}
function setupNameFirstScreen(){
  const inp=document.getElementById('nameFirstInput');
  if(!inp)return;
  try{const s=localStorage.getItem('pangPlayerName');if(s){playerName=cleanPlayerName(s);}}catch{}
  refreshActivePlayerLabel();
}
setTimeout(setupNameFirstScreen,0);

// ═══════════════════════════════════════════════════
// SOUND ENGINE

// ═══════════════════════════════════════════════════
// CANVAS SETUP
// ═══════════════════════════════════════════════════
const C=document.getElementById('c'),ctx=C.getContext('2d');
const GW=640,GH=480; C.width=GW; C.height=GH;
const FLOOR=GH-46, CEIL=36, TAU=Math.PI*2;
const G_PLAYER=0.45;   // tuned jump gravity: lower, tighter platform jumps
const G_BALLOON=0.09;  // original dreamy balloon float

// ── CTRL_H: joystick alanı yüksekliği — oyun canvas'ının ALTINDA, üst üste değil
const CTRL_H_PX = 190;

function resize(){
  const isTouch=('ontouchstart' in window)||navigator.maxTouchPoints>0;
  const vw=window.innerWidth;
  const vh=window.innerHeight;

  // Joystick görünüyorsa, canvas ona yer açarak küçülür;
  // joystick canvas'ın üstüne BINMEZ.
  const ctrlH = isTouch ? CTRL_H_PX : 0;
  const availH = vh - ctrlH;

  // Aspect-ratio'yu koru, mevcut alana sığdır
  const s=Math.min(vw/GW, availH/GH);
  const cw=Math.round(GW*s);
  const ch=Math.round(GH*s);

  C.style.width=cw+'px';
  C.style.height=ch+'px';

  const gc=document.getElementById('gc');
  gc.style.width=cw+'px';
  // gc tüm dikey alanı kaplar (canvas + joystick bölgesi)
  gc.style.height=(ch+ctrlH)+'px';
  gc.style.position='relative';

  // mctrl: canvas bitişinden başlar, canvas'ı KAPATMAZ
  const mctrl=document.getElementById('mctrl');
  if(mctrl){
    mctrl.style.height=CTRL_H_PX+'px';
    mctrl.style.top=ch+'px';
    mctrl.style.bottom='auto';
    mctrl.style.left='0';
    mctrl.style.right='0';
    mctrl.style.position='absolute';
  }

  // Overlay'ler position:absolute;inset:0 ile gc'yi takip eder.
  // gc doğru boyutta olduğundan sadece width yeterli;
  // height'i JS ile set etmek inset:0'ı bozar.
  ['ov','charSelectOv','ctrlSelectOv','mapOv','trans'].forEach(id=>{
    const el=document.getElementById(id);
    if(el){ el.style.width=cw+'px'; el.style.height=ch+'px'; }
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
  "tr": {
    "score": "SKOR",
    "lives": "CAN",
    "level": "BÖLÜM",
    "start": "▶ MACERAYA BAŞLA",
    "hiscore": "🏆 EN YÜKSEK SKORLAR",
    "clear": "Sıfırla",
    "controls": "← → Hareket | SPACE Mızrak ateşle\n↑/W Zıpla",
    "gameOver": "OYUN BİTTİ",
    "newRecord": "YENİ REKOR!",
    "play": "▶ OYNA",
    "hi": "🏆 EN İYİ",
    "cred": "ℹ YAPIMCILAR",
    "noScore": "Henüz skor yok.",
    "settings": "⚙ AYARLAR",
    "mainMenu": "🏠 ANA MENÜ",
    "resume": "▶ DEVAM",
    "music": "Müzik",
    "language": "Dil"
  },
  "en": {
    "score": "SCORE",
    "lives": "LIVES",
    "level": "LEVEL",
    "start": "▶ START ADVENTURE",
    "hiscore": "🏆 HIGH SCORES",
    "clear": "Clear",
    "controls": "← → Move | SPACE Fire\n↑/W Jump",
    "gameOver": "GAME OVER",
    "newRecord": "NEW RECORD!",
    "play": "▶ PLAY",
    "hi": "🏆 BEST",
    "cred": "ℹ CREDITS",
    "noScore": "No scores yet.",
    "settings": "⚙ SETTINGS",
    "mainMenu": "🏠 MAIN MENU",
    "resume": "▶ RESUME",
    "music": "Music",
    "language": "Language"
  },
  "de": {
    "score": "PUNKTE",
    "lives": "LEBEN",
    "level": "LEVEL",
    "start": "▶ ABENTEUER STARTEN",
    "hiscore": "🏆 BESTLISTE",
    "clear": "Löschen",
    "gameOver": "SPIEL VORBEI",
    "newRecord": "NEUER REKORD!",
    "play": "▶ SPIELEN",
    "hi": "🏆 BESTE",
    "cred": "ℹ CREDITS",
    "noScore": "Noch keine Punkte.",
    "settings": "⚙ EINSTELLUNGEN",
    "mainMenu": "🏠 HAUPTMENÜ",
    "resume": "▶ WEITER",
    "music": "Musik",
    "language": "Sprache"
  },
  "ru": {
    "score": "СЧЁТ",
    "lives": "ЖИЗНИ",
    "level": "УРОВЕНЬ",
    "start": "▶ НАЧАТЬ ПРИКЛЮЧЕНИЕ",
    "hiscore": "🏆 РЕКОРДЫ",
    "clear": "Очистить",
    "gameOver": "ИГРА ОКОНЧЕНА",
    "newRecord": "НОВЫЙ РЕКОРД!",
    "play": "▶ ИГРАТЬ",
    "hi": "🏆 ЛУЧШИЕ",
    "cred": "ℹ АВТОРЫ",
    "noScore": "Пока нет очков.",
    "settings": "⚙ НАСТРОЙКИ",
    "mainMenu": "🏠 ГЛАВНОЕ МЕНЮ",
    "resume": "▶ ПРОДОЛЖИТЬ",
    "music": "Музыка",
    "language": "Язык"
  },
  "zh": {
    "score": "得分",
    "lives": "生命",
    "level": "关卡",
    "start": "▶ 开始冒险",
    "hiscore": "🏆 最高分",
    "clear": "清除",
    "gameOver": "游戏结束",
    "newRecord": "新纪录!",
    "play": "▶ 开始",
    "hi": "🏆 排行",
    "cred": "ℹ 制作",
    "noScore": "暂无分数。",
    "settings": "⚙ 设置",
    "mainMenu": "🏠 主菜单",
    "resume": "▶ 继续",
    "music": "音乐",
    "language": "语言"
  },
  "ja": {
    "score": "スコア",
    "lives": "ライフ",
    "level": "レベル",
    "start": "▶ 冒険開始",
    "hiscore": "🏆 ハイスコア",
    "clear": "消去",
    "gameOver": "ゲームオーバー",
    "newRecord": "新記録!",
    "play": "▶ プレイ",
    "hi": "🏆 ベスト",
    "cred": "ℹ クレジット",
    "noScore": "スコアはまだありません。",
    "settings": "⚙ 設定",
    "mainMenu": "🏠 メインメニュー",
    "resume": "▶ 続ける",
    "music": "音楽",
    "language": "言語"
  },
  "fr": {
    "score": "SCORE",
    "lives": "VIES",
    "level": "NIVEAU",
    "start": "▶ COMMENCER",
    "hiscore": "🏆 MEILLEURS SCORES",
    "clear": "Effacer",
    "gameOver": "PARTIE TERMINÉE",
    "newRecord": "NOUVEAU RECORD!",
    "play": "▶ JOUER",
    "hi": "🏆 MEILLEUR",
    "cred": "ℹ CRÉDITS",
    "noScore": "Aucun score.",
    "settings": "⚙ PARAMÈTRES",
    "mainMenu": "🏠 MENU PRINCIPAL",
    "resume": "▶ CONTINUER",
    "music": "Musique",
    "language": "Langue"
  },
  "it": {
    "score": "PUNTI",
    "lives": "VITE",
    "level": "LIVELLO",
    "start": "▶ INIZIA AVVENTURA",
    "hiscore": "🏆 PUNTEGGI MIGLIORI",
    "clear": "Cancella",
    "gameOver": "FINE GIOCO",
    "newRecord": "NUOVO RECORD!",
    "play": "▶ GIOCA",
    "hi": "🏆 MIGLIORI",
    "cred": "ℹ CREDITI",
    "noScore": "Nessun punteggio.",
    "settings": "⚙ IMPOSTAZIONI",
    "mainMenu": "🏠 MENU PRINCIPALE",
    "resume": "▶ CONTINUA",
    "music": "Musica",
    "language": "Lingua"
  },
  "es": {
    "score": "PUNTOS",
    "lives": "VIDAS",
    "level": "NIVEL",
    "start": "▶ EMPEZAR AVENTURA",
    "hiscore": "🏆 MEJORES PUNTOS",
    "clear": "Borrar",
    "gameOver": "FIN DEL JUEGO",
    "newRecord": "¡NUEVO RÉCORD!",
    "play": "▶ JUGAR",
    "hi": "🏆 MEJORES",
    "cred": "ℹ CRÉDITOS",
    "noScore": "Sin puntuaciones.",
    "settings": "⚙ AJUSTES",
    "mainMenu": "🏠 MENÚ PRINCIPAL",
    "resume": "▶ CONTINUAR",
    "music": "Música",
    "language": "Idioma"
  },
  "ar": {
    "score": "النقاط",
    "lives": "الحياة",
    "level": "المرحلة",
    "start": "▶ ابدأ المغامرة",
    "hiscore": "🏆 أعلى النتائج",
    "clear": "مسح",
    "gameOver": "انتهت اللعبة",
    "newRecord": "رقم قياسي جديد!",
    "play": "▶ العب",
    "hi": "🏆 الأفضل",
    "cred": "ℹ الشكر",
    "noScore": "لا توجد نتائج بعد.",
    "settings": "⚙ الإعدادات",
    "mainMenu": "🏠 القائمة الرئيسية",
    "resume": "▶ متابعة",
    "music": "الموسيقى",
    "language": "اللغة"
  },
  "pt": {
    "score": "PONTOS",
    "lives": "VIDAS",
    "level": "NÍVEL",
    "start": "▶ COMEÇAR AVENTURA",
    "hiscore": "🏆 RECORDE",
    "clear": "Limpar",
    "gameOver": "FIM DE JOGO",
    "newRecord": "NOVO RECORDE!",
    "play": "▶ JOGAR",
    "hi": "🏆 MELHORES",
    "cred": "ℹ CRÉDITOS",
    "noScore": "Sem pontos ainda.",
    "settings": "⚙ CONFIGURAÇÕES",
    "mainMenu": "🏠 MENU PRINCIPAL",
    "resume": "▶ CONTINUAR",
    "music": "Música",
    "language": "Idioma"
  },
  "ko": {
    "score": "점수",
    "lives": "목숨",
    "level": "레벨",
    "start": "▶ 모험 시작",
    "hiscore": "🏆 최고 점수",
    "clear": "삭제",
    "gameOver": "게임 오버",
    "newRecord": "신기록!",
    "play": "▶ 플레이",
    "hi": "🏆 최고",
    "cred": "ℹ 크레딧",
    "noScore": "아직 점수가 없습니다.",
    "settings": "⚙ 설정",
    "mainMenu": "🏠 메인 메뉴",
    "resume": "▶ 계속",
    "music": "음악",
    "language": "언어"
  },
  "hi": {
    "score": "स्कोर",
    "lives": "जीवन",
    "level": "लेवल",
    "start": "▶ रोमांच शुरू करें",
    "hiscore": "🏆 हाई स्कोर",
    "clear": "साफ़ करें",
    "gameOver": "खेल खत्म",
    "newRecord": "नया रिकॉर्ड!",
    "play": "▶ खेलें",
    "hi": "🏆 बेस्ट",
    "cred": "ℹ क्रेडिट",
    "noScore": "अभी कोई स्कोर नहीं।",
    "settings": "⚙ सेटिंग्स",
    "mainMenu": "🏠 मुख्य मेनू",
    "resume": "▶ जारी रखें",
    "music": "संगीत",
    "language": "भाषा"
  },
  "id": {
    "score": "SKOR",
    "lives": "NYAWA",
    "level": "LEVEL",
    "start": "▶ MULAI PETUALANGAN",
    "hiscore": "🏆 SKOR TERTINGGI",
    "clear": "Hapus",
    "gameOver": "GAME OVER",
    "newRecord": "REKOR BARU!",
    "play": "▶ MAIN",
    "hi": "🏆 TERBAIK",
    "cred": "ℹ KREDIT",
    "noScore": "Belum ada skor.",
    "settings": "⚙ PENGATURAN",
    "mainMenu": "🏠 MENU UTAMA",
    "resume": "▶ LANJUT",
    "music": "Musik",
    "language": "Bahasa"
  }
};
let lang=localStorage.getItem('panglang')||'en';
function t(k){return(I18N[lang]||I18N.tr)[k]||k}
function setLang(l){
  if(!I18N[l])l='en';
  lang=l;localStorage.setItem('panglang',l);
  document.querySelectorAll('[data-langbtn]').forEach(b=>{
    const on=b.getAttribute('data-langbtn')===l;
    b.style.background=on?'#ff4757':'#0d0d22';
    b.style.color=on?'#fff':'#aaa';
    b.style.borderColor=on?'#ff8a8a':'#333';
  });
  applyLang();
}
function applyLang(){
  document.documentElement.lang=lang;
  document.documentElement.dir=lang==='ar'?'rtl':'ltr';
  const set=(id,v)=>{const el=document.getElementById(id);if(el)el.textContent=v;};
  set('tbHi',t('hi'));
  set('tbCred',t('cred'));
  set('btnStart',t('start'));
  set('btnClear',t('clear'));
  const hiTitle=document.querySelector('#pHi > div');
  if(hiTitle)hiTitle.textContent=t('hiscore');
  const inp=document.getElementById('nameFirstInput');
  if(inp)inp.placeholder=(lang==='tr'?'ADINI YAZ':lang==='en'?'ENTER NAME':t('play'));
  if(typeof updateSettingsTexts==='function')updateSettingsTexts();
  if(typeof renderHi==='function')renderHi();
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
// ═══════════════════════════════════════════════════
const AC=(()=>{try{return new(window.AudioContext||window.webkitAudioContext)()}catch{return null}})();
function resumeAC(){if(AC&&AC.state==='suspended')AC.resume()}
const masterGain=(()=>{if(!AC)return null;const g=AC.createGain();g.gain.value=0.7;g.connect(AC.destination);return g})();

function osc(freq,type,dur,vol,delay=0,dest=masterGain){
  if(!AC||!dest)return;
  try{
    const o=AC.createOscillator(),g=AC.createGain();
    o.type=type;o.frequency.value=freq;o.connect(g);g.connect(dest);
    const t=AC.currentTime+delay;
    g.gain.setValueAtTime(vol,t);g.gain.exponentialRampToValueAtTime(.001,t+dur);
    o.start(t);o.stop(t+dur+.05);
  }catch{}
}
function noise(dur,vol,delay=0){
  if(!AC||!masterGain)return;
  try{
    const buf=AC.createBuffer(1,AC.sampleRate*dur,AC.sampleRate);
    const d=buf.getChannelData(0);for(let i=0;i<d.length;i++)d[i]=Math.random()*2-1;
    const s=AC.createBufferSource(),g=AC.createGain();
    s.buffer=buf;s.connect(g);g.connect(masterGain);
    const t=AC.currentTime+delay;
    g.gain.setValueAtTime(vol,t);g.gain.exponentialRampToValueAtTime(.001,t+dur);
    s.start(t);
  }catch{}
}
function sweep(f0,f1,type,dur,vol){
  if(!AC||!masterGain)return;
  try{
    const o=AC.createOscillator(),g=AC.createGain();
    o.type=type;o.connect(g);g.connect(masterGain);
    const t=AC.currentTime;
    o.frequency.setValueAtTime(f0,t);o.frequency.exponentialRampToValueAtTime(f1,t+dur);
    g.gain.setValueAtTime(vol,t);g.gain.exponentialRampToValueAtTime(.001,t+dur);
    o.start(t);o.stop(t+dur+.05);
  }catch{}
}

const SFX={
  fire:()=>{osc(380,'sawtooth',.1,.12);osc(760,'square',.06,.05,.05)},
  pop: (sz)=>{
    const f=[0,180,140,100][sz]||140;
    osc(f,'sine',.18,.2);noise(.12,.08);
    osc(f*.5,'sine',.12,.1,.06);
  },
  bounce:(sz)=>{
    const f=[0,220,170,130][sz]||170;
    sweep(f,f*.6,'sine',.12,.15);
  },
  jump:()=>{sweep(200,700,'square',.18,.1)},
  step:()=>{osc(70,'square',.04,.04)},
  hit: ()=>{noise(.25,.2);osc(80,'sawtooth',.2,.1)},
  die: ()=>{
    [400,300,200,100].forEach((f,i)=>osc(f,'sawtooth',.15,.18,i*.1));
    noise(.5,.15,.3);
  },
  bonus:()=>{[523,659,784,1047].forEach((f,i)=>osc(f,'sine',.12,.18,i*.08))},
  levelup:()=>{[523,659,784,1047,1319,1568].forEach((f,i)=>osc(f,'triangle',.15,.22,i*.07))},
  hook:()=>{sweep(600,1400,'square',.1,.12)},
  clang:()=>{
    osc(180,'sawtooth',.15,.2);osc(280,'sawtooth',.12,.15,.02);
    noise(.12,.18,.05);
    osc(90,'square',.08,.1,.08);
  },
  freeze:()=>{[800,1000,1200].forEach((f,i)=>osc(f,'sine',.2,.1,i*.05))},
  bomb:()=>{noise(.4,.3);osc(60,'sawtooth',.3,.2)},
};

// ═══════════════════════════════════════════════════
// BGM — Her dünya için farklı tema
// ═══════════════════════════════════════════════════
let bgmOn=false,bgmTimeout=null,bgmWorldIdx=0;

// Her dünyaya özgü müzik: [melody, bass, style]
// melody: [[freq,dur],...] bass: [f,d,f,d,...]
// style: {mel_type, bass_type, mel_vol, bass_vol, tempo}
const WORLD_BGM=[
  // 0. İstanbul — Üsküdara Giderken (MIDI'den alındı, 100 BPM)
  {mel:[
    [293.66,0.45],[440.0,0.15],[440.0,0.3],[440.0,0.3],[466.16,0.15],[440.0,0.15],
    [466.16,0.15],[523.25,0.15],[440.0,0.3],[440.0,0.3],[392.0,0.3],[392.0,0.15],
    [392.0,0.15],[349.23,0.3],[392.0,0.3],[440.0,1.2],[293.66,0.45],[440.0,0.15],
    [440.0,0.3],[440.0,0.3],[466.16,0.15],[440.0,0.15],[466.16,0.15],[523.25,0.15],
    [440.0,0.3],[440.0,0.3],[392.0,0.3],[392.0,0.15],[392.0,0.15],[349.23,0.3],[392.0,0.3],
    [440.0,1.2],[293.66,0.45],[329.63,0.15],[349.23,0.3],[392.0,0.3],[440.0,0.15],
    [466.16,0.15],[440.0,0.15],[392.0,0.15],[349.23,0.15],[329.63,0.15],[293.66,0.3],
    [392.0,0.15],[349.23,0.15],[349.23,0.15],[329.63,0.15],[329.63,0.15],[293.66,0.15],
    [293.66,0.15],[277.18,0.15],[329.63,1.2],[293.66,0.45],[329.63,0.15],[349.23,0.3],
    [392.0,0.3],[440.0,0.15],[466.16,0.15],[440.0,0.15],[392.0,0.15],[349.23,0.15],
    [329.63,0.15],[293.66,0.3],[392.0,0.15],[349.23,0.15],[349.23,0.15],[329.63,0.15],
    [329.63,0.15],[293.66,0.15],[293.66,0.15],[277.18,0.15],[293.66,1.2]
  ],
   bass:[
     146.83,0.6, 146.83,0.6, 164.81,0.6, 146.83,1.2,
     123.47,0.6, 123.47,0.6, 146.83,0.6, 123.47,1.2,
     146.83,0.6, 146.83,0.6, 164.81,0.6, 146.83,1.2,
     110.0,0.6,  123.47,0.6, 146.83,0.6, 110.0,1.2
   ],
   mt:'triangle',bt:'sine',mv:.055,bv:.03,
   drum:false},

  // 1. Kahire — Horror piramit, minor, drone
  {mel:[[220,.18],[233,.18],[220,.36],[196,.18],[185,.18],[196,.36],
        [220,.18],[207,.18],[196,.18],[185,.36],[196,.54]],
   bass:[55,.36,55,.36,58,.36,55,.72, 49,.36,49,.36,52,.36,49,.72],
   mt:'sawtooth',bt:'sawtooth',mv:.05,bv:.04,
   drone:196, drum:true},

  // 2. Tokyo — Metal / anime action, hızlı square
  {mel:[[880,.09],[880,.09],[988,.09],[880,.18],[784,.09],[880,.09],[988,.18],[1047,.09],[988,.09],
        [880,.09],[880,.09],[784,.09],[698,.18],[784,.09],[698,.09],[659,.36]],
   bass:[110,.18,110,.18,123,.18,110,.36, 98,.18,98,.18,110,.18,98,.36],
   mt:'square',bt:'square',mv:.04,bv:.035,
   drum:true},

  // 3. Antartika — Alien/horror, sine eerie, yavaş
  {mel:[[311,.24],[329,.24],[311,.48],[277,.24],[293,.24],[277,.72],
        [311,.24],[370,.24],[349,.24],[329,.48],[311,.72]],
   bass:[78,.48,78,.48,82,.48,78,.96],
   mt:'sine',bt:'sine',mv:.06,bv:.035,
   drone:155},

  // 4. Amerika — Rock/action, distorted sawtooth
  {mel:[[440,.12],[440,.12],[494,.12],[523,.24],[440,.12],[392,.12],[440,.36],
        [349,.12],[392,.12],[440,.12],[494,.24],[523,.12],[587,.12],[523,.36]],
   bass:[110,.24,110,.24,130,.24,110,.48, 87,.24,87,.24,98,.24,87,.48],
   mt:'sawtooth',bt:'sawtooth',mv:.05,bv:.04,
   drum:true},

  // 5. Rusya — Dark march, low brass feel
  {mel:[[196,.24],[196,.24],[220,.12],[196,.12],[175,.48],[196,.24],
        [233,.24],[220,.24],[196,.48],[175,.24],[165,.24],[175,.72]],
   bass:[49,.48,49,.24,55,.24,49,.48, 41,.48,41,.24,44,.24,41,.96],
   mt:'sawtooth',bt:'square',mv:.052,bv:.042,
   drum:true},

  // 6. Dominikana — Tropical + dark, hızlı latin
  {mel:[[523,.09],[587,.09],[659,.18],[698,.09],[659,.09],[587,.09],[523,.18],
        [440,.09],[494,.09],[523,.18],[587,.09],[523,.09],[494,.09],[440,.36]],
   bass:[130,.18,130,.18,146,.18,130,.36, 110,.18,110,.18,123,.18,110,.36],
   mt:'triangle',bt:'square',mv:.045,bv:.03,
   drum:true},

  // 7. Bakü — Metal / ateş teması, heavy riff
  {mel:[[233,.12],[233,.12],[261,.12],[233,.12],[207,.12],[196,.12],[207,.24],[233,.36],
        [175,.12],[196,.12],[207,.12],[196,.12],[175,.12],[165,.12],[175,.36]],
   bass:[58,.24,58,.12,58,.12,65,.24,58,.24, 49,.24,49,.12,49,.12,52,.24,49,.48],
   mt:'sawtooth',bt:'sawtooth',mv:.055,bv:.045,
   drum:true},

  // 8. Barselona — Flamenco horror, minor Phrygian
  {mel:[[329,.15],[311,.15],[293,.15],[311,.30],[349,.15],[329,.15],[293,.45],
        [261,.15],[277,.15],[293,.15],[311,.30],[293,.15],[261,.15],[246,.60]],
   bass:[82,.30,87,.15,82,.15,78,.60, 73,.30,78,.15,73,.15,69,.60],
   mt:'triangle',bt:'square',mv:.048,bv:.032},

  // 9. Roma — Epic gladiator march
  {mel:[[392,.18],[392,.18],[440,.18],[392,.18],[349,.36],[329,.18],[349,.36],
        [392,.18],[440,.18],[494,.18],[523,.36],[494,.18],[440,.18],[392,.54]],
   bass:[98,.36,98,.36,110,.36,98,.72, 87,.36,87,.36,98,.36,87,.72],
   mt:'sawtooth',bt:'square',mv:.05,bv:.04,
   drum:true},

  // 10. Paris — Dark gothic waltz (3/4)
  {mel:[[659,.18],[622,.18],[659,.18],[698,.54],[659,.18],[622,.18],[587,.54],
        [622,.18],[587,.18],[554,.18],[523,.54],[494,.18],[523,.18],[554,.18],[523,.54]],
   bass:[164,.54,164,.27,174,.27,164,.54, 155,.54,155,.27,164,.27,155,.54],
   mt:'triangle',bt:'sine',mv:.045,bv:.03},

  // 11. Afrika — Tribal horror drums + melody
  {mel:[[440,.12],[415,.12],[440,.24],[392,.12],[370,.12],[392,.36],
        [440,.12],[494,.12],[523,.12],[494,.12],[440,.12],[392,.24],[370,.48]],
   bass:[110,.24,110,.12,116,.12,110,.24, 98,.24,98,.12,103,.12,98,.48],
   mt:'sawtooth',bt:'square',mv:.05,bv:.038,
   drum:true},

  // 12. Uzay — Final boss, full metal chaos
  {mel:[[880,.09],[932,.09],[880,.09],[830,.09],[880,.18],[784,.09],[698,.09],[784,.18],
        [880,.09],[988,.09],[1047,.09],[988,.09],[880,.09],[784,.09],[698,.09],[659,.36]],
   bass:[110,.18,116,.09,110,.09,103,.18,110,.18, 87,.18,92,.09,87,.09,82,.18,87,.36],
   mt:'sawtooth',bt:'sawtooth',mv:.055,bv:.045,
   drone:55, drum:true},
];

function playDrumBeat(delay){
  if(!AC||!masterGain)return;
  // Kick
  try{
    const o=AC.createOscillator(),g=AC.createGain();
    o.type='sine';o.frequency.setValueAtTime(150,AC.currentTime+delay);
    o.frequency.exponentialRampToValueAtTime(40,AC.currentTime+delay+.08);
    o.connect(g);g.connect(masterGain);
    g.gain.setValueAtTime(.18,AC.currentTime+delay);
    g.gain.exponentialRampToValueAtTime(.001,AC.currentTime+delay+.12);
    o.start(AC.currentTime+delay);o.stop(AC.currentTime+delay+.15);
  }catch{}
  // Snare (noise burst)
  try{
    const buf=AC.createBuffer(1,AC.sampleRate*.08,AC.sampleRate);
    const d=buf.getChannelData(0);for(let i=0;i<d.length;i++)d[i]=Math.random()*2-1;
    const s=AC.createBufferSource(),g=AC.createGain(),f=AC.createBiquadFilter();
    f.type='bandpass';f.frequency.value=2000;f.Q.value=0.8;
    s.buffer=buf;s.connect(f);f.connect(g);g.connect(masterGain);
    g.gain.setValueAtTime(.06,AC.currentTime+delay);
    g.gain.exponentialRampToValueAtTime(.001,AC.currentTime+delay+.08);
    s.start(AC.currentTime+delay);
  }catch{}
}

function scheduleBGM(){
  if(!AC||!masterGain||!bgmOn)return;
  const th=WORLD_BGM[bgmWorldIdx%WORLD_BGM.length];
  const {mel,bass,mt,bt,mv,bv,drone,drum}=th;
  const beat=.12; // tempo base

  let t=AC.currentTime+.05;

  // Drone (horror bass pad)
  if(drone){
    try{
      const total=mel.reduce((s,[,d])=>s+d,0);
      const o=AC.createOscillator(),g=AC.createGain();
      o.type='sine';o.frequency.value=drone;
      o.connect(g);g.connect(masterGain);
      g.gain.setValueAtTime(.028,t);
      g.gain.exponentialRampToValueAtTime(.001,t+total+.1);
      o.start(t);o.stop(t+total+.2);
    }catch{}
  }

  // Melody
  mel.forEach(([f,d])=>{
    osc(f,mt,d*.88,mv,t-AC.currentTime);
    // Harmony (+5th) subtle
    osc(f*1.5,mt,d*.88,mv*.22,t-AC.currentTime);
    t+=d;
  });

  // Bass
  let bt2=AC.currentTime+.05;
  for(let i=0;i<bass.length;i+=2){
    osc(bass[i],bt,bass[i+1]*.88,bv,bt2-AC.currentTime);
    bt2+=bass[i+1];
  }

  // Drums
  if(drum){
    const total=mel.reduce((s,[,d])=>s+d,0);
    const step=total/8;
    // kick on 1 and 3, snare on 2 and 4
    [0,2,4,6].forEach(i=>playDrumBeat(i*step+.05));       // kicks
    [1,3,5,7].forEach(i=>playDrumBeat(i*step+.05+step*.5)); // snares (half-beat offset)
  }

  const total=mel.reduce((s,[,d])=>s+d,0)*1000;
  bgmTimeout=setTimeout(scheduleBGM,total-80);
}

function startBGM(worldIdx){
  bgmWorldIdx=worldIdx||0;
  if(bgmOn)stopBGM();
  bgmOn=true;
  scheduleBGM();
}
function stopBGM(){bgmOn=false;if(bgmTimeout)clearTimeout(bgmTimeout);bgmTimeout=null}
function setBGMWorld(wi){
  if(bgmWorldIdx===wi)return;
  bgmWorldIdx=wi;
  if(bgmOn){stopBGM();bgmOn=true;scheduleBGM();}
}

// ═══════════════════════════════════════════════════
// WORLD DATA

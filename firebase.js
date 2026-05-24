// ═══════════════════════════════════════════════════
// PANGOLIER — Global Hi-Score (Firebase Realtime DB)
// Compat SDK — PWA/TWA/Android uyumlu
// ═══════════════════════════════════════════════════
// YÜKLENİŞ SIRASI: firebase-app-compat → firebase-database-compat → bu dosya
// ═══════════════════════════════════════════════════
(function () {
  const NODE   = 'pangolier_scores';
  const MAX    = 8;
  let _cache   = [];
  let _db      = null;
  let _ref     = null;
  let _ready   = false;

  // ── Firebase başlat ────────────────────────────────
  function init() {
    try { firebase.app(); } catch (_) {
      firebase.initializeApp({
        apiKey:            "AIzaSyC3QkOPNtLuNYf9zJtG5reUaZx3ikX74U0",
        authDomain:        "slingfind.firebaseapp.com",
        databaseURL:       "https://slingfind-default-rtdb.firebaseio.com",
        projectId:         "slingfind",
        storageBucket:     "slingfind.firebasestorage.app",
        messagingSenderId: "439781657093",
        appId:             "1:439781657093:web:56205afb0fbc0bb1442a6c"
      });
    }
    _db    = firebase.database();
    _ref   = _db.ref(NODE);
    _ready = true;

    // Realtime listener — başka cihazdan skor gelince anında güncelle
    _ref.orderByChild('s').limitToLast(MAX)
      .on('value', snap => {
        _cache = toArray(snap);
        doRender();
      });

    console.log('[Pangolier] Firebase ✓ →', NODE);
  }

  // ── Snapshot → sorted array ───────────────────────
  function toArray(snap) {
    if (!snap || !snap.exists()) return [];
    const arr = [];
    snap.forEach(c => arr.push({ _k: c.key, ...c.val() }));
    arr.sort((a, b) => b.s - a.s);
    return arr.slice(0, MAX);
  }

  // ── localStorage fallback ─────────────────────────
  function localRead()  { try { return JSON.parse(localStorage.getItem('panghv3') || '[]'); } catch { return []; } }
  function localWrite(a){ try { localStorage.setItem('panghv3', JSON.stringify(a.slice(0, MAX))); } catch {} }

  // ── getHi: cache önce, arka planda DB ────────────
  window.getHi = function () {
    return _cache.length ? _cache : localRead();
  };

  // ── addHi: DB + local backup ──────────────────────
  window.addHi = function (s, l) {
    const pn    = (typeof playerName !== 'undefined') ? playerName : 'PLAYER';
    const clean = (typeof cleanPlayerName === 'function') ? cleanPlayerName(pn) : String(pn).toUpperCase().slice(0,14);
    const entry = { n: clean, s, l, d: new Date().toLocaleDateString('tr-TR'), ts: Date.now() };

    // Her zaman local'e yaz
    const loc = localRead();
    loc.push(entry);
    loc.sort((a, b) => b.s - a.s);
    localWrite(loc);

    if (!_ready || !_ref) { doRender(); return; }

    _ref.push(entry)
      .then(() => _ref.orderByChild('s').once('value'))
      .then(snap => {
        const all = toArray(snap);
        // MAX'tan fazlaysa en düşüğü sil
        if (all.length > MAX) {
          const worst = all[all.length - 1];
          if (worst && worst._k) _ref.child(worst._k).remove();
        }
      })
      .catch(e => console.warn('[Firebase] addHi:', e));
  };

  // ── renderHi: game.js'deki fonksiyonu çağır ───────
  function doRender() {
    if (typeof renderHi === 'function') renderHi();
    else setTimeout(() => { if (typeof renderHi === 'function') renderHi(); }, 300);
  }

  // ── renderHi override: cache'den çiz ─────────────
  // game.js'deki renderHi() window.getHi()'yı çağırdığı için
  // getHi → _cache döndürüyor, renderHi otomatik doğru veriyi çizer.
  // Ekstra override gerekmez.

  // ── btnClear: tüm global tabloyu sil ─────────────
  document.addEventListener('DOMContentLoaded', () => {
    const btn = document.getElementById('btnClear');
    if (!btn) return;
    btn.onclick = () => {
      const msg = (typeof lang !== 'undefined' && lang === 'tr')
        ? 'Tüm global skorlar silinsin mi?'
        : 'Delete all global scores?';
      if (!confirm(msg)) return;
      try { localStorage.removeItem('panghv3'); } catch {}
      _cache = [];
      doRender();
      if (_ready && _ref) _ref.remove().catch(e => console.warn('[Firebase] clear:', e));
    };
  });

  // ── SDK hazır mı? ─────────────────────────────────
  if (typeof firebase !== 'undefined') {
    init();
  } else {
    // index.html'de CDN script'ler async yüklenirse bekle
    window.addEventListener('load', () => {
      if (typeof firebase !== 'undefined') init();
      else console.warn('[Pangolier] Firebase SDK yüklenemedi — local mod');
    });
  }
})();

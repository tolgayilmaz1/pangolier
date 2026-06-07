// ═══════════════════════════════════════════════════
// PANGOLIER — Global Online Hi-Score
// Firebase Realtime Database / pangoliersz
// ═══════════════════════════════════════════════════
(function () {
  'use strict';

  const NODE = 'pangolier_scores';
  const MAX = 50;          // DB'den 50 skor çek, ekranda oyun render'ı ilk 8'i gösterebilir
  const LOCAL_KEY = 'panghv3';
  let _cache = [];
  let _db = null;
  let _ref = null;
  let _ready = false;
  let _listening = false;

  const CONFIG = {
    apiKey: "AIzaSyBc1LPmIiX9sAAmE0uT1sV1y8P5dGgBvxQ",
    authDomain: "pangoliersz.firebaseapp.com",
    databaseURL: "https://pangoliersz-default-rtdb.europe-west1.firebasedatabase.app/",
    projectId: "pangoliersz",
    storageBucket: "pangoliersz.firebasestorage.app",
    messagingSenderId: "298483809654",
    appId: "1:298483809654:web:c50e4a841ca1bab5778e57"
  };

  function cleanName(n) {
    if (typeof window.cleanPlayerName === 'function') return window.cleanPlayerName(n);
    n = String(n || '').trim().toUpperCase();
    n = n.replace(/[^A-Z0-9ĞÜŞİÖÇ _.-]/g, '');
    return (n || 'PLAYER').slice(0, 14);
  }

  function localRead() {
    try { return JSON.parse(localStorage.getItem(LOCAL_KEY) || '[]'); }
    catch (_) { return []; }
  }

  function localWrite(a) {
    try { localStorage.setItem(LOCAL_KEY, JSON.stringify(a.slice(0, MAX))); }
    catch (_) {}
  }

  function normalizeEntry(v, key) {
    const score = Number(v && (v.s ?? v.score)) || 0;
    const level = Number(v && (v.l ?? v.level)) || 1;
    return {
      _k: key || (v && v._k) || '',
      n: cleanName(v && (v.n || v.name || v.player || 'PLAYER')),
      s: score,
      l: level,
      d: (v && (v.d || v.date)) || new Date().toLocaleDateString('tr-TR'),
      ts: Number(v && v.ts) || 0
    };
  }

  function sortScores(a) {
    return (a || [])
      .map(x => normalizeEntry(x, x && x._k))
      .filter(x => x.s > 0)
      .sort((a, b) => (b.s - a.s) || (b.ts - a.ts))
      .slice(0, MAX);
  }

  function snapToArray(snap) {
    const arr = [];
    if (!snap || !snap.exists()) return arr;
    snap.forEach(child => arr.push(normalizeEntry(child.val(), child.key)));
    return sortScores(arr);
  }

  function renderSoon() {
    setTimeout(() => {
      if (typeof window.renderHi === 'function') window.renderHi();
    }, 0);
  }

  function initFirebase() {
    if (typeof window.firebase === 'undefined') {
      console.warn('[Pangolier] Firebase SDK yok, local hi-score çalışıyor.');
      return false;
    }

    try {
      if (!firebase.apps || !firebase.apps.length) firebase.initializeApp(CONFIG);
      _db = firebase.database();
      _ref = _db.ref(NODE);
      _ready = true;
      console.log('[Pangolier] Global hi-score online:', CONFIG.databaseURL + NODE);
      return true;
    } catch (e) {
      console.warn('[Pangolier] Firebase init hatası:', e);
      _ready = false;
      return false;
    }
  }

  function startListener() {
    if (!_ready || !_ref || _listening) return;
    _listening = true;
    _ref.orderByChild('s').limitToLast(MAX).on('value', snap => {
      _cache = snapToArray(snap);
      // Online skorlar local'e de yazılsın, internet yokken son liste görünsün
      if (_cache.length) localWrite(_cache);
      renderSoon();
    }, err => {
      console.warn('[Pangolier] Firebase listener:', err);
      _cache = sortScores(localRead());
      renderSoon();
    });
  }

  window.getHi = function () {
    return _cache.length ? _cache.slice(0, 8) : sortScores(localRead()).slice(0, 8);
  };

  window.addHi = function (score, level) {
    const s = Number(score) || 0;
    const l = Number(level) || 1;
    if (s <= 0) return;

    const nameFromInput = document.getElementById('nameFirstInput')?.value;
    let nameFromStorage = '';
    try { nameFromStorage = localStorage.getItem('pangPlayerName') || ''; } catch (_) {}
    const nameFromGlobal = nameFromInput || nameFromStorage || 'PLAYER';
    const entry = {
      n: cleanName(nameFromGlobal),
      s,
      l,
      d: new Date().toLocaleDateString('tr-TR'),
      ts: (typeof firebase !== 'undefined' && firebase.database && firebase.database.ServerValue)
        ? firebase.database.ServerValue.TIMESTAMP
        : Date.now()
    };

    const local = sortScores([...localRead(), { ...entry, ts: Date.now() }]);
    localWrite(local);
    _cache = sortScores([..._cache, { ...entry, ts: Date.now() }]);
    renderSoon();

    if (!_ready || !_ref) return;
    _ref.push(entry).catch(e => console.warn('[Pangolier] Skor gönderilemedi:', e));
  };

  window.clearGlobalHiScores = function () {
    try { localStorage.removeItem(LOCAL_KEY); } catch (_) {}
    _cache = [];
    renderSoon();
    if (_ready && _ref) return _ref.remove().catch(e => console.warn('[Pangolier] Global skor silinemedi:', e));
  };

  function hookClearButton() {
    const btn = document.getElementById('btnClear');
    if (!btn) return;
    btn.onclick = () => {
      const msg = (window.lang === 'tr') ? 'Tüm global skorlar silinsin mi?' : 'Delete all global scores?';
      if (!confirm(msg)) return;
      window.clearGlobalHiScores();
    };
  }

  function boot() {
    initFirebase();
    startListener();
    hookClearButton();
    renderSoon();
  }

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', boot);
  else boot();
})();

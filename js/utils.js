/* LUXORA — utils.js : shared helper functions */

const Utils = (() => {

  function formatPrice(n){
    const v = Number(n) || 0;
    return '$' + v.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
  }

  function debounce(fn, wait = 300){
    let t;
    return (...args) => {
      clearTimeout(t);
      t = setTimeout(() => fn(...args), wait);
    };
  }

  // Escape any string before inserting into innerHTML to avoid unsafe HTML injection
  function esc(str){
    if (str === null || str === undefined) return '';
    return String(str)
      .replaceAll('&','&amp;')
      .replaceAll('<','&lt;')
      .replaceAll('>','&gt;')
      .replaceAll('"','&quot;')
      .replaceAll("'",'&#39;');
  }

  function starString(rating){
    const r = Math.round((Number(rating) || 0) * 2) / 2;
    const full = Math.floor(r);
    const half = r - full === 0.5;
    let s = '★'.repeat(full);
    if (half) s += '⯨';
    s += '☆'.repeat(Math.max(0, 5 - full - (half ? 1 : 0)));
    return s;
  }

  function qs(param){
    return new URLSearchParams(window.location.search).get(param);
  }

  function setQs(params){
    const url = new URL(window.location.href);
    Object.entries(params).forEach(([k,v]) => {
      if (v === null || v === undefined || v === '') url.searchParams.delete(k);
      else url.searchParams.set(k, v);
    });
    window.history.replaceState({}, '', url);
  }

  function uid(prefix = 'id'){
    return `${prefix}_${Date.now()}_${Math.floor(Math.random()*10000)}`;
  }

  function formatDate(d){
    const date = d ? new Date(d) : new Date();
    return date.toLocaleDateString('en-US', { year:'numeric', month:'short', day:'numeric' });
  }

  function titleCase(str){
    if (!str) return '';
    return String(str).replace(/[-_]/g,' ').replace(/\w\S*/g, t => t.charAt(0).toUpperCase() + t.slice(1));
  }

  function clamp(n, min, max){ return Math.max(min, Math.min(max, n)); }

  function lazyImg(src, alt=''){
    return `<img src="${esc(src)}" alt="${esc(alt)}" loading="lazy" onerror="this.onerror=null;this.src='https://placehold.co/600x600/F1EEE7/8A5C22?text=LUXORA';">`;
  }

  return { formatPrice, debounce, esc, starString, qs, setQs, uid, formatDate, titleCase, clamp, lazyImg };
})();

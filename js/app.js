/* LUXORA — app.js
   Bootstraps every page: injects shared header/footer, wires up global
   interactive chrome (drawers, search, dark mode, toasts, mini-cart,
   compare bar, quick view) and calls the page-specific init function
   declared on <body data-page="..."> if one exists in the relevant module. */

(function () {
  document.documentElement.setAttribute('data-theme', State.getTheme());

  document.addEventListener('DOMContentLoaded', () => {
    injectChrome();
    wireHeader();
    wireDrawers();
    wireSearch();
    wireQuickView();
    wireCompareBar();
    wireNewsletter();
    renderMiniCart();
    renderCompareBar();
    document.addEventListener('cart:change', renderMiniCart);
    document.addEventListener('wishlist:change', () => updateBadge('wishBadge', State.getWishlist().length));
    document.addEventListener('compare:change', renderCompareBar);

    // Page-specific init hook
    const page = document.body.getAttribute('data-page');
    if (page && window.PageInit && typeof window.PageInit[page] === 'function') {
      window.PageInit[page]();
    }
  });

  function injectChrome(){
    const hMount = document.getElementById('headerMount');
    const fMount = document.getElementById('footerMount');
    if (hMount) hMount.outerHTML = Components.headerHTML();
    if (fMount) fMount.outerHTML = Components.footerHTML();
  }

  function updateBadge(id, count){
    const el = document.getElementById(id);
    if (!el) return;
    el.textContent = count;
    el.style.display = count > 0 ? 'flex' : 'none';
  }

  function wireHeader(){
    updateBadge('cartBadge', State.cartCount());
    updateBadge('wishBadge', State.getWishlist().length);

    const themeBtn = document.getElementById('themeToggle');
    themeBtn?.addEventListener('click', () => {
      const next = State.getTheme() === 'dark' ? 'light' : 'dark';
      State.setTheme(next);
      document.documentElement.setAttribute('data-theme', next);
      themeBtn.innerHTML = next === 'dark' ? Components.iconSvg('sun') : Components.iconSvg('moon');
      Components.toast(`${next === 'dark' ? 'Dark' : 'Light'} mode enabled`);
    });
  }

  // ---------- Drawers (mobile nav + mini cart) ----------
  function openDrawer(el){ el.classList.add('open'); document.getElementById('overlayBg').classList.add('open'); document.body.style.overflow='hidden'; }
  function closeAllDrawers(){
    document.querySelectorAll('.drawer.open').forEach(d => d.classList.remove('open'));
    document.getElementById('overlayBg')?.classList.remove('open');
    document.body.style.overflow='';
  }

  function wireDrawers(){
    const hamburger = document.getElementById('hamburgerBtn');
    const mobileNav = document.getElementById('mobileNavDrawer');
    const closeMobileNav = document.getElementById('closeMobileNav');
    const cartBtn = document.getElementById('cartBtn');
    const miniCart = document.getElementById('miniCartDrawer');
    const closeMiniCart = document.getElementById('closeMiniCart');
    const overlay = document.getElementById('overlayBg');

    hamburger?.addEventListener('click', () => openDrawer(mobileNav));
    closeMobileNav?.addEventListener('click', closeAllDrawers);
    cartBtn?.addEventListener('click', () => openDrawer(miniCart));
    closeMiniCart?.addEventListener('click', closeAllDrawers);
    overlay?.addEventListener('click', closeAllDrawers);
    document.addEventListener('keydown', e => { if (e.key === 'Escape') closeAllDrawers(); });
  }

  window.LuxoraDrawers = { openDrawer, closeAllDrawers };

  // ---------- Mini cart rendering ----------
  function renderMiniCart(){
    updateBadge('cartBadge', State.cartCount());
    const body = document.getElementById('miniCartBody');
    const foot = document.getElementById('miniCartFoot');
    if (!body || !foot) return;
    const items = State.getCart().filter(i => !i.savedForLater);
    if (!items.length){
      body.innerHTML = Components.emptyState('Your bag is empty', 'Add products you love and they will show up here.', '<a href="shop.html" class="btn btn-primary btn-sm">Start Shopping</a>');
      foot.innerHTML = '';
      return;
    }
    body.innerHTML = items.map(i => `
      <div class="mini-item" data-key="${i.key}">
        ${Utils.lazyImg(i.image, i.title)}
        <div class="mini-item-info">
          <span class="name">${Utils.esc(i.title)}</span>
          <span class="meta">Qty ${i.qty} · ${Utils.formatPrice(i.price)}</span>
          <button class="mini-remove" data-remove="${i.key}">Remove</button>
        </div>
      </div>`).join('');
    const subtotal = State.cartSubtotal();
    foot.innerHTML = `
      <div class="mini-row-total"><span>Subtotal</span><span class="price-mono">${Utils.formatPrice(subtotal)}</span></div>
      <a href="cart.html" class="btn btn-outline btn-block" style="margin-bottom:10px;">View Bag</a>
      <a href="checkout.html" class="btn btn-primary btn-block">Checkout</a>`;
    body.querySelectorAll('[data-remove]').forEach(btn => {
      btn.addEventListener('click', () => { State.removeFromCart(btn.dataset.remove); Components.toast('Removed from bag'); });
    });
  }
  window.renderMiniCart = renderMiniCart;

  // ---------- Global add-to-cart / wishlist delegation ----------
  document.addEventListener('click', async (e) => {
    const addBtn = e.target.closest('[data-addcart]');
    const wishBtn = e.target.closest('[data-wish]');
    const qvBtn = e.target.closest('[data-quickview]');

    if (addBtn){
      const id = +addBtn.dataset.addcart;
      const product = await API.getProductById(id);
      if (product){ State.addToCart(product, 1); Components.toast('Added to your cart'); }
    }
    if (wishBtn){
      const id = +wishBtn.dataset.wish;
      const product = await API.getProductById(id);
      if (product){
        const active = State.toggleWishlist(product);
        wishBtn.classList.toggle('active', active);
        wishBtn.innerHTML = active ? Components.iconSvg('heartFill') : Components.iconSvg('heart');
        Components.toast(active ? 'Added to wishlist' : 'Removed from wishlist');
      }
    }
    if (qvBtn){
      const id = +qvBtn.dataset.quickview;
      openQuickView(id);
    }
  });

  // ---------- Quick View ----------
  async function openQuickView(id){
    const modal = document.getElementById('quickViewModal');
    const bg = document.getElementById('modalOverlayBg');
    const bodyEl = document.getElementById('quickViewBody');
    bodyEl.innerHTML = `<div class="qv-grid"><div class="qv-media skeleton"></div><div><div class="sk-line skeleton" style="height:20px;width:70%"></div></div></div>`;
    modal.classList.add('open'); bg.classList.add('open'); document.body.style.overflow='hidden';
    const p = await API.getProductById(id);
    if (!p){ bodyEl.innerHTML = Components.errorState('Product unavailable.'); return; }
    let qty = 1;
    bodyEl.innerHTML = `
      <div class="qv-grid">
        <div class="qv-media">${Utils.lazyImg(p.thumbnail, p.title)}</div>
        <div>
          <span class="eyebrow">${Utils.esc(Utils.titleCase(p.category))}</span>
          <h2 class="pd-title" style="font-size:26px;margin:10px 0;">${Utils.esc(p.title)}</h2>
          ${Components.starsHtml(p.rating)}
          <div class="pd-price-row" style="margin-top:14px;">
            <span class="pd-price" style="font-size:22px;">${Utils.formatPrice(p.price)}</span>
            ${p.originalPrice ? `<span class="pd-price-old">${Utils.formatPrice(p.originalPrice)}</span>` : ''}
          </div>
          <p class="pd-desc" style="margin:16px 0;">${Utils.esc(p.description).slice(0,160)}${p.description.length>160?'…':''}</p>
          <div class="pd-row">
            <div class="qty-selector">
              <button id="qvMinus">−</button><span id="qvQty">1</span><button id="qvPlus">+</button>
            </div>
          </div>
          <div class="pd-cta-row">
            <button class="btn btn-primary" id="qvAddCart">Add to Cart</button>
            <a href="product.html?id=${p.id}" class="btn btn-outline">Full Details</a>
          </div>
        </div>
      </div>`;
    document.getElementById('qvMinus').addEventListener('click', () => { qty = Utils.clamp(qty-1,1,99); document.getElementById('qvQty').textContent = qty; });
    document.getElementById('qvPlus').addEventListener('click', () => { qty = Utils.clamp(qty+1,1,99); document.getElementById('qvQty').textContent = qty; });
    document.getElementById('qvAddCart').addEventListener('click', () => { State.addToCart(p, qty); Components.toast('Added to your cart'); closeQuickView(); });
  }
  function closeQuickView(){
    document.getElementById('quickViewModal')?.classList.remove('open');
    document.getElementById('modalOverlayBg')?.classList.remove('open');
    document.body.style.overflow='';
  }
  function wireQuickView(){
    document.getElementById('closeQuickView')?.addEventListener('click', closeQuickView);
    document.getElementById('modalOverlayBg')?.addEventListener('click', closeQuickView);
  }
  window.openQuickView = openQuickView;

  // ---------- Search overlay ----------
  function wireSearch(){
    const overlay = document.getElementById('searchOverlay');
    const input = document.getElementById('globalSearchInput');
    const openBtn = document.getElementById('searchBtn');
    const closeBtn = document.getElementById('closeSearch');

    function open(){ overlay.classList.add('open'); document.body.style.overflow='hidden'; renderSearchDefault(); setTimeout(()=>input.focus(), 50); }
    function close(){ overlay.classList.remove('open'); document.body.style.overflow=''; }

    openBtn?.addEventListener('click', open);
    closeBtn?.addEventListener('click', close);
    document.addEventListener('keydown', e => {
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'k'){ e.preventDefault(); open(); }
      if (e.key === 'Escape') close();
    });

    input?.addEventListener('input', Utils.debounce(async () => {
      const q = input.value.trim();
      if (!q){ renderSearchDefault(); return; }
      await renderSearchResults(q);
    }, 300));

    input?.addEventListener('keydown', e => {
      if (e.key === 'Enter' && input.value.trim()){
        State.pushRecentSearch(input.value.trim());
        window.location.href = `shop.html?q=${encodeURIComponent(input.value.trim())}`;
      }
    });
  }

  async function renderSearchDefault(){
    const body = document.getElementById('searchBody');
    if (!body) return;
    const recent = State.getRecentSearches();
    let categoriesHtml = '';
    try{
      const cats = await API.getCategories();
      categoriesHtml = cats.slice(0,8).map(c => `<a class="chip" href="category.html?slug=${encodeURIComponent(c.slug)}">${Utils.esc(Utils.titleCase(c.name))}</a>`).join('');
    }catch(e){ categoriesHtml = '<span style="color:var(--ink-soft);font-size:13px;">Categories unavailable right now.</span>'; }

    body.innerHTML = `
      ${recent.length ? `<div class="search-section"><h4>Recent Searches</h4><div class="chip-row">${recent.map(r => `<button class="chip" data-recent="${Utils.esc(r)}">${Utils.esc(r)}</button>`).join('')}</div></div>` : ''}
      <div class="search-section"><h4>Browse Categories</h4><div class="chip-row">${categoriesHtml}</div></div>
      <div class="search-section" id="suggestedWrap"><h4>Suggested Products</h4><div class="search-results-grid skeleton-grid">${Components.skeletonCard()}${Components.skeletonCard()}${Components.skeletonCard()}${Components.skeletonCard()}</div></div>
    `;
    body.querySelectorAll('[data-recent]').forEach(b => b.addEventListener('click', () => {
      document.getElementById('globalSearchInput').value = b.dataset.recent;
      renderSearchResults(b.dataset.recent);
    }));
    try{
      const { products } = await API.getProducts({ limit: 4, skip: Math.floor(Math.random()*15) });
      document.getElementById('suggestedWrap').innerHTML = `<h4>Suggested Products</h4><div class="search-results-grid">${products.map(p => `
        <a class="search-result-row" href="product.html?id=${p.id}" style="flex-direction:column;align-items:flex-start;">
          ${Utils.lazyImg(p.thumbnail, p.title)}<span style="font-size:12.5px;font-weight:600;margin-top:6px;">${Utils.esc(p.title)}</span><span class="price-mono" style="font-size:12px;">${Utils.formatPrice(p.price)}</span>
        </a>`).join('')}</div>`;
    }catch(e){ /* fail silently in default view */ }
  }

  async function renderSearchResults(q){
    const body = document.getElementById('searchBody');
    body.innerHTML = `<div class="search-section"><h4>Searching…</h4><div class="search-results-grid">${Components.skeletonCard()}${Components.skeletonCard()}${Components.skeletonCard()}${Components.skeletonCard()}</div></div>`;
    try{
      const { products } = await API.searchProducts(q, { limit: 12 });
      if (!products.length){
        body.innerHTML = Components.emptyState('No results found', `We couldn't find anything for "${q}". Try a different search term.`);
        return;
      }
      body.innerHTML = `<div class="search-section"><h4>${products.length} Results for "${Utils.esc(q)}"</h4>
        <div class="search-results-grid">
        ${products.map(p => `
          <a class="search-result-row" href="product.html?id=${p.id}" style="flex-direction:column;align-items:flex-start;">
            ${Utils.lazyImg(p.thumbnail, p.title)}<span style="font-size:12.5px;font-weight:600;margin-top:6px;">${Utils.esc(p.title)}</span><span class="price-mono" style="font-size:12px;">${Utils.formatPrice(p.price)}</span>
          </a>`).join('')}
        </div></div>`;
    }catch(e){
      body.innerHTML = Components.errorState("We couldn't complete this search.", () => renderSearchResults(q));
    }
  }

  // ---------- Compare bar ----------
  function renderCompareBar(){
    const bar = document.getElementById('compareBar');
    const slots = document.getElementById('compareSlots');
    if (!bar || !slots) return;
    const list = State.getCompare();
    bar.classList.toggle('open', list.length > 0);
    slots.innerHTML = list.map(p => `<div class="compare-slot">${Utils.lazyImg(p.thumbnail, p.title)}</div>`).join('');
  }
  function wireCompareBar(){
    document.getElementById('clearCompareBtn')?.addEventListener('click', () => { State.clearCompare(); Components.toast('Comparison cleared'); });
  }

  // ---------- Newsletter (demo) ----------
  function wireNewsletter(){
    document.getElementById('newsletterBtn')?.addEventListener('click', () => {
      const input = document.getElementById('newsletterEmail');
      if (input && input.value.trim()){ Components.toast('Subscribed! Welcome to LUXORA.'); input.value=''; }
      else{ Components.toast('Please enter a valid email'); }
    });
  }
})();

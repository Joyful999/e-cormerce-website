/* LUXORA — components.js
   Renders shared chrome (header/footer) and reusable UI fragments so no
   markup is duplicated across pages. */

const Components = (() => {

  const NAV_LINKS = [
    { href: 'shop.html', label: 'Shop' },
    { href: 'shop.html#categories', label: 'Categories' },
    { href: 'shop.html?sort=newest', label: 'New Arrivals' },
    { href: 'shop.html?sort=rating', label: 'Trending' },
    { href: 'shop.html?deals=1', label: 'Deals' },
  ];

  function iconSvg(name){
    const icons = {
      search: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8"><circle cx="11" cy="11" r="7"/><path d="M21 21l-4.3-4.3"/></svg>',
      user: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8"><circle cx="12" cy="8" r="4"/><path d="M4 21c0-4.4 3.6-7 8-7s8 2.6 8 7"/></svg>',
      heart: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8"><path d="M12 21s-7.5-4.7-10-9.3C.4 8 2 4.5 5.6 4c2-.3 3.8.6 6.4 3.2C14.6 4.6 16.4 3.7 18.4 4c3.6.5 5.2 4 3.6 7.7C19.5 16.3 12 21 12 21z"/></svg>',
      heartFill: '<svg viewBox="0 0 24 24" fill="currentColor"><path d="M12 21s-7.5-4.7-10-9.3C.4 8 2 4.5 5.6 4c2-.3 3.8.6 6.4 3.2C14.6 4.6 16.4 3.7 18.4 4c3.6.5 5.2 4 3.6 7.7C19.5 16.3 12 21 12 21z"/></svg>',
      bag: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8"><path d="M6 8h12l-1 12H7L6 8z"/><path d="M9 8V6a3 3 0 016 0v2"/></svg>',
      close: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8"><path d="M18 6L6 18M6 6l12 12"/></svg>',
      check: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M20 6L9 17l-5-5"/></svg>',
      sun: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8"><circle cx="12" cy="12" r="4"/><path d="M12 2v2M12 20v2M4.9 4.9l1.4 1.4M17.7 17.7l1.4 1.4M2 12h2M20 12h2M4.9 19.1l1.4-1.4M17.7 6.3l1.4-1.4"/></svg>',
      moon: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8"><path d="M21 12.8A9 9 0 1111.2 3 7 7 0 0021 12.8z"/></svg>',
      chevL: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M15 18l-6-6 6-6"/></svg>',
      chevR: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M9 18l6-6-6-6"/></svg>',
      warn: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8"><path d="M12 9v4M12 17h.01M10.3 3.9L1.8 18a2 2 0 001.7 3h17a2 2 0 001.7-3L13.7 3.9a2 2 0 00-3.4 0z"/></svg>',
      grid: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8"><rect x="3" y="3" width="7" height="7"/><rect x="14" y="3" width="7" height="7"/><rect x="3" y="14" width="7" height="7"/><rect x="14" y="14" width="7" height="7"/></svg>',
      list: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8"><path d="M8 6h13M8 12h13M8 18h13M3 6h.01M3 12h.01M3 18h.01"/></svg>',
    };
    return icons[name] || '';
  }

  function headerHTML(){
    const cartN = State.cartCount();
    const wishN = State.getWishlist().length;
    const path = location.pathname.split('/').pop() || 'index.html';
    const navHtml = NAV_LINKS.map(l => `<a href="${l.href}" class="${path==='shop.html' && l.label==='Shop' ? 'active' : ''}">${l.label}</a>`).join('');
    return `
    <header class="site-header">
      <div class="wrap header-inner">
        <button class="hamburger btn-icon" id="hamburgerBtn" aria-label="Open menu">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8"><path d="M3 6h18M3 12h18M3 18h18"/></svg>
        </button>
        <a href="index.html" class="logo">LUXORA<span>Elevated Shopping</span></a>
        <nav class="main-nav" aria-label="Primary">${navHtml}</nav>
        <div class="header-actions">
          <button class="btn-icon" id="searchBtn" aria-label="Search (Ctrl+K)">${iconSvg('search')}</button>
          <button class="btn-icon" id="themeToggle" aria-label="Toggle dark mode">${State.getTheme()==='dark' ? iconSvg('sun') : iconSvg('moon')}</button>
          <a href="account.html" class="btn-icon" aria-label="Account">${iconSvg('user')}</a>
          <a href="wishlist.html" class="btn-icon" aria-label="Wishlist" style="position:relative;">${iconSvg('heart')}${wishN ? `<span class="badge-count" id="wishBadge">${wishN}</span>` : `<span class="badge-count" id="wishBadge" style="display:none;">0</span>`}</a>
          <button class="btn-icon" id="cartBtn" aria-label="Cart" style="position:relative;">${iconSvg('bag')}${cartN ? `<span class="badge-count" id="cartBadge">${cartN}</span>` : `<span class="badge-count" id="cartBadge" style="display:none;">0</span>`}</button>
        </div>
      </div>
    </header>
    <div class="overlay-bg" id="overlayBg"></div>
    <div class="drawer" id="mobileNavDrawer" aria-label="Mobile menu">
      <div class="drawer-head"><span class="logo" style="font-size:20px;">LUXORA</span><button class="btn-icon" id="closeMobileNav">${iconSvg('close')}</button></div>
      <div class="drawer-body">
        <ul style="display:flex;flex-direction:column;gap:4px;">
          ${NAV_LINKS.map(l => `<li><a href="${l.href}" style="display:block;padding:14px 4px;font-weight:600;text-transform:uppercase;font-size:13px;border-bottom:1px solid var(--stone);">${l.label}</a></li>`).join('')}
          <li><a href="wishlist.html" style="display:block;padding:14px 4px;font-weight:600;text-transform:uppercase;font-size:13px;border-bottom:1px solid var(--stone);">Wishlist</a></li>
          <li><a href="account.html" style="display:block;padding:14px 4px;font-weight:600;text-transform:uppercase;font-size:13px;">Account</a></li>
        </ul>
      </div>
    </div>
    <div class="drawer" id="miniCartDrawer" aria-label="Shopping cart">
      <div class="drawer-head"><h3>Your Bag</h3><button class="btn-icon" id="closeMiniCart">${iconSvg('close')}</button></div>
      <div class="drawer-body" id="miniCartBody"></div>
      <div class="drawer-foot" id="miniCartFoot"></div>
    </div>
    <div class="search-overlay" id="searchOverlay">
      <div class="wrap">
        <div class="search-top">
          <div class="search-input-row">
            ${iconSvg('search')}
            <input type="text" id="globalSearchInput" placeholder="Search products, brands, categories…" autocomplete="off">
            <span class="search-hint">ESC</span>
            <button class="btn-icon" id="closeSearch">${iconSvg('close')}</button>
          </div>
        </div>
        <div class="search-body" id="searchBody"></div>
      </div>
    </div>
    <div class="toast-stack" id="toastStack"></div>
    <div class="overlay-bg" id="modalOverlayBg"></div>
    <div class="modal" id="quickViewModal"><button class="btn-icon modal-close" id="closeQuickView">${iconSvg('close')}</button><div class="modal-body" id="quickViewBody"></div></div>
    <div class="compare-bar" id="compareBar">
      <div class="wrap">
        <div style="display:flex;align-items:center;gap:16px;">
          <span class="eyebrow" style="color:var(--bronze);">Compare</span>
          <div class="compare-slots" id="compareSlots"></div>
        </div>
        <div style="display:flex;gap:10px;">
          <button class="btn btn-ghost" style="color:#ccc;" id="clearCompareBtn">Clear</button>
          <a href="compare.html" class="btn btn-bronze btn-sm">Compare Now</a>
        </div>
      </div>
    </div>
    `;
  }

  function footerHTML(){
    return `
    <footer class="site-footer">
      <div class="wrap footer-top">
        <div class="footer-brand">
          <a href="index.html" class="logo">LUXORA</a>
          <p>Elevated shopping, exceptional products. A curated marketplace for the modern lifestyle.</p>
        </div>
        <div class="footer-col"><h4>Shop</h4><ul>
          <li><a href="shop.html">All Products</a></li>
          <li><a href="shop.html?sort=newest">New Arrivals</a></li>
          <li><a href="shop.html?deals=1">Deals</a></li>
          <li><a href="shop.html#categories">Categories</a></li>
        </ul></div>
        <div class="footer-col"><h4>Account</h4><ul>
          <li><a href="account.html">Dashboard</a></li>
          <li><a href="orders.html">Order History</a></li>
          <li><a href="wishlist.html">Wishlist</a></li>
          <li><a href="login.html">Sign In</a></li>
        </ul></div>
        <div class="footer-col"><h4>Company</h4><ul>
          <li><a href="#">About LUXORA</a></li>
          <li><a href="#">Careers</a></li>
          <li><a href="#">Sustainability</a></li>
          <li><a href="#">Contact</a></li>
        </ul></div>
        <div class="footer-col footer-newsletter"><h4>Stay Updated</h4>
          <p style="font-size:13px;color:#9C9A94;">Sign up for early access to new arrivals & offers.</p>
          <input type="email" placeholder="Email address" id="newsletterEmail">
          <button class="btn btn-bronze btn-block" style="margin-top:10px;" id="newsletterBtn">Subscribe</button>
        </div>
      </div>
      <div class="wrap footer-bottom">
        <span>© ${new Date().getFullYear()} LUXORA. All rights reserved. Demo storefront — no real transactions occur.</span>
        <span>HTML5 · CSS3 · Vanilla JS</span>
      </div>
    </footer>`;
  }

  function starsHtml(rating, count){
    return `<span class="pc-rating"><span class="stars">${Utils.starString(rating)}</span> ${rating.toFixed(1)}${count!==undefined ? ` <span style="opacity:.7;">(${count})</span>`: ''}</span>`;
  }

  function productCard(p){
    const wished = State.isWishlisted(p.id);
    return `
    <article class="product-card" data-id="${p.id}">
      <div class="pc-media">
        <div class="pc-badges">
          ${p.discount > 0 ? `<span class="badge badge-sale">-${p.discount}%</span>` : ''}
          ${p.isNew ? `<span class="badge badge-new">New</span>` : ''}
        </div>
        <button class="pc-wish ${wished?'active':''}" data-wish="${p.id}" aria-label="Toggle wishlist">${wished ? iconSvg('heartFill') : iconSvg('heart')}</button>
        <a href="product.html?id=${p.id}">${Utils.lazyImg(p.thumbnail, p.title)}</a>
        <div class="pc-quick"><button class="btn btn-primary btn-sm btn-block" data-quickview="${p.id}">Quick View</button></div>
      </div>
      <div class="pc-body">
        <span class="pc-cat">${Utils.esc(Utils.titleCase(p.category))}</span>
        <h3 class="pc-title"><a href="product.html?id=${p.id}">${Utils.esc(p.title)}</a></h3>
        ${starsHtml(p.rating)}
        <div class="pc-price-row">
          <span class="pc-price">${Utils.formatPrice(p.price)}</span>
          ${p.originalPrice ? `<span class="pc-price-old">${Utils.formatPrice(p.originalPrice)}</span>` : ''}
        </div>
        <button class="btn btn-outline btn-sm pc-add" data-addcart="${p.id}">Add to Cart</button>
      </div>
    </article>`;
  }

  function skeletonCard(){
    return `<div class="skeleton-card">
      <div class="sk-media skeleton"></div>
      <div class="sk-line skeleton"></div>
      <div class="sk-line sm skeleton"></div>
      <div class="sk-line sm skeleton"></div>
    </div>`;
  }

  function skeletonGrid(n=8){
    return `<div class="grid-products">${Array(n).fill(0).map(skeletonCard).join('')}</div>`;
  }

  function errorState(msg = "We couldn't load these products.", retryFn){
    const id = 'retry_' + Math.random().toString(36).slice(2,8);
    setTimeout(() => { const b = document.getElementById(id); if (b && retryFn) b.addEventListener('click', retryFn); }, 0);
    return `<div class="state-block">
      <div class="state-icon">${iconSvg('warn')}</div>
      <h3>${Utils.esc(msg)}</h3>
      <p>Something interrupted the connection. Please check your network and try again.</p>
      <button class="btn btn-primary" id="${id}">Try Again</button>
    </div>`;
  }

  function emptyState(title, sub, ctaHtml=''){
    return `<div class="state-block">
      <div class="state-icon">${iconSvg('search')}</div>
      <h3>${Utils.esc(title)}</h3>
      <p>${Utils.esc(sub)}</p>
      ${ctaHtml}
    </div>`;
  }

  // ---------- Toast ----------
  function toast(message, type='default'){
    const stack = document.getElementById('toastStack');
    if (!stack) return;
    const el = document.createElement('div');
    el.className = 'toast';
    el.innerHTML = `${iconSvg('check')}<span>${Utils.esc(message)}</span>`;
    stack.appendChild(el);
    setTimeout(() => {
      el.classList.add('leaving');
      setTimeout(() => el.remove(), 320);
    }, 2600);
  }

  return { iconSvg, headerHTML, footerHTML, productCard, skeletonCard, skeletonGrid, errorState, emptyState, toast, starsHtml, NAV_LINKS };
})();

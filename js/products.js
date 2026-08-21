/* LUXORA — products.js
   Page logic for: index.html (home), shop.html / category.html (discovery),
   product.html (detail). Registered on window.PageInit. */

window.PageInit = window.PageInit || {};

/* ================================ HOME ================================ */
window.PageInit.home = async function () {
  renderRecentlyViewed('homeRecentWrap');
  await renderCategories();
  await renderFeatured();
  await renderDeals();
};

async function renderCategories(){
  const mount = document.getElementById('categoryGrid');
  if (!mount) return;
  mount.innerHTML = Array(6).fill('<div class="skeleton" style="aspect-ratio:3/3.6;border-radius:6px;"></div>').join('');
  try{
    const cats = await API.getCategories();
    const featured = cats.slice(0, 6);
    const imgFor = (slug) => `https://source.unsplash.com/collection/${Math.abs(hashCode(slug))%9999}/600x720`;
    // Use per-category thumbnail pulled from a representative product instead, more reliable than unsplash collections
    const withThumbs = await Promise.all(featured.map(async c => {
      try{
        const { products } = await API.getProductsByCategory(c.slug, { limit: 1 });
        return { ...c, thumb: products[0]?.thumbnail };
      }catch(e){ return { ...c, thumb: null }; }
    }));
    mount.innerHTML = withThumbs.map(c => `
      <a class="cat-card reveal" href="category.html?slug=${encodeURIComponent(c.slug)}">
        ${Utils.lazyImg(c.thumb, c.name)}
        <div class="cat-info"><small>Explore</small><h3>${Utils.esc(Utils.titleCase(c.name))}</h3></div>
      </a>`).join('');
  }catch(e){
    mount.innerHTML = Components.errorState('Categories unavailable right now.', renderCategories);
  }
}
function hashCode(s){ let h=0; for(let i=0;i<s.length;i++){ h = (h<<5)-h + s.charCodeAt(i); h|=0; } return h; }

async function renderFeatured(){
  const mount = document.getElementById('featuredGrid');
  if (!mount) return;
  mount.innerHTML = Components.skeletonGrid(8);
  try{
    const { products } = await API.getProducts({ limit: 8, skip: 4 });
    mount.innerHTML = products.map(Components.productCard).join('');
  }catch(e){
    mount.innerHTML = Components.errorState('We couldn\'t load featured products.', renderFeatured);
  }
}

async function renderDeals(){
  const mount = document.getElementById('dealsGrid');
  if (!mount) return;
  mount.innerHTML = Components.skeletonGrid(4);
  try{
    const { products } = await API.getProducts({ limit: 40 });
    const deals = products.filter(p => p.discount >= 15).slice(0, 4);
    mount.innerHTML = (deals.length ? deals : products.slice(0,4)).map(Components.productCard).join('');
    startCountdown();
  }catch(e){
    mount.innerHTML = Components.errorState('Deals are unavailable right now.', renderDeals);
  }
}

function startCountdown(){
  const el = document.getElementById('dealCountdown');
  if (!el) return;
  let end = Date.now() + 1000*60*60*8; // demo: 8-hour rolling window
  function tick(){
    const diff = Math.max(0, end - Date.now());
    const h = Math.floor(diff/3600000), m = Math.floor((diff%3600000)/60000), s = Math.floor((diff%60000)/1000);
    el.innerHTML = ['H','M','S'].map((l,i)=>`<div class="countdown-box"><div class="n">${String([h,m,s][i]).padStart(2,'0')}</div><div class="l">${l}</div></div>`).join('');
    if (diff <= 0) end = Date.now() + 1000*60*60*8;
  }
  tick(); setInterval(tick, 1000);
}

function renderRecentlyViewed(mountId){
  const mount = document.getElementById(mountId);
  if (!mount) return;
  const items = State.getRecentlyViewed();
  const section = mount.closest('.section');
  if (!items.length){ if (section) section.style.display = 'none'; return; }
  if (section) section.style.display = '';
  mount.innerHTML = items.map(p => `
    <a class="search-result-row" href="product.html?id=${p.id}" style="flex-direction:column;align-items:flex-start;background:var(--surface);border:1px solid var(--stone);border-radius:6px;padding:14px;">
      ${Utils.lazyImg(p.image, p.title)}
      <span style="font-size:12.5px;font-weight:600;margin-top:8px;">${Utils.esc(p.title)}</span>
      <span class="price-mono" style="font-size:12px;">${Utils.formatPrice(p.price)}</span>
    </a>`).join('');
}

/* ============================ SHOP / CATEGORY ============================ */
const ShopPage = {
  all: [],
  filtered: [],
  view: 'grid',
  visibleCount: 12,
  filters: { categories: new Set(), maxPrice: 2000, minRating: 0, sort: 'featured' }
};

window.PageInit.shop = async function () { await initDiscoveryPage(null); };
window.PageInit.category = async function () {
  const slug = Utils.qs('slug');
  await initDiscoveryPage(slug);
};

async function initDiscoveryPage(categorySlug){
  const grid = document.getElementById('productsGrid');
  const titleEl = document.getElementById('discoveryTitle');
  const subEl = document.getElementById('discoverySub');
  if (!grid) return;

  grid.innerHTML = Components.skeletonGrid(9);
  const q = Utils.qs('q');
  const dealsOnly = Utils.qs('deals') === '1';
  const sortQs = Utils.qs('sort');
  if (sortQs) ShopPage.filters.sort = sortQs;

  try{
    let result;
    if (q){ result = await API.searchProducts(q, { limit: 60 }); if (titleEl) titleEl.textContent = `Search: "${q}"`; }
    else if (categorySlug){ result = await API.getProductsByCategory(categorySlug, { limit: 60 }); if (titleEl) titleEl.textContent = Utils.titleCase(categorySlug); }
    else{ result = await API.getProducts({ limit: 60 }); if (titleEl) titleEl.textContent = 'Shop All'; }

    ShopPage.all = dealsOnly ? result.products.filter(p => p.discount > 0) : result.products;
    if (subEl) subEl.textContent = `${ShopPage.all.length} products`;

    await renderFilterPanel();
    applyFiltersAndRender();
    wireToolbar();
  }catch(e){
    grid.innerHTML = Components.errorState("We couldn't load these products.", () => initDiscoveryPage(categorySlug));
  }
}

async function renderFilterPanel(){
  const panel = document.getElementById('filtersPanel');
  const mobilePanel = document.getElementById('mobileFiltersBody');
  if (!panel) return;
  let cats = [];
  try{ cats = await API.getCategories(); }catch(e){ cats = []; }
  const maxPrice = Math.max(200, ...ShopPage.all.map(p => Math.ceil(p.price)));

  const html = `
    <div class="filter-group">
      <h4>Category</h4>
      ${cats.slice(0,10).map(c => `
        <label class="filter-option"><input type="checkbox" value="${c.slug}" class="f-category"> ${Utils.esc(Utils.titleCase(c.name))}</label>`).join('')}
    </div>
    <div class="filter-group">
      <h4>Price</h4>
      <div class="range-row"><span>$0</span><input type="range" id="f-price" min="0" max="${maxPrice}" value="${maxPrice}"><span id="f-price-val">$${maxPrice}</span></div>
    </div>
    <div class="filter-group">
      <h4>Rating</h4>
      ${[4,3,2].map(r => `<label class="filter-option"><input type="radio" name="f-rating" value="${r}"> ${Utils.starString(r)} & up</label>`).join('')}
      <label class="filter-option"><input type="radio" name="f-rating" value="0" checked> Any rating</label>
    </div>
    <button class="btn btn-ghost" id="clearFiltersBtn" style="padding-left:0;">Clear All Filters</button>
  `;
  panel.innerHTML = html;
  if (mobilePanel) mobilePanel.innerHTML = html.replaceAll(/id="([a-z-]+)"/gi, (m,id) => `id="m-${id}"`).replaceAll('class="f-category"','class="f-category mobile"');

  function wire(root, prefix=''){
    root.querySelectorAll('.f-category').forEach(cb => cb.addEventListener('change', () => {
      cb.checked ? ShopPage.filters.categories.add(cb.value) : ShopPage.filters.categories.delete(cb.value);
      applyFiltersAndRender(); syncFilterUI();
    }));
    const priceEl = root.querySelector(`#${prefix}f-price`);
    priceEl?.addEventListener('input', () => {
      ShopPage.filters.maxPrice = +priceEl.value;
      root.querySelector(`#${prefix}f-price-val`).textContent = '$' + priceEl.value;
      applyFiltersAndRender(); syncFilterUI();
    });
    root.querySelectorAll(`input[name="${prefix}f-rating"]`).forEach(r => r.addEventListener('change', () => {
      if (r.checked){ ShopPage.filters.minRating = +r.value; applyFiltersAndRender(); syncFilterUI(); }
    }));
    root.querySelector(`#${prefix}clearFiltersBtn`)?.addEventListener('click', () => {
      ShopPage.filters = { categories:new Set(), maxPrice, minRating:0, sort: ShopPage.filters.sort };
      applyFiltersAndRender(); renderFilterPanel();
    });
  }
  wire(panel);
  if (mobilePanel) wire(mobilePanel, 'm-');
}

function syncFilterUI(){ /* checkbox/radio states already reflect user interaction directly */ }

function wireToolbar(){
  const sortSel = document.getElementById('sortSelect');
  if (sortSel){ sortSel.value = ShopPage.filters.sort; sortSel.addEventListener('change', () => { ShopPage.filters.sort = sortSel.value; applyFiltersAndRender(); }); }
  document.getElementById('gridViewBtn')?.addEventListener('click', () => setView('grid'));
  document.getElementById('listViewBtn')?.addEventListener('click', () => setView('list'));
  document.getElementById('loadMoreBtn')?.addEventListener('click', () => { ShopPage.visibleCount += 9; applyFiltersAndRender(); });
  document.getElementById('mobileFilterBtn')?.addEventListener('click', () => LuxoraDrawers.openDrawer(document.getElementById('mobileFiltersDrawer')));
  document.getElementById('closeMobileFilters')?.addEventListener('click', () => LuxoraDrawers.closeAllDrawers());
}

function setView(v){
  ShopPage.view = v;
  document.getElementById('gridViewBtn')?.classList.toggle('active', v==='grid');
  document.getElementById('listViewBtn')?.classList.toggle('active', v==='list');
  document.getElementById('productsGrid')?.classList.toggle('grid-products', v==='grid');
  applyFiltersAndRender();
}

function applyFiltersAndRender(){
  const grid = document.getElementById('productsGrid');
  const countEl = document.getElementById('resultsCount');
  if (!grid) return;
  let list = ShopPage.all.filter(p => {
    if (ShopPage.filters.categories.size && !ShopPage.filters.categories.has(p.category)) return false;
    if (p.price > ShopPage.filters.maxPrice) return false;
    if (p.rating < ShopPage.filters.minRating) return false;
    return true;
  });

  switch (ShopPage.filters.sort){
    case 'price-asc': list.sort((a,b) => a.price - b.price); break;
    case 'price-desc': list.sort((a,b) => b.price - a.price); break;
    case 'rating': list.sort((a,b) => b.rating - a.rating); break;
    case 'newest': list.sort((a,b) => (b.isNew?1:0) - (a.isNew?1:0) || b.id - a.id); break;
    default: break; // featured = API order
  }

  ShopPage.filtered = list;
  if (countEl) countEl.textContent = `${list.length} product${list.length!==1?'s':''}`;

  const visible = list.slice(0, ShopPage.visibleCount);
  if (!visible.length){
    grid.innerHTML = Components.emptyState('No products match your filters', 'Try adjusting or clearing your filters to see more results.', '<button class="btn btn-primary" id="emptyClearBtn">Clear Filters</button>');
    document.getElementById('emptyClearBtn')?.addEventListener('click', () => document.getElementById('clearFiltersBtn')?.click());
  } else if (ShopPage.view === 'list') {
    grid.innerHTML = visible.map(p => `
      <div class="product-card" style="display:grid;grid-template-columns:180px 1fr;">
        <div class="pc-media" style="aspect-ratio:1;">${Utils.lazyImg(p.thumbnail,p.title)}</div>
        <div class="pc-body">
          <span class="pc-cat">${Utils.esc(Utils.titleCase(p.category))}</span>
          <h3 class="pc-title"><a href="product.html?id=${p.id}">${Utils.esc(p.title)}</a></h3>
          ${Components.starsHtml(p.rating)}
          <p style="font-size:12.5px;color:var(--ink-soft);margin:4px 0;">${Utils.esc(p.description).slice(0,110)}…</p>
          <div class="pc-price-row"><span class="pc-price">${Utils.formatPrice(p.price)}</span>${p.originalPrice?`<span class="pc-price-old">${Utils.formatPrice(p.originalPrice)}</span>`:''}</div>
          <button class="btn btn-outline btn-sm pc-add" data-addcart="${p.id}" style="max-width:180px;">Add to Cart</button>
        </div>
      </div>`).join('');
  } else {
    grid.innerHTML = visible.map(Components.productCard).join('');
  }
  const loadMoreWrap = document.getElementById('loadMoreWrap');
  if (loadMoreWrap) loadMoreWrap.style.display = visible.length < list.length ? 'flex' : 'none';
}

/* =============================== PRODUCT =============================== */
window.PageInit.product = async function () {
  const id = +Utils.qs('id');
  const mount = document.getElementById('productMount');
  if (!id){ window.location.href = '404.html'; return; }
  mount.innerHTML = `<div class="pd-grid"><div class="skeleton" style="aspect-ratio:1;border-radius:14px;"></div><div><div class="skeleton" style="height:30px;width:80%;margin-bottom:14px;"></div><div class="skeleton" style="height:16px;width:40%;"></div></div></div>`;
  try{
    const p = await API.getProductById(id);
    if (!p){ window.location.href = '404.html'; return; }
    document.title = `${p.title} — LUXORA`;
    State.pushRecentlyViewed(p);
    renderProduct(p);
    renderRelated(p);
    renderRecentlyViewed('pdRecentWrap');
  }catch(e){
    mount.innerHTML = Components.errorState("We couldn't load this product.", window.PageInit.product);
  }
};

function renderProduct(p){
  const mount = document.getElementById('productMount');
  let activeImg = 0, qty = 1, activeColor = 0;
  function media(){
    return `
      <div class="pd-gallery-main" id="pdMainImg">
        <button class="pd-gallery-nav prev" id="pdPrev">${Components.iconSvg('chevL')}</button>
        ${Utils.lazyImg(p.images[activeImg], p.title)}
        <button class="pd-gallery-nav next" id="pdNext">${Components.iconSvg('chevR')}</button>
      </div>
      <div class="pd-thumbs">${p.images.map((img,i) => `<img src="${img}" class="${i===activeImg?'active':''}" data-idx="${i}" loading="lazy">`).join('')}</div>`;
  }

  mount.innerHTML = `
    <div class="pd-grid">
      <div>${media()}</div>
      <div class="pd-info">
        <span class="eyebrow">${Utils.esc(Utils.titleCase(p.category))} ${p.stock < 10 ? `<span class="demo-tag">Only ${p.stock} left</span>` : ''}</span>
        <h1 class="pd-title">${Utils.esc(p.title)}</h1>
        <div class="pd-rating-row">${Components.starsHtml(p.rating, p.reviews.length || 24)} <a href="#reviewsTab" style="text-decoration:underline;">See reviews</a></div>
        <div class="pd-price-row">
          <span class="pd-price">${Utils.formatPrice(p.price)}</span>
          ${p.originalPrice ? `<span class="pd-price-old">${Utils.formatPrice(p.originalPrice)}</span><span class="badge badge-sale">-${p.discount}%</span>` : ''}
        </div>
        <p class="pd-desc">${Utils.esc(p.description)}</p>
        <div class="pd-row">
          <div>
            <div class="eyebrow" style="margin-bottom:8px;">Color</div>
            <div style="display:flex;gap:10px;" id="pdColors">
              ${p.colors.map((c,i) => `<span class="color-dot ${i===activeColor?'active':''}" data-idx="${i}" style="background:${c};"></span>`).join('')}
            </div>
          </div>
        </div>
        <div class="pd-row">
          <div>
            <div class="eyebrow" style="margin-bottom:8px;">Quantity</div>
            <div class="qty-selector"><button id="pdMinus">−</button><span id="pdQty">1</span><button id="pdPlus">+</button></div>
          </div>
        </div>
        <div class="pd-cta-row">
          <button class="btn btn-primary" id="pdAddCart" ${p.stock===0?'disabled':''}>${p.stock===0?'Out of Stock':'Add to Cart'}</button>
          <button class="btn btn-bronze" id="pdBuyNow" ${p.stock===0?'disabled':''}>Buy Now</button>
        </div>
        <button class="btn btn-outline btn-block" id="pdWishBtn">${State.isWishlisted(p.id) ? '♥ In Wishlist' : '♡ Add to Wishlist'}</button>
        <div class="share-row">
          <button class="btn-icon" id="pdCompareBtn" title="Add to compare">${Components.iconSvg('grid')}</button>
          <button class="btn-icon" title="Share on X" onclick="window.open('https://twitter.com/intent/tweet?text=' + encodeURIComponent('${Utils.esc(p.title).replace(/'/g,"")}'))">𝕏</button>
          <button class="btn-icon" title="Copy link" id="pdCopyLink">🔗</button>
        </div>
        <div class="pd-meta-list">
          <div><span>Category</span><b>${Utils.esc(Utils.titleCase(p.category))}</b></div>
          <div><span>Brand</span><b>${Utils.esc(Utils.titleCase(p.brand))}</b></div>
          <div><span>Availability</span><b>${p.stock>0 ? 'In Stock' : 'Out of Stock'}</b></div>
        </div>
      </div>
    </div>

    <div class="pd-tabs">
      <button class="pd-tab active" data-tab="desc">Description</button>
      <button class="pd-tab" data-tab="reviews">Reviews (${p.reviews.length || 0})</button>
      <button class="pd-tab" data-tab="shipping">Shipping</button>
    </div>
    <div id="pdTabDesc"><p style="max-width:760px;color:var(--ink-soft);line-height:1.8;">${Utils.esc(p.description)}</p></div>
    <div id="pdTabReviews" style="display:none;" id="reviewsTab">${renderReviews(p)}</div>
    <div id="pdTabShipping" style="display:none;"><p style="color:var(--ink-soft);max-width:600px;">Standard shipping arrives in 3–5 business days. Express options are available at checkout. Returns accepted within 30 days of delivery — demo policy for portfolio purposes.</p></div>
  `;

  // gallery
  function updateGallery(){
    document.getElementById('pdMainImg').querySelector('img').src = p.images[activeImg];
    mount.querySelectorAll('.pd-thumbs img').forEach((im,i) => im.classList.toggle('active', i===activeImg));
  }
  document.getElementById('pdPrev').addEventListener('click', () => { activeImg = (activeImg - 1 + p.images.length) % p.images.length; updateGallery(); });
  document.getElementById('pdNext').addEventListener('click', () => { activeImg = (activeImg + 1) % p.images.length; updateGallery(); });
  mount.querySelectorAll('.pd-thumbs img').forEach(im => im.addEventListener('click', () => { activeImg = +im.dataset.idx; updateGallery(); }));
  document.addEventListener('keydown', e => {
    if (!document.getElementById('pdMainImg')) return;
    if (e.key === 'ArrowLeft') document.getElementById('pdPrev').click();
    if (e.key === 'ArrowRight') document.getElementById('pdNext').click();
  });
  document.getElementById('pdMainImg').addEventListener('click', () => document.getElementById('pdMainImg').querySelector('img').classList.toggle('zoomed'));

  document.getElementById('pdColors').querySelectorAll('.color-dot').forEach(dot => dot.addEventListener('click', () => {
    activeColor = +dot.dataset.idx;
    mount.querySelectorAll('.color-dot').forEach((d,i) => d.classList.toggle('active', i===activeColor));
  }));

  document.getElementById('pdMinus').addEventListener('click', () => { qty = Utils.clamp(qty-1,1,p.stock||99); document.getElementById('pdQty').textContent = qty; });
  document.getElementById('pdPlus').addEventListener('click', () => { qty = Utils.clamp(qty+1,1,p.stock||99); document.getElementById('pdQty').textContent = qty; });
  document.getElementById('pdAddCart').addEventListener('click', () => { State.addToCart(p, qty, p.colors[activeColor]); Components.toast('Added to your cart'); });
  document.getElementById('pdBuyNow').addEventListener('click', () => { State.addToCart(p, qty, p.colors[activeColor]); window.location.href = 'checkout.html'; });
  document.getElementById('pdWishBtn').addEventListener('click', (e) => {
    const active = State.toggleWishlist(p);
    e.target.textContent = active ? '♥ In Wishlist' : '♡ Add to Wishlist';
    Components.toast(active ? 'Added to wishlist' : 'Removed from wishlist');
  });
  document.getElementById('pdCompareBtn').addEventListener('click', () => {
    const res = State.toggleCompare(p);
    Components.toast(res.ok ? 'Updated comparison' : 'You can compare up to 3 products');
  });
  document.getElementById('pdCopyLink').addEventListener('click', () => {
    navigator.clipboard?.writeText(window.location.href).then(() => Components.toast('Link copied'));
  });

  mount.querySelectorAll('.pd-tab').forEach(tab => tab.addEventListener('click', () => {
    mount.querySelectorAll('.pd-tab').forEach(t => t.classList.remove('active'));
    tab.classList.add('active');
    ['desc','reviews','shipping'].forEach(t => {
      document.getElementById('pdTab' + Utils.titleCase(t).replace(/\s/g,'')).style.display = (t===tab.dataset.tab) ? '' : 'none';
    });
  }));
}

function renderReviews(p){
  const reviews = p.reviews || [];
  const breakdown = [5,4,3,2,1].map(star => {
    const count = reviews.filter(r => Math.round(r.rating) === star).length;
    const pct = reviews.length ? Math.round(count/reviews.length*100) : (star===5?60:star===4?25:5);
    return `<div class="rb-row"><span>${star}★</span><div class="rb-bar"><div class="rb-fill" style="width:${pct}%;"></div></div><span>${pct}%</span></div>`;
  }).join('');

  const list = reviews.length ? reviews : [
    { reviewerName: 'Demo Reviewer', rating: Math.round(p.rating), comment: 'Great quality and fast shipping — exactly as described.', date: new Date().toISOString() },
    { reviewerName: 'Demo Reviewer', rating: Math.max(3,Math.round(p.rating)-1), comment: 'Solid product overall, would consider buying again.', date: new Date().toISOString() }
  ];
  const isDemo = !reviews.length;

  return `
    <div style="display:flex;gap:60px;flex-wrap:wrap;">
      <div>
        <div style="font-family:var(--font-display);font-size:52px;">${p.rating.toFixed(1)}</div>
        ${Components.starsHtml(p.rating)}
        <div style="font-size:12px;color:var(--ink-soft);margin-top:4px;">${reviews.length || list.length} reviews</div>
      </div>
      <div class="rating-breakdown">${breakdown}</div>
    </div>
    <div style="margin-top:10px;">
      ${list.map(r => `
        <div class="review-row">
          <div class="review-avatar">${(r.reviewerName||'U').charAt(0).toUpperCase()}</div>
          <div>
            <div class="review-head"><span class="review-name">${Utils.esc(r.reviewerName || 'Verified Buyer')}</span><span class="review-date">${Utils.formatDate(r.date)}</span>${isDemo?'<span class="demo-tag">Demo</span>':''}</div>
            <div class="stars">${Utils.starString(r.rating)}</div>
            <p style="font-size:13.5px;color:var(--ink-soft);margin-top:6px;">${Utils.esc(r.comment)}</p>
          </div>
        </div>`).join('')}
    </div>`;
}

async function renderRelated(p){
  const mount = document.getElementById('relatedGrid');
  if (!mount) return;
  mount.innerHTML = Components.skeletonGrid(4);
  try{
    const { products } = await API.getProductsByCategory(p.category, { limit: 8 });
    const related = products.filter(x => x.id !== p.id).slice(0,4);
    mount.innerHTML = related.length ? related.map(Components.productCard).join('') : Components.emptyState('No related products', 'Check back soon for more from this category.');
  }catch(e){
    mount.innerHTML = Components.errorState('Related products unavailable.', () => renderRelated(p));
  }
}

/* LUXORA — wishlist.js
   Wishlist page: list, remove, move-to-cart, clear all. Also drives the
   compare.html page since both are lightweight localStorage list views. */

window.PageInit = window.PageInit || {};

window.PageInit.wishlist = function(){
  renderWishlistPage();
  document.addEventListener('wishlist:change', renderWishlistPage);
};

function renderWishlistPage(){
  const grid = document.getElementById('wishlistGrid');
  const empty = document.getElementById('wishlistEmpty');
  const countEl = document.getElementById('wishlistCount');
  if (!grid) return;
  const items = State.getWishlist();
  if (countEl) countEl.textContent = items.length;

  if (!items.length){
    grid.style.display = 'none';
    if (empty) empty.style.display = '';
    return;
  }
  grid.style.display = '';
  if (empty) empty.style.display = 'none';

  grid.innerHTML = items.map(p => `
    <div class="product-card" data-id="${p.id}">
      <div class="pc-media">
        <button class="pc-wish active" data-wishremove="${p.id}" aria-label="Remove from wishlist">${Components.iconSvg('heartFill')}</button>
        <a href="product.html?id=${p.id}">${Utils.lazyImg(p.image, p.title)}</a>
      </div>
      <div class="pc-body">
        <h3 class="pc-title"><a href="product.html?id=${p.id}">${Utils.esc(p.title)}</a></h3>
        ${p.rating ? Components.starsHtml(p.rating) : ''}
        <span class="pc-price">${Utils.formatPrice(p.price)}</span>
        <button class="btn btn-primary btn-sm pc-add" data-movetocart="${p.id}">Move to Cart</button>
      </div>
    </div>`).join('');

  grid.querySelectorAll('[data-wishremove]').forEach(b => b.addEventListener('click', () => {
    State.removeFromWishlist(+b.dataset.wishremove); Components.toast('Removed from wishlist');
  }));
  grid.querySelectorAll('[data-movetocart]').forEach(b => b.addEventListener('click', async () => {
    const id = +b.dataset.movetocart;
    const product = await API.getProductById(id);
    if (product){ State.addToCart(product, 1); State.removeFromWishlist(id); Components.toast('Moved to cart'); }
  }));

  document.getElementById('clearWishlistBtn')?.addEventListener('click', () => {
    items.forEach(p => State.removeFromWishlist(p.id));
    Components.toast('Wishlist cleared');
  });
}

/* ---------------- Compare page ---------------- */
window.PageInit.compare = function(){
  renderComparePage();
  document.addEventListener('compare:change', renderComparePage);
};

function renderComparePage(){
  const wrap = document.getElementById('compareWrap');
  const empty = document.getElementById('compareEmpty');
  if (!wrap) return;
  const list = State.getCompare();
  if (!list.length){
    wrap.style.display = 'none';
    if (empty) empty.style.display = '';
    return;
  }
  wrap.style.display = '';
  if (empty) empty.style.display = 'none';

  const rows = [
    { label: 'Image', render: p => `<img src="${p.thumbnail}" style="width:90px;height:90px;object-fit:cover;border-radius:6px;">` },
    { label: 'Name', render: p => `<b>${Utils.esc(p.title)}</b>` },
    { label: 'Price', render: p => Utils.formatPrice(p.price) },
    { label: 'Rating', render: p => `${Utils.starString(p.rating)} ${p.rating.toFixed(1)}` },
    { label: 'Category', render: p => Utils.titleCase(p.category) },
    { label: 'Brand', render: p => Utils.titleCase(p.brand) },
    { label: 'Availability', render: p => p.stock > 0 ? 'In Stock' : 'Out of Stock' },
    { label: 'Description', render: p => `<span style="font-size:12px;">${Utils.esc(p.description).slice(0,90)}…</span>` },
    { label: '', render: p => `<button class="btn btn-outline btn-sm" data-cmp-remove="${p.id}">Remove</button>` }
  ];

  wrap.innerHTML = `<table class="compare-table"><tbody>
    ${rows.map(r => `<tr><th>${r.label}</th>${list.map(p => `<td>${r.render(p)}</td>`).join('')}</tr>`).join('')}
  </tbody></table>`;

  wrap.querySelectorAll('[data-cmp-remove]').forEach(b => b.addEventListener('click', () => {
    State.toggleCompare({ id: +b.dataset.cmpRemove });
  }));
}

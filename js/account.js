/* LUXORA — account.js
   Orders page (history + tracking) and Account dashboard (overview,
   addresses, profile, settings) — all backed by localStorage demo data. */

window.PageInit = window.PageInit || {};

const STATUS_FLOW = ['Processing','Shipped','Out for Delivery','Delivered'];

function statusIndex(order){
  // Deterministically derive a "current" status from order age for demo realism
  const hours = (Date.now() - new Date(order.date).getTime()) / 36e5;
  if (order.status && order.status !== 'Processing') return STATUS_FLOW.indexOf(order.status);
  if (hours > 72) return 3;
  if (hours > 36) return 2;
  if (hours > 6) return 1;
  return 0;
}

/* ============================== ORDERS ============================== */
window.PageInit.orders = function(){
  const confirmId = Utils.qs('confirm');
  if (confirmId) renderConfirmation(confirmId);
  renderOrdersList();
};

function renderConfirmation(orderId){
  const orders = State.getOrders();
  const order = orders.find(o => o.id === orderId);
  const mount = document.getElementById('confirmationMount');
  if (!mount || !order) return;
  mount.style.display = '';
  mount.innerHTML = `
    <div class="state-block card-surface" style="padding:56px 24px;margin-bottom:50px;">
      <div class="confirm-icon">${Components.iconSvg('check')}</div>
      <span class="eyebrow">Order Confirmed</span>
      <h2 style="font-size:30px;margin:10px 0;">Thank you for shopping with LUXORA</h2>
      <p>Order <b>#${order.id}</b></p>
      <p style="font-size:26px;font-family:var(--font-mono);margin:14px 0;">${Utils.formatPrice(order.total)}</p>
      <p>Estimated delivery: <b>${order.eta}</b></p>
      <div style="display:flex;gap:14px;justify-content:center;margin-top:24px;">
        <button class="btn btn-outline" id="viewOrderBtn">View Order</button>
        <a href="shop.html" class="btn btn-primary">Continue Shopping</a>
      </div>
    </div>`;
  document.getElementById('viewOrderBtn')?.addEventListener('click', () => {
    document.getElementById('order-' + order.id)?.scrollIntoView({ behavior:'smooth', block:'center' });
  });
}

function renderOrdersList(){
  const mount = document.getElementById('ordersListMount');
  if (!mount) return;
  const orders = State.getOrders();
  if (!orders.length){
    mount.innerHTML = Components.emptyState('No orders yet', 'Your completed orders will appear here.', '<a href="shop.html" class="btn btn-primary">Start Shopping</a>');
    return;
  }
  mount.innerHTML = orders.map(o => {
    const idx = statusIndex(o);
    const status = STATUS_FLOW[idx];
    return `
    <div class="order-card" id="order-${o.id}">
      <div class="order-head">
        <div>
          <div style="font-weight:700;">#${o.id}</div>
          <div style="font-size:12px;color:var(--ink-soft);">${Utils.formatDate(o.date)} · ${o.items.reduce((s,i)=>s+i.qty,0)} items</div>
        </div>
        <span class="status-pill status-${status.replace(/\s/g,'\\ ')}">${status}</span>
      </div>
      <div class="order-products">${o.items.slice(0,5).map(i => Utils.lazyImg(i.image, i.title)).join('')}</div>
      <div style="display:flex;justify-content:space-between;align-items:center;margin-top:14px;">
        <span class="price-mono" style="font-weight:700;">${Utils.formatPrice(o.total)}</span>
        <button class="btn btn-outline btn-sm" data-trackorder="${o.id}">Track Order</button>
      </div>
    </div>`;
  }).join('');

  mount.querySelectorAll('[data-trackorder]').forEach(b => b.addEventListener('click', () => openTrackingModal(b.dataset.trackorder)));
}

function openTrackingModal(orderId){
  const order = State.getOrders().find(o => o.id === orderId);
  if (!order) return;
  const modal = document.getElementById('quickViewModal');
  const bg = document.getElementById('modalOverlayBg');
  const body = document.getElementById('quickViewBody');
  const idx = statusIndex(order);
  body.innerHTML = `
    <h2 style="margin-bottom:6px;">Order #${order.id}</h2>
    <p style="color:var(--ink-soft);font-size:13px;margin-bottom:30px;">Placed ${Utils.formatDate(order.date)} · Estimated delivery ${order.eta}</p>
    <div class="timeline">
      ${STATUS_FLOW.map((s,i) => `
        <div class="tl-step ${i < idx ? 'done' : i === idx ? 'current' : ''}">
          <div class="tl-dot">${i < idx ? '✓' : i+1}</div>
          <div class="tl-label">${s}</div>
        </div>`).join('')}
    </div>
    <div style="margin-top:36px;">
      ${order.items.map(i => `<div class="mini-item">${Utils.lazyImg(i.image,i.title)}<div class="mini-item-info"><span class="name">${Utils.esc(i.title)}</span><span class="meta">Qty ${i.qty} · ${Utils.formatPrice(i.price)}</span></div></div>`).join('')}
    </div>
    <div class="summary-row total" style="margin-top:14px;"><span>Total</span><span>${Utils.formatPrice(order.total)}</span></div>
  `;
  modal.classList.add('open'); bg.classList.add('open'); document.body.style.overflow='hidden';
}

/* ============================== ACCOUNT ============================== */
window.PageInit.account = function(){
  const user = State.getUser();
  const nameEl = document.getElementById('accountUserName');
  if (nameEl) nameEl.textContent = user ? user.name : 'Guest Shopper';
  renderStats();
  renderProfileForm();
  wireAccountTabs();
};

function renderStats(){
  const mount = document.getElementById('accountStats');
  if (!mount) return;
  const orders = State.getOrders();
  const wishlist = State.getWishlist();
  const pending = orders.filter(o => statusIndex(o) < 3).length;
  const delivered = orders.filter(o => statusIndex(o) === 3).length;
  const stats = [
    { num: orders.length, lbl: 'Total Orders' },
    { num: wishlist.length, lbl: 'Wishlist' },
    { num: pending, lbl: 'Pending' },
    { num: delivered, lbl: 'Delivered' }
  ];
  mount.innerHTML = stats.map(s => `<div class="stat-card"><div class="num">${s.num}</div><div class="lbl">${s.lbl}</div></div>`).join('');

  const recentOrders = document.getElementById('accountRecentOrders');
  if (recentOrders){
    recentOrders.innerHTML = orders.length
      ? orders.slice(0,3).map(o => `<div class="order-card"><div class="order-head"><b>#${o.id}</b><span class="status-pill status-${STATUS_FLOW[statusIndex(o)].replace(/\s/g,'\\ ')}">${STATUS_FLOW[statusIndex(o)]}</span></div><span class="price-mono">${Utils.formatPrice(o.total)}</span></div>`).join('')
      : Components.emptyState('No orders yet', 'Orders you place will show up here.');
  }
}

function renderProfileForm(){
  const form = document.getElementById('profileForm');
  if (!form) return;
  const user = State.getUser() || { name:'', email:'', phone:'' };
  form.querySelector('[name="name"]').value = user.name || '';
  form.querySelector('[name="email"]').value = user.email || '';
  form.querySelector('[name="phone"]').value = user.phone || '';
  form.addEventListener('submit', e => {
    e.preventDefault();
    const fd = Object.fromEntries(new FormData(form).entries());
    State.saveUser({ ...(State.getUser()||{}), ...fd });
    Components.toast('Settings updated');
    document.getElementById('accountUserName').textContent = fd.name || 'Guest Shopper';
  });

  const addrForm = document.getElementById('addressForm');
  if (addrForm){
    const savedAddr = JSON.parse(localStorage.getItem('luxora_address') || 'null') || {};
    Object.entries(savedAddr).forEach(([k,v]) => { const inp = addrForm.querySelector(`[name="${k}"]`); if (inp) inp.value = v; });
    addrForm.addEventListener('submit', e => {
      e.preventDefault();
      const fd = Object.fromEntries(new FormData(addrForm).entries());
      localStorage.setItem('luxora_address', JSON.stringify(fd));
      Components.toast('Address saved');
    });
  }
}

function wireAccountTabs(){
  const tabs = document.querySelectorAll('.account-nav a');
  const panels = document.querySelectorAll('.account-panel');
  tabs.forEach(tab => tab.addEventListener('click', e => {
    e.preventDefault();
    tabs.forEach(t => t.classList.remove('active'));
    tab.classList.add('active');
    panels.forEach(p => p.style.display = p.id === tab.dataset.panel ? '' : 'none');
    if (tab.dataset.panel === 'panel-orders') renderAccountOrders();
    if (tab.dataset.panel === 'panel-wishlist') renderAccountWishlist();
  }));
}

function renderAccountOrders(){
  const mount = document.getElementById('accountOrdersMount');
  if (!mount) return;
  const orders = State.getOrders();
  mount.innerHTML = orders.length ? orders.map(o => `
    <div class="order-card">
      <div class="order-head"><b>#${o.id}</b><span class="status-pill status-${STATUS_FLOW[statusIndex(o)].replace(/\s/g,'\\ ')}">${STATUS_FLOW[statusIndex(o)]}</span></div>
      <div class="order-products">${o.items.slice(0,5).map(i => Utils.lazyImg(i.image,i.title)).join('')}</div>
      <span class="price-mono" style="font-weight:700;">${Utils.formatPrice(o.total)}</span>
    </div>`).join('') : Components.emptyState('No orders yet', 'Your orders will appear here once placed.', '<a href="shop.html" class="btn btn-primary">Shop Now</a>');
}
function renderAccountWishlist(){
  const mount = document.getElementById('accountWishlistMount');
  if (!mount) return;
  const items = State.getWishlist();
  mount.innerHTML = items.length ? `<div class="grid-products">${items.map(p => `
    <div class="product-card"><div class="pc-media">${Utils.lazyImg(p.image,p.title)}</div><div class="pc-body"><h3 class="pc-title">${Utils.esc(p.title)}</h3><span class="pc-price">${Utils.formatPrice(p.price)}</span></div></div>`).join('')}</div>`
    : Components.emptyState('Your wishlist is empty', 'Save products you love for later.', '<a href="shop.html" class="btn btn-primary">Browse Products</a>');
}

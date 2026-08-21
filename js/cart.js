/* LUXORA — cart.js
   Full shopping cart page: line items, quantity changes, save-for-later,
   coupon application, and dynamic subtotal/discount/shipping/tax/total math. */

window.PageInit = window.PageInit || {};

const COUPONS = {
  'LUXORA10': { type: 'percent', value: 10, label: '10% off' },
  'WELCOME15': { type: 'percent', value: 15, label: '15% off' },
  'SAVE20': { type: 'flat', value: 20, label: '$20 off' }
};
const TAX_RATE = 0.08;
const SHIPPING_FLAT = 12;
const FREE_SHIPPING_THRESHOLD = 150;

function getAppliedCoupon(){
  try{ return JSON.parse(sessionStorage.getItem('luxora_coupon') || 'null'); }catch(e){ return null; }
}
function setAppliedCoupon(code){
  if (code) sessionStorage.setItem('luxora_coupon', JSON.stringify({ code, ...COUPONS[code] }));
  else sessionStorage.removeItem('luxora_coupon');
}

function computeTotals(){
  const items = State.getCart().filter(i => !i.savedForLater);
  const subtotal = items.reduce((s,i) => s + i.qty * i.price, 0);
  const coupon = getAppliedCoupon();
  let discount = 0;
  if (coupon){
    discount = coupon.type === 'percent' ? subtotal * (coupon.value/100) : Math.min(coupon.value, subtotal);
  }
  const afterDiscount = Math.max(0, subtotal - discount);
  const shipping = (afterDiscount === 0 || afterDiscount >= FREE_SHIPPING_THRESHOLD) ? 0 : SHIPPING_FLAT;
  const tax = afterDiscount * TAX_RATE;
  const total = afterDiscount + shipping + tax;
  return { items, subtotal, discount, shipping, tax, total, coupon };
}

window.PageInit.cart = function(){
  renderCartPage();
  document.addEventListener('cart:change', renderCartPage);
};

function renderCartPage(){
  const tbody = document.getElementById('cartItemsBody');
  const savedWrap = document.getElementById('savedForLaterWrap');
  const summaryWrap = document.getElementById('cartSummary');
  const emptyWrap = document.getElementById('cartEmptyState');
  const tableWrap = document.getElementById('cartTableWrap');
  if (!tbody) return;

  const all = State.getCart();
  const active = all.filter(i => !i.savedForLater);
  const saved = all.filter(i => i.savedForLater);

  if (!active.length && !saved.length){
    if (tableWrap) tableWrap.style.display = 'none';
    if (summaryWrap) summaryWrap.style.display = 'none';
    if (emptyWrap){
      emptyWrap.style.display = '';
      emptyWrap.innerHTML = Components.emptyState('Your bag is empty', "Looks like you haven't added anything yet.", '<a href="shop.html" class="btn btn-primary">Start Shopping</a>');
    }
    return;
  }
  if (tableWrap) tableWrap.style.display = '';
  if (summaryWrap) summaryWrap.style.display = '';
  if (emptyWrap) emptyWrap.style.display = 'none';

  tbody.innerHTML = active.map(i => `
    <tr class="cart-row" data-key="${i.key}">
      <td>
        <div class="cart-prod">
          ${Utils.lazyImg(i.image, i.title)}
          <div>
            <div style="font-weight:600;font-size:14px;">${Utils.esc(i.title)}</div>
            ${i.color ? `<div style="font-size:12px;color:var(--ink-soft);display:flex;align-items:center;gap:6px;margin-top:4px;">Color <span style="width:12px;height:12px;border-radius:50%;background:${i.color};display:inline-block;"></span></div>` : ''}
            <button class="mini-remove" data-savelater="${i.key}" style="margin-top:6px;">Save for later</button>
          </div>
        </div>
      </td>
      <td class="price-mono">${Utils.formatPrice(i.price)}</td>
      <td>
        <div class="qty-selector">
          <button data-qty-minus="${i.key}">−</button><span>${i.qty}</span><button data-qty-plus="${i.key}">+</button>
        </div>
      </td>
      <td class="price-mono" style="font-weight:700;">${Utils.formatPrice(i.price * i.qty)}</td>
      <td><button class="btn-icon" data-remove="${i.key}" aria-label="Remove">${Components.iconSvg('close')}</button></td>
    </tr>`).join('');

  if (savedWrap){
    savedWrap.style.display = saved.length ? '' : 'none';
    savedWrap.querySelector('#savedItemsGrid').innerHTML = saved.map(i => `
      <div class="product-card" data-key="${i.key}">
        <div class="pc-media">${Utils.lazyImg(i.image, i.title)}</div>
        <div class="pc-body">
          <h3 class="pc-title">${Utils.esc(i.title)}</h3>
          <span class="pc-price">${Utils.formatPrice(i.price)}</span>
          <button class="btn btn-outline btn-sm" data-movecart="${i.key}">Move to Bag</button>
        </div>
      </div>`).join('');
  }

  renderSummary();
  wireCartEvents();
}

function renderSummary(){
  const { subtotal, discount, shipping, tax, total, coupon } = computeTotals();
  const summaryWrap = document.getElementById('cartSummary');
  if (!summaryWrap) return;
  summaryWrap.querySelector('#sumSubtotal').textContent = Utils.formatPrice(subtotal);
  summaryWrap.querySelector('#sumDiscount').textContent = discount ? '-' + Utils.formatPrice(discount) : Utils.formatPrice(0);
  summaryWrap.querySelector('#sumShipping').textContent = shipping === 0 ? 'Free' : Utils.formatPrice(shipping);
  summaryWrap.querySelector('#sumTax').textContent = Utils.formatPrice(tax);
  summaryWrap.querySelector('#sumTotal').textContent = Utils.formatPrice(total);
  const couponWrap = summaryWrap.querySelector('#couponAppliedWrap');
  const couponForm = summaryWrap.querySelector('#couponForm');
  if (coupon){
    couponWrap.style.display = 'flex';
    couponWrap.querySelector('span').textContent = `${coupon.code} applied (${coupon.label})`;
    couponForm.style.display = 'none';
  } else {
    couponWrap.style.display = 'none';
    couponForm.style.display = 'flex';
  }
}

function wireCartEvents(){
  document.querySelectorAll('[data-qty-minus]').forEach(b => b.addEventListener('click', () => {
    const cart = State.getCart(); const item = cart.find(i => i.key === b.dataset.qtyMinus);
    if (item) State.updateQty(item.key, item.qty - 1);
  }));
  document.querySelectorAll('[data-qty-plus]').forEach(b => b.addEventListener('click', () => {
    const cart = State.getCart(); const item = cart.find(i => i.key === b.dataset.qtyPlus);
    if (item) State.updateQty(item.key, item.qty + 1);
  }));
  document.querySelectorAll('[data-remove]').forEach(b => b.addEventListener('click', () => { State.removeFromCart(b.dataset.remove); Components.toast('Item removed'); }));
  document.querySelectorAll('[data-savelater]').forEach(b => b.addEventListener('click', () => { State.toggleSaveForLater(b.dataset.savelater); Components.toast('Saved for later'); }));
  document.querySelectorAll('[data-movecart]').forEach(b => b.addEventListener('click', () => { State.toggleSaveForLater(b.dataset.movecart); Components.toast('Moved to bag'); }));

  const applyBtn = document.getElementById('applyCouponBtn');
  applyBtn?.addEventListener('click', () => {
    const input = document.getElementById('couponInput');
    const code = input.value.trim().toUpperCase();
    if (COUPONS[code]){ setAppliedCoupon(code); Components.toast(`Coupon applied: ${COUPONS[code].label}`); renderSummary(); }
    else{ Components.toast('Invalid coupon code'); }
  });
  document.getElementById('removeCouponBtn')?.addEventListener('click', () => { setAppliedCoupon(null); renderSummary(); Components.toast('Coupon removed'); });
}

window.CartMath = { computeTotals, getAppliedCoupon, COUPONS };

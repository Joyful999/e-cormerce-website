/* LUXORA — checkout.js
   Four-step demo checkout (Information → Shipping → Payment → Review),
   with field validation, a simulated payment form, and order creation
   persisted to localStorage via State.saveOrder. */

window.PageInit = window.PageInit || {};

const Checkout = { step: 1, data: { info:{}, shipping:{}, payment:{} } };

window.PageInit.checkout = function(){
  const { items } = window.CartMath.computeTotals();
  if (!items.length){
    document.getElementById('checkoutMount').innerHTML = Components.emptyState('Your bag is empty', 'Add items to your bag before checking out.', '<a href="shop.html" class="btn btn-primary">Continue Shopping</a>');
    document.getElementById('checkoutSteps').style.display = 'none';
    return;
  }
  renderStepper();
  renderStep();
  renderOrderSummary();
};

function renderStepper(){
  const labels = ['Information','Shipping','Payment','Review'];
  document.getElementById('checkoutSteps').innerHTML = labels.map((l,i) => {
    const n = i+1;
    const cls = n < Checkout.step ? 'done' : (n === Checkout.step ? 'active' : '');
    return `<div class="cstep ${cls}"><div class="cstep-num">${n < Checkout.step ? '✓' : n}</div><div class="cstep-label">${l}</div></div>`;
  }).join('');
}

function renderOrderSummary(){
  const { items, subtotal, discount, shipping, tax, total, coupon } = window.CartMath.computeTotals();
  const el = document.getElementById('checkoutSummary');
  if (!el) return;
  el.innerHTML = `
    <h3 style="margin-bottom:16px;">Order Summary</h3>
    <div style="max-height:260px;overflow-y:auto;margin-bottom:14px;">
      ${items.map(i => `<div class="mini-item">${Utils.lazyImg(i.image,i.title)}<div class="mini-item-info"><span class="name">${Utils.esc(i.title)}</span><span class="meta">Qty ${i.qty} · ${Utils.formatPrice(i.price)}</span></div></div>`).join('')}
    </div>
    <div class="summary-row"><span>Subtotal</span><span>${Utils.formatPrice(subtotal)}</span></div>
    ${coupon ? `<div class="summary-row"><span>Discount (${coupon.code})</span><span>-${Utils.formatPrice(discount)}</span></div>` : ''}
    <div class="summary-row"><span>Shipping</span><span>${shipping===0?'Free':Utils.formatPrice(shipping)}</span></div>
    <div class="summary-row"><span>Tax</span><span>${Utils.formatPrice(tax)}</span></div>
    <div class="summary-row total"><span>Total</span><span>${Utils.formatPrice(total)}</span></div>
  `;
}

function fieldError(input, msg){
  const field = input.closest('.field');
  field.classList.toggle('has-error', !!msg);
  const err = field.querySelector('.field-error');
  if (err) err.textContent = msg || '';
}

function validate(form, rules){
  let ok = true;
  Object.entries(rules).forEach(([name, test]) => {
    const input = form.querySelector(`[name="${name}"]`);
    if (!input) return;
    const msg = test(input.value.trim());
    fieldError(input, msg);
    if (msg) ok = false;
  });
  return ok;
}

function renderStep(){
  renderStepper();
  const mount = document.getElementById('checkoutMount');
  if (Checkout.step === 1) mount.innerHTML = stepInformation();
  else if (Checkout.step === 2) mount.innerHTML = stepShipping();
  else if (Checkout.step === 3) mount.innerHTML = stepPayment();
  else mount.innerHTML = stepReview();
  wireStep();
  window.scrollTo({ top: 0, behavior:'smooth' });
}

function stepInformation(){
  const d = Checkout.data.info;
  return `
    <form id="stepForm" novalidate>
      <h2 style="margin-bottom:22px;">Contact Information</h2>
      <div class="field-row">
        <div class="field"><label>First Name</label><input name="firstName" value="${d.firstName||''}"><span class="field-error"></span></div>
        <div class="field"><label>Last Name</label><input name="lastName" value="${d.lastName||''}"><span class="field-error"></span></div>
      </div>
      <div class="field"><label>Email</label><input name="email" type="email" value="${d.email||''}"><span class="field-error"></span></div>
      <div class="field"><label>Phone</label><input name="phone" value="${d.phone||''}"><span class="field-error"></span></div>
      <button class="btn btn-primary btn-block" type="submit">Continue to Shipping</button>
    </form>`;
}
function stepShipping(){
  const d = Checkout.data.shipping;
  return `
    <form id="stepForm" novalidate>
      <h2 style="margin-bottom:22px;">Shipping Address</h2>
      <div class="field"><label>Address</label><input name="address" value="${d.address||''}"><span class="field-error"></span></div>
      <div class="field-row">
        <div class="field"><label>City</label><input name="city" value="${d.city||''}"><span class="field-error"></span></div>
        <div class="field"><label>State</label><input name="state" value="${d.state||''}"><span class="field-error"></span></div>
      </div>
      <div class="field-row">
        <div class="field"><label>Country</label><input name="country" value="${d.country||''}"><span class="field-error"></span></div>
        <div class="field"><label>Postal Code</label><input name="postal" value="${d.postal||''}"><span class="field-error"></span></div>
      </div>
      <div style="display:flex;gap:12px;">
        <button class="btn btn-outline" type="button" id="backBtn">Back</button>
        <button class="btn btn-primary btn-block" type="submit">Continue to Payment</button>
      </div>
    </form>`;
}
function stepPayment(){
  const d = Checkout.data.payment;
  return `
    <div class="pay-demo-banner">Demo checkout — no real payment will be processed.</div>
    <form id="stepForm" novalidate>
      <h2 style="margin-bottom:22px;">Payment Details</h2>
      <div class="field"><label>Cardholder Name</label><input name="cardName" value="${d.cardName||''}"><span class="field-error"></span></div>
      <div class="field"><label>Card Number</label><input name="cardNumber" maxlength="19" placeholder="4242 4242 4242 4242" value="${d.cardNumber||''}"><span class="field-error"></span></div>
      <div class="field-row">
        <div class="field"><label>Expiry (MM/YY)</label><input name="expiry" placeholder="12/28" value="${d.expiry||''}"><span class="field-error"></span></div>
        <div class="field"><label>CVV</label><input name="cvv" maxlength="4" placeholder="123" value="${d.cvv||''}"><span class="field-error"></span></div>
      </div>
      <div style="display:flex;gap:12px;">
        <button class="btn btn-outline" type="button" id="backBtn">Back</button>
        <button class="btn btn-primary btn-block" type="submit">Review Order</button>
      </div>
    </form>`;
}
function stepReview(){
  const { info, shipping, payment } = Checkout.data;
  const masked = payment.cardNumber ? '•••• ' + payment.cardNumber.replace(/\s/g,'').slice(-4) : '';
  return `
    <h2 style="margin-bottom:22px;">Review Your Order</h2>
    <div class="review-block card-surface" style="padding:20px;">
      <h4>Contact</h4>
      <p>${Utils.esc(info.firstName)} ${Utils.esc(info.lastName)} · ${Utils.esc(info.email)} · ${Utils.esc(info.phone)}</p>
    </div>
    <div class="review-block card-surface" style="padding:20px;">
      <h4>Ship To</h4>
      <p>${Utils.esc(shipping.address)}, ${Utils.esc(shipping.city)}, ${Utils.esc(shipping.state)} ${Utils.esc(shipping.postal)}, ${Utils.esc(shipping.country)}</p>
    </div>
    <div class="review-block card-surface" style="padding:20px;">
      <h4>Payment</h4>
      <p>${Utils.esc(payment.cardName)} · Card ending ${Utils.esc(masked.replace('•••• ',''))}</p>
    </div>
    <div style="display:flex;gap:12px;margin-top:10px;">
      <button class="btn btn-outline" type="button" id="backBtn">Back</button>
      <button class="btn btn-primary btn-block" id="placeOrderBtn">Place Order</button>
    </div>`;
}

function wireStep(){
  document.getElementById('backBtn')?.addEventListener('click', () => { Checkout.step = Math.max(1, Checkout.step - 1); renderStep(); });

  const form = document.getElementById('stepForm');
  if (form){
    form.addEventListener('submit', e => {
      e.preventDefault();
      const fd = new FormData(form);
      const obj = Object.fromEntries(fd.entries());
      let ok = true;

      if (Checkout.step === 1){
        ok = validate(form, {
          firstName: v => v ? '' : 'First name is required',
          lastName: v => v ? '' : 'Last name is required',
          email: v => /^\S+@\S+\.\S+$/.test(v) ? '' : 'Enter a valid email',
          phone: v => v.length >= 7 ? '' : 'Enter a valid phone number'
        });
        if (ok){ Checkout.data.info = obj; Checkout.step = 2; }
      } else if (Checkout.step === 2){
        ok = validate(form, {
          address: v => v ? '' : 'Address is required',
          city: v => v ? '' : 'City is required',
          state: v => v ? '' : 'State is required',
          country: v => v ? '' : 'Country is required',
          postal: v => v.length >= 3 ? '' : 'Enter a valid postal code'
        });
        if (ok){ Checkout.data.shipping = obj; Checkout.step = 3; }
      } else if (Checkout.step === 3){
        ok = validate(form, {
          cardName: v => v ? '' : 'Cardholder name is required',
          cardNumber: v => v.replace(/\s/g,'').length >= 12 ? '' : 'Enter a valid card number',
          expiry: v => /^\d{2}\/\d{2}$/.test(v) ? '' : 'Use MM/YY format',
          cvv: v => v.length >= 3 ? '' : 'Enter a valid CVV'
        });
        if (ok){ Checkout.data.payment = obj; Checkout.step = 4; }
      }
      if (ok) renderStep();
    });
  }

  document.getElementById('placeOrderBtn')?.addEventListener('click', placeOrder);
}

function placeOrder(){
  const { items, subtotal, discount, shipping, tax, total, coupon } = window.CartMath.computeTotals();
  const order = {
    id: 'LX-' + new Date().toISOString().slice(0,10).replaceAll('-','') + '-' + Math.floor(Math.random()*900+100),
    date: new Date().toISOString(),
    items,
    subtotal, discount, shipping, tax, total,
    coupon: coupon ? coupon.code : null,
    info: Checkout.data.info,
    shipping_address: Checkout.data.shipping,
    status: 'Processing',
    eta: '3–5 business days'
  };
  State.saveOrder(order);
  State.clearCart();
  sessionStorage.removeItem('luxora_coupon');
  sessionStorage.setItem('luxora_last_order', order.id);
  window.location.href = 'orders.html?confirm=' + encodeURIComponent(order.id);
}

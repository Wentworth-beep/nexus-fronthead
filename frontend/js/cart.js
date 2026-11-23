// PAGE: /cart.html

let currentCoupon = null;

async function loadCart() {
  const layout = document.getElementById('cartLayout');
  layout.innerHTML = `<div class="empty">Loading…</div>`;

  try {
    const { cart, subtotal } = await api('/api/cart'); // Changed to lowercase api

    if (!cart.items.length) {
      layout.innerHTML = `
        <div class="empty" style="grid-column:1/-1">
          <h3>Your cart is empty</h3>
          <p><a href="/products.html">Start shopping →</a></p>
        </div>`;
      return;
    }

    const discount = currentCoupon?.discount || 0;
    const total = Math.max(0, subtotal - discount);

    layout.innerHTML = `
      <div>
        ${cart.items.map((i) => `
          <div class="cart-item">
            <div class="cart-item-thumb">🎮</div>
            <div class="cart-item-info">
              <div style="font-weight:600;margin-bottom:4px">${i.product.name}</div>
              <div style="color:var(--text-dim);font-size:13px">
                ${formatMoney(i.product.price)} each
              </div>
            </div>
            <input class="qty-input" type="number" min="1" value="${i.quantity}"
              onchange="updateQty('${i.id}', this.value)" />
            <div style="font-weight:700;min-width:80px;text-align:right">
              ${formatMoney(Number(i.product.price) * i.quantity)}
            </div>
            <button class="btn btn-outline btn-sm" onclick="removeItem('${i.id}')">✕</button>
          </div>
        `).join('')}
      </div>
      <div class="summary">
        <h3 style="margin-bottom:16px">Order Summary</h3>
        <div class="summary-row"><span>Subtotal</span><span>${formatMoney(subtotal)}</span></div>
        ${discount
          ? `<div class="summary-row" style="color:var(--success)"><span>Discount</span><span>-${formatMoney(discount)}</span></div>`
          : ''}
        <div class="summary-row total"><span>Total</span><span>${formatMoney(total)}</span></div>
        <div class="form-group" style="margin-top:16px">
          <label>Coupon Code</label>
          <div style="display:flex;gap:8px">
            <input id="couponInput" placeholder="WELCOME10" value="${currentCoupon?.code || ''}" />
            <button class="btn btn-outline btn-sm" onclick="applyCoupon(${subtotal})">Apply</button>
          </div>
        </div>
        <button class="btn btn-primary"
          style="width:100%;justify-content:center;margin-top:12px"
          onclick="checkout()">Checkout</button>
      </div>
    `;
  } catch (e) {
    if (e.status === 401) return (location.href = '/login.html');
    layout.innerHTML = `<div class="empty">${e.message}</div>`;
  }
}

async function updateQty(id, qty) {
  try {
    await api(`/api/cart/${id}`, { method: 'PUT', body: { quantity: Number(qty) } }); // Changed
    loadCart(); updateCartBadge();
  } catch (e) { toast(e.message, 'error'); }
}

async function removeItem(id) {
  try {
    await api(`/api/cart/${id}`, { method: 'DELETE' }); // Changed
    loadCart(); updateCartBadge();
  } catch (e) { toast(e.message, 'error'); }
}

async function applyCoupon(subtotal) {
  const code = document.getElementById('couponInput').value.trim();
  if (!code) return;
  try {
    const data = await api('/api/coupons/validate', { method: 'POST', body: { code, subtotal } }); // Changed
    currentCoupon = { code, discount: data.discount };
    toast('Coupon applied!');
    loadCart();
  } catch (e) { toast(e.message, 'error'); }
}

async function checkout() {
  const button = document.querySelector('[onclick="checkout()"]');
  if (button) {
    button.disabled = true;
    button.textContent = 'Processing order...';
  }
  try {
    const order = await api('/api/orders', {
      method: 'POST',
      body: { couponCode: currentCoupon?.code || null }, // Changed
    });
    
    if (button) button.textContent = 'Opening payment chat...';
    
    await api('/api/messages', {
      method: 'POST',
      body: {
        orderId: order.id,
        body: `I placed order ${order.orderNumber}. Please tell me the available payment methods for the $${Number(order.total).toFixed(2)} amount.`,
      }, // Changed
    });
    
    location.href = `/checkout.html?orderId=${encodeURIComponent(order.id)}`;
  } catch (e) {
    toast(e.message, 'error');
    if (button) {
      button.disabled = false;
      button.textContent = 'Checkout';
    }
  }
}

loadCart();

// PAGE: /account.html, /orders.html, /wishlist.html
// This file handles all three "personal" pages — each page includes it,
// and the code auto-detects which page it is by presence of a DOM id.

// ---------- /account.html ----------
async function renderAccount() {
  const main = document.getElementById('main');
  if (!main) return;

  const user = await requireAuth();
  if (!user) return;

  main.innerHTML = `
    <h1>My Account</h1>
    <div class="form-card" style="margin:24px 0">
      <h2>${user.firstName || 'Gamer'} ${user.lastName || ''}</h2>
      <div style="color:var(--text-dim);text-align:center;margin-bottom:24px">${user.email}</div>
      <div style="display:flex;flex-direction:column;gap:10px">
        <a href="/orders.html" class="btn btn-outline" style="justify-content:center">📦 Order History</a>
        <a href="/wishlist.html" class="btn btn-outline" style="justify-content:center">♥ My Wishlist</a>
        <button class="btn btn-danger" style="justify-content:center" onclick="logout()">Sign Out</button>
      </div>
    </div>
  `;
}

async function logout() {
  try { await API.post('/api/auth/logout'); } catch {}
  location.href = '/';
}

// ---------- /orders.html ----------
async function renderOrders() {
  const main = document.getElementById('ordersMain');
  if (!main) return;

  try {
    const orders = await API.get('/api/orders');
    if (!orders.length) {
      main.innerHTML = `<h1>My Orders</h1>
        <div class="empty"><h3>No orders yet</h3><p><a href="/products.html">Start shopping →</a></p></div>`;
      return;
    }
    main.innerHTML = `<h1>My Orders</h1>` + orders.map((o) => `
      <div class="cart-item" style="flex-direction:column;align-items:stretch;margin-top:16px">
        <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:12px">
          <div>
            <div style="font-weight:700">${o.orderNumber}</div>
            <div style="color:var(--text-dim);font-size:13px">${new Date(o.createdAt).toLocaleString()}</div>
          </div>
          <span class="badge-status ${o.status}">${o.status}</span>
        </div>
        <div style="font-size:14px;color:var(--text-dim)">
          ${o.items.map((i) => `${i.quantity}× item`).join(' · ')}
        </div>
        <div style="font-weight:800;margin-top:8px">Total: ${formatMoney(o.total)}</div>
      </div>
    `).join('');
  } catch (e) {
    if (e.status === 401) return (location.href = '/login.html');
    main.innerHTML = `<div class="empty">${e.message}</div>`;
  }
}

// ---------- /wishlist.html ----------
async function renderWishlist() {
  const main = document.getElementById('wishlistMain');
  if (!main) return;

  try {
    const wl = await API.get('/api/wishlist');
    if (!wl.items.length) {
      main.innerHTML = `<h1>My Wishlist</h1>
        <div class="empty"><h3>Your wishlist is empty</h3><p><a href="/products.html">Browse products →</a></p></div>`;
      return;
    }
    main.innerHTML = `<h1>My Wishlist</h1>
      <div class="product-grid" style="margin-top:24px">
        ${wl.items.map((i) => productCardHTML(i.product)).join('')}
      </div>`;
  } catch (e) {
    if (e.status === 401) return (location.href = '/login.html');
    main.innerHTML = `<div class="empty">${e.message}</div>`;
  }
}

// Auto-dispatch based on which DOM nodes exist
document.addEventListener('DOMContentLoaded', () => {
  if (document.getElementById('main')) renderAccount();
  if (document.getElementById('ordersMain')) renderOrders();
  if (document.getElementById('wishlistMain')) renderWishlist();
});
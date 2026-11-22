// PAGE: /admin/dashboard.html, products.html, orders.html, customers.html, categories.html, settings.html
// Each admin page includes this file; it dispatches based on which element is present.

async function adminGuard() {
  const user = await getCurrentUser();
  if (!user) { location.href = '/login.html'; return null; }
  if (user.role !== 'ADMIN') {
    toast('Admin access required', 'error');
    setTimeout(() => (location.href = '/'), 1000);
    return null;
  }
  return user;
}

// ---------- Dashboard ----------
async function renderDashboard() {
  const el = document.getElementById('adminContent');
  if (!el) return;
  if (!(await adminGuard())) return;

  try {
    const data = await API.get('/api/admin/dashboard');
    el.innerHTML = `
      <div class="stat-grid" style="margin-top:24px">
        <div class="stat-card"><div class="label">Total Users</div><div class="value">${data.stats.users}</div></div>
        <div class="stat-card"><div class="label">Active Products</div><div class="value">${data.stats.products}</div></div>
        <div class="stat-card"><div class="label">Total Orders</div><div class="value">${data.stats.orders}</div></div>
        <div class="stat-card"><div class="label">Revenue</div><div class="value">${formatMoney(data.stats.revenue)}</div></div>
      </div>
      <h2 style="margin:16px 0">Recent Orders</h2>
      <table class="data-table">
        <thead><tr><th>Order</th><th>Customer</th><th>Total</th><th>Status</th><th>Date</th></tr></thead>
        <tbody>
          ${data.recentOrders.map((o) => `
            <tr>
              <td>${o.orderNumber}</td>
              <td>${o.user.email}</td>
              <td>${formatMoney(o.total)}</td>
              <td><span class="badge-status ${o.status}">${o.status}</span></td>
              <td>${new Date(o.createdAt).toLocaleDateString()}</td>
            </tr>
          `).join('')}
        </tbody>
      </table>
    `;
  } catch (e) {
    el.innerHTML = `<div class="empty"><h3>Error</h3><p>${e.message}</p></div>`;
  }
}

// ---------- Products ----------
async function renderAdminProducts() {
  const el = document.getElementById('adminContent');
  if (!el) return;
  if (!(await adminGuard())) return;

  try {
    const products = await API.get('/api/admin/products');
    el.innerHTML = `
      <table class="data-table">
        <thead><tr><th>Name</th><th>Category</th><th>Platform</th><th>Price</th><th>Stock</th></tr></thead>
        <tbody>
          ${products.map((p) => `
            <tr>
              <td>${p.name}</td>
              <td>${p.category.name}</td>
              <td>${p.platform?.name || '—'}</td>
              <td>${formatMoney(p.price)}</td>
              <td>${p.stock}</td>
            </tr>
          `).join('')}
        </tbody>
      </table>
    `;
  } catch (e) {
    el.innerHTML = `<div class="empty">${e.message}</div>`;
  }
}

// ---------- Orders ----------
async function renderAdminOrders() {
  const el = document.getElementById('adminContent');
  if (!el) return;
  if (!(await adminGuard())) return;

  try {
    const orders = await API.get('/api/admin/orders');
    el.innerHTML = `
      <table class="data-table">
        <thead><tr><th>Order</th><th>Customer</th><th>Items</th><th>Total</th><th>Status</th><th>Date</th></tr></thead>
        <tbody>
          ${orders.map((o) => `
            <tr>
              <td>${o.orderNumber}</td>
              <td>${o.user.email}</td>
              <td>${o.items.length}</td>
              <td>${formatMoney(o.total)}</td>
              <td><span class="badge-status ${o.status}">${o.status}</span></td>
              <td>${new Date(o.createdAt).toLocaleString()}</td>
            </tr>
          `).join('')}
        </tbody>
      </table>
    `;
  } catch (e) {
    el.innerHTML = `<div class="empty">${e.message}</div>`;
  }
}

// ---------- Customers ----------
async function renderAdminCustomers() {
  const el = document.getElementById('adminContent');
  if (!el) return;
  if (!(await adminGuard())) return;

  try {
    const users = await API.get('/api/admin/users');
    el.innerHTML = `
      <table class="data-table">
        <thead><tr><th>Email</th><th>Role</th><th>Orders</th><th>Status</th><th>Joined</th></tr></thead>
        <tbody>
          ${users.map((u) => `
            <tr>
              <td>${u.email}</td>
              <td>${u.role}</td>
              <td>${u.orders}</td>
              <td>${u.isActive ? '✓ Active' : '✗ Disabled'}</td>
              <td>${new Date(u.createdAt).toLocaleDateString()}</td>
            </tr>
          `).join('')}
        </tbody>
      </table>
    `;
  } catch (e) {
    el.innerHTML = `<div class="empty">${e.message}</div>`;
  }
}

// ---------- Dispatch by presence of specific DOM markers ----------
document.addEventListener('DOMContentLoaded', () => {
  const page = document.body.dataset.adminPage;
  if (page === 'dashboard')  renderDashboard();
  if (page === 'products')   renderAdminProducts();
  if (page === 'orders')     renderAdminOrders();
  if (page === 'customers')  renderAdminCustomers();
});
const API = '';

async function api(path, options = {}) {
  const isFormData = options.body instanceof FormData;
  const res = await fetch(`${API}${path}`, {
    credentials: 'include',
    headers: isFormData ? (options.headers || {}) : { 'Content-Type': 'application/json', ...(options.headers || {}) },
    ...options,
    body: options.body && typeof options.body !== 'string' && !isFormData
      ? JSON.stringify(options.body)
      : options.body,
  });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) {
    const msg = data.error || data.errors?.[0]?.msg || 'Request failed';
    throw new Error(msg);
  }
  return data;
}

function toast(message, type = 'success', notify = true) {
  let wrap = document.querySelector('.toast-wrap');
  if (!wrap) {
    wrap = document.createElement('div');
    wrap.className = 'toast-wrap';
    wrap.setAttribute('aria-live', 'polite');
    wrap.setAttribute('aria-atomic', 'false');
    document.body.appendChild(wrap);
  }
  const el = document.createElement('div');
  el.className = `toast ${type}`;
  el.setAttribute('role', type === 'error' ? 'alert' : 'status');
  el.textContent = message;
  wrap.appendChild(el);
  if (notify) addNotification(message, type);
  setTimeout(() => el.remove(), 3500);
}

function getNotifications() {
  try {
    return JSON.parse(localStorage.getItem('nexus_notifications') || '[]');
  } catch {
    return [];
  }
}

function addNotification(message, type = 'success') {
  const notifications = getNotifications();
  notifications.unshift({
    id: `${Date.now()}-${Math.random().toString(36).slice(2)}`,
    message,
    type,
    read: false,
    createdAt: new Date().toISOString(),
  });
  localStorage.setItem('nexus_notifications', JSON.stringify(notifications.slice(0, 20)));
  updateNotificationBadge();
}

function updateNotificationBadge() {
  const unread = getNotifications().filter((item) => !item.read).length;
  document.querySelectorAll('.notification-count').forEach((badge) => {
    badge.textContent = unread;
    badge.style.display = unread > 0 ? '' : 'none';
  });
}

function toggleNotificationPanel() {
  const panel = document.querySelector('.notification-panel');
  if (!panel) return;
  panel.hidden = !panel.hidden;
  if (!panel.hidden) {
    getNotifications().forEach((item) => { item.read = true; });
    const notifications = getNotifications().map((item) => ({ ...item, read: true }));
    localStorage.setItem('nexus_notifications', JSON.stringify(notifications));
    updateNotificationBadge();
  }
}

function clearNotifications() {
  localStorage.removeItem('nexus_notifications');
  const panel = document.querySelector('.notification-list');
  if (panel) panel.innerHTML = '<p class="notification-empty">No notifications</p>';
  updateNotificationBadge();
}

function escapeHTML(value) {
  return String(value)
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;')
    .replaceAll("'", '&#039;');
}

function notificationPanelHTML() {
  const items = getNotifications();
  return `
    <div class="notification-panel" hidden>
      <div class="notification-head">
        <strong>Notifications</strong>
        <button type="button" onclick="clearNotifications()">Clear</button>
      </div>
      <div class="notification-list">
        ${items.length ? items.map((item) => `
          <div class="notification-item ${item.type}">
            <span>${item.type === 'error' ? '!' : '✓'}</span>
            <div>
              <p>${escapeHTML(item.message)}</p>
              <time>${new Date(item.createdAt).toLocaleString()}</time>
            </div>
          </div>`).join('') : '<p class="notification-empty">No notifications</p>'}
      </div>
    </div>`;
}

function formatMoney(n) {
  return new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(Number(n));
}

async function getCurrentUser() {
  try {
    const data = await api('/api/auth/me');
    return data.user;
  } catch {
    return null;
  }
}

async function requireAdminPage() {
  const user = await getCurrentUser();
  if (!user) {
    toast('Please sign in to access the admin panel', 'error');
    setTimeout(() => (location.href = '/login.html'), 500);
    return null;
  }
  if (user.role !== 'ADMIN') {
    toast('Admin access required', 'error');
    setTimeout(() => (location.href = '/'), 500);
    return null;
  }
  return user;
}

async function updateCartBadge() {
  try {
    const data = await api('/api/cart');
    const count = data.cart.items.reduce((s, i) => s + i.quantity, 0);
    document.querySelectorAll('.cart-count').forEach(el => {
      el.textContent = count;
      el.style.display = count > 0 ? '' : 'none';
    });
  } catch { /* not logged in */ }
}

async function renderHeader() {
  const user = await getCurrentUser();
  const actions = document.querySelector('.header-actions');
  if (!actions) return;
  const accountBtn = user
    ? `<a class="icon-btn" href="/account.html" title="${user.email}">👤</a>`
    : `<a class="btn btn-outline btn-sm" href="/login.html">Sign in</a>`;
  actions.innerHTML = `
    ${accountBtn}
    <div class="notification-wrap">
      <button class="icon-btn" type="button" title="Notifications" onclick="toggleNotificationPanel()" aria-label="Notifications">
        🔔<span class="badge notification-count" style="display:none">0</span>
      </button>
      ${notificationPanelHTML()}
    </div>
    <a class="icon-btn" href="/wishlist.html" title="Wishlist">♥</a>
    <a class="icon-btn" href="/cart.html" title="Cart">🛒<span class="badge cart-count" style="display:none">0</span></a>
  `;
  updateCartBadge();
  updateNotificationBadge();

}

function productCardHTML(p) {
  const hasSale = p.comparePrice && Number(p.comparePrice) > Number(p.price);
  const discount = hasSale ? Math.round((1 - Number(p.price) / Number(p.comparePrice)) * 100) : 0;
  const icon = p.category?.name?.includes('Steam') ? '🎮'
    : p.category?.name?.includes('PlayStation') ? '🎯'
    : p.category?.name?.includes('Xbox') ? '🎮'
    : '🎁';
  return `
    <div class="product-card">
      <a href="/product-details.html?id=${p.id}" class="product-thumb">
        ${hasSale ? `<span class="sale-tag">-${discount}%</span>` : ''}
        ${p.imageUrl ? `<img src="${p.imageUrl}" alt="${escapeHTML(p.name)}" style="width:100%;height:100%;object-fit:cover" />` : icon}
      </a>
      <div class="product-info">
        <a href="/product-details.html?id=${p.id}" class="product-title">${p.name}</a>
        <div class="product-meta">${p.category?.name || ''} ${p.platform ? '· ' + p.platform.name : ''}</div>
        ${p.rating ? `<div class="product-rating" style="color:#f59e0b;font-size:13px" aria-label="${p.rating} out of 5 stars">${'★'.repeat(p.rating)}${'☆'.repeat(5 - p.rating)}</div>` : ''}
        <div class="product-price-row">
          <span class="price">${formatMoney(p.price)}</span>
          ${hasSale ? `<span class="price-old">${formatMoney(p.comparePrice)}</span>` : ''}
        </div>
      </div>
      <div class="product-actions">
        <button class="btn btn-primary btn-sm" onclick="addToCart('${p.id}')">Add to Cart</button>
        <button class="btn btn-outline btn-sm" onclick="addToWishlist('${p.id}')" title="Wishlist">♥</button>
      </div>
    </div>
  `;
}

async function addToCart(productId) {
  try {
    await api('/api/cart', { method: 'POST', body: { productId, quantity: 1 } });
    toast('Added to cart!');
    updateCartBadge();
  } catch (e) {
    if (e.message.includes('Not authenticated')) {
      window.location.href = '/login.html';
    } else toast(e.message, 'error');
  }
}

async function addToWishlist(productId) {
  try {
    await api('/api/wishlist', { method: 'POST', body: { productId } });
    toast('Added to wishlist!');
  } catch (e) {
    if (e.message.includes('Not authenticated')) window.location.href = '/login.html';
    else toast(e.message, 'error');
  }
}

function setupMiniAdminChat() {
  if (location.pathname.startsWith('/admin/') || location.pathname === '/admin.html') return;
  if (document.querySelector('.mini-chat-panel')) return;

  const style = document.createElement('style');
  style.textContent = `
    .mini-chat-button { position:fixed; right:24px; bottom:24px; z-index:900; border-radius:999px; box-shadow:var(--shadow); }
    .mini-chat-panel { position:fixed; right:24px; bottom:82px; z-index:901; width:min(360px, calc(100vw - 32px)); height:min(520px, calc(100vh - 120px)); display:grid; grid-template-rows:auto 1fr auto; background:var(--surface); border:1px solid var(--border); border-radius:16px; box-shadow:var(--shadow); overflow:hidden; }
    .mini-chat-panel[hidden] { display:none; }
    .mini-chat-head { display:flex; justify-content:space-between; align-items:center; padding:12px 14px; border-bottom:1px solid var(--border); }
    .mini-chat-messages { overflow-y:auto; padding:12px; }
    .mini-chat-bubble { max-width:82%; margin-bottom:8px; padding:8px 10px; font-size:14px; clear:both; }
    .mini-chat-bubble.admin-message { margin-right:auto !important; border-radius:12px 12px 12px 4px; background:#334155 !important; color:#ffffff !important; border:1px solid #64748b; }
    .mini-chat-bubble.client-message { margin-left:auto !important; border-radius:12px 12px 4px 12px; background:#0e7490 !important; color:#ffffff !important; border:1px solid #22d3ee; }
    .mini-chat-bubble.sent { margin-left:auto; }
    .mini-chat-bubble:not(.sent) { margin-right:auto; }
    .mini-chat-bubble .mini-chat-author { display:block; font-size:10px; font-weight:700; margin-bottom:2px; opacity:.85; }
    .mini-chat-footer { border-top:1px solid var(--border); }
    .mini-chat-options { display:flex; gap:6px; flex-wrap:wrap; padding:8px 10px 0; }
    .mini-chat-options button { font-size:12px; padding:6px 9px; border:1px solid var(--border); border-radius:999px; background:var(--surface-2); color:var(--text); }
    .mini-chat-bubble time { display:block; font-size:10px; opacity:.75; margin-top:3px; }
    .mini-chat-form { display:flex; gap:8px; padding:10px; border-top:1px solid var(--border); }
    .mini-chat-form input { flex:1; min-width:0; border:1px solid var(--border); border-radius:8px; background:var(--bg); color:var(--text); padding:9px 10px; }
  `;
  document.head.appendChild(style);

  const panel = document.createElement('section');
  panel.className = 'mini-chat-panel';
  panel.hidden = true;
  panel.innerHTML = `
    <div class="mini-chat-head">
      <strong>Chat with Admin</strong>
      <button type="button" class="btn btn-outline btn-sm" id="miniChatClose">Close</button>
    </div>
    <div class="mini-chat-messages" id="miniChatMessages"><div class="empty">Loading...</div></div>
    <div class="mini-chat-footer">
      <div class="mini-chat-options" id="miniChatOptions">
        <button type="button" data-reply="Show me the available payment methods">Payment methods</button>
        <button type="button" data-reply="I have made the payment. I will send the details.">I paid</button>
        <button type="button" data-reply="I need help with this order.">Need help</button>
      </div>
      <form class="mini-chat-form" id="miniChatForm">
        <input id="miniChatInput" placeholder="Type a message..." autocomplete="off" required />
        <button id="miniChatSend" class="btn btn-primary btn-sm" type="submit">Send</button>
      </form>
    </div>
  `;
  document.body.append(panel);

  let activeOrderId = null;
  let conversationMessages = [];

  document.getElementById('miniChatClose').addEventListener('click', () => { panel.hidden = true; });

  document.getElementById('miniChatOptions').addEventListener('click', (e) => {
    const option = e.target.closest('[data-reply]');
    if (!option) return;
    const input = document.getElementById('miniChatInput');
    input.value = option.dataset.reply;
    input.dispatchEvent(new Event('input', { bubbles: true }));
    input.focus();
    input.setSelectionRange(input.value.length, input.value.length);
  });

  window.openAdminChat = function(orderId) {
    activeOrderId = orderId || null;
    panel.hidden = false;
    loadMessages();
  };

  async function loadMessages() {
    try {
      const user = await getCurrentUser();
      if (!user) {
        location.href = '/login.html';
        return;
      }
      conversationMessages = await api('/api/messages');
      renderMessages();
    } catch (e) {
      document.getElementById('miniChatMessages').innerHTML = `<div class="empty">${escapeHTML(e.message)}</div>`;
    }
  }

  function renderMessages() {
    const thread = conversationMessages.filter(m =>
      !activeOrderId || m.orderId === activeOrderId
    );
    const container = document.getElementById('miniChatMessages');
    container.innerHTML = thread.length ? thread.map(m => `
      <div class="mini-chat-bubble ${m.sender.role.name === 'ADMIN' ? 'admin-message' : 'client-message sent'}">
        <span class="mini-chat-author">${m.sender.role.name === 'ADMIN' ? 'Admin' : 'You'}</span>
        ${escapeHTML(m.body)}
        <time>${new Date(m.createdAt).toLocaleString()}</time>
      </div>
    `).join('') : '<div class="empty">No messages yet. Send an admin a message.</div>';
    container.scrollTop = container.scrollHeight;
  }

  document.getElementById('miniChatForm').addEventListener('submit', async (e) => {
    e.preventDefault();
    const input = document.getElementById('miniChatInput');
    const send = document.getElementById('miniChatSend');
    send.disabled = true;
    send.textContent = 'Sending...';
    try {
      const message = await api('/api/messages', {
        method: 'POST',
        body: { orderId: activeOrderId, body: input.value },
      });
      conversationMessages.push(message);
      input.value = '';
      renderMessages();
    } catch (e) {
      toast(e.message, 'error');
    } finally {
      send.disabled = false;
      send.textContent = 'Send';
    }
  });

  setInterval(async () => {
    if (panel.hidden) return;
    try {
      const latest = await api('/api/messages');
      if (JSON.stringify(latest) !== JSON.stringify(conversationMessages)) {
        conversationMessages = latest;
        renderMessages();
      }
    } catch {}
  }, 5000);
}

document.addEventListener('click', (event) => {
  const clientOption = event.target.closest('[data-reply]');
  if (clientOption) {
    const input = document.getElementById('miniChatInput');
    if (input) {
      input.value = clientOption.dataset.reply;
      input.focus();
      input.setSelectionRange(input.value.length, input.value.length);
    }
  }

  const adminOption = event.target.closest('[data-admin-reply]');
  if (adminOption) {
    const input = document.getElementById('chatInput');
    if (input) {
      input.value = adminOption.dataset.adminReply;
      input.focus();
      input.setSelectionRange(input.value.length, input.value.length);
    }
  }
});

function setupAdminOrderSound() {
  if (!location.pathname.startsWith('/admin/')) return;

  let audioContext = null;
  function unlockAudio() {
    if (!audioContext) audioContext = new (window.AudioContext || window.webkitAudioContext)();
    if (audioContext.state === 'suspended') audioContext.resume();
  }
  document.addEventListener('pointerdown', unlockAudio, { once: true });

  function playOrderSound() {
    try {
      unlockAudio();
      const now = audioContext.currentTime;
      [0, 0.16].forEach((delay, index) => {
        const oscillator = audioContext.createOscillator();
        const gain = audioContext.createGain();
        oscillator.frequency.value = index ? 880 : 660;
        gain.gain.setValueAtTime(0.12, now + delay);
        gain.gain.exponentialRampToValueAtTime(0.001, now + delay + 0.12);
        oscillator.connect(gain);
        gain.connect(audioContext.destination);
        oscillator.start(now + delay);
        oscillator.stop(now + delay + 0.12);
      });
    } catch {}
  }

  async function pollOrders() {
    try {
      const user = await getCurrentUser();
      if (user?.role !== 'ADMIN') return;
      const orders = await api('/api/admin/orders');
      const key = 'nexus_admin_order_ids';
      let previous;
      try { previous = JSON.parse(localStorage.getItem(key) || '[]'); } catch { previous = []; }
      const ids = orders.map(order => order.id);
      const hasNewOrder = previous.length > 0 && ids.some(id => !previous.includes(id));
      if (hasNewOrder) {
        playOrderSound();
        toast('A new order has arrived', 'success', false);
      }
      localStorage.setItem(key, JSON.stringify(ids));
    } catch {}
  }

  pollOrders();
  setInterval(pollOrders, 5000);
}

document.addEventListener('DOMContentLoaded', () => {
  renderHeader();
  setupAdminOrderSound();
  setupMiniAdminChat();

  // Currency selector (cosmetic)
  const currency = document.getElementById('currencySelect');
  if (currency) {
    currency.addEventListener('change', () => toast(`Display currency: ${currency.value}`, 'success'));
  }

  // Search
  const searchForm = document.getElementById('searchForm');
  if (searchForm) {
    searchForm.addEventListener('submit', (e) => {
      e.preventDefault();
      const q = searchForm.querySelector('input').value.trim();
      window.location.href = `/products.html${q ? '?q=' + encodeURIComponent(q) : ''}`;
    });
  }
});
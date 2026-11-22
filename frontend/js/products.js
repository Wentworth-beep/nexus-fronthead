// PAGE: /products.html

const params = new URLSearchParams(location.search);
const state = {
  q: params.get('q') || '',
  category: params.get('category') || '',
  platform: '',
  sort: '',
  page: 1,
};

async function loadFilters() {
  const categories = await API.get('/api/categories');
  const catSel = document.getElementById('filterCategory');
  categories.forEach((c) => {
    const o = document.createElement('option');
    o.value = c.slug; o.textContent = c.name;
    catSel.appendChild(o);
  });
  if (state.category) catSel.value = state.category;

  // Derive platform list from a broad fetch
  const broad = await API.get('/api/products?limit=100');
  const platforms = [...new Set(broad.items.map((p) => p.platform?.name).filter(Boolean))];
  const platSel = document.getElementById('filterPlatform');
  platforms.forEach((p) => {
    const o = document.createElement('option'); o.value = p; o.textContent = p;
    platSel.appendChild(o);
  });
}

function skeletonHTML() {
  return Array.from({ length: 6 }).map(() => `
    <div class="product-card">
      <div class="product-thumb skeleton"></div>
      <div class="product-info">
        <div class="skeleton" style="height:14px;margin-bottom:8px"></div>
        <div class="skeleton" style="height:12px;width:60%"></div>
      </div>
    </div>
  `).join('');
}

async function loadProducts() {
  const grid = document.getElementById('productGrid');
  grid.innerHTML = skeletonHTML();

  try {
    const qs = new URLSearchParams();
    if (state.q) qs.set('q', state.q);
    if (state.category) qs.set('category', state.category);
    if (state.platform) qs.set('platform', state.platform);
    if (state.sort) qs.set('sort', state.sort);
    qs.set('page', state.page);
    qs.set('limit', 24);

    const data = await API.get('/api/products?' + qs);
    if (!data.items.length) {
      grid.innerHTML = `<div class="empty" style="grid-column:1/-1"><h3>No products found</h3><p>Try adjusting your filters.</p></div>`;
      return;
    }
    grid.innerHTML = data.items.map(productCardHTML).join('');
  } catch (e) {
    grid.innerHTML = `<div class="empty" style="grid-column:1/-1"><h3>Error</h3><p>${e.message}</p></div>`;
  }
}

function bindFilters() {
  document.getElementById('filterCategory').addEventListener('change', (e) => {
    state.category = e.target.value; state.page = 1; loadProducts();
  });
  document.getElementById('filterPlatform').addEventListener('change', (e) => {
    state.platform = e.target.value; state.page = 1; loadProducts();
  });
  document.getElementById('filterSort').addEventListener('change', (e) => {
    state.sort = e.target.value; state.page = 1; loadProducts();
  });
}

(async function init() {
  try {
    await loadFilters();
    bindFilters();
    await loadProducts();
  } catch (e) {
    document.getElementById('productGrid').innerHTML =
      `<div class="empty" style="grid-column:1/-1"><h3>Error</h3><p>${e.message}</p></div>`;
  }
})();
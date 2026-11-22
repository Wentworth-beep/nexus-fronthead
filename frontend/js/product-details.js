// PAGE: /product-details.html

const productId = new URLSearchParams(location.search).get('id');

async function loadProduct() {
  const main = document.getElementById('main');
  if (!productId) {
    main.innerHTML = `<div class="empty"><h3>Product not found</h3></div>`;
    return;
  }

  main.innerHTML = `<div class="empty">Loading…</div>`;

  try {
    const { product, related } = await API.get(`/api/products/${productId}`);
    const hasSale = product.comparePrice && Number(product.comparePrice) > Number(product.price);

    main.innerHTML = `
      <a href="/products.html" style="font-size:14px">← Back to shop</a>
      <div style="display:grid;grid-template-columns:1fr 1fr;gap:40px;margin-top:20px" class="product-detail-grid">
        <div class="product-thumb" style="aspect-ratio:1;font-size:90px;border-radius:16px">🎮</div>
        <div>
          <div class="product-meta" style="font-size:13px">
            ${product.category.name}${product.platform ? ' · ' + product.platform.name : ''}${product.region ? ' · ' + product.region.name : ''}
          </div>
          <h1 style="margin:10px 0;font-size:32px;letter-spacing:-1px">${product.name}</h1>
          <div class="product-price-row" style="margin-bottom:20px">
            <span class="price" style="font-size:28px">${formatMoney(product.price)}</span>
            ${hasSale ? `<span class="price-old" style="font-size:16px">${formatMoney(product.comparePrice)}</span>` : ''}
          </div>
          <p style="color:var(--text-dim);margin-bottom:24px;line-height:1.7">${product.description}</p>
          <div style="margin-bottom:24px">
            <span style="color:${product.stock > 0 ? 'var(--success)' : 'var(--danger)'};font-weight:600">
              ${product.stock > 0 ? `✓ In stock (${product.stock} available)` : '✗ Out of stock'}
            </span>
          </div>
          <div style="display:flex;gap:12px">
            <button class="btn btn-primary" style="flex:1;justify-content:center"
              ${product.stock === 0 ? 'disabled' : ''}
              onclick="addToCart('${product.id}')">Add to Cart</button>
            <button class="btn btn-outline" onclick="addToWishlist('${product.id}')">♥ Wishlist</button>
          </div>
        </div>
      </div>
      <div class="section">
        <div class="section-head"><h2>Related Products</h2></div>
        <div class="product-grid">${related.map(productCardHTML).join('')}</div>
      </div>
    `;
  } catch (e) {
    main.innerHTML = `<div class="empty"><h3>Not found</h3><p>${e.message}</p></div>`;
  }
}

loadProduct();
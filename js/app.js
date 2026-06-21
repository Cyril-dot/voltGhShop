// ===== TOAST NOTIFICATIONS =====
function showToast(msg, type = 'success') {
  const icons = { success: '✅', error: '❌', warning: '⚠️', info: 'ℹ️' };
  const container = document.getElementById('toast-container');
  const toast = document.createElement('div');
  toast.className = `toast ${type}`;
  toast.innerHTML = `
    <span class="toast-icon">${icons[type]}</span>
    <span class="toast-msg">${msg}</span>
    <span class="toast-close" onclick="this.parentElement.remove()">✕</span>
  `;
  container.appendChild(toast);
  setTimeout(() => toast.style.opacity = '0', 3500);
  setTimeout(() => toast.remove(), 3800);
}

// ===== DARK MODE =====
function initDarkMode() {
  const saved = localStorage.getItem('phonix_dark');
  if (saved === 'true') document.body.classList.add('dark');
  document.getElementById('dark-toggle')?.addEventListener('click', () => {
    document.body.classList.toggle('dark');
    localStorage.setItem('phonix_dark', document.body.classList.contains('dark'));
    updateDarkIcon();
  });
  updateDarkIcon();
}

function updateDarkIcon() {
  const btn = document.getElementById('dark-toggle');
  if (btn) btn.innerHTML = document.body.classList.contains('dark') ? '☀️' : '🌙';
}

// ===== PAGE ROUTING =====
const App = {
  currentPage: 'home',
  currentProduct: null,

  navigate(page, data = null) {
    document.querySelectorAll('.page').forEach(p => p.classList.remove('active'));
    const target = document.getElementById(`page-${page}`);
    if (target) {
      target.classList.add('active');
      this.currentPage = page;
      window.scrollTo({ top: 0, behavior: 'smooth' });

      if (page === 'home') renderHome();
      if (page === 'shop') renderShop();
      if (page === 'product' && data) renderProductDetail(data);
      if (page === 'checkout') renderCheckout();
      if (page === 'cart') renderCartPage();
      if (page === 'wishlist') renderWishlistPage();
      if (page === 'tracking') renderTracking();
      if (page === 'search') renderSearch(data);

      updateMobileNav(page);
    }
  }
};

function updateMobileNav(page) {
  document.querySelectorAll('.mobile-nav-item').forEach(i => {
    i.classList.toggle('active', i.dataset.page === page);
  });
}

// ===== CART UI =====
function openCart() {
  document.getElementById('cart-overlay').classList.add('active');
  document.getElementById('cart-sidebar').classList.add('active');
  renderCartSidebar();
}

function closeCart() {
  document.getElementById('cart-overlay').classList.remove('active');
  document.getElementById('cart-sidebar').classList.remove('active');
}

function renderCartSidebar() {
  const cart = StorageService.getCart();
  const cartItems = document.getElementById('cart-items');
  const cartCount = document.getElementById('cart-count-side');

  if (cartItems) cartCount && (cartCount.textContent = cart.length);

  if (!cartItems) return;

  if (cart.length === 0) {
    cartItems.innerHTML = `
      <div class="cart-empty">
        <span class="material-symbols-outlined" style="font-size:3.5rem;color:var(--border);display:block;margin-bottom:16px">shopping_cart</span>
        <h3>Your cart is empty</h3>
        <p>Add some products to get started!</p>
        <button class="btn btn-primary" onclick="closeCart(); App.navigate('shop')" style="margin-top:16px;border-radius:10px">Shop Now</button>
      </div>`;
    updateCartFooter([]);
    return;
  }

  cartItems.innerHTML = cart.map(item => `
    <div class="cart-item">
      <img class="cart-item-img" src="${item.image}" alt="${item.name}" onerror="this.src='https://via.placeholder.com/70x70?text=?'">
      <div class="cart-item-info">
        <div class="cart-item-name">${item.name}</div>
        <div class="cart-item-price">GHS ${(item.price * item.qty).toFixed(2)}</div>
        <div class="qty-control">
          <button class="qty-btn" onclick="updateCartQty('${item.id}', ${item.qty - 1})">−</button>
          <span class="qty-num">${item.qty}</span>
          <button class="qty-btn" onclick="updateCartQty('${item.id}', ${item.qty + 1})">+</button>
        </div>
        <div class="remove-item" onclick="removeFromCart('${item.id}')">
          <span class="material-symbols-outlined" style="font-size:14px">delete</span> Remove
        </div>
      </div>
    </div>
  `).join('');

  updateCartFooter(cart);
}

function updateCartFooter(cart) {
  const subtotal = cart.reduce((s, i) => s + i.price * i.qty, 0);
  const settings = StorageService.getSettings();
  const delivery = subtotal > 0 ? (subtotal >= settings.freeDeliveryThreshold ? 0 : settings.deliveryFee) : 0;
  const total = subtotal + delivery;

  const footer = document.getElementById('cart-footer');
  if (!footer) return;

  footer.innerHTML = `
    <div class="cart-total-row">
      <span>Subtotal</span>
      <strong>GHS ${subtotal.toFixed(2)}</strong>
    </div>
    <div class="cart-total-row">
      <span>Delivery</span>
      <strong>${delivery === 0 ? '<span style="color:var(--success)">FREE</span>' : `GHS ${delivery.toFixed(2)}`}</strong>
    </div>
    <div class="cart-total-row" style="border-top:1px solid var(--border);padding-top:10px;margin-top:10px">
      <span style="font-weight:700">Total</span>
      <strong class="cart-grand-total">GHS ${total.toFixed(2)}</strong>
    </div>
    ${cart.length > 0 ? `
    <div class="cart-btns">
      <button class="btn btn-outline btn-dark" onclick="closeCart(); App.navigate('cart')">View Cart</button>
      <button class="btn btn-primary" onclick="closeCart(); App.navigate('checkout')">Checkout →</button>
    </div>` : ''}
  `;
}

function updateCartBadge() {
  const cart = StorageService.getCart();
  const total = cart.reduce((s, i) => s + i.qty, 0);
  document.querySelectorAll('.cart-badge').forEach(b => {
    b.textContent = total;
    b.style.display = total > 0 ? 'flex' : 'none';
  });
}

function addToCart(product, qty = 1) {
  StorageService.addToCart(product, qty);
  updateCartBadge();
  renderCartSidebar();
  showToast(`${product.name} added to cart! 🛒`);
}

function removeFromCart(productId) {
  StorageService.removeFromCart(productId);
  updateCartBadge();
  renderCartSidebar();
  if (App.currentPage === 'cart') renderCartPage();
}

function updateCartQty(productId, qty) {
  if (qty <= 0) { removeFromCart(productId); return; }
  StorageService.updateCartQty(productId, qty);
  renderCartSidebar();
  if (App.currentPage === 'cart') renderCartPage();
}

// ===== WISHLIST UI =====
function toggleWishlist(product) {
  const list = StorageService.toggleWishlist(product);
  const isWl = list.some(i => i.id === product.id);
  updateWishlistBadge();
  showToast(isWl ? `Added to wishlist ❤️` : `Removed from wishlist`, isWl ? 'success' : 'info');
  return isWl;
}

function updateWishlistBadge() {
  const count = StorageService.getWishlist().length;
  document.querySelectorAll('.wishlist-badge').forEach(b => {
    b.textContent = count;
    b.style.display = count > 0 ? 'flex' : 'none';
  });
}

function openWishlist() {
  document.getElementById('cart-overlay').classList.add('active');
  document.getElementById('wishlist-sidebar').classList.add('active');
  renderWishlistSidebar();
}

function closeWishlist() {
  document.getElementById('cart-overlay').classList.remove('active');
  document.getElementById('wishlist-sidebar').classList.remove('active');
}

function renderWishlistSidebar() {
  const list = StorageService.getWishlist();
  const container = document.getElementById('wishlist-items');
  if (!container) return;

  if (list.length === 0) {
    container.innerHTML = `
      <div class="cart-empty">
        <span class="material-symbols-outlined" style="font-size:3.5rem;color:var(--border);display:block;margin-bottom:16px">favorite</span>
        <h3>Your wishlist is empty</h3>
        <p>Save items you love!</p>
      </div>`;
    return;
  }

  container.innerHTML = list.map(item => `
    <div class="cart-item">
      <img class="cart-item-img" src="${item.image}" alt="${item.name}" onerror="this.src='https://via.placeholder.com/70x70?text=?'">
      <div class="cart-item-info">
        <div class="cart-item-name">${item.name}</div>
        <div class="cart-item-price">GHS ${item.price.toFixed(2)}</div>
        <div style="display:flex;gap:8px;margin-top:8px">
          <button class="btn btn-primary" style="padding:6px 12px;font-size:0.75rem;border-radius:6px" onclick="addToCart(${JSON.stringify(item).replace(/"/g,'&quot;')}); closeWishlist()">Add to Cart</button>
          <div class="remove-item" onclick="removeFromWishlist('${item.id}')">
            <span class="material-symbols-outlined" style="font-size:14px">delete</span> Remove
          </div>
        </div>
      </div>
    </div>
  `).join('');
}

function removeFromWishlist(id) {
  const list = StorageService.getWishlist().filter(i => i.id !== id);
  StorageService.saveWishlist(list);
  updateWishlistBadge();
  renderWishlistSidebar();
}

// ===== PRODUCT CARDS =====
function createProductCard(product) {
  const isWl = StorageService.isWishlisted(product.id);
  const isOut = product.stock <= 0;
  const discount = product.oldPrice ? Math.round((1 - product.price / product.oldPrice) * 100) : 0;

  return `
    <div class="product-card animate-in" onclick="viewProduct('${product.id}')">
      <div class="product-img-wrap">
        <img src="${product.image}" alt="${product.name}" loading="lazy" onerror="this.src='https://via.placeholder.com/300x300?text=VoltGH'">
        ${product.badge ? `<span class="product-badge ${product.badge === 'New' ? 'new' : ''} ${isOut ? 'out' : ''}">${isOut ? 'Out of Stock' : product.badge}</span>` : ''}
        ${discount > 0 ? `<span class="product-badge" style="left:auto;right:12px;top:12px;background:var(--error)">-${discount}%</span>` : ''}
        <div class="product-actions-overlay">
          <button class="overlay-btn ${isWl ? 'wishlisted' : ''}" onclick="event.stopPropagation(); handleWishlist('${product.id}')" title="Wishlist">
            <span class="material-symbols-outlined" style="font-size:18px;font-variation-settings:'FILL' ${isWl ? 1 : 0}">${isWl ? 'favorite' : 'favorite'}</span>
          </button>
          <button class="overlay-btn" onclick="event.stopPropagation(); showQuickView('${product.id}')" title="Quick View">
            <span class="material-symbols-outlined" style="font-size:18px">visibility</span>
          </button>
        </div>
      </div>
      <div class="product-info">
        <div class="product-category">${getCategoryName(product.category)}</div>
        <div class="product-name">${product.name}</div>
        <div class="product-rating">
          <span class="stars" style="display:inline-flex;align-items:center;gap:1px">
            ${Array.from({length:5},(_,i)=>`<span class="material-symbols-outlined" style="font-size:14px;color:#F59E0B;font-variation-settings:'FILL' ${i<Math.round(product.rating||4)?1:0}">star</span>`).join('')}
          </span>
          <span class="rating-count">(${product.reviews || 0})</span>
        </div>
        <div class="product-price">
          <span class="price-current">GHS ${product.price.toFixed(2)}</span>
          ${product.oldPrice ? `<span class="price-old">GHS ${product.oldPrice.toFixed(2)}</span>` : ''}
        </div>
        <button class="btn-add-cart" onclick="event.stopPropagation(); ${isOut ? '' : `addToCart(getProductById('${product.id}'))`}" ${isOut ? 'disabled' : ''}>
          <span class="material-symbols-outlined" style="font-size:16px;font-variation-settings:'FILL' 1">${isOut ? 'remove_shopping_cart' : 'add_shopping_cart'}</span>
          ${isOut ? 'Out of Stock' : 'Add to Cart'}
        </button>
      </div>
    </div>
  `;
}

function getCategoryName(catId) {
  const cats = StorageService.getCategories();
  return cats.find(c => c.id === catId)?.name || 'General';
}

function getProductById(id) {
  return StorageService.getProducts().find(p => p.id === id);
}

function handleWishlist(productId) {
  const product = getProductById(productId);
  if (product) {
    toggleWishlist(product);
    renderCurrentPage();
  }
}

function viewProduct(productId) {
  const product = getProductById(productId);
  if (product) {
    StorageService.addRecentlyViewed(product);
    App.navigate('product', product);
  }
}

function renderCurrentPage() {
  if (App.currentPage === 'home') renderHome();
  if (App.currentPage === 'shop') renderShop();
}

// ===== HOME PAGE =====
function renderHome() {
  renderFeaturedProducts();
  renderCategories();
  renderNewArrivals();
  renderRecentlyViewed();
}

function renderFeaturedProducts() {
  const products = StorageService.getProducts().slice(0, 8);
  const container = document.getElementById('featured-products');
  if (!container) return;
  container.innerHTML = products.map(p => createProductCard(p)).join('');
}

function renderCategories() {
  const cats = StorageService.getCategories();
  const container = document.getElementById('categories-grid');
  if (!container) return;

  container.innerHTML = cats.map(cat => `
    <div class="category-card" onclick="filterByCategory('${cat.id}')">
      <div class="category-icon" style="background:${cat.color}18;color:${cat.color}">
        <span class="material-symbols-outlined cat-mat-icon" style="font-variation-settings:'FILL' 1;color:${cat.color}">${cat.matIcon || 'devices'}</span>
      </div>
      <h3>${cat.name}</h3>
      <span>${StorageService.getProducts().filter(p => p.category === cat.id).length} items</span>
    </div>
  `).join('');
}

function renderNewArrivals() {
  const products = StorageService.getProducts().filter(p => p.isNew).slice(0, 4);
  const container = document.getElementById('new-arrivals');
  if (!container) return;
  container.innerHTML = products.length
    ? products.map(p => createProductCard(p)).join('')
    : '<p style="color:var(--text-muted);text-align:center;grid-column:1/-1">No new arrivals yet</p>';
}

function renderRecentlyViewed() {
  const rv = StorageService.getRecentlyViewed();
  const section = document.getElementById('recently-viewed-section');
  const container = document.getElementById('recently-viewed');
  if (!section || !container) return;
  section.style.display = rv.length > 0 ? 'block' : 'none';
  container.innerHTML = rv.map(p => `
    <div class="rv-item" onclick="viewProduct('${p.id}')">
      <img class="rv-img" src="${p.image}" alt="${p.name}" onerror="this.src='https://via.placeholder.com/140x140'">
      <div class="rv-name">${p.name}</div>
      <div class="rv-price">GHS ${p.price.toFixed(2)}</div>
    </div>
  `).join('');
}

// ===== SHOP PAGE =====
let shopState = { category: 'all', sort: 'default', search: '' };

function renderShop(category = null) {
  if (category) shopState.category = category;
  const products = getFilteredProducts();
  const container = document.getElementById('shop-products');
  if (!container) return;

  container.innerHTML = products.length
    ? products.map(p => createProductCard(p)).join('')
    : `<div class="empty-state" style="grid-column:1/-1">
        <span class="material-symbols-outlined" style="font-size:3.5rem;color:var(--border);display:block;margin-bottom:16px">search</span>
        <h3>No products found</h3>
        <p>Try changing your filters or search term</p>
        <button class="btn btn-primary" onclick="clearShopFilters()">Clear Filters</button>
       </div>`;

  document.getElementById('product-count').textContent = `${products.length} products`;
  renderShopCategories();
}

function filterByCategory(catId) {
  shopState.category = catId;
  App.navigate('shop');
}

function renderShopCategories() {
  const cats = StorageService.getCategories();
  const container = document.getElementById('shop-cat-filters');
  if (!container) return;

  const allBtn = `<button class="filter-tag ${shopState.category === 'all' ? 'active' : ''}" onclick="setShopCategory('all')"><span class="material-symbols-outlined mat-icon-sm">grid_view</span> All</button>`;
  const catBtns = cats.map(c =>
    `<button class="filter-tag ${shopState.category === c.id ? 'active' : ''}" onclick="setShopCategory('${c.id}')"><span class="material-symbols-outlined mat-icon-sm" style="font-variation-settings:'FILL' 1">${c.matIcon || 'devices'}</span> ${c.name}</button>`
  ).join('');

  container.innerHTML = allBtn + catBtns;
}

function setShopCategory(cat) {
  shopState.category = cat;
  renderShop();
}

function getFilteredProducts() {
  let products = StorageService.getProducts();

  if (shopState.category !== 'all') {
    products = products.filter(p => p.category === shopState.category);
  }

  if (shopState.search) {
    const q = shopState.search.toLowerCase();
    products = products.filter(p =>
      p.name.toLowerCase().includes(q) ||
      p.description?.toLowerCase().includes(q)
    );
  }

  switch (shopState.sort) {
    case 'price-asc': products.sort((a, b) => a.price - b.price); break;
    case 'price-desc': products.sort((a, b) => b.price - a.price); break;
    case 'rating': products.sort((a, b) => (b.rating || 0) - (a.rating || 0)); break;
    case 'newest': products.sort((a, b) => (b.isNew ? 1 : 0) - (a.isNew ? 1 : 0)); break;
  }

  return products;
}

function clearShopFilters() {
  shopState = { category: 'all', sort: 'default', search: '' };
  document.getElementById('sort-select').value = 'default';
  renderShop();
}

// ===== PRODUCT DETAIL =====
function renderProductDetail(product) {
  App.currentProduct = product;
  const page = document.getElementById('page-product');
  if (!page) return;

  const images = product.images || [product.image];
  const isWl = StorageService.isWishlisted(product.id);

  page.innerHTML = `
    <div style="max-width:1280px;margin:0 auto;padding:20px">
      <div class="breadcrumb">
        <a onclick="App.navigate('home')" style="cursor:pointer;display:flex;align-items:center;gap:4px">
          <span class="material-symbols-outlined" style="font-size:16px">home</span> Home
        </a>
        <span class="material-symbols-outlined" style="font-size:14px">chevron_right</span>
        <a onclick="App.navigate('shop')" style="cursor:pointer">Shop</a>
        <span class="material-symbols-outlined" style="font-size:14px">chevron_right</span>
        <span>${product.name}</span>
      </div>
    </div>
    <div class="product-detail-page">
      <div class="product-detail-grid">
        <div>
          <div class="gallery-main">
            <img id="main-img" src="${images[0]}" alt="${product.name}" onerror="this.src='https://via.placeholder.com/500x500?text=VoltGH'">
          </div>
          ${images.length > 1 ? `
            <div class="gallery-thumbs">
              ${images.map((img, i) => `
                <div class="gallery-thumb ${i === 0 ? 'active' : ''}" onclick="setMainImg('${img}', this)">
                  <img src="${img}" alt="View ${i + 1}">
                </div>
              `).join('')}
            </div>` : ''}
        </div>

        <div class="product-detail-info">
          <div class="product-detail-category">${getCategoryName(product.category)}</div>
          <h1 class="product-detail-name">${product.name}</h1>

          <div class="product-rating" style="margin-bottom:14px;display:flex;align-items:center;gap:6px">
            <span style="display:inline-flex;align-items:center;gap:1px">
              ${Array.from({length:5},(_,i)=>`<span class="material-symbols-outlined" style="font-size:18px;color:#F59E0B;font-variation-settings:'FILL' ${i<Math.round(product.rating||4)?1:0}">star</span>`).join('')}
            </span>
            <span class="rating-count">${product.reviews || 0} reviews</span>
          </div>

          <div class="product-detail-price">GHS ${product.price.toFixed(2)}
            ${product.oldPrice ? `<span style="font-size:1rem;text-decoration:line-through;color:var(--text-muted);margin-left:8px">GHS ${product.oldPrice.toFixed(2)}</span>` : ''}
          </div>

          <div class="stock-indicator ${product.stock > 5 ? 'in-stock' : product.stock > 0 ? 'low-stock' : 'out-stock'}">
            <div class="stock-dot"></div>
            ${product.stock > 5 ? `In Stock (${product.stock} available)` : product.stock > 0 ? `Low Stock — Only ${product.stock} left!` : 'Out of Stock'}
          </div>

          <p class="product-description">${product.description}</p>

          <div style="display:flex;align-items:center;gap:10px;margin-bottom:20px">
            <div class="qty-control">
              <button class="qty-btn" onclick="changeDetailQty(-1)" style="width:36px;height:36px">
                <span class="material-symbols-outlined" style="font-size:18px">remove</span>
              </button>
              <span class="qty-num" id="detail-qty" style="font-size:1rem;min-width:30px">1</span>
              <button class="qty-btn" onclick="changeDetailQty(1)" style="width:36px;height:36px">
                <span class="material-symbols-outlined" style="font-size:18px">add</span>
              </button>
            </div>
            <span style="font-size:0.8rem;color:var(--text-muted)">Max: ${product.stock}</span>
          </div>

          <div class="detail-btns">
            <button class="btn btn-primary" onclick="addDetailToCart()" ${product.stock === 0 ? 'disabled' : ''} style="padding:13px 24px">
              <span class="material-symbols-outlined mat-icon-sm" style="font-variation-settings:'FILL' 1">add_shopping_cart</span> Add to Cart
            </button>
            <button class="btn btn-dark" onclick="buyNow()" ${product.stock === 0 ? 'disabled' : ''} style="padding:13px 24px">
              <span class="material-symbols-outlined mat-icon-sm" style="font-variation-settings:'FILL' 1">bolt</span> Buy Now
            </button>
            <button class="btn" onclick="handleWishlist('${product.id}')" style="border:1.5px solid var(--border);padding:13px 18px;border-radius:10px">
              <span class="material-symbols-outlined" style="font-size:22px;font-variation-settings:'FILL' ${isWl?1:0};color:${isWl?'#EF4444':'var(--text-muted)'}">favorite</span>
            </button>
          </div>

          <div class="shipping-calc" style="margin-top:20px">
            <h5 style="display:flex;align-items:center;gap:6px">
              <span class="material-symbols-outlined" style="font-size:18px;color:#1D4ED8;font-variation-settings:'FILL' 1">local_shipping</span> Delivery Info
            </h5>
            <p style="font-size:0.8rem;color:var(--text-muted);margin-top:6px">Standard delivery: GHS 50 &nbsp;|&nbsp; Free delivery on orders above GHS 1,000</p>
            <p style="font-size:0.8rem;color:var(--text-muted)">Estimated delivery: 2–5 business days across Ghana</p>
          </div>
        </div>
      </div>

      <div class="detail-tabs" style="max-width:1280px">
        <div class="tab-list">
          <button class="tab-btn active" onclick="switchTab('desc', this)">Description</button>
          <button class="tab-btn" onclick="switchTab('specs', this)">Specifications</button>
          <button class="tab-btn" onclick="switchTab('reviews', this)">Reviews (${product.reviews || 0})</button>
        </div>
        <div id="tab-desc" class="tab-pane active">
          <p style="color:var(--text-muted);line-height:1.9">${product.description}</p>
        </div>
        <div id="tab-specs" class="tab-pane">
          <p style="color:var(--text-muted)">Contact us on WhatsApp for full specifications.</p>
        </div>
        <div id="tab-reviews" class="tab-pane">
          <p style="color:var(--text-muted)">Rated ${product.rating} by ${product.reviews} customers.</p>
        </div>
      </div>
    </div>
  `;
}

let detailQty = 1;
function changeDetailQty(delta) {
  const product = App.currentProduct;
  if (!product) return;
  detailQty = Math.max(1, Math.min(detailQty + delta, product.stock));
  document.getElementById('detail-qty').textContent = detailQty;
}

function addDetailToCart() {
  if (!App.currentProduct) return;
  addToCart(App.currentProduct, detailQty);
  detailQty = 1;
}

function buyNow() {
  if (!App.currentProduct) return;
  addToCart(App.currentProduct, detailQty);
  App.navigate('checkout');
}

function setMainImg(src, el) {
  document.getElementById('main-img').src = src;
  document.querySelectorAll('.gallery-thumb').forEach(t => t.classList.remove('active'));
  el.classList.add('active');
}

function switchTab(id, btn) {
  document.querySelectorAll('.tab-pane').forEach(p => p.classList.remove('active'));
  document.querySelectorAll('.tab-btn').forEach(b => b.classList.remove('active'));
  document.getElementById(`tab-${id}`).classList.add('active');
  btn.classList.add('active');
}

// ===== CART PAGE =====
function renderCartPage() {
  const cart = StorageService.getCart();
  const container = document.getElementById('cart-page-items');
  if (!container) return;

  if (cart.length === 0) {
    document.getElementById('cart-page-content').innerHTML = `
      <div class="empty-state" style="padding:100px 20px">
        <span class="material-symbols-outlined" style="font-size:3.5rem;color:var(--border);display:block;margin-bottom:16px">shopping_cart</span>
        <h3>Your cart is empty</h3>
        <p>Browse our products and add something you like!</p>
        <button class="btn btn-primary" onclick="App.navigate('shop')">Start Shopping</button>
      </div>`;
    return;
  }

  // Re-render full cart page
  const settings = StorageService.getSettings();
  const subtotal = cart.reduce((s, i) => s + i.price * i.qty, 0);
  const delivery = subtotal >= settings.freeDeliveryThreshold ? 0 : settings.deliveryFee;

  container.innerHTML = cart.map(item => `
    <div class="cart-item" style="align-items:center">
      <img class="cart-item-img" src="${item.image}" alt="${item.name}" style="width:90px;height:90px" onerror="this.src='https://via.placeholder.com/90x90'">
      <div class="cart-item-info" style="flex:1">
        <div class="cart-item-name" style="white-space:normal;font-size:1rem">${item.name}</div>
        <div style="font-size:0.85rem;color:var(--text-muted)">${getCategoryName(item.category)}</div>
        <div class="qty-control" style="margin-top:10px">
          <button class="qty-btn" onclick="updateCartQty('${item.id}', ${item.qty - 1})">−</button>
          <span class="qty-num">${item.qty}</span>
          <button class="qty-btn" onclick="updateCartQty('${item.id}', ${item.qty + 1})">+</button>
        </div>
      </div>
      <div style="text-align:right">
        <div style="font-weight:700;color:var(--primary);font-size:1.1rem">GHS ${(item.price * item.qty).toFixed(2)}</div>
        <div style="font-size:0.8rem;color:var(--text-muted)">GHS ${item.price.toFixed(2)} each</div>
        <button onclick="removeFromCart('${item.id}')" style="color:var(--error);font-size:0.8rem;margin-top:8px;display:flex;align-items:center;gap:4px;cursor:pointer"><span class="material-symbols-outlined" style="font-size:14px">delete</span> Remove</button>
      </div>
    </div>
  `).join('');

  // Update summary
  const summary = document.getElementById('cart-page-summary');
  if (summary) summary.innerHTML = `
    <h3 style="margin-bottom:20px">Order Summary</h3>
    <div class="summary-row"><span>Subtotal (${cart.length} items)</span><span>GHS ${subtotal.toFixed(2)}</span></div>
    <div class="summary-row"><span>Delivery</span><span>${delivery === 0 ? '<span style="color:var(--success)">FREE</span>' : `GHS ${delivery.toFixed(2)}`}</span></div>
    <hr class="summary-divider">
    <div class="summary-row total"><span>Total</span><span>GHS ${(subtotal + delivery).toFixed(2)}</span></div>
    <div class="discount-row">
      <input class="discount-input" id="discount-code" placeholder="Promo code..." type="text">
      <button class="btn-apply" onclick="applyDiscount()">Apply</button>
    </div>
    <div id="discount-msg" style="font-size:0.8rem;margin-top:8px"></div>
    <button class="btn btn-primary" style="width:100%;margin-top:16px;justify-content:center;border-radius:10px" onclick="App.navigate('checkout')">Proceed to Checkout →</button>
    <button class="btn" style="width:100%;margin-top:8px;justify-content:center;border:1.5px solid var(--border);border-radius:10px" onclick="App.navigate('shop')">Continue Shopping</button>
  `;
}

let appliedDiscount = null;
function applyDiscount() {
  const code = document.getElementById('discount-code')?.value.trim();
  const cart = StorageService.getCart();
  const subtotal = cart.reduce((s, i) => s + i.price * i.qty, 0);

  const result = StorageService.applyDiscount(code, subtotal);
  const msg = document.getElementById('discount-msg');

  if (!result) {
    msg.innerHTML = '<span style="color:var(--error)">❌ Invalid promo code</span>';
    appliedDiscount = null;
    return;
  }

  appliedDiscount = result;
  msg.innerHTML = `<span style="color:var(--success)">✅ ${result.label} applied! You save GHS ${result.savings.toFixed(2)}</span>`;
  showToast(`Promo code applied! ${result.label}`, 'success');
}

// ===== WISHLIST PAGE =====
function renderWishlistPage() {
  const list = StorageService.getWishlist();
  const container = document.getElementById('wishlist-page');
  if (!container) return;

  container.innerHTML = list.length === 0 ? `
    <div class="empty-state">
      <span class="material-symbols-outlined" style="font-size:3.5rem;color:var(--border);display:block;margin-bottom:16px">favorite</span>
      <h3>Your wishlist is empty</h3>
      <p>Save products you love to come back to them later</p>
      <button class="btn btn-primary" onclick="App.navigate('shop')">Browse Products</button>
    </div>
  ` : `<div class="products-grid">${list.map(p => createProductCard(p)).join('')}</div>`;
}

// ===== CHECKOUT =====
function renderCheckout() {
  const cart = StorageService.getCart();
  if (cart.length === 0) { App.navigate('shop'); showToast('Your cart is empty!', 'warning'); return; }

  const settings = StorageService.getSettings();
  const subtotal = cart.reduce((s, i) => s + i.price * i.qty, 0);
  const savings = appliedDiscount ? appliedDiscount.savings : 0;
  const delivery = (subtotal - savings) >= settings.freeDeliveryThreshold ? 0 : settings.deliveryFee;
  const total = subtotal - savings + delivery;

  const page = document.getElementById('page-checkout');
  if (!page) return;

  page.innerHTML = `
    <div class="checkout-page">
      <div style="max-width:1000px;margin:0 auto">
        <h1 style="margin-bottom:30px;font-size:1.6rem">Checkout</h1>
      </div>
      <div class="checkout-grid">
        <div>
          <!-- DELIVERY INFO -->
          <div class="checkout-form-section" style="margin-bottom:20px">
            <h2><span class="material-symbols-outlined mat-icon-sm" style="color:#1D4ED8;font-variation-settings:'FILL' 1">location_on</span> Delivery Information</h2>
            <div class="form-row">
              <div class="form-group">
                <label>Full Name *</label>
                <input type="text" id="co-name" placeholder="Your full name" required>
              </div>
              <div class="form-group">
                <label>Phone Number *</label>
                <input type="tel" id="co-phone" placeholder="0XX XXX XXXX" required>
              </div>
            </div>
            <div class="form-group">
              <label>Email (optional)</label>
              <input type="email" id="co-email" placeholder="your@email.com">
            </div>
            <div class="form-group">
              <label>Delivery Address *</label>
              <input type="text" id="co-address" placeholder="House number, street, area" required>
            </div>
            <div class="form-row">
              <div class="form-group">
                <label>City *</label>
                <select id="co-city">
                  <option value="">Select city</option>
                  <option>Accra</option><option>Kumasi</option><option>Tamale</option>
                  <option>Takoradi</option><option>Cape Coast</option><option>Ho</option>
                  <option>Sunyani</option><option>Koforidua</option><option>Other</option>
                </select>
              </div>
              <div class="form-group">
                <label>Additional Notes</label>
                <input type="text" id="co-notes" placeholder="Landmark, special instructions...">
              </div>
            </div>
          </div>

          <!-- PAYMENT -->
          <div class="checkout-form-section">
            <h2><span class="material-symbols-outlined mat-icon-sm" style="color:#D97706;font-variation-settings:'FILL' 1">payments</span> Payment via Mobile Money</h2>
            <div class="momo-box">
              <div class="momo-header">
                <div class="momo-icon"><span class="material-symbols-outlined" style="font-size:1.6rem;font-variation-settings:'FILL' 1;color:#92400E">payments</span></div>
                <div>
                  <strong>MTN Mobile Money</strong>
                  <p style="font-size:0.8rem;color:var(--text-muted)">Send payment to the number below</p>
                </div>
              </div>
              <div class="momo-number">
                <strong>${settings.momoNumber}</strong>
                <span>${settings.momoNetwork}</span>
              </div>
              <p style="font-size:0.8rem;color:var(--text-muted);text-align:center;margin-bottom:14px">
                Amount to send: <strong style="color:var(--primary)">GHS ${total.toFixed(2)}</strong>
              </p>
              <div class="form-group">
                <label>MoMo Reference / Transaction ID</label>
                <input type="text" id="co-momo-ref" placeholder="e.g. ABC123456789">
              </div>
              <div class="form-group">
                <label>Payment Screenshot (optional)</label>
                <div class="upload-area" onclick="document.getElementById('screenshot-upload').click()">
                  <span class="material-symbols-outlined" style="font-size:2rem;color:var(--text-muted);display:block;margin-bottom:10px">add_a_photo</span>
                  <p>Click to upload payment screenshot</p>
                  <input type="file" id="screenshot-upload" accept="image/*" style="display:none" onchange="previewScreenshot(this)">
                </div>
                <img id="screenshot-preview" class="img-preview">
                <div id="upload-status" style="font-size:0.8rem;margin-top:6px;color:var(--text-muted)"></div>
              </div>
            </div>

            <button class="paid-btn" style="margin-top:20px" onclick="placeOrder()">
              ✅ I Have Paid — Place Order
            </button>
            <p style="font-size:0.75rem;color:var(--text-muted);text-align:center;margin-top:10px">
              Your order will be confirmed via WhatsApp after payment verification
            </p>
          </div>
        </div>

        <!-- ORDER SUMMARY -->
        <div class="order-summary-box">
          <h3>Order Summary</h3>
          <div id="checkout-items">
            ${cart.map(item => `
              <div class="summary-item">
                <img src="${item.image}" alt="${item.name}" onerror="this.src='https://via.placeholder.com/56x56'">
                <div class="summary-item-info">
                  <div class="summary-item-name">${item.name}</div>
                  <div style="font-size:0.8rem;color:var(--text-muted)">Qty: ${item.qty}</div>
                  <div class="summary-item-price">GHS ${(item.price * item.qty).toFixed(2)}</div>
                </div>
              </div>
            `).join('')}
          </div>
          <hr class="summary-divider">
          <div class="summary-row"><span>Subtotal</span><span>GHS ${subtotal.toFixed(2)}</span></div>
          ${savings > 0 ? `<div class="summary-row" style="color:var(--success)"><span>Discount</span><span>-GHS ${savings.toFixed(2)}</span></div>` : ''}
          <div class="summary-row"><span>Delivery</span><span>${delivery === 0 ? '<span style="color:var(--success)">FREE</span>' : `GHS ${delivery.toFixed(2)}`}</span></div>
          <hr class="summary-divider">
          <div class="summary-row total"><span>Total</span><span>GHS ${total.toFixed(2)}</span></div>

          <div style="margin-top:16px;padding:12px;background:rgba(16,185,129,0.1);border-radius:8px;font-size:0.8rem">
            <span class="material-symbols-outlined" style="font-size:14px;color:#059669;vertical-align:middle">lock</span> Secure checkout. Your info is safe with us.
          </div>
        </div>
      </div>
    </div>
  `;
}

let screenshotUrl = null;

async function previewScreenshot(input) {
  const file = input.files[0];
  if (!file) return;

  const preview = document.getElementById('screenshot-preview');
  const reader = new FileReader();
  reader.onload = (e) => {
    preview.src = e.target.result;
    preview.classList.add('visible');
  };
  reader.readAsDataURL(file);

  const statusEl = document.getElementById('upload-status');
  statusEl.textContent = '⬆️ Uploading screenshot...';

  try {
    const result = await ImgBBService.upload(file);
    screenshotUrl = result.url;
    statusEl.textContent = '✅ Screenshot uploaded successfully!';
    statusEl.style.color = 'var(--success)';
  } catch (err) {
    statusEl.textContent = '⚠️ Could not upload screenshot (saved locally)';
    statusEl.style.color = 'var(--warning)';
  }
}

function placeOrder() {
  const name = document.getElementById('co-name')?.value.trim();
  const phone = document.getElementById('co-phone')?.value.trim();
  const address = document.getElementById('co-address')?.value.trim();
  const city = document.getElementById('co-city')?.value;
  const email = document.getElementById('co-email')?.value.trim();
  const notes = document.getElementById('co-notes')?.value.trim();
  const momoRef = document.getElementById('co-momo-ref')?.value.trim();

  if (!name || !phone || !address || !city) {
    showToast('Please fill in all required fields', 'error');
    return;
  }

  if (phone.length < 10) { showToast('Please enter a valid phone number', 'error'); return; }

  const cart = StorageService.getCart();
  const settings = StorageService.getSettings();
  const subtotal = cart.reduce((s, i) => s + i.price * i.qty, 0);
  const savings = appliedDiscount ? appliedDiscount.savings : 0;
  const delivery = (subtotal - savings) >= settings.freeDeliveryThreshold ? 0 : settings.deliveryFee;
  const total = subtotal - savings + delivery;

  const orderId = StorageService.generateOrderId();

  const order = {
    id: orderId,
    customer: { name, phone, email, address, city, notes },
    items: cart,
    subtotal, savings, delivery, total,
    momoRef: momoRef || 'Not provided',
    screenshotUrl,
    status: 'pending',
    createdAt: new Date().toISOString()
  };

  StorageService.addOrder(order);

  if (momoRef) {
    StorageService.addPayment({
      orderId, reference: momoRef, screenshotUrl,
      amount: total, timestamp: new Date().toISOString()
    });
  }

  StorageService.clearCart();
  updateCartBadge();
  appliedDiscount = null;

  // Build WhatsApp message
  const itemsList = cart.map(i => `• ${i.name} x${i.qty} — GHS ${(i.price * i.qty).toFixed(2)}`).join('\n');

  const message = `Hello VoltGH,

I would like to place an order.

Order Number: ${orderId}

Customer Name: ${name}
Phone Number: ${phone}
Address: ${address}, ${city}
${notes ? `Notes: ${notes}` : ''}

Items:
${itemsList}

Subtotal: GHS ${subtotal.toFixed(2)}
${savings > 0 ? `Discount: -GHS ${savings.toFixed(2)}\n` : ''}Delivery: ${delivery === 0 ? 'FREE' : `GHS ${delivery.toFixed(2)}`}
Total Amount: GHS ${total.toFixed(2)}

Payment Method: Mobile Money (MTN)
${momoRef ? `MoMo Reference: ${momoRef}` : ''}

Please confirm my order.

Thank you.`;

  const waUrl = `https://wa.me/${settings.whatsapp}?text=${encodeURIComponent(message)}`;

  showOrderSuccess(order, waUrl);
}

function showOrderSuccess(order, waUrl) {
  const page = document.getElementById('page-checkout');
  if (!page) return;

  page.innerHTML = `
    <div class="order-success">
      <div style="max-width:550px;width:100%">
        <div class="success-icon"><span class="material-symbols-outlined" style="font-size:2.5rem;font-variation-settings:'FILL' 1">check_circle</span></div>
        <h1 style="margin-bottom:10px">Order Placed Successfully!</h1>
        <p style="color:var(--text-muted);margin-bottom:30px">Thank you, ${order.customer.name}! Your order has been received.</p>

        <div style="background:var(--card-bg);border:1px solid var(--border);border-radius:var(--radius);padding:24px;margin-bottom:24px;text-align:left">
          <div style="display:flex;justify-content:space-between;margin-bottom:12px">
            <span style="color:var(--text-muted)">Order Number</span>
            <strong style="color:var(--primary)">${order.id}</strong>
          </div>
          <div style="display:flex;justify-content:space-between;margin-bottom:12px">
            <span style="color:var(--text-muted)">Total Amount</span>
            <strong>GHS ${order.total.toFixed(2)}</strong>
          </div>
          <div style="display:flex;justify-content:space-between">
            <span style="color:var(--text-muted)">Status</span>
            <span class="status-badge status-pending">⏳ Pending</span>
          </div>
        </div>

        <a href="${waUrl}" target="_blank" class="btn btn-primary" style="width:100%;justify-content:center;padding:14px;border-radius:12px;font-size:1rem;background:#25D366;margin-bottom:12px">
          <span class="material-symbols-outlined mat-icon-sm" style="font-variation-settings:'FILL' 1">chat</span> Open WhatsApp to Confirm Order
        </a>
        <p style="font-size:0.8rem;color:var(--text-muted);margin-bottom:20px">
          A message has been prepared. Just tap Send in WhatsApp!
        </p>

        <div style="display:flex;gap:10px;justify-content:center">
          <button class="btn btn-dark" onclick="App.navigate('tracking')" style="border-radius:10px"><span class="material-symbols-outlined mat-icon-sm">local_shipping</span> Track Order</button>
          <button class="btn btn-primary" onclick="App.navigate('shop')" style="border-radius:10px"><span class="material-symbols-outlined mat-icon-sm">storefront</span> Continue Shopping</button>
        </div>
      </div>
    </div>
  `;

  window.open(waUrl, '_blank');
}

// ===== ORDER TRACKING =====
function renderTracking() {
  const page = document.getElementById('tracking-page-content');
  if (!page) return;

  page.innerHTML = `
    <div class="tracking-page">
      <h1 style="text-align:center;margin-bottom:8px">Track Your Order</h1>
      <p style="text-align:center;color:var(--text-muted);margin-bottom:30px">Enter your order number to see updates</p>

      <div class="tracking-input-wrap">
        <p style="font-size:0.9rem;color:var(--text-muted);margin-bottom:14px">Order number format: PGH-XXXXX-XXXX</p>
        <div style="display:flex;gap:10px;max-width:400px;margin:0 auto">
          <input type="text" id="track-input" placeholder="e.g. PGH-ABC123-DEF4"
            style="flex:1;padding:11px 14px;border:1.5px solid var(--border);border-radius:8px;background:var(--bg);color:var(--text);font-size:0.9rem;outline:none"
            onkeypress="if(event.key==='Enter') trackOrder()">
          <button class="btn btn-primary" onclick="trackOrder()" style="border-radius:8px;padding:11px 20px">Track</button>
        </div>
      </div>

      <div id="tracking-result"></div>
    </div>
  `;
}

function trackOrder() {
  const id = document.getElementById('track-input')?.value.trim().toUpperCase();
  const result = document.getElementById('tracking-result');
  if (!id || !result) return;

  const order = StorageService.getOrders().find(o => o.id === id);

  if (!order) {
    result.innerHTML = `
      <div class="empty-state">
        <span class="material-symbols-outlined" style="font-size:3.5rem;color:var(--border);display:block;margin-bottom:16px">search</span>
        <h3>Order not found</h3>
        <p>Please check your order number and try again</p>
      </div>`;
    return;
  }

  const statuses = ['pending', 'paid', 'processing', 'shipped', 'delivered'];
  const currentIdx = statuses.indexOf(order.status);

  const steps = [
    { key: 'pending', icon: '📋', label: 'Order Received', desc: 'Your order has been received' },
    { key: 'paid', icon: '💰', label: 'Payment Confirmed', desc: 'Payment has been verified' },
    { key: 'processing', icon: '📦', label: 'Processing', desc: 'We are preparing your order' },
    { key: 'shipped', icon: '🚚', label: 'Shipped', desc: 'Your order is on the way' },
    { key: 'delivered', icon: '✅', label: 'Delivered', desc: 'Order delivered successfully' }
  ];

  result.innerHTML = `
    <div style="background:var(--card-bg);border:1px solid var(--border);border-radius:var(--radius);padding:24px;margin-top:20px">
      <div style="display:flex;justify-content:space-between;align-items:start;margin-bottom:24px;flex-wrap:wrap;gap:12px">
        <div>
          <h3>${order.id}</h3>
          <p style="color:var(--text-muted);font-size:0.875rem">${new Date(order.createdAt).toLocaleDateString('en-GH', {weekday:'long',year:'numeric',month:'long',day:'numeric'})}</p>
        </div>
        <div style="text-align:right">
          <span class="status-badge status-${order.status}" style="font-size:0.875rem;padding:6px 14px">${order.status.toUpperCase()}</span>
          <div style="font-size:1.1rem;font-weight:700;color:var(--primary);margin-top:6px">GHS ${order.total.toFixed(2)}</div>
        </div>
      </div>

      <div class="tracking-steps">
        ${steps.map((step, i) => {
          const done = i < currentIdx;
          const active = i === currentIdx;
          const isLast = i === steps.length - 1;
          return `
            <div class="tracking-step">
              <div class="step-line">
                <div class="step-dot ${done || (order.status === 'cancelled' && i === 0) ? 'done' : ''} ${active ? 'active' : ''}">
                  ${done ? '✓' : step.icon}
                </div>
                ${!isLast ? `<div class="step-connector ${done ? 'done' : ''}"></div>` : ''}
              </div>
              <div class="step-content">
                <h4 style="${active ? 'color:var(--primary)' : done ? '' : 'color:var(--text-muted)'}">${step.label}</h4>
                <p>${step.desc}</p>
              </div>
            </div>
          `;
        }).join('')}
        ${order.status === 'cancelled' ? `
          <div class="tracking-step">
            <div class="step-line">
              <div class="step-dot done" style="background:var(--error);border-color:var(--error)">✕</div>
            </div>
            <div class="step-content">
              <h4 style="color:var(--error)">Cancelled</h4>
              <p>Order was cancelled</p>
            </div>
          </div>` : ''}
      </div>

      <hr class="summary-divider" style="margin:20px 0">
      <h4 style="margin-bottom:12px">Items Ordered</h4>
      ${order.items.map(item => `
        <div style="display:flex;gap:12px;margin-bottom:10px;align-items:center">
          <img src="${item.image}" style="width:48px;height:48px;border-radius:6px;object-fit:cover" onerror="this.src='https://via.placeholder.com/48'">
          <div style="flex:1">
            <div style="font-size:0.875rem;font-weight:500">${item.name}</div>
            <div style="font-size:0.8rem;color:var(--text-muted)">Qty: ${item.qty}</div>
          </div>
          <div style="font-weight:600;color:var(--primary)">GHS ${(item.price * item.qty).toFixed(2)}</div>
        </div>
      `).join('')}
    </div>
  `;
}

// ===== SEARCH =====
function renderSearch(query) {
  shopState.search = query || '';
  const products = getFilteredProducts();
  const container = document.getElementById('search-results');
  const header = document.getElementById('search-header');
  if (!container) return;

  if (header) header.innerHTML = `
    <h2>Search results for "${query}"</h2>
    <span>${products.length} products found</span>
  `;

  container.innerHTML = products.length
    ? products.map(p => createProductCard(p)).join('')
    : `<div class="empty-state" style="grid-column:1/-1">
        <span class="material-symbols-outlined" style="font-size:3.5rem;color:var(--border);display:block;margin-bottom:16px">search</span>
        <h3>No results for "${query}"</h3>
        <p>Try different keywords</p>
       </div>`;
}

function handleSearch(e) {
  if (e.key === 'Enter' || e.type === 'click') {
    const val = document.getElementById('search-input')?.value.trim() ||
                document.getElementById('mobile-search-input')?.value.trim() || '';
    if (val) { App.navigate('search', val); }
  }
}

// ===== QUICK VIEW =====
function showQuickView(productId) {
  const product = getProductById(productId);
  if (!product) return;

  const modal = document.getElementById('quick-view-modal');
  const body = document.getElementById('quick-view-body');
  if (!modal || !body) return;

  body.innerHTML = `
    <div class="quick-view-grid">
      <div>
        <img src="${product.image}" alt="${product.name}" style="width:100%;border-radius:var(--radius);object-fit:cover" onerror="this.src='https://via.placeholder.com/300x300'">
      </div>
      <div>
        <div style="font-size:0.8rem;color:var(--primary);font-weight:600;margin-bottom:6px">${getCategoryName(product.category)}</div>
        <h3 style="margin-bottom:10px">${product.name}</h3>
        <div style="font-size:1.4rem;font-weight:800;color:var(--primary);margin-bottom:12px">GHS ${product.price.toFixed(2)}</div>
        <p style="font-size:0.875rem;color:var(--text-muted);margin-bottom:16px;line-height:1.7">${product.description?.slice(0, 150)}...</p>
        <div style="display:flex;gap:10px;flex-wrap:wrap">
          <button class="btn btn-primary" style="display:inline-flex;align-items:center;gap:6px" onclick="addToCart(getProductById('${product.id}')); closeModal('quick-view-modal')" style="border-radius:10px">🛒 Add to Cart</button>
          <button class="btn" onclick="closeModal('quick-view-modal'); viewProduct('${product.id}')" style="border:1.5px solid var(--border);border-radius:10px">View Details</button>
        </div>
      </div>
    </div>
  `;

  modal.classList.add('active');
}

function closeModal(id) {
  document.getElementById(id)?.classList.remove('active');
}

// ===== BACK TO TOP =====
window.addEventListener('scroll', () => {
  const btn = document.getElementById('back-to-top');
  if (btn) btn.classList.toggle('visible', window.scrollY > 300);
});

// ===== INIT =====
document.addEventListener('DOMContentLoaded', () => {
  seedDefaultData();
  initDarkMode();
  updateCartBadge();
  updateWishlistBadge();
  App.navigate('home');

  // Search handlers
  document.getElementById('search-input')?.addEventListener('keypress', handleSearch);
  document.getElementById('mobile-search-input')?.addEventListener('keypress', handleSearch);

  // Sort handler
  document.getElementById('sort-select')?.addEventListener('change', (e) => {
    shopState.sort = e.target.value;
    renderShop();
  });

  // Overlay click close
  document.getElementById('cart-overlay')?.addEventListener('click', (e) => {
    if (e.target.id === 'cart-overlay') { closeCart(); closeWishlist(); }
  });

  // Hamburger
  document.getElementById('hamburger')?.addEventListener('click', () => {
    document.getElementById('mobile-menu')?.classList.toggle('active');
  });

  // Mobile search toggle
  document.getElementById('mobile-search-toggle')?.addEventListener('click', () => {
    const sb = document.querySelector('.search-bar');
    if (sb) sb.classList.toggle('mobile-open');
  });
});

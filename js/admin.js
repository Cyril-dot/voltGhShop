// ===== ADMIN DASHBOARD =====

const Admin = {
  currentSection: 'dashboard',

  init() {
    if (!StorageService.isAdminLoggedIn()) {
      this.showLogin();
      return;
    }
    this.showDashboard();
  },

  showLogin() {
    document.getElementById('admin-login').style.display = 'flex';
    document.getElementById('admin-app').style.display = 'none';
  },

  showDashboard() {
    document.getElementById('admin-login').style.display = 'none';
    document.getElementById('admin-app').style.display = 'flex';
    this.navigate('dashboard');
  },

  login() {
    const pass = document.getElementById('admin-pass')?.value;
    if (StorageService.adminLogin(pass)) {
      this.showDashboard();
    } else {
      showToast('Incorrect password', 'error');
      document.getElementById('admin-pass').style.borderColor = 'var(--error)';
    }
  },

  logout() {
    StorageService.adminLogout();
    this.showLogin();
    document.getElementById('admin-pass').value = '';
  },

  navigate(section) {
    this.currentSection = section;
    document.querySelectorAll('.admin-nav-item').forEach(i => i.classList.remove('active'));
    document.querySelector(`[data-section="${section}"]`)?.classList.add('active');

    const sections = {
      dashboard: this.renderDashboard,
      products: this.renderProducts,
      orders: this.renderOrders,
      customers: this.renderCustomers,
      categories: this.renderCategories,
      settings: this.renderSettings
    };

    const render = sections[section];
    if (render) render.call(this);

    // Close sidebar on mobile
    document.getElementById('admin-sidebar')?.classList.remove('open');
  },

  renderDashboard() {
    const orders = StorageService.getOrders();
    const products = StorageService.getProducts();
    const revenue = orders.filter(o => o.status !== 'cancelled').reduce((s, o) => s + o.total, 0);
    const pending = orders.filter(o => o.status === 'pending').length;
    const completed = orders.filter(o => o.status === 'delivered').length;

    document.getElementById('admin-content').innerHTML = `
      <div class="admin-topbar">
        <h1><span class="material-symbols-outlined" style="font-size:18px;font-variation-settings:'FILL' 1">dashboard</span> Dashboard</h1>
        <span style="color:var(--text-muted);font-size:0.875rem">${new Date().toLocaleDateString('en-GH', {weekday:'long',year:'numeric',month:'long',day:'numeric'})}</span>
      </div>

      <div class="stat-cards">
        <div class="stat-card">
          <div class="stat-icon" style="background:rgba(29,78,216,0.12);color:#1D4ED8"><span class="material-symbols-outlined" style="font-size:1.5rem;font-variation-settings:'FILL' 1">inventory_2</span></div>
          <div class="stat-info">
            <strong>${orders.length}</strong>
            <span>Total Orders</span>
          </div>
        </div>
        <div class="stat-card">
          <div class="stat-icon" style="background:rgba(16,185,129,0.12);color:#059669"><span class="material-symbols-outlined" style="font-size:1.5rem;font-variation-settings:'FILL' 1">payments</span></div>
          <div class="stat-info">
            <strong>GHS ${revenue.toFixed(0)}</strong>
            <span>Total Revenue</span>
          </div>
        </div>
        <div class="stat-card">
          <div class="stat-icon" style="background:rgba(245,158,11,0.12);color:#D97706"><span class="material-symbols-outlined" style="font-size:1.5rem;font-variation-settings:'FILL' 1">pending</span></div>
          <div class="stat-info">
            <strong>${pending}</strong>
            <span>Pending Orders</span>
          </div>
        </div>
        <div class="stat-card">
          <div class="stat-icon" style="background:rgba(59,130,246,0.12);color:#2563EB"><span class="material-symbols-outlined" style="font-size:1.5rem;font-variation-settings:'FILL' 1">devices</span></div>
          <div class="stat-info">
            <strong>${products.length}</strong>
            <span>Products</span>
          </div>
        </div>
        <div class="stat-card">
          <div class="stat-icon" style="background:rgba(99,102,241,0.12);color:#4F46E5"><span class="material-symbols-outlined" style="font-size:1.5rem;font-variation-settings:'FILL' 1">check_circle</span></div>
          <div class="stat-info">
            <strong>${completed}</strong>
            <span>Delivered</span>
          </div>
        </div>
      </div>

      <div class="data-table-wrap">
        <div class="data-table-header">
          <h3>Recent Orders</h3>
          <button class="btn btn-primary" onclick="Admin.navigate('orders')" style="padding:8px 16px;border-radius:8px;font-size:0.8rem">View All</button>
        </div>
        <div style="overflow-x:auto">
          <table class="data-table">
            <thead>
              <tr>
                <th>Order ID</th>
                <th>Customer</th>
                <th>Items</th>
                <th>Total</th>
                <th>Status</th>
                <th>Date</th>
              </tr>
            </thead>
            <tbody>
              ${orders.slice(0, 8).map(o => `
                <tr>
                  <td><strong>${o.id}</strong></td>
                  <td>
                    <div>${o.customer.name}</div>
                    <div style="font-size:0.75rem;color:var(--text-muted)">${o.customer.phone}</div>
                  </td>
                  <td>${o.items.length} item${o.items.length !== 1 ? 's' : ''}</td>
                  <td><strong>GHS ${o.total.toFixed(2)}</strong></td>
                  <td><span class="status-badge status-${o.status}">${o.status}</span></td>
                  <td style="color:var(--text-muted);font-size:0.8rem">${new Date(o.createdAt).toLocaleDateString()}</td>
                </tr>
              `).join('') || `<tr><td colspan="6" style="text-align:center;color:var(--text-muted);padding:40px">No orders yet</td></tr>`}
            </tbody>
          </table>
        </div>
      </div>
    `;
  },

  renderProducts() {
    const products = StorageService.getProducts();

    document.getElementById('admin-content').innerHTML = `
      <div class="admin-topbar">
        <h1><span class="material-symbols-outlined" style="font-size:18px;font-variation-settings:'FILL' 1">devices</span> Products</h1>
        <button class="btn btn-primary" onclick="Admin.openProductModal()" style="padding:10px 20px;border-radius:8px"><span class="material-symbols-outlined" style="font-size:16px">add</span> Add Product</button>
      </div>

      <div class="data-table-wrap">
        <div class="data-table-header">
          <h3>${products.length} Products</h3>
          <input type="text" placeholder="Search products..." oninput="Admin.filterProducts(this.value)"
            style="padding:8px 12px;border:1px solid var(--border);border-radius:8px;background:var(--bg);color:var(--text);font-size:0.875rem;outline:none">
        </div>
        <div style="overflow-x:auto">
          <table class="data-table" id="products-table">
            <thead>
              <tr>
                <th>Product</th>
                <th>Category</th>
                <th>Price</th>
                <th>Stock</th>
                <th>Status</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              ${products.map(p => `
                <tr>
                  <td>
                    <div style="display:flex;align-items:center;gap:10px">
                      <img src="${p.image}" style="width:44px;height:44px;border-radius:6px;object-fit:cover" onerror="this.src='https://via.placeholder.com/44'">
                      <div>
                        <div style="font-weight:600">${p.name}</div>
                        <div style="font-size:0.75rem;color:var(--text-muted)">${p.id}</div>
                      </div>
                    </div>
                  </td>
                  <td>${getCategoryName(p.category)}</td>
                  <td><strong>GHS ${p.price.toFixed(2)}</strong>${p.oldPrice ? `<br><span style="font-size:0.75rem;text-decoration:line-through;color:var(--text-muted)">GHS ${p.oldPrice.toFixed(2)}</span>` : ''}</td>
                  <td>
                    <span style="color:${p.stock > 5 ? 'var(--success)' : p.stock > 0 ? 'var(--warning)' : 'var(--error)'};font-weight:600">${p.stock}</span>
                  </td>
                  <td><span class="status-badge ${p.stock > 0 ? 'status-paid' : 'status-cancelled'}">${p.stock > 0 ? 'Active' : 'Out of Stock'}</span></td>
                  <td>
                    <div style="display:flex;gap:6px">
                      <button onclick="Admin.openProductModal('${p.id}')" style="padding:5px 10px;border:1px solid var(--border);border-radius:6px;font-size:0.75rem;cursor:pointer;background:var(--bg);color:var(--text)"><span class="material-symbols-outlined" style="font-size:13px">edit</span> Edit</button>
                      <button onclick="Admin.deleteProduct('${p.id}')" style="padding:5px 10px;border:1px solid var(--error);border-radius:6px;font-size:0.75rem;cursor:pointer;background:transparent;color:var(--error)"><span class="material-symbols-outlined" style="font-size:13px">delete</span> Delete</button>
                    </div>
                  </td>
                </tr>
              `).join('') || `<tr><td colspan="6" style="text-align:center;padding:40px;color:var(--text-muted)">No products. Add your first product!</td></tr>`}
            </tbody>
          </table>
        </div>
      </div>

      <!-- Product Modal -->
      <div class="modal-overlay" id="product-modal">
        <div class="modal" style="max-width:600px">
          <div class="modal-header">
            <h3 id="modal-title">Add Product</h3>
            <button class="close-btn" onclick="closeModal('product-modal')">✕</button>
          </div>
          <div class="modal-body" id="product-form-wrap"></div>
        </div>
      </div>
    `;
  },

  filterProducts(query) {
    const q = query.toLowerCase();
    const rows = document.querySelectorAll('#products-table tbody tr');
    rows.forEach(row => {
      row.style.display = row.textContent.toLowerCase().includes(q) ? '' : 'none';
    });
  },

  openProductModal(productId = null) {
    const product = productId ? getProductById(productId) : null;
    const cats = StorageService.getCategories();

    document.getElementById('modal-title').textContent = product ? 'Edit Product' : 'Add New Product';

    document.getElementById('product-form-wrap').innerHTML = `
      <div class="form-group">
        <label>Product Name *</label>
        <input type="text" id="pf-name" value="${product?.name || ''}" placeholder="e.g. Samsung Galaxy A54">
      </div>
      <div class="form-row">
        <div class="form-group">
          <label>Price (GHS) *</label>
          <input type="number" id="pf-price" value="${product?.price || ''}" placeholder="0.00" min="0" step="0.01">
        </div>
        <div class="form-group">
          <label>Old Price (GHS)</label>
          <input type="number" id="pf-old-price" value="${product?.oldPrice || ''}" placeholder="Optional" min="0" step="0.01">
        </div>
      </div>
      <div class="form-row">
        <div class="form-group">
          <label>Category *</label>
          <select id="pf-cat">
            <option value="">Select category</option>
            ${cats.map(c => `<option value="${c.id}" ${product?.category === c.id ? 'selected' : ''}>${c.name}</option>`).join('')}
          </select>
        </div>
        <div class="form-group">
          <label>Stock Quantity *</label>
          <input type="number" id="pf-stock" value="${product?.stock || ''}" placeholder="0" min="0">
        </div>
      </div>
      <div class="form-row">
        <div class="form-group">
          <label>Badge</label>
          <select id="pf-badge">
            <option value="">None</option>
            ${['Hot','Sale','New','Featured'].map(b => `<option value="${b}" ${product?.badge === b ? 'selected' : ''}>${b}</option>`).join('')}
          </select>
        </div>
        <div class="form-group">
          <label>Rating (1–5)</label>
          <input type="number" id="pf-rating" value="${product?.rating || 4.5}" min="1" max="5" step="0.1">
        </div>
      </div>
      <div class="form-group">
        <label>Description</label>
        <textarea id="pf-desc" placeholder="Product description...">${product?.description || ''}</textarea>
      </div>
      <div class="form-group">
        <label>Product Image</label>
        <div class="upload-area" onclick="document.getElementById('pf-img-upload').click()">
          <span class="material-symbols-outlined" style="font-size:2rem;color:var(--text-muted);display:block;margin-bottom:10px">add_photo_alternate</span>
          <p>Click to upload image (or paste URL below)</p>
          <input type="file" id="pf-img-upload" accept="image/*" style="display:none" onchange="Admin.handleImageUpload(this)">
        </div>
        <img id="pf-img-preview" class="img-preview ${product?.image ? 'visible' : ''}" src="${product?.image || ''}">
        <input type="text" id="pf-img-url" value="${product?.image || ''}" placeholder="Or paste image URL here" style="margin-top:8px;padding:8px 12px;border:1px solid var(--border);border-radius:6px;width:100%;background:var(--bg);color:var(--text);font-size:0.85rem;outline:none" oninput="Admin.previewFromUrl(this.value)">
        <div id="pf-upload-status" style="font-size:0.8rem;margin-top:4px;color:var(--text-muted)"></div>
      </div>
      <div style="display:flex;gap:10px;justify-content:flex-end;margin-top:20px">
        <button onclick="closeModal('product-modal')" style="padding:10px 20px;border:1px solid var(--border);border-radius:8px;cursor:pointer;background:var(--bg);color:var(--text)">Cancel</button>
        <button class="btn btn-primary" onclick="Admin.saveProduct('${productId || ''}')" style="border-radius:8px">
          ${product ? '💾 Update Product' : '➕ Add Product'}
        </button>
      </div>
    `;

    document.getElementById('product-modal').classList.add('active');
  },

  async handleImageUpload(input) {
    const file = input.files[0];
    if (!file) return;

    const preview = document.getElementById('pf-img-preview');
    const reader = new FileReader();
    reader.onload = e => { preview.src = e.target.result; preview.classList.add('visible'); };
    reader.readAsDataURL(file);

    const status = document.getElementById('pf-upload-status');
    status.textContent = '⬆️ Uploading...';

    try {
      const result = await ImgBBService.upload(file);
      document.getElementById('pf-img-url').value = result.url;
      status.textContent = '✅ Uploaded!';
      status.style.color = 'var(--success)';
    } catch {
      status.textContent = '⚠️ Upload failed. Please paste URL manually.';
      status.style.color = 'var(--error)';
    }
  },

  previewFromUrl(url) {
    const preview = document.getElementById('pf-img-preview');
    if (url) { preview.src = url; preview.classList.add('visible'); }
    else preview.classList.remove('visible');
  },

  saveProduct(productId) {
    const name = document.getElementById('pf-name')?.value.trim();
    const price = parseFloat(document.getElementById('pf-price')?.value);
    const oldPrice = parseFloat(document.getElementById('pf-old-price')?.value) || null;
    const category = document.getElementById('pf-cat')?.value;
    const stock = parseInt(document.getElementById('pf-stock')?.value);
    const badge = document.getElementById('pf-badge')?.value;
    const rating = parseFloat(document.getElementById('pf-rating')?.value) || 4.5;
    const description = document.getElementById('pf-desc')?.value.trim();
    const image = document.getElementById('pf-img-url')?.value.trim();

    if (!name || !price || !category || isNaN(stock)) {
      showToast('Please fill in all required fields', 'error'); return;
    }

    const products = StorageService.getProducts();

    if (productId) {
      const idx = products.findIndex(p => p.id === productId);
      if (idx !== -1) {
        products[idx] = { ...products[idx], name, price, oldPrice, category, stock, badge, rating, description, image, images: [image] };
        showToast('Product updated!', 'success');
      }
    } else {
      const newProduct = {
        id: 'p' + Date.now(),
        name, price, oldPrice, category, stock, badge, rating, description,
        image: image || 'https://via.placeholder.com/300x300?text=VoltGH',
        images: [image || 'https://via.placeholder.com/300x300?text=VoltGH'],
        reviews: 0, isNew: badge === 'New'
      };
      products.push(newProduct);
      showToast('Product added!', 'success');
    }

    StorageService.saveProducts(products);
    closeModal('product-modal');
    this.renderProducts();
  },

  deleteProduct(productId) {
    if (!confirm('Delete this product? This cannot be undone.')) return;
    const products = StorageService.getProducts().filter(p => p.id !== productId);
    StorageService.saveProducts(products);
    showToast('Product deleted', 'info');
    this.renderProducts();
  },

  renderOrders() {
    const orders = StorageService.getOrders();

    document.getElementById('admin-content').innerHTML = `
      <div class="admin-topbar">
        <h1><span class="material-symbols-outlined" style="font-size:18px;font-variation-settings:'FILL' 1">receipt_long</span> Orders</h1>
        <div style="display:flex;gap:10px;align-items:center;flex-wrap:wrap">
          <input type="text" placeholder="Search orders..." oninput="Admin.filterOrders(this.value)"
            style="padding:8px 12px;border:1px solid var(--border);border-radius:8px;background:var(--bg);color:var(--text);font-size:0.875rem;outline:none">
          <select onchange="Admin.filterOrdersByStatus(this.value)"
            style="padding:8px 12px;border:1px solid var(--border);border-radius:8px;background:var(--bg);color:var(--text);font-size:0.875rem;outline:none;cursor:pointer">
            <option value="all">All Status</option>
            <option value="pending">Pending</option>
            <option value="paid">Paid</option>
            <option value="processing">Processing</option>
            <option value="shipped">Shipped</option>
            <option value="delivered">Delivered</option>
            <option value="cancelled">Cancelled</option>
          </select>
        </div>
      </div>

      <div class="data-table-wrap">
        <div class="data-table-header">
          <h3>${orders.length} Total Orders</h3>
        </div>
        <div style="overflow-x:auto">
          <table class="data-table" id="orders-table">
            <thead>
              <tr>
                <th>Order ID</th>
                <th>Customer</th>
                <th>Items</th>
                <th>Total</th>
                <th>MoMo Ref</th>
                <th>Status</th>
                <th>Date</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              ${orders.map(o => `
                <tr data-status="${o.status}" data-search="${o.id} ${o.customer.name} ${o.customer.phone}".toLowerCase()>
                  <td><strong style="color:var(--primary)">${o.id}</strong></td>
                  <td>
                    <div style="font-weight:600">${o.customer.name}</div>
                    <div style="font-size:0.75rem;color:var(--text-muted)">${o.customer.phone}</div>
                    <div style="font-size:0.75rem;color:var(--text-muted)">${o.customer.city}</div>
                  </td>
                  <td>
                    ${o.items.map(i => `<div style="font-size:0.75rem">${i.name} ×${i.qty}</div>`).join('')}
                  </td>
                  <td><strong>GHS ${o.total.toFixed(2)}</strong></td>
                  <td style="font-size:0.8rem;color:var(--text-muted)">${o.momoRef || '—'}</td>
                  <td>
                    <select onchange="Admin.updateOrderStatus('${o.id}', this.value)"
                      style="padding:5px 10px;border:1px solid var(--border);border-radius:6px;font-size:0.75rem;cursor:pointer;background:var(--bg);color:var(--text);outline:none">
                      ${['pending','paid','processing','shipped','delivered','cancelled'].map(s =>
                        `<option value="${s}" ${o.status === s ? 'selected' : ''}>${s.charAt(0).toUpperCase() + s.slice(1)}</option>`
                      ).join('')}
                    </select>
                  </td>
                  <td style="font-size:0.8rem;color:var(--text-muted)">${new Date(o.createdAt).toLocaleDateString()}</td>
                  <td>
                    <button onclick="Admin.viewOrderDetails('${o.id}')" style="padding:5px 10px;border:1px solid var(--border);border-radius:6px;font-size:0.75rem;cursor:pointer;background:var(--bg);color:var(--text)"><span class="material-symbols-outlined" style="font-size:13px">visibility</span> View</button>
                  </td>
                </tr>
              `).join('') || `<tr><td colspan="8" style="text-align:center;padding:40px;color:var(--text-muted)">No orders yet</td></tr>`}
            </tbody>
          </table>
        </div>
      </div>

      <!-- Order Detail Modal -->
      <div class="modal-overlay" id="order-detail-modal">
        <div class="modal" style="max-width:640px">
          <div class="modal-header">
            <h3>Order Details</h3>
            <button class="close-btn" onclick="closeModal('order-detail-modal')">✕</button>
          </div>
          <div class="modal-body" id="order-detail-body"></div>
        </div>
      </div>
    `;
  },

  filterOrders(query) {
    const q = query.toLowerCase();
    document.querySelectorAll('#orders-table tbody tr').forEach(row => {
      row.style.display = row.textContent.toLowerCase().includes(q) ? '' : 'none';
    });
  },

  filterOrdersByStatus(status) {
    document.querySelectorAll('#orders-table tbody tr').forEach(row => {
      row.style.display = (status === 'all' || row.dataset.status === status) ? '' : 'none';
    });
  },

  updateOrderStatus(orderId, status) {
    StorageService.updateOrder(orderId, { status });
    showToast(`Order ${orderId} → ${status}`, 'success');
  },

  viewOrderDetails(orderId) {
    const order = StorageService.getOrders().find(o => o.id === orderId);
    if (!order) return;

    document.getElementById('order-detail-body').innerHTML = `
      <div style="display:grid;grid-template-columns:1fr 1fr;gap:16px;margin-bottom:20px">
        <div>
          <p style="font-size:0.75rem;color:var(--text-muted)">ORDER ID</p>
          <p style="font-weight:700;color:var(--primary)">${order.id}</p>
        </div>
        <div>
          <p style="font-size:0.75rem;color:var(--text-muted)">DATE</p>
          <p>${new Date(order.createdAt).toLocaleString()}</p>
        </div>
        <div>
          <p style="font-size:0.75rem;color:var(--text-muted)">CUSTOMER</p>
          <p style="font-weight:600">${order.customer.name}</p>
        </div>
        <div>
          <p style="font-size:0.75rem;color:var(--text-muted)">PHONE</p>
          <p>${order.customer.phone}</p>
        </div>
        <div>
          <p style="font-size:0.75rem;color:var(--text-muted)">ADDRESS</p>
          <p>${order.customer.address}, ${order.customer.city}</p>
        </div>
        <div>
          <p style="font-size:0.75rem;color:var(--text-muted)">MOMO REF</p>
          <p>${order.momoRef || '—'}</p>
        </div>
      </div>
      ${order.customer.notes ? `<p style="background:var(--bg);padding:10px;border-radius:6px;font-size:0.85rem;margin-bottom:16px">📝 ${order.customer.notes}</p>` : ''}
      ${order.screenshotUrl ? `<a href="${order.screenshotUrl}" target="_blank" style="display:inline-flex;align-items:center;gap:6px;color:var(--primary);font-size:0.85rem;margin-bottom:16px">📸 View Payment Screenshot</a>` : ''}

      <h4 style="margin-bottom:12px">Order Items</h4>
      ${order.items.map(item => `
        <div style="display:flex;gap:10px;margin-bottom:10px;align-items:center;padding:10px;background:var(--bg);border-radius:8px">
          <img src="${item.image}" style="width:48px;height:48px;border-radius:6px;object-fit:cover">
          <div style="flex:1">
            <div style="font-weight:500;font-size:0.9rem">${item.name}</div>
            <div style="font-size:0.8rem;color:var(--text-muted)">Qty: ${item.qty} × GHS ${item.price.toFixed(2)}</div>
          </div>
          <strong style="color:var(--primary)">GHS ${(item.price * item.qty).toFixed(2)}</strong>
        </div>
      `).join('')}

      <hr style="border:none;border-top:1px solid var(--border);margin:16px 0">
      <div style="display:flex;justify-content:space-between;margin-bottom:8px"><span>Subtotal</span><span>GHS ${order.subtotal.toFixed(2)}</span></div>
      ${order.savings > 0 ? `<div style="display:flex;justify-content:space-between;margin-bottom:8px;color:var(--success)"><span>Discount</span><span>-GHS ${order.savings.toFixed(2)}</span></div>` : ''}
      <div style="display:flex;justify-content:space-between;margin-bottom:8px"><span>Delivery</span><span>${order.delivery === 0 ? 'FREE' : `GHS ${order.delivery.toFixed(2)}`}</span></div>
      <div style="display:flex;justify-content:space-between;font-size:1.1rem;font-weight:700"><span>Total</span><span style="color:var(--primary)">GHS ${order.total.toFixed(2)}</span></div>
    `;

    document.getElementById('order-detail-modal').classList.add('active');
  },

  renderCustomers() {
    const orders = StorageService.getOrders();
    const customerMap = {};

    orders.forEach(o => {
      const key = o.customer.phone;
      if (!customerMap[key]) {
        customerMap[key] = { ...o.customer, orders: [], totalSpent: 0 };
      }
      customerMap[key].orders.push(o);
      customerMap[key].totalSpent += o.total;
    });

    const customers = Object.values(customerMap);

    document.getElementById('admin-content').innerHTML = `
      <div class="admin-topbar">
        <h1><span class="material-symbols-outlined" style="font-size:18px;font-variation-settings:'FILL' 1">group</span> Customers</h1>
        <span style="color:var(--text-muted)">${customers.length} customers</span>
      </div>

      <div class="data-table-wrap">
        <div class="data-table-header"><h3>All Customers</h3></div>
        <div style="overflow-x:auto">
          <table class="data-table">
            <thead>
              <tr><th>Name</th><th>Phone</th><th>City</th><th>Orders</th><th>Total Spent</th><th>Email</th></tr>
            </thead>
            <tbody>
              ${customers.map(c => `
                <tr>
                  <td><strong>${c.name}</strong></td>
                  <td>${c.phone}</td>
                  <td>${c.city}</td>
                  <td>${c.orders.length}</td>
                  <td><strong style="color:var(--primary)">GHS ${c.totalSpent.toFixed(2)}</strong></td>
                  <td style="color:var(--text-muted)">${c.email || '—'}</td>
                </tr>
              `).join('') || `<tr><td colspan="6" style="text-align:center;padding:40px;color:var(--text-muted)">No customers yet</td></tr>`}
            </tbody>
          </table>
        </div>
      </div>
    `;
  },

  renderCategories() {
    const cats = StorageService.getCategories();

    document.getElementById('admin-content').innerHTML = `
      <div class="admin-topbar">
        <h1><span class="material-symbols-outlined" style="font-size:18px;font-variation-settings:'FILL' 1">category</span> Categories</h1>
        <button class="btn btn-primary" onclick="Admin.openCatModal()" style="padding:10px 20px;border-radius:8px"><span class="material-symbols-outlined" style="font-size:16px">add</span> Add Category</button>
      </div>

      <div style="display:grid;grid-template-columns:repeat(auto-fill,minmax(200px,1fr));gap:16px">
        ${cats.map(c => `
          <div style="background:var(--card-bg);border:1px solid var(--border);border-radius:var(--radius);padding:20px;text-align:center">
            <div style="font-size:2.5rem;margin-bottom:10px">${c.icon}</div>
            <h3 style="margin-bottom:4px">${c.name}</h3>
            <p style="font-size:0.8rem;color:var(--text-muted)">
              ${StorageService.getProducts().filter(p => p.category === c.id).length} products
            </p>
            <div style="display:flex;gap:6px;justify-content:center;margin-top:12px">
              <button onclick="Admin.openCatModal('${c.id}')" style="padding:5px 12px;border:1px solid var(--border);border-radius:6px;font-size:0.75rem;cursor:pointer;background:var(--bg);color:var(--text)"><span class="material-symbols-outlined" style="font-size:13px">edit</span> Edit</button>
              <button onclick="Admin.deleteCategory('${c.id}')" style="padding:5px 12px;border:1px solid var(--error);border-radius:6px;font-size:0.75rem;cursor:pointer;background:transparent;color:var(--error)">🗑</button>
            </div>
          </div>
        `).join('')}
      </div>

      <div class="modal-overlay" id="cat-modal">
        <div class="modal" style="max-width:400px">
          <div class="modal-header">
            <h3 id="cat-modal-title">Add Category</h3>
            <button class="close-btn" onclick="closeModal('cat-modal')">✕</button>
          </div>
          <div class="modal-body" id="cat-form-wrap"></div>
        </div>
      </div>
    `;
  },

  openCatModal(catId = null) {
    const cat = catId ? StorageService.getCategories().find(c => c.id === catId) : null;
    document.getElementById('cat-modal-title').textContent = cat ? 'Edit Category' : 'Add Category';
    document.getElementById('cat-form-wrap').innerHTML = `
      <div class="form-group"><label>Name *</label><input type="text" id="cf-name" value="${cat?.name || ''}"></div>
      <div class="form-group"><label>Icon (emoji) *</label><input type="text" id="cf-icon" value="${cat?.icon || ''}" placeholder="e.g. 📱"></div>
      <div class="form-group"><label>Color</label><input type="color" id="cf-color" value="${cat?.color || '#FF6B00'}" style="height:40px;cursor:pointer"></div>
      <div style="display:flex;gap:10px;justify-content:flex-end;margin-top:16px">
        <button onclick="closeModal('cat-modal')" style="padding:10px 20px;border:1px solid var(--border);border-radius:8px;cursor:pointer;background:var(--bg);color:var(--text)">Cancel</button>
        <button class="btn btn-primary" onclick="Admin.saveCategory('${catId || ''}')" style="border-radius:8px">${cat ? 'Update' : 'Add'}</button>
      </div>
    `;
    document.getElementById('cat-modal').classList.add('active');
  },

  saveCategory(catId) {
    const name = document.getElementById('cf-name')?.value.trim();
    const icon = document.getElementById('cf-icon')?.value.trim();
    const color = document.getElementById('cf-color')?.value;
    if (!name || !icon) { showToast('Name and icon required', 'error'); return; }

    const cats = StorageService.getCategories();
    if (catId) {
      const idx = cats.findIndex(c => c.id === catId);
      if (idx !== -1) { cats[idx] = { ...cats[idx], name, icon, color }; }
    } else {
      cats.push({ id: 'c' + Date.now(), name, icon, color });
    }
    StorageService.saveCategories(cats);
    showToast('Category saved!', 'success');
    closeModal('cat-modal');
    this.renderCategories();
  },

  deleteCategory(catId) {
    if (!confirm('Delete this category?')) return;
    const cats = StorageService.getCategories().filter(c => c.id !== catId);
    StorageService.saveCategories(cats);
    showToast('Category deleted', 'info');
    this.renderCategories();
  },

  renderSettings() {
    const s = StorageService.getSettings();

    document.getElementById('admin-content').innerHTML = `
      <div class="admin-topbar"><h1><span class="material-symbols-outlined" style="font-size:18px;font-variation-settings:'FILL' 1">settings</span> Settings</h1></div>

      <div style="max-width:600px">
        <div class="checkout-form-section">
          <h2 style="margin-bottom:20px">Store Settings</h2>
          <div class="form-group"><label>Store Name</label><input type="text" id="s-name" value="${s.storeName || 'VoltGH Store'}"></div>
          <div class="form-group"><label>WhatsApp Number (with country code)</label><input type="text" id="s-wa" value="${s.whatsapp || '233549703320'}"></div>
          <div class="form-group"><label>MoMo Number</label><input type="text" id="s-momo" value="${s.momoNumber || '0549703320'}"></div>
          <div class="form-group"><label>MoMo Network</label>
            <select id="s-network">
              ${['MTN Mobile Money','Vodafone Cash','AirtelTigo Money'].map(n => `<option ${s.momoNetwork === n ? 'selected' : ''}>${n}</option>`).join('')}
            </select>
          </div>
          <div class="form-row">
            <div class="form-group"><label>Delivery Fee (GHS)</label><input type="number" id="s-del" value="${s.deliveryFee || 30}"></div>
            <div class="form-group"><label>Free Delivery Above (GHS)</label><input type="number" id="s-free" value="${s.freeDeliveryThreshold || 500}"></div>
          </div>
          <button class="btn btn-primary" onclick="Admin.saveSettings()" style="border-radius:10px;padding:12px 24px">💾 Save Settings</button>
        </div>

        <div class="checkout-form-section" style="margin-top:20px">
          <h2 style="margin-bottom:16px">Change Admin Password</h2>
          <div class="form-group"><label>New Password</label><input type="password" id="new-pass" placeholder="Enter new password"></div>
          <div class="form-group"><label>Confirm Password</label><input type="password" id="confirm-pass" placeholder="Confirm new password"></div>
          <button class="btn" onclick="Admin.changePassword()" style="background:var(--secondary);color:white;border-radius:10px;padding:12px 24px">🔑 Change Password</button>
        </div>

        <div class="checkout-form-section" style="margin-top:20px">
          <h2 style="margin-bottom:16px;color:var(--error)">Danger Zone</h2>
          <button onclick="Admin.clearAllOrders()" style="padding:10px 20px;border:1px solid var(--error);border-radius:8px;color:var(--error);cursor:pointer;background:transparent;margin-right:10px">Clear All Orders</button>
          <button onclick="Admin.resetProducts()" style="padding:10px 20px;border:1px solid var(--error);border-radius:8px;color:var(--error);cursor:pointer;background:transparent">Reset Products</button>
        </div>
      </div>
    `;
  },

  saveSettings() {
    StorageService.saveSettings({
      storeName: document.getElementById('s-name')?.value,
      whatsapp: document.getElementById('s-wa')?.value,
      momoNumber: document.getElementById('s-momo')?.value,
      momoNetwork: document.getElementById('s-network')?.value,
      deliveryFee: parseFloat(document.getElementById('s-del')?.value) || 30,
      freeDeliveryThreshold: parseFloat(document.getElementById('s-free')?.value) || 500,
      currency: 'GHS'
    });
    showToast('Settings saved!', 'success');
  },

  changePassword() {
    const np = document.getElementById('new-pass')?.value;
    const cp = document.getElementById('confirm-pass')?.value;
    if (!np) { showToast('Enter a new password', 'error'); return; }
    if (np !== cp) { showToast('Passwords do not match', 'error'); return; }
    showToast('Note: Password change requires backend. Default: volt2024', 'warning');
  },

  clearAllOrders() {
    if (!confirm('Delete ALL orders? This cannot be undone.')) return;
    StorageService.saveOrders([]);
    showToast('All orders cleared', 'info');
    this.renderDashboard();
  },

  resetProducts() {
    if (!confirm('Reset products to defaults?')) return;
    localStorage.removeItem('phonix_products');
    seedDefaultData();
    showToast('Products reset to defaults', 'info');
    this.renderProducts();
  }
};

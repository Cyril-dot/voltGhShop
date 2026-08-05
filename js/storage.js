// ===== STORAGE SERVICE =====
const StorageService = {
  getProducts: () => JSON.parse(localStorage.getItem('voltgh_products') || '[]'),
  saveProducts: (data) => localStorage.setItem('voltgh_products', JSON.stringify(data)),

  getOrders: () => JSON.parse(localStorage.getItem('voltgh_orders') || '[]'),
  saveOrders: (data) => localStorage.setItem('voltgh_orders', JSON.stringify(data)),
  addOrder: (order) => {
    const orders = StorageService.getOrders();
    orders.unshift(order);
    StorageService.saveOrders(orders);
  },
  updateOrder: (id, updates) => {
    const orders = StorageService.getOrders();
    const idx = orders.findIndex(o => o.id === id);
    if (idx !== -1) { orders[idx] = { ...orders[idx], ...updates }; StorageService.saveOrders(orders); }
  },

  getCart: () => JSON.parse(localStorage.getItem('voltgh_cart') || '[]'),
  saveCart: (data) => localStorage.setItem('voltgh_cart', JSON.stringify(data)),
  addToCart: (product, qty = 1) => {
    const cart = StorageService.getCart();
    const existing = cart.find(i => i.id === product.id);
    if (existing) { existing.qty = Math.min(existing.qty + qty, product.stock || 99); }
    else { cart.push({ ...product, qty }); }
    StorageService.saveCart(cart);
    return cart;
  },
  removeFromCart: (productId) => {
    const cart = StorageService.getCart().filter(i => i.id !== productId);
    StorageService.saveCart(cart);
    return cart;
  },
  updateCartQty: (productId, qty) => {
    const cart = StorageService.getCart();
    const item = cart.find(i => i.id === productId);
    if (item) { item.qty = qty; if (item.qty <= 0) return StorageService.removeFromCart(productId); }
    StorageService.saveCart(cart);
    return cart;
  },
  clearCart: () => localStorage.setItem('voltgh_cart', '[]'),

  getWishlist: () => JSON.parse(localStorage.getItem('voltgh_wishlist') || '[]'),
  saveWishlist: (data) => localStorage.setItem('voltgh_wishlist', JSON.stringify(data)),
  toggleWishlist: (product) => {
    const list = StorageService.getWishlist();
    const idx = list.findIndex(i => i.id === product.id);
    if (idx !== -1) { list.splice(idx, 1); } else { list.push(product); }
    StorageService.saveWishlist(list);
    return list;
  },
  isWishlisted: (id) => StorageService.getWishlist().some(i => i.id === id),

  getCategories: () => JSON.parse(localStorage.getItem('voltgh_categories') || '[]'),
  saveCategories: (data) => localStorage.setItem('voltgh_categories', JSON.stringify(data)),

  getSettings: () => JSON.parse(localStorage.getItem('voltgh_settings') || '{}'),
  saveSettings: (data) => localStorage.setItem('voltgh_settings', JSON.stringify(data)),

  getPayments: () => JSON.parse(localStorage.getItem('voltgh_payments') || '[]'),
  savePayments: (data) => localStorage.setItem('voltgh_payments', JSON.stringify(data)),
  addPayment: (payment) => {
    const payments = StorageService.getPayments();
    payments.unshift(payment);
    StorageService.savePayments(payments);
  },

  getRecentlyViewed: () => JSON.parse(localStorage.getItem('voltgh_rv') || '[]'),
  addRecentlyViewed: (product) => {
    let rv = StorageService.getRecentlyViewed();
    rv = rv.filter(i => i.id !== product.id);
    rv.unshift(product);
    if (rv.length > 10) rv = rv.slice(0, 10);
    localStorage.setItem('voltgh_rv', JSON.stringify(rv));
  },

  getDiscounts: () => ({
    'VOLT10': { type: 'percent', value: 10, label: '10% OFF' },
    'VOLT20': { type: 'percent', value: 20, label: '20% OFF' },
    'SAVE100': { type: 'fixed', value: 100, label: 'GHS 100 OFF' }
  }),
  applyDiscount: (code, total) => {
    const discounts = StorageService.getDiscounts();
    const d = discounts[code.toUpperCase()];
    if (!d) return null;
    const savings = d.type === 'percent' ? (total * d.value / 100) : d.value;
    return { ...d, savings: Math.min(savings, total) };
  },

  generateOrderId: () => {
    const ts = Date.now().toString(36).toUpperCase();
    const rand = Math.random().toString(36).substring(2, 6).toUpperCase();
    return `VGH-${ts}-${rand}`;
  },

  isAdminLoggedIn: () => sessionStorage.getItem('voltgh_admin') === 'true',
  adminLogin: (pass) => {
    if (pass === 'volt2024') { sessionStorage.setItem('voltgh_admin', 'true'); return true; }
    return false;
  },
  adminLogout: () => sessionStorage.removeItem('voltgh_admin')
};

// ===== IMGBB UPLOAD SERVICE =====
const ImgBBService = {
  apiKey: 'bdd12743a2e929bcdd4a6843dea9295e',
  async upload(file) {
    const formData = new FormData();
    formData.append('image', file);
    const response = await fetch(`https://api.imgbb.com/1/upload?key=${this.apiKey}`, { method: 'POST', body: formData });
    const data = await response.json();
    if (!data.success) throw new Error('Upload failed');
    return { url: data.data.url, display_url: data.data.display_url, delete_url: data.data.delete_url, thumb: data.data.thumb?.url };
  }
};

// ===== DEFAULT DATA SEEDER =====
function seedDefaultData() {
  // Force re-seed to apply stock updates — remove the next line after first load
  localStorage.removeItem('voltgh_products');

  if (StorageService.getProducts().length > 0) return;

  const categories = [
    { id: 'c1',  name: 'TVs & Displays',      matIcon: 'tv',                    color: '#2563EB' },
    { id: 'c2',  name: 'Refrigerators',        matIcon: 'kitchen',               color: '#0891B2' },
    { id: 'c3',  name: 'Washing Machines',     matIcon: 'local_laundry_service', color: '#7C3AED' },
    { id: 'c4',  name: 'Air Conditioners',     matIcon: 'ac_unit',               color: '#0D9488' },
    { id: 'c5',  name: 'Laptops & PCs',        matIcon: 'laptop',                color: '#EA580C' },
    { id: 'c6',  name: 'Audio & Sound',        matIcon: 'speaker',               color: '#DB2777' },
    { id: 'c7',  name: 'Cooking Appliances',   matIcon: 'microwave',             color: '#D97706' },
    { id: 'c8',  name: 'Phones & Tablets',     matIcon: 'smartphone',            color: '#16A34A' },
    { id: 'c9',  name: 'Lighting & Studio',    matIcon: 'light_mode',            color: '#F59E0B' },
    { id: 'c10', name: 'Home & Living',        matIcon: 'home',                  color: '#6366F1' },
    { id: 'c11', name: 'Personal Care',        matIcon: 'self_improvement',      color: '#EC4899' },
    { id: 'c12', name: 'Cameras & Security',   matIcon: 'camera_alt',            color: '#64748B' }
  ];

  const products = [

    // ═══════════════════════════════════════════════════════════════
    // TVs & DISPLAYS  (c1)
    // ═══════════════════════════════════════════════════════════════

    // ─── SOLD OUT ────────────────────────────────────────────────
    {
      id: 'p1', name: 'Samsung 55" Crystal UHD 4K Smart TV', category: 'c1',
      price: 6500, oldPrice: 7800, stock: 0,
      image: 'https://images.unsplash.com/photo-1593359677879-a4bb92f4834c?w=600&q=80',
      images: ['https://images.unsplash.com/photo-1593359677879-a4bb92f4834c?w=600&q=80','https://images.unsplash.com/photo-1548686304-89d188a80029?w=600&q=80'],
      description: 'Samsung 55-inch Crystal UHD 4K Smart TV with PurColor technology, Motion Xcelerator, and built-in Alexa. Stream Netflix, YouTube and more directly.',
      badge: 'Hot', rating: 4.7, reviews: 203, isNew: false
    },
    {
      id: 'p2', name: 'LG 43" Full HD Smart TV', category: 'c1',
      price: 3200, oldPrice: 3900, stock: 0,
      image: 'https://images.unsplash.com/photo-1601944177325-f8867652837f?w=600&q=80',
      images: ['https://images.unsplash.com/photo-1601944177325-f8867652837f?w=600&q=80'],
      description: 'LG 43-inch Full HD Smart TV with webOS, ThinQ AI, and Magic Remote. Enjoy vivid colours and exceptional clarity for movies and gaming.',
      badge: 'Sale', rating: 4.5, reviews: 144, isNew: false
    },
    // ─── IN STOCK ────────────────────────────────────────────────
    {
      id: 'p17', name: 'Hisense 50" 4K QLED Smart TV', category: 'c1',
      price: 5200, oldPrice: 6100, stock: 8,
      image: 'https://images.unsplash.com/photo-1574375927938-d5a98e8ffe85?w=600&q=80',
      images: ['https://images.unsplash.com/photo-1574375927938-d5a98e8ffe85?w=600&q=80'],
      description: 'Hisense 50-inch QLED 4K Smart TV with Quantum Dot technology, Dolby Vision HDR, built-in Alexa and Google Assistant. Breathtaking colours.',
      badge: 'New', rating: 4.6, reviews: 88, isNew: true
    },
    {
      id: 'p18', name: 'TCL 32" HD Android TV', category: 'c1',
      price: 1850, oldPrice: 2200, stock: 14,
      image: 'https://images.unsplash.com/photo-1509281373149-e957c6296406?w=600&q=80',
      images: ['https://images.unsplash.com/photo-1509281373149-e957c6296406?w=600&q=80'],
      description: 'TCL 32-inch HD Android TV with Google Play Store, Chromecast built-in, HDR and slim bezel design. Great for bedrooms and small living rooms.',
      badge: 'Sale', rating: 4.3, reviews: 121, isNew: false
    },

    // ═══════════════════════════════════════════════════════════════
    // REFRIGERATORS  (c2)
    // ═══════════════════════════════════════════════════════════════

    // ─── IN STOCK ────────────────────────────────────────────────
    {
      id: 'p3', name: 'Samsung 300L Double Door Fridge', category: 'c2',
      price: 4800, oldPrice: 5500, stock: 7,
      image: 'https://images.unsplash.com/photo-1584568694244-14fbdf83bd30?w=600&q=80',
      images: ['https://images.unsplash.com/photo-1584568694244-14fbdf83bd30?w=600&q=80'],
      description: 'Samsung 300-litre double door refrigerator with Twin Cooling Plus, No-Frost technology, and digital inverter compressor. Energy-efficient and whisper-quiet.',
      badge: 'Hot', rating: 4.6, reviews: 178, isNew: false
    },
    // ─── SOLD OUT ────────────────────────────────────────────────
    {
      id: 'p4', name: 'Hisense 205L Single Door Fridge', category: 'c2',
      price: 1900, oldPrice: 2300, stock: 0,
      image: 'https://images.unsplash.com/photo-1571175443880-49e1d25b2bc5?w=600&q=80',
      images: ['https://images.unsplash.com/photo-1571175443880-49e1d25b2bc5?w=600&q=80'],
      description: 'Hisense 205-litre single door fridge with adjustable glass shelves, vegetable crisper, and low noise compressor. Perfect for small families.',
      badge: 'New', rating: 4.3, reviews: 87, isNew: true
    },
    // ─── IN STOCK ────────────────────────────────────────────────
    {
      id: 'p19', name: 'LG 428L Side-by-Side Refrigerator', category: 'c2',
      price: 8900, oldPrice: 10500, stock: 4,
      image: 'https://images.unsplash.com/photo-1584568694244-14fbdf83bd30?w=600&q=80',
      images: ['https://images.unsplash.com/photo-1584568694244-14fbdf83bd30?w=600&q=80'],
      description: 'LG 428-litre side-by-side refrigerator with InstaView Door-in-Door, craft ice maker, Wi-Fi ThinQ and linear compressor. The ultimate kitchen appliance.',
      badge: 'Hot', rating: 4.8, reviews: 56, isNew: false
    },
    {
      id: 'p20', name: 'Midea 150L Table Top Fridge', category: 'c2',
      price: 1350, oldPrice: 1600, stock: 22,
      image: 'https://images.unsplash.com/photo-1571175443880-49e1d25b2bc5?w=600&q=80',
      images: ['https://images.unsplash.com/photo-1571175443880-49e1d25b2bc5?w=600&q=80'],
      description: 'Midea 150-litre table-top refrigerator ideal for offices, dorm rooms or small kitchens. Energy-efficient, low noise and easy to clean.',
      badge: '', rating: 4.2, reviews: 64, isNew: false
    },

    // ═══════════════════════════════════════════════════════════════
    // WASHING MACHINES  (c3)
    // ═══════════════════════════════════════════════════════════════

    // ─── IN STOCK ────────────────────────────────────────────────
    {
      id: 'p5', name: 'LG 7kg Front Load Washing Machine', category: 'c3',
      price: 3800, oldPrice: 4500, stock: 9,
      image: 'https://images.unsplash.com/photo-1558618666-fcd25c85cd64?w=600&q=80',
      images: ['https://images.unsplash.com/photo-1558618666-fcd25c85cd64?w=600&q=80'],
      description: 'LG 7kg front load washer with 6 Motion Direct Drive, Steam+ technology, and AI DD. Multiple wash programs for all fabric types.',
      badge: '', rating: 4.8, reviews: 231, isNew: false
    },
    {
      id: 'p21', name: 'Samsung 8kg Top Load Washing Machine', category: 'c3',
      price: 3200, oldPrice: 3800, stock: 11,
      image: 'https://images.unsplash.com/photo-1626806787461-102c1bfaaea1?w=600&q=80',
      images: ['https://images.unsplash.com/photo-1626806787461-102c1bfaaea1?w=600&q=80'],
      description: 'Samsung 8kg top load washing machine with Wobble Technology, Digital Inverter Motor, and child lock. Gentle on clothes, tough on stains.',
      badge: 'Sale', rating: 4.5, reviews: 109, isNew: false
    },
    {
      id: 'p22', name: 'Hisense 6kg Twin Tub Washer', category: 'c3',
      price: 1400, oldPrice: 1750, stock: 18,
      image: 'https://images.unsplash.com/photo-1558618666-fcd25c85cd64?w=600&q=80',
      images: ['https://images.unsplash.com/photo-1558618666-fcd25c85cd64?w=600&q=80'],
      description: 'Hisense 6kg twin tub washing machine with separate wash and spin compartments. Affordable, durable and reliable for everyday laundry.',
      badge: '', rating: 4.1, reviews: 77, isNew: false
    },

    // ═══════════════════════════════════════════════════════════════
    // AIR CONDITIONERS  (c4)
    // ═══════════════════════════════════════════════════════════════

    // ─── SOLD OUT ────────────────────────────────────────────────
    {
      id: 'p6', name: 'Samsung 1.5HP Split Air Conditioner', category: 'c4',
      price: 4200, oldPrice: 5000, stock: 0,
      image: 'https://images.unsplash.com/photo-1631545820632-9e5a1f23c8b2?w=600&q=80',
      images: ['https://images.unsplash.com/photo-1631545820632-9e5a1f23c8b2?w=600&q=80'],
      description: 'Samsung 1.5HP Wind-Free split air conditioner with Fast Cooling, Auto Clean, and Wi-Fi control. Keeps you cool silently and efficiently.',
      badge: 'Hot', rating: 4.6, reviews: 159, isNew: false
    },
    // ─── IN STOCK ────────────────────────────────────────────────
    {
      id: 'p16', name: 'Hisense 1HP Split AC (Inverter)', category: 'c4',
      price: 3100, oldPrice: 3700, stock: 12,
      image: 'https://images.unsplash.com/photo-1631545820632-9e5a1f23c8b2?w=600&q=80',
      images: ['https://images.unsplash.com/photo-1631545820632-9e5a1f23c8b2?w=600&q=80'],
      description: 'Hisense 1HP Inverter Split AC with energy-saving technology, self-cleaning filter, Wi-Fi control and fast cooling. Quiet and efficient.',
      badge: 'New', rating: 4.4, reviews: 63, isNew: true
    },
    {
      id: 'p23', name: 'Midea 2HP Floor Standing AC', category: 'c4',
      price: 7500, oldPrice: 8800, stock: 5,
      image: 'https://images.unsplash.com/photo-1631545820632-9e5a1f23c8b2?w=600&q=80',
      images: ['https://images.unsplash.com/photo-1631545820632-9e5a1f23c8b2?w=600&q=80'],
      description: 'Midea 2HP floor standing air conditioner with powerful airflow, 4-way auto swing, sleep mode, and self-cleaning function. Ideal for large rooms.',
      badge: 'Hot', rating: 4.5, reviews: 42, isNew: false
    },

    // ═══════════════════════════════════════════════════════════════
    // LAPTOPS & PCs  (c5)
    // ═══════════════════════════════════════════════════════════════

    // ─── IN STOCK ────────────────────────────────────────────────
    {
      id: 'p7', name: 'HP Pavilion Laptop 15.6" (i5 12th Gen)', category: 'c5',
      price: 7200, oldPrice: 8500, stock: 6,
      image: 'https://images.unsplash.com/photo-1496181133206-80ce9b88a853?w=600&q=80',
      images: ['https://images.unsplash.com/photo-1496181133206-80ce9b88a853?w=600&q=80','https://images.unsplash.com/photo-1525547719571-a2d4ac8945e2?w=600&q=80'],
      description: 'HP Pavilion laptop with Intel Core i5 12th Gen, 8GB RAM, 512GB SSD, 15.6-inch FHD display, Windows 11. Ideal for work and entertainment.',
      badge: 'Sale', rating: 4.7, reviews: 118, isNew: false
    },
    // ─── 2 LEFT IN STOCK ─────────────────────────────────────────
    {
      id: 'p8', name: 'Dell Inspiron 14 (Ryzen 5)', category: 'c5',
      price: 5800, oldPrice: null, stock: 2,
      image: 'https://images.unsplash.com/photo-1593642702821-c8da6771f0c6?w=600&q=80',
      images: ['https://images.unsplash.com/photo-1593642702821-c8da6771f0c6?w=600&q=80'],
      description: 'Dell Inspiron 14 powered by AMD Ryzen 5, 16GB RAM, 512GB SSD and 14-inch FHD touch display. Slim, powerful and great all-day battery.',
      badge: 'New', rating: 4.5, reviews: 74, isNew: true
    },
    // ─── IN STOCK ────────────────────────────────────────────────
    {
      id: 'p24', name: 'Lenovo IdeaPad Slim 3 (i3 13th Gen)', category: 'c5',
      price: 4500, oldPrice: 5200, stock: 10,
      image: 'https://images.unsplash.com/photo-1588872657578-7efd1f1555ed?w=600&q=80',
      images: ['https://images.unsplash.com/photo-1588872657578-7efd1f1555ed?w=600&q=80'],
      description: 'Lenovo IdeaPad Slim 3 with Intel Core i3 13th Gen, 8GB RAM, 256GB SSD, 15.6-inch FHD display. Lightweight everyday laptop at an unbeatable price.',
      badge: 'Sale', rating: 4.3, reviews: 95, isNew: false
    },
    {
      id: 'p25', name: 'Apple MacBook Air M2 (8GB/256GB)', category: 'c5',
      price: 14500, oldPrice: 16000, stock: 3,
      image: 'https://images.unsplash.com/photo-1517336714731-489689fd1ca8?w=600&q=80',
      images: ['https://images.unsplash.com/photo-1517336714731-489689fd1ca8?w=600&q=80'],
      description: 'Apple MacBook Air with M2 chip, 8GB unified memory, 256GB SSD, 13.6-inch Liquid Retina display and MagSafe charging. Blazing fast, fanless design.',
      badge: 'Hot', rating: 4.9, reviews: 214, isNew: false
    },

    // ═══════════════════════════════════════════════════════════════
    // AUDIO & SOUND  (c6)
    // ═══════════════════════════════════════════════════════════════

    // ─── IN STOCK ────────────────────────────────────────────────
    {
      id: 'p9', name: 'Sony HT-S400 2.1ch Soundbar', category: 'c6',
      price: 2100, oldPrice: 2600, stock: 16,
      image: 'https://images.unsplash.com/photo-1545454675-3531b543be5d?w=600&q=80',
      images: ['https://images.unsplash.com/photo-1545454675-3531b543be5d?w=600&q=80'],
      description: 'Sony HT-S400 soundbar with powerful subwoofer, Bluetooth 5.0, HDMI ARC, and S-Force PRO front surround sound. Turn your TV into a cinema.',
      badge: '', rating: 4.4, reviews: 195, isNew: false
    },
    // ─── 2 LEFT IN STOCK ─────────────────────────────────────────
    {
      id: 'p10', name: 'JBL Xtreme 3 Portable Bluetooth Speaker', category: 'c6',
      price: 1400, oldPrice: 1750, stock: 2,
      image: 'https://images.unsplash.com/photo-1608043152269-423dbba4e7e1?w=600&q=80',
      images: ['https://images.unsplash.com/photo-1608043152269-423dbba4e7e1?w=600&q=80'],
      description: 'JBL Xtreme 3 with 15-hour playtime, IP67 waterproof, PartyBoost multi-speaker pairing, and built-in powerbank. Perfect for outdoor fun.',
      badge: 'Sale', rating: 4.6, reviews: 312, isNew: false
    },
    // ─── IN STOCK ────────────────────────────────────────────────
    {
      id: 'p26', name: 'Sony WH-1000XM5 Noise Cancelling Headphones', category: 'c6',
      price: 3800, oldPrice: 4500, stock: 7,
      image: 'https://images.unsplash.com/photo-1505740420928-5e560c06d30e?w=600&q=80',
      images: ['https://images.unsplash.com/photo-1505740420928-5e560c06d30e?w=600&q=80'],
      description: 'Sony WH-1000XM5 industry-leading noise cancellation, 30-hour battery, multipoint connection and crystal clear hands-free calling. The best headphones you can own.',
      badge: 'Hot', rating: 4.9, reviews: 478, isNew: false
    },
    {
      id: 'p27', name: 'Samsung HW-B550 2.1ch Soundbar', category: 'c6',
      price: 1750, oldPrice: 2100, stock: 9,
      image: 'https://images.unsplash.com/photo-1545454675-3531b543be5d?w=600&q=80',
      images: ['https://images.unsplash.com/photo-1545454675-3531b543be5d?w=600&q=80'],
      description: 'Samsung HW-B550 soundbar with wireless subwoofer, Dolby Audio, DTS Virtual:X, and Adaptive Sound Lite technology. Deep bass, clear dialogue.',
      badge: 'New', rating: 4.4, reviews: 67, isNew: true
    },

    // ═══════════════════════════════════════════════════════════════
    // COOKING APPLIANCES  (c7)
    // ═══════════════════════════════════════════════════════════════

    // ─── IN STOCK ────────────────────────────────────────────────
    {
      id: 'p11', name: 'Midea 25L Microwave Oven', category: 'c7',
      price: 680, oldPrice: 850, stock: 30,
      image: 'https://images.unsplash.com/photo-1585771724684-38269d6639fd?w=600&q=80',
      images: ['https://images.unsplash.com/photo-1585771724684-38269d6639fd?w=600&q=80'],
      description: 'Midea 25-litre microwave oven with 900W power, 10 power levels, digital display, and 30-minute timer. Defrost, reheat and cook with ease.',
      badge: '', rating: 4.2, reviews: 143, isNew: false
    },
    // ─── AVAILABLE IN 3 DAYS ─────────────────────────────────────
    {
      id: 'p12', name: 'Scanfrost 4-Burner Gas Cooker', category: 'c7',
      price: 1550, oldPrice: 1900, stock: 0, availableInDays: 3,
      image: 'https://images.unsplash.com/photo-1556909114-f6e7ad7d3136?w=600&q=80',
      images: ['https://images.unsplash.com/photo-1556909114-f6e7ad7d3136?w=600&q=80'],
      description: 'Scanfrost 4-burner gas cooker with oven, auto-ignition, tempered glass lid, and stainless steel finish. Built for busy Ghanaian kitchens.',
      badge: 'Hot', rating: 4.5, reviews: 267, isNew: false
    },
    // ─── 2 LEFT IN STOCK ─────────────────────────────────────────
    {
      id: 'p15', name: 'Philips Air Fryer XXL (6.2L)', category: 'c7',
      price: 1200, oldPrice: 1500, stock: 2,
      image: 'https://images.unsplash.com/photo-1648145887782-8cd7a6a5bee5?w=600&q=80',
      images: ['https://images.unsplash.com/photo-1648145887782-8cd7a6a5bee5?w=600&q=80'],
      description: 'Philips XXL Air Fryer cooks crispy meals with up to 90% less fat. 6.2-litre capacity feeds the whole family. Digital display with 7 pre-sets.',
      badge: 'Hot', rating: 4.8, reviews: 421, isNew: false
    },
    // ─── IN STOCK ────────────────────────────────────────────────
    {
      id: 'p28', name: 'Bruhm 2-Burner Electric Hot Plate', category: 'c7',
      price: 420, oldPrice: 550, stock: 35,
      image: 'https://images.unsplash.com/photo-1556909114-f6e7ad7d3136?w=600&q=80',
      images: ['https://images.unsplash.com/photo-1556909114-f6e7ad7d3136?w=600&q=80'],
      description: 'Bruhm 2-burner electric hot plate with cast iron heating elements, adjustable heat control, and non-slip rubber feet. Compact and reliable.',
      badge: '', rating: 4.0, reviews: 89, isNew: false
    },
    {
      id: 'p29', name: 'Kenwood Stand Mixer (5L Bowl)', category: 'c7',
      price: 2200, oldPrice: 2700, stock: 6,
      image: 'https://images.unsplash.com/photo-1574672280600-4accfa5b6f98?w=600&q=80',
      images: ['https://images.unsplash.com/photo-1574672280600-4accfa5b6f98?w=600&q=80'],
      description: 'Kenwood Chef stand mixer with 5-litre stainless bowl, 1000W motor, 6-speed settings and includes dough hook, whisk and beater. Bake like a pro.',
      badge: 'New', rating: 4.7, reviews: 53, isNew: true
    },
    {
      id: 'p30', name: 'Panasonic 1.8L Rice Cooker', category: 'c7',
      price: 380, oldPrice: 480, stock: 40,
      image: 'https://images.unsplash.com/photo-1585771724684-38269d6639fd?w=600&q=80',
      images: ['https://images.unsplash.com/photo-1585771724684-38269d6639fd?w=600&q=80'],
      description: 'Panasonic 1.8-litre rice cooker with automatic keep-warm, steam cooking function, and non-stick inner pan. Perfectly cooked rice every time.',
      badge: 'Sale', rating: 4.3, reviews: 198, isNew: false
    },
    {
      id: 'p31', name: 'Binatone Juice Blender (1.5L)', category: 'c7',
      price: 290, oldPrice: 370, stock: 50,
      image: 'https://images.unsplash.com/photo-1570222094114-d054a817e56b?w=600&q=80',
      images: ['https://images.unsplash.com/photo-1570222094114-d054a817e56b?w=600&q=80'],
      description: 'Binatone 1.5-litre blender with 3-speed control, pulse function, stainless steel blades and safety lock lid. Smoothies, soups and more.',
      badge: '', rating: 4.1, reviews: 134, isNew: false
    },
    {
      id: 'p32', name: 'Ramtons Electric Kettle (1.7L)', category: 'c7',
      price: 180, oldPrice: 230, stock: 60,
      image: 'https://images.unsplash.com/photo-1585771724684-38269d6639fd?w=600&q=80',
      images: ['https://images.unsplash.com/photo-1585771724684-38269d6639fd?w=600&q=80'],
      description: 'Ramtons 1.7-litre electric kettle with 2200W rapid boil, auto shut-off, boil-dry protection, 360° swivel base and stainless steel interior.',
      badge: '', rating: 4.2, reviews: 212, isNew: false
    },

    // ═══════════════════════════════════════════════════════════════
    // PHONES & TABLETS  (c8)
    // ═══════════════════════════════════════════════════════════════

    // ─── IN STOCK ────────────────────────────────────────────────
    {
      id: 'p13', name: 'Samsung Galaxy A35 5G', category: 'c8',
      price: 2400, oldPrice: 2800, stock: 19,
      image: 'https://images.unsplash.com/photo-1610945415295-d9bbf067e59c?w=600&q=80',
      images: ['https://images.unsplash.com/photo-1610945415295-d9bbf067e59c?w=600&q=80'],
      description: 'Samsung Galaxy A35 5G with 6.6-inch Super AMOLED display, 50MP triple camera, 5000mAh battery and 5G connectivity. Style meets performance.',
      badge: 'New', rating: 4.4, reviews: 96, isNew: true
    },
    {
      id: 'p14', name: 'Tecno POVA 6 Pro (256GB)', category: 'c8',
      price: 1350, oldPrice: 1600, stock: 32,
      image: 'https://images.unsplash.com/photo-1511707171634-5f897ff02aa9?w=600&q=80',
      images: ['https://images.unsplash.com/photo-1511707171634-5f897ff02aa9?w=600&q=80'],
      description: 'Tecno POVA 6 Pro with 6.78-inch FHD+ 144Hz display, 70W fast charging, 6000mAh battery and 50MP AI camera. Big power, great value.',
      badge: 'Sale', rating: 4.3, reviews: 184, isNew: false
    },
    {
      id: 'p33', name: 'iPhone 15 (128GB)', category: 'c8',
      price: 12500, oldPrice: 13800, stock: 5,
      image: 'https://images.unsplash.com/photo-1632661674596-df8be070a5c5?w=600&q=80',
      images: ['https://images.unsplash.com/photo-1632661674596-df8be070a5c5?w=600&q=80'],
      description: 'Apple iPhone 15 with 6.1-inch Super Retina XDR display, A16 Bionic chip, 48MP main camera, USB-C and Dynamic Island. Pure iPhone experience.',
      badge: 'Hot', rating: 4.8, reviews: 341, isNew: false
    },
    {
      id: 'p34', name: 'Samsung Galaxy Tab A9+ (WiFi)', category: 'c8',
      price: 2900, oldPrice: 3400, stock: 13,
      image: 'https://images.unsplash.com/photo-1544244015-0df4b3ffc6b0?w=600&q=80',
      images: ['https://images.unsplash.com/photo-1544244015-0df4b3ffc6b0?w=600&q=80'],
      description: 'Samsung Galaxy Tab A9+ with 11-inch TFT display, Snapdragon 695, 8GB RAM, 128GB storage, quad speakers and 7040mAh battery. Work and play seamlessly.',
      badge: 'New', rating: 4.5, reviews: 72, isNew: true
    },
    {
      id: 'p35', name: 'Infinix Note 40 Pro (256GB)', category: 'c8',
      price: 1650, oldPrice: 1950, stock: 28,
      image: 'https://images.unsplash.com/photo-1511707171634-5f897ff02aa9?w=600&q=80',
      images: ['https://images.unsplash.com/photo-1511707171634-5f897ff02aa9?w=600&q=80'],
      description: 'Infinix Note 40 Pro with 6.78-inch AMOLED display, 108MP camera, 45W fast charging + wireless charging, 5000mAh battery. Premium feel, smart price.',
      badge: 'Sale', rating: 4.4, reviews: 110, isNew: false
    },

    // ═══════════════════════════════════════════════════════════════
    // LIGHTING & STUDIO  (c9)
    // ═══════════════════════════════════════════════════════════════

    // ─── IN STOCK ────────────────────────────────────────────────
    {
      id: 'p36', name: '18" LED Ring Light with Tripod Stand', category: 'c9',
      price: 480, oldPrice: 620, stock: 45,
      image: 'https://images.unsplash.com/photo-1614846027182-cecab16a41c8?w=600&q=80',
      images: ['https://images.unsplash.com/photo-1614846027182-cecab16a41c8?w=600&q=80'],
      description: '18-inch LED ring light with adjustable 3-colour temperature (3000K–6000K), 10 brightness levels, 6.5ft tripod, phone holder and remote. Perfect for content creators, TikTok and makeup.',
      badge: 'Hot', rating: 4.7, reviews: 389, isNew: false
    },
    {
      id: 'p37', name: '10" Selfie Ring Light with Desk Clamp', category: 'c9',
      price: 220, oldPrice: 300, stock: 60,
      image: 'https://images.unsplash.com/photo-1614846027182-cecab16a41c8?w=600&q=80',
      images: ['https://images.unsplash.com/photo-1614846027182-cecab16a41c8?w=600&q=80'],
      description: '10-inch ring light with flexible gooseneck arm, desk clamp mount, USB powered, 3 light modes and 10 brightness levels. Great for video calls, streaming and beauty.',
      badge: 'New', rating: 4.5, reviews: 203, isNew: true
    },
    {
      id: 'p38', name: '26" Professional RGB Ring Light Kit', category: 'c9',
      price: 950, oldPrice: 1200, stock: 15,
      image: 'https://images.unsplash.com/photo-1614846027182-cecab16a41c8?w=600&q=80',
      images: ['https://images.unsplash.com/photo-1614846027182-cecab16a41c8?w=600&q=80'],
      description: '26-inch professional ring light with RGB colour effects, stepless dimming, ball-head mount, 8ft heavy-duty tripod and Bluetooth remote. Ideal for photography studios and YouTubers.',
      badge: 'Sale', rating: 4.6, reviews: 94, isNew: false
    },
    {
      id: 'p39', name: 'Portable LED Video Light Panel (Bi-Colour)', category: 'c9',
      price: 350, oldPrice: 440, stock: 30,
      image: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=600&q=80',
      images: ['https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=600&q=80'],
      description: 'Bi-colour LED video light panel 3200K–5600K, CRI 95+, 2500 lux brightness, battery or USB powered with cold shoe mount. Ideal for on-the-go filming and photography.',
      badge: 'New', rating: 4.4, reviews: 58, isNew: true
    },
    {
      id: 'p40', name: 'Smart LED Strip Lights (10m, RGB WiFi)', category: 'c9',
      price: 270, oldPrice: 360, stock: 80,
      image: 'https://images.unsplash.com/photo-1558618666-fcd25c85cd64?w=600&q=80',
      images: ['https://images.unsplash.com/photo-1558618666-fcd25c85cd64?w=600&q=80'],
      description: '10-metre RGB WiFi smart LED strip lights compatible with Alexa and Google Home. 16 million colours, music sync mode, app control and cuttable design. Transform any room.',
      badge: 'Hot', rating: 4.6, reviews: 512, isNew: false
    },

    // ═══════════════════════════════════════════════════════════════
    // HOME & LIVING  (c10)
    // ═══════════════════════════════════════════════════════════════

    // ─── IN STOCK ────────────────────────────────────────────────
    {
      id: 'p41', name: 'Dyson V8 Cordless Vacuum Cleaner', category: 'c10',
      price: 5500, oldPrice: 6500, stock: 6,
      image: 'https://images.unsplash.com/photo-1558618666-fcd25c85cd64?w=600&q=80',
      images: ['https://images.unsplash.com/photo-1558618666-fcd25c85cd64?w=600&q=80'],
      description: 'Dyson V8 cordless vacuum with powerful suction, 40-min runtime, whole-machine HEPA filtration and transforms into handheld. Cleans floors, carpets and upholstery effortlessly.',
      badge: 'Hot', rating: 4.8, reviews: 267, isNew: false
    },
    {
      id: 'p42', name: 'Philips 2400W Steam Iron', category: 'c10',
      price: 380, oldPrice: 480, stock: 40,
      image: 'https://images.unsplash.com/photo-1558618666-fcd25c85cd64?w=600&q=80',
      images: ['https://images.unsplash.com/photo-1558618666-fcd25c85cd64?w=600&q=80'],
      description: 'Philips 2400W steam iron with OptimalTEMP technology, no burn guarantee, 220g steam boost and non-stick soleplate. Effortless ironing on all fabrics.',
      badge: '', rating: 4.5, reviews: 178, isNew: false
    },
    {
      id: 'p43', name: 'Honeywell Tower Fan (35" Oscillating)', category: 'c10',
      price: 650, oldPrice: 800, stock: 20,
      image: 'https://images.unsplash.com/photo-1558618666-fcd25c85cd64?w=600&q=80',
      images: ['https://images.unsplash.com/photo-1558618666-fcd25c85cd64?w=600&q=80'],
      description: 'Honeywell 35-inch oscillating tower fan with 3 speed settings, 8-hour timer, remote control, ultra-quiet motor and slim design. Stay cool without the noise.',
      badge: 'New', rating: 4.4, reviews: 92, isNew: true
    },
    {
      id: 'p44', name: 'Rowenta Garment Steamer (1600W)', category: 'c10',
      price: 520, oldPrice: 650, stock: 18,
      image: 'https://images.unsplash.com/photo-1558618666-fcd25c85cd64?w=600&q=80',
      images: ['https://images.unsplash.com/photo-1558618666-fcd25c85cd64?w=600&q=80'],
      description: 'Rowenta 1600W garment steamer with 1.8-litre tank, continuous steam, ready in 45 seconds, and includes fabric brush and crease attachment. Refresh clothes in minutes.',
      badge: 'Sale', rating: 4.3, reviews: 74, isNew: false
    },
    {
      id: 'p45', name: 'Solar Rechargeable Standing Fan (16")', category: 'c10',
      price: 750, oldPrice: 950, stock: 25,
      image: 'https://images.unsplash.com/photo-1558618666-fcd25c85cd64?w=600&q=80',
      images: ['https://images.unsplash.com/photo-1558618666-fcd25c85cd64?w=600&q=80'],
      description: '16-inch solar rechargeable fan with built-in battery backup, 3 speed settings, USB charging port and LED light. Works during power outages — a Ghana must-have.',
      badge: 'Hot', rating: 4.7, reviews: 445, isNew: false
    },
    {
      id: 'p46', name: 'Homebuds Robot Vacuum & Mop', category: 'c10',
      price: 2800, oldPrice: 3500, stock: 8,
      image: 'https://images.unsplash.com/photo-1558618666-fcd25c85cd64?w=600&q=80',
      images: ['https://images.unsplash.com/photo-1558618666-fcd25c85cd64?w=600&q=80'],
      description: 'Smart robot vacuum and mop combo with laser navigation, app control, auto recharge, voice control support and 2700Pa suction. Cleans while you relax.',
      badge: 'New', rating: 4.5, reviews: 38, isNew: true
    },
    {
      id: 'p47', name: 'Portable Power Station (500Wh)', category: 'c10',
      price: 4200, oldPrice: 5000, stock: 10,
      image: 'https://images.unsplash.com/photo-1558618666-fcd25c85cd64?w=600&q=80',
      images: ['https://images.unsplash.com/photo-1558618666-fcd25c85cd64?w=600&q=80'],
      description: '500Wh portable power station with 220V AC outlet, 60W USB-C PD, USB-A ports and solar input compatibility. Keep your devices and appliances running during outages.',
      badge: 'Hot', rating: 4.8, reviews: 189, isNew: false
    },

    // ═══════════════════════════════════════════════════════════════
    // PERSONAL CARE  (c11)
    // ═══════════════════════════════════════════════════════════════

    // ─── IN STOCK ────────────────────────────────────────────────
    {
      id: 'p48', name: 'Philips Series 7000 Electric Shaver', category: 'c11',
      price: 1100, oldPrice: 1400, stock: 14,
      image: 'https://images.unsplash.com/photo-1621607512214-68297480165e?w=600&q=80',
      images: ['https://images.unsplash.com/photo-1621607512214-68297480165e?w=600&q=80'],
      description: 'Philips Series 7000 electric shaver with SkinIQ technology, 60-min battery, wet & dry use and precision trimmer. Effortless close shave every time.',
      badge: 'Hot', rating: 4.6, reviews: 155, isNew: false
    },
    {
      id: 'p49', name: 'Babyliss Hair Dryer (2200W)', category: 'c11',
      price: 650, oldPrice: 800, stock: 22,
      image: 'https://images.unsplash.com/photo-1522338242992-e1a54906a8da?w=600&q=80',
      images: ['https://images.unsplash.com/photo-1522338242992-e1a54906a8da?w=600&q=80'],
      description: 'BaByliss 2200W professional hair dryer with ionic technology, 6 heat/speed combinations, cool shot button and diffuser. Salon-quality results at home.',
      badge: 'Sale', rating: 4.5, reviews: 189, isNew: false
    },
    {
      id: 'p50', name: 'Kemei Professional Hair Clipper', category: 'c11',
      price: 210, oldPrice: 280, stock: 55,
      image: 'https://images.unsplash.com/photo-1503951914875-452162b0f3f1?w=600&q=80',
      images: ['https://images.unsplash.com/photo-1503951914875-452162b0f3f1?w=600&q=80'],
      description: 'Kemei professional cordless hair clipper with titanium blades, 4 guide combs, USB charging and 3-hour runtime. Barber-grade cuts at home.',
      badge: 'New', rating: 4.3, reviews: 274, isNew: true
    },
    {
      id: 'p51', name: 'Braun Silk-épil 9 Epilator', category: 'c11',
      price: 980, oldPrice: 1200, stock: 11,
      image: 'https://images.unsplash.com/photo-1522338242992-e1a54906a8da?w=600&q=80',
      images: ['https://images.unsplash.com/photo-1522338242992-e1a54906a8da?w=600&q=80'],
      description: 'Braun Silk-épil 9 epilator with 40 tweezers, MicroGrip technology, wet & dry use, and skin contact cap. Removes hair 4x shorter than waxing.',
      badge: '', rating: 4.4, reviews: 97, isNew: false
    },
    {
      id: 'p52', name: 'Oral-B iO Series 6 Electric Toothbrush', category: 'c11',
      price: 850, oldPrice: 1050, stock: 16,
      image: 'https://images.unsplash.com/photo-1609840112855-eb1cd11b9a3c?w=600&q=80',
      images: ['https://images.unsplash.com/photo-1609840112855-eb1cd11b9a3c?w=600&q=80'],
      description: 'Oral-B iO Series 6 with AI-powered brushing recognition, 5 smart modes, pressure sensor, magnetic charger and travel case. Your dentist's favourite brand.',
      badge: 'New', rating: 4.7, reviews: 132, isNew: true
    },

    // ═══════════════════════════════════════════════════════════════
    // CAMERAS & SECURITY  (c12)
    // ═══════════════════════════════════════════════════════════════

    // ─── IN STOCK ────────────────────────────────────────────────
    {
      id: 'p53', name: 'Canon EOS M50 Mark II Mirrorless Camera', category: 'c12',
      price: 7800, oldPrice: 9200, stock: 4,
      image: 'https://images.unsplash.com/photo-1502920917128-1aa500764cbd?w=600&q=80',
      images: ['https://images.unsplash.com/photo-1502920917128-1aa500764cbd?w=600&q=80'],
      description: 'Canon EOS M50 Mark II with 24.1MP APS-C sensor, 4K video, DIGIC 8 processor, Eye Detection AF, flip-out touchscreen and built-in Wi-Fi. Perfect for vloggers and creators.',
      badge: 'Hot', rating: 4.8, reviews: 208, isNew: false
    },
    {
      id: 'p54', name: 'Reolink 4MP WiFi Security Camera (2-Pack)', category: 'c12',
      price: 680, oldPrice: 860, stock: 30,
      image: 'https://images.unsplash.com/photo-1614064641938-3bbee52942c7?w=600&q=80',
      images: ['https://images.unsplash.com/photo-1614064641938-3bbee52942c7?w=600&q=80'],
      description: 'Reolink 2-pack 4MP outdoor WiFi security cameras with colour night vision, motion alerts, two-way audio and weatherproof housing. Protect your home 24/7.',
      badge: 'Sale', rating: 4.5, reviews: 317, isNew: false
    },
    {
      id: 'p55', name: 'DJI Osmo Pocket 3 Gimbal Camera', category: 'c12',
      price: 4500, oldPrice: 5200, stock: 6,
      image: 'https://images.unsplash.com/photo-1526170375885-4d8ecf77b99f?w=600&q=80',
      images: ['https://images.unsplash.com/photo-1526170375885-4d8ecf77b99f?w=600&q=80'],
      description: 'DJI Osmo Pocket 3 with 1-inch CMOS sensor, 4K/120fps video, 3-axis stabilisation, OLED touchscreen and 166-min battery. Cinema-quality in your pocket.',
      badge: 'New', rating: 4.9, reviews: 147, isNew: true
    },
    {
      id: 'p56', name: 'Tripod Stand with Phone & Camera Mount (72")', category: 'c12',
      price: 320, oldPrice: 420, stock: 50,
      image: 'https://images.unsplash.com/photo-1617450365226-9bf28c04e130?w=600&q=80',
      images: ['https://images.unsplash.com/photo-1617450365226-9bf28c04e130?w=600&q=80'],
      description: '72-inch aluminium tripod with ball head, quick-release plate, smartphone holder, Bluetooth remote shutter and carry bag. For cameras, ring lights and phones.',
      badge: 'Hot', rating: 4.5, reviews: 476, isNew: false
    },
    {
      id: 'p57', name: 'Ring Video Doorbell (WiFi HD)', category: 'c12',
      price: 1200, oldPrice: 1500, stock: 13,
      image: 'https://images.unsplash.com/photo-1614064641938-3bbee52942c7?w=600&q=80',
      images: ['https://images.unsplash.com/photo-1614064641938-3bbee52942c7?w=600&q=80'],
      description: 'WiFi video doorbell with 1080p HD camera, motion detection, two-way talk, night vision and instant phone alerts. See who is at your door from anywhere.',
      badge: 'New', rating: 4.6, reviews: 88, isNew: true
    }

  ];

  StorageService.saveCategories(categories);
  StorageService.saveProducts(products);
  StorageService.saveSettings({
    storeName: 'VoltGH Store',
    whatsapp: '233248062352',
    momoNumber: '0248062352',
    momoNetwork: 'MTN Mobile Money',
    currency: 'GHS',
    deliveryFee: 50,
    freeDeliveryThreshold: 1000
  });
}

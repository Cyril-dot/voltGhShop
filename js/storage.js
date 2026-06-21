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
  if (StorageService.getProducts().length > 0) return;

  const categories = [
    { id: 'c1', name: 'TVs & Displays',    matIcon: 'tv',              color: '#2563EB' },
    { id: 'c2', name: 'Refrigerators',     matIcon: 'kitchen',         color: '#0891B2' },
    { id: 'c3', name: 'Washing Machines',  matIcon: 'local_laundry_service', color: '#7C3AED' },
    { id: 'c4', name: 'Air Conditioners',  matIcon: 'ac_unit',         color: '#0D9488' },
    { id: 'c5', name: 'Laptops & PCs',     matIcon: 'laptop',          color: '#EA580C' },
    { id: 'c6', name: 'Audio & Sound',     matIcon: 'speaker',         color: '#DB2777' },
    { id: 'c7', name: 'Cooking Appliances',matIcon: 'microwave',       color: '#D97706' },
    { id: 'c8', name: 'Phones & Tablets',  matIcon: 'smartphone',      color: '#16A34A' }
  ];

  const products = [
    {
      id: 'p1', name: 'Samsung 55" Crystal UHD 4K Smart TV', category: 'c1',
      price: 6500, oldPrice: 7800, stock: 10,
      image: 'https://images.unsplash.com/photo-1593359677879-a4bb92f4834c?w=600&q=80',
      images: ['https://images.unsplash.com/photo-1593359677879-a4bb92f4834c?w=600&q=80','https://images.unsplash.com/photo-1548686304-89d188a80029?w=600&q=80'],
      description: 'Samsung 55-inch Crystal UHD 4K Smart TV with PurColor technology, Motion Xcelerator, and built-in Alexa. Stream Netflix, YouTube and more directly.',
      badge: 'Hot', rating: 4.7, reviews: 203, isNew: false
    },
    {
      id: 'p2', name: 'LG 43" Full HD Smart TV', category: 'c1',
      price: 3200, oldPrice: 3900, stock: 18,
      image: 'https://images.unsplash.com/photo-1601944177325-f8867652837f?w=600&q=80',
      images: ['https://images.unsplash.com/photo-1601944177325-f8867652837f?w=600&q=80'],
      description: 'LG 43-inch Full HD Smart TV with webOS, ThinQ AI, and Magic Remote. Enjoy vivid colours and exceptional clarity for movies and gaming.',
      badge: 'Sale', rating: 4.5, reviews: 144, isNew: false
    },
    {
      id: 'p3', name: 'Samsung 300L Double Door Fridge', category: 'c2',
      price: 4800, oldPrice: 5500, stock: 7,
      image: 'https://images.unsplash.com/photo-1584568694244-14fbdf83bd30?w=600&q=80',
      images: ['https://images.unsplash.com/photo-1584568694244-14fbdf83bd30?w=600&q=80'],
      description: 'Samsung 300-litre double door refrigerator with Twin Cooling Plus, No-Frost technology, and digital inverter compressor. Energy-efficient and whisper-quiet.',
      badge: 'Hot', rating: 4.6, reviews: 178, isNew: false
    },
    {
      id: 'p4', name: 'Hisense 205L Single Door Fridge', category: 'c2',
      price: 1900, oldPrice: 2300, stock: 22,
      image: 'https://images.unsplash.com/photo-1571175443880-49e1d25b2bc5?w=600&q=80',
      images: ['https://images.unsplash.com/photo-1571175443880-49e1d25b2bc5?w=600&q=80'],
      description: 'Hisense 205-litre single door fridge with adjustable glass shelves, vegetable crisper, and low noise compressor. Perfect for small families.',
      badge: 'New', rating: 4.3, reviews: 87, isNew: true
    },
    {
      id: 'p5', name: 'LG 7kg Front Load Washing Machine', category: 'c3',
      price: 3800, oldPrice: 4500, stock: 9,
      image: 'https://images.unsplash.com/photo-1558618666-fcd25c85cd64?w=600&q=80',
      images: ['https://images.unsplash.com/photo-1558618666-fcd25c85cd64?w=600&q=80'],
      description: 'LG 7kg front load washer with 6 Motion Direct Drive, Steam+ technology, and AI DD. Multiple wash programs for all fabric types.',
      badge: '', rating: 4.8, reviews: 231, isNew: false
    },
    {
      id: 'p6', name: 'Samsung 1.5HP Split Air Conditioner', category: 'c4',
      price: 4200, oldPrice: 5000, stock: 14,
      image: 'https://images.unsplash.com/photo-1631545820632-9e5a1f23c8b2?w=600&q=80',
      images: ['https://images.unsplash.com/photo-1631545820632-9e5a1f23c8b2?w=600&q=80'],
      description: 'Samsung 1.5HP Wind-Free split air conditioner with Fast Cooling, Auto Clean, and Wi-Fi control. Keeps you cool silently and efficiently.',
      badge: 'Hot', rating: 4.6, reviews: 159, isNew: false
    },
    {
      id: 'p7', name: 'HP Pavilion Laptop 15.6" (i5 12th Gen)', category: 'c5',
      price: 7200, oldPrice: 8500, stock: 6,
      image: 'https://images.unsplash.com/photo-1496181133206-80ce9b88a853?w=600&q=80',
      images: ['https://images.unsplash.com/photo-1496181133206-80ce9b88a853?w=600&q=80','https://images.unsplash.com/photo-1525547719571-a2d4ac8945e2?w=600&q=80'],
      description: 'HP Pavilion laptop with Intel Core i5 12th Gen, 8GB RAM, 512GB SSD, 15.6-inch FHD display, Windows 11. Ideal for work and entertainment.',
      badge: 'Sale', rating: 4.7, reviews: 118, isNew: false
    },
    {
      id: 'p8', name: 'Dell Inspiron 14 (Ryzen 5)', category: 'c5',
      price: 5800, oldPrice: null, stock: 11,
      image: 'https://images.unsplash.com/photo-1593642702821-c8da6771f0c6?w=600&q=80',
      images: ['https://images.unsplash.com/photo-1593642702821-c8da6771f0c6?w=600&q=80'],
      description: 'Dell Inspiron 14 powered by AMD Ryzen 5, 16GB RAM, 512GB SSD and 14-inch FHD touch display. Slim, powerful and great all-day battery.',
      badge: 'New', rating: 4.5, reviews: 74, isNew: true
    },
    {
      id: 'p9', name: 'Sony HT-S400 2.1ch Soundbar', category: 'c6',
      price: 2100, oldPrice: 2600, stock: 16,
      image: 'https://images.unsplash.com/photo-1545454675-3531b543be5d?w=600&q=80',
      images: ['https://images.unsplash.com/photo-1545454675-3531b543be5d?w=600&q=80'],
      description: 'Sony HT-S400 soundbar with powerful subwoofer, Bluetooth 5.0, HDMI ARC, and S-Force PRO front surround sound. Turn your TV into a cinema.',
      badge: '', rating: 4.4, reviews: 195, isNew: false
    },
    {
      id: 'p10', name: 'JBL Xtreme 3 Portable Bluetooth Speaker', category: 'c6',
      price: 1400, oldPrice: 1750, stock: 25,
      image: 'https://images.unsplash.com/photo-1608043152269-423dbba4e7e1?w=600&q=80',
      images: ['https://images.unsplash.com/photo-1608043152269-423dbba4e7e1?w=600&q=80'],
      description: 'JBL Xtreme 3 with 15-hour playtime, IP67 waterproof, PartyBoost multi-speaker pairing, and built-in powerbank. Perfect for outdoor fun.',
      badge: 'Sale', rating: 4.6, reviews: 312, isNew: false
    },
    {
      id: 'p11', name: 'Midea 25L Microwave Oven', category: 'c7',
      price: 680, oldPrice: 850, stock: 30,
      image: 'https://images.unsplash.com/photo-1585771724684-38269d6639fd?w=600&q=80',
      images: ['https://images.unsplash.com/photo-1585771724684-38269d6639fd?w=600&q=80'],
      description: 'Midea 25-litre microwave oven with 900W power, 10 power levels, digital display, and 30-minute timer. Defrost, reheat and cook with ease.',
      badge: '', rating: 4.2, reviews: 143, isNew: false
    },
    {
      id: 'p12', name: 'Scanfrost 4-Burner Gas Cooker', category: 'c7',
      price: 1550, oldPrice: 1900, stock: 20,
      image: 'https://images.unsplash.com/photo-1556909114-f6e7ad7d3136?w=600&q=80',
      images: ['https://images.unsplash.com/photo-1556909114-f6e7ad7d3136?w=600&q=80'],
      description: 'Scanfrost 4-burner gas cooker with oven, auto-ignition, tempered glass lid, and stainless steel finish. Built for busy Ghanaian kitchens.',
      badge: 'Hot', rating: 4.5, reviews: 267, isNew: false
    },
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
      id: 'p15', name: 'Philips Air Fryer XXL (6.2L)', category: 'c7',
      price: 1200, oldPrice: 1500, stock: 14,
      image: 'https://images.unsplash.com/photo-1648145887782-8cd7a6a5bee5?w=600&q=80',
      images: ['https://images.unsplash.com/photo-1648145887782-8cd7a6a5bee5?w=600&q=80'],
      description: 'Philips XXL Air Fryer cooks crispy meals with up to 90% less fat. 6.2-litre capacity feeds the whole family. Digital display with 7 pre-sets.',
      badge: 'Hot', rating: 4.8, reviews: 421, isNew: false
    },
    {
      id: 'p16', name: 'Hisense 1HP Split AC (Inverter)', category: 'c4',
      price: 3100, oldPrice: 3700, stock: 12,
      image: 'https://images.unsplash.com/photo-1631545820632-9e5a1f23c8b2?w=600&q=80',
      images: ['https://images.unsplash.com/photo-1631545820632-9e5a1f23c8b2?w=600&q=80'],
      description: 'Hisense 1HP Inverter Split AC with energy-saving technology, self-cleaning filter, Wi-Fi control and fast cooling. Quiet and efficient.',
      badge: 'New', rating: 4.4, reviews: 63, isNew: true
    }
  ];

  StorageService.saveCategories(categories);
  StorageService.saveProducts(products);
  StorageService.saveSettings({
    storeName: 'VoltGH Store',
    whatsapp: '233248828727',
    momoNumber: '0248828727',
    momoNetwork: 'MTN Mobile Money',
    currency: 'GHS',
    deliveryFee: 50,
    freeDeliveryThreshold: 1000
  });
}

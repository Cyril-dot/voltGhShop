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
    { id: 'c1',  name: 'TVs & Displays',        matIcon: 'tv',                    color: '#2563EB' },
    { id: 'c2',  name: 'Refrigerators',          matIcon: 'kitchen',               color: '#0891B2' },
    { id: 'c3',  name: 'Washing Machines',       matIcon: 'local_laundry_service', color: '#7C3AED' },
    { id: 'c4',  name: 'Air Conditioners',       matIcon: 'ac_unit',               color: '#0D9488' },
    { id: 'c5',  name: 'Laptops & PCs',          matIcon: 'laptop',                color: '#EA580C' },
    { id: 'c6',  name: 'Audio & Sound',          matIcon: 'speaker',               color: '#DB2777' },
    { id: 'c7',  name: 'Cooking Appliances',     matIcon: 'microwave',             color: '#D97706' },
    { id: 'c8',  name: 'Phones & Tablets',       matIcon: 'smartphone',            color: '#16A34A' },
    { id: 'c9',  name: 'Power & Solar',          matIcon: 'bolt',                  color: '#CA8A04' },
    { id: 'c10', name: 'Irons & Garment Care',   matIcon: 'iron',                  color: '#9333EA' },
    { id: 'c11', name: 'Fans & Ventilation',     matIcon: 'wind_power',            color: '#0EA5E9' },
    { id: 'c12', name: 'Water Heaters',          matIcon: 'water_heater',          color: '#DC2626' }
  ];

  const products = [

    // ─── TVs & DISPLAYS ──────────────────────────────────────────────────────
    {
      id: 'p1', name: 'Samsung 55" Crystal UHD 4K Smart TV', category: 'c1',
      price: 6500, oldPrice: 7800, stock: 12,
      image: 'https://images.unsplash.com/photo-1593359677879-a4bb92f4834c?w=600&q=80',
      images: ['https://images.unsplash.com/photo-1593359677879-a4bb92f4834c?w=600&q=80','https://images.unsplash.com/photo-1548686304-89d188a80029?w=600&q=80'],
      description: 'Samsung 55-inch Crystal UHD 4K Smart TV with PurColor technology, Motion Xcelerator, and built-in Alexa. Stream Netflix, YouTube and more directly.',
      badge: 'Hot', rating: 4.7, reviews: 203, isNew: false
    },
    {
      id: 'p2', name: 'LG 43" Full HD Smart TV', category: 'c1',
      price: 3200, oldPrice: 3900, stock: 8,
      image: 'https://images.unsplash.com/photo-1601944177325-f8867652837f?w=600&q=80',
      images: ['https://images.unsplash.com/photo-1601944177325-f8867652837f?w=600&q=80'],
      description: 'LG 43-inch Full HD Smart TV with webOS, ThinQ AI, and Magic Remote. Enjoy vivid colours and exceptional clarity for movies and gaming.',
      badge: 'Sale', rating: 4.5, reviews: 144, isNew: false
    },

    // ─── REFRIGERATORS ───────────────────────────────────────────────────────
    {
      id: 'p3', name: 'Samsung 300L Double Door Fridge', category: 'c2',
      price: 4800, oldPrice: 5500, stock: 7,
      image: 'https://images.unsplash.com/photo-1584568694244-14fbdf83bd30?w=600&q=80',
      images: ['https://images.unsplash.com/photo-1584568694244-14fbdf83bd30?w=600&q=80'],
      description: 'Samsung 300-litre double door refrigerator with Twin Cooling Plus, No-Frost technology, and digital inverter compressor. Energy-efficient and whisper-quiet.',
      badge: 'Hot', rating: 4.6, reviews: 178, isNew: false
    },

    // ─── WASHING MACHINES ────────────────────────────────────────────────────
    {
      id: 'p5', name: 'LG 7kg Front Load Washing Machine', category: 'c3',
      price: 3800, oldPrice: 4500, stock: 9,
      image: 'https://images.unsplash.com/photo-1558618666-fcd25c85cd64?w=600&q=80',
      images: ['https://images.unsplash.com/photo-1558618666-fcd25c85cd64?w=600&q=80'],
      description: 'LG 7kg front load washer with 6 Motion Direct Drive, Steam+ technology, and AI DD. Multiple wash programs for all fabric types.',
      badge: '', rating: 4.8, reviews: 231, isNew: false
    },

    // ─── AIR CONDITIONERS ────────────────────────────────────────────────────
    {
      id: 'p6', name: 'Samsung 1.5HP Split Air Conditioner', category: 'c4',
      price: 4200, oldPrice: 5000, stock: 5,
      image: 'https://images.unsplash.com/photo-1631545820632-9e5a1f23c8b2?w=600&q=80',
      images: ['https://images.unsplash.com/photo-1631545820632-9e5a1f23c8b2?w=600&q=80'],
      description: 'Samsung 1.5HP Wind-Free split air conditioner with Fast Cooling, Auto Clean, and Wi-Fi control. Keeps you cool silently and efficiently.',
      badge: 'Hot', rating: 4.6, reviews: 159, isNew: false
    },
    {
      id: 'p16', name: 'Hisense 1HP Split AC (Inverter)', category: 'c4',
      price: 3100, oldPrice: 3700, stock: 12,
      image: 'https://images.unsplash.com/photo-1631545820632-9e5a1f23c8b2?w=600&q=80',
      images: ['https://images.unsplash.com/photo-1631545820632-9e5a1f23c8b2?w=600&q=80'],
      description: 'Hisense 1HP Inverter Split AC with energy-saving technology, self-cleaning filter, Wi-Fi control and fast cooling. Quiet and efficient.',
      badge: 'New', rating: 4.4, reviews: 63, isNew: true
    },

    // ─── LAPTOPS & PCs ───────────────────────────────────────────────────────
    {
      id: 'p7', name: 'HP Pavilion Laptop 15.6" (i5 12th Gen)', category: 'c5',
      price: 7200, oldPrice: 8500, stock: 6,
      image: 'https://images.unsplash.com/photo-1496181133206-80ce9b88a853?w=600&q=80',
      images: ['https://images.unsplash.com/photo-1496181133206-80ce9b88a853?w=600&q=80','https://images.unsplash.com/photo-1525547719571-a2d4ac8945e2?w=600&q=80'],
      description: 'HP Pavilion laptop with Intel Core i5 12th Gen, 8GB RAM, 512GB SSD, 15.6-inch FHD display, Windows 11. Ideal for work and entertainment.',
      badge: 'Sale', rating: 4.7, reviews: 118, isNew: false
    },

    // ─── AUDIO & SOUND ───────────────────────────────────────────────────────
    {
      id: 'p10', name: 'JBL Xtreme 3 Portable Bluetooth Speaker', category: 'c6',
      price: 1400, oldPrice: 1750, stock: 11,
      image: 'https://images.unsplash.com/photo-1608043152269-423dbba4e7e1?w=600&q=80',
      images: ['https://images.unsplash.com/photo-1608043152269-423dbba4e7e1?w=600&q=80'],
      description: 'JBL Xtreme 3 with 15-hour playtime, IP67 waterproof, PartyBoost multi-speaker pairing, and built-in powerbank. Perfect for outdoor fun.',
      badge: 'Sale', rating: 4.6, reviews: 312, isNew: false
    },

    // ─── COOKING APPLIANCES ──────────────────────────────────────────────────
    {
      id: 'p12', name: 'Scanfrost 4-Burner Gas Cooker', category: 'c7',
      price: 1550, oldPrice: 1900, stock: 8,
      image: 'https://images.unsplash.com/photo-1556909114-f6e7ad7d3136?w=600&q=80',
      images: ['https://images.unsplash.com/photo-1556909114-f6e7ad7d3136?w=600&q=80'],
      description: 'Scanfrost 4-burner gas cooker with oven, auto-ignition, tempered glass lid, and stainless steel finish. Built for busy Ghanaian kitchens.',
      badge: 'Hot', rating: 4.5, reviews: 267, isNew: false
    },
    {
      id: 'p15', name: 'Philips Air Fryer XXL (6.2L)', category: 'c7',
      price: 1200, oldPrice: 1500, stock: 7,
      image: 'https://images.unsplash.com/photo-1648145887782-8cd7a6a5bee5?w=600&q=80',
      images: ['https://images.unsplash.com/photo-1648145887782-8cd7a6a5bee5?w=600&q=80'],
      description: 'Philips XXL Air Fryer cooks crispy meals with up to 90% less fat. 6.2-litre capacity feeds the whole family. Digital display with 7 pre-sets.',
      badge: 'Hot', rating: 4.8, reviews: 421, isNew: false
    },

    // ─── PHONES & TABLETS ────────────────────────────────────────────────────
    {
      id: 'p14', name: 'Tecno POVA 6 Pro (256GB)', category: 'c8',
      price: 1350, oldPrice: 1600, stock: 32,
      image: 'https://images.unsplash.com/photo-1511707171634-5f897ff02aa9?w=600&q=80',
      images: ['https://images.unsplash.com/photo-1511707171634-5f897ff02aa9?w=600&q=80'],
      description: 'Tecno POVA 6 Pro with 6.78-inch FHD+ 144Hz display, 70W fast charging, 6000mAh battery and 50MP AI camera. Big power, great value.',
      badge: 'Sale', rating: 4.3, reviews: 184, isNew: false
    },

    // ─── POWER & SOLAR ───────────────────────────────────────────────────────
    {
      id: 'p17', name: 'Luminous 2.5KVA Inverter + 200Ah Battery', category: 'c9',
      price: 5800, oldPrice: 6500, stock: 10,
      image: 'https://images.unsplash.com/photo-1620714223084-8fcacc2107db?w=600&q=80',
      images: ['https://images.unsplash.com/photo-1620714223084-8fcacc2107db?w=600&q=80'],
      description: 'Luminous 2.5KVA pure sine wave inverter bundled with a 200Ah tubular battery. Powers TVs, fans, and lights for hours during outages. Ideal for Ghanaian homes.',
      badge: 'Hot', rating: 4.7, reviews: 134, isNew: false
    },
    {
      id: 'p18', name: '400W Solar Panel Kit (Off-Grid)', category: 'c9',
      price: 3400, oldPrice: 4000, stock: 6,
      image: 'https://images.unsplash.com/photo-1509391366360-2e959784a276?w=600&q=80',
      images: ['https://images.unsplash.com/photo-1509391366360-2e959784a276?w=600&q=80'],
      description: 'Complete 400W monocrystalline solar panel kit with charge controller, inverter, and mounting hardware. Save on electricity bills and stay powered during dumsor.',
      badge: 'New', rating: 4.5, reviews: 58, isNew: true
    },
    {
      id: 'p19', name: 'Ecoflow RIVER 2 Portable Power Station', category: 'c9',
      price: 2200, oldPrice: 2700, stock: 14,
      image: 'https://images.unsplash.com/photo-1558618047-3b3a8de2e688?w=600&q=80',
      images: ['https://images.unsplash.com/photo-1558618047-3b3a8de2e688?w=600&q=80'],
      description: 'EcoFlow RIVER 2 with 256Wh capacity, 300W AC output, and full charge in 1 hour. Charge up to 6 devices at once — perfect for load-shedding.',
      badge: 'Sale', rating: 4.6, reviews: 92, isNew: false
    },

    // ─── IRONS & GARMENT CARE ────────────────────────────────────────────────
    {
      id: 'p20', name: 'Philips PerfectCare Steam Iron (2600W)', category: 'c10',
      price: 480, oldPrice: 620, stock: 25,
      image: 'https://images.unsplash.com/photo-1558618666-fcd25c85cd64?w=600&q=80',
      images: ['https://images.unsplash.com/photo-1558618666-fcd25c85cd64?w=600&q=80'],
      description: 'Philips 2600W steam iron with OptimalTEMP technology — no scorching, no temperature adjustments. 40g/min steam output for perfectly pressed clothes every time.',
      badge: '', rating: 4.5, reviews: 211, isNew: false
    },
    {
      id: 'p21', name: 'Sokany Garment Steamer (2000W)', category: 'c10',
      price: 320, oldPrice: 420, stock: 18,
      image: 'https://images.unsplash.com/photo-1558618666-fcd25c85cd64?w=600&q=80',
      images: ['https://images.unsplash.com/photo-1558618666-fcd25c85cd64?w=600&q=80'],
      description: 'Sokany 2000W vertical garment steamer with 1.5L water tank, ready in 35 seconds, and flexible hose. Removes wrinkles from suits, dresses, and curtains with ease.',
      badge: 'New', rating: 4.3, reviews: 76, isNew: true
    },

    // ─── FANS & VENTILATION ──────────────────────────────────────────────────
    {
      id: 'p22', name: 'Binatone 18" Standing Fan', category: 'c11',
      price: 350, oldPrice: 430, stock: 40,
      image: 'https://images.unsplash.com/photo-1585771724684-38269d6639fd?w=600&q=80',
      images: ['https://images.unsplash.com/photo-1585771724684-38269d6639fd?w=600&q=80'],
      description: 'Binatone 18-inch standing fan with 3 speed settings, oscillation, adjustable height, and quiet motor. A trusted cooling companion for Ghanaian homes.',
      badge: '', rating: 4.2, reviews: 318, isNew: false
    },
    {
      id: 'p23', name: 'Europace Tower Fan with Remote (40")', category: 'c11',
      price: 680, oldPrice: 850, stock: 15,
      image: 'https://images.unsplash.com/photo-1585771724684-38269d6639fd?w=600&q=80',
      images: ['https://images.unsplash.com/photo-1585771724684-38269d6639fd?w=600&q=80'],
      description: 'Europace 40-inch tower fan with remote control, 12-hour timer, sleep mode, and 3 wind modes. Space-saving design with powerful, whisper-quiet airflow.',
      badge: 'Sale', rating: 4.4, reviews: 87, isNew: false
    },

    // ─── WATER HEATERS ───────────────────────────────────────────────────────
    {
      id: 'p24', name: 'Ariston 30L Electric Storage Water Heater', category: 'c12',
      price: 1100, oldPrice: 1380, stock: 9,
      image: 'https://images.unsplash.com/photo-1585771724684-38269d6639fd?w=600&q=80',
      images: ['https://images.unsplash.com/photo-1585771724684-38269d6639fd?w=600&q=80'],
      description: 'Ariston 30-litre electric water heater with multi-layered insulation, anti-corrosion enamel tank, and adjustable thermostat. Reliable hot water for your bathroom daily.',
      badge: '', rating: 4.5, reviews: 103, isNew: false
    },
    {
      id: 'p25', name: 'Elba Instant Shower Water Heater (3500W)', category: 'c12',
      price: 480, oldPrice: 600, stock: 20,
      image: 'https://images.unsplash.com/photo-1585771724684-38269d6639fd?w=600&q=80',
      images: ['https://images.unsplash.com/photo-1585771724684-38269d6639fd?w=600&q=80'],
      description: 'Elba 3500W instant electric shower heater with safety thermal cut-out, ABS housing, and adjustable temperature. Quick installation and instant hot water on demand.',
      badge: 'New', rating: 4.1, reviews: 49, isNew: true
    },

    // ─── MORE ELECTRICAL APPLIANCES ──────────────────────────────────────────
    {
      id: 'p26', name: 'Bosch 1800W Vacuum Cleaner', category: 'c7',
      price: 760, oldPrice: 950, stock: 13,
      image: 'https://images.unsplash.com/photo-1558317374-067fb5f30001?w=600&q=80',
      images: ['https://images.unsplash.com/photo-1558317374-067fb5f30001?w=600&q=80'],
      description: 'Bosch 1800W bagged vacuum cleaner with HEPA filtration, powerful suction, and multiple attachments. Keeps your home spotless with minimal effort.',
      badge: '', rating: 4.6, reviews: 142, isNew: false
    },
    {
      id: 'p27', name: 'Kenwood Hand Mixer (450W)', category: 'c7',
      price: 280, oldPrice: 360, stock: 22,
      image: 'https://images.unsplash.com/photo-1590301157890-4810ed352733?w=600&q=80',
      images: ['https://images.unsplash.com/photo-1590301157890-4810ed352733?w=600&q=80'],
      description: 'Kenwood 450W hand mixer with 5 speed settings, turbo boost, and 3 attachments — beaters, dough hooks, and whisk. Perfect for baking and blending.',
      badge: 'Sale', rating: 4.4, reviews: 198, isNew: false
    },
    {
      id: 'p28', name: 'Blueflame 2000W Electric Kettle (1.7L)', category: 'c7',
      price: 180, oldPrice: 240, stock: 35,
      image: 'https://images.unsplash.com/photo-1570958861-4e842e4a3863?w=600&q=80',
      images: ['https://images.unsplash.com/photo-1570958861-4e842e4a3863?w=600&q=80'],
      description: 'Blueflame 1.7-litre cordless electric kettle with 2000W rapid boil, 360° base, auto shut-off, and boil-dry protection. Great for tea, coffee, and instant meals.',
      badge: '', rating: 4.3, reviews: 271, isNew: false
    },
    {
      id: 'p29', name: 'Syinix 2-Slice Toaster (800W)', category: 'c7',
      price: 140, oldPrice: 190, stock: 28,
      image: 'https://images.unsplash.com/photo-1585771724684-38269d6639fd?w=600&q=80',
      images: ['https://images.unsplash.com/photo-1585771724684-38269d6639fd?w=600&q=80'],
      description: 'Syinix 800W 2-slice toaster with 7 browning levels, cancel/reheat/defrost functions, and removable crumb tray. Compact and easy to clean.',
      badge: 'New', rating: 4.1, reviews: 83, isNew: true
    },
    {
      id: 'p30', name: 'LG 600W Blender with Mill (2-in-1)', category: 'c7',
      price: 320, oldPrice: 410, stock: 17,
      image: 'https://images.unsplash.com/photo-1570222094114-d054a817e56b?w=600&q=80',
      images: ['https://images.unsplash.com/photo-1570222094114-d054a817e56b?w=600&q=80'],
      description: 'LG 600W 2-in-1 blender with stainless steel blades, spice mill, and 1.5L BPA-free jar. Blend smoothies, crush ice, and grind pepper with ease.',
      badge: 'Hot', rating: 4.5, reviews: 309, isNew: false
    }
  ];

  StorageService.saveCategories(categories);
  StorageService.saveProducts(products);
  StorageService.saveSettings({
    storeName: 'VoltGH Store',
    whatsapp: '0248062352',
    momoNumber: '0248062352',
    momoNetwork: 'MTN Mobile Money',
    currency: 'GHS',
    deliveryFee: 50,
    freeDeliveryThreshold: 1000,
    expressPayEnabled: true
  });
}

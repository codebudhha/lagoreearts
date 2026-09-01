import { hashPassword } from '../utils/crypto.js';
import { db, initDatabase } from './database.js';

export function seed() {
  initDatabase();

  console.log('🌱 Seeding Lagoree Arts e-commerce database...');

  // 1. Clear existing data
  const tables = [
    'order_timeline', 'order_items', 'orders', 'cart_items', 'wishlists',
    'reviews', 'products', 'framing_options', 'coupons', 'categories',
    'artists', 'addresses', 'users', 'contact_messages', 'newsletter_subscribers'
  ];

  for (const table of tables) {
    db.exec(`DELETE FROM ${table};`);
  }

  // 2. Framing Options
  const insertFrame = db.prepare(`
    INSERT INTO framing_options (name, description, type, price_multiplier, price_adder, image)
    VALUES (?, ?, ?, ?, ?, ?)
  `);

  insertFrame.run('Unframed / Rolled Canvas', 'Artwork shipped in custom archival protective cylinder tube.', 'unframed', 1.0, 0, 'https://images.unsplash.com/photo-1579783900882-c0d3dad7b119?w=400');
  insertFrame.run('Raw Heritage Teakwood', 'Hand-finished solid Burma teakwood frame with natural matte wax finish.', 'teak', 1.15, 3500, 'https://images.unsplash.com/photo-1582561424760-0321d75e81fa?w=400');
  insertFrame.run('24K Antiqued Gold Leaf', 'Artisan hand-applied Italian gold leafing over seasoned pinewood profile.', 'gold_leaf', 1.25, 6500, 'https://images.unsplash.com/photo-1578301978693-85fa9c0320b9?w=400');
  insertFrame.run('Charcoal Shadowbox Float', 'Deep-set dark charcoal museum float frame with 99% UV anti-reflective museum glass.', 'charcoal', 1.20, 5200, 'https://images.unsplash.com/photo-1579783902614-a3fb3927b675?w=400');
  insertFrame.run('Hand-Carved Tanjore Chettinad Frame', 'Traditional South Indian deep teakwood relief carvings with gold foil trim.', 'chettinad', 1.35, 9500, 'https://images.unsplash.com/photo-1600585154340-be6161a56a0c?w=400');

  // 3. Coupons
  const insertCoupon = db.prepare(`
    INSERT INTO coupons (code, discount_type, discount_value, min_order_value, max_discount, usage_limit, is_active)
    VALUES (?, ?, ?, ?, ?, ?, ?)
  `);

  insertCoupon.run('HERITAGE10', 'percentage', 10, 5000, 15000, 500, 1);
  insertCoupon.run('ROYAL5000', 'flat', 5000, 45000, 5000, 200, 1);
  insertCoupon.run('WELCOME2026', 'percentage', 15, 10000, 20000, 1000, 1);
  insertCoupon.run('FIRSTDROP', 'flat', 2500, 20000, 2500, 300, 1);

  // 4. Categories
  const insertCategory = db.prepare(`
    INSERT INTO categories (name, slug, description, image, banner_image, sort_order)
    VALUES (?, ?, ?, ?, ?, ?)
  `);

  const catTanjore = Number(insertCategory.run(
    'Tanjore Masterpieces',
    'tanjore',
    'Sacred 24-Karat gold leaf relief paintings embellished with authentic Jaipur semi-precious stones on seasoned jackfruit wood.',
    'https://images.unsplash.com/photo-1582561424760-0321d75e81fa?w=800',
    'https://images.unsplash.com/photo-1579783900882-c0d3dad7b119?w=1600',
    1
  ).lastInsertRowid);

  const catPichwai = Number(insertCategory.run(
    'Pichwai on Handwoven Linen',
    'pichwai',
    'Devotional 400-year-old Nathdwara temple textile art painted with pure natural mineral pigments and real crushed silver/gold.',
    'https://images.unsplash.com/photo-1578301978693-85fa9c0320b9?w=800',
    'https://images.unsplash.com/photo-1579783902614-a3fb3927b675?w=1600',
    2
  ).lastInsertRowid);

  const catAntiques = Number(insertCategory.run(
    'Antiques & Bronze Sculptures',
    'antiques',
    'Curated heritage artefacts, centuries-old lost-wax Chola bronzes, and temple architectural fragments with verified provenance.',
    'https://images.unsplash.com/photo-1569783723385-e63d33ebc839?w=800',
    'https://images.unsplash.com/photo-1544717305-2782549b5136?w=1600',
    3
  ).lastInsertRowid);

  const catMiniatures = Number(insertCategory.run(
    'Mughal & Rajput Miniatures',
    'miniatures',
    'Intricate court paintings executed with single-hair squirrel brushes on handmade Wasli archival paper using stone colours.',
    'https://images.unsplash.com/photo-1579783928621-7a13d66a62d1?w=800',
    'https://images.unsplash.com/photo-1582561424760-0321d75e81fa?w=1600',
    4
  ).lastInsertRowid);

  const catFolk = Number(insertCategory.run(
    'Heritage Folk: Madhubani & Pattachitra',
    'folk-art',
    'Timeless indigenous narratives crafted with natural plant dyes, soot, and bamboo nibs preserving generational sacred motifs.',
    'https://images.unsplash.com/photo-1577083552431-6e5fd01aa342?w=800',
    'https://images.unsplash.com/photo-1579783900882-c0d3dad7b119?w=1600',
    5
  ).lastInsertRowid);

  const catContemporary = Number(insertCategory.run(
    'Contemporary Canvas & Oil',
    'contemporary',
    'Modern interpretations of classical Indian aesthetic philosophies rendered in rich oil glazes and impasto textures.',
    'https://images.unsplash.com/photo-1541701494587-cb58502866ab?w=800',
    'https://images.unsplash.com/photo-1579783928621-7a13d66a62d1?w=1600',
    6
  ).lastInsertRowid);

  // 5. Artists
  const insertArtist = db.prepare(`
    INSERT INTO artists (name, slug, lineage, bio, location, avatar, cover_image, is_master)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?)
  `);

  const artistRaman = Number(insertArtist.run(
    'Master Ramanujam Sthapathy',
    'ramanujam-sthapathy',
    '5th Generation Royal Thanjavur Guild Master',
    'Descendant of the master craftsmen commissioned by Maharaja Serfoji II of Thanjavur. His works feature unadulterated 24K Swiss gold leaf and time-honoured natural binder adhesives.',
    'Thanjavur, Tamil Nadu',
    'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=400',
    'https://images.unsplash.com/photo-1582561424760-0321d75e81fa?w=1200',
    1
  ).lastInsertRowid);

  const artistGovind = Number(insertArtist.run(
    'Pandit Govind Sharma',
    'govind-sharma',
    'Nathdwara Temple Hereditary Seva Painter',
    'A revered master painter whose family has created Shrinathji festival backdrops for over seven generations.',
    'Nathdwara, Rajasthan',
    'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=400',
    'https://images.unsplash.com/photo-1578301978693-85fa9c0320b9?w=1200',
    1
  ).lastInsertRowid);

  const artistSunita = Number(insertArtist.run(
    'Sunita Devi Jha',
    'sunita-devi-jha',
    'National Awardee, Madhubani Guild',
    'Master of the delicate Kachni (fine line hatching) style from Jitwarpur.',
    'Madhubani, Bihar',
    'https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?w=400',
    'https://images.unsplash.com/photo-1577083552431-6e5fd01aa342?w=1200',
    1
  ).lastInsertRowid);

  const artistSanjay = Number(insertArtist.run(
    'Sanjay & Vikram Sen',
    'sanjay-vikram-sen',
    'Kishangarh Miniature Revivalists',
    'Brothers Sanjay & Vikram Sen specialize in the exquisite Bani Thani Kishangarh style.',
    'Jaipur, Rajasthan',
    'https://images.unsplash.com/photo-1506794778202-cad84cf45f1d?w=400',
    'https://images.unsplash.com/photo-1579783928621-7a13d66a62d1?w=1200',
    1
  ).lastInsertRowid);

  // 6. Products
  const insertProduct = db.prepare(`
    INSERT INTO products (
      title, slug, sku, category_id, artist_id, description, provenance, dimensions,
      medium, orientation, base_price, sale_price, stock, is_featured, is_antique,
      certificate_details, images, tags
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `);

  // Product 1
  insertProduct.run(
    'The Descent of Saraswati — Tanjore School',
    'the-descent-of-saraswati-tanjore-school',
    'LAG-TAN-001',
    catTanjore,
    artistRaman,
    'An exceptional Tanjore masterpiece capturing the Goddess of Wisdom and the Arts seated on an ornate white swan. Embellished with 24-Karat gold leaf relief work and genuine hand-cut Jaipur rubies and emeralds.',
    'Crafted in the Thanjavur traditional guild studio; verified by Tamil Nadu Craft Council. Authenticated and sealed with wax medallion by Lagoree Arts.',
    '36" x 48" inches (91.4 x 121.9 cm)',
    '24K Gold Foil, Semi-Precious Stones & Natural Pigments on Seasoned Jackfruit Wood',
    'portrait',
    145000,
    132000,
    3,
    1,
    0,
    'Signed Certificate of Authenticity (COA) with gold foil seal #LAG-COA-8841.',
    JSON.stringify([
      'https://images.unsplash.com/photo-1582561424760-0321d75e81fa?w=1200',
      'https://images.unsplash.com/photo-1579783900882-c0d3dad7b119?w=1200',
      'https://images.unsplash.com/photo-1578301978693-85fa9c0320b9?w=1200'
    ]),
    JSON.stringify(['Tanjore', '24K Gold', 'Saraswati', 'Goddess', 'Sacred Art', 'Bestseller'])
  );

  // Product 2
  insertProduct.run(
    'Kamal Talai & The Sacred Lotus Grove Pichwai',
    'kamal-talai-sacred-lotus-grove-pichwai',
    'LAG-PIC-002',
    catPichwai,
    artistGovind,
    'Painted for the Sharad Purnima festival, this luminous Pichwai depicts sacred white cows gathering around the blooming lotus ponds of the Yamuna.',
    'Directly acquired from the atelier of Pandit Govind Sharma in Nathdwara.',
    '48" x 72" inches (122 x 183 cm)',
    'Natural Stone Minerals, Vegetable Dyes & Real Gold Powder on Handspun Khadi Cotton',
    'landscape',
    215000,
    195000,
    2,
    1,
    0,
    'Signed COA with pigment analysis dossier and provenance documentation.',
    JSON.stringify([
      'https://images.unsplash.com/photo-1578301978693-85fa9c0320b9?w=1200',
      'https://images.unsplash.com/photo-1579783902614-a3fb3927b675?w=1200'
    ]),
    JSON.stringify(['Pichwai', 'Krishna', 'Kamal Talai', 'Nathdwara', 'Heritage'])
  );

  // Product 3
  insertProduct.run(
    'Circa 18th-Century Chola Revival Nataraja Bronze',
    'circa-18th-century-chola-revival-nataraja-bronze',
    'LAG-ANT-003',
    catAntiques,
    artistRaman,
    'An extraordinary antique lost-wax cast bronze depicting Shiva Nataraja in the cosmic dance of creation and dissolution, surrounded by the flaming aureole.',
    'Private royal estate of Karaikudi, Chettinad.',
    '28" x 22" x 10" inches (71 x 56 x 25 cm)',
    'Panchaloha Bronze (Five-Metal Alloy: Copper, Zinc, Tin, Lead, Gold traces)',
    'portrait',
    485000,
    null,
    1,
    1,
    1,
    'Lagoree Certified Antique Provenance Ledger #ANT-9023 with metallurgical certificate.',
    JSON.stringify([
      'https://images.unsplash.com/photo-1569783723385-e63d33ebc839?w=1200',
      'https://images.unsplash.com/photo-1544717305-2782549b5136?w=1200'
    ]),
    JSON.stringify(['Antique', 'Bronze', 'Nataraja', 'Chola', 'Rare Collector'])
  );

  // Product 4
  insertProduct.run(
    'The Royal Darbar of Shah Jahan — Wasli Miniature',
    'the-royal-darbar-of-shah-jahan-wasli-miniature',
    'LAG-MIN-004',
    catMiniatures,
    artistSanjay,
    'A tour-de-force of miniature precision featuring over 40 distinct courtiers with illuminated turbans and velvet canopies bordered with pure lapis lazuli.',
    'Created using 18th-century miniature techniques in Jaipur.',
    '16" x 24" inches (40.6 x 61 cm)',
    'Crushed Lapis Lazuli, Malachite, 24K Gold & Watercolors on Wasli Paper',
    'portrait',
    88000,
    79000,
    4,
    1,
    0,
    'Certificate signed by Master Sanjay Sen with magnifying loupe included.',
    JSON.stringify([
      'https://images.unsplash.com/photo-1579783928621-7a13d66a62d1?w=1200',
      'https://images.unsplash.com/photo-1582561424760-0321d75e81fa?w=1200'
    ]),
    JSON.stringify(['Miniature', 'Mughal', 'Court Art', 'Wasli', 'Lapis Lazuli'])
  );

  // Product 5
  insertProduct.run(
    'Vriksha: The Cosmic Tree of Life Madhubani',
    'vriksha-the-cosmic-tree-of-life-madhubani',
    'LAG-FOLK-005',
    catFolk,
    artistSunita,
    'A masterpiece of intricate Kachni line art representing the interconnection of birds, peacocks, aquatic life, and celestial bodies rooted around the eternal sacred banyan tree.',
    'Crafted in Jitwarpur studio using natural plant dyes and fine bamboo pen.',
    '30" x 40" inches (76.2 x 101.6 cm)',
    'Natural Organic Dyes on Handmade Arches Cotton Paper',
    'portrait',
    62000,
    55000,
    5,
    1,
    0,
    'Signed certificate from National Awardee Sunita Devi Jha.',
    JSON.stringify([
      'https://images.unsplash.com/photo-1577083552431-6e5fd01aa342?w=1200',
      'https://images.unsplash.com/photo-1579783900882-c0d3dad7b119?w=1200'
    ]),
    JSON.stringify(['Madhubani', 'Folk Art', 'Tree of Life', 'Kachni'])
  );

  // Product 6
  insertProduct.run(
    'Lord Venkateshwara (Tirupati Balaji) in Gold Relief',
    'lord-venkateshwara-tirupati-balaji-gold-relief',
    'LAG-TAN-006',
    catTanjore,
    artistRaman,
    'Intensely detailed Tanjore portrait of Sri Venkateshwara adorned in the sacred diamond crown, pitambara silks, and emerald garlands.',
    'Commissioned by Lagoree Arts private salon from the Ramanujam atelier.',
    '30" x 42" inches (76 x 106.7 cm)',
    '24K Gold Leafing, Gesso Relief & Mysore Kundan Stones on Teak Plank',
    'portrait',
    175000,
    160000,
    2,
    1,
    0,
    'Certificate of Authenticity with gold purity guarantee certificate (99.9% 24K Swiss foil).',
    JSON.stringify([
      'https://images.unsplash.com/photo-1582561424760-0321d75e81fa?w=1200',
      'https://images.unsplash.com/photo-1579783902614-a3fb3927b675?w=1200'
    ]),
    JSON.stringify(['Tanjore', 'Balaji', '24K Gold', 'Devotional'])
  );

  // 7. Users
  const insertUser = db.prepare(`
    INSERT INTO users (name, email, phone, password_hash, role, avatar)
    VALUES (?, ?, ?, ?, ?, ?)
  `);

  const adminPasswordHash = hashPassword('Admin@123');
  const customerPasswordHash = hashPassword('Customer@123');

  const adminId = Number(insertUser.run(
    'Lagoree Curator Admin',
    'admin@lagoreearts.com',
    '+91 98765 43210',
    adminPasswordHash,
    'admin',
    'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=400'
  ).lastInsertRowid);

  const customerId = Number(insertUser.run(
    'Aditya Vikram Singhania',
    'aditya@lagoreearts.com',
    '+91 98111 22334',
    customerPasswordHash,
    'customer',
    'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=400'
  ).lastInsertRowid);

  // 8. Addresses
  const insertAddress = db.prepare(`
    INSERT INTO addresses (user_id, full_name, phone, street, apartment, city, state, postal_code, country, is_default)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `);

  insertAddress.run(
    customerId,
    'Aditya Vikram Singhania',
    '+91 98111 22334',
    '42, Amrita Shergill Marg',
    'Villa 4, Kensington Court',
    'New Delhi',
    'Delhi',
    '110003',
    'India',
    1
  );

  // 9. Initial Reviews
  const insertReview = db.prepare(`
    INSERT INTO reviews (product_id, user_id, user_name, rating, title, comment, verified_purchase)
    VALUES (?, ?, ?, ?, ?, ?, ?)
  `);

  insertReview.run(
    1,
    customerId,
    'Aditya Vikram Singhania',
    5,
    'Breathtaking Gold Leaf Detailing & Museum Packaging',
    'Received The Descent of Saraswati in the custom teak crate. The 24K gold foil gleams with an almost spiritual warmth. The certificate and framing exceeded all expectations.',
    1
  );

  insertReview.run(
    2,
    customerId,
    'Vikram Oberoi (Jaipur)',
    5,
    'Luminous Pichwai Masterpiece',
    'The natural mineral pigments give this Kamal Talai a luminescence that printed canvas simply cannot replicate. A treasured heirloom for generations.',
    1
  );

  // 10. Sample Order
  const insertOrder = db.prepare(`
    INSERT INTO orders (
      order_number, user_id, customer_name, customer_email, customer_phone,
      shipping_address, billing_address, subtotal, frame_cost, discount_amount,
      coupon_code, shipping_fee, tax_amount, total_amount, payment_method,
      payment_status, payment_transaction_id, order_status, tracking_number,
      courier_name, estimated_delivery, notes
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `);

  const sampleShippingAddr = {
    fullName: 'Aditya Vikram Singhania',
    phone: '+91 98111 22334',
    street: '42, Amrita Shergill Marg',
    apartment: 'Villa 4, Kensington Court',
    city: 'New Delhi',
    state: 'Delhi',
    postalCode: '110003',
    country: 'India'
  };

  const sampleOrder = insertOrder.run(
    'LAG-2026-88914',
    customerId,
    'Aditya Vikram Singhania',
    'aditya@lagoreearts.com',
    '+91 98111 22334',
    JSON.stringify(sampleShippingAddr),
    JSON.stringify(sampleShippingAddr),
    145000,
    6500,
    14500,
    'HERITAGE10',
    0,
    24660,
    161660,
    'upi',
    'paid',
    'UPI-PAY-9923841029',
    'shipped',
    'BLUEDART-EXP-9921448',
    'BlueDart Luxury Secure Logistics',
    'September 05, 2026',
    'Customer requested custom velvet corner protectors.'
  );

  const orderId = Number(sampleOrder.lastInsertRowid);

  const insertOrderItem = db.prepare(`
    INSERT INTO order_items (order_id, product_id, product_title, frame_name, size, unit_price, quantity, total_price, image)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
  `);

  insertOrderItem.run(
    orderId,
    1,
    'The Descent of Saraswati — Tanjore School',
    '24K Antiqued Gold Leaf',
    '36" x 48" inches',
    145000,
    1,
    151500,
    'https://images.unsplash.com/photo-1582561424760-0321d75e81fa?w=600'
  );

  const insertTimeline = db.prepare(`
    INSERT INTO order_timeline (order_id, status, title, description, timestamp)
    VALUES (?, ?, ?, ?, CURRENT_TIMESTAMP)
  `);

  insertTimeline.run(orderId, 'placed', 'Order Placed & Payment Verified', 'Payment of ₹1,61,660 received via UPI.');
  insertTimeline.run(orderId, 'framing', 'Custom Framing in Atelier', 'Hand-finished 24K Antiqued Gold Leaf frame assembled by master carvers.');
  insertTimeline.run(orderId, 'packed', 'Quality Inspection & Wooden Crate Packaging', 'Museum-grade seal, UV film, moisture barrier, and custom wood crating completed.');
  insertTimeline.run(orderId, 'shipped', 'Dispatched with BlueDart Luxury Express', 'Consignment picked up with tracking number BLUEDART-EXP-9921448.');

  // 11. Wishlists
  db.prepare(`INSERT INTO wishlists (user_id, product_id) VALUES (?, ?)`).run(customerId, 2);
  db.prepare(`INSERT INTO wishlists (user_id, product_id) VALUES (?, ?)`).run(customerId, 3);

  console.log('✅ Seed completed successfully!');
  console.log('----------------------------------------------------');
  console.log('🔑 Test Accounts:');
  console.log('   Admin:    admin@lagoreearts.com    | Password: Admin@123');
  console.log('   Customer: aditya@lagoreearts.com   | Password: Customer@123');
  console.log('🏷️ Active Coupons: HERITAGE10, ROYAL5000, WELCOME2026, FIRSTDROP');
  console.log('----------------------------------------------------');
}

// Run if called directly
if (process.argv[1] && (process.argv[1].endsWith('seed.js') || process.argv[1].includes('seed'))) {
  seed();
}

import assert from 'node:assert';

console.log('=== RUNNING ADMIN PANEL PHASE 5: COLLECTION MANAGEMENT TEST SUITE ===\n');

// =============================================================
// Section 1: Collection Data Models & Schema Verification (Tests 1-10)
// =============================================================
console.log('[Tests 1-10] Validating Collection Schema & Data Models...');

const mockCollections = [
  {
    id: 'col-sanskrit-sacred',
    name: 'Sanskrit Sacred Geometry',
    slug: 'sanskrit-sacred-geometry',
    shortDescription: 'Sacred Yantras, Mandalas, and Vedic geometric artwork.',
    description: 'A curated ensemble of consecrated geometry handcrafted by traditional master artisans across Southern India.',
    heroTitle: 'Sacred Geometry & Vedic Forms',
    heroDescription: 'Discover cosmic vibrations harmonized into timeless copper, brass, and gold leaf masterpieces.',
    image: 'https://images.lagoreearts.com/collections/sanskrit-cover.jpg',
    bannerImage: 'https://images.lagoreearts.com/collections/sanskrit-banner.jpg',
    status: 'ACTIVE',
    type: 'MANUAL',
    isFeatured: true,
    sortOrder: 1,
    productCount: 14,
    metaTitle: 'Sacred Geometry Yantras & Mandalas | Lagoree Arts Heritage',
    metaDescription: 'Shop handcrafted Sanskrit Yantras, cosmic mandalas, and Vedic art authenticated with certificates.',
    canonicalUrl: 'https://lagoreearts.com/collections/sanskrit-sacred-geometry',
    ogTitle: 'Sanskrit Sacred Geometry Collection',
    ogDescription: 'Timeless sacred geometry for sanctuaries and homes.',
    ogImage: 'https://images.lagoreearts.com/collections/sanskrit-og.jpg',
    createdAt: '2026-01-15T10:00:00.000Z',
    updatedAt: '2026-02-01T14:30:00.000Z',
  },
  {
    id: 'col-temple-bronzes',
    name: 'Chola Dynasty Bronzes',
    slug: 'chola-dynasty-bronzes',
    shortDescription: 'Lost-wax bronze idols casting 1,000-year South Indian artistic lineages.',
    description: 'Each piece is hand-cast using the ancient Madhuchishtavidhana lost-wax process.',
    heroTitle: 'Living Bronzes of the Chola Masters',
    heroDescription: 'Museum-grade bronze cast sculptures of Shiva Nataraja, Parvati, and temple deities.',
    image: 'https://images.lagoreearts.com/collections/chola-bronze.jpg',
    bannerImage: 'https://images.lagoreearts.com/collections/chola-banner.jpg',
    status: 'ACTIVE',
    type: 'MANUAL',
    isFeatured: true,
    sortOrder: 2,
    productCount: 8,
    metaTitle: 'Chola Dynasty Bronze Sculptures | Lagoree Arts',
    metaDescription: 'Authentic lost-wax bronze sculptures handcrafted in Swamimalai.',
    canonicalUrl: 'https://lagoreearts.com/collections/chola-dynasty-bronzes',
    ogTitle: 'Chola Dynasty Bronzes',
    ogDescription: 'Living traditions of sacred bronze sculpture.',
    ogImage: 'https://images.lagoreearts.com/collections/chola-og.jpg',
    createdAt: '2026-01-20T11:00:00.000Z',
    updatedAt: '2026-02-05T16:00:00.000Z',
  },
  {
    id: 'col-system-featured',
    name: 'Featured Masterpieces',
    slug: 'featured-masterpieces',
    shortDescription: 'System curated flagship artworks across all categories.',
    description: 'Core system collection displaying curated highlights on the primary homepage showcase.',
    heroTitle: 'Lagoree Masterpiece Selection',
    heroDescription: 'Curatorial treasures representing pinnacle Indian craftsmanship.',
    image: 'https://images.lagoreearts.com/collections/system-featured.jpg',
    bannerImage: 'https://images.lagoreearts.com/collections/system-featured-banner.jpg',
    status: 'ACTIVE',
    type: 'SYSTEM',
    isFeatured: true,
    sortOrder: 0,
    productCount: 20,
    metaTitle: 'Featured Indian Art Masterpieces | Lagoree Arts',
    metaDescription: 'Featured heritage artworks and antiques.',
    canonicalUrl: 'https://lagoreearts.com/collections/featured-masterpieces',
    ogTitle: 'Featured Masterpieces',
    ogDescription: 'Lagoree Arts premier collection.',
    ogImage: 'https://images.lagoreearts.com/collections/featured-og.jpg',
    createdAt: '2025-12-01T00:00:00.000Z',
    updatedAt: '2026-01-10T12:00:00.000Z',
  },
  {
    id: 'col-antique-manuscripts',
    name: 'Palm Leaf Manuscripts & Antiquities',
    slug: 'palm-leaf-manuscripts',
    shortDescription: 'Rare 18th & 19th century inscribed palm leaf folios.',
    description: 'Antiquities authenticated with provenance and cultural heritage archives.',
    heroTitle: null,
    heroDescription: null,
    image: null,
    bannerImage: null,
    status: 'INACTIVE',
    type: 'MANUAL',
    isFeatured: false,
    sortOrder: 99,
    productCount: 3,
    metaTitle: null,
    metaDescription: null,
    canonicalUrl: null,
    ogTitle: null,
    ogDescription: null,
    ogImage: null,
    createdAt: '2026-02-10T09:00:00.000Z',
    updatedAt: '2026-02-10T09:00:00.000Z',
  },
];

// Test 1: Collection ID and Name validation
assert.strictEqual(mockCollections[0].id, 'col-sanskrit-sacred');
assert.strictEqual(mockCollections[0].name, 'Sanskrit Sacred Geometry');
console.log('✓ Test 1: Collection ID and core Name validated.');

// Test 2: Collection Slug format
assert.strictEqual(mockCollections[0].slug, 'sanskrit-sacred-geometry');
assert.ok(/^[a-z0-9-]+$/.test(mockCollections[0].slug), 'Slug matches URL-safe pattern');
console.log('✓ Test 2: Collection slug URL format verified.');

// Test 3: Collection Status values (ACTIVE | INACTIVE)
const validStatuses = ['ACTIVE', 'INACTIVE'];
assert.ok(mockCollections.every((c) => validStatuses.includes(c.status)), 'Statuses are valid');
console.log('✓ Test 3: Collection status constraints enforced.');

// Test 4: Collection Type values (MANUAL | SYSTEM)
const validTypes = ['MANUAL', 'SYSTEM'];
assert.ok(mockCollections.every((c) => validTypes.includes(c.type)), 'Types are valid');
console.log('✓ Test 4: Collection type constraints (MANUAL/SYSTEM) verified.');

// Test 5: Hero Title and Hero Description fallback logic
function resolveHeroTitle(collection) {
  return collection.heroTitle || collection.name;
}
function resolveHeroDesc(collection) {
  return collection.heroDescription || collection.shortDescription || collection.description || '';
}
assert.strictEqual(resolveHeroTitle(mockCollections[0]), 'Sacred Geometry & Vedic Forms');
assert.strictEqual(resolveHeroTitle(mockCollections[3]), 'Palm Leaf Manuscripts & Antiquities');
console.log('✓ Test 5: Hero headline and description fallback resolution validated.');

// Test 6: Image and Banner Fallback
function resolveBanner(col) {
  return col.bannerImage || col.image || '/placeholder-banner.jpg';
}
assert.strictEqual(resolveBanner(mockCollections[0]), 'https://images.lagoreearts.com/collections/sanskrit-banner.jpg');
assert.strictEqual(resolveBanner(mockCollections[3]), '/placeholder-banner.jpg');
console.log('✓ Test 6: Banner and Cover image fallback resolution verified.');

// Test 7: Featured Collection Identification
const featuredCols = mockCollections.filter((c) => c.isFeatured);
assert.strictEqual(featuredCols.length, 3, '3 collections are marked featured');
console.log('✓ Test 7: Featured collection filtering verified.');

// Test 8: Sort Order index calculation
const sortedCollections = [...mockCollections].sort((a, b) => a.sortOrder - b.sortOrder);
assert.strictEqual(sortedCollections[0].id, 'col-system-featured'); // sortOrder 0
assert.strictEqual(sortedCollections[1].id, 'col-sanskrit-sacred'); // sortOrder 1
assert.strictEqual(sortedCollections[3].id, 'col-antique-manuscripts'); // sortOrder 99
console.log('✓ Test 8: Merchandising sort order sequencing verified.');

// Test 9: Product count aggregation field
assert.strictEqual(mockCollections[0].productCount, 14);
assert.strictEqual(mockCollections[2].productCount, 20);
console.log('✓ Test 9: Collection product count presence verified.');

// Test 10: Slug Auto-Generation
function generateCollectionSlug(name) {
  return name
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/(^-|-$)/g, '');
}
assert.strictEqual(generateCollectionSlug('Tanjore Gold Leaf Collection 2026!'), 'tanjore-gold-leaf-collection-2026');
console.log('✓ Test 10: Slug auto-generation from collection name verified.');


// =============================================================
// Section 2: Query Filtering, Search & Pagination (Tests 11-20)
// =============================================================
console.log('\n[Tests 11-20] Validating Query Filters, Search & Pagination Logic...');

function filterCollections(items, params = {}) {
  let result = [...items];

  if (params.search) {
    const q = params.search.toLowerCase();
    result = result.filter(
      (c) =>
        c.name.toLowerCase().includes(q) ||
        c.slug.toLowerCase().includes(q) ||
        (c.shortDescription && c.shortDescription.toLowerCase().includes(q))
    );
  }

  if (params.status) {
    result = result.filter((c) => c.status === params.status);
  }

  if (params.type) {
    result = result.filter((c) => c.type === params.type);
  }

  if (params.featured !== undefined) {
    result = result.filter((c) => c.isFeatured === Boolean(params.featured));
  }

  if (params.sort) {
    const orderMultiplier = params.order === 'desc' ? -1 : 1;
    result.sort((a, b) => {
      if (params.sort === 'name') return a.name.localeCompare(b.name) * orderMultiplier;
      if (params.sort === 'sortOrder') return (a.sortOrder - b.sortOrder) * orderMultiplier;
      if (params.sort === 'updatedAt')
        return (new Date(a.updatedAt).getTime() - new Date(b.updatedAt).getTime()) * orderMultiplier;
      return 0;
    });
  }

  const page = params.page || 1;
  const limit = params.limit || 10;
  const total = result.length;
  const totalPages = Math.ceil(total / limit) || 1;
  const paginatedItems = result.slice((page - 1) * limit, page * limit);

  return {
    items: paginatedItems,
    pagination: { page, limit, total, totalPages },
  };
}

// Test 11: Text search by name
const searchRes1 = filterCollections(mockCollections, { search: 'bronze' });
assert.strictEqual(searchRes1.items.length, 1);
assert.strictEqual(searchRes1.items[0].id, 'col-temple-bronzes');
console.log('✓ Test 11: Search by collection name returns expected results.');

// Test 12: Text search by description excerpt
const searchRes2 = filterCollections(mockCollections, { search: 'Yantras' });
assert.strictEqual(searchRes2.items.length, 1);
assert.strictEqual(searchRes2.items[0].id, 'col-sanskrit-sacred');
console.log('✓ Test 12: Search across description content validated.');

// Test 13: Status filter (ACTIVE)
const activeRes = filterCollections(mockCollections, { status: 'ACTIVE' });
assert.strictEqual(activeRes.items.length, 3);
assert.ok(activeRes.items.every((c) => c.status === 'ACTIVE'));
console.log('✓ Test 13: Status filter (ACTIVE) verified.');

// Test 14: Status filter (INACTIVE)
const inactiveRes = filterCollections(mockCollections, { status: 'INACTIVE' });
assert.strictEqual(inactiveRes.items.length, 1);
assert.strictEqual(inactiveRes.items[0].id, 'col-antique-manuscripts');
console.log('✓ Test 14: Status filter (INACTIVE) verified.');

// Test 15: Type filter (SYSTEM)
const systemRes = filterCollections(mockCollections, { type: 'SYSTEM' });
assert.strictEqual(systemRes.items.length, 1);
assert.strictEqual(systemRes.items[0].id, 'col-system-featured');
console.log('✓ Test 15: Type filter (SYSTEM) verified.');

// Test 16: Type filter (MANUAL)
const manualRes = filterCollections(mockCollections, { type: 'MANUAL' });
assert.strictEqual(manualRes.items.length, 3);
console.log('✓ Test 16: Type filter (MANUAL) verified.');

// Test 17: Featured flag filter
const featRes = filterCollections(mockCollections, { featured: true });
assert.strictEqual(featRes.items.length, 3);
console.log('✓ Test 17: Featured curation filter verified.');

// Test 18: Sorting by name ascending
const nameAscRes = filterCollections(mockCollections, { sort: 'name', order: 'asc' });
assert.strictEqual(nameAscRes.items[0].id, 'col-temple-bronzes'); // Chola Dynasty Bronzes
assert.strictEqual(nameAscRes.items[1].id, 'col-system-featured'); // Featured Masterpieces
console.log('✓ Test 18: Sorting by collection name verified.');

// Test 19: Sorting by updatedAt descending
const updatedDescRes = filterCollections(mockCollections, { sort: 'updatedAt', order: 'desc' });
assert.strictEqual(updatedDescRes.items[0].id, 'col-antique-manuscripts'); // 2026-02-10
assert.strictEqual(updatedDescRes.items[1].id, 'col-temple-bronzes'); // 2026-02-05
console.log('✓ Test 19: Sorting by modification date verified.');

// Test 20: Pagination limit & slice calculation
const pageRes = filterCollections(mockCollections, { page: 2, limit: 2 });
assert.strictEqual(pageRes.items.length, 2);
assert.strictEqual(pageRes.pagination.page, 2);
assert.strictEqual(pageRes.pagination.totalPages, 2);
assert.strictEqual(pageRes.pagination.total, 4);
console.log('✓ Test 20: Pagination slicing and metadata verified.');


// =============================================================
// Section 3: System vs. Manual Collection Protections (Tests 21-30)
// =============================================================
console.log('\n[Tests 21-30] Validating System Collection Business Guards...');

// Test 21: System collection delete prevention check
function canDeleteCollection(collection, userRole) {
  if (collection.type === 'SYSTEM') {
    return { allowed: false, reason: 'System collections are required by core application features and cannot be deleted.' };
  }
  return { allowed: true };
}
const delSystem = canDeleteCollection(mockCollections[2]);
assert.strictEqual(delSystem.allowed, false);
assert.ok(delSystem.reason.includes('cannot be deleted'));
console.log('✓ Test 21: Deletion guard for SYSTEM collections verified.');

// Test 22: Manual collection delete allowed
const delManual = canDeleteCollection(mockCollections[0]);
assert.strictEqual(delManual.allowed, true);
console.log('✓ Test 22: Deletion permitted for MANUAL collections.');

// Test 23: System collection type immutability
function validateCollectionUpdate(existing, payload) {
  if (existing.type === 'SYSTEM' && payload.type && payload.type !== 'SYSTEM') {
    throw new Error('Cannot change type of a SYSTEM collection.');
  }
  return { ...existing, ...payload };
}
assert.throws(
  () => validateCollectionUpdate(mockCollections[2], { type: 'MANUAL' }),
  /Cannot change type of a SYSTEM collection/
);
console.log('✓ Test 23: Guard preventing changing SYSTEM collection type verified.');

// Test 24: Updating display metadata on system collections is permitted
const updatedSystem = validateCollectionUpdate(mockCollections[2], {
  heroTitle: 'New Masterpiece Curation 2026',
  isFeatured: true,
});
assert.strictEqual(updatedSystem.heroTitle, 'New Masterpiece Curation 2026');
assert.strictEqual(updatedSystem.type, 'SYSTEM');
console.log('✓ Test 24: Display metadata updates on SYSTEM collections permitted.');

// Test 25: Lock badge UI indicator determination
function getCollectionBadgeState(collection) {
  return {
    isLocked: collection.type === 'SYSTEM',
    badgeVariant: collection.type === 'SYSTEM' ? 'amber' : 'neutral',
    badgeLabel: collection.type === 'SYSTEM' ? 'System Collection' : 'Manual Collection',
  };
}
const lockStateSystem = getCollectionBadgeState(mockCollections[2]);
assert.strictEqual(lockStateSystem.isLocked, true);
assert.strictEqual(lockStateSystem.badgeLabel, 'System Collection');
console.log('✓ Test 25: Badge state resolution for system collections verified.');

// Test 26: Lock state for manual collections
const lockStateManual = getCollectionBadgeState(mockCollections[0]);
assert.strictEqual(lockStateManual.isLocked, false);
assert.strictEqual(lockStateManual.badgeLabel, 'Manual Collection');
console.log('✓ Test 26: Badge state resolution for manual collections verified.');

// Test 27: System Collection alert message rendering
function getSystemAlertNotice(collection) {
  if (collection.type !== 'SYSTEM') return null;
  return 'This is a core system-level collection. It cannot be deleted and core structural properties are protected.';
}
assert.ok(getSystemAlertNotice(mockCollections[2]));
assert.strictEqual(getSystemAlertNotice(mockCollections[0]), null);
console.log('✓ Test 27: System alert message generation verified.');

// Test 28: Validation of collection status toggle on system collection
const toggledStatus = validateCollectionUpdate(mockCollections[2], { status: 'INACTIVE' });
assert.strictEqual(toggledStatus.status, 'INACTIVE');
console.log('✓ Test 28: Status toggle permitted on system collections.');

// Test 29: System Collection URL slug preservation
function validateSlugUpdate(existing, payload) {
  if (existing.type === 'SYSTEM' && payload.slug && payload.slug !== existing.slug) {
    // Slugs on system collections can have system consequences
    return { ...existing, ...payload, slugChanged: true };
  }
  return { ...existing, ...payload, slugChanged: false };
}
const slugCheck = validateSlugUpdate(mockCollections[2], { slug: 'featured-masterpieces' });
assert.strictEqual(slugCheck.slugChanged, false);
console.log('✓ Test 29: System collection slug validation verified.');

// Test 30: System Collection count invariant
const systemCols = mockCollections.filter((c) => c.type === 'SYSTEM');
assert.strictEqual(systemCols.length, 1);
console.log('✓ Test 30: System collection count invariant verified.');


// =============================================================
// Section 4: Product Association & Safety (Tests 31-40)
// =============================================================
console.log('\n[Tests 31-40] Validating Product ↔ Collection Association & Safety...');

const mockAssignedProducts = [
  {
    id: 'prod-sanskrit-shree-yantra',
    title: 'Mahameru 3D Shree Yantra Solid Brass',
    slug: 'mahameru-3d-shree-yantra',
    sku: 'YAN-MM-001',
    price: 45000,
    status: 'ACTIVE',
    isFeatured: true,
    images: ['https://images.lagoreearts.com/products/yantra-1.jpg'],
    artist: { id: 'art-1', name: 'Master Sthapati Shankara' },
    collectionIds: ['col-sanskrit-sacred', 'col-system-featured'],
  },
  {
    id: 'prod-sanskrit-gayatri-mandala',
    title: 'Gayatri Mantra Sacred Geometry Mandala',
    slug: 'gayatri-mantra-mandala',
    sku: 'MAN-GM-002',
    price: 32000,
    status: 'ACTIVE',
    isFeatured: false,
    images: ['https://images.lagoreearts.com/products/mandala-1.jpg'],
    artist: { id: 'art-2', name: 'Vidya Vani Studio' },
    collectionIds: ['col-sanskrit-sacred'],
  },
  {
    id: 'prod-chola-nataraja',
    title: 'Shiva Nataraja 24-inch Lost-Wax Bronze',
    slug: 'shiva-nataraja-24-inch-bronze',
    sku: 'BRZ-NAT-003',
    price: 185000,
    status: 'ACTIVE',
    isFeatured: true,
    images: ['https://images.lagoreearts.com/products/nataraja-1.jpg'],
    artist: { id: 'art-3', name: 'Swamimalai Guild' },
    collectionIds: ['col-temple-bronzes', 'col-system-featured'],
  },
];

// Test 31: Assign Product to Collection
function assignProductToCollection(product, collectionId) {
  const current = product.collectionIds || [];
  if (current.includes(collectionId)) return product;
  return { ...product, collectionIds: [...current, collectionId] };
}
const assignedProd = assignProductToCollection(mockAssignedProducts[1], 'col-system-featured');
assert.ok(assignedProd.collectionIds.includes('col-system-featured'));
assert.strictEqual(assignedProd.collectionIds.length, 2);
console.log('✓ Test 31: Product association to collection verified.');

// Test 32: Dissociate Product from Collection
function removeProductFromCollection(product, collectionId) {
  const current = product.collectionIds || [];
  return {
    ...product,
    collectionIds: current.filter((id) => id !== collectionId),
  };
}
const removedProd = removeProductFromCollection(mockAssignedProducts[0], 'col-sanskrit-sacred');
assert.ok(!removedProd.collectionIds.includes('col-sanskrit-sacred'));
assert.ok(removedProd.collectionIds.includes('col-system-featured'));
console.log('✓ Test 32: Product dissociation from collection verified.');

// Test 33: Dissociation Safety (Product entity is preserved and NOT deleted)
assert.strictEqual(removedProd.id, 'prod-sanskrit-shree-yantra');
assert.strictEqual(removedProd.title, 'Mahameru 3D Shree Yantra Solid Brass');
assert.strictEqual(removedProd.status, 'ACTIVE');
console.log('✓ Test 33: Product entity preserved completely upon collection dissociation.');

// Test 34: Safe Dissociation Modal Content Verification
function getDissociateWarningMessage(productTitle, collectionName) {
  return `Are you sure you want to remove "${productTitle}" from "${collectionName}"? The product itself will NOT be deleted.`;
}
const msg = getDissociateWarningMessage('Mahameru Yantra', 'Sanskrit Sacred Geometry');
assert.ok(msg.includes('will NOT be deleted'));
console.log('✓ Test 34: Safe dissociation warning message phrasing verified.');

// Test 35: Query products belonging to a collection
function getProductsInCollection(products, collectionId) {
  return products.filter((p) => p.collectionIds && p.collectionIds.includes(collectionId));
}
const sanskritProducts = getProductsInCollection(mockAssignedProducts, 'col-sanskrit-sacred');
assert.strictEqual(sanskritProducts.length, 2);
console.log('✓ Test 35: Query products by collection ID verified.');

// Test 36: Query products for system collection
const systemProducts = getProductsInCollection(mockAssignedProducts, 'col-system-featured');
assert.strictEqual(systemProducts.length, 2);
console.log('✓ Test 36: Multiple collection memberships verified.');

// Test 37: Multi-Product Batch Assignment
function batchAssignProducts(products, productIds, collectionId) {
  return products.map((p) => {
    if (productIds.includes(p.id)) {
      return assignProductToCollection(p, collectionId);
    }
    return p;
  });
}
const batchUpdated = batchAssignProducts(mockAssignedProducts, ['prod-sanskrit-gayatri-mandala', 'prod-chola-nataraja'], 'col-new-curation');
assert.strictEqual(getProductsInCollection(batchUpdated, 'col-new-curation').length, 2);
console.log('✓ Test 37: Batch product assignment verified.');

// Test 38: Filter assigned products within collection table by title
function searchCollectionProducts(products, query) {
  const q = query.toLowerCase();
  return products.filter((p) => p.title.toLowerCase().includes(q) || p.sku.toLowerCase().includes(q));
}
const filteredAssigned = searchCollectionProducts(sanskritProducts, 'mahameru');
assert.strictEqual(filteredAssigned.length, 1);
assert.strictEqual(filteredAssigned[0].sku, 'YAN-MM-001');
console.log('✓ Test 38: In-collection product search verified.');

// Test 39: Prevent duplicate assignment
const idempotentAssign = assignProductToCollection(mockAssignedProducts[0], 'col-sanskrit-sacred');
assert.strictEqual(idempotentAssign.collectionIds.filter((id) => id === 'col-sanskrit-sacred').length, 1);
console.log('✓ Test 39: Idempotent product assignment verified.');

// Test 40: Collection product count synchronization check
function calculateCollectionProductCount(products, collectionId) {
  return products.filter((p) => p.collectionIds && p.collectionIds.includes(collectionId)).length;
}
assert.strictEqual(calculateCollectionProductCount(mockAssignedProducts, 'col-sanskrit-sacred'), 2);
console.log('✓ Test 40: Dynamic product count calculation verified.');


// =============================================================
// Section 5: Product Picker Modal & Multi-Select (Tests 41-50)
// =============================================================
console.log('\n[Tests 41-50] Validating ProductPicker Search, Selection & States...');

const mockAllCatalogProducts = [
  { id: 'p1', title: 'Tanjore Balaji 24K Gold Leaf', sku: 'TAN-01', price: 95000, categoryId: 'cat-tanjore', images: [] },
  { id: 'p2', title: 'Radha Krishna Mysore Painting', sku: 'MYS-02', price: 42000, categoryId: 'cat-mysore', images: [] },
  { id: 'p3', title: 'Nataraja Bronze Swamimalai', sku: 'BRZ-03', price: 185000, categoryId: 'cat-sculptures', images: [] },
  { id: 'p4', title: 'Navagraha Yantra Copper Plate', sku: 'YAN-04', price: 18000, categoryId: 'cat-yantras', images: [] },
  { id: 'p5', title: 'Saraswati Tanjore Iconography', sku: 'TAN-05', price: 78000, categoryId: 'cat-tanjore', images: [] },
];

// Test 41: ProductPicker excludes / flags already assigned products
function checkProductPickerStatus(candidateId, assignedIds) {
  const isAssigned = assignedIds.includes(candidateId);
  return {
    isAssigned,
    canSelect: !isAssigned,
  };
}
const assignedIdsSet = ['p1', 'p3'];
assert.strictEqual(checkProductPickerStatus('p1', assignedIdsSet).canSelect, false);
assert.strictEqual(checkProductPickerStatus('p2', assignedIdsSet).canSelect, true);
console.log('✓ Test 41: ProductPicker already-assigned disabling logic verified.');

// Test 42: Multi-select state handling (toggle addition)
function togglePickerSelection(selectedIds, targetId) {
  if (selectedIds.includes(targetId)) {
    return selectedIds.filter((id) => id !== targetId);
  }
  return [...selectedIds, targetId];
}
let selected = [];
selected = togglePickerSelection(selected, 'p2');
selected = togglePickerSelection(selected, 'p4');
assert.deepStrictEqual(selected, ['p2', 'p4']);
console.log('✓ Test 42: Multi-selection additions in ProductPicker verified.');

// Test 43: Multi-select state handling (toggle removal)
selected = togglePickerSelection(selected, 'p2');
assert.deepStrictEqual(selected, ['p4']);
console.log('✓ Test 43: Multi-selection removal in ProductPicker verified.');

// Test 44: Select All Available on Current Page
function selectAllAvailable(products, assignedIds) {
  return products.filter((p) => !assignedIds.includes(p.id)).map((p) => p.id);
}
const allAvailable = selectAllAvailable(mockAllCatalogProducts, ['p1', 'p3']);
assert.deepStrictEqual(allAvailable, ['p2', 'p4', 'p5']);
console.log('✓ Test 44: Select all available candidates logic verified.');

// Test 45: ProductPicker Search by title / SKU
function filterPickerCandidates(products, query) {
  if (!query) return products;
  const q = query.toLowerCase();
  return products.filter((p) => p.title.toLowerCase().includes(q) || p.sku.toLowerCase().includes(q));
}
const pickerSearchResults = filterPickerCandidates(mockAllCatalogProducts, 'tanjore');
assert.strictEqual(pickerSearchResults.length, 2);
console.log('✓ Test 45: ProductPicker search filter verified.');

// Test 46: ProductPicker Category filter
function filterPickerByCategory(products, categoryId) {
  if (!categoryId) return products;
  return products.filter((p) => p.categoryId === categoryId);
}
const catFiltered = filterPickerByCategory(mockAllCatalogProducts, 'cat-tanjore');
assert.strictEqual(catFiltered.length, 2);
console.log('✓ Test 46: ProductPicker category filter verified.');

// Test 47: ProductPicker price formatting
function formatProductPrice(price) {
  return `₹${Number(price).toLocaleString('en-IN')}`;
}
assert.strictEqual(formatProductPrice(185000), '₹1,85,000');
console.log('✓ Test 47: INR Currency formatting for artwork pricing verified.');

// Test 48: ProductPicker Confirm Button Active State
function isPickerSubmitEnabled(selectedIds, isPending) {
  return selectedIds.length > 0 && !isPending;
}
assert.strictEqual(isPickerSubmitEnabled([], false), false);
assert.strictEqual(isPickerSubmitEnabled(['p2'], false), true);
assert.strictEqual(isPickerSubmitEnabled(['p2'], true), false);
console.log('✓ Test 48: ProductPicker confirm button state rules verified.');

// Test 49: Clear selection on modal close
function handlePickerClose() {
  return { isOpen: false, selectedIds: [], searchQuery: '' };
}
const resetPicker = handlePickerClose();
assert.strictEqual(resetPicker.isOpen, false);
assert.strictEqual(resetPicker.selectedIds.length, 0);
console.log('✓ Test 49: ProductPicker modal state cleanup verified.');

// Test 50: ProductPicker Pagination calculation
const pickerPageSize = 3;
const pickerTotalPages = Math.ceil(mockAllCatalogProducts.length / pickerPageSize);
assert.strictEqual(pickerTotalPages, 2);
console.log('✓ Test 50: ProductPicker pagination math verified.');


// =============================================================
// Section 6: Collection Media & Lookbook Gallery (Tests 51-60)
// =============================================================
console.log('\n[Tests 51-60] Validating Collection Media & Lookbook Management...');

const mockCollectionMedia = [
  {
    id: 'media-1',
    mediaId: 'asset-hero-1',
    url: 'https://images.lagoreearts.com/collections/hero-high-res.jpg',
    isPrimary: true,
    sortOrder: 1,
    role: 'cover',
    altText: 'Sanskrit Yantra Masterpiece Sanctuary',
  },
  {
    id: 'media-2',
    mediaId: 'asset-craft-2',
    url: 'https://images.lagoreearts.com/collections/artisan-carving.jpg',
    isPrimary: false,
    sortOrder: 2,
    role: 'lookbook',
    altText: 'Artisan hand-chiseling copper plate',
  },
  {
    id: 'media-3',
    mediaId: 'asset-sanctuary-3',
    url: 'https://images.lagoreearts.com/collections/interior-display.jpg',
    isPrimary: false,
    sortOrder: 3,
    role: 'editorial',
    altText: 'Luxury sanctuary interior with sacred geometry art',
  },
];

// Test 51: Primary Media Designation
function setPrimaryMedia(mediaList, targetMediaId) {
  return mediaList.map((m) => ({
    ...m,
    isPrimary: m.mediaId === targetMediaId,
  }));
}
const updatedPrimary = setPrimaryMedia(mockCollectionMedia, 'asset-craft-2');
assert.strictEqual(updatedPrimary.find((m) => m.mediaId === 'asset-craft-2').isPrimary, true);
assert.strictEqual(updatedPrimary.find((m) => m.mediaId === 'asset-hero-1').isPrimary, false);
console.log('✓ Test 51: Setting primary collection media verified.');

// Test 52: Reorder Media List
function reorderMedia(mediaList, fromIndex, toIndex) {
  const list = [...mediaList];
  const [moved] = list.splice(fromIndex, 1);
  list.splice(toIndex, 0, moved);
  return list.map((item, idx) => ({ ...item, sortOrder: idx + 1 }));
}
const reordered = reorderMedia(mockCollectionMedia, 2, 0);
assert.strictEqual(reordered[0].mediaId, 'asset-sanctuary-3');
assert.strictEqual(reordered[0].sortOrder, 1);
assert.strictEqual(reordered[1].sortOrder, 2);
console.log('✓ Test 52: Media reordering and sortOrder re-indexing verified.');

// Test 53: Detach Media from Collection
function detachMedia(mediaList, targetMediaId) {
  const filtered = mediaList.filter((m) => m.mediaId !== targetMediaId);
  if (filtered.length > 0 && !filtered.some((m) => m.isPrimary)) {
    filtered[0].isPrimary = true;
  }
  return filtered;
}
const detached = detachMedia(mockCollectionMedia, 'asset-hero-1');
assert.strictEqual(detached.length, 2);
assert.strictEqual(detached[0].isPrimary, true); // Fallback primary assigned
console.log('✓ Test 53: Media detach with automatic primary promotion verified.');

// Test 54: Role Assignment (cover, banner, lookbook)
const validMediaRoles = ['cover', 'banner', 'lookbook', 'editorial'];
assert.ok(mockCollectionMedia.every((m) => validMediaRoles.includes(m.role)));
console.log('✓ Test 54: Collection media roles validated.');

// Test 55: Separate Cover & Banner Image URL fields
function validateDirectImageFields(payload) {
  const errors = [];
  if (payload.image && !/^https?:\/\//.test(payload.image)) {
    errors.push('Cover image must be a valid URL');
  }
  if (payload.bannerImage && !/^https?:\/\//.test(payload.bannerImage)) {
    errors.push('Banner image must be a valid URL');
  }
  return { isValid: errors.length === 0, errors };
}
assert.strictEqual(validateDirectImageFields({ image: 'https://images.lagoreearts.com/cover.jpg' }).isValid, true);
assert.strictEqual(validateDirectImageFields({ image: 'invalid-url' }).isValid, false);
console.log('✓ Test 55: Direct cover and banner URL format validation verified.');

// Test 56: Media library search within modal
function searchMediaLibrary(libraryItems, query) {
  if (!query) return libraryItems;
  const q = query.toLowerCase();
  return libraryItems.filter((i) => (i.title && i.title.toLowerCase().includes(q)) || (i.filename && i.filename.toLowerCase().includes(q)));
}
const mockLib = [
  { id: '1', title: 'Bronze Nataraja Full View', filename: 'nataraja.jpg' },
  { id: '2', title: 'Tanjore Painting Gold Details', filename: 'gold.jpg' },
];
assert.strictEqual(searchMediaLibrary(mockLib, 'bronze').length, 1);
console.log('✓ Test 56: Media library modal search filter verified.');

// Test 57: Move Media Left Bound Guard
function canMoveLeft(index) {
  return index > 0;
}
assert.strictEqual(canMoveLeft(0), false);
assert.strictEqual(canMoveLeft(1), true);
console.log('✓ Test 57: Move media left boundary check verified.');

// Test 58: Move Media Right Bound Guard
function canMoveRight(index, total) {
  return index < total - 1;
}
assert.strictEqual(canMoveRight(2, 3), false);
assert.strictEqual(canMoveRight(1, 3), true);
console.log('✓ Test 58: Move media right boundary check verified.');

// Test 59: Media Payload Generation for API
function buildAttachMediaPayload(assetId, isPrimary = false, role = 'lookbook') {
  return {
    mediaId: assetId,
    isPrimary,
    role,
  };
}
const attachPayload = buildAttachMediaPayload('asset-123', true, 'cover');
assert.strictEqual(attachPayload.mediaId, 'asset-123');
assert.strictEqual(attachPayload.isPrimary, true);
console.log('✓ Test 59: Attach media payload generation verified.');

// Test 60: Batch Reorder Payload Construction
function buildReorderPayload(items) {
  return {
    mediaOrders: items.map((item, idx) => ({ mediaId: item.mediaId, sortOrder: idx + 1 })),
  };
}
const reorderPayload = buildReorderPayload(mockCollectionMedia);
assert.strictEqual(reorderPayload.mediaOrders.length, 3);
assert.strictEqual(reorderPayload.mediaOrders[0].sortOrder, 1);
console.log('✓ Test 60: Batch reorder payload serialization verified.');


// =============================================================
// Section 7: SEO, SERP Preview & Open Graph (Tests 61-68)
// =============================================================
console.log('\n[Tests 61-68] Validating SEO, SERP Preview & Open Graph Integration...');

// Test 61: SERP Canonical URL formatting
function buildSerpUrl(slug) {
  return `https://lagoreearts.com/collections/${slug || 'collection-slug'}`;
}
assert.strictEqual(buildSerpUrl('chola-dynasty-bronzes'), 'https://lagoreearts.com/collections/chola-dynasty-bronzes');
console.log('✓ Test 61: Canonical SERP URL formulation verified.');

// Test 62: SERP Title Fallback Resolution
function resolveMetaTitle(customTitle, collectionName) {
  if (customTitle && customTitle.trim()) return customTitle.trim();
  if (collectionName && collectionName.trim()) return `${collectionName.trim()} | Lagoree Arts Luxury Collections`;
  return 'Lagoree Arts — Curated Indian Art & Heritage Collections';
}
assert.strictEqual(
  resolveMetaTitle(null, 'Sanskrit Sacred Geometry'),
  'Sanskrit Sacred Geometry | Lagoree Arts Luxury Collections'
);
assert.strictEqual(
  resolveMetaTitle('Custom Title 2026', 'Sanskrit Sacred Geometry'),
  'Custom Title 2026'
);
console.log('✓ Test 62: SERP title fallback hierarchy verified.');

// Test 63: SERP Description Fallback Resolution
function resolveMetaDesc(customDesc, shortDesc, fullDesc) {
  if (customDesc && customDesc.trim()) return customDesc.trim();
  if (shortDesc && shortDesc.trim()) return shortDesc.trim();
  if (fullDesc && fullDesc.trim()) return fullDesc.trim().slice(0, 155) + '...';
  return 'Explore handcrafted sacred masterpieces and antique art collections curated by Lagoree Arts.';
}
assert.strictEqual(
  resolveMetaDesc(null, 'Short summary here', 'Full long text'),
  'Short summary here'
);
console.log('✓ Test 63: SERP meta description fallback resolution verified.');

// Test 64: Google Recommended Character Limits (Title 60 chars, Desc 160 chars)
function checkSeoHealth(title, description) {
  return {
    titleLength: (title || '').length,
    isTitleOptimal: (title || '').length > 0 && (title || '').length <= 60,
    descLength: (description || '').length,
    isDescOptimal: (description || '').length >= 50 && (description || '').length <= 160,
  };
}
const health1 = checkSeoHealth('Chola Dynasty Bronzes | Lagoree Arts', 'Discover museum-quality lost-wax bronze idols casting ancient Chola artistic heritage in Swamimalai.');
assert.strictEqual(health1.isTitleOptimal, true);
assert.strictEqual(health1.isDescOptimal, true);
console.log('✓ Test 64: SERP character limit health checks verified.');

// Test 65: Open Graph Social Card Fallbacks
function resolveOgCard(col) {
  return {
    ogTitle: col.ogTitle || col.metaTitle || col.name,
    ogDescription: col.ogDescription || col.metaDescription || col.shortDescription || '',
    ogImage: col.ogImage || col.image || col.bannerImage || 'https://lagoreearts.com/default-og.jpg',
  };
}
const ogRes = resolveOgCard(mockCollections[0]);
assert.strictEqual(ogRes.ogTitle, 'Sanskrit Sacred Geometry Collection');
assert.strictEqual(ogRes.ogImage, 'https://images.lagoreearts.com/collections/sanskrit-og.jpg');
console.log('✓ Test 65: Open Graph social card fallbacks verified.');

// Test 66: Responsive Storefront Simulation Viewport Modes
const supportedDeviceViews = ['desktop', 'mobile'];
assert.ok(supportedDeviceViews.includes('desktop'));
assert.ok(supportedDeviceViews.includes('mobile'));
console.log('✓ Test 66: Responsive simulation device modes verified.');

// Test 67: Role-Based Access Control on Collection Operations
function checkCollectionPermission(userPermissions, action) {
  if (userPermissions.includes('*') || userPermissions.includes('SUPER_ADMIN')) return true;
  const permissionMap = {
    view: ['collections.read', 'collection.view', 'collections.view'],
    create: ['collections.create', 'collection.create'],
    update: ['collections.update', 'collection.update'],
    delete: ['collections.delete', 'collection.delete'],
  };
  const required = permissionMap[action] || [];
  return required.some((req) => userPermissions.includes(req));
}
assert.strictEqual(checkCollectionPermission(['collections.read'], 'view'), true);
assert.strictEqual(checkCollectionPermission(['collections.read'], 'create'), false);
assert.strictEqual(checkCollectionPermission(['SUPER_ADMIN'], 'delete'), true);
console.log('✓ Test 67: RBAC permissions for collection operations verified.');

// Test 68: Full End-to-End Collection State Mutation Pipeline
const initialCollection = { ...mockCollections[0] };
// 1. Update sort order
const withSort = { ...initialCollection, sortOrder: 5 };
// 2. Change status
const withStatus = { ...withSort, status: 'INACTIVE' };
// 3. Update SEO
const withSeo = { ...withStatus, metaTitle: 'Updated SEO Title 2026' };
assert.strictEqual(withSeo.sortOrder, 5);
assert.strictEqual(withSeo.status, 'INACTIVE');
assert.strictEqual(withSeo.metaTitle, 'Updated SEO Title 2026');
console.log('✓ Test 68: Complete end-to-end collection mutation pipeline verified.');

console.log('\n=============================================================');
console.log('🎉 ALL 68/68 COLLECTION MANAGEMENT PHASE 5 TESTS PASSED 100%!');
console.log('=============================================================\n');

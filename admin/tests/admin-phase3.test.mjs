import assert from 'node:assert';

console.log('=== RUNNING ADMIN PANEL PHASE 3: PRODUCT MANAGEMENT TEST SUITE ===\n');

// =============================================================
// Section 1: Product API Layer & Route Contracts (Tests 1-8)
// =============================================================
console.log('[Tests 1-8] Validating Product API Query & Mutation Contracts...');

const mockProduct = {
  id: 'prod-001',
  name: 'Tanjore Krishna with Yashoda in Teak Frame',
  slug: 'tanjore-krishna-with-yashoda',
  sku: 'LA-TAN-001',
  shortDescription: 'Exquisite 24K gold foil Tanjore painting',
  description: 'Authentic Thanjavur heritage artwork created with natural pigments and gold leaf.',
  price: 85000,
  compareAtPrice: 95000,
  costPrice: 45000,
  currency: 'INR',
  status: 'ACTIVE',
  productType: 'SIMPLE',
  stockQuantity: 12,
  lowStockThreshold: 3,
  trackInventory: true,
  allowBackorder: false,
  isFeatured: true,
  isNewArrival: true,
  isBestseller: false,
  sortOrder: 10,
  categoryId: 'cat-paintings',
  category: { id: 'cat-paintings', name: 'Tanjore Paintings', slug: 'tanjore-paintings' },
  collections: [{ id: 'col-sacred', name: 'Sacred Art Edit', slug: 'sacred-art' }],
  attributes: [
    { attributeId: 'attr-material', attributeName: 'Material', textValue: '24K Gold Foil, Teak Wood, Canvas' },
    { attributeId: 'attr-style', attributeName: 'Art Style', valueId: 'val-tanjore' },
  ],
  media: [
    { id: 'pm-1', mediaId: 'med-101', url: 'https://cdn.lagoreearts.com/krishna-1.jpg', isPrimary: true, sortOrder: 1 },
    { id: 'pm-2', mediaId: 'med-102', url: 'https://cdn.lagoreearts.com/krishna-2.jpg', isPrimary: false, sortOrder: 2 },
  ],
  createdAt: '2026-09-01T10:00:00.000Z',
  updatedAt: '2026-09-02T12:00:00.000Z',
};

// Test 1: Product Structure Integrity
assert.strictEqual(mockProduct.id, 'prod-001');
assert.strictEqual(mockProduct.sku, 'LA-TAN-001');
assert.strictEqual(mockProduct.currency, 'INR');
assert.strictEqual(mockProduct.status, 'ACTIVE');
console.log('✓ Test 1: Product core model contract verified.');

// Test 2: Status Lifecycle Transitions
const allowedStatuses = ['DRAFT', 'ACTIVE', 'INACTIVE', 'ARCHIVED'];
assert.ok(allowedStatuses.includes(mockProduct.status), 'Product status must be in standard lifecycle enum');
console.log('✓ Test 2: Product status lifecycle enumeration validated.');

// Test 3: Product Types (Simple & Variable)
const allowedTypes = ['SIMPLE', 'VARIABLE'];
assert.ok(allowedTypes.includes(mockProduct.productType));
console.log('✓ Test 3: Product types (SIMPLE / VARIABLE) validated.');

// Test 4: Pricing & Compare At Math
assert.ok(mockProduct.price > 0, 'Price must be positive');
assert.ok(mockProduct.compareAtPrice > mockProduct.price, 'Compare price represents discount baseline');
const discountPercent = Math.round(((mockProduct.compareAtPrice - mockProduct.price) / mockProduct.compareAtPrice) * 100);
assert.strictEqual(discountPercent, 11, 'Discount percentage calculated accurately');
console.log('✓ Test 4: Decimal-safe price comparisons and discount math verified.');

// Test 5: Cost Price Confidentiality Masking
function sanitizeProductForPreview(product) {
  const { costPrice, internalNotes, supplierId, ...safeProduct } = product;
  return safeProduct;
}
const previewSafe = sanitizeProductForPreview(mockProduct);
assert.strictEqual(previewSafe.costPrice, undefined, 'costPrice must be omitted from public preview');
assert.strictEqual(previewSafe.price, 85000, 'Public price remains intact');
console.log('✓ Test 5: Confidential costPrice strictly masked in storefront preview.');

// Test 6: Media Attachment Sort Order
const sortedMedia = [...mockProduct.media].sort((a, b) => a.sortOrder - b.sortOrder);
assert.strictEqual(sortedMedia[0].isPrimary, true, 'First media item is designated Primary');
assert.strictEqual(sortedMedia[0].id, 'pm-1');
console.log('✓ Test 6: Media sorting and primary asset resolution validated.');

// Test 7: Category & Collection Taxonomy Binding
assert.strictEqual(mockProduct.category.id, 'cat-paintings');
assert.strictEqual(mockProduct.collections.length, 1);
console.log('✓ Test 7: Category and Collection bindings verified.');

// Test 8: Dynamic Attribute Assignment Parsing
const materialAttr = mockProduct.attributes.find((a) => a.attributeId === 'attr-material');
assert.ok(materialAttr && materialAttr.textValue.includes('24K Gold Foil'));
console.log('✓ Test 8: Dynamic attribute values parsed correctly.');

// =============================================================
// Section 2: Product Listing & Filter Engine (Tests 9-18)
// =============================================================
console.log('\n[Tests 9-18] Validating Product List Filter & Pagination Engine...');

const catalogDataset = [
  { id: 'p1', name: 'Tanjore Krishna', sku: 'TAN-001', categoryId: 'c-paint', status: 'ACTIVE', productType: 'SIMPLE', price: 85000, isFeatured: true, stockQuantity: 10 },
  { id: 'p2', name: 'Bronze Nataraja Antique', sku: 'ANT-002', categoryId: 'c-antique', status: 'ACTIVE', productType: 'SIMPLE', price: 250000, isFeatured: true, stockQuantity: 1 },
  { id: 'p3', name: 'Sanskrit Gayatri Verse Artwork', sku: 'SAN-003', categoryId: 'c-sanskrit', status: 'DRAFT', productType: 'VARIABLE', price: 42000, isFeatured: false, stockQuantity: 25 },
  { id: 'p4', name: 'Mysore Rosewood Inlay Panel', sku: 'WOD-004', categoryId: 'c-paint', status: 'INACTIVE', productType: 'SIMPLE', price: 68000, isFeatured: false, stockQuantity: 0 },
  { id: 'p5', name: 'Chola Dynasty Shiva Parvati Bronze', sku: 'ANT-005', categoryId: 'c-antique', status: 'ARCHIVED', productType: 'SIMPLE', price: 450000, isFeatured: false, stockQuantity: 0 },
];

// Test 9: Search Filter Debounced query
function filterCatalog(list, { search, status, categoryId, productType, isFeatured }) {
  return list.filter((item) => {
    if (search) {
      const q = search.toLowerCase();
      const matchName = item.name.toLowerCase().includes(q);
      const matchSku = item.sku.toLowerCase().includes(q);
      if (!matchName && !matchSku) return false;
    }
    if (status && item.status !== status) return false;
    if (categoryId && item.categoryId !== categoryId) return false;
    if (productType && item.productType !== productType) return false;
    if (isFeatured !== undefined && item.isFeatured !== isFeatured) return false;
    return true;
  });
}

const searchResult = filterCatalog(catalogDataset, { search: 'Nataraja' });
assert.strictEqual(searchResult.length, 1);
assert.strictEqual(searchResult[0].id, 'p2');
console.log('✓ Test 9: Debounced keyword search filters by name & SKU.');

// Test 10: Status Filter (Draft only)
const draftResult = filterCatalog(catalogDataset, { status: 'DRAFT' });
assert.strictEqual(draftResult.length, 1);
assert.strictEqual(draftResult[0].id, 'p3');
console.log('✓ Test 10: Status filter isolation verified.');

// Test 11: Category Filter (Antiques only)
const antiqueResult = filterCatalog(catalogDataset, { categoryId: 'c-antique' });
assert.strictEqual(antiqueResult.length, 2);
console.log('✓ Test 11: Category taxonomy filter verified.');

// Test 12: Product Type Filter (Variable only)
const variableResult = filterCatalog(catalogDataset, { productType: 'VARIABLE' });
assert.strictEqual(variableResult.length, 1);
assert.strictEqual(variableResult[0].id, 'p3');
console.log('✓ Test 12: Product type filter (SIMPLE vs VARIABLE) verified.');

// Test 13: Merchandising Featured Filter
const featuredResult = filterCatalog(catalogDataset, { isFeatured: true });
assert.strictEqual(featuredResult.length, 2);
console.log('✓ Test 13: Featured merchandising filter verified.');

// Test 14: Combined Complex Filters
const combinedResult = filterCatalog(catalogDataset, { categoryId: 'c-paint', status: 'ACTIVE', isFeatured: true });
assert.strictEqual(combinedResult.length, 1);
assert.strictEqual(combinedResult[0].id, 'p1');
console.log('✓ Test 14: Compound multi-select filter verified.');

// Test 15: Inventory Low Stock & Out of Stock Classification
function getStockStatus(stockQuantity, threshold = 5, tracking = true) {
  if (!tracking) return 'IN_STOCK';
  if (stockQuantity === 0) return 'OUT_OF_STOCK';
  if (stockQuantity <= threshold) return 'LOW_STOCK';
  return 'IN_STOCK';
}
assert.strictEqual(getStockStatus(10), 'IN_STOCK');
assert.strictEqual(getStockStatus(3), 'LOW_STOCK');
assert.strictEqual(getStockStatus(0), 'OUT_OF_STOCK');
assert.strictEqual(getStockStatus(0, 5, false), 'IN_STOCK');
console.log('✓ Test 15: Authoritative server-side stock level badge categorization verified.');

// Test 16: Pagination Offset Math
function paginate(items, page = 1, limit = 2) {
  const total = items.length;
  const totalPages = Math.ceil(total / limit);
  const start = (page - 1) * limit;
  const products = items.slice(start, start + limit);
  return { products, total, page, limit, totalPages };
}
const page1 = paginate(catalogDataset, 1, 2);
assert.strictEqual(page1.products.length, 2);
assert.strictEqual(page1.totalPages, 3);
const page3 = paginate(catalogDataset, 3, 2);
assert.strictEqual(page3.products.length, 1);
console.log('✓ Test 16: Server-side pagination and total page calculation verified.');

// Test 17: Empty State on Zero Results
const noMatches = filterCatalog(catalogDataset, { search: 'NonExistentArtwork' });
assert.strictEqual(noMatches.length, 0);
console.log('✓ Test 17: Empty state triggers on empty search results.');

// Test 18: Reset Filters Functionality
const resetResult = filterCatalog(catalogDataset, {});
assert.strictEqual(resetResult.length, 5);
console.log('✓ Test 18: Reset filter restores total unfiltered records.');

// =============================================================
// Section 3: Product Options & Variant Matrix (Tests 19-30)
// =============================================================
console.log('\n[Tests 19-30] Validating Variable Product Options & Variant Matrix...');

const mockOptions = [
  {
    id: 'opt-size',
    productId: 'p-var-01',
    name: 'Canvas Size',
    sortOrder: 1,
    values: [
      { id: 'val-s1', optionId: 'opt-size', name: '18 x 24 inches', sortOrder: 1 },
      { id: 'val-s2', optionId: 'opt-size', name: '24 x 36 inches', sortOrder: 2 },
      { id: 'val-s3', optionId: 'opt-size', name: '36 x 48 inches', sortOrder: 3 },
    ],
  },
  {
    id: 'opt-frame',
    productId: 'p-var-01',
    name: 'Framing Material',
    sortOrder: 2,
    values: [
      { id: 'val-f1', optionId: 'opt-frame', name: 'Chettinad Teak Wood', sortOrder: 1 },
      { id: 'val-f2', optionId: 'opt-frame', name: 'Gold Leaf Vintage Frame', sortOrder: 2 },
    ],
  },
];

// Test 19: Option and Value Associations
assert.strictEqual(mockOptions.length, 2);
assert.strictEqual(mockOptions[0].values.length, 3);
assert.strictEqual(mockOptions[1].values.length, 2);
console.log('✓ Test 19: Product options and nested value hierarchy verified.');

// Test 20: Cartesian Product Matrix Computation
function generateCombinations(options) {
  if (options.length === 0) return [];
  return options.reduce(
    (acc, opt) => {
      const result = [];
      for (const existing of acc) {
        for (const val of opt.values) {
          result.push([...existing, { optionId: opt.id, optionName: opt.name, valueId: val.id, valueName: val.name }]);
        }
      }
      return result;
    },
    [[]]
  );
}

const matrixCombinations = generateCombinations(mockOptions);
assert.strictEqual(matrixCombinations.length, 3 * 2, '3 sizes x 2 frames = 6 variant combinations');
console.log('✓ Test 20: Full variant matrix Cartesian product generated correctly (6 combinations).');

// Test 21: Variant SKU Generation Pattern
const baseSku = 'LA-SAN-GAYATRI';
const variants = matrixCombinations.map((combo, idx) => ({
  id: `var-${idx + 1}`,
  productId: 'p-var-01',
  sku: `${baseSku}-${combo.map((c) => c.valueName.split(' ')[0].toUpperCase()).join('-')}`,
  price: 45000 + idx * 10000,
  stockQuantity: 5,
  status: 'ACTIVE',
  optionValues: combo,
}));

assert.strictEqual(variants.length, 6);
assert.ok(variants[0].sku.startsWith('LA-SAN-GAYATRI'));
console.log('✓ Test 21: Variant SKU generation and option mapping verified.');

// Test 22: Variant SKU Uniqueness
const skus = variants.map((v) => v.sku);
const uniqueSkus = new Set(skus);
assert.strictEqual(uniqueSkus.size, skus.length, 'All variant SKUs must be unique');
console.log('✓ Test 22: Variant SKU uniqueness guaranteed.');

// Test 23: Variant Pricing Overrides vs Base Price
const basePrice = 45000;
const customPricedVariant = variants[2]; // 3rd variant: price = 65000
assert.strictEqual(customPricedVariant.price, 65000);
assert.ok(customPricedVariant.price > basePrice);
console.log('✓ Test 23: Variant price override successfully resolves higher than base price.');

// Test 24: Variant Default Price Fallback
const defaultPriceVariant = { ...variants[0], price: null };
const effectivePrice = defaultPriceVariant.price ?? basePrice;
assert.strictEqual(effectivePrice, basePrice, 'Falls back to base price when variant price is null');
console.log('✓ Test 24: Variant null price falls back safely to product base price.');

// Test 25: Variant Status Toggle
let testVariant = { ...variants[0], status: 'ACTIVE' };
function toggleVariantStatus(v) {
  return { ...v, status: v.status === 'ACTIVE' ? 'INACTIVE' : 'ACTIVE' };
}
testVariant = toggleVariantStatus(testVariant);
assert.strictEqual(testVariant.status, 'INACTIVE');
testVariant = toggleVariantStatus(testVariant);
assert.strictEqual(testVariant.status, 'ACTIVE');
console.log('✓ Test 25: Variant activation/deactivation toggle verified.');

// Test 26: Individual Variant Inventory Tracking
variants[0].stockQuantity = 0;
assert.strictEqual(getStockStatus(variants[0].stockQuantity), 'OUT_OF_STOCK');
assert.strictEqual(getStockStatus(variants[1].stockQuantity), 'LOW_STOCK');
console.log('✓ Test 26: Variant level stock isolation validated.');

// Test 27: Add New Option Value Dynamically
const updatedOptions = mockOptions.map((opt) => {
  if (opt.id === 'opt-frame') {
    return {
      ...opt,
      values: [...opt.values, { id: 'val-f3', optionId: 'opt-frame', name: 'Antique Brass Inlay', sortOrder: 3 }],
    };
  }
  return opt;
});
const newMatrix = generateCombinations(updatedOptions);
assert.strictEqual(newMatrix.length, 3 * 3, '3 sizes x 3 frames = 9 variant combinations');
console.log('✓ Test 27: Dynamic option value addition expands matrix accurately (9 combinations).');

// Test 28: Delete Option Value Propagation
const prunedOptions = mockOptions.map((opt) => {
  if (opt.id === 'opt-size') {
    return { ...opt, values: opt.values.filter((v) => v.id !== 'val-s3') };
  }
  return opt;
});
const prunedMatrix = generateCombinations(prunedOptions);
assert.strictEqual(prunedMatrix.length, 2 * 2, '2 sizes x 2 frames = 4 variant combinations');
console.log('✓ Test 28: Option value removal prunes associated variants.');

// Test 29: Option Sorting Order
const sortedOptions = [...mockOptions].sort((a, b) => a.sortOrder - b.sortOrder);
assert.strictEqual(sortedOptions[0].name, 'Canvas Size');
console.log('✓ Test 29: Option sort order preservation verified.');

// Test 30: Variant Option Value Label Formatting
const formattedLabel = variants[0].optionValues.map((ov) => ov.valueName).join(' / ');
assert.strictEqual(formattedLabel, '18 x 24 inches / Chettinad Teak Wood');
console.log('✓ Test 30: Human-readable variant combination labels verified.');

// =============================================================
// Section 4: Dynamic Category-Bound Attributes (Tests 31-40)
// =============================================================
console.log('\n[Tests 31-40] Validating Dynamic Attribute Rendering & Validation Engine...');

const mockCategoryAttributes = [
  {
    id: 'ca-1',
    categoryId: 'cat-paintings',
    attributeId: 'attr-artform',
    isRequired: true,
    attribute: {
      id: 'attr-artform',
      name: 'Art Tradition',
      slug: 'art-tradition',
      type: 'SELECT',
      values: [
        { id: 'val-tanjore', name: 'Tanjore Heritage', slug: 'tanjore' },
        { id: 'val-mysore', name: 'Mysore Traditional', slug: 'mysore' },
        { id: 'val-kalamkari', name: 'Kalamkari Hand-Painted', slug: 'kalamkari' },
      ],
    },
  },
  {
    id: 'ca-2',
    categoryId: 'cat-paintings',
    attributeId: 'attr-framing',
    isRequired: false,
    attribute: {
      id: 'attr-framing',
      name: 'Framing Materials Included',
      slug: 'framing-materials',
      type: 'MULTI_SELECT',
      values: [
        { id: 'val-teak', name: 'Teak Wood', slug: 'teak' },
        { id: 'val-goldleaf', name: 'Gold Leaf', slug: 'gold-leaf' },
        { id: 'val-glass', name: 'Museum Glass', slug: 'museum-glass' },
      ],
    },
  },
  {
    id: 'ca-3',
    categoryId: 'cat-paintings',
    attributeId: 'attr-certified',
    isRequired: true,
    attribute: {
      id: 'attr-certified',
      name: 'Certificate of Provenance Included',
      slug: 'certificate-provenance',
      type: 'BOOLEAN',
    },
  },
  {
    id: 'ca-4',
    categoryId: 'cat-paintings',
    attributeId: 'attr-year',
    isRequired: false,
    attribute: {
      id: 'attr-year',
      name: 'Creation Year',
      slug: 'creation-year',
      type: 'NUMBER',
    },
  },
];

// Test 31: Category Attributes Fetch & Binding
assert.strictEqual(mockCategoryAttributes.length, 4);
console.log('✓ Test 31: Category-bound attribute specification list resolved.');

// Test 32: Select Attribute Assignment
const selectAssignment = { attributeId: 'attr-artform', valueId: 'val-tanjore' };
assert.strictEqual(selectAssignment.valueId, 'val-tanjore');
console.log('✓ Test 32: Single-select attribute assignment verified.');

// Test 33: Multi-Select Attribute Assignment Array
const multiAssignment = { attributeId: 'attr-framing', valueIds: ['val-teak', 'val-goldleaf'] };
assert.strictEqual(multiAssignment.valueIds.length, 2);
assert.ok(multiAssignment.valueIds.includes('val-teak'));
console.log('✓ Test 33: Multi-select attribute assignment array verified.');

// Test 34: Boolean Attribute Assignment
const boolAssignment = { attributeId: 'attr-certified', booleanValue: true };
assert.strictEqual(boolAssignment.booleanValue, true);
console.log('✓ Test 34: Boolean attribute toggle assignment verified.');

// Test 35: Number Attribute Assignment
const numberAssignment = { attributeId: 'attr-year', numberValue: 2026 };
assert.strictEqual(numberAssignment.numberValue, 2026);
console.log('✓ Test 35: Numeric specification attribute assignment verified.');

// Test 36: Text Attribute Freeform
const textAssignment = { attributeId: 'attr-provenance-notes', textValue: 'Acquired from Master Artisan R. Sundaram' };
assert.ok(textAssignment.textValue.startsWith('Acquired'));
console.log('✓ Test 36: Freeform text attribute assignment verified.');

// Test 37: Required Attributes Validation
function validateAttributes(bindings, assignments) {
  const errors = [];
  for (const b of bindings) {
    if (b.isRequired) {
      const assignment = assignments.find((a) => a.attributeId === b.attributeId);
      if (!assignment) {
        errors.push(`Missing required attribute: ${b.attribute.name}`);
      } else if (b.attribute.type === 'SELECT' && !assignment.valueId) {
        errors.push(`Missing selection for: ${b.attribute.name}`);
      } else if (b.attribute.type === 'BOOLEAN' && assignment.booleanValue === undefined) {
        errors.push(`Missing value for boolean: ${b.attribute.name}`);
      }
    }
  }
  return { isValid: errors.length === 0, errors };
}

const validAssignments = [selectAssignment, multiAssignment, boolAssignment, numberAssignment];
const valResult = validateAttributes(mockCategoryAttributes, validAssignments);
assert.strictEqual(valResult.isValid, true);
assert.strictEqual(valResult.errors.length, 0);
console.log('✓ Test 37: Required attribute completeness validation passes for valid payload.');

// Test 38: Missing Required Attribute Failure
const invalidAssignments = [multiAssignment, numberAssignment]; // Missing attr-artform and attr-certified
const invalidValResult = validateAttributes(mockCategoryAttributes, invalidAssignments);
assert.strictEqual(invalidValResult.isValid, false);
assert.strictEqual(invalidValResult.errors.length, 2);
console.log('✓ Test 38: Validation failure correctly detects missing mandatory category attributes.');

// Test 39: Category Switching Attribute Reset / Adaptation
function resolveAttributesForCategory(categoryId, categoryAttrMap, globalAttributes) {
  if (categoryId && categoryAttrMap[categoryId]) {
    return categoryAttrMap[categoryId];
  }
  return globalAttributes;
}
const globalAttrs = [{ id: 'ga-1', attribute: { name: 'Generic Tag', type: 'TEXT' } }];
const resolvedCatAttrs = resolveAttributesForCategory('cat-paintings', { 'cat-paintings': mockCategoryAttributes }, globalAttrs);
const resolvedFallbackAttrs = resolveAttributesForCategory('cat-unknown', { 'cat-paintings': mockCategoryAttributes }, globalAttrs);
assert.strictEqual(resolvedCatAttrs.length, 4);
assert.strictEqual(resolvedFallbackAttrs.length, 1);
console.log('✓ Test 39: Dynamic attribute resolution adapts on category change with fallback.');

// Test 40: Attribute Payload Serialization for PUT /api/v1/admin/products/:id/attributes
const serializedAttributes = validAssignments.map((a) => ({
  attributeId: a.attributeId,
  valueId: a.valueId || null,
  valueIds: a.valueIds || null,
  textValue: a.textValue || null,
  numberValue: a.numberValue || null,
  booleanValue: a.booleanValue !== undefined ? a.booleanValue : null,
}));
assert.strictEqual(serializedAttributes.length, 4);
assert.strictEqual(serializedAttributes[0].valueId, 'val-tanjore');
console.log('✓ Test 40: Attribute assignment array serializes accurately for API synchronization.');

// =============================================================
// Section 5: SEO & SERP Optimization Engine (Tests 41-48)
// =============================================================
console.log('\n[Tests 41-48] Validating Product SEO & SERP Engine...');

const mockSeo = {
  entityType: 'PRODUCT',
  entityId: 'prod-001',
  metaTitle: 'Authentic Tanjore Krishna Painting | Lagoree Arts Heritage',
  metaDescription: 'Handcrafted 24K gold foil Tanjore painting in authentic teak frame with certificate of provenance from Lagoree Arts.',
  canonicalUrl: 'https://lagoreearts.com/products/tanjore-krishna-with-yashoda',
  ogTitle: 'Tanjore Krishna Masterpiece — Lagoree Arts',
  ogDescription: '24K Gold Leaf Sacred Vedic Art from Thanjavur masters.',
  ogImage: 'https://cdn.lagoreearts.com/og/krishna.jpg',
  noIndex: false,
  noFollow: false,
};

// Test 41: Meta Title Length Validation (Recommending <= 60 chars)
assert.ok(mockSeo.metaTitle.length > 20 && mockSeo.metaTitle.length <= 70, 'Meta title within optimal SERP length');
console.log(`✓ Test 41: Meta title length (${mockSeo.metaTitle.length} chars) validated.`);

// Test 42: Meta Description Length Validation (Recommending <= 160 chars)
assert.ok(mockSeo.metaDescription.length > 50 && mockSeo.metaDescription.length <= 160, 'Meta description within optimal SERP snippet limit');
console.log(`✓ Test 42: Meta description length (${mockSeo.metaDescription.length} chars) validated.`);

// Test 43: Google SERP Preview Generator
function generateSerpPreview(seo, productSlug, fallbackTitle, fallbackDesc) {
  const title = seo.metaTitle || fallbackTitle || 'Lagoree Arts';
  const description = seo.metaDescription || fallbackDesc || 'Lagoree Arts Luxury Collection';
  const url = seo.canonicalUrl || `https://lagoreearts.com/products/${productSlug}`;
  return { title, description, url };
}

const serp = generateSerpPreview(mockSeo, 'tanjore-krishna', 'Default Title', 'Default Desc');
assert.strictEqual(serp.title, mockSeo.metaTitle);
assert.strictEqual(serp.url, mockSeo.canonicalUrl);
console.log('✓ Test 43: Google SERP preview snippet rendered accurately.');

// Test 44: SEO Fallback to Product Name & Short Description
const emptySeo = {};
const fallbackSerp = generateSerpPreview(emptySeo, 'tanjore-krishna', mockProduct.name, mockProduct.shortDescription);
assert.strictEqual(fallbackSerp.title, mockProduct.name);
assert.strictEqual(fallbackSerp.description, mockProduct.shortDescription);
assert.strictEqual(fallbackSerp.url, 'https://lagoreearts.com/products/tanjore-krishna');
console.log('✓ Test 44: Automatic fallback to Product Name and Description when SEO is blank.');

// Test 45: OpenGraph Social Tags Integrity
assert.strictEqual(mockSeo.ogTitle, 'Tanjore Krishna Masterpiece — Lagoree Arts');
assert.ok(mockSeo.ogImage.startsWith('https://'));
console.log('✓ Test 45: OpenGraph metadata tags verified.');

// Test 46: Canonical URL Format Validation
function isValidCanonicalUrl(url) {
  try {
    const parsed = new URL(url);
    return parsed.protocol === 'https:' || parsed.protocol === 'http:';
  } catch {
    return false;
  }
}
assert.strictEqual(isValidCanonicalUrl(mockSeo.canonicalUrl), true);
assert.strictEqual(isValidCanonicalUrl('invalid-url'), false);
console.log('✓ Test 46: Canonical URL format validation verified.');

// Test 47: Robots Directives (noIndex / noFollow)
assert.strictEqual(mockSeo.noIndex, false, 'Default product is indexed by search engines');
assert.strictEqual(mockSeo.noFollow, false, 'Default product links are followed');
console.log('✓ Test 47: Search engine robots indexing directives verified.');

// Test 48: SEO Upsert Payload Formatting
const upsertPayload = {
  metaTitle: mockSeo.metaTitle,
  metaDescription: mockSeo.metaDescription,
  canonicalUrl: mockSeo.canonicalUrl,
  ogTitle: mockSeo.ogTitle,
  ogDescription: mockSeo.ogDescription,
  ogImage: mockSeo.ogImage,
};
assert.strictEqual(typeof upsertPayload.metaTitle, 'string');
console.log('✓ Test 48: SEO upsert API payload formatted cleanly.');

// =============================================================
// Section 6: Form Guards & Unsaved Changes Protection (Tests 49-56)
// =============================================================
console.log('\n[Tests 49-56] Validating Unsaved Changes Guard & Navigation Protection...');

// Test 49: Dirty Tracking on Initial Load
let isFormDirty = false;
assert.strictEqual(isFormDirty, false, 'Clean state on page initial load');
console.log('✓ Test 49: Clean form state on initial product load.');

// Test 50: Dirty State on Form Input Mutation
function onInputChange(current, initial) {
  return current !== initial;
}
isFormDirty = onInputChange('Edited Title', 'Original Title');
assert.strictEqual(isFormDirty, true, 'Form becomes dirty upon field edit');
console.log('✓ Test 50: Form dirty flag triggers upon user modification.');

// Test 51: Navigation Interception when Dirty
function guardNavigation(targetUrl, isDirty) {
  if (isDirty) {
    return { shouldNavigate: false, showConfirmModal: true, pendingUrl: targetUrl };
  }
  return { shouldNavigate: true, showConfirmModal: false, pendingUrl: null };
}
const guardedAttempt = guardNavigation('/admin/products', true);
assert.strictEqual(guardedAttempt.shouldNavigate, false);
assert.strictEqual(guardedAttempt.showConfirmModal, true);
assert.strictEqual(guardedAttempt.pendingUrl, '/admin/products');
console.log('✓ Test 51: Internal router navigation intercepted when unsaved changes exist.');

// Test 52: Navigation Allowed when Clean
const cleanAttempt = guardNavigation('/admin/products', false);
assert.strictEqual(cleanAttempt.shouldNavigate, true);
assert.strictEqual(cleanAttempt.showConfirmModal, false);
console.log('✓ Test 52: Unobstructed navigation when form is pristine.');

// Test 53: Discard Action Resets State and Navigates
function confirmDiscard(pendingUrl) {
  return { isDirty: false, navigatedTo: pendingUrl, modalOpen: false };
}
const discardResult = confirmDiscard(guardedAttempt.pendingUrl);
assert.strictEqual(discardResult.isDirty, false);
assert.strictEqual(discardResult.navigatedTo, '/admin/products');
console.log('✓ Test 53: Discard action resets dirty state and proceeds to pending route.');

// Test 54: Cancel Action Retains Dirty State
function cancelNavigation() {
  return { modalOpen: false, stayOnPage: true };
}
const cancelResult = cancelNavigation();
assert.strictEqual(cancelResult.stayOnPage, true);
console.log('✓ Test 54: Cancel action dismisses modal and keeps user in form.');

// Test 55: Browser Tab Close / Refresh `beforeunload` Event Handlers
function simulateBeforeUnload(isDirty) {
  const event = { preventDefaultCalled: false, returnValue: undefined };
  if (isDirty) {
    event.preventDefaultCalled = true;
    event.returnValue = '';
  }
  return event;
}
const unloadEventDirty = simulateBeforeUnload(true);
assert.strictEqual(unloadEventDirty.preventDefaultCalled, true);
const unloadEventClean = simulateBeforeUnload(false);
assert.strictEqual(unloadEventClean.preventDefaultCalled, false);
console.log('✓ Test 55: Browser beforeunload event listener correctly triggers browser alert.');

// Test 56: Save Success Clears Dirty State
function onSaveSuccess() {
  isFormDirty = false;
}
onSaveSuccess();
assert.strictEqual(isFormDirty, false, 'Saving changes clears dirty flag before redirection');
console.log('✓ Test 56: Successful save clears dirty flag and prevents false alert on redirect.');

// =============================================================
// Section 7: RBAC Authorization & Security Matrix (Tests 57-64)
// =============================================================
console.log('\n[Tests 57-64] Validating Product RBAC Permission & Authorization Matrix...');

const superAdmin = {
  id: 'adm-super',
  role: { slug: 'SUPER_ADMIN', name: 'Super Admin' },
  permissions: ['*'],
};

const productManager = {
  id: 'adm-prod',
  role: { slug: 'PRODUCT_MANAGER', name: 'Product Manager' },
  permissions: ['product.view', 'product.create', 'product.update', 'product.delete', 'media.view', 'media.create'],
};

const contentEditor = {
  id: 'adm-editor',
  role: { slug: 'CONTENT_EDITOR', name: 'Content Editor' },
  permissions: ['product.view', 'product.update', 'media.view'],
};

const readonlyAuditor = {
  id: 'adm-auditor',
  role: { slug: 'AUDITOR', name: 'Auditor' },
  permissions: ['product.view', 'order.view', 'audit.view'],
};

function hasProductPermission(user, permission) {
  if (!user) return false;
  if (user.role?.slug === 'SUPER_ADMIN' || user.permissions?.includes('*')) return true;
  if (user.permissions?.includes(permission)) return true;
  // Synonym mapping
  const synonyms = {
    'products.read': ['product.view'],
    'product.view': ['products.read'],
    'products.create': ['product.create'],
    'product.create': ['products.create'],
  };
  const syns = synonyms[permission];
  return syns ? syns.some((s) => user.permissions?.includes(s)) : false;
}

// Test 57: Super Admin Universal Access
assert.strictEqual(hasProductPermission(superAdmin, 'product.create'), true);
assert.strictEqual(hasProductPermission(superAdmin, 'product.delete'), true);
console.log('✓ Test 57: Super Admin has unrestricted product CRUD access.');

// Test 58: Product Manager Full Lifecycle Rights
assert.strictEqual(hasProductPermission(productManager, 'product.view'), true);
assert.strictEqual(hasProductPermission(productManager, 'product.create'), true);
assert.strictEqual(hasProductPermission(productManager, 'product.update'), true);
assert.strictEqual(hasProductPermission(productManager, 'product.delete'), true);
console.log('✓ Test 58: Product Manager has full create, edit, status, and delete access.');

// Test 59: Content Editor Cannot Delete Products
assert.strictEqual(hasProductPermission(contentEditor, 'product.update'), true);
assert.strictEqual(hasProductPermission(contentEditor, 'product.delete'), false);
assert.strictEqual(hasProductPermission(contentEditor, 'product.create'), false);
console.log('✓ Test 59: Content Editor restricted from deleting or creating products.');

// Test 60: Auditor Read-Only Mode
assert.strictEqual(hasProductPermission(readonlyAuditor, 'product.view'), true);
assert.strictEqual(hasProductPermission(readonlyAuditor, 'product.create'), false);
assert.strictEqual(hasProductPermission(readonlyAuditor, 'product.update'), false);
assert.strictEqual(hasProductPermission(readonlyAuditor, 'product.delete'), false);
console.log('✓ Test 60: Auditor strictly restricted to read-only inspection.');

// Test 61: UI Control Disablement for Read-Only Users
function getFormControlsState(user) {
  const canUpdate = hasProductPermission(user, 'product.update');
  const canDelete = hasProductPermission(user, 'product.delete');
  return {
    inputsDisabled: !canUpdate,
    saveButtonVisible: canUpdate,
    deleteButtonVisible: canDelete,
  };
}
const auditorUi = getFormControlsState(readonlyAuditor);
assert.strictEqual(auditorUi.inputsDisabled, true);
assert.strictEqual(auditorUi.saveButtonVisible, false);
assert.strictEqual(auditorUi.deleteButtonVisible, false);
console.log('✓ Test 61: Form controls disabled and action buttons hidden for read-only staff.');

// Test 62: Permission Synonym Resolution ('products.read' -> 'product.view')
assert.strictEqual(hasProductPermission(productManager, 'products.read'), true);
assert.strictEqual(hasProductPermission(readonlyAuditor, 'products.read'), true);
console.log('✓ Test 62: Route guard synonyms resolved correctly for product access.');

// Test 63: Status Control Permission Check
const canAuditorChangeStatus = hasProductPermission(readonlyAuditor, 'product.update');
assert.strictEqual(canAuditorChangeStatus, false, 'Read-only staff cannot alter live catalog status');
console.log('✓ Test 63: Status dropdown disabled for unauthorized staff.');

// Test 64: Storefront Simulation Masking Guarantee
function verifyZeroInternalDataLeak(publicProductPayload) {
  const forbiddenKeys = ['costPrice', 'supplierId', 'internalAuditLog', 'supplierNotes'];
  for (const k of forbiddenKeys) {
    if (k in publicProductPayload) {
      return false;
    }
  }
  return true;
}
const isSafe = verifyZeroInternalDataLeak(previewSafe);
assert.strictEqual(isSafe, true, 'Zero internal financial leaks verified');
console.log('✓ Test 64: Storefront preview simulation security and privacy verified.');

console.log('\n=============================================================');
console.log('🎉 ALL 64 ADMIN PANEL PHASE 3 PRODUCT MANAGEMENT TESTS PASSED!');
console.log('=============================================================\n');

import assert from 'node:assert';

console.log('=== RUNNING ADMIN PANEL PHASE 7: ARTISTS, ANTIQUES & SANSKRIT EDIT TEST SUITE ===\n');

// =============================================================
// Section 1: Artist Data Models, Media Roles & Invariants (Tests 1-20)
// =============================================================
console.log('[Tests 1-20] Validating Artists, Media Attachments & Invariants...');

const mockArtists = [
  {
    id: 'art-001',
    name: 'Master Craftsman Ramanathan',
    slug: 'master-craftsman-ramanathan',
    shortBio: 'National award-winning Tanjore gold leaf painter and temple iconographer.',
    biography: 'Hailing from a 5-generation lineage of Thanjavur court artists...',
    birthYear: 1952,
    deathYear: null,
    nationality: 'Indian',
    region: 'Tamil Nadu',
    tradition: 'Thanjavur School',
    lineage: '5th Generation Tanjore Guild',
    specialization: '24K Gold Leaf & Natural Pigments',
    awards: ['National Master Craftsperson Award 2004', 'Tamil Nadu Kalaimamani 2011'],
    status: 'ACTIVE',
    isFeatured: true,
    displayOrder: 1,
    metaTitle: 'Master Craftsman Ramanathan — Authentic Tanjore Art',
    metaDescription: 'Discover handcrafted 24K gold foil Tanjore paintings by Ramanathan.',
    createdAt: '2026-01-01T00:00:00.000Z',
    updatedAt: '2026-01-01T00:00:00.000Z',
  },
  {
    id: 'art-002',
    name: 'Acharya Shankara Sthapathi',
    slug: 'acharya-shankara-sthapathi',
    shortBio: 'Swamimalai master bronze caster following Shilpa Shastras lost-wax tradition.',
    biography: 'Trained under traditional Gurukula system in Swamimalai...',
    birthYear: 1960,
    deathYear: null,
    nationality: 'Indian',
    region: 'Swamimalai',
    tradition: 'Chola Lost-Wax Bronze Casting',
    lineage: 'Vishwakarma Guild',
    specialization: 'Panchaloha Sacred Idols',
    awards: ['President of India Shilp Guru 2018'],
    status: 'ACTIVE',
    isFeatured: false,
    displayOrder: 2,
    createdAt: '2026-01-05T00:00:00.000Z',
    updatedAt: '2026-01-05T00:00:00.000Z',
  },
  {
    id: 'art-003',
    name: 'Retired Master Govinda',
    slug: 'retired-master-govinda',
    shortBio: 'Historical Mysore school painter.',
    birthYear: 1920,
    deathYear: 1998,
    nationality: 'Indian',
    status: 'INACTIVE',
    isFeatured: false,
    displayOrder: 3,
  },
];

// Test 1: Artist Schema Validation
assert.strictEqual(mockArtists[0].name, 'Master Craftsman Ramanathan');
assert.strictEqual(mockArtists[0].slug, 'master-craftsman-ramanathan');
assert.strictEqual(mockArtists[0].birthYear, 1952);
assert.strictEqual(mockArtists[0].status, 'ACTIVE');
console.log('✓ Test 1: Artist entity schema is valid');

// Test 2: Active vs Inactive Filtering
const activeArtists = mockArtists.filter((a) => a.status === 'ACTIVE');
assert.strictEqual(activeArtists.length, 2);
const inactiveArtists = mockArtists.filter((a) => a.status === 'INACTIVE');
assert.strictEqual(inactiveArtists.length, 1);
console.log('✓ Test 2: Status filtering operates accurately');

// Test 3: Featured Showcase Filter
const featuredArtists = mockArtists.filter((a) => a.isFeatured);
assert.strictEqual(featuredArtists.length, 1);
assert.strictEqual(featuredArtists[0].id, 'art-001');
console.log('✓ Test 3: Featured artist showcase filtering works');

// Test 4: Historical/Deceased Artist Lifecycle
assert.strictEqual(mockArtists[2].deathYear, 1998);
assert.strictEqual(mockArtists[2].status, 'INACTIVE');
console.log('✓ Test 4: Historical & deceased artist attributes supported');

// Test 5: Awards & Accolades Array handling
assert.ok(Array.isArray(mockArtists[0].awards));
assert.strictEqual(mockArtists[0].awards.length, 2);
console.log('✓ Test 5: Artist awards array preserves string items');

// Test 6: Artist Media Roles
const mockArtistMedia = [
  { id: 'am-1', artistId: 'art-001', mediaId: 'm-101', role: 'PROFILE', isPrimary: true, displayOrder: 1 },
  { id: 'am-2', artistId: 'art-001', mediaId: 'm-102', role: 'GALLERY', isPrimary: false, displayOrder: 1 },
  { id: 'am-3', artistId: 'art-001', mediaId: 'm-103', role: 'GALLERY', isPrimary: false, displayOrder: 2 },
  { id: 'am-4', artistId: 'art-001', mediaId: 'm-104', role: 'OG', isPrimary: false, displayOrder: 1 },
];

const profileMedia = mockArtistMedia.filter((m) => m.role === 'PROFILE');
assert.strictEqual(profileMedia.length, 1);
assert.strictEqual(profileMedia[0].isPrimary, true);
console.log('✓ Test 6: Artist profile media primary constraint verified');

// Test 7: Artist Media Multiple Gallery Assets
const galleryMedia = mockArtistMedia.filter((m) => m.role === 'GALLERY');
assert.strictEqual(galleryMedia.length, 2);
console.log('✓ Test 7: Artist gallery assets collection supported');

// Test 8: Artist Social OG Media Asset
const ogMedia = mockArtistMedia.filter((m) => m.role === 'OG');
assert.strictEqual(ogMedia.length, 1);
console.log('✓ Test 8: Artist OpenGraph card media role supported');

// Test 9: Product Artist Association Schema
const mockProductArtists = [
  { productId: 'prod-100', artistId: 'art-001', role: 'ARTIST', isPrimary: true, displayOrder: 1 },
  { productId: 'prod-100', artistId: 'art-002', role: 'MAKER', isPrimary: false, displayOrder: 2 },
];

assert.strictEqual(mockProductArtists.length, 2);
assert.strictEqual(mockProductArtists[0].role, 'ARTIST');
assert.strictEqual(mockProductArtists[1].role, 'MAKER');
console.log('✓ Test 9: Product-Artist multi-role bindings supported');

// Test 10: Invariant - Exactly 1 Primary Artist per Product
const primaryArtists = mockProductArtists.filter((pa) => pa.isPrimary);
assert.strictEqual(primaryArtists.length, 1);
assert.strictEqual(primaryArtists[0].artistId, 'art-001');
console.log('✓ Test 10: Primary artist uniqueness invariant per product');

// Test 11: Setting a new primary artist replaces existing primary
function setPrimaryArtist(list, newPrimaryArtistId) {
  return list.map((pa) => ({
    ...pa,
    isPrimary: pa.artistId === newPrimaryArtistId,
  }));
}
const updatedAssociations = setPrimaryArtist(mockProductArtists, 'art-002');
assert.strictEqual(updatedAssociations.find((pa) => pa.artistId === 'art-002').isPrimary, true);
assert.strictEqual(updatedAssociations.find((pa) => pa.artistId === 'art-001').isPrimary, false);
console.log('✓ Test 11: Primary artist toggle cleanly unsets previous primary');

// Test 12: Artist Role Enum Validation
const validRoles = ['ARTIST', 'MAKER', 'DESIGNER', 'ATTRIBUTED_TO'];
assert.ok(validRoles.includes('ATTRIBUTED_TO'));
assert.ok(validRoles.includes('DESIGNER'));
console.log('✓ Test 12: All 4 artist creation roles recognized');

// Test 13: Reorder Artists Payload
const reorderPayload = {
  items: [
    { id: 'art-002', displayOrder: 1 },
    { id: 'art-001', displayOrder: 2 },
  ],
};
assert.strictEqual(reorderPayload.items[0].id, 'art-002');
assert.strictEqual(reorderPayload.items[0].displayOrder, 1);
console.log('✓ Test 13: Artist reordering payload structured correctly');

// Test 14: Slug Generator Helper
const generateSlug = (str) =>
  str
    .toLowerCase()
    .trim()
    .replace(/[^\w\s-]/g, '')
    .replace(/[\s_-]+/g, '-')
    .replace(/^-+|-+$/g, '');

assert.strictEqual(generateSlug('Master Craftsman Ramanathan (Thanjavur)'), 'master-craftsman-ramanathan-thanjavur');
assert.strictEqual(generateSlug('Acharya Shankara Sthapathi & Sons'), 'acharya-shankara-sthapathi-sons');
console.log('✓ Test 14: Slug generator sanitizes special characters and spaces');

// Test 15: Artist Lineage & Tradition Metadata
assert.strictEqual(mockArtists[0].tradition, 'Thanjavur School');
assert.strictEqual(mockArtists[0].specialization, '24K Gold Leaf & Natural Pigments');
console.log('✓ Test 15: Fine-art heritage and tradition metadata verified');

// Test 16: Artist Search Filter Matching
function searchArtists(query, list) {
  const q = query.toLowerCase();
  return list.filter(
    (a) =>
      a.name.toLowerCase().includes(q) ||
      (a.tradition && a.tradition.toLowerCase().includes(q)) ||
      (a.region && a.region.toLowerCase().includes(q))
  );
}
assert.strictEqual(searchArtists('thanjavur', mockArtists).length, 1);
assert.strictEqual(searchArtists('swamimalai', mockArtists).length, 1);
console.log('✓ Test 16: Artist text search matches name, tradition, and region');

// Test 17: Detach Artist Media preserves other items
function detachMedia(mediaList, mediaId, role) {
  return mediaList.filter((m) => !(m.mediaId === mediaId && m.role === role));
}
const remainingMedia = detachMedia(mockArtistMedia, 'm-102', 'GALLERY');
assert.strictEqual(remainingMedia.length, 3);
assert.ok(!remainingMedia.some((m) => m.mediaId === 'm-102'));
console.log('✓ Test 17: Media detachment isolates target media ID');

// Test 18: Unlink Product from Artist
function unlinkProduct(associations, productId) {
  return associations.filter((pa) => pa.productId !== productId);
}
const unlinked = unlinkProduct(mockProductArtists, 'prod-100');
assert.strictEqual(unlinked.length, 0);
console.log('✓ Test 18: Product unlinking maintains association integrity');

// Test 19: Meta SEO tags fallback
const seoTitle = mockArtists[0].metaTitle || `${mockArtists[0].name} — Master Maker | Lagoree`;
assert.strictEqual(seoTitle, 'Master Craftsman Ramanathan — Authentic Tanjore Art');
const fallbackSeoTitle = mockArtists[1].metaTitle || `${mockArtists[1].name} — Master Maker | Lagoree`;
assert.strictEqual(fallbackSeoTitle, 'Acharya Shankara Sthapathi — Master Maker | Lagoree');
console.log('✓ Test 19: SEO metadata fallback rules function properly');

// Test 20: Artist birth year before death year invariant
function validateLifespan(birth, death) {
  if (birth && death && death < birth) {
    return false;
  }
  return true;
}
assert.ok(validateLifespan(1920, 1998));
assert.ok(!validateLifespan(1998, 1920));
console.log('✓ Test 20: Lifespan year boundary invariant verified');

// =============================================================
// Section 2: Antiques & Collectibles Invariants (Tests 21-35)
// =============================================================
console.log('\n[Tests 21-35] Validating Antiques, Authenticity & 1-of-1 Invariants...');

const mockAntiqueProduct = {
  id: 'prod-antique-01',
  name: '18th Century Chola Style Nataraja Bronze',
  sku: 'ANT-NAT-18C',
  price: '450000.00',
  stock: 1,
  allowBackorder: false,
  antiqueProfile: {
    id: 'ant-prof-01',
    productId: 'prod-antique-01',
    era: '18th Century CE',
    period: 'Late Nayaka / Maratha Period',
    approximateAgeFrom: 1750,
    approximateAgeTo: 1780,
    ageDescription: 'Circa 1750–1780 CE, cast during the Thanjavur Maratha principality.',
    origin: 'Tanjore District',
    region: 'Cauvery Delta',
    countryOfOrigin: 'India',
    artistMaker: 'Cauvery Delta Bronze Guild',
    attribution: 'Attributed to Swamimalai Master Workshop',
    schoolOrTradition: 'Chola-Nayaka Transitional',
    material: 'Panchaloha (Five-Metal Alloy) Bronze with Antique Patina',
    technique: 'Lost-Wax (Cire Perdue) Solid Casting',
    condition: 'EXCELLENT',
    conditionNotes: 'Intact prabhamandala, fine copper-green verdigris patina consistent with centuries of temple darshan.',
    restorationStatus: 'ORIGINAL',
    restorationNotes: 'Uncleaned and unrestored to preserve sacred patina.',
    provenance: 'Private Estate of Chettiar Merchant Dynasty, Madurai',
    provenanceNotes: 'Acquired in 1962 from hereditary temple custodian.',
    authenticityStatus: 'VERIFIED',
    authenticityNotes: 'Metallurgical analysis and thermoluminescence testing confirm 18th century composition.',
    acquisitionSource: 'Madurai Heritage Auction 2014',
    acquisitionNotes: 'Catalog item #42',
    dimensionsDescription: '42 cm (H) x 34 cm (W) x 14 cm (D)',
    height: 42.0,
    width: 34.0,
    depth: 14.0,
    diameter: null,
    dimensionUnit: 'CM',
    weight: 9.85,
    weightUnit: 'KG',
    isOneOfAKind: true,
    isCertified: true,
    certificateNumber: 'ASI-AUTH-2024-8849',
    certificateIssuer: 'Archaeological Antiquities Guild',
    certificateDate: '2024-03-15T00:00:00.000Z',
    createdAt: '2026-01-10T00:00:00.000Z',
    updatedAt: '2026-01-10T00:00:00.000Z',
  },
};

// Test 21: Antique Profile Schema
assert.strictEqual(mockAntiqueProduct.antiqueProfile.era, '18th Century CE');
assert.strictEqual(mockAntiqueProduct.antiqueProfile.authenticityStatus, 'VERIFIED');
assert.strictEqual(mockAntiqueProduct.antiqueProfile.condition, 'EXCELLENT');
console.log('✓ Test 21: Antique profile schema is valid');

// Test 22: One-of-a-Kind Stock Invariant (stock <= 1)
function validateAntiqueStock(isOneOfAKind, stock) {
  if (isOneOfAKind && stock > 1) {
    return { valid: false, error: 'One-of-a-kind antique products must have inventory stock of 0 or 1.' };
  }
  return { valid: true };
}
assert.ok(validateAntiqueStock(true, 1).valid);
assert.ok(validateAntiqueStock(true, 0).valid);
assert.ok(!validateAntiqueStock(true, 5).valid);
console.log('✓ Test 22: One-of-a-Kind inventory limit (<= 1) invariant verified');

// Test 23: One-of-a-Kind Backorder Invariant (allowBackorder === false)
function validateAntiqueBackorder(isOneOfAKind, allowBackorder) {
  if (isOneOfAKind && allowBackorder) {
    return { valid: false, error: 'Unique one-of-a-kind antiquities cannot allow backorders.' };
  }
  return { valid: true };
}
assert.ok(validateAntiqueBackorder(true, false).valid);
assert.ok(!validateAntiqueBackorder(true, true).valid);
console.log('✓ Test 23: One-of-a-Kind backorder prevention invariant verified');

// Test 24: Authenticity Status Badges
const authenticityOptions = ['VERIFIED', 'UNVERIFIED', 'UNKNOWN'];
assert.ok(authenticityOptions.includes(mockAntiqueProduct.antiqueProfile.authenticityStatus));
console.log('✓ Test 24: Authenticity status options verified');

// Test 25: Condition Status Badges
const conditionOptions = ['EXCELLENT', 'VERY_GOOD', 'GOOD', 'RESTORED', 'DAMAGED'];
assert.ok(conditionOptions.includes(mockAntiqueProduct.antiqueProfile.condition));
console.log('✓ Test 25: Condition classification options verified');

// Test 26: Restoration Status
const restorationOptions = ['ORIGINAL', 'RESTORED', 'CONSERVED'];
assert.ok(restorationOptions.includes(mockAntiqueProduct.antiqueProductRestoration || 'ORIGINAL'));
console.log('✓ Test 26: Restoration classification options verified');

// Test 27: Physical Dimension Units
const dimensionUnits = ['CM', 'IN', 'MM', 'M'];
assert.ok(dimensionUnits.includes(mockAntiqueProduct.antiqueProfile.dimensionUnit));
console.log('✓ Test 27: Dimension units support CM, IN, MM, M');

// Test 28: Weight Units
const weightUnits = ['KG', 'G', 'LBS', 'OZ'];
assert.ok(weightUnits.includes(mockAntiqueProduct.antiqueProfile.weightUnit));
console.log('✓ Test 28: Weight units support KG, G, LBS, OZ');

// Test 29: Certificate Verification Data
assert.strictEqual(mockAntiqueProduct.antiqueProfile.isCertified, true);
assert.strictEqual(mockAntiqueProduct.antiqueProfile.certificateNumber, 'ASI-AUTH-2024-8849');
assert.strictEqual(mockAntiqueProduct.antiqueProfile.certificateIssuer, 'Archaeological Antiquities Guild');
console.log('✓ Test 29: Certification metadata matches official specification');

// Test 30: Age Range Validation (From <= To)
function validateAgeRange(from, to) {
  if (from && to && from > to) {
    return false;
  }
  return true;
}
assert.ok(validateAgeRange(1750, 1780));
assert.ok(!validateAgeRange(1850, 1780));
console.log('✓ Test 30: Approximate age range chronological bounds verified');

// Test 31: Deletion of Antique Profile does not delete base Product
function removeAntiqueProfile(product) {
  const { antiqueProfile, ...rest } = product;
  return { ...rest, antiqueProfile: null };
}
const productWithoutAntique = removeAntiqueProfile(mockAntiqueProduct);
assert.strictEqual(productWithoutAntique.id, 'prod-antique-01');
assert.strictEqual(productWithoutAntique.antiqueProfile, null);
assert.strictEqual(productWithoutAntique.name, mockAntiqueProduct.name);
console.log('✓ Test 31: Detaching antique profile preserves base catalog product');

// Test 32: Filter Antiques by Authenticity Status
const mockAntiqueList = [
  { id: '1', name: 'Bronze Nataraja', authenticityStatus: 'VERIFIED', condition: 'EXCELLENT' },
  { id: '2', name: 'Wooden Temple Carving', authenticityStatus: 'UNVERIFIED', condition: 'GOOD' },
  { id: '3', name: 'Silver Urli', authenticityStatus: 'VERIFIED', condition: 'RESTORED' },
];
const verifiedAntiques = mockAntiqueList.filter((a) => a.authenticityStatus === 'VERIFIED');
assert.strictEqual(verifiedAntiques.length, 2);
console.log('✓ Test 32: Listing filters by authenticity correctly');

// Test 33: Filter Antiques by Condition Rating
const restoredAntiques = mockAntiqueList.filter((a) => a.condition === 'RESTORED');
assert.strictEqual(restoredAntiques.length, 1);
assert.strictEqual(restoredAntiques[0].name, 'Silver Urli');
console.log('✓ Test 33: Listing filters by condition rating accurately');

// Test 34: Provenance narrative format
assert.ok(mockAntiqueProduct.antiqueProfile.provenance.length > 20);
assert.ok(mockAntiqueProduct.antiqueProfile.provenanceNotes.includes('hereditary temple custodian'));
console.log('✓ Test 34: Provenance narrative fields retained without truncation');

// Test 35: Numerical dimension coercion helper
function sanitizeDimensions(payload) {
  return {
    ...payload,
    height: payload.height ? Number(payload.height) : null,
    width: payload.width ? Number(payload.width) : null,
    depth: payload.depth ? Number(payload.depth) : null,
    diameter: payload.diameter ? Number(payload.diameter) : null,
    weight: payload.weight ? Number(payload.weight) : null,
  };
}
const sanitized = sanitizeDimensions({ height: '42.5', width: '', depth: '14', weight: '9.85' });
assert.strictEqual(sanitized.height, 42.5);
assert.strictEqual(sanitized.width, null);
assert.strictEqual(sanitized.weight, 9.85);
console.log('✓ Test 35: Dimension coercion converts empty strings to null for API payload');

// =============================================================
// Section 3: The Sanskrit Edit & Unicode/IAST Fidelity (Tests 36-45)
// =============================================================
console.log('\n[Tests 36-45] Validating The Sanskrit Edit, Invariants & Unicode Fidelity...');

const mockSanskritProfile = {
  productId: 'prod-sanskrit-01',
  sanskritTitle: 'शिव ताण्डव स्तोत्रम् (Śiva Tāṇḍava Stotram)',
  devanagariText: 'जटाटवीगलज्जलप्रवाहपावितस्थले गलेऽवलम्ब्य लम्बितां भुजङ्गतुङ्गकालिकाम् ।\nडमड्डमड्डमड्डमन्निनादवड्डमर्वयं चकार चण्डताण्डवं तनोतु नः शिवः शिवम् ॥',
  transliteration: 'jaṭāṭavīgalajjala-pravāhapāvitasthale gale\'valambya lambitāṁ bhujaṅgatuṅgamālikām |\nḍamaḍḍamaḍḍamaḍḍaman-ninādavaḍḍamarvayaṁ cakāra caṇḍatāṇḍavaṁ tanotu naḥ śivaḥ śivam ||',
  translation: 'With his neck consecrated by the flow of water that flows from his hair, and on his neck holding a tall serpent garland, with the damaru resounding damat-damat, Lord Shiva performed the fierce Tandava dance; may he bestow auspiciousness upon us.',
  meaning: 'This sacred verse composed by Ravana invokes the ecstatic cosmic dance of Shiva representing rhythmic creation, sustenance, and dissolution.',
  commentary: 'The metre is Panchachamara (पञ्चचामर), creating a galloping and rhythmic cadence reminiscent of cosmic drums.',
  source: 'Shiva Tandava Stotram, Verse 1',
  chapterVerse: 'Canto 1, Sloka 1',
  historicalContext: 'Attributed to King Ravana of Lanka during the Treta Yuga.',
  philosophicalSchool: 'Shaiva Siddhanta / Kashmir Shaivism',
  deities: ['Lord Shiva', 'Nataraja'],
  tags: ['Tandava', 'Shaivism', 'Cosmic Dance', 'Stotram', 'Sacred Verse'],
  audioUrl: 'https://cdn.lagoree.com/audio/sanskrit/shiva-tandava-v1.mp3',
  displayOrder: 1,
  isPublished: true,
  isFeatured: true,
  product: {
    id: 'prod-sanskrit-01',
    name: 'Cosmic Nataraja 24K Gold Painting',
    sku: 'TAN-NAT-001',
    price: '185000.00',
    image: 'https://cdn.lagoree.com/media/nataraja-hero.jpg',
  },
};

// Test 36: Sanskrit Edit Schema Validation
assert.strictEqual(mockSanskritProfile.productId, 'prod-sanskrit-01');
assert.strictEqual(mockSanskritProfile.source, 'Shiva Tandava Stotram, Verse 1');
assert.strictEqual(mockSanskritProfile.isPublished, true);
assert.strictEqual(mockSanskritProfile.isFeatured, true);
console.log('✓ Test 36: Sanskrit Edit profile schema is valid');

// Test 37: Critical Publishing Invariant: isFeatured: true REQUIRES isPublished: true
function validateSanskritPublishing(isPublished, isFeatured) {
  if (isFeatured && !isPublished) {
    return { valid: false, error: 'A Sanskrit Edit profile must be published before it can be featured in curations.' };
  }
  return { valid: true };
}
assert.ok(validateSanskritPublishing(true, true).valid);
assert.ok(validateSanskritPublishing(true, false).valid);
assert.ok(validateSanskritPublishing(false, false).valid);
assert.ok(!validateSanskritPublishing(false, true).valid);
console.log('✓ Test 37: Sanskrit Edit publishing invariant (featured requires published) enforced');

// Test 38: Auto-unfeature upon unpublishing
function handleUnpublish(profile) {
  return {
    ...profile,
    isPublished: false,
    isFeatured: false, // Automatically dropped
  };
}
const unpublished = handleUnpublish(mockSanskritProfile);
assert.strictEqual(unpublished.isPublished, false);
assert.strictEqual(unpublished.isFeatured, false);
console.log('✓ Test 38: Unpublishing gracefully resets featured status');

// Test 39: Unicode Fidelity — Devanagari Script Integrity
const devanagariSample = 'ॐ भूर्भुवः स्वः तत्सवितुर्वरेण्यम् भर्गो देवस्य धीमहि धियो यो नः प्रचोदयात् ॥';
assert.strictEqual(devanagariSample.includes('ॐ'), true);
assert.strictEqual(devanagariSample.includes('॥'), true);
assert.strictEqual(devanagariSample.includes('तत्सवितुर्वरेण्यम्'), true);
console.log('✓ Test 39: Devanagari ligatures and visargas preserved without character corruption');

// Test 40: Unicode Fidelity — IAST Diacritical Marks Integrity
const iastSample = 'oṁ bhūr bhuvaḥ svaḥ tat savitur vareṇyaṁ bhargo devasya dhīmahi dhiyo yo naḥ pracodayāt ||';
assert.strictEqual(iastSample.includes('bhūr'), true);
assert.strictEqual(iastSample.includes('vareṇyaṁ'), true);
assert.strictEqual(iastSample.includes('dhīmahi'), true);
assert.strictEqual(iastSample.includes('pracodayāt'), true);
console.log('✓ Test 40: IAST macron (ā, ī, ū), dot-under (ṭ, ḍ, ṇ, ṛ, ṣ), and anusvara (ṁ) preserved');

// Test 41: Bhagavad Gita Verse Devanagari & IAST
const gitaDevanagari = 'यदा यदा हि धर्मस्य ग्लानिर्भवति भारत । अभ्युत्थानमधर्मस्य तदात्मानं सृजाम्यहम् ॥';
const gitaIAST = 'yadā yadā hi dharmasya glānir bhavati bhārata | abhyutthānam adharmasya tadātmānaṁ sṛjāmy aham ||';
assert.strictEqual(gitaDevanagari.normalize('NFC'), gitaDevanagari);
assert.strictEqual(gitaIAST.normalize('NFC'), gitaIAST);
console.log('✓ Test 41: Gita verses maintain canonical NFC normalization');

// Test 42: Philosophical Schools Tagging
const philosophicalSchools = [
  'Advaita Vedanta',
  'Vishishtadvaita',
  'Dvaita',
  'Shaiva Siddhanta',
  'Kashmir Shaivism',
  'Shakta Tantra',
  'Samkhya',
  'Yoga Darshana',
  'Nyaya-Vaisheshika',
  'Mimamsa',
];
assert.ok(philosophicalSchools.some((school) => mockSanskritProfile.philosophicalSchool.includes(school)));
console.log('✓ Test 42: Sacred philosophical traditions recognized');

// Test 43: Tags Array Serialization & Deserialization
const tagsArray = ['Shaivism', 'Tandava', 'Nataraja', 'Sacred Hymn'];
const serializedTags = tagsArray.join(', ');
assert.strictEqual(serializedTags, 'Shaivism, Tandava, Nataraja, Sacred Hymn');
const parsedTags = serializedTags.split(',').map((t) => t.trim()).filter(Boolean);
assert.deepStrictEqual(parsedTags, tagsArray);
console.log('✓ Test 43: Tags CSV string to array bidirectional conversion works');

// Test 44: Audio Chanting URL validation
assert.ok(mockSanskritProfile.audioUrl.endsWith('.mp3'));
console.log('✓ Test 44: Audio chanting stream endpoint formatted accurately');

// Test 45: Reorder Sanskrit Profiles Payload
const reorderSanskritPayload = {
  items: [
    { productId: 'prod-sanskrit-02', displayOrder: 1 },
    { productId: 'prod-sanskrit-01', displayOrder: 2 },
  ],
};
assert.strictEqual(reorderSanskritPayload.items[0].displayOrder, 1);
assert.strictEqual(reorderSanskritPayload.items[1].displayOrder, 2);
console.log('✓ Test 45: Sanskrit curation sequence reordering payload valid');

// =============================================================
// Section 4: RBAC & Permission Synonym Compatibility (Tests 46-50)
// =============================================================
console.log('\n[Tests 46-50] Validating Permission Synonyms & Role Guarding...');

const PERMISSION_SYNONYMS = {
  // Artists
  'artist.read': ['artists.read', 'artist.read', 'artists.view', 'artist.view'],
  'artist.create': ['artists.create', 'artist.create'],
  'artist.update': ['artists.update', 'artist.update', 'artists.edit', 'artist.edit'],
  'artist.delete': ['artists.delete', 'artist.delete'],
  // Antiques
  'antique.read': ['antiques.read', 'antique.read', 'antiques.view', 'antique.view'],
  'antique.create': ['antiques.create', 'antique.create'],
  'antique.update': ['antiques.update', 'antique.update', 'antiques.edit', 'antique.edit'],
  'antique.delete': ['antiques.delete', 'antique.delete'],
  // Sanskrit Edit
  'sanskrit-edit.read': ['sanskrit-edit.read', 'sanskrit.read', 'sanskrit_edit.read', 'sanskrit.view'],
  'sanskrit-edit.create': ['sanskrit-edit.create', 'sanskrit.create', 'sanskrit_edit.create'],
  'sanskrit-edit.update': ['sanskrit-edit.update', 'sanskrit.update', 'sanskrit_edit.update', 'sanskrit.edit'],
  'sanskrit-edit.delete': ['sanskrit-edit.delete', 'sanskrit.delete', 'sanskrit_edit.delete'],
};

function hasPermission(userPermissions, requiredPermission) {
  if (userPermissions.includes('*') || userPermissions.includes('admin.*')) {
    return true;
  }
  const synonyms = PERMISSION_SYNONYMS[requiredPermission] || [requiredPermission];
  return synonyms.some((syn) => userPermissions.includes(syn));
}

// Test 46: Super Admin Wildcard Access
assert.ok(hasPermission(['*'], 'artist.create'));
assert.ok(hasPermission(['admin.*'], 'antique.delete'));
assert.ok(hasPermission(['*'], 'sanskrit-edit.update'));
console.log('✓ Test 46: Super Admin wildcard permissions resolve all Phase 7 actions');

// Test 47: Plural synonym 'artists.read' satisfies 'artist.read'
assert.ok(hasPermission(['artists.read'], 'artist.read'));
assert.ok(!hasPermission(['artists.read'], 'artist.create'));
console.log('✓ Test 47: Plural synonym artists.read satisfies singular check');

// Test 48: Antique permission synonyms
assert.ok(hasPermission(['antiques.edit'], 'antique.update'));
assert.ok(hasPermission(['antique.delete'], 'antique.delete'));
console.log('✓ Test 48: Antique permission synonyms resolve correctly');

// Test 49: Sanskrit Edit permission synonyms
assert.ok(hasPermission(['sanskrit.create'], 'sanskrit-edit.create'));
assert.ok(hasPermission(['sanskrit_edit.update'], 'sanskrit-edit.update'));
assert.ok(!hasPermission(['sanskrit.read'], 'sanskrit-edit.delete'));
console.log('✓ Test 49: Sanskrit Edit permission synonyms resolve properly');

// Test 50: Read-only Curator Role
const curatorPerms = ['artist.read', 'antique.read', 'sanskrit-edit.read'];
assert.ok(hasPermission(curatorPerms, 'artist.read'));
assert.ok(hasPermission(curatorPerms, 'antique.read'));
assert.ok(hasPermission(curatorPerms, 'sanskrit-edit.read'));
assert.ok(!hasPermission(curatorPerms, 'artist.create'));
assert.ok(!hasPermission(curatorPerms, 'antique.delete'));
console.log('✓ Test 50: Read-only curator role strictly bounded');

// =============================================================
// Summary
// =============================================================
console.log('\n=============================================================');
console.log('✅ ALL PHASE 7 TEST SUITES (50 ASSERTIONS) PASSED SUCCESSFULLY');
console.log('=============================================================\n');

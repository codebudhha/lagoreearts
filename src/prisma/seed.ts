import { prisma } from '../database/prisma.ts';
import { hashPassword } from '../security/password.ts';

export const PERMISSIONS_DATA = [
  // ADMIN
  { name: 'View Administrators', slug: 'admin.view', module: 'ADMIN', description: 'View administrative users list and details' },
  { name: 'Create Administrator', slug: 'admin.create', module: 'ADMIN', description: 'Create new administrative accounts' },
  { name: 'Update Administrator', slug: 'admin.update', module: 'ADMIN', description: 'Update admin accounts and status' },
  { name: 'Delete Administrator', slug: 'admin.delete', module: 'ADMIN', description: 'Remove admin accounts' },

  // CATALOGUE - CATEGORIES
  { name: 'View Categories', slug: 'category.view', module: 'CATALOGUE', description: 'View artwork categories' },
  { name: 'Create Category', slug: 'category.create', module: 'CATALOGUE', description: 'Create new artwork categories' },
  { name: 'Update Category', slug: 'category.update', module: 'CATALOGUE', description: 'Modify artwork categories' },
  { name: 'Delete Category', slug: 'category.delete', module: 'CATALOGUE', description: 'Delete artwork categories' },

  // CATALOGUE - ATTRIBUTES & FILTERS (MODULE 4)
  { name: 'View Attributes', slug: 'attribute.view', module: 'ATTRIBUTES', description: 'View product and category filter attributes' },
  { name: 'Create Attribute', slug: 'attribute.create', module: 'ATTRIBUTES', description: 'Create new product attributes' },
  { name: 'Update Attribute', slug: 'attribute.update', module: 'ATTRIBUTES', description: 'Modify attributes and filter flags' },
  { name: 'Delete Attribute', slug: 'attribute.delete', module: 'ATTRIBUTES', description: 'Delete attributes without active bindings' },

  { name: 'View Attribute Values', slug: 'attribute-value.view', module: 'ATTRIBUTES', description: 'View attribute options and values' },
  { name: 'Create Attribute Value', slug: 'attribute-value.create', module: 'ATTRIBUTES', description: 'Add new options to attributes' },
  { name: 'Update Attribute Value', slug: 'attribute-value.update', module: 'ATTRIBUTES', description: 'Modify attribute value metadata' },
  { name: 'Delete Attribute Value', slug: 'attribute-value.delete', module: 'ATTRIBUTES', description: 'Delete unused attribute values' },

  // CATALOGUE - COLLECTIONS
  { name: 'View Collections', slug: 'collection.view', module: 'CATALOGUE', description: 'View curated art collections' },
  { name: 'Create Collection', slug: 'collection.create', module: 'CATALOGUE', description: 'Curate new art collections' },
  { name: 'Update Collection', slug: 'collection.update', module: 'CATALOGUE', description: 'Modify art collections' },
  { name: 'Delete Collection', slug: 'collection.delete', module: 'CATALOGUE', description: 'Delete art collections' },

  // CATALOGUE - PRODUCTS
  { name: 'View Products', slug: 'product.view', module: 'CATALOGUE', description: 'View artworks in catalog' },
  { name: 'Create Product', slug: 'product.create', module: 'CATALOGUE', description: 'Add new artworks to catalog' },
  { name: 'Update Product', slug: 'product.update', module: 'CATALOGUE', description: 'Modify artworks in catalog' },
  { name: 'Delete Product', slug: 'product.delete', module: 'CATALOGUE', description: 'Remove artworks from catalog' },

  // VARIANTS & FRAMING
  { name: 'View Variants', slug: 'variant.view', module: 'VARIANTS', description: 'View framing and size variants' },
  { name: 'Create Variant', slug: 'variant.create', module: 'VARIANTS', description: 'Create framing and size variants' },
  { name: 'Update Variant', slug: 'variant.update', module: 'VARIANTS', description: 'Modify framing and size variants' },
  { name: 'Delete Variant', slug: 'variant.delete', module: 'VARIANTS', description: 'Delete framing and size variants' },
  { name: 'View Options', slug: 'product-option.view', module: 'VARIANTS', description: 'View product options and values' },
  { name: 'Create Option', slug: 'product-option.create', module: 'VARIANTS', description: 'Create product options and values' },
  { name: 'Update Option', slug: 'product-option.update', module: 'VARIANTS', description: 'Modify product options and values' },
  { name: 'Delete Option', slug: 'product-option.delete', module: 'VARIANTS', description: 'Delete product options and values' },

  // MEDIA & FOLDERS
  { name: 'View Media Assets', slug: 'media.view', module: 'MEDIA', description: 'View artwork images and digital media' },
  { name: 'Upload Media', slug: 'media.create', module: 'MEDIA', description: 'Upload artwork assets' },
  { name: 'Update Media', slug: 'media.update', module: 'MEDIA', description: 'Modify artwork media metadata' },
  { name: 'Delete Media', slug: 'media.delete', module: 'MEDIA', description: 'Delete artwork media files' },
  { name: 'View Media Folders', slug: 'media-folder.view', module: 'MEDIA', description: 'View media library folders' },
  { name: 'Create Media Folder', slug: 'media-folder.create', module: 'MEDIA', description: 'Create media library folder' },
  { name: 'Update Media Folder', slug: 'media-folder.update', module: 'MEDIA', description: 'Update media library folder' },
  { name: 'Delete Media Folder', slug: 'media-folder.delete', module: 'MEDIA', description: 'Delete media library folder' },

  // ORDERS
  { name: 'View Orders', slug: 'order.view', module: 'ORDERS', description: 'View customer orders and status' },
  { name: 'Update Order', slug: 'order.update', module: 'ORDERS', description: 'Update order status, crate tracking' },

  // CUSTOMERS
  { name: 'View Customers', slug: 'customer.view', module: 'CUSTOMERS', description: 'View patron profiles' },
  { name: 'Update Customer', slug: 'customer.update', module: 'CUSTOMERS', description: 'Update customer status and notes' },

  // CMS
  { name: 'View CMS Content', slug: 'cms.view', module: 'CMS', description: 'View journal, lookbook, and landing content' },
  { name: 'Create CMS Article', slug: 'cms.create', module: 'CMS', description: 'Create curator journal articles' },
  { name: 'Update CMS Content', slug: 'cms.update', module: 'CMS', description: 'Update journal and page content' },
  { name: 'Delete CMS Content', slug: 'cms.delete', module: 'CMS', description: 'Delete articles and lookbooks' },

  // MARKETING & COUPONS
  { name: 'View Marketing', slug: 'marketing.view', module: 'MARKETING', description: 'View coupons and campaign analytics' },
  { name: 'Create Coupon', slug: 'marketing.create', module: 'MARKETING', description: 'Create promotional discounts' },
  { name: 'Update Marketing', slug: 'marketing.update', module: 'MARKETING', description: 'Modify promotional discounts' },
  { name: 'Delete Coupon', slug: 'marketing.delete', module: 'MARKETING', description: 'Delete promotional coupons' },

  // SEO
  { name: 'View SEO Settings', slug: 'seo.view', module: 'SEO', description: 'View meta tags and SEO configs' },
  { name: 'Update SEO Settings', slug: 'seo.update', module: 'SEO', description: 'Modify meta tags and structured data' },

  // ANTIQUES & COLLECTIBLES (MODULE 9)
  { name: 'View Antique Profiles', slug: 'antique.view', module: 'ANTIQUES', description: 'View antique and collectible profiles' },
  { name: 'Create Antique Profile', slug: 'antique.create', module: 'ANTIQUES', description: 'Create antique metadata profile' },
  { name: 'Update Antique Profile', slug: 'antique.update', module: 'ANTIQUES', description: 'Modify antique metadata profile' },
  { name: 'Delete Antique Profile', slug: 'antique.delete', module: 'ANTIQUES', description: 'Delete antique metadata profile' },

  // THE SANSKRIT EDIT (MODULE 10)
  { name: 'View Sanskrit Edit Profiles', slug: 'sanskrit-edit.view', module: 'SANSKRIT_EDIT', description: 'View curated Sanskrit Edit profiles and metadata' },
  { name: 'Create Sanskrit Edit Profile', slug: 'sanskrit-edit.create', module: 'SANSKRIT_EDIT', description: 'Create curated Sanskrit Edit profile' },
  { name: 'Update Sanskrit Edit Profile', slug: 'sanskrit-edit.update', module: 'SANSKRIT_EDIT', description: 'Modify Sanskrit Edit profile and publishing status' },
  { name: 'Delete Sanskrit Edit Profile', slug: 'sanskrit-edit.delete', module: 'SANSKRIT_EDIT', description: 'Delete Sanskrit Edit profile' },

  // ARTISTS & MAKERS (MODULE 11)
  { name: 'View Artists', slug: 'artist.view', module: 'ARTISTS', description: 'View artist and maker profiles' },
  { name: 'Create Artist', slug: 'artist.create', module: 'ARTISTS', description: 'Create artist and maker profile' },
  { name: 'Update Artist', slug: 'artist.update', module: 'ARTISTS', description: 'Modify artist profile and product relationships' },
  { name: 'Delete Artist', slug: 'artist.delete', module: 'ARTISTS', description: 'Delete artist profile' },

  // HOMEPAGE CMS (MODULE 12)
  { name: 'View Homepage CMS', slug: 'homepage.view', module: 'HOMEPAGE', description: 'View homepage CMS structures and sections' },
  { name: 'Create Homepage CMS', slug: 'homepage.create', module: 'HOMEPAGE', description: 'Create homepages and homepage sections' },
  { name: 'Update Homepage CMS', slug: 'homepage.update', module: 'HOMEPAGE', description: 'Modify homepages, reorder sections and section items' },
  { name: 'Delete Homepage CMS', slug: 'homepage.delete', module: 'HOMEPAGE', description: 'Delete draft/archived homepages and sections' },
  { name: 'Publish Homepage CMS', slug: 'homepage.publish', module: 'HOMEPAGE', description: 'Publish and change default active storefront homepage' },

  // JOURNAL / BLOG (MODULE 13)
  { name: 'View Journal Posts', slug: 'journal.view', module: 'JOURNAL', description: 'View editorial journal posts and articles' },
  { name: 'Create Journal Post', slug: 'journal.create', module: 'JOURNAL', description: 'Create draft journal posts and articles' },
  { name: 'Update Journal Post', slug: 'journal.update', module: 'JOURNAL', description: 'Modify journal posts, media, tags, and relations' },
  { name: 'Delete Journal Post', slug: 'journal.delete', module: 'JOURNAL', description: 'Delete journal posts' },
  { name: 'Publish Journal Post', slug: 'journal.publish', module: 'JOURNAL', description: 'Publish or schedule journal posts' },
  { name: 'View Journal Authors', slug: 'journal-author.view', module: 'JOURNAL', description: 'View journal authors' },
  { name: 'Create Journal Author', slug: 'journal-author.create', module: 'JOURNAL', description: 'Create journal author' },
  { name: 'Update Journal Author', slug: 'journal-author.update', module: 'JOURNAL', description: 'Modify journal author' },
  { name: 'Delete Journal Author', slug: 'journal-author.delete', module: 'JOURNAL', description: 'Delete journal author' },
  { name: 'View Journal Categories', slug: 'journal-category.view', module: 'JOURNAL', description: 'View journal categories' },
  { name: 'Create Journal Category', slug: 'journal-category.create', module: 'JOURNAL', description: 'Create journal category' },
  { name: 'Update Journal Category', slug: 'journal-category.update', module: 'JOURNAL', description: 'Modify journal category' },
  { name: 'Delete Journal Category', slug: 'journal-category.delete', module: 'JOURNAL', description: 'Delete journal category' },
  { name: 'View Journal Tags', slug: 'journal-tag.view', module: 'JOURNAL', description: 'View journal tags' },
  { name: 'Create Journal Tag', slug: 'journal-tag.create', module: 'JOURNAL', description: 'Create journal tag' },
  { name: 'Update Journal Tag', slug: 'journal-tag.update', module: 'JOURNAL', description: 'Modify journal tag' },
  { name: 'Delete Journal Tag', slug: 'journal-tag.delete', module: 'JOURNAL', description: 'Delete journal tag' },

  // LOOKBOOK (MODULE 14)
  { name: 'View Lookbooks', slug: 'lookbook.view', module: 'LOOKBOOK', description: 'View lookbooks, editorial sections, and assets' },
  { name: 'Create Lookbook', slug: 'lookbook.create', module: 'LOOKBOOK', description: 'Create lookbooks and sections' },
  { name: 'Update Lookbook', slug: 'lookbook.update', module: 'LOOKBOOK', description: 'Modify lookbooks, reorder sections, attach entities and media' },
  { name: 'Delete Lookbook', slug: 'lookbook.delete', module: 'LOOKBOOK', description: 'Delete lookbooks and sections' },
  { name: 'Publish Lookbook', slug: 'lookbook.publish', module: 'LOOKBOOK', description: 'Publish, unpublish, and archive lookbooks' },

  // NAVIGATION / MENUS (MODULE 15)
  { name: 'View Navigation', slug: 'navigation.view', module: 'NAVIGATION', description: 'View storefront menus, navigation trees, and items' },
  { name: 'Create Navigation', slug: 'navigation.create', module: 'NAVIGATION', description: 'Create navigation structures and menu items' },
  { name: 'Update Navigation', slug: 'navigation.update', module: 'NAVIGATION', description: 'Modify menus, reorder hierarchy, and configure targets' },
  { name: 'Delete Navigation', slug: 'navigation.delete', module: 'NAVIGATION', description: 'Delete navigations and menu items' },
  { name: 'Publish Navigation', slug: 'navigation.publish', module: 'NAVIGATION', description: 'Activate, deactivate, and configure default storefront menus' },

  // CUSTOMER MANAGEMENT (MODULE 16)
  { name: 'View Customers', slug: 'customer.view', module: 'CUSTOMER', description: 'View customer accounts and profiles' },
  { name: 'Create Customer', slug: 'customer.create', module: 'CUSTOMER', description: 'Create customer records' },
  { name: 'Update Customer', slug: 'customer.update', module: 'CUSTOMER', description: 'Modify customer profile and status' },
  { name: 'Delete Customer', slug: 'customer.delete', module: 'CUSTOMER', description: 'Deactivate/delete customer accounts' },
  { name: 'View Customer Addresses', slug: 'customer.address.view', module: 'CUSTOMER', description: 'View customer delivery and billing addresses' },
  { name: 'Update Customer Addresses', slug: 'customer.address.update', module: 'CUSTOMER', description: 'Modify customer address book' },
  { name: 'Update Customer Status', slug: 'customer.status.update', module: 'CUSTOMER', description: 'Suspend or activate customer accounts' },
  { name: 'View Customer Sessions', slug: 'customer.session.view', module: 'CUSTOMER', description: 'Inspect customer active sessions' },
  { name: 'Revoke Customer Sessions', slug: 'customer.session.revoke', module: 'CUSTOMER', description: 'Force-revoke customer sessions' },

  // SETTINGS & ROLES
  { name: 'View Settings & Roles', slug: 'settings.view', module: 'SETTINGS', description: 'View platform settings and roles' },
  { name: 'Update Settings & Roles', slug: 'settings.update', module: 'SETTINGS', description: 'Modify roles, permissions, settings' },

  // AUDIT
  { name: 'View Audit Logs', slug: 'audit.view', module: 'AUDIT', description: 'View administrative security audit logs' }
];

export const ROLES_DATA = [
  {
    name: 'Super Admin',
    slug: 'SUPER_ADMIN',
    description: 'Full executive governance and unrestricted system access across all modules.',
    isSystem: true,
    permissionSlugs: '*' // All permissions
  },
  {
    name: 'Catalogue Manager',
    slug: 'CATALOGUE_MANAGER',
    description: 'Manages artworks, categories, collections, attributes, frame variants, media, and SEO metadata.',
    isSystem: true,
    permissionSlugs: [
      'category.view', 'category.create', 'category.update', 'category.delete',
      'attribute.view', 'attribute.create', 'attribute.update', 'attribute.delete',
      'attribute-value.view', 'attribute-value.create', 'attribute-value.update', 'attribute-value.delete',
      'collection.view', 'collection.create', 'collection.update', 'collection.delete',
      'product.view', 'product.create', 'product.update', 'product.delete',
      'variant.view', 'variant.create', 'variant.update', 'variant.delete',
      'product-option.view', 'product-option.create', 'product-option.update', 'product-option.delete',
      'media.view', 'media.create', 'media.update', 'media.delete',
      'media-folder.view', 'media-folder.create', 'media-folder.update', 'media-folder.delete',
      'antique.view', 'antique.create', 'antique.update', 'antique.delete',
      'sanskrit-edit.view', 'sanskrit-edit.create', 'sanskrit-edit.update', 'sanskrit-edit.delete',
      'artist.view', 'artist.create', 'artist.update', 'artist.delete',
      'homepage.view', 'homepage.create', 'homepage.update',
      'journal.view', 'journal.create', 'journal.update', 'journal.delete',
      'journal-author.view', 'journal-category.view', 'journal-tag.view',
      'lookbook.view', 'lookbook.create', 'lookbook.update',
      'navigation.view', 'navigation.create', 'navigation.update',
      'customer.view',
      'seo.view', 'seo.update'
    ]
  },
  {
    name: 'Content Manager',
    slug: 'CONTENT_MANAGER',
    description: 'Curates journal articles, lookbook stories, media gallery, and collection presentations.',
    isSystem: true,
    permissionSlugs: [
      'category.view',
      'attribute.view',
      'attribute-value.view',
      'collection.view', 'collection.create', 'collection.update',
      'product.view', 'product.create', 'product.update',
      'variant.view', 'variant.create', 'variant.update',
      'product-option.view', 'product-option.create', 'product-option.update',
      'media.view', 'media.create', 'media.update',
      'media-folder.view', 'media-folder.create', 'media-folder.update',
      'antique.view', 'antique.create', 'antique.update',
      'sanskrit-edit.view', 'sanskrit-edit.create', 'sanskrit-edit.update',
      'artist.view', 'artist.create', 'artist.update',
      'homepage.view', 'homepage.create', 'homepage.update', 'homepage.publish',
      'journal.view', 'journal.create', 'journal.update', 'journal.publish',
      'journal-author.view', 'journal-author.create', 'journal-author.update',
      'journal-category.view', 'journal-category.create', 'journal-category.update',
      'journal-tag.view', 'journal-tag.create', 'journal-tag.update',
      'journal.delete', 'journal-author.delete', 'journal-category.delete', 'journal-tag.delete',
      'lookbook.view', 'lookbook.create', 'lookbook.update', 'lookbook.delete', 'lookbook.publish',
      'navigation.view', 'navigation.create', 'navigation.update', 'navigation.delete', 'navigation.publish',
      'customer.view',
      'cms.view', 'cms.create', 'cms.update', 'cms.delete',
      'seo.view', 'seo.update'
    ]
  },
  {
    name: 'Order Manager',
    slug: 'ORDER_MANAGER',
    description: 'Manages patron acquisitions, atelier framing tracking, crating, and patron concierge.',
    isSystem: true,
    permissionSlugs: [
      'order.view', 'order.update',
      'customer.view', 'customer.address.view', 'customer.status.update'
    ]
  },
  {
    name: 'Marketing Manager',
    slug: 'MARKETING_MANAGER',
    description: 'Oversees promotional coupon codes, campaign strategies, and artwork discovery trends.',
    isSystem: true,
    permissionSlugs: [
      'marketing.view', 'marketing.create', 'marketing.update', 'marketing.delete',
      'product.view', 'collection.view', 'customer.view',
      'variant.view', 'product-option.view',
      'media.view', 'media-folder.view',
      'antique.view',
      'sanskrit-edit.view',
      'artist.view',
      'homepage.view', 'homepage.create', 'homepage.update', 'homepage.publish',
      'journal.view', 'journal.create', 'journal.update', 'journal.publish',
      'lookbook.view', 'lookbook.create', 'lookbook.update', 'lookbook.publish',
      'navigation.view', 'navigation.create', 'navigation.update', 'navigation.publish',
      'journal-author.view', 'journal-category.view', 'journal-tag.view'
    ]
  }
];

export const INITIAL_ATTRIBUTES = [
  {
    name: 'Material',
    slug: 'material',
    type: 'MULTI_SELECT',
    description: 'Primary material used in creating the artifact or artwork.',
    isFilterable: true,
    isSystem: true,
    sortOrder: 1,
    values: ['Brass', 'Copper', 'Wood', 'Stone', 'Ceramic', 'Metal', 'Mixed Material', 'Canvas', 'Paper', 'Glass']
  },
  {
    name: 'Style',
    slug: 'style',
    type: 'MULTI_SELECT',
    description: 'Artistic or historical aesthetic movement.',
    isFilterable: true,
    isSystem: true,
    sortOrder: 2,
    values: ['Traditional', 'Contemporary', 'Folk', 'Spiritual', 'Minimal', 'Vintage', 'Rustic', 'Art Deco', 'Indian Heritage']
  },
  {
    name: 'Theme',
    slug: 'theme',
    type: 'MULTI_SELECT',
    description: 'Central thematic or spiritual subject matter.',
    isFilterable: true,
    isSystem: true,
    sortOrder: 3,
    values: ['Deities', 'Nature', 'People', 'Architecture', 'Culture', 'Abstract', 'Spiritual', 'Landscape']
  },
  {
    name: 'Colour',
    slug: 'colour',
    type: 'MULTI_SELECT',
    description: 'Dominant palette or metallic tone.',
    isFilterable: true,
    isSystem: true,
    sortOrder: 4,
    values: ['Beige', 'Green', 'Blue', 'Red', 'Gold', 'Black', 'White', 'Brown', 'Multicolour']
  },
  {
    name: 'Orientation',
    slug: 'orientation',
    type: 'SELECT',
    description: 'Display alignment of the artwork.',
    isFilterable: true,
    isSystem: true,
    sortOrder: 5,
    values: ['Portrait', 'Landscape', 'Square']
  },
  {
    name: 'Size',
    slug: 'size',
    type: 'SELECT',
    description: 'General scale and dimension bracket.',
    isFilterable: true,
    isSystem: true,
    sortOrder: 6,
    values: ['Small', 'Medium', 'Large', 'Oversized']
  },
  {
    name: 'Frame',
    slug: 'frame',
    type: 'SELECT',
    description: 'Artisan hand-finished framing profile.',
    isFilterable: true,
    isSystem: true,
    sortOrder: 7,
    values: ['No Frame', 'Natural Wood', 'Walnut', 'Black', 'Gold']
  },
  {
    name: 'Era',
    slug: 'era',
    type: 'SELECT',
    description: 'Time period or provenance vintage of origin.',
    isFilterable: true,
    isSystem: true,
    sortOrder: 8,
    values: ['Vintage', 'Pre-1950', '1950–1975', '1975–2000', 'Contemporary']
  },
  {
    name: 'Condition',
    slug: 'condition',
    type: 'SELECT',
    description: 'Physical preservation state of collectible or antique.',
    isFilterable: true,
    isSystem: true,
    sortOrder: 9,
    values: ['Excellent', 'Very Good', 'Good', 'Aged / Patina']
  },
  {
    name: 'Usage',
    slug: 'usage',
    type: 'MULTI_SELECT',
    description: 'Recommended placement or functional setting.',
    isFilterable: true,
    isSystem: true,
    sortOrder: 10,
    values: ['Tabletop', 'Display', 'Wall Décor', 'Collectible', 'Functional']
  },
  {
    name: 'Finish',
    slug: 'finish',
    type: 'SELECT',
    description: 'Surface texture and protective treatment.',
    isFilterable: true,
    isSystem: true,
    sortOrder: 11,
    values: ['Matte', 'Gloss', 'Natural', 'Aged', 'Polished']
  },
  {
    name: 'Origin',
    slug: 'origin',
    type: 'SELECT',
    description: 'Region or artisan heritage school of provenance.',
    isFilterable: true,
    isSystem: true,
    sortOrder: 12,
    values: ['Rajasthan', 'Kerala', 'Tamil Nadu', 'Bengal', 'Varanasi', 'Kashmir', 'Gujarat']
  }
];

export async function runSeed(): Promise<void> {
  console.log('🌱 Seeding Lagoree Arts Database (Modules 2, 3, 4)...');

  // 1. Seed Permissions
  const permissionMap = new Map<string, string>();
  for (const perm of PERMISSIONS_DATA) {
    const record = prisma.permission.upsert({
      where: { slug: perm.slug },
      create: perm
    });
    permissionMap.set(perm.slug, record.id);
  }
  console.log(`✓ Seeded ${PERMISSIONS_DATA.length} administrative permissions`);

  // 2. Seed Roles & Assign Permissions
  const roleMap = new Map<string, string>();
  for (const roleDef of ROLES_DATA) {
    const role = prisma.role.upsert({
      where: { slug: roleDef.slug },
      create: {
        name: roleDef.name,
        slug: roleDef.slug,
        description: roleDef.description,
        isSystem: roleDef.isSystem
      },
      update: {
        name: roleDef.name,
        description: roleDef.description
      }
    });

    roleMap.set(roleDef.slug, role.id);

    // Resolve permission IDs
    let targetPermissionIds: string[] = [];
    if (roleDef.permissionSlugs === '*') {
      targetPermissionIds = Array.from(permissionMap.values());
    } else {
      targetPermissionIds = roleDef.permissionSlugs
        .map(slug => permissionMap.get(slug))
        .filter((id): id is string => Boolean(id));
    }

    // Link role permissions
    prisma.rolePermission.deleteMany({ where: { roleId: role.id } });
    prisma.rolePermission.createMany({
      data: targetPermissionIds.map(pId => ({
        roleId: role.id,
        permissionId: pId
      }))
    });
  }
  console.log(`✓ Seeded ${ROLES_DATA.length} standard system roles with permission matrices`);

  // 3. Seed Default Super Admin User
  const superAdminRoleId = roleMap.get('SUPER_ADMIN')!;
  const defaultAdminEmail = 'admin@lagoreearts.com';
  const defaultAdminPassword = 'LagoreeAdmin@2026!';
  const defaultAdminHash = await hashPassword(defaultAdminPassword);

  const existingAdmin = prisma.adminUser.findUnique({
    where: { email: defaultAdminEmail }
  });

  if (!existingAdmin) {
    prisma.adminUser.create({
      data: {
        name: 'Super Admin Curator',
        email: defaultAdminEmail,
        passwordHash: defaultAdminHash,
        status: 'ACTIVE',
        roleId: superAdminRoleId
      }
    });
    console.log(`✓ Seeded default Super Admin (${defaultAdminEmail})`);
  } else {
    console.log(`✓ Super Admin (${defaultAdminEmail}) already initialized`);
  }

  // 3b. Seed Default Demo Customer Patrons
  const defaultCustomerPassword = 'LagoreeArtPass@2026';
  const defaultCustomerHash = await hashPassword(defaultCustomerPassword);

  const demoCustomers = [
    {
      email: 'aarav@example.com',
      firstName: 'Aarav',
      lastName: 'Mehta',
      phone: '+91 98765 43210'
    },
    {
      email: 'rohan.sharma@lagoreearts.com',
      firstName: 'Rohan',
      lastName: 'Sharma',
      phone: '+91 98765 12345'
    },
    {
      email: 'meera.kapoor@example.com',
      firstName: 'Meera',
      lastName: 'Kapoor',
      phone: '+91 98201 45678'
    }
  ];

  for (const c of demoCustomers) {
    const norm = c.email.toLowerCase().trim();
    const existing = prisma.customer.findUnique({ where: { normalizedEmail: norm } });
    if (!existing) {
      prisma.customer.create({
        data: {
          email: c.email,
          normalizedEmail: norm,
          passwordHash: defaultCustomerHash,
          firstName: c.firstName,
          lastName: c.lastName,
          phone: c.phone,
          status: 'ACTIVE',
          emailVerifiedAt: new Date()
        }
      });
      console.log(`✓ Seeded demo patron customer (${c.email})`);
    }
  }

  // 4. Seed Initial Heritage Categories
  const rootArt = prisma.category.findUnique({ where: { slug: 'art' } }) || prisma.category.create({
    data: {
      name: 'Art',
      slug: 'art',
      shortDescription: 'Original paintings, fine art canvas, and heritage editions.',
      isFeatured: true,
      sortOrder: 1,
      status: 'ACTIVE'
    }
  });

  const indianArt = prisma.category.findUnique({ where: { slug: 'indian-art' } }) || prisma.category.create({
    data: {
      name: 'Indian Art',
      slug: 'indian-art',
      parentId: rootArt.id,
      shortDescription: 'Sacred themes, classical styles, and royal Indian masterworks.',
      isFeatured: true,
      sortOrder: 1,
      status: 'ACTIVE'
    }
  });

  prisma.category.findUnique({ where: { slug: 'spiritual-art' } }) || prisma.category.create({
    data: {
      name: 'Spiritual Art',
      slug: 'spiritual-art',
      parentId: indianArt.id,
      shortDescription: 'Pichwai, Tanjore, and sacred devotion motifs.',
      isFeatured: true,
      sortOrder: 1,
      status: 'ACTIVE'
    }
  });

  prisma.category.findUnique({ where: { slug: 'folk-tribal-art' } }) || prisma.category.create({
    data: {
      name: 'Folk & Tribal Art',
      slug: 'folk-tribal-art',
      parentId: indianArt.id,
      shortDescription: 'Madhubani, Warli, and Gond indigenous art traditions.',
      isFeatured: false,
      sortOrder: 2,
      status: 'ACTIVE'
    }
  });

  const rootDecor = prisma.category.findUnique({ where: { slug: 'decor-antiques' } }) || prisma.category.create({
    data: {
      name: 'Decor & Antiques',
      slug: 'decor-antiques',
      shortDescription: 'Curated heritage artifacts, antique brass, and sculptural decor.',
      isFeatured: true,
      sortOrder: 2,
      status: 'ACTIVE'
    }
  });

  const antiques = prisma.category.findUnique({ where: { slug: 'antiques' } }) || prisma.category.create({
    data: {
      name: 'Antiques',
      slug: 'antiques',
      parentId: rootDecor.id,
      shortDescription: 'Rare antique pieces restored by master craftsmen.',
      isFeatured: true,
      sortOrder: 1,
      status: 'ACTIVE'
    }
  });
  console.log('✓ Seeded initial category hierarchy for Lagoree Arts');

  // 5. Seed Initial Attributes & Values (Module 4)
  const attributeMap = new Map<string, string>();

  for (const attrDef of INITIAL_ATTRIBUTES) {
    let attr = prisma.attribute.findUnique({ where: { slug: attrDef.slug } });
    if (!attr) {
      attr = prisma.attribute.create({
        data: {
          name: attrDef.name,
          slug: attrDef.slug,
          type: attrDef.type,
          description: attrDef.description,
          isFilterable: attrDef.isFilterable,
          isSystem: attrDef.isSystem,
          sortOrder: attrDef.sortOrder,
          status: 'ACTIVE'
        }
      });
    }
    attributeMap.set(attrDef.slug, attr.id);

    // Seed values for attribute
    for (let i = 0; i < attrDef.values.length; i++) {
      const valName = attrDef.values[i];
      const valSlug = valName.toLowerCase().replace(/[^\w\s-]/g, '').replace(/[\s_-]+/g, '-').replace(/^-+|-+$/g, '');
      const existingVal = prisma.attributeValue.findUnique({
        where: { attributeId_slug: { attributeId: attr.id, slug: valSlug } }
      });
      if (!existingVal) {
        prisma.attributeValue.create({
          data: {
            attributeId: attr.id,
            name: valName,
            slug: valSlug,
            sortOrder: i + 1,
            status: 'ACTIVE'
          }
        });
      }
    }
  }
  console.log(`✓ Seeded ${INITIAL_ATTRIBUTES.length} standard system attributes with values`);

  // 6. Seed Initial Category Filter Configurations (Module 4)
  // Antiques -> Material, Era, Style, Condition, Size, Usage
  const antiquesFilters = ['material', 'era', 'style', 'condition', 'size', 'usage'];
  for (let i = 0; i < antiquesFilters.length; i++) {
    const attrId = attributeMap.get(antiquesFilters[i]);
    if (attrId && antiques.id) {
      const existing = prisma.categoryAttribute.findUnique({
        where: { categoryId_attributeId: { categoryId: antiques.id, attributeId: attrId } }
      });
      if (!existing) {
        prisma.categoryAttribute.create({
          data: {
            categoryId: antiques.id,
            attributeId: attrId,
            sortOrder: i + 1,
            isVisible: true,
            isRequired: antiquesFilters[i] === 'material'
          }
        });
      }
    }
  }

  // Indian Art -> Style, Theme, Colour, Orientation, Size
  const indianArtFilters = ['style', 'theme', 'colour', 'orientation', 'size'];
  for (let i = 0; i < indianArtFilters.length; i++) {
    const attrId = attributeMap.get(indianArtFilters[i]);
    if (attrId && indianArt.id) {
      const existing = prisma.categoryAttribute.findUnique({
        where: { categoryId_attributeId: { categoryId: indianArt.id, attributeId: attrId } }
      });
      if (!existing) {
        prisma.categoryAttribute.create({
          data: {
            categoryId: indianArt.id,
            attributeId: attrId,
            sortOrder: i + 1,
            isVisible: true,
            isRequired: false
          }
        });
      }
    }
  }

  // Art (Root) -> Style, Theme, Colour, Orientation, Size, Frame
  const artFilters = ['style', 'theme', 'colour', 'orientation', 'size', 'frame'];
  for (let i = 0; i < artFilters.length; i++) {
    const attrId = attributeMap.get(artFilters[i]);
    if (attrId && rootArt.id) {
      const existing = prisma.categoryAttribute.findUnique({
        where: { categoryId_attributeId: { categoryId: rootArt.id, attributeId: attrId } }
      });
      if (!existing) {
        prisma.categoryAttribute.create({
          data: {
            categoryId: rootArt.id,
            attributeId: attrId,
            sortOrder: i + 1,
            isVisible: true,
            isRequired: false
          }
        });
      }
    }
  }
  // 7. Seed Initial Curated Collections (Module 5)
  const INITIAL_COLLECTIONS = [
    {
      name: 'The Sanskrit Edit',
      slug: 'the-sanskrit-edit',
      shortDescription: 'Sacred typography, epic verses, and Vedic philosophy curated on canvas.',
      isFeatured: true,
      sortOrder: 1
    },
    {
      name: 'Antique Treasures',
      slug: 'antique-treasures',
      shortDescription: 'Centuries-old bronze deities, ceremonial vessels, and heirloom artifacts.',
      isFeatured: true,
      sortOrder: 2
    },
    {
      name: 'Indian Heritage',
      slug: 'indian-heritage',
      shortDescription: 'Timeless masterpieces depicting Indian royalty, folklore, and sacred devotion.',
      isFeatured: true,
      sortOrder: 3
    },
    {
      name: "Curator's Picks",
      slug: 'curators-picks',
      shortDescription: 'Hand-selected highlight acquisitions chosen by our senior atelier curators.',
      isFeatured: true,
      sortOrder: 4
    },
    {
      name: 'New Arrivals',
      slug: 'new-arrivals',
      shortDescription: 'Freshly archived masterworks, framed prints, and rare brass acquisitions.',
      isFeatured: false,
      sortOrder: 5
    },
    {
      name: 'Bestsellers',
      slug: 'bestsellers',
      shortDescription: 'Most revered and acquired artistic treasures among discerning patrons.',
      isFeatured: false,
      sortOrder: 6
    },
    {
      name: 'Festive Collection',
      slug: 'festive-collection',
      shortDescription: 'Auspicious artworks and radiant brass diyas for sacred celebrations.',
      isFeatured: true,
      sortOrder: 7
    },
    {
      name: 'Spiritual Art',
      slug: 'spiritual-art-collection',
      shortDescription: 'Deep meditative expressions, divine iconography, and sacred temple sanctum motifs.',
      isFeatured: false,
      sortOrder: 8
    }
  ];

  for (const colDef of INITIAL_COLLECTIONS) {
    const existing = prisma.collection.findUnique({ where: { slug: colDef.slug } });
    if (!existing) {
      prisma.collection.create({
        data: {
          name: colDef.name,
          slug: colDef.slug,
          shortDescription: colDef.shortDescription,
          isFeatured: colDef.isFeatured,
          sortOrder: colDef.sortOrder,
          status: 'ACTIVE',
          type: 'MANUAL',
          metaTitle: colDef.name,
          ogTitle: colDef.name
        }
      });
    }
  }
  console.log(`✓ Seeded ${INITIAL_COLLECTIONS.length} curated editorial collections`);

  // 8. Seed Initial Curated Products (Module 6)
  const INITIAL_PRODUCTS = [
    {
      name: 'Pichwai Lotus Painting',
      slug: 'pichwai-lotus-painting',
      sku: 'LA-PIC-0001',
      shortDescription: 'Hand-painted sacred Pichwai depicting blossoming lotuses and miniature holy cows in Shrinathji sanctum.',
      description: 'An exquisite Pichwai masterwork handcrafted on pure organic cotton fabric using natural stone pigments and 24K pure gold leaf detailing.',
      price: 14500,
      compareAtPrice: 16500,
      costPrice: 8000,
      status: 'ACTIVE',
      productType: 'SIMPLE',
      stockQuantity: 12,
      lowStockThreshold: 3,
      trackInventory: true,
      allowBackorder: false,
      isFeatured: true,
      isNewArrival: true,
      isBestseller: true,
      sortOrder: 1,
      categorySlug: 'pichwai-painting',
      collectionSlugs: ['the-sanskrit-edit', 'curators-picks'],
      attributes: [
        { attrSlug: 'material', valSlug: 'canvas' },
        { attrSlug: 'style', valSlug: 'traditional' },
        { attrSlug: 'theme', valSlug: 'pichwai' }
      ]
    },
    {
      name: 'Brass Antique Diya',
      slug: 'brass-antique-diya',
      sku: 'LA-ANT-0001',
      shortDescription: 'Centuries-inspired solid cast brass ceremonial temple oil lamp with peacock finial.',
      description: 'A stately brass diya cast using lost-wax casting (Dhokra / Cire Perdue) technique with deep oil reservoir for auspicious rituals.',
      price: 4800,
      compareAtPrice: 5500,
      costPrice: 2200,
      status: 'ACTIVE',
      productType: 'SIMPLE',
      stockQuantity: 25,
      lowStockThreshold: 5,
      trackInventory: true,
      allowBackorder: true,
      isFeatured: true,
      isNewArrival: false,
      isBestseller: true,
      sortOrder: 2,
      categorySlug: 'antiques',
      collectionSlugs: ['antique-treasures', 'festive-collection'],
      attributes: [
        { attrSlug: 'material', valSlug: 'brass' },
        { attrSlug: 'style', valSlug: 'antique' }
      ]
    },
    {
      name: 'Traditional Tanjore Gold Art',
      slug: 'traditional-tanjore-gold-art',
      sku: 'LA-TAN-0001',
      shortDescription: 'Magnificent South Indian Tanjore icon with 22K gold foil and Jaipur semi-precious stones.',
      description: 'Preserved classical Thanjavur artwork mounted on seasoned teakwood panel showcasing divine gopuram embellishments.',
      price: 28000,
      compareAtPrice: 32000,
      costPrice: 15000,
      status: 'ACTIVE',
      productType: 'SIMPLE',
      stockQuantity: 4,
      lowStockThreshold: 2,
      trackInventory: true,
      allowBackorder: false,
      isFeatured: true,
      isNewArrival: true,
      isBestseller: false,
      sortOrder: 3,
      categorySlug: 'tanjore-painting',
      collectionSlugs: ['indian-heritage'],
      attributes: [
        { attrSlug: 'material', valSlug: 'gold-foil' },
        { attrSlug: 'style', valSlug: 'traditional' }
      ]
    },
    {
      name: 'Sanskrit Quote Canvas',
      slug: 'sanskrit-quote-canvas',
      sku: 'LA-SAN-0001',
      shortDescription: 'Vedic hymn canvas print capturing timeless wisdom in refined Devanagari calligraphy.',
      description: 'Archival museum-grade canvas print rendering sacred verses with minimalist gold accents.',
      price: 3200,
      compareAtPrice: 3800,
      costPrice: 1400,
      status: 'ACTIVE',
      productType: 'VARIABLE',
      stockQuantity: 50,
      lowStockThreshold: 10,
      trackInventory: true,
      allowBackorder: true,
      isFeatured: false,
      isNewArrival: true,
      isBestseller: false,
      sortOrder: 4,
      categorySlug: 'sanskrit-typography',
      collectionSlugs: ['the-sanskrit-edit'],
      attributes: [
        { attrSlug: 'material', valSlug: 'canvas' },
        { attrSlug: 'style', valSlug: 'modern' }
      ],
      options: [
        {
          name: 'Size',
          slug: 'size',
          sortOrder: 1,
          values: [
            { value: 'A4', slug: 'a4', sortOrder: 1 },
            { value: 'A3', slug: 'a3', sortOrder: 2 },
            { value: 'A2', slug: 'a2', sortOrder: 3 }
          ]
        },
        {
          name: 'Frame',
          slug: 'frame',
          sortOrder: 2,
          values: [
            { value: 'Walnut Frame', slug: 'walnut-frame', sortOrder: 1 },
            { value: 'Black Oak Frame', slug: 'black-oak-frame', sortOrder: 2 },
            { value: 'Unframed Canvas', slug: 'unframed-canvas', sortOrder: 3 }
          ]
        }
      ],
      variants: [
        {
          sku: 'LA-SAN-0001-A4-WAL',
          price: 3200,
          compareAtPrice: 3800,
          costPrice: 1400,
          stockQuantity: 20,
          lowStockThreshold: 5,
          trackInventory: true,
          allowBackorder: true,
          status: 'ACTIVE',
          sortOrder: 1,
          optionValues: { size: 'a4', frame: 'walnut-frame' }
        },
        {
          sku: 'LA-SAN-0001-A4-BLK',
          price: 3200,
          compareAtPrice: 3800,
          costPrice: 1400,
          stockQuantity: 15,
          lowStockThreshold: 5,
          trackInventory: true,
          allowBackorder: true,
          status: 'ACTIVE',
          sortOrder: 2,
          optionValues: { size: 'a4', frame: 'black-oak-frame' }
        },
        {
          sku: 'LA-SAN-0001-A3-WAL',
          price: 4500,
          compareAtPrice: 5200,
          costPrice: 2000,
          stockQuantity: 10,
          lowStockThreshold: 3,
          trackInventory: true,
          allowBackorder: true,
          status: 'ACTIVE',
          sortOrder: 3,
          optionValues: { size: 'a3', frame: 'walnut-frame' }
        },
        {
          sku: 'LA-SAN-0001-A3-BLK',
          price: 4500,
          compareAtPrice: 5200,
          costPrice: 2000,
          stockQuantity: 8,
          lowStockThreshold: 2,
          trackInventory: true,
          allowBackorder: true,
          status: 'ACTIVE',
          sortOrder: 4,
          optionValues: { size: 'a3', frame: 'black-oak-frame' }
        }
      ]
    },
    {
      name: 'Vintage Wooden Jharokha',
      slug: 'vintage-wooden-jharokha',
      sku: 'LA-WOO-0001',
      shortDescription: 'Hand-carved Rajasthani architectural window panel in distressed antique finish.',
      description: 'Reclaimed teakwood lattice wall arch inspired by royal haveli palace balconies of Jodhpur.',
      price: 9500,
      compareAtPrice: 11000,
      costPrice: 4500,
      status: 'ACTIVE',
      productType: 'SIMPLE',
      stockQuantity: 7,
      lowStockThreshold: 2,
      trackInventory: true,
      allowBackorder: false,
      isFeatured: false,
      isNewArrival: false,
      isBestseller: false,
      sortOrder: 5,
      categorySlug: 'wooden-handicraft',
      collectionSlugs: ['antique-treasures', 'indian-heritage'],
      attributes: [
        { attrSlug: 'material', valSlug: 'wood' },
        { attrSlug: 'style', valSlug: 'traditional' }
      ]
    },
    {
      name: '19th Century Antique Tanjore Royal Saraswati',
      slug: 'antique-19th-century-tanjore-saraswati',
      sku: 'LA-ANT-0001',
      shortDescription: 'Museum-grade 19th Century Tanjore painting adorned with 22K gold foil and uncut Burmese rubies on teak panel.',
      description: 'An extraordinary heirloom Tanjore masterpiece created in late 19th Century Thanjavur court style. Depicts Goddess Saraswati seated on a carved lotus pedestal with veena, flanked by celestial attendants.',
      price: 185000,
      compareAtPrice: 220000,
      costPrice: 95000,
      status: 'ACTIVE',
      productType: 'SIMPLE',
      stockQuantity: 1,
      lowStockThreshold: 1,
      trackInventory: true,
      allowBackorder: false,
      isFeatured: true,
      isNewArrival: false,
      isBestseller: true,
      sortOrder: 6,
      categorySlug: 'tanjore-painting',
      collectionSlugs: ['antique-treasures', 'curators-picks', 'the-sanskrit-edit'],
      attributes: [
        { attrSlug: 'material', valSlug: 'canvas' },
        { attrSlug: 'style', valSlug: 'traditional' },
        { attrSlug: 'theme', valSlug: 'devotional' }
      ],
      antique: {
        era: '19th Century',
        period: 'Maratha-Tanjore Period',
        approximateAgeFrom: 1870,
        approximateAgeTo: 1895,
        ageDescription: 'Circa 1880 CE',
        origin: 'Thanjavur, Tamil Nadu',
        region: 'South India',
        countryOfOrigin: 'India',
        artistMaker: 'Master Artisan of Thanjavur Royal Court',
        attribution: 'Attributed to the lineage of Raja Serfoji II court atelier',
        schoolOrTradition: 'Tanjore Royal School',
        material: '22K Gold Foil, Burma Rubies, Jaipur Gemstones, Natural Pigments on Seasoned Teak Panel',
        technique: 'Traditional Gesso Relief with Embossed Gold Leaf and Gemstone Setting',
        condition: 'VERY_GOOD',
        conditionNotes: 'Exceptional preservation of gold leaf relief and mineral pigmentation. Minor natural age-patina on antique teakwood backing.',
        restorationStatus: 'ORIGINAL',
        restorationNotes: 'Completely original state with unretouched 22K gold foil and authentic gemstone mounts.',
        provenance: 'Acquired from the private estate of a distinguished Chettiar heritage collector, Karaikudi.',
        provenanceNotes: 'Preserved in family sanctuary across four generations since initial acquisition in 1892.',
        authenticityStatus: 'VERIFIED',
        authenticityNotes: 'Physical examination and material spectroscopic analysis verified 22K gold composition and period gesso preparation.',
        acquisitionSource: 'Heritage Private Collection, Karaikudi',
        acquisitionNotes: 'Purchased directly through registered antiquity heritage transfer.',
        dimensionsDescription: 'Mounted in original 19th Century hand-carved rosewood sanctum frame with brass fittings',
        height: 76.2,
        width: 60.9,
        depth: 6.5,
        diameter: null,
        dimensionUnit: 'CM',
        weight: 12.8,
        weightUnit: 'KG',
        isOneOfAKind: true,
        isCertified: true,
        certificateNumber: 'LA-ANT-CERT-2026-0042',
        certificateIssuer: 'Lagoree Heritage Antiquities Board & Archaeological Council',
        certificateDate: '2026-01-15T10:00:00.000Z'
      }
    },
    {
      name: 'Dharmachakra Pravartana Sacred Brass Wall Panel',
      slug: 'dharmachakra-pravartana-sacred-brass-wall-panel',
      sku: 'LA-SAN-0002',
      shortDescription: 'Sacred brass Indic panel depicting the turning of the wheel of righteousness with classical Sanskrit verses.',
      description: 'An authoritative heirloom piece celebrating eternal cosmic order and righteous duty, hand-embossed in high-purity brass with Devanagari verse inscriptions.',
      price: 125000,
      compareAtPrice: 150000,
      costPrice: 55000,
      status: 'ACTIVE',
      productType: 'SIMPLE',
      stockQuantity: 5,
      lowStockThreshold: 1,
      trackInventory: true,
      allowBackorder: false,
      isFeatured: true,
      isNewArrival: true,
      isBestseller: true,
      sortOrder: 1,
      categorySlug: 'spiritual-art',
      collectionSlugs: ['divine-pantheon', 'temple-heritage'],
      attributes: [
        { attrSlug: 'material', valSlug: 'brass' }
      ],
      sanskritEdit: {
        sanskritTitle: 'धर्मचक्रप्रवर्तनम्',
        devanagariText: 'धर्मो रक्षति रक्षितः। सत्यमेव जयते नानृतम्॥',
        transliteration: 'dharmo rakṣati rakṣitaḥ | satyameva jayate nānṛtam ||',
        translation: 'Dharma protects those who protect Dharma. Truth alone triumphs, not untruth.',
        meaning: 'The eternal cosmic order and righteous duty uphold harmony in the universe when upheld by individuals with integrity.',
        pronunciation: 'Dhar-mo Rak-sha-ti Rak-shi-tah',
        pronunciationGuide: 'Short "a" pronounced like "u" in cup; "ṣ" is retroflex sh.',
        source: 'Mahabharata & Mundaka Upanishad',
        sourceReference: 'Vana Parva 313.128 & Mundaka 3.1.6',
        theme: 'Dharma',
        context: 'Traditional Vedic and Epic philosophical maxims celebrating truth, justice, and spiritual duty in everyday life.',
        editorialContent: 'Crafted with exquisite devotion, this brass artifact embodies the sacred wheel of righteousness and the cosmic triumph of truth.',
        featuredExcerpt: 'सत्यमेव जयते नानृतम्',
        featuredExcerptTranslation: 'Truth alone triumphs, not untruth',
        editorialNote: 'Masterpiece verified by Sanskrit editorial panel for prime exhibition.',
        displayOrder: 1,
        isFeatured: true,
        isPublished: true
      },
      artists: [
        { artistSlug: 'master-sculptor-sompura', role: 'ARTIST', isPrimary: true }
      ]
    }
  ];

  // MODULE 11: INITIAL ARTISTS & MAKERS
  const INITIAL_ARTISTS = [
    {
      name: 'Master Sculptor Sompura',
      slug: 'master-sculptor-sompura',
      shortBio: 'Hereditary temple architect and sacred icon sculptor from Gujarat tradition.',
      biography: 'Master Sculptor Sompura carries on an unbroken lineage of sacred vastu shilpa art spanning five generations.',
      birthYear: 1958,
      deathYear: null,
      nationality: 'Indian',
      origin: 'Patan, Gujarat',
      tradition: 'Vedic Temple Architecture & Shilpa Shastra',
      medium: 'Lost-wax Bronze & White Marble',
      specialization: 'Sacred Sculptures & Yantras',
      signature: 'Shilpi Sompura',
      status: 'ACTIVE' as const,
      isFeatured: true,
      sortOrder: 1
    },
    {
      name: 'Ustad Mansur Heritage Atelier',
      slug: 'ustad-mansur-heritage-atelier',
      shortBio: 'Classical atelier specializing in miniature painting and natural mineral pigment masterworks.',
      biography: 'Reviving 17th-century Mughal and Rajasthani court atelier techniques with hand-ground lapis lazuli and gold leaf.',
      birthYear: null,
      deathYear: null,
      nationality: 'Indian',
      origin: 'Jaipur, Rajasthan',
      tradition: 'Mughal & Rajasthani Miniature',
      medium: 'Natural Mineral Pigments & Gold Leaf on Wasli Paper',
      specialization: 'Botanical & Court Miniatures',
      signature: 'Mansur Atelier',
      status: 'ACTIVE' as const,
      isFeatured: true,
      sortOrder: 2
    }
  ];

  for (const artDef of INITIAL_ARTISTS) {
    const existing = prisma.artist.findUnique({ where: { slug: artDef.slug } });
    if (!existing) {
      prisma.artist.create({
        data: artDef
      });
    }
  }

  for (const prodDef of INITIAL_PRODUCTS) {
    const existing = prisma.product.findUnique({ where: { slug: prodDef.slug } }) || prisma.product.findUnique({ where: { sku: prodDef.sku } });
    if (!existing) {
      let categoryId: string | null = null;
      if (prodDef.categorySlug) {
        const cat = prisma.category.findUnique({ where: { slug: prodDef.categorySlug } });
        if (cat) categoryId = cat.id;
      }
      const fallbackCat = prisma.category.findUnique({ where: { slug: 'art' } }) || prisma.category.findFirst();
      categoryId = categoryId || fallbackCat?.id || null;

      if (categoryId) {
        const prod = prisma.product.create({
          data: {
            name: prodDef.name,
            slug: prodDef.slug,
            sku: prodDef.sku,
            shortDescription: prodDef.shortDescription,
            description: prodDef.description,
            price: prodDef.price,
            compareAtPrice: prodDef.compareAtPrice,
            costPrice: prodDef.costPrice,
            status: prodDef.status,
            productType: prodDef.productType,
            stockQuantity: prodDef.stockQuantity,
            lowStockThreshold: prodDef.lowStockThreshold,
            trackInventory: prodDef.trackInventory,
            allowBackorder: prodDef.allowBackorder,
            isFeatured: prodDef.isFeatured,
            isNewArrival: prodDef.isNewArrival,
            isBestseller: prodDef.isBestseller,
            sortOrder: prodDef.sortOrder,
            categoryId,
            metaTitle: prodDef.name,
            ogTitle: prodDef.name
          }
        });

        // Link Collections
        for (const colSlug of prodDef.collectionSlugs) {
          const col = prisma.collection.findUnique({ where: { slug: colSlug } });
          if (col) {
            prisma.productCollection.create({
              data: { productId: prod.id, collectionId: col.id }
            });
          }
        }

        // Link Attributes
        for (const attrPair of prodDef.attributes) {
          const attr = prisma.attribute.findUnique({ where: { slug: attrPair.attrSlug } });
          if (attr) {
            const val = prisma.attributeValue.findUnique({
              where: { attributeId_slug: { attributeId: attr.id, slug: attrPair.valSlug } }
            });
            prisma.productAttributeValue.create({
              data: {
                productId: prod.id,
                attributeId: attr.id,
                attributeValueId: val?.id || null,
                textValue: val ? null : attrPair.valSlug
              }
            });
          }
        }

        // Link AntiqueProfile if defined
        if ((prodDef as any).antique) {
          const existingProfile = prisma.antiqueProfile.findUnique({ where: { productId: prod.id } });
          if (!existingProfile) {
            prisma.antiqueProfile.create({
              data: {
                productId: prod.id,
                ...(prodDef as any).antique
              }
            });
          }
        }

        // Link SanskritEditProfile if defined
        if ((prodDef as any).sanskritEdit) {
          const existingSanskrit = prisma.sanskritEditProfile.findUnique({ where: { productId: prod.id } });
          if (!existingSanskrit) {
            prisma.sanskritEditProfile.create({
              data: {
                productId: prod.id,
                ...(prodDef as any).sanskritEdit
              }
            });
          }
        }

        // Link Artists if defined
        if ((prodDef as any).artists) {
          for (const aDef of (prodDef as any).artists) {
            const artist = prisma.artist.findUnique({ where: { slug: aDef.artistSlug } });
            if (artist) {
              const existingPA = prisma.productArtist.findUnique({
                where: { productId_artistId_role: { productId: prod.id, artistId: artist.id, role: aDef.role || 'ARTIST' } }
              });
              if (!existingPA) {
                prisma.productArtist.create({
                  data: {
                    productId: prod.id,
                    artistId: artist.id,
                    role: aDef.role || 'ARTIST',
                    isPrimary: Boolean(aDef.isPrimary),
                    sortOrder: 0
                  }
                });
              }
            }
          }
        }

        // Link Options & Variants for VARIABLE products
        if ((prodDef as any).options) {
          for (const optDef of (prodDef as any).options) {
            const opt = prisma.productOption.create({
              data: {
                productId: prod.id,
                name: optDef.name,
                slug: optDef.slug,
                sortOrder: optDef.sortOrder
              }
            });
            for (const valDef of optDef.values) {
              prisma.productOptionValue.create({
                data: {
                  productOptionId: opt.id,
                  value: valDef.value,
                  slug: valDef.slug,
                  sortOrder: valDef.sortOrder
                }
              });
            }
          }

          if ((prodDef as any).variants) {
            for (const varDef of (prodDef as any).variants) {
              const variant = prisma.productVariant.create({
                data: {
                  productId: prod.id,
                  sku: varDef.sku,
                  price: varDef.price,
                  compareAtPrice: varDef.compareAtPrice,
                  costPrice: varDef.costPrice,
                  stockQuantity: varDef.stockQuantity,
                  lowStockThreshold: varDef.lowStockThreshold,
                  trackInventory: varDef.trackInventory,
                  allowBackorder: varDef.allowBackorder,
                  status: varDef.status || 'ACTIVE',
                  sortOrder: varDef.sortOrder
                }
              });

              for (const [optSlug, valSlug] of Object.entries(varDef.optionValues)) {
                const opt = prisma.productOption.findUnique({ where: { productId_slug: { productId: prod.id, slug: optSlug } } });
                if (opt) {
                  const val = prisma.productOptionValue.findUnique({ where: { productOptionId_slug: { productOptionId: opt.id, slug: valSlug as string } } });
                  if (val) {
                    prisma.productVariantOptionValue.create({
                      data: {
                        variantId: variant.id,
                        optionValueId: val.id
                      }
                    });
                  }
                }
              }
            }
          }
        }
      }
    }
  }
  console.log(`✓ Seeded ${INITIAL_PRODUCTS.length} curated masterwork products (including VARIABLE products)`);

  // Seed Default Homepage (Module 12)
  const existingDefaultHomepage = prisma.homepage.findFirst({ where: { slug: 'default-storefront' } });
  if (!existingDefaultHomepage) {
    const defaultHp = prisma.homepage.create({
      data: {
        name: 'Lagoree Arts Grand Heritage Storefront',
        slug: 'default-storefront',
        status: 'PUBLISHED',
        isDefault: true,
        seoTitle: 'Lagoree Arts | Heritage Indian Masterpieces & Sacred Adornments',
        seoDescription: 'Discover authentic Tanjore paintings, handcrafted brass sculptures, Pichwai devotional art, and verified heritage antiques.',
        seoKeywords: 'tanjore painting, pichwai art, brass sculpture, indian heritage, authentic antique, sanskrit sacred art'
      }
    });

    // 1. HERO Section
    prisma.homepageSection.create({
      data: {
        homepageId: defaultHp.id,
        type: 'HERO',
        title: 'Timeless Sacred Heritage, Handcrafted for Connoisseurs',
        subtitle: 'Authentic 22K gold leaf Tanjore art, lost-wax Chola bronzes, and temple sanctum Pichwais.',
        eyebrow: 'THE ROYAL ATELIER COLLECTION',
        config: {
          ctaLabel: 'Explore Curated Masterpieces',
          ctaUrl: '/collections/curator-highlights',
          textAlignment: 'center',
          overlayOpacity: 0.4
        },
        displayOrder: 1,
        isVisible: true
      }
    });

    // 2. FEATURED_COLLECTIONS Section
    const featCollSec = prisma.homepageSection.create({
      data: {
        homepageId: defaultHp.id,
        type: 'FEATURED_COLLECTIONS',
        title: 'Curated Heritage Collections',
        subtitle: 'Explore our master themes celebrating classical traditions and temple ateliers.',
        displayOrder: 2,
        isVisible: true
      }
    });
    const colList = prisma.collection.findMany({ take: 3 });
    for (let i = 0; i < colList.length; i++) {
      prisma.homepageSectionCollection.create({
        data: { sectionId: featCollSec.id, collectionId: colList[i].id, displayOrder: i + 1 }
      });
    }

    // 3. FEATURED_PRODUCTS Section
    const featProdSec = prisma.homepageSection.create({
      data: {
        homepageId: defaultHp.id,
        type: 'FEATURED_PRODUCTS',
        title: 'Masterpiece Highlights',
        subtitle: 'Hand-picked acquisitions from our master artists and certified archives.',
        displayOrder: 3,
        isVisible: true
      }
    });
    const prodList = prisma.product.findMany({ take: 4 });
    for (let i = 0; i < prodList.length; i++) {
      prisma.homepageSectionProduct.create({
        data: { sectionId: featProdSec.id, productId: prodList[i].id, displayOrder: i + 1 }
      });
    }

    // 4. SANSKRIT_EDIT Section
    prisma.homepageSection.create({
      data: {
        homepageId: defaultHp.id,
        type: 'SANSKRIT_EDIT',
        title: 'The Sanskrit Edit',
        subtitle: 'Sacred verses, Vedic hymns, and philosophical masterworks inscribed in gold.',
        eyebrow: 'DEVOTIONAL INSCRIPTIONS',
        config: {
          selectionMode: 'AUTOMATIC',
          maxItems: 4,
          ctaLabel: 'Explore Devotional Archive',
          ctaUrl: '/sanskrit-edit'
        },
        displayOrder: 4,
        isVisible: true
      }
    });

    // 5. ANTIQUES Section
    prisma.homepageSection.create({
      data: {
        homepageId: defaultHp.id,
        type: 'ANTIQUES',
        title: 'Antiques & Verified Provenance',
        subtitle: 'Authenticated 19th and 20th-century historical artifacts and temple heirlooms.',
        eyebrow: 'AUTHENTIC ARCHIVAL PIECES',
        config: {
          selectionMode: 'AUTOMATIC',
          maxItems: 4,
          ctaLabel: 'View Antique Heirlooms',
          ctaUrl: '/antiques'
        },
        displayOrder: 5,
        isVisible: true
      }
    });

    // 6. EDITORIAL Section
    prisma.homepageSection.create({
      data: {
        homepageId: defaultHp.id,
        type: 'EDITORIAL',
        title: 'The Living Legacy of Indian Ateliers',
        subtitle: 'Preserving thousand-year-old traditions of gold gilding, natural stone pigments, and sacred iconography.',
        content: '<p>Every Lagoree Arts acquisition represents hundreds of hours of patient handwork by hereditary master artisans. We preserve living cultural heritage through museum-grade materials and rigorous provenance certification.</p>',
        config: {
          layout: 'center',
          ctaLabel: 'Read Our Story',
          ctaUrl: '/about-the-atelier'
        },
        displayOrder: 6,
        isVisible: true
      }
    });

    console.log('✓ Seeded default storefront homepage with curated sections');
  }

  // 14. Seed Initial Journal / Blog Data
  const existingJournalCat = await prisma.journalCategory.findFirst();
  if (!existingJournalCat) {
    const artHistoryCat = await prisma.journalCategory.create({
      data: {
        name: 'Art History & Iconography',
        slug: 'art-history-iconography',
        description: 'Deep dives into sacred geometry, Shilpa Shastras, and traditional Indian artistic schools.',
        status: 'ACTIVE',
        sortOrder: 1,
        seoTitle: 'Art History & Iconography - Lagoree Arts Journal',
        seoDescription: 'Explorations in Indian temple aesthetics, sacred iconometry, and regional artistic schools.'
      }
    });

    const craftTraditionsCat = await prisma.journalCategory.create({
      data: {
        name: 'Living Craft Traditions',
        slug: 'living-craft-traditions',
        description: 'Master artisan interviews and process documentation of traditional techniques.',
        status: 'ACTIVE',
        sortOrder: 2,
        seoTitle: 'Living Craft Traditions - Lagoree Arts Journal',
        seoDescription: 'Documentation of hereditary artisan methods, gold gilding, and mineral pigment preparation.'
      }
    });

    const tagGoldLeaf = await prisma.journalTag.create({
      data: { name: '24k Gold Leaf', slug: '24k-gold-leaf', status: 'ACTIVE' }
    });

    const tagTanjore = await prisma.journalTag.create({
      data: { name: 'Tanjore School', slug: 'tanjore-school', status: 'ACTIVE' }
    });

    const tagIconography = await prisma.journalTag.create({
      data: { name: 'Sacred Iconography', slug: 'sacred-iconography', status: 'ACTIVE' }
    });

    const author = await prisma.journalAuthor.create({
      data: {
        name: 'Dr. Radhika Krishnamurthy',
        slug: 'dr-radhika-krishnamurthy',
        bio: 'Senior Art Historian and specialist in medieval South Indian temple iconography and Vijayanagara painting ateliers.',
        status: 'ACTIVE'
      }
    });

    const samplePost = await prisma.journalPost.create({
      data: {
        title: 'The Alchemical Brilliance of 24-Karat Gold Leaf in Thanjavur Art',
        slug: 'alchemical-brilliance-24k-gold-leaf-thanjavur-art',
        excerpt: 'An investigation into the traditional gesso formula, unrefined chalk pastes, and burnished gold leaf that grant Thanjavur paintings their eternal luminous presence.',
        content: '<p>Originating under the patronage of the Maratha rulers of Thanjavur in the 16th century, Thanjavur painting represents one of the most technically demanding sacred painting traditions of India. The defining hallmark of this school is its relief gesso work (sukka pithi) embellished with pure 24-karat gold foil.</p><p>The meticulous layering of unboiled lime, tamarind seed binder, and pure mineral pigments creates a three-dimensional sacred surface designed to radiate under sanctum oil lamps.</p>',
        type: 'ESSAY',
        status: 'PUBLISHED',
        featured: true,
        publishedAt: new Date().toISOString(),
        displayOrder: 1,
        authorId: author.id,
        categoryId: artHistoryCat.id,
        seoTitle: 'The Alchemical Brilliance of 24k Gold Leaf in Thanjavur Art',
        seoDescription: 'A technical and historical exploration of 24k gold leaf and gesso in Thanjavur sacred paintings.',
        seoKeywords: 'Thanjavur painting, 24k gold foil, gesso relief, sacred art history'
      }
    });

    await prisma.journalPostTag.create({
      data: { journalPostId: samplePost.id, tagId: tagGoldLeaf.id }
    });
    await prisma.journalPostTag.create({
      data: { journalPostId: samplePost.id, tagId: tagTanjore.id }
    });
    await prisma.journalPostTag.create({
      data: { journalPostId: samplePost.id, tagId: tagIconography.id }
    });

    console.log('✓ Seeded initial Journal categories, tags, author, and featured essay');
  }

  // 14. SEED DEFAULT NAVIGATION (MODULE 15)
  const existingNav = await prisma.navigation.findUnique({ where: { slug: 'default-main-navigation' } });
  if (!existingNav) {
    // A. Main Header Navigation
    const headerNav = await prisma.navigation.create({
      data: {
        name: 'Main Header Navigation',
        slug: 'default-main-navigation',
        location: 'HEADER',
        status: 'ACTIVE',
        isDefault: true
      }
    });

    const paintingsCat = await prisma.category.findUnique({ where: { slug: 'paintings' } });
    const sculpturesCat = await prisma.category.findUnique({ where: { slug: 'fine-sculptures' } });

    // Item 1: Art (Group)
    const artGroup = await prisma.navigationItem.create({
      data: {
        navigationId: headerNav.id,
        label: 'Art',
        displayType: 'MEGA_MENU',
        targetType: 'NONE',
        sortOrder: 0,
        isVisible: true
      }
    });

    if (paintingsCat) {
      await prisma.navigationItem.create({
        data: {
          navigationId: headerNav.id,
          parentId: artGroup.id,
          label: 'Paintings',
          displayType: 'LINK',
          targetType: 'CATEGORY',
          targetId: paintingsCat.id,
          sortOrder: 0,
          isVisible: true
        }
      });
    }

    if (sculpturesCat) {
      await prisma.navigationItem.create({
        data: {
          navigationId: headerNav.id,
          parentId: artGroup.id,
          label: 'Sculptures',
          displayType: 'LINK',
          targetType: 'CATEGORY',
          targetId: sculpturesCat.id,
          sortOrder: 1,
          isVisible: true
        }
      });
    }

    // Item 2: Heritage (Group)
    const heritageGroup = await prisma.navigationItem.create({
      data: {
        navigationId: headerNav.id,
        label: 'Heritage',
        displayType: 'GROUP',
        targetType: 'NONE',
        sortOrder: 1,
        isVisible: true
      }
    });

    await prisma.navigationItem.create({
      data: {
        navigationId: headerNav.id,
        parentId: heritageGroup.id,
        label: 'Antiques & Vintage',
        displayType: 'LINK',
        targetType: 'INTERNAL_URL',
        url: '/antiques',
        sortOrder: 0,
        isVisible: true
      }
    });

    await prisma.navigationItem.create({
      data: {
        navigationId: headerNav.id,
        parentId: heritageGroup.id,
        label: 'The Sanskrit Edit',
        displayType: 'LINK',
        targetType: 'INTERNAL_URL',
        url: '/sanskrit-edit',
        sortOrder: 1,
        isVisible: true
      }
    });

    await prisma.navigationItem.create({
      data: {
        navigationId: headerNav.id,
        parentId: heritageGroup.id,
        label: 'Artists & Masters',
        displayType: 'LINK',
        targetType: 'INTERNAL_URL',
        url: '/artists',
        sortOrder: 2,
        isVisible: true
      }
    });

    // Item 3: Journal
    await prisma.navigationItem.create({
      data: {
        navigationId: headerNav.id,
        label: 'Journal',
        displayType: 'LINK',
        targetType: 'INTERNAL_URL',
        url: '/journal',
        sortOrder: 2,
        isVisible: true
      }
    });

    // Item 4: Lookbooks
    await prisma.navigationItem.create({
      data: {
        navigationId: headerNav.id,
        label: 'Lookbooks',
        displayType: 'LINK',
        targetType: 'INTERNAL_URL',
        url: '/lookbooks',
        sortOrder: 3,
        isVisible: true
      }
    });

    // B. Footer Navigation
    const footerNav = await prisma.navigation.create({
      data: {
        name: 'Default Footer Navigation',
        slug: 'default-footer-navigation',
        location: 'FOOTER',
        status: 'ACTIVE',
        isDefault: true
      }
    });

    await prisma.navigationItem.create({
      data: {
        navigationId: footerNav.id,
        label: 'About Atelier',
        displayType: 'LINK',
        targetType: 'INTERNAL_URL',
        url: '/about',
        sortOrder: 0,
        isVisible: true
      }
    });

    await prisma.navigationItem.create({
      data: {
        navigationId: footerNav.id,
        label: 'Sacred Art Conservation',
        displayType: 'LINK',
        targetType: 'INTERNAL_URL',
        url: '/conservation',
        sortOrder: 1,
        isVisible: true
      }
    });

    // C. Mobile Navigation
    await prisma.navigation.create({
      data: {
        name: 'Default Mobile Navigation',
        slug: 'default-mobile-navigation',
        location: 'MOBILE',
        status: 'ACTIVE',
        isDefault: true
      }
    });

    console.log('✓ Seeded default Header, Footer, and Mobile navigation menus');
  }

  console.log('✨ Seeding Completed Successfully!\n');
}

// Auto-run if executed directly
if (process.argv[1]?.endsWith('seed.ts') || process.argv[1]?.endsWith('seed.ts')) {
  runSeed().catch(console.error);
}

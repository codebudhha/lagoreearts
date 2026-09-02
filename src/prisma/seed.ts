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

  // MEDIA
  { name: 'View Media Assets', slug: 'media.view', module: 'MEDIA', description: 'View artwork images and digital media' },
  { name: 'Upload Media', slug: 'media.create', module: 'MEDIA', description: 'Upload artwork assets' },
  { name: 'Update Media', slug: 'media.update', module: 'MEDIA', description: 'Modify artwork media metadata' },
  { name: 'Delete Media', slug: 'media.delete', module: 'MEDIA', description: 'Delete artwork media files' },

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
      'media.view', 'media.create', 'media.update', 'media.delete',
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
      'media.view', 'media.create', 'media.update', 'media.delete',
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
      'customer.view', 'customer.update'
    ]
  },
  {
    name: 'Marketing Manager',
    slug: 'MARKETING_MANAGER',
    description: 'Oversees promotional coupon codes, campaign strategies, and artwork discovery trends.',
    isSystem: true,
    permissionSlugs: [
      'marketing.view', 'marketing.create', 'marketing.update', 'marketing.delete',
      'product.view', 'collection.view', 'customer.view'
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
  console.log('✨ Seeding Completed Successfully!\n');
}

// Auto-run if executed directly
if (process.argv[1]?.endsWith('seed.ts') || process.argv[1]?.endsWith('seed.ts')) {
  runSeed().catch(console.error);
}

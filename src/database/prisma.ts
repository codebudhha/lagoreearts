import { DatabaseSync } from 'node:sqlite';
import path from 'path';
import fs from 'fs';
import { randomUUID } from 'node:crypto';

// Ensure data directory exists
const dbDir = path.resolve(process.cwd(), 'server', 'db');
if (!fs.existsSync(dbDir)) {
  fs.mkdirSync(dbDir, { recursive: true });
}

const dbPath = path.join(dbDir, 'lagoree_admin.db');
const db = new DatabaseSync(dbPath);

// Enable WAL mode & foreign key constraints
db.exec(`
  PRAGMA journal_mode = WAL;
  PRAGMA foreign_keys = ON;
`);

// Initialize Database Schema matching Prisma Schema definitions
db.exec(`
  CREATE TABLE IF NOT EXISTS roles (
    id TEXT PRIMARY KEY,
    name TEXT NOT NULL,
    slug TEXT UNIQUE NOT NULL,
    description TEXT,
    is_system INTEGER NOT NULL DEFAULT 0,
    created_at TEXT NOT NULL,
    updated_at TEXT NOT NULL
  );

  CREATE TABLE IF NOT EXISTS permissions (
    id TEXT PRIMARY KEY,
    name TEXT NOT NULL,
    slug TEXT UNIQUE NOT NULL,
    description TEXT,
    module TEXT NOT NULL,
    created_at TEXT NOT NULL,
    updated_at TEXT NOT NULL
  );

  CREATE TABLE IF NOT EXISTS role_permissions (
    role_id TEXT NOT NULL,
    permission_id TEXT NOT NULL,
    created_at TEXT NOT NULL,
    PRIMARY KEY (role_id, permission_id),
    FOREIGN KEY (role_id) REFERENCES roles(id) ON DELETE CASCADE,
    FOREIGN KEY (permission_id) REFERENCES permissions(id) ON DELETE CASCADE
  );

  CREATE TABLE IF NOT EXISTS admin_users (
    id TEXT PRIMARY KEY,
    name TEXT NOT NULL,
    email TEXT UNIQUE NOT NULL,
    password_hash TEXT NOT NULL,
    status TEXT NOT NULL DEFAULT 'ACTIVE',
    role_id TEXT NOT NULL,
    last_login_at TEXT,
    password_changed_at TEXT,
    created_at TEXT NOT NULL,
    updated_at TEXT NOT NULL,
    FOREIGN KEY (role_id) REFERENCES roles(id) ON DELETE RESTRICT
  );

  CREATE TABLE IF NOT EXISTS admin_sessions (
    id TEXT PRIMARY KEY,
    admin_user_id TEXT NOT NULL,
    refresh_token_hash TEXT NOT NULL,
    user_agent TEXT,
    ip_address TEXT,
    expires_at TEXT NOT NULL,
    revoked_at TEXT,
    created_at TEXT NOT NULL,
    last_used_at TEXT NOT NULL,
    FOREIGN KEY (admin_user_id) REFERENCES admin_users(id) ON DELETE CASCADE
  );

  CREATE TABLE IF NOT EXISTS admin_password_resets (
    id TEXT PRIMARY KEY,
    admin_user_id TEXT NOT NULL,
    token_hash TEXT NOT NULL,
    expires_at TEXT NOT NULL,
    used_at TEXT,
    created_at TEXT NOT NULL,
    FOREIGN KEY (admin_user_id) REFERENCES admin_users(id) ON DELETE CASCADE
  );

  CREATE TABLE IF NOT EXISTS admin_audit_logs (
    id TEXT PRIMARY KEY,
    admin_user_id TEXT,
    action TEXT NOT NULL,
    module TEXT NOT NULL,
    entity_type TEXT,
    entity_id TEXT,
    old_values TEXT,
    new_values TEXT,
    ip_address TEXT,
    user_agent TEXT,
    created_at TEXT NOT NULL,
    FOREIGN KEY (admin_user_id) REFERENCES admin_users(id) ON DELETE SET NULL
  );

  CREATE TABLE IF NOT EXISTS categories (
    id TEXT PRIMARY KEY,
    name TEXT NOT NULL,
    slug TEXT UNIQUE NOT NULL,
    parent_id TEXT,
    short_description TEXT,
    description TEXT,
    image TEXT,
    image_alt TEXT,
    banner_image TEXT,
    banner_image_alt TEXT,
    status TEXT NOT NULL DEFAULT 'ACTIVE',
    is_featured INTEGER NOT NULL DEFAULT 0,
    sort_order INTEGER NOT NULL DEFAULT 0,
    meta_title TEXT,
    meta_description TEXT,
    canonical_url TEXT,
    og_title TEXT,
    og_description TEXT,
    og_image TEXT,
    created_at TEXT NOT NULL,
    updated_at TEXT NOT NULL,
    FOREIGN KEY (parent_id) REFERENCES categories(id) ON DELETE RESTRICT
  );

  CREATE TABLE IF NOT EXISTS attributes (
    id TEXT PRIMARY KEY,
    name TEXT NOT NULL,
    slug TEXT UNIQUE NOT NULL,
    type TEXT NOT NULL DEFAULT 'MULTI_SELECT',
    description TEXT,
    status TEXT NOT NULL DEFAULT 'ACTIVE',
    is_filterable INTEGER NOT NULL DEFAULT 1,
    is_required INTEGER NOT NULL DEFAULT 0,
    is_system INTEGER NOT NULL DEFAULT 0,
    sort_order INTEGER NOT NULL DEFAULT 0,
    created_at TEXT NOT NULL,
    updated_at TEXT NOT NULL
  );

  CREATE TABLE IF NOT EXISTS attribute_values (
    id TEXT PRIMARY KEY,
    attribute_id TEXT NOT NULL,
    name TEXT NOT NULL,
    slug TEXT NOT NULL,
    description TEXT,
    sort_order INTEGER NOT NULL DEFAULT 0,
    status TEXT NOT NULL DEFAULT 'ACTIVE',
    created_at TEXT NOT NULL,
    updated_at TEXT NOT NULL,
    FOREIGN KEY (attribute_id) REFERENCES attributes(id) ON DELETE CASCADE,
    UNIQUE(attribute_id, slug)
  );

  CREATE TABLE IF NOT EXISTS category_attributes (
    category_id TEXT NOT NULL,
    attribute_id TEXT NOT NULL,
    sort_order INTEGER NOT NULL DEFAULT 0,
    is_visible INTEGER NOT NULL DEFAULT 1,
    is_required INTEGER NOT NULL DEFAULT 0,
    created_at TEXT NOT NULL,
    updated_at TEXT NOT NULL,
    PRIMARY KEY (category_id, attribute_id),
    FOREIGN KEY (category_id) REFERENCES categories(id) ON DELETE CASCADE,
    FOREIGN KEY (attribute_id) REFERENCES attributes(id) ON DELETE CASCADE
  );

  CREATE INDEX IF NOT EXISTS idx_admin_users_email ON admin_users(email);
  CREATE INDEX IF NOT EXISTS idx_admin_users_status ON admin_users(status);
  CREATE INDEX IF NOT EXISTS idx_admin_users_role_id ON admin_users(role_id);
  CREATE INDEX IF NOT EXISTS idx_roles_slug ON roles(slug);
  CREATE INDEX IF NOT EXISTS idx_permissions_slug ON permissions(slug);
  CREATE INDEX IF NOT EXISTS idx_permissions_module ON permissions(module);
  CREATE INDEX IF NOT EXISTS idx_admin_sessions_user ON admin_sessions(admin_user_id);
  CREATE INDEX IF NOT EXISTS idx_admin_sessions_hash ON admin_sessions(refresh_token_hash);
  CREATE INDEX IF NOT EXISTS idx_admin_resets_user ON admin_password_resets(admin_user_id);
  CREATE INDEX IF NOT EXISTS idx_admin_resets_hash ON admin_password_resets(token_hash);
  CREATE INDEX IF NOT EXISTS idx_audit_logs_user ON admin_audit_logs(admin_user_id);
  CREATE INDEX IF NOT EXISTS idx_audit_logs_action ON admin_audit_logs(action);
  CREATE INDEX IF NOT EXISTS idx_categories_slug ON categories(slug);
  CREATE INDEX IF NOT EXISTS idx_categories_status ON categories(status);
  CREATE INDEX IF NOT EXISTS idx_categories_parent_id ON categories(parent_id);
  CREATE INDEX IF NOT EXISTS idx_categories_is_featured ON categories(is_featured);
  CREATE INDEX IF NOT EXISTS idx_categories_sort_order ON categories(sort_order);
  CREATE INDEX IF NOT EXISTS idx_categories_created_at ON categories(created_at);
  CREATE INDEX IF NOT EXISTS idx_attributes_slug ON attributes(slug);
  CREATE INDEX IF NOT EXISTS idx_attributes_status ON attributes(status);
  CREATE INDEX IF NOT EXISTS idx_attributes_is_filterable ON attributes(is_filterable);
  CREATE INDEX IF NOT EXISTS idx_attributes_sort_order ON attributes(sort_order);
  CREATE INDEX IF NOT EXISTS idx_attr_values_attr_id ON attribute_values(attribute_id);
  CREATE INDEX IF NOT EXISTS idx_attr_values_slug ON attribute_values(slug);
  CREATE INDEX IF NOT EXISTS idx_attr_values_status ON attribute_values(status);
  CREATE INDEX IF NOT EXISTS idx_attr_values_sort_order ON attribute_values(sort_order);
  CREATE INDEX IF NOT EXISTS idx_cat_attr_cat_id ON category_attributes(category_id);
  CREATE INDEX IF NOT EXISTS idx_cat_attr_attr_id ON category_attributes(attribute_id);
  CREATE INDEX IF NOT EXISTS idx_cat_attr_sort_order ON category_attributes(sort_order);
  CREATE TABLE IF NOT EXISTS collections (
    id TEXT PRIMARY KEY,
    name TEXT NOT NULL,
    slug TEXT UNIQUE NOT NULL,
    short_description TEXT,
    description TEXT,
    image TEXT,
    banner_image TEXT,
    hero_title TEXT,
    hero_description TEXT,
    status TEXT NOT NULL DEFAULT 'ACTIVE',
    type TEXT NOT NULL DEFAULT 'MANUAL',
    is_featured INTEGER NOT NULL DEFAULT 0,
    sort_order INTEGER NOT NULL DEFAULT 0,
    meta_title TEXT,
    meta_description TEXT,
    canonical_url TEXT,
    og_title TEXT,
    og_description TEXT,
    og_image TEXT,
    created_at TEXT NOT NULL,
    updated_at TEXT NOT NULL
  );

  CREATE INDEX IF NOT EXISTS idx_collections_slug ON collections(slug);
  CREATE INDEX IF NOT EXISTS idx_collections_status ON collections(status);
  CREATE INDEX IF NOT EXISTS idx_collections_type ON collections(type);
  CREATE INDEX IF NOT EXISTS idx_collections_is_featured ON collections(is_featured);
  CREATE INDEX IF NOT EXISTS idx_collections_sort_order ON collections(sort_order);
  CREATE INDEX IF NOT EXISTS idx_collections_created_at ON collections(created_at);

  CREATE TABLE IF NOT EXISTS products (
    id TEXT PRIMARY KEY,
    name TEXT NOT NULL,
    slug TEXT UNIQUE NOT NULL,
    sku TEXT UNIQUE NOT NULL,
    short_description TEXT,
    description TEXT,
    status TEXT NOT NULL DEFAULT 'DRAFT',
    product_type TEXT NOT NULL DEFAULT 'SIMPLE',
    price REAL NOT NULL,
    compare_at_price REAL,
    cost_price REAL,
    currency TEXT NOT NULL DEFAULT 'INR',
    stock_quantity INTEGER NOT NULL DEFAULT 0,
    low_stock_threshold INTEGER NOT NULL DEFAULT 5,
    track_inventory INTEGER NOT NULL DEFAULT 1,
    allow_backorder INTEGER NOT NULL DEFAULT 0,
    is_featured INTEGER NOT NULL DEFAULT 0,
    is_new_arrival INTEGER NOT NULL DEFAULT 0,
    is_bestseller INTEGER NOT NULL DEFAULT 0,
    sort_order INTEGER NOT NULL DEFAULT 0,
    category_id TEXT NOT NULL,
    image TEXT,
    thumbnail TEXT,
    banner_image TEXT,
    meta_title TEXT,
    meta_description TEXT,
    canonical_url TEXT,
    og_title TEXT,
    og_description TEXT,
    og_image TEXT,
    created_at TEXT NOT NULL,
    updated_at TEXT NOT NULL,
    FOREIGN KEY (category_id) REFERENCES categories(id) ON DELETE RESTRICT
  );

  CREATE TABLE IF NOT EXISTS product_collections (
    product_id TEXT NOT NULL,
    collection_id TEXT NOT NULL,
    created_at TEXT NOT NULL,
    PRIMARY KEY (product_id, collection_id),
    FOREIGN KEY (product_id) REFERENCES products(id) ON DELETE CASCADE,
    FOREIGN KEY (collection_id) REFERENCES collections(id) ON DELETE CASCADE
  );

  CREATE TABLE IF NOT EXISTS product_attribute_values (
    id TEXT PRIMARY KEY,
    product_id TEXT NOT NULL,
    attribute_id TEXT NOT NULL,
    attribute_value_id TEXT,
    text_value TEXT,
    number_value REAL,
    boolean_value INTEGER,
    created_at TEXT NOT NULL,
    updated_at TEXT NOT NULL,
    FOREIGN KEY (product_id) REFERENCES products(id) ON DELETE CASCADE,
    FOREIGN KEY (attribute_id) REFERENCES attributes(id) ON DELETE CASCADE,
    FOREIGN KEY (attribute_value_id) REFERENCES attribute_values(id) ON DELETE CASCADE
  );

  CREATE INDEX IF NOT EXISTS idx_products_slug ON products(slug);
  CREATE INDEX IF NOT EXISTS idx_products_sku ON products(sku);
  CREATE INDEX IF NOT EXISTS idx_products_status ON products(status);
  CREATE INDEX IF NOT EXISTS idx_products_product_type ON products(product_type);
  CREATE INDEX IF NOT EXISTS idx_products_category_id ON products(category_id);
  CREATE INDEX IF NOT EXISTS idx_products_is_featured ON products(is_featured);
  CREATE INDEX IF NOT EXISTS idx_products_is_new_arrival ON products(is_new_arrival);
  CREATE INDEX IF NOT EXISTS idx_products_is_bestseller ON products(is_bestseller);
  CREATE INDEX IF NOT EXISTS idx_products_sort_order ON products(sort_order);
  CREATE INDEX IF NOT EXISTS idx_products_price ON products(price);
  CREATE INDEX IF NOT EXISTS idx_products_created_at ON products(created_at);

  CREATE INDEX IF NOT EXISTS idx_prod_coll_prod_id ON product_collections(product_id);
  CREATE INDEX IF NOT EXISTS idx_prod_coll_coll_id ON product_collections(collection_id);

  CREATE INDEX IF NOT EXISTS idx_prod_attr_val_prod_id ON product_attribute_values(product_id);
  CREATE INDEX IF NOT EXISTS idx_prod_attr_val_attr_id ON product_attribute_values(attribute_id);
  CREATE INDEX IF NOT EXISTS idx_prod_attr_val_val_id ON product_attribute_values(attribute_value_id);

  CREATE TABLE IF NOT EXISTS product_options (
    id TEXT PRIMARY KEY,
    product_id TEXT NOT NULL,
    name TEXT NOT NULL,
    slug TEXT NOT NULL,
    sort_order INTEGER NOT NULL DEFAULT 0,
    created_at TEXT NOT NULL,
    updated_at TEXT NOT NULL,
    UNIQUE(product_id, slug),
    FOREIGN KEY (product_id) REFERENCES products(id) ON DELETE CASCADE
  );

  CREATE TABLE IF NOT EXISTS product_option_values (
    id TEXT PRIMARY KEY,
    product_option_id TEXT NOT NULL,
    value TEXT NOT NULL,
    slug TEXT NOT NULL,
    sort_order INTEGER NOT NULL DEFAULT 0,
    created_at TEXT NOT NULL,
    updated_at TEXT NOT NULL,
    UNIQUE(product_option_id, slug),
    FOREIGN KEY (product_option_id) REFERENCES product_options(id) ON DELETE CASCADE
  );

  CREATE TABLE IF NOT EXISTS product_variants (
    id TEXT PRIMARY KEY,
    product_id TEXT NOT NULL,
    sku TEXT UNIQUE NOT NULL,
    price REAL,
    compare_at_price REAL,
    cost_price REAL,
    stock_quantity INTEGER NOT NULL DEFAULT 0,
    low_stock_threshold INTEGER NOT NULL DEFAULT 5,
    track_inventory INTEGER NOT NULL DEFAULT 1,
    allow_backorder INTEGER NOT NULL DEFAULT 0,
    status TEXT NOT NULL DEFAULT 'ACTIVE',
    image TEXT,
    sort_order INTEGER NOT NULL DEFAULT 0,
    created_at TEXT NOT NULL,
    updated_at TEXT NOT NULL,
    FOREIGN KEY (product_id) REFERENCES products(id) ON DELETE CASCADE
  );

  CREATE TABLE IF NOT EXISTS product_variant_option_values (
    variant_id TEXT NOT NULL,
    option_value_id TEXT NOT NULL,
    PRIMARY KEY (variant_id, option_value_id),
    FOREIGN KEY (variant_id) REFERENCES product_variants(id) ON DELETE CASCADE,
    FOREIGN KEY (option_value_id) REFERENCES product_option_values(id) ON DELETE CASCADE
  );

  CREATE INDEX IF NOT EXISTS idx_prod_opt_prod_id ON product_options(product_id);
  CREATE INDEX IF NOT EXISTS idx_prod_opt_sort ON product_options(sort_order);

  CREATE INDEX IF NOT EXISTS idx_prod_opt_val_opt_id ON product_option_values(product_option_id);
  CREATE INDEX IF NOT EXISTS idx_prod_opt_val_sort ON product_option_values(sort_order);

  CREATE INDEX IF NOT EXISTS idx_prod_var_prod_id ON product_variants(product_id);
  CREATE INDEX IF NOT EXISTS idx_prod_var_sku ON product_variants(sku);
  CREATE INDEX IF NOT EXISTS idx_prod_var_status ON product_variants(status);
  CREATE INDEX IF NOT EXISTS idx_prod_var_sort ON product_variants(sort_order);
  CREATE INDEX IF NOT EXISTS idx_prod_var_price ON product_variants(price);

  CREATE INDEX IF NOT EXISTS idx_prod_var_opt_val_var_id ON product_variant_option_values(variant_id);
  CREATE INDEX IF NOT EXISTS idx_prod_var_opt_val_val_id ON product_variant_option_values(option_value_id);

  CREATE TABLE IF NOT EXISTS media_folders (
    id TEXT PRIMARY KEY,
    name TEXT NOT NULL,
    slug TEXT NOT NULL,
    parent_id TEXT,
    created_at TEXT NOT NULL,
    updated_at TEXT NOT NULL,
    UNIQUE(parent_id, slug),
    FOREIGN KEY (parent_id) REFERENCES media_folders(id) ON DELETE RESTRICT
  );

  CREATE TABLE IF NOT EXISTS media_assets (
    id TEXT PRIMARY KEY,
    filename TEXT NOT NULL,
    original_filename TEXT NOT NULL,
    storage_key TEXT UNIQUE NOT NULL,
    public_url TEXT NOT NULL,
    mime_type TEXT NOT NULL,
    media_type TEXT NOT NULL DEFAULT 'IMAGE',
    file_size INTEGER NOT NULL,
    width INTEGER,
    height INTEGER,
    checksum TEXT NOT NULL,
    title TEXT,
    alt_text TEXT,
    caption TEXT,
    folder_id TEXT,
    created_at TEXT NOT NULL,
    updated_at TEXT NOT NULL,
    FOREIGN KEY (folder_id) REFERENCES media_folders(id) ON DELETE SET NULL
  );

  CREATE TABLE IF NOT EXISTS product_media (
    product_id TEXT NOT NULL,
    media_id TEXT NOT NULL,
    sort_order INTEGER NOT NULL DEFAULT 0,
    is_primary INTEGER NOT NULL DEFAULT 0,
    role TEXT NOT NULL DEFAULT 'GALLERY',
    created_at TEXT NOT NULL,
    PRIMARY KEY (product_id, media_id),
    FOREIGN KEY (product_id) REFERENCES products(id) ON DELETE CASCADE,
    FOREIGN KEY (media_id) REFERENCES media_assets(id) ON DELETE RESTRICT
  );

  CREATE TABLE IF NOT EXISTS product_variant_media (
    variant_id TEXT NOT NULL,
    media_id TEXT NOT NULL,
    sort_order INTEGER NOT NULL DEFAULT 0,
    is_primary INTEGER NOT NULL DEFAULT 0,
    role TEXT NOT NULL DEFAULT 'GALLERY',
    created_at TEXT NOT NULL,
    PRIMARY KEY (variant_id, media_id),
    FOREIGN KEY (variant_id) REFERENCES product_variants(id) ON DELETE CASCADE,
    FOREIGN KEY (media_id) REFERENCES media_assets(id) ON DELETE RESTRICT
  );

  CREATE TABLE IF NOT EXISTS category_media (
    category_id TEXT NOT NULL,
    media_id TEXT NOT NULL,
    sort_order INTEGER NOT NULL DEFAULT 0,
    is_primary INTEGER NOT NULL DEFAULT 0,
    role TEXT NOT NULL DEFAULT 'PRIMARY',
    created_at TEXT NOT NULL,
    PRIMARY KEY (category_id, media_id),
    FOREIGN KEY (category_id) REFERENCES categories(id) ON DELETE CASCADE,
    FOREIGN KEY (media_id) REFERENCES media_assets(id) ON DELETE RESTRICT
  );

  CREATE TABLE IF NOT EXISTS collection_media (
    collection_id TEXT NOT NULL,
    media_id TEXT NOT NULL,
    sort_order INTEGER NOT NULL DEFAULT 0,
    is_primary INTEGER NOT NULL DEFAULT 0,
    role TEXT NOT NULL DEFAULT 'PRIMARY',
    created_at TEXT NOT NULL,
    PRIMARY KEY (collection_id, media_id),
    FOREIGN KEY (collection_id) REFERENCES collections(id) ON DELETE CASCADE,
    FOREIGN KEY (media_id) REFERENCES media_assets(id) ON DELETE RESTRICT
  );

  CREATE INDEX IF NOT EXISTS idx_media_folders_slug ON media_folders(slug);
  CREATE INDEX IF NOT EXISTS idx_media_folders_parent ON media_folders(parent_id);

  CREATE INDEX IF NOT EXISTS idx_media_assets_key ON media_assets(storage_key);
  CREATE INDEX IF NOT EXISTS idx_media_assets_mime ON media_assets(mime_type);
  CREATE INDEX IF NOT EXISTS idx_media_assets_folder ON media_assets(folder_id);
  CREATE INDEX IF NOT EXISTS idx_media_assets_checksum ON media_assets(checksum);
  CREATE INDEX IF NOT EXISTS idx_media_assets_created ON media_assets(created_at);

  CREATE INDEX IF NOT EXISTS idx_prod_media_prod_id ON product_media(product_id);
  CREATE INDEX IF NOT EXISTS idx_prod_media_media_id ON product_media(media_id);
  CREATE INDEX IF NOT EXISTS idx_prod_media_primary ON product_media(is_primary);
  CREATE INDEX IF NOT EXISTS idx_prod_media_sort ON product_media(sort_order);

  CREATE INDEX IF NOT EXISTS idx_var_media_var_id ON product_variant_media(variant_id);
  CREATE INDEX IF NOT EXISTS idx_var_media_media_id ON product_variant_media(media_id);
  CREATE INDEX IF NOT EXISTS idx_var_media_primary ON product_variant_media(is_primary);
  CREATE INDEX IF NOT EXISTS idx_var_media_sort ON product_variant_media(sort_order);

  CREATE INDEX IF NOT EXISTS idx_cat_media_cat_id ON category_media(category_id);
  CREATE INDEX IF NOT EXISTS idx_cat_media_media_id ON category_media(media_id);
  CREATE INDEX IF NOT EXISTS idx_cat_media_primary ON category_media(is_primary);
  CREATE INDEX IF NOT EXISTS idx_cat_media_sort ON category_media(sort_order);

  CREATE INDEX IF NOT EXISTS idx_col_media_col_id ON collection_media(collection_id);
  CREATE INDEX IF NOT EXISTS idx_col_media_media_id ON collection_media(media_id);
  CREATE INDEX IF NOT EXISTS idx_col_media_primary ON collection_media(is_primary);
  CREATE INDEX IF NOT EXISTS idx_col_media_sort ON collection_media(sort_order);
`);

/**
 * Prisma Client Compatible Model Operations
 */
export const prisma = {
  adminUser: {
    findUnique: ({ where, include }: { where: { id?: string; email?: string }; include?: { role?: boolean } }) => {
      let row: any = null;
      if (where.id) {
        row = db.prepare('SELECT * FROM admin_users WHERE id = ?').get(where.id);
      } else if (where.email) {
        row = db.prepare('SELECT * FROM admin_users WHERE LOWER(email) = LOWER(?)').get(where.email);
      }
      if (!row) return null;
      const formatted = {
        id: row.id,
        name: row.name,
        email: row.email,
        passwordHash: row.password_hash,
        status: row.status,
        roleId: row.role_id,
        lastLoginAt: row.last_login_at ? new Date(row.last_login_at) : null,
        passwordChangedAt: row.password_changed_at ? new Date(row.password_changed_at) : null,
        createdAt: new Date(row.created_at),
        updatedAt: new Date(row.updated_at),
        role: undefined as any
      };
      if (include?.role) {
        formatted.role = prisma.role.findUnique({ where: { id: row.role_id }, include: { permissions: true } });
      }
      return formatted;
    },

    findMany: ({ where, include, orderBy, take, skip }: any = {}) => {
      let sql = 'SELECT * FROM admin_users WHERE 1=1';
      const params: any[] = [];

      if (where?.status) {
        sql += ' AND status = ?';
        params.push(where.status);
      }
      if (where?.roleId) {
        sql += ' AND role_id = ?';
        params.push(where.roleId);
      }
      if (where?.search) {
        sql += ' AND (name LIKE ? OR email LIKE ?)';
        params.push(`%${where.search}%`, `%${where.search}%`);
      }

      sql += ' ORDER BY created_at DESC';
      if (take !== undefined) {
        sql += ` LIMIT ${take}`;
        if (skip !== undefined) {
          sql += ` OFFSET ${skip}`;
        }
      }

      const rows: any[] = db.prepare(sql).all(...params);
      return rows.map(r => ({
        id: r.id,
        name: r.name,
        email: r.email,
        passwordHash: r.password_hash,
        status: r.status,
        roleId: r.role_id,
        lastLoginAt: r.last_login_at ? new Date(r.last_login_at) : null,
        passwordChangedAt: r.password_changed_at ? new Date(r.password_changed_at) : null,
        createdAt: new Date(r.created_at),
        updatedAt: new Date(r.updated_at),
        role: include?.role ? prisma.role.findUnique({ where: { id: r.role_id } }) : undefined
      }));
    },

    count: ({ where }: any = {}) => {
      let sql = 'SELECT COUNT(*) as total FROM admin_users WHERE 1=1';
      const params: any[] = [];
      if (where?.status) {
        sql += ' AND status = ?';
        params.push(where.status);
      }
      if (where?.roleId) {
        sql += ' AND role_id = ?';
        params.push(where.roleId);
      }
      const res: any = db.prepare(sql).get(...params);
      return res?.total || 0;
    },

    create: ({ data, include }: { data: any; include?: any }) => {
      const id = data.id || randomUUID();
      const now = new Date().toISOString();
      db.prepare(`
        INSERT INTO admin_users (id, name, email, password_hash, status, role_id, created_at, updated_at)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?)
      `).run(
        id,
        data.name,
        data.email.toLowerCase(),
        data.passwordHash,
        data.status || 'ACTIVE',
        data.roleId,
        now,
        now
      );
      return prisma.adminUser.findUnique({ where: { id }, include });
    },

    update: ({ where, data, include }: { where: { id: string }; data: any; include?: any }) => {
      const updates: string[] = [];
      const params: any[] = [];
      const now = new Date().toISOString();

      if (data.name !== undefined) { updates.push('name = ?'); params.push(data.name); }
      if (data.email !== undefined) { updates.push('email = ?'); params.push(data.email.toLowerCase()); }
      if (data.passwordHash !== undefined) { updates.push('password_hash = ?'); params.push(data.passwordHash); }
      if (data.status !== undefined) { updates.push('status = ?'); params.push(data.status); }
      if (data.roleId !== undefined) { updates.push('role_id = ?'); params.push(data.roleId); }
      if (data.lastLoginAt !== undefined) { updates.push('last_login_at = ?'); params.push(data.lastLoginAt ? new Date(data.lastLoginAt).toISOString() : null); }
      if (data.passwordChangedAt !== undefined) { updates.push('password_changed_at = ?'); params.push(data.passwordChangedAt ? new Date(data.passwordChangedAt).toISOString() : null); }

      updates.push('updated_at = ?');
      params.push(now);
      params.push(where.id);

      db.prepare(`UPDATE admin_users SET ${updates.join(', ')} WHERE id = ?`).run(...params);
      return prisma.adminUser.findUnique({ where: { id: where.id }, include });
    },

    delete: ({ where }: { where: { id: string } }) => {
      const user = prisma.adminUser.findUnique({ where });
      db.prepare('DELETE FROM admin_users WHERE id = ?').run(where.id);
      return user;
    }
  },

  role: {
    findUnique: ({ where, include }: { where: { id?: string; slug?: string }; include?: { permissions?: boolean } }) => {
      let row: any = null;
      if (where.id) {
        row = db.prepare('SELECT * FROM roles WHERE id = ?').get(where.id);
      } else if (where.slug) {
        row = db.prepare('SELECT * FROM roles WHERE slug = ?').get(where.slug);
      }
      if (!row) return null;
      const formatted = {
        id: row.id,
        name: row.name,
        slug: row.slug,
        description: row.description,
        isSystem: Boolean(row.is_system),
        createdAt: new Date(row.created_at),
        updatedAt: new Date(row.updated_at),
        permissions: [] as any[]
      };
      if (include?.permissions) {
        const perms: any[] = db.prepare(`
          SELECT p.* FROM permissions p
          INNER JOIN role_permissions rp ON rp.permission_id = p.id
          WHERE rp.role_id = ?
        `).all(row.id);
        formatted.permissions = perms.map(p => ({
          id: p.id,
          name: p.name,
          slug: p.slug,
          description: p.description,
          module: p.module,
          createdAt: new Date(p.created_at),
          updatedAt: new Date(p.updated_at)
        }));
      }
      return formatted;
    },

    findMany: ({ include }: { include?: { permissions?: boolean } } = {}) => {
      const rows: any[] = db.prepare('SELECT * FROM roles ORDER BY is_system DESC, name ASC').all();
      return rows.map(r => prisma.role.findUnique({ where: { id: r.id }, include }));
    },

    upsert: ({ where, create, update }: any) => {
      const existing = prisma.role.findUnique({ where });
      if (existing) {
        const now = new Date().toISOString();
        db.prepare('UPDATE roles SET name = ?, description = ?, updated_at = ? WHERE id = ?')
          .run(update.name || existing.name, update.description ?? existing.description, now, existing.id);
        return prisma.role.findUnique({ where: { id: existing.id } });
      }
      const id = create.id || randomUUID();
      const now = new Date().toISOString();
      db.prepare('INSERT INTO roles (id, name, slug, description, is_system, created_at, updated_at) VALUES (?, ?, ?, ?, ?, ?, ?)')
        .run(id, create.name, create.slug, create.description || null, create.isSystem ? 1 : 0, now, now);
      return prisma.role.findUnique({ where: { id } });
    },

    create: ({ data }: { data: any }) => {
      const id = data.id || randomUUID();
      const now = new Date().toISOString();
      db.prepare('INSERT INTO roles (id, name, slug, description, is_system, created_at, updated_at) VALUES (?, ?, ?, ?, ?, ?, ?)')
        .run(id, data.name, data.slug, data.description || null, data.isSystem ? 1 : 0, now, now);
      return prisma.role.findUnique({ where: { id } });
    },

    update: ({ where, data }: { where: { id: string }; data: any }) => {
      const now = new Date().toISOString();
      db.prepare('UPDATE roles SET name = COALESCE(?, name), description = COALESCE(?, description), updated_at = ? WHERE id = ?')
        .run(data.name, data.description, now, where.id);
      return prisma.role.findUnique({ where });
    },

    delete: ({ where }: { where: { id: string } }) => {
      const role = prisma.role.findUnique({ where });
      db.prepare('DELETE FROM roles WHERE id = ?').run(where.id);
      return role;
    }
  },

  permission: {
    findUnique: ({ where }: { where: { id?: string; slug?: string } }) => {
      let row: any = null;
      if (where.id) row = db.prepare('SELECT * FROM permissions WHERE id = ?').get(where.id);
      else if (where.slug) row = db.prepare('SELECT * FROM permissions WHERE slug = ?').get(where.slug);
      if (!row) return null;
      return {
        id: row.id,
        name: row.name,
        slug: row.slug,
        description: row.description,
        module: row.module,
        createdAt: new Date(row.created_at),
        updatedAt: new Date(row.updated_at)
      };
    },

    findMany: ({ where }: any = {}) => {
      let sql = 'SELECT * FROM permissions WHERE 1=1';
      const params: any[] = [];
      if (where?.module) {
        sql += ' AND module = ?';
        params.push(where.module);
      }
      sql += ' ORDER BY module ASC, slug ASC';
      const rows: any[] = db.prepare(sql).all(...params);
      return rows.map(p => ({
        id: p.id,
        name: p.name,
        slug: p.slug,
        description: p.description,
        module: p.module,
        createdAt: new Date(p.created_at),
        updatedAt: new Date(p.updated_at)
      }));
    },

    upsert: ({ where, create }: any) => {
      const existing = prisma.permission.findUnique({ where });
      if (existing) return existing;
      const id = create.id || randomUUID();
      const now = new Date().toISOString();
      db.prepare('INSERT INTO permissions (id, name, slug, description, module, created_at, updated_at) VALUES (?, ?, ?, ?, ?, ?, ?)')
        .run(id, create.name, create.slug, create.description || null, create.module, now, now);
      return prisma.permission.findUnique({ where: { id } });
    }
  },

  rolePermission: {
    upsert: ({ where, create }: any) => {
      const now = new Date().toISOString();
      db.prepare(`
        INSERT OR IGNORE INTO role_permissions (role_id, permission_id, created_at)
        VALUES (?, ?, ?)
      `).run(create.roleId, create.permissionId, now);
    },

    deleteMany: ({ where }: { where: { roleId: string } }) => {
      return db.prepare('DELETE FROM role_permissions WHERE role_id = ?').run(where.roleId);
    },

    createMany: ({ data }: { data: { roleId: string; permissionId: string }[] }) => {
      const now = new Date().toISOString();
      const stmt = db.prepare('INSERT OR IGNORE INTO role_permissions (role_id, permission_id, created_at) VALUES (?, ?, ?)');
      for (const item of data) {
        stmt.run(item.roleId, item.permissionId, now);
      }
    }
  },

  adminSession: {
    findFirst: ({ where }: { where: { refreshTokenHash?: string; id?: string } }) => {
      let row: any = null;
      if (where.refreshTokenHash) {
        row = db.prepare('SELECT * FROM admin_sessions WHERE refresh_token_hash = ?').get(where.refreshTokenHash);
      } else if (where.id) {
        row = db.prepare('SELECT * FROM admin_sessions WHERE id = ?').get(where.id);
      }
      if (!row) return null;
      return {
        id: row.id,
        adminUserId: row.admin_user_id,
        refreshTokenHash: row.refresh_token_hash,
        userAgent: row.user_agent,
        ipAddress: row.ip_address,
        expiresAt: new Date(row.expires_at),
        revokedAt: row.revoked_at ? new Date(row.revoked_at) : null,
        createdAt: new Date(row.created_at),
        lastUsedAt: new Date(row.last_used_at)
      };
    },

    create: ({ data }: { data: any }) => {
      const id = data.id || randomUUID();
      const now = new Date().toISOString();
      db.prepare(`
        INSERT INTO admin_sessions (id, admin_user_id, refresh_token_hash, user_agent, ip_address, expires_at, created_at, last_used_at)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?)
      `).run(
        id,
        data.adminUserId,
        data.refreshTokenHash,
        data.userAgent || null,
        data.ipAddress || null,
        new Date(data.expiresAt).toISOString(),
        now,
        now
      );
      return prisma.adminSession.findFirst({ where: { id } });
    },

    update: ({ where, data }: { where: { id?: string; refreshTokenHash?: string }; data: any }) => {
      const updates: string[] = [];
      const params: any[] = [];
      if (data.revokedAt !== undefined) {
        updates.push('revoked_at = ?');
        params.push(data.revokedAt ? new Date(data.revokedAt).toISOString() : null);
      }
      if (data.refreshTokenHash !== undefined) {
        updates.push('refresh_token_hash = ?');
        params.push(data.refreshTokenHash);
      }
      if (data.lastUsedAt !== undefined) {
        updates.push('last_used_at = ?');
        params.push(new Date(data.lastUsedAt).toISOString());
      }
      if (data.expiresAt !== undefined) {
        updates.push('expires_at = ?');
        params.push(new Date(data.expiresAt).toISOString());
      }

      if (where.id) {
        params.push(where.id);
        db.prepare(`UPDATE admin_sessions SET ${updates.join(', ')} WHERE id = ?`).run(...params);
      } else if (where.refreshTokenHash) {
        params.push(where.refreshTokenHash);
        db.prepare(`UPDATE admin_sessions SET ${updates.join(', ')} WHERE refresh_token_hash = ?`).run(...params);
      }
    },

    revokeAllForUser: (adminUserId: string) => {
      const now = new Date().toISOString();
      return db.prepare('UPDATE admin_sessions SET revoked_at = ? WHERE admin_user_id = ? AND revoked_at IS NULL')
        .run(now, adminUserId);
    }
  },

  adminPasswordReset: {
    findFirst: ({ where }: { where: { tokenHash: string } }) => {
      const row: any = db.prepare('SELECT * FROM admin_password_resets WHERE token_hash = ?').get(where.tokenHash);
      if (!row) return null;
      return {
        id: row.id,
        adminUserId: row.admin_user_id,
        tokenHash: row.token_hash,
        expiresAt: new Date(row.expires_at),
        usedAt: row.used_at ? new Date(row.used_at) : null,
        createdAt: new Date(row.created_at)
      };
    },

    create: ({ data }: { data: any }) => {
      const id = data.id || randomUUID();
      const now = new Date().toISOString();
      db.prepare(`
        INSERT INTO admin_password_resets (id, admin_user_id, token_hash, expires_at, created_at)
        VALUES (?, ?, ?, ?, ?)
      `).run(
        id,
        data.adminUserId,
        data.tokenHash,
        new Date(data.expiresAt).toISOString(),
        now
      );
      return prisma.adminPasswordReset.findFirst({ where: { tokenHash: data.tokenHash } });
    },

    update: ({ where, data }: { where: { id: string }; data: any }) => {
      if (data.usedAt) {
        db.prepare('UPDATE admin_password_resets SET used_at = ? WHERE id = ?')
          .run(new Date(data.usedAt).toISOString(), where.id);
      }
    }
  },

  adminAuditLog: {
    create: ({ data }: { data: any }) => {
      const id = data.id || randomUUID();
      const now = new Date().toISOString();
      db.prepare(`
        INSERT INTO admin_audit_logs (id, admin_user_id, action, module, entity_type, entity_id, old_values, new_values, ip_address, user_agent, created_at)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      `).run(
        id,
        data.adminUserId || null,
        data.action,
        data.module,
        data.entityType || null,
        data.entityId || null,
        data.oldValues ? JSON.stringify(data.oldValues) : null,
        data.newValues ? JSON.stringify(data.newValues) : null,
        data.ipAddress || null,
        data.userAgent || null,
        now
      );
    },

    findMany: ({ where, take, skip }: any = {}) => {
      let sql = 'SELECT * FROM admin_audit_logs WHERE 1=1';
      const params: any[] = [];
      if (where?.adminUserId) { sql += ' AND admin_user_id = ?'; params.push(where.adminUserId); }
      if (where?.module) { sql += ' AND module = ?'; params.push(where.module); }
      if (where?.action) { sql += ' AND action = ?'; params.push(where.action); }
      sql += ' ORDER BY created_at DESC';
      if (take !== undefined) sql += ` LIMIT ${take}`;
      if (skip !== undefined) sql += ` OFFSET ${skip}`;
      const rows: any[] = db.prepare(sql).all(...params);
      return rows.map(r => ({
        id: r.id,
        adminUserId: r.admin_user_id,
        action: r.action,
        module: r.module,
        entityType: r.entity_type,
        entityId: r.entity_id,
        oldValues: r.old_values ? JSON.parse(r.old_values) : null,
        newValues: r.new_values ? JSON.parse(r.new_values) : null,
        ipAddress: r.ip_address,
        userAgent: r.user_agent,
        createdAt: new Date(r.created_at)
      }));
    },

    findFirst: ({ where }: any = {}) => {
      const results = prisma.adminAuditLog.findMany({ where, take: 1 });
      return results.length > 0 ? results[0] : null;
    }
  },

  category: {
    findUnique: ({ where, include }: { where: { id?: string; slug?: string }; include?: { parent?: boolean; children?: boolean } }) => {
      let row: any = null;
      if (where.id) {
        row = db.prepare('SELECT * FROM categories WHERE id = ?').get(where.id);
      } else if (where.slug) {
        row = db.prepare('SELECT * FROM categories WHERE LOWER(slug) = LOWER(?)').get(where.slug);
      }
      if (!row) return null;

      const formatted: any = {
        id: row.id,
        name: row.name,
        slug: row.slug,
        parentId: row.parent_id || null,
        shortDescription: row.short_description || null,
        description: row.description || null,
        image: row.image || null,
        imageAlt: row.image_alt || null,
        bannerImage: row.banner_image || null,
        bannerImageAlt: row.banner_image_alt || null,
        status: row.status,
        isFeatured: Boolean(row.is_featured),
        sortOrder: Number(row.sort_order || 0),
        metaTitle: row.meta_title || null,
        metaDescription: row.meta_description || null,
        canonicalUrl: row.canonical_url || null,
        ogTitle: row.og_title || null,
        ogDescription: row.og_description || null,
        ogImage: row.og_image || null,
        createdAt: new Date(row.created_at),
        updatedAt: new Date(row.updated_at)
      };

      if (include?.parent && row.parent_id) {
        formatted.parent = prisma.category.findUnique({ where: { id: row.parent_id } });
      }
      if (include?.children) {
        formatted.children = prisma.category.findMany({ where: { parentId: row.id } });
      }
      if (include?.media) {
        formatted.media = prisma.categoryMedia.findMany({
          where: { categoryId: row.id },
          include: { media: true }
        });
      }

      return formatted;
    },

    findFirst: ({ where, include }: any = {}) => {
      let sql = 'SELECT * FROM categories WHERE 1=1';
      const params: any[] = [];

      if (where?.id) { sql += ' AND id = ?'; params.push(where.id); }
      if (where?.slug) { sql += ' AND LOWER(slug) = LOWER(?)'; params.push(where.slug); }
      if (where?.parentId !== undefined) {
        if (where.parentId === null) {
          sql += ' AND parent_id IS NULL';
        } else {
          sql += ' AND parent_id = ?';
          params.push(where.parentId);
        }
      }
      if (where?.name) {
        sql += ' AND LOWER(name) = LOWER(?)';
        params.push(where.name);
      }
      if (where?.status) { sql += ' AND status = ?'; params.push(where.status); }

      const row: any = db.prepare(sql).get(...params);
      if (!row) return null;
      return prisma.category.findUnique({ where: { id: row.id }, include });
    },

    findMany: ({ where, include, orderBy, take, skip }: any = {}) => {
      let sql = 'SELECT * FROM categories WHERE 1=1';
      const params: any[] = [];

      if (where?.status) {
        sql += ' AND status = ?';
        params.push(where.status);
      }
      if (where?.parentId !== undefined) {
        if (where.parentId === null) {
          sql += ' AND parent_id IS NULL';
        } else {
          sql += ' AND parent_id = ?';
          params.push(where.parentId);
        }
      }
      if (where?.isFeatured !== undefined) {
        sql += ' AND is_featured = ?';
        params.push(where.isFeatured ? 1 : 0);
      }
      if (where?.search) {
        sql += ' AND (name LIKE ? OR slug LIKE ? OR short_description LIKE ?)';
        params.push(`%${where.search}%`, `%${where.search}%`, `%${where.search}%`);
      }

      // Order By
      if (orderBy) {
        const field = orderBy.name ? 'name' : orderBy.sortOrder ? 'sort_order' : orderBy.createdAt ? 'created_at' : 'sort_order';
        const dir = (orderBy.name || orderBy.sortOrder || orderBy.createdAt || 'asc').toUpperCase();
        sql += ` ORDER BY ${field} ${dir}`;
      } else {
        sql += ' ORDER BY sort_order ASC, name ASC';
      }

      if (take !== undefined) {
        sql += ` LIMIT ${take}`;
        if (skip !== undefined) {
          sql += ` OFFSET ${skip}`;
        }
      }

      const rows: any[] = db.prepare(sql).all(...params);
      return rows.map(r => prisma.category.findUnique({ where: { id: r.id }, include }));
    },

    count: ({ where }: any = {}) => {
      let sql = 'SELECT COUNT(*) as total FROM categories WHERE 1=1';
      const params: any[] = [];

      if (where?.status) { sql += ' AND status = ?'; params.push(where.status); }
      if (where?.parentId !== undefined) {
        if (where.parentId === null) sql += ' AND parent_id IS NULL';
        else { sql += ' AND parent_id = ?'; params.push(where.parentId); }
      }
      if (where?.isFeatured !== undefined) {
        sql += ' AND is_featured = ?';
        params.push(where.isFeatured ? 1 : 0);
      }
      if (where?.search) {
        sql += ' AND (name LIKE ? OR slug LIKE ? OR short_description LIKE ?)';
        params.push(`%${where.search}%`, `%${where.search}%`, `%${where.search}%`);
      }

      const res: any = db.prepare(sql).get(...params);
      return res?.total || 0;
    },

    create: ({ data, include }: { data: any; include?: any }) => {
      const id = data.id || randomUUID();
      const now = new Date().toISOString();
      db.prepare(`
        INSERT INTO categories (
          id, name, slug, parent_id, short_description, description,
          image, image_alt, banner_image, banner_image_alt,
          status, is_featured, sort_order, meta_title, meta_description,
          canonical_url, og_title, og_description, og_image, created_at, updated_at
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      `).run(
        id,
        data.name.trim(),
        data.slug.toLowerCase().trim(),
        data.parentId || null,
        data.shortDescription || null,
        data.description || null,
        data.image || null,
        data.imageAlt || null,
        data.bannerImage || null,
        data.bannerImageAlt || null,
        data.status || 'ACTIVE',
        data.isFeatured ? 1 : 0,
        data.sortOrder !== undefined ? Number(data.sortOrder) : 0,
        data.metaTitle || null,
        data.metaDescription || null,
        data.canonicalUrl || null,
        data.ogTitle || null,
        data.ogDescription || null,
        data.ogImage || null,
        now,
        now
      );
      return prisma.category.findUnique({ where: { id }, include });
    },

    update: ({ where, data, include }: { where: { id: string }; data: any; include?: any }) => {
      const updates: string[] = [];
      const params: any[] = [];
      const now = new Date().toISOString();

      if (data.name !== undefined) { updates.push('name = ?'); params.push(data.name.trim()); }
      if (data.slug !== undefined) { updates.push('slug = ?'); params.push(data.slug.toLowerCase().trim()); }
      if (data.parentId !== undefined) { updates.push('parent_id = ?'); params.push(data.parentId); }
      if (data.shortDescription !== undefined) { updates.push('short_description = ?'); params.push(data.shortDescription); }
      if (data.description !== undefined) { updates.push('description = ?'); params.push(data.description); }
      if (data.image !== undefined) { updates.push('image = ?'); params.push(data.image); }
      if (data.imageAlt !== undefined) { updates.push('image_alt = ?'); params.push(data.imageAlt); }
      if (data.bannerImage !== undefined) { updates.push('banner_image = ?'); params.push(data.bannerImage); }
      if (data.bannerImageAlt !== undefined) { updates.push('banner_image_alt = ?'); params.push(data.bannerImageAlt); }
      if (data.status !== undefined) { updates.push('status = ?'); params.push(data.status); }
      if (data.isFeatured !== undefined) { updates.push('is_featured = ?'); params.push(data.isFeatured ? 1 : 0); }
      if (data.sortOrder !== undefined) { updates.push('sort_order = ?'); params.push(Number(data.sortOrder)); }
      if (data.metaTitle !== undefined) { updates.push('meta_title = ?'); params.push(data.metaTitle); }
      if (data.metaDescription !== undefined) { updates.push('meta_description = ?'); params.push(data.metaDescription); }
      if (data.canonicalUrl !== undefined) { updates.push('canonical_url = ?'); params.push(data.canonicalUrl); }
      if (data.ogTitle !== undefined) { updates.push('og_title = ?'); params.push(data.ogTitle); }
      if (data.ogDescription !== undefined) { updates.push('og_description = ?'); params.push(data.ogDescription); }
      if (data.ogImage !== undefined) { updates.push('og_image = ?'); params.push(data.ogImage); }

      updates.push('updated_at = ?');
      params.push(now);
      params.push(where.id);

      db.prepare(`UPDATE categories SET ${updates.join(', ')} WHERE id = ?`).run(...params);
      return prisma.category.findUnique({ where: { id: where.id }, include });
    },

    delete: ({ where }: { where: { id: string } }) => {
      const category = prisma.category.findUnique({ where });
      db.prepare('DELETE FROM categories WHERE id = ?').run(where.id);
      return category;
    }
  },

  attribute: {
    findUnique: ({ where, include }: { where: { id?: string; slug?: string }; include?: { values?: boolean; categoryAttributes?: boolean } }) => {
      let row: any = null;
      if (where.id) {
        row = db.prepare('SELECT * FROM attributes WHERE id = ?').get(where.id);
      } else if (where.slug) {
        row = db.prepare('SELECT * FROM attributes WHERE LOWER(slug) = LOWER(?)').get(where.slug);
      }
      if (!row) return null;

      const formatted: any = {
        id: row.id,
        name: row.name,
        slug: row.slug,
        type: row.type,
        description: row.description || null,
        status: row.status,
        isFilterable: Boolean(row.is_filterable),
        isRequired: Boolean(row.is_required),
        isSystem: Boolean(row.is_system),
        sortOrder: Number(row.sort_order || 0),
        createdAt: new Date(row.created_at),
        updatedAt: new Date(row.updated_at)
      };

      if (include?.values) {
        formatted.values = prisma.attributeValue.findMany({ where: { attributeId: row.id } });
      }
      if (include?.categoryAttributes) {
        formatted.categoryAttributes = prisma.categoryAttribute.findMany({ where: { attributeId: row.id } });
      }

      return formatted;
    },

    findFirst: ({ where, include }: any = {}) => {
      let sql = 'SELECT * FROM attributes WHERE 1=1';
      const params: any[] = [];

      if (where?.id) { sql += ' AND id = ?'; params.push(where.id); }
      if (where?.slug) { sql += ' AND LOWER(slug) = LOWER(?)'; params.push(where.slug); }
      if (where?.name) { sql += ' AND LOWER(name) = LOWER(?)'; params.push(where.name); }
      if (where?.status) { sql += ' AND status = ?'; params.push(where.status); }
      if (where?.type) { sql += ' AND type = ?'; params.push(where.type); }
      if (where?.isFilterable !== undefined) {
        sql += ' AND is_filterable = ?';
        params.push(where.isFilterable ? 1 : 0);
      }

      const row: any = db.prepare(sql).get(...params);
      if (!row) return null;
      return prisma.attribute.findUnique({ where: { id: row.id }, include });
    },

    findMany: ({ where, include, orderBy, take, skip }: any = {}) => {
      let sql = 'SELECT * FROM attributes WHERE 1=1';
      const params: any[] = [];

      if (where?.status) { sql += ' AND status = ?'; params.push(where.status); }
      if (where?.type) { sql += ' AND type = ?'; params.push(where.type); }
      if (where?.isFilterable !== undefined) {
        sql += ' AND is_filterable = ?';
        params.push(where.isFilterable ? 1 : 0);
      }
      if (where?.search) {
        sql += ' AND (name LIKE ? OR slug LIKE ? OR description LIKE ?)';
        params.push(`%${where.search}%`, `%${where.search}%`, `%${where.search}%`);
      }

      if (orderBy) {
        const field = orderBy.name ? 'name' : orderBy.sortOrder ? 'sort_order' : orderBy.createdAt ? 'created_at' : 'sort_order';
        const dir = (orderBy.name || orderBy.sortOrder || orderBy.createdAt || 'asc').toUpperCase();
        sql += ` ORDER BY ${field} ${dir}`;
      } else {
        sql += ' ORDER BY sort_order ASC, name ASC';
      }

      if (take !== undefined) {
        sql += ` LIMIT ${take}`;
        if (skip !== undefined) sql += ` OFFSET ${skip}`;
      }

      const rows: any[] = db.prepare(sql).all(...params);
      return rows.map(r => prisma.attribute.findUnique({ where: { id: r.id }, include }));
    },

    count: ({ where }: any = {}) => {
      let sql = 'SELECT COUNT(*) as total FROM attributes WHERE 1=1';
      const params: any[] = [];

      if (where?.status) { sql += ' AND status = ?'; params.push(where.status); }
      if (where?.type) { sql += ' AND type = ?'; params.push(where.type); }
      if (where?.isFilterable !== undefined) {
        sql += ' AND is_filterable = ?';
        params.push(where.isFilterable ? 1 : 0);
      }
      if (where?.search) {
        sql += ' AND (name LIKE ? OR slug LIKE ? OR description LIKE ?)';
        params.push(`%${where.search}%`, `%${where.search}%`, `%${where.search}%`);
      }

      const res: any = db.prepare(sql).get(...params);
      return res?.total || 0;
    },

    create: ({ data, include }: { data: any; include?: any }) => {
      const id = data.id || randomUUID();
      const now = new Date().toISOString();
      db.prepare(`
        INSERT INTO attributes (
          id, name, slug, type, description, status,
          is_filterable, is_required, is_system, sort_order, created_at, updated_at
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      `).run(
        id,
        data.name.trim(),
        data.slug.toLowerCase().trim(),
        data.type || 'MULTI_SELECT',
        data.description || null,
        data.status || 'ACTIVE',
        data.isFilterable !== undefined ? (data.isFilterable ? 1 : 0) : 1,
        data.isRequired ? 1 : 0,
        data.isSystem ? 1 : 0,
        data.sortOrder !== undefined ? Number(data.sortOrder) : 0,
        now,
        now
      );
      return prisma.attribute.findUnique({ where: { id }, include });
    },

    update: ({ where, data, include }: { where: { id: string }; data: any; include?: any }) => {
      const updates: string[] = [];
      const params: any[] = [];
      const now = new Date().toISOString();

      if (data.name !== undefined) { updates.push('name = ?'); params.push(data.name.trim()); }
      if (data.slug !== undefined) { updates.push('slug = ?'); params.push(data.slug.toLowerCase().trim()); }
      if (data.type !== undefined) { updates.push('type = ?'); params.push(data.type); }
      if (data.description !== undefined) { updates.push('description = ?'); params.push(data.description); }
      if (data.status !== undefined) { updates.push('status = ?'); params.push(data.status); }
      if (data.isFilterable !== undefined) { updates.push('is_filterable = ?'); params.push(data.isFilterable ? 1 : 0); }
      if (data.isRequired !== undefined) { updates.push('is_required = ?'); params.push(data.isRequired ? 1 : 0); }
      if (data.isSystem !== undefined) { updates.push('is_system = ?'); params.push(data.isSystem ? 1 : 0); }
      if (data.sortOrder !== undefined) { updates.push('sort_order = ?'); params.push(Number(data.sortOrder)); }

      updates.push('updated_at = ?');
      params.push(now);
      params.push(where.id);

      db.prepare(`UPDATE attributes SET ${updates.join(', ')} WHERE id = ?`).run(...params);
      return prisma.attribute.findUnique({ where: { id: where.id }, include });
    },

    delete: ({ where }: { where: { id: string } }) => {
      const attribute = prisma.attribute.findUnique({ where });
      db.prepare('DELETE FROM attributes WHERE id = ?').run(where.id);
      return attribute;
    }
  },

  attributeValue: {
    findUnique: ({ where, include }: { where: { id?: string; attributeId_slug?: { attributeId: string; slug: string } }; include?: any }) => {
      let row: any = null;
      if (where.id) {
        row = db.prepare('SELECT * FROM attribute_values WHERE id = ?').get(where.id);
      } else if (where.attributeId_slug) {
        row = db.prepare('SELECT * FROM attribute_values WHERE attribute_id = ? AND LOWER(slug) = LOWER(?)')
          .get(where.attributeId_slug.attributeId, where.attributeId_slug.slug);
      }
      if (!row) return null;

      const formatted: any = {
        id: row.id,
        attributeId: row.attribute_id,
        name: row.name,
        slug: row.slug,
        description: row.description || null,
        sortOrder: Number(row.sort_order || 0),
        status: row.status,
        createdAt: new Date(row.created_at),
        updatedAt: new Date(row.updated_at)
      };

      if (include?.attribute) {
        formatted.attribute = prisma.attribute.findUnique({ where: { id: row.attribute_id } });
      }

      return formatted;
    },

    findFirst: ({ where, include }: any = {}) => {
      let sql = 'SELECT * FROM attribute_values WHERE 1=1';
      const params: any[] = [];

      if (where?.id) { sql += ' AND id = ?'; params.push(where.id); }
      if (where?.attributeId) { sql += ' AND attribute_id = ?'; params.push(where.attributeId); }
      if (where?.slug) { sql += ' AND LOWER(slug) = LOWER(?)'; params.push(where.slug); }
      if (where?.name) { sql += ' AND LOWER(name) = LOWER(?)'; params.push(where.name); }
      if (where?.status) { sql += ' AND status = ?'; params.push(where.status); }

      const row: any = db.prepare(sql).get(...params);
      if (!row) return null;
      return prisma.attributeValue.findUnique({ where: { id: row.id }, include });
    },

    findMany: ({ where, include, orderBy, take, skip }: any = {}) => {
      let sql = 'SELECT * FROM attribute_values WHERE 1=1';
      const params: any[] = [];

      if (where?.attributeId) { sql += ' AND attribute_id = ?'; params.push(where.attributeId); }
      if (where?.status) { sql += ' AND status = ?'; params.push(where.status); }
      if (where?.search) {
        sql += ' AND (name LIKE ? OR slug LIKE ?)';
        params.push(`%${where.search}%`, `%${where.search}%`);
      }

      if (orderBy) {
        const field = orderBy.name ? 'name' : orderBy.sortOrder ? 'sort_order' : orderBy.createdAt ? 'created_at' : 'sort_order';
        const dir = (orderBy.name || orderBy.sortOrder || orderBy.createdAt || 'asc').toUpperCase();
        sql += ` ORDER BY ${field} ${dir}`;
      } else {
        sql += ' ORDER BY sort_order ASC, name ASC';
      }

      if (take !== undefined) {
        sql += ` LIMIT ${take}`;
        if (skip !== undefined) sql += ` OFFSET ${skip}`;
      }

      const rows: any[] = db.prepare(sql).all(...params);
      return rows.map(r => prisma.attributeValue.findUnique({ where: { id: r.id }, include }));
    },

    count: ({ where }: any = {}) => {
      let sql = 'SELECT COUNT(*) as total FROM attribute_values WHERE 1=1';
      const params: any[] = [];

      if (where?.attributeId) { sql += ' AND attribute_id = ?'; params.push(where.attributeId); }
      if (where?.status) { sql += ' AND status = ?'; params.push(where.status); }
      if (where?.search) {
        sql += ' AND (name LIKE ? OR slug LIKE ?)';
        params.push(`%${where.search}%`, `%${where.search}%`);
      }

      const res: any = db.prepare(sql).get(...params);
      return res?.total || 0;
    },

    create: ({ data, include }: { data: any; include?: any }) => {
      const id = data.id || randomUUID();
      const now = new Date().toISOString();
      db.prepare(`
        INSERT INTO attribute_values (
          id, attribute_id, name, slug, description, sort_order, status, created_at, updated_at
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
      `).run(
        id,
        data.attributeId,
        data.name.trim(),
        data.slug.toLowerCase().trim(),
        data.description || null,
        data.sortOrder !== undefined ? Number(data.sortOrder) : 0,
        data.status || 'ACTIVE',
        now,
        now
      );
      return prisma.attributeValue.findUnique({ where: { id }, include });
    },

    update: ({ where, data, include }: { where: { id: string }; data: any; include?: any }) => {
      const updates: string[] = [];
      const params: any[] = [];
      const now = new Date().toISOString();

      if (data.name !== undefined) { updates.push('name = ?'); params.push(data.name.trim()); }
      if (data.slug !== undefined) { updates.push('slug = ?'); params.push(data.slug.toLowerCase().trim()); }
      if (data.description !== undefined) { updates.push('description = ?'); params.push(data.description); }
      if (data.sortOrder !== undefined) { updates.push('sort_order = ?'); params.push(Number(data.sortOrder)); }
      if (data.status !== undefined) { updates.push('status = ?'); params.push(data.status); }

      updates.push('updated_at = ?');
      params.push(now);
      params.push(where.id);

      db.prepare(`UPDATE attribute_values SET ${updates.join(', ')} WHERE id = ?`).run(...params);
      return prisma.attributeValue.findUnique({ where: { id: where.id }, include });
    },

    delete: ({ where }: { where: { id: string } }) => {
      const value = prisma.attributeValue.findUnique({ where });
      db.prepare('DELETE FROM attribute_values WHERE id = ?').run(where.id);
      return value;
    }
  },

  categoryAttribute: {
    findUnique: ({ where, include }: { where: { categoryId_attributeId: { categoryId: string; attributeId: string } }; include?: any }) => {
      const row: any = db.prepare('SELECT * FROM category_attributes WHERE category_id = ? AND attribute_id = ?')
        .get(where.categoryId_attributeId.categoryId, where.categoryId_attributeId.attributeId);
      if (!row) return null;

      const formatted: any = {
        categoryId: row.category_id,
        attributeId: row.attribute_id,
        sortOrder: Number(row.sort_order || 0),
        isVisible: Boolean(row.is_visible),
        isRequired: Boolean(row.is_required),
        createdAt: new Date(row.created_at),
        updatedAt: new Date(row.updated_at)
      };

      if (include?.attribute) {
        formatted.attribute = prisma.attribute.findUnique({
          where: { id: row.attribute_id },
          include: { values: true }
        });
      }
      if (include?.category) {
        formatted.category = prisma.category.findUnique({ where: { id: row.category_id } });
      }

      return formatted;
    },

    findFirst: ({ where, include }: any = {}) => {
      let sql = 'SELECT * FROM category_attributes WHERE 1=1';
      const params: any[] = [];

      if (where?.categoryId) { sql += ' AND category_id = ?'; params.push(where.categoryId); }
      if (where?.attributeId) { sql += ' AND attribute_id = ?'; params.push(where.attributeId); }
      if (where?.isVisible !== undefined) {
        sql += ' AND is_visible = ?';
        params.push(where.isVisible ? 1 : 0);
      }

      const row: any = db.prepare(sql).get(...params);
      if (!row) return null;
      return prisma.categoryAttribute.findUnique({
        where: { categoryId_attributeId: { categoryId: row.category_id, attributeId: row.attribute_id } },
        include
      });
    },

    findMany: ({ where, include, orderBy }: any = {}) => {
      let sql = 'SELECT * FROM category_attributes WHERE 1=1';
      const params: any[] = [];

      if (where?.categoryId) { sql += ' AND category_id = ?'; params.push(where.categoryId); }
      if (where?.attributeId) { sql += ' AND attribute_id = ?'; params.push(where.attributeId); }
      if (where?.isVisible !== undefined) {
        sql += ' AND is_visible = ?';
        params.push(where.isVisible ? 1 : 0);
      }

      if (orderBy?.sortOrder) {
        sql += ` ORDER BY sort_order ${orderBy.sortOrder.toUpperCase()}`;
      } else {
        sql += ' ORDER BY sort_order ASC';
      }

      const rows: any[] = db.prepare(sql).all(...params);
      return rows.map(r => prisma.categoryAttribute.findUnique({
        where: { categoryId_attributeId: { categoryId: r.category_id, attributeId: r.attribute_id } },
        include
      }));
    },

    count: ({ where }: any = {}) => {
      let sql = 'SELECT COUNT(*) as total FROM category_attributes WHERE 1=1';
      const params: any[] = [];

      if (where?.categoryId) { sql += ' AND category_id = ?'; params.push(where.categoryId); }
      if (where?.attributeId) { sql += ' AND attribute_id = ?'; params.push(where.attributeId); }

      const res: any = db.prepare(sql).get(...params);
      return res?.total || 0;
    },

    create: ({ data, include }: { data: any; include?: any }) => {
      const now = new Date().toISOString();
      db.prepare(`
        INSERT INTO category_attributes (
          category_id, attribute_id, sort_order, is_visible, is_required, created_at, updated_at
        ) VALUES (?, ?, ?, ?, ?, ?, ?)
      `).run(
        data.categoryId,
        data.attributeId,
        data.sortOrder !== undefined ? Number(data.sortOrder) : 0,
        data.isVisible !== undefined ? (data.isVisible ? 1 : 0) : 1,
        data.isRequired ? 1 : 0,
        now,
        now
      );
      return prisma.categoryAttribute.findUnique({
        where: { categoryId_attributeId: { categoryId: data.categoryId, attributeId: data.attributeId } },
        include
      });
    },

    update: ({ where, data, include }: { where: { categoryId_attributeId: { categoryId: string; attributeId: string } }; data: any; include?: any }) => {
      const updates: string[] = [];
      const params: any[] = [];
      const now = new Date().toISOString();

      if (data.sortOrder !== undefined) { updates.push('sort_order = ?'); params.push(Number(data.sortOrder)); }
      if (data.isVisible !== undefined) { updates.push('is_visible = ?'); params.push(data.isVisible ? 1 : 0); }
      if (data.isRequired !== undefined) { updates.push('is_required = ?'); params.push(data.isRequired ? 1 : 0); }

      updates.push('updated_at = ?');
      params.push(now);
      params.push(where.categoryId_attributeId.categoryId);
      params.push(where.categoryId_attributeId.attributeId);

      db.prepare(`UPDATE category_attributes SET ${updates.join(', ')} WHERE category_id = ? AND attribute_id = ?`).run(...params);
      return prisma.categoryAttribute.findUnique({ where, include });
    },

    delete: ({ where }: { where: { categoryId_attributeId: { categoryId: string; attributeId: string } } }) => {
      const binding = prisma.categoryAttribute.findUnique({ where });
      db.prepare('DELETE FROM category_attributes WHERE category_id = ? AND attribute_id = ?')
        .run(where.categoryId_attributeId.categoryId, where.categoryId_attributeId.attributeId);
      return binding;
    },

    deleteMany: ({ where }: any = {}) => {
      let sql = 'DELETE FROM category_attributes WHERE 1=1';
      const params: any[] = [];
      if (where?.categoryId) { sql += ' AND category_id = ?'; params.push(where.categoryId); }
      if (where?.attributeId) { sql += ' AND attribute_id = ?'; params.push(where.attributeId); }
      db.prepare(sql).run(...params);
    }
  },

  collection: {
    findUnique: ({ where, include }: { where: { id?: string; slug?: string }; include?: any }) => {
      let row: any = null;
      if (where.id) {
        row = db.prepare('SELECT * FROM collections WHERE id = ?').get(where.id);
      } else if (where.slug) {
        row = db.prepare('SELECT * FROM collections WHERE LOWER(slug) = LOWER(?)').get(where.slug);
      }
      if (!row) return null;

      const coll: any = {
        id: row.id,
        name: row.name,
        slug: row.slug,
        shortDescription: row.short_description || null,
        description: row.description || null,
        image: row.image || null,
        bannerImage: row.banner_image || null,
        heroTitle: row.hero_title || null,
        heroDescription: row.hero_description || null,
        status: row.status,
        type: row.type,
        isFeatured: Boolean(row.is_featured),
        sortOrder: Number(row.sort_order || 0),
        metaTitle: row.meta_title || null,
        metaDescription: row.meta_description || null,
        canonicalUrl: row.canonical_url || null,
        ogTitle: row.og_title || null,
        ogDescription: row.og_description || null,
        ogImage: row.og_image || null,
        createdAt: new Date(row.created_at),
        updatedAt: new Date(row.updated_at)
      };

      if (include?.media) {
        coll.media = prisma.collectionMedia.findMany({
          where: { collectionId: row.id },
          include: { media: true }
        });
      }

      return coll;
    },

    findFirst: ({ where }: any = {}) => {
      let sql = 'SELECT * FROM collections WHERE 1=1';
      const params: any[] = [];

      if (where?.id) { sql += ' AND id = ?'; params.push(where.id); }
      if (where?.slug) { sql += ' AND LOWER(slug) = LOWER(?)'; params.push(where.slug); }
      if (where?.name) { sql += ' AND LOWER(name) = LOWER(?)'; params.push(where.name); }
      if (where?.status) { sql += ' AND status = ?'; params.push(where.status); }
      if (where?.type) { sql += ' AND type = ?'; params.push(where.type); }
      if (where?.isFeatured !== undefined) {
        sql += ' AND is_featured = ?';
        params.push(where.isFeatured ? 1 : 0);
      }

      const row: any = db.prepare(sql).get(...params);
      if (!row) return null;
      return prisma.collection.findUnique({ where: { id: row.id } });
    },

    findMany: ({ where, orderBy, take, skip }: any = {}) => {
      let sql = 'SELECT * FROM collections WHERE 1=1';
      const params: any[] = [];

      if (where?.status) { sql += ' AND status = ?'; params.push(where.status); }
      if (where?.type) { sql += ' AND type = ?'; params.push(where.type); }
      if (where?.isFeatured !== undefined) {
        sql += ' AND is_featured = ?';
        params.push(where.isFeatured ? 1 : 0);
      }
      if (where?.search) {
        sql += ' AND (name LIKE ? OR slug LIKE ? OR description LIKE ? OR short_description LIKE ?)';
        params.push(`%${where.search}%`, `%${where.search}%`, `%${where.search}%`, `%${where.search}%`);
      }

      if (orderBy) {
        const field = orderBy.name ? 'name' : orderBy.sortOrder ? 'sort_order' : orderBy.createdAt ? 'created_at' : orderBy.updatedAt ? 'updated_at' : 'sort_order';
        const dir = (orderBy.name || orderBy.sortOrder || orderBy.createdAt || orderBy.updatedAt || 'asc').toUpperCase();
        sql += ` ORDER BY ${field} ${dir}`;
      } else {
        sql += ' ORDER BY sort_order ASC, name ASC';
      }

      if (take !== undefined) {
        sql += ` LIMIT ${take}`;
        if (skip !== undefined) sql += ` OFFSET ${skip}`;
      }

      const rows: any[] = db.prepare(sql).all(...params);
      return rows.map(r => prisma.collection.findUnique({ where: { id: r.id } }));
    },

    count: ({ where }: any = {}) => {
      let sql = 'SELECT COUNT(*) as total FROM collections WHERE 1=1';
      const params: any[] = [];

      if (where?.status) { sql += ' AND status = ?'; params.push(where.status); }
      if (where?.type) { sql += ' AND type = ?'; params.push(where.type); }
      if (where?.isFeatured !== undefined) {
        sql += ' AND is_featured = ?';
        params.push(where.isFeatured ? 1 : 0);
      }
      if (where?.search) {
        sql += ' AND (name LIKE ? OR slug LIKE ? OR description LIKE ? OR short_description LIKE ?)';
        params.push(`%${where.search}%`, `%${where.search}%`, `%${where.search}%`, `%${where.search}%`);
      }

      const res: any = db.prepare(sql).get(...params);
      return res?.total || 0;
    },

    create: ({ data }: { data: any }) => {
      const id = data.id || randomUUID();
      const now = new Date().toISOString();
      db.prepare(`
        INSERT INTO collections (
          id, name, slug, short_description, description, image, banner_image,
          hero_title, hero_description, status, type, is_featured, sort_order,
          meta_title, meta_description, canonical_url, og_title, og_description, og_image,
          created_at, updated_at
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      `).run(
        id,
        data.name.trim(),
        data.slug.toLowerCase().trim(),
        data.shortDescription || null,
        data.description || null,
        data.image || null,
        data.bannerImage || null,
        data.heroTitle || null,
        data.heroDescription || null,
        data.status || 'ACTIVE',
        data.type || 'MANUAL',
        data.isFeatured ? 1 : 0,
        data.sortOrder !== undefined ? Number(data.sortOrder) : 0,
        data.metaTitle || null,
        data.metaDescription || null,
        data.canonicalUrl || null,
        data.ogTitle || null,
        data.ogDescription || null,
        data.ogImage || null,
        now,
        now
      );
      return prisma.collection.findUnique({ where: { id } });
    },

    update: ({ where, data }: { where: { id: string }; data: any }) => {
      const updates: string[] = [];
      const params: any[] = [];
      const now = new Date().toISOString();

      if (data.name !== undefined) { updates.push('name = ?'); params.push(data.name.trim()); }
      if (data.slug !== undefined) { updates.push('slug = ?'); params.push(data.slug.toLowerCase().trim()); }
      if (data.shortDescription !== undefined) { updates.push('short_description = ?'); params.push(data.shortDescription); }
      if (data.description !== undefined) { updates.push('description = ?'); params.push(data.description); }
      if (data.image !== undefined) { updates.push('image = ?'); params.push(data.image); }
      if (data.bannerImage !== undefined) { updates.push('banner_image = ?'); params.push(data.bannerImage); }
      if (data.heroTitle !== undefined) { updates.push('hero_title = ?'); params.push(data.heroTitle); }
      if (data.heroDescription !== undefined) { updates.push('hero_description = ?'); params.push(data.heroDescription); }
      if (data.status !== undefined) { updates.push('status = ?'); params.push(data.status); }
      if (data.type !== undefined) { updates.push('type = ?'); params.push(data.type); }
      if (data.isFeatured !== undefined) { updates.push('is_featured = ?'); params.push(data.isFeatured ? 1 : 0); }
      if (data.sortOrder !== undefined) { updates.push('sort_order = ?'); params.push(Number(data.sortOrder)); }
      if (data.metaTitle !== undefined) { updates.push('meta_title = ?'); params.push(data.metaTitle); }
      if (data.metaDescription !== undefined) { updates.push('meta_description = ?'); params.push(data.metaDescription); }
      if (data.canonicalUrl !== undefined) { updates.push('canonical_url = ?'); params.push(data.canonicalUrl); }
      if (data.ogTitle !== undefined) { updates.push('og_title = ?'); params.push(data.ogTitle); }
      if (data.ogDescription !== undefined) { updates.push('og_description = ?'); params.push(data.ogDescription); }
      if (data.ogImage !== undefined) { updates.push('og_image = ?'); params.push(data.ogImage); }

      updates.push('updated_at = ?');
      params.push(now);
      params.push(where.id);

      db.prepare(`UPDATE collections SET ${updates.join(', ')} WHERE id = ?`).run(...params);
      return prisma.collection.findUnique({ where: { id: where.id } });
    },

    delete: ({ where }: { where: { id: string } }) => {
      const coll = prisma.collection.findUnique({ where });
      db.prepare('DELETE FROM collections WHERE id = ?').run(where.id);
      return coll;
    }
  },

  product: {
    findUnique: ({ where, include }: { where: { id?: string; slug?: string; sku?: string }; include?: any }) => {
      let row: any = null;
      if (where.id) {
        row = db.prepare('SELECT * FROM products WHERE id = ?').get(where.id);
      } else if (where.slug) {
        row = db.prepare('SELECT * FROM products WHERE LOWER(slug) = LOWER(?)').get(where.slug);
      } else if (where.sku) {
        row = db.prepare('SELECT * FROM products WHERE LOWER(sku) = LOWER(?)').get(where.sku);
      }
      if (!row) return null;

      const formatted: any = {
        id: row.id,
        name: row.name,
        slug: row.slug,
        sku: row.sku,
        shortDescription: row.short_description || null,
        description: row.description || null,
        status: row.status,
        productType: row.product_type,
        price: Number(row.price),
        compareAtPrice: row.compare_at_price !== null ? Number(row.compare_at_price) : null,
        costPrice: row.cost_price !== null ? Number(row.cost_price) : null,
        currency: row.currency || 'INR',
        stockQuantity: Number(row.stock_quantity || 0),
        lowStockThreshold: Number(row.low_stock_threshold || 5),
        trackInventory: Boolean(row.track_inventory),
        allowBackorder: Boolean(row.allow_backorder),
        isFeatured: Boolean(row.is_featured),
        isNewArrival: Boolean(row.is_new_arrival),
        isBestseller: Boolean(row.is_bestseller),
        sortOrder: Number(row.sort_order || 0),
        categoryId: row.category_id,
        image: row.image || null,
        thumbnail: row.thumbnail || null,
        bannerImage: row.banner_image || null,
        metaTitle: row.meta_title || null,
        metaDescription: row.meta_description || null,
        canonicalUrl: row.canonical_url || null,
        ogTitle: row.og_title || null,
        ogDescription: row.og_description || null,
        ogImage: row.og_image || null,
        createdAt: new Date(row.created_at),
        updatedAt: new Date(row.updated_at)
      };

      if (include?.category) {
        formatted.category = prisma.category.findUnique({ where: { id: row.category_id } });
      }

      if (include?.collections) {
        const pColls: any[] = db.prepare('SELECT collection_id FROM product_collections WHERE product_id = ?').all(row.id);
        formatted.collections = pColls.map(pc => prisma.collection.findUnique({ where: { id: pc.collection_id } })).filter(Boolean);
      }

      if (include?.attributes) {
        formatted.attributes = prisma.productAttributeValue.findMany({
          where: { productId: row.id },
          include: { attribute: true, attributeValue: true }
        });
      }

      if (include?.options) {
        formatted.options = prisma.productOption.findMany({
          where: { productId: row.id },
          include: { values: true }
        });
      }

      if (include?.variants) {
        formatted.variants = prisma.productVariant.findMany({
          where: { productId: row.id },
          include: { optionValues: { include: { optionValue: true } }, media: { include: { media: true } } }
        });
      }

      if (include?.media) {
        formatted.media = prisma.productMedia.findMany({
          where: { productId: row.id },
          include: { media: true }
        });
      }

      return formatted;
    },

    findFirst: ({ where, include }: any = {}) => {
      let sql = 'SELECT * FROM products WHERE 1=1';
      const params: any[] = [];

      if (where?.id) { sql += ' AND id = ?'; params.push(where.id); }
      if (where?.slug) { sql += ' AND LOWER(slug) = LOWER(?)'; params.push(where.slug); }
      if (where?.sku) { sql += ' AND LOWER(sku) = LOWER(?)'; params.push(where.sku); }
      if (where?.name) { sql += ' AND LOWER(name) = LOWER(?)'; params.push(where.name); }
      if (where?.status) { sql += ' AND status = ?'; params.push(where.status); }
      if (where?.categoryId) { sql += ' AND category_id = ?'; params.push(where.categoryId); }

      const row: any = db.prepare(sql).get(...params);
      if (!row) return null;
      return prisma.product.findUnique({ where: { id: row.id }, include });
    },

    findMany: ({ where, include, orderBy, take, skip }: any = {}) => {
      let sql = 'SELECT DISTINCT p.* FROM products p';
      const params: any[] = [];
      const joins: string[] = [];
      const conditions: string[] = ['1=1'];

      if (where?.collectionId) {
        joins.push('INNER JOIN product_collections pc ON p.id = pc.product_id');
        conditions.push('pc.collection_id = ?');
        params.push(where.collectionId);
      }

      if (where?.attributeFilters && Object.keys(where.attributeFilters).length > 0) {
        let attrIdx = 0;
        for (const [attrSlug, valSlugOrText] of Object.entries(where.attributeFilters)) {
          attrIdx++;
          const aliasPav = `pav_${attrIdx}`;
          const aliasA = `a_${attrIdx}`;
          const aliasAv = `av_${attrIdx}`;
          joins.push(`INNER JOIN product_attribute_values ${aliasPav} ON p.id = ${aliasPav}.product_id`);
          joins.push(`INNER JOIN attributes ${aliasA} ON ${aliasPav}.attribute_id = ${aliasA}.id`);
          joins.push(`LEFT JOIN attribute_values ${aliasAv} ON ${aliasPav}.attribute_value_id = ${aliasAv}.id`);
          conditions.push(`LOWER(${aliasA}.slug) = LOWER(?) AND (LOWER(${aliasAv}.slug) = LOWER(?) OR LOWER(${aliasPav}.text_value) = LOWER(?))`);
          params.push(attrSlug, String(valSlugOrText), String(valSlugOrText));
        }
      }

      if (where?.status) { conditions.push('p.status = ?'); params.push(where.status); }
      if (where?.productType) { conditions.push('p.product_type = ?'); params.push(where.productType); }
      if (where?.categoryId) { conditions.push('p.category_id = ?'); params.push(where.categoryId); }
      if (where?.isFeatured !== undefined) { conditions.push('p.is_featured = ?'); params.push(where.isFeatured ? 1 : 0); }
      if (where?.isNewArrival !== undefined) { conditions.push('p.is_new_arrival = ?'); params.push(where.isNewArrival ? 1 : 0); }
      if (where?.isBestseller !== undefined) { conditions.push('p.is_bestseller = ?'); params.push(where.isBestseller ? 1 : 0); }

      if (where?.minPrice !== undefined) { conditions.push('p.price >= ?'); params.push(Number(where.minPrice)); }
      if (where?.maxPrice !== undefined) { conditions.push('p.price <= ?'); params.push(Number(where.maxPrice)); }

      if (where?.stockState === 'in_stock') {
        conditions.push('(p.track_inventory = 0 OR p.stock_quantity > 0 OR p.allow_backorder = 1)');
      } else if (where?.stockState === 'low_stock') {
        conditions.push('(p.track_inventory = 1 AND p.stock_quantity > 0 AND p.stock_quantity <= p.low_stock_threshold)');
      } else if (where?.stockState === 'out_of_stock') {
        conditions.push('(p.track_inventory = 1 AND p.stock_quantity <= 0 AND p.allow_backorder = 0)');
      }

      if (where?.search) {
        conditions.push('(p.name LIKE ? OR p.slug LIKE ? OR p.sku LIKE ? OR p.description LIKE ?)');
        params.push(`%${where.search}%`, `%${where.search}%`, `%${where.search}%`, `%${where.search}%`);
      }

      if (joins.length > 0) {
        sql += ` ${joins.join(' ')}`;
      }
      sql += ` WHERE ${conditions.join(' AND ')}`;

      if (orderBy) {
        const field = orderBy.name ? 'p.name' : orderBy.price ? 'p.price' : orderBy.sortOrder ? 'p.sort_order' : orderBy.createdAt ? 'p.created_at' : orderBy.updatedAt ? 'p.updated_at' : 'p.sort_order';
        const dir = (orderBy.name || orderBy.price || orderBy.sortOrder || orderBy.createdAt || orderBy.updatedAt || 'asc').toUpperCase();
        sql += ` ORDER BY ${field} ${dir}`;
      } else {
        sql += ' ORDER BY p.sort_order ASC, p.name ASC';
      }

      if (take !== undefined) {
        sql += ` LIMIT ${take}`;
        if (skip !== undefined) sql += ` OFFSET ${skip}`;
      }

      const rows: any[] = db.prepare(sql).all(...params);
      return rows.map(r => prisma.product.findUnique({ where: { id: r.id }, include }));
    },

    count: ({ where }: any = {}) => {
      let sql = 'SELECT COUNT(DISTINCT p.id) as total FROM products p';
      const params: any[] = [];
      const joins: string[] = [];
      const conditions: string[] = ['1=1'];

      if (where?.collectionId) {
        joins.push('INNER JOIN product_collections pc ON p.id = pc.product_id');
        conditions.push('pc.collection_id = ?');
        params.push(where.collectionId);
      }

      if (where?.attributeFilters && Object.keys(where.attributeFilters).length > 0) {
        let attrIdx = 0;
        for (const [attrSlug, valSlugOrText] of Object.entries(where.attributeFilters)) {
          attrIdx++;
          const aliasPav = `pav_${attrIdx}`;
          const aliasA = `a_${attrIdx}`;
          const aliasAv = `av_${attrIdx}`;
          joins.push(`INNER JOIN product_attribute_values ${aliasPav} ON p.id = ${aliasPav}.product_id`);
          joins.push(`INNER JOIN attributes ${aliasA} ON ${aliasPav}.attribute_id = ${aliasA}.id`);
          joins.push(`LEFT JOIN attribute_values ${aliasAv} ON ${aliasPav}.attribute_value_id = ${aliasAv}.id`);
          conditions.push(`LOWER(${aliasA}.slug) = LOWER(?) AND (LOWER(${aliasAv}.slug) = LOWER(?) OR LOWER(${aliasPav}.text_value) = LOWER(?))`);
          params.push(attrSlug, String(valSlugOrText), String(valSlugOrText));
        }
      }

      if (where?.status) { conditions.push('p.status = ?'); params.push(where.status); }
      if (where?.productType) { conditions.push('p.product_type = ?'); params.push(where.productType); }
      if (where?.categoryId) { conditions.push('p.category_id = ?'); params.push(where.categoryId); }
      if (where?.isFeatured !== undefined) { conditions.push('p.is_featured = ?'); params.push(where.isFeatured ? 1 : 0); }
      if (where?.isNewArrival !== undefined) { conditions.push('p.is_new_arrival = ?'); params.push(where.isNewArrival ? 1 : 0); }
      if (where?.isBestseller !== undefined) { conditions.push('p.is_bestseller = ?'); params.push(where.isBestseller ? 1 : 0); }
      if (where?.minPrice !== undefined) { conditions.push('p.price >= ?'); params.push(Number(where.minPrice)); }
      if (where?.maxPrice !== undefined) { conditions.push('p.price <= ?'); params.push(Number(where.maxPrice)); }

      if (where?.stockState === 'in_stock') {
        conditions.push('(p.track_inventory = 0 OR p.stock_quantity > 0 OR p.allow_backorder = 1)');
      } else if (where?.stockState === 'low_stock') {
        conditions.push('(p.track_inventory = 1 AND p.stock_quantity > 0 AND p.stock_quantity <= p.low_stock_threshold)');
      } else if (where?.stockState === 'out_of_stock') {
        conditions.push('(p.track_inventory = 1 AND p.stock_quantity <= 0 AND p.allow_backorder = 0)');
      }

      if (where?.search) {
        conditions.push('(p.name LIKE ? OR p.slug LIKE ? OR p.sku LIKE ? OR p.description LIKE ?)');
        params.push(`%${where.search}%`, `%${where.search}%`, `%${where.search}%`, `%${where.search}%`);
      }

      if (joins.length > 0) {
        sql += ` ${joins.join(' ')}`;
      }
      sql += ` WHERE ${conditions.join(' AND ')}`;

      const res: any = db.prepare(sql).get(...params);
      return res?.total || 0;
    },

    create: ({ data, include }: { data: any; include?: any }) => {
      const id = data.id || randomUUID();
      const now = new Date().toISOString();
      db.prepare(`
        INSERT INTO products (
          id, name, slug, sku, short_description, description, status, product_type,
          price, compare_at_price, cost_price, currency, stock_quantity, low_stock_threshold,
          track_inventory, allow_backorder, is_featured, is_new_arrival, is_bestseller,
          sort_order, category_id, image, thumbnail, banner_image,
          meta_title, meta_description, canonical_url, og_title, og_description, og_image,
          created_at, updated_at
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      `).run(
        id,
        data.name.trim(),
        data.slug.toLowerCase().trim(),
        data.sku.trim(),
        data.shortDescription || null,
        data.description || null,
        data.status || 'DRAFT',
        data.productType || 'SIMPLE',
        Number(data.price),
        data.compareAtPrice !== undefined && data.compareAtPrice !== null ? Number(data.compareAtPrice) : null,
        data.costPrice !== undefined && data.costPrice !== null ? Number(data.costPrice) : null,
        data.currency || 'INR',
        data.stockQuantity !== undefined ? Number(data.stockQuantity) : 0,
        data.lowStockThreshold !== undefined ? Number(data.lowStockThreshold) : 5,
        data.trackInventory !== undefined ? (data.trackInventory ? 1 : 0) : 1,
        data.allowBackorder ? 1 : 0,
        data.isFeatured ? 1 : 0,
        data.isNewArrival ? 1 : 0,
        data.isBestseller ? 1 : 0,
        data.sortOrder !== undefined ? Number(data.sortOrder) : 0,
        data.categoryId,
        data.image || null,
        data.thumbnail || null,
        data.bannerImage || null,
        data.metaTitle || null,
        data.metaDescription || null,
        data.canonicalUrl || null,
        data.ogTitle || null,
        data.ogDescription || null,
        data.ogImage || null,
        now,
        now
      );

      return prisma.product.findUnique({ where: { id }, include });
    },

    update: ({ where, data, include }: { where: { id: string }; data: any; include?: any }) => {
      const updates: string[] = [];
      const params: any[] = [];
      const now = new Date().toISOString();

      if (data.name !== undefined) { updates.push('name = ?'); params.push(data.name.trim()); }
      if (data.slug !== undefined) { updates.push('slug = ?'); params.push(data.slug.toLowerCase().trim()); }
      if (data.sku !== undefined) { updates.push('sku = ?'); params.push(data.sku.trim()); }
      if (data.shortDescription !== undefined) { updates.push('short_description = ?'); params.push(data.shortDescription); }
      if (data.description !== undefined) { updates.push('description = ?'); params.push(data.description); }
      if (data.status !== undefined) { updates.push('status = ?'); params.push(data.status); }
      if (data.productType !== undefined) { updates.push('product_type = ?'); params.push(data.productType); }
      if (data.price !== undefined) { updates.push('price = ?'); params.push(Number(data.price)); }
      if (data.compareAtPrice !== undefined) { updates.push('compare_at_price = ?'); params.push(data.compareAtPrice !== null ? Number(data.compareAtPrice) : null); }
      if (data.costPrice !== undefined) { updates.push('cost_price = ?'); params.push(data.costPrice !== null ? Number(data.costPrice) : null); }
      if (data.currency !== undefined) { updates.push('currency = ?'); params.push(data.currency); }
      if (data.stockQuantity !== undefined) { updates.push('stock_quantity = ?'); params.push(Number(data.stockQuantity)); }
      if (data.lowStockThreshold !== undefined) { updates.push('low_stock_threshold = ?'); params.push(Number(data.lowStockThreshold)); }
      if (data.trackInventory !== undefined) { updates.push('track_inventory = ?'); params.push(data.trackInventory ? 1 : 0); }
      if (data.allowBackorder !== undefined) { updates.push('allow_backorder = ?'); params.push(data.allowBackorder ? 1 : 0); }
      if (data.isFeatured !== undefined) { updates.push('is_featured = ?'); params.push(data.isFeatured ? 1 : 0); }
      if (data.isNewArrival !== undefined) { updates.push('is_new_arrival = ?'); params.push(data.isNewArrival ? 1 : 0); }
      if (data.isBestseller !== undefined) { updates.push('is_bestseller = ?'); params.push(data.isBestseller ? 1 : 0); }
      if (data.sortOrder !== undefined) { updates.push('sort_order = ?'); params.push(Number(data.sortOrder)); }
      if (data.categoryId !== undefined) { updates.push('category_id = ?'); params.push(data.categoryId); }
      if (data.image !== undefined) { updates.push('image = ?'); params.push(data.image); }
      if (data.thumbnail !== undefined) { updates.push('thumbnail = ?'); params.push(data.thumbnail); }
      if (data.bannerImage !== undefined) { updates.push('banner_image = ?'); params.push(data.bannerImage); }
      if (data.metaTitle !== undefined) { updates.push('meta_title = ?'); params.push(data.metaTitle); }
      if (data.metaDescription !== undefined) { updates.push('meta_description = ?'); params.push(data.metaDescription); }
      if (data.canonicalUrl !== undefined) { updates.push('canonical_url = ?'); params.push(data.canonicalUrl); }
      if (data.ogTitle !== undefined) { updates.push('og_title = ?'); params.push(data.ogTitle); }
      if (data.ogDescription !== undefined) { updates.push('og_description = ?'); params.push(data.ogDescription); }
      if (data.ogImage !== undefined) { updates.push('og_image = ?'); params.push(data.ogImage); }

      updates.push('updated_at = ?');
      params.push(now);
      params.push(where.id);

      db.prepare(`UPDATE products SET ${updates.join(', ')} WHERE id = ?`).run(...params);
      return prisma.product.findUnique({ where: { id: where.id }, include });
    },

    delete: ({ where }: { where: { id: string } }) => {
      const prod = prisma.product.findUnique({ where, include: { category: true, collections: true, attributes: true } });
      db.prepare('DELETE FROM products WHERE id = ?').run(where.id);
      return prod;
    }
  },

  productCollection: {
    findMany: ({ where }: any = {}) => {
      let sql = 'SELECT * FROM product_collections WHERE 1=1';
      const params: any[] = [];
      if (where?.productId) { sql += ' AND product_id = ?'; params.push(where.productId); }
      if (where?.collectionId) { sql += ' AND collection_id = ?'; params.push(where.collectionId); }
      const rows: any[] = db.prepare(sql).all(...params);
      return rows.map(r => ({
        productId: r.product_id,
        collectionId: r.collection_id,
        createdAt: new Date(r.created_at)
      }));
    },

    create: ({ data }: { data: any }) => {
      const now = new Date().toISOString();
      db.prepare(`
        INSERT OR IGNORE INTO product_collections (product_id, collection_id, created_at)
        VALUES (?, ?, ?)
      `).run(data.productId, data.collectionId, now);
      return { productId: data.productId, collectionId: data.collectionId, createdAt: new Date(now) };
    },

    deleteMany: ({ where }: any = {}) => {
      let sql = 'DELETE FROM product_collections WHERE 1=1';
      const params: any[] = [];
      if (where?.productId) { sql += ' AND product_id = ?'; params.push(where.productId); }
      if (where?.collectionId) { sql += ' AND collection_id = ?'; params.push(where.collectionId); }
      db.prepare(sql).run(...params);
    }
  },

  productAttributeValue: {
    findMany: ({ where, include }: any = {}) => {
      let sql = 'SELECT * FROM product_attribute_values WHERE 1=1';
      const params: any[] = [];
      if (where?.productId) { sql += ' AND product_id = ?'; params.push(where.productId); }
      if (where?.attributeId) { sql += ' AND attribute_id = ?'; params.push(where.attributeId); }
      if (where?.attributeValueId) { sql += ' AND attribute_value_id = ?'; params.push(where.attributeValueId); }

      const rows: any[] = db.prepare(sql).all(...params);
      return rows.map(r => {
        const item: any = {
          id: r.id,
          productId: r.product_id,
          attributeId: r.attribute_id,
          attributeValueId: r.attribute_value_id || null,
          textValue: r.text_value || null,
          numberValue: r.number_value !== null ? Number(r.number_value) : null,
          booleanValue: r.boolean_value !== null ? Boolean(r.boolean_value) : null,
          createdAt: new Date(r.created_at),
          updatedAt: new Date(r.updated_at)
        };

        if (include?.attribute) {
          item.attribute = prisma.attribute.findUnique({ where: { id: r.attribute_id } });
        }
        if (include?.attributeValue && r.attribute_value_id) {
          item.attributeValue = prisma.attributeValue.findUnique({ where: { id: r.attribute_value_id } });
        }
        return item;
      });
    },

    create: ({ data }: { data: any }) => {
      const id = data.id || randomUUID();
      const now = new Date().toISOString();
      db.prepare(`
        INSERT INTO product_attribute_values (
          id, product_id, attribute_id, attribute_value_id, text_value, number_value, boolean_value, created_at, updated_at
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
      `).run(
        id,
        data.productId,
        data.attributeId,
        data.attributeValueId || null,
        data.textValue || null,
        data.numberValue !== undefined && data.numberValue !== null ? Number(data.numberValue) : null,
        data.booleanValue !== undefined && data.booleanValue !== null ? (data.booleanValue ? 1 : 0) : null,
        now,
        now
      );

      return {
        id,
        productId: data.productId,
        attributeId: data.attributeId,
        attributeValueId: data.attributeValueId || null,
        textValue: data.textValue || null,
        numberValue: data.numberValue !== undefined && data.numberValue !== null ? Number(data.numberValue) : null,
        booleanValue: data.booleanValue !== undefined && data.booleanValue !== null ? Boolean(data.booleanValue) : null,
        createdAt: new Date(now),
        updatedAt: new Date(now)
      };
    },

    deleteMany: ({ where }: any = {}) => {
      let sql = 'DELETE FROM product_attribute_values WHERE 1=1';
      const params: any[] = [];
      if (where?.productId) { sql += ' AND product_id = ?'; params.push(where.productId); }
      if (where?.attributeId) { sql += ' AND attribute_id = ?'; params.push(where.attributeId); }
      if (where?.attributeValueId) { sql += ' AND attribute_value_id = ?'; params.push(where.attributeValueId); }
      db.prepare(sql).run(...params);
    }
  },

  productOption: {
    findUnique: ({ where, include }: any) => {
      let row: any = null;
      if (where.id) {
        row = db.prepare('SELECT * FROM product_options WHERE id = ?').get(where.id);
      } else if (where.productId && where.slug) {
        row = db.prepare('SELECT * FROM product_options WHERE product_id = ? AND slug = ?').get(where.productId, where.slug);
      } else if (where.productId_slug) {
        row = db.prepare('SELECT * FROM product_options WHERE product_id = ? AND slug = ?').get(where.productId_slug.productId, where.productId_slug.slug);
      }
      if (!row) return null;
      const opt: any = {
        id: row.id,
        productId: row.product_id,
        name: row.name,
        slug: row.slug,
        sortOrder: row.sort_order,
        createdAt: new Date(row.created_at),
        updatedAt: new Date(row.updated_at)
      };
      if (include?.values) {
        const valRows = db.prepare('SELECT * FROM product_option_values WHERE product_option_id = ? ORDER BY sort_order ASC, created_at ASC').all(opt.id) as any[];
        opt.values = valRows.map(v => ({
          id: v.id,
          productOptionId: v.product_option_id,
          value: v.value,
          slug: v.slug,
          sortOrder: v.sort_order,
          createdAt: new Date(v.created_at),
          updatedAt: new Date(v.updated_at)
        }));
      }
      return opt;
    },

    findFirst: ({ where, include }: any = {}) => {
      let sql = 'SELECT * FROM product_options WHERE 1=1';
      const params: any[] = [];
      if (where?.id) { sql += ' AND id = ?'; params.push(where.id); }
      if (where?.productId) { sql += ' AND product_id = ?'; params.push(where.productId); }
      if (where?.slug) { sql += ' AND slug = ?'; params.push(where.slug); }
      if (where?.name) { sql += ' AND LOWER(name) = LOWER(?)'; params.push(where.name); }

      const row: any = db.prepare(sql).get(...params);
      if (!row) return null;
      const opt: any = {
        id: row.id,
        productId: row.product_id,
        name: row.name,
        slug: row.slug,
        sortOrder: row.sort_order,
        createdAt: new Date(row.created_at),
        updatedAt: new Date(row.updated_at)
      };
      if (include?.values) {
        const valRows = db.prepare('SELECT * FROM product_option_values WHERE product_option_id = ? ORDER BY sort_order ASC, created_at ASC').all(opt.id) as any[];
        opt.values = valRows.map(v => ({
          id: v.id,
          productOptionId: v.product_option_id,
          value: v.value,
          slug: v.slug,
          sortOrder: v.sort_order,
          createdAt: new Date(v.created_at),
          updatedAt: new Date(v.updated_at)
        }));
      }
      return opt;
    },

    findMany: ({ where, include, orderBy }: any = {}) => {
      let sql = 'SELECT * FROM product_options WHERE 1=1';
      const params: any[] = [];
      if (where?.productId) { sql += ' AND product_id = ?'; params.push(where.productId); }
      if (where?.id) {
        if (typeof where.id === 'object' && where.id.in) {
          sql += ` AND id IN (${where.id.in.map(() => '?').join(',')})`;
          params.push(...where.id.in);
        } else {
          sql += ' AND id = ?';
          params.push(where.id);
        }
      }

      let orderClause = 'ORDER BY sort_order ASC, created_at ASC';
      if (orderBy?.sortOrder) orderClause = `ORDER BY sort_order ${orderBy.sortOrder.toUpperCase()}`;

      const rows = db.prepare(`${sql} ${orderClause}`).all(...params) as any[];
      return rows.map(row => {
        const opt: any = {
          id: row.id,
          productId: row.product_id,
          name: row.name,
          slug: row.slug,
          sortOrder: row.sort_order,
          createdAt: new Date(row.created_at),
          updatedAt: new Date(row.updated_at)
        };
        if (include?.values) {
          const valRows = db.prepare('SELECT * FROM product_option_values WHERE product_option_id = ? ORDER BY sort_order ASC, created_at ASC').all(opt.id) as any[];
          opt.values = valRows.map(v => ({
            id: v.id,
            productOptionId: v.product_option_id,
            value: v.value,
            slug: v.slug,
            sortOrder: v.sort_order,
            createdAt: new Date(v.created_at),
            updatedAt: new Date(v.updated_at)
          }));
        }
        return opt;
      });
    },

    create: ({ data, include }: any) => {
      const id = data.id || randomUUID();
      const now = new Date().toISOString();
      db.prepare(`
        INSERT INTO product_options (id, product_id, name, slug, sort_order, created_at, updated_at)
        VALUES (?, ?, ?, ?, ?, ?, ?)
      `).run(
        id,
        data.productId,
        data.name,
        data.slug,
        data.sortOrder ?? 0,
        now,
        now
      );

      return prisma.productOption.findUnique({ where: { id }, include });
    },

    update: ({ where, data, include }: any) => {
      const now = new Date().toISOString();
      const sets: string[] = ['updated_at = ?'];
      const params: any[] = [now];

      if (data.name !== undefined) { sets.push('name = ?'); params.push(data.name); }
      if (data.slug !== undefined) { sets.push('slug = ?'); params.push(data.slug); }
      if (data.sortOrder !== undefined) { sets.push('sort_order = ?'); params.push(data.sortOrder); }

      params.push(where.id);
      db.prepare(`UPDATE product_options SET ${sets.join(', ')} WHERE id = ?`).run(...params);

      return prisma.productOption.findUnique({ where: { id: where.id }, include });
    },

    delete: ({ where }: any) => {
      const existing = prisma.productOption.findUnique({ where });
      if (existing) {
        db.prepare('DELETE FROM product_options WHERE id = ?').run(where.id);
      }
      return existing;
    },

    deleteMany: ({ where }: any = {}) => {
      let sql = 'DELETE FROM product_options WHERE 1=1';
      const params: any[] = [];
      if (where?.productId) { sql += ' AND product_id = ?'; params.push(where.productId); }
      db.prepare(sql).run(...params);
    }
  },

  productOptionValue: {
    findUnique: ({ where, include }: any) => {
      let row: any = null;
      if (where.id) {
        row = db.prepare('SELECT * FROM product_option_values WHERE id = ?').get(where.id);
      } else if (where.productOptionId && where.slug) {
        row = db.prepare('SELECT * FROM product_option_values WHERE product_option_id = ? AND slug = ?').get(where.productOptionId, where.slug);
      } else if (where.productOptionId_slug) {
        row = db.prepare('SELECT * FROM product_option_values WHERE product_option_id = ? AND slug = ?').get(where.productOptionId_slug.productOptionId, where.productOptionId_slug.slug);
      }
      if (!row) return null;
      const val: any = {
        id: row.id,
        productOptionId: row.product_option_id,
        value: row.value,
        slug: row.slug,
        sortOrder: row.sort_order,
        createdAt: new Date(row.created_at),
        updatedAt: new Date(row.updated_at)
      };
      if (include?.option) {
        val.option = prisma.productOption.findUnique({ where: { id: val.productOptionId } });
      }
      return val;
    },

    findFirst: ({ where, include }: any = {}) => {
      let sql = 'SELECT * FROM product_option_values WHERE 1=1';
      const params: any[] = [];
      if (where?.id) { sql += ' AND id = ?'; params.push(where.id); }
      if (where?.productOptionId) { sql += ' AND product_option_id = ?'; params.push(where.productOptionId); }
      if (where?.slug) { sql += ' AND slug = ?'; params.push(where.slug); }
      if (where?.value) { sql += ' AND LOWER(value) = LOWER(?)'; params.push(where.value); }

      const row: any = db.prepare(sql).get(...params);
      if (!row) return null;
      const val: any = {
        id: row.id,
        productOptionId: row.product_option_id,
        value: row.value,
        slug: row.slug,
        sortOrder: row.sort_order,
        createdAt: new Date(row.created_at),
        updatedAt: new Date(row.updated_at)
      };
      if (include?.option) {
        val.option = prisma.productOption.findUnique({ where: { id: val.productOptionId } });
      }
      return val;
    },

    findMany: ({ where, include, orderBy }: any = {}) => {
      let sql = 'SELECT * FROM product_option_values WHERE 1=1';
      const params: any[] = [];
      if (where?.productOptionId) {
        if (typeof where.productOptionId === 'object' && where.productOptionId.in) {
          sql += ` AND product_option_id IN (${where.productOptionId.in.map(() => '?').join(',')})`;
          params.push(...where.productOptionId.in);
        } else {
          sql += ' AND product_option_id = ?';
          params.push(where.productOptionId);
        }
      }
      if (where?.id) {
        if (typeof where.id === 'object' && where.id.in) {
          sql += ` AND id IN (${where.id.in.map(() => '?').join(',')})`;
          params.push(...where.id.in);
        } else {
          sql += ' AND id = ?';
          params.push(where.id);
        }
      }

      let orderClause = 'ORDER BY sort_order ASC, created_at ASC';
      if (orderBy?.sortOrder) orderClause = `ORDER BY sort_order ${orderBy.sortOrder.toUpperCase()}`;

      const rows = db.prepare(`${sql} ${orderClause}`).all(...params) as any[];
      return rows.map(row => {
        const val: any = {
          id: row.id,
          productOptionId: row.product_option_id,
          value: row.value,
          slug: row.slug,
          sortOrder: row.sort_order,
          createdAt: new Date(row.created_at),
          updatedAt: new Date(row.updated_at)
        };
        if (include?.option) {
          val.option = prisma.productOption.findUnique({ where: { id: val.productOptionId } });
        }
        return val;
      });
    },

    create: ({ data, include }: any) => {
      const id = data.id || randomUUID();
      const now = new Date().toISOString();
      db.prepare(`
        INSERT INTO product_option_values (id, product_option_id, value, slug, sort_order, created_at, updated_at)
        VALUES (?, ?, ?, ?, ?, ?, ?)
      `).run(
        id,
        data.productOptionId,
        data.value,
        data.slug,
        data.sortOrder ?? 0,
        now,
        now
      );

      return prisma.productOptionValue.findUnique({ where: { id }, include });
    },

    update: ({ where, data, include }: any) => {
      const now = new Date().toISOString();
      const sets: string[] = ['updated_at = ?'];
      const params: any[] = [now];

      if (data.value !== undefined) { sets.push('value = ?'); params.push(data.value); }
      if (data.slug !== undefined) { sets.push('slug = ?'); params.push(data.slug); }
      if (data.sortOrder !== undefined) { sets.push('sort_order = ?'); params.push(data.sortOrder); }

      params.push(where.id);
      db.prepare(`UPDATE product_option_values SET ${sets.join(', ')} WHERE id = ?`).run(...params);

      return prisma.productOptionValue.findUnique({ where: { id: where.id }, include });
    },

    delete: ({ where }: any) => {
      const existing = prisma.productOptionValue.findUnique({ where });
      if (existing) {
        db.prepare('DELETE FROM product_option_values WHERE id = ?').run(where.id);
      }
      return existing;
    },

    deleteMany: ({ where }: any = {}) => {
      let sql = 'DELETE FROM product_option_values WHERE 1=1';
      const params: any[] = [];
      if (where?.productOptionId) { sql += ' AND product_option_id = ?'; params.push(where.productOptionId); }
      db.prepare(sql).run(...params);
    }
  },

  productVariant: {
    findUnique: ({ where, include }: any) => {
      let row: any = null;
      if (where.id) {
        row = db.prepare('SELECT * FROM product_variants WHERE id = ?').get(where.id);
      } else if (where.sku) {
        row = db.prepare('SELECT * FROM product_variants WHERE UPPER(sku) = UPPER(?)').get(where.sku);
      }
      if (!row) return null;
      const v: any = {
        id: row.id,
        productId: row.product_id,
        sku: row.sku,
        price: row.price !== null ? Number(row.price) : null,
        compareAtPrice: row.compare_at_price !== null ? Number(row.compare_at_price) : null,
        costPrice: row.cost_price !== null ? Number(row.cost_price) : null,
        stockQuantity: row.stock_quantity,
        lowStockThreshold: row.low_stock_threshold,
        trackInventory: Boolean(row.track_inventory),
        allowBackorder: Boolean(row.allow_backorder),
        status: row.status,
        image: row.image,
        sortOrder: row.sort_order,
        createdAt: new Date(row.created_at),
        updatedAt: new Date(row.updated_at)
      };

      if (include?.optionValues) {
        const joinRows = db.prepare(`
          SELECT pvov.variant_id, pvov.option_value_id,
                 pov.id as pov_id, pov.product_option_id, pov.value, pov.slug as pov_slug, pov.sort_order as pov_sort,
                 po.name as po_name, po.slug as po_slug, po.sort_order as po_sort
          FROM product_variant_option_values pvov
          JOIN product_option_values pov ON pvov.option_value_id = pov.id
          JOIN product_options po ON pov.product_option_id = po.id
          WHERE pvov.variant_id = ?
          ORDER BY po.sort_order ASC, pov.sort_order ASC
        `).all(v.id) as any[];

        v.optionValues = joinRows.map(j => ({
          variantId: j.variant_id,
          optionValueId: j.option_value_id,
          optionValue: {
            id: j.pov_id,
            productOptionId: j.product_option_id,
            value: j.value,
            slug: j.pov_slug,
            sortOrder: j.pov_sort,
            option: {
              id: j.product_option_id,
              productId: v.productId,
              name: j.po_name,
              slug: j.po_slug,
              sortOrder: j.po_sort
            }
          }
        }));
      }

      if (include?.product) {
        v.product = prisma.product.findUnique({ where: { id: v.productId } });
      }

      if (include?.media) {
        v.media = prisma.productVariantMedia.findMany({
          where: { variantId: v.id },
          include: { media: true }
        });
      }

      return v;
    },

    findFirst: ({ where, include }: any = {}) => {
      let sql = 'SELECT * FROM product_variants WHERE 1=1';
      const params: any[] = [];
      if (where?.id) { sql += ' AND id = ?'; params.push(where.id); }
      if (where?.productId) { sql += ' AND product_id = ?'; params.push(where.productId); }
      if (where?.sku) { sql += ' AND UPPER(sku) = UPPER(?)'; params.push(where.sku); }
      if (where?.status) { sql += ' AND status = ?'; params.push(where.status); }

      const row: any = db.prepare(sql).get(...params);
      if (!row) return null;
      return prisma.productVariant.findUnique({ where: { id: row.id }, include });
    },

    findMany: ({ where, include, orderBy, skip, take }: any = {}) => {
      let sql = 'SELECT * FROM product_variants WHERE 1=1';
      const params: any[] = [];
      if (where?.productId) { sql += ' AND product_id = ?'; params.push(where.productId); }
      if (where?.status) { sql += ' AND status = ?'; params.push(where.status); }
      if (where?.sku) { sql += ' AND UPPER(sku) LIKE ?'; params.push(`%${where.sku.toUpperCase()}%`); }
      if (where?.id) {
        if (typeof where.id === 'object' && where.id.in) {
          sql += ` AND id IN (${where.id.in.map(() => '?').join(',')})`;
          params.push(...where.id.in);
        } else {
          sql += ' AND id = ?';
          params.push(where.id);
        }
      }

      let orderClause = 'ORDER BY sort_order ASC, created_at ASC';
      if (orderBy) {
        if (Array.isArray(orderBy)) {
          const parts = orderBy.map(o => {
            const key = Object.keys(o)[0];
            const col = key === 'sortOrder' ? 'sort_order' : key === 'createdAt' ? 'created_at' : key;
            return `${col} ${o[key].toUpperCase()}`;
          });
          orderClause = `ORDER BY ${parts.join(', ')}`;
        } else {
          const key = Object.keys(orderBy)[0];
          const col = key === 'sortOrder' ? 'sort_order' : key === 'createdAt' ? 'created_at' : key === 'price' ? 'price' : key;
          orderClause = `ORDER BY ${col} ${orderBy[key].toUpperCase()}`;
        }
      }

      let limitClause = '';
      if (take !== undefined) {
        limitClause = `LIMIT ${Number(take)} OFFSET ${Number(skip || 0)}`;
      }

      const rows = db.prepare(`${sql} ${orderClause} ${limitClause}`).all(...params) as any[];
      return rows.map(r => prisma.productVariant.findUnique({ where: { id: r.id }, include }));
    },

    count: ({ where }: any = {}) => {
      let sql = 'SELECT COUNT(*) as cnt FROM product_variants WHERE 1=1';
      const params: any[] = [];
      if (where?.productId) { sql += ' AND product_id = ?'; params.push(where.productId); }
      if (where?.status) { sql += ' AND status = ?'; params.push(where.status); }
      if (where?.sku) { sql += ' AND UPPER(sku) LIKE ?'; params.push(`%${where.sku.toUpperCase()}%`); }
      const res: any = db.prepare(sql).get(...params);
      return res?.cnt || 0;
    },

    create: ({ data, include }: any) => {
      const id = data.id || randomUUID();
      const now = new Date().toISOString();
      db.prepare(`
        INSERT INTO product_variants (
          id, product_id, sku, price, compare_at_price, cost_price, stock_quantity,
          low_stock_threshold, track_inventory, allow_backorder, status, image, sort_order,
          created_at, updated_at
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      `).run(
        id,
        data.productId,
        data.sku.trim().toUpperCase(),
        data.price !== undefined && data.price !== null ? Number(data.price) : null,
        data.compareAtPrice !== undefined && data.compareAtPrice !== null ? Number(data.compareAtPrice) : null,
        data.costPrice !== undefined && data.costPrice !== null ? Number(data.costPrice) : null,
        data.stockQuantity ?? 0,
        data.lowStockThreshold ?? 5,
        data.trackInventory !== undefined ? (data.trackInventory ? 1 : 0) : 1,
        data.allowBackorder !== undefined ? (data.allowBackorder ? 1 : 0) : 0,
        data.status || 'ACTIVE',
        data.image || null,
        data.sortOrder ?? 0,
        now,
        now
      );

      return prisma.productVariant.findUnique({ where: { id }, include });
    },

    update: ({ where, data, include }: any) => {
      const now = new Date().toISOString();
      const sets: string[] = ['updated_at = ?'];
      const params: any[] = [now];

      if (data.sku !== undefined) { sets.push('sku = ?'); params.push(data.sku.trim().toUpperCase()); }
      if (data.price !== undefined) { sets.push('price = ?'); params.push(data.price !== null ? Number(data.price) : null); }
      if (data.compareAtPrice !== undefined) { sets.push('compare_at_price = ?'); params.push(data.compareAtPrice !== null ? Number(data.compareAtPrice) : null); }
      if (data.costPrice !== undefined) { sets.push('cost_price = ?'); params.push(data.costPrice !== null ? Number(data.costPrice) : null); }
      if (data.stockQuantity !== undefined) { sets.push('stock_quantity = ?'); params.push(data.stockQuantity); }
      if (data.lowStockThreshold !== undefined) { sets.push('low_stock_threshold = ?'); params.push(data.lowStockThreshold); }
      if (data.trackInventory !== undefined) { sets.push('track_inventory = ?'); params.push(data.trackInventory ? 1 : 0); }
      if (data.allowBackorder !== undefined) { sets.push('allow_backorder = ?'); params.push(data.allowBackorder ? 1 : 0); }
      if (data.status !== undefined) { sets.push('status = ?'); params.push(data.status); }
      if (data.image !== undefined) { sets.push('image = ?'); params.push(data.image || null); }
      if (data.sortOrder !== undefined) { sets.push('sort_order = ?'); params.push(data.sortOrder); }

      params.push(where.id);
      db.prepare(`UPDATE product_variants SET ${sets.join(', ')} WHERE id = ?`).run(...params);

      return prisma.productVariant.findUnique({ where: { id: where.id }, include });
    },

    delete: ({ where }: any) => {
      const existing = prisma.productVariant.findUnique({ where, include: { optionValues: true } });
      if (existing) {
        db.prepare('DELETE FROM product_variant_option_values WHERE variant_id = ?').run(where.id);
        db.prepare('DELETE FROM product_variants WHERE id = ?').run(where.id);
      }
      return existing;
    },

    deleteMany: ({ where }: any = {}) => {
      let sql = 'DELETE FROM product_variants WHERE 1=1';
      const params: any[] = [];
      if (where?.productId) { sql += ' AND product_id = ?'; params.push(where.productId); }
      db.prepare(sql).run(...params);
    }
  },

  productVariantOptionValue: {
    findMany: ({ where, include }: any = {}) => {
      let sql = 'SELECT * FROM product_variant_option_values WHERE 1=1';
      const params: any[] = [];
      if (where?.variantId) { sql += ' AND variant_id = ?'; params.push(where.variantId); }
      if (where?.optionValueId) { sql += ' AND option_value_id = ?'; params.push(where.optionValueId); }

      const rows = db.prepare(sql).all(...params) as any[];
      return rows.map(r => ({
        variantId: r.variant_id,
        optionValueId: r.option_value_id,
        optionValue: include?.optionValue ? prisma.productOptionValue.findUnique({ where: { id: r.option_value_id }, include: include.optionValue.include }) : undefined
      }));
    },

    create: ({ data }: any) => {
      db.prepare('INSERT OR REPLACE INTO product_variant_option_values (variant_id, option_value_id) VALUES (?, ?)').run(
        data.variantId,
        data.optionValueId
      );
      return { variantId: data.variantId, optionValueId: data.optionValueId };
    },

    deleteMany: ({ where }: any = {}) => {
      let sql = 'DELETE FROM product_variant_option_values WHERE 1=1';
      const params: any[] = [];
      if (where?.variantId) { sql += ' AND variant_id = ?'; params.push(where.variantId); }
      if (where?.optionValueId) { sql += ' AND option_value_id = ?'; params.push(where.optionValueId); }
      db.prepare(sql).run(...params);
    }
  },

  mediaFolder: {
    findUnique: ({ where, include }: any) => {
      let row: any = null;
      if (where?.id) {
        row = db.prepare('SELECT * FROM media_folders WHERE id = ?').get(where.id);
      } else if (where?.parentId_slug) {
        if (where.parentId_slug.parentId) {
          row = db.prepare('SELECT * FROM media_folders WHERE parent_id = ? AND LOWER(slug) = LOWER(?)').get(where.parentId_slug.parentId, where.parentId_slug.slug);
        } else {
          row = db.prepare('SELECT * FROM media_folders WHERE parent_id IS NULL AND LOWER(slug) = LOWER(?)').get(where.parentId_slug.slug);
        }
      } else if (where?.slug) {
        row = db.prepare('SELECT * FROM media_folders WHERE LOWER(slug) = LOWER(?)').get(where.slug);
      }
      if (!row) return null;

      const folder: any = {
        id: row.id,
        name: row.name,
        slug: row.slug,
        parentId: row.parent_id,
        createdAt: new Date(row.created_at),
        updatedAt: new Date(row.updated_at)
      };

      if (include?.parent && folder.parentId) {
        folder.parent = prisma.mediaFolder.findUnique({ where: { id: folder.parentId } });
      }
      if (include?.children) {
        folder.children = prisma.mediaFolder.findMany({ where: { parentId: folder.id } });
      }
      if (include?.assets) {
        folder.assets = prisma.mediaAsset.findMany({ where: { folderId: folder.id } });
      }

      return folder;
    },

    findFirst: ({ where, include }: any = {}) => {
      let sql = 'SELECT * FROM media_folders WHERE 1=1';
      const params: any[] = [];
      if (where?.id) { sql += ' AND id = ?'; params.push(where.id); }
      if (where?.name) { sql += ' AND LOWER(name) = LOWER(?)'; params.push(where.name); }
      if (where?.slug) { sql += ' AND LOWER(slug) = LOWER(?)'; params.push(where.slug); }
      if (where?.parentId !== undefined) {
        if (where.parentId === null) {
          sql += ' AND parent_id IS NULL';
        } else {
          sql += ' AND parent_id = ?';
          params.push(where.parentId);
        }
      }
      const row: any = db.prepare(sql).get(...params);
      if (!row) return null;
      return prisma.mediaFolder.findUnique({ where: { id: row.id }, include });
    },

    findMany: ({ where, include, orderBy }: any = {}) => {
      let sql = 'SELECT * FROM media_folders WHERE 1=1';
      const params: any[] = [];
      if (where?.parentId !== undefined) {
        if (where.parentId === null) {
          sql += ' AND parent_id IS NULL';
        } else {
          sql += ' AND parent_id = ?';
          params.push(where.parentId);
        }
      }
      if (where?.search) {
        sql += ' AND (LOWER(name) LIKE LOWER(?) OR LOWER(slug) LIKE LOWER(?))';
        params.push(`%${where.search}%`, `%${where.search}%`);
      }
      if (orderBy?.name) {
        sql += ` ORDER BY name ${orderBy.name.toUpperCase()}`;
      } else if (orderBy?.createdAt) {
        sql += ` ORDER BY created_at ${orderBy.createdAt.toUpperCase()}`;
      } else {
        sql += ' ORDER BY created_at ASC';
      }
      const rows: any[] = db.prepare(sql).all(...params);
      return rows.map(r => prisma.mediaFolder.findUnique({ where: { id: r.id }, include }));
    },

    count: ({ where }: any = {}) => {
      let sql = 'SELECT COUNT(*) as total FROM media_folders WHERE 1=1';
      const params: any[] = [];
      if (where?.parentId !== undefined) {
        if (where.parentId === null) {
          sql += ' AND parent_id IS NULL';
        } else {
          sql += ' AND parent_id = ?';
          params.push(where.parentId);
        }
      }
      const res: any = db.prepare(sql).get(...params);
      return res?.total || 0;
    },

    create: ({ data, include }: any) => {
      const id = data.id || randomUUID();
      const now = new Date().toISOString();
      db.prepare(`
        INSERT INTO media_folders (id, name, slug, parent_id, created_at, updated_at)
        VALUES (?, ?, ?, ?, ?, ?)
      `).run(
        id,
        data.name.trim(),
        data.slug.toLowerCase().trim(),
        data.parentId || null,
        now,
        now
      );
      return prisma.mediaFolder.findUnique({ where: { id }, include });
    },

    update: ({ where, data, include }: any) => {
      const sets: string[] = [];
      const params: any[] = [];
      const now = new Date().toISOString();

      if (data.name !== undefined) { sets.push('name = ?'); params.push(data.name.trim()); }
      if (data.slug !== undefined) { sets.push('slug = ?'); params.push(data.slug.toLowerCase().trim()); }
      if (data.parentId !== undefined) { sets.push('parent_id = ?'); params.push(data.parentId || null); }

      sets.push('updated_at = ?');
      params.push(now);
      params.push(where.id);

      db.prepare(`UPDATE media_folders SET ${sets.join(', ')} WHERE id = ?`).run(...params);
      return prisma.mediaFolder.findUnique({ where: { id: where.id }, include });
    },

    delete: ({ where }: any) => {
      const existing = prisma.mediaFolder.findUnique({ where });
      if (existing) {
        db.prepare('DELETE FROM media_folders WHERE id = ?').run(where.id);
      }
      return existing;
    },

    deleteMany: ({ where }: any = {}) => {
      if (!where || Object.keys(where).length === 0) {
        db.prepare('UPDATE media_folders SET parent_id = NULL').run();
        db.prepare('DELETE FROM media_folders').run();
        return;
      }
      let sql = 'DELETE FROM media_folders WHERE 1=1';
      const params: any[] = [];
      if (where?.id) { sql += ' AND id = ?'; params.push(where.id); }
      if (where?.parentId !== undefined) {
        if (where.parentId === null) { sql += ' AND parent_id IS NULL'; }
        else { sql += ' AND parent_id = ?'; params.push(where.parentId); }
      }
      db.prepare(sql).run(...params);
    }
  },

  mediaAsset: {
    findUnique: ({ where, include }: any) => {
      let row: any = null;
      if (where?.id) {
        row = db.prepare('SELECT * FROM media_assets WHERE id = ?').get(where.id);
      } else if (where?.storageKey) {
        row = db.prepare('SELECT * FROM media_assets WHERE storage_key = ?').get(where.storageKey);
      }
      if (!row) return null;

      const asset: any = {
        id: row.id,
        filename: row.filename,
        originalFilename: row.original_filename,
        storageKey: row.storage_key,
        publicUrl: row.public_url,
        mimeType: row.mime_type,
        mediaType: row.media_type || 'IMAGE',
        fileSize: Number(row.file_size),
        width: row.width !== null ? Number(row.width) : null,
        height: row.height !== null ? Number(row.height) : null,
        checksum: row.checksum,
        title: row.title || null,
        altText: row.alt_text || null,
        caption: row.caption || null,
        folderId: row.folder_id || null,
        createdAt: new Date(row.created_at),
        updatedAt: new Date(row.updated_at)
      };

      if (include?.folder && asset.folderId) {
        asset.folder = prisma.mediaFolder.findUnique({ where: { id: asset.folderId } });
      }
      if (include?.productMedia) {
        asset.productMedia = prisma.productMedia.findMany({ where: { mediaId: asset.id } });
      }
      if (include?.variantMedia) {
        asset.variantMedia = prisma.productVariantMedia.findMany({ where: { mediaId: asset.id } });
      }
      if (include?.categoryMedia) {
        asset.categoryMedia = prisma.categoryMedia.findMany({ where: { mediaId: asset.id } });
      }
      if (include?.collectionMedia) {
        asset.collectionMedia = prisma.collectionMedia.findMany({ where: { mediaId: asset.id } });
      }

      return asset;
    },

    findFirst: ({ where, include }: any = {}) => {
      let sql = 'SELECT * FROM media_assets WHERE 1=1';
      const params: any[] = [];
      if (where?.id) { sql += ' AND id = ?'; params.push(where.id); }
      if (where?.storageKey) { sql += ' AND storage_key = ?'; params.push(where.storageKey); }
      if (where?.checksum) { sql += ' AND checksum = ?'; params.push(where.checksum); }
      if (where?.folderId !== undefined) {
        if (where.folderId === null) {
          sql += ' AND folder_id IS NULL';
        } else {
          sql += ' AND folder_id = ?';
          params.push(where.folderId);
        }
      }
      const row: any = db.prepare(sql).get(...params);
      if (!row) return null;
      return prisma.mediaAsset.findUnique({ where: { id: row.id }, include });
    },

    findMany: ({ where, include, orderBy, take, skip }: any = {}) => {
      let sql = 'SELECT * FROM media_assets WHERE 1=1';
      const params: any[] = [];

      if (where?.folderId !== undefined) {
        if (where.folderId === null) {
          sql += ' AND folder_id IS NULL';
        } else {
          sql += ' AND folder_id = ?';
          params.push(where.folderId);
        }
      }
      if (where?.mimeType) {
        sql += ' AND mime_type = ?';
        params.push(where.mimeType);
      }
      if (where?.mediaType) {
        sql += ' AND media_type = ?';
        params.push(where.mediaType);
      }
      if (where?.checksum) {
        sql += ' AND checksum = ?';
        params.push(where.checksum);
      }
      if (where?.search) {
        sql += ' AND (LOWER(filename) LIKE LOWER(?) OR LOWER(original_filename) LIKE LOWER(?) OR LOWER(title) LIKE LOWER(?) OR LOWER(alt_text) LIKE LOWER(?))';
        params.push(`%${where.search}%`, `%${where.search}%`, `%${where.search}%`, `%${where.search}%`);
      }
      if (where?.isOrphan) {
        sql += ` AND id NOT IN (
          SELECT media_id FROM product_media
          UNION SELECT media_id FROM product_variant_media
          UNION SELECT media_id FROM category_media
          UNION SELECT media_id FROM collection_media
        )`;
      }

      if (orderBy?.createdAt) {
        sql += ` ORDER BY created_at ${orderBy.createdAt.toUpperCase()}`;
      } else if (orderBy?.fileSize) {
        sql += ` ORDER BY file_size ${orderBy.fileSize.toUpperCase()}`;
      } else if (orderBy?.filename) {
        sql += ` ORDER BY filename ${orderBy.filename.toUpperCase()}`;
      } else {
        sql += ' ORDER BY created_at DESC';
      }

      if (take !== undefined) {
        sql += ` LIMIT ${take}`;
        if (skip !== undefined) sql += ` OFFSET ${skip}`;
      }

      const rows: any[] = db.prepare(sql).all(...params);
      return rows.map(r => prisma.mediaAsset.findUnique({ where: { id: r.id }, include }));
    },

    count: ({ where }: any = {}) => {
      let sql = 'SELECT COUNT(*) as total FROM media_assets WHERE 1=1';
      const params: any[] = [];

      if (where?.folderId !== undefined) {
        if (where.folderId === null) {
          sql += ' AND folder_id IS NULL';
        } else {
          sql += ' AND folder_id = ?';
          params.push(where.folderId);
        }
      }
      if (where?.mimeType) {
        sql += ' AND mime_type = ?';
        params.push(where.mimeType);
      }
      if (where?.mediaType) {
        sql += ' AND media_type = ?';
        params.push(where.mediaType);
      }
      if (where?.search) {
        sql += ' AND (LOWER(filename) LIKE LOWER(?) OR LOWER(original_filename) LIKE LOWER(?) OR LOWER(title) LIKE LOWER(?) OR LOWER(alt_text) LIKE LOWER(?))';
        params.push(`%${where.search}%`, `%${where.search}%`, `%${where.search}%`, `%${where.search}%`);
      }
      if (where?.isOrphan) {
        sql += ` AND id NOT IN (
          SELECT media_id FROM product_media
          UNION SELECT media_id FROM product_variant_media
          UNION SELECT media_id FROM category_media
          UNION SELECT media_id FROM collection_media
        )`;
      }

      const res: any = db.prepare(sql).get(...params);
      return res?.total || 0;
    },

    create: ({ data, include }: any) => {
      const id = data.id || randomUUID();
      const now = new Date().toISOString();
      db.prepare(`
        INSERT INTO media_assets (
          id, filename, original_filename, storage_key, public_url, mime_type,
          media_type, file_size, width, height, checksum, title, alt_text, caption, folder_id,
          created_at, updated_at
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      `).run(
        id,
        data.filename,
        data.originalFilename,
        data.storageKey,
        data.publicUrl,
        data.mimeType,
        data.mediaType || 'IMAGE',
        Number(data.fileSize),
        data.width !== undefined && data.width !== null ? Number(data.width) : null,
        data.height !== undefined && data.height !== null ? Number(data.height) : null,
        data.checksum,
        data.title || null,
        data.altText || null,
        data.caption || null,
        data.folderId || null,
        now,
        now
      );
      return prisma.mediaAsset.findUnique({ where: { id }, include });
    },

    update: ({ where, data, include }: any) => {
      const sets: string[] = [];
      const params: any[] = [];
      const now = new Date().toISOString();

      if (data.title !== undefined) { sets.push('title = ?'); params.push(data.title); }
      if (data.altText !== undefined) { sets.push('alt_text = ?'); params.push(data.altText); }
      if (data.caption !== undefined) { sets.push('caption = ?'); params.push(data.caption); }
      if (data.folderId !== undefined) { sets.push('folder_id = ?'); params.push(data.folderId || null); }

      sets.push('updated_at = ?');
      params.push(now);
      params.push(where.id);

      db.prepare(`UPDATE media_assets SET ${sets.join(', ')} WHERE id = ?`).run(...params);
      return prisma.mediaAsset.findUnique({ where: { id: where.id }, include });
    },

    delete: ({ where }: any) => {
      const existing = prisma.mediaAsset.findUnique({ where });
      if (existing) {
        db.prepare('DELETE FROM media_assets WHERE id = ?').run(where.id);
      }
      return existing;
    },

    deleteMany: ({ where }: any = {}) => {
      if (!where || Object.keys(where).length === 0) {
        db.prepare('DELETE FROM product_media').run();
        db.prepare('DELETE FROM product_variant_media').run();
        db.prepare('DELETE FROM category_media').run();
        db.prepare('DELETE FROM collection_media').run();
        db.prepare('DELETE FROM media_assets').run();
        return;
      }
      let sql = 'DELETE FROM media_assets WHERE 1=1';
      const params: any[] = [];
      if (where?.id) { sql += ' AND id = ?'; params.push(where.id); }
      if (where?.folderId !== undefined) {
        if (where.folderId === null) { sql += ' AND folder_id IS NULL'; }
        else { sql += ' AND folder_id = ?'; params.push(where.folderId); }
      }
      db.prepare(sql).run(...params);
    }
  },

  productMedia: {
    findMany: ({ where, include, orderBy }: any = {}) => {
      let sql = 'SELECT * FROM product_media WHERE 1=1';
      const params: any[] = [];
      if (where?.productId) { sql += ' AND product_id = ?'; params.push(where.productId); }
      if (where?.mediaId) { sql += ' AND media_id = ?'; params.push(where.mediaId); }
      if (where?.isPrimary !== undefined) { sql += ' AND is_primary = ?'; params.push(where.isPrimary ? 1 : 0); }
      if (where?.role) { sql += ' AND role = ?'; params.push(where.role); }

      if (orderBy?.sortOrder) {
        sql += ` ORDER BY sort_order ${orderBy.sortOrder.toUpperCase()}`;
      } else {
        sql += ' ORDER BY sort_order ASC, created_at ASC';
      }

      const rows: any[] = db.prepare(sql).all(...params);
      return rows.map(r => ({
        productId: r.product_id,
        mediaId: r.media_id,
        sortOrder: Number(r.sort_order),
        isPrimary: Boolean(r.is_primary),
        role: r.role,
        createdAt: new Date(r.created_at),
        media: include?.media ? prisma.mediaAsset.findUnique({ where: { id: r.media_id } }) : undefined,
        product: include?.product ? prisma.product.findUnique({ where: { id: r.product_id } }) : undefined
      }));
    },

    findUnique: ({ where, include }: any) => {
      let row: any = null;
      if (where?.productId_mediaId) {
        row = db.prepare('SELECT * FROM product_media WHERE product_id = ? AND media_id = ?').get(
          where.productId_mediaId.productId,
          where.productId_mediaId.mediaId
        );
      } else if (where?.productId && where?.mediaId) {
        row = db.prepare('SELECT * FROM product_media WHERE product_id = ? AND media_id = ?').get(
          where.productId,
          where.mediaId
        );
      }
      if (!row) return null;
      return {
        productId: row.product_id,
        mediaId: row.media_id,
        sortOrder: Number(row.sort_order),
        isPrimary: Boolean(row.is_primary),
        role: row.role,
        createdAt: new Date(row.created_at),
        media: include?.media ? prisma.mediaAsset.findUnique({ where: { id: row.media_id } }) : undefined,
        product: include?.product ? prisma.product.findUnique({ where: { id: row.product_id } }) : undefined
      };
    },

    create: ({ data, include }: any) => {
      const now = new Date().toISOString();
      db.prepare(`
        INSERT OR REPLACE INTO product_media (product_id, media_id, sort_order, is_primary, role, created_at)
        VALUES (?, ?, ?, ?, ?, ?)
      `).run(
        data.productId,
        data.mediaId,
        data.sortOrder !== undefined ? Number(data.sortOrder) : 0,
        data.isPrimary ? 1 : 0,
        data.role || 'GALLERY',
        now
      );
      return prisma.productMedia.findUnique({
        where: { productId_mediaId: { productId: data.productId, mediaId: data.mediaId } },
        include
      });
    },

    update: ({ where, data, include }: any) => {
      const sets: string[] = [];
      const params: any[] = [];
      if (data.sortOrder !== undefined) { sets.push('sort_order = ?'); params.push(Number(data.sortOrder)); }
      if (data.isPrimary !== undefined) { sets.push('is_primary = ?'); params.push(data.isPrimary ? 1 : 0); }
      if (data.role !== undefined) { sets.push('role = ?'); params.push(data.role); }

      const pId = where?.productId_mediaId?.productId || where?.productId;
      const mId = where?.productId_mediaId?.mediaId || where?.mediaId;
      params.push(pId, mId);
      db.prepare(`UPDATE product_media SET ${sets.join(', ')} WHERE product_id = ? AND media_id = ?`).run(...params);

      return prisma.productMedia.findUnique({ where, include });
    },

    updateMany: ({ where, data }: any) => {
      const sets: string[] = [];
      const params: any[] = [];
      if (data.isPrimary !== undefined) { sets.push('is_primary = ?'); params.push(data.isPrimary ? 1 : 0); }
      if (data.sortOrder !== undefined) { sets.push('sort_order = ?'); params.push(Number(data.sortOrder)); }
      if (data.role !== undefined) { sets.push('role = ?'); params.push(data.role); }

      let sql = `UPDATE product_media SET ${sets.join(', ')} WHERE 1=1`;
      if (where?.productId) { sql += ' AND product_id = ?'; params.push(where.productId); }
      if (where?.mediaId) { sql += ' AND media_id = ?'; params.push(where.mediaId); }
      db.prepare(sql).run(...params);
    },

    delete: ({ where }: any) => {
      const existing = prisma.productMedia.findUnique({ where });
      if (existing) {
        const pId = where?.productId_mediaId?.productId || where?.productId;
        const mId = where?.productId_mediaId?.mediaId || where?.mediaId;
        db.prepare('DELETE FROM product_media WHERE product_id = ? AND media_id = ?').run(pId, mId);
      }
      return existing;
    },

    deleteMany: ({ where }: any = {}) => {
      let sql = 'DELETE FROM product_media WHERE 1=1';
      const params: any[] = [];
      if (where?.productId) { sql += ' AND product_id = ?'; params.push(where.productId); }
      if (where?.mediaId) { sql += ' AND media_id = ?'; params.push(where.mediaId); }
      db.prepare(sql).run(...params);
    }
  },

  productVariantMedia: {
    findMany: ({ where, include, orderBy }: any = {}) => {
      let sql = 'SELECT * FROM product_variant_media WHERE 1=1';
      const params: any[] = [];
      if (where?.variantId) { sql += ' AND variant_id = ?'; params.push(where.variantId); }
      if (where?.mediaId) { sql += ' AND media_id = ?'; params.push(where.mediaId); }
      if (where?.isPrimary !== undefined) { sql += ' AND is_primary = ?'; params.push(where.isPrimary ? 1 : 0); }
      if (where?.role) { sql += ' AND role = ?'; params.push(where.role); }

      if (orderBy?.sortOrder) {
        sql += ` ORDER BY sort_order ${orderBy.sortOrder.toUpperCase()}`;
      } else {
        sql += ' ORDER BY sort_order ASC, created_at ASC';
      }

      const rows: any[] = db.prepare(sql).all(...params);
      return rows.map(r => ({
        variantId: r.variant_id,
        mediaId: r.media_id,
        sortOrder: Number(r.sort_order),
        isPrimary: Boolean(r.is_primary),
        role: r.role,
        createdAt: new Date(r.created_at),
        media: include?.media ? prisma.mediaAsset.findUnique({ where: { id: r.media_id } }) : undefined
      }));
    },

    findUnique: ({ where, include }: any) => {
      let row: any = null;
      if (where?.variantId_mediaId) {
        row = db.prepare('SELECT * FROM product_variant_media WHERE variant_id = ? AND media_id = ?').get(
          where.variantId_mediaId.variantId,
          where.variantId_mediaId.mediaId
        );
      } else if (where?.variantId && where?.mediaId) {
        row = db.prepare('SELECT * FROM product_variant_media WHERE variant_id = ? AND media_id = ?').get(
          where.variantId,
          where.mediaId
        );
      }
      if (!row) return null;
      return {
        variantId: row.variant_id,
        mediaId: row.media_id,
        sortOrder: Number(row.sort_order),
        isPrimary: Boolean(row.is_primary),
        role: row.role,
        createdAt: new Date(row.created_at),
        media: include?.media ? prisma.mediaAsset.findUnique({ where: { id: row.media_id } }) : undefined
      };
    },

    create: ({ data, include }: any) => {
      const now = new Date().toISOString();
      db.prepare(`
        INSERT OR REPLACE INTO product_variant_media (variant_id, media_id, sort_order, is_primary, role, created_at)
        VALUES (?, ?, ?, ?, ?, ?)
      `).run(
        data.variantId,
        data.mediaId,
        data.sortOrder !== undefined ? Number(data.sortOrder) : 0,
        data.isPrimary ? 1 : 0,
        data.role || 'GALLERY',
        now
      );
      return prisma.productVariantMedia.findUnique({
        where: { variantId_mediaId: { variantId: data.variantId, mediaId: data.mediaId } },
        include
      });
    },

    update: ({ where, data, include }: any) => {
      const sets: string[] = [];
      const params: any[] = [];
      if (data.sortOrder !== undefined) { sets.push('sort_order = ?'); params.push(Number(data.sortOrder)); }
      if (data.isPrimary !== undefined) { sets.push('is_primary = ?'); params.push(data.isPrimary ? 1 : 0); }
      if (data.role !== undefined) { sets.push('role = ?'); params.push(data.role); }

      const vId = where?.variantId_mediaId?.variantId || where?.variantId;
      const mId = where?.variantId_mediaId?.mediaId || where?.mediaId;
      params.push(vId, mId);
      db.prepare(`UPDATE product_variant_media SET ${sets.join(', ')} WHERE variant_id = ? AND media_id = ?`).run(...params);

      return prisma.productVariantMedia.findUnique({ where, include });
    },

    updateMany: ({ where, data }: any) => {
      const sets: string[] = [];
      const params: any[] = [];
      if (data.isPrimary !== undefined) { sets.push('is_primary = ?'); params.push(data.isPrimary ? 1 : 0); }
      if (data.sortOrder !== undefined) { sets.push('sort_order = ?'); params.push(Number(data.sortOrder)); }
      if (data.role !== undefined) { sets.push('role = ?'); params.push(data.role); }

      let sql = `UPDATE product_variant_media SET ${sets.join(', ')} WHERE 1=1`;
      if (where?.variantId) { sql += ' AND variant_id = ?'; params.push(where.variantId); }
      if (where?.mediaId) { sql += ' AND media_id = ?'; params.push(where.mediaId); }
      db.prepare(sql).run(...params);
    },

    delete: ({ where }: any) => {
      const existing = prisma.productVariantMedia.findUnique({ where });
      if (existing) {
        const vId = where?.variantId_mediaId?.variantId || where?.variantId;
        const mId = where?.variantId_mediaId?.mediaId || where?.mediaId;
        db.prepare('DELETE FROM product_variant_media WHERE variant_id = ? AND media_id = ?').run(vId, mId);
      }
      return existing;
    },

    deleteMany: ({ where }: any = {}) => {
      let sql = 'DELETE FROM product_variant_media WHERE 1=1';
      const params: any[] = [];
      if (where?.variantId) { sql += ' AND variant_id = ?'; params.push(where.variantId); }
      if (where?.mediaId) { sql += ' AND media_id = ?'; params.push(where.mediaId); }
      db.prepare(sql).run(...params);
    }
  },

  categoryMedia: {
    findMany: ({ where, include, orderBy }: any = {}) => {
      let sql = 'SELECT * FROM category_media WHERE 1=1';
      const params: any[] = [];
      if (where?.categoryId) { sql += ' AND category_id = ?'; params.push(where.categoryId); }
      if (where?.mediaId) { sql += ' AND media_id = ?'; params.push(where.mediaId); }
      if (where?.isPrimary !== undefined) { sql += ' AND is_primary = ?'; params.push(where.isPrimary ? 1 : 0); }
      if (where?.role) { sql += ' AND role = ?'; params.push(where.role); }

      if (orderBy?.sortOrder) {
        sql += ` ORDER BY sort_order ${orderBy.sortOrder.toUpperCase()}`;
      } else {
        sql += ' ORDER BY sort_order ASC, created_at ASC';
      }

      const rows: any[] = db.prepare(sql).all(...params);
      return rows.map(r => ({
        categoryId: r.category_id,
        mediaId: r.media_id,
        sortOrder: Number(r.sort_order),
        isPrimary: Boolean(r.is_primary),
        role: r.role,
        createdAt: new Date(r.created_at),
        media: include?.media ? prisma.mediaAsset.findUnique({ where: { id: r.media_id } }) : undefined
      }));
    },

    findUnique: ({ where, include }: any) => {
      let row: any = null;
      if (where?.categoryId_mediaId) {
        row = db.prepare('SELECT * FROM category_media WHERE category_id = ? AND media_id = ?').get(
          where.categoryId_mediaId.categoryId,
          where.categoryId_mediaId.mediaId
        );
      } else if (where?.categoryId && where?.mediaId) {
        row = db.prepare('SELECT * FROM category_media WHERE category_id = ? AND media_id = ?').get(
          where.categoryId,
          where.mediaId
        );
      }
      if (!row) return null;
      return {
        categoryId: row.category_id,
        mediaId: row.media_id,
        sortOrder: Number(row.sort_order),
        isPrimary: Boolean(row.is_primary),
        role: row.role,
        createdAt: new Date(row.created_at),
        media: include?.media ? prisma.mediaAsset.findUnique({ where: { id: row.media_id } }) : undefined
      };
    },

    create: ({ data, include }: any) => {
      const now = new Date().toISOString();
      db.prepare(`
        INSERT OR REPLACE INTO category_media (category_id, media_id, sort_order, is_primary, role, created_at)
        VALUES (?, ?, ?, ?, ?, ?)
      `).run(
        data.categoryId,
        data.mediaId,
        data.sortOrder !== undefined ? Number(data.sortOrder) : 0,
        data.isPrimary ? 1 : 0,
        data.role || 'PRIMARY',
        now
      );
      return prisma.categoryMedia.findUnique({
        where: { categoryId_mediaId: { categoryId: data.categoryId, mediaId: data.mediaId } },
        include
      });
    },

    update: ({ where, data, include }: any) => {
      const sets: string[] = [];
      const params: any[] = [];
      if (data.sortOrder !== undefined) { sets.push('sort_order = ?'); params.push(Number(data.sortOrder)); }
      if (data.isPrimary !== undefined) { sets.push('is_primary = ?'); params.push(data.isPrimary ? 1 : 0); }
      if (data.role !== undefined) { sets.push('role = ?'); params.push(data.role); }

      const catId = where?.categoryId_mediaId?.categoryId || where?.categoryId;
      const medId = where?.categoryId_mediaId?.mediaId || where?.mediaId;
      params.push(catId, medId);
      db.prepare(`UPDATE category_media SET ${sets.join(', ')} WHERE category_id = ? AND media_id = ?`).run(...params);

      return prisma.categoryMedia.findUnique({ where, include });
    },

    updateMany: ({ where, data }: any) => {
      const sets: string[] = [];
      const params: any[] = [];
      if (data.isPrimary !== undefined) { sets.push('is_primary = ?'); params.push(data.isPrimary ? 1 : 0); }
      if (data.sortOrder !== undefined) { sets.push('sort_order = ?'); params.push(Number(data.sortOrder)); }
      if (data.role !== undefined) { sets.push('role = ?'); params.push(data.role); }

      let sql = `UPDATE category_media SET ${sets.join(', ')} WHERE 1=1`;
      if (where?.categoryId) { sql += ' AND category_id = ?'; params.push(where.categoryId); }
      if (where?.mediaId) { sql += ' AND media_id = ?'; params.push(where.mediaId); }
      db.prepare(sql).run(...params);
    },

    delete: ({ where }: any) => {
      const existing = prisma.categoryMedia.findUnique({ where });
      if (existing) {
        const catId = where?.categoryId_mediaId?.categoryId || where?.categoryId;
        const medId = where?.categoryId_mediaId?.mediaId || where?.mediaId;
        db.prepare('DELETE FROM category_media WHERE category_id = ? AND media_id = ?').run(catId, medId);
      }
      return existing;
    },

    deleteMany: ({ where }: any = {}) => {
      let sql = 'DELETE FROM category_media WHERE 1=1';
      const params: any[] = [];
      if (where?.categoryId) { sql += ' AND category_id = ?'; params.push(where.categoryId); }
      if (where?.mediaId) { sql += ' AND media_id = ?'; params.push(where.mediaId); }
      db.prepare(sql).run(...params);
    }
  },

  collectionMedia: {
    findMany: ({ where, include, orderBy }: any = {}) => {
      let sql = 'SELECT * FROM collection_media WHERE 1=1';
      const params: any[] = [];
      if (where?.collectionId) { sql += ' AND collection_id = ?'; params.push(where.collectionId); }
      if (where?.mediaId) { sql += ' AND media_id = ?'; params.push(where.mediaId); }
      if (where?.isPrimary !== undefined) { sql += ' AND is_primary = ?'; params.push(where.isPrimary ? 1 : 0); }
      if (where?.role) { sql += ' AND role = ?'; params.push(where.role); }

      if (orderBy?.sortOrder) {
        sql += ` ORDER BY sort_order ${orderBy.sortOrder.toUpperCase()}`;
      } else {
        sql += ' ORDER BY sort_order ASC, created_at ASC';
      }

      const rows: any[] = db.prepare(sql).all(...params);
      return rows.map(r => ({
        collectionId: r.collection_id,
        mediaId: r.media_id,
        sortOrder: Number(r.sort_order),
        isPrimary: Boolean(r.is_primary),
        role: r.role,
        createdAt: new Date(r.created_at),
        media: include?.media ? prisma.mediaAsset.findUnique({ where: { id: r.media_id } }) : undefined
      }));
    },

    findUnique: ({ where, include }: any) => {
      let row: any = null;
      if (where?.collectionId_mediaId) {
        row = db.prepare('SELECT * FROM collection_media WHERE collection_id = ? AND media_id = ?').get(
          where.collectionId_mediaId.collectionId,
          where.collectionId_mediaId.mediaId
        );
      } else if (where?.collectionId && where?.mediaId) {
        row = db.prepare('SELECT * FROM collection_media WHERE collection_id = ? AND media_id = ?').get(
          where.collectionId,
          where.mediaId
        );
      }
      if (!row) return null;
      return {
        collectionId: row.collection_id,
        mediaId: row.media_id,
        sortOrder: Number(row.sort_order),
        isPrimary: Boolean(row.is_primary),
        role: row.role,
        createdAt: new Date(row.created_at),
        media: include?.media ? prisma.mediaAsset.findUnique({ where: { id: row.media_id } }) : undefined
      };
    },

    create: ({ data, include }: any) => {
      const now = new Date().toISOString();
      db.prepare(`
        INSERT OR REPLACE INTO collection_media (collection_id, media_id, sort_order, is_primary, role, created_at)
        VALUES (?, ?, ?, ?, ?, ?)
      `).run(
        data.collectionId,
        data.mediaId,
        data.sortOrder !== undefined ? Number(data.sortOrder) : 0,
        data.isPrimary ? 1 : 0,
        data.role || 'PRIMARY',
        now
      );
      return prisma.collectionMedia.findUnique({
        where: { collectionId_mediaId: { collectionId: data.collectionId, mediaId: data.mediaId } },
        include
      });
    },

    update: ({ where, data, include }: any) => {
      const sets: string[] = [];
      const params: any[] = [];
      if (data.sortOrder !== undefined) { sets.push('sort_order = ?'); params.push(Number(data.sortOrder)); }
      if (data.isPrimary !== undefined) { sets.push('is_primary = ?'); params.push(data.isPrimary ? 1 : 0); }
      if (data.role !== undefined) { sets.push('role = ?'); params.push(data.role); }

      const colId = where?.collectionId_mediaId?.collectionId || where?.collectionId;
      const medId = where?.collectionId_mediaId?.mediaId || where?.mediaId;
      params.push(colId, medId);
      db.prepare(`UPDATE collection_media SET ${sets.join(', ')} WHERE collection_id = ? AND media_id = ?`).run(...params);

      return prisma.collectionMedia.findUnique({ where, include });
    },

    updateMany: ({ where, data }: any) => {
      const sets: string[] = [];
      const params: any[] = [];
      if (data.isPrimary !== undefined) { sets.push('is_primary = ?'); params.push(data.isPrimary ? 1 : 0); }
      if (data.sortOrder !== undefined) { sets.push('sort_order = ?'); params.push(Number(data.sortOrder)); }
      if (data.role !== undefined) { sets.push('role = ?'); params.push(data.role); }

      let sql = `UPDATE collection_media SET ${sets.join(', ')} WHERE 1=1`;
      if (where?.collectionId) { sql += ' AND collection_id = ?'; params.push(where.collectionId); }
      if (where?.mediaId) { sql += ' AND media_id = ?'; params.push(where.mediaId); }
      db.prepare(sql).run(...params);
    },

    delete: ({ where }: any) => {
      const existing = prisma.collectionMedia.findUnique({ where });
      if (existing) {
        const colId = where?.collectionId_mediaId?.collectionId || where?.collectionId;
        const medId = where?.collectionId_mediaId?.mediaId || where?.mediaId;
        db.prepare('DELETE FROM collection_media WHERE collection_id = ? AND media_id = ?').run(colId, medId);
      }
      return existing;
    },

    deleteMany: ({ where }: any = {}) => {
      let sql = 'DELETE FROM collection_media WHERE 1=1';
      const params: any[] = [];
      if (where?.collectionId) { sql += ' AND collection_id = ?'; params.push(where.collectionId); }
      if (where?.mediaId) { sql += ' AND media_id = ?'; params.push(where.mediaId); }
      db.prepare(sql).run(...params);
    }
  },

  $transaction: async (fn: any) => {
    if (typeof fn === 'function') {
      return fn(prisma);
    }
    if (Array.isArray(fn)) {
      return Promise.all(fn);
    }
    return fn;
  }
};

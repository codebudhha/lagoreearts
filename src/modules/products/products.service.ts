import { prisma } from '../../database/prisma.ts';
import { ProductsRepository } from './products.repository.ts';
import { CategoriesRepository } from '../categories/categories.repository.ts';
import { CollectionsRepository } from '../collections/collections.repository.ts';
import { AttributesRepository } from '../attributes/attributes.repository.ts';
import { AuditService } from '../../audit/audit.service.ts';
import type {
  CreateProductInput,
  UpdateProductInput,
  ProductFilterQuery,
  ProductAttributeInput
} from './products.types.ts';

export class ProductsService {
  /**
   * Helper: Normalize string to URL-safe slug
   */
  static slugify(text: string): string {
    return text
      .toLowerCase()
      .trim()
      .replace(/[^\w\s-]/g, '')
      .replace(/[\s_-]+/g, '-')
      .replace(/^-+|-+$/g, '');
  }

  /**
   * Helper: Resolve globally unique slug with deterministic numeric suffix
   */
  static async resolveUniqueSlug(baseNameOrSlug: string, currentId?: string): Promise<string> {
    let slug = this.slugify(baseNameOrSlug);
    if (!slug) slug = 'product';

    let candidate = slug;
    let counter = 1;

    while (true) {
      const existing = await ProductsRepository.findBySlug(candidate);
      if (!existing || (currentId && existing.id === currentId)) {
        return candidate;
      }
      counter += 1;
      candidate = `${slug}-${counter}`;
    }
  }

  /**
   * Helper: Resolve SEO fallbacks
   */
  static resolveSeo(name: string, input: { metaTitle?: string; ogTitle?: string }) {
    const metaTitle = input.metaTitle?.trim() || name;
    const ogTitle = input.ogTitle?.trim() || metaTitle;
    return { metaTitle, ogTitle };
  }

  /**
   * Helper: Validate dynamic attributes according to Module 4 rules
   */
  static async validateAndFormatAttributes(attributes: ProductAttributeInput[] = []): Promise<ProductAttributeInput[]> {
    const formatted: ProductAttributeInput[] = [];

    for (const attrInput of attributes) {
      if (!attrInput.attributeId) {
        throw { status: 400, code: 'INVALID_ATTRIBUTE', message: 'attributeId is required for each attribute value' };
      }

      const attribute = await AttributesRepository.findById(attrInput.attributeId);
      if (!attribute) {
        throw { status: 400, code: 'ATTRIBUTE_NOT_FOUND', message: `Attribute with ID "${attrInput.attributeId}" not found` };
      }
      if (attribute.status !== 'ACTIVE') {
        throw { status: 400, code: 'ATTRIBUTE_INACTIVE', message: `Attribute "${attribute.name}" is currently inactive` };
      }

      // Check AttributeValue
      if (attrInput.attributeValueId) {
        const val = await AttributesRepository.findValueById(attrInput.attributeValueId);
        if (!val || val.attributeId !== attribute.id) {
          throw {
            status: 400,
            code: 'INVALID_ATTRIBUTE_VALUE',
            message: `Attribute value with ID "${attrInput.attributeValueId}" does not belong to attribute "${attribute.name}"`
          };
        }
        if (val.status !== 'ACTIVE') {
          throw { status: 400, code: 'ATTRIBUTE_VALUE_INACTIVE', message: `Attribute value "${val.name}" is inactive` };
        }
      }

      // Type matching checks
      if ((attribute.type === 'SELECT' || attribute.type === 'MULTI_SELECT') && !attrInput.attributeValueId) {
        throw {
          status: 400,
          code: 'ATTRIBUTE_TYPE_MISMATCH',
          message: `Attribute "${attribute.name}" requires an attributeValueId`
        };
      }

      formatted.push({
        attributeId: attrInput.attributeId,
        attributeValueId: attrInput.attributeValueId || undefined,
        textValue: attrInput.textValue || undefined,
        numberValue: attrInput.numberValue !== undefined && attrInput.numberValue !== null ? Number(attrInput.numberValue) : undefined,
        booleanValue: attrInput.booleanValue !== undefined && attrInput.booleanValue !== null ? Boolean(attrInput.booleanValue) : undefined
      });
    }

    return formatted;
  }

  // ==========================================
  // 1. ADMIN PRODUCT CRUD
  // ==========================================

  static async createProduct(input: CreateProductInput, actorAdminId: string, meta: any = {}) {
    const name = input.name.trim();
    const sku = input.sku.trim().toUpperCase();

    // 1. Validate Category
    const category = await CategoriesRepository.findById(input.categoryId);
    if (!category) {
      throw { status: 400, code: 'CATEGORY_NOT_FOUND', message: `Category with ID "${input.categoryId}" not found` };
    }

    // 2. Validate SKU uniqueness
    const existingSku = await ProductsRepository.findBySku(sku);
    if (existingSku) {
      throw { status: 400, code: 'DUPLICATE_SKU', message: `SKU "${sku}" is already in use` };
    }
    const existingVariantSku = await prisma.productVariant.findUnique({ where: { sku } });
    if (existingVariantSku) {
      throw { status: 400, code: 'DUPLICATE_SKU', message: `SKU "${sku}" is already in use by a product variant` };
    }

    // 3. Resolve Unique Slug
    const slug = input.slug
      ? this.slugify(input.slug)
      : await this.resolveUniqueSlug(name);

    const existingSlug = await ProductsRepository.findBySlug(slug);
    if (existingSlug) {
      throw { status: 400, code: 'DUPLICATE_SLUG', message: `Slug "${slug}" is already in use` };
    }

    // 4. Validate Pricing
    const price = Number(input.price);
    if (price < 0) {
      throw { status: 400, code: 'INVALID_PRICE', message: 'Price must be a non-negative number' };
    }
    if (input.compareAtPrice !== undefined && input.compareAtPrice !== null) {
      if (Number(input.compareAtPrice) < price) {
        throw { status: 400, code: 'INVALID_COMPARE_PRICE', message: 'Compare at price cannot be lower than selling price' };
      }
    }

    // 5. Validate Collections if provided
    if (input.collectionIds && input.collectionIds.length > 0) {
      for (const colId of input.collectionIds) {
        const col = await CollectionsRepository.findById(colId);
        if (!col) {
          throw { status: 400, code: 'COLLECTION_NOT_FOUND', message: `Collection with ID "${colId}" not found` };
        }
      }
    }

    // 6. Validate & Format Attributes
    const validAttributes = await this.validateAndFormatAttributes(input.attributes);

    // 7. SEO Fallbacks
    const { metaTitle, ogTitle } = this.resolveSeo(name, input);

    // 8. Create Product Record
    const product = await ProductsRepository.create({
      name,
      slug,
      sku,
      shortDescription: input.shortDescription || null,
      description: input.description || null,
      status: input.status || 'DRAFT',
      productType: input.productType || 'SIMPLE',
      price,
      compareAtPrice: input.compareAtPrice !== undefined && input.compareAtPrice !== null ? Number(input.compareAtPrice) : null,
      costPrice: input.costPrice !== undefined && input.costPrice !== null ? Number(input.costPrice) : null,
      currency: input.currency || 'INR',
      stockQuantity: input.stockQuantity !== undefined ? Math.max(0, Number(input.stockQuantity)) : 0,
      lowStockThreshold: input.lowStockThreshold !== undefined ? Math.max(0, Number(input.lowStockThreshold)) : 5,
      trackInventory: input.trackInventory !== undefined ? Boolean(input.trackInventory) : true,
      allowBackorder: Boolean(input.allowBackorder),
      isFeatured: Boolean(input.isFeatured),
      isNewArrival: Boolean(input.isNewArrival),
      isBestseller: Boolean(input.isBestseller),
      sortOrder: input.sortOrder !== undefined ? Math.max(0, Number(input.sortOrder)) : 0,
      categoryId: input.categoryId,
      image: input.image || null,
      thumbnail: input.thumbnail || null,
      bannerImage: input.bannerImage || null,
      metaTitle,
      metaDescription: input.metaDescription || null,
      canonicalUrl: input.canonicalUrl || null,
      ogTitle,
      ogDescription: input.ogDescription || null,
      ogImage: input.ogImage || null
    });

    // 9. Assign Collections & Attributes
    if (input.collectionIds && input.collectionIds.length > 0) {
      await ProductsRepository.setCollections(product.id, input.collectionIds);
    }
    if (validAttributes.length > 0) {
      await ProductsRepository.setAttributes(product.id, validAttributes);
    }

    // 10. Audit Log
    AuditService.log({
      adminUserId: actorAdminId,
      action: 'PRODUCT_CREATED',
      module: 'PRODUCTS',
      entityType: 'Product',
      entityId: product?.id,
      newValues: {
        name: product?.name,
        slug: product?.slug,
        sku: product?.sku,
        status: product?.status,
        price: product?.price,
        categoryId: product?.categoryId
      },
      ipAddress: meta.ipAddress,
      userAgent: meta.userAgent
    });

    return ProductsRepository.findById(product.id);
  }

  static async getProductById(id: string) {
    const product = await ProductsRepository.findById(id);
    if (!product) {
      throw { status: 404, code: 'NOT_FOUND', message: 'Product not found' };
    }
    return product;
  }

  static async getProductBySlug(slug: string) {
    const product = await ProductsRepository.findBySlug(slug);
    if (!product) {
      throw { status: 404, code: 'NOT_FOUND', message: 'Product not found' };
    }
    return product;
  }

  static async updateProduct(id: string, input: UpdateProductInput, actorAdminId: string, meta: any = {}) {
    const existing = await ProductsRepository.findById(id);
    if (!existing) {
      throw { status: 404, code: 'NOT_FOUND', message: 'Product not found' };
    }

    const updates: any = {};

    // 1. Name Check
    if (input.name !== undefined) {
      const name = input.name.trim();
      updates.name = name;
    }

    // 2. Slug Check
    if (input.slug !== undefined) {
      const slug = this.slugify(input.slug);
      const duplicateSlug = await ProductsRepository.findBySlug(slug);
      if (duplicateSlug && duplicateSlug.id !== id) {
        throw { status: 400, code: 'DUPLICATE_SLUG', message: `Slug "${slug}" is already in use` };
      }
      updates.slug = slug;
    }

    // 3. SKU Check
    if (input.sku !== undefined) {
      const sku = input.sku.trim().toUpperCase();
      const duplicateSku = await ProductsRepository.findBySku(sku);
      if (duplicateSku && duplicateSku.id !== id) {
        throw { status: 400, code: 'DUPLICATE_SKU', message: `SKU "${sku}" is already in use` };
      }
      const duplicateVariantSku = await prisma.productVariant.findUnique({ where: { sku } });
      if (duplicateVariantSku && duplicateVariantSku.productId !== id) {
        throw { status: 400, code: 'DUPLICATE_SKU', message: `SKU "${sku}" is already in use by a product variant` };
      }
      updates.sku = sku;
    }

    // 4. Category Check
    if (input.categoryId !== undefined) {
      const category = await CategoriesRepository.findById(input.categoryId);
      if (!category) {
        throw { status: 400, code: 'CATEGORY_NOT_FOUND', message: `Category with ID "${input.categoryId}" not found` };
      }
      updates.categoryId = input.categoryId;
    }

    // 5. Pricing Check
    if (input.price !== undefined) {
      const price = Number(input.price);
      if (price < 0) {
        throw { status: 400, code: 'INVALID_PRICE', message: 'Price must be a non-negative number' };
      }
      updates.price = price;
    }
    if (input.compareAtPrice !== undefined) {
      const currentPrice = updates.price !== undefined ? updates.price : existing.price;
      if (input.compareAtPrice !== null && Number(input.compareAtPrice) < currentPrice) {
        throw { status: 400, code: 'INVALID_COMPARE_PRICE', message: 'Compare at price cannot be lower than selling price' };
      }
      updates.compareAtPrice = input.compareAtPrice !== null ? Number(input.compareAtPrice) : null;
    }
    if (input.costPrice !== undefined) {
      updates.costPrice = input.costPrice !== null ? Number(input.costPrice) : null;
    }

    if (input.shortDescription !== undefined) updates.shortDescription = input.shortDescription;
    if (input.description !== undefined) updates.description = input.description;
    if (input.status !== undefined) updates.status = input.status;
    if (input.productType !== undefined) {
      if (input.productType === 'SIMPLE' && existing.productType === 'VARIABLE') {
        const variantCount = await prisma.productVariant.count({ where: { productId: id } });
        if (variantCount > 0) {
          throw { status: 409, code: 'CONFLICT', message: 'Cannot convert product to SIMPLE while variants exist. Please remove all variants first.' };
        }
      }
      updates.productType = input.productType;
    }
    // Antique One-of-a-kind checks
    if (existing.antiqueProfile?.isOneOfAKind) {
      if (input.stockQuantity !== undefined && Number(input.stockQuantity) > 1) {
        throw {
          status: 400,
          code: 'ONE_OF_A_KIND_STOCK_LIMIT',
          message: 'This is a one-of-a-kind antique product. Stock quantity cannot exceed 1.'
        };
      }
      if (input.allowBackorder === true) {
        throw {
          status: 400,
          code: 'ONE_OF_A_KIND_BACKORDER_NOT_ALLOWED',
          message: 'This is a one-of-a-kind antique product. Backorders cannot be enabled.'
        };
      }
    }

    if (input.stockQuantity !== undefined) updates.stockQuantity = Math.max(0, Number(input.stockQuantity));
    if (input.lowStockThreshold !== undefined) updates.lowStockThreshold = Math.max(0, Number(input.lowStockThreshold));
    if (input.trackInventory !== undefined) updates.trackInventory = Boolean(input.trackInventory);
    if (input.allowBackorder !== undefined) updates.allowBackorder = Boolean(input.allowBackorder);
    if (input.isFeatured !== undefined) updates.isFeatured = Boolean(input.isFeatured);
    if (input.isNewArrival !== undefined) updates.isNewArrival = Boolean(input.isNewArrival);
    if (input.isBestseller !== undefined) updates.isBestseller = Boolean(input.isBestseller);
    if (input.sortOrder !== undefined) updates.sortOrder = Math.max(0, Number(input.sortOrder));
    if (input.image !== undefined) updates.image = input.image;
    if (input.thumbnail !== undefined) updates.thumbnail = input.thumbnail;
    if (input.bannerImage !== undefined) updates.bannerImage = input.bannerImage;
    if (input.metaTitle !== undefined) updates.metaTitle = input.metaTitle;
    if (input.metaDescription !== undefined) updates.metaDescription = input.metaDescription;
    if (input.canonicalUrl !== undefined) updates.canonicalUrl = input.canonicalUrl;
    if (input.ogTitle !== undefined) updates.ogTitle = input.ogTitle;
    if (input.ogDescription !== undefined) updates.ogDescription = input.ogDescription;
    if (input.ogImage !== undefined) updates.ogImage = input.ogImage;

    await ProductsRepository.update(id, updates);

    // Update Collections if provided
    if (input.collectionIds !== undefined) {
      if (input.collectionIds.length > 0) {
        for (const colId of input.collectionIds) {
          const col = await CollectionsRepository.findById(colId);
          if (!col) throw { status: 400, code: 'COLLECTION_NOT_FOUND', message: `Collection with ID "${colId}" not found` };
        }
      }
      await ProductsRepository.setCollections(id, input.collectionIds);
      AuditService.log({
        adminUserId: actorAdminId,
        action: 'PRODUCT_COLLECTIONS_CHANGED',
        module: 'PRODUCTS',
        entityType: 'Product',
        entityId: id,
        newValues: { collectionIds: input.collectionIds },
        ipAddress: meta.ipAddress,
        userAgent: meta.userAgent
      });
    }

    // Update Attributes if provided
    if (input.attributes !== undefined) {
      const validAttributes = await this.validateAndFormatAttributes(input.attributes);
      await ProductsRepository.setAttributes(id, validAttributes);
      AuditService.log({
        adminUserId: actorAdminId,
        action: 'PRODUCT_ATTRIBUTES_CHANGED',
        module: 'PRODUCTS',
        entityType: 'Product',
        entityId: id,
        newValues: { attributes: validAttributes },
        ipAddress: meta.ipAddress,
        userAgent: meta.userAgent
      });
    }

    // Determine specific Audit Action
    let auditAction = 'PRODUCT_UPDATED';
    if (updates.status && updates.status !== existing.status) auditAction = 'PRODUCT_STATUS_CHANGED';
    else if (updates.isFeatured !== undefined && updates.isFeatured !== existing.isFeatured) auditAction = 'PRODUCT_FEATURED_CHANGED';
    else if (updates.isNewArrival !== undefined && updates.isNewArrival !== existing.isNewArrival) auditAction = 'PRODUCT_NEW_ARRIVAL_CHANGED';
    else if (updates.isBestseller !== undefined && updates.isBestseller !== existing.isBestseller) auditAction = 'PRODUCT_BESTSELLER_CHANGED';
    else if (updates.sortOrder !== undefined && updates.sortOrder !== existing.sortOrder) auditAction = 'PRODUCT_SORT_CHANGED';

    AuditService.log({
      adminUserId: actorAdminId,
      action: auditAction,
      module: 'PRODUCTS',
      entityType: 'Product',
      entityId: id,
      oldValues: {
        name: existing.name,
        slug: existing.slug,
        sku: existing.sku,
        status: existing.status,
        price: existing.price,
        isFeatured: existing.isFeatured
      },
      newValues: updates,
      ipAddress: meta.ipAddress,
      userAgent: meta.userAgent
    });

    return ProductsRepository.findById(id);
  }

  static async deleteProduct(id: string, actorAdminId: string, meta: any = {}) {
    const product = await ProductsRepository.findById(id);
    if (!product) {
      throw { status: 404, code: 'NOT_FOUND', message: 'Product not found' };
    }

    await ProductsRepository.delete(id);

    AuditService.log({
      adminUserId: actorAdminId,
      action: 'PRODUCT_DELETED',
      module: 'PRODUCTS',
      entityType: 'Product',
      entityId: id,
      oldValues: { name: product.name, slug: product.slug, sku: product.sku },
      ipAddress: meta.ipAddress,
      userAgent: meta.userAgent
    });

    return { success: true, message: 'Product deleted successfully' };
  }

  static async updateStatus(id: string, status: string, actorAdminId: string, meta: any = {}) {
    const validStatuses = ['DRAFT', 'ACTIVE', 'INACTIVE', 'ARCHIVED'];
    if (!validStatuses.includes(status)) {
      throw { status: 400, code: 'INVALID_STATUS', message: 'Invalid product status' };
    }
    return this.updateProduct(id, { status: status as any }, actorAdminId, meta);
  }

  static async updateFeatured(id: string, isFeatured: boolean, actorAdminId: string, meta: any = {}) {
    return this.updateProduct(id, { isFeatured }, actorAdminId, meta);
  }

  static async updateSortOrder(id: string, sortOrder: number, actorAdminId: string, meta: any = {}) {
    return this.updateProduct(id, { sortOrder }, actorAdminId, meta);
  }

  static async listAdminProducts(query: ProductFilterQuery) {
    const page = Math.max(1, Number(query.page) || 1);
    const limit = Math.min(100, Math.max(1, Number(query.limit) || 20));
    const skip = (page - 1) * limit;

    const where: any = {};
    if (query.status) where.status = query.status;
    if (query.productType) where.productType = query.productType;
    if (query.categoryId) where.categoryId = query.categoryId;
    if (query.collectionId) where.collectionId = query.collectionId;
    if (query.featured !== undefined) where.isFeatured = query.featured === 'true' || query.featured === true;
    if (query.newArrival !== undefined) where.isNewArrival = query.newArrival === 'true' || query.newArrival === true;
    if (query.bestseller !== undefined) where.isBestseller = query.bestseller === 'true' || query.bestseller === true;
    if (query.minPrice !== undefined) where.minPrice = Number(query.minPrice);
    if (query.maxPrice !== undefined) where.maxPrice = Number(query.maxPrice);
    if (query.stockState) where.stockState = query.stockState;
    if (query.search) where.search = query.search;

    const orderBy: any = {};
    if (query.sort) {
      const order = query.order?.toLowerCase() === 'desc' ? 'desc' : 'asc';
      orderBy[query.sort] = order;
    } else {
      orderBy.sortOrder = 'asc';
    }

    const { items, total } = await ProductsRepository.listProducts({
      where,
      orderBy,
      skip,
      take: limit
    });

    return {
      items,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit)
      }
    };
  }

  // ==========================================
  // 2. PRODUCT COLLECTIONS & ATTRIBUTES SUB-OPERATIONS
  // ==========================================

  static async getProductCollections(productId: string) {
    const product = await ProductsRepository.findById(productId);
    if (!product) throw { status: 404, code: 'NOT_FOUND', message: 'Product not found' };
    return ProductsRepository.getCollections(productId);
  }

  static async setProductCollections(productId: string, collectionIds: string[], actorAdminId: string, meta: any = {}) {
    const product = await ProductsRepository.findById(productId);
    if (!product) throw { status: 404, code: 'NOT_FOUND', message: 'Product not found' };

    for (const cid of collectionIds) {
      const col = await CollectionsRepository.findById(cid);
      if (!col) throw { status: 400, code: 'COLLECTION_NOT_FOUND', message: `Collection "${cid}" not found` };
    }

    await ProductsRepository.setCollections(productId, collectionIds);

    AuditService.log({
      adminUserId: actorAdminId,
      action: 'PRODUCT_COLLECTIONS_CHANGED',
      module: 'PRODUCTS',
      entityType: 'Product',
      entityId: productId,
      newValues: { collectionIds },
      ipAddress: meta.ipAddress,
      userAgent: meta.userAgent
    });

    return ProductsRepository.getCollections(productId);
  }

  static async addProductCollection(productId: string, collectionId: string, actorAdminId: string, meta: any = {}) {
    const product = await ProductsRepository.findById(productId);
    if (!product) throw { status: 404, code: 'NOT_FOUND', message: 'Product not found' };
    const col = await CollectionsRepository.findById(collectionId);
    if (!col) throw { status: 400, code: 'COLLECTION_NOT_FOUND', message: `Collection "${collectionId}" not found` };

    await ProductsRepository.addCollection(productId, collectionId);
    return ProductsRepository.getCollections(productId);
  }

  static async removeProductCollection(productId: string, collectionId: string, actorAdminId: string, meta: any = {}) {
    const product = await ProductsRepository.findById(productId);
    if (!product) throw { status: 404, code: 'NOT_FOUND', message: 'Product not found' };

    await ProductsRepository.removeCollection(productId, collectionId);
    return { success: true, message: 'Collection removed from product' };
  }

  static async getProductAttributes(productId: string) {
    const product = await ProductsRepository.findById(productId);
    if (!product) throw { status: 404, code: 'NOT_FOUND', message: 'Product not found' };
    return ProductsRepository.getAttributes(productId);
  }

  static async setProductAttributes(productId: string, attributes: ProductAttributeInput[], actorAdminId: string, meta: any = {}) {
    const product = await ProductsRepository.findById(productId);
    if (!product) throw { status: 404, code: 'NOT_FOUND', message: 'Product not found' };

    const validAttributes = await this.validateAndFormatAttributes(attributes);
    await ProductsRepository.setAttributes(productId, validAttributes);

    AuditService.log({
      adminUserId: actorAdminId,
      action: 'PRODUCT_ATTRIBUTES_CHANGED',
      module: 'PRODUCTS',
      entityType: 'Product',
      entityId: productId,
      newValues: { attributes: validAttributes },
      ipAddress: meta.ipAddress,
      userAgent: meta.userAgent
    });

    return ProductsRepository.getAttributes(productId);
  }

  // ==========================================
  // 3. PUBLIC STOREFRONT PRODUCT METHODS
  // ==========================================

  static async listPublicProducts(query: ProductFilterQuery) {
    const page = Math.max(1, Number(query.page) || 1);
    const limit = Math.min(100, Math.max(1, Number(query.limit) || 20));
    const skip = (page - 1) * limit;

    const where: any = { status: 'ACTIVE' };

    // Resolve Category filter by slug or ID
    if (query.category || query.categoryId) {
      const catParam = query.category || query.categoryId;
      let cat = await CategoriesRepository.findBySlug(catParam!);
      if (!cat) cat = await CategoriesRepository.findById(catParam!);
      if (cat) {
        where.categoryId = cat.id;
      } else {
        return { items: [], pagination: { page, limit, total: 0, totalPages: 0 } };
      }
    }

    // Resolve Collection filter by slug or ID
    if (query.collection || query.collectionId) {
      const colParam = query.collection || query.collectionId;
      let col = await CollectionsRepository.findBySlug(colParam!);
      if (!col) col = await CollectionsRepository.findById(colParam!);
      if (col) {
        where.collectionId = col.id;
      } else {
        return { items: [], pagination: { page, limit, total: 0, totalPages: 0 } };
      }
    }

    if (query.featured !== undefined) where.isFeatured = query.featured === 'true' || query.featured === true;
    if (query.newArrival !== undefined) where.isNewArrival = query.newArrival === 'true' || query.newArrival === true;
    if (query.bestseller !== undefined) where.isBestseller = query.bestseller === 'true' || query.bestseller === true;
    if (query.minPrice !== undefined) where.minPrice = Number(query.minPrice);
    if (query.maxPrice !== undefined) where.maxPrice = Number(query.maxPrice);
    if (query.search) where.search = query.search;

    // Dynamic Faceted Attribute Filtering
    const reservedKeys = [
      'page', 'limit', 'search', 'status', 'productType', 'categoryId', 'collectionId',
      'category', 'collection', 'featured', 'newArrival', 'bestseller', 'minPrice',
      'maxPrice', 'stockState', 'sort', 'order'
    ];

    const attributeFilters: { [attrSlug: string]: string } = {};
    for (const [key, val] of Object.entries(query)) {
      if (!reservedKeys.includes(key) && val !== undefined && val !== '') {
        attributeFilters[key] = String(val);
      }
    }
    if (Object.keys(attributeFilters).length > 0) {
      where.attributeFilters = attributeFilters;
    }

    const orderBy: any = {};
    if (query.sort) {
      const order = query.order?.toLowerCase() === 'desc' ? 'desc' : 'asc';
      orderBy[query.sort] = order;
    } else {
      orderBy.sortOrder = 'asc';
    }

    const { items, total } = await ProductsRepository.listProducts({
      where,
      orderBy,
      skip,
      take: limit
    });

    return {
      items: items.map(p => this.formatPublicProduct(p)),
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit)
      }
    };
  }

  static async getPublicProductBySlug(slug: string) {
    const product = await ProductsRepository.findBySlug(slug);
    if (!product || product.status !== 'ACTIVE') {
      throw { status: 404, code: 'NOT_FOUND', message: 'Product not found' };
    }
    return this.formatPublicProduct(product);
  }

  /**
   * Helper: Format Product for Storefront Client (sanitize costPrice, internal inventory)
   */
  private static formatPublicProduct(p: any) {
    const inStock = !p.trackInventory || p.stockQuantity > 0 || p.allowBackorder;

    const formatted: any = {
      id: p.id,
      name: p.name,
      slug: p.slug,
      sku: p.sku,
      shortDescription: p.shortDescription,
      description: p.description,
      productType: p.productType,
      price: p.price,
      compareAtPrice: p.compareAtPrice,
      currency: p.currency,
      availability: {
        inStock,
        allowBackorder: p.allowBackorder
      },
      isFeatured: p.isFeatured,
      isNewArrival: p.isNewArrival,
      isBestseller: p.isBestseller,
      sortOrder: p.sortOrder,
      category: p.category ? {
        id: p.category.id,
        name: p.category.name,
        slug: p.category.slug
      } : null,
      collections: (p.collections || []).map((c: any) => ({
        id: c.id,
        name: c.name,
        slug: c.slug
      })),
      attributes: (p.attributes || []).map((pav: any) => ({
        attributeId: pav.attributeId,
        attributeName: pav.attribute?.name,
        attributeSlug: pav.attribute?.slug,
        type: pav.attribute?.type,
        valueId: pav.attributeValueId,
        valueName: pav.attributeValue?.name || null,
        valueSlug: pav.attributeValue?.slug || null,
        textValue: pav.textValue,
        numberValue: pav.numberValue,
        booleanValue: pav.booleanValue
      })),
      media: (p.media || []).map((m: any) => {
        const asset = m.media || m;
        return {
          id: asset.id,
          url: asset.publicUrl || asset.url,
          altText: asset.altText || null,
          caption: asset.caption || null,
          width: asset.width || null,
          height: asset.height || null,
          sortOrder: m.sortOrder !== undefined ? m.sortOrder : 0,
          role: m.role || 'GALLERY',
          isPrimary: Boolean(m.isPrimary)
        };
      }),
      image: (p.media?.find((m: any) => m.isPrimary)?.media?.publicUrl ||
              p.media?.find((m: any) => m.isPrimary)?.media?.url ||
              p.media?.[0]?.media?.publicUrl ||
              p.media?.[0]?.media?.url ||
              p.media?.[0]?.publicUrl ||
              p.image || null),
      thumbnail: (p.media?.find((m: any) => m.role === 'THUMBNAIL')?.media?.publicUrl ||
                  p.media?.find((m: any) => m.role === 'THUMBNAIL')?.media?.url ||
                  p.thumbnail ||
                  p.media?.find((m: any) => m.isPrimary)?.media?.publicUrl ||
                  p.media?.[0]?.media?.publicUrl ||
                  p.image || null),
      bannerImage: (p.media?.find((m: any) => m.role === 'BANNER')?.media?.publicUrl ||
                    p.media?.find((m: any) => m.role === 'BANNER')?.media?.url ||
                    p.bannerImage || null),
      metaTitle: p.metaTitle || p.name,
      metaDescription: p.metaDescription,
      canonicalUrl: p.canonicalUrl,
      ogTitle: p.ogTitle || p.metaTitle || p.name,
      ogDescription: p.ogDescription || p.metaDescription,
      ogImage: (p.media?.find((m: any) => m.role === 'OG')?.media?.publicUrl ||
                p.media?.find((m: any) => m.role === 'OG')?.media?.url ||
                p.ogImage ||
                p.media?.find((m: any) => m.isPrimary)?.media?.publicUrl ||
                p.media?.[0]?.media?.publicUrl ||
                p.image || null)
    };

    if (p.productType === 'VARIABLE') {
      formatted.options = (p.options || []).map((o: any) => ({
        id: o.id,
        name: o.name,
        slug: o.slug,
        sortOrder: o.sortOrder,
        values: (o.values || []).map((v: any) => ({
          id: v.id,
          value: v.value,
          slug: v.slug,
          sortOrder: v.sortOrder
        }))
      }));

      formatted.variants = (p.variants || [])
        .filter((v: any) => v.status === 'ACTIVE')
        .map((v: any) => {
          const optionMap: Record<string, string> = {};
          (v.optionValues || []).forEach((ov: any) => {
            if (ov.optionValue && ov.optionValue.option) {
              optionMap[ov.optionValue.option.slug] = ov.optionValue.slug;
            }
          });
          const varInStock = !v.trackInventory || v.stockQuantity > 0 || v.allowBackorder;
          return {
            id: v.id,
            sku: v.sku,
            price: v.price !== null ? v.price : p.price,
            compareAtPrice: v.compareAtPrice !== null ? v.compareAtPrice : p.compareAtPrice,
            inStock: varInStock,
            allowBackorder: v.allowBackorder,
            media: (v.media || []).map((m: any) => {
              const asset = m.media || m;
              return {
                id: asset.id,
                url: asset.publicUrl || asset.url,
                altText: asset.altText || null,
                caption: asset.caption || null,
                width: asset.width || null,
                height: asset.height || null,
                sortOrder: m.sortOrder !== undefined ? m.sortOrder : 0,
                role: m.role || 'GALLERY',
                isPrimary: Boolean(m.isPrimary)
              };
            }),
            image: v.media?.find((m: any) => m.isPrimary)?.media?.publicUrl || v.image || p.image,
            options: optionMap
          };
        });
    }

    if (p.antiqueProfile) {
      formatted.antique = {
        era: p.antiqueProfile.era || null,
        period: p.antiqueProfile.period || null,
        approximateAgeFrom: p.antiqueProfile.approximateAgeFrom !== null && p.antiqueProfile.approximateAgeFrom !== undefined ? Number(p.antiqueProfile.approximateAgeFrom) : null,
        approximateAgeTo: p.antiqueProfile.approximateAgeTo !== null && p.antiqueProfile.approximateAgeTo !== undefined ? Number(p.antiqueProfile.approximateAgeTo) : null,
        ageDescription: p.antiqueProfile.ageDescription || null,
        origin: p.antiqueProfile.origin || null,
        region: p.antiqueProfile.region || null,
        countryOfOrigin: p.antiqueProfile.countryOfOrigin || null,
        artistMaker: p.antiqueProfile.artistMaker || null,
        attribution: p.antiqueProfile.attribution || null,
        schoolOrTradition: p.antiqueProfile.schoolOrTradition || null,
        material: p.antiqueProfile.material || null,
        technique: p.antiqueProfile.technique || null,
        condition: p.antiqueProfile.condition || null,
        conditionNotes: p.antiqueProfile.conditionNotes || null,
        restorationStatus: p.antiqueProfile.restorationStatus || 'UNKNOWN',
        restorationNotes: p.antiqueProfile.restorationNotes || null,
        provenance: p.antiqueProfile.provenance || null,
        provenanceNotes: p.antiqueProfile.provenanceNotes || null,
        authenticityStatus: p.antiqueProfile.authenticityStatus || 'UNKNOWN',
        authenticityNotes: p.antiqueProfile.authenticityNotes || null,
        dimensions: {
          height: p.antiqueProfile.height !== null && p.antiqueProfile.height !== undefined ? Number(p.antiqueProfile.height) : null,
          width: p.antiqueProfile.width !== null && p.antiqueProfile.width !== undefined ? Number(p.antiqueProfile.width) : null,
          depth: p.antiqueProfile.depth !== null && p.antiqueProfile.depth !== undefined ? Number(p.antiqueProfile.depth) : null,
          diameter: p.antiqueProfile.diameter !== null && p.antiqueProfile.diameter !== undefined ? Number(p.antiqueProfile.diameter) : null,
          unit: p.antiqueProfile.dimensionUnit || 'CM',
          description: p.antiqueProfile.dimensionsDescription || null
        },
        weight: {
          value: p.antiqueProfile.weight !== null && p.antiqueProfile.weight !== undefined ? Number(p.antiqueProfile.weight) : null,
          unit: p.antiqueProfile.weightUnit || 'KG'
        },
        isOneOfAKind: Boolean(p.antiqueProfile.isOneOfAKind),
        certification: {
          isCertified: Boolean(p.antiqueProfile.isCertified),
          certificateNumber: p.antiqueProfile.certificateNumber || null,
          certificateIssuer: p.antiqueProfile.certificateIssuer || null,
          certificateDate: p.antiqueProfile.certificateDate ? (p.antiqueProfile.certificateDate instanceof Date ? p.antiqueProfile.certificateDate.toISOString() : p.antiqueProfile.certificateDate) : null
        }
      };
    }

    return formatted;
  }
}

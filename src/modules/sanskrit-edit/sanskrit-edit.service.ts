import { prisma } from '../../database/prisma.ts';
import { AuditService } from '../../audit/audit.service.ts';
import { SanskritEditRepository } from './sanskrit-edit.repository.ts';
import type {
  CreateSanskritEditProfileInput,
  UpdateSanskritEditProfileInput,
  SanskritEditReorderItem,
  SanskritEditFilterQuery,
  PublicSanskritEditFilterQuery
} from './sanskrit-edit.types.ts';

export class SanskritEditService {
  /**
   * Format public Sanskrit Edit product (sanitizes private data)
   */
  static formatPublicSanskritProduct(p: any) {
    const sanskritEdit = p.sanskritEdit || p.sanskritEditProfile;

    return {
      id: p.id,
      name: p.name,
      slug: p.slug,
      sku: p.sku,
      shortDescription: p.shortDescription || null,
      description: p.description || null,
      price: Number(p.price),
      compareAtPrice: p.compareAtPrice !== null && p.compareAtPrice !== undefined ? Number(p.compareAtPrice) : null,
      status: p.status,
      productType: p.productType,
      isFeatured: Boolean(p.isFeatured),
      isNewArrival: Boolean(p.isNewArrival),
      isBestseller: Boolean(p.isBestseller),
      category: p.category ? {
        id: p.category.id,
        name: p.category.name,
        slug: p.category.slug
      } : null,
      collections: Array.isArray(p.collections) ? p.collections.map((pc: any) => {
        const c = pc.collection || pc;
        return {
          id: c.id,
          name: c.name,
          slug: c.slug
        };
      }) : [],
      attributes: Array.isArray(p.attributes) ? p.attributes.map((pa: any) => ({
        id: pa.id,
        attributeId: pa.attributeId,
        name: pa.attribute?.name,
        slug: pa.attribute?.slug,
        value: pa.attributeValue?.value || pa.textValue || pa.numberValue || pa.booleanValue
      })) : [],
      media: Array.isArray(p.media) ? p.media.map((pm: any) => {
        const m = pm.media || pm;
        return {
          id: m.id,
          url: m.url || m.cdnUrl || `/storage/${m.storageKey}`,
          altText: m.altText || null,
          role: pm.role || 'GALLERY',
          isPrimary: Boolean(pm.isPrimary)
        };
      }) : [],
      sanskritEdit: sanskritEdit ? {
        sanskritTitle: sanskritEdit.sanskritTitle || null,
        devanagariText: sanskritEdit.devanagariText || null,
        transliteration: sanskritEdit.transliteration || null,
        translation: sanskritEdit.translation || null,
        meaning: sanskritEdit.meaning || null,
        pronunciation: sanskritEdit.pronunciation || null,
        pronunciationGuide: sanskritEdit.pronunciationGuide || null,
        source: sanskritEdit.source || null,
        sourceReference: sanskritEdit.sourceReference || null,
        theme: sanskritEdit.theme || null,
        context: sanskritEdit.context || null,
        editorialContent: sanskritEdit.editorialContent || null,
        featuredExcerpt: sanskritEdit.featuredExcerpt || null,
        featuredExcerptTranslation: sanskritEdit.featuredExcerptTranslation || null,
        displayOrder: Number(sanskritEdit.displayOrder || 0),
        isFeatured: Boolean(sanskritEdit.isFeatured),
        isPublished: Boolean(sanskritEdit.isPublished)
      } : null
    };
  }

  /**
   * Create Sanskrit Edit Profile
   */
  static async createProfile(
    productId: string,
    input: CreateSanskritEditProfileInput,
    adminUserId?: string,
    meta?: any
  ) {
    const product = await prisma.product.findUnique({
      where: { id: productId }
    });

    if (!product) {
      throw { status: 404, code: 'PRODUCT_NOT_FOUND', message: `Product with ID "${productId}" not found` };
    }

    const existing = await SanskritEditRepository.findByProductId(productId);
    if (existing) {
      throw {
        status: 409,
        code: 'SANSKRIT_EDIT_ALREADY_EXISTS',
        message: `A Sanskrit Edit profile already exists for product "${product.name}"`
      };
    }

    const isFeatured = input.isFeatured !== undefined ? Boolean(input.isFeatured) : false;
    const isPublished = input.isPublished !== undefined ? Boolean(input.isPublished) : false;

    if (isFeatured && !isPublished) {
      throw {
        status: 400,
        code: 'SANSKRIT_EDIT_FEATURED_REQUIRES_PUBLISHED',
        message: 'A Sanskrit Edit profile must be published before it can be featured.'
      };
    }

    const profile = await SanskritEditRepository.create(productId, {
      ...input,
      isFeatured,
      isPublished
    });

    // Audit logs
    await AuditService.log({
      adminUserId,
      action: 'SANSKRIT_EDIT_CREATED',
      module: 'SANSKRIT_EDIT',
      entityType: 'SanskritEditProfile',
      entityId: profile.id,
      newValues: {
        productId,
        sanskritTitle: profile.sanskritTitle,
        theme: profile.theme,
        source: profile.source,
        isPublished: profile.isPublished,
        isFeatured: profile.isFeatured,
        displayOrder: profile.displayOrder
      },
      ipAddress: meta?.ipAddress,
      userAgent: meta?.userAgent
    });

    if (profile.isPublished) {
      await AuditService.log({
        adminUserId,
        action: 'SANSKRIT_EDIT_PUBLISHED',
        module: 'SANSKRIT_EDIT',
        entityType: 'SanskritEditProfile',
        entityId: profile.id,
        newValues: { productId, isPublished: true },
        ipAddress: meta?.ipAddress,
        userAgent: meta?.userAgent
      });
    }

    if (profile.isFeatured) {
      await AuditService.log({
        adminUserId,
        action: 'SANSKRIT_EDIT_FEATURED_CHANGED',
        module: 'SANSKRIT_EDIT',
        entityType: 'SanskritEditProfile',
        entityId: profile.id,
        newValues: { productId, isFeatured: true },
        ipAddress: meta?.ipAddress,
        userAgent: meta?.userAgent
      });
    }

    return profile;
  }

  /**
   * Get Sanskrit Edit Profile (Admin view includes editorial notes)
   */
  static async getProfile(productId: string) {
    const product = await prisma.product.findUnique({
      where: { id: productId }
    });

    if (!product) {
      throw { status: 404, code: 'PRODUCT_NOT_FOUND', message: `Product with ID "${productId}" not found` };
    }

    const profile = await SanskritEditRepository.findByProductId(productId);
    if (!profile) {
      throw { status: 404, code: 'SANSKRIT_EDIT_NOT_FOUND', message: 'Sanskrit Edit profile not found for this product' };
    }

    return profile;
  }

  /**
   * Update Sanskrit Edit Profile
   */
  static async updateProfile(
    productId: string,
    input: UpdateSanskritEditProfileInput,
    adminUserId?: string,
    meta?: any
  ) {
    const product = await prisma.product.findUnique({
      where: { id: productId }
    });

    if (!product) {
      throw { status: 404, code: 'PRODUCT_NOT_FOUND', message: `Product with ID "${productId}" not found` };
    }

    const profile = await SanskritEditRepository.findByProductId(productId);
    if (!profile) {
      throw { status: 404, code: 'SANSKRIT_EDIT_NOT_FOUND', message: 'Sanskrit Edit profile not found for this product' };
    }

    const effectivePublished = input.isPublished !== undefined ? Boolean(input.isPublished) : profile.isPublished;
    const effectiveFeatured = input.isFeatured !== undefined ? Boolean(input.isFeatured) : profile.isFeatured;

    if (effectiveFeatured && !effectivePublished) {
      throw {
        status: 400,
        code: 'SANSKRIT_EDIT_FEATURED_REQUIRES_PUBLISHED',
        message: 'A Sanskrit Edit profile must be published before it can be featured.'
      };
    }

    const updated = await SanskritEditRepository.updateByProductId(productId, input);

    // Audit logs
    await AuditService.log({
      adminUserId,
      action: 'SANSKRIT_EDIT_UPDATED',
      module: 'SANSKRIT_EDIT',
      entityType: 'SanskritEditProfile',
      entityId: profile.id,
      oldValues: profile,
      newValues: input,
      ipAddress: meta?.ipAddress,
      userAgent: meta?.userAgent
    });

    if (input.isPublished !== undefined && Boolean(input.isPublished) !== profile.isPublished) {
      await AuditService.log({
        adminUserId,
        action: input.isPublished ? 'SANSKRIT_EDIT_PUBLISHED' : 'SANSKRIT_EDIT_UNPUBLISHED',
        module: 'SANSKRIT_EDIT',
        entityType: 'SanskritEditProfile',
        entityId: profile.id,
        oldValues: { isPublished: profile.isPublished },
        newValues: { isPublished: Boolean(input.isPublished) },
        ipAddress: meta?.ipAddress,
        userAgent: meta?.userAgent
      });
    }

    if (input.isFeatured !== undefined && Boolean(input.isFeatured) !== profile.isFeatured) {
      await AuditService.log({
        adminUserId,
        action: 'SANSKRIT_EDIT_FEATURED_CHANGED',
        module: 'SANSKRIT_EDIT',
        entityType: 'SanskritEditProfile',
        entityId: profile.id,
        oldValues: { isFeatured: profile.isFeatured },
        newValues: { isFeatured: Boolean(input.isFeatured) },
        ipAddress: meta?.ipAddress,
        userAgent: meta?.userAgent
      });
    }

    return updated;
  }

  /**
   * Delete Sanskrit Edit Profile (Preserves base product)
   */
  static async deleteProfile(productId: string, adminUserId?: string, meta?: any) {
    const product = await prisma.product.findUnique({
      where: { id: productId }
    });

    if (!product) {
      throw { status: 404, code: 'PRODUCT_NOT_FOUND', message: `Product with ID "${productId}" not found` };
    }

    const profile = await SanskritEditRepository.findByProductId(productId);
    if (!profile) {
      throw { status: 404, code: 'SANSKRIT_EDIT_NOT_FOUND', message: 'Sanskrit Edit profile not found for this product' };
    }

    const deleted = await SanskritEditRepository.deleteByProductId(productId);

    await AuditService.log({
      adminUserId,
      action: 'SANSKRIT_EDIT_DELETED',
      module: 'SANSKRIT_EDIT',
      entityType: 'SanskritEditProfile',
      entityId: profile.id,
      oldValues: { productId },
      ipAddress: meta?.ipAddress,
      userAgent: meta?.userAgent
    });

    return deleted;
  }

  /**
   * Reorder Profiles
   */
  static async reorderProfiles(items: SanskritEditReorderItem[], adminUserId?: string, meta?: any) {
    await SanskritEditRepository.bulkReorder(items);

    await AuditService.log({
      adminUserId,
      action: 'SANSKRIT_EDIT_REORDERED',
      module: 'SANSKRIT_EDIT',
      entityType: 'SanskritEditProfile',
      entityId: 'BULK',
      newValues: { count: items.length, items },
      ipAddress: meta?.ipAddress,
      userAgent: meta?.userAgent
    });
  }

  /**
   * Admin Listing
   */
  static async listAdminProfiles(query: SanskritEditFilterQuery) {
    return SanskritEditRepository.findAdminProfiles(query);
  }

  /**
   * Public Storefront Listing
   */
  static async listPublicProfiles(query: PublicSanskritEditFilterQuery) {
    const res = await SanskritEditRepository.findPublicProfiles(query);
    return {
      ...res,
      items: res.items.map(this.formatPublicSanskritProduct)
    };
  }
}

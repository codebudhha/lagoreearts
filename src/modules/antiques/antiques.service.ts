import { prisma } from '../../database/prisma.ts';
import { AntiquesRepository } from './antiques.repository.ts';
import { AuditService } from '../../audit/audit.service.ts';
import type {
  CreateAntiqueProfileInput,
  UpdateAntiqueProfileInput,
  AntiqueFilterQuery,
  PublicAntiqueFilterQuery
} from './antiques.types.ts';

export class AntiquesService {
  /**
   * Helper: Format Antique Profile for Storefront (sanitize private acquisition data)
   */
  static formatPublicAntique(ap: any) {
    if (!ap) return null;
    return {
      era: ap.era || null,
      period: ap.period || null,
      approximateAgeFrom: ap.approximateAgeFrom !== null && ap.approximateAgeFrom !== undefined ? Number(ap.approximateAgeFrom) : null,
      approximateAgeTo: ap.approximateAgeTo !== null && ap.approximateAgeTo !== undefined ? Number(ap.approximateAgeTo) : null,
      ageDescription: ap.ageDescription || null,
      origin: ap.origin || null,
      region: ap.region || null,
      countryOfOrigin: ap.countryOfOrigin || null,
      artistMaker: ap.artistMaker || null,
      attribution: ap.attribution || null,
      schoolOrTradition: ap.schoolOrTradition || null,
      material: ap.material || null,
      technique: ap.technique || null,
      condition: ap.condition || null,
      conditionNotes: ap.conditionNotes || null,
      restorationStatus: ap.restorationStatus || 'UNKNOWN',
      restorationNotes: ap.restorationNotes || null,
      provenance: ap.provenance || null,
      provenanceNotes: ap.provenanceNotes || null,
      authenticityStatus: ap.authenticityStatus || 'UNKNOWN',
      authenticityNotes: ap.authenticityNotes || null,
      dimensions: {
        height: ap.height !== null && ap.height !== undefined ? Number(ap.height) : null,
        width: ap.width !== null && ap.width !== undefined ? Number(ap.width) : null,
        depth: ap.depth !== null && ap.depth !== undefined ? Number(ap.depth) : null,
        diameter: ap.diameter !== null && ap.diameter !== undefined ? Number(ap.diameter) : null,
        unit: ap.dimensionUnit || 'CM',
        description: ap.dimensionsDescription || null
      },
      weight: {
        value: ap.weight !== null && ap.weight !== undefined ? Number(ap.weight) : null,
        unit: ap.weightUnit || 'KG'
      },
      isOneOfAKind: Boolean(ap.isOneOfAKind),
      certification: {
        isCertified: Boolean(ap.isCertified),
        certificateNumber: ap.certificateNumber || null,
        certificateIssuer: ap.certificateIssuer || null,
        certificateDate: ap.certificateDate ? (ap.certificateDate instanceof Date ? ap.certificateDate.toISOString() : ap.certificateDate) : null
      }
    };
  }

  /**
   * Helper: Format Product for Storefront
   */
  static formatPublicAntiqueProduct(p: any) {
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

    if (p.antiqueProfile) {
      formatted.antique = this.formatPublicAntique(p.antiqueProfile);
    }

    return formatted;
  }

  /**
   * Create an Antique Profile for an existing Product
   */
  static async createProfile(productId: string, input: CreateAntiqueProfileInput, adminUserId?: string, meta?: any) {
    const product = await prisma.product.findUnique({
      where: { id: productId }
    });

    if (!product) {
      throw { status: 404, code: 'PRODUCT_NOT_FOUND', message: `Product with ID "${productId}" not found` };
    }

    const existing = await AntiquesRepository.findByProductId(productId);
    if (existing) {
      throw { status: 409, code: 'ANTIQUE_PROFILE_EXISTS', message: 'An antique profile already exists for this product' };
    }

    // Validate One-of-a-Kind rules
    const isOneOfAKind = input.isOneOfAKind !== undefined ? Boolean(input.isOneOfAKind) : true;
    if (isOneOfAKind) {
      if (product.stockQuantity > 1) {
        throw {
          status: 400,
          code: 'ONE_OF_A_KIND_STOCK_LIMIT',
          message: `One-of-a-kind antique cannot have stock quantity greater than 1. Current stock is ${product.stockQuantity}. Please update product stock first.`
        };
      }
      if (product.allowBackorder) {
        throw {
          status: 400,
          code: 'ONE_OF_A_KIND_BACKORDER_NOT_ALLOWED',
          message: 'One-of-a-kind antique cannot allow backorders. Please disable backorders on product first.'
        };
      }
    }

    // Validate age range
    if (
      input.approximateAgeFrom !== undefined &&
      input.approximateAgeTo !== undefined &&
      input.approximateAgeFrom !== null &&
      input.approximateAgeTo !== null
    ) {
      if (Number(input.approximateAgeFrom) > Number(input.approximateAgeTo)) {
        throw {
          status: 400,
          code: 'INVALID_AGE_RANGE',
          message: 'Approximate age from cannot exceed approximate age to'
        };
      }
    }

    const profile = await AntiquesRepository.create(productId, {
      ...input,
      isOneOfAKind
    });

    // Audit log
    await AuditService.log({
      adminUserId,
      action: 'ANTIQUE_PROFILE_CREATED',
      module: 'ANTIQUES',
      entityType: 'AntiqueProfile',
      entityId: profile.id,
      newValues: {
        productId,
        era: profile.era,
        origin: profile.origin,
        condition: profile.condition,
        authenticityStatus: profile.authenticityStatus,
        isOneOfAKind: profile.isOneOfAKind
      },
      ipAddress: meta?.ipAddress,
      userAgent: meta?.userAgent
    });

    return profile;
  }

  /**
   * Get Antique Profile for a Product
   */
  static async getProfile(productId: string) {
    const product = await prisma.product.findUnique({
      where: { id: productId }
    });

    if (!product) {
      throw { status: 404, code: 'PRODUCT_NOT_FOUND', message: `Product with ID "${productId}" not found` };
    }

    const profile = await AntiquesRepository.findByProductId(productId, { product: true });
    if (!profile) {
      throw { status: 404, code: 'ANTIQUE_PROFILE_NOT_FOUND', message: 'Antique profile not found for this product' };
    }

    return profile;
  }

  /**
   * Update Antique Profile
   */
  static async updateProfile(productId: string, input: UpdateAntiqueProfileInput, adminUserId?: string, meta?: any) {
    const product = await prisma.product.findUnique({
      where: { id: productId }
    });

    if (!product) {
      throw { status: 404, code: 'PRODUCT_NOT_FOUND', message: `Product with ID "${productId}" not found` };
    }

    const profile = await AntiquesRepository.findByProductId(productId);
    if (!profile) {
      throw { status: 404, code: 'ANTIQUE_PROFILE_NOT_FOUND', message: 'Antique profile not found for this product' };
    }

    // Validate One-of-a-Kind rules if updated or active
    const targetOneOfAKind = input.isOneOfAKind !== undefined ? Boolean(input.isOneOfAKind) : profile.isOneOfAKind;
    if (targetOneOfAKind) {
      if (product.stockQuantity > 1) {
        throw {
          status: 400,
          code: 'ONE_OF_A_KIND_STOCK_LIMIT',
          message: `One-of-a-kind antique cannot have stock quantity greater than 1. Current stock is ${product.stockQuantity}. Please update product stock first.`
        };
      }
      if (product.allowBackorder) {
        throw {
          status: 400,
          code: 'ONE_OF_A_KIND_BACKORDER_NOT_ALLOWED',
          message: 'One-of-a-kind antique cannot allow backorders. Please disable backorders on product first.'
        };
      }
    }

    // Validate age range
    const fromVal = input.approximateAgeFrom !== undefined ? input.approximateAgeFrom : profile.approximateAgeFrom;
    const toVal = input.approximateAgeTo !== undefined ? input.approximateAgeTo : profile.approximateAgeTo;
    if (fromVal !== null && toVal !== null && fromVal !== undefined && toVal !== undefined) {
      if (Number(fromVal) > Number(toVal)) {
        throw {
          status: 400,
          code: 'INVALID_AGE_RANGE',
          message: 'Approximate age from cannot exceed approximate age to'
        };
      }
    }

    const updated = await AntiquesRepository.updateByProductId(productId, input);

    // Audit logs
    await AuditService.log({
      adminUserId,
      action: 'ANTIQUE_PROFILE_UPDATED',
      module: 'ANTIQUES',
      entityType: 'AntiqueProfile',
      entityId: profile.id,
      oldValues: profile,
      newValues: input,
      ipAddress: meta?.ipAddress,
      userAgent: meta?.userAgent
    });

    if (input.authenticityStatus && input.authenticityStatus !== profile.authenticityStatus) {
      await AuditService.log({
        adminUserId,
        action: 'ANTIQUE_AUTHENTICITY_CHANGED',
        module: 'ANTIQUES',
        entityType: 'AntiqueProfile',
        entityId: profile.id,
        oldValues: { authenticityStatus: profile.authenticityStatus },
        newValues: { authenticityStatus: input.authenticityStatus },
        ipAddress: meta?.ipAddress,
        userAgent: meta?.userAgent
      });
    }

    if (input.isOneOfAKind !== undefined && Boolean(input.isOneOfAKind) !== profile.isOneOfAKind) {
      await AuditService.log({
        adminUserId,
        action: 'ANTIQUE_ONE_OF_A_KIND_CHANGED',
        module: 'ANTIQUES',
        entityType: 'AntiqueProfile',
        entityId: profile.id,
        oldValues: { isOneOfAKind: profile.isOneOfAKind },
        newValues: { isOneOfAKind: Boolean(input.isOneOfAKind) },
        ipAddress: meta?.ipAddress,
        userAgent: meta?.userAgent
      });
    }

    return updated;
  }

  /**
   * Delete Antique Profile (Product is preserved)
   */
  static async deleteProfile(productId: string, adminUserId?: string, meta?: any) {
    const product = await prisma.product.findUnique({
      where: { id: productId }
    });

    if (!product) {
      throw { status: 404, code: 'PRODUCT_NOT_FOUND', message: `Product with ID "${productId}" not found` };
    }

    const profile = await AntiquesRepository.findByProductId(productId);
    if (!profile) {
      throw { status: 404, code: 'ANTIQUE_PROFILE_NOT_FOUND', message: 'Antique profile not found for this product' };
    }

    const deleted = await AntiquesRepository.deleteByProductId(productId);

    await AuditService.log({
      adminUserId,
      action: 'ANTIQUE_PROFILE_DELETED',
      module: 'ANTIQUES',
      entityType: 'AntiqueProfile',
      entityId: profile.id,
      oldValues: { productId },
      ipAddress: meta?.ipAddress,
      userAgent: meta?.userAgent
    });

    return {
      success: true,
      message: 'Antique profile deleted successfully',
      deletedProfile: deleted
    };
  }

  /**
   * Admin Antiques Listing
   */
  static async listAdminAntiques(query: AntiqueFilterQuery) {
    return AntiquesRepository.findMany(query);
  }

  /**
   * Public Antiques Listing (Storefront)
   */
  static async listPublicAntiques(query: PublicAntiqueFilterQuery) {
    const result = await AntiquesRepository.findMany({
      ...query,
      status: 'ACTIVE'
    });

    return {
      items: result.items.map(p => this.formatPublicAntiqueProduct(p)),
      pagination: {
        page: result.page,
        limit: result.limit,
        total: result.total,
        totalPages: result.totalPages
      }
    };
  }
}

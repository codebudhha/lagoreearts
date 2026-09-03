import { prisma } from '../../database/prisma.ts';
import { AuditService } from '../../audit/audit.service.ts';
import { ArtistsRepository } from './artists.repository.ts';
import { ProductsService } from '../products/products.service.ts';
import type {
  Artist,
  CreateArtistInput,
  UpdateArtistInput,
  ArtistFilterQuery,
  PublicArtistFilterQuery,
  ProductArtist,
  AttachProductArtistInput,
  UpdateProductArtistInput,
  ProductArtistReorderItem,
  ArtistReorderItem,
  ArtistMedia,
  AttachArtistMediaInput,
  ArtistMediaReorderItem,
  ArtistStatus,
  ArtistRole,
  ArtistMediaRole
} from './artists.types.ts';

function slugify(text: string): string {
  return text
    .toString()
    .toLowerCase()
    .trim()
    .replace(/\s+/g, '-')
    .replace(/[^\w\-]+/g, '')
    .replace(/\-\-+/g, '-')
    .replace(/^-+/, '')
    .replace(/-+$/, '');
}

export class ArtistsService {
  // ==========================================
  // Artist CRUD
  // ==========================================

  static async generateUniqueSlug(baseName: string, currentId?: string): Promise<string> {
    const baseSlug = slugify(baseName) || 'artist';
    let slug = baseSlug;
    let counter = 1;

    while (true) {
      const existing = await prisma.artist.findUnique({ where: { slug } });
      if (!existing || (currentId && existing.id === currentId)) {
        return slug;
      }
      counter++;
      slug = `${baseSlug}-${counter}`;
    }
  }

  static async createArtist(input: CreateArtistInput, adminUserId?: string, meta?: { ipAddress?: string; userAgent?: string }): Promise<Artist> {
    let slug: string;
    if (input.slug && input.slug.trim()) {
      slug = slugify(input.slug);
      const existing = await prisma.artist.findUnique({ where: { slug } });
      if (existing) {
        const err: any = new Error(`Slug "${slug}" is already in use by another artist.`);
        err.status = 400;
        err.code = 'ARTIST_DUPLICATE_SLUG';
        throw err;
      }
    } else {
      slug = await this.generateUniqueSlug(input.name);
    }

    const artist = await ArtistsRepository.create({
      ...input,
      slug
    }, { media: { include: { media: true } } });

    if (adminUserId) {
      await AuditService.log({
        adminUserId,
        action: 'ARTIST_CREATED',
        module: 'ARTISTS',
        entityType: 'Artist',
        entityId: artist.id,
        newValues: { id: artist.id, name: artist.name, slug: artist.slug, status: artist.status },
        ipAddress: meta?.ipAddress,
        userAgent: meta?.userAgent
      });
    }

    return artist;
  }

  static async getArtistById(id: string): Promise<Artist> {
    const artist = await ArtistsRepository.findById(id, {
      media: { include: { media: true } },
      products: { include: { product: true } }
    });
    if (!artist) {
      const err: any = new Error(`Artist with ID "${id}" not found`);
      err.status = 404;
      err.code = 'ARTIST_NOT_FOUND';
      throw err;
    }
    return artist;
  }

  static async updateArtist(id: string, input: UpdateArtistInput, adminUserId?: string, meta?: { ipAddress?: string; userAgent?: string }): Promise<Artist> {
    const existing = await this.getArtistById(id);

    let slug = existing.slug;
    if (input.slug !== undefined && input.slug !== null) {
      const newSlug = slugify(input.slug);
      if (newSlug !== existing.slug) {
        const slugExists = await prisma.artist.findUnique({ where: { slug: newSlug } });
        if (slugExists && slugExists.id !== id) {
          const err: any = new Error(`Slug "${newSlug}" is already in use by another artist.`);
          err.status = 400;
          err.code = 'ARTIST_DUPLICATE_SLUG';
          throw err;
        }
        slug = newSlug;
      }
    }

    // Validate birthYear vs deathYear
    const effectiveBirth = input.birthYear !== undefined ? input.birthYear : existing.birthYear;
    const effectiveDeath = input.deathYear !== undefined ? input.deathYear : existing.deathYear;
    if (effectiveBirth !== null && effectiveDeath !== null && effectiveBirth !== undefined && effectiveDeath !== undefined) {
      if (Number(effectiveDeath) < Number(effectiveBirth)) {
        const err: any = new Error('Death year cannot be earlier than birth year');
        err.status = 400;
        err.code = 'ARTIST_INVALID_DATE_RANGE';
        throw err;
      }
    }

    const updated = await ArtistsRepository.update(id, {
      ...input,
      slug
    }, { media: { include: { media: true } } });

    if (adminUserId) {
      await AuditService.log({
        adminUserId,
        action: 'ARTIST_UPDATED',
        module: 'ARTISTS',
        entityType: 'Artist',
        entityId: id,
        oldValues: { name: existing.name, status: existing.status, isFeatured: existing.isFeatured },
        newValues: { name: updated.name, status: updated.status, isFeatured: updated.isFeatured },
        ipAddress: meta?.ipAddress,
        userAgent: meta?.userAgent
      });
    }

    return updated;
  }

  static async deleteArtist(id: string, adminUserId?: string, meta?: { ipAddress?: string; userAgent?: string }): Promise<Artist> {
    const existing = await this.getArtistById(id);

    const productCount = await ArtistsRepository.countProductsByArtist(id);
    if (productCount > 0) {
      const err: any = new Error(`This artist cannot be deleted because they are associated with ${productCount} product(s). Please detach the artist from all products first.`);
      err.status = 409;
      err.code = 'ARTIST_IN_USE';
      throw err;
    }

    const deleted = await ArtistsRepository.delete(id);

    if (adminUserId) {
      await AuditService.log({
        adminUserId,
        action: 'ARTIST_DELETED',
        module: 'ARTISTS',
        entityType: 'Artist',
        entityId: id,
        oldValues: { id: existing.id, name: existing.name, slug: existing.slug },
        ipAddress: meta?.ipAddress,
        userAgent: meta?.userAgent
      });
    }

    return deleted;
  }

  static async updateArtistStatus(id: string, status: ArtistStatus, adminUserId?: string, meta?: { ipAddress?: string; userAgent?: string }): Promise<Artist> {
    const existing = await this.getArtistById(id);
    const updated = await ArtistsRepository.update(id, { status });

    if (adminUserId) {
      await AuditService.log({
        adminUserId,
        action: 'ARTIST_STATUS_CHANGED',
        module: 'ARTISTS',
        entityType: 'Artist',
        entityId: id,
        oldValues: { status: existing.status },
        newValues: { status: updated.status },
        ipAddress: meta?.ipAddress,
        userAgent: meta?.userAgent
      });
    }

    return updated;
  }

  static async updateArtistFeatured(id: string, isFeatured: boolean, adminUserId?: string, meta?: { ipAddress?: string; userAgent?: string }): Promise<Artist> {
    const existing = await this.getArtistById(id);
    const updated = await ArtistsRepository.update(id, { isFeatured });

    if (adminUserId) {
      await AuditService.log({
        adminUserId,
        action: 'ARTIST_FEATURED_CHANGED',
        module: 'ARTISTS',
        entityType: 'Artist',
        entityId: id,
        oldValues: { isFeatured: existing.isFeatured },
        newValues: { isFeatured: updated.isFeatured },
        ipAddress: meta?.ipAddress,
        userAgent: meta?.userAgent
      });
    }

    return updated;
  }

  static async reorderArtists(items: ArtistReorderItem[], adminUserId?: string, meta?: { ipAddress?: string; userAgent?: string }): Promise<void> {
    await ArtistsRepository.bulkReorder(items);

    if (adminUserId) {
      await AuditService.log({
        adminUserId,
        action: 'ARTIST_REORDERED',
        module: 'ARTISTS',
        entityType: 'Artist',
        newValues: { count: items.length },
        ipAddress: meta?.ipAddress,
        userAgent: meta?.userAgent
      });
    }
  }

  static async listAdminArtists(query: ArtistFilterQuery) {
    return ArtistsRepository.listAdmin(query);
  }

  // ==========================================
  // ProductArtist Relationship Management
  // ==========================================

  static async listProductArtists(productId: string): Promise<ProductArtist[]> {
    const product = await prisma.product.findUnique({ where: { id: productId } });
    if (!product) {
      const err: any = new Error(`Product with ID "${productId}" not found`);
      err.status = 404;
      err.code = 'PRODUCT_NOT_FOUND';
      throw err;
    }
    return ArtistsRepository.listProductArtists(productId);
  }

  static async attachProductArtist(
    productId: string,
    input: AttachProductArtistInput,
    adminUserId?: string,
    meta?: { ipAddress?: string; userAgent?: string }
  ): Promise<ProductArtist> {
    const product = await prisma.product.findUnique({ where: { id: productId } });
    if (!product) {
      const err: any = new Error(`Product with ID "${productId}" not found`);
      err.status = 404;
      err.code = 'PRODUCT_NOT_FOUND';
      throw err;
    }

    const artist = await prisma.artist.findUnique({ where: { id: input.artistId } });
    if (!artist) {
      const err: any = new Error(`Artist with ID "${input.artistId}" not found`);
      err.status = 404;
      err.code = 'ARTIST_NOT_FOUND';
      throw err;
    }

    const role = input.role || 'ARTIST';
    const existingRelation = await ArtistsRepository.findProductArtist(productId, input.artistId, role);
    if (existingRelation) {
      const err: any = new Error(`Artist "${artist.name}" is already associated with this product in role "${role}".`);
      err.status = 409;
      err.code = 'PRODUCT_ARTIST_DUPLICATE';
      throw err;
    }

    // Single primary artist enforcement: if isPrimary is true, unset other primaries on this product
    if (input.isPrimary) {
      await ArtistsRepository.unsetOtherPrimaryArtists(productId, input.artistId, role);
    }

    const attached = await ArtistsRepository.attachProductArtist(productId, {
      ...input,
      role
    }, { artist: { include: { media: true } } });

    if (adminUserId) {
      await AuditService.log({
        adminUserId,
        action: 'PRODUCT_ARTIST_ATTACHED',
        module: 'ARTISTS',
        entityType: 'ProductArtist',
        entityId: `${productId}:${input.artistId}:${role}`,
        newValues: { productId, artistId: input.artistId, role, isPrimary: attached.isPrimary },
        ipAddress: meta?.ipAddress,
        userAgent: meta?.userAgent
      });

      if (attached.isPrimary) {
        await AuditService.log({
          adminUserId,
          action: 'PRODUCT_ARTIST_PRIMARY_CHANGED',
          module: 'ARTISTS',
          entityType: 'ProductArtist',
          entityId: `${productId}:${input.artistId}:${role}`,
          newValues: { productId, artistId: input.artistId, isPrimary: true },
          ipAddress: meta?.ipAddress,
          userAgent: meta?.userAgent
        });
      }
    }

    return attached;
  }

  static async updateProductArtist(
    productId: string,
    artistId: string,
    currentRole: string,
    input: UpdateProductArtistInput,
    adminUserId?: string,
    meta?: { ipAddress?: string; userAgent?: string }
  ): Promise<ProductArtist> {
    const existing = await ArtistsRepository.findProductArtist(productId, artistId, currentRole);
    if (!existing) {
      const err: any = new Error(`Product artist relationship not found for artist ID "${artistId}" in role "${currentRole}"`);
      err.status = 404;
      err.code = 'PRODUCT_ARTIST_NOT_FOUND';
      throw err;
    }

    // Check collision if changing role
    if (input.role && input.role !== currentRole) {
      const collision = await ArtistsRepository.findProductArtist(productId, artistId, input.role);
      if (collision) {
        const err: any = new Error(`Artist is already associated with this product in role "${input.role}".`);
        err.status = 409;
        err.code = 'PRODUCT_ARTIST_DUPLICATE';
        throw err;
      }
    }

    if (input.isPrimary) {
      await ArtistsRepository.unsetOtherPrimaryArtists(productId, artistId, input.role || currentRole);
    }

    const updated = await ArtistsRepository.updateProductArtist(productId, artistId, currentRole, input, {
      artist: { include: { media: true } }
    });

    if (adminUserId) {
      await AuditService.log({
        adminUserId,
        action: 'PRODUCT_ARTIST_UPDATED',
        module: 'ARTISTS',
        entityType: 'ProductArtist',
        entityId: `${productId}:${artistId}:${input.role || currentRole}`,
        oldValues: { role: existing.role, isPrimary: existing.isPrimary },
        newValues: { role: updated.role, isPrimary: updated.isPrimary },
        ipAddress: meta?.ipAddress,
        userAgent: meta?.userAgent
      });

      if (input.isPrimary !== undefined && input.isPrimary !== existing.isPrimary) {
        await AuditService.log({
          adminUserId,
          action: 'PRODUCT_ARTIST_PRIMARY_CHANGED',
          module: 'ARTISTS',
          entityType: 'ProductArtist',
          entityId: `${productId}:${artistId}:${input.role || currentRole}`,
          newValues: { productId, artistId, isPrimary: updated.isPrimary },
          ipAddress: meta?.ipAddress,
          userAgent: meta?.userAgent
        });
      }
    }

    return updated;
  }

  static async detachProductArtist(
    productId: string,
    artistId: string,
    role: string,
    adminUserId?: string,
    meta?: { ipAddress?: string; userAgent?: string }
  ): Promise<ProductArtist | null> {
    const existing = await ArtistsRepository.findProductArtist(productId, artistId, role);
    if (!existing) {
      const err: any = new Error(`Product artist relationship not found for artist ID "${artistId}" in role "${role}"`);
      err.status = 404;
      err.code = 'PRODUCT_ARTIST_NOT_FOUND';
      throw err;
    }

    const detached = await ArtistsRepository.detachProductArtist(productId, artistId, role);

    if (adminUserId) {
      await AuditService.log({
        adminUserId,
        action: 'PRODUCT_ARTIST_DETACHED',
        module: 'ARTISTS',
        entityType: 'ProductArtist',
        entityId: `${productId}:${artistId}:${role}`,
        oldValues: { productId, artistId, role },
        ipAddress: meta?.ipAddress,
        userAgent: meta?.userAgent
      });
    }

    return detached;
  }

  static async reorderProductArtists(
    productId: string,
    items: ProductArtistReorderItem[],
    adminUserId?: string,
    meta?: { ipAddress?: string; userAgent?: string }
  ): Promise<void> {
    await ArtistsRepository.bulkReorderProductArtists(productId, items);

    if (adminUserId) {
      await AuditService.log({
        adminUserId,
        action: 'PRODUCT_ARTIST_REORDERED',
        module: 'ARTISTS',
        entityType: 'ProductArtist',
        entityId: productId,
        newValues: { count: items.length },
        ipAddress: meta?.ipAddress,
        userAgent: meta?.userAgent
      });
    }
  }

  // ==========================================
  // ArtistMedia Management
  // ==========================================

  static async listArtistMedia(artistId: string): Promise<ArtistMedia[]> {
    await this.getArtistById(artistId);
    return ArtistsRepository.listArtistMedia(artistId);
  }

  static async attachArtistMedia(
    artistId: string,
    input: AttachArtistMediaInput,
    adminUserId?: string,
    meta?: { ipAddress?: string; userAgent?: string }
  ): Promise<ArtistMedia> {
    await this.getArtistById(artistId);

    const media = await prisma.mediaAsset.findUnique({ where: { id: input.mediaId } });
    if (!media) {
      const err: any = new Error(`Media asset with ID "${input.mediaId}" not found`);
      err.status = 404;
      err.code = 'MEDIA_NOT_FOUND';
      throw err;
    }

    const role = input.role || 'PROFILE';
    const existing = await ArtistsRepository.findArtistMedia(artistId, input.mediaId, role);
    if (existing) {
      const err: any = new Error(`Media asset is already attached to this artist in role "${role}"`);
      err.status = 409;
      err.code = 'ARTIST_MEDIA_DUPLICATE';
      throw err;
    }

    if (input.isPrimary) {
      await ArtistsRepository.unsetOtherPrimaryMedia(artistId, input.mediaId, role);
    }

    const attached = await ArtistsRepository.attachArtistMedia(artistId, {
      ...input,
      role
    }, { media: true });

    if (adminUserId) {
      await AuditService.log({
        adminUserId,
        action: 'ARTIST_MEDIA_ATTACHED',
        module: 'ARTISTS',
        entityType: 'ArtistMedia',
        entityId: `${artistId}:${input.mediaId}:${role}`,
        newValues: { artistId, mediaId: input.mediaId, role, isPrimary: attached.isPrimary },
        ipAddress: meta?.ipAddress,
        userAgent: meta?.userAgent
      });

      if (attached.isPrimary) {
        await AuditService.log({
          adminUserId,
          action: 'ARTIST_MEDIA_PRIMARY_CHANGED',
          module: 'ARTISTS',
          entityType: 'ArtistMedia',
          entityId: `${artistId}:${input.mediaId}:${role}`,
          newValues: { artistId, mediaId: input.mediaId, isPrimary: true },
          ipAddress: meta?.ipAddress,
          userAgent: meta?.userAgent
        });
      }
    }

    return attached;
  }

  static async setPrimaryMedia(
    artistId: string,
    mediaId: string,
    role: string = 'PROFILE',
    adminUserId?: string,
    meta?: { ipAddress?: string; userAgent?: string }
  ): Promise<ArtistMedia> {
    const existing = await ArtistsRepository.findArtistMedia(artistId, mediaId, role);
    if (!existing) {
      const err: any = new Error(`Media attachment not found for artist ID "${artistId}" and media ID "${mediaId}"`);
      err.status = 404;
      err.code = 'ARTIST_MEDIA_NOT_FOUND';
      throw err;
    }

    await ArtistsRepository.unsetOtherPrimaryMedia(artistId, mediaId, role);
    const updated = await ArtistsRepository.updateArtistMedia(artistId, mediaId, role, { isPrimary: true }, { media: true });

    if (adminUserId) {
      await AuditService.log({
        adminUserId,
        action: 'ARTIST_MEDIA_PRIMARY_CHANGED',
        module: 'ARTISTS',
        entityType: 'ArtistMedia',
        entityId: `${artistId}:${mediaId}:${role}`,
        newValues: { artistId, mediaId, isPrimary: true },
        ipAddress: meta?.ipAddress,
        userAgent: meta?.userAgent
      });
    }

    return updated;
  }

  static async detachArtistMedia(
    artistId: string,
    mediaId: string,
    role: string = 'PROFILE',
    adminUserId?: string,
    meta?: { ipAddress?: string; userAgent?: string }
  ): Promise<ArtistMedia | null> {
    const existing = await ArtistsRepository.findArtistMedia(artistId, mediaId, role);
    if (!existing) {
      const err: any = new Error(`Media attachment not found for artist ID "${artistId}" and media ID "${mediaId}"`);
      err.status = 404;
      err.code = 'ARTIST_MEDIA_NOT_FOUND';
      throw err;
    }

    const detached = await ArtistsRepository.detachArtistMedia(artistId, mediaId, role);

    if (adminUserId) {
      await AuditService.log({
        adminUserId,
        action: 'ARTIST_MEDIA_DETACHED',
        module: 'ARTISTS',
        entityType: 'ArtistMedia',
        entityId: `${artistId}:${mediaId}:${role}`,
        oldValues: { artistId, mediaId, role },
        ipAddress: meta?.ipAddress,
        userAgent: meta?.userAgent
      });
    }

    return detached;
  }

  static async reorderArtistMedia(
    artistId: string,
    items: ArtistMediaReorderItem[],
    adminUserId?: string,
    meta?: { ipAddress?: string; userAgent?: string }
  ): Promise<void> {
    await ArtistsRepository.bulkReorderArtistMedia(artistId, items);

    if (adminUserId) {
      await AuditService.log({
        adminUserId,
        action: 'ARTIST_MEDIA_REORDERED',
        module: 'ARTISTS',
        entityType: 'ArtistMedia',
        entityId: artistId,
        newValues: { count: items.length },
        ipAddress: meta?.ipAddress,
        userAgent: meta?.userAgent
      });
    }
  }

  // ==========================================
  // Public Storefront APIs & Serialization
  // ==========================================

  static formatPublicArtist(artist: any): any {
    if (!artist) return null;

    let profileMedia: any = null;
    let galleryMedia: any[] = [];

    if (artist.media && Array.isArray(artist.media)) {
      const primaryProf = artist.media.find((m: any) => m.role === 'PROFILE' && m.isPrimary) || artist.media.find((m: any) => m.role === 'PROFILE');
      if (primaryProf?.media) {
        profileMedia = {
          id: primaryProf.media.id,
          publicUrl: primaryProf.media.publicUrl,
          altText: primaryProf.media.altText,
          title: primaryProf.media.title,
          width: primaryProf.media.width,
          height: primaryProf.media.height
        };
      }

      galleryMedia = artist.media
        .filter((m: any) => m.media)
        .map((m: any) => ({
          id: m.media.id,
          publicUrl: m.media.publicUrl,
          altText: m.media.altText,
          title: m.media.title,
          role: m.role,
          isPrimary: m.isPrimary,
          sortOrder: m.sortOrder,
          width: m.media.width,
          height: m.media.height
        }));
    }

    return {
      id: artist.id,
      name: artist.name,
      slug: artist.slug,
      shortBio: artist.shortBio || null,
      biography: artist.biography || null,
      birthYear: artist.birthYear || null,
      deathYear: artist.deathYear || null,
      nationality: artist.nationality || null,
      origin: artist.origin || null,
      tradition: artist.tradition || null,
      medium: artist.medium || null,
      specialization: artist.specialization || null,
      signature: artist.signature || null,
      isFeatured: Boolean(artist.isFeatured),
      sortOrder: artist.sortOrder,
      seo: {
        metaTitle: artist.metaTitle || null,
        metaDescription: artist.metaDescription || null,
        metaKeywords: artist.metaKeywords || null,
        ogImage: artist.ogImage || profileMedia?.publicUrl || null
      },
      image: profileMedia,
      media: galleryMedia
    };
  }

  static async listPublicArtists(query: PublicArtistFilterQuery) {
    const result = await ArtistsRepository.listPublic(query);
    return {
      items: result.items.map(a => this.formatPublicArtist(a)),
      total: result.total,
      page: result.page,
      limit: result.limit,
      totalPages: result.totalPages
    };
  }

  static async getPublicArtistBySlug(slug: string): Promise<any> {
    const artist = await ArtistsRepository.findBySlug(slug, {
      media: { include: { media: true } }
    });

    if (!artist || artist.status !== 'ACTIVE') {
      const err: any = new Error(`Artist not found`);
      err.status = 404;
      err.code = 'NOT_FOUND';
      throw err;
    }

    // Get active products associated with this artist
    const productRelations = await prisma.productArtist.findMany({
      where: { artistId: artist.id },
      include: {
        product: {
          include: {
            category: true,
            collections: { include: { collection: true } },
            media: { include: { media: true } },
            variants: { include: { media: { include: { media: true } } } },
            antiqueProfile: true,
            sanskritEditProfile: true
          }
        }
      }
    });

    const activeProducts = productRelations
      .filter((rel: any) => rel.product && rel.product.status === 'ACTIVE')
      .map((rel: any) => {
        const formatted = ProductsService.formatPublicProduct(rel.product);
        return {
          ...formatted,
          artistRole: rel.role,
          isPrimaryArtist: rel.isPrimary
        };
      });

    const publicProfile = this.formatPublicArtist(artist);
    return {
      ...publicProfile,
      products: activeProducts
    };
  }
}

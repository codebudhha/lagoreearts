import { prisma } from '../../database/prisma.ts';
import { LookbookRepository } from './lookbook.repository.ts';
import type { LookbookQueryFilter } from './lookbook.types.ts';

export class LookbookPublicService {
  /**
   * Get public published lookbooks list
   */
  static async getPublicLookbooks(query: LookbookQueryFilter) {
    const page = Math.max(1, Number(query.page || 1));
    const limit = Math.max(1, Math.min(100, Number(query.limit || 20)));
    const skip = (page - 1) * limit;

    const now = new Date().toISOString();
    const where: any = {
      status: 'PUBLISHED',
      publishedAtLTE: now
    };

    if (query.featured !== undefined) where.featured = Boolean(query.featured);
    if (query.search) where.search = query.search;

    const orderBy: any = {};
    if (query.sortBy) {
      orderBy[query.sortBy] = query.sortOrder || 'asc';
    } else {
      orderBy.displayOrder = 'asc';
    }

    const [items, total] = await Promise.all([
      prisma.lookbook.findMany({
        where,
        orderBy,
        skip,
        take: limit,
        include: {
          coverMedia: true,
          sections: {
            include: {
              products: { include: { product: true } },
              collections: { include: { collection: true } },
              artists: { include: { artist: true } },
              categories: { include: { category: true } },
              journals: { include: { journalPost: true } },
              sanskritEdits: { include: { sanskritEditProfile: true } },
              media: { include: { media: true } }
            }
          }
        }
      }),
      prisma.lookbook.count({ where })
    ]);

    const formattedItems = await Promise.all(items.map((lb: any) => this.formatPublicLookbook(lb)));

    return {
      items: formattedItems,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit)
      }
    };
  }

  /**
   * Get a public published lookbook by slug
   */
  static async getPublicLookbookBySlug(slug: string) {
    const lookbook = await LookbookRepository.findBySlug(slug, true);
    const now = new Date();

    if (
      !lookbook ||
      lookbook.status !== 'PUBLISHED' ||
      (lookbook.publishedAt && new Date(lookbook.publishedAt) > now)
    ) {
      const err: any = new Error(`Published lookbook with slug "${slug}" not found.`);
      err.statusCode = 404;
      err.code = 'LOOKBOOK_NOT_FOUND';
      throw err;
    }

    return this.formatPublicLookbook(lookbook);
  }

  /**
   * Format lookbook for storefront presentation
   */
  static async formatPublicLookbook(lookbook: any) {
    if (!lookbook) return null;

    const rawSections = (lookbook.sections || [])
      .filter((sec: any) => sec.isVisible)
      .sort((a: any, b: any) => (a.displayOrder || 0) - (b.displayOrder || 0));

    const sections = await Promise.all(
      rawSections.map(async (sec: any) => this.formatPublicSection(sec))
    );

    return {
      id: lookbook.id,
      title: lookbook.title,
      slug: lookbook.slug,
      shortDescription: lookbook.shortDescription,
      description: lookbook.description,
      featured: lookbook.featured,
      publishedAt: lookbook.publishedAt,
      coverMedia: lookbook.coverMedia
        ? {
            id: lookbook.coverMedia.id,
            publicUrl: lookbook.coverMedia.publicUrl,
            altText: lookbook.coverMedia.altText,
            width: lookbook.coverMedia.width,
            height: lookbook.coverMedia.height
          }
        : null,
      seo: {
        title: lookbook.seoTitle || lookbook.title,
        description: lookbook.seoDescription || lookbook.shortDescription || null,
        keywords: lookbook.seoKeywords || null
      },
      sections
    };
  }

  /**
   * Format section for public storefront, filtering inactive relations and stripping internal data
   */
  static async formatPublicSection(sec: any) {
    let parsedConfig = sec.config;
    if (typeof sec.config === 'string') {
      try {
        parsedConfig = JSON.parse(sec.config);
      } catch {
        parsedConfig = sec.config;
      }
    }

    const baseSection: any = {
      id: sec.id,
      type: sec.type,
      title: sec.title || null,
      subtitle: sec.subtitle || null,
      body: sec.body || null,
      ctaLabel: sec.ctaLabel || null,
      ctaUrl: sec.ctaUrl || null,
      displayOrder: sec.displayOrder,
      layout: sec.layout || null,
      config: parsedConfig || null,
      media: (sec.media || [])
        .sort((a: any, b: any) => (a.sortOrder || 0) - (b.sortOrder || 0))
        .map((m: any) => ({
          id: m.media?.id || m.mediaAssetId,
          role: m.role,
          sortOrder: m.sortOrder,
          isPrimary: m.isPrimary,
          publicUrl: m.media?.publicUrl,
          altText: m.media?.altText,
          width: m.media?.width,
          height: m.media?.height
        }))
    };

    // Filter active products (published, active)
    if (sec.products && sec.products.length > 0) {
      baseSection.products = sec.products
        .filter((p: any) => p.product && (p.product.status === 'PUBLISHED' || p.product.status === 'ACTIVE'))
        .sort((a: any, b: any) => (a.displayOrder || 0) - (b.displayOrder || 0))
        .map((p: any) => {
          const prod = p.product;
          return {
            id: prod.id,
            title: prod.title,
            slug: prod.slug,
            sku: prod.sku,
            shortDescription: prod.shortDescription,
            basePrice: prod.basePrice,
            salePrice: prod.salePrice,
            currency: prod.currency,
            productType: prod.productType,
            isFeatured: prod.isFeatured,
            isNewArrival: prod.isNewArrival,
            isBestseller: prod.isBestseller,
            category: prod.category ? { id: prod.category.id, name: prod.category.name, slug: prod.category.slug } : null,
            primaryMedia: prod.media?.find((m: any) => m.isPrimary)?.mediaAsset || prod.media?.[0]?.mediaAsset || null,
            artists: (prod.artists || []).map((pa: any) => ({
              id: pa.artist?.id || pa.artistId,
              name: pa.artist?.name,
              slug: pa.artist?.slug
            }))
          };
        });
    } else {
      baseSection.products = [];
    }

    // Filter active collections
    if (sec.collections && sec.collections.length > 0) {
      baseSection.collections = sec.collections
        .filter((c: any) => c.collection && c.collection.status === 'ACTIVE')
        .sort((a: any, b: any) => (a.displayOrder || 0) - (b.displayOrder || 0))
        .map((c: any) => ({
          id: c.collection.id,
          name: c.collection.name,
          slug: c.collection.slug,
          description: c.collection.description,
          type: c.collection.type,
          isFeatured: c.collection.isFeatured
        }));
    } else {
      baseSection.collections = [];
    }

    // Filter active artists
    if (sec.artists && sec.artists.length > 0) {
      baseSection.artists = sec.artists
        .filter((a: any) => a.artist && a.artist.status === 'ACTIVE')
        .sort((a: any, b: any) => (a.displayOrder || 0) - (b.displayOrder || 0))
        .map((a: any) => ({
          id: a.artist.id,
          name: a.artist.name,
          slug: a.artist.slug,
          bio: a.artist.bio,
          tradition: a.artist.tradition,
          medium: a.artist.medium,
          isFeatured: a.artist.isFeatured
        }));
    } else {
      baseSection.artists = [];
    }

    // Filter active categories
    if (sec.categories && sec.categories.length > 0) {
      baseSection.categories = sec.categories
        .filter((cat: any) => cat.category && cat.category.status === 'ACTIVE')
        .sort((a: any, b: any) => (a.displayOrder || 0) - (b.displayOrder || 0))
        .map((cat: any) => ({
          id: cat.category.id,
          name: cat.category.name,
          slug: cat.category.slug,
          description: cat.category.description,
          isFeatured: cat.category.isFeatured
        }));
    } else {
      baseSection.categories = [];
    }

    // Filter published journals
    if (sec.journals && sec.journals.length > 0) {
      const now = new Date();
      baseSection.journals = sec.journals
        .filter(
          (j: any) =>
            j.journalPost &&
            j.journalPost.status === 'PUBLISHED' &&
            (!j.journalPost.publishedAt || new Date(j.journalPost.publishedAt) <= now)
        )
        .sort((a: any, b: any) => (a.displayOrder || 0) - (b.displayOrder || 0))
        .map((j: any) => ({
          id: j.journalPost.id,
          title: j.journalPost.title,
          slug: j.journalPost.slug,
          excerpt: j.journalPost.excerpt,
          type: j.journalPost.type,
          featured: j.journalPost.featured,
          publishedAt: j.journalPost.publishedAt,
          author: j.journalPost.author ? { id: j.journalPost.author.id, name: j.journalPost.author.name, slug: j.journalPost.author.slug } : null,
          category: j.journalPost.category ? { id: j.journalPost.category.id, name: j.journalPost.category.name, slug: j.journalPost.category.slug } : null
        }));
    } else {
      baseSection.journals = [];
    }

    // Filter published sanskrit edits
    if (sec.sanskritEdits && sec.sanskritEdits.length > 0) {
      baseSection.sanskritEdits = sec.sanskritEdits
        .filter((s: any) => s.sanskritEditProfile && s.sanskritEditProfile.isPublished)
        .sort((a: any, b: any) => (a.displayOrder || 0) - (b.displayOrder || 0))
        .map((s: any) => ({
          id: s.sanskritEditProfile.id,
          productId: s.sanskritEditProfile.productId,
          sanskritTitle: s.sanskritEditProfile.sanskritTitle,
          devanagariText: s.sanskritEditProfile.devanagariText,
          transliteration: s.sanskritEditProfile.transliteration,
          translation: s.sanskritEditProfile.translation,
          meaning: s.sanskritEditProfile.meaning,
          theme: s.sanskritEditProfile.theme,
          source: s.sanskritEditProfile.source,
          isFeatured: s.sanskritEditProfile.isFeatured
        }));
    } else {
      baseSection.sanskritEdits = [];
    }

    return baseSection;
  }
}

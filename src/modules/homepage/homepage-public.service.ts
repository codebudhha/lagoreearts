import { prisma } from '../../database/prisma.ts';
import { HomepageRepository } from './homepage.repository.ts';
import { ProductsService } from '../products/products.service.ts';
import { ArtistsService } from '../artists/artists.service.ts';

export class HomepagePublicService {
  /**
   * Get the active default published homepage
   */
  static async getPublicDefaultHomepage() {
    let homepage = await HomepageRepository.findDefault(true);
    if (!homepage) {
      // Fallback: look for any PUBLISHED homepage
      homepage = await prisma.homepage.findFirst({
        where: { status: 'PUBLISHED' },
        orderBy: { updatedAt: 'desc' },
        include: {
          ogImage: true,
          sections: {
            include: {
              products: { include: { product: true } },
              collections: { include: { collection: true } },
              artists: { include: { artist: true } },
              categories: { include: { category: true } },
              media: { include: { media: true } }
            }
          }
        }
      });
    }

    if (!homepage) {
      const err: any = new Error('No published homepage is currently available.');
      err.status = 404;
      err.code = 'HOMEPAGE_NOT_FOUND';
      throw err;
    }

    return this.formatPublicHomepage(homepage);
  }

  /**
   * Get a public published homepage by slug
   */
  static async getPublicHomepageBySlug(slug: string) {
    const homepage = await HomepageRepository.findBySlug(slug, true);
    if (!homepage || homepage.status !== 'PUBLISHED') {
      const err: any = new Error(`Published homepage with slug "${slug}" not found.`);
      err.status = 404;
      err.code = 'HOMEPAGE_NOT_FOUND';
      throw err;
    }

    return this.formatPublicHomepage(homepage);
  }

  /**
   * Format and enrich a homepage for public storefront consumption
   */
  static async formatPublicHomepage(homepage: any) {
    if (!homepage) return null;

    // Filter visible sections and sort by displayOrder
    const rawSections = (homepage.sections || [])
      .filter((sec: any) => sec.isVisible)
      .sort((a: any, b: any) => (a.displayOrder || 0) - (b.displayOrder || 0));

    const sections = await Promise.all(
      rawSections.map(async (sec: any) => this.formatPublicSection(sec))
    );

    return {
      id: homepage.id,
      name: homepage.name,
      slug: homepage.slug,
      isDefault: homepage.isDefault,
      seo: {
        title: homepage.seoTitle || homepage.name,
        description: homepage.seoDescription || null,
        keywords: homepage.seoKeywords || null,
        ogImage: homepage.ogImage
          ? {
              id: homepage.ogImage.id,
              publicUrl: homepage.ogImage.publicUrl,
              altText: homepage.ogImage.altText,
              width: homepage.ogImage.width,
              height: homepage.ogImage.height
            }
          : null
      },
      sections
    };
  }

  /**
   * Format a single homepage section for storefront rendering
   */
  static async formatPublicSection(sec: any) {
    const baseSection: any = {
      id: sec.id,
      type: sec.type,
      title: sec.title || null,
      subtitle: sec.subtitle || null,
      eyebrow: sec.eyebrow || null,
      content: sec.content || null,
      config: sec.config || {},
      displayOrder: sec.displayOrder,
      media: (sec.media || [])
        .filter((m: any) => m.media)
        .sort((a: any, b: any) => (a.displayOrder || 0) - (b.displayOrder || 0))
        .map((m: any) => ({
          id: m.media.id,
          publicUrl: m.media.publicUrl,
          altText: m.media.altText,
          title: m.media.title,
          role: m.role,
          width: m.media.width,
          height: m.media.height
        }))
    };

    switch (sec.type) {
      case 'FEATURED_PRODUCTS': {
        const productItems = (sec.products || [])
          .map((sp: any) => sp.product)
          .filter((p: any) => p && p.status === 'ACTIVE');

        // Format each product safely through ProductsService.formatPublicProduct
        baseSection.products = productItems.map((p: any) => ProductsService.formatPublicProduct(p));
        break;
      }

      case 'FEATURED_COLLECTIONS': {
        baseSection.collections = (sec.collections || [])
          .map((sc: any) => sc.collection)
          .filter((c: any) => c && c.status === 'ACTIVE')
          .map((c: any) => ({
            id: c.id,
            name: c.name,
            slug: c.slug,
            shortDescription: c.shortDescription || null,
            description: c.description || null,
            image: c.image || null,
            bannerImage: c.bannerImage || null,
            isFeatured: c.isFeatured
          }));
        break;
      }

      case 'FEATURED_ARTISTS': {
        const artistItems = (sec.artists || [])
          .map((sa: any) => sa.artist)
          .filter((a: any) => a && a.status === 'ACTIVE');

        baseSection.artists = artistItems.map((a: any) => ArtistsService.formatPublicArtist(a));
        break;
      }

      case 'CATEGORIES': {
        baseSection.categories = (sec.categories || [])
          .map((sc: any) => sc.category)
          .filter((c: any) => c && c.status === 'ACTIVE')
          .map((c: any) => ({
            id: c.id,
            name: c.name,
            slug: c.slug,
            shortDescription: c.shortDescription || null,
            image: c.image || null,
            bannerImage: c.bannerImage || null,
            isFeatured: c.isFeatured
          }));
        break;
      }

      case 'ANTIQUES': {
        const selectionMode = sec.config?.selectionMode || (sec.products?.length > 0 ? 'MANUAL' : 'AUTOMATIC');
        if (selectionMode === 'MANUAL' && sec.products && sec.products.length > 0) {
          const productItems = sec.products
            .map((sp: any) => sp.product)
            .filter((p: any) => p && p.status === 'ACTIVE');
          baseSection.products = productItems.map((p: any) => ProductsService.formatPublicProduct(p));
        } else {
          // Automatic resolution of active antique products
          const limit = sec.config?.maxItems || 8;
          const prods = await prisma.product.findMany({
            where: { productType: 'ANTIQUE', status: 'ACTIVE' },
            take: limit,
            include: {
              category: true,
              collections: { include: { collection: true } },
              media: { include: { media: true } },
              antiqueProfile: true,
              artists: { include: { artist: true } }
            },
            orderBy: { isFeatured: 'desc' }
          });
          baseSection.products = prods.map((p: any) => ProductsService.formatPublicProduct(p));
        }
        break;
      }

      case 'SANSKRIT_EDIT': {
        const selectionMode = sec.config?.selectionMode || (sec.products?.length > 0 ? 'MANUAL' : 'AUTOMATIC');
        if (selectionMode === 'MANUAL' && sec.products && sec.products.length > 0) {
          const productItems = sec.products
            .map((sp: any) => sp.product)
            .filter((p: any) => p && p.status === 'ACTIVE');
          baseSection.products = productItems.map((p: any) => ProductsService.formatPublicProduct(p));
        } else {
          // Automatic resolution of published Sanskrit Edit products
          const limit = sec.config?.maxItems || 8;
          const prods = await prisma.product.findMany({
            where: { productType: 'SANSKRIT_EDIT', status: 'ACTIVE' },
            take: limit,
            include: {
              category: true,
              collections: { include: { collection: true } },
              media: { include: { media: true } },
              sanskritEditProfile: true,
              artists: { include: { artist: true } }
            },
            orderBy: { isFeatured: 'desc' }
          });
          baseSection.products = prods.map((p: any) => ProductsService.formatPublicProduct(p));
        }
        break;
      }

      default:
        break;
    }

    return baseSection;
  }
}

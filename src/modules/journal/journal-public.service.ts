import { prisma } from '../../database/prisma.ts';
import type { JournalPostQueryFilters } from './journal.types.ts';

export class JournalPublicService {
  /**
   * List public published journal posts with active filters
   */
  static async getPublicPosts(query: JournalPostQueryFilters = {}) {
    const page = Math.max(1, Number(query.page || 1));
    const limit = Math.max(1, Math.min(50, Number(query.limit || 12)));
    const skip = (page - 1) * limit;
    const now = new Date();

    const where: any = {
      status: 'PUBLISHED',
      publishedAtLTE: now
    };

    if (query.type) {
      where.type = query.type;
    }

    if (query.featured !== undefined) {
      where.featured = query.featured === true || query.featured === 'true';
    }

    if (query.search) {
      where.search = query.search;
    }

    // Category filter by slug
    if (query.categorySlug) {
      const cat = await prisma.journalCategory.findUnique({ where: { slug: query.categorySlug } });
      if (!cat || cat.status !== 'ACTIVE') {
        return {
          items: [],
          pagination: { page, limit, total: 0, totalPages: 0 }
        };
      }
      where.categoryId = cat.id;
    }

    // Author filter by slug
    if (query.authorSlug) {
      const author = await prisma.journalAuthor.findUnique({ where: { slug: query.authorSlug } });
      if (!author || author.status !== 'ACTIVE') {
        return {
          items: [],
          pagination: { page, limit, total: 0, totalPages: 0 }
        };
      }
      where.authorId = author.id;
    }

    // Tag filter by slug
    if (query.tagSlug) {
      const tag = await prisma.journalTag.findUnique({ where: { slug: query.tagSlug } });
      if (!tag || tag.status !== 'ACTIVE') {
        return {
          items: [],
          pagination: { page, limit, total: 0, totalPages: 0 }
        };
      }
      where.tagId = tag.id;
    }

    const orderBy: any = {};
    const sortBy = query.sortBy || 'publishedAt';
    const sortOrder = query.sortOrder || (sortBy === 'publishedAt' || sortBy === 'createdAt' ? 'desc' : 'asc');
    orderBy[sortBy] = sortOrder;

    const [posts, total] = await Promise.all([
      prisma.journalPost.findMany({
        where,
        include: {
          author: true,
          category: true,
          tags: true,
          media: true
        },
        orderBy,
        take: limit,
        skip
      }),
      prisma.journalPost.count({ where })
    ]);

    const sanitizedItems = posts.map(post => {
      // Find cover media
      const cover = post.media?.find((m: any) => m.role === 'COVER' || m.isPrimary) || post.media?.[0];
      const activeTags = (post.tags || [])
        .map((t: any) => t.tag)
        .filter((t: any) => t && t.status === 'ACTIVE')
        .map((t: any) => ({
          id: t.id,
          name: t.name,
          slug: t.slug
        }));

      const activeAuthor = post.author && post.author.status === 'ACTIVE' ? {
        id: post.author.id,
        name: post.author.name,
        slug: post.author.slug,
        bio: post.author.bio,
        avatarUrl: post.author.avatarMedia?.publicUrl || null
      } : null;

      const activeCategory = post.category && post.category.status === 'ACTIVE' ? {
        id: post.category.id,
        name: post.category.name,
        slug: post.category.slug
      } : null;

      return {
        id: post.id,
        title: post.title,
        slug: post.slug,
        excerpt: post.excerpt,
        type: post.type,
        featured: post.featured,
        publishedAt: post.publishedAt,
        author: activeAuthor,
        category: activeCategory,
        tags: activeTags,
        coverImage: cover?.media ? {
          url: cover.media.publicUrl,
          alt: cover.media.altText || post.title,
          width: cover.media.width,
          height: cover.media.height
        } : null,
        seo: {
          title: post.seoTitle || post.title,
          description: post.seoDescription || post.excerpt,
          keywords: post.seoKeywords
        }
      };
    });

    return {
      items: sanitizedItems,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit)
      }
    };
  }

  /**
   * Get single published journal post detail with active enriched relations
   */
  static async getPublicPostBySlug(slug: string) {
    const post = await prisma.journalPost.findUnique({
      where: { slug },
      include: {
        author: true,
        category: true,
        tags: true,
        products: true,
        collections: true,
        artists: true,
        sanskritEdits: true,
        relatedPosts: true,
        media: true
      }
    });

    const now = new Date();
    if (!post || post.status !== 'PUBLISHED' || !post.publishedAt || new Date(post.publishedAt) > now) {
      const error: any = new Error(`Journal post "${slug}" not found.`);
      error.status = 404;
      error.code = 'JOURNAL_POST_NOT_FOUND';
      throw error;
    }

    // Author
    const activeAuthor = post.author && post.author.status === 'ACTIVE' ? {
      id: post.author.id,
      name: post.author.name,
      slug: post.author.slug,
      bio: post.author.bio,
      avatarUrl: post.author.avatarMedia?.publicUrl || null
    } : null;

    // Category
    const activeCategory = post.category && post.category.status === 'ACTIVE' ? {
      id: post.category.id,
      name: post.category.name,
      slug: post.category.slug,
      description: post.category.description
    } : null;

    // Tags
    const activeTags = (post.tags || [])
      .map((t: any) => t.tag)
      .filter((t: any) => t && t.status === 'ACTIVE')
      .map((t: any) => ({
        id: t.id,
        name: t.name,
        slug: t.slug
      }));

    // Media
    const coverMedia = post.media?.find((m: any) => m.role === 'COVER' || m.isPrimary);
    const galleryMedia = post.media
      ?.filter((m: any) => m.role === 'GALLERY')
      .map((m: any) => ({
        url: m.media?.publicUrl,
        alt: m.media?.altText,
        caption: m.media?.caption,
        width: m.media?.width,
        height: m.media?.height,
        sortOrder: m.sortOrder
      })) || [];

    // Products (Active only, sanitized)
    const activeProducts = (post.products || [])
      .map((p: any) => p.product)
      .filter((prod: any) => prod && prod.status === 'ACTIVE')
      .map((prod: any) => ({
        id: prod.id,
        name: prod.name,
        slug: prod.slug,
        sku: prod.sku,
        price: prod.price,
        compareAtPrice: prod.compareAtPrice,
        currency: prod.currency,
        imageUrl: prod.image,
        isNewArrival: prod.isNewArrival,
        isBestseller: prod.isBestseller,
        category: prod.category ? { id: prod.category.id, name: prod.category.name, slug: prod.category.slug } : null
      }));

    // Collections (Active only)
    const activeCollections = (post.collections || [])
      .map((c: any) => c.collection)
      .filter((col: any) => col && col.status === 'ACTIVE')
      .map((col: any) => ({
        id: col.id,
        name: col.name,
        slug: col.slug,
        shortDescription: col.shortDescription,
        imageUrl: col.image
      }));

    // Artists (Active only)
    const activeArtists = (post.artists || [])
      .map((a: any) => a.artist)
      .filter((art: any) => art && art.status === 'ACTIVE')
      .map((art: any) => ({
        id: art.id,
        name: art.name,
        slug: art.slug,
        shortBio: art.shortBio,
        origin: art.origin,
        tradition: art.tradition,
        medium: art.medium
      }));

    // Sanskrit Edit (Published and active product only)
    const activeSanskritEdits = (post.sanskritEdits || [])
      .map((s: any) => s.sanskritEditProfile)
      .filter((prof: any) => prof && prof.isPublished && prof.product && prof.product.status === 'ACTIVE')
      .map((prof: any) => ({
        id: prof.id,
        productId: prof.productId,
        productName: prof.product.name,
        productSlug: prof.product.slug,
        productPrice: prof.product.price,
        sanskritTitle: prof.sanskritTitle,
        devanagariText: prof.devanagariText,
        transliteration: prof.transliteration,
        translation: prof.translation,
        theme: prof.theme,
        source: prof.source
      }));

    // Related Posts (Published only)
    const activeRelatedPosts = (post.relatedPosts || [])
      .map((rp: any) => rp.relatedPost)
      .filter((rel: any) => rel && rel.status === 'PUBLISHED' && rel.publishedAt && new Date(rel.publishedAt) <= now)
      .map((rel: any) => {
        const relCover = rel.media?.find((m: any) => m.role === 'COVER' || m.isPrimary) || rel.media?.[0];
        return {
          id: rel.id,
          title: rel.title,
          slug: rel.slug,
          excerpt: rel.excerpt,
          type: rel.type,
          publishedAt: rel.publishedAt,
          coverImage: relCover?.media ? {
            url: relCover.media.publicUrl,
            alt: relCover.media.altText || rel.title
          } : null
        };
      });

    return {
      id: post.id,
      title: post.title,
      slug: post.slug,
      excerpt: post.excerpt,
      content: post.content,
      type: post.type,
      featured: post.featured,
      publishedAt: post.publishedAt,
      author: activeAuthor,
      category: activeCategory,
      tags: activeTags,
      coverImage: coverMedia?.media ? {
        url: coverMedia.media.publicUrl,
        alt: coverMedia.media.altText || post.title,
        caption: coverMedia.media.caption,
        width: coverMedia.media.width,
        height: coverMedia.media.height
      } : null,
      gallery: galleryMedia,
      relatedProducts: activeProducts,
      relatedCollections: activeCollections,
      relatedArtists: activeArtists,
      relatedSanskritEdits: activeSanskritEdits,
      relatedPosts: activeRelatedPosts,
      seo: {
        title: post.seoTitle || post.title,
        description: post.seoDescription || post.excerpt,
        keywords: post.seoKeywords
      }
    };
  }
}

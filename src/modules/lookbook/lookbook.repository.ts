import { prisma } from '../../database/prisma.ts';
import type {
  CreateLookbookDTO,
  UpdateLookbookDTO,
  LookbookQueryFilter,
  CreateLookbookSectionDTO,
  UpdateLookbookSectionDTO,
  ReorderLookbookSectionsDTO,
  AttachLookbookSectionMediaDTO,
  ReorderLookbookSectionMediaDTO,
  LookbookSectionMediaRole
} from './lookbook.types.ts';

export class LookbookRepository {
  // ==========================================
  // Lookbook Operations
  // ==========================================

  static async findById(id: string, includeRelations: boolean = true) {
    return prisma.lookbook.findUnique({
      where: { id },
      include: includeRelations
        ? {
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
        : undefined
    });
  }

  static async findBySlug(slug: string, includeRelations: boolean = true) {
    return prisma.lookbook.findUnique({
      where: { slug },
      include: includeRelations
        ? {
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
        : undefined
    });
  }

  static async list(query: LookbookQueryFilter, isPublic: boolean = false) {
    const page = Math.max(1, Number(query.page || 1));
    const limit = Math.max(1, Math.min(100, Number(query.limit || 20)));
    const skip = (page - 1) * limit;

    const where: any = {};
    if (isPublic) {
      where.status = 'PUBLISHED';
      where.publishedAtLTE = new Date().toISOString();
    } else {
      if (query.status) where.status = query.status;
    }

    if (query.featured !== undefined) where.featured = Boolean(query.featured);
    if (query.search) where.search = query.search;

    const orderBy: any = {};
    if (query.sortBy) {
      orderBy[query.sortBy] = query.sortOrder || 'asc';
    }

    const [items, total] = await Promise.all([
      prisma.lookbook.findMany({
        where,
        orderBy,
        skip,
        take: limit,
        include: {
          coverMedia: true,
          sections: true
        }
      }),
      prisma.lookbook.count({ where })
    ]);

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

  static async create(data: CreateLookbookDTO) {
    return prisma.lookbook.create({
      data: {
        title: data.title,
        slug: data.slug,
        shortDescription: data.shortDescription,
        description: data.description,
        status: data.status || 'DRAFT',
        featured: data.featured || false,
        coverMediaId: data.coverMediaId,
        displayOrder: data.displayOrder ?? 0,
        publishedAt: data.publishedAt ? new Date(data.publishedAt) : undefined,
        seoTitle: data.seoTitle,
        seoDescription: data.seoDescription,
        seoKeywords: data.seoKeywords
      },
      include: {
        coverMedia: true,
        sections: true
      }
    });
  }

  static async update(id: string, data: UpdateLookbookDTO) {
    return prisma.lookbook.update({
      where: { id },
      data,
      include: {
        coverMedia: true,
        sections: true
      }
    });
  }

  static async delete(id: string) {
    return prisma.lookbook.delete({
      where: { id }
    });
  }

  // ==========================================
  // Section Operations
  // ==========================================

  static async findSectionById(id: string) {
    return prisma.lookbookSection.findUnique({
      where: { id },
      include: {
        products: { include: { product: true } },
        collections: { include: { collection: true } },
        artists: { include: { artist: true } },
        categories: { include: { category: true } },
        journals: { include: { journalPost: true } },
        sanskritEdits: { include: { sanskritEditProfile: true } },
        media: { include: { media: true } }
      }
    });
  }

  static async findSectionsByLookbookId(lookbookId: string) {
    return prisma.lookbookSection.findMany({
      where: { lookbookId },
      include: {
        products: { include: { product: true } },
        collections: { include: { collection: true } },
        artists: { include: { artist: true } },
        categories: { include: { category: true } },
        journals: { include: { journalPost: true } },
        sanskritEdits: { include: { sanskritEditProfile: true } },
        media: { include: { media: true } }
      },
      orderBy: { displayOrder: 'asc' }
    });
  }

  static async createSection(lookbookId: string, data: CreateLookbookSectionDTO) {
    let nextDisplayOrder = data.displayOrder;
    if (nextDisplayOrder === undefined) {
      const existing = await prisma.lookbookSection.findMany({
        where: { lookbookId },
        orderBy: { displayOrder: 'asc' }
      });
      nextDisplayOrder = existing.length > 0 ? Math.max(...existing.map((s: any) => s.displayOrder)) + 1 : 0;
    }

    return prisma.lookbookSection.create({
      data: {
        lookbookId,
        type: data.type || 'EDITORIAL',
        title: data.title,
        subtitle: data.subtitle,
        body: data.body,
        ctaLabel: data.ctaLabel,
        ctaUrl: data.ctaUrl,
        displayOrder: nextDisplayOrder,
        isVisible: data.isVisible !== undefined ? data.isVisible : true,
        layout: data.layout,
        config: data.config
      },
      include: {
        products: { include: { product: true } },
        collections: { include: { collection: true } },
        artists: { include: { artist: true } },
        categories: { include: { category: true } },
        journals: { include: { journalPost: true } },
        sanskritEdits: { include: { sanskritEditProfile: true } },
        media: { include: { media: true } }
      }
    });
  }

  static async updateSection(id: string, data: UpdateLookbookSectionDTO) {
    return prisma.lookbookSection.update({
      where: { id },
      data,
      include: {
        products: { include: { product: true } },
        collections: { include: { collection: true } },
        artists: { include: { artist: true } },
        categories: { include: { category: true } },
        journals: { include: { journalPost: true } },
        sanskritEdits: { include: { sanskritEditProfile: true } },
        media: { include: { media: true } }
      }
    });
  }

  static async deleteSection(id: string) {
    return prisma.lookbookSection.delete({
      where: { id }
    });
  }

  static async reorderSections(lookbookId: string, items: Array<{ id: string; displayOrder: number }>) {
    for (const item of items) {
      await prisma.lookbookSection.update({
        where: { id: item.id },
        data: { displayOrder: item.displayOrder }
      });
    }
    return this.findSectionsByLookbookId(lookbookId);
  }

  // ==========================================
  // Section Entity Junction Operations
  // ==========================================

  static async setSectionProducts(sectionId: string, products: Array<{ id: string; displayOrder?: number }>) {
    prisma.lookbookSectionProduct.deleteMany({
      where: { lookbookSectionId: sectionId }
    });

    for (let i = 0; i < products.length; i++) {
      const p = products[i];
      prisma.lookbookSectionProduct.create({
        data: {
          lookbookSectionId: sectionId,
          productId: p.id,
          displayOrder: p.displayOrder !== undefined ? p.displayOrder : i
        }
      });
    }

    return this.findSectionById(sectionId);
  }

  static async setSectionCollections(sectionId: string, collections: Array<{ id: string; displayOrder?: number }>) {
    prisma.lookbookSectionCollection.deleteMany({
      where: { lookbookSectionId: sectionId }
    });

    for (let i = 0; i < collections.length; i++) {
      const c = collections[i];
      prisma.lookbookSectionCollection.create({
        data: {
          lookbookSectionId: sectionId,
          collectionId: c.id,
          displayOrder: c.displayOrder !== undefined ? c.displayOrder : i
        }
      });
    }

    return this.findSectionById(sectionId);
  }

  static async setSectionArtists(sectionId: string, artists: Array<{ id: string; displayOrder?: number }>) {
    prisma.lookbookSectionArtist.deleteMany({
      where: { lookbookSectionId: sectionId }
    });

    for (let i = 0; i < artists.length; i++) {
      const a = artists[i];
      prisma.lookbookSectionArtist.create({
        data: {
          lookbookSectionId: sectionId,
          artistId: a.id,
          displayOrder: a.displayOrder !== undefined ? a.displayOrder : i
        }
      });
    }

    return this.findSectionById(sectionId);
  }

  static async setSectionCategories(sectionId: string, categories: Array<{ id: string; displayOrder?: number }>) {
    prisma.lookbookSectionCategory.deleteMany({
      where: { lookbookSectionId: sectionId }
    });

    for (let i = 0; i < categories.length; i++) {
      const cat = categories[i];
      prisma.lookbookSectionCategory.create({
        data: {
          lookbookSectionId: sectionId,
          categoryId: cat.id,
          displayOrder: cat.displayOrder !== undefined ? cat.displayOrder : i
        }
      });
    }

    return this.findSectionById(sectionId);
  }

  static async setSectionJournals(sectionId: string, journals: Array<{ id: string; displayOrder?: number }>) {
    prisma.lookbookSectionJournal.deleteMany({
      where: { lookbookSectionId: sectionId }
    });

    for (let i = 0; i < journals.length; i++) {
      const j = journals[i];
      prisma.lookbookSectionJournal.create({
        data: {
          lookbookSectionId: sectionId,
          journalPostId: j.id,
          displayOrder: j.displayOrder !== undefined ? j.displayOrder : i
        }
      });
    }

    return this.findSectionById(sectionId);
  }

  static async setSectionSanskritEdits(sectionId: string, sanskritEdits: Array<{ id: string; displayOrder?: number }>) {
    prisma.lookbookSectionSanskritEdit.deleteMany({
      where: { lookbookSectionId: sectionId }
    });

    for (let i = 0; i < sanskritEdits.length; i++) {
      const s = sanskritEdits[i];
      prisma.lookbookSectionSanskritEdit.create({
        data: {
          lookbookSectionId: sectionId,
          sanskritEditProfileId: s.id,
          displayOrder: s.displayOrder !== undefined ? s.displayOrder : i
        }
      });
    }

    return this.findSectionById(sectionId);
  }

  // ==========================================
  // Section Media Operations
  // ==========================================

  static async attachSectionMedia(
    sectionId: string,
    mediaAssetId: string,
    role: LookbookSectionMediaRole = 'GALLERY',
    sortOrder?: number,
    isPrimary: boolean = false
  ) {
    if (isPrimary) {
      prisma.lookbookSectionMedia.updateMany({
        where: { lookbookSectionId: sectionId },
        data: { isPrimary: false }
      });
    }

    let finalSortOrder = sortOrder;
    if (finalSortOrder === undefined) {
      const existingMedia = prisma.lookbookSectionMedia.findMany({
        where: { lookbookSectionId: sectionId }
      });
      finalSortOrder = existingMedia.length > 0 ? Math.max(...existingMedia.map((m: any) => m.sortOrder)) + 1 : 0;
    }

    return prisma.lookbookSectionMedia.create({
      data: {
        lookbookSectionId: sectionId,
        mediaAssetId,
        role,
        sortOrder: finalSortOrder,
        isPrimary
      }
    });
  }

  static async detachSectionMedia(sectionId: string, mediaAssetId: string, role: LookbookSectionMediaRole) {
    return prisma.lookbookSectionMedia.delete({
      where: {
        lookbookSectionId_mediaAssetId_role: {
          lookbookSectionId: sectionId,
          mediaAssetId,
          role
        }
      }
    });
  }

  static async reorderSectionMedia(
    sectionId: string,
    items: Array<{
      mediaId: string;
      role: LookbookSectionMediaRole;
      sortOrder: number;
      isPrimary?: boolean;
    }>
  ) {
    for (const item of items) {
      prisma.lookbookSectionMedia.updateMany({
        where: {
          lookbookSectionId: sectionId,
          mediaAssetId: item.mediaId,
          role: item.role
        },
        data: {
          sortOrder: item.sortOrder,
          ...(item.isPrimary !== undefined ? { isPrimary: item.isPrimary } : {})
        }
      });
    }

    return prisma.lookbookSectionMedia.findMany({
      where: { lookbookSectionId: sectionId },
      orderBy: { sortOrder: 'asc' },
      include: { media: true }
    });
  }

  static async setSectionPrimaryMedia(sectionId: string, mediaAssetId: string, role: LookbookSectionMediaRole) {
    prisma.lookbookSectionMedia.updateMany({
      where: { lookbookSectionId: sectionId },
      data: { isPrimary: false }
    });

    prisma.lookbookSectionMedia.updateMany({
      where: {
        lookbookSectionId: sectionId,
        mediaAssetId,
        role
      },
      data: { isPrimary: true }
    });

    return prisma.lookbookSectionMedia.findMany({
      where: { lookbookSectionId: sectionId },
      orderBy: { sortOrder: 'asc' },
      include: { media: true }
    });
  }
}

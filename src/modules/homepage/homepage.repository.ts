import { prisma } from '../../database/prisma.ts';
import type {
  CreateHomepageInput,
  UpdateHomepageInput,
  HomepageFilterQuery,
  CreateHomepageSectionInput,
  UpdateHomepageSectionInput,
  SectionReorderItem,
  SectionMediaReorderItem
} from './homepage.types.ts';

export class HomepageRepository {
  // ==========================================
  // Homepage Operations
  // ==========================================

  static async findById(id: string, includeRelations: boolean = true) {
    return prisma.homepage.findUnique({
      where: { id },
      include: includeRelations
        ? {
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
        : undefined
    });
  }

  static async findBySlug(slug: string, includeRelations: boolean = true) {
    return prisma.homepage.findUnique({
      where: { slug },
      include: includeRelations
        ? {
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
        : undefined
    });
  }

  static async findDefault(includeRelations: boolean = true) {
    return prisma.homepage.findFirst({
      where: { isDefault: true, status: 'PUBLISHED' },
      include: includeRelations
        ? {
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
        : undefined
    });
  }

  static async list(query: HomepageFilterQuery) {
    const page = Math.max(1, Number(query.page || 1));
    const limit = Math.max(1, Math.min(100, Number(query.limit || 20)));
    const skip = (page - 1) * limit;

    const where: any = {};
    if (query.status) where.status = query.status;
    if (query.isDefault !== undefined) where.isDefault = Boolean(query.isDefault);
    if (query.search) where.search = query.search;

    const orderBy: any = {};
    if (query.sortBy) {
      orderBy[query.sortBy] = query.sortOrder || 'asc';
    }

    const [items, total] = await Promise.all([
      prisma.homepage.findMany({
        where,
        orderBy,
        skip,
        take: limit,
        include: {
          ogImage: true,
          sections: true
        }
      }),
      prisma.homepage.count({ where })
    ]);

    return {
      items,
      pagination: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit) || 1
      }
    };
  }

  static async create(data: CreateHomepageInput & { slug: string }) {
    return prisma.homepage.create({
      data: {
        name: data.name,
        slug: data.slug,
        status: data.status || 'DRAFT',
        isDefault: Boolean(data.isDefault),
        seoTitle: data.seoTitle,
        seoDescription: data.seoDescription,
        seoKeywords: data.seoKeywords,
        ogImageId: data.ogImageId
      },
      include: {
        ogImage: true,
        sections: true
      }
    });
  }

  static async update(id: string, data: UpdateHomepageInput) {
    return prisma.homepage.update({
      where: { id },
      data: {
        name: data.name,
        slug: data.slug,
        status: data.status,
        isDefault: data.isDefault,
        seoTitle: data.seoTitle,
        seoDescription: data.seoDescription,
        seoKeywords: data.seoKeywords,
        ogImageId: data.ogImageId
      },
      include: {
        ogImage: true,
        sections: true
      }
    });
  }

  static async unsetOtherDefaults(exceptId: string) {
    await prisma.homepage.updateMany({
      where: { idNot: exceptId, isDefault: true },
      data: { isDefault: false }
    });
  }

  static async delete(id: string) {
    return prisma.homepage.delete({ where: { id } });
  }

  // ==========================================
  // Section Operations
  // ==========================================

  static async findSectionById(id: string, includeRelations: boolean = true) {
    return prisma.homepageSection.findUnique({
      where: { id },
      include: includeRelations
        ? {
            homepage: true,
            products: { include: { product: true } },
            collections: { include: { collection: true } },
            artists: { include: { artist: true } },
            categories: { include: { category: true } },
            media: { include: { media: true } }
          }
        : undefined
    });
  }

  static async listSections(homepageId: string, isVisibleOnly: boolean = false) {
    const where: any = { homepageId };
    if (isVisibleOnly) where.isVisible = true;

    return prisma.homepageSection.findMany({
      where,
      orderBy: { displayOrder: 'asc' },
      include: {
        products: { include: { product: true } },
        collections: { include: { collection: true } },
        artists: { include: { artist: true } },
        categories: { include: { category: true } },
        media: { include: { media: true } }
      }
    });
  }

  static async createSection(homepageId: string, data: CreateHomepageSectionInput) {
    return prisma.homepageSection.create({
      data: {
        homepageId,
        type: data.type,
        title: data.title,
        subtitle: data.subtitle,
        eyebrow: data.eyebrow,
        content: data.content,
        config: data.config,
        displayOrder: data.displayOrder !== undefined ? data.displayOrder : 0,
        isVisible: data.isVisible !== undefined ? data.isVisible : true
      },
      include: {
        products: { include: { product: true } },
        collections: { include: { collection: true } },
        artists: { include: { artist: true } },
        categories: { include: { category: true } },
        media: { include: { media: true } }
      }
    });
  }

  static async updateSection(id: string, data: UpdateHomepageSectionInput) {
    return prisma.homepageSection.update({
      where: { id },
      data: {
        title: data.title,
        subtitle: data.subtitle,
        eyebrow: data.eyebrow,
        content: data.content,
        config: data.config,
        displayOrder: data.displayOrder,
        isVisible: data.isVisible,
        type: data.type
      },
      include: {
        products: { include: { product: true } },
        collections: { include: { collection: true } },
        artists: { include: { artist: true } },
        categories: { include: { category: true } },
        media: { include: { media: true } }
      }
    });
  }

  static async deleteSection(id: string) {
    return prisma.homepageSection.delete({ where: { id } });
  }

  static async bulkReorderSections(items: SectionReorderItem[]) {
    for (const item of items) {
      await prisma.homepageSection.update({
        where: { id: item.id },
        data: { displayOrder: item.displayOrder }
      });
    }
  }

  // ==========================================
  // Section Product Junction
  // ==========================================

  static async replaceSectionProducts(sectionId: string, items: { id: string; displayOrder?: number }[]) {
    await prisma.homepageSectionProduct.deleteMany({ where: { sectionId } });
    for (let i = 0; i < items.length; i++) {
      const p = items[i];
      const displayOrder = p.displayOrder !== undefined ? p.displayOrder : i + 1;
      await prisma.homepageSectionProduct.create({
        data: {
          sectionId,
          productId: p.id,
          displayOrder
        }
      });
    }
  }

  // ==========================================
  // Section Collection Junction
  // ==========================================

  static async replaceSectionCollections(sectionId: string, items: { id: string; displayOrder?: number }[]) {
    await prisma.homepageSectionCollection.deleteMany({ where: { sectionId } });
    for (let i = 0; i < items.length; i++) {
      const c = items[i];
      const displayOrder = c.displayOrder !== undefined ? c.displayOrder : i + 1;
      await prisma.homepageSectionCollection.create({
        data: {
          sectionId,
          collectionId: c.id,
          displayOrder
        }
      });
    }
  }

  // ==========================================
  // Section Artist Junction
  // ==========================================

  static async replaceSectionArtists(sectionId: string, items: { id: string; displayOrder?: number }[]) {
    await prisma.homepageSectionArtist.deleteMany({ where: { sectionId } });
    for (let i = 0; i < items.length; i++) {
      const a = items[i];
      const displayOrder = a.displayOrder !== undefined ? a.displayOrder : i + 1;
      await prisma.homepageSectionArtist.create({
        data: {
          sectionId,
          artistId: a.id,
          displayOrder
        }
      });
    }
  }

  // ==========================================
  // Section Category Junction
  // ==========================================

  static async replaceSectionCategories(sectionId: string, items: { id: string; displayOrder?: number }[]) {
    await prisma.homepageSectionCategory.deleteMany({ where: { sectionId } });
    for (let i = 0; i < items.length; i++) {
      const cat = items[i];
      const displayOrder = cat.displayOrder !== undefined ? cat.displayOrder : i + 1;
      await prisma.homepageSectionCategory.create({
        data: {
          sectionId,
          categoryId: cat.id,
          displayOrder
        }
      });
    }
  }

  // ==========================================
  // Section Media Junction
  // ==========================================

  static async attachSectionMedia(sectionId: string, mediaId: string, role: string = 'PRIMARY', displayOrder: number = 0) {
    return prisma.homepageSectionMedia.create({
      data: {
        sectionId,
        mediaId,
        role,
        displayOrder
      },
      include: { media: true }
    });
  }

  static async detachSectionMedia(sectionId: string, mediaId: string, role?: string) {
    if (role) {
      return prisma.homepageSectionMedia.delete({
        where: { sectionId_mediaId_role: { sectionId, mediaId, role } }
      });
    }
    await prisma.homepageSectionMedia.deleteMany({ where: { sectionId, mediaId } });
  }

  static async bulkReorderSectionMedia(sectionId: string, items: SectionMediaReorderItem[]) {
    for (const item of items) {
      await prisma.homepageSectionMedia.update({
        where: { sectionId_mediaId_role: { sectionId, mediaId: item.mediaId, role: item.role } },
        data: { displayOrder: item.displayOrder }
      });
    }
  }
}

import { prisma } from '../../database/prisma.ts';
import type {
  SanskritEditProfile,
  CreateSanskritEditProfileInput,
  UpdateSanskritEditProfileInput,
  SanskritEditReorderItem,
  SanskritEditFilterQuery,
  PublicSanskritEditFilterQuery
} from './sanskrit-edit.types.ts';

export class SanskritEditRepository {
  static async findById(id: string): Promise<SanskritEditProfile | null> {
    return prisma.sanskritEditProfile.findUnique({
      where: { id },
      include: { product: true }
    });
  }

  static async findByProductId(productId: string): Promise<SanskritEditProfile | null> {
    return prisma.sanskritEditProfile.findUnique({
      where: { productId },
      include: { product: true }
    });
  }

  static async create(productId: string, data: CreateSanskritEditProfileInput): Promise<SanskritEditProfile> {
    return prisma.sanskritEditProfile.create({
      data: {
        productId,
        ...data
      }
    });
  }

  static async updateByProductId(productId: string, data: UpdateSanskritEditProfileInput): Promise<SanskritEditProfile> {
    return prisma.sanskritEditProfile.update({
      where: { productId },
      data
    });
  }

  static async deleteByProductId(productId: string): Promise<SanskritEditProfile | null> {
    return prisma.sanskritEditProfile.delete({
      where: { productId }
    });
  }

  static async bulkReorder(items: SanskritEditReorderItem[]): Promise<void> {
    await prisma.$transaction(async (tx: any) => {
      for (const item of items) {
        await tx.sanskritEditProfile.updateMany({
          where: { productId: item.productId },
          data: { displayOrder: item.displayOrder }
        });
      }
    });
  }

  static async findAdminProfiles(query: SanskritEditFilterQuery) {
    const page = Math.max(1, Number(query.page || 1));
    const limit = Math.max(1, Math.min(100, Number(query.limit || 20)));
    const skip = (page - 1) * limit;

    // Get all sanskrit profiles with criteria
    const profiles = await prisma.sanskritEditProfile.findMany({
      where: {
        theme: query.theme,
        source: query.source,
        isPublished: query.isPublished,
        isFeatured: query.isFeatured,
        search: query.search
      }
    });

    // Hydrate products and apply category/collection/status filters in memory or via relational lookups
    let filteredProfiles = [];
    for (const prof of profiles) {
      const prod = await prisma.product.findUnique({
        where: { id: prof.productId },
        include: {
          category: true,
          collections: { include: { collection: true } },
          attributes: { include: { attribute: true, attributeValue: true } },
          media: { include: { media: true } }
        }
      });

      if (!prod) continue;

      if (query.status && prod.status !== query.status) continue;
      if (query.categoryId && prod.categoryId !== query.categoryId) continue;
      if (query.collectionId) {
        const hasCol = prod.collections?.some((pc: any) => pc.collectionId === query.collectionId || pc.collection?.id === query.collectionId);
        if (!hasCol) continue;
      }

      filteredProfiles.push({
        ...prof,
        product: prod
      });
    }

    // Sort
    const sortBy = query.sortBy || 'displayOrder';
    const sortOrder = query.sortOrder || 'asc';
    filteredProfiles.sort((a: any, b: any) => {
      let valA: any = a[sortBy];
      let valB: any = b[sortBy];

      if (sortBy === 'name') {
        valA = a.product?.name || '';
        valB = b.product?.name || '';
      }

      if (valA === null || valA === undefined) valA = '';
      if (valB === null || valB === undefined) valB = '';

      if (valA < valB) return sortOrder === 'asc' ? -1 : 1;
      if (valA > valB) return sortOrder === 'asc' ? 1 : -1;
      return 0;
    });

    const total = filteredProfiles.length;
    const paginated = filteredProfiles.slice(skip, skip + limit);

    return {
      items: paginated,
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit) || 1
    };
  }

  static async findPublicProfiles(query: PublicSanskritEditFilterQuery) {
    const page = Math.max(1, Number(query.page || 1));
    const limit = Math.max(1, Math.min(100, Number(query.limit || 20)));
    const skip = (page - 1) * limit;

    const where: any = {
      isPublished: true
    };
    if (query.featured !== undefined) {
      where.isFeatured = query.featured;
    }
    if (query.theme) {
      where.theme = query.theme;
    }
    if (query.source) {
      where.source = query.source;
    }
    if (query.search) {
      where.search = query.search;
    }

    const profiles = await prisma.sanskritEditProfile.findMany({ where });

    let activePublishedList = [];
    for (const prof of profiles) {
      const prod = await prisma.product.findUnique({
        where: { id: prof.productId },
        include: {
          category: true,
          collections: { include: { collection: true } },
          attributes: { include: { attribute: true, attributeValue: true } },
          media: { include: { media: true } }
        }
      });

      // Public listing requires ACTIVE product
      if (!prod || prod.status !== 'ACTIVE') continue;

      if (query.categoryId && prod.categoryId !== query.categoryId) continue;
      if (query.collectionId) {
        const hasCol = prod.collections?.some((pc: any) => pc.collectionId === query.collectionId || pc.collection?.id === query.collectionId);
        if (!hasCol) continue;
      }

      activePublishedList.push({
        ...prod,
        sanskritEdit: prof
      });
    }

    // Sort
    const sortBy = query.sortBy || 'displayOrder';
    const sortOrder = query.sortOrder || 'asc';
    activePublishedList.sort((a: any, b: any) => {
      let valA: any = sortBy === 'displayOrder' ? a.sanskritEdit?.displayOrder : a[sortBy];
      let valB: any = sortBy === 'displayOrder' ? b.sanskritEdit?.displayOrder : b[sortBy];

      if (valA === null || valA === undefined) valA = 0;
      if (valB === null || valB === undefined) valB = 0;

      if (valA < valB) return sortOrder === 'asc' ? -1 : 1;
      if (valA > valB) return sortOrder === 'asc' ? 1 : -1;
      // Secondary sort by name
      return (a.name || '').localeCompare(b.name || '');
    });

    const total = activePublishedList.length;
    const paginated = activePublishedList.slice(skip, skip + limit);

    return {
      items: paginated,
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit) || 1
    };
  }
}

import { prisma } from '../../database/prisma.ts';
import type { AntiqueProfile, CreateAntiqueProfileInput, UpdateAntiqueProfileInput, AntiqueFilterQuery } from './antiques.types.ts';

export class AntiquesRepository {
  static async findById(id: string, include?: any): Promise<AntiqueProfile | null> {
    return prisma.antiqueProfile.findUnique({ where: { id }, include });
  }

  static async findByProductId(productId: string, include?: any): Promise<AntiqueProfile | null> {
    return prisma.antiqueProfile.findUnique({ where: { productId }, include });
  }

  static async create(productId: string, input: CreateAntiqueProfileInput, include?: any): Promise<AntiqueProfile> {
    return prisma.antiqueProfile.create({
      data: {
        productId,
        ...input
      },
      include
    });
  }

  static async updateByProductId(productId: string, input: UpdateAntiqueProfileInput, include?: any): Promise<AntiqueProfile | null> {
    return prisma.antiqueProfile.update({
      where: { productId },
      data: input,
      include
    });
  }

  static async deleteByProductId(productId: string): Promise<AntiqueProfile | null> {
    return prisma.antiqueProfile.delete({
      where: { productId }
    });
  }

  static async findMany(query: AntiqueFilterQuery) {
    const {
      page = 1,
      limit = 20,
      search,
      era,
      origin,
      condition,
      restorationStatus,
      authenticityStatus,
      isOneOfAKind,
      isCertified,
      categoryId,
      status,
      minPrice,
      maxPrice,
      sort,
      order = 'desc'
    } = query;

    const skip = (Number(page) - 1) * Number(limit);
    const take = Number(limit);

    // Products query with antiqueProfile join
    const where: any = {
      search,
      categoryId,
      status,
      minPrice,
      maxPrice
    };

    // Load products that have an antique profile matching antique filters
    const allProducts = await prisma.product.findMany({
      where,
      include: {
        category: true,
        collections: true,
        attributes: true,
        media: true,
        antiqueProfile: true
      },
      orderBy: sort ? { [sort]: order } : { createdAt: 'desc' }
    });

    // Filter by antique profile criteria
    const filtered = allProducts.filter((p: any) => {
      if (!p.antiqueProfile) return false;
      const ap = p.antiqueProfile;

      if (era && ap.era && !ap.era.toLowerCase().includes(era.toLowerCase())) return false;
      if (origin && ap.origin && !ap.origin.toLowerCase().includes(origin.toLowerCase())) return false;
      if (condition && ap.condition !== condition) return false;
      if (restorationStatus && ap.restorationStatus !== restorationStatus) return false;
      if (authenticityStatus && ap.authenticityStatus !== authenticityStatus) return false;
      if (isOneOfAKind !== undefined && ap.isOneOfAKind !== Boolean(isOneOfAKind)) return false;
      if (isCertified !== undefined && ap.isCertified !== Boolean(isCertified)) return false;

      return true;
    });

    const total = filtered.length;
    const paginated = filtered.slice(skip, skip + take);

    return {
      items: paginated,
      total,
      page: Number(page),
      limit: Number(limit),
      totalPages: Math.ceil(total / take) || 1
    };
  }
}

import { prisma } from '../../database/prisma.ts';
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
  ArtistMediaReorderItem
} from './artists.types.ts';

export class ArtistsRepository {
  static async findById(id: string, include?: any): Promise<Artist | null> {
    return prisma.artist.findUnique({ where: { id }, include });
  }

  static async findBySlug(slug: string, include?: any): Promise<Artist | null> {
    return prisma.artist.findUnique({ where: { slug }, include });
  }

  static async create(data: CreateArtistInput, include?: any): Promise<Artist> {
    return prisma.artist.create({ data, include });
  }

  static async update(id: string, data: UpdateArtistInput, include?: any): Promise<Artist> {
    return prisma.artist.update({ where: { id }, data, include });
  }

  static async delete(id: string): Promise<Artist> {
    return prisma.artist.delete({ where: { id } });
  }

  static async listAdmin(query: ArtistFilterQuery): Promise<{
    items: Artist[];
    total: number;
    page: number;
    limit: number;
    totalPages: number;
  }> {
    const page = query.page && query.page > 0 ? query.page : 1;
    const limit = query.limit && query.limit > 0 ? query.limit : 20;
    const skip = (page - 1) * limit;

    const where: any = {};
    if (query.status) where.status = query.status;
    if (query.isFeatured !== undefined) where.isFeatured = query.isFeatured;
    if (query.nationality) where.nationality = query.nationality;
    if (query.tradition) where.tradition = query.tradition;
    if (query.medium) where.medium = query.medium;
    if (query.specialization) where.specialization = query.specialization;
    if (query.search) where.search = query.search.trim();

    const orderBy: any = {};
    if (query.sortBy === 'name') orderBy.name = query.sortOrder || 'asc';
    else if (query.sortBy === 'createdAt') orderBy.createdAt = query.sortOrder || 'desc';
    else orderBy.sortOrder = query.sortOrder || 'asc';

    const [items, total] = await Promise.all([
      prisma.artist.findMany({
        where,
        orderBy,
        take: limit,
        skip,
        include: { media: { include: { media: true } } }
      }),
      prisma.artist.count({ where })
    ]);

    return {
      items,
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit) || 1
    };
  }

  static async listPublic(query: PublicArtistFilterQuery): Promise<{
    items: Artist[];
    total: number;
    page: number;
    limit: number;
    totalPages: number;
  }> {
    const page = query.page && query.page > 0 ? query.page : 1;
    const limit = query.limit && query.limit > 0 ? query.limit : 20;
    const skip = (page - 1) * limit;

    const where: any = {
      status: 'ACTIVE'
    };
    if (query.featured !== undefined) where.isFeatured = query.featured;
    if (query.tradition) where.tradition = query.tradition;
    if (query.medium) where.medium = query.medium;
    if (query.specialization) where.specialization = query.specialization;
    if (query.search) where.search = query.search.trim();

    const orderBy: any = {};
    if (query.sortBy === 'name') orderBy.name = query.sortOrder || 'asc';
    else orderBy.sortOrder = query.sortOrder || 'asc';

    const [items, total] = await Promise.all([
      prisma.artist.findMany({
        where,
        orderBy,
        take: limit,
        skip,
        include: { media: { include: { media: true } } }
      }),
      prisma.artist.count({ where })
    ]);

    return {
      items,
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit) || 1
    };
  }

  static async bulkReorder(items: ArtistReorderItem[]): Promise<void> {
    for (const item of items) {
      await prisma.artist.update({
        where: { id: item.id },
        data: { sortOrder: Number(item.sortOrder) }
      });
    }
  }

  // ==========================================
  // ProductArtist Relationships
  // ==========================================

  static async findProductArtist(productId: string, artistId: string, role: string, include?: any): Promise<ProductArtist | null> {
    return prisma.productArtist.findUnique({
      where: { productId_artistId_role: { productId, artistId, role } },
      include
    });
  }

  static async listProductArtists(productId: string, include: any = { artist: { include: { media: true } } }): Promise<ProductArtist[]> {
    return prisma.productArtist.findMany({
      where: { productId },
      orderBy: { isPrimary: 'desc' },
      include
    });
  }

  static async attachProductArtist(productId: string, input: AttachProductArtistInput, include?: any): Promise<ProductArtist> {
    return prisma.productArtist.create({
      data: {
        productId,
        artistId: input.artistId,
        role: input.role || 'ARTIST',
        isPrimary: input.isPrimary || false,
        sortOrder: input.sortOrder !== undefined ? Number(input.sortOrder) : 0
      },
      include
    });
  }

  static async updateProductArtist(productId: string, artistId: string, currentRole: string, input: UpdateProductArtistInput, include?: any): Promise<ProductArtist> {
    return prisma.productArtist.update({
      where: { productId_artistId_role: { productId, artistId, role: currentRole } },
      data: {
        role: input.role,
        isPrimary: input.isPrimary,
        sortOrder: input.sortOrder !== undefined ? Number(input.sortOrder) : undefined
      },
      include
    });
  }

  static async detachProductArtist(productId: string, artistId: string, role: string): Promise<ProductArtist | null> {
    return prisma.productArtist.delete({
      where: { productId_artistId_role: { productId, artistId, role } }
    });
  }

  static async bulkReorderProductArtists(productId: string, items: ProductArtistReorderItem[]): Promise<void> {
    for (const item of items) {
      await prisma.productArtist.update({
        where: { productId_artistId_role: { productId, artistId: item.artistId, role: item.role } },
        data: { sortOrder: Number(item.sortOrder) }
      });
    }
  }

  static async unsetOtherPrimaryArtists(productId: string, currentArtistId: string, currentRole: string): Promise<void> {
    const others = await prisma.productArtist.findMany({
      where: { productId }
    });
    for (const other of others) {
      if ((other.artistId !== currentArtistId || other.role !== currentRole) && other.isPrimary) {
        await prisma.productArtist.update({
          where: { productId_artistId_role: { productId, artistId: other.artistId, role: other.role } },
          data: { isPrimary: false }
        });
      }
    }
  }

  static async countProductsByArtist(artistId: string): Promise<number> {
    return prisma.productArtist.count({
      where: { artistId }
    });
  }

  // ==========================================
  // ArtistMedia Relationships
  // ==========================================

  static async findArtistMedia(artistId: string, mediaId: string, role: string, include?: any): Promise<ArtistMedia | null> {
    return prisma.artistMedia.findUnique({
      where: { artistId_mediaId_role: { artistId, mediaId, role } },
      include
    });
  }

  static async listArtistMedia(artistId: string, include: any = { media: true }): Promise<ArtistMedia[]> {
    return prisma.artistMedia.findMany({
      where: { artistId },
      orderBy: { isPrimary: 'desc' },
      include
    });
  }

  static async attachArtistMedia(artistId: string, input: AttachArtistMediaInput, include?: any): Promise<ArtistMedia> {
    return prisma.artistMedia.create({
      data: {
        artistId,
        mediaId: input.mediaId,
        role: input.role || 'PROFILE',
        isPrimary: input.isPrimary || false,
        sortOrder: input.sortOrder !== undefined ? Number(input.sortOrder) : 0
      },
      include
    });
  }

  static async updateArtistMedia(artistId: string, mediaId: string, currentRole: string, data: { isPrimary?: boolean; sortOrder?: number; role?: any }, include?: any): Promise<ArtistMedia> {
    return prisma.artistMedia.update({
      where: { artistId_mediaId_role: { artistId, mediaId, role: currentRole } },
      data,
      include
    });
  }

  static async detachArtistMedia(artistId: string, mediaId: string, role: string): Promise<ArtistMedia | null> {
    return prisma.artistMedia.delete({
      where: { artistId_mediaId_role: { artistId, mediaId, role } }
    });
  }

  static async bulkReorderArtistMedia(artistId: string, items: ArtistMediaReorderItem[]): Promise<void> {
    for (const item of items) {
      await prisma.artistMedia.update({
        where: { artistId_mediaId_role: { artistId, mediaId: item.mediaId, role: item.role } },
        data: { sortOrder: Number(item.sortOrder) }
      });
    }
  }

  static async unsetOtherPrimaryMedia(artistId: string, currentMediaId: string, currentRole: string): Promise<void> {
    const others = await prisma.artistMedia.findMany({
      where: { artistId }
    });
    for (const other of others) {
      if ((other.mediaId !== currentMediaId || other.role !== currentRole) && other.isPrimary) {
        await prisma.artistMedia.update({
          where: { artistId_mediaId_role: { artistId, mediaId: other.mediaId, role: other.role } },
          data: { isPrimary: false }
        });
      }
    }
  }
}

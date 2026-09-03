import { prisma } from '../../database/prisma.ts';

export class ProductsRepository {
  static async findById(id: string, include: any = { category: true, collections: true, attributes: true, options: true, variants: true, media: true, antiqueProfile: true, sanskritEditProfile: true, artists: true }) {
    const p = await prisma.product.findUnique({
      where: { id },
      include
    });
    if (p && include?.options && !p.options) {
      p.options = await prisma.productOption.findMany({ where: { productId: p.id }, include: { values: true }, orderBy: { sortOrder: 'asc' } });
    }
    if (p && include?.variants && !p.variants) {
      p.variants = await prisma.productVariant.findMany({ where: { productId: p.id }, include: { optionValues: true, media: true }, orderBy: { sortOrder: 'asc' } });
    }
    if (p && include?.media && !p.media) {
      p.media = await prisma.productMedia.findMany({ where: { productId: p.id }, include: { media: true }, orderBy: { sortOrder: 'asc' } });
    }
    if (p && include?.antiqueProfile && !p.antiqueProfile) {
      p.antiqueProfile = await prisma.antiqueProfile.findUnique({ where: { productId: p.id } });
    }
    if (p && include?.sanskritEditProfile && !p.sanskritEditProfile) {
      p.sanskritEditProfile = await prisma.sanskritEditProfile.findUnique({ where: { productId: p.id } });
    }
    if (p && include?.artists && !p.artists) {
      p.artists = await prisma.productArtist.findMany({ where: { productId: p.id }, include: { artist: true }, orderBy: { isPrimary: 'desc' } });
    }
    return p;
  }

  static async findBySlug(slug: string, include: any = { category: true, collections: true, attributes: true, options: true, variants: true, media: true, antiqueProfile: true, sanskritEditProfile: true, artists: true }) {
    const p = await prisma.product.findUnique({
      where: { slug },
      include
    });
    if (p && include?.options && !p.options) {
      p.options = await prisma.productOption.findMany({ where: { productId: p.id }, include: { values: true }, orderBy: { sortOrder: 'asc' } });
    }
    if (p && include?.variants && !p.variants) {
      p.variants = await prisma.productVariant.findMany({ where: { productId: p.id }, include: { optionValues: true, media: true }, orderBy: { sortOrder: 'asc' } });
    }
    if (p && include?.media && !p.media) {
      p.media = await prisma.productMedia.findMany({ where: { productId: p.id }, include: { media: true }, orderBy: { sortOrder: 'asc' } });
    }
    if (p && include?.antiqueProfile && !p.antiqueProfile) {
      p.antiqueProfile = await prisma.antiqueProfile.findUnique({ where: { productId: p.id } });
    }
    if (p && include?.sanskritEditProfile && !p.sanskritEditProfile) {
      p.sanskritEditProfile = await prisma.sanskritEditProfile.findUnique({ where: { productId: p.id } });
    }
    if (p && include?.artists && !p.artists) {
      p.artists = await prisma.productArtist.findMany({ where: { productId: p.id }, include: { artist: true }, orderBy: { isPrimary: 'desc' } });
    }
    return p;
  }

  static async findBySku(sku: string, include: any = { category: true, collections: true, attributes: true, options: true, variants: true, media: true, antiqueProfile: true, sanskritEditProfile: true, artists: true }) {
    const p = await prisma.product.findUnique({
      where: { sku: sku.trim().toUpperCase() },
      include
    });
    if (p && include?.options && !p.options) {
      p.options = await prisma.productOption.findMany({ where: { productId: p.id }, include: { values: true }, orderBy: { sortOrder: 'asc' } });
    }
    if (p && include?.variants && !p.variants) {
      p.variants = await prisma.productVariant.findMany({ where: { productId: p.id }, include: { optionValues: true, media: true }, orderBy: { sortOrder: 'asc' } });
    }
    if (p && include?.media && !p.media) {
      p.media = await prisma.productMedia.findMany({ where: { productId: p.id }, include: { media: true }, orderBy: { sortOrder: 'asc' } });
    }
    if (p && include?.antiqueProfile && !p.antiqueProfile) {
      p.antiqueProfile = await prisma.antiqueProfile.findUnique({ where: { productId: p.id } });
    }
    if (p && include?.sanskritEditProfile && !p.sanskritEditProfile) {
      p.sanskritEditProfile = await prisma.sanskritEditProfile.findUnique({ where: { productId: p.id } });
    }
    if (p && include?.artists && !p.artists) {
      p.artists = await prisma.productArtist.findMany({ where: { productId: p.id }, include: { artist: true }, orderBy: { isPrimary: 'desc' } });
    }
    return p;
  }

  static async findByName(name: string) {
    return prisma.product.findFirst({
      where: { name }
    });
  }

  static async listProducts(params: {
    where?: any;
    orderBy?: any;
    skip?: number;
    take?: number;
    include?: any;
  }) {
    const include = params.include || { category: true, collections: true, attributes: true };
    const [items, total] = await Promise.all([
      prisma.product.findMany({
        where: params.where,
        orderBy: params.orderBy,
        skip: params.skip,
        take: params.take,
        include
      }),
      prisma.product.count({ where: params.where })
    ]);

    return { items, total };
  }

  static async create(data: any, include: any = { category: true, collections: true, attributes: true }) {
    return prisma.product.create({
      data,
      include
    });
  }

  static async update(id: string, data: any, include: any = { category: true, collections: true, attributes: true }) {
    return prisma.product.update({
      where: { id },
      data,
      include
    });
  }

  static async delete(id: string) {
    return prisma.product.delete({
      where: { id }
    });
  }

  // --- Collection Associations ---

  static async getCollections(productId: string) {
    const pColls = prisma.productCollection.findMany({ where: { productId } });
    const collectionIds = pColls.map((pc: any) => pc.collectionId);
    return collectionIds.map((cid: string) => prisma.collection.findUnique({ where: { id: cid } })).filter(Boolean);
  }

  static async setCollections(productId: string, collectionIds: string[]) {
    prisma.productCollection.deleteMany({ where: { productId } });
    for (const cid of collectionIds) {
      prisma.productCollection.create({
        data: { productId, collectionId: cid }
      });
    }
  }

  static async addCollection(productId: string, collectionId: string) {
    return prisma.productCollection.create({
      data: { productId, collectionId }
    });
  }

  static async removeCollection(productId: string, collectionId: string) {
    prisma.productCollection.deleteMany({
      where: { productId, collectionId }
    });
  }

  // --- Dynamic Attribute Values ---

  static async getAttributes(productId: string) {
    return prisma.productAttributeValue.findMany({
      where: { productId },
      include: { attribute: true, attributeValue: true }
    });
  }

  static async setAttributes(productId: string, attributes: any[]) {
    prisma.productAttributeValue.deleteMany({ where: { productId } });
    for (const attr of attributes) {
      prisma.productAttributeValue.create({
        data: {
          productId,
          attributeId: attr.attributeId,
          attributeValueId: attr.attributeValueId || null,
          textValue: attr.textValue || null,
          numberValue: attr.numberValue !== undefined && attr.numberValue !== null ? Number(attr.numberValue) : null,
          booleanValue: attr.booleanValue !== undefined && attr.booleanValue !== null ? Boolean(attr.booleanValue) : null
        }
      });
    }
  }

  static async removeAttribute(productId: string, attributeId: string) {
    prisma.productAttributeValue.deleteMany({
      where: { productId, attributeId }
    });
  }
}

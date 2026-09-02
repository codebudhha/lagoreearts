import { prisma } from '../../database/prisma.ts';

export class CollectionsRepository {
  static async findById(id: string) {
    return prisma.collection.findUnique({
      where: { id }
    });
  }

  static async findBySlug(slug: string) {
    return prisma.collection.findUnique({
      where: { slug }
    });
  }

  static async findByName(name: string) {
    return prisma.collection.findFirst({
      where: { name }
    });
  }

  static async listCollections(params: {
    where?: any;
    orderBy?: any;
    skip?: number;
    take?: number;
  }) {
    const [items, total] = await Promise.all([
      prisma.collection.findMany({
        where: params.where,
        orderBy: params.orderBy,
        skip: params.skip,
        take: params.take
      }),
      prisma.collection.count({ where: params.where })
    ]);

    return { items, total };
  }

  static async create(data: any) {
    return prisma.collection.create({
      data
    });
  }

  static async update(id: string, data: any) {
    return prisma.collection.update({
      where: { id },
      data
    });
  }

  static async delete(id: string) {
    return prisma.collection.delete({
      where: { id }
    });
  }
}

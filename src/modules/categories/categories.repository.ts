import { prisma } from '../../database/prisma.ts';

export class CategoriesRepository {
  static async findById(id: string, include?: { parent?: boolean; children?: boolean }) {
    return prisma.category.findUnique({
      where: { id },
      include
    });
  }

  static async findBySlug(slug: string, include?: { parent?: boolean; children?: boolean }) {
    return prisma.category.findUnique({
      where: { slug },
      include
    });
  }

  static async findByNameAndParent(name: string, parentId?: string | null) {
    return prisma.category.findFirst({
      where: {
        name,
        parentId: parentId || null
      }
    });
  }

  static async listCategories(params: {
    where?: any;
    orderBy?: any;
    skip?: number;
    take?: number;
    include?: any;
  }) {
    const [items, total] = await Promise.all([
      prisma.category.findMany({
        where: params.where,
        orderBy: params.orderBy,
        skip: params.skip,
        take: params.take,
        include: params.include
      }),
      prisma.category.count({ where: params.where })
    ]);

    return { items, total };
  }

  static async getChildren(parentId: string | null, activeOnly: boolean = false) {
    return prisma.category.findMany({
      where: {
        parentId: parentId || null,
        status: activeOnly ? 'ACTIVE' : undefined
      },
      orderBy: { sortOrder: 'asc', name: 'asc' }
    });
  }

  static async getAllForTree(activeOnly: boolean = false) {
    return prisma.category.findMany({
      where: activeOnly ? { status: 'ACTIVE' } : undefined,
      orderBy: { sortOrder: 'asc', name: 'asc' }
    });
  }

  static async countChildren(parentId: string) {
    return prisma.category.count({
      where: { parentId }
    });
  }

  static async create(data: any) {
    return prisma.category.create({
      data,
      include: { parent: true }
    });
  }

  static async update(id: string, data: any) {
    return prisma.category.update({
      where: { id },
      data,
      include: { parent: true, children: true }
    });
  }

  static async delete(id: string) {
    return prisma.category.delete({
      where: { id }
    });
  }
}

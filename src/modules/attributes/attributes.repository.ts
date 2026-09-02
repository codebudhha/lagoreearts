import { prisma } from '../../database/prisma.ts';

export class AttributesRepository {
  // --- Attributes ---

  static async findById(id: string, include?: { values?: boolean; categoryAttributes?: boolean }) {
    return prisma.attribute.findUnique({
      where: { id },
      include
    });
  }

  static async findBySlug(slug: string, include?: { values?: boolean; categoryAttributes?: boolean }) {
    return prisma.attribute.findUnique({
      where: { slug },
      include
    });
  }

  static async findByName(name: string) {
    return prisma.attribute.findFirst({
      where: { name }
    });
  }

  static async listAttributes(params: {
    where?: any;
    orderBy?: any;
    skip?: number;
    take?: number;
    include?: any;
  }) {
    const [items, total] = await Promise.all([
      prisma.attribute.findMany({
        where: params.where,
        orderBy: params.orderBy,
        skip: params.skip,
        take: params.take,
        include: params.include
      }),
      prisma.attribute.count({ where: params.where })
    ]);

    return { items, total };
  }

  static async create(data: any) {
    return prisma.attribute.create({
      data,
      include: { values: true }
    });
  }

  static async update(id: string, data: any) {
    return prisma.attribute.update({
      where: { id },
      data,
      include: { values: true }
    });
  }

  static async delete(id: string) {
    return prisma.attribute.delete({
      where: { id }
    });
  }

  // --- Attribute Values ---

  static async findValueById(id: string, include?: any) {
    return prisma.attributeValue.findUnique({
      where: { id },
      include
    });
  }

  static async findValueBySlug(attributeId: string, slug: string) {
    return prisma.attributeValue.findUnique({
      where: {
        attributeId_slug: { attributeId, slug }
      }
    });
  }

  static async findValueByName(attributeId: string, name: string) {
    return prisma.attributeValue.findFirst({
      where: { attributeId, name }
    });
  }

  static async listValues(params: {
    where?: any;
    orderBy?: any;
    skip?: number;
    take?: number;
  }) {
    const [items, total] = await Promise.all([
      prisma.attributeValue.findMany({
        where: params.where,
        orderBy: params.orderBy,
        skip: params.skip,
        take: params.take
      }),
      prisma.attributeValue.count({ where: params.where })
    ]);

    return { items, total };
  }

  static async createValue(data: any) {
    return prisma.attributeValue.create({
      data
    });
  }

  static async updateValue(id: string, data: any) {
    return prisma.attributeValue.update({
      where: { id },
      data
    });
  }

  static async deleteValue(id: string) {
    return prisma.attributeValue.delete({
      where: { id }
    });
  }

  static async countValuesForAttribute(attributeId: string) {
    return prisma.attributeValue.count({
      where: { attributeId }
    });
  }

  static async countCategoryBindings(attributeId: string) {
    return prisma.categoryAttribute.count({
      where: { attributeId }
    });
  }
}

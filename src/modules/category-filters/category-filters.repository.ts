import { prisma } from '../../database/prisma.ts';

export class CategoryFiltersRepository {
  static async findBinding(categoryId: string, attributeId: string) {
    return prisma.categoryAttribute.findUnique({
      where: {
        categoryId_attributeId: { categoryId, attributeId }
      },
      include: {
        attribute: true,
        category: true
      }
    });
  }

  static async listCategoryAttributes(categoryId: string, isVisibleOnly: boolean = false) {
    return prisma.categoryAttribute.findMany({
      where: {
        categoryId,
        isVisible: isVisibleOnly ? true : undefined
      },
      orderBy: { sortOrder: 'asc' },
      include: {
        attribute: true
      }
    });
  }

  static async addCategoryAttribute(data: {
    categoryId: string;
    attributeId: string;
    sortOrder?: number;
    isVisible?: boolean;
    isRequired?: boolean;
  }) {
    return prisma.categoryAttribute.create({
      data,
      include: {
        attribute: true
      }
    });
  }

  static async updateCategoryAttribute(
    categoryId: string,
    attributeId: string,
    data: { sortOrder?: number; isVisible?: boolean; isRequired?: boolean }
  ) {
    return prisma.categoryAttribute.update({
      where: {
        categoryId_attributeId: { categoryId, attributeId }
      },
      data,
      include: {
        attribute: true
      }
    });
  }

  static async deleteCategoryAttribute(categoryId: string, attributeId: string) {
    return prisma.categoryAttribute.delete({
      where: {
        categoryId_attributeId: { categoryId, attributeId }
      }
    });
  }
}

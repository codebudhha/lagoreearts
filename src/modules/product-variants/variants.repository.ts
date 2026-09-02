import { prisma } from '../../database/prisma.ts';
import type {
  CreateProductOptionDto,
  UpdateProductOptionDto,
  CreateProductOptionValueDto,
  UpdateProductOptionValueDto,
  CreateProductVariantDto,
  UpdateProductVariantDto,
  VariantQueryFilters
} from './variants.types.ts';

export class ProductVariantRepository {
  async findProduct(id: string) {
    return prisma.product.findUnique({ where: { id } });
  }

  async findProductBySku(sku: string) {
    return prisma.product.findUnique({ where: { sku: sku.trim().toUpperCase() } });
  }

  async findOptionsByProduct(productId: string) {
    return prisma.productOption.findMany({
      where: { productId },
      include: { values: true },
      orderBy: { sortOrder: 'asc' }
    });
  }

  async findOptionById(id: string) {
    return prisma.productOption.findUnique({
      where: { id },
      include: { values: true }
    });
  }

  async findOptionBySlug(productId: string, slug: string) {
    return prisma.productOption.findUnique({
      where: { productId_slug: { productId, slug } },
      include: { values: true }
    });
  }

  async findOptionByName(productId: string, name: string) {
    return prisma.productOption.findFirst({
      where: { productId, name },
      include: { values: true }
    });
  }

  async createOption(productId: string, data: CreateProductOptionDto) {
    return prisma.productOption.create({
      data: {
        productId,
        name: data.name.trim(),
        slug: data.slug!,
        sortOrder: data.sortOrder ?? 0
      },
      include: { values: true }
    });
  }

  async updateOption(id: string, data: UpdateProductOptionDto) {
    const updateData: any = {};
    if (data.name !== undefined) updateData.name = data.name.trim();
    if (data.slug !== undefined) updateData.slug = data.slug;
    if (data.sortOrder !== undefined) updateData.sortOrder = data.sortOrder;

    return prisma.productOption.update({
      where: { id },
      data: updateData,
      include: { values: true }
    });
  }

  async deleteOption(id: string) {
    return prisma.productOption.delete({ where: { id } });
  }

  async findOptionValueById(id: string) {
    return prisma.productOptionValue.findUnique({
      where: { id },
      include: { option: true }
    });
  }

  async findOptionValuesByOption(productOptionId: string) {
    return prisma.productOptionValue.findMany({
      where: { productOptionId },
      orderBy: { sortOrder: 'asc' }
    });
  }

  async findOptionValueBySlug(productOptionId: string, slug: string) {
    return prisma.productOptionValue.findUnique({
      where: { productOptionId_slug: { productOptionId, slug } }
    });
  }

  async findOptionValueByValue(productOptionId: string, value: string) {
    return prisma.productOptionValue.findFirst({
      where: { productOptionId, value: value.trim() }
    });
  }

  async createOptionValue(productOptionId: string, data: CreateProductOptionValueDto) {
    return prisma.productOptionValue.create({
      data: {
        productOptionId,
        value: data.value.trim(),
        slug: data.slug!,
        sortOrder: data.sortOrder ?? 0
      }
    });
  }

  async updateOptionValue(id: string, data: UpdateProductOptionValueDto) {
    const updateData: any = {};
    if (data.value !== undefined) updateData.value = data.value.trim();
    if (data.slug !== undefined) updateData.slug = data.slug;
    if (data.sortOrder !== undefined) updateData.sortOrder = data.sortOrder;

    return prisma.productOptionValue.update({
      where: { id },
      data: updateData
    });
  }

  async deleteOptionValue(id: string) {
    return prisma.productOptionValue.delete({ where: { id } });
  }

  async countOptionUsageInVariants(optionId: string): Promise<number> {
    const values = await prisma.productOptionValue.findMany({
      where: { productOptionId: optionId }
    });
    if (values.length === 0) return 0;
    const valueIds = values.map(v => v.id);

    let count = 0;
    for (const valId of valueIds) {
      const links = await prisma.productVariantOptionValue.findMany({
        where: { optionValueId: valId }
      });
      count += links.length;
    }
    return count;
  }

  async countOptionValueUsageInVariants(optionValueId: string): Promise<number> {
    const links = await prisma.productVariantOptionValue.findMany({
      where: { optionValueId }
    });
    return links.length;
  }

  async findVariantById(id: string) {
    return prisma.productVariant.findUnique({
      where: { id },
      include: {
        optionValues: true,
        product: true
      }
    });
  }

  async findVariantBySku(sku: string) {
    return prisma.productVariant.findUnique({
      where: { sku: sku.trim().toUpperCase() },
      include: {
        optionValues: true
      }
    });
  }

  async findVariantsByProduct(productId: string, filters: VariantQueryFilters = {}) {
    const where: any = { productId };
    if (filters.status) where.status = filters.status;
    if (filters.sku) where.sku = filters.sku;

    const page = filters.page || 1;
    const limit = filters.limit || 50;
    const skip = (page - 1) * limit;

    const orderBy: any = {};
    const sortField = filters.sortBy || 'sortOrder';
    const sortDir = filters.sortOrder || 'asc';
    orderBy[sortField] = sortDir;

    let items = await prisma.productVariant.findMany({
      where,
      include: { optionValues: true },
      orderBy,
      skip,
      take: limit
    });

    if (filters.stockState) {
      if (filters.stockState === 'in_stock') {
        items = items.filter(v => v.stockQuantity > 0 || !v.trackInventory || v.allowBackorder);
      } else if (filters.stockState === 'out_of_stock') {
        items = items.filter(v => v.trackInventory && v.stockQuantity <= 0 && !v.allowBackorder);
      } else if (filters.stockState === 'low_stock') {
        items = items.filter(v => v.trackInventory && v.stockQuantity > 0 && v.stockQuantity <= v.lowStockThreshold);
      }
    }

    const total = await prisma.productVariant.count({ where });

    return {
      items,
      meta: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit)
      }
    };
  }

  async countVariantsByProduct(productId: string) {
    return prisma.productVariant.count({ where: { productId } });
  }

  async getExistingCombinations(productId: string, excludeVariantId?: string) {
    const variants = await prisma.productVariant.findMany({
      where: { productId },
      include: { optionValues: true }
    });

    return variants
      .filter(v => !excludeVariantId || v.id !== excludeVariantId)
      .map(v => ({
        variantId: v.id,
        sku: v.sku,
        optionValueIds: (v.optionValues || []).map((ov: any) => ov.optionValueId).sort()
      }));
  }

  async createVariant(productId: string, data: CreateProductVariantDto, optionValueIds: string[]) {
    const variant = await prisma.productVariant.create({
      data: {
        productId,
        sku: data.sku.trim().toUpperCase(),
        price: data.price !== undefined && data.price !== null ? Number(data.price) : null,
        compareAtPrice: data.compareAtPrice !== undefined && data.compareAtPrice !== null ? Number(data.compareAtPrice) : null,
        costPrice: data.costPrice !== undefined && data.costPrice !== null ? Number(data.costPrice) : null,
        stockQuantity: data.stockQuantity ?? 0,
        lowStockThreshold: data.lowStockThreshold ?? 5,
        trackInventory: data.trackInventory !== undefined ? Boolean(data.trackInventory) : true,
        allowBackorder: data.allowBackorder !== undefined ? Boolean(data.allowBackorder) : false,
        status: data.status || 'ACTIVE',
        image: data.image || null,
        sortOrder: data.sortOrder ?? 0
      }
    });

    for (const valId of optionValueIds) {
      await prisma.productVariantOptionValue.create({
        data: {
          variantId: variant.id,
          optionValueId: valId
        }
      });
    }

    return prisma.productVariant.findUnique({
      where: { id: variant.id },
      include: { optionValues: true }
    });
  }

  async updateVariant(id: string, data: UpdateProductVariantDto, optionValueIds?: string[]) {
    const updateData: any = {};
    if (data.sku !== undefined) updateData.sku = data.sku.trim().toUpperCase();
    if (data.price !== undefined) updateData.price = data.price !== null ? Number(data.price) : null;
    if (data.compareAtPrice !== undefined) updateData.compareAtPrice = data.compareAtPrice !== null ? Number(data.compareAtPrice) : null;
    if (data.costPrice !== undefined) updateData.costPrice = data.costPrice !== null ? Number(data.costPrice) : null;
    if (data.stockQuantity !== undefined) updateData.stockQuantity = data.stockQuantity;
    if (data.lowStockThreshold !== undefined) updateData.lowStockThreshold = data.lowStockThreshold;
    if (data.trackInventory !== undefined) updateData.trackInventory = Boolean(data.trackInventory);
    if (data.allowBackorder !== undefined) updateData.allowBackorder = Boolean(data.allowBackorder);
    if (data.status !== undefined) updateData.status = data.status;
    if (data.image !== undefined) updateData.image = data.image;
    if (data.sortOrder !== undefined) updateData.sortOrder = data.sortOrder;

    const variant = await prisma.productVariant.update({
      where: { id },
      data: updateData
    });

    if (optionValueIds && optionValueIds.length > 0) {
      await prisma.productVariantOptionValue.deleteMany({ where: { variantId: id } });
      for (const valId of optionValueIds) {
        await prisma.productVariantOptionValue.create({
          data: {
            variantId: id,
            optionValueId: valId
          }
        });
      }
    }

    return prisma.productVariant.findUnique({
      where: { id: variant.id },
      include: { optionValues: true }
    });
  }

  async deleteVariant(id: string) {
    return prisma.productVariant.delete({ where: { id } });
  }
}

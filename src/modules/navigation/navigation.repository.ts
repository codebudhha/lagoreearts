import { prisma } from '../../database/prisma.ts';
import type {
  NavigationModel,
  NavigationItemModel,
  CreateNavigationDTO,
  UpdateNavigationDTO,
  CreateNavigationItemDTO,
  UpdateNavigationItemDTO,
  NavigationQueryFilter,
  NavigationLocation
} from './navigation.types.ts';

export class NavigationRepository {
  // ==========================================
  // Navigation Methods
  // ==========================================

  static async findById(id: string): Promise<NavigationModel | null> {
    return prisma.navigation.findUnique({
      where: { id },
      include: { items: true }
    });
  }

  static async findBySlug(slug: string): Promise<NavigationModel | null> {
    return prisma.navigation.findUnique({
      where: { slug },
      include: { items: true }
    });
  }

  static async findDefaultByLocation(location: NavigationLocation): Promise<NavigationModel | null> {
    return prisma.navigation.findFirst({
      where: {
        location,
        status: 'ACTIVE',
        isDefault: true
      },
      include: { items: true }
    });
  }

  static async list(filter: NavigationQueryFilter = {}) {
    const page = Math.max(1, Number(filter.page) || 1);
    const limit = Math.min(100, Math.max(1, Number(filter.limit) || 20));
    const skip = (page - 1) * limit;

    const where: any = {};
    if (filter.location) where.location = filter.location;
    if (filter.status) where.status = filter.status;
    if (filter.isDefault !== undefined) {
      where.isDefault = filter.isDefault === true || filter.isDefault === 'true';
    }
    if (filter.search) where.search = filter.search.trim();

    const orderBy: any = {};
    if (filter.sortBy) {
      orderBy[filter.sortBy] = filter.sortOrder?.toLowerCase() === 'asc' ? 'asc' : 'desc';
    } else {
      orderBy.createdAt = 'desc';
    }

    const [items, total] = await Promise.all([
      prisma.navigation.findMany({
        where,
        include: { items: true },
        orderBy,
        skip,
        take: limit
      }),
      prisma.navigation.count({ where })
    ]);

    return {
      items: items || [],
      pagination: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit)
      }
    };
  }

  static async create(data: CreateNavigationDTO & { slug: string }): Promise<NavigationModel> {
    return prisma.navigation.create({
      data: {
        name: data.name,
        slug: data.slug,
        location: data.location || 'HEADER',
        status: data.status || 'ACTIVE',
        isDefault: data.isDefault || false
      },
      include: { items: true }
    });
  }

  static async update(id: string, data: UpdateNavigationDTO): Promise<NavigationModel> {
    return prisma.navigation.update({
      where: { id },
      data,
      include: { items: true }
    });
  }

  static async delete(id: string): Promise<NavigationModel | null> {
    return prisma.navigation.delete({
      where: { id }
    });
  }

  static async clearDefaultByLocation(location: NavigationLocation, excludeId?: string): Promise<void> {
    const where: any = { location };
    if (excludeId) where.NOT = { id: excludeId };
    await prisma.navigation.updateMany({
      where,
      data: { isDefault: false }
    });
  }

  // ==========================================
  // Navigation Item Methods
  // ==========================================

  static async findItemById(id: string): Promise<NavigationItemModel | null> {
    return prisma.navigationItem.findUnique({
      where: { id },
      include: { children: true, parent: true }
    });
  }

  static async findItemsByNavigationId(navigationId: string, isVisibleOnly: boolean = false): Promise<NavigationItemModel[]> {
    const where: any = { navigationId };
    if (isVisibleOnly) where.isVisible = true;

    return prisma.navigationItem.findMany({
      where,
      include: { children: true },
      orderBy: { sortOrder: 'asc' }
    });
  }

  static async countChildren(parentId: string): Promise<number> {
    return prisma.navigationItem.count({
      where: { parentId }
    });
  }

  static async getMaxSortOrder(navigationId: string, parentId?: string | null): Promise<number> {
    const items = await prisma.navigationItem.findMany({
      where: {
        navigationId,
        parentId: parentId || null
      },
      orderBy: { sortOrder: 'desc' },
      take: 1
    });

    if (items.length === 0) return 0;
    return items[0].sortOrder + 1;
  }

  static async createItem(navigationId: string, data: CreateNavigationItemDTO): Promise<NavigationItemModel> {
    const sortOrder = data.sortOrder !== undefined ? data.sortOrder : await this.getMaxSortOrder(navigationId, data.parentId);

    return prisma.navigationItem.create({
      data: {
        navigationId,
        parentId: data.parentId || null,
        label: data.label,
        description: data.description || null,
        targetType: data.targetType || 'NONE',
        targetId: data.targetId || null,
        url: data.url || null,
        displayType: data.displayType || 'LINK',
        openInNewTab: data.openInNewTab || false,
        isVisible: data.isVisible !== undefined ? data.isVisible : true,
        isFeatured: data.isFeatured || false,
        sortOrder
      },
      include: { children: true }
    });
  }

  static async updateItem(id: string, data: UpdateNavigationItemDTO): Promise<NavigationItemModel> {
    return prisma.navigationItem.update({
      where: { id },
      data,
      include: { children: true, parent: true }
    });
  }

  static async deleteItem(id: string): Promise<NavigationItemModel | null> {
    return prisma.navigationItem.delete({
      where: { id }
    });
  }

  static async reorderItems(items: Array<{ id: string; parentId?: string | null; sortOrder: number }>): Promise<void> {
    for (const item of items) {
      await prisma.navigationItem.update({
        where: { id: item.id },
        data: {
          parentId: item.parentId !== undefined ? item.parentId : undefined,
          sortOrder: item.sortOrder
        }
      });
    }
  }
}

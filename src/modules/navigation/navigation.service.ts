import { NavigationRepository } from './navigation.repository.ts';
import { NavigationTargetResolver } from './navigation-target-resolver.ts';
import { prisma } from '../../database/prisma.ts';
import { AuditService } from '../../audit/audit.service.ts';
import { sanitizeText } from './navigation.validator.ts';
import type {
  CreateNavigationDTO,
  UpdateNavigationDTO,
  CreateNavigationItemDTO,
  UpdateNavigationItemDTO,
  NavigationQueryFilter,
  NavigationModel,
  NavigationItemModel,
  ReorderNavigationItemsDTO,
  MoveNavigationItemDTO
} from './navigation.types.ts';

function slugify(text: string): string {
  return text
    .toString()
    .toLowerCase()
    .trim()
    .replace(/[\s_]+/g, '-')
    .replace(/[^\w-]+/g, '')
    .replace(/--+/g, '-')
    .replace(/^-+|-+$/g, '');
}

export class NavigationService {
  // ==========================================
  // Helper: Slug Generator
  // ==========================================

  static async generateUniqueSlug(name: string, excludeId?: string): Promise<string> {
    const baseSlug = slugify(name) || 'navigation';
    let candidate = baseSlug;
    let counter = 1;

    while (true) {
      const existing = await prisma.navigation.findUnique({ where: { slug: candidate } });
      if (!existing || (excludeId && existing.id === excludeId)) {
        return candidate;
      }
      counter++;
      candidate = `${baseSlug}-${counter}`;
    }
  }

  // ==========================================
  // Navigation Operations
  // ==========================================

  static async getNavigationById(id: string): Promise<NavigationModel> {
    const navigation = await NavigationRepository.findById(id);
    if (!navigation) {
      const error: any = new Error('Navigation not found');
      error.statusCode = 404;
      error.code = 'NAVIGATION_NOT_FOUND';
      throw error;
    }
    return navigation;
  }

  static async listNavigations(filter: NavigationQueryFilter = {}) {
    return NavigationRepository.list(filter);
  }

  static async createNavigation(
    dto: CreateNavigationDTO,
    userId?: string,
    ipAddress?: string,
    userAgent?: string
  ): Promise<NavigationModel> {
    let slug = dto.slug ? slugify(dto.slug) : await this.generateUniqueSlug(dto.name);

    const existingSlug = await prisma.navigation.findUnique({ where: { slug } });
    if (existingSlug) {
      const error: any = new Error(`Navigation with slug "${slug}" already exists`);
      error.statusCode = 409;
      error.code = 'NAVIGATION_SLUG_EXISTS';
      throw error;
    }

    const location = dto.location || 'HEADER';
    const status = dto.status || 'ACTIVE';
    const isDefault = dto.isDefault || false;

    if (isDefault && status !== 'ACTIVE') {
      const error: any = new Error('Inactive navigation cannot be set as default');
      error.statusCode = 400;
      error.code = 'NAVIGATION_INACTIVE_CANNOT_BE_DEFAULT';
      throw error;
    }

    if (isDefault) {
      await NavigationRepository.clearDefaultByLocation(location);
    }

    const created = await NavigationRepository.create({
      name: sanitizeText(dto.name),
      slug,
      location,
      status,
      isDefault
    });

    if (userId) {
      AuditService.log({
        adminUserId: userId,
        action: 'NAVIGATION_CREATED',
        module: 'NAVIGATION',
        entityType: 'NAVIGATION',
        entityId: created.id,
        newValues: created,
        ipAddress,
        userAgent
      });
    }

    return created;
  }

  static async updateNavigation(
    id: string,
    dto: UpdateNavigationDTO,
    userId?: string,
    ipAddress?: string,
    userAgent?: string
  ): Promise<NavigationModel> {
    const existing = await this.getNavigationById(id);

    let slug = existing.slug;
    if (dto.slug && dto.slug !== existing.slug) {
      slug = slugify(dto.slug);
      const duplicate = await prisma.navigation.findUnique({ where: { slug } });
      if (duplicate && duplicate.id !== id) {
        const error: any = new Error(`Navigation with slug "${slug}" already exists`);
        error.statusCode = 409;
        error.code = 'NAVIGATION_SLUG_EXISTS';
        throw error;
      }
    }

    const nextLocation = dto.location || existing.location;
    const nextStatus = dto.status || existing.status;
    let nextIsDefault = dto.isDefault !== undefined ? dto.isDefault : existing.isDefault;

    if (nextIsDefault && nextStatus !== 'ACTIVE') {
      if (dto.isDefault === true) {
        const error: any = new Error('Inactive navigation cannot be set as default');
        error.statusCode = 400;
        error.code = 'NAVIGATION_INACTIVE_CANNOT_BE_DEFAULT';
        throw error;
      }
      // If status transitioned to INACTIVE, automatically unset default
      nextIsDefault = false;
    }

    if (nextIsDefault && (!existing.isDefault || nextLocation !== existing.location)) {
      await NavigationRepository.clearDefaultByLocation(nextLocation, id);
    }

    const updated = await NavigationRepository.update(id, {
      name: dto.name ? sanitizeText(dto.name) : undefined,
      slug,
      location: nextLocation,
      status: nextStatus,
      isDefault: nextIsDefault
    });

    if (userId) {
      const isStatusChanged = existing.status !== nextStatus;
      const isDefaultChanged = existing.isDefault !== nextIsDefault;

      let primaryAction = 'NAVIGATION_UPDATED';
      if (isStatusChanged) {
        primaryAction = 'NAVIGATION_STATUS_CHANGED';
      } else if (isDefaultChanged) {
        primaryAction = 'NAVIGATION_DEFAULT_CHANGED';
      }

      AuditService.log({
        adminUserId: userId,
        action: primaryAction,
        module: 'NAVIGATION',
        entityType: 'NAVIGATION',
        entityId: id,
        oldValues: existing,
        newValues: updated,
        ipAddress,
        userAgent
      });
    }

    return updated;
  }

  static async deleteNavigation(
    id: string,
    userId?: string,
    ipAddress?: string,
    userAgent?: string
  ): Promise<NavigationModel | null> {
    const existing = await this.getNavigationById(id);

    if (existing.status === 'ACTIVE' && existing.isDefault) {
      const error: any = new Error('Cannot delete an active default navigation. Please set another navigation as default first.');
      error.statusCode = 409;
      error.code = 'NAVIGATION_DEFAULT_DELETE_FORBIDDEN';
      throw error;
    }

    const deleted = await NavigationRepository.delete(id);

    if (userId) {
      AuditService.log({
        adminUserId: userId,
        action: 'NAVIGATION_DELETED',
        module: 'NAVIGATION',
        entityType: 'NAVIGATION',
        entityId: id,
        oldValues: existing,
        ipAddress,
        userAgent
      });
    }

    return deleted;
  }

  // ==========================================
  // Navigation Item Operations
  // ==========================================

  static async getItemById(id: string): Promise<NavigationItemModel> {
    const item = await NavigationRepository.findItemById(id);
    if (!item) {
      const error: any = new Error('Navigation item not found');
      error.statusCode = 404;
      error.code = 'NAVIGATION_ITEM_NOT_FOUND';
      throw error;
    }
    return item;
  }

  static async getNavigationItems(navigationId: string): Promise<NavigationItemModel[]> {
    await this.getNavigationById(navigationId);
    return NavigationRepository.findItemsByNavigationId(navigationId, false);
  }

  static async createItem(
    navigationId: string,
    dto: CreateNavigationItemDTO,
    userId?: string,
    ipAddress?: string,
    userAgent?: string
  ): Promise<NavigationItemModel> {
    await this.getNavigationById(navigationId);

    if (dto.parentId) {
      const parent = await this.getItemById(dto.parentId);
      if (parent.navigationId !== navigationId) {
        const error: any = new Error('Parent item does not belong to this navigation');
        error.statusCode = 400;
        error.code = 'NAVIGATION_ITEM_PARENT_MISMATCH';
        throw error;
      }
    }

    const targetType = dto.targetType || 'NONE';
    if (dto.targetId) {
      await NavigationTargetResolver.validateTargetEntity(targetType, dto.targetId);
    }

    const created = await NavigationRepository.createItem(navigationId, {
      ...dto,
      label: sanitizeText(dto.label),
      description: dto.description ? sanitizeText(dto.description) : undefined
    });

    if (userId) {
      AuditService.log({
        adminUserId: userId,
        action: 'NAVIGATION_ITEM_CREATED',
        module: 'NAVIGATION',
        entityType: 'NAVIGATION_ITEM',
        entityId: created.id,
        newValues: created,
        ipAddress,
        userAgent
      });
    }

    return created;
  }

  static async updateItem(
    itemId: string,
    dto: UpdateNavigationItemDTO,
    userId?: string,
    ipAddress?: string,
    userAgent?: string
  ): Promise<NavigationItemModel> {
    const existing = await this.getItemById(itemId);

    if (dto.parentId !== undefined && dto.parentId !== null) {
      if (dto.parentId === itemId) {
        const error: any = new Error('A navigation item cannot be its own parent');
        error.statusCode = 400;
        error.code = 'NAVIGATION_ITEM_SELF_PARENT';
        throw error;
      }

      const parent = await this.getItemById(dto.parentId);
      if (parent.navigationId !== existing.navigationId) {
        const error: any = new Error('Parent item does not belong to the same navigation');
        error.statusCode = 400;
        error.code = 'NAVIGATION_ITEM_PARENT_MISMATCH';
        throw error;
      }

      // Circular parent check: walk up ancestor chain from parent
      let currentParentId: string | null | undefined = parent.parentId;
      while (currentParentId) {
        if (currentParentId === itemId) {
          const error: any = new Error('Circular hierarchy detected: Cannot set child as parent');
          error.statusCode = 400;
          error.code = 'NAVIGATION_ITEM_CIRCULAR_PARENT';
          throw error;
        }
        const ancestor = await NavigationRepository.findItemById(currentParentId);
        currentParentId = ancestor?.parentId;
      }
    }

    const targetType = dto.targetType !== undefined ? dto.targetType : existing.targetType;
    const targetId = dto.targetId !== undefined ? dto.targetId : existing.targetId;

    if (targetId && targetType) {
      await NavigationTargetResolver.validateTargetEntity(targetType, targetId);
    }

    const updated = await NavigationRepository.updateItem(itemId, {
      ...dto,
      label: dto.label ? sanitizeText(dto.label) : undefined,
      description: dto.description !== undefined ? (dto.description ? sanitizeText(dto.description) : null) : undefined
    });

    if (userId) {
      let action = 'NAVIGATION_ITEM_UPDATED';
      if (dto.isVisible !== undefined && dto.isVisible !== existing.isVisible) {
        action = 'NAVIGATION_ITEM_VISIBILITY_CHANGED';
      } else if (dto.isFeatured !== undefined && dto.isFeatured !== existing.isFeatured) {
        action = 'NAVIGATION_ITEM_FEATURED_CHANGED';
      } else if (
        (dto.targetType !== undefined && dto.targetType !== existing.targetType) ||
        (dto.targetId !== undefined && dto.targetId !== existing.targetId) ||
        (dto.url !== undefined && dto.url !== existing.url)
      ) {
        action = 'NAVIGATION_ITEM_TARGET_CHANGED';
      }

      AuditService.log({
        adminUserId: userId,
        action,
        module: 'NAVIGATION',
        entityType: 'NAVIGATION_ITEM',
        entityId: itemId,
        oldValues: existing,
        newValues: updated,
        ipAddress,
        userAgent
      });
    }

    return updated;
  }

  static async deleteItem(
    itemId: string,
    userId?: string,
    ipAddress?: string,
    userAgent?: string
  ): Promise<NavigationItemModel | null> {
    const existing = await this.getItemById(itemId);

    const childCount = await NavigationRepository.countChildren(itemId);
    if (childCount > 0) {
      const error: any = new Error(`Cannot delete navigation item because it contains ${childCount} child item(s). Please move or delete children first.`);
      error.statusCode = 409;
      error.code = 'NAVIGATION_ITEM_HAS_CHILDREN';
      throw error;
    }

    const deleted = await NavigationRepository.deleteItem(itemId);

    if (userId) {
      AuditService.log({
        adminUserId: userId,
        action: 'NAVIGATION_ITEM_DELETED',
        module: 'NAVIGATION',
        entityType: 'NAVIGATION_ITEM',
        entityId: itemId,
        oldValues: existing,
        ipAddress,
        userAgent
      });
    }

    return deleted;
  }

  static async reorderItems(
    navigationId: string,
    dto: ReorderNavigationItemsDTO,
    userId?: string,
    ipAddress?: string,
    userAgent?: string
  ): Promise<NavigationItemModel[]> {
    await this.getNavigationById(navigationId);

    // Validate all items in payload belong to this navigation
    for (const item of dto.items) {
      const existing = await this.getItemById(item.id);
      if (existing.navigationId !== navigationId) {
        const error: any = new Error(`Item "${item.id}" does not belong to navigation "${navigationId}"`);
        error.statusCode = 400;
        error.code = 'NAVIGATION_ITEM_MISMATCH';
        throw error;
      }
      if (item.parentId) {
        const parent = await this.getItemById(item.parentId);
        if (parent.navigationId !== navigationId) {
          const error: any = new Error(`Parent item "${item.parentId}" does not belong to navigation "${navigationId}"`);
          error.statusCode = 400;
          error.code = 'NAVIGATION_ITEM_PARENT_MISMATCH';
          throw error;
        }
        if (item.id === item.parentId) {
          const error: any = new Error('Item cannot be its own parent');
          error.statusCode = 400;
          error.code = 'NAVIGATION_ITEM_SELF_PARENT';
          throw error;
        }
      }
    }

    await NavigationRepository.reorderItems(dto.items);

    if (userId) {
      AuditService.log({
        adminUserId: userId,
        action: 'NAVIGATION_ITEM_REORDERED',
        module: 'NAVIGATION',
        entityType: 'NAVIGATION',
        entityId: navigationId,
        newValues: { reorderedItems: dto.items },
        ipAddress,
        userAgent
      });
    }

    return NavigationRepository.findItemsByNavigationId(navigationId, false);
  }

  static async moveItem(
    navigationId: string,
    itemId: string,
    dto: MoveNavigationItemDTO,
    userId?: string,
    ipAddress?: string,
    userAgent?: string
  ): Promise<NavigationItemModel> {
    await this.getNavigationById(navigationId);
    const existing = await this.getItemById(itemId);

    if (existing.navigationId !== navigationId) {
      const error: any = new Error('Item does not belong to the specified navigation');
      error.statusCode = 400;
      error.code = 'NAVIGATION_ITEM_MISMATCH';
      throw error;
    }

    const updated = await this.updateItem(itemId, {
      parentId: dto.parentId !== undefined ? dto.parentId : undefined,
      sortOrder: dto.sortOrder !== undefined ? dto.sortOrder : undefined
    });

    if (userId) {
      AuditService.log({
        adminUserId: userId,
        action: 'NAVIGATION_ITEM_MOVED',
        module: 'NAVIGATION',
        entityType: 'NAVIGATION_ITEM',
        entityId: itemId,
        oldValues: existing,
        newValues: updated,
        ipAddress,
        userAgent
      });
    }

    return updated;
  }
}

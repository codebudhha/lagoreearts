import { CategoriesRepository } from './categories.repository.ts';
import { AuditService } from '../../audit/audit.service.ts';
import type {
  CreateCategoryInput,
  UpdateCategoryInput,
  CategoryFilterQuery,
  CategoryTreeNode,
  BreadcrumbItem
} from './categories.types.ts';

export class CategoriesService {
  /**
   * Helper: Generate URL-safe slug from string
   */
  static slugify(text: string): string {
    return text
      .toLowerCase()
      .trim()
      .replace(/[^\w\s-]/g, '')
      .replace(/[\s_-]+/g, '-')
      .replace(/^-+|-+$/g, '');
  }

  /**
   * Helper: Ensure globally unique slug
   */
  static async resolveUniqueSlug(baseNameOrSlug: string, currentCategoryId?: string): Promise<string> {
    let slug = this.slugify(baseNameOrSlug);
    if (!slug) slug = 'category';

    let candidate = slug;
    let counter = 1;

    while (true) {
      const existing = await CategoriesRepository.findBySlug(candidate);
      if (!existing || (currentCategoryId && existing.id === currentCategoryId)) {
        return candidate;
      }
      counter += 1;
      candidate = `${slug}-${counter}`;
    }
  }

  /**
   * 1. Create Category
   */
  static async createCategory(input: CreateCategoryInput, actorAdminId: string, meta: any = {}) {
    const name = input.name.trim();

    // 1. Verify Parent existence if specified
    if (input.parentId) {
      const parent = await CategoriesRepository.findById(input.parentId);
      if (!parent) {
        throw { status: 400, code: 'INVALID_PARENT', message: 'Specified parent category does not exist' };
      }
    }

    // 2. Prevent duplicate sibling names under same parent
    const siblingWithSameName = await CategoriesRepository.findByNameAndParent(name, input.parentId);
    if (siblingWithSameName) {
      throw {
        status: 400,
        code: 'DUPLICATE_SIBLING_NAME',
        message: `A category named "${name}" already exists under this parent level`
      };
    }

    // 3. Resolve Slug
    const slug = input.slug
      ? this.slugify(input.slug)
      : await this.resolveUniqueSlug(name);

    const existingSlug = await CategoriesRepository.findBySlug(slug);
    if (existingSlug) {
      throw { status: 400, code: 'DUPLICATE_SLUG', message: `Slug "${slug}" is already in use` };
    }

    // 4. Create Category
    const category = await CategoriesRepository.create({
      name,
      slug,
      parentId: input.parentId || null,
      shortDescription: input.shortDescription,
      description: input.description,
      image: input.image,
      imageAlt: input.imageAlt,
      bannerImage: input.bannerImage,
      bannerImageAlt: input.bannerImageAlt,
      status: input.status || 'ACTIVE',
      isFeatured: Boolean(input.isFeatured),
      sortOrder: input.sortOrder !== undefined ? Number(input.sortOrder) : 0,
      metaTitle: input.metaTitle,
      metaDescription: input.metaDescription,
      canonicalUrl: input.canonicalUrl,
      ogTitle: input.ogTitle,
      ogDescription: input.ogDescription,
      ogImage: input.ogImage
    });

    // 5. Audit Log
    AuditService.log({
      adminUserId: actorAdminId,
      action: 'CATEGORY_CREATED',
      module: 'CATEGORIES',
      entityType: 'Category',
      entityId: category?.id,
      newValues: { name: category?.name, slug: category?.slug, parentId: category?.parentId, status: category?.status },
      ipAddress: meta.ipAddress,
      userAgent: meta.userAgent
    });

    return category;
  }

  /**
   * 2. Update Category
   */
  static async updateCategory(id: string, input: UpdateCategoryInput, actorAdminId: string, meta: any = {}) {
    const existing = await CategoriesRepository.findById(id);
    if (!existing) {
      throw { status: 404, code: 'NOT_FOUND', message: 'Category not found' };
    }

    const updates: any = {};

    // 1. Parent validation & Circular Hierarchy check
    if (input.parentId !== undefined) {
      if (input.parentId === id) {
        throw { status: 400, code: 'SELF_PARENT_NOT_ALLOWED', message: 'A category cannot be its own parent' };
      }

      if (input.parentId !== null) {
        const targetParent = await CategoriesRepository.findById(input.parentId);
        if (!targetParent) {
          throw { status: 400, code: 'INVALID_PARENT', message: 'Specified parent category does not exist' };
        }

        // Circular hierarchy check: ensure 'id' is not in targetParent's ancestor chain
        const ancestorsOfTarget = await this.getAncestors(input.parentId);
        const createsCycle = ancestorsOfTarget.some(a => a.id === id);
        if (createsCycle) {
          throw {
            status: 400,
            code: 'CIRCULAR_HIERARCHY',
            message: 'Invalid hierarchy: Cannot assign a category as a child of its own descendant'
          };
        }
      }
      updates.parentId = input.parentId;
    }

    const effectiveParentId = input.parentId !== undefined ? input.parentId : existing.parentId;

    // 2. Name & Sibling Check
    if (input.name) {
      const name = input.name.trim();
      const duplicateSibling = await CategoriesRepository.findByNameAndParent(name, effectiveParentId);
      if (duplicateSibling && duplicateSibling.id !== id) {
        throw {
          status: 400,
          code: 'DUPLICATE_SIBLING_NAME',
          message: `A category named "${name}" already exists under this parent level`
        };
      }
      updates.name = name;
    }

    // 3. Slug update
    if (input.slug) {
      const slug = this.slugify(input.slug);
      const existingSlug = await CategoriesRepository.findBySlug(slug);
      if (existingSlug && existingSlug.id !== id) {
        throw { status: 400, code: 'DUPLICATE_SLUG', message: `Slug "${slug}" is already in use` };
      }
      updates.slug = slug;
    }

    // Other fields
    if (input.shortDescription !== undefined) updates.shortDescription = input.shortDescription;
    if (input.description !== undefined) updates.description = input.description;
    if (input.image !== undefined) updates.image = input.image;
    if (input.imageAlt !== undefined) updates.imageAlt = input.imageAlt;
    if (input.bannerImage !== undefined) updates.bannerImage = input.bannerImage;
    if (input.bannerImageAlt !== undefined) updates.bannerImageAlt = input.bannerImageAlt;
    if (input.status !== undefined) updates.status = input.status;
    if (input.isFeatured !== undefined) updates.isFeatured = Boolean(input.isFeatured);
    if (input.sortOrder !== undefined) updates.sortOrder = Number(input.sortOrder);
    if (input.metaTitle !== undefined) updates.metaTitle = input.metaTitle;
    if (input.metaDescription !== undefined) updates.metaDescription = input.metaDescription;
    if (input.canonicalUrl !== undefined) updates.canonicalUrl = input.canonicalUrl;
    if (input.ogTitle !== undefined) updates.ogTitle = input.ogTitle;
    if (input.ogDescription !== undefined) updates.ogDescription = input.ogDescription;
    if (input.ogImage !== undefined) updates.ogImage = input.ogImage;

    const updated = await CategoriesRepository.update(id, updates);

    // Audit logs
    AuditService.log({
      adminUserId: actorAdminId,
      action: 'CATEGORY_UPDATED',
      module: 'CATEGORIES',
      entityType: 'Category',
      entityId: id,
      oldValues: { name: existing.name, slug: existing.slug, status: existing.status, parentId: existing.parentId },
      newValues: updates,
      ipAddress: meta.ipAddress,
      userAgent: meta.userAgent
    });

    return updated;
  }

  /**
   * 3. Delete Category (With Deletion Safety)
   */
  static async deleteCategory(id: string, actorAdminId: string, meta: any = {}) {
    const category = await CategoriesRepository.findById(id);
    if (!category) {
      throw { status: 404, code: 'NOT_FOUND', message: 'Category not found' };
    }

    // Safety check: Cannot delete if child categories exist
    const childCount = await CategoriesRepository.countChildren(id);
    if (childCount > 0) {
      throw {
        status: 409,
        code: 'CATEGORY_IN_USE',
        message: `This category cannot be deleted because it has ${childCount} child category/categories. Reassign or delete child categories first.`
      };
    }

    await CategoriesRepository.delete(id);

    AuditService.log({
      adminUserId: actorAdminId,
      action: 'CATEGORY_DELETED',
      module: 'CATEGORIES',
      entityType: 'Category',
      entityId: id,
      oldValues: { name: category.name, slug: category.slug },
      ipAddress: meta.ipAddress,
      userAgent: meta.userAgent
    });

    return { success: true, message: 'Category deleted successfully' };
  }

  /**
   * 4. List Categories (Admin Filtered & Paginated)
   */
  static async listAdminCategories(query: CategoryFilterQuery) {
    const page = Math.max(1, Number(query.page) || 1);
    const limit = Math.min(100, Math.max(1, Number(query.limit) || 20));
    const skip = (page - 1) * limit;

    const where: any = {};
    if (query.status) where.status = query.status;
    if (query.parentId !== undefined) where.parentId = query.parentId === 'null' ? null : query.parentId;
    if (query.featured !== undefined) where.isFeatured = query.featured === 'true' || query.featured === true;
    if (query.search) where.search = query.search;

    const orderBy: any = {};
    if (query.sort) {
      const order = query.order?.toLowerCase() === 'desc' ? 'desc' : 'asc';
      orderBy[query.sort] = order;
    } else {
      orderBy.sortOrder = 'asc';
    }

    const { items, total } = await CategoriesRepository.listCategories({
      where,
      orderBy,
      skip,
      take: limit,
      include: { parent: true }
    });

    return {
      items,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit)
      }
    };
  }

  /**
   * 5. Get Category By ID or Slug
   */
  static async getCategoryById(id: string) {
    const category = await CategoriesRepository.findById(id, { parent: true, children: true });
    if (!category) {
      throw { status: 404, code: 'NOT_FOUND', message: 'Category not found' };
    }
    return category;
  }

  static async getCategoryBySlug(slug: string, publicOnly: boolean = false) {
    const category = await CategoriesRepository.findBySlug(slug, { parent: true, children: true });
    if (!category) {
      throw { status: 404, code: 'NOT_FOUND', message: 'Category not found' };
    }
    if (publicOnly && category.status !== 'ACTIVE') {
      throw { status: 404, code: 'NOT_FOUND', message: 'Category not found or inactive' };
    }
    return category;
  }

  /**
   * 6. Category Hierarchy Tree Builder (Unlimited Depth)
   */
  static async getCategoryTree(activeOnly: boolean = false): Promise<CategoryTreeNode[]> {
    const allCategories = await CategoriesRepository.getAllForTree(activeOnly);

    const map = new Map<string, CategoryTreeNode>();
    const roots: CategoryTreeNode[] = [];

    // Initialize map
    for (const cat of allCategories) {
      map.set(cat.id, {
        id: cat.id,
        name: cat.name,
        slug: cat.slug,
        parentId: cat.parentId,
        shortDescription: cat.shortDescription,
        image: cat.image,
        imageAlt: cat.imageAlt,
        bannerImage: cat.bannerImage,
        status: cat.status,
        isFeatured: cat.isFeatured,
        sortOrder: cat.sortOrder,
        children: []
      });
    }

    // Build hierarchy
    for (const cat of allCategories) {
      const node = map.get(cat.id)!;
      if (cat.parentId && map.has(cat.parentId)) {
        map.get(cat.parentId)!.children.push(node);
      } else {
        roots.push(node);
      }
    }

    return roots;
  }

  /**
   * 7. Ancestor Traversal (from Leaf to Root)
   */
  static async getAncestors(categoryId: string): Promise<Array<{ id: string; name: string; slug: string }>> {
    const ancestors: Array<{ id: string; name: string; slug: string }> = [];
    let currentId: string | null = categoryId;
    const visited = new Set<string>();

    while (currentId && !visited.has(currentId)) {
      visited.add(currentId);
      const cat = await CategoriesRepository.findById(currentId);
      if (!cat) break;

      ancestors.push({ id: cat.id, name: cat.name, slug: cat.slug });
      currentId = cat.parentId;
    }

    // Reverse so order is: [Root, Parent, Leaf]
    return ancestors.reverse();
  }

  /**
   * 8. Breadcrumbs (Public / Storefront)
   */
  static async getBreadcrumbs(categoryIdOrSlug: string): Promise<BreadcrumbItem[]> {
    let cat = await CategoriesRepository.findBySlug(categoryIdOrSlug);
    if (!cat) {
      cat = await CategoriesRepository.findById(categoryIdOrSlug);
    }
    if (!cat) {
      throw { status: 404, code: 'NOT_FOUND', message: 'Category not found' };
    }

    const ancestors = await this.getAncestors(cat.id);
    return ancestors.map(a => ({
      id: a.id,
      name: a.name,
      slug: a.slug
    }));
  }

  /**
   * 9. Public Storefront List (ACTIVE only)
   */
  static async listPublicCategories(query: { parentId?: string | null; featured?: boolean } = {}) {
    const where: any = { status: 'ACTIVE' };
    if (query.parentId !== undefined) {
      where.parentId = query.parentId === 'null' ? null : query.parentId;
    }
    if (query.featured) {
      where.isFeatured = true;
    }

    const { items } = await CategoriesRepository.listCategories({
      where,
      orderBy: { sortOrder: 'asc', name: 'asc' }
    });

    return items.map(c => ({
      id: c.id,
      name: c.name,
      slug: c.slug,
      parentId: c.parentId,
      shortDescription: c.shortDescription,
      image: c.image,
      imageAlt: c.imageAlt,
      bannerImage: c.bannerImage,
      isFeatured: c.isFeatured,
      sortOrder: c.sortOrder
    }));
  }
}

import { NavigationRepository } from './navigation.repository.ts';
import { NavigationTargetResolver } from './navigation-target-resolver.ts';
import type {
  NavigationLocation,
  NavigationItemModel,
  PublicNavigationItem,
  PublicNavigationResponse
} from './navigation.types.ts';

export class NavigationPublicService {
  /**
   * Get public navigation by location (HEADER, FOOTER, MOBILE, SECONDARY).
   * Resolves the active default navigation, constructs the hierarchical tree,
   * dynamically verifies referenced entity availability, and derives destination URLs.
   */
  static async getPublicNavigationByLocation(location: NavigationLocation): Promise<PublicNavigationResponse | null> {
    const navigation = await NavigationRepository.findDefaultByLocation(location);
    if (!navigation || navigation.status !== 'ACTIVE') {
      return null;
    }

    const items = await NavigationRepository.findItemsByNavigationId(navigation.id, true);
    const tree = await this.buildPublicTree(items);

    return {
      id: navigation.id,
      name: navigation.name,
      slug: navigation.slug,
      location: navigation.location,
      items: tree
    };
  }

  /**
   * Recursively build the hierarchical public navigation tree.
   * Filters out unavailable entity references and invisible items.
   */
  static async buildPublicTree(items: NavigationItemModel[]): Promise<PublicNavigationItem[]> {
    // 1. Resolve all items' public targets in parallel
    const resolvedItems: Array<{ item: NavigationItemModel; isAvailable: boolean; resolvedUrl: string | null }> = await Promise.all(
      items.map(async item => {
        const { isAvailable, resolvedUrl } = await NavigationTargetResolver.resolvePublicTarget(item);
        return { item, isAvailable, resolvedUrl };
      })
    );

    // 2. Filter out unavailable items and build item map
    const itemMap = new Map<string, PublicNavigationItem>();
    const childIds = new Set<string>();

    for (const { item, isAvailable, resolvedUrl } of resolvedItems) {
      if (!isAvailable) continue;

      const publicItem: PublicNavigationItem = {
        id: item.id,
        label: item.label,
        description: item.description || null,
        targetType: item.targetType,
        targetId: item.targetId || null,
        url: item.url || null,
        resolvedUrl,
        displayType: item.displayType,
        openInNewTab: item.openInNewTab,
        isFeatured: item.isFeatured,
        sortOrder: item.sortOrder,
        children: []
      };

      itemMap.set(item.id, publicItem);
    }

    // 3. Assemble parent-child tree
    const rootItems: PublicNavigationItem[] = [];

    for (const { item, isAvailable } of resolvedItems) {
      if (!isAvailable) continue;

      const current = itemMap.get(item.id)!;
      if (item.parentId && itemMap.has(item.parentId)) {
        const parent = itemMap.get(item.parentId)!;
        parent.children = parent.children || [];
        parent.children.push(current);
        childIds.add(item.id);
      } else {
        rootItems.push(current);
      }
    }

    // 4. Sort siblings recursively by sortOrder
    const sortTree = (nodes: PublicNavigationItem[]): PublicNavigationItem[] => {
      nodes.sort((a, b) => a.sortOrder - b.sortOrder);
      for (const node of nodes) {
        if (node.children && node.children.length > 0) {
          sortTree(node.children);
        } else {
          delete (node as any).children;
        }
      }
      return nodes;
    };

    return sortTree(rootItems);
  }
}

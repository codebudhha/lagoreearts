import { prisma } from '../../database/prisma.ts';
import type { NavigationItemTargetType, NavigationItemModel } from './navigation.types.ts';

export class NavigationTargetResolver {
  /**
   * Validate that the referenced entity exists in the system during Admin CRUD operations.
   */
  static async validateTargetEntity(targetType: NavigationItemTargetType, targetId?: string | null): Promise<void> {
    if (!targetId || targetType === 'NONE' || targetType === 'INTERNAL_URL' || targetType === 'EXTERNAL_URL') {
      return;
    }

    switch (targetType) {
      case 'CATEGORY': {
        const cat = await prisma.category.findUnique({ where: { id: targetId } });
        if (!cat) {
          const error: any = new Error(`Category with ID "${targetId}" not found`);
          error.statusCode = 404;
          error.code = 'CATEGORY_NOT_FOUND';
          throw error;
        }
        break;
      }
      case 'COLLECTION': {
        const coll = await prisma.collection.findUnique({ where: { id: targetId } });
        if (!coll) {
          const error: any = new Error(`Collection with ID "${targetId}" not found`);
          error.statusCode = 404;
          error.code = 'COLLECTION_NOT_FOUND';
          throw error;
        }
        break;
      }
      case 'PRODUCT': {
        const prod = await prisma.product.findUnique({ where: { id: targetId } });
        if (!prod) {
          const error: any = new Error(`Product with ID "${targetId}" not found`);
          error.statusCode = 404;
          error.code = 'PRODUCT_NOT_FOUND';
          throw error;
        }
        break;
      }
      case 'ARTIST': {
        const art = await prisma.artist.findUnique({ where: { id: targetId } });
        if (!art) {
          const error: any = new Error(`Artist with ID "${targetId}" not found`);
          error.statusCode = 404;
          error.code = 'ARTIST_NOT_FOUND';
          throw error;
        }
        break;
      }
      case 'JOURNAL': {
        const post = await prisma.journalPost.findUnique({ where: { id: targetId } });
        if (!post) {
          const error: any = new Error(`Journal post with ID "${targetId}" not found`);
          error.statusCode = 404;
          error.code = 'JOURNAL_POST_NOT_FOUND';
          throw error;
        }
        break;
      }
      case 'LOOKBOOK': {
        const lb = await prisma.lookbook.findUnique({ where: { id: targetId } });
        if (!lb) {
          const error: any = new Error(`Lookbook with ID "${targetId}" not found`);
          error.statusCode = 404;
          error.code = 'LOOKBOOK_NOT_FOUND';
          throw error;
        }
        break;
      }
      case 'SANSKRIT_EDIT': {
        const skt = await prisma.sanskritEditProfile.findUnique({ where: { id: targetId } });
        if (!skt) {
          const error: any = new Error(`Sanskrit Edit profile with ID "${targetId}" not found`);
          error.statusCode = 404;
          error.code = 'SANSKRIT_EDIT_NOT_FOUND';
          throw error;
        }
        break;
      }
      default:
        break;
    }
  }

  /**
   * Resolve public destination URL and availability for storefront navigation rendering.
   * If a referenced entity is inactive or unpublished, returns { isAvailable: false }.
   */
  static async resolvePublicTarget(item: NavigationItemModel): Promise<{ isAvailable: boolean; resolvedUrl: string | null }> {
    switch (item.targetType) {
      case 'NONE':
        return { isAvailable: true, resolvedUrl: null };

      case 'INTERNAL_URL':
        return { isAvailable: true, resolvedUrl: item.url || null };

      case 'EXTERNAL_URL':
        return { isAvailable: true, resolvedUrl: item.url || null };

      case 'CATEGORY': {
        if (!item.targetId) return { isAvailable: false, resolvedUrl: null };
        const cat = await prisma.category.findUnique({ where: { id: item.targetId } });
        if (!cat || cat.status !== 'ACTIVE') {
          return { isAvailable: false, resolvedUrl: null };
        }
        return { isAvailable: true, resolvedUrl: `/categories/${cat.slug}` };
      }

      case 'COLLECTION': {
        if (!item.targetId) return { isAvailable: false, resolvedUrl: null };
        const coll = await prisma.collection.findUnique({ where: { id: item.targetId } });
        if (!coll || coll.status !== 'ACTIVE') {
          return { isAvailable: false, resolvedUrl: null };
        }
        return { isAvailable: true, resolvedUrl: `/collections/${coll.slug}` };
      }

      case 'PRODUCT': {
        if (!item.targetId) return { isAvailable: false, resolvedUrl: null };
        const prod = await prisma.product.findUnique({ where: { id: item.targetId } });
        if (!prod || prod.status !== 'PUBLISHED') {
          return { isAvailable: false, resolvedUrl: null };
        }
        return { isAvailable: true, resolvedUrl: `/products/${prod.slug}` };
      }

      case 'ARTIST': {
        if (!item.targetId) return { isAvailable: false, resolvedUrl: null };
        const art = await prisma.artist.findUnique({ where: { id: item.targetId } });
        if (!art || art.status !== 'ACTIVE') {
          return { isAvailable: false, resolvedUrl: null };
        }
        return { isAvailable: true, resolvedUrl: `/artists/${art.slug}` };
      }

      case 'JOURNAL': {
        if (!item.targetId) return { isAvailable: false, resolvedUrl: null };
        const post = await prisma.journalPost.findUnique({ where: { id: item.targetId } });
        if (!post || post.status !== 'PUBLISHED') {
          return { isAvailable: false, resolvedUrl: null };
        }
        return { isAvailable: true, resolvedUrl: `/journal/${post.slug}` };
      }

      case 'LOOKBOOK': {
        if (!item.targetId) return { isAvailable: false, resolvedUrl: null };
        const lb = await prisma.lookbook.findUnique({ where: { id: item.targetId } });
        if (!lb || lb.status !== 'PUBLISHED') {
          return { isAvailable: false, resolvedUrl: null };
        }
        if (lb.publishedAt && new Date(lb.publishedAt) > new Date()) {
          return { isAvailable: false, resolvedUrl: null };
        }
        return { isAvailable: true, resolvedUrl: `/lookbooks/${lb.slug}` };
      }

      case 'SANSKRIT_EDIT': {
        if (!item.targetId) return { isAvailable: false, resolvedUrl: null };
        const skt = await prisma.sanskritEditProfile.findUnique({ where: { id: item.targetId } });
        if (!skt || !skt.isPublished) {
          return { isAvailable: false, resolvedUrl: null };
        }
        const prod = await prisma.product.findUnique({ where: { id: skt.productId } });
        if (!prod || prod.status !== 'PUBLISHED') {
          return { isAvailable: false, resolvedUrl: null };
        }
        return { isAvailable: true, resolvedUrl: `/sanskrit-edit/${prod.slug}` };
      }

      default:
        return { isAvailable: false, resolvedUrl: null };
    }
  }
}

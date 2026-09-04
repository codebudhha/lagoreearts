/**
 * Module 26: SEO Management System — Public Storefront Resolution Service
 * Lagoree Arts Luxury E-Commerce Backend
 */

import { SeoService } from './seo.service.ts';
import { SeoSerializer } from './seo.serializer.ts';
import { SeoRepository } from './seo.repository.ts';
import type { ResolvedSeoView, LightweightStorefrontSeoView } from './seo.types.ts';

export class SeoPublicService {
  /**
   * Resolve public SEO for a product by slug
   */
  static async getProductSeoBySlug(slug: string): Promise<ResolvedSeoView> {
    const product = await SeoRepository.loadProduct(slug);
    if (!product) {
      throw {
        statusCode: 404,
        status: 404,
        code: 'PRODUCT_NOT_FOUND',
        message: `Product with slug '${slug}' not found`
      };
    }
    const preview = await SeoService.resolveSeo('PRODUCT', product.id);
    return SeoSerializer.serializePublicSeo(preview.resolvedSeo);
  }

  /**
   * Resolve lightweight SEO block for embedded product response
   */
  static async getProductLightweightSeo(productId: string): Promise<LightweightStorefrontSeoView> {
    const preview = await SeoService.resolveSeo('PRODUCT', productId);
    return SeoSerializer.serializeLightweightSeo(preview.resolvedSeo);
  }

  /**
   * Resolve public SEO for a category by slug
   */
  static async getCategorySeoBySlug(slug: string): Promise<ResolvedSeoView> {
    const category = await SeoRepository.loadCategory(slug);
    if (!category) {
      throw {
        statusCode: 404,
        status: 404,
        code: 'CATEGORY_NOT_FOUND',
        message: `Category with slug '${slug}' not found`
      };
    }
    const preview = await SeoService.resolveSeo('CATEGORY', category.id);
    return SeoSerializer.serializePublicSeo(preview.resolvedSeo);
  }

  /**
   * Resolve public SEO for a collection by slug
   */
  static async getCollectionSeoBySlug(slug: string): Promise<ResolvedSeoView> {
    const collection = await SeoRepository.loadCollection(slug);
    if (!collection) {
      throw {
        statusCode: 404,
        status: 404,
        code: 'COLLECTION_NOT_FOUND',
        message: `Collection with slug '${slug}' not found`
      };
    }
    const preview = await SeoService.resolveSeo('COLLECTION', collection.id);
    return SeoSerializer.serializePublicSeo(preview.resolvedSeo);
  }

  /**
   * Resolve public SEO for an artist by slug
   */
  static async getArtistSeoBySlug(slug: string): Promise<ResolvedSeoView> {
    const artist = await SeoRepository.loadArtist(slug);
    if (!artist) {
      throw {
        statusCode: 404,
        status: 404,
        code: 'ARTIST_NOT_FOUND',
        message: `Artist with slug '${slug}' not found`
      };
    }
    const preview = await SeoService.resolveSeo('ARTIST', artist.id);
    return SeoSerializer.serializePublicSeo(preview.resolvedSeo);
  }

  /**
   * Resolve public SEO for a journal article by slug
   */
  static async getJournalPostSeoBySlug(slug: string): Promise<ResolvedSeoView> {
    const post = await SeoRepository.loadJournalPost(slug);
    if (!post) {
      throw {
        statusCode: 404,
        status: 404,
        code: 'JOURNAL_POST_NOT_FOUND',
        message: `Journal article with slug '${slug}' not found`
      };
    }
    const preview = await SeoService.resolveSeo('JOURNAL_POST', post.id);
    return SeoSerializer.serializePublicSeo(preview.resolvedSeo);
  }

  /**
   * Resolve public SEO for a lookbook by slug
   */
  static async getLookbookSeoBySlug(slug: string): Promise<ResolvedSeoView> {
    const lookbook = await SeoRepository.loadLookbook(slug);
    if (!lookbook) {
      throw {
        statusCode: 404,
        status: 404,
        code: 'LOOKBOOK_NOT_FOUND',
        message: `Lookbook with slug '${slug}' not found`
      };
    }
    const preview = await SeoService.resolveSeo('LOOKBOOK', lookbook.id);
    return SeoSerializer.serializePublicSeo(preview.resolvedSeo);
  }

  /**
   * Resolve public SEO for Sanskrit Edit profile by slug
   */
  static async getSanskritEditSeoBySlug(slug: string): Promise<ResolvedSeoView> {
    const profile = await SeoRepository.loadSanskritEdit(slug);
    if (!profile) {
      throw {
        statusCode: 404,
        status: 404,
        code: 'SANSKRIT_PROFILE_NOT_FOUND',
        message: `Sanskrit Edit profile for '${slug}' not found`
      };
    }
    const preview = await SeoService.resolveSeo('SANSKRIT_EDIT', profile.id);
    return SeoSerializer.serializePublicSeo(preview.resolvedSeo);
  }

  /**
   * Resolve public SEO for homepage
   */
  static async getHomepageSeo(): Promise<ResolvedSeoView> {
    const preview = await SeoService.resolveSeo('HOMEPAGE', 'homepage');
    return SeoSerializer.serializePublicSeo(preview.resolvedSeo);
  }

  /**
   * Resolve public SEO for static page
   */
  static async getPageSeo(slug: string): Promise<ResolvedSeoView> {
    const preview = await SeoService.resolveSeo('PAGE', slug);
    return SeoSerializer.serializePublicSeo(preview.resolvedSeo);
  }
}

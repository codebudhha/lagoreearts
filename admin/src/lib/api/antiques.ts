/**
 * Antiques & Collectibles API Client
 * Lagoree Arts Admin Panel
 */

import { apiClient } from './client';

export type AntiqueCondition =
  | 'EXCELLENT'
  | 'VERY_GOOD'
  | 'GOOD'
  | 'FAIR'
  | 'POOR'
  | 'RESTORED'
  | 'FOR_RESTORATION';

export type AntiqueRestorationStatus =
  | 'ORIGINAL'
  | 'PARTIALLY_RESTORED'
  | 'FULLY_RESTORED'
  | 'UNKNOWN';

export type AntiqueAuthenticityStatus =
  | 'UNKNOWN'
  | 'UNVERIFIED'
  | 'VERIFIED';

export type DimensionUnit = 'MM' | 'CM' | 'M' | 'IN' | 'FT';
export type WeightUnit = 'G' | 'KG' | 'OZ' | 'LB';

export interface AntiqueProfile {
  id: string;
  productId: string;
  era?: string | null;
  period?: string | null;
  approximateAgeFrom?: number | null;
  approximateAgeTo?: number | null;
  ageDescription?: string | null;
  origin?: string | null;
  region?: string | null;
  countryOfOrigin?: string | null;
  artistMaker?: string | null;
  attribution?: string | null;
  schoolOrTradition?: string | null;
  material?: string | null;
  technique?: string | null;
  condition?: AntiqueCondition | null;
  conditionNotes?: string | null;
  restorationStatus: AntiqueRestorationStatus;
  restorationNotes?: string | null;
  provenance?: string | null;
  provenanceNotes?: string | null;
  authenticityStatus: AntiqueAuthenticityStatus;
  authenticityNotes?: string | null;
  acquisitionSource?: string | null;
  acquisitionNotes?: string | null;
  dimensionsDescription?: string | null;
  height?: number | null;
  width?: number | null;
  depth?: number | null;
  diameter?: number | null;
  dimensionUnit: DimensionUnit;
  weight?: number | null;
  weightUnit: WeightUnit;
  isOneOfAKind: boolean;
  isCertified: boolean;
  certificateNumber?: string | null;
  certificateIssuer?: string | null;
  certificateDate?: string | null;
  createdAt: string;
  updatedAt: string;
  product?: {
    id: string;
    name: string;
    slug: string;
    sku: string;
    price: number;
    compareAtPrice?: number | null;
    status: string;
    stockQuantity: number;
    allowBackorder: boolean;
    image?: string | null;
    category?: {
      id: string;
      name: string;
      slug: string;
    } | null;
  };
}

export interface AntiqueProductListItem {
  id: string;
  name: string;
  slug: string;
  sku: string;
  price: number;
  compareAtPrice?: number | null;
  status: string;
  stockQuantity: number;
  allowBackorder: boolean;
  isFeatured: boolean;
  image?: string | null;
  createdAt: string;
  updatedAt: string;
  category?: {
    id: string;
    name: string;
    slug: string;
  } | null;
  antiqueProfile?: AntiqueProfile | null;
}

export interface CreateAntiqueProfilePayload {
  era?: string | null;
  period?: string | null;
  approximateAgeFrom?: number | null;
  approximateAgeTo?: number | null;
  ageDescription?: string | null;
  origin?: string | null;
  region?: string | null;
  countryOfOrigin?: string | null;
  artistMaker?: string | null;
  attribution?: string | null;
  schoolOrTradition?: string | null;
  material?: string | null;
  technique?: string | null;
  condition?: AntiqueCondition | null;
  conditionNotes?: string | null;
  restorationStatus?: AntiqueRestorationStatus;
  restorationNotes?: string | null;
  provenance?: string | null;
  provenanceNotes?: string | null;
  authenticityStatus?: AntiqueAuthenticityStatus;
  authenticityNotes?: string | null;
  acquisitionSource?: string | null;
  acquisitionNotes?: string | null;
  dimensionsDescription?: string | null;
  height?: number | null;
  width?: number | null;
  depth?: number | null;
  diameter?: number | null;
  dimensionUnit?: DimensionUnit;
  weight?: number | null;
  weightUnit?: WeightUnit;
  isOneOfAKind?: boolean;
  isCertified?: boolean;
  certificateNumber?: string | null;
  certificateIssuer?: string | null;
  certificateDate?: string | null;
}

export interface UpdateAntiqueProfilePayload {
  era?: string | null;
  period?: string | null;
  approximateAgeFrom?: number | null;
  approximateAgeTo?: number | null;
  ageDescription?: string | null;
  origin?: string | null;
  region?: string | null;
  countryOfOrigin?: string | null;
  artistMaker?: string | null;
  attribution?: string | null;
  schoolOrTradition?: string | null;
  material?: string | null;
  technique?: string | null;
  condition?: AntiqueCondition | null;
  conditionNotes?: string | null;
  restorationStatus?: AntiqueRestorationStatus;
  restorationNotes?: string | null;
  provenance?: string | null;
  provenanceNotes?: string | null;
  authenticityStatus?: AntiqueAuthenticityStatus;
  authenticityNotes?: string | null;
  acquisitionSource?: string | null;
  acquisitionNotes?: string | null;
  dimensionsDescription?: string | null;
  height?: number | null;
  width?: number | null;
  depth?: number | null;
  diameter?: number | null;
  dimensionUnit?: DimensionUnit;
  weight?: number | null;
  weightUnit?: WeightUnit;
  isOneOfAKind?: boolean;
  isCertified?: boolean;
  certificateNumber?: string | null;
  certificateIssuer?: string | null;
  certificateDate?: string | null;
}

export interface ListAntiquesParams {
  page?: number;
  limit?: number;
  search?: string;
  era?: string;
  origin?: string;
  condition?: string;
  restorationStatus?: string;
  authenticityStatus?: string;
  isOneOfAKind?: boolean;
  isCertified?: boolean;
  categoryId?: string;
  status?: string;
  minPrice?: number;
  maxPrice?: number;
  sort?: string;
  order?: 'asc' | 'desc';
}

export interface ListAntiquesResponseData {
  items: AntiqueProductListItem[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

export const antiquesApi = {
  /**
   * List all antique products with profiles
   */
  list: async (params?: ListAntiquesParams): Promise<ListAntiquesResponseData> => {
    const searchParams = new URLSearchParams();
    if (params?.page) searchParams.set('page', String(params.page));
    if (params?.limit) searchParams.set('limit', String(params.limit));
    if (params?.search) searchParams.set('search', params.search);
    if (params?.era) searchParams.set('era', params.era);
    if (params?.origin) searchParams.set('origin', params.origin);
    if (params?.condition) searchParams.set('condition', params.condition);
    if (params?.restorationStatus) searchParams.set('restorationStatus', params.restorationStatus);
    if (params?.authenticityStatus) searchParams.set('authenticityStatus', params.authenticityStatus);
    if (params?.isOneOfAKind !== undefined) searchParams.set('isOneOfAKind', String(params.isOneOfAKind));
    if (params?.isCertified !== undefined) searchParams.set('isCertified', String(params.isCertified));
    if (params?.categoryId) searchParams.set('categoryId', params.categoryId);
    if (params?.status) searchParams.set('status', params.status);
    if (params?.minPrice) searchParams.set('minPrice', String(params.minPrice));
    if (params?.maxPrice) searchParams.set('maxPrice', String(params.maxPrice));
    if (params?.sort) searchParams.set('sort', params.sort);
    if (params?.order) searchParams.set('order', params.order);

    const queryStr = searchParams.toString();
    const endpoint = `/admin/antiques${queryStr ? `?${queryStr}` : ''}`;
    const res = await apiClient<any>(endpoint);
    const data = res.data;

    const items: AntiqueProductListItem[] = Array.isArray(data) ? data : data?.items || [];
    const total = data?.total ?? items.length;
    const page = data?.page ?? (params?.page || 1);
    const limit = data?.limit ?? (params?.limit || 20);
    const totalPages = data?.totalPages ?? Math.max(1, Math.ceil(total / limit));

    return {
      items,
      total,
      page,
      limit,
      totalPages,
    };
  },

  /**
   * Get antique profile for a product
   */
  getProfile: async (productId: string): Promise<AntiqueProfile> => {
    const res = await apiClient<AntiqueProfile>(`/admin/products/${productId}/antique`);
    return res.data;
  },

  /**
   * Create antique profile for a product
   */
  createProfile: async (productId: string, payload: CreateAntiqueProfilePayload): Promise<AntiqueProfile> => {
    const res = await apiClient<AntiqueProfile>(`/admin/products/${productId}/antique`, {
      method: 'POST',
      body: JSON.stringify(payload),
    });
    return res.data;
  },

  /**
   * Update antique profile for a product
   */
  updateProfile: async (productId: string, payload: UpdateAntiqueProfilePayload): Promise<AntiqueProfile> => {
    const res = await apiClient<AntiqueProfile>(`/admin/products/${productId}/antique`, {
      method: 'PATCH',
      body: JSON.stringify(payload),
    });
    return res.data;
  },

  /**
   * Delete antique profile for a product
   */
  deleteProfile: async (productId: string): Promise<{ success: boolean; message: string }> => {
    const res = await apiClient<{ success: boolean; message: string }>(`/admin/products/${productId}/antique`, {
      method: 'DELETE',
    });
    return res.data;
  },
};

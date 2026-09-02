export interface SanskritEditProfile {
  id: string;
  productId: string;
  sanskritTitle: string | null;
  devanagariText: string | null;
  transliteration: string | null;
  translation: string | null;
  meaning: string | null;
  pronunciation: string | null;
  pronunciationGuide: string | null;
  source: string | null;
  sourceReference: string | null;
  theme: string | null;
  context: string | null;
  editorialContent: string | null;
  featuredExcerpt: string | null;
  featuredExcerptTranslation: string | null;
  editorialNote: string | null;
  displayOrder: number;
  isFeatured: boolean;
  isPublished: boolean;
  createdAt: Date;
  updatedAt: Date;
  product?: any;
}

export interface CreateSanskritEditProfileInput {
  sanskritTitle?: string | null;
  devanagariText?: string | null;
  transliteration?: string | null;
  translation?: string | null;
  meaning?: string | null;
  pronunciation?: string | null;
  pronunciationGuide?: string | null;
  source?: string | null;
  sourceReference?: string | null;
  theme?: string | null;
  context?: string | null;
  editorialContent?: string | null;
  featuredExcerpt?: string | null;
  featuredExcerptTranslation?: string | null;
  editorialNote?: string | null;
  displayOrder?: number;
  isFeatured?: boolean;
  isPublished?: boolean;
}

export interface UpdateSanskritEditProfileInput {
  sanskritTitle?: string | null;
  devanagariText?: string | null;
  transliteration?: string | null;
  translation?: string | null;
  meaning?: string | null;
  pronunciation?: string | null;
  pronunciationGuide?: string | null;
  source?: string | null;
  sourceReference?: string | null;
  theme?: string | null;
  context?: string | null;
  editorialContent?: string | null;
  featuredExcerpt?: string | null;
  featuredExcerptTranslation?: string | null;
  editorialNote?: string | null;
  displayOrder?: number;
  isFeatured?: boolean;
  isPublished?: boolean;
}

export interface SanskritEditReorderItem {
  productId: string;
  displayOrder: number;
}

export interface SanskritEditFilterQuery {
  page?: number;
  limit?: number;
  search?: string;
  theme?: string;
  source?: string;
  isFeatured?: boolean;
  isPublished?: boolean;
  categoryId?: string;
  collectionId?: string;
  status?: string;
  sortBy?: 'displayOrder' | 'createdAt' | 'updatedAt' | 'sanskritTitle' | 'name';
  sortOrder?: 'asc' | 'desc';
}

export interface PublicSanskritEditFilterQuery {
  page?: number;
  limit?: number;
  search?: string;
  theme?: string;
  source?: string;
  featured?: boolean;
  categoryId?: string;
  collectionId?: string;
  sortBy?: 'displayOrder' | 'price' | 'createdAt' | 'name';
  sortOrder?: 'asc' | 'desc';
}

export interface PublicSanskritEditProduct {
  id: string;
  name: string;
  slug: string;
  sku: string;
  shortDescription: string | null;
  description: string | null;
  price: number;
  compareAtPrice: number | null;
  status: string;
  productType: string;
  isFeatured: boolean;
  isNewArrival: boolean;
  isBestseller: boolean;
  category: any;
  collections: any[];
  attributes: any[];
  media: any[];
  sanskritEdit: {
    sanskritTitle: string | null;
    devanagariText: string | null;
    transliteration: string | null;
    translation: string | null;
    meaning: string | null;
    pronunciation: string | null;
    pronunciationGuide: string | null;
    source: string | null;
    sourceReference: string | null;
    theme: string | null;
    context: string | null;
    editorialContent: string | null;
    featuredExcerpt: string | null;
    featuredExcerptTranslation: string | null;
    displayOrder: number;
    isFeatured: boolean;
    isPublished: boolean;
  };
}

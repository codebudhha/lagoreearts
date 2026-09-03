export type ArtistStatus = 'ACTIVE' | 'INACTIVE';
export type ArtistRole = 'ARTIST' | 'MAKER' | 'DESIGNER' | 'ATTRIBUTED_TO';
export type ArtistMediaRole = 'PROFILE' | 'GALLERY' | 'OG';

export interface Artist {
  id: string;
  name: string;
  slug: string;
  shortBio?: string | null;
  biography?: string | null;
  birthYear?: number | null;
  deathYear?: number | null;
  nationality?: string | null;
  origin?: string | null;
  tradition?: string | null;
  medium?: string | null;
  specialization?: string | null;
  signature?: string | null;
  status: ArtistStatus;
  isFeatured: boolean;
  sortOrder: number;
  metaTitle?: string | null;
  metaDescription?: string | null;
  metaKeywords?: string | null;
  ogImage?: string | null;
  createdAt: Date;
  updatedAt: Date;
  products?: ProductArtist[];
  media?: ArtistMedia[];
}

export interface ProductArtist {
  productId: string;
  artistId: string;
  role: ArtistRole;
  isPrimary: boolean;
  sortOrder: number;
  createdAt: Date;
  updatedAt: Date;
  product?: any;
  artist?: Artist;
}

export interface ArtistMedia {
  artistId: string;
  mediaId: string;
  role: ArtistMediaRole;
  sortOrder: number;
  isPrimary: boolean;
  createdAt: Date;
  artist?: Artist;
  media?: any;
}

export interface CreateArtistInput {
  name: string;
  slug?: string;
  shortBio?: string | null;
  biography?: string | null;
  birthYear?: number | null;
  deathYear?: number | null;
  nationality?: string | null;
  origin?: string | null;
  tradition?: string | null;
  medium?: string | null;
  specialization?: string | null;
  signature?: string | null;
  status?: ArtistStatus;
  isFeatured?: boolean;
  sortOrder?: number;
  metaTitle?: string | null;
  metaDescription?: string | null;
  metaKeywords?: string | null;
  ogImage?: string | null;
}

export interface UpdateArtistInput {
  name?: string;
  slug?: string;
  shortBio?: string | null;
  biography?: string | null;
  birthYear?: number | null;
  deathYear?: number | null;
  nationality?: string | null;
  origin?: string | null;
  tradition?: string | null;
  medium?: string | null;
  specialization?: string | null;
  signature?: string | null;
  status?: ArtistStatus;
  isFeatured?: boolean;
  sortOrder?: number;
  metaTitle?: string | null;
  metaDescription?: string | null;
  metaKeywords?: string | null;
  ogImage?: string | null;
}

export interface ArtistFilterQuery {
  page?: number;
  limit?: number;
  search?: string;
  status?: ArtistStatus;
  isFeatured?: boolean;
  nationality?: string;
  tradition?: string;
  medium?: string;
  specialization?: string;
  sortBy?: string;
  sortOrder?: 'asc' | 'desc';
}

export interface PublicArtistFilterQuery {
  page?: number;
  limit?: number;
  search?: string;
  featured?: boolean;
  tradition?: string;
  medium?: string;
  specialization?: string;
  sortBy?: string;
  sortOrder?: 'asc' | 'desc';
}

export interface AttachProductArtistInput {
  artistId: string;
  role?: ArtistRole;
  isPrimary?: boolean;
  sortOrder?: number;
}

export interface UpdateProductArtistInput {
  role?: ArtistRole;
  isPrimary?: boolean;
  sortOrder?: number;
}

export interface ProductArtistReorderItem {
  artistId: string;
  role: ArtistRole;
  sortOrder: number;
}

export interface ArtistReorderItem {
  id: string;
  sortOrder: number;
}

export interface AttachArtistMediaInput {
  mediaId: string;
  role?: ArtistMediaRole;
  isPrimary?: boolean;
  sortOrder?: number;
}

export interface ArtistMediaReorderItem {
  mediaId: string;
  role: ArtistMediaRole;
  sortOrder: number;
}

export interface ArtistMigrationSummary {
  scanned: number;
  matched: number;
  alreadyLinked: number;
  ambiguous: number;
  skipped: number;
  details: Array<{
    productId: string;
    productName: string;
    artistMaker: string | null;
    attribution: string | null;
    status: 'MATCHED' | 'ALREADY_LINKED' | 'AMBIGUOUS' | 'SKIPPED';
    artistId?: string;
    artistName?: string;
    reason?: string;
  }>;
}

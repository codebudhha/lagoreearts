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
  era: string | null;
  period: string | null;
  approximateAgeFrom: number | null;
  approximateAgeTo: number | null;
  ageDescription: string | null;
  origin: string | null;
  region: string | null;
  countryOfOrigin: string | null;
  artistMaker: string | null;
  attribution: string | null;
  schoolOrTradition: string | null;
  material: string | null;
  technique: string | null;
  condition: AntiqueCondition | null;
  conditionNotes: string | null;
  restorationStatus: AntiqueRestorationStatus;
  restorationNotes: string | null;
  provenance: string | null;
  provenanceNotes: string | null;
  authenticityStatus: AntiqueAuthenticityStatus;
  authenticityNotes: string | null;
  acquisitionSource: string | null;
  acquisitionNotes: string | null;
  dimensionsDescription: string | null;
  height: number | null;
  width: number | null;
  depth: number | null;
  diameter: number | null;
  dimensionUnit: DimensionUnit;
  weight: number | null;
  weightUnit: WeightUnit;
  isOneOfAKind: boolean;
  isCertified: boolean;
  certificateNumber: string | null;
  certificateIssuer: string | null;
  certificateDate: Date | string | null;
  createdAt: Date;
  updatedAt: Date;
  product?: any;
}

export interface CreateAntiqueProfileInput {
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
  certificateDate?: Date | string | null;
}

export interface UpdateAntiqueProfileInput {
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
  certificateDate?: Date | string | null;
}

export interface AntiqueFilterQuery {
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

export interface PublicAntiqueFilterQuery {
  page?: number;
  limit?: number;
  search?: string;
  era?: string;
  origin?: string;
  condition?: string;
  restorationStatus?: string;
  category?: string;
  collection?: string;
  minPrice?: number;
  maxPrice?: number;
  isOneOfAKind?: boolean;
  sort?: string;
  order?: 'asc' | 'desc';
  [key: string]: any;
}

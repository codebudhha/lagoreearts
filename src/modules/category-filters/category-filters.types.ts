export interface AddCategoryAttributeInput {
  attributeId: string;
  sortOrder?: number;
  isVisible?: boolean;
  isRequired?: boolean;
}

export interface UpdateCategoryAttributeInput {
  sortOrder?: number;
  isVisible?: boolean;
  isRequired?: boolean;
}

export interface CategoryFilterItem {
  id: string;
  name: string;
  slug: string;
  type: string;
  sortOrder: number;
  isRequired: boolean;
  values: Array<{
    id?: string;
    name: string;
    slug: string;
    sortOrder?: number;
  }>;
}

export interface CategoryFilterResponse {
  category: {
    id: string;
    name: string;
    slug: string;
  };
  filters: CategoryFilterItem[];
}

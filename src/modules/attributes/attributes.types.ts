export type AttributeType = 'TEXT' | 'SELECT' | 'MULTI_SELECT' | 'BOOLEAN' | 'NUMBER' | 'RANGE';
export type AttributeStatus = 'ACTIVE' | 'INACTIVE';

export interface CreateAttributeInput {
  name: string;
  slug?: string;
  type?: AttributeType;
  description?: string;
  status?: AttributeStatus;
  isFilterable?: boolean;
  isRequired?: boolean;
  isSystem?: boolean;
  sortOrder?: number;
}

export interface UpdateAttributeInput {
  name?: string;
  slug?: string;
  type?: AttributeType;
  description?: string;
  status?: AttributeStatus;
  isFilterable?: boolean;
  isRequired?: boolean;
  isSystem?: boolean;
  sortOrder?: number;
}

export interface AttributeFilterQuery {
  page?: number;
  limit?: number;
  search?: string;
  status?: AttributeStatus;
  type?: AttributeType;
  filterable?: boolean | string;
  sort?: 'name' | 'sortOrder' | 'createdAt';
  order?: 'asc' | 'desc';
}

export interface CreateAttributeValueInput {
  name: string;
  slug?: string;
  description?: string;
  sortOrder?: number;
  status?: AttributeStatus;
}

export interface UpdateAttributeValueInput {
  name?: string;
  slug?: string;
  description?: string;
  sortOrder?: number;
  status?: AttributeStatus;
}

export interface AttributeValueFilterQuery {
  page?: number;
  limit?: number;
  search?: string;
  status?: AttributeStatus;
  sort?: 'name' | 'sortOrder' | 'createdAt';
  order?: 'asc' | 'desc';
}

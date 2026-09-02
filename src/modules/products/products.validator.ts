import { SchemaValidator } from '../../utils/validator.ts';

export const createProductValidator = new SchemaValidator([
  { field: 'name', required: true, type: 'string', minLength: 2, maxLength: 150 },
  {
    field: 'slug',
    required: false,
    type: 'string',
    custom: (val) => {
      if (!val) return true;
      const validSlugRegex = /^[a-z0-9]+(?:-[a-z0-9]+)*$/;
      return validSlugRegex.test(val) ? true : 'Slug must contain only lowercase letters, numbers, and hyphens';
    }
  },
  { field: 'sku', required: true, type: 'string', minLength: 2, maxLength: 80 },
  { field: 'shortDescription', required: false, type: 'string', maxLength: 255 },
  { field: 'description', required: false, type: 'string' },
  { field: 'status', required: false, type: 'enum', enumValues: ['DRAFT', 'ACTIVE', 'INACTIVE', 'ARCHIVED'] },
  { field: 'productType', required: false, type: 'enum', enumValues: ['SIMPLE', 'VARIABLE'] },
  {
    field: 'price',
    required: true,
    type: 'number',
    custom: (val) => {
      return Number(val) >= 0 ? true : 'Price must be a non-negative number';
    }
  },
  {
    field: 'compareAtPrice',
    required: false,
    type: 'number',
    custom: (val) => {
      if (val === undefined || val === null) return true;
      return Number(val) >= 0 ? true : 'Compare at price must be a non-negative number';
    }
  },
  {
    field: 'costPrice',
    required: false,
    type: 'number',
    custom: (val) => {
      if (val === undefined || val === null) return true;
      return Number(val) >= 0 ? true : 'Cost price must be a non-negative number';
    }
  },
  { field: 'currency', required: false, type: 'string', maxLength: 3 },
  {
    field: 'stockQuantity',
    required: false,
    type: 'number',
    custom: (val) => {
      if (val === undefined || val === null) return true;
      return Number.isInteger(Number(val)) && Number(val) >= 0 ? true : 'Stock quantity must be a non-negative integer';
    }
  },
  {
    field: 'lowStockThreshold',
    required: false,
    type: 'number',
    custom: (val) => {
      if (val === undefined || val === null) return true;
      return Number.isInteger(Number(val)) && Number(val) >= 0 ? true : 'Low stock threshold must be a non-negative integer';
    }
  },
  { field: 'trackInventory', required: false, type: 'boolean' },
  { field: 'allowBackorder', required: false, type: 'boolean' },
  { field: 'isFeatured', required: false, type: 'boolean' },
  { field: 'isNewArrival', required: false, type: 'boolean' },
  { field: 'isBestseller', required: false, type: 'boolean' },
  {
    field: 'sortOrder',
    required: false,
    type: 'number',
    custom: (val) => {
      if (val === undefined || val === null) return true;
      return Number.isInteger(Number(val)) && Number(val) >= 0 ? true : 'Sort order must be a non-negative integer';
    }
  },
  { field: 'categoryId', required: true, type: 'string', minLength: 1 },
  {
    field: 'collectionIds',
    required: false,
    custom: (val) => {
      if (val === undefined || val === null) return true;
      return Array.isArray(val) ? true : 'collectionIds must be an array of strings';
    }
  },
  {
    field: 'attributes',
    required: false,
    custom: (val) => {
      if (val === undefined || val === null) return true;
      return Array.isArray(val) ? true : 'attributes must be an array of attribute assignments';
    }
  },
  { field: 'image', required: false, type: 'string', maxLength: 255 },
  { field: 'thumbnail', required: false, type: 'string', maxLength: 255 },
  { field: 'bannerImage', required: false, type: 'string', maxLength: 255 },
  { field: 'metaTitle', required: false, type: 'string', maxLength: 150 },
  { field: 'metaDescription', required: false, type: 'string' },
  { field: 'canonicalUrl', required: false, type: 'string', maxLength: 255 },
  { field: 'ogTitle', required: false, type: 'string', maxLength: 150 },
  { field: 'ogDescription', required: false, type: 'string' },
  { field: 'ogImage', required: false, type: 'string', maxLength: 255 }
]);

export const updateProductValidator = new SchemaValidator([
  { field: 'name', required: false, type: 'string', minLength: 2, maxLength: 150 },
  {
    field: 'slug',
    required: false,
    type: 'string',
    custom: (val) => {
      if (!val) return true;
      const validSlugRegex = /^[a-z0-9]+(?:-[a-z0-9]+)*$/;
      return validSlugRegex.test(val) ? true : 'Slug must contain only lowercase letters, numbers, and hyphens';
    }
  },
  { field: 'sku', required: false, type: 'string', minLength: 2, maxLength: 80 },
  { field: 'shortDescription', required: false, type: 'string', maxLength: 255 },
  { field: 'description', required: false, type: 'string' },
  { field: 'status', required: false, type: 'enum', enumValues: ['DRAFT', 'ACTIVE', 'INACTIVE', 'ARCHIVED'] },
  { field: 'productType', required: false, type: 'enum', enumValues: ['SIMPLE', 'VARIABLE'] },
  {
    field: 'price',
    required: false,
    type: 'number',
    custom: (val) => {
      if (val === undefined || val === null) return true;
      return Number(val) >= 0 ? true : 'Price must be a non-negative number';
    }
  },
  {
    field: 'compareAtPrice',
    required: false,
    type: 'number',
    custom: (val) => {
      if (val === undefined || val === null) return true;
      return Number(val) >= 0 ? true : 'Compare at price must be a non-negative number';
    }
  },
  {
    field: 'costPrice',
    required: false,
    type: 'number',
    custom: (val) => {
      if (val === undefined || val === null) return true;
      return Number(val) >= 0 ? true : 'Cost price must be a non-negative number';
    }
  },
  { field: 'currency', required: false, type: 'string', maxLength: 3 },
  {
    field: 'stockQuantity',
    required: false,
    type: 'number',
    custom: (val) => {
      if (val === undefined || val === null) return true;
      return Number.isInteger(Number(val)) && Number(val) >= 0 ? true : 'Stock quantity must be a non-negative integer';
    }
  },
  {
    field: 'lowStockThreshold',
    required: false,
    type: 'number',
    custom: (val) => {
      if (val === undefined || val === null) return true;
      return Number.isInteger(Number(val)) && Number(val) >= 0 ? true : 'Low stock threshold must be a non-negative integer';
    }
  },
  { field: 'trackInventory', required: false, type: 'boolean' },
  { field: 'allowBackorder', required: false, type: 'boolean' },
  { field: 'isFeatured', required: false, type: 'boolean' },
  { field: 'isNewArrival', required: false, type: 'boolean' },
  { field: 'isBestseller', required: false, type: 'boolean' },
  {
    field: 'sortOrder',
    required: false,
    type: 'number',
    custom: (val) => {
      if (val === undefined || val === null) return true;
      return Number.isInteger(Number(val)) && Number(val) >= 0 ? true : 'Sort order must be a non-negative integer';
    }
  },
  { field: 'categoryId', required: false, type: 'string', minLength: 1 },
  {
    field: 'collectionIds',
    required: false,
    custom: (val) => {
      if (val === undefined || val === null) return true;
      return Array.isArray(val) ? true : 'collectionIds must be an array of strings';
    }
  },
  {
    field: 'attributes',
    required: false,
    custom: (val) => {
      if (val === undefined || val === null) return true;
      return Array.isArray(val) ? true : 'attributes must be an array of attribute assignments';
    }
  },
  { field: 'image', required: false, type: 'string', maxLength: 255 },
  { field: 'thumbnail', required: false, type: 'string', maxLength: 255 },
  { field: 'bannerImage', required: false, type: 'string', maxLength: 255 },
  { field: 'metaTitle', required: false, type: 'string', maxLength: 150 },
  { field: 'metaDescription', required: false, type: 'string' },
  { field: 'canonicalUrl', required: false, type: 'string', maxLength: 255 },
  { field: 'ogTitle', required: false, type: 'string', maxLength: 150 },
  { field: 'ogDescription', required: false, type: 'string' },
  { field: 'ogImage', required: false, type: 'string', maxLength: 255 }
]);

export const assignCollectionsValidator = new SchemaValidator([
  {
    field: 'collectionIds',
    required: true,
    custom: (val) => {
      return Array.isArray(val) ? true : 'collectionIds must be an array of strings';
    }
  }
]);

export const assignAttributesValidator = new SchemaValidator([
  {
    field: 'attributes',
    required: true,
    custom: (val) => {
      return Array.isArray(val) ? true : 'attributes must be an array of attribute assignments';
    }
  }
]);

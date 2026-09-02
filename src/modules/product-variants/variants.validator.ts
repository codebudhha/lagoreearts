import { SchemaValidator } from '../../utils/validator.ts';

const slugCustomValidator = (val: any) => {
  if (!val) return true;
  const validSlugRegex = /^[a-z0-9]+(?:-[a-z0-9]+)*$/;
  return validSlugRegex.test(val) ? true : 'Slug must contain only lowercase letters, numbers, and hyphens';
};

export const createProductOptionValidator = new SchemaValidator([
  { field: 'name', required: true, type: 'string', minLength: 1, maxLength: 100 },
  { field: 'slug', required: false, type: 'string', custom: slugCustomValidator },
  {
    field: 'sortOrder',
    required: false,
    type: 'number',
    custom: (val) => {
      if (val === undefined || val === null) return true;
      return Number(val) >= 0 ? true : 'sortOrder must be greater than or equal to 0';
    }
  }
]);

export const updateProductOptionValidator = new SchemaValidator([
  { field: 'name', required: false, type: 'string', minLength: 1, maxLength: 100 },
  { field: 'slug', required: false, type: 'string', custom: slugCustomValidator },
  {
    field: 'sortOrder',
    required: false,
    type: 'number',
    custom: (val) => {
      if (val === undefined || val === null) return true;
      return Number(val) >= 0 ? true : 'sortOrder must be greater than or equal to 0';
    }
  }
]);

export const createProductOptionValueValidator = new SchemaValidator([
  { field: 'value', required: true, type: 'string', minLength: 1, maxLength: 100 },
  { field: 'slug', required: false, type: 'string', custom: slugCustomValidator },
  {
    field: 'sortOrder',
    required: false,
    type: 'number',
    custom: (val) => {
      if (val === undefined || val === null) return true;
      return Number(val) >= 0 ? true : 'sortOrder must be greater than or equal to 0';
    }
  }
]);

export const updateProductOptionValueValidator = new SchemaValidator([
  { field: 'value', required: false, type: 'string', minLength: 1, maxLength: 100 },
  { field: 'slug', required: false, type: 'string', custom: slugCustomValidator },
  {
    field: 'sortOrder',
    required: false,
    type: 'number',
    custom: (val) => {
      if (val === undefined || val === null) return true;
      return Number(val) >= 0 ? true : 'sortOrder must be greater than or equal to 0';
    }
  }
]);

export const createVariantValidator = new SchemaValidator([
  { field: 'sku', required: true, type: 'string', minLength: 2, maxLength: 100 },
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
  { field: 'status', required: false, type: 'enum', enumValues: ['ACTIVE', 'INACTIVE', 'ARCHIVED'] },
  { field: 'image', required: false, type: 'string' },
  {
    field: 'sortOrder',
    required: false,
    type: 'number',
    custom: (val) => {
      if (val === undefined || val === null) return true;
      return Number(val) >= 0 ? true : 'sortOrder must be greater than or equal to 0';
    }
  },
  {
    field: 'optionValues',
    required: true,
    type: 'array',
    custom: (val) => {
      if (!Array.isArray(val) || val.length === 0) {
        return 'optionValues must be a non-empty array';
      }
      for (const item of val) {
        if (!item || typeof item !== 'object' || !item.optionValueId) {
          return 'Each option value entry must specify optionValueId';
        }
      }
      return true;
    }
  }
]);

export const updateVariantValidator = new SchemaValidator([
  { field: 'sku', required: false, type: 'string', minLength: 2, maxLength: 100 },
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
  { field: 'status', required: false, type: 'enum', enumValues: ['ACTIVE', 'INACTIVE', 'ARCHIVED'] },
  { field: 'image', required: false, type: 'string' },
  {
    field: 'sortOrder',
    required: false,
    type: 'number',
    custom: (val) => {
      if (val === undefined || val === null) return true;
      return Number(val) >= 0 ? true : 'sortOrder must be greater than or equal to 0';
    }
  },
  {
    field: 'optionValues',
    required: false,
    type: 'array',
    custom: (val) => {
      if (val === undefined || val === null) return true;
      if (!Array.isArray(val) || val.length === 0) {
        return 'optionValues must be a non-empty array';
      }
      for (const item of val) {
        if (!item || typeof item !== 'object' || !item.optionValueId) {
          return 'Each option value entry must specify optionValueId';
        }
      }
      return true;
    }
  }
]);

export const updateVariantStatusValidator = new SchemaValidator([
  { field: 'status', required: true, type: 'enum', enumValues: ['ACTIVE', 'INACTIVE', 'ARCHIVED'] }
]);

export const updateVariantSortValidator = new SchemaValidator([
  {
    field: 'sortOrder',
    required: true,
    type: 'number',
    custom: (val) => Number(val) >= 0 ? true : 'sortOrder must be greater than or equal to 0'
  }
]);

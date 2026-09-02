import { SchemaValidator } from '../../utils/validator.ts';

export const createCategoryValidator = new SchemaValidator([
  { field: 'name', required: true, type: 'string', minLength: 2, maxLength: 100 },
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
  { field: 'parentId', required: false },
  { field: 'status', required: false, type: 'enum', enumValues: ['ACTIVE', 'INACTIVE'] },
  { field: 'isFeatured', required: false, type: 'boolean' },
  { field: 'sortOrder', required: false, type: 'number' }
]);

export const updateCategoryValidator = new SchemaValidator([
  { field: 'name', required: false, type: 'string', minLength: 2, maxLength: 100 },
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
  { field: 'parentId', required: false },
  { field: 'status', required: false, type: 'enum', enumValues: ['ACTIVE', 'INACTIVE'] },
  { field: 'isFeatured', required: false, type: 'boolean' },
  { field: 'sortOrder', required: false, type: 'number' }
]);

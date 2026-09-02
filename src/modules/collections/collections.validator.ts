import { SchemaValidator } from '../../utils/validator.ts';

export const createCollectionValidator = new SchemaValidator([
  { field: 'name', required: true, type: 'string', minLength: 2, maxLength: 120 },
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
  { field: 'shortDescription', required: false, type: 'string', maxLength: 255 },
  { field: 'description', required: false, type: 'string' },
  { field: 'image', required: false, type: 'string', maxLength: 255 },
  { field: 'bannerImage', required: false, type: 'string', maxLength: 255 },
  { field: 'heroTitle', required: false, type: 'string', maxLength: 150 },
  { field: 'heroDescription', required: false, type: 'string' },
  { field: 'status', required: false, type: 'enum', enumValues: ['ACTIVE', 'INACTIVE'] },
  { field: 'type', required: false, type: 'enum', enumValues: ['MANUAL', 'SYSTEM'] },
  { field: 'isFeatured', required: false, type: 'boolean' },
  {
    field: 'sortOrder',
    required: false,
    type: 'number',
    custom: (val) => {
      if (val === undefined || val === null) return true;
      return Number.isInteger(Number(val)) && Number(val) >= 0 ? true : 'Sort order must be a non-negative integer';
    }
  },
  { field: 'metaTitle', required: false, type: 'string', maxLength: 150 },
  { field: 'metaDescription', required: false, type: 'string' },
  { field: 'canonicalUrl', required: false, type: 'string', maxLength: 255 },
  { field: 'ogTitle', required: false, type: 'string', maxLength: 150 },
  { field: 'ogDescription', required: false, type: 'string' },
  { field: 'ogImage', required: false, type: 'string', maxLength: 255 }
]);

export const updateCollectionValidator = new SchemaValidator([
  { field: 'name', required: false, type: 'string', minLength: 2, maxLength: 120 },
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
  { field: 'shortDescription', required: false, type: 'string', maxLength: 255 },
  { field: 'description', required: false, type: 'string' },
  { field: 'image', required: false, type: 'string', maxLength: 255 },
  { field: 'bannerImage', required: false, type: 'string', maxLength: 255 },
  { field: 'heroTitle', required: false, type: 'string', maxLength: 150 },
  { field: 'heroDescription', required: false, type: 'string' },
  { field: 'status', required: false, type: 'enum', enumValues: ['ACTIVE', 'INACTIVE'] },
  { field: 'type', required: false, type: 'enum', enumValues: ['MANUAL', 'SYSTEM'] },
  { field: 'isFeatured', required: false, type: 'boolean' },
  {
    field: 'sortOrder',
    required: false,
    type: 'number',
    custom: (val) => {
      if (val === undefined || val === null) return true;
      return Number.isInteger(Number(val)) && Number(val) >= 0 ? true : 'Sort order must be a non-negative integer';
    }
  },
  { field: 'metaTitle', required: false, type: 'string', maxLength: 150 },
  { field: 'metaDescription', required: false, type: 'string' },
  { field: 'canonicalUrl', required: false, type: 'string', maxLength: 255 },
  { field: 'ogTitle', required: false, type: 'string', maxLength: 150 },
  { field: 'ogDescription', required: false, type: 'string' },
  { field: 'ogImage', required: false, type: 'string', maxLength: 255 }
]);

export const updateSortOrderValidator = new SchemaValidator([
  {
    field: 'sortOrder',
    required: true,
    type: 'number',
    custom: (val) => {
      return Number.isInteger(Number(val)) && Number(val) >= 0 ? true : 'Sort order must be a non-negative integer';
    }
  }
]);

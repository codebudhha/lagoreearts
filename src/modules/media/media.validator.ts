import { SchemaValidator } from '../../utils/validator.ts';

export const createFolderValidator = new SchemaValidator([
  { field: 'name', required: true, type: 'string', minLength: 1, maxLength: 100 },
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
  { field: 'parentId', required: false, type: 'string' }
]);

export const updateFolderValidator = new SchemaValidator([
  { field: 'name', required: false, type: 'string', minLength: 1, maxLength: 100 },
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
  { field: 'parentId', required: false, type: 'string' }
]);

export const updateMediaValidator = new SchemaValidator([
  { field: 'title', required: false, type: 'string', maxLength: 255 },
  { field: 'altText', required: false, type: 'string', maxLength: 255 },
  { field: 'caption', required: false, type: 'string' },
  { field: 'folderId', required: false, type: 'string' }
]);

export const attachEntityMediaValidator = new SchemaValidator([
  { field: 'mediaId', required: true, type: 'string' },
  {
    field: 'sortOrder',
    required: false,
    type: 'number',
    custom: (val) => {
      if (val === undefined || val === null) return true;
      return Number.isInteger(Number(val)) && Number(val) >= 0 ? true : 'Sort order must be a non-negative integer';
    }
  },
  { field: 'isPrimary', required: false, type: 'boolean' },
  {
    field: 'role',
    required: false,
    type: 'enum',
    enumValues: ['PRIMARY', 'GALLERY', 'THUMBNAIL', 'BANNER', 'OG']
  }
]);

export const reorderEntityMediaValidator = new SchemaValidator([
  {
    field: 'items',
    required: true,
    type: 'array',
    custom: (val) => {
      if (!Array.isArray(val) || val.length === 0) {
        return 'Items must be a non-empty array of media orders';
      }
      for (const item of val) {
        if (!item || typeof item.mediaId !== 'string' || typeof item.sortOrder !== 'number') {
          return 'Each item must have a mediaId string and sortOrder number';
        }
      }
      return true;
    }
  }
]);

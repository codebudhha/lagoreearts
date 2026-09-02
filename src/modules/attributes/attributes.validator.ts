import { SchemaValidator } from '../../utils/validator.ts';

const VALID_TYPES = ['TEXT', 'SELECT', 'MULTI_SELECT', 'BOOLEAN', 'NUMBER', 'RANGE'];

export const createAttributeValidator = new SchemaValidator([
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
  { field: 'type', required: false, type: 'enum', enumValues: VALID_TYPES },
  { field: 'status', required: false, type: 'enum', enumValues: ['ACTIVE', 'INACTIVE'] },
  { field: 'isFilterable', required: false, type: 'boolean' },
  { field: 'isRequired', required: false, type: 'boolean' },
  { field: 'sortOrder', required: false, type: 'number' }
]);

export const updateAttributeValidator = new SchemaValidator([
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
  { field: 'type', required: false, type: 'enum', enumValues: VALID_TYPES },
  { field: 'status', required: false, type: 'enum', enumValues: ['ACTIVE', 'INACTIVE'] },
  { field: 'isFilterable', required: false, type: 'boolean' },
  { field: 'isRequired', required: false, type: 'boolean' },
  { field: 'sortOrder', required: false, type: 'number' }
]);

export const createAttributeValueValidator = new SchemaValidator([
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
  { field: 'status', required: false, type: 'enum', enumValues: ['ACTIVE', 'INACTIVE'] },
  { field: 'sortOrder', required: false, type: 'number' }
]);

export const updateAttributeValueValidator = new SchemaValidator([
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
  { field: 'status', required: false, type: 'enum', enumValues: ['ACTIVE', 'INACTIVE'] },
  { field: 'sortOrder', required: false, type: 'number' }
]);

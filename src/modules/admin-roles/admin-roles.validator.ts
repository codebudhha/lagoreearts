import { SchemaValidator } from '../../utils/validator.ts';

export const createRoleValidator = new SchemaValidator([
  { field: 'name', required: true, type: 'string', minLength: 2, maxLength: 50 },
  { field: 'slug', required: true, type: 'string', minLength: 2, maxLength: 50 },
  { field: 'description', required: false, type: 'string' },
  { field: 'permissionIds', required: false, type: 'array' }
]);

export const updateRoleValidator = new SchemaValidator([
  { field: 'name', required: false, type: 'string', minLength: 2, maxLength: 50 },
  { field: 'description', required: false, type: 'string' },
  { field: 'permissionIds', required: false, type: 'array' }
]);

import { SchemaValidator } from '../../utils/validator.ts';

export const addCategoryAttributeValidator = new SchemaValidator([
  { field: 'attributeId', required: true, type: 'string' },
  { field: 'sortOrder', required: false, type: 'number' },
  { field: 'isVisible', required: false, type: 'boolean' },
  { field: 'isRequired', required: false, type: 'boolean' }
]);

export const updateCategoryAttributeValidator = new SchemaValidator([
  { field: 'sortOrder', required: false, type: 'number' },
  { field: 'isVisible', required: false, type: 'boolean' },
  { field: 'isRequired', required: false, type: 'boolean' }
]);
